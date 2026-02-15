# Arquitetura SynexGuard

## Visão de Componentes

```mermaid
flowchart TD
  A[Node Guardian Agent - Go] -->|mTLS + JSON events| B[Core API - FastAPI]
  B --> C[(PostgreSQL)]
  B --> D[(Redis)]
  B --> E[WebSocket Hub]
  E --> F[Frontend React Dashboard]
  B --> G[Notifiers: Discord/Slack/Telegram/SMTP/Webhooks]
```

## Fluxo de Eventos

```mermaid
sequenceDiagram
  participant AG as Agent
  participant API as Core API
  participant RE as Rules Engine
  participant DB as PostgreSQL
  participant FE as Frontend
  AG->>API: POST /api/v1/events (mTLS + token)
  API->>DB: Persist event
  API->>RE: Evaluate conditions
  RE-->>API: Action list (ban/alert/notify)
  API->>DB: Save alerts + automation logs
  API-->>FE: Push realtime event via WebSocket
```

## Princípios

- Modularização por domínios (`servers`, `security`, `alerts`, `automation`)
- Segurança por padrão (JWT, RBAC, rate-limit, audit trail)
- Escala horizontal stateless no backend
- Comunicação assíncrona orientada a eventos
- Observabilidade com métricas e logs estruturados
