from fastapi import APIRouter, Depends, Query
from app.core.security import get_current_user, is_admin
from app.db.store import get_audit_logs

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("")
def list_audit_logs(
    user=Depends(get_current_user),
    limit: int = Query(100, ge=1, le=1000),
):
    """Get audit logs. Regular users see their own logs, admins see all logs."""
    if is_admin(user):
        # Admin can see all logs
        logs = get_audit_logs(usuario_id=None, limit=limit)
    else:
        # Regular users see only their own audit logs
        logs = get_audit_logs(usuario_id=user["user_id"], limit=limit)
    
    return {
        "items": [
            {
                "id": log["id"],
                "action": log["action"],
                "resource_type": log["resource_type"],
                "resource_id": log["resource_id"],
                "details": log["details"],
                "ip_address": log["ip_address"],
                "criado_em": log["criado_em"].isoformat(),
            }
            for log in logs
        ],
        "total": len(logs),
    }


@router.get("/summary")
def audit_summary(user=Depends(get_current_user)):
    """Get audit log summary/stats."""
    if is_admin(user):
        logs = get_audit_logs(usuario_id=None, limit=1000)
    else:
        logs = get_audit_logs(usuario_id=user["user_id"], limit=1000)
    
    # Count by action type
    action_counts = {}
    for log in logs:
        action = log["action"]
        action_counts[action] = action_counts.get(action, 0) + 1
    
    return {
        "total_logs": len(logs),
        "actions": action_counts,
        "recent_logs": len([log for log in logs[:10]]),  # Last 10 for quick stats
    }