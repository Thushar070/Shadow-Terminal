const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'data', 'shadow.db');

// Ensure the directory exists
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

let db;

/**
 * Initializes the database and schema.
 * Returns the db instance.
 */
async function getDb() {
  if (db) return db;
  
  console.log(`[DATABASE] Opening database at: ${dbPath}`);
  try {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    console.log('[DATABASE] journal_mode=WAL set successfully.');
    
    initSchema();
    console.log('[DATABASE] Schema initialized.');
    return db;
  } catch (err) {
    console.error('[DATABASE] Fatal error during initialization:', err.message);
    throw err;
  }
}

/**
 * Executes a SQL statement.
 */
function run(sql, params = []) {
  if (!db) throw new Error('Database not initialized. Call getDb() first.');
  return db.prepare(sql).run(params);
}

/**
 * Gets a single row from a SQL query.
 */
function get(sql, params = []) {
  if (!db) throw new Error('Database not initialized. Call getDb() first.');
  return db.prepare(sql).get(params);
}

/**
 * Gets all rows from a SQL query.
 */
function all(sql, params = []) {
  if (!db) throw new Error('Database not initialized. Call getDb() first.');
  return db.prepare(sql).all(params);
}

/**
 * Closes the database connection.
 */
function close() {
  if (db) db.close();
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      xp INTEGER DEFAULT 0,
      score INTEGER DEFAULT 0,
      missions_completed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS game_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      mission_idx INTEGER DEFAULT 0,
      step_idx INTEGER DEFAULT 0,
      lives INTEGER DEFAULT 3,
      timer_remaining INTEGER DEFAULT 300,
      wrong_streak INTEGER DEFAULT 0,
      xp INTEGER DEFAULT 0,
      score INTEGER DEFAULT 0,
      hint_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      last_tick DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      score INTEGER NOT NULL,
      mission INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS mission_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      mission_idx INTEGER,
      xp_earned INTEGER,
      time_bonus INTEGER,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      achievement_key TEXT,
      unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, achievement_key)
    );

    CREATE TABLE IF NOT EXISTS daily_challenges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      challenge_date DATE UNIQUE,
      mission_idx INTEGER,
      modifier TEXT
    );

    CREATE TABLE IF NOT EXISTS daily_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      challenge_date DATE,
      score INTEGER,
      time_taken INTEGER,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

module.exports = { getDb, run, get, all, close };
