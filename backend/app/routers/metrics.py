from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.db.store import servers

router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.get("")
def list_metrics(user=Depends(get_current_user)):
    user_servers = [s for s in servers if s["usuario_id"] == user["user_id"] and s["status"] == "online"]
    items = []
    for s in user_servers:
        items.append({
            "servidor_id": s["id"],
            "hostname": s["hostname"],
            "cpu": s["cpu"],
            "ram": s["ram"],
            "disk": s["disk"],
            "conns": s["conns"],
            "open_ports": len(s.get("open_ports", [])),
        })
    return {"items": items}
