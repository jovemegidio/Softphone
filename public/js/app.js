// ═══════════════════════════════════════════════════
//  SOFTPHONE PRO v2.0 — Client Application
// ═══════════════════════════════════════════════════

// Detecta se está no GitHub Pages ou rodando localmente
const isGitHubPages = window.location.hostname.includes('github.io');

function getServerUrl() {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return window.location.origin;
  }
  return localStorage.getItem('softphone_server') || window.location.origin;
}

let socket = io(getServerUrl(), {
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 2000,
  timeout: 10000
});

// Reconectar com novo servidor (quando muda URL no GitHub Pages)
function reconnectSocket(url) {
  socket.disconnect();
  socket = io(url, { reconnection: true, reconnectionAttempts: 10, reconnectionDelay: 2000, timeout: 10000 });
  setupSocketEvents();
}

// ═══ DOM ═══
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const DOM = {
  loginScreen: $('#login-screen'),
  mainScreen: $('#main-screen'),
  loginForm: $('#login-form'),
  usernameInput: $('#username-input'),
  locationInput: $('#location-input'),
  topbarUsername: $('#topbar-username'),
  topbarLocation: $('#topbar-location'),
  topbarAvatar: $('#topbar-avatar'),
  logoutBtn: $('#logout-btn'),
  userList: $('#user-list'),
  userCount: $('#user-count'),
  searchUsers: $('#search-users'),
  remoteAudio: $('#remote-audio'),
  toast: $('#toast'),
  toastMsg: $('.toast-msg'),
  toastIcon: $('.toast-icon'),
  // Call views
  callIdle: $('#call-idle'),
  callCalling: $('#call-calling'),
  callIncoming: $('#call-incoming'),
  callActive: $('#call-active'),
  callingName: $('#calling-name'),
  callingLocation: $('#calling-location'),
  incomingName: $('#incoming-name'),
  incomingLocation: $('#incoming-location'),
  activeCallName: $('#active-call-name'),
  activeCallLocation: $('#active-call-location'),
  callTimer: $('#call-timer'),
  cancelCallBtn: $('#cancel-call-btn'),
  acceptCallBtn: $('#accept-call-btn'),
  rejectCallBtn: $('#reject-call-btn'),
  endCallBtn: $('#end-call-btn'),
  muteBtn: $('#mute-btn'),
  speakerBtn: $('#speaker-btn'),
  // Connection
  connIndicator: $('#conn-indicator'),
};

// ═══ STATE ═══
let state = {
  username: '',
  location: '',
  currentCallTarget: null,
  peerConnection: null,
  localStream: null,
  callTimerInterval: null,
  callSeconds: 0,
  isMuted: false,
  pendingOffer: null,
  pendingCallerId: null,
  pendingCallerName: null,
  pendingCallerLocation: null,
  allUsers: [],
  // Notes
  notes: [],
  currentNoteId: null,
  // Contacts
  contacts: [],
  editingContactId: null,
  // History
  history: [],
  historyFilter: 'all',
};

// ICE config com TURN para chamadas remotas entre cidades/estados
const iceConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    // TURN servers gratuitos (para produção, use seus próprios)
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ],
  iceCandidatePoolSize: 10
};

// ═══════════════════════════════════════════
//  LOGIN
// ═══════════════════════════════════════════
DOM.loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = DOM.usernameInput.value.trim();
  const loc = DOM.locationInput.value.trim();
  if (!name) { showToast('Digite seu nome para conectar', 'warning'); return; }

  // Se no GitHub Pages, salva e reconecta ao servidor informado
  if (isGitHubPages) {
    const serverInput = document.getElementById('server-input');
    const serverUrl = serverInput ? serverInput.value.trim() : '';
    if (!serverUrl) { showToast('Informe o endereço do servidor', 'warning'); return; }
    localStorage.setItem('softphone_server', serverUrl);
    reconnectSocket(serverUrl);
  }

  state.username = name;
  state.location = loc || 'Não informado';

  // Aguarda conexão antes de registrar
  const doRegister = () => {
    socket.emit('register', { username: state.username, location: state.location });
    DOM.topbarUsername.textContent = state.username;
    DOM.topbarLocation.textContent = state.location;
    DOM.topbarAvatar.textContent = state.username.charAt(0).toUpperCase();
    switchScreen('main');
    showToast(`Bem-vindo, ${state.username}!`, 'success');
    loadNotes();
    loadContacts();
    loadHistory();
  };

  if (socket.connected) {
    doRegister();
  } else {
    showToast('Conectando ao servidor...', 'info');
    socket.once('connect', doRegister);
    socket.once('connect_error', () => {
      showToast('Não foi possível conectar ao servidor. Verifique o endereço.', 'error');
    });
  }
});

DOM.logoutBtn.addEventListener('click', () => {
  if (state.currentCallTarget) endCurrentCall();
  switchScreen('login');
  socket.disconnect();
  socket.connect();
  state.username = '';
  state.location = '';
  DOM.usernameInput.value = '';
  DOM.locationInput.value = '';
});

function switchScreen(screen) {
  DOM.loginScreen.classList.toggle('active', screen === 'login');
  DOM.mainScreen.classList.toggle('active', screen === 'main');
}

// ═══════════════════════════════════════════
//  NAVIGATION TABS
// ═══════════════════════════════════════════
$$('.nav-item[data-tab]').forEach(item => {
  item.addEventListener('click', () => {
    if (item.style.opacity === '0.5') return;
    $$('.nav-item').forEach(n => n.classList.remove('active'));
    item.classList.add('active');
    $$('.tab-panel').forEach(p => p.classList.remove('active'));
    const tab = item.dataset.tab;
    $(`#tab-${tab}`).classList.add('active');
  });
});

// ═══════════════════════════════════════════
//  USER LIST
// ═══════════════════════════════════════════
function setupSocketEvents() {
  socket.off(); // Remove listeners antigos para evitar duplicação

  socket.on('user-list', (users) => {
    state.allUsers = users;
    renderUserList();
  });

DOM.searchUsers.addEventListener('input', renderUserList);

function renderUserList() {
  const query = DOM.searchUsers.value.toLowerCase();
  const others = state.allUsers
    .filter(u => u.id !== socket.id)
    .filter(u => !query || u.username.toLowerCase().includes(query) || (u.location || '').toLowerCase().includes(query));

  DOM.userCount.textContent = others.length;

  if (others.length === 0) {
    DOM.userList.innerHTML = `<li class="empty-state"><span class="material-icons-round">group_off</span><p>Nenhum usuário online</p></li>`;
    return;
  }

  DOM.userList.innerHTML = others.map(u => {
    const initial = u.username.charAt(0).toUpperCase();
    const available = u.status === 'disponível';
    const statusText = available ? 'Disponível' : 'Em ligação';
    const dotClass = available ? 'available' : 'busy';
    return `
      <li class="item" ${available ? `onclick="initiateCall('${u.id}','${escHtml(u.username)}','${escHtml(u.location || '')}')"` : ''}>
        <div class="user-avatar-wrap">
          ${initial}
          <span class="online-dot ${dotClass}"></span>
        </div>
        <div class="entity-info">
          <div class="entity-name">${escHtml(u.username)}</div>
          <div class="entity-sub">
            <span class="material-icons-round">location_on</span>
            ${escHtml(u.location || 'Não informado')} · ${statusText}
          </div>
        </div>
        ${available ? `<button class="call-item-btn" onclick="event.stopPropagation(); initiateCall('${u.id}','${escHtml(u.username)}','${escHtml(u.location || '')}')"><span class="material-icons-round">call</span></button>` : ''}
      </li>
    `;
  }).join('');
}

// ═══════════════════════════════════════════
//  CALL LOGIC
// ═══════════════════════════════════════════
async function initiateCall(targetId, targetName, targetLocation) {
  if (state.currentCallTarget) { showToast('Você já está em uma ligação', 'warning'); return; }
  try {
    state.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    state.currentCallTarget = targetId;
    DOM.callingName.textContent = targetName;
    DOM.callingLocation.textContent = targetLocation || '';
    setCallView('calling');

    createPeerConnection(targetId);
    state.localStream.getTracks().forEach(t => state.peerConnection.addTrack(t, state.localStream));

    const offer = await state.peerConnection.createOffer();
    await state.peerConnection.setLocalDescription(offer);

    socket.emit('call-request', { targetId, offer: state.peerConnection.localDescription });
    showToast(`Chamando ${targetName}...`, 'info');
  } catch (err) {
    console.error('Call error:', err);
    if (err.name === 'NotAllowedError') showToast('Permita o acesso ao microfone', 'warning');
    else showToast('Erro ao iniciar chamada', 'error');
    cleanupCall();
  }
}

  socket.on('incoming-call', async ({ callerId, callerName, callerLocation, offer }) => {
    if (state.currentCallTarget) { socket.emit('call-rejected', { callerId }); return; }
    state.currentCallTarget = callerId;
    state.pendingOffer = offer;
    state.pendingCallerId = callerId;
    state.pendingCallerName = callerName;
    state.pendingCallerLocation = callerLocation || '';
    DOM.incomingName.textContent = callerName;
    DOM.incomingLocation.textContent = callerLocation || '';
    setCallView('incoming');
    showToast(`${callerName} está ligando`, 'info');
  });

DOM.acceptCallBtn.addEventListener('click', async () => {
  try {
    state.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    createPeerConnection(state.pendingCallerId);
    state.localStream.getTracks().forEach(t => state.peerConnection.addTrack(t, state.localStream));
    await state.peerConnection.setRemoteDescription(new RTCSessionDescription(state.pendingOffer));
    const answer = await state.peerConnection.createAnswer();
    await state.peerConnection.setLocalDescription(answer);
    socket.emit('call-accepted', { callerId: state.pendingCallerId, answer: state.peerConnection.localDescription });
    DOM.activeCallName.textContent = state.pendingCallerName;
    DOM.activeCallLocation.textContent = state.pendingCallerLocation;
    setCallView('active');
    startCallTimer();
    showToast(`Em ligação com ${state.pendingCallerName}`, 'success');
  } catch (err) {
    console.error('Accept error:', err);
    showToast('Erro ao aceitar chamada', 'error');
    socket.emit('call-rejected', { callerId: state.pendingCallerId });
    cleanupCall();
  }
});

DOM.rejectCallBtn.addEventListener('click', () => {
  socket.emit('call-rejected', { callerId: state.pendingCallerId });
  showToast('Chamada recusada', 'info');
  cleanupCall();
});

  socket.on('call-answered', async ({ answer, calleeName, calleeLocation }) => {
    try {
      await state.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      DOM.activeCallName.textContent = calleeName;
      DOM.activeCallLocation.textContent = calleeLocation || '';
      setCallView('active');
      startCallTimer();
      showToast(`Em ligação com ${calleeName}`, 'success');
    } catch (err) {
      console.error('Answer error:', err);
      cleanupCall();
    }
  });

  socket.on('call-rejected-response', ({ calleeName }) => {
    showToast(`${calleeName} recusou a chamada`, 'warning');
    cleanupCall();
  });

  socket.on('call-error', ({ message }) => { showToast(message, 'warning'); cleanupCall(); });

  socket.on('ice-candidate', async ({ candidate }) => {
    try { if (state.peerConnection && candidate) await state.peerConnection.addIceCandidate(new RTCIceCandidate(candidate)); }
    catch (e) { console.error('ICE error:', e); }
  });

DOM.cancelCallBtn.addEventListener('click', () => { endCurrentCall(); showToast('Chamada cancelada', 'info'); });
DOM.endCallBtn.addEventListener('click', () => { endCurrentCall(); showToast('Chamada encerrada', 'info'); });

function endCurrentCall() {
  if (state.currentCallTarget) socket.emit('end-call', { targetId: state.currentCallTarget });
  cleanupCall();
}

  socket.on('call-ended', ({ endedBy }) => { showToast(`Ligação encerrada por ${endedBy}`, 'info'); cleanupCall(); });

// Mute
DOM.muteBtn.addEventListener('click', () => {
  if (!state.localStream) return;
  state.isMuted = !state.isMuted;
  state.localStream.getAudioTracks().forEach(t => t.enabled = !state.isMuted);
  DOM.muteBtn.classList.toggle('active', state.isMuted);
  DOM.muteBtn.querySelector('.material-icons-round').textContent = state.isMuted ? 'mic_off' : 'mic';
  showToast(state.isMuted ? 'Microfone desligado' : 'Microfone ligado', 'info');
});

// Speaker
DOM.speakerBtn.addEventListener('click', () => {
  const low = DOM.speakerBtn.classList.toggle('active');
  DOM.remoteAudio.volume = low ? 0.2 : 1.0;
  DOM.speakerBtn.querySelector('.material-icons-round').textContent = low ? 'volume_off' : 'volume_up';
});

// WebRTC
function createPeerConnection(targetId) {
  state.peerConnection = new RTCPeerConnection(iceConfig);
  state.peerConnection.onicecandidate = (e) => {
    if (e.candidate) socket.emit('ice-candidate', { targetId, candidate: e.candidate });
  };
  state.peerConnection.ontrack = (e) => { DOM.remoteAudio.srcObject = e.streams[0]; };
  state.peerConnection.oniceconnectionstatechange = () => {
    const s = state.peerConnection.iceConnectionState;
    if (s === 'disconnected' || s === 'failed') { showToast('Conexão perdida', 'error'); endCurrentCall(); }
  };
}

function setCallView(view) {
  [DOM.callIdle, DOM.callCalling, DOM.callIncoming, DOM.callActive].forEach(v => v.classList.remove('active'));
  switch (view) {
    case 'idle': DOM.callIdle.classList.add('active'); break;
    case 'calling': DOM.callCalling.classList.add('active'); break;
    case 'incoming': DOM.callIncoming.classList.add('active'); break;
    case 'active': DOM.callActive.classList.add('active'); break;
  }
}

function cleanupCall() {
  if (state.peerConnection) { state.peerConnection.close(); state.peerConnection = null; }
  if (state.localStream) { state.localStream.getTracks().forEach(t => t.stop()); state.localStream = null; }
  state.currentCallTarget = null;
  state.isMuted = false;
  DOM.muteBtn.classList.remove('active');
  DOM.muteBtn.querySelector('.material-icons-round').textContent = 'mic';
  stopCallTimer();
  setCallView('idle');
  loadHistory();
}

function startCallTimer() {
  state.callSeconds = 0;
  updateTimer();
  state.callTimerInterval = setInterval(() => { state.callSeconds++; updateTimer(); }, 1000);
}
function stopCallTimer() {
  if (state.callTimerInterval) { clearInterval(state.callTimerInterval); state.callTimerInterval = null; }
  state.callSeconds = 0;
  DOM.callTimer.textContent = '00:00';
}
function updateTimer() {
  const m = String(Math.floor(state.callSeconds / 60)).padStart(2, '0');
  const s = String(state.callSeconds % 60).padStart(2, '0');
  DOM.callTimer.textContent = `${m}:${s}`;
}

// ═══════════════════════════════════════════
//  CONTACTS
// ═══════════════════════════════════════════
const contactModal = $('#contact-modal');
$('#add-contact-btn').addEventListener('click', () => {
  state.editingContactId = null;
  $('#contact-modal-title').textContent = 'Novo Contato';
  $('#contact-name').value = '';
  $('#contact-company').value = '';
  $('#contact-phone').value = '';
  $('#contact-email').value = '';
  $('#contact-location').value = '';
  $('#contact-obs').value = '';
  contactModal.classList.remove('hidden');
});
$('#close-contact-modal').addEventListener('click', () => contactModal.classList.add('hidden'));
$('#cancel-contact-modal').addEventListener('click', () => contactModal.classList.add('hidden'));

$('#save-contact-btn').addEventListener('click', async () => {
  const contact = {
    id: state.editingContactId || undefined,
    name: $('#contact-name').value.trim(),
    company: $('#contact-company').value.trim(),
    phone: $('#contact-phone').value.trim(),
    email: $('#contact-email').value.trim(),
    location: $('#contact-location').value.trim(),
    obs: $('#contact-obs').value.trim(),
  };
  if (!contact.name) { showToast('Digite o nome do contato', 'warning'); return; }
  const res = await fetch(apiUrl(`/api/contacts/${encodeURIComponent(state.username)}`), {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(contact)
  });
  state.contacts = await res.json();
  renderContacts();
  contactModal.classList.add('hidden');
  showToast('Contato salvo!', 'success');
});

$('#search-contacts').addEventListener('input', renderContacts);

async function loadContacts() {
  const res = await fetch(apiUrl(`/api/contacts/${encodeURIComponent(state.username)}`));
  state.contacts = await res.json();
  renderContacts();
}

function renderContacts() {
  const q = $('#search-contacts').value.toLowerCase();
  const filtered = state.contacts.filter(c =>
    !q || c.name.toLowerCase().includes(q) || (c.company || '').toLowerCase().includes(q) || (c.location || '').toLowerCase().includes(q)
  );
  if (filtered.length === 0) {
    $('#contacts-list').innerHTML = `<li class="empty-state"><span class="material-icons-round">contact_phone</span><p>Nenhum contato encontrado</p></li>`;
    return;
  }
  $('#contacts-list').innerHTML = filtered.map(c => `
    <li class="item" onclick="editContact('${c.id}')">
      <div class="contact-avatar">${c.name.charAt(0).toUpperCase()}</div>
      <div class="entity-info">
        <div class="entity-name">${escHtml(c.name)}</div>
        <div class="entity-sub">
          ${c.company ? `<span>${escHtml(c.company)}</span> · ` : ''}
          ${c.location ? `<span class="material-icons-round">location_on</span>${escHtml(c.location)}` : ''}
          ${c.phone ? ` · ${escHtml(c.phone)}` : ''}
        </div>
      </div>
      <div class="contact-actions">
        <button class="btn-ghost text-danger" onclick="event.stopPropagation(); deleteContact('${c.id}')" title="Excluir">
          <span class="material-icons-round">delete</span>
        </button>
      </div>
    </li>
  `).join('');
}

window.editContact = function(id) {
  const c = state.contacts.find(x => x.id === id);
  if (!c) return;
  state.editingContactId = id;
  $('#contact-modal-title').textContent = 'Editar Contato';
  $('#contact-name').value = c.name || '';
  $('#contact-company').value = c.company || '';
  $('#contact-phone').value = c.phone || '';
  $('#contact-email').value = c.email || '';
  $('#contact-location').value = c.location || '';
  $('#contact-obs').value = c.obs || '';
  contactModal.classList.remove('hidden');
};

window.deleteContact = async function(id) {
  if (!confirm('Excluir este contato?')) return;
  const res = await fetch(apiUrl(`/api/contacts/${encodeURIComponent(state.username)}/${id}`), { method: 'DELETE' });
  state.contacts = await res.json();
  renderContacts();
  showToast('Contato excluído', 'info');
};

// ═══════════════════════════════════════════
//  HISTORY
// ═══════════════════════════════════════════
$$('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.historyFilter = btn.dataset.filter;
    renderHistory();
  });
});

async function loadHistory() {
  const res = await fetch(apiUrl(`/api/history/${encodeURIComponent(state.username)}`));
  state.history = await res.json();
  renderHistory();
}

function renderHistory() {
  const filtered = state.historyFilter === 'all' ? state.history : state.history.filter(h => h.type === state.historyFilter);
  if (filtered.length === 0) {
    $('#history-list').innerHTML = `<li class="empty-state"><span class="material-icons-round">call_missed</span><p>Nenhuma chamada registrada</p></li>`;
    return;
  }
  $('#history-list').innerHTML = filtered.slice(0, 50).map(h => {
    const icon = h.type === 'incoming' ? 'call_received' : 'call_made';
    const cls = h.type === 'incoming' ? 'incoming' : 'outgoing';
    const label = h.type === 'incoming' ? 'Recebida' : 'Realizada';
    const time = formatDate(h.time);
    return `
      <li class="item">
        <div class="history-icon ${cls}"><span class="material-icons-round">${icon}</span></div>
        <div class="entity-info">
          <div class="entity-name">${escHtml(h.contact)}</div>
          <div class="entity-sub">
            ${h.location ? `<span class="material-icons-round">location_on</span>${escHtml(h.location)} · ` : ''}
            ${label}
          </div>
        </div>
        <span class="history-time">${time}</span>
      </li>
    `;
  }).join('');
}

// ═══════════════════════════════════════════
//  NOTES — NOTION-STYLE EDITOR
// ═══════════════════════════════════════════
const noteEditor = $('#note-editor');
const noteTitleInput = $('#note-title-input');
const noteCategory = $('#note-category');
const editorEmpty = $('#editor-empty');
const editorActive = $('#editor-active');

$('#new-note-btn').addEventListener('click', createNewNote);
$('#search-notes').addEventListener('input', renderNotesList);

// Toolbar commands
$$('.tool-btn[data-cmd]').forEach(btn => {
  btn.addEventListener('click', () => {
    const cmd = btn.dataset.cmd;
    const val = btn.dataset.value || null;
    document.execCommand(cmd, false, val);
    noteEditor.focus();
    autoSaveCurrentNote();
  });
});

// Special toolbar actions
$$('.tool-btn[data-action]').forEach(btn => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.action;
    switch (action) {
      case 'checklist':
        insertChecklist();
        break;
      case 'divider':
        document.execCommand('insertHTML', false, '<hr>');
        break;
      case 'highlight':
        const sel = window.getSelection();
        if (sel.rangeCount && !sel.isCollapsed) {
          document.execCommand('insertHTML', false, `<mark>${sel.toString()}</mark>`);
        }
        break;
      case 'code':
        const sel2 = window.getSelection();
        if (sel2.rangeCount && !sel2.isCollapsed) {
          document.execCommand('insertHTML', false, `<code>${sel2.toString()}</code>`);
        }
        break;
    }
    noteEditor.focus();
    autoSaveCurrentNote();
  });
});

function insertChecklist() {
  const html = `<div class="checklist-item"><input type="checkbox" onclick="toggleChecklistItem(this)"><span>Item da checklist</span></div>`;
  document.execCommand('insertHTML', false, html);
}

window.toggleChecklistItem = function(cb) {
  const item = cb.closest('.checklist-item');
  if (item) {
    item.classList.toggle('checked', cb.checked);
    autoSaveCurrentNote();
  }
};

// Auto-save on typing
let saveTimeout;
noteEditor.addEventListener('input', () => {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(autoSaveCurrentNote, 800);
  updateCharCount();
});

noteTitleInput.addEventListener('input', () => {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(autoSaveCurrentNote, 800);
});

noteCategory.addEventListener('change', () => autoSaveCurrentNote());

$('#pin-note-btn').addEventListener('click', () => {
  const note = state.notes.find(n => n.id === state.currentNoteId);
  if (note) {
    note.pinned = !note.pinned;
    autoSaveCurrentNote();
    renderNotesList();
    showToast(note.pinned ? 'Nota fixada' : 'Nota desafixada', 'info');
  }
});

$('#delete-note-btn').addEventListener('click', async () => {
  if (!state.currentNoteId) return;
  if (!confirm('Excluir esta nota?')) return;
  await fetch(apiUrl(`/api/notes/${encodeURIComponent(state.username)}/${state.currentNoteId}`), { method: 'DELETE' });
  state.notes = state.notes.filter(n => n.id !== state.currentNoteId);
  state.currentNoteId = null;
  editorEmpty.classList.add('active');
  editorActive.classList.add('hidden');
  renderNotesList();
  showToast('Nota excluída', 'info');
});

async function loadNotes() {
  const res = await fetch(apiUrl(`/api/notes/${encodeURIComponent(state.username)}`));
  state.notes = await res.json();
  renderNotesList();
}

function createNewNote() {
  const note = {
    id: generateId(),
    title: '',
    content: '',
    category: 'geral',
    pinned: false,
  };
  state.notes.unshift(note);
  state.currentNoteId = note.id;
  openNoteEditor(note);
  renderNotesList();
  noteTitleInput.focus();
  autoSaveCurrentNote();
}

function openNoteEditor(note) {
  state.currentNoteId = note.id;
  editorEmpty.classList.remove('active');
  editorActive.classList.remove('hidden');
  noteTitleInput.value = note.title || '';
  noteEditor.innerHTML = note.content || '';
  noteCategory.value = note.category || 'geral';
  updateCharCount();
  if (note.updatedAt) {
    $('#note-date').textContent = `Atualizado: ${formatDate(note.updatedAt)}`;
  } else {
    $('#note-date').textContent = '';
  }
  // Highlight selected
  $$('.notes-entity-list li.item').forEach(li => li.classList.remove('selected'));
  const el = document.querySelector(`.notes-entity-list li[data-id="${note.id}"]`);
  if (el) el.classList.add('selected');
}

async function autoSaveCurrentNote() {
  if (!state.currentNoteId) return;
  const note = state.notes.find(n => n.id === state.currentNoteId);
  if (!note) return;

  note.title = noteTitleInput.value.trim();
  note.content = noteEditor.innerHTML;
  note.category = noteCategory.value;

  await fetch(apiUrl(`/api/notes/${encodeURIComponent(state.username)}`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(note)
  });

  renderNotesList();
}

function renderNotesList() {
  const q = ($('#search-notes')?.value || '').toLowerCase();
  let filtered = state.notes.filter(n =>
    !q || (n.title || '').toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q)
  );

  // Pinned first
  filtered.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  if (filtered.length === 0) {
    $('#notes-list').innerHTML = `<li class="empty-state"><span class="material-icons-round">note_add</span><p>Nenhuma nota encontrada</p></li>`;
    return;
  }

  const catEmojis = { geral: '📋', 'ligação': '📞', 'reunião': '📅', tarefa: '✅', importante: '⭐', pessoal: '👤' };

  $('#notes-list').innerHTML = filtered.map(n => {
    const title = n.title || 'Sem título';
    const preview = stripHtml(n.content || '').substring(0, 60);
    const cat = catEmojis[n.category] || '📋';
    const selected = n.id === state.currentNoteId ? 'selected' : '';
    const date = n.updatedAt ? formatDateShort(n.updatedAt) : '';
    return `
      <li class="item ${selected}" data-id="${n.id}" onclick="selectNote('${n.id}')">
        ${n.pinned ? '<span class="material-icons-round note-pin-icon">push_pin</span>' : ''}
        <div class="note-item-title">${escHtml(title)}</div>
        <div class="note-item-preview">${escHtml(preview) || 'Nota vazia...'}</div>
        <div class="note-item-meta">
          <span class="note-cat-badge">${cat} ${n.category || 'geral'}</span>
          <span>${date}</span>
        </div>
      </li>
    `;
  }).join('');
}

window.selectNote = function(id) {
  const note = state.notes.find(n => n.id === id);
  if (note) openNoteEditor(note);
};

function updateCharCount() {
  const text = noteEditor.innerText || '';
  $('#note-chars').textContent = `${text.length} caracteres`;
}

// ═══════════════════════════════════════════
//  UTILITIES
// ═══════════════════════════════════════════
let toastTimeout;
function showToast(message, type = 'info') {
  const icons = { info: 'info', success: 'check_circle', warning: 'warning', error: 'error' };
  DOM.toastIcon.textContent = icons[type] || 'info';
  DOM.toastMsg.textContent = message;
  DOM.toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => DOM.toast.classList.remove('show'), 3500);
}

function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

// Constrói URL da API (local ou remoto via GitHub Pages)
function apiUrl(path) {
  return `${getServerUrl()}${path}`;
}

function stripHtml(html) {
  const d = document.createElement('div');
  d.innerHTML = html;
  return d.textContent || '';
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function formatDateShort(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

// ═══ RECONNECTION ═══
  socket.on('disconnect', () => {
    DOM.connIndicator.querySelector('.conn-text').textContent = 'Desconectado';
    DOM.connIndicator.querySelector('.conn-dot').style.background = 'var(--danger)';
    DOM.connIndicator.style.background = 'var(--danger-light)';
    DOM.connIndicator.style.color = 'var(--danger)';
    showToast('Conexão perdida. Reconectando...', 'error');
  });

  socket.on('connect', () => {
    DOM.connIndicator.querySelector('.conn-text').textContent = 'Conectado';
    DOM.connIndicator.querySelector('.conn-dot').style.background = 'var(--success)';
    DOM.connIndicator.style.background = 'var(--success-light)';
    DOM.connIndicator.style.color = 'var(--success)';
    if (state.username) {
      socket.emit('register', { username: state.username, location: state.location });
      showToast('Reconectado!', 'success');
    }
  });

} // fim setupSocketEvents

// Inicializa os eventos do socket
setupSocketEvents();
