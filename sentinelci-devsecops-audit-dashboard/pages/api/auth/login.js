import db, { verifyPassword } from "../../../lib/db"

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  const { email, password } = req.body || {}

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required"
    })
  }

  const user = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(String(email).toLowerCase().trim())

  if (!user || !verifyPassword(password, user.salt, user.password_hash)) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials"
    })
  }

  const token = Buffer.from(`${user.id}:${user.email}:${Date.now()}`).toString("base64")
  res.setHeader("Set-Cookie", `token=${token}; Path=/; HttpOnly; SameSite=lax`)

  return res.status(200).json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  })
}