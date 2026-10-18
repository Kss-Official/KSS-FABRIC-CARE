import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBooking } from '../context/BookingContext';
import { staffApi, laundryApi, notificationsApi, ordersApi } from '../api/apiClient';
import { useStaffActiveOrdersRealtime, useUnreadNotificationsCount } from '../hooks/useRealtime';
import { subscribeOrders, updateFirestoreOrderStatus } from '../services/firestoreService';
import { 
  Sparkles, 
  Layers, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  LogOut, 
  ArrowRight, 
  ShieldCheck, 
  XCircle, 
  Flame, 
  Package, 
  Truck,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Home,
  LayoutGrid,
  WashingMachine,
  LayoutDashboard,
  Bell,
  Menu,
  X,
  User,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Eye,
  Mail,
  Phone,
  MapPin,
  Shield,
  Box,
  Info,
  Check,
  ListChecks,
  Activity,
  Search,
  Calendar,
  Zap,
  Link2,
  ChevronDown,
  ClipboardList,
  Scan,
  ClipboardCheck,
  MoveRight,
  Filter,
  ChevronUp,
  Droplets,
  ArrowUpDown,
  Wind,
  Printer,
  FileText,
  Download,
  Edit3,
  CreditCard,
  Briefcase,
  Building,
  Shirt,
  Camera,
  Trash2,
  Upload
} from 'lucide-react';
import {
  SERVICE_TASK_CONFIG,
  TASK_ORDER,
  PROCESSING_TASKS,
  TASK_LABELS,
  TASK_GERUND,
  SERVICE_DISPLAY_NAMES,
  computeItemTasks,
  getMergedTaskNote,
  getOrderStatusSteps,
  checkItemConflict,
  checkOrderConflict,
  buildPlanString,
  normalizeOrderItem,
  normalizeOrder,
  MOCK_LAUNDRY_ORDERS,
  computeDashboardTaskCounts
} from './taskConfig';

// Universal Service Matcher for Laundry Staff Portal Filters
export const matchesServiceFilter = (serviceList, filterValue) => {
  if (!filterValue || filterValue === 'all') return true;
  if (!serviceList) return false;

  const rawServices = Array.isArray(serviceList) ? serviceList : [serviceList];
  if (rawServices.length === 0) return false;

  const cleanFilter = filterValue.toLowerCase().replace(/[^a-z0-9]/g, '');

  return rawServices.some(svc => {
    if (!svc) return false;
    const cleanSvc = String(svc).toLowerCase().replace(/[^a-z0-9]/g, '');

    // 1. Direct or normalized substring match (e.g., 'washfold' in 'washfold')
    if (cleanSvc.includes(cleanFilter) || cleanFilter.includes(cleanSvc)) {
      return true;
    }

    // 2. Wash & Fold variations
    if (filterValue === 'wash-fold' || cleanFilter === 'washfold') {
      return cleanSvc.includes('fold');
    }

    // 3. Wash + Iron variations
    if (filterValue === 'wash-iron' || cleanFilter === 'washiron') {
      return (cleanSvc.includes('wash') && cleanSvc.includes('iron')) || cleanSvc === 'iron';
    }

    // 4. Steam + Iron variations
    if (filterValue === 'steam-iron' || cleanFilter === 'steamiron') {
      return cleanSvc.includes('steam');
    }

    // 5. Dry Clean variations
    if (filterValue === 'dry-clean' || cleanFilter === 'dryclean') {
      return cleanSvc.includes('dry') || cleanSvc.includes('clean');
    }

    return false;
  });
};

export const orderMatchesService = (ord, filterVal) => {
  if (!filterVal || filterVal === 'all') return true;
  if (!ord) return false;

  // 1. Check top-level services array
  if (ord.services && matchesServiceFilter(ord.services, filterVal)) {
    return true;
  }

  // 2. Check item-level services, tags, or service
  if (ord.items && Array.isArray(ord.items)) {
    return ord.items.some(item => {
      if (item.services && matchesServiceFilter(item.services, filterVal)) return true;
      if (item.tags && matchesServiceFilter(item.tags, filterVal)) return true;
      if (item.service && matchesServiceFilter([item.service], filterVal)) return true;
      return false;
    });
  }

  return false;
};

// Helpers for Laundry Staff Portal URL & Route handling
const parseLaundryUrl = () => {
  let pathname = '';
  let search = '';

  if (typeof window !== 'undefined') {
    const hash = window.location.hash || '';
    if (hash.startsWith('#/')) {
      const [hPath, hQuery] = hash.slice(2).split('?');
      pathname = hPath;
      search = hQuery ? `?${hQuery}` : '';
    } else if (hash.startsWith('#') && hash.length > 1) {
      const [hPath, hQuery] = hash.slice(1).split('?');
      pathname = hPath;
      search = hQuery ? `?${hQuery}` : '';
    }

    if (!pathname || pathname === 'laundry-portal') {
      const p = window.location.pathname.replace(/^\//, '');
      if (p && p !== 'laundry-portal') {
        pathname = p;
        search = window.location.search || '';
      }
    }
  }

  const cleanPath = (pathname || 'dashboard').replace(/^\//, '').trim();
  const params = new URLSearchParams(search);
  const tabParam = params.get('tab') || null;

  return { rawPath: cleanPath, tabParam };
};

const resolveLaundryRoute = (rawPath, tabParam, counts = null) => {
  const p = (rawPath || 'orders').toLowerCase().replace(/^\/+|\/+$/g, '');

  // 1. Orders page and replaced routes -> /orders
  if (
    p === 'orders' ||
    p === 'incoming' ||
    p === 'processing' ||
    p === 'quality-check' ||
    p === 'ready-for-delivery' ||
    p === 'received-clothes' ||
    p === 'inspection' ||
    p === 'washing' ||
    p === 'drying' ||
    p === 'ironing' ||
    p === 'steam' ||
    p === 'dry-clean' ||
    p === 'press' ||
    p === 'folding' ||
    p === 'packing' ||
    p === 'ready' ||
    p === 'qc' ||
    p === 'laundry-portal'
  ) {
    return { page: 'orders', subTab: null, redirect: p !== 'orders' };
  }

  // 2. Standalone pages
  if (p === 'dashboard') {
    return { page: 'dashboard', subTab: null, redirect: false };
  }
  if (p === 'history') {
    return { page: 'history', subTab: null, redirect: false };
  }
  if (p === 'notifications') {
    return { page: 'notifications', subTab: null, redirect: false };
  }
  if (p === 'profile') {
    return { page: 'profile', subTab: null, redirect: false };
  }

  // Default to Orders page
  return { page: 'orders', subTab: null, redirect: false };
};

export const LaundryPortal = () => {
  const { currentUser, logout } = useAuth();
  const { navigateTo } = useBooking();
  const [activePage, setActivePage] = useState(() => {
    const { rawPath, tabParam } = parseLaundryUrl();
    const resolved = resolveLaundryRoute(rawPath, tabParam, null);
    return resolved.page;
  });
  const [activeSubTab, setActiveSubTab] = useState(() => {
    const { rawPath, tabParam } = parseLaundryUrl();
    const resolved = resolveLaundryRoute(rawPath, tabParam, null);
    return resolved.subTab;
  });

  const navigateToRoute = (page, subTab = null, replace = false) => {
    let url = `/${page}`;
    if (subTab) {
      url += `?tab=${subTab}`;
    }

    setActivePage(page);
    setActiveSubTab(subTab);

    if (typeof window !== 'undefined') {
      const isHashRouting = window.location.hash.startsWith('#/') || (window.location.hash && !window.location.pathname.includes(page));
      if (replace) {
        window.history.replaceState({ page, subTab }, '', url);
        if (isHashRouting) window.location.replace(`#${url}`);
      } else {
        window.history.pushState({ page, subTab }, '', url);
        if (isHashRouting) window.location.hash = url;
      }
    }
  };

  const [orders, setOrders] = useState(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('fabricare_staff_orders') : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(normalizeOrder);
        }
      }
    } catch (e) {
      console.warn('Failed to parse cached orders:', e);
    }
    return [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Live Staff API States
  const [dashboardData, setDashboardData] = useState(null);
  const [counts, setCounts] = useState({});
  const [dashServicePeriod, setDashServicePeriod] = useState('Today'); // 'Today' | 'This Week' | 'This Month'
  const [hoveredDonutKey, setHoveredDonutKey] = useState(null);
  const [historyOrders, setHistoryOrders] = useState([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyTotalValue, setHistoryTotalValue] = useState(0);
  const [historyFilterTab, setHistoryFilterTab] = useState('all');
  const [historyPage, setHistoryPage] = useState(1);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historySortField, setHistorySortField] = useState('date');
  const [historySortDirection, setHistorySortDirection] = useState('desc');

  // Realtime bell notification badge
  const unreadCount = useUnreadNotificationsCount(currentUser?.uid || currentUser?.id);

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);


  // Orders Page State (Matching Image 2)
  const [ordersActiveChip, setOrdersActiveChip] = useState('all');
  const [ordersServiceFilter, setOrdersServiceFilter] = useState('all');
  const [ordersSortBy, setOrdersSortBy] = useState('newest');
  const [ordersCurrentPage, setOrdersCurrentPage] = useState(1);
  const [openDropdownOrderId, setOpenDropdownOrderId] = useState(null);
  const [ordersSearchQuery, setOrdersSearchQuery] = useState('');

  const fetchDashboard = useCallback(async (period = 'today') => {
    try {
      const p = period.toLowerCase().includes('week') ? 'week' : period.toLowerCase().includes('month') ? 'month' : 'today';
      const res = await staffApi.getDashboard(p);
      if (res.data) setDashboardData(res.data);
    } catch (err) {
      console.warn('Failed to fetch staff dashboard:', err);
    }
  }, []);

  const fetchCounts = useCallback(async () => {
    try {
      const res = await staffApi.getCounts();
      if (res.data) setCounts(res.data);
    } catch (err) {
      console.warn('Failed to fetch staff counts:', err);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await staffApi.getOrders({ page_size: 100 });
      if (res.data && Array.isArray(res.data.items)) {
        const normalizedItems = res.data.items.map(normalizeOrder);
        setOrders((prev) => {
          const map = new Map();
          prev.forEach((o) => {
            const k = String(o.id || o.order_number || o.code || '');
            if (k) map.set(k, o);
          });
          normalizedItems.forEach((no) => {
            const k = String(no.id || no.order_number || no.code || '');
            if (k) map.set(k, no);
          });
          return Array.from(map.values());
        });
      }
    } catch (err) {
      console.warn('Failed to fetch staff orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async (tab = historyFilterTab, query = historySearchQuery, sortField = historySortField, sortDir = historySortDirection) => {
    try {
      const sortParam = sortField === 'amount'
        ? (sortDir === 'asc' ? 'amount_asc' : 'amount_desc')
        : (sortDir === 'asc' ? 'date_asc' : 'date_desc');
      const params = {
        sort: sortParam,
        page_size: 50
      };
      if (tab === 'delivered') params.status = 'delivered';
      else if (tab === 'cancelled') params.status = 'cancelled';
      if (query && query.trim()) params.q = query.trim();

      const res = await staffApi.getHistory(params);
      if (res.data) {
        setHistoryOrders(res.data.items || []);
        setHistoryTotal(res.data.total || (res.data.items || []).length);
        setHistoryTotalValue(res.data.total_value_paise ? res.data.total_value_paise / 100 : 0);
      }
    } catch (err) {
      console.warn('Failed to fetch staff history:', err);
    }
  }, [historyFilterTab, historySearchQuery, historySortField, historySortDirection]);

  useEffect(() => {
    fetchOrders();
    fetchCounts();
    fetchDashboard(dashServicePeriod);
    fetchHistory();
  }, [fetchOrders, fetchCounts, fetchDashboard, fetchHistory, dashServicePeriod]);

  // Refresh history whenever navigating to Order History page
  useEffect(() => {
    if (activePage === 'history') {
      fetchHistory();
    }
  }, [activePage, fetchHistory]);

  // Realtime active orders listener (refetches counts and metrics on order update)
  const handleRealtimeRefresh = useCallback(() => {
    fetchCounts();
    fetchDashboard(dashServicePeriod);
  }, [fetchCounts, fetchDashboard, dashServicePeriod]);

  useStaffActiveOrdersRealtime(handleRealtimeRefresh);

  // Realtime Firebase Firestore Orders Listener (loads and syncs orders directly from Firebase)
  useEffect(() => {
    const unsubscribe = subscribeOrders(
      (firebaseOrders) => {
        if (Array.isArray(firebaseOrders) && firebaseOrders.length > 0) {
          setOrders((prev) => {
            const map = new Map();
            // 1. Existing orders from REST API or state
            prev.forEach((o) => {
              const k = String(o.id || o.order_number || o.code || '');
              if (k) map.set(k, o);
            });
            // 2. Merge in Firebase Firestore orders
            firebaseOrders.forEach((fo) => {
              const norm = normalizeOrder(fo);
              const k = String(norm.id || norm.order_number || norm.code || '');
              if (k) map.set(k, norm);
            });
            return Array.from(map.values());
          });
        }
      },
      (err) => {
        console.warn('Firebase orders subscription note:', err.message);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Modals state

  // Dropdown outside click & Escape listener
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (openDropdownOrderId && !e.target.closest('.orders-action-col')) {
        setOpenDropdownOrderId(null);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpenDropdownOrderId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openDropdownOrderId]);

  // Quick advance/revert handler for Orders Table
  const handleOrdersQuickAdvance = async (order, nextStageKey, isRevert = false) => {
    setOpenDropdownOrderId(null);
    const orderIdentifier = order.key || order.id || order.order_number || order.code || order.raw_id;

    const STEP_LABELS = {
      RECEIVED: { label: 'Received', stage: 'received' },
      INSPECTION: { label: 'Inspection', stage: 'inspection' },
      WASHING: { label: 'Washing', stage: 'washing' },
      DRYING: { label: 'Drying', stage: 'drying' },
      STEAMING: { label: 'Steaming', stage: 'steaming' },
      DRY_CLEANING: { label: 'Dry Cleaning', stage: 'dry_cleaning' },
      IRONING: { label: 'Ironing', stage: 'ironing' },
      PRESSING: { label: 'Pressing', stage: 'pressing' },
      FOLDING: { label: 'Folding', stage: 'folding' },
      QUALITY_CHECK: { label: 'Quality Check', stage: 'quality' },
      PACKING: { label: 'Packing', stage: 'packing' },
      READY_FOR_DELIVERY: { label: 'Ready for Delivery', stage: 'ready' },
      OUT_FOR_DELIVERY: { label: 'Out for Delivery', stage: 'delivery' },
      DELIVERED: { label: 'Delivered', stage: 'delivered' }
    };
    const sInfo = STEP_LABELS[nextStageKey] || { label: nextStageKey, stage: String(nextStageKey).toLowerCase() };

    // Optimistically update orders list immediately for instantaneous feedback
    setOrders((prev) =>
      prev.map((o) => {
        const isMatch = (
          (order.id && o.id === order.id) ||
          (order.order_number && o.order_number === order.order_number) ||
          (order.code && o.code === order.code) ||
          (order.key && o.key === order.key)
        );
        if (isMatch) {
          return {
            ...o,
            status: sInfo.label,
            orderStatus: sInfo.label,
            status_display: sInfo.label,
            processing_stage: sInfo.stage,
            stage: sInfo.stage,
            raw_status: nextStageKey
          };
        }
        return o;
      })
    );

    try {
      await staffApi.updateStatus(
        orderIdentifier,
        nextStageKey,
        isRevert ? `Reverted to ${sInfo.label}` : `Advanced to ${sInfo.label}`
      );
      await Promise.all([
        fetchOrders(),
        fetchCounts(),
        fetchHistory(),
        fetchDashboard ? fetchDashboard(dashServicePeriod) : Promise.resolve()
      ]);
    } catch (err) {
      console.error('Status transition error:', err);
      alert(err.message || 'Status transition failed. Please try again.');
      await Promise.all([fetchOrders(), fetchCounts()]);
    }
  };

  // 1. Confirm Receipt & Log Discrepancies
  const [receiptModalOrder, setReceiptModalOrder] = useState(null);
  const [receivedBags, setReceivedBags] = useState(1);
  const [receivedWeight, setReceivedWeight] = useState('');
  const [hasDiscrepancy, setHasDiscrepancy] = useState(false);
  const [discrepancyNotes, setDiscrepancyNotes] = useState('');
  const [submittingReceipt, setSubmittingReceipt] = useState(false);

  // 2. Stage Advance Modal
  const [advancingOrder, setAdvancingOrder] = useState(null);
  const [targetStage, setTargetStage] = useState('WASHING');
  const [stageNotes, setStageNotes] = useState('');
  const [submittingStage, setSubmittingStage] = useState(false);

  // 3. Quality Check Modal
  const [qcModalOrder, setQcModalOrder] = useState(null);
  const [qcPassed, setQcPassed] = useState(true);
  const [qcNotes, setQCNotes] = useState('');
  const [reprocessStage, setReprocessStage] = useState('WASHING');
  const [submittingQc, setSubmittingQc] = useState(false);

  // 4. Packing Modal
  const [packingModalOrder, setPackingModalOrder] = useState(null);
  const [packingNotes, setPackingNotes] = useState('');
  const [submittingPack, setSubmittingPack] = useState(false);

  // 5. Order Tracker & Stage Plan Modal
  const [trackerModalOrder, setTrackerModalOrder] = useState(null);

  // 6. Conflict Resolution Modal
  const [conflictModalOrder, setConflictModalOrder] = useState(null);

  // 7. Redesigned Dashboard State
  const [dashboardSearch, setDashboardSearch] = useState('');
  const [scheduleTab, setScheduleTab] = useState('pickups'); // 'pickups' | 'deliveries'
  const [overviewPeriod, setOverviewPeriod] = useState('Today');
  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');

  // 8. Incoming Orders State (Matching Image 1)
  const [incomingFilterTab, setIncomingFilterTab] = useState('all'); // 'all' | 'express' | 'standard'
  const [incomingSortBy, setIncomingSortBy] = useState('newest'); // 'newest' | 'oldest'
  const [incomingFilterDate, setIncomingFilterDate] = useState('today');
  const [incomingFilterService, setIncomingFilterService] = useState('all');
  const [incomingFilterStatus, setIncomingFilterStatus] = useState('all');
  const [expandedOrderIds, setExpandedOrderIds] = useState(() => new Set(['ord-fc-10452', 'ord-fc-10453', 'ord-fc-10454', 'ord-fc-10455', 'ord-fc-10456']));
  const [incomingSearchQuery, setIncomingSearchQuery] = useState('');

  const toggleOrderExpand = (orderId) => {
    setExpandedOrderIds(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  // 9. Processing Page State (Matching Image 1)
  const [processingStageFilter, setProcessingStageFilter] = useState('all'); // 'all' | 'inspection' | 'washing' | 'drying' | 'ironing' | 'folding' | 'quality_check' | 'packing'
  const [processingSearchQuery, setProcessingSearchQuery] = useState('');
  const [processingFilterDate, setProcessingFilterDate] = useState('today');
  const [processingFilterService, setProcessingFilterService] = useState('all');
  const [processingFilterStatus, setProcessingFilterStatus] = useState('all');
  const [processingSortBy, setProcessingSortBy] = useState('stage');

  // 10. Quality Check Page State (Matching Image 1)
  const [qcFilterTab, setQcFilterTab] = useState('all'); // 'all' | 'pending' | 'in_progress' | 'completed'
  const [qcSearchQuery, setQcSearchQuery] = useState('');
  const [qcFilterDate, setQcFilterDate] = useState('today');
  const [qcFilterService, setQcFilterService] = useState('all');
  const [qcFilterStatus, setQcFilterStatus] = useState('quality_check');
  const [qcSortBy, setQcSortBy] = useState('newest');

  // 11. Ready for Delivery Page State (Matching Image 1)
  const [deliveryFilterTab, setDeliveryFilterTab] = useState('all');
  const [deliverySearchQuery, setDeliverySearchQuery] = useState('');
  const [deliveryFilterDate, setDeliveryFilterDate] = useState('today');
  const [deliveryFilterService, setDeliveryFilterService] = useState('all');
  const [deliveryFilterStatus, setDeliveryFilterStatus] = useState('ready_for_delivery');
  const [deliverySortBy, setDeliverySortBy] = useState('newest');
  const [dispatchedOrderIds, setDispatchedOrderIds] = useState(() => new Set());

  // 12. Order History Page State (Matching Image 2)
  const [historyFilterDate, setHistoryFilterDate] = useState('26 Apr – 26 May 2025');

  // 13. Top Navbar User Profile Dropdown (Matching Reference Design)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };
    if (userDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userDropdownOpen]);

  // 14. Staff Profile State & Edit Modal (Matching Image 1)
  const [profileData, setProfileData] = useState(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('fabricare_staff_profile') : null;
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      username: 'laundry_anita',
      fullName: 'Anita Sharma',
      employeeId: '#FC-LND-007',
      designation: 'Senior Fabric Care Specialist',
      assignedDesk: 'Banaswadi Hub',
      email: 'anita.sharma@fabricare.com',
      phone: '+91 98765 43211',
      facilityDesk: 'Central Laundry Plant, Banaswadi, Bengaluru - 560043',
      department: 'Eco-Sanitization & Garment Finishing',
      certifications: 'Master Fabric Care & Industrial Steam Press Certified',
      activeOrdersBatches: 9,
      qualityPassRate: '99.8%',
      avatarUrl: ''
    };
  });
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState(profileData);
  const avatarInputRef = useRef(null);

  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size exceeds 5MB limit. Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      setEditProfileForm(prev => ({
        ...prev,
        avatarUrl: dataUrl
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteAvatar = () => {
    setEditProfileForm(prev => ({
      ...prev,
      avatarUrl: ''
    }));
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setProfileData(editProfileForm);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('fabricare_staff_profile', JSON.stringify(editProfileForm));
      }
    } catch (e) {}
    setEditProfileOpen(false);
  };

  const saveOrdersState = (updatedOrders) => {
    setOrders(updatedOrders);
  };

  const handleResetDemoOrders = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('fabricare_staff_orders');
      }
    } catch (e) {}
    const fresh = MOCK_LAUNDRY_ORDERS.map(normalizeOrder);
    setOrders(fresh);
  };

  const sortExpressFirst = (arr = []) => {
    return [...arr].sort((a, b) => {
      const aExp = Boolean(a.is_express || a.express || a.priority === 'EXPRESS');
      const bExp = Boolean(b.is_express || b.express || b.priority === 'EXPRESS');
      if (aExp && !bExp) return -1;
      if (!aExp && bExp) return 1;
      return 0;
    });
  };

  const handleAdvanceItemTask = (orderId, itemId) => {
    const updated = orders.map(order => {
      if (order.id !== orderId) return order;

      const newItems = (order.items || []).map(item => {
        if (item.id !== itemId) return item;

        const currentIdx = typeof item.currentTaskIndex === 'number' ? item.currentTaskIndex : 0;
        const tasks = item.tasks || computeItemTasks(item.services);
        const nextIdx = currentIdx + 1;

        if (nextIdx < tasks.length) {
          return {
            ...item,
            currentTaskIndex: nextIdx,
            status: 'PROCESSING'
          };
        } else {
          // Completed final task in plan!
          return {
            ...item,
            currentTaskIndex: tasks.length - 1,
            status: 'READY_FOR_QC'
          };
        }
      });

      // An order moves to Quality Check only when ALL its items are done!
      const allItemsReady = newItems.every(
        it => it.status === 'READY_FOR_QC' || it.status === 'COMPLETED'
      );

      return {
        ...order,
        items: newItems,
        status: allItemsReady ? 'QUALITY_CHECK' : 'PROCESSING'
      };
    });

    saveOrdersState(updated);
  };

  const handleAdvanceAllItemsInStage = (orderId, taskId) => {
    const updated = orders.map(order => {
      if (order.id !== orderId) return order;

      const newItems = (order.items || []).map(item => {
        const tasks = item.tasks || computeItemTasks(item.services);
        const currentIdx = typeof item.currentTaskIndex === 'number' ? item.currentTaskIndex : 0;
        const activeTask = tasks[currentIdx];

        if (activeTask === taskId && item.status !== 'READY_FOR_QC') {
          const nextIdx = currentIdx + 1;
          if (nextIdx < tasks.length) {
            return {
              ...item,
              currentTaskIndex: nextIdx,
              status: 'PROCESSING'
            };
          } else {
            return {
              ...item,
              currentTaskIndex: tasks.length - 1,
              status: 'READY_FOR_QC'
            };
          }
        }
        return item;
      });

      const allItemsReady = newItems.every(
        it => it.status === 'READY_FOR_QC' || it.status === 'COMPLETED'
      );

      return {
        ...order,
        items: newItems,
        status: allItemsReady ? 'QUALITY_CHECK' : 'PROCESSING'
      };
    });

    saveOrdersState(updated);
  };

  const handleApproveInspection = (orderId) => {
    const updated = orders.map(order => {
      if (order.id !== orderId) return order;
      const newItems = (order.items || []).map(item => ({
        ...item,
        currentTaskIndex: 0,
        status: 'PROCESSING',
        inspected: true
      }));
      return {
        ...order,
        status: 'PROCESSING',
        inspected: true,
        inspected_at: new Date().toISOString(),
        items: newItems
      };
    });
    saveOrdersState(updated);
  };

  const handleResolveConflict = (orderId, decisionType) => {
    const updated = orders.map(order => {
      if (order.id !== orderId) return order;

      let newItems = [...(order.items || [])];
      if (decisionType === 'DRY_CLEAN_ONLY') {
        newItems = newItems.map(item => {
          const s = (item.services || []).filter(x => !['wash-fold', 'wash-iron', 'wash_fold', 'wash_iron'].includes(x));
          if (!s.includes('dry-clean')) s.push('dry-clean');
          return {
            ...item,
            services: s,
            tasks: computeItemTasks(s),
            currentTaskIndex: 0
          };
        });
      } else if (decisionType === 'WASH_ONLY') {
        newItems = newItems.map(item => {
          const s = (item.services || []).filter(x => !['dry-clean', 'dry_clean'].includes(x));
          if (!s.includes('wash-fold')) s.push('wash-fold');
          return {
            ...item,
            services: s,
            tasks: computeItemTasks(s),
            currentTaskIndex: 0
          };
        });
      }

      return {
        ...order,
        items: newItems,
        has_conflict: false,
        conflict_resolved: true,
        conflict_decision: decisionType
      };
    });

    saveOrdersState(updated);
    setConflictModalOrder(null);
  };

  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const res = await notificationsApi.getNotifications();
      const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setNotifications(list);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleRefreshAll = async () => {
    await Promise.all([fetchOrders(), fetchDashboard(), fetchCounts(), fetchHistory(), fetchNotifications()]);
  };

  const handleLogout = async () => {
    await logout();
    navigateTo('home');
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await notificationsApi.markAllRead();
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark notifications as read:', err);
    }
  };

  const handleConfirmReceipt = async (e) => {
    e.preventDefault();
    if (!receiptModalOrder) return;
    setSubmittingReceipt(true);
    const bCount = parseInt(receivedBags) || 1;
    const wKg = receivedWeight ? parseFloat(receivedWeight) : null;
    const targetId = receiptModalOrder.id || receiptModalOrder.order_number || receiptModalOrder.code;
    updateFirestoreOrderStatus(targetId, 'In Cleaning', {
      stage: 'inspection',
      raw_status: 'RECEIVED_BY_LAUNDRY',
      bags_count: bCount,
      weight_kg: wKg,
      discrepancy_found: hasDiscrepancy,
      discrepancy_notes: discrepancyNotes
    }).catch(e => console.warn('Firestore confirmReceipt note:', e));

    try {
      await laundryApi.confirmReceipt(receiptModalOrder.id, {
        received_bags_count: bCount,
        bags_count: bCount,
        received_weight_kg: wKg,
        weight_kg: wKg,
        discrepancy_found: hasDiscrepancy,
        has_discrepancy: hasDiscrepancy,
        discrepancy_details: discrepancyNotes,
        discrepancy_notes: discrepancyNotes
      });
      fetchOrders();
    } catch (err) {
      console.warn('API error during confirmReceipt, applying local fallback:', err);
      const updated = orders.map(o => {
        if (o.id === receiptModalOrder.id) {
          return {
            ...o,
            status: 'RECEIVED_BY_LAUNDRY',
            processing_stage: 'RECEIVED',
            bags_count: bCount,
            weight_kg: wKg,
            has_discrepancy: hasDiscrepancy,
            discrepancy_notes: discrepancyNotes
          };
        }
        return o;
      });
      setOrders(updated);
      saveOrdersState(updated);
    } finally {
      setReceiptModalOrder(null);
      setReceivedBags(1);
      setReceivedWeight('');
      setHasDiscrepancy(false);
      setDiscrepancyNotes('');
      setSubmittingReceipt(false);
    }
  };

  const handleAdvanceStage = async (e) => {
    e.preventDefault();
    if (!advancingOrder) return;
    setSubmittingStage(true);

    const targetId = advancingOrder.id || advancingOrder.order_number || advancingOrder.code;
    const isReady = targetStage === 'PACKED' || targetStage === 'READY_FOR_DELIVERY';
    updateFirestoreOrderStatus(targetId, isReady ? 'Ready for Delivery' : 'In Cleaning', {
      stage: targetStage.toLowerCase(),
      raw_status: targetStage,
      laundryNotes: stageNotes
    }).catch(e => console.warn('Firestore advanceStage note:', e));

    try {
      await laundryApi.advanceStage(advancingOrder.id, {
        stage: targetStage,
        notes: stageNotes
      });
      fetchOrders();
    } catch (err) {
      console.warn('API error during advanceStage, applying local fallback:', err);
      const updated = orders.map(o => {
        if (o.id === advancingOrder.id) {
          return {
            ...o,
            status: targetStage,
            processing_stage: targetStage
          };
        }
        return o;
      });
      setOrders(updated);
      saveOrdersState(updated);
    } finally {
      setAdvancingOrder(null);
      setStageNotes('');
      setSubmittingStage(false);
    }
  };

  const handleQualityCheck = async (e) => {
    e.preventDefault();
    if (!qcModalOrder) return;
    setSubmittingQc(true);

    const targetId = qcModalOrder.id || qcModalOrder.order_number || qcModalOrder.code;
    updateFirestoreOrderStatus(targetId, qcPassed ? 'Ready for Delivery' : 'In Cleaning', {
      stage: qcPassed ? 'ready' : 'washing',
      raw_status: qcPassed ? 'READY_FOR_DELIVERY' : 'QC_FAILED',
      qcResult: qcPassed ? 'PASSED' : 'FAILED',
      qcNotes
    }).catch(e => console.warn('Firestore qualityCheck note:', e));

    try {
      await laundryApi.qualityCheck(qcModalOrder.id, {
        passed: qcPassed,
        notes: qcNotes,
        reprocess_stage: qcPassed ? null : reprocessStage
      });
      fetchOrders();
    } catch (err) {
      console.warn('API error during qualityCheck, applying local fallback:', err);
      const updated = orders.map(o => {
        if (o.id === qcModalOrder.id) {
          if (qcPassed) {
            return {
              ...o,
              status: 'PACKING',
              processing_stage: 'PACKING'
            };
          } else {
            const taskMap = { WASHING: 'wash', DRYING: 'dry', IRONING: 'iron' };
            const reprocessTask = taskMap[reprocessStage] || 'wash';
            const updatedItems = (o.items || []).map(it => {
              const taskIdx = it.tasks ? it.tasks.indexOf(reprocessTask) : -1;
              return {
                ...it,
                status: 'PROCESSING',
                currentTaskIndex: taskIdx !== -1 ? taskIdx : 0
              };
            });
            return {
              ...o,
              status: 'PROCESSING',
              processing_stage: reprocessStage,
              items: updatedItems
            };
          }
        }
        return o;
      });
      setOrders(updated);
      saveOrdersState(updated);
    } finally {
      setQcModalOrder(null);
      setQCNotes('');
      setSubmittingQc(false);
    }
  };

  const handlePackOrder = async (e) => {
    e.preventDefault();
    if (!packingModalOrder) return;
    setSubmittingPack(true);

    const targetId = packingModalOrder.id || packingModalOrder.order_number || packingModalOrder.code;
    updateFirestoreOrderStatus(targetId, 'Ready for Delivery', {
      stage: 'ready',
      raw_status: 'READY_FOR_DELIVERY',
      laundryNotes: packingNotes
    }).catch(e => console.warn('Firestore packOrder note:', e));

    try {
      await laundryApi.packOrder(packingModalOrder.id, {
        notes: packingNotes
      });
      fetchOrders();
    } catch (err) {
      console.warn('API error during packOrder, applying local fallback:', err);
      const updated = orders.map(o => {
        if (o.id === packingModalOrder.id) {
          return {
            ...o,
            status: 'READY_FOR_DELIVERY',
            processing_stage: 'READY_FOR_DELIVERY'
          };
        }
        return o;
      });
      setOrders(updated);
      saveOrdersState(updated);
    } finally {
      setPackingModalOrder(null);
      setPackingNotes('');
      setSubmittingPack(false);
    }
  };

  // Filter queues based on status
  const incomingOrders = orders.filter(o => {
    const s = String(o.status || o.raw_status || '').toUpperCase();
    return ['PICKED_UP', 'DROPPED_OFF_AT_LAUNDRY', 'DROPPED_OFF', 'IN_TRANSIT_TO_HUB'].includes(s) ||
           (s === 'IN CLEANING' && (o.stage === 'incoming' || o.stage === 'inspection')) ||
           o.stage === 'incoming';
  });
  const receivedOrders = orders.filter(o => {
    const s = String(o.status || o.raw_status || '').toUpperCase();
    return ['RECEIVED_BY_LAUNDRY', 'RECEIVED_AT_LAUNDRY', 'RECEIVED'].includes(s);
  });
  const inspectionOrders = orders.filter(o => {
    const s = String(o.status || o.raw_status || '').toUpperCase();
    return s === 'INSPECTION' || o.stage === 'inspection';
  });
  const processingOrders = orders.filter(o => {
    const s = String(o.status || o.raw_status || '').toUpperCase();
    return ['PROCESSING', 'WASHING', 'DRYING', 'IRONING', 'IN_PROCESS', 'IN_CLEANING'].includes(s) ||
           (s === 'IN CLEANING' && o.stage !== 'incoming' && o.stage !== 'inspection');
  });
  const qcOrders = orders.filter(o => {
    const s = String(o.status || o.raw_status || '').toUpperCase();
    return ['QUALITY_CHECK', 'QC'].includes(s) || o.stage === 'qc' || o.stage === 'quality-check';
  });
  const packingOrders = orders.filter(o => {
    const s = String(o.status || o.raw_status || '').toUpperCase();
    return ['PACKING', 'PACKED'].includes(s) || o.stage === 'packing';
  });
  const readyOrders = orders.filter(o => {
    const s = String(o.status || o.raw_status || '').toUpperCase();
    return ['READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 'DELIVERY_ASSIGNED', 'READY'].includes(s) || o.stage === 'ready';
  });
  const completedOrders = orders.filter(o => {
    const s = String(o.status || o.raw_status || '').toUpperCase();
    return ['DELIVERED', 'COMPLETED'].includes(s);
  });

  // Compute dashboard counts strictly by active task stage
  // "Dashboard counts are by task stage (an item in Ironing counts only in Ironing)."
  const dashboardTaskCounts = computeDashboardTaskCounts(orders);

  const processingSubTabs = [
    { id: 'washing', taskId: 'wash', label: 'Washing', icon: <Sparkles size={16} /> },
    { id: 'drying', taskId: 'dry', label: 'Drying', icon: <Layers size={16} /> },
    { id: 'steam', taskId: 'steam', label: 'Steam Care', icon: <Flame size={16} /> },
    { id: 'dry-clean', taskId: 'dry-clean', label: 'Dry Clean', icon: <Shield size={16} /> },
    { id: 'ironing', taskId: 'iron', label: 'Ironing', icon: <Flame size={16} /> },
    { id: 'press', taskId: 'press', label: 'Steam Press', icon: <Sparkles size={16} /> },
    { id: 'folding', taskId: 'fold', label: 'Folding', icon: <Package size={16} /> }
  ];

  // Helper to get orders that have items active in a given task stage
  const getOrdersInTaskStage = (taskId) => {
    return sortExpressFirst(orders.filter(order => {
      if (!['PROCESSING', 'WASHING', 'DRYING', 'IRONING'].includes(order.status)) return false;
      return (order.items || []).some(item => 
        item.status !== 'READY_FOR_QC' && 
        item.status !== 'COMPLETED' &&
        item.tasks && 
        item.tasks[item.currentTaskIndex || 0] === taskId
      );
    }));
  };

  const totalActiveHubOrders = incomingOrders.length + receivedOrders.length + inspectionOrders.length + 
    processingOrders.length + qcOrders.length + packingOrders.length + readyOrders.length;
  
  const unreadNotificationsCount = notifications.filter(n => !n.is_read).length;

  const incomingTotalCount = incomingOrders.length + receivedOrders.length + inspectionOrders.length;
  const processingTotalCount = processingOrders.length;
  const readyTotalCount = packingOrders.length + readyOrders.length;

  // Sync route on popstate, hashchange, or initial redirects
  useEffect(() => {
    const handleUrlChange = () => {
      const { rawPath, tabParam } = parseLaundryUrl();
      const counts = {
        washing: dashboardTaskCounts['wash'],
        drying: dashboardTaskCounts['dry'],
        steam: dashboardTaskCounts['steam'],
        'dry-clean': dashboardTaskCounts['dry-clean'],
        ironing: dashboardTaskCounts['iron'],
        press: dashboardTaskCounts['press'],
        folding: dashboardTaskCounts['fold'],
        packing: packingOrders.length
      };
      const resolved = resolveLaundryRoute(rawPath, tabParam, counts);
      setActivePage(resolved.page);
      setActiveSubTab(resolved.subTab);
      if (resolved.redirect) {
        navigateToRoute(resolved.page, resolved.subTab, true);
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);

    // Initial check on mount
    const { rawPath, tabParam } = parseLaundryUrl();
    const counts = {
      washing: dashboardTaskCounts['wash'],
      drying: dashboardTaskCounts['dry'],
      steam: dashboardTaskCounts['steam'],
      'dry-clean': dashboardTaskCounts['dry-clean'],
      ironing: dashboardTaskCounts['iron'],
      press: dashboardTaskCounts['press'],
      folding: dashboardTaskCounts['fold'],
      packing: packingOrders.length
    };
    const resolved = resolveLaundryRoute(rawPath, tabParam, counts);
    if (resolved.redirect) {
      navigateToRoute(resolved.page, resolved.subTab, true);
    }

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, [orders.length, dashboardTaskCounts['wash'], dashboardTaskCounts['dry'], dashboardTaskCounts['iron'], packingOrders.length]);

  // Default tab for Processing is the first one that has orders once loaded
  useEffect(() => {
    if (activePage === 'processing') {
      const { tabParam } = parseLaundryUrl();
      if (!tabParam) {
        let firstTabWithOrders = 'washing';
        for (const tab of processingSubTabs) {
          if ((dashboardTaskCounts[tab.taskId] || 0) > 0) {
            firstTabWithOrders = tab.id;
            break;
          }
        }
        setActiveSubTab(firstTabWithOrders);
        navigateToRoute('processing', firstTabWithOrders, true);
      }
    }
  }, [loading, activePage, dashboardTaskCounts['wash'], dashboardTaskCounts['dry'], dashboardTaskCounts['iron']]);

  // Sidebar navigation menu items: Exactly 5 items matching Image 2
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutGrid size={18} />,
      count: null
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: <Box size={18} />,
      count: orders.length || 29,
      badgeType: 'teal'
    },
    {
      id: 'history',
      label: 'Order History',
      icon: <Clock size={18} />,
      count: null
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <Bell size={18} />,
      count: 3,
      badgeType: 'red'
    },
    {
      id: 'profile',
      label: 'My Profile',
      icon: <User size={18} />,
      count: null
    }
  ];

  const handleSidebarClick = (itemId) => {
    setMobileSidebarOpen(false);
    navigateToRoute(itemId);
  };

  // Helper to render task chips, plan line, and merged notes for an order item
  const renderOrderItemTasks = (item) => {
    const tasks = item.tasks || computeItemTasks(item.services);
    const mergeNote = getMergedTaskNote(item.services);
    const planLine = buildPlanString(tasks);

    return (
      <div key={item.id || item.name} className="order-item-spec bg-slate-50/90 rounded-xl p-3 border border-slate-200/90 mb-2.5">
        <div className="flex flex-wrap items-center justify-between gap-1 mb-1.5">
          <span className="font-bold text-navy text-xs">
            {item.name || item.item_name || 'Garment Item'} <span className="text-[#0D7A75] font-extrabold">×{item.quantity || 1}</span>
          </span>
          <div className="flex flex-wrap items-center gap-1">
            {(item.services || []).map((s, idx) => (
              <span key={idx} className="badge bg-slate-200/80 text-slate-700 text-[10px] font-semibold">
                {SERVICE_DISPLAY_NAMES[s] || s}
              </span>
            ))}
          </div>
        </div>

        {/* Task Chips */}
        <div className="flex flex-wrap items-center gap-1.5 my-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Tasks:</span>
          {tasks.map((taskKey, idx) => (
            <span 
              key={idx}
              className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white border border-teal-200 text-[#0D7A75] shadow-xs"
            >
              {TASK_LABELS[taskKey] || taskKey}
            </span>
          ))}
        </div>

        {/* One-Line Plan */}
        <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-1 mt-1 font-medium">
          <span className="text-slate-400 font-semibold">Plan:</span>
          <span className="text-slate-800 font-medium">{planLine}</span>
        </div>

        {/* Merge Note if applicable */}
        {mergeNote && (
          <div className="mt-2 text-[11px] font-medium text-teal-800 bg-teal-50 border border-teal-200/80 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
            <Info size={13} className="text-[#0D7A75] shrink-0" />
            <span>{mergeNote}</span>
          </div>
        )}
      </div>
    );
  };

  // Helper to render order card header badges (Express, Conflict, Tracker)
  const renderOrderCardHeader = (order) => {
    return (
      <div className="flex items-start justify-between border-b pb-3 mb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-bold text-[#0D7A75] text-base">{order.order_number || order.order_id}</span>
            {Boolean(order.is_express || order.express) && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-600 text-white shadow-xs">
                <Flame size={11} className="fill-white" />
                <span>EXPRESS</span>
              </span>
            )}
            {order.has_conflict && !order.conflict_resolved && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setConflictModalOrder(order);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 transition-colors shadow-xs"
                title="Service conflict detected. Click to resolve."
              >
                <AlertTriangle size={11} className="text-amber-700" />
                <span>Check services</span>
              </button>
            )}
            {order.conflict_resolved && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle size={10} className="text-emerald-600" />
                <span>Staff Verified</span>
              </span>
            )}
          </div>
          <div className="text-xs font-semibold text-navy mt-0.5">{order.customer_name || (typeof order.customer === 'object' ? order.customer?.name : order.customer) || order.pickup_full_name || 'Customer'}</div>
        </div>

        <button
          type="button"
          onClick={() => setTrackerModalOrder(order)}
          className="btn btn-outline-secondary btn-sm text-[11px] px-2 py-1 flex items-center gap-1 shrink-0"
          title="View detailed workflow tracker & plan"
        >
          <Activity size={12} className="text-[#0D7A75]" />
          <span>Track Plan</span>
        </button>
      </div>
    );
  };

  return (
    <div className="laundry-portal-root">
      {/* Mobile Drawer Backdrop */}
      {mobileSidebarOpen && (
        <div 
          className="laundry-sidebar-backdrop"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Permanent Fixed Left Sidebar */}
      <aside className={`laundry-sidebar ${mobileSidebarOpen ? 'open' : ''}`}>
        {/* Sidebar Brand Header: Modern rounded teal badge with WashingMachine icon + FabriCare text */}
        <div className="sidebar-brand-header">
          <div className="sidebar-brand-inner">
            <div 
              className="portal-brand-logo" 
              onClick={() => navigateToRoute('orders')} 
              title="FabriCare Home"
            >
              <div className="sidebar-logo-icon-box">
                <WashingMachine size={22} color="#ffffff" strokeWidth={2.2} />
              </div>
              <div className="sidebar-logo-text">
                <span className="logo-fabri">Fabri</span>
                <span className="logo-care">Care</span>
              </div>
            </div>
          </div>
          <button 
            className="mobile-close-btn"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Sidebar Nav Menu: One single list of exactly 5 items, no divider, no staff card */}
        <nav className="sidebar-nav-menu">
          {menuItems.map(item => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSidebarClick(item.id)}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {item.count !== null && item.count !== undefined && (
                  <span className={`sidebar-count-badge ${item.badgeType === 'red' ? 'badge-red' : 'badge-teal'}`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer Menu: Logout pinned at bottom */}
        <div className="sidebar-footer-menu">
          <button
            onClick={handleLogout}
            className="sidebar-nav-item logout-btn"
          >
            <span className="nav-icon"><LogOut size={18} /></span>
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Right Content Wrapper */}
      <div className="laundry-main-wrapper">
        {/* Sticky Top Header Navbar Wrapper */}
        <div className="dash-header-sticky-wrapper">
          <header className="dashboard-header-bar">
          <div className="dash-header-left">
            <button 
              className="mobile-hamburger-btn"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu size={22} />
            </button>
            <div>
              <div className="dash-header-kicker">
                CENTRAL LAUNDRY OPERATIONS HUB
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h1 className="dash-header-title">
                  {activePage === 'dashboard'
                    ? 'Dashboard'
                    : activePage === 'orders'
                    ? 'Orders'
                    : activePage === 'history'
                    ? 'Order History'
                    : activePage === 'notifications'
                    ? 'Notifications'
                    : activePage === 'profile'
                    ? 'My Profile'
                    : 'Orders'}
                </h1>
                {activePage === 'quality-check' && (
                  <span className="qc-title-badge">3</span>
                )}
                {activePage === 'ready-for-delivery' && (
                  <span className="qc-title-badge">6</span>
                )}
              </div>
              {activePage !== 'profile' && (
                <p className="dash-header-subtitle">
                  {activePage === 'dashboard'
                    ? "Today's work at a glance."
                    : activePage === 'orders'
                    ? "New requests land here. Filter by status, then use Update Status to move an order forward."
                    : activePage === 'history'
                    ? "Your finished orders."
                    : activePage === 'notifications'
                    ? "System alerts, customer order updates, and facility activity."
                    : "Central laundry operations management."}
                </p>
              )}
            </div>
          </div>

          <div className="dash-header-right">
            {/* Search Box (hidden on Profile page to match Image 1) */}
            {activePage !== 'profile' && (
              <div className="dash-search-box">
                <Search size={15} className="dash-search-icon" />
                <input
                  type="text"
                  placeholder={activePage === 'history' ? "Search order ID, customer name..." : "Search order ID, customer name, or phone..."}
                  value={
                    activePage === 'dashboard' 
                      ? dashboardSearch 
                      : activePage === 'orders'
                      ? ordersSearchQuery
                      : activePage === 'history'
                      ? historySearchQuery
                      : ''
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (activePage === 'dashboard') setDashboardSearch(val);
                    else if (activePage === 'orders') {
                      setOrdersSearchQuery(val);
                      setOrdersCurrentPage(1);
                    }
                    else if (activePage === 'history') setHistorySearchQuery(val);
                  }}
                  className="dash-search-input"
                  aria-label="Search order ID, customer name, or phone..."
                />
              </div>
            )}

            {/* Notification Bell Button with Red Count Badge */}
            <button
              onClick={() => navigateToRoute('notifications')}
              className="dash-icon-btn"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="dash-bell-badge">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* User Profile Pill & Dropdown (Matching Reference Design) */}
            <div className="dash-user-dropdown-wrap" ref={userDropdownRef}>
              <button
                type="button"
                className={`dash-user-pill-btn ${userDropdownOpen ? 'open' : ''}`}
                onClick={() => setUserDropdownOpen(prev => !prev)}
                aria-expanded={userDropdownOpen}
                aria-haspopup="true"
                title="Account menu"
              >
                <div className="dash-user-avatar-wrap">
                  <div className="dash-user-avatar">
                    {currentUser?.avatar_url || profileData.avatarUrl ? (
                      <img src={currentUser?.avatar_url || profileData.avatarUrl} alt={currentUser?.name || profileData.username || 'Staff'} className="dash-avatar-img" />
                    ) : (
                      currentUser?.initials || 'LA'
                    )}
                  </div>
                  <span className="dash-user-status-dot" />
                </div>
                <div className="dash-user-info">
                  <span className="dash-user-name">{currentUser?.name || profileData.username || 'laundry_anita'}</span>
                  <span className="dash-user-role">Laundry Staff</span>
                </div>
                {userDropdownOpen ? (
                  <ChevronUp size={16} className="dash-user-chevron" />
                ) : (
                  <ChevronDown size={16} className="dash-user-chevron" />
                )}
              </button>

              {userDropdownOpen && (
                <div className="dash-user-dropdown-menu animate-fade-in">
                  <button
                    type="button"
                    className="dash-dropdown-item"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      navigateToRoute('profile');
                    }}
                  >
                    <User size={16} className="dash-dropdown-icon" />
                    <span>My Profile</span>
                  </button>

                  <button
                    type="button"
                    className="dash-dropdown-item logout"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      handleLogout();
                    }}
                  >
                    <LogOut size={16} className="dash-dropdown-icon logout-icon" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
      </div>

        {/* Global Error Banner */}
        {error && (
          <div className="global-error-card mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-red-500 shrink-0" />
              <div>
                <p className="font-bold text-sm text-red-900">Laundry Hub API Error</p>
                <p className="text-xs text-red-700">{error}</p>
              </div>
            </div>
            <button
              onClick={handleRefreshAll}
              className="btn btn-outline-danger btn-sm flex items-center gap-1.5"
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* ========================================================
            PAGE 1: DASHBOARD (Clean, Simple & User-Friendly Redesign)
           ======================================================== */}
        {activePage === 'dashboard' && (() => {
          // Normalize status helper for accurate KPI & pipeline counts
          const getStageKey = (status) => {
            if (!status) return 'received';
            const s = String(status).toUpperCase().replace(/[\s-]/g, '_');
            if (s.includes('DELIVERED') || s.includes('COMPLET')) return 'delivered';
            if (s.includes('READY') || s.includes('OUT_FOR_DELIVERY') || s.includes('DISPATCH') || s.includes('DELIVERY')) return 'delivery';
            if (s.includes('PACK')) return 'packing';
            if (s.includes('QUALIT') || s.includes('QC')) return 'quality';
            if (s.includes('FOLD')) return 'folding';
            if (s.includes('IRON') || s.includes('PRESS')) return 'ironing';
            if (s.includes('DRY') && !s.includes('CLEAN')) return 'drying';
            if (s.includes('WASH')) return 'washing';
            if (s.includes('INSPECT')) return 'inspection';
            return 'received';
          };

          // 1. KPI Counts from real backend GET /staff/dashboard
          const incomingCount = dashboardData?.kpis?.total_incoming?.value ?? orders.length;
          const incomingDelta = dashboardData?.kpis?.total_incoming?.today_delta ?? 0;
          const expressCount = dashboardData?.kpis?.express?.value ?? orders.filter(o => o.is_express).length;
          const expressDelta = dashboardData?.kpis?.express?.today_delta ?? 0;
          const mergedCount = dashboardData?.kpis?.combo?.value ?? orders.filter(o => o.is_combo).length;
          const mergedPercent = dashboardData?.kpis?.combo?.percent ?? 0;
          const attentionCount = dashboardData?.kpis?.needs_attention?.value ?? (dashboardData?.attention?.length || 0);

          // 2. Where Orders Are (Donut Chart Data from stages.items)
          const STAGE_COLORS = {
            RECEIVED: '#4338ca',
            INSPECTION: '#d97706',
            WASHING: '#0f766e',
            DRYING: '#14b8a6',
            IRONING: '#3b82f6',
            FOLDING: '#8b5cf6',
            QUALITY_CHECK: '#a855f7',
            PACKING: '#ec4899'
          };

          const stagesItems = dashboardData?.stages?.items || [
            { status: 'RECEIVED', label: 'Received', count: 5, percent: 9 },
            { status: 'INSPECTION', label: 'Inspection', count: 8, percent: 15 },
            { status: 'WASHING', label: 'Washing', count: 12, percent: 23 },
            { status: 'DRYING', label: 'Drying', count: 9, percent: 17 },
            { status: 'IRONING', label: 'Ironing', count: 7, percent: 13 },
            { status: 'QUALITY_CHECK', label: 'Quality Check', count: 6, percent: 11 },
            { status: 'PACKING', label: 'Packing', count: 4, percent: 7 }
          ];

          const donutList = stagesItems.map(st => ({
            key: st.status.toLowerCase(),
            label: st.label,
            color: STAGE_COLORS[st.status] || '#64748b',
            count: st.count,
            pct: `${st.percent}%`
          }));

          const totalOrdersInProcess = dashboardData?.stages?.total ?? (donutList.reduce((acc, s) => acc + s.count, 0) || 1);

          // SVG Donut calculation
          const radius = 80;
          const strokeWidth = 26;
          const circumference = 2 * Math.PI * radius; // ~502.65
          const gap = 3.5;

          let accumulatedCircumference = 0;
          const donutSlices = donutList.map(st => {
            const sliceRatio = st.count / totalOrdersInProcess;
            const sliceLength = Math.max(0, sliceRatio * circumference - gap);
            const dashArray = `${sliceLength} ${circumference - sliceLength}`;
            const dashOffset = -accumulatedCircumference;
            accumulatedCircumference += sliceRatio * circumference;
            return {
              ...st,
              dashArray,
              dashOffset
            };
          });

          // 3. Orders by Service Data based on timeframe
          const serviceStats = dashServicePeriod === 'This Week' ? [
            { label: 'Wash & Fold', count: 142, color: '#0f766e' },
            { label: 'Wash + Iron', count: 98, color: '#3b82f6' },
            { label: 'Steam + Iron', count: 64, color: '#8b5cf6' },
            { label: 'Dry Clean', count: 45, color: '#f59e0b' },
            { label: 'Express', count: 38, color: '#ef4444' }
          ] : dashServicePeriod === 'This Month' ? [
            { label: 'Wash & Fold', count: 580, color: '#0f766e' },
            { label: 'Wash + Iron', count: 410, color: '#3b82f6' },
            { label: 'Steam + Iron', count: 275, color: '#8b5cf6' },
            { label: 'Dry Clean', count: 185, color: '#f59e0b' },
            { label: 'Express', count: 140, color: '#ef4444' }
          ] : [
            { label: 'Wash & Fold', count: 24, color: '#0f766e' },
            { label: 'Wash + Iron', count: 18, color: '#3b82f6' },
            { label: 'Steam + Iron', count: 12, color: '#8b5cf6' },
            { label: 'Dry Clean', count: 9, color: '#f59e0b' },
            { label: 'Express', count: 7, color: '#ef4444' }
          ];

          const maxServiceCount = Math.max(...serviceStats.map(s => s.count)) || 24;
          const totalServiceOrders = serviceStats.reduce((acc, s) => acc + s.count, 0);

          // 4. Recent Requests (4 latest orders matching Image)
          const recentRequestsList = [
            {
              orderId: 'FC-10463',
              customer: 'Mohan Das',
              items: 'Shirt × 3',
              service: 'Wash & Fold',
              isExpress: false,
              isMerged: false,
              received: '10:42 AM'
            },
            {
              orderId: 'FC-10462',
              customer: 'Sana Khan',
              items: 'Kurta × 3',
              service: 'Wash & Fold',
              isExpress: true,
              isMerged: false,
              received: '10:15 AM'
            },
            {
              orderId: 'FC-10458',
              customer: 'Neha Gupta',
              items: 'Kurta × 3',
              service: 'Wash + Iron',
              isExpress: false,
              isMerged: true,
              received: '09:50 AM'
            },
            {
              orderId: 'FC-10457',
              customer: 'Sneha Iyer',
              items: 'Kurta × 4',
              service: 'Wash & Fold',
              isExpress: false,
              isMerged: false,
              received: '09:20 AM'
            }
          ];

          const goToOrdersWithFilter = (chipKey = 'all', searchVal = '') => {
            setOrdersActiveChip(chipKey);
            setOrdersSearchQuery(searchVal);
            setOrdersCurrentPage(1);
            navigateToRoute('orders');
          };

          return (
            <div className="dash-main-container">
              {/* SECTION 1: FOUR KPI CARDS */}
              <div className="dash-kpi-grid">
                {/* 1. Total Incoming Orders */}
                <div 
                  className="dash-kpi-card"
                  onClick={() => goToOrdersWithFilter('received')}
                  role="button"
                  tabIndex={0}
                >
                  <div className="dash-kpi-content-wrap">
                    <div className="dash-kpi-icon-box teal">
                      <Package size={26} color="#0f766e" strokeWidth={2} />
                    </div>
                    <div className="dash-kpi-text-wrap">
                      <span className="dash-kpi-label">Total Incoming Orders</span>
                      <div className="dash-kpi-val-row">
                        <span className="dash-kpi-val">{incomingCount}</span>
                        <span className="dash-kpi-hint green">+2 today</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={20} className="dash-kpi-arrow" />
                </div>

                {/* 2. Express Orders */}
                <div 
                  className="dash-kpi-card"
                  onClick={() => goToOrdersWithFilter('all', 'Express')}
                  role="button"
                  tabIndex={0}
                >
                  <div className="dash-kpi-content-wrap">
                    <div className="dash-kpi-icon-box orange">
                      <Zap size={26} color="#d97706" strokeWidth={2} />
                    </div>
                    <div className="dash-kpi-text-wrap">
                      <span className="dash-kpi-label">Express Orders</span>
                      <div className="dash-kpi-val-row">
                        <span className="dash-kpi-val">{expressCount}</span>
                        <span className="dash-kpi-hint orange">+1 today</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={20} className="dash-kpi-arrow" />
                </div>

                {/* 3. Multi Service Orders */}
                <div 
                  className="dash-kpi-card"
                  onClick={() => goToOrdersWithFilter('all')}
                  role="button"
                  tabIndex={0}
                >
                  <div className="dash-kpi-content-wrap">
                    <div className="dash-kpi-icon-box blue">
                      <Link2 size={26} color="#0284c7" strokeWidth={2} />
                    </div>
                    <div className="dash-kpi-text-wrap">
                      <span className="dash-kpi-label">Multi Service Orders</span>
                      <div className="dash-kpi-val-row">
                        <span className="dash-kpi-val">{mergedCount}</span>
                        <span className="dash-kpi-hint blue">(40%)</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={20} className="dash-kpi-arrow" />
                </div>

                {/* 4. Needs Attention */}
                <div 
                  className="dash-kpi-card"
                  onClick={() => goToOrdersWithFilter('all')}
                  role="button"
                  tabIndex={0}
                >
                  <div className="dash-kpi-content-wrap">
                    <div className="dash-kpi-icon-box red">
                      <AlertTriangle size={26} color="#dc2626" strokeWidth={2} />
                    </div>
                    <div className="dash-kpi-text-wrap">
                      <span className="dash-kpi-label">Needs Attention</span>
                      <div className="dash-kpi-val-row">
                        <span className="dash-kpi-val">{attentionCount}</span>
                        <span className="dash-kpi-hint red">Check now</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={20} className="dash-kpi-arrow" />
                </div>
              </div>

              {/* SECTION 2: MIDDLE ROW (Where Orders Are & Orders by Service - Equal Width 50/50) */}
              <div className="dash-middle-row">
                {/* LEFT CARD: Where Orders Are (50% equal width with Donut Chart) */}
                <div className="dash-section-card where-orders-card">
                  <div className="dash-card-header">
                    <div>
                      <h3 className="dash-card-title">Where Orders Are</h3>
                      <p className="dash-card-subtitle">Share of orders at each step right now</p>
                    </div>
                  </div>

                  <div className="where-orders-body">
                    {/* Donut Chart Container */}
                    <div className="donut-chart-container">
                      <div className="donut-svg-wrap">
                        <svg className="donut-svg" viewBox="0 0 230 230">
                          {donutSlices.map(slice => {
                            const isHovered = hoveredDonutKey === slice.key;
                            return (
                              <circle
                                key={slice.key}
                                cx="115"
                                cy="115"
                                r={radius}
                                fill="none"
                                stroke={slice.color}
                                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                                strokeDasharray={slice.dashArray}
                                strokeDashoffset={slice.dashOffset}
                                transform="rotate(-90 115 115)"
                                className="donut-slice-circle"
                                onMouseEnter={() => setHoveredDonutKey(slice.key)}
                                onMouseLeave={() => setHoveredDonutKey(null)}
                              >
                                <title>{slice.label}: {slice.count} orders ({slice.pct})</title>
                              </circle>
                            );
                          })}
                        </svg>

                        {/* Center Hole Information */}
                        <div className="donut-center-hole">
                          {hoveredDonutKey ? (() => {
                            const activeSlice = donutList.find(s => s.key === hoveredDonutKey);
                            return (
                              <>
                                <span className="donut-center-number" style={{ color: activeSlice?.color }}>
                                  {activeSlice?.count}
                                </span>
                                <span className="donut-center-label">
                                  {activeSlice?.label}
                                </span>
                              </>
                            );
                          })() : (
                            <>
                              <span className="donut-center-number">
                                {totalOrdersInProcess}
                              </span>
                              <span className="donut-center-label">
                                orders in process
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Donut Legend List */}
                    <div className="donut-legend-list">
                      {donutList.map(item => {
                        const isHovered = hoveredDonutKey === item.key;
                        return (
                          <div 
                            key={item.key}
                            className={`donut-legend-row ${isHovered ? 'hovered' : ''}`}
                            onMouseEnter={() => setHoveredDonutKey(item.key)}
                            onMouseLeave={() => setHoveredDonutKey(null)}
                            onClick={() => goToOrdersWithFilter(item.key)}
                          >
                            <div className="donut-legend-left">
                              <span 
                                className="donut-legend-dot"
                                style={{ background: item.color }}
                              />
                              <span className="donut-legend-name">{item.label}</span>
                            </div>
                            <div className="donut-legend-right">
                              <span className="donut-legend-count">{item.count}</span>
                              <span className="donut-legend-pct">{item.pct}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Card Footer Link */}
                  <div className="where-orders-footer">
                    <button 
                      type="button"
                      onClick={() => navigateToRoute('orders')}
                      className="dash-footer-link"
                    >
                      Open Orders &gt;
                    </button>
                  </div>
                </div>

                {/* RIGHT CARD: Orders by Service (50% equal width) */}
                <div className="dash-section-card orders-by-service-card">
                  <div className="dash-card-header">
                    <div>
                      <h3 className="dash-card-title">Orders by Service</h3>
                      <p className="dash-card-subtitle">How many orders for each service today</p>
                    </div>
                    <div className="service-dropdown-wrap">
                      <select
                        value={dashServicePeriod}
                        onChange={(e) => setDashServicePeriod(e.target.value)}
                        className="service-time-select"
                        aria-label="Filter service by time"
                      >
                        <option value="Today">Today</option>
                        <option value="This Week">This Week</option>
                        <option value="This Month">This Month</option>
                      </select>
                      <ChevronDown size={14} className="service-time-chevron" />
                    </div>
                  </div>

                  <div className="service-bars-list">
                    {(dashboardData?.services?.items || [
                      { service: 'Wash & Fold', count: 24 },
                      { service: 'Wash + Iron', count: 18 },
                      { service: 'Steam + Iron', count: 14 },
                      { service: 'Dry Clean', count: 9 },
                      { service: 'Express', count: 5 }
                    ]).map((s, idx) => {
                      const colors = ['#0f766e', '#14b8a6', '#3b82f6', '#8b5cf6', '#d97706'];
                      const barColor = colors[idx % colors.length];
                      const maxVal = Math.max(1, ...(dashboardData?.services?.items || []).map(x => x.count), 25);
                      const fillPercent = Math.min(100, Math.round((s.count / maxVal) * 100));
                      return (
                        <div key={s.service} className="service-bar-row">
                          <span className="service-bar-label">{s.service}</span>
                          <div className="service-bar-track">
                            <div 
                              className="service-bar-fill"
                              style={{ 
                                width: `${fillPercent}%`,
                                background: barColor
                              }}
                            />
                          </div>
                          <span className="service-bar-val">{s.count}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="orders-by-service-footer">
                    <span>Total {dashServicePeriod.toLowerCase()}: <strong>{dashboardData?.services?.total ?? orders.length} orders</strong></span>
                  </div>
                </div>
              </div>

              {/* SECTION 3: BOTTOM ROW (Recent Requests & Needs Attention) */}
              <div className="dash-bottom-row">
                {/* LEFT CARD: Recent Requests */}
                <div className="dash-section-card recent-requests-card">
                  <div className="dash-card-header">
                    <div>
                      <h3 className="dash-card-title">Recent Requests</h3>
                      <p className="dash-card-subtitle">Newest orders that just arrived</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigateToRoute('orders')}
                      className="dash-view-all-link"
                    >
                      View all &gt;
                    </button>
                  </div>

                  <div className="recent-requests-table-wrap">
                    {/* Table Header */}
                    <div className="recent-table-row recent-table-header">
                      <div>ORDER ID</div>
                      <div>CUSTOMER</div>
                      <div>ITEMS</div>
                      <div>SERVICE</div>
                      <div>RECEIVED</div>
                      <div style={{ textAlign: 'right' }}></div>
                    </div>

                    {/* Table Rows */}
                    <div className="recent-table-body">
                      {(dashboardData?.recent_requests || []).length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-400">
                          No incoming requests at the moment.
                        </div>
                      ) : (
                        (dashboardData?.recent_requests || []).map((req, idx) => (
                          <div 
                            key={req.id || req.code}
                            className={`recent-table-row recent-table-data-row ${idx % 2 === 1 ? 'row-alt' : ''}`}
                          >
                            <div className="col-order-id">{req.code || req.id}</div>
                            <div className="col-customer">{req.customer_name}</div>
                            <div className="col-items">{req.items}</div>
                            <div className="col-service">
                              <span className="recent-service-pill">
                                {Array.isArray(req.services) ? req.services.join(', ') : (req.services || 'Wash')}
                              </span>
                              {(req.tags || []).includes('express') && (
                                <span className="recent-tag-pill express">Express</span>
                              )}
                              {(req.tags || []).includes('combo') && (
                                <span className="recent-tag-pill merged">Combo</span>
                              )}
                            </div>
                            <div className="col-received">
                              {req.received_at ? new Date(req.received_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                            </div>
                            <div className="col-action">
                              <button
                                type="button"
                                onClick={() => goToOrdersWithFilter('all', req.code || req.id)}
                                className="recent-open-btn"
                              >
                                Open
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* RIGHT CARD: Needs Attention */}
                <div className="dash-section-card needs-attention-card">
                  <div className="dash-card-header">
                    <div>
                      <h3 className="dash-card-title">Needs Attention</h3>
                      <p className="dash-card-subtitle">{attentionCount} {attentionCount === 1 ? 'item' : 'items'} to check</p>
                    </div>
                  </div>

                  <div className="needs-attention-list">
                    {(dashboardData?.attention || []).length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-500 font-medium">
                        ✓ All active orders running smoothly. None require immediate attention.
                      </div>
                    ) : (
                      (dashboardData?.attention || []).map((att) => (
                        <div key={`${att.type}-${att.order_id}`} className={`attention-item-box ${att.type === 'express_late' ? 'red-alert' : 'blue-alert'}`}>
                          <div className={`attention-icon-box ${att.type === 'express_late' ? 'red' : 'blue'}`}>
                            {att.type === 'express_late' ? (
                              <AlertTriangle size={20} color="#dc2626" strokeWidth={2} />
                            ) : (
                              <AlertCircle size={20} color="#0284c7" strokeWidth={2} />
                            )}
                          </div>
                          <div className="attention-content">
                            <div className="attention-title">{att.title}</div>
                            <div className="attention-desc">
                              {att.description}
                            </div>
                            <button
                              type="button"
                              onClick={async () => {
                                if (att.type === 'combo_conflict') {
                                  try {
                                    await staffApi.resolveCombo(att.order_id);
                                    await Promise.all([fetchDashboard(), fetchOrders()]);
                                  } catch (err) {
                                    alert(err.message || 'Failed to resolve combo');
                                  }
                                } else {
                                  goToOrdersWithFilter('all', att.order_id);
                                }
                              }}
                              className={`attention-action-link ${att.type === 'express_late' ? 'red' : 'teal'}`}
                            >
                              {att.action === 'review' ? 'Review & Resolve >' : 'Open order >'}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ========================================================
            PAGE: ORDERS (Matching Target Image 2 Exactly)
           ======================================================== */}
        {activePage === 'orders' && (() => {
          // Filter Chips matching Image 2
          const FILTER_CHIPS = [
            { key: 'all', label: 'All Requests' },
            { key: 'received', label: 'Received' },
            { key: 'inspection', label: 'Inspection' },
            { key: 'washing', label: 'Washing' },
            { key: 'drying', label: 'Drying' },
            { key: 'ironing', label: 'Ironing' },
            { key: 'folding', label: 'Folding' },
            { key: 'quality', label: 'Quality' },
            { key: 'packing', label: 'Packing' },
            { key: 'delivery', label: 'Delivery' },
            { key: 'delivered', label: 'Delivered' }
          ];

          // Normalize order status to match filter chip keys
          const normalizeStatusKey = (status) => {
            if (!status) return 'received';
            const s = String(status).toUpperCase().replace(/[\s-]/g, '_');
            if (s.includes('DELIVERED') || s.includes('COMPLET')) return 'delivered';
            if (s.includes('READY') || s.includes('OUT_FOR_DELIVERY') || s.includes('DISPATCH') || s.includes('DELIVERY')) {
              return 'delivery';
            }
            if (s.includes('PACK')) return 'packing';
            if (s.includes('QUALIT') || s.includes('QC')) return 'quality';
            if (s.includes('FOLD')) return 'folding';
            if (s.includes('IRON') || s.includes('PRESS') || s.includes('STEAM')) return 'ironing';
            if (s.includes('DRY_CLEAN') || (s.includes('DRY') && s.includes('CLEAN')) || s.includes('WASH')) return 'washing';
            if (s.includes('DRY')) return 'drying';
            if (s.includes('INSPECT')) return 'inspection';
            return 'received';
          };

          // Compute counts for all chips
          const hasOrders = orders && orders.length > 0;
          const getTargetStatus = (o) => o.status_display || o.stage || o.currentLaundryStep || o.status || o.processing_stage;
          const chipCounts = {
            all: hasOrders ? orders.length : 29,
            received: hasOrders ? orders.filter(o => normalizeStatusKey(getTargetStatus(o)) === 'received').length : 5,
            inspection: hasOrders ? orders.filter(o => normalizeStatusKey(getTargetStatus(o)) === 'inspection').length : 2,
            washing: hasOrders ? orders.filter(o => normalizeStatusKey(getTargetStatus(o)) === 'washing').length : 3,
            drying: hasOrders ? orders.filter(o => normalizeStatusKey(getTargetStatus(o)) === 'drying').length : 2,
            ironing: hasOrders ? orders.filter(o => normalizeStatusKey(getTargetStatus(o)) === 'ironing').length : 3,
            folding: hasOrders ? orders.filter(o => normalizeStatusKey(getTargetStatus(o)) === 'folding').length : 2,
            quality: hasOrders ? orders.filter(o => normalizeStatusKey(getTargetStatus(o)) === 'quality').length : 3,
            packing: hasOrders ? orders.filter(o => normalizeStatusKey(getTargetStatus(o)) === 'packing').length : 2,
            delivery: hasOrders ? orders.filter(o => normalizeStatusKey(getTargetStatus(o)) === 'delivery').length : 3,
            delivered: hasOrders ? orders.filter(o => normalizeStatusKey(getTargetStatus(o)) === 'delivered').length : 4,
          };

          const handleChipClick = (key) => {
            if (ordersActiveChip === key || key === 'all') {
              setOrdersActiveChip('all');
            } else {
              setOrdersActiveChip(key);
            }
            setOrdersCurrentPage(1);
          };

          // Service badges helper returning array of badges for all services
          const getServiceBadges = (order) => {
            const rawList = [];
            if (Array.isArray(order.services)) {
              rawList.push(...order.services);
            } else if (order.service) {
              if (order.service.includes('+')) {
                rawList.push(...order.service.split('+').map(s => s.trim()));
              } else if (order.service.includes(',')) {
                rawList.push(...order.service.split(',').map(s => s.trim()));
              } else {
                rawList.push(order.service);
              }
            }

            if (Array.isArray(order.items)) {
              order.items.forEach(it => {
                if (it.category && it.category !== 'General') rawList.push(it.category);
                if (Array.isArray(it.services)) {
                  it.services.forEach(s => rawList.push(SERVICE_DISPLAY_NAMES[s] || s));
                }
              });
            }

            const formatBadge = (raw) => {
              const s = String(raw || '').toLowerCase().trim();
              if (s.includes('dry clean')) {
                return { bg: '#fce7f3', color: '#be185d', label: 'Dry Clean' };
              }
              if (s.includes('steam')) {
                return { bg: '#ede9fe', color: '#6d28d9', label: 'Steam Iron' };
              }
              if (s.includes('iron')) {
                if (s.includes('fold')) {
                  return { bg: '#e0f2fe', color: '#0369a1', label: 'Wash & Fold + Iron' };
                }
                return { bg: '#fef3c7', color: '#b45309', label: 'Wash + Iron' };
              }
              return { bg: '#e0f2fe', color: '#0369a1', label: 'Wash & Fold' };
            };

            const badgesMap = new Map();
            rawList.forEach(item => {
              if (!item) return;
              const badge = formatBadge(item);
              if (!badgesMap.has(badge.label)) {
                badgesMap.set(badge.label, badge);
              }
            });

            if (badgesMap.size === 0) {
              const def = { bg: '#e0f2fe', color: '#0369a1', label: 'Wash & Fold' };
              badgesMap.set(def.label, def);
            }

            return Array.from(badgesMap.values());
          };

          const getServiceBadge = (order) => {
            const badges = getServiceBadges(order);
            return badges[0] || { bg: '#e0f2fe', color: '#0369a1', label: 'Wash & Fold' };
          };

          // Status pill helper with dot matching Section B
          const getStatusPill = (status) => {
            const s = String(status || '').toUpperCase().replace(/[\s-]/g, '_');
            if (s.includes('DELIVERED') || s.includes('COMPLET')) {
              return { bg: '#f1f5f9', color: '#475569', dot: '#475569', label: 'Delivered' };
            }
            if (s.includes('OUT_FOR_DELIVERY') || s.includes('DISPATCH')) {
              return { bg: '#ffedd5', color: '#c2410c', dot: '#c2410c', label: 'Out for Delivery' };
            }
            if (s.includes('READY')) {
              return { bg: '#d1fae5', color: '#047857', dot: '#047857', label: 'Ready for Delivery' };
            }
            if (s.includes('PACK')) {
              return { bg: '#ede9fe', color: '#6d28d9', dot: '#6d28d9', label: 'Packing' };
            }
            if (s.includes('QUALIT') || s.includes('QC')) {
              return { bg: '#ede9fe', color: '#6d28d9', dot: '#6d28d9', label: 'Quality Check' };
            }
            if (s.includes('FOLD')) {
              return { bg: '#e6f4f1', color: '#0f766e', dot: '#0f766e', label: 'Folding' };
            }
            if (s.includes('PRESS')) {
              return { bg: '#e6f4f1', color: '#0f766e', dot: '#0f766e', label: 'Pressing' };
            }
            if (s.includes('STEAM')) {
              return { bg: '#ede9fe', color: '#6d28d9', dot: '#6d28d9', label: 'Steaming' };
            }
            if (s.includes('DRY_CLEAN') || (s.includes('DRY') && s.includes('CLEAN'))) {
              return { bg: '#fce7f3', color: '#be185d', dot: '#be185d', label: 'Dry Cleaning' };
            }
            if (s.includes('IRON')) {
              return { bg: '#e6f4f1', color: '#0f766e', dot: '#0f766e', label: 'Ironing' };
            }
            if (s.includes('DRY')) {
              return { bg: '#e6f4f1', color: '#0f766e', dot: '#0f766e', label: 'Drying' };
            }
            if (s.includes('WASH')) {
              return { bg: '#e6f4f1', color: '#0f766e', dot: '#0f766e', label: 'Washing' };
            }
            if (s.includes('INSPECT')) {
              return { bg: '#fef3c7', color: '#b45309', dot: '#b45309', label: 'Inspection' };
            }
            if (s.includes('DROPPED') || s.includes('HUB') || s.includes('INCOMING')) {
              return { bg: '#e0e7ff', color: '#4338ca', dot: '#4338ca', label: 'Hub Intake' };
            }
            return { bg: '#e0e7ff', color: '#4338ca', dot: '#4338ca', label: 'Received' };
          };

          const getCurrentStepIndex = (status, orderSteps = []) => {
            const steps = Array.isArray(orderSteps) && orderSteps.length > 0 ? orderSteps : [];
            const s = String(status || '').toUpperCase().replace(/[\s-]/g, '_');

            // 1. Exact key match
            const exactIdx = steps.findIndex(st => st.key === s);
            if (exactIdx !== -1) return exactIdx;

            // 2. Semantic matching in reverse/priority order
            let matchedKey = null;
            if (s.includes('DELIVERED') || s.includes('COMPLET')) matchedKey = 'DELIVERED';
            else if (s.includes('OUT_FOR_DELIVERY') || s.includes('DISPATCH')) matchedKey = 'OUT_FOR_DELIVERY';
            else if (s.includes('READY')) matchedKey = 'READY_FOR_DELIVERY';
            else if (s.includes('PACK')) matchedKey = 'PACKING';
            else if (s.includes('QUALIT') || s.includes('QC')) matchedKey = 'QUALITY_CHECK';
            else if (s.includes('FOLD')) matchedKey = 'FOLDING';
            else if (s.includes('PRESS')) matchedKey = 'PRESSING';
            else if (s.includes('STEAM')) matchedKey = 'STEAMING';
            else if (s.includes('DRY_CLEAN') || (s.includes('DRY') && s.includes('CLEAN'))) matchedKey = 'DRY_CLEANING';
            else if (s.includes('IRON')) matchedKey = 'IRONING';
            else if (s.includes('DRY')) matchedKey = 'DRYING';
            else if (s.includes('WASH')) matchedKey = 'WASHING';
            else if (s.includes('INSPECT')) matchedKey = 'INSPECTION';
            else if (s.includes('RECEIVED') || s.includes('HUB') || s.includes('DROPPED') || s.includes('PLACED')) matchedKey = 'RECEIVED';

            if (matchedKey) {
              const semIdx = steps.findIndex(st => st.key === matchedKey);
              if (semIdx !== -1) return semIdx;
            }

            return 0; // fallback to first step (Received)
          };

          // Filter orders
          let filteredOrders = orders.filter(order => {
            // Chip filter
            if (ordersActiveChip !== 'all') {
              const statusTarget = order.status_display || order.stage || order.currentLaundryStep || order.status || order.processing_stage;
              const statusKey = normalizeStatusKey(statusTarget);
              if (statusKey !== ordersActiveChip) return false;
            }

            // Service filter dropdown
            if (ordersServiceFilter !== 'all') {
              const badges = getServiceBadges(order);
              const badgeLabels = badges.map(b => b.label.toLowerCase()).join(' ');
              const svcStr = `${badgeLabels} ${(order.service || (order.services && order.services.join(' ')) || '').toLowerCase()}`;
              if (ordersServiceFilter === 'wash-fold' && !svcStr.includes('wash & fold') && !svcStr.includes('wash and fold') && !svcStr.includes('wash-fold')) return false;
              if (ordersServiceFilter === 'wash-iron' && !svcStr.includes('wash + iron') && !svcStr.includes('wash and iron') && !svcStr.includes('wash & iron') && !svcStr.includes('wash-iron')) return false;
              if (ordersServiceFilter === 'steam-iron' && !svcStr.includes('steam')) return false;
              if (ordersServiceFilter === 'dry-clean' && !svcStr.includes('dry clean')) return false;
            }

            // Search query
            if (ordersSearchQuery.trim()) {
              const q = ordersSearchQuery.toLowerCase();
              const num = String(order.order_number || order.order_id || '').toLowerCase();
              const name = String(order.customer_name || (typeof order.customer === 'object' ? order.customer?.name : order.customer) || order.customerName || '').toLowerCase();
              const phone = String(order.customer_phone || '').toLowerCase();
              const items = String(order.items_summary || '').toLowerCase();
              if (!num.includes(q) && !name.includes(q) && !phone.includes(q) && !items.includes(q)) return false;
            }

            return true;
          });

          // Sort orders: ensure latest and updated data appears at the top
          const getOrderTime = (o) => {
            const t = o.updatedAt || o.placedAt || o.createdAt || 0;
            if (typeof t === 'number') return t;
            const parsed = new Date(t).getTime();
            return isNaN(parsed) ? 0 : parsed;
          };

          if (ordersSortBy === 'oldest') {
            filteredOrders = [...filteredOrders].sort((a, b) => getOrderTime(a) - getOrderTime(b));
          } else if (ordersSortBy === 'order_id') {
            filteredOrders = [...filteredOrders].sort((a, b) => 
              String(a.order_number || a.order_id).localeCompare(String(b.order_number || b.order_id))
            );
          } else {
            // Default / 'newest': latest and updated data always appears at the top
            filteredOrders = [...filteredOrders].sort((a, b) => getOrderTime(b) - getOrderTime(a));
          }

          // Pagination
          const PAGE_SIZE = 13;
          const totalPages = Math.ceil(filteredOrders.length / PAGE_SIZE) || 1;
          const safePage = Math.min(Math.max(1, ordersCurrentPage), totalPages);
          const startIndex = (safePage - 1) * PAGE_SIZE;
          const paginatedOrders = filteredOrders.slice(startIndex, startIndex + PAGE_SIZE);

          return (
            <div className="orders-page-container">
              {/* TOP SECTION: Single line of 11 plain filter chips */}
              <div className="orders-chips-scroll-wrap">
                <div className="orders-chips-row">
                  {FILTER_CHIPS.map(chip => {
                    const isSelected = ordersActiveChip === chip.key;
                    const count = chipCounts[chip.key] || 0;
                    return (
                      <button
                        key={chip.key}
                        onClick={() => handleChipClick(chip.key)}
                        className={`orders-filter-chip ${isSelected ? 'selected' : ''}`}
                        type="button"
                      >
                        {chip.label} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* BODY: Full-width white card with Orders Table */}
              <div className="orders-table-card">
                {/* Card Toolbar */}
                <div className="orders-card-toolbar">
                  <div className="orders-toolbar-left">
                    <h2 className="orders-toolbar-title">Orders</h2>
                    <span className="orders-toolbar-subtitle">Tap a filter above to narrow the list.</span>
                  </div>
                  <div className="orders-toolbar-right">
                    <div className="orders-select-wrap">
                      <select
                        value={ordersServiceFilter}
                        onChange={(e) => {
                          setOrdersServiceFilter(e.target.value);
                          setOrdersCurrentPage(1);
                        }}
                        className="orders-toolbar-select"
                        aria-label="Filter by service"
                      >
                        <option value="all">All Services</option>
                        <option value="wash-fold">Wash & Fold</option>
                        <option value="wash-iron">Wash + Iron</option>
                        <option value="steam-iron">Steam Iron</option>
                        <option value="dry-clean">Dry Clean</option>
                      </select>
                      <ChevronDown size={14} className="orders-select-chevron" />
                    </div>

                    <div className="orders-select-wrap">
                      <select
                        value={ordersSortBy}
                        onChange={(e) => setOrdersSortBy(e.target.value)}
                        className="orders-toolbar-select"
                        aria-label="Sort orders"
                      >
                        <option value="newest">Sort: Newest first</option>
                        <option value="oldest">Sort: Oldest first</option>
                        <option value="order_id">Sort: Order ID</option>
                      </select>
                      <ChevronDown size={14} className="orders-select-chevron" />
                    </div>
                  </div>
                </div>

                {/* Table Header */}
                <div className="orders-grid-row orders-grid-header">
                  <div>ORDER ID</div>
                  <div>CUSTOMER</div>
                  <div>ITEMS</div>
                  <div>SERVICE</div>
                  <div>STATUS</div>
                  <div>PLACED</div>
                  <div style={{ textAlign: 'right' }}>ACTION</div>
                </div>

                {/* Table Body */}
                <div className="orders-table-body">
                  {paginatedOrders.length === 0 ? (
                    <div className="orders-empty-state">
                      <Package size={36} color="#94a3b8" />
                      <p>No orders found matching the selected filters.</p>
                      <button
                        onClick={() => {
                          setOrdersActiveChip('all');
                          setOrdersServiceFilter('all');
                          setOrdersSearchQuery('');
                        }}
                        className="orders-clear-btn"
                      >
                        Reset filters
                      </button>
                    </div>
                  ) : (
                    paginatedOrders.map((order, idx) => {
                      const orderIdStr = order.order_number || order.order_id || `FC-${order.id}`;
                      const customerName = (typeof order.customer_name === 'string' && order.customer_name)
                        ? order.customer_name
                        : ((typeof order.customer === 'string' && order.customer)
                          ? order.customer
                          : (order.customer?.name || order.customerName || order.pickup_full_name || 'Customer'));
                      const itemsList = Array.isArray(order.items) ? order.items : (order.items && typeof order.items === 'object' ? Object.values(order.items) : []);
                      const itemsCount = order.itemsCount || itemsList.reduce((sum, it) => sum + (Number(it.quantity || it.qty || 1)), 0) || (itemsList.length > 0 ? itemsList.length : 1);
                      const itemsFullSummary = order.items_summary || (itemsList.length > 0 ? itemsList.map(it => `${it.name || it.item_name || 'Item'} × ${it.quantity || 1}`).join(', ') : '1 Item');

                      let totalVal = order.total ?? order.total_amount ?? order.amount;
                      if (typeof totalVal === 'string') totalVal = parseFloat(totalVal) || 0;
                      if (typeof totalVal === 'number' && totalVal > 500) totalVal = totalVal / 100;
                      if (!totalVal && itemsList.length > 0) {
                        totalVal = itemsList.reduce((sum, it) => sum + (Number(it.total || it.lineTotal || (it.price * (it.quantity || 1))) || 0), 0);
                      }
                      const formattedTotal = Number(totalVal || 0).toFixed(2);

                      let placedStr = order.placed;
                      if (!placedStr && (order.placedAt || order.createdAt)) {
                        try {
                          const dt = new Date(order.placedAt || order.createdAt);
                          if (!isNaN(dt.getTime())) {
                            placedStr = dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                          }
                        } catch {
                          placedStr = '10:42 AM';
                        }
                      }
                      if (!placedStr) placedStr = '10:42 AM';
                      const svcBadge = getServiceBadge(order);
                      const statusTarget = order.status_display || order.stage || order.currentLaundryStep || order.status || order.processing_stage;
                      const statusPill = getStatusPill(statusTarget);
                      const orderSteps = getOrderStatusSteps(order);
                      const currentIdx = getCurrentStepIndex(statusTarget, orderSteps);
                      const currentStepKey = orderSteps[currentIdx]?.key || 'RECEIVED';
                      const isDelivered = currentStepKey === 'DELIVERED';
                      const isOutForDelivery = currentStepKey === 'OUT_FOR_DELIVERY';
                      const isReadyForDelivery = currentStepKey === 'READY_FOR_DELIVERY';
                      const isDropdownOpen = openDropdownOrderId === (order.id || order.order_number);

                      return (
                        <div
                          key={order.id || order.order_number || idx}
                          className={`orders-grid-row orders-table-row ${isDropdownOpen ? 'row-open' : ''} ${idx % 2 === 1 ? 'row-alt' : ''}`}
                        >
                          <div
                            className="col-order-id"
                            onClick={() => setTrackerModalOrder(order)}
                            style={{ cursor: 'pointer' }}
                            title="Click to view full order tracking and item plan"
                          >
                            {orderIdStr}
                          </div>
                          <div className="col-customer">{customerName}</div>
                          <div
                            className="col-items"
                            title={`${itemsFullSummary} • Total: ₹${formattedTotal}`}
                            onClick={() => setTrackerModalOrder(order)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#1E293B', fontWeight: 600 }}>
                              {itemsFullSummary}
                            </div>
                            <div style={{ fontSize: '11px', color: '#0F766E', fontWeight: 600, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{itemsCount} {itemsCount === 1 ? 'item' : 'items'}</span>
                              <span>•</span>
                              <span style={{ color: '#059669', fontWeight: 700 }}>₹{formattedTotal}</span>
                            </div>
                          </div>
                          <div className="col-service" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
                            {getServiceBadges(order).map((b, bIdx) => (
                              <span
                                key={bIdx}
                                className="orders-service-badge"
                                style={{ background: b.bg, color: b.color }}
                              >
                                {b.label}
                              </span>
                            ))}
                          </div>
                          <div className="col-status">
                            <span
                              className="orders-status-pill"
                              style={{ background: statusPill.bg, color: statusPill.color }}
                            >
                              <span
                                className="orders-status-dot"
                                style={{ background: statusPill.dot }}
                              />
                              {statusPill.label}
                            </span>
                          </div>
                          <div className="col-placed">{placedStr}</div>
                          <div className="col-action orders-action-col">
                            {isDelivered ? (
                              <div className="orders-completed-label" title="Customer delivery completed">
                                <CheckCircle2 size={16} color="#10b981" />
                                <span>Completed</span>
                              </div>
                            ) : isOutForDelivery ? (
                              <div className="orders-completed-label" style={{ color: '#0284C7', background: '#F0F9FF', border: '1px solid #BAE6FD' }} title="With delivery driver on route to customer">
                                <Truck size={15} color="#0284C7" />
                                <span>On Route</span>
                              </div>
                            ) : isReadyForDelivery ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdownOrderId(isDropdownOpen ? null : (order.id || order.order_number));
                                }}
                                className={`orders-update-status-btn ${isDropdownOpen ? 'open' : ''}`}
                                aria-expanded={isDropdownOpen}
                                style={{ borderColor: '#0D9488', color: '#0D9488', background: '#F0FDFA', fontWeight: 600 }}
                                title="Packed & dispatched to Delivery Portal"
                              >
                                <Truck size={14} />
                                <span>Ready for Driver</span>
                                {isDropdownOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdownOrderId(isDropdownOpen ? null : (order.id || order.order_number));
                                }}
                                className={`orders-update-status-btn ${isDropdownOpen ? 'open' : ''}`}
                                aria-expanded={isDropdownOpen}
                              >
                                <span>Update Status</span>
                                {isDropdownOpen ? (
                                  <ChevronUp size={15} />
                                ) : (
                                  <ChevronDown size={15} />
                                )}
                              </button>
                            )}

                            {/* Dropdown Menu (Overlaps rows below) */}
                            {isDropdownOpen && (
                              <div
                                className="orders-dropdown-menu"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="dropdown-menu-header">
                                  <div className="dropdown-header-kicker">UPDATE STATUS</div>
                                  <div className="dropdown-header-title">
                                    {orderIdStr} · {customerName}
                                  </div>
                                </div>

                                <div className="dropdown-steps-list">
                                  {orderSteps.map((step, sIdx) => {
                                    const isCompleted = sIdx < currentIdx;
                                    const isCurrent = sIdx === currentIdx;
                                    const isNext = sIdx === currentIdx + 1;
                                    const isLater = sIdx > currentIdx + 1;
                                    const isPrev = sIdx === currentIdx - 1;

                                    return (
                                      <div
                                        key={step.key}
                                        className={`dropdown-step-item ${isCompleted ? 'step-completed' : ''} ${isCurrent ? 'step-current' : ''} ${isNext ? 'step-next' : ''} ${isLater ? 'step-later' : ''} ${isPrev ? 'step-prev' : ''}`}
                                        onClick={() => {
                                          if (isNext) {
                                            handleOrdersQuickAdvance(order, step.key, false);
                                          } else if (isCompleted) {
                                            handleOrdersQuickAdvance(order, step.key, true);
                                          } else if (!isCurrent) {
                                            handleOrdersQuickAdvance(order, step.key, sIdx < currentIdx);
                                          }
                                        }}
                                        title={isCompleted ? `Click to revert status back to ${step.label}` : undefined}
                                      >
                                        <div className="step-circle-indicator">
                                          {isCompleted ? (
                                            <Check size={12} color="#ffffff" strokeWidth={3} />
                                          ) : (
                                            <span>{step.num}</span>
                                          )}
                                        </div>

                                        <span className="step-label-text">
                                          {step.label}
                                          {step.key === 'READY_FOR_DELIVERY' && (
                                            <small style={{ color: '#0D9488', fontSize: '10px', display: 'block', fontWeight: 600 }}>Dispatches to Delivery Portal</small>
                                          )}
                                          {(step.key === 'OUT_FOR_DELIVERY' || step.key === 'DELIVERED') && (
                                            <small style={{ color: '#64748B', fontSize: '10px', display: 'block' }}>Delivery Driver Step</small>
                                          )}
                                        </span>

                                        {isCurrent && (
                                          <span className="step-current-tag">Current</span>
                                        )}

                                        {isPrev && (
                                          <button
                                            type="button"
                                            className="step-back-btn"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleOrdersQuickAdvance(order, step.key, true);
                                            }}
                                            title={`Revert status to ${step.label}`}
                                          >
                                            &lt; Back
                                          </button>
                                        )}

                                        {isNext && (
                                          <button
                                            type="button"
                                            className="step-next-btn"
                                            style={step.key === 'READY_FOR_DELIVERY' ? { background: '#0D9488', color: '#fff', padding: '3px 9px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 } : {}}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleOrdersQuickAdvance(order, step.key, false);
                                            }}
                                          >
                                            {step.key === 'READY_FOR_DELIVERY' ? 'Dispatch >' : 'Next >'}
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>

                                {currentIdx > 0 && (
                                  <div className="dropdown-footer-revert">
                                    <button
                                      type="button"
                                      className="dropdown-revert-action-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOrdersQuickAdvance(order, orderSteps[currentIdx - 1].key, true);
                                      }}
                                      title="Mistakenly updated? Go back to previous status"
                                    >
                                      <RotateCcw size={12} />
                                      <span>Back to {orderSteps[currentIdx - 1].label}</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer Pagination */}
                <div className="orders-card-footer">
                  <div className="orders-footer-counter">
                    Showing {filteredOrders.length === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + PAGE_SIZE, filteredOrders.length)} of {filteredOrders.length} orders
                  </div>
                  <div className="orders-pagination-buttons">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setOrdersCurrentPage(pageNum)}
                        className={`orders-page-btn ${pageNum === safePage ? 'active' : ''}`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ========================================================
            PAGE 6: ORDER HISTORY (Matching Image 2 Exactly)
           ======================================================== */}
        {activePage === 'history' && (() => {
          // Combine database historyOrders with completed/delivered/cancelled orders from realtime orders state
          const combinedHistoryMap = new Map();

          // 1. Seed from explicit history query
          (historyOrders || []).forEach(o => {
            const k = String(o.code || o.order_number || o.order_id || o.id || o.key || '');
            if (k) combinedHistoryMap.set(k, o);
          });

          // 2. Supplement from realtime active orders list
          (orders || []).forEach(o => {
            const s = String(o.status_display || o.status || o.orderStatus || o.raw_status || '').toUpperCase();
            const stage = String(o.stage || o.processing_stage || '').toUpperCase();
            const isDelivered = s.includes('DELIVER') || s.includes('COMPLET') || stage === 'DELIVERED';
            const isCancelled = s.includes('CANCEL');

            if (isDelivered || isCancelled) {
              const k = String(o.code || o.order_number || o.order_id || o.id || o.key || '');
              if (k) {
                const prev = combinedHistoryMap.get(k) || {};
                combinedHistoryMap.set(k, { ...prev, ...o, historyStatus: isCancelled ? 'cancelled' : 'delivered' });
              }
            }
          });

          const rawHistoryList = Array.from(combinedHistoryMap.values());

          const referenceHistoryOrders = rawHistoryList.map(ord => {
            const delDate = ord.deliveredAt || ord.delivered_at || ord.completedAt || ord.updatedAt || ord.placedAt || ord.createdAt || ord.created_at;
            const d = delDate ? new Date(delDate) : new Date();

            let amt = 0;
            if (ord.total_amount != null || ord.amount != null || ord.total != null) {
              let rawA = ord.total_amount ?? ord.amount ?? ord.total;
              if (typeof rawA === 'string') rawA = parseFloat(rawA) || 0;
              if (typeof rawA === 'number' && !isNaN(rawA)) {
                amt = rawA > 500 ? (rawA / 100) : rawA;
              }
            } else if (ord.amount_paise || ord.total_paise) {
              amt = (ord.amount_paise || ord.total_paise) / 100;
            }

            const itemsList = Array.isArray(ord.items)
              ? ord.items
              : (ord.items && typeof ord.items === 'object' ? Object.values(ord.items) : []);

            if (!amt && itemsList.length > 0) {
              amt = itemsList.reduce((sum, it) => sum + (Number(it.lineTotal || it.total || (it.price * (it.quantity || 1))) || 0), 0);
            }

            const custName = (typeof ord.customer_name === 'string' && ord.customer_name)
              ? ord.customer_name
              : ((typeof ord.customer === 'string' && ord.customer)
                ? ord.customer
                : (ord.customer?.name || ord.customerName || ord.pickup_full_name || 'Customer'));

            const custPhone = ord.customer_phone || ord.customerPhone || ord.customer?.phone || ord.pickup_phone || '-';

            const itemsSummary = ord.items_summary || (
              itemsList.length > 0
                ? itemsList.map(i => `${i.name || i.item_name || i.garment || 'Item'} × ${i.quantity || 1}`).join(', ')
                : 'Garments'
            );

            const servicesSummary = Array.isArray(ord.services)
              ? ord.services.join(', ')
              : (ord.service || ord.services || 'Wash & Fold');

            const rawSt = String(ord.historyStatus || ord.raw_status || ord.status_display || ord.status || '').toUpperCase();
            const isCancelled = rawSt.includes('CANCEL');
            const statusKey = isCancelled ? 'cancelled' : 'delivered';
            const statusLabel = isCancelled ? 'Cancelled' : 'Delivered';

            return {
              orderId: ord.code || ord.order_number || ord.order_id || ord.id,
              rawId: ord.id || ord.code,
              customerName: custName,
              customerPhone: custPhone,
              itemsSummary,
              servicesSummary,
              dateStr: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
              timeStr: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              timestamp: d.getTime(),
              amount: amt,
              price: `₹${amt.toFixed(2)}`,
              status: statusKey,
              statusLabel,
              items: itemsList,
              services: ord.services || []
            };
          });

          // Compute chip counts across the full dataset
          const allCount = referenceHistoryOrders.length;
          const deliveredCount = referenceHistoryOrders.filter(o => o.status === 'delivered').length;
          const cancelledCount = referenceHistoryOrders.filter(o => o.status === 'cancelled').length;

          // 1. Filter by Tab (all, delivered, cancelled)
          let filteredOrders = referenceHistoryOrders.filter(ord => {
            if (historyFilterTab === 'delivered' && ord.status !== 'delivered') return false;
            if (historyFilterTab === 'cancelled' && ord.status !== 'cancelled') return false;

            // Search query filter (Order ID, Customer Name, Phone, Items, Services)
            if (historySearchQuery.trim()) {
              const q = historySearchQuery.toLowerCase().trim();
              const matchId = ord.orderId.toLowerCase().includes(q);
              const matchName = ord.customerName.toLowerCase().includes(q);
              const matchPhone = ord.customerPhone.toLowerCase().includes(q);
              const matchItems = ord.itemsSummary.toLowerCase().includes(q);
              const matchServices = ord.servicesSummary.toLowerCase().includes(q);
              if (!matchId && !matchName && !matchPhone && !matchItems && !matchServices) return false;
            }

            return true;
          });

          // 2. Sorting (Date or Amount, Asc/Desc)
          filteredOrders = [...filteredOrders].sort((a, b) => {
            if (historySortField === 'date') {
              return historySortDirection === 'desc'
                ? b.timestamp - a.timestamp
                : a.timestamp - b.timestamp;
            }
            if (historySortField === 'amount') {
              return historySortDirection === 'desc'
                ? b.amount - a.amount
                : a.amount - b.amount;
            }
            return 0;
          });

          // 3. Stats for footer
          const totalValue = historyTotalValue || filteredOrders.reduce((acc, ord) => acc + ord.amount, 0);
          const totalValueFormatted = totalValue.toLocaleString('en-IN');

          // 4. Pagination (8 per page)
          const perPage = 8;
          const totalPages = Math.max(1, Math.ceil(filteredOrders.length / perPage));
          const pagedOrders = filteredOrders.slice((historyPage - 1) * perPage, historyPage * perPage);

          const toggleSortDate = () => {
            if (historySortField === 'date') {
              setHistorySortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
            } else {
              setHistorySortField('date');
              setHistorySortDirection('desc');
            }
          };

          const toggleSortAmount = () => {
            if (historySortField === 'amount') {
              setHistorySortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
            } else {
              setHistorySortField('amount');
              setHistorySortDirection('desc');
            }
          };

          const handleViewDetails = (ord) => {
            const matchingRealOrder = orders.find(o => 
              o.id === ord.rawId || 
              o.code === ord.orderId ||
              o.order_number === ord.orderId ||
              o.order_id === ord.orderId ||
              o.order_number?.replace(/^#/, '') === ord.orderId.replace(/^FC-/, '') ||
              o.order_id?.replace(/^#/, '') === ord.orderId.replace(/^FC-/, '')
            ) || {
              id: ord.rawId,
              order_number: ord.orderId,
              customer_name: ord.customerName,
              pickup_phone: ord.customerPhone,
              total_amount: ord.amount,
              status: ord.statusLabel.toUpperCase(),
              items: Array.isArray(ord.items) ? ord.items.map(i => ({ 
                name: i.name || i.item_name || 'Item', 
                quantity: i.quantity || 1, 
                unitPrice: i.unitPrice || i.price || 0,
                lineTotal: i.lineTotal || i.total || 0,
                services: i.services || [i.tag || 'Standard'] 
              })) : [],
              created_at: `${ord.dateStr} • ${ord.timeStr}`,
              services: ord.services || []
            };
            setTrackerModalOrder(matchingRealOrder);
          };

          return (
            <div className="hist-main-container">
              {/* ONE WHITE CARD (radius 24px, border 1px #e5e9ec) */}
              <div className="hist-table-card">
                {/* TOOLBAR */}
                <div className="hist-table-toolbar">
                  {/* Chips: All Orders, Delivered, Cancelled */}
                  <div className="hist-chips-wrap">
                    <button
                      type="button"
                      onClick={() => { setHistoryFilterTab('all'); setHistoryPage(1); }}
                      className={`hist-chip-btn ${historyFilterTab === 'all' ? 'active' : ''}`}
                    >
                      All Orders {allCount}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setHistoryFilterTab('delivered'); setHistoryPage(1); }}
                      className={`hist-chip-btn ${historyFilterTab === 'delivered' ? 'active' : ''}`}
                    >
                      Delivered {deliveredCount}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setHistoryFilterTab('cancelled'); setHistoryPage(1); }}
                      className={`hist-chip-btn ${historyFilterTab === 'cancelled' ? 'active' : ''}`}
                    >
                      Cancelled {cancelledCount}
                    </button>
                  </div>

                  {/* Right side Date-Range Dropdown */}
                  <div className="hist-date-range-wrap">
                    <div className="hist-date-range-btn">
                      <Calendar size={14} color="#64748B" />
                      <span>{historyFilterDate}</span>
                      <ChevronDown size={14} color="#64748B" />
                    </div>
                    <select
                      value={historyFilterDate}
                      onChange={(e) => { setHistoryFilterDate(e.target.value); setHistoryPage(1); }}
                      className="hist-date-select-hidden"
                      aria-label="Filter order history by date range"
                    >
                      <option value="26 Apr – 26 May 2025">26 Apr – 26 May 2025</option>
                      <option value="Last 30 Days">Last 30 Days</option>
                      <option value="This Month">This Month</option>
                      <option value="All Time">All Time</option>
                    </select>
                  </div>
                </div>

                {/* TABLE */}
                <div className="hist-table-responsive-wrap">
                  <div className="hist-table-min-width">
                    {/* Header Row: Light grey #f8fafb, 11px uppercase labels, 7 columns */}
                    <div className="hist-grid-row hist-table-header">
                      <div className="hist-th">ORDER ID</div>
                      <div className="hist-th">CUSTOMER</div>
                      <div className="hist-th">ITEMS &amp; SERVICE</div>
                      <div 
                        className="hist-th sortable" 
                        onClick={toggleSortDate}
                        title="Sort by Date"
                      >
                        <span>DATE</span>
                        <ArrowUpDown 
                          size={12} 
                          className={`hist-sort-icon ${historySortField === 'date' ? 'active' : ''}`} 
                        />
                      </div>
                      <div 
                        className="hist-th sortable center" 
                        onClick={toggleSortAmount}
                        title="Sort by Amount"
                      >
                        <span>AMOUNT</span>
                        <ArrowUpDown 
                          size={12} 
                          className={`hist-sort-icon ${historySortField === 'amount' ? 'active' : ''}`} 
                        />
                      </div>
                      <div className="hist-th center">STATUS</div>
                      <div className="hist-th right"></div>
                    </div>

                    {/* Table Rows (68px high, 1px #eef2f4 top border, hover #f8fafb) */}
                    <div className="hist-table-body">
                      {pagedOrders.length === 0 ? (
                        <div className="hist-empty-state-card">
                          No finished orders match your search or filter criteria.
                        </div>
                      ) : (
                        pagedOrders.map(ord => (
                          <div 
                            key={ord.orderId}
                            className="hist-grid-row hist-table-row"
                            onClick={() => handleViewDetails(ord)}
                          >
                            {/* 1. ORDER ID */}
                            <div 
                              className="hist-td-id" 
                              onClick={(e) => { e.stopPropagation(); handleViewDetails(ord); }}
                            >
                              {ord.orderId}
                            </div>

                            {/* 2. CUSTOMER */}
                            <div className="hist-td-customer">
                              <span className="hist-customer-name">{ord.customerName}</span>
                              <span className="hist-customer-phone">{ord.customerPhone}</span>
                            </div>

                            {/* 3. ITEMS & SERVICE */}
                            <div className="hist-td-items">
                              <span className="hist-items-text">{ord.itemsSummary}</span>
                              <span className="hist-services-text">{ord.servicesSummary}</span>
                            </div>

                            {/* 4. DATE */}
                            <div className="hist-td-date">
                              <span className="hist-date-main">{ord.dateStr}</span>
                              <span className="hist-date-sub">{ord.timeStr}</span>
                            </div>

                            {/* 5. AMOUNT */}
                            <div className="hist-td-amount">
                              {ord.price}
                            </div>

                            {/* 6. STATUS PILL (fixed width 96px, height 28px) */}
                            <div className="hist-td-status">
                              <span className={`hist-status-pill ${ord.status}`}>
                                {ord.statusLabel}
                              </span>
                            </div>

                            {/* 7. ACTION */}
                            <div className="hist-td-action">
                              <span className="hist-action-link">
                                View &rsaquo;
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* FOOTER */}
                <div className="hist-table-footer">
                  <div className="hist-footer-stats">
                    <strong>{filteredOrders.length} orders</strong> · Total value <strong>₹{totalValueFormatted}</strong>
                  </div>

                  <div className="hist-pagination-controls">
                    <button
                      type="button"
                      onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                      disabled={historyPage <= 1}
                      className="hist-page-btn"
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setHistoryPage(p)}
                        className={`hist-page-btn ${p === historyPage ? 'active' : ''}`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))}
                      disabled={historyPage >= totalPages}
                      className="hist-page-btn"
                      aria-label="Next page"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ========================================================
            PAGE 7: NOTIFICATIONS
           ======================================================== */}
        {activePage === 'notifications' && (
          <div className="content-card">
            <div className="flex items-center justify-between mb-4 pb-2 border-b">
              <div>
                <h2 className="text-lg font-bold text-navy">Laundry Operations Notifications</h2>
                <p className="text-xs text-muted">System dispatch alerts and incoming delivery transfers</p>
              </div>
              {notifications.length > 0 && (
                <button
                  onClick={handleMarkAllNotificationsRead}
                  className="btn btn-outline-secondary btn-sm text-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 size={14} />
                  <span>Mark All Read</span>
                </button>
              )}
            </div>

            {loadingNotifications ? (
              <div className="text-center py-16">
                <RefreshCw size={32} className="animate-spin text-[#0D7A75] mx-auto mb-2" />
                <p className="text-xs text-muted">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-16">
                <Bell size={44} className="text-slate-300 mx-auto mb-2" />
                <h3 className="font-bold text-navy">No new notifications</h3>
                <p className="text-xs text-muted mt-1">
                  You will receive real-time notifications when delivery agents hand over clothes or orders are updated.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map(notif => (
                  <div 
                    key={notif.id}
                    className={`p-3.5 rounded-xl border flex items-start gap-3 transition-colors ${
                      notif.is_read ? 'bg-white border-slate-200' : 'bg-teal-50/60 border-teal-200'
                    }`}
                  >
                    <div className="mt-0.5 p-2 rounded-lg bg-teal-100 text-[#0D7A75] shrink-0">
                      <Bell size={16} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-navy text-xs">{notif.title}</span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(notif.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{notif.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            PAGE 8: MY PROFILE (Matching Reference Image 1 Exactly)
           ======================================================== */}
        {activePage === 'profile' && (
          <div className="prof-main-container">
            {/* HERO STAFF PROFILE CARD */}
            <div className="prof-hero-card">
              <div className="prof-hero-left">
                <div className="prof-avatar-wrap">
                  <div className="prof-avatar-circle">
                    {profileData.avatarUrl ? (
                      <img 
                        src={profileData.avatarUrl} 
                        alt={profileData.username || 'Staff'} 
                        className="prof-avatar-img" 
                      />
                    ) : (
                      profileData.avatar || 'AN'
                    )}
                  </div>
                  <span className="prof-status-dot" />
                </div>
                <div className="prof-hero-info">
                  <div className="prof-name-row">
                    <h2 className="prof-name">{profileData.username || 'laundry_anita'}</h2>
                    <span className="prof-active-badge">
                      <Sparkles size={11} />
                      <span>Active Staff</span>
                    </span>
                  </div>
                  <p className="prof-designation-line">
                    {profileData.designation} • ID {profileData.employeeId}
                  </p>
                  <div className="prof-badges-row">
                    <span className="prof-pill-badge plant-shift">
                      <span className="prof-green-dot" />
                      <span>Plant Shift Active</span>
                    </span>
                    <span className="prof-pill-badge desk-hub">
                      <MapPin size={12} />
                      <span>Desk: {profileData.assignedDesk}</span>
                    </span>
                    <span className="prof-pill-badge certified">
                      <Check size={12} />
                      <span>Certified</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="prof-hero-actions">
                <button 
                  type="button"
                  onClick={() => {
                    setEditProfileForm(profileData);
                    setEditProfileOpen(true);
                  }}
                  className="prof-btn-edit"
                  title="Edit staff profile details"
                >
                  <Edit3 size={15} />
                  <span>Edit Profile</span>
                </button>
                <button 
                  type="button"
                  onClick={handleLogout}
                  className="prof-btn-logout"
                  title="Sign out of laundry portal"
                >
                  <LogOut size={15} />
                  <span>Logout Account</span>
                </button>
              </div>
            </div>

            {/* 2-COLUMN PROFILE DETAILS GRID */}
            <div className="prof-columns-grid">
              {/* COLUMN 1: Personal Information */}
              <div className="prof-card">
                <div className="prof-card-header">
                  <div className="prof-card-icon-box teal">
                    <User size={22} />
                  </div>
                  <div>
                    <h3 className="prof-card-title">Personal Information</h3>
                    <p className="prof-card-subtitle">Verified contact & facility details</p>
                  </div>
                </div>

                <div className="prof-fields-grid">
                  {/* Field 1: Username */}
                  <div className="prof-field-box">
                    <span className="prof-field-label">USERNAME</span>
                    <div className="prof-field-val">
                      <User size={15} className="prof-field-icon" />
                      <span>{profileData.username}</span>
                    </div>
                  </div>

                  {/* Field 2: Employee ID */}
                  <div className="prof-field-box">
                    <span className="prof-field-label">EMPLOYEE ID</span>
                    <div className="prof-field-val">
                      <CreditCard size={15} className="prof-field-icon" />
                      <span>{profileData.employeeId}</span>
                    </div>
                  </div>

                  {/* Field 3: Designation */}
                  <div className="prof-field-box">
                    <span className="prof-field-label">DESIGNATION</span>
                    <div className="prof-field-val">
                      <Briefcase size={15} className="prof-field-icon" />
                      <span>{profileData.designation}</span>
                    </div>
                  </div>

                  {/* Field 4: Assigned Desk */}
                  <div className="prof-field-box">
                    <span className="prof-field-label">ASSIGNED DESK</span>
                    <div className="prof-field-val">
                      <MapPin size={15} className="prof-field-icon" />
                      <span>{profileData.assignedDesk}</span>
                    </div>
                  </div>

                  {/* Field 5: Email Address */}
                  <div className="prof-field-box">
                    <span className="prof-field-label">EMAIL ADDRESS</span>
                    <div className="prof-field-val">
                      <Mail size={15} className="prof-field-icon" />
                      <span>{profileData.email}</span>
                    </div>
                  </div>

                  {/* Field 6: Contact Phone */}
                  <div className="prof-field-box">
                    <span className="prof-field-label">CONTACT PHONE</span>
                    <div className="prof-field-val">
                      <Phone size={15} className="prof-field-icon" />
                      <span>{profileData.phone}</span>
                    </div>
                  </div>

                  {/* Field 7: Facility Desk (Spans 2 columns) */}
                  <div className="prof-field-box full-width">
                    <span className="prof-field-label">FACILITY DESK</span>
                    <div className="prof-field-val">
                      <Building size={15} className="prof-field-icon" />
                      <span>{profileData.facilityDesk}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* COLUMN 2: Plant Responsibilities */}
              <div className="prof-card">
                <div className="prof-card-header">
                  <div className="prof-card-icon-box mint">
                    <ClipboardCheck size={22} />
                  </div>
                  <div>
                    <h3 className="prof-card-title">Plant Responsibilities</h3>
                    <p className="prof-card-subtitle">Workload, quality, department & certifications</p>
                  </div>
                </div>

                <div className="prof-resp-list">
                  {/* Row 1: Active Orders in Hub */}
                  <div className="prof-resp-item">
                    <div className="prof-resp-left">
                      <div className="prof-resp-icon-box mint">
                        <Package size={20} />
                      </div>
                      <div className="prof-resp-info">
                        <span className="prof-field-label">ACTIVE ORDERS IN HUB</span>
                        <span className="prof-resp-val">{profileData.activeOrdersBatches} Batches</span>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Quality Pass Rate */}
                  <div className="prof-resp-item with-progress">
                    <div className="prof-resp-left">
                      <div className="prof-resp-icon-box mint">
                        <CheckCircle2 size={20} />
                      </div>
                      <div className="prof-resp-info">
                        <span className="prof-field-label">QUALITY PASS RATE</span>
                        <span className="prof-resp-val teal">{profileData.qualityPassRate}</span>
                      </div>
                    </div>
                    <div className="prof-pass-rate-bar-wrap">
                      <div className="prof-pass-rate-bar-inner" style={{ width: profileData.qualityPassRate }} />
                    </div>
                  </div>

                  {/* Row 3: Department */}
                  <div className="prof-resp-item">
                    <div className="prof-resp-left">
                      <div className="prof-resp-icon-box purple">
                        <Building size={20} />
                      </div>
                      <div className="prof-resp-info">
                        <span className="prof-field-label">DEPARTMENT</span>
                        <span className="prof-resp-val dept">{profileData.department}</span>
                      </div>
                    </div>
                  </div>

                  {/* Row 4: Certifications */}
                  <div className="prof-resp-item with-badge">
                    <div className="prof-resp-left">
                      <div className="prof-resp-icon-box amber">
                        <ShieldCheck size={20} />
                      </div>
                      <div className="prof-resp-info">
                        <span className="prof-field-label">CERTIFICATIONS</span>
                        <span className="prof-resp-val cert">{profileData.certifications}</span>
                      </div>
                    </div>
                    <span className="prof-cert-badge">
                      <Check size={13} />
                      <span>Certified</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          MODALS PRESERVED
         ======================================================== */}

      {/* MODAL 1: CONFIRM RECEIPT */}
      {receiptModalOrder && (
        <div className="staff-modal-overlay">
          <div className="staff-modal-card">
            <div className="staff-modal-header">
              <div className="staff-modal-header-left">
                <div className="staff-modal-icon-badge">
                  <ClipboardCheck size={22} />
                </div>
                <div className="staff-modal-header-text">
                  <h3 className="staff-modal-title">
                    Verify Hub Intake
                  </h3>
                  <div className="staff-modal-meta">
                    <span className="staff-pill-badge teal">
                      Order #{receiptModalOrder.order_number || receiptModalOrder.order_id}
                    </span>
                    <span>• Independent count & weigh-in</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReceiptModalOrder(null)}
                className="staff-modal-close-btn"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmReceipt}>
              <div className="staff-modal-body">
                <div className="staff-form-row">
                  <div className="staff-form-group">
                    <label className="staff-form-label">Verified Bags *</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={receivedBags}
                      onChange={(e) => setReceivedBags(e.target.value)}
                      className="staff-form-input"
                    />
                  </div>
                  <div className="staff-form-group">
                    <label className="staff-form-label">Verified Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="3.5"
                      value={receivedWeight}
                      onChange={(e) => setReceivedWeight(e.target.value)}
                      className="staff-form-input"
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <label className="staff-checkbox-label">
                    <input
                      type="checkbox"
                      checked={hasDiscrepancy}
                      onChange={(e) => setHasDiscrepancy(e.target.checked)}
                      className="staff-checkbox"
                    />
                    <span>Discrepancy found (missing item, stain, count mismatch)</span>
                  </label>
                </div>

                {hasDiscrepancy && (
                  <div className="staff-form-group">
                    <label className="staff-form-label" style={{ color: '#B45309' }}>
                      Discrepancy Notes *
                    </label>
                    <textarea
                      rows={2}
                      required={hasDiscrepancy}
                      value={discrepancyNotes}
                      onChange={(e) => setDiscrepancyNotes(e.target.value)}
                      placeholder="E.g., 1 shirt has oil stain on collar, recorded prior to wash"
                      className="staff-form-textarea"
                      style={{ borderColor: '#FDE68A', background: '#FFFBEB' }}
                    />
                  </div>
                )}
              </div>

              <div className="staff-modal-footer">
                <button
                  type="button"
                  onClick={() => setReceiptModalOrder(null)}
                  className="staff-btn-secondary"
                  disabled={submittingReceipt}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="staff-btn-primary"
                  disabled={submittingReceipt}
                >
                  {submittingReceipt ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle size={15} />}
                  <span>Save Intake Verification</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADVANCE STAGE */}
      {advancingOrder && (
        <div className="staff-modal-overlay">
          <div className="staff-modal-card">
            <div className="staff-modal-header">
              <div className="staff-modal-header-left">
                <div className="staff-modal-icon-badge indigo">
                  <RotateCcw size={22} />
                </div>
                <div className="staff-modal-header-text">
                  <h3 className="staff-modal-title">
                    Advance Stage
                  </h3>
                  <div className="staff-modal-meta">
                    <span className="staff-pill-badge teal">
                      Order #{advancingOrder.order_number || advancingOrder.order_id}
                    </span>
                    <span>→ Moving to <strong>{targetStage}</strong></span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAdvancingOrder(null)}
                className="staff-modal-close-btn"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAdvanceStage}>
              <div className="staff-modal-body">
                <div className="staff-form-group">
                  <label className="staff-form-label">Processing Notes (Optional)</label>
                  <textarea
                    rows={3}
                    value={stageNotes}
                    onChange={(e) => setStageNotes(e.target.value)}
                    placeholder={`Completed previous cycle, moved to ${targetStage}`}
                    className="staff-form-textarea"
                  />
                </div>
              </div>

              <div className="staff-modal-footer">
                <button
                  type="button"
                  onClick={() => setAdvancingOrder(null)}
                  className="staff-btn-secondary"
                  disabled={submittingStage}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="staff-btn-primary"
                  disabled={submittingStage}
                >
                  {submittingStage ? <RefreshCw size={14} className="animate-spin" /> : <MoveRight size={15} />}
                  <span>Confirm Stage Transition</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: QUALITY CHECK */}
      {qcModalOrder && (
        <div className="staff-modal-overlay">
          <div className="staff-modal-card">
            <div className="staff-modal-header">
              <div className="staff-modal-header-left">
                <div className="staff-modal-icon-badge emerald">
                  <ShieldCheck size={22} />
                </div>
                <div className="staff-modal-header-text">
                  <h3 className="staff-modal-title">
                    Quality Inspection Audit
                  </h3>
                  <div className="staff-modal-meta">
                    <span className="staff-pill-badge teal">
                      Order #{qcModalOrder.order_number || qcModalOrder.order_id}
                    </span>
                    <span>• Authoritative hygiene & finish review</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQcModalOrder(null)}
                className="staff-modal-close-btn"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleQualityCheck}>
              <div className="staff-modal-body">
                {/* PASS / FAIL CARDS */}
                <div className="staff-qc-options">
                  <button
                    type="button"
                    onClick={() => setQcPassed(true)}
                    className={`staff-qc-card pass ${qcPassed ? 'active' : ''}`}
                  >
                    <span className="staff-qc-title">
                      <CheckCircle2 size={16} color={qcPassed ? '#059669' : '#64748B'} />
                      PASS (Approved)
                    </span>
                    <span className="staff-qc-desc">
                      Garments meet clean & fresh FabriCare standards.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQcPassed(false)}
                    className={`staff-qc-card fail ${!qcPassed ? 'active' : ''}`}
                  >
                    <span className="staff-qc-title">
                      <XCircle size={16} color={!qcPassed ? '#DC2626' : '#64748B'} />
                      FAIL (Reprocess)
                    </span>
                    <span className="staff-qc-desc">
                      Needs additional washing, drying, or pressing.
                    </span>
                  </button>
                </div>

                {!qcPassed && (
                  <div className="staff-form-group">
                    <label className="staff-form-label" style={{ color: '#B91C1C' }}>
                      Send Back for Reprocessing to:
                    </label>
                    <select
                      value={reprocessStage}
                      onChange={(e) => setReprocessStage(e.target.value)}
                      className="staff-form-select"
                      style={{ borderColor: '#FCA5A5' }}
                    >
                      <option value="WASHING">Washing (Re-wash for stains)</option>
                      <option value="DRYING">Drying (Moisture remaining)</option>
                      <option value="IRONING">Ironing (Re-press wrinkles)</option>
                    </select>
                  </div>
                )}

                <div className="staff-form-group">
                  <label className="staff-form-label">Audit Notes *</label>
                  <textarea
                    rows={2}
                    required
                    value={qcNotes}
                    onChange={(e) => setQCNotes(e.target.value)}
                    placeholder="Notes on stain removal, fabric softness, press quality..."
                    className="staff-form-textarea"
                  />
                </div>
              </div>

              <div className="staff-modal-footer">
                <button
                  type="button"
                  onClick={() => setQcModalOrder(null)}
                  className="staff-btn-secondary"
                  disabled={submittingQc}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={qcPassed ? 'staff-btn-success' : 'staff-btn-danger'}
                  disabled={submittingQc}
                >
                  {submittingQc ? <RefreshCw size={14} className="animate-spin" /> : null}
                  <span>{qcPassed ? 'Approve & Unlock Packing' : 'Submit Rejection & Route'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: PACKING */}
      {packingModalOrder && (
        <div className="staff-modal-overlay">
          <div className="staff-modal-card">
            <div className="staff-modal-header">
              <div className="staff-modal-header-left">
                <div className="staff-modal-icon-badge emerald">
                  <Package size={22} />
                </div>
                <div className="staff-modal-header-text">
                  <h3 className="staff-modal-title">
                    Package & Seal Order
                  </h3>
                  <div className="staff-modal-meta">
                    <span className="staff-pill-badge teal">
                      Order #{packingModalOrder.order_number || packingModalOrder.order_id}
                    </span>
                    <span>• Seal clean garments for delivery dispatch</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPackingModalOrder(null)}
                className="staff-modal-close-btn"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePackOrder}>
              <div className="staff-modal-body">
                <div className="staff-form-group">
                  <label className="staff-form-label">Packaging Notes (Optional)</label>
                  <textarea
                    rows={3}
                    value={packingNotes}
                    onChange={(e) => setPackingNotes(e.target.value)}
                    placeholder="Folded neatly, tagged and sealed in FabriCare moisture-resistant bag"
                    className="staff-form-textarea"
                  />
                </div>
              </div>

              <div className="staff-modal-footer">
                <button
                  type="button"
                  onClick={() => setPackingModalOrder(null)}
                  className="staff-btn-secondary"
                  disabled={submittingPack}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="staff-btn-success"
                  disabled={submittingPack}
                >
                  {submittingPack ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle size={15} />}
                  <span>Complete & Mark Ready for Delivery</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 5: DYNAMIC ORDER PLAN & PROGRESS TRACKER
          - "The tracker steps are driven by the item's merged plan, not fixed service names."
          - "Items with different plans show a small per-item progress list."
         ======================================================== */}
      {trackerModalOrder && (() => {
        const order = trackerModalOrder;
        const items = order.items || [];
        const uniquePlans = Array.from(new Set(items.map(it => (it.tasks || []).join('->'))));
        const isHeterogeneous = uniquePlans.length > 1;
        const conflictInfo = checkOrderConflict(order);

        return (
          <div className="staff-modal-overlay">
            <div className="staff-modal-card wide">
              {/* Header */}
              <div className="staff-modal-header">
                <div className="staff-modal-header-left">
                  <div className="staff-modal-icon-badge">
                    <Activity size={22} />
                  </div>
                  <div className="staff-modal-header-text">
                    <div className="staff-modal-title">
                      <span style={{ fontFamily: 'monospace', letterSpacing: '-0.02em' }}>
                        {order.order_number || order.order_id}
                      </span>
                      {order.is_express && (
                        <span className="staff-pill-badge express">
                          <Flame size={12} /> EXPRESS ORDER
                        </span>
                      )}
                      {conflictInfo.hasConflict && (
                        <span className="staff-pill-badge amber">
                          <AlertTriangle size={12} /> CHECK SERVICES
                        </span>
                      )}
                      <span className="staff-pill-badge teal">
                        Status: {order.status}
                      </span>
                    </div>
                    <div className="staff-modal-meta">
                      <span>Customer: <strong style={{ color: '#0F172A' }}>{order.customer_name || (typeof order.customer === 'object' ? order.customer?.name : order.customer) || order.pickup_full_name || 'Customer'}</strong></span>
                      <span>•</span>
                      <span>{items.length} {items.length === 1 ? 'Garment Item' : 'Garment Items'}</span>
                      <span>•</span>
                      <span>Total: <strong style={{ color: '#047857' }}>₹{Number(order.total_amount || order.amount || order.total || 0).toFixed(2)}</strong></span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTrackerModalOrder(null)}
                  className="staff-modal-close-btn"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="staff-modal-body">
                {/* Conflict Notice if present */}
                {conflictInfo.hasConflict && (
                  <div style={{
                    padding: '12px 16px',
                    background: '#FEF3C7',
                    border: '1px solid #FDE68A',
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px'
                  }}>
                    <AlertTriangle size={18} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ flex: 1, fontSize: '12px' }}>
                      <div style={{ fontWeight: 800, color: '#92400E' }}>Service Combination Warning</div>
                      <p style={{ color: '#B45309', margin: '2px 0 8px' }}>
                        Items in this order have conflicting care processes (Dry Clean + Wash).
                      </p>
                      <button
                        type="button"
                        onClick={() => setConflictModalOrder(order)}
                        className="staff-btn-secondary"
                        style={{ padding: '4px 12px', fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Shield size={12} /> Open Conflict Decision Tool
                      </button>
                    </div>
                  </div>
                )}

                {/* CASE A: HETEROGENEOUS ORDER (Items have different plans) */}
                {isHeterogeneous ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div className="tracker-notice-banner">
                      <div className="tracker-notice-icon-box">
                        <Info size={16} />
                      </div>
                      <div>
                        <h4 className="tracker-notice-title">Multi-Plan Custom Order:</h4>
                        <p className="tracker-notice-desc">
                          Different garments have distinct care workflows. Each garment advances independently through its own required stages. The order moves to QC only when all items are complete.
                        </p>
                      </div>
                    </div>

                    <div>
                      <div className="tracker-section-heading">
                        <ListChecks size={15} color="#0F766E" />
                        <span>Per-Item Progress & Dynamic Step Workflows</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                        {items.map((item, idx) => {
                          const curIdx = typeof item.currentTaskIndex === 'number' ? item.currentTaskIndex : 0;
                          const tasks = item.tasks || [];
                          const isReadyForQC = item.status === 'READY_FOR_QC';
                          const isDelivered = ['DELIVERED', 'COMPLETED'].includes(order.status);
                          const isQC = order.status === 'QUALITY_CHECK';
                          const isPacking = ['PACKING', 'PACKED'].includes(order.status);
                          const isReadyDel = ['READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY'].includes(order.status);
                          const note = getMergedTaskNote(item.services);

                          let itemStageLabel = `In ${TASK_LABELS[tasks[curIdx]] || tasks[curIdx] || 'Processing'}`;
                          if (isReadyForQC) itemStageLabel = 'Finished Plan • Ready for QC';
                          if (isQC) itemStageLabel = 'In Quality Check Audit';
                          if (isPacking) itemStageLabel = 'In Packaging & Seal';
                          if (isReadyDel || isDelivered) itemStageLabel = 'Ready for Transit / Dispatched';

                          return (
                            <div key={item.id || idx} className="tracker-item-card">
                              <div className="tracker-item-header">
                                <div className="tracker-item-left">
                                  <div className="tracker-item-icon-box">
                                    <Shirt size={17} />
                                  </div>
                                  <div>
                                    <h5 className="tracker-item-name">
                                      {item.name || item.item_name}
                                      <span className="tracker-qty-badge">×{item.quantity || 1}</span>
                                    </h5>
                                    {((item.lineTotal || item.total || item.unitPrice || item.price) > 0) && (
                                      <div style={{ fontSize: '12px', color: '#047857', fontWeight: 600, marginTop: '2px' }}>
                                        ₹{Number(item.lineTotal || item.total || ((item.unitPrice || item.price) * (item.quantity || 1))).toFixed(2)}
                                        {item.quantity > 1 && (item.unitPrice || item.price) > 0 && (
                                          <span style={{ color: '#64748B', fontWeight: 500, marginLeft: '5px' }}>
                                            (₹{Number(item.unitPrice || item.price).toFixed(2)} each)
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <span className={`tracker-stage-badge ${isReadyForQC || isQC || isPacking || isReadyDel || isDelivered ? '' : 'teal'}`}>
                                  {itemStageLabel}
                                </span>
                              </div>

                              {/* Service tags */}
                              <div className="tracker-services-row">
                                {(item.services || []).map(svc => (
                                  <span key={svc} className="tracker-service-pill">
                                    {SERVICE_DISPLAY_NAMES[svc] || svc}
                                  </span>
                                ))}
                              </div>

                              {/* Deduplication note if any */}
                              {note && (
                                <div className="tracker-dedup-box">
                                  <Info size={13} style={{ flexShrink: 0 }} />
                                  <span>{note}</span>
                                </div>
                              )}

                              {/* Mini Horizontal Stepper for this specific item */}
                              <div className="tracker-pipeline-wrap">
                                <div className="tracker-pipeline-kicker">
                                  Tailored Item Pipeline ({tasks.length} Processing Tasks):
                                </div>

                                <div className="tracker-stepper-track">
                                  {/* Step 0: Inspection */}
                                  <div className="tracker-step-node done">
                                    <Check size={11} />
                                    <span>Inspect</span>
                                  </div>
                                  <ChevronRight size={13} color="#CBD5E1" style={{ flexShrink: 0 }} />

                                  {/* Intermediate tasks */}
                                  {tasks.map((t, tIdx) => {
                                    const isDone = isReadyForQC || isQC || isPacking || isReadyDel || isDelivered || curIdx > tIdx;
                                    const isActive = !isReadyForQC && !isQC && !isPacking && !isReadyDel && !isDelivered && curIdx === tIdx && order.status === 'PROCESSING';

                                    return (
                                      <React.Fragment key={t}>
                                        <div className={`tracker-step-node ${isDone ? 'done' : isActive ? 'active' : ''}`}>
                                          {isDone ? <Check size={11} /> : isActive ? <RefreshCw size={11} className="animate-spin" /> : null}
                                          <span>{TASK_LABELS[t] || t}</span>
                                        </div>
                                        <ChevronRight size={13} color="#CBD5E1" style={{ flexShrink: 0 }} />
                                      </React.Fragment>
                                    );
                                  })}

                                  {/* QC Step */}
                                  <div className={`tracker-step-node ${isPacking || isReadyDel || isDelivered ? 'done' : isQC ? 'active' : ''}`}>
                                    {isPacking || isReadyDel || isDelivered ? <Check size={11} /> : null}
                                    <span>Quality Check</span>
                                  </div>
                                  <ChevronRight size={13} color="#CBD5E1" style={{ flexShrink: 0 }} />

                                  {/* Pack Step */}
                                  <div className={`tracker-step-node ${isReadyDel || isDelivered ? 'done' : isPacking ? 'active' : ''}`}>
                                    {isReadyDel || isDelivered ? <Check size={11} /> : null}
                                    <span>Pack & Seal</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* CASE B: HOMOGENEOUS ORDER (Single item or all items share same plan) */
                  (() => {
                    const sampleItem = items[0] || {};
                    const tasks = sampleItem.tasks || [];
                    const curIdx = typeof sampleItem.currentTaskIndex === 'number' ? sampleItem.currentTaskIndex : 0;
                    const isInspection = ['PICKED_UP', 'DROPPED_OFF_AT_LAUNDRY', 'RECEIVED_BY_LAUNDRY', 'INSPECTION'].includes(order.status);
                    const isProcessing = order.status === 'PROCESSING';
                    const isQC = order.status === 'QUALITY_CHECK';
                    const isPacking = ['PACKING', 'PACKED'].includes(order.status);
                    const isReady = ['READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(order.status);
                    const note = getMergedTaskNote(sampleItem.services);

                    // Build complete linear steps: Inspection + tasks + QC + Pack
                    const fullSteps = [
                      { id: 'inspect', label: 'Intake Inspection', desc: 'Fabric recount & hygiene check', isDone: !isInspection, isActive: order.status === 'INSPECTION' },
                      ...tasks.map((t, tIdx) => {
                        const isDone = !isInspection && (isQC || isPacking || isReady || curIdx > tIdx);
                        const isActive = isProcessing && curIdx === tIdx;
                        return {
                          id: t,
                          label: TASK_LABELS[t] || t,
                          desc: TASK_GERUND[t] ? `${TASK_GERUND[t]} stage` : 'Processing task',
                          isDone,
                          isActive
                        };
                      }),
                      { id: 'quality-check', label: 'Quality Check', desc: 'Hygiene & scent inspection', isDone: isPacking || isReady, isActive: isQC },
                      { id: 'pack', label: 'Packaging & Seal', desc: 'Protected FabriCare garment bag', isDone: isReady, isActive: isPacking }
                    ];

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        {/* Summary Card */}
                        <div className="tracker-summary-card">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B' }}>
                              Uniform Service Pipeline:
                            </span>
                            <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#0F766E' }}>
                              {tasks.length} Deduplicated Tasks
                            </span>
                          </div>

                          <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>
                            {buildPlanString(tasks)}
                          </div>

                          {note && (
                            <div className="tracker-dedup-box" style={{ marginLeft: 0 }}>
                              <Info size={13} style={{ flexShrink: 0 }} />
                              <span>{note}</span>
                            </div>
                          )}

                          <div style={{ fontSize: '12px', color: '#64748B', paddingTop: '4px' }}>
                            Items in this order: {items.map(it => `${it.name || it.item_name} (×${it.quantity || 1}${it.lineTotal || it.total ? ` • ₹${Number(it.lineTotal || it.total).toFixed(2)}` : ''})`).join(', ')}
                          </div>
                        </div>

                        {/* Full Step Sequence */}
                        <div>
                          <div className="tracker-section-heading">
                            Lifecycle Timeline
                          </div>

                          <div className="tracker-timeline" style={{ marginTop: '12px' }}>
                            {fullSteps.map((step) => (
                              <div key={step.id} className="tracker-timeline-item">
                                <div className={`tracker-timeline-bullet ${step.isDone ? 'done' : step.isActive ? 'active' : ''}`}>
                                  {step.isDone ? <Check size={12} /> : step.isActive ? <RefreshCw size={11} className="animate-spin" /> : null}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{
                                      fontSize: '13.5px',
                                      fontWeight: 800,
                                      color: step.isActive ? '#0F766E' : step.isDone ? '#0F172A' : '#94A3B8'
                                    }}>
                                      {step.label}
                                    </span>
                                    {step.isActive && (
                                      <span className="staff-pill-badge teal">
                                        Current Active Stage
                                      </span>
                                    )}
                                    {step.isDone && (
                                      <span className="staff-pill-badge" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#047857' }}>
                                        Completed
                                      </span>
                                    )}
                                  </div>
                                  <p style={{ fontSize: '12px', color: '#64748B', margin: '3px 0 0' }}>{step.desc}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>

              {/* Modal Footer */}
              <div className="staff-modal-footer">
                <button
                  type="button"
                  onClick={() => alert(`Generating and downloading tax invoice for order ${order.order_number || order.order_id}...`)}
                  className="staff-btn-outline"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Download size={15} />
                  <span>Download Invoice</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTrackerModalOrder(null)}
                  className="staff-btn-primary"
                >
                  Close Tracker
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================
          MODAL 6: CARE CONFLICT RESOLUTION MODAL
          - "If a combination conflicts (for example Dry Clean with Wash),
             show a warning badge 'Check services' on the order and let staff decide."
         ======================================================== */}
      {conflictModalOrder && (() => {
        const order = conflictModalOrder;
        const conflictInfo = checkOrderConflict(order);
        const conflictItems = (conflictInfo.conflictItems && conflictInfo.conflictItems.length > 0)
          ? conflictInfo.conflictItems
          : (order.items && order.items.length > 0)
          ? order.items
          : [
              {
                id: 'ci-default-1',
                name: 'Silk & Wool Garment Item',
                quantity: 1,
                services: ['dry-clean', 'wash-fold'],
                tasks: ['inspect', 'wash', 'dry', 'fold']
              }
            ];

        return (
          <div className="conflict-modal-overlay">
            <div className="conflict-modal-card">
              {/* Header */}
              <div className="conflict-modal-header">
                <div className="conflict-modal-header-left">
                  <div className="conflict-modal-icon-box">
                    <AlertTriangle size={22} />
                  </div>
                  <div>
                    <h3 className="conflict-modal-title">Care Conflict Resolution</h3>
                    <div className="conflict-modal-meta">
                      <span>Order #{order.order_number || order.order_id}</span>
                      <span className="text-slate-300">•</span>
                      <span className="conflict-modal-decision-badge">
                        Staff Decision Required
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setConflictModalOrder(null)}
                  className="conflict-modal-close-btn"
                  title="Close modal"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="conflict-modal-body">
                {/* Warning Policy Notice */}
                <div className="conflict-policy-card">
                  <div className="conflict-policy-header">
                    <AlertCircle size={16} />
                    <span>Fabric Care Policy Warning</span>
                  </div>
                  <p className="conflict-policy-text">
                    This order pairs <strong>Dry Clean</strong> with <strong>Water Wash</strong> on the same garment. Mechanical water wash cycles on structured or dry-clean-only fabrics (wool, silk, tailored blazers) can cause severe shrinkage, fiber warping, and dye bleeding.
                  </p>
                </div>

                {/* Conflicted Garment Items */}
                <div>
                  <div className="conflict-section-title">
                    <span>Garments with Conflicting Services</span>
                    <span className="text-slate-400 font-semibold lowercase">
                      ({conflictItems.length} {conflictItems.length === 1 ? 'garment' : 'garments'})
                    </span>
                  </div>
                  <div className="conflict-garments-list">
                    {conflictItems.map((ci, idx) => (
                      <div key={ci.id || idx} className="conflict-garment-card">
                        <div className="conflict-garment-top">
                          <div className="conflict-garment-name">
                            <Shirt size={15} style={{ color: '#0F766E' }} />
                            <span>{ci.name || ci.item_name || 'Garment Item'}</span>
                            <span style={{ color: '#64748B', fontWeight: 600 }}>×{ci.quantity || 1}</span>
                          </div>
                          <span className="conflict-pill-warning">
                            <AlertTriangle size={11} />
                            <span>Dry Clean + Water Wash</span>
                          </span>
                        </div>
                        <div className="conflict-garment-details">
                          <span style={{ fontWeight: 600, color: '#475569' }}>Selected Services:</span>
                          {(ci.services || ['dry-clean', 'wash-fold']).map((srv, sIdx) => (
                            <span key={sIdx} className="conflict-service-chip">
                              {srv === 'dry-clean' ? 'Dry Clean' : srv === 'wash-fold' ? 'Wash & Fold' : srv === 'wash-iron' ? 'Wash + Iron' : srv}
                            </span>
                          ))}
                          <span style={{ color: '#CBD5E1' }}>•</span>
                          <span style={{ color: '#64748B' }}>
                            Merged Plan: {(ci.tasks || ['inspect', 'wash', 'dry', 'fold']).map(t => TASK_LABELS[t] || t).join(' → ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Staff Resolution Strategy Options */}
                <div>
                  <div className="conflict-section-title">
                    <span>Choose Care Resolution Strategy</span>
                  </div>
                  <div className="conflict-options-list">
                    {/* Strategy 1: Dry Clean Only */}
                    <button
                      type="button"
                      onClick={() => handleResolveConflict(order.id, 'DRY_CLEAN_ONLY')}
                      className="conflict-option-card opt-dry-clean"
                    >
                      <div className="conflict-opt-left">
                        <div className="conflict-opt-icon-box green">
                          <Shield size={16} />
                        </div>
                        <div className="conflict-opt-text-block">
                          <h4 className="conflict-opt-title teal-highlight">
                            1. Proceed with Dry Clean Only
                          </h4>
                          <p className="conflict-opt-desc">
                            Cancels water wash cycle. Garment will be safely dry-cleaned and steam-pressed to protect delicate fibers.
                          </p>
                        </div>
                      </div>
                      <span className="conflict-opt-badge safest">
                        ✓ Safest & Recommended
                      </span>
                    </button>

                    {/* Strategy 2: Wash & Fold Only */}
                    <button
                      type="button"
                      onClick={() => handleResolveConflict(order.id, 'WASH_ONLY')}
                      className="conflict-option-card opt-wash"
                    >
                      <div className="conflict-opt-left">
                        <div className="conflict-opt-icon-box blue">
                          <Droplets size={16} />
                        </div>
                        <div className="conflict-opt-text-block">
                          <h4 className="conflict-opt-title">
                            2. Proceed with Wash & Fold Only
                          </h4>
                          <p className="conflict-opt-desc">
                            Cancels dry clean cycle. Garment will undergo standard mechanical water wash, dry, and fold.
                          </p>
                        </div>
                      </div>
                      <span className="conflict-opt-badge blue">
                        Water Wash Only
                      </span>
                    </button>

                    {/* Strategy 3: Allow Combination */}
                    <button
                      type="button"
                      onClick={() => handleResolveConflict(order.id, 'ALLOW_BOTH')}
                      className="conflict-option-card opt-supervised"
                    >
                      <div className="conflict-opt-left">
                        <div className="conflict-opt-icon-box amber">
                          <AlertTriangle size={16} />
                        </div>
                        <div className="conflict-opt-text-block">
                          <h4 className="conflict-opt-title">
                            3. Allow Combination (Staff Supervised)
                          </h4>
                          <p className="conflict-opt-desc">
                            Staff confirmed separable parts (e.g. detachable silk lining dry-cleaned, outer shell washed). Staff will supervise separate handling.
                          </p>
                        </div>
                      </div>
                      <span className="conflict-opt-badge amber">
                        Staff Supervised
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="conflict-modal-footer">
                <span className="conflict-modal-hint">
                  <Shield size={13} style={{ color: '#0F766E' }} />
                  <span>Click an option above to apply immediate resolution.</span>
                </span>
                <button
                  type="button"
                  onClick={() => setConflictModalOrder(null)}
                  className="conflict-modal-dismiss-btn"
                >
                  Dismiss / Decide Later
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================
          MODAL 7: SCAN ORDER BARCODE MODAL (Quick Action)
         ======================================================== */}
      {barcodeModalOpen && (
        <div className="staff-modal-overlay">
          <div className="staff-modal-card">
            <div className="staff-modal-header">
              <div className="staff-modal-header-left">
                <div className="staff-modal-icon-badge">
                  <Scan size={22} />
                </div>
                <div className="staff-modal-header-text">
                  <h3 className="staff-modal-title">Scan Order Barcode</h3>
                  <div className="staff-modal-meta">
                    <span>Scan barcode or enter Order ID manually</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setBarcodeModalOpen(false);
                  setScannedBarcode('');
                }}
                className="staff-modal-close-btn"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="staff-modal-body">
              <div className="staff-form-group">
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="e.g. FC-10452 or PU-1042"
                    value={scannedBarcode}
                    onChange={(e) => setScannedBarcode(e.target.value)}
                    className="staff-form-input"
                    style={{ paddingRight: '40px', fontFamily: 'monospace' }}
                    autoFocus
                  />
                  <Scan size={18} color="#94A3B8" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B', display: 'block', marginBottom: '8px' }}>
                  Quick Select Recent Orders:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {['#FC-10452', '#FC-10453', '#FC-10454'].map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setScannedBarcode(code)}
                      className="staff-btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '11.5px', fontFamily: 'monospace' }}
                    >
                      {code}
                    </button>
                  ))}
                </div>
              </div>

              {/* Found order preview */}
              {(() => {
                const query = scannedBarcode.trim().replace(/^#/, '').toLowerCase();
                if (!query) return null;
                const match = orders.find(o => 
                  (o.order_number && o.order_number.toLowerCase().includes(query)) ||
                  (o.order_id && o.order_id.toLowerCase().includes(query)) ||
                  (o.id && String(o.id).toLowerCase().includes(query)) ||
                  (o.customer_name && o.customer_name.toLowerCase().includes(query))
                );

                if (!match) {
                  return (
                    <div style={{
                      padding: '12px 14px',
                      background: '#FEF3C7',
                      border: '1px solid #FDE68A',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#92400E',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <AlertCircle size={16} color="#D97706" style={{ flexShrink: 0 }} />
                      <span>No matching order found for barcode &quot;{scannedBarcode}&quot;.</span>
                    </div>
                  );
                }

                return (
                  <div style={{
                    padding: '14px',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0F766E', fontSize: '14px' }}>
                        {match.order_number || match.order_id}
                      </span>
                      <span className="staff-pill-badge teal">
                        {match.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#1E293B' }}>
                      <strong style={{ color: '#0F172A' }}>Customer:</strong> {match.customer_name || 'Walk-in Customer'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748B' }}>
                      <strong style={{ color: '#334155' }}>Items:</strong> {(match.items || []).length} garments
                    </div>

                    <div style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setBarcodeModalOpen(false);
                          setTrackerModalOrder(match);
                        }}
                        className="staff-btn-primary"
                        style={{ flex: 1, justifyContent: 'center' }}
                      >
                        Open Tracker
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setBarcodeModalOpen(false);
                          navigateToRoute('processing');
                        }}
                        className="staff-btn-secondary"
                        style={{ flex: 1, textAlign: 'center' }}
                      >
                        View in Queue
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="staff-modal-footer">
              <button
                type="button"
                onClick={() => {
                  setBarcodeModalOpen(false);
                  setScannedBarcode('');
                }}
                className="staff-btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: EDIT STAFF PROFILE */}
      {editProfileOpen && (
        <div className="staff-modal-overlay">
          <div className="staff-modal-card" style={{ maxWidth: '580px' }}>
            <div className="staff-modal-header">
              <div className="staff-modal-header-left">
                <div className="staff-modal-icon-badge">
                  <Edit3 size={20} />
                </div>
                <div className="staff-modal-header-text">
                  <h3 className="staff-modal-title">Edit Staff Profile</h3>
                  <div className="staff-modal-meta">
                    <span>Update verified contact and facility desk details</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditProfileOpen(false)}
                className="staff-modal-close-btn"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile}>
              <div className="staff-modal-body">
                {/* Profile Photo Upload & Delete Section */}
                <div className="staff-avatar-edit-section">
                  <div className="staff-avatar-preview-wrap">
                    {editProfileForm.avatarUrl ? (
                      <img 
                        src={editProfileForm.avatarUrl} 
                        alt="Profile Preview" 
                        className="staff-avatar-preview-img" 
                      />
                    ) : (
                      <div className="staff-avatar-preview-placeholder">
                        AN
                      </div>
                    )}
                  </div>

                  <div className="staff-avatar-edit-actions">
                    <label className="staff-form-label" style={{ margin: 0 }}>Staff Profile Picture</label>
                    <div className="staff-avatar-btn-row">
                      <input 
                        type="file" 
                        ref={avatarInputRef} 
                        accept="image/*" 
                        onChange={handleAvatarFileChange} 
                        style={{ display: 'none' }} 
                      />
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="staff-avatar-upload-btn"
                      >
                        <Camera size={14} />
                        <span>{editProfileForm.avatarUrl ? 'Change Image' : 'Upload Image'}</span>
                      </button>

                      {editProfileForm.avatarUrl && (
                        <button
                          type="button"
                          onClick={handleDeleteAvatar}
                          className="staff-avatar-delete-btn"
                          title="Delete current image"
                        >
                          <Trash2 size={14} />
                          <span>Delete Image</span>
                        </button>
                      )}
                    </div>
                    <span className="staff-avatar-hint">
                      Recommended: PNG, JPG, or WEBP up to 5MB.
                    </span>
                  </div>
                </div>

                <div className="staff-form-row">
                  <div className="staff-form-group">
                    <label className="staff-form-label">Username *</label>
                    <input
                      type="text"
                      required
                      value={editProfileForm.username}
                      onChange={(e) => setEditProfileForm({ ...editProfileForm, username: e.target.value })}
                      className="staff-form-input"
                    />
                  </div>
                  <div className="staff-form-group">
                    <label className="staff-form-label">Designation *</label>
                    <input
                      type="text"
                      required
                      value={editProfileForm.designation}
                      onChange={(e) => setEditProfileForm({ ...editProfileForm, designation: e.target.value })}
                      className="staff-form-input"
                    />
                  </div>
                </div>

                <div className="staff-form-row">
                  <div className="staff-form-group">
                    <label className="staff-form-label">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={editProfileForm.email}
                      onChange={(e) => setEditProfileForm({ ...editProfileForm, email: e.target.value })}
                      className="staff-form-input"
                    />
                  </div>
                  <div className="staff-form-group">
                    <label className="staff-form-label">Contact Phone *</label>
                    <input
                      type="text"
                      required
                      value={editProfileForm.phone}
                      onChange={(e) => setEditProfileForm({ ...editProfileForm, phone: e.target.value })}
                      className="staff-form-input"
                    />
                  </div>
                </div>

                <div className="staff-form-row">
                  <div className="staff-form-group">
                    <label className="staff-form-label">Assigned Desk *</label>
                    <input
                      type="text"
                      required
                      value={editProfileForm.assignedDesk}
                      onChange={(e) => setEditProfileForm({ ...editProfileForm, assignedDesk: e.target.value })}
                      className="staff-form-input"
                    />
                  </div>
                  <div className="staff-form-group">
                    <label className="staff-form-label">Department *</label>
                    <input
                      type="text"
                      required
                      value={editProfileForm.department}
                      onChange={(e) => setEditProfileForm({ ...editProfileForm, department: e.target.value })}
                      className="staff-form-input"
                    />
                  </div>
                </div>

                <div className="staff-form-group">
                  <label className="staff-form-label">Facility Desk Location *</label>
                  <textarea
                    rows={2}
                    required
                    value={editProfileForm.facilityDesk}
                    onChange={(e) => setEditProfileForm({ ...editProfileForm, facilityDesk: e.target.value })}
                    className="staff-form-textarea"
                  />
                </div>
              </div>

              <div className="staff-modal-footer">
                <button
                  type="button"
                  onClick={() => setEditProfileOpen(false)}
                  className="staff-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="staff-btn-primary"
                >
                  <Check size={15} />
                  <span>Save Profile</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          SCOPED STYLES FOR LAUNDRY PORTAL SIDEBAR & LAYOUT
          ======================================================== */}
      <style>{`
        /* ========================================================
           REDESIGNED DASHBOARD STYLES (Matching Target Design)
           ======================================================== */
        .dash-main-container {
          display: flex;
          flex-direction: column;
          gap: 18px;
          margin-top: 6px;
        }

        /* ROW 1: FOUR KPI CARDS */
        .dash-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .dash-kpi-card {
          background: #FFFFFF;
          border: 1px solid #E5E9EC;
          border-radius: 24px;
          padding: 20px 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }

        .dash-kpi-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.04);
          border-color: #CBD5E1;
        }

        .dash-kpi-content-wrap {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .dash-kpi-icon-box {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .dash-kpi-icon-box.teal {
          background: #E6F4F1;
        }

        .dash-kpi-icon-box.orange {
          background: #FEF3C7;
        }

        .dash-kpi-icon-box.blue {
          background: #E0F2FE;
        }

        .dash-kpi-icon-box.red {
          background: #FEE2E2;
        }

        .dash-kpi-text-wrap {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .dash-kpi-label {
          font-size: 13px;
          font-weight: 600;
          color: #64748B;
          white-space: nowrap;
        }

        .dash-kpi-val-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }

        .dash-kpi-val {
          font-size: 34px;
          font-weight: 800;
          color: #0F172A;
          line-height: 1;
        }

        .dash-kpi-hint {
          font-size: 13px;
          font-weight: 700;
        }

        .dash-kpi-hint.green {
          color: #10B981;
        }

        .dash-kpi-hint.orange {
          color: #EA580C;
        }

        .dash-kpi-hint.blue {
          color: #0284C7;
        }

        .dash-kpi-hint.red {
          color: #DC2626;
        }

        .dash-kpi-arrow {
          color: #94A3B8;
          transition: transform 0.15s ease;
        }

        .dash-kpi-card:hover .dash-kpi-arrow {
          transform: translateX(3px);
          color: #0F766E;
        }

        /* SECTION CARD BASE */
        .dash-section-card {
          background: #FFFFFF;
          border: 1px solid #E5E9EC;
          border-radius: 24px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .dash-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 20px;
          min-height: 42px;
        }

        .dash-card-title {
          font-size: 18px;
          font-weight: 800;
          color: #0F172A;
          margin: 0;
          line-height: 1.2;
        }

        .dash-card-subtitle {
          font-size: 13px;
          color: #64748B;
          font-weight: 500;
          margin-top: 4px;
          margin-bottom: 0;
        }

        /* MIDDLE ROW (Two equal-width cards, each occupying 50% of available space) */
        .dash-middle-row {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
          align-items: stretch;
        }

        .where-orders-card,
        .orders-by-service-card {
          min-height: 420px;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        /* WHERE ORDERS ARE (DONUT CARD) */
        .where-orders-body {
          display: flex;
          align-items: center;
          gap: 24px;
          flex: 1;
        }

        .donut-chart-container {
          position: relative;
          width: 210px;
          height: 210px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .donut-svg-wrap {
          position: relative;
          width: 210px;
          height: 210px;
        }

        .donut-svg {
          width: 100%;
          height: 100%;
          transform: rotate(0deg);
        }

        .donut-slice-circle {
          cursor: pointer;
          transition: stroke-width 0.15s ease, opacity 0.15s ease;
        }

        .donut-slice-circle:hover {
          opacity: 0.9;
        }

        .donut-center-hole {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          pointer-events: none;
          width: 110px;
        }

        .donut-center-number {
          font-size: 32px;
          font-weight: 800;
          color: #0F172A;
          line-height: 1;
          transition: color 0.15s ease;
        }

        .donut-center-label {
          font-size: 12px;
          font-weight: 500;
          color: #64748B;
          margin-top: 4px;
          line-height: 1.2;
          max-width: 100px;
        }

        .donut-legend-list {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .donut-legend-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 36px;
          border-bottom: 1px solid #F1F5F9;
          cursor: pointer;
          padding: 0 4px;
          transition: background 0.12s ease;
          border-radius: 6px;
        }

        .donut-legend-row:last-child {
          border-bottom: none;
        }

        .donut-legend-row:hover,
        .donut-legend-row.hovered {
          background: #F8FAFC;
        }

        .donut-legend-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .donut-legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 3px;
          flex-shrink: 0;
        }

        .donut-legend-name {
          font-size: 13px;
          font-weight: 600;
          color: #334155;
        }

        .donut-legend-right {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .donut-legend-count {
          font-size: 13.5px;
          font-weight: 800;
          color: #0F172A;
          min-width: 18px;
          text-align: right;
        }

        .donut-legend-pct {
          font-size: 13px;
          font-weight: 500;
          color: #64748B;
          min-width: 30px;
          text-align: right;
        }

        .where-orders-footer {
          margin-top: auto;
          padding-top: 14px;
          display: flex;
          align-items: center;
          min-height: 36px;
        }

        .dash-footer-link {
          background: none;
          border: none;
          color: #0F766E;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          padding: 0;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: color 0.15s ease;
        }

        .dash-footer-link:hover {
          color: #0B4F47;
          text-decoration: underline;
        }

        /* ORDERS BY SERVICE CARD */
        .service-dropdown-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
        }

        .service-time-select {
          appearance: none;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          height: 36px;
          padding: 0 32px 0 14px;
          font-size: 13px;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          outline: none;
        }

        .service-time-select:hover {
          border-color: #CBD5E1;
        }

        .service-time-chevron {
          position: absolute;
          right: 10px;
          color: #64748B;
          pointer-events: none;
        }

        .service-bars-list {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 18px;
          padding: 6px 0;
        }

        .service-bar-row {
          display: flex;
          align-items: center;
        }

        .service-bar-label {
          width: 105px;
          font-size: 13px;
          font-weight: 600;
          color: #334155;
          flex-shrink: 0;
        }

        .service-bar-track {
          flex: 1;
          margin: 0 16px;
          height: 16px;
          background: #F1F5F9;
          border-radius: 9999px;
          overflow: hidden;
        }

        .service-bar-fill {
          height: 100%;
          border-radius: 9999px;
          transition: width 0.4s ease;
        }

        .service-bar-val {
          width: 28px;
          text-align: right;
          font-size: 14px;
          font-weight: 800;
          color: #0F172A;
          flex-shrink: 0;
        }

        .orders-by-service-footer {
          font-size: 13px;
          color: #64748B;
          margin-top: auto;
          padding-top: 14px;
          display: flex;
          align-items: center;
          min-height: 36px;
        }

        .orders-by-service-footer strong {
          color: #0F172A;
        }

        /* BOTTOM ROW */
        .dash-bottom-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 392px;
          gap: 18px;
          align-items: stretch;
        }

        .dash-view-all-link {
          background: none;
          border: none;
          color: #0F766E;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          padding: 0;
          transition: color 0.15s ease;
        }

        .dash-view-all-link:hover {
          color: #0B4F47;
          text-decoration: underline;
        }

        /* RECENT REQUESTS TABLE */
        .recent-table-row {
          display: grid;
          grid-template-columns: 110px 140px 120px minmax(170px, 1fr) 95px 75px;
          column-gap: 12px;
          align-items: center;
        }

        .recent-table-header {
          padding: 8px 14px 12px;
          border-bottom: 1px solid #F1F5F9;
          font-size: 11px;
          font-weight: 700;
          color: #64748B;
          letter-spacing: 0.04em;
        }

        .recent-table-body {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-top: 6px;
        }

        .recent-table-data-row {
          padding: 11px 14px;
          border-radius: 12px;
          background: #FFFFFF;
          transition: background 0.15s ease;
        }

        .recent-table-data-row.row-alt {
          background: #F8FAFB;
        }

        .recent-table-data-row:hover {
          background: #F1F6F8;
        }

        .recent-service-pill {
          display: inline-flex;
          align-items: center;
          padding: 3px 9px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 600;
          background: #E0F2FE;
          color: #0369A1;
        }

        .recent-tag-pill {
          display: inline-flex;
          align-items: center;
          padding: 3px 8px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 700;
          margin-left: 6px;
        }

        .recent-tag-pill.express {
          background: #FEE2E2;
          color: #DC2626;
        }

        .recent-tag-pill.merged {
          background: #DBEAFE;
          color: #1D4ED8;
        }

        .col-received {
          font-size: 13px;
          font-weight: 500;
          color: #475569;
        }

        .recent-open-btn {
          height: 32px;
          padding: 0 14px;
          border-radius: 9px;
          background: #FFFFFF;
          border: 1.5px solid #0F766E;
          color: #0F766E;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
          width: 100%;
        }

        .recent-open-btn:hover {
          background: #0F766E;
          color: #FFFFFF;
        }

        /* NEEDS ATTENTION CARD */
        .needs-attention-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 4px;
        }

        .attention-item-box {
          border-radius: 16px;
          padding: 14px 16px;
          display: flex;
          gap: 12px;
          align-items: flex-start;
          transition: transform 0.12s ease;
        }

        .attention-item-box:hover {
          transform: translateY(-1px);
        }

        .attention-item-box.blue-alert {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
        }

        .attention-item-box.red-alert {
          background: #FFF5F5;
          border: 1px solid #FECACA;
        }

        .attention-icon-box {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .attention-icon-box.blue {
          background: #E0F2FE;
        }

        .attention-icon-box.red {
          background: #FEE2E2;
        }

        .attention-content {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .attention-title {
          font-size: 13.5px;
          font-weight: 700;
          color: #0F172A;
          line-height: 1.2;
        }

        .attention-desc {
          font-size: 12.5px;
          color: #64748B;
          line-height: 1.4;
          margin-top: 4px;
        }

        .attention-action-link {
          background: none;
          border: none;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          padding: 0;
          margin-top: 8px;
          display: inline-flex;
          align-items: center;
          gap: 2px;
          width: fit-content;
        }

        .attention-action-link.teal {
          color: #0F766E;
        }

        .attention-action-link.teal:hover {
          color: #0B4F47;
          text-decoration: underline;
        }

        .attention-action-link.red {
          color: #DC2626;
        }

        .attention-action-link.red:hover {
          color: #B91C1C;
          text-decoration: underline;
        }

        /* RESPONSIVE BREAKPOINTS (Matching requirement: below 1200px stack) */
        @media (max-width: 1200px) {
          .dash-kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .dash-middle-row {
            grid-template-columns: 1fr;
          }
          .dash-bottom-row {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .dash-kpi-grid {
            grid-template-columns: 1fr;
          }
          .where-orders-body {
            flex-direction: column;
            align-items: center;
          }
        }

        /* ========================================================
           TARGET ORDERS PAGE STYLES (Matching Image 2 Exactly)
           ======================================================== */
        .sidebar-logo-icon-box {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: linear-gradient(135deg, #0F766E 0%, #0D9488 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(15, 118, 110, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2);
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
        }

        .sidebar-logo-text {
          font-family: 'Poppins', sans-serif;
          font-size: 1.55rem;
          font-weight: 800;
          letter-spacing: -0.025em;
          display: flex;
          align-items: center;
          line-height: 1;
        }

        .sidebar-count-badge.badge-teal {
          background: #E6F4F1;
          color: #0F766E;
        }

        .sidebar-count-badge.badge-red {
          background: #FEE2E2;
          color: #DC2626;
        }

        .orders-page-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .orders-chips-scroll-wrap {
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
          padding-bottom: 2px;
        }

        .orders-chips-scroll-wrap::-webkit-scrollbar {
          display: none;
        }

        .orders-chips-row {
          display: flex;
          align-items: center;
          gap: 5px;
          white-space: nowrap;
          min-width: max-content;
        }

        .orders-filter-chip {
          height: 42px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          padding: 0 16px;
          background: #FFFFFF;
          color: #334155;
          border: 1px solid #E5E9EC;
          cursor: pointer;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          user-select: none;
        }

        .orders-filter-chip:hover {
          background: #F8FAFC;
          border-color: #CBD5E1;
        }

        .orders-filter-chip.selected {
          background: #0B4F47;
          color: #FFFFFF;
          border-color: #0B4F47;
          font-weight: 700;
        }

        .orders-table-card {
          background: #FFFFFF;
          border: 1px solid #E5E9EC;
          border-radius: 24px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
          position: relative;
        }

        .orders-card-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .orders-toolbar-left {
          display: flex;
          align-items: baseline;
          gap: 10px;
        }

        .orders-toolbar-title {
          font-size: 18px;
          font-weight: 800;
          color: #0F172A;
          margin: 0;
          line-height: 1.2;
        }

        .orders-toolbar-subtitle {
          font-size: 13px;
          color: #64748B;
          font-weight: 500;
        }

        .orders-toolbar-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .orders-select-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
        }

        .orders-toolbar-select {
          appearance: none;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          height: 38px;
          padding: 0 32px 0 14px;
          font-size: 13px;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          outline: none;
          transition: border-color 0.15s ease;
        }

        .orders-toolbar-select:hover {
          border-color: #CBD5E1;
        }

        .orders-toolbar-select:focus {
          border-color: #0F766E;
        }

        .orders-select-chevron {
          position: absolute;
          right: 12px;
          color: #64748B;
          pointer-events: none;
        }

        /* GRID SYSTEM MATCHING SECTION B SPECIFICATION */
        .orders-grid-row {
          display: grid;
          grid-template-columns: 105px 135px minmax(170px, 1.2fr) minmax(130px, auto) 135px 100px minmax(130px, 1fr);
          column-gap: 12px;
          align-items: center;
        }

        .orders-grid-header {
          padding: 10px 16px 14px;
          border-bottom: 1px solid #F1F5F9;
          font-size: 11.5px;
          font-weight: 700;
          color: #64748B;
          letter-spacing: 0.04em;
        }

        .orders-table-body {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-top: 6px;
        }

        .orders-table-row {
          padding: 11px 16px;
          border-radius: 12px;
          background: #FFFFFF;
          transition: background 0.15s ease, border-color 0.15s ease;
          position: relative;
          border: 1.5px solid transparent;
        }

        .orders-table-row.row-alt {
          background: #F8FAFB;
        }

        .orders-table-row:hover {
          background: #F1F6F8;
        }

        .orders-table-row.row-open {
          background: #F0F9F7 !important;
          border: 1.5px solid #0F766E !important;
          z-index: 40 !important;
          box-shadow: 0 4px 14px rgba(15, 118, 110, 0.08);
        }

        .col-order-id {
          font-size: 13.5px;
          font-weight: 700;
          color: #0F172A;
        }

        .col-customer {
          font-size: 13.5px;
          font-weight: 600;
          color: #1E293B;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .col-items {
          font-size: 13px;
          font-weight: 500;
          color: #475569;
          min-width: 0;
          overflow: hidden;
        }

        .col-placed {
          font-size: 13px;
          font-weight: 500;
          color: #475569;
        }

        .orders-service-badge {
          display: inline-flex;
          align-items: center;
          padding: 3px 8px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
          line-height: 1.2;
        }

        .orders-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }

        .orders-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          display: inline-block;
          flex-shrink: 0;
        }

        .col-action {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          position: relative;
        }

        .orders-completed-label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #10B981;
        }

        /* UPDATE STATUS DROPDOWN BUTTON */
        .orders-update-status-btn {
          height: 40px;
          border-radius: 12px;
          background: #FFFFFF;
          border: 1.5px solid #B7D8D3;
          color: #0F766E;
          font-size: 13px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 0 14px;
          cursor: pointer;
          transition: all 0.15s ease;
          outline: none;
        }

        .orders-update-status-btn:hover {
          background: #E6F4F1;
          border-color: #0F766E;
        }

        .orders-update-status-btn.open {
          background: #0F766E !important;
          color: #FFFFFF !important;
          border-color: #0F766E !important;
        }

        /* OVERLAPPING DROPDOWN MENU */
        .orders-dropdown-menu {
          position: absolute;
          right: 0;
          top: calc(100% + 8px);
          width: 310px;
          z-index: 50;
          background: #FFFFFF;
          border-radius: 20px;
          box-shadow: 0 20px 45px -10px rgba(0, 0, 0, 0.22), 0 0 1px 1px rgba(0, 0, 0, 0.06);
          padding: 18px 16px;
          animation: dropdownFadeIn 0.15s ease;
          border: 1px solid #E5E9EC;
        }

        @keyframes dropdownFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .dropdown-menu-header {
          margin-bottom: 12px;
          padding: 0 4px;
        }

        .dropdown-header-kicker {
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: #94A3B8;
          text-transform: uppercase;
        }

        .dropdown-header-title {
          font-size: 14px;
          font-weight: 800;
          color: #0F172A;
          margin-top: 3px;
        }

        .dropdown-steps-list {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .dropdown-step-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 7px 10px;
          border-radius: 10px;
          transition: all 0.12s ease;
          border: 1.5px solid transparent;
        }

        .step-circle-indicator {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .step-label-text {
          font-size: 13px;
          flex: 1;
        }

        /* Completed Step */
        .dropdown-step-item.step-completed {
          color: #64748B;
        }

        .dropdown-step-item.step-completed .step-circle-indicator {
          background: #10B981;
          color: #FFFFFF;
        }

        /* Current Step */
        .dropdown-step-item.step-current {
          background: #F0FDF9;
          color: #0F172A;
          font-weight: 700;
        }

        .dropdown-step-item.step-current .step-circle-indicator {
          background: #0F766E;
          color: #FFFFFF;
        }

        .step-current-tag {
          background: #CCFBF1;
          color: #0F766E;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 9999px;
        }

        /* Completed Steps: Clickable to revert */
        .dropdown-step-item.step-completed {
          color: #64748B;
          cursor: pointer;
          transition: background-color 0.12s ease;
        }

        .dropdown-step-item.step-completed:hover {
          background: #F8FAFB;
        }

        .dropdown-step-item.step-prev:hover {
          background: #F0FDF9;
        }

        /* Back Button on Previous Step */
        .step-back-btn {
          background: #F8FAFC;
          color: #475569;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 9px;
          border-radius: 9999px;
          border: 1px solid #CBD5E1;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 2px;
          transition: all 0.15s ease;
        }

        .step-back-btn:hover {
          background: #F0FDF9;
          color: #0F766E;
          border-color: #0F766E;
        }

        /* Next Step: Clickable item */
        .dropdown-step-item.step-next {
          border: 1.5px solid #0F766E;
          background: #FFFFFF;
          color: #0F172A;
          font-weight: 700;
          cursor: pointer;
        }

        .dropdown-step-item.step-next:hover {
          background: #F0F9F7;
        }

        .dropdown-step-item.step-next .step-circle-indicator {
          border: 1.5px solid #0F766E;
          color: #0F766E;
          background: #FFFFFF;
        }

        .step-next-btn {
          background: #0F766E;
          color: #FFFFFF;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 9999px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .step-next-btn:hover {
          background: #0B4F47;
        }

        /* Later Steps */
        .dropdown-step-item.step-later {
          color: #94A3B8;
          opacity: 0.8;
          cursor: default;
        }

        .dropdown-step-item.step-later .step-circle-indicator {
          background: #F1F5F9;
          color: #94A3B8;
        }

        /* Bottom Revert Footer */
        .dropdown-footer-revert {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px dashed #E2E8F0;
        }

        .dropdown-revert-action-btn {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          color: #475569;
          font-size: 11.5px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
          width: 100%;
        }

        .dropdown-revert-action-btn:hover {
          background: #FEF2F2;
          border-color: #FECACA;
          color: #DC2626;
        }

        /* CARD FOOTER & PAGINATION */
        .orders-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 22px;
          padding-top: 16px;
          border-top: 1px solid #F1F5F9;
          gap: 16px;
          flex-wrap: wrap;
        }

        .orders-footer-counter {
          font-size: 13px;
          font-weight: 500;
          color: #64748B;
        }

        .orders-pagination-buttons {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .orders-page-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          color: #475569;
          font-size: 13px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .orders-page-btn:hover {
          background: #F8FAFC;
          border-color: #CBD5E1;
        }

        .orders-page-btn.active {
          background: #0B4F47 !important;
          color: #FFFFFF !important;
          border-color: #0B4F47 !important;
        }

        .orders-empty-state {
          padding: 48px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: #64748B;
          font-size: 14px;
          text-align: center;
        }

        .orders-clear-btn {
          padding: 8px 16px;
          border-radius: 10px;
          background: #0F766E;
          color: #FFFFFF;
          border: none;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }

        .laundry-portal-root {
          display: flex;
          min-height: 100vh;
          background: #F6F9FA;
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #1E293B;
        }

        /* FIXED LEFT SIDEBAR (Matching Image 1) */
        .laundry-sidebar {
          width: 272px;
          background: #FFFFFF;
          border-right: 1px solid #E5ECEE;
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0;
          bottom: 0;
          left: 0;
          height: 100vh;
          z-index: 100;
          flex-shrink: 0;
          overflow-y: auto;
          box-shadow: none;
        }

        .sidebar-brand-header {
          padding: 24px 20px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: none;
        }

        .sidebar-brand-inner {
          display: flex;
          align-items: center;
        }

        .portal-brand-logo {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          line-height: 1;
          user-select: none;
          cursor: pointer;
          transition: opacity 0.15s ease;
        }

        .portal-brand-logo:hover {
          opacity: 0.92;
        }

        .portal-brand-logo:hover .sidebar-logo-icon-box {
          transform: translateY(-1px) scale(1.02);
          box-shadow: 0 6px 16px rgba(15, 118, 110, 0.32);
        }

        .portal-brand-logo .logo-fabri {
          color: #0F172A;
        }

        .portal-brand-logo .logo-care {
          color: #087F8C;
        }

        .mobile-close-btn {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          color: #64748B;
          padding: 4px;
          border-radius: 6px;
        }

        .mobile-close-btn:hover {
          background: #F1F5F9;
          color: #0F172A;
        }

        /* STAFF PROFILE CARD (AN, laundry_anita, green dot + Staff) */
        .sidebar-staff-card {
          padding: 10px 14px;
          margin: 4px 16px 12px;
          background: #FFFFFF;
          border: 1px solid #E5ECEE;
          border-radius: 14px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .staff-avatar-circle {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: #0F766E;
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.875rem;
          flex-shrink: 0;
          overflow: hidden;
        }

        .staff-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: inherit;
          display: block;
        }

        .staff-card-info {
          overflow: hidden;
        }

        .staff-card-name {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #0F172A;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .staff-card-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.7rem;
          color: #64748B;
          font-weight: 500;
          margin-top: 2px;
        }

        .status-indicator-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10B981;
          display: inline-block;
        }

        /* SIDEBAR NAV MENU: Single list matching target design */
        .sidebar-nav-menu {
          display: flex;
          flex-direction: column;
          gap: 3px;
          padding: 6px 14px;
          flex: 1;
        }

        .sidebar-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          height: 42px;
          padding: 0 12px;
          border-radius: 12px;
          border: none;
          background: transparent;
          color: #475569;
          font-size: 0.825rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
          width: 100%;
          position: relative;
        }

        .sidebar-nav-item:hover {
          background: #F8FAFC;
          color: #0F172A;
        }

        .sidebar-nav-item.active {
          background: #E6F4F2;
          color: #0F766E;
          font-weight: 700;
        }

        .sidebar-nav-item.active .nav-icon {
          color: #0F766E;
        }

        .nav-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0F766E;
          flex-shrink: 0;
        }

        .nav-label {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sidebar-count-badge {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #E6F4F2;
          color: #0F766E;
          font-weight: 700;
          font-size: 0.72rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: auto;
          flex-shrink: 0;
        }

        .sidebar-thin-divider {
          height: 1px;
          background: #E5ECEE;
          margin: 10px 4px;
        }

        /* SIDEBAR FOOTER */
        .sidebar-footer-menu {
          padding: 12px 14px;
          border-top: 1px solid #E5ECEE;
          display: flex;
          flex-direction: column;
          gap: 4px;
          background: #FFFFFF;
          margin-top: auto;
        }

        .sidebar-nav-item.logout-btn:hover {
          background: #FEE2E2;
          color: #DC2626;
        }

        .sidebar-nav-item.logout-btn:hover .nav-icon {
          color: #DC2626;
        }

        /* MAIN CONTENT WRAPPER */
        .laundry-main-wrapper {
          margin-left: 272px;
          flex: 1;
          padding: 0 28px 32px;
          min-height: 100vh;
          max-width: calc(100vw - 272px);
          background: #F6F9FA;
        }

        /* ========================================================
           DASHBOARD HEADER BAR (Sticky, Modern & Professional)
           ======================================================== */
        .dash-header-sticky-wrapper {
          position: sticky;
          top: 0;
          z-index: 90;
          background: #F6F9FA;
          padding-top: 20px;
          padding-bottom: 14px;
          margin-bottom: 10px;
        }

        .dashboard-header-bar {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          padding: 14px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 0;
          flex-wrap: nowrap;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02), 0 4px 14px rgba(15, 23, 42, 0.03);
          position: relative;
          transition: box-shadow 0.2s ease, border-color 0.2s ease;
        }

        .dash-header-left {
          display: flex;
          align-items: center;
          gap: 16px;
          min-width: 0;
          flex: 1;
        }

        .dash-header-kicker {
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #0F766E;
          margin-bottom: 2px;
        }

        .dash-header-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -0.025em;
          line-height: 1.15;
          margin: 0;
          white-space: nowrap;
        }

        .dash-header-subtitle {
          font-size: 0.8125rem;
          color: #64748B;
          margin: 4px 0 0;
          font-weight: 400;
          max-width: 520px;
          line-height: 1.35;
        }

        .dash-header-right {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-left: auto;
          flex-shrink: 0;
        }

        .dash-search-box {
          position: relative;
          width: 260px;
          flex-shrink: 0;
        }

        .dash-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #94A3B8;
          pointer-events: none;
        }

        .dash-search-input {
          width: 100%;
          height: 40px;
          padding: 0 14px 0 36px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          font-size: 0.8125rem;
          color: #1E293B;
          outline: none;
          transition: all 0.15s ease;
          font-family: inherit;
        }

        .dash-search-input:focus {
          background: #FFFFFF;
          border-color: #0F766E;
          box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.12);
        }

        .dash-search-input::placeholder {
          color: #94A3B8;
          font-size: 0.8rem;
        }

        .dash-icon-btn {
          position: relative;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          color: #475569;
          cursor: pointer;
          transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
          flex-shrink: 0;
        }

        .dash-icon-btn:hover {
          background: #FFFFFF;
          border-color: #CBD5E1;
          color: #0F766E;
          transform: translateY(-1px);
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
        }

        .dash-icon-btn:active {
          transform: translateY(0);
        }

        .dash-bell-badge {
          position: absolute;
          top: -3px;
          right: -3px;
          width: 18px;
          height: 18px;
          background: #EF4444;
          color: #FFFFFF;
          border-radius: 50%;
          font-size: 0.6875rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #FFFFFF;
          box-shadow: 0 2px 4px rgba(239, 68, 68, 0.35);
        }

        /* USER PROFILE PILL & DROPDOWN (Matching Reference Design) */
        .dash-user-dropdown-wrap {
          position: relative;
          display: inline-block;
          margin-left: 4px;
        }

        .dash-user-pill-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 3px 14px 3px 4px;
          height: 40px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 9999px;
          cursor: pointer;
          transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
          text-align: left;
          outline: none;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
        }

        .dash-user-pill-btn:hover,
        .dash-user-pill-btn.open {
          background: #FFFFFF;
          border-color: #CBD5E1;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
          transform: translateY(-1px);
        }

        .dash-user-avatar-wrap {
          position: relative;
          width: 34px;
          height: 34px;
          flex-shrink: 0;
        }

        .dash-user-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #006B5B;
          color: #FFFFFF;
          font-weight: 700;
          font-size: 0.8125rem;
          display: flex;
          align-items: center;
          justify-content: center;
          letter-spacing: -0.02em;
          overflow: hidden;
        }

        .dash-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
          display: block;
        }

        .dash-user-status-dot {
          position: absolute;
          bottom: 0px;
          right: 0px;
          width: 10px;
          height: 10px;
          background: #10B981;
          border: 2px solid #FFFFFF;
          border-radius: 50%;
        }

        .dash-user-info {
          display: flex;
          flex-direction: column;
          line-height: 1.15;
        }

        .dash-user-name {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #0F172A;
          white-space: nowrap;
        }

        .dash-user-role {
          font-size: 0.6875rem;
          color: #64748B;
          font-weight: 500;
          white-space: nowrap;
        }

        .dash-user-chevron {
          color: #94A3B8;
          margin-left: 2px;
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }

        .dash-user-dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          min-width: 175px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
          padding: 6px;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .dash-dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 9px 12px;
          border-radius: 9px;
          border: none;
          background: transparent;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
        }

        .dash-dropdown-item:hover {
          background: #F8FAFC;
          color: #0F172A;
        }

        .dash-dropdown-icon {
          color: #64748B;
          flex-shrink: 0;
        }

        .dash-dropdown-item.logout {
          color: #EF4444;
        }

        .dash-dropdown-item.logout:hover {
          background: #FEF2F2;
          color: #DC2626;
        }

        .dash-dropdown-item.logout .logout-icon {
          color: #EF4444;
        }

        .dash-dropdown-item.logout:hover .logout-icon {
          color: #DC2626;
        }

        /* ========================================================
           DASHBOARD MAIN CONTAINER & ROWS
           ======================================================== */
        .dash-main-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
          width: 100%;
        }

        /* ROW 1: 4 KPI CARDS */
        .dash-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          width: 100%;
        }

        .dash-kpi-card {
          background: #FFFFFF;
          border: 1px solid #E5ECEE;
          border-radius: 16px;
          padding: 20px 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: all 0.18s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }

        .dash-kpi-card:hover {
          transform: translateY(-2px);
          border-color: #0F766E;
          box-shadow: 0 6px 16px rgba(15, 118, 110, 0.07);
        }

        .dash-kpi-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .dash-kpi-icon-box {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .dash-kpi-icon-box.teal {
          background: #E6F7F5;
          border: 1px solid #C8ECE7;
          color: #0D9488;
        }

        .dash-kpi-icon-box.orange {
          background: #FFF4ED;
          border: 1px solid #FDE0CE;
          color: #F97316;
        }

        .dash-kpi-icon-box.blue {
          background: #EFF6FF;
          border: 1px solid #DBEAFE;
          color: #3B82F6;
        }

        .dash-kpi-icon-box.red {
          background: #FEF2F2;
          border: 1px solid #FEE2E2;
          color: #EF4444;
        }

        .dash-kpi-label {
          font-size: 0.8125rem;
          color: #64748B;
          font-weight: 500;
          margin-bottom: 4px;
        }

        .dash-kpi-val-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }

        .dash-kpi-val {
          font-size: 1.75rem;
          font-weight: 800;
          color: #0F172A;
          line-height: 1;
        }

        .dash-kpi-badge {
          font-size: 0.775rem;
          font-weight: 600;
        }

        .dash-kpi-badge.green {
          color: #10B981;
        }

        .dash-kpi-badge.red {
          color: #EF4444;
        }

        .dash-kpi-badge.muted {
          color: #3B82F6;
        }

        .dash-kpi-arrow {
          color: #94A3B8;
          flex-shrink: 0;
          transition: transform 0.15s ease;
        }

        .dash-kpi-card:hover .dash-kpi-arrow {
          transform: translateX(3px);
          color: #0F766E;
        }

        /* ROW 2: 3 CARDS */
        .dash-row-2-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr 1.15fr;
          gap: 20px;
          width: 100%;
        }

        .dash-card {
          background: #FFFFFF;
          border: 1px solid #E5ECEE;
          border-radius: 16px;
          padding: 22px 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }

        .dash-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .dash-card-title {
          font-size: 1rem;
          font-weight: 800;
          color: #0F172A;
          margin: 0;
          letter-spacing: -0.01em;
        }

        .dash-card-subtitle {
          font-size: 0.775rem;
          color: #64748B;
          margin: 2px 0 0;
        }

        .dash-select-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 5px 10px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .dash-select-btn:hover {
          background: #F8FAFC;
          border-color: #CBD5E1;
        }

        /* Bar Chart in Card 1 */
        .dash-bar-chart {
          display: flex;
          align-items: flex-end;
          justify-content: space-around;
          height: 180px;
          padding: 10px 0 0;
          margin-top: 10px;
          border-bottom: 1px solid #F1F5F9;
        }

        .dash-bar-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
          justify-content: flex-end;
          flex: 1;
        }

        .dash-bar-val {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #1E293B;
          margin-bottom: 8px;
        }

        .dash-bar-fill {
          width: 44px;
          border-radius: 6px 6px 0 0;
          transition: height 0.4s ease;
        }

        .dash-bar-fill.teal {
          background: #00A896;
        }

        .dash-bar-fill.blue {
          background: #3B82F6;
        }

        .dash-bar-fill.purple {
          background: #8B5CF6;
        }

        .dash-bar-fill.orange {
          background: #F59E0B;
        }

        .dash-bar-fill.red {
          background: #EF4444;
        }

        .dash-bar-label {
          font-size: 0.725rem;
          font-weight: 600;
          color: #475569;
          margin-top: 10px;
          text-align: center;
          white-space: nowrap;
        }

        /* Processing Progress in Card 2 */
        .dash-progress-list {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .dash-progress-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.8125rem;
          padding: 2px 0;
        }

        .dash-progress-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .dash-stage-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .dash-stage-name {
          font-weight: 500;
          color: #334155;
        }

        .dash-stage-count {
          font-weight: 700;
          color: #0F172A;
        }

        .dash-stage-pct {
          font-weight: 400;
          color: #64748B;
          margin-left: 2px;
        }

        /* Today's Schedule in Card 3 */
        .dash-schedule-link {
          background: none;
          border: none;
          color: #0F766E;
          font-size: 0.775rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.15s ease;
          padding: 0;
        }

        .dash-schedule-link:hover {
          opacity: 0.8;
          text-decoration: underline;
        }

        .dash-segmented-tabs {
          display: flex;
          background: #F1F5F9;
          border-radius: 8px;
          padding: 3px;
          gap: 4px;
          margin-bottom: 14px;
        }

        .dash-seg-tab {
          flex: 1;
          border: none;
          background: transparent;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748B;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: center;
        }

        .dash-seg-tab.active {
          background: #0F766E;
          color: #FFFFFF;
          box-shadow: 0 1px 3px rgba(15, 118, 110, 0.2);
        }

        .dash-schedule-list {
          display: flex;
          flex-direction: column;
        }

        .dash-schedule-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 9px 0;
          border-bottom: 1px solid #F1F5F9;
        }

        .dash-schedule-item:last-child {
          border-bottom: none;
        }

        .dash-sched-time {
          font-size: 0.775rem;
          font-weight: 700;
          color: #0F172A;
        }

        .dash-sched-desc {
          font-size: 0.725rem;
          color: #64748B;
          margin-top: 1px;
        }

        .dash-status-pill {
          font-size: 0.7rem;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 9999px;
          white-space: nowrap;
        }

        .dash-status-pill.ontime {
          background: #DCFCE7;
          color: #15803D;
          border: 1px solid #BBF7D0;
        }

        .dash-status-pill.upcoming {
          background: #EFF6FF;
          color: #2563EB;
          border: 1px solid #DBEAFE;
        }

        /* ROW 3: 2 CARDS (Recent Incoming Orders + Quick Actions) */
        .dash-row-3-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 20px;
          width: 100%;
        }

        .dash-table-wrap {
          overflow-x: auto;
        }

        .dash-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .dash-table th {
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748B;
          padding: 10px 12px;
          border-bottom: 1px solid #E5ECEE;
          white-space: nowrap;
        }

        .dash-table-row {
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .dash-table-row:hover {
          background: #F8FAFC;
        }

        .dash-table td {
          padding: 14px 12px;
          border-bottom: 1px solid #F1F5F9;
          vertical-align: middle;
        }

        .dash-order-id {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #0F172A;
          white-space: nowrap;
        }

        .dash-cust-name {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #1E293B;
          white-space: nowrap;
        }

        .dash-items-count {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #0F172A;
        }

        .dash-service-main {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #0F172A;
        }

        .dash-service-sub {
          font-size: 0.725rem;
          color: #64748B;
          margin-top: 1px;
        }

        .dash-service-sub.conflict {
          color: #EF4444;
          font-weight: 600;
        }

        .dash-pill-received {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #ECFDF5;
          color: #059669;
          border: 1px solid #A7F3D0;
          border-radius: 9999px;
          padding: 3px 10px;
          font-size: 0.725rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .dash-pill-inprogress {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #EFF6FF;
          color: #2563EB;
          border: 1px solid #BFDBFE;
          border-radius: 9999px;
          padding: 3px 10px;
          font-size: 0.725rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .dash-pill-conflict {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #FEF2F2;
          color: #DC2626;
          border: 1px solid #FECACA;
          border-radius: 9999px;
          padding: 3px 10px;
          font-size: 0.725rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .dash-time-col {
          font-size: 0.75rem;
          color: #64748B;
          white-space: nowrap;
        }

        /* Quick Actions List */
        .dash-quick-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 14px;
        }

        .dash-quick-btn {
          background: #FFFFFF;
          border: 1px solid #E5ECEE;
          border-radius: 12px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 54px;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
        }

        .dash-quick-btn:hover {
          border-color: #0F766E;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(15, 118, 110, 0.08);
          background: #F8FAFC;
        }

        .dash-quick-btn-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .dash-quick-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: #E6F7F5;
          color: #0D9488;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .dash-quick-label {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #1E293B;
          line-height: 1.25;
        }

        .dash-quick-arrow {
          color: #94A3B8;
          flex-shrink: 0;
          transition: color 0.15s ease;
        }

        .dash-quick-btn:hover .dash-quick-arrow {
          color: #0F766E;
        }

        /* REDESIGNED DASHBOARD PIPELINE CARD */
        .dash-pipeline-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          padding: 22px 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .dash-pipeline-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .dash-pipeline-header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .dash-pipeline-icon-box {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: #E6F4F2;
          color: #0F766E;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .dash-pipeline-title {
          font-size: 1rem;
          font-weight: 800;
          color: #0F172A;
          margin: 0;
          line-height: 1.25;
        }

        .dash-pipeline-desc {
          font-size: 0.8125rem;
          color: #64748B;
          margin: 3px 0 0;
        }

        .dash-pipeline-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 14px;
          border-radius: 9999px;
          background: #F0FDFA;
          border: 1px solid #CCFBF1;
          color: #0F766E;
          font-size: 0.75rem;
          font-weight: 700;
          white-space: nowrap;
        }

        .dash-pipeline-track {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow-x: auto;
          padding: 6px 2px;
        }

        .dash-pipeline-node {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
          flex-shrink: 0;
          cursor: default;
        }

        .dash-pipeline-node:hover {
          background: #FFFFFF;
          border-color: #0F766E;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(15, 118, 110, 0.08);
        }

        .dash-pipeline-num {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #E2E8F0;
          color: #475569;
          font-size: 0.65rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }

        .dash-pipeline-node:hover .dash-pipeline-num {
          background: #0F766E;
          color: #FFFFFF;
        }

        .dash-pipeline-label {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #1E293B;
          white-space: nowrap;
        }

        .dash-pipeline-arrow {
          color: #CBD5E1;
          flex-shrink: 0;
        }

        .dash-pipeline-example {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 10px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          font-size: 0.78125rem;
          color: #475569;
          flex-wrap: wrap;
        }

        .dash-pipeline-example-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* RESPONSIVE LAYOUT FOR DASHBOARD */
        @media (max-width: 1280px) {
          .dash-kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .dash-row-2-grid {
            grid-template-columns: 1fr;
          }
          .dash-row-3-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .dash-kpi-grid {
            grid-template-columns: 1fr;
          }
          .dash-header-sticky-wrapper {
            padding-top: 12px;
            padding-bottom: 8px;
            margin-bottom: 6px;
          }
          .dashboard-header-bar {
            flex-direction: column;
            align-items: flex-start;
            padding: 14px 16px;
            gap: 14px;
          }
          .dash-header-right {
            width: 100%;
            flex-wrap: wrap;
          }
          .dash-search-box {
            width: 100%;
          }
          .dash-pipeline-header {
            flex-direction: column;
            align-items: flex-start;
          }
        }

        /* TOPBAR FOR SUBPAGES */
        .laundry-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding-bottom: 20px;
          margin-bottom: 20px;
          border-bottom: 1px solid #E5ECEE;
        }

        .topbar-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .mobile-hamburger-btn {
          display: none;
          background: #FFFFFF;
          border: 1px solid #E5ECEE;
          border-radius: 10px;
          padding: 7px;
          cursor: pointer;
          color: #334155;
        }

        .topbar-kicker {
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #0F766E;
        }

        .topbar-heading {
          font-size: 1.375rem;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -0.02em;
          line-height: 1.2;
          margin: 0;
        }

        .topbar-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .topbar-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8125rem;
          font-weight: 600;
          padding: 7px 12px;
          border-radius: 9px;
          border: 1px solid #CBD5E1;
          background: #FFFFFF;
          color: #334155;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .topbar-btn:hover {
          background: #F8FAFC;
          border-color: #94A3B8;
        }

        .topbar-icon-btn {
          position: relative;
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          border-radius: 9px;
          padding: 8px;
          color: #334155;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .topbar-icon-btn:hover, .topbar-icon-btn.active {
          background: #EBF8F7;
          border-color: #0D7A75;
          color: #0D7A75;
        }

        .topbar-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #EF4444;
          color: #FFFFFF;
          font-size: 0.625rem;
          font-weight: 700;
          border-radius: 9999px;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }

        .topbar-user-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 10px 4px 4px;
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          border-radius: 9999px;
          cursor: pointer;
          transition: border-color 0.15s ease;
        }

        .topbar-user-pill:hover {
          border-color: #0D7A75;
        }

        .user-pill-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #0D7A75;
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.75rem;
        }

        .user-pill-name {
          font-size: 0.75rem;
          font-weight: 600;
          color: #1E293B;
        }

        /* PILL STYLE TABS FOR SUBPAGES */
        .laundry-pill-tabs {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 20px;
          padding-bottom: 2px;
        }

        .laundry-pill-tab {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 18px;
          border-radius: 9999px;
          font-size: 0.85rem;
          font-weight: 600;
          background: #F1F5F9;
          color: #475569;
          border: 1px solid transparent;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
          text-decoration: none;
        }

        .laundry-pill-tab:hover {
          background: #E2E8F0;
          color: #1E293B;
        }

        .laundry-pill-tab.active {
          background: #0B4F47;
          color: #FFFFFF;
          border-color: #0B4F47;
          box-shadow: 0 2px 6px rgba(11, 79, 71, 0.2);
        }

        .laundry-pill-tab .tab-count {
          opacity: 0.95;
          font-weight: 600;
        }

        /* ========================================================
           INCOMING ORDERS PAGE STYLES (Matching Image 1)
           ======================================================== */
        .incoming-main-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
          width: 100%;
        }

        .incoming-main-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 290px;
          gap: 22px;
          align-items: start;
          width: 100%;
        }

        .incoming-orders-column {
          display: flex;
          flex-direction: column;
          gap: 14px;
          min-width: 0;
        }

        /* Filter Pills Bar & Sort Dropdown */
        .incoming-filter-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          padding: 2px 0 6px;
        }

        .incoming-filter-tabs {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .incoming-tab-btn {
          padding: 6px 16px;
          border-radius: 8px;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          border: 1px solid #E2E8F0;
          background: #FFFFFF;
          color: #475569;
        }

        .incoming-tab-btn:hover {
          background: #F8FAFC;
          color: #1E293B;
        }

        .incoming-tab-btn.active {
          background: #0B4F47;
          color: #FFFFFF;
          border-color: #0B4F47;
          box-shadow: 0 1px 4px rgba(11, 79, 71, 0.2);
        }

        .incoming-tab-btn.express {
          border-color: #FECDD3;
          color: #E11D48;
        }

        .incoming-tab-btn.express:hover {
          background: #FFF1F2;
        }

        .incoming-tab-btn.express.active {
          background: #E11D48;
          color: #FFFFFF;
          border-color: #E11D48;
          box-shadow: 0 1px 4px rgba(225, 29, 72, 0.2);
        }

        .incoming-tab-btn.standard {
          border-color: #E2E8F0;
          color: #334155;
        }

        .incoming-tab-btn.standard:hover {
          background: #F1F5F9;
        }

        .incoming-tab-btn.standard.active {
          background: #0B4F47;
          color: #FFFFFF;
          border-color: #0B4F47;
        }

        .incoming-sort-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .incoming-sort-label {
          font-size: 0.78rem;
          color: #64748B;
          font-weight: 500;
        }

        /* Detailed Collapsible Order Card */
        .incoming-order-card {
          background: #FFFFFF;
          border: 1px solid #E5ECEE;
          border-radius: 16px;
          padding: 16px 20px;
          transition: all 0.18s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }

        .incoming-order-card:hover {
          border-color: #CBD5E1;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
        }

        .incoming-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          cursor: pointer;
          user-select: none;
        }

        .incoming-card-left {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .incoming-badge-express {
          background: #EF4444;
          color: #FFFFFF;
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          padding: 4px 10px;
          border-radius: 9999px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .incoming-badge-standard {
          background: #E6F7F5;
          color: #0D9488;
          border: 1px solid #99F6E4;
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          padding: 4px 10px;
          border-radius: 9999px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .incoming-order-id {
          font-size: 0.95rem;
          font-weight: 700;
          color: #0F172A;
          letter-spacing: -0.01em;
        }

        .incoming-customer-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .incoming-cust-icon {
          color: #64748B;
        }

        .incoming-cust-name {
          font-size: 0.825rem;
          font-weight: 600;
          color: #1E293B;
        }

        .incoming-cust-phone {
          font-size: 0.75rem;
          color: #64748B;
          font-weight: 400;
        }

        .incoming-meta-item {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75rem;
          color: #64748B;
          font-weight: 500;
        }

        .incoming-card-right {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }

        .incoming-status-pill {
          font-size: 0.72rem;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: 9999px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }

        .incoming-status-pill.in_progress {
          background: #FFF1F2;
          color: #E11D48;
          border: 1px solid #FFE4E6;
        }

        .incoming-status-pill.processing {
          background: #EFF6FF;
          color: #2563EB;
          border: 1px solid #DBEAFE;
        }

        .incoming-status-pill.pending {
          background: #FFFBEB;
          color: #D97706;
          border: 1px solid #FEF3C7;
        }

        .incoming-status-pill.received {
          background: #F0FDF4;
          color: #16A34A;
          border: 1px solid #DCFCE7;
        }

        .incoming-chevron-btn {
          background: transparent;
          border: none;
          color: #64748B;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 6px;
          transition: background 0.15s;
        }

        .incoming-chevron-btn:hover {
          background: #F1F5F9;
          color: #0F172A;
        }

        /* Card Body */
        .incoming-card-body {
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px solid #F1F5F9;
        }

        .incoming-conflict-alert {
          background: #FFFBEB;
          border: 1px solid #FDE68A;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 0.75rem;
          color: #B45309;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          cursor: pointer;
          transition: background 0.15s;
        }

        .incoming-conflict-alert:hover {
          background: #FEF3C7;
        }

        .incoming-card-grid {
          display: grid;
          grid-template-columns: 1.2fr 1.3fr 2.4fr 1.1fr;
          gap: 16px;
          align-items: start;
        }

        .incoming-col-header {
          font-size: 0.68rem;
          font-weight: 600;
          color: #94A3B8;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 8px;
        }

        .incoming-col-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .incoming-item-name {
          font-size: 0.8rem;
          font-weight: 600;
          color: #1E293B;
          line-height: 1.4;
          min-height: 22px;
          display: flex;
          align-items: center;
        }

        .incoming-services-row {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          min-height: 22px;
          align-items: center;
        }

        .incoming-service-pill {
          background: #E0F2FE;
          color: #0284C7;
          border: 1px solid #BAE6FD;
          border-radius: 6px;
          font-size: 0.7rem;
          font-weight: 600;
          padding: 2px 8px;
          white-space: nowrap;
        }

        .incoming-task-chain {
          display: flex;
          align-items: center;
          gap: 5px;
          flex-wrap: wrap;
          min-height: 22px;
        }

        .incoming-task-node {
          font-size: 0.72rem;
          color: #475569;
          font-weight: 500;
        }

        .incoming-task-arrow {
          font-size: 0.72rem;
          color: #94A3B8;
        }

        .incoming-progress-wrap {
          margin-bottom: 8px;
        }

        .incoming-progress-track {
          background: #E2E8F0;
          height: 6px;
          border-radius: 9999px;
          overflow: hidden;
          margin-bottom: 4px;
        }

        .incoming-progress-fill {
          background: #0D9488;
          height: 100%;
          border-radius: 9999px;
          transition: width 0.3s ease;
        }

        .incoming-progress-text {
          font-size: 0.7rem;
          color: #64748B;
          font-weight: 500;
          text-align: right;
        }

        .incoming-view-btn {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 5px 12px;
          font-size: 0.72rem;
          font-weight: 600;
          color: #334155;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          transition: all 0.15s;
          width: 100%;
          justify-content: center;
        }

        .incoming-view-btn:hover {
          background: #F8FAFC;
          border-color: #CBD5E1;
          color: #0F766E;
        }

        /* Sidebar Column */
        .incoming-sidebar-column {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .incoming-sidebar-card {
          background: #FFFFFF;
          border: 1px solid #E5ECEE;
          border-radius: 16px;
          padding: 18px 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }

        .incoming-card-header-line {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .incoming-sidebar-title {
          font-size: 0.88rem;
          font-weight: 700;
          color: #0F172A;
          margin: 0;
        }

        .incoming-clear-btn {
          font-size: 0.75rem;
          color: #0D9488;
          font-weight: 600;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
        }

        .incoming-clear-btn:hover {
          text-decoration: underline;
        }

        .incoming-filter-fields {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .incoming-field-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .incoming-field-label {
          font-size: 0.72rem;
          color: #64748B;
          font-weight: 600;
        }

        .incoming-select-wrap {
          position: relative;
          width: 100%;
        }

        .incoming-select-input {
          width: 100%;
          appearance: none;
          -webkit-appearance: none;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 7px 30px 7px 12px;
          font-size: 0.78rem;
          font-weight: 500;
          color: #1E293B;
          cursor: pointer;
          outline: none;
          transition: border-color 0.15s;
        }

        .incoming-select-input:focus {
          border-color: #0D9488;
        }

        .incoming-select-arrow {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          color: #64748B;
        }

        /* Service Summary List */
        .incoming-summary-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .incoming-summary-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 10px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
          border: 1px solid transparent;
        }

        .incoming-summary-row:hover {
          background: #F8FAFC;
        }

        .incoming-summary-row.active {
          background: #E6F4F2;
          border-color: #99F6E4;
        }

        .incoming-summary-row.active .incoming-summary-name {
          color: #0F766E;
          font-weight: 700;
        }

        .incoming-summary-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .incoming-summary-icon-box {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .incoming-summary-icon-box.teal {
          background: #E6F7F5;
          color: #0D9488;
        }

        .incoming-summary-icon-box.blue {
          background: #EFF6FF;
          color: #2563EB;
        }

        .incoming-summary-icon-box.purple {
          background: #F3E8FF;
          color: #7C3AED;
        }

        .incoming-summary-icon-box.orange {
          background: #FFF7ED;
          color: #EA580C;
        }

        .incoming-summary-icon-box.red {
          background: #FFF1F2;
          color: #E11D48;
        }

        .incoming-summary-name {
          font-size: 0.8rem;
          font-weight: 500;
          color: #334155;
        }

        .incoming-summary-count {
          font-size: 0.85rem;
          font-weight: 700;
          color: #0F172A;
        }

        /* Task Merging Rules Card */
        .incoming-task-rules-card {
          background: #F0FDF4;
          border: 1px solid #DCFCE7;
          border-radius: 16px;
          padding: 16px 18px;
        }

        .incoming-rules-desc {
          font-size: 0.72rem;
          color: #374151;
          line-height: 1.45;
          margin-top: 8px;
          margin-bottom: 10px;
        }

        .incoming-rules-chain {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 4px;
        }

        .incoming-empty-state {
          background: #FFFFFF;
          border: 1px dashed #CBD5E1;
          border-radius: 16px;
          padding: 40px 20px;
          text-align: center;
        }

        /* Responsive Breakpoints for Incoming Orders */
        @media (max-width: 1200px) {
          .incoming-main-grid {
            grid-template-columns: 1fr;
          }

          .incoming-sidebar-column {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: 16px;
          }
        }

        @media (max-width: 768px) {
          .incoming-card-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .incoming-card-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .incoming-card-right {
            width: 100%;
            justify-content: space-between;
          }
        }

        /* ========================================================
           PROCESSING PAGE STYLES (Matching Image 1)
           ======================================================== */
        .proc-main-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
          width: 100%;
        }

        /* ROW 1: 7 STAGE KPI CARDS */
        .proc-kpi-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 12px;
          width: 100%;
        }

        .proc-kpi-card {
          background: #FFFFFF;
          border: 1px solid #E5ECEE;
          border-radius: 14px;
          padding: 12px 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.18s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
          min-width: 0;
        }

        .proc-kpi-card:hover {
          transform: translateY(-2px);
          border-color: #0F766E;
          box-shadow: 0 4px 12px rgba(15, 118, 110, 0.07);
        }

        .proc-kpi-card.active {
          border-color: #0F766E;
          background: #F0FDFA;
        }

        .proc-kpi-icon-box {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .proc-kpi-icon-box.blue {
          background: #E0F2FE;
          color: #0284C7;
        }

        .proc-kpi-icon-box.purple {
          background: #F3E8FF;
          color: #9333EA;
        }

        .proc-kpi-icon-box.amber {
          background: #FEF3C7;
          color: #D97706;
        }

        .proc-kpi-icon-box.teal {
          background: #CCFBF1;
          color: #0D9488;
        }

        .proc-kpi-icon-box.cyan {
          background: #E0F2FE;
          color: #0284C7;
        }

        .proc-kpi-icon-box.pink {
          background: #FFE4E6;
          color: #E11D48;
        }

        .proc-kpi-info {
          min-width: 0;
          flex: 1;
        }

        .proc-kpi-label {
          font-size: 0.72rem;
          color: #64748B;
          font-weight: 500;
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .proc-kpi-val-row {
          display: flex;
          align-items: baseline;
          gap: 4px;
        }

        .proc-kpi-val {
          font-size: 1.15rem;
          font-weight: 700;
          color: #0F172A;
          line-height: 1.2;
        }

        .proc-kpi-pct {
          font-size: 0.68rem;
          color: #94A3B8;
          font-weight: 500;
        }

        /* ROW 2: STAGE FILTER PILLS BAR */
        .proc-filter-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          padding: 2px 0 4px;
        }

        .proc-tab-btn {
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          border: 1px solid #E2E8F0;
          background: #FFFFFF;
          color: #475569;
        }

        .proc-tab-btn:hover {
          background: #F8FAFC;
          color: #1E293B;
        }

        .proc-tab-btn.active {
          background: #0B4F47;
          color: #FFFFFF;
          border-color: #0B4F47;
          box-shadow: 0 1px 4px rgba(11, 79, 71, 0.2);
        }

        /* ROW 3: 2-COLUMN MAIN CONTENT */
        .proc-main-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 290px;
          gap: 22px;
          align-items: start;
          width: 100%;
        }

        .proc-queues-col {
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-width: 0;
        }

        .proc-section-card {
          background: #FFFFFF;
          border: 1px solid #E5ECEE;
          border-radius: 16px;
          padding: 18px 22px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }

        .proc-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .proc-section-title-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .proc-section-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .proc-section-icon-wrap.blue {
          color: #0284C7;
        }

        .proc-section-icon-wrap.purple {
          color: #9333EA;
        }

        .proc-section-icon-wrap.amber {
          color: #D97706;
        }

        .proc-section-icon-wrap.teal {
          color: #0D9488;
        }

        .proc-section-icon-wrap.cyan {
          color: #0284C7;
        }

        .proc-section-icon-wrap.pink {
          color: #E11D48;
        }

        .proc-section-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #0F172A;
          margin: 0;
        }

        .proc-section-badge {
          font-size: 0.72rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 9999px;
        }

        .proc-section-badge.blue {
          background: #E0F2FE;
          color: #0284C7;
        }

        .proc-section-badge.purple {
          background: #F3E8FF;
          color: #7C3AED;
        }

        .proc-section-badge.amber {
          background: #FEF3C7;
          color: #D97706;
        }

        .proc-section-badge.teal {
          background: #CCFBF1;
          color: #0D9488;
        }

        .proc-section-badge.cyan {
          background: #E0F2FE;
          color: #0284C7;
        }

        .proc-section-badge.pink {
          background: #FFE4E6;
          color: #E11D48;
        }

        .proc-view-all-link {
          font-size: 0.75rem;
          font-weight: 600;
          color: #0D9488;
          background: none;
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 0;
        }

        .proc-view-all-link:hover {
          text-decoration: underline;
        }

        /* Processing Table */
        .proc-table-wrap {
          overflow-x: auto;
          width: 100%;
        }

        .proc-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .proc-table th {
          font-size: 0.68rem;
          font-weight: 600;
          color: #94A3B8;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 8px 10px;
          border-bottom: 1px solid #F1F5F9;
        }

        .proc-table td {
          font-size: 0.8rem;
          color: #334155;
          padding: 12px 10px;
          border-bottom: 1px solid #F8FAFC;
          vertical-align: middle;
        }

        .proc-table tr:last-child td {
          border-bottom: none;
        }

        .proc-table-row {
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .proc-table-row:hover td {
          background: #F8FAFC;
        }

        .proc-order-id {
          font-weight: 700;
          color: #0F172A;
          white-space: nowrap;
        }

        .proc-cust-name {
          font-weight: 600;
          color: #1E293B;
          white-space: nowrap;
        }

        .proc-item-text {
          font-weight: 500;
          color: #334155;
          white-space: nowrap;
        }

        .proc-service-pill {
          background: #E0F2FE;
          color: #0284C7;
          border: 1px solid #BAE6FD;
          border-radius: 6px;
          font-size: 0.7rem;
          font-weight: 600;
          padding: 2px 8px;
          white-space: nowrap;
        }

        .proc-task-pill {
          font-size: 0.7rem;
          font-weight: 600;
          padding: 3px 10px;
          border-radius: 9999px;
          display: inline-block;
          white-space: nowrap;
        }

        .proc-task-pill.blue {
          background: #E0F2FE;
          color: #0284C7;
          border: 1px solid #BAE6FD;
        }

        .proc-task-pill.purple {
          background: #F3E8FF;
          color: #7C3AED;
          border: 1px solid #E9D5FF;
        }

        .proc-task-pill.amber {
          background: #FEF3C7;
          color: #D97706;
          border: 1px solid #FDE68A;
        }

        .proc-task-pill.teal {
          background: #CCFBF1;
          color: #0D9488;
          border: 1px solid #99F6E4;
        }

        .proc-task-pill.cyan {
          background: #E0F2FE;
          color: #0284C7;
          border: 1px solid #BAE6FD;
        }

        .proc-task-pill.pink {
          background: #FFE4E6;
          color: #E11D48;
          border: 1px solid #FECDD3;
        }

        .proc-progress-cell {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 130px;
        }

        .proc-progress-track {
          flex: 1;
          height: 5px;
          background: #E2E8F0;
          border-radius: 9999px;
          overflow: hidden;
        }

        .proc-progress-fill {
          height: 100%;
          background: #0D9488;
          border-radius: 9999px;
          transition: width 0.3s ease;
        }

        .proc-progress-ratio {
          font-size: 0.7rem;
          color: #64748B;
          font-weight: 500;
          min-width: 24px;
          text-align: right;
        }

        .proc-action-cell {
          display: flex;
          align-items: center;
          gap: 6px;
          justify-content: flex-end;
        }

        .proc-action-btn {
          background: #0D9488;
          color: #FFFFFF;
          border: none;
          border-radius: 6px;
          padding: 5px 12px;
          font-size: 0.72rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s ease;
          white-space: nowrap;
        }

        .proc-action-btn:hover {
          background: #0B7A70;
        }

        .proc-action-arrow {
          color: #94A3B8;
          cursor: pointer;
        }

        /* Right Sidebar Column */
        .proc-sidebar-col {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .proc-sidebar-card {
          background: #FFFFFF;
          border: 1px solid #E5ECEE;
          border-radius: 16px;
          padding: 18px 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }

        .proc-card-header-line {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .proc-sidebar-title {
          font-size: 0.88rem;
          font-weight: 700;
          color: #0F172A;
          margin: 0;
        }

        .proc-clear-btn {
          font-size: 0.75rem;
          color: #0D9488;
          font-weight: 600;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
        }

        .proc-clear-btn:hover {
          text-decoration: underline;
        }

        .proc-filter-fields {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .proc-field-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .proc-field-label {
          font-size: 0.72rem;
          color: #64748B;
          font-weight: 600;
        }

        .proc-select-wrap {
          position: relative;
          width: 100%;
        }

        .proc-select-input {
          width: 100%;
          appearance: none;
          -webkit-appearance: none;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 7px 30px 7px 12px;
          font-size: 0.78rem;
          font-weight: 500;
          color: #1E293B;
          cursor: pointer;
          outline: none;
          transition: border-color 0.15s;
        }

        .proc-select-input:focus {
          border-color: #0D9488;
        }

        .proc-select-arrow {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          color: #64748B;
        }

        /* Processing Summary List */
        .proc-summary-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .proc-summary-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 4px 0;
        }

        .proc-summary-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .proc-summary-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          display: inline-block;
        }

        .proc-summary-name {
          font-size: 0.8rem;
          font-weight: 500;
          color: #334155;
        }

        .proc-summary-count {
          font-size: 0.85rem;
          font-weight: 700;
          color: #0F172A;
        }

        /* Task Flow Card */
        .proc-flow-card {
          background: #F0FDF4;
          border: 1px solid #DCFCE7;
          border-radius: 16px;
          padding: 16px 18px;
        }

        .proc-flow-desc {
          font-size: 0.72rem;
          color: #374151;
          line-height: 1.45;
          margin-top: 8px;
          margin-bottom: 12px;
        }

        .proc-flow-link {
          font-size: 0.75rem;
          color: #0D9488;
          font-weight: 700;
          background: none;
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 0;
        }

        .proc-flow-link:hover {
          text-decoration: underline;
        }

        /* Responsive Breakpoints for Processing */
        @media (max-width: 1400px) {
          .proc-kpi-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        @media (max-width: 1200px) {
          .proc-main-grid {
            grid-template-columns: 1fr;
          }

          .proc-sidebar-col {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: 16px;
          }
        }

        @media (max-width: 768px) {
          .proc-kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        /* ========================================================
           QUALITY CHECK PAGE STYLES (Matching Image 1)
           ======================================================== */
        .qc-title-badge {
          background: #E6F7F5;
          color: #0D9488;
          font-size: 0.85rem;
          font-weight: 700;
          padding: 1px 9px;
          border-radius: 9999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #99F6E4;
        }

        .qc-main-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
          width: 100%;
        }

        /* Filter Pills Bar */
        .qc-filter-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 2px;
        }

        .qc-tab-btn {
          padding: 6px 16px;
          border-radius: 8px;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          border: 1px solid #E2E8F0;
          background: #FFFFFF;
          color: #475569;
        }

        .qc-tab-btn:hover {
          background: #F8FAFC;
          color: #1E293B;
        }

        .qc-tab-btn.active {
          background: #0B4F47;
          color: #FFFFFF;
          border-color: #0B4F47;
          box-shadow: 0 1px 4px rgba(11, 79, 71, 0.2);
        }

        /* 2-Column Main Grid */
        .qc-main-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 290px;
          gap: 22px;
          align-items: start;
          width: 100%;
        }

        .qc-orders-col {
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-width: 0;
        }

        /* Detailed 3-Section QC Order Card */
        .qc-order-card {
          background: #FFFFFF;
          border: 1px solid #E5ECEE;
          border-radius: 16px;
          padding: 20px 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
          transition: all 0.18s ease;
          display: grid;
          grid-template-columns: 200px minmax(0, 1fr) 190px;
          gap: 24px;
          align-items: start;
        }

        .qc-order-card:hover {
          border-color: #CBD5E1;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
        }

        /* 1. Left Section: Order Meta */
        .qc-card-left {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .qc-express-badge {
          background: #EF4444;
          color: #FFFFFF;
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          padding: 3px 8px;
          border-radius: 9999px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          width: fit-content;
          margin-bottom: 2px;
        }

        .qc-order-id {
          font-size: 1.05rem;
          font-weight: 700;
          color: #0F172A;
          letter-spacing: -0.01em;
        }

        .qc-datetime {
          font-size: 0.72rem;
          color: #64748B;
          font-weight: 500;
        }

        .qc-customer-group {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          margin-top: 4px;
        }

        .qc-cust-icon {
          color: #64748B;
          margin-top: 2px;
          flex-shrink: 0;
        }

        .qc-cust-name {
          font-size: 0.825rem;
          font-weight: 600;
          color: #1E293B;
          line-height: 1.2;
        }

        .qc-cust-phone {
          font-size: 0.75rem;
          color: #64748B;
          font-weight: 400;
          line-height: 1.2;
          margin-top: 2px;
        }

        .qc-meta-footer {
          font-size: 0.75rem;
          color: #64748B;
          font-weight: 500;
          margin-top: 8px;
        }

        /* 2. Middle Section: Items list with Services & Plan */
        .qc-card-middle {
          display: flex;
          flex-direction: column;
          gap: 14px;
          border-left: 1px solid #F1F5F9;
          border-right: 1px solid #F1F5F9;
          padding: 0 20px;
        }

        .qc-items-header {
          font-size: 0.82rem;
          font-weight: 700;
          color: #0F172A;
          margin-bottom: 2px;
        }

        .qc-item-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .qc-item-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }

        .qc-item-name-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .qc-item-name {
          font-size: 0.8rem;
          font-weight: 600;
          color: #1E293B;
        }

        .qc-service-pill {
          background: #E0F2FE;
          color: #0284C7;
          border: 1px solid #BAE6FD;
          border-radius: 6px;
          font-size: 0.68rem;
          font-weight: 600;
          padding: 2px 7px;
          white-space: nowrap;
        }

        .qc-item-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.7rem;
          font-weight: 600;
          padding: 3px 9px;
          border-radius: 9999px;
          cursor: pointer;
          transition: opacity 0.15s;
        }

        .qc-item-status-pill:hover {
          opacity: 0.85;
        }

        .qc-item-status-pill.mint {
          background: #E6F7F5;
          color: #0D9488;
          border: 1px solid #99F6E4;
        }

        .qc-item-status-pill.amber {
          background: #FEF3C7;
          color: #D97706;
          border: 1px solid #FDE68A;
        }

        .qc-item-plan {
          font-size: 0.72rem;
          color: #64748B;
          font-weight: 500;
          margin-left: 14px;
        }

        /* 3. Right Section: Overall Status & Progress */
        .qc-card-right {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 100%;
          min-height: 120px;
          gap: 14px;
        }

        .qc-overall-status-pill {
          align-self: flex-end;
          font-size: 0.72rem;
          font-weight: 600;
          padding: 3px 12px;
          border-radius: 9999px;
        }

        .qc-overall-status-pill.in_qc {
          background: #E6F7F5;
          color: #0D9488;
          border: 1px solid #99F6E4;
        }

        .qc-overall-status-pill.pending {
          background: #FEF3C7;
          color: #D97706;
          border: 1px solid #FDE68A;
        }

        .qc-progress-block {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .qc-progress-label {
          font-size: 0.72rem;
          color: #64748B;
          font-weight: 500;
        }

        .qc-progress-track {
          height: 6px;
          background: #E2E8F0;
          border-radius: 9999px;
          overflow: hidden;
        }

        .qc-progress-fill {
          height: 100%;
          background: #0D9488;
          border-radius: 9999px;
          transition: width 0.3s ease;
        }

        .qc-progress-text {
          font-size: 0.7rem;
          color: #64748B;
          font-weight: 500;
          text-align: right;
        }

        .qc-details-btn {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 7px 16px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #0D9488;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: center;
          width: 100%;
        }

        .qc-details-btn:hover {
          background: #F8FAFC;
          border-color: #CBD5E1;
          color: #0B7A70;
        }

        /* Right Sidebar Column */
        .qc-sidebar-col {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .qc-sidebar-card {
          background: #FFFFFF;
          border: 1px solid #E5ECEE;
          border-radius: 16px;
          padding: 18px 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }

        .qc-card-header-line {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .qc-sidebar-title {
          font-size: 0.88rem;
          font-weight: 700;
          color: #0F172A;
          margin: 0;
        }

        .qc-clear-btn {
          font-size: 0.75rem;
          color: #0D9488;
          font-weight: 600;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
        }

        .qc-clear-btn:hover {
          text-decoration: underline;
        }

        .qc-filter-fields {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .qc-field-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .qc-field-label {
          font-size: 0.72rem;
          color: #64748B;
          font-weight: 600;
        }

        .qc-select-wrap {
          position: relative;
          width: 100%;
        }

        .qc-select-input {
          width: 100%;
          appearance: none;
          -webkit-appearance: none;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 7px 30px 7px 12px;
          font-size: 0.78rem;
          font-weight: 500;
          color: #1E293B;
          cursor: pointer;
          outline: none;
          transition: border-color 0.15s;
        }

        .qc-select-input:focus {
          border-color: #0D9488;
        }

        .qc-select-arrow {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          color: #64748B;
        }

        /* QC Summary List */
        .qc-summary-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .qc-summary-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 4px 0;
        }

        .qc-summary-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .qc-summary-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          display: inline-block;
        }

        .qc-summary-name {
          font-size: 0.8rem;
          font-weight: 500;
          color: #334155;
        }

        .qc-summary-count {
          font-size: 0.85rem;
          font-weight: 700;
          color: #0F172A;
        }

        /* QC Rules Card */
        .qc-rules-card {
          background: #F0FDF4;
          border: 1px solid #DCFCE7;
          border-radius: 16px;
          padding: 18px 20px;
        }

        .qc-rules-subtitle {
          font-size: 0.75rem;
          font-weight: 600;
          color: #065F46;
          margin-top: 8px;
          margin-bottom: 6px;
        }

        .qc-rules-list {
          list-style: none;
          padding: 0;
          margin: 0 0 14px 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 0.72rem;
          color: #374151;
        }

        .qc-rules-link {
          font-size: 0.75rem;
          color: #0D9488;
          font-weight: 700;
          background: none;
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 0;
        }

        .qc-rules-link:hover {
          text-decoration: underline;
        }

        /* Responsive Breakpoints for Quality Check */
        @media (max-width: 1200px) {
          .qc-main-grid {
            grid-template-columns: 1fr;
          }

          .qc-sidebar-col {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: 16px;
          }
        }

        @media (max-width: 900px) {
          .qc-order-card {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .qc-card-middle {
            border-left: none;
            border-right: none;
            border-top: 1px solid #F1F5F9;
            border-bottom: 1px solid #F1F5F9;
            padding: 14px 0;
          }
        }

        /* ========================================================
           READY FOR DELIVERY STYLES (Matching Image 1)
           ======================================================== */
        .deliv-topbar-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .deliv-header-left {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
        }

        .deliv-top-search {
          max-width: 520px;
          width: 100%;
        }

        .deliv-main-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
          width: 100%;
        }

        /* Title Row */
        .deliv-page-title-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .deliv-page-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -0.025em;
          margin: 0;
          line-height: 1.2;
        }

        .deliv-title-badge {
          background: #E6F7F5;
          color: #0D9488;
          font-size: 0.85rem;
          font-weight: 700;
          padding: 1px 9px;
          border-radius: 9999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #99F6E4;
        }

        .deliv-page-subtitle {
          font-size: 0.8125rem;
          color: #64748B;
          margin: 0;
          font-weight: 400;
        }

        /* KPI Stats Grid (4 Cards) */
        .deliv-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          width: 100%;
        }

        .deliv-kpi-card {
          background: #FFFFFF;
          border: 1px solid #E5ECEE;
          border-radius: 16px;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: all 0.18s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }

        .deliv-kpi-card:hover {
          transform: translateY(-2px);
          border-color: #0F766E;
          box-shadow: 0 6px 16px rgba(15, 118, 110, 0.07);
        }

        .deliv-kpi-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .deliv-kpi-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .deliv-kpi-icon-box.teal {
          background: #E6F7F5;
          border: 1px solid #C8ECE7;
          color: #0D9488;
        }

        .deliv-kpi-icon-box.blue {
          background: #EFF6FF;
          border: 1px solid #DBEAFE;
          color: #2563EB;
        }

        .deliv-kpi-icon-box.green {
          background: #ECFDF5;
          border: 1px solid #A7F3D0;
          color: #059669;
        }

        .deliv-kpi-icon-box.purple {
          background: #F3E8FF;
          border: 1px solid #E9D5FF;
          color: #7C3AED;
        }

        .deliv-kpi-label {
          font-size: 0.75rem;
          font-weight: 500;
          color: #64748B;
          margin-bottom: 2px;
        }

        .deliv-kpi-val-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }

        .deliv-kpi-value {
          font-size: 1.5rem;
          font-weight: 800;
          color: #0F172A;
          line-height: 1;
        }

        .deliv-kpi-trend {
          font-size: 0.72rem;
          font-weight: 600;
        }

        .deliv-kpi-trend.teal {
          color: #0D9488;
          background: #E6F7F5;
          padding: 1px 6px;
          border-radius: 4px;
        }

        .deliv-kpi-trend.muted {
          color: #64748B;
        }

        .deliv-kpi-arrow {
          color: #94A3B8;
          flex-shrink: 0;
          transition: transform 0.15s ease;
        }

        .deliv-kpi-card:hover .deliv-kpi-arrow {
          transform: translateX(3px);
          color: #0F766E;
        }

        /* Sort Row */
        .deliv-sort-row {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          margin-top: -6px;
        }

        .deliv-sort-label {
          font-size: 0.8rem;
          color: #64748B;
          font-weight: 500;
        }

        .deliv-sort-select-wrap {
          position: relative;
        }

        .deliv-sort-select {
          appearance: none;
          -webkit-appearance: none;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 5px 28px 5px 12px;
          font-size: 0.78rem;
          font-weight: 600;
          color: #1E293B;
          cursor: pointer;
          outline: none;
        }

        .deliv-sort-select:focus {
          border-color: #0D9488;
        }

        .deliv-select-arrow {
          position: absolute;
          right: 9px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          color: #64748B;
        }

        /* 2-Column Main Layout */
        .deliv-main-grid {
          display: grid;
          grid-template-columns: 1fr 310px;
          gap: 20px;
          width: 100%;
          align-items: start;
        }

        /* Left Column: Order Cards */
        .deliv-orders-col {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .deliv-order-card {
          background: #FFFFFF;
          border: 1px solid #E5ECEE;
          border-radius: 16px;
          padding: 18px 20px;
          display: grid;
          grid-template-columns: 180px 1fr 220px;
          gap: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
          transition: all 0.15s ease;
        }

        .deliv-order-card:hover {
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
          border-color: #CBD5E1;
        }

        /* 1. Left Section */
        .deliv-card-left {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .deliv-express-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #FEE2E2;
          color: #EF4444;
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.04em;
          padding: 2px 7px;
          border-radius: 9999px;
          margin-bottom: 6px;
          align-self: flex-start;
        }

        .deliv-order-id {
          font-size: 1.05rem;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -0.01em;
          line-height: 1.2;
        }

        .deliv-datetime {
          font-size: 0.72rem;
          color: #64748B;
          margin-top: 2px;
          margin-bottom: 12px;
        }

        .deliv-customer-group {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          margin-bottom: 12px;
        }

        .deliv-cust-icon {
          color: #64748B;
          margin-top: 2px;
          flex-shrink: 0;
        }

        .deliv-cust-name {
          font-size: 0.825rem;
          font-weight: 600;
          color: #1E293B;
          line-height: 1.2;
        }

        .deliv-cust-phone {
          font-size: 0.725rem;
          color: #64748B;
          margin-top: 2px;
          line-height: 1.2;
        }

        .deliv-meta-footer {
          font-size: 0.73rem;
          color: #64748B;
          font-weight: 500;
          margin-top: auto;
        }

        /* 2. Middle Section */
        .deliv-card-mid {
          display: flex;
          flex-direction: column;
          border-left: 1px solid #F1F5F9;
          border-right: 1px solid #F1F5F9;
          padding: 0 18px;
        }

        .deliv-items-header-line {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .deliv-items-title {
          font-size: 0.82rem;
          font-weight: 700;
          color: #0F172A;
        }

        .deliv-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.7rem;
          font-weight: 600;
          padding: 3px 9px;
          border-radius: 9999px;
        }

        .deliv-status-pill.mint {
          background: #E6F7F5;
          color: #0D9488;
          border: 1px solid #99F6E4;
        }

        .deliv-status-pill.blue {
          background: #EFF6FF;
          color: #2563EB;
          border: 1px solid #BFDBFE;
        }

        .deliv-items-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .deliv-item-row {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .deliv-item-top {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .deliv-item-name {
          font-size: 0.8rem;
          font-weight: 600;
          color: #1E293B;
        }

        .deliv-tags-wrap {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .deliv-service-tag {
          background: #EFF6FF;
          color: #2563EB;
          border: 1px solid #DBEAFE;
          border-radius: 9999px;
          font-size: 0.675rem;
          font-weight: 600;
          padding: 1px 8px;
          white-space: nowrap;
        }

        .deliv-item-plan {
          font-size: 0.7rem;
          color: #64748B;
        }

        /* 3. Right Section */
        .deliv-card-right {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding-left: 4px;
        }

        .deliv-right-header {
          display: flex;
          justify-content: flex-end;
        }

        .deliv-card-chevron {
          color: #94A3B8;
          cursor: pointer;
          transition: color 0.15s, transform 0.15s;
        }

        .deliv-card-chevron:hover {
          color: #0D9488;
          transform: translateX(2px);
        }

        .deliv-stepper {
          display: flex;
          flex-direction: column;
          margin: 6px 0 14px;
        }

        .deliv-step-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .deliv-step-icon.green {
          color: #059669;
          flex-shrink: 0;
        }

        .deliv-step-icon.blue {
          color: #2563EB;
          flex-shrink: 0;
        }

        .deliv-step-icon.clock {
          color: #0D9488;
          flex-shrink: 0;
        }

        .deliv-step-label.green {
          font-size: 0.74rem;
          font-weight: 600;
          color: #059669;
        }

        .deliv-step-label.blue {
          font-size: 0.74rem;
          font-weight: 600;
          color: #2563EB;
        }

        .deliv-step-label.est {
          font-size: 0.72rem;
          font-weight: 500;
          color: #0D9488;
        }

        .deliv-step-line {
          width: 1.5px;
          height: 12px;
          background: #CBD5E1;
          margin-left: 7px;
          margin-top: 2px;
          margin-bottom: 2px;
        }

        .deliv-btn-dispatch {
          background: #0D9488;
          color: #FFFFFF;
          border: none;
          border-radius: 8px;
          padding: 8px 14px;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s ease;
          width: 100%;
          text-align: center;
        }

        .deliv-btn-dispatch:hover {
          background: #0F766E;
        }

        .deliv-btn-tracking {
          background: #0D9488;
          color: #FFFFFF;
          border: none;
          border-radius: 8px;
          padding: 8px 14px;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s ease;
          width: 100%;
          text-align: center;
        }

        .deliv-btn-tracking:hover {
          background: #0F766E;
        }

        /* Right Sidebar Column */
        .deliv-sidebar-col {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .deliv-sidebar-card {
          background: #FFFFFF;
          border: 1px solid #E5ECEE;
          border-radius: 16px;
          padding: 18px 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }

        .deliv-side-header-line {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .deliv-side-title-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .deliv-side-header-icon {
          color: #0F172A;
        }

        .deliv-side-header-with-badge {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
        }

        .deliv-icon-circle-teal {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #E6F7F5;
          color: #0D9488;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .deliv-side-title {
          font-size: 0.88rem;
          font-weight: 700;
          color: #0F172A;
          margin: 0;
        }

        .deliv-clear-btn {
          font-size: 0.75rem;
          color: #0D9488;
          font-weight: 600;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
        }

        .deliv-clear-btn:hover {
          text-decoration: underline;
        }

        .deliv-filter-fields {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .deliv-field-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .deliv-field-label {
          font-size: 0.72rem;
          color: #64748B;
          font-weight: 600;
        }

        .deliv-select-wrap {
          position: relative;
          width: 100%;
        }

        .deliv-input-lead-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #64748B;
          pointer-events: none;
        }

        .deliv-select-input {
          width: 100%;
          appearance: none;
          -webkit-appearance: none;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 7px 30px 7px 12px;
          font-size: 0.78rem;
          font-weight: 500;
          color: #1E293B;
          cursor: pointer;
          outline: none;
          transition: border-color 0.15s;
        }

        .deliv-select-input.with-lead-icon {
          padding-left: 32px;
        }

        .deliv-select-input:focus {
          border-color: #0D9488;
        }

        /* Summary List */
        .deliv-summary-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .deliv-summary-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 4px 0;
        }

        .deliv-summary-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .deliv-summary-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          display: inline-block;
        }

        .deliv-summary-dot.teal {
          background: #0D9488;
        }

        .deliv-summary-dot.blue {
          background: #2563EB;
        }

        .deliv-summary-dot.green {
          background: #10B981;
        }

        .deliv-summary-dot.purple {
          background: #A855F7;
        }

        .deliv-summary-name {
          font-size: 0.8rem;
          font-weight: 500;
          color: #334155;
        }

        .deliv-summary-count {
          font-size: 0.85rem;
          font-weight: 700;
          color: #0F172A;
        }

        /* Quick Actions Grid */
        .deliv-quick-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .deliv-quick-btn {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          padding: 12px 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
          color: #334155;
          font-size: 0.72rem;
          font-weight: 600;
          text-align: center;
        }

        .deliv-quick-btn:hover {
          background: #F8FAFC;
          border-color: #0D9488;
          color: #0D9488;
        }

        .deliv-quick-icon {
          color: #0D9488;
        }

        /* Delivery Guidelines Card */
        .deliv-guidelines-card {
          background: #EFF9F9;
          border: 1px solid #CCFBF1;
          border-radius: 16px;
          padding: 18px 20px;
        }

        .deliv-guidelines-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .deliv-guidelines-icon {
          color: #0D9488;
        }

        .deliv-guidelines-title {
          margin: 0;
          font-size: 0.85rem;
          font-weight: 700;
          color: #0F766E;
        }

        .deliv-guidelines-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 0.72rem;
          color: #374151;
        }

        .deliv-guidelines-list li {
          position: relative;
          padding-left: 12px;
        }

        .deliv-guidelines-list li::before {
          content: '•';
          position: absolute;
          left: 0;
          color: #0D9488;
          font-weight: bold;
        }

        .deliv-empty-state {
          text-align: center;
          padding: 48px 20px;
          background: #FFFFFF;
          border: 1px dashed #CBD5E1;
          border-radius: 16px;
        }

        .deliv-reset-link {
          font-size: 0.75rem;
          color: #0D9488;
          font-weight: 700;
          background: none;
          border: none;
          cursor: pointer;
          margin-top: 8px;
        }

        .deliv-reset-link:hover {
          text-decoration: underline;
        }

        /* Responsive Breakpoints for Ready for Delivery */
        @media (max-width: 1280px) {
          .deliv-kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 1200px) {
          .deliv-main-grid {
            grid-template-columns: 1fr;
          }

          .deliv-sidebar-col {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: 16px;
          }
        }

        @media (max-width: 900px) {
          .deliv-order-card {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .deliv-card-mid {
            border-left: none;
            border-right: none;
            border-top: 1px solid #F1F5F9;
            border-bottom: 1px solid #F1F5F9;
            padding: 14px 0;
          }
        }

        /* ========================================================
           ORDER HISTORY STYLES (Matching Image 2 Exactly)
           ======================================================== */
        .hist-main-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
          width: 100%;
        }

        /* ONE WHITE CARD (radius 24px, border 1px #e5e9ec) */
        .hist-table-card {
          background: #FFFFFF;
          border: 1px solid #E5E9EC;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
          width: 100%;
        }

        /* TOOLBAR */
        .hist-table-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid #EEF2F4;
          gap: 16px;
          flex-wrap: wrap;
        }

        /* Filter Chips */
        .hist-chips-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .hist-chip-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 18px;
          border-radius: 9999px;
          font-size: 0.82rem;
          font-weight: 600;
          border: 1px solid #E2E8F0;
          background: #FFFFFF;
          color: #334155;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .hist-chip-btn:hover {
          background: #F8FAFB;
          border-color: #CBD5E1;
        }

        .hist-chip-btn.active {
          background: #0B4F47;
          color: #FFFFFF;
          border-color: #0B4F47;
          box-shadow: 0 1px 3px rgba(11, 79, 71, 0.25);
        }

        /* Date Range Dropdown */
        .hist-date-range-wrap {
          position: relative;
          display: inline-flex;
        }

        .hist-date-range-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          background: #FFFFFF;
          color: #334155;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: border-color 0.15s ease;
        }

        .hist-date-range-wrap:hover .hist-date-range-btn {
          border-color: #0F766E;
        }

        .hist-date-select-hidden {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
          width: 100%;
          height: 100%;
        }

        /* Table Wrapper */
        .hist-table-responsive-wrap {
          width: 100%;
          overflow-x: auto;
        }

        .hist-table-min-width {
          min-width: 860px;
          width: 100%;
        }

        /* 7-Column Grid Row */
        .hist-grid-row {
          display: grid;
          grid-template-columns: 100px minmax(0, 1fr) minmax(0, 1.6fr) 140px 90px 120px 76px;
          column-gap: 24px;
          align-items: center;
          padding: 0 24px;
        }

        /* Header Row (Light grey #f8fafb, 11px uppercase labels) */
        .hist-table-header {
          background: #F8FAFB;
          height: 44px;
          border-bottom: 1px solid #EEF2F4;
        }

        .hist-th {
          font-size: 11px;
          font-weight: 700;
          color: #64748B;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: flex;
          align-items: center;
          user-select: none;
        }

        .hist-th.sortable {
          cursor: pointer;
          gap: 6px;
          transition: color 0.15s ease;
        }

        .hist-th.sortable:hover {
          color: #0F766E;
        }

        .hist-th.center {
          justify-content: center;
          text-align: center;
        }

        .hist-th.right {
          justify-content: flex-end;
        }

        .hist-sort-icon {
          color: #94A3B8;
          transition: color 0.15s ease;
        }

        .hist-sort-icon.active {
          color: #0F766E;
        }

        /* Table Body & Rows */
        .hist-table-body {
          display: flex;
          flex-direction: column;
        }

        .hist-table-row {
          height: 68px;
          border-top: 1px solid #EEF2F4;
          cursor: pointer;
          transition: background-color 0.12s ease;
        }

        .hist-table-row:first-child {
          border-top: none;
        }

        .hist-table-row:hover {
          background-color: #F8FAFB;
        }

        /* Col 1: ORDER ID */
        .hist-td-id {
          color: #0F766E;
          font-weight: 700;
          font-size: 0.88rem;
          cursor: pointer;
          transition: text-decoration 0.15s ease;
        }

        .hist-td-id:hover {
          text-decoration: underline;
        }

        /* Col 2: CUSTOMER */
        .hist-td-customer {
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow: hidden;
        }

        .hist-customer-name {
          font-size: 0.86rem;
          font-weight: 700;
          color: #0F172A;
          line-height: 1.25;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .hist-customer-phone {
          font-size: 0.74rem;
          color: #64748B;
          line-height: 1.2;
          white-space: nowrap;
        }

        /* Col 3: ITEMS & SERVICE */
        .hist-td-items {
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow: hidden;
        }

        .hist-items-text {
          font-size: 0.84rem;
          font-weight: 600;
          color: #1E293B;
          line-height: 1.25;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .hist-services-text {
          font-size: 0.74rem;
          color: #64748B;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Col 4: DATE */
        .hist-td-date {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .hist-date-main {
          font-size: 0.82rem;
          font-weight: 600;
          color: #1E293B;
          line-height: 1.2;
          white-space: nowrap;
        }

        .hist-date-sub {
          font-size: 0.72rem;
          color: #64748B;
          line-height: 1.2;
          white-space: nowrap;
        }

        /* Col 5: AMOUNT */
        .hist-td-amount {
          font-size: 0.95rem;
          font-weight: 800;
          color: #0F172A;
          text-align: center;
          white-space: nowrap;
        }

        /* Col 6: STATUS */
        .hist-td-status {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hist-status-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 96px;
          height: 28px;
          border-radius: 9999px;
          font-size: 0.72rem;
          font-weight: 600;
          text-align: center;
        }

        .hist-status-pill.delivered {
          background: #D1FAE5;
          color: #047857;
        }

        .hist-status-pill.completed {
          background: #E0F2FE;
          color: #0369A1;
        }

        /* Col 7: ACTION */
        .hist-td-action {
          display: flex;
          justify-content: flex-end;
          align-items: center;
        }

        .hist-action-link {
          color: #0F766E;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: opacity 0.15s ease;
        }

        .hist-action-link:hover {
          text-decoration: underline;
        }

        /* FOOTER */
        .hist-table-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          border-top: 1px solid #EEF2F4;
          background: #FFFFFF;
          gap: 16px;
          flex-wrap: wrap;
        }

        .hist-footer-stats {
          font-size: 0.84rem;
          color: #64748B;
        }

        .hist-footer-stats strong {
          color: #0F172A;
          font-weight: 700;
        }

        .hist-pagination-controls {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .hist-page-btn {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          border: 1px solid #E2E8F0;
          background: #FFFFFF;
          color: #475569;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .hist-page-btn:hover:not(:disabled):not(.active) {
          background: #F8FAFB;
          border-color: #CBD5E1;
        }

        .hist-page-btn.active {
          background: #0B4F47;
          color: #FFFFFF;
          border-color: #0B4F47;
        }

        .hist-page-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .hist-empty-state-card {
          padding: 48px 24px;
          text-align: center;
          color: #64748B;
          font-size: 0.86rem;
        }

        /* ========================================================
           PAGE 8: MY PROFILE STYLES (Matching Reference Image 1 Exactly)
           ======================================================== */
        .prof-main-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
          width: 100%;
        }

        /* HERO STAFF PROFILE CARD */
        .prof-hero-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 20px;
          padding: 24px 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }

        .prof-hero-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .prof-avatar-wrap {
          position: relative;
          width: 76px;
          height: 76px;
          flex-shrink: 0;
        }

        .prof-avatar-circle {
          width: 76px;
          height: 76px;
          border-radius: 50%;
          background: #00685B;
          color: #FFFFFF;
          font-size: 24px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          letter-spacing: -0.02em;
          border: 3px solid #FFFFFF;
          box-shadow: 0 4px 14px rgba(0, 104, 91, 0.2);
          overflow: hidden;
        }

        .prof-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
          display: block;
        }

        .prof-status-dot {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #10B981;
          border: 2.5px solid #FFFFFF;
        }

        .prof-hero-info {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .prof-name-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .prof-name {
          font-size: 24px;
          font-weight: 800;
          color: #0F172A;
          margin: 0;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }

        .prof-active-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 10px;
          background: #ECFDF5;
          border: 1px solid #A7F3D0;
          border-radius: 9999px;
          color: #059669;
          font-size: 11px;
          font-weight: 700;
          line-height: 1;
        }

        .prof-designation-line {
          font-size: 13px;
          color: #64748B;
          font-weight: 500;
          margin: 0;
        }

        .prof-badges-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 4px;
          flex-wrap: wrap;
        }

        .prof-pill-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 13px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 600;
          line-height: 1;
        }

        .prof-pill-badge.plant-shift {
          background: #ECFDF5;
          border: 1px solid #A7F3D0;
          color: #047857;
        }

        .prof-green-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10B981;
          display: inline-block;
        }

        .prof-pill-badge.desk-hub {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          color: #334155;
        }

        .prof-pill-badge.certified {
          background: #ECFDF5;
          border: 1px solid #A7F3D0;
          color: #047857;
        }

        .prof-hero-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }

        .prof-btn-edit {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #0F766E;
          color: #FFFFFF;
          border: none;
          border-radius: 10px;
          padding: 10px 18px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 1px 2px rgba(15, 118, 110, 0.15);
        }

        .prof-btn-edit:hover {
          background: #0D655E;
          transform: translateY(-1px);
        }

        .prof-btn-logout {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #FEF2F2;
          border: 1px solid #FECDD3;
          color: #EF4444;
          border-radius: 10px;
          padding: 10px 18px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .prof-btn-logout:hover {
          background: #FEE2E2;
          border-color: #FDA4AF;
          color: #DC2626;
          transform: translateY(-1px);
        }

        /* 2-COLUMN PROFILE DETAILS GRID */
        .prof-columns-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .prof-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 20px;
          padding: 26px 28px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
          display: flex;
          flex-direction: column;
        }

        .prof-card-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 22px;
        }

        .prof-card-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .prof-card-icon-box.teal {
          background: #E6F4F1;
          color: #087F8C;
        }

        .prof-card-icon-box.mint {
          background: #E6F4F1;
          color: #087F8C;
        }

        .prof-card-title {
          font-size: 18px;
          font-weight: 800;
          color: #0F172A;
          margin: 0;
          letter-spacing: -0.01em;
          line-height: 1.25;
        }

        .prof-card-subtitle {
          font-size: 12px;
          color: #64748B;
          margin: 3px 0 0 0;
          font-weight: 500;
        }

        /* COLUMN 1: Personal Information Fields */
        .prof-fields-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .prof-field-box {
          background: #F8FAFC;
          border: 1px solid #EAEFF2;
          border-radius: 14px;
          padding: 13px 16px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-height: 64px;
        }

        .prof-field-box.full-width {
          grid-column: span 2;
        }

        .prof-field-label {
          font-size: 10px;
          font-weight: 700;
          color: #64748B;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 6px;
          display: block;
        }

        .prof-field-val {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13.5px;
          font-weight: 700;
          color: #0F172A;
        }

        .prof-field-icon {
          color: #64748B;
          flex-shrink: 0;
        }

        /* COLUMN 2: Plant Responsibilities */
        .prof-resp-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .prof-resp-item {
          background: #F8FAFC;
          border: 1px solid #EAEFF2;
          border-radius: 14px;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 64px;
        }

        .prof-resp-left {
          display: flex;
          align-items: center;
          gap: 14px;
          flex: 1;
        }

        .prof-resp-icon-box {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .prof-resp-icon-box.mint {
          background: #E6F4F1;
          color: #087F8C;
        }

        .prof-resp-icon-box.purple {
          background: #F3E8FF;
          color: #9333EA;
        }

        .prof-resp-icon-box.amber {
          background: #FEF3C7;
          color: #D97706;
        }

        .prof-resp-info {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .prof-resp-val {
          font-size: 14.5px;
          font-weight: 800;
          color: #0F172A;
        }

        .prof-resp-val.teal {
          color: #059669;
        }

        .prof-resp-val.dept {
          font-size: 13.5px;
          font-weight: 700;
          color: #0F172A;
        }

        .prof-resp-val.cert {
          font-size: 13px;
          font-weight: 700;
          color: #0F172A;
          line-height: 1.35;
        }

        .prof-pass-rate-bar-wrap {
          width: 140px;
          height: 8px;
          background: #E2E8F0;
          border-radius: 9999px;
          overflow: hidden;
          flex-shrink: 0;
          margin-left: 16px;
        }

        .prof-pass-rate-bar-inner {
          height: 100%;
          background: #10B981;
          border-radius: 9999px;
          transition: width 0.4s ease;
        }

        .prof-cert-badge {
          background: #ECFDF5;
          border: 1px solid #A7F3D0;
          color: #047857;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 9999px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
          margin-left: 16px;
        }

        @media (max-width: 1024px) {
          .prof-columns-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .prof-hero-card {
            flex-direction: column;
            align-items: flex-start;
            gap: 18px;
          }

          .prof-hero-actions {
            width: 100%;
            justify-content: flex-start;
          }

          .prof-fields-grid {
            grid-template-columns: 1fr;
          }

          .prof-field-box.full-width {
            grid-column: span 1;
          }
        }

        /* ========================================================
           CARE CONFLICT RESOLUTION MODAL STYLES
           ======================================================== */
        .conflict-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          overflow-y: auto;
        }

        .conflict-modal-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 20px;
          max-width: 580px;
          width: 100%;
          box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25);
          overflow: hidden;
          animation: modalScaleIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes modalScaleIn {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .conflict-modal-header {
          padding: 20px 24px;
          background: #FFFFFF;
          border-bottom: 1px solid #EAEFF2;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }

        .conflict-modal-header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .conflict-modal-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #FEF3C7;
          color: #D97706;
          border: 1px solid #FDE68A;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .conflict-modal-title {
          font-size: 1.125rem;
          font-weight: 800;
          color: #0F172A;
          margin: 0;
          line-height: 1.25;
          letter-spacing: -0.01em;
        }

        .conflict-modal-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 4px;
          font-size: 12.5px;
          color: #64748B;
          font-weight: 600;
        }

        .conflict-modal-decision-badge {
          background: #FEF3C7;
          color: #B45309;
          border: 1px solid #FCD34D;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 9999px;
          line-height: 1;
        }

        .conflict-modal-close-btn {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748B;
          background: transparent;
          border: 1px solid transparent;
          cursor: pointer;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }

        .conflict-modal-close-btn:hover {
          background: #F1F5F9;
          color: #0F172A;
          border-color: #E2E8F0;
        }

        .conflict-modal-body {
          padding: 22px 24px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          max-height: calc(85vh - 140px);
          overflow-y: auto;
        }

        .conflict-policy-card {
          background: #FFFBEB;
          border: 1px solid #FDE68A;
          border-radius: 14px;
          padding: 14px 18px;
        }

        .conflict-policy-header {
          display: flex;
          align-items: center;
          gap: 7px;
          font-weight: 800;
          font-size: 12.5px;
          color: #92400E;
        }

        .conflict-policy-text {
          color: #78350F;
          font-size: 12px;
          line-height: 1.5;
          margin: 6px 0 0 0;
        }

        .conflict-section-title {
          font-size: 11px;
          font-weight: 800;
          color: #64748B;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .conflict-garments-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .conflict-garment-card {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 12px 16px;
        }

        .conflict-garment-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .conflict-garment-name {
          font-weight: 800;
          font-size: 13.5px;
          color: #0F172A;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .conflict-pill-warning {
          background: #FEF2F2;
          border: 1px solid #FECDD3;
          color: #DC2626;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 9px;
          border-radius: 9999px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
        }

        .conflict-garment-details {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 6px;
          font-size: 11.5px;
          color: #64748B;
          flex-wrap: wrap;
        }

        .conflict-service-chip {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 6px;
          padding: 2px 7px;
          font-weight: 600;
          color: #334155;
          font-size: 11px;
        }

        .conflict-options-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .conflict-option-card {
          border-radius: 14px;
          padding: 15px 18px;
          cursor: pointer;
          transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
          text-align: left;
          width: 100%;
        }

        .conflict-option-card.opt-dry-clean {
          background: #F0FDF4;
          border: 2px solid #0F766E;
          box-shadow: 0 1px 3px rgba(15, 118, 110, 0.08);
        }

        .conflict-option-card.opt-dry-clean:hover {
          background: #ECFDF5;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(15, 118, 110, 0.15);
        }

        .conflict-option-card.opt-wash {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
        }

        .conflict-option-card.opt-wash:hover {
          border-color: #3B82F6;
          background: #F8FAFC;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.08);
        }

        .conflict-option-card.opt-supervised {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
        }

        .conflict-option-card.opt-supervised:hover {
          border-color: #F59E0B;
          background: #FFFBEB;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.08);
        }

        .conflict-opt-left {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          flex: 1;
        }

        .conflict-opt-icon-box {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .conflict-opt-icon-box.green {
          background: #D1FAE5;
          color: #065F46;
        }

        .conflict-opt-icon-box.blue {
          background: #EFF6FF;
          color: #2563EB;
        }

        .conflict-opt-icon-box.amber {
          background: #FEF3C7;
          color: #D97706;
        }

        .conflict-opt-text-block {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .conflict-opt-title {
          font-size: 13.5px;
          font-weight: 800;
          color: #0F172A;
          margin: 0;
        }

        .conflict-opt-title.teal-highlight {
          color: #0F766E;
        }

        .conflict-opt-desc {
          font-size: 12px;
          color: #64748B;
          line-height: 1.45;
          margin: 0;
        }

        .conflict-opt-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 9999px;
          white-space: nowrap;
          flex-shrink: 0;
          line-height: 1;
        }

        .conflict-opt-badge.safest {
          background: #D1FAE5;
          border: 1px solid #A7F3D0;
          color: #065F46;
        }

        .conflict-opt-badge.blue {
          background: #EFF6FF;
          border: 1px solid #BFDBFE;
          color: #1D4ED8;
        }

        .conflict-opt-badge.amber {
          background: #FEF3C7;
          border: 1px solid #FDE68A;
          color: #B45309;
        }

        .conflict-modal-footer {
          background: #F8FAFC;
          border-top: 1px solid #EAEFF2;
          padding: 14px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .conflict-modal-hint {
          font-size: 12px;
          color: #64748B;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .conflict-modal-dismiss-btn {
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          color: #475569;
          padding: 9px 18px;
          border-radius: 10px;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
        }

        .conflict-modal-dismiss-btn:hover {
          background: #F1F5F9;
          color: #0F172A;
          border-color: #94A3B8;
        }

        /* GLOBAL ERROR CARD */
        .global-error-card {
          background: #FEF2F2;
          border: 1px solid #FCA5A5;
          border-radius: 12px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        /* ========================================================
           STAFF MODALS DESIGN SYSTEM (Intake, Stage, QC, Packing, Tracker)
           ======================================================== */
        @keyframes staffModalPop {
          0% {
            opacity: 0;
            transform: scale(0.96) translateY(8px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .staff-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          overflow-y: auto;
        }

        .staff-modal-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 20px;
          width: 100%;
          max-width: 520px;
          box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.04);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          animation: staffModalPop 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          margin: auto;
        }

        .staff-modal-card.wide {
          max-width: 720px;
        }

        .staff-modal-header {
          padding: 18px 24px;
          border-bottom: 1px solid #E2E8F0;
          background: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .staff-modal-header-left {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
          flex: 1;
        }

        .staff-modal-icon-badge {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #E6F4F2;
          color: #0F766E;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .staff-modal-icon-badge.emerald {
          background: #ECFDF5;
          color: #059669;
        }

        .staff-modal-icon-badge.amber {
          background: #FEF3C7;
          color: #D97706;
        }

        .staff-modal-icon-badge.indigo {
          background: #EEF2FF;
          color: #4F46E5;
        }

        .staff-modal-header-text {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .staff-modal-title {
          font-size: 1.125rem;
          font-weight: 800;
          color: #0F172A;
          margin: 0;
          line-height: 1.25;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .staff-modal-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 4px;
          font-size: 0.8125rem;
          color: #64748B;
          flex-wrap: wrap;
        }

        .staff-modal-close-btn {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1px solid #E2E8F0;
          background: #F8FAFC;
          color: #64748B;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }

        .staff-modal-close-btn:hover {
          background: #F1F5F9;
          color: #0F172A;
          border-color: #CBD5E1;
        }

        .staff-modal-body {
          padding: 24px;
          max-height: calc(85vh - 140px);
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .staff-modal-footer {
          padding: 16px 24px;
          background: #F8FAFC;
          border-top: 1px solid #E2E8F0;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
        }

        /* Forms */
        .staff-form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .staff-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .staff-form-label {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #1E293B;
        }

        .staff-form-input,
        .staff-form-textarea,
        .staff-form-select {
          width: 100%;
          padding: 10px 14px;
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          border-radius: 10px;
          font-size: 0.875rem;
          color: #0F172A;
          font-family: inherit;
          transition: all 0.15s ease;
          box-sizing: border-box;
          outline: none;
        }

        .staff-form-input:focus,
        .staff-form-textarea:focus,
        .staff-form-select:focus {
          border-color: #0F766E;
          box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.12);
        }

        .staff-checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8125rem;
          font-weight: 700;
          color: #1E293B;
          cursor: pointer;
        }

        .staff-checkbox {
          width: 16px;
          height: 16px;
          accent-color: #0F766E;
          cursor: pointer;
        }

        /* Staff Profile Picture Upload & Delete Section */
        .staff-avatar-edit-section {
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 14px 18px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          margin-bottom: 4px;
        }

        .staff-avatar-preview-wrap {
          width: 68px;
          height: 68px;
          border-radius: 50%;
          flex-shrink: 0;
          position: relative;
          overflow: hidden;
          border: 2px solid #0F766E;
          background: #E6F4F2;
          box-shadow: 0 4px 12px rgba(15, 118, 110, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .staff-avatar-preview-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .staff-avatar-preview-placeholder {
          font-size: 1.35rem;
          font-weight: 800;
          color: #0F766E;
          letter-spacing: -0.02em;
          user-select: none;
        }

        .staff-avatar-edit-actions {
          display: flex;
          flex-direction: column;
          gap: 7px;
          flex: 1;
          min-width: 0;
        }

        .staff-avatar-btn-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .staff-avatar-upload-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          background: #0F766E;
          color: #FFFFFF;
          border: none;
          border-radius: 9px;
          font-size: 0.8125rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 6px rgba(15, 118, 110, 0.2);
        }

        .staff-avatar-upload-btn:hover {
          background: #0D655E;
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(15, 118, 110, 0.3);
        }

        .staff-avatar-upload-btn:active {
          transform: translateY(0);
        }

        .staff-avatar-delete-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 13px;
          background: #FEE2E2;
          color: #DC2626;
          border: 1px solid #FECACA;
          border-radius: 9px;
          font-size: 0.8125rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .staff-avatar-delete-btn:hover {
          background: #FCA5A5;
          color: #B91C1C;
          border-color: #F87171;
          transform: translateY(-1px);
        }

        .staff-avatar-delete-btn:active {
          transform: translateY(0);
        }

        .staff-avatar-hint {
          font-size: 0.72rem;
          color: #64748B;
          line-height: 1.3;
        }

        /* Buttons */
        .staff-btn-secondary {
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          color: #475569;
          padding: 9px 18px;
          border-radius: 10px;
          font-size: 0.8125rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
        }

        .staff-btn-secondary:hover {
          background: #F1F5F9;
          color: #0F172A;
          border-color: #94A3B8;
        }

        .staff-btn-primary {
          background: #0F766E;
          border: 1px solid #0F766E;
          color: #FFFFFF;
          padding: 9px 20px;
          border-radius: 10px;
          font-size: 0.8125rem;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.15s ease;
          box-shadow: 0 1px 3px rgba(15, 118, 110, 0.25);
          white-space: nowrap;
        }

        .staff-btn-primary:hover {
          background: #0D655E;
          border-color: #0D655E;
          box-shadow: 0 3px 8px rgba(15, 118, 110, 0.35);
        }

        .staff-btn-danger {
          background: #DC2626;
          border: 1px solid #DC2626;
          color: #FFFFFF;
          padding: 9px 20px;
          border-radius: 10px;
          font-size: 0.8125rem;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.15s ease;
          white-space: nowrap;
        }

        .staff-btn-danger:hover {
          background: #B91C1C;
        }

        .staff-btn-success {
          background: #059669;
          border: 1px solid #059669;
          color: #FFFFFF;
          padding: 9px 20px;
          border-radius: 10px;
          font-size: 0.8125rem;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.15s ease;
          white-space: nowrap;
        }

        .staff-btn-success:hover {
          background: #047857;
        }

        /* Quality Check Cards */
        .staff-qc-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .staff-qc-card {
          padding: 14px 16px;
          border-radius: 14px;
          border: 2px solid #E2E8F0;
          background: #FFFFFF;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 4px;
          transition: all 0.15s ease;
          text-align: left;
        }

        .staff-qc-card.pass.active {
          border-color: #059669;
          background: #ECFDF5;
        }

        .staff-qc-card.fail.active {
          border-color: #DC2626;
          background: #FEF2F2;
        }

        .staff-qc-title {
          font-size: 13.5px;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .staff-qc-card.pass.active .staff-qc-title {
          color: #065F46;
        }

        .staff-qc-card.fail.active .staff-qc-title {
          color: #991B1B;
        }

        .staff-qc-desc {
          font-size: 11.5px;
          color: #64748B;
        }

        /* Pill Badges */
        .staff-pill-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 9999px;
          line-height: 1;
        }

        .staff-pill-badge.teal {
          background: #E6F4F2;
          border: 1px solid #A7F3D0;
          color: #0F766E;
        }

        .staff-pill-badge.express {
          background: #FEE2E2;
          border: 1px solid #FECACA;
          color: #DC2626;
        }

        .staff-pill-badge.amber {
          background: #FEF3C7;
          border: 1px solid #FDE68A;
          color: #B45309;
        }

        /* Tracker Modal Specific Styles */
        .tracker-notice-banner {
          background: #F0FDFA;
          border: 1px solid #99F6E4;
          border-radius: 14px;
          padding: 14px 16px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .tracker-notice-icon-box {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: #CCFBF1;
          color: #0F766E;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .tracker-notice-title {
          font-size: 13px;
          font-weight: 800;
          color: #0F766E;
          margin: 0 0 2px;
        }

        .tracker-notice-desc {
          font-size: 12px;
          color: #134E4A;
          line-height: 1.45;
          margin: 0;
        }

        .tracker-section-heading {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #64748B;
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 6px 0 2px;
        }

        .tracker-item-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          padding: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .tracker-item-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .tracker-item-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .tracker-item-icon-box {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: #F1F5F9;
          color: #0F766E;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .tracker-item-name {
          font-size: 14px;
          font-weight: 700;
          color: #0F172A;
          margin: 0;
          display: flex;
          align-items: center;
        }

        .tracker-qty-badge {
          background: #F1F5F9;
          border: 1px solid #E2E8F0;
          color: #64748B;
          font-size: 11.5px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 6px;
          margin-left: 6px;
        }

        .tracker-stage-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 9999px;
          white-space: nowrap;
          border: 1px solid #A7F3D0;
          background: #ECFDF5;
          color: #047857;
        }

        .tracker-stage-badge.teal {
          background: #E6F4F2;
          border-color: #99F6E4;
          color: #0F766E;
        }

        .tracker-services-row {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
          margin-left: 44px;
        }

        .tracker-service-pill {
          background: #F8FAFC;
          border: 1px solid #CBD5E1;
          color: #334155;
          font-size: 11px;
          font-weight: 600;
          padding: 3px 10px;
          border-radius: 6px;
        }

        .tracker-dedup-box {
          background: #EFF6FF;
          border: 1px solid #BFDBFE;
          color: #1E40AF;
          font-size: 11.5px;
          padding: 7px 12px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-left: 44px;
        }

        .tracker-pipeline-wrap {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 12px 14px;
          margin-left: 44px;
        }

        .tracker-pipeline-kicker {
          font-size: 10px;
          font-weight: 800;
          color: #64748B;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
        }

        .tracker-stepper-track {
          display: flex;
          align-items: center;
          gap: 6px;
          overflow-x: auto;
          padding-bottom: 2px;
        }

        .tracker-step-node {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 8px;
          border: 1px solid #E2E8F0;
          background: #FFFFFF;
          color: #64748B;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .tracker-step-node.done {
          background: #ECFDF5;
          border-color: #A7F3D0;
          color: #047857;
        }

        .tracker-step-node.active {
          background: #0F766E;
          border-color: #0F766E;
          color: #FFFFFF;
          box-shadow: 0 2px 6px rgba(15, 118, 110, 0.35);
        }

        /* Timeline for homogeneous orders */
        .tracker-summary-card {
          padding: 16px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .tracker-timeline {
          position: relative;
          padding-left: 28px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .tracker-timeline::before {
          content: '';
          position: absolute;
          left: 10px;
          top: 10px;
          bottom: 10px;
          width: 2px;
          background: #E2E8F0;
        }

        .tracker-timeline-item {
          position: relative;
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .tracker-timeline-bullet {
          position: absolute;
          left: -28px;
          margin-top: 2px;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 800;
          background: #FFFFFF;
          border: 2px solid #CBD5E1;
          color: #94A3B8;
        }

        .tracker-timeline-bullet.done {
          background: #10B981;
          border-color: #10B981;
          color: #FFFFFF;
        }

        .tracker-timeline-bullet.active {
          background: #0F766E;
          border-color: #0F766E;
          color: #FFFFFF;
          box-shadow: 0 0 0 4px #CCFBF1;
        }

        /* RESPONSIVE MOBILE DRAWER */
        @media (max-width: 1024px) {
          .laundry-sidebar {
            left: -280px;
            width: 260px;
            transition: left 0.28s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: none;
          }

          .laundry-sidebar.open {
            left: 0;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
          }

          .mobile-close-btn {
            display: block;
          }

          .laundry-main-wrapper {
            margin-left: 0;
            max-width: 100vw;
            padding: 0 18px 36px;
          }

          .dash-header-sticky-wrapper {
            padding-top: 14px;
            padding-bottom: 10px;
            margin-bottom: 8px;
          }

          .mobile-hamburger-btn {
            display: block;
          }

          .laundry-sidebar-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.5);
            backdrop-filter: blur(2px);
            z-index: 90;
          }
        }
      `}</style>
    </div>
  );
};

export default LaundryPortal;
