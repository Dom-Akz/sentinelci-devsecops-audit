export default async function handler(req, res) {
  res.setHeader("Set-Cookie", "token=; Path=/; Max-age=0; HttpOnly; SameSite=lax")
  return res.status(200).json({ success: true })
}