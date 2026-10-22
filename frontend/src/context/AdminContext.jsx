import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useNotifications } from '../hooks/useNotifications';
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
  subscribeAdminSettings,
  saveAdminSettings,
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
  {
    id: 'faq-1',
    question: 'How does Laundrix pickup and delivery work?',
    answer: 'Schedule a pickup through our app or website. Our executive will arrive with specialized laundry bags and deliver clean clothes within 24-48 hours.',
    status: 'Active',
    displayOrder: 1
  },
  {
    id: 'faq-2',
    question: 'What areas do you service?',
    answer: 'We currently provide pickup and delivery services across Bengaluru including Indiranagar, Koramangala, Whitefield, HSR Layout, Banaswadi, and Malleshwaram.',
    status: 'Active',
    displayOrder: 2
  },
  {
    id: 'faq-3',
    question: 'What types of clothes do you clean?',
    answer: 'We clean all types of everyday and premium fabrics including cotton, silk, linen, wool, denim, party wear, suits, and curtains.',
    status: 'Active',
    displayOrder: 3
  },
  {
    id: 'faq-4',
    question: 'How long does the cleaning process take?',
    answer: 'Standard turnaround time is 1–2 days. Express services may be delivered within 24 hours.',
    status: 'Active',
    displayOrder: 4
  },
  {
    id: 'faq-5',
    question: 'How should I prepare my clothes for pickup?',
    answer: 'Please keep your clothes in a clean bag. You can also add special instructions for delicate items during booking.',
    status: 'Active',
    displayOrder: 5
  },
  {
    id: 'faq-6',
    question: 'What are the payment options?',
    answer: 'We accept online payments (UPI, cards, net banking) and cash on delivery (COD) upon inspection.',
    status: 'Active',
    displayOrder: 6
  },
  {
    id: 'faq-7',
    question: 'How can I track my order?',
    answer: 'You can track your order in real-time through our app or website with live SMS and WhatsApp status updates.',
    status: 'Active',
    displayOrder: 7
  },
  {
    id: 'faq-8',
    question: 'What if I am not satisfied with the service?',
    answer: 'Your satisfaction is our priority. If you are not happy with the service, we offer a 100% free re-wash guarantee.',
    status: 'Inactive',
    displayOrder: 8
  }
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
  let itemsArray = [];
  if (Array.isArray(rawItems)) {
    itemsArray = rawItems;
  } else if (rawItems && typeof rawItems === 'object') {
    itemsArray = Object.values(rawItems);
  }

  const normItems = itemsArray.map(it => {
    const qty = Number(it.quantity || it.qty || 1) || 1;
    let rawUnitPrice = it.unitPrice ?? it.unit_price ?? it.rate ?? it.baseUnitPrice ?? null;
    if (rawUnitPrice == null && it.price != null) {
      const rawP = Number(it.price);
      if (it.lineTotal && Number(it.lineTotal) === rawP && qty > 1) {
        rawUnitPrice = rawP / qty;
      } else if (it.total && Number(it.total) === rawP && qty > 1) {
        rawUnitPrice = rawP / qty;
      } else if (qty > 1 && rawP > 150 && !it.unitPrice) {
        rawUnitPrice = rawP / qty;
      } else {
        rawUnitPrice = rawP;
      }
    }
    if (rawUnitPrice == null) {
      if (it.lineTotal != null) rawUnitPrice = Number(it.lineTotal) / qty;
      else if (it.total != null) rawUnitPrice = Number(it.total) / qty;
      else rawUnitPrice = 60;
    }
    let unitPrice = Number(rawUnitPrice);
    if (isNaN(unitPrice) || unitPrice <= 0) unitPrice = 60;
    if (unitPrice >= 1000 || (unitPrice >= 500 && unitPrice % 100 === 0)) {
      unitPrice = unitPrice / 100;
    }
    const finalUnitPrice = Number(unitPrice.toFixed(2));

    return {
      ...it,
      name: it.name || it.item_name || 'Laundry Care',
      item_name: it.name || it.item_name || 'Laundry Care',
      quantity: qty,
      unitPrice: finalUnitPrice,
      price: finalUnitPrice,
      service_name: it.service_name || it.service || 'Wash & Fold'
    };
  });
  const rawStat = String(o.status || '').toUpperCase();
  const driverName = o.assignedAgentName || o.assignedDeliveryAgentName || o.assignedPickupAgentName || o.assigned_pickup_driver_detail?.full_name || '';
  const driverPhone = o.assignedAgentPhone || o.assignedDeliveryAgentPhone || o.assignedPickupAgentPhone || o.assigned_pickup_driver_detail?.phone || '';
  const hasDriver = Boolean(driverName || (o.driver && o.driver !== 'Not Assigned' && o.driver !== '—'));

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

  const driverDisplay = driverName
    ? (driverPhone ? `${driverName} (${driverPhone})` : driverName)
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

  const { currentUser, userProfile, userRole, updateCurrentUserProfile, refreshProfile } = useAuth();
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(true);

  // Live isolated notifications hook for admin
  const {
    items: liveAdminNotifs,
    unreadCount: liveAdminUnreadCount,
    markRead: hookMarkRead,
    markAllRead: hookMarkAllRead
  } = useNotifications(currentUser?.uid);

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
  const [dashboardData, setDashboardData] = useState({ ordersPlaced: 0, revenue: 0, completedOrders: 0 });
  const [dashboardPeriod, setDashboardPeriod] = useState('today');

  const [faqs, setFaqs] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('fabricare_admin_faqs');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length >= 8 && !parsed[0]?.question?.includes('How do I schedule a pickup')) {
            return parsed;
          }
        }
      }
    } catch (e) {}
    return INITIAL_FAQS_ADMIN;
  });
  const [termsContent, setTermsContent] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('fabricare_admin_terms');
        if (saved) return JSON.parse(saved);
      }
    } catch (e) {}
    return INITIAL_TERMS_CONTENT;
  });
  const [settings, setSettings] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('fabricare_admin_settings');
        if (saved) return JSON.parse(saved);
      }
    } catch (e) {}
    return INITIAL_SETTINGS;
  });

  // Sync settings with userProfile and currentUser from backend
  useEffect(() => {
    if (userProfile || currentUser) {
      const pName = userProfile?.displayName || userProfile?.name || currentUser?.displayName || currentUser?.name;
      const pPhoto = userProfile?.avatarUrl || currentUser?.avatarUrl;
      const pPhone = userProfile?.phone || currentUser?.phone;
      if (pName || pPhoto || pPhone) {
        setSettings(prev => {
          const updated = {
            ...prev,
            name: prev?.name && prev.name !== 'Admin' ? prev.name : (pName || prev?.name || 'Admin'),
            photoUrl: prev?.photoUrl || pPhoto || '',
            phone: prev?.phone || pPhone || '+91 98765 43210'
          };
          try {
            localStorage.setItem('fabricare_admin_settings', JSON.stringify(updated));
          } catch (_) {}
          return updated;
        });
      }
    }
  }, [userProfile, currentUser]);
  const [ordersFilterTarget, setOrdersFilterTarget] = useState({ tab: 'all', status: 'all', service: 'all' });

  const navigateToOrdersWithFilter = (tab = 'all', status = 'all', service = 'all') => {
    setOrdersFilterTarget({ tab, status, service });
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
    if (!currentUser && !isAdminAuthenticated) {
      setLoading(false);
      return;
    }
    setOrders(prev => {
      if (prev.length === 0) setLoading(true);
      return prev;
    });

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

    const unsubAllUsers = subscribeAdminAllUsers((rtdbUsers) => {
      if (rtdbUsers && Array.isArray(rtdbUsers)) {
        setAllUsers(rtdbUsers);
      }
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

    const unsubServices = subscribeAdminServices((rtdbServices) => {
      if (rtdbServices && rtdbServices.length > 0) {
        setServices(rtdbServices);
      } else {
        setServices(DEFAULT_SERVICES);
      }
    });

    const unsubSettings = subscribeAdminSettings((rtdbSettings) => {
      if (rtdbSettings) {
        setSettings(prev => {
          const merged = { ...prev, ...rtdbSettings };
          try {
            localStorage.setItem('fabricare_admin_settings', JSON.stringify(merged));
          } catch (_) {}
          return merged;
        });
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
      if (typeof unsubServices === 'function') unsubServices();
      if (typeof unsubSettings === 'function') unsubSettings();
    };
  }, [currentUser?.uid, isAdminAuthenticated]);

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
    const created = await createStaffOrAgentByAdmin({
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
    if (created) {
      setAllUsers(prev => {
        const exists = (prev || []).some(u => u.uid === created.uid || u.id === created.id);
        return exists ? prev.map(u => (u.uid === created.uid || u.id === created.id) ? { ...u, ...created } : u) : [created, ...(prev || [])];
      });
    }
    return created;
  };

  const addCustomer = async (userData) => {
    return await addUser(userData);
  };

  const updateUser = async (uid, updateFields) => {
    try {
      if (uid) {
        await updateAdminUser(uid, updateFields);
      }
    } catch (err) {
      console.warn('Backend updateAdminUser warning:', err);
    }
    setAllUsers(prev => (prev || []).map(u => (u.uid === uid || u.id === uid) ? { ...u, ...updateFields } : u));
    setCustomers(prev => (prev || []).map(c => (c.uid === uid || c.id === uid) ? { ...c, ...updateFields } : c));
    return true;
  };

  const toggleUserStatus = async (uid, currentStatus) => {
    let newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    try {
      if (uid) {
        const res = await toggleAdminUserStatus(uid, currentStatus);
        if (res) newStatus = res;
      }
    } catch (err) {
      console.warn('Backend toggleAdminUserStatus warning:', err);
    }
    setAllUsers(prev => (prev || []).map(u => (u.uid === uid || u.id === uid) ? { ...u, status: newStatus, isActive: newStatus === 'Active' } : u));
    setCustomers(prev => (prev || []).map(c => (c.uid === uid || c.id === uid) ? { ...c, status: newStatus, isActive: newStatus === 'Active' } : c));
    return newStatus;
  };

  const deleteUser = async (uid) => {
    try {
      if (uid) {
        await deleteAdminUser(uid);
      }
    } catch (err) {
      console.warn('Backend deleteAdminUser warning:', err);
    }
    setAllUsers(prev => (prev || []).filter(u => u.uid !== uid && u.id !== uid));
    setCustomers(prev => (prev || []).filter(c => c.uid !== uid && c.id !== uid));
    return true;
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
    let merged = {};
    setSettings(prev => {
      merged = { ...prev, ...newSettings };
      try {
        localStorage.setItem('fabricare_admin_settings', JSON.stringify(merged));
      } catch (e) {}
      return merged;
    });

    const effectiveName = newSettings.name;
    const effectivePhone = newSettings.phone;
    const effectivePhoto = newSettings.photoUrl !== undefined ? newSettings.photoUrl : undefined;

    // 1. Update AuthContext if available
    if (updateCurrentUserProfile && currentUser?.uid) {
      try {
        await updateCurrentUserProfile({
          ...(effectiveName ? { name: effectiveName, displayName: effectiveName } : {}),
          ...(effectivePhone ? { phone: effectivePhone } : {}),
          ...(effectivePhoto !== undefined ? { avatarUrl: effectivePhoto, photoUrl: effectivePhoto } : {})
        });
      } catch (err) {
        console.warn('AuthContext update error:', err);
      }
    }

    // 2. Persist to backend RTDB adminSettings & user record
    try {
      await saveAdminSettings(merged);

      const uid = currentUser?.uid;
      if (uid) {
        const { ref: rRef, update: rUpdate } = await import('firebase/database');
        const { rtdb } = await import('../config/firebase');

        const userUpdates = {};
        if (effectiveName) {
          userUpdates.name = effectiveName;
          userUpdates.displayName = effectiveName;
        }
        if (effectivePhone) userUpdates.phone = effectivePhone;
        if (effectivePhoto !== undefined) {
          userUpdates.avatarUrl = effectivePhoto;
          userUpdates.photoUrl = effectivePhoto;
        }
        userUpdates.updatedAt = Date.now();
        await rUpdate(rRef(rtdb, `users/${uid}`), userUpdates);
      }
      if (refreshProfile) await refreshProfile();
    } catch (err) {
      console.warn('Backend adminSettings persistence notice:', err);
    }

    // Broadcast change across tabs / components
    try {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('fabricare_profile_updated', { detail: merged }));
    } catch (_) {}

    return { success: true };
  }, [currentUser?.uid, updateCurrentUserProfile, refreshProfile]);

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
    hookMarkRead(notifId);
  }, [hookMarkRead]);

  const markNotificationAsUnread = useCallback(async (notifId) => {
    if (currentUser?.uid && notifId) {
      try {
        const { ref: rRef, update: rUpdate } = await import('firebase/database');
        const { rtdb } = await import('../config/firebase');
        await rUpdate(rRef(rtdb, `notifications/${currentUser.uid}/${notifId}`), { isRead: false });
      } catch (_) {}
    }
  }, [currentUser?.uid]);

  const markAllNotificationsAsRead = useCallback(() => {
    hookMarkAllRead();
  }, [hookMarkAllRead]);

  const deleteNotification = useCallback((notifId) => {
    // Optional client-side delete
  }, []);

  const clearAllNotifications = useCallback(() => {
    // Optional client-side clear
  }, []);

  const addAdminNotification = useCallback(() => {}, []);
  const setNotifications = useCallback(() => {}, []);

  const safeNotifications = liveAdminNotifs || [];
  const unreadNotifsCount = liveAdminUnreadCount;

  // ========================================================
  // REAL-TIME NEW ORDERS TRACKING & SIDEBAR NOTIFICATION BADGE
  // ========================================================
  const SEEN_ORDERS_STORAGE_KEY = 'fabricare_admin_seen_orders';
  const LAST_SEEN_ORDERS_TIME_KEY = 'fabricare_admin_last_seen_orders_time';

  const [seenOrderIds, setSeenOrderIds] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(SEEN_ORDERS_STORAGE_KEY);
        return stored ? new Set(JSON.parse(stored)) : new Set();
      }
    } catch (_) {}
    return new Set();
  });

  const [lastSeenOrdersTime, setLastSeenOrdersTime] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(LAST_SEEN_ORDERS_TIME_KEY);
        return stored ? Number(stored) : null;
      }
    } catch (_) {}
    return null;
  });

  const isInitialOrdersLoadedRef = useRef(false);

  // Initialize baseline/existing orders on first load so we only alert for genuinely new incoming orders
  useEffect(() => {
    if (!orders || orders.length === 0) return;

    if (!isInitialOrdersLoadedRef.current) {
      isInitialOrdersLoadedRef.current = true;
      if (lastSeenOrdersTime === null) {
        let maxTime = 0;
        const initialSeen = new Set(seenOrderIds);
        orders.forEach(o => {
          const t = o.placedAt || o.createdAt || (o.date ? new Date(o.date).getTime() : 0);
          if (t > maxTime) maxTime = t;
          if (o.id) initialSeen.add(String(o.id));
          if (o.rawId) initialSeen.add(String(o.rawId));
          if (o.order_id) initialSeen.add(String(o.order_id));
          if (o.code) initialSeen.add(String(o.code));
        });
        const initTime = maxTime || Date.now();
        setLastSeenOrdersTime(initTime);
        setSeenOrderIds(initialSeen);
        try {
          localStorage.setItem(LAST_SEEN_ORDERS_TIME_KEY, String(initTime));
          localStorage.setItem(SEEN_ORDERS_STORAGE_KEY, JSON.stringify(Array.from(initialSeen)));
        } catch (_) {}
      }
    }
  }, [orders, lastSeenOrdersTime, seenOrderIds]);

  // Compute unread new orders count dynamically in real time
  const newOrdersCount = useMemo(() => {
    if (!orders || orders.length === 0) return 0;
    const thresholdTime = lastSeenOrdersTime || 0;
    const unreadIds = new Set();

    // Check all orders in the realtime orders list
    orders.forEach(o => {
      const orderId = String(o.id || o.rawId || o.order_id || o.code || '');
      if (!orderId) return;
      if (seenOrderIds.has(orderId)) return;

      const orderTime = o.placedAt || o.createdAt || (o.date ? new Date(o.date).getTime() : 0);
      if (orderTime > thresholdTime) {
        unreadIds.add(orderId);
      }
    });

    // Also check any unread 'new_order' notifications received
    (safeNotifications || []).forEach(n => {
      if ((n.type === 'new_order' || n.type === 'order_placed') && !n.isRead && n.orderId) {
        const oId = String(n.orderId);
        if (!seenOrderIds.has(oId)) {
          unreadIds.add(oId);
        }
      }
    });

    return unreadIds.size;
  }, [orders, lastSeenOrdersTime, seenOrderIds, safeNotifications]);

  // Mark all new orders as seen when admin views Orders
  const markOrdersSeen = useCallback(() => {
    const now = Date.now();
    setLastSeenOrdersTime(now);

    setSeenOrderIds(prev => {
      const next = new Set(prev);
      (orders || []).forEach(o => {
        if (o.id) next.add(String(o.id));
        if (o.rawId) next.add(String(o.rawId));
        if (o.order_id) next.add(String(o.order_id));
        if (o.code) next.add(String(o.code));
      });
      (safeNotifications || []).forEach(n => {
        if ((n.type === 'new_order' || n.type === 'order_placed') && n.orderId) {
          next.add(String(n.orderId));
        }
      });
      try {
        localStorage.setItem(LAST_SEEN_ORDERS_TIME_KEY, String(now));
        localStorage.setItem(SEEN_ORDERS_STORAGE_KEY, JSON.stringify(Array.from(next).slice(-500)));
      } catch (_) {}
      return next;
    });

    // Mark any new_order notifications as read
    (safeNotifications || []).forEach(n => {
      if ((n.type === 'new_order' || n.type === 'order_placed') && !n.isRead && n.id) {
        hookMarkRead(n.id);
      }
    });
  }, [orders, safeNotifications, hookMarkRead]);

  // Automatically clear badge once admin navigates to the 'orders' tab
  const markOrdersSeenRef = useRef(markOrdersSeen);
  markOrdersSeenRef.current = markOrdersSeen;

  useEffect(() => {
    if (adminTab === 'orders') {
      markOrdersSeenRef.current();
    }
  }, [adminTab]);

  // Cross-tab and window event listener for new order broadcasts
  useEffect(() => {
    const handleNewOrderEvent = () => {
      // Re-trigger order check if needed
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('fabricare_new_order_placed', handleNewOrderEvent);
      window.addEventListener('storage', handleNewOrderEvent);
      return () => {
        window.removeEventListener('fabricare_new_order_placed', handleNewOrderEvent);
        window.removeEventListener('storage', handleNewOrderEvent);
      };
    }
  }, []);

  const createOrder = useCallback(async (orderData) => {
    const now = Date.now();
    const newId = `#LDX${Math.floor(1000 + Math.random() * 9000)}`;
    const newRecord = {
      id: newId,
      rawId: `ord_${now}`,
      order_id: newId,
      order_number: newId,
      code: newId,
      customerName: orderData.customerName || 'Customer',
      customerPhone: orderData.customerPhone || '+91 98765 43210',
      address: orderData.address || 'Bengaluru',
      services: orderData.selectedServices || ['Wash & Fold'],
      date: orderData.date || new Date().toLocaleDateString(),
      pickupTime: orderData.time || '09:00 AM – 11:00 AM',
      amount: orderData.amount || 560,
      total_amount: orderData.amount || 560,
      status: 'Pending Pickup',
      paymentStatus: 'Paid',
      driver: 'Not Assigned',
      placedAt: now,
      createdAt: now
    };
    setOrders(prev => [newRecord, ...(prev || [])]);
    setIsCreateOrderDrawerOpen(false);
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('fabricare_new_order_placed', { detail: newRecord }));
      }
    } catch (_) {}
    return newRecord;
  }, []);

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
        closeRescheduleDrawer,
        newOrdersCount,
        hasNewOrders: newOrdersCount > 0,
        markOrdersSeen,
        createOrder
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
      setFaqs: () => {},
      newOrdersCount: 0,
      hasNewOrders: false,
      markOrdersSeen: () => {},
      createOrder: async () => {}
    };
  }
  return context;
};

export default AdminContext;
