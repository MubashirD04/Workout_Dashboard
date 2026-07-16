// convex/chat.ts
import { query, mutation, action, internalQuery, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { getAuthenticatedUser } from "./lib/auth";

declare const process: { env: Record<string, string | undefined> };

export const getLatestChunkIndex = query({
  args: {},
  handler: async (ctx) => {
    const latest = await ctx.db.query("bookKnowledge").order("desc").first();
    return latest ? { book_title: latest.book_title, chunk_index: latest.chunk_index } : null;
  },
});

export const getConversations = query({
  args: {},
  handler: async (ctx) => {
    const me = await getAuthenticatedUser(ctx);

    const convos = await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", me._id))
      .order("desc")
      .take(20);

    return Promise.all(
      convos.map(async (c) => {
        const firstMessage = await (ctx.db
          .query("messages") as any)
          .withIndex("by_conversation_and_time", (q: any) => q.eq("conversationId", c._id))
          .first();
        return { ...c, first_message: firstMessage?.content };
      })
    );
  },
});

export const clearChunks = mutation({
  args: {},
  handler: async (ctx) => {
    const me = await getAuthenticatedUser(ctx);
    if (me.role !== "admin") throw new Error("Admin only.");
    await ctx.scheduler.runAfter(0, internal.chat.clearChunksBatch, {});
    return { started: true };
  },
});

export const clearChunksBatch = internalMutation({
  args: {},
  handler: async (ctx) => {
    const batchSize = 100;
    const chunks = await ctx.db.query("bookKnowledge").take(batchSize);
    for (const c of chunks) await ctx.db.delete(c._id);

    if (chunks.length === batchSize) {
      await ctx.scheduler.runAfter(0, internal.chat.clearChunksBatch, {});
    }
  },
});

export const addChunk = mutation({
  args: {
    book_title: v.string(),
    chunk_index: v.number(),
    content: v.string(),
    embedding: v.array(v.float64()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("bookKnowledge", args);
  },
});

export const addChunks = mutation({
  args: {
    chunks: v.array(
      v.object({
        book_title: v.string(),
        chunk_index: v.number(),
        content: v.string(),
        embedding: v.array(v.float64()),
      })
    ),
  },
  handler: async (ctx, args) => {
    for (const chunk of args.chunks) {
      await ctx.db.insert("bookKnowledge", chunk);
    }
  },
});

export const getConversation = query({
  args: { id: v.id("conversations") },
  handler: async (ctx, args) => {
    const me = await getAuthenticatedUser(ctx);
    const convo = await ctx.db.get(args.id);
    if (!convo) return [];
    if (convo.userId !== me._id && me.role !== "admin") {
      throw new Error("Forbidden.");
    }
    return await (ctx.db
      .query("messages") as any)
      .withIndex("by_conversation_and_time", (q: any) => q.eq("conversationId", args.id))
      .collect();
  },
});

export const createConversation = mutation({
  args: {},
  handler: async (ctx) => {
    const me = await getAuthenticatedUser(ctx);
    const now = Date.now();
    return await ctx.db.insert("conversations", {
      userId: me._id,
      created_at: now,
      updated_at: now,
    });
  },
});

export const deleteConversation = mutation({
  args: { id: v.id("conversations") },
  handler: async (ctx, args) => {
    const me = await getAuthenticatedUser(ctx);
    const convo = await ctx.db.get(args.id);
    if (!convo) throw new Error("Conversation not found.");
    if (convo.userId !== me._id && me.role !== "admin") {
      throw new Error("Forbidden.");
    }

    await ctx.db.delete(args.id);
    await ctx.scheduler.runAfter(0, internal.chat.deleteMessagesBatch, {
      conversationId: args.id,
    });
  },
});

export const deleteMessagesBatch = internalMutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const batch = await (ctx.db.query("messages") as any)
      .withIndex("by_creation_time", (q: any) => q.eq("conversationId", args.conversationId))
      .take(100);
    for (const m of batch) await ctx.db.delete(m._id);
    if (batch.length === 100) {
      await ctx.scheduler.runAfter(0, internal.chat.deleteMessagesBatch, args);
    }
  },
});

export const addMessage = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    content: v.string(),
    sources: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      role: args.role,
      content: args.content,
      sources: args.sources,
      created_at: now,
    });
    await ctx.db.patch(args.conversationId, { updated_at: now });
  },
});

// SECURITY: Added permission check for actions
export const validateActionAccess = internalQuery({
  args: {
    tokenIdentifier: v.string(),
    targetUserId: v.id("users"),
    conversationId: v.optional(v.id("conversations")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
      .unique();
    if (!user) throw new Error("User not found.");

    if (args.conversationId) {
      const convo = await ctx.db.get(args.conversationId);
      if (!convo) throw new Error("Conversation not found.");
      if (convo.userId !== user._id && user.role !== "admin") {
        throw new Error("Forbidden: you do not own this conversation.");
      }
    }

    // Role-based access to target user data
    if (user.role === "admin") return { userId: args.targetUserId };
    if (user.role === "trainer") {
      const target = await ctx.db.get(args.targetUserId);
      if (!target || target.trainerId !== user._id) {
        throw new Error("Forbidden: this client is not assigned to you.");
      }
      return { userId: args.targetUserId };
    }

    // Client
    if (user._id !== args.targetUserId) {
      throw new Error("Forbidden: you can only access your own data.");
    }

    return { userId: args.targetUserId };
  },
});

export const getFitnessContext = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const workouts = await ctx.db
      .query("workouts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(5);

    const cardio = await ctx.db
      .query("cardioLogs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(5);

    const tmpMetrics = await ctx.db
      .query("bodyMetrics")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(1);

    const latestMetrics = tmpMetrics.length > 0 ? tmpMetrics[0] : null;
    let summary = "User Fitness Data:\n\n";

    if (latestMetrics) {
      summary += `Latest Metrics (${latestMetrics.date}):\n- Weight: ${latestMetrics.weight}kg\n`;
      if (latestMetrics.body_fat_perc)
        summary += `- Body Fat: ${latestMetrics.body_fat_perc}%\n`;
      summary += "\n";
    }

    if (workouts.length > 0) {
      summary += "Recent Workouts:\n";
      workouts.forEach((w, i) => {
        summary += `${i + 1}. ${w.date}: `;
        summary += w.exercises.map((e) => e.exercise_name).join(", ") || "No exercises";
        if (w.duration) summary += ` (${w.duration} min)`;
        if (w.notes) summary += `\n   Notes: ${w.notes}`; // Included for potential injection check
        summary += "\n";
      });
      summary += "\n";
    }

    if (cardio.length > 0) {
      summary += "Recent Cardio:\n";
      cardio.forEach((c, i) => {
        summary += `${i + 1}. ${c.date}: ${c.type} - ${c.distance}km in ${c.duration} min\n`;
        if (c.notes) summary += `   Notes: ${c.notes}\n`;
      });
    }

    if (!latestMetrics && workouts.length === 0 && cardio.length === 0) {
      summary = "No fitness data available yet.";
    }

    return { summary };
  },
});

export const getConversationHistory = internalQuery({
  args: { conversationId: v.id("conversations"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const recent = await ctx.db
      .query("messages")
      .withIndex("by_conversation_and_time", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("desc")
      .take(args.limit ?? 8);

    return recent.reverse().map((m) => ({ role: m.role, content: m.content }));
  },
});

export const getChunks = internalQuery({
  args: { ids: v.array(v.id("bookKnowledge")) },
  handler: async (ctx, args) => {
    const chunks = [];
    for (const id of args.ids) {
      const chunk = await ctx.db.get(id);
      if (chunk) chunks.push(chunk);
    }
    return chunks;
  },
});

export const askQuestion = action({
  args: {
    question: v.string(),
    conversationId: v.optional(v.id("conversations")),
    // Trainer/admin can ask questions on behalf of a client context
    targetUserId: v.id("users"),
  },
  handler: async (ctx, args): Promise<any> => {
    // SECURITY: Authenticate the action caller
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // SECURITY: Validate that the caller has permission to access targetUserId
    await ctx.runQuery(internal.chat.validateActionAccess, {
      tokenIdentifier: identity.tokenIdentifier,
      targetUserId: args.targetUserId,
      conversationId: args.conversationId,
    });

    const hfToken = process.env.HF_TOKEN;
    if (!hfToken) throw new Error("HF_TOKEN is not set in Convex environment");

    const { HfInference } = await import("@huggingface/inference");
    const hf = new HfInference(hfToken);

    // HF free-tier models go cold and return 500 between requests.
    // Retry up to 3 times with increasing delays before giving up.
    let embeddingValues: number[] | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const output = await hf.featureExtraction({
          model: "sentence-transformers/all-MiniLM-L6-v2",
          inputs: args.question,
        });
        embeddingValues = Array.isArray((output as any)[0])
          ? (output as number[][]).flat()
          : (output as number[]);
        break;
      } catch {
        if (attempt < 2) {
          // Wait 5s, then 10s before the final attempt
          await new Promise((r) => setTimeout(r, 5000 * (attempt + 1)));
        }
      }
    }

    // Graceful degradation: if HF is unavailable after retries, skip RAG
    // and answer from the user's personal fitness data alone.
    let chunks: any[] = [];
    if (embeddingValues && embeddingValues.length > 0) {
      const results = await ctx.vectorSearch("bookKnowledge", "by_embedding", {
        vector: embeddingValues,
        limit: 5,
      });
      const relevantIds = results.filter((r) => r._score > 0.4).map((r) => r._id);
      chunks = await ctx.runQuery(internal.chat.getChunks, { ids: relevantIds }) as any;
    }

    const fitnessContext = await ctx.runQuery(internal.chat.getFitnessContext, {
      userId: args.targetUserId,
    });

    let historyContext = "";
    if (args.conversationId) {
      const history = await ctx.runQuery(internal.chat.getConversationHistory, {
        conversationId: args.conversationId,
      });
      historyContext = history
        .map((msg: any) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
        .join("\n");
    }

    const bookContext = chunks
      .map((chunk: any, i: number) => `[Source ${i + 1}: ${chunk.book_title}]\n${chunk.content}`)
      .join("\n\n---\n\n");

    // SECURITY: Sanitize fitness context to prevent prompt injection from user notes
    const sanitizedFitnessSummary = fitnessContext.summary
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const systemMessage = `You are an expert AI fitness and nutrition coach with access to professional fitness books and the user's personal fitness data.

AVAILABLE INFORMATION:

1. Book Knowledge:
<book_knowledge>
${bookContext || "No relevant book content found."}
</book_knowledge>

2. User's Fitness Data:
<user_fitness_data>
${sanitizedFitnessSummary}
</user_fitness_data>

${historyContext ? `3. Recent Conversation:\n<conversation_history>\n${historyContext}\n</conversation_history>\n` : ""}
INSTRUCTIONS:
- Provide personalized advice based on the user's actual fitness data when relevant
- Reference specific workouts, exercises, or metrics from their data
- Use book knowledge to support your recommendations with evidence-based information
- Be encouraging and motivational
- Keep responses concise and actionable (2-4 paragraphs max)
- If you don't have relevant information, say so honestly`;

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) throw new Error("GROQ_API_KEY is not set in Convex environment");

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: args.question },
        ],
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 0.9,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      throw new Error(`Groq API failed: ${errText}`);
    }

    const groqData = await groqRes.json();
    const answer = groqData.choices?.[0]?.message?.content;
    if (!answer) throw new Error("No answer returned from Groq");

    const sources = [...new Set(chunks.map((c: any) => c.book_title))] as any;

    if (args.conversationId) {
      await ctx.runMutation(internal.chat.addMessage, {
        conversationId: args.conversationId,
        role: "user",
        content: args.question,
      });
      await ctx.runMutation(internal.chat.addMessage, {
        conversationId: args.conversationId,
        role: "assistant",
        content: answer,
        sources,
      });
    }

    return { answer, sources, conversationId: args.conversationId };
  },
});
