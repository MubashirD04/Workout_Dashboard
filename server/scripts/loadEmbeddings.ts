import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../src/db/index.js';

// ──────────────────────────────────────────────────────────────
// Config
// ──────────────────────────────────────────────────────────────
const BATCH_SIZE = 100;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH = path.resolve(__dirname, '..', 'book_knowledge.csv');

// ──────────────────────────────────────────────────────────────
// Pre-flight checks
// ──────────────────────────────────────────────────────────────
async function preflight(): Promise<void> {
  console.log('[preflight] Checking database connection...');
  const connCheck = await pool.query('SELECT 1');
  if (!connCheck) throw new Error('Cannot connect to database');
  console.log('[preflight] Database connection OK.');

  console.log('[preflight] Checking pgvector extension...');
  const extRes = await pool.query(
    "SELECT extname FROM pg_extension WHERE extname = 'vector';"
  );
  if (extRes.rows.length === 0) {
    throw new Error(
      'pgvector extension is not installed. Run: CREATE EXTENSION vector;'
    );
  }
  console.log('[preflight] pgvector extension OK.');

  console.log('[preflight] Checking book_knowledge table...');
  const tableRes = await pool.query(
    "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'book_knowledge' ORDER BY ordinal_position;"
  );
  if (tableRes.rows.length === 0) {
    throw new Error(
      'book_knowledge table does not exist. Please create it first.'
    );
  }
  console.log('[preflight] book_knowledge table OK.');
  console.table(tableRes.rows);
}

// ──────────────────────────────────────────────────────────────
// Insert a batch of rows
// ──────────────────────────────────────────────────────────────
interface CsvRow {
  book_title: string;
  chunk_index: string;
  content: string;
  embedding: string;
}

async function insertBatch(rows: CsvRow[]): Promise<void> {
  if (rows.length === 0) return;

  // Build a multi-row INSERT with parameterised values
  const values: unknown[] = [];
  const placeholders: string[] = [];

  rows.forEach((row, i) => {
    const offset = i * 4;
    placeholders.push(
      `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`
    );
    values.push(
      row.book_title,
      parseInt(row.chunk_index, 10),
      row.content,
      row.embedding          // pgvector accepts the text representation '[0.1, 0.2, ...]'
    );
  });

  const sql = `
    INSERT INTO book_knowledge (book_title, chunk_index, content, embedding)
    VALUES ${placeholders.join(', ')}
  `;

  await pool.query(sql, values);
}

// ──────────────────────────────────────────────────────────────
// Main – stream CSV, batch-insert, verify
// ──────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  console.log('='.repeat(60));
  console.log(' Load Book Knowledge Embeddings');
  console.log('='.repeat(60));

  // 1. Pre-flight
  await preflight();

  // 2. Clear existing data
  console.log('\n[load] Clearing existing rows from book_knowledge...');
  const deleteRes = await pool.query('DELETE FROM book_knowledge');
  console.log(`[load] Deleted ${deleteRes.rowCount} existing rows.`);

  // 3. Stream & insert
  console.log(`[load] Reading CSV from: ${CSV_PATH}`);
  console.log(`[load] Batch size: ${BATCH_SIZE}`);

  const parser = createReadStream(CSV_PATH).pipe(
    parse({
      columns: true,
      relax_column_count: true,
      skip_empty_lines: true,
    })
  );

  let batch: CsvRow[] = [];
  let totalInserted = 0;
  let errorCount = 0;

  for await (const row of parser) {
    batch.push(row as CsvRow);

    if (batch.length >= BATCH_SIZE) {
      try {
        await insertBatch(batch);
        totalInserted += batch.length;
      } catch (err) {
        errorCount += batch.length;
        console.error(
          `[load] ERROR inserting batch at row ~${totalInserted + errorCount}:`,
          (err as Error).message
        );
      }
      batch = [];

      // Progress log every 500 rows
      if ((totalInserted + errorCount) % 500 === 0) {
        console.log(`[load] Progress: ${totalInserted} inserted, ${errorCount} errors`);
      }
    }
  }

  // Flush remaining rows
  if (batch.length > 0) {
    try {
      await insertBatch(batch);
      totalInserted += batch.length;
    } catch (err) {
      errorCount += batch.length;
      console.error('[load] ERROR inserting final batch:', (err as Error).message);
    }
  }

  console.log(`\n[load] Finished inserting. Total inserted: ${totalInserted}, Errors: ${errorCount}`);

  // ──────────────────────────────────────────────────────────
  // 4. Post-insertion verification
  // ──────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(60));
  console.log(' Post-Insertion Verification');
  console.log('='.repeat(60));

  // Row count
  const countRes = await pool.query('SELECT COUNT(*) AS cnt FROM book_knowledge');
  const dbRowCount = parseInt(countRes.rows[0].cnt, 10);
  console.log(`[verify] Rows in book_knowledge table: ${dbRowCount}`);
  console.log(`[verify] Expected (inserted):          ${totalInserted}`);
  if (dbRowCount !== totalInserted) {
    console.warn('[verify] WARNING: row count mismatch!');
  } else {
    console.log('[verify] Row count matches.');
  }

  // Distinct books
  const booksRes = await pool.query(
    'SELECT COUNT(DISTINCT book_title) AS cnt FROM book_knowledge'
  );
  console.log(`[verify] Distinct book titles: ${booksRes.rows[0].cnt}`);

  // Sample row – check that embedding has a valid dimension
  const sampleRes = await pool.query(
    'SELECT id, book_title, chunk_index, vector_dims(embedding) AS dims FROM book_knowledge LIMIT 3'
  );
  console.log('[verify] Sample rows:');
  console.table(sampleRes.rows);

  // Quick cosine similarity sanity check (compare first row to itself → should be 1.0)
  const simRes = await pool.query(`
    SELECT 1 - (embedding <=> embedding) AS self_similarity
    FROM book_knowledge
    LIMIT 1
  `);
  const selfSim = parseFloat(simRes.rows[0].self_similarity);
  console.log(`[verify] Self-similarity sanity check (should be ~1.0): ${selfSim.toFixed(6)}`);

  if (Math.abs(selfSim - 1.0) > 0.001) {
    console.warn('[verify] WARNING: self-similarity is not ~1.0, embeddings may be corrupted.');
  } else {
    console.log('[verify] Self-similarity check passed.');
  }

  console.log('\n[done] All checks complete.');
  await pool.end();
  process.exit(errorCount > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('[fatal]', err);
  pool.end();
  process.exit(1);
});
