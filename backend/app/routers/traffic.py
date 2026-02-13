from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.db.store import traffic

router = APIRouter(prefix="/traffic", tags=["traffic"])


@router.get("")
def list_traffic(user=Depends(get_current_user)):
    user_traffic = [t for t in traffic if t["usuario_id"] == user["user_id"]]
    total_in = sum(t["bytes_in"] for t in user_traffic)
    total_out = sum(t["bytes_out"] for t in user_traffic)
    items = [
        {
            "hostname": t["hostname"],
            "interface": t["interface"],
            "bytes_in": t["bytes_in"],
            "bytes_out": t["bytes_out"],
            "packets_in": t["packets_in"],
            "packets_out": t["packets_out"],
            "status": t["status"],
        }
        for t in user_traffic
    ]
    return {
        "items": items,
        "total_in": total_in,
        "total_out": total_out,
    }
