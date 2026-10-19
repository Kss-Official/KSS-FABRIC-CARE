import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useBooking } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import { subscribeCustomerOrders, cancelCustomerOrder } from '../services/customerDataService';
import { ordersApi } from '../api/apiClient';
import { 
  Package, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ChevronRight, 
  AlertCircle,
  RefreshCw,
  PlusCircle,
  X
} from 'lucide-react';
import { OrderStatusDropdown } from '../components/common/OrderStatusDropdown';
import { formatOrderId } from '../utils/helpers';

export const MyOrders = () => {
  const { navigateTo, startBooking, setActiveTrackingOrderId } = useBooking();
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelModalOrder, setCancelModalOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const cancelModalRef = useRef(null);

  const normalizeOrders = useCallback((rawOrders) => {
    return (rawOrders || []).map(o => {
      const totalInr = o.total ? (o.total / 100).toFixed(2) : (o.estimatedTotal || o.total_amount || '0.00');

      // Normalize items list
      let itemsList = [];
      if (Array.isArray(o.items)) {
        itemsList = o.items;
      } else if (o.items && typeof o.items === 'object') {
        itemsList = Object.entries(o.items).map(([name, qty]) => {
          if (typeof qty === 'object' && qty !== null) {
            return { item_name: qty.name || qty.item_name || name, quantity: qty.quantity || qty.count || 1 };
          }
          return { item_name: name, quantity: qty };
        });
      }

      // Address
      let addrStr = o.pickup_address || '';
      if (!addrStr && o.address) {
        if (typeof o.address === 'string') {
          addrStr = o.address;
        } else {
          const parts = [o.address.flatHouse, o.address.areaColony, o.address.city, o.address.pincode].filter(Boolean);
          addrStr = parts.join(', ');
        }
      }
      if (!addrStr) addrStr = 'Bengaluru';

      const formatPrettyDate = (dVal) => {
        if (!dVal) return '';
        try {
          const d = new Date(dVal);
          if (isNaN(d.getTime())) return String(dVal);
          return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch {
          return String(dVal);
        }
      };

      // Pickup schedule
      let rawPickupDate = o.pickup_date || '';
      let pickupSlot = o.pickup_time_slot || '';
      if (o.pickup && typeof o.pickup === 'object') {
        rawPickupDate = o.pickup.date || rawPickupDate;
        if (o.pickup.from && o.pickup.to) {
          pickupSlot = `${o.pickup.from} - ${o.pickup.to}`;
        }
      }

      let deliveryDate = null;
      if (o.delivery_date) {
        deliveryDate = formatPrettyDate(o.delivery_date);
      } else if (o.delivery && typeof o.delivery === 'object' && o.delivery.date) {
        deliveryDate = formatPrettyDate(o.delivery.date);
      }

      return {
        ...o,
        id: o.id || o.code,
        rawId: o.id,
        order_number: o.order_number || o.code || o.id,
        code: o.code || o.order_number || o.id,
        created_at: o.createdAt || o.created_at,
        total_amount: totalInr,
        pickup_address: addrStr,
        pickup_date: formatPrettyDate(rawPickupDate) || 'Scheduled',
        pickup_time_slot: pickupSlot || 'Standard Slot',
        delivery_date: deliveryDate,
        delivery_time_slot: o.delivery_time_slot || '',
        items: itemsList,
        payment_status: o.paymentStatus || o.payment_status || (o.status === 'PAYMENT_PENDING' ? 'Pending' : 'Paid')
      };
    });
  }, []);

  const fetchOrdersFromApi = useCallback(async () => {
    try {
      const res = await ordersApi.getOrders();
      const list = Array.isArray(res.data) ? res.data : (res.data?.items || res.data?.results || []);
      if (list.length > 0) {
        const mapped = normalizeOrders(list);
        setOrders(prev => {
          const ids = new Set(prev.map(p => p.id));
          return [...prev, ...mapped.filter(item => !ids.has(item.id))];
        });
      }
    } catch (err) {
      console.warn('Orders API fetch notice:', err);
    }
  }, [normalizeOrders]);

  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      fetchOrdersFromApi().finally(() => setLoading(false));
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeCustomerOrders(
      currentUser.uid,
      (liveOrders) => {
        if (liveOrders && liveOrders.length > 0) {
          setOrders(normalizeOrders(liveOrders));
        } else {
          fetchOrdersFromApi();
        }
        setLoading(false);
      },
      (err) => {
        console.warn('Orders subscription note:', err);
        fetchOrdersFromApi().finally(() => setLoading(false));
      }
    );

    return () => unsubscribe();
  }, [currentUser, normalizeOrders, fetchOrdersFromApi]);

  useEffect(() => {
    if (!cancelModalOrder) return;

    const handleClickOutside = (e) => {
      if (cancelModalRef.current && !cancelModalRef.current.contains(e.target)) {
        setCancelModalOrder(null);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setCancelModalOrder(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [cancelModalOrder]);

  const handleCancelOrder = async () => {
    if (!cancelModalOrder) return;
    const targetId = cancelModalOrder.rawId || cancelModalOrder.id || cancelModalOrder.code || cancelModalOrder.order_number;
    setCancellingId(targetId);
    try {
      await cancelCustomerOrder(targetId, cancelReason || 'Customer requested cancellation', currentUser);
      try {
        await ordersApi.cancelOrder(targetId, cancelReason || 'Customer requested cancellation');
      } catch (_) {}
      setCancelModalOrder(null);
      setCancelReason('');
    } catch (err) {
      alert(err.message || 'Failed to cancel order');
    } finally {
      setCancellingId(null);
    }
  };

  const filteredOrders = orders.filter(order => {
    const term = (searchQuery || '').trim().toLowerCase();
    const orderNo = (order.order_number || order.code || '').toLowerCase();
    const formattedNo = formatOrderId(order.order_number || order.code || order.id).toLowerCase();
    const addr = (order.pickup_address || '').toLowerCase();
    const matchesSearch = !term || orderNo.includes(term) || formattedNo.includes(term) || addr.includes(term);
    
    if (statusFilter === 'ALL') return matchesSearch;
    if (statusFilter === 'PENDING') return matchesSearch && ['PENDING', 'PENDING_REVIEW', 'ACCEPTED', 'PICKUP_ASSIGNED', 'PICKUP_SCHEDULED', 'PICKUP_IN_PROGRESS', 'PLACED', 'PAYMENT_PENDING'].includes(order.status);
    if (statusFilter === 'PROCESSING') return matchesSearch && ['PICKED_UP', 'DROPPED_OFF_AT_LAUNDRY', 'RECEIVED_BY_LAUNDRY', 'RECEIVED_AT_LAUNDRY', 'RECEIVED', 'IN_PROCESS', 'INSPECTION', 'WASHING', 'DRYING', 'IRONING', 'FOLDING', 'QUALITY_CHECK', 'PACKING', 'PACKED', 'IN_CLEANING'].includes(order.status);
    if (statusFilter === 'DELIVERY') return matchesSearch && ['READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 'DELIVERY_ASSIGNED'].includes(order.status);
    if (statusFilter === 'COMPLETED') return matchesSearch && ['DELIVERED', 'COMPLETED'].includes(order.status);
    if (statusFilter === 'CANCELLED') return matchesSearch && order.status === 'CANCELLED';
    return matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
      case 'PENDING_REVIEW':
      case 'PAYMENT_PENDING':
        return <span className="badge badge-warning">Payment Pending</span>;
      case 'PLACED':
        return <span className="badge badge-info">Booking Confirmed</span>;
      case 'ACCEPTED':
      case 'PICKUP_ASSIGNED':
      case 'PICKUP_SCHEDULED':
      case 'PICKUP_IN_PROGRESS':
        return <span className="badge badge-info">Pickup Scheduled</span>;
      case 'PICKED_UP':
        return <span className="badge badge-info">Clothes Collected</span>;
      case 'DROPPED_OFF_AT_LAUNDRY':
      case 'RECEIVED_BY_LAUNDRY':
      case 'RECEIVED_AT_LAUNDRY':
      case 'RECEIVED':
        return <span className="badge badge-primary">Received at Hub</span>;
      case 'INSPECTION':
        return <span className="badge badge-primary">Clothes Inspection</span>;
      case 'IN_PROCESS':
      case 'IN_CLEANING':
      case 'WASHING':
      case 'DRYING':
      case 'IRONING':
        return <span className="badge badge-primary">In Cleaning</span>;
      case 'QUALITY_CHECK':
        return <span className="badge badge-primary">Quality Check</span>;
      case 'PACKING':
      case 'PACKED':
      case 'READY_FOR_DELIVERY':
        return <span className="badge badge-success">Packed / Ready</span>;
      case 'OUT_FOR_DELIVERY':
      case 'DELIVERY_ASSIGNED':
        return <span className="badge badge-warning">Out for Delivery</span>;
      case 'DELIVERED':
      case 'COMPLETED':
        return <span className="badge badge-success">Delivered</span>;
      case 'CANCELLED':
        return <span className="badge badge-danger">Cancelled</span>;
      default:
        return <span className="badge badge-secondary">{status}</span>;
    }
  };

  return (
    <div className="portal-container" style={{ minHeight: '65vh' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Order History & Management</div>
          <h1 className="text-2xl font-bold text-navy">My Laundry Orders</h1>
          <p className="text-sm text-muted">View live order status, receipts, and track progress</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => startBooking()} 
            className="btn btn-primary btn-sm flex items-center gap-2 shadow-sm"
          >
            <PlusCircle size={16} />
            <span>Schedule New Pickup</span>
          </button>
        </div>
      </div>

      {/* Filters Bar: Search and Filters matching Reference Image 1 */}
      <div className="content-card mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
          <div>
            <span className="text-sm font-semibold text-navy">All Orders</span>
            <span className="text-xs text-muted ml-2 hidden sm:inline">Real-time status updates</span>
          </div>

          <div className="toolbar-controls-group">
            {/* Order Count Option next to search bar */}
            <span className="orders-count-pill">
              {filteredOrders.length} {filteredOrders.length === 1 ? 'Order' : 'Orders'}
            </span>

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

            <OrderStatusDropdown 
              value={statusFilter} 
              onChange={(newStatus) => setStatusFilter(newStatus)}
            />
          </div>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
          <RefreshCw size={36} className="animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm font-medium text-navy">Fetching your order history...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300 shadow-sm">
          <Package size={48} className="text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-navy">No orders found</h3>
          <p className="text-sm text-muted max-w-sm mx-auto mt-1 mb-5">
            {searchQuery || statusFilter !== 'ALL' 
              ? 'Try adjusting your search query or status filter.' 
              : 'You have no laundry orders yet. Book your first pickup with FabriCare today!'}
          </p>
          <button onClick={() => startBooking()} className="btn btn-primary btn-sm">
            Book a Pickup Now
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map(order => (
            <div key={order.id} className="order-item-card">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="order-icon-badge">
                    <Package size={20} className="text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-lg text-navy">{formatOrderId(order.order_number || order.code || order.id)}</span>
                      {getStatusBadge(order.status)}
                    </div>
                    <span className="text-xs text-muted">
                      Placed on {order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Today'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {['PENDING', 'PAYMENT_PENDING', 'PLACED', 'PICKUP_SCHEDULED'].includes(order.status) && (
                    <button
                      onClick={() => setCancelModalOrder(order)}
                      disabled={cancellingId === order.id}
                      className="btn-cancel-order-action"
                    >
                      Cancel Order
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (setActiveTrackingOrderId) {
                        setActiveTrackingOrderId(order.id || order.code);
                      }
                      navigateTo('customer-track', (order.id || order.code).toString());
                    }}
                    className="btn-view-order-action"
                  >
                    <span>Track Live</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-sm">
                <div>
                  <span className="text-xs text-muted block mb-1">
                    {order.delivery_date ? 'Schedule Details' : 'Pickup Schedule'}
                  </span>
                  <div className="font-semibold text-navy">Pickup: {order.pickup_date}</div>
                  <div className="text-xs text-slate-500">{order.pickup_time_slot}</div>
                  {order.delivery_date && (
                    <div className="mt-1.5 pt-1.5 border-t border-slate-100">
                      <span className="text-[11px] font-semibold text-[#087F8C] block">
                        Delivery Schedule:
                      </span>
                      <div className="font-semibold text-navy text-xs">
                        {order.delivery_date} {order.delivery_time_slot ? `· ${order.delivery_time_slot}` : ''}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-xs text-muted block mb-1">Items & Services</span>
                  <div className="font-medium text-navy">
                    {Array.isArray(order.items) && order.items.length > 0
                      ? order.items.map(i => `${i.item_name || i.name || i.service_name || 'Item'} ×${i.quantity || 1}`).join(', ')
                      : 'General Laundry Service'}
                  </div>
                </div>

                <div>
                  <span className="text-xs text-muted block mb-1">Total Bill & Payment</span>
                  <div className="text-base font-bold text-navy">₹{order.total_amount || '0.00'}</div>
                  <span className={`text-xs font-semibold ${order.payment_status === 'Paid' || order.payment_status === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    Payment: {order.payment_status || 'Pending'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancel Order Modal */}
      {cancelModalOrder && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setCancelModalOrder(null)}
        >
          <div 
            ref={cancelModalRef}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <AlertCircle size={24} />
              <h3 className="text-lg font-bold">Cancel Order {formatOrderId(cancelModalOrder.order_number || cancelModalOrder.code || cancelModalOrder.id)}?</h3>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Are you sure you want to cancel this booking? This action cannot be undone once confirmed.
            </p>
            <div className="mb-4">
              <label className="form-label">Cancellation Reason (Optional)</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="E.g., Rescheduling for next week, changed plans..."
                className="form-textarea"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setCancelModalOrder(null)}
                className="btn btn-outline-secondary btn-sm"
                disabled={cancellingId !== null}
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                className="btn btn-danger btn-sm flex items-center gap-2"
                disabled={cancellingId !== null}
              >
                {cancellingId ? <RefreshCw size={14} className="animate-spin" /> : null}
                <span>Confirm Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrders;
