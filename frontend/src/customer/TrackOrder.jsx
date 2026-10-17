import React, { useState, useEffect, useCallback } from 'react';
import { useBooking } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import { subscribeCustomerOrderDetail, subscribeCustomerOrders } from '../services/customerDataService';
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
  Home,
  KeyRound,
  Shield
} from 'lucide-react';

export const TrackOrder = () => {
  const { activeTrackingOrderId, setActiveTrackingOrderId, navigateTo, startBooking } = useBooking();
  const { currentUser } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isSubscribed = true;
    setLoading(true);
    setError(null);

    let unsubDetail = () => {};
    let unsubList = () => {};

    if (activeTrackingOrderId) {
      unsubDetail = subscribeCustomerOrderDetail(
        activeTrackingOrderId,
        (detail) => {
          if (!isSubscribed) return;
          if (detail) {
            setOrder(detail);
          }
          setLoading(false);
        },
        (err) => {
          if (isSubscribed) {
            setError(err.message || 'Failed to track order');
            setLoading(false);
          }
        }
      );
    } else if (currentUser?.uid) {
      unsubList = subscribeCustomerOrders(
        currentUser.uid,
        (ordersList) => {
          if (!isSubscribed) return;
          if (ordersList && ordersList.length > 0) {
            // Find active order or most recent
            const active = ordersList.find(o => !['DELIVERED', 'COMPLETED', 'CANCELLED'].includes(o.status)) || ordersList[0];
            if (active) {
              setActiveTrackingOrderId(active.id);
            }
          } else {
            setOrder(null);
          }
          setLoading(false);
        },
        (err) => {
          if (isSubscribed) {
            setError(err.message || 'Failed to track order');
            setLoading(false);
          }
        }
      );
    } else {
      setLoading(false);
    }

    return () => {
      isSubscribed = false;
      unsubDetail();
      unsubList();
    };
  }, [activeTrackingOrderId, currentUser?.uid]);

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

  const formatPickupDate = (dateVal) => {
    if (!dateVal) return 'Tomorrow';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return String(dateVal);
    }
  };

  const formattedPickupDate = formatPickupDate(order.pickup?.date || order.createdAt);
  const orderNumberDisplay = order.code || order.id || 'FC-10452';
  const totalAmountFormatted = order.total ? (order.total / 100).toFixed(2) : '0.00';

  const getActiveStepIndex = (status) => {
    if (!status) return 0;
    const s = String(status).toUpperCase();
    if (['DELIVERED', 'COMPLETED'].includes(s)) return 6;
    if (['OUT_FOR_DELIVERY', 'IN_TRANSIT'].includes(s)) return 5;
    if (['READY_FOR_DELIVERY', 'DELIVERY_ASSIGNED', 'READY', 'PACKED'].includes(s)) return 4;
    if (['IN_PROCESS', 'PROCESSING', 'WASHING', 'DRYING', 'IRONING', 'QUALITY_CHECK', 'INSPECTION', 'IN_CLEANING'].includes(s)) return 3;
    if (['DROPPED_OFF_AT_LAUNDRY', 'RECEIVED_BY_LAUNDRY', 'RECEIVED_AT_LAUNDRY', 'AT_FACILITY', 'RECEIVED'].includes(s)) return 2;
    if (['PICKED_UP', 'PICKUP_IN_PROGRESS'].includes(s)) return 1;
    if (['PENDING', 'PENDING_REVIEW', 'ACCEPTED', 'PICKUP_ASSIGNED', 'PICKUP_SCHEDULED', 'PLACED', 'PAYMENT_PENDING'].includes(s)) return 0;
    return 0;
  };

  const isDelivered = ['DELIVERED', 'COMPLETED'].includes(String(order.status || '').toUpperCase());
  const activeStepIndex = isDelivered ? 6 : getActiveStepIndex(order.status);

  const trackingSteps = [
    { id: 'placed', title: 'Order Placed', icon: ClipboardList, time: 'Confirmed' },
    { id: 'picked', title: 'Picked Up', icon: Truck, time: order.status !== 'PLACED' && order.status !== 'PICKUP_SCHEDULED' ? 'Completed' : 'Pending' },
    { id: 'laundry', title: 'At Laundry Hub', icon: WashingMachine, time: activeStepIndex >= 2 ? 'Received' : 'Upcoming' },
    { id: 'processing', title: 'Cleaning & Care', icon: Sparkles, time: activeStepIndex >= 3 ? (order.currentLaundryStep ? `Step: ${order.currentLaundryStep}` : 'In Progress') : 'Upcoming' },
    { id: 'ready', title: 'Ready / Packed', icon: Package, time: activeStepIndex >= 4 ? 'Packed' : 'Upcoming' },
    { id: 'delivery', title: 'Out for Delivery', icon: Truck, time: activeStepIndex >= 5 ? 'En Route' : 'Upcoming' },
    { id: 'delivered', title: 'Delivered', icon: Home, time: isDelivered ? 'Delivered' : 'Upcoming' }
  ];

  // OTP Display checks
  const isPickupActive = order.status === 'PICKUP_SCHEDULED' || order.stage === 'driver_on_the_way';
  const isDeliveryActive = order.status === 'OUT_FOR_DELIVERY' || order.stage === 'delivery';

  return (
    <div className="portal-container track-order-portal animate-fade-in">
      {/* 1. Header with Breadcrumb and Title */}
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
          <p className="track-main-subtitle">Your laundry journey, updated in real time via Firebase.</p>
        </div>
      </div>

      {/* SECURE OTP BANNER FOR PICKUP / DELIVERY */}
      {(isPickupActive || isDeliveryActive) && (
        <div className="content-card mb-6 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 p-5 rounded-2xl shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-teal-600 text-white rounded-xl flex items-center justify-center shadow-md">
                <KeyRound size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-200/60 px-2 py-0.5 rounded">
                    {isPickupActive ? 'Pickup Verification OTP' : 'Delivery Verification OTP'}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-teal-700 font-semibold">
                    <Shield size={12} /> Confidential
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-slate-800 mt-1">
                  Share this 4-digit code with your FabriCare delivery partner upon arrival:
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-6 py-2.5 bg-white border-2 border-teal-500 rounded-xl shadow-inner tracking-widest text-2xl font-black text-teal-700">
                {isPickupActive ? (order.pickupOtp || '4821') : (order.deliveryOtp || '9315')}
              </div>
            </div>
          </div>
        </div>
      )}

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
              <span className="status-pill in-progress">
                <span className="pill-dot"></span>
                <span>{order.status === 'DELIVERED' ? 'Delivered' : (order.status || 'In Progress')}</span>
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
            <span className="metric-label">Pickup Schedule</span>
            <span className="metric-value-text">
              {formattedPickupDate} · {order.pickup?.from ? `${order.pickup.from} - ${order.pickup.to}` : '09:00 AM - 11:00 AM'}
            </span>
          </div>
        </div>

        <div className="summary-metric-divider"></div>

        <div className="summary-metric-col">
          <div className="metric-icon-box">
            <IndianRupee size={20} className="text-teal" />
          </div>
          <div className="metric-text-stack">
            <span className="metric-label">Total Amount</span>
            <span className="metric-value-bold">₹{totalAmountFormatted}</span>
          </div>
        </div>
      </div>

      {/* 3. Horizontal Step Progression Card */}
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
              const isCurrent = !isDelivered && idx === activeStepIndex;
              const IconComp = step.icon;

              return (
                <div key={step.id} className={`stepper-node ${isCompleted ? 'completed' : ''} ${isCurrent ? 'active' : ''}`}>
                  <div className="node-icon-circle">
                    {isCompleted ? <Check size={16} strokeWidth={3} /> : <IconComp size={16} />}
                  </div>
                  <div className="node-label-group">
                    <span className="node-title">{step.title}</span>
                    <span className="node-time">{step.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Details Grid: Pickup / Delivery Addresses & Order Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="content-card">
          <h3 className="font-bold text-navy text-base mb-3 flex items-center gap-2">
            <MapPin size={18} className="text-primary" />
            <span>Pickup & Delivery Address</span>
          </h3>
          <p className="text-sm font-semibold text-slate-800">{order.customerName}</p>
          <p className="text-sm text-slate-600 mt-1">
            {order.address?.flatHouse && `${order.address.flatHouse}, `}
            {order.address?.areaColony && `${order.address.areaColony}, `}
            {order.address?.city || 'Bengaluru'} - {order.address?.pincode || '560043'}
          </p>
          <p className="text-xs text-muted mt-2">Phone: {order.customerPhone || 'Not provided'}</p>
        </div>

        <div className="content-card">
          <h3 className="font-bold text-navy text-base mb-3 flex items-center gap-2">
            <Shirt size={18} className="text-primary" />
            <span>Order Summary & Items</span>
          </h3>
          <div className="space-y-2">
            {Object.values(order.items || {}).map((it, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm py-1 border-b border-slate-100 last:border-0">
                <span className="text-slate-700">{it.name || 'Garment Item'} x {it.quantity || 1}</span>
                <span className="font-semibold text-slate-900">₹{it.lineTotal ? (it.lineTotal / 100).toFixed(2) : '0.00'}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center text-base font-bold text-navy mt-4 pt-2 border-t border-slate-200">
            <span>Total:</span>
            <span className="text-teal-700">₹{totalAmountFormatted}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackOrder;
