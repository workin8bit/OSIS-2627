import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { seed } from './seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'osis.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
CREATE TABLE IF NOT EXISTS divisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  short TEXT,
  description TEXT,
  icon TEXT DEFAULT 'Users',
  sort_order INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  class_name TEXT,
  division_id INTEGER REFERENCES divisions(id) ON DELETE SET NULL,
  is_core INTEGER DEFAULT 0,
  photo TEXT,
  instagram TEXT,
  quote TEXT,
  sort_order INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS programs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  division_id INTEGER REFERENCES divisions(id) ON DELETE SET NULL,
  target TEXT,
  start_date TEXT,
  end_date TEXT,
  status TEXT DEFAULT 'rencana',
  progress INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT,
  cover TEXT,
  category TEXT DEFAULT 'Kegiatan',
  author TEXT,
  published INTEGER DEFAULT 1,
  views INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  time TEXT,
  location TEXT,
  category TEXT DEFAULT 'Umum'
);
CREATE TABLE IF NOT EXISTS gallery (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  image TEXT NOT NULL,
  album TEXT DEFAULT 'Umum',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS aspirations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket TEXT UNIQUE NOT NULL,
  name TEXT,
  class_name TEXT,
  category TEXT DEFAULT 'Umum',
  message TEXT NOT NULL,
  anonymous INTEGER DEFAULT 0,
  status TEXT DEFAULT 'baru',
  response TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
`);

// Buat admin default bila belum ada
const userCount = db.prepare('SELECT COUNT(*) c FROM users').get().c;
if (userCount === 0) {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'osis2627';
  db.prepare('INSERT INTO users (username, password_hash, name, role) VALUES (?,?,?,?)')
    .run(username, bcrypt.hashSync(password, 10), 'Administrator OSIS', 'superadmin');
  console.log(`[db] Admin default dibuat -> username: ${username} / password: ${password}`);
}

const settingsCount = db.prepare('SELECT COUNT(*) c FROM settings').get().c;
if (settingsCount === 0 && process.env.SKIP_SEED !== '1') {
  seed(db);
  console.log('[db] Data contoh berhasil dimasukkan');
}

export default db;
