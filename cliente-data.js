/**
 * DMX CashBack — Camada de Dados da Área do Cliente
 * js/cliente-data.js
 * ──────────────────────────────────────────────────────────
 * Estrutura preparada para receber dados reais da futura API REST Java.
 * Por padrão, o sistema inicia LIMPO (sem dados fictícios de demonstração),
 * exibindo estados vazios profissionais até que o cliente realize transações.
 */

'use strict';

/**
 * Estado inicial limpo do cliente para ambiente de produção / dados reais.
 * Valores zerados e listas vazias sem registros inventados.
 */
const DMX_CLIENT_INITIAL_STATE = {
  // Informações do perfil do consumidor autenticado (inicialmente nulo até login)
  client: null,

  // Consolidação de saldos reais de cashback (inicialmente zero)
  balances: {
    available: 0.00,
    expiring: 0.00,
    expiringDate: null,
    lifetimeEarned: 0.00,
    lifetimeUsed: 0.00
  },

  // Lojas parceiras credenciadas (alimentadas pelo backend Java)
  stores: [],

  // Extrato detalhado de movimentações (alimentado pelo backend Java)
  transactions: [],

  // Notificações transacionais reais da conta
  notifications: []
};

// Referência global ativa inicializada com o estado limpo
let DMX_CLIENT_DATA = { ...DMX_CLIENT_INITIAL_STATE };
