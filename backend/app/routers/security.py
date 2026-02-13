from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.security import get_current_user
from app.db.store import login_attempts, banned_ips, ban_ip, unban_ip
from app.models.schemas import BannedIpIn

router = APIRouter(prefix="/security", tags=["security"])


@router.get("/login-attempts")
def list_login_attempts(
    user=Depends(get_current_user),
    limit: int = Query(50, ge=1, le=500),
):
    user_attempts = [a for a in login_attempts if a["usuario_id"] == user["user_id"]]
    result = sorted(user_attempts, key=lambda a: a["criado_em"], reverse=True)[:limit]
    total_today = len(user_attempts)
    blocked = len([a for a in user_attempts if not a["success"]])
    suspicious = len([a for a in user_attempts if a["success"] and a["user"] in ("root", "admin")])
    return {
        "items": [
            {
                "id": a["id"],
                "hostname": a["hostname"],
                "user": a["user"],
                "origem_ip": a["origem_ip"],
                "method": a["method"],
                "success": a["success"],
                "criado_em": a["criado_em"].isoformat(),
            }
            for a in result
        ],
        "stats": {
            "total": total_today,
            "blocked": blocked,
            "suspicious": suspicious,
        },
    }


@router.get("/banned-ips")
def list_banned_ips(user=Depends(get_current_user)):
    user_banned = [b for b in banned_ips if b["usuario_id"] == user["user_id"]]
    return {
        "items": [
            {
                "id": b["id"],
                "hostname": b.get("hostname", ""),
                "ip": b["ip"],
                "motivo": b["motivo"],
                "origem": b["origem"],
                "expira": b["expira"],
                "ativo": b["ativo"],
                "criado_em": b["criado_em"].isoformat(),
            }
            for b in user_banned
        ]
    }


@router.post("/banned-ips")
def manual_ban_ip(payload: BannedIpIn, user=Depends(get_current_user)):
    from app.db.store import servers
    hostname = ""
    srv = next((s for s in servers if s["id"] == payload.servidor_id and s["usuario_id"] == user["user_id"]), None)
    if srv:
        hostname = srv["hostname"]
    entry = ban_ip(
        usuario_id=user["user_id"],
        servidor_id=payload.servidor_id,
        hostname=hostname,
        ip=payload.ip,
        motivo=payload.motivo,
        origem="Manual",
    )
    return entry


@router.delete("/banned-ips/{ip}")
def api_unban_ip(ip: str, user=Depends(get_current_user)):
    success = unban_ip(user["user_id"], ip)
    if not success:
        raise HTTPException(status_code=404, detail="IP not found or already unbanned")
    return {"unbanned": ip}
