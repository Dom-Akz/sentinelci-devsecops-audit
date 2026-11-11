import path from "path";
import fs from "fs";
import crypto from "crypto";
import { seedInitialAdmin } from "./seed.js";

// Bigger value so the hash is harder to break
const SCRYPT_OPTS = { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 };
const KEY_LEN = 64;

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// DB_ENGINE=node  ->  use the SQLite engine built into Node >= 22
//                     (better-sqlite3 native binding segfaults in some docker images)
const USE_NODE_SQLITE = process.env.DB_ENGINE === "node";

function openDb(file) {
  if (USE_NODE_SQLITE) {
    const { DatabaseSync } = require("node:sqlite");
    const raw = new DatabaseSync(file);
    raw.prepare("PRAGMA journal_mode = WAL").get();
    return {
      engine: "node:sqlite",
      exec: (sql) => raw.exec(sql),
      prepare: (sql) => raw.prepare(sql),
      close: () => raw.close(),
      pragma: (name) => raw.prepare(`PRAGMA ${name}`).get(),
    };
  }
  const Database = require("better-sqlite3");
  const raw = new Database(file);
  raw.pragma("journal_mode = WAL");
  return {
    engine: "better-sqlite3",
    exec: (sql) => raw.exec(sql),
    prepare: (sql) => raw.prepare(sql),
    close: () => raw.close(),
    pragma: (name) => raw.pragma(name),
  };
}

const db = openDb(path.join(dataDir, "sentinel.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

// stronger hash values (harder to bruteforce)
export function hashPassword(password, salt) {
  const s = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .scryptSync(password, s, KEY_LEN, SCRYPT_OPTS)
    .toString("hex");
  return { salt: s, hash };
}

export function verifyPassword(password, salt, expectedHash) {
  if (!salt || !expectedHash) return false;

  const expected = Buffer.from(expectedHash, "hex");
  if (expected.length !== KEY_LEN) return false;

  const actual = crypto.scryptSync(password, salt, KEY_LEN, SCRYPT_OPTS);
  return crypto.timingSafeEqual(actual, expected);
}

export function createUser(email, password, name, role = "user") {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }
  const { salt, hash } = hashPassword(password);
  const stmt = db.prepare(
    "INSERT INTO users (email, name, password_hash, salt, role) VALUES (?, ?, ?, ?, ?)",
  );
  const info = stmt.run(
    email.toLowerCase(),
    name || email.split("@")[0],
    hash,
    salt,
    role,
  );
  return db
    .prepare("SELECT id, email, name, role, created_at FROM users WHERE id = ?")
    .get(Number(info.lastInsertRowid));
}

seedInitialAdmin(db); // the /lib/seed.js
export default db;
