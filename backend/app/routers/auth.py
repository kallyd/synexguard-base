from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from app.core.security import (
    create_access_token,
    get_current_user,
    get_users_db,
    hash_password,
    verify_password,
)
from app.models.schemas import (
    LoginIn,
    PasswordChangeIn,
    RegisterIn,
    TokenResponse,
    UserOut,
    UserUpdateIn,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut)
def register(payload: RegisterIn):
    users = get_users_db()
    if any(u["email"] == payload.email for u in users):
        raise HTTPException(status_code=409, detail="Email already registered")
    user = {
        "id": len(users) + 1,
        "nome": payload.nome,
        "email": payload.email,
        "senha_hash": hash_password(payload.password),
        "role": "user",
        "avatar_url": None,
        "ativo": True,
        "criado_em": datetime.now(timezone.utc),
    }
    users.append(user)
    return UserOut(**{k: v for k, v in user.items() if k != "senha_hash"})


@router.post("/token", response_model=TokenResponse)
def login(payload: LoginIn):
    users = get_users_db()
    user = next((u for u in users if u["email"] == payload.email), None)
    if not user or not verify_password(payload.password, user["senha_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.get("ativo", True):
        raise HTTPException(status_code=403, detail="Account disabled")
    token = create_access_token(
        user_id=user["id"],
        email=user["email"],
        role=user.get("role", "user"),
        nome=user["nome"],
    )
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserOut)
def me(current=Depends(get_current_user)):
    users = get_users_db()
    user = next((u for u in users if u["id"] == current["user_id"]), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserOut(**{k: v for k, v in user.items() if k != "senha_hash"})


@router.put("/me", response_model=UserOut)
def update_me(payload: UserUpdateIn, current=Depends(get_current_user)):
    users = get_users_db()
    user = next((u for u in users if u["id"] == current["user_id"]), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if payload.nome is not None:
        user["nome"] = payload.nome
    if payload.email is not None:
        if any(u["email"] == payload.email and u["id"] != user["id"] for u in users):
            raise HTTPException(status_code=409, detail="Email already in use")
        user["email"] = payload.email
    if payload.avatar_url is not None:
        user["avatar_url"] = payload.avatar_url
    return UserOut(**{k: v for k, v in user.items() if k != "senha_hash"})


@router.put("/me/password")
def change_password(payload: PasswordChangeIn, current=Depends(get_current_user)):
    users = get_users_db()
    user = next((u for u in users if u["id"] == current["user_id"]), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not verify_password(payload.current_password, user["senha_hash"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    user["senha_hash"] = hash_password(payload.new_password)
    return {"detail": "Password updated"}
