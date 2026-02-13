#!/usr/bin/env bash
set -euo pipefail

# ── NodeGuard Agent Installer ─────────────────────────────────────────
# Usage:
#   curl -sSL https://raw.githubusercontent.com/USER/nodeguard/main/scripts/install-agent.sh | sudo bash -s -- --token YOUR_TOKEN
#
# The agent token isolates this server's data to your account.
# ──────────────────────────────────────────────────────────────────────

AGENT_TOKEN=""
API_URL="https://api.nodeguard.io"
INSTALL_DIR="/opt/nodeguard"
BIN_TARGET="/usr/local/bin/node-guardian-agent"
SERVICE_TARGET="/etc/systemd/system/node-guardian-agent.service"
CONFIG_FILE="/etc/nodeguard/agent.conf"

print_banner() {
  echo ""
  echo "  ╔══════════════════════════════════════════╗"
  echo "  ║       🛡️  NodeGuard Agent Installer       ║"
  echo "  ╚══════════════════════════════════════════╝"
  echo ""
}

usage() {
  echo "Usage: $0 --token <AGENT_TOKEN> [--api-url <URL>]"
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --token)  AGENT_TOKEN="$2"; shift 2 ;;
    --api-url) API_URL="$2"; shift 2 ;;
    *) usage ;;
  esac
done

if [[ -z "$AGENT_TOKEN" ]]; then
  echo "ERROR: --token is required."
  usage
fi

print_banner

echo "[1/5] Checking dependencies..."
for cmd in curl systemctl; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "ERROR: $cmd is required but not found."
    exit 1
  fi
done

echo "[2/5] Creating directories..."
mkdir -p "$INSTALL_DIR" /etc/nodeguard

echo "[3/5] Writing configuration..."
cat > "$CONFIG_FILE" <<EOF
# NodeGuard Agent Configuration
AGENT_TOKEN=${AGENT_TOKEN}
API_URL=${API_URL}
HEARTBEAT_INTERVAL=30
LOG_LEVEL=info
EOF
chmod 600 "$CONFIG_FILE"

echo "[4/5] Downloading agent binary..."
ARCH=$(uname -m)
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
DOWNLOAD_URL="https://github.com/YOUR_USER/nodeguard/releases/latest/download/node-guardian-agent-${OS}-${ARCH}"

if curl -fsSL -o "$BIN_TARGET" "$DOWNLOAD_URL" 2>/dev/null; then
  chmod 755 "$BIN_TARGET"
else
  echo "WARN: Could not download binary from releases. Trying local build..."
  if [[ -f "$INSTALL_DIR/node-guardian-agent" ]]; then
    cp "$INSTALL_DIR/node-guardian-agent" "$BIN_TARGET"
    chmod 755 "$BIN_TARGET"
  else
    echo "ERROR: No binary available. Build from source or check releases."
    exit 1
  fi
fi

echo "[5/5] Configuring systemd service..."
cat > "$SERVICE_TARGET" <<EOF
[Unit]
Description=NodeGuard Agent
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
EnvironmentFile=${CONFIG_FILE}
ExecStart=${BIN_TARGET}
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable node-guardian-agent
systemctl restart node-guardian-agent

echo ""
echo "  ✅ NodeGuard Agent installed and running!"
echo "  📋 Config: ${CONFIG_FILE}"
echo "  🔑 Token:  ${AGENT_TOKEN:0:12}..."
echo "  🔗 API:    ${API_URL}"
echo ""
echo "  Check status: systemctl status node-guardian-agent"
echo ""
