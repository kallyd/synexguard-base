from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


# ── Auth ──────────────────────────────────────────────────────────────
class LoginIn(BaseModel):
    email: str
    password: str


class RegisterIn(BaseModel):
    nome: str
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: int
    nome: str
    email: str
    role: str
    avatar_url: str | None = None
    criado_em: datetime | None = None


class UserUpdateIn(BaseModel):
    nome: str | None = None
    email: str | None = None
    avatar_url: str | None = None


class PasswordChangeIn(BaseModel):
    current_password: str
    new_password: str


# ── Agent Tokens ──────────────────────────────────────────────────────
class AgentTokenIn(BaseModel):
    nome: str
    descricao: str | None = None


class AgentTokenOut(BaseModel):
    id: int
    nome: str
    descricao: str | None = None
    token: str
    ultimo_uso: datetime | None = None
    ativo: bool = True
    criado_em: datetime | None = None
    install_command: str = ""


# ── Servers ───────────────────────────────────────────────────────────
class ServerIn(BaseModel):
    nome: str
    hostname: str
    ip_publico: str | None = None


class ServerOut(BaseModel):
    id: int
    nome: str
    hostname: str
    ip_publico: str | None = None
    sistema_operacional: str | None = None
    status: str = "online"


# ── Events ────────────────────────────────────────────────────────────
class EventIn(BaseModel):
    servidor_id: int | None = None
    agente_id: int | None = None
    tipo: str
    severidade: str
    payload: dict[str, Any] = Field(default_factory=dict)
    origem_ip: str | None = None


# ── Security ─────────────────────────────────────────────────────────
class BannedIpIn(BaseModel):
    servidor_id: int
    ip: str
    motivo: str = "manual"
    origem: str = "manual"


# ── Automations ──────────────────────────────────────────────────────
class AutomationRuleIn(BaseModel):
    nome: str
    condicao: dict[str, Any]
    acao: dict[str, Any]


# ── Misc ─────────────────────────────────────────────────────────────
class HealthResponse(BaseModel):
    status: str
    timestamp: datetime
