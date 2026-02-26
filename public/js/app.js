// ═══════════════════════════════════════════════════
//  SOFTPHONE PRO v3.0 — Client Application
//  Features: DTMF, Hold, Transfer, DND, Status,
//  Ringtone, Volume Slider, Click-to-Dial
// ═══════════════════════════════════════════════════

// ═══ CONFIG ═══
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
  loginBtn: $('#login-btn'),
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
  // Status
  userStatus: $('#user-status'),
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
  holdBtn: $('#hold-btn'),
  transferBtn: $('#transfer-btn'),
  dtmfToggleBtn: $('#dtmf-toggle-btn'),
  volumeSlider: $('#volume-slider'),
  // DTMF
  dtmfPad: $('#dtmf-pad'),
  dtmfDisplay: $('#dtmf-display'),
  // Transfer Modal
  transferModal: $('#transfer-modal'),
  transferUserList: $('#transfer-user-list'),
  // Connection
  connIndicator: $('#conn-indicator'),
};

// ═══ STATE ═══
let state = {
  username: '',
  location: '',
  userStatus: 'disponível',
  dnd: false,
  currentCallTarget: null,
  currentCallName: null,
  peerConnection: null,
  localStream: null,
  callTimerInterval: null,
  callSeconds: 0,
  isMuted: false,
  isOnHold: false,
  pendingOffer: null,
  pendingCallerId: null,
  pendingCallerName: null,
  pendingCallerLocation: null,
  allUsers: [],
  dtmfInput: '',
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

// ═══ ICE CONFIG ═══
const iceConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' }
  ],
  iceCandidatePoolSize: 10
};

// ═══ DTMF FREQUENCIES ═══
const DTMF_FREQS = {
  '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
  '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
  '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
  '*': [941, 1209], '0': [941, 1336], '#': [941, 1477]
};

// ═══ AUDIO CONTEXT ═══
let audioCtx = null;
let ringtoneInterval = null;

function getAudioContext() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

// ═══════════════════════════════════════════
//  DTMF TONE GENERATION
// ═══════════════════════════════════════════
function playDTMF(key) {
  const freqs = DTMF_FREQS[key];
  if (!freqs) return;
  const ctx = getAudioContext();
  const duration = 0.15;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  gain.connect(ctx.destination);
  freqs.forEach(freq => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.connect(gain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  });
}

// ═══════════════════════════════════════════
//  RINGTONE (Web Audio API)
// ═══════════════════════════════════════════
function startRingtone() {
  stopRingtone();
  const ctx = getAudioContext();
  let isPlaying = false;

  ringtoneInterval = setInterval(() => {
    if (isPlaying) return;
    isPlaying = true;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.connect(ctx.destination);

    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(440, ctx.currentTime);
    osc1.connect(gain);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(480, ctx.currentTime);
    osc2.connect(gain);

    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.setValueAtTime(0, ctx.currentTime + 1);

    osc1.stop(ctx.currentTime + 1);
    osc2.stop(ctx.currentTime + 1);

    setTimeout(() => { isPlaying = false; }, 3000);
  }, 100);
}

function stopRingtone() {
  if (ringtoneInterval) { clearInterval(ringtoneInterval); ringtoneInterval = null; }
}

// ═══════════════════════════════════════════
//  LOGIN
// ═══════════════════════════════════════════
DOM.loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = DOM.usernameInput.value.trim();
  const loc = DOM.locationInput.value.trim();
  if (!name) { showToast('Digite seu nome para conectar', 'warning'); return; }

  // GitHub Pages: save server URL and reconnect
  if (isGitHubPages) {
    const serverInput = document.getElementById('server-input');
    const serverUrl = serverInput ? serverInput.value.trim() : '';
    if (!serverUrl) { showToast('Informe o endereço do servidor', 'warning'); return; }
    localStorage.setItem('softphone_server', serverUrl);
    reconnectSocket(serverUrl);
  }

  state.username = name;
  state.location = loc || 'Não informado';

  DOM.loginBtn.disabled = true;
  DOM.loginBtn.innerHTML = '<span class="material-icons-round">hourglass_empty</span> Conectando...';

  const doRegister = () => {
    socket.emit('register', { username: state.username, location: state.location, status: state.userStatus });
    DOM.topbarUsername.textContent = state.username;
    DOM.topbarLocation.textContent = state.location;
    DOM.topbarAvatar.textContent = state.username.charAt(0).toUpperCase();
    switchScreen('main');
    showToast(`Bem-vindo, ${state.username}!`, 'success');
    DOM.loginBtn.disabled = false;
    DOM.loginBtn.innerHTML = '<span class="material-icons-round">login</span> Conectar ao Sistema';
    loadNotes();
    loadContacts();
    loadHistory();
  };

  if (socket.connected) {
    doRegister();
  } else {
    showToast('Conectando ao servidor...', 'info');

    const connectTimeout = setTimeout(() => {
      socket.off('connect', onConnect);
      socket.off('connect_error', onError);
      DOM.loginBtn.disabled = false;
      DOM.loginBtn.innerHTML = '<span class="material-icons-round">login</span> Conectar ao Sistema';
      showToast('Tempo esgotado. Verifique se o servidor está rodando.', 'error');
    }, 8000);

    const onConnect = () => {
      clearTimeout(connectTimeout);
      socket.off('connect_error', onError);
      doRegister();
    };

    const onError = () => {
      clearTimeout(connectTimeout);
      socket.off('connect', onConnect);
      DOM.loginBtn.disabled = false;
      DOM.loginBtn.innerHTML = '<span class="material-icons-round">login</span> Conectar ao Sistema';
      showToast('Não foi possível conectar ao servidor. Verifique o endereço.', 'error');
    };

    socket.once('connect', onConnect);
    socket.once('connect_error', onError);
  }
});

DOM.logoutBtn.addEventListener('click', () => {
  if (state.currentCallTarget) endCurrentCall();
  switchScreen('login');
  socket.disconnect();
  socket.connect();
  state.username = '';
  state.location = '';
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
    $(`#tab-${item.dataset.tab}`).classList.add('active');
  });
});

// ═══════════════════════════════════════════
//  STATUS MANAGEMENT
// ═══════════════════════════════════════════
if (DOM.userStatus) {
  DOM.userStatus.addEventListener('change', () => {
    state.userStatus = DOM.userStatus.value;
    state.dnd = (state.userStatus === 'nao_perturbe');
    socket.emit('update-status', { status: state.userStatus });
    const labels = { 'disponível': 'Disponível', 'ausente': 'Ausente', 'ocupado': 'Ocupado', 'nao_perturbe': 'Não Perturbe' };
    showToast(`Status: ${labels[state.userStatus]}`, 'info');
  });
}

// ═══════════════════════════════════════════
//  DTMF PAD HANDLERS
// ═══════════════════════════════════════════
$$('.dtmf-key').forEach(key => {
  key.addEventListener('click', () => {
    const tone = key.dataset.tone;
    playDTMF(tone);

    // In-call: send DTMF to remote peer
    if (state.currentCallTarget) {
      socket.emit('dtmf-tone', { targetId: state.currentCallTarget, tone });
    }

    // Idle pad: update display
    if (DOM.dtmfDisplay && !state.currentCallTarget) {
      state.dtmfInput += tone;
      DOM.dtmfDisplay.value = state.dtmfInput;
    }
  });
});

// DTMF backspace
const dtmfBackspace = $('#dtmf-backspace');
if (dtmfBackspace) {
  dtmfBackspace.addEventListener('click', () => {
    state.dtmfInput = state.dtmfInput.slice(0, -1);
    if (DOM.dtmfDisplay) DOM.dtmfDisplay.value = state.dtmfInput;
  });
}

// DTMF call button (dial from idle pad)
const dtmfCallBtn = $('#dtmf-call-btn');
if (dtmfCallBtn) {
  dtmfCallBtn.addEventListener('click', () => {
    if (!state.dtmfInput) { showToast('Digite um número ou nome', 'warning'); return; }
    const query = state.dtmfInput.toLowerCase();
    const target = state.allUsers.find(u =>
      u.id !== socket.id &&
      u.status === 'disponível' &&
      (u.username.toLowerCase().includes(query) || (u.location || '').toLowerCase().includes(query))
    );
    if (target) {
      initiateCall(target.id, target.username, target.location);
    } else {
      showToast('Usuário não encontrado ou indisponível', 'warning');
    }
  });
}

// Toggle DTMF pad during call
if (DOM.dtmfToggleBtn) {
  DOM.dtmfToggleBtn.addEventListener('click', () => {
    if (DOM.dtmfPad) {
      DOM.dtmfPad.classList.toggle('hidden');
      DOM.dtmfToggleBtn.classList.toggle('active', !DOM.dtmfPad.classList.contains('hidden'));
    }
  });
}

// ═══════════════════════════════════════════
//  VOLUME SLIDER
// ═══════════════════════════════════════════
if (DOM.volumeSlider) {
  DOM.volumeSlider.addEventListener('input', () => {
    const vol = DOM.volumeSlider.value / 100;
    DOM.remoteAudio.volume = vol;
    const icon = DOM.volumeSlider.closest('.volume-control')?.querySelector('.vol-icon');
    if (icon) {
      icon.textContent = vol === 0 ? 'volume_off' : vol < 0.5 ? 'volume_down' : 'volume_up';
    }
  });
}

// ═══════════════════════════════════════════
//  SOCKET EVENTS (inside setupSocketEvents)
// ═══════════════════════════════════════════
function setupSocketEvents() {
  socket.off();

  // ── User list ──
  socket.on('user-list', (users) => {
    state.allUsers = users;
    renderUserList();
  });

  // ── Incoming call ──
  socket.on('incoming-call', async ({ callerId, callerName, callerLocation, offer }) => {
    // DND: auto-reject
    if (state.dnd || state.userStatus === 'nao_perturbe') {
      socket.emit('call-rejected', { callerId });
      return;
    }
    if (state.currentCallTarget) {
      socket.emit('call-rejected', { callerId });
      return;
    }
    state.currentCallTarget = callerId;
    state.currentCallName = callerName;
    state.pendingOffer = offer;
    state.pendingCallerId = callerId;
    state.pendingCallerName = callerName;
    state.pendingCallerLocation = callerLocation || '';
    DOM.incomingName.textContent = callerName;
    DOM.incomingLocation.textContent = callerLocation || '';
    setCallView('incoming');
    startRingtone();
    showToast(`${callerName} está ligando`, 'info');
  });

  // ── Call answered ──
  socket.on('call-answered', async ({ answer, calleeName, calleeLocation }) => {
    try {
      await state.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      state.currentCallName = calleeName;
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

  // ── Call rejected ──
  socket.on('call-rejected-response', ({ calleeName }) => {
    showToast(`${calleeName} recusou a chamada`, 'warning');
    cleanupCall();
  });

  socket.on('call-error', ({ message }) => {
    showToast(message, 'warning');
    cleanupCall();
  });

  // ── ICE candidates ──
  socket.on('ice-candidate', async ({ candidate }) => {
    try {
      if (state.peerConnection && candidate) {
        await state.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (e) { console.error('ICE error:', e); }
  });

  // ── Call ended ──
  socket.on('call-ended', ({ endedBy }) => {
    showToast(`Ligação encerrada por ${endedBy}`, 'info');
    cleanupCall();
  });

  // ── Call on hold ──
  socket.on('call-on-hold', ({ by }) => {
    showToast(`${by} colocou a chamada em espera`, 'info');
  });

  socket.on('call-resumed', ({ by }) => {
    showToast(`${by} retomou a chamada`, 'info');
  });

  // ── Call transfer ──
  socket.on('call-transferred', ({ from, transferTo }) => {
    showToast(`Chamada transferida por ${from}`, 'info');
    cleanupCall();
    const target = state.allUsers.find(u => u.id === transferTo);
    if (target) {
      setTimeout(() => initiateCall(target.id, target.username, target.location), 500);
    }
  });

  // ── DTMF received ──
  socket.on('dtmf-received', ({ tone }) => {
    playDTMF(tone);
  });

  // ── Connection status ──
  socket.on('disconnect', () => {
    updateConnectionUI(false);
    showToast('Conexão perdida. Reconectando...', 'error');
  });

  socket.on('connect', () => {
    updateConnectionUI(true);
    if (state.username) {
      socket.emit('register', { username: state.username, location: state.location, status: state.userStatus });
      showToast('Reconectado!', 'success');
    }
  });
}

function updateConnectionUI(connected) {
  const dot = DOM.connIndicator.querySelector('.conn-dot');
  const text = DOM.connIndicator.querySelector('.conn-text');
  if (connected) {
    text.textContent = 'Conectado';
    dot.style.background = 'var(--success)';
    DOM.connIndicator.style.background = 'var(--success-light)';
    DOM.connIndicator.style.color = 'var(--success)';
  } else {
    text.textContent = 'Desconectado';
    dot.style.background = 'var(--danger)';
    DOM.connIndicator.style.background = 'var(--danger-light)';
    DOM.connIndicator.style.color = 'var(--danger)';
  }
}

// ═══════════════════════════════════════════
//  USER LIST
// ═══════════════════════════════════════════
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

  const statusDots = { 'disponível': 'available', 'ausente': 'away', 'ocupado': 'busy', 'nao_perturbe': 'dnd', 'em_ligação': 'busy' };
  const statusLabels = { 'disponível': 'Disponível', 'ausente': 'Ausente', 'ocupado': 'Ocupado', 'nao_perturbe': 'Não Perturbe', 'em_ligação': 'Em Ligação' };

  DOM.userList.innerHTML = others.map(u => {
    const initial = u.username.charAt(0).toUpperCase();
    const canCall = u.status === 'disponível';
    const dotClass = statusDots[u.status] || 'available';
    const statusText = statusLabels[u.status] || u.status;
    return `
      <li class="item" ${canCall ? `onclick="initiateCall('${u.id}','${escHtml(u.username)}','${escHtml(u.location || '')}')"` : ''}>
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
        ${canCall ? `<button class="call-item-btn" onclick="event.stopPropagation(); initiateCall('${u.id}','${escHtml(u.username)}','${escHtml(u.location || '')}')"><span class="material-icons-round">call</span></button>` : ''}
      </li>
    `;
  }).join('');
}

// ═══════════════════════════════════════════
//  CALL LOGIC
// ═══════════════════════════════════════════
async function initiateCall(targetId, targetName, targetLocation) {
  if (state.currentCallTarget) { showToast('Você já está em uma ligação', 'warning'); return; }
  if (state.dnd) { showToast('Desative o Não Perturbe para fazer chamadas', 'warning'); return; }

  try {
    state.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    state.currentCallTarget = targetId;
    state.currentCallName = targetName;
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
// Expose to global for onclick handlers in rendered HTML
window.initiateCall = initiateCall;

// Accept call
DOM.acceptCallBtn.addEventListener('click', async () => {
  stopRingtone();
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

// Reject call
DOM.rejectCallBtn.addEventListener('click', () => {
  stopRingtone();
  socket.emit('call-rejected', { callerId: state.pendingCallerId });
  showToast('Chamada recusada', 'info');
  cleanupCall();
});

// Cancel / End call
DOM.cancelCallBtn.addEventListener('click', () => { endCurrentCall(); showToast('Chamada cancelada', 'info'); });
DOM.endCallBtn.addEventListener('click', () => { endCurrentCall(); showToast('Chamada encerrada', 'info'); });

function endCurrentCall() {
  stopRingtone();
  if (state.currentCallTarget) socket.emit('end-call', { targetId: state.currentCallTarget });
  cleanupCall();
}

// ═══ HOLD / RESUME ═══
if (DOM.holdBtn) {
  DOM.holdBtn.addEventListener('click', () => {
    if (!state.currentCallTarget || !state.localStream) return;
    state.isOnHold = !state.isOnHold;

    // Mute audio when on hold
    state.localStream.getAudioTracks().forEach(t => t.enabled = !state.isOnHold);

    DOM.holdBtn.classList.toggle('active', state.isOnHold);
    DOM.holdBtn.querySelector('.material-icons-round').textContent = state.isOnHold ? 'play_arrow' : 'pause';
    DOM.holdBtn.querySelectorAll('span')[1].textContent = state.isOnHold ? 'Retomar' : 'Espera';

    socket.emit(state.isOnHold ? 'call-hold' : 'call-resume', { targetId: state.currentCallTarget });
    showToast(state.isOnHold ? 'Chamada em espera' : 'Chamada retomada', 'info');
  });
}

// ═══ TRANSFER ═══
if (DOM.transferBtn) {
  DOM.transferBtn.addEventListener('click', () => {
    if (!state.currentCallTarget) return;

    const available = state.allUsers.filter(u =>
      u.id !== socket.id && u.id !== state.currentCallTarget && u.status === 'disponível'
    );

    if (available.length === 0) {
      showToast('Nenhum usuário disponível para transferência', 'warning');
      return;
    }

    DOM.transferUserList.innerHTML = available.map(u => `
      <li class="item" onclick="executeTransfer('${u.id}', '${escHtml(u.username)}')">
        <div class="user-avatar-wrap">${u.username.charAt(0).toUpperCase()}<span class="online-dot available"></span></div>
        <div class="entity-info">
          <div class="entity-name">${escHtml(u.username)}</div>
          <div class="entity-sub"><span class="material-icons-round">location_on</span>${escHtml(u.location || 'Não informado')}</div>
        </div>
        <button class="call-item-btn" style="opacity:1;transform:scale(1);"><span class="material-icons-round">phone_forwarded</span></button>
      </li>
    `).join('');

    DOM.transferModal.classList.remove('hidden');
  });
}

window.executeTransfer = function(targetUserId, targetUsername) {
  socket.emit('call-transfer', { currentCallTarget: state.currentCallTarget, transferTo: targetUserId });
  DOM.transferModal.classList.add('hidden');
  showToast(`Chamada transferida para ${targetUsername}`, 'success');
  cleanupCall();
};

$('#close-transfer-modal')?.addEventListener('click', () => {
  DOM.transferModal.classList.add('hidden');
});

// ═══ MUTE ═══
DOM.muteBtn.addEventListener('click', () => {
  if (!state.localStream) return;
  state.isMuted = !state.isMuted;
  state.localStream.getAudioTracks().forEach(t => t.enabled = !state.isMuted);
  DOM.muteBtn.classList.toggle('active', state.isMuted);
  DOM.muteBtn.querySelector('.material-icons-round').textContent = state.isMuted ? 'mic_off' : 'mic';
  showToast(state.isMuted ? 'Microfone desligado' : 'Microfone ligado', 'info');
});

// ═══ WebRTC ═══
function createPeerConnection(targetId) {
  state.peerConnection = new RTCPeerConnection(iceConfig);

  state.peerConnection.onicecandidate = (e) => {
    if (e.candidate) socket.emit('ice-candidate', { targetId, candidate: e.candidate });
  };

  state.peerConnection.ontrack = (e) => {
    DOM.remoteAudio.srcObject = e.streams[0];
    if (DOM.volumeSlider) DOM.remoteAudio.volume = DOM.volumeSlider.value / 100;
  };

  state.peerConnection.oniceconnectionstatechange = () => {
    const s = state.peerConnection.iceConnectionState;
    updateCallQuality(s);
    if (s === 'disconnected' || s === 'failed') {
      showToast('Conexão perdida', 'error');
      endCurrentCall();
    }
  };
}

function updateCallQuality(iceState) {
  const indicator = $('#call-quality-dot');
  if (!indicator) return;
  const colors = { 'connected': 'var(--success)', 'completed': 'var(--success)', 'checking': 'var(--warning)', 'new': 'var(--gray-400)' };
  const labels = { 'connected': 'Qualidade Boa', 'completed': 'Qualidade Boa', 'checking': 'Conectando...', 'new': 'Iniciando...' };
  indicator.style.background = colors[iceState] || 'var(--danger)';
  const labelEl = $('#call-quality-text');
  if (labelEl) labelEl.textContent = labels[iceState] || iceState;
}

function setCallView(view) {
  [DOM.callIdle, DOM.callCalling, DOM.callIncoming, DOM.callActive].forEach(v => v.classList.remove('active'));
  if (DOM.dtmfPad && view !== 'active') DOM.dtmfPad.classList.add('hidden');
  switch (view) {
    case 'idle': DOM.callIdle.classList.add('active'); break;
    case 'calling': DOM.callCalling.classList.add('active'); break;
    case 'incoming': DOM.callIncoming.classList.add('active'); break;
    case 'active': DOM.callActive.classList.add('active'); break;
  }
}

function cleanupCall() {
  stopRingtone();
  if (state.peerConnection) { state.peerConnection.close(); state.peerConnection = null; }
  if (state.localStream) { state.localStream.getTracks().forEach(t => t.stop()); state.localStream = null; }
  state.currentCallTarget = null;
  state.currentCallName = null;
  state.isMuted = false;
  state.isOnHold = false;
  state.dtmfInput = '';
  if (DOM.dtmfDisplay) DOM.dtmfDisplay.value = '';
  DOM.muteBtn.classList.remove('active');
  DOM.muteBtn.querySelector('.material-icons-round').textContent = 'mic';
  if (DOM.holdBtn) {
    DOM.holdBtn.classList.remove('active');
    DOM.holdBtn.querySelector('.material-icons-round').textContent = 'pause';
    DOM.holdBtn.querySelectorAll('span')[1].textContent = 'Espera';
  }
  if (DOM.dtmfToggleBtn) DOM.dtmfToggleBtn.classList.remove('active');
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
//  CONTACTS (with click-to-dial)
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
  try {
    const res = await fetch(apiUrl(`/api/contacts/${encodeURIComponent(state.username)}`), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(contact)
    });
    state.contacts = await res.json();
    renderContacts();
    contactModal.classList.add('hidden');
    showToast('Contato salvo!', 'success');
  } catch (e) { showToast('Erro ao salvar contato', 'error'); }
});

$('#search-contacts').addEventListener('input', renderContacts);

async function loadContacts() {
  try {
    const res = await fetch(apiUrl(`/api/contacts/${encodeURIComponent(state.username)}`));
    state.contacts = await res.json();
    renderContacts();
  } catch (e) { console.warn('Could not load contacts:', e); }
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
  $('#contacts-list').innerHTML = filtered.map(c => {
    // Check if contact is online for click-to-dial
    const onlineUser = state.allUsers.find(u =>
      u.id !== socket.id && u.username.toLowerCase() === c.name.toLowerCase() && u.status === 'disponível'
    );
    return `
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
        ${onlineUser ? `<button class="btn-ghost" onclick="event.stopPropagation(); initiateCall('${onlineUser.id}','${escHtml(onlineUser.username)}','${escHtml(onlineUser.location || '')}')" title="Ligar" style="color:var(--success)"><span class="material-icons-round">call</span></button>` : ''}
        <button class="btn-ghost text-danger" onclick="event.stopPropagation(); deleteContact('${c.id}')" title="Excluir">
          <span class="material-icons-round">delete</span>
        </button>
      </div>
    </li>`;
  }).join('');
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
  try {
    const res = await fetch(apiUrl(`/api/contacts/${encodeURIComponent(state.username)}/${id}`), { method: 'DELETE' });
    state.contacts = await res.json();
    renderContacts();
    showToast('Contato excluído', 'info');
  } catch (e) { showToast('Erro ao excluir contato', 'error'); }
};

// ═══════════════════════════════════════════
//  HISTORY (with redial)
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
  try {
    const res = await fetch(apiUrl(`/api/history/${encodeURIComponent(state.username)}`));
    state.history = await res.json();
    renderHistory();
  } catch (e) { console.warn('Could not load history:', e); }
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
    // Check if contact is online for redial
    const onlineUser = state.allUsers.find(u => u.id !== socket.id && u.username === h.contact && u.status === 'disponível');
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
        <div style="display:flex;align-items:center;gap:8px;">
          ${onlineUser ? `<button class="call-item-btn" style="opacity:1;transform:scale(1);" onclick="initiateCall('${onlineUser.id}','${escHtml(onlineUser.username)}','${escHtml(onlineUser.location || '')}')"><span class="material-icons-round">call</span></button>` : ''}
          <span class="history-time">${time}</span>
        </div>
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
    document.execCommand(btn.dataset.cmd, false, btn.dataset.value || null);
    noteEditor.focus();
    autoSaveCurrentNote();
  });
});

// Special toolbar actions
$$('.tool-btn[data-action]').forEach(btn => {
  btn.addEventListener('click', () => {
    switch (btn.dataset.action) {
      case 'checklist': insertChecklist(); break;
      case 'divider': document.execCommand('insertHTML', false, '<hr>'); break;
      case 'highlight': {
        const sel = window.getSelection();
        if (sel.rangeCount && !sel.isCollapsed) document.execCommand('insertHTML', false, `<mark>${sel.toString()}</mark>`);
        break;
      }
      case 'code': {
        const sel = window.getSelection();
        if (sel.rangeCount && !sel.isCollapsed) document.execCommand('insertHTML', false, `<code>${sel.toString()}</code>`);
        break;
      }
    }
    noteEditor.focus();
    autoSaveCurrentNote();
  });
});

function insertChecklist() {
  document.execCommand('insertHTML', false, `<div class="checklist-item"><input type="checkbox" onclick="toggleChecklistItem(this)"><span>Item da checklist</span></div>`);
}

window.toggleChecklistItem = function(cb) {
  const item = cb.closest('.checklist-item');
  if (item) { item.classList.toggle('checked', cb.checked); autoSaveCurrentNote(); }
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
  try {
    await fetch(apiUrl(`/api/notes/${encodeURIComponent(state.username)}/${state.currentNoteId}`), { method: 'DELETE' });
  } catch (e) { /* ignore */ }
  state.notes = state.notes.filter(n => n.id !== state.currentNoteId);
  state.currentNoteId = null;
  editorEmpty.classList.add('active');
  editorActive.classList.add('hidden');
  renderNotesList();
  showToast('Nota excluída', 'info');
});

async function loadNotes() {
  try {
    const res = await fetch(apiUrl(`/api/notes/${encodeURIComponent(state.username)}`));
    state.notes = await res.json();
    renderNotesList();
  } catch (e) { console.warn('Could not load notes:', e); }
}

function createNewNote() {
  const note = { id: generateId(), title: '', content: '', category: 'geral', pinned: false };
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
  $('#note-date').textContent = note.updatedAt ? `Atualizado: ${formatDate(note.updatedAt)}` : '';
  $$('.notes-entity-list li.item').forEach(li => li.classList.remove('selected'));
  const el = $(`.notes-entity-list li[data-id="${note.id}"]`);
  if (el) el.classList.add('selected');
}

async function autoSaveCurrentNote() {
  if (!state.currentNoteId) return;
  const note = state.notes.find(n => n.id === state.currentNoteId);
  if (!note) return;
  note.title = noteTitleInput.value.trim();
  note.content = noteEditor.innerHTML;
  note.category = noteCategory.value;
  try {
    await fetch(apiUrl(`/api/notes/${encodeURIComponent(state.username)}`), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(note)
    });
  } catch (e) { console.warn('Could not save note:', e); }
  renderNotesList();
}

function renderNotesList() {
  const q = ($('#search-notes')?.value || '').toLowerCase();
  let filtered = state.notes.filter(n => !q || (n.title || '').toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q));
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
  $('#note-chars').textContent = `${(noteEditor.innerText || '').length} caracteres`;
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

function apiUrl(path) { return `${getServerUrl()}${path}`; }

function stripHtml(html) {
  const d = document.createElement('div');
  d.innerHTML = html;
  return d.textContent || '';
}

function generateId() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 9); }

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function formatDateShort(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

// ═══ INIT ═══
setupSocketEvents();
