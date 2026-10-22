import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAdmin } from '../../context/AdminContext';
import { 
  Package, 
  Truck, 
  ShoppingBag, 
  CircleDollarSign,
  ArrowUp,
  Calendar, 
  ChevronRight, 
  ChevronDown,
  MoreHorizontal, 
  Plus, 
  UserPlus, 
  Tag, 
  Sparkles,
  Eye,
  Check,
  X
} from 'lucide-react';
import { formatDisplayDate } from '../../utils/dateFilterUtils';
import { formatOrderId } from '../../utils/helpers';
import { BASELINE_ADMIN_ORDERS, isStatusMatchingCategory } from './AdminOrdersPage';

// Indian Rupee (₹) symbol inside circle icon matching reference image and Lucide Circle style
const CircleRupeeSign = ({ size = 23, color = "currentColor", strokeWidth = 2, className = '' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth={strokeWidth} 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M8 7.5h8" />
    <path d="M8 11h5" />
    <path d="M10 7.5v6" />
    <path d="M10 7.5h2.8c1.5 0 2.7.75 2.7 2s-1.2 2-2.7 2H10" />
    <path d="M10 13.5l4.5 5" />
  </svg>
);

// Washing Machine front-load icon matching reference image
const WasherIcon = ({ size = 23, color = "#D97706" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <rect x="3" y="2" width="18" height="20" rx="3" />
    <circle cx="12" cy="13" r="4.5" />
    <circle cx="12" cy="13" r="1.5" />
    <circle cx="12" cy="5.5" r="0.9" fill={color} />
  </svg>
);

export const AdminDashboardPage = () => {
  const { 
    orders, 
    tasks,
    updateOrderStatus,
    setAdminTab, 
    navigateToOrdersWithFilter,
    setIsCreateOrderDrawerOpen, 
    setIsAddCustomerModalOpen, 
    setIsAddServiceModalOpen,
    setIsManageServicesModalOpen 
  } = useAdmin();

  const handleStatCardClick = (st) => {
    if (!st || st.disableNavigation || st.isRevenue || !st.targetTab) {
      return;
    }
    if (typeof navigateToOrdersWithFilter === 'function') {
      navigateToOrdersWithFilter(st.targetTab, st.targetStatus);
    } else {
      setAdminTab('orders');
    }
  };

  const [pickupTab, setPickupTab] = useState('all');
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [chartTimeframe, setChartTimeframe] = useState('7d');
  const [serviceChartPeriod, setServiceChartPeriod] = useState('This Week');
  const [hoveredDonutKey, setHoveredDonutKey] = useState(null);

  const handleServiceSliceClick = (serviceName) => {
    if (typeof navigateToOrdersWithFilter === 'function') {
      navigateToOrdersWithFilter('all', 'all', serviceName);
    } else {
      setAdminTab('orders');
    }
  };

  // Close action dropdown menu on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (activeActionMenuId && !e.target.closest('.action-menu-anchor')) {
        setActiveActionMenuId(null);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveActionMenuId(null);
        setSelectedOrderDetails(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeActionMenuId]);

  // Keep modal view in sync with live order changes
  useEffect(() => {
    if (selectedOrderDetails) {
      const current = orders?.find(o => o.id === selectedOrderDetails.id);
      if (current && current.status !== selectedOrderDetails.status) {
        setSelectedOrderDetails(prev => ({ ...prev, ...current }));
      }
    }
  }, [orders, selectedOrderDetails]);

  // Status classification helpers
  const isOrderCompleted = (status) => {
    const s = String(status || '').toLowerCase();
    return s.includes('complete') || s.includes('delivered');
  };

  const isOrderReady = (status) => {
    const s = String(status || '').toLowerCase();
    return s.includes('ready');
  };

  const isOrderProcessing = (status) => {
    const s = String(status || '').toLowerCase();
    return s.includes('cleaning') || s.includes('processing') || s.includes('washing') || s.includes('scheduled') || s.includes('transit') || s.includes('picked up') || s.includes('pickup scheduled');
  };

  const isOrderNeedingAttention = (order) => {
    if (!order) return false;
    const s = String(order.status || '').toLowerCase();
    const hasNoDriver = !order.driver || order.driver === 'Not Assigned' || order.driver === '—' || order.driver === '';
    if (s.includes('pending') || s.includes('review') || s.includes('placed') || s.includes('payment_pending')) return true;
    if (hasNoDriver && !isOrderCompleted(order.status)) return true;
    return false;
  };

  // Synchronize dashboard data with live real-time orders from backend
  const combinedOrders = useMemo(() => {
    if (orders && orders.length > 0) {
      return orders;
    }
    return BASELINE_ADMIN_ORDERS;
  }, [orders]);

  // Sparkline heights for top stat cards
  const barHeights = [6, 11, 16, 22];

  // Dynamic Top 5 Stat Cards bound to unified orders and synchronized with Orders section
  const stats = useMemo(() => {
    const list = combinedOrders || [];
    const totalCount = list.length;

    const needAttentionCount = list.filter(o => isStatusMatchingCategory(o?.status, 'pending')).length;
    const processingCount = list.filter(o => isStatusMatchingCategory(o?.status, 'cleaning')).length;
    const readyCount = list.filter(o => isStatusMatchingCategory(o?.status, 'ready')).length;

    const completedOrders = list.filter(o => isStatusMatchingCategory(o?.status, 'completed'));
    const completedRevenue = completedOrders.reduce((sum, o) => {
      const amt = Number(o.total_amount || o.amount || 0);
      return sum + (isNaN(amt) ? 0 : amt);
    }, 0);

    return [
      { 
        label: "Total Orders", 
        value: String(totalCount).padStart(2, '0'), 
        change: "12%", 
        icon: <Package size={23} strokeWidth={2} />, 
        theme: "blue",
        targetTab: "all",
        targetStatus: "all",
        barColors: ["#BCE0FD", "#78BCFB", "#389BF9", "#0284C7"]
      },
      { 
        label: "Need attention", 
        value: String(needAttentionCount).padStart(2, '0'), 
        change: needAttentionCount > 0 ? "Active" : "All set", 
        icon: <Truck size={23} strokeWidth={2} />, 
        theme: "coral",
        targetTab: "pending",
        targetStatus: "Pending Pickup",
        barColors: ["#FFD0C4", "#FFAA95", "#FF8263", "#FA5A3A"]
      },
      { 
        label: "Currently processing", 
        value: String(processingCount).padStart(2, '0'), 
        change: "8%", 
        icon: <WasherIcon size={23} color="#D97706" />, 
        theme: "amber",
        targetTab: "cleaning",
        targetStatus: "In Cleaning",
        barColors: ["#FDE68A", "#FCD34D", "#F59E0B", "#D97706"]
      },
      { 
        label: "Ready to go", 
        value: String(readyCount).padStart(2, '0'), 
        change: "20%", 
        icon: <ShoppingBag size={23} strokeWidth={2} />, 
        theme: "purple",
        targetTab: "ready",
        targetStatus: "Ready for Delivery",
        barColors: ["#DDD6FE", "#C4B5FD", "#A78BFA", "#8B5CF6"]
      },
      { 
        label: "From completed orders", 
        value: `₹${Math.round(completedRevenue).toLocaleString('en-IN')}`, 
        change: "22%", 
        icon: <CircleRupeeSign size={23} strokeWidth={2} />, 
        theme: "green",
        isRevenue: true,
        disableNavigation: true,
        barColors: ["#A7F3D0", "#6EE7B7", "#34D399", "#10B981"]
      }
    ];
  }, [combinedOrders]);

  // Dynamic Service Breakdown & Donut Slices based on unified orders (matching Laundry Staff Portal logic)
  const { serviceBreakdown, donutSlices, totalOrdersCount } = useMemo(() => {
    const list = combinedOrders || [];

    // Filter by timeframe if selected
    let targetOrders = list;
    if (serviceChartPeriod === 'This Week') {
      const now = Date.now();
      const weekMs = 7 * 24 * 60 * 60 * 1000;
      const weekOrders = list.filter(o => {
        const ts = o.createdAt || o.placedAt || o.date;
        const d = ts ? new Date(ts).getTime() : 0;
        return d > 0 && (now - d) <= weekMs;
      });
      if (weekOrders.length > 0) targetOrders = weekOrders;
    } else if (serviceChartPeriod === 'This Month') {
      const now = new Date();
      const monthOrders = list.filter(o => {
        const ts = o.createdAt || o.placedAt || o.date;
        const d = ts ? new Date(ts) : null;
        return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
      if (monthOrders.length > 0) targetOrders = monthOrders;
    }

    const totalCount = targetOrders.length;

    // Exact services and colors matching the reference image
    const SERVICE_CONFIG = [
      { name: 'Wash & Fold', color: '#25B4C2' },
      { name: 'Dry Cleaning', color: '#68D391' },
      { name: 'Wash & Iron', color: '#63B3ED' },
      { name: 'Steam Iron', color: '#81E6D9' },
      { name: 'Shoe Laundry', color: '#F6AD55' },
      { name: 'Home Care', color: '#FC8181' }
    ];

    const counts = {};
    SERVICE_CONFIG.forEach(s => { counts[s.name] = 0; });

    const categorizeService = (sName, order) => {
      const s = String(sName || '').toLowerCase();
      if (s.includes('shoe') || s.includes('express') || order?.isExpress) return 'Shoe Laundry';
      if (s.includes('dry')) return 'Dry Cleaning';
      if (s.includes('wash') && s.includes('iron')) return 'Wash & Iron';
      if (s.includes('steam') || s.includes('iron')) return 'Steam Iron';
      if (s.includes('home')) return 'Home Care';
      if (s.includes('wash') || s.includes('fold')) return 'Wash & Fold';
      return 'Wash & Fold';
    };

    targetOrders.forEach(o => {
      const oServices = Array.isArray(o.services) && o.services.length > 0
        ? o.services
        : (Array.isArray(o.services_list) && o.services_list.length > 0
          ? o.services_list
          : (Array.isArray(o.items) && o.items.length > 0
            ? o.items.map(it => it.service_name || it.category_name || it.category || 'Wash & Fold')
            : [o.service || 'Wash & Fold']));

      oServices.forEach(sName => {
        const cat = categorizeService(sName, o);
        counts[cat] = (counts[cat] || 0) + 1;
      });
    });

    const totalTallied = Object.values(counts).reduce((a, b) => a + b, 0) || 1;

    let breakdown = SERVICE_CONFIG.map(s => {
      const c = counts[s.name] || 0;
      const pct = totalTallied > 0 ? Math.round((c / totalTallied) * 100) : 0;
      return { ...s, count: c, pct };
    });

    if (totalCount > 0) {
      const sumPct = breakdown.reduce((acc, s) => acc + s.pct, 0);
      if (sumPct !== 100 && breakdown.length > 0) {
        const maxSlice = breakdown.reduce((prev, curr) => (curr.pct > prev.pct ? curr : prev), breakdown[0]);
        maxSlice.pct += (100 - sumPct);
      }
    }

    // Geometry matching reference image seamlessly without gaps
    const radius = 80;
    const strokeWidth = 28;
    const circumference = 2 * Math.PI * radius; // ~502.6548

    let accumulatedCircumference = 0;
    const slices = breakdown.map(st => {
      const sliceRatio = totalTallied > 0 ? st.count / totalTallied : 0;
      const sliceLength = sliceRatio > 0 ? sliceRatio * circumference : 0;
      const dashArray = `${sliceLength} ${circumference - sliceLength}`;
      const dashOffset = -accumulatedCircumference;
      if (sliceRatio > 0) {
        accumulatedCircumference += sliceRatio * circumference;
      }
      return {
        ...st,
        dashArray,
        dashOffset
      };
    });

    return {
      serviceBreakdown: breakdown,
      donutSlices: slices,
      totalOrdersCount: totalCount
    };
  }, [combinedOrders, serviceChartPeriod]);

  // Dynamically compute chart data from unified orders
  const { chartDays, scaleMax, yAxisTicks } = useMemo(() => {
    const list = combinedOrders || [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (chartTimeframe === '30d') {
      const weeks = [
        { day: 'Week 1', comp: 0, inClean: 0, pend: 0, daysAgoStart: 28, daysAgoEnd: 22 },
        { day: 'Week 2', comp: 0, inClean: 0, pend: 0, daysAgoStart: 21, daysAgoEnd: 15 },
        { day: 'Week 3', comp: 0, inClean: 0, pend: 0, daysAgoStart: 14, daysAgoEnd: 8 },
        { day: 'Week 4', comp: 0, inClean: 0, pend: 0, daysAgoStart: 7, daysAgoEnd: 0 }
      ];

      const nowMs = Date.now();
      const ONE_DAY_MS = 24 * 60 * 60 * 1000;

      list.forEach((o, idx) => {
        const orderTime = o.createdAt || o.placedAt || o.updatedAt || nowMs;
        const diffDays = Math.max(0, Math.floor((nowMs - new Date(orderTime).getTime()) / ONE_DAY_MS));

        const wk = weeks.find(w => diffDays >= w.daysAgoEnd && diffDays <= w.daysAgoStart) || weeks[idx % weeks.length];
        if (isOrderCompleted(o.status)) wk.comp += 1;
        else if (isOrderProcessing(o.status) || isOrderReady(o.status)) wk.inClean += 1;
        else wk.pend += 1;
      });

      const maxVal = Math.max(...weeks.map(w => w.comp + w.inClean + w.pend), 8);
      const computedScaleMax = Math.max(40, Math.ceil(maxVal / 20) * 20);
      const ticks = [computedScaleMax, Math.round(computedScaleMax * 0.75), Math.round(computedScaleMax * 0.5), Math.round(computedScaleMax * 0.25), 0];

      return {
        chartDays: weeks,
        scaleMax: computedScaleMax,
        yAxisTicks: ticks
      };
    }

    // 7 Days: dynamically generate 7 calendar days up to today
    const daysArr = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dayLabel = `${d.getDate()} ${months[d.getMonth()]}`;
      const isoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      daysArr.push({
        day: dayLabel,
        isoDate: isoDate,
        dateObj: d,
        comp: 0,
        inClean: 0,
        pend: 0
      });
    }

    list.forEach((o, idx) => {
      const orderTs = o.createdAt || o.placedAt || o.updatedAt;
      let matchedDay = null;

      if (orderTs) {
        const d = new Date(orderTs);
        if (!isNaN(d.getTime())) {
          matchedDay = daysArr.find(dayItem => dayItem.dateObj.toDateString() === d.toDateString());
        }
      }

      if (!matchedDay && o.pickup_date) {
        matchedDay = daysArr.find(dayItem => String(o.pickup_date).startsWith(dayItem.isoDate));
      }
      if (!matchedDay && o.pickup?.date) {
        matchedDay = daysArr.find(dayItem => String(o.pickup.date).startsWith(dayItem.isoDate));
      }
      if (!matchedDay && o.date) {
        matchedDay = daysArr.find(dayItem => String(o.date).includes(dayItem.day));
      }

      if (!matchedDay) {
        // Distribute non-matching baseline/historical orders across preceding days
        const hashSeed = Math.abs(String(o.id || idx).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) + idx);
        const dayIdx = hashSeed % Math.max(1, daysArr.length - 1);
        matchedDay = daysArr[dayIdx];
      }

      if (isOrderCompleted(o.status)) {
        matchedDay.comp += 1;
      } else if (isOrderProcessing(o.status) || isOrderReady(o.status)) {
        matchedDay.inClean += 1;
      } else {
        matchedDay.pend += 1;
      }
    });

    const maxVal = Math.max(...daysArr.map(d => d.comp + d.inClean + d.pend), 8);
    const computedScaleMax = Math.max(20, Math.ceil(maxVal / 10) * 10);
    const ticks = [computedScaleMax, Math.round(computedScaleMax * 0.75), Math.round(computedScaleMax * 0.5), Math.round(computedScaleMax * 0.25), 0];

    return {
      chartDays: daysArr,
      scaleMax: computedScaleMax,
      yAxisTicks: ticks
    };
  }, [combinedOrders, chartTimeframe]);

  const getAvatarStyle = (avatar) => {
    const avStr = typeof avatar === 'string' ? avatar : 'CU';
    switch (avStr) {
      case 'RM': return { background: '#E0F2FE', color: '#0284C7' };
      case 'PS': return { background: '#EDE9FE', color: '#7C3AED' };
      case 'AN': return { background: '#F3E8FF', color: '#9333EA' };
      case 'SR': return { background: '#CCFBF1', color: '#0D9488' };
      case 'KV': return { background: '#FEF08A', color: '#854D0E' };
      case 'NK': return { background: '#EDE9FE', color: '#7C3AED' };
      default: {
        const palettes = [
          { background: '#E0F2FE', color: '#0284C7' },
          { background: '#EDE9FE', color: '#7C3AED' },
          { background: '#CCFBF1', color: '#0D9488' },
          { background: '#FEF08A', color: '#854D0E' },
          { background: '#DCFCE7', color: '#16A34A' }
        ];
        const hash = avStr.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        return palettes[hash % palettes.length];
      }
    }
  };

  const getStatusClass = (status = '') => {
    const s = String(status || '').toLowerCase();
    if (s.includes('pickup scheduled') || s.includes('scheduled')) return 'pickup-scheduled';
    if (s.includes('pending')) return 'pending-pickup';
    if (s.includes('cleaning') || s.includes('processing')) return 'in-cleaning';
    if (s.includes('ready')) return 'ready-for-delivery';
    if (s.includes('delivered') || s.includes('completed')) return 'delivered';
    return 'pickup-scheduled';
  };

  // Recent Orders dynamically bound to unified orders (62 orders)
  const recentOrders = useMemo(() => {
    if (!combinedOrders || combinedOrders.length === 0) return [];

    return [...combinedOrders]
      .sort((a, b) => {
        const timeA = a.updatedAt || a.placedAt || a.createdAt || (a.pickup ? new Date(a.pickup.date).getTime() : 0);
        const timeB = b.updatedAt || b.placedAt || b.createdAt || (b.pickup ? new Date(b.pickup.date).getTime() : 0);
        return timeB - timeA;
      })
      .slice(0, 8)
      .map(o => {
        const idDisplay = formatOrderId(o.order_number || o.order_id || o.code || o.id);
        const rawCust = o.pickup_full_name || o.customer_name || (typeof o.customer === 'string' ? o.customer : o.customer?.name) || 'Customer';
        const custName = typeof rawCust === 'string' ? rawCust : 'Customer';
        const custAvatar = (o.customer && typeof o.customer === 'object' && typeof o.customer.avatar === 'string' && o.customer.avatar)
          ? o.customer.avatar
          : (custName.trim() ? custName.trim().split(/\s+/).map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'CU');
        const itemsList = Array.isArray(o.items)
          ? o.items
          : (o.items && typeof o.items === 'object' ? Object.values(o.items) : []);
        const servicesList = o.services_list || (Array.isArray(o.services) ? o.services : (itemsList.length > 0 ? itemsList.map(it => it.service_name || it.item_name || it.name).filter(Boolean) : ['Wash & Fold']));
        const pickupStr = o.pickup_time_slot ? `${o.pickup_date || 'Today'}, ${o.pickup_time_slot}` : (o.pickupTime || o.date || 'Today');
        const amt = o.total_amount ? Number(o.total_amount) : (o.amount ? Number(o.amount) : 0);
        const stat = o.status_display || o.status || 'Pending Pickup';

        return {
          ...o,
          id: idDisplay,
          rawId: o.rawId || o.id,
          customer: {
            name: custName,
            avatar: custAvatar,
            phone: o.pickup_phone || o.customer_phone || o.customer?.phone || '',
            email: o.customer_email || o.customer?.email || '',
            address: o.pickup_address || o.customer?.address || ''
          },
          services: servicesList,
          pickupTime: pickupStr,
          amount: amt,
          status: stat,
          payment: o.payment_status === 'PAID' ? 'Paid' : (o.payment || 'Paid'),
          driver: o.assigned_pickup_driver_detail?.full_name || o.driver || 'Not Assigned'
        };
      });
  }, [combinedOrders]);

  // Extract concise address in "Area, City" format matching reference image (e.g. "Banaswadi, Bengaluru")
  const formatConciseAddress = (address, rawObj = {}) => {
    if (rawObj?.areaColony) {
      return `${rawObj.areaColony}, ${rawObj?.city || 'Bengaluru'}`;
    }
    if (typeof address === 'object' && address !== null) {
      const area = address.areaColony || address.area || address.locality || '';
      const city = address.city || 'Bengaluru';
      if (area) return `${area}, ${city}`;
    }
    const str = typeof address === 'string' ? address.trim() : '';
    if (!str) return 'Banaswadi, Bengaluru';

    const KNOWN_AREAS = [
      'Banaswadi', 'Indiranagar', 'Whitefield', 'Marathahalli', 'HSR Layout',
      'Koramangala', 'Jayanagar', 'JP Nagar', 'Malleshwaram', 'Hebbal',
      'Yelahanka', 'Electronic City', 'Bellandur', 'Sarjapur', 'Rajajinagar',
      'BTM Layout', 'Richmond Town', 'HRBR Layout', 'Frazer Town', 'Kalyan Nagar',
      'Ulsoor', 'MG Road', 'Brigade Road', 'Sadashivanagar', 'Domlur', 'Basavanagudi'
    ];

    for (const known of KNOWN_AREAS) {
      const regex = new RegExp(`\\b${known}\\b`, 'i');
      if (regex.test(str)) {
        return `${known}, Bengaluru`;
      }
    }

    let cleaned = str.replace(/[-–—]?\s*\b\d{6}\b/g, '').trim();
    const parts = cleaned.split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const last = parts[parts.length - 1];
      const secondLast = parts[parts.length - 2];
      return `${secondLast}, ${last}`;
    }
    return parts[0] ? `${parts[0]}, Bengaluru` : 'Bengaluru';
  };

  const formatPickupOrderId = (rawId) => {
    if (!rawId) return 'FC-10284';
    const formatted = formatOrderId(rawId);
    return formatted ? formatted.replace(/^#/, '') : String(rawId).replace(/^#/, '');
  };

  const parsePickupSlot = (slotStr, defaultStart = '09:00', defaultEnd = '11:00 AM') => {
    if (!slotStr) return { start: defaultStart, end: defaultEnd };
    const clean = slotStr.includes(',') ? slotStr.split(',')[1].trim() : String(slotStr).trim();
    const parts = clean.split(/[–—-]| to /);
    let start = (parts[0] || defaultStart).trim();
    let end = (parts[1] || defaultEnd).trim();

    start = start.replace(/\s*(AM|PM)\b/i, '').trim();
    if (/^\d:\d{2}/.test(start)) start = '0' + start;

    if (/^\d:\d{2}/.test(end)) end = '0' + end;
    if (!/(AM|PM)/i.test(end)) {
      end = end + ' AM';
    }
    return { start, end };
  };

  // Exact baseline cards matching reference image and Pickup & Delivery section without # prefix
  const BASELINE_PICKUPS = [
    { timeStart: '09:00', timeEnd: '11:00 AM', id: 'FC-10284', name: 'Rohan Mehta', area: 'Banaswadi, Bengaluru', type: 'Pickup', status: 'Assigned' },
    { timeStart: '11:00', timeEnd: '01:00 PM', id: 'FC-10286', name: 'Arjun Nair', area: 'Indiranagar, Bengaluru', type: 'Delivery', status: 'Assigned' },
    { timeStart: '02:00', timeEnd: '04:00 PM', id: 'FC-10287', name: 'Sneha Reddy', area: 'Whitefield, Bengaluru', type: 'Pickup', status: 'Pending' },
    { timeStart: '03:00', timeEnd: '05:00 PM', id: 'FC-10288', name: 'Karan Verma', area: 'Marathahalli, Bengaluru', type: 'Delivery', status: 'Assigned' }
  ];

  // Today's Pickup & Delivery dynamically bound to live order records from the exact same source as Pickup & Delivery section
  const pickupDeliveries = useMemo(() => {
    const list = combinedOrders || [];
    if (!orders || orders.length === 0) {
      return BASELINE_PICKUPS.map(baseItem => ({
        ...baseItem,
        id: formatPickupOrderId(baseItem.id),
        area: formatConciseAddress(baseItem.area)
      }));
    }

    // Map live orders into today's pickup & delivery cards matching exact IDs from Pickup & Delivery section
    return list.map((live, idx) => {
      const isDeliv = isOrderReady(live.status) || isOrderCompleted(live.status) || String(live.status).toLowerCase().includes('transit') || String(live.status).toLowerCase().includes('delivery');
      const hasDriver = Boolean(
        (live.driver && live.driver !== 'Not Assigned' && live.driver !== '—' && live.driver !== '') ||
        live.assigned_pickup_driver_detail ||
        live.assigned_pickup_driver ||
        live.assigned_delivery_driver ||
        live.assignedAgentName
      );
      const { start, end } = parsePickupSlot(live.pickup_time_slot || live.pickupTime, '09:00', '11:00 AM');
      const conciseArea = formatConciseAddress(live.pickup_address || live.customer?.address || live.address, live);
      const orderId = formatPickupOrderId(live.order_number || live.order_id || live.code || live.id || `FC-1028${idx}`);

      return {
        id: orderId,
        name: live.pickup_full_name || live.customer_name || live.customer?.name || 'Customer',
        area: conciseArea || 'Bengaluru',
        timeStart: start,
        timeEnd: end,
        type: isDeliv ? 'Delivery' : 'Pickup',
        status: hasDriver ? 'Assigned' : (String(live.status).toLowerCase().includes('pending') ? 'Pending' : (live.status || 'Pending')),
        rawOrder: live
      };
    });
  }, [combinedOrders, orders]);

  const pickupCounts = useMemo(() => {
    const list = combinedOrders || [];
    const allDeliveries = list.filter(o => isOrderReady(o.status) || isOrderCompleted(o.status) || String(o.status).toLowerCase().includes('transit') || String(o.status).toLowerCase().includes('delivery'));
    const allPickups = list.filter(o => !allDeliveries.includes(o));

    if (orders && orders.length > 0) {
      return {
        all: list.length,
        pickups: allPickups.length,
        deliveries: allDeliveries.length
      };
    }

    const basePickups = 10;
    const baseDeliveries = 8;
    return {
      all: basePickups + baseDeliveries,
      pickups: basePickups,
      deliveries: baseDeliveries
    };
  }, [combinedOrders, orders]);

  const filteredPickups = useMemo(() => {
    const filtered = pickupDeliveries.filter(p => {
      if (pickupTab === 'pickups') return p.type === 'Pickup';
      if (pickupTab === 'deliveries') return p.type === 'Delivery';
      return true;
    });
    // Display only 5–6 records (maximum 6) at a time to keep the section clean and organized
    return filtered.slice(0, 6);
  }, [pickupDeliveries, pickupTab]);

  return (
    <div className="admin-dashboard-page animate-fade-in">
      {/* Header Row */}
      <div className="dash-header-row">
        <div>
          <span className="dash-greeting-tag">GOOD MORNING, ADMIN</span>
          <h1 className="dash-title">
            Here's what's happening <span className="text-teal">today.</span>
          </h1>
          <p className="dash-sub">Here's your business overview for today.</p>
        </div>

        <div className="date-picker-dropdown">
          <Calendar size={16} className="text-teal" />
          <span>{formatDisplayDate(new Date(), { weekday: true })}</span>
        </div>
      </div>

      {/* 5 Stats Cards Grid - Exact match with reference image and dynamically clickable */}
      <div className="dash-stats-grid">
        {stats.map((st, i) => {
          const isClickable = !st.disableNavigation;
          return (
            <div 
              key={i} 
              className={`dash-stat-card ${st.theme}`}
              onClick={isClickable ? () => handleStatCardClick(st) : undefined}
              role={isClickable ? "button" : undefined}
              tabIndex={isClickable ? 0 : undefined}
              onKeyDown={isClickable ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleStatCardClick(st);
                }
              } : undefined}
              style={{ cursor: isClickable ? 'pointer' : 'default' }}
              title={isClickable ? `View ${st.label} in Orders` : undefined}
            >
            <div className="stat-card-top">
              <div className="stat-icon-wrap">
                {st.icon}
              </div>
              <div className="stat-card-val-col">
                <div className={`stat-val ${st.isRevenue ? 'rev-val' : ''}`}>
                  {st.value}
                </div>
                <div className="stat-name">{st.label}</div>
              </div>
            </div>

            <div className="stat-card-bottom">
              <div className="stat-growth-tag">
                <ArrowUp size={13} strokeWidth={2.8} className="growth-arrow" />
                <span className="growth-val">{st.change}</span>
                <span className="growth-period">vs yesterday</span>
              </div>
              <div className="stat-sparkline-bars">
                {st.barColors.map((color, bIdx) => (
                  <span 
                    key={bIdx} 
                    style={{ 
                      height: `${barHeights[bIdx]}px`, 
                      backgroundColor: color 
                    }} 
                  />
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>

      {/* Charts 2-Column Row */}
      <div className="dash-charts-grid">
        {/* Left: Orders Overview Bar Chart matching Second Reference Image */}
        <div className="dash-card orders-overview-card">
          <div className="dash-card-header">
            <h3 className="dash-card-title">Orders Overview</h3>
            <div className="chart-dropdown-wrap">
              <select 
                className="card-dropdown-select"
                value={chartTimeframe}
                onChange={(e) => setChartTimeframe(e.target.value)}
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">This Month</option>
              </select>
              <ChevronDown size={14} className="dropdown-chevron-icon" />
            </div>
          </div>

          <div className="bar-chart-container">
            {/* Dynamic Y-Axis scale based on timeframe (0-40 for 7d, 0-80 for 30d) */}
            <div className="chart-y-axis">
              <span style={{ top: '0%' }}>{yAxisTicks[0]}</span>
              <span style={{ top: '25%' }}>{yAxisTicks[1]}</span>
              <span style={{ top: '50%' }}>{yAxisTicks[2]}</span>
              <span style={{ top: '75%' }}>{yAxisTicks[3]}</span>
              <span style={{ top: '100%' }}>{yAxisTicks[4]}</span>
            </div>

            {/* Canvas area with grid lines and continuous stacked bars */}
            <div className="chart-canvas-area">
              <div className="chart-grid-lines">
                <div className="chart-grid-line" style={{ top: '0%' }} />
                <div className="chart-grid-line" style={{ top: '25%' }} />
                <div className="chart-grid-line" style={{ top: '50%' }} />
                <div className="chart-grid-line" style={{ top: '75%' }} />
                <div className="chart-grid-line baseline" style={{ top: '100%' }} />
              </div>

              <div className="chart-bars-wrap">
                {chartDays.map((cd, idx) => {
                  const plotHeight = 200;
                  const pendPx = (cd.pend / scaleMax) * plotHeight;
                  const cleanPx = (cd.inClean / scaleMax) * plotHeight;
                  const compPx = (cd.comp / scaleMax) * plotHeight;
                  const barWidth = chartTimeframe === '30d' ? 44 : 36;

                  return (
                    <div key={idx} className="chart-bar-group">
                      <div className="stacked-bar" style={{ width: `${barWidth}px` }}>
                        {/* Top: Pending (Soft Peach) */}
                        {cd.pend > 0 && (
                          <div 
                            className="bar-segment pend" 
                            style={{ height: `${pendPx}px` }} 
                            title={`Pending: ${cd.pend}`} 
                          />
                        )}
                        {/* Middle: In Cleaning (Turquoise Cyan) */}
                        {cd.inClean > 0 && (
                          <div 
                            className="bar-segment clean" 
                            style={{ height: `${cleanPx}px` }} 
                            title={`In Cleaning: ${cd.inClean}`} 
                          />
                        )}
                        {/* Bottom: Completed (Dark Teal) */}
                        {cd.comp > 0 && (
                          <div 
                            className="bar-segment comp" 
                            style={{ height: `${compPx}px` }} 
                            title={`Completed: ${cd.comp}`} 
                          />
                        )}
                      </div>
                      <span className="chart-x-label">{cd.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Left-Aligned Legend matching Second Reference Image */}
          <div className="chart-legend-row">
            <div className="legend-item">
              <span className="legend-dot comp" />
              <span>Completed</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot clean" />
              <span>In Cleaning</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot pend" />
              <span>Pending</span>
            </div>
          </div>
        </div>

        {/* Right: Orders by Service Donut Chart */}
        <div className="dash-card orders-service-card">
          <div className="dash-card-header">
            <h3 className="dash-card-title">Orders by Service</h3>
            <div className="chart-dropdown-wrap">
              <select 
                className="card-dropdown-select"
                value={serviceChartPeriod}
                onChange={(e) => setServiceChartPeriod(e.target.value)}
                aria-label="Filter service by time"
              >
                <option value="All">All Time</option>
                <option value="This Week">This Week</option>
                <option value="This Month">This Month</option>
              </select>
              <ChevronDown size={14} className="dropdown-chevron-icon" />
            </div>
          </div>

          <div className="donut-chart-layout">
            <div className="donut-visual-wrap">
              <svg viewBox="0 0 230 230" className="donut-svg">
                {donutSlices.map((s) => {
                  if (s.count <= 0) return null;
                  const isHovered = hoveredDonutKey === s.name;
                  return (
                    <circle
                      key={s.name}
                      cx="115"
                      cy="115"
                      r="80"
                      fill="none"
                      stroke={s.color}
                      strokeWidth={isHovered ? 32 : 28}
                      strokeDasharray={s.dashArray}
                      strokeDashoffset={s.dashOffset}
                      transform="rotate(-90 115 115)"
                      className="donut-slice-circle"
                      style={{
                        cursor: 'pointer',
                        transition: 'stroke-width 0.15s ease, opacity 0.15s ease, filter 0.15s ease',
                        opacity: hoveredDonutKey ? (isHovered ? 1 : 0.65) : 1,
                        filter: isHovered ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.2))' : 'none'
                      }}
                      onMouseEnter={() => setHoveredDonutKey(s.name)}
                      onMouseLeave={() => setHoveredDonutKey(null)}
                      onClick={() => handleServiceSliceClick(s.name)}
                    >
                      <title>{`${s.name}: ${s.count} orders (${s.pct}%)`}</title>
                    </circle>
                  );
                })}
              </svg>

              {/* Dynamic Center Display */}
              <div className="donut-center-text">
                {hoveredDonutKey ? (() => {
                  const activeSlice = serviceBreakdown.find(s => s.name === hoveredDonutKey);
                  return (
                    <>
                      <span 
                        className="donut-total-num animate-scale-in" 
                        style={{ color: activeSlice?.color, fontSize: '1.9rem', transition: 'color 0.15s ease' }}
                      >
                        {activeSlice?.count}
                      </span>
                      <span className="donut-total-lbl" style={{ color: '#0F172A', fontWeight: 700 }}>
                        {activeSlice?.name}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, marginTop: '2px' }}>
                        {activeSlice?.pct}% of orders
                      </span>
                    </>
                  );
                })() : (
                  <>
                    <span className="donut-total-num" style={{ fontSize: '1.9rem' }}>{totalOrdersCount}</span>
                    <span className="donut-total-lbl">Total Orders</span>
                  </>
                )}
              </div>
            </div>

            {/* Interactive Legend with Synchronized Hover & Navigation */}
            <div className="donut-legend-list">
              {serviceBreakdown.map((s) => {
                const isHovered = hoveredDonutKey === s.name;
                return (
                  <div 
                    key={s.name} 
                    className={`donut-legend-row ${isHovered ? 'active' : ''}`}
                    onMouseEnter={() => setHoveredDonutKey(s.name)}
                    onMouseLeave={() => setHoveredDonutKey(null)}
                    onClick={() => handleServiceSliceClick(s.name)}
                    title={`Click to view ${s.name} orders`}
                    style={{
                      cursor: 'pointer',
                      padding: '5px 8px',
                      borderRadius: '8px',
                      backgroundColor: isHovered ? '#F8FAFC' : 'transparent',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    <div className="legend-name-col">
                      <span 
                        className="legend-color-dot" 
                        style={{ 
                          backgroundColor: s.color,
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          transform: isHovered ? 'scale(1.25)' : 'scale(1)',
                          transition: 'transform 0.15s ease'
                        }} 
                      />
                      <span className="legend-service-name" style={{ fontWeight: isHovered ? 700 : 500, color: isHovered ? '#0F172A' : '#475569' }}>
                        {s.name}
                      </span>
                    </div>
                    <strong className="legend-pct-val" style={{ color: isHovered ? s.color : '#0F172A', fontWeight: 700, minWidth: '34px', textAlign: 'right' }}>
                      {s.pct}%
                    </strong>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Full-Width Recent Orders Section */}
      <div className="dash-card recent-orders-card">
        <div className="dash-card-header">
          <h3 className="dash-card-title">Recent Orders</h3>
          <button className="view-all-link" onClick={() => setAdminTab('orders')}>
            View All
          </button>
        </div>

        <div className="dash-table-wrapper">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Services</th>
                <th>Pickup Date & Time</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(ord => (
                <tr key={ord.id}>
                  <td><strong className="order-id-txt font-mono">{formatOrderId(ord.id || ord.order_number || ord.order_id)}</strong></td>
                  <td>
                    <div className="cust-cell">
                      <span 
                        className="cust-mini-avatar"
                        style={getAvatarStyle(ord.customer?.avatar)}
                      >
                        {typeof ord.customer?.avatar === 'string' && ord.customer.avatar
                          ? ord.customer.avatar
                          : (typeof ord.customer?.name === 'string' && ord.customer.name.trim()
                            ? ord.customer.name.trim().split(/\s+/).map(n => n[0]).join('').slice(0, 2).toUpperCase()
                            : 'CU')}
                      </span>
                      <span className="cust-name-txt">{ord.customer?.name}</span>
                    </div>
                  </td>
                  <td className="services-cell-txt">
                    {Array.isArray(ord.services) ? ord.services.join(', ') : (ord.services || 'Wash & Fold')}
                  </td>
                  <td className="pickup-date-cell-txt">{ord.pickupTime || ord.date}</td>
                  <td><strong className="amount-cell-txt">₹{ord.amount}</strong></td>
                  <td>
                    <span className={`status-pill ${getStatusClass(ord.status)}`}>
                      {ord.status}
                    </span>
                  </td>
                  <td className="action-cell">
                    <div className="action-menu-anchor">
                      <button 
                        className={`table-action-dots ${activeActionMenuId === ord.id ? 'active' : ''}`}
                        title="Order options"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveActionMenuId(activeActionMenuId === ord.id ? null : ord.id);
                        }}
                      >
                        <MoreHorizontal size={18} />
                      </button>

                      {activeActionMenuId === ord.id && (
                        <div className="action-dropdown-menu" onClick={e => e.stopPropagation()}>
                          <div className="dropdown-order-header">
                            <span>Order {ord.id}</span>
                            <span className={`status-mini-badge ${getStatusClass(ord.status)}`}>{ord.status}</span>
                          </div>
                          
                          <button 
                            className="dropdown-action-btn primary"
                            onClick={() => {
                              setSelectedOrderDetails(ord);
                              setActiveActionMenuId(null);
                            }}
                          >
                            <Eye size={15} />
                            <span>View Details</span>
                          </button>

                          <div className="dropdown-divider" />
                          <div className="dropdown-section-title">Change Status:</div>

                          <div className="dropdown-status-options">
                            {[
                              'Pickup Scheduled',
                              'Pending Pickup',
                              'In Cleaning',
                              'Ready for Delivery',
                              'Delivered'
                            ].map(st => (
                              <button
                                key={st}
                                className={`dropdown-status-btn ${ord.status === st ? 'current' : ''}`}
                                onClick={() => {
                                  updateOrderStatus(ord.id, st);
                                  setActiveActionMenuId(null);
                                }}
                              >
                                <span className={`status-indicator-dot ${getStatusClass(st)}`} />
                                <span>{st}</span>
                                {ord.status === st && <Check size={14} className="check-icon" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Directly below Recent Orders: 2-Column Operations Grid */}
      <div className="dash-operations-grid">
        {/* Left: Today’s Pickup & Delivery matching Reference Image */}
        <div className="dash-card pickup-delivery-card">
          <div className="dash-card-header">
            <h3 className="dash-card-title">Today’s Pickup & Delivery</h3>
            <button className="view-all-link" onClick={() => setAdminTab('pickup-delivery')}>
              View All →
            </button>
          </div>

          <div className="pickup-subtabs">
            <button 
              className={`subtab-btn ${pickupTab === 'all' ? 'active' : ''}`} 
              onClick={() => setPickupTab('all')}
            >
              All ({pickupCounts.all})
            </button>
            <button 
              className={`subtab-btn ${pickupTab === 'pickups' ? 'active' : ''}`} 
              onClick={() => setPickupTab('pickups')}
            >
              Pickups ({pickupCounts.pickups})
            </button>
            <button 
              className={`subtab-btn ${pickupTab === 'deliveries' ? 'active' : ''}`} 
              onClick={() => setPickupTab('deliveries')}
            >
              Deliveries ({pickupCounts.deliveries})
            </button>
          </div>

          <div className="pickup-items-list">
            {filteredPickups.map((item, idx) => (
              <div 
                key={idx} 
                className="pickup-item-card" 
                onClick={() => setAdminTab('pickup-delivery')}
              >
                <div className="pickup-left-col">
                  <div className="pickup-time-box">
                    <span className="pickup-time-start">{item.timeStart}</span>
                    <span className="pickup-time-end">{item.timeEnd}</span>
                  </div>

                  <div className="pickup-truck-box">
                    <Truck size={20} color="#0D7A75" strokeWidth={2.2} />
                  </div>

                  <div className="pickup-info-col">
                    <strong className="pickup-item-id font-mono">{formatPickupOrderId(item.id)}</strong>
                    <span className="pickup-item-name">{item.name}</span>
                    <span className="pickup-item-area">{item.area}</span>
                  </div>
                </div>

                <div className="pickup-right-col">
                  <span className={`pickup-type-pill ${String(item.type || '').toLowerCase()}`}>
                    {item.type || 'Pickup'}
                  </span>
                  <span className={`pickup-status-pill ${String(item.status || '').toLowerCase()}`}>
                    {item.status || 'Pending'}
                  </span>
                  <ChevronRight size={19} className="pickup-arrow-icon" strokeWidth={2} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Quick Actions matching Third Reference Image */}
        <div className="dash-card quick-actions-card">
          <h3 className="dash-card-title">Quick Actions</h3>

          <div className="quick-actions-list">
            <button 
              className="quick-action-btn-item" 
              onClick={() => setIsCreateOrderDrawerOpen(true)}
            >
              <div className="quick-action-icon-circle">
                <Plus size={24} color="#0D7A75" strokeWidth={2.4} />
              </div>
              <div className="quick-action-text-content">
                <strong className="quick-action-title">Create Order</strong>
                <span className="quick-action-desc">Add a walk-in or manual order</span>
              </div>
              <div className="quick-action-chevron-circle">
                <ChevronRight size={17} strokeWidth={2.2} />
              </div>
            </button>

            <button 
              className="quick-action-btn-item" 
              onClick={() => setIsAddServiceModalOpen(true)}
            >
              <div className="quick-action-icon-circle">
                <Tag size={22} color="#0D7A75" strokeWidth={2.2} />
              </div>
              <div className="quick-action-text-content">
                <strong className="quick-action-title">Add Service</strong>
                <span className="quick-action-desc">Add a new laundry service</span>
              </div>
              <div className="quick-action-chevron-circle">
                <ChevronRight size={17} strokeWidth={2.2} />
              </div>
            </button>

            <button 
              className="quick-action-btn-item" 
              onClick={() => setIsManageServicesModalOpen(true)}
            >
              <div className="quick-action-icon-circle">
                <Tag size={22} color="#0D7A75" strokeWidth={2.2} />
              </div>
              <div className="quick-action-text-content">
                <strong className="quick-action-title">Manage Services</strong>
                <span className="quick-action-desc">Update services & pricing</span>
              </div>
              <div className="quick-action-chevron-circle">
                <ChevronRight size={17} strokeWidth={2.2} />
              </div>
            </button>
          </div>

          <div className="quick-action-illustration-wrap">
            <img 
              src="/assets/folded-towels.png" 
              alt="Clean folded towels with mint leaves" 
              className="quick-action-towels-exact"
            />
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrderDetails && typeof document !== 'undefined' && createPortal(
        <div className="modal-backdrop animate-fade-in" onClick={() => setSelectedOrderDetails(null)}>
          <div className="order-details-modal animate-scale-up" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-left">
                <h3 className="modal-title">Order Details</h3>
                <span className="modal-order-id font-mono">{formatOrderId(selectedOrderDetails.id || selectedOrderDetails.order_number || selectedOrderDetails.order_id)}</span>
                <span className={`status-pill ${getStatusClass(selectedOrderDetails.status)}`}>
                  {selectedOrderDetails.status}
                </span>
              </div>
              <button 
                className="modal-close-btn" 
                onClick={() => setSelectedOrderDetails(null)}
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {/* Customer Info Card */}
              <div className="modal-section-card">
                <h4 className="modal-section-title">Customer Information</h4>
                <div className="modal-customer-row">
                  <span 
                    className="cust-mini-avatar modal-avatar"
                    style={getAvatarStyle(selectedOrderDetails.customer?.avatar)}
                  >
                    {selectedOrderDetails.customer?.avatar || selectedOrderDetails.customer?.name?.[0] || 'C'}
                  </span>
                  <div className="modal-customer-info">
                    <strong className="modal-customer-name">{selectedOrderDetails.customer?.name}</strong>
                    <div className="modal-meta-row">
                      <span>{selectedOrderDetails.customer?.phone || '+91 98765 43210'}</span>
                      <span>•</span>
                      <span>{selectedOrderDetails.customer?.email || 'customer@gmail.com'}</span>
                    </div>
                    <p className="modal-customer-address">{selectedOrderDetails.customer?.address || 'Bengaluru, Karnataka'}</p>
                  </div>
                </div>
              </div>

              {/* Order Info Grid */}
              <div className="modal-details-grid">
                <div className="modal-grid-item">
                  <span className="grid-label">Services</span>
                  <span className="grid-value">
                    {Array.isArray(selectedOrderDetails.services) ? selectedOrderDetails.services.join(', ') : selectedOrderDetails.services}
                  </span>
                </div>
                <div className="modal-grid-item">
                  <span className="grid-label">Pickup Date & Time</span>
                  <span className="grid-value">{selectedOrderDetails.pickupTime || selectedOrderDetails.date || '23 Sep, 9:00 AM'}</span>
                </div>
                <div className="modal-grid-item">
                  <span className="grid-label">Amount</span>
                  <span className="grid-value highlight-amount">₹{selectedOrderDetails.amount}</span>
                </div>
                <div className="modal-grid-item">
                  <span className="grid-label">Payment Status</span>
                  <span className="grid-value">{selectedOrderDetails.payment || 'Paid'}</span>
                </div>
                <div className="modal-grid-item full-width">
                  <span className="grid-label">Assigned Driver</span>
                  <span className="grid-value">{selectedOrderDetails.driver || 'Ravi Kumar (+91 98765 43210)'}</span>
                </div>
              </div>

              {/* Quick Status Update inside modal */}
              <div className="modal-status-update-box">
                <label className="grid-label">Update Order Status:</label>
                <div className="modal-status-buttons">
                  {[
                    'Pickup Scheduled',
                    'Pending Pickup',
                    'In Cleaning',
                    'Ready for Delivery',
                    'Delivered'
                  ].map(st => (
                    <button
                      key={st}
                      className={`modal-status-btn ${selectedOrderDetails.status === st ? 'active' : ''}`}
                      onClick={() => {
                        updateOrderStatus(selectedOrderDetails.id, st);
                        setSelectedOrderDetails(prev => ({ ...prev, status: st }));
                      }}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-modal-close" 
                onClick={() => setSelectedOrderDetails(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        .admin-dashboard-page {
          display: flex;
          flex-direction: column;
          gap: 28px;
          width: 100%;
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .dash-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .dash-greeting-tag {
          font-size: 0.75rem;
          font-weight: 800;
          color: #0D7A75;
          letter-spacing: 0.08em;
        }

        .dash-title {
          font-size: 1.875rem;
          font-weight: 800;
          color: #1E293B;
          letter-spacing: -0.02em;
          margin: 4px 0 2px;
        }

        .dash-sub {
          font-size: 0.875rem;
          color: #64748B;
        }

        .date-picker-dropdown {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 10px 16px;
          font-size: 0.875rem;
          font-weight: 600;
          color: #1E293B;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }

        /* STATS GRID - Pixel perfect reproduction of reference image */
        .dash-stats-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 16px;
        }

        .dash-stat-card {
          border-radius: 20px;
          padding: 22px 20px 20px 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 144px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
          cursor: pointer;
          user-select: none;
        }

        .dash-stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
        }

        .dash-stat-card:focus-visible {
          outline: 2px solid #0D7A75;
          outline-offset: 2px;
        }

        /* Card Theming matching reference image */
        .dash-stat-card.blue {
          background: #F0F8FF;
          border: 1.5px solid #DCEAFD;
        }
        .dash-stat-card.blue .stat-icon-wrap {
          background: #D9EEFF;
          color: #0284C7;
        }

        .dash-stat-card.coral {
          background: #FFF5F2;
          border: 1.5px solid #FFDDD0;
        }
        .dash-stat-card.coral .stat-icon-wrap {
          background: #FFE5DC;
          color: #FA5A3A;
        }

        .dash-stat-card.amber {
          background: #FFFDF0;
          border: 1.5px solid #FEF08A;
        }
        .dash-stat-card.amber .stat-icon-wrap {
          background: #FEF0C7;
          color: #D97706;
        }

        .dash-stat-card.purple {
          background: #FAF5FF;
          border: 1.5px solid #EDE5FF;
        }
        .dash-stat-card.purple .stat-icon-wrap {
          background: #EFE6FE;
          color: #8B5CF6;
        }

        .dash-stat-card.green {
          background: #F0FDF5;
          border: 1.5px solid #D1FAE5;
        }
        .dash-stat-card.green .stat-icon-wrap {
          background: #D5F7E2;
          color: #10B981;
        }

        /* Top Row: Icon + Value & Label */
        .stat-card-top {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .stat-icon-wrap {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }

        .dash-stat-card:hover .stat-icon-wrap {
          transform: scale(1.04);
        }

        .stat-card-val-col {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .stat-val {
          font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 1.85rem;
          font-weight: 800;
          color: #0F172A;
          line-height: 1.1;
          letter-spacing: -0.02em;
        }

        .stat-val.rev-val {
          font-size: 1.65rem;
          letter-spacing: -0.01em;
        }

        .stat-name {
          font-size: 0.8125rem;
          color: #64748B;
          font-weight: 500;
          margin-top: 4px;
          line-height: 1.25;
        }

        /* Bottom Row: Growth Tag + Themed Sparkline Bars */
        .stat-card-bottom {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-top: 22px;
          padding-top: 0;
          border-top: none;
        }

        .stat-growth-tag {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 0.775rem;
          white-space: nowrap;
        }

        .growth-arrow {
          color: #10B981;
          flex-shrink: 0;
        }

        .growth-val {
          font-weight: 700;
          color: #10B981;
        }

        .growth-period {
          font-weight: 500;
          color: #64748B;
          margin-left: 2px;
        }

        .stat-sparkline-bars {
          display: flex;
          align-items: flex-end;
          gap: 3.5px;
          height: 22px;
          flex-shrink: 0;
        }

        .stat-sparkline-bars span {
          width: 3.5px;
          border-radius: 2px;
          display: inline-block;
          transition: height 0.2s ease;
        }

        /* CHARTS GRID */
        .dash-charts-grid {
          display: grid;
          grid-template-columns: 1.3fr 1fr;
          gap: 20px;
        }

        .dash-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
        }

        .dash-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .dash-card-title {
          font-size: 1.0625rem;
          font-weight: 800;
          color: #1E293B;
        }

        /* BAR CHART - Exact reproduction of Reference Image 1 */
        .orders-overview-card {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .chart-dropdown-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
        }

        .card-dropdown-select {
          padding: 7px 34px 7px 16px;
          border-radius: 20px;
          border: 1px solid #E2E8F0;
          font-family: inherit;
          font-size: 0.8125rem;
          font-weight: 500;
          background: #FFFFFF;
          color: #475569;
          cursor: pointer;
          appearance: none;
          outline: none;
          transition: border-color 0.15s ease;
        }

        .card-dropdown-select:hover,
        .card-dropdown-select:focus {
          border-color: #CBD5E1;
        }

        .dropdown-chevron-icon {
          position: absolute;
          right: 12px;
          color: #64748B;
          pointer-events: none;
        }

        .bar-chart-container {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-top: 20px;
          margin-bottom: 32px;
          position: relative;
        }

        .chart-y-axis {
          position: relative;
          width: 24px;
          height: 200px;
          flex-shrink: 0;
          font-family: inherit;
          font-size: 0.8125rem;
          font-weight: 500;
          color: #94A3B8;
          user-select: none;
        }

        .chart-y-axis span {
          position: absolute;
          right: 4px;
          transform: translateY(-50%);
          line-height: 1;
        }

        .chart-canvas-area {
          flex: 1;
          position: relative;
          height: 200px;
        }

        .chart-grid-lines {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 1;
        }

        .chart-grid-line {
          position: absolute;
          left: 0;
          right: 0;
          border-bottom: 1px dashed #E5EEF0;
        }

        .chart-grid-line.baseline {
          border-bottom: 1.5px solid #E2ECF0;
        }

        .chart-bars-wrap {
          position: absolute;
          inset: 0;
          display: flex;
          justify-content: space-around;
          align-items: flex-end;
          z-index: 2;
        }

        .chart-bar-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }

        .stacked-bar {
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          border-radius: 8px;
          overflow: hidden;
          max-height: 200px;
          transition: width 0.3s ease, transform 0.2s ease, filter 0.2s ease;
        }

        .chart-bar-group:hover .stacked-bar {
          transform: translateY(-3px);
          filter: brightness(1.05);
        }

        .bar-segment {
          width: 100%;
          transition: height 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Exact colors from Second Reference Image */
        .bar-segment.comp { 
          background: #0E7A86; /* Dark Teal */
        }
        
        .bar-segment.clean { 
          background: #36BAC6; /* Vibrant Turquoise / Cyan */
        }
        
        .bar-segment.pend { 
          background: #FFD5CD; /* Soft Peach / Apricot */
        }

        .chart-x-label {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-top: 12px;
          font-family: inherit;
          font-size: 0.8125rem;
          font-weight: 500;
          color: #7A919B;
          white-space: nowrap;
          user-select: none;
        }

        /* Legend matching Second Reference Image */
        .chart-legend-row {
          display: flex;
          align-items: center;
          gap: 32px;
          margin-top: 8px;
          padding-left: 36px;
          font-family: inherit;
          font-size: 0.875rem;
          color: #334155;
          font-weight: 500;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .legend-dot.comp { 
          background: #0E7A86; 
        }

        .legend-dot.clean { 
          background: #36BAC6; 
        }

        .legend-dot.pend { 
          background: #FFD5CD; 
        }

        /* DONUT CHART - Orders by Service Centered Layout */
        .orders-service-card {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .donut-chart-layout {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 40px;
          width: 100%;
          max-width: 540px;
          margin: 0 auto;
          padding: 8px 12px 16px 12px;
        }

        .donut-visual-wrap {
          position: relative;
          width: 180px;
          height: 180px;
          flex-shrink: 0;
        }

        .donut-svg {
          width: 100%;
          height: 100%;
        }

        .donut-slice-circle {
          cursor: pointer;
          transition: stroke-width 0.15s ease, opacity 0.15s ease, filter 0.15s ease;
        }

        .donut-slice-circle:hover {
          opacity: 0.9;
        }

        .donut-center-text {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          text-align: center;
        }

        .donut-total-num {
          font-size: 1.875rem;
          font-weight: 800;
          color: #0F172A;
          line-height: 1.1;
          letter-spacing: -0.02em;
        }

        .donut-total-lbl {
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748B;
          margin-top: 3px;
        }

        .donut-legend-list {
          flex: 1;
          max-width: 280px;
          min-width: 210px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 13px;
        }

        .donut-legend-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.875rem;
          padding: 2px 0;
        }

        .legend-name-col {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .legend-color-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .legend-service-name {
          color: #334155;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .legend-pct-val {
          color: #0F172A;
          font-size: 0.9375rem;
          font-weight: 700;
        }

        /* RECENT ORDERS FULL-WIDTH CARD */
        .recent-orders-card {
          width: 100%;
        }

        /* OPERATIONS GRID: Today's Pickup & Delivery (Left) + Quick Actions (Right) */
        .dash-operations-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(360px, 1fr);
          gap: 24px;
          align-items: stretch;
        }

        .dash-table-wrapper {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .dash-table {
          width: 100%;
          border-collapse: collapse;
          font-family: inherit;
        }

        .dash-table th {
          text-align: left;
          padding: 14px 14px;
          color: #64748B;
          font-weight: 600;
          font-size: 0.8125rem;
          border-bottom: 1px solid #E2E8F0;
          user-select: none;
          white-space: nowrap;
        }

        .dash-table td {
          padding: 16px 14px;
          border-bottom: 1px solid #F1F5F9;
          vertical-align: middle;
          white-space: nowrap;
        }

        .dash-table tbody tr {
          transition: background-color 0.15s ease;
        }

        .dash-table tbody tr:hover {
          background-color: #F8FAFC;
        }

        .dash-table tbody tr:last-child td {
          border-bottom: none;
        }

        .order-id-txt {
          font-size: 0.875rem;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -0.01em;
          white-space: nowrap;
        }

        .cust-cell {
          display: flex;
          align-items: center;
          gap: 12px;
          white-space: nowrap;
        }

        .cust-mini-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        .cust-name-txt {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1E293B;
          white-space: nowrap;
        }

        .services-cell-txt {
          color: #64748B;
          font-size: 0.875rem;
          font-weight: 500;
          white-space: nowrap;
        }

        .pickup-date-cell-txt {
          color: #64748B;
          font-size: 0.875rem;
          font-weight: 500;
          white-space: nowrap;
        }

        .amount-cell-txt {
          font-size: 0.875rem;
          font-weight: 800;
          color: #0F172A;
          white-space: nowrap;
        }

        .status-pill {
          padding: 6px 16px;
          border-radius: 9999px;
          font-size: 0.8125rem;
          font-weight: 600;
          display: inline-block;
          white-space: nowrap;
          text-align: center;
          line-height: 1.25;
          letter-spacing: -0.01em;
        }

        .status-pill.pickup-scheduled { 
          background: #E0F2FE; 
          color: #0284C7; 
        }
        
        .status-pill.pending-pickup { 
          background: #FFE4E6; 
          color: #E11D48; 
        }
        
        .status-pill.in-cleaning { 
          background: #FEF9C3; 
          color: #CA8A04; 
        }
        
        .status-pill.ready-for-delivery { 
          background: #F3E8FF; 
          color: #9333EA; 
        }
        
        .status-pill.delivered, 
        .status-pill.completed { 
          background: #DCFCE7; 
          color: #16A34A; 
        }

        .action-cell {
          text-align: right;
          position: relative;
        }

        .action-menu-anchor {
          position: relative;
          display: inline-block;
        }

        .table-action-dots {
          background: transparent;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          padding: 6px 8px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }

        .table-action-dots:hover,
        .table-action-dots.active {
          color: #0F172A;
          background: #F1F5F9;
        }

        /* Dropdown Action Menu */
        .action-dropdown-menu {
          position: absolute;
          top: calc(100% + 4px);
          right: 0;
          z-index: 50;
          width: 210px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          animation: dropdownPop 0.15s ease-out;
        }

        @keyframes dropdownPop {
          from {
            opacity: 0;
            transform: translateY(-6px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .dropdown-order-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 8px 8px 8px;
          border-bottom: 1px solid #F1F5F9;
          margin-bottom: 4px;
        }

        .dropdown-order-header span:first-child {
          font-size: 0.75rem;
          font-weight: 700;
          color: #0F172A;
        }

        .status-mini-badge {
          font-size: 0.65rem;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 9999px;
        }

        .status-mini-badge.pickup-scheduled { background: #E0F2FE; color: #0284C7; }
        .status-mini-badge.pending-pickup { background: #FFE4E6; color: #E11D48; }
        .status-mini-badge.in-cleaning { background: #FEF9C3; color: #CA8A04; }
        .status-mini-badge.ready-for-delivery { background: #F3E8FF; color: #9333EA; }
        .status-mini-badge.delivered { background: #DCFCE7; color: #16A34A; }

        .dropdown-action-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 8px 10px;
          border: none;
          background: transparent;
          border-radius: 8px;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #1E293B;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s ease;
        }

        .dropdown-action-btn:hover {
          background: #F0FDF4;
          color: #0D7A75;
        }

        .dropdown-divider {
          height: 1px;
          background: #F1F5F9;
          margin: 4px 0;
        }

        .dropdown-section-title {
          font-size: 0.6875rem;
          font-weight: 700;
          color: #94A3B8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 4px 8px 2px;
          text-align: left;
        }

        .dropdown-status-options {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .dropdown-status-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 6px 8px;
          border: none;
          background: transparent;
          border-radius: 6px;
          font-size: 0.775rem;
          font-weight: 500;
          color: #475569;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s ease;
        }

        .dropdown-status-btn:hover {
          background: #F8FAFC;
          color: #0F172A;
        }

        .dropdown-status-btn.current {
          background: #F1F5F9;
          font-weight: 600;
          color: #0F172A;
        }

        .status-indicator-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .status-indicator-dot.pickup-scheduled { background: #0284C7; }
        .status-indicator-dot.pending-pickup { background: #E11D48; }
        .status-indicator-dot.in-cleaning { background: #CA8A04; }
        .status-indicator-dot.ready-for-delivery { background: #9333EA; }
        .status-indicator-dot.delivered { background: #16A34A; }

        .check-icon {
          margin-left: auto;
          color: #0D7A75;
        }

        /* Order Details Modal */
        .modal-backdrop {
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

        .order-details-modal {
          background: #FFFFFF;
          border-radius: 20px;
          width: 100%;
          max-width: 540px;
          max-height: calc(100vh - 40px);
          max-height: calc(100dvh - 40px);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          position: relative;
          overscroll-behavior: contain;
          animation: modalSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid #E2E8F0;
        }

        .modal-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .modal-title {
          font-size: 1.125rem;
          font-weight: 800;
          color: #0F172A;
          margin: 0;
        }

        .modal-order-id {
          font-size: 0.875rem;
          font-weight: 700;
          color: #64748B;
        }

        .modal-close-btn {
          background: transparent;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          padding: 4px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }

        .modal-close-btn:hover {
          background: #F1F5F9;
          color: #0F172A;
        }

        .modal-body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          max-height: calc(85vh - 120px);
          overflow-y: auto;
        }

        .modal-section-card {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          padding: 16px;
        }

        .modal-section-title {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748B;
          margin: 0 0 12px 0;
        }

        .modal-customer-row {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }

        .modal-avatar {
          width: 44px;
          height: 44px;
          font-size: 1rem;
        }

        .modal-customer-info {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .modal-customer-name {
          font-size: 1rem;
          color: #0F172A;
        }

        .modal-meta-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8125rem;
          color: #64748B;
        }

        .modal-customer-address {
          font-size: 0.8125rem;
          color: #64748B;
          margin: 4px 0 0;
        }

        .modal-details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .modal-grid-item {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .modal-grid-item.full-width {
          grid-column: span 2;
        }

        .grid-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748B;
        }

        .grid-value {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1E293B;
        }

        .highlight-amount {
          font-size: 1.125rem;
          font-weight: 800;
          color: #0F172A;
        }

        .modal-status-update-box {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .modal-status-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .modal-status-btn {
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 0.775rem;
          font-weight: 600;
          border: 1px solid #E2E8F0;
          background: #FFFFFF;
          color: #475569;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .modal-status-btn:hover {
          border-color: #0D7A75;
          color: #0D7A75;
        }

        .modal-status-btn.active {
          background: #0D7A75;
          border-color: #0D7A75;
          color: #FFFFFF;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          padding: 16px 24px;
          border-top: 1px solid #E2E8F0;
          background: #F8FAFC;
        }

        .btn-modal-close {
          padding: 8px 20px;
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-modal-close:hover {
          background: #F1F5F9;
          color: #0F172A;
        }

        .view-all-link {
          background: none;
          border: none;
          color: #0D7A75;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: color 0.15s ease;
        }

        .view-all-link:hover {
          color: #0A5E5A;
          text-decoration: underline;
        }

        /* TODAY'S PICKUP & DELIVERY CARD - Matching Reference Image */
        .pickup-delivery-card {
          display: flex;
          flex-direction: column;
          background: #FFFFFF;
          border-radius: 20px;
          border: 1px solid #E2E8F0;
          padding: 24px 28px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }

        .pickup-delivery-card .dash-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .pickup-delivery-card .dash-card-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -0.02em;
          margin: 0;
        }

        .pickup-delivery-card .view-all-link {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #0D7A75;
          background: transparent;
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 0;
          transition: opacity 0.15s ease;
        }

        .pickup-delivery-card .view-all-link:hover {
          opacity: 0.8;
        }

        .pickup-subtabs {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 22px;
        }

        .subtab-btn {
          background: #F1F5F9;
          border: none;
          border-radius: 12px;
          padding: 8px 22px;
          font-size: 0.9375rem;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .subtab-btn:hover:not(.active) {
          background: #E2E8F0;
          color: #0F172A;
        }

        .subtab-btn.active {
          background: #0D7A75;
          color: #FFFFFF;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(13, 122, 117, 0.2);
        }

        .pickup-items-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .pickup-item-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 16px 22px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
        }

        .pickup-item-card:hover {
          border-color: #CBD5E1;
          box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
          transform: translateY(-1px);
        }

        .pickup-left-col {
          display: flex;
          align-items: center;
          gap: 20px;
          min-width: 0;
        }

        .pickup-time-box {
          display: flex;
          flex-direction: column;
          min-width: 76px;
          flex-shrink: 0;
        }

        .pickup-time-start {
          font-size: 0.9375rem;
          font-weight: 800;
          color: #0F172A;
          line-height: 1.3;
        }

        .pickup-time-end {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #64748B;
          line-height: 1.3;
        }

        .pickup-truck-box {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #E6F7F6;
          color: #0D7A75;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .pickup-info-col {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
        }

        .pickup-item-id {
          font-size: 0.9375rem;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -0.01em;
          line-height: 1.25;
        }

        .pickup-item-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: #475569;
          line-height: 1.25;
        }

        .pickup-item-area {
          font-size: 0.8125rem;
          font-weight: 400;
          color: #94A3B8;
          line-height: 1.25;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .pickup-right-col {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-shrink: 0;
        }

        .pickup-type-pill {
          padding: 5px 16px;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.01em;
          text-align: center;
          white-space: nowrap;
        }

        .pickup-type-pill.pickup {
          background: #E0F2FE;
          color: #0284C7;
        }

        .pickup-type-pill.delivery {
          background: #F3E8FF;
          color: #9333EA;
        }

        .pickup-status-pill {
          padding: 5px 18px;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.01em;
          text-align: center;
          white-space: nowrap;
        }

        .pickup-status-pill.assigned {
          background: #DCFCE7;
          color: #16A34A;
        }

        .pickup-status-pill.pending {
          background: #FEF3C7;
          color: #D97706;
        }

        .pickup-arrow-icon {
          color: #94A3B8;
          flex-shrink: 0;
          transition: transform 0.15s ease, color 0.15s ease;
        }

        .pickup-item-card:hover .pickup-arrow-icon {
          transform: translateX(2px);
          color: #64748B;
        }

        /* QUICK ACTIONS CARD - Matching Third Reference Image */
        .quick-actions-card {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .quick-actions-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .quick-action-btn-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          background: #FFFFFF;
          border: 1.5px solid #EBF2F7;
          border-radius: 18px;
          padding: 14px 18px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s ease;
          width: 100%;
        }

        .quick-action-btn-item:hover {
          border-color: #0D7A75;
          transform: translateY(-2px);
          box-shadow: 0 4px 14px rgba(13, 122, 117, 0.08);
        }

        .quick-action-icon-circle {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: #E0F7F6;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }

        .quick-action-btn-item:hover .quick-action-icon-circle {
          transform: scale(1.05);
        }

        .quick-action-text-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .quick-action-title {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #0F172A;
          line-height: 1.25;
        }

        .quick-action-desc {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #64748B;
          margin-top: 3px;
          line-height: 1.2;
        }

        .quick-action-chevron-circle {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1.5px solid #CBD5E1;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #94A3B8;
          transition: all 0.2s ease;
        }

        .quick-action-btn-item:hover .quick-action-chevron-circle {
          border-color: #0D7A75;
          background: #E0F7F6;
          color: #0D7A75;
        }

        .quick-action-illustration-wrap {
          display: flex;
          justify-content: center;
          align-items: flex-end;
          margin-top: auto;
          padding-top: 16px;
        }

        .quick-action-towels-exact {
          max-width: 310px;
          width: 100%;
          height: auto;
          object-fit: contain;
          filter: drop-shadow(0 4px 14px rgba(0,0,0,0.05));
        }

        @media (max-width: 1350px) {
          .dash-stats-grid {
            grid-template-columns: repeat(3, 1fr);
          }
          .dash-charts-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 1100px) {
          .dash-operations-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 860px) {
          .dash-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .donut-chart-layout {
            flex-direction: column;
            gap: 20px;
          }
          .donut-legend-list {
            width: 100%;
            max-width: 320px;
          }
        }

        @media (max-width: 580px) {
          .dash-stats-grid {
            grid-template-columns: 1fr;
          }
          .dash-header-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
        }
      `}</style>
    </div>
  );
};
