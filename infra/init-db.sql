-- ═══════════════════════════════════════════════════
--  CRM Omnichannel — Script de Inicialização do DB
--  Executado automaticamente pelo docker-compose
-- ═══════════════════════════════════════════════════

-- Extensão vetorial para memória da IA (EVELYN)
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── TABELA: Usuários do Sistema ─────────────────
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'vendedor',  -- 'admin', 'vendedor', 'suporte'
    ramal VARCHAR(10),                     -- Ramal SIP no NeWave
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ─── TABELA: Leads / Clientes ────────────────────
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    email VARCHAR(255),
    documento VARCHAR(20),                -- CPF/CNPJ
    cidade VARCHAR(100),
    uf CHAR(2),
    endereco TEXT,
    score_propensao DECIMAL(5,2) DEFAULT 0.00,
    score_churn DECIMAL(5,2) DEFAULT 0.00,
    etapa_kanban VARCHAR(50) DEFAULT 'novo',
    vendedor_id UUID REFERENCES usuarios(id),
    ixc_cliente_id BIGINT,                -- ID espelhado do IXC
    origem VARCHAR(50),                    -- 'whatsapp', 'telefone', 'site', 'indicacao'
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_etapa ON leads(etapa_kanban);
CREATE INDEX IF NOT EXISTS idx_leads_vendedor ON leads(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_leads_ixc ON leads(ixc_cliente_id);
CREATE INDEX IF NOT EXISTS idx_leads_score_churn ON leads(score_churn DESC);

-- ─── TABELA: Interações (Omnichannel) ────────────
CREATE TABLE IF NOT EXISTS interacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES usuarios(id),
    canal VARCHAR(20) NOT NULL,            -- 'whatsapp', 'voz', 'email', 'sistema'
    direcao VARCHAR(10),                   -- 'inbound', 'outbound'
    conteudo TEXT,
    sentimento VARCHAR(20),                -- 'positivo', 'negativo', 'neutro', 'agressivo'
    sentimento_score DECIMAL(5,2),         -- 0.00 a 1.00
    duracao_segundos INT,                  -- Para chamadas de voz
    metadata JSONB,                        -- Dados extras flexíveis
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interacoes_lead ON interacoes(lead_id);
CREATE INDEX IF NOT EXISTS idx_interacoes_canal ON interacoes(canal);
CREATE INDEX IF NOT EXISTS idx_interacoes_sentimento ON interacoes(sentimento);

-- ─── TABELA: Campanhas de Disparo ────────────────
CREATE TABLE IF NOT EXISTS campanhas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(20) NOT NULL,             -- 'cobranca', 'vendas', 'retencao', 'boas_vindas'
    status VARCHAR(20) DEFAULT 'rascunho', -- 'rascunho', 'agendada', 'executando', 'concluida', 'pausada'
    mensagem_template TEXT NOT NULL,
    canal VARCHAR(20) DEFAULT 'whatsapp',
    total_alvos INT DEFAULT 0,
    total_enviados INT DEFAULT 0,
    total_entregues INT DEFAULT 0,
    total_lidos INT DEFAULT 0,
    total_respondidos INT DEFAULT 0,
    total_erros INT DEFAULT 0,
    agendado_para TIMESTAMP,
    iniciado_em TIMESTAMP,
    finalizado_em TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ─── TABELA: Itens de Campanha ───────────────────
CREATE TABLE IF NOT EXISTS campanha_itens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campanha_id UUID REFERENCES campanhas(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id),
    telefone VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pendente', -- 'pendente', 'enviado', 'entregue', 'lido', 'respondido', 'erro'
    erro_detalhe TEXT,
    opa_message_id VARCHAR(100),           -- ID da mensagem no OPA Suite
    enviado_em TIMESTAMP,
    entregue_em TIMESTAMP,
    lido_em TIMESTAMP,
    respondido_em TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campanha_itens_campanha ON campanha_itens(campanha_id);
CREATE INDEX IF NOT EXISTS idx_campanha_itens_status ON campanha_itens(status);

-- ─── TABELA: Contratos (Espelho IXC) ────────────
CREATE TABLE IF NOT EXISTS contratos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    ixc_contrato_id BIGINT,
    plano VARCHAR(255),
    valor DECIMAL(10,2),
    status VARCHAR(30),                    -- 'ativo', 'suspenso', 'cancelado'
    data_inicio DATE,
    data_vencimento INT,                   -- Dia do mês
    sync_at TIMESTAMP DEFAULT NOW()
);

-- ─── TABELA: Faturas (Espelho IXC) ──────────────
CREATE TABLE IF NOT EXISTS faturas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contrato_id UUID REFERENCES contratos(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id),
    ixc_fatura_id BIGINT,
    valor DECIMAL(10,2),
    data_vencimento DATE,
    data_pagamento DATE,
    status VARCHAR(20),                    -- 'aberta', 'paga', 'atrasada', 'cancelada'
    dias_atraso INT DEFAULT 0,
    sync_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_faturas_status ON faturas(status);
CREATE INDEX IF NOT EXISTS idx_faturas_atraso ON faturas(dias_atraso DESC);

-- ─── TABELA: CDRs — Registros de Chamada ─────────
CREATE TABLE IF NOT EXISTS cdrs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id),
    usuario_id UUID REFERENCES usuarios(id),
    direcao VARCHAR(10),                   -- 'inbound', 'outbound'
    numero_origem VARCHAR(20),
    numero_destino VARCHAR(20),
    ramal VARCHAR(10),
    duracao_segundos INT DEFAULT 0,
    status_chamada VARCHAR(20),            -- 'atendida', 'nao_atendida', 'ocupado', 'cancelada'
    gravacao_url TEXT,
    newave_call_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cdrs_lead ON cdrs(lead_id);
CREATE INDEX IF NOT EXISTS idx_cdrs_usuario ON cdrs(usuario_id);

-- ─── TABELA: Embeddings (Memória da IA) ─────────
CREATE TABLE IF NOT EXISTS embeddings_interacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    interacao_id UUID REFERENCES interacoes(id) ON DELETE CASCADE,
    conteudo_original TEXT NOT NULL,
    embedding vector(1536),                -- Dimensão do modelo de embedding
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_embeddings_vector
  ON embeddings_interacoes USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ─── TABELA: Decisões Autônomas da IA ────────────
CREATE TABLE IF NOT EXISTS ia_decisoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id),
    tipo VARCHAR(50) NOT NULL,             -- 'mover_card', 'disparar_msg', 'rotear_chamada', 'alertar'
    descricao TEXT,
    input_dados JSONB,                     -- Dados que a IA recebeu
    output_acao JSONB,                     -- Ação que a IA tomou
    confianca DECIMAL(5,2),                -- 0.00 a 1.00
    executada BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ia_decisoes_tipo ON ia_decisoes(tipo);
CREATE INDEX IF NOT EXISTS idx_ia_decisoes_lead ON ia_decisoes(lead_id);

-- ─── TABELA: Configurações do Kanban ─────────────
CREATE TABLE IF NOT EXISTS kanban_colunas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    cor VARCHAR(7) DEFAULT '#2563eb',
    posicao INT NOT NULL,
    ativo BOOLEAN DEFAULT TRUE
);

-- Inserir colunas padrão
INSERT INTO kanban_colunas (nome, slug, cor, posicao) VALUES
    ('Novo Lead', 'novo', '#6366f1', 1),
    ('Primeiro Contato', 'contato', '#3b82f6', 2),
    ('Qualificação', 'qualificacao', '#0ea5e9', 3),
    ('Proposta Enviada', 'proposta', '#f59e0b', 4),
    ('Negociação', 'negociacao', '#f97316', 5),
    ('Fechado (Ganho)', 'ganho', '#059669', 6),
    ('Perdido', 'perdido', '#dc2626', 7),
    ('Risco Cancelamento', 'risco', '#e11d48', 8)
ON CONFLICT (slug) DO NOTHING;

-- ─── TABELA: Audit Log (LGPD) ───────────────────
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID,
    acao VARCHAR(50) NOT NULL,             -- 'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'EXPORT'
    entidade VARCHAR(50),                  -- 'lead', 'campanha', 'interacao'
    entidade_id UUID,
    dados_anteriores JSONB,
    dados_novos JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_entidade ON audit_log(entidade, entidade_id);
CREATE INDEX IF NOT EXISTS idx_audit_usuario ON audit_log(usuario_id);

-- ═══ Usuário admin padrão (dev) ══════════════════
INSERT INTO usuarios (nome, email, role, ramal) VALUES
    ('Administrador', 'admin@crm.local', 'admin', '1000')
ON CONFLICT (email) DO NOTHING;

RAISE NOTICE '✅ Banco de dados CRM inicializado com sucesso!';
