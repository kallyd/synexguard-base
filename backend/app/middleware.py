from collections import defaultdict
from time import time

from fastapi import HTTPException, Request

from app.core.config import settings


class SimpleRateLimiter:
    def __init__(self) -> None:
        self.requests: dict[str, list[float]] = defaultdict(list)

    def check(self, client_ip: str) -> None:
        now = time()
        one_minute_ago = now - 60
        entries = [ts for ts in self.requests[client_ip] if ts > one_minute_ago]
        if len(entries) >= settings.api_rate_limit_per_minute:
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
        entries.append(now)
        self.requests[client_ip] = entries


rate_limiter = SimpleRateLimiter()


async def enforce_rate_limit(request: Request):
    client_ip = request.client.host if request.client else "unknown"
    rate_limiter.check(client_ip)
