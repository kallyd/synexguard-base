# Agente SynexGuard (Linux)

Esta página concentra tudo relacionado ao **agente SynexGuard**: quais arquivos precisam estar no GitHub e como instalar o agente em um servidor Linux.

---

## 1. O que vai no repositório público

No repositório público do GitHub (`kallyd/synexguard`), o usuário final só precisa ver:

- `scripts/install-agent.sh`  
   Script de instalação usado via `curl | bash` nos servidores.

O código-fonte do agente Python fica embutido dentro do próprio script `install-agent.sh` (ele grava `/opt/synexguard/agent.py` no servidor), então não é exposto no repositório público.

---

## 2. Pré-requisitos no servidor Linux

- Sistema operacional Linux com `systemd`.
- Comandos disponíveis: `curl`, `systemctl`.
- Acesso root ou `sudo`.
- Um **token de agente** válido gerado pelo painel/API (isola os dados desse servidor na sua conta).

---

## 3. Funcionamento do agente Python

O agente agora é implementado em **Python**, não mais em Go.

- O script `install-agent.sh`:
   - Verifica dependências: `curl`, `systemctl`, `python3`, `pip3`.
   - Instala pacotes Python necessários (`requests`, `psutil`).
   - Grava o código do agente em `/opt/synexguard/agent.py`.
   - Cria o service systemd `synexguard-agent` que executa:
      - `/usr/bin/env python3 /opt/synexguard/agent.py`.

O código Python do agente lê `/etc/synexguard/agent.conf`, monta o payload de heartbeat e envia para o backend em loop.

---

## 4. Instalação do agente em um servidor Linux

No **servidor Linux**, o usuário final só precisa seguir estes passos:

1. Obter o **AGENT_TOKEN** pelo painel / API do backend (rota de tokens para agentes).
2. Rodar o instalador usando `curl` + `bash`:

```bash
curl -sSL https://raw.githubusercontent.com/kallyd/synexguard/main/scripts/install-agent.sh \
  | sudo bash -s -- --token SEU_AGENT_TOKEN
```

- Substitua `SEU_AGENT_TOKEN` pelo token gerado no painel.

O script fará automaticamente:

1. Validar dependências (`curl`, `systemctl`, `python3`, `pip3`).
2. Criar diretórios de instalação:
   - `/opt/synexguard`
   - `/etc/synexguard`
3. Escrever a configuração em `/etc/synexguard/agent.conf` com:
   - `AGENT_TOKEN`
   - `API_URL`
   - `HEARTBEAT_INTERVAL` (padrão **2 segundos**)
   - `LOG_LEVEL`
4. Instalar bibliotecas Python (`requests`, `psutil`).
5. Gravar o agente em `/opt/synexguard/agent.py` e torná-lo executável.
6. Criar o service systemd `/etc/systemd/system/synexguard-agent.service` apontando para o agente Python e executar:
   - `systemctl daemon-reload`
   - `systemctl enable synexguard-agent`
   - `systemctl restart synexguard-agent`

Ao final, o script mostra o caminho da configuração, token (parcial) e URL da API.

---

## 5. Verificação e troubleshooting

No servidor Linux, para checar o estado do agente:

```bash
sudo systemctl status synexguard-agent
```

Para ver logs em tempo real:

```bash
journalctl -u synexguard-agent -f
```

Se o agente não conseguir autenticar (HTTP 401 na API), verifique:

- Se o `AGENT_TOKEN` em `/etc/synexguard/agent.conf` é válido.
- Se a `API_URL` aponta para o backend correto.
- Se o relógio do servidor está sincronizado (NTP).

---

## 6. Resumo rápido

- **Repositório público**: apenas `scripts/install-agent.sh` (o código Python é embutido no script).
- **Sem binário Go / releases**: o agente agora é Python, gerado em `/opt/synexguard/agent.py` pelo instalador.
- **Instalação no servidor**: usar o `install-agent.sh` via `curl | bash` com `--token`; o heartbeat padrão é de **2 segundos**.
