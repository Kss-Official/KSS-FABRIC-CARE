import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { 
  X, 
  Tag, 
  Plus, 
  Search, 
  Trash2, 
  Shirt, 
  Layers, 
  Sparkles, 
  Flame, 
  Footprints, 
  BedDouble 
} from 'lucide-react';

export const ManageServicesModal = () => {
  const { 
    isManageServicesModalOpen, 
    setIsManageServicesModalOpen, 
    setIsAddServiceModalOpen, 
    services, 
    toggleServiceStatus 
  } = useAdmin();

  const [filterTab, setFilterTab] = useState('all');
  const [search, setSearch] = useState('');

  if (!isManageServicesModalOpen) return null;

  const filteredServices = services.filter(s => {
    if (filterTab === 'active' && s.status !== 'Active') return false;
    if (filterTab === 'inactive' && s.status !== 'Inactive') return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const activeCount = services.filter(s => s.status === 'Active').length;
  const inactiveCount = services.filter(s => s.status === 'Inactive').length;

  const getServiceIcon = (icon) => {
    switch (icon) {
      case 'Shirt': return <Shirt size={20} />;
      case 'Layers': return <Layers size={20} />;
      case 'Sparkles': return <Sparkles size={20} />;
      case 'Flame': return <Flame size={20} />;
      case 'Footprints': return <Footprints size={20} />;
      case 'BedDouble': return <BedDouble size={20} />;
      default: return <Shirt size={20} />;
    }
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={() => setIsManageServicesModalOpen(false)}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-icon-wrap">
              <Tag size={22} />
            </div>
            <div>
              <h2 className="modal-title">Manage Services</h2>
              <p className="modal-subtitle">Add, edit or manage your laundry services and pricing.</p>
            </div>
          </div>
          
          <div className="modal-header-right">
            <button 
              className="btn btn-teal btn-sm"
              onClick={() => {
                setIsManageServicesModalOpen(false);
                setIsAddServiceModalOpen(true);
              }}
            >
              <Plus size={16} />
              <span>Add New Service</span>
            </button>
            <button 
              className="modal-close-btn"
              onClick={() => setIsManageServicesModalOpen(false)}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="modal-form-body">
          {/* Tabs */}
          <div className="manage-tabs-row">
            <button 
              className={`manage-tab ${filterTab === 'all' ? 'active' : ''}`}
              onClick={() => setFilterTab('all')}
            >
              All Services ({services.length})
            </button>
            <button 
              className={`manage-tab ${filterTab === 'active' ? 'active' : ''}`}
              onClick={() => setFilterTab('active')}
            >
              Active ({activeCount})
            </button>
            <button 
              className={`manage-tab ${filterTab === 'inactive' ? 'active' : ''}`}
              onClick={() => setFilterTab('inactive')}
            >
              Inactive ({inactiveCount})
            </button>
          </div>

          {/* Search */}
          <div className="manage-search-row">
            <div className="input-with-icon w-full">
              <Search size={16} className="input-icon" />
              <input 
                type="text"
                placeholder="Search services..."
                className="modal-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Services List */}
          <div className="manage-services-list">
            {filteredServices.map(s => (
              <div key={s.id} className="manage-service-item">
                <div className="item-left">
                  <div className="service-icon-box">
                    {getServiceIcon(s.icon)}
                  </div>
                  <div>
                    <h4 className="service-name">{s.name}</h4>
                    <span className="service-sub">{s.description || s.category}</span>
                  </div>
                </div>

                <div className="item-right">
                  <div className="service-rate-col">
                    <span className="service-rate-val">₹{s.price}</span>
                    <span className={`status-badge-pill ${s.status.toLowerCase()}`}>{s.status}</span>
                  </div>

                  <label className="switch">
                    <input 
                      type="checkbox"
                      checked={s.status === 'Active'}
                      onChange={() => toggleServiceStatus(s.id)}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Actions */}
          <div className="manage-footer-actions">
            <button type="button" className="delete-service-link">
              <Trash2 size={16} />
              <span>Delete Service</span>
            </button>

            <div className="footer-right-btns">
              <button 
                type="button" 
                className="btn btn-outline-teal"
                onClick={() => setIsManageServicesModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-teal"
                onClick={() => setIsManageServicesModalOpen(false)}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .modal-header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .manage-tabs-row {
          display: flex;
          gap: 20px;
          border-bottom: 1px solid #E2E8F0;
          padding-bottom: 8px;
        }

        .manage-tab {
          background: none;
          border: none;
          font-size: 0.875rem;
          font-weight: 600;
          color: #64748B;
          cursor: pointer;
          padding: 6px 4px;
          position: relative;
        }

        .manage-tab.active {
          color: #0D7A75;
          font-weight: 700;
        }

        .manage-tab.active::after {
          content: '';
          position: absolute;
          bottom: -9px;
          left: 0;
          right: 0;
          height: 2px;
          background: #0D7A75;
        }

        .manage-services-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 380px;
          overflow-y: auto;
        }

        .manage-service-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #FAFCFC;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          padding: 14px 18px;
        }

        .item-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .service-icon-box {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: #EBF8F7;
          color: #0D7A75;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .service-name {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #1E293B;
        }

        .service-sub {
          font-size: 0.75rem;
          color: #94A3B8;
        }

        .item-right {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .service-rate-col {
          text-align: right;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .service-rate-val {
          font-size: 1rem;
          font-weight: 800;
          color: #1E293B;
        }

        .status-badge-pill {
          font-size: 0.6875rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 999px;
          display: inline-block;
          margin-top: 2px;
        }

        .status-badge-pill.active {
          background: #DCFCE7;
          color: #15803D;
        }

        .status-badge-pill.inactive {
          background: #FEE2E2;
          color: #B91C1C;
        }

        .manage-footer-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 14px;
          border-top: 1px solid #E2E8F0;
        }

        .delete-service-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: 1px solid #FCA5A5;
          color: #EF4444;
          font-size: 0.8125rem;
          font-weight: 600;
          padding: 8px 14px;
          border-radius: 8px;
          cursor: pointer;
        }

        .delete-service-link:hover {
          background: #FEF2F2;
        }

        .footer-right-btns {
          display: flex;
          gap: 12px;
        }
      `}</style>
    </div>
  );
};
