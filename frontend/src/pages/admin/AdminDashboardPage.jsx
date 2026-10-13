import React, { useState, useMemo, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { 
  Package, 
  Truck, 
  ShoppingBag, 
  CircleDollarSign,
  ArrowUp,
  Calendar, 
  ChevronRight, 
  ChevronDown,
  MoreHorizontal, 
  Plus, 
  UserPlus, 
  Tag, 
  Sparkles,
  Eye,
  Check,
  X
} from 'lucide-react';

// Washing Machine front-load icon matching reference image
const WasherIcon = ({ size = 23, color = "#D97706" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <rect x="3" y="2" width="18" height="20" rx="3" />
    <circle cx="12" cy="13" r="4.5" />
    <circle cx="12" cy="13" r="1.5" />
    <circle cx="12" cy="5.5" r="0.9" fill={color} />
  </svg>
);

export const AdminDashboardPage = () => {
  const { 
    orders, 
    updateOrderStatus,
    setAdminTab, 
    setIsCreateOrderDrawerOpen, 
    setIsAddCustomerModalOpen, 
    setIsManageServicesModalOpen 
  } = useAdmin();

  const [pickupTab, setPickupTab] = useState('all');
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  // Close action dropdown menu on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (activeActionMenuId && !e.target.closest('.action-menu-anchor')) {
        setActiveActionMenuId(null);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveActionMenuId(null);
        setSelectedOrderDetails(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeActionMenuId]);

  // Keep modal view in sync with live order changes
  useEffect(() => {
    if (selectedOrderDetails) {
      const current = orders?.find(o => o.id === selectedOrderDetails.id);
      if (current && current.status !== selectedOrderDetails.status) {
        setSelectedOrderDetails(prev => ({ ...prev, ...current }));
      }
    }
  }, [orders, selectedOrderDetails]);

  const barHeights = [6, 11, 16, 22];

  const stats = [
    { 
      label: "Today's orders", 
      value: "28", 
      change: "12%", 
      icon: <Package size={23} strokeWidth={2} />, 
      theme: "blue",
      barColors: ["#BCE0FD", "#78BCFB", "#389BF9", "#0284C7"]
    },
    { 
      label: "Need attention", 
      value: "12", 
      change: "2%", 
      icon: <Truck size={23} strokeWidth={2} />, 
      theme: "coral",
      barColors: ["#FFD0C4", "#FFAA95", "#FF8263", "#FA5A3A"]
    },
    { 
      label: "Currently processing", 
      value: "08", 
      change: "8%", 
      icon: <WasherIcon size={23} color="#D97706" />, 
      theme: "amber",
      barColors: ["#FDE68A", "#FCD34D", "#F59E0B", "#D97706"]
    },
    { 
      label: "Ready to go", 
      value: "06", 
      change: "20%", 
      icon: <ShoppingBag size={23} strokeWidth={2} />, 
      theme: "purple",
      barColors: ["#DDD6FE", "#C4B5FD", "#A78BFA", "#8B5CF6"]
    },
    { 
      label: "From completed orders", 
      value: "₹12,560", 
      change: "22%", 
      icon: <CircleDollarSign size={23} strokeWidth={2} />, 
      theme: "green",
      isRevenue: true,
      barColors: ["#A7F3D0", "#6EE7B7", "#34D399", "#10B981"]
    }
  ];

  const serviceBreakdown = [
    { name: 'Wash & Fold', pct: 38, color: '#0D7A75' },
    { name: 'Dry Cleaning', pct: 22, color: '#10B981' },
    { name: 'Wash & Iron', pct: 18, color: '#38BDF8' },
    { name: 'Steam Iron', pct: 10, color: '#818CF8' },
    { name: 'Shoe Laundry', pct: 8, color: '#F59E0B' },
    { name: 'Home Care', pct: 4, color: '#EF4444' }
  ];

  const [chartTimeframe, setChartTimeframe] = useState('7d');

  // Baseline data exactly matching Second Reference Image
  const baseChartDays7d = [
    { day: '17 Sep', comp: 10.0, inClean: 5.5, pend: 4.5 },
    { day: '18 Sep', comp: 13.5, inClean: 6.5, pend: 5.5 },
    { day: '19 Sep', comp: 10.0, inClean: 5.5, pend: 4.5 },
    { day: '20 Sep', comp: 15.5, inClean: 9.0, pend: 8.0 },
    { day: '21 Sep', comp: 13.0, inClean: 7.0, pend: 6.0 },
    { day: '22 Sep', comp: 12.0, inClean: 6.0, pend: 6.5 },
    { day: '23 Sep', comp: 0.0, inClean: 12.0, pend: 7.0 }
  ];

  const baseChartDays30d = [
    { day: 'Week 1', comp: 24, inClean: 12, pend: 8 },
    { day: 'Week 2', comp: 28, inClean: 14, pend: 10 },
    { day: 'Week 3', comp: 32, inClean: 16, pend: 12 },
    { day: 'Week 4', comp: 22, inClean: 14, pend: 8 }
  ];

  // Dynamically compute chart data while preserving exact Second Reference Image baseline
  const chartDays = useMemo(() => {
    const initialOrderIds = new Set([
      '#LDX10287', '#LDX10286', '#LDX1286', '#LDX1285', 
      '#LDX1284', '#LDX1283', '#LDX1282', '#LDX10281'
    ]);
    const dynamicOrders = (orders || []).filter(o => !initialOrderIds.has(o.id));

    if (chartTimeframe === '30d') {
      if (dynamicOrders.length === 0) {
        return baseChartDays30d;
      }
      return baseChartDays30d.map((wk, idx) => {
        if (idx === baseChartDays30d.length - 1) {
          const extraComp = dynamicOrders.filter(o => o.status === 'Completed' || o.status === 'Delivered').length;
          const extraClean = dynamicOrders.filter(o => o.status === 'In Cleaning' || o.status === 'Processing' || o.status === 'Ready for Delivery').length;
          const extraPend = dynamicOrders.filter(o => o.status === 'Pending Pickup' || o.status === 'Pending Review' || o.status === 'Pending').length;

          return {
            ...wk,
            comp: wk.comp + extraComp,
            inClean: wk.inClean + extraClean,
            pend: wk.pend + extraPend
          };
        }
        return wk;
      });
    }

    if (dynamicOrders.length === 0) {
      return baseChartDays7d;
    }

    return baseChartDays7d.map(item => {
      if (item.day === '23 Sep') {
        const extraComp = dynamicOrders.filter(o => o.status === 'Completed' || o.status === 'Delivered').length;
        const extraClean = dynamicOrders.filter(o => o.status === 'In Cleaning' || o.status === 'Processing' || o.status === 'Ready for Delivery').length;
        const extraPend = dynamicOrders.filter(o => o.status === 'Pending Pickup' || o.status === 'Pending Review' || o.status === 'Pending').length;

        return {
          day: item.day,
          comp: item.comp + extraComp,
          inClean: item.inClean + extraClean,
          pend: item.pend + extraPend
        };
      }
      return item;
    });
  }, [orders, chartTimeframe]);

  // Dynamic Y-axis scale: 0 to 40 for 7 Days, 0 to 80 for This Month
  const yAxisTicks = useMemo(() => {
    return chartTimeframe === '30d' 
      ? [80, 60, 40, 20, 0] 
      : [40, 30, 20, 10, 0];
  }, [chartTimeframe]);

  const scaleMax = chartTimeframe === '30d' ? 80 : 40;

  const getAvatarStyle = (avatar) => {
    switch (avatar) {
      case 'RM': return { background: '#E0F2FE', color: '#0284C7' }; // Soft Sky Blue
      case 'PS': return { background: '#EDE9FE', color: '#7C3AED' }; // Soft Lavender
      case 'AN': return { background: '#F3E8FF', color: '#9333EA' }; // Soft Violet
      case 'SR': return { background: '#CCFBF1', color: '#0D9488' }; // Soft Mint
      case 'KV': return { background: '#FEF08A', color: '#854D0E' }; // Soft Golden Yellow
      case 'NK': return { background: '#EDE9FE', color: '#7C3AED' }; // Soft Lavender
      default: {
        const palettes = [
          { background: '#E0F2FE', color: '#0284C7' },
          { background: '#EDE9FE', color: '#7C3AED' },
          { background: '#CCFBF1', color: '#0D9488' },
          { background: '#FEF08A', color: '#854D0E' },
          { background: '#DCFCE7', color: '#16A34A' }
        ];
        const hash = (avatar || 'CU').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        return palettes[hash % palettes.length];
      }
    }
  };

  const getStatusClass = (status = '') => {
    const s = String(status).toLowerCase();
    if (s.includes('pickup scheduled') || s.includes('scheduled')) return 'pickup-scheduled';
    if (s.includes('pending')) return 'pending-pickup';
    if (s.includes('cleaning') || s.includes('processing')) return 'in-cleaning';
    if (s.includes('ready')) return 'ready-for-delivery';
    if (s.includes('delivered') || s.includes('completed')) return 'delivered';
    return 'pickup-scheduled';
  };

  // Recent Orders dynamically bound to live orders in AdminContext
  const recentOrders = useMemo(() => {
    if (!orders || orders.length === 0) return [];

    const refOrderIds = [
      '#LDX10284',
      '#LDX10285',
      '#LDX10286',
      '#LDX10287',
      '#LDX10288',
      '#LDX10289'
    ];
    const refSet = new Set(refOrderIds);

    const dynamicNewOrders = orders.filter(o => 
      !refSet.has(o.id) && 
      !o.id.startsWith('#LDX12') && 
      o.id !== '#LDX10281'
    );

    const fallbackBaseOrders = [
      {
        id: '#LDX10284',
        customer: { name: 'Rohan Mehta', avatar: 'RM', phone: '+91 98765 43210', email: 'rohan.mehta@gmail.com', address: 'Banaswadi, Bengaluru - 560043' },
        services: ['Wash & Fold'],
        pickupTime: '23 Sep, 9:00 AM',
        amount: 320,
        status: 'Pickup Scheduled',
        payment: 'Paid',
        driver: 'Ravi Kumar (+91 98765 43210)'
      },
      {
        id: '#LDX10285',
        customer: { name: 'Priya Sharma', avatar: 'PS', phone: '+91 99876 54321', email: 'priya.sharma@gmail.com', address: 'House #45, 3rd Cross, HRBR Layout, Bengaluru - 560043' },
        services: ['Dry Cleaning'],
        pickupTime: '23 Sep, 10:00 AM',
        amount: 560,
        status: 'Pending Pickup',
        payment: 'Paid',
        driver: 'Not Assigned'
      },
      {
        id: '#LDX10286',
        customer: { name: 'Arjun Nair', avatar: 'AN', phone: '+91 91234 56789', email: 'arjun.nair@gmail.com', address: 'Indiranagar, Bengaluru - 560038' },
        services: ['Wash & Iron'],
        pickupTime: '23 Sep, 11:00 AM',
        amount: 420,
        status: 'In Cleaning',
        payment: 'COD',
        driver: 'Ravi Kumar (+91 98765 43210)'
      },
      {
        id: '#LDX10287',
        customer: { name: 'Sneha Reddy', avatar: 'SR', phone: '+91 99887 66554', email: 'sneha.reddy@gmail.com', address: 'Whitefield, Bengaluru - 560066' },
        services: ['Home Care'],
        pickupTime: '23 Sep, 2:00 PM',
        amount: 780,
        status: 'Ready for Delivery',
        payment: 'Paid',
        driver: 'Arjun Singh (+91 87654 32109)'
      },
      {
        id: '#LDX10288',
        customer: { name: 'Karan Verma', avatar: 'KV', phone: '+91 98712 34567', email: 'karan.verma@gmail.com', address: 'Marathahalli, Bengaluru - 560037' },
        services: ['Shoe Laundry'],
        pickupTime: '23 Sep, 3:00 PM',
        amount: 350,
        status: 'Delivered',
        payment: 'Paid',
        driver: 'Ravi Kumar (+91 98765 43210)'
      },
      {
        id: '#LDX10289',
        customer: { name: 'Neha Kapoor', avatar: 'NK', phone: '+91 87654 32109', email: 'neha.kapoor@gmail.com', address: 'HSR Layout, Bengaluru - 560102' },
        services: ['Steam Iron'],
        pickupTime: '23 Sep, 4:00 PM',
        amount: 280,
        status: 'In Cleaning',
        payment: 'Unpaid',
        driver: 'Arjun Singh (+91 87654 32109)'
      }
    ];

    const liveReferenceOrders = refOrderIds.map(id => {
      const live = orders.find(o => o.id === id);
      const fallback = fallbackBaseOrders.find(f => f.id === id);
      if (!live) return fallback;
      return {
        ...fallback,
        ...live,
        customer: {
          ...(fallback?.customer || {}),
          ...(live.customer || {})
        }
      };
    });

    return [...dynamicNewOrders, ...liveReferenceOrders].slice(0, 6);
  }, [orders]);

  const pickupDeliveries = [
    { timeStart: '09:00', timeEnd: '11:00 AM', id: '#LDX10284', name: 'Rohan Mehta', area: 'Banaswadi, Bengaluru', type: 'Pickup', status: 'Assigned' },
    { timeStart: '11:00', timeEnd: '01:00 PM', id: '#LDX10286', name: 'Arjun Nair', area: 'Indiranagar, Bengaluru', type: 'Delivery', status: 'Assigned' },
    { timeStart: '02:00', timeEnd: '04:00 PM', id: '#LDX10287', name: 'Sneha Reddy', area: 'Whitefield, Bengaluru', type: 'Pickup', status: 'Pending' },
    { timeStart: '03:00', timeEnd: '05:00 PM', id: '#LDX10288', name: 'Karan Verma', area: 'Marathahalli, Bengaluru', type: 'Delivery', status: 'Assigned' }
  ];

  const filteredPickups = pickupDeliveries.filter(p => {
    if (pickupTab === 'pickups') return p.type === 'Pickup';
    if (pickupTab === 'deliveries') return p.type === 'Delivery';
    return true;
  });

  return (
    <div className="admin-dashboard-page animate-fade-in">
      {/* Header Row */}
      <div className="dash-header-row">
        <div>
          <span className="dash-greeting-tag">GOOD MORNING, ADMIN</span>
          <h1 className="dash-title">
            Here's what's happening <span className="text-teal">today.</span>
          </h1>
          <p className="dash-sub">Here's your business overview for today.</p>
        </div>

        <div className="date-picker-dropdown">
          <Calendar size={16} className="text-teal" />
          <span>Tuesday, 23 Sep 2026</span>
        </div>
      </div>

      {/* 5 Stats Cards Grid - Exact match with reference image */}
      <div className="dash-stats-grid">
        {stats.map((st, i) => (
          <div key={i} className={`dash-stat-card ${st.theme}`}>
            <div className="stat-card-top">
              <div className="stat-icon-wrap">
                {st.icon}
              </div>
              <div className="stat-card-val-col">
                <div className={`stat-val ${st.isRevenue ? 'rev-val' : ''}`}>
                  {st.value}
                </div>
                <div className="stat-name">{st.label}</div>
              </div>
            </div>

            <div className="stat-card-bottom">
              <div className="stat-growth-tag">
                <ArrowUp size={13} strokeWidth={2.8} className="growth-arrow" />
                <span className="growth-val">{st.change}</span>
                <span className="growth-period">vs yesterday</span>
              </div>
              <div className="stat-sparkline-bars">
                {st.barColors.map((color, bIdx) => (
                  <span 
                    key={bIdx} 
                    style={{ 
                      height: `${barHeights[bIdx]}px`, 
                      backgroundColor: color 
                    }} 
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts 2-Column Row */}
      <div className="dash-charts-grid">
        {/* Left: Orders Overview Bar Chart matching Second Reference Image */}
        <div className="dash-card orders-overview-card">
          <div className="dash-card-header">
            <h3 className="dash-card-title">Orders Overview</h3>
            <div className="chart-dropdown-wrap">
              <select 
                className="card-dropdown-select"
                value={chartTimeframe}
                onChange={(e) => setChartTimeframe(e.target.value)}
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">This Month</option>
              </select>
              <ChevronDown size={14} className="dropdown-chevron-icon" />
            </div>
          </div>

          <div className="bar-chart-container">
            {/* Dynamic Y-Axis scale based on timeframe (0-40 for 7d, 0-80 for 30d) */}
            <div className="chart-y-axis">
              <span style={{ top: '0%' }}>{yAxisTicks[0]}</span>
              <span style={{ top: '25%' }}>{yAxisTicks[1]}</span>
              <span style={{ top: '50%' }}>{yAxisTicks[2]}</span>
              <span style={{ top: '75%' }}>{yAxisTicks[3]}</span>
              <span style={{ top: '100%' }}>{yAxisTicks[4]}</span>
            </div>

            {/* Canvas area with grid lines and continuous stacked bars */}
            <div className="chart-canvas-area">
              <div className="chart-grid-lines">
                <div className="chart-grid-line" style={{ top: '0%' }} />
                <div className="chart-grid-line" style={{ top: '25%' }} />
                <div className="chart-grid-line" style={{ top: '50%' }} />
                <div className="chart-grid-line" style={{ top: '75%' }} />
                <div className="chart-grid-line baseline" style={{ top: '100%' }} />
              </div>

              <div className="chart-bars-wrap">
                {chartDays.map((cd, idx) => {
                  const plotHeight = 200;
                  const pendPx = (cd.pend / scaleMax) * plotHeight;
                  const cleanPx = (cd.inClean / scaleMax) * plotHeight;
                  const compPx = (cd.comp / scaleMax) * plotHeight;
                  const barWidth = chartTimeframe === '30d' ? 44 : 36;

                  return (
                    <div key={idx} className="chart-bar-group">
                      <div className="stacked-bar" style={{ width: `${barWidth}px` }}>
                        {/* Top: Pending (Soft Peach) */}
                        {cd.pend > 0 && (
                          <div 
                            className="bar-segment pend" 
                            style={{ height: `${pendPx}px` }} 
                            title={`Pending: ${cd.pend}`} 
                          />
                        )}
                        {/* Middle: In Cleaning (Turquoise Cyan) */}
                        {cd.inClean > 0 && (
                          <div 
                            className="bar-segment clean" 
                            style={{ height: `${cleanPx}px` }} 
                            title={`In Cleaning: ${cd.inClean}`} 
                          />
                        )}
                        {/* Bottom: Completed (Dark Teal) */}
                        {cd.comp > 0 && (
                          <div 
                            className="bar-segment comp" 
                            style={{ height: `${compPx}px` }} 
                            title={`Completed: ${cd.comp}`} 
                          />
                        )}
                      </div>
                      <span className="chart-x-label">{cd.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Left-Aligned Legend matching Second Reference Image */}
          <div className="chart-legend-row">
            <div className="legend-item">
              <span className="legend-dot comp" />
              <span>Completed</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot clean" />
              <span>In Cleaning</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot pend" />
              <span>Pending</span>
            </div>
          </div>
        </div>

        {/* Right: Orders by Service Donut Chart */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h3 className="dash-card-title">Orders by Service</h3>
            <select className="card-dropdown-select">
              <option>This Week</option>
              <option>This Month</option>
            </select>
          </div>

          <div className="donut-chart-layout">
            <div className="donut-visual-wrap">
              <svg viewBox="0 0 100 100" className="donut-svg">
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#0D7A75" strokeWidth="12" strokeDasharray="38 62" strokeDashoffset="0" />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#10B981" strokeWidth="12" strokeDasharray="22 78" strokeDashoffset="-38" />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#38BDF8" strokeWidth="12" strokeDasharray="18 82" strokeDashoffset="-60" />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#818CF8" strokeWidth="12" strokeDasharray="10 90" strokeDashoffset="-78" />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#F59E0B" strokeWidth="12" strokeDasharray="8 92" strokeDashoffset="-88" />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#EF4444" strokeWidth="12" strokeDasharray="4 96" strokeDashoffset="-96" />
              </svg>
              <div className="donut-center-text">
                <span className="donut-total-num">128</span>
                <span className="donut-total-lbl">Total Orders</span>
              </div>
            </div>

            <div className="donut-legend-list">
              {serviceBreakdown.map((s, idx) => (
                <div key={idx} className="donut-legend-row">
                  <div className="legend-name-col">
                    <span className="legend-color-dot" style={{ backgroundColor: s.color }} />
                    <span className="legend-service-name">{s.name}</span>
                  </div>
                  <strong className="legend-pct-val">{s.pct}%</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Full-Width Recent Orders Section */}
      <div className="dash-card recent-orders-card">
        <div className="dash-card-header">
          <h3 className="dash-card-title">Recent Orders</h3>
          <button className="view-all-link" onClick={() => setAdminTab('orders')}>
            View All
          </button>
        </div>

        <div className="dash-table-wrapper">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Services</th>
                <th>Pickup Date & Time</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(ord => (
                <tr key={ord.id}>
                  <td><strong className="order-id-txt">{ord.id}</strong></td>
                  <td>
                    <div className="cust-cell">
                      <span 
                        className="cust-mini-avatar"
                        style={getAvatarStyle(ord.customer?.avatar)}
                      >
                        {ord.customer?.avatar || (ord.customer?.name ? ord.customer.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'CU')}
                      </span>
                      <span className="cust-name-txt">{ord.customer?.name}</span>
                    </div>
                  </td>
                  <td className="services-cell-txt">
                    {Array.isArray(ord.services) ? ord.services.join(', ') : (ord.services || 'Wash & Fold')}
                  </td>
                  <td className="pickup-date-cell-txt">{ord.pickupTime || ord.date}</td>
                  <td><strong className="amount-cell-txt">₹{ord.amount}</strong></td>
                  <td>
                    <span className={`status-pill ${getStatusClass(ord.status)}`}>
                      {ord.status}
                    </span>
                  </td>
                  <td className="action-cell">
                    <div className="action-menu-anchor">
                      <button 
                        className={`table-action-dots ${activeActionMenuId === ord.id ? 'active' : ''}`}
                        title="Order options"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveActionMenuId(activeActionMenuId === ord.id ? null : ord.id);
                        }}
                      >
                        <MoreHorizontal size={18} />
                      </button>

                      {activeActionMenuId === ord.id && (
                        <div className="action-dropdown-menu" onClick={e => e.stopPropagation()}>
                          <div className="dropdown-order-header">
                            <span>Order {ord.id}</span>
                            <span className={`status-mini-badge ${getStatusClass(ord.status)}`}>{ord.status}</span>
                          </div>
                          
                          <button 
                            className="dropdown-action-btn primary"
                            onClick={() => {
                              setSelectedOrderDetails(ord);
                              setActiveActionMenuId(null);
                            }}
                          >
                            <Eye size={15} />
                            <span>View Details</span>
                          </button>

                          <div className="dropdown-divider" />
                          <div className="dropdown-section-title">Change Status:</div>

                          <div className="dropdown-status-options">
                            {[
                              'Pickup Scheduled',
                              'Pending Pickup',
                              'In Cleaning',
                              'Ready for Delivery',
                              'Delivered'
                            ].map(st => (
                              <button
                                key={st}
                                className={`dropdown-status-btn ${ord.status === st ? 'current' : ''}`}
                                onClick={() => {
                                  updateOrderStatus(ord.id, st);
                                  setActiveActionMenuId(null);
                                }}
                              >
                                <span className={`status-indicator-dot ${getStatusClass(st)}`} />
                                <span>{st}</span>
                                {ord.status === st && <Check size={14} className="check-icon" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Directly below Recent Orders: 2-Column Operations Grid */}
      <div className="dash-operations-grid">
        {/* Left: Today's Pickup & Delivery matching Second Reference Image */}
        <div className="dash-card pickup-delivery-card">
          <div className="dash-card-header">
            <h3 className="dash-card-title">Today's Pickup & Delivery</h3>
            <button className="view-all-link" onClick={() => setAdminTab('pickup-delivery')}>
              View All →
            </button>
          </div>

          <div className="pickup-subtabs">
            <button 
              className={`subtab-btn ${pickupTab === 'all' ? 'active' : ''}`} 
              onClick={() => setPickupTab('all')}
            >
              All (18)
            </button>
            <button 
              className={`subtab-btn ${pickupTab === 'pickups' ? 'active' : ''}`} 
              onClick={() => setPickupTab('pickups')}
            >
              Pickups (10)
            </button>
            <button 
              className={`subtab-btn ${pickupTab === 'deliveries' ? 'active' : ''}`} 
              onClick={() => setPickupTab('deliveries')}
            >
              Deliveries (8)
            </button>
          </div>

          <div className="pickup-items-list">
            {filteredPickups.map((item, idx) => (
              <div 
                key={idx} 
                className="pickup-item-card" 
                onClick={() => setAdminTab('pickup-delivery')}
              >
                <div className="pickup-left-col">
                  <div className="pickup-time-box">
                    <span className="pickup-time-start">{item.timeStart}</span>
                    <span className="pickup-time-end">{item.timeEnd}</span>
                  </div>

                  <div className="pickup-truck-circle">
                    <Truck size={19} strokeWidth={2.2} />
                  </div>

                  <div className="pickup-info-col">
                    <strong className="pickup-item-id">{item.id}</strong>
                    <span className="pickup-item-name">{item.name}</span>
                    <span className="pickup-item-area">{item.area}</span>
                  </div>
                </div>

                <div className="pickup-right-col">
                  <span className={`pickup-type-pill ${item.type.toLowerCase()}`}>{item.type}</span>
                  <span className={`pickup-status-pill ${item.status.toLowerCase()}`}>{item.status}</span>
                  <ChevronRight size={17} className="pickup-arrow-icon" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Quick Actions matching Third Reference Image */}
        <div className="dash-card quick-actions-card">
          <h3 className="dash-card-title">Quick Actions</h3>

          <div className="quick-actions-list">
            <button 
              className="quick-action-btn-item" 
              onClick={() => setIsCreateOrderDrawerOpen(true)}
            >
              <div className="quick-action-icon-circle">
                <Plus size={24} color="#0D7A75" strokeWidth={2.4} />
              </div>
              <div className="quick-action-text-content">
                <strong className="quick-action-title">Create Order</strong>
                <span className="quick-action-desc">Add a walk-in or manual order</span>
              </div>
              <div className="quick-action-chevron-circle">
                <ChevronRight size={17} strokeWidth={2.2} />
              </div>
            </button>

            <button 
              className="quick-action-btn-item" 
              onClick={() => setIsAddCustomerModalOpen(true)}
            >
              <div className="quick-action-icon-circle">
                <UserPlus size={22} color="#0D7A75" strokeWidth={2.2} />
              </div>
              <div className="quick-action-text-content">
                <strong className="quick-action-title">Add Customer</strong>
                <span className="quick-action-desc">Create a new customer</span>
              </div>
              <div className="quick-action-chevron-circle">
                <ChevronRight size={17} strokeWidth={2.2} />
              </div>
            </button>

            <button 
              className="quick-action-btn-item" 
              onClick={() => setIsManageServicesModalOpen(true)}
            >
              <div className="quick-action-icon-circle">
                <Tag size={22} color="#0D7A75" strokeWidth={2.2} />
              </div>
              <div className="quick-action-text-content">
                <strong className="quick-action-title">Manage Services</strong>
                <span className="quick-action-desc">Update services & pricing</span>
              </div>
              <div className="quick-action-chevron-circle">
                <ChevronRight size={17} strokeWidth={2.2} />
              </div>
            </button>
          </div>

          <div className="quick-action-illustration-wrap">
            <img 
              src="/assets/folded-towels.png" 
              alt="Clean folded towels with mint leaves" 
              className="quick-action-towels-exact"
            />
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrderDetails && (
        <div className="modal-backdrop animate-fade-in" onClick={() => setSelectedOrderDetails(null)}>
          <div className="order-details-modal animate-scale-up" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-left">
                <h3 className="modal-title">Order Details</h3>
                <span className="modal-order-id">{selectedOrderDetails.id}</span>
                <span className={`status-pill ${getStatusClass(selectedOrderDetails.status)}`}>
                  {selectedOrderDetails.status}
                </span>
              </div>
              <button 
                className="modal-close-btn" 
                onClick={() => setSelectedOrderDetails(null)}
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {/* Customer Info Card */}
              <div className="modal-section-card">
                <h4 className="modal-section-title">Customer Information</h4>
                <div className="modal-customer-row">
                  <span 
                    className="cust-mini-avatar modal-avatar"
                    style={getAvatarStyle(selectedOrderDetails.customer?.avatar)}
                  >
                    {selectedOrderDetails.customer?.avatar || selectedOrderDetails.customer?.name?.[0] || 'C'}
                  </span>
                  <div className="modal-customer-info">
                    <strong className="modal-customer-name">{selectedOrderDetails.customer?.name}</strong>
                    <div className="modal-meta-row">
                      <span>{selectedOrderDetails.customer?.phone || '+91 98765 43210'}</span>
                      <span>•</span>
                      <span>{selectedOrderDetails.customer?.email || 'customer@gmail.com'}</span>
                    </div>
                    <p className="modal-customer-address">{selectedOrderDetails.customer?.address || 'Bengaluru, Karnataka'}</p>
                  </div>
                </div>
              </div>

              {/* Order Info Grid */}
              <div className="modal-details-grid">
                <div className="modal-grid-item">
                  <span className="grid-label">Services</span>
                  <span className="grid-value">
                    {Array.isArray(selectedOrderDetails.services) ? selectedOrderDetails.services.join(', ') : selectedOrderDetails.services}
                  </span>
                </div>
                <div className="modal-grid-item">
                  <span className="grid-label">Pickup Date & Time</span>
                  <span className="grid-value">{selectedOrderDetails.pickupTime || selectedOrderDetails.date || '23 Sep, 9:00 AM'}</span>
                </div>
                <div className="modal-grid-item">
                  <span className="grid-label">Amount</span>
                  <span className="grid-value highlight-amount">₹{selectedOrderDetails.amount}</span>
                </div>
                <div className="modal-grid-item">
                  <span className="grid-label">Payment Status</span>
                  <span className="grid-value">{selectedOrderDetails.payment || 'Paid'}</span>
                </div>
                <div className="modal-grid-item full-width">
                  <span className="grid-label">Assigned Driver</span>
                  <span className="grid-value">{selectedOrderDetails.driver || 'Ravi Kumar (+91 98765 43210)'}</span>
                </div>
              </div>

              {/* Quick Status Update inside modal */}
              <div className="modal-status-update-box">
                <label className="grid-label">Update Order Status:</label>
                <div className="modal-status-buttons">
                  {[
                    'Pickup Scheduled',
                    'Pending Pickup',
                    'In Cleaning',
                    'Ready for Delivery',
                    'Delivered'
                  ].map(st => (
                    <button
                      key={st}
                      className={`modal-status-btn ${selectedOrderDetails.status === st ? 'active' : ''}`}
                      onClick={() => {
                        updateOrderStatus(selectedOrderDetails.id, st);
                        setSelectedOrderDetails(prev => ({ ...prev, status: st }));
                      }}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-modal-close" 
                onClick={() => setSelectedOrderDetails(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .admin-dashboard-page {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .dash-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .dash-greeting-tag {
          font-size: 0.75rem;
          font-weight: 800;
          color: #0D7A75;
          letter-spacing: 0.08em;
        }

        .dash-title {
          font-size: 1.875rem;
          font-weight: 800;
          color: #1E293B;
          letter-spacing: -0.02em;
          margin: 4px 0 2px;
        }

        .dash-sub {
          font-size: 0.875rem;
          color: #64748B;
        }

        .date-picker-dropdown {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 10px 16px;
          font-size: 0.875rem;
          font-weight: 600;
          color: #1E293B;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }

        /* STATS GRID - Pixel perfect reproduction of reference image */
        .dash-stats-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 16px;
        }

        .dash-stat-card {
          border-radius: 20px;
          padding: 22px 20px 20px 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 144px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .dash-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.05);
        }

        /* Card Theming matching reference image */
        .dash-stat-card.blue {
          background: #F0F8FF;
          border: 1.5px solid #DCEAFD;
        }
        .dash-stat-card.blue .stat-icon-wrap {
          background: #D9EEFF;
          color: #0284C7;
        }

        .dash-stat-card.coral {
          background: #FFF5F2;
          border: 1.5px solid #FFDDD0;
        }
        .dash-stat-card.coral .stat-icon-wrap {
          background: #FFE5DC;
          color: #FA5A3A;
        }

        .dash-stat-card.amber {
          background: #FFFDF0;
          border: 1.5px solid #FEF08A;
        }
        .dash-stat-card.amber .stat-icon-wrap {
          background: #FEF0C7;
          color: #D97706;
        }

        .dash-stat-card.purple {
          background: #FAF5FF;
          border: 1.5px solid #EDE5FF;
        }
        .dash-stat-card.purple .stat-icon-wrap {
          background: #EFE6FE;
          color: #8B5CF6;
        }

        .dash-stat-card.green {
          background: #F0FDF5;
          border: 1.5px solid #D1FAE5;
        }
        .dash-stat-card.green .stat-icon-wrap {
          background: #D5F7E2;
          color: #10B981;
        }

        /* Top Row: Icon + Value & Label */
        .stat-card-top {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .stat-icon-wrap {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }

        .dash-stat-card:hover .stat-icon-wrap {
          transform: scale(1.04);
        }

        .stat-card-val-col {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .stat-val {
          font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 1.85rem;
          font-weight: 800;
          color: #0F172A;
          line-height: 1.1;
          letter-spacing: -0.02em;
        }

        .stat-val.rev-val {
          font-size: 1.65rem;
          letter-spacing: -0.01em;
        }

        .stat-name {
          font-size: 0.8125rem;
          color: #64748B;
          font-weight: 500;
          margin-top: 4px;
          line-height: 1.25;
        }

        /* Bottom Row: Growth Tag + Themed Sparkline Bars */
        .stat-card-bottom {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-top: 22px;
          padding-top: 0;
          border-top: none;
        }

        .stat-growth-tag {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 0.775rem;
          white-space: nowrap;
        }

        .growth-arrow {
          color: #10B981;
          flex-shrink: 0;
        }

        .growth-val {
          font-weight: 700;
          color: #10B981;
        }

        .growth-period {
          font-weight: 500;
          color: #64748B;
          margin-left: 2px;
        }

        .stat-sparkline-bars {
          display: flex;
          align-items: flex-end;
          gap: 3.5px;
          height: 22px;
          flex-shrink: 0;
        }

        .stat-sparkline-bars span {
          width: 3.5px;
          border-radius: 2px;
          display: inline-block;
          transition: height 0.2s ease;
        }

        /* CHARTS GRID */
        .dash-charts-grid {
          display: grid;
          grid-template-columns: 1.3fr 1fr;
          gap: 20px;
        }

        .dash-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
        }

        .dash-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .dash-card-title {
          font-size: 1.0625rem;
          font-weight: 800;
          color: #1E293B;
        }

        /* BAR CHART - Exact reproduction of Reference Image 1 */
        .orders-overview-card {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .chart-dropdown-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
        }

        .card-dropdown-select {
          padding: 7px 34px 7px 16px;
          border-radius: 20px;
          border: 1px solid #E2E8F0;
          font-family: inherit;
          font-size: 0.8125rem;
          font-weight: 500;
          background: #FFFFFF;
          color: #475569;
          cursor: pointer;
          appearance: none;
          outline: none;
          transition: border-color 0.15s ease;
        }

        .card-dropdown-select:hover,
        .card-dropdown-select:focus {
          border-color: #CBD5E1;
        }

        .dropdown-chevron-icon {
          position: absolute;
          right: 12px;
          color: #64748B;
          pointer-events: none;
        }

        .bar-chart-container {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-top: 20px;
          margin-bottom: 32px;
          position: relative;
        }

        .chart-y-axis {
          position: relative;
          width: 24px;
          height: 200px;
          flex-shrink: 0;
          font-family: inherit;
          font-size: 0.8125rem;
          font-weight: 500;
          color: #94A3B8;
          user-select: none;
        }

        .chart-y-axis span {
          position: absolute;
          right: 4px;
          transform: translateY(-50%);
          line-height: 1;
        }

        .chart-canvas-area {
          flex: 1;
          position: relative;
          height: 200px;
        }

        .chart-grid-lines {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 1;
        }

        .chart-grid-line {
          position: absolute;
          left: 0;
          right: 0;
          border-bottom: 1px dashed #E5EEF0;
        }

        .chart-grid-line.baseline {
          border-bottom: 1.5px solid #E2ECF0;
        }

        .chart-bars-wrap {
          position: absolute;
          inset: 0;
          display: flex;
          justify-content: space-around;
          align-items: flex-end;
          z-index: 2;
        }

        .chart-bar-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }

        .stacked-bar {
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          border-radius: 8px;
          overflow: hidden;
          max-height: 200px;
          transition: width 0.3s ease, transform 0.2s ease, filter 0.2s ease;
        }

        .chart-bar-group:hover .stacked-bar {
          transform: translateY(-3px);
          filter: brightness(1.05);
        }

        .bar-segment {
          width: 100%;
          transition: height 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Exact colors from Second Reference Image */
        .bar-segment.comp { 
          background: #0E7A86; /* Dark Teal */
        }
        
        .bar-segment.clean { 
          background: #36BAC6; /* Vibrant Turquoise / Cyan */
        }
        
        .bar-segment.pend { 
          background: #FFD5CD; /* Soft Peach / Apricot */
        }

        .chart-x-label {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-top: 12px;
          font-family: inherit;
          font-size: 0.8125rem;
          font-weight: 500;
          color: #7A919B;
          white-space: nowrap;
          user-select: none;
        }

        /* Legend matching Second Reference Image */
        .chart-legend-row {
          display: flex;
          align-items: center;
          gap: 32px;
          margin-top: 8px;
          padding-left: 36px;
          font-family: inherit;
          font-size: 0.875rem;
          color: #334155;
          font-weight: 500;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .legend-dot.comp { 
          background: #0E7A86; 
        }

        .legend-dot.clean { 
          background: #36BAC6; 
        }

        .legend-dot.pend { 
          background: #FFD5CD; 
        }

        /* DONUT CHART */
        .donut-chart-layout {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .donut-visual-wrap {
          position: relative;
          width: 140px;
          height: 140px;
          flex-shrink: 0;
        }

        .donut-svg {
          transform: rotate(-90deg);
          width: 100%;
          height: 100%;
        }

        .donut-center-text {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .donut-total-num {
          font-size: 1.25rem;
          font-weight: 800;
          color: #1E293B;
        }

        .donut-total-lbl {
          font-size: 0.6875rem;
          color: #94A3B8;
        }

        .donut-legend-list {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .donut-legend-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.8125rem;
        }

        .legend-name-col {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .legend-color-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .legend-pct-val {
          color: #1E293B;
        }

        /* RECENT ORDERS FULL-WIDTH CARD */
        .recent-orders-card {
          width: 100%;
        }

        /* OPERATIONS GRID: Today's Pickup & Delivery (Left) + Quick Actions (Right) */
        .dash-operations-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(360px, 1fr);
          gap: 24px;
          align-items: stretch;
        }

        .dash-table-wrapper {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .dash-table {
          width: 100%;
          border-collapse: collapse;
          font-family: inherit;
        }

        .dash-table th {
          text-align: left;
          padding: 14px 14px;
          color: #64748B;
          font-weight: 600;
          font-size: 0.8125rem;
          border-bottom: 1px solid #E2E8F0;
          user-select: none;
          white-space: nowrap;
        }

        .dash-table td {
          padding: 16px 14px;
          border-bottom: 1px solid #F1F5F9;
          vertical-align: middle;
          white-space: nowrap;
        }

        .dash-table tbody tr {
          transition: background-color 0.15s ease;
        }

        .dash-table tbody tr:hover {
          background-color: #F8FAFC;
        }

        .dash-table tbody tr:last-child td {
          border-bottom: none;
        }

        .order-id-txt {
          font-size: 0.875rem;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -0.01em;
          white-space: nowrap;
        }

        .cust-cell {
          display: flex;
          align-items: center;
          gap: 12px;
          white-space: nowrap;
        }

        .cust-mini-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        .cust-name-txt {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1E293B;
          white-space: nowrap;
        }

        .services-cell-txt {
          color: #64748B;
          font-size: 0.875rem;
          font-weight: 500;
          white-space: nowrap;
        }

        .pickup-date-cell-txt {
          color: #64748B;
          font-size: 0.875rem;
          font-weight: 500;
          white-space: nowrap;
        }

        .amount-cell-txt {
          font-size: 0.875rem;
          font-weight: 800;
          color: #0F172A;
          white-space: nowrap;
        }

        .status-pill {
          padding: 6px 16px;
          border-radius: 9999px;
          font-size: 0.8125rem;
          font-weight: 600;
          display: inline-block;
          white-space: nowrap;
          text-align: center;
          line-height: 1.25;
          letter-spacing: -0.01em;
        }

        .status-pill.pickup-scheduled { 
          background: #E0F2FE; 
          color: #0284C7; 
        }
        
        .status-pill.pending-pickup { 
          background: #FFE4E6; 
          color: #E11D48; 
        }
        
        .status-pill.in-cleaning { 
          background: #FEF9C3; 
          color: #CA8A04; 
        }
        
        .status-pill.ready-for-delivery { 
          background: #F3E8FF; 
          color: #9333EA; 
        }
        
        .status-pill.delivered, 
        .status-pill.completed { 
          background: #DCFCE7; 
          color: #16A34A; 
        }

        .action-cell {
          text-align: right;
          position: relative;
        }

        .action-menu-anchor {
          position: relative;
          display: inline-block;
        }

        .table-action-dots {
          background: transparent;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          padding: 6px 8px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }

        .table-action-dots:hover,
        .table-action-dots.active {
          color: #0F172A;
          background: #F1F5F9;
        }

        /* Dropdown Action Menu */
        .action-dropdown-menu {
          position: absolute;
          top: calc(100% + 4px);
          right: 0;
          z-index: 50;
          width: 210px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          animation: dropdownPop 0.15s ease-out;
        }

        @keyframes dropdownPop {
          from {
            opacity: 0;
            transform: translateY(-6px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .dropdown-order-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 8px 8px 8px;
          border-bottom: 1px solid #F1F5F9;
          margin-bottom: 4px;
        }

        .dropdown-order-header span:first-child {
          font-size: 0.75rem;
          font-weight: 700;
          color: #0F172A;
        }

        .status-mini-badge {
          font-size: 0.65rem;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 9999px;
        }

        .status-mini-badge.pickup-scheduled { background: #E0F2FE; color: #0284C7; }
        .status-mini-badge.pending-pickup { background: #FFE4E6; color: #E11D48; }
        .status-mini-badge.in-cleaning { background: #FEF9C3; color: #CA8A04; }
        .status-mini-badge.ready-for-delivery { background: #F3E8FF; color: #9333EA; }
        .status-mini-badge.delivered { background: #DCFCE7; color: #16A34A; }

        .dropdown-action-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 8px 10px;
          border: none;
          background: transparent;
          border-radius: 8px;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #1E293B;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s ease;
        }

        .dropdown-action-btn:hover {
          background: #F0FDF4;
          color: #0D7A75;
        }

        .dropdown-divider {
          height: 1px;
          background: #F1F5F9;
          margin: 4px 0;
        }

        .dropdown-section-title {
          font-size: 0.6875rem;
          font-weight: 700;
          color: #94A3B8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 4px 8px 2px;
          text-align: left;
        }

        .dropdown-status-options {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .dropdown-status-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 6px 8px;
          border: none;
          background: transparent;
          border-radius: 6px;
          font-size: 0.775rem;
          font-weight: 500;
          color: #475569;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s ease;
        }

        .dropdown-status-btn:hover {
          background: #F8FAFC;
          color: #0F172A;
        }

        .dropdown-status-btn.current {
          background: #F1F5F9;
          font-weight: 600;
          color: #0F172A;
        }

        .status-indicator-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .status-indicator-dot.pickup-scheduled { background: #0284C7; }
        .status-indicator-dot.pending-pickup { background: #E11D48; }
        .status-indicator-dot.in-cleaning { background: #CA8A04; }
        .status-indicator-dot.ready-for-delivery { background: #9333EA; }
        .status-indicator-dot.delivered { background: #16A34A; }

        .check-icon {
          margin-left: auto;
          color: #0D7A75;
        }

        /* Order Details Modal */
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(4px);
          z-index: 999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .order-details-modal {
          background: #FFFFFF;
          border-radius: 20px;
          width: 100%;
          max-width: 540px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          animation: modalSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid #E2E8F0;
        }

        .modal-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .modal-title {
          font-size: 1.125rem;
          font-weight: 800;
          color: #0F172A;
          margin: 0;
        }

        .modal-order-id {
          font-size: 0.875rem;
          font-weight: 700;
          color: #64748B;
        }

        .modal-close-btn {
          background: transparent;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          padding: 4px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }

        .modal-close-btn:hover {
          background: #F1F5F9;
          color: #0F172A;
        }

        .modal-body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          max-height: calc(85vh - 120px);
          overflow-y: auto;
        }

        .modal-section-card {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          padding: 16px;
        }

        .modal-section-title {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748B;
          margin: 0 0 12px 0;
        }

        .modal-customer-row {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }

        .modal-avatar {
          width: 44px;
          height: 44px;
          font-size: 1rem;
        }

        .modal-customer-info {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .modal-customer-name {
          font-size: 1rem;
          color: #0F172A;
        }

        .modal-meta-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8125rem;
          color: #64748B;
        }

        .modal-customer-address {
          font-size: 0.8125rem;
          color: #64748B;
          margin: 4px 0 0;
        }

        .modal-details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .modal-grid-item {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .modal-grid-item.full-width {
          grid-column: span 2;
        }

        .grid-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748B;
        }

        .grid-value {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1E293B;
        }

        .highlight-amount {
          font-size: 1.125rem;
          font-weight: 800;
          color: #0F172A;
        }

        .modal-status-update-box {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .modal-status-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .modal-status-btn {
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 0.775rem;
          font-weight: 600;
          border: 1px solid #E2E8F0;
          background: #FFFFFF;
          color: #475569;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .modal-status-btn:hover {
          border-color: #0D7A75;
          color: #0D7A75;
        }

        .modal-status-btn.active {
          background: #0D7A75;
          border-color: #0D7A75;
          color: #FFFFFF;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          padding: 16px 24px;
          border-top: 1px solid #E2E8F0;
          background: #F8FAFC;
        }

        .btn-modal-close {
          padding: 8px 20px;
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-modal-close:hover {
          background: #F1F5F9;
          color: #0F172A;
        }

        .view-all-link {
          background: none;
          border: none;
          color: #0D7A75;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: color 0.15s ease;
        }

        .view-all-link:hover {
          color: #0A5E5A;
          text-decoration: underline;
        }

        /* PICKUP & DELIVERY CARD - Matching Second Reference Image */
        .pickup-delivery-card {
          display: flex;
          flex-direction: column;
        }

        .pickup-subtabs {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .subtab-btn {
          background: #F1F5F9;
          border: none;
          border-radius: 10px;
          padding: 8px 18px;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .subtab-btn:hover {
          background: #E2E8F0;
          color: #0F172A;
        }

        .subtab-btn.active {
          background: #0D7A75;
          color: #FFFFFF;
          font-weight: 700;
        }

        .pickup-items-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .pickup-item-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 14px 20px;
          background: #FFFFFF;
          border: 1.5px solid #EBF2F7;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .pickup-item-card:hover {
          border-color: #BCEAE6;
          background: #F8FAFC;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
        }

        .pickup-left-col {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
        }

        .pickup-time-box {
          display: flex;
          flex-direction: column;
          min-width: 70px;
          flex-shrink: 0;
        }

        .pickup-time-start {
          font-size: 0.875rem;
          font-weight: 700;
          color: #0F172A;
          line-height: 1.25;
        }

        .pickup-time-end {
          font-size: 0.775rem;
          font-weight: 600;
          color: #64748B;
          line-height: 1.25;
        }

        .pickup-truck-circle {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: #E0F7FA;
          color: #0E7490;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .pickup-info-col {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .pickup-item-id {
          font-size: 0.875rem;
          font-weight: 800;
          color: #0F172A;
          line-height: 1.2;
        }

        .pickup-item-name {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #334155;
          line-height: 1.2;
        }

        .pickup-item-area {
          font-size: 0.75rem;
          color: #94A3B8;
          line-height: 1.2;
        }

        .pickup-right-col {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }

        .pickup-type-pill {
          padding: 4px 14px;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .pickup-type-pill.pickup {
          background: #E0F2FE;
          color: #0284C7;
        }

        .pickup-type-pill.delivery {
          background: #F3E8FF;
          color: #9333EA;
        }

        .pickup-status-pill {
          padding: 4px 14px;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .pickup-status-pill.assigned {
          background: #DCFCE7;
          color: #16A34A;
        }

        .pickup-status-pill.pending {
          background: #FEF3C7;
          color: #D97706;
        }

        .pickup-arrow-icon {
          color: #94A3B8;
          flex-shrink: 0;
        }

        /* QUICK ACTIONS CARD - Matching Third Reference Image */
        .quick-actions-card {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .quick-actions-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .quick-action-btn-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          background: #FFFFFF;
          border: 1.5px solid #EBF2F7;
          border-radius: 18px;
          padding: 14px 18px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s ease;
          width: 100%;
        }

        .quick-action-btn-item:hover {
          border-color: #0D7A75;
          transform: translateY(-2px);
          box-shadow: 0 4px 14px rgba(13, 122, 117, 0.08);
        }

        .quick-action-icon-circle {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: #E0F7F6;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }

        .quick-action-btn-item:hover .quick-action-icon-circle {
          transform: scale(1.05);
        }

        .quick-action-text-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .quick-action-title {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #0F172A;
          line-height: 1.25;
        }

        .quick-action-desc {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #64748B;
          margin-top: 3px;
          line-height: 1.2;
        }

        .quick-action-chevron-circle {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1.5px solid #CBD5E1;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #94A3B8;
          transition: all 0.2s ease;
        }

        .quick-action-btn-item:hover .quick-action-chevron-circle {
          border-color: #0D7A75;
          background: #E0F7F6;
          color: #0D7A75;
        }

        .quick-action-illustration-wrap {
          display: flex;
          justify-content: center;
          align-items: flex-end;
          margin-top: auto;
          padding-top: 16px;
        }

        .quick-action-towels-exact {
          max-width: 310px;
          width: 100%;
          height: auto;
          object-fit: contain;
          filter: drop-shadow(0 4px 14px rgba(0,0,0,0.05));
        }

        @media (max-width: 1350px) {
          .dash-stats-grid {
            grid-template-columns: repeat(3, 1fr);
          }
          .dash-charts-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 1100px) {
          .dash-operations-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 860px) {
          .dash-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 580px) {
          .dash-stats-grid {
            grid-template-columns: 1fr;
          }
          .dash-header-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
        }
      `}</style>
    </div>
  );
};
