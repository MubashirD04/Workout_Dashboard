import { createReadStream } from "fs";
import { parse } from "csv-parse";
import path from "path";
import { fileURLToPath } from "url";
import { ConvexHttpClient } from "convex/browser";
import dotenv from "dotenv";
import { anyApi } from "convex/server";

// Load environment variables from server/.env if available
dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../server/.env") });
dotenv.config({ path: ".env.local" });

const CONVEX_URL = process.env.VITE_CONVEX_URL! || process.env.CONVEX_URL!;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY!;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH = path.resolve(__dirname, "../../server/book_knowledge.csv");

if (!CONVEX_URL) {
  console.error("Please set VITE_CONVEX_URL or CONVEX_URL in .env.local");
  process.exit(1);
}
if (!GOOGLE_API_KEY) {
  console.error("Please set GOOGLE_API_KEY in server/.env or .env.local");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

interface CsvRow {
  book_title: string;
  chunk_index: string;
  content: string;
  embedding: string; // The old Ollama embedding (ignored)
}

async function embedContent(text: string): Promise<number[]> {
  const embedRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GOOGLE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/text-embedding-004",
        content: { parts: [{ text }] },
      }),
    }
  );

  if (!embedRes.ok) {
    throw new Error(`Google Embeddings API failed: ${embedRes.statusText}`);
  }

  const embedData = await embedRes.json();
  const embedding = embedData.embedding?.values;
  if (!embedding) throw new Error("Could not extract embedding from Google API response");

  return embedding;
}

// Simple sleep for rate limiting
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function main() {
  console.log("=================================================");
  console.log(" Load & Re-evaluate Book Knowledge into Convex");
  console.log("=================================================");

  console.log(`[load] Clearing existing chunks from Convex...`);
  await client.mutation(anyApi.chat.clearChunks);
  console.log(`[load] Cleared.`);

  let totalProcessed = 0;
  let errorCount = 0;

  const parser = createReadStream(CSV_PATH).pipe(
    parse({
      columns: true,
      relax_column_count: true,
      skip_empty_lines: true,
    })
  );

  for await (const row of parser) {
    const csvRow = row as CsvRow;
    try {
      // Create new embedding via Gemini
      const embedding = await embedContent(csvRow.content);

      // Insert chunk to Convex
      await client.mutation(anyApi.chat.addChunk, {
        book_title: csvRow.book_title,
        chunk_index: parseInt(csvRow.chunk_index, 10),
        content: csvRow.content,
        embedding,
      });

      totalProcessed++;
      if (totalProcessed % 50 === 0) {
        console.log(`[load] Progress: ${totalProcessed} chunks inserted. Errors: ${errorCount}`);
      }

      // Small delay just to be nice to standard Gemini free tier rate limits
      await delay(100); 

    } catch (err) {
      errorCount++;
      console.error(`[load] Error processing book_title="${csvRow.book_title}" chunk_index=${csvRow.chunk_index}: ${err}`);
    }
  }

  console.log(`\n[load] Finished! Processed: ${totalProcessed}, Errors: ${errorCount}`);
}

main().catch(console.error);
