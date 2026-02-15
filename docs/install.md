# Guia de Instalação (Linux, sem Docker)

Este guia foca na instalação em **Linux**, usando **PostgreSQL** e **pm2**, sem Docker.

---

## 1. Backend (API FastAPI)

### 1.1. Requisitos

- Linux 64 bits
- Python 3.12+
- PostgreSQL 14+ (local ou remoto)
- Node.js 18+ (para o frontend, opcionalmente em outra máquina)
- `pm2` (gerenciador de processos Node, mas também serve para scripts Python)

### 1.2. Configurar PostgreSQL

No servidor onde ficará o banco:

```bash
sudo -u postgres createuser synexguard --pwprompt
sudo -u postgres createdb synexguard -O synexguard
```

Aplicar o schema da pasta `db/`:

```bash
psql -U synexguard -d synexguard -h localhost -f db/schema.sql
```

No backend, o arquivo [backend/app/core/config.py](backend/app/core/config.py) já aponta por padrão para:

```python
database_url = "postgresql+psycopg://synexguard:synexguard@localhost:5432/synexguard"
```

Se o banco estiver em outro host/porta, ajuste a variável de ambiente `DATABASE_URL` (ou edite o arquivo de config).

### 1.3. Preparar ambiente Python

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt || pip install fastapi uvicorn[standard] pydantic pydantic-settings sqlalchemy "psycopg[binary]" redis "python-jose[cryptography]" "passlib[bcrypt]" prometheus-client psutil
```

Crie um arquivo `.env` na raiz do projeto (ao lado de `.env.example`) se quiser sobrescrever configs (JWT secret, rate limit, etc.).

### 1.4. Subir backend com pm2

Instale o pm2 (se ainda não tiver):

```bash
sudo npm install -g pm2
```

No diretório `backend/` (dentro do venv):

```bash
cd backend
source .venv/bin/activate
pm2 start "python -m uvicorn app.main:app --host 0.0.0.0 --port 8000" --name synexguard-api
pm2 save
```

Endpoints principais:

- Health: `GET /health` → `http://SEU_BACKEND:8000/health`
- Docs: `GET /docs` → `http://SEU_BACKEND:8000/docs`

Se for expor publicamente, coloque um Nginx/Traefik na frente e use HTTPS.

---

## 2. Frontend (React + Vite)

O frontend pode rodar na mesma máquina ou em outra.

### 2.1. Instalar dependências

```bash
cd frontend
npm install
```

### 2.2. Configurar URL da API

No arquivo [frontend/src/api.ts](frontend/src/api.ts), garanta que a base da API aponte para o backend público, por exemplo:

```ts
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://api-synexguard.synexsoft.com.br';
```

E defina `VITE_API_BASE_URL` no ambiente de build/execução quando necessário.

### 2.3. Rodar frontend com pm2 (modo dev ou build)

**Opção A – Dev (não recomendado para produção):**

```bash
cd frontend
pm2 start "npm run dev -- --host 0.0.0.0 --port 5173" --name synexguard-frontend-dev
pm2 save
```

**Opção B – Produção (recomendado):**

```bash
cd frontend
npm run build
pm2 serve dist 4173 --name synexguard-frontend --spa
pm2 save
```

Depois, coloque um Nginx na frente se quiser usar porta 80/443.

---

## 3. Agente (Linux)

Para instalar o agente em qualquer servidor Linux, o usuário final só precisa de:

1. Um **token de agente** gerado no painel (rota `/tokens`).
2. Rodar o comando:

```bash
curl -sSL https://raw.githubusercontent.com/kallyd/synexguard/main/scripts/install-agent.sh \
	| sudo bash -s -- --token SEU_AGENT_TOKEN
```

O script irá:

- Criar diretórios: `/opt/synexguard` e `/etc/synexguard`.
- Gravar `/etc/synexguard/agent.conf` com:
	- `AGENT_TOKEN`
	- `API_URL` (já apontando para `https://api-synexguard.synexsoft.com.br`)
- Baixar o binário do GitHub (`kallyd/synexguard` releases) para `/usr/local/bin/synexguard-agent`.
- Criar e habilitar o serviço systemd `synexguard-agent`.

Verificar status do agente:

```bash
sudo systemctl status synexguard-agent
```

Logs em tempo real:

```bash
journalctl -u synexguard-agent -f
```
