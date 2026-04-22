const Database = require('better-sqlite3');
const path = require('path');

// Railway filesystem is ephemeral — /tmp is the only writable path in production
const DB_PATH = process.env.NODE_ENV === 'production'
  ? '/tmp/shadow-terminal.db'
  : path.join(__dirname, 'shadow-terminal.db');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Initialize database schema
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

  CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    score INTEGER NOT NULL,
    mission INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS game_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE REFERENCES users(id),
    mission_idx INTEGER DEFAULT 0,
    step_idx INTEGER DEFAULT 0,
    lives INTEGER DEFAULT 3,
    timer_remaining INTEGER DEFAULT 300,
    wrong_streak INTEGER DEFAULT 0,
    xp INTEGER DEFAULT 0,
    score INTEGER DEFAULT 0,
    hint_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active', -- active | complete | failed
    last_tick DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
    achievement_key TEXT NOT NULL,
    unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_key)
  );
`);

module.exports = db;
