import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { 
  Package, 
  Truck, 
  Clock, 
  ShoppingBag, 
  CheckCircle2, 
  Plus, 
  Search, 
  RotateCcw, 
  MoreHorizontal, 
  ChevronLeft, 
  ChevronRight,
  Calendar
} from 'lucide-react';

export const AdminOrdersPage = () => {
  const { orders, setIsCreateOrderDrawerOpen } = useAdmin();

  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const counts = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'Pending Pickup').length,
    cleaning: orders.filter(o => o.status === 'In Cleaning').length,
    ready: orders.filter(o => o.status === 'Ready for Delivery').length,
    completed: orders.filter(o => o.status === 'Completed').length,
  };

  const filteredOrders = orders.filter(o => {
    if (activeTab === 'pending' && o.status !== 'Pending Pickup') return false;
    if (activeTab === 'cleaning' && o.status !== 'In Cleaning') return false;
    if (activeTab === 'ready' && o.status !== 'Ready for Delivery') return false;
    if (activeTab === 'completed' && o.status !== 'Completed') return false;

    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (serviceFilter !== 'all' && !o.services.includes(serviceFilter)) return false;

    if (searchTerm) {
      const matchId = o.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchName = o.customer.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchPhone = o.customer.phone.includes(searchTerm);
      if (!matchId && !matchName && !matchPhone) return false;
    }
    return true;
  });

  const resetFilters = () => {
    setActiveTab('all');
    setSearchTerm('');
    setStatusFilter('all');
    setServiceFilter('all');
  };

  return (
    <div className="admin-orders-page animate-fade-in">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">Manage and track all customer orders.</p>
        </div>

        <button 
          id="create-order-top-btn"
          className="btn btn-teal"
          onClick={() => setIsCreateOrderDrawerOpen(true)}
        >
          <Plus size={18} />
          <span>Create Order</span>
        </button>
      </div>

      {/* 5 Metric Cards */}
      <div className="orders-metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-wrap cyan"><Package size={20} /></div>
          <div>
            <div className="metric-val">{128}</div>
            <div className="metric-lbl">Total Orders</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap orange"><Truck size={20} /></div>
          <div>
            <div className="metric-val">{18}</div>
            <div className="metric-lbl">Pending Pickup</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap yellow"><Clock size={20} /></div>
          <div>
            <div className="metric-val">{32}</div>
            <div className="metric-lbl">In Cleaning</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap purple"><ShoppingBag size={20} /></div>
          <div>
            <div className="metric-val">{14}</div>
            <div className="metric-lbl">Ready for Delivery</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap green"><CheckCircle2 size={20} /></div>
          <div>
            <div className="metric-val">{64}</div>
            <div className="metric-lbl">Completed</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="orders-filter-bar">
        <div className="filter-search-box">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by Order ID, customer, or phone..." 
            className="filter-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-dropdowns">
          <select 
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="Pending Pickup">Pending Pickup</option>
            <option value="In Cleaning">In Cleaning</option>
            <option value="Ready for Delivery">Ready for Delivery</option>
            <option value="Completed">Completed</option>
          </select>

          <select 
            className="filter-select"
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
          >
            <option value="all">All Services</option>
            <option value="Wash & Fold">Wash & Fold</option>
            <option value="Dry Cleaning">Dry Cleaning</option>
            <option value="Wash & Iron">Wash & Iron</option>
            <option value="Steam Iron">Steam Iron</option>
            <option value="Shoe Laundry">Shoe Laundry</option>
            <option value="Home Care">Home Care</option>
          </select>

          <div className="date-range-box">
            <Calendar size={15} />
            <span>Select Date Range</span>
          </div>

          <button className="reset-filter-btn" onClick={resetFilters}>
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="orders-table-card">
        {/* Status Tabs */}
        <div className="orders-status-tabs">
          <button 
            className={`status-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Orders ({128})
          </button>
          <button 
            className={`status-tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending Pickup ({18})
          </button>
          <button 
            className={`status-tab-btn ${activeTab === 'cleaning' ? 'active' : ''}`}
            onClick={() => setActiveTab('cleaning')}
          >
            In Cleaning ({32})
          </button>
          <button 
            className={`status-tab-btn ${activeTab === 'ready' ? 'active' : ''}`}
            onClick={() => setActiveTab('ready')}
          >
            Ready for Delivery ({14})
          </button>
          <button 
            className={`status-tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            Completed ({64})
          </button>
        </div>

        {/* Data Table */}
        <div className="table-responsive">
          <table className="orders-full-table">
            <thead>
              <tr>
                <th width="40"><input type="checkbox" className="custom-chk" /></th>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Services</th>
                <th>Pickup Date & Time</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(ord => (
                <tr key={ord.id}>
                  <td><input type="checkbox" className="custom-chk" /></td>
                  <td>
                    <div className="order-id-cell">
                      <strong>{ord.id}</strong>
                      <span className="order-sub-date">{ord.date}</span>
                    </div>
                  </td>
                  <td>
                    <div className="customer-cell">
                      <div className="customer-avatar">{ord.customer.avatar}</div>
                      <div>
                        <div className="customer-name">{ord.customer.name}</div>
                        <div className="customer-phone">{ord.customer.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="services-cell">
                      <span className="service-tag-pill">{ord.services[0]}</span>
                      {ord.services.length > 1 && (
                        <span className="service-extra-pill">+{ord.services.length - 1}</span>
                      )}
                    </div>
                  </td>
                  <td className="text-muted">{ord.pickupTime}</td>
                  <td><strong className="amount-val">₹{ord.amount}</strong></td>
                  <td>
                    <span className={`status-pill ${ord.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {ord.status}
                    </span>
                  </td>
                  <td>
                    <span className={`payment-pill ${ord.payment.toLowerCase()}`}>
                      {ord.payment}
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

        {/* Pagination Footer */}
        <div className="table-pagination-footer">
          <span className="pagination-info">Showing 1-10 of 128 orders</span>
          <div className="pagination-pages">
            <button className="page-btn"><ChevronLeft size={16} /></button>
            <button className="page-btn active">1</button>
            <button className="page-btn">2</button>
            <button className="page-btn">3</button>
            <button className="page-btn">4</button>
            <button className="page-btn">5</button>
            <span className="page-dots">...</span>
            <button className="page-btn">13</button>
            <button className="page-btn"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      <style>{`
        .admin-orders-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .page-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .page-title {
          font-size: 1.875rem;
          font-weight: 800;
          color: #1E293B;
          letter-spacing: -0.02em;
        }

        .page-subtitle {
          font-size: 0.875rem;
          color: #64748B;
        }

        /* METRICS */
        .orders-metrics-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 16px;
        }

        .metric-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          padding: 18px;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .metric-icon-wrap {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .metric-icon-wrap.cyan { background: #E0F2FE; color: #0284C7; }
        .metric-icon-wrap.orange { background: #FFEDD5; color: #EA580C; }
        .metric-icon-wrap.yellow { background: #FEF3C7; color: #D97706; }
        .metric-icon-wrap.purple { background: #F3E8FF; color: #9333EA; }
        .metric-icon-wrap.green { background: #DCFCE7; color: #16A34A; }

        .metric-val {
          font-size: 1.5rem;
          font-weight: 800;
          color: #1E293B;
          line-height: 1.2;
        }

        .metric-lbl {
          font-size: 0.75rem;
          color: #64748B;
          font-weight: 600;
        }

        /* FILTER BAR */
        .orders-filter-bar {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          padding: 14px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .filter-search-box {
          position: relative;
          flex: 1;
          min-width: 260px;
          display: flex;
          align-items: center;
        }

        .filter-search-input {
          width: 100%;
          padding: 10px 14px 10px 38px;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          font-size: 0.875rem;
          background: #F8FAFC;
          outline: none;
        }

        .filter-dropdowns {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .filter-select {
          padding: 10px 14px;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          font-size: 0.8125rem;
          background: #FFFFFF;
          color: #334155;
          outline: none;
        }

        .date-range-box {
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 0.8125rem;
          color: #334155;
          background: #FFFFFF;
          cursor: pointer;
        }

        .reset-filter-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
        }

        .reset-filter-btn:hover {
          background: #F1F5F9;
        }

        /* TABLE CARD */
        .orders-table-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
        }

        .orders-status-tabs {
          display: flex;
          gap: 24px;
          padding: 18px 24px;
          border-bottom: 1px solid #E2E8F0;
          overflow-x: auto;
        }

        .status-tab-btn {
          background: none;
          border: none;
          font-size: 0.875rem;
          font-weight: 600;
          color: #64748B;
          cursor: pointer;
          padding-bottom: 8px;
          position: relative;
          white-space: nowrap;
        }

        .status-tab-btn.active {
          color: #0D7A75;
          font-weight: 700;
        }

        .status-tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -19px;
          left: 0;
          right: 0;
          height: 2.5px;
          background: #0D7A75;
        }

        .table-responsive {
          overflow-x: auto;
        }

        .orders-full-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }

        .orders-full-table th {
          text-align: left;
          padding: 14px 18px;
          color: #64748B;
          font-weight: 700;
          font-size: 0.8125rem;
          border-bottom: 1px solid #E2E8F0;
          background: #FAFCFC;
        }

        .orders-full-table td {
          padding: 16px 18px;
          border-bottom: 1px solid #F1F5F9;
          color: #1E293B;
        }

        .custom-chk {
          accent-color: #0D7A75;
          cursor: pointer;
        }

        .order-id-cell {
          display: flex;
          flex-direction: column;
        }

        .order-sub-date {
          font-size: 0.75rem;
          color: #94A3B8;
        }

        .customer-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .customer-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #EBF8F7;
          color: #0D7A75;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8125rem;
          font-weight: 700;
        }

        .customer-name {
          font-weight: 700;
          color: #1E293B;
        }

        .customer-phone {
          font-size: 0.75rem;
          color: #64748B;
        }

        .services-cell {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .service-extra-pill {
          background: #F1F5F9;
          color: #64748B;
          font-size: 0.6875rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .amount-val {
          font-size: 0.9375rem;
          color: #1E293B;
        }

        .payment-pill {
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 700;
          display: inline-block;
        }

        .payment-pill.paid { background: #DCFCE7; color: #15803D; }
        .payment-pill.cod { background: #FEF3C7; color: #B45309; }
        .payment-pill.unpaid { background: #FEE2E2; color: #B91C1C; }

        .table-pagination-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 24px;
          border-top: 1px solid #E2E8F0;
        }

        .pagination-info {
          font-size: 0.8125rem;
          color: #64748B;
        }

        .pagination-pages {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .page-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid #E2E8F0;
          background: #FFFFFF;
          color: #475569;
          font-size: 0.8125rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .page-btn.active {
          background: #0D7A75;
          color: #FFFFFF;
          border-color: #0D7A75;
        }

        .page-dots {
          color: #94A3B8;
          padding: 0 4px;
        }

        @media (max-width: 1100px) {
          .orders-metrics-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 768px) {
          .orders-metrics-grid {
            grid-template-columns: 1fr;
          }
          .page-header-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
        }
      `}</style>
    </div>
  );
};
