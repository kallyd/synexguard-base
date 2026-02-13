from fastapi import APIRouter, Depends, Query

from app.core.security import get_current_user
from app.db.store import alerts, resolve_alert

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("")
def list_alerts(
    user=Depends(get_current_user),
    status: str | None = None,
    limit: int = Query(50, ge=1, le=500),
):
    user_alerts = [a for a in alerts if a["usuario_id"] == user["user_id"]]
    if status:
        user_alerts = [a for a in user_alerts if a["status"] == status]
    result = sorted(user_alerts, key=lambda a: a["criado_em"], reverse=True)[:limit]
    return {
        "items": [
            {
                "id": a["id"],
                "hostname": a.get("hostname", ""),
                "titulo": a["titulo"],
                "severidade": a["severidade"],
                "mensagem": a.get("mensagem", ""),
                "status": a["status"],
                "criado_em": a["criado_em"].isoformat(),
            }
            for a in result
        ],
        "total": len(user_alerts),
    }


@router.put("/{alert_id}/resolve")
def api_resolve_alert(alert_id: int, user=Depends(get_current_user)):
    # verify ownership
    alert = next((a for a in alerts if a["id"] == alert_id and a["usuario_id"] == user["user_id"]), None)
    if not alert:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Alert not found")
    resolve_alert(alert_id)
    return {"resolved": True}
