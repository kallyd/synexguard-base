#!/usr/bin/env bash
set -euo pipefail

# ── SynexGuard Agent Installer ─────────────────────────────────────────
# Usage:
#   curl -sSL https://raw.githubusercontent.com/kallyd/synexguard/main/scripts/install-agent.sh | sudo bash -s -- --token YOUR_TOKEN
#
# The agent token isolates this server's data to your account.
# ──────────────────────────────────────────────────────────────────────

AGENT_TOKEN=""
API_URL="https://api-synexguard.synexsoft.com.br"
INSTALL_DIR="/opt/synexguard"
BIN_TARGET="/usr/local/bin/synexguard-agent"  # legacy, not used anymore
SERVICE_TARGET="/etc/systemd/system/synexguard-agent.service"
CONFIG_FILE="/etc/synexguard/agent.conf"

print_banner() {
  echo ""
  echo "  ╔══════════════════════════════════════════╗"
  echo "  ║       🛡️  SynexGuard Agent Installer       ║"
  echo "  ╚══════════════════════════════════════════╝"
  echo ""
}

usage() {
  echo "Usage: $0 --token <AGENT_TOKEN>"
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --token)  AGENT_TOKEN="$2"; shift 2 ;;
    *) usage ;;
  esac
done

if [[ -z "$AGENT_TOKEN" ]]; then
  echo "ERROR: --token is required."
  usage
fi

print_banner

echo "[1/5] Checking dependencies..."
for cmd in curl systemctl python3 pip3; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "ERROR: $cmd is required but not found."
    exit 1
  fi
done

echo "[2/5] Creating directories..."
mkdir -p "$INSTALL_DIR" /etc/synexguard

echo "[3/5] Writing configuration..."
cat > "$CONFIG_FILE" <<EOF
# SynexGuard Agent Configuration
AGENT_TOKEN=${AGENT_TOKEN}
API_URL=${API_URL}
HEARTBEAT_INTERVAL=2
LOG_LEVEL=info
EOF
chmod 600 "$CONFIG_FILE"

echo "[4/5] Installing Python agent (requests, psutil)..."
pip3 install --quiet --upgrade requests psutil || {
  echo "ERROR: Failed to install Python dependencies (requests, psutil)."
  exit 1
}

cat > "${INSTALL_DIR}/agent.py" <<'EOF'
#!/usr/bin/env python3
import json
import os
import socket
import time
import platform

import psutil
import requests


CONFIG_FILE = "/etc/synexguard/agent.conf"


def load_config() -> dict:
  cfg: dict[str, str] = {"HEARTBEAT_INTERVAL": "2"}
  if not os.path.exists(CONFIG_FILE):
    return cfg
  with open(CONFIG_FILE, "r", encoding="utf-8") as f:
    for line in f:
      line = line.strip()
      if not line or line.startswith("#") or "=" not in line:
        continue
      k, v = line.split("=", 1)
      cfg[k.strip()] = v.strip()
  return cfg


def get_public_ip() -> str:
  try:
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.settimeout(2.0)
    s.connect(("8.8.8.8", 80))
    ip = s.getsockname()[0]
    s.close()
    return ip
  except Exception:
    return "0.0.0.0"


def format_uptime(seconds: float) -> str:
  seconds = int(seconds)
  days, rem = divmod(seconds, 86400)
  hours, rem = divmod(rem, 3600)
  minutes, _ = divmod(rem, 60)
  if days > 0:
    return f"{days}d {hours}h {minutes}m"
  if hours > 0:
    return f"{hours}h {minutes}m"
  return f"{minutes}m"


def collect_payload() -> dict:
  hostname = socket.gethostname()
  ip_publico = get_public_ip()
  try:
    os_info = platform.platform()
  except Exception:
    os_info = "Linux"

  cpu = psutil.cpu_percent(interval=0.5)
  ram = psutil.virtual_memory().percent
  disk = psutil.disk_usage("/").percent

  boot_time = psutil.boot_time()
  uptime_seconds = time.time() - boot_time

  conns = len(psutil.net_connections())
  open_ports = sorted(
    {c.laddr.port for c in psutil.net_connections() if c.status == psutil.CONN_LISTEN and c.laddr}
  )

  interfaces = []
  for name, stats in psutil.net_io_counters(pernic=True).items():
    if name == "lo":
      continue
    interfaces.append(
      {
        "name": name,
        "rx_bytes": int(stats.bytes_recv),
        "tx_bytes": int(stats.bytes_sent),
      }
    )

  return {
    "hostname": hostname,
    "ip_publico": ip_publico,
    "os_info": os_info,
    "cpu": round(cpu, 1),
    "ram": round(ram, 1),
    "disk": round(disk, 1),
    "uptime": format_uptime(uptime_seconds),
    "conns": conns,
    "open_ports": open_ports,
    "interfaces": interfaces,
    "login_attempts": [],
    "events": [],
  }


def main() -> None:
  cfg = load_config()
  token = (
    os.getenv("NG_AGENT_TOKEN")
    or os.getenv("AGENT_TOKEN")
    or cfg.get("AGENT_TOKEN", "")
  )
  api_url = (
    os.getenv("NG_API_URL")
    or os.getenv("API_URL")
    or cfg.get("API_URL", "")
  )

  interval_str = cfg.get("HEARTBEAT_INTERVAL", "2")
  try:
    interval = float(interval_str)
  except ValueError:
    interval = 2.0
  if interval <= 0:
    interval = 2.0

  if not token or not api_url:
    print("[synexguard-agent] ERROR: missing AGENT_TOKEN or API_URL in config")
    time.sleep(10)
    return

  url = api_url.rstrip("/") + "/api/v1/agents/heartbeat"
  session = requests.Session()

  print(
    f"[synexguard-agent] started — api={api_url} interval={interval}s hostname={socket.gethostname()}"
  )

  while True:
    try:
      payload = collect_payload()
      resp = session.post(
        url,
        headers={"X-Agent-Token": token, "Content-Type": "application/json"},
        data=json.dumps(payload),
        timeout=10,
      )
      if resp.status_code >= 300:
        print(
          f"[synexguard-agent] heartbeat failed: HTTP {resp.status_code} {resp.text[:200]}"
        )
    except Exception as exc:  # noqa: BLE001
      print(f"[synexguard-agent] heartbeat error: {exc}")

    time.sleep(interval)


if __name__ == "__main__":
  main()
EOF

chmod 755 "${INSTALL_DIR}/agent.py"

echo "[5/5] Configuring systemd service..."
cat > "$SERVICE_TARGET" <<EOF
[Unit]
Description=SynexGuard Agent
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
EnvironmentFile=${CONFIG_FILE}
ExecStart=/usr/bin/env python3 ${INSTALL_DIR}/agent.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable synexguard-agent
systemctl restart synexguard-agent

echo ""
echo "  ✅ SynexGuard Agent installed and running!"
echo "  📋 Config: ${CONFIG_FILE}"
echo "  🔑 Token:  ${AGENT_TOKEN:0:12}..."
echo "  🔗 API:    ${API_URL}"
echo ""
echo "  Check status: systemctl status synexguard-agent"
echo ""
