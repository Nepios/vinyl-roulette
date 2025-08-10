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

export const createTables = [createRecordsTable, createMetadataTable];
