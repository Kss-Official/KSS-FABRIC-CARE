import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { 
  Package, 
  Truck, 
  ShoppingBag, 
  CircleDollarSign,
  ArrowUp,
  Calendar, 
  ChevronRight, 
  MoreHorizontal, 
  Plus, 
  UserPlus, 
  Tag, 
  Sparkles
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
    setAdminTab, 
    setIsCreateOrderDrawerOpen, 
    setIsAddCustomerModalOpen, 
    setIsManageServicesModalOpen 
  } = useAdmin();

  const [pickupTab, setPickupTab] = useState('all');

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

  const chartDays = [
    { day: '17 Sep', comp: 14, inClean: 8, pend: 6 },
    { day: '18 Sep', comp: 18, inClean: 7, pend: 5 },
    { day: '19 Sep', comp: 12, inClean: 6, pend: 4 },
    { day: '20 Sep', comp: 24, inClean: 9, pend: 7 },
    { day: '21 Sep', comp: 19, inClean: 8, pend: 6 },
    { day: '22 Sep', comp: 16, inClean: 7, pend: 5 },
    { day: '23 Sep', comp: 10, inClean: 6, pend: 4 }
  ];

  const recentOrders = orders.slice(0, 6);

  const pickupDeliveries = [
    { time: '09:00 - 11:00 AM', id: '#LDX10284', name: 'Rohan Mehta', area: 'Banaswadi, Bengaluru', type: 'Pickup', status: 'Assigned' },
    { time: '11:00 - 01:00 PM', id: '#LDX10285', name: 'Arjun Nair', area: 'Indiranagar, Bengaluru', type: 'Delivery', status: 'Assigned' },
    { time: '02:00 - 04:00 PM', id: '#LDX10287', name: 'Sneha Reddy', area: 'Whitefield, Bengaluru', type: 'Pickup', status: 'Pending' },
    { time: '03:00 - 05:00 PM', id: '#LDX10288', name: 'Karan Verma', area: 'Marathahalli, Bengaluru', type: 'Delivery', status: 'Assigned' }
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
        {/* Left: Orders Overview Bar Chart */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h3 className="dash-card-title">Orders Overview</h3>
            <select className="card-dropdown-select">
              <option>Last 7 Days</option>
              <option>This Month</option>
            </select>
          </div>

          <div className="bar-chart-container">
            <div className="chart-y-axis">
              <span>40</span>
              <span>30</span>
              <span>20</span>
              <span>10</span>
              <span>0</span>
            </div>

            <div className="chart-bars-wrap">
              {chartDays.map((cd, idx) => (
                <div key={idx} className="chart-bar-group">
                  <div className="stacked-bar">
                    <div className="bar-segment pend" style={{ height: `${cd.pend * 2}px` }} title={`Pending: ${cd.pend}`} />
                    <div className="bar-segment clean" style={{ height: `${cd.inClean * 2}px` }} title={`In Cleaning: ${cd.inClean}`} />
                    <div className="bar-segment comp" style={{ height: `${cd.comp * 2}px` }} title={`Completed: ${cd.comp}`} />
                  </div>
                  <span className="chart-x-label">{cd.day}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-legend-row">
            <div className="legend-item"><span className="legend-dot comp" /> Completed</div>
            <div className="legend-item"><span className="legend-dot clean" /> In Cleaning</div>
            <div className="legend-item"><span className="legend-dot pend" /> Pending</div>
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

      {/* Tables & Action Row */}
      <div className="dash-bottom-grid">
        {/* Recent Orders Table */}
        <div className="dash-card">
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
                    <td><strong>{ord.id}</strong></td>
                    <td>
                      <div className="cust-cell">
                        <span className="cust-mini-avatar">{ord.customer.avatar}</span>
                        <span>{ord.customer.name}</span>
                      </div>
                    </td>
                    <td><span className="service-tag-pill">{ord.services[0]}</span></td>
                    <td className="text-muted">{ord.pickupTime}</td>
                    <td><strong>₹{ord.amount}</strong></td>
                    <td>
                      <span className={`status-pill ${ord.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {ord.status}
                      </span>
                    </td>
                    <td>
                      <button className="table-action-dots"><MoreHorizontal size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2-Column Sub: Today's Pickup & Quick Actions */}
        <div className="dash-side-col">
          {/* Today's Pickup & Delivery */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h3 className="dash-card-title">Today's Pickup & Delivery</h3>
              <button className="view-all-link" onClick={() => setAdminTab('pickup-delivery')}>
                View All →
              </button>
            </div>

            <div className="pickup-subtabs">
              <button className={`subtab-btn ${pickupTab === 'all' ? 'active' : ''}`} onClick={() => setPickupTab('all')}>
                All (18)
              </button>
              <button className={`subtab-btn ${pickupTab === 'pickups' ? 'active' : ''}`} onClick={() => setPickupTab('pickups')}>
                Pickups (10)
              </button>
              <button className={`subtab-btn ${pickupTab === 'deliveries' ? 'active' : ''}`} onClick={() => setPickupTab('deliveries')}>
                Deliveries (8)
              </button>
            </div>

            <div className="pickup-mini-list">
              {filteredPickups.map((item, idx) => (
                <div key={idx} className="pickup-mini-card" onClick={() => setAdminTab('pickup-delivery')}>
                  <div className="mini-card-time">{item.time}</div>
                  <div className="mini-card-truck"><Truck size={18} /></div>
                  <div className="mini-card-info">
                    <strong>{item.id}</strong>
                    <span className="mini-cust-name">{item.name}</span>
                    <span className="mini-cust-loc">{item.area}</span>
                  </div>
                  <div className="mini-card-tags">
                    <span className={`type-tag ${item.type.toLowerCase()}`}>{item.type}</span>
                    <span className={`status-mini-tag ${item.status.toLowerCase()}`}>{item.status}</span>
                  </div>
                  <ChevronRight size={16} className="mini-arrow" />
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="dash-card quick-actions-card">
            <h3 className="dash-card-title">Quick Actions</h3>

            <div className="quick-actions-list">
              <button className="quick-action-item" onClick={() => setIsCreateOrderDrawerOpen(true)}>
                <div className="quick-act-icon teal"><Plus size={18} /></div>
                <div className="quick-act-text">
                  <strong>Create Order</strong>
                  <span>Add a walk-in or manual order</span>
                </div>
                <ChevronRight size={16} className="act-arrow" />
              </button>

              <button className="quick-action-item" onClick={() => setIsAddCustomerModalOpen(true)}>
                <div className="quick-act-icon green"><UserPlus size={18} /></div>
                <div className="quick-act-text">
                  <strong>Add Customer</strong>
                  <span>Create a new customer</span>
                </div>
                <ChevronRight size={16} className="act-arrow" />
              </button>

              <button className="quick-action-item" onClick={() => setIsManageServicesModalOpen(true)}>
                <div className="quick-act-icon cyan"><Tag size={18} /></div>
                <div className="quick-act-text">
                  <strong>Manage Services</strong>
                  <span>Update services & pricing</span>
                </div>
                <ChevronRight size={16} className="act-arrow" />
              </button>
            </div>

            <div className="quick-action-towels-thumb">
              <img src="/assets/folded-towels.jpg" alt="Towels" />
            </div>
          </div>
        </div>
      </div>

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

        .card-dropdown-select {
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid #E2E8F0;
          font-size: 0.8125rem;
          background: #FFFFFF;
          color: #475569;
        }

        /* BAR CHART */
        .bar-chart-container {
          display: flex;
          gap: 16px;
          height: 180px;
          align-items: flex-end;
        }

        .chart-y-axis {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 100%;
          font-size: 0.6875rem;
          color: #94A3B8;
        }

        .chart-bars-wrap {
          flex: 1;
          display: flex;
          justify-content: space-around;
          align-items: flex-end;
          height: 100%;
          border-bottom: 1px dashed #E2E8F0;
        }

        .chart-bar-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .stacked-bar {
          width: 24px;
          display: flex;
          flex-direction: column-reverse;
          gap: 2px;
        }

        .bar-segment {
          width: 100%;
          border-radius: 3px;
        }

        .bar-segment.comp { background: #0D7A75; }
        .bar-segment.clean { background: #0284C7; }
        .bar-segment.pend { background: #FCA5A5; }

        .chart-x-label {
          font-size: 0.6875rem;
          color: #64748B;
        }

        .chart-legend-row {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-top: 18px;
          font-size: 0.75rem;
          color: #64748B;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .legend-dot.comp { background: #0D7A75; }
        .legend-dot.clean { background: #0284C7; }
        .legend-dot.pend { background: #FCA5A5; }

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

        /* BOTTOM GRID */
        .dash-bottom-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 20px;
        }

        .dash-table-wrapper {
          overflow-x: auto;
        }

        .dash-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.8125rem;
        }

        .dash-table th {
          text-align: left;
          padding: 10px 12px;
          color: #64748B;
          font-weight: 700;
          border-bottom: 1px solid #E2E8F0;
        }

        .dash-table td {
          padding: 12px;
          border-bottom: 1px solid #F1F5F9;
        }

        .cust-cell {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
        }

        .cust-mini-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #EBF8F7;
          color: #0D7A75;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.6875rem;
          font-weight: 700;
        }

        .service-tag-pill {
          background: #F1F5F9;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 0.75rem;
        }

        .status-pill {
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 0.6875rem;
          font-weight: 700;
          display: inline-block;
        }

        .status-pill.pickup-scheduled { background: #E0F2FE; color: #0284C7; }
        .status-pill.pending-pickup { background: #FEF3C7; color: #D97706; }
        .status-pill.in-cleaning { background: #FFEDD5; color: #EA580C; }
        .status-pill.ready-for-delivery { background: #F3E8FF; color: #9333EA; }
        .status-pill.delivered, .status-pill.completed { background: #DCFCE7; color: #16A34A; }

        .table-action-dots {
          background: none;
          border: none;
          color: #94A3B8;
          cursor: pointer;
        }

        .view-all-link {
          background: none;
          border: none;
          color: #0D7A75;
          font-size: 0.8125rem;
          font-weight: 700;
          cursor: pointer;
        }

        /* PICKUP & QUICK ACTIONS */
        .dash-side-col {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .pickup-subtabs {
          display: flex;
          gap: 8px;
          margin-bottom: 14px;
        }

        .subtab-btn {
          background: #F1F5F9;
          border: none;
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748B;
          cursor: pointer;
        }

        .subtab-btn.active {
          background: #0D7A75;
          color: #FFFFFF;
        }

        .pickup-mini-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .pickup-mini-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .pickup-mini-card:hover {
          border-color: #BCEAE6;
          background: #FFFFFF;
        }

        .mini-card-time {
          font-size: 0.75rem;
          font-weight: 700;
          color: #475569;
          min-width: 60px;
        }

        .mini-card-truck {
          color: #0D7A75;
        }

        .mini-card-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          font-size: 0.8125rem;
        }

        .mini-cust-name {
          font-size: 0.75rem;
          color: #64748B;
        }

        .mini-cust-loc {
          font-size: 0.6875rem;
          color: #94A3B8;
        }

        .mini-card-tags {
          display: flex;
          flex-direction: column;
          gap: 4px;
          align-items: flex-end;
        }

        .type-tag {
          font-size: 0.625rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .type-tag.pickup { background: #E0F2FE; color: #0284C7; }
        .type-tag.delivery { background: #F3E8FF; color: #9333EA; }

        .status-mini-tag {
          font-size: 0.625rem;
          font-weight: 700;
          color: #10B981;
        }

        .status-mini-tag.pending { color: #F59E0B; }

        .quick-actions-card {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .quick-actions-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .quick-action-item {
          display: flex;
          align-items: center;
          gap: 14px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 12px 14px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
        }

        .quick-action-item:hover {
          border-color: #0D7A75;
          transform: translateX(4px);
        }

        .quick-act-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .quick-act-icon.teal { background: #EBF8F7; color: #0D7A75; }
        .quick-act-icon.green { background: #DCFCE7; color: #16A34A; }
        .quick-act-icon.cyan { background: #E0F2FE; color: #0284C7; }

        .quick-act-text {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .quick-act-text strong {
          font-size: 0.875rem;
          color: #1E293B;
        }

        .quick-act-text span {
          font-size: 0.75rem;
          color: #64748B;
        }

        .quick-action-towels-thumb {
          height: 100px;
          border-radius: 12px;
          overflow: hidden;
        }

        .quick-action-towels-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        @media (max-width: 1350px) {
          .dash-stats-grid {
            grid-template-columns: repeat(3, 1fr);
          }
          .dash-charts-grid, .dash-bottom-grid {
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
