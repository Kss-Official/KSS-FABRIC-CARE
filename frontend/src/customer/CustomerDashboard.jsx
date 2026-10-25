import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBooking } from '../context/BookingContext';
import { ordersApi, notificationsApi, normalizeOrder } from '../api/apiClient';
import { subscribeCustomerOrders } from '../services/customerDataService';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  Truck, 
  Calendar, 
  PlusCircle, 
  ArrowRight, 
  Sparkles, 
  FileText, 
  AlertCircle,
  MapPin,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Search,
  X
} from 'lucide-react';
import { OrderStatusDropdown } from '../components/common/OrderStatusDropdown';
import { formatOrderId, calculateOrderTotal, isOrderMatchingStatus } from '../utils/helpers';

export const CustomerDashboard = () => {
  const { currentUser } = useAuth();
  const { navigateTo, startBooking, setActiveTrackingOrderId } = useBooking();

  const myUid = currentUser?.uid || currentUser?.id;
  const myEmail = (currentUser?.email || '').toLowerCase().trim();

  const normalizeCustomerDashboardOrder = useCallback((raw) => {
    if (!raw) return null;
    const base = typeof normalizeOrder === 'function' ? normalizeOrder(raw) : { ...raw };

    // Format pickup date
    let pickupDate = base.pickup_date || '';
    if (!pickupDate && raw.pickup && typeof raw.pickup === 'object' && raw.pickup.date) {
      pickupDate = raw.pickup.date;
    }
    if (!pickupDate && (raw.placedAt || raw.createdAt)) {
      try {
        const dt = new Date(raw.placedAt || raw.createdAt);
        if (!isNaN(dt.getTime())) pickupDate = dt.toISOString().split('T')[0];
      } catch (_) {}
    }

    // Format pickup time slot
    let pickupSlot = base.pickup_time_slot || '';
    if (!pickupSlot && raw.pickup && typeof raw.pickup === 'object') {
      if (raw.pickup.time_slot || raw.pickup.timeSlot) {
        pickupSlot = raw.pickup.time_slot || raw.pickup.timeSlot;
      } else if (raw.pickup.from && raw.pickup.to) {
        pickupSlot = `${raw.pickup.from} - ${raw.pickup.to}`;
      }
    }
    if (!pickupSlot) pickupSlot = '09:00 AM - 11:00 AM';

    // Compute total amount accurately
    let totalAmt = calculateOrderTotal(raw, false);
    if (!totalAmt || totalAmt === '0' || totalAmt === '0.00') {
      if (base.total_amount && base.total_amount !== '0' && base.total_amount !== '0.00') {
        totalAmt = base.total_amount;
      } else if (raw.total && Number(raw.total) > 0) {
        let t = Number(raw.total);
        if (t >= 1000 || (t >= 500 && t % 100 === 0)) t = t / 100;
        totalAmt = t % 1 === 0 ? t.toFixed(0) : t.toFixed(2);
      } else if (raw.subtotal && Number(raw.subtotal) > 0) {
        let s = Number(raw.subtotal);
        if (s >= 1000 || (s >= 500 && s % 100 === 0)) s = s / 100;
        totalAmt = s % 1 === 0 ? s.toFixed(0) : s.toFixed(2);
      } else if (raw.estimatedTotal || raw.estimated_amount) {
        totalAmt = String(raw.estimatedTotal || raw.estimated_amount);
      } else {
        totalAmt = '0.00';
      }
    }

    // Separate and accurately determine payment status
    const rawPayment = String(raw.paymentStatus || raw.payment_status || raw.payment || base.payment_status || '').toUpperCase();
    const rawStatus = String(raw.status || base.status || '').toUpperCase();
    const isPaid = rawPayment.includes('PAID') || 
                   rawPayment.includes('COMPLETED') || 
                   rawPayment.includes('SUCCESS') || 
                   Boolean(raw.is_paid) || 
                   Boolean(base.is_paid) ||
                   ['PLACED', 'PICKED_UP', 'IN_CLEANING', 'DELIVERED', 'COMPLETED', 'READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 'ACCEPTED', 'PICKUP_ASSIGNED', 'PICKUP_SCHEDULED', 'PICKUP_IN_PROGRESS', 'RECEIVED_AT_LAUNDRY', 'IN_PROCESS', 'QUALITY_CHECK', 'PACKED', 'PENDING PICKUP', 'IN CLEANING', 'READY FOR DELIVERY', 'IN TRANSIT'].includes(rawStatus);

    const isRefunded = rawPayment.includes('REFUND') || rawStatus === 'REFUNDED';
    const isCancelled = (rawStatus === 'CANCELLED' || rawPayment.includes('CANCEL')) && !isPaid;

    let paymentStatusDisplay = 'PAID';
    if (isRefunded) {
      paymentStatusDisplay = 'REFUNDED';
    } else if (isCancelled) {
      paymentStatusDisplay = 'CANCELLED';
    } else if (!isPaid && (rawStatus === 'PAYMENT_PENDING' || rawPayment.includes('PENDING') || rawPayment.includes('UNPAID'))) {
      paymentStatusDisplay = 'PENDING';
    }

    return {
      ...base,
      id: raw.code || raw.order_number || base.order_number || base.id || raw.id,
      code: raw.code || raw.order_number || base.order_number || base.id || raw.id,
      order_number: raw.code || raw.order_number || base.order_number || base.id || raw.id,
      pickup_date: pickupDate,
      pickup_time_slot: pickupSlot,
      total_amount: totalAmt,
      isPaid: paymentStatusDisplay === 'PAID',
      payment_status: paymentStatusDisplay
    };
  }, []);

  const normalizeAndDedupeOrders = useCallback((list) => {
    if (!Array.isArray(list)) return [];
    const seen = new Set();
    const result = [];
    list.forEach(item => {
      const norm = normalizeCustomerDashboardOrder(item);
      if (!norm) return;
      const key = String(norm.order_number || norm.code || norm.id || '').trim().toLowerCase();
      if (!key || seen.has(key)) return;
      seen.add(key);
      result.push(norm);
    });
    result.sort((a, b) => {
      const timeA = new Date(a.createdAt || a.created_at || a.placedAt || 0).getTime() || 0;
      const timeB = new Date(b.createdAt || b.created_at || b.placedAt || 0).getTime() || 0;
      return timeB - timeA;
    });
    return result;
  }, [normalizeCustomerDashboardOrder]);

  const [orders, setOrders] = useState(() => {
    try {
      if (myUid) {
        const cached = sessionStorage.getItem(`fabricare_customer_orders_${myUid}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch (_) {}
    return [];
  });
  const [loading, setLoading] = useState(() => {
    try {
      if (myUid) {
        const cached = sessionStorage.getItem(`fabricare_customer_orders_${myUid}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) return false;
        }
      }
    } catch (_) {}
    return true;
  });
  const [refreshing, setRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrders = useCallback(async (isManual = false) => {
    const uid = currentUser?.uid || currentUser?.id;
    const email = (currentUser?.email || '').toLowerCase().trim();
    if (!uid && !email) {
      setOrders([]);
      setLoading(false);
      return;
    }
    if (!isManual) setLoading(true);
    try {
      const res = await ordersApi.getOrders();
      const list = Array.isArray(res.data) ? res.data : (res.data?.items || res.data?.results || []);
      const myOrders = list.filter(o => {
        if (!o) return false;
        const oUid = String(o.customerId || o.customer_id || o.userId || '').toLowerCase().trim();
        if (uid && oUid && oUid === String(uid).toLowerCase().trim()) return true;
        const oEmail = String(o.customerEmail || o.customer_email || o.customer?.email || '').toLowerCase().trim();
        if (email && oEmail && oEmail === email) return true;
        return false;
      });
      const normalized = normalizeAndDedupeOrders(myOrders);
      setOrders(normalized);
      if (uid) {
        try {
          sessionStorage.setItem(`fabricare_customer_orders_${uid}`, JSON.stringify(normalized));
        } catch (_) {}
      }
    } catch (err) {
      console.warn('Customer dashboard fetch orders notice:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid, currentUser?.email, normalizeAndDedupeOrders]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshSuccess(false);
    const start = Date.now();
    try {
      await fetchOrders(true);
      const elapsed = Date.now() - start;
      if (elapsed < 450) {
        await new Promise(r => setTimeout(r, 450 - elapsed));
      }
      setRefreshSuccess(true);
      setTimeout(() => setRefreshSuccess(false), 2000);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let isSubscribed = true;
    const uid = currentUser?.uid || currentUser?.id;
    const email = currentUser?.email;

    if (!uid && !email) {
      setOrders([]);
      setLoading(false);
      return;
    }

    // Reset orders immediately when customer ID changes to avoid leaking previous customer's data
    try {
      const cached = uid ? sessionStorage.getItem(`fabricare_customer_orders_${uid}`) : null;
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          setOrders(parsed);
          setLoading(false);
        } else {
          setOrders([]);
          setLoading(true);
        }
      } else {
        setOrders([]);
        setLoading(true);
      }
    } catch (_) {
      setOrders([]);
      setLoading(true);
    }

    const unsubscribe = subscribeCustomerOrders(
      uid,
      (liveOrders) => {
        if (!isSubscribed) return;
        if (Array.isArray(liveOrders)) {
          const normalized = normalizeAndDedupeOrders(liveOrders);
          setOrders(normalized);
          if (uid) {
            try {
              sessionStorage.setItem(`fabricare_customer_orders_${uid}`, JSON.stringify(normalized));
            } catch (_) {}
          }
        } else {
          setOrders([]);
        }
        setLoading(false);
      },
      (err) => {
        console.warn('Customer orders subscription notice:', err);
        fetchOrders();
      },
      email
    );

    fetchOrders();

    return () => {
      isSubscribed = false;
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [currentUser?.uid, currentUser?.email, fetchOrders, normalizeAndDedupeOrders]);

  const filteredOrders = orders.filter(order => {
    const term = (searchQuery || '').trim().toLowerCase();
    const orderNo = (order.order_number || order.code || '').toLowerCase();
    const formattedNo = formatOrderId(order.order_number || order.code || order.id).toLowerCase();
    const addr = (order.pickup_address || '').toLowerCase();
    const matchesSearch = !term || orderNo.includes(term) || formattedNo.includes(term) || addr.includes(term);

    if (!matchesSearch) return false;
    return isOrderMatchingStatus(order, activeTab);
  });

  const getStatusBadge = (status) => {
    const s = String(status || '').toUpperCase().trim();
    switch (s) {
      case 'PENDING':
      case 'PAYMENT_PENDING':
        return <span className="badge badge-warning">Pending Approval</span>;
      case 'PLACED':
        return <span className="badge badge-info">Booking Confirmed</span>;
      case 'ACCEPTED':
      case 'PICKUP_ASSIGNED':
      case 'PICKUP_SCHEDULED':
      case 'PICKUP_IN_PROGRESS':
        return <span className="badge badge-info">Pickup Scheduled</span>;
      case 'PICKED_UP':
      case 'RECEIVED_AT_LAUNDRY':
        return <span className="badge badge-info">Received at Hub</span>;
      case 'IN_PROCESS':
      case 'WASHING':
      case 'DRYING':
      case 'IRONING':
        return <span className="badge badge-primary">Processing ({status})</span>;
      case 'QUALITY_CHECK':
        return <span className="badge badge-primary">Quality Check</span>;
      case 'PACKED':
      case 'READY_FOR_DELIVERY':
        return <span className="badge badge-success">Ready for Delivery</span>;
      case 'OUT_FOR_DELIVERY':
        return <span className="badge badge-warning">Out for Delivery</span>;
      case 'DELIVERED':
        return <span className="badge badge-success">Delivered</span>;
      case 'CANCELLED':
        return <span className="badge badge-danger">Cancelled</span>;
      default:
        return <span className="badge badge-secondary">{status}</span>;
    }
  };

  const getOrderServices = (order) => {
    if (!order) return 'Wash & Fold';

    // 1. Direct services array on order
    if (Array.isArray(order.services) && order.services.length > 0) {
      const clean = order.services.filter(Boolean);
      if (clean.length > 0) return clean.join(', ');
    }
    if (Array.isArray(order.services_list) && order.services_list.length > 0) {
      const clean = order.services_list.filter(Boolean);
      if (clean.length > 0) return clean.join(', ');
    }

    // 2. Direct service string on order
    if (typeof order.service === 'string' && order.service.trim()) {
      return order.service.trim();
    }

    // 3. Extract service categories from items
    const rawItems = Array.isArray(order.items)
      ? order.items
      : (order.items && typeof order.items === 'object' ? Object.values(order.items) : []);

    if (rawItems.length > 0) {
      const extractedServices = new Set();
      rawItems.forEach(item => {
        if (!item) return;
        if (item.service_category && item.service_category !== 'General') {
          extractedServices.add(item.service_category);
        } else if (item.categoryName && item.categoryName !== 'General') {
          extractedServices.add(item.categoryName);
        } else if (Array.isArray(item.services) && item.services.length > 0) {
          item.services.forEach(s => s && extractedServices.add(s));
        } else if (item.category && !['Men', 'Women', 'Household', 'Kids', 'General', 'Clothing'].includes(item.category)) {
          extractedServices.add(item.category);
        } else {
          // Check for service inside parenthesized name, e.g., "Shirt (Wash & Iron)"
          const match = String(item.name || item.item_name || '').match(/\(([^)]+)\)/);
          if (match && match[1] && !/^\d+$/.test(match[1])) {
            extractedServices.add(match[1].trim());
          }
        }
      });

      if (extractedServices.size > 0) {
        return Array.from(extractedServices).join(', ');
      }
    }

    if (order.isExpress) {
      return 'Express Laundry';
    }

    return 'Wash & Fold';
  };

  return (
    <div className="portal-container">
      {/* Header Banner */}
      <div className="dashboard-welcome-card">
        <div className="welcome-text">
          <div className="badge-pill mb-2">Customer Hub</div>
          <h1 className="text-2xl font-bold text-navy">Welcome back, {currentUser?.full_name || currentUser?.name || currentUser?.displayName || currentUser?.fullName || currentUser?.first_name || 'Valued Customer'}!</h1>
          <p className="text-muted text-sm mt-1">
            Track your laundry progress, manage orders, and schedule fresh pickups effortlessly.
          </p>
        </div>
        <div className="welcome-actions">
          <button 
            onClick={() => startBooking()} 
            className="btn btn-primary shadow-glow flex items-center gap-2"
          >
            <PlusCircle size={18} />
            <span>Book New Pickup</span>
          </button>
        </div>
      </div>

      {/* Active Orders Section */}
      <div className="content-card mt-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 mb-4 gap-4">
          <div>
            <h2 className="text-lg font-bold text-navy">Recent Orders</h2>
            <p className="text-xs text-muted">Real-time status updates directly from our laundry hub</p>
          </div>
          
          {/* Right Controls: Order count pill next to search bar & filters */}
          <div className="toolbar-controls-group">
            {/* Order Count Option */}
            <span className="orders-count-pill">
              {filteredOrders.length} {filteredOrders.length === 1 ? 'Order' : 'Orders'}
            </span>
            {/* Search Input Box */}
            <div className="search-input-wrapper">
              <Search size={16} className="search-magnifier-icon" />
              <input 
                type="text" 
                placeholder="Search by Order ID, customer, or s..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-box-field"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="search-clear-btn"
                  title="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Filters Dropdown */}
            <OrderStatusDropdown 
              value={activeTab} 
              onChange={(newTab) => setActiveTab(newTab)}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <RefreshCw size={32} className="animate-spin text-primary mx-auto mb-3" />
            <p className="text-sm text-muted">Loading live orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Package size={48} className="text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-navy">No orders found</h3>
            <p className="text-sm text-muted max-w-sm mx-auto mt-1 mb-4">
              {activeTab !== 'ALL'
                ? `No ${activeTab.toLowerCase()} orders found.`
                : "You haven't scheduled any pickups yet. Schedule your first laundry pickup in under 60 seconds!"}
            </p>
            <button onClick={() => startBooking()} className="btn btn-primary btn-sm">
              Book a Pickup Now
            </button>
          </div>
        ) : (
          <div className="orders-table-wrapper">
            <table className="portal-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Pickup Slot</th>
                  <th>Services</th>
                  <th>Total Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <tr key={order.order_number || order.code || order.id}>
                    <td>
                      <span className="font-mono font-bold text-primary">{formatOrderId(order.order_number || order.code || order.id)}</span>
                      <span className="text-xs text-muted block">{order.created_at || order.createdAt ? new Date(order.created_at || order.createdAt).toLocaleDateString() : ''}</span>
                    </td>
                    <td>
                      <div className="text-sm font-medium text-navy">{order.pickup_date}</div>
                      <div className="text-xs text-muted">{order.pickup_time_slot}</div>
                    </td>
                    <td>
                      <div className="text-sm font-medium text-navy">
                        {getOrderServices(order)}
                      </div>
                    </td>
                    <td>
                      <span className="font-bold text-navy">₹{order.total_amount || order.estimated_amount || '0.00'}</span>
                      <span className={`text-xs block ${
                        order.isPaid || order.payment_status === 'PAID'
                          ? 'text-emerald-600 font-semibold'
                          : order.payment_status === 'REFUNDED'
                          ? 'text-purple-600 font-semibold'
                          : order.payment_status === 'CANCELLED'
                          ? 'text-rose-600 font-medium'
                          : 'text-amber-600 font-medium'
                      }`}>
                        {order.payment_status || (order.isPaid ? 'PAID' : 'PENDING')}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => {
                          const targetTrackId = String(order.order_number || order.code || order.docId || order.id || '').trim();
                          if (targetTrackId) {
                            if (typeof setActiveTrackingOrderId === 'function') {
                              setActiveTrackingOrderId(targetTrackId);
                            }
                            try {
                              sessionStorage.setItem('fabricare_active_tracking_id', targetTrackId);
                            } catch (_) {}
                          }
                          navigateTo('customer-track', targetTrackId || order.id?.toString());
                        }}
                        className="btn-view-order-action"
                        title={`Track order ${formatOrderId(order.order_number || order.code || order.id)}`}
                      >
                        <span>Track</span>
                        <ChevronRight size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;
