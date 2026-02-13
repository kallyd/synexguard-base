from fastapi import APIRouter, Depends, Query

from app.core.security import get_current_user
from app.db.store import events, add_event

router = APIRouter(prefix="/events", tags=["events"])


@router.get("")
def list_events(
    user=Depends(get_current_user),
    limit: int = Query(50, ge=1, le=500),
    tipo: str | None = None,
    severidade: str | None = None,
):
    user_events = [e for e in events if e["usuario_id"] == user["user_id"]]
    if tipo:
        user_events = [e for e in user_events if e["tipo"] == tipo]
    if severidade:
        user_events = [e for e in user_events if e["severidade"] == severidade]
    # Return latest first
    result = sorted(user_events, key=lambda e: e["criado_em"], reverse=True)[:limit]
    return {
        "items": [
            {
                "id": e["id"],
                "hostname": e["hostname"],
                "tipo": e["tipo"],
                "severidade": e["severidade"],
                "mensagem": e["mensagem"],
                "origem_ip": e["origem_ip"],
                "criado_em": e["criado_em"].isoformat(),
            }
            for e in result
        ],
        "total": len(user_events),
    }


@router.post("")
def ingest_event(user=Depends(get_current_user)):
    """Manual event creation (for testing or manual logging)."""
    from pydantic import BaseModel

    class ManualEvent(BaseModel):
        hostname: str = ""
        tipo: str = "manual"
        severidade: str = "info"
        mensagem: str = ""
        origem_ip: str | None = None

    return {"detail": "Use agent heartbeat to send events"}
