from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel

from app.core.security import get_agent_tokens_db, get_current_user
from app.db.store import (
    upsert_server,
    add_event,
    add_login_attempt,
    update_traffic,
    _check_cpu_alerts,
    _check_disk_alerts,
)

router = APIRouter(prefix="/agents", tags=["agents"])


class HeartbeatPayload(BaseModel):
    hostname: str = ""
    ip_publico: str = ""
    os_info: str = ""
    cpu: float = 0
    ram: float = 0
    disk: float = 0
    uptime: str = ""
    conns: int = 0
    open_ports: list[int] = []
    interfaces: list[dict[str, Any]] = []
    login_attempts: list[dict[str, Any]] = []
    events: list[dict[str, Any]] = []


@router.get("")
def list_agents(user=Depends(get_current_user)):
    from app.db.store import servers
    user_servers = [s for s in servers if s["usuario_id"] == user["user_id"]]
    return {"items": user_servers}


@router.post("/heartbeat")
def agent_heartbeat(
    payload: HeartbeatPayload,
    x_agent_token: str = Header(None),
):
    """Agent calls this with its token to report full system state."""
    if not x_agent_token:
        raise HTTPException(status_code=401, detail="Missing agent token")

    tokens = get_agent_tokens_db()
    token_entry = next(
        (t for t in tokens if t["token"] == x_agent_token and t["ativo"]),
        None,
    )
    if not token_entry:
        raise HTTPException(status_code=401, detail="Invalid or revoked agent token")

    token_entry["ultimo_uso"] = datetime.now(timezone.utc)
    usuario_id = token_entry["usuario_id"]

    srv = upsert_server(
        usuario_id=usuario_id,
        token_id=token_entry["id"],
        hostname=payload.hostname,
        ip_publico=payload.ip_publico,
        os_info=payload.os_info,
        cpu=payload.cpu,
        ram=payload.ram,
        disk=payload.disk,
        uptime=payload.uptime,
        conns=payload.conns,
        open_ports=payload.open_ports,
    )

    servidor_id = srv["id"]

    _check_cpu_alerts(usuario_id, servidor_id, payload.hostname, payload.cpu)
    _check_disk_alerts(usuario_id, servidor_id, payload.hostname, payload.disk)

    if payload.interfaces:
        update_traffic(usuario_id, servidor_id, payload.hostname, payload.interfaces)

    for la in payload.login_attempts:
        add_login_attempt(
            usuario_id=usuario_id,
            servidor_id=servidor_id,
            hostname=payload.hostname,
            user=la.get("user", "unknown"),
            origem_ip=la.get("ip", "0.0.0.0"),
            method=la.get("method", "SSH"),
            success=la.get("success", False),
        )

    for ev in payload.events:
        add_event(
            usuario_id=usuario_id,
            servidor_id=servidor_id,
            hostname=payload.hostname,
            tipo=ev.get("tipo", "unknown"),
            severidade=ev.get("severidade", "info"),
            mensagem=ev.get("mensagem", ""),
            origem_ip=ev.get("origem_ip"),
            payload=ev.get("payload"),
        )

    return {
        "status": "ok",
        "server_id": servidor_id,
        "events_processed": len(payload.events),
        "login_attempts_processed": len(payload.login_attempts),
    }
