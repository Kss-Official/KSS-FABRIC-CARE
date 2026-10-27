import React, { useState, useMemo, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { 
  Truck, 
  Clock, 
  Calendar, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  Plus,
  MapPin,
  SlidersHorizontal,
  Check
} from 'lucide-react';
import { 
  filterMatchesDate, 
  filterMatchesPickupDate, 
  formatDisplayDate, 
  getActiveDateRanges, 
  getOrderPickupDate, 
  parseFlexibleDate, 
  toLocalIsoDate 
} from '../../utils/dateFilterUtils';
import { formatOrderId } from '../../utils/helpers';

// Dynamic real dates relative to today
const _now = new Date();
const _todayStr = formatDisplayDate(_now);
const _tmDate = new Date(_now);
_tmDate.setDate(_tmDate.getDate() + 1);
const _tomorrowStr = formatDisplayDate(_tmDate);
const _yDate = new Date(_now);
_yDate.setDate(_yDate.getDate() - 1);
const _yesterdayStr = formatDisplayDate(_yDate);
const _lwDate1 = new Date(_now);
_lwDate1.setDate(_lwDate1.getDate() - 3);
const _lwStr1 = formatDisplayDate(_lwDate1);
const _lwDate2 = new Date(_now);
_lwDate2.setDate(_lwDate2.getDate() - 5);
const _lwStr2 = formatDisplayDate(_lwDate2);

// Exact baseline orders matching Reference Image 2 Page 1 and overall dataset
const BASELINE_PICKUP_DELIVERY_ORDERS = [
  // Page 1: Exact 8 Rows shown in Reference Image 2
  {
    id: 'FC-10290',
    date: _todayStr,
    timeStart: '09:00 AM',
    timeEnd: '11:00 AM',
    customer: {
      name: 'Rohan Mehta',
      phone: '+91 98765 43210',
      avatar: 'RM',
      avatarBg: '#CFFAFE',
      avatarColor: '#0891B2',
      address: 'Banaswadi, Bengaluru'
    },
    type: 'Pickup',
    status: 'Assigned',
    driver: {
      name: 'Ravi Kumar',
      phone: '+91 98765 43210',
      initials: 'RK',
      assigned: true
    }
  },
  {
    id: 'FC-10289',
    date: _todayStr,
    timeStart: '10:00 AM',
    timeEnd: '12:00 PM',
    customer: {
      name: 'Priya Sharma',
      phone: '+91 99876 54321',
      avatar: 'PS',
      avatarBg: '#DBEAFE',
      avatarColor: '#2563EB',
      address: 'HRBR Layout, Bengaluru'
    },
    type: 'Pickup',
    status: 'Pending',
    driver: {
      name: 'Arjun Singh',
      phone: '+91 87654 32109',
      initials: 'AS',
      assigned: true
    }
  },
  {
    id: 'FC-10288',
    date: _todayStr,
    timeStart: '11:00 AM',
    timeEnd: '01:00 PM',
    customer: {
      name: 'Arjun Nair',
      phone: '+91 91234 56789',
      avatar: 'AN',
      avatarBg: '#CCFBF1',
      avatarColor: '#0D9488',
      address: 'Indiranagar, Bengaluru'
    },
    type: 'Delivery',
    status: 'Assigned',
    driver: {
      name: 'Ravi Kumar',
      phone: '+91 98765 43210',
      initials: 'RK',
      assigned: true
    }
  },
  {
    id: 'FC-10287',
    date: _todayStr,
    timeStart: '12:00 PM',
    timeEnd: '02:00 PM',
    customer: {
      name: 'Sneha Reddy',
      phone: '+91 99887 66554',
      avatar: 'SR',
      avatarBg: '#EDE9FE',
      avatarColor: '#7C3AED',
      address: 'Whitefield, Bengaluru'
    },
    type: 'Pickup',
    status: 'Completed',
    driver: {
      name: 'Arjun Singh',
      phone: '+91 87654 32109',
      initials: 'AS',
      assigned: true
    }
  },
  {
    id: 'FC-10286',
    date: _todayStr,
    timeStart: '02:00 PM',
    timeEnd: '04:00 PM',
    customer: {
      name: 'Karan Verma',
      phone: '+91 98712 34567',
      avatar: 'KV',
      avatarBg: '#E0E7FF',
      avatarColor: '#4F46E5',
      address: 'Marathahalli, Bengaluru'
    },
    type: 'Delivery',
    status: 'Assigned',
    driver: {
      name: 'Ravi Kumar',
      phone: '+91 98765 43210',
      initials: 'RK',
      assigned: true
    }
  },
  {
    id: 'FC-10285',
    date: _todayStr,
    timeStart: '03:00 PM',
    timeEnd: '05:00 PM',
    customer: {
      name: 'Neha Kapoor',
      phone: '+91 87654 32109',
      avatar: 'NK',
      avatarBg: '#FCE7F3',
      avatarColor: '#DB2777',
      address: 'HSR Layout, Bengaluru'
    },
    type: 'Pickup',
    status: 'Assigned',
    driver: {
      name: 'Arjun Singh',
      phone: '+91 87654 32109',
      initials: 'AS',
      assigned: true
    }
  },
  {
    id: 'FC-10284',
    date: _todayStr,
    timeStart: '04:00 PM',
    timeEnd: '06:00 PM',
    customer: {
      name: 'Amit Shah',
      phone: '+91 91234 99876',
      avatar: 'AM',
      avatarBg: '#F3E8FF',
      avatarColor: '#9333EA',
      address: 'Koramangala, Bengaluru'
    },
    type: 'Delivery',
    status: 'Pending',
    driver: {
      name: 'Not Assigned',
      phone: '-',
      initials: 'NK',
      assigned: false
    }
  },
  {
    id: 'FC-10283',
    date: _todayStr,
    timeStart: '05:00 PM',
    timeEnd: '07:00 PM',
    customer: {
      name: 'Deepak Reddy',
      phone: '+91 99876 23451',
      avatar: 'DP',
      avatarBg: '#E0E7FF',
      avatarColor: '#4338CA',
      address: 'Jayanagar, Bengaluru'
    },
    type: 'Pickup',
    status: 'Completed',
    driver: {
      name: 'Ravi Kumar',
      phone: '+91 98765 43210',
      initials: 'RK',
      assigned: true
    }
  },

  // Page 2: Orders 9 through 16 (completing the 18 items dataset)
  {
    id: 'FC-10282',
    date: _yesterdayStr,
    timeStart: '06:00 PM',
    timeEnd: '08:00 PM',
    customer: {
      name: 'Kavya T',
      phone: '+91 93456 78912',
      avatar: 'KT',
      avatarBg: '#FEF08A',
      avatarColor: '#A16207',
      address: 'Malleshwaram, Bengaluru'
    },
    type: 'Delivery',
    status: 'Completed',
    driver: {
      name: 'Mohammed Taha',
      phone: '+91 91234 55678',
      initials: 'MT',
      assigned: true
    }
  },
  {
    id: 'FC-10281',
    date: _yesterdayStr,
    timeStart: '07:00 PM',
    timeEnd: '09:00 PM',
    customer: {
      name: 'Pavan Kumar',
      phone: '+91 98765 12345',
      avatar: 'PR',
      avatarBg: '#E0F2FE',
      avatarColor: '#0369A1',
      address: 'Hebbal, Bengaluru'
    },
    type: 'Pickup',
    status: 'Completed',
    driver: {
      name: 'Arjun Singh',
      phone: '+91 87654 32109',
      initials: 'AS',
      assigned: true
    }
  },
  {
    id: 'FC-10280',
    date: _yesterdayStr,
    timeStart: '08:00 AM',
    timeEnd: '10:00 AM',
    customer: {
      name: 'Vikram Malhotra',
      phone: '+91 98765 22334',
      avatar: 'VM',
      avatarBg: '#FBCFE8',
      avatarColor: '#BE185D',
      address: 'Indiranagar, Bengaluru'
    },
    type: 'Pickup',
    status: 'Completed',
    driver: {
      name: 'Ravi Kumar',
      phone: '+91 98765 43210',
      initials: 'RK',
      assigned: true
    }
  },
  {
    id: 'FC-10279',
    date: _yesterdayStr,
    timeStart: '09:30 AM',
    timeEnd: '11:30 AM',
    customer: {
      name: 'Ananya Iyer',
      phone: '+91 97654 33445',
      avatar: 'AI',
      avatarBg: '#DDD6FE',
      avatarColor: '#6D28D9',
      address: 'Domlur, Bengaluru'
    },
    type: 'Delivery',
    status: 'Completed',
    driver: {
      name: 'Mohammed Taha',
      phone: '+91 91234 55678',
      initials: 'MT',
      assigned: true
    }
  },
  {
    id: 'FC-10278',
    date: _yesterdayStr,
    timeStart: '10:30 AM',
    timeEnd: '12:30 PM',
    customer: {
      name: 'Suresh Raina',
      phone: '+91 96543 44556',
      avatar: 'SR',
      avatarBg: '#FEF3C7',
      avatarColor: '#B45309',
      address: 'Koramangala, Bengaluru'
    },
    type: 'Pickup',
    status: 'Completed',
    driver: {
      name: 'Arjun Singh',
      phone: '+91 87654 32109',
      initials: 'AS',
      assigned: true
    }
  },
  {
    id: 'FC-10277',
    date: _lwStr1,
    timeStart: '01:00 PM',
    timeEnd: '03:00 PM',
    customer: {
      name: 'Meera Sen',
      phone: '+91 95432 55667',
      avatar: 'MS',
      avatarBg: '#CCFBF1',
      avatarColor: '#0F766E',
      address: 'Bellandur, Bengaluru'
    },
    type: 'Delivery',
    status: 'Completed',
    driver: {
      name: 'Ravi Kumar',
      phone: '+91 98765 43210',
      initials: 'RK',
      assigned: true
    }
  },
  {
    id: 'FC-10276',
    date: _lwStr1,
    timeStart: '02:30 PM',
    timeEnd: '04:30 PM',
    customer: {
      name: 'Rajesh Gupta',
      phone: '+91 94321 66778',
      avatar: 'RG',
      avatarBg: '#CFFAFE',
      avatarColor: '#0E7490',
      address: 'Sarjapur, Bengaluru'
    },
    type: 'Pickup',
    status: 'Completed',
    driver: {
      name: 'Arjun Singh',
      phone: '+91 87654 32109',
      initials: 'AS',
      assigned: true
    }
  },
  {
    id: 'FC-10275',
    date: _lwStr2,
    timeStart: '03:30 PM',
    timeEnd: '05:30 PM',
    customer: {
      name: 'Pooja Joshi',
      phone: '+91 93210 77889',
      avatar: 'PJ',
      avatarBg: '#FCE7F3',
      avatarColor: '#9D174D',
      address: 'Electronic City, Bengaluru'
    },
    type: 'Delivery',
    status: 'Completed',
    driver: {
      name: 'Mohammed Taha',
      phone: '+91 91234 55678',
      initials: 'MT',
      assigned: true
    }
  },

  // Page 3: Orders 17 and 18
  {
    id: 'FC-10274',
    date: _lwStr2,
    timeStart: '04:30 PM',
    timeEnd: '06:30 PM',
    customer: {
      name: 'Gaurav Bhatia',
      phone: '+91 92109 88990',
      avatar: 'GB',
      avatarBg: '#EDE9FE',
      avatarColor: '#5B21B6',
      address: 'Ulsoor, Bengaluru'
    },
    type: 'Pickup',
    status: 'Completed',
    driver: {
      name: 'Ravi Kumar',
      phone: '+91 98765 43210',
      initials: 'RK',
      assigned: true
    }
  },
  {
    id: 'FC-10273',
    date: _lwStr2,
    timeStart: '05:30 PM',
    timeEnd: '07:30 PM',
    customer: {
      name: 'Divya Nair',
      phone: '+91 91098 99001',
      avatar: 'DN',
      avatarBg: '#DCFCE7',
      avatarColor: '#15803D',
      address: 'Frazer Town, Bengaluru'
    },
    type: 'Delivery',
    status: 'Completed',
    driver: {
      name: 'Arjun Singh',
      phone: '+91 87654 32109',
      initials: 'AS',
      assigned: true
    }
  }
];

// Helpers for real-time Pickup & Delivery status and customer avatar colors
const getCustomerAvatarColor = (name) => {
  const palettes = [
    { bg: '#CFFAFE', color: '#0891B2' },
    { bg: '#EDE9FE', color: '#7C3AED' },
    { bg: '#FCE7F3', color: '#DB2777' },
    { bg: '#DCFCE7', color: '#15803D' },
    { bg: '#FEF3C7', color: '#D97706' },
    { bg: '#E0E7FF', color: '#4F46E5' }
  ];
  const str = String(name || 'CU');
  const code = str.charCodeAt(0) + (str.charCodeAt(1) || 0);
  return palettes[code % palettes.length];
};

const getPickupDeliveryType = (order) => {
  const s = String(order.rawStat || order.status || '').toUpperCase();
  if (
    s.includes('READY') ||
    s.includes('DELIVERY') ||
    s.includes('DELIVERED') ||
    s.includes('COMPLETED') ||
    (order.deliveryTaskId && !s.includes('PICKUP')) ||
    (order.type && String(order.type).toLowerCase() === 'delivery')
  ) {
    return 'Delivery';
  }
  return 'Pickup';
};

const getPickupDeliveryStatus = (order, hasDriver) => {
  const s = String(order.rawStat || order.status || '').toUpperCase();
  if (s === 'DELIVERED' || s === 'COMPLETED') {
    return 'Completed';
  }
  if (s === 'IN_TRANSIT' || s === 'OUT_FOR_DELIVERY' || s === 'PICKED_UP') {
    return hasDriver ? 'Assigned' : 'Pending';
  }
  if (s === 'CANCELLED') {
    return 'Cancelled';
  }
  if (hasDriver || s === 'PICKUP_SCHEDULED' || s === 'PICKUP_ASSIGNED' || s === 'DELIVERY_ASSIGNED') {
    return 'Assigned';
  }
  if (s === 'PLACED' || s === 'PAYMENT_PENDING' || s === 'PENDING_PICKUP' || s === 'PENDING') {
    return 'Pending';
  }
  if (s.includes('CLEANING') || s.includes('WASHING') || s.includes('PROCESSING') || s.includes('DROPPED_OFF')) {
    return 'Assigned';
  }
  return hasDriver ? 'Assigned' : 'Pending';
};

export const AdminPickupDeliveryPage = () => {
  const { 
    orders: contextOrders, 
    allUsers,
    tasks: contextTasks,
    setIsAssignOrderModalOpen, 
    setAssigningOrder 
  } = useAdmin();

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pickups' | 'deliveries'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Dropdown states
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDateRangeDropdownOpen, setIsDateRangeDropdownOpen] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState('all');

  const todayDateObj = useMemo(() => new Date(), []);
  const tomorrowDateObj = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  }, []);
  const yesterdayDateObj = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d;
  }, []);

  const dateFilterOptions = useMemo(() => [
    { key: 'all', label: 'All Dates', pillLabel: 'All Dates', shortLabel: 'All Dates' },
    { key: 'today', label: `Today (${formatDisplayDate(todayDateObj)})`, pillLabel: `Today (${formatDisplayDate(todayDateObj)})`, shortLabel: 'Today' },
    { key: 'tomorrow', label: `Tomorrow (${formatDisplayDate(tomorrowDateObj)})`, pillLabel: `Tomorrow (${formatDisplayDate(tomorrowDateObj)})`, shortLabel: 'Tomorrow' },
    { key: 'yesterday', label: `Yesterday (${formatDisplayDate(yesterdayDateObj)})`, pillLabel: `Yesterday (${formatDisplayDate(yesterdayDateObj)})`, shortLabel: 'Yesterday' },
    { key: 'last-week', label: 'Last Week', pillLabel: 'Last Week', shortLabel: 'Last Week' }
  ], [todayDateObj, tomorrowDateObj, yesterdayDateObj]);

  const selectedPillLabel = useMemo(() => {
    const found = dateFilterOptions.find(o => o.key === selectedDateRange);
    if (found) return found.shortLabel;
    const parsed = parseFlexibleDate(selectedDateRange);
    if (parsed) return formatDisplayDate(parsed);
    return 'Select Date Range';
  }, [dateFilterOptions, selectedDateRange]);

  const [updateTick, setUpdateTick] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setUpdateTick(t => t + 1);
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('fabricare_order_assigned', handleUpdate);
    window.addEventListener('fabricare_order_updated', handleUpdate);
    window.addEventListener('fabricare_pickup_delivery_updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('fabricare_order_assigned', handleUpdate);
      window.removeEventListener('fabricare_order_updated', handleUpdate);
      window.removeEventListener('fabricare_pickup_delivery_updated', handleUpdate);
    };
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.toolbar-dropdown-wrapper')) {
        setIsFilterDropdownOpen(false);
        setIsDateRangeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Synchronize orders with dynamic real-time updates from AdminContext (RTDB backend) & local assignments
  const combinedOrders = useMemo(() => {
    let persistedMap = {};
    try {
      persistedMap = JSON.parse(localStorage.getItem('fabricare_pickup_delivery_assignments') || '{}');
    } catch (e) {}

    const hasLiveOrders = Array.isArray(contextOrders) && contextOrders.length > 0;
    const sourceOrders = hasLiveOrders ? contextOrders : BASELINE_PICKUP_DELIVERY_ORDERS;

    return sourceOrders.map(o => {
      const clean = (val) => String(val || '').replace(/^#/, '').trim().toUpperCase();
      const orderIdDisplay = formatOrderId(o.order_number || o.order_id || o.code || o.id);
      const cId = clean(o.id);
      const cRaw = clean(o.rawId);
      const cCode = clean(o.code);
      const cNum = clean(o.order_number);
      const cOrdId = clean(o.order_id);
      const cDisp = clean(orderIdDisplay);

      const persisted = 
        persistedMap[o.id] || 
        persistedMap[orderIdDisplay] || 
        persistedMap[o.rawId] || 
        persistedMap[o.code] ||
        persistedMap[cId] ||
        persistedMap[cRaw] ||
        persistedMap[cCode] ||
        persistedMap[cNum] ||
        persistedMap[cOrdId] ||
        persistedMap[cDisp];

      const hasDriver = Boolean(
        persisted ||
        o.assignedAgentName ||
        (o.driver && o.driver !== 'Not Assigned' && o.driver !== '—') ||
        o.assigned_pickup_driver_detail ||
        o.assigned_pickup_driver ||
        o.assigned_delivery_driver ||
        o.driver?.assigned
      );

      let custName = o.customer_name || o.customer?.name || o.pickup_full_name || o.customerName || (o.customer && typeof o.customer === 'object' ? o.customer.name : '') || '';
      let custPhone = o.customer_phone || o.customer?.phone || o.pickup_phone || o.customerPhone || (o.customer && typeof o.customer === 'object' ? o.customer.phone : '') || '+91 98765 00000';

      const userMatch = o.customerId ? (allUsers || []).find(u => u.uid === o.customerId || u.id === o.customerId) : null;
      if (userMatch && userMatch.name) {
        if (!custName || custName.toLowerCase() === 'ravi sharma' || custName.toLowerCase() === 'administrator' || custName.toLowerCase() === 'customer' || custName.toLowerCase() === 'valued customer') {
          custName = userMatch.name;
          if (userMatch.phone) custPhone = userMatch.phone;
        }
      }
      if (!custName) custName = 'Customer';

      const custAddress = o.pickup_address || o.customer?.address || (typeof o.address === 'object' ? `${o.address?.areaColony || ''}, ${o.address?.city || ''}` : o.address) || 'Bengaluru';
      const custInitials = String(custName || 'CU').split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'CU';

      const avatarColors = (o.customer && o.customer.avatarBg) ? { bg: o.customer.avatarBg, color: o.customer.avatarColor } : getCustomerAvatarColor(custName);
      const type = getPickupDeliveryType(o);

      let driverName = 'Not Assigned';
      let driverPhone = '';
      let driverInitials = '—';

      if (persisted) {
        driverName = persisted.driverName || 'Assigned Driver';
        driverPhone = persisted.driverPhone || '';
        driverInitials = persisted.driverInitials || String(driverName).split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'DR';
      } else if (o.assignedAgentName) {
        driverName = o.assignedAgentName;
        driverPhone = o.assignedAgentPhone || '';
        driverInitials = String(driverName).split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'DR';
      } else if (o.driver && typeof o.driver === 'object' && o.driver.assigned) {
        driverName = o.driver.name || 'Assigned Driver';
        driverPhone = o.driver.phone || '';
        driverInitials = o.driver.initials || 'DR';
      } else if (o.driver && typeof o.driver === 'string' && o.driver !== 'Not Assigned' && o.driver !== '—') {
        const match = String(o.driver).match(/^(.*?)\s*\((.*?)\)$/);
        driverName = match ? match[1].trim() : o.driver;
        driverPhone = match ? match[2].trim() : '';
        driverInitials = String(driverName).split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'DR';
      } else if (o.assigned_pickup_driver_detail?.full_name) {
        driverName = o.assigned_pickup_driver_detail.full_name;
        driverPhone = o.assigned_pickup_driver_detail.phone || '';
        driverInitials = String(driverName).split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'DR';
      } else if (o.assigned_pickup_driver) {
        driverName = typeof o.assigned_pickup_driver === 'string' ? o.assigned_pickup_driver : 'Assigned Driver';
        driverInitials = String(driverName).split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'DR';
      }

      let status = persisted?.status || getPickupDeliveryStatus(o, hasDriver);
      if (hasDriver && status.toLowerCase() === 'pending') {
        status = 'Assigned';
      }

      // Resolve pickup scheduling date strictly from scheduling fields, never from createdAt or new Date()
      const pDateObj = (persisted?.pickupDate ? parseFlexibleDate(persisted.pickupDate) : null) || getOrderPickupDate(o);
      
      let dateDisplay = '';
      if (pDateObj) {
        dateDisplay = formatDisplayDate(pDateObj);
      } else if (o.date && !['today', 'tomorrow', 'yesterday', 'all'].includes(String(o.date).toLowerCase())) {
        const parsedCustom = parseFlexibleDate(o.date);
        dateDisplay = parsedCustom ? formatDisplayDate(parsedCustom) : String(o.date);
      } else {
        dateDisplay = '—';
      }

      const pickupDateDisplay = pDateObj ? formatDisplayDate(pDateObj) : '';

      let timeSlot = o.pickup?.from 
        ? `${o.pickup.from} – ${o.pickup.to || ''}` 
        : (o.pickup_time_slot || o.pickupTime || '09:00 AM – 11:00 AM');
      if (persisted?.pickupTimeSlot) {
        timeSlot = persisted.pickupTimeSlot;
      }
      const timeParts = timeSlot.split(/[–—-]| to /).map(s => s.trim());
      const timestamp = o.updatedAt || o.placedAt || o.createdAt || 0;

      return {
        id: orderIdDisplay,
        rawId: o.rawId || o.id,
        rawOrder: o,
        date: dateDisplay,
        rawDate: pDateObj || (o.pickup?.date || o.pickup_date || null),
        pickup_date: pickupDateDisplay || (persisted?.pickupDate || o.pickup?.date || o.pickup_date || ''),
        persistedPickupDate: persisted?.pickupDate || null,
        delivery_date: o.delivery?.date || o.delivery_date || o.rescheduled_date || null,
        timeStart: timeParts[0] || '09:00 AM',
        timeEnd: timeParts[1] || '11:00 AM',
        timestamp,
        customer: {
          name: custName,
          phone: custPhone,
          avatar: custInitials,
          avatarBg: avatarColors.bg,
          avatarColor: avatarColors.color,
          address: custAddress
        },
        type,
        status,
        driver: {
          name: driverName,
          phone: driverPhone,
          initials: driverInitials,
          assigned: hasDriver
        }
      };
    });
  }, [contextOrders, updateTick, allUsers]);

  // 1. Scoped orders matching active Date Range and Search term
  const scopedOrders = useMemo(() => {
    return combinedOrders.filter(ord => {
      // Date Range filter: strictly match based on actual pickup scheduling date
      if (!filterMatchesPickupDate(ord, selectedDateRange)) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchId = ord.id.toLowerCase().includes(query);
        const matchName = ord.customer.name.toLowerCase().includes(query);
        const matchPhone = ord.customer.phone.includes(query);
        const matchAddress = ord.customer.address.toLowerCase().includes(query);
        const matchDriver = ord.driver.name.toLowerCase().includes(query);
        if (!matchId && !matchName && !matchPhone && !matchAddress && !matchDriver) {
          return false;
        }
      }

      return true;
    });
  }, [combinedOrders, selectedDateRange, searchTerm]);

  // 2. Orders matching Date Range, Search term, and Status filter
  const statusFilteredOrders = useMemo(() => {
    if (statusFilter === 'all') return scopedOrders;
    return scopedOrders.filter(o => o.status.toLowerCase() === statusFilter.toLowerCase());
  }, [scopedOrders, statusFilter]);

  // 3. Tab counts (displayed on All, Pickups, Deliveries tabs) synchronized with active filters
  const totalAllCount = statusFilteredOrders.length;
  const totalPickupsCount = statusFilteredOrders.filter(o => o.type === 'Pickup').length;
  const totalDeliveriesCount = statusFilteredOrders.filter(o => o.type === 'Delivery').length;

  // 4. Final filtered list displayed in the table (applies activeTab filter)
  const filteredList = useMemo(() => {
    return statusFilteredOrders.filter(ord => {
      if (activeTab === 'pickups' && ord.type !== 'Pickup') return false;
      if (activeTab === 'deliveries' && ord.type !== 'Delivery') return false;
      return true;
    });
  }, [statusFilteredOrders, activeTab]);

  // 5. Exact real-time metrics calculated dynamically from the active filtered dataset
  const metrics = useMemo(() => {
    let pickups = 0;
    let deliveries = 0;
    let completed = 0;
    let pending = 0;

    const targetSet = activeTab === 'all' ? statusFilteredOrders : filteredList;

    targetSet.forEach(o => {
      const s = String(o.status || '').toLowerCase();
      const t = String(o.type || '').toLowerCase();

      if (s === 'completed' || s === 'delivered') {
        completed += 1;
      } else if (s !== 'cancelled') {
        if (s.includes('pending') || !o.driver?.assigned) {
          pending += 1;
        }
      }

      if (s !== 'completed' && s !== 'delivered' && s !== 'cancelled') {
        if (t === 'pickup') {
          pickups += 1;
        } else if (t === 'delivery') {
          deliveries += 1;
        }
      }
    });

    // Provide context for counter-part when viewing a specific tab
    if (activeTab === 'pickups') {
      deliveries = statusFilteredOrders.filter(o => {
        const s = String(o.status || '').toLowerCase();
        const t = String(o.type || '').toLowerCase();
        return t === 'delivery' && s !== 'completed' && s !== 'delivered' && s !== 'cancelled';
      }).length;
    } else if (activeTab === 'deliveries') {
      pickups = statusFilteredOrders.filter(o => {
        const s = String(o.status || '').toLowerCase();
        const t = String(o.type || '').toLowerCase();
        return t === 'pickup' && s !== 'completed' && s !== 'delivered' && s !== 'cancelled';
      }).length;
    }

    return { pickups, deliveries, completed, pending };
  }, [statusFilteredOrders, filteredList, activeTab]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const currentPageClamped = Math.min(currentPage, totalPages);
  const startIndex = (currentPageClamped - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredList.length);
  const currentPageOrders = filteredList.slice(startIndex, endIndex);

  // Checkbox selection
  const handleToggleSelectAll = () => {
    const currentPageIds = currentPageOrders.map(o => o.id);
    const allSelectedOnPage = currentPageIds.every(id => selectedOrderIds.includes(id));
    if (allSelectedOnPage) {
      setSelectedOrderIds(prev => prev.filter(id => !currentPageIds.includes(id)));
    } else {
      setSelectedOrderIds(prev => Array.from(new Set([...prev, ...currentPageIds])));
    }
  };

  const handleToggleSelectOrder = (id) => {
    setSelectedOrderIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const openAssignModalForOrder = (ord) => {
    if (!ord) return;

    const statusLower = String(ord.status || '').toLowerCase().trim();
    const isAlreadyAssigned = Boolean(
      (ord.driver && ord.driver.assigned && ord.driver.name !== 'Not Assigned') ||
      (statusLower === 'assigned') ||
      (!statusLower.includes('pending') && statusLower !== 'order placed')
    );

    const raw = ord.rawOrder || {};

    // 1. Extract accurate services
    let services = [];
    if (Array.isArray(raw.items) && raw.items.length > 0) {
      services = [...new Set(raw.items.map(it => it.service_name || it.service || it.category || it.name).filter(Boolean))];
    } else if (Array.isArray(raw.services) && raw.services.length > 0) {
      services = raw.services;
    } else if (raw.service_type) {
      services = [raw.service_type];
    } else if (Array.isArray(ord.services) && ord.services.length > 0) {
      services = ord.services;
    }
    if (!services || services.length === 0) {
      services = ['Dry Cleaning'];
    }

    // 2. Extract accurate item count
    let itemCount = '1 item';
    if (Array.isArray(raw.items) && raw.items.length > 0) {
      const totalQty = raw.items.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0);
      itemCount = `${totalQty} item${totalQty === 1 ? '' : 's'}`;
    } else if (raw.itemCount) {
      itemCount = raw.itemCount;
    } else if (ord.itemCount) {
      itemCount = ord.itemCount;
    }

    // 3. Extract accurate price/amount
    const rawAmount = raw.total_price ?? raw.totalAmount ?? raw.total ?? raw.amount ?? raw.payable_amount ?? ord.amount;
    const amount = Number(rawAmount) > 0 ? Number(rawAmount) : 240;

    // 4. Extract pickup date & ISO date in local timezone
    const pDateObj = (ord.persistedPickupDate ? parseFlexibleDate(ord.persistedPickupDate) : null) || getOrderPickupDate(raw) || getOrderPickupDate(ord);
    const isoDate = pDateObj ? toLocalIsoDate(pDateObj) : toLocalIsoDate(new Date());
    const dateStr = pDateObj ? formatDisplayDate(pDateObj) : (ord.date !== '—' ? ord.date : formatDisplayDate(new Date()));

    // 5. Extract pickup time slot
    const timeSlot = ord.timeStart && ord.timeEnd
      ? `${ord.timeStart} – ${ord.timeEnd}`
      : (raw.pickup_time_slot || raw.pickupTime || '09:00 AM – 11:00 AM');

    setAssigningOrder({
      id: ord.id,
      rawId: ord.rawId || ord.id,
      rawOrder: raw,
      date: ord.date,
      rawDate: dateStr,
      isoDate: isoDate,
      timeStart: ord.timeStart,
      timeEnd: ord.timeEnd,
      pickup_time_slot: timeSlot,
      pickupTime: `${ord.date}, ${timeSlot}`,
      customer: {
        name: ord.customer?.name || 'Customer',
        phone: ord.customer?.phone || '-',
        locality: ord.customer?.locality || ord.customer?.address?.split(',')[0]?.trim() || 'HRBR Layout, Bengaluru',
        address: ord.customer?.address || '',
        fullAddress: ord.customer?.fullAddress || ord.customer?.address || ''
      },
      services,
      itemCount,
      amount,
      type: ord.type || 'Pickup',
      status: ord.status,
      driver: ord.driver,
      isAlreadyAssigned: isAlreadyAssigned
    });
    setSelectedOrderIds([ord.id]);
    setIsAssignOrderModalOpen(true);
  };

  const handleAssignOrderClick = () => {
    const isPendingUnassigned = (o) => {
      if (!o) return false;
      const statusLower = String(o.status || '').toLowerCase().trim();
      const isStatusPending = statusLower.includes('pending') || statusLower === 'order placed';
      const isDriverUnassigned = !o.driver?.assigned || o.driver?.name === 'Not Assigned';
      return isStatusPending && isDriverUnassigned;
    };

    // 1. If orders are checked in selectedOrderIds, open modal for the chosen order
    if (selectedOrderIds.length > 0) {
      const selectedOrders = combinedOrders.filter(o => selectedOrderIds.includes(o.id));
      if (selectedOrders.length > 0) {
        // If user selected multiple orders, prefer pending unassigned, else open the selected order
        const targetOrder = selectedOrders.find(isPendingUnassigned) || selectedOrders[0];
        openAssignModalForOrder(targetOrder);
        return;
      }
    }

    // 2. If no checkbox is selected, find the first pending/unassigned order in combinedOrders
    const pendingOrder = combinedOrders.find(isPendingUnassigned);
    if (pendingOrder) {
      openAssignModalForOrder(pendingOrder);
      return;
    }
  };

  return (
    <div className="admin-pickup-page animate-fade-in">
      {/* Header Row */}
      <div className="pickup-header-row">
        <div className="pickup-header-left">
          <h1 className="pickup-page-title">Pickup & Delivery</h1>
          <p className="pickup-page-subtitle">Manage and track today's pickups and deliveries.</p>
        </div>

        <div className="pickup-header-right">
          {/* Date Indicator Pill - Automatically reflects Select Date Range filter */}
          <div className="header-dropdown-wrapper">
            <div 
              className="date-selector-pill"
              title="Current Date Filter (Use 'Select Date Range' filter below to adjust)"
            >
              <Calendar size={17} className="pill-calendar-icon" />
              <span className="pill-date-text">{selectedPillLabel}</span>
            </div>
          </div>

          {/* + Assign Order Button */}
          <button 
            className="btn-assign-order"
            onClick={handleAssignOrderClick}
            type="button"
          >
            <Plus size={18} strokeWidth={2.4} />
            <span>Assign Order</span>
          </button>
        </div>
      </div>

      {/* 4 Pastel Metric Summary Cards (Static Stats) */}
      <div className="pickup-metrics-grid">
        {/* Card 1: Scheduled Pickups */}
        <div className="pickup-metric-card card-blue">
          <div className="metric-icon-badge badge-blue">
            <Truck size={24} color="#0284C7" strokeWidth={1.8} />
          </div>
          <div className="metric-text-group">
            <div className="metric-number">{metrics.pickups}</div>
            <div className="metric-label">Scheduled Pickups</div>
          </div>
        </div>

        {/* Card 2: Scheduled Deliveries */}
        <div className="pickup-metric-card card-peach">
          <div className="metric-icon-badge badge-peach">
            <Truck size={24} color="#EA580C" strokeWidth={1.8} />
          </div>
          <div className="metric-text-group">
            <div className="metric-number">{metrics.deliveries}</div>
            <div className="metric-label">Scheduled Deliveries</div>
          </div>
        </div>

        {/* Card 3: Total Completed */}
        <div className="pickup-metric-card card-green">
          <div className="metric-icon-badge badge-green">
            <Check size={24} color="#16A34A" strokeWidth={2.6} />
          </div>
          <div className="metric-text-group">
            <div className="metric-number">{metrics.completed}</div>
            <div className="metric-label">Total Completed</div>
          </div>
        </div>

        {/* Card 4: Pending */}
        <div className="pickup-metric-card card-purple">
          <div className="metric-icon-badge badge-purple">
            <Clock size={24} color="#9333EA" strokeWidth={1.8} />
          </div>
          <div className="metric-text-group">
            <div className="metric-number">{metrics.pending}</div>
            <div className="metric-label">Pending</div>
          </div>
        </div>
      </div>

      {/* Unified Main Card Container */}
      <div className="pickup-main-table-card">
        {/* Top Header / Toolbar inside Card */}
        <div className="card-top-toolbar">
          {/* Left Tabs */}
          <div className="toolbar-tabs-list">
            <button 
              className={`toolbar-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
              type="button"
            >
              All ({totalAllCount})
            </button>
            <button 
              className={`toolbar-tab-btn ${activeTab === 'pickups' ? 'active' : ''}`}
              onClick={() => { setActiveTab('pickups'); setCurrentPage(1); }}
              type="button"
            >
              Pickups ({totalPickupsCount})
            </button>
            <button 
              className={`toolbar-tab-btn ${activeTab === 'deliveries' ? 'active' : ''}`}
              onClick={() => { setActiveTab('deliveries'); setCurrentPage(1); }}
              type="button"
            >
              Deliveries ({totalDeliveriesCount})
            </button>
          </div>

          {/* Right Controls */}
          <div className="toolbar-controls-group">
            {/* Search Input Box */}
            <div className="search-input-wrapper">
              <Search size={16} className="search-magnifier-icon" />
              <input 
                type="text"
                placeholder="Search by Order ID, customer, or s..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="search-box-field"
              />
            </div>

            {/* Filters Dropdown Button */}
            <div className="toolbar-dropdown-wrapper">
              <button 
                className={`toolbar-pill-btn ${statusFilter !== 'all' ? 'has-filter' : ''}`}
                onClick={() => {
                  setIsFilterDropdownOpen(!isFilterDropdownOpen);
                  setIsDateRangeDropdownOpen(false);
                }}
                type="button"
              >
                <SlidersHorizontal size={15} className="toolbar-pill-icon" />
                <span>Filters</span>
                <ChevronDown size={14} className="toolbar-pill-chevron" />
              </button>

              {isFilterDropdownOpen && (
                <div className="dropdown-popover-card animate-scale-in">
                  <div className="popover-header">Filter by Status</div>
                  {['all', 'assigned', 'pending', 'completed'].map(st => (
                    <button
                      key={st}
                      className={`popover-option ${statusFilter === st ? 'selected' : ''}`}
                      onClick={() => {
                        setStatusFilter(st);
                        setIsFilterDropdownOpen(false);
                        setCurrentPage(1);
                      }}
                    >
                      {st === 'all' ? 'All Statuses' : st.charAt(0).toUpperCase() + st.slice(1)}
                    </button>
                  ))}
                  {statusFilter !== 'all' && (
                    <button 
                      className="popover-reset-btn"
                      onClick={() => {
                        setStatusFilter('all');
                        setIsFilterDropdownOpen(false);
                        setCurrentPage(1);
                      }}
                    >
                      Reset Filter
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Select Date Range Dropdown Button */}
            <div className="toolbar-dropdown-wrapper">
              <button 
                className={`toolbar-pill-btn ${selectedDateRange !== 'all' ? 'has-filter' : ''}`}
                onClick={() => {
                  setIsDateRangeDropdownOpen(!isDateRangeDropdownOpen);
                  setIsFilterDropdownOpen(false);
                }}
                type="button"
              >
                <Calendar size={15} className="toolbar-pill-icon" />
                <span>{selectedPillLabel}</span>
                <ChevronDown size={14} className="toolbar-pill-chevron" />
              </button>

              {isDateRangeDropdownOpen && (
                <div className="dropdown-popover-card animate-scale-in">
                  <div className="popover-header">Date Range</div>
                  {dateFilterOptions.map(r => (
                    <button
                      key={r.key}
                      className={`popover-option ${selectedDateRange === r.key ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedDateRange(r.key);
                        setCurrentPage(1);
                        setIsDateRangeDropdownOpen(false);
                      }}
                    >
                      {r.label}
                    </button>
                  ))}
                  <div className="popover-custom-date" style={{ padding: '8px 12px', borderTop: '1px solid #E2E8F0', marginTop: '4px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748B', marginBottom: '4px' }}>
                      Specific Date
                    </label>
                    <input 
                      type="date"
                      value={typeof selectedDateRange === 'string' && selectedDateRange.match(/^\d{4}-\d{2}-\d{2}$/) ? selectedDateRange : ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          setSelectedDateRange(e.target.value);
                          setCurrentPage(1);
                          setIsDateRangeDropdownOpen(false);
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        fontSize: '12px',
                        border: '1px solid #CBD5E1',
                        borderRadius: '6px',
                        color: '#0F172A',
                        outline: 'none',
                        background: '#FFFFFF'
                      }}
                    />
                  </div>
                  {selectedDateRange !== 'all' && (
                    <button 
                      className="popover-reset-btn"
                      onClick={() => {
                        setSelectedDateRange('all');
                        setIsDateRangeDropdownOpen(false);
                        setCurrentPage(1);
                      }}
                    >
                      Reset Filter
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="pickup-table-wrapper">
          <table className="pickup-full-table">
            <thead>
              <tr>
                <th className="th-col-checkbox">
                  <input 
                    type="checkbox" 
                    className="styled-table-checkbox"
                    checked={currentPageOrders.length > 0 && currentPageOrders.every(o => selectedOrderIds.includes(o.id))}
                    onChange={handleToggleSelectAll}
                  />
                </th>
                <th className="th-col-time">TIME</th>
                <th className="th-col-orderid">ORDER ID</th>
                <th className="th-col-customer">CUSTOMER</th>
                <th className="th-col-type">TYPE</th>
                <th className="th-col-address">ADDRESS</th>
                <th className="th-col-status">STATUS</th>
                <th className="th-col-driver">DRIVER</th>
              </tr>
            </thead>
            <tbody>
              {currentPageOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-state-cell">
                    <p>No orders found matching your search or filters.</p>
                  </td>
                </tr>
              ) : (
                currentPageOrders.map((ord) => {
                  const isChecked = selectedOrderIds.includes(ord.id);
                  const isAssigned = Boolean(
                    (ord.driver && ord.driver.assigned && ord.driver.name !== 'Not Assigned') ||
                    (ord.status && String(ord.status).toLowerCase() === 'assigned') ||
                    (ord.status && !String(ord.status).toLowerCase().includes('pending') && String(ord.status).toLowerCase() !== 'order placed')
                  );

                  return (
                    <tr 
                      key={ord.id} 
                      className={isChecked ? 'row-selected' : ''}
                      onClick={(e) => {
                        if (!e.target.closest('input') && !e.target.closest('.driver-assigned-cell')) {
                          handleToggleSelectOrder(ord.id);
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Checkbox */}
                      <td className="td-col-checkbox">
                        <input 
                          type="checkbox" 
                          className="styled-table-checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleToggleSelectOrder(ord.id);
                          }}
                        />
                      </td>

                      {/* TIME */}
                      <td className="td-col-time">
                        <div className="time-stack">
                          <span className="time-start">{ord.timeStart}</span>
                          <span className="time-end">{ord.timeEnd}</span>
                        </div>
                      </td>

                      {/* ORDER ID */}
                      <td className="td-col-orderid">
                        <div className="order-id-stack">
                          <span className="order-id-number font-mono">{formatOrderId(ord.id || ord.order_number || ord.order_id)}</span>
                          <span className="order-id-date">{ord.date}</span>
                        </div>
                      </td>

                      {/* CUSTOMER */}
                      <td className="td-col-customer">
                        <div className="customer-info-cell">
                          <div 
                            className="customer-avatar-circle"
                            style={{ 
                              backgroundColor: ord.customer.avatarBg, 
                              color: ord.customer.avatarColor 
                            }}
                          >
                            {ord.customer.avatar}
                          </div>
                          <div className="customer-text-meta">
                            <span className="customer-name-text">{ord.customer.name}</span>
                            <span className="customer-phone-text">{ord.customer.phone}</span>
                          </div>
                        </div>
                      </td>

                      {/* TYPE */}
                      <td className="td-col-type">
                        <span className={`capsule-type ${ord.type.toLowerCase()}`}>
                          {ord.type}
                        </span>
                      </td>

                      {/* ADDRESS */}
                      <td className="td-col-address">
                        <div className="address-with-pin">
                          <MapPin size={15} className="location-pin-icon" />
                          <span className="address-label-text">{ord.customer.address}</span>
                        </div>
                      </td>

                      {/* STATUS */}
                      <td className="td-col-status">
                        <span className={`capsule-status ${ord.status.toLowerCase().replace(/\s+/g, '-')}`}>
                          {ord.status}
                        </span>
                      </td>

                      {/* DRIVER */}
                      <td className="td-col-driver">
                        {isAssigned ? (
                          <div 
                            className="driver-assigned-cell"
                            onClick={() => openAssignModalForOrder(ord)}
                            title={`Assigned Driver: ${ord.driver.name} (Click to view form)`}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="driver-avatar-circle dark">
                              {ord.driver.initials}
                            </div>
                            <div className="driver-meta-text">
                              <span className="driver-name">{ord.driver.name}</span>
                              <span className="driver-phone">{ord.driver.phone}</span>
                            </div>
                          </div>
                        ) : (
                          <div 
                            className="driver-assigned-cell unassigned"
                            onClick={() => openAssignModalForOrder(ord)}
                            title="Click to assign driver"
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="driver-avatar-circle unassigned">
                              {ord.driver.initials || 'NK'}
                            </div>
                            <div className="driver-meta-text">
                              <span className="driver-name unassigned">Not Assigned</span>
                              <span className="driver-phone unassigned">-</span>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="table-pagination-footer">
          <div className="pagination-count-label">
            Showing <span className="font-semibold">{filteredList.length === 0 ? 0 : startIndex + 1}–{endIndex}</span> of <span className="font-semibold">{filteredList.length}</span> orders
          </div>

          <div className="pagination-action-buttons">
            <button 
              className="page-chevron-btn" 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPageClamped <= 1}
              type="button"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button 
                key={pageNum}
                className={`page-digit-btn ${currentPageClamped === pageNum ? 'active' : ''}`}
                onClick={() => setCurrentPage(pageNum)}
                type="button"
              >
                {pageNum}
              </button>
            ))}

            <button 
              className="page-chevron-btn" 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPageClamped >= totalPages}
              type="button"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Scoped CSS Styles matching Reference Image 2 pixel-by-pixel */}
      <style>{`
        .admin-pickup-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
          padding-bottom: 40px;
          width: 100%;
          box-sizing: border-box;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }

        /* 1. Header Row */
        .pickup-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }

        .pickup-page-title {
          font-size: 1.625rem;
          font-weight: 700;
          color: #0F172A;
          margin: 0 0 4px 0;
          letter-spacing: -0.02em;
        }

        .pickup-page-subtitle {
          font-size: 0.875rem;
          color: #64748B;
          margin: 0;
          font-weight: 400;
        }

        .pickup-header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-dropdown-wrapper {
          position: relative;
        }

        .date-selector-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          border-radius: 10px;
          padding: 9px 16px;
          cursor: default;
          user-select: none;
          font-size: 0.875rem;
          font-weight: 600;
          color: #1E293B;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
          transition: all 0.2s ease;
        }

        .date-selector-pill:hover {
          background: #F8FAFC;
          border-color: #CBD5E1;
        }

        .pill-calendar-icon {
          color: #475569;
        }

        .pill-date-text {
          white-space: nowrap;
        }

        .pill-chevron-icon {
          color: #64748B;
          margin-left: 2px;
        }

        .header-dropdown-popover {
          position: absolute;
          top: calc(100% + 6px);
          right: 0;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          z-index: 50;
          min-width: 220px;
          padding: 6px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .header-dropdown-popover .dropdown-item {
          background: none;
          border: none;
          padding: 8px 12px;
          text-align: left;
          font-size: 0.8125rem;
          color: #334155;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: background 0.15s;
        }

        .header-dropdown-popover .dropdown-item:hover,
        .header-dropdown-popover .dropdown-item.active {
          background: #F1F5F9;
          color: #0D7A75;
          font-weight: 600;
        }

        .btn-assign-order {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #0D7A75;
          color: #FFFFFF;
          border: none;
          border-radius: 10px;
          padding: 9px 18px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(13, 122, 117, 0.2);
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .btn-assign-order:hover {
          background: #09635F;
          box-shadow: 0 3px 6px rgba(13, 122, 117, 0.25);
          transform: translateY(-1px);
        }

        /* 2. Four Pastel Metric Cards */
        .pickup-metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .pickup-metric-card {
          border-radius: 18px;
          padding: 18px 22px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-sizing: border-box;
          cursor: default;
          user-select: none;
        }

        /* Card background tints */
        .pickup-metric-card.card-blue {
          background: #EFF6FF;
          border: 1px solid rgba(219, 234, 254, 0.8);
        }
        .pickup-metric-card.card-peach {
          background: #FFF7ED;
          border: 1px solid rgba(254, 237, 213, 0.8);
        }
        .pickup-metric-card.card-green {
          background: #F0FDF4;
          border: 1px solid rgba(220, 252, 231, 0.8);
        }
        .pickup-metric-card.card-purple {
          background: #FAF5FF;
          border: 1px solid rgba(243, 232, 255, 0.8);
        }

        /* Icon badges */
        .metric-icon-badge {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .metric-icon-badge.badge-blue {
          background: #DBEAFE;
        }
        .metric-icon-badge.badge-peach {
          background: #FFEDD5;
        }
        .metric-icon-badge.badge-green {
          background: #DCFCE7;
        }
        .metric-icon-badge.badge-purple {
          background: #F3E8FF;
        }

        .metric-text-group {
          display: flex;
          flex-direction: column;
        }

        .metric-number {
          font-size: 1.875rem;
          font-weight: 700;
          color: #0F172A;
          line-height: 1.1;
          letter-spacing: -0.02em;
        }

        .metric-label {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #64748B;
          margin-top: 4px;
          white-space: nowrap;
        }

        /* 3. Main Unified Table Card */
        .pickup-main-table-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        /* Top Toolbar inside Main Card */
        .card-top-toolbar {
          padding: 14px 22px;
          border-bottom: 1px solid #F1F5F9;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }

        .toolbar-tabs-list {
          display: flex;
          align-items: center;
          gap: 28px;
        }

        .toolbar-tab-btn {
          background: none;
          border: none;
          padding: 8px 0;
          font-size: 0.875rem;
          font-weight: 500;
          color: #64748B;
          cursor: pointer;
          position: relative;
          transition: color 0.15s;
          outline: none;
        }

        .toolbar-tab-btn:hover {
          color: #1E293B;
        }

        .toolbar-tab-btn.active {
          color: #0D7A75;
          font-weight: 700;
        }

        .toolbar-tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -15px;
          left: 0;
          right: 0;
          height: 2.5px;
          background: #0D7A75;
          border-radius: 2px 2px 0 0;
        }

        .toolbar-controls-group {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-magnifier-icon {
          position: absolute;
          left: 12px;
          color: #94A3B8;
          pointer-events: none;
        }

        .search-box-field {
          height: 38px;
          width: 250px;
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          border-radius: 10px;
          padding: 0 12px 0 36px;
          font-size: 0.8125rem;
          color: #0F172A;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .search-box-field::placeholder {
          color: #94A3B8;
        }

        .search-box-field:focus {
          border-color: #0D7A75;
          box-shadow: 0 0 0 3px rgba(13, 122, 117, 0.1);
        }

        .toolbar-dropdown-wrapper {
          position: relative;
        }

        .toolbar-pill-btn {
          height: 38px;
          padding: 0 14px;
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
        }

        .toolbar-pill-btn:hover {
          background: #F8FAFC;
          border-color: #94A3B8;
        }

        .toolbar-pill-btn.has-filter {
          border-color: #0D7A75;
          color: #0D7A75;
          background: #F0FDF4;
        }

        .toolbar-pill-icon {
          color: #475569;
        }

        .toolbar-pill-chevron {
          color: #64748B;
        }

        .dropdown-popover-card {
          position: absolute;
          top: calc(100% + 6px);
          right: 0;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          z-index: 50;
          min-width: 180px;
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .popover-header {
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          color: #94A3B8;
          padding: 4px 8px;
          letter-spacing: 0.05em;
        }

        .popover-option {
          background: none;
          border: none;
          padding: 7px 10px;
          text-align: left;
          font-size: 0.8125rem;
          color: #334155;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: background 0.15s;
        }

        .popover-option:hover,
        .popover-option.selected {
          background: #F1F5F9;
          color: #0D7A75;
          font-weight: 600;
        }

        .popover-reset-btn {
          margin-top: 4px;
          padding: 6px 8px;
          background: #FEF2F2;
          border: none;
          border-radius: 6px;
          color: #DC2626;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          text-align: center;
        }

        /* 4. Table Structure */
        .pickup-table-wrapper {
          overflow-x: auto;
          width: 100%;
        }

        .pickup-full-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          text-align: left;
        }

        .pickup-full-table thead tr {
          border-bottom: 1px solid #F1F5F9;
        }

        .pickup-full-table th {
          font-size: 0.6875rem;
          font-weight: 700;
          color: #64748B;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          padding: 14px 16px;
          background: #FFFFFF;
          border-bottom: 1px solid #F1F5F9;
          white-space: nowrap;
        }

        .th-col-checkbox,
        .td-col-checkbox {
          width: 44px;
          padding-left: 22px !important;
          padding-right: 0 !important;
        }

        .styled-table-checkbox {
          width: 16px;
          height: 16px;
          border-radius: 4px;
          border: 1.5px solid #CBD5E1;
          cursor: pointer;
          accent-color: #0D7A75;
        }

        .pickup-full-table tbody tr {
          transition: background-color 0.15s;
          border-bottom: 1px solid #F1F5F9;
        }

        .pickup-full-table tbody tr:hover {
          background-color: #F8FAFC;
        }

        .pickup-full-table tbody tr.row-selected {
          background-color: #F0FDF9;
        }

        .pickup-full-table td {
          padding: 13px 16px;
          border-bottom: 1px solid #F1F5F9;
          vertical-align: middle;
          font-size: 0.8125rem;
        }

        .empty-state-cell {
          text-align: center;
          padding: 48px 16px !important;
          color: #64748B;
          font-size: 0.875rem;
        }

        /* Column: TIME */
        .time-stack {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .time-start {
          font-weight: 700;
          color: #0F172A;
          font-size: 0.8125rem;
        }

        .time-end {
          color: #94A3B8;
          font-size: 0.75rem;
          font-weight: 400;
        }

        /* Column: ORDER ID */
        .order-id-stack {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .order-id-number {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-weight: 700;
          color: #0F172A;
          font-size: 0.8125rem;
          letter-spacing: -0.01em;
        }

        .order-id-date {
          color: #94A3B8;
          font-size: 0.75rem;
          font-weight: 400;
        }

        /* Column: CUSTOMER */
        .customer-info-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .customer-avatar-circle {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        .customer-text-meta {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .customer-name-text {
          font-weight: 600;
          color: #0F172A;
          font-size: 0.8125rem;
          white-space: nowrap;
        }

        .customer-phone-text {
          font-size: 0.75rem;
          color: #64748B;
          font-weight: 400;
          white-space: nowrap;
        }

        /* Column: TYPE */
        .capsule-type {
          display: inline-block;
          padding: 3.5px 12px;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .capsule-type.pickup {
          background: #ECFEFF;
          color: #0891B2;
        }

        .capsule-type.delivery {
          background: #FAF5FF;
          color: #9333EA;
        }

        /* Column: ADDRESS */
        .address-with-pin {
          display: flex;
          align-items: center;
          gap: 6px;
          max-width: 200px;
        }

        .location-pin-icon {
          color: #94A3B8;
          flex-shrink: 0;
        }

        .address-label-text {
          font-size: 0.8125rem;
          color: #334155;
          font-weight: 400;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Column: STATUS */
        .capsule-status {
          display: inline-block;
          padding: 3.5px 12px;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          white-space: nowrap;
          text-align: center;
        }

        .capsule-status.assigned {
          background: #DCFCE7;
          color: #16A34A;
        }

        .capsule-status.pending {
          background: #FEF3C7;
          color: #D97706;
        }

        .capsule-status.completed {
          background: #DCFCE7;
          color: #16A34A;
        }

        .capsule-status.in-transit {
          background: #E0F2FE;
          color: #0284C7;
        }

        /* Column: DRIVER */
        .driver-assigned-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .driver-avatar-circle {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.6875rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        .driver-avatar-circle.dark {
          background: #0F172A;
          color: #FFFFFF;
        }

        .driver-avatar-circle.unassigned {
          background: #E2E8F0;
          color: #64748B;
        }

        .driver-meta-text {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .driver-name {
          font-weight: 600;
          color: #0F172A;
          font-size: 0.8125rem;
          white-space: nowrap;
        }

        .driver-name.unassigned {
          color: #334155;
          font-weight: 500;
        }

        .driver-phone {
          font-size: 0.6875rem;
          color: #64748B;
          font-weight: 400;
          white-space: nowrap;
        }

        .driver-phone.unassigned {
          color: #94A3B8;
        }

        .driver-assigned-cell.unassigned {
          cursor: pointer;
          border-radius: 8px;
          padding: 2px 4px;
          transition: background 0.15s;
        }

        .driver-assigned-cell.unassigned:hover {
          background: #F1F5F9;
        }

        /* 5. Pagination Footer */
        .table-pagination-footer {
          padding: 14px 22px;
          border-top: 1px solid #F1F5F9;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #FFFFFF;
          flex-wrap: wrap;
          gap: 12px;
        }

        .pagination-count-label {
          font-size: 0.8125rem;
          color: #64748B;
          font-weight: 400;
        }

        .pagination-count-label .font-semibold {
          font-weight: 600;
          color: #334155;
        }

        .pagination-action-buttons {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .page-chevron-btn {
          width: 34px;
          height: 34px;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          background: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748B;
          cursor: pointer;
          transition: all 0.15s;
        }

        .page-chevron-btn:hover:not(:disabled) {
          background: #F8FAFC;
          border-color: #CBD5E1;
          color: #0F172A;
        }

        .page-chevron-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .page-digit-btn {
          width: 34px;
          height: 34px;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          background: #FFFFFF;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #334155;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s;
        }

        .page-digit-btn:hover:not(.active) {
          background: #F8FAFC;
          border-color: #CBD5E1;
        }

        .page-digit-btn.active {
          background: #0D7A75;
          border-color: #0D7A75;
          color: #FFFFFF;
          font-weight: 700;
        }

        /* 6. Responsive Breakdown */
        @media (max-width: 1200px) {
          .pickup-metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .pickup-metrics-grid {
            grid-template-columns: 1fr;
          }

          .pickup-header-row {
            flex-direction: column;
            align-items: flex-start;
          }

          .card-top-toolbar {
            flex-direction: column;
            align-items: flex-start;
          }

          .toolbar-controls-group {
            width: 100%;
          }

          .search-box-field {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
