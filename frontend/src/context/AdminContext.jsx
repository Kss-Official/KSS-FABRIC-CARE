import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { adminApi, notificationsApi } from '../api/apiClient';
import { useAuth } from './AuthContext';

const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  const [adminTab, setAdminTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('help-support') || hash.includes('support')) return 'help-support';
      if (hash.includes('delivery-reports') || hash.includes('complaints') || hash.includes('complaint-reports')) return 'delivery-reports';
      if (hash.includes('orders')) return 'orders';
      if (hash.includes('pickup-delivery') || hash.includes('deliveries') || hash.includes('tasks')) return 'pickup-delivery';
      if (hash.includes('customers') || hash.includes('users')) return 'customers';
      if (hash.includes('services')) return 'services';
      if (hash.includes('notifications')) return 'notifications';
      if (hash.includes('content')) return 'content';
      if (hash.includes('settings') || hash.includes('my-profile') || hash.includes('profile')) return 'settings';
      if (hash.includes('dashboard')) return 'dashboard';
    }
    return 'dashboard';
  });
  const { isAuthenticated, userRole } = useAuth();
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(true);

  // Live Data States
  const [orders, setOrders] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [availableAgents, setAvailableAgents] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [garments, setGarments] = useState([]);
  const [prices, setPrices] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardPeriod, setDashboardPeriod] = useState('today');
  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(false);
  const [supportLoading, setSupportLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modals & Drawers State
  const [isCreateOrderDrawerOpen, setIsCreateOrderDrawerOpen] = useState(false);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [isManageServicesModalOpen, setIsManageServicesModalOpen] = useState(false);
  const [isAssignOrderModalOpen, setIsAssignOrderModalOpen] = useState(false);
  const [assigningOrder, setAssigningOrder] = useState(null);
  const [isSupportDrawerOpen, setIsSupportDrawerOpen] = useState(false);
  const [supportDrawerTicket, setSupportDrawerTicket] = useState(null);

  // Settings
  const [settings, setSettings] = useState({
    name: 'Admin',
    email: 'admin@fabricare.test',
    phone: '+91 98765 43210',
    role: 'Administrator',
    supportEmail: 'support@fabricare.test',
    supportPhone: '+91 98765 43210',
    websiteUrl: 'https://www.fabricare.com',
    notifications: {
      newOrders: true,
      customerMessages: true,
      pickupDelivery: true,
      systemAnnouncements: false
    }
  });

  // 1. Fetch Dashboard Data
  const fetchDashboard = useCallback(async (period = dashboardPeriod) => {
    try {
      const res = await adminApi.getDashboard(period);
      setDashboardData(res.data);
      setDashboardPeriod(period);
    } catch (err) {
      console.warn('Admin fetchDashboard error:', err);
    }
  }, [dashboardPeriod]);

  // 2. Fetch Orders
  const fetchOrders = useCallback(async (params = {}) => {
    try {
      const res = await adminApi.getOrders({ page_size: 50, ...params });
      const raw = Array.isArray(res.data) ? res.data : (res.data?.items || []);
      const normalized = raw.map(o => ({
        ...o,
        id: o.id,
        order_number: o.code || `#${o.id.substring(0, 7).toUpperCase()}`,
        order_id: o.code || `#${o.id.substring(0, 7).toUpperCase()}`,
        amount: o.total_paise ? o.total_paise / 100 : 0,
        total_amount: o.total_paise ? o.total_paise / 100 : 0,
        pickup_address: o.address?.line1 || (typeof o.address === 'string' ? o.address : 'Bengaluru'),
        pickup_time_slot: o.pickup ? `${o.pickup.from || '09:00'} - ${o.pickup.to || '11:00'}` : '09:00 AM - 11:00 AM',
        customer_name: o.customer?.name || 'Customer',
        customer_phone: o.customer?.phone || '',
        status_display: o.status?.replace(/_/g, ' ')
      }));
      setOrders(normalized);
    } catch (err) {
      console.warn('Admin fetchOrders error:', err);
    }
  }, []);

  // 3. Fetch Tasks & Available Agents
  const fetchTasks = useCallback(async (params = {}) => {
    try {
      const [tasksRes, agentsRes] = await Promise.allSettled([
        adminApi.getTasks(params),
        adminApi.getAgents(true)
      ]);
      if (tasksRes.status === 'fulfilled' && tasksRes.value?.data) {
        const raw = Array.isArray(tasksRes.value.data) ? tasksRes.value.data : (tasksRes.value.data?.items || []);
        const normalized = raw.map(t => ({
          ...t,
          id: t.id,
          order_number: t.order_code || t.order_id,
          order_id: t.order_code || t.order_id,
          pickup_address: t.address?.line1 || '',
          customer_name: t.customer?.name || '',
          customer_phone: t.customer?.phone || ''
        }));
        setTasks(normalized);
      }
      if (agentsRes.status === 'fulfilled' && agentsRes.value?.data) {
        const ag = Array.isArray(agentsRes.value.data) ? agentsRes.value.data : [];
        setAvailableAgents(ag);
      }
    } catch (err) {
      console.warn('Admin fetchTasks error:', err);
    }
  }, []);

  // 4. Fetch Users (Customers & Staff)
  const fetchUsers = useCallback(async () => {
    try {
      const res = await adminApi.getUsers({ page_size: 50 });
      const raw = Array.isArray(res.data) ? res.data : (res.data?.items || []);
      const custs = raw.filter(u => u.role === 'customer').map(u => ({
        id: u.id,
        uid: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        avatar: (u.name || 'CU').substring(0, 2).toUpperCase(),
        location: 'Bengaluru',
        totalOrders: 0,
        status: u.is_active ? 'Active' : 'Blocked',
        joinDate: u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Recent'
      }));
      setCustomers(custs);
    } catch (err) {
      console.warn('Admin fetchUsers error:', err);
    }
  }, []);

  // 5. Fetch Services, Garments, Prices
  const fetchCatalog = useCallback(async () => {
    try {
      const [svcRes, grmRes, prcRes] = await Promise.allSettled([
        adminApi.getServices(),
        adminApi.getGarments(),
        adminApi.getPrices()
      ]);
      if (svcRes.status === 'fulfilled' && svcRes.value?.data) {
        setServices(svcRes.value.data);
      }
      if (grmRes.status === 'fulfilled' && grmRes.value?.data) {
        setGarments(grmRes.value.data);
      }
      if (prcRes.status === 'fulfilled' && prcRes.value?.data) {
        setPrices(prcRes.value.data?.prices || []);
      }
    } catch (err) {
      console.warn('Admin fetchCatalog error:', err);
    }
  }, []);

  // 6. Fetch Support Tickets
  const fetchSupportTickets = useCallback(async (params = {}) => {
    setSupportLoading(true);
    try {
      const res = await adminApi.getTickets(params);
      const raw = Array.isArray(res.data) ? res.data : (res.data?.items || []);
      const normalized = raw.map(t => ({
        ...t,
        id: t.id,
        ticket_id_display: `#TICK-${t.id.substring(0, 5).toUpperCase()}`,
        customer_name: t.customer_name || 'Customer',
        subject: t.subject,
        status: t.status?.toUpperCase(),
        status_display: t.status?.toUpperCase() === 'OPEN' ? 'Open' : 'Resolved',
        priority: 'MEDIUM',
        created_at: t.created_at || t.updated_at
      }));
      setSupportTickets(normalized);
    } catch (err) {
      console.warn('Admin fetchSupportTickets error:', err);
    } finally {
      setSupportLoading(false);
    }
  }, []);

  // 7. Fetch Notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationsApi.getNotifications();
      const raw = Array.isArray(res.data) ? res.data : (res.data?.items || []);
      setNotifications(raw);
    } catch (err) {
      console.warn('Admin fetchNotifications error:', err);
    }
  }, []);

  // Initial Load - only fetch if authenticated as admin
  useEffect(() => {
    if (!isAuthenticated || userRole !== 'admin') {
      return;
    }
    setLoading(true);
    Promise.allSettled([
      fetchDashboard('today'),
      fetchOrders(),
      fetchTasks(),
      fetchUsers(),
      fetchCatalog(),
      fetchSupportTickets(),
      fetchNotifications()
    ]).finally(() => {
      setLoading(false);
    });
  }, [isAuthenticated, userRole, fetchDashboard, fetchOrders, fetchTasks, fetchUsers, fetchCatalog, fetchSupportTickets, fetchNotifications]);

  // Actions
  const updateOrderStatus = async (orderId, toStatus, note = 'Admin status update') => {
    await adminApi.updateStatus(orderId, toStatus, note);
    await Promise.all([fetchOrders(), fetchDashboard()]);
  };

  const assignDriverToOrder = async (taskId, agentId) => {
    await adminApi.assignTask(taskId, agentId);
    await Promise.all([fetchTasks(), fetchOrders()]);
  };

  const cancelOrder = async (orderId, reason = 'Cancelled by admin') => {
    await adminApi.cancelOrder(orderId, reason);
    await Promise.all([fetchOrders(), fetchDashboard()]);
  };

  const addCustomer = async (data) => {
    await adminApi.createUser({
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: 'customer',
      password: data.password || 'Test@1234'
    });
    await fetchUsers();
  };

  const toggleCustomerStatus = async (userId, isActive) => {
    await adminApi.setUserStatus(userId, isActive);
    await fetchUsers();
  };

  const toggleServiceStatus = async (serviceId, isActive) => {
    await adminApi.updateService(serviceId, { is_active: isActive });
    await fetchCatalog();
  };

  const addService = async (data) => {
    await adminApi.createService(data);
    await fetchCatalog();
  };

  const updatePrices = async (pricesList) => {
    await adminApi.updatePrices(pricesList);
    await fetchCatalog();
  };

  const broadcastNotification = async (data) => {
    const res = await adminApi.broadcastNotification(data);
    await fetchNotifications();
    return res.data;
  };

  const openSupportDrawer = async (ticket) => {
    try {
      const res = await adminApi.getTicket(ticket.id);
      setSupportDrawerTicket(res.data);
    } catch {
      setSupportDrawerTicket(ticket);
    }
    setIsSupportDrawerOpen(true);
  };

  const closeSupportDrawer = () => {
    setIsSupportDrawerOpen(false);
    setSupportDrawerTicket(null);
  };

  const replySupportTicket = async (ticketId, message) => {
    await adminApi.replyTicket(ticketId, message);
    await fetchSupportTickets();
    if (supportDrawerTicket && supportDrawerTicket.id === ticketId) {
      const res = await adminApi.getTicket(ticketId);
      setSupportDrawerTicket(res.data);
    }
  };

  const updateTicketStatus = async (ticketId, status) => {
    await adminApi.updateTicketStatus(ticketId, status);
    await fetchSupportTickets();
  };

  const markNotificationAsRead = async (id) => {
    await notificationsApi.markRead(id);
    await fetchNotifications();
  };

  const markAllNotificationsAsRead = async () => {
    await notificationsApi.markAllRead();
    await fetchNotifications();
  };

  const supportSummary = {
    total: supportTickets.length,
    open: supportTickets.filter(t => t.status === 'OPEN').length,
    in_progress: 0,
    resolved: supportTickets.filter(t => t.status === 'CLOSED').length
  };

  return (
    <AdminContext.Provider
      value={{
        adminTab,
        setAdminTab,
        isAdminAuthenticated,
        setIsAdminAuthenticated,
        orders,
        setOrders,
        tasks,
        availableAgents,
        customers,
        services,
        setServices,
        garments,
        prices,
        supportTickets,
        supportSummary,
        supportLoading,
        dashboardData,
        dashboardPeriod,
        setDashboardPeriod,
        notifications,
        settings,
        setSettings,
        loading,
        error,
        isCreateOrderDrawerOpen,
        setIsCreateOrderDrawerOpen,
        isAddCustomerModalOpen,
        setIsAddCustomerModalOpen,
        isAddServiceModalOpen,
        setIsAddServiceModalOpen,
        isManageServicesModalOpen,
        setIsManageServicesModalOpen,
        isAssignOrderModalOpen,
        setIsAssignOrderModalOpen,
        assigningOrder,
        setAssigningOrder,
        isSupportDrawerOpen,
        supportDrawerTicket,
        openSupportDrawer,
        closeSupportDrawer,
        fetchDashboard,
        fetchOrders,
        fetchTasks,
        fetchUsers,
        fetchCatalog,
        fetchSupportTickets,
        fetchNotifications,
        updateOrderStatus,
        assignDriverToOrder,
        cancelOrder,
        addCustomer,
        toggleCustomerStatus,
        toggleServiceStatus,
        addService,
        updatePrices,
        broadcastNotification,
        replySupportTicket,
        updateTicketStatus,
        markNotificationAsRead,
        markAllNotificationsAsRead
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export default AdminContext;
