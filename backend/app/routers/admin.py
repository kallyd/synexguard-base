from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.security import (
    get_agent_tokens_db,
    get_current_user,
    get_users_db,
    require_roles,
)

router = APIRouter(prefix="/admin", tags=["admin"])

_superadmin = Depends(require_roles(["superadmin"]))


class ToggleUserIn(BaseModel):
    ativo: bool


# ── Stats ────────────────────────────────────────────────────────────
@router.get("/stats", dependencies=[_superadmin])
def admin_stats(user=Depends(get_current_user)):
    users = get_users_db()
    tokens = get_agent_tokens_db()
    total_users = len([u for u in users if u["role"] != "superadmin"])
    active_users = len([u for u in users if u["role"] != "superadmin" and u.get("ativo", True)])
    total_tokens = len(tokens)
    active_tokens = len([t for t in tokens if t.get("ativo", True)])
    return {
        "total_users": total_users,
        "active_users": active_users,
        "inactive_users": total_users - active_users,
        "total_tokens": total_tokens,
        "active_tokens": active_tokens,
    }


# ── Users ────────────────────────────────────────────────────────────
@router.get("/users", dependencies=[_superadmin])
def admin_list_users(user=Depends(get_current_user)):
    users = get_users_db()
    tokens = get_agent_tokens_db()
    result = []
    for u in users:
        user_tokens = [t for t in tokens if t["usuario_id"] == u["id"]]
        result.append({
            "id": u["id"],
            "nome": u["nome"],
            "email": u["email"],
            "role": u["role"],
            "ativo": u.get("ativo", True),
            "criado_em": u.get("criado_em"),
            "total_tokens": len(user_tokens),
            "active_tokens": len([t for t in user_tokens if t.get("ativo", True)]),
        })
    return result


@router.put("/users/{user_id}", dependencies=[_superadmin])
def admin_toggle_user(user_id: int, payload: ToggleUserIn, current=Depends(get_current_user)):
    users = get_users_db()
    target = next((u for u in users if u["id"] == user_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target["role"] == "superadmin":
        raise HTTPException(status_code=403, detail="Cannot modify superadmin")
    target["ativo"] = payload.ativo
    return {"detail": f"User {'activated' if payload.ativo else 'deactivated'}"}


@router.delete("/users/{user_id}", dependencies=[_superadmin])
def admin_delete_user(user_id: int, current=Depends(get_current_user)):
    users = get_users_db()
    tokens = get_agent_tokens_db()
    target = next((u for u in users if u["id"] == user_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target["role"] == "superadmin":
        raise HTTPException(status_code=403, detail="Cannot delete superadmin")
    # Remove user tokens
    tokens[:] = [t for t in tokens if t["usuario_id"] != user_id]
    users.remove(target)
    return {"detail": "User deleted"}


# ── All Tokens ───────────────────────────────────────────────────────
@router.get("/tokens", dependencies=[_superadmin])
def admin_list_tokens(user=Depends(get_current_user)):
    users = get_users_db()
    tokens = get_agent_tokens_db()
    result = []
    for t in tokens:
        owner = next((u for u in users if u["id"] == t["usuario_id"]), None)
        result.append({
            **{k: v for k, v in t.items()},
            "owner_nome": owner["nome"] if owner else "?",
            "owner_email": owner["email"] if owner else "?",
        })
    return result


# ── All Servers ──────────────────────────────────────────────────────
@router.get("/servers", dependencies=[_superadmin])
def admin_list_servers(user=Depends(get_current_user)):
    from app.db.store import servers
    users = get_users_db()
    tokens = get_agent_tokens_db()
    result = []
    for s in servers:
        owner = next((u for u in users if u["id"] == s.get("usuario_id")), None)
        token = next((t for t in tokens if t["id"] == s.get("token_id")), None)
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
            "owner_nome": owner["nome"] if owner else "Desconhecido",
            "owner_email": owner["email"] if owner else "?",
            "token_nome": token["nome"] if token else "Token removido",
        })
    return result
