#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
TOOLS_FILE="$ROOT_DIR/security/tools.txt"

INSTALL_DIR="${INSTALL_DIR:-/usr/local/bin}"
mkdir -p "$INSTALL_DIR" 2>/dev/null || true
if [ ! -w "$INSTALL_DIR" ]; then
  INSTALL_DIR="$HOME/.local/bin"
fi
mkdir -p "$INSTALL_DIR"

FORCE="${FORCE:-0}"

ARCH="$(uname -m)"
case "$ARCH" in
  x86_64|amd64)
    GOARCH=amd64
    TRIVY_ARCH=64bit
    HADOLINT_ARCH=x86_64
    DOCKLE_ARCH=64bit
    GITLEAKS_ARCH=x64
    ;;
  aarch64|arm64)
    GOARCH=arm64
    TRIVY_ARCH=ARM64
    HADOLINT_ARCH=arm64
    DOCKLE_ARCH=ARM64
    GITLEAKS_ARCH=arm64
    ;;
  *)
    echo "Unsupported architecture: $ARCH" >&2
    exit 1
    ;;
esac

declare -A VER
while IFS='=' read -r key value; do
  [[ -z "$key" || "$key" == \#* || "$key" == \[* ]] && continue
  VER["$key"]="$value"
done < "$TOOLS_FILE"

have() { command -v "$1" >/dev/null 2>&1; }

install_binary() {
  local name="$1" url="$2" binary="$3" tmp
  if [ "$FORCE" != "1" ] && have "$binary"; then
    echo "[skip] $name already installed ($(command -v "$binary"))"
    return
  fi
  echo "[install] $name -> $INSTALL_DIR/$binary"
  tmp="$(mktemp -d)"
  curl -fsSL "$url" -o "$tmp/archive.tar.gz"
  tar -xzf "$tmp/archive.tar.gz" -C "$tmp"
  install -m 0755 "$tmp/$binary" "$INSTALL_DIR/$binary"
  rm -rf "$tmp"
}

install_raw_binary() {
  local name="$1" url="$2" binary="$3" tmp
  if [ "$FORCE" != "1" ] && have "$binary"; then
    echo "[skip] $name already installed ($(command -v "$binary"))"
    return
  fi
  echo "[install] $name -> $INSTALL_DIR/$binary"
  tmp="$(mktemp)"
  curl -fsSL "$url" -o "$tmp"
  install -m 0755 "$tmp" "$INSTALL_DIR/$binary"
  rm -f "$tmp"
}

install_pip() {
  local name="$1" version="$2"
  if [ "$FORCE" != "1" ] && have "$name"; then
    echo "[skip] $name already installed ($(command -v "$name"))"
    return
  fi
  echo "[install] $name==$version via pip"
  python3 -m pip install --user --upgrade "$name==$version"
}

install_binary "gitleaks" \
  "https://github.com/gitleaks/gitleaks/releases/download/v${VER[gitleaks]}/gitleaks_${VER[gitleaks]}_linux_${GITLEAKS_ARCH}.tar.gz" \
  "gitleaks"

install_binary "trivy" \
  "https://github.com/aquasecurity/trivy/releases/download/v${VER[trivy]}/trivy_${VER[trivy]}_Linux-${TRIVY_ARCH}.tar.gz" \
  "trivy"

install_binary "syft" \
  "https://github.com/anchore/syft/releases/download/v${VER[syft]}/syft_${VER[syft]}_linux_${GOARCH}.tar.gz" \
  "syft"

install_binary "grype" \
  "https://github.com/anchore/grype/releases/download/v${VER[grype]}/grype_${VER[grype]}_linux_${GOARCH}.tar.gz" \
  "grype"

install_raw_binary "cosign" \
  "https://github.com/sigstore/cosign/releases/download/v${VER[cosign]}/cosign-linux-${GOARCH}" \
  "cosign"

install_raw_binary "hadolint" \
  "https://github.com/hadolint/hadolint/releases/download/v${VER[hadolint]}/hadolint-Linux-${HADOLINT_ARCH}" \
  "hadolint"

install_binary "dockle" \
  "https://github.com/goodwithtech/dockle/releases/download/v${VER[dockle]}/dockle_${VER[dockle]}_Linux-${DOCKLE_ARCH}.tar.gz" \
  "dockle"

install_pip "semgrep" "${VER[semgrep]}"
install_pip "pre-commit" "${VER[pre-commit]}"

echo
echo "Done. Installed binaries are in: $INSTALL_DIR"
case ":$PATH:" in
  *":$INSTALL_DIR:"*) ;;
  *) echo "Add it to PATH: export PATH=\"$INSTALL_DIR:\$PATH\"" ;;
esac
