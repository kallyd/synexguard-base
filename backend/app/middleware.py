from collections import defaultdict
from time import time

from fastapi import HTTPException, Request

from app.core.config import settings


class EnhancedRateLimiter:
    def __init__(self) -> None:
        self.requests: dict[str, list[float]] = defaultdict(list)
        self.blocked_ips: dict[str, float] = {}  # IP -> blocked_until_timestamp

    def is_blocked(self, client_ip: str) -> bool:
        if client_ip in self.blocked_ips:
            if time() < self.blocked_ips[client_ip]:
                return True
            else:
                del self.blocked_ips[client_ip]
        return False

    def block_ip(self, client_ip: str, duration_minutes: int = 15):
        """Block IP for specified duration."""
        self.blocked_ips[client_ip] = time() + (duration_minutes * 60)

    def check(self, client_ip: str, endpoint_path: str) -> None:
        # Skip rate limiting for health checks
        if endpoint_path in ["/health", "/health/detailed", "/version", "/metrics/prometheus"]:
            return
            
        if self.is_blocked(client_ip):
            raise HTTPException(
                status_code=429, 
                detail="IP temporariamente bloqueado devido a excesso de requisições"
            )
            
        now = time()
        window_seconds = 60
        cutoff_time = now - window_seconds
        
        # Clean old entries and count recent requests
        entries = [ts for ts in self.requests[client_ip] if ts > cutoff_time]
        
        # Different limits for different endpoints
        limit = 100  # default
        if "/auth/" in endpoint_path:
            limit = 20  # stricter for auth endpoints
        elif endpoint_path.startswith("/api/v1/agents/"):
            limit = 300  # more lenient for agent heartbeats
            
        if len(entries) >= limit:
            # Auto-block after excessive requests
            if len(entries) >= limit * 2:
                self.block_ip(client_ip, 15)
                raise HTTPException(
                    status_code=429, 
                    detail="IP bloqueado por 15 minutos devido a abuso"
                )
            raise HTTPException(
                status_code=429, 
                detail=f"Rate limit excedido: {len(entries)}/{limit} req/min"
            )
            
        entries.append(now)
        self.requests[client_ip] = entries


rate_limiter = EnhancedRateLimiter()


async def enforce_rate_limit(request: Request):
    client_ip = request.client.host if request.client else "unknown"
    rate_limiter.check(client_ip, str(request.url.path))
