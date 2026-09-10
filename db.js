// ============================================================
//  db.js — SQLite connection + schema bootstrap
// ============================================================
const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "library.db");

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// apply schema
db.exec(fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8"));

// ---------- password helpers (scrypt, no external deps) ----------
const crypto = require("crypto");
function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}
function makeCredentials(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  return { salt, passhash: hashPassword(password, salt) };
}
function verifyPassword(password, salt, passhash) {
  const h = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(h, "hex"), Buffer.from(passhash, "hex"));
}

module.exports = { db, makeCredentials, verifyPassword };
