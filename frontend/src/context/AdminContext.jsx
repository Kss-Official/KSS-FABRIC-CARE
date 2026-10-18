import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  subscribeAdminOrders,
  subscribeAdminTasks,
  subscribeAdminAgents,
  subscribeAdminCustomers,
  subscribeAdminDashboardStats,
  subscribeAdminComplaints,
  subscribeAdminNotifications,
  assignPickupAgent,
  assignDeliveryAgent,
  adminOverrideOrderStatus,
  replyToSupportComplaint
} from '../services/adminDataService';
import { createStaffOrAgentByAdmin } from '../services/authService';

export const INITIAL_FAQS_ADMIN = [
  { id: '1', question: 'How do I schedule a pickup?', answer: 'Go to your customer portal, select items and choose a time slot.', category: 'General' },
  { id: '2', question: 'What is the turnaround time?', answer: 'Standard delivery takes 48 hours; Express delivery takes 24 hours.', category: 'Delivery' }
];

export const INITIAL_TERMS_CONTENT = {
  lastUpdated: '15 October 2026',
  sections: [
    { title: '1. Introduction', body: 'Welcome to FabriCare. By using our service, you agree to these terms.' },
    { title: '2. Care Guidelines', body: 'We inspect all garments carefully according to fabric care labels.' }
  ]
};

export const INITIAL_SETTINGS = {
  businessName: 'FabriCare Laundry Services',
  contactEmail: 'support@fabricare.com',
  contactPhone: '+91 98000 00000',
  standardTurnaroundHours: 48,
  expressTurnaroundHours: 24,
  autoAssignDrivers: false
};

const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  const [adminTab, setAdminTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('help-support') || hash.includes('support')) return 'help-support';
      if (hash.includes('delivery-reports') || hash.includes('complaints')) return 'delivery-reports';
      if (hash.includes('orders')) return 'orders';
      if (hash.includes('pickup-delivery') || hash.includes('deliveries') || hash.includes('tasks')) return 'pickup-delivery';
      if (hash.includes('customers') || hash.includes('users')) return 'customers';
      if (hash.includes('services')) return 'services';
      if (hash.includes('notifications')) return 'notifications';
      if (hash.includes('content')) return 'content';
      if (hash.includes('settings') || hash.includes('profile')) return 'settings';
      if (hash.includes('dashboard')) return 'dashboard';
    }
    return 'dashboard';
  });

  const { currentUser, userRole } = useAuth();
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(true);

  useEffect(() => {
    if (userRole === 'admin' || userRole === 'super_admin') {
      setIsAdminAuthenticated(true);
      setAdminTab(prev => (prev === 'login' ? 'dashboard' : prev));
    }
  }, [userRole]);

  // RTDB Live Data States
  const [orders, setOrders] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [availableAgents, setAvailableAgents] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [dashboardData, setDashboardData] = useState({ ordersPlaced: 0, revenue: 0, completedOrders: 0 });
  const [dashboardPeriod, setDashboardPeriod] = useState('today');

  const [faqs, setFaqs] = useState(INITIAL_FAQS_ADMIN);
  const [termsContent, setTermsContent] = useState(INITIAL_TERMS_CONTENT);
  const [settings, setSettings] = useState(INITIAL_SETTINGS);

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
  const [isRescheduleDrawerOpen, setIsRescheduleDrawerOpen] = useState(false);
  const [activeRescheduleComplaint, setActiveRescheduleComplaint] = useState(null);

  // ========================================================
  // REAL-TIME RTDB SUBSCRIPTIONS (Strict cleanup on unmount)
  // ========================================================
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const unsubOrders = subscribeAdminOrders((rtdbOrders) => {
      // Map to UI shape
      const mapped = (rtdbOrders || []).map((o) => {
        const totalPaise = o.total || 0;
        const totalInr = totalPaise > 0 ? (totalPaise / 100).toFixed(2) : '0.00';
        const rawItems = o.items;
        const normItems = Array.isArray(rawItems)
          ? rawItems
          : (rawItems && typeof rawItems === 'object'
            ? Object.values(rawItems).map(it => ({
                name: it.name || it.item_name || 'Laundry Care',
                item_name: it.name || it.item_name || 'Laundry Care',
                quantity: it.quantity || 1,
                price: it.price || it.unitPrice || 60,
                service_name: it.service_name || it.service || 'Wash & Fold'
              }))
            : []);
        const rawStat = String(o.status || '').toUpperCase();
        const hasDriver = Boolean(o.assignedAgentName || (o.driver && o.driver !== 'Not Assigned'));

        let normalizedStatus = 'Pending Pickup';
        if (rawStat === 'PLACED' || rawStat === 'PAYMENT_PENDING') {
          normalizedStatus = hasDriver ? 'Pickup Scheduled' : 'Pending Pickup';
        } else if (rawStat === 'PICKUP_SCHEDULED' || rawStat === 'PICKUP_ASSIGNED') {
          normalizedStatus = 'Pickup Scheduled';
        } else if (rawStat === 'PICKED_UP' || rawStat === 'IN_CLEANING' || rawStat === 'PROCESSING' || rawStat === 'WASHING') {
          normalizedStatus = 'In Cleaning';
        } else if (rawStat === 'READY_FOR_DELIVERY') {
          normalizedStatus = 'Ready for Delivery';
        } else if (rawStat === 'OUT_FOR_DELIVERY' || rawStat === 'DELIVERY_ASSIGNED' || rawStat === 'IN_TRANSIT') {
          normalizedStatus = 'In Transit';
        } else if (rawStat === 'DELIVERED' || rawStat === 'COMPLETED') {
          normalizedStatus = 'Completed';
        } else if (rawStat === 'CANCELLED') {
          normalizedStatus = 'Cancelled';
        } else if (o.status) {
          normalizedStatus = o.status;
        }

        const driverDisplay = o.assignedAgentName
          ? (o.assignedAgentPhone ? `${o.assignedAgentName} (${o.assignedAgentPhone})` : o.assignedAgentName)
          : (o.driver || 'Not Assigned');

        const custName = o.customerName || o.pickup_full_name || 'Customer';
        const custPhone = o.customerPhone || o.pickup_phone || '';
        const custAddress = o.address 
          ? `${o.address.flatHouse || ''}, ${o.address.areaColony || ''}, ${o.address.city || ''}` 
          : (o.pickup_address || 'Bengaluru');

        const servicesList = Array.isArray(o.services)
          ? o.services
          : (Array.isArray(o.services_list)
            ? o.services_list
            : (normItems.length > 0
              ? normItems.map(it => it.service_name || it.item_name || it.name).filter(Boolean)
              : ['Wash & Fold']));

        return {
          ...o,
          rawId: o.id,
          items: normItems,
          services: servicesList,
          id: o.code || o.id,
          order_id: o.code || o.id,
          order_number: o.code || o.id,
          total_amount: totalInr,
          amount: totalInr,
          customer_name: custName,
          customer_phone: custPhone,
          pickup_address: custAddress,
          customer: {
            name: custName,
            phone: custPhone,
            address: custAddress,
            avatar: custName.substring(0, 2).toUpperCase()
          },
          pickupTime: `${o.pickup?.date || 'Tomorrow'}, ${o.pickup?.from || '09:00'} - ${o.pickup?.to || '11:00'}`,
          driver: driverDisplay,
          status: normalizedStatus,
          payment: o.paymentStatus || (o.payment_status === 'PAID' ? 'Paid' : (o.status === 'PAYMENT_PENDING' ? 'Pending' : 'Paid'))
        };
      });
      setOrders(mapped);
      setLoading(false);
    }, (err) => console.warn('Admin orders listener error:', err));

    const unsubTasks = subscribeAdminTasks((rtdbTasks) => {
      const mapped = (rtdbTasks || []).map(t => ({
        ...t,
        order_number: t.orderCode || t.orderId,
        order_id: t.orderCode || t.orderId,
        pickup_address: t.address ? `${t.address.flatHouse || ''}, ${t.address.areaColony || ''}` : '',
        customer_name: t.customer?.name || '',
        customer_phone: t.customer?.phone || ''
      }));
      setTasks(mapped);
    });

    const unsubAgents = subscribeAdminAgents((rtdbAgents) => {
      setAvailableAgents(rtdbAgents || []);
    });

    const unsubCustomers = subscribeAdminCustomers((rtdbCusts) => {
      const mapped = (rtdbCusts || []).map(c => ({
        id: c.uid || c.id,
        uid: c.uid || c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        avatar: (c.name || 'CU').substring(0, 2).toUpperCase(),
        location: 'Bengaluru',
        totalOrders: 0,
        status: c.isActive ? 'Active' : 'Blocked',
        joinDate: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Recent'
      }));
      setCustomers(mapped);
    });

    const unsubStats = subscribeAdminDashboardStats((rtdbStats) => {
      setDashboardData(rtdbStats || { ordersPlaced: 0, revenue: 0, completedOrders: 0 });
    });

    const unsubComplaints = subscribeAdminComplaints((rtdbComplaints) => {
      setComplaints(rtdbComplaints || []);
    });

    const unsubNotifs = subscribeAdminNotifications((rtdbNotifs) => {
      setNotifications(rtdbNotifs || []);
    });

    return () => {
      if (typeof unsubOrders === 'function') unsubOrders();
      if (typeof unsubTasks === 'function') unsubTasks();
      if (typeof unsubAgents === 'function') unsubAgents();
      if (typeof unsubCustomers === 'function') unsubCustomers();
      if (typeof unsubStats === 'function') unsubStats();
      if (typeof unsubComplaints === 'function') unsubComplaints();
      if (typeof unsubNotifs === 'function') unsubNotifs();
    };
  }, [currentUser]);

  // Workflow Handlers
  const assignDriverToOrder = async (orderId, driverParam, taskType = 'pickup') => {
    if (!orderId || !driverParam) throw new Error('Order and driver must be specified.');
    const order = (orders || []).find(o => o.id === orderId || o.code === orderId || o.order_id === orderId || o.rawId === orderId);
    const targetOrderId = order?.rawId || order?.id || orderId;

    let driverName = 'Assigned Driver';
    let driverPhone = '+91 98765 43210';
    let driverId = 'd1';

    if (typeof driverParam === 'object' && driverParam !== null) {
      driverName = driverParam.name || driverName;
      driverPhone = driverParam.phone || driverPhone;
      driverId = driverParam.uid || driverParam.id || driverId;
    } else if (typeof driverParam === 'string') {
      const match = driverParam.match(/^(.*?)\s*\((.*?)\)$/);
      if (match) {
        driverName = match[1].trim();
        driverPhone = match[2].trim();
      } else {
        driverName = driverParam;
      }
    }

    // Match with real availableAgents in RTDB if possible
    const realAgent = (availableAgents || []).find(a => 
      a.uid === driverId || a.id === driverId || 
      (a.name && driverName && a.name.toLowerCase() === driverName.toLowerCase())
    ) || (availableAgents && availableAgents.length > 0 ? availableAgents[0] : null);

    const effectiveAgentId = realAgent?.uid || realAgent?.id || driverId;

    const task = tasks.find(t => t.orderId === targetOrderId || t.orderCode === orderId || t.orderId === order?.code);
    const taskId = task ? task.id : (taskType === 'pickup' ? order?.pickupTaskId : order?.deliveryTaskId);

    if (taskType === 'delivery') {
      await assignDeliveryAgent(targetOrderId, taskId, effectiveAgentId, currentUser, driverName, driverPhone);
    } else {
      await assignPickupAgent(targetOrderId, taskId, effectiveAgentId, currentUser, driverName, driverPhone);
    }

    // Optimistically update local orders so UI updates instantaneously
    const newStatus = taskType === 'delivery' ? 'In Transit' : 'Pickup Scheduled';
    setOrders(prev => (prev || []).map(o => {
      if (o.id === orderId || o.rawId === targetOrderId || o.code === orderId) {
        return {
          ...o,
          status: newStatus,
          assignedAgentName: driverName,
          assignedAgentPhone: driverPhone,
          driver: `${driverName} (${driverPhone})`
        };
      }
      return o;
    }));
  };

  const updateOrderStatus = async (orderId, newStatus, reason = 'Admin updated order status') => {
    const order = orders.find(o => o.id === orderId || o.code === orderId || o.order_id === orderId);
    const targetOrderId = order?.rawId || order?.id || orderId;
    await adminOverrideOrderStatus(targetOrderId, newStatus, reason, currentUser);
  };

  const addCustomer = async (userData) => {
    return await createStaffOrAgentByAdmin({
      email: userData.email,
      password: userData.password || 'Test@1234',
      name: userData.name,
      phone: userData.phone || '',
      role: userData.role || 'customer'
    });
  };

  const replyToSupportTicket = async (ticketId, replyMessage) => {
    await replyToSupportComplaint(ticketId, replyMessage, currentUser);
    setIsSupportDrawerOpen(false);
  };

  const openSupportDrawer = (ticket) => {
    setSupportDrawerTicket(ticket);
    setActiveSupportTicket(ticket);
    setIsSupportDrawerOpen(true);
  };

  const closeSupportDrawer = () => {
    setIsSupportDrawerOpen(false);
    setSupportDrawerTicket(null);
    setActiveSupportTicket(null);
  };

  const openRescheduleDrawer = (complaint) => {
    setActiveRescheduleComplaint(complaint);
    setIsRescheduleDrawerOpen(true);
  };

  const closeRescheduleDrawer = () => {
    setIsRescheduleDrawerOpen(false);
    setActiveRescheduleComplaint(null);
  };

  const markNotificationAsRead = useCallback((notifId) => {
    setNotifications(prev => {
      const list = Array.isArray(prev) ? prev : Object.values(prev || {});
      return list.map(n => n.id === notifId ? { ...n, unread: false, isRead: true } : n);
    });
  }, []);

  const markNotificationAsUnread = useCallback((notifId) => {
    setNotifications(prev => {
      const list = Array.isArray(prev) ? prev : Object.values(prev || {});
      return list.map(n => n.id === notifId ? { ...n, unread: true, isRead: false } : n);
    });
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications(prev => {
      const list = Array.isArray(prev) ? prev : Object.values(prev || {});
      return list.map(n => ({ ...n, unread: false, isRead: true }));
    });
  }, []);

  const deleteNotification = useCallback((notifId) => {
    setNotifications(prev => {
      const list = Array.isArray(prev) ? prev : Object.values(prev || {});
      return list.filter(n => n.id !== notifId);
    });
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const addAdminNotification = useCallback((notif) => {
    setNotifications(prev => {
      const list = Array.isArray(prev) ? prev : Object.values(prev || {});
      const newNotif = {
        id: notif.id || `notif_${Date.now()}`,
        title: notif.title || 'Notice',
        desc: notif.desc || '',
        unread: true,
        isRead: false,
        time: 'Just now',
        timestamp: Date.now(),
        ...notif
      };
      return [newNotif, ...list];
    });
  }, []);

  const safeNotifications = Array.isArray(notifications) ? notifications : Object.values(notifications || {});
  const unreadNotifsCount = safeNotifications.filter(n => !n.isRead && n.unread !== false).length;

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
        drivers: availableAgents,
        customers,
        services,
        setServices,
        complaints,
        notifications: safeNotifications,
        setNotifications,
        markNotificationAsRead,
        markNotificationAsUnread,
        markAllNotificationsAsRead,
        deleteNotification,
        clearAllNotifications,
        addAdminNotification,
        unreadNotificationsCount: unreadNotifsCount,
        dashboardData,
        dashboardPeriod,
        setDashboardPeriod,
        faqs,
        setFaqs,
        termsContent,
        setTermsContent,
        settings,
        setSettings,
        loading,
        supportLoading,
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
        openSupportDrawer,
        closeSupportDrawer,
        replyToSupportTicket,
        replySupportTicket: replyToSupportTicket,
        resolveSupportTicket: replyToSupportTicket,
        assignDriverToOrder,
        updateOrderStatus,
        addCustomer,
        isRescheduleDrawerOpen,
        setIsRescheduleDrawerOpen,
        activeRescheduleComplaint,
        openRescheduleDrawer,
        closeRescheduleDrawer
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    return {
      adminTab: 'dashboard',
      setAdminTab: () => {},
      isAdminAuthenticated: true,
      setIsAdminAuthenticated: () => {},
      orders: [],
      tasks: [],
      availableAgents: [],
      drivers: [],
      customers: [],
      services: [],
      notifications: [],
      dashboardData: {},
      assignDriverToOrder: async () => {},
      updateOrderStatus: async () => {}
    };
  }
  return context;
};

export default AdminContext;
