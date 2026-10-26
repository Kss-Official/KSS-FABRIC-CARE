import React, { useState, useEffect, useCallback } from 'react';
import { useBooking } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import { ordersApi } from '../api/apiClient';
import { subscribeOrderById } from '../services/firestoreService';
import { subscribeCustomerOrders } from '../services/customerDataService';
import { 
  Package, 
  Clock, 
  Check, 
  Truck, 
  MapPin, 
  User, 
  Calendar, 
  FileText, 
  ArrowLeft, 
  RefreshCw, 
  ShieldCheck, 
  ChevronRight,
  Headphones,
  MessageSquare,
  ClipboardList,
  WashingMachine,
  IndianRupee,
  Shirt,
  Sparkles,
  Home
} from 'lucide-react';
import { formatOrderId } from '../utils/helpers';

export const TrackOrder = () => {
  const { activeTrackingOrderId, setActiveTrackingOrderId, navigateTo, startBooking } = useBooking();
  const { currentUser } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const effectiveTrackingId = activeTrackingOrderId || (typeof window !== 'undefined' ? sessionStorage.getItem('fabricare_active_tracking_id') : null);

  const isOrderOwnedByCurrentCustomer = useCallback((o) => {
    if (!o) return false;
    const myId = String(currentUser?.uid || currentUser?.id || '').toLowerCase().trim();
    const myEmail = (currentUser?.email || '').toLowerCase().trim();
    if (!myId && !myEmail) return false;
    const cId = String(o.customerId || o.customer_id || o.userId || '').toLowerCase().trim();
    const cEmail = String(o.customerEmail || o.customer_email || o.customer?.email || '').toLowerCase().trim();
    if (myId && cId && cId === myId) return true;
    if (myEmail && cEmail && cEmail === myEmail) return true;
    return false;
  }, [currentUser]);

  const fetchOrderDetails = useCallback(async () => {
    const myId = currentUser?.uid || currentUser?.id;
    const myEmail = currentUser?.email;
    if (!myId && !myEmail) {
      setOrder(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (effectiveTrackingId) {
        const res = await ordersApi.getOrderById(effectiveTrackingId);
        if (res?.data && isOrderOwnedByCurrentCustomer(res.data)) {
          setOrder(res.data);
          setLoading(false);
          return;
        } else if (res?.data && !isOrderOwnedByCurrentCustomer(res.data)) {
          // If the tracking ID belonged to a previous customer, clear it
          if (setActiveTrackingOrderId) setActiveTrackingOrderId(null);
          try {
            sessionStorage.removeItem('fabricare_active_tracking_id');
          } catch (_) {}
        }
      }

      const res = await ordersApi.getOrders();
      const list = Array.isArray(res?.data) ? res.data : (res?.data?.items || res?.data?.results || []);
      const userList = list.filter(isOrderOwnedByCurrentCustomer);

      if (userList.length > 0) {
        if (effectiveTrackingId) {
          const cleanTarget = String(effectiveTrackingId).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          const targetDigits = cleanTarget.replace(/\D/g, '');
          const matchedOrder = userList.find(o => {
            const cCode = String(o.code || o.order_number || o.order_id || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            const cId = String(o.id || o.docId || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            if (cCode === cleanTarget || cId === cleanTarget) return true;
            if (targetDigits && (cCode.includes(targetDigits) || cId.includes(targetDigits))) return true;
            return false;
          });
          if (matchedOrder) {
            setOrder(matchedOrder);
            setLoading(false);
            return;
          }
        }

        const act = userList.find(o => {
          const s = String(o.status || '').toUpperCase();
          return s !== 'DELIVERED' && s !== 'COMPLETED' && s !== 'CANCELLED';
        }) || userList[0] || null;
        setOrder(act);
      } else {
        setOrder(null);
      }
    } catch (e) {
      console.warn('Fetch order details error:', e);
      setError('Unable to refresh order details');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [effectiveTrackingId, currentUser, isOrderOwnedByCurrentCustomer, setActiveTrackingOrderId]);

  useEffect(() => {
    let isSubscribed = true;
    const myId = currentUser?.uid || currentUser?.id;
    const myEmail = currentUser?.email;

    if (!myId && !myEmail) {
      setOrder(null);
      setLoading(false);
      return;
    }

    setOrder(null);
    setLoading(true);
    setError(null);

    let unsubscribe = () => {};

    if (effectiveTrackingId) {
      unsubscribe = subscribeOrderById(
        effectiveTrackingId,
        (fireOrder) => {
          if (!isSubscribed) return;
          if (fireOrder && isOrderOwnedByCurrentCustomer(fireOrder)) {
            setOrder(fireOrder);
            setLoading(false);
          } else {
            // Try API fallback
            ordersApi.getOrderById(effectiveTrackingId)
              .then(res => {
                if (isSubscribed && res?.data && isOrderOwnedByCurrentCustomer(res.data)) {
                  setOrder(res.data);
                  setLoading(false);
                } else {
                  // Not owned by this customer or doesn't exist, search within customer's own orders
                  fetchOrderDetails();
                }
              })
              .catch(() => {
                if (isSubscribed) fetchOrderDetails();
              });
          }
        },
        () => {
          if (isSubscribed) fetchOrderDetails();
        }
      );
    } else {
      unsubscribe = subscribeCustomerOrders(
        myId,
        (userOrders) => {
          if (!isSubscribed) return;
          if (Array.isArray(userOrders) && userOrders.length > 0) {
            const owned = userOrders.filter(isOrderOwnedByCurrentCustomer);
            const active = owned.find(o => {
              const s = String(o.status || '').toUpperCase();
              return s !== 'COMPLETED' && s !== 'DELIVERED' && s !== 'CANCELLED';
            }) || owned[0] || null;
            setOrder(active);
          } else {
            setOrder(null);
          }
          setLoading(false);
        },
        (err) => {
          console.warn('Customer tracking orders subscribe note:', err);
          fetchOrderDetails();
        },
        myEmail
      );
    }

    return () => {
      isSubscribed = false;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [effectiveTrackingId, currentUser?.uid, currentUser?.email, fetchOrderDetails, isOrderOwnedByCurrentCustomer]);

  if (loading) {
    return (
      <div className="portal-container text-center py-20">
        <RefreshCw size={40} className="animate-spin text-primary mx-auto mb-4" />
        <h2 className="text-xl font-bold text-navy">Connecting to FabriCare Hub...</h2>
        <p className="text-sm text-muted mt-1">Fetching authoritative real-time order tracking data</p>
      </div>
    );
  }

  if (!order || error) {
    return (
      <div className="portal-container">
        <div className="content-card text-center py-16">
          <Package size={48} className="text-teal mx-auto mb-3" />
          <h2 className="text-xl font-bold text-navy">No Orders to Track Yet</h2>
          <p className="text-sm text-muted max-w-sm mx-auto mt-1 mb-6">
            You don't have an active laundry order currently being processed. Schedule a pickup to track your garments in real time!
          </p>
          <div className="flex justify-center gap-3">
            <button 
              onClick={() => startBooking()}
              className="btn btn-primary"
            >
              Book a Pickup
            </button>
            <button 
              onClick={() => navigateTo('customer-orders')}
              className="btn btn-outline-primary"
            >
              View Order History
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Helper to parse any date value (Timestamp, milliseconds, ISO string, YYYY-MM-DD)
  const parseAnyDate = (val) => {
    if (!val) return null;
    try {
      if (typeof val?.toDate === 'function') return val.toDate();
      if (typeof val === 'number') return new Date(val);
      if (typeof val === 'string') {
        const tr = val.trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(tr)) {
          const [y, m, d] = tr.split('-').map(Number);
          return new Date(y, m - 1, d);
        }
        if (/^\d+$/.test(tr)) return new Date(Number(tr));
        const parsed = new Date(tr);
        if (!isNaN(parsed.getTime())) return parsed;
      }
    } catch (_) {}
    return null;
  };

  // Format date cleanly e.g. "19 Oct 2026"
  const formatDisplayDate = (dateVal, fallback = '') => {
    if (!dateVal || dateVal === 'Today' || dateVal === 'Scheduled') {
      return fallback;
    }
    const d = parseAnyDate(dateVal);
    if (d && !isNaN(d.getTime())) {
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    return String(dateVal);
  };

  // Format 12-hour time
  const formatTime12h = (t) => {
    if (!t) return '';
    const s = String(t).trim();
    if (/am|pm/i.test(s)) return s;
    const parts = s.split(':');
    if (parts.length >= 2) {
      let h = parseInt(parts[0], 10);
      const m = parts[1].slice(0, 2);
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      return `${h}:${m} ${ampm}`;
    }
    return s;
  };

  // Format time slot string cleanly
  const formatSlot = (from, to, rawSlot, fallback = '11:00 AM – 1:00 PM') => {
    if (rawSlot && rawSlot !== 'Standard Slot') {
      const parts = rawSlot.split(/[–-]/).map(s => s.trim());
      if (parts.length === 2) {
        return `${formatTime12h(parts[0])} – ${formatTime12h(parts[1])}`;
      }
      return rawSlot;
    }
    if (from && to) {
      return `${formatTime12h(from)} – ${formatTime12h(to)}`;
    }
    return fallback;
  };

  // 1. Raw Pickup Date & Formatted Pickup Date
  const rawPickupDate = 
    (order.pickup && typeof order.pickup === 'object' && order.pickup.date) ||
    (order.pickup_date && order.pickup_date !== 'Today' && order.pickup_date !== 'Scheduled' && order.pickup_date) ||
    order.pickupDate ||
    (order.date && order.date !== 'Today' && order.date) ||
    (order.dateText && order.dateText !== 'Today' && order.dateText) ||
    order.placedAt ||
    order.createdAt ||
    order.created_at;

  const formattedPickupDate = formatDisplayDate(rawPickupDate, '19 Oct 2026');

  // 2. Pickup Time Slot
  const resolvedPickupSlot = formatSlot(
    order.pickup?.from,
    order.pickup?.to,
    order.pickup_time_slot || order.time_slot || order.timeText,
    '11:00 AM – 1:00 PM'
  );

  // 3. Raw Delivery Date & Formatted Delivery Date
  let rawDeliveryDate = 
    (order.delivery && typeof order.delivery === 'object' && order.delivery.date) ||
    (order.delivery_date && order.delivery_date !== '14 Oct 2026' && order.delivery_date) ||
    order.deliveryDate ||
    order.estimated_delivery ||
    order.dueBy;

  if (!rawDeliveryDate) {
    const pickupParsed = parseAnyDate(rawPickupDate);
    if (pickupParsed && !isNaN(pickupParsed.getTime())) {
      const calcDelivery = new Date(pickupParsed);
      calcDelivery.setDate(calcDelivery.getDate() + (order.isExpress ? 1 : 2));
      rawDeliveryDate = calcDelivery;
    }
  }

  const deliveryDateFormatted = formatDisplayDate(rawDeliveryDate, '21 Oct 2026');

  // 4. Delivery Time Slot
  const resolvedDeliverySlot = formatSlot(
    order.delivery?.from,
    order.delivery?.to,
    order.delivery_time_slot || order.deliveryTimeSlot,
    '02:00 PM – 05:00 PM'
  );

  const rawOrderNum = order.code || order.order_number || order.orderNumber || order.id || 'FC-75668';
  const orderNumberDisplay = formatOrderId(rawOrderNum) || `#${String(rawOrderNum).replace(/^#/, '')}`;
  const orderPlacedTime = `${formattedPickupDate} · 08:45 AM`;
  const pickedUpTime = `${formattedPickupDate} · 10:15 AM`;
  const facilityTime = `${formattedPickupDate} · 11:30 AM`;
  const cleaningEstTime = `${formattedPickupDate} · 02:00 PM (est.)`;

  const isRescheduled = Boolean(order.delivery_date && (order.status === 'READY_FOR_DELIVERY' || order.status === 'FAILED_DELIVERY' || order.delivery_time_slot));

  // Dynamic day & month helpers for stepper fallbacks
  const getDayMonth = (dateVal, fallback) => {
    const parsed = parseAnyDate(dateVal);
    if (parsed && !isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }
    return fallback;
  };

  const placedDayMonth = getDayMonth(order.placedAt || order.createdAt || order.created_at || rawPickupDate, '18 Oct');
  const pickupDayMonth = getDayMonth(rawPickupDate, '19 Oct');
  const deliveryDayMonth = getDayMonth(rawDeliveryDate, '21 Oct');

  const formatStepTimestamp = (timestamp, fallbackDayMonth, fallbackTime) => {
    if (timestamp) {
      try {
        const d = parseAnyDate(timestamp);
        if (d && !isNaN(d.getTime())) {
          const dayMonth = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
          const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
          return `${dayMonth}, ${time}`;
        }
      } catch {
        // fallback
      }
    }
    const baseDayMonth = fallbackDayMonth || pickupDayMonth || '19 Oct';
    return `${baseDayMonth}, ${fallbackTime}`;
  };

  const getActiveStepIndex = (status, stage) => {
    if (!status && !stage) return 0;
    const clean = String(status || '')
      .toUpperCase()
      .replace(/[^A-Z]/g, '');
    const cleanStage = String(stage || '')
      .toUpperCase()
      .replace(/[^A-Z]/g, '');

    // Step 6: Delivered / Completed
    if (clean.includes('DELIVERED') || clean.includes('COMPLETED') || cleanStage.includes('DELIVERED') || cleanStage.includes('COMPLETED')) return 6;

    // Step 5: Out for delivery / Ready for delivery (dispatched to delivery portal) / In transit / Dispatched / Driver assigned
    if (
      clean.includes('OUTFORDELIVERY') ||
      clean.includes('INTRANSIT') ||
      clean.includes('DISPATCHED') ||
      clean.includes('NEARBY') ||
      clean.includes('ONTHEWAY') ||
      clean.includes('READYFORDELIVERY') ||
      clean.includes('DELIVERYASSIGNED') ||
      clean === 'READY' ||
      clean === 'PACKED' ||
      cleanStage === 'OUTFORDELIVERY' ||
      cleanStage.includes('INTRANSIT') ||
      cleanStage === 'DELIVERY' ||
      cleanStage === 'READY' ||
      cleanStage === 'PACKED' ||
      cleanStage.includes('READYFORDELIVERY')
    ) return 5;

    // Step 4: Ready (Final preparation / Packing clothes)
    if (
      clean.includes('PACKING') ||
      cleanStage === 'PACKING'
    ) return 4;

    // Step 3: In cleaning / Washing / Drying / Ironing / Quality check / Processing
    if (
      clean.includes('CLEANING') ||
      clean.includes('PROCESS') ||
      clean.includes('WASH') ||
      clean.includes('DRYING') ||
      (clean.includes('DRY') && !clean.includes('LAUNDRY')) ||
      clean.includes('IRON') ||
      clean.includes('FOLD') ||
      clean.includes('INSPECT') ||
      clean.includes('QUALITY') ||
      clean.includes('STEAM') ||
      clean.includes('PRESS') ||
      cleanStage === 'WASHING' ||
      cleanStage === 'DRYING' ||
      cleanStage === 'IRONING' ||
      cleanStage === 'STEAMING' ||
      cleanStage === 'PRESSING' ||
      cleanStage === 'DRY_CLEANING' ||
      cleanStage === 'PROCESSING' ||
      cleanStage.includes('CLEAN')
    ) return 3;

    // Step 2: At facility / Hub / Received / Dropped off
    if (
      clean.includes('ATLAUNDRY') ||
      clean.includes('ATFACILITY') ||
      clean.includes('DROPPEDOFF') ||
      clean.includes('RECEIVED') ||
      cleanStage === 'ATFACILITY' ||
      cleanStage === 'RECEIVED' ||
      cleanStage.includes('LAUNDRY')
    ) return 2;

    // Step 1: Picked up / Arrived / Pickup in progress
    if (
      clean.includes('PICKEDUP') ||
      clean.includes('PICKUPINPROGRESS') ||
      clean.includes('ARRIVED') ||
      cleanStage === 'PICKEDUP'
    ) return 1;

    // Step 0: Pending Pickup / Scheduled / Order Placed / Accepted
    if (
      clean.includes('PENDING') ||
      clean.includes('SCHEDULED') ||
      clean.includes('ACCEPTED') ||
      clean.includes('PLACED') ||
      clean.includes('INCOMING') ||
      cleanStage === 'INCOMING'
    ) return 0;

    return 0;
  };

  const isDelivered = String(order.status || '').toUpperCase().includes('DELIVERED') || String(order.status || '').toUpperCase().includes('COMPLETED');
  const activeStepIndex = isDelivered ? 6 : getActiveStepIndex(
    order.raw_status || order.orderStatus || order.status || order.status_display,
    order.stage || order.processing_stage || order.currentLaundryStep
  );

  const verticalMilestones = [
    {
      id: 'placed',
      title: 'Order placed',
      desc: 'We received your order',
      icon: ClipboardList
    },
    {
      id: 'picked',
      title: 'Picked up',
      desc: order.driver && order.driver !== 'Not Assigned'
        ? `Collected by ${order.driver}`
        : (order.assigned_delivery_staff_name ? `Collected by ${order.assigned_delivery_staff_name}` : 'Collected by your delivery partner'),
      icon: Truck
    },
    {
      id: 'facility',
      title: 'At the facility',
      desc: 'Items weighed and quality checked',
      icon: WashingMachine
    },
    {
      id: 'cleaning',
      title: 'Cleaning in progress',
      desc: order.stage ? `Current stage: ${order.stage}` : 'Washing, drying and ironing',
      icon: Sparkles
    },
    {
      id: 'ready',
      title: 'Ready for delivery',
      desc: 'Items inspected, folded and packaged',
      icon: Package
    },
    {
      id: 'delivery',
      title: 'Out for delivery',
      desc: order.driver && order.driver !== 'Not Assigned'
        ? `${order.driver} is on the way to your address`
        : 'Delivering safely to your doorstep',
      icon: Truck
    },
    {
      id: 'delivered',
      title: 'Delivered',
      desc: 'Order completed and handed over safely',
      icon: Home
    }
  ];

  const trackingSteps = [
    {
      id: 'placed',
      title: 'Order placed',
      icon: ClipboardList
    },
    {
      id: 'picked',
      title: 'Picked up',
      icon: Truck
    },
    {
      id: 'laundry',
      title: 'At laundry',
      icon: WashingMachine
    },
    {
      id: 'processing',
      title: 'Processing',
      icon: Sparkles
    },
    {
      id: 'ready',
      title: 'Ready',
      icon: Package
    },
    {
      id: 'delivery',
      title: 'Out for delivery',
      icon: Truck
    },
    {
      id: 'delivered',
      title: 'Delivered',
      icon: Home
    }
  ];

  const orderItems = Array.isArray(order.items) && order.items.length > 0 
    ? order.items.map(it => ({
        name: it?.item_name || it?.name || 'Fabric Care',
        subtitle: it?.service_category || it?.category || 'Premium Wash & Care',
        quantity: Number(it?.quantity) || 1,
        rate: Number(it?.unit_price || it?.rate || 120),
        total: Number(it?.total_price || it?.total || 120)
      }))
    : [
        {
          name: 'Fabric Care',
          subtitle: 'Premium Wash & Care',
          quantity: 1,
          rate: 120,
          total: 120
        }
      ];

  return (
    <div className="portal-container track-order-portal animate-fade-in">
      {/* 1. Header with Breadcrumb and Decorative Badge */}
      <div className="track-header-row mb-6">
        <div className="header-left">
          <div className="breadcrumb-nav">
            <button 
              onClick={() => navigateTo('customer-orders')}
              className="breadcrumb-back-link"
            >
              <ArrowLeft size={15} />
              <span>My Orders</span>
            </button>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">Track Order</span>
          </div>

          <h1 className="track-main-title">Track your order</h1>
          <p className="track-main-subtitle">Your laundry journey, updated in real time.</p>
        </div>

        {/* Decorative Graphic Banner */}
        <div className="header-right-illustration">
          <div className="illustration-graphic">
            <svg width="60" height="52" viewBox="0 0 60 52" fill="none">
              <path d="M28 8 C25 8 23 10 23 12 C23 14 25 15 27 16 L12 24 C11 24.6 10.5 25.8 11 26.8 L14 33 C14.5 34 15.8 34.5 16.8 34 L28 28 L39.2 34 C40.2 34.5 41.5 34 42 33 L45 26.8 C45.5 25.8 45 24.6 44 24 L29 16 C31 15 33 14 33 12 C33 10 31 8 28 8 Z" fill="#99F6E4" stroke="#0D7A75" strokeWidth="1.5" />
              <path d="M18 33 L18 44 C18 46 19.5 47 21.5 47 L34.5 47 C36.5 47 38 46 38 44 L38 33" fill="#CCFBF1" stroke="#0D7A75" strokeWidth="1.5" />
              <rect x="33" y="34" width="20" height="5" rx="2.5" fill="#E8FAF6" stroke="#0D7A75" strokeWidth="1.2" />
              <rect x="33" y="40" width="20" height="5" rx="2.5" fill="#99F6E4" stroke="#0D7A75" strokeWidth="1.2" />
              <rect x="33" y="46" width="20" height="5" rx="2.5" fill="#5EEAD4" stroke="#0D7A75" strokeWidth="1.2" />
              <path d="M8 16 L9.5 12.5 L11 16 L14.5 17.5 L11 19 L9.5 22.5 L8 19 L4.5 17.5 Z" fill="#0D7A75" />
            </svg>
          </div>
          <div className="illustration-text">
            <span className="script-title">Fresh Clothes</span>
            <span className="script-sub">Happier You</span>
          </div>
        </div>
      </div>

      {/* 2. Top Metrics Summary Card */}
      <div className="content-card tracking-summary-card mb-6">
        <div className="summary-metric-col">
          <div className="metric-icon-box">
            <FileText size={20} className="text-teal" />
          </div>
          <div className="metric-text-stack">
            <span className="metric-label">Order Number</span>
            <div className="metric-value-row">
              <span className="metric-value-bold">{orderNumberDisplay}</span>
              <span className={`status-pill ${isDelivered ? 'completed' : 'in-progress'}`}>
                <span className="pill-dot"></span>
                <span>{order.status_display || order.status || (isDelivered ? 'Delivered' : 'Live Tracking')}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="summary-metric-divider"></div>

        <div className="summary-metric-col">
          <div className="metric-icon-box">
            <Calendar size={20} className="text-teal" />
          </div>
          <div className="metric-text-stack">
            <span className="metric-label">Pickup Date & Time</span>
            <span className="metric-value-text">
              {formattedPickupDate} · {resolvedPickupSlot}
            </span>
          </div>
        </div>

        <div className="summary-metric-divider"></div>

        <div className="summary-metric-col">
          <div className="metric-icon-box">
            <IndianRupee size={20} className="text-teal" />
          </div>
          <div className="metric-text-stack">
            <span className="metric-label">Estimated Total</span>
            <span className="metric-value-bold">₹{(parseFloat(order.total_amount ?? order.estimated_amount ?? order.amount ?? 120) || 120).toFixed(2)}</span>
          </div>
        </div>

        <div className="summary-action-col">
          <button 
            onClick={fetchOrderDetails} 
            className="refresh-pill-btn"
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Status</span>
          </button>
        </div>
      </div>

      {/* 3. Horizontal Step Progression Card (Matches Reference Image 1) */}
      <div className="content-card tracking-progress-card mb-6">
        <div className="tracker-card-header">
          <div className="tracker-header-left">
            <span className="tracker-title-tag">ORDER PROGRESS</span>
            <span className="tracker-live-badge">
              <span className="tracker-live-dot"></span>
              <span>{isDelivered ? 'Completed' : 'Live'}</span>
            </span>
          </div>
          <div className="tracker-step-counter">
            Step {isDelivered ? 7 : Math.min(activeStepIndex + 1, 7)} of 7
          </div>
        </div>

        <div className="horizontal-stepper-scroll-container">
          <div className="horizontal-stepper">
            {trackingSteps.map((step, idx) => {
              const isCompleted = isDelivered || idx < activeStepIndex;
              const isActive = !isDelivered && idx === activeStepIndex;
              const isPending = !isDelivered && idx > activeStepIndex;
              const IconComp = step.icon;

              return (
                <React.Fragment key={step.id}>
                  <div className={`horizontal-step-item ${isCompleted ? 'completed' : isActive ? 'active' : 'pending'}`}>
                    <div className={`step-node-bubble ${isCompleted ? 'completed' : isActive ? 'active' : 'pending'}`}>
                      {isActive && <div className="step-active-outer-halo" />}
                      <div className="step-node-inner">
                        {isCompleted ? (
                          <Check size={18} strokeWidth={2.6} className="text-white" />
                        ) : (
                          <IconComp size={18} strokeWidth={1.8} />
                        )}
                      </div>
                    </div>
                    <div className="step-label-group">
                      <h4 className={`step-label-title ${isActive ? 'active-title' : isPending ? 'pending-title' : ''}`}>
                        {step.title}
                      </h4>
                    </div>
                  </div>

                  {idx < trackingSteps.length - 1 && (
                    <div 
                      className={`stepper-connecting-line ${
                        isDelivered || idx < activeStepIndex - 1
                          ? 'completed'
                          : idx === activeStepIndex - 1
                            ? 'completed'
                            : idx === activeStepIndex
                              ? 'half-active'
                              : 'pending'
                      }`} 
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Middle 2-Column Section: Order Journey + Delivery Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left 2 Cols: Order Journey */}
        <div className="lg:col-span-2 content-card order-journey-card">
          <div className="card-section-header">
            <Clock size={18} className="text-teal" />
            <h3 className="card-section-title">Order Journey</h3>
          </div>

          <div className="vertical-journey-timeline">
            {verticalMilestones.map((m, idx) => {
              const isEventCompleted = isDelivered || idx < activeStepIndex;
              const isEventActive = !isDelivered && idx === activeStepIndex;
              const isEventPending = !isDelivered && idx > activeStepIndex;
              const IconComponent = m.icon;

              return (
                <div key={m.id} className="journey-event-item">
                  <div className="event-node-col">
                    <div className={`event-node-bubble ${isEventCompleted ? 'checked' : isEventActive ? 'active-icon-node' : 'concentric-node'}`}>
                      {isEventCompleted ? (
                        <Check size={11} strokeWidth={3} />
                      ) : isEventActive ? (
                        <IconComponent size={12} />
                      ) : (
                        <span className="concentric-dot"></span>
                      )}
                    </div>
                    {idx < verticalMilestones.length - 1 && (
                      <div className={`event-timeline-line ${isEventCompleted ? '' : 'pending-timeline-line'}`}></div>
                    )}
                  </div>
                  <div className="event-info-col">
                    <div className="event-title-time">
                      <h5 className={`event-title ${isEventActive ? 'active-teal' : isEventPending ? 'pending-title' : ''}`}>
                        {m.title}
                      </h5>
                      <span className={`event-status-tag ${isEventCompleted ? 'completed' : isEventActive ? 'in-progress' : 'pending'}`}>
                        {isEventCompleted ? 'Completed' : isEventActive ? 'In Progress' : 'Pending'}
                      </span>
                    </div>
                    <p className="event-desc">{m.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Delivery Details */}
        <div className="content-card delivery-details-card">
          <div className="card-section-header">
            <Truck size={18} className="text-teal" />
            <h3 className="card-section-title">Delivery Details</h3>
          </div>

          <div className="delivery-details-list">
            {/* Pickup Address */}
            <div className="delivery-detail-box">
              <div className="detail-box-left">
                <div className="detail-icon-circle">
                  <MapPin size={17} />
                </div>
                <div className="detail-text-stack">
                  <span className="detail-box-label">Pickup Address</span>
                  <span className="detail-box-value bold">
                    {order.pickup_address || 'Your saved address'}
                  </span>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </div>

            {/* Pickup Partner */}
            <div className="delivery-detail-box">
              <div className="detail-box-left">
                <div className="detail-icon-circle">
                  <User size={17} />
                </div>
                <div className="detail-text-stack">
                  <span className="detail-box-label">Pickup Partner</span>
                  <span className="detail-box-value">
                    {order.driver && order.driver !== 'Not Assigned'
                      ? order.driver
                      : (order.assigned_delivery_staff_name || 'Awaiting assignment')}
                  </span>
                </div>
              </div>
              <span className="text-slate-300 font-bold">—</span>
            </div>

            {/* Estimated / Rescheduled Delivery */}
            <div className="delivery-detail-box">
              <div className="detail-box-left">
                <div className={`detail-icon-circle ${isRescheduled ? 'bg-amber-50 text-amber-600' : ''}`}>
                  <Calendar size={17} />
                </div>
                <div className="detail-text-stack">
                  <div className="flex items-center gap-2">
                    <span className="detail-box-label">
                      {isRescheduled ? 'Rescheduled Delivery' : 'Estimated Delivery'}
                    </span>
                    {isRescheduled && (
                      <span className="badge badge-warning text-[10px] px-1.5 py-0.5 rounded">Rescheduled</span>
                    )}
                  </div>
                  <span className="detail-box-value bold">
                    {deliveryDateFormatted}
                  </span>
                  {resolvedDeliverySlot && (
                    <span className="text-xs text-slate-500 font-medium">
                      Slot: {resolvedDeliverySlot}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-slate-300 font-bold">—</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Bottom 2-Column Section: Items in this Order + Need help? */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Items in this Order Table */}
        <div className="lg:col-span-2 content-card items-order-card">
          <div className="card-section-header">
            <Shirt size={18} className="text-teal" />
            <h3 className="card-section-title">Items in this Order</h3>
          </div>

          <div className="order-items-table-container">
            <table className="tracking-items-table">
              <thead>
                <tr>
                  <th className="th-item">ITEM / SERVICE</th>
                  <th className="th-qty">QUANTITY</th>
                  <th className="th-rate">RATE</th>
                  <th className="th-total">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {orderItems.map((item, idx) => (
                  <tr key={idx}>
                    <td className="td-item">
                      <div className="item-with-thumb">
                        <div className="item-thumb-box">
                          <Shirt size={18} />
                        </div>
                        <div>
                          <div className="item-name-bold">{item.name}</div>
                          <div className="item-service-sub">{item.subtitle}</div>
                        </div>
                      </div>
                    </td>
                    <td className="td-qty">{item.quantity}</td>
                    <td className="td-rate">₹{(parseFloat(item.rate) || 0).toFixed(2)}</td>
                    <td className="td-total bold">₹{(parseFloat(item.total) || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="grand-total-row">
                  <td colSpan={3} className="grand-total-label">Grand Total</td>
                  <td className="grand-total-val">₹{(parseFloat(order.total_amount ?? order.estimated_amount ?? order.amount ?? 120) || 120).toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Care Instructions banner */}
          <div className="care-instructions-banner">
            <ShieldCheck size={18} className="care-icon" />
            <div className="care-text-wrap">
              <span className="care-label">Care Instructions</span>
              <p className="care-desc">
                {order.special_instructions || 'Please handle garments with extra care.'}
              </p>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Need help? Card */}
        <div className="content-card need-help-card">
          <div className="help-card-header-group">
            <div className="card-section-header">
              <Headphones size={18} className="text-teal" />
              <h3 className="card-section-title">Need help?</h3>
            </div>

            <p className="help-sub-desc">
              Our support team is here to assist you with any questions or concerns.
            </p>

            {/* Action buttons moved to the top below header text */}
            <div className="help-actions-stack">
              <button 
                onClick={() => navigateTo('customer-support')}
                className="btn-help-contact-support"
              >
                <MessageSquare size={16} />
                <span>Contact support</span>
              </button>

              <button 
                onClick={() => navigateTo('customer-invoices')}
                className="btn-help-view-invoice"
              >
                <FileText size={16} />
                <span>View invoice</span>
              </button>
            </div>
          </div>

          {/* Reference Image 2: Fresh Folded Towels with Green Leaves placed below buttons with larger size */}
          <div className="help-illustration-wrapper">
            <img 
              src="/assets/folded-towels.png" 
              alt="FabriCare Fresh Clean Laundry & Towels" 
              className="help-towels-img"
            />
          </div>

          <div className="help-secure-note">
            <ShieldCheck size={14} className="text-teal" />
            <span>Your order is safe and secure with us.</span>
          </div>
        </div>
      </div>

      <style>{`
        .track-order-portal {
          width: 100%;
        }

        /* 1. Header Row */
        .track-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }

        .breadcrumb-nav {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
          font-size: 0.8125rem;
        }

        .breadcrumb-back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #0D7A75;
          font-weight: 600;
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
        }

        .breadcrumb-back-link:hover {
          text-decoration: underline;
        }

        .breadcrumb-sep {
          color: #94A3B8;
        }

        .breadcrumb-current {
          color: #64748B;
          font-weight: 500;
        }

        .track-main-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -0.02em;
          margin: 0;
        }

        .track-main-subtitle {
          font-size: 0.875rem;
          color: #64748B;
          margin-top: 4px;
        }

        .header-right-illustration {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #F0FDF9;
          border: 1.5px solid #CCFBF1;
          border-radius: 16px;
          padding: 8px 16px;
        }

        .illustration-graphic {
          display: flex;
          align-items: center;
        }

        .illustration-text {
          display: flex;
          flex-direction: column;
        }

        .script-title {
          font-size: 1rem;
          font-weight: 800;
          color: #0D7A75;
          letter-spacing: -0.01em;
        }

        .script-sub {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #0D7A75;
          opacity: 0.85;
          margin-top: -2px;
        }

        /* 2. Top Metrics Summary Card */
        .tracking-summary-card {
          background: #ffffff;
          border: 1.5px solid #E2E8F0;
          border-radius: 18px;
          padding: 18px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
        }

        .summary-metric-col {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .metric-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #E8FAF6;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #0D7A75;
        }

        .metric-text-stack {
          display: flex;
          flex-direction: column;
        }

        .metric-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748B;
          margin-bottom: 2px;
        }

        .metric-value-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .metric-value-bold {
          font-size: 1.125rem;
          font-weight: 800;
          color: #0F172A;
        }

        .metric-value-text {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #0F172A;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 700;
        }

        .status-pill.in-progress {
          background: #E8FAF6;
          color: #0D7A75;
        }

        .pill-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #0D7A75;
        }

        .summary-metric-divider {
          width: 1px;
          height: 38px;
          background: #EDF2F7;
        }

        .refresh-pill-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border: 1.5px solid #0D7A75;
          border-radius: 999px;
          background: #ffffff;
          color: #0D7A75;
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }

        .refresh-pill-btn:hover {
          background: #F4FBFA;
        }

        /* 3. Horizontal Progression Card (Matches Reference Image 1) */
        .tracking-progress-card {
          background: #ffffff;
          border: 1.5px solid #E2E8F0;
          border-radius: 20px;
          padding: 24px 32px 28px;
        }

        .tracker-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .tracker-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .tracker-title-tag {
          font-size: 0.82rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #0E4B56;
          text-transform: uppercase;
        }

        .tracker-live-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #E6F7F0;
          color: #0E4B56;
          font-size: 0.76rem;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 9999px;
        }

        .tracker-live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10B981;
          display: inline-block;
        }

        .tracker-step-counter {
          font-size: 0.84rem;
          font-weight: 600;
          color: #475569;
        }

        .horizontal-stepper-scroll-container {
          width: 100%;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .horizontal-stepper-scroll-container::-webkit-scrollbar {
          display: none;
        }

        .horizontal-stepper {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          position: relative;
          width: 100%;
          min-width: 680px;
        }

        .horizontal-step-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
          z-index: 2;
          flex: 0 0 auto;
          width: 90px;
        }

        .step-node-bubble {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          margin-bottom: 12px;
        }

        .step-node-bubble.completed .step-node-inner {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: #0E4B56;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(14, 75, 86, 0.12);
        }

        .step-node-bubble.active {
          width: 52px;
          height: 52px;
          margin-top: -4px;
          margin-bottom: 8px;
        }

        .step-active-outer-halo {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: #D8F3ED;
          z-index: 1;
        }

        .step-node-bubble.active .step-node-inner {
          position: relative;
          z-index: 2;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #ffffff;
          border: 2px solid #0E4B56;
          color: #0E4B56;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .step-node-bubble.pending .step-node-inner {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: #F0F4F8;
          border: 1.5px solid #E2E8F0;
          color: #8EA4B8;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .step-label-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }

        .step-label-title {
          font-size: 0.88rem;
          font-weight: 700;
          color: #0F172A;
          margin: 0;
          white-space: nowrap;
        }

        .step-label-title.active-title {
          font-weight: 800;
          color: #0F172A;
        }

        .step-label-title.pending-title {
          font-weight: 600;
          color: #8EA4B8;
        }

        .step-label-subtitle {
          font-size: 0.74rem;
          margin-top: 4px;
          white-space: nowrap;
        }

        .step-label-subtitle.time-sub {
          color: #64748B;
          font-weight: 500;
        }

        .step-label-subtitle.active-sub {
          color: #0E4B56;
          font-weight: 700;
        }

        .step-label-subtitle.pending-sub {
          color: #8EA4B8;
          font-weight: 500;
        }

        .stepper-connecting-line {
          flex: 1;
          height: 2.5px;
          margin: 21px 2px 0;
          position: relative;
          z-index: 1;
          min-width: 12px;
          border-radius: 2px;
        }

        .stepper-connecting-line.completed {
          background: #0E4B56;
        }

        .stepper-connecting-line.half-active {
          background: linear-gradient(to right, #0E4B56 50%, #E2E8F0 50%);
        }

        .stepper-connecting-line.pending {
          background: #E2E8F0;
        }

        /* 4. Common Card Header */
        .card-section-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
        }

        .card-section-title {
          font-size: 1rem;
          font-weight: 700;
          color: #0F172A;
          margin: 0;
        }

        /* Order Journey Card */
        .vertical-journey-timeline {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .journey-event-item {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }

        .event-node-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 22px;
        }

        .event-node-bubble {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          z-index: 2;
        }

        .event-node-bubble.checked {
          background: #0D7A75;
          color: #ffffff;
        }

        .event-node-bubble.active-icon-node {
          background: #E8FAF6;
          border: 1.5px solid #0D7A75;
          color: #0D7A75;
        }

        .event-node-bubble.concentric-node {
          background: #ffffff;
          border: 1.5px solid #CBD5E1;
        }

        .concentric-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #94A3B8;
        }

        .event-timeline-line {
          width: 2px;
          height: 38px;
          background: #0D7A75;
          margin-top: 2px;
          margin-bottom: 2px;
        }

        .event-info-col {
          flex: 1;
          padding-bottom: 14px;
        }

        .event-title-time {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .event-title {
          font-size: 0.875rem;
          font-weight: 700;
          color: #0F172A;
          margin: 0;
        }

        .event-title.active-teal {
          color: #0D7A75;
        }

        .event-title.pending-title {
          color: #64748B;
        }

        .event-time {
          font-size: 0.75rem;
          color: #64748B;
        }

        .pending-timeline-line {
          background: #E2E8F0 !important;
        }

        .event-status-tag {
          font-size: 0.6875rem;
          font-weight: 700;
          padding: 1px 8px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          line-height: 1.3;
        }

        .event-status-tag.completed {
          background: #E8FAF6;
          color: #0D7A75;
        }

        .event-status-tag.in-progress {
          background: #FEF3C7;
          color: #92400E;
        }

        .event-status-tag.pending {
          background: #F1F5F9;
          color: #94A3B8;
        }

        .event-desc {
          font-size: 0.8125rem;
          color: #64748B;
          margin: 2px 0 0;
        }

        /* Delivery Details Card */
        .delivery-details-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .delivery-detail-box {
          background: #FAFCFC;
          border: 1.5px solid #EDF2F7;
          border-radius: 14px;
          padding: 13px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .detail-box-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .detail-icon-circle {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #E8FAF6;
          color: #0D7A75;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .detail-text-stack {
          display: flex;
          flex-direction: column;
        }

        .detail-box-label {
          font-size: 0.72rem;
          color: #64748B;
          font-weight: 500;
        }

        .detail-box-value {
          font-size: 0.875rem;
          color: #0F172A;
        }

        .detail-box-value.bold {
          font-weight: 700;
        }

        /* 5. Bottom Section: Items Table */
        .order-items-table-container {
          overflow-x: auto;
          margin-bottom: 16px;
        }

        .tracking-items-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }

        .tracking-items-table thead th {
          text-align: left;
          font-size: 0.72rem;
          font-weight: 700;
          color: #64748B;
          letter-spacing: 0.04em;
          padding-bottom: 12px;
          border-bottom: 1.5px solid #EDF2F7;
        }

        .tracking-items-table th.th-qty {
          text-align: center;
        }

        .tracking-items-table th.th-rate,
        .tracking-items-table th.th-total {
          text-align: right;
        }

        .tracking-items-table tbody td {
          padding: 14px 0;
          border-bottom: 1px solid #F1F5F9;
          color: #0F172A;
        }

        .item-with-thumb {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .item-thumb-box {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: #E8FAF6;
          color: #0D7A75;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .item-name-bold {
          font-weight: 700;
          color: #0F172A;
        }

        .item-service-sub {
          font-size: 0.75rem;
          color: #64748B;
        }

        .td-qty {
          text-align: center;
          color: #64748B;
        }

        .td-rate {
          text-align: right;
          color: #64748B;
        }

        .td-total {
          text-align: right;
        }

        .td-total.bold {
          font-weight: 700;
        }

        .grand-total-row td {
          padding-top: 16px;
          border-bottom: none;
        }

        .grand-total-label {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #0F172A;
        }

        .grand-total-val {
          text-align: right;
          font-size: 1.0625rem;
          font-weight: 800;
          color: #0F172A;
        }

        .care-instructions-banner {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: #E8FAF6;
          border-radius: 12px;
          padding: 12px 16px;
          margin-top: 10px;
        }

        .care-icon {
          color: #0D7A75;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .care-text-wrap {
          display: flex;
          flex-direction: column;
        }

        .care-label {
          font-size: 0.78rem;
          font-weight: 700;
          color: #0D7A75;
        }

        .care-desc {
          font-size: 0.78rem;
          color: #334155;
          margin: 1px 0 0;
          line-height: 1.4;
        }

        /* Need Help Card */
        .need-help-card {
          background: #ffffff;
          border: 1.5px solid #E2E8F0;
          border-radius: 20px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .help-card-header-group {
          display: flex;
          flex-direction: column;
        }

        .help-sub-desc {
          font-size: 0.8125rem;
          color: #64748B;
          line-height: 1.5;
          margin-top: -6px;
          margin-bottom: 16px;
        }

        .help-actions-stack {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 8px;
        }

        .btn-help-contact-support {
          width: 100%;
          padding: 12px 18px;
          background: #0D7A75;
          color: #ffffff;
          font-weight: 700;
          font-size: 0.875rem;
          border-radius: 999px;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(13, 122, 117, 0.22);
          transition: all 0.15s ease;
        }

        .btn-help-contact-support:hover {
          background: #095F5B;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(13, 122, 117, 0.28);
        }

        .btn-help-view-invoice {
          width: 100%;
          padding: 11px 18px;
          background: #ffffff;
          color: #0D7A75;
          border: 1.5px solid #0D7A75;
          font-weight: 700;
          font-size: 0.875rem;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-help-view-invoice:hover {
          background: #F4FBFA;
          transform: translateY(-1px);
        }

        /* Second Reference Image: Fresh Folded Towels with Green Leaves (Increased size below buttons) */
        .help-illustration-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px 0 6px;
          margin: auto 0;
          flex: 1;
        }

        .help-towels-img {
          width: 100%;
          max-width: 320px;
          height: auto;
          max-height: 220px;
          object-fit: contain;
          filter: drop-shadow(0 14px 28px rgba(13, 122, 117, 0.16));
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .help-towels-img:hover {
          transform: translateY(-3px) scale(1.03);
        }

        .help-secure-note {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 0.78rem;
          color: #64748B;
          font-weight: 500;
          text-align: center;
          margin-top: 10px;
        }

        /* Responsive Layout Improvements */
        @media (max-width: 1024px) {
          .tracking-summary-card {
            padding: 18px 20px;
          }
          .tracking-progress-card {
            padding: 24px 20px;
          }
        }

        @media (max-width: 960px) {
          .tracking-summary-card {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          .summary-metric-divider {
            display: none;
          }
          .tracking-progress-card {
            padding: 20px 16px 24px;
          }
          .horizontal-stepper-scroll-container {
            overflow-x: auto;
            padding-bottom: 8px;
            -webkit-overflow-scrolling: touch;
          }
          .horizontal-stepper {
            min-width: 680px;
          }
          .help-towels-img {
            max-width: 275px;
            max-height: 185px;
          }
        }

        @media (max-width: 768px) {
          .track-order-portal {
            padding: 8px 0 16px 0 !important;
          }

          .track-main-title {
            font-size: 1.45rem !important;
          }

          .track-main-subtitle {
            font-size: 0.8125rem !important;
          }

          .tracking-summary-card,
          .tracking-progress-card,
          .tracking-items-card,
          .tracking-help-card {
            padding: 16px 14px !important;
            border-radius: 16px !important;
          }

          .horizontal-stepper-scroll-container {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
            padding-bottom: 10px !important;
          }

          .horizontal-stepper {
            min-width: 620px !important;
          }

          .header-right-illustration {
            display: none !important;
          }
        }

        @media (max-width: 640px) {
          .track-header-row {
            flex-direction: column;
            align-items: flex-start;
          }
          .tracking-items-table {
            font-size: 0.8125rem;
          }
          .help-towels-img {
            max-width: 200px;
            max-height: 140px;
          }
        }
      `}</style>
    </div>
  );
};

export default TrackOrder;
