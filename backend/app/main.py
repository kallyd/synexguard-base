from datetime import datetime, timezone

from fastapi import Depends, FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import Counter, Gauge, generate_latest
from starlette.responses import PlainTextResponse
import psutil
import os

from app.core.config import settings
from app.core.logging import configure_logging
from app.middleware import enforce_rate_limit
from app.models.schemas import HealthResponse
from app.routers import admin, agents, alerts, audit, auth, automations, events, metrics, security, servers, tokens, traffic

app_start_time = datetime.now(timezone.utc)

configure_logging()

app = FastAPI(title=settings.app_name, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

request_counter = Counter("node_guardian_http_requests_total", "Total HTTP requests", ["path"])
active_alerts = Gauge("node_guardian_active_alerts", "Number of active alerts")


@app.middleware("http")
async def metrics_and_rate_limit(request, call_next):
    await enforce_rate_limit(request)
    response = await call_next(request)
    request_counter.labels(path=request.url.path).inc()
    return response


@app.get("/health", response_model=HealthResponse)
def health():
    return HealthResponse(status="ok", timestamp=datetime.now(timezone.utc))


@app.get("/health/detailed")
def detailed_health():
    now = datetime.now(timezone.utc)
    uptime = now - app_start_time
    
    try:
        cpu_percent = psutil.cpu_percent(interval=0.1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
    except:
        cpu_percent = 0
        memory = None
        disk = None
    
    return {
        "status": "ok",
        "timestamp": now,
        "version": "1.0.0",
        "uptime_seconds": uptime.total_seconds(),
        "uptime_human": str(uptime).split('.')[0],
        "system": {
            "cpu_percent": cpu_percent,
            "memory_percent": memory.percent if memory else 0,
            "disk_percent": (disk.used / disk.total * 100) if disk else 0,
            "python_version": f"{os.sys.version_info.major}.{os.sys.version_info.minor}.{os.sys.version_info.micro}"
        },
        "database": "memory",  # TODO: check actual DB connection
        "cache": "none"
    }


@app.get("/version")
def version():
    return {
        "name": "SynexGuard",
        "version": "1.0.0",
        "build_date": "2026-02-13",
        "environment": "production"
    }


@app.get("/metrics/prometheus")
def prometheus_metrics():
    active_alerts.set(1)
    return PlainTextResponse(generate_latest().decode("utf-8"))


@app.websocket("/ws/events")
async def websocket_events(websocket: WebSocket):
    await websocket.accept()
    await websocket.send_json({"type": "connected", "message": "Node Guardian realtime channel"})
    while True:
        text = await websocket.receive_text()
        await websocket.send_json({"type": "echo", "payload": text})


api_prefix = "/api/v1"
app.include_router(auth.router, prefix=api_prefix)
app.include_router(servers.router, prefix=api_prefix)
app.include_router(agents.router, prefix=api_prefix)
app.include_router(events.router, prefix=api_prefix)
app.include_router(security.router, prefix=api_prefix)
app.include_router(metrics.router, prefix=api_prefix)
app.include_router(traffic.router, prefix=api_prefix)
app.include_router(alerts.router, prefix=api_prefix)
app.include_router(automations.router, prefix=api_prefix)
app.include_router(tokens.router, prefix=api_prefix)
app.include_router(admin.router, prefix=api_prefix)
app.include_router(audit.router, prefix=api_prefix)
app.include_router(audit.router, prefix=api_prefix)
