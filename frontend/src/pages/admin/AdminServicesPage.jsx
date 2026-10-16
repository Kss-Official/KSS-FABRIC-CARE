import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAdmin } from '../../context/AdminContext';
import { 
  LayoutGrid,
  CheckCircle2, 
  PauseCircle, 
  Tag, 
  Plus, 
  Search, 
  ChevronDown,
  RotateCcw, 
  Pencil, 
  MoreVertical, 
  ChevronLeft, 
  ChevronRight,
  X,
  Trash2,
  Check
} from 'lucide-react';

// Exact SVG icons matching Reference Image 2
const ShirtIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
  </svg>
);

const IndigoGarmentIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3L2 7v3h3v10h14V10h3V7l-4-4-3 2a4 4 0 0 1-6 0L6 3z" />
  </svg>
);

const DiamondLayersIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
);

const SuitHangerIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="4" r="2" />
    <path d="M12 6v2l-8 5.5a1 1 0 0 0 .5 1.5h15a1 1 0 0 0 .5-1.5L12 8" />
    <path d="M7 15v5" />
    <path d="M17 15v5" />
  </svg>
);

const SareeFabricIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <path d="M7 17L17 7" />
    <path d="M7 11L11 7" />
    <path d="M13 17L17 13" />
  </svg>
);

const IroningIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 17h14a2 2 0 0 0 2-2c0-3.5-3-7-7.5-7H6a2 2 0 0 0-2 2v7z" />
    <path d="M6 8V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3" />
  </svg>
);

const BlanketBedIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DB2777" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4v16" />
    <path d="M2 8h18a2 2 0 0 1 2 2v10" />
    <path d="M2 17h20" />
    <path d="M6 8v4" />
  </svg>
);

const CurtainWindowIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18" />
    <path d="M9 21V9" />
    <path d="M15 21V9" />
  </svg>
);

export const AdminServicesPage = () => {
  const { 
    services, 
    setServices,
    setIsAddServiceModalOpen, 
    toggleServiceStatus,
    deleteService
  } = useAdmin();

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Selection & Pagination
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Row Action Dropdown Popover
  const [openActionMenuId, setOpenActionMenuId] = useState(null);

  // Edit Service Modal state
  const [editingService, setEditingService] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    category: 'Wash & Fold',
    price: '',
    turnaround: '1–2 days',
    status: 'Active',
    description: ''
  });

  // Lock background scroll when Edit Service modal is open
  useEffect(() => {
    const wrapper = document.querySelector('.admin-main-wrapper');
    if (editingService) {
      if (wrapper) wrapper.classList.add('admin-scroll-locked');
    } else {
      if (wrapper) wrapper.classList.remove('admin-scroll-locked');
    }
    return () => {
      if (wrapper) wrapper.classList.remove('admin-scroll-locked');
    };
  }, [editingService]);

  // Dynamic Metrics Calculation
  const totalServices = services.length;
  const activeServices = services.filter(s => s.status === 'Active').length;
  const inactiveServices = services.filter(s => s.status === 'Inactive').length;
  const avgPrice = totalServices > 0 
    ? Math.round(services.reduce((acc, s) => acc + (Number(s.price) || 0), 0) / totalServices) 
    : 0;

  // Filtered Services
  const filteredServices = useMemo(() => {
    return services.filter(s => {
      if (statusFilter !== 'all' && (s.status || '').toLowerCase() !== statusFilter.toLowerCase()) return false;
      if (typeFilter !== 'all') {
        const itemType = (s.type || (Number(s.price) > 200 ? 'Premium' : 'Standard')).toLowerCase();
        if (itemType !== typeFilter.toLowerCase()) return false;
      }
      if (categoryFilter !== 'all' && (s.category || '').toLowerCase() !== categoryFilter.toLowerCase()) return false;
      if (searchTerm && searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesName = s.name?.toLowerCase().includes(query);
        const matchesDesc = s.description && s.description.toLowerCase().includes(query);
        const matchesCat = s.category?.toLowerCase().includes(query);
        const matchesPrice = String(s.price).includes(query);
        if (!matchesName && !matchesDesc && !matchesCat && !matchesPrice) return false;
      }
      return true;
    });
  }, [services, statusFilter, typeFilter, categoryFilter, searchTerm]);

  // Paginated Services
  const totalPages = Math.max(1, Math.ceil(filteredServices.length / itemsPerPage));
  const currentServices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredServices.slice(start, start + itemsPerPage);
  }, [filteredServices, currentPage, itemsPerPage]);

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, filteredServices.length);

  // Checkbox helpers
  const isAllSelected = currentServices.length > 0 && currentServices.every(s => selectedIds.includes(s.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(prev => prev.filter(id => !currentServices.some(s => s.id === id)));
    } else {
      const pageIds = currentServices.map(s => s.id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleReset = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
    setCategoryFilter('all');
    setCurrentPage(1);
  };

  // Open Edit Modal
  const handleOpenEdit = (service) => {
    setEditingService(service);
    setEditForm({
      name: service.name,
      category: service.category,
      price: service.price,
      turnaround: service.turnaround,
      status: service.status,
      description: service.description || ''
    });
    setOpenActionMenuId(null);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingService) return;
    setServices(prev => prev.map(s => {
      if (s.id === editingService.id) {
        return {
          ...s,
          name: editForm.name,
          category: editForm.category,
          price: Number(editForm.price) || s.price,
          turnaround: editForm.turnaround,
          status: editForm.status,
          description: editForm.description
        };
      }
      return s;
    }));
    setEditingService(null);
  };

  // Service Icon renderer
  const renderServiceIcon = (service) => {
    const iconKey = service.icon || service.name;
    switch (iconKey) {
      case 'Shirt':
        return (
          <div className="svc-icon-tile" style={{ background: '#EFF6FF' }}>
            <ShirtIcon />
          </div>
        );
      case 'Jeans':
        return (
          <div className="svc-icon-tile" style={{ background: '#EEF2FF' }}>
            <IndigoGarmentIcon />
          </div>
        );
      case 'TShirt':
      case 'T-Shirt':
        return (
          <div className="svc-icon-tile" style={{ background: '#ECFEFF' }}>
            <DiamondLayersIcon />
          </div>
        );
      case 'Suit':
      case 'Formal Suit':
      case 'Winter Jacket':
        return (
          <div className="svc-icon-tile" style={{ background: '#ECFDF5' }}>
            <SuitHangerIcon />
          </div>
        );
      case 'Saree':
      case 'Silk Saree':
        return (
          <div className="svc-icon-tile" style={{ background: '#F0FDFA' }}>
            <SareeFabricIcon />
          </div>
        );
      case 'Bedsheet':
      case 'Bedsheet (Single)':
      case 'Cushion Covers':
        return (
          <div className="svc-icon-tile" style={{ background: '#FFFBEB' }}>
            <IroningIcon />
          </div>
        );
      case 'Blanket':
      case 'Carpet Cleaning':
        return (
          <div className="svc-icon-tile" style={{ background: '#FDF2F8' }}>
            <BlanketBedIcon />
          </div>
        );
      case 'Curtain':
      case 'Curtain (Per Piece)':
        return (
          <div className="svc-icon-tile" style={{ background: '#FAF5FF' }}>
            <CurtainWindowIcon />
          </div>
        );
      default:
        return (
          <div className="svc-icon-tile" style={{ background: '#EFF6FF' }}>
            <ShirtIcon />
          </div>
        );
    }
  };

  // Category pill color class
  const getCategoryPillStyle = (category) => {
    switch (category) {
      case 'Wash & Fold':
        return { background: '#E0F2FE', color: '#0284C7' };
      case 'Dry Cleaning':
        return { background: '#CCFBF1', color: '#0D9488' };
      case 'Steam Ironing':
      case 'Steam Iron':
        return { background: '#FEF3C7', color: '#D97706' };
      case 'Special Care':
      case 'Home Care':
        return { background: '#F3E8FF', color: '#9333EA' };
      default:
        return { background: '#E0F2FE', color: '#0284C7' };
    }
  };

  return (
    <div className="admin-services-container animate-fade-in">
      {/* Top Header Row */}
      <div className="services-header-row">
        <div>
          <h1 className="services-page-title">Services & Pricing</h1>
          <p className="services-page-subtitle">Manage your laundry services, pricing and categories.</p>
        </div>

        <button 
          id="add-service-btn"
          className="btn-add-service"
          onClick={() => setIsAddServiceModalOpen(true)}
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>Add Service</span>
        </button>
      </div>

      {/* 4 Metric Cards */}
      <div className="services-metric-cards-row">
        {/* Card 1: Total Services */}
        <div className="metric-box" style={{ background: '#E6F7F7' }}>
          <div>
            <div className="metric-tag" style={{ color: '#0D7A75' }}>TOTAL SERVICES</div>
            <div className="metric-number">{totalServices}</div>
          </div>
          <div className="metric-circle-badge" style={{ background: '#CFFAFE' }}>
            <LayoutGrid size={22} color="#0891B2" strokeWidth={2.2} />
          </div>
        </div>

        {/* Card 2: Active Services */}
        <div className="metric-box" style={{ background: '#EDFDF4' }}>
          <div>
            <div className="metric-tag" style={{ color: '#16A34A' }}>ACTIVE SERVICES</div>
            <div className="metric-number">{activeServices}</div>
          </div>
          <div className="metric-circle-badge" style={{ background: '#DCFCE7' }}>
            <CheckCircle2 size={22} color="#16A34A" strokeWidth={2.2} />
          </div>
        </div>

        {/* Card 3: Inactive Services */}
        <div className="metric-box" style={{ background: '#FFFBEB' }}>
          <div>
            <div className="metric-tag" style={{ color: '#D97706' }}>INACTIVE SERVICES</div>
            <div className="metric-number">{inactiveServices}</div>
          </div>
          <div className="metric-circle-badge" style={{ background: '#FEF3C7' }}>
            <PauseCircle size={22} color="#D97706" strokeWidth={2.2} />
          </div>
        </div>

        {/* Card 4: Average Price */}
        <div className="metric-box" style={{ background: '#FAF5FF' }}>
          <div>
            <div className="metric-tag" style={{ color: '#9333EA' }}>AVERAGE PRICE</div>
            <div className="metric-number">₹{avgPrice}</div>
          </div>
          <div className="metric-circle-badge" style={{ background: '#F3E8FF' }}>
            <Tag size={22} color="#9333EA" strokeWidth={2.2} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="services-filters-row">
        {/* Search Input */}
        <div className="search-field-wrapper">
          <Search size={16} strokeWidth={2.2} className="search-field-icon" />
          <input 
            type="text"
            className="search-field-input"
            placeholder="Search by service name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Dropdowns & Reset Button */}
        <div className="filter-controls-group">
          {/* Status Dropdown */}
          <div className="select-picker-wrap">
            <select 
              className="select-picker-input"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by Status"
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <ChevronDown size={14} strokeWidth={2} className="select-picker-arrow" />
          </div>

          {/* Type Dropdown */}
          <div className="select-picker-wrap">
            <select 
              className="select-picker-input"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by Type"
            >
              <option value="all">All Types</option>
              <option value="Standard">Standard</option>
              <option value="Premium">Premium</option>
              <option value="Express">Express</option>
            </select>
            <ChevronDown size={14} strokeWidth={2} className="select-picker-arrow" />
          </div>

          {/* Category Dropdown */}
          <div className="select-picker-wrap">
            <select 
              className="select-picker-input"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by Category"
            >
              <option value="all">All Categories</option>
              <option value="Wash & Fold">Wash & Fold</option>
              <option value="Dry Cleaning">Dry Cleaning</option>
              <option value="Steam Ironing">Steam Ironing</option>
              <option value="Special Care">Special Care</option>
            </select>
            <ChevronDown size={14} strokeWidth={2} className="select-picker-arrow" />
          </div>

          {/* Reset Button */}
          <button 
            type="button" 
            className="btn-filter-reset"
            onClick={handleReset}
            title="Reset filters and search"
          >
            <RotateCcw size={15} strokeWidth={2} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Services Table Card */}
      <div className="services-table-card">
        <div className="table-responsive-wrapper">
          <table className="services-main-table">
            <thead>
              <tr>
                <th style={{ width: '48px', textAlign: 'center' }}>
                  <input 
                    type="checkbox" 
                    className="checkbox-custom"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    aria-label="Select all services"
                  />
                </th>
                <th style={{ minWidth: '280px' }}>SERVICE</th>
                <th style={{ minWidth: '150px' }}>CATEGORY</th>
                <th style={{ minWidth: '110px' }}>
                  <div className="th-stacked">
                    <span>PRICE</span>
                    <span className="th-sub">(₹)</span>
                  </div>
                </th>
                <th style={{ minWidth: '160px' }}>
                  <div className="th-stacked">
                    <span>TURNAROUND</span>
                    <span className="th-sub">TIME</span>
                  </div>
                </th>
                <th style={{ minWidth: '130px' }}>STATUS</th>
                <th style={{ minWidth: '100px', textAlign: 'right', paddingRight: '24px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {currentServices.length > 0 ? (
                currentServices.map((service) => {
                  const isChecked = selectedIds.includes(service.id);
                  const isMenuOpen = openActionMenuId === service.id;
                  const catStyle = getCategoryPillStyle(service.category);
                  const isActive = service.status === 'Active';

                  return (
                    <tr key={service.id} className={isChecked ? 'row-selected' : ''}>
                      {/* Checkbox */}
                      <td style={{ textAlign: 'center' }}>
                        <input 
                          type="checkbox"
                          className="checkbox-custom"
                          checked={isChecked}
                          onChange={() => toggleSelectRow(service.id)}
                          aria-label={`Select ${service.name}`}
                        />
                      </td>

                      {/* Service Info Cell */}
                      <td>
                        <div className="service-cell-content">
                          {renderServiceIcon(service)}
                          <div className="service-text-meta">
                            <span className="service-name-text">{service.name}</span>
                            <span className="service-desc-text">{service.description}</span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td>
                        <span 
                          className="badge-pill" 
                          style={catStyle}
                        >
                          {service.category}
                        </span>
                      </td>

                      {/* Price */}
                      <td>
                        <span className="service-price-val">₹{service.price}</span>
                      </td>

                      {/* Turnaround Time */}
                      <td>
                        <span className="service-turnaround-val">{service.turnaround}</span>
                      </td>

                      {/* Status */}
                      <td>
                        <span 
                          className="badge-pill status-pill-badge"
                          style={{
                            background: isActive ? '#DCFCE7' : '#FEE2E2',
                            color: isActive ? '#16A34A' : '#DC2626',
                            cursor: 'pointer'
                          }}
                          onClick={() => toggleServiceStatus(service.id, service.status)}
                          title="Click to toggle status"
                        >
                          <span 
                            className="status-bullet-dot"
                            style={{ background: isActive ? '#16A34A' : '#DC2626' }}
                          />
                          {service.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                        <div className="actions-cell-inline">
                          <button 
                            type="button"
                            className="icon-action-btn"
                            title="Edit Service"
                            onClick={() => handleOpenEdit(service)}
                          >
                            <Pencil size={17} strokeWidth={2} />
                          </button>

                          <div className="action-popover-anchor">
                            <button 
                              type="button"
                              className="icon-action-btn"
                              title="More options"
                              onClick={() => setOpenActionMenuId(isMenuOpen ? null : service.id)}
                            >
                              <MoreVertical size={18} strokeWidth={2} />
                            </button>

                            {isMenuOpen && (
                              <div className="action-popover-menu">
                                <button 
                                  type="button"
                                  className="popover-item"
                                  onClick={() => handleOpenEdit(service)}
                                >
                                  <Pencil size={15} />
                                  <span>Edit details</span>
                                </button>
                                <button 
                                  type="button"
                                  className="popover-item"
                                  onClick={() => {
                                    toggleServiceStatus(service.id, service.status);
                                    setOpenActionMenuId(null);
                                  }}
                                >
                                  {isActive ? (
                                    <>
                                      <PauseCircle size={15} color="#D97706" />
                                      <span>Mark Inactive</span>
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 size={15} color="#16A34A" />
                                      <span>Mark Active</span>
                                    </>
                                  )}
                                </button>
                                <button 
                                  type="button"
                                  className="popover-item danger"
                                  onClick={() => {
                                    deleteService(service.id);
                                    setOpenActionMenuId(null);
                                  }}
                                >
                                  <Trash2 size={15} />
                                  <span>Delete service</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="empty-table-cell">
                    No services found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="table-pagination-row">
          <span className="pagination-summary-text">
            Showing {filteredServices.length === 0 ? 0 : startIndex}–{endIndex} of {filteredServices.length} services
          </span>

          <div className="pagination-button-controls">
            <button 
              type="button" 
              className="page-nav-arrow"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              aria-label="Previous Page"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button 
                key={pageNum}
                type="button"
                className={`page-number-btn ${currentPage === pageNum ? 'active' : ''}`}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </button>
            ))}

            <button 
              type="button" 
              className="page-nav-arrow"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              aria-label="Next Page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Service Modal */}
      {editingService && typeof document !== 'undefined' && createPortal(
        <div className="modal-backdrop-overlay animate-fade-in" onClick={() => setEditingService(null)}>
          <div className="modal-box-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-box-header">
              <div className="modal-title-wrap">
                <div className="modal-icon-badge">
                  <Pencil size={18} color="#0D7A75" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="modal-heading">Edit Service</h3>
                  <p className="modal-sub">Update service pricing, details and turnaround.</p>
                </div>
              </div>
              <button 
                type="button" 
                className="modal-close-icon"
                onClick={() => setEditingService(null)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="modal-body-form">
              <div className="form-input-group">
                <label className="form-input-label">Service Name</label>
                <input 
                  type="text" 
                  required
                  className="form-text-control"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>

              <div className="form-grid-2col">
                <div className="form-input-group">
                  <label className="form-input-label">Category</label>
                  <select 
                    className="form-text-control"
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  >
                    <option value="Wash & Fold">Wash & Fold</option>
                    <option value="Dry Cleaning">Dry Cleaning</option>
                    <option value="Steam Ironing">Steam Ironing</option>
                    <option value="Special Care">Special Care</option>
                  </select>
                </div>

                <div className="form-input-group">
                  <label className="form-input-label">Price (₹)</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    className="form-text-control"
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-grid-2col">
                <div className="form-input-group">
                  <label className="form-input-label">Turnaround Time</label>
                  <input 
                    type="text" 
                    required
                    className="form-text-control"
                    value={editForm.turnaround}
                    onChange={(e) => setEditForm({ ...editForm, turnaround: e.target.value })}
                  />
                </div>

                <div className="form-input-group">
                  <label className="form-input-label">Status</label>
                  <select 
                    className="form-text-control"
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="form-input-group">
                <label className="form-input-label">Description</label>
                <textarea 
                  rows="3"
                  className="form-text-control"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>

              <div className="modal-actions-bar">
                <button 
                  type="button" 
                  className="btn-modal-cancel"
                  onClick={() => setEditingService(null)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-modal-submit"
                >
                  <Check size={16} />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Scoped CSS Styles for Pixel-Perfect Alignment */}
      <style>{`
        .admin-services-container {
          display: flex;
          flex-direction: column;
          width: 100%;
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          color: #0F172A;
        }

        /* Header Row */
        .services-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .services-page-title {
          font-size: 28px;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -0.025em;
          margin: 0;
          line-height: 1.2;
        }

        .services-page-subtitle {
          font-size: 14px;
          color: #64748B;
          margin: 4px 0 0 0;
          font-weight: 400;
        }

        .btn-add-service {
          background: #0D7A75;
          color: #FFFFFF;
          border: none;
          border-radius: 10px;
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: background-color 0.15s ease, transform 0.1s ease;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .btn-add-service:hover {
          background: #0A6662;
        }

        .btn-add-service:active {
          transform: translateY(1px);
        }

        /* 4 Metric Cards */
        .services-metric-cards-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .metric-box {
          border-radius: 16px;
          padding: 18px 22px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
          transition: transform 0.15s ease;
        }

        .metric-box:hover {
          transform: translateY(-2px);
        }

        .metric-tag {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .metric-number {
          font-size: 28px;
          font-weight: 700;
          color: #0F172A;
          margin-top: 6px;
          line-height: 1.2;
        }

        .metric-circle-badge {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        /* Filter & Search Bar Container Card */
        .services-filters-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 24px;
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          padding: 16px 18px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
          width: 100%;
          box-sizing: border-box;
        }

        .search-field-wrapper {
          position: relative;
          flex: 1;
          min-width: 260px;
        }

        .search-field-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #1E293B;
          pointer-events: none;
        }

        .search-field-input {
          width: 100%;
          height: 42px;
          padding: 0 14px 0 42px;
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          font-size: 14px;
          font-family: inherit;
          color: #1E293B;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .search-field-input:hover {
          border-color: #CBD5E1;
        }

        .search-field-input:focus {
          border-color: #0D7A75;
          box-shadow: 0 0 0 3px rgba(13, 122, 117, 0.12);
        }

        .search-field-input::placeholder {
          color: #6B7280;
          opacity: 1;
        }

        .filter-controls-group {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }

        .select-picker-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
          flex-shrink: 0;
        }

        .select-picker-input {
          height: 42px;
          padding: 0 34px 0 14px;
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          font-size: 14px;
          color: #1E293B;
          font-weight: 500;
          font-family: inherit;
          appearance: none;
          -webkit-appearance: none;
          cursor: pointer;
          outline: none;
          box-sizing: border-box;
          white-space: nowrap;
          transition: border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
        }

        .select-picker-input:hover {
          background: #F8FAFC;
          border-color: #CBD5E1;
        }

        .select-picker-input:focus {
          border-color: #0D7A75;
          box-shadow: 0 0 0 3px rgba(13, 122, 117, 0.12);
        }

        .select-picker-arrow {
          position: absolute;
          right: 12px;
          color: #1E293B;
          pointer-events: none;
        }

        .btn-filter-reset {
          height: 42px;
          padding: 0 14px;
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          font-family: inherit;
          color: #1E293B;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          cursor: pointer;
          box-sizing: border-box;
          flex-shrink: 0;
          white-space: nowrap;
          transition: all 0.15s ease;
        }

        .btn-filter-reset:hover {
          background: #F8FAFC;
          border-color: #CBD5E1;
        }

        .btn-filter-reset:active {
          transform: translateY(1px);
        }

        /* Services Table Card */
        .services-table-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 18px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
          overflow: hidden;
        }

        .table-responsive-wrapper {
          width: 100%;
          overflow-x: auto;
        }

        .services-main-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
        }

        .services-main-table thead {
          background: #FFFFFF;
        }

        .services-main-table th {
          padding: 16px 20px;
          font-size: 12px;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #F1F5F9;
          text-align: left;
          vertical-align: middle;
        }

        .th-stacked {
          display: flex;
          flex-direction: column;
          line-height: 1.15;
        }

        .th-sub {
          font-size: 11px;
          font-weight: 600;
          color: #64748B;
        }

        .services-main-table tbody tr {
          border-bottom: 1px solid #F1F5F9;
          transition: background-color 0.15s ease;
        }

        .services-main-table tbody tr:hover {
          background-color: #F8FAFC;
        }

        .services-main-table tbody tr.row-selected {
          background-color: #F0FDFA;
        }

        .services-main-table td {
          padding: 14px 20px;
          border-bottom: 1px solid #F1F5F9;
          vertical-align: middle;
        }

        /* Checkbox */
        .checkbox-custom {
          width: 18px;
          height: 18px;
          border-radius: 4px;
          border: 1.5px solid #CBD5E1;
          cursor: pointer;
          accent-color: #0D7A75;
          vertical-align: middle;
        }

        /* Service Info Cell */
        .service-cell-content {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .svc-icon-tile {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .service-text-meta {
          display: flex;
          flex-direction: column;
        }

        .service-name-text {
          font-size: 15px;
          font-weight: 700;
          color: #0F172A;
          line-height: 1.3;
        }

        .service-desc-text {
          font-size: 13px;
          color: #64748B;
          margin-top: 2px;
          line-height: 1.3;
        }

        /* Badges */
        .badge-pill {
          display: inline-flex;
          align-items: center;
          padding: 4px 14px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }

        .status-pill-badge {
          gap: 6px;
          user-select: none;
        }

        .status-bullet-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          display: inline-block;
        }

        .service-price-val {
          font-size: 15px;
          font-weight: 700;
          color: #0F172A;
        }

        .service-turnaround-val {
          font-size: 14px;
          color: #334155;
          font-weight: 400;
          white-space: nowrap;
        }

        /* Action Buttons */
        .actions-cell-inline {
          display: inline-flex;
          align-items: center;
          gap: 12px;
        }

        .icon-action-btn {
          background: transparent;
          border: none;
          color: #475569;
          padding: 6px;
          border-radius: 6px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: color 0.15s ease, background-color 0.15s ease;
        }

        .icon-action-btn:hover {
          color: #0F172A;
          background: #F1F5F9;
        }

        .action-popover-anchor {
          position: relative;
        }

        .action-popover-menu {
          position: absolute;
          right: 0;
          top: calc(100% + 4px);
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          min-width: 160px;
          z-index: 50;
          padding: 6px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .popover-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          background: transparent;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          color: #334155;
          text-align: left;
          cursor: pointer;
          width: 100%;
          transition: background-color 0.15s ease;
        }

        .popover-item:hover {
          background: #F8FAFC;
          color: #0F172A;
        }

        .popover-item.danger {
          color: #DC2626;
        }

        .popover-item.danger:hover {
          background: #FEF2F2;
        }

        .empty-table-cell {
          text-align: center;
          padding: 48px !important;
          color: #64748B;
          font-size: 14px;
        }

        /* Pagination Footer */
        .table-pagination-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 24px;
          border-top: 1px solid #F1F5F9;
        }

        .pagination-summary-text {
          font-size: 14px;
          color: #475569;
          font-weight: 500;
        }

        .pagination-button-controls {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .page-nav-arrow {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: #64748B;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .page-nav-arrow:hover:not(:disabled) {
          background: #F1F5F9;
          color: #1E293B;
        }

        .page-nav-arrow:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .page-number-btn {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: #475569;
          font-weight: 500;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .page-number-btn:hover:not(.active) {
          background: #F1F5F9;
          color: #0F172A;
        }

        .page-number-btn.active {
          background: #0D7A75;
          color: #FFFFFF;
          font-weight: 600;
        }

        /* Modal Styles */
        .modal-backdrop-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          padding: 20px 16px;
          overflow: hidden;
          overscroll-behavior: none;
        }

        .modal-box-card {
          background: #FFFFFF;
          border-radius: 16px;
          width: 100%;
          max-width: 520px;
          max-height: calc(100vh - 40px);
          max-height: calc(100dvh - 40px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          position: relative;
          overscroll-behavior: contain;
        }

        .modal-box-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #F1F5F9;
          flex-shrink: 0;
        }

        .modal-title-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .modal-icon-badge {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: #E6F7F7;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-heading {
          font-size: 18px;
          font-weight: 700;
          color: #0F172A;
          margin: 0;
        }

        .modal-sub {
          font-size: 13px;
          color: #64748B;
          margin: 2px 0 0 0;
        }

        .modal-close-icon {
          background: transparent;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          transition: color 0.15s ease;
        }

        .modal-close-icon:hover {
          color: #0F172A;
        }

        .modal-body-form {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          overflow-y: auto;
          overscroll-behavior: contain;
          flex: 1 1 auto;
          min-height: 0;
        }

        .form-grid-2col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .form-input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-input-label {
          font-size: 13px;
          font-weight: 600;
          color: #334155;
        }

        .form-text-control {
          width: 100%;
          height: 42px;
          padding: 0 12px;
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          border-radius: 8px;
          font-size: 14px;
          color: #0F172A;
          outline: none;
          transition: border-color 0.15s ease;
        }

        textarea.form-text-control {
          height: auto;
          padding: 10px 12px;
          resize: vertical;
        }

        .form-text-control:focus {
          border-color: #0D7A75;
        }

        .modal-actions-bar {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 8px;
          padding-top: 16px;
          border-top: 1px solid #F1F5F9;
          flex-shrink: 0;
        }

        .btn-modal-cancel {
          padding: 9px 18px;
          border-radius: 8px;
          background: #F1F5F9;
          color: #475569;
          border: none;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }

        .btn-modal-cancel:hover {
          background: #E2E8F0;
        }

        .btn-modal-submit {
          padding: 9px 20px;
          border-radius: 8px;
          background: #0D7A75;
          color: #FFFFFF;
          border: none;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: background-color 0.15s ease;
        }

        .btn-modal-submit:hover {
          background: #0A6662;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .services-metric-cards-row {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .services-metric-cards-row {
            grid-template-columns: 1fr;
          }
          .services-header-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          .services-filters-row {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }
          .search-field-wrapper {
            width: 100%;
            max-width: none;
          }
          .filter-controls-group {
            width: 100%;
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
          }
          .select-picker-wrap {
            flex: 1;
            min-width: 140px;
          }
          .select-picker-input {
            width: 100%;
          }
          .btn-filter-reset {
            margin-left: 0;
            width: 100%;
            justify-content: center;
          }
          .form-grid-2col {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
