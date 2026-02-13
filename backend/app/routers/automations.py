from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.security import get_current_user
from app.db.store import automation_rules, add_automation_rule, toggle_automation_rule

router = APIRouter(prefix="/automations", tags=["automations"])


@router.get("")
def list_automations(user=Depends(get_current_user)):
    # Return global rules + user-specific
    user_rules = [
        r for r in automation_rules
        if r["usuario_id"] is None or r["usuario_id"] == user["user_id"]
    ]
    return {
        "items": [
            {
                "id": r["id"],
                "nome": r["nome"],
                "condicao": r["condicao"],
                "acao": r["acao"],
                "ativo": r["ativo"],
            }
            for r in user_rules
        ]
    }


class RuleIn(BaseModel):
    nome: str
    condicao: str
    condicao_tipo: str
    condicao_threshold: int = 5
    acao: str
    acao_type: str
    acao_duration: str | None = None


@router.post("/rules")
def create_rule(payload: RuleIn, user=Depends(get_current_user)):
    rule = add_automation_rule(
        usuario_id=user["user_id"],
        nome=payload.nome,
        condicao=payload.condicao,
        condicao_tipo=payload.condicao_tipo,
        condicao_threshold=payload.condicao_threshold,
        acao=payload.acao,
        acao_type=payload.acao_type,
        acao_duration=payload.acao_duration,
    )
    return rule


@router.put("/{rule_id}/toggle")
def api_toggle_rule(rule_id: int, user=Depends(get_current_user)):
    if not toggle_automation_rule(rule_id):
        raise HTTPException(status_code=404, detail="Rule not found")
    return {"toggled": True}
