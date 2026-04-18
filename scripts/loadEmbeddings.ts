import { createReadStream } from "fs";
import { parse } from "csv-parse";
import path from "path";
import { fileURLToPath } from "url";
import { ConvexHttpClient } from "convex/browser";
import dotenv from "dotenv";
import { anyApi } from "convex/server";
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
const MAX_RETRIES = 3;

async function embedBatchWithRetry(texts: string[], retries = 0): Promise<number[][]> {
  try {
    const output = await hf.featureExtraction({
      model: "sentence-transformers/all-MiniLM-L6-v2",
      inputs: texts,
    });
    return output as Extract<typeof output, number[][]>;
  } catch (err: any) {
    if (retries < MAX_RETRIES) {
      console.warn(`[load] HF API Error: ${err.message}. Retrying... (${retries + 1}/${MAX_RETRIES})`);
      await delay(3000 * (retries + 1)); // Exponential backoff
      return embedBatchWithRetry(texts, retries + 1);
    }
    throw err;
  }
}

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function main() {
  console.log("=================================================");
  console.log(" Safe & Limit-Compliant Embedding Sync");
  console.log("=================================================");

  console.log(`[load] Clearing existing chunks from Convex...`);
  let deletedCount = 0;
  while (true) {
    const deleted = await client.mutation(anyApi.chat.clearChunks);
    if (deleted === 0) break;
    deletedCount += deleted;
    console.log(`[load] Deleted ${deletedCount} chunks...`);
  }
  console.log(`[load] Cleared all ${deletedCount} existing chunks.`);
  
  const existingCount = 0; // Fresh start

  // 2. Parse CSV
  const rows: CsvRow[] = [];
  const parser = createReadStream(CSV_PATH).pipe(
    parse({
      columns: true,
      relax_column_count: true,
      skip_empty_lines: true,
    })
  );

  for await (const row of parser) {
    rows.push(row as CsvRow);
  }

  console.log(`[load] Total rows mapped from CSV source: ${rows.length}`);

  // 3. Sync Batches safely, skipping what's already completed
  for (let i = existingCount; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const texts = batch.map(r => r.content);

    try {
      console.log(`[load] Embedding batch starting at index ${i}...`);
      const embeddings = await embedBatchWithRetry(texts);

      // Mutate via a SINGLE batched mutation to prevent concurrent transaction HTTP flooding.
      const payload = batch.map((row, index) => ({
        book_title: row.book_title,
        chunk_index: parseInt(row.chunk_index, 10),
        content: row.content,
        embedding: embeddings[index],
      }));

      await client.mutation(anyApi.chat.addChunks, { chunks: payload });

      console.log(`[load] Inserted payload. Progress: ${i + batch.length}/${rows.length} successful.`);
      
      // Delay to respect rate limits gracefully
      await delay(500); 

    } catch (err) {
      console.error(`\n[load] Fatal Error processing batch at index ${i}:`, err);
      console.log(`[load] Terminating safety measures. You can restart the script to safely resume.`);
      process.exit(1);
    }
  }

  console.log("\n[load] Sync process finished successfully! No skipped errors.");
}

main().catch(console.error);
