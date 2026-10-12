import React, { useState, useEffect } from 'react';
import { useBooking } from '../context/BookingContext';
import { ordersApi } from '../api/apiClient';
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
  Shirt
} from 'lucide-react';

export const TrackOrder = () => {
  const { activeTrackingOrderId, navigateTo, startBooking } = useBooking();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrderDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTrackingOrderId) {
        const res = await ordersApi.getOrderById(activeTrackingOrderId);
        setOrder(res.data);
      } else {
        const res = await ordersApi.getOrders();
        const list = Array.isArray(res.data) ? res.data : (res.data?.results || []);
        if (list.length > 0) {
          const active = list.find(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED') || list[0];
          setOrder(active);
        } else {
          setOrder(null);
        }
      }
    } catch (err) {
      console.error('Failed to load tracking details:', err);
      setError('Could not retrieve order details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [activeTrackingOrderId]);

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

  // Format pickup date
  const formatPickupDate = (dateStr) => {
    if (!dateStr) return '12 Oct 2026';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formattedPickupDate = formatPickupDate(order.pickup_date);
  const orderNumberDisplay = order.order_number ? `#${order.order_number.replace(/^#/, '')}` : '#FC8F71E';
  const orderPlacedTime = `${formattedPickupDate} · 08:45 AM`;
  const pickedUpTime = `${formattedPickupDate} · 10:15 AM`;
  const facilityTime = `${formattedPickupDate} · 11:30 AM`;
  const cleaningEstTime = `${formattedPickupDate} · 02:00 PM (est.)`;
  const estimatedDeliveryDate = '14 Oct 2026';

  const orderItems = order.items && order.items.length > 0 
    ? order.items.map(it => ({
        name: it.item_name || 'Fabric Care',
        subtitle: it.service_category || 'Premium Wash & Care',
        quantity: it.quantity || 1,
        rate: it.unit_price || 120,
        total: it.total_price || 120
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
              <span className="status-pill in-progress">
                <span className="pill-dot"></span>
                <span>{order.status === 'DELIVERED' ? 'Delivered' : 'In Progress'}</span>
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
              {formattedPickupDate} · {order.pickup_time_slot || '9:00 AM – 11:00 AM'}
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
            <span className="metric-value-bold">₹{parseFloat(order.total_amount || order.estimated_amount || 120).toFixed(2)}</span>
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

      {/* 3. Horizontal Step Progression Card */}
      <div className="content-card tracking-progress-card mb-6">
        <div className="horizontal-stepper">
          {/* Step 1: Order Placed */}
          <div className="horizontal-step-item completed">
            <div className="step-circle-badge">
              <div className="circle-check-bubble">
                <Check size={11} strokeWidth={3} />
              </div>
              <div className="circle-icon-inner">
                <ClipboardList size={20} />
              </div>
            </div>
            <div className="step-label-group">
              <h4 className="step-label-title">Order Placed</h4>
              <span className="step-label-time">{orderPlacedTime}</span>
            </div>
          </div>

          <div className="stepper-connecting-line completed"></div>

          {/* Step 2: Picked Up */}
          <div className="horizontal-step-item completed">
            <div className="step-circle-badge">
              <div className="circle-check-bubble">
                <Check size={11} strokeWidth={3} />
              </div>
              <div className="circle-icon-inner">
                <Truck size={20} />
              </div>
            </div>
            <div className="step-label-group">
              <h4 className="step-label-title">Picked Up</h4>
              <span className="step-label-time">{pickedUpTime}</span>
            </div>
          </div>

          <div className="stepper-connecting-line completed"></div>

          {/* Step 3: Cleaning & Care (Active Highlight) */}
          <div className="horizontal-step-item active">
            <div className="step-circle-badge active-glow">
              <div className="circle-icon-inner">
                <WashingMachine size={22} />
              </div>
            </div>
            <div className="step-label-group active-group">
              <h4 className="step-label-title active-title">Cleaning & Care</h4>
              <span className="active-tag-badge">In Progress</span>
              <p className="step-active-desc">
                Your clothes are being washed, dried and ironed with care.
              </p>
            </div>
          </div>

          <div className="stepper-connecting-line pending"></div>

          {/* Step 4: Ready for Delivery */}
          <div className="horizontal-step-item pending">
            <div className="step-circle-badge pending-circle">
              <div className="circle-icon-inner">
                <Truck size={20} />
              </div>
            </div>
            <div className="step-label-group">
              <h4 className="step-label-title pending-title">Ready for Delivery</h4>
              <span className="step-label-pending">Pending</span>
            </div>
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
            {/* Event 1 */}
            <div className="journey-event-item">
              <div className="event-node-col">
                <div className="event-node-bubble checked">
                  <Check size={11} strokeWidth={3} />
                </div>
                <div className="event-timeline-line"></div>
              </div>
              <div className="event-info-col">
                <div className="event-title-time">
                  <h5 className="event-title">Order placed</h5>
                  <span className="event-time">{orderPlacedTime}</span>
                </div>
                <p className="event-desc">We received your order</p>
              </div>
            </div>

            {/* Event 2 */}
            <div className="journey-event-item">
              <div className="event-node-col">
                <div className="event-node-bubble checked">
                  <Check size={11} strokeWidth={3} />
                </div>
                <div className="event-timeline-line"></div>
              </div>
              <div className="event-info-col">
                <div className="event-title-time">
                  <h5 className="event-title">Picked up</h5>
                  <span className="event-time">{pickedUpTime}</span>
                </div>
                <p className="event-desc">Collected by your delivery partner</p>
              </div>
            </div>

            {/* Event 3 */}
            <div className="journey-event-item">
              <div className="event-node-col">
                <div className="event-node-bubble active-icon-node">
                  <WashingMachine size={13} />
                </div>
                <div className="event-timeline-line"></div>
              </div>
              <div className="event-info-col">
                <div className="event-title-time">
                  <h5 className="event-title active-teal">At the facility</h5>
                  <span className="event-time">{facilityTime}</span>
                </div>
                <p className="event-desc">Items weighed and quality checked</p>
              </div>
            </div>

            {/* Event 4 */}
            <div className="journey-event-item">
              <div className="event-node-col">
                <div className="event-node-bubble concentric-node">
                  <span className="concentric-dot"></span>
                </div>
              </div>
              <div className="event-info-col">
                <div className="event-title-time">
                  <h5 className="event-title">Cleaning in progress</h5>
                  <span className="event-time">{cleaningEstTime}</span>
                </div>
                <p className="event-desc">Washing, drying and ironing</p>
              </div>
            </div>
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
                    {order.assigned_delivery_staff_name || 'Awaiting assignment'}
                  </span>
                </div>
              </div>
              <span className="text-slate-300 font-bold">—</span>
            </div>

            {/* Estimated Delivery */}
            <div className="delivery-detail-box">
              <div className="detail-box-left">
                <div className="detail-icon-circle">
                  <Calendar size={17} />
                </div>
                <div className="detail-text-stack">
                  <span className="detail-box-label">Estimated Delivery</span>
                  <span className="detail-box-value bold">
                    {estimatedDeliveryDate}
                  </span>
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
                    <td className="td-rate">₹{parseFloat(item.rate).toFixed(2)}</td>
                    <td className="td-total bold">₹{parseFloat(item.total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="grand-total-row">
                  <td colSpan={3} className="grand-total-label">Grand Total</td>
                  <td className="grand-total-val">₹{parseFloat(order.total_amount || order.estimated_amount || 120).toFixed(2)}</td>
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
          <div className="card-section-header">
            <Headphones size={18} className="text-teal" />
            <h3 className="card-section-title">Need help?</h3>
          </div>

          <p className="help-sub-desc">
            Our support team is here to assist you with any questions or concerns.
          </p>

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

        /* 3. Horizontal Progression Card */
        .tracking-progress-card {
          background: #ffffff;
          border: 1.5px solid #E2E8F0;
          border-radius: 20px;
          padding: 32px 36px 28px;
        }

        .horizontal-stepper {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          position: relative;
          width: 100%;
        }

        .horizontal-step-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
          z-index: 2;
          flex: 1;
        }

        .step-circle-badge {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: #E8FAF6;
          border: 1.5px solid #BCEAE6;
          color: #0D7A75;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          margin-bottom: 12px;
          transition: all 0.2s;
        }

        .circle-check-bubble {
          position: absolute;
          top: -6px;
          left: -6px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #0D7A75;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .circle-icon-inner {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .step-circle-badge.active-glow {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #E8FAF6;
          border: 3px solid #0D7A75;
          box-shadow: 0 0 0 6px rgba(13, 122, 117, 0.12);
          color: #0D7A75;
        }

        .step-circle-badge.pending-circle {
          background: #F8FAFC;
          border: 1.5px solid #E2E8F0;
          color: #94A3B8;
        }

        .step-label-group {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .step-label-title {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #0F172A;
          margin: 0;
        }

        .step-label-time {
          font-size: 0.75rem;
          color: #64748B;
          margin-top: 3px;
        }

        .step-label-title.active-title {
          color: #0D7A75;
          font-size: 1rem;
        }

        .active-tag-badge {
          display: inline-block;
          font-size: 0.72rem;
          font-weight: 700;
          color: #0D7A75;
          margin-top: 2px;
        }

        .step-active-desc {
          font-size: 0.75rem;
          color: #64748B;
          max-width: 200px;
          line-height: 1.35;
          margin-top: 4px;
        }

        .step-label-title.pending-title {
          color: #64748B;
          font-weight: 600;
        }

        .step-label-pending {
          font-size: 0.75rem;
          color: #94A3B8;
          margin-top: 3px;
        }

        .stepper-connecting-line {
          flex: 1;
          height: 3px;
          margin: 24px 8px 0;
          position: relative;
          z-index: 1;
        }

        .stepper-connecting-line.completed {
          background: #0D7A75;
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

        .event-time {
          font-size: 0.75rem;
          color: #64748B;
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
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .help-sub-desc {
          font-size: 0.8125rem;
          color: #64748B;
          line-height: 1.45;
          margin-top: -6px;
          margin-bottom: 20px;
        }

        .help-actions-stack {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 18px;
        }

        .btn-help-contact-support {
          width: 100%;
          padding: 12px 18px;
          background: #0D7A75;
          color: #ffffff;
          font-weight: 600;
          font-size: 0.875rem;
          border-radius: 999px;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(13, 122, 117, 0.18);
          transition: background 0.15s;
        }

        .btn-help-contact-support:hover {
          background: #095F5B;
        }

        .btn-help-view-invoice {
          width: 100%;
          padding: 11px 18px;
          background: #ffffff;
          color: #0D7A75;
          border: 1.5px solid #0D7A75;
          font-weight: 600;
          font-size: 0.875rem;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .btn-help-view-invoice:hover {
          background: #F4FBFA;
        }

        .help-secure-note {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 0.75rem;
          color: #64748B;
          text-align: center;
        }

        @media (max-width: 960px) {
          .tracking-summary-card {
            flex-direction: column;
            align-items: flex-start;
          }
          .summary-metric-divider {
            display: none;
          }
          .horizontal-stepper {
            flex-direction: column;
            align-items: flex-start;
            gap: 20px;
          }
          .stepper-connecting-line {
            width: 3px;
            height: 24px;
            margin: 0 0 0 24px;
          }
        }
      `}</style>
    </div>
  );
};

export default TrackOrder;
