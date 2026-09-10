-- ============================================================
--  Library Management System — SQL schema
--  SQLite (via better-sqlite3). Foreign keys ON.
-- ============================================================

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  passhash    TEXT NOT NULL,            -- scrypt(password, salt)
  salt        TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member','admin')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS books (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  title            TEXT NOT NULL,
  author           TEXT NOT NULL,
  isbn             TEXT UNIQUE,
  genre            TEXT NOT NULL,
  year             INTEGER,
  copies_total     INTEGER NOT NULL DEFAULT 1 CHECK (copies_total > 0),
  copies_available INTEGER NOT NULL DEFAULT 1 CHECK (copies_available >= 0),
  description      TEXT DEFAULT '',
  created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS loans (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id     INTEGER NOT NULL REFERENCES books(id)  ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  borrowed_at TEXT NOT NULL DEFAULT (datetime('now')),
  due_date    TEXT NOT NULL,
  returned_at TEXT                                  -- NULL = still out
);

CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_loans_user   ON loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_book   ON loans(book_id);
CREATE INDEX IF NOT EXISTS idx_loans_active ON loans(returned_at);
CREATE INDEX IF NOT EXISTS idx_books_genre  ON books(genre);
