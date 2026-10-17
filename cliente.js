/**
 * DMX CashBack — Controlador da Área do Cliente (UI Controller)
 * dmx-cashback-clientes/js/cliente.js
 * ──────────────────────────────────────────────────────────
 * Gerencia a navegação entre as telas do portal do consumidor,
 * extrato objetivo, aba dedicada exclusiva de QR Code e
 * integração com a camada de serviço REST.
 */

'use strict';

/* ── Estado da Interface do Cliente ───────────────────────── */
const clientState = {
  currentScreen: 'home',
  balanceVisible: true,
  profile: null,
  balances: null,
  extratoFilters: {
    type: 'all',
    period: 'all',
    query: ''
  },
  notifFilter: 'all',
  qrScanner: {
    activeStream: null,
    scanningTimer: null,
    detector: null,
    scannedData: null
  }
};

/* ── Inicialização ao Carregar o DOM ──────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Verificação de Sessão do Consumidor
  const sessionRaw = sessionStorage.getItem('dmx_client_session');
  if (!sessionRaw) {
    window.location.replace('login.html');
    return;
  }

  // 2. Recupera preferência de visibilidade do saldo
  const savedVis = localStorage.getItem('dmx_client_balance_visible');
  if (savedVis !== null) {
    clientState.balanceVisible = savedVis === 'true';
  }

  // 3. Carrega dados da camada de serviço com proteção contra falhas de rede
  try {
    if (typeof ClientApiService !== 'undefined') {
      await loadClientData();
    }
  } catch (err) {
    console.warn('DMX Client: Falha ao carregar dados remotos:', err);
  }

  // 4. Inicializa componentes e telas
  setupNavigation();
  setupGlobalListeners();
  initQrScanner();
  renderAllScreens();
});

/* ── Carga de Dados da Camada de API ──────────────────────── */
async function loadClientData() {
  const [profileRes, balancesRes] = await Promise.all([
    ClientApiService.getProfile(),
    ClientApiService.getBalances()
  ]);

  if (profileRes.success) clientState.profile = profileRes.data;
  if (balancesRes.success) clientState.balances = balancesRes.data;

  updateClientHeader();
}

/* ── Atualização do Cabeçalho e Avatar ────────────────────── */
function updateClientHeader() {
  const p = clientState.profile;
  if (!p) return;

  const nameEl = document.getElementById('clientUserName');
  const greetingEl = document.getElementById('clientGreeting');
  const avatarEl = document.getElementById('clientUserAvatar');

  const firstName = p.name.split(' ')[0] || 'Cliente';

  if (nameEl) nameEl.textContent = p.name;
  if (greetingEl) greetingEl.textContent = `Olá, ${firstName}!`;
  if (avatarEl) {
    const initials = p.name.trim().split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    avatarEl.textContent = initials || 'CL';
  }
}

/* ── Alternar Visibilidade do Saldo ───────────────────────── */
function toggleBalanceVisibility() {
  clientState.balanceVisible = !clientState.balanceVisible;
  localStorage.setItem('dmx_client_balance_visible', clientState.balanceVisible);
  renderHomeScreen();
  renderMeuCashbackScreen();
  renderMeuExtratoScreen();
}

/* ── Configuração de Navegação entre Telas ────────────────── */
function setupNavigation() {
  const tabs = document.querySelectorAll('[data-client-tab]');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const screenName = tab.getAttribute('data-client-tab');
      switchClientTab(screenName);
    });
  });
}

function switchClientTab(screenName) {
  // Se estiver saindo da tela de QR Code, encerra a câmera para poupar energia e privacidade
  if (clientState.currentScreen === 'qrcode' && screenName !== 'qrcode') {
    stopQrCamera();
  }

  clientState.currentScreen = screenName;

  // Alterna classes de visibilidade das telas
  document.querySelectorAll('.client-screen').forEach(el => el.classList.remove('active'));
  const targetScreen = document.getElementById(`clientScreen-${screenName}`);
  if (targetScreen) targetScreen.classList.add('active');

  // Atualiza abas ativas (desktop e mobile)
  document.querySelectorAll('[data-client-tab]').forEach(tab => {
    if (tab.getAttribute('data-client-tab') === screenName) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  // Renderiza dados sob demanda
  switch (screenName) {
    case 'home':
      renderHomeScreen();
      break;
    case 'cashback':
      renderMeuCashbackScreen();
      break;
    case 'extrato':
      renderMeuExtratoScreen();
      break;
    case 'qrcode':
      renderQrCodeScreen();
      break;
    case 'notificacoes':
      renderNotificacoesScreen();
      break;
    case 'perfil':
      renderPerfilScreen();
      break;
    case 'ajuda':
      renderAjudaScreen();
      break;
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderAllScreens() {
  renderHomeScreen();
  renderMeuCashbackScreen();
  renderMeuExtratoScreen();
  renderNotificacoesScreen();
  renderPerfilScreen();
  renderAjudaScreen();
}

/* ──────────────────────────────────────────────────────────
   3.1. TELA: INÍCIO (HOME / CARTEIRA)
   ────────────────────────────────────────────────────────── */
async function renderHomeScreen() {
  const b = clientState.balances;
  if (!b) return;

  const balanceAmountEl = document.getElementById('homeBalanceAmount');
  const expiringAmountEl = document.getElementById('homeExpiringAmount');
  const eyeIconEl = document.getElementById('homeEyeIcon');

  if (balanceAmountEl) {
    balanceAmountEl.textContent = clientState.balanceVisible 
      ? b.available.toFixed(2).replace('.', ',') 
      : '••••••';
  }

  if (expiringAmountEl) {
    expiringAmountEl.textContent = clientState.balanceVisible 
      ? `R$ ${b.expiring.toFixed(2).replace('.', ',')}` 
      : '••••••';
  }

  if (eyeIconEl) {
    eyeIconEl.innerHTML = clientState.balanceVisible
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
  }

  // Carrega transações recentes para a página inicial
  const txRes = await ClientApiService.getTransactions();
  const recentListEl = document.getElementById('homeRecentTxList');
  if (recentListEl) {
    if (!txRes.success || txRes.data.length === 0) {
      recentListEl.innerHTML = `
        <div style="text-align: center; padding: 32px 16px; background: white; border-radius: var(--radius-lg); border: 1px solid var(--color-border);">
          <div style="width: 44px; height: 44px; border-radius: 50%; background: var(--neutral-100); display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; color: var(--color-text-secondary);">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/><circle cx="12" cy="10" r="10"/></svg>
          </div>
          <p style="font-size: 14px; font-weight: 700; color: var(--color-text-primary); margin: 0 0 4px;">Nenhuma movimentação recente</p>
          <p style="font-size: 12px; color: var(--color-text-secondary); margin: 0;">Suas compras e movimentações de cashback aparecerão aqui.</p>
        </div>
      `;
    } else {
      const top3 = txRes.data.slice(0, 3);
      recentListEl.innerHTML = top3.map(t => createTxCardHTML(t)).join('');
    }
  }
}

/* ──────────────────────────────────────────────────────────
   3.2. TELA: MEU CASHBACK
   ────────────────────────────────────────────────────────── */
async function renderMeuCashbackScreen() {
  const b = clientState.balances;
  if (!b) return;

  const availEl = document.getElementById('cashbackAvailableMetric');
  const earnedEl = document.getElementById('cashbackEarnedMetric');
  const usedEl = document.getElementById('cashbackUsedMetric');
  const expEl = document.getElementById('cashbackExpiringMetric');

  if (availEl) availEl.textContent = clientState.balanceVisible ? `R$ ${b.available.toFixed(2).replace('.', ',')}` : '••••••';
  if (earnedEl) earnedEl.textContent = clientState.balanceVisible ? `R$ ${b.lifetimeEarned.toFixed(2).replace('.', ',')}` : '••••••';
  if (usedEl) usedEl.textContent = clientState.balanceVisible ? `R$ ${b.lifetimeUsed.toFixed(2).replace('.', ',')}` : '••••••';
  if (expEl) expEl.textContent = clientState.balanceVisible ? `R$ ${b.expiring.toFixed(2).replace('.', ',')}` : '••••••';
}

/* ──────────────────────────────────────────────────────────
   3.3. TELA: MEU EXTRATO
   ────────────────────────────────────────────────────────── */
async function renderMeuExtratoScreen() {
  const txRes = await ClientApiService.getTransactions(clientState.extratoFilters);
  const listEl = document.getElementById('extratoFullTxList');
  const countEl = document.getElementById('extratoItemsCount');

  if (!listEl) return;

  if (!txRes.success || txRes.data.length === 0) {
    listEl.innerHTML = `
      <div style="text-align: center; padding: 48px 20px; background: white; border-radius: var(--radius-lg); border: 1px solid var(--color-border);">
        <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--neutral-100); display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; color: var(--color-text-secondary);">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </div>
        <h4 style="font-size: 15px; font-weight: 700; color: var(--color-text-primary); margin-bottom: 4px;">Você ainda não possui movimentações de cashback</h4>
        <p style="font-size: 13px; color: var(--color-text-secondary); margin: 0 0 16px;">Quando realizar uma compra ou resgatar cashback, suas movimentações serão exibidas aqui.</p>
        <button type="button" class="btn btn--secondary btn--sm" onclick="resetExtratoFilters()">Atualizar Extrato</button>
      </div>
    `;
    if (countEl) countEl.textContent = '0 movimentações';
    return;
  }

  if (countEl) countEl.textContent = `${txRes.data.length} movimentação(ões)`;
  listEl.innerHTML = txRes.data.map(t => createTxCardHTML(t)).join('');
}

function resolveTxTypeLabel(t) {
  if (t.typeName) return t.typeName;

  const rawType = (t.type || '').toLowerCase();
  if (rawType === 'purchase' || t.purchaseValue > 0) return 'Compra';
  if (rawType === 'debit' || rawType === 'redemption' || t.cashbackValue < 0) return 'Resgate de cashback';
  if (rawType === 'credit') return 'Crédito de cashback';
  if (rawType === 'adjustment') return 'Ajuste';
  if (rawType === 'bonus') return 'Bônus';
  if (rawType === 'expired') return 'Expiração';

  return t.cashbackValue < 0 ? 'Resgate de cashback' : 'Crédito de cashback';
}

function createTxCardHTML(t) {
  const typeLabel = resolveTxTypeLabel(t);
  const isDebit = t.cashbackValue < 0 || typeLabel === 'Resgate de cashback' || typeLabel === 'Expiração';
  
  let iconClass = 'client-tx-icon--credit';
  let amountClass = 'client-tx-amount--credit';
  let iconSVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="16 12 12 8 8 12"/><line x1="12" y1="8" x2="12" y2="16"/><circle cx="12" cy="12" r="10"/></svg>`;

  if (isDebit) {
    iconClass = 'client-tx-icon--debit';
    amountClass = 'client-tx-amount--debit';
    iconSVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="8 12 12 16 16 12"/><line x1="12" y1="16" x2="12" y2="8"/><circle cx="12" cy="12" r="10"/></svg>`;
  }

  let typePillStyle = 'background: #E8F4EC; color: #245440; border: 1px solid #C2E2CB;';
  if (typeLabel === 'Compra') {
    typePillStyle = 'background: #E0F2FE; color: #0369A1; border: 1px solid #BAE6FD;';
  } else if (typeLabel === 'Resgate de cashback') {
    typePillStyle = 'background: #FDF3E5; color: #9A5B08; border: 1px solid #F6D6AA;';
  } else if (typeLabel === 'Expiração') {
    typePillStyle = 'background: #FEE2E2; color: #991B1B; border: 1px solid #FECACA;';
  } else if (typeLabel === 'Bônus' || typeLabel === 'Ajuste') {
    typePillStyle = 'background: #F3E8FF; color: #6B21A8; border: 1px solid #E9D5FF;';
  }

  const titleText = t.title || typeLabel;
  const displayAmount = clientState.balanceVisible ? t.amountFormatted : '••••••';
  const displaySub = clientState.balanceVisible 
    ? (t.subValueLabel || (t.purchaseValue > 0 ? `Valor da compra: R$ ${t.purchaseValue.toFixed(2).replace('.', ',')}` : ''))
    : '••••••';

  return `
    <div class="client-tx-card" onclick="openTxReceiptModal(${t.id})">
      <div class="client-tx-icon ${iconClass}">
        ${iconSVG}
      </div>
      <div class="client-tx-info">
        <div class="client-tx-title" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <span>${titleText}</span>
          <span style="font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 6px; ${typePillStyle}">${typeLabel}</span>
        </div>
        <div class="client-tx-meta">
          <span>${t.date} às ${t.time}</span>
          <span>•</span>
          <span style="font-family: monospace; font-weight: 600;">${t.doc || 'Identificador N/D'}</span>
          <span>•</span>
          <span class="badge badge--${t.statusClass || 'success'}">${t.status || 'Concluído'}</span>
        </div>
      </div>
      <div class="client-tx-values">
        <div class="client-tx-amount ${amountClass}">${displayAmount}</div>
        <div class="client-tx-purchase-val">${displaySub}</div>
      </div>
    </div>
  `;
}

/* ──────────────────────────────────────────────────────────
   3.4. TELA DEDICADA: QR CODE
   ────────────────────────────────────────────────────────── */
function renderQrCodeScreen() {
  // Inicializa o leitor na tela dedicada se o usuário ainda não ativou
  if (!clientState.qrScanner.activeStream) {
    updateTabCameraBadge(false, 'Câmera em Espera');
  }
}

function initQrScanner() {
  if ('BarcodeDetector' in window) {
    try {
      clientState.qrScanner.detector = new BarcodeDetector({ formats: ['qr_code'] });
    } catch (e) {
      clientState.qrScanner.detector = null;
    }
  }
}

async function startTabCamera() {
  updateTabCameraBadge(false, 'Iniciando câmera...');

  const permAlert = document.getElementById('tabQrPermissionAlert');
  if (permAlert) permAlert.style.display = 'none';

  const videoEl = document.getElementById('tabQrVideoFeed');

  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Navegador não suporta acesso à câmera.');
    }

    const constraints = {
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    clientState.qrScanner.activeStream = stream;

    if (videoEl) {
      videoEl.srcObject = stream;
      videoEl.setAttribute('playsinline', 'true');
      await videoEl.play();
    }

    updateTabCameraBadge(true, 'Câmera Ativa');
    startCodeDetectionLoop();

  } catch (err) {
    console.warn('Erro ao acessar câmera:', err);
    updateTabCameraBadge(false, 'Câmera Desativada');

    if (permAlert) {
      permAlert.style.display = 'flex';
      const isDenied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
      permAlert.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <div>
          <strong>${isDenied ? 'Acesso à câmera bloqueado' : 'Câmera indisponível no dispositivo'}:</strong>
          ${isDenied 
            ? 'Permita o acesso à câmera nas configurações do seu navegador ou digite o código do QR Code manualmente abaixo.' 
            : 'Utilize a digitação manual do código no formulário abaixo.'}
        </div>
      `;
    }
  }
}

function updateTabCameraBadge(isActive, text) {
  const badge = document.getElementById('tabCameraStatusBadge');
  if (!badge) return;

  if (isActive) {
    badge.className = 'camera-badge camera-badge--active';
    badge.innerHTML = `<span class="pulse-dot"></span> <span>${text}</span>`;
  } else {
    badge.className = 'camera-badge camera-badge--standby';
    badge.innerHTML = `<span>${text}</span>`;
  }
}

function startCodeDetectionLoop() {
  const videoEl = document.getElementById('tabQrVideoFeed');
  if (!videoEl) return;

  const detector = clientState.qrScanner.detector;

  const checkFrame = async () => {
    if (!clientState.qrScanner.activeStream) return;

    if (detector && videoEl.readyState === videoEl.HAVE_ENOUGH_DATA) {
      try {
        const barcodes = await detector.detect(videoEl);
        if (barcodes && barcodes.length > 0) {
          const rawVal = barcodes[0].rawValue;
          if (rawVal) {
            processScannedCode(rawVal);
            return;
          }
        }
      } catch (e) {}
    }

    clientState.qrScanner.scanningTimer = requestAnimationFrame(checkFrame);
  };

  clientState.qrScanner.scanningTimer = requestAnimationFrame(checkFrame);

  // Demonstração assistida: simula leitura de código após 4.5s caso não haja BarcodeDetector nativo
  if (!detector) {
    setTimeout(() => {
      if (clientState.qrScanner.activeStream && !clientState.qrScanner.scannedData && clientState.currentScreen === 'qrcode') {
        processScannedCode('DMX-QR-7782');
      }
    }, 4500);
  }
}

function stopQrCamera() {
  if (clientState.qrScanner.scanningTimer) {
    cancelAnimationFrame(clientState.qrScanner.scanningTimer);
    clientState.qrScanner.scanningTimer = null;
  }

  if (clientState.qrScanner.activeStream) {
    clientState.qrScanner.activeStream.getTracks().forEach(track => {
      track.stop();
    });
    clientState.qrScanner.activeStream = null;
  }

  const videoEl = document.getElementById('tabQrVideoFeed');
  if (videoEl) {
    videoEl.srcObject = null;
  }

  updateTabCameraBadge(false, 'Câmera em Espera');
}

function processScannedCode(codeString) {
  stopQrCamera();

  if (navigator.vibrate) {
    navigator.vibrate([40, 60, 40]);
  }

  const codeDisplay = document.getElementById('qrScannedCodeDisplay');
  const balanceDisplay = document.getElementById('qrScannedBalanceDisplay');

  const b = clientState.balances;
  const availText = b ? `R$ ${b.available.toFixed(2).replace('.', ',')}` : 'R$ 0,00';

  if (codeDisplay) codeDisplay.textContent = codeString;
  if (balanceDisplay) balanceDisplay.textContent = availText;

  openClientModal('modalQrConfirmation');
}

function handleTabManualCodeSubmit() {
  const input = document.getElementById('tabQrManualCodeInput');
  const val = input?.value.trim();

  if (!val) {
    showClientToast('Por favor, informe o código do QR Code.', 'warning');
    return;
  }

  processScannedCode(val);
  if (input) input.value = '';
}

function confirmQrRedemptionRequest() {
  closeClientModal('modalQrConfirmation');
  showClientToast('Operação validada via QR Code com sucesso.', 'success');
}

// Atalho para compatibilidade
function openQrScannerModal() {
  switchClientTab('qrcode');
  startTabCamera();
}

/* ──────────────────────────────────────────────────────────
   3.5. TELA: NOTIFICAÇÕES INTERNAS
   ────────────────────────────────────────────────────────── */
async function renderNotificacoesScreen() {
  const notifRes = await ClientApiService.getNotifications(clientState.notifFilter);
  const listEl = document.getElementById('notificacoesFullList');
  const badgeEl = document.getElementById('clientNotifBadge');

  if (!listEl) return;

  const unreadCount = (notifRes.data || []).filter(n => !n.read).length;
  if (badgeEl) {
    if (unreadCount > 0) {
      badgeEl.textContent = unreadCount;
      badgeEl.style.display = 'flex';
    } else {
      badgeEl.style.display = 'none';
    }
  }

  if (!notifRes.success || notifRes.data.length === 0) {
    listEl.innerHTML = `
      <div style="text-align: center; padding: 48px 20px; background: white; border-radius: var(--radius-lg); border: 1px solid var(--color-border);">
        <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--neutral-100); display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; color: var(--color-text-secondary);">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
        </div>
        <h4 style="font-size: 15px; font-weight: 700; color: var(--color-text-primary); margin-bottom: 4px;">Nenhuma notificação</h4>
        <p style="font-size: 13px; color: var(--color-text-secondary); margin: 0;">Você receberá avisos sobre novos créditos e confirmações aqui.</p>
      </div>
    `;
    return;
  }

  listEl.innerHTML = notifRes.data.map(n => `
    <div class="client-notif-item ${n.read ? '' : 'unread'}">
      <div style="width: 36px; height: 36px; border-radius: 50%; background: ${n.type === 'credit' ? '#E8F4EC' : '#EFF6FF'}; color: ${n.type === 'credit' ? '#2F7957' : '#2563EB'}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
      <div style="flex: 1;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
          <h5 style="font-size: 14px; font-weight: 700; color: var(--color-text-primary); margin: 0 0 2px;">${n.title}</h5>
          <span style="font-size: 11px; color: var(--color-text-secondary); white-space: nowrap;">${n.time}</span>
        </div>
        <p style="font-size: 12px; color: var(--color-text-secondary); margin: 0; line-height: 1.4;">${n.message}</p>
      </div>
    </div>
  `).join('');
}

/* ──────────────────────────────────────────────────────────
   3.6. TELA: MEUS DADOS (PERFIL DO CLIENTE)
   ────────────────────────────────────────────────────────── */
function renderPerfilScreen() {
  const p = clientState.profile;
  if (!p) return;

  const nameInput = document.getElementById('profileInputName');
  const emailInput = document.getElementById('profileInputEmail');
  const cpfInput = document.getElementById('profileInputCpf');
  const phoneInput = document.getElementById('profileInputPhone');

  if (nameInput) nameInput.value = p.name || '';
  if (emailInput) emailInput.value = p.email || '';
  if (cpfInput) cpfInput.value = p.cpf || '';
  if (phoneInput) phoneInput.value = p.phone || '';
}

function handleSaveProfile(e) {
  e.preventDefault();
  const nameInput = document.getElementById('profileInputName');
  const phoneInput = document.getElementById('profileInputPhone');

  if (clientState.profile) {
    if (nameInput) clientState.profile.name = nameInput.value.trim();
    if (phoneInput) clientState.profile.phone = phoneInput.value.trim();

    const sess = ClientApiService.getActiveSession();
    if (sess) {
      sess.name = clientState.profile.name;
      sess.phone = clientState.profile.phone;
      sessionStorage.setItem('dmx_client_session', JSON.stringify(sess));
    }
    updateClientHeader();
    showClientToast('Dados cadastrais salvos com sucesso.', 'success');
  }
}

/* ──────────────────────────────────────────────────────────
   3.7. TELA: AJUDA & DÚVIDAS FREQUENTES
   ────────────────────────────────────────────────────────── */
function renderAjudaScreen() {}

function toggleFaqItem(element) {
  element.classList.toggle('active');
}

/* ── Modal de Comprovante de Movimentação ─────────────────── */
function openTxReceiptModal(id) {
  const transactions = window.DMX_CLIENT_DATA?.transactions || [];
  const tx = transactions.find(t => t.id === id);
  if (!tx) return;

  const typeDisplay = resolveTxTypeLabel(tx);
  const isDebit = tx.cashbackValue < 0 || typeDisplay === 'Resgate de cashback' || typeDisplay === 'Expiração';

  const modalBody = document.getElementById('txDetailsModalBody');
  if (modalBody) {
    modalBody.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="width: 56px; height: 56px; border-radius: 50%; background: ${isDebit ? '#FEF3E2' : '#E8F4EC'}; color: ${isDebit ? '#D4831A' : '#2F7957'}; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px;">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
        </div>
        <h4 style="font-size: 22px; font-weight: 800; color: var(--color-text-primary); margin: 0 0 4px;">${tx.amountFormatted}</h4>
        <span class="badge badge--${tx.statusClass || 'success'}">${tx.status || 'Concluído'}</span>
      </div>

      <div style="background: var(--color-bg); border-radius: var(--radius-md); padding: 16px; display: flex; flex-direction: column; gap: 10px; font-size: 13px;">
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--neutral-200); padding-bottom: 8px;">
          <span style="color: var(--color-text-secondary);">Tipo da Operação</span>
          <span style="color: var(--color-text-primary); font-weight: 700;">${typeDisplay}</span>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--neutral-200); padding-bottom: 8px;">
          <span style="color: var(--color-text-secondary);">Data & Horário</span>
          <span style="color: var(--color-text-primary); font-weight: 600;">${tx.date} às ${tx.time}</span>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--neutral-200); padding-bottom: 8px;">
          <span style="color: var(--color-text-secondary);">Valor Total da Compra</span>
          <span style="color: var(--color-text-primary); font-weight: 700;">${tx.purchaseValue > 0 ? `R$ ${tx.purchaseValue.toFixed(2).replace('.', ',')}` : 'Não aplicável'}</span>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--neutral-200); padding-bottom: 8px;">
          <span style="color: var(--color-text-secondary);">Movimentação de Cashback</span>
          <span style="color: ${isDebit ? '#D4831A' : '#2F7957'}; font-weight: 800;">${tx.amountFormatted}</span>
        </div>
        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--neutral-200); padding-bottom: 8px;">
          <span style="color: var(--color-text-secondary);">Documento Fiscal</span>
          <span style="font-family: monospace; font-weight: 700;">${tx.doc || 'Identificador N/D'}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: var(--color-text-secondary);">Descrição</span>
          <span style="color: var(--color-text-primary); text-align: right; max-width: 220px;">${tx.title || tx.desc || typeDisplay}</span>
        </div>
      </div>

      <div style="margin-top: 14px; font-size: 11px; color: var(--color-text-secondary); text-align: center;">
        * O comprovante digital é encaminhado para o e-mail cadastrado do cliente.
      </div>
    `;
  }

  openClientModal('modalTxReceipt');
}

/* ── Modais Auxiliares ────────────────────────────────────── */
function openClientModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) m.classList.add('modal-backdrop--open');
}

function closeClientModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) m.classList.remove('modal-backdrop--open');
}

/* ── Logout da Área do Cliente ────────────────────────────── */
function handleClientLogout() {
  try {
    sessionStorage.removeItem('dmx_client_session');
  } catch (e) {}
  showClientToast('Sessão encerrada com sucesso. Redirecionando para o login...', 'info');
  setTimeout(() => {
    window.location.replace('login.html');
  }, 400);
}

/* ── Listeners Globais da Interface ───────────────────────── */
function setupGlobalListeners() {
  // Filtros de tipo de extrato
  document.querySelectorAll('[data-extrato-type]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-extrato-type]').forEach(b => {
        b.classList.remove('btn--primary');
        b.classList.add('btn--ghost');
      });
      btn.classList.remove('btn--ghost');
      btn.classList.add('btn--primary');

      clientState.extratoFilters.type = btn.getAttribute('data-extrato-type');
      renderMeuExtratoScreen();
    });
  });

  // Filtro de período do extrato
  const periodSelect = document.getElementById('extratoPeriodSelect');
  if (periodSelect) {
    periodSelect.addEventListener('change', (e) => {
      clientState.extratoFilters.period = e.target.value;
      renderMeuExtratoScreen();
    });
  }

  // Busca textual no extrato
  const searchInput = document.getElementById('extratoSearchInput');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        clientState.extratoFilters.query = e.target.value;
        renderMeuExtratoScreen();
      }, 250);
    });
  }

  // Filtros da central de notificações
  document.querySelectorAll('[data-notif-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-notif-filter]').forEach(b => {
        b.classList.remove('btn--primary');
        b.classList.add('btn--ghost');
      });
      btn.classList.remove('btn--ghost');
      btn.classList.add('btn--primary');

      clientState.notifFilter = btn.getAttribute('data-notif-filter');
      renderNotificacoesScreen();
    });
  });

  // Formulário do perfil
  const profileForm = document.getElementById('clientProfileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', handleSaveProfile);
  }

  // Fechamento de modais via botões com [data-modal-close]
  document.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-backdrop');
      if (modal) {
        modal.classList.remove('modal-backdrop--open');
      }
    });
  });

  // Fechamento de modais clicando no fundo escuro
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        backdrop.classList.remove('modal-backdrop--open');
      }
    });
  });
}

/* ── Resetar Filtros do Extrato ───────────────────────────── */
function resetExtratoFilters() {
  clientState.extratoFilters = {
    type: 'all',
    period: 'all',
    query: ''
  };

  document.querySelectorAll('[data-extrato-type]').forEach(b => {
    b.classList.remove('btn--primary');
    b.classList.add('btn--ghost');
    if (b.getAttribute('data-extrato-type') === 'all') {
      b.classList.remove('btn--ghost');
      b.classList.add('btn--primary');
    }
  });

  const periodSelect = document.getElementById('extratoPeriodSelect');
  const searchInput = document.getElementById('extratoSearchInput');

  if (periodSelect) periodSelect.value = 'all';
  if (searchInput) searchInput.value = '';

  renderMeuExtratoScreen();
}

/* ── Notificações Flutuantes (Toast) ──────────────────────── */
function showClientToast(message, type = 'info') {
  const container = document.getElementById('clientToastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `client-toast client-toast--${type}`;
  toast.innerHTML = `
    <span>${message}</span>
    <button type="button" onclick="this.parentElement.remove()" style="background: none; border: none; color: inherit; cursor: pointer; padding: 0 4px; font-size: 14px; opacity: 0.7;">✕</button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Exposição global de funções necessárias no escopo HTML
window.switchClientTab = switchClientTab;
window.toggleBalanceVisibility = toggleBalanceVisibility;
window.handleClientLogout = handleClientLogout;
window.startTabCamera = startTabCamera;
window.stopQrCamera = stopQrCamera;
window.handleTabManualCodeSubmit = handleTabManualCodeSubmit;
window.confirmQrRedemptionRequest = confirmQrRedemptionRequest;
window.openQrScannerModal = openQrScannerModal;
window.openTxReceiptModal = openTxReceiptModal;
window.closeClientModal = closeClientModal;
window.resetExtratoFilters = resetExtratoFilters;
window.showClientToast = showClientToast;
window.toggleFaqItem = toggleFaqItem;
