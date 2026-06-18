import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

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
  register: (data) => api.post('/api/user/register', data),
  login: (data) => api.post('/api/user/login', data),
  getProfile: (userId) => api.post('/api/user/profile', { userId }),
  updateProfile: (data) => api.post('/api/user/update', data),
  forgotPassword: (email) => api.post('/api/user/forgot-password', { email }),
};

export const expenseAPI = {
  create: (data) => api.post('/api/expense/create', data),
  getAll: (userId) => api.post('/api/expense/get', { userId }),
  update: (data) => api.post('/api/expense/update', data),
  delete: (userId, expenseId) => api.post('/api/expense/delete', { userId, expenseId }),
};

export const incomeAPI = {
  create: (data) => api.post('/api/income/create', data),
  getAll: (userId) => api.post('/api/income/get', { userId }),
  update: (data) => api.post('/api/income/update', data),
  delete: (userId, incomeId) => api.post('/api/income/delete', { userId, incomeId }),
};

export const budgetAPI = {
  create: (data) => api.post('/api/budget/create', data),
  getAll: (userId) => api.post('/api/budget/get', { userId }),
  update: (data) => api.post('/api/budget/update', data),
  delete: (userId, budgetId) => api.post('/api/budget/delete', { userId, budgetId }),
};

export const goalAPI = {
  create: (data) => api.post('/api/goal/create', data),
  getAll: (userId) => api.post('/api/goal/get', { userId }),
  update: (data) => api.post('/api/goal/update', data),
  delete: (userId, goalId) => api.post('/api/goal/delete', { userId, goalId }),
};

export const loanAPI = {
  create: (data) => api.post('/api/loan/create', data),
  getAll: (userId) => api.post('/api/loan/get', { userId }),
  update: (data) => api.post('/api/loan/update', data),
  delete: (userId, loanId) => api.post('/api/loan/delete', { userId, loanId }),
};

export const notificationAPI = {
  getAll: (userId) => api.post('/api/notification/get', { userId }),
  markAsRead: (notificationId) => api.post('/api/notification/mark-read', { notificationId }),
};

export const financeAPI = {
  analyze: (data) => api.post('/api/finance/analyze', data),
  getProfile: (month) => api.get(`/api/finance/profile?month=${month}`),
};

export const emailAPI = {
  sendOTP: (email) => api.post('/api/send-otp', { email }),
  sendBudgetAlert: (data) => api.post('/api/send-budget-alert', data),
};

export default api;