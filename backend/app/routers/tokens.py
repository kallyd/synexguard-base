from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from app.core.config import settings
from app.core.security import (
    generate_agent_token,
    get_agent_tokens_db,
    get_current_user,
)
from app.models.schemas import AgentTokenIn, AgentTokenOut

router = APIRouter(prefix="/tokens", tags=["tokens"])

GITHUB_RAW_BASE = "https://raw.githubusercontent.com/YOUR_USER/synexguard/main"


def _install_cmd(token: str) -> str:
    return (
        f'curl -sSL {GITHUB_RAW_BASE}/scripts/install-agent.sh | '
        f'sudo bash -s -- --token {token}'
    )


@router.get("", response_model=list[AgentTokenOut])
def list_tokens(user=Depends(get_current_user)):
    tokens = get_agent_tokens_db()
    result = []
    for t in tokens:
        if t["usuario_id"] == user["user_id"]:
            out = AgentTokenOut(**{k: v for k, v in t.items() if k != "usuario_id"})
            out.install_command = _install_cmd(t["token"])
            result.append(out)
    return result


@router.post("", response_model=AgentTokenOut, status_code=201)
def create_token(payload: AgentTokenIn, user=Depends(get_current_user)):
    tokens = get_agent_tokens_db()
    raw_token = generate_agent_token()
    entry = {
        "id": len(tokens) + 1,
        "usuario_id": user["user_id"],
        "token": raw_token,
        "nome": payload.nome,
        "descricao": payload.descricao,
        "ultimo_uso": None,
        "ativo": True,
        "criado_em": datetime.now(timezone.utc),
    }
    tokens.append(entry)
    out = AgentTokenOut(**{k: v for k, v in entry.items() if k != "usuario_id"})
    out.install_command = _install_cmd(raw_token)
    return out


@router.delete("/{token_id}")
def revoke_token(token_id: int, user=Depends(get_current_user)):
    tokens = get_agent_tokens_db()
    entry = next(
        (t for t in tokens if t["id"] == token_id and t["usuario_id"] == user["user_id"]),
        None,
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Token not found")
    entry["ativo"] = False
    return {"detail": "Token revoked"}
