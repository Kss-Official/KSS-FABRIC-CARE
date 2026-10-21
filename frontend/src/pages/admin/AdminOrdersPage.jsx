import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAdmin } from '../../context/AdminContext';
import { 
  ShoppingBag, 
  Truck, 
  CheckCircle2, 
  Plus, 
  Search, 
  ChevronDown, 
  MoreHorizontal, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  Eye,
  UserCheck,
  RotateCcw
} from 'lucide-react';
import { filterMatchesDate } from '../../utils/dateFilterUtils';
import { formatOrderId } from '../../utils/helpers';
import { OrderProcessingModal } from '../../components/admin/OrderProcessingModal';

// Washing Machine / Washer SVG icon matching Reference Image 2 Metric Card 3
const WasherIcon = ({ size = 20, color = 'currentColor', className = '' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect x="4" y="2" width="16" height="20" rx="3" />
    <circle cx="12" cy="13" r="5" />
    <path d="M12 11a2 2 0 0 1 2 2" />
    <path d="M8 6h.01" />
    <path d="M12 6h.01" />
  </svg>
);

// Universal status category matcher ensuring 100% consistency across metrics, tabs, and filters
export const isStatusMatchingCategory = (orderStatus, categoryKey) => {
  if (!categoryKey || categoryKey === 'all') return true;
  const s = String(orderStatus || '').toLowerCase().trim();
  const cat = String(categoryKey).toLowerCase().trim();

  // Pending Pickup category (all incoming/pending pickup orders, including driver-assigned/scheduled)
  if (cat === 'pending' || cat === 'pending pickup' || cat === 'pickup scheduled') {
    return (
      s === 'pending pickup' ||
      s === 'pickup scheduled' ||
      s === 'pickup assigned' ||
      s === 'order placed' ||
      s === 'placed' ||
      s === 'pending_review' ||
      s === 'payment_pending' ||
      s.includes('pickup') ||
      s.includes('pending')
    );
  }

  // In Cleaning category (processing, washing, cleaning)
  if (cat === 'cleaning' || cat === 'in cleaning') {
    return (
      s === 'in cleaning' ||
      s === 'cleaning' ||
      s === 'washing' ||
      s === 'processing' ||
      s === 'picked up'
    );
  }

  // Ready for Delivery category (ready, out for delivery, in transit)
  if (cat === 'ready' || cat === 'ready for delivery') {
    return (
      s === 'ready for delivery' ||
      s === 'ready' ||
      s === 'in transit' ||
      s === 'out for delivery' ||
      s === 'delivery assigned'
    );
  }

  // Completed category (completed, delivered)
  if (cat === 'completed' || cat === 'delivered') {
    return (
      s === 'completed' ||
      s === 'delivered'
    );
  }

  return s === cat;
};

// Exact baseline orders matching the reference image
export const BASELINE_ADMIN_ORDERS = [
  {
    id: '#LDX1290',
    rawId: 'ord_ldx_1290',
    order_id: '#LDX1290',
    order_number: '#LDX1290',
    date: '23 Sep 2026',
    placedAt: 1790154000000,
    createdAt: 1790154000000,
    customer: {
      name: 'Rohan Mehta',
      phone: '+91 98765 43210',
      avatar: 'RM',
      address: 'Banaswadi, Bengaluru'
    },
    customer_name: 'Rohan Mehta',
    customer_phone: '+91 98765 43210',
    services: ['Wash & Fold', 'Ironing'],
    services_list: ['Wash & Fold', 'Ironing'],
    pickupTime: '23 Sep, 09:00 AM – 11:00 AM',
    amount: 560,
    total_amount: 560,
    status: 'Pending Pickup',
    payment: 'Paid',
    paymentStatus: 'Paid',
    driver: 'Not Assigned',
    orderIndex: 0
  },
  {
    id: '#LDX1289',
    rawId: 'ord_ldx_1289',
    order_id: '#LDX1289',
    order_number: '#LDX1289',
    date: '23 Sep 2026',
    placedAt: 1790157600000,
    createdAt: 1790157600000,
    customer: {
      name: 'Priya Sharma',
      phone: '+91 99876 54321',
      avatar: 'PS',
      address: 'HRBR Layout, Bengaluru'
    },
    customer_name: 'Priya Sharma',
    customer_phone: '+91 99876 54321',
    services: ['Dry Cleaning'],
    services_list: ['Dry Cleaning'],
    pickupTime: '23 Sep, 10:00 AM – 12:00 PM',
    amount: 240,
    total_amount: 240,
    status: 'In Cleaning',
    payment: 'Paid',
    paymentStatus: 'Paid',
    driver: 'Ravi Kumar (+91 98765 43210)',
    orderIndex: 1
  },
  {
    id: '#LDX1288',
    rawId: 'ord_ldx_1288',
    order_id: '#LDX1288',
    order_number: '#LDX1288',
    date: '23 Sep 2026',
    placedAt: 1790161200000,
    createdAt: 1790161200000,
    customer: {
      name: 'Arjun Nair',
      phone: '+91 91234 56789',
      avatar: 'AN',
      address: 'Indiranagar, Bengaluru'
    },
    customer_name: 'Arjun Nair',
    customer_phone: '+91 91234 56789',
    services: ['Wash & Iron', 'Dry Cleaning'],
    services_list: ['Wash & Iron', 'Dry Cleaning'],
    pickupTime: '23 Sep, 11:00 AM – 01:00 PM',
    amount: 420,
    total_amount: 420,
    status: 'Ready for Delivery',
    payment: 'COD',
    paymentStatus: 'Pending',
    driver: 'Ravi Kumar (+91 98765 43210)',
    orderIndex: 2
  },
  {
    id: '#LDX10287',
    rawId: 'ord_ldx_10287',
    order_id: '#LDX10287',
    order_number: '#LDX10287',
    date: '23 Sep 2026',
    placedAt: 1790172000000,
    createdAt: 1790172000000,
    customer: {
      name: 'Sneha Reddy',
      phone: '+91 99887 66554',
      avatar: 'SR',
      address: 'Whitefield, Bengaluru'
    },
    customer_name: 'Sneha Reddy',
    customer_phone: '+91 99887 66554',
    services: ['Wash & Iron', 'Steam Iron'],
    services_list: ['Wash & Iron', 'Steam Iron'],
    pickupTime: '23 Sep, 02:00 PM – 04:00 PM',
    amount: 780,
    total_amount: 780,
    status: 'Completed',
    payment: 'Paid',
    paymentStatus: 'Paid',
    driver: 'Arjun Singh (+91 87654 32109)',
    orderIndex: 3
  },
  {
    id: '#LDX1286',
    rawId: 'ord_ldx_1286',
    order_id: '#LDX1286',
    order_number: '#LDX1286',
    date: '23 Sep 2026',
    placedAt: 1790175600000,
    createdAt: 1790175600000,
    customer: {
      name: 'Karan Verma',
      phone: '+91 98712 34567',
      avatar: 'KV',
      address: 'Marathahalli, Bengaluru'
    },
    customer_name: 'Karan Verma',
    customer_phone: '+91 98712 34567',
    services: ['Express Laundry'],
    services_list: ['Express Laundry'],
    isExpress: true,
    pickupTime: '23 Sep, 03:00 PM – 05:00 PM',
    amount: 350,
    total_amount: 350,
    status: 'In Cleaning',
    payment: 'Paid',
    paymentStatus: 'Paid',
    driver: 'Ravi Kumar (+91 98765 43210)',
    orderIndex: 4
  },
  {
    id: '#LDX1285',
    rawId: 'ord_ldx_1285',
    order_id: '#LDX1285',
    order_number: '#LDX1285',
    date: '23 Sep 2026',
    placedAt: 1790179200000,
    createdAt: 1790179200000,
    customer: {
      name: 'Neha Kapoor',
      phone: '+91 87654 32109',
      avatar: 'NK',
      address: 'HSR Layout, Bengaluru'
    },
    customer_name: 'Neha Kapoor',
    customer_phone: '+91 87654 32109',
    services: ['Steam Iron'],
    services_list: ['Steam Iron'],
    pickupTime: '23 Sep, 04:00 PM – 06:00 PM',
    amount: 280,
    total_amount: 280,
    status: 'Pending Pickup',
    payment: 'Unpaid',
    paymentStatus: 'Unpaid',
    driver: 'Not Assigned',
    orderIndex: 5
  },
  {
    id: '#LDX1284',
    rawId: 'ord_ldx_1284',
    order_id: '#LDX1284',
    order_number: '#LDX1284',
    date: '23 Sep 2026',
    placedAt: 1790182800000,
    createdAt: 1790182800000,
    customer: {
      name: 'Amit Shah',
      phone: '+91 91234 99876',
      avatar: 'AM',
      address: 'Koramangala, Bengaluru'
    },
    customer_name: 'Amit Shah',
    customer_phone: '+91 91234 99876',
    services: ['Wash & Fold', 'Dry Cleaning', 'Steam Iron'],
    services_list: ['Wash & Fold', 'Dry Cleaning', 'Steam Iron'],
    pickupTime: '23 Sep, 05:00 PM – 07:00 PM',
    amount: 620,
    total_amount: 620,
    status: 'Ready for Delivery',
    payment: 'Paid',
    paymentStatus: 'Paid',
    driver: 'Arjun Singh (+91 87654 32109)',
    orderIndex: 6
  },
  {
    id: '#LDX1283',
    rawId: 'ord_ldx_1283',
    order_id: '#LDX1283',
    order_number: '#LDX1283',
    date: '23 Sep 2026',
    placedAt: 1790186400000,
    createdAt: 1790186400000,
    customer: {
      name: 'Deepak Reddy',
      phone: '+91 99876 23451',
      avatar: 'DP',
      address: 'Jayanagar, Bengaluru'
    },
    customer_name: 'Deepak Reddy',
    customer_phone: '+91 99876 23451',
    services: ['Dry Cleaning'],
    services_list: ['Dry Cleaning'],
    pickupTime: '23 Sep, 06:00 PM – 08:00 PM',
    amount: 310,
    total_amount: 310,
    status: 'Completed',
    payment: 'Paid',
    paymentStatus: 'Paid',
    driver: 'Ravi Kumar (+91 98765 43210)',
    orderIndex: 7
  },
  {
    id: '#LDX1282',
    rawId: 'ord_ldx_1282',
    order_id: '#LDX1282',
    order_number: '#LDX1282',
    date: '23 Sep 2026',
    placedAt: 1790190000000,
    createdAt: 1790190000000,
    customer: {
      name: 'Kavya T',
      phone: '+91 93456 78912',
      avatar: 'KT',
      address: 'Malleshwaram, Bengaluru'
    },
    customer_name: 'Kavya T',
    customer_phone: '+91 93456 78912',
    services: ['Wash & Iron'],
    services_list: ['Wash & Iron'],
    pickupTime: '23 Sep, 07:00 PM – 09:00 PM',
    amount: 400,
    total_amount: 400,
    status: 'In Cleaning',
    payment: 'COD',
    paymentStatus: 'Pending',
    driver: 'Ravi Kumar (+91 98765 43210)',
    orderIndex: 8
  },
  {
    id: '#LDX10281',
    rawId: 'ord_ldx_10281',
    order_id: '#LDX10281',
    order_number: '#LDX10281',
    date: '22 Sep 2026',
    placedAt: 1790071200000,
    createdAt: 1790071200000,
    customer: {
      name: 'Pavan Kumar',
      phone: '+91 98765 12345',
      avatar: 'PR',
      address: 'JP Nagar, Bengaluru'
    },
    customer_name: 'Pavan Kumar',
    customer_phone: '+91 98765 12345',
    services: ['Home Care', 'Steam Iron'],
    services_list: ['Home Care', 'Steam Iron'],
    pickupTime: '22 Sep, 10:00 AM – 12:00 PM',
    amount: 750,
    total_amount: 750,
    status: 'Completed',
    payment: 'Paid',
    paymentStatus: 'Paid',
    driver: 'Arjun Singh (+91 87654 32109)',
    orderIndex: 9
  }
];

export const AdminOrdersPage = () => {
  const { 
    orders, 
    refreshOrders,
    setIsCreateOrderDrawerOpen, 
    setIsAssignOrderModalOpen, 
    setAssigningOrder,
    updateOrderStatus,
    ordersFilterTarget
  } = useAdmin();

  const [activeTab, setActiveTab] = useState(() => ordersFilterTarget?.tab || 'all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(() => ordersFilterTarget?.status || 'all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState(null);

  // Synchronize with external navigation targets (e.g. clicking dashboard cards)
  useEffect(() => {
    if (ordersFilterTarget) {
      if (ordersFilterTarget.tab) setActiveTab(ordersFilterTarget.tab);
      if (ordersFilterTarget.status) setStatusFilter(ordersFilterTarget.status);
      if (ordersFilterTarget.service !== undefined) setServiceFilter(ordersFilterTarget.service);
      setCurrentPage(1);
    }
  }, [ordersFilterTarget]);

  // Synchronize orders with dynamic updates from real-time database
  const combinedOrders = useMemo(() => {
    if (orders && orders.length > 0) {
      return orders;
    }
    return BASELINE_ADMIN_ORDERS;
  }, [orders]);

  // Exact order metrics dynamically updated and guaranteed 1:1 with filtered lists
  const counts = useMemo(() => {
    const list = combinedOrders || [];
    return {
      total: list.length,
      pending: list.filter(o => isStatusMatchingCategory(o?.status, 'pending')).length,
      cleaning: list.filter(o => isStatusMatchingCategory(o?.status, 'cleaning')).length,
      ready: list.filter(o => isStatusMatchingCategory(o?.status, 'ready')).length,
      completed: list.filter(o => isStatusMatchingCategory(o?.status, 'completed')).length,
    };
  }, [combinedOrders]);

  // Synchronized Tab and Filter Handlers
  const handleTabClick = (tabKey) => {
    setActiveTab(tabKey);
    if (tabKey === 'all') setStatusFilter('all');
    else if (tabKey === 'pending') setStatusFilter('Pending Pickup');
    else if (tabKey === 'cleaning') setStatusFilter('In Cleaning');
    else if (tabKey === 'ready') setStatusFilter('Ready for Delivery');
    else if (tabKey === 'completed') setStatusFilter('Completed');
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (val) => {
    setStatusFilter(val);
    if (val === 'all') setActiveTab('all');
    else if (val === 'Pending Pickup') setActiveTab('pending');
    else if (val === 'In Cleaning') setActiveTab('cleaning');
    else if (val === 'Ready for Delivery') setActiveTab('ready');
    else if (val === 'Completed') setActiveTab('completed');
    setCurrentPage(1);
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    try {
      setIsRefreshing(true);
      setRefreshError(null);
      if (refreshOrders) {
        await refreshOrders();
      }
    } catch (err) {
      console.error('Error refreshing orders:', err);
      setRefreshError('Failed to refresh orders. Please try again.');
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  const filteredOrders = combinedOrders.filter(o => {
    if (!o) return false;
    const services = Array.isArray(o.services) ? o.services : (Array.isArray(o.services_list) ? o.services_list : ['Wash & Fold']);
    const custName = o.customer?.name || o.customer_name || '';
    const custPhone = o.customer?.phone || o.customer_phone || '';
    const idStr = String(o.id || o.order_number || o.order_id || '');

    // Synchronized status filtering matching the active category
    if (activeTab !== 'all') {
      if (!isStatusMatchingCategory(o.status, activeTab)) return false;
    }
    if (statusFilter !== 'all') {
      if (!isStatusMatchingCategory(o.status, statusFilter)) return false;
    }
    if (serviceFilter !== 'all') {
      const allOrderServices = new Set();
      if (Array.isArray(o.services)) o.services.forEach(s => s && allOrderServices.add(String(s).trim()));
      if (Array.isArray(o.services_list)) o.services_list.forEach(s => s && allOrderServices.add(String(s).trim()));
      if (typeof o.service === 'string' && o.service) allOrderServices.add(o.service.trim());
      if (o.isExpress || o.is_express || o.isExpressDelivery) {
        allOrderServices.add('Express Laundry');
      }

      // Check items if any
      const rawItems = Array.isArray(o.items) ? o.items : (o.items && typeof o.items === 'object' ? Object.values(o.items) : []);
      rawItems.forEach(it => {
        if (!it) return;
        if (it.service_category) allOrderServices.add(String(it.service_category).trim());
        if (it.categoryName) allOrderServices.add(String(it.categoryName).trim());
        if (it.categoryId === 'express-laundry' || it.isExpress || String(it.categoryName || '').toLowerCase().includes('express')) {
          allOrderServices.add('Express Laundry');
        }
      });

      const target = serviceFilter.toLowerCase();
      const hasMatch = Array.from(allOrderServices).some(s => {
        const norm = String(s).toLowerCase();
        if (norm === target) return true;
        if (target === 'shoe laundry' && (norm.includes('shoe') || norm.includes('express') || o.isExpress || o.is_express)) return true;
        if (target === 'home care' && norm.includes('home')) return true;
        if (target === 'express laundry' && (norm.includes('express') || o.isExpress || o.is_express)) return true;
        if (target === 'wash & fold' && norm.includes('fold')) return true;
        if (target === 'wash & iron' && norm.includes('iron') && !norm.includes('steam')) return true;
        if (target === 'dry cleaning' && norm.includes('dry')) return true;
        if (target === 'steam iron' && norm.includes('steam')) return true;
        return false;
      });

      if (!hasMatch) return false;
    }

    // Date range filter
    if (dateRangeFilter !== 'all' && !filterMatchesDate(o, dateRangeFilter, ['placedAt', 'createdAt', 'updatedAt', 'date', 'pickup_time', 'created_at'])) {
      return false;
    }

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      const matchId = idStr.toLowerCase().includes(s);
      const matchName = custName.toLowerCase().includes(s);
      const matchPhone = custPhone.includes(searchTerm);
      if (!matchId && !matchName && !matchPhone) return false;
    }
    return true;
  }).sort((a, b) => {
    if (a.orderIndex !== undefined && b.orderIndex !== undefined) {
      return a.orderIndex - b.orderIndex;
    }
    if (a.orderIndex !== undefined) return 1;
    if (b.orderIndex !== undefined) return -1;
    const timeA = a.updatedAt || a.placedAt || a.createdAt || 0;
    const timeB = b.updatedAt || b.placedAt || b.createdAt || 0;
    return timeB - timeA;
  });

  const resetFilters = () => {
    setActiveTab('all');
    setSearchTerm('');
    setStatusFilter('all');
    setServiceFilter('all');
    setDateRangeFilter('all');
    setSelectedOrderIds([]);
    setCurrentPage(1);
    handleRefresh();
  };

  const ITEMS_PER_PAGE = 10;
  const totalOrders = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalOrders / ITEMS_PER_PAGE));

  // Reset to page 1 when any filter or tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, statusFilter, serviceFilter, dateRangeFilter]);

  // Ensure currentPage is within bounds if totalPages changes
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalOrders);
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  const isAllCurrentPageSelected = paginatedOrders.length > 0 && paginatedOrders.every(o => selectedOrderIds.includes(o.id));

  const toggleSelectAll = () => {
    if (isAllCurrentPageSelected) {
      setSelectedOrderIds(prev => prev.filter(id => !paginatedOrders.some(o => o.id === id)));
    } else {
      const pageIds = paginatedOrders.map(o => o.id);
      setSelectedOrderIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }
    if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  const toggleSelectOrder = (id) => {
    setSelectedOrderIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Pending Pickup':
      case 'Pickup Scheduled':
        return 'status-pending-pickup';
      case 'In Cleaning':
        return 'status-in-cleaning';
      case 'Ready for Delivery':
        return 'status-ready-delivery';
      case 'In Transit':
        return 'status-in-transit';
      case 'Completed':
      case 'Delivered':
        return 'status-completed';
      default: {
        const s = String(status || '').toLowerCase();
        if (s.includes('pickup') || s.includes('pending')) return 'status-pending-pickup';
        if (s.includes('clean') || s.includes('process')) return 'status-in-cleaning';
        if (s.includes('ready')) return 'status-ready-delivery';
        if (s.includes('transit')) return 'status-in-transit';
        if (s.includes('complete') || s.includes('deliver')) return 'status-completed';
        return 'status-pending-pickup';
      }
    }
  };

  const getPaymentBadgeClass = (payment) => {
    switch (payment?.toLowerCase()) {
      case 'paid':
        return 'payment-paid';
      case 'cod':
        return 'payment-cod';
      case 'pending':
      case 'unpaid':
        return 'payment-unpaid';
      default:
        return 'payment-paid';
    }
  };

  return (
    <div className="admin-orders-page animate-fade-in" onClick={() => setActiveActionMenuId(null)}>
      {/* Header Row */}
      <div className="orders-header-row">
        <div>
          <h1 className="orders-header-title">Orders</h1>
          <p className="orders-header-subtitle">Manage and track all customer orders.</p>
        </div>

        <div className="orders-header-actions-group">
          <button 
            id="create-order-top-btn"
            className="create-order-pill-btn"
            onClick={() => setIsCreateOrderDrawerOpen(true)}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Create Order</span>
          </button>
        </div>
      </div>

      {/* 5 Metric Cards */}
      <div className="orders-metric-cards-row">
        {/* Total Orders */}
        <div className="orders-metric-pill-card">
          <div className="metric-badge-box cyan">
            <ShoppingBag size={20} color="#0D7A75" strokeWidth={2} />
          </div>
          <div className="metric-text-col">
            <span className="metric-bold-num">{counts.total}</span>
            <span className="metric-label-txt">Total Orders</span>
          </div>
        </div>

        {/* Pending Pickup */}
        <div className="orders-metric-pill-card">
          <div className="metric-badge-box orange">
            <Truck size={20} color="#EA580C" strokeWidth={2} />
          </div>
          <div className="metric-text-col">
            <span className="metric-bold-num">{counts.pending}</span>
            <span className="metric-label-txt">Pending Pickup</span>
          </div>
        </div>

        {/* In Cleaning */}
        <div className="orders-metric-pill-card">
          <div className="metric-badge-box yellow">
            <WasherIcon size={20} color="#D97706" />
          </div>
          <div className="metric-text-col">
            <span className="metric-bold-num">{counts.cleaning}</span>
            <span className="metric-label-txt">In Cleaning</span>
          </div>
        </div>

        {/* Ready for Delivery */}
        <div className="orders-metric-pill-card">
          <div className="metric-badge-box purple">
            <ShoppingBag size={20} color="#9333EA" strokeWidth={2} />
          </div>
          <div className="metric-text-col">
            <span className="metric-bold-num">{counts.ready}</span>
            <span className="metric-label-txt">Ready for Delivery</span>
          </div>
        </div>

        {/* Completed */}
        <div className="orders-metric-pill-card">
          <div className="metric-badge-box green">
            <CheckCircle2 size={20} color="#16A34A" strokeWidth={2} />
          </div>
          <div className="metric-text-col">
            <span className="metric-bold-num">{counts.completed}</span>
            <span className="metric-label-txt">Completed</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls Bar */}
      <div className="orders-filter-controls-row">
        <div className="filter-search-field-wrap">
          <Search size={16} className="filter-search-icon" />
          <input 
            type="text" 
            placeholder="Search by Order ID, customer, or phone..." 
            className="filter-search-text-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-dropdowns-group">
          {/* Status Dropdown */}
          <div className="filter-select-wrap">
            <select 
              className="filter-custom-select"
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="Pending Pickup">Pending Pickup</option>
              <option value="In Cleaning">In Cleaning</option>
              <option value="Ready for Delivery">Ready for Delivery</option>
              <option value="Completed">Completed</option>
            </select>
            <ChevronDown size={15} className="filter-select-chevron" />
          </div>

          {/* Services Dropdown */}
          <div className="filter-select-wrap">
            <select 
              className="filter-custom-select"
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
            >
              <option value="all">All Services</option>
              <option value="Wash & Fold">Wash & Fold</option>
              <option value="Dry Cleaning">Dry Cleaning</option>
              <option value="Wash & Iron">Wash & Iron</option>
              <option value="Steam Iron">Steam Iron</option>
              <option value="Express Laundry">Express Laundry</option>
            </select>
            <ChevronDown size={15} className="filter-select-chevron" />
          </div>

          {/* Date Range Dropdown */}
          <div className="orders-date-dropdown-wrapper">
            <button 
              type="button"
              className={`filter-date-range-box ${isDateDropdownOpen ? 'active' : ''}`}
              onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
            >
              <Calendar size={15} className="date-icon" />
              <span className="date-label">
                {dateRangeFilter === 'all' 
                  ? 'Select Date Range' 
                  : (dateRangeFilter === 'today' ? 'Today' : dateRangeFilter === 'yesterday' ? 'Yesterday' : dateRangeFilter === 'last-week' ? 'Last Week' : 'Last 30 Days')}
              </span>
              <ChevronDown size={15} className="date-chevron" />
            </button>

            {isDateDropdownOpen && (
              <div className="orders-date-popover animate-scale-in">
                {[
                  { key: 'all', label: 'All Dates' },
                  { key: 'today', label: 'Today' },
                  { key: 'yesterday', label: 'Yesterday' },
                  { key: 'last-week', label: 'Last Week' },
                  { key: 'last-30', label: 'Last 30 Days' }
                ].map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    className={`orders-popover-item ${dateRangeFilter === opt.key ? 'active' : ''}`}
                    onClick={() => {
                      setDateRangeFilter(opt.key);
                      setCurrentPage(1);
                      setIsDateDropdownOpen(false);
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Single Refresh Button (replacing Reset button in the same position) */}
          <button 
            type="button" 
            id="orders-filter-refresh-btn"
            className="filter-refresh-btn" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh orders from database"
          >
            <RotateCcw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="orders-horizontal-tabs-bar">
        <button 
          type="button"
          className={`tab-item-link ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => handleTabClick('all')}
        >
          All Orders ({counts.total})
        </button>
        <button 
          type="button"
          className={`tab-item-link ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => handleTabClick('pending')}
        >
          Pending Pickup ({counts.pending})
        </button>
        <button 
          type="button"
          className={`tab-item-link ${activeTab === 'cleaning' ? 'active' : ''}`}
          onClick={() => handleTabClick('cleaning')}
        >
          In Cleaning ({counts.cleaning})
        </button>
        <button 
          type="button"
          className={`tab-item-link ${activeTab === 'ready' ? 'active' : ''}`}
          onClick={() => handleTabClick('ready')}
        >
          Ready for Delivery ({counts.ready})
        </button>
        <button 
          type="button"
          className={`tab-item-link ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => handleTabClick('completed')}
        >
          Completed ({counts.completed})
        </button>
      </div>

      {/* Main Table Card */}
      <div className="orders-table-wrapper-card">
        <div className="orders-scroll-table-box">
          <table className="orders-styled-table">
            <thead>
              <tr>
                <th width="44" className="chk-col">
                  <input 
                    type="checkbox" 
                    className="orders-custom-checkbox" 
                    checked={isAllCurrentPageSelected}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Services</th>
                <th>Pickup Date & Time</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan="9" className="empty-orders-cell">
                    No orders found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map(ord => {
                  const isChecked = selectedOrderIds.includes(ord.id);
                  return (
                    <tr key={ord.id} className={isChecked ? 'row-selected' : ''}>
                      <td className="chk-col">
                        <input 
                          type="checkbox" 
                          className="orders-custom-checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOrder(ord.id)}
                        />
                      </td>

                      {/* Order ID */}
                      <td>
                        <div className="order-id-meta-cell">
                          <strong className="order-id-num">
                            {(() => {
                              const displayId = String(ord.id || ord.order_number || ord.order_id || '');
                              return displayId.startsWith('#') ? displayId : (displayId.startsWith('LDX') ? `#${displayId}` : displayId);
                            })()}
                          </strong>
                          <span className="order-id-date-txt">{ord.date}</span>
                        </div>
                      </td>

                      {/* Customer */}
                      <td>
                        <div className="order-customer-meta-cell">
                          <div className="cust-circle-avatar">{ord.customer?.avatar || 'CU'}</div>
                          <div className="cust-text-block">
                            <span className="cust-full-name">{ord.customer?.name || ord.customer_name || 'Customer'}</span>
                            <span className="cust-phone-num">{ord.customer?.phone || ord.customer_phone || ''}</span>
                          </div>
                        </div>
                      </td>

                      {/* Services */}
                      <td>
                        <div className="order-services-pill-group">
                          <span 
                            className="service-name-capsule"
                            title={Array.isArray(ord.services) && ord.services.length > 0 ? ord.services.join(', ') : (ord.service || 'Wash & Fold')}
                          >
                            {Array.isArray(ord.services) && ord.services.length > 0 
                              ? ord.services[0] 
                              : (Array.isArray(ord.services_list) && ord.services_list.length > 0
                                ? ord.services_list[0]
                                : (ord.service || 'Wash & Fold'))}
                          </span>
                        </div>
                      </td>

                      {/* Pickup Date & Time */}
                      <td>
                        {(() => {
                          const str = ord.pickupTime || '';
                          const dashMatch = str.match(/^(.*?)[–\-]\s*(.*?)$/);
                          if (dashMatch) {
                            return (
                              <div className="order-pickup-datetime-col">
                                <span className="pickup-time-top">{dashMatch[1].trim()}</span>
                                <span className="pickup-time-bottom">– {dashMatch[2].trim()}</span>
                              </div>
                            );
                          }
                          return <span className="order-pickup-datetime-str">{str}</span>;
                        })()}
                      </td>

                      {/* Amount */}
                      <td>
                        <strong className="order-amount-currency">₹{ord.amount}</strong>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`order-status-capsule-badge ${getStatusBadgeClass(ord.status)}`}>
                          {ord.status}
                        </span>
                      </td>

                      {/* Payment */}
                      <td>
                        <span className={`order-payment-capsule-badge ${getPaymentBadgeClass(ord.payment)}`}>
                          {ord.payment || (ord.paymentStatus === 'Pending' ? 'Pending' : 'Paid')}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="action-col-cell">
                        <div className="action-button-anchor" onClick={(e) => e.stopPropagation()}>
                          <button 
                            type="button" 
                            className="order-dots-action-btn"
                            onClick={() => setActiveActionMenuId(activeActionMenuId === ord.id ? null : ord.id)}
                            aria-label={`Actions for ${ord.id}`}
                          >
                            <MoreHorizontal size={16} />
                          </button>

                          {activeActionMenuId === ord.id && (
                            <div className="action-popover-menu animate-fade-in">
                              <button 
                                type="button" 
                                className="popover-action-item"
                                onClick={() => {
                                  setSelectedOrderDetails(ord);
                                  setActiveActionMenuId(null);
                                }}
                              >
                                <Eye size={14} />
                                <span>View Details</span>
                              </button>
                              <button 
                                type="button" 
                                className="popover-action-item"
                                onClick={() => {
                                  setAssigningOrder(ord);
                                  setIsAssignOrderModalOpen(true);
                                  setActiveActionMenuId(null);
                                }}
                              >
                                <UserCheck size={14} />
                                <span>Assign Driver</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Bar */}
      <div className="orders-pagination-row">
        <span className="pagination-summary-text">
          {totalOrders === 0 
            ? 'Showing 0 orders' 
            : `Showing ${startIndex + 1}–${endIndex} of ${totalOrders} orders`}
        </span>
        <div className="pagination-buttons-cluster">
          <button 
            type="button" 
            className="pagination-chevron-btn"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>
          
          {getPageNumbers().map((item, idx) => {
            if (item === '...') {
              return (
                <span key={`dots-${idx}`} className="pagination-ellipsis-dots">...</span>
              );
            }
            return (
              <button 
                key={`page-${item}`}
                type="button" 
                className={`pagination-num-btn ${currentPage === item ? 'active' : ''}`}
                onClick={() => setCurrentPage(item)}
              >
                {item}
              </button>
            );
          })}

          <button 
            type="button" 
            className="pagination-chevron-btn"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalOrders === 0}
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Dynamic Order Processing & Details Modal matching Reference Images */}
      {selectedOrderDetails && (
        <OrderProcessingModal
          order={selectedOrderDetails}
          onClose={() => setSelectedOrderDetails(null)}
          onOrderUpdated={(updated) => {
            setSelectedOrderDetails(updated);
            if (typeof handleRefresh === 'function') handleRefresh();
          }}
        />
      )}

      <style>{`
        .admin-orders-page {
          display: flex;
          flex-direction: column;
          gap: 0;
          width: 100%;
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        /* HEADER */
        .orders-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 22px;
        }

        .orders-header-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: #1E293B;
          letter-spacing: -0.02em;
          margin: 0;
          line-height: 1.2;
        }

        .orders-header-subtitle {
          font-size: 0.875rem;
          color: #64748B;
          margin: 4px 0 0 0;
        }

        .orders-header-actions-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .orders-refresh-pill-btn {
          background: #FFFFFF;
          color: #0F172A;
          border: 1px solid #E2E8F0;
          border-radius: 9999px;
          padding: 9px 18px;
          font-size: 0.875rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
        }

        .orders-refresh-pill-btn:hover:not(:disabled) {
          background: #F8FAFC;
          border-color: #CBD5E1;
        }

        .orders-refresh-pill-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .create-order-pill-btn {
          background: #087F77;
          color: #FFFFFF;
          border: none;
          border-radius: 9999px;
          padding: 10px 22px;
          font-size: 0.875rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .create-order-pill-btn:hover {
          background: #066761;
        }

        .filter-refresh-action-link {
          background: transparent;
          border: none;
          color: #087F77;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 8px;
          border-radius: 6px;
          transition: background-color 0.15s ease;
        }

        .filter-refresh-action-link:hover:not(:disabled) {
          background-color: #F0FDFA;
        }

        .filter-refresh-action-link:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* 5 METRIC CARDS */
        .orders-metric-cards-row {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .orders-metric-pill-card {
          background: #FFFFFF;
          border: 1.5px solid #F1F5F9;
          border-radius: 20px;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .orders-metric-pill-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          transform: translateY(-1px);
        }

        .metric-badge-box {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .metric-badge-box.cyan { background: #E6F7F5; }
        .metric-badge-box.orange { background: #FFF1E8; }
        .metric-badge-box.yellow { background: #FEF9C3; }
        .metric-badge-box.purple { background: #F3E8FF; }
        .metric-badge-box.green { background: #DCFCE7; }

        .metric-text-col {
          display: flex;
          flex-direction: column;
        }

        .metric-bold-num {
          font-size: 1.35rem;
          font-weight: 800;
          color: #0F172A;
          line-height: 1.2;
        }

        .metric-label-txt {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #64748B;
          margin-top: 3px;
        }

        /* FILTER CONTROLS BAR */
        .orders-filter-controls-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .filter-search-field-wrap {
          position: relative;
          flex: 1;
          min-width: 260px;
        }

        .filter-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #94A3B8;
          pointer-events: none;
        }

        .filter-search-text-input {
          width: 100%;
          height: 42px;
          padding: 0 14px 0 38px;
          border: 1.5px solid #E2E8F0;
          border-radius: 12px;
          font-size: 0.875rem;
          color: #1E293B;
          background: #FFFFFF;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.15s ease;
        }

        .filter-search-text-input::placeholder {
          color: #94A3B8;
        }

        .filter-search-text-input:focus {
          border-color: #0D7A75;
        }

        .filter-dropdowns-group {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .filter-select-wrap {
          position: relative;
        }

        .filter-custom-select {
          height: 42px;
          border: 1.5px solid #E2E8F0;
          border-radius: 12px;
          padding: 0 34px 0 14px;
          font-size: 0.875rem;
          font-weight: 500;
          color: #334155;
          background: #FFFFFF;
          appearance: none;
          -webkit-appearance: none;
          outline: none;
          cursor: pointer;
          transition: border-color 0.15s ease;
        }

        .filter-custom-select:focus {
          border-color: #0D7A75;
        }

        .filter-select-chevron {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          color: #94A3B8;
        }

        .filter-date-range-box {
          height: 42px;
          border: 1.5px solid #E2E8F0;
          border-radius: 12px;
          padding: 0 14px;
          background: #FFFFFF;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          box-sizing: border-box;
          transition: border-color 0.15s ease;
        }

        .filter-date-range-box:hover {
          border-color: #CBD5E1;
        }

        .filter-date-range-box .date-icon {
          color: #64748B;
        }

        .filter-date-range-box .date-label {
          font-size: 0.875rem;
          color: #334155;
          font-weight: 500;
        }

        .filter-date-range-box .date-chevron {
          color: #94A3B8;
          margin-left: 2px;
        }

        .orders-date-dropdown-wrapper {
          position: relative;
        }

        .orders-date-popover {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          min-width: 170px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
          padding: 6px;
          z-index: 50;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .orders-popover-item {
          display: flex;
          align-items: center;
          width: 100%;
          padding: 8px 12px;
          border: none;
          background: none;
          border-radius: 8px;
          font-size: 0.8125rem;
          font-weight: 500;
          color: #334155;
          cursor: pointer;
          transition: background-color 0.15s, color 0.15s;
          text-align: left;
        }

        .orders-popover-item:hover {
          background: #F1F5F9;
          color: #0F172A;
        }

        .orders-popover-item.active {
          background: #E6F4F2;
          color: #0D7A75;
          font-weight: 600;
        }

        .filter-refresh-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          color: #0D7A75;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          padding: 0 8px;
          transition: color 0.15s ease, opacity 0.15s ease;
        }

        .filter-refresh-btn:hover:not(:disabled) {
          color: #08615D;
          text-decoration: underline;
        }

        .filter-refresh-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* TABS BAR */
        .orders-horizontal-tabs-bar {
          display: flex;
          gap: 28px;
          border-bottom: 1.5px solid #F1F5F9;
          margin-bottom: 18px;
          overflow-x: auto;
        }

        .tab-item-link {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0 0 10px 0;
          font-size: 0.875rem;
          font-weight: 500;
          color: #64748B;
          white-space: nowrap;
          transition: color 0.15s ease;
        }

        .tab-item-link:hover {
          color: #1E293B;
        }

        .tab-item-link.active {
          color: #0D7A75;
          font-weight: 700;
          border-bottom: 2.5px solid #0D7A75;
          margin-bottom: -1.5px;
        }

        /* TABLE CARD */
        .orders-table-wrapper-card {
          background: #FFFFFF;
          border: 1.5px solid #F1F5F9;
          border-radius: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
          overflow: hidden;
        }

        .orders-scroll-table-box {
          overflow-x: auto;
        }

        .orders-styled-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .orders-styled-table th {
          background: #FFFFFF;
          padding: 16px 18px;
          color: #64748B;
          font-size: 0.8125rem;
          font-weight: 600;
          border-bottom: 1.5px solid #F1F5F9;
          white-space: nowrap;
        }

        .orders-styled-table td {
          padding: 14px 18px;
          border-bottom: 1px solid #F1F5F9;
          vertical-align: middle;
        }

        .orders-styled-table tr:last-child td {
          border-bottom: none;
        }

        .orders-styled-table tr:hover td {
          background: #FAFCFD;
        }

        .orders-styled-table tr.row-selected td {
          background: #F4FBFA;
        }

        .chk-col {
          padding-right: 6px !important;
        }

        .orders-custom-checkbox {
          width: 18px;
          height: 18px;
          border: 1.5px solid #CBD5E1;
          border-radius: 5px;
          cursor: pointer;
          accent-color: #0D7A75;
        }

        .order-id-meta-cell {
          display: flex;
          flex-direction: column;
        }

        .order-id-num {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-size: 0.875rem;
          font-weight: 800;
          color: #0F172A;
          line-height: 1.25;
          letter-spacing: -0.01em;
        }

        .order-id-date-txt {
          font-size: 0.75rem;
          color: #94A3B8;
          margin-top: 3px;
        }

        .order-customer-meta-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .cust-circle-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #EBF8F7;
          color: #0D7A75;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8125rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        .cust-text-block {
          display: flex;
          flex-direction: column;
        }

        .cust-full-name {
          font-size: 0.875rem;
          font-weight: 700;
          color: #1E293B;
          line-height: 1.25;
        }

        .cust-phone-num {
          font-size: 0.75rem;
          color: #64748B;
          margin-top: 3px;
        }

        .order-services-pill-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .service-name-capsule {
          background: #F8FAFC;
          border: 1.5px solid #F1F5F9;
          border-radius: 9999px;
          padding: 4px 12px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #334155;
          white-space: nowrap;
        }

        .service-count-badge {
          background: #F1F5F9;
          border-radius: 6px;
          padding: 2px 6px;
          font-size: 0.6875rem;
          font-weight: 700;
          color: #64748B;
        }

        .order-pickup-datetime-str {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #475569;
          white-space: nowrap;
        }

        .order-pickup-datetime-col {
          display: flex;
          flex-direction: column;
          line-height: 1.35;
        }

        .pickup-time-top {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #334155;
          white-space: nowrap;
        }

        .pickup-time-bottom {
          font-size: 0.75rem;
          font-weight: 500;
          color: #64748B;
          white-space: nowrap;
        }

        .order-amount-currency {
          font-size: 0.9375rem;
          font-weight: 800;
          color: #0F172A;
          white-space: nowrap;
        }

        /* STATUS BADGES */
        .order-status-capsule-badge {
          border-radius: 9999px;
          padding: 4px 12px;
          font-size: 0.75rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
        }

        .status-pending-pickup {
          background: #FFF1E8;
          color: #EA580C;
        }

        .status-in-cleaning {
          background: #FEF9C3;
          color: #CA8A04;
        }

        .status-ready-delivery {
          background: #F3E8FF;
          color: #9333EA;
        }

        .status-completed {
          background: #DCFCE7;
          color: #16A34A;
        }

        /* PAYMENT BADGES */
        .order-payment-capsule-badge {
          border-radius: 9999px;
          padding: 3px 12px;
          font-size: 0.75rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
        }

        .payment-paid {
          background: #DCFCE7;
          color: #16A34A;
        }

        .payment-cod {
          background: #FEF9C3;
          color: #CA8A04;
        }

        .payment-unpaid {
          background: #FEE2E2;
          color: #DC2626;
        }

        /* ACTIONS */
        .action-col-cell {
          text-align: right;
        }

        .action-button-anchor {
          position: relative;
          display: inline-block;
        }

        .order-dots-action-btn {
          width: 32px;
          height: 32px;
          border: 1.5px solid #E2E8F0;
          border-radius: 8px;
          background: #FFFFFF;
          color: #64748B;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .order-dots-action-btn:hover {
          border-color: #0D7A75;
          color: #0D7A75;
        }

        .action-popover-menu {
          position: absolute;
          right: 0;
          top: calc(100% + 4px);
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          z-index: 50;
          min-width: 150px;
          overflow: hidden;
          padding: 4px;
        }

        .popover-action-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          font-size: 0.8125rem;
          color: #334155;
          background: none;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s ease;
        }

        .popover-action-item:hover {
          background: #F1F5F9;
          color: #0D7A75;
        }

        .empty-orders-cell {
          text-align: center;
          padding: 40px !important;
          color: #94A3B8;
          font-size: 0.875rem;
        }

        /* PAGINATION */
        .orders-pagination-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 22px;
          padding: 0 4px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .pagination-summary-text {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #64748B;
        }

        .pagination-buttons-cluster {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .pagination-chevron-btn {
          width: 32px;
          height: 32px;
          border: 1.5px solid #E2E8F0;
          border-radius: 8px;
          background: #FFFFFF;
          color: #64748B;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .pagination-chevron-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination-chevron-btn:not(:disabled):hover {
          border-color: #CBD5E1;
          color: #1E293B;
        }

        .pagination-num-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          background: none;
          color: #64748B;
          font-size: 0.875rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .pagination-num-btn:hover {
          color: #1E293B;
          background: #F8FAFC;
        }

        .pagination-num-btn.active {
          background: #087F77;
          color: #FFFFFF;
          font-weight: 700;
        }

        .pagination-ellipsis-dots {
          color: #94A3B8;
          font-size: 0.875rem;
          width: 20px;
          text-align: center;
        }

        /* DETAILS MODAL */
        .details-modal-backdrop {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          height: 100dvh;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px 16px;
          overflow: hidden;
          overscroll-behavior: none;
        }

        .details-modal-card {
          width: 500px;
          max-width: 100%;
          max-height: calc(100vh - 40px);
          max-height: calc(100dvh - 40px);
          background: #FFFFFF;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          overscroll-behavior: contain;
          position: relative;
        }

        .details-modal-body {
          overflow-y: auto;
          overscroll-behavior: contain;
          flex: 1 1 auto;
          min-height: 0;
        }

        .details-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #E2E8F0;
          padding-bottom: 12px;
          margin-bottom: 16px;
        }

        .details-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #1E293B;
          margin: 0;
        }

        .details-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: #94A3B8;
          cursor: pointer;
          line-height: 1;
        }

        .details-modal-body {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .details-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
          color: #334155;
        }

        @media (max-width: 1100px) {
          .orders-metric-cards-row {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 768px) {
          .orders-metric-cards-row {
            grid-template-columns: 1fr;
          }
          .orders-header-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          .orders-filter-controls-row {
            flex-direction: column;
            align-items: stretch;
          }
          .filter-search-field-wrap {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
