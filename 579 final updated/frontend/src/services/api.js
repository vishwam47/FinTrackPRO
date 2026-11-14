import axios from 'axios';

const configuredApiBase = import.meta.env.VITE_API_BASE_URL || '';
const isLocalHost = (value) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(?:\/|$)/i.test(value);
export const API_BASE_URL = import.meta.env.PROD && isLocalHost(configuredApiBase) ? '' : configuredApiBase;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const userAPI = {
  register: (data) => api.post('/api/user/signup', data),
  login: (data) => api.post('/api/user/login', data),
  getProfile: () => api.post('/api/user/getuser'),
};

export const expenseAPI = {
  create: (data) => api.post('/api/expense/create', data),
  getAll: () => api.post('/api/expense/get'),
  update: (data) => api.post('/api/expense/update', data),
  delete: (_userId, expenseId) => api.post('/api/expense/delete', { expenseId }),
};

export const incomeAPI = {
  create: (data) => api.post('/api/income/create', data),
  getAll: () => api.post('/api/income/get'),
  update: (data) => api.post('/api/income/update', data),
  delete: (_userId, incomeId) => api.post('/api/income/delete', { incomeId }),
};

export const budgetAPI = {
  create: (data) => api.post('/api/budget/create', data),
  getAll: () => api.post('/api/budget/get'),
  update: (data) => api.post('/api/budget/update', data),
  delete: (_userId, budgetId) => api.post('/api/budget/delete', { budgetId }),
};

export const goalAPI = {
  create: (data) => api.post('/api/goal/create', data),
  getAll: () => api.post('/api/goal/get'),
  update: (data) => api.post('/api/goal/update', data),
  delete: (_userId, goalId) => api.post('/api/goal/delete', { goalId }),
};

export const loanAPI = {
  create: (data) => api.post('/api/loan/create', data),
  getAll: () => api.post('/api/loan/get'),
  update: (data) => api.post('/api/loan/update', data),
  delete: (_userId, loanId) => api.post('/api/loan/delete', { loanId }),
};

export const notificationAPI = {
  getAll: () => api.post('/api/notification/get'),
  markAsRead: (notificationId) => api.post('/api/notification/update', { notificationId, isRead: true }),
};

export const financeAPI = {
  analyze: (data) => api.post('/api/finance/analyze', data),
  getProfile: (month) => api.get(`/api/finance/profile?month=${month}`),
};

export default api;
