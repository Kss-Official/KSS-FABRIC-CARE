import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Check, 
  CheckCircle2, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Truck, 
  Package, 
  ShieldCheck, 
  Sparkles, 
  RefreshCw, 
  ArrowRight, 
  ChevronRight, 
  Printer, 
  FileText, 
  UserCheck,
  AlertTriangle,
  Info,
  Calendar,
  ClipboardList,
  WashingMachine,
  Home
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';

// Parse dates reliably
export const parseAnyDate = (val) => {
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

// Dynamic day & month helper e.g. "19 Oct"
export const getDayMonth = (dateVal, fallback) => {
  const parsed = parseAnyDate(dateVal);
  if (parsed && !isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }
  return fallback;
};

// Timestamp formatter matching Customer Portal TrackOrder.jsx
export const formatStepTimestamp = (timestamp, fallbackDayMonth, fallbackTime) => {
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
  const baseDayMonth = fallbackDayMonth || '19 Oct';
  return `${baseDayMonth}, ${fallbackTime}`;
};

// Helper stub for dynamic workflow steps
export const getDynamicWorkflowSteps = (order) => {
  return [];
};

// Helper matching Customer Portal's exact 7-step tracker logic
export const getActiveStepIndex = (status, stage) => {
  if (!status && !stage) return 0;
  const clean = String(status || '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
  const cleanStage = String(stage || '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '');

  // Step 6: Delivered / Completed
  if (clean.includes('DELIVERED') || clean.includes('COMPLETED') || cleanStage.includes('DELIVERED') || cleanStage.includes('COMPLETED')) return 6;

  // Step 5: Out for delivery / In transit / Dispatched
  if (
    clean.includes('OUTFORDELIVERY') ||
    clean.includes('INTRANSIT') ||
    clean.includes('DISPATCHED') ||
    cleanStage === 'OUTFORDELIVERY' ||
    cleanStage.includes('INTRANSIT')
  ) return 5;

  // Step 4: Ready for delivery / Packed / Delivery assigned
  if (
    clean.includes('READYFORDELIVERY') ||
    clean === 'READY' ||
    clean.includes('DELIVERYASSIGNED') ||
    clean === 'PACKED' ||
    cleanStage === 'READY' ||
    cleanStage === 'PACKED' ||
    cleanStage.includes('READYFORDELIVERY')
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

export const OrderProcessingModal = ({ order, onClose, onOrderUpdated }) => {
  const { updateOrderStatus, setIsAssignOrderModalOpen, setAssigningOrder, orders: contextOrders } = useAdmin();
  const [currentStatus, setCurrentStatus] = useState(order?.status || 'Pending Pickup');
  const [isUpdating, setIsUpdating] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [modalTick, setModalTick] = useState(0);

  // Real-time synchronization across events (assignment, updates, storage)
  useEffect(() => {
    const handleSync = () => setModalTick(t => t + 1);
    window.addEventListener('storage', handleSync);
    window.addEventListener('fabricare_order_assigned', handleSync);
    window.addEventListener('fabricare_order_updated', handleSync);
    window.addEventListener('fabricare_pickup_delivery_updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('fabricare_order_assigned', handleSync);
      window.removeEventListener('fabricare_order_updated', handleSync);
      window.removeEventListener('fabricare_pickup_delivery_updated', handleSync);
    };
  }, []);

  // Lock body scroll while OrderProcessingModal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow || '';
    };
  }, []);

  // Tracking dates resolution
  const rawPickupDate = 
    (order?.pickup && typeof order.pickup === 'object' && order.pickup.date) ||
    order?.pickup_date ||
    order?.pickupDate ||
    order?.date ||
    order?.placedAt ||
    order?.createdAt ||
    order?.created_at;

  let rawDeliveryDate = 
    (order?.delivery && typeof order.delivery === 'object' && order.delivery.date) ||
    order?.delivery_date ||
    order?.deliveryDate ||
    order?.estimated_delivery ||
    order?.dueBy;

  if (!rawDeliveryDate) {
    const pickupParsed = parseAnyDate(rawPickupDate);
    if (pickupParsed && !isNaN(pickupParsed.getTime())) {
      const calcDelivery = new Date(pickupParsed);
      calcDelivery.setDate(calcDelivery.getDate() + (order?.isExpress ? 1 : 2));
      rawDeliveryDate = calcDelivery;
    }
  }

  const placedDayMonth = getDayMonth(order?.placedAt || order?.createdAt || order?.created_at || rawPickupDate, '18 Oct');
  const pickupDayMonth = getDayMonth(rawPickupDate, '19 Oct');
  const deliveryDayMonth = getDayMonth(rawDeliveryDate, '21 Oct');

  const formattedPickupTimeDisplay = useMemo(() => {
    let p = order?.pickupTime || '';
    if (!p) {
      const d = order?.pickup_date || order?.date || '25 Oct 2026';
      const s = order?.pickup_time_slot || '09:00 AM – 11:00 AM';
      p = `${d}, ${s}`;
    }
    const isoM = String(p).match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoM) {
      const dt = new Date(parseInt(isoM[1], 10), parseInt(isoM[2], 10) - 1, parseInt(isoM[3], 10));
      if (!isNaN(dt.getTime())) {
        const dStr = dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        p = p.replace(/^(\d{4})-(\d{1,2})-(\d{1,2})/, dStr);
      }
    }
    p = p.replace(/(AM|PM)\s*[-–—]\s*11:00\s*$/i, '$1');
    return p;
  }, [order?.pickupTime, order?.pickup_date, order?.date, order?.pickup_time_slot]);

  const isDelivered = Boolean(
    String(currentStatus || '').toUpperCase().includes('DELIVERED') || 
    String(currentStatus || '').toUpperCase().includes('COMPLETED')
  );

  const activeStepIndex = isDelivered ? 6 : getActiveStepIndex(currentStatus, order?.stage);

  // Exact 7 progress steps matching Customer Portal TrackOrder.jsx
  const trackingSteps = [
    {
      id: 'placed',
      title: 'Order placed',
      icon: ClipboardList,
      targetStatus: 'Pending Pickup',
      time: formatStepTimestamp(order?.created_at || order?.placedAt || order?.date, placedDayMonth, '9:12 AM')
    },
    {
      id: 'picked',
      title: 'Picked up',
      icon: Truck,
      targetStatus: 'Picked Up',
      time: formatStepTimestamp(order?.pickup_completed_at, pickupDayMonth, '11:05 AM')
    },
    {
      id: 'laundry',
      title: 'At laundry',
      icon: WashingMachine,
      targetStatus: 'At Laundry',
      time: formatStepTimestamp(order?.facility_received_at, pickupDayMonth, '1:30 PM')
    },
    {
      id: 'processing',
      title: 'Processing',
      icon: Sparkles,
      targetStatus: 'In Cleaning',
      time: formatStepTimestamp(order?.processing_started_at, pickupDayMonth, '3:45 PM')
    },
    {
      id: 'ready',
      title: 'Ready',
      icon: Package,
      targetStatus: 'Ready for Delivery',
      time: formatStepTimestamp(order?.ready_at, deliveryDayMonth, '10:00 AM')
    },
    {
      id: 'delivery',
      title: 'Out for delivery',
      icon: Truck,
      targetStatus: 'Out for Delivery',
      time: formatStepTimestamp(order?.out_for_delivery_at, deliveryDayMonth, '1:15 PM')
    },
    {
      id: 'delivered',
      title: 'Delivered',
      icon: Home,
      targetStatus: 'Delivered',
      time: formatStepTimestamp(order?.delivered_at, deliveryDayMonth, '3:00 PM')
    }
  ];

  const isFinalStep = isDelivered || activeStepIndex >= 6;
  const nextStep = !isFinalStep ? trackingSteps[activeStepIndex + 1] : null;

  // Advance to next step
  const handleProceedNextStep = async () => {
    if (!nextStep || isUpdating) return;

    setIsUpdating(true);
    setFeedbackMsg(null);
    try {
      const newStatus = nextStep.targetStatus;
      await updateOrderStatus(order.id, newStatus, `Advanced stage to ${nextStep.title}`);

      setCurrentStatus(newStatus);
      if (onOrderUpdated) {
        onOrderUpdated({ ...order, status: newStatus });
      }

      setFeedbackMsg({
        type: 'success',
        text: `Order successfully advanced to ${nextStep.title} (${newStatus}).`
      });

      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err) {
      console.error('Failed to advance order step:', err);
      setFeedbackMsg({
        type: 'error',
        text: 'Failed to update order status. Please try again.'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Jump to specific step
  const handleJumpToStep = async (targetStatus, stepTitle) => {
    if (isUpdating || targetStatus === currentStatus) return;

    setIsUpdating(true);
    setFeedbackMsg(null);
    try {
      await updateOrderStatus(order.id, targetStatus, `Admin moved stage directly to ${stepTitle}`);
      setCurrentStatus(targetStatus);
      if (onOrderUpdated) {
        onOrderUpdated({ ...order, status: targetStatus });
      }
      setFeedbackMsg({
        type: 'success',
        text: `Order stage updated to ${stepTitle} (${targetStatus}).`
      });
      setTimeout(() => setFeedbackMsg(null), 3500);
    } catch (err) {
      console.error('Failed to change step:', err);
      setFeedbackMsg({
        type: 'error',
        text: 'Failed to update step.'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Resolve items and ensure individual item unit prices are displayed
  const displayItems = useMemo(() => {
    let itemsList = [];
    if (Array.isArray(order?.items) && order.items.length > 0) {
      itemsList = order.items;
    } else if (order?.items && typeof order.items === 'object') {
      itemsList = Object.values(order.items);
    }

    if (itemsList.length > 0) {
      return itemsList.map(it => {
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
          name: it.name || it.item_name || it.garment || 'Garment',
          category: it.category || 'Apparel',
          service: it.service || it.service_name || 'Wash & Fold',
          quantity: qty,
          unitPrice: finalUnitPrice,
          price: finalUnitPrice
        };
      });
    }

    const svcs = Array.isArray(order?.services) ? order.services : [order?.service || 'Wash & Fold'];
    const sStr = svcs.join(' ').toLowerCase();

    if (sStr.includes('dry clean')) {
      return [
        { name: 'Silk Saree / Blazer', category: 'Formal Wear', quantity: 1, service: 'Dry Cleaning', price: 240, unitPrice: 240 }
      ];
    }
    if (sStr.includes('shoe')) {
      return [
        { name: 'Sneakers (White Fabric)', category: 'Footwear', quantity: 1, service: 'Shoe Laundry', price: 350, unitPrice: 350 }
      ];
    }
    if (sStr.includes('steam')) {
      return [
        { name: 'Designer Kurta / Suit', category: 'Ethnic Wear', quantity: 2, service: 'Steam Iron', price: 140, unitPrice: 140 }
      ];
    }
    if (sStr.includes('home care')) {
      return [
        { name: 'Drapes & Bedspread Set', category: 'Household', quantity: 2, service: 'Home Care', price: 390, unitPrice: 390 }
      ];
    }
    if (sStr.includes('iron')) {
      return [
        { name: 'Cotton Shirts', category: "Men's Wear", quantity: 3, service: 'Wash & Iron', price: 80, unitPrice: 80 },
        { name: 'Formal Trousers', category: "Men's Wear", quantity: 2, service: 'Wash & Iron', price: 90, unitPrice: 90 }
      ];
    }
    // Default Wash & Fold
    return [
      { name: 'Cotton Shirts', category: "Men's Wear", quantity: 3, service: 'Wash & Fold', price: 80, unitPrice: 80 },
      { name: 'Casual T-Shirts', category: 'Casual', quantity: 4, service: 'Wash & Fold', price: 50, unitPrice: 50 },
      { name: 'Trousers / Chinos', category: 'Bottoms', quantity: 2, service: 'Wash & Fold', price: 60, unitPrice: 60 }
    ];
  }, [order]);

  const customerName = order?.customer?.name || order?.customer_name || 'Customer';
  const customerPhone = order?.customer?.phone || order?.customer_phone || '+91 98765 43210';
  const customerAddress = order?.customer?.address || order?.pickup_address || 'Bengaluru, Karnataka';
  const orderAmount = order?.amount ?? order?.total_amount ?? order?.total ?? 0;
  const paymentStatus = order?.payment || (order?.paymentStatus === 'Pending' ? 'Pending' : 'Paid');
  const cleanId = String(order?.id || order?.order_number || order?.order_id || '').replace(/^#/, '');

  const persistedAssignments = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('fabricare_pickup_delivery_assignments') || '{}');
    } catch (_) {
      return {};
    }
  }, [modalTick, order?.id]);

  const persistedMatch = useMemo(() => {
    if (!cleanId) return null;
    return (
      persistedAssignments[cleanId] ||
      persistedAssignments[`#${cleanId}`] ||
      persistedAssignments[order?.id] ||
      persistedAssignments[order?.rawId] ||
      persistedAssignments[order?.order_number] ||
      persistedAssignments[order?.order_id] ||
      null
    );
  }, [persistedAssignments, cleanId, order]);

  // Context order fallback
  const liveContextOrder = useMemo(() => {
    if (!contextOrders || !cleanId) return null;
    return contextOrders.find(co => {
      const coId = String(co.id || co.order_number || co.order_id || '').replace(/^#/, '');
      return coId === cleanId || co.rawId === order?.rawId;
    });
  }, [contextOrders, cleanId, order]);

  const { riderName, riderPhone, isRiderAssigned } = useMemo(() => {
    let name = '';
    let phone = '';

    if (persistedMatch && persistedMatch.driverName) {
      name = persistedMatch.driverName;
      phone = persistedMatch.driverPhone || '';
    } else if (order?.assignedAgentName) {
      name = order.assignedAgentName;
      phone = order.assignedAgentPhone || '';
    } else if (order?.assigned_pickup_driver_detail?.full_name) {
      name = order.assigned_pickup_driver_detail.full_name;
      phone = order.assigned_pickup_driver_detail.phone || '';
    } else if (order?.assigned_delivery_driver_detail?.full_name) {
      name = order.assigned_delivery_driver_detail.full_name;
      phone = order.assigned_delivery_driver_detail.phone || '';
    } else if (order?.driver && typeof order.driver === 'object') {
      name = order.driver.name || '';
      phone = order.driver.phone || '';
    } else if (order?.driver && typeof order.driver === 'string' && order.driver !== 'Not Assigned' && order.driver !== '—') {
      const match = String(order.driver).match(/^(.*?)\s*\((.*?)\)$/);
      name = match ? match[1].trim() : order.driver;
      phone = match ? match[2].trim() : '';
    } else if (order?.assigned_pickup_driver && typeof order.assigned_pickup_driver === 'string' && order.assigned_pickup_driver !== 'Not Assigned') {
      name = order.assigned_pickup_driver;
    }

    // Check liveContextOrder if still not found
    if (!name && liveContextOrder) {
      if (liveContextOrder.assignedAgentName) {
        name = liveContextOrder.assignedAgentName;
        phone = liveContextOrder.assignedAgentPhone || '';
      } else if (liveContextOrder.assigned_pickup_driver_detail?.full_name) {
        name = liveContextOrder.assigned_pickup_driver_detail.full_name;
        phone = liveContextOrder.assigned_pickup_driver_detail.phone || '';
      } else if (liveContextOrder.driver && typeof liveContextOrder.driver === 'object') {
        name = liveContextOrder.driver.name || '';
        phone = liveContextOrder.driver.phone || '';
      } else if (liveContextOrder.driver && typeof liveContextOrder.driver === 'string' && liveContextOrder.driver !== 'Not Assigned' && liveContextOrder.driver !== '—') {
        const match = String(liveContextOrder.driver).match(/^(.*?)\s*\((.*?)\)$/);
        name = match ? match[1].trim() : liveContextOrder.driver;
        phone = match ? match[2].trim() : '';
      }
    }

    const assigned = Boolean(name && name !== 'Not Assigned' && name !== '—');
    return {
      riderName: assigned ? name : 'Not Assigned',
      riderPhone: phone,
      isRiderAssigned: assigned
    };
  }, [persistedMatch, order, liveContextOrder]);

  const driverName = riderName;

  const modalContent = (
    <div className="order-proc-modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="order-proc-modal-card animate-scale-up" onClick={(e) => e.stopPropagation()}>
        {/* MODAL HEADER */}
        <div className="order-proc-modal-header">
          <div className="header-meta-group">
            <div className="order-title-box">
              <h2 className="order-id-headline">{order?.id || order?.order_number || '#ORD-2026'}</h2>
              <span className={`status-badge-capsule status-${currentStatus.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
                {currentStatus}
              </span>
            </div>
            <p className="order-sub-meta">
              Placed on <strong style={{ color: '#334155' }}>{order?.date || '23 Sep 2026'}</strong> • Pickup: <span style={{ color: '#0D7A75', fontWeight: 600 }}>{formattedPickupTimeDisplay || '25 Oct 2026, 09:00 AM – 11:00 AM'}</span>
            </p>
          </div>

          <div className="header-actions-group">
            <button 
              type="button" 
              className="proc-header-icon-btn" 
              title="Print Order Summary"
              onClick={() => window.print()}
            >
              <Printer size={16} />
              <span>Print</span>
            </button>

            <button 
              type="button" 
              className="proc-close-icon-btn" 
              onClick={onClose}
              aria-label="Close Modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* FEEDBACK ALERT */}
        {feedbackMsg && (
          <div className={`proc-feedback-banner ${feedbackMsg.type}`}>
            {feedbackMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* MODAL BODY */}
        <div className="order-proc-modal-body">
          {/* CUSTOMER PORTAL TRACK ORDER PROGRESS CARD */}
          <div className="proc-section-card tracking-progress-card">
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
                      <div 
                        className={`horizontal-step-item ${isCompleted ? 'completed' : isActive ? 'active' : 'pending'}`}
                        onClick={() => handleJumpToStep(step.targetStatus, step.title)}
                        title={`Click to set order status to ${step.title}`}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className={`step-node-bubble ${isCompleted ? 'completed' : isActive ? 'active' : 'pending'}`}>
                          {isActive && <div className="step-active-outer-halo" />}
                          <div className="step-node-inner">
                            {isCompleted ? (
                              <Check size={18} strokeWidth={2.6} color="#ffffff" />
                            ) : (
                              <IconComp size={18} strokeWidth={1.8} />
                            )}
                          </div>
                        </div>
                        <div className="step-label-group">
                          <h4 className={`step-label-title ${isActive ? 'active-title' : isPending ? 'pending-title' : ''}`}>
                            {step.title}
                          </h4>
                          <span className={`step-label-subtitle ${isCompleted ? 'time-sub' : isActive ? 'active-sub' : 'pending-sub'}`}>
                            {isCompleted 
                              ? step.time 
                              : isActive 
                                ? 'In progress' 
                                : 'Pending'}
                          </span>
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

          {/* 3. TWO-COLUMN ORDER DETAILS GRID */}
          <div className="proc-details-two-columns">
            {/* Left: Customer & Logistics Info */}
            <div className="proc-section-card column-card">
              <h4 className="card-section-title">
                <User size={16} color="#0D7A75" />
                <span>Customer & Logistics Details</span>
              </h4>

              <div className="customer-profile-block">
                <div className="cust-big-avatar">
                  {customerName.substring(0, 2).toUpperCase()}
                </div>
                <div className="cust-profile-text">
                  <strong className="cust-name-str">{customerName}</strong>
                  <div className="cust-contact-pills">
                    <span className="contact-pill"><Phone size={12} /> {customerPhone}</span>
                    <span className="contact-pill"><Mail size={12} /> customer@gmail.com</span>
                  </div>
                </div>
              </div>

              <div className="logistics-info-list">
                <div className="logistic-item">
                  <MapPin size={16} className="item-icon-slate" />
                  <div className="logistic-text">
                    <span className="logistic-lbl">Pickup Address:</span>
                    <strong className="logistic-val">{customerAddress}</strong>
                  </div>
                </div>

                <div className="logistic-item">
                  <Calendar size={16} className="item-icon-slate" />
                  <div className="logistic-text">
                    <span className="logistic-lbl">Pickup Slot:</span>
                    <strong className="logistic-val">{formattedPickupTimeDisplay || '25 Oct 2026, 09:00 AM – 11:00 AM'}</strong>
                  </div>
                </div>

                <div className="logistic-item">
                  <Truck size={16} className="item-icon-slate" />
                  <div className="logistic-text">
                    <span className="logistic-lbl">Assigned Rider:</span>
                    <div className="driver-row">
                      <div className="driver-details-stack" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong className="logistic-val" style={{ color: isRiderAssigned ? '#0F172A' : '#64748B' }}>
                            {riderName}
                          </strong>
                          {isRiderAssigned && (
                            <span 
                              style={{ 
                                fontSize: '0.6875rem', 
                                fontWeight: 600, 
                                background: '#ECFDF5', 
                                color: '#047857', 
                                padding: '2px 8px', 
                                borderRadius: '12px',
                                border: '1px solid #A7F3D0'
                              }}
                            >
                              Assigned
                            </span>
                          )}
                        </div>
                        {isRiderAssigned && riderPhone ? (
                          <span className="driver-phone-sub" style={{ fontSize: '0.75rem', color: '#64748B' }}>
                            {riderPhone}
                          </span>
                        ) : null}
                      </div>
                      {!isRiderAssigned && (
                        <button 
                          type="button" 
                          className="change-driver-btn"
                          onClick={() => {
                            setAssigningOrder(order);
                            setIsAssignOrderModalOpen(true);
                          }}
                        >
                          <UserCheck size={13} />
                          <span>Assign Rider</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Service & Items Breakdown */}
            <div className="proc-section-card column-card">
              <div className="card-header-flex">
                <h4 className="card-section-title">
                  <Sparkles size={16} color="#0D7A75" />
                  <span>Services & Garment Items ({displayItems.length})</span>
                </h4>
                <div className="services-pill-cluster">
                  {(Array.isArray(order?.services) ? order.services : [order?.service || 'Wash & Fold']).map(s => (
                    <span key={s} className="service-tag-capsule">{s}</span>
                  ))}
                </div>
              </div>

              {/* Items List Table */}
              <div className="proc-items-table-wrapper">
                <table className="proc-items-table">
                  <thead>
                    <tr>
                      <th>Garment Item</th>
                      <th>Category</th>
                      <th style={{ textAlign: 'center' }}>Qty</th>
                      <th style={{ textAlign: 'right' }}>Item Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayItems.map((it, idx) => (
                      <tr key={idx}>
                        <td>
                          <div className="item-name-cell">
                            <strong>{it.name}</strong>
                            <span className="item-service-subtext">{it.service || 'Wash & Fold'}</span>
                          </div>
                        </td>
                        <td>
                          <span className="category-pill">{it.category || 'Apparel'}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="qty-capsule">×{it.quantity || 1}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="item-price-val">₹{it.price ?? it.unitPrice ?? 60}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Care Instructions Note */}
              <div className="proc-care-notes-box">
                <Info size={14} color="#0D7A75" style={{ flexShrink: 0, marginTop: '2px' }} />
                <p className="care-notes-text">
                  <strong>Care Instruction:</strong> Standard wash at 30°C. Color-separate whites and darks. Follow fabric labels strictly during cleaning & pressing.
                </p>
              </div>
            </div>
          </div>

          {/* 4. FINANCIAL SUMMARY CARD */}
          <div className="proc-section-card finance-summary-card">
            <div className="finance-left">
              <div className="payment-status-block">
                <span className="finance-label">Payment Status</span>
                <span className={`payment-pill-badge payment-${paymentStatus.toLowerCase()}`}>
                  {paymentStatus}
                </span>
              </div>
              <span className="finance-sub-note">Payment verified via Razorpay / Direct Gateway</span>
            </div>

            <div className="finance-right">
              <div className="finance-total-block">
                <span className="finance-total-lbl">Order Total Amount</span>
                <strong className="finance-total-val">₹{orderAmount}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="order-proc-modal-footer">
          <div className="footer-left">
            <button 
              type="button" 
              className="proc-secondary-btn"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>

        {/* EMBEDDED STYLES MATCHING THE REFERENCE DESIGN */}
        <style>{`
          .order-proc-modal-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.65);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            z-index: 9999;
            overflow-y: auto;
          }

          .order-proc-modal-card {
            background: #FFFFFF;
            width: 100%;
            max-width: 980px;
            max-height: 92vh;
            display: flex;
            flex-direction: column;
            border-radius: 20px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            border: 1px solid #E2E8F0;
            overflow: hidden;
          }

          /* HEADER */
          .order-proc-modal-header {
            padding: 18px 24px;
            border-bottom: 1.5px solid #F1F5F9;
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #FAFCFD;
          }

          .header-meta-group {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .order-title-box {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .order-id-headline {
            font-size: 1.35rem;
            font-weight: 800;
            color: #0F172A;
            letter-spacing: -0.02em;
            margin: 0;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          }

          .status-badge-capsule {
            border-radius: 9999px;
            padding: 3px 12px;
            font-size: 0.75rem;
            font-weight: 700;
            display: inline-flex;
            align-items: center;
          }

          .status-pending-pickup, .status-pickup-scheduled {
            background: #FFF1E8;
            color: #EA580C;
          }

          .status-received, .status-inspection, .status-in-cleaning, .status-washing, .status-folding, .status-ironing, .status-dry-cleaning, .status-pressing, .status-steaming, .status-shoe-cleaning {
            background: #FEF9C3;
            color: #CA8A04;
          }

          .status-quality-check {
            background: #EDE9FE;
            color: #6D28D9;
          }

          .status-packing {
            background: #E0F2FE;
            color: #0284C7;
          }

          .status-ready-for-delivery {
            background: #F3E8FF;
            color: #9333EA;
          }

          .status-completed, .status-delivered {
            background: #DCFCE7;
            color: #16A34A;
          }

          .order-sub-meta {
            font-size: 0.8125rem;
            color: #64748B;
            margin: 0;
          }

          .header-actions-group {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .proc-header-icon-btn {
            background: #FFFFFF;
            border: 1.5px solid #E2E8F0;
            border-radius: 8px;
            padding: 7px 14px;
            font-size: 0.8125rem;
            font-weight: 600;
            color: #475569;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            cursor: pointer;
            transition: all 0.15s ease;
          }

          .proc-header-icon-btn:hover {
            background: #F8FAFC;
            color: #0F172A;
            border-color: #CBD5E1;
          }

          .proc-close-icon-btn {
            width: 34px;
            height: 34px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: none;
            background: none;
            color: #94A3B8;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.15s ease;
          }

          .proc-close-icon-btn:hover {
            background: #F1F5F9;
            color: #0F172A;
          }

          /* FEEDBACK BANNER */
          .proc-feedback-banner {
            padding: 10px 24px;
            font-size: 0.8125rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .proc-feedback-banner.success {
            background: #ECFDF5;
            color: #065F46;
            border-bottom: 1px solid #A7F3D0;
          }

          .proc-feedback-banner.error {
            background: #FEF2F2;
            color: #991B1B;
            border-bottom: 1px solid #FECACA;
          }

          /* BODY */
          .order-proc-modal-body {
            padding: 24px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 18px;
            background: #F8FAFC;
          }

          .proc-section-card {
            background: #FFFFFF;
            border: 1px solid #E2E8F0;
            border-radius: 16px;
            padding: 20px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
          }

          /* CUSTOMER PORTAL TRACKER PROGRESS CARD */
          .tracking-progress-card {
            margin-bottom: 20px;
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
            padding: 6px 0 10px;
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
            transition: transform 0.15s ease;
          }

          .horizontal-step-item:hover {
            transform: translateY(-2px);
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

          /* TWO COLUMNS */
          .proc-details-two-columns {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 18px;
          }

          @media (max-width: 820px) {
            .proc-details-two-columns {
              grid-template-columns: 1fr;
            }
          }

          .column-card {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .card-section-title {
            font-size: 0.9375rem;
            font-weight: 800;
            color: #0F172A;
            margin: 0;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .card-header-flex {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
          }

          .services-pill-cluster {
            display: flex;
            align-items: center;
            gap: 6px;
            flex-wrap: wrap;
          }

          .service-tag-capsule {
            background: #E6F4F2;
            color: #0D7A75;
            font-size: 0.75rem;
            font-weight: 700;
            padding: 3px 10px;
            border-radius: 9999px;
          }

          /* CUSTOMER PROFILE */
          .customer-profile-block {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 12px 14px;
            background: #F8FAFC;
            border: 1px solid #F1F5F9;
            border-radius: 12px;
          }

          .cust-big-avatar {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: #EBF8F7;
            color: #0D7A75;
            font-size: 1rem;
            font-weight: 800;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .cust-profile-text {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .cust-name-str {
            font-size: 0.9375rem;
            font-weight: 800;
            color: #1E293B;
          }

          .cust-contact-pills {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
          }

          .contact-pill {
            font-size: 0.75rem;
            color: #64748B;
            display: inline-flex;
            align-items: center;
            gap: 4px;
          }

          /* LOGISTICS LIST */
          .logistics-info-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .logistic-item {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            font-size: 0.8125rem;
          }

          .item-icon-slate {
            color: #64748B;
            margin-top: 2px;
            flex-shrink: 0;
          }

          .logistic-text {
            display: flex;
            flex-direction: column;
            gap: 2px;
            flex: 1;
          }

          .logistic-lbl {
            font-size: 0.6875rem;
            font-weight: 700;
            color: #94A3B8;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }

          .logistic-val {
            color: #1E293B;
            font-weight: 600;
          }

          .driver-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
          }

          .change-driver-btn {
            background: none;
            border: 1px solid #CBD5E1;
            border-radius: 6px;
            padding: 3px 8px;
            font-size: 0.6875rem;
            font-weight: 700;
            color: #0D7A75;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            transition: all 0.15s ease;
          }

          .change-driver-btn:hover {
            background: #E6F4F2;
            border-color: #0D7A75;
          }

          /* ITEMS TABLE */
          .proc-items-table-wrapper {
            border: 1px solid #F1F5F9;
            border-radius: 10px;
            overflow: hidden;
          }

          .proc-items-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.8125rem;
          }

          .proc-items-table th {
            background: #F8FAFC;
            padding: 8px 12px;
            color: #64748B;
            font-weight: 700;
            font-size: 0.6875rem;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            border-bottom: 1px solid #F1F5F9;
          }

          .proc-items-table td {
            padding: 10px 12px;
            border-bottom: 1px solid #F8FAFC;
            vertical-align: middle;
          }

          .proc-items-table tr:last-child td {
            border-bottom: none;
          }

          .item-name-cell {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .item-service-subtext {
            font-size: 0.6875rem;
            color: #0D7A75;
            font-weight: 600;
          }

          .category-pill {
            background: #F1F5F9;
            color: #475569;
            font-size: 0.6875rem;
            font-weight: 600;
            padding: 2px 8px;
            border-radius: 4px;
          }

          .qty-capsule {
            font-weight: 800;
            color: #0F172A;
          }

          .item-price-val {
            font-weight: 700;
            color: #1E293B;
          }

          .proc-care-notes-box {
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            padding: 10px 12px;
            display: flex;
            align-items: flex-start;
            gap: 8px;
          }

          .care-notes-text {
            font-size: 0.75rem;
            color: #475569;
            margin: 0;
            line-height: 1.4;
          }

          /* FINANCIAL SUMMARY CARD */
          .finance-summary-card {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 20px;
            background: #FAFCFD;
            border: 1px solid #E2E8F0;
          }

          .finance-left {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .payment-status-block {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .finance-label {
            font-size: 0.75rem;
            font-weight: 700;
            color: #64748B;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }

          .payment-pill-badge {
            border-radius: 9999px;
            padding: 3px 12px;
            font-size: 0.75rem;
            font-weight: 700;
          }

          .payment-paid {
            background: #DCFCE7;
            color: #16A34A;
          }

          .payment-cod {
            background: #FEF9C3;
            color: #CA8A04;
          }

          .payment-unpaid, .payment-pending {
            background: #FFE4E6;
            color: #E11D48;
          }

          .finance-sub-note {
            font-size: 0.75rem;
            color: #94A3B8;
          }

          .finance-right {
            text-align: right;
          }

          .finance-total-block {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .finance-total-lbl {
            font-size: 0.75rem;
            font-weight: 700;
            color: #64748B;
            text-transform: uppercase;
          }

          .finance-total-val {
            font-size: 1.4rem;
            font-weight: 900;
            color: #0F172A;
          }

          /* FOOTER */
          .order-proc-modal-footer {
            padding: 16px 24px;
            border-top: 1.5px solid #F1F5F9;
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #FFFFFF;
          }

          .proc-secondary-btn {
            background: #F1F5F9;
            color: #475569;
            border: 1px solid #E2E8F0;
            border-radius: 9999px;
            padding: 8px 20px;
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s ease;
          }

          .proc-secondary-btn:hover {
            background: #E2E8F0;
            color: #0F172A;
          }

          .proc-primary-action-btn {
            background: #087F77;
            color: #FFFFFF;
            border: none;
            border-radius: 9999px;
            padding: 9px 24px;
            font-size: 0.875rem;
            font-weight: 700;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            box-shadow: 0 4px 10px rgba(8, 127, 119, 0.25);
            transition: all 0.15s ease;
          }

          .proc-primary-action-btn:hover:not(:disabled) {
            background: #066761;
            transform: translateY(-1px);
          }

          .proc-primary-action-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          @keyframes pulse-ring {
            0% { box-shadow: 0 0 0 0 rgba(13, 122, 117, 0.4); }
            70% { box-shadow: 0 0 0 8px rgba(13, 122, 117, 0); }
            100% { box-shadow: 0 0 0 0 rgba(13, 122, 117, 0); }
          }
        `}</style>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
