from datetime import datetime, timezone

from fastapi import Depends, FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import Counter, Gauge, generate_latest
from starlette.responses import PlainTextResponse

from app.core.config import settings
from app.core.logging import configure_logging
from app.middleware import enforce_rate_limit
from app.models.schemas import HealthResponse
from app.routers import admin, agents, alerts, auth, automations, events, metrics, security, servers, tokens, traffic

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
