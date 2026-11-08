export default async function handler(req, res) {
  const cookie = req.headers.cookie || ""
  const tokenMatch = cookie.match(/token=([^;]+)/)
  if (tokenMatch && tokenMatch[1]) {
    return res.status(200).json({ authenticated: true })
  }
  return res.status(200).json({ authenticated: false })
}