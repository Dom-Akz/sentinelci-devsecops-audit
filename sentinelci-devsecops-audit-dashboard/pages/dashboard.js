import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/router"
import { TOOLS } from "../lib/tools"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts"

const TOOL_ICONS = {
  gitleaks: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.5 8.5a3.5 3.5 0 1 0-6.66 1.47L3 15.82V18a1 1 0 0 0 1 1h2.18l1.5-1.5v-2h2v-2h2l1.16-1.16A3.5 3.5 0 0 0 15.5 8.5z"/><circle cx="15" cy="9" r="1" fill="currentColor" stroke="none"/></svg>
  ),
  semgrep: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8 8l-4 4 4 4m8-8 4 4-4 4m-3-9-2 10"/></svg>
  ),
  hadolint: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8z"/><path strokeLinecap="round" d="M7 8V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v3M8 4V2m4 2V2m4 2V2"/></svg>
  ),
  syft: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8l-9-5-9 5v8l9 5 9-5V8z"/><path strokeLinecap="round" strokeLinejoin="round" d="M3.3 8.3 12 13l8.7-4.7M12 13v9"/></svg>
  ),
  trivy: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3l8 3.5v5.1c0 4.6-3.2 8-8 9.9-4.8-1.9-8-5.3-8-9.9V6.5L12 3z"/><path strokeLinecap="round" d="M8.5 12l2.5 2.5 4.5-4.5"/></svg>
  ),
  grype: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 9l2.5 2.5M12.5 11.5 11 20l3.5-5 5-2.5L12.5 11.5z"/><path strokeLinecap="round" d="M8 15a5 5 0 0 1-4.54-7.14A5 5 0 0 1 7.14 3.46 5 5 0 0 1 14 4h.09A5 5 0 0 1 19.4 8a5 5 0 0 1-1.4 7"/></svg>
  ),
  dockle: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="w-4 h-4"><rect x="4" y="4" width="16" height="16" rx="2"/><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4"/></svg>
  ),
  cosign: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
  ),
  "pre-commit": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="w-4 h-4"><circle cx="6" cy="5" r="2.5"/><circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="12" r="2.5"/><path strokeLinecap="round" d="M6 7.5v9M8.5 5h4a3 3 0 0 1 3 3v1.6M15.5 11.4V15a3 3 0 0 1-3 3h-4"/></svg>
  ),
}

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="w-4 h-4"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
  )},
  ...TOOLS.map((t) => ({
    label: t.name,
    href: `/tools/${t.slug}`,
    binary: t.binary,
    version: t.version,
    icon: TOOL_ICONS[t.slug] || (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="w-4 h-4"><circle cx="12" cy="12" r="9"/></svg>
    ),
  })),
  { label: "Reports", href: "/reports", icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8 3h8l4 4v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5"/></svg>
  )},
]

const SUPPORT_ITEMS = [
  { label: "Settings", icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="w-4 h-4"><circle cx="12" cy="12" r="3"/><path strokeLinecap="round" d="M12 2v3m0 14v3M2 12h3m14 0h3M4.9 4.9l2.1 2.1m10 10 2.1 2.1M19.1 4.9 17 7m-10 10-2.1 2.1"/></svg>
  )},
  { label: "Security", icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3l8 3.5v5.1c0 4.6-3.2 8-8 9.9-4.8-1.9-8-5.3-8-9.9V6.5L12 3z"/></svg>
  )},
  { label: "Help Center", icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="w-4 h-4"><circle cx="12" cy="12" r="9"/><path strokeLinecap="round" strokeLinejoin="round" d="M9.5 9a2.5 2.5 0 1 1 3.5 2.4c-.7.3-1 1-1 1.6v.5m0 3v.01"/></svg>
  )},
]

const ACTION_COLORS = {
  start: "#10b981",
  stop: "#f87171",
  die: "#ef4444",
  destroy: "#ef4444",
  create: "#60a5fa",
  pull: "#60a5fa",
  tag: "#60a5fa",
  build: "#60a5fa",
  kill: "#f97316",
  exec_start: "#10b981",
  connect: "#818cf8",
  prune: "#f59e0b",
}

const pctNum = (s) => parseFloat(String(s || "0").replace("%", "")) || 0

function timeAgo(sec) {
  const diff = Math.max(0, Math.floor(Date.now() / 1000 - Number(sec)))
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

const TooltipBox = ({ active, payload, label, unit }) => {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="bg-[#131615] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-[11px]">
      <p className="text-gray-400">{label}</p>
      <p className="text-white font-semibold">{payload[0].value}{unit}</p>
    </div>
  )
}

export default function Dashboard() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [docker, setDocker] = useState(null)
  const [reports, setReports] = useState(null)
  const router = useRouter()

  const load = async () => {
    setLoading(true)
    try {
      const [d, r] = await Promise.all([
        fetch("/api/docker/stats").then((x) => x.json()),
        fetch("/api/reports/latest").then((x) => x.json()),
      ])
      setDocker(d)
      setReports(r)
    } catch {
      /* keep previous */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      window.location.href = "/"
      return
    }
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) load()
  }, [mounted])

  if (!mounted || !docker) {
    return <div className="min-h-screen bg-[#050606]" />
  }

  const containers = docker.containers || []
  const running = containers.filter((c) => String(c.Status || c.State || "").startsWith("Up")).length
  const stopped = containers.length - running
  const totalImages = (docker.df || []).find((d) => d.Type === "Images")

  const stateRows = [
    running > 0 && { name: "Running", value: running, color: "#10b981" },
    stopped > 0 && { name: "Exited", value: stopped, color: "#f59e0b" },
  ].filter(Boolean)

  const cpuRows = (docker.stats || [])
    .map((s) => ({ name: s.Name, cpu: pctNum(s.CPUPerc), mem: pctNum(s.MemPerc) }))
    .sort((a, b) => b.cpu - a.cpu)
    .slice(0, 6)

  const events = (docker.events || []).slice(0, 10)
  const latestReports = (reports && reports.reports ? reports.reports : []).slice(0, 5)

  return (
    <div className="min-h-screen bg-[#050606] p-3 md:p-5 font-sans text-[#e7e9ec] relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/3 w-[600px] h-[300px] bg-emerald-600/[0.05] rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-emerald-700/[0.04] rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-[1100px] mx-auto bg-[#0A0B0A] rounded-2xl border border-white/[0.06] p-3 flex flex-col lg:flex-row gap-3 shadow-[0_0_90px_rgba(16,185,129,0.06)]">

        {/* ───────────── Sidebar ───────────── */}
        <aside className="lg:w-[215px] shrink-0 bg-[#0D0F0E] rounded-xl border border-white/[0.07] p-3 flex flex-col">
          {/* Logo card */}
          <div className="flex items-center justify-between border border-white/[0.07] rounded-xl p-2 bg-[#101312]">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 via-emerald-500 to-green-600 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="white"><path d="M12 2L4 5.5v6.1c0 4.9 3.4 8.4 8 10.4 4.6-2 8-5.5 8-10.4V5.5L12 2zm-1.2 13.6l-3.2-3.2 1.4-1.4 1.8 1.8 4.6-4.6 1.4 1.4-6 6z"/></svg>
              </div>
              <div>
                <p className="text-[12.5px] font-semibold leading-tight text-white">SentinelCI</p>
                <p className="text-[10.5px] text-gray-500">Standard Plan</p>
              </div>
            </div>
            <button className="text-gray-500 hover:text-gray-300 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6"/></svg>
            </button>
          </div>

          {/* Nav */}
          <nav className="mt-4 space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = router.pathname === item.href
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  title={item.binary ? `${item.binary} ${item.version || ""}` : item.label}
                  className={
                    active
                      ? "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] font-medium bg-white/[0.05] border border-white/[0.08] text-white"
                      : "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] text-gray-500 hover:bg-white/[0.03] hover:text-gray-300 transition-colors"
                  }
                >
                  <span className={active ? "text-emerald-400" : "text-gray-600"}>{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Support at bottom */}
          <div className="mt-auto pt-6">
            <p className="px-3 text-[9.5px] font-medium tracking-widest text-gray-600 uppercase">Support</p>
            <div className="mt-2 space-y-1">
              {SUPPORT_ITEMS.map((item) => (
                <a
                  key={item.label}
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] text-gray-500 hover:bg-white/[0.03] hover:text-gray-300 transition-colors"
                >
                  <span className="text-gray-600">{item.icon}</span>
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </aside>

        {/* ───────────── Main ───────────── */}
        <main className="flex-1 min-w-0 flex flex-col gap-3">

          {/* Topbar */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 max-w-xs flex items-center gap-2 bg-[#0D0F0E] border border-white/[0.07] rounded-lg px-3 py-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="w-3.5 h-3.5 text-gray-600"><circle cx="11" cy="11" r="7"/><path strokeLinecap="round" d="m20 20-3.5-3.5"/></svg>
              <input className="bg-transparent outline-none text-[12px] flex-1 placeholder:text-gray-600" placeholder="Scan Scan" readOnly />
              <span className="text-gray-600"><svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><circle cx="12" cy="12" r="1.6"/><circle cx="5" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg></span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-emerald-700/60 border-2 border-[#0D0F0E] flex items-center justify-center text-[8px] font-bold text-emerald-300">AD</div>
                <div className="w-6 h-6 rounded-full bg-gray-700 border-2 border-[#0D0F0E] flex items-center justify-center text-[8px] font-bold text-gray-300">RS</div>
              </div>
              <button className="bg-[#131615] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-[11px] text-gray-300 hover:bg-[#181b19] transition-colors">Share</button>
              <button className="w-7 h-7 flex items-center justify-center rounded-lg border border-white/[0.08] bg-[#131615] text-gray-400 hover:text-gray-200 transition-colors">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/></svg>
              </button>
            </div>
          </div>

          {/* Header row */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-[15px] font-semibold text-white">Docker &amp; Pipeline Overview</h1>
              <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1.5">
                Live status of the local Docker engine, container activity and audit artifacts
                {docker.mock && <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px]">demo data</span>}
              </p>
            </div>
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-1.5 bg-[#131615] border border-white/[0.08] rounded-lg px-3 py-1.5 text-[11.5px] text-gray-300 hover:bg-[#181b19] transition-colors disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-3 h-3 ${loading ? "animate-spin" : ""}`}><path strokeLinecap="round" strokeLinejoin="round" d="M20 12a8 8 0 1 1-2.3-5.6L20 8.5M20 4v4.5H15.5"/></svg>
              Refresh
            </button>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-[#0D0F0E] border border-white/[0.07] rounded-xl p-3">
              <div className="flex items-center justify-between">
                <p className="text-[11.5px] text-gray-500">Running Containers</p>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              </div>
              <p className="mt-1.5 text-[20px] font-semibold text-white">{running}</p>
              <p className="text-[10px] text-gray-600 mt-0.5">of {containers.length} total</p>
            </div>
            <div className="bg-[#0D0F0E] border border-white/[0.07] rounded-xl p-3">
              <div className="flex items-center justify-between">
                <p className="text-[11.5px] text-gray-500">Exited / Stopped</p>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
              </div>
              <p className="mt-1.5 text-[20px] font-semibold text-white">{stopped}</p>
              <p className="text-[10px] text-gray-600 mt-0.5">docker ps -a</p>
            </div>
            <div className="bg-[#0D0F0E] border border-white/[0.07] rounded-xl p-3">
              <div className="flex items-center justify-between">
                <p className="text-[11.5px] text-gray-500">Docker Images</p>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              </div>
              <p className="mt-1.5 text-[20px] font-semibold text-white">{totalImages ? totalImages.TotalCount : "—"}</p>
              <p className="text-[10px] text-gray-600 mt-0.5">{totalImages ? totalImages.Size : ""}</p>
            </div>
            <div className="bg-[#0D0F0E] border border-white/[0.07] rounded-xl p-3">
              <div className="flex items-center justify-between">
                <p className="text-[11.5px] text-gray-500">Actions (24h)</p>
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
              </div>
              <p className="mt-1.5 text-[20px] font-semibold text-white">{(docker.events || []).length}</p>
              <p className="text-[10px] text-gray-600 mt-0.5">docker events</p>
            </div>
          </div>

          {/* Charts row */}
          <div className="grid lg:grid-cols-2 gap-3">
            <div className="bg-[#0D0F0E] border border-white/[0.07] rounded-xl p-3">
              <div className="flex items-center justify-between">
                <p className="text-[12.5px] font-semibold text-white">Container States</p>
                <Link href="/tools/trivy" className="text-[10.5px] text-emerald-400 hover:text-emerald-300">Scan images →</Link>
              </div>
              {stateRows.length > 0 ? (
                <div className="flex items-center gap-3 mt-1">
                  <ResponsiveContainer width="55%" height={160}>
                    <PieChart>
                      <Pie data={stateRows} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={4} stroke="none">
                        {stateRows.map((s) => <Cell key={s.name} fill={s.color} />)}
                      </Pie>
                      <Tooltip content={<TooltipBox label="containers" />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-1.5">
                    {stateRows.map((s) => (
                      <div key={s.name} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-[3px]" style={{ backgroundColor: s.color }} />
                        <span className="text-[11.5px] text-gray-400 flex-1">{s.name}</span>
                        <span className="text-[12px] font-semibold text-white">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-gray-600 mt-8 text-center">No containers found</p>
              )}
            </div>

            <div className="bg-[#0D0F0E] border border-white/[0.07] rounded-xl p-3">
              <div className="flex items-center justify-between">
                <p className="text-[12.5px] font-semibold text-white">Container Resource Usage</p>
                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-[2px] bg-emerald-400" /> CPU %</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-[2px] bg-blue-400" /> Mem %</span>
                </div>
              </div>
              {cpuRows.length > 0 ? (
                <ResponsiveContainer width="100%" height={170}>
                  <BarChart data={cpuRows} margin={{ top: 10, right: 4, left: -20, bottom: -6 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#565b5e", fontSize: 9 }}
                      tickFormatter={(n) => (String(n).length > 11 ? `${String(n).slice(0, 11)}…` : n)}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                      height={28}
                    />
                    <YAxis tick={{ fill: "#565b5e", fontSize: 9 }} axisLine={false} tickLine={false} unit="%" />
                    <Tooltip
                      cursor={{ fill: "rgba(255,255,255,0.03)" }}
                      content={({ active, payload, label }) => {
                        if (!active || !payload || !payload.length) return null
                        return (
                          <div className="bg-[#131615] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-[11px]">
                            <p className="text-gray-400 mb-0.5">{label}</p>
                            {payload.map((p) => (
                              <p key={p.dataKey} className="text-white">
                                <span className="text-gray-500">{p.dataKey === "cpu" ? "CPU" : "Memory"}: </span>
                                {p.value}%
                              </p>
                            ))}
                          </div>
                        )
                      }}
                    />
                    <Bar dataKey="cpu" name="CPU %" fill="url(#cpuGrad)" radius={[4, 4, 0, 0]} maxBarSize={22} />
                    <Bar dataKey="mem" name="Mem %" fill="#60a5fa" radius={[4, 4, 0, 0]} maxBarSize={22} />
                    <defs>
                      <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[170px] flex flex-col items-center justify-center gap-1">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#374145" strokeWidth="1.5" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                  <p className="text-[11px] text-gray-600">No running containers — start one to see live usage</p>
                </div>
              )}
            </div>
          </div>

          {/* Activity history + latest reports */}
          <div className="grid lg:grid-cols-2 gap-3">
            <div className="bg-[#0D0F0E] border border-white/[0.07] rounded-xl p-3">
              <div className="flex items-center justify-between">
                <p className="text-[12.5px] font-semibold text-white">Docker Activity (24h)</p>
                <span className="text-[10.5px] text-gray-600">{(docker.events || []).length} events</span>
              </div>
              <div className="mt-1.5 divide-y divide-white/[0.04]">
                {events.length === 0 && <p className="text-[11px] text-gray-600 mt-6 text-center">No recent activity</p>}
                {events.map((e, i) => (
                  <div key={`${e.time}-${i}`} className="flex items-center gap-2.5 py-2">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: ACTION_COLORS[e.action] || ACTION_COLORS[e.type] || "#6b7280" }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11.5px] text-gray-300 truncate">
                        <span className="text-gray-100 font-medium">{e.action}</span>
                        <span className="text-gray-600"> · </span>
                        <span className="text-gray-400">{e.type}</span>
                      </p>
                      <p className="text-[10.5px] text-gray-600 truncate">{e.name}</p>
                    </div>
                    <span className="text-[10.5px] text-gray-600 shrink-0">{timeAgo(e.time)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0D0F0E] border border-white/[0.07] rounded-xl p-3">
              <div className="flex items-center justify-between">
                <p className="text-[12.5px] font-semibold text-white">Latest Reports</p>
                <Link href="/reports" className="text-[10.5px] text-emerald-400 hover:text-emerald-300">View all →</Link>
              </div>
              <div className="mt-1.5 divide-y divide-white/[0.04]">
                {latestReports.length === 0 && <p className="text-[11px] text-gray-600 mt-6 text-center">No reports yet</p>}
                {latestReports.map((r) => (
                  <div key={r.file} className="flex items-center gap-2.5 py-2.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#131615] border border-white/[0.08] text-emerald-400 shrink-0">{r.tool}</span>
                    <p className="flex-1 min-w-0 text-[11.5px] font-mono text-gray-300 truncate">{r.file}</p>
                    <span className="text-[10.5px] text-gray-600 whitespace-nowrap">{r.size} · {r.date}</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="w-3.5 h-3.5 text-gray-600 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}