import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { 
  Truck, 
  Package, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  UserCheck,
  Plus
} from 'lucide-react';

export const AdminPickupDeliveryPage = () => {
  const { 
    orders, 
    setIsAssignOrderModalOpen, 
    setAssigningOrder 
  } = useAdmin();

  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const metrics = {
    pickups: 10,
    deliveries: 8,
    completed: 15,
    pending: 7
  };

  const filteredList = orders.filter(ord => {
    if (activeTab === 'pickups' && ord.type !== 'Pickup') return false;
    if (activeTab === 'deliveries' && ord.type !== 'Delivery') return false;
    if (searchTerm) {
      const matchId = ord.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchName = ord.customer.name.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchId && !matchName) return false;
    }
    return true;
  });

  const openAssignModalForOrder = (order) => {
    setAssigningOrder(order);
    setIsAssignOrderModalOpen(true);
  };

  return (
    <div className="admin-pickup-page animate-fade-in">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Pickup & Delivery</h1>
          <p className="page-subtitle">Manage and track today's pickups and deliveries.</p>
        </div>

        <div className="header-actions-group">
          <div className="date-picker-dropdown">
            <Calendar size={16} className="text-teal" />
            <span>Tuesday, 23 Sep 2026</span>
          </div>

          <button 
            className="btn btn-teal"
            onClick={() => {
              setAssigningOrder(null);
              setIsAssignOrderModalOpen(true);
            }}
          >
            <Plus size={18} />
            <span>Assign Order</span>
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="pickup-metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-wrap cyan"><Truck size={20} /></div>
          <div>
            <div className="metric-val">{metrics.pickups}</div>
            <div className="metric-lbl">Scheduled Pickups</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap orange"><Package size={20} /></div>
          <div>
            <div className="metric-val">{metrics.deliveries}</div>
            <div className="metric-lbl">Scheduled Deliveries</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap green"><CheckCircle2 size={20} /></div>
          <div>
            <div className="metric-val">{metrics.completed}</div>
            <div className="metric-lbl">Total Completed</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap purple"><Clock size={20} /></div>
          <div>
            <div className="metric-val">{metrics.pending}</div>
            <div className="metric-lbl">Pending</div>
          </div>
        </div>
      </div>

      {/* Tabs & Filter Bar */}
      <div className="pickup-toolbar-card">
        <div className="pickup-tabs-group">
          <button 
            className={`pickup-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All (18)
          </button>
          <button 
            className={`pickup-tab-btn ${activeTab === 'pickups' ? 'active' : ''}`}
            onClick={() => setActiveTab('pickups')}
          >
            Pickups (10)
          </button>
          <button 
            className={`pickup-tab-btn ${activeTab === 'deliveries' ? 'active' : ''}`}
            onClick={() => setActiveTab('deliveries')}
          >
            Deliveries (8)
          </button>
        </div>

        <div className="toolbar-controls">
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

          <div className="filter-btn-pill">
            <Filter size={15} />
            <span>Filters</span>
          </div>

          <div className="date-range-box">
            <Calendar size={15} />
            <span>Select Date Range</span>
          </div>
        </div>
      </div>

      {/* Operations Data Table */}
      <div className="orders-table-card">
        <div className="table-responsive">
          <table className="orders-full-table">
            <thead>
              <tr>
                <th width="40"><input type="checkbox" className="custom-chk" /></th>
                <th>TIME</th>
                <th>ORDER ID</th>
                <th>CUSTOMER</th>
                <th>TYPE</th>
                <th>ADDRESS</th>
                <th>STATUS</th>
                <th>DRIVER</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((ord, idx) => {
                const isAssigned = ord.driver && ord.driver !== 'Not Assigned';
                const timeSlotOnly = ord.pickupTime.split(',')[1] || ord.pickupTime;

                return (
                  <tr key={ord.id}>
                    <td><input type="checkbox" className="custom-chk" /></td>
                    <td>
                      <div className="time-col-cell">
                        <strong>{timeSlotOnly.split('–')[0]?.trim() || '09:00 AM'}</strong>
                        <span className="text-muted">{timeSlotOnly.split('–')[1]?.trim() || '11:00 AM'}</span>
                      </div>
                    </td>
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
                      <span className={`type-pill ${ord.type?.toLowerCase() || 'pickup'}`}>
                        {ord.type || 'Pickup'}
                      </span>
                    </td>
                    <td>
                      <span className="address-col-text">{ord.customer.address}</span>
                    </td>
                    <td>
                      <span className={`status-pill ${isAssigned ? 'assigned' : 'pending-pickup'}`}>
                        {isAssigned ? 'Assigned' : 'Pending'}
                      </span>
                    </td>
                    <td>
                      {isAssigned ? (
                        <div className="driver-assigned-cell">
                          <span className="driver-mini-circle">RK</span>
                          <div>
                            <div className="driver-name-text">{ord.driver.split('(')[0]}</div>
                            <div className="driver-phone-text">{ord.driver.match(/\((.*?)\)/)?.[1] || '+91 98765 43210'}</div>
                          </div>
                        </div>
                      ) : (
                        <button 
                          className="assign-driver-trigger-btn"
                          onClick={() => openAssignModalForOrder(ord)}
                        >
                          <UserCheck size={14} />
                          <span>Assign Driver</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="table-pagination-footer">
          <span className="pagination-info">Showing 1-8 of 18 orders</span>
          <div className="pagination-pages">
            <button className="page-btn"><ChevronLeft size={16} /></button>
            <button className="page-btn active">1</button>
            <button className="page-btn">2</button>
            <button className="page-btn">3</button>
            <button className="page-btn"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      <style>{`
        .admin-pickup-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .header-actions-group {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .pickup-metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .pickup-toolbar-card {
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

        .pickup-tabs-group {
          display: flex;
          gap: 16px;
        }

        .pickup-tab-btn {
          background: none;
          border: none;
          font-size: 0.875rem;
          font-weight: 700;
          color: #64748B;
          cursor: pointer;
          padding: 6px 0;
          position: relative;
        }

        .pickup-tab-btn.active {
          color: #0D7A75;
        }

        .pickup-tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -15px;
          left: 0;
          right: 0;
          height: 2.5px;
          background: #0D7A75;
        }

        .toolbar-controls {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          justify-content: flex-end;
          flex-wrap: wrap;
        }

        .filter-btn-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #334155;
          background: #FFFFFF;
          cursor: pointer;
        }

        .type-pill {
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .type-pill.pickup { background: #E0F2FE; color: #0284C7; }
        .type-pill.delivery { background: #F3E8FF; color: #9333EA; }

        .address-col-text {
          font-size: 0.8125rem;
          color: #475569;
          max-width: 220px;
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .driver-assigned-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .driver-mini-circle {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #1E293B;
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.6875rem;
          font-weight: 700;
        }

        .driver-name-text {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #1E293B;
        }

        .driver-phone-text {
          font-size: 0.6875rem;
          color: #64748B;
        }

        .assign-driver-trigger-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #EBF8F7;
          border: 1px solid #BCEAE6;
          color: #0D7A75;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s;
        }

        .assign-driver-trigger-btn:hover {
          background: #0D7A75;
          color: #FFFFFF;
        }

        .status-pill.assigned { background: #DCFCE7; color: #15803D; }

        @media (max-width: 1024px) {
          .pickup-metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
};
