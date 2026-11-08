import fs from "fs"
import path from "path"
import { BASELINE_REPORTS, toolFromFile } from "../../../lib/reports"

function humanSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

function fmtDate(ms) {
  return new Date(ms).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
}

function readFilesystem() {
  const dir = path.resolve(process.cwd(), "..", "reports", "baseline")
  const files = fs.readdirSync(dir)
  return files
    .map((file) => {
      try {
        const st = fs.statSync(path.join(dir, file))
        if (!st.isFile()) return null
        return {
          tool: toolFromFile(file) || "image",
          file,
          size: humanSize(st.size),
          date: fmtDate(st.mtimeMs),
          entries: null,
        }
      } catch {
        return null
      }
    })
    .filter((f) => f && f.file)
    .sort((a, b) => b.file.localeCompare(a.file))
}

export default function handler(req, res) {
  try {
    const reports = readFilesystem()
    res.status(200).json({ ok: true, source: "filesystem", reports: reports.slice(0, 8) })
  } catch {
    res.status(200).json({ ok: true, source: "static", reports: BASELINE_REPORTS })
  }
}
