# APIs REST (v1)

Base URL: `/api/v1`

## Auth
- `POST /auth/token` -> gera JWT

## Servidores
- `GET /servers`
- `POST /servers`

## Agentes
- `GET /agents`

## Eventos
- `POST /events`
- `GET /events`

## Segurança
- `GET /security/login-attempts`
- `GET /security/banned-ips`
- `POST /security/banned-ips`
- `DELETE /security/banned-ips/{ip}`

## Métricas
- `GET /metrics`

## Tráfego
- `GET /traffic`

## Alertas
- `GET /alerts`

## Automações
- `GET /automations`
- `POST /automations/evaluate`

## Observabilidade
- `GET /health`
- `GET /metrics/prometheus`
- `GET /ws/events`
