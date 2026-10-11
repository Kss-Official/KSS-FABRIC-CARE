import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBooking } from '../context/BookingContext';
import { deliveryApi, notificationsApi } from '../api/apiClient';
import { 
  Truck, 
  Package, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  MapPin, 
  Phone, 
  User, 
  RefreshCw,
  LogOut,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Building2,
  XCircle,
  Home,
  LayoutDashboard,
  Bell,
  Menu,
  X,
  ChevronRight,
  Mail,
  Shield,
  CheckCircle2,
  ExternalLink,
  Award,
  Navigation
} from 'lucide-react';

export const DeliveryPortal = () => {
  const { currentUser, logout } = useAuth();
  const { navigateTo } = useBooking();
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'pickups' | 'dropoff' | 'deliveries' | 'history' | 'notifications' | 'profile'
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Modals state
  const [pickupModalOrder, setPickupModalOrder] = useState(null);
  const [bagsCount, setBagsCount] = useState(1);
  const [weightKg, setWeightKg] = useState('');
  const [pickupNotes, setPickupNotes] = useState('');
  const [submittingPickup, setSubmittingPickup] = useState(false);

  // Dropoff modal
  const [dropoffModalOrder, setDropoffModalOrder] = useState(null);
  const [facilityName, setFacilityName] = useState('Central Hub Banaswadi');
  const [dropoffNotes, setDropoffNotes] = useState('');
  const [submittingDropoff, setSubmittingDropoff] = useState(false);

  // Delivery confirmation modal
  const [deliveryModalOrder, setDeliveryModalOrder] = useState(null);
  const [recipientName, setRecipientName] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [submittingDelivery, setSubmittingDelivery] = useState(false);

  // Failed delivery modal
  const [failModalOrder, setFailModalOrder] = useState(null);
  const [failureReason, setFailureReason] = useState('Customer unavailable');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [submittingFail, setSubmittingFail] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await deliveryApi.getTasks();
      let list = [];
      if (Array.isArray(res.data)) {
        list = res.data;
      } else if (res.data?.results && Array.isArray(res.data.results)) {
        list = res.data.results;
      } else if (res.data && typeof res.data === 'object') {
        const combined = [
          ...(res.data.pickup_tasks || []),
          ...(res.data.dropoff_tasks || []),
          ...(res.data.delivery_tasks || []),
          ...(res.data.completed_tasks || [])
        ];
        const seen = new Set();
        list = combined.filter(item => {
          if (!item || !item.id) return false;
          if (seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
        });
      }
      setTasks(list);
    } catch (err) {
      console.error('Failed to load delivery tasks:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to connect to delivery dispatch service. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const res = await notificationsApi.getNotifications();
      const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setNotifications(list);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchNotifications();
  }, []);

  const handleRefreshAll = async () => {
    await Promise.all([fetchTasks(), fetchNotifications()]);
  };

  const handleLogout = async () => {
    await logout();
    navigateTo('home');
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await notificationsApi.markAllRead();
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark notifications as read:', err);
    }
  };

  const handleConfirmPickup = async (e) => {
    e.preventDefault();
    if (!pickupModalOrder) return;
    setSubmittingPickup(true);
    try {
      const bCount = parseInt(bagsCount) || 1;
      const wKg = weightKg ? parseFloat(weightKg) : null;
      await deliveryApi.confirmPickup(pickupModalOrder.id, {
        collected_bags_count: bCount,
        bags_count: bCount,
        collected_weight_kg: wKg,
        weight_kg: wKg,
        pickup_notes: pickupNotes,
        notes: pickupNotes
      });
      setPickupModalOrder(null);
      setBagsCount(1);
      setWeightKg('');
      setPickupNotes('');
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.detail || err.response?.data?.error || 'Failed to confirm pickup');
    } finally {
      setSubmittingPickup(false);
    }
  };

  const handleDropoffLaundry = async (e) => {
    e.preventDefault();
    if (!dropoffModalOrder) return;
    setSubmittingDropoff(true);
    try {
      await deliveryApi.dropoffLaundry(dropoffModalOrder.id, {
        facility_name: facilityName,
        notes: dropoffNotes
      });
      setDropoffModalOrder(null);
      setDropoffNotes('');
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.detail || err.response?.data?.error || 'Failed to record hub dropoff');
    } finally {
      setSubmittingDropoff(false);
    }
  };

  const handleConfirmDelivery = async (e) => {
    e.preventDefault();
    if (!deliveryModalOrder) return;
    setSubmittingDelivery(true);
    try {
      const recName = recipientName || deliveryModalOrder.customer_name || deliveryModalOrder.pickup_full_name || 'Authorized Recipient';
      await deliveryApi.confirmDelivery(deliveryModalOrder.id, {
        recipient_name: recName,
        received_by: recName,
        delivery_notes: deliveryNotes,
        notes: deliveryNotes
      });
      setDeliveryModalOrder(null);
      setRecipientName('');
      setDeliveryNotes('');
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.detail || err.response?.data?.error || 'Failed to complete delivery');
    } finally {
      setSubmittingDelivery(false);
    }
  };

  const handleFailDelivery = async (e) => {
    e.preventDefault();
    if (!failModalOrder) return;
    setSubmittingFail(true);
    try {
      await deliveryApi.failDelivery(failModalOrder.id, {
        failed_reason: failureReason,
        reason: failureReason,
        rescheduled_date: rescheduleDate || null
      });
      setFailModalOrder(null);
      setFailureReason('Customer unavailable');
      setRescheduleDate('');
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.detail || err.response?.data?.error || 'Failed to log delivery failure');
    } finally {
      setSubmittingFail(false);
    }
  };

  // Filter tasks based on real API status
  const pickupTasks = tasks.filter(t => ['PICKUP_ASSIGNED', 'ACCEPTED', 'PICKUP_IN_PROGRESS'].includes(t.status));
  const dropoffTasks = tasks.filter(t => ['PICKED_UP'].includes(t.status));
  const deliveryTasks = tasks.filter(t => ['READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 'DELIVERY_ASSIGNED'].includes(t.status));
  const completedTasks = tasks.filter(t => t.status === 'DELIVERED');
  const totalActiveTasks = pickupTasks.length + dropoffTasks.length + deliveryTasks.length;
  const unreadNotificationsCount = notifications.filter(n => !n.is_read).length;

  // Sidebar navigation items
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard size={19} />,
      count: totalActiveTasks > 0 ? totalActiveTasks : null,
      badgeColor: 'bg-teal-100 text-teal-800'
    },
    {
      id: 'pickups',
      label: 'Pickup Tasks',
      icon: <Clock size={19} />,
      count: pickupTasks.length,
      badgeColor: pickupTasks.length > 0 ? 'bg-amber-100 text-amber-800 font-bold' : 'bg-slate-100 text-slate-600'
    },
    {
      id: 'dropoff',
      label: 'Laundry Hub Drop-off',
      icon: <Building2 size={19} />,
      count: dropoffTasks.length,
      badgeColor: dropoffTasks.length > 0 ? 'bg-indigo-100 text-indigo-800 font-bold' : 'bg-slate-100 text-slate-600'
    },
    {
      id: 'deliveries',
      label: 'Delivery Tasks',
      icon: <Truck size={19} />,
      count: deliveryTasks.length,
      badgeColor: deliveryTasks.length > 0 ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-slate-100 text-slate-600'
    },
    {
      id: 'history',
      label: 'Task History',
      icon: <CheckCircle size={19} />,
      count: completedTasks.length,
      badgeColor: 'bg-slate-100 text-slate-600'
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <Bell size={19} />,
      count: unreadNotificationsCount > 0 ? unreadNotificationsCount : (notifications.length > 0 ? notifications.length : null),
      badgeColor: unreadNotificationsCount > 0 ? 'bg-rose-500 text-white font-bold' : 'bg-slate-100 text-slate-600'
    },
    {
      id: 'profile',
      label: 'My Profile',
      icon: <User size={19} />,
      count: null
    }
  ];

  return (
    <div className="delivery-portal-root">
      {/* Mobile Drawer Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="delivery-sidebar-backdrop"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Permanent Fixed Left Sidebar */}
      <aside className={`delivery-sidebar ${mobileSidebarOpen ? 'open' : ''}`}>
        {/* Sidebar Brand Header */}
        <div className="sidebar-brand-header">
          <div className="brand-badge-row">
            <span className="brand-logo-text">
              Laund<span className="brand-logo-accent">rix</span>
            </span>
            <span className="portal-sub-badge">Agent Portal</span>
          </div>
          <button 
            className="mobile-close-btn"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Agent Profile Chip */}
        <div className="sidebar-agent-card">
          <div className="agent-avatar-circle">
            {currentUser?.avatar || (currentUser?.full_name ? currentUser.full_name.charAt(0) : 'D')}
          </div>
          <div className="agent-card-info">
            <div className="agent-card-name" title={currentUser?.full_name || currentUser?.username}>
              {currentUser?.full_name || currentUser?.username || 'Delivery Agent'}
            </div>
            <div className="agent-card-status">
              <span className="status-indicator-dot" />
              <span>Field Active</span>
            </div>
          </div>
        </div>

        {/* Sidebar Nav Menu */}
        <nav className="sidebar-nav-menu">
          <div className="nav-section-title">Field Operations</div>
          {menuItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileSidebarOpen(false);
                }}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {item.count !== null && item.count !== undefined && (
                  <span className={`nav-count-badge ${item.badgeColor}`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer Menu */}
        <div className="sidebar-footer-menu">
          <button
            onClick={() => navigateTo('home')}
            className="sidebar-nav-item link-item"
          >
            <span className="nav-icon"><Home size={18} /></span>
            <span className="nav-label">Main Customer Site</span>
            <ExternalLink size={14} className="opacity-60 ml-auto" />
          </button>

          <button
            onClick={handleLogout}
            className="sidebar-nav-item logout-btn"
          >
            <span className="nav-icon"><LogOut size={18} /></span>
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Right Content Wrapper */}
      <div className="delivery-main-wrapper">
        {/* Top Navbar */}
        <header className="delivery-topbar">
          <div className="topbar-left">
            <button 
              className="mobile-hamburger-btn"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu size={22} />
            </button>
            <div className="topbar-title-block">
              <div className="topbar-kicker">Delivery Field Operations</div>
              <h1 className="topbar-heading">
                {menuItems.find(m => m.id === activeTab)?.label || 'Agent Portal'}
              </h1>
            </div>
          </div>

          <div className="topbar-actions">
            <button 
              onClick={handleRefreshAll} 
              className="topbar-btn refresh-btn"
              disabled={loading}
              title="Refresh task assignments from backend"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh Tasks</span>
            </button>

            <button 
              onClick={() => setActiveTab('notifications')}
              className={`topbar-icon-btn ${activeTab === 'notifications' ? 'active' : ''}`}
              title="Notifications"
            >
              <Bell size={18} />
              {unreadNotificationsCount > 0 && (
                <span className="topbar-badge">{unreadNotificationsCount}</span>
              )}
            </button>

            <div 
              className="topbar-user-pill"
              onClick={() => setActiveTab('profile')}
              title="View my profile"
            >
              <div className="user-pill-avatar">
                {currentUser?.avatar || (currentUser?.full_name ? currentUser.full_name.charAt(0) : 'D')}
              </div>
              <span className="user-pill-name hidden md:inline">
                {currentUser?.full_name || currentUser?.username || 'Delivery Agent'}
              </span>
            </div>
          </div>
        </header>

        {/* Global Error Banner */}
        {error && (
          <div className="global-error-card mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-red-500 shrink-0" />
              <div>
                <p className="font-bold text-sm text-red-900">Dispatch API Error</p>
                <p className="text-xs text-red-700">{error}</p>
              </div>
            </div>
            <button
              onClick={handleRefreshAll}
              className="btn btn-outline-danger btn-sm flex items-center gap-1.5"
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Task Summary Metrics Bar (Visible on Dashboard, Pickups, Dropoff, Deliveries) */}
        {['dashboard', 'pickups', 'dropoff', 'deliveries'].includes(activeTab) && (
          <div className="stats-grid mb-6">
            <div 
              className={`stat-card cursor-pointer transition-all ${activeTab === 'pickups' ? 'ring-2 ring-[#0D7A75] shadow-md' : ''}`} 
              onClick={() => setActiveTab('pickups')}
            >
              <div className="stat-icon bg-blue-50 text-blue-600">
                <Clock size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Pending Pickups</span>
                <span className="stat-value">{pickupTasks.length}</span>
              </div>
            </div>

            <div 
              className={`stat-card cursor-pointer transition-all ${activeTab === 'dropoff' ? 'ring-2 ring-[#0D7A75] shadow-md' : ''}`} 
              onClick={() => setActiveTab('dropoff')}
            >
              <div className="stat-icon bg-indigo-50 text-indigo-600">
                <Building2 size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Hub Drop-Offs</span>
                <span className="stat-value">{dropoffTasks.length}</span>
              </div>
            </div>

            <div 
              className={`stat-card cursor-pointer transition-all ${activeTab === 'deliveries' ? 'ring-2 ring-[#0D7A75] shadow-md' : ''}`} 
              onClick={() => setActiveTab('deliveries')}
            >
              <div className="stat-icon bg-amber-50 text-amber-600">
                <Truck size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Doorstep Deliveries</span>
                <span className="stat-value">{deliveryTasks.length}</span>
              </div>
            </div>

            <div 
              className={`stat-card cursor-pointer transition-all ${activeTab === 'history' ? 'ring-2 ring-[#0D7A75] shadow-md' : ''}`} 
              onClick={() => setActiveTab('history')}
            >
              <div className="stat-icon bg-emerald-50 text-emerald-600">
                <CheckCircle size={24} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Completed</span>
                <span className="stat-value">{completedTasks.length}</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            PAGE 1: DASHBOARD
           ======================================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Welcome Banner */}
            <div className="dashboard-welcome-card">
              <div className="welcome-text">
                <div className="badge-pill mb-2 bg-white/20 text-white backdrop-blur-sm">
                  Field Operations Hub
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  Welcome back, {currentUser?.full_name || currentUser?.username || 'Agent'}!
                </h2>
                <p className="text-xs text-white/80 mt-1">
                  You have <strong className="text-white font-bold">{totalActiveTasks} active tasks</strong> assigned to your field route today.
                </p>
              </div>
              <div className="welcome-actions flex items-center gap-2">
                <button 
                  onClick={() => setActiveTab('pickups')} 
                  className="btn bg-white text-[#0D7A75] hover:bg-slate-100 font-bold text-xs px-4 py-2 rounded-lg"
                >
                  View Pickups ({pickupTasks.length})
                </button>
                <button 
                  onClick={() => setActiveTab('deliveries')} 
                  className="btn bg-white/20 text-white hover:bg-white/30 text-xs px-4 py-2 rounded-lg"
                >
                  View Deliveries ({deliveryTasks.length})
                </button>
              </div>
            </div>

            {/* Urgent / Active Tasks Queue Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pickup Queue */}
              <div className="content-card">
                <div className="flex items-center justify-between mb-4 pb-2 border-b">
                  <div className="flex items-center gap-2">
                    <Clock size={18} className="text-amber-500" />
                    <h3 className="font-bold text-navy text-sm">Immediate Customer Pickups</h3>
                  </div>
                  <button 
                    onClick={() => setActiveTab('pickups')}
                    className="text-xs text-[#0D7A75] font-bold hover:underline flex items-center gap-1"
                  >
                    <span>View All ({pickupTasks.length})</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

                {pickupTasks.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <CheckCircle2 size={36} className="text-emerald-500 mx-auto mb-2" />
                    <p className="text-xs font-semibold">No pending pickups!</p>
                    <p className="text-[11px] text-muted">All collections for your sector have been completed.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pickupTasks.slice(0, 3).map(task => (
                      <div key={task.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#0D7A75] text-xs">{task.order_number || task.order_id}</span>
                            <span className="text-xs font-semibold text-navy">{task.customer_name || task.pickup_full_name}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                            <span>{task.pickup_time_slot || 'Standard Slot'}</span>
                            <span>•</span>
                            <span>{task.pickup_address?.substring(0, 35)}...</span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setActiveTab('pickups');
                            setPickupModalOrder(task);
                          }}
                          className="btn btn-primary btn-sm text-xs px-2.5 py-1.5"
                        >
                          Collect
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Delivery Queue */}
              <div className="content-card">
                <div className="flex items-center justify-between mb-4 pb-2 border-b">
                  <div className="flex items-center gap-2">
                    <Truck size={18} className="text-emerald-500" />
                    <h3 className="font-bold text-navy text-sm">Ready for Doorstep Delivery</h3>
                  </div>
                  <button 
                    onClick={() => setActiveTab('deliveries')}
                    className="text-xs text-[#0D7A75] font-bold hover:underline flex items-center gap-1"
                  >
                    <span>View All ({deliveryTasks.length})</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

                {deliveryTasks.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Package size={36} className="text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold">No dispatches ready for delivery</p>
                    <p className="text-[11px] text-muted">Orders will appear here once packed by laundry operations.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {deliveryTasks.slice(0, 3).map(task => (
                      <div key={task.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-emerald-700 text-xs">{task.order_number || task.order_id}</span>
                            <span className="text-xs font-semibold text-navy">{task.customer_name || task.pickup_full_name}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                            <span>To Collect: ₹{task.total_amount || task.estimated_amount}</span>
                            <span>•</span>
                            <span>{task.delivery_address?.substring(0, 35) || task.pickup_address?.substring(0, 35)}...</span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setActiveTab('deliveries');
                            setDeliveryModalOrder(task);
                          }}
                          className="btn btn-success btn-sm text-xs px-2.5 py-1.5"
                        >
                          Deliver
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Shift & Vehicle Info Card */}
            <div className="content-card">
              <h3 className="font-bold text-navy text-sm mb-3">Field Deployment & Facility Desk</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-slate-400 font-semibold mb-1">OPERATIONAL BASE</div>
                  <div className="font-bold text-navy text-sm">Central Hub Banaswadi</div>
                  <div className="text-slate-500 mt-0.5">East Bengaluru Laundry Plant</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-slate-400 font-semibold mb-1">DUTY STATUS</div>
                  <div className="font-bold text-emerald-600 text-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>On Route (Field Active)</span>
                  </div>
                  <div className="text-slate-500 mt-0.5">Real-time GPS dispatch connected</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-slate-400 font-semibold mb-1">AGENT IDENTIFIER</div>
                  <div className="font-bold text-navy text-sm font-mono">FC-AGT-006</div>
                  <div className="text-slate-500 mt-0.5">Authorized Field Representative</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            PAGE 2: PICKUP TASKS
           ======================================================== */}
        {activeTab === 'pickups' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-navy">Assigned Pickup Tasks</h2>
                <p className="text-xs text-muted">Collect garments from customer doorstep and record initial count/bags</p>
              </div>
              <span className="text-xs font-bold text-[#0D7A75] bg-[#EBF8F7] px-3 py-1 rounded-full">
                {pickupTasks.length} Pending
              </span>
            </div>

            {loading ? (
              <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
                <RefreshCw size={32} className="animate-spin text-[#0D7A75] mx-auto mb-2" />
                <p className="text-xs text-muted">Loading pickup assignments...</p>
              </div>
            ) : error ? (
              <div className="text-center py-16 bg-white rounded-xl border border-red-200">
                <AlertCircle size={40} className="text-red-400 mx-auto mb-2" />
                <h3 className="font-bold text-navy">Unable to load pickup tasks</h3>
                <p className="text-xs text-muted mb-3">{error}</p>
                <button onClick={handleRefreshAll} className="btn btn-primary btn-sm mx-auto flex items-center gap-1.5">
                  <RefreshCw size={14} />
                  <span>Retry</span>
                </button>
              </div>
            ) : pickupTasks.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
                <Clock size={44} className="text-slate-300 mx-auto mb-2" />
                <h3 className="font-bold text-navy">No pending pickups</h3>
                <p className="text-xs text-muted">You have collected all assigned pickup orders.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pickupTasks.map(task => (
                  <div key={task.id} className="order-item-card border-l-4 border-l-amber-500">
                    <div className="flex items-start justify-between border-b pb-3 mb-3">
                      <div>
                        <span className="font-mono font-bold text-[#0D7A75] text-base">{task.order_number || task.order_id}</span>
                        <div className="text-xs font-semibold text-navy mt-0.5">{task.customer_name || task.pickup_full_name || 'Customer'}</div>
                      </div>
                      <span className="badge badge-warning">Pickup Pending</span>
                    </div>

                    <div className="space-y-2 text-xs text-slate-600 mb-4">
                      <div className="flex items-start gap-2">
                        <MapPin size={14} className="text-[#0D7A75] shrink-0 mt-0.5" />
                        <span>{task.pickup_address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400 shrink-0" />
                        <span><strong>Date:</strong> {task.pickup_date} ({task.pickup_time_slot})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-slate-400 shrink-0" />
                        <span><strong>Contact:</strong> {task.customer_phone || task.pickup_phone || '+91 98765 43210'}</span>
                      </div>
                      {task.special_instructions && (
                        <div className="p-2 bg-blue-50/70 rounded text-[11px] text-blue-900">
                          <strong>Note:</strong> {task.special_instructions}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setPickupModalOrder(task)}
                      className="btn btn-primary btn-sm w-full flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={15} />
                      <span>Confirm Clothes Collection</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            PAGE 3: LAUNDRY HUB DROP-OFF
           ======================================================== */}
        {activeTab === 'dropoff' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-navy">Collected Clothes for Hub Transfer</h2>
                <p className="text-xs text-muted">Hand over collected bags to central laundry facility desk</p>
              </div>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full">
                {dropoffTasks.length} In Transit
              </span>
            </div>

            {loading ? (
              <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
                <RefreshCw size={32} className="animate-spin text-[#0D7A75] mx-auto mb-2" />
                <p className="text-xs text-muted">Loading hub drop-off list...</p>
              </div>
            ) : error ? (
              <div className="text-center py-16 bg-white rounded-xl border border-red-200">
                <AlertCircle size={40} className="text-red-400 mx-auto mb-2" />
                <h3 className="font-bold text-navy">Unable to load hub drop-off tasks</h3>
                <p className="text-xs text-muted mb-3">{error}</p>
                <button onClick={handleRefreshAll} className="btn btn-primary btn-sm mx-auto flex items-center gap-1.5">
                  <RefreshCw size={14} />
                  <span>Retry</span>
                </button>
              </div>
            ) : dropoffTasks.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
                <Building2 size={44} className="text-slate-300 mx-auto mb-2" />
                <h3 className="font-bold text-navy">No bags pending hub drop-off</h3>
                <p className="text-xs text-muted">Collect items from customers to initiate laundry facility transfer.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dropoffTasks.map(task => (
                  <div key={task.id} className="order-item-card border-l-4 border-l-indigo-500">
                    <div className="flex items-start justify-between border-b pb-3 mb-3">
                      <div>
                        <span className="font-mono font-bold text-navy text-base">{task.order_number || task.order_id}</span>
                        <div className="text-xs text-muted">Collected from: {task.customer_name || task.pickup_full_name}</div>
                      </div>
                      <span className="badge badge-info">Collected / In Transit</span>
                    </div>

                    {task.pickup_record && (
                      <div className="p-2.5 bg-slate-50 rounded-lg text-xs text-slate-700 mb-4 space-y-1">
                        <div><strong>Bags Picked Up:</strong> {task.pickup_record.bags_count || task.pickup_record.collected_bags_count}</div>
                        <div><strong>Pickup Weight:</strong> {(task.pickup_record.weight_kg || task.pickup_record.collected_weight_kg) ? `${task.pickup_record.weight_kg || task.pickup_record.collected_weight_kg} kg` : 'Not recorded'}</div>
                      </div>
                    )}

                    <button
                      onClick={() => setDropoffModalOrder(task)}
                      className="btn btn-primary btn-sm w-full flex items-center justify-center gap-2"
                    >
                      <Building2 size={15} />
                      <span>Hand Over to Laundry Facility</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            PAGE 4: DELIVERY TASKS
           ======================================================== */}
        {activeTab === 'deliveries' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-navy">Packed Orders Ready for Customer Delivery</h2>
                <p className="text-xs text-muted">Dispatched from hub — deliver to customer and verify receipt</p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                {deliveryTasks.length} Ready
              </span>
            </div>

            {loading ? (
              <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
                <RefreshCw size={32} className="animate-spin text-[#0D7A75] mx-auto mb-2" />
                <p className="text-xs text-muted">Loading delivery dispatches...</p>
              </div>
            ) : error ? (
              <div className="text-center py-16 bg-white rounded-xl border border-red-200">
                <AlertCircle size={40} className="text-red-400 mx-auto mb-2" />
                <h3 className="font-bold text-navy">Unable to load delivery tasks</h3>
                <p className="text-xs text-muted mb-3">{error}</p>
                <button onClick={handleRefreshAll} className="btn btn-primary btn-sm mx-auto flex items-center gap-1.5">
                  <RefreshCw size={14} />
                  <span>Retry</span>
                </button>
              </div>
            ) : deliveryTasks.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
                <Truck size={44} className="text-slate-300 mx-auto mb-2" />
                <h3 className="font-bold text-navy">No orders pending delivery</h3>
                <p className="text-xs text-muted">When laundry processing completes, packed orders will appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {deliveryTasks.map(task => (
                  <div key={task.id} className="order-item-card border-l-4 border-l-emerald-500">
                    <div className="flex items-start justify-between border-b pb-3 mb-3">
                      <div>
                        <span className="font-mono font-bold text-emerald-700 text-base">{task.order_number || task.order_id}</span>
                        <div className="text-xs font-semibold text-navy mt-0.5">{task.customer_name || task.pickup_full_name || 'Customer'}</div>
                      </div>
                      <span className="badge badge-success">Ready for Doorstep Delivery</span>
                    </div>

                    <div className="space-y-2 text-xs text-slate-600 mb-4">
                      <div className="flex items-start gap-2">
                        <MapPin size={14} className="text-[#0D7A75] shrink-0 mt-0.5" />
                        <span>{task.delivery_address || task.pickup_address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-slate-400 shrink-0" />
                        <span><strong>Contact:</strong> {task.customer_phone || task.pickup_phone || '+91 98765 43210'}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span><strong>Amount to Collect:</strong></span>
                        <span className="font-bold text-navy">₹{task.total_amount || task.estimated_amount} ({task.payment_status || 'Unpaid'})</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setDeliveryModalOrder(task)}
                        className="btn btn-success btn-sm flex-1 flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle size={15} />
                        <span>Confirm Delivery</span>
                      </button>
                      <button
                        onClick={() => setFailModalOrder(task)}
                        className="btn btn-outline-danger btn-sm flex items-center justify-center gap-1"
                      >
                        <XCircle size={15} />
                        <span>Failed / Retry</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            PAGE 5: TASK HISTORY
           ======================================================== */}
        {activeTab === 'history' && (
          <div className="content-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-navy">Completed Deliveries</h2>
                <p className="text-xs text-muted">Audited history of customer handovers and delivered packages</p>
              </div>
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
                {completedTasks.length} Completed
              </span>
            </div>

            {loading ? (
              <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
                <RefreshCw size={32} className="animate-spin text-[#0D7A75] mx-auto mb-2" />
                <p className="text-xs text-muted">Loading history...</p>
              </div>
            ) : error ? (
              <div className="text-center py-16 bg-white rounded-xl border border-red-200">
                <AlertCircle size={40} className="text-red-400 mx-auto mb-2" />
                <h3 className="font-bold text-navy">Unable to load task history</h3>
                <p className="text-xs text-muted mb-3">{error}</p>
                <button onClick={handleRefreshAll} className="btn btn-primary btn-sm mx-auto flex items-center gap-1.5">
                  <RefreshCw size={14} />
                  <span>Retry</span>
                </button>
              </div>
            ) : completedTasks.length === 0 ? (
              <div className="text-center py-16">
                <CheckCircle size={44} className="text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-muted">No completed orders yet.</p>
              </div>
            ) : (
              <div className="orders-table-wrapper">
                <table className="portal-table">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Customer</th>
                      <th>Delivered To</th>
                      <th>Total Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedTasks.map(task => (
                      <tr key={task.id}>
                        <td className="font-mono font-bold text-[#0D7A75]">{task.order_number || task.order_id}</td>
                        <td>{task.customer_name || task.pickup_full_name}</td>
                        <td>{task.delivery_record?.received_by || task.delivery_record?.recipient_name || 'Customer'}</td>
                        <td className="font-bold">₹{task.total_amount}</td>
                        <td><span className="badge badge-success">Delivered</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            PAGE 6: NOTIFICATIONS
           ======================================================== */}
        {activeTab === 'notifications' && (
          <div className="content-card">
            <div className="flex items-center justify-between mb-4 pb-2 border-b">
              <div>
                <h2 className="text-lg font-bold text-navy">Agent Notifications</h2>
                <p className="text-xs text-muted">System dispatch alerts and order handover logs</p>
              </div>
              {notifications.length > 0 && (
                <button
                  onClick={handleMarkAllNotificationsRead}
                  className="btn btn-outline-secondary btn-sm text-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 size={14} />
                  <span>Mark All Read</span>
                </button>
              )}
            </div>

            {loadingNotifications ? (
              <div className="text-center py-16">
                <RefreshCw size={32} className="animate-spin text-[#0D7A75] mx-auto mb-2" />
                <p className="text-xs text-muted">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-16">
                <Bell size={44} className="text-slate-300 mx-auto mb-2" />
                <h3 className="font-bold text-navy">No new notifications</h3>
                <p className="text-xs text-muted mt-1">
                  You will receive immediate alerts whenever new pickup or delivery assignments are dispatched.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map(notif => (
                  <div 
                    key={notif.id}
                    className={`p-3.5 rounded-xl border flex items-start gap-3 transition-colors ${
                      notif.is_read ? 'bg-white border-slate-200' : 'bg-teal-50/60 border-teal-200'
                    }`}
                  >
                    <div className="mt-0.5 p-2 rounded-lg bg-teal-100 text-[#0D7A75] shrink-0">
                      <Bell size={16} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-navy text-xs">{notif.title}</span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(notif.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{notif.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            PAGE 7: MY PROFILE
           ======================================================== */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="content-card">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0D7A75] to-[#0E4B56] text-white flex items-center justify-center font-bold text-2xl shadow-lg">
                    {currentUser?.avatar || (currentUser?.full_name ? currentUser.full_name.charAt(0) : 'D')}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-navy">
                      {currentUser?.full_name || currentUser?.username || 'Delivery Agent'}
                    </h2>
                    <p className="text-xs text-muted mt-0.5">
                      Authorized Field Representative • ID #FC-AGT-006
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="badge badge-success text-[10px]">On Active Duty</span>
                      <span className="badge badge-info text-[10px]">Zone: Banaswadi & Central</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleLogout}
                    className="btn btn-outline-danger btn-sm flex items-center gap-1.5"
                  >
                    <LogOut size={14} />
                    <span>Logout Account</span>
                  </button>
                </div>
              </div>

              {/* Profile Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                <div className="space-y-4 text-xs">
                  <div>
                    <span className="text-slate-400 block font-semibold mb-1">EMAIL ADDRESS</span>
                    <div className="font-bold text-navy flex items-center gap-2">
                      <Mail size={14} className="text-slate-400" />
                      <span>{currentUser?.email || 'delivery.agent@fabricare.com'}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-semibold mb-1">CONTACT PHONE</span>
                    <div className="font-bold text-navy flex items-center gap-2">
                      <Phone size={14} className="text-slate-400" />
                      <span>{currentUser?.phone || '+91 98765 43210'}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-semibold mb-1">BASE REGION</span>
                    <div className="font-bold text-navy flex items-center gap-2">
                      <MapPin size={14} className="text-slate-400" />
                      <span>{currentUser?.city || 'Bengaluru'} - East Division</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <span className="text-slate-400 block font-semibold mb-1">FIELD PERFORMANCE</span>
                    <div className="p-3 bg-slate-50 rounded-xl border space-y-2">
                      <div className="flex justify-between">
                        <span>Completed Deliveries:</span>
                        <strong className="text-navy">{completedTasks.length} Orders</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Assigned Tasks Today:</span>
                        <strong className="text-[#0D7A75]">{totalActiveTasks} Orders</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>On-time Delivery Rate:</span>
                        <strong className="text-emerald-600">99.4%</strong>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-semibold mb-1">SECURITY CLEARANCE</span>
                    <div className="flex items-center gap-2 font-bold text-navy">
                      <Shield size={14} className="text-emerald-500" />
                      <span>Background Verified • Tier-1 Field Logistics</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          MODALS
         ======================================================== */}

      {/* MODAL: CONFIRM PICKUP */}
      {pickupModalOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
            <h3 className="text-lg font-bold text-navy mb-1">Confirm Pickup for {pickupModalOrder.order_number || pickupModalOrder.order_id}</h3>
            <p className="text-xs text-muted mb-4">Record collected bags and initial weight at customer location</p>

            <form onSubmit={handleConfirmPickup} className="space-y-4">
              <div>
                <label className="form-label">Number of Bags Collected *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={bagsCount}
                  onChange={(e) => setBagsCount(e.target.value)}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Approximate Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="E.g., 3.5"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Pickup Notes (Garment condition, stains, etc.)</label>
                <textarea
                  rows={2}
                  value={pickupNotes}
                  onChange={(e) => setPickupNotes(e.target.value)}
                  placeholder="E.g., 2 bags collected, silk saree in separate pouch"
                  className="form-textarea"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPickupModalOrder(null)}
                  className="btn btn-outline-secondary btn-sm"
                  disabled={submittingPickup}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm flex items-center gap-2"
                  disabled={submittingPickup}
                >
                  {submittingPickup ? <RefreshCw size={14} className="animate-spin" /> : null}
                  <span>Save Pickup Confirmation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LAUNDRY DROPOFF */}
      {dropoffModalOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
            <h3 className="text-lg font-bold text-navy mb-1">Laundry Facility Handover</h3>
            <p className="text-xs text-muted mb-4">Record drop-off of {dropoffModalOrder.order_number || dropoffModalOrder.order_id} to laundry staff</p>

            <form onSubmit={handleDropoffLaundry} className="space-y-4">
              <div>
                <label className="form-label">Facility Location</label>
                <input
                  type="text"
                  value={facilityName}
                  onChange={(e) => setFacilityName(e.target.value)}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Transfer Notes</label>
                <textarea
                  rows={2}
                  value={dropoffNotes}
                  onChange={(e) => setDropoffNotes(e.target.value)}
                  placeholder="Handed over to shift supervisor"
                  className="form-textarea"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDropoffModalOrder(null)}
                  className="btn btn-outline-secondary btn-sm"
                  disabled={submittingDropoff}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm flex items-center gap-2"
                  disabled={submittingDropoff}
                >
                  {submittingDropoff ? <RefreshCw size={14} className="animate-spin" /> : null}
                  <span>Confirm Handover</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM DELIVERY */}
      {deliveryModalOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
            <h3 className="text-lg font-bold text-navy mb-1">Complete Doorstep Delivery</h3>
            <p className="text-xs text-muted mb-4">Record recipient details for {deliveryModalOrder.order_number || deliveryModalOrder.order_id}</p>

            <form onSubmit={handleConfirmDelivery} className="space-y-4">
              <div>
                <label className="form-label">Received By (Customer / Representative Name) *</label>
                <input
                  type="text"
                  required
                  placeholder={deliveryModalOrder.customer_name || deliveryModalOrder.pickup_full_name || 'Customer Name'}
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Delivery Notes</label>
                <textarea
                  rows={2}
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="Delivered safely at doorstep, payment collected"
                  className="form-textarea"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeliveryModalOrder(null)}
                  className="btn btn-outline-secondary btn-sm"
                  disabled={submittingDelivery}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-success btn-sm flex items-center gap-2"
                  disabled={submittingDelivery}
                >
                  {submittingDelivery ? <RefreshCw size={14} className="animate-spin" /> : null}
                  <span>Mark Order Delivered</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: FAILED DELIVERY */}
      {failModalOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
            <h3 className="text-lg font-bold text-navy mb-1">Report Delivery Exception</h3>
            <p className="text-xs text-muted mb-4">Record reason for unsuccessful delivery attempt for {failModalOrder.order_number || failModalOrder.order_id}</p>

            <form onSubmit={handleFailDelivery} className="space-y-4">
              <div>
                <label className="form-label">Failure Reason *</label>
                <select
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                  className="form-select"
                >
                  <option value="Customer unavailable / Door locked">Customer unavailable / Door locked</option>
                  <option value="Incorrect address / phone unreachable">Incorrect address / phone unreachable</option>
                  <option value="Customer requested later delivery slot">Customer requested later delivery slot</option>
                  <option value="Payment issue / Cash not ready">Payment issue / Cash not ready</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="form-label">Reschedule Date (Optional)</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFailModalOrder(null)}
                  className="btn btn-outline-secondary btn-sm"
                  disabled={submittingFail}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-danger btn-sm flex items-center gap-2"
                  disabled={submittingFail}
                >
                  {submittingFail ? <RefreshCw size={14} className="animate-spin" /> : null}
                  <span>Log Exception & Reschedule</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          SCOPED STYLES FOR DELIVERY PORTAL SIDEBAR & LAYOUT
         ======================================================== */}
      <style>{`
        .delivery-portal-root {
          display: flex;
          min-height: 100vh;
          background: #F8FAFC;
          font-family: inherit;
        }

        /* FIXED LEFT SIDEBAR */
        .delivery-sidebar {
          width: 260px;
          background: #FFFFFF;
          border-right: 1px solid #E2E8F0;
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0;
          bottom: 0;
          left: 0;
          height: 100vh;
          z-index: 100;
          flex-shrink: 0;
          overflow-y: auto;
          box-shadow: 2px 0 12px rgba(0, 0, 0, 0.03);
        }

        .sidebar-brand-header {
          padding: 24px 22px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #F1F5F9;
        }

        .brand-badge-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .brand-logo-text {
          font-size: 1.5rem;
          font-weight: 800;
          color: #0D7A75;
          letter-spacing: -0.03em;
          line-height: 1;
        }

        .brand-logo-accent {
          color: #0E4B56;
        }

        .portal-sub-badge {
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #0D7A75;
          background: #EBF8F7;
          padding: 2px 8px;
          border-radius: 6px;
          display: inline-block;
          width: fit-content;
        }

        .mobile-close-btn {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          color: #64748B;
          padding: 4px;
          border-radius: 6px;
        }

        .mobile-close-btn:hover {
          background: #F1F5F9;
          color: #0F172A;
        }

        /* AGENT PROFILE CHIP */
        .sidebar-agent-card {
          padding: 16px 20px;
          margin: 14px 16px 6px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .agent-avatar-circle {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: linear-gradient(135deg, #0D7A75 0%, #0E4B56 100%);
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.875rem;
          flex-shrink: 0;
          box-shadow: 0 2px 6px rgba(13, 122, 117, 0.25);
        }

        .agent-card-info {
          overflow: hidden;
        }

        .agent-card-name {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #0F172A;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .agent-card-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.6875rem;
          color: #059669;
          font-weight: 600;
          margin-top: 1px;
        }

        .status-indicator-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10B981;
          display: inline-block;
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.25);
        }

        /* SIDEBAR NAV MENU */
        .sidebar-nav-menu {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 12px 14px;
          flex: 1;
        }

        .nav-section-title {
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #94A3B8;
          padding: 8px 10px 4px;
        }

        .sidebar-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 14px;
          border-radius: 12px;
          border: none;
          background: transparent;
          color: #475569;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s ease;
          text-align: left;
          width: 100%;
          position: relative;
        }

        .sidebar-nav-item:hover {
          background: #F1F5F9;
          color: #0F172A;
        }

        .sidebar-nav-item.active {
          background: #EBF8F7;
          color: #0D7A75;
          font-weight: 700;
        }

        .sidebar-nav-item.active .nav-icon {
          color: #0D7A75;
        }

        .nav-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748B;
          flex-shrink: 0;
        }

        .nav-label {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .nav-count-badge {
          font-size: 0.6875rem;
          padding: 2px 7px;
          border-radius: 9999px;
          line-height: 1.2;
          flex-shrink: 0;
        }

        /* SIDEBAR FOOTER */
        .sidebar-footer-menu {
          padding: 14px;
          border-top: 1px solid #F1F5F9;
          display: flex;
          flex-direction: column;
          gap: 4px;
          background: #FAFAFA;
        }

        .sidebar-nav-item.logout-btn:hover {
          background: #FEE2E2;
          color: #DC2626;
        }

        .sidebar-nav-item.logout-btn:hover .nav-icon {
          color: #DC2626;
        }

        /* MAIN WRAPPER (RIGHT SIDE) */
        .delivery-main-wrapper {
          margin-left: 260px;
          flex: 1;
          padding: 24px 32px 48px;
          min-height: 100vh;
          max-width: 100%;
        }

        /* TOPBAR */
        .delivery-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding-bottom: 20px;
          margin-bottom: 20px;
          border-bottom: 1px solid #E2E8F0;
        }

        .topbar-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .mobile-hamburger-btn {
          display: none;
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          border-radius: 10px;
          padding: 7px;
          cursor: pointer;
          color: #334155;
        }

        .topbar-kicker {
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #0D7A75;
        }

        .topbar-heading {
          font-size: 1.375rem;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -0.02em;
          line-height: 1.2;
          margin: 0;
        }

        .topbar-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .topbar-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8125rem;
          font-weight: 600;
          padding: 7px 12px;
          border-radius: 9px;
          border: 1px solid #CBD5E1;
          background: #FFFFFF;
          color: #334155;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .topbar-btn:hover {
          background: #F8FAFC;
          border-color: #94A3B8;
        }

        .topbar-icon-btn {
          position: relative;
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          border-radius: 9px;
          padding: 8px;
          color: #334155;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .topbar-icon-btn:hover, .topbar-icon-btn.active {
          background: #EBF8F7;
          border-color: #0D7A75;
          color: #0D7A75;
        }

        .topbar-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #EF4444;
          color: #FFFFFF;
          font-size: 0.625rem;
          font-weight: 700;
          border-radius: 9999px;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }

        .topbar-user-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 10px 4px 4px;
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          border-radius: 9999px;
          cursor: pointer;
          transition: border-color 0.15s ease;
        }

        .topbar-user-pill:hover {
          border-color: #0D7A75;
        }

        .user-pill-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #0D7A75;
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.75rem;
        }

        .user-pill-name {
          font-size: 0.75rem;
          font-weight: 600;
          color: #1E293B;
        }

        /* GLOBAL ERROR CARD */
        .global-error-card {
          background: #FEF2F2;
          border: 1px solid #FCA5A5;
          border-radius: 12px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        /* RESPONSIVE MOBILE DRAWER */
        @media (max-width: 1024px) {
          .delivery-sidebar {
            left: -280px;
            width: 270px;
            transition: left 0.28s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: none;
          }

          .delivery-sidebar.open {
            left: 0;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
          }

          .mobile-close-btn {
            display: block;
          }

          .delivery-main-wrapper {
            margin-left: 0;
            padding: 16px 18px 36px;
          }

          .mobile-hamburger-btn {
            display: block;
          }

          .delivery-sidebar-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.5);
            backdrop-filter: blur(2px);
            z-index: 90;
          }
        }
      `}</style>
    </div>
  );
};

export default DeliveryPortal;
