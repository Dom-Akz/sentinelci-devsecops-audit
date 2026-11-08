import React, { useState, useEffect } from "react"
import Link from "next/link"
import { TOOLS } from "../../lib/tools"

const SEV_STYLES = {
  Critical: "bg-red-500/10 text-red-400",
  High: "bg-orange-500/10 text-orange-400",
  Warning: "bg-amber-500/10 text-amber-400",
  Medium: "bg-amber-500/10 text-amber-400",
  Verified: "bg-emerald-500/10 text-emerald-400",
}

export default function ToolPage({ slug }) {
  const [mounted, setMounted] = useState(false)
  const tool = TOOLS.find((t) => t.slug === slug)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      window.location.href = "/"
      return
    }
    setMounted(true)
  }, [])

  if (!tool) {
    return (
      <div className="min-h-screen bg-[#050606] flex items-center justify-center">
        <p className="text-gray-500 text-sm">Tool not found. <Link href="/dashboard" className="text-emerald-400">Back to dashboard</Link></p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050606] p-3 md:p-5 font-sans text-[#e7e9ec] relative overflow-hidden">
      <div className="absolute top-0 left-1/3 w-[600px] h-[300px] bg-emerald-600/[0.05] rounded-full blur-[130px] pointer-events-none" />

      <div className="relative max-w-[1100px] mx-auto flex flex-col gap-3">
        {/* Topbar */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-[12px] text-gray-400 hover:text-gray-200 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
            Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <button className="bg-emerald-600 text-white text-[12px] font-semibold rounded-lg px-3 py-1.5 hover:bg-emerald-500 transition-colors shadow-[0_0_18px_rgba(16,185,129,0.3)]">
              Run Scan
            </button>
          </div>
        </div>

        {/* Header card */}
        <div className="bg-[#0A0B0A] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-11 h-11 rounded-xl bg-[#101312] border border-emerald-500/20 flex items-center justify-center shadow-[0_0_25px_rgba(16,185,129,0.15)]">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="#34d399" strokeWidth="1.7"><path strokeLinecap="round" strokeLinejoin="round" d="M14.7 6.3a4 4 0 1 0-5.28 5.28L3 18v3h3l8.42-8.42A4 4 0 0 0 14.7 6.3z"/></svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-[16px] font-semibold text-white">{tool.name}</h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#131615] border border-white/[0.08] text-gray-400">
                  CI stage: {tool.stage}
                </span>
              </div>
              <p className="text-[12px] text-gray-500 mt-1">{tool.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2.5 py-1 rounded-lg bg-[#131615] border border-white/[0.08] text-emerald-400 font-medium">
                {tool.binary} v{tool.version}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {tool.stats.map((s) => (
            <div key={s.label} className="bg-[#0A0B0A] border border-white/[0.06] rounded-xl p-3">
              <div className="flex items-center justify-between">
                <p className="text-[11.5px] text-gray-500">{s.label}</p>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
              </div>
              <p className="mt-1.5 text-[18px] font-semibold text-white">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Findings table */}
        <div className="bg-[#0A0B0A] border border-white/[0.06] rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <p className="text-[12.5px] font-semibold text-white">Latest Findings</p>
            <span className="text-[10.5px] text-gray-600">Last run: pipeline #128</span>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-[11.5px]">
              <thead>
                <tr className="bg-[#131615] text-gray-500">
                  {tool.columns.map((c) => (
                    <th key={c} className="font-medium text-left px-3 py-2">{c}</th>
                  ))}
                  <th className="px-3 py-2 w-8" />
                </tr>
              </thead>
              <tbody>
                {tool.findings.map((f, i) => (
                  <tr key={f.id || i} className="border-t border-white/[0.05]">
                    <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{f.id}</td>
                    <td className="px-3 py-2.5 text-gray-300">{f.type}</td>
                    {(tool.columns.includes("Line") || tool.columns.includes("Version")) && (
                      <td className="px-3 py-2.5 text-gray-500">{f.file ? `${f.file}:${f.line}` : f.version}</td>
                    )}
                    {tool.columns.includes("Fixed Version") && (
                      <td className="px-3 py-2.5 text-gray-500">{f.license || f.version}</td>
                    )}
                    {tool.columns.includes("Severity") ? (
                      <td className="px-3 py-2.5">
                        <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-medium ${SEV_STYLES[f.severity] || "bg-white/[0.06] text-gray-400"}`}>
                          {f.severity}
                        </span>
                      </td>
                    ) : (
                      <td className="px-3 py-2.5 text-gray-500">{f.severity}</td>
                    )}
                    <td className="px-3 py-2.5 text-gray-700">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></svg>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-[10.5px] text-gray-600">
            Showing {tool.findings.length} of {tool.findings.length} findings
          </p>
        </div>
      </div>
    </div>
  )
}

export async function getServerSideProps({ params }) {
  return { props: { slug: params.tool } }
}