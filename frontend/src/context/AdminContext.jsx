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
    setLoading(true);

    const unsubOrders = subscribeAdminOrders((rtdbOrders) => {
      // Map to UI shape
      const mapped = (rtdbOrders || []).map((o) => {
        const totalPaise = o.total || 0;
        const totalInr = totalPaise > 0 ? (totalPaise / 100).toFixed(2) : '0.00';
        return {
          ...o,
          id: o.code || o.id,
          order_id: o.code || o.id,
          order_number: o.code || o.id,
          total_amount: totalInr,
          amount: totalInr,
          customer_name: o.customerName || 'Customer',
          customer_phone: o.customerPhone || '',
          pickup_address: o.address ? `${o.address.flatHouse || ''}, ${o.address.areaColony || ''}, ${o.address.city || ''}` : 'Bengaluru',
          pickupTime: `${o.pickup?.date || 'Tomorrow'}, ${o.pickup?.from || '09:00'} - ${o.pickup?.to || '11:00'}`,
          driver: o.assignedAgentName || 'Not Assigned',
          status: o.status === 'PLACED' ? 'Pending Pickup' : (o.status === 'IN_CLEANING' ? 'In Cleaning' : (o.status === 'READY_FOR_DELIVERY' ? 'Ready for Delivery' : (o.status === 'OUT_FOR_DELIVERY' ? 'In Transit' : (o.status === 'DELIVERED' ? 'Completed' : (o.status === 'CANCELLED' ? 'Cancelled' : o.status)))))
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
      unsubOrders();
      unsubTasks();
      unsubAgents();
      unsubCustomers();
      unsubStats();
      unsubComplaints();
      unsubNotifs();
    };
  }, []);

  // Workflow Handlers
  const assignDriverToOrder = async (orderId, driverId, taskType = 'pickup') => {
    if (!orderId || !driverId) throw new Error('Order and driver must be specified.');
    const order = orders.find(o => o.id === orderId || o.code === orderId || o.order_id === orderId);
    const targetOrderId = order?.rawId || order?.id || orderId;

    const task = tasks.find(t => t.orderId === targetOrderId || t.orderCode === orderId);
    const taskId = task ? task.id : (taskType === 'pickup' ? order?.pickupTaskId : order?.deliveryTaskId);

    if (taskType === 'delivery') {
      await assignDeliveryAgent(targetOrderId, taskId, driverId, currentUser);
    } else {
      await assignPickupAgent(targetOrderId, taskId, driverId, currentUser);
    }
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
        complaints,
        notifications,
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
        closeRescheduleDrawer,
        unreadNotificationsCount: (notifications || []).filter(n => !n.isRead).length
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
