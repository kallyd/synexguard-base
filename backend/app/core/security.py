import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import Depends, HTTPException, Header, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from app.core.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")

# ── Password helpers ─────────────────────────────────────────────────
_HASH_ITER = 260_000

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    h = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), _HASH_ITER)
    return f"{salt}${h.hex()}"

def verify_password(password: str, stored: str) -> bool:
    try:
        salt, digest = stored.split("$", 1)
        h = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), _HASH_ITER)
        return h.hex() == digest
    except Exception:
        return False

# ── Agent token helpers ──────────────────────────────────────────────
def generate_agent_token() -> str:
    return f"ng_{secrets.token_hex(28)}"

# ── JWT ──────────────────────────────────────────────────────────────
def create_access_token(user_id: int, email: str, role: str = "user", nome: str = "") -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {
        "sub": email,
        "uid": user_id,
        "role": role,
        "nome": nome,
        "exp": expire,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid token",
    )
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        email = payload.get("sub")
        user_id = payload.get("uid")
        role = payload.get("role", "user")
        nome = payload.get("nome", "")
        if email is None or user_id is None:
            raise credentials_exception
        return {"user_id": user_id, "email": email, "role": role, "nome": nome}
    except JWTError as exc:
        raise credentials_exception from exc


def require_roles(allowed_roles: list[str]):
    def _checker(user=Depends(get_current_user)):
        if user["role"] not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return _checker


# ── In-memory stores (demo) ─────────────────────────────────────────
_users_db: list[dict] = []
_agent_tokens_db: list[dict] = []
_seeded = False


def _seed_superadmin() -> None:
    """Create the default superadmin account on first access."""
    global _seeded
    if _seeded:
        return
    _seeded = True
    from datetime import datetime, timezone
    _users_db.append({
        "id": 1,
        "nome": "Administrador",
        "email": "admin@nodeguard.io",
        "senha_hash": hash_password("admin123"),
        "role": "superadmin",
        "avatar_url": None,
        "ativo": True,
        "criado_em": datetime.now(timezone.utc),
    })


def get_users_db() -> list[dict]:
    _seed_superadmin()
    return _users_db


def get_agent_tokens_db() -> list[dict]:
    return _agent_tokens_db
