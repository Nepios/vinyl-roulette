export const createRecordsTable = `
CREATE TABLE IF NOT EXISTS records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  discogs_id INTEGER UNIQUE,
  date_added TEXT,
  title TEXT,
  artists TEXT,
  year INTEGER,
  thumb TEXT,
  resource_url TEXT,
  cover_image TEXT,
  genres TEXT,
  styles TEXT
)`;

export const createMetadataTable = `
CREATE TABLE IF NOT EXISTS metadata (
  key TEXT PRIMARY KEY,
  value TEXT
)`;

export const createQueueTable = `
CREATE TABLE IF NOT EXISTS queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  record_id INTEGER NOT NULL,
  date_added TEXT DEFAULT (datetime('now')),
  play_order INTEGER,
  FOREIGN KEY (record_id) REFERENCES records (id) ON DELETE CASCADE
)`;

export const createTables = [createRecordsTable, createMetadataTable, createQueueTable];
