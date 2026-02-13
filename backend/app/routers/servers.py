from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.db.store import servers, get_dashboard_stats

router = APIRouter(prefix="/servers", tags=["servers"])


@router.get("")
def list_servers(user=Depends(get_current_user)):
    user_servers = [s for s in servers if s["usuario_id"] == user["user_id"]]
    result = []
    for s in user_servers:
        result.append({
            "id": s["id"],
            "hostname": s["hostname"],
            "ip_publico": s["ip_publico"],
            "os_info": s["os_info"],
            "cpu": s["cpu"],
            "ram": s["ram"],
            "disk": s["disk"],
            "uptime": s["uptime"],
            "conns": s["conns"],
            "open_ports": s["open_ports"],
            "status": s["status"],
            "ultimo_heartbeat": s["ultimo_heartbeat"].isoformat() if s.get("ultimo_heartbeat") else None,
            "criado_em": s["criado_em"].isoformat() if s.get("criado_em") else None,
        })
    return {"items": result}


@router.get("/stats")
def server_stats(user=Depends(get_current_user)):
    return get_dashboard_stats(user["user_id"])
