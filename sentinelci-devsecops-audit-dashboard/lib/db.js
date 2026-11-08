import path from "path"
import fs from "fs"
import crypto from "crypto"

const dataDir = path.join(process.cwd(), "data")
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// DB_ENGINE=node  ->  use the SQLite engine built into Node >= 22
//                     (better-sqlite3 native binding segfaults in some docker images)
const USE_NODE_SQLITE = process.env.DB_ENGINE === "node"

function openDb(file) {
  if (USE_NODE_SQLITE) {
    const { DatabaseSync } = require("node:sqlite")
    const raw = new DatabaseSync(file)
    raw.prepare("PRAGMA journal_mode = WAL").get()
    return {
      engine: "node:sqlite",
      exec: (sql) => raw.exec(sql),
      prepare: (sql) => raw.prepare(sql),
      close: () => raw.close(),
      pragma: (name) => raw.prepare(`PRAGMA ${name}`).get(),
    }
  }
  const Database = require("better-sqlite3")
  const raw = new Database(file)
  raw.pragma("journal_mode = WAL")
  return raw
}

const db = openDb(path.join(dataDir, "sentinel.db"))

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
`)

export function hashPassword(password, salt) {
  const s = salt || crypto.randomBytes(16).toString("hex")
  const hash = crypto.scryptSync(password, s, 64).toString("hex")
  return { salt: s, hash }
}

export function verifyPassword(password, salt, expectedHash) {
  const { hash } = hashPassword(password, salt)
  const a = Buffer.from(hash, "hex")
  const b = Buffer.from(expectedHash, "hex")
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

// Seed default admin account if no users exist
const userCount = db.prepare("SELECT COUNT(*) AS count FROM users").get().count
if (userCount === 0) {
  const { salt, hash } = hashPassword("admin123")
  db.prepare(
    "INSERT INTO users (email, name, password_hash, salt, role) VALUES (?, ?, ?, ?, ?)"
  ).run("admin@sentinelci.dev", "Admin", hash, salt, "admin")
}

export function createUser(email, password, name, role = "user") {
  if (!email || !password) {
    throw new Error("Email and password are required")
  }
  const { salt, hash } = hashPassword(password)
  const stmt = db.prepare(
    "INSERT INTO users (email, name, password_hash, salt, role) VALUES (?, ?, ?, ?, ?)"
  )
  const info = stmt.run(email.toLowerCase(), name || email.split("@")[0], hash, salt, role)
  return db.prepare("SELECT id, email, name, role, created_at FROM users WHERE id = ?").get(Number(info.lastInsertRowid))
}

export default db