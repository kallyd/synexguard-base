"""
Centralized in-memory data store for SynexGuard.

All modules import from here so data is shared across routers.
This replaces scattered _fake / hardcoded lists.
"""

from __future__ import annotations
from datetime import datetime, timezone
from typing import Any

# ── Helpers ───────────────────────────────────────────────────────────
_counters: dict[str, int] = {}


def next_id(collection: str) -> int:
    _counters[collection] = _counters.get(collection, 0) + 1
    return _counters[collection]


def now() -> datetime:
    return datetime.now(timezone.utc)


# ── Servers ───────────────────────────────────────────────────────────
# Populated by agent heartbeats
servers: list[dict[str, Any]] = []


def upsert_server(
    usuario_id: int,
    token_id: int,
    hostname: str,
    ip_publico: str,
    os_info: str,
    cpu: float = 0,
    ram: float = 0,
    disk: float = 0,
    uptime: str = "",
    conns: int = 0,
    open_ports: list[int] | None = None,
) -> dict:
    existing = next(
        (s for s in servers if s["token_id"] == token_id and s["hostname"] == hostname),
        None,
    )
    if existing:
        existing.update(
            ip_publico=ip_publico,
            os_info=os_info,
            cpu=cpu,
            ram=ram,
            disk=disk,
            uptime=uptime,
            conns=conns,
            open_ports=open_ports or [],
            status="online",
            ultimo_heartbeat=now(),
        )
        return existing

    srv = {
        "id": next_id("servers"),
        "usuario_id": usuario_id,
        "token_id": token_id,
        "hostname": hostname,
        "ip_publico": ip_publico,
        "os_info": os_info,
        "cpu": cpu,
        "ram": ram,
        "disk": disk,
        "uptime": uptime,
        "conns": conns,
        "open_ports": open_ports or [],
        "status": "online",
        "ultimo_heartbeat": now(),
        "criado_em": now(),
    }
    servers.append(srv)
    return srv


# ── Events / Logs ────────────────────────────────────────────────────
events: list[dict[str, Any]] = []


def add_event(
    usuario_id: int,
    servidor_id: int | None,
    hostname: str,
    tipo: str,
    severidade: str,
    mensagem: str,
    origem_ip: str | None = None,
    payload: dict | None = None,
) -> dict:
    ev = {
        "id": next_id("events"),
        "usuario_id": usuario_id,
        "servidor_id": servidor_id,
        "hostname": hostname,
        "tipo": tipo,
        "severidade": severidade,
        "mensagem": mensagem,
        "origem_ip": origem_ip,
        "payload": payload or {},
        "criado_em": now(),
    }
    events.append(ev)
    _evaluate_automation_rules(ev)
    return ev


# ── Security: Login Attempts ─────────────────────────────────────────
login_attempts: list[dict[str, Any]] = []


def add_login_attempt(
    usuario_id: int,
    servidor_id: int | None,
    hostname: str,
    user: str,
    origem_ip: str,
    method: str,
    success: bool,
) -> dict:
    attempt = {
        "id": next_id("login_attempts"),
        "usuario_id": usuario_id,
        "servidor_id": servidor_id,
        "hostname": hostname,
        "user": user,
        "origem_ip": origem_ip,
        "method": method,
        "success": success,
        "criado_em": now(),
    }
    login_attempts.append(attempt)

    # Auto-event for failed attempts
    sev = "info" if success else "warning"
    add_event(
        usuario_id=usuario_id,
        servidor_id=servidor_id,
        hostname=hostname,
        tipo="ssh_login_success" if success else "ssh_login_failed",
        severidade=sev,
        mensagem=f"{'Successful' if success else 'Failed'} login as '{user}' from {origem_ip} via {method}",
        origem_ip=origem_ip,
    )
    return attempt


# ── Banned IPs ────────────────────────────────────────────────────────
banned_ips: list[dict[str, Any]] = []


def ban_ip(
    usuario_id: int,
    servidor_id: int | None,
    hostname: str,
    ip: str,
    motivo: str,
    origem: str = "Automático",
    expira: str | None = None,
) -> dict:
    # avoid duplicates
    existing = next((b for b in banned_ips if b["ip"] == ip and b["usuario_id"] == usuario_id and b["ativo"]), None)
    if existing:
        return existing

    entry = {
        "id": next_id("banned_ips"),
        "usuario_id": usuario_id,
        "servidor_id": servidor_id,
        "hostname": hostname,
        "ip": ip,
        "motivo": motivo,
        "origem": origem,
        "expira": expira or "24h",
        "ativo": True,
        "criado_em": now(),
    }
    banned_ips.append(entry)
    return entry


def unban_ip(usuario_id: int, ip: str) -> bool:
    for b in banned_ips:
        if b["ip"] == ip and b["usuario_id"] == usuario_id and b["ativo"]:
            b["ativo"] = False
            return True
    return False


# ── Traffic ───────────────────────────────────────────────────────────
traffic: list[dict[str, Any]] = []


def update_traffic(
    usuario_id: int,
    servidor_id: int,
    hostname: str,
    interfaces: list[dict],
) -> None:
    # Replace traffic data for this server
    traffic[:] = [t for t in traffic if t["servidor_id"] != servidor_id]
    for iface in interfaces:
        traffic.append({
            "id": next_id("traffic"),
            "usuario_id": usuario_id,
            "servidor_id": servidor_id,
            "hostname": hostname,
            "interface": iface.get("name", "eth0"),
            "bytes_in": iface.get("bytes_in", 0),
            "bytes_out": iface.get("bytes_out", 0),
            "packets_in": iface.get("packets_in", 0),
            "packets_out": iface.get("packets_out", 0),
            "status": iface.get("status", "up"),
            "atualizado_em": now(),
        })


# ── Alerts ────────────────────────────────────────────────────────────
alerts: list[dict[str, Any]] = []


def add_alert(
    usuario_id: int,
    servidor_id: int | None,
    hostname: str,
    titulo: str,
    severidade: str,
    mensagem: str = "",
) -> dict:
    alert = {
        "id": next_id("alerts"),
        "usuario_id": usuario_id,
        "servidor_id": servidor_id,
        "hostname": hostname,
        "titulo": titulo,
        "severidade": severidade,
        "mensagem": mensagem,
        "status": "ativo",
        "criado_em": now(),
    }
    alerts.append(alert)
    return alert


def resolve_alert(alert_id: int) -> bool:
    for a in alerts:
        if a["id"] == alert_id:
            a["status"] = "resolvido"
            return True
    return False


# ── Automations (rules) ──────────────────────────────────────────────
automation_rules: list[dict[str, Any]] = [
    {
        "id": 1,
        "usuario_id": None,  # global
        "nome": "SSH Brute-Force Auto Ban",
        "condicao": "ssh_login_failed >= 5 in 5min",
        "condicao_tipo": "ssh_login_failed",
        "condicao_threshold": 5,
        "acao": "Banir IP por 24h",
        "acao_type": "ban_ip",
        "acao_duration": "24h",
        "ativo": True,
    },
    {
        "id": 2,
        "usuario_id": None,
        "nome": "Port Scan Detection",
        "condicao": "scan_detected em qualquer porta",
        "condicao_tipo": "port_scan",
        "condicao_threshold": 1,
        "acao": "Banir IP por 48h + Alerta",
        "acao_type": "ban_ip_alert",
        "acao_duration": "48h",
        "ativo": True,
    },
    {
        "id": 3,
        "usuario_id": None,
        "nome": "CPU Critical Alert",
        "condicao": "cpu_percent > 95% por 5min",
        "condicao_tipo": "cpu_critical",
        "condicao_threshold": 95,
        "acao": "Notificar Alerta Crítico",
        "acao_type": "alert",
        "acao_duration": None,
        "ativo": True,
    },
    {
        "id": 4,
        "usuario_id": None,
        "nome": "Disk Space Warning",
        "condicao": "disco_percent > 85%",
        "condicao_tipo": "disk_warning",
        "condicao_threshold": 85,
        "acao": "Notificar Alerta",
        "acao_type": "alert",
        "acao_duration": None,
        "ativo": False,
    },
    {
        "id": 5,
        "usuario_id": None,
        "nome": "DDoS Mitigation",
        "condicao": "conexões > 1000/min de mesmo IP",
        "condicao_tipo": "ddos",
        "condicao_threshold": 1000,
        "acao": "Rate limit + Banir IP 1h",
        "acao_type": "ban_ip",
        "acao_duration": "1h",
        "ativo": True,
    },
]

_next_rule_id = 6


def add_automation_rule(
    usuario_id: int | None,
    nome: str,
    condicao: str,
    condicao_tipo: str,
    condicao_threshold: int,
    acao: str,
    acao_type: str,
    acao_duration: str | None = None,
) -> dict:
    global _next_rule_id
    rule = {
        "id": _next_rule_id,
        "usuario_id": usuario_id,
        "nome": nome,
        "condicao": condicao,
        "condicao_tipo": condicao_tipo,
        "condicao_threshold": condicao_threshold,
        "acao": acao,
        "acao_type": acao_type,
        "acao_duration": acao_duration,
        "ativo": True,
    }
    _next_rule_id += 1
    automation_rules.append(rule)
    return rule


def toggle_automation_rule(rule_id: int) -> bool:
    for r in automation_rules:
        if r["id"] == rule_id:
            r["ativo"] = not r["ativo"]
            return True
    return False


# ── Automation Engine ─────────────────────────────────────────────────
# Track failed logins per IP for brute-force detection
_ip_fail_counters: dict[str, list[datetime]] = {}


def _evaluate_automation_rules(event: dict) -> None:
    """Run automation rules against incoming events."""
    tipo = event.get("tipo", "")
    usuario_id = event.get("usuario_id")
    servidor_id = event.get("servidor_id")
    hostname = event.get("hostname", "")
    origem_ip = event.get("origem_ip")

    for rule in automation_rules:
        if not rule["ativo"]:
            continue
        # Only apply global rules or user-specific
        if rule["usuario_id"] is not None and rule["usuario_id"] != usuario_id:
            continue

        if rule["condicao_tipo"] == "ssh_login_failed" and tipo == "ssh_login_failed" and origem_ip:
            key = f"{usuario_id}:{origem_ip}"
            if key not in _ip_fail_counters:
                _ip_fail_counters[key] = []
            _ip_fail_counters[key].append(now())
            # Keep only last 5 min
            cutoff = now().timestamp() - 300
            _ip_fail_counters[key] = [t for t in _ip_fail_counters[key] if t.timestamp() > cutoff]
            if len(_ip_fail_counters[key]) >= rule["condicao_threshold"]:
                ban_ip(
                    usuario_id=usuario_id,
                    servidor_id=servidor_id,
                    hostname=hostname,
                    ip=origem_ip,
                    motivo=f"SSH brute-force ({len(_ip_fail_counters[key])} tentativas)",
                    origem="Automático",
                    expira=rule.get("acao_duration", "24h"),
                )
                add_alert(
                    usuario_id=usuario_id,
                    servidor_id=servidor_id,
                    hostname=hostname,
                    titulo=f"SSH Brute-Force detectado de {origem_ip}",
                    severidade="critical",
                    mensagem=f"IP {origem_ip} fez {len(_ip_fail_counters[key])} tentativas de login em 5 min. Banido automaticamente.",
                )
                _ip_fail_counters[key] = []

        elif rule["condicao_tipo"] == "port_scan" and tipo == "port_scan" and origem_ip:
            ban_ip(
                usuario_id=usuario_id,
                servidor_id=servidor_id,
                hostname=hostname,
                ip=origem_ip,
                motivo="Port scanning detectado",
                origem="Automático",
                expira=rule.get("acao_duration", "48h"),
            )
            add_alert(
                usuario_id=usuario_id,
                servidor_id=servidor_id,
                hostname=hostname,
                titulo=f"Port scan detectado de {origem_ip}",
                severidade="critical",
                mensagem=f"IP {origem_ip} realizou port scanning.",
            )


def _check_cpu_alerts(usuario_id: int, servidor_id: int, hostname: str, cpu: float) -> None:
    """Called during heartbeat to check CPU rules."""
    for rule in automation_rules:
        if not rule["ativo"]:
            continue
        if rule["condicao_tipo"] == "cpu_critical" and cpu > rule["condicao_threshold"]:
            add_alert(
                usuario_id=usuario_id,
                servidor_id=servidor_id,
                hostname=hostname,
                titulo=f"CPU acima de {rule['condicao_threshold']}% em {hostname}",
                severidade="critical",
                mensagem=f"CPU em {cpu:.1f}%.",
            )


def _check_disk_alerts(usuario_id: int, servidor_id: int, hostname: str, disk: float) -> None:
    for rule in automation_rules:
        if not rule["ativo"]:
            continue
        if rule["condicao_tipo"] == "disk_warning" and disk > rule["condicao_threshold"]:
            add_alert(
                usuario_id=usuario_id,
                servidor_id=servidor_id,
                hostname=hostname,
                titulo=f"Disco acima de {rule['condicao_threshold']}% em {hostname}",
                severidade="warning",
                mensagem=f"Disco em {disk:.1f}%.",
            )


# ── Audit Logs ──────────────────────────────────────────────────────
audit_logs: list[dict[str, Any]] = []

def add_audit_log(
    usuario_id: int,
    action: str,
    resource_type: str,
    resource_id: str | None = None,
    details: dict[str, Any] | None = None,
    ip_address: str = "0.0.0.0",
) -> dict:
    log = {
        "id": next_id("audit_logs"),
        "usuario_id": usuario_id,
        "action": action,  # login, logout, create, update, delete, ban_ip, etc.
        "resource_type": resource_type,  # user, server, ban, token, etc.
        "resource_id": resource_id,
        "details": details or {},
        "ip_address": ip_address,
        "criado_em": now(),
    }
    audit_logs.append(log)
    return log

def get_audit_logs(usuario_id: int | None = None, limit: int = 100) -> list[dict]:
    logs = audit_logs
    if usuario_id is not None:
        logs = [log for log in logs if log["usuario_id"] == usuario_id]
    return sorted(logs, key=lambda x: x["criado_em"], reverse=True)[:limit]

# ── Dashboard Stats ──────────────────────────────────────────────────
def get_dashboard_stats(usuario_id: int) -> dict:
    user_servers = [s for s in servers if s["usuario_id"] == usuario_id]
    user_events = [e for e in events if e["usuario_id"] == usuario_id]
    user_banned = [b for b in banned_ips if b["usuario_id"] == usuario_id and b["ativo"]]
    user_alerts = [a for a in alerts if a["usuario_id"] == usuario_id and a["status"] == "ativo"]
    user_attacks = [e for e in user_events if e["severidade"] in ("critical", "warning")]

    online_servers = [s for s in user_servers if s["status"] == "online"]
    avg_cpu = sum(s["cpu"] for s in online_servers) / len(online_servers) if online_servers else 0
    avg_ram = sum(s["ram"] for s in online_servers) / len(online_servers) if online_servers else 0
    avg_disk = sum(s["disk"] for s in online_servers) / len(online_servers) if online_servers else 0

    return {
        "ataques_detectados": len(user_attacks),
        "ips_banidos": len(user_banned),
        "servidores_online": len(online_servers),
        "servidores_total": len(user_servers),
        "alertas_ativos": len(user_alerts),
        "cpu_medio": round(avg_cpu, 1),
        "ram_medio": round(avg_ram, 1),
        "disco_medio": round(avg_disk, 1),
    }
