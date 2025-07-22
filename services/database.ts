import SQLite from 'react-native-sqlite-storage';

const databaseName = 'record-collection.db';

const db = SQLite.openDatabase(
  { name: databaseName, location: 'default' },
  () => { console.log('Database opened'); },
  error => { console.error('Error opening DB', error); }
);

export default db;
