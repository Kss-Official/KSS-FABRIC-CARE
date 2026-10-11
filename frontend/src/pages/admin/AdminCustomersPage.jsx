import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Star, 
  Plus, 
  Search, 
  RotateCcw, 
  MoreHorizontal, 
  ChevronLeft, 
  ChevronRight,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';

export const AdminCustomersPage = () => {
  const { customers, setIsAddCustomerModalOpen } = useAdmin();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [areaFilter, setAreaFilter] = useState('all');

  const filteredCustomers = customers.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (areaFilter !== 'all' && !c.location.includes(areaFilter)) return false;
    if (searchTerm) {
      const matchName = c.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchPhone = c.phone.includes(searchTerm);
      const matchEmail = c.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchLoc = c.location.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchName && !matchPhone && !matchEmail && !matchLoc) return false;
    }
    return true;
  });

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setAreaFilter('all');
  };

  return (
    <div className="admin-customers-page animate-fade-in">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">Manage all your customers and their information.</p>
        </div>

        <button 
          id="add-customer-top-btn"
          className="btn btn-teal"
          onClick={() => setIsAddCustomerModalOpen(true)}
        >
          <Plus size={18} />
          <span>Add Customer</span>
        </button>
      </div>

      {/* 4 Metric Cards */}
      <div className="customers-metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-wrap cyan"><Users size={20} /></div>
          <div>
            <div className="metric-val">248</div>
            <div className="metric-lbl">Total Customers</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap green"><UserCheck size={20} /></div>
          <div>
            <div className="metric-val">188</div>
            <div className="metric-lbl">Active Customers</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap yellow"><UserX size={20} /></div>
          <div>
            <div className="metric-val">42</div>
            <div className="metric-lbl">Inactive Customers</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap purple"><Star size={20} /></div>
          <div>
            <div className="metric-val">4.8</div>
            <div className="metric-lbl">Average Rating</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="orders-filter-bar">
        <div className="filter-search-box">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by name, phone, email, or address..." 
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
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <select 
            className="filter-select"
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
          >
            <option value="all">All Areas</option>
            <option value="Banaswadi">Banaswadi</option>
            <option value="HRBR Layout">HRBR Layout</option>
            <option value="Indiranagar">Indiranagar</option>
            <option value="Whitefield">Whitefield</option>
            <option value="HSR Layout">HSR Layout</option>
            <option value="Koramangala">Koramangala</option>
          </select>

          <select className="filter-select">
            <option>Join Date</option>
            <option>Last 30 Days</option>
            <option>This Year</option>
          </select>

          <button className="reset-filter-btn" onClick={resetFilters}>
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Customers Data Table */}
      <div className="orders-table-card">
        <div className="table-responsive">
          <table className="orders-full-table">
            <thead>
              <tr>
                <th width="40"><input type="checkbox" className="custom-chk" /></th>
                <th>Customer</th>
                <th>Contact</th>
                <th>Location</th>
                <th>Total Orders</th>
                <th>Total Spent</th>
                <th>Status</th>
                <th>Join Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(cust => (
                <tr key={cust.id}>
                  <td><input type="checkbox" className="custom-chk" /></td>
                  <td>
                    <div className="customer-cell">
                      <div className="customer-avatar">{cust.avatar}</div>
                      <div>
                        <div className="customer-name">{cust.name}</div>
                        <span className="order-sub-date">{cust.id}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="contact-col-cell">
                      <div className="contact-line"><Phone size={13} className="text-muted" /> <span>{cust.phone}</span></div>
                      <div className="contact-line"><Mail size={13} className="text-muted" /> <span>{cust.email}</span></div>
                    </div>
                  </td>
                  <td>
                    <div className="location-cell">
                      <MapPin size={14} className="text-teal" />
                      <span>{cust.location}</span>
                    </div>
                  </td>
                  <td><strong>{cust.totalOrders}</strong></td>
                  <td><strong className="amount-val">{cust.totalSpent}</strong></td>
                  <td>
                    <span className={`status-pill ${cust.status.toLowerCase()}`}>
                      {cust.status}
                    </span>
                  </td>
                  <td>
                    <div className="join-date-cell">
                      <span>{cust.joinDate}</span>
                      <span className="join-rel">{cust.joinRelative}</span>
                    </div>
                  </td>
                  <td>
                    <button className="table-action-dots"><MoreHorizontal size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="table-pagination-footer">
          <span className="pagination-info">Showing 1-10 of 248 customers</span>
          <div className="pagination-pages">
            <button className="page-btn"><ChevronLeft size={16} /></button>
            <button className="page-btn active">1</button>
            <button className="page-btn">2</button>
            <button className="page-btn">3</button>
            <button className="page-btn">4</button>
            <button className="page-btn">5</button>
            <span className="page-dots">...</span>
            <button className="page-btn">25</button>
            <button className="page-btn"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      <style>{`
        .admin-customers-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .customers-metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .contact-col-cell {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 0.75rem;
        }

        .contact-line {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #475569;
        }

        .location-cell {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8125rem;
          color: #334155;
        }

        .join-date-cell {
          display: flex;
          flex-direction: column;
          font-size: 0.8125rem;
        }

        .join-rel {
          font-size: 0.6875rem;
          color: #94A3B8;
        }

        .status-pill.active { background: #DCFCE7; color: #15803D; }
        .status-pill.inactive { background: #FEF3C7; color: #B45309; }

        @media (max-width: 1024px) {
          .customers-metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
};
