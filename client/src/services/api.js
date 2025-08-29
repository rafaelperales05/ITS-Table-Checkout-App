import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const organizationsApi = {
  getAll: (params) => api.get('/organizations', { params }),
  getById: (id) => api.get(`/organizations/${id}`),
  create: (data) => api.post('/organizations', data),
  update: (id, data) => api.put(`/organizations/${id}`, data),
  searchMatches: (name) => api.post('/organizations/search-matches', { name }),
  validateCheckout: (name) => api.post('/organizations/validate-checkout', { name }),
  ban: (id, reason) => api.post(`/organizations/${id}/ban`, { reason }),
  unban: (id) => api.post(`/organizations/${id}/unban`),
  scrape: () => api.post('/organizations/scrape'),
};

export const tablesApi = {
  getAll: (params) => api.get('/tables', { params }),
  getById: (id) => api.get(`/tables/${id}`),
  create: (data) => api.post('/tables', data),
  update: (id, data) => api.put(`/tables/${id}`, data),
  delete: (id) => api.delete(`/tables/${id}`),
};

export const checkoutsApi = {
  getAll: (params) => api.get('/checkouts', { params }),
  getActive: () => api.get('/checkouts/active'),
  getOverdue: () => api.get('/checkouts/overdue'),
  getStats: () => api.get('/checkouts/stats'),
  getById: (id) => api.get(`/checkouts/${id}`),
  create: (data) => api.post('/checkouts', data),
  returnCheckout: (id, data) => api.post(`/checkouts/${id}/return`, data),
};

export const healthApi = {
  check: () => api.get('/health'),
};

export default api;