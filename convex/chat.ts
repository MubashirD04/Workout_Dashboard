import { query, mutation, action, internalQuery, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

export const getConversations = query({
  args: {},
  handler: async (ctx) => {
    const convos = await ctx.db.query("conversations").order("desc").take(20);
    return Promise.all(
      convos.map(async (c) => {
        const firstMessage = await ctx.db
          .query("messages")
          .withIndex("by_creation_time")
          .filter((q) => q.eq(q.field("conversationId"), c._id))
          .first();
        return {
          ...c,
          first_message: firstMessage?.content,
        };
      })
    );
  },
});

export const clearChunks = mutation({
  args: {},
  handler: async (ctx) => {
    const chunks = await ctx.db.query("bookKnowledge").collect();
    for (const c of chunks) {
      await ctx.db.delete(c._id);
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

export const getConversation = query({
  args: { id: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_creation_time")
      .filter((q) => q.eq(q.field("conversationId"), args.id))
      .collect();
  },
});

export const createConversation = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    return await ctx.db.insert("conversations", {
      created_at: now,
      updated_at: now,
    });
  },
});

export const deleteConversation = mutation({
  args: { id: v.id("conversations") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_creation_time")
      .filter((q) => q.eq(q.field("conversationId"), args.id))
      .collect();
    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }
    await ctx.db.delete(args.id);
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

export const getFitnessContext = internalQuery({
  args: {},
  handler: async (ctx) => {
    const workouts = await ctx.db.query("workouts").order("desc").take(5);
    const cardio = await ctx.db.query("cardioLogs").order("desc").take(5);
    const tmpMetrics = await ctx.db.query("bodyMetrics").order("desc").take(1);
    const latestMetrics = tmpMetrics.length > 0 ? tmpMetrics[0] : null;

    let summary = 'User Fitness Data:\n\n';

    if (latestMetrics) {
      summary += `Latest Metrics (${latestMetrics.date}):\n`;
      summary += `- Weight: ${latestMetrics.weight}kg\n`;
      if (latestMetrics.body_fat_perc) summary += `- Body Fat: ${latestMetrics.body_fat_perc}%\n`;
      summary += '\n';
    }

    if (workouts.length > 0) {
      summary += 'Recent Workouts:\n';
      workouts.forEach((w, i) => {
        summary += `${i + 1}. ${w.date}: `;
        const exerciseNames = w.exercises.map((e) => e.exercise_name).join(', ');
        summary += exerciseNames || 'No exercises logged';
        if (w.duration) summary += ` (${w.duration} min)`;
        summary += '\n';
      });
      summary += '\n';
    }

    if (cardio.length > 0) {
      summary += 'Recent Cardio:\n';
      cardio.forEach((c, i) => {
        summary += `${i + 1}. ${c.date}: ${c.type} - ${c.distance}km in ${c.duration} min\n`;
      });
    }

    if (!latestMetrics && workouts.length === 0 && cardio.length === 0) {
      summary = 'No fitness data available yet.';
    }

    return { summary };
  },
});

export const getConversationHistory = internalQuery({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_creation_time")
      .filter((q) => q.eq(q.field("conversationId"), args.conversationId))
      .collect();
    return messages.map((m) => ({ role: m.role, content: m.content }));
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
  },
  handler: async (ctx, args) => {
    // Generate embedding using Google Gemini
    const googleApiKey = process.env.GOOGLE_API_KEY;
    if (!googleApiKey) throw new Error("GOOGLE_API_KEY is not set in Convex environment");

    const embedRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${googleApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "models/text-embedding-004",
          content: { parts: [{ text: args.question }] },
        }),
      }
    );

    if (!embedRes.ok) {
      throw new Error(`Google Embeddings API failed: ${embedRes.statusText}`);
    }

    const embedData = await embedRes.json();
    const embeddingValues = embedData.embedding?.values;
    if (!embeddingValues) throw new Error("Could not extract embedding from Google API response");

    // Search Convex vector index
    const results = await ctx.vectorSearch("bookKnowledge", "by_embedding", {
      vector: embeddingValues,
      limit: 5,
    });

    // Filter relevant (score > ~0.4 depends on Convex distance metric, but let's assume we take top 5 directly to start)
    // You might experiment with appropriate thresholds for Gemini embeddings in Convex.
    const relevantIds = results.filter(r => r._score > 0.4).map((r) => r._id);
    const chunks = await ctx.runQuery(internal.chat.getChunks, { ids: relevantIds });

    // Fetch fitness context
    const fitnessContext = await ctx.runQuery(internal.chat.getFitnessContext);

    // Get conversation history
    let historyContext = "";
    if (args.conversationId) {
      const history = await ctx.runQuery(internal.chat.getConversationHistory, {
        conversationId: args.conversationId,
      });
      historyContext = history
        .slice(-4)
        .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
        .join("\n");
    }

    const bookContext = chunks
      .map((chunk, i) => `[Source ${i + 1}: ${chunk.book_title}]\n${chunk.content}`)
      .join("\n\n---\n\n");

    const systemMessage = `You are an expert AI fitness and nutrition coach with access to professional fitness books and the user's personal fitness data.

AVAILABLE INFORMATION:

1. Book Knowledge:
${bookContext || "No relevant book content found."}

2. User's Fitness Data:
${fitnessContext.summary}

${historyContext ? `3. Recent Conversation:\n${historyContext}\n` : ""}
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
        "Authorization": `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
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

    const sources = [...new Set(chunks.map((c) => c.book_title))];

    // Persist messages if conversation exists
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
