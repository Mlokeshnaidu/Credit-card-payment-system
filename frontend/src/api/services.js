import { djangoAPI, fastapiAPI } from './axios';

export const authAPI = {
  register: (data) => djangoAPI.post('/api/auth/register/', data),
  login: (data) => djangoAPI.post('/api/auth/login/', data),
  logout: (refresh) => djangoAPI.post('/api/auth/logout/', { refresh }),
  getProfile: () => djangoAPI.get('/api/auth/profile/'),
  updateProfile: (data) => djangoAPI.put('/api/auth/profile/', data),
  changePassword: (data) => djangoAPI.post('/api/auth/change-password/', data),
};

export const cardAPI = {
  getCards: () => djangoAPI.get('/api/cards/'),
  addCard: (data) => djangoAPI.post('/api/cards/', data),
  deleteCard: (id) => djangoAPI.delete(`/api/cards/${id}/`),
  setDefault: (id) => djangoAPI.post(`/api/cards/${id}/set-default/`),
};

export const dashboardAPI = {
  getSummary: () => fastapiAPI.get('/dashboard/summary'),
};

export const transactionAPI = {
  getTransactions: (params) => djangoAPI.get('/api/transactions/', { params }),
  makePayment: (data) => djangoAPI.post('/api/transactions/pay/', data),
  getTransaction: (id) => djangoAPI.get(`/api/transactions/${id}/`),
  downloadStatementPDF: (params) =>
    djangoAPI.get('/api/transactions/statement/pdf/', {
      params,
      responseType: 'blob',
    }),
};

export const adminAPI = {
  getDashboard: () => djangoAPI.get('/api/admin-panel/dashboard/'),
  getUsers: (params) => djangoAPI.get('/api/admin-panel/users/', { params }),
  toggleUser: (id) => djangoAPI.patch(`/api/admin-panel/users/${id}/toggle/`),
  getCards: (params) => djangoAPI.get('/api/admin-panel/cards/', { params }),
  toggleCardBlock: (id, data) => djangoAPI.patch(`/api/admin-panel/cards/${id}/toggle-block/`, data || {}),
  updateCreditLimit: (id, credit_limit) => djangoAPI.patch(`/api/admin-panel/cards/${id}/update-limit/`, { credit_limit }),
  getCardActivity: (id) => djangoAPI.get(`/api/admin-panel/cards/${id}/activity/`),
  getTransactions: (params) => djangoAPI.get('/api/admin-panel/transactions/', { params }),
  exportCSV: (params) => djangoAPI.get('/api/admin-panel/transactions/export/', { params, responseType: 'blob' }),
  getDailySummary: (date) => djangoAPI.get('/api/admin-panel/daily-summary/', { params: { date } }),
  getLogs: (params) => djangoAPI.get('/api/admin-panel/logs/', { params }),
};
