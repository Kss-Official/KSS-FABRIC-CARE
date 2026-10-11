import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBooking } from '../context/BookingContext';
import { laundryApi, notificationsApi, ordersApi } from '../api/apiClient';
import { 
  Sparkles, 
  Layers, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  LogOut, 
  ArrowRight, 
  ShieldCheck, 
  XCircle, 
  Flame, 
  Package, 
  Truck,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Home,
  LayoutDashboard,
  Bell,
  Menu,
  X,
  User,
  ExternalLink,
  ChevronRight,
  Eye,
  Mail,
  Phone,
  MapPin,
  Shield,
  Box
} from 'lucide-react';

export const LaundryPortal = () => {
  const { currentUser, logout } = useAuth();
  const { navigateTo } = useBooking();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Modals state
  // 1. Confirm Receipt & Log Discrepancies
  const [receiptModalOrder, setReceiptModalOrder] = useState(null);
  const [receivedBags, setReceivedBags] = useState(1);
  const [receivedWeight, setReceivedWeight] = useState('');
  const [hasDiscrepancy, setHasDiscrepancy] = useState(false);
  const [discrepancyNotes, setDiscrepancyNotes] = useState('');
  const [submittingReceipt, setSubmittingReceipt] = useState(false);

  // 2. Stage Advance Modal
  const [advancingOrder, setAdvancingOrder] = useState(null);
  const [targetStage, setTargetStage] = useState('WASHING');
  const [stageNotes, setStageNotes] = useState('');
  const [submittingStage, setSubmittingStage] = useState(false);

  // 3. Quality Check Modal
  const [qcModalOrder, setQcModalOrder] = useState(null);
  const [qcPassed, setQcPassed] = useState(true);
  const [qcNotes, setQCNotes] = useState('');
  const [reprocessStage, setReprocessStage] = useState('WASHING');
  const [submittingQc, setSubmittingQc] = useState(false);

  // 4. Packing Modal
  const [packingModalOrder, setPackingModalOrder] = useState(null);
  const [packingNotes, setPackingNotes] = useState('');
  const [submittingPack, setSubmittingPack] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const [laundryRes, historyRes] = await Promise.allSettled([
        laundryApi.getOrders(),
        ordersApi.getOrders()
      ]);

      const map = new Map();

      // 1. Process active laundry hub operations orders
      if (laundryRes.status === 'fulfilled' && laundryRes.value?.data) {
        const data = laundryRes.value.data;
        if (Array.isArray(data)) {
          data.forEach(item => { if (item?.id) map.set(item.id, item); });
        } else if (data.results && Array.isArray(data.results)) {
          data.results.forEach(item => { if (item?.id) map.set(item.id, item); });
        } else if (typeof data === 'object') {
          const stages = [
            ...(data.incoming || []),
            ...(data.received || []),
            ...(data.inspection || []),
            ...(data.washing || []),
            ...(data.drying || []),
            ...(data.ironing || []),
            ...(data.quality_check || []),
            ...(data.packing || []),
            ...(data.ready_for_delivery || []),
            ...(data.results || []),
            ...(data.all_orders || [])
          ];
          stages.forEach(item => { if (item?.id) map.set(item.id, item); });
        }
      }

      // 2. Process general/historical orders so Order History has full completed records
      if (historyRes.status === 'fulfilled' && historyRes.value?.data) {
        const histData = historyRes.value.data;
        const histList = Array.isArray(histData) ? histData : (histData.results || []);
        histList.forEach(item => {
          if (item?.id && !map.has(item.id)) {
            map.set(item.id, item);
          }
        });
      }

      setOrders(Array.from(map.values()));
    } catch (err) {
      console.error('Failed to load laundry hub orders:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to connect to laundry operations service. Please retry.');
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
    fetchOrders();
    fetchNotifications();
  }, []);

  const handleRefreshAll = async () => {
    await Promise.all([fetchOrders(), fetchNotifications()]);
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

  const handleConfirmReceipt = async (e) => {
    e.preventDefault();
    if (!receiptModalOrder) return;
    setSubmittingReceipt(true);
    try {
      const bCount = parseInt(receivedBags) || 1;
      const wKg = receivedWeight ? parseFloat(receivedWeight) : null;
      await laundryApi.confirmReceipt(receiptModalOrder.id, {
        received_bags_count: bCount,
        bags_count: bCount,
        received_weight_kg: wKg,
        weight_kg: wKg,
        discrepancy_found: hasDiscrepancy,
        has_discrepancy: hasDiscrepancy,
        discrepancy_details: discrepancyNotes,
        discrepancy_notes: discrepancyNotes
      });
      setReceiptModalOrder(null);
      setReceivedBags(1);
      setReceivedWeight('');
      setHasDiscrepancy(false);
      setDiscrepancyNotes('');
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.detail || err.response?.data?.error || 'Failed to confirm receipt');
    } finally {
      setSubmittingReceipt(false);
    }
  };

  const handleAdvanceStage = async (e) => {
    e.preventDefault();
    if (!advancingOrder) return;
    setSubmittingStage(true);
    try {
      await laundryApi.advanceStage(advancingOrder.id, {
        stage: targetStage,
        notes: stageNotes
      });
      setAdvancingOrder(null);
      setStageNotes('');
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.detail || err.response?.data?.error || 'Failed to advance stage');
    } finally {
      setSubmittingStage(false);
    }
  };

  const handleQualityCheck = async (e) => {
    e.preventDefault();
    if (!qcModalOrder) return;
    setSubmittingQc(true);
    try {
      await laundryApi.qualityCheck(qcModalOrder.id, {
        passed: qcPassed,
        notes: qcNotes,
        reprocess_stage: qcPassed ? null : reprocessStage
      });
      setQcModalOrder(null);
      setQCNotes('');
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.detail || err.response?.data?.error || 'Failed to submit quality check');
    } finally {
      setSubmittingQc(false);
    }
  };

  const handlePackOrder = async (e) => {
    e.preventDefault();
    if (!packingModalOrder) return;
    setSubmittingPack(true);
    try {
      await laundryApi.packOrder(packingModalOrder.id, {
        notes: packingNotes
      });
      setPackingModalOrder(null);
      setPackingNotes('');
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.detail || err.response?.data?.error || 'Failed to complete packaging');
    } finally {
      setSubmittingPack(false);
    }
  };

  // Filter queues based on real database status
  const incomingOrders = orders.filter(o => ['PICKED_UP', 'DROPPED_OFF_AT_LAUNDRY'].includes(o.status));
  const receivedOrders = orders.filter(o => ['RECEIVED_BY_LAUNDRY', 'RECEIVED_AT_LAUNDRY'].includes(o.status));
  const inspectionOrders = orders.filter(o => o.status === 'INSPECTION');
  const washingOrders = orders.filter(o => o.status === 'WASHING');
  const dryingOrders = orders.filter(o => o.status === 'DRYING');
  const ironingOrders = orders.filter(o => o.status === 'IRONING');
  const qcOrders = orders.filter(o => o.status === 'QUALITY_CHECK');
  const packingOrders = orders.filter(o => ['PACKING', 'PACKED'].includes(o.status));
  const readyOrders = orders.filter(o => ['READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 'DELIVERY_ASSIGNED'].includes(o.status));
  const historyOrders = orders.filter(o => ['DELIVERED', 'COMPLETED'].includes(o.status));
  
  const totalActiveHubOrders = incomingOrders.length + receivedOrders.length + inspectionOrders.length + 
    washingOrders.length + dryingOrders.length + ironingOrders.length + qcOrders.length + packingOrders.length + readyOrders.length;
  
  const unreadNotificationsCount = notifications.filter(n => !n.is_read).length;

  // Sidebar navigation menu items
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard size={18} />,
      count: totalActiveHubOrders > 0 ? totalActiveHubOrders : null,
      badgeColor: 'bg-teal-100 text-[#0D7A75] font-bold'
    },
    {
      id: 'incoming',
      label: 'Incoming Orders',
      icon: <Package size={18} />,
      count: incomingOrders.length,
      badgeColor: incomingOrders.length > 0 ? 'bg-amber-100 text-amber-800 font-bold' : 'bg-slate-100 text-slate-600'
    },
    {
      id: 'received',
      label: 'Received Clothes',
      icon: <CheckCircle2 size={18} />,
      count: receivedOrders.length,
      badgeColor: receivedOrders.length > 0 ? 'bg-blue-100 text-blue-800 font-bold' : 'bg-slate-100 text-slate-600'
    },
    {
      id: 'inspection',
      label: 'Clothes Inspection',
      icon: <Eye size={18} />,
      count: inspectionOrders.length,
      badgeColor: inspectionOrders.length > 0 ? 'bg-indigo-100 text-indigo-800 font-bold' : 'bg-slate-100 text-slate-600'
    },
    {
      id: 'washing',
      label: 'Washing Queue',
      icon: <Sparkles size={18} />,
      count: washingOrders.length,
      badgeColor: washingOrders.length > 0 ? 'bg-teal-100 text-[#0D7A75] font-bold' : 'bg-slate-100 text-slate-600'
    },
    {
      id: 'drying',
      label: 'Drying Queue',
      icon: <Layers size={18} />,
      count: dryingOrders.length,
      badgeColor: dryingOrders.length > 0 ? 'bg-amber-100 text-amber-800 font-bold' : 'bg-slate-100 text-slate-600'
    },
    {
      id: 'ironing',
      label: 'Ironing Queue',
      icon: <Flame size={18} />,
      count: ironingOrders.length,
      badgeColor: ironingOrders.length > 0 ? 'bg-orange-100 text-orange-800 font-bold' : 'bg-slate-100 text-slate-600'
    },
    {
      id: 'qc',
      label: 'Quality Check',
      icon: <ShieldCheck size={18} />,
      count: qcOrders.length,
      badgeColor: qcOrders.length > 0 ? 'bg-purple-100 text-purple-800 font-bold' : 'bg-slate-100 text-slate-600'
    },
    {
      id: 'packing',
      label: 'Packing Orders',
      icon: <Box size={18} />,
      count: packingOrders.length,
      badgeColor: packingOrders.length > 0 ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-slate-100 text-slate-600'
    },
    {
      id: 'ready',
      label: 'Ready for Delivery',
      icon: <Truck size={18} />,
      count: readyOrders.length,
      badgeColor: readyOrders.length > 0 ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-slate-100 text-slate-600'
    },
    {
      id: 'history',
      label: 'Order History',
      icon: <CheckCircle size={18} />,
      count: historyOrders.length,
      badgeColor: 'bg-slate-100 text-slate-600'
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <Bell size={18} />,
      count: unreadNotificationsCount > 0 ? unreadNotificationsCount : (notifications.length > 0 ? notifications.length : null),
      badgeColor: unreadNotificationsCount > 0 ? 'bg-rose-500 text-white font-bold' : 'bg-slate-100 text-slate-600'
    },
    {
      id: 'profile',
      label: 'My Profile',
      icon: <User size={18} />,
      count: null
    }
  ];

  return (
    <div className="laundry-portal-root">
      {/* Mobile Drawer Backdrop */}
      {mobileSidebarOpen && (
        <div 
          className="laundry-sidebar-backdrop"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Permanent Fixed Left Sidebar */}
      <aside className={`laundry-sidebar ${mobileSidebarOpen ? 'open' : ''}`}>
        {/* Sidebar Brand Header */}
        <div className="sidebar-brand-header">
          <div className="brand-badge-row">
            <span className="brand-logo-text">
              Laund<span className="brand-logo-accent">rix</span>
            </span>
            <span className="portal-sub-badge">Laundry Operations</span>
          </div>
          <button 
            className="mobile-close-btn"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Staff Profile Card */}
        <div className="sidebar-staff-card">
          <div className="staff-avatar-circle">
            {currentUser?.avatar || (currentUser?.full_name ? currentUser.full_name.charAt(0) : 'L')}
          </div>
          <div className="staff-card-info">
            <div className="staff-card-name" title={currentUser?.full_name || currentUser?.username}>
              {currentUser?.full_name || currentUser?.username || 'Laundry Staff'}
            </div>
            <div className="staff-card-status">
              <span className="status-indicator-dot" />
              <span>Plant Shift Active</span>
            </div>
          </div>
        </div>

        {/* Sidebar Nav Menu */}
        <nav className="sidebar-nav-menu">
          <div className="nav-section-title">Workflow Queues</div>
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
            <span className="nav-label">Main Site</span>
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
      <div className="laundry-main-wrapper">
        {/* Top Header Navbar */}
        <header className="laundry-topbar">
          <div className="topbar-left">
            <button 
              className="mobile-hamburger-btn"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu size={22} />
            </button>
            <div className="topbar-title-block">
              <div className="topbar-kicker">Central Laundry Operations Hub</div>
              <h1 className="topbar-heading">
                {menuItems.find(m => m.id === activeTab)?.label || 'Specialist Desk'}
              </h1>
            </div>
          </div>

          <div className="topbar-actions">
            <button 
              onClick={handleRefreshAll} 
              className="topbar-btn refresh-btn"
              disabled={loading}
              title="Refresh facility queues from backend"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh Hub</span>
            </button>

            <button 
              onClick={() => setActiveTab('notifications')}
              className={`topbar-icon-btn ${activeTab === 'notifications' ? 'active' : ''}`}
              title="Hub Notifications"
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
                {currentUser?.avatar || (currentUser?.full_name ? currentUser.full_name.charAt(0) : 'L')}
              </div>
              <span className="user-pill-name hidden md:inline">
                {currentUser?.full_name || currentUser?.username || 'Laundry Staff'}
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
                <p className="font-bold text-sm text-red-900">Laundry Hub API Error</p>
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

        {/* ========================================================
            PAGE 1: DASHBOARD
           ======================================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Top Welcome Banner */}
            <div className="dashboard-welcome-card">
              <div className="welcome-text">
                <div className="badge-pill mb-2 bg-white/20 text-white backdrop-blur-sm">
                  Central Processing Facility
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  Specialist Desk: {currentUser?.full_name || currentUser?.username || 'Anita Sharma'}
                </h2>
                <p className="text-xs text-white/80 mt-1">
                  Fabric inspection, washing queues, stain care, quality assurance & packaging
                </p>
              </div>
              <div className="welcome-actions flex items-center gap-2">
                <button 
                  onClick={() => setActiveTab('incoming')} 
                  className="btn bg-white text-[#0D7A75] hover:bg-slate-100 font-bold text-xs px-4 py-2 rounded-lg"
                >
                  Incoming Intake ({incomingOrders.length})
                </button>
                <button 
                  onClick={() => setActiveTab('washing')} 
                  className="btn bg-white/20 text-white hover:bg-white/30 text-xs px-4 py-2 rounded-lg"
                >
                  Washing Queue ({washingOrders.length})
                </button>
              </div>
            </div>

            {/* Workflow Stage Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div 
                className="stat-card cursor-pointer hover:shadow-md transition-all"
                onClick={() => setActiveTab('incoming')}
              >
                <div className="stat-icon bg-amber-50 text-amber-600">
                  <Package size={22} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">1. Incoming</span>
                  <span className="stat-value">{incomingOrders.length}</span>
                </div>
              </div>

              <div 
                className="stat-card cursor-pointer hover:shadow-md transition-all"
                onClick={() => setActiveTab('washing')}
              >
                <div className="stat-icon bg-teal-50 text-[#0D7A75]">
                  <Sparkles size={22} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">2. Washing</span>
                  <span className="stat-value">{washingOrders.length}</span>
                </div>
              </div>

              <div 
                className="stat-card cursor-pointer hover:shadow-md transition-all"
                onClick={() => setActiveTab('drying')}
              >
                <div className="stat-icon bg-blue-50 text-blue-600">
                  <Layers size={22} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">3. Drying</span>
                  <span className="stat-value">{dryingOrders.length}</span>
                </div>
              </div>

              <div 
                className="stat-card cursor-pointer hover:shadow-md transition-all"
                onClick={() => setActiveTab('ironing')}
              >
                <div className="stat-icon bg-orange-50 text-orange-600">
                  <Flame size={22} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">4. Ironing</span>
                  <span className="stat-value">{ironingOrders.length}</span>
                </div>
              </div>

              <div 
                className="stat-card cursor-pointer hover:shadow-md transition-all"
                onClick={() => setActiveTab('qc')}
              >
                <div className="stat-icon bg-purple-50 text-purple-600">
                  <ShieldCheck size={22} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">5. Quality Check</span>
                  <span className="stat-value">{qcOrders.length}</span>
                </div>
              </div>

              <div 
                className="stat-card cursor-pointer hover:shadow-md transition-all"
                onClick={() => setActiveTab('packing')}
              >
                <div className="stat-icon bg-emerald-50 text-emerald-600">
                  <Box size={22} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">6. Packing</span>
                  <span className="stat-value">{packingOrders.length}</span>
                </div>
              </div>

              <div 
                className="stat-card cursor-pointer hover:shadow-md transition-all"
                onClick={() => setActiveTab('ready')}
              >
                <div className="stat-icon bg-emerald-50 text-emerald-700">
                  <Truck size={22} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">7. Ready / Dispatched</span>
                  <span className="stat-value">{readyOrders.length}</span>
                </div>
              </div>

              <div 
                className="stat-card cursor-pointer hover:shadow-md transition-all"
                onClick={() => setActiveTab('history')}
              >
                <div className="stat-icon bg-slate-50 text-slate-600">
                  <CheckCircle size={22} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">Total Completed</span>
                  <span className="stat-value">{historyOrders.length}</span>
                </div>
              </div>
            </div>

            {/* Active Operations Queues Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Washing Queue Card */}
              <div className="content-card">
                <div className="flex items-center justify-between mb-4 pb-2 border-b">
                  <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-[#0D7A75]" />
                    <h3 className="font-bold text-navy text-sm">Active Washing Queue</h3>
                  </div>
                  <button 
                    onClick={() => setActiveTab('washing')}
                    className="text-xs text-[#0D7A75] font-bold hover:underline flex items-center gap-1"
                  >
                    <span>View All ({washingOrders.length})</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

                {washingOrders.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <CheckCircle2 size={36} className="text-emerald-500 mx-auto mb-2" />
                    <p className="text-xs font-semibold">Washing queue is clear</p>
                    <p className="text-[11px] text-muted">Receive incoming bags to queue for washing.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {washingOrders.map(order => (
                      <div key={order.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#0D7A75] text-xs">{order.order_number || order.order_id}</span>
                            <span className="text-xs font-semibold text-navy">{order.customer_name || order.pickup_full_name}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1">
                            {order.items?.map(i => `${i.service_name || i.item_name} ×${i.quantity}`).join(', ') || 'General Garments'}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setActiveTab('washing');
                            setAdvancingOrder(order);
                            setTargetStage('DRYING');
                          }}
                          className="btn btn-primary btn-sm text-xs px-2.5 py-1.5"
                        >
                          Move to Drying
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ready Orders Card */}
              <div className="content-card">
                <div className="flex items-center justify-between mb-4 pb-2 border-b">
                  <div className="flex items-center gap-2">
                    <Truck size={18} className="text-emerald-600" />
                    <h3 className="font-bold text-navy text-sm">Dispatched / Ready for Delivery</h3>
                  </div>
                  <button 
                    onClick={() => setActiveTab('ready')}
                    className="text-xs text-[#0D7A75] font-bold hover:underline flex items-center gap-1"
                  >
                    <span>View All ({readyOrders.length})</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

                {readyOrders.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Package size={36} className="text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold">No packed orders in transit</p>
                    <p className="text-[11px] text-muted">Completed packaging will show here for delivery dispatch.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {readyOrders.map(order => (
                      <div key={order.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-emerald-700 text-xs">{order.order_number || order.order_id}</span>
                            <span className="text-xs font-semibold text-navy">{order.customer_name || order.pickup_full_name}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1">
                            {order.delivery_address || order.pickup_address}
                          </div>
                        </div>
                        <span className="badge badge-success text-[10px]">
                          {order.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Plant Equipment & Status */}
            <div className="content-card">
              <h3 className="font-bold text-navy text-sm mb-3">Laundry Plant & Facility Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-slate-400 font-semibold mb-1">FACILITY DESK</div>
                  <div className="font-bold text-navy text-sm">Banaswadi Operations Hub</div>
                  <div className="text-slate-500 mt-0.5">Central Industrial Cleaning Facility</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-slate-400 font-semibold mb-1">HYGIENE & BOILER</div>
                  <div className="font-bold text-emerald-600 text-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Certified Steam Sanitizer (60°C)</span>
                  </div>
                  <div className="text-slate-500 mt-0.5">Eco-friendly solvent & pH balanced</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-slate-400 font-semibold mb-1">ACTIVE PROCESSING</div>
                  <div className="font-bold text-[#0D7A75] text-sm">
                    {totalActiveHubOrders} Batches in System
                  </div>
                  <div className="text-slate-500 mt-0.5">Real-time status synchronized</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            PAGE 2: INCOMING ORDERS
           ======================================================== */}
        {activeTab === 'incoming' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-navy">Incoming Clothes Handover from Delivery Staff</h2>
                <p className="text-xs text-muted">Verify count, inspect bags, and confirm laundry hub intake</p>
              </div>
              <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
                {incomingOrders.length} Pending Intake
              </span>
            </div>

            {loading ? (
              <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
                <RefreshCw size={32} className="animate-spin text-[#0D7A75] mx-auto mb-2" />
                <p className="text-xs text-muted">Loading incoming intake list...</p>
              </div>
            ) : error ? (
              <div className="text-center py-16 bg-white rounded-xl border border-red-200">
                <AlertCircle size={40} className="text-red-400 mx-auto mb-2" />
                <h3 className="font-bold text-navy">Unable to load incoming orders</h3>
                <p className="text-xs text-muted mb-3">{error}</p>
                <button onClick={handleRefreshAll} className="btn btn-primary btn-sm mx-auto flex items-center gap-1.5">
                  <RefreshCw size={14} />
                  <span>Retry</span>
                </button>
              </div>
            ) : incomingOrders.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
                <Package size={44} className="text-slate-300 mx-auto mb-2" />
                <h3 className="font-bold text-navy">No incoming drop-offs waiting</h3>
                <p className="text-xs text-muted">All collected bags have been received and verified.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {incomingOrders.map(order => (
                  <div key={order.id} className="order-item-card border-l-4 border-l-blue-600">
                    <div className="flex items-start justify-between border-b pb-3 mb-3">
                      <div>
                        <span className="font-mono font-bold text-[#0D7A75] text-base">{order.order_number || order.order_id}</span>
                        <div className="text-xs font-semibold text-navy mt-0.5">{order.customer_name || order.pickup_full_name}</div>
                      </div>
                      <span className="badge badge-warning">Awaiting Hub Receipt</span>
                    </div>

                    {order.pickup_record && (
                      <div className="p-2.5 bg-blue-50/70 rounded-lg text-xs text-slate-700 mb-4 space-y-1">
                        <div><strong>Delivery Pickup Bags:</strong> {order.pickup_record.bags_count || order.pickup_record.collected_bags_count} bags</div>
                        <div><strong>Pickup Weight:</strong> {(order.pickup_record.weight_kg || order.pickup_record.collected_weight_kg) ? `${order.pickup_record.weight_kg || order.pickup_record.collected_weight_kg} kg` : 'N/A'}</div>
                        {(order.pickup_record.notes || order.pickup_record.pickup_notes) && (
                          <div><strong>Pickup Notes:</strong> {order.pickup_record.notes || order.pickup_record.pickup_notes}</div>
                        )}
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setReceiptModalOrder(order);
                        setReceivedBags(order.pickup_record?.bags_count || order.pickup_record?.collected_bags_count || 1);
                        setReceivedWeight(order.pickup_record?.weight_kg || order.pickup_record?.collected_weight_kg || '');
                      }}
                      className="btn btn-primary btn-sm w-full flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={16} />
                      <span>Confirm Receipt & Verify Count</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            PAGE 3: RECEIVED CLOTHES
           ======================================================== */}
        {activeTab === 'received' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-navy">Verified Received Garments</h2>
                <p className="text-xs text-muted">Garments checked in and verified at central facility</p>
              </div>
              <span className="text-xs font-bold text-blue-800 bg-blue-100 px-3 py-1 rounded-full">
                {receivedOrders.length} Received
              </span>
            </div>

            {receivedOrders.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
                <CheckCircle2 size={44} className="text-slate-300 mx-auto mb-2" />
                <h3 className="font-bold text-navy">No received batches pending processing</h3>
                <p className="text-xs text-muted">Intake batches move directly into inspection or washing cycles.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {receivedOrders.map(order => (
                  <div key={order.id} className="order-item-card border-l-4 border-l-blue-500">
                    <div className="flex items-start justify-between border-b pb-3 mb-3">
                      <div>
                        <span className="font-mono font-bold text-navy text-base">{order.order_number || order.order_id}</span>
                        <div className="text-xs font-semibold text-navy mt-0.5">{order.customer_name || order.pickup_full_name}</div>
                      </div>
                      <span className="badge badge-info">Verified at Hub</span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1 mb-4">
                      <div><strong>Items:</strong> {order.items?.map(i => `${i.service_name || i.item_name} ×${i.quantity}`).join(', ') || 'General Garments'}</div>
                      <div><strong>Received Bags:</strong> {order.laundry_record?.received_bags || order.laundry_record?.received_bags_count || 1}</div>
                      {order.laundry_record?.has_discrepancy && (
                        <div className="text-amber-700 font-semibold">
                          Discrepancy Note: {order.laundry_record.discrepancy_notes || order.laundry_record.discrepancy_details}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setAdvancingOrder(order);
                          setTargetStage('INSPECTION');
                        }}
                        className="btn btn-outline-primary btn-sm flex-1 flex items-center justify-center gap-1"
                      >
                        <Eye size={14} />
                        <span>Inspect</span>
                      </button>
                      <button
                        onClick={() => {
                          setAdvancingOrder(order);
                          setTargetStage('WASHING');
                        }}
                        className="btn btn-primary btn-sm flex-1 flex items-center justify-center gap-1"
                      >
                        <Sparkles size={14} />
                        <span>Start Washing</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            PAGE 4: CLOTHES INSPECTION
           ======================================================== */}
        {activeTab === 'inspection' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-navy">Fabric Inspection & Stain Pre-Treatment</h2>
                <p className="text-xs text-muted">Color separation, fiber tags inspection, and stain spotting</p>
              </div>
              <span className="text-xs font-bold text-indigo-800 bg-indigo-100 px-3 py-1 rounded-full">
                {inspectionOrders.length} In Inspection
              </span>
            </div>

            {inspectionOrders.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
                <Eye size={44} className="text-slate-300 mx-auto mb-2" />
                <h3 className="font-bold text-navy">Inspection table is clear</h3>
                <p className="text-xs text-muted">All verified clothes have been inspected and sorted.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {inspectionOrders.map(order => (
                  <div key={order.id} className="order-item-card border-l-4 border-l-indigo-600">
                    <div className="flex items-start justify-between border-b pb-3 mb-3">
                      <div>
                        <span className="font-mono font-bold text-navy text-base">{order.order_number || order.order_id}</span>
                        <div className="text-xs font-semibold text-navy mt-0.5">{order.customer_name || order.pickup_full_name}</div>
                      </div>
                      <span className="badge badge-primary">Under Inspection</span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1 mb-4">
                      <div><strong>Garment Inventory:</strong> {order.items?.map(i => `${i.service_name || i.item_name} ×${i.quantity}`).join(', ') || 'General Garments'}</div>
                      {order.special_instructions && (
                        <div className="p-2 bg-blue-50/70 rounded text-[11px] text-blue-900">
                          <strong>Customer Note:</strong> {order.special_instructions}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setAdvancingOrder(order);
                        setTargetStage('WASHING');
                      }}
                      className="btn btn-primary btn-sm w-full flex items-center justify-center gap-1.5"
                    >
                      <Sparkles size={15} />
                      <span>Approve Inspection & Move to Washing</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            PAGE 5: WASHING QUEUE
           ======================================================== */}
        {activeTab === 'washing' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-navy">Washing Queue & Detergent Cycles</h2>
                <p className="text-xs text-muted">Intake verified — initiate eco-sanitized wash cycle</p>
              </div>
              <span className="text-xs font-bold text-[#0D7A75] bg-[#EBF8F7] px-3 py-1 rounded-full">
                {washingOrders.length} In Wash
              </span>
            </div>

            {washingOrders.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
                <Sparkles size={44} className="text-slate-300 mx-auto mb-2" />
                <h3 className="font-bold text-navy">Washing queue is clear</h3>
                <p className="text-xs text-muted">Receive incoming bags to queue for washing.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {washingOrders.map(order => (
                  <div key={order.id} className="order-item-card border-l-4 border-l-teal-600">
                    <div className="flex items-start justify-between border-b pb-3 mb-3">
                      <div>
                        <span className="font-mono font-bold text-[#0D7A75] text-base">{order.order_number || order.order_id}</span>
                        <div className="text-xs font-semibold text-navy mt-0.5">{order.customer_name || order.pickup_full_name}</div>
                      </div>
                      <span className="badge badge-primary">Washing in Progress</span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1 mb-4">
                      <div><strong>Items:</strong> {order.items?.map(i => `${i.service_name || i.item_name} ×${i.quantity}`).join(', ') || 'General Garments'}</div>
                      {order.special_instructions && <div><strong>Care Instructions:</strong> {order.special_instructions}</div>}
                    </div>

                    <button
                      onClick={() => {
                        setAdvancingOrder(order);
                        setTargetStage('DRYING');
                      }}
                      className="btn btn-primary btn-sm w-full flex items-center justify-center gap-1.5"
                    >
                      <span>Complete Wash & Move to Drying</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            PAGE 6: DRYING QUEUE
           ======================================================== */}
        {activeTab === 'drying' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-navy">Drying & Dehumidifying Queue</h2>
                <p className="text-xs text-muted">Temperature-controlled gentle tumbler and moisture air drying</p>
              </div>
              <span className="text-xs font-bold text-blue-800 bg-blue-100 px-3 py-1 rounded-full">
                {dryingOrders.length} In Tumbler
              </span>
            </div>

            {dryingOrders.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
                <Layers size={44} className="text-slate-300 mx-auto mb-2" />
                <h3 className="font-bold text-navy">No garments in drying cycle</h3>
                <p className="text-xs text-muted">Items will appear here once washed.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dryingOrders.map(order => (
                  <div key={order.id} className="order-item-card border-l-4 border-l-blue-500">
                    <div className="flex items-start justify-between border-b pb-3 mb-3">
                      <div>
                        <span className="font-mono font-bold text-navy text-base">{order.order_number || order.order_id}</span>
                        <div className="text-xs text-muted">{order.customer_name || order.pickup_full_name}</div>
                      </div>
                      <span className="badge badge-warning">Drying in Progress</span>
                    </div>

                    <button
                      onClick={() => {
                        setAdvancingOrder(order);
                        setTargetStage('IRONING');
                      }}
                      className="btn btn-primary btn-sm w-full flex items-center justify-center gap-1.5"
                    >
                      <span>Complete Drying & Move to Ironing</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            PAGE 7: IRONING QUEUE
           ======================================================== */}
        {activeTab === 'ironing' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-navy">Ironing & Steam Pressing Queue</h2>
                <p className="text-xs text-muted">Crease removal, steam sanitization, and fabric finishing</p>
              </div>
              <span className="text-xs font-bold text-orange-800 bg-orange-100 px-3 py-1 rounded-full">
                {ironingOrders.length} In Press
              </span>
            </div>

            {ironingOrders.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
                <Flame size={44} className="text-slate-300 mx-auto mb-2" />
                <h3 className="font-bold text-navy">No garments in ironing queue</h3>
                <p className="text-xs text-muted">Dry garments will queue here for steam press.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ironingOrders.map(order => (
                  <div key={order.id} className="order-item-card border-l-4 border-l-orange-500">
                    <div className="flex items-start justify-between border-b pb-3 mb-3">
                      <div>
                        <span className="font-mono font-bold text-navy text-base">{order.order_number || order.order_id}</span>
                        <div className="text-xs text-muted">{order.customer_name || order.pickup_full_name}</div>
                      </div>
                      <span className="badge badge-primary">Ironing / Steam Press</span>
                    </div>

                    <button
                      onClick={() => {
                        setAdvancingOrder(order);
                        setTargetStage('QUALITY_CHECK');
                      }}
                      className="btn btn-primary btn-sm w-full flex items-center justify-center gap-1.5"
                    >
                      <span>Complete Ironing & Send to Quality Audit</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            PAGE 8: QUALITY CHECK
           ======================================================== */}
        {activeTab === 'qc' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-navy">Quality Assurance & Hygiene Audit</h2>
                <p className="text-xs text-muted">Audit stain removal, cleanliness, and scent before bagging</p>
              </div>
              <span className="text-xs font-bold text-purple-800 bg-purple-100 px-3 py-1 rounded-full">
                {qcOrders.length} Pending Audit
              </span>
            </div>

            {qcOrders.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
                <ShieldCheck size={44} className="text-slate-300 mx-auto mb-2" />
                <h3 className="font-bold text-navy">No orders waiting for Quality Inspection</h3>
                <p className="text-xs text-muted">Finished ironed garments appear here for audit.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {qcOrders.map(order => (
                  <div key={order.id} className="order-item-card border-l-4 border-l-purple-600">
                    <div className="flex items-start justify-between border-b pb-3 mb-3">
                      <div>
                        <span className="font-mono font-bold text-navy text-base">{order.order_number || order.order_id}</span>
                        <div className="text-xs text-muted">{order.customer_name || order.pickup_full_name}</div>
                      </div>
                      <span className="badge badge-primary">Pending QC Approval</span>
                    </div>

                    <button
                      onClick={() => {
                        setQcModalOrder(order);
                        setQcPassed(true);
                        setQCNotes('Passed all cleanliness, hygiene & steam press checks.');
                      }}
                      className="btn btn-primary btn-sm w-full flex items-center justify-center gap-1.5"
                    >
                      <ShieldCheck size={16} />
                      <span>Perform Quality Inspection</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            PAGE 9: PACKING ORDERS
           ======================================================== */}
        {activeTab === 'packing' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-navy">Packaging & Seal Station</h2>
                <p className="text-xs text-muted">Fold, hanger, and seal in eco-friendly protective FabriCare bags</p>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                {packingOrders.length} To Pack
              </span>
            </div>

            {packingOrders.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
                <Box size={44} className="text-slate-300 mx-auto mb-2" />
                <h3 className="font-bold text-navy">No orders waiting for packaging</h3>
                <p className="text-xs text-muted">Approved orders from Quality Check queue here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {packingOrders.map(order => (
                  <div key={order.id} className="order-item-card border-l-4 border-l-emerald-600">
                    <div className="flex items-start justify-between border-b pb-3 mb-3">
                      <div>
                        <span className="font-mono font-bold text-navy text-base">{order.order_number || order.order_id}</span>
                        <div className="text-xs text-muted">{order.customer_name || order.pickup_full_name}</div>
                      </div>
                      <span className="badge badge-success">QC Approved</span>
                    </div>

                    <button
                      onClick={() => {
                        setPackingModalOrder(order);
                        setPackingNotes('Folded, sealed in FabriCare protective bag, ready for transit.');
                      }}
                      className="btn btn-success btn-sm w-full flex items-center justify-center gap-1.5"
                    >
                      <Package size={16} />
                      <span>Complete Packing & Mark Ready for Delivery</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            PAGE 10: READY FOR DELIVERY
           ======================================================== */}
        {activeTab === 'ready' && (
          <div className="content-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-navy">Orders Ready for Delivery / Dispatched</h2>
                <p className="text-xs text-muted">Sealed orders waiting for delivery driver pickup or out for delivery</p>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                {readyOrders.length} Ready
              </span>
            </div>

            {readyOrders.length === 0 ? (
              <div className="text-center py-16">
                <Truck size={44} className="text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-muted">No orders currently ready for delivery.</p>
              </div>
            ) : (
              <div className="orders-table-wrapper">
                <table className="portal-table">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Customer</th>
                      <th>Delivery Address</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {readyOrders.map(order => (
                      <tr key={order.id}>
                        <td className="font-mono font-bold text-[#0D7A75]">{order.order_number || order.order_id}</td>
                        <td>{order.customer_name || order.pickup_full_name}</td>
                        <td className="text-xs text-muted">{order.delivery_address || order.pickup_address}</td>
                        <td><span className="badge badge-success">{order.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            PAGE 11: ORDER HISTORY
           ======================================================== */}
        {activeTab === 'history' && (
          <div className="content-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-navy">Laundry Facility Order History</h2>
                <p className="text-xs text-muted">Historical record of all finished orders processed through the plant</p>
              </div>
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
                {historyOrders.length} Processed
              </span>
            </div>

            {historyOrders.length === 0 ? (
              <div className="text-center py-16">
                <CheckCircle size={44} className="text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-muted">No completed order records yet.</p>
              </div>
            ) : (
              <div className="orders-table-wrapper">
                <table className="portal-table">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Customer</th>
                      <th>Total Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyOrders.map(order => (
                      <tr key={order.id}>
                        <td className="font-mono font-bold text-[#0D7A75]">{order.order_number || order.order_id}</td>
                        <td>{order.customer_name || order.pickup_full_name}</td>
                        <td className="font-bold">₹{order.total_amount}</td>
                        <td><span className="badge badge-success">{order.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            PAGE 12: NOTIFICATIONS
           ======================================================== */}
        {activeTab === 'notifications' && (
          <div className="content-card">
            <div className="flex items-center justify-between mb-4 pb-2 border-b">
              <div>
                <h2 className="text-lg font-bold text-navy">Laundry Operations Notifications</h2>
                <p className="text-xs text-muted">System dispatch alerts and incoming delivery transfers</p>
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
                  You will receive real-time notifications when delivery agents hand over clothes or orders are updated.
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
            PAGE 13: MY PROFILE
           ======================================================== */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="content-card">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0D7A75] to-[#0E4B56] text-white flex items-center justify-center font-bold text-2xl shadow-lg">
                    {currentUser?.avatar || (currentUser?.full_name ? currentUser.full_name.charAt(0) : 'L')}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-navy">
                      {currentUser?.full_name || currentUser?.username || 'Anita Sharma'}
                    </h2>
                    <p className="text-xs text-muted mt-0.5">
                      Senior Fabric Care Specialist • ID #FC-LND-007
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="badge badge-success text-[10px]">Plant Shift Active</span>
                      <span className="badge badge-info text-[10px]">Desk: Banaswadi Hub</span>
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
                      <span>{currentUser?.email || 'anita.sharma@fabricare.com'}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-semibold mb-1">CONTACT PHONE</span>
                    <div className="font-bold text-navy flex items-center gap-2">
                      <Phone size={14} className="text-slate-400" />
                      <span>{currentUser?.phone || '+91 98765 43211'}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-semibold mb-1">FACILITY DESK</span>
                    <div className="font-bold text-navy flex items-center gap-2">
                      <MapPin size={14} className="text-slate-400" />
                      <span>Central Laundry Plant, Banaswadi, Bengaluru - 560043</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <span className="text-slate-400 block font-semibold mb-1">PLANT RESPONSIBILITIES</span>
                    <div className="p-3 bg-slate-50 rounded-xl border space-y-2">
                      <div className="flex justify-between">
                        <span>Active Orders in Hub:</span>
                        <strong className="text-[#0D7A75]">{totalActiveHubOrders} Batches</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Quality Pass Rate:</span>
                        <strong className="text-emerald-600">99.8%</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Department:</span>
                        <strong className="text-navy">Eco-Sanitization & Garment Finishing</strong>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-semibold mb-1">CERTIFICATIONS</span>
                    <div className="flex items-center gap-2 font-bold text-navy">
                      <Shield size={14} className="text-emerald-500" />
                      <span>Master Fabric Care & Industrial Steam Press Certified</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          MODALS PRESERVED
         ======================================================== */}

      {/* MODAL 1: CONFIRM RECEIPT */}
      {receiptModalOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
            <h3 className="text-lg font-bold text-navy mb-1">Verify Hub Intake for {receiptModalOrder.order_number || receiptModalOrder.order_id}</h3>
            <p className="text-xs text-muted mb-4">Independent recount and weighing by laundry facility staff</p>

            <form onSubmit={handleConfirmReceipt} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Verified Bags *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={receivedBags}
                    onChange={(e) => setReceivedBags(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Verified Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="3.5"
                    value={receivedWeight}
                    onChange={(e) => setReceivedWeight(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-navy cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasDiscrepancy}
                    onChange={(e) => setHasDiscrepancy(e.target.checked)}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <span>Discrepancy found (missing item, stain, count mismatch)</span>
                </label>
              </div>

              {hasDiscrepancy && (
                <div>
                  <label className="form-label text-amber-700">Discrepancy Notes *</label>
                  <textarea
                    rows={2}
                    required={hasDiscrepancy}
                    value={discrepancyNotes}
                    onChange={(e) => setDiscrepancyNotes(e.target.value)}
                    placeholder="E.g., 1 shirt has oil stain on collar, recorded prior to wash"
                    className="form-textarea border-amber-300"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReceiptModalOrder(null)}
                  className="btn btn-outline-secondary btn-sm"
                  disabled={submittingReceipt}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm flex items-center gap-2"
                  disabled={submittingReceipt}
                >
                  {submittingReceipt ? <RefreshCw size={14} className="animate-spin" /> : null}
                  <span>Save Intake Verification</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADVANCE STAGE */}
      {advancingOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
            <h3 className="text-lg font-bold text-navy mb-1">Advance Stage for {advancingOrder.order_number || advancingOrder.order_id}</h3>
            <p className="text-xs text-muted mb-4">Log transition to <strong>{targetStage}</strong></p>

            <form onSubmit={handleAdvanceStage} className="space-y-4">
              <div>
                <label className="form-label">Processing Notes</label>
                <textarea
                  rows={2}
                  value={stageNotes}
                  onChange={(e) => setStageNotes(e.target.value)}
                  placeholder={`Completed previous cycle, moved to ${targetStage}`}
                  className="form-textarea"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAdvancingOrder(null)}
                  className="btn btn-outline-secondary btn-sm"
                  disabled={submittingStage}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm flex items-center gap-2"
                  disabled={submittingStage}
                >
                  {submittingStage ? <RefreshCw size={14} className="animate-spin" /> : null}
                  <span>Confirm Stage Transition</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: QUALITY CHECK */}
      {qcModalOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
            <h3 className="text-lg font-bold text-navy mb-1">Quality Inspection for {qcModalOrder.order_number || qcModalOrder.order_id}</h3>
            <p className="text-xs text-muted mb-4">Authoritative audit before bagging & delivery</p>

            <form onSubmit={handleQualityCheck} className="space-y-4">
              <div className="flex items-center gap-4">
                <label className={`flex-1 p-3 rounded-xl border text-center font-bold text-sm cursor-pointer transition-all ${qcPassed ? 'bg-emerald-50 border-emerald-400 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                  <input
                    type="radio"
                    name="qcResult"
                    className="hidden"
                    checked={qcPassed}
                    onChange={() => setQcPassed(true)}
                  />
                  <span>✓ PASS (Approved)</span>
                </label>

                <label className={`flex-1 p-3 rounded-xl border text-center font-bold text-sm cursor-pointer transition-all ${!qcPassed ? 'bg-red-50 border-red-400 text-red-800' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                  <input
                    type="radio"
                    name="qcResult"
                    className="hidden"
                    checked={!qcPassed}
                    onChange={() => setQcPassed(false)}
                  />
                  <span>✗ FAIL (Reprocess)</span>
                </label>
              </div>

              {!qcPassed && (
                <div>
                  <label className="form-label text-red-700">Send Back for Reprocessing to:</label>
                  <select
                    value={reprocessStage}
                    onChange={(e) => setReprocessStage(e.target.value)}
                    className="form-select border-red-300"
                  >
                    <option value="WASHING">Washing (Re-wash for stains)</option>
                    <option value="DRYING">Drying (Moisture remaining)</option>
                    <option value="IRONING">Ironing (Re-press wrinkles)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="form-label">Audit Notes *</label>
                <textarea
                  rows={2}
                  required
                  value={qcNotes}
                  onChange={(e) => setQCNotes(e.target.value)}
                  placeholder="Notes on stain removal, fabric softness, press quality"
                  className="form-textarea"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setQcModalOrder(null)}
                  className="btn btn-outline-secondary btn-sm"
                  disabled={submittingQc}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`btn btn-sm flex items-center gap-2 ${qcPassed ? 'btn-primary' : 'btn-danger'}`}
                  disabled={submittingQc}
                >
                  {submittingQc ? <RefreshCw size={14} className="animate-spin" /> : null}
                  <span>{qcPassed ? 'Approve & Unlock Packing' : 'Submit Rejection & Route'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: PACKING */}
      {packingModalOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
            <h3 className="text-lg font-bold text-navy mb-1">Package Order {packingModalOrder.order_number || packingModalOrder.order_id}</h3>
            <p className="text-xs text-muted mb-4">Seal clean garments and mark ready for delivery driver pickup</p>

            <form onSubmit={handlePackOrder} className="space-y-4">
              <div>
                <label className="form-label">Packaging Notes</label>
                <textarea
                  rows={2}
                  value={packingNotes}
                  onChange={(e) => setPackingNotes(e.target.value)}
                  placeholder="Folded neatly, tagged and sealed in FabriCare moisture-resistant bag"
                  className="form-textarea"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPackingModalOrder(null)}
                  className="btn btn-outline-secondary btn-sm"
                  disabled={submittingPack}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-success btn-sm flex items-center gap-2"
                  disabled={submittingPack}
                >
                  {submittingPack ? <RefreshCw size={14} className="animate-spin" /> : null}
                  <span>Complete & Mark Ready for Delivery</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          SCOPED STYLES FOR LAUNDRY PORTAL SIDEBAR & LAYOUT
         ======================================================== */}
      <style>{`
        .laundry-portal-root {
          display: flex;
          min-height: 100vh;
          background: #F8FAFC;
          font-family: inherit;
        }

        /* FIXED LEFT SIDEBAR */
        .laundry-sidebar {
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

        /* STAFF PROFILE CARD */
        .sidebar-staff-card {
          padding: 14px 18px;
          margin: 12px 16px 4px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .staff-avatar-circle {
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

        .staff-card-info {
          overflow: hidden;
        }

        .staff-card-name {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #0F172A;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .staff-card-status {
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
          gap: 3px;
          padding: 10px 14px;
          flex: 1;
        }

        .nav-section-title {
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #94A3B8;
          padding: 6px 10px 3px;
        }

        .sidebar-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 11px;
          border: none;
          background: transparent;
          color: #475569;
          font-size: 0.85rem;
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

        /* MAIN RIGHT CONTENT WRAPPER */
        .laundry-main-wrapper {
          margin-left: 260px;
          flex: 1;
          padding: 24px 32px 48px;
          min-height: 100vh;
          max-width: 100%;
        }

        /* TOPBAR */
        .laundry-topbar {
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
          .laundry-sidebar {
            left: -280px;
            width: 270px;
            transition: left 0.28s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: none;
          }

          .laundry-sidebar.open {
            left: 0;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
          }

          .mobile-close-btn {
            display: block;
          }

          .laundry-main-wrapper {
            margin-left: 0;
            padding: 16px 18px 36px;
          }

          .mobile-hamburger-btn {
            display: block;
          }

          .laundry-sidebar-backdrop {
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

export default LaundryPortal;
