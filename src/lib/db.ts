import Database from 'better-sqlite3'
import path from 'path'
import { mkdirSync } from 'fs'

const dbPath = process.env.DATABASE_PATH || './data/wardrobe.db'

// Ensure directory exists
mkdirSync(path.dirname(dbPath), { recursive: true })

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')

// Initialize tables
function initializeTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS wardrobe_items (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      color TEXT NOT NULL,
      material TEXT NOT NULL,
      formality TEXT NOT NULL,
      fit TEXT NOT NULL,
      silhouette TEXT NOT NULL,
      visual_weight TEXT NOT NULL,
      metadata TEXT,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS evaluations (
      id TEXT PRIMARY KEY,
      item_filename TEXT NOT NULL,
      verdict TEXT NOT NULL CHECK (verdict IN ('Buy', 'Maybe', 'Do Not Buy')),
      reasoning TEXT NOT NULL,
      pairings TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_wardrobe_uploaded_at ON wardrobe_items(uploaded_at);
    CREATE INDEX IF NOT EXISTS idx_evaluations_created_at ON evaluations(created_at);
  `)
}

// Initialize on module load
initializeTables()

export { db }
