import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useBooking } from '../context/BookingContext';
import { useAuth } from '../context/AuthContext';
import { subscribeCustomerOrders, cancelCustomerOrder } from '../services/customerDataService';
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
  Loader2
} from 'lucide-react';

export const MyOrders = () => {
  const { navigateTo, startBooking, setActiveTrackingOrderId } = useBooking();
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelModalOrder, setCancelModalOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const cancelModalRef = useRef(null);

  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeCustomerOrders(
      currentUser.uid,
      (liveOrders) => {
        // Map to UI friendly shape
        const mapped = (liveOrders || []).map(o => {
          const totalInr = o.total ? (o.total / 100).toFixed(2) : (o.estimatedTotal || '0.00');
          return {
            ...o,
            id: o.id || o.code,
            order_number: o.code || o.id,
            order_id: o.code || o.id,
            total_amount: totalInr,
            pickup_address: o.address ? `${o.address.flatHouse || ''}, ${o.address.areaColony || ''}, ${o.address.city || ''}` : 'Bengaluru',
            date: o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'
          };
        });
        setOrders(mapped);
        setLoading(false);
      },
      (err) => {
        console.warn('Orders listener error:', err);
        setError('Failed to fetch orders. Please check your network connection.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

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
    const targetId = cancelModalOrder.rawId || cancelModalOrder.id || cancelModalOrder.order_id;
    setCancellingId(targetId);
    try {
      await cancelCustomerOrder(targetId, cancelReason || 'Customer requested cancellation', currentUser);
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
    const addr = (order.pickup_address || '').toLowerCase();
    const matchesSearch = !term || orderNo.includes(term) || addr.includes(term);
    
    if (statusFilter === 'ALL') return matchesSearch;
    if (statusFilter === 'PENDING') return matchesSearch && ['PAYMENT_PENDING', 'PLACED', 'PICKUP_SCHEDULED'].includes(order.status);
    if (statusFilter === 'PROCESSING') return matchesSearch && ['PICKED_UP', 'RECEIVED', 'IN_CLEANING'].includes(order.status);
    if (statusFilter === 'DELIVERY') return matchesSearch && ['READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY'].includes(order.status);
    if (statusFilter === 'COMPLETED') return matchesSearch && ['DELIVERED', 'COMPLETED'].includes(order.status);
    if (statusFilter === 'CANCELLED') return matchesSearch && order.status === 'CANCELLED';
    return matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAYMENT_PENDING':
        return <span className="badge badge-warning">Payment Pending</span>;
      case 'PLACED':
        return <span className="badge badge-info">Booking Confirmed</span>;
      case 'PICKUP_SCHEDULED':
        return <span className="badge badge-info">Pickup Scheduled</span>;
      case 'PICKED_UP':
        return <span className="badge badge-info">Clothes Collected</span>;
      case 'RECEIVED':
        return <span className="badge badge-primary">Received at Hub</span>;
      case 'IN_CLEANING':
        return <span className="badge badge-primary">In Cleaning</span>;
      case 'READY_FOR_DELIVERY':
        return <span className="badge badge-success">Packed / Ready</span>;
      case 'OUT_FOR_DELIVERY':
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
              className="form-control pl-9 text-sm"
              placeholder="Search by order ID or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Tabs */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {['ALL', 'PENDING', 'PROCESSING', 'DELIVERY', 'COMPLETED', 'CANCELLED'].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === tab 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab === 'ALL' ? 'All Orders' : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="content-card p-12 text-center">
          <Loader2 className="animate-spin mx-auto text-primary mb-3" size={32} />
          <p className="text-sm text-slate-500 font-medium">Loading your orders in real-time...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="content-card p-8 text-center bg-red-50 border border-red-200">
          <AlertCircle className="mx-auto text-red-500 mb-2" size={32} />
          <p className="text-sm text-red-700 font-medium">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn btn-outline-danger btn-sm mt-3"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredOrders.length === 0 && (
        <div className="content-card p-12 text-center">
          <Package className="mx-auto text-slate-300 mb-3" size={48} />
          <h3 className="text-lg font-bold text-slate-700">No Orders Found</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {searchQuery || statusFilter !== 'ALL' 
              ? 'No orders matched your search or status filter criteria.' 
              : 'You have not placed any laundry bookings yet.'}
          </p>
          <button onClick={() => startBooking()} className="btn btn-primary btn-sm">
            Book Laundry Service
          </button>
        </div>
      )}

      {/* Orders List */}
      {!loading && !error && filteredOrders.length > 0 && (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="content-card hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-3 bg-teal-50 rounded-xl text-teal-600 mt-1">
                    <Package size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-navy text-base">{order.order_number || order.code}</span>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-xs text-muted mt-1">Booked on {order.date}</p>
                    <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">{order.pickup_address}</p>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0">
                  <div className="text-left md:text-right">
                    <span className="text-xs text-muted">Total Amount</span>
                    <div className="text-lg font-bold text-teal-700">₹{order.total_amount}</div>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    {['PAYMENT_PENDING', 'PLACED', 'PICKUP_SCHEDULED'].includes(order.status) && (
                      <button
                        onClick={() => setCancelModalOrder(order)}
                        disabled={cancellingId === order.id}
                        className="btn btn-outline-danger btn-xs"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setActiveTrackingOrderId(order.id || order.code);
                        navigateTo('track-order');
                      }}
                      className="btn btn-outline-primary btn-xs flex items-center gap-1"
                    >
                      <span>Track</span>
                      <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancel Order Modal */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div ref={cancelModalRef} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-navy mb-2">Cancel Laundry Order</h3>
            <p className="text-sm text-slate-600 mb-4">
              Are you sure you want to cancel order <strong>{cancelModalOrder.order_number || cancelModalOrder.code}</strong>?
            </p>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Reason for cancellation</label>
              <textarea 
                className="form-control text-sm w-full"
                rows="3"
                placeholder="Please tell us why you are cancelling..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setCancelModalOrder(null)} 
                className="btn btn-outline-secondary btn-sm"
              >
                Keep Order
              </button>
              <button 
                onClick={handleCancelOrder} 
                disabled={Boolean(cancellingId)}
                className="btn btn-danger btn-sm"
              >
                {cancellingId ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrders;
