import axios from 'axios';

// Automatically detect the right API URL based on environment
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';


const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Better error logging that handles objects properly
    const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Unknown error';
    console.error('API Error:', errorMessage);
    console.error('Full error details:', {
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method
    });
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
  ban: (id, data) => api.post(`/organizations/${id}/ban`, data),
  unban: (id) => api.post(`/organizations/${id}/unban`),
  scrape: () => api.post('/organizations/scrape'),
};

export const tablesApi = {
  getAll: (params) => api.get('/tables', { params }),
  getById: (id) => api.get(`/tables/${id}`),
  create: (data) => api.post('/tables', data),
  update: (id, data) => api.put(`/tables?id=${id}`, data),
  delete: (id) => api.delete(`/tables?id=${id}`),
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