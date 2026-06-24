import axios from 'axios';

const API = axios.create({
  baseURL: '', // Using Vite proxy configured in vite.config.js
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle session expiration
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // If we are not on the login page already, reload to trigger auth state reset
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (name, email, password) => API.post('/api/auth/register', { name, email, password }),
  login: (email, password) => API.post('/api/auth/login', { email, password }),
  logout: () => API.post('/api/auth/logout'),
  getMe: () => API.get('/api/auth/me'),
};

export const newsAPI = {
  check: (claim) => API.post('/api/news/check', { claim }),
  analyze: (claim) => API.post('/api/news/analyze', { claim }),
  urlCheck: (url) => API.post('/api/news/url-check', { url }),

  agentAnalyze: (claim) =>
    API.post('/api/news/agent-analyze', { claim }),
};

export const articlesAPI = {
  save: (article) => API.post('/api/users/saved-articles', article),
  getAll: () => API.get('/api/users/saved-articles'),
  delete: (id) => API.delete(`/api/users/saved-articles/${id}`),
};

export const reportsAPI = {
  submit: (title, description) => API.post('/api/reports', { title, description }),
  getAll: () => API.get('/api/reports'),
};

export const adminAPI = {
  getAnalytics: () => API.get('/api/admin/analytics'),
  getUsers: () => API.get('/api/admin/users'),
  deleteUser: (id) => API.delete(`/api/admin/users/${id}`),
  getReports: () => API.get('/api/admin/reports'),
  updateReport: (id, data) => API.put(`/api/admin/reports/${id}`, data),
  deleteReport: (id) => API.delete(`/api/admin/reports/${id}`),
  getFactChecks: () => API.get('/api/admin/factchecks'),
  deleteFactCheck: (id) => API.delete(`/api/admin/factchecks/${id}`),
};

export default API;
