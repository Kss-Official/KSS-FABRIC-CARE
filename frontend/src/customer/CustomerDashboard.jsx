import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBooking } from '../context/BookingContext';
import { ordersApi, notificationsApi } from '../api/apiClient';
import { subscribeOrders } from '../services/firestoreService';
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
  RefreshCw
} from 'lucide-react';

export const CustomerDashboard = () => {
  const { currentUser } = useAuth();
  const { navigateTo, startBooking } = useBooking();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ordersApi.getOrders();
      const list = Array.isArray(res.data) ? res.data : (res.data?.items || res.data?.results || []);
      if (list.length > 0) {
        setOrders(prev => {
          const ids = new Set(prev.map(p => p.id));
          return [...prev, ...list.filter(item => !ids.has(item.id || item.order_number))];
        });
      }
    } catch (err) {
      console.warn('Customer dashboard fetch orders notice:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isSubscribed = true;
    const unsubscribe = subscribeOrders((fireOrders) => {
      if (!isSubscribed) return;
      if (fireOrders && fireOrders.length > 0) {
        setOrders(fireOrders);
      }
      setLoading(false);
    });

    fetchOrders();

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, [fetchOrders]);

  const pendingCount = orders.filter(o => ['PENDING', 'ACCEPTED', 'PICKUP_ASSIGNED', 'PICKUP_SCHEDULED', 'PLACED', 'PAYMENT_PENDING'].includes(o.status)).length;
  const inProcessCount = orders.filter(o => ['PICKED_UP', 'RECEIVED_AT_LAUNDRY', 'RECEIVED', 'IN_PROCESS', 'INSPECTION', 'WASHING', 'DRYING', 'IRONING', 'FOLDING', 'QUALITY_CHECK', 'PACKED', 'PACKING'].includes(o.status)).length;
  const readyCount = orders.filter(o => ['READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 'DELIVERY_ASSIGNED'].includes(o.status)).length;
  const deliveredCount = orders.filter(o => o.status === 'DELIVERED').length;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="badge badge-warning">Pending Approval</span>;
      case 'ACCEPTED':
      case 'PICKUP_ASSIGNED':
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

  return (
    <div className="portal-container">
      {/* Header Banner */}
      <div className="dashboard-welcome-card">
        <div className="welcome-text">
          <div className="badge-pill mb-2">Customer Hub</div>
          <h1 className="text-2xl font-bold text-navy">Welcome back, {currentUser?.full_name || currentUser?.first_name || 'Valued Customer'}!</h1>
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

      {/* Stats Cards */}
      <div className="stats-grid mt-6">
        <div className="stat-card">
          <div className="stat-icon bg-blue-50 text-blue-600">
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Pending Pickups</span>
            <span className="stat-value">{pendingCount}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-indigo-50 text-indigo-600">
            <Sparkles size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">In Cleaning</span>
            <span className="stat-value">{inProcessCount}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-amber-50 text-amber-600">
            <Truck size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Ready / On Route</span>
            <span className="stat-value">{readyCount}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-emerald-50 text-emerald-600">
            <CheckCircle size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Completed Orders</span>
            <span className="stat-value">{deliveredCount}</span>
          </div>
        </div>
      </div>

      {/* Quick Access Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <button 
          onClick={() => navigateTo('customer-orders')}
          className="quick-nav-card"
        >
          <Package className="text-primary mb-2" size={24} />
          <span className="font-semibold text-navy text-sm">My Orders</span>
          <span className="text-xs text-muted">View all laundry bookings</span>
        </button>

        <button 
          onClick={() => navigateTo('customer-invoices')}
          className="quick-nav-card"
        >
          <FileText className="text-primary mb-2" size={24} />
          <span className="font-semibold text-navy text-sm">Invoices & Bills</span>
          <span className="text-xs text-muted">Download tax invoices</span>
        </button>

        <button 
          onClick={() => navigateTo('customer-addresses')}
          className="quick-nav-card"
        >
          <MapPin className="text-primary mb-2" size={24} />
          <span className="font-semibold text-navy text-sm">Saved Addresses</span>
          <span className="text-xs text-muted">Manage pickup spots</span>
        </button>

        <button 
          onClick={() => navigateTo('customer-support')}
          className="quick-nav-card"
        >
          <AlertCircle className="text-primary mb-2" size={24} />
          <span className="font-semibold text-navy text-sm">Help & Support</span>
          <span className="text-xs text-muted">Contact laundry desk</span>
        </button>
      </div>

      {/* Active Orders Section */}
      <div className="content-card mt-8">
        <div className="flex items-center justify-between border-b pb-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-navy">Recent Orders</h2>
            <p className="text-xs text-muted">Real-time status updates directly from our laundry hub</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={fetchOrders} 
              className="btn btn-outline-secondary btn-sm flex items-center gap-1"
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button 
              onClick={() => navigateTo('customer-orders')}
              className="btn btn-outline-primary btn-sm flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <RefreshCw size={32} className="animate-spin text-primary mx-auto mb-3" />
            <p className="text-sm text-muted">Loading live orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Package size={48} className="text-slate-300 mx-auto mb-3" />
            <h3 className="font-semibold text-navy">No orders yet</h3>
            <p className="text-sm text-muted max-w-sm mx-auto mt-1 mb-4">
              You haven't scheduled any pickups yet. Schedule your first laundry pickup in under 60 seconds!
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
                  <th>Items / Services</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map(order => (
                  <tr key={order.id}>
                    <td>
                      <span className="font-mono font-bold text-primary">{order.order_number}</span>
                      <span className="text-xs text-muted block">{order.created_at ? new Date(order.created_at).toLocaleDateString() : ''}</span>
                    </td>
                    <td>
                      <div className="text-sm font-medium text-navy">{order.pickup_date}</div>
                      <div className="text-xs text-muted">{order.pickup_time_slot}</div>
                    </td>
                    <td>
                      <div className="text-sm">
                        {Array.isArray(order.items) && order.items.length > 0 
                          ? order.items.map(i => `${i.item_name || i.name || 'Item'} (${i.quantity || 1})`).join(', ')
                          : 'General Laundry'}
                      </div>
                      <div className="text-xs text-muted">{order.pickup_address}</div>
                    </td>
                    <td>
                      <span className="font-bold text-navy">₹{order.total_amount || order.estimated_amount || '0.00'}</span>
                      <span className={`text-xs block ${order.payment_status === 'PAID' ? 'text-emerald-600 font-semibold' : 'text-amber-600'}`}>
                        {order.payment_status || 'PENDING'}
                      </span>
                    </td>
                    <td>
                      {getStatusBadge(order.status)}
                    </td>
                    <td>
                      <button
                        onClick={() => navigateTo('customer-track', order.id.toString())}
                        className="btn btn-sm btn-outline-primary flex items-center gap-1"
                      >
                        <span>Track</span>
                        <ChevronRight size={14} />
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
