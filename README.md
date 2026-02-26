<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socketdotio&logoColor=white" />
  <img src="https://img.shields.io/badge/WebRTC-333333?style=for-the-badge&logo=webrtc&logoColor=white" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" />
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" />
</p>

<h1 align="center">📞 Softphone Pro</h1>

<p align="center">
  <strong>Sistema de Comunicação Empresarial em Tempo Real</strong>
</p>

<p align="center">
  Plataforma VoIP full-stack que permite chamadas de voz entre usuários em qualquer lugar do Brasil,<br>
  com bloco de notas inteligente estilo Notion, gestão de contatos e histórico completo de chamadas.
</p>

<p align="center">
  <a href="https://jovemegidio.github.io/Softphone">🌐 Demo no GitHub Pages</a> •
  <a href="#-funcionalidades">✨ Funcionalidades</a> •
  <a href="#-instalação">🚀 Instalação</a> •
  <a href="#-arquitetura">🏗️ Arquitetura</a>
</p>

---

## 🎯 Visão Geral

O **Softphone Pro** é uma aplicação web de comunicação empresarial construída do zero, sem dependência de APIs de telefonia pagas. Utiliza **WebRTC** para chamadas de voz peer-to-peer com qualidade de áudio profissional, suportando conexões entre diferentes cidades e estados através de servidores STUN/TURN para travessia de NAT.

> 💡 **Diferencial técnico:** A aplicação funciona como **SPA (Single Page Application)** com frontend deployado no GitHub Pages e backend Node.js independente, demonstrando arquitetura moderna de microsserviços com comunicação via WebSocket.

---

## ✨ Funcionalidades

### 📞 Chamadas VoIP em Tempo Real
- Chamadas de voz **peer-to-peer** via WebRTC
- Suporte a chamadas **entre cidades e estados** (STUN + TURN)
- Sinalização em tempo real com **Socket.IO**
- Controles de chamada: mudo, volume, encerrar
- Cronômetro de duração da chamada
- Notificação sonora de chamada recebida

### 📝 Bloco de Notas — Estilo Notion
- Editor **rich text** com toolbar completa
- Formatação: negrito, itálico, sublinhado, riscado
- Listas ordenadas, não-ordenadas e **checklists**
- Títulos, citações, código e destaques
- Categorização por tipo (Ligação, Reunião, Tarefa, Importante)
- Sistema de **fixar notas** e busca instantânea
- **Auto-save** com persistência no servidor

### 👥 Gestão de Contatos
- CRUD completo de contatos
- Campos: nome, empresa, telefone, email, localização, observações
- Busca em tempo real
- Modal de criação/edição

### 📊 Histórico de Chamadas
- Registro automático de todas as chamadas
- Filtros: todas, recebidas, realizadas
- Duração, horário e localização do contato

### 🎨 Interface Profissional
- **Design System** completo com variáveis CSS
- Fundo animado com **partículas interativas** (Canvas API)
- Material Icons e tipografia Inter
- Layout responsivo com sidebar de navegação
- Tema institucional claro

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

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND (SPA)                    │
│              GitHub Pages / Localhost                 │
│  ┌──────────┐ ┌──────────┐ ┌─────────┐ ┌─────────┐ │
│  │ Telefone │ │ Contatos │ │Histórico│ │  Notas  │ │
│  └────┬─────┘ └────┬─────┘ └────┬────┘ └────┬────┘ │
│       │             │            │            │      │
│       └─────────────┴──────┬─────┴────────────┘      │
│                            │                         │
│                    ┌───────┴───────┐                  │
│                    │   WebRTC      │                  │
│                    │  Peer-to-Peer │                  │
│                    └───────┬───────┘                  │
└────────────────────────────┼─────────────────────────┘
                             │ Socket.IO + REST API
                             │
┌────────────────────────────┼─────────────────────────┐
│                    BACKEND (Node.js)                  │
│  ┌─────────────┐  ┌───────┴───────┐  ┌───────────┐  │
│  │   Express    │  │  Socket.IO    │  │   JSON     │  │
│  │  REST API    │  │  Signaling    │  │  Storage   │  │
│  └─────────────┘  └───────────────┘  └───────────┘  │
└──────────────────────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │  STUN / TURN    │
                    │   Servers       │
                    │  (NAT Traversal)│
                    └─────────────────┘
```

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Propósito |
|--------|-----------|-----------|
| **Frontend** | HTML5, CSS3, JavaScript ES6+ | SPA com design system customizado |
| **Backend** | Node.js + Express | Servidor HTTP e REST API |
| **Real-time** | Socket.IO | Sinalização WebSocket bidirecional |
| **Voice** | WebRTC | Chamadas de voz peer-to-peer |
| **NAT Traversal** | STUN/TURN Servers | Conexão entre redes diferentes |
| **Persistência** | JSON File Storage | Notas, contatos e histórico |
| **Deploy** | GitHub Actions + Pages | CI/CD automático do frontend |
| **Animações** | Canvas API | Background interativo com partículas |

---

## 🚀 Instalação

### Pré-requisitos
- **Node.js** 16+ instalado
- **Git** instalado

### Setup Local

```bash
# Clone o repositório
git clone https://github.com/jovemegidio/Softphone.git
cd Softphone

# Instale as dependências
npm install

# Inicie o servidor
npm start
```

Acesse **http://localhost:3000** no navegador.

### Deploy no GitHub Pages

O projeto já possui **GitHub Actions** configurado para deploy automático:

1. Faça push para a branch `main`
2. O workflow deploya automaticamente a pasta `/public` no GitHub Pages
3. Acesse: `https://jovemegidio.github.io/Softphone`

> ⚠️ O GitHub Pages serve apenas o frontend estático. Para chamadas funcionarem, o servidor Node.js precisa estar rodando em uma máquina acessível.

---

## 📁 Estrutura do Projeto

```
Softphone/
├── 📄 server.js                  # Servidor Express + Socket.IO
├── 📄 package.json               # Dependências e scripts
├── 📄 .gitignore                 # Arquivos ignorados pelo Git
├── 📂 .github/
│   └── 📂 workflows/
│       └── 📄 deploy.yml         # CI/CD GitHub Actions → Pages
├── 📂 public/                    # Frontend (servido estático)
│   ├── 📄 index.html             # SPA principal
│   ├── 📂 css/
│   │   └── 📄 style.css          # Design system completo (~950 linhas)
│   └── 📂 js/
│       └── 📄 app.js             # Lógica do cliente (~850 linhas)
└── 📂 data/                      # Persistência JSON (auto-criado)
    ├── 📄 notes.json
    ├── 📄 contacts.json
    └── 📄 call_history.json
```

---

## 🔧 Como Funciona

### Fluxo de Chamada
1. Usuário faz login com nome e localização
2. Socket.IO registra o usuário e broadcast a lista online
3. Ao clicar em "Ligar", uma oferta SDP é gerada via WebRTC
4. A oferta é enviada via Socket.IO (sinalização)
5. O destinatário recebe a chamada e pode aceitar/rejeitar
6. Ao aceitar, uma resposta SDP é trocada
7. ICE candidates são negociados (STUN/TURN para NAT traversal)
8. Conexão P2P estabelecida — áudio flui diretamente entre os peers

### Persistência
Notas, contatos e histórico são salvos em arquivos JSON no servidor, permitindo recuperação entre sessões sem necessidade de banco de dados.

---

## 🧪 Teste Rápido

O projeto vem com um **usuário de teste pré-configurado**:
- **Nome:** teste
- **Localização:** São Paulo, SP

Basta abrir a aplicação e clicar em "Conectar ao Sistema".

Para testar chamadas, abra duas abas do navegador com nomes diferentes.

---

## 📈 Possíveis Evoluções

- [ ] Chamadas de vídeo (WebRTC já suporta)
- [ ] Chat de texto em tempo real
- [ ] Gravação de chamadas
- [ ] Banco de dados (PostgreSQL/MongoDB)
- [ ] Autenticação JWT
- [ ] Docker containerization
- [ ] Dashboard de métricas
- [ ] Transferência de chamadas

---

## 👨‍💻 Desenvolvedor

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
  Desenvolvido com ☕ e dedicação — Projeto full-stack construído do zero para demonstrar habilidades em <strong>WebRTC</strong>, <strong>WebSockets</strong>, <strong>Node.js</strong> e <strong>Frontend</strong>.
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
