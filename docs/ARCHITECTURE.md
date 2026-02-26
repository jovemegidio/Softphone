<h1 align="center">🏗️ Arquitetura do Sistema</h1>

<p align="center">
  <strong>Plataforma CRM Omnichannel & AI Selfware para ISPs</strong><br>
  Documentação Técnica de Arquitetura — Boutique de Engenharia de Software
</p>

---

## 📐 Visão Arquitetural

O sistema segue a **Arquitetura Hexagonal (Ports and Adapters)** no Backend, garantindo que o **Core de Negócios** (CRM, IA, Vendas) seja totalmente **agnóstico** e isolado das ferramentas externas (IXC, OPA, NeWave).

```
                          ┌──────────────────────────────────────────┐
                          │         CAMADA DE APRESENTAÇÃO           │
                          │           Next.js 14+ (React)            │
                          │                                          │
                          │  ┌──────────┐ ┌────────┐ ┌───────────┐  │
                          │  │  Kanban   │ │Softfone│ │ Dashboard │  │
                          │  │(Framer M)│ │(SIP.js)│ │(Charts)   │  │
                          │  └────┬─────┘ └───┬────┘ └─────┬─────┘  │
                          │       │           │             │        │
                          │       │    WebRTC │    REST     │        │
                          │       │   (Audio) │   /WSS     │        │
                          └───────┼───────────┼────────────┼────────┘
                                  │           │            │
                          ════════╪═══════════╪════════════╪════════
                                  │    BFF Gateway         │
                          ════════╪═══════════╪════════════╪════════
                                  │           │            │
                ┌─────────────────┼───────────┼────────────┼──────────────┐
                │                 │    BACKEND CORE (Spring Boot)         │
                │                 │                                       │
                │  ┌──────────────┴───────────┴────────────┴───────────┐  │
                │  │              INBOUND ADAPTERS                     │  │
                │  │  ┌──────────┐ ┌──────────┐ ┌───────────────────┐  │  │
                │  │  │REST Ctrl │ │WebSocket │ │Webhook Listeners │  │  │
                │  │  │(API)     │ │(Kanban)  │ │(OPA Delivery)    │  │  │
                │  │  └────┬─────┘ └────┬─────┘ └────────┬──────────┘  │  │
                │  └───────┼────────────┼────────────────┼─────────────┘  │
                │          │            │                │                 │
                │  ┌───────┴────────────┴────────────────┴─────────────┐  │
                │  │                 APPLICATION LAYER                  │  │
                │  │  ┌──────────────┐ ┌─────────────┐ ┌────────────┐  │  │
                │  │  │DispararMsg   │ │AtualizarLead│ │AnalisarIA  │  │  │
                │  │  │UseCase       │ │UseCase      │ │UseCase     │  │  │
                │  │  └──────┬───────┘ └──────┬──────┘ └─────┬──────┘  │  │
                │  └─────────┼────────────────┼──────────────┼─────────┘  │
                │            │                │              │             │
                │  ┌─────────┴────────────────┴──────────────┴─────────┐  │
                │  │                  DOMAIN LAYER                     │  │
                │  │  ┌────────┐ ┌────────┐ ┌──────┐ ┌─────────────┐  │  │
                │  │  │ Lead   │ │Cliente │ │Venda │ │ScoreChurn   │  │  │
                │  │  │Entity  │ │Entity  │ │Entity│ │ValueObject  │  │  │
                │  │  └────────┘ └────────┘ └──────┘ └─────────────┘  │  │
                │  │  ┌──────────────────────────────────────────────┐ │  │
                │  │  │            PORTS (Interfaces)                │ │  │
                │  │  │  IClienteRepository  IIxcGateway             │ │  │
                │  │  │  IMensageriaGateway  ITelefoniaGateway       │ │  │
                │  │  │  IIAEngine           INotificacaoGateway     │ │  │
                │  │  └──────────────────────────────────────────────┘ │  │
                │  └───────────────────────────────────────────────────┘  │
                │            │                │              │             │
                │  ┌─────────┴────────────────┴──────────────┴─────────┐  │
                │  │              OUTBOUND ADAPTERS                    │  │
                │  │  ┌─────────┐ ┌──────────┐ ┌────────┐ ┌────────┐  │  │
                │  │  │IXC Soft │ │OPA Suite │ │NeWave  │ │Ollama  │  │  │
                │  │  │(REST)   │ │(REST+MQ) │ │(SIP)   │ │(LLM)   │  │  │
                │  │  └─────────┘ └──────────┘ └────────┘ └────────┘  │  │
                │  └───────────────────────────────────────────────────┘  │
                └─────────────────────────────────────────────────────────┘
                                         │
                ═════════════════════════╪═════════════════════════════
                        INFRAESTRUTURA   │
                ═════════════════════════╪═════════════════════════════
                                         │
          ┌──────────┐  ┌──────────┐  ┌──┴───────┐  ┌──────────┐  ┌──────────┐
          │PostgreSQL│  │  Redis   │  │ RabbitMQ │  │  Ollama  │  │  Docker  │
          │+ pgvector│  │(Cache)   │  │(Filas)   │  │(LLM AI) │  │(Compose) │
          └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘
```

---

## 🧩 Diagrama de Camadas

### 1. Camada de Apresentação (Frontend)

| Componente | Tecnologia | Função |
|-----------|-----------|--------|
| **Framework** | Next.js 14+ (App Router) | SSR/SSG + CSR híbrido |
| **UI Components** | TailwindCSS + Shadcn/ui | Design system ágil |
| **Kanban Board** | Framer Motion | Drag-and-drop fluido com animações |
| **Softphone** | SIP.js / JsSIP | User Agent SIP no navegador |
| **Áudio P2P** | WebRTC | Tráfego de voz bidirecional |
| **Estado** | Zustand | State management leve e performático |
| **Comunicação** | REST + WSS (WebSocket Secure) | CRUD + real-time |

**Protocolos de Comunicação:**
- `HTTPS/REST` → Requisições CRUD padrão
- `WSS (WebSocket Secure)` → Tunnel SIP + atualizações em tempo real do Kanban
- `WebRTC` → Tráfego de áudio direto no navegador (sem plugins)

---

### 2. BFF — Backend for Frontend

O padrão **BFF** atua como gateway inteligente. O frontend faz **uma única requisição**, e o BFF orquestra as chamadas internas necessárias:

```
Frontend ──(1 request)──► BFF Gateway ──► IXC Adapter
                                     ──► OPA Adapter
                                     ──► NeWave Adapter
                                     ──► AI Engine
```

Isso elimina a sobrecarga no client-side e centraliza a lógica de orquestração.

---

### 3. Backend Core (Spring Boot — Hexagonal)

| Camada | Pacote | Responsabilidade |
|--------|--------|-----------------|
| **Inbound Adapters** | `adapters.inbound` | Controllers REST, WebSocket Listeners, Webhook OPA |
| **Application** | `application` | Use Cases (orquestração de casos de uso) |
| **Domain** | `domain` | Entidades, Value Objects, Ports (interfaces) |
| **Outbound Adapters** | `adapters.outbound` | Clientes HTTP: IXC, OPA, NeWave, Ollama |
| **Infrastructure** | `infrastructure` | JPA, Redis Config, RabbitMQ Config |

**Princípio fundamental:** O Domain **NUNCA** importa classes dos Adapters. Ele define `Ports` (interfaces), e os Adapters os implementam.

---

### 4. Integrações Externas

#### 🔌 IXC Soft (ERP)
| Item | Detalhe |
|------|---------|
| **Protocolo** | REST API (JSON) |
| **Autenticação** | Token Base64 |
| **Padrão** | Jobs agendados (`@Scheduled`) para sync noturna |
| **Dados** | Clientes, contratos, faturas, chamados técnicos |

#### 💬 OPA Suite (WhatsApp / Mensageria)
| Item | Detalhe |
|------|---------|
| **Envio** | REST API → Fila RabbitMQ → Worker consome → API OPA |
| **Recebimento** | Webhook Controller (Inbound Adapter) |
| **Validação** | HMAC com `OPA_WEBHOOK_SECRET` |
| **Dados** | Delivery receipts, respostas, status de leitura |

#### 📞 NeWave (Central SIP / PABX)
| Item | Detalhe |
|------|---------|
| **Sinalização** | WSS (`wss://ip:8089/ws`) via SIP.js no frontend |
| **Tráfego de Voz** | RTP/SRTP (peer-to-peer entre navegador ↔ NeWave) |
| **Click-to-Dial** | Spring Boot → API REST NeWave → Inicia chamada |
| **CDRs** | API REST para puxar relatórios de chamada |
| **IMPORTANTE** | O Java NÃO toca no áudio — ele gerencia a lógica |

---

### 5. Motor Cognitivo — E.V.E.L.Y.N (AI Selfware)

> **E.V.E.L.Y.N** = Engine for Virtual Enhancement, Learning & Yielding Notifications

| Componente | Tecnologia | Função |
|-----------|-----------|--------|
| **LLM Runtime** | Ollama (Docker) | Executa modelos locais (Llama3, Mistral, Gemma) |
| **Java SDK** | LangChain4j | Interface Java → Ollama |
| **Vector DB** | pgvector (PostgreSQL) | Memória contextual da IA |
| **Entrada** | Filas RabbitMQ | Consome mensagens OPA + logs IXC |
| **Saída** | Eventos no RabbitMQ | Comandos: mover card, disparar msg, alertar |

**Fluxo de decisão autônoma:**
```
  IXC (dados brutos)  ──┐
  OPA (mensagens)     ──┤──► RabbitMQ ──► EVELYN (LLM) ──► Decisão
  NeWave (CDRs)       ──┘                                    │
                                                              ├── Mover card Kanban (WSS)
                                                              ├── Disparar WhatsApp (OPA)
                                                              ├── Rotear chamada (NeWave)
                                                              └── Alertar atendente (Push)
```

---

## 🗄️ Bancos de Dados

### PostgreSQL 16+ (Principal)

```sql
-- Tabelas Core do CRM
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    email VARCHAR(255),
    cidade VARCHAR(100),
    uf CHAR(2),
    score_propensao DECIMAL(5,2) DEFAULT 0,
    score_churn DECIMAL(5,2) DEFAULT 0,
    etapa_kanban VARCHAR(50) DEFAULT 'novo',
    vendedor_id UUID REFERENCES usuarios(id),
    ixc_cliente_id BIGINT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE interacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id),
    canal VARCHAR(20) NOT NULL, -- 'whatsapp', 'voz', 'email'
    direcao VARCHAR(10),        -- 'inbound', 'outbound'
    conteudo TEXT,
    sentimento VARCHAR(20),     -- 'positivo', 'negativo', 'neutro'
    duracao_segundos INT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE campanhas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255),
    tipo VARCHAR(20),           -- 'cobranca', 'vendas', 'retencao'
    status VARCHAR(20) DEFAULT 'rascunho',
    mensagem_template TEXT,
    total_enviados INT DEFAULT 0,
    total_respondidos INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Extensão vetorial para memória da IA
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE embeddings_interacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id),
    conteudo_original TEXT,
    embedding vector(1536),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_embeddings_vector ON embeddings_interacoes
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### Redis (Cache & Sessões)

| Uso | Chave | TTL |
|-----|-------|-----|
| Sessão SIP | `sip:session:{userId}` | 8h |
| Cache viabilidade | `ixc:viabilidade:{cep}` | 24h |
| Rate limit OPA | `ratelimit:opa:{minuto}` | 60s |
| Kanban snapshot | `kanban:board:{userId}` | 5min |

---

## 🔒 Segurança

| Camada | Solução |
|--------|---------|
| **Autenticação** | OAuth2 / OpenID Connect (Keycloak) |
| **API Gateway** | Rate limiting + JWT validation |
| **Dados sensíveis** | IA local (Ollama) — zero dados na nuvem |
| **LGPD** | Logs anonimizados, consentimento auditável |
| **Comunicação** | TLS 1.3 (HTTPS), SRTP (áudio), WSS (websocket) |
| **Infra** | Docker isolado, secrets via Vault/env |

---

## 📊 Estrutura de Diretórios

```
/crm-omnichannel
│
├── /frontend-web                    # Next.js 14+
│   ├── /app                         # App Router (pages, layouts)
│   ├── /components
│   │   ├── /kanban                  # Board, Column, Card, DragOverlay
│   │   ├── /softphone               # Dialer, CallView, IncomingCall
│   │   ├── /dashboard               # Charts, KPIs, ScoreGauges
│   │   └── /ui                      # Shadcn components
│   ├── /hooks
│   │   ├── useSIP.ts                # WebRTC/SIP session management
│   │   ├── useWebSocket.ts          # Real-time Kanban updates
│   │   └── useKanban.ts             # Board state + drag logic
│   ├── /services
│   │   ├── api.ts                   # Axios/fetch wrapper (BFF)
│   │   └── sip-config.ts            # SIP.js configuration
│   ├── /stores                      # Zustand stores
│   └── /styles                      # TailwindCSS config
│
├── /backend-core                    # Spring Boot 3.x (Java 21+)
│   └── /src/main/java/com/crm
│       ├── /domain
│       │   ├── /entities            # Lead, Cliente, Venda, Campanha
│       │   ├── /valueobjects        # ScoreChurn, ScorePropensao, Sentimento
│       │   ├── /ports
│       │   │   ├── /inbound         # ILeadService, ICampanhaService
│       │   │   └── /outbound        # IIxcGateway, IOpaGateway, INeWaveGateway, IIAEngine
│       │   └── /events              # LeadMovedEvent, MsgReceivedEvent
│       ├── /application
│       │   ├── DispararMensagemUseCase.java
│       │   ├── AtualizarLeadUseCase.java
│       │   ├── AnalisarSentimentoUseCase.java
│       │   ├── RotearChamadaUseCase.java
│       │   └── SyncIxcUseCase.java
│       ├── /adapters
│       │   ├── /inbound
│       │   │   ├── LeadController.java
│       │   │   ├── KanbanWebSocketHandler.java
│       │   │   ├── OpaWebhookController.java
│       │   │   └── NeWaveCDRController.java
│       │   └── /outbound
│       │       ├── IxcHttpClient.java
│       │       ├── OpaSuiteHttpClient.java
│       │       ├── NeWaveHttpClient.java
│       │       └── OllamaAIClient.java
│       └── /infrastructure
│           ├── /config              # SecurityConfig, RabbitConfig, RedisConfig
│           ├── /persistence         # JPA Repositories
│           └── /messaging           # RabbitMQ Publishers/Consumers
│
├── /ai-agent                        # Motor Cognitivo
│   ├── Dockerfile                   # Ollama + modelo pré-carregado
│   ├── modelfile                    # Configuração custom do LLM
│   └── /prompts                     # System prompts da EVELYN
│       ├── sentimento.txt
│       ├── score-churn.txt
│       ├── roteiro-vendas.txt
│       └── resumo-cliente.txt
│
├── /docs                            # Documentação
│   ├── ARCHITECTURE.md
│   ├── ROADMAP.md
│   └── EVELYN.md
│
├── docker-compose.yml               # Infra completa
├── .env.example                     # Template de variáveis
└── README.md                        # Visão geral do projeto
```

---

## 🔄 Fluxos Críticos

### Fluxo 1: Lead entra pelo WhatsApp
```
1. Cliente envia msg no WhatsApp
2. OPA Suite recebe e dispara Webhook → Spring Boot (OpaWebhookController)
3. Spring cria/atualiza Lead no PostgreSQL
4. Joga mensagem na fila RabbitMQ (queue: "ia.analise.sentimento")
5. EVELYN consome a fila, analisa sentimento via Ollama
6. EVELYN publica evento: { tipo: "ATUALIZAR_SCORE", leadId, sentimento: "negativo" }
7. Spring atualiza score_churn do Lead
8. Se score > 80 → move card para "Risco Cancelamento" via WebSocket
9. Frontend recebe evento WSS → anima card para nova coluna no Kanban
```

### Fluxo 2: Click-to-Dial (Ligação)
```
1. Vendedor clica em "Ligar" no card do Lead (Next.js)
2. Frontend envia POST /api/call/dial { leadId, vendedorId }
3. Spring Boot chama API REST do NeWave (Click-to-Dial)
4. NeWave conecta ramal do vendedor via SIP
5. SIP.js no navegador recebe INVITE → estabelece sessão WebRTC
6. Áudio flui via RTP/SRTP (browser ↔ NeWave)
7. EVELYN gera roteiro de vendas baseado no perfil do lead
8. Roteiro aparece no painel lateral do card em tempo real
9. Ao encerrar, CDR é registrado e duração atualiza o histórico
```

### Fluxo 3: Self-Healing (Retenção Automática)
```
1. Job @Scheduled roda às 02:00 → Sync IXC → PostgreSQL
2. EVELYN analisa: cliente com 3 quedas de conexão na semana
3. Score de churn sobe para 85 (alto risco)
4. EVELYN gera ação autônoma:
   a) Move card para "Risco Cancelamento" no Kanban
   b) Dispara WhatsApp personalizado via OPA Suite:
      "Notamos instabilidade na sua região. Liberamos 100 Mega
       extra para você neste fim de semana 🚀"
5. Se cliente responde negativamente → bloqueia bot → transborda para humano
6. Tela do atendente destaca em vermelho → prioridade máxima
```

---

## 📡 Protocolos de Comunicação (Resumo)

| De → Para | Protocolo | Porta | Uso |
|-----------|----------|-------|-----|
| Next.js → Spring Boot | HTTPS/REST | 443 | CRUD, APIs |
| Next.js ↔ Spring Boot | WSS | 443 | Kanban real-time |
| Next.js ↔ NeWave | WSS (SIP) | 8089 | Sinalização SIP |
| Next.js ↔ NeWave | WebRTC/SRTP | dinâmica | Áudio da chamada |
| Spring Boot → IXC | HTTPS/REST | 443 | Sync ERP |
| Spring Boot → OPA Suite | HTTPS/REST | 443 | Envio WhatsApp |
| OPA Suite → Spring Boot | HTTPS (Webhook) | 443 | Delivery receipts |
| Spring Boot ↔ RabbitMQ | AMQP | 5672 | Filas de mensagens |
| Spring Boot → Ollama | HTTP | 11434 | Inferência IA local |
| Spring Boot → PostgreSQL | TCP | 5432 | Dados persistentes |
| Spring Boot → Redis | TCP | 6379 | Cache/sessões |

---

<p align="center">
  <sub>Documentação mantida por <a href="https://github.com/jovemegidio">@jovemegidio</a> — Boutique de Engenharia de Software</sub>
</p>
