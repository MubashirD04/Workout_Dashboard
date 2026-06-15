import { createReadStream } from "fs";
import { parse } from "csv-parse";
import path from "path";
import { fileURLToPath } from "url";
import { ConvexHttpClient } from "convex/browser";
import dotenv from "dotenv";
import { api } from "../convex/_generated/api.js";
import { HfInference } from "@huggingface/inference";

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env") });
dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env.local") });

const CONVEX_URL = process.env.VITE_CONVEX_URL || process.env.CONVEX_URL;
const HF_TOKEN = process.env.HF_TOKEN;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH = path.resolve(__dirname, "../book_knowledge.csv");

if (!CONVEX_URL || !HF_TOKEN) {
  console.error("Missing CONVEX_URL or HF_TOKEN environment variables.");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);
const hf = new HfInference(HF_TOKEN);

interface CsvRow {
  book_title: string;
  chunk_index: string;
  content: string;
}

const BATCH_SIZE = 50;
const MAX_RETRIES = 5;

async function embedBatchWithRetry(texts: string[], retries = 0): Promise<number[][]> {
  try {
    const output = await hf.featureExtraction({
      model: "sentence-transformers/all-MiniLM-L6-v2",
      inputs: texts,
    });
    return output as Extract<typeof output, number[][]>;
  } catch (err: any) {
    if (retries < MAX_RETRIES) {
      console.warn(`[load] HF API Error: ${err.message}. Retrying in ${5 * (retries + 1)}s...`);
      await delay(5000 * (retries + 1));
      return embedBatchWithRetry(texts, retries + 1);
    }
    throw err;
  }
}

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function main() {
  const resetMode = process.argv.includes("--reset");

  console.log("=================================================");
  console.log(" Atomic & Resumable Embedding Loader");
  console.log("=================================================");

  if (resetMode) {
    console.log("[load] --reset flag detected. Clearing existing chunks...");
    let deletedTotal = 0;
    while (true) {
      const deleted = await client.mutation(api.chat.clearChunks);
      if (deleted === 0) break;
      deletedTotal += deleted;
      process.stdout.write(`\r[load] Deleted ${deletedTotal} chunks...`);
    }
    console.log("\n[load] Clear complete.");
  }

  // 1. Get current state to resume
  const latest: any = await client.query(api.chat.getLatestChunkIndex);
  console.log(`[load] Current state in database:`, latest || "Empty");

  // 2. Parse CSV
  const allRows: CsvRow[] = [];
  const parser = createReadStream(CSV_PATH).pipe(
    parse({
      columns: true,
      relax_column_count: true,
      skip_empty_lines: true,
    })
  );

  for await (const row of parser) {
    allRows.push(row as CsvRow);
  }
  console.log(`[load] Total chunks in CSV source: ${allRows.length}`);

  // 3. Determine where to start
  let startIdx = 0;
  if (latest && !resetMode) {
    // Basic resumption: find the first chunk that isn't in the DB
    // Optimization: find index of latest and start after
    const idx = allRows.findIndex(r => 
      r.book_title === latest.book_title && 
      parseInt(r.chunk_index, 10) === latest.chunk_index
    );
    if (idx !== -1) {
      startIdx = idx + 1;
      console.log(`[load] Resuming from index ${startIdx} (after ${latest.book_title} #${latest.chunk_index})`);
    }
  }

  if (startIdx >= allRows.length) {
    console.log("[load] Database is already up to date. Nothing to do.");
    return;
  }

  // 4. Batched Processing
  for (let i = startIdx; i < allRows.length; i += BATCH_SIZE) {
    const chunkBatch = allRows.slice(i, i + BATCH_SIZE);
    
    try {
      process.stdout.write(`[load] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}... `);
      
      const embeddings = await embedBatchWithRetry(chunkBatch.map(r => r.content));
      
      const payload = chunkBatch.map((row, index) => ({
        book_title: row.book_title,
        chunk_index: parseInt(row.chunk_index, 10),
        content: row.content,
        embedding: embeddings[index],
      }));

      await client.mutation(api.chat.addChunks, { chunks: payload });

      console.log(`Success (${i + chunkBatch.length}/${allRows.length} chunks)`);
      
      // Respect HF free tier or shared limits
      await delay(200);

    } catch (err: any) {
      console.error(`\n[load] Fatal Error at chunk ${i}:`, err.message);
      console.log("[load] You can safely restart this script to resume from this point.");
      process.exit(1);
    }
  }

  console.log("\n[load] Successfully synchronized knowledge base.");
}

main().catch(console.error);
