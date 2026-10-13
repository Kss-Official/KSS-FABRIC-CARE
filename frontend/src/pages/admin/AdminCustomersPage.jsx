import React, { useState, useMemo } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { 
  Users, 
  UserCheck, 
  Clock, 
  Star, 
  Plus, 
  Search, 
  ChevronDown,
  Calendar,
  MoreHorizontal, 
  ChevronLeft, 
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';

// Exact baseline customers matching Reference Image 2
const BASELINE_CUSTOMERS = [
  {
    id: '#CUS1028',
    name: 'Rohan',
    fullName: 'Rohan Mehta',
    phone: '+91 98765 43210',
    email: 'rohan.mehta@gmail.com',
    avatar: 'RM',
    avatarBg: '#CFFAFE',
    avatarColor: '#0284C7',
    location: 'Banaswadi, Bengaluru 560043',
    totalOrders: 12,
    totalSpent: '₹3,240',
    status: 'Active',
    joinDate: '12 Aug 2026',
    joinRelative: '2 months ago'
  },
  {
    id: '#CUS1027',
    name: 'Priya',
    fullName: 'Priya Sharma',
    phone: '+91 99876 54321',
    email: 'priya.sharma@gmail.com',
    avatar: 'PS',
    avatarBg: '#EDE9FE',
    avatarColor: '#7C3AED',
    location: 'HRBR Layout, Bengaluru 560043',
    totalOrders: 18,
    totalSpent: '₹5,680',
    status: 'Active',
    joinDate: '05 Aug 2026',
    joinRelative: '2 months ago'
  },
  {
    id: '#CUS1026',
    name: 'Arjun Nair',
    fullName: 'Arjun Nair',
    phone: '+91 91234 56789',
    email: 'arjun.nair@gmail.com',
    avatar: 'AN',
    avatarBg: '#CCFBF1',
    avatarColor: '#0D9488',
    location: 'Indiranagar, Bengaluru 560038',
    totalOrders: 9,
    totalSpent: '₹2,910',
    status: 'Active',
    joinDate: '28 Jul 2026',
    joinRelative: '3 months ago'
  },
  {
    id: '#CUS1025',
    name: 'Sneha',
    fullName: 'Sneha Reddy',
    phone: '+91 99887 66554',
    email: 'sneha.reddy@gmail.com',
    avatar: 'SR',
    avatarBg: '#FCE7F3',
    avatarColor: '#DB2777',
    location: 'Whitefield, Bengaluru 560066',
    totalOrders: 15,
    totalSpent: '₹4,120',
    status: 'Active',
    joinDate: '20 Jul 2026',
    joinRelative: '3 months ago'
  },
  {
    id: '#CUS1024',
    name: 'Karan Verma',
    fullName: 'Karan Verma',
    phone: '+91 98712 34567',
    email: 'karan.verma@gmail.com',
    avatar: 'KV',
    avatarBg: '#FEF3C7',
    avatarColor: '#D97706',
    location: 'Marathahalli, Bengaluru 560037',
    totalOrders: 7,
    totalSpent: '₹1,980',
    status: 'Inactive',
    joinDate: '15 Jun 2026',
    joinRelative: '4 months ago'
  },
  {
    id: '#CUS1023',
    name: 'Neha Kapoor',
    fullName: 'Neha Kapoor',
    phone: '+91 87654 32109',
    email: 'neha.kapoor@gmail.com',
    avatar: 'NK',
    avatarBg: '#CFFAFE',
    avatarColor: '#0284C7',
    location: 'HSR Layout, Bengaluru 560102',
    totalOrders: 21,
    totalSpent: '₹6,450',
    status: 'Active',
    joinDate: '10 Jun 2026',
    joinRelative: '4 months ago'
  },
  {
    id: '#CUS1022',
    name: 'Amit Shah',
    fullName: 'Amit Shah',
    phone: '+91 91234 99876',
    email: 'amit.shah@gmail.com',
    avatar: 'AM',
    avatarBg: '#F3E8FF',
    avatarColor: '#9333EA',
    location: 'Koramangala, Bengaluru 560034',
    totalOrders: 11,
    totalSpent: '₹3,150',
    status: 'Active',
    joinDate: '02 Jun 2026',
    joinRelative: '4 months ago'
  },
  {
    id: '#CUS1021',
    name: 'Deepak Reddy',
    fullName: 'Deepak Reddy',
    phone: '+91 99876 23451',
    email: 'deepak.reddy@gmail.com',
    avatar: 'DP',
    avatarBg: '#E0E7FF',
    avatarColor: '#4338CA',
    location: 'Jayanagar, Bengaluru 560011',
    totalOrders: 8,
    totalSpent: '₹2,400',
    status: 'Active',
    joinDate: '25 May 2026',
    joinRelative: '5 months ago'
  },
  {
    id: '#CUS1020',
    name: 'Kavya T',
    fullName: 'Kavya T',
    phone: '+91 93456 78912',
    email: 'kavya.t@gmail.com',
    avatar: 'KT',
    avatarBg: '#FEF08A',
    avatarColor: '#A16207',
    location: 'Malleshwaram, Bengaluru 560003',
    totalOrders: 14,
    totalSpent: '₹3,890',
    status: 'Active',
    joinDate: '18 May 2026',
    joinRelative: '5 months ago'
  },
  {
    id: '#CUS1019',
    name: 'Pavan Kumar',
    fullName: 'Pavan Kumar',
    phone: '+91 98765 12345',
    email: 'pavan.kumar@gmail.com',
    avatar: 'PK',
    avatarBg: '#E0F2FE',
    avatarColor: '#0369A1',
    location: 'Hebbal, Bengaluru 560024',
    totalOrders: 16,
    totalSpent: '₹4,300',
    status: 'Active',
    joinDate: '10 May 2026',
    joinRelative: '5 months ago'
  }
];

export const AdminCustomersPage = () => {
  const { customers: contextCustomers, setIsAddCustomerModalOpen } = useAdmin();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [isJoinDateDropdownOpen, setIsJoinDateDropdownOpen] = useState(false);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState([]);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Exact metric counts matching Reference Image 2
  const metrics = {
    total: 248,
    active: 188,
    inactive: 42,
    rating: 4.8
  };

  // Merge contextCustomers into baseline to support adding new customers dynamically
  const allCustomers = useMemo(() => {
    if (!contextCustomers || contextCustomers.length === 0) return BASELINE_CUSTOMERS;
    
    // Check if new customers were added
    const baseIds = new Set(BASELINE_CUSTOMERS.map(c => c.id));
    const newFromContext = contextCustomers.filter(c => !baseIds.has(c.id)).map(c => ({
      id: c.id,
      name: c.name.split(' ')[0] || c.name,
      fullName: c.name,
      phone: c.phone || '+91 98765 00000',
      email: c.email || 'customer@gmail.com',
      avatar: c.avatar || (c.name.substring(0, 2).toUpperCase()),
      avatarBg: '#E0F2FE',
      avatarColor: '#0284C7',
      location: c.location || `${c.area || 'HSR Layout'}, Bengaluru`,
      totalOrders: c.totalOrders || 1,
      totalSpent: c.totalSpent || '₹450',
      status: c.status || 'Active',
      joinDate: c.joinDate || 'Today',
      joinRelative: c.joinRelative || 'Just now'
    }));

    return [...newFromContext, ...BASELINE_CUSTOMERS];
  }, [contextCustomers]);

  // Filtering
  const filteredCustomers = useMemo(() => {
    return allCustomers.filter(c => {
      // Status filter
      if (statusFilter !== 'all' && c.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      
      // Area filter
      if (areaFilter !== 'all' && !c.location.toLowerCase().includes(areaFilter.toLowerCase())) {
        return false;
      }

      // Search query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchName = c.name.toLowerCase().includes(q) || c.fullName.toLowerCase().includes(q);
        const matchId = c.id.toLowerCase().includes(q);
        const matchPhone = c.phone.includes(q);
        const matchEmail = c.email.toLowerCase().includes(q);
        const matchLoc = c.location.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchPhone && !matchEmail && !matchLoc) {
          return false;
        }
      }

      return true;
    });
  }, [allCustomers, statusFilter, areaFilter, searchTerm]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const currentPageClamped = Math.min(currentPage, totalPages);
  const startIndex = (currentPageClamped - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredCustomers.length);
  const currentCustomersPage = filteredCustomers.slice(startIndex, endIndex);

  // Checkbox toggle
  const handleToggleSelectAll = () => {
    const pageIds = currentCustomersPage.map(c => c.id);
    const allSelected = pageIds.every(id => selectedCustomerIds.includes(id));
    if (allSelected) {
      setSelectedCustomerIds(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      setSelectedCustomerIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleToggleSelectCustomer = (id) => {
    setSelectedCustomerIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setAreaFilter('all');
    setDateRangeFilter('all');
    setCurrentPage(1);
    setSelectedCustomerIds([]);
  };

  return (
    <div className="admin-customers-page animate-fade-in">
      {/* 1. Header Row */}
      <div className="customers-header-row">
        <div className="customers-header-left">
          <h1 className="customers-page-title">Customers</h1>
          <p className="customers-page-subtitle">Manage all your customers and their information.</p>
        </div>

        <button 
          id="add-customer-top-btn"
          className="btn-add-customer-teal"
          onClick={() => setIsAddCustomerModalOpen(true)}
          type="button"
        >
          <Plus size={18} strokeWidth={2.4} />
          <span>Add Customer</span>
        </button>
      </div>

      {/* 2. Four White Metric Cards */}
      <div className="customers-metrics-grid">
        {/* Card 1: Total Customers */}
        <div className="customer-metric-card">
          <div className="metric-icon-circle-badge badge-cyan">
            <Users size={22} color="#0891B2" strokeWidth={1.8} />
          </div>
          <div className="metric-text-stack">
            <div className="metric-numeric-value">{metrics.total}</div>
            <div className="metric-sublabel">
              <span>Total</span>
              <span>Customers</span>
            </div>
          </div>
        </div>

        {/* Card 2: Active Customers */}
        <div className="customer-metric-card">
          <div className="metric-icon-circle-badge badge-green">
            <UserCheck size={22} color="#16A34A" strokeWidth={1.8} />
          </div>
          <div className="metric-text-stack">
            <div className="metric-numeric-value">{metrics.active}</div>
            <div className="metric-sublabel">
              <span>Active</span>
              <span>Customers</span>
            </div>
          </div>
        </div>

        {/* Card 3: Inactive Customers */}
        <div className="customer-metric-card">
          <div className="metric-icon-circle-badge badge-yellow">
            <Clock size={22} color="#D97706" strokeWidth={1.8} />
          </div>
          <div className="metric-text-stack">
            <div className="metric-numeric-value">{metrics.inactive}</div>
            <div className="metric-sublabel">
              <span>Inactive</span>
              <span>Customers</span>
            </div>
          </div>
        </div>

        {/* Card 4: Average Rating */}
        <div className="customer-metric-card">
          <div className="metric-icon-circle-badge badge-purple">
            <Star size={22} color="#9333EA" strokeWidth={1.8} />
          </div>
          <div className="metric-text-stack">
            <div className="metric-numeric-value">{metrics.rating}</div>
            <div className="metric-sublabel">
              <span>Average</span>
              <span>Rating</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search and Filter Bar */}
      <div className="customers-filter-bar-row">
        {/* Left: Search Box */}
        <div className="filter-search-box-wrap">
          <Search size={16} className="search-field-icon" />
          <input 
            type="text" 
            placeholder="Search by name, phone, email, or address..." 
            className="filter-search-input-field"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>

        {/* Right: Dropdowns Group */}
        <div className="filter-controls-group">
          {/* Status Select */}
          <div className="filter-select-container">
            <select 
              className="filter-styled-select"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <ChevronDown size={14} className="select-chevron-icon" />
          </div>

          {/* Areas Select */}
          <div className="filter-select-container">
            <select 
              className="filter-styled-select"
              value={areaFilter}
              onChange={(e) => { setAreaFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">All Areas</option>
              <option value="Banaswadi">Banaswadi</option>
              <option value="HRBR Layout">HRBR Layout</option>
              <option value="Indiranagar">Indiranagar</option>
              <option value="Whitefield">Whitefield</option>
              <option value="Marathahalli">Marathahalli</option>
              <option value="HSR Layout">HSR Layout</option>
              <option value="Koramangala">Koramangala</option>
            </select>
            <ChevronDown size={14} className="select-chevron-icon" />
          </div>

          {/* Join Date Dropdown Button */}
          <div className="filter-dropdown-pill-wrapper">
            <button 
              type="button"
              className="filter-pill-button"
              onClick={() => setIsJoinDateDropdownOpen(!isJoinDateDropdownOpen)}
            >
              <Calendar size={15} className="pill-button-icon" />
              <span>Join Date</span>
              <ChevronDown size={14} className="pill-button-chevron" />
            </button>
            {isJoinDateDropdownOpen && (
              <div className="join-date-popover animate-scale-in">
                {['all', 'last-30', 'this-year'].map(r => (
                  <button 
                    key={r}
                    className={`popover-item ${dateRangeFilter === r ? 'active' : ''}`}
                    onClick={() => {
                      setDateRangeFilter(r);
                      setIsJoinDateDropdownOpen(false);
                    }}
                  >
                    {r === 'all' ? 'All Time' : r === 'last-30' ? 'Last 30 Days' : 'This Year'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reset Link */}
          <button type="button" className="filter-reset-action-link" onClick={resetFilters}>
            Reset
          </button>
        </div>
      </div>

      {/* 4. Main Customers Table Card */}
      <div className="customers-table-card-container">
        <div className="table-responsive-wrapper">
          <table className="customers-full-data-table">
            <thead>
              <tr>
                <th className="th-checkbox-col">
                  <input 
                    type="checkbox" 
                    className="styled-chk-box" 
                    checked={currentCustomersPage.length > 0 && currentCustomersPage.every(c => selectedCustomerIds.includes(c.id))}
                    onChange={handleToggleSelectAll}
                  />
                </th>
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
              {currentCustomersPage.length === 0 ? (
                <tr>
                  <td colSpan="9" className="empty-results-cell">
                    No customers found matching your search or filters.
                  </td>
                </tr>
              ) : (
                currentCustomersPage.map((cust) => {
                  const isChecked = selectedCustomerIds.includes(cust.id);

                  return (
                    <tr key={cust.id} className={isChecked ? 'row-selected' : ''}>
                      {/* Checkbox */}
                      <td className="td-checkbox-col">
                        <input 
                          type="checkbox" 
                          className="styled-chk-box"
                          checked={isChecked}
                          onChange={() => handleToggleSelectCustomer(cust.id)}
                        />
                      </td>

                      {/* Customer */}
                      <td>
                        <div className="customer-identity-cell">
                          <div 
                            className="customer-avatar-round"
                            style={{ 
                              backgroundColor: cust.avatarBg, 
                              color: cust.avatarColor 
                            }}
                          >
                            {cust.avatar}
                          </div>
                          <div className="customer-name-id-wrap">
                            <span className="customer-primary-name">{cust.name}</span>
                            <span className="customer-code-id">{cust.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td>
                        <div className="customer-contact-stack">
                          <div className="contact-line-item">
                            <Phone size={13} className="contact-item-icon" />
                            <span>{cust.phone}</span>
                          </div>
                          <div className="contact-line-item">
                            <Mail size={13} className="contact-item-icon" />
                            <span>{cust.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td>
                        {(() => {
                          const [areaPart, ...cityParts] = cust.location.includes(',') 
                            ? cust.location.split(',') 
                            : [cust.location, ''];
                          const cityPart = cityParts.join(',').trim();

                          return (
                            <div className="customer-location-wrapper">
                              <MapPin size={14} className="location-marker-icon" />
                              <div className="location-text-stack">
                                <span className="location-area-line">{areaPart ? `${areaPart.trim()},` : ''}</span>
                                {cityPart && <span className="location-city-line">{cityPart}</span>}
                              </div>
                            </div>
                          );
                        })()}
                      </td>

                      {/* Total Orders */}
                      <td>
                        <span className="orders-count-number">{cust.totalOrders}</span>
                      </td>

                      {/* Total Spent */}
                      <td>
                        <span className="spent-amount-number">{cust.totalSpent}</span>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`status-pill-capsule ${cust.status.toLowerCase()}`}>
                          {cust.status}
                        </span>
                      </td>

                      {/* Join Date */}
                      <td>
                        <div className="join-date-stack">
                          <span className="join-exact-date">{cust.joinDate}</span>
                          <span className="join-relative-time">{cust.joinRelative}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="td-actions-col">
                        <div className="action-menu-anchor">
                          <button 
                            type="button"
                            className="table-dot-menu-btn"
                            onClick={() => setActiveMenuId(activeMenuId === cust.id ? null : cust.id)}
                            aria-label="Actions"
                          >
                            <MoreHorizontal size={16} />
                          </button>

                          {activeMenuId === cust.id && (
                            <div className="action-dropdown-popover animate-scale-in">
                              <button 
                                className="action-popover-item"
                                onClick={() => setActiveMenuId(null)}
                              >
                                <Eye size={13} />
                                <span>View Details</span>
                              </button>
                              <button 
                                className="action-popover-item"
                                onClick={() => setActiveMenuId(null)}
                              >
                                <Edit size={13} />
                                <span>Edit Customer</span>
                              </button>
                              <button 
                                className="action-popover-item danger"
                                onClick={() => setActiveMenuId(null)}
                              >
                                <Trash2 size={13} />
                                <span>Delete Customer</span>
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

      {/* 5. Pagination Footer */}
      <div className="customers-pagination-footer-row">
        <div className="pagination-count-summary">
          Showing <span className="highlight-count">{filteredCustomers.length === 0 ? 0 : startIndex + 1}–{endIndex}</span> of <span className="highlight-count">{metrics.total}</span> customers
        </div>

        <div className="pagination-buttons-cluster">
          <button 
            type="button"
            className="pagination-arrow-btn" 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPageClamped <= 1}
          >
            <ChevronLeft size={16} />
          </button>

          <button 
            type="button"
            className={`pagination-number-btn ${currentPageClamped === 1 ? 'active' : ''}`}
            onClick={() => setCurrentPage(1)}
          >
            1
          </button>
          <button 
            type="button"
            className={`pagination-number-btn ${currentPageClamped === 2 ? 'active' : ''}`}
            onClick={() => setCurrentPage(2)}
          >
            2
          </button>
          <button 
            type="button"
            className={`pagination-number-btn ${currentPageClamped === 3 ? 'active' : ''}`}
            onClick={() => setCurrentPage(3)}
          >
            3
          </button>
          <button 
            type="button"
            className={`pagination-number-btn ${currentPageClamped === 4 ? 'active' : ''}`}
            onClick={() => setCurrentPage(4)}
          >
            4
          </button>
          <button 
            type="button"
            className={`pagination-number-btn ${currentPageClamped === 5 ? 'active' : ''}`}
            onClick={() => setCurrentPage(5)}
          >
            5
          </button>

          <span className="pagination-gap-dots">...</span>

          <button 
            type="button"
            className={`pagination-number-btn ${currentPageClamped === 25 ? 'active' : ''}`}
            onClick={() => setCurrentPage(25)}
          >
            25
          </button>

          <button 
            type="button"
            className="pagination-arrow-btn" 
            onClick={() => setCurrentPage(p => Math.min(25, p + 1))}
            disabled={currentPageClamped >= 25}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Scoped Styling matching Reference Image 2 pixel-by-pixel */}
      <style>{`
        .admin-customers-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
          padding-bottom: 40px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }

        /* 1. Header */
        .customers-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }

        .customers-page-title {
          font-size: 1.625rem;
          font-weight: 700;
          color: #0F172A;
          margin: 0 0 4px 0;
          letter-spacing: -0.02em;
        }

        .customers-page-subtitle {
          font-size: 0.875rem;
          color: #64748B;
          margin: 0;
          font-weight: 400;
        }

        .btn-add-customer-teal {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #0D7A75;
          color: #FFFFFF;
          border: none;
          border-radius: 10px;
          padding: 10px 20px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(13, 122, 117, 0.2);
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .btn-add-customer-teal:hover {
          background: #09635F;
          box-shadow: 0 4px 8px rgba(13, 122, 117, 0.25);
          transform: translateY(-1px);
        }

        /* 2. 4 White Metric Cards */
        .customers-metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .customer-metric-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          padding: 20px 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
          box-sizing: border-box;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .customer-metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 14px -3px rgba(0, 0, 0, 0.05);
        }

        .metric-icon-circle-badge {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .metric-icon-circle-badge.badge-cyan {
          background: #ECFEFF;
        }

        .metric-icon-circle-badge.badge-green {
          background: #DCFCE7;
        }

        .metric-icon-circle-badge.badge-yellow {
          background: #FEF3C7;
        }

        .metric-icon-circle-badge.badge-purple {
          background: #F3E8FF;
        }

        .metric-text-stack {
          display: flex;
          flex-direction: column;
        }

        .metric-numeric-value {
          font-size: 1.875rem;
          font-weight: 700;
          color: #0F172A;
          line-height: 1.1;
          letter-spacing: -0.02em;
        }

        .metric-sublabel {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #64748B;
          margin-top: 4px;
          display: flex;
          flex-direction: column;
          line-height: 1.25;
        }

        /* 3. Search and Filter Controls */
        .customers-filter-bar-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
        }

        .filter-search-box-wrap {
          position: relative;
          display: flex;
          align-items: center;
          flex: 1;
          min-width: 260px;
        }

        .search-field-icon {
          position: absolute;
          left: 14px;
          color: #94A3B8;
          pointer-events: none;
        }

        .filter-search-input-field {
          height: 42px;
          width: 100%;
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          border-radius: 10px;
          padding: 0 14px 0 38px;
          font-size: 0.8125rem;
          color: #0F172A;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }

        .filter-search-input-field::placeholder {
          color: #94A3B8;
        }

        .filter-search-input-field:focus {
          border-color: #0D7A75;
          box-shadow: 0 0 0 3px rgba(13, 122, 117, 0.1);
        }

        .filter-controls-group {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .filter-select-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .filter-styled-select {
          height: 42px;
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          border-radius: 10px;
          padding: 0 34px 0 14px;
          font-size: 0.8125rem;
          font-weight: 500;
          color: #334155;
          appearance: none;
          -webkit-appearance: none;
          outline: none;
          cursor: pointer;
          transition: border-color 0.2s;
        }

        .filter-styled-select:focus {
          border-color: #0D7A75;
        }

        .select-chevron-icon {
          position: absolute;
          right: 12px;
          color: #64748B;
          pointer-events: none;
        }

        .filter-dropdown-pill-wrapper {
          position: relative;
        }

        .filter-pill-button {
          height: 42px;
          padding: 0 14px;
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8125rem;
          font-weight: 500;
          color: #334155;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
        }

        .filter-pill-button:hover {
          background: #F8FAFC;
          border-color: #94A3B8;
        }

        .pill-button-icon {
          color: #475569;
        }

        .pill-button-chevron {
          color: #64748B;
        }

        .join-date-popover {
          position: absolute;
          top: calc(100% + 6px);
          right: 0;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          z-index: 50;
          min-width: 160px;
          padding: 6px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .popover-item {
          background: none;
          border: none;
          padding: 8px 12px;
          text-align: left;
          font-size: 0.8125rem;
          color: #334155;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: background 0.15s;
        }

        .popover-item:hover,
        .popover-item.active {
          background: #F1F5F9;
          color: #0D7A75;
          font-weight: 600;
        }

        .filter-reset-action-link {
          background: none;
          border: none;
          color: #0D7A75;
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
          padding: 8px 4px;
          transition: color 0.15s;
        }

        .filter-reset-action-link:hover {
          color: #09635F;
          text-decoration: underline;
        }

        /* 4. Table Card */
        .customers-table-card-container {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }

        .table-responsive-wrapper {
          overflow-x: auto;
          width: 100%;
        }

        .customers-full-data-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          text-align: left;
        }

        .customers-full-data-table thead tr {
          border-bottom: 1px solid #F1F5F9;
        }

        .customers-full-data-table th {
          font-size: 0.75rem;
          font-weight: 600;
          color: #1E293B;
          padding: 16px 18px;
          background: #FFFFFF;
          border-bottom: 1px solid #F1F5F9;
          white-space: nowrap;
        }

        .th-checkbox-col,
        .td-checkbox-col {
          width: 44px;
          padding-left: 22px !important;
          padding-right: 0 !important;
        }

        .styled-chk-box {
          width: 16px;
          height: 16px;
          border-radius: 4px;
          border: 1.5px solid #CBD5E1;
          cursor: pointer;
          accent-color: #0D7A75;
        }

        .customers-full-data-table tbody tr {
          transition: background-color 0.15s;
          border-bottom: 1px solid #F1F5F9;
        }

        .customers-full-data-table tbody tr:hover {
          background-color: #F8FAFC;
        }

        .customers-full-data-table tbody tr.row-selected {
          background-color: #F0FDF9;
        }

        .customers-full-data-table td {
          padding: 14px 18px;
          border-bottom: 1px solid #F1F5F9;
          vertical-align: middle;
          font-size: 0.8125rem;
        }

        .empty-results-cell {
          text-align: center;
          padding: 48px 16px !important;
          color: #64748B;
          font-size: 0.875rem;
        }

        /* Customer Column */
        .customer-identity-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .customer-avatar-round {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        .customer-name-id-wrap {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .customer-primary-name {
          font-weight: 700;
          color: #0F172A;
          font-size: 0.8125rem;
          white-space: nowrap;
        }

        .customer-code-id {
          font-size: 0.75rem;
          color: #64748B;
        }

        /* Contact Column */
        .customer-contact-stack {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .contact-line-item {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #334155;
          font-size: 0.75rem;
          white-space: nowrap;
        }

        .contact-item-icon {
          color: #64748B;
          flex-shrink: 0;
        }

        /* Location Column */
        .customer-location-wrapper {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          max-width: 220px;
        }

        .location-marker-icon {
          color: #64748B;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .location-text-stack {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .location-area-line {
          font-size: 0.78125rem;
          color: #334155;
          line-height: 1.25;
          white-space: nowrap;
        }

        .location-city-line {
          font-size: 0.78125rem;
          color: #334155;
          line-height: 1.25;
          white-space: nowrap;
        }

        /* Numerical columns */
        .orders-count-number {
          font-weight: 600;
          color: #0F172A;
          font-size: 0.8125rem;
        }

        .spent-amount-number {
          font-weight: 700;
          color: #0F172A;
          font-size: 0.8125rem;
        }

        /* Status Column */
        .status-pill-capsule {
          display: inline-block;
          padding: 3.5px 12px;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          text-align: center;
          white-space: nowrap;
        }

        .status-pill-capsule.active {
          background: #DCFCE7;
          color: #16A34A;
        }

        .status-pill-capsule.inactive {
          background: #FEF3C7;
          color: #D97706;
        }

        /* Join Date Column */
        .join-date-stack {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .join-exact-date {
          font-weight: 500;
          color: #0F172A;
          font-size: 0.78125rem;
          white-space: nowrap;
        }

        .join-relative-time {
          font-size: 0.71875rem;
          color: #94A3B8;
          white-space: nowrap;
        }

        /* Actions Column */
        .td-actions-col {
          text-align: right;
        }

        .action-menu-anchor {
          position: relative;
          display: inline-block;
        }

        .table-dot-menu-btn {
          background: none;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          padding: 6px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }

        .table-dot-menu-btn:hover {
          background: #F1F5F9;
          color: #0F172A;
        }

        .action-dropdown-popover {
          position: absolute;
          top: calc(100% + 4px);
          right: 0;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          z-index: 50;
          min-width: 140px;
          padding: 6px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .action-popover-item {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          padding: 7px 10px;
          font-size: 0.75rem;
          font-weight: 500;
          color: #334155;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.15s;
          text-align: left;
        }

        .action-popover-item:hover {
          background: #F1F5F9;
          color: #0D7A75;
        }

        .action-popover-item.danger {
          color: #EF4444;
        }

        .action-popover-item.danger:hover {
          background: #FEF2F2;
          color: #DC2626;
        }

        /* 5. Pagination Footer */
        .customers-pagination-footer-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          padding: 4px 0;
        }

        .pagination-count-summary {
          font-size: 0.8125rem;
          color: #64748B;
        }

        .pagination-count-summary .highlight-count {
          font-weight: 600;
          color: #334155;
        }

        .pagination-buttons-cluster {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .pagination-arrow-btn {
          width: 36px;
          height: 36px;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          background: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748B;
          cursor: pointer;
          transition: all 0.15s;
        }

        .pagination-arrow-btn:hover:not(:disabled) {
          background: #F8FAFC;
          border-color: #CBD5E1;
          color: #0F172A;
        }

        .pagination-arrow-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .pagination-number-btn {
          width: 36px;
          height: 36px;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          background: #FFFFFF;
          font-size: 0.8125rem;
          font-weight: 500;
          color: #334155;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s;
        }

        .pagination-number-btn:hover:not(.active) {
          background: #F8FAFC;
          border-color: #CBD5E1;
        }

        .pagination-number-btn.active {
          background: #0D7A75;
          border-color: #0D7A75;
          color: #FFFFFF;
          font-weight: 700;
        }

        .pagination-gap-dots {
          color: #94A3B8;
          padding: 0 4px;
          font-size: 0.875rem;
        }

        /* 6. Responsive */
        @media (max-width: 1200px) {
          .customers-metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .customers-metrics-grid {
            grid-template-columns: 1fr;
          }

          .customers-header-row {
            flex-direction: column;
            align-items: flex-start;
          }

          .customers-filter-bar-row {
            flex-direction: column;
            align-items: stretch;
          }

          .filter-controls-group {
            width: 100%;
          }

          .filter-styled-select {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
export default AdminCustomersPage;
