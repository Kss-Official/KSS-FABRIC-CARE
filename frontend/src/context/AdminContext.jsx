import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { adminApi, notificationsApi } from '../api/apiClient';
import { useAuth } from './AuthContext';

export const INITIAL_FAQS_ADMIN = [
  {
    id: 1,
    question: 'How does Laundrix pickup and delivery work?',
    answer: 'Schedule a pickup through our app or website. Our executive will arrive with specialized laundry bags and deliver clean clothes within 24-48 hours.',
    status: 'Active',
    displayOrder: 1
  },
  {
    id: 2,
    question: 'What areas do you service?',
    answer: 'We currently provide pickup and delivery services across Bengaluru including Indiranagar, Koramangala, Whitefield, HSR Layout, Banaswadi, and Malleshwaram.',
    status: 'Active',
    displayOrder: 2
  },
  {
    id: 3,
    question: 'What types of clothes do you clean?',
    answer: 'We clean all types of everyday and premium fabrics including cotton, silk, linen, wool, denim, party wear, suits, and curtains.',
    status: 'Active',
    displayOrder: 3
  },
  {
    id: 4,
    question: 'How long does the cleaning process take?',
    answer: 'Standard turnaround time is 1–2 days. Express services may be delivered within 24 hours.',
    status: 'Active',
    displayOrder: 4
  },
  {
    id: 5,
    question: 'How should I prepare my clothes for pickup?',
    answer: 'Please keep your clothes in a clean bag. You can also add special instructions for delicate items during booking.',
    status: 'Active',
    displayOrder: 5
  },
  {
    id: 6,
    question: 'What are the payment options?',
    answer: 'We accept online payments (UPI, cards, net banking) and cash on delivery (COD) upon inspection.',
    status: 'Active',
    displayOrder: 6
  },
  {
    id: 7,
    question: 'How can I track my order?',
    answer: 'You can track your order in real-time through our app or website with live SMS and WhatsApp status updates.',
    status: 'Active',
    displayOrder: 7
  },
  {
    id: 8,
    question: 'What if I am not satisfied with the service?',
    answer: 'Your satisfaction is our priority. If you are not happy with the service, we offer a 100% free re-wash guarantee.',
    status: 'Inactive',
    displayOrder: 8
  }
];

export const INITIAL_TERMS_CONTENT = {
  title: 'Terms & Conditions',
  body: `1. Introduction
Welcome to Laundrix. These Terms & Conditions govern your use of our website, mobile application and laundry services. By accessing our services, you agree to comply with and be bound by these terms.

2. Services
Laundrix provides professional laundry and dry cleaning services, including pickup and delivery. Service details, pricing and turnaround time may vary based on location and fabric type.`
};

export const INITIAL_DRIVERS = [
  { id: 'd1', name: 'Ravi Kumar', phone: '+91 98765 43210', status: 'Available', ordersToday: 5, avatar: 'RK' },
  { id: 'd2', name: 'Arjun Singh', phone: '+91 87654 32109', status: 'Available', ordersToday: 4, avatar: 'AS' },
  { id: 'd3', name: 'Mohammed Taha', phone: '+91 91234 55678', status: 'Available', ordersToday: 3, avatar: 'MT' },
  { id: 'd4', name: 'Suresh Kumar', phone: '+91 99887 66554', status: 'On Delivery', ordersToday: 2, avatar: 'SK' },
  { id: 'd5', name: 'Praveen D', phone: '+91 98712 34567', status: 'Available', ordersToday: 4, avatar: 'PD' }
];

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

  // FAQs, Terms & Drivers
  const [faqs, setFaqsState] = useState(() => {
    try {
      const saved = localStorage.getItem('fabricare_admin_faqs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_FAQS_ADMIN;
  });

  const setFaqs = (updater) => {
    setFaqsState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try {
        localStorage.setItem('fabricare_admin_faqs', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const [termsContent, setTermsContent] = useState(() => {
    try {
      const saved = localStorage.getItem('fabricare_admin_terms');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.body) return parsed;
      }
    } catch (e) {}
    return INITIAL_TERMS_CONTENT;
  });

  const updateTerms = async (newTerms) => {
    setTermsContent(newTerms);
    try {
      localStorage.setItem('fabricare_admin_terms', JSON.stringify(newTerms));
    } catch (e) {}
  };

  const [drivers, setDrivers] = useState(INITIAL_DRIVERS);

  // Complaints & Reschedule Delivery States
  const [complaints, setComplaints] = useState([]);
  const [complaintsSummary, setComplaintsSummary] = useState({
    total_complaints: 0,
    pending_reschedule: 0,
    rescheduled: 0,
    delivered: 0,
    resolved: 0
  });
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [isRescheduleDrawerOpen, setIsRescheduleDrawerOpen] = useState(false);
  const [activeRescheduleComplaint, setActiveRescheduleComplaint] = useState(null);

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
  const [activeSupportTicket, setActiveSupportTicket] = useState(null);
  const [supportSummary, setSupportSummary] = useState({
    total_tickets: 0,
    open: 0,
    in_progress: 0,
    resolved: 0
  });

  // Settings
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('fabricare_admin_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
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
    };
  });

  const updateSettings = async (newSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('fabricare_admin_settings', JSON.stringify(newSettings));
      const savedUser = localStorage.getItem('fabricare_user') || sessionStorage.getItem('fabricare_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        parsed.displayName = newSettings.name || parsed.displayName;
        parsed.email = newSettings.email || parsed.email;
        localStorage.setItem('fabricare_user', JSON.stringify(parsed));
      }
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}
  };

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
      const normalized = raw.map(o => {
        const idStr = String(o.id || '');
        const orderCode = o.code || o.order_id || o.order_number || `#${idStr.padStart(5, '0')}`;
        const totalVal = o.total_amount ? Number(o.total_amount) : (o.total_paise ? o.total_paise / 100 : (o.amount || 0));

        const custName = o.pickup_full_name || o.customer_name || o.customer?.name || 'Customer';
        const custPhone = o.pickup_phone || o.customer_phone || o.customer?.phone || '';
        const custEmail = o.customer_email || o.customer?.email || '';
        const custAddress = o.pickup_address || o.address?.line1 || (typeof o.address === 'string' ? o.address : 'Bengaluru');
        const custAvatar = o.customer?.avatar || String(custName).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'CU';

        const servicesList = Array.isArray(o.services) && o.services.length > 0 
          ? o.services 
          : (Array.isArray(o.services_list) && o.services_list.length > 0
            ? o.services_list
            : (Array.isArray(o.items) && o.items.length > 0
              ? o.items.map(it => it.service_name || it.item_name || 'Wash & Fold')
              : ['Wash & Fold']));

        const pickupSlotStr = o.pickup_time_slot || (o.pickup ? `${o.pickup.from || '09:00'} - ${o.pickup.to || '11:00'}` : '09:00 AM - 11:00 AM');
        const pickupStr = o.pickup_date ? `${o.pickup_date}, ${pickupSlotStr}` : (o.pickupTime || pickupSlotStr);
        const dateStr = o.created_at ? new Date(o.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : (o.date || 'Today');

        let uiStatus = o.status_display || 'Pending Pickup';
        const rawStatus = String(o.status || '').toUpperCase();
        if (rawStatus === 'PENDING' || rawStatus === 'CONFIRMED' || rawStatus === 'PICKUP_SCHEDULED') {
          uiStatus = 'Pending Pickup';
        } else if (rawStatus === 'PICKED_UP' || rawStatus === 'IN_CLEANING' || rawStatus === 'WASHING' || rawStatus === 'IRONING' || rawStatus === 'IN_PROGRESS') {
          uiStatus = 'In Cleaning';
        } else if (rawStatus === 'READY' || rawStatus === 'READY_FOR_DELIVERY' || rawStatus === 'OUT_FOR_DELIVERY') {
          uiStatus = 'Ready for Delivery';
        } else if (rawStatus === 'DELIVERED' || rawStatus === 'COMPLETED' || rawStatus === 'CLOSED') {
          uiStatus = 'Completed';
        }

        const paymentDisplay = (o.payment_status === 'PAID' || o.payment === 'Paid') ? 'Paid' : (o.payment_method === 'COD' || o.payment === 'COD' ? 'COD' : (o.payment || 'Paid'));

        return {
          ...o,
          id: orderCode,
          rawId: o.id,
          order_number: orderCode,
          order_id: orderCode,
          amount: totalVal,
          total_amount: totalVal,
          date: dateStr,
          customer: {
            name: custName,
            phone: custPhone,
            email: custEmail,
            address: custAddress,
            avatar: custAvatar
          },
          services: servicesList,
          pickupTime: pickupStr,
          pickup_address: custAddress,
          pickup_time_slot: pickupSlotStr,
          customer_name: custName,
          customer_phone: custPhone,
          status: uiStatus,
          status_display: o.status_display || uiStatus,
          payment: paymentDisplay,
          driver: o.assigned_pickup_driver_detail?.full_name || o.driver || 'Not Assigned'
        };
      });
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
      const data = res.data;
      if (data && data.summary) {
        setSupportSummary(data.summary);
      }
      const raw = Array.isArray(data) ? data : (data?.items || data?.results || []);
      const normalized = raw.map(t => {
        const idStr = String(t.id || '');
        return {
          ...t,
          id: t.id,
          ticket_id_display: t.ticket_number || `#TICK-${idStr.padStart(5, '0').toUpperCase()}`,
          customer_name: t.customer_name || 'Customer',
          customer_email: t.customer_email || 'customer@example.com',
          subject: t.subject || 'Support Request',
          status: t.status?.toUpperCase() || 'OPEN',
          status_display: t.status?.toUpperCase() === 'OPEN' ? 'Open' : (t.status?.toUpperCase() === 'IN_PROGRESS' ? 'In Progress' : 'Resolved'),
          priority: t.priority?.toUpperCase() || 'MEDIUM',
          created_at: t.created_at || t.updated_at,
          formatted_created_at: t.created_at ? new Date(t.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : (t.formatted_created_at || '16 Oct 2026 10:24 AM')
        };
      });
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

  // 8. Fetch Complaints
  const fetchComplaints = useCallback(async (params = {}) => {
    setComplaintsLoading(true);
    try {
      const res = await adminApi.getComplaints(params);
      const data = res.data || {};
      const list = Array.isArray(data) ? data : (data.complaints || data.items || data.results || []);
      setComplaints(list);
      if (data.summary) {
        setComplaintsSummary(data.summary);
      }
    } catch (err) {
      console.warn('Admin fetchComplaints error:', err);
    } finally {
      setComplaintsLoading(false);
    }
  }, []);

  const openRescheduleDrawer = useCallback((complaint) => {
    setActiveRescheduleComplaint(complaint);
    setIsRescheduleDrawerOpen(true);
  }, []);

  const closeRescheduleDrawer = useCallback(() => {
    setIsRescheduleDrawerOpen(false);
    setActiveRescheduleComplaint(null);
  }, []);

  const rescheduleDelivery = useCallback(async (complaintId, rescheduleData) => {
    const dateStr = rescheduleData.delivery_date || rescheduleData.new_delivery_date;
    const slotStr = rescheduleData.delivery_time_slot || rescheduleData.time_slot;
    try {
      const res = await adminApi.rescheduleDelivery(complaintId, rescheduleData);

      setComplaints(prev => prev.map(c => {
        if (c.id === complaintId) {
          return {
            ...c,
            status: 'RESCHEDULED',
            status_display: 'Rescheduled',
            rescheduled_date: dateStr,
            rescheduled_time_slot: slotStr,
            formatted_reschedule_date: `${dateStr} (${slotStr || 'Rescheduled'})`,
            notes: rescheduleData.notes ? `${c.notes || ''}\nAdmin Note: ${rescheduleData.notes}`.trim() : c.notes
          };
        }
        return c;
      }));

      setComplaintsSummary(prev => ({
        ...prev,
        pending_reschedule: Math.max(0, (prev?.pending_reschedule || 8) - 1),
        rescheduled: (prev?.rescheduled || 10) + 1
      }));

      try {
        const saved = localStorage.getItem('fabricare_admin_complaints');
        const parsed = saved ? JSON.parse(saved) : [];
        const updated = parsed.map(c => c.id === complaintId ? {
          ...c,
          status: 'RESCHEDULED',
          rescheduled_date: dateStr,
          rescheduled_time_slot: slotStr,
          admin_notes: rescheduleData.notes
        } : c);
        localStorage.setItem('fabricare_admin_complaints', JSON.stringify(updated));
      } catch (e) {}

      addAdminNotification({
        type: 'delivery',
        title: 'Delivery Rescheduled',
        desc: `Order ${activeRescheduleComplaint?.order_id || ''} delivery rescheduled to ${dateStr} (${slotStr || ''}).`,
        actionTab: 'reports',
        meta: { orderId: activeRescheduleComplaint?.order_id }
      });

      await Promise.allSettled([fetchComplaints(), fetchOrders()]);
      return { success: true, data: res?.data };
    } catch (err) {
      console.warn('Backend reschedule error, applying local optimistic update:', err);
      setComplaints(prev => prev.map(c => {
        if (c.id === complaintId) {
          return {
            ...c,
            status: 'RESCHEDULED',
            status_display: 'Rescheduled',
            rescheduled_date: dateStr,
            rescheduled_time_slot: slotStr,
            formatted_reschedule_date: `${dateStr} (${slotStr || 'Rescheduled'})`,
            notes: rescheduleData.notes ? `${c.notes || ''}\nAdmin Note: ${rescheduleData.notes}`.trim() : c.notes
          };
        }
        return c;
      }));

      setComplaintsSummary(prev => ({
        ...prev,
        pending_reschedule: Math.max(0, (prev?.pending_reschedule || 8) - 1),
        rescheduled: (prev?.rescheduled || 10) + 1
      }));

      try {
        const saved = localStorage.getItem('fabricare_admin_complaints');
        const parsed = saved ? JSON.parse(saved) : [];
        const updated = parsed.map(c => c.id === complaintId ? {
          ...c,
          status: 'RESCHEDULED',
          rescheduled_date: dateStr,
          rescheduled_time_slot: slotStr,
          admin_notes: rescheduleData.notes
        } : c);
        localStorage.setItem('fabricare_admin_complaints', JSON.stringify(updated));
      } catch (e) {}

      return { success: true };
    }
  }, [fetchComplaints, fetchOrders, activeRescheduleComplaint]);

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
      fetchNotifications(),
      fetchComplaints()
    ]).finally(() => {
      setLoading(false);
    });
  }, [isAuthenticated, userRole, fetchDashboard, fetchOrders, fetchTasks, fetchUsers, fetchCatalog, fetchSupportTickets, fetchNotifications, fetchComplaints]);

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
      const ticketData = res.data || ticket;
      setSupportDrawerTicket(ticketData);
      setActiveSupportTicket(ticketData);
    } catch {
      setSupportDrawerTicket(ticket);
      setActiveSupportTicket(ticket);
    }
    setIsSupportDrawerOpen(true);
  };

  const closeSupportDrawer = () => {
    setIsSupportDrawerOpen(false);
    setSupportDrawerTicket(null);
    setActiveSupportTicket(null);
  };

  const replyToSupportTicket = async (ticketId, replyText, statusVal) => {
    try {
      const res = await supportApi.replyTicket(ticketId, {
        admin_reply: replyText,
        status: statusVal
      });

      const updated = res.data?.ticket || res.data;
      setSupportTickets(prev => prev.map(t => {
        if (t.id === ticketId || t.ticket_number === ticketId || t.ticket_id_display === ticketId) {
          return {
            ...t,
            admin_reply: replyText,
            admin_reply_at: new Date().toISOString(),
            status: statusVal || t.status,
            status_display: statusVal === 'IN_PROGRESS' ? 'In Progress' : (statusVal === 'RESOLVED' ? 'Resolved' : t.status_display)
          };
        }
        return t;
      }));

      const updatedObj = {
        ...(activeSupportTicket || supportDrawerTicket || {}),
        admin_reply: replyText,
        admin_reply_at: new Date().toISOString(),
        status: statusVal || (activeSupportTicket?.status || 'IN_PROGRESS')
      };
      setSupportDrawerTicket(updatedObj);
      setActiveSupportTicket(updatedObj);

      addAdminNotification({
        type: 'order',
        title: 'Support Response Sent',
        desc: `Response sent to customer for ticket ${activeSupportTicket?.ticket_id_display || activeSupportTicket?.ticket_number || ''}.`,
        actionTab: 'help-support'
      });

      fetchSupportTickets();
      return { success: true, data: updated };
    } catch (err) {
      console.warn('Backend reply failed, applying local update:', err);
      setSupportTickets(prev => prev.map(t => {
        if (t.id === ticketId || t.ticket_number === ticketId || t.ticket_id_display === ticketId) {
          return {
            ...t,
            admin_reply: replyText,
            admin_reply_at: new Date().toISOString(),
            status: statusVal || t.status,
            status_display: statusVal === 'IN_PROGRESS' ? 'In Progress' : (statusVal === 'RESOLVED' ? 'Resolved' : t.status_display)
          };
        }
        return t;
      }));

      const updatedObj = {
        ...(activeSupportTicket || supportDrawerTicket || {}),
        admin_reply: replyText,
        admin_reply_at: new Date().toISOString(),
        status: statusVal || (activeSupportTicket?.status || 'IN_PROGRESS')
      };
      setSupportDrawerTicket(updatedObj);
      setActiveSupportTicket(updatedObj);

      return { success: true };
    }
  };

  const resolveSupportTicket = async (ticketId, replyText) => {
    try {
      const res = await supportApi.resolveTicket(ticketId, {
        admin_reply: replyText
      });

      const updated = res.data?.ticket || res.data;
      setSupportTickets(prev => prev.map(t => {
        if (t.id === ticketId || t.ticket_number === ticketId || t.ticket_id_display === ticketId) {
          return {
            ...t,
            status: 'RESOLVED',
            status_display: 'Resolved',
            admin_reply: replyText || t.admin_reply,
            admin_reply_at: replyText ? new Date().toISOString() : t.admin_reply_at
          };
        }
        return t;
      }));

      const updatedObj = {
        ...(activeSupportTicket || supportDrawerTicket || {}),
        status: 'RESOLVED',
        status_display: 'Resolved',
        admin_reply: replyText || (activeSupportTicket?.admin_reply || '')
      };
      setSupportDrawerTicket(updatedObj);
      setActiveSupportTicket(updatedObj);

      setSupportSummary(prev => ({
        ...prev,
        open: Math.max(0, (prev?.open || 24) - 1),
        resolved: (prev?.resolved || 92) + 1
      }));

      addAdminNotification({
        type: 'order',
        title: 'Support Ticket Resolved',
        desc: `Ticket ${activeSupportTicket?.ticket_id_display || activeSupportTicket?.ticket_number || ''} marked as Resolved.`,
        actionTab: 'help-support'
      });

      fetchSupportTickets();
      return { success: true, data: updated };
    } catch (err) {
      console.warn('Backend resolve failed, applying local update:', err);
      setSupportTickets(prev => prev.map(t => {
        if (t.id === ticketId || t.ticket_number === ticketId || t.ticket_id_display === ticketId) {
          return {
            ...t,
            status: 'RESOLVED',
            status_display: 'Resolved',
            admin_reply: replyText || t.admin_reply
          };
        }
        return t;
      }));

      const updatedObj = {
        ...(activeSupportTicket || supportDrawerTicket || {}),
        status: 'RESOLVED',
        status_display: 'Resolved',
        admin_reply: replyText || (activeSupportTicket?.admin_reply || '')
      };
      setSupportDrawerTicket(updatedObj);
      setActiveSupportTicket(updatedObj);

      setSupportSummary(prev => ({
        ...prev,
        open: Math.max(0, (prev?.open || 24) - 1),
        resolved: (prev?.resolved || 92) + 1
      }));

      return { success: true };
    }
  };

  const replySupportTicket = replyToSupportTicket;

  const updateTicketStatus = async (ticketId, status) => {
    await adminApi.updateTicketStatus(ticketId, status);
    await fetchSupportTickets();
  };

  const markNotificationAsRead = async (id) => {
    try {
      await notificationsApi.markRead(id);
      await fetchNotifications();
    } catch {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false, is_read: true } : n));
    }
  };

  const markNotificationAsUnread = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: true, is_read: false } : n));
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await notificationsApi.markAllRead();
      await fetchNotifications();
    } catch {
      setNotifications(prev => prev.map(n => ({ ...n, unread: false, is_read: true })));
    }
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const addAdminNotification = (notif) => {
    const newNotif = {
      id: `notif-${Date.now()}`,
      time: 'Just now',
      timestamp: Date.now(),
      unread: true,
      ...notif
    };
    setNotifications(prev => [newNotif, ...prev]);
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
        setSupportTickets,
        supportSummary,
        setSupportSummary,
        supportLoading,
        dashboardData,
        dashboardPeriod,
        setDashboardPeriod,
        notifications,
        settings,
        setSettings,
        updateSettings,
        drivers,
        setDrivers,
        faqs,
        setFaqs,
        termsContent,
        setTermsContent,
        updateTerms,
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
        setIsSupportDrawerOpen,
        supportDrawerTicket,
        setSupportDrawerTicket,
        activeSupportTicket,
        setActiveSupportTicket,
        openSupportDrawer,
        closeSupportDrawer,
        replyToSupportTicket,
        replySupportTicket,
        resolveSupportTicket,
        updateTicketStatus,
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
        markNotificationAsRead,
        markNotificationAsUnread,
        markAllNotificationsAsRead,
        deleteNotification,
        clearAllNotifications,
        addAdminNotification,
        unreadNotificationsCount: (notifications || []).filter(n => n.unread || !n.is_read).length,
        complaints,
        setComplaints,
        complaintsSummary,
        setComplaintsSummary,
        complaintsLoading,
        fetchComplaints,
        isRescheduleDrawerOpen,
        setIsRescheduleDrawerOpen,
        activeRescheduleComplaint,
        setActiveRescheduleComplaint,
        openRescheduleDrawer,
        closeRescheduleDrawer,
        rescheduleDelivery
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
