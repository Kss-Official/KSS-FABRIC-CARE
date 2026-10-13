import React, { useState, useMemo } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { 
  Truck, 
  Clock, 
  Calendar, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  Plus,
  MapPin,
  SlidersHorizontal,
  Check
} from 'lucide-react';

// Exact baseline orders matching Reference Image 2 Page 1 and overall dataset
const BASELINE_PICKUP_DELIVERY_ORDERS = [
  // Page 1: Exact 8 Rows shown in Reference Image 2
  {
    id: '#LDX10290',
    date: '23 Sep 2026',
    timeStart: '09:00 AM',
    timeEnd: '11:00 AM',
    customer: {
      name: 'Rohan Mehta',
      phone: '+91 98765 43210',
      avatar: 'RM',
      avatarBg: '#CFFAFE',
      avatarColor: '#0891B2',
      address: 'Banaswadi, Bengaluru'
    },
    type: 'Pickup',
    status: 'Assigned',
    driver: {
      name: 'Ravi Kumar',
      phone: '+91 98765 43210',
      initials: 'RK',
      assigned: true
    }
  },
  {
    id: '#LDX10289',
    date: '23 Sep 2026',
    timeStart: '10:00 AM',
    timeEnd: '12:00 PM',
    customer: {
      name: 'Priya Sharma',
      phone: '+91 99876 54321',
      avatar: 'PS',
      avatarBg: '#DBEAFE',
      avatarColor: '#2563EB',
      address: 'HRBR Layout, Bengaluru'
    },
    type: 'Pickup',
    status: 'Pending',
    driver: {
      name: 'Arjun Singh',
      phone: '+91 87654 32109',
      initials: 'AS',
      assigned: true
    }
  },
  {
    id: '#LDX10288',
    date: '23 Sep 2026',
    timeStart: '11:00 AM',
    timeEnd: '01:00 PM',
    customer: {
      name: 'Arjun Nair',
      phone: '+91 91234 56789',
      avatar: 'AN',
      avatarBg: '#CCFBF1',
      avatarColor: '#0D9488',
      address: 'Indiranagar, Bengaluru'
    },
    type: 'Delivery',
    status: 'Assigned',
    driver: {
      name: 'Ravi Kumar',
      phone: '+91 98765 43210',
      initials: 'RK',
      assigned: true
    }
  },
  {
    id: '#LDX10287',
    date: '23 Sep 2026',
    timeStart: '12:00 PM',
    timeEnd: '02:00 PM',
    customer: {
      name: 'Sneha Reddy',
      phone: '+91 99887 66554',
      avatar: 'SR',
      avatarBg: '#EDE9FE',
      avatarColor: '#7C3AED',
      address: 'Whitefield, Bengaluru'
    },
    type: 'Pickup',
    status: 'Completed',
    driver: {
      name: 'Arjun Singh',
      phone: '+91 87654 32109',
      initials: 'AS',
      assigned: true
    }
  },
  {
    id: '#LDX10286',
    date: '23 Sep 2026',
    timeStart: '02:00 PM',
    timeEnd: '04:00 PM',
    customer: {
      name: 'Karan Verma',
      phone: '+91 98712 34567',
      avatar: 'KV',
      avatarBg: '#E0E7FF',
      avatarColor: '#4F46E5',
      address: 'Marathahalli, Bengaluru'
    },
    type: 'Delivery',
    status: 'In Transit',
    driver: {
      name: 'Ravi Kumar',
      phone: '+91 98765 43210',
      initials: 'RK',
      assigned: true
    }
  },
  {
    id: '#LDX10285',
    date: '23 Sep 2026',
    timeStart: '03:00 PM',
    timeEnd: '05:00 PM',
    customer: {
      name: 'Neha Kapoor',
      phone: '+91 87654 32109',
      avatar: 'NK',
      avatarBg: '#FCE7F3',
      avatarColor: '#DB2777',
      address: 'HSR Layout, Bengaluru'
    },
    type: 'Pickup',
    status: 'Assigned',
    driver: {
      name: 'Arjun Singh',
      phone: '+91 87654 32109',
      initials: 'AS',
      assigned: true
    }
  },
  {
    id: '#LDX10284',
    date: '23 Sep 2026',
    timeStart: '04:00 PM',
    timeEnd: '06:00 PM',
    customer: {
      name: 'Amit Shah',
      phone: '+91 91234 99876',
      avatar: 'AM',
      avatarBg: '#F3E8FF',
      avatarColor: '#9333EA',
      address: 'Koramangala, Bengaluru'
    },
    type: 'Delivery',
    status: 'Pending',
    driver: {
      name: 'Not Assigned',
      phone: '-',
      initials: 'NK',
      assigned: false
    }
  },
  {
    id: '#LDX10283',
    date: '23 Sep 2026',
    timeStart: '05:00 PM',
    timeEnd: '07:00 PM',
    customer: {
      name: 'Deepak Reddy',
      phone: '+91 99876 23451',
      avatar: 'DP',
      avatarBg: '#E0E7FF',
      avatarColor: '#4338CA',
      address: 'Jayanagar, Bengaluru'
    },
    type: 'Pickup',
    status: 'Completed',
    driver: {
      name: 'Ravi Kumar',
      phone: '+91 98765 43210',
      initials: 'RK',
      assigned: true
    }
  },

  // Page 2: Orders 9 through 16 (completing the 18 items dataset)
  {
    id: '#LDX10282',
    date: '23 Sep 2026',
    timeStart: '06:00 PM',
    timeEnd: '08:00 PM',
    customer: {
      name: 'Kavya T',
      phone: '+91 93456 78912',
      avatar: 'KT',
      avatarBg: '#FEF08A',
      avatarColor: '#A16207',
      address: 'Malleshwaram, Bengaluru'
    },
    type: 'Delivery',
    status: 'Completed',
    driver: {
      name: 'Mohammed Taha',
      phone: '+91 91234 55678',
      initials: 'MT',
      assigned: true
    }
  },
  {
    id: '#LDX10281',
    date: '22 Sep 2026',
    timeStart: '07:00 PM',
    timeEnd: '09:00 PM',
    customer: {
      name: 'Pavan Kumar',
      phone: '+91 98765 12345',
      avatar: 'PR',
      avatarBg: '#E0F2FE',
      avatarColor: '#0369A1',
      address: 'Hebbal, Bengaluru'
    },
    type: 'Pickup',
    status: 'Completed',
    driver: {
      name: 'Arjun Singh',
      phone: '+91 87654 32109',
      initials: 'AS',
      assigned: true
    }
  },
  {
    id: '#LDX10280',
    date: '23 Sep 2026',
    timeStart: '08:00 AM',
    timeEnd: '10:00 AM',
    customer: {
      name: 'Vikram Malhotra',
      phone: '+91 98765 22334',
      avatar: 'VM',
      avatarBg: '#FBCFE8',
      avatarColor: '#BE185D',
      address: 'Indiranagar, Bengaluru'
    },
    type: 'Pickup',
    status: 'Completed',
    driver: {
      name: 'Ravi Kumar',
      phone: '+91 98765 43210',
      initials: 'RK',
      assigned: true
    }
  },
  {
    id: '#LDX10279',
    date: '23 Sep 2026',
    timeStart: '09:30 AM',
    timeEnd: '11:30 AM',
    customer: {
      name: 'Ananya Iyer',
      phone: '+91 97654 33445',
      avatar: 'AI',
      avatarBg: '#DDD6FE',
      avatarColor: '#6D28D9',
      address: 'Domlur, Bengaluru'
    },
    type: 'Delivery',
    status: 'Completed',
    driver: {
      name: 'Mohammed Taha',
      phone: '+91 91234 55678',
      initials: 'MT',
      assigned: true
    }
  },
  {
    id: '#LDX10278',
    date: '23 Sep 2026',
    timeStart: '10:30 AM',
    timeEnd: '12:30 PM',
    customer: {
      name: 'Suresh Raina',
      phone: '+91 96543 44556',
      avatar: 'SR',
      avatarBg: '#FEF3C7',
      avatarColor: '#B45309',
      address: 'Koramangala, Bengaluru'
    },
    type: 'Pickup',
    status: 'Completed',
    driver: {
      name: 'Arjun Singh',
      phone: '+91 87654 32109',
      initials: 'AS',
      assigned: true
    }
  },
  {
    id: '#LDX10277',
    date: '23 Sep 2026',
    timeStart: '01:00 PM',
    timeEnd: '03:00 PM',
    customer: {
      name: 'Meera Sen',
      phone: '+91 95432 55667',
      avatar: 'MS',
      avatarBg: '#CCFBF1',
      avatarColor: '#0F766E',
      address: 'Bellandur, Bengaluru'
    },
    type: 'Delivery',
    status: 'Completed',
    driver: {
      name: 'Ravi Kumar',
      phone: '+91 98765 43210',
      initials: 'RK',
      assigned: true
    }
  },
  {
    id: '#LDX10276',
    date: '23 Sep 2026',
    timeStart: '02:30 PM',
    timeEnd: '04:30 PM',
    customer: {
      name: 'Rajesh Gupta',
      phone: '+91 94321 66778',
      avatar: 'RG',
      avatarBg: '#CFFAFE',
      avatarColor: '#0E7490',
      address: 'Sarjapur, Bengaluru'
    },
    type: 'Pickup',
    status: 'Completed',
    driver: {
      name: 'Arjun Singh',
      phone: '+91 87654 32109',
      initials: 'AS',
      assigned: true
    }
  },
  {
    id: '#LDX10275',
    date: '23 Sep 2026',
    timeStart: '03:30 PM',
    timeEnd: '05:30 PM',
    customer: {
      name: 'Pooja Joshi',
      phone: '+91 93210 77889',
      avatar: 'PJ',
      avatarBg: '#FCE7F3',
      avatarColor: '#9D174D',
      address: 'Electronic City, Bengaluru'
    },
    type: 'Delivery',
    status: 'Completed',
    driver: {
      name: 'Mohammed Taha',
      phone: '+91 91234 55678',
      initials: 'MT',
      assigned: true
    }
  },

  // Page 3: Orders 17 and 18
  {
    id: '#LDX10274',
    date: '23 Sep 2026',
    timeStart: '04:30 PM',
    timeEnd: '06:30 PM',
    customer: {
      name: 'Gaurav Bhatia',
      phone: '+91 92109 88990',
      avatar: 'GB',
      avatarBg: '#EDE9FE',
      avatarColor: '#5B21B6',
      address: 'Ulsoor, Bengaluru'
    },
    type: 'Pickup',
    status: 'Completed',
    driver: {
      name: 'Ravi Kumar',
      phone: '+91 98765 43210',
      initials: 'RK',
      assigned: true
    }
  },
  {
    id: '#LDX10273',
    date: '23 Sep 2026',
    timeStart: '05:30 PM',
    timeEnd: '07:30 PM',
    customer: {
      name: 'Divya Nair',
      phone: '+91 91098 99001',
      avatar: 'DN',
      avatarBg: '#DCFCE7',
      avatarColor: '#15803D',
      address: 'Frazer Town, Bengaluru'
    },
    type: 'Delivery',
    status: 'Completed',
    driver: {
      name: 'Arjun Singh',
      phone: '+91 87654 32109',
      initials: 'AS',
      assigned: true
    }
  }
];

export const AdminPickupDeliveryPage = () => {
  const { 
    orders: contextOrders, 
    setIsAssignOrderModalOpen, 
    setAssigningOrder 
  } = useAdmin();

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pickups' | 'deliveries'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Dropdown states
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDateRangeDropdownOpen, setIsDateRangeDropdownOpen] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState('all');
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('Tuesday, 23 Sep 2026');

  // Exact metric counts matching Reference Image 2
  const metrics = {
    pickups: 10,
    deliveries: 8,
    completed: 15,
    pending: 7
  };

  // Synchronize orders with dynamic updates from AdminContext if any
  const combinedOrders = useMemo(() => {
    // Map context updates into the baseline orders
    const contextMap = new Map();
    (contextOrders || []).forEach(o => {
      // Map both 5-digit and short IDs
      const cleanId = o.id.replace('#LDX12', '#LDX1028');
      contextMap.set(o.id, o);
      contextMap.set(cleanId, o);
    });

    return BASELINE_PICKUP_DELIVERY_ORDERS.map(baseOrd => {
      const live = contextMap.get(baseOrd.id);
      if (!live) return baseOrd;

      // Extract driver info if live driver changed
      let driverName = baseOrd.driver.name;
      let driverPhone = baseOrd.driver.phone;
      let driverInitials = baseOrd.driver.initials;
      let isAssigned = baseOrd.driver.assigned;

      if (live.driver && live.driver !== 'Not Assigned') {
        isAssigned = true;
        const namePart = live.driver.split('(')[0]?.trim();
        const phonePart = live.driver.match(/\((.*?)\)/)?.[1]?.trim() || '+91 98765 43210';
        driverName = namePart || live.driver;
        driverPhone = phonePart;
        driverInitials = driverName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'DR';
      }

      return {
        ...baseOrd,
        status: live.status === 'Ready for Delivery' ? 'In Transit' : (live.status === 'Pending Pickup' ? 'Pending' : (live.status || baseOrd.status)),
        driver: {
          ...baseOrd.driver,
          name: driverName,
          phone: driverPhone,
          initials: driverInitials,
          assigned: isAssigned
        }
      };
    });
  }, [contextOrders]);

  // Tab counts
  const totalAllCount = combinedOrders.length;
  const totalPickupsCount = combinedOrders.filter(o => o.type === 'Pickup').length;
  const totalDeliveriesCount = combinedOrders.filter(o => o.type === 'Delivery').length;

  // Filter logic
  const filteredList = useMemo(() => {
    return combinedOrders.filter(ord => {
      // Tab filter
      if (activeTab === 'pickups' && ord.type !== 'Pickup') return false;
      if (activeTab === 'deliveries' && ord.type !== 'Delivery') return false;

      // Dropdown status filter
      if (statusFilter !== 'all' && ord.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchId = ord.id.toLowerCase().includes(query);
        const matchName = ord.customer.name.toLowerCase().includes(query);
        const matchPhone = ord.customer.phone.includes(query);
        const matchAddress = ord.customer.address.toLowerCase().includes(query);
        const matchDriver = ord.driver.name.toLowerCase().includes(query);
        if (!matchId && !matchName && !matchPhone && !matchAddress && !matchDriver) {
          return false;
        }
      }

      return true;
    });
  }, [combinedOrders, activeTab, statusFilter, searchTerm]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  const currentPageClamped = Math.min(currentPage, totalPages);
  const startIndex = (currentPageClamped - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredList.length);
  const currentPageOrders = filteredList.slice(startIndex, endIndex);

  // Checkbox selection
  const handleToggleSelectAll = () => {
    const currentPageIds = currentPageOrders.map(o => o.id);
    const allSelectedOnPage = currentPageIds.every(id => selectedOrderIds.includes(id));
    if (allSelectedOnPage) {
      setSelectedOrderIds(prev => prev.filter(id => !currentPageIds.includes(id)));
    } else {
      setSelectedOrderIds(prev => Array.from(new Set([...prev, ...currentPageIds])));
    }
  };

  const handleToggleSelectOrder = (id) => {
    setSelectedOrderIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const openAssignModalForOrder = (ord) => {
    setAssigningOrder({
      id: ord.id,
      date: ord.date,
      pickupTime: `${ord.timeStart} – ${ord.timeEnd}`,
      customer: {
        name: ord.customer.name,
        phone: ord.customer.phone,
        address: ord.customer.address
      },
      services: ['Dry Cleaning'],
      amount: 450,
      type: ord.type
    });
    setIsAssignOrderModalOpen(true);
  };

  return (
    <div className="admin-pickup-page animate-fade-in">
      {/* Header Row */}
      <div className="pickup-header-row">
        <div className="pickup-header-left">
          <h1 className="pickup-page-title">Pickup & Delivery</h1>
          <p className="pickup-page-subtitle">Manage and track today's pickups and deliveries.</p>
        </div>

        <div className="pickup-header-right">
          {/* Date Selector Pill */}
          <div className="header-dropdown-wrapper">
            <button 
              className="date-selector-pill"
              onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
              type="button"
            >
              <Calendar size={17} className="pill-calendar-icon" />
              <span className="pill-date-text">{selectedDate}</span>
              <ChevronDown size={16} className="pill-chevron-icon" />
            </button>
            {dateDropdownOpen && (
              <div className="header-dropdown-popover">
                {['Tuesday, 23 Sep 2026', 'Wednesday, 24 Sep 2026', 'Thursday, 25 Sep 2026'].map(d => (
                  <button 
                    key={d} 
                    className={`dropdown-item ${selectedDate === d ? 'active' : ''}`}
                    onClick={() => { setSelectedDate(d); setDateDropdownOpen(false); }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* + Assign Order Button */}
          <button 
            className="btn-assign-order"
            onClick={() => {
              setAssigningOrder(null);
              setIsAssignOrderModalOpen(true);
            }}
            type="button"
          >
            <Plus size={18} strokeWidth={2.4} />
            <span>Assign Order</span>
          </button>
        </div>
      </div>

      {/* 4 Pastel Metric Summary Cards */}
      <div className="pickup-metrics-grid">
        {/* Card 1: Scheduled Pickups */}
        <div className="pickup-metric-card card-blue">
          <div className="metric-icon-badge badge-blue">
            <Truck size={24} color="#0284C7" strokeWidth={1.8} />
          </div>
          <div className="metric-text-group">
            <div className="metric-number">{metrics.pickups}</div>
            <div className="metric-label">Scheduled Pickups</div>
          </div>
        </div>

        {/* Card 2: Scheduled Deliveries */}
        <div className="pickup-metric-card card-peach">
          <div className="metric-icon-badge badge-peach">
            <Truck size={24} color="#EA580C" strokeWidth={1.8} />
          </div>
          <div className="metric-text-group">
            <div className="metric-number">{metrics.deliveries}</div>
            <div className="metric-label">Scheduled Deliveries</div>
          </div>
        </div>

        {/* Card 3: Total Completed */}
        <div className="pickup-metric-card card-green">
          <div className="metric-icon-badge badge-green">
            <Check size={24} color="#16A34A" strokeWidth={2.6} />
          </div>
          <div className="metric-text-group">
            <div className="metric-number">{metrics.completed}</div>
            <div className="metric-label">Total Completed</div>
          </div>
        </div>

        {/* Card 4: Pending */}
        <div className="pickup-metric-card card-purple">
          <div className="metric-icon-badge badge-purple">
            <Clock size={24} color="#9333EA" strokeWidth={1.8} />
          </div>
          <div className="metric-text-group">
            <div className="metric-number">{metrics.pending}</div>
            <div className="metric-label">Pending</div>
          </div>
        </div>
      </div>

      {/* Unified Main Card Container */}
      <div className="pickup-main-table-card">
        {/* Top Header / Toolbar inside Card */}
        <div className="card-top-toolbar">
          {/* Left Tabs */}
          <div className="toolbar-tabs-list">
            <button 
              className={`toolbar-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
              type="button"
            >
              All ({totalAllCount})
            </button>
            <button 
              className={`toolbar-tab-btn ${activeTab === 'pickups' ? 'active' : ''}`}
              onClick={() => { setActiveTab('pickups'); setCurrentPage(1); }}
              type="button"
            >
              Pickups ({totalPickupsCount})
            </button>
            <button 
              className={`toolbar-tab-btn ${activeTab === 'deliveries' ? 'active' : ''}`}
              onClick={() => { setActiveTab('deliveries'); setCurrentPage(1); }}
              type="button"
            >
              Deliveries ({totalDeliveriesCount})
            </button>
          </div>

          {/* Right Controls */}
          <div className="toolbar-controls-group">
            {/* Search Input Box */}
            <div className="search-input-wrapper">
              <Search size={16} className="search-magnifier-icon" />
              <input 
                type="text"
                placeholder="Search by Order ID, customer, or s..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="search-box-field"
              />
            </div>

            {/* Filters Dropdown Button */}
            <div className="toolbar-dropdown-wrapper">
              <button 
                className={`toolbar-pill-btn ${statusFilter !== 'all' ? 'has-filter' : ''}`}
                onClick={() => {
                  setIsFilterDropdownOpen(!isFilterDropdownOpen);
                  setIsDateRangeDropdownOpen(false);
                }}
                type="button"
              >
                <SlidersHorizontal size={15} className="toolbar-pill-icon" />
                <span>Filters</span>
                <ChevronDown size={14} className="toolbar-pill-chevron" />
              </button>

              {isFilterDropdownOpen && (
                <div className="dropdown-popover-card animate-scale-in">
                  <div className="popover-header">Filter by Status</div>
                  {['all', 'assigned', 'pending', 'in transit', 'completed'].map(st => (
                    <button
                      key={st}
                      className={`popover-option ${statusFilter === st ? 'selected' : ''}`}
                      onClick={() => {
                        setStatusFilter(st);
                        setIsFilterDropdownOpen(false);
                        setCurrentPage(1);
                      }}
                    >
                      {st === 'all' ? 'All Statuses' : st.charAt(0).toUpperCase() + st.slice(1)}
                    </button>
                  ))}
                  {statusFilter !== 'all' && (
                    <button 
                      className="popover-reset-btn"
                      onClick={() => {
                        setStatusFilter('all');
                        setIsFilterDropdownOpen(false);
                        setCurrentPage(1);
                      }}
                    >
                      Reset Filter
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Select Date Range Dropdown Button */}
            <div className="toolbar-dropdown-wrapper">
              <button 
                className="toolbar-pill-btn"
                onClick={() => {
                  setIsDateRangeDropdownOpen(!isDateRangeDropdownOpen);
                  setIsFilterDropdownOpen(false);
                }}
                type="button"
              >
                <Calendar size={15} className="toolbar-pill-icon" />
                <span>Select Date Range</span>
                <ChevronDown size={14} className="toolbar-pill-chevron" />
              </button>

              {isDateRangeDropdownOpen && (
                <div className="dropdown-popover-card animate-scale-in">
                  <div className="popover-header">Date Range</div>
                  {['all', 'today', 'tomorrow', 'this-week'].map(r => (
                    <button
                      key={r}
                      className={`popover-option ${selectedDateRange === r ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedDateRange(r);
                        setIsDateRangeDropdownOpen(false);
                      }}
                    >
                      {r === 'all' ? 'All Dates' : r === 'today' ? 'Today (23 Sep 2026)' : r === 'tomorrow' ? 'Tomorrow (24 Sep 2026)' : 'This Week'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="pickup-table-wrapper">
          <table className="pickup-full-table">
            <thead>
              <tr>
                <th className="th-col-checkbox">
                  <input 
                    type="checkbox" 
                    className="styled-table-checkbox"
                    checked={currentPageOrders.length > 0 && currentPageOrders.every(o => selectedOrderIds.includes(o.id))}
                    onChange={handleToggleSelectAll}
                  />
                </th>
                <th className="th-col-time">TIME</th>
                <th className="th-col-orderid">ORDER ID</th>
                <th className="th-col-customer">CUSTOMER</th>
                <th className="th-col-type">TYPE</th>
                <th className="th-col-address">ADDRESS</th>
                <th className="th-col-status">STATUS</th>
                <th className="th-col-driver">DRIVER</th>
              </tr>
            </thead>
            <tbody>
              {currentPageOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-state-cell">
                    <p>No orders found matching your search or filters.</p>
                  </td>
                </tr>
              ) : (
                currentPageOrders.map((ord) => {
                  const isChecked = selectedOrderIds.includes(ord.id);
                  const isAssigned = ord.driver && ord.driver.assigned;

                  return (
                    <tr key={ord.id} className={isChecked ? 'row-selected' : ''}>
                      {/* Checkbox */}
                      <td className="td-col-checkbox">
                        <input 
                          type="checkbox" 
                          className="styled-table-checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelectOrder(ord.id)}
                        />
                      </td>

                      {/* TIME */}
                      <td className="td-col-time">
                        <div className="time-stack">
                          <span className="time-start">{ord.timeStart}</span>
                          <span className="time-end">{ord.timeEnd}</span>
                        </div>
                      </td>

                      {/* ORDER ID */}
                      <td className="td-col-orderid">
                        <div className="order-id-stack">
                          <span className="order-id-number">{ord.id}</span>
                          <span className="order-id-date">{ord.date}</span>
                        </div>
                      </td>

                      {/* CUSTOMER */}
                      <td className="td-col-customer">
                        <div className="customer-info-cell">
                          <div 
                            className="customer-avatar-circle"
                            style={{ 
                              backgroundColor: ord.customer.avatarBg, 
                              color: ord.customer.avatarColor 
                            }}
                          >
                            {ord.customer.avatar}
                          </div>
                          <div className="customer-text-meta">
                            <span className="customer-name-text">{ord.customer.name}</span>
                            <span className="customer-phone-text">{ord.customer.phone}</span>
                          </div>
                        </div>
                      </td>

                      {/* TYPE */}
                      <td className="td-col-type">
                        <span className={`capsule-type ${ord.type.toLowerCase()}`}>
                          {ord.type}
                        </span>
                      </td>

                      {/* ADDRESS */}
                      <td className="td-col-address">
                        <div className="address-with-pin">
                          <MapPin size={15} className="location-pin-icon" />
                          <span className="address-label-text">{ord.customer.address}</span>
                        </div>
                      </td>

                      {/* STATUS */}
                      <td className="td-col-status">
                        <span className={`capsule-status ${ord.status.toLowerCase().replace(/\s+/g, '-')}`}>
                          {ord.status}
                        </span>
                      </td>

                      {/* DRIVER */}
                      <td className="td-col-driver">
                        {isAssigned ? (
                          <div className="driver-assigned-cell">
                            <div className="driver-avatar-circle dark">
                              {ord.driver.initials}
                            </div>
                            <div className="driver-meta-text">
                              <span className="driver-name">{ord.driver.name}</span>
                              <span className="driver-phone">{ord.driver.phone}</span>
                            </div>
                          </div>
                        ) : (
                          <div 
                            className="driver-assigned-cell unassigned"
                            onClick={() => openAssignModalForOrder(ord)}
                            title="Click to assign driver"
                          >
                            <div className="driver-avatar-circle unassigned">
                              {ord.driver.initials || 'NK'}
                            </div>
                            <div className="driver-meta-text">
                              <span className="driver-name unassigned">Not Assigned</span>
                              <span className="driver-phone unassigned">-</span>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="table-pagination-footer">
          <div className="pagination-count-label">
            Showing <span className="font-semibold">{filteredList.length === 0 ? 0 : startIndex + 1}–{endIndex}</span> of <span className="font-semibold">{filteredList.length}</span> orders
          </div>

          <div className="pagination-action-buttons">
            <button 
              className="page-chevron-btn" 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPageClamped <= 1}
              type="button"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button 
                key={pageNum}
                className={`page-digit-btn ${currentPageClamped === pageNum ? 'active' : ''}`}
                onClick={() => setCurrentPage(pageNum)}
                type="button"
              >
                {pageNum}
              </button>
            ))}

            <button 
              className="page-chevron-btn" 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPageClamped >= totalPages}
              type="button"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Scoped CSS Styles matching Reference Image 2 pixel-by-pixel */}
      <style>{`
        .admin-pickup-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
          padding-bottom: 40px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }

        /* 1. Header Row */
        .pickup-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }

        .pickup-page-title {
          font-size: 1.625rem;
          font-weight: 700;
          color: #0F172A;
          margin: 0 0 4px 0;
          letter-spacing: -0.02em;
        }

        .pickup-page-subtitle {
          font-size: 0.875rem;
          color: #64748B;
          margin: 0;
          font-weight: 400;
        }

        .pickup-header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-dropdown-wrapper {
          position: relative;
        }

        .date-selector-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          border-radius: 10px;
          padding: 9px 16px;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 600;
          color: #1E293B;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
          transition: all 0.2s ease;
        }

        .date-selector-pill:hover {
          background: #F8FAFC;
          border-color: #94A3B8;
        }

        .pill-calendar-icon {
          color: #475569;
        }

        .pill-date-text {
          white-space: nowrap;
        }

        .pill-chevron-icon {
          color: #64748B;
          margin-left: 2px;
        }

        .header-dropdown-popover {
          position: absolute;
          top: calc(100% + 6px);
          right: 0;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          z-index: 50;
          min-width: 220px;
          padding: 6px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .header-dropdown-popover .dropdown-item {
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

        .header-dropdown-popover .dropdown-item:hover,
        .header-dropdown-popover .dropdown-item.active {
          background: #F1F5F9;
          color: #0D7A75;
          font-weight: 600;
        }

        .btn-assign-order {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #0D7A75;
          color: #FFFFFF;
          border: none;
          border-radius: 10px;
          padding: 9px 18px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(13, 122, 117, 0.2);
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .btn-assign-order:hover {
          background: #09635F;
          box-shadow: 0 3px 6px rgba(13, 122, 117, 0.25);
          transform: translateY(-1px);
        }

        /* 2. Four Pastel Metric Cards */
        .pickup-metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .pickup-metric-card {
          border-radius: 18px;
          padding: 18px 22px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-sizing: border-box;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .pickup-metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 14px -3px rgba(0, 0, 0, 0.05);
        }

        /* Card background tints */
        .pickup-metric-card.card-blue {
          background: #EFF6FF;
          border: 1px solid rgba(219, 234, 254, 0.8);
        }
        .pickup-metric-card.card-peach {
          background: #FFF7ED;
          border: 1px solid rgba(254, 237, 213, 0.8);
        }
        .pickup-metric-card.card-green {
          background: #F0FDF4;
          border: 1px solid rgba(220, 252, 231, 0.8);
        }
        .pickup-metric-card.card-purple {
          background: #FAF5FF;
          border: 1px solid rgba(243, 232, 255, 0.8);
        }

        /* Icon badges */
        .metric-icon-badge {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .metric-icon-badge.badge-blue {
          background: #DBEAFE;
        }
        .metric-icon-badge.badge-peach {
          background: #FFEDD5;
        }
        .metric-icon-badge.badge-green {
          background: #DCFCE7;
        }
        .metric-icon-badge.badge-purple {
          background: #F3E8FF;
        }

        .metric-text-group {
          display: flex;
          flex-direction: column;
        }

        .metric-number {
          font-size: 1.875rem;
          font-weight: 700;
          color: #0F172A;
          line-height: 1.1;
          letter-spacing: -0.02em;
        }

        .metric-label {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #64748B;
          margin-top: 4px;
          white-space: nowrap;
        }

        /* 3. Main Unified Table Card */
        .pickup-main-table-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        /* Top Toolbar inside Main Card */
        .card-top-toolbar {
          padding: 14px 22px;
          border-bottom: 1px solid #F1F5F9;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }

        .toolbar-tabs-list {
          display: flex;
          align-items: center;
          gap: 28px;
        }

        .toolbar-tab-btn {
          background: none;
          border: none;
          padding: 8px 0;
          font-size: 0.875rem;
          font-weight: 500;
          color: #64748B;
          cursor: pointer;
          position: relative;
          transition: color 0.15s;
          outline: none;
        }

        .toolbar-tab-btn:hover {
          color: #1E293B;
        }

        .toolbar-tab-btn.active {
          color: #0D7A75;
          font-weight: 700;
        }

        .toolbar-tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -15px;
          left: 0;
          right: 0;
          height: 2.5px;
          background: #0D7A75;
          border-radius: 2px 2px 0 0;
        }

        .toolbar-controls-group {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-magnifier-icon {
          position: absolute;
          left: 12px;
          color: #94A3B8;
          pointer-events: none;
        }

        .search-box-field {
          height: 38px;
          width: 250px;
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          border-radius: 10px;
          padding: 0 12px 0 36px;
          font-size: 0.8125rem;
          color: #0F172A;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .search-box-field::placeholder {
          color: #94A3B8;
        }

        .search-box-field:focus {
          border-color: #0D7A75;
          box-shadow: 0 0 0 3px rgba(13, 122, 117, 0.1);
        }

        .toolbar-dropdown-wrapper {
          position: relative;
        }

        .toolbar-pill-btn {
          height: 38px;
          padding: 0 14px;
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
        }

        .toolbar-pill-btn:hover {
          background: #F8FAFC;
          border-color: #94A3B8;
        }

        .toolbar-pill-btn.has-filter {
          border-color: #0D7A75;
          color: #0D7A75;
          background: #F0FDF4;
        }

        .toolbar-pill-icon {
          color: #475569;
        }

        .toolbar-pill-chevron {
          color: #64748B;
        }

        .dropdown-popover-card {
          position: absolute;
          top: calc(100% + 6px);
          right: 0;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          z-index: 50;
          min-width: 180px;
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .popover-header {
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          color: #94A3B8;
          padding: 4px 8px;
          letter-spacing: 0.05em;
        }

        .popover-option {
          background: none;
          border: none;
          padding: 7px 10px;
          text-align: left;
          font-size: 0.8125rem;
          color: #334155;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: background 0.15s;
        }

        .popover-option:hover,
        .popover-option.selected {
          background: #F1F5F9;
          color: #0D7A75;
          font-weight: 600;
        }

        .popover-reset-btn {
          margin-top: 4px;
          padding: 6px 8px;
          background: #FEF2F2;
          border: none;
          border-radius: 6px;
          color: #DC2626;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          text-align: center;
        }

        /* 4. Table Structure */
        .pickup-table-wrapper {
          overflow-x: auto;
          width: 100%;
        }

        .pickup-full-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          text-align: left;
        }

        .pickup-full-table thead tr {
          border-bottom: 1px solid #F1F5F9;
        }

        .pickup-full-table th {
          font-size: 0.6875rem;
          font-weight: 700;
          color: #64748B;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          padding: 14px 16px;
          background: #FFFFFF;
          border-bottom: 1px solid #F1F5F9;
          white-space: nowrap;
        }

        .th-col-checkbox,
        .td-col-checkbox {
          width: 44px;
          padding-left: 22px !important;
          padding-right: 0 !important;
        }

        .styled-table-checkbox {
          width: 16px;
          height: 16px;
          border-radius: 4px;
          border: 1.5px solid #CBD5E1;
          cursor: pointer;
          accent-color: #0D7A75;
        }

        .pickup-full-table tbody tr {
          transition: background-color 0.15s;
          border-bottom: 1px solid #F1F5F9;
        }

        .pickup-full-table tbody tr:hover {
          background-color: #F8FAFC;
        }

        .pickup-full-table tbody tr.row-selected {
          background-color: #F0FDF9;
        }

        .pickup-full-table td {
          padding: 13px 16px;
          border-bottom: 1px solid #F1F5F9;
          vertical-align: middle;
          font-size: 0.8125rem;
        }

        .empty-state-cell {
          text-align: center;
          padding: 48px 16px !important;
          color: #64748B;
          font-size: 0.875rem;
        }

        /* Column: TIME */
        .time-stack {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .time-start {
          font-weight: 700;
          color: #0F172A;
          font-size: 0.8125rem;
        }

        .time-end {
          color: #94A3B8;
          font-size: 0.75rem;
          font-weight: 400;
        }

        /* Column: ORDER ID */
        .order-id-stack {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .order-id-number {
          font-weight: 700;
          color: #0F172A;
          font-size: 0.8125rem;
        }

        .order-id-date {
          color: #94A3B8;
          font-size: 0.75rem;
          font-weight: 400;
        }

        /* Column: CUSTOMER */
        .customer-info-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .customer-avatar-circle {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        .customer-text-meta {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .customer-name-text {
          font-weight: 600;
          color: #0F172A;
          font-size: 0.8125rem;
          white-space: nowrap;
        }

        .customer-phone-text {
          font-size: 0.75rem;
          color: #64748B;
          font-weight: 400;
          white-space: nowrap;
        }

        /* Column: TYPE */
        .capsule-type {
          display: inline-block;
          padding: 3.5px 12px;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .capsule-type.pickup {
          background: #ECFEFF;
          color: #0891B2;
        }

        .capsule-type.delivery {
          background: #FAF5FF;
          color: #9333EA;
        }

        /* Column: ADDRESS */
        .address-with-pin {
          display: flex;
          align-items: center;
          gap: 6px;
          max-width: 200px;
        }

        .location-pin-icon {
          color: #94A3B8;
          flex-shrink: 0;
        }

        .address-label-text {
          font-size: 0.8125rem;
          color: #334155;
          font-weight: 400;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Column: STATUS */
        .capsule-status {
          display: inline-block;
          padding: 3.5px 12px;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          white-space: nowrap;
          text-align: center;
        }

        .capsule-status.assigned {
          background: #DCFCE7;
          color: #16A34A;
        }

        .capsule-status.pending {
          background: #FEF3C7;
          color: #D97706;
        }

        .capsule-status.completed {
          background: #DCFCE7;
          color: #16A34A;
        }

        .capsule-status.in-transit {
          background: #E0F2FE;
          color: #0284C7;
        }

        /* Column: DRIVER */
        .driver-assigned-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .driver-avatar-circle {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.6875rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        .driver-avatar-circle.dark {
          background: #0F172A;
          color: #FFFFFF;
        }

        .driver-avatar-circle.unassigned {
          background: #E2E8F0;
          color: #64748B;
        }

        .driver-meta-text {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .driver-name {
          font-weight: 600;
          color: #0F172A;
          font-size: 0.8125rem;
          white-space: nowrap;
        }

        .driver-name.unassigned {
          color: #334155;
          font-weight: 500;
        }

        .driver-phone {
          font-size: 0.6875rem;
          color: #64748B;
          font-weight: 400;
          white-space: nowrap;
        }

        .driver-phone.unassigned {
          color: #94A3B8;
        }

        .driver-assigned-cell.unassigned {
          cursor: pointer;
          border-radius: 8px;
          padding: 2px 4px;
          transition: background 0.15s;
        }

        .driver-assigned-cell.unassigned:hover {
          background: #F1F5F9;
        }

        /* 5. Pagination Footer */
        .table-pagination-footer {
          padding: 14px 22px;
          border-top: 1px solid #F1F5F9;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #FFFFFF;
          flex-wrap: wrap;
          gap: 12px;
        }

        .pagination-count-label {
          font-size: 0.8125rem;
          color: #64748B;
          font-weight: 400;
        }

        .pagination-count-label .font-semibold {
          font-weight: 600;
          color: #334155;
        }

        .pagination-action-buttons {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .page-chevron-btn {
          width: 34px;
          height: 34px;
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

        .page-chevron-btn:hover:not(:disabled) {
          background: #F8FAFC;
          border-color: #CBD5E1;
          color: #0F172A;
        }

        .page-chevron-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .page-digit-btn {
          width: 34px;
          height: 34px;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          background: #FFFFFF;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #334155;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s;
        }

        .page-digit-btn:hover:not(.active) {
          background: #F8FAFC;
          border-color: #CBD5E1;
        }

        .page-digit-btn.active {
          background: #0D7A75;
          border-color: #0D7A75;
          color: #FFFFFF;
          font-weight: 700;
        }

        /* 6. Responsive Breakdown */
        @media (max-width: 1200px) {
          .pickup-metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .pickup-metrics-grid {
            grid-template-columns: 1fr;
          }

          .pickup-header-row {
            flex-direction: column;
            align-items: flex-start;
          }

          .card-top-toolbar {
            flex-direction: column;
            align-items: flex-start;
          }

          .toolbar-controls-group {
            width: 100%;
          }

          .search-box-field {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
