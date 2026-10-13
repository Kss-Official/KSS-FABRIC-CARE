import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { 
  ShoppingBag, 
  Truck, 
  CheckCircle2, 
  Plus, 
  Search, 
  ChevronDown, 
  MoreHorizontal, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  Eye,
  UserCheck
} from 'lucide-react';

// Washing Machine / Washer SVG icon matching Reference Image 2 Metric Card 3
const WasherIcon = ({ size = 20, color = 'currentColor', className = '' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect x="4" y="2" width="16" height="20" rx="3" />
    <circle cx="12" cy="13" r="5" />
    <path d="M12 11a2 2 0 0 1 2 2" />
    <path d="M8 6h.01" />
    <path d="M12 6h.01" />
  </svg>
);

export const AdminOrdersPage = () => {
  const { 
    orders, 
    setIsCreateOrderDrawerOpen, 
    setIsAssignOrderModalOpen, 
    setAssigningOrder,
    updateOrderStatus 
  } = useAdmin();

  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  const counts = {
    total: 128,
    pending: 18,
    cleaning: 32,
    ready: 14,
    completed: 64,
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
    setSelectedOrderIds([]);
  };

  const toggleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map(o => o.id));
    }
  };

  const toggleSelectOrder = (id) => {
    setSelectedOrderIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Pending Pickup':
        return 'status-pending-pickup';
      case 'In Cleaning':
        return 'status-in-cleaning';
      case 'Ready for Delivery':
        return 'status-ready-delivery';
      case 'Completed':
      case 'Delivered':
        return 'status-completed';
      default:
        return 'status-pending-pickup';
    }
  };

  const getPaymentBadgeClass = (payment) => {
    switch (payment?.toLowerCase()) {
      case 'paid':
        return 'payment-paid';
      case 'cod':
        return 'payment-cod';
      case 'unpaid':
        return 'payment-unpaid';
      default:
        return 'payment-paid';
    }
  };

  return (
    <div className="admin-orders-page animate-fade-in" onClick={() => setActiveActionMenuId(null)}>
      {/* Header Row */}
      <div className="orders-header-row">
        <div>
          <h1 className="orders-header-title">Orders</h1>
          <p className="orders-header-subtitle">Manage and track all customer orders.</p>
        </div>

        <button 
          id="create-order-top-btn"
          className="create-order-pill-btn"
          onClick={() => setIsCreateOrderDrawerOpen(true)}
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Create Order</span>
        </button>
      </div>

      {/* 5 Metric Cards */}
      <div className="orders-metric-cards-row">
        {/* Total Orders */}
        <div className="orders-metric-pill-card">
          <div className="metric-badge-box cyan">
            <ShoppingBag size={20} color="#0D7A75" strokeWidth={2} />
          </div>
          <div className="metric-text-col">
            <span className="metric-bold-num">{counts.total}</span>
            <span className="metric-label-txt">Total Orders</span>
          </div>
        </div>

        {/* Pending Pickup */}
        <div className="orders-metric-pill-card">
          <div className="metric-badge-box orange">
            <Truck size={20} color="#EA580C" strokeWidth={2} />
          </div>
          <div className="metric-text-col">
            <span className="metric-bold-num">{counts.pending}</span>
            <span className="metric-label-txt">Pending Pickup</span>
          </div>
        </div>

        {/* In Cleaning */}
        <div className="orders-metric-pill-card">
          <div className="metric-badge-box yellow">
            <WasherIcon size={20} color="#D97706" />
          </div>
          <div className="metric-text-col">
            <span className="metric-bold-num">{counts.cleaning}</span>
            <span className="metric-label-txt">In Cleaning</span>
          </div>
        </div>

        {/* Ready for Delivery */}
        <div className="orders-metric-pill-card">
          <div className="metric-badge-box purple">
            <ShoppingBag size={20} color="#9333EA" strokeWidth={2} />
          </div>
          <div className="metric-text-col">
            <span className="metric-bold-num">{counts.ready}</span>
            <span className="metric-label-txt">Ready for Delivery</span>
          </div>
        </div>

        {/* Completed */}
        <div className="orders-metric-pill-card">
          <div className="metric-badge-box green">
            <CheckCircle2 size={20} color="#16A34A" strokeWidth={2} />
          </div>
          <div className="metric-text-col">
            <span className="metric-bold-num">{counts.completed}</span>
            <span className="metric-label-txt">Completed</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls Bar */}
      <div className="orders-filter-controls-row">
        <div className="filter-search-field-wrap">
          <Search size={16} className="filter-search-icon" />
          <input 
            type="text" 
            placeholder="Search by Order ID, customer, or phone..." 
            className="filter-search-text-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-dropdowns-group">
          {/* Status Dropdown */}
          <div className="filter-select-wrap">
            <select 
              className="filter-custom-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="Pending Pickup">Pending Pickup</option>
              <option value="In Cleaning">In Cleaning</option>
              <option value="Ready for Delivery">Ready for Delivery</option>
              <option value="Completed">Completed</option>
            </select>
            <ChevronDown size={15} className="filter-select-chevron" />
          </div>

          {/* Services Dropdown */}
          <div className="filter-select-wrap">
            <select 
              className="filter-custom-select"
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
            <ChevronDown size={15} className="filter-select-chevron" />
          </div>

          {/* Date Range Button */}
          <div className="filter-date-range-box">
            <Calendar size={15} className="date-icon" />
            <span className="date-label">Select Date Range</span>
            <ChevronDown size={15} className="date-chevron" />
          </div>

          {/* Reset Link */}
          <button type="button" className="filter-reset-link" onClick={resetFilters}>
            Reset
          </button>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="orders-horizontal-tabs-bar">
        <button 
          type="button"
          className={`tab-item-link ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Orders ({counts.total})
        </button>
        <button 
          type="button"
          className={`tab-item-link ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Pickup ({counts.pending})
        </button>
        <button 
          type="button"
          className={`tab-item-link ${activeTab === 'cleaning' ? 'active' : ''}`}
          onClick={() => setActiveTab('cleaning')}
        >
          In Cleaning ({counts.cleaning})
        </button>
        <button 
          type="button"
          className={`tab-item-link ${activeTab === 'ready' ? 'active' : ''}`}
          onClick={() => setActiveTab('ready')}
        >
          Ready for Delivery ({counts.ready})
        </button>
        <button 
          type="button"
          className={`tab-item-link ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Completed ({counts.completed})
        </button>
      </div>

      {/* Main Table Card */}
      <div className="orders-table-wrapper-card">
        <div className="orders-scroll-table-box">
          <table className="orders-styled-table">
            <thead>
              <tr>
                <th width="44" className="chk-col">
                  <input 
                    type="checkbox" 
                    className="orders-custom-checkbox" 
                    checked={filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Services</th>
                <th>Pickup Date & Time</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="9" className="empty-orders-cell">
                    No orders found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(ord => {
                  const isChecked = selectedOrderIds.includes(ord.id);
                  return (
                    <tr key={ord.id} className={isChecked ? 'row-selected' : ''}>
                      <td className="chk-col">
                        <input 
                          type="checkbox" 
                          className="orders-custom-checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOrder(ord.id)}
                        />
                      </td>

                      {/* Order ID */}
                      <td>
                        <div className="order-id-meta-cell">
                          <strong className="order-id-num">{ord.id}</strong>
                          <span className="order-id-date-txt">{ord.date}</span>
                        </div>
                      </td>

                      {/* Customer */}
                      <td>
                        <div className="order-customer-meta-cell">
                          <div className="cust-circle-avatar">{ord.customer.avatar}</div>
                          <div className="cust-text-block">
                            <span className="cust-full-name">{ord.customer.name}</span>
                            <span className="cust-phone-num">{ord.customer.phone}</span>
                          </div>
                        </div>
                      </td>

                      {/* Services */}
                      <td>
                        <div className="order-services-pill-group">
                          <span className="service-name-capsule">{ord.services[0]}</span>
                          {ord.services.length > 1 && (
                            <span className="service-count-badge">+{ord.services.length - 1}</span>
                          )}
                        </div>
                      </td>

                      {/* Pickup Date & Time */}
                      <td>
                        <span className="order-pickup-datetime-str">{ord.pickupTime}</span>
                      </td>

                      {/* Amount */}
                      <td>
                        <strong className="order-amount-currency">₹{ord.amount}</strong>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`order-status-capsule-badge ${getStatusBadgeClass(ord.status)}`}>
                          {ord.status}
                        </span>
                      </td>

                      {/* Payment */}
                      <td>
                        <span className={`order-payment-capsule-badge ${getPaymentBadgeClass(ord.payment)}`}>
                          {ord.payment}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="action-col-cell">
                        <div className="action-button-anchor" onClick={(e) => e.stopPropagation()}>
                          <button 
                            type="button" 
                            className="order-dots-action-btn"
                            onClick={() => setActiveActionMenuId(activeActionMenuId === ord.id ? null : ord.id)}
                            aria-label={`Actions for ${ord.id}`}
                          >
                            <MoreHorizontal size={16} />
                          </button>

                          {activeActionMenuId === ord.id && (
                            <div className="action-popover-menu animate-fade-in">
                              <button 
                                type="button" 
                                className="popover-action-item"
                                onClick={() => {
                                  setSelectedOrderDetails(ord);
                                  setActiveActionMenuId(null);
                                }}
                              >
                                <Eye size={14} />
                                <span>View Details</span>
                              </button>
                              <button 
                                type="button" 
                                className="popover-action-item"
                                onClick={() => {
                                  setAssigningOrder(ord);
                                  setIsAssignOrderModalOpen(true);
                                  setActiveActionMenuId(null);
                                }}
                              >
                                <UserCheck size={14} />
                                <span>Assign Driver</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Bar */}
      <div className="orders-pagination-row">
        <span className="pagination-summary-text">Showing 1–10 of 128 orders</span>
        <div className="pagination-buttons-cluster">
          <button 
            type="button" 
            className="pagination-chevron-btn"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>
          
          <button 
            type="button" 
            className={`pagination-num-btn ${currentPage === 1 ? 'active' : ''}`}
            onClick={() => setCurrentPage(1)}
          >
            1
          </button>
          <button 
            type="button" 
            className={`pagination-num-btn ${currentPage === 2 ? 'active' : ''}`}
            onClick={() => setCurrentPage(2)}
          >
            2
          </button>
          <button 
            type="button" 
            className={`pagination-num-btn ${currentPage === 3 ? 'active' : ''}`}
            onClick={() => setCurrentPage(3)}
          >
            3
          </button>
          <button 
            type="button" 
            className={`pagination-num-btn ${currentPage === 4 ? 'active' : ''}`}
            onClick={() => setCurrentPage(4)}
          >
            4
          </button>
          <button 
            type="button" 
            className={`pagination-num-btn ${currentPage === 5 ? 'active' : ''}`}
            onClick={() => setCurrentPage(5)}
          >
            5
          </button>
          <span className="pagination-ellipsis-dots">...</span>
          <button 
            type="button" 
            className={`pagination-num-btn ${currentPage === 13 ? 'active' : ''}`}
            onClick={() => setCurrentPage(13)}
          >
            13
          </button>

          <button 
            type="button" 
            className="pagination-chevron-btn"
            onClick={() => setCurrentPage(p => Math.min(13, p + 1))}
            disabled={currentPage === 13}
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrderDetails && (
        <div className="details-modal-backdrop animate-fade-in" onClick={() => setSelectedOrderDetails(null)}>
          <div className="details-modal-card animate-scale-up" onClick={e => e.stopPropagation()}>
            <div className="details-modal-header">
              <h3 className="details-title">Order Details – {selectedOrderDetails.id}</h3>
              <button className="details-close" onClick={() => setSelectedOrderDetails(null)}>×</button>
            </div>
            <div className="details-modal-body">
              <div className="details-row"><strong>Customer:</strong> <span>{selectedOrderDetails.customer.name} ({selectedOrderDetails.customer.phone})</span></div>
              <div className="details-row"><strong>Address:</strong> <span>{selectedOrderDetails.customer.address}</span></div>
              <div className="details-row"><strong>Services:</strong> <span>{selectedOrderDetails.services.join(', ')}</span></div>
              <div className="details-row"><strong>Pickup Time:</strong> <span>{selectedOrderDetails.pickupTime}</span></div>
              <div className="details-row"><strong>Amount:</strong> <span>₹{selectedOrderDetails.amount} ({selectedOrderDetails.payment})</span></div>
              <div className="details-row"><strong>Status:</strong> <span className={`order-status-capsule-badge ${getStatusBadgeClass(selectedOrderDetails.status)}`}>{selectedOrderDetails.status}</span></div>
              <div className="details-row"><strong>Driver:</strong> <span>{selectedOrderDetails.driver || 'Not Assigned'}</span></div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .admin-orders-page {
          display: flex;
          flex-direction: column;
          gap: 0;
          width: 100%;
        }

        /* HEADER */
        .orders-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 22px;
        }

        .orders-header-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: #1E293B;
          letter-spacing: -0.02em;
          margin: 0;
          line-height: 1.2;
        }

        .orders-header-subtitle {
          font-size: 0.875rem;
          color: #64748B;
          margin: 4px 0 0 0;
        }

        .create-order-pill-btn {
          background: #087F77;
          color: #FFFFFF;
          border: none;
          border-radius: 9999px;
          padding: 10px 22px;
          font-size: 0.875rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .create-order-pill-btn:hover {
          background: #066761;
        }

        /* 5 METRIC CARDS */
        .orders-metric-cards-row {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .orders-metric-pill-card {
          background: #FFFFFF;
          border: 1.5px solid #F1F5F9;
          border-radius: 20px;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          gap: 14px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
          transition: border-color 0.15s ease;
        }

        .orders-metric-pill-card:hover {
          border-color: #E2E8F0;
        }

        .metric-badge-box {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .metric-badge-box.cyan { background: #E6F7F5; }
        .metric-badge-box.orange { background: #FFF1E8; }
        .metric-badge-box.yellow { background: #FEF9C3; }
        .metric-badge-box.purple { background: #F3E8FF; }
        .metric-badge-box.green { background: #DCFCE7; }

        .metric-text-col {
          display: flex;
          flex-direction: column;
        }

        .metric-bold-num {
          font-size: 1.35rem;
          font-weight: 800;
          color: #0F172A;
          line-height: 1.2;
        }

        .metric-label-txt {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #64748B;
          margin-top: 3px;
        }

        /* FILTER CONTROLS BAR */
        .orders-filter-controls-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .filter-search-field-wrap {
          position: relative;
          flex: 1;
          max-width: 400px;
          min-width: 260px;
        }

        .filter-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #94A3B8;
          pointer-events: none;
        }

        .filter-search-text-input {
          width: 100%;
          height: 42px;
          padding: 0 14px 0 38px;
          border: 1.5px solid #E2E8F0;
          border-radius: 12px;
          font-size: 0.875rem;
          color: #1E293B;
          background: #FFFFFF;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.15s ease;
        }

        .filter-search-text-input::placeholder {
          color: #94A3B8;
        }

        .filter-search-text-input:focus {
          border-color: #0D7A75;
        }

        .filter-dropdowns-group {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .filter-select-wrap {
          position: relative;
        }

        .filter-custom-select {
          height: 42px;
          border: 1.5px solid #E2E8F0;
          border-radius: 12px;
          padding: 0 34px 0 14px;
          font-size: 0.875rem;
          font-weight: 500;
          color: #334155;
          background: #FFFFFF;
          appearance: none;
          -webkit-appearance: none;
          outline: none;
          cursor: pointer;
          transition: border-color 0.15s ease;
        }

        .filter-custom-select:focus {
          border-color: #0D7A75;
        }

        .filter-select-chevron {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          color: #94A3B8;
        }

        .filter-date-range-box {
          height: 42px;
          border: 1.5px solid #E2E8F0;
          border-radius: 12px;
          padding: 0 14px;
          background: #FFFFFF;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          box-sizing: border-box;
          transition: border-color 0.15s ease;
        }

        .filter-date-range-box:hover {
          border-color: #CBD5E1;
        }

        .filter-date-range-box .date-icon {
          color: #64748B;
        }

        .filter-date-range-box .date-label {
          font-size: 0.875rem;
          color: #334155;
          font-weight: 500;
        }

        .filter-date-range-box .date-chevron {
          color: #94A3B8;
          margin-left: 2px;
        }

        .filter-reset-link {
          background: none;
          border: none;
          color: #0D7A75;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          padding: 0 8px;
          transition: color 0.15s ease;
        }

        .filter-reset-link:hover {
          color: #08615D;
          text-decoration: underline;
        }

        /* TABS BAR */
        .orders-horizontal-tabs-bar {
          display: flex;
          gap: 28px;
          border-bottom: 1.5px solid #F1F5F9;
          margin-bottom: 18px;
          overflow-x: auto;
        }

        .tab-item-link {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0 0 10px 0;
          font-size: 0.875rem;
          font-weight: 500;
          color: #64748B;
          white-space: nowrap;
          transition: color 0.15s ease;
        }

        .tab-item-link:hover {
          color: #1E293B;
        }

        .tab-item-link.active {
          color: #0D7A75;
          font-weight: 700;
          border-bottom: 2.5px solid #0D7A75;
          margin-bottom: -1.5px;
        }

        /* TABLE CARD */
        .orders-table-wrapper-card {
          background: #FFFFFF;
          border: 1.5px solid #F1F5F9;
          border-radius: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
          overflow: hidden;
        }

        .orders-scroll-table-box {
          overflow-x: auto;
        }

        .orders-styled-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .orders-styled-table th {
          background: #FFFFFF;
          padding: 16px 18px;
          color: #64748B;
          font-size: 0.8125rem;
          font-weight: 600;
          border-bottom: 1.5px solid #F1F5F9;
          white-space: nowrap;
        }

        .orders-styled-table td {
          padding: 14px 18px;
          border-bottom: 1px solid #F1F5F9;
          vertical-align: middle;
        }

        .orders-styled-table tr:last-child td {
          border-bottom: none;
        }

        .orders-styled-table tr:hover td {
          background: #FAFCFD;
        }

        .orders-styled-table tr.row-selected td {
          background: #F4FBFA;
        }

        .chk-col {
          padding-right: 6px !important;
        }

        .orders-custom-checkbox {
          width: 18px;
          height: 18px;
          border: 1.5px solid #CBD5E1;
          border-radius: 5px;
          cursor: pointer;
          accent-color: #0D7A75;
        }

        .order-id-meta-cell {
          display: flex;
          flex-direction: column;
        }

        .order-id-num {
          font-size: 0.875rem;
          font-weight: 800;
          color: #0F172A;
          line-height: 1.25;
        }

        .order-id-date-txt {
          font-size: 0.75rem;
          color: #94A3B8;
          margin-top: 3px;
        }

        .order-customer-meta-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .cust-circle-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #EBF8F7;
          color: #0D7A75;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8125rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        .cust-text-block {
          display: flex;
          flex-direction: column;
        }

        .cust-full-name {
          font-size: 0.875rem;
          font-weight: 700;
          color: #1E293B;
          line-height: 1.25;
        }

        .cust-phone-num {
          font-size: 0.75rem;
          color: #64748B;
          margin-top: 3px;
        }

        .order-services-pill-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .service-name-capsule {
          background: #F8FAFC;
          border: 1.5px solid #F1F5F9;
          border-radius: 9999px;
          padding: 4px 12px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #334155;
          white-space: nowrap;
        }

        .service-count-badge {
          background: #F1F5F9;
          border-radius: 6px;
          padding: 2px 6px;
          font-size: 0.6875rem;
          font-weight: 700;
          color: #64748B;
        }

        .order-pickup-datetime-str {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #475569;
          white-space: nowrap;
        }

        .order-amount-currency {
          font-size: 0.9375rem;
          font-weight: 800;
          color: #0F172A;
          white-space: nowrap;
        }

        /* STATUS BADGES */
        .order-status-capsule-badge {
          border-radius: 9999px;
          padding: 4px 12px;
          font-size: 0.75rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
        }

        .status-pending-pickup {
          background: #FFF1E8;
          color: #EA580C;
        }

        .status-in-cleaning {
          background: #FEF9C3;
          color: #CA8A04;
        }

        .status-ready-delivery {
          background: #F3E8FF;
          color: #9333EA;
        }

        .status-completed {
          background: #DCFCE7;
          color: #16A34A;
        }

        /* PAYMENT BADGES */
        .order-payment-capsule-badge {
          border-radius: 9999px;
          padding: 3px 12px;
          font-size: 0.75rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
        }

        .payment-paid {
          background: #DCFCE7;
          color: #16A34A;
        }

        .payment-cod {
          background: #FEF9C3;
          color: #CA8A04;
        }

        .payment-unpaid {
          background: #FEE2E2;
          color: #DC2626;
        }

        /* ACTIONS */
        .action-col-cell {
          text-align: right;
        }

        .action-button-anchor {
          position: relative;
          display: inline-block;
        }

        .order-dots-action-btn {
          width: 32px;
          height: 32px;
          border: 1.5px solid #E2E8F0;
          border-radius: 8px;
          background: #FFFFFF;
          color: #64748B;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .order-dots-action-btn:hover {
          border-color: #0D7A75;
          color: #0D7A75;
        }

        .action-popover-menu {
          position: absolute;
          right: 0;
          top: calc(100% + 4px);
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          z-index: 50;
          min-width: 150px;
          overflow: hidden;
          padding: 4px;
        }

        .popover-action-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          font-size: 0.8125rem;
          color: #334155;
          background: none;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s ease;
        }

        .popover-action-item:hover {
          background: #F1F5F9;
          color: #0D7A75;
        }

        .empty-orders-cell {
          text-align: center;
          padding: 40px !important;
          color: #94A3B8;
          font-size: 0.875rem;
        }

        /* PAGINATION */
        .orders-pagination-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 22px;
          padding: 0 4px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .pagination-summary-text {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #64748B;
        }

        .pagination-buttons-cluster {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .pagination-chevron-btn {
          width: 32px;
          height: 32px;
          border: 1.5px solid #E2E8F0;
          border-radius: 8px;
          background: #FFFFFF;
          color: #64748B;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .pagination-chevron-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination-chevron-btn:not(:disabled):hover {
          border-color: #CBD5E1;
          color: #1E293B;
        }

        .pagination-num-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          background: none;
          color: #64748B;
          font-size: 0.875rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .pagination-num-btn:hover {
          color: #1E293B;
          background: #F8FAFC;
        }

        .pagination-num-btn.active {
          background: #087F77;
          color: #FFFFFF;
          font-weight: 700;
        }

        .pagination-ellipsis-dots {
          color: #94A3B8;
          font-size: 0.875rem;
          width: 20px;
          text-align: center;
        }

        /* DETAILS MODAL */
        .details-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(4px);
          z-index: 1050;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .details-modal-card {
          width: 500px;
          max-width: 100%;
          background: #FFFFFF;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
        }

        .details-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #E2E8F0;
          padding-bottom: 12px;
          margin-bottom: 16px;
        }

        .details-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #1E293B;
          margin: 0;
        }

        .details-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: #94A3B8;
          cursor: pointer;
          line-height: 1;
        }

        .details-modal-body {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .details-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
          color: #334155;
        }

        @media (max-width: 1100px) {
          .orders-metric-cards-row {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 768px) {
          .orders-metric-cards-row {
            grid-template-columns: 1fr;
          }
          .orders-header-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          .orders-filter-controls-row {
            flex-direction: column;
            align-items: stretch;
          }
          .filter-search-field-wrap {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
