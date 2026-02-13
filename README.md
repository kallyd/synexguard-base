# Node Guardian

Plataforma enterprise para monitoramento, segurança e automação de defesa de servidores Linux.

## Componentes

- `agent/`: agente em Go (daemon systemd)
- `backend/`: API central e processador de eventos (FastAPI)
- `frontend/`: dashboard web (React + Vite + Tailwind)
- `db/`: modelagem SQL inicial
- `deploy/`: artefatos de infraestrutura e systemd
- `docs/`: arquitetura, segurança, instalação, roadmap e APIs

## Quick Start

1. Copie variáveis de ambiente:

```bash
cp .env.example .env
```

2. Suba toda a stack:

```bash
docker compose up --build
```

3. Acesse:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- OpenAPI: `http://localhost:8000/docs`
- Prometheus: `http://localhost:9090`

## Entregáveis desta versão

- Arquitetura completa e diagramas Mermaid
- Backend modular com segurança base (JWT + RBAC placeholder + rate limit simples)
- Modelo relacional SQL inicial
- Agente Go inicial (telemetria, buffer, retry, mTLS client skeleton)
- Frontend enterprise dark inicial
- Docker Compose integrado
- Service template systemd e script de instalação
- Guia de instalação, segurança e roadmap

## Status

Base V1 pronta para evolução incremental para produção (HA, hardening completo, fila distribuída avançada e detecção comportamental).
