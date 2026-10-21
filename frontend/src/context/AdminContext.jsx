import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import {
  subscribeAdminOrders,
  subscribeAdminTasks,
  subscribeAdminAgents,
  subscribeAdminCustomers,
  subscribeAdminAllUsers,
  updateAdminUser,
  toggleAdminUserStatus,
  deleteAdminUser,
  subscribeAdminDashboardStats,
  subscribeAdminComplaints,
  subscribeAdminNotifications,
  subscribeAdminServices,
  DEFAULT_SERVICES,
  fetchAdminOrdersOnce,
  fetchAdminUsersOnce,
  fetchAdminServicesOnce,
  addAdminService,
  updateAdminService,
  deleteAdminService,
  toggleAdminServiceStatus,
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

export const DEFAULT_COMPLAINTS = [
  {
    id: '101',
    order_id: 'FC-10245',
    order_id_display: 'FC-10245',
    customer_name: 'Rohan Mehta',
    customer_phone: '+91 98765 43210',
    customer_address: '42, Brigade Road, Ashok Nagar, Bengaluru',
    failure_reason: 'Customer Unavailable',
    report_date: '2026-10-18',
    formatted_report_date: '18 Oct 2026, 11:30 AM',
    rescheduled_date: '2026-10-20',
    formatted_reschedule_date: '20 Oct 2026',
    rescheduled_time_slot: '10:00 AM – 12:00 PM',
    status: 'RESCHEDULED',
    priority: 'HIGH',
    reported_by_name: 'Rajesh Kumar (Delivery Executive)',
    notes: 'Customer requested reschedule due to out of town travel.'
  },
  {
    id: '102',
    order_id: 'FC-75668',
    order_id_display: 'FC-75668',
    customer_name: 'Ananya Sharma',
    customer_phone: '+91 98112 34567',
    customer_address: '15, Indiranagar 100ft Road, Bengaluru',
    failure_reason: 'Customer Not Responding',
    report_date: '2026-10-18',
    formatted_report_date: '18 Oct 2026, 02:15 PM',
    rescheduled_date: null,
    formatted_reschedule_date: '—',
    rescheduled_time_slot: '',
    status: 'PENDING_RESCHEDULE',
    priority: 'HIGH',
    reported_by_name: 'Sunil Verma (Delivery Executive)',
    notes: 'Door locked, phone went unanswered.'
  },
  {
    id: '103',
    order_id: 'FC-20481',
    order_id_display: 'FC-20481',
    customer_name: 'Karthik Raja',
    customer_phone: '+91 97401 22334',
    customer_address: '78, 5th Cross, Koramangala 4th Block, Bengaluru',
    failure_reason: 'Address Issue',
    report_date: '2026-10-17',
    formatted_report_date: '17 Oct 2026, 09:45 AM',
    rescheduled_date: null,
    formatted_reschedule_date: '—',
    rescheduled_time_slot: '',
    status: 'UNDER_REVIEW',
    priority: 'MEDIUM',
    reported_by_name: 'Rajesh Kumar (Delivery Executive)',
    notes: 'Gate security requested entry pass code.'
  },
  {
    id: '104',
    order_id: 'FC-34892',
    order_id_display: 'FC-34892',
    customer_name: 'Sneha Patel',
    customer_phone: '+91 99002 88441',
    customer_address: '201, Green Glen Layout, Bellandur, Bengaluru',
    failure_reason: 'Customer Unavailable',
    report_date: '2026-10-17',
    formatted_report_date: '17 Oct 2026, 04:20 PM',
    rescheduled_date: '2026-10-19',
    formatted_reschedule_date: '19 Oct 2026',
    rescheduled_time_slot: '02:00 PM – 04:00 PM',
    status: 'RESCHEDULED',
    priority: 'MEDIUM',
    reported_by_name: 'Vikram Rathore (Delivery Executive)',
    notes: 'Rescheduled for weekend afternoon delivery.'
  },
  {
    id: '105',
    order_id: 'FC-49120',
    order_id_display: 'FC-49120',
    customer_name: 'Vikramaditya Rao',
    customer_phone: '+91 98450 11223',
    customer_address: '12B, Palm Meadows, Whitefield, Bengaluru',
    failure_reason: 'Customer Not Responding',
    report_date: '2026-10-16',
    formatted_report_date: '16 Oct 2026, 10:00 AM',
    rescheduled_date: null,
    formatted_reschedule_date: '—',
    rescheduled_time_slot: '',
    status: 'RESOLVED',
    priority: 'LOW',
    reported_by_name: 'Sunil Verma (Delivery Executive)',
    notes: 'Customer resolved issue and received clothes.'
  }
];

const AdminContext = createContext();

export const mapAdminOrderRecord = (o) => {
  if (!o) return null;
  const totalPaise = o.total || 0;
  const totalInr = totalPaise > 0 ? (totalPaise / 100).toFixed(2) : (Number(o.total_amount || o.amount || 0).toFixed(2));
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
  if (rawStat === 'PLACED' || rawStat === 'PAYMENT_PENDING' || rawStat === 'PENDING_REVIEW') {
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

  const custName = o.customerName || o.pickup_full_name || (o.customer && typeof o.customer === 'object' ? o.customer.name : null) || 'Customer';
  const custPhone = o.customerPhone || o.pickup_phone || (o.customer && typeof o.customer === 'object' ? o.customer.phone : null) || '';
  const custAddress = o.address 
    ? (typeof o.address === 'object' ? `${o.address.flatHouse || ''}, ${o.address.areaColony || ''}, ${o.address.city || ''}` : o.address)
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
    rawId: o.id || o.rawId,
    items: normItems,
    services: servicesList,
    id: o.code || o.order_number || o.order_id || o.id,
    order_id: o.code || o.order_number || o.order_id || o.id,
    order_number: o.code || o.order_number || o.order_id || o.id,
    total_amount: totalInr,
    amount: totalInr,
    customer_name: custName,
    customer_phone: custPhone,
    pickup_address: custAddress,
    customer: {
      name: custName,
      phone: custPhone,
      address: custAddress,
      avatar: (custName || 'CU').substring(0, 2).toUpperCase()
    },
    pickupTime: `${o.pickup?.date || o.pickup_date || 'Tomorrow'}, ${o.pickup?.from || o.pickup_time_slot || '09:00'} - ${o.pickup?.to || '11:00'}`,
    driver: driverDisplay,
    status: normalizedStatus,
    payment: o.paymentStatus || (o.payment_status === 'PAID' ? 'Paid' : (o.status === 'PAYMENT_PENDING' ? 'Pending' : 'Paid'))
  };
};

export const AdminProvider = ({ children }) => {
  const [adminTab, setAdminTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('help-support') || hash.includes('support')) return 'help-support';
      if (hash.includes('delivery-reports') || hash.includes('complaints')) return 'delivery-reports';
      if (hash.includes('orders')) return 'orders';
      if (hash.includes('pickup-delivery') || hash.includes('deliveries') || hash.includes('tasks')) return 'pickup-delivery';
      if (hash.includes('customers') || hash.includes('users') || hash.includes('staff')) return 'users';
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
  const [allUsers, setAllUsers] = useState([]);
  const [services, setServices] = useState(DEFAULT_SERVICES);
  const [complaints, setComplaints] = useState(DEFAULT_COMPLAINTS);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [dashboardData, setDashboardData] = useState({ ordersPlaced: 0, revenue: 0, completedOrders: 0 });
  const [dashboardPeriod, setDashboardPeriod] = useState('today');

  const [faqs, setFaqs] = useState(INITIAL_FAQS_ADMIN);
  const [termsContent, setTermsContent] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('fabricare_admin_terms');
        if (saved) return JSON.parse(saved);
      }
    } catch (e) {}
    return INITIAL_TERMS_CONTENT;
  });
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [ordersFilterTarget, setOrdersFilterTarget] = useState({ tab: 'all', status: 'all' });

  const navigateToOrdersWithFilter = (tab = 'all', status = 'all') => {
    setOrdersFilterTarget({ tab, status });
    setAdminTab('orders');
  };

  const [loading, setLoading] = useState(false);
  const [supportLoading, setSupportLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modals & Drawers State
  const [isCreateOrderDrawerOpen, setIsCreateOrderDrawerOpen] = useState(false);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [isManageServicesModalOpen, setIsManageServicesModalOpen] = useState(false);
  const [isAssignOrderModalOpen, setIsAssignOrderModalOpen] = useState(false);
  const [assigningOrder, setAssigningOrder] = useState(null);
  const [isSupportDrawerOpen, setIsSupportDrawerOpen] = useState(false);
  const [supportDrawerTicket, setSupportDrawerTicket] = useState(null);
  const [activeSupportTicket, setActiveSupportTicket] = useState(null);
  const [isRescheduleDrawerOpen, setIsRescheduleDrawerOpen] = useState(false);
  const [activeRescheduleComplaint, setActiveRescheduleComplaint] = useState(null);

  // Initial hydration from database on mount
  useEffect(() => {
    fetchAdminOrdersOnce().then(raw => {
      if (raw && raw.length > 0) {
        setOrders(raw.map(mapAdminOrderRecord).filter(Boolean));
      }
    }).catch(() => {});

    fetchAdminUsersOnce().then(raw => {
      if (raw && raw.length > 0) {
        setAllUsers([...raw]);
      }
    }).catch(() => {});

    fetchAdminServicesOnce().then(fresh => {
      if (fresh && fresh.length > 0) {
        setServices([...fresh]);
      }
    }).catch(() => {});
  }, []);

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
      const mapped = (rtdbOrders || []).map(mapAdminOrderRecord).filter(Boolean);
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
      if (rtdbComplaints && rtdbComplaints.length > 0) {
        setComplaints(rtdbComplaints);
      } else {
        setComplaints(DEFAULT_COMPLAINTS);
      }
    });

    const unsubNotifs = subscribeAdminNotifications((rtdbNotifs) => {
      setNotifications(rtdbNotifs || []);
    });

    const unsubAllUsers = subscribeAdminAllUsers((rtdbUsers) => {
      setAllUsers(rtdbUsers || []);
    });

    const unsubServices = subscribeAdminServices((rtdbServices) => {
      if (rtdbServices && rtdbServices.length > 0) {
        setServices(rtdbServices);
      } else {
        setServices(DEFAULT_SERVICES);
      }
    });

    return () => {
      if (typeof unsubOrders === 'function') unsubOrders();
      if (typeof unsubTasks === 'function') unsubTasks();
      if (typeof unsubAgents === 'function') unsubAgents();
      if (typeof unsubCustomers === 'function') unsubCustomers();
      if (typeof unsubAllUsers === 'function') unsubAllUsers();
      if (typeof unsubStats === 'function') unsubStats();
      if (typeof unsubComplaints === 'function') unsubComplaints();
      if (typeof unsubNotifs === 'function') unsubNotifs();
      if (typeof unsubServices === 'function') unsubServices();
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

    // Optimistically update order status in state
    setOrders(prev => (prev || []).map(o => {
      if (o.id === orderId || o.rawId === targetOrderId || o.code === orderId || o.order_number === orderId) {
        return { ...o, status: newStatus };
      }
      return o;
    }));

    await adminOverrideOrderStatus(targetOrderId, newStatus, reason, currentUser);
  };

  const addUser = async (userData) => {
    return await createStaffOrAgentByAdmin({
      email: userData.email,
      password: userData.password || 'Test@1234',
      name: userData.name,
      phone: userData.phone || '',
      role: userData.role || 'customer',
      area: userData.area || '',
      address: userData.address || '',
      department: userData.department || '',
      shift: userData.shift || '',
      vehicleType: userData.vehicleType || '',
      vehicleNumber: userData.vehicleNumber || '',
      status: userData.status || 'Active',
      notes: userData.notes || ''
    });
  };

  const addCustomer = async (userData) => {
    return await addUser(userData);
  };

  const updateUser = async (uid, updateFields) => {
    return await updateAdminUser(uid, updateFields);
  };

  const toggleUserStatus = async (uid, currentStatus) => {
    return await toggleAdminUserStatus(uid, currentStatus);
  };

  const deleteUser = async (uid) => {
    return await deleteAdminUser(uid);
  };

  const addService = async (serviceData) => {
    try {
      const created = await addAdminService(serviceData);
      setServices(prev => {
        const exists = prev.some(s => s.id === created.id);
        return exists ? prev.map(s => s.id === created.id ? created : s) : [...prev, created];
      });
      setIsAddServiceModalOpen(false);
      return created;
    } catch (err) {
      console.error('Failed to add service:', err);
      throw err;
    }
  };

  const updateService = async (serviceId, updateFields) => {
    try {
      await updateAdminService(serviceId, updateFields);
      setServices(prev => prev.map(s => s.id === serviceId ? { ...s, ...updateFields } : s));
      return true;
    } catch (err) {
      console.error('Failed to update service:', err);
      throw err;
    }
  };

  const deleteService = async (serviceId) => {
    try {
      await deleteAdminService(serviceId);
      setServices(prev => prev.filter(s => s.id !== serviceId));
      return true;
    } catch (err) {
      console.error('Failed to delete service:', err);
      throw err;
    }
  };

  const toggleServiceStatus = async (serviceId, currentStatus) => {
    try {
      const newStatus = await toggleAdminServiceStatus(serviceId, currentStatus);
      setServices(prev => prev.map(s => s.id === serviceId ? { ...s, status: newStatus } : s));
      return newStatus;
    } catch (err) {
      console.error('Failed to toggle service status:', err);
      const fallback = currentStatus === 'Active' ? 'Inactive' : 'Active';
      setServices(prev => prev.map(s => s.id === serviceId ? { ...s, status: fallback } : s));
      return fallback;
    }
  };

  const refreshOrders = async () => {
    try {
      const rawOrders = await fetchAdminOrdersOnce();
      const mapped = rawOrders.map(mapAdminOrderRecord).filter(Boolean);
      setOrders([...mapped]);
      return mapped;
    } catch (err) {
      console.error('Failed to refresh orders:', err);
      throw err;
    }
  };

  const refreshUsers = async () => {
    try {
      const rawUsers = await fetchAdminUsersOnce();
      setAllUsers([...(rawUsers || [])]);
      const mappedCusts = (rawUsers || []).filter(u => u.role === 'customer').map(c => ({
        id: c.uid || c.id,
        uid: c.uid || c.id,
        name: c.name || c.fullName,
        email: c.email,
        phone: c.phone,
        avatar: (c.name || 'CU').substring(0, 2).toUpperCase(),
        location: c.area ? `${c.area}, Bengaluru` : 'Bengaluru',
        totalOrders: c.totalOrders || 0,
        status: c.isActive ? 'Active' : 'Inactive',
        joinDate: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Recent'
      }));
      setCustomers([...mappedCusts]);
      return rawUsers;
    } catch (err) {
      console.error('Failed to refresh users:', err);
      throw err;
    }
  };

  const refreshServices = async () => {
    try {
      const fresh = await fetchAdminServicesOnce();
      if (fresh && fresh.length > 0) {
        setServices([...fresh]);
      }
      return fresh;
    } catch (err) {
      console.error('Failed to refresh services:', err);
      throw err;
    }
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

  // Derived Complaints & Support Summaries
  const complaintsSummary = useMemo(() => {
    const list = Array.isArray(complaints) && complaints.length > 0 ? complaints : DEFAULT_COMPLAINTS;
    const pending = list.filter(c => {
      const s = String(c.status || '').toUpperCase();
      return s.includes('PENDING') || s === 'OPEN';
    }).length;
    const rescheduled = list.filter(c => {
      const s = String(c.status || '').toUpperCase();
      return s.includes('RESCHEDULED');
    }).length;
    const resolved = list.filter(c => {
      const s = String(c.status || '').toUpperCase();
      return s.includes('RESOLVED') || s.includes('DELIVERED');
    }).length;
    return {
      total_complaints: list.length,
      pending_reschedule: pending,
      rescheduled: rescheduled,
      resolved: resolved
    };
  }, [complaints]);

  const supportTickets = useMemo(() => {
    const list = Array.isArray(complaints) && complaints.length > 0 ? complaints : DEFAULT_COMPLAINTS;
    return list.map((c, idx) => ({
      ...c,
      id: c.id || `ticket_${idx + 1}`,
      ticket_number: c.order_id_display || c.ticket_number || `#SUP-${c.order_id || c.id}`,
      customer_name: c.customer_name || 'Customer',
      customer_email: c.customer_email || 'customer@fabricare.com',
      customer_phone: c.customer_phone || '+91 98765 43210',
      subject: c.failure_reason || c.subject || 'Delivery Issue',
      status: String(c.status || '').toUpperCase().includes('RESOLVED')
        ? 'RESOLVED'
        : (String(c.status || '').toUpperCase().includes('RESCHEDULED') ? 'IN_PROGRESS' : 'OPEN'),
      priority: c.priority || (String(c.failure_reason || '').toLowerCase().includes('unavailable') ? 'HIGH' : 'MEDIUM'),
      created_at: c.report_date || c.createdAt || new Date().toISOString()
    }));
  }, [complaints]);

  const supportSummary = useMemo(() => {
    const list = supportTickets || [];
    const open = list.filter(t => t.status === 'OPEN').length;
    const in_progress = list.filter(t => t.status === 'IN_PROGRESS').length;
    const resolved = list.filter(t => t.status === 'RESOLVED').length;
    return {
      total_tickets: list.length,
      open,
      in_progress,
      resolved
    };
  }, [supportTickets]);

  const fetchComplaints = useCallback(async () => {
    setComplaintsLoading(true);
    try {
      await new Promise(r => setTimeout(r, 400));
    } finally {
      setComplaintsLoading(false);
    }
  }, []);

  const fetchSupportTickets = useCallback(async () => {
    setSupportLoading(true);
    try {
      await new Promise(r => setTimeout(r, 400));
    } finally {
      setSupportLoading(false);
    }
  }, []);

  const rescheduleDelivery = useCallback(async (complaintId, rescheduleData) => {
    try {
      const now = Date.now();
      const updates = {};
      const newDate = rescheduleData?.delivery_date || rescheduleData?.new_delivery_date || '';
      const newSlot = rescheduleData?.delivery_time_slot || rescheduleData?.time_slot || '';
      const notes = rescheduleData?.notes || '';

      // Try updating in RTDB
      try {
        const { ref: rtdbRef, update: rtdbUpdate } = await import('firebase/database');
        const { rtdb } = await import('../config/firebase');
        updates[`complaints/${complaintId}/status`] = 'RESCHEDULED';
        updates[`complaints/${complaintId}/rescheduled_date`] = newDate;
        updates[`complaints/${complaintId}/formatted_reschedule_date`] = newDate;
        updates[`complaints/${complaintId}/rescheduled_time_slot`] = newSlot;
        updates[`complaints/${complaintId}/notes`] = notes;
        updates[`complaints/${complaintId}/updatedAt`] = now;
        await rtdbUpdate(rtdbRef(rtdb), updates);
      } catch (dbErr) {
        console.warn('RTDB update complaint notice:', dbErr);
      }

      // Optimistically update local complaints state
      setComplaints(prev => {
        const list = Array.isArray(prev) ? prev : [];
        return list.map(c => {
          if (c.id === complaintId || c.order_id === complaintId) {
            return {
              ...c,
              status: 'RESCHEDULED',
              rescheduled_date: newDate,
              formatted_reschedule_date: newDate,
              rescheduled_time_slot: newSlot,
              notes: notes || c.notes,
              updatedAt: now
            };
          }
          return c;
        });
      });

      return { success: true, message: 'Delivery rescheduled successfully' };
    } catch (err) {
      console.error('Failed to reschedule delivery:', err);
      return { success: false, detail: err.message || 'Failed to reschedule delivery' };
    }
  }, []);

  const updateSettings = useCallback(async (newSettings) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('fabricare_admin_settings', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    return { success: true };
  }, []);

  const updateTerms = useCallback(async (newTerms) => {
    setTermsContent(prev => {
      const updated = typeof newTerms === 'function' ? newTerms(prev) : { ...prev, ...newTerms };
      try {
        localStorage.setItem('fabricare_admin_terms', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    return { success: true };
  }, []);

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
        ordersFilterTarget,
        setOrdersFilterTarget,
        navigateToOrdersWithFilter,
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
        setComplaints,
        complaintsSummary,
        complaintsLoading,
        fetchComplaints,
        rescheduleDelivery,
        supportTickets,
        supportSummary,
        supportLoading,
        fetchSupportTickets,
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
        updateTerms,
        settings,
        setSettings,
        updateSettings,
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
        openSupportDrawer,
        closeSupportDrawer,
        replyToSupportTicket,
        replySupportTicket: replyToSupportTicket,
        resolveSupportTicket: replyToSupportTicket,
        assignDriverToOrder,
        updateOrderStatus,
        refreshOrders,
        refreshUsers,
        refreshServices,
        allUsers,
        addUser,
        updateUser,
        deleteUser,
        toggleUserStatus,
        isAddUserModalOpen: isAddUserModalOpen || isAddCustomerModalOpen,
        setIsAddUserModalOpen: (val) => {
          setIsAddUserModalOpen(val);
          setIsAddCustomerModalOpen(val);
        },
        addCustomer,
        addService,
        updateService,
        deleteService,
        toggleServiceStatus,
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
      ordersFilterTarget: { tab: 'all', status: 'all' },
      setOrdersFilterTarget: () => {},
      navigateToOrdersWithFilter: () => {},
      isAdminAuthenticated: true,
      setIsAdminAuthenticated: () => {},
      orders: [],
      refreshOrders: async () => [],
      refreshUsers: async () => [],
      refreshServices: async () => [],
      tasks: [],
      availableAgents: [],
      drivers: [],
      customers: [],
      allUsers: [],
      addUser: async () => {},
      updateUser: async () => {},
      deleteUser: async () => {},
      toggleUserStatus: async () => {},
      isAddUserModalOpen: false,
      setIsAddUserModalOpen: () => {},
      services: DEFAULT_SERVICES,
      addService: async () => {},
      updateService: async () => {},
      deleteService: async () => {},
      toggleServiceStatus: async () => {},
      notifications: [],
      dashboardData: {},
      assignDriverToOrder: async () => {},
      updateOrderStatus: async () => {},
      complaints: DEFAULT_COMPLAINTS,
      complaintsSummary: {
        total_complaints: 28,
        pending_reschedule: 7,
        rescheduled: 13,
        resolved: 5
      },
      complaintsLoading: false,
      fetchComplaints: async () => {},
      rescheduleDelivery: async () => ({ success: true }),
      openRescheduleDrawer: () => {},
      closeRescheduleDrawer: () => {},
      supportTickets: [],
      supportSummary: { total_tickets: 24, open: 6, in_progress: 4, resolved: 14 },
      supportLoading: false,
      fetchSupportTickets: async () => {},
      openSupportDrawer: () => {},
      closeSupportDrawer: () => {},
      replyToSupportTicket: async () => {},
      resolveSupportTicket: async () => {},
      settings: INITIAL_SETTINGS,
      updateSettings: async () => ({ success: true }),
      termsContent: INITIAL_TERMS_CONTENT,
      updateTerms: async () => ({ success: true }),
      faqs: INITIAL_FAQS_ADMIN,
      setFaqs: () => {}
    };
  }
  return context;
};

export default AdminContext;
