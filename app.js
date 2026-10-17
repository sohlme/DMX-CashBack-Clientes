/**
 * DMX CashBack — Prototype Navigation & Interactions (Etapa 2)
 * ─────────────────────────────────────────────────────────────
 * Refinamento visual, usabilidade simplificada, navegação por abas compactas,
 * central de notificações, autenticação com privacidade, novas telas de Gestão
 * (Boletos, Notas, Lotes), pesquisa em tempo real e modais funcionais.
 */

'use strict';

/* ── State ──────────────────────────────────────────── */
const state = {
  sidebarCollapsed: false,
  sidebarOpen: false, // mobile drawer
  activePage: 'dashboard',
  openMenus: new Set(['cashback', 'gestao', 'config-admin']), // expanded nav groups
  fabOpen: false,
  notifOpen: false,
  dmxAssistOpen: false,
  authenticated: false,
  selectedCompany: 'DMX CashBack',
  currentUser: null,
  selectedImportFile: null,
  currentCalDate: new Date(),
  selectedCalDay: new Date().getDate(),
  calEvents: [],
  paymentsList: [],
  isAdminMode: true,
  importStep: 1,
  activeEmailTemplate: 'credito',
  emailSettings: {
    senderEmail: '',
    senderName: 'DMX CashBack',
    adminEmail: '',
    provider: '',
    configured: false
  },
  dmxChatHistory: [
    {
      sender: 'bot',
      time: 'Agora',
      text: 'Olá! Sou a <strong>DMX Assist</strong>, sua assistente inteligente no <strong>DMX CashBack</strong>.<br>Posso te ajudar a navegar no sistema, esclarecer regras de crédito e entender os fluxos operacionais. O que você gostaria de consultar agora?',
      suggestions: [
        'Como importar planilha?',
        'Como cadastrar cliente?',
        'Como consultar notas e boletos?',
        'Qual a regra de validade do cashback?',
        'Como configurar e-mails automáticos?'
      ]
    }
  ],
  notifications: [],
  records: []
};

/* ── Page Map ────────────────────────────────────────── */
const pages = {
  dashboard:           { label: 'Início',                   section: null,           icon: 'home' },
  clientes:            { label: 'Clientes',                 section: 'cashback',     icon: 'users' },
  lancamentos:         { label: 'Lançamentos de cashback',  section: 'cashback',     icon: 'trending-up' },
  importar:            { label: 'Importar planilha',        section: 'cashback',     icon: 'upload' },
  boletos:             { label: 'Boletos',                  section: 'gestao',       icon: 'file-text' },
  notas:               { label: 'Notas',                    section: 'gestao',       icon: 'receipt' },
  lotes:               { label: 'Lotes',                    section: 'gestao',       icon: 'layers' },
  'consulta-registros':{ label: 'Consulta de Registros',    section: 'gestao',       icon: 'search' },
  empresas:            { label: 'Empresas',                 section: 'config-admin', icon: 'building' },
  usuarios:            { label: 'Usuários',                 section: 'config-admin', icon: 'user-cog' },
  comunicacao:         { label: 'Comunicação e E-mails',    section: 'config-admin', icon: 'mail' },
};

/* ── DOM Helpers ─────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const el = (tag, cls, html = '') => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
};

/* ── Icons (inline SVG) ─────────────────────────────── */
const icons = {
  home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>`,
  'trending-up': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
  upload: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>`,
  'file-text': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  receipt: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="12" y2="16"/></svg>`,
  layers: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,
  building: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>`,
  'user-cog': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3-3a1 1 0 000-1.4l-1.6-1.6a1 1 0 00-1.4 0l-3 3z"/><path d="M20.26 12.3a7.78 7.78 0 01-1.54 4.47l-1.18-1.18"/><path d="M9 12A3 3 0 109 6a3 3 0 000 6z"/><path d="M5 20a7 7 0 0110.9-5.8"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`,
  bell: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>`,
  'log-out': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  eye: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  'eye-off': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  x: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  'chevron-right': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>`,
  'chevron-down': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>`,
  refresh: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>`,
  briefcase: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
};

function icon(name, size = 18) {
  const svg = icons[name] || icons.x;
  return svg.replace('<svg', `<svg width="${size}" height="${size}"`);
}

/* ── Sidebar ─────────────────────────────────────────── */
function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('topbarToggle');
  const overlay = document.getElementById('sidebarOverlay');
  const isMobile = () => window.innerWidth < 1024;

  toggleBtn?.addEventListener('click', () => {
    if (isMobile()) {
      state.sidebarOpen = !state.sidebarOpen;
      sidebar.classList.toggle('sidebar--open', state.sidebarOpen);
      overlay.classList.toggle('active', state.sidebarOpen);
    } else {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      sidebar.classList.toggle('sidebar--collapsed', state.sidebarCollapsed);
      document.querySelector('.main-content')?.classList.toggle('main-content--expanded', state.sidebarCollapsed);
    }
  });

  overlay?.addEventListener('click', () => {
    state.sidebarOpen = false;
    sidebar.classList.remove('sidebar--open');
    overlay.classList.remove('active');
  });
}

/* ── Nav Menu ────────────────────────────────────────── */
function initNavigation() {
  // Group toggles
  $$('[data-nav-group]').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.dataset.navGroup;
      const submenu = document.getElementById(`submenu-${group}`);
      const isOpen = state.openMenus.has(group);
      if (isOpen) {
        state.openMenus.delete(group);
        submenu?.classList.remove('nav-submenu--open');
        btn.classList.remove('nav-item--open');
      } else {
        state.openMenus.add(group);
        submenu?.classList.add('nav-submenu--open');
        btn.classList.add('nav-item--open');
      }
    });
    // Initialize open state
    const group = btn.dataset.navGroup;
    if (state.openMenus.has(group)) {
      btn.classList.add('nav-item--open');
      document.getElementById(`submenu-${group}`)?.classList.add('nav-submenu--open');
    }
  });

  // Nav items (submenus)
  $$('[data-nav-page]').forEach(item => {
    item.addEventListener('click', () => {
      navigateTo(item.dataset.navPage);
      // Close mobile sidebar
      if (window.innerWidth < 1024) {
        document.getElementById('sidebar')?.classList.remove('sidebar--open');
        document.getElementById('sidebarOverlay')?.classList.remove('active');
        state.sidebarOpen = false;
      }
    });
  });
}

/* ── Navigation ─────────────────────────────────────── */
function navigateTo(pageId) {
  if (!pages[pageId]) return;

  const page = pages[pageId];
  state.activePage = pageId;

  // Show/hide screens
  $$('.screen').forEach(s => s.classList.remove('screen--active'));
  document.getElementById(`screen-${pageId}`)?.classList.add('screen--active');

  // Update nav active state
  $$('[data-nav-page]').forEach(item => {
    item.classList.toggle('nav-subitem--active', item.dataset.navPage === pageId);
  });

  // Standalone items like dashboard
  $$('.nav-item--standalone').forEach(item => {
    const isHome = pageId === 'dashboard';
    item.classList.toggle('nav-item--active', isHome);
  });

  // Atualiza indicação de rota compacta na Topbar
  const topbarCurrent = document.getElementById('topbarCurrentPage');
  if (topbarCurrent) {
    topbarCurrent.textContent = page.label;
  }

  // Verificação de permissão para telas administrativas (ex: Comunicação e E-mails)
  if (pageId === 'comunicacao') {
    const deniedBox = document.getElementById('comunicacaoAccessDenied');
    const mainView = document.getElementById('comunicacaoMainView');
    if (!state.isAdminMode) {
      if (deniedBox) deniedBox.style.display = 'block';
      if (mainView) mainView.style.display = 'none';
      showToast('Acesso restrito: configuração institucional exclusiva para Administrador.', 'warning');
    } else {
      if (deniedBox) deniedBox.style.display = 'none';
      if (mainView) mainView.style.display = 'block';
    }
  }

  // Scroll suave ao topo da página
  document.querySelector('.page-wrapper')?.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ── Central de Notificações ─────────────────────────── */
function initNotifications() {
  const notifBtn = document.getElementById('topbarNotifBtn');
  const panel = document.getElementById('notificationsPanel');
  const badge = document.getElementById('notifBadge');
  const markAllBtn = document.getElementById('notifMarkAllBtn');
  const listEl = document.getElementById('notifList');

  const updateBadge = () => {
    const unreadCount = state.notifications.filter(n => n.unread).length;
    if (badge) {
      badge.textContent = unreadCount;
      badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
    const panelCount = document.getElementById('notifPanelCount');
    if (panelCount) {
      panelCount.textContent = `${unreadCount} não lida(s)`;
    }
  };

  const renderNotifications = (filterCategory = 'all') => {
    if (!listEl) return;
    let filtered = state.notifications;
    if (filterCategory === 'unread') {
      filtered = state.notifications.filter(n => n.unread);
    } else if (filterCategory !== 'all') {
      filtered = state.notifications.filter(n => n.category === filterCategory);
    }

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div class="notif-empty" style="padding: 32px 16px; text-align: center;">
          <div class="notif-empty-icon" style="width: 44px; height: 44px; border-radius: 50%; background: #E8F4EC; color: #348563; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px;">
            ${icon('check', 20)}
          </div>
          <p style="font-weight:700; font-size:13px; color: var(--color-text-primary);">Nenhuma notificação</p>
          <p style="font-size:12px; color:var(--color-text-secondary); margin-top: 2px;">Não há avisos nesta categoria.</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = filtered.map(n => {
      let iconName = 'bell';
      if (n.category === 'financial') iconName = 'file-text';
      if (n.category === 'cashback') iconName = 'trending-up';
      if (n.category === 'import') iconName = 'upload';
      if (n.category === 'system') iconName = 'settings';

      return `
        <div class="notif-item notif-item--${n.type || 'info'} ${n.unread ? 'notif-item--unread' : ''}" data-notif-id="${n.id}" data-page="${n.page}">
          <div class="notif-icon-wrap">
            ${icon(iconName, 16)}
          </div>
          <div class="notif-content">
            <div class="notif-header-line">
              <span class="notif-title">${n.title}</span>
              <span class="notif-time">${n.time}</span>
            </div>
            <p class="notif-desc">${n.desc}</p>
            ${n.unread ? `
              <div class="notif-actions">
                <button type="button" class="notif-mark-single-btn" data-action="mark-read" data-id="${n.id}">
                  ${icon('check', 12)} Marcar como lida
                </button>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    // Marcar individual como lida
    $$('[data-action="mark-read"]', listEl).forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = Number(btn.dataset.id);
        const notif = state.notifications.find(n => n.id === id);
        if (notif) notif.unread = false;
        updateBadge();
        const activeTab = document.querySelector('.notif-tab--active')?.dataset.category || 'all';
        renderNotifications(activeTab);
        showToast('Notificação marcada como lida.', 'info');
      });
    });

    // Clique no item da notificação navega para a tela vinculada
    $$('.notif-item', listEl).forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('[data-action="mark-read"]')) return;
        const id = Number(item.dataset.notifId);
        const notif = state.notifications.find(n => n.id === id);
        if (notif) notif.unread = false;
        updateBadge();
        panel?.classList.remove('notifications-panel--open');
        state.notifOpen = false;
        if (item.dataset.page) {
          navigateTo(item.dataset.page);
        }
      });
    });
  };

  notifBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    state.notifOpen = !state.notifOpen;
    panel?.classList.toggle('notifications-panel--open', state.notifOpen);
    if (state.notifOpen) renderNotifications();
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#notificationsPanel') && !e.target.closest('#topbarNotifBtn')) {
      panel?.classList.remove('notifications-panel--open');
      state.notifOpen = false;
    }
  });

  markAllBtn?.addEventListener('click', () => {
    state.notifications.forEach(n => n.unread = false);
    updateBadge();
    const activeTab = document.querySelector('.notif-tab--active')?.dataset.category || 'all';
    renderNotifications(activeTab);
    showToast('Todas as notificações foram marcadas como lidas.', 'info');
  });

  // Abas de filtro da central de notificações
  $$('.notif-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.notif-tab').forEach(t => t.classList.remove('notif-tab--active'));
      tab.classList.add('notif-tab--active');
      renderNotifications(tab.dataset.category);
    });
  });

  updateBadge();
}

/* ── Banco de Contas e Isolamento Multiusuário ─────────── */
function getAccountsDB() {
  const defaultAccounts = {
    // Cenário C: Administrador Geral com múltiplas empresas vinculadas
    'admin@empresa.com.br': {
      name: 'Administrador DMX',
      email: 'admin@empresa.com.br',
      role: 'admin',
      canCreateCompany: true,
      companies: ['DMX Matriz', 'DMX Filial Shopping']
    },
    // Cenário B: Gestor com exatamente 1 empresa vinculada
    'gestor@calcados.com': {
      name: 'Gestor Calçados Silva',
      email: 'gestor@calcados.com',
      role: 'business',
      canCreateCompany: true,
      companies: ['Calçados Silva']
    },
    // Cenário A: Novo gestor com 0 empresas e permissão para cadastrar
    'novo@empresa.com': {
      name: 'Carlos Oliveira',
      email: 'novo@empresa.com',
      role: 'business',
      canCreateCompany: true,
      companies: []
    },
    // Cenário D: Operador com 0 empresas e SEM permissão para criar
    'operador@empresa.com': {
      name: 'Mariana Santos',
      email: 'operador@empresa.com',
      role: 'operator',
      canCreateCompany: false,
      companies: []
    },
    // Consumidor / Cliente (Redirecionamento automático para Área do Cliente)
    'cliente@email.com': {
      name: 'Lucas Ferreira',
      email: 'cliente@email.com',
      role: 'client',
      canCreateCompany: false,
      companies: []
    }
  };

  const stored = localStorage.getItem('dmx_accounts_db');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      Object.keys(defaultAccounts).forEach(k => {
        if (!parsed[k]) {
          parsed[k] = defaultAccounts[k];
        }
      });
      return parsed;
    } catch (e) {
      console.warn('Erro ao carregar banco de contas local:', e);
    }
  }

  localStorage.setItem('dmx_accounts_db', JSON.stringify(defaultAccounts));
  return defaultAccounts;
}

function saveAccountsDB(db) {
  localStorage.setItem('dmx_accounts_db', JSON.stringify(db));
}

function updateCompanyAndUserDisplay() {
  const compDisplay = document.getElementById('companyNameDisplay');
  const userDisplay = document.getElementById('sidebarUserName');
  const avatarDisplay = document.getElementById('sidebarAvatarDisplay');

  if (compDisplay) {
    const compText = state.selectedCompany || 'Selecione a empresa';
    compDisplay.innerHTML = `${compText} <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-left: 2px; vertical-align: middle;"><path d="M6 9l6 6 6-6"/></svg>`;
  }

  if (userDisplay) {
    userDisplay.textContent = state.currentUser?.name || (state.isAdminMode ? 'Administrador' : 'Usuário');
  }

  if (avatarDisplay) {
    const userName = state.currentUser?.name || (state.isAdminMode ? 'Administrador' : 'Usuário');
    const initials = userName.trim().split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    avatarDisplay.innerHTML = `<span style="font-weight:700; font-size:12px;">${initials || 'AD'}</span>`;
  }
}

/* ── Login Unificado, Cadastro e Autenticação por Perfil ─── */
function initAuth() {
  const authOverlay = document.getElementById('authOverlay');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const forgotForm = document.getElementById('forgotForm');
  const pwToggleBtn = document.getElementById('togglePasswordBtn');
  const pwInput = document.getElementById('loginPassword');
  const rememberCheckbox = document.getElementById('rememberAccount');
  const savedAccountBox = document.getElementById('savedAccountBox');
  const removeSavedBtn = document.getElementById('removeSavedAccount');
  const useAnotherBtn = document.getElementById('useAnotherAccount');

  // 1. Verificar sessão ativa no sessionStorage (fecha com a aba/janela)
  const sessionRaw = sessionStorage.getItem('dmx_admin_session');
  if (sessionRaw) {
    try {
      const session = JSON.parse(sessionRaw);
      if (session && session.authenticated && session.user) {
        state.authenticated = true;
        state.currentUser = session.user;
        state.selectedCompany = session.user.companies?.[0] || 'DMX CashBack';
        state.isAdminMode = session.user.role === 'admin';
        document.body.classList.toggle('role--admin', state.isAdminMode);
        if (authOverlay) authOverlay.style.display = 'none';
      }
    } catch (e) {
      sessionStorage.removeItem('dmx_admin_session');
    }
  }

  // Se não autenticado, garantir exibição da tela de login unificada
  if (!state.authenticated && authOverlay) {
    authOverlay.style.display = 'flex';
  }

  // 2. Verificar conta lembrada neste dispositivo (apenas e-mail)
  const saved = localStorage.getItem('dmx_saved_account');
  if (saved && savedAccountBox) {
    try {
      const data = JSON.parse(saved);
      if (data.email) {
        savedAccountBox.style.display = 'flex';
        document.getElementById('savedNameDisplay').textContent = data.name || data.email;
        document.getElementById('savedEmailDisplay').textContent = data.email;
        const emailInput = document.getElementById('loginEmail');
        if (emailInput) emailInput.value = data.email;
        if (rememberCheckbox) rememberCheckbox.checked = true;
      }
    } catch (e) {
      localStorage.removeItem('dmx_saved_account');
    }
  }

  updateCompanyAndUserDisplay();

  // Toggle senha visível
  pwToggleBtn?.addEventListener('click', () => {
    const isPassword = pwInput.type === 'password';
    pwInput.type = isPassword ? 'text' : 'password';
    pwToggleBtn.innerHTML = isPassword ? icon('eye-off', 16) : icon('eye', 16);
  });

  removeSavedBtn?.addEventListener('click', () => {
    localStorage.removeItem('dmx_saved_account');
    savedAccountBox.style.display = 'none';
    document.getElementById('loginEmail').value = '';
    showToast('Conta removida do histórico deste dispositivo.', 'info');
  });

  useAnotherBtn?.addEventListener('click', () => {
    savedAccountBox.style.display = 'none';
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginEmail').focus();
  });

  // Login Submit com Roteamento Automático por Perfil (Admin vs Cliente vs Empresa)
  loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const pw = pwInput.value.trim();

    if (!email || !pw) {
      showToast('Por favor, informe seu e-mail e senha.', 'error');
      return;
    }

    const submitBtn = document.getElementById('loginSubmitBtn');
    submitBtn.innerHTML = `<span class="spinner spinner--sm"></span> Entrando...`;
    submitBtn.disabled = true;

    setTimeout(() => {
      submitBtn.innerHTML = 'Entrar';
      submitBtn.disabled = false;

      const currentDb = getAccountsDB();
      let userAccount = currentDb[email];

      // Se a conta não existia no banco, classifica o perfil por convenção inteligente
      if (!userAccount) {
        const inferredName = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        let inferredRole = 'business';
        let inferredCanCreate = true;

        if (email.includes('admin')) {
          inferredRole = 'admin';
          inferredCanCreate = true;
        } else if (email.includes('cliente') || email.includes('consumidor')) {
          inferredRole = 'client';
          inferredCanCreate = false;
        } else if (email.includes('operador') || email.includes('oper')) {
          inferredRole = 'operator';
          inferredCanCreate = false;
        }

        userAccount = {
          name: inferredName || 'Novo Usuário',
          email: email,
          role: inferredRole,
          canCreateCompany: inferredCanCreate,
          companies: []
        };
        currentDb[email] = userAccount;
        saveAccountsDB(currentDb);
      }

      // Lembrar e-mail com segurança (sem armazenar senha!)
      if (rememberCheckbox?.checked) {
        localStorage.setItem('dmx_saved_account', JSON.stringify({
          name: userAccount.name,
          email: userAccount.email
        }));
      }

      // ── CASO 1: CLIENTE / CONSUMIDOR ─────────────────────────
      if (userAccount.role === 'client') {
        const clientSession = {
          name: userAccount.name,
          email: userAccount.email,
          authenticated: true,
          loginTime: new Date().toISOString(),
          role: 'client'
        };
        sessionStorage.setItem('dmx_client_session', JSON.stringify(clientSession));
        showToast('Identificado como Consumidor. Acessando sua Área do Cliente...', 'success');
        setTimeout(() => {
          window.location.href = './dmx-cashback-clientes/';
        }, 500);
        return;
      }

      // ── CASO 2: ADMINISTRADOR / GESTOR / OPERADOR ─────────────
      state.authenticated = true;
      state.currentUser = userAccount;
      state.isAdminMode = userAccount.role === 'admin';
      document.body.classList.toggle('role--admin', state.isAdminMode);

      sessionStorage.setItem('dmx_admin_session', JSON.stringify({
        authenticated: true,
        user: userAccount,
        timestamp: Date.now()
      }));

      // AVALIAÇÃO DOS CENÁRIOS DE EMPRESA (A, B, C, D)
      const companies = userAccount.companies || [];

      if (companies.length === 0) {
        if (userAccount.canCreateCompany !== false) {
          // Cenário A: 0 empresas vinculadas e permissão para cadastrar
          authOverlay.style.display = 'none';
          openModal('modalFirstCompany');
          showToast(`Bem-vindo(a), ${userAccount.name}! Cadastre sua primeira empresa para começar.`, 'info');
        } else {
          // Cenário D: 0 empresas vinculadas e SEM permissão para criar
          authOverlay.style.display = 'none';
          openModal('modalNoCompanyAccess');
          showToast('Sua conta não possui empresas vinculadas.', 'warning');
        }
      } else if (companies.length === 1) {
        // Cenário B: exatamente 1 empresa autorizada -> entra direto
        state.selectedCompany = companies[0];
        updateCompanyAndUserDisplay();
        authOverlay.style.display = 'none';
        showToast(`Bem-vindo(a) à ${state.selectedCompany}!`, 'success');
      } else {
        // Cenário C: múltiplas empresas autorizadas -> exibe seletor de empresas
        authOverlay.style.display = 'none';
        renderUserCompanyList(companies);
        openCompanySelector();
      }
    }, 500);
  });

  // Alternar para Cadastro
  document.getElementById('linkGoToRegister')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('authLoginView').style.display = 'none';
    document.getElementById('authRegisterView').style.display = 'flex';
  });

  // Voltar do Cadastro para Login
  document.getElementById('linkBackToLoginFromReg')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('authRegisterView').style.display = 'none';
    document.getElementById('authLoginView').style.display = 'flex';
  });

  // Alternar para Esqueci Senha
  document.getElementById('linkGoToForgot')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('authLoginView').style.display = 'none';
    document.getElementById('authForgotView').style.display = 'flex';
  });

  // Voltar de Esqueci Senha para Login
  document.getElementById('linkBackToLoginFromForgot')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('authForgotView').style.display = 'none';
    document.getElementById('authLoginView').style.display = 'flex';
  });

  // Submit Cadastro Unificado
  registerForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const accountType = document.getElementById('regAccountType')?.value || 'business';
    const name = document.getElementById('regName')?.value.trim();
    const email = document.getElementById('regEmail')?.value.trim().toLowerCase();
    const pw = document.getElementById('regPassword')?.value;
    const pwConf = document.getElementById('regPasswordConfirm')?.value;
    const initialCompany = document.getElementById('regCompany')?.value.trim();

    if (!name || !email || !pw) {
      showToast('Por favor, preencha os campos obrigatórios (*).', 'error');
      return;
    }

    if (pw !== pwConf) {
      showToast('As senhas digitadas não coincidem. Verifique e tente novamente.', 'error');
      return;
    }

    const regBtn = document.getElementById('regSubmitBtn');
    regBtn.innerHTML = `<span class="spinner spinner--sm"></span> Cadastrando...`;
    regBtn.disabled = true;

    setTimeout(() => {
      regBtn.innerHTML = 'Cadastrar conta';
      regBtn.disabled = false;

      const currentDb = getAccountsDB();

      if (accountType === 'client') {
        const clientAccount = {
          name: name,
          email: email,
          role: 'client',
          canCreateCompany: false,
          companies: []
        };
        currentDb[email] = clientAccount;
        saveAccountsDB(currentDb);

        const clientSession = {
          name: name,
          email: email,
          authenticated: true,
          loginTime: new Date().toISOString(),
          role: 'client'
        };
        sessionStorage.setItem('dmx_client_session', JSON.stringify(clientSession));

        registerForm.reset();
        document.getElementById('authRegisterView').style.display = 'none';
        document.getElementById('authLoginView').style.display = 'flex';
        authOverlay.style.display = 'none';

        showToast('Conta de consumidor criada com sucesso! Acessando sua Área do Cliente...', 'success');
        setTimeout(() => {
          window.location.href = './dmx-cashback-clientes/';
        }, 500);
        return;
      }

      // Conta empresarial / gestor
      const newAccount = {
        name: name,
        email: email,
        role: 'business',
        canCreateCompany: true,
        companies: initialCompany ? [initialCompany] : []
      };

      currentDb[email] = newAccount;
      saveAccountsDB(currentDb);
      state.authenticated = true;
      state.currentUser = newAccount;
      state.isAdminMode = false;
      document.body.classList.toggle('role--admin', false);

      sessionStorage.setItem('dmx_admin_session', JSON.stringify({
        authenticated: true,
        user: newAccount,
        timestamp: Date.now()
      }));

      registerForm.reset();
      document.getElementById('authRegisterView').style.display = 'none';
      document.getElementById('authLoginView').style.display = 'flex';
      authOverlay.style.display = 'none';

      updateCompanyAndUserDisplay();

      if (newAccount.companies.length === 0) {
        openModal('modalFirstCompany');
        showToast(`Conta criada com sucesso! Cadastre sua primeira empresa para continuar.`, 'success');
      } else {
        state.selectedCompany = newAccount.companies[0];
        updateCompanyAndUserDisplay();
        showToast(`Conta criada e vinculada a ${state.selectedCompany}!`, 'success');
      }
    }, 500);
  });

  // Submit Cadastro da Primeira Empresa (Cenário A - Onboarding)
  document.getElementById('formFirstCompany')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const tradingName = document.getElementById('firstCompanyTradingName')?.value.trim();
    const legalName = document.getElementById('firstCompanyLegalName')?.value.trim();
    const cnpj = document.getElementById('firstCompanyCnpj')?.value.trim();
    const segment = document.getElementById('firstCompanySegment')?.value;
    const email = document.getElementById('firstCompanyEmail')?.value.trim();
    const phone = document.getElementById('firstCompanyPhone')?.value.trim();

    if (!tradingName || !legalName || !cnpj || !segment || !email) {
      showToast('Por favor, preencha todos os campos obrigatórios (*).', 'error');
      return;
    }

    if (!state.currentUser.companies) {
      state.currentUser.companies = [];
    }

    if (!state.currentUser.companies.includes(tradingName)) {
      state.currentUser.companies.push(tradingName);
      const currentDb = getAccountsDB();
      if (currentDb[state.currentUser.email]) {
        currentDb[state.currentUser.email].companies = state.currentUser.companies;
        saveAccountsDB(currentDb);
      }
    }

    state.selectedCompany = tradingName;
    updateCompanyAndUserDisplay();
    closeModal('modalFirstCompany');
    document.getElementById('formFirstCompany').reset();

    showToast(`Empresa "${tradingName}" cadastrada com sucesso! Bem-vindo(a) ao DMX CashBack.`, 'success');
  });

  // Alternar empresa ao clicar no nome da empresa no topo (Cenário C)
  const compDisplayBtn = document.getElementById('companyNameDisplay');
  compDisplayBtn?.addEventListener('click', () => {
    if (!state.currentUser) return;
    const comps = state.currentUser.companies || [];
    if (comps.length > 1) {
      renderUserCompanyList(comps);
      openCompanySelector();
    } else if (comps.length === 1) {
      showToast(`Unidade atual: ${state.selectedCompany || comps[0]}. Solicite vinculação para gerenciar outras lojas.`, 'info');
    } else if (state.currentUser.canCreateCompany !== false) {
      openModal('modalFirstCompany');
    } else {
      openModal('modalNoCompanyAccess');
    }
  });

  // Máscaras para CNPJ e Telefone no formulário da primeira empresa
  const cnpjInput = document.getElementById('firstCompanyCnpj');
  cnpjInput?.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '').substring(0, 14);
    if (v.length > 12) {
      v = v.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{1,2})$/, '$1.$2.$3/$4-$5');
    } else if (v.length > 8) {
      v = v.replace(/^(\d{2})(\d{3})(\d{3})(\d{1,4})$/, '$1.$2.$3/$4');
    } else if (v.length > 5) {
      v = v.replace(/^(\d{2})(\d{3})(\d{1,3})$/, '$1.$2.$3');
    } else if (v.length > 2) {
      v = v.replace(/^(\d{2})(\d{1,3})$/, '$1.$2');
    }
    e.target.value = v;
  });

  const phoneInput = document.getElementById('firstCompanyPhone');
  phoneInput?.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '').substring(0, 11);
    if (v.length > 10) {
      v = v.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    } else if (v.length > 6) {
      v = v.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
    } else if (v.length > 2) {
      v = v.replace(/^(\d{2})(\d{0,5})$/, '($1) $2');
    }
    e.target.value = v;
  });

  // Submit Recuperar Senha (Demonstrativo)
  forgotForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    showToast('Instruções de recuperação enviadas para o e-mail informado.', 'success');
    document.getElementById('authForgotView').style.display = 'none';
    document.getElementById('authLoginView').style.display = 'flex';
  });
}

function openCompanySelector() {
  const overlay = document.getElementById('companySelectorOverlay');
  if (overlay) {
    overlay.style.display = 'flex';
    overlay.classList.remove('fade-out');
  }
}

function logout() {
  sessionStorage.removeItem('dmx_admin_session');
  state.authenticated = false;
  state.currentUser = null;
  state.selectedCompany = '';
  closeModal('modalFirstCompany');
  closeModal('modalNoCompanyAccess');
  const selOverlay = document.getElementById('companySelectorOverlay');
  if (selOverlay) selOverlay.style.display = 'none';

  const authOverlay = document.getElementById('authOverlay');
  if (authOverlay) {
    authOverlay.style.display = 'flex';
    document.getElementById('authLoginView').style.display = 'flex';
    document.getElementById('authRegisterView').style.display = 'none';
    document.getElementById('authForgotView').style.display = 'none';
    const pwInput = document.getElementById('loginPassword');
    if (pwInput) pwInput.value = '';
  }
  showToast('Sessão encerrada com sucesso.', 'info');
}

/* ── Seleção Dinâmica de Empresas (Filtrada por Conta Autenticada) ─ */
function renderUserCompanyList(companies = []) {
  const companyListEl = document.getElementById('companyList');
  const enterBtn = document.getElementById('enterBtn');
  if (!companyListEl) return;

  const avatarColors = [
    'linear-gradient(135deg, #348563 0%, #245440 100%)',
    'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
    'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
    'linear-gradient(135deg, #D97706 0%, #B45309 100%)'
  ];

  companyListEl.innerHTML = companies.map((comp, idx) => {
    const initials = comp.substring(0, 2).toUpperCase();
    const isSelected = idx === 0;
    if (isSelected) state.selectedCompany = comp;

    return `
      <div class="company-item ${isSelected ? 'company-item--selected' : ''}" data-company="${comp}">
        <div class="company-avatar" style="background: ${avatarColors[idx % avatarColors.length]}; color: white; font-weight: 700;">
          ${initials}
        </div>
        <span class="company-name">${comp}</span>
        <span class="company-check">
          ${icon('check', 16)}
        </span>
      </div>
    `;
  }).join('');

  // Reanexar eventos de seleção
  const items = $$('.company-item', companyListEl);
  items.forEach(item => {
    item.addEventListener('click', () => {
      items.forEach(i => i.classList.remove('company-item--selected'));
      item.classList.add('company-item--selected');
      state.selectedCompany = item.dataset.company;
      if (enterBtn) enterBtn.disabled = false;
    });
  });
}

function initCompanySelector() {
  const overlay = document.getElementById('companySelectorOverlay');
  const enterBtn = document.getElementById('enterBtn');

  enterBtn?.addEventListener('click', () => {
    enterBtn.innerHTML = `<span class="spinner spinner--sm"></span> Entrando...`;
    enterBtn.disabled = true;

    setTimeout(() => {
      overlay.classList.add('fade-out');
      updateCompanyAndUserDisplay();
      setTimeout(() => {
        overlay.style.display = 'none';
        enterBtn.innerHTML = `Entrar na empresa ${icon('chevron-right', 16)}`;
        enterBtn.disabled = false;
        showToast(`Bem-vindo à ${state.selectedCompany}!`, 'success');
      }, 350);
    }, 500);
  });

  // Busca na lista de empresas do usuário
  const searchInput = document.getElementById('companySearch');
  searchInput?.addEventListener('input', () => {
    const q = searchInput.value.toLowerCase();
    const items = $$('.company-item', overlay);
    items.forEach(item => {
      const matches = item.textContent.toLowerCase().includes(q);
      item.style.display = matches ? '' : 'none';
    });
  });
}

/* ── Pesquisa em Tempo Real e Filtros Simples ───────── */
function initTableSearchAndFilters() {
  // Filtro de texto universal em cada tabela
  $$('.input-search').forEach(input => {
    input.addEventListener('input', () => {
      const q = input.value.toLowerCase().trim();
      const card = input.closest('.screen');
      const table = card?.querySelector('.data-table tbody');
      if (!table) return;

      $$('tr', table).forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(q) ? '' : 'none';
      });
    });
  });

  // Chips de filtro simples (Todos, Ativos, Com Saldo, etc.)
  $$('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const container = chip.parentElement;
      $$('.filter-chip', container).forEach(c => c.classList.remove('filter-chip--active'));
      chip.classList.add('filter-chip--active');

      const filterType = chip.dataset.filter;
      const screen = chip.closest('.screen');
      const rows = $$('.data-table tbody tr', screen);

      rows.forEach(row => {
        if (filterType === 'all') {
          row.style.display = '';
        } else if (filterType === 'active') {
          const status = row.textContent.toLowerCase();
          row.style.display = status.includes('sim') || status.includes('active') ? '' : 'none';
        } else if (filterType === 'with-balance') {
          const saldo = row.querySelector('.td-monetary')?.textContent || '0';
          row.style.display = saldo.trim() !== '0,00' ? '' : 'none';
        } else if (filterType === 'disponivel') {
          row.style.display = row.textContent.toLowerCase().includes('disponivel') ? '' : 'none';
        } else if (filterType === 'utilizado') {
          row.style.display = row.textContent.toLowerCase().includes('utilizado') ? '' : 'none';
        } else if (filterType === 'pendente') {
          row.style.display = row.textContent.toLowerCase().includes('pendente') ? '' : 'none';
        }
      });
    });
  });
}

/* ── Modais Funcionais (Novo Cliente, Configs, etc.) ── */
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('modal-backdrop--open');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('modal-backdrop--open');
}

function initModals() {
  // Fechar ao clicar no backdrop ou botão de fechar
  $$('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.closest('[data-modal-close]')) {
        modal.classList.remove('modal-backdrop--open');
      }
    });
  });

  // Botão "Novo cliente"
  document.getElementById('btnNovoCliente')?.addEventListener('click', () => {
    const form = document.getElementById('formNovoCliente');
    if (form) form.reset();
    openModal('modalNovoCliente');
  });

  // Salvar Novo Cliente com validação e feedback visual
  document.getElementById('formNovoCliente')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const nome = document.getElementById('clienteNome')?.value.trim();
    const cpf = document.getElementById('clienteCpf')?.value.trim();
    const tel = document.getElementById('clienteTel')?.value.trim();
    const email = document.getElementById('clienteEmail')?.value.trim() || '—';
    const saldo = document.getElementById('clienteSaldo')?.value.trim() || '0,00';
    const submitBtn = e.target.querySelector('button[type="submit"]');

    if (!nome || !cpf || !tel) {
      showToast('Por favor, preencha os campos obrigatórios (*)', 'error');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="spinner spinner--sm" style="display:inline-block; width:14px; height:14px; border:2px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; animation:spin 0.6s linear infinite; margin-right:6px;"></span> Salvando cliente...`;
    }

    setTimeout(() => {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Salvar cliente';
      }

      const tableBody = document.querySelector('#tableClientes .data-table tbody');
      if (tableBody) {
        const emptyRow = tableBody.querySelector('td[colspan]');
        if (emptyRow) emptyRow.closest('tr')?.remove();

        const newRow = document.createElement('tr');
        const nextCode = tableBody.children.length + 1;
        newRow.innerHTML = `
          <td data-label="Código" class="td-code">${nextCode}</td>
          <td data-label="Nome"><strong>${nome.toUpperCase()}</strong></td>
          <td data-label="CPF">${cpf}</td>
          <td data-label="Celular">${tel}</td>
          <td data-label="E-Mail">${email}</td>
          <td data-label="Saldo" class="td-monetary">R$ ${saldo}</td>
          <td data-label="Ativo" class="td-center"><span class="badge badge--success">SIM</span></td>
          <td data-label="Ações" class="td-right">
            <button class="btn-table-action" onclick="showToast('Visualizando cliente ${nome}', 'info')">${icon('eye', 14)} Ver</button>
            <button class="btn-table-action btn-table-action--edit" onclick="showToast('Editando cliente ${nome}', 'info')">${icon('edit', 14)}</button>
            <button class="btn-table-action btn-table-action--delete" onclick="confirmDelete('cliente', '${nome}')">${icon('trash', 14)}</button>
          </td>
        `;
        tableBody.prepend(newRow);
      }

      closeModal('modalNovoCliente');
      showToast(`Cliente ${nome} cadastrado na sessão! (Em produção, o registro é persistido via API Java).`, 'success');
    }, 600);
  });

  // Botão Configurações da Conta na Topbar
  document.getElementById('topbarSettingsBtn')?.addEventListener('click', () => {
    openModal('modalSettings');
  });

  // Abas internas do Modal de Configurações
  $$('.settings-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.settings-tab-btn').forEach(b => b.classList.remove('btn--primary'));
      $$('.settings-tab-btn').forEach(b => b.classList.add('btn--ghost'));
      btn.classList.remove('btn--ghost');
      btn.classList.add('btn--primary');

      const target = btn.dataset.settingsTarget;
      $$('.settings-tab-pane').forEach(p => p.style.display = 'none');
      const pane = document.getElementById(target);
      if (pane) pane.style.display = 'block';
    });
  });

  // Salvar Configurações da Conta
  document.getElementById('btnSaveSettings')?.addEventListener('click', () => {
    closeModal('modalSettings');
    showToast('Preferências da conta atualizadas com sucesso!', 'success');
  });

  // Botão Nova Empresa
  document.getElementById('btnNovaEmpresa')?.addEventListener('click', () => {
    openModal('modalNovaEmpresa');
  });

  document.getElementById('formNovaEmpresa')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const nome = document.getElementById('empresaNome')?.value.trim();
    const cnpj = document.getElementById('empresaCnpj')?.value.trim();
    const submitBtn = e.target.querySelector('button[type="submit"]');

    if (!nome || !cnpj) {
      showToast('Por favor, informe o nome e o CNPJ da empresa.', 'error');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="spinner spinner--sm" style="display:inline-block; width:14px; height:14px; border:2px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; animation:spin 0.6s linear infinite; margin-right:6px;"></span> Cadastrando empresa...`;
    }

    setTimeout(() => {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Salvar empresa';
      }
      closeModal('modalNovaEmpresa');
      showToast(`Empresa ${nome} cadastrada na sessão! (Em produção, persistida pelo backend Java).`, 'success');
    }, 600);
  });

  // Botão Novo Lançamento
  document.getElementById('btnNovoLancamento')?.addEventListener('click', () => {
    openModal('modalNovoLancamento');
  });

  document.getElementById('formNovoLancamento')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const cliente = document.getElementById('lancamentoCliente')?.value.trim();
    const valor = document.getElementById('lancamentoValor')?.value.trim();
    const submitBtn = e.target.querySelector('button[type="submit"]');

    if (!cliente || !valor) {
      showToast('Por favor, informe o cliente e o valor da compra.', 'error');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="spinner spinner--sm" style="display:inline-block; width:14px; height:14px; border:2px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; animation:spin 0.6s linear infinite; margin-right:6px;"></span> Registrando cashback...`;
    }

    setTimeout(() => {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Salvar lançamento';
      }
      closeModal('modalNovoLancamento');
      showToast(`Lançamento de cashback registrado para ${cliente}! (Em produção, validado pela API Java).`, 'success');
    }, 600);
  });
}

/* ── Confirmação de Exclusão ────────────────────────── */
let itemToDeleteCallback = null;
function confirmDelete(type, name, onConfirm) {
  const modal = document.getElementById('modalConfirmDelete');
  const msgEl = document.getElementById('deleteConfirmMessage');
  if (msgEl) {
    msgEl.textContent = `Tem certeza que deseja excluir ${name}? Esta ação não pode ser desfeita.`;
  }
  itemToDeleteCallback = onConfirm || (() => {
    showToast(`${name} excluído(a) com sucesso.`, 'success');
  });
  openModal('modalConfirmDelete');
}

function initDeleteConfirmation() {
  document.getElementById('btnConfirmDeleteAction')?.addEventListener('click', () => {
    if (itemToDeleteCallback) itemToDeleteCallback();
    closeModal('modalConfirmDelete');
  });
}

/* ── Importar Planilha em 5 Etapas Interativas ──────── */
/* ── Formatação Auxiliar de Tamanho de Arquivo ───────── */
function formatFileSize(bytes = 0) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/* ── Importar Planilha em 5 Etapas com Validação Inteligente ─ */
function initImportWorkflow() {
  const steps = [
    document.getElementById('importStep1'),
    document.getElementById('importStep2'),
    document.getElementById('importStep3'),
    document.getElementById('importStep4'),
    document.getElementById('importStep5')
  ];

  const updateStepUI = (stepNum) => {
    state.importStep = stepNum;
    steps.forEach((s, idx) => {
      if (s) s.style.display = (idx + 1 === stepNum) ? 'block' : 'none';
    });

    // Atualizar stepper
    $$('.import-step-item').forEach(item => {
      const num = Number(item.dataset.step);
      item.classList.toggle('import-step-item--active', num === stepNum);
      item.classList.toggle('import-step-item--completed', num < stepNum);
    });
  };

  const dropzone = document.getElementById('importDropzone');
  const fileInput = document.getElementById('importFileInput');
  const btnSample = document.getElementById('btnLoadSampleFile');
  const fileInfoWrap = document.getElementById('selectedFileInfoWrap');
  const incompatibleAlert = document.getElementById('incompatibleFileAlert');
  const btnStep1Next = document.getElementById('btnStep1Next');

  // Função para renderizar o estado do arquivo selecionado
  const renderSelectedFileUI = () => {
    if (!state.selectedImportFile) {
      if (fileInfoWrap) {
        fileInfoWrap.style.display = 'none';
        fileInfoWrap.innerHTML = '';
      }
      if (incompatibleAlert) {
        incompatibleAlert.style.display = 'none';
        incompatibleAlert.innerHTML = '';
      }
      if (btnStep1Next) btnStep1Next.style.display = 'none';
      if (fileInput) fileInput.value = '';
      return;
    }

    const file = state.selectedImportFile;

    if (file.compatible) {
      // Arquivo compatível: exibe card verde com detalhes e botão de avançar
      if (fileInfoWrap) {
        fileInfoWrap.style.display = 'block';
        fileInfoWrap.innerHTML = `
          <div class="import-file-card import-file-card--valid">
            <div class="import-file-main">
              <div class="import-file-icon import-file-icon--valid">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              </div>
              <div class="import-file-details">
                <span class="import-file-name">${file.name}</span>
                <div class="import-file-meta">
                  <span>${file.size}</span>
                  <span>&bull;</span>
                  <span class="import-format-badge import-format-badge--valid">
                    ${file.ext.toUpperCase().replace('.', '')} &bull; Formato Compatível
                  </span>
                </div>
              </div>
            </div>
            <button type="button" class="btn btn--ghost btn--sm" id="btnRemoveFileAction" style="color: var(--color-error);" title="Remover e escolher outro arquivo">
              Remover arquivo
            </button>
          </div>
        `;
        document.getElementById('btnRemoveFileAction')?.addEventListener('click', () => {
          state.selectedImportFile = null;
          renderSelectedFileUI();
          showToast('Arquivo removido. Selecione outro arquivo.', 'info');
        });
      }

      if (incompatibleAlert) {
        incompatibleAlert.style.display = 'none';
        incompatibleAlert.innerHTML = '';
      }

      if (btnStep1Next) {
        btnStep1Next.style.display = 'inline-flex';
      }

      showToast(`Arquivo "${file.name}" identificado como compatível!`, 'success');

    } else {
      // Arquivo INCOMPATÍVEL: exibe card de aviso, alerta explicativo amigável e desabilita avançar
      if (fileInfoWrap) {
        fileInfoWrap.style.display = 'block';
        fileInfoWrap.innerHTML = `
          <div class="import-file-card import-file-card--invalid">
            <div class="import-file-main">
              <div class="import-file-icon import-file-icon--invalid">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <div class="import-file-details">
                <span class="import-file-name">${file.name}</span>
                <div class="import-file-meta">
                  <span>${file.size}</span>
                  <span>&bull;</span>
                  <span class="import-format-badge import-format-badge--invalid">
                    ${file.ext ? file.ext.toUpperCase().replace('.', '') : 'Desconhecido'} &bull; Formato Incompatível
                  </span>
                </div>
              </div>
            </div>
            <button type="button" class="btn btn--ghost btn--sm" id="btnRemoveFileAction" title="Remover arquivo">
              Remover
            </button>
          </div>
        `;
        document.getElementById('btnRemoveFileAction')?.addEventListener('click', () => {
          state.selectedImportFile = null;
          renderSelectedFileUI();
          showToast('Arquivo removido. Selecione um arquivo .xlsx ou .csv.', 'info');
        });
      }

      if (incompatibleAlert) {
        incompatibleAlert.style.display = 'block';
        incompatibleAlert.innerHTML = `
          <div class="import-alert-box import-alert-box--error">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            <div>
              <strong>Formato não suportado para importação de cashback:</strong><br>
              O arquivo <strong>"${file.name}"</strong> possui extensão <code>${file.ext || 'sem extensão'}</code>, que não pode ser processada como planilha.<br>
              Para importar créditos e clientes, utilize arquivos de planilha nos formatos <strong>Excel (.xlsx, .xls)</strong> ou <strong>Texto delimitado (.csv)</strong> contendo as colunas de CPF, Nome e Cashback.
            </div>
          </div>
        `;
      }

      if (btnStep1Next) {
        btnStep1Next.style.display = 'none';
      }

      showToast(`O formato "${file.ext || 'selecionado'}" não é compatível. Utilize .xlsx ou .csv.`, 'error');
    }
  };

  // Drag and Drop funcional
  if (dropzone) {
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('import-dropzone--dragover');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('import-dropzone--dragover');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('import-dropzone--dragover');
      if (e.dataTransfer?.files?.[0]) {
        handleSelectedFile(e.dataTransfer.files[0]);
      }
    });

    dropzone.addEventListener('click', (e) => {
      if (e.target.tagName !== 'BUTTON' && !e.target.closest('button')) {
        fileInput?.click();
      }
    });
  }

  fileInput?.addEventListener('change', () => {
    if (fileInput.files?.[0]) {
      handleSelectedFile(fileInput.files[0]);
    }
  });

  btnSample?.addEventListener('click', () => {
    handleSelectedFile({
      name: 'Cashback_Clientes_Outubro.xlsx',
      size: 145400
    });
  });

  // Step 1 -> Step 2
  btnStep1Next?.addEventListener('click', () => {
    if (!state.selectedImportFile || !state.selectedImportFile.compatible) return;
    const prevNameEl = document.getElementById('previewFileName');
    if (prevNameEl) prevNameEl.textContent = state.selectedImportFile.name;
    updateStepUI(2);
    showToast('Planilha aberta para pré-visualização das colunas.', 'info');
  });

  // Step 2 -> Step 3
  document.getElementById('btnStep2To3')?.addEventListener('click', () => {
    updateStepUI(3);
  });

  // Step 3 -> Step 4
  document.getElementById('btnStep3To4')?.addEventListener('click', () => {
    updateStepUI(4);
  });

  // Step 4 Confirm -> Step 5
  document.getElementById('btnConfirmImportSubmit')?.addEventListener('click', () => {
    const btn = document.getElementById('btnConfirmImportSubmit');
    btn.innerHTML = `<span class="spinner spinner--sm"></span> Processando lote...`;
    btn.disabled = true;

    setTimeout(() => {
      btn.innerHTML = `Confirmar e Importar`;
      btn.disabled = false;
      updateStepUI(5);
      showToast('Importação concluída com sucesso! 5 lançamentos registrados.', 'success');
    }, 900);
  });

  // Voltar steps
  document.getElementById('btnStep2Back')?.addEventListener('click', () => updateStepUI(1));
  document.getElementById('btnStep3Back')?.addEventListener('click', () => updateStepUI(2));
  document.getElementById('btnStep4Back')?.addEventListener('click', () => updateStepUI(3));
  document.getElementById('btnRestartImport')?.addEventListener('click', () => {
    state.selectedImportFile = null;
    renderSelectedFileUI();
    updateStepUI(1);
  });
}

/* ── Toasts ─────────────────────────────────────────── */
function showToast(message, type = 'success', duration = 3500) {
  const container = document.getElementById('toastContainer') || createToastContainer();
  const toast = el('div', `toast toast--${type}`);
  const iconName = type === 'success' ? 'check' : type === 'error' ? 'x' : 'bell';
  toast.innerHTML = `
    <div class="toast-icon">${icon(iconName, 16)}</div>
    <span class="toast-msg">${message}</span>
    <button class="toast-close" onclick="this.closest('.toast').remove()">${icon('x', 12)}</button>
  `;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast--visible'));
  setTimeout(() => {
    toast.classList.remove('toast--visible');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function createToastContainer() {
  const container = el('div', 'toast-container');
  container.id = 'toastContainer';
  document.body.appendChild(container);
  return container;
}

/* ── FAB (Atalhos Rápidos Funcionais: Calendário e Pagamentos) ─ */
function initFAB() {
  const fabBtn = document.getElementById('fabBtn');
  const fabMenu = document.getElementById('fabMenu');
  const calItem = document.getElementById('fabItemCalendar');
  const payItem = document.getElementById('fabItemPayments');

  fabBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    state.fabOpen = !state.fabOpen;
    fabMenu?.classList.toggle('fab-menu--open', state.fabOpen);
    fabBtn.classList.toggle('fab-btn--active', state.fabOpen);
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.fab-container') && state.fabOpen) {
      state.fabOpen = false;
      fabMenu?.classList.remove('fab-menu--open');
      fabBtn?.classList.remove('fab-btn--active');
    }
  });

  calItem?.addEventListener('click', () => {
    state.fabOpen = false;
    fabMenu?.classList.remove('fab-menu--open');
    fabBtn?.classList.remove('fab-btn--active');
    openModal('modalCalendar');
    if (window.renderCalendar) window.renderCalendar();
  });

  payItem?.addEventListener('click', () => {
    state.fabOpen = false;
    fabMenu?.classList.remove('fab-menu--open');
    fabBtn?.classList.remove('fab-btn--active');
    openModal('modalPayments');
    if (window.renderPaymentsTable) window.renderPaymentsTable();
  });
}

/* ── Calendário Operacional (Anual & Mensal com Eventos) ── */
function initCalendar() {
  const monthTitle = document.getElementById('calCurrentMonthTitle');
  const daysGrid = document.getElementById('calDaysGrid');
  const prevBtn = document.getElementById('btnCalPrevMonth');
  const nextBtn = document.getElementById('btnCalNextMonth');
  const todayBtn = document.getElementById('btnCalToday');
  const newEventBtn = document.getElementById('btnOpenNewEventForm');
  const formContainer = document.getElementById('calEventFormContainer');
  const form = document.getElementById('formCalEvent');
  const cancelBtn = document.getElementById('btnCancelCalEventForm');
  const dismissBtn = document.getElementById('btnDismissCalForm');
  const selectedDateLabel = document.getElementById('calSelectedDateLabel');
  const eventsCountBadge = document.getElementById('calEventsCountBadge');
  const eventsListEl = document.getElementById('calEventsList');

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  function loadCalendarEvents() {
    const stored = localStorage.getItem('dmx_calendar_events');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {}
    }

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    const defaultEvents = [
      {
        id: 'evt-1',
        title: 'Fechamento Mensal de Lotes',
        date: formatDateIso(new Date(currentYear, currentMonth, 5)),
        time: '18:00',
        category: 'cashback',
        desc: 'Conferência dos lançamentos consolidados do período e emissão de relatório.',
        isCustom: false
      },
      {
        id: 'evt-2',
        title: 'Vencimento Fatura de Processamento',
        date: formatDateIso(new Date(currentYear, currentMonth, 10)),
        time: '10:00',
        category: 'vencimento',
        desc: 'Boleto de taxa de intermediação e infraestrutura DMX CashBack.',
        isCustom: false
      },
      {
        id: 'evt-3',
        title: 'Revisão de Cashback a Expirar',
        date: formatDateIso(new Date(currentYear, currentMonth, 15)),
        time: '14:30',
        category: 'lembrete',
        desc: 'Auditoria de clientes com créditos próximos do prazo de 90 dias.',
        isCustom: false
      },
      {
        id: 'evt-4',
        title: 'Disparo Preventivo de E-mails',
        date: formatDateIso(new Date(currentYear, currentMonth, 22)),
        time: '09:00',
        category: 'lembrete',
        desc: 'Envio em lote para clientes com saldo ativo prestes a expirar.',
        isCustom: false
      }
    ];

    localStorage.setItem('dmx_calendar_events', JSON.stringify(defaultEvents));
    return defaultEvents;
  }

  function saveCalendarEvents(events) {
    localStorage.setItem('dmx_calendar_events', JSON.stringify(events));
  }

  function formatDateIso(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function formatDatePt(dateIso) {
    const parts = dateIso.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  state.calEvents = loadCalendarEvents();

  window.renderCalendar = () => {
    if (!monthTitle || !daysGrid) return;

    const year = state.currentCalDate.getFullYear();
    const month = state.currentCalDate.getMonth();

    monthTitle.textContent = `${monthNames[month]} de ${year}`;

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    daysGrid.innerHTML = '';

    // Dias do mês anterior
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const cell = document.createElement('div');
      cell.className = 'calendar-day calendar-day--other-month';
      cell.innerHTML = `<span class="calendar-day-number">${dayNum}</span>`;
      daysGrid.appendChild(cell);
    }

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

    // Dias do mês atual
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDateIso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = state.calEvents.filter(e => e.date === dayDateIso);

      const cell = document.createElement('div');
      cell.className = 'calendar-day';

      if (isCurrentMonth && today.getDate() === day) {
        cell.classList.add('calendar-day--today');
      }

      if (state.selectedCalDay === day) {
        cell.classList.add('calendar-day--selected');
      }

      let indicatorHtml = '';
      if (dayEvents.length > 0) {
        const hasVencimento = dayEvents.some(e => e.category === 'vencimento');
        const hasHigh = dayEvents.length >= 2;
        const dotClass = hasVencimento ? 'calendar-dot--reminder' : hasHigh ? 'calendar-dot--dark' : 'calendar-dot';

        indicatorHtml = `
          <div class="calendar-day-indicator">
            <span class="calendar-dot ${dotClass}"></span>
            ${dayEvents.length > 1 ? `<span class="calendar-badge-count">${dayEvents.length}</span>` : ''}
          </div>
        `;
      }

      cell.innerHTML = `
        <span class="calendar-day-number">${day}</span>
        ${indicatorHtml}
      `;

      cell.addEventListener('click', () => {
        $$('.calendar-day', daysGrid).forEach(c => c.classList.remove('calendar-day--selected'));
        cell.classList.add('calendar-day--selected');
        state.selectedCalDay = day;
        renderEventsForDate(dayDateIso);
      });

      daysGrid.appendChild(cell);
    }

    // Dias do próximo mês
    const totalCells = firstDayIndex + daysInMonth;
    const remainingCells = (7 - (totalCells % 7)) % 7;
    for (let i = 1; i <= remainingCells; i++) {
      const cell = document.createElement('div');
      cell.className = 'calendar-day calendar-day--other-month';
      cell.innerHTML = `<span class="calendar-day-number">${i}</span>`;
      daysGrid.appendChild(cell);
    }

    const currentIso = `${year}-${String(month + 1).padStart(2, '0')}-${String(state.selectedCalDay).padStart(2, '0')}`;
    renderEventsForDate(currentIso);
  };

  function renderEventsForDate(dateIso) {
    if (!eventsListEl || !selectedDateLabel) return;

    selectedDateLabel.textContent = `Eventos em ${formatDatePt(dateIso)}`;
    const dayEvents = state.calEvents.filter(e => e.date === dateIso);

    if (eventsCountBadge) {
      eventsCountBadge.textContent = `${dayEvents.length} ${dayEvents.length === 1 ? 'evento' : 'eventos'}`;
    }

    if (dayEvents.length === 0) {
      eventsListEl.innerHTML = `
        <div style="padding: 28px 16px; text-align: center; color: var(--color-text-secondary); background: #FAFCFA; border-radius: var(--radius-md); border: 1px dashed var(--neutral-200);">
          <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--neutral-100); display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; color: var(--neutral-400);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <strong style="font-size: 13px; color: var(--color-text-primary); display: block;">Nenhum evento registrado</strong>
          <span style="font-size: 12px; margin-top: 4px; display: block;">Clique em "+ Novo Lembrete" para agendar uma atividade nesta data.</span>
        </div>
      `;
      return;
    }

    eventsListEl.innerHTML = dayEvents.map(evt => {
      const isReminder = evt.category === 'vencimento' || evt.category === 'lembrete';
      const cardModClass = evt.category === 'vencimento' ? 'calendar-event-card--deadline' : isReminder ? 'calendar-event-card--reminder' : '';

      return `
        <div class="calendar-event-card ${cardModClass}" id="eventCard-${evt.id}">
          <div class="calendar-event-top">
            <span class="calendar-event-time">${evt.time || 'Dia todo'}</span>
            <span class="badge ${evt.category === 'vencimento' ? 'badge--warning' : 'badge--success'}" style="font-size: 10px;">
              ${evt.category.toUpperCase()}
            </span>
          </div>
          <div class="calendar-event-title">${evt.title}</div>
          ${evt.desc ? `<div class="calendar-event-desc">${evt.desc}</div>` : ''}
          <div class="calendar-event-actions">
            <button type="button" class="btn btn--ghost btn--sm" onclick="editCalEvent('${evt.id}')" style="font-size: 11px; padding: 2px 6px;">
              ${icon('edit', 12)} Editar
            </button>
            <button type="button" class="btn btn--ghost btn--sm" onclick="deleteCalEvent('${evt.id}')" style="font-size: 11px; padding: 2px 6px; color: var(--color-error);">
              ${icon('trash', 12)} Excluir
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Navegação
  prevBtn?.addEventListener('click', () => {
    state.currentCalDate.setMonth(state.currentCalDate.getMonth() - 1);
    state.selectedCalDay = 1;
    renderCalendar();
  });

  nextBtn?.addEventListener('click', () => {
    state.currentCalDate.setMonth(state.currentCalDate.getMonth() + 1);
    state.selectedCalDay = 1;
    renderCalendar();
  });

  todayBtn?.addEventListener('click', () => {
    state.currentCalDate = new Date();
    state.selectedCalDay = new Date().getDate();
    renderCalendar();
    showToast('Retornado para o mês e dia atuais.', 'info');
  });

  newEventBtn?.addEventListener('click', () => {
    if (!formContainer) return;
    document.getElementById('calFormHeaderTitle').textContent = 'Novo Lembrete';
    document.getElementById('calEventEditId').value = '';
    form?.reset();
    formContainer.style.display = 'block';
    document.getElementById('calInputTitle')?.focus();
  });

  cancelBtn?.addEventListener('click', () => {
    if (formContainer) formContainer.style.display = 'none';
  });

  dismissBtn?.addEventListener('click', () => {
    if (formContainer) formContainer.style.display = 'none';
  });

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('calInputTitle')?.value.trim();
    const time = document.getElementById('calInputTime')?.value;
    const cat = document.getElementById('calInputCategory')?.value;
    const desc = document.getElementById('calInputDesc')?.value.trim();
    const editId = document.getElementById('calEventEditId')?.value;

    if (!title) return;

    const year = state.currentCalDate.getFullYear();
    const month = state.currentCalDate.getMonth() + 1;
    const dateIso = `${year}-${String(month).padStart(2, '0')}-${String(state.selectedCalDay).padStart(2, '0')}`;

    if (editId) {
      const idx = state.calEvents.findIndex(ev => ev.id === editId);
      if (idx !== -1) {
        state.calEvents[idx].title = title;
        state.calEvents[idx].time = time;
        state.calEvents[idx].category = cat;
        state.calEvents[idx].desc = desc;
      }
      showToast('Lembrete atualizado com sucesso!', 'success');
    } else {
      const newEvt = {
        id: 'evt-' + Date.now(),
        title: title,
        date: dateIso,
        time: time,
        category: cat,
        desc: desc,
        isCustom: true
      };
      state.calEvents.push(newEvt);
      showToast(`Lembrete "${title}" adicionado à sua agenda!`, 'success');
    }

    saveCalendarEvents(state.calEvents);
    formContainer.style.display = 'none';
    form.reset();
    renderCalendar();
  });

  window.editCalEvent = (id) => {
    const evt = state.calEvents.find(e => e.id === id);
    if (!evt || !formContainer) return;
    document.getElementById('calFormHeaderTitle').textContent = 'Editar Lembrete';
    document.getElementById('calEventEditId').value = evt.id;
    document.getElementById('calInputTitle').value = evt.title;
    document.getElementById('calInputTime').value = evt.time || '09:00';
    document.getElementById('calInputCategory').value = evt.category;
    document.getElementById('calInputDesc').value = evt.desc || '';
    formContainer.style.display = 'block';
  };

  window.deleteCalEvent = (id) => {
    state.calEvents = state.calEvents.filter(e => e.id !== id);
    saveCalendarEvents(state.calEvents);
    showToast('Lembrete excluído com sucesso.', 'info');
    renderCalendar();
  };
}

/* ── Histórico de Pagamentos (Demonstrativo e Organizado) ─ */
function initPaymentsHistory() {
  const tableBody = document.getElementById('paymentsTableBody');
  const searchInput = document.getElementById('inputSearchPayments');
  const filterBtns = $$('.pay-filter-btn');

  let currentStatus = 'all';

  window.renderPaymentsTable = () => {
    const elTotal = document.getElementById('paySummaryTotal');
    const elPending = document.getElementById('paySummaryPending');
    const elCount = document.getElementById('paySummaryCount');
    if (elTotal) elTotal.textContent = 'R$ 0,00';
    if (elPending) elPending.textContent = 'R$ 0,00';
    if (elCount) elCount.textContent = `${state.paymentsList.length} transações`;
    if (!tableBody) return;
    const query = searchInput?.value.trim().toLowerCase() || '';

    const filtered = state.paymentsList.filter(item => {
      if (currentStatus !== 'all' && item.status.toLowerCase() !== currentStatus) return false;
      if (query) {
        const matchId = item.id.toLowerCase().includes(query);
        const matchDesc = item.desc.toLowerCase().includes(query);
        const matchMethod = item.method.toLowerCase().includes(query);
        const matchVal = item.value.toLowerCase().includes(query);
        if (!matchId && !matchDesc && !matchMethod && !matchVal) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 24px; color: var(--color-text-secondary);">
            Nenhum pagamento encontrado com os critérios informados.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = filtered.map(pay => `
      <tr>
        <td style="font-variant-numeric: tabular-nums;">${pay.date}</td>
        <td class="td-code" style="font-weight: 700; color: var(--color-text-primary);">${pay.id}</td>
        <td><strong>${pay.desc}</strong></td>
        <td><span class="badge badge--neutral" style="font-size: 11px;">${pay.method}</span></td>
        <td class="td-monetary" style="color: var(--brand-main); font-weight: 700;">${pay.value}</td>
        <td style="text-align: center;">
          <span class="badge badge--${pay.statusClass}">${pay.status}</span>
        </td>
      </tr>
    `).join('');
  };

  searchInput?.addEventListener('input', () => renderPaymentsTable());

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('filter-chip--active'));
      btn.classList.add('filter-chip--active');
      currentStatus = btn.dataset.payFilter;
      renderPaymentsTable();
    });
  });
}

/* ── DMX Assist (Assistente Virtual Inteligente) ──────── */
function initDmxAssist() {
  const btn = document.getElementById('dmxAssistBtn');
  const win = document.getElementById('dmxAssistWindow');
  const closeBtn = document.getElementById('btnCloseAssist');
  const minBtn = document.getElementById('btnMinimizeAssist');
  const input = document.getElementById('dmxChatInput');
  const messagesEl = document.getElementById('dmxChatMessages');

  if (!btn || !win) return;

  const toggleAssist = (open) => {
    state.dmxAssistOpen = typeof open === 'boolean' ? open : !state.dmxAssistOpen;
    win.classList.toggle('dmx-assist-window--open', state.dmxAssistOpen);
    if (state.dmxAssistOpen) {
      renderChatMessages();
      setTimeout(() => input?.focus(), 150);
    }
  };

  btn.addEventListener('click', () => toggleAssist());
  closeBtn?.addEventListener('click', () => toggleAssist(false));
  minBtn?.addEventListener('click', () => toggleAssist(false));

  const renderChatMessages = () => {
    if (!messagesEl) return;
    messagesEl.innerHTML = state.dmxChatHistory.map(msg => `
      <div class="dmx-chat-msg dmx-chat-msg--${msg.sender}">
        <div class="dmx-chat-bubble">
          ${msg.text}
          ${msg.suggestions ? `
            <div class="dmx-suggestions">
              <span class="dmx-suggestion-label">Sugestões de perguntas:</span>
              ${msg.suggestions.map(s => `
                <button type="button" class="dmx-suggestion-chip" onclick="handleDmxSuggestion('${s.replace(/'/g, "\\'")}')">
                  ${icon('chevron-right', 12)} ${s}
                </button>
              `).join('')}
            </div>
          ` : ''}
        </div>
        <span class="dmx-chat-time">${msg.time}</span>
      </div>
    `).join('');

    messagesEl.scrollTop = messagesEl.scrollHeight;
  };

  window.handleSendAssistMessage = () => {
    const text = input.value.trim();
    if (!text) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Mensagem do usuário
    state.dmxChatHistory.push({
      sender: 'user',
      time: timeStr,
      text: text
    });

    input.value = '';
    renderChatMessages();

    // Indicador visual de digitação
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'dmx-typing';
    typingIndicator.id = 'dmxTypingEl';
    typingIndicator.innerHTML = `
      <span class="dmx-typing-dot"></span>
      <span class="dmx-typing-dot"></span>
      <span class="dmx-typing-dot"></span>
    `;
    messagesEl.appendChild(typingIndicator);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    // Resposta demonstrativa inteligente
    setTimeout(() => {
      typingIndicator.remove();
      const reply = generateSmartAssistReply(text);
      state.dmxChatHistory.push({
        sender: 'bot',
        time: timeStr,
        text: reply.text,
        suggestions: reply.suggestions
      });
      renderChatMessages();
    }, 450);
  };

  window.handleDmxSuggestion = (text) => {
    input.value = text;
    window.handleSendAssistMessage();
  };

  renderChatMessages();
}

function generateSmartAssistReply(query) {
  const q = query.toLowerCase();

  if (q.includes('importar') || q.includes('planilha')) {
    return {
      text: 'Para importar uma planilha no DMX CashBack:<br><br>1. Acesse o menu <strong>CASHBACK &gt; Importar planilha</strong>.<br>2. Siga as 5 etapas guiadas: <em>Arquivo &rarr; Prévia &rarr; Conferência &rarr; Confirmação &rarr; Concluído</em>.<br>3. Formatos aceitos: <code>.xlsx</code> ou <code>.csv</code> contendo colunas de Nome, CPF e Valor.<br><br>O sistema valida CPFs e impede cadastros duplicados automaticamente.',
      suggestions: ['Como cadastrar cliente?', 'Como consultar notas e boletos?']
    };
  }

  if (q.includes('cliente') || q.includes('cadastrar')) {
    return {
      text: 'Para cadastrar um novo cliente:<br><br>1. Abra <strong>CASHBACK &gt; Clientes</strong>.<br>2. Clique no botão superior <strong>+ Novo cliente</strong>.<br>3. Preencha Nome Completo e CPF (campos obrigatórios).<br>4. Opcionalmente informe E-mail e Telefone.<br><br>Ao confirmar, o cliente fica liberado para receber cashback imediatamente.',
      suggestions: ['Qual a regra de validade do cashback?', 'Como importar planilha?']
    };
  }

  if (q.includes('consulta') || q.includes('registro') || q.includes('boleto') || q.includes('nota') || q.includes('lote')) {
    return {
      text: 'Na tela <strong>GESTÃO &gt; Consulta de Registros</strong>, você localiza boletos, notas fiscais e lotes em um só lugar:<br><br>&bull; <strong>Boletos:</strong> faturas e taxas operacionais.<br>&bull; <strong>Notas:</strong> vendas vinculadas e cupons emitidos.<br>&bull; <strong>Lotes:</strong> arquivos de cashback processados.<br><br>Utilize a barra de pesquisa ou os chips de categoria e clique em <em>Visualizar Detalhes</em> para auditar comprovantes.',
      suggestions: ['Como configurar e-mails automáticos?', 'Como importar planilha?']
    };
  }

  if (q.includes('validade') || q.includes('expira') || q.includes('prazo')) {
    return {
      text: '<strong>Regra de Validade do Cashback:</strong><br><br>Os créditos de cashback possuem validade padrão de <strong>90 dias</strong> a partir da data de lançamento ou confirmação do lote.<br><br>O DMX CashBack envia alertas automáticos por e-mail e na central de notificações com 5 dias de antecedência do vencimento para incentivar o resgate.',
      suggestions: ['Como configurar e-mails automáticos?', 'Como cadastrar cliente?']
    };
  }

  if (q.includes('email') || q.includes('e-mail') || q.includes('comunicação') || q.includes('mensagem')) {
    return {
      text: 'Para configurar e-mails institucionais:<br><br>1. Acesse <strong>Configurações Administrativas &gt; Comunicação e E-mails</strong>.<br>2. Informe o e-mail de envio institucional e o provedor (Amazon SES, SendGrid, SMTP).<br>3. Visualize os modelos de <em>Registro de Crédito</em> e <em>Atualização do Saldo</em>.<br><br><em>Nota de segurança:</em> As credenciais SMTP devem ser mantidas no microserviço Java no servidor.',
      suggestions: ['Como consultar notas e boletos?', 'Qual a regra de validade do cashback?']
    };
  }

  return {
    text: 'Entendido! Como estou em fase de demonstração no protótipo, posso te orientar sobre o uso de todas as telas do <strong>DMX CashBack</strong>. Você pode explorar os menus laterais, consultar registros, testar a importação em 5 passos ou configurar os e-mails institucionais.',
    suggestions: [
      'Como importar planilha?',
      'Como cadastrar cliente?',
      'Como consultar notas e boletos?'
    ]
  };
}

/* ── Consulta de Registros (Gestão) ──────────────────── */
function initConsultaRegistros() {
  const tableBody = document.getElementById('recordsTableBody');
  const emptyState = document.getElementById('recordEmptyState');
  const searchInput = document.getElementById('inputSearchRecords');
  const statusFilter = document.getElementById('filterRecordStatus');
  const chips = $$('.record-chip');
  const pageInfo = document.getElementById('recordsPageInfo');

  if (!tableBody) return;

  let currentCategory = 'all';

  const updateCounts = () => {
    const countAll = state.records.length;
    const countBoletos = state.records.filter(r => r.type === 'boleto').length;
    const countNotas = state.records.filter(r => r.type === 'nota').length;
    const countLotes = state.records.filter(r => r.type === 'lote').length;

    const elAll = document.getElementById('countRecAll');
    const elBol = document.getElementById('countRecBoletos');
    const elNot = document.getElementById('countRecNotas');
    const elLot = document.getElementById('countRecLotes');

    if (elAll) elAll.textContent = countAll;
    if (elBol) elBol.textContent = countBoletos;
    if (elNot) elNot.textContent = countNotas;
    if (elLot) elLot.textContent = countLotes;
  };

  const render = () => {
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const statusVal = statusFilter ? statusFilter.value : 'all';

    const filtered = state.records.filter(r => {
      // Category filter
      if (currentCategory !== 'all' && r.type !== currentCategory) return false;
      // Status filter
      if (statusVal !== 'all' && r.status !== statusVal) return false;
      // Text search
      if (query) {
        const matchCode = r.code.toLowerCase().includes(query);
        const matchEntity = r.entity.toLowerCase().includes(query);
        const matchValue = r.value.toLowerCase().includes(query);
        const matchType = r.typeName.toLowerCase().includes(query);
        if (!matchCode && !matchEntity && !matchValue && !matchType) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      tableBody.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      if (pageInfo) pageInfo.textContent = '0 registros encontrados';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (pageInfo) pageInfo.textContent = `Exibindo ${filtered.length} de ${state.records.length} registro(s)`;

    tableBody.innerHTML = filtered.map(r => `
      <tr onclick="openRecordDetails(${r.id})" style="cursor: pointer;">
        <td class="td-code" style="font-weight: 700; color: var(--color-text-primary);">${r.code}</td>
        <td>
          <span class="badge-record-type badge-record-type--${r.type}">${r.typeName}</span>
        </td>
        <td><strong>${r.entity}</strong></td>
        <td>${r.date}</td>
        <td class="td-monetary" style="color: var(--brand-main); font-weight: 700;">${r.value}</td>
        <td><span class="badge badge--${r.statusClass}">${r.status}</span></td>
        <td class="td-right">
          <button class="btn-table-action" onclick="event.stopPropagation(); openRecordDetails(${r.id})">
            Visualizar Detalhes
          </button>
        </td>
      </tr>
    `).join('');
  };

  // Chips click
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('record-chip--active'));
      chip.classList.add('record-chip--active');
      currentCategory = chip.dataset.recordType;
      render();
    });
  });

  // Inputs change
  searchInput?.addEventListener('input', render);
  statusFilter?.addEventListener('change', render);

  window.resetRecordFilters = () => {
    if (searchInput) searchInput.value = '';
    if (statusFilter) statusFilter.value = 'all';
    currentCategory = 'all';
    chips.forEach(c => {
      c.classList.toggle('record-chip--active', c.dataset.recordType === 'all');
    });
    render();
    showToast('Filtros de consulta resetados.', 'info');
  };

  window.openRecordDetails = (id) => {
    const record = state.records.find(r => r.id === id);
    if (!record) return;

    const modalTitle = document.getElementById('recordModalTitle');
    const modalSubtitle = document.getElementById('recordModalSubtitle');
    const modalContent = document.getElementById('recordModalContent');

    if (modalTitle) modalTitle.textContent = `${record.typeName}: ${record.code}`;
    if (modalSubtitle) modalSubtitle.textContent = `Registro cadastrado em ${record.date} — Status: ${record.status}`;

    if (modalContent) {
      modalContent.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--color-border);">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="badge-record-type badge-record-type--${record.type}">${record.typeName}</span>
            <span class="badge badge--${record.statusClass}">${record.status}</span>
          </div>
          <div style="font-size: 20px; font-weight: 800; color: var(--brand-main);">${record.value}</div>
        </div>

        <div class="record-detail-grid">
          <div class="record-detail-item">
            <span class="record-detail-label">Identificador</span>
            <span class="record-detail-value">${record.code}</span>
          </div>
          <div class="record-detail-item">
            <span class="record-detail-label">Favorecido / Empresa</span>
            <span class="record-detail-value">${record.entity}</span>
          </div>
          <div class="record-detail-item">
            <span class="record-detail-label">Data de Emissão</span>
            <span class="record-detail-value">${record.date}</span>
          </div>
          <div class="record-detail-item">
            <span class="record-detail-label">Descrição</span>
            <span class="record-detail-value" style="font-size: 13px;">${record.description}</span>
          </div>
        </div>

        <div style="margin-top: 18px;">
          <h4 style="font-size: 13px; font-weight: 700; color: var(--color-text-primary); margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.04em;">
            Histórico e Rastreabilidade
          </h4>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${record.history.map(h => `
              <div style="display: flex; align-items: flex-start; gap: 10px; font-size: 13px;">
                <div style="width: 8px; height: 8px; border-radius: 50%; background: var(--brand-main); margin-top: 5px; flex-shrink: 0;"></div>
                <div style="flex: 1;">
                  <strong style="color: var(--color-text-primary);">${h.text}</strong>
                  <div style="font-size: 11px; color: var(--neutral-500);">${h.date}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div style="margin-top: 18px;">
          <h4 style="font-size: 13px; font-weight: 700; color: var(--color-text-primary); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.04em;">
            Comprovante / Documento Vinculado
          </h4>
          ${record.hasAttachment ? `
            <div class="record-attachment-box">
              <div style="display: flex; align-items: center; gap: 10px;">
                <div style="width: 36px; height: 36px; border-radius: 6px; background: #FDECEA; color: #C0392B; display: flex; align-items: center; justify-content: center;">
                  ${icon('file-text', 18)}
                </div>
                <div>
                  <div style="font-size: 13px; font-weight: 600; color: var(--color-text-primary);">${record.attachmentName}</div>
                  <div style="font-size: 11px; color: var(--neutral-500);">Documento digitalizado · 245 KB</div>
                </div>
              </div>
              <button type="button" class="btn btn--secondary btn--sm" onclick="showToast('Abrindo arquivo: ${record.attachmentName}...', 'info')">
                Visualizar Arquivo
              </button>
            </div>
          ` : `
            <div style="padding: 12px 16px; border-radius: 8px; background: var(--neutral-100); font-size: 12px; color: var(--color-text-secondary); display: flex; align-items: center; gap: 8px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Nenhum documento físico ou comprovante em PDF anexado a este registro.
            </div>
          `}
        </div>
      `;
    }

    openModal('recordDetailModal');
  };

  window.exportRecordsReport = () => {
    showToast('Exportando consulta de registros em formato .xlsx...', 'info');
  };

  updateCounts();
  render();
}

/* ── Comunicação e E-mails (Admin) ───────────────────── */
function initComunicacaoEmails() {
  const badge = document.getElementById('emailConfigStatusBadge');
  const senderInput = document.getElementById('cfgSenderEmail');
  const nameInput = document.getElementById('cfgSenderName');
  const adminInput = document.getElementById('cfgAdminEmail');
  const providerSelect = document.getElementById('cfgEmailProvider');

  window.saveEmailConfig = () => {
    const sender = senderInput?.value.trim() || '';
    const name = nameInput?.value.trim() || '';
    const adminEmail = adminInput?.value.trim() || '';
    const provider = providerSelect?.value || '';

    if (!sender || !sender.includes('@')) {
      showToast('Por favor, informe um endereço de e-mail institucional válido.', 'error');
      return;
    }

    const submitBtn = document.querySelector('#formEmailConfig button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="spinner spinner--sm" style="display:inline-block; width:14px; height:14px; border:2px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; animation:spin 0.6s linear infinite; margin-right:6px;"></span> Salvando...`;
    }

    setTimeout(() => {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Salvar Parâmetros';
      }

      state.emailSettings = {
        senderEmail: sender,
        senderName: name,
        adminEmail: adminEmail,
        provider: provider,
        configured: true
      };

      if (badge) {
        badge.textContent = 'Configurado';
        badge.className = 'badge badge--success';
      }

      showToast('Configurações de e-mail salvas na sessão! Os envios reais serão executados pelo backend Java.', 'success');
    }, 500);
  };

  document.getElementById('formEmailConfig')?.addEventListener('submit', (e) => {
    e.preventDefault();
    window.saveEmailConfig();
  });

  window.resetEmailConfigForm = () => {
    if (senderInput) senderInput.value = '';
    if (nameInput) nameInput.value = 'DMX CashBack';
    if (adminInput) adminInput.value = '';
    if (providerSelect) providerSelect.value = '';
    if (badge) {
      badge.textContent = 'Não configurado';
      badge.className = 'badge badge--warning';
    }
    state.emailSettings.configured = false;
    showToast('Configurações de e-mail resetadas.', 'info');
  };

  window.switchEmailTemplate = (templateName) => {
    state.activeEmailTemplate = templateName;
    const views = {
      credito: document.getElementById('emailPreviewCredito'),
      ativacao: document.getElementById('emailPreviewAtivacao'),
      saldo: document.getElementById('emailPreviewSaldo'),
      vencimento: document.getElementById('emailPreviewVencimento')
    };

    const buttons = {
      credito: document.getElementById('btnTplCredito'),
      ativacao: document.getElementById('btnTplAtivacao'),
      saldo: document.getElementById('btnTplSaldo'),
      vencimento: document.getElementById('btnTplVencimento')
    };

    Object.keys(views).forEach(k => {
      if (views[k]) {
        views[k].style.display = k === templateName ? 'block' : 'none';
      }
      if (buttons[k]) {
        if (k === templateName) {
          buttons[k].classList.remove('btn--ghost');
          buttons[k].classList.add('btn--primary');
        } else {
          buttons[k].classList.remove('btn--primary');
          buttons[k].classList.add('btn--ghost');
        }
      }
    });
  };

  window.openEmailTestModal = () => {
    openModal('emailTestModal');
  };

  window.executeEmailTestSimulation = () => {
    const dest = document.getElementById('testEmailRecipient')?.value.trim();
    if (!dest) {
      showToast('Informe o e-mail de destino para o teste.', 'error');
      return;
    }
    closeModal('emailTestModal');
    showToast(`Disparo demonstrativo enviado para ${dest} na fila de mensageria!`, 'success');
  };

  window.viewEmailInQueue = (id) => {
    const modalBody = document.getElementById('emailModalBody');
    const modalTitle = document.getElementById('emailModalTitle');
    if (modalTitle) modalTitle.textContent = `Prévia do Envio #${id}`;

    if (modalBody) {
      modalBody.innerHTML = `
        <div style="background: white; border: 1px solid var(--color-border); border-radius: 8px; padding: 20px;">
          <div style="font-size: 13px; color: var(--color-text-secondary); margin-bottom: 12px; border-bottom: 1px solid var(--color-border); padding-bottom: 10px;">
            <strong>De:</strong> DMX CashBack &lt;institucional@empresa.com.br&gt;<br>
            <strong>Para:</strong> [Nome do Cliente] &lt;[E-mail do Cliente]&gt;<br>
            <strong>Data:</strong> 13/10/2026 às 14:15 · <em>Entregue com sucesso</em>
          </div>
          <h4 style="font-size: 16px; color: var(--brand-dark); font-weight: 700; margin-bottom: 8px;">DMX CashBack | Crédito de cashback registrado</h4>
          <p style="font-size: 13px; line-height: 1.6; margin-bottom: 12px;">Olá, [Nome do Cliente], informamos que seu crédito de [Valor do Cashback] foi registrado com sucesso.</p>
          <div style="background: #E8F4EC; padding: 12px; border-radius: 6px; font-weight: 700; color: var(--brand-main); margin-bottom: 12px;">
            Valor Creditado: [Valor do Cashback] · Validade: Conforme regulamento
          </div>
          <p style="font-size: 12px; color: var(--neutral-600);">Equipe DMX CashBack · [Nome da Empresa]</p>
        </div>
      `;
    }
    openModal('emailPreviewModal');
  };

  window.simulateResend = (id) => {
    showToast(`Reenvio do disparo #${id} processado com sucesso!`, 'success');
  };

  window.simulateResendFromModal = () => {
    closeModal('emailPreviewModal');
    showToast('E-mail colocado na fila prioritária de reenvio.', 'success');
  };
}

/* ── Alternador de Perfil (Admin vs Operador/Cliente) ── */
function toggleUserRole() {
  state.isAdminMode = !state.isAdminMode;
  document.body.classList.toggle('role--admin', state.isAdminMode);

  const roleBtn = document.getElementById('roleToggleBtn');
  const roleLabel = document.getElementById('roleLabel');

  if (roleBtn && roleLabel) {
    if (state.isAdminMode) {
      roleBtn.className = 'topbar-role-pill topbar-role-pill--admin';
      roleLabel.textContent = 'Perfil: Administrador';
      showToast('Perfil alternado para Administrador (acesso completo às configurações).', 'info');
    } else {
      roleBtn.className = 'topbar-role-pill topbar-role-pill--client';
      roleLabel.textContent = 'Perfil: Operador';
      showToast('Perfil alternado para Operador (configurações administrativas restritas).', 'warning');
      if (['empresas', 'usuarios', 'comunicacao'].includes(state.activePage)) {
        navigateTo('dashboard');
      }
    }
  }
}

/* ── Refresh Button ──────────────────────────────────── */
function initRefreshButtons() {
  $$('[data-action="refresh"]').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.add('spinning');
      showToast('Dados atualizados com sucesso.', 'success');
      setTimeout(() => btn.classList.remove('spinning'), 800);
    });
  });
}

/* ── Table Row Selection ─────────────────────────────── */
function initTableSelection() {
  $$('.data-table tbody tr').forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.closest('button') || e.target.closest('a')) return;
      const isSelected = row.classList.contains('row--selected');
      $$('.data-table tbody tr').forEach(r => r.classList.remove('row--selected'));
      if (!isSelected) row.classList.add('row--selected');
    });
  });
}

/* ── Responsive Resize ───────────────────────────────── */
function handleResize() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (window.innerWidth >= 1024) {
    sidebar?.classList.remove('sidebar--open');
    overlay?.classList.remove('active');
    state.sidebarOpen = false;
  }
}

/* ── Init ─────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Configurar classe de perfil inicial
  document.body.classList.add('role--admin');

  initSidebar();
  initNavigation();
  initNotifications();
  initAuth();
  initCompanySelector();
  initTableSearchAndFilters();
  initModals();
  initDeleteConfirmation();
  initImportWorkflow();
  initFAB();
  initRefreshButtons();
  initTableSelection();

  // Módulos Especializados
  initDmxAssist();
  initConsultaRegistros();
  initComunicacaoEmails();
  initCalendar();
  initPaymentsHistory();

  // Iniciar na tela de Dashboard e atualizar identificação visual
  updateCompanyAndUserDisplay();
  navigateTo('dashboard');

  // Expor para acesso global
  window.navigateTo = navigateTo;
  window.showToast = showToast;
  window.openModal = openModal;
  window.closeModal = closeModal;
  window.confirmDelete = confirmDelete;
  window.logout = logout;
  window.toggleUserRole = toggleUserRole;
  window.updateCompanyAndUserDisplay = updateCompanyAndUserDisplay;

  window.addEventListener('resize', handleResize);
});
