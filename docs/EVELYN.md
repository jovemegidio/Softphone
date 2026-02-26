<h1 align="center">🧠 E.V.E.L.Y.N</h1>

<p align="center">
  <strong>Engine for Virtual Enhancement, Learning & Yielding Notifications</strong><br>
  Motor Cognitivo Autônomo — Conceito de AI Selfware
</p>

---

## 🔮 O que é Selfware?

**Selfware** é um sistema que **aprende, se adapta e toma decisões sozinho**, sem intervenção humana constante. Diferente de uma automação tradicional (que segue regras fixas), um selfware:

- **Observa** padrões nos dados em tempo real
- **Aprende** com cada interação (mensagens, chamadas, métricas)
- **Decide** a melhor ação com base em contexto acumulado
- **Age** autonomamente (dispara mensagem, move card, roteia chamada)
- **Evolui** continuamente conforme novos dados alimentam o modelo

> 💡 A analogia perfeita: assim como um sistema de delivery inteligente aprende os horários de pico, rotas mais rápidas e preferências dos clientes para otimizar entregas, a **E.V.E.L.Y.N** aprende os padrões de comportamento dos clientes do ISP para otimizar vendas e retenção.

---

## 🏗️ Arquitetura do Motor Cognitivo

```
                    ┌─────────────────────────────────┐
                    │         FONTES DE DADOS          │
                    │                                   │
                    │  ┌─────┐  ┌─────┐  ┌──────────┐  │
                    │  │ IXC │  │ OPA │  │ NeWave   │  │
                    │  │     │  │Suite│  │ (CDRs)   │  │
                    │  └──┬──┘  └──┬──┘  └────┬─────┘  │
                    └─────┼───────┼──────────┼─────────┘
                          │       │          │
                          ▼       ▼          ▼
                    ┌─────────────────────────────────┐
                    │         RabbitMQ (Filas)         │
                    │                                   │
                    │  ia.analise.sentimento            │
                    │  ia.score.propensao               │
                    │  ia.score.churn                   │
                    │  ia.roteamento.chamada            │
                    │  ia.selfhealing.retencao          │
                    └────────────┬──────────────────────┘
                                 │
                                 ▼
              ┌──────────────────────────────────────────┐
              │          E.V.E.L.Y.N (Core)              │
              │                                           │
              │  ┌─────────────────────────────────────┐  │
              │  │     MÓDULO DE PERCEPÇÃO             │  │
              │  │  • Parser de mensagens WhatsApp     │  │
              │  │  • Extrator de métricas IXC         │  │
              │  │  • Analisador de CDRs de voz        │  │
              │  └─────────────┬───────────────────────┘  │
              │                │                           │
              │  ┌─────────────▼───────────────────────┐  │
              │  │     MÓDULO DE COGNIÇÃO (LLM)        │  │
              │  │  • Ollama (Llama3 / Mistral)        │  │
              │  │  • LangChain4j (Java SDK)           │  │
              │  │  • Análise de Sentimento            │  │
              │  │  • Geração de Roteiros              │  │
              │  │  • Resumo de Histórico              │  │
              │  └─────────────┬───────────────────────┘  │
              │                │                           │
              │  ┌─────────────▼───────────────────────┐  │
              │  │     MÓDULO DE MEMÓRIA               │  │
              │  │  • pgvector (embeddings)            │  │
              │  │  • Contexto acumulado por lead      │  │
              │  │  • Histórico de decisões passadas   │  │
              │  └─────────────┬───────────────────────┘  │
              │                │                           │
              │  ┌─────────────▼───────────────────────┐  │
              │  │     MÓDULO DE DECISÃO (Selfware)    │  │
              │  │  • Motor de Regras + Heurísticas    │  │
              │  │  • Score de Confiança (threshold)   │  │
              │  │  • Validação antes de agir           │  │
              │  └─────────────┬───────────────────────┘  │
              │                │                           │
              │  ┌─────────────▼───────────────────────┐  │
              │  │     MÓDULO DE AÇÃO                   │  │
              │  │  • Publicar evento no RabbitMQ       │  │
              │  │  • Mover card (WebSocket)            │  │
              │  │  • Disparar msg (OPA Suite)          │  │
              │  │  • Rotear chamada (NeWave)           │  │
              │  │  • Alertar atendente (Push)          │  │
              │  └─────────────────────────────────────┘  │
              └──────────────────────────────────────────┘
```

---

## 📊 Os Três Scores Inteligentes

### 1. Score de Propensão a Venda (0 — 100)

A IA calcula a probabilidade de um lead fechar negócio:

| Fator | Peso | Fonte |
|-------|------|-------|
| Lead respondeu WhatsApp em < 5 min | +15 | OPA Suite |
| Lead perguntou sobre planos/preços | +20 | OPA Suite (NLP) |
| CEP com viabilidade técnica confirmada | +10 | IXC API |
| Lead atendeu 2+ ligações do vendedor | +15 | NeWave CDRs |
| Perfil similar a clientes convertidos | +25 | pgvector (similaridade) |
| Horário ideal de contato identificado | +15 | Análise temporal |

**Ação autônoma:** Se score > 80 → EVELYN roteia o lead para o vendedor com maior taxa de fechamento naquele perfil.

---

### 2. Score de Churn — Risco de Cancelamento (0 — 100)

A IA monitora sinais de insatisfação nos clientes ativos:

| Fator | Peso | Fonte |
|-------|------|-------|
| 3+ quedas de conexão na semana | +25 | IXC (chamados técnicos) |
| Fatura atrasada > 5 dias | +15 | IXC (faturas) |
| Sentimento negativo em mensagens | +20 | OPA Suite (NLP) |
| Chamada longa para suporte (> 10min) | +10 | NeWave CDRs |
| Não responde mensagens há 7+ dias | +15 | OPA Suite |
| Pediu informação sobre cancelamento | +30 | OPA Suite (keywords) |

**Ação autônoma:** Se score > 75 → EVELYN:
1. Move card para "Risco Cancelamento" no Kanban
2. Dispara WhatsApp de retenção personalizado
3. Alerta o gestor via notificação push

---

### 3. Score de Sentimento (por interação)

| Classificação | Faixa | Ação |
|--------------|-------|------|
| 😊 Positivo | 0.70 — 1.00 | Mantém fluxo normal do bot |
| 😐 Neutro | 0.40 — 0.69 | Monitora próximas interações |
| 😤 Negativo | 0.15 — 0.39 | Prioriza atendimento humano |
| 🔴 Agressivo | 0.00 — 0.14 | **Bloqueia bot + transborda imediato** |

---

## ⚡ Cenários de Atuação Autônoma

### Cenário A: Roteamento Preditivo de Chamadas

```
1. Novo lead entra (OPA Suite → webhook)
2. EVELYN analisa: perfil = "empresarial, 30+ funcionários, zona sul"
3. Consulta pgvector: vendedor "Ana" fechou 73% de leads com esse perfil
4. EVELYN publica: { ação: "ROTEAR_CHAMADA", vendedorId: "ana", leadId: "123" }
5. Spring Boot aciona NeWave → click-to-dial para Ana
6. Quando Ana atende, card abre automaticamente com roteiro personalizado:
   "Olá [nome], notamos que sua empresa tem [X] funcionários.
    Temos um plano corporativo com IP fixo ideal para o seu caso..."
```

### Cenário B: Self-Healing de Relacionamento

```
1. Job noturno sincroniza IXC → detecta 3 quedas de conexão para cliente "João"
2. EVELYN calcula score_churn = 82 (alto risco)
3. EVELYN publica ações em sequência:
   a) Mover card → coluna "Risco Cancelamento" (WebSocket → frontend)
   b) Disparar WhatsApp (OPA Suite):
      "Oi João! Notamos uma instabilidade na sua região recentemente.
       Para compensar, liberamos 100 Mega extra de velocidade para
       você neste fim de semana 🚀 Qualquer dúvida, estamos aqui!"
4. João responde: "Finalmente, porque tá horrível"
5. EVELYN analisa sentimento → 0.22 (negativo)
6. Bloqueia continuidade do bot → transborda para suporte humano
7. Tela do atendente destaca em vermelho: "⚠️ CLIENTE INSATISFEITO"
```

### Cenário C: Análise Pós-Campanha

```
1. Campanha de cobrança disparada para 500 clientes
2. EVELYN monitora respostas em tempo real via fila RabbitMQ
3. Após 2 horas:
   - 312 entregues, 189 lidos, 67 responderam
   - 12 respostas com sentimento agressivo
   - 8 clientes pediram "cancelar"
4. EVELYN gera relatório automático:
   "📊 Campanha 'Cobrança Março': taxa de resposta 21.5%.
    ⚠️ 12 respostas agressivas identificadas — recomendo
    revisão do template para tom mais empático.
    🔴 8 leads movidos para 'Risco Cancelamento' automaticamente."
5. Relatório aparece no dashboard do gestor em tempo real
```

---

## 🔐 Privacidade e Segurança (Por que IA Local?)

| Aspecto | IA na Nuvem (OpenAI) | IA Local (EVELYN) |
|---------|---------------------|-------------------|
| **Dados sensíveis** | Enviados para servidores externos | Nunca saem da infraestrutura |
| **LGPD** | Risco de violação | ✅ Compliance total |
| **Latência** | 200-500ms (rede) | 10-50ms (local) |
| **Custo** | $0.002-0.06 / request | Custo fixo (hardware) |
| **Disponibilidade** | Depende de internet | ✅ Funciona offline |
| **Customização** | Limitada | ✅ Total (fine-tuning) |
| **Auditabilidade** | Difícil | ✅ Logs completos |

---

## 🛠️ System Prompts da EVELYN

### Prompt: Análise de Sentimento
```
Você é EVELYN, uma assistente de IA especializada em análise de sentimento
para provedores de internet (ISPs). Analise a mensagem do cliente abaixo
e classifique o sentimento.

Responda APENAS com um JSON válido:
{
  "sentimento": "positivo" | "negativo" | "neutro" | "agressivo",
  "score": 0.00 a 1.00,
  "keywords": ["palavras-chave detectadas"],
  "acao_sugerida": "descrição da ação recomendada",
  "transbordar": true | false
}

Mensagem do cliente: {mensagem}
Contexto: Cliente do plano {plano}, último pagamento em {data}, {N} chamados abertos.
```

### Prompt: Geração de Roteiro de Vendas
```
Você é EVELYN, especialista em vendas consultivas para provedores de internet.
Gere um roteiro de abordagem personalizado para o vendedor.

Perfil do lead:
- Nome: {nome}
- Cidade: {cidade}, {uf}
- Origem: {origem}
- Perfil similar a: {clientes_similares}
- Plano com maior aderência: {plano_recomendado}

Gere o roteiro em formato estruturado com:
1. Abertura (personalizada)
2. Sondagem (3 perguntas-chave)
3. Apresentação do plano ideal
4. Tratamento de objeções comuns
5. Fechamento
```

### Prompt: Score de Churn
```
Você é EVELYN, analista de risco de cancelamento para ISPs.
Com base nos dados abaixo, calcule o risco de cancelamento.

Dados do cliente:
- Quedas de conexão (7 dias): {quedas}
- Dias de atraso na fatura: {dias_atraso}
- Chamados técnicos (30 dias): {chamados}
- Último sentimento detectado: {sentimento}
- Tempo como cliente: {meses} meses

Responda APENAS com JSON:
{
  "score_churn": 0 a 100,
  "fatores_risco": ["lista de fatores"],
  "acao_preventiva": "descrição da ação",
  "urgencia": "baixa" | "media" | "alta" | "critica"
}
```

---

## 📈 Métricas de Performance da EVELYN

| Métrica | Meta | Medição |
|---------|------|---------|
| Precisão de sentimento | > 85% | Validação manual amostral |
| Tempo de resposta LLM | < 2s | Prometheus |
| Taxa de ações corretas | > 90% | Feedback do vendedor |
| Redução de churn | -15% em 3 meses | Comparativo IXC |
| Aumento de conversão | +10% em 3 meses | CRM analytics |
| Uptime do motor | 99.5% | Health check |

---

<p align="center">
  <sub>E.V.E.L.Y.N — Concebida por <a href="https://github.com/jovemegidio">@jovemegidio</a> — Boutique de Engenharia de Software</sub>
</p>
