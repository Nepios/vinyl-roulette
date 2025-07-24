import SQLite from 'react-native-sqlite-storage';

const databaseName = 'record-collection.db';

const db = SQLite.openDatabase(
  { name: databaseName, location: 'default' },
  () => { console.log('Database opened'); },
  error => { console.error('Error opening DB', error); }
);

db.transaction(tx => {
  tx.executeSql(`CREATE TABLE IF NOT EXISTS collectors (
    id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
    email TEXT UNIQUE, joined_date TEXT
  )`);
  tx.executeSql(`CREATE TABLE IF NOT EXISTS collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT, collector_id INTEGER NOT NULL,
    collection_name TEXT NOT NULL, description TEXT, created_at TEXT,
    FOREIGN KEY (collector_id) REFERENCES collectors(id)
  )`);
  tx.executeSql(`CREATE TABLE IF NOT EXISTS records (
    id INTEGER PRIMARY KEY AUTOINCREMENT, collection_id INTEGER NOT NULL,
    title TEXT NOT NULL, details TEXT, acquired_date TEXT,
    FOREIGN KEY (collection_id) REFERENCES collections(id)
  )`);
});

export default db
