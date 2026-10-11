const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001/api';

/**
 * Universal fetch client with automatic JWT token injection and JSON parsing
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('fabricare_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);
  
  if (response.status === 204) {
    return { data: null, status: 204 };
  }

  const contentType = response.headers.get('content-type');
  const data = contentType && contentType.includes('application/json') 
    ? await response.json() 
    : await response.text();

  if (!response.ok) {
    const error = new Error(data?.error || data?.detail || `HTTP Error ${response.status}`);
    error.response = { data, status: response.status };
    throw error;
  }

  return { data, status: response.status };
}

const apiClient = {
  get: (url, config = {}) => {
    let finalUrl = url;
    if (config.params) {
      const qs = new URLSearchParams(config.params).toString();
      finalUrl += (url.includes('?') ? '&' : '?') + qs;
    }
    return request(finalUrl, { method: 'GET', ...config });
  },
  post: (url, body, config = {}) => request(url, { method: 'POST', body, ...config }),
  put: (url, body, config = {}) => request(url, { method: 'PUT', body, ...config }),
  patch: (url, body, config = {}) => request(url, { method: 'PATCH', body, ...config }),
  delete: (url, config = {}) => request(url, { method: 'DELETE', ...config })
};

// AUTH APIS
export const authApi = {
  login: (username, password) => apiClient.post('/auth/login/', { username, password }),
  register: (data) => apiClient.post('/auth/register/', data),
  getMe: () => apiClient.get('/auth/me/'),
  getStaffList: (role = '') => apiClient.get(`/staff/${role ? `?role=${role}` : ''}`),
};

// SERVICES APIS
export const servicesApi = {
  getCategories: () => apiClient.get('/services/categories/'),
  getServices: (category = '') => apiClient.get(`/services/${category ? `?category=${category}` : ''}`),
};

// ORDERS APIS
export const ordersApi = {
  getOrders: (params = {}) => apiClient.get('/orders/', { params }),
  getOrderById: (id) => apiClient.get(`/orders/${id}/`),
  createOrder: (orderData) => apiClient.post('/orders/', orderData),
  cancelOrder: (id, reason = '') => apiClient.post(`/orders/${id}/cancel/`, { reason }),
};

// ADMIN APIS
export const adminApi = {
  getDashboardStats: () => apiClient.get('/admin/dashboard/'),
  acceptOrder: (orderId, notes = '') => apiClient.post(`/admin/orders/${orderId}/accept/`, { notes }),
  rejectOrder: (orderId, reason = '') => apiClient.post(`/admin/orders/${orderId}/reject/`, { reason }),
  assignStaff: (orderId, data) => apiClient.post(`/admin/orders/${orderId}/assign-staff/`, data),
};

// DELIVERY STAFF APIS
export const deliveryApi = {
  getTasks: (type = '') => apiClient.get(`/delivery/tasks/${type ? `?type=${type}` : ''}`),
  confirmPickup: (orderId, data) => apiClient.post(`/delivery/tasks/${orderId}/confirm-pickup/`, data),
  dropoffLaundry: (orderId, data) => apiClient.post(`/delivery/tasks/${orderId}/dropoff-laundry/`, data),
  confirmDelivery: (orderId, data) => apiClient.post(`/delivery/tasks/${orderId}/confirm-delivery/`, data),
  failDelivery: (orderId, data) => apiClient.post(`/delivery/tasks/${orderId}/fail-delivery/`, data),
};

// LAUNDRY STAFF APIS
export const laundryApi = {
  getOrders: (stage = '') => apiClient.get(`/laundry/orders/${stage ? `?stage=${stage}` : ''}`),
  confirmReceipt: (orderId, data) => apiClient.post(`/laundry/orders/${orderId}/confirm-receipt/`, data),
  advanceStage: (orderId, data) => apiClient.post(`/laundry/orders/${orderId}/advance-stage/`, data),
  qualityCheck: (orderId, data) => apiClient.post(`/laundry/orders/${orderId}/quality-check/`, data),
  packOrder: (orderId, data) => apiClient.post(`/laundry/orders/${orderId}/pack/`, data),
};

// ADDRESSES APIS
export const addressApi = {
  getAddresses: () => apiClient.get('/addresses/'),
  createAddress: (data) => apiClient.post('/addresses/', data),
  updateAddress: (id, data) => apiClient.put(`/addresses/${id}/`, data),
  deleteAddress: (id) => apiClient.delete(`/addresses/${id}/`),
};

// INVOICES APIS
export const invoicesApi = {
  getInvoices: () => apiClient.get('/invoices/'),
  getInvoiceById: (id) => apiClient.get(`/invoices/${id}/`),
};

// NOTIFICATIONS APIS
export const notificationsApi = {
  getNotifications: () => apiClient.get('/notifications/'),
  markRead: (id) => apiClient.post(`/notifications/${id}/mark-read/`),
  markAllRead: () => apiClient.post('/notifications/mark-all-read/'),
};

// SUPPORT APIS
export const supportApi = {
  getTickets: () => apiClient.get('/support/'),
  createTicket: (data) => apiClient.post('/support/', data),
};

// CONTENT APIS
export const contentApi = {
  getFaqs: () => apiClient.get('/faqs/'),
  getPolicies: () => apiClient.get('/policies/'),
};

export default apiClient;
