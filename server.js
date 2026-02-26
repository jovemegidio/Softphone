const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'DELETE'],
    credentials: true
  },
  maxHttpBufferSize: 5e6
});

// CORS headers para API REST (permite GitHub Pages acessar)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ===== PERSISTÊNCIA EM JSON =====
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function jsonStore(filename) {
  const filepath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filepath)) fs.writeFileSync(filepath, '{}');
  return {
    load() { try { return JSON.parse(fs.readFileSync(filepath, 'utf8')); } catch { return {}; } },
    save(data) { fs.writeFileSync(filepath, JSON.stringify(data, null, 2)); }
  };
}

const notesStore = jsonStore('notes.json');
const historyStore = jsonStore('call_history.json');
const contactsStore = jsonStore('contacts.json');

// ===== API REST - NOTAS =====
app.get('/api/notes/:userId', (req, res) => {
  const all = notesStore.load();
  res.json(all[req.params.userId] || []);
});

app.post('/api/notes/:userId', (req, res) => {
  const all = notesStore.load();
  const uid = req.params.userId;
  if (!all[uid]) all[uid] = [];
  const note = req.body;
  const idx = all[uid].findIndex(n => n.id === note.id);
  if (idx >= 0) {
    all[uid][idx] = { ...all[uid][idx], ...note, updatedAt: new Date().toISOString() };
  } else {
    note.id = note.id || uuidv4();
    note.createdAt = new Date().toISOString();
    note.updatedAt = note.createdAt;
    all[uid].unshift(note);
  }
  notesStore.save(all);
  res.json(all[uid]);
});

app.delete('/api/notes/:userId/:noteId', (req, res) => {
  const all = notesStore.load();
  const uid = req.params.userId;
  if (all[uid]) {
    all[uid] = all[uid].filter(n => n.id !== req.params.noteId);
    notesStore.save(all);
  }
  res.json(all[uid] || []);
});

// ===== API REST - HISTÓRICO =====
app.get('/api/history/:userId', (req, res) => {
  const all = historyStore.load();
  res.json(all[req.params.userId] || []);
});

// ===== API REST - CONTATOS =====
app.get('/api/contacts/:userId', (req, res) => {
  res.json(contactsStore.load()[req.params.userId] || []);
});

app.post('/api/contacts/:userId', (req, res) => {
  const all = contactsStore.load();
  const uid = req.params.userId;
  if (!all[uid]) all[uid] = [];
  const contact = req.body;
  contact.id = contact.id || uuidv4();
  const idx = all[uid].findIndex(c => c.id === contact.id);
  if (idx >= 0) all[uid][idx] = contact;
  else all[uid].push(contact);
  contactsStore.save(all);
  res.json(all[uid]);
});

app.delete('/api/contacts/:userId/:contactId', (req, res) => {
  const all = contactsStore.load();
  const uid = req.params.userId;
  if (all[uid]) {
    all[uid] = all[uid].filter(c => c.id !== req.params.contactId);
    contactsStore.save(all);
  }
  res.json(all[uid] || []);
});

// ===== WEBSOCKET =====
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log(`[+] Conectado: ${socket.id}`);

  socket.on('register', ({ username, location, status }) => {
    const user = {
      id: socket.id,
      username: username.trim(),
      location: location || '',
      status: status || 'disponível',
      joinedAt: new Date().toISOString()
    };
    onlineUsers.set(socket.id, user);
    console.log(`[✓] ${username} (${location}) registrado — status: ${user.status}`);
    broadcastUserList();
  });

  // ═══ STATUS UPDATE ═══
  socket.on('update-status', ({ status }) => {
    const user = onlineUsers.get(socket.id);
    if (user) {
      user.status = status;
      console.log(`[~] ${user.username} mudou status para: ${status}`);
      broadcastUserList();
    }
  });

  socket.on('call-request', ({ targetId, offer }) => {
    const caller = onlineUsers.get(socket.id);
    const target = onlineUsers.get(targetId);
    if (!caller || !target) return socket.emit('call-error', { message: 'Usuário não encontrado.' });
    if (target.status !== 'disponível') return socket.emit('call-error', { message: `${target.username} está ocupado(a).` });

    caller.status = 'em_ligação';
    target.status = 'em_ligação';
    broadcastUserList();

    // Histórico
    const now = new Date().toISOString();
    const h = historyStore.load();
    if (!h[caller.username]) h[caller.username] = [];
    if (!h[target.username]) h[target.username] = [];
    h[caller.username].unshift({ id: uuidv4(), type: 'outgoing', contact: target.username, location: target.location, time: now, duration: 0 });
    h[target.username].unshift({ id: uuidv4(), type: 'incoming', contact: caller.username, location: caller.location, time: now, duration: 0 });
    historyStore.save(h);

    io.to(targetId).emit('incoming-call', {
      callerId: socket.id,
      callerName: caller.username,
      callerLocation: caller.location,
      offer
    });
  });

  socket.on('call-accepted', ({ callerId, answer }) => {
    const callee = onlineUsers.get(socket.id);
    io.to(callerId).emit('call-answered', { answer, calleeName: callee?.username, calleeLocation: callee?.location });
  });

  socket.on('call-rejected', ({ callerId }) => {
    const callee = onlineUsers.get(socket.id);
    const caller = onlineUsers.get(callerId);
    if (caller) caller.status = 'disponível';
    if (callee) callee.status = 'disponível';
    broadcastUserList();
    io.to(callerId).emit('call-rejected-response', { calleeName: callee?.username });
  });

  socket.on('ice-candidate', ({ targetId, candidate }) => {
    io.to(targetId).emit('ice-candidate', { candidate, senderId: socket.id });
  });

  socket.on('end-call', ({ targetId }) => {
    const user = onlineUsers.get(socket.id);
    const target = onlineUsers.get(targetId);
    if (user) user.status = 'disponível';
    if (target) target.status = 'disponível';
    broadcastUserList();
    io.to(targetId).emit('call-ended', { endedBy: user?.username });
  });

  // ═══ CALL HOLD / RESUME ═══
  socket.on('call-hold', ({ targetId }) => {
    const user = onlineUsers.get(socket.id);
    console.log(`[⏸] ${user?.username} colocou chamada em espera`);
    io.to(targetId).emit('call-on-hold', { by: user?.username });
  });

  socket.on('call-resume', ({ targetId }) => {
    const user = onlineUsers.get(socket.id);
    console.log(`[▶] ${user?.username} retomou a chamada`);
    io.to(targetId).emit('call-resumed', { by: user?.username });
  });

  // ═══ CALL TRANSFER ═══
  socket.on('call-transfer', ({ currentCallTarget, transferTo }) => {
    const user = onlineUsers.get(socket.id);
    if (user) user.status = 'disponível';
    console.log(`[→] ${user?.username} transferiu chamada para ${transferTo}`);

    // Notify the current call target about the transfer
    io.to(currentCallTarget).emit('call-transferred', {
      from: user?.username,
      transferTo: transferTo
    });

    broadcastUserList();
  });

  // ═══ DTMF RELAY ═══
  socket.on('dtmf-tone', ({ targetId, tone }) => {
    io.to(targetId).emit('dtmf-received', { tone });
  });

  socket.on('disconnect', () => {
    const user = onlineUsers.get(socket.id);
    if (user) {
      console.log(`[-] ${user.username} desconectou`);
      for (const [id, u] of onlineUsers) {
        if (u.status === 'em_ligação' && id !== socket.id) {
          io.to(id).emit('call-ended', { endedBy: user.username });
          u.status = 'disponível';
        }
      }
      onlineUsers.delete(socket.id);
      broadcastUserList();
    }
  });
});

function broadcastUserList() {
  const users = Array.from(onlineUsers.values()).map(u => ({
    id: u.id, username: u.username, location: u.location, status: u.status, joinedAt: u.joinedAt
  }));
  io.emit('user-list', users);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n╔════════════════════════════════════════════╗`);
  console.log(`║  📞  Softphone Pro v2.0                    ║`);
  console.log(`║  🌐  http://localhost:${PORT}                 ║`);
  console.log(`║  📡  Pronto para chamadas remotas          ║`);
  console.log(`╚════════════════════════════════════════════╝\n`);
});
