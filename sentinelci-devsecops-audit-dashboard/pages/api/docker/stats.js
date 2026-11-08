import http from "http"
import { exec } from "child_process"
import { promisify } from "util"

const run = promisify(exec)
const SOCKET = "/var/run/docker.sock"

function dockerReq(pathname, ms = 8000) {
  return new Promise((resolve) => {
    const req = http.request({ socketPath: SOCKET, path: pathname, timeout: ms, method: "GET" }, (res) => {
      let body = ""
      res.on("data", (c) => (body += c))
      res.on("end", () => resolve({ status: res.statusCode, body }))
    })
    req.on("error", () => resolve(null))
    req.on("timeout", () => {
      req.destroy()
      resolve(null)
    })
    req.end()
  })
}

function tryParseJson(body) {
  try {
    return JSON.parse(body)
  } catch {
    return null
  }
}

const humanSize = (bytes) => {
  const b = Number(bytes) || 0
  if (b >= 1024 ** 3) return `${(b / 1024 ** 3).toFixed(2)}GB`
  if (b >= 1024 ** 2) return `${(b / 1024 ** 2).toFixed(0)}MB`
  return `${Math.max(1, Math.round(b / 1024))}KB`
}

const round2 = (n) => Math.round(n * 100) / 100

function cpuPercent(st) {
  const pre = st.precpu_stats || {}
  const cur = st.cpu_stats || {}
  const cpuDelta = (cur.cpu_usage?.total_usage || 0) - (pre.cpu_usage?.total_usage || 0)
  const sysDelta = (cur.system_cpu_usage || 0) - (pre.system_cpu_usage || 0)
  const cpus = cur.online_cpus || 1
  const pct = sysDelta > 0 ? (cpuDelta / sysDelta) * cpus * 100 : 0
  return round2(pct)
}

function memOf(st) {
  const usage = st.memory_stats?.usage || 0
  const limit = st.memory_stats?.limit || 0
  const pct = limit > 0 ? (usage / limit) * 100 : 0
  return { pct: round2(pct), usage: humanSize(usage), limit: humanSize(limit) }
}

async function fromSocket() {
  const contRaw = tryParseJson((await dockerReq("/v1.41/containers/json?all=1"))?.body)
  if (!Array.isArray(contRaw)) return null

  const containers = contRaw.map((c) => ({
    Names: (c.Names && c.Names[0] ? c.Names[0].replace(/^\//, "") : "") || c.Id.slice(0, 12),
    State: c.State,
    Status: c.Status,
    Image: c.Image,
    Created: c.Created,
  }))

  const [imgRaw, dfRaw, eventsRaw, ...statsAll] = await Promise.all([
    dockerReq("/v1.41/images/json"),
    dockerReq("/v1.41/system/df"),
    dockerReq(
      `/v1.41/events?since=${Math.floor(Date.now() / 1000) - 86400}&until=${Math.floor(Date.now() / 1000)}&filters=${encodeURIComponent(
        JSON.stringify({ type: ["container", "image"] })
      )}`,
      10000
    ),
    ...contRaw.filter((c) => c.State === "running").map((c) => dockerReq(`/v1.41/containers/${c.Id}/stats?stream=false`)),
  ])

  const runningIds = contRaw.filter((c) => c.State === "running")
  const stats = runningIds
    .map((c, i) => {
      const st = tryParseJson((statsAll[i] || {}).body)
      if (!st || !st.cpu_stats) return null
      const mem = memOf(st)
      return {
        Name: (c.Names && c.Names[0] ? c.Names[0].replace(/^\//, "") : c.Id.slice(0, 12)),
        CPUPerc: `${cpuPercent(st)}%`,
        MemPerc: `${mem.pct}%`,
        MemUsage: `${mem.usage} / ${mem.limit}`,
      }
    })
    .filter(Boolean)

  const images = (tryParseJson(imgRaw?.body) || []).map((i) => ({
    RepoTags: i.RepoTags && i.RepoTags[0] ? i.RepoTags[0] : "<none>",
    Size: i.Size,
    Created: i.Created,
  }))

  const df = (() => {
    const d = tryParseJson(dfRaw?.body) || {}
    const count = (k) => (Array.isArray(d[k]) ? d[k].length : 0)
    const size = (k, field) => humanSize((d[k] || []).reduce((s, x) => s + (field ? field(x) : 0), 0))
    return [
      { Type: "Images", TotalCount: String(count("Images")), Size: size("Images", (x) => x.Size || 0) },
      { Type: "Containers", TotalCount: String(containers.length), Size: "" },
      { Type: "Local Volumes", TotalCount: String(count("Volumes")), Size: size("Volumes", (x) => (x.UsageData && x.UsageData.Size) || 0) },
    ]
  })()

  const events = [] // filled by readEvents() in the handler

  return { containers, images, df, stats, events }
}

// events come back as an NDJSON stream
async function readEvents() {
  return new Promise((resolve) => {
    const req = http.request(
      {
        socketPath: SOCKET,
        path: `/v1.41/events?since=${Math.floor(Date.now() / 1000) - 86400}&until=${Math.floor(Date.now() / 1000)}&filters=${encodeURIComponent(
          JSON.stringify({ type: ["container", "image"] })
        )}`,
        timeout: 12000,
      },
      (res) => {
        let body = ""
        res.on("data", (c) => (body += c))
        res.on("end", () => {
          const out = body
            .split("\n")
            .filter(Boolean)
            .map((l) => {
              try {
                const e = JSON.parse(l)
                const attr = (e.Actor && e.Actor.Attributes) || {}
                return {
                  type: e.Type,
                  action: e.Action,
                  name: attr.name || attr.image || attr.container || (e.Actor && e.Actor.ID && e.Actor.ID.slice(0, 12)) || "-",
                  detail: attr.image || "",
                  time: e.time,
                }
              } catch {
                return null
              }
            })
            .filter(Boolean)
            .slice(-40)
            .reverse()
          resolve(out)
        })
      }
    )
    req.on("error", () => resolve([]))
    req.on("timeout", () => {
      req.destroy()
      resolve([])
    })
    req.end()
  })
}

const parseJsonLines = (stdout) =>
  stdout
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((l) => {
      try {
        return JSON.parse(l)
      } catch {
        return null
      }
    })
    .filter(Boolean)

async function tryJson(cmd, timeout = 20000) {
  try {
    const { stdout } = await run(cmd, { timeout, encoding: "utf8" })
    return parseJsonLines(stdout)
  } catch {
    return null
  }
}

function simplifyEvent(e) {
  const attr = (e.Actor && e.Actor.Attributes) || {}
  return {
    type: e.Type,
    action: e.Action,
    name: attr.name || attr.image || attr.container || (e.Actor && e.Actor.ID && e.Actor.ID.slice(0, 12)) || "-",
    detail: attr.image || "",
    time: e.time,
  }
}

async function fromCli() {
  const containers = await tryJson(`docker ps -a --format '{{json .}}'`)
  if (!containers) return null
  const [images, df, stats, rawEvents] = await Promise.all([
    tryJson(`docker images --format '{{json .}}'`),
    tryJson(`docker system df --format '{{json .}}'`),
    tryJson(`docker stats --no-stream --format '{{json .}}'`, 25000),
    tryJson(`docker events --since 24h --until 1s --format '{{json .}}'`, 20000),
  ])
  const events = (rawEvents || []).slice(-40).map(simplifyEvent).reverse()
  return { containers, images: images || [], df: df || [], stats: stats || [], events }
}

function mockResponse() {
  const now = Math.floor(Date.now() / 1000)
  return {
    ok: false,
    mock: true,
    containers: [
      { Names: "gitlab-ce", State: "running", Status: "Up 2 days", Image: "gitlab/gitlab-ce:latest" },
      { Names: "gitlab-runner", State: "running", Status: "Up 2 days", Image: "gitlab/gitlab-runner:latest" },
      { Names: "pfe-vulnerable-app", State: "exited", Status: "Exited (0) 3 days ago", Image: "pfe-vulnerable-app:1.0" },
      { Names: "sentinel-runner", State: "exited", Status: "Exited (0) 4 days ago", Image: "runner:latest" },
    ],
    images: [],
    df: [
      { Type: "Images", TotalCount: "8", Size: "4.2GB" },
      { Type: "Containers", TotalCount: "4", Size: "300MB" },
      { Type: "Local Volumes", TotalCount: "3", Size: "120MB" },
    ],
    stats: [
      { Name: "gitlab-ce", CPUPerc: "1.20%", MemPerc: "6.40%", MemUsage: "980MiB / 15.28GiB" },
      { Name: "gitlab-runner", CPUPerc: "0.10%", MemPerc: "0.90%", MemUsage: "140MiB / 15.28GiB" },
    ],
    events: [
      { type: "container", action: "start", name: "gitlab-ce", detail: "gitlab/gitlab-ce:latest", time: now - 3600 },
      { type: "container", action: "stop", name: "pfe-vulnerable-app", detail: "pfe-vulnerable-app:1.0", time: now - 7200 },
    ],
  }
}

export default async function handler(req, res) {
  try {
    const [socketData, evs] = await Promise.all([fromSocket(), readEvents()])
    if (socketData) {
      const { events: _unused, ...rest } = socketData
      return res.status(200).json({ ok: true, mock: false, source: "socket", events: evs.length ? evs : [], ...rest })
    }
  } catch {
    /* fall through */
  }
  try {
    const cli = await fromCli()
    if (cli) return res.status(200).json({ ok: true, mock: false, source: "cli", ...cli })
  } catch {
    /* fall through */
  }
  return res.status(200).json(mockResponse())
}