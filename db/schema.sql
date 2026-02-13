CREATE TABLE IF NOT EXISTS servidores (
  id BIGSERIAL PRIMARY KEY,
  usuario_id BIGINT,
  nome VARCHAR(120) NOT NULL,
  hostname VARCHAR(255) NOT NULL,
  ip_publico INET,
  sistema_operacional VARCHAR(120),
  status VARCHAR(30) DEFAULT 'online',
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agentes (
  id BIGSERIAL PRIMARY KEY,
  servidor_id BIGINT REFERENCES servidores(id) ON DELETE CASCADE,
  versao VARCHAR(40),
  fingerprint VARCHAR(255) UNIQUE,
  ultimo_heartbeat TIMESTAMPTZ,
  tls_cn VARCHAR(255),
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS eventos (
  id BIGSERIAL PRIMARY KEY,
  servidor_id BIGINT REFERENCES servidores(id) ON DELETE SET NULL,
  agente_id BIGINT REFERENCES agentes(id) ON DELETE SET NULL,
  tipo VARCHAR(80) NOT NULL,
  severidade VARCHAR(20) NOT NULL,
  payload JSONB NOT NULL,
  origem_ip INET,
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tentativas_login (
  id BIGSERIAL PRIMARY KEY,
  servidor_id BIGINT REFERENCES servidores(id) ON DELETE CASCADE,
  usuario VARCHAR(120),
  ip_origem INET,
  sucesso BOOLEAN DEFAULT FALSE,
  metodo VARCHAR(50) DEFAULT 'ssh',
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ips_banidos (
  id BIGSERIAL PRIMARY KEY,
  servidor_id BIGINT REFERENCES servidores(id) ON DELETE CASCADE,
  ip INET NOT NULL,
  motivo TEXT,
  origem VARCHAR(40) DEFAULT 'automatico',
  expira_em TIMESTAMPTZ,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS regras_firewall (
  id BIGSERIAL PRIMARY KEY,
  servidor_id BIGINT REFERENCES servidores(id) ON DELETE CASCADE,
  engine VARCHAR(20) NOT NULL,
  regra TEXT NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS metricas (
  id BIGSERIAL PRIMARY KEY,
  servidor_id BIGINT REFERENCES servidores(id) ON DELETE CASCADE,
  cpu_percent NUMERIC(5,2),
  ram_percent NUMERIC(5,2),
  disco_percent NUMERIC(5,2),
  processos INTEGER,
  conexoes_ativas INTEGER,
  portas_abertas INTEGER,
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trafego_rede (
  id BIGSERIAL PRIMARY KEY,
  servidor_id BIGINT REFERENCES servidores(id) ON DELETE CASCADE,
  bytes_in BIGINT,
  bytes_out BIGINT,
  pacotes_in BIGINT,
  pacotes_out BIGINT,
  interface VARCHAR(80),
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS alertas (
  id BIGSERIAL PRIMARY KEY,
  servidor_id BIGINT REFERENCES servidores(id) ON DELETE SET NULL,
  evento_id BIGINT REFERENCES eventos(id) ON DELETE SET NULL,
  titulo VARCHAR(180) NOT NULL,
  severidade VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'ativo',
  descricao TEXT,
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS automacoes (
  id BIGSERIAL PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  condicao JSONB NOT NULL,
  acao JSONB NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS usuarios (
  id BIGSERIAL PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  email VARCHAR(180) UNIQUE NOT NULL,
  senha_hash TEXT NOT NULL,
  role VARCHAR(30) DEFAULT 'user',
  avatar_url TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_tokens (
  id BIGSERIAL PRIMARY KEY,
  usuario_id BIGINT REFERENCES usuarios(id) ON DELETE CASCADE,
  token VARCHAR(64) UNIQUE NOT NULL,
  nome VARCHAR(120) NOT NULL,
  descricao TEXT,
  ultimo_uso TIMESTAMPTZ,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE servidores ADD COLUMN IF NOT EXISTS usuario_id BIGINT REFERENCES usuarios(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS permissoes (
  id BIGSERIAL PRIMARY KEY,
  usuario_id BIGINT REFERENCES usuarios(id) ON DELETE CASCADE,
  recurso VARCHAR(80) NOT NULL,
  acao VARCHAR(40) NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS auditoria (
  id BIGSERIAL PRIMARY KEY,
  usuario_id BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
  acao VARCHAR(120) NOT NULL,
  recurso VARCHAR(120),
  detalhes JSONB,
  ip_origem INET,
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eventos_tipo_criado_em ON eventos (tipo, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_alertas_status_criado_em ON alertas (status, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_ips_banidos_ip_ativo ON ips_banidos (ip, ativo);
CREATE INDEX IF NOT EXISTS idx_metricas_servidor_criado_em ON metricas (servidor_id, criado_em DESC);
