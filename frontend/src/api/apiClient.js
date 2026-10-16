import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';

let activeBaseUrl = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8001/api').replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR', fields = {}, status = 500) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.fields = fields;
    this.status = status;
  }
}

async function getAuthToken(forceRefresh = false) {
  if (auth?.currentUser) {
    try {
      return await auth.currentUser.getIdToken(forceRefresh);
    } catch (e) {
      console.warn('Failed to get Firebase ID token:', e);
    }
  }
  const token = localStorage.getItem('fabricare_token');
  if (token && typeof token === 'string') {
    // If an unsegmented dummy token is in storage, discard it to avoid 401 segment errors
    if (token.startsWith('fabricare_demo_token_') || token.split('.').length !== 3) {
      localStorage.removeItem('fabricare_token');
      return null;
    }
    return token;
  }
  return null;
}

export async function request(endpoint, options = {}, isRetry = false) {
  const token = await getAuthToken(isRetry);
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers
  };

  if (config.body && typeof config.body === 'object' && !isFormData) {
    config.body = JSON.stringify(config.body);
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http') ? endpoint : `${activeBaseUrl}${cleanEndpoint}`;

  let response;
  try {
    response = await fetch(url, config);
  } catch (err) {
    // If connection was refused on active port, automatically try alternate port (8000 <-> 8001)
    if (!endpoint.startsWith('http') && (activeBaseUrl.includes(':8000') || activeBaseUrl.includes(':8001'))) {
      const altBaseUrl = activeBaseUrl.includes(':8000')
        ? activeBaseUrl.replace(':8000', ':8001')
        : activeBaseUrl.replace(':8001', ':8000');
      try {
        const altUrl = `${altBaseUrl}${cleanEndpoint}`;
        response = await fetch(altUrl, config);
        activeBaseUrl = altBaseUrl; // Permanently switch to working port
      } catch (fallbackErr) {
        throw new ApiError('Unable to connect to backend server. Please verify network or server status.', 'NETWORK_ERROR', {}, 0);
      }
    } else {
      throw new ApiError('Unable to connect to backend server. Please verify network or server status.', 'NETWORK_ERROR', {}, 0);
    }
  }

  if (response.status === 401 && !isRetry && auth?.currentUser) {
    // Retry once with refreshed token
    try {
      return await request(endpoint, options, true);
    } catch (retryErr) {
      if (retryErr.status === 401) {
        try {
          await signOut(auth);
        } catch (_) {}
        localStorage.removeItem('fabricare_token');
        localStorage.removeItem('fabricare_user');
        window.location.hash = '#login';
      }
      throw retryErr;
    }
  }

  if (response.status === 204) {
    return { data: null, status: 204 };
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const bodyData = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    let errCode = 'SERVER_ERROR';
    let errMsg = `HTTP Error ${response.status}`;
    let errFields = {};

    if (bodyData && typeof bodyData === 'object') {
      if (bodyData.error) {
        errCode = bodyData.error.code || errCode;
        errMsg = bodyData.error.message || errMsg;
        errFields = bodyData.error.fields || {};
      } else if (bodyData.detail) {
        errMsg = typeof bodyData.detail === 'string' ? bodyData.detail : JSON.stringify(bodyData.detail);
      }
    }
    const apiErr = new ApiError(errMsg, errCode, errFields, response.status);
    apiErr.response = { data: bodyData, status: response.status };
    throw apiErr;
  }

  return { data: bodyData, status: response.status };
}

const buildQuery = (params = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      searchParams.append(key, val);
    }
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
};

export const apiClient = {
  get: (url, config = {}) => {
    const finalUrl = config.params ? `${url}${buildQuery(config.params)}` : url;
    return request(finalUrl, { method: 'GET', ...config });
  },
  post: (url, body, config = {}) => request(url, { method: 'POST', body, ...config }),
  put: (url, body, config = {}) => request(url, { method: 'PUT', body, ...config }),
  patch: (url, body, config = {}) => request(url, { method: 'PATCH', body, ...config }),
  delete: (url, config = {}) => request(url, { method: 'DELETE', ...config })
};

// 1. AUTH API (Registration, Login handled via Firebase Client SDK)
export const authApi = {
  register: (data) => apiClient.post('/auth/register', data),
  getMe: () => apiClient.get('/me'),
  updateMe: (data) => apiClient.patch('/me', data),
  uploadAvatar: (formData) => apiClient.post('/me/avatar', formData),
  deleteAvatar: () => apiClient.delete('/me/avatar')
};

// 2. SHARED USER & NOTIFICATION APIS
export const userApi = {
  getMe: () => apiClient.get('/me'),
  updateProfile: (data) => apiClient.patch('/me', data),
  uploadAvatar: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return apiClient.post('/me/avatar', fd);
  },
  deleteAvatar: () => apiClient.delete('/me/avatar')
};

export const notificationsApi = {
  getNotifications: (params = {}) => apiClient.get('/notifications', { params }),
  getUnreadCount: () => apiClient.get('/notifications/unread-count'),
  markRead: (id) => apiClient.patch(`/notifications/${id}/read`),
  markAllRead: () => apiClient.patch('/notifications/read-all')
};

// 3. CUSTOMER PORTAL APIS
export const normalizeOrder = (o) => {
  if (!o || typeof o !== 'object') return o;
  const addressStr = o.pickup_address || (o.address ? [o.address.line1, o.address.city, o.address.pincode].filter(Boolean).join(', ') : 'Default Location');
  const pickupDate = o.pickup_date || o.pickup?.date || (o.created_at ? o.created_at.split('T')[0] : 'Today');
  const pickupSlot = o.pickup_time_slot || (o.pickup?.from && o.pickup?.to ? `${o.pickup.from} – ${o.pickup.to}` : (o.pickup?.time_slot || '10:00 AM – 12:00 PM'));
  const totalAmount = o.total_amount ?? (o.total_paise != null ? (Number(o.total_paise) / 100).toFixed(2) : (o.estimated_amount != null ? Number(o.estimated_amount).toFixed(2) : '0.00'));
  
  const normItems = Array.isArray(o.items) ? o.items.map(it => ({
    ...it,
    item_name: it.item_name || it.garment || it.name || 'Laundry Item',
    service_name: it.service_name || (Array.isArray(it.services) && it.services[0]?.name) || (it.service ? it.service.name : 'Wash & Fold'),
    quantity: it.quantity ?? 1,
    price: it.price ?? (it.unit_price_paise != null ? it.unit_price_paise / 100 : 0)
  })) : [];

  const orderNum = o.order_number || o.code || (o.id ? `#${o.id}` : '#FC1001');

  return {
    ...o,
    id: o.id || orderNum,
    code: o.code || orderNum,
    order_number: orderNum,
    pickup_address: addressStr,
    delivery_address: o.delivery_address || addressStr,
    pickup_date: pickupDate,
    pickup_time_slot: pickupSlot,
    total_amount: totalAmount,
    estimated_amount: o.estimated_amount ?? totalAmount,
    payment_status: (o.payment_status || 'PENDING').toUpperCase(),
    status: o.status || 'PENDING',
    items: normItems,
    invoice_number: o.invoice_id || o.invoice_no || `INV-${orderNum.replace('#', '')}`,
    invoice_date: o.placed_at ? o.placed_at.split('T')[0] : (o.created_at ? o.created_at.split('T')[0] : pickupDate)
  };
};

export const customerApi = {
  getCatalog: () => apiClient.get('/customer/catalog'),
  getAddresses: () => apiClient.get('/customer/addresses'),
  createAddress: (data) => apiClient.post('/customer/addresses', data),
  updateAddress: (id, data) => apiClient.patch(`/customer/addresses/${id}`, data),
  deleteAddress: (id) => apiClient.delete(`/customer/addresses/${id}`),
  createOrder: (data) => apiClient.post('/customer/orders', data),
  getOrders: async (params = {}) => {
    const res = await apiClient.get('/customer/orders', { params: { page_size: 50, ...params } });
    const raw = res.data;
    const rawList = Array.isArray(raw) ? raw : (raw?.items || raw?.results || []);
    const items = rawList.map(normalizeOrder);
    return { ...res, data: items, items, results: items, total: raw?.total ?? items.length };
  },
  getOrder: async (id) => {
    const res = await apiClient.get(`/customer/orders/${id}`);
    const normalized = normalizeOrder(res.data);
    return { ...res, data: normalized };
  },
  cancelOrder: (id, reason = '') => apiClient.post(`/customer/orders/${id}/cancel`, { reason }),
  payOrder: (id, method = 'upi') => apiClient.post(`/customer/orders/${id}/pay`, { method }),
  verifyPayment: (payment_id, gateway_payload) => apiClient.post('/payments/verify', { payment_id, gateway_payload }),
  getPayments: (params = {}) => apiClient.get('/customer/payments', { params }),
  getOrderTracking: (id) => apiClient.get(`/customer/orders/${id}/tracking`),
  getInvoices: async (params = {}) => {
    const res = await apiClient.get('/customer/invoices', { params });
    const raw = res.data;
    const list = Array.isArray(raw) ? raw : (raw?.items || raw?.results || []);
    return { ...res, data: list, items: list, results: list, total: raw?.total ?? list.length };
  },
  getInvoice: (id) => apiClient.get(`/customer/invoices/${id}`),
  getInvoicePdfUrl: (id) => `${BASE_URL}/customer/invoices/${id}/pdf`,
  createTicket: (data) => apiClient.post('/customer/support/tickets', data),
  getTickets: async (params = {}) => {
    const res = await apiClient.get('/customer/support/tickets', { params });
    const raw = res.data;
    const list = Array.isArray(raw) ? raw : (raw?.items || raw?.results || []);
    return { ...res, data: list, items: list, results: list, total: raw?.total ?? list.length };
  },
  getTicket: (id) => apiClient.get(`/customer/support/tickets/${id}`),
  replyTicket: (id, message) => apiClient.post(`/customer/support/tickets/${id}/messages`, { message })
};

// Compatibility aliases for existing Customer components
export const servicesApi = {
  getCategories: () => customerApi.getCatalog().then(res => ({ data: res.data?.garments || [] })),
  getServices: () => customerApi.getCatalog().then(res => ({ data: res.data?.services || [] }))
};

export const ordersApi = {
  getOrders: async (params = {}) => {
    const res = await apiClient.get('/customer/orders', { params: { page_size: 50, ...params } });
    const raw = res.data;
    const rawList = Array.isArray(raw) ? raw : (raw?.items || raw?.results || []);
    const items = rawList.map(normalizeOrder);
    return {
      ...res,
      data: items,
      items,
      results: items,
      total: raw?.total ?? items.length,
      next_cursor: raw?.next_cursor ?? null
    };
  },
  getOrderById: async (id) => {
    const res = await apiClient.get(`/customer/orders/${id}`);
    const normalized = normalizeOrder(res.data);
    return { ...res, data: normalized };
  },
  createOrder: (data) => apiClient.post('/customer/orders', data),
  cancelOrder: (id, reason = '') => apiClient.post(`/customer/orders/${id}/cancel`, { reason }),
  getTracking: (id) => apiClient.get(`/customer/orders/${id}/tracking`),
  pay: (id, method = 'upi') => apiClient.post(`/customer/orders/${id}/pay`, { method })
};

export const addressApi = {
  getAddresses: async () => {
    const res = await apiClient.get('/customer/addresses');
    const list = Array.isArray(res.data) ? res.data : [];
    const normalized = list.map(a => ({
      ...a,
      title: a.label || a.title || 'Home',
      address_line: a.line1 || a.address_line || '',
      line1: a.line1 || a.address_line || '',
      label: a.label || a.title || 'Home'
    }));
    return { data: normalized, status: res.status };
  },
  createAddress: (data) => {
    const payload = {
      label: data.label || data.title || 'Home',
      line1: data.line1 || data.address_line || 'Bengaluru',
      city: data.city || 'Bengaluru',
      pincode: data.pincode || '560043',
      lat: data.lat || null,
      lng: data.lng || null,
      is_default: Boolean(data.is_default)
    };
    return apiClient.post('/customer/addresses', payload);
  },
  updateAddress: (id, data) => {
    const payload = {};
    if (data.label || data.title) payload.label = data.label || data.title;
    if (data.line1 || data.address_line) payload.line1 = data.line1 || data.address_line;
    if (data.city) payload.city = data.city;
    if (data.pincode) payload.pincode = data.pincode;
    if (data.is_default !== undefined) payload.is_default = Boolean(data.is_default);
    return apiClient.patch(`/customer/addresses/${id}`, payload);
  },
  deleteAddress: (id) => apiClient.delete(`/customer/addresses/${id}`)
};

export const invoicesApi = {
  getInvoices: async (params = {}) => {
    const res = await apiClient.get('/customer/invoices', { params });
    const raw = res.data;
    const list = Array.isArray(raw) ? raw : (raw?.items || raw?.results || []);
    return { ...res, data: list, items: list, results: list, total: raw?.total ?? list.length };
  },
  getInvoiceById: (id) => apiClient.get(`/customer/invoices/${id}`)
};

export const supportApi = {
  getTickets: async (params = {}) => {
    const res = await apiClient.get('/customer/support/tickets', { params });
    const raw = res.data;
    const list = Array.isArray(raw) ? raw : (raw?.items || raw?.results || []);
    return { ...res, data: list, items: list, results: list, total: raw?.total ?? list.length };
  },
  getTicketById: (id) => apiClient.get(`/customer/support/tickets/${id}`),
  createTicket: (data) => apiClient.post('/customer/support/tickets', data),
  replyTicket: (id, data) => apiClient.post(`/customer/support/tickets/${id}/messages`, { message: data.message || data.text || '' })
};

export const complaintsApi = {
  getReports: async (params = {}) => {
    try {
      const res = await apiClient.get('/customer/complaints', { params });
      const raw = res.data;
      const list = Array.isArray(raw) ? raw : (raw?.items || raw?.results || []);
      return { ...res, data: list, items: list, results: list, total: raw?.total ?? list.length };
    } catch {
      return { data: [], items: [], results: [], total: 0 };
    }
  }
};

export const contentApi = {
  getFaqs: () => Promise.resolve({ data: [] }),
  getTerms: () => Promise.resolve({ data: [] })
};

// 4. DELIVERY AGENT PORTAL APIS
export const agentApi = {
  getDashboard: () => apiClient.get('/agent/dashboard'),
  updateAvailability: (is_online) => apiClient.patch('/agent/availability', { is_online }),
  getTasks: (params = {}) => apiClient.get('/agent/tasks', { params }),
  startTask: (id) => apiClient.post(`/agent/tasks/${id}/start`),
  completeTask: (id, data) => apiClient.post(`/agent/tasks/${id}/complete`, data),
  failTask: (id, reason) => apiClient.post(`/agent/tasks/${id}/fail`, { reason }),
  getHistory: (params = {}) => apiClient.get('/agent/tasks/history', { params }),
  sendLocation: (lat, lng) => apiClient.post('/agent/location', { lat, lng }),
  updateVehicle: (data) => apiClient.patch('/agent/vehicle', data)
};

export const deliveryApi = {
  ...agentApi,
  confirmPickup: (id, data = {}) => agentApi.completeTask(id, { otp: data.otp, notes: data.notes || data.pickup_notes }),
  confirmDelivery: (id, data = {}) => agentApi.completeTask(id, { otp: data.otp, notes: data.notes || data.delivery_notes }),
  failDelivery: (id, data = {}) => agentApi.failTask(id, data.reason || data.failed_reason || 'Customer unavailable'),
  dropoffLaundry: (id, data = {}) => Promise.resolve({ data: { success: true } })
};

// 5. LAUNDRY STAFF PORTAL APIS
export const staffApi = {
  getDashboard: (period = 'today') => apiClient.get('/staff/dashboard', { params: { period } }),
  getOrders: (params = {}) => apiClient.get('/staff/orders', { params }),
  getCounts: () => apiClient.get('/staff/orders/counts'),
  updateStatus: (id, to_status, note = null) => apiClient.post(`/staff/orders/${id}/status`, { to_status, note }),
  getOrder: (id) => apiClient.get(`/staff/orders/${id}`),
  resolveCombo: (id, note = null) => apiClient.post(`/staff/orders/${id}/combo/resolve`, { note }),
  getHistory: (params = {}) => apiClient.get('/staff/history', { params }),
  getInvoicePdfUrl: (id) => `${BASE_URL}/invoices/${id}/pdf`
};

export const laundryApi = {
  ...staffApi,
  confirmReceipt: (id, data = {}) => staffApi.updateStatus(id, 'RECEIVED_BY_LAUNDRY', data.discrepancy_details || data.discrepancy_notes || 'Receipt confirmed'),
  advanceStage: (id, data = {}) => staffApi.updateStatus(id, data.stage || data.to_status || 'PROCESSING', data.notes || data.note),
  qualityCheck: (id, data = {}) => staffApi.updateStatus(id, data.passed ? 'PACKING' : (data.reprocess_stage || 'PROCESSING'), data.notes || data.note),
  packOrder: (id, data = {}) => staffApi.updateStatus(id, 'READY_FOR_DELIVERY', data.notes || data.note)
};

// 6. ADMIN PORTAL APIS
export const adminApi = {
  getDashboard: (period = 'today') => apiClient.get('/admin/dashboard', { params: { period } }),
  getOrders: (params = {}) => apiClient.get('/admin/orders', { params }),
  getOrder: (id) => apiClient.get(`/admin/orders/${id}`),
  assignStaff: (orderId, staffId) => apiClient.post(`/admin/orders/${orderId}/assign-staff`, { staff_id: staffId }),
  updateStatus: (orderId, to_status, note) => apiClient.post(`/admin/orders/${orderId}/status`, { to_status, note }),
  cancelOrder: (orderId, reason = '') => apiClient.post(`/admin/orders/${orderId}/cancel`, { reason }),
  getTasks: (params = {}) => apiClient.get('/admin/tasks', { params }),
  getAgents: (available = true) => apiClient.get('/admin/agents', { params: { available } }),
  assignTask: (taskId, agentId) => apiClient.post(`/admin/tasks/${taskId}/assign`, { agent_id: agentId }),
  getUsers: (params = {}) => apiClient.get('/admin/users', { params }),
  createUser: (data) => apiClient.post('/admin/users', data),
  updateUser: (id, data) => apiClient.patch(`/admin/users/${id}`, data),
  setUserStatus: (id, is_active) => apiClient.patch(`/admin/users/${id}/status`, { is_active }),
  resetPassword: (id, new_password) => apiClient.post(`/admin/users/${id}/reset-password`, { new_password }),
  getServices: () => apiClient.get('/admin/services'),
  createService: (data) => apiClient.post('/admin/services', data),
  updateService: (id, data) => apiClient.patch(`/admin/services/${id}`, data),
  getGarments: () => apiClient.get('/admin/garments'),
  createGarment: (data) => apiClient.post('/admin/garments', data),
  updateGarment: (id, data) => apiClient.patch(`/admin/garments/${id}`, data),
  getPrices: () => apiClient.get('/admin/prices'),
  updatePrices: (prices) => apiClient.put('/admin/prices', { prices }),
  broadcastNotification: (data) => apiClient.post('/admin/notifications/broadcast', data),
  getTickets: (params = {}) => apiClient.get('/admin/support/tickets', { params }),
  getTicket: (id) => apiClient.get(`/admin/support/tickets/${id}`),
  replyTicket: (id, message) => apiClient.post(`/admin/support/tickets/${id}/reply`, { message }),
  updateTicketStatus: (id, status) => apiClient.patch(`/admin/support/tickets/${id}/status`, { status }),
  getComplaints: (params = {}) => apiClient.get('/admin/complaints', { params }),
  getComplaint: (id) => apiClient.get(`/admin/complaints/${id}`),
  rescheduleDelivery: (id, data) => apiClient.post(`/admin/complaints/${id}/reschedule`, data)
};

export default apiClient;
