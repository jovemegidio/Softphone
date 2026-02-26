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

// ═══════════════════════════════════════════
//  SIP ENGINE (JsSIP Integration)
// ═══════════════════════════════════════════
let sipUA = null;
let sipSession = null;
let sipRegistered = false;

function loadSIPConfig() {
  try { return JSON.parse(localStorage.getItem('softphone_sip') || '{}'); }
  catch { return {}; }
}

function saveSIPConfig(config) {
  localStorage.setItem('softphone_sip', JSON.stringify(config));
}

// Populate SIP form from saved config on load
(function initSIPForm() {
  const cfg = loadSIPConfig();
  const fields = { 'sip-server': cfg.server, 'sip-domain': cfg.domain, 'sip-extension': cfg.extension, 'sip-password': cfg.password, 'sip-display-name': cfg.displayName };
  for (const [id, val] of Object.entries(fields)) {
    const el = document.getElementById(id);
    if (el && val) el.value = val;
  }
})();

// Save config button
$('#sip-save-btn')?.addEventListener('click', () => {
  const config = getSIPFormValues();
  if (!config.server || !config.extension) { showToast('Preencha servidor e ramal', 'warning'); return; }
  saveSIPConfig(config);
  showToast('Configuração SIP salva!', 'success');
});

function getSIPFormValues() {
  return {
    server: $('#sip-server')?.value?.trim() || '',
    domain: $('#sip-domain')?.value?.trim() || '',
    extension: $('#sip-extension')?.value?.trim() || '',
    password: $('#sip-password')?.value?.trim() || '',
    displayName: $('#sip-display-name')?.value?.trim() || ''
  };
}

// Connect SIP
$('#sip-connect-btn')?.addEventListener('click', () => {
  const config = getSIPFormValues();
  if (!config.server) { showToast('Informe o servidor WebSocket SIP', 'warning'); return; }
  if (!config.extension) { showToast('Informe o ramal/extensão', 'warning'); return; }
  if (!config.domain) config.domain = config.server.replace(/^wss?:\/\//, '').replace(/[:\/].*$/, '');
  saveSIPConfig(config);
  sipConnect(config);
});

// Disconnect SIP
$('#sip-disconnect-btn')?.addEventListener('click', () => {
  sipDisconnect();
});

function sipConnect(config) {
  if (typeof JsSIP === 'undefined') {
    showToast('JsSIP não carregou. Recarregue a página.', 'error');
    return;
  }

  sipDisconnect(); // cleanup previous

  try {
    const wsSocket = new JsSIP.WebSocketInterface(config.server);

    sipUA = new JsSIP.UA({
      sockets: [wsSocket],
      uri: `sip:${config.extension}@${config.domain}`,
      password: config.password || '',
      display_name: config.displayName || config.extension,
      register: true,
      session_timers: false,
      user_agent: 'SoftphonePro/4.0'
    });

    updateSIPStatus('connecting', 'Conectando ao servidor SIP...');

    sipUA.on('connected', () => {
      updateSIPStatus('connecting', 'Conectado, registrando...');
    });

    sipUA.on('registered', () => {
      sipRegistered = true;
      updateSIPStatus('registered', `Registrado: ramal ${config.extension}`);
      showToast(`SIP registrado — ramal ${config.extension}`, 'success');
    });

    sipUA.on('unregistered', () => {
      sipRegistered = false;
      updateSIPStatus('offline', 'Não registrado');
    });

    sipUA.on('registrationFailed', (e) => {
      sipRegistered = false;
      const cause = e.cause || 'Erro desconhecido';
      updateSIPStatus('error', `Falha: ${cause}`);
      showToast(`Registro SIP falhou: ${cause}`, 'error');
    });

    sipUA.on('disconnected', () => {
      sipRegistered = false;
      updateSIPStatus('offline', 'Desconectado do servidor SIP');
    });

    // Incoming SIP calls
    sipUA.on('newRTCSession', (data) => {
      if (data.originator === 'remote') {
        handleIncomingSIPCall(data.session);
      }
    });

    sipUA.start();

  } catch (err) {
    console.error('SIP connect error:', err);
    showToast('Erro SIP: ' + err.message, 'error');
    updateSIPStatus('error', 'Erro: ' + err.message);
  }
}

function sipDisconnect() {
  if (sipUA) {
    try { sipUA.stop(); } catch (e) { console.warn('SIP stop error:', e); }
    sipUA = null;
    sipRegistered = false;
    updateSIPStatus('offline', 'Desconectado');
    showToast('SIP desconectado', 'info');
  }
}

// ═══ SIP OUTGOING CALL ═══
function sipCall(number) {
  if (!sipUA || !sipRegistered) {
    showToast('SIP não está registrado. Configure nas Configurações.', 'warning');
    return;
  }

  const config = loadSIPConfig();
  const domain = config.domain || config.server.replace(/^wss?:\/\//, '').replace(/[:\/].*$/, '');
  const target = `sip:${number}@${domain}`;

  try {
    const eventHandlers = {
      progress: () => {
        state.currentCallTarget = 'sip-call';
        state.currentCallName = number;
        setCallView('calling');
        DOM.callingName.textContent = number;
        DOM.callingLocation.textContent = '📡 Via SIP';
        showToast(`Chamando ${number} via SIP...`, 'info');
      },
      accepted: () => {
        DOM.activeCallName.textContent = number;
        DOM.activeCallLocation.textContent = '📡 Via SIP';
        setCallView('active');
        startCallTimer();
        showToast(`Em ligação SIP com ${number}`, 'success');
      },
      confirmed: () => {
        // Session is fully established
      },
      ended: () => {
        showToast('Ligação SIP encerrada', 'info');
        cleanupSIPCall();
      },
      failed: (e) => {
        showToast(`Chamada SIP falhou: ${e.cause || 'Erro'}`, 'error');
        cleanupSIPCall();
      },
      peerconnection: (e) => {
        // Attach remote audio
        e.peerconnection.addEventListener('track', (evt) => {
          if (evt.streams && evt.streams[0]) {
            DOM.remoteAudio.srcObject = evt.streams[0];
            if (DOM.volumeSlider) DOM.remoteAudio.volume = DOM.volumeSlider.value / 100;
          }
        });
      }
    };

    sipSession = sipUA.call(target, {
      eventHandlers,
      mediaConstraints: { audio: true, video: false },
      rtcOfferConstraints: { offerToReceiveAudio: true },
      pcConfig: iceConfig
    });

  } catch (err) {
    console.error('SIP call error:', err);
    showToast('Erro ao ligar via SIP: ' + err.message, 'error');
  }
}

// ═══ SIP INCOMING CALL ═══
function handleIncomingSIPCall(session) {
  // DND check
  if (state.dnd || state.userStatus === 'nao_perturbe') {
    session.terminate({ status_code: 486, reason_phrase: 'Busy Here' });
    return;
  }
  // Already in call
  if (state.currentCallTarget) {
    session.terminate({ status_code: 486, reason_phrase: 'Busy Here' });
    return;
  }

  sipSession = session;
  const caller = session.remote_identity?.display_name || session.remote_identity?.uri?.user || 'Desconhecido';

  state.currentCallTarget = 'sip-incoming';
  state.currentCallName = caller;
  state.pendingCallerId = null; // Not a WebRTC call

  DOM.incomingName.textContent = caller;
  DOM.incomingLocation.textContent = '📡 Via SIP';
  setCallView('incoming');
  startRingtone();
  showToast(`Chamada SIP de ${caller}`, 'info');

  // Session events
  session.on('peerconnection', (e) => {
    e.peerconnection.addEventListener('track', (evt) => {
      if (evt.streams && evt.streams[0]) {
        DOM.remoteAudio.srcObject = evt.streams[0];
        if (DOM.volumeSlider) DOM.remoteAudio.volume = DOM.volumeSlider.value / 100;
      }
    });
  });

  session.on('accepted', () => {
    stopRingtone();
    DOM.activeCallName.textContent = caller;
    DOM.activeCallLocation.textContent = '📡 Via SIP';
    setCallView('active');
    startCallTimer();
    showToast(`Em ligação SIP com ${caller}`, 'success');
  });

  session.on('failed', (e) => {
    showToast(`Chamada SIP falhou: ${e.cause || 'Erro'}`, 'error');
    cleanupSIPCall();
  });

  session.on('ended', () => {
    showToast('Ligação SIP encerrada', 'info');
    cleanupSIPCall();
  });
}

function cleanupSIPCall() {
  sipSession = null;
  stopRingtone();
  state.currentCallTarget = null;
  state.currentCallName = null;
  state.isMuted = false;
  state.isOnHold = false;
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
}

// ═══ SIP Call Controls ═══
function sipHold() {
  if (sipSession) {
    if (state.isOnHold) sipSession.unhold();
    else sipSession.hold();
  }
}

function sipSendDTMF(tone) {
  if (sipSession) {
    sipSession.sendDTMF(tone, { duration: 100, interToneGap: 70 });
  }
}

function sipEndCall() {
  if (sipSession) {
    try { sipSession.terminate(); } catch (e) { console.warn('SIP terminate:', e); }
    cleanupSIPCall();
  }
}

function sipTransfer(targetNumber) {
  if (sipSession) {
    const config = loadSIPConfig();
    const domain = config.domain || '';
    try {
      sipSession.refer(`sip:${targetNumber}@${domain}`);
      showToast(`Transferindo para ${targetNumber}...`, 'info');
      cleanupSIPCall();
    } catch (e) {
      showToast('Erro ao transferir: ' + e.message, 'error');
    }
  }
}

function sipAnswerIncoming() {
  if (sipSession) {
    sipSession.answer({
      mediaConstraints: { audio: true, video: false },
      pcConfig: iceConfig
    });
  }
}

function sipRejectIncoming() {
  if (sipSession) {
    sipSession.terminate({ status_code: 603, reason_phrase: 'Decline' });
    cleanupSIPCall();
  }
}

// ═══ SIP STATUS UI ═══
function updateSIPStatus(status, text) {
  const badge = $('#sip-status-badge');
  if (badge) {
    badge.style.display = status === 'offline' ? 'none' : 'flex';
    const dot = badge.querySelector('.sip-badge-dot');
    const colors = { connecting: 'var(--warning)', registered: 'var(--success)', error: 'var(--danger)' };
    if (dot) dot.style.background = colors[status] || 'var(--gray-400)';
  }

  const info = $('#sip-status-info');
  if (info) {
    const icons = { offline: 'phone_disabled', connecting: 'sync', registered: 'check_circle', error: 'error' };
    const cls = { offline: '', connecting: 'sip-info-warn', registered: 'sip-info-ok', error: 'sip-info-err' };
    info.className = `sip-status-card ${cls[status] || ''}`;
    info.innerHTML = `<span class="material-icons-round">${icons[status] || 'info'}</span><span>${text}</span>`;
  }

  const connectBtn = $('#sip-connect-btn');
  const disconnectBtn = $('#sip-disconnect-btn');
  if (connectBtn) connectBtn.style.display = status === 'registered' ? 'none' : 'inline-flex';
  if (disconnectBtn) disconnectBtn.style.display = status === 'registered' ? 'inline-flex' : 'none';
}

// ═══ MODIFY EXISTING CONTROLS FOR SIP ═══

// Override Accept/Reject for SIP incoming
const origAcceptClick = DOM.acceptCallBtn.onclick;
DOM.acceptCallBtn.addEventListener('click', () => {
  if (state.currentCallTarget === 'sip-incoming') {
    stopRingtone();
    sipAnswerIncoming();
    return;
  }
  // WebRTC accept already handled by the existing listener
}, true); // capture phase to intercept first

DOM.rejectCallBtn.addEventListener('click', () => {
  if (state.currentCallTarget === 'sip-incoming') {
    stopRingtone();
    sipRejectIncoming();
    return;
  }
}, true);

// Override End Call for SIP
DOM.endCallBtn.addEventListener('click', () => {
  if (sipSession) { sipEndCall(); return; }
}, true);

DOM.cancelCallBtn.addEventListener('click', () => {
  if (sipSession) { sipEndCall(); return; }
}, true);

// Override Hold for SIP
if (DOM.holdBtn) {
  DOM.holdBtn.addEventListener('click', () => {
    if (sipSession) { sipHold(); }
  }, true);
}

// Modify dial pad to call via SIP when registered
const origDtmfCallBtn = $('#dtmf-call-btn');
if (origDtmfCallBtn) {
  origDtmfCallBtn.addEventListener('click', () => {
    if (sipRegistered && state.dtmfInput && !state.allUsers.find(u =>
      u.id !== socket.id && u.status === 'disponível' &&
      (u.username.toLowerCase().includes(state.dtmfInput.toLowerCase()))
    )) {
      // No matching online user — call via SIP
      sipCall(state.dtmfInput);
    }
  }, true);
}

// Send DTMF via SIP during SIP call
$$('.dtmf-key').forEach(key => {
  key.addEventListener('click', () => {
    if (sipSession) {
      sipSendDTMF(key.dataset.tone);
    }
  }, true);
});

// ═══════════════════════════════════════════
//  LEADS & CAMPANHAS
// ═══════════════════════════════════════════
const leadsState = {
  leads: JSON.parse(localStorage.getItem('softphone_leads') || '[]'),
  campaigns: JSON.parse(localStorage.getItem('softphone_campaigns') || '[]'),
  filter: 'all',
  searchQuery: '',
  campaignSearch: '',
  editingLeadId: null,
  editingCampaignId: null
};

function saveLeads() { localStorage.setItem('softphone_leads', JSON.stringify(leadsState.leads)); }
function saveCampaigns() { localStorage.setItem('softphone_campaigns', JSON.stringify(leadsState.campaigns)); }

// ── KPI Update ──
function updateLeadKPIs() {
  const l = leadsState.leads;
  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setVal('kpi-total', l.length);
  setVal('kpi-waiting', l.filter(x => x.status === 'waiting').length);
  setVal('kpi-b2c', l.filter(x => x.type === 'B2C').length);
  setVal('kpi-b2b', l.filter(x => x.type === 'B2B').length);
  setVal('kpi-converted', l.filter(x => x.status === 'converted').length);
  setVal('kpi-lost', l.filter(x => x.status === 'lost').length);
}

// ── Render Campaign List ──
function renderCampaigns() {
  const list = $('#campaign-list');
  const countEl = $('#campaign-count');
  if (!list) return;

  const q = leadsState.campaignSearch.toLowerCase();
  const filtered = leadsState.campaigns.filter(c => !q || c.name.toLowerCase().includes(q));
  if (countEl) countEl.textContent = leadsState.campaigns.length;

  if (filtered.length === 0) {
    list.innerHTML = '<li class="empty-state"><span class="material-icons-round">campaign</span><p>Nenhuma campanha</p></li>';
    return;
  }

  list.innerHTML = filtered.map(c => {
    const leadCount = leadsState.leads.filter(l => l.campaignId === c.id).length;
    const typeIcon = c.type === 'B2B' ? 'business' : c.type === 'B2C' ? 'person' : 'groups';
    return `<li class="campaign-item" data-campaign-id="${c.id}">
      <div class="campaign-icon ${c.type.toLowerCase()}"><span class="material-icons-round">${typeIcon}</span></div>
      <div class="campaign-info">
        <div class="campaign-name">${esc(c.name)}</div>
        <div class="campaign-meta">
          <span class="campaign-status-dot ${c.status}"></span>
          <span>${c.type}</span>
          <span>·</span>
          <span>${c.status === 'active' ? 'Ativa' : c.status === 'paused' ? 'Pausada' : 'Finalizada'}</span>
        </div>
      </div>
      <span class="campaign-leads-count">${leadCount} lead${leadCount !== 1 ? 's' : ''}</span>
    </li>`;
  }).join('');

  // Click to edit campaign
  list.querySelectorAll('.campaign-item').forEach(item => {
    item.addEventListener('click', () => {
      const c = leadsState.campaigns.find(x => x.id === item.dataset.campaignId);
      if (c) openCampaignModal(c);
    });
  });
}

// ── Render City List ──
function renderCityLeads() {
  const list = $('#city-lead-list');
  const countEl = $('#city-count');
  if (!list) return;

  const cityMap = {};
  leadsState.leads.forEach(l => {
    const city = l.city || 'Não informada';
    if (!cityMap[city]) cityMap[city] = { total: 0, waiting: 0 };
    cityMap[city].total++;
    if (l.status === 'waiting') cityMap[city].waiting++;
  });

  const cities = Object.entries(cityMap).sort((a, b) => b[1].total - a[1].total);
  if (countEl) countEl.textContent = cities.length;
  const maxTotal = cities.length ? Math.max(...cities.map(c => c[1].total)) : 1;

  if (cities.length === 0) {
    list.innerHTML = '<li class="empty-state"><span class="material-icons-round">map</span><p>Sem dados</p></li>';
    return;
  }

  list.innerHTML = cities.map(([name, data]) => {
    const pct = Math.round((data.total / maxTotal) * 100);
    return `<li class="city-item">
      <div class="city-icon"><span class="material-icons-round">location_on</span></div>
      <div class="city-info">
        <div class="city-name">${esc(name)}</div>
        <div class="city-counts"><span>${data.total} lead${data.total !== 1 ? 's' : ''}</span><span>·</span><span>${data.waiting} em espera</span></div>
      </div>
      <div class="city-bar-wrap"><div class="city-bar" style="width:${pct}%"></div></div>
    </li>`;
  }).join('');
}

// ── Render Lead Table ──
function renderLeadTable() {
  const tbody = $('#leads-tbody');
  if (!tbody) return;

  const q = leadsState.searchQuery.toLowerCase();
  let filtered = leadsState.leads;

  if (leadsState.filter !== 'all') {
    filtered = filtered.filter(l => l.status === leadsState.filter);
  }
  if (q) {
    filtered = filtered.filter(l =>
      (l.name || '').toLowerCase().includes(q) ||
      (l.company || '').toLowerCase().includes(q) ||
      (l.city || '').toLowerCase().includes(q) ||
      (l.phone || '').includes(q)
    );
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr class="leads-empty-row"><td colspan="7">
      <div class="empty-state"><span class="material-icons-round">person_search</span><p>Nenhum lead encontrado</p></div>
    </td></tr>`;
    return;
  }

  const statusLabels = { waiting: '⏳ Espera', contacted: '📞 Contactado', converted: '✅ Convertido', lost: '❌ Perdido' };

  tbody.innerHTML = filtered.map(l => {
    const campaign = leadsState.campaigns.find(c => c.id === l.campaignId);
    return `<tr data-lead-id="${l.id}">
      <td class="lead-name-cell">${esc(l.name || '—')}</td>
      <td><span class="lead-type-badge ${l.type.toLowerCase()}">${l.type}</span></td>
      <td>${esc(l.company || '—')}</td>
      <td>${esc(l.city || '—')}</td>
      <td>${campaign ? esc(campaign.name) : '—'}</td>
      <td><span class="lead-status-badge ${l.status}">${statusLabels[l.status] || l.status}</span></td>
      <td class="lead-actions">
        <button class="btn-ghost lead-call-btn" title="Ligar" data-phone="${esc(l.phone || '')}"><span class="material-icons-round">call</span></button>
        <button class="btn-ghost lead-edit-btn" title="Editar" data-id="${l.id}"><span class="material-icons-round">edit</span></button>
        <button class="btn-ghost text-danger lead-delete-btn" title="Excluir" data-id="${l.id}"><span class="material-icons-round">delete</span></button>
      </td>
    </tr>`;
  }).join('');

  // Event delegation for actions
  tbody.querySelectorAll('.lead-call-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const phone = btn.dataset.phone;
      if (phone) {
        if (sipRegistered) sipCall(phone);
        else { state.dtmfInput = phone; showToast(`Número ${phone} copiado para o discador`, 'info'); }
      }
    });
  });
  tbody.querySelectorAll('.lead-edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const lead = leadsState.leads.find(l => l.id === btn.dataset.id);
      if (lead) openLeadModal(lead);
    });
  });
  tbody.querySelectorAll('.lead-delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      leadsState.leads = leadsState.leads.filter(l => l.id !== btn.dataset.id);
      saveLeads();
      refreshLeadsUI();
      showToast('Lead excluído', 'info');
    });
  });
}

function refreshLeadsUI() {
  updateLeadKPIs();
  renderCampaigns();
  renderCityLeads();
  renderLeadTable();
}

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// ── Lead Modal ──
function openLeadModal(lead) {
  leadsState.editingLeadId = lead ? lead.id : null;
  const title = $('#lead-modal-title');
  if (title) title.textContent = lead ? 'Editar Lead' : 'Novo Lead';

  $('#lead-name').value = lead ? lead.name || '' : '';
  $('#lead-type').value = lead ? lead.type : 'B2C';
  $('#lead-company').value = lead ? lead.company || '' : '';
  $('#lead-phone').value = lead ? lead.phone || '' : '';
  $('#lead-email').value = lead ? lead.email || '' : '';
  $('#lead-city').value = lead ? lead.city || '' : '';
  $('#lead-obs').value = lead ? lead.obs || '' : '';
  $('#lead-status').value = lead ? lead.status : 'waiting';

  // Populate campaign dropdown
  const sel = $('#lead-campaign');
  if (sel) {
    sel.innerHTML = '<option value="">— Sem campanha —</option>' +
      leadsState.campaigns.map(c => `<option value="${c.id}" ${lead && lead.campaignId === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
  }

  $('#lead-modal').classList.remove('hidden');
}

$('#add-lead-btn')?.addEventListener('click', () => openLeadModal(null));
$('#close-lead-modal')?.addEventListener('click', () => $('#lead-modal').classList.add('hidden'));
$('#cancel-lead-modal')?.addEventListener('click', () => $('#lead-modal').classList.add('hidden'));

$('#save-lead-btn')?.addEventListener('click', () => {
  const name = $('#lead-name').value.trim();
  if (!name) { showToast('Informe o nome do lead', 'warning'); return; }

  const data = {
    id: leadsState.editingLeadId || Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name,
    type: $('#lead-type').value,
    company: $('#lead-company').value.trim(),
    phone: $('#lead-phone').value.trim(),
    email: $('#lead-email').value.trim(),
    city: $('#lead-city').value.trim(),
    campaignId: $('#lead-campaign').value || null,
    status: $('#lead-status').value,
    obs: $('#lead-obs').value.trim(),
    createdAt: leadsState.editingLeadId ? (leadsState.leads.find(l => l.id === leadsState.editingLeadId)?.createdAt || new Date().toISOString()) : new Date().toISOString()
  };

  if (leadsState.editingLeadId) {
    const idx = leadsState.leads.findIndex(l => l.id === leadsState.editingLeadId);
    if (idx >= 0) leadsState.leads[idx] = data;
  } else {
    leadsState.leads.push(data);
  }

  saveLeads();
  refreshLeadsUI();
  $('#lead-modal').classList.add('hidden');
  showToast(leadsState.editingLeadId ? 'Lead atualizado!' : 'Lead cadastrado!', 'success');
  leadsState.editingLeadId = null;
});

// ── Campaign Modal ──
function openCampaignModal(campaign) {
  leadsState.editingCampaignId = campaign ? campaign.id : null;
  const title = $('#campaign-modal-title');
  if (title) title.textContent = campaign ? 'Editar Campanha' : 'Nova Campanha';

  $('#campaign-name').value = campaign ? campaign.name || '' : '';
  $('#campaign-type').value = campaign ? campaign.type : 'B2C';
  $('#campaign-status').value = campaign ? campaign.status : 'active';
  $('#campaign-desc').value = campaign ? campaign.desc || '' : '';

  $('#campaign-modal').classList.remove('hidden');
}

$('#add-campaign-btn')?.addEventListener('click', () => openCampaignModal(null));
$('#close-campaign-modal')?.addEventListener('click', () => $('#campaign-modal').classList.add('hidden'));
$('#cancel-campaign-modal')?.addEventListener('click', () => $('#campaign-modal').classList.add('hidden'));

$('#save-campaign-btn')?.addEventListener('click', () => {
  const name = $('#campaign-name').value.trim();
  if (!name) { showToast('Informe o nome da campanha', 'warning'); return; }

  const data = {
    id: leadsState.editingCampaignId || Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name,
    type: $('#campaign-type').value,
    status: $('#campaign-status').value,
    desc: $('#campaign-desc').value.trim(),
    createdAt: leadsState.editingCampaignId ? (leadsState.campaigns.find(c => c.id === leadsState.editingCampaignId)?.createdAt || new Date().toISOString()) : new Date().toISOString()
  };

  if (leadsState.editingCampaignId) {
    const idx = leadsState.campaigns.findIndex(c => c.id === leadsState.editingCampaignId);
    if (idx >= 0) leadsState.campaigns[idx] = data;
  } else {
    leadsState.campaigns.push(data);
  }

  saveCampaigns();
  refreshLeadsUI();
  $('#campaign-modal').classList.add('hidden');
  showToast(leadsState.editingCampaignId ? 'Campanha atualizada!' : 'Campanha criada!', 'success');
  leadsState.editingCampaignId = null;
});

// ── Filters & Search ──
$$('[data-lead-filter]').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('[data-lead-filter]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    leadsState.filter = btn.dataset.leadFilter;
    renderLeadTable();
  });
});

$('#search-leads')?.addEventListener('input', (e) => {
  leadsState.searchQuery = e.target.value;
  renderLeadTable();
});

$('#search-campaigns')?.addEventListener('input', (e) => {
  leadsState.campaignSearch = e.target.value;
  renderCampaigns();
});

// ── Seed demo data if empty ──
if (leadsState.leads.length === 0 && leadsState.campaigns.length === 0) {
  leadsState.campaigns = [
    { id: 'c1', name: 'Black Friday 2026', type: 'B2C', status: 'active', desc: 'Promoção de final de ano', createdAt: new Date().toISOString() },
    { id: 'c2', name: 'Prospecção Enterprise', type: 'B2B', status: 'active', desc: 'Grandes empresas do sudeste', createdAt: new Date().toISOString() },
    { id: 'c3', name: 'Reativação Q1', type: 'mixed', status: 'paused', desc: 'Reativar clientes inativos', createdAt: new Date().toISOString() }
  ];
  leadsState.leads = [
    { id: 'l1', name: 'Maria Silva', type: 'B2C', company: '', phone: '(11) 99999-1234', email: 'maria@email.com', city: 'São Paulo, SP', campaignId: 'c1', status: 'waiting', obs: '', createdAt: new Date().toISOString() },
    { id: 'l2', name: 'João Santos', type: 'B2C', company: '', phone: '(21) 98888-5678', email: 'joao@email.com', city: 'Rio de Janeiro, RJ', campaignId: 'c1', status: 'contacted', obs: '', createdAt: new Date().toISOString() },
    { id: 'l3', name: 'Ana Costa', type: 'B2C', company: '', phone: '(31) 97777-4321', email: 'ana@email.com', city: 'Belo Horizonte, MG', campaignId: 'c1', status: 'waiting', obs: '', createdAt: new Date().toISOString() },
    { id: 'l4', name: 'Carlos Ferreira', type: 'B2B', company: 'Tech Solutions LTDA', phone: '(11) 3333-4567', email: 'carlos@techsol.com', city: 'São Paulo, SP', campaignId: 'c2', status: 'waiting', obs: 'CTO — decisor', createdAt: new Date().toISOString() },
    { id: 'l5', name: 'Fernanda Lima', type: 'B2B', company: 'Grupo Inovar S.A.', phone: '(41) 3030-9876', email: 'fernanda@inovar.com', city: 'Curitiba, PR', campaignId: 'c2', status: 'converted', obs: 'Contrato assinado', createdAt: new Date().toISOString() },
    { id: 'l6', name: 'Roberto Alves', type: 'B2C', company: '', phone: '(11) 96666-7777', email: 'roberto@email.com', city: 'São Paulo, SP', campaignId: 'c3', status: 'lost', obs: 'Sem interesse', createdAt: new Date().toISOString() },
    { id: 'l7', name: 'Patricia Gomes', type: 'B2B', company: 'DataCorp', phone: '(21) 2222-3333', email: 'patricia@datacorp.com', city: 'Rio de Janeiro, RJ', campaignId: 'c2', status: 'waiting', obs: '', createdAt: new Date().toISOString() },
    { id: 'l8', name: 'Lucas Martins', type: 'B2C', company: '', phone: '(85) 98765-4321', email: 'lucas@email.com', city: 'Fortaleza, CE', campaignId: 'c1', status: 'waiting', obs: '', createdAt: new Date().toISOString() },
    { id: 'l9', name: 'Beatriz Oliveira', type: 'B2C', company: '', phone: '(71) 99111-2222', email: 'bia@email.com', city: 'Salvador, BA', campaignId: null, status: 'contacted', obs: 'Retornar segunda', createdAt: new Date().toISOString() },
    { id: 'l10', name: 'Ricardo Souza', type: 'B2B', company: 'Infra Net Telecom', phone: '(62) 3344-5566', email: 'ricardo@infranet.com', city: 'Goiânia, GO', campaignId: 'c2', status: 'waiting', obs: 'Agendar reunião', createdAt: new Date().toISOString() }
  ];
  saveCampaigns();
  saveLeads();
}

// Initial render
refreshLeadsUI();

// ═══ INIT ═══
setupSocketEvents();

