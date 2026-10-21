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
  RefreshCw,
  Search,
  X
} from 'lucide-react';
import { OrderStatusDropdown } from '../components/common/OrderStatusDropdown';
import { formatOrderId } from '../utils/helpers';

export const CustomerDashboard = () => {
  const { currentUser } = useAuth();
  const { navigateTo, startBooking } = useBooking();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrders = useCallback(async (isManual = false) => {
    if (!isManual) setLoading(true);
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

  const filteredOrders = orders.filter(order => {
    const term = (searchQuery || '').trim().toLowerCase();
    const orderNo = (order.order_number || order.code || '').toLowerCase();
    const formattedNo = formatOrderId(order.order_number || order.code || order.id).toLowerCase();
    const addr = (order.pickup_address || '').toLowerCase();
    const matchesSearch = !term || orderNo.includes(term) || formattedNo.includes(term) || addr.includes(term);

    if (!matchesSearch) return false;
    if (activeTab === 'ALL' || activeTab === 'all') return true;
    if (activeTab === 'PENDING') return ['PENDING', 'PENDING_REVIEW', 'ACCEPTED', 'PICKUP_ASSIGNED', 'PICKUP_SCHEDULED', 'PICKUP_IN_PROGRESS', 'PLACED', 'PAYMENT_PENDING'].includes(order.status);
    if (activeTab === 'PROCESSING') return ['PICKED_UP', 'DROPPED_OFF_AT_LAUNDRY', 'RECEIVED_BY_LAUNDRY', 'RECEIVED_AT_LAUNDRY', 'RECEIVED', 'IN_PROCESS', 'INSPECTION', 'WASHING', 'DRYING', 'IRONING', 'FOLDING', 'QUALITY_CHECK', 'PACKING', 'PACKED', 'IN_CLEANING'].includes(order.status);
    if (activeTab === 'DELIVERY') return ['READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 'DELIVERY_ASSIGNED'].includes(order.status);
    if (activeTab === 'COMPLETED') return ['DELIVERED', 'COMPLETED'].includes(order.status);
    if (activeTab === 'CANCELLED') return order.status === 'CANCELLED';
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
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
                  <tr key={order.id}>
                    <td>
                      <span className="font-mono font-bold text-primary">{formatOrderId(order.order_number || order.code || order.id)}</span>
                      <span className="text-xs text-muted block">{order.created_at ? new Date(order.created_at).toLocaleDateString() : ''}</span>
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
                      <span className={`text-xs block ${order.payment_status === 'PAID' ? 'text-emerald-600 font-semibold' : 'text-amber-600'}`}>
                        {order.payment_status || 'PENDING'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => navigateTo('customer-track', order.id.toString())}
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
