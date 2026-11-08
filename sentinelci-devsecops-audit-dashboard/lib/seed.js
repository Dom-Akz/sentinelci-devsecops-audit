import crypto from "crypto";
import fs from "fs";
import path from "path";

export function seedInitialAdmin(db, createUser) {
  const userCount = db
    .prepare("SELECT COUNT(*) AS count FROM users")
    .get().count;
  if (userCount > 0) return;

  const password = crypto.randomBytes(18).toString("base64url");
  createUser("admin@sentinelci.dev", password, "Admin", "admin");

  const outFile = path.join(process.cwd(), "data", ".initial-admin-password");
  fs.writeFileSync(outFile, password, { mode: 0o600 });

  console.log("First run: created admin@sentinelci.dev");
  console.log(`Password: ${password}`);
  console.log(`(also saved to ${outFile})`);
}
