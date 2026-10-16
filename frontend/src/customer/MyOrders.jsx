import React, { useState, useEffect, useRef } from 'react';
import { useBooking } from '../context/BookingContext';
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
  PlusCircle
} from 'lucide-react';

export const MyOrders = () => {
  const { navigateTo, startBooking } = useBooking();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelModalOrder, setCancelModalOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const cancelModalRef = useRef(null);

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

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await ordersApi.getOrders();
      const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setOrders(list);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = async () => {
    if (!cancelModalOrder) return;
    setCancellingId(cancelModalOrder.id);
    try {
      await ordersApi.cancelOrder(cancelModalOrder.id, cancelReason || 'Customer requested cancellation');
      setCancelModalOrder(null);
      setCancelReason('');
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Failed to cancel order');
    } finally {
      setCancellingId(null);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.pickup_address?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'ALL') return matchesSearch;
    if (statusFilter === 'PENDING') return matchesSearch && ['PENDING', 'PENDING_REVIEW', 'ACCEPTED', 'PICKUP_ASSIGNED', 'PICKUP_SCHEDULED', 'PICKUP_IN_PROGRESS'].includes(order.status);
    if (statusFilter === 'PROCESSING') return matchesSearch && ['PICKED_UP', 'DROPPED_OFF_AT_LAUNDRY', 'RECEIVED_BY_LAUNDRY', 'RECEIVED_AT_LAUNDRY', 'IN_PROCESS', 'INSPECTION', 'WASHING', 'DRYING', 'IRONING', 'QUALITY_CHECK', 'PACKING', 'PACKED'].includes(order.status);
    if (statusFilter === 'DELIVERY') return matchesSearch && ['READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 'DELIVERY_ASSIGNED'].includes(order.status);
    if (statusFilter === 'COMPLETED') return matchesSearch && ['DELIVERED', 'COMPLETED'].includes(order.status);
    if (statusFilter === 'CANCELLED') return matchesSearch && order.status === 'CANCELLED';
    return matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
      case 'PENDING_REVIEW':
        return <span className="badge badge-warning">Booking Received</span>;
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
        return <span className="badge badge-info">Received at Hub</span>;
      case 'INSPECTION':
        return <span className="badge badge-primary">Clothes Inspection</span>;
      case 'IN_PROCESS':
      case 'WASHING':
      case 'DRYING':
      case 'IRONING':
        return <span className="badge badge-primary">In Process ({status})</span>;
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
    <div className="portal-container">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Order History & Management</div>
          <h1 className="text-2xl font-bold text-navy">My Laundry Orders</h1>
          <p className="text-sm text-muted">View live order status, receipts, and track progress</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchOrders} 
            className="btn btn-outline-secondary btn-sm flex items-center gap-1"
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button 
            onClick={() => startBooking()} 
            className="btn btn-primary btn-sm flex items-center gap-2 shadow-sm"
          >
            <PlusCircle size={16} />
            <span>Schedule New Pickup</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="content-card mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-3 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by Order ID or Address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input pl-9 text-sm"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            {['ALL', 'PENDING', 'PROCESSING', 'DELIVERY', 'COMPLETED', 'CANCELLED'].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`filter-tab ${statusFilter === tab ? 'active' : ''}`}
              >
                {tab === 'ALL' ? 'All Orders' : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ))}
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
                      <span className="font-mono font-bold text-lg text-navy">{order.order_number}</span>
                      {getStatusBadge(order.status)}
                    </div>
                    <span className="text-xs text-muted">
                      Placed on {order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Today'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {order.status === 'PENDING' && (
                    <button
                      onClick={() => setCancelModalOrder(order)}
                      className="btn btn-outline-danger btn-sm"
                    >
                      Cancel Order
                    </button>
                  )}
                  <button
                    onClick={() => navigateTo('customer-track', order.id.toString())}
                    className="btn btn-primary btn-sm flex items-center gap-1.5"
                  >
                    <span>Track Live</span>
                    <ChevronRight size={15} />
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
                    {order.items && order.items.length > 0
                      ? order.items.map(i => `${i.item_name || i.service_name || 'Item'} ×${i.quantity}`).join(', ')
                      : 'General Laundry Service'}
                  </div>
                  <div className="text-xs text-slate-500 truncate max-w-xs">{order.pickup_address}</div>
                </div>

                <div>
                  <span className="text-xs text-muted block mb-1">Total Bill & Payment</span>
                  <div className="text-base font-bold text-navy">₹{order.total_amount || order.estimated_amount || '0.00'}</div>
                  <span className={`text-xs font-semibold ${order.payment_status === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>
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
              <h3 className="text-lg font-bold">Cancel Order {cancelModalOrder.order_number}?</h3>
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
