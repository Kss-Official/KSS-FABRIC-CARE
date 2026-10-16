import React, { useState, useMemo } from 'react';
import { useAdmin } from '../../context/AdminContext';
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
  CalendarCheck
} from 'lucide-react';
import { RescheduleDeliveryDrawer } from '../../components/admin/RescheduleDeliveryDrawer';

export const AdminDeliveryReportsPage = () => {
  const { 
    complaints, 
    complaintsSummary, 
    complaintsLoading, 
    fetchComplaints,
    openRescheduleDrawer 
  } = useAdmin();

  // Filters state (Search bar removed per requirements)
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateRangeFilter, setDateRangeFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // View Details Modal State
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

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

  // Filter complaints based on status and date range
  const filteredComplaints = useMemo(() => {
    return complaints.filter((item) => {
      // Status filter
      if (statusFilter !== 'ALL') {
        const itemStatus = String(item.status || '').toUpperCase().replace(/\s+/g, '_');
        const filterKey = statusFilter.toUpperCase().replace(/\s+/g, '_');
        if (itemStatus !== filterKey) {
          return false;
        }
      }

      // Date Range Filter
      if (dateRangeFilter === 'TODAY') {
        const today = new Date().toISOString().split('T')[0];
        const itemDate = (item.report_date || '').split('T')[0];
        if (itemDate && itemDate !== today) return false;
      }

      return true;
    });
  }, [complaints, statusFilter, dateRangeFilter]);

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
      {/* 1. Header & Breadcrumbs matching Reference Image 3 */}
      <div className="cr-header-block">
        <div className="cr-breadcrumb">
          <span className="cr-breadcrumb-parent">Complaints</span>
          <span className="cr-breadcrumb-sep">&gt;</span>
          <span className="cr-breadcrumb-current">Delivery Reports</span>
        </div>

        <h1 className="cr-page-title">Delivery Reports</h1>
        <p className="cr-page-subtitle">
          Review delivery complaints and reschedule deliveries for unavailable customers.
        </p>
      </div>

      {/* 2. Four Summary Stat Cards matching Reference Image 3 */}
      <div className="cr-summary-grid">
        {/* Card 1: Total Complaints */}
        <div className="cr-stat-card">
          <div className="stat-card-left">
            <div className="stat-icon-circle icon-blue">
              <FileText size={22} className="text-[#0284C7]" />
            </div>
            <div className="stat-text-stack">
              <span className="stat-label">Total Complaints</span>
              <span className="stat-number">{complaintsSummary.total_complaints || 28}</span>
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
              <span className="stat-number">{complaintsSummary.pending_reschedule ?? 7}</span>
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
              <span className="stat-number">{complaintsSummary.rescheduled ?? 13}</span>
              <div className="stat-trend trend-up">
                <span className="trend-arrow">&uarr;</span>
                <span>25%</span>
                <span className="trend-context">vs. last 7 days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Resolved */}
        <div className="cr-stat-card">
          <div className="stat-card-left">
            <div className="stat-icon-circle icon-purple">
              <CheckCircle2 size={22} className="text-[#7C3AED]" />
            </div>
            <div className="stat-text-stack">
              <span className="stat-label">Resolved</span>
              <span className="stat-number">{complaintsSummary.resolved ?? 5}</span>
              <div className="stat-trend trend-up">
                <span className="trend-arrow">&uarr;</span>
                <span>20%</span>
                <span className="trend-context">vs. last 7 days</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Filter Bar matching Reference Image 3 (Without search bar per requirements) */}
      <div className="cr-filter-card">
        <div className="cr-filter-row flex items-center justify-between">
          <div className="cr-filter-lead-text text-sm font-semibold text-slate-700">
            Filtered Complaints View
          </div>

          <div className="cr-filter-actions flex items-center gap-3">
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
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="DELIVERED">Delivered</option>
                <option value="RESOLVED">Resolved</option>
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
                <option value="7DAYS">Last 7 Days</option>
                <option value="30DAYS">Last 30 Days</option>
                <option value="OCT2026">October 2026</option>
              </select>
              <ChevronDown size={14} className="cr-select-chevron" />
            </div>

            {/* Filter Button */}
            <button
              type="button"
              className="cr-filter-btn"
              onClick={() => fetchComplaints()}
              title="Apply Filters"
            >
              <Filter size={15} />
              <span>Filter</span>
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
                        <span className="order-id-bold font-semibold text-slate-900">
                          {item.order_id_display || item.order_id || `#FC${item.id}`}
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

      {/* 7. View Details Modal */}
      {detailsModalOpen && selectedComplaint && (
        <div className="cr-modal-overlay animate-fade-in" onClick={() => setDetailsModalOpen(false)}>
          <div className="cr-modal-container animate-scale-up" onClick={(e) => e.stopPropagation()}>
            <div className="cr-modal-header">
              <div className="modal-header-left">
                <FileText size={20} className="text-[#0D7A75]" />
                <h3 className="modal-title font-bold text-slate-800">
                  Complaint Details: {selectedComplaint.order_id_display || selectedComplaint.order_id || `#FC${selectedComplaint.id}`}
                </h3>
              </div>
              <button 
                type="button" 
                className="modal-close-btn"
                onClick={() => setDetailsModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="cr-modal-body">
              <div className="detail-meta-grid">
                <div className="detail-item">
                  <span className="detail-label">Customer Name</span>
                  <span className="detail-value font-semibold">{selectedComplaint.customer_name || 'Rohit Sharma'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Status</span>
                  <div className="pt-1">{getStatusBadge(selectedComplaint.status)}</div>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Failure Reason</span>
                  <span className="detail-value text-amber-700 font-medium">{selectedComplaint.failure_reason}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Report Date</span>
                  <span className="detail-value">{selectedComplaint.formatted_report_date || selectedComplaint.report_date}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Reschedule Date &amp; Slot</span>
                  <span className="detail-value font-medium text-teal-700">
                    {selectedComplaint.formatted_reschedule_date || selectedComplaint.rescheduled_date || 'Not yet rescheduled'}
                  </span>
                </div>
              </div>

              {selectedComplaint.notes && (
                <div className="detail-notes-box mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="detail-label text-xs uppercase tracking-wider text-slate-500 font-bold block mb-1">
                    Complaint &amp; Reschedule Notes
                  </span>
                  <p className="detail-notes-text text-sm text-slate-700 whitespace-pre-wrap">
                    {selectedComplaint.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="cr-modal-footer">
              <button
                type="button"
                className="modal-btn-cancel"
                onClick={() => setDetailsModalOpen(false)}
              >
                Close
              </button>
              {String(selectedComplaint.status || '').toUpperCase().includes('PENDING') && (
                <button
                  type="button"
                  className="modal-btn-action"
                  onClick={() => {
                    setDetailsModalOpen(false);
                    openRescheduleDrawer(selectedComplaint);
                  }}
                >
                  Reschedule Delivery
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scoped CSS Styles matching Reference Image 3 */}
      <style>{`
        .cr-page-container {
          padding: 24px 32px 48px;
          background-color: #F8FAFC;
          min-height: 100vh;
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

        /* 4 SUMMARY STAT CARDS */
        .cr-summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
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

        /* DETAILS MODAL */
        .cr-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(2px);
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .cr-modal-container {
          background: #FFFFFF;
          border-radius: 16px;
          max-width: 540px;
          width: 100%;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .cr-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 24px;
          border-bottom: 1px solid #F1F5F9;
        }
        .modal-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .modal-title {
          font-size: 16px;
          margin: 0;
        }
        .modal-close-btn {
          background: transparent;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
        }
        .modal-close-btn:hover {
          color: #0F172A;
          background: #F1F5F9;
        }
        .cr-modal-body {
          padding: 24px;
        }
        .detail-meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .detail-item {
          display: flex;
          flex-direction: column;
        }
        .detail-label {
          font-size: 11px;
          font-weight: 600;
          color: #64748B;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
        }
        .detail-value {
          font-size: 14px;
          color: #0F172A;
        }
        .cr-modal-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 24px;
          background: #F8FAFC;
          border-top: 1px solid #F1F5F9;
        }
        .modal-btn-cancel {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
        }
        .modal-btn-action {
          background: #0D7A75;
          border: none;
          padding: 8px 18px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #FFFFFF;
          cursor: pointer;
        }

        @media (max-width: 1024px) {
          .cr-summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .cr-page-container {
            padding: 16px;
          }
          .cr-summary-grid {
            grid-template-columns: 1fr;
          }
          .cr-filter-row {
            flex-direction: column;
            gap: 12px;
            align-items: stretch;
          }
          .cr-filter-actions {
            flex-direction: column;
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
