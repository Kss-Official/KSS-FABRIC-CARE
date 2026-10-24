import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAdmin, getComplaintSortTime } from '../../context/AdminContext';
import { 
  FileText, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  ChevronDown, 
  Filter, 
  MoreVertical, 
  Eye, 
  RefreshCw,
  X,
  Phone,
  MapPin,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  CalendarCheck,
  RotateCcw,
  Search
} from 'lucide-react';
import { RescheduleDeliveryDrawer } from '../../components/admin/RescheduleDeliveryDrawer';
import { filterMatchesDate } from '../../utils/dateFilterUtils';
import { formatOrderId } from '../../utils/helpers';

export const AdminDeliveryReportsPage = () => {
  const { 
    complaints = [], 
    complaintsSummary = { total_complaints: 28, pending_reschedule: 7, rescheduled: 13, resolved: 5 }, 
    complaintsLoading = false, 
    fetchComplaints = () => {},
    openRescheduleDrawer = () => {},
    rescheduleDelivery = async () => ({ success: true })
  } = useAdmin() || {};

  // Filters state with search support
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateRangeFilter, setDateRangeFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // View Details Modal State
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Lock background scroll when Details modal is open (matching Services & Pricing edit modal behavior)
  useEffect(() => {
    const wrapper = document.querySelector('.admin-main-wrapper');
    if (detailsModalOpen) {
      if (wrapper) wrapper.classList.add('admin-scroll-locked');
    } else {
      if (wrapper) wrapper.classList.remove('admin-scroll-locked');
    }
    return () => {
      if (wrapper) wrapper.classList.remove('admin-scroll-locked');
    };
  }, [detailsModalOpen]);

  // Status mapping for visual badge styling matching Reference Image 3
  const getStatusBadge = (status) => {
    const s = String(status || '').toUpperCase().replace(/\s+/g, '_');
    switch (s) {
      case 'PENDING_RESCHEDULE':
        return <span className="cr-badge badge-pending">Pending Reschedule</span>;
      case 'RESCHEDULED':
        return <span className="cr-badge badge-rescheduled">Rescheduled</span>;
      case 'UNDER_REVIEW':
        return <span className="cr-badge badge-review">Under Review</span>;
      case 'DELIVERED':
        return <span className="cr-badge badge-delivered">Delivered</span>;
      case 'RESOLVED':
        return <span className="cr-badge badge-resolved">Resolved</span>;
      default:
        return <span className="cr-badge badge-review">{status}</span>;
    }
  };

  // Filter complaints based on search query, status, and date range, ensuring newest appear first
  const filteredComplaints = useMemo(() => {
    const list = (complaints || []).filter((item) => {
      // Exclude FC-57606 as requested
      const orderIdStr = String(item.order_id_display || item.order_id || item.id || '').toUpperCase();
      if (orderIdStr.includes('FC-57606') || orderIdStr.includes('57606')) {
        return false;
      }

      // Search Query filter (matches Order ID, Customer Name, Failure Reason, Phone, Address, Executive)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = String(item.order_id_display || item.order_id || item.id || '').toLowerCase().includes(q);
        const matchesCustomer = String(item.customer_name || '').toLowerCase().includes(q);
        const matchesReason = String(item.failure_reason || '').toLowerCase().includes(q);
        const matchesPhone = String(item.customer_phone || '').toLowerCase().includes(q);
        const matchesAddress = String(item.customer_address || '').toLowerCase().includes(q);
        const matchesExecutive = String(item.reported_by_name || item.delivery_executive_name || '').toLowerCase().includes(q);

        if (!matchesId && !matchesCustomer && !matchesReason && !matchesPhone && !matchesAddress && !matchesExecutive) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'ALL') {
        const itemStatus = String(item.status || '').toUpperCase().replace(/[\s_-]+/g, '');
        const filterKey = statusFilter.toUpperCase().replace(/[\s_-]+/g, '');
        
        let matchesStatus = false;
        if (filterKey === 'PENDINGRESCHEDULE') {
          matchesStatus = itemStatus === 'PENDINGRESCHEDULE' || itemStatus === 'PENDING' || itemStatus === 'OPEN';
        } else if (filterKey === 'RESCHEDULED') {
          matchesStatus = itemStatus === 'RESCHEDULED' || itemStatus === 'RESCHEDULE';
        } else {
          matchesStatus = itemStatus === filterKey;
        }

        if (!matchesStatus) {
          return false;
        }
      }

      // Date Range Filter
      if (!filterMatchesDate(item, dateRangeFilter, ['report_date', 'report_date_only', 'formatted_report_date', 'created_at', 'createdAt', 'updatedAt', 'date'])) {
        return false;
      }

      return true;
    });

    // Sort so new requests always come on top (descending by timestamp)
    return list.sort((a, b) => {
      const getTimestamp = (x) => {
        if (x.createdAt && !isNaN(Number(x.createdAt))) return Number(x.createdAt);
        if (x.created_at && !isNaN(Number(x.created_at))) return Number(x.created_at);
        if (x.updatedAt && !isNaN(Number(x.updatedAt))) return Number(x.updatedAt);
        if (x.report_date) {
          const t = new Date(x.report_date).getTime();
          if (!isNaN(t)) return t;
        }
        if (x.formatted_report_date) {
          const t = new Date(x.formatted_report_date).getTime();
          if (!isNaN(t)) return t;
        }
        return 0;
      };

      const timeA = getTimestamp(a);
      const timeB = getTimestamp(b);

      if (timeB !== timeA) {
        return timeB - timeA;
      }
      return String(b.id || '').localeCompare(String(a.id || ''));
    });
  }, [complaints, searchQuery, statusFilter, dateRangeFilter]);

  // Pagination calculation
  const totalItems = filteredComplaints.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentComplaints = filteredComplaints.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleViewDetails = (complaint) => {
    setSelectedComplaint(complaint);
    setDetailsModalOpen(true);
  };

  const handleRescheduleClick = (complaint) => {
    openRescheduleDrawer(complaint);
  };

  return (
    <div className="cr-page-container animate-fade-in">
      {/* 1. Header matching Reference Image 3 */}
      <div className="cr-header-block">
        <h1 className="cr-page-title">Delivery Reports</h1>
        <p className="cr-page-subtitle">
          Review delivery complaints and reschedule deliveries for unavailable customers.
        </p>
      </div>

      {/* 2. Three Summary Stat Cards */}
      <div className="cr-summary-grid">
        {/* Card 1: Total Complaints */}
        <div className="cr-stat-card">
          <div className="stat-card-left">
            <div className="stat-icon-circle icon-blue">
              <FileText size={22} className="text-[#0284C7]" />
            </div>
            <div className="stat-text-stack">
              <span className="stat-label">Total Complaints</span>
              <span className="stat-number">{complaintsSummary?.total_complaints ?? 28}</span>
              <div className="stat-trend trend-up">
                <span className="trend-arrow">&uarr;</span>
                <span>12%</span>
                <span className="trend-context">vs. last 7 days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Pending Reschedule */}
        <div className="cr-stat-card">
          <div className="stat-card-left">
            <div className="stat-icon-circle icon-orange">
              <Clock size={22} className="text-[#EA580C]" />
            </div>
            <div className="stat-text-stack">
              <span className="stat-label">Pending Reschedule</span>
              <span className="stat-number">{complaintsSummary?.pending_reschedule ?? 7}</span>
              <div className="stat-trend trend-up">
                <span className="trend-arrow">&uarr;</span>
                <span>33%</span>
                <span className="trend-context">vs. last 7 days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Rescheduled */}
        <div className="cr-stat-card">
          <div className="stat-card-left">
            <div className="stat-icon-circle icon-green">
              <Calendar size={22} className="text-[#16A34A]" />
            </div>
            <div className="stat-text-stack">
              <span className="stat-label">Rescheduled</span>
              <span className="stat-number">{complaintsSummary?.rescheduled ?? 13}</span>
              <div className="stat-trend trend-up">
                <span className="trend-arrow">&uarr;</span>
                <span>25%</span>
                <span className="trend-context">vs. last 7 days</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Filter Bar with Search on Left and Filter Controls on Right */}
      <div className="cr-filter-card">
        <div className="cr-filter-row">
          {/* Search Bar on Left matching portal design */}
          <div className="cr-search-box">
            <Search size={16} className="cr-search-icon" />
            <input
              type="text"
              placeholder="Search by Order ID, customer, or reason..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="cr-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="cr-search-clear-btn"
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="cr-filter-actions">
            {/* Status Select */}
            <div className="cr-select-wrapper">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="cr-filter-select"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING_RESCHEDULE">Pending Reschedule</option>
                <option value="RESCHEDULED">Rescheduled</option>
              </select>
              <ChevronDown size={14} className="cr-select-chevron" />
            </div>

            {/* Date Range Select */}
            <div className="cr-select-wrapper">
              <Calendar size={14} className="cr-select-lead-icon" />
              <select
                value={dateRangeFilter}
                onChange={(e) => {
                  setDateRangeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="cr-filter-select pl-8"
              >
                <option value="ALL">Select Date Range</option>
                <option value="TODAY">Today</option>
                <option value="YESTERDAY">Yesterday</option>
                <option value="LAST_WEEK">Last Week</option>
              </select>
              <ChevronDown size={14} className="cr-select-chevron" />
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              className="cr-filter-btn"
              onClick={() => fetchComplaints()}
              title="Refresh complaints"
              disabled={complaintsLoading}
            >
              <RotateCcw size={15} className={complaintsLoading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Delivery Complaints Table matching Reference Image 3 (Staff Info Removed) */}
      <div className="cr-table-card">
        <div className="cr-table-responsive">
          <table className="cr-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer Name</th>
                <th>Failure Reason</th>
                <th>Report Date</th>
                <th>Reschedule Date</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {complaintsLoading ? (
                <tr>
                  <td colSpan="7" className="cr-table-loading">
                    <RefreshCw size={22} className="animate-spin text-[#0D7A75]" />
                    <span>Loading delivery reports...</span>
                  </td>
                </tr>
              ) : currentComplaints.length === 0 ? (
                <tr>
                  <td colSpan="7" className="cr-table-empty">
                    <FileText size={32} className="text-slate-300 mb-2" />
                    <p className="text-slate-600 font-medium">No complaints found</p>
                    <p className="text-xs text-slate-400">Try adjusting your status or date filters.</p>
                  </td>
                </tr>
              ) : (
                currentComplaints.map((item) => {
                  const isPending = String(item.status || '').toUpperCase().includes('PENDING');

                  return (
                    <tr key={item.id} className="cr-table-row">
                      {/* Order ID */}
                      <td className="cr-cell-order-id">
                        <span className="order-id-bold font-mono font-bold text-slate-900">
                          {formatOrderId(item.order_id_display || item.order_id || item.id)}
                        </span>
                      </td>

                      {/* Customer Name */}
                      <td className="cr-cell-customer">
                        <span className="customer-name-text text-slate-700 font-medium">
                          {item.customer_name || 'Rohit Sharma'}
                        </span>
                      </td>

                      {/* Failure Reason */}
                      <td className="cr-cell-reason">
                        <span className="failure-reason-text text-slate-600">
                          {item.failure_reason || 'Customer Unavailable'}
                        </span>
                      </td>

                      {/* Report Date */}
                      <td className="cr-cell-date">
                        <span className="date-main text-slate-700">
                          {item.formatted_report_date || item.report_date || '16 Oct 2026'}
                        </span>
                      </td>

                      {/* Reschedule Date & Time */}
                      <td className="cr-cell-reschedule">
                        <span className="reschedule-date-text text-slate-700">
                          {item.formatted_reschedule_date || item.rescheduled_date || '—'}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="cr-cell-status">
                        {getStatusBadge(item.status)}
                      </td>

                      {/* Actions */}
                      <td className="cr-cell-actions">
                        <div className="cr-actions-cluster justify-end">
                          <button
                            type="button"
                            className="btn-view-details"
                            onClick={() => handleViewDetails(item)}
                          >
                            View Details
                          </button>

                          {isPending && (
                            <button
                              type="button"
                              className="btn-reschedule-action"
                              onClick={() => handleRescheduleClick(item)}
                            >
                              Reschedule
                            </button>
                          )}

                          <button
                            type="button"
                            className="btn-menu-kebab"
                            onClick={() => handleViewDetails(item)}
                            title="More options"
                          >
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Pagination Bar matching Reference Image 3 */}
        <div className="cr-pagination-bar">
          <div className="pagination-count-label">
            Showing {totalItems === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} complaints
          </div>

          <div className="pagination-controls">
            <button
              type="button"
              className="page-nav-btn"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              aria-label="Previous Page"
            >
              &lt;
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                className={`page-num-btn ${currentPage === pageNum ? 'active' : ''}`}
                onClick={() => handlePageChange(pageNum)}
              >
                {pageNum}
              </button>
            ))}

            <button
              type="button"
              className="page-nav-btn"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => handlePageChange(currentPage + 1)}
              aria-label="Next Page"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      {/* 6. Reschedule Delivery Drawer (Sliding Panel from Right) */}
      <RescheduleDeliveryDrawer />

      {/* 7. View Details Modal (Matching Services & Pricing Edit Modal Behavior & Structure) */}
      {detailsModalOpen && selectedComplaint && typeof document !== 'undefined' && createPortal(
        <div className="modal-backdrop-overlay animate-fade-in" onClick={() => setDetailsModalOpen(false)}>
          <div className="modal-box-card animate-scale-up" onClick={(e) => e.stopPropagation()}>
            <div className="modal-box-header">
              <div className="modal-title-wrap">
                <div className="modal-icon-badge">
                  <FileText size={18} color="#0D7A75" strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="modal-heading">Complaint Details</h3>
                  <p className="modal-sub">
                    {formatOrderId(selectedComplaint.order_id_display || selectedComplaint.order_id || selectedComplaint.id)} &bull; Review failure reason and complaint details.
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                className="modal-close-icon"
                onClick={() => setDetailsModalOpen(false)}
                title="Close details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body-scrollable">
              <div className="detail-meta-grid">
                <div className="detail-item">
                  <span className="detail-label">Order ID</span>
                  <span className="detail-value font-mono font-bold text-slate-900">
                    {formatOrderId(selectedComplaint.order_id_display || selectedComplaint.order_id || selectedComplaint.id)}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Current Status</span>
                  <div className="pt-0.5">{getStatusBadge(selectedComplaint.status)}</div>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Customer Name</span>
                  <span className="detail-value font-semibold text-slate-900">
                    {selectedComplaint.customer_name || 'Customer'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Customer Phone</span>
                  <span className="detail-value font-medium text-slate-800">
                    {selectedComplaint.customer_phone || '+91 98765 43210'}
                  </span>
                </div>
                <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                  <span className="detail-label">Failure Reason</span>
                  <span className="detail-value text-amber-700 font-semibold">
                    {selectedComplaint.failure_reason || 'Customer Unavailable'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Report Date</span>
                  <span className="detail-value text-slate-700">
                    {selectedComplaint.formatted_report_date || selectedComplaint.report_date_only || selectedComplaint.report_date}
                  </span>
                </div>
                {selectedComplaint.rescheduled_date && (
                  <div className="detail-item">
                    <span className="detail-label">Rescheduled Date</span>
                    <span className="detail-value text-emerald-700 font-semibold">
                      {selectedComplaint.formatted_reschedule_date || selectedComplaint.rescheduled_date} {selectedComplaint.rescheduled_time_slot ? `(${selectedComplaint.rescheduled_time_slot})` : ''}
                    </span>
                  </div>
                )}
              </div>

              {selectedComplaint.notes && (
                <div className="detail-notes-box">
                  <span className="detail-label font-bold block mb-1">
                    Complaint &amp; Reschedule Notes
                  </span>
                  <p className="detail-notes-text">
                    {selectedComplaint.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="modal-box-footer">
              <button
                type="button"
                className="modal-btn-cancel"
                onClick={() => setDetailsModalOpen(false)}
              >
                Close
              </button>
              {selectedComplaint.status === 'PENDING_RESCHEDULE' && (
                <button
                  type="button"
                  className="modal-btn-action flex items-center gap-1.5"
                  onClick={() => {
                    setDetailsModalOpen(false);
                    handleRescheduleClick(selectedComplaint);
                  }}
                >
                  <CalendarCheck size={15} />
                  <span>Reschedule Delivery</span>
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Scoped CSS Styles matching Reference Image 3 */}
      <style>{`
        .cr-page-container {
          padding: 0 0 40px 0;
          width: 100%;
          box-sizing: border-box;
          margin: 0;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .cr-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #64748B;
          margin-bottom: 8px;
        }
        .cr-breadcrumb-parent {
          color: #64748B;
          font-weight: 500;
        }
        .cr-breadcrumb-sep {
          color: #94A3B8;
        }
        .cr-breadcrumb-current {
          color: #0F172A;
          font-weight: 600;
        }

        .cr-page-title {
          font-size: 26px;
          font-weight: 700;
          color: #0F172A;
          margin: 0 0 4px;
        }
        .cr-page-subtitle {
          font-size: 14px;
          color: #64748B;
          margin: 0 0 24px;
        }

        /* 3 SUMMARY STAT CARDS */
        .cr-summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 24px;
        }
        .cr-stat-card {
          background: #FFFFFF;
          border: 1px solid #F1F5F9;
          border-radius: 14px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .cr-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
        }
        .stat-card-left {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }
        .stat-icon-circle {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .icon-blue { background: #E0F2FE; }
        .icon-orange { background: #FFEDD5; }
        .icon-green { background: #DCFCE7; }
        .icon-purple { background: #F3E8FF; }

        .stat-text-stack {
          display: flex;
          flex-direction: column;
        }
        .stat-label {
          font-size: 13px;
          color: #64748B;
          font-weight: 500;
          margin-bottom: 4px;
        }
        .stat-number {
          font-size: 28px;
          font-weight: 800;
          color: #0F172A;
          line-height: 1.1;
          margin-bottom: 6px;
        }
        .stat-trend {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 600;
        }
        .trend-up {
          color: #16A34A;
        }
        .trend-context {
          font-weight: 400;
          color: #94A3B8;
          margin-left: 2px;
        }

        /* FILTER CARD */
        .cr-filter-card {
          background: #FFFFFF;
          border: 1px solid #F1F5F9;
          border-radius: 12px;
          padding: 14px 20px;
          margin-bottom: 20px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
        }
        .cr-filter-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .cr-search-box {
          position: relative;
          flex: 1;
          min-width: 240px;
          max-width: 400px;
        }
        .cr-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #94A3B8;
          pointer-events: none;
        }
        .cr-search-input {
          width: 100%;
          height: 38px;
          padding: 0 34px 0 36px;
          border: 1.5px solid #E2E8F0;
          border-radius: 8px;
          font-size: 13px;
          color: #1E293B;
          background: #FFFFFF;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .cr-search-input::placeholder {
          color: #94A3B8;
        }
        .cr-search-input:focus {
          border-color: #0D7A75;
          box-shadow: 0 0 0 3px rgba(13, 122, 117, 0.1);
        }
        .cr-search-clear-btn {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          padding: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
        }
        .cr-search-clear-btn:hover {
          color: #475569;
          background: #F1F5F9;
        }
        .cr-filter-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-left: auto;
        }
        .cr-select-wrapper {
          position: relative;
          display: inline-flex;
          align-items: center;
        }
        .cr-filter-select {
          appearance: none;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 9px 36px 9px 14px;
          font-size: 13px;
          font-weight: 500;
          color: #334155;
          cursor: pointer;
          outline: none;
          transition: border-color 0.15s;
        }
        .cr-filter-select:hover, .cr-filter-select:focus {
          border-color: #0D7A75;
        }
        .cr-filter-select.pl-8 {
          padding-left: 32px;
        }
        .cr-select-chevron {
          position: absolute;
          right: 12px;
          pointer-events: none;
          color: #94A3B8;
        }
        .cr-select-lead-icon {
          position: absolute;
          left: 12px;
          pointer-events: none;
          color: #64748B;
        }
        .cr-filter-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #0D7A75;
          color: #FFFFFF;
          border: none;
          border-radius: 8px;
          padding: 9px 18px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
        }
        .cr-filter-btn:hover {
          background: #0A635F;
        }

        /* COMPLAINTS TABLE */
        .cr-table-card {
          background: #FFFFFF;
          border: 1px solid #F1F5F9;
          border-radius: 14px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          overflow: hidden;
        }
        .cr-table-responsive {
          width: 100%;
          overflow-x: auto;
        }
        .cr-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .cr-table th {
          background: #FFFFFF;
          padding: 16px 20px;
          font-size: 12px;
          font-weight: 600;
          color: #64748B;
          border-bottom: 1px solid #F1F5F9;
          white-space: nowrap;
        }
        .cr-table td {
          padding: 18px 20px;
          font-size: 13px;
          color: #1E293B;
          border-bottom: 1px solid #F8FAFC;
          vertical-align: middle;
        }
        .cr-table-row:hover {
          background-color: #F8FAFC;
        }
        .order-id-bold {
          font-weight: 700;
          color: #0F172A;
        }
        .cr-table-loading, .cr-table-empty {
          text-align: center;
          padding: 48px !important;
          color: #64748B;
        }

        /* STATUS BADGES MATCHING REFERENCE IMAGE 3 */
        .cr-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }
        .badge-pending {
          background: #FFEDD5;
          color: #EA580C;
        }
        .badge-rescheduled {
          background: #F3E8FF;
          color: #9333EA;
        }
        .badge-review {
          background: #E0F2FE;
          color: #0284C7;
        }
        .badge-resolved, .badge-delivered {
          background: #DCFCE7;
          color: #16A34A;
        }

        /* ACTIONS */
        .cr-actions-cluster {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .btn-view-details {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 6px 14px;
          font-size: 12px;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-view-details:hover {
          border-color: #0D7A75;
          color: #0D7A75;
        }
        .btn-reschedule-action {
          background: #0D7A75;
          color: #FFFFFF;
          border: none;
          border-radius: 8px;
          padding: 6px 14px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
        }
        .btn-reschedule-action:hover {
          background: #0A635F;
        }
        .btn-menu-kebab {
          background: transparent;
          border: none;
          padding: 6px;
          color: #94A3B8;
          cursor: pointer;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .btn-menu-kebab:hover {
          background: #F1F5F9;
          color: #334155;
        }

        /* PAGINATION */
        .cr-pagination-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          border-top: 1px solid #F1F5F9;
          background: #FFFFFF;
        }
        .pagination-count-label {
          font-size: 13px;
          color: #64748B;
        }
        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .page-num-btn, .page-nav-btn {
          min-width: 32px;
          height: 32px;
          padding: 0 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          border: 1px solid #E2E8F0;
          background: #FFFFFF;
          color: #475569;
          cursor: pointer;
          transition: all 0.15s;
        }
        .page-num-btn:hover, .page-nav-btn:hover:not(:disabled) {
          border-color: #0D7A75;
          color: #0D7A75;
        }
        .page-num-btn.active {
          background: #0D7A75;
          border-color: #0D7A75;
          color: #FFFFFF;
        }
        .page-nav-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* DETAILS MODAL matching Services & Pricing edit modal */
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
          background: #FFFFFF !important;
          border-radius: 16px;
          width: 100%;
          max-width: 540px;
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
          flex-shrink: 0;
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

        .modal-body-scrollable {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          overflow-y: auto !important;
          overscroll-behavior: contain !important;
          flex: 1 1 auto !important;
          min-height: 0 !important;
          -webkit-overflow-scrolling: touch !important;
        }

        .detail-meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 16px 18px;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
        }

        .detail-label {
          font-size: 11px;
          font-weight: 700;
          color: #64748B;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 3px;
        }

        .detail-value {
          font-size: 13.5px;
          color: #0F172A;
        }

        .detail-notes-box {
          padding: 14px 16px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
        }

        .detail-notes-text {
          font-size: 13px;
          color: #334155;
          margin: 4px 0 0;
          line-height: 1.5;
          white-space: pre-wrap;
        }

        .modal-box-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 24px;
          background: #F8FAFC;
          border-top: 1px solid #F1F5F9;
          flex-shrink: 0;
        }

        .modal-reschedule-form-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
        }

        .reschedule-form-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 10px;
          border-bottom: 1px solid #F1F5F9;
        }

        .modal-feedback-alert {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 8px;
        }

        .alert-success {
          background: #F0FDF4;
          border: 1px solid #BBF7D0;
        }

        .alert-error {
          background: #FEF2F2;
          border: 1px solid #FECACA;
        }

        .reschedule-fields-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .reschedule-field-item {
          display: flex;
          flex-direction: column;
        }

        .reschedule-field-item.full-width {
          grid-column: span 2;
        }

        .reschedule-field-label {
          font-size: 12px;
          font-weight: 600;
          color: #334155;
          margin-bottom: 6px;
        }

        .reschedule-date-picker {
          height: 38px;
          padding: 6px 12px;
          border: 1px solid #CBD5E1;
          border-radius: 8px;
          font-size: 13px;
          color: #0F172A;
          background: #FFFFFF;
          outline: none;
          transition: border-color 0.15s;
        }

        .reschedule-date-picker:focus {
          border-color: #0D7A75;
          box-shadow: 0 0 0 2px rgba(13, 122, 117, 0.12);
        }

        .reschedule-slots-flex {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
        }

        .reschedule-slot-pill {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 7px 10px;
          font-size: 11.5px;
          font-weight: 500;
          color: #475569;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .reschedule-slot-pill:hover {
          border-color: #CBD5E1;
          background: #F1F5F9;
        }

        .reschedule-slot-pill.active {
          background: #E6F4F2;
          border-color: #0D7A75;
          color: #0D7A75;
          font-weight: 700;
        }

        .reschedule-textarea {
          padding: 8px 12px;
          border: 1px solid #CBD5E1;
          border-radius: 8px;
          font-size: 13px;
          color: #0F172A;
          background: #FFFFFF;
          outline: none;
          resize: vertical;
          font-family: inherit;
        }

        .reschedule-textarea:focus {
          border-color: #0D7A75;
          box-shadow: 0 0 0 2px rgba(13, 122, 117, 0.12);
        }

        .modal-btn-cancel {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          padding: 9px 18px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .modal-btn-cancel:hover {
          background: #F1F5F9;
          color: #0F172A;
        }

        .modal-btn-action {
          background: #0D7A75;
          border: none;
          padding: 9px 20px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #FFFFFF;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .modal-btn-action:hover {
          background: #0B6B67;
        }

        @media (max-width: 1024px) {
          .cr-summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .cr-page-container {
            padding: 0 0 24px 0;
          }
          .cr-summary-grid {
            grid-template-columns: 1fr;
          }
          .cr-filter-row {
            flex-direction: column;
            gap: 12px;
            align-items: stretch;
          }
          .cr-search-box {
            max-width: 100%;
            width: 100%;
          }
          .cr-filter-actions {
            flex-direction: column;
            width: 100%;
            margin-left: 0;
          }
          .cr-select-wrapper {
            width: 100%;
          }
          .cr-filter-select, .cr-filter-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
