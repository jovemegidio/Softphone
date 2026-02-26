<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socketdotio&logoColor=white" />
  <img src="https://img.shields.io/badge/WebRTC-333333?style=for-the-badge&logo=webrtc&logoColor=white" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" />
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" />
</p>
<p align="center">
  <img src="https://img.shields.io/badge/Spring_Boot-6DB33F?style=for-the-badge&logo=springboot&logoColor=white" />
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/RabbitMQ-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/Ollama_AI-000000?style=for-the-badge&logo=ollama&logoColor=white" />
</p>

<h1 align="center">📞 CRM Omnichannel & AI Selfware</h1>

<p align="center">
  <strong>Plataforma de Comunicação, Vendas e Inteligência Autônoma para ISPs</strong>
</p>

<p align="center">
  Ecossistema enterprise que unifica <strong>Telefonia SIP</strong> (NeWave), <strong>WhatsApp</strong> (OPA Suite)<br>
  e <strong>ERP</strong> (IXC Soft) em um CRM Kanban com IA autônoma local — conceito <strong>Selfware</strong>.
</p>

<p align="center">
  <a href="https://jovemegidio.github.io/Softphone">🌐 Demo Softphone (PoC)</a> •
  <a href="docs/ARCHITECTURE.md">🏗️ Arquitetura</a> •
  <a href="docs/ROADMAP.md">🗺️ Roadmap</a> •
  <a href="docs/EVELYN.md">🧠 E.V.E.L.Y.N (IA)</a>
</p>

---

## 🎯 Visão Geral

Este repositório é o **núcleo de um ecossistema enterprise** para provedores de internet (ISPs), concebido como uma **Boutique de Engenharia de Software**. O projeto nasce com um Softphone WebRTC funcional (Fase 0 — PoC) e evolui para uma plataforma completa de CRM Omnichannel com IA autônoma.

### O Ecossistema Completo

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CRM OMNICHANNEL & AI SELFWARE                    │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────────┐  │
│  │ Softphone│  │  Kanban   │  │ WhatsApp │  │   🧠 E.V.E.L.Y.N  │  │
│  │  WebRTC  │  │ (Vendas)  │  │  (OPA)   │  │  Motor IA Local   │  │
│  │  SIP.js  │  │  Next.js  │  │ RabbitMQ │  │  Ollama/LangChain │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬───────────┘  │
│       │              │             │                  │              │
│       └──────────────┴─────────────┴──────────────────┘              │
│                           │                                          │
│                 Spring Boot (Hexagonal Architecture)                  │
│                    PostgreSQL + Redis + RabbitMQ                      │
│                                                                      │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────────────────┐  │
│  │ IXC Soft │  │ NeWave (SIP) │  │     Docker (Infraestrutura)  │  │
│  │  (ERP)   │  │   (PABX)     │  │   Containerização completa   │  │
│  └──────────┘  └──────────────┘  └───────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

> 💡 **Conceito Selfware:** O sistema não é apenas uma ferramenta — é um **agente autônomo** que aprende padrões, calcula scores de churn/propensão e toma decisões de vendas e retenção sozinho.

---

## 🧠 E.V.E.L.Y.N — Engine for Virtual Enhancement, Learning & Yielding Notifications

O cérebro do ecossistema. Uma IA **local** (Ollama + LangChain4j) que roda na própria infraestrutura — **zero dados na nuvem**, compliance total com LGPD.

| Capacidade | Como Funciona |
|-----------|--------------|
| **Análise de Sentimento** | Classifica mensagens WhatsApp em tempo real (positivo/neutro/negativo/agressivo) |
| **Score de Propensão** | Calcula probabilidade de venda cruzando perfil IXC + interações OPA + CDRs |
| **Score de Churn** | Monitora risco de cancelamento (quedas de conexão, atrasos, sentimento) |
| **Roteamento Preditivo** | Direciona leads para vendedores com maior taxa de fechamento naquele perfil |
| **Self-Healing** | Detecta insatisfação → dispara WhatsApp de retenção → move card no Kanban |
| **Roteiro de Vendas** | Gera script personalizado em tempo real durante a chamada |
| **Transbordo Inteligente** | Sentimento agressivo → bloqueia bot → humano com tela em vermelho |

📖 [Documentação completa da E.V.E.L.Y.N →](docs/EVELYN.md)

---

## ✨ Funcionalidades

### 📞 Softphone VoIP (Fase 0 — ✅ Funcional)
- Chamadas de voz **peer-to-peer** via WebRTC
- Suporte a chamadas **entre cidades e estados** (STUN + TURN)
- Sinalização em tempo real com **Socket.IO**
- Controles de chamada: mudo, volume, encerrar
- Cronômetro de duração da chamada
- Background animado com **partículas interativas** (Canvas API)

### 📝 Bloco de Notas — Estilo Notion
- Editor **rich text** com toolbar completa (negrito, itálico, sublinhado, listas, checklists)
- Categorização por tipo (Ligação, Reunião, Tarefa, Importante)
- Sistema de **fixar notas** + busca instantânea + **auto-save**

### 👥 Gestão de Contatos + Histórico
- CRUD completo de contatos com busca em tempo real
- Registro automático de chamadas com filtros

### 🏗️ Visão Enterprise (Em Desenvolvimento)

| Módulo | Tecnologia | Status |
|--------|-----------|--------|
| **CRM Kanban** | Next.js 14 + Framer Motion | 📋 Planejado |
| **Softphone SIP** | SIP.js + NeWave WSS | 📋 Planejado |
| **WhatsApp Omnichannel** | OPA Suite + RabbitMQ | 📋 Planejado |
| **ERP Integration** | IXC Soft REST API | 📋 Planejado |
| **IA Selfware (E.V.E.L.Y.N)** | Ollama + LangChain4j | 📋 Planejado |
| **Backend Hexagonal** | Spring Boot 3.x + Java 21 | 📋 Planejado |
| **Infra** | Docker + PostgreSQL + Redis | ✅ Configurado |

---

## 🖼️ Preview

| Tela de Login | Central de Chamadas |
|:---:|:---:|
| Background com partículas animadas interativas | Painel com lista de usuários e controles de chamada |

| Bloco de Notas | Contatos |
|:---:|:---:|
| Editor rich text estilo Notion com categorias | Gestão completa de contatos empresariais |

---

## 🏗️ Arquitetura

O backend segue **Arquitetura Hexagonal (Ports and Adapters)** — o Core de Negócios é totalmente agnóstico das ferramentas externas.

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND — Next.js 14+                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────────┐  │
│  │  Kanban   │ │ Softphone│ │Dashboard │ │    WhatsApp UI    │  │
│  │(Framer M)│ │ (SIP.js) │ │ (Charts) │ │  (Chat + Status)  │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬───────────┘  │
│       └─────────────┴───────────┴────────────────┘               │
│                    REST / WSS / WebRTC                            │
└────────────────────────┬─────────────────────────────────────────┘
                         │
┌────────────────────────┼─────────────────────────────────────────┐
│              BACKEND — Spring Boot 3.x (Hexagonal)               │
│                                                                   │
│  INBOUND         APPLICATION            DOMAIN                   │
│  ┌──────────┐    ┌──────────────┐       ┌─────────────────────┐  │
│  │REST Ctrl │───►│DispararMsg   │──────►│ Lead, Cliente, Venda│  │
│  │WebSocket │───►│AtualizarLead │──────►│ Ports (Interfaces)  │  │
│  │Webhooks  │───►│AnalisarIA    │──────►│ Events, ValueObjects│  │
│  └──────────┘    └──────────────┘       └──────────┬──────────┘  │
│                                                     │             │
│  OUTBOUND                                           │             │
│  ┌─────────┐ ┌──────────┐ ┌────────┐ ┌────────┐    │             │
│  │IXC Soft │ │OPA Suite │ │NeWave  │ │Ollama  │◄───┘             │
│  │  (ERP)  │ │(WhatsApp)│ │ (SIP)  │ │(LLM AI)│                  │
│  └─────────┘ └──────────┘ └────────┘ └────────┘                  │
└──────────────────────────────────────────────────────────────────┘
                         │
┌────────────────────────┼─────────────────────────────────────────┐
│                    INFRAESTRUTURA                                 │
│  ┌──────────┐ ┌────────┐ ┌──────────┐ ┌────────┐ ┌───────────┐  │
│  │PostgreSQL│ │ Redis  │ │ RabbitMQ │ │ Ollama │ │  Docker   │  │
│  │+pgvector │ │(Cache) │ │ (Filas)  │ │(LLM AI)│ │ (Compose) │  │
│  └──────────┘ └────────┘ └──────────┘ └────────┘ └───────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

📖 [Documentação completa da Arquitetura →](docs/ARCHITECTURE.md)

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Propósito |
|--------|-----------|-----------|
| **Frontend (PoC)** | HTML5, CSS3, JavaScript ES6+ | Softphone funcional com design system |
| **Frontend (Enterprise)** | Next.js 14+, TailwindCSS, Shadcn/ui | CRM Kanban + Softphone SIP |
| **Backend (PoC)** | Node.js + Express + Socket.IO | Sinalização WebRTC |
| **Backend (Enterprise)** | Java 21 + Spring Boot 3.x | Hexagonal Architecture, BFF |
| **Telefonia** | WebRTC + SIP.js + NeWave | Softphone embutido no navegador |
| **Mensageria** | OPA Suite + RabbitMQ | WhatsApp omnichannel com filas |
| **ERP** | IXC Soft REST API | Sync de clientes, contratos, faturas |
| **IA Selfware** | Ollama + LangChain4j + pgvector | Motor cognitivo local (EVELYN) |
| **Banco de Dados** | PostgreSQL 16 + pgvector | Relacional + vetorial (memória IA) |
| **Cache** | Redis | Sessões SIP, rate limit, viabilidade |
| **Infra** | Docker Compose | PostgreSQL + Redis + RabbitMQ + Ollama |
| **Deploy** | GitHub Actions + Pages | CI/CD automático (frontend PoC) |

---

## 🚀 Instalação

### Pré-requisitos
- **Node.js** 16+ (para a PoC do Softphone)
- **Docker** + **Docker Compose** (para infraestrutura enterprise)
- **Git**

### 1. Softphone PoC (Rápido)

```bash
git clone https://github.com/jovemegidio/Softphone.git
cd Softphone
npm install
npm start
```

Acesse **http://localhost:3000** — usuário de teste pré-configurado.

### 2. Infraestrutura Enterprise (Docker)

```bash
# Copie as variáveis de ambiente
cp .env.example .env

# Suba toda a infraestrutura
docker-compose up -d

# Verifique os serviços
docker-compose ps
```

| Serviço | URL | Credenciais |
|---------|-----|------------|
| **PostgreSQL** | `localhost:5432` | postgres / postgres_dev_2026 |
| **Redis** | `localhost:6379` | — |
| **RabbitMQ** | `localhost:15672` | guest / guest |
| **Ollama (IA)** | `localhost:11434` | — |
| **Adminer (DB)** | `localhost:8081` | (via profile dev) |

```bash
# Para ativar o Adminer (admin DB visual):
docker-compose --profile dev up -d

# Para carregar modelo de IA:
docker exec -it crm-ollama ollama pull llama3
```

---

## 📁 Estrutura do Projeto

```
Softphone/
│
├── 📄 server.js                     # Servidor Express + Socket.IO (PoC)
├── 📄 package.json                  # Dependências Node.js
├── 📄 docker-compose.yml            # 🐳 PostgreSQL + Redis + RabbitMQ + Ollama
├── 📄 .env.example                  # Template de variáveis de ambiente
├── 📄 .gitignore
│
├── 📂 public/                       # Frontend PoC (Softphone WebRTC)
│   ├── 📄 index.html                # SPA principal
│   ├── 📂 css/
│   │   └── 📄 style.css             # Design system (~950 linhas)
│   └── 📂 js/
│       └── 📄 app.js                # Client app (~850 linhas)
│
├── 📂 infra/                        # Scripts de infraestrutura
│   └── 📄 init-db.sql               # Schema PostgreSQL (14 tabelas)
│
├── 📂 docs/                         # 📖 Documentação Enterprise
│   ├── 📄 ARCHITECTURE.md           # Arquitetura Hexagonal completa
│   ├── 📄 ROADMAP.md                # Roteiro de 7 fases
│   └── 📄 EVELYN.md                 # Motor de IA Selfware
│
├── 📂 .github/
│   └── 📂 workflows/
│       └── 📄 deploy.yml            # CI/CD GitHub Actions → Pages
│
└── 📂 data/                         # Persistência JSON (auto-criado)
    ├── 📄 notes.json
    ├── 📄 contacts.json
    └── 📄 call_history.json
```

---

## 🔧 Como Funciona

### Fluxo de Chamada (PoC — WebRTC)
1. Usuário faz login com nome e localização
2. Socket.IO registra o usuário e broadcast a lista online
3. Ao clicar em "Ligar", oferta SDP gerada via WebRTC
4. Sinalização via Socket.IO → aceite/rejeição
5. ICE candidates negociados (STUN/TURN para NAT traversal)
6. Conexão P2P — áudio flui diretamente entre os peers

### Fluxo Enterprise (Visão Completa)
```
1. IXC Soft (ERP)      ──► Spring Boot ──► PostgreSQL (sync noturna)
2. Cliente envia msg    ──► OPA Suite   ──► Webhook ──► RabbitMQ
3. EVELYN consome fila  ──► Analisa sentimento ──► Atualiza score
4. Score churn > 75     ──► Move card Kanban (WSS) + WhatsApp de retenção
5. Vendedor liga        ──► SIP.js + NeWave ──► WebRTC audio ──► CDR salvo
6. EVELYN gera roteiro  ──► Aparece no card do lead em tempo real
```

---

## 🧪 Teste Rápido

O projeto vem com um **usuário de teste pré-configurado**:
- **Nome:** teste
- **Localização:** São Paulo, SP

Basta abrir a aplicação e clicar em "Conectar ao Sistema".

Para testar chamadas, abra duas abas do navegador com nomes diferentes.

---

## �️ Roadmap

| Fase | Descrição | Status |
|------|----------|--------|
| **Fase 0** | Softphone WebRTC (PoC) | ✅ Concluída |
| **Fase 1** | Fundação: Docker + Spring Boot + PostgreSQL + Redis + RabbitMQ | 🟡 Infra pronta |
| **Fase 2** | Integração IXC Soft (sync de clientes, contratos, faturas) | 📋 Planejada |
| **Fase 3** | Motor de disparo OPA Suite (WhatsApp + filas + webhooks) | 📋 Planejada |
| **Fase 4** | Interface Kanban (Next.js + Framer Motion + WebSocket) | 📋 Planejada |
| **Fase 5** | Telefonia SIP (SIP.js + NeWave + Click-to-Dial) | 📋 Planejada |
| **Fase 6** | IA Selfware E.V.E.L.Y.N (Ollama + LangChain4j + pgvector) | 📋 Planejada |
| **Fase 7** | Produção (testes, CI/CD, monitoramento, LGPD) | 📋 Planejada |

📖 [Roadmap detalhado com todas as tarefas →](docs/ROADMAP.md)

---

## � Documentação

| Documento | Descrição |
|-----------|----------|
| [📐 ARCHITECTURE.md](docs/ARCHITECTURE.md) | Diagrama completo de camadas, protocolos, integrações e banco de dados |
| [🗺️ ROADMAP.md](docs/ROADMAP.md) | 7 fases de implementação com estimativas de tempo |
| [🧠 EVELYN.md](docs/EVELYN.md) | Motor de IA: scores, prompts, cenários de atuação autônoma |

---

## �👨‍💻 Desenvolvedor

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/jovemegidio">
        <img src="https://github.com/jovemegidio.png" width="120px;" alt="Foto do desenvolvedor" style="border-radius:50%"/>
        <br />
        <sub><b>@jovemegidio</b></sub>
      </a>
      <br />
      <a href="https://github.com/jovemegidio" title="GitHub">
        <img src="https://img.shields.io/badge/GitHub-100000?style=flat-square&logo=github&logoColor=white" />
      </a>
    </td>
  </tr>
</table>

<p align="center">
  Concebido e desenvolvido com ☕ e visão de produto — Projeto enterprise full-stack construído do zero,<br>
  demonstrando domínio em <strong>Arquitetura Hexagonal</strong>, <strong>WebRTC/SIP</strong>, <strong>Mensageria</strong>,<br>
  <strong>IA Local</strong> e <strong>Integração de Sistemas</strong>.
</p>

<p align="center">
  <em>Boutique de Engenharia de Software</em>
</p>

---

<p align="center">
  <img src="https://img.shields.io/github/stars/jovemegidio/Softphone?style=social" />
  <img src="https://img.shields.io/github/forks/jovemegidio/Softphone?style=social" />
  <img src="https://img.shields.io/github/license/jovemegidio/Softphone?style=flat-square" />
</p>

<p align="center">
  ⭐ Se este projeto foi útil, deixe uma estrela!
</p>
