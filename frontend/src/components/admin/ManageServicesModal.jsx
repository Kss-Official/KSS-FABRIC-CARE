import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAdmin } from '../../context/AdminContext';
import { 
  X, 
  Tag, 
  Plus, 
  Search, 
  ChevronDown, 
  Trash2, 
  Shirt, 
  Footprints, 
  Home 
} from 'lucide-react';

// Electric Clothes Iron SVG matching Reference Image 2
const IronIcon = ({ size = 20, className = '' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M4 17h14a2 2 0 0 0 2-2c0-3.5-3-7-7.5-7H6a2 2 0 0 0-2 2v7z" />
    <path d="M6 8V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3" />
  </svg>
);

// Coat Hanger SVG matching Reference Image 2
const HangerIcon = ({ size = 20, className = '' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 5a2 2 0 0 1 2 2c0 1.2-1 1.8-1.7 2.3L4 15.5A1 1 0 0 0 4.6 17h14.8a1 1 0 0 0 .6-1.5L13.7 9.3" />
  </svg>
);

export const ManageServicesModal = () => {
  const { 
    isManageServicesModalOpen, 
    setIsManageServicesModalOpen, 
    setIsAddServiceModalOpen, 
    services, 
    toggleServiceStatus,
    deleteService
  } = useAdmin();

  const [filterTab, setFilterTab] = useState('all');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isManageServicesModalOpen) return null;

  const filteredServices = services.filter(s => {
    if (filterTab === 'active' && s.status !== 'Active') return false;
    if (filterTab === 'inactive' && s.status !== 'Inactive') return false;
    if (categoryFilter !== 'all' && s.category !== categoryFilter && s.name !== categoryFilter) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const activeCount = services.filter(s => s.status === 'Active').length;
  const inactiveCount = services.filter(s => s.status === 'Inactive').length;

  const getServiceIcon = (service) => {
    switch (service.name) {
      case 'Wash & Fold':
        return <Shirt size={20} strokeWidth={2} />;
      case 'Wash & Iron':
        return <IronIcon size={20} />;
      case 'Dry Cleaning':
        return <HangerIcon size={20} />;
      case 'Steam Iron':
        return <IronIcon size={20} />;
      case 'Shoe Laundry':
        return <Footprints size={20} strokeWidth={2} />;
      case 'Home Care':
        return <Home size={20} strokeWidth={2} />;
      default:
        if (service.icon === 'Iron') return <IronIcon size={20} />;
        if (service.icon === 'Hanger') return <HangerIcon size={20} />;
        if (service.icon === 'Footprints') return <Footprints size={20} strokeWidth={2} />;
        if (service.icon === 'Home') return <Home size={20} strokeWidth={2} />;
        return <Shirt size={20} strokeWidth={2} />;
    }
  };

  const handleDeleteInactiveOrSelected = () => {
    // If there's an inactive service, delete it, or delete the last service
    const targetToDelete = services.find(s => s.status === 'Inactive') || services[services.length - 1];
    if (targetToDelete && deleteService) {
      deleteService(targetToDelete.id);
      setShowDeleteConfirm(false);
    }
  };

  return createPortal(
    <div className="manage-modal-backdrop animate-fade-in" onClick={() => setIsManageServicesModalOpen(false)}>
      <div className="manage-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="manage-modal-header">
          <div className="manage-header-left">
            <div className="manage-icon-badge">
              <Tag size={20} strokeWidth={2} />
            </div>
            <div className="manage-header-titles">
              <h2 className="manage-modal-title">Manage Services</h2>
              <p className="manage-modal-subtitle">Add, edit or manage your laundry services and pricing.</p>
            </div>
          </div>
          
          <div className="manage-header-right">
            <button 
              type="button"
              className="manage-add-btn"
              onClick={() => {
                setIsManageServicesModalOpen(false);
                setIsAddServiceModalOpen(true);
              }}
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Add New Service</span>
            </button>
            <button 
              type="button"
              className="manage-close-icon-btn"
              onClick={() => setIsManageServicesModalOpen(false)}
              aria-label="Close modal"
            >
              <X size={20} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="manage-tabs-bar">
          <button 
            type="button"
            className={`manage-tab-btn ${filterTab === 'all' ? 'active' : ''}`}
            onClick={() => setFilterTab('all')}
          >
            All Services ({services.length})
          </button>
          <button 
            type="button"
            className={`manage-tab-btn ${filterTab === 'active' ? 'active' : ''}`}
            onClick={() => setFilterTab('active')}
          >
            Active ({activeCount})
          </button>
          <button 
            type="button"
            className={`manage-tab-btn ${filterTab === 'inactive' ? 'active' : ''}`}
            onClick={() => setFilterTab('inactive')}
          >
            Inactive ({inactiveCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="manage-search-container">
          <Search size={16} className="manage-search-icon" />
          <input 
            type="text"
            placeholder="Search services..."
            className="manage-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Category Dropdown */}
        <div className="manage-category-container">
          <select 
            className="manage-category-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="Wash & Fold">Wash & Fold</option>
            <option value="Wash & Iron">Wash & Iron</option>
            <option value="Dry Cleaning">Dry Cleaning</option>
            <option value="Steam Iron">Steam Iron</option>
            <option value="Shoe Laundry">Shoe Laundry</option>
            <option value="Home Care">Home Care</option>
          </select>
          <ChevronDown size={16} className="manage-category-chevron" />
        </div>

        {/* Services List */}
        <div className="manage-services-list-body">
          {filteredServices.length === 0 ? (
            <div className="manage-empty-state">
              No services found matching your criteria.
            </div>
          ) : (
            filteredServices.map(s => {
              const isActive = s.status === 'Active';
              return (
                <div key={s.id} className="manage-service-card-item">
                  <div className="service-card-left">
                    <div className="service-item-icon-box">
                      {getServiceIcon(s)}
                    </div>
                    <div className="service-item-text-group">
                      <h4 className="service-item-title">{s.name}</h4>
                      <span className="service-item-desc">{s.description}</span>
                    </div>
                  </div>

                  <div className="service-card-right">
                    <div className="service-rate-status-col">
                      <span className="service-price-amount">₹{s.price}</span>
                      <span className={`service-status-pill ${isActive ? 'active' : 'inactive'}`}>
                        {s.status}
                      </span>
                    </div>

                    <button 
                      type="button"
                      className={`manage-toggle-switch ${isActive ? 'active' : ''}`}
                      onClick={() => toggleServiceStatus(s.id)}
                      role="switch"
                      aria-checked={isActive}
                      aria-label={`Toggle ${s.name} status`}
                    >
                      <span className="manage-switch-slider" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Delete Confirmation Popup if active */}
        {showDeleteConfirm && (
          <div className="delete-confirm-bar">
            <span>Delete inactive service ({services.find(s => s.status === 'Inactive')?.name || 'service'})?</span>
            <div className="confirm-btn-group">
              <button type="button" className="confirm-delete-btn" onClick={handleDeleteInactiveOrSelected}>Confirm</button>
              <button type="button" className="cancel-delete-btn" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="manage-modal-footer">
          <button 
            type="button" 
            className="manage-delete-service-btn"
            onClick={() => setShowDeleteConfirm(prev => !prev)}
          >
            <Trash2 size={16} strokeWidth={2} />
            <span>Delete Service</span>
          </button>

          <div className="manage-footer-right-actions">
            <button 
              type="button" 
              className="manage-cancel-action-btn"
              onClick={() => setIsManageServicesModalOpen(false)}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="manage-save-action-btn"
              onClick={() => setIsManageServicesModalOpen(false)}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .manage-modal-backdrop {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          height: 100dvh;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px 16px;
          overflow: hidden;
          overscroll-behavior: none;
        }

        .manage-modal-card {
          width: 720px;
          max-width: 100%;
          background: #FFFFFF;
          border-radius: 24px;
          box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.12), 0 0 1px 1px rgba(0, 0, 0, 0.05);
          padding: 28px 32px 24px 32px;
          display: flex;
          flex-direction: column;
          animation: modalFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          max-height: calc(100vh - 40px);
          max-height: calc(100dvh - 40px);
          overflow: hidden;
          overscroll-behavior: contain;
          position: relative;
        }

        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: scale(0.97) translateY(8px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }

        .manage-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .manage-header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .manage-icon-badge {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #E6F7F5;
          color: #0D7A75;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .manage-header-titles {
          display: flex;
          flex-direction: column;
        }

        .manage-modal-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: #1E293B;
          line-height: 1.2;
          margin: 0;
        }

        .manage-modal-subtitle {
          font-size: 0.8125rem;
          color: #64748B;
          margin: 2px 0 0 0;
        }

        .manage-header-right {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .manage-add-btn {
          background: #087F77;
          color: #FFFFFF;
          border: none;
          border-radius: 9999px;
          padding: 8px 18px;
          font-size: 0.8125rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .manage-add-btn:hover {
          background: #066761;
        }

        .manage-close-icon-btn {
          background: none;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.15s ease;
        }

        .manage-close-icon-btn:hover {
          color: #1E293B;
        }

        .manage-tabs-bar {
          display: flex;
          gap: 24px;
          border-bottom: 1.5px solid #F1F5F9;
          margin-bottom: 16px;
        }

        .manage-tab-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0 0 10px 0;
          font-size: 0.875rem;
          font-weight: 500;
          color: #64748B;
          transition: color 0.15s ease;
        }

        .manage-tab-btn:hover {
          color: #1E293B;
        }

        .manage-tab-btn.active {
          color: #0D7A75;
          font-weight: 700;
          border-bottom: 2.5px solid #0D7A75;
          margin-bottom: -1.5px;
        }

        .manage-search-container {
          position: relative;
          display: flex;
          align-items: center;
          margin-bottom: 10px;
        }

        .manage-search-icon {
          position: absolute;
          left: 14px;
          color: #94A3B8;
          pointer-events: none;
        }

        .manage-search-input {
          width: 100%;
          height: 42px;
          padding: 0 14px 0 38px;
          border: 1.5px solid #E2E8F0;
          border-radius: 12px;
          font-size: 0.875rem;
          color: #1E293B;
          outline: none;
          background: #FFFFFF;
          box-sizing: border-box;
          transition: border-color 0.15s ease;
        }

        .manage-search-input::placeholder {
          color: #94A3B8;
        }

        .manage-search-input:focus {
          border-color: #0D7A75;
        }

        .manage-category-container {
          position: relative;
          margin-bottom: 16px;
        }

        .manage-category-select {
          width: 100%;
          height: 42px;
          padding: 0 38px 0 14px;
          border: 1.5px solid #E2E8F0;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 500;
          color: #334155;
          background: #FFFFFF;
          outline: none;
          appearance: none;
          -webkit-appearance: none;
          cursor: pointer;
          box-sizing: border-box;
          transition: border-color 0.15s ease;
        }

        .manage-category-select:focus {
          border-color: #0D7A75;
        }

        .manage-category-chevron {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          color: #94A3B8;
        }

        .manage-services-list-body {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 380px;
          overflow-y: auto;
          overscroll-behavior: contain;
          padding-right: 4px;
        }

        /* Subtle scrollbar */
        .manage-services-list-body::-webkit-scrollbar {
          width: 5px;
        }
        .manage-services-list-body::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 4px;
        }

        .manage-empty-state {
          padding: 30px;
          text-align: center;
          color: #94A3B8;
          font-size: 0.875rem;
        }

        .manage-service-card-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #FFFFFF;
          border: 1.5px solid #E2E8F0;
          border-radius: 16px;
          padding: 12px 18px;
          transition: border-color 0.15s ease;
        }

        .manage-service-card-item:hover {
          border-color: #CBD5E1;
        }

        .service-card-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .service-item-icon-box {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: #EBF8F7;
          color: #0D7A75;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .service-item-text-group {
          display: flex;
          flex-direction: column;
        }

        .service-item-title {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #1E293B;
          line-height: 1.25;
          margin: 0;
        }

        .service-item-desc {
          font-size: 0.8125rem;
          color: #64748B;
          margin-top: 2px;
        }

        .service-card-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .service-rate-status-col {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .service-price-amount {
          font-size: 1rem;
          font-weight: 800;
          color: #0F172A;
          line-height: 1.2;
        }

        .service-status-pill {
          font-size: 0.75rem;
          font-weight: 600;
          margin-top: 2px;
        }

        .service-status-pill.active {
          color: #059669;
        }

        .service-status-pill.inactive {
          color: #64748B;
        }

        /* Capsule Toggle Switch */
        .manage-toggle-switch {
          width: 42px;
          height: 24px;
          border-radius: 9999px;
          border: none;
          background: #E2E8F0;
          cursor: pointer;
          position: relative;
          transition: background-color 0.2s ease;
          padding: 0;
          outline: none;
          flex-shrink: 0;
        }

        .manage-toggle-switch.active {
          background: #0D7A75;
        }

        .manage-switch-slider {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #FFFFFF;
          transition: transform 0.2s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
        }

        .manage-toggle-switch.active .manage-switch-slider {
          transform: translateX(18px);
        }

        .delete-confirm-bar {
          background: #FEF2F2;
          border: 1px solid #FECACA;
          border-radius: 12px;
          padding: 10px 14px;
          margin-top: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.8125rem;
          color: #B91C1C;
        }

        .confirm-btn-group {
          display: flex;
          gap: 8px;
        }

        .confirm-delete-btn {
          background: #EF4444;
          color: #FFFFFF;
          border: none;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
        }

        .cancel-delete-btn {
          background: #FFFFFF;
          color: #475569;
          border: 1px solid #CBD5E1;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.75rem;
          cursor: pointer;
        }

        .manage-modal-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 20px;
          padding-top: 18px;
          border-top: 1px solid #F1F5F9;
        }

        .manage-delete-service-btn {
          border: 1.5px solid #FCA5A5;
          background: #FFFFFF;
          color: #EF4444;
          border-radius: 12px;
          padding: 9px 18px;
          font-size: 0.875rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .manage-delete-service-btn:hover {
          background: #FEF2F2;
        }

        .manage-footer-right-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .manage-cancel-action-btn {
          border: 1.5px solid #E2E8F0;
          background: #FFFFFF;
          color: #475569;
          border-radius: 12px;
          padding: 9px 24px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .manage-cancel-action-btn:hover {
          background: #F8FAFC;
          color: #1E293B;
        }

        .manage-save-action-btn {
          border: none;
          background: #087F77;
          color: #FFFFFF;
          border-radius: 12px;
          padding: 9px 24px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .manage-save-action-btn:hover {
          background: #066761;
        }
      `}</style>
    </div>,
    document.body
  );
};
