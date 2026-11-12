import crypto from "crypto";
import fs from "fs";
import path from "path";

const ADMIN_EMAIL = "admin@sentinelci.dev";
const CRED_FILE = path.join(process.cwd(), "data", ".initial-admin-password");

export function seedInitialAdmin(db, createUser) {
  const userCount = db
    .prepare("SELECT COUNT(*) AS count FROM users")
    .get().count;
  if (userCount > 0) return;

  const password = crypto.randomBytes(18).toString("base64url");
  createUser(ADMIN_EMAIL, password, "Admin", "admin");

  fs.writeFileSync(CRED_FILE, `${ADMIN_EMAIL}\n${password}`, { mode: 0o600 });
}

export function printAdminCred() {
  if (!fs.existsSync(CRED_FILE)) return;

  const [email, password] = fs
    .readFileSync(CRED_FILE, "utf8")
    .trim()
    .split("\n");
  console.log("Admin login");
  console.log(` username: ${email}`);
  console.log(` password: ${password}`);
}
