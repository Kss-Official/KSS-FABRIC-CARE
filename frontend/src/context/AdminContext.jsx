import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { formatDisplayDate, parseFlexibleDate } from '../utils/dateFilterUtils';
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
  subscribeAdminSupportTickets,
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
import { supportApi } from '../api/apiClient';

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

export const getComplaintSortTime = (item) => {
  if (!item) return 0;

  // 1. Prioritize explicit creation / update timestamps
  const timestamps = [
    item.createdAt,
    item.updatedAt,
    item.created_at,
    item.updated_at
  ];
  for (const t of timestamps) {
    if (typeof t === 'number' && t > 0) return t;
    if (typeof t === 'string' && t.trim()) {
      const p = new Date(t).getTime();
      if (!isNaN(p) && p > 0) return p;
    }
  }

  // 2. Parse report_date or formatted_report_date
  const dateCandidates = [
    item.report_date,
    item.formatted_report_date,
    item.report_date_only,
    item.date
  ];
  for (const d of dateCandidates) {
    if (!d) continue;
    if (typeof d === 'number' && d > 0) return d;
    if (typeof d === 'string' && d.trim()) {
      const p = new Date(d).getTime();
      if (!isNaN(p) && p > 0) return p;

      const clean = d.replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
      const pClean = new Date(clean).getTime();
      if (!isNaN(pClean) && pClean > 0) return pClean;
    }
  }

  // 3. Fallback: Parse ID if it has epoch timestamp (e.g. comp_1792742375403)
  const idStr = String(item.id || item.order_id_display || item.order_id || '');
  const epochMatch = idStr.match(/\b(17\d{11,13})\b/);
  if (epochMatch) {
    const ep = Number(epochMatch[1]);
    if (ep > 0) return ep;
  }

  // 4. Fallback numeric order id (e.g. FC-10245 -> 10245)
  const digits = idStr.replace(/\D/g, '');
  if (digits) {
    const num = parseInt(digits, 10);
    if (!isNaN(num) && num > 0) return num;
  }

  return 0;
};

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

  // Resolve and format clean pickup date & time slot
  let rawPickupDate = o.pickup?.date || o.pickup_date || o.date || '';
  let cleanPickupDate = '';
  if (rawPickupDate) {
    const parsed = parseFlexibleDate(rawPickupDate);
    if (parsed) {
      cleanPickupDate = formatDisplayDate(parsed);
    } else {
      cleanPickupDate = String(rawPickupDate);
    }
  }
  if (!cleanPickupDate) {
    const fallbackParsed = parseFlexibleDate(o.createdAt || o.placedAt);
    cleanPickupDate = fallbackParsed ? formatDisplayDate(fallbackParsed) : formatDisplayDate(new Date());
  }

  let cleanTimeSlot = o.pickup_time_slot || '';
  if (!cleanTimeSlot && o.pickup?.from && o.pickup?.to) {
    cleanTimeSlot = `${o.pickup.from} – ${o.pickup.to}`;
  } else if (!cleanTimeSlot && (o.pickup?.from || o.pickup?.to)) {
    cleanTimeSlot = `${o.pickup?.from || '09:00 AM'} – ${o.pickup?.to || '11:00 AM'}`;
  }
  if (!cleanTimeSlot) {
    cleanTimeSlot = '09:00 AM – 11:00 AM';
  }
  cleanTimeSlot = cleanTimeSlot.replace(/(AM|PM)\s*[-–—]\s*11:00\s*$/i, '$1');
  cleanTimeSlot = cleanTimeSlot.replace(/\s*[-–—]\s*/, ' – ');

  const finalPickupTime = o.pickupTime && !o.pickupTime.includes('undefined') && !o.pickupTime.startsWith('2026-')
    ? o.pickupTime
    : `${cleanPickupDate}, ${cleanTimeSlot}`;

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
    pickup_date: cleanPickupDate,
    pickup_time_slot: cleanTimeSlot,
    pickupTime: finalPickupTime,
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
  const [complaints, setComplaints] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('fabricare_admin_complaints');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return [...parsed].sort((a, b) => getComplaintSortTime(b) - getComplaintSortTime(a));
          }
        }
      }
    } catch (_) {}
    return [...DEFAULT_COMPLAINTS].sort((a, b) => getComplaintSortTime(b) - getComplaintSortTime(a));
  });
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
  const [supportTickets, setSupportTickets] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('fabricare_support_tickets');
        if (saved) return JSON.parse(saved);
      }
    } catch (_) {}
    return [];
  });
  const [supportSummary, setSupportSummary] = useState({ total_tickets: 0, open: 0, in_progress: 0, resolved: 0 });
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

  const fetchComplaints = useCallback(async () => {
    setComplaintsLoading(true);
    try {
      const endpoints = [
        'http://127.0.0.1:8001/api/admin/complaints/',
        'http://127.0.0.1:8000/api/admin/complaints/',
        '/api/admin/complaints/'
      ];
      let backendComplaints = null;
      let summary = null;
      for (const ep of endpoints) {
        try {
          const res = await fetch(ep);
          if (res.ok) {
            const data = await res.json();
            if (data && data.results && Array.isArray(data.results)) {
              backendComplaints = data.results;
              summary = data.summary;
              break;
            }
          }
        } catch (_) {}
      }
      if (backendComplaints && backendComplaints.length > 0) {
        const sorted = [...backendComplaints].sort((a, b) => getComplaintSortTime(b) - getComplaintSortTime(a));
        setComplaints(sorted);
        try {
          localStorage.setItem('fabricare_admin_complaints', JSON.stringify(sorted));
        } catch (_) {}
      }
    } catch (err) {
      console.error('Error fetching admin complaints:', err);
    } finally {
      setComplaintsLoading(false);
    }
  }, []);

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

    // Initial complaints hydration from backend
    fetchComplaints();
  }, [fetchComplaints]);

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
      const source = (rtdbComplaints && rtdbComplaints.length > 0) ? rtdbComplaints : DEFAULT_COMPLAINTS;
      const cleanList = source.filter(c => {
        const str = String(c?.order_id_display || c?.order_id || c?.id || '').toUpperCase();
        return !str.includes('FC-57606') && !str.includes('57606');
      });
      cleanList.sort((a, b) => {
        const timeA = Number(a.createdAt || a.created_at || a.updatedAt) || (a.report_date ? new Date(a.report_date).getTime() : 0);
        const timeB = Number(b.createdAt || b.created_at || b.updatedAt) || (b.report_date ? new Date(b.report_date).getTime() : 0);
        if (timeB !== timeA) return timeB - timeA;
        return String(b.id || '').localeCompare(String(a.id || ''));
      });
      setComplaints(cleanList);
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

    const unsubSupportTickets = subscribeAdminSupportTickets((rtdbTickets) => {
      if (rtdbTickets && rtdbTickets.length > 0) {
        setSupportTickets(prev => {
          const map = new Map();
          (prev || []).forEach(t => { if (t?.id) map.set(String(t.id), t); });
          rtdbTickets.forEach(t => {
            const idKey = String(t.id || t.ticket_number);
            map.set(idKey, { ...(map.get(idKey) || {}), ...t });
          });
          return Array.from(map.values()).sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0));
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
      if (typeof unsubSupportTickets === 'function') unsubSupportTickets();
      if (typeof unsubServices === 'function') unsubServices();
      if (typeof unsubSettings === 'function') unsubSettings();
    };
  }, [currentUser?.uid, isAdminAuthenticated]);

  // Workflow Handlers
  const assignDriverToOrder = async (orderId, driverParam, taskType = 'pickup', options = {}) => {
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
    const taskId = task ? task.id : (taskType === 'delivery' ? order?.deliveryTaskId : order?.pickupTaskId);

    // Optimistically update local orders immediately so UI and cards update instantaneously in real time
    const newStatus = taskType === 'delivery' ? 'In Transit' : 'Pickup Scheduled';
    const cleanId = String(orderId || '').replace(/^#/, '').trim().toUpperCase();

    setOrders(prev => (prev || []).map(o => {
      const match = 
        o.id === orderId || o.rawId === targetOrderId || o.code === orderId || 
        o.order_id === orderId || o.order_number === orderId ||
        String(o.order_number || '').replace(/^#/, '').trim().toUpperCase() === cleanId ||
        String(o.code || '').replace(/^#/, '').trim().toUpperCase() === cleanId ||
        String(o.id || '').replace(/^#/, '').trim().toUpperCase() === cleanId;

      if (match) {
        const pDate = options.pickupDate || o.pickup_date || o.pickupDate;
        const pSlot = options.pickupTimeSlot || o.pickup_time_slot;
        const pTime = pSlot ? `${pDate || ''}, ${pSlot}` : o.pickupTime;
        return {
          ...o,
          status: newStatus,
          assignedAgentName: driverName,
          assignedAgentPhone: driverPhone,
          assigned_pickup_driver: driverName,
          driver: `${driverName} (${driverPhone})`,
          pickup_date: pDate || o.pickup_date,
          pickup_time_slot: pSlot || o.pickup_time_slot,
          pickupDate: pDate || o.pickupDate,
          pickupTime: pTime || o.pickupTime,
          pickup: {
            ...(o.pickup || {}),
            date: pDate || o.pickup?.date,
            time: pSlot || o.pickup?.time
          }
        };
      }
      return o;
    }));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('fabricare_order_assigned', { detail: { orderId: targetOrderId, driverName, driverPhone, status: newStatus } }));
      window.dispatchEvent(new CustomEvent('fabricare_pickup_delivery_updated', { detail: { orderId: targetOrderId } }));
    }

    try {
      if (taskType === 'delivery') {
        await assignDeliveryAgent(targetOrderId, taskId, effectiveAgentId, currentUser, driverName, driverPhone, options);
      } else {
        await assignPickupAgent(targetOrderId, taskId, effectiveAgentId, currentUser, driverName, driverPhone, options);
      }
    } catch (netErr) {
      console.warn('Background agent assignment network note:', netErr);
    }
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

  const replyToSupportTicket = async (ticketId, replyMessage, selectedStatus) => {
    try {
      const payload = {
        admin_reply: replyMessage,
        status: selectedStatus || 'IN_PROGRESS'
      };
      const res = await supportApi.replyTicket(ticketId, payload);
      try {
        await replyToSupportComplaint(ticketId, replyMessage, currentUser);
      } catch (_) {}

      const updatedTicket = (res && res.data && res.data.ticket) ? res.data.ticket : {
        id: ticketId,
        admin_reply: replyMessage,
        admin_reply_at: new Date().toISOString(),
        formatted_admin_reply_at: new Date().toLocaleString(),
        status: selectedStatus || 'IN_PROGRESS'
      };

      setSupportTickets(prev => prev.map(t => (String(t.id) === String(ticketId)) ? { ...t, ...updatedTicket } : t));
      if (activeSupportTicket && String(activeSupportTicket.id) === String(ticketId)) {
        setActiveSupportTicket(prev => ({ ...prev, ...updatedTicket }));
      }
      return { success: true, ticket: updatedTicket };
    } catch (err) {
      console.error('Error replying to support ticket:', err);
      return { success: false, error: err.message };
    }
  };

  const resolveSupportTicket = async (ticketId, replyMessage) => {
    try {
      const payload = {
        admin_reply: replyMessage,
        status: 'RESOLVED'
      };
      const res = await supportApi.resolveTicket(ticketId, payload);
      try {
        await replyToSupportComplaint(ticketId, replyMessage || 'Marked as resolved', currentUser);
      } catch (_) {}

      const updatedTicket = (res && res.data && res.data.ticket) ? res.data.ticket : {
        id: ticketId,
        admin_reply: replyMessage,
        admin_reply_at: new Date().toISOString(),
        formatted_admin_reply_at: new Date().toLocaleString(),
        status: 'RESOLVED'
      };

      setSupportTickets(prev => prev.map(t => (String(t.id) === String(ticketId)) ? { ...t, ...updatedTicket } : t));
      if (activeSupportTicket && String(activeSupportTicket.id) === String(ticketId)) {
        setActiveSupportTicket(prev => ({ ...prev, ...updatedTicket }));
      }
      return { success: true, ticket: updatedTicket };
    } catch (err) {
      console.error('Error resolving support ticket:', err);
      return { success: false, error: err.message };
    }
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

  // Derived Complaints Summary
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

  const fetchSupportTickets = useCallback(async (isSilent = false) => {
    if (!isSilent) setSupportLoading(true);
    try {
      const endpoints = [
        'http://127.0.0.1:8001/api/admin/support/tickets/',
        'http://127.0.0.1:8000/api/admin/support/tickets/',
        '/api/admin/support/tickets/'
      ];
      let backendTickets = null;
      let summary = null;
      for (const ep of endpoints) {
        try {
          const res = await fetch(ep);
          if (res.ok) {
            const data = await res.json();
            const list = data.results || data.items;
            if (list && Array.isArray(list)) {
              backendTickets = list;
              summary = data.summary;
              break;
            }
          }
        } catch (_) {}
      }

      if (!backendTickets) {
        try {
          const apiRes = await supportApi.getTickets();
          if (apiRes?.data?.results && Array.isArray(apiRes.data.results) && apiRes.data.results.length > 0) {
            backendTickets = apiRes.data.results;
          }
        } catch (_) {}
      }

      if (backendTickets && Array.isArray(backendTickets)) {
        backendTickets.sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0));
        setSupportTickets(backendTickets);
        if (summary) {
          setSupportSummary(summary);
        } else {
          setSupportSummary({
            total_tickets: backendTickets.length,
            open: backendTickets.filter(t => t.status === 'OPEN').length,
            in_progress: backendTickets.filter(t => t.status === 'IN_PROGRESS').length,
            resolved: backendTickets.filter(t => ['RESOLVED', 'CLOSED'].includes(t.status)).length
          });
        }
        try {
          localStorage.setItem('fabricare_support_tickets', JSON.stringify(backendTickets));
        } catch (_) {}
      }
    } catch (err) {
      console.error('Error fetching support tickets:', err);
    } finally {
      if (!isSilent) setSupportLoading(false);
    }
  }, []);

  // Sync tickets whenever admin enters the 'help-support' tab
  useEffect(() => {
    if (adminTab === 'help-support') {
      fetchSupportTickets();
    }
  }, [adminTab, fetchSupportTickets]);

  useEffect(() => {
    fetchSupportTickets();

    const handleTicketCreated = (e) => {
      const newTicket = e.detail;
      if (!newTicket) return;
      setSupportTickets(prev => {
        const list = prev || [];
        const filtered = list.filter(t => String(t.id) !== String(newTicket.id) && (!newTicket.ticket_number || t.ticket_number !== newTicket.ticket_number));
        return [newTicket, ...filtered];
      });
      setSupportSummary(prev => ({
        ...prev,
        total_tickets: (prev.total_tickets || 0) + 1,
        open: (prev.open || 0) + 1
      }));
    };

    const handleTicketUpdated = (e) => {
      const updated = e.detail;
      if (!updated) return;
      setSupportTickets(prev => (prev || []).map(t => (String(t.id) === String(updated.id) || (updated.ticket_number && t.ticket_number === updated.ticket_number)) ? { ...t, ...updated } : t));
    };

    const handleStorageSync = () => {
      fetchSupportTickets(true);
    };

    window.addEventListener('fabricare_support_ticket_created', handleTicketCreated);
    window.addEventListener('fabricare_support_ticket_updated', handleTicketUpdated);
    window.addEventListener('storage', handleStorageSync);

    let bc = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        bc = new BroadcastChannel('fabricare_support_channel');
        bc.onmessage = (msg) => {
          if (msg.data?.type === 'TICKET_CREATED' || msg.data?.type === 'TICKET_UPDATED') {
            fetchSupportTickets(true);
          }
        };
      } catch (_) {}
    }

    return () => {
      window.removeEventListener('fabricare_support_ticket_created', handleTicketCreated);
      window.removeEventListener('fabricare_support_ticket_updated', handleTicketUpdated);
      window.removeEventListener('storage', handleStorageSync);
      if (bc) bc.close();
    };
  }, [fetchSupportTickets]);

  const rescheduleDelivery = useCallback(async (complaintId, rescheduleData) => {
    try {
      const now = Date.now();
      const newDate = rescheduleData?.delivery_date || rescheduleData?.new_delivery_date || rescheduleData?.rescheduled_date || '';
      const newSlot = rescheduleData?.delivery_time_slot || rescheduleData?.time_slot || rescheduleData?.rescheduled_time_slot || '10:00 AM–12:00 PM';
      const notes = rescheduleData?.notes || rescheduleData?.admin_notes || '';

      // 1. Call Django Backend Reschedule API
      const endpoints = [
        `http://127.0.0.1:8001/api/admin/complaints/${complaintId}/reschedule/`,
        `http://127.0.0.1:8000/api/admin/complaints/${complaintId}/reschedule/`,
        `/api/admin/complaints/${complaintId}/reschedule/`
      ];

      const payload = {
        delivery_date: newDate,
        new_delivery_date: newDate,
        rescheduled_date: newDate,
        delivery_time_slot: newSlot,
        time_slot: newSlot,
        rescheduled_time_slot: newSlot,
        notes: notes,
        admin_notes: notes,
        order_id: rescheduleData?.order_id || complaintId,
        order_id_display: rescheduleData?.order_id_display || complaintId,
        customer_name: rescheduleData?.customer_name || 'Customer',
        customer_phone: rescheduleData?.customer_phone || '',
        customer_email: rescheduleData?.customer_email || '',
        failure_reason: rescheduleData?.failure_reason || 'Customer unavailable'
      };

      let backendComplaintData = null;
      for (const ep of endpoints) {
        try {
          const res = await fetch(ep, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (res.ok) {
            const json = await res.json();
            backendComplaintData = json?.complaint;
            break;
          }
        } catch (_) {}
      }

      // 2. Try updating RTDB (complaints, orders, and delivery tasks nodes)
      const targetOrderId = rescheduleData?.order_id || rescheduleData?.order_id_display || complaintId;
      const cleanTarget = String(targetOrderId).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

      try {
        const { ref: rtdbRef, update: rtdbUpdate, get: rtdbGet, push: rtdbPush } = await import('firebase/database');
        const { rtdb } = await import('../config/firebase');
        const updates = {};

        // 1. Update complaint record
        updates[`complaints/${complaintId}/status`] = 'RESCHEDULED';
        updates[`complaints/${complaintId}/rescheduled_date`] = newDate;
        updates[`complaints/${complaintId}/formatted_reschedule_date`] = newDate;
        updates[`complaints/${complaintId}/rescheduled_time_slot`] = newSlot;
        if (notes) updates[`complaints/${complaintId}/notes`] = notes;
        updates[`complaints/${complaintId}/updatedAt`] = now;

        // 2. Fetch complaint to identify target order
        let orderCodeOrKey = null;
        let directOrderKey = null;
        let directTaskId = null;
        try {
          const cSnap = await rtdbGet(rtdbRef(rtdb, `complaints/${complaintId}`));
          if (cSnap.exists()) {
            const cVal = cSnap.val() || {};
            orderCodeOrKey = cVal.order_id || cVal.order_id_display;
            directOrderKey = cVal.order_key;
            directTaskId = cVal.task_id;
          }
        } catch (_) {}

        if (!orderCodeOrKey) {
          const localC = (complaints || []).find(c => c.id === complaintId || c.order_id === complaintId);
          if (localC) {
            orderCodeOrKey = localC.order_id || localC.order_id_display;
            directOrderKey = localC.order_key;
            directTaskId = localC.task_id;
          }
        }

        // 3. Find and update the corresponding order in orders/
        let resolvedOrderKey = directOrderKey;
        let orderObj = null;

        if (!resolvedOrderKey && orderCodeOrKey) {
          const cleanTarget = String(orderCodeOrKey).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          try {
            const allOrdersSnap = await rtdbGet(rtdbRef(rtdb, 'orders'));
            if (allOrdersSnap.exists()) {
              const allOrders = allOrdersSnap.val() || {};
              for (const [k, v] of Object.entries(allOrders)) {
                if (!v) continue;
                const cleanK = String(k || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                const cleanCode = String(v.code || v.order_number || v.id || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                if (cleanK === cleanTarget || cleanCode === cleanTarget) {
                  resolvedOrderKey = k;
                  orderObj = v;
                  break;
                }
              }
            }
          } catch (_) {}
        }

        if (resolvedOrderKey) {
          if (!orderObj) {
            try {
              const oSnap = await rtdbGet(rtdbRef(rtdb, `orders/${resolvedOrderKey}`));
              if (oSnap.exists()) orderObj = oSnap.val() || {};
            } catch (_) {}
          }

          // Update order in RTDB so Delivery Portal instantly receives the reschedule information
          updates[`orders/${resolvedOrderKey}/status`] = 'READY_FOR_DELIVERY';
          updates[`orders/${resolvedOrderKey}/stage`] = 'ready';
          updates[`orders/${resolvedOrderKey}/currentLaundryStep`] = 'ready';
          updates[`orders/${resolvedOrderKey}/raw_status`] = 'READY_FOR_DELIVERY';
          updates[`orders/${resolvedOrderKey}/orderStatus`] = 'Rescheduled';
          updates[`orders/${resolvedOrderKey}/status_display`] = 'Rescheduled';
          updates[`orders/${resolvedOrderKey}/isRescheduled`] = true;
          updates[`orders/${resolvedOrderKey}/rescheduled_date`] = newDate;
          updates[`orders/${resolvedOrderKey}/rescheduled_time_slot`] = newSlot;
          updates[`orders/${resolvedOrderKey}/delivery_date`] = newDate;
          updates[`orders/${resolvedOrderKey}/delivery_time_slot`] = newSlot;
          updates[`orders/${resolvedOrderKey}/formatted_reschedule_date`] = newDate;
          updates[`orders/${resolvedOrderKey}/rescheduleNotes`] = notes;
          updates[`orders/${resolvedOrderKey}/adminNotes`] = notes;
          updates[`orders/${resolvedOrderKey}/rescheduledAt`] = now;
          updates[`orders/${resolvedOrderKey}/delivery_reported`] = false;
          updates[`orders/${resolvedOrderKey}/isDeliveryReported`] = false;
          updates[`orders/${resolvedOrderKey}/updatedAt`] = now;

          // Update associated delivery task in tasks/
          const taskIdToUpdate = directTaskId || orderObj?.deliveryTaskId;
          if (taskIdToUpdate) {
            updates[`tasks/${taskIdToUpdate}/status`] = 'assigned';
            updates[`tasks/${taskIdToUpdate}/isRescheduled`] = true;
            updates[`tasks/${taskIdToUpdate}/rescheduled_date`] = newDate;
            updates[`tasks/${taskIdToUpdate}/rescheduled_time_slot`] = newSlot;
            updates[`tasks/${taskIdToUpdate}/delivery_date`] = newDate;
            updates[`tasks/${taskIdToUpdate}/delivery_time_slot`] = newSlot;
            updates[`tasks/${taskIdToUpdate}/rescheduledDate`] = newDate;
            updates[`tasks/${taskIdToUpdate}/delivery_reported`] = false;
            updates[`tasks/${taskIdToUpdate}/isDeliveryReported`] = false;
            updates[`tasks/${taskIdToUpdate}/updatedAt`] = now;
          }

          // Order History record
          const histPush = rtdbPush(rtdbRef(rtdb, `orderHistory/${resolvedOrderKey}`));
          updates[`orderHistory/${resolvedOrderKey}/${histPush.key}`] = {
            from: 'RESCHEDULED',
            to: 'READY_FOR_DELIVERY',
            byName: 'Admin',
            note: `Delivery rescheduled by Admin for ${newDate} (${newSlot})${notes ? `. Note: "${notes}"` : ''}`,
            at: now
          };

          // Notification to delivery agent
          const agentUid = orderObj?.agentId || orderObj?.assignedAgentId;
          const orderCode = orderObj?.code || orderObj?.order_number || orderCodeOrKey || resolvedOrderKey;
          if (agentUid) {
            const notifPush = rtdbPush(rtdbRef(rtdb, `notifications/${agentUid}`));
            updates[`notifications/${agentUid}/${notifPush.key}`] = {
              type: 'delivery_rescheduled',
              title: `Delivery Rescheduled: ${orderCode}`,
              body: `Order ${orderCode} delivery has been rescheduled to ${newDate} (${newSlot}). ${notes ? `Note: "${notes}"` : ''}`,
              orderId: orderCode,
              orderCode: orderCode,
              createdAt: now,
              read: false
            };
          }

          // Notification to customer
          const customerUid = orderObj?.customerId || orderObj?.customer_id || orderObj?.userId;
          if (customerUid) {
            const cNotifPush = rtdbPush(rtdbRef(rtdb, `notifications/${customerUid}`));
            updates[`notifications/${customerUid}/${cNotifPush.key}`] = {
              type: 'delivery_rescheduled',
              title: 'Delivery Rescheduled',
              body: `Your delivery for order ${orderCode} has been rescheduled to ${newDate} during ${newSlot}.`,
              orderId: orderCode,
              orderCode: orderCode,
              createdAt: now,
              read: false
            };
          }
        }

        // Fallback: Also synchronize any tasks in tasks/ matching the target order
        try {
          const cleanTarget = String(orderCodeOrKey || complaintId || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          const tasksSnap = await rtdbGet(rtdbRef(rtdb, 'tasks'));
          if (tasksSnap.exists()) {
            const allTasks = tasksSnap.val() || {};
            for (const [tKey, tsk] of Object.entries(allTasks)) {
              if (!tsk) continue;
              const cTKey = String(tKey).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
              const cOrd = String(tsk.orderId || tsk.orderCode || tsk.id || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
              if (cTKey.includes(cleanTarget) || (cOrd && cOrd.includes(cleanTarget)) || (cleanTarget && cOrd && cleanTarget.includes(cOrd))) {
                updates[`tasks/${tKey}/delivery_date`] = newDate;
                updates[`tasks/${tKey}/delivery_time_slot`] = newSlot;
                updates[`tasks/${tKey}/rescheduled_date`] = newDate;
                updates[`tasks/${tKey}/rescheduled_time_slot`] = newSlot;
                updates[`tasks/${tKey}/isRescheduled`] = true;
                updates[`tasks/${tKey}/type`] = 'delivery';
                updates[`tasks/${tKey}/status`] = 'READY_FOR_DELIVERY';
                updates[`tasks/${tKey}/updatedAt`] = now;
              }
            }
          }
        } catch (_) {}

        await rtdbUpdate(rtdbRef(rtdb), updates);
      } catch (dbErr) {
        console.warn('RTDB update complaint & order notice:', dbErr);
      }

      // 3. Optimistically update local complaints state & localStorage
      setComplaints(prev => {
        const list = Array.isArray(prev) ? prev : [];
        let found = false;
        const updated = list.map(c => {
          const matches = String(c.id) === String(complaintId) || 
                          String(c.order_id) === String(complaintId) || 
                          String(c.order_id_display) === String(complaintId);
          if (matches) {
            found = true;
            return {
              ...c,
              ...(backendComplaintData || {}),
              status: 'RESCHEDULED',
              rescheduled_date: newDate,
              formatted_reschedule_date: newDate,
              rescheduled_time_slot: newSlot,
              notes: notes ? (c.notes ? `${c.notes}\nAdmin Note: ${notes}` : `Admin Note: ${notes}`) : c.notes,
              updatedAt: now
            };
          }
          return c;
        });
        if (!found) {
          updated.unshift({
            id: complaintId,
            order_id: complaintId,
            order_id_display: complaintId,
            customer_name: rescheduleData?.customer_name || 'Customer',
            customer_phone: rescheduleData?.customer_phone || '',
            failure_reason: rescheduleData?.failure_reason || 'Customer unavailable',
            formatted_report_date: new Date(now).toLocaleString(),
            status: 'RESCHEDULED',
            rescheduled_date: newDate,
            formatted_reschedule_date: newDate,
            rescheduled_time_slot: newSlot,
            notes: notes ? `Admin Note: ${notes}` : '',
            updatedAt: now
          });
        }
        const sorted = [...updated].sort((a, b) => getComplaintSortTime(b) - getComplaintSortTime(a));
        try {
          localStorage.setItem('fabricare_admin_complaints', JSON.stringify(sorted));
        } catch (_) {}
        return sorted;
      });

      // 4. Propagate to Customer Reports in localStorage & dispatch event for Customer Portal
      try {
        const allKeys = Object.keys(localStorage);
        allKeys.forEach(k => {
          if (k.startsWith('fabricare_customer_reports')) {
            try {
              const raw = localStorage.getItem(k);
              if (raw) {
                const arr = JSON.parse(raw);
                if (Array.isArray(arr)) {
                  let found = false;
                  const updatedReports = arr.map(rep => {
                    const codeMatch = String(rep.id) === String(complaintId) ||
                                      String(rep.order_id) === String(complaintId) ||
                                      String(rep.order_id_display) === String(complaintId);
                    if (codeMatch) {
                      found = true;
                      return {
                        ...rep,
                        status: 'RESCHEDULED',
                        rescheduled_date: newDate,
                        new_delivery_date_formatted: newDate,
                        rescheduled_time_slot: newSlot,
                        admin_reply: notes || rep.admin_reply
                      };
                    }
                    return rep;
                  });
                  if (!found) {
                    updatedReports.unshift({
                      id: complaintId,
                      order_id: complaintId,
                      order_id_display: complaintId,
                      customer_name: rescheduleData?.customer_name || 'Customer',
                      customer_phone: rescheduleData?.customer_phone || '',
                      failure_reason: rescheduleData?.failure_reason || 'Customer unavailable',
                      report_date_only: new Date(now).toISOString().split('T')[0],
                      formatted_report_date: new Date(now).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                      status: 'RESCHEDULED',
                      rescheduled_date: newDate,
                      new_delivery_date_formatted: newDate,
                      rescheduled_time_slot: newSlot,
                      admin_reply: notes
                    });
                  }
                  localStorage.setItem(k, JSON.stringify(updatedReports));
                }
              }
            } catch (_) {}
          }
        });
        if (typeof window !== 'undefined') {
          const detail = {
            complaintId,
            orderId: targetOrderId,
            order_id: targetOrderId,
            newDate,
            delivery_date: newDate,
            rescheduled_date: newDate,
            newSlot,
            delivery_time_slot: newSlot,
            rescheduled_time_slot: newSlot,
            notes,
            timestamp: now
          };
          window.dispatchEvent(new CustomEvent('fabricare_complaint_rescheduled', { detail }));
          window.dispatchEvent(new CustomEvent('fabricare_delivery_task_updated', { detail }));
          window.dispatchEvent(new CustomEvent('fabricare_order_updated', { detail }));
        }
      } catch (_) {}

      return { success: true, message: 'Delivery rescheduled successfully', complaint: backendComplaintData };
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
      date: orderData.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      pickup_date: orderData.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      pickup_time_slot: orderData.time || '09:00 AM – 11:00 AM',
      pickupTime: `${orderData.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${orderData.time || '09:00 AM – 11:00 AM'}`,
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
        customers,
        services,
        setServices,
        complaints,
        setComplaints,
        getComplaintSortTime,
        complaintsSummary,
        complaintsLoading,
        fetchComplaints,
        rescheduleDelivery,
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
        drivers: (availableAgents && availableAgents.length > 0) ? availableAgents.map(a => ({
          id: a.uid || a.id,
          uid: a.uid || a.id,
          name: a.name || a.displayName || 'Ravi Sharma',
          phone: a.phone || '+91 98111 22233',
          status: 'Available',
          ordersToday: 3,
          avatar: String(a.name || a.displayName || 'RS').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'RS',
          avatarBg: '#0F172A'
        })) : [
          { id: 'b0DHZGmo4mVuhPTS9HngWS7VulB2', uid: 'b0DHZGmo4mVuhPTS9HngWS7VulB2', name: 'Ravi Sharma', phone: '+91 98111 22233', status: 'Available', ordersToday: 3, avatar: 'RS', avatarBg: '#0F172A' },
          { id: 'd1', name: 'Ravi Kumar', phone: '+91 98765 43210', status: 'Available', ordersToday: 5, avatar: 'RK', avatarBg: '#0F172A' },
          { id: 'd2', name: 'Arjun Singh', phone: '+91 87654 32109', status: 'Available', ordersToday: 4, avatar: 'AS', avatarBg: '#0F172A' },
          { id: 'd3', name: 'Mohammed Taha', phone: '+91 91234 55678', status: 'Available', ordersToday: 3, avatar: 'MT', avatarBg: '#0F172A' },
          { id: 'd4', name: 'Suresh Kumar', phone: '+91 99887 66554', status: 'On Delivery', ordersToday: 2, avatar: 'SK', avatarBg: '#0F172A' },
          { id: 'd5', name: 'Praveen D', phone: '+91 98712 34567', status: 'Available', ordersToday: 4, avatar: 'PD', avatarBg: '#93C5FD' }
        ],
        availableAgents,
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
        supportTickets,
        setSupportTickets,
        supportSummary,
        supportLoading,
        fetchSupportTickets,
        replyToSupportTicket,
        resolveSupportTicket,
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
      getComplaintSortTime,
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
