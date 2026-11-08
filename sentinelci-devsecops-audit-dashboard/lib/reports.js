// SentinelCI audit artifacts (mirrors PFE-DevSecOps/reports/baseline)
export const BASELINE_REPORTS = [
  { tool: "gitleaks", stage: "secrets", file: "gitleaks-baseline.json", size: "4.2 KB", date: "Nov 06, 2026", entries: 3 },
  { tool: "semgrep", stage: "sast", file: "semgrep-baseline.json", size: "38.7 KB", date: "Nov 06, 2026", entries: 5 },
  { tool: "hadolint", stage: "lint", file: "hadolint-baseline.json", size: "1.9 KB", date: "Nov 06, 2026", entries: 4 },
  { tool: "syft", stage: "sbom", file: "syft-baseline.json", size: "112.4 KB", date: "Nov 06, 2026", entries: 142 },
  { tool: "dockle", stage: "image-scan", file: "dockle-baseline.json", size: "2.3 KB", date: "Nov 06, 2026", entries: 8 },
  { tool: "cosign", stage: "sign", file: "cosign-baseline.sigstore.json", size: "6.8 KB", date: "Nov 06, 2026", entries: 1 },
  { tool: "trivy", stage: "image-scan", file: "trivy-image-report.json", size: "64.1 KB", date: "Nov 06, 2026", entries: 6 },
  { tool: "grype", stage: "vuln", file: "grype-baseline.json", size: "51.9 KB", date: "Nov 06, 2026", entries: 5 },
]

const TOOL_BY_PREFIX = {
  cosign: "cosign",
  dockle: "dockle",
  gitleaks: "gitleaks",
  semgrep: "semgrep",
  syft: "syft",
  "trivy-image": "trivy",
  "trivy-fs": "trivy",
  "trivy-config": "trivy",
  grype: "grype",
  hadolint: "hadolint",
  sbom: "syft",
}

export function toolFromFile(fileName) {
  const base = fileName.replace(/-report|-baseline|.sigstore/, "")
  for (const prefix of Object.keys(TOOL_BY_PREFIX)) {
    if (base.startsWith(prefix)) {
      if (prefix.includes("-files")) continue
      if (base.startsWith("trivy")) return "trivy"
      if (base.startsWith("sbom")) return "syft"
      return TOOL_BY_PREFIX[prefix]
    }
  }
  return null
}