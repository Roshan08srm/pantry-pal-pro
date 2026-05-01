import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase;

export const initDatabase = async () => {
  if (db) return db;

  // Open the database synchronously
  db = await SQLite.openDatabaseAsync('pantry.db');

  // Create tables
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      reset_code TEXT
    );

    CREATE TABLE IF NOT EXISTS session (
      id INTEGER PRIMARY KEY DEFAULT 1,
      userId INTEGER,
      FOREIGN KEY (userId) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      userId INTEGER NOT NULL,
      name TEXT NOT NULL,
      qty TEXT NOT NULL,
      exp TEXT NOT NULL,
      status TEXT NOT NULL,
      is_deleted INTEGER DEFAULT 0,
      FOREIGN KEY (userId) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS shopping_list (
      id TEXT PRIMARY KEY,
      userId INTEGER NOT NULL,
      name TEXT NOT NULL,
      qty TEXT NOT NULL,
      status TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS saved_recipes (
      id TEXT PRIMARY KEY,
      userId INTEGER NOT NULL,
      title TEXT NOT NULL,
      time TEXT,
      ingredients TEXT,
      instructions TEXT,
      icon TEXT,
      thumbnail TEXT,
      FOREIGN KEY (userId) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS scan_history (
      id TEXT PRIMARY KEY,
      userId INTEGER NOT NULL,
      uri TEXT NOT NULL,
      date TEXT NOT NULL,
      itemCount INTEGER NOT NULL,
      FOREIGN KEY (userId) REFERENCES users (id)
    );
  `);

  return db;
};

export const getDb = () => db;
