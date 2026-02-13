# Guia de Instalação

## Requisitos

- Docker + Docker Compose
- Linux para execução do agente em produção

## Subir stack local

1. Copiar variáveis:

```bash
cp .env.example .env
```

2. Subir serviços:

```bash
docker compose up --build
```

3. Validar endpoints:

- `GET /health`
- `GET /docs`
- Frontend em `http://localhost:5173`

## Agente (Linux)

1. Compilar binário Go
2. Copiar para `/usr/local/bin/node-guardian-agent`
3. Instalar service:

```bash
sudo bash scripts/install-agent.sh
```
