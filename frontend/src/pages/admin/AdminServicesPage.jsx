import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { 
  Tag, 
  CheckCircle2, 
  PauseCircle, 
  Coins, 
  Plus, 
  Search, 
  RotateCcw, 
  Edit, 
  MoreHorizontal, 
  ChevronLeft, 
  ChevronRight,
  Shirt, 
  Layers, 
  Sparkles, 
  Flame, 
  BedDouble
} from 'lucide-react';

export const AdminServicesPage = () => {
  const { 
    services, 
    setIsAddServiceModalOpen, 
    setIsManageServicesModalOpen,
    toggleServiceStatus 
  } = useAdmin();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filteredServices = services.filter(s => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && s.category !== categoryFilter) return false;
    if (searchTerm && !s.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const getServiceIcon = (icon) => {
    switch (icon) {
      case 'Shirt': return <Shirt size={18} />;
      case 'Layers': return <Layers size={18} />;
      case 'Sparkles': return <Sparkles size={18} />;
      case 'Flame': return <Flame size={18} />;
      case 'BedDouble': return <BedDouble size={18} />;
      default: return <Shirt size={18} />;
    }
  };

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'Wash & Fold': return 'cat-wash';
      case 'Dry Cleaning': return 'cat-dry';
      case 'Steam Ironing': return 'cat-iron';
      case 'Special Care': return 'cat-special';
      default: return 'cat-wash';
    }
  };

  return (
    <div className="admin-services-page animate-fade-in">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Services & Pricing</h1>
          <p className="page-subtitle">Manage your laundry services, pricing and categories.</p>
        </div>

        <button 
          id="add-service-top-btn"
          className="btn btn-teal"
          onClick={() => setIsAddServiceModalOpen(true)}
        >
          <Plus size={18} />
          <span>Add Service</span>
        </button>
      </div>

      {/* 4 Metric Cards */}
      <div className="services-metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-wrap cyan"><Tag size={20} /></div>
          <div>
            <div className="metric-val">{12}</div>
            <div className="metric-lbl">Total Services</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap green"><CheckCircle2 size={20} /></div>
          <div>
            <div className="metric-val">{10}</div>
            <div className="metric-lbl">Active Services</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap yellow"><PauseCircle size={20} /></div>
          <div>
            <div className="metric-val">{2}</div>
            <div className="metric-lbl">Inactive Services</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap purple"><Coins size={20} /></div>
          <div>
            <div className="metric-val">₹320</div>
            <div className="metric-lbl">Average Price</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="orders-filter-bar">
        <div className="filter-search-box">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by service name..." 
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

          <select className="filter-select">
            <option>All Types</option>
            <option>Standard</option>
            <option>Premium</option>
          </select>

          <select 
            className="filter-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="Wash & Fold">Wash & Fold</option>
            <option value="Dry Cleaning">Dry Cleaning</option>
            <option value="Steam Ironing">Steam Ironing</option>
            <option value="Special Care">Special Care</option>
          </select>

          <button className="reset-filter-btn" onClick={() => { setSearchTerm(''); setStatusFilter('all'); setCategoryFilter('all'); }}>
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Services Table Card */}
      <div className="orders-table-card">
        <div className="table-responsive">
          <table className="orders-full-table">
            <thead>
              <tr>
                <th width="40"><input type="checkbox" className="custom-chk" /></th>
                <th>SERVICE</th>
                <th>CATEGORY</th>
                <th>PRICE (₹)</th>
                <th>TURNAROUND TIME</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.map(s => (
                <tr key={s.id}>
                  <td><input type="checkbox" className="custom-chk" /></td>
                  <td>
                    <div className="service-info-cell">
                      <div className="service-icon-tile">
                        {getServiceIcon(s.icon)}
                      </div>
                      <div>
                        <div className="service-title-text">{s.name}</div>
                        <div className="service-desc-text">{s.description}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`category-pill ${getCategoryColor(s.category)}`}>
                      {s.category}
                    </span>
                  </td>
                  <td>
                    <strong className="service-price-text">₹{s.price}</strong>
                  </td>
                  <td>
                    <span className="turnaround-text">{s.turnaround}</span>
                  </td>
                  <td>
                    <span className={`status-pill ${s.status.toLowerCase()}`}>
                      ● {s.status}
                    </span>
                  </td>
                  <td>
                    <div className="actions-cell-row">
                      <button 
                        className="action-icon-btn" 
                        onClick={() => setIsAddServiceModalOpen(true)}
                        title="Edit Service"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="action-icon-btn"
                        onClick={() => setIsManageServicesModalOpen(true)}
                        title="Manage"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="table-pagination-footer">
          <span className="pagination-info">Showing 1-8 of 12 services</span>
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
        .admin-services-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .services-metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .service-info-cell {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .service-icon-tile {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: #EBF8F7;
          color: #0D7A75;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .service-title-text {
          font-weight: 700;
          color: #1E293B;
          font-size: 0.9375rem;
        }

        .service-desc-text {
          font-size: 0.75rem;
          color: #64748B;
        }

        .category-pill {
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 700;
          display: inline-block;
        }

        .category-pill.cat-wash { background: #E0F2FE; color: #0284C7; }
        .category-pill.cat-dry { background: #EBF8F7; color: #0D7A75; }
        .category-pill.cat-iron { background: #FEF3C7; color: #D97706; }
        .category-pill.cat-special { background: #F3E8FF; color: #9333EA; }

        .service-price-text {
          font-size: 1rem;
          color: #1E293B;
        }

        .turnaround-text {
          font-size: 0.8125rem;
          color: #475569;
        }

        .actions-cell-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .action-icon-btn {
          background: none;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          transition: all 0.15s;
        }

        .action-icon-btn:hover {
          background: #F1F5F9;
          color: #1E293B;
        }

        @media (max-width: 1024px) {
          .services-metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
};
