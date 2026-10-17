import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { adminApi, notificationsApi } from '../api/apiClient';
import { useAuth } from './AuthContext';
import { createCustomerAccountByAdmin } from '../services/authService';
import {
  subscribeOrders,
  createFirestoreOrder,
  updateFirestoreOrderStatus,
  cancelFirestoreOrder,
  assignDriverToFirestoreOrder,
  subscribeCustomers,
  addFirestoreCustomer,
  updateFirestoreCustomerStatus,
  subscribeServices,
  addFirestoreService,
  toggleFirestoreServiceStatus,
  subscribeDrivers,
  subscribeFaqs,
  saveFirestoreFaqs,
  getFirestoreTerms,
  saveFirestoreTerms,
  getFirestoreSettings,
  saveFirestoreSettings,
  subscribeComplaints,
  subscribeNotifications,
  addFirestoreNotification,
  INITIAL_FAQS_ADMIN,
  INITIAL_TERMS_CONTENT,
  INITIAL_DRIVERS,
  INITIAL_SETTINGS
} from '../services/firestoreService';

export { INITIAL_FAQS_ADMIN, INITIAL_TERMS_CONTENT, INITIAL_DRIVERS };

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

  // Live Data States (Synced with Firebase Cloud Firestore)
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

  // FAQs, Terms & Drivers (Primary Storage: Firebase Cloud Firestore)
  const [faqs, setFaqsState] = useState(INITIAL_FAQS_ADMIN);
  const [termsContent, setTermsContent] = useState(INITIAL_TERMS_CONTENT);
  const [drivers, setDrivers] = useState(INITIAL_DRIVERS);
  const [settings, setSettings] = useState(INITIAL_SETTINGS);

  const setFaqs = (updater) => {
    setFaqsState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveFirestoreFaqs(next).catch(e => console.warn('Save FAQs to Firestore note:', e));
      return next;
    });
  };

  const updateTerms = async (newTerms) => {
    setTermsContent(newTerms);
    try {
      await saveFirestoreTerms(newTerms);
    } catch (e) {
      console.warn('Save terms to Firestore note:', e);
    }
  };

  const updateSettings = async (newSettings) => {
    setSettings(newSettings);
    try {
      await saveFirestoreSettings(newSettings);
      const savedUser = localStorage.getItem('fabricare_user') || sessionStorage.getItem('fabricare_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        parsed.displayName = newSettings.name || parsed.displayName;
        parsed.email = newSettings.email || parsed.email;
        localStorage.setItem('fabricare_user', JSON.stringify(parsed));
      }
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.warn('Save settings to Firestore note:', e);
    }
  };

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

  // ========================================================
  // REAL-TIME FIRESTORE SUBSCRIPTIONS
  // ========================================================
  useEffect(() => {
    // 1. Subscribe to Orders in Firestore
    const unsubOrders = subscribeOrders((fireOrders) => {
      if (fireOrders && fireOrders.length > 0) {
        setOrders(fireOrders);
      }
    });

    // 2. Subscribe to Customers in Firestore
    const unsubCustomers = subscribeCustomers((fireCustomers) => {
      if (fireCustomers && fireCustomers.length > 0) {
        setCustomers(fireCustomers);
      }
    });

    // 3. Subscribe to Services in Firestore
    const unsubServices = subscribeServices((fireServices) => {
      if (fireServices && fireServices.length > 0) {
        setServices(fireServices);
      }
    });

    // 4. Subscribe to Drivers in Firestore
    const unsubDrivers = subscribeDrivers((fireDrivers) => {
      if (fireDrivers && fireDrivers.length > 0) {
        setDrivers(fireDrivers);
      }
    });

    // 5. Subscribe to FAQs in Firestore
    const unsubFaqs = subscribeFaqs((fireFaqs) => {
      if (fireFaqs && fireFaqs.length > 0) {
        setFaqsState(fireFaqs);
      }
    });

    // 6. Fetch Terms from Firestore
    getFirestoreTerms().then(terms => {
      if (terms) setTermsContent(terms);
    }).catch(() => {});

    // 7. Fetch Settings from Firestore
    getFirestoreSettings().then(st => {
      if (st) setSettings(st);
    }).catch(() => {});

    // 8. Subscribe to Complaints in Firestore
    const unsubComplaints = subscribeComplaints((fireComplaints) => {
      if (fireComplaints && fireComplaints.length > 0) {
        setComplaints(fireComplaints);
      }
    });

    // 9. Subscribe to Notifications in Firestore
    const unsubNotifications = subscribeNotifications((fireNotifs) => {
      if (fireNotifs && fireNotifs.length > 0) {
        setNotifications(fireNotifs);
      }
    });

    return () => {
      unsubOrders();
      unsubCustomers();
      unsubServices();
      unsubDrivers();
      unsubFaqs();
      unsubComplaints();
      unsubNotifications();
    };
  }, []);

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

  // 2. Fetch Orders (Fallback query)
  const fetchOrders = useCallback(async (params = {}) => {
    try {
      const res = await adminApi.getOrders({ page_size: 50, ...params });
      const raw = Array.isArray(res.data) ? res.data : (res.data?.items || []);
      if (raw.length > 0) {
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
        setOrders(prev => {
          // Merge preserving any firestore-only orders
          const existingIds = new Set(prev.map(p => p.id));
          const additions = normalized.filter(n => !existingIds.has(n.id));
          return [...prev, ...additions];
        });
      }
    } catch (err) {
      console.warn('Admin fetchOrders fallback notice:', err);
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

  // 4. Fetch Users
  const fetchUsers = useCallback(async () => {
    try {
      const res = await adminApi.getUsers({ page_size: 50 });
      const raw = Array.isArray(res.data) ? res.data : (res.data?.items || []);
      if (raw.length > 0) {
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
        setCustomers(prev => {
          const ids = new Set(prev.map(p => p.id));
          return [...prev, ...custs.filter(c => !ids.has(c.id))];
        });
      }
    } catch (err) {
      console.warn('Admin fetchUsers fallback notice:', err);
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
        const raw = svcRes.value.data;
        if (Array.isArray(raw) && raw.length > 0) {
          setServices(prev => {
            const ids = new Set(prev.map(p => p.id));
            return [...prev, ...raw.filter(s => !ids.has(s.id))];
          });
        }
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
      if (raw.length > 0) {
        setNotifications(prev => {
          const ids = new Set(prev.map(p => p.id));
          return [...prev, ...raw.filter(n => !ids.has(n.id))];
        });
      }
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
      if (list.length > 0) {
        setComplaints(list);
      }
      if (data.summary) {
        setComplaintsSummary(data.summary);
      }
    } catch (err) {
      console.warn('Admin fetchComplaints fallback note:', err);
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

  // Initial Load
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

  // ========================================================
  // FIRESTORE-BACKED ACTIONS (PRIMARY DATABASE)
  // ========================================================

  const updateOrderStatus = async (orderId, toStatus, note = 'Admin status update') => {
    try {
      await updateFirestoreOrderStatus(orderId, toStatus, { note });
    } catch (e) {
      console.warn('Firestore update order status notice:', e);
    }
    try {
      await adminApi.updateStatus(orderId, toStatus, note);
    } catch (_) {}
  };

  const assignDriverToOrder = async (orderId, driverName) => {
    try {
      await assignDriverToFirestoreOrder(orderId, driverName);
    } catch (e) {
      console.warn('Firestore assign driver notice:', e);
    }
    try {
      await adminApi.assignTask(orderId, driverName);
    } catch (_) {}
  };

  const cancelOrder = async (orderId, reason = 'Cancelled by admin') => {
    try {
      await cancelFirestoreOrder(orderId, reason);
    } catch (e) {
      console.warn('Firestore cancel order notice:', e);
    }
    try {
      await adminApi.cancelOrder(orderId, reason);
    } catch (_) {}
  };

  const createOrder = async (orderData) => {
    return await createFirestoreOrder(orderData);
  };

  const addCustomer = async (data) => {
    try {
      if (data.email) {
        await createCustomerAccountByAdmin({
          email: data.email,
          password: data.password || 'Customer@1234',
          fullName: data.name,
          phone: data.phone,
          location: data.area ? `${data.area}, Bengaluru ${data.pincode || ''}` : (data.location || 'Bengaluru')
        });
      } else {
        await addFirestoreCustomer(data);
      }
    } catch (e) {
      console.warn('Customer account creation notice:', e);
      await addFirestoreCustomer(data);
    }
    try {
      await adminApi.createUser({
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: 'customer',
        password: data.password || 'Customer@1234'
      });
    } catch (_) {}
  };

  const toggleCustomerStatus = async (userId, isActive) => {
    try {
      await updateFirestoreCustomerStatus(userId, isActive);
    } catch (e) {
      console.warn('Firestore toggle customer notice:', e);
    }
    try {
      await adminApi.setUserStatus(userId, isActive);
    } catch (_) {}
  };

  const toggleServiceStatus = async (serviceId, isActive) => {
    try {
      await toggleFirestoreServiceStatus(serviceId, isActive ? 'Inactive' : 'Active');
    } catch (e) {
      console.warn('Firestore toggle service notice:', e);
    }
    try {
      await adminApi.updateService(serviceId, { is_active: isActive });
    } catch (_) {}
  };

  const addService = async (data) => {
    try {
      await addFirestoreService(data);
    } catch (e) {
      console.warn('Firestore add service notice:', e);
    }
    try {
      await adminApi.createService(data);
    } catch (_) {}
  };

  const updatePrices = async (pricesList) => {
    try {
      await adminApi.updatePrices(pricesList);
    } catch (_) {}
  };

  const broadcastNotification = async (data) => {
    try {
      await addFirestoreNotification(data);
    } catch (e) {
      console.warn('Firestore add notification notice:', e);
    }
    try {
      const res = await adminApi.broadcastNotification(data);
      return res.data;
    } catch (_) {
      return data;
    }
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

  const replySupportTicket = replyToSupportTicket;

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

  const updateTicketStatus = async (ticketId, status) => {
    try {
      await adminApi.updateTicketStatus(ticketId, status);
    } catch (_) {}
    await fetchSupportTickets();
  };

  const markNotificationAsRead = async (id) => {
    try {
      await notificationsApi.markRead(id);
    } catch (_) {}
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false, is_read: true } : n));
  };

  const markNotificationAsUnread = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: true, is_read: false } : n));
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await notificationsApi.markAllRead();
    } catch (_) {}
    setNotifications(prev => prev.map(n => ({ ...n, unread: false, is_read: true })));
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
    addFirestoreNotification(newNotif).catch(() => {});
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
        createOrder,
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
