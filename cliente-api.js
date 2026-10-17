/**
 * DMX CashBack — Camada de Serviço de API da Área do Cliente
 * js/cliente-api.js
 * ──────────────────────────────────────────────────────────
 * Abstração de chamadas para o futuro backend Java (Spring Boot REST).
 * Nesta etapa, consome os dados centralizados de DMX_CLIENT_DATA e a sessão
 * ativa do consumidor, sem dados fictícios de demonstração.
 * 
 * Mapeamento de endpoints para o backend Java:
 * - GET  /api/v1/client/profile        -> getProfile()
 * - GET  /api/v1/client/balances       -> getBalances()
 * - GET  /api/v1/client/transactions   -> getTransactions(filters)
 * - GET  /api/v1/client/stores         -> getStores(filters)
 * - GET  /api/v1/client/stores/{id}    -> getStoreById(storeId)
 * - GET  /api/v1/client/notifications -> getNotifications()
 * - POST /api/v1/client/redemptions    -> generateRedemptionCode(storeId, amount)
 */

'use strict';

const ClientApiService = {
  /**
   * Obtém a sessão ativa do consumidor armazenada temporariamente no navegador.
   * Em produção com backend Java, a validação de sessão será gerenciada por
   * Cookie HttpOnly contendo JWT assinado com chave criptográfica no servidor.
   */
  getActiveSession() {
    try {
      const raw = sessionStorage.getItem('dmx_client_session');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  /**
   * Obtém os dados do perfil do cliente autenticado.
   * Futuro endpoint Java: GET /api/v1/client/profile
   */
  async getProfile() {
    return new Promise(resolve => {
      setTimeout(() => {
        const session = this.getActiveSession();
        if (session) {
          resolve({
            success: true,
            data: {
              name: session.name || 'Consumidor',
              email: session.email || '',
              cpf: session.cpf || 'Não informado',
              phone: session.phone || 'Não informado',
              originStore: session.originStore || 'Loja Credenciada',
              memberSince: session.memberSince || new Date().toLocaleDateString('pt-BR'),
              status: 'Ativo'
            }
          });
        } else {
          resolve({ success: false, data: null, error: 'Sessão não encontrada' });
        }
      }, 50);
    });
  },

  /**
   * Obtém os saldos consolidados e métricas.
   * Futuro endpoint Java: GET /api/v1/client/balances
   */
  async getBalances() {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ success: true, data: { ...DMX_CLIENT_DATA.balances } });
      }, 50);
    });
  },

  /**
   * Obtém o extrato com filtros opcionais.
   * Futuro endpoint Java: GET /api/v1/client/transactions?type={type}&storeId={id}
   */
  async getTransactions(filters = {}) {
    return new Promise(resolve => {
      setTimeout(() => {
        let list = [...(DMX_CLIENT_DATA.transactions || [])];

        // Filtro por tipo: all | credit | debit
        if (filters.type && filters.type !== 'all') {
          if (filters.type === 'credit') {
            list = list.filter(t => t.cashbackValue > 0 || t.type === 'credit');
          } else if (filters.type === 'debit') {
            list = list.filter(t => t.cashbackValue < 0 || t.type === 'debit');
          } else {
            list = list.filter(t => t.type === filters.type);
          }
        }

        // Filtro por loja
        if (filters.storeId && filters.storeId !== 'all') {
          list = list.filter(t => t.storeId === parseInt(filters.storeId, 10));
        }

        // Filtro por período
        if (filters.period && filters.period !== 'all') {
          list = list.filter(t => t.periodKey === filters.period);
        }

        // Busca textual
        if (filters.query) {
          const q = filters.query.toLowerCase();
          list = list.filter(t =>
            (t.storeName && t.storeName.toLowerCase().includes(q)) ||
            (t.doc && t.doc.toLowerCase().includes(q)) ||
            (t.desc && t.desc.toLowerCase().includes(q))
          );
        }

        resolve({ success: true, total: list.length, data: list });
      }, 60);
    });
  },

  /**
   * Obtém a lista de lojas parceiras com filtros.
   * Futuro endpoint Java: GET /api/v1/client/stores
   */
  async getStores(filters = {}) {
    return new Promise(resolve => {
      setTimeout(() => {
        let list = [...(DMX_CLIENT_DATA.stores || [])];

        if (filters.category && filters.category !== 'all') {
          list = list.filter(s => s.categoryKey === filters.category);
        }

        if (filters.query) {
          const q = filters.query.toLowerCase();
          list = list.filter(s =>
            (s.name && s.name.toLowerCase().includes(q)) ||
            (s.category && s.category.toLowerCase().includes(q)) ||
            (s.address && s.address.toLowerCase().includes(q))
          );
        }

        resolve({ success: true, total: list.length, data: list });
      }, 50);
    });
  },

  /**
   * Obtém uma loja específica por ID.
   * Futuro endpoint Java: GET /api/v1/client/stores/{id}
   */
  async getStoreById(storeId) {
    return new Promise(resolve => {
      setTimeout(() => {
        const store = (DMX_CLIENT_DATA.stores || []).find(s => s.id === parseInt(storeId, 10));
        resolve({ success: !!store, data: store || null });
      }, 30);
    });
  },

  /**
   * Obtém as notificações da conta.
   * Futuro endpoint Java: GET /api/v1/client/notifications
   */
  async getNotifications() {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ success: true, data: [...(DMX_CLIENT_DATA.notifications || [])] });
      }, 40);
    });
  },

  /**
   * Solicita a geração de um código temporário de autorização para resgate.
   * Futuro endpoint Java: POST /api/v1/client/redemptions/generate-code
   */
  async generateRedemptionCode(storeId, amount) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const balances = DMX_CLIENT_DATA.balances;
        const requested = parseFloat(amount);

        if (isNaN(requested) || requested <= 0) {
          resolve({ success: false, error: 'Informe um valor válido maior que zero.' });
          return;
        }

        if (requested > balances.available) {
          resolve({
            success: false,
            error: `Saldo insuficiente. Seu saldo disponível é de R$ ${balances.available.toFixed(2).replace('.', ',')}.`
          });
          return;
        }

        // Gera token OTP numérico de 6 dígitos válido por 15 minutos
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        resolve({
          success: true,
          data: {
            code,
            amount: requested,
            storeId,
            expiresAt: expiresAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            expiresInSeconds: 900
          }
        });
      }, 200);
    });
  }
};
