<h1 align="center">🗺️ Roadmap de Implementação</h1>

<p align="center">
  <strong>Roteiro de ataque em 7 fases — Do alicerce à inteligência autônoma</strong>
</p>

---

> ⚠️ **Regra de ouro:** Nunca avance para a próxima fase sem que a anterior esteja estável e testada.

---

## Fase 0 — Proof of Concept ✅ `CONCLUÍDA`

> **Objetivo:** Provar que é possível fazer chamadas de voz no navegador via WebRTC.

| Entrega | Status |
|---------|--------|
| Servidor Node.js + Express + Socket.IO | ✅ |
| Softphone básico com WebRTC (STUN/TURN) | ✅ |
| Chamadas entre cidades/estados | ✅ |
| Bloco de notas estilo Notion | ✅ |
| Gestão de contatos + Histórico | ✅ |
| Interface profissional com design system | ✅ |
| Background animado com partículas (Canvas API) | ✅ |
| Deploy automático GitHub Pages + Actions | ✅ |

**Repositório:** [github.com/jovemegidio/Softphone](https://github.com/jovemegidio/Softphone)

---

## Fase 1 — Fundação e Infraestrutura 🏗️

> **Objetivo:** Subir o ambiente de desenvolvimento com todos os serviços containerizados.

| # | Tarefa | Tecnologia | Prioridade |
|---|--------|-----------|-----------|
| 1.1 | Criar `docker-compose.yml` com PostgreSQL 16, Redis, RabbitMQ | Docker | 🔴 Crítica |
| 1.2 | Iniciar projeto Spring Boot 3.x com Java 21 | Spring Initializr | 🔴 Crítica |
| 1.3 | Configurar JPA + Flyway (migrations) para PostgreSQL | Spring Data JPA | 🔴 Crítica |
| 1.4 | Configurar Redis (cache + sessões) | Spring Data Redis | 🟡 Alta |
| 1.5 | Configurar RabbitMQ (producers/consumers) | Spring AMQP | 🟡 Alta |
| 1.6 | Configurar Swagger/OpenAPI para documentação | SpringDoc | 🟢 Média |
| 1.7 | Setup autenticação OAuth2 (Keycloak) | Spring Security | 🟡 Alta |
| 1.8 | Criar estrutura hexagonal de pacotes | Manual | 🔴 Crítica |

**Definição de Pronto:** `docker-compose up` sobe toda a infra. Spring Boot conecta em todos os serviços. Swagger acessível em `/swagger-ui`.

---

## Fase 2 — Integração com ERP (IXC Soft) 📊

> **Objetivo:** O CRM "enxerga" os clientes do ISP.

| # | Tarefa | Detalhe |
|---|--------|---------|
| 2.1 | Criar Outbound Adapter `IxcHttpClient` | REST client com token Base64 |
| 2.2 | Mapear endpoints essenciais do IXC | `/clientes`, `/contratos`, `/faturas`, `/chamados` |
| 2.3 | Criar entidades espelhadas no PostgreSQL | `Lead`, `Contrato`, `Fatura` |
| 2.4 | Implementar Job de sincronização noturna | `@Scheduled` cron = `0 0 2 * * ?` |
| 2.5 | Criar endpoint REST para consulta de viabilidade | GET `/api/viabilidade/{cep}` (com cache Redis 24h) |
| 2.6 | Criar Use Case `SyncIxcUseCase` | Orquestra leitura IXC → gravação PostgreSQL |

**Definição de Pronto:** Dados de clientes, contratos e faturas sincronizados automaticamente toda noite. Endpoint de viabilidade funcionando com cache.

---

## Fase 3 — Motor de Disparo (OPA Suite / WhatsApp) 💬

> **Objetivo:** Enviar e receber mensagens WhatsApp de forma escalável.

| # | Tarefa | Detalhe |
|---|--------|---------|
| 3.1 | Criar Outbound Adapter `OpaSuiteHttpClient` | REST client com autenticação |
| 3.2 | Criar fila RabbitMQ `opa.envio.mensagem` | Producer no Use Case → Consumer dispara |
| 3.3 | Implementar Worker consumer com rate limiting | Redis counter: max 60 msgs/minuto |
| 3.4 | Criar Inbound Adapter `OpaWebhookController` | Recebe delivery receipts + respostas |
| 3.5 | Validar webhooks com HMAC (`OPA_WEBHOOK_SECRET`) | Segurança contra replay attacks |
| 3.6 | Criar Use Case `DispararMensagemUseCase` | Recebe lista → enfileira → rastreia status |
| 3.7 | Criar entidade `Campanha` com templates | CRUD de campanhas de disparo |

**Definição de Pronto:** É possível disparar campanha de WhatsApp para N números. Webhooks de resposta são processados e salvos. Rate limit funciona.

---

## Fase 4 — Interface Visual (Next.js + Kanban) 🖼️

> **Objetivo:** O vendedor tem uma interface completa para operar.

| # | Tarefa | Detalhe |
|---|--------|---------|
| 4.1 | Criar projeto Next.js 14+ com App Router | TailwindCSS + Shadcn/ui |
| 4.2 | Implementar layout: sidebar + topbar + content area | Responsivo |
| 4.3 | Criar Kanban Board com drag-and-drop | Framer Motion + `@dnd-kit` |
| 4.4 | Colunas: Novo → Contato → Negociação → Fechado → Cancelado | Configurável |
| 4.5 | Card do Lead: nome, telefone, score, última interação | Componente reutilizável |
| 4.6 | Conectar WebSocket para updates em real-time | Card move sozinho quando IA decide |
| 4.7 | Dashboard com KPIs: total leads, conversão, churn | Chart.js ou Recharts |
| 4.8 | Autenticação frontend (Keycloak) | Protected routes |

**Definição de Pronto:** Kanban funcional renderizando leads do PostgreSQL. Drag-and-drop atualiza via API. WebSocket recebe atualizações da IA em tempo real.

---

## Fase 5 — A Voz (NeWave + SIP.js) 📞

> **Objetivo:** O vendedor faz e recebe ligações diretamente no navegador.

| # | Tarefa | Detalhe |
|---|--------|---------|
| 5.1 | Integrar SIP.js no Next.js | Hook `useSIP()` com estado de chamada |
| 5.2 | Conectar via WSS ao NeWave (`wss://ip:8089/ws`) | Registro SIP + keep-alive |
| 5.3 | Implementar Softphone UI | Dialer, incoming call, active call, controls |
| 5.4 | Áudio via WebRTC/SRTP | ICE candidates + STUN/TURN do NeWave |
| 5.5 | Click-to-Dial no card do lead | POST → Spring Boot → API NeWave → SIP INVITE |
| 5.6 | Criar Outbound Adapter `NeWaveHttpClient` | Busca CDRs, inicia chamadas programáticas |
| 5.7 | Registro de CDRs no histórico do lead | Duration, timestamp, direction |
| 5.8 | Integrar Softphone Pro (PoC) como fallback | WebRTC direto para ambientes sem NeWave |

**Definição de Pronto:** Vendedor faz ligações clicando no card. Softphone abre no painel lateral. CDR registrado no histórico do lead.

---

## Fase 6 — O Cérebro: IA Selfware (E.V.E.L.Y.N) 🧠

> **Objetivo:** O sistema toma decisões sozinho, aprendendo com os dados.

| # | Tarefa | Detalhe |
|---|--------|---------|
| 6.1 | Subir Ollama via Docker com modelo (Llama3/Mistral) | Container dedicado |
| 6.2 | Integrar LangChain4j no Spring Boot | Outbound Adapter `OllamaAIClient` |
| 6.3 | Instalar extensão `pgvector` no PostgreSQL | `CREATE EXTENSION vector` |
| 6.4 | Criar pipeline de embeddings para mensagens | Mensagem → vetor → pgvector |
| 6.5 | Implementar Análise de Sentimento | Consome fila `ia.analise.sentimento` → classifica |
| 6.6 | Implementar Score de Propensão a Venda | Cross-reference: perfil IXC + interações OPA |
| 6.7 | Implementar Score de Churn (risco cancelamento) | Quedas de conexão + atraso de pagamento + sentimento |
| 6.8 | Roteamento Preditivo de Chamadas | IA decide qual vendedor tem mais chance de fechar |
| 6.9 | Self-Healing: ações autônomas de retenção | Detecta risco → dispara WhatsApp → move card |
| 6.10 | Gerador de roteiro de vendas em tempo real | IA gera script baseado no perfil durante a chamada |
| 6.11 | Transbordo inteligente | Sentimento negativo → bloqueia bot → humano |

**Definição de Pronto:** EVELYN analisa mensagens em tempo real, atribui scores, move cards autonomamente e gera roteiros de venda. Sistema se auto-regula.

---

## Fase 7 — Polimento e Produção 🚀

> **Objetivo:** Sistema pronto para ambiente de produção.

| # | Tarefa | Detalhe |
|---|--------|---------|
| 7.1 | Testes unitários (JUnit 5 + Mockito) | Cobertura mínima: 80% no Domain |
| 7.2 | Testes de integração (Testcontainers) | PostgreSQL, Redis, RabbitMQ em containers |
| 7.3 | CI/CD pipeline (GitHub Actions) | Build → Test → Docker Image → Deploy |
| 7.4 | Monitoramento (Prometheus + Grafana) | Métricas de chamadas, filas, scores |
| 7.5 | Logging estruturado (ELK Stack) | Elasticsearch + Logstash + Kibana |
| 7.6 | Preparar para Kubernetes (Helm charts) | Escalabilidade horizontal |
| 7.7 | Documentação de API (OpenAPI/Swagger) | Atualizada e versionada |
| 7.8 | Auditoria LGPD | Consentimento, anonimização, direito ao esquecimento |

---

## 📅 Estimativa de Tempo

| Fase | Duração Estimada | Acumulado |
|------|-----------------|-----------|
| ~~Fase 0~~ | ~~1 semana~~ | ✅ Concluída |
| Fase 1 | 2 semanas | 2 semanas |
| Fase 2 | 2 semanas | 1 mês |
| Fase 3 | 2 semanas | 1.5 meses |
| Fase 4 | 3 semanas | 2 meses |
| Fase 5 | 2 semanas | 2.5 meses |
| Fase 6 | 4 semanas | 3.5 meses |
| Fase 7 | 2 semanas | **4 meses** |

> 📌 Estimativa para **1 desenvolvedor full-stack** trabalhando full-time. Com equipe, os tempos podem ser reduzidos significativamente nas fases paralelas (Frontend + Backend).

---

<p align="center">
  <sub>Roadmap mantido por <a href="https://github.com/jovemegidio">@jovemegidio</a> — Boutique de Engenharia de Software</sub>
</p>
