import React, { useState, useMemo } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { 
  FileText, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  Search, 
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
import { filterMatchesDate } from '../../utils/dateFilterUtils';
import { formatOrderId } from '../../utils/helpers';

export const AdminComplaintReportsPage = () => {
  const { 
    complaints = [], 
    complaintsSummary = { total_complaints: 24, pending_reschedule: 8, rescheduled: 10, resolved: 6 }, 
    complaintsLoading = false, 
    fetchComplaints = () => {},
    openRescheduleDrawer = () => {} 
  } = useAdmin() || {};

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateRangeFilter, setDateRangeFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // View Details Modal State
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Status mapping for visual badge styling
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

  // Filter complaints based on search and filters, ensuring newest appear first
  const filteredComplaints = useMemo(() => {
    const list = (complaints || []).filter((item) => {
      // Exclude FC-57606 as requested
      const orderIdStr = String(item.order_id_display || item.order_id || item.id || '').toUpperCase();
      if (orderIdStr.includes('FC-57606') || orderIdStr.includes('57606')) {
        return false;
      }

      // Search
      const query = searchQuery.trim().toLowerCase();
      if (query) {
        const orderIdMatch = (item.order_id || item.order_id_display || item.id || '').toLowerCase().includes(query);
        const nameMatch = (item.customer_name || '').toLowerCase().includes(query);
        const reasonMatch = (item.failure_reason || '').toLowerCase().includes(query);
        const staffMatch = (item.reported_by_name || '').toLowerCase().includes(query);
        if (!orderIdMatch && !nameMatch && !reasonMatch && !staffMatch) {
          return false;
        }
      }

      // Status
      if (statusFilter !== 'ALL') {
        const itemStatus = String(item.status || '').toUpperCase().replace(/\s+/g, '_');
        const filterKey = statusFilter.toUpperCase().replace(/\s+/g, '_');
        if (itemStatus !== filterKey) {
          return false;
        }
      }

      // Date Range Filter
      if (!filterMatchesDate(item, dateRangeFilter, ['report_date', 'created_at', 'createdAt', 'updatedAt', 'date'])) {
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
      {/* 1. Header & Breadcrumbs matching UI Reference */}
      <div className="cr-header-block">
        <div className="cr-breadcrumb">
          <span className="cr-breadcrumb-parent">Reports</span>
          <span className="cr-breadcrumb-sep">&gt;</span>
          <span className="cr-breadcrumb-current">Complaint Reports</span>
        </div>

        <h1 className="cr-page-title">Complaint Reports</h1>
        <p className="cr-page-subtitle">
          Review delivery complaints and reschedule deliveries for unavailable customers.
        </p>
      </div>

      {/* 2. Four Summary Stat Cards matching UI Reference */}
      <div className="cr-summary-grid">
        {/* Card 1: Total Complaints */}
        <div className="cr-stat-card">
          <div className="stat-card-left">
            <div className="stat-icon-circle icon-blue">
              <FileText size={22} className="text-[#0284C7]" />
            </div>
            <div className="stat-text-stack">
              <span className="stat-label">Total Complaints</span>
              <span className="stat-number">{complaintsSummary?.total_complaints ?? 24}</span>
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
              <span className="stat-number">{complaintsSummary?.pending_reschedule ?? 8}</span>
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
              <Calendar size={22} className="text-[#059669]" />
            </div>
            <div className="stat-text-stack">
              <span className="stat-label">Rescheduled</span>
              <span className="stat-number">{complaintsSummary?.rescheduled ?? 10}</span>
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
              <span className="stat-number">{complaintsSummary?.resolved ?? 6}</span>
              <div className="stat-trend trend-up">
                <span className="trend-arrow">&uarr;</span>
                <span>20%</span>
                <span className="trend-context">vs. last 7 days</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Filter Bar matching UI Reference */}
      <div className="cr-filter-card">
        <div className="cr-filter-row">
          {/* Search Input */}
          <div className="cr-search-wrapper">
            <Search size={16} className="cr-search-icon" />
            <input
              type="text"
              placeholder="Search by Order ID, Customer Name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="cr-search-input"
            />
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
                <option value="YESTERDAY">Yesterday</option>
                <option value="LAST_WEEK">Last Week</option>
                <option value="LAST_30">Last 30 Days</option>
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

      {/* 4. Complaints Table matching UI Reference */}
      <div className="cr-table-card">
        <div className="cr-table-responsive">
          <table className="cr-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer Name</th>
                <th>Failure Reason</th>
                <th>Reported By</th>
                <th>Report Date</th>
                <th>Reschedule Date</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {complaintsLoading ? (
                <tr>
                  <td colSpan="8" className="cr-table-empty">
                    <RefreshCw size={24} className="animate-spin text-[#087F8C] mx-auto mb-2" />
                    <span>Loading complaint reports...</span>
                  </td>
                </tr>
              ) : currentComplaints.length === 0 ? (
                <tr>
                  <td colSpan="8" className="cr-table-empty">
                    <AlertTriangle size={28} className="text-slate-300 mx-auto mb-2" />
                    <p className="font-medium text-slate-600">No complaints found matching your criteria</p>
                    <span className="text-xs text-slate-400">Try clearing filters or search keyword</span>
                  </td>
                </tr>
              ) : (
                currentComplaints.map((item) => {
                  const isPending = item.status === 'PENDING_RESCHEDULE';
                  
                  // Split reported_by and staff role subtext
                  let staffName = item.reported_by_name || 'Delivery Staff';
                  let staffRole = '(Delivery Staff)';
                  if (staffName.includes('(')) {
                    const parts = staffName.split('(');
                    staffName = parts[0].trim();
                    staffRole = `(${parts[1]}`.trim();
                  }

                  // Split report date and time
                  let reportDatePart = item.formatted_report_date || '16 Oct 2025';
                  let reportTimePart = '10:24 AM';
                  if (reportDatePart.includes(',')) {
                    const parts = reportDatePart.split(',');
                    reportDatePart = parts[0].trim();
                    reportTimePart = (parts[1] || '').trim();
                  } else if (reportDatePart.split(' ').length > 3) {
                    const words = reportDatePart.split(' ');
                    reportDatePart = `${words[0]} ${words[1]} ${words[2]}`;
                    reportTimePart = words.slice(3).join(' ');
                  }

                  // Reschedule date & note
                  const reschedDisplay = item.formatted_reschedule_date || '—';

                  return (
                    <tr key={item.id} className="cr-table-row">
                      {/* Order ID */}
                      <td className="cr-order-id-cell">
                        <span className="cr-order-id font-mono font-bold">{formatOrderId(item.order_id || item.id)}</span>
                      </td>

                      {/* Customer Name */}
                      <td className="cr-customer-cell">
                        <span className="cr-customer-name">{item.customer_name}</span>
                      </td>

                      {/* Failure Reason */}
                      <td className="cr-reason-cell">
                        <span className="cr-reason-text">{item.failure_reason}</span>
                      </td>

                      {/* Reported By */}
                      <td className="cr-reported-by-cell">
                        <div className="cr-staff-stack">
                          <span className="cr-staff-name">{staffName}</span>
                          <span className="cr-staff-role">{staffRole}</span>
                        </div>
                      </td>

                      {/* Report Date */}
                      <td className="cr-date-cell">
                        <div className="cr-date-stack">
                          <span className="cr-date-main">{reportDatePart}</span>
                          <span className="cr-time-sub">{reportTimePart}</span>
                        </div>
                      </td>

                      {/* Reschedule Date */}
                      <td className="cr-reschedule-cell">
                        <span className={`cr-resched-text ${reschedDisplay === '—' ? 'text-slate-400' : ''}`}>
                          {reschedDisplay}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="cr-status-cell">
                        {getStatusBadge(item.status)}
                      </td>

                      {/* Actions */}
                      <td className="cr-actions-cell text-right">
                        <div className="cr-actions-group">
                          <button
                            type="button"
                            className="cr-btn-details"
                            onClick={() => handleViewDetails(item)}
                          >
                            View Details
                          </button>

                          {isPending && (
                            <button
                              type="button"
                              className="cr-btn-reschedule"
                              onClick={() => handleRescheduleClick(item)}
                            >
                              Reschedule
                            </button>
                          )}

                          <button 
                            type="button" 
                            className="cr-btn-dots"
                            onClick={() => handleViewDetails(item)}
                            aria-label="More options"
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

        {/* 5. Pagination Footer matching UI Reference */}
        <div className="cr-pagination-row">
          <div className="cr-pagination-info">
            Showing {totalItems > 0 ? startIndex + 1 : 0}–{Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} complaints
          </div>

          <div className="cr-pagination-nav">
            <button
              type="button"
              className="pagination-btn arrow-btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              aria-label="Previous Page"
            >
              &lt;
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                className={`pagination-btn number-btn ${currentPage === pageNum ? 'active' : ''}`}
                onClick={() => handlePageChange(pageNum)}
              >
                {pageNum}
              </button>
            ))}

            <button
              type="button"
              className="pagination-btn arrow-btn"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              aria-label="Next Page"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      {/* 6. View Details Modal */}
      {detailsModalOpen && selectedComplaint && (
        <div className="cr-modal-backdrop animate-fade-in" onClick={() => setDetailsModalOpen(false)}>
          <div className="cr-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="cr-modal-header">
              <div className="modal-header-left">
                <FileText size={20} className="text-[#087F8C]" />
                <h3 className="modal-title">Complaint Audit Details</h3>
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
              <div className="modal-summary-box">
                <div className="modal-row">
                  <span className="modal-label">Order Reference:</span>
                  <span className="modal-val font-mono font-bold text-[#0F172A]">{formatOrderId(selectedComplaint.order_id || selectedComplaint.id)}</span>
                </div>
                <div className="modal-row">
                  <span className="modal-label">Customer Name:</span>
                  <span className="modal-val font-semibold">{selectedComplaint.customer_name}</span>
                </div>
                <div className="modal-row">
                  <span className="modal-label">Customer Contact:</span>
                  <span className="modal-val">{selectedComplaint.customer_phone || '+91 98765 43210'}</span>
                </div>
                <div className="modal-row">
                  <span className="modal-label">Failure Reason:</span>
                  <span className="modal-val text-red-600 font-semibold">{selectedComplaint.failure_reason}</span>
                </div>
                <div className="modal-row">
                  <span className="modal-label">Reported By:</span>
                  <span className="modal-val">{selectedComplaint.reported_by_name}</span>
                </div>
                <div className="modal-row">
                  <span className="modal-label">Report Date:</span>
                  <span className="modal-val">{selectedComplaint.formatted_report_date}</span>
                </div>
                <div className="modal-row">
                  <span className="modal-label">Current Reschedule:</span>
                  <span className="modal-val">{selectedComplaint.formatted_reschedule_date || '—'}</span>
                </div>
                <div className="modal-row">
                  <span className="modal-label">Complaint Status:</span>
                  <span className="modal-val">{getStatusBadge(selectedComplaint.status)}</span>
                </div>
              </div>

              {selectedComplaint.notes && (
                <div className="modal-notes-section">
                  <h4 className="modal-notes-heading">Field Staff / Admin Remarks</h4>
                  <div className="modal-notes-content">
                    {selectedComplaint.notes}
                  </div>
                </div>
              )}
            </div>

            <div className="cr-modal-footer">
              <button 
                type="button" 
                className="btn btn-outline-secondary"
                onClick={() => setDetailsModalOpen(false)}
              >
                Close
              </button>
              {selectedComplaint.status === 'PENDING_RESCHEDULE' && (
                <button
                  type="button"
                  className="cr-btn-reschedule ml-2"
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

      {/* 7. Right-Side Reschedule Delivery Panel Drawer */}
      <RescheduleDeliveryDrawer />

      {/* Component Styles matching UI Reference */}
      <style>{`
        .cr-page-container {
          padding: 24px 32px 48px;
          max-width: 1380px;
          margin: 0 auto;
          color: #1E293B;
          font-family: inherit;
        }

        @media (max-width: 768px) {
          .cr-page-container {
            padding: 16px;
          }
        }

        /* 1. Header & Breadcrumbs */
        .cr-header-block {
          margin-bottom: 24px;
        }

        .cr-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.82rem;
          color: #64748B;
          margin-bottom: 6px;
        }

        .cr-breadcrumb-parent {
          color: #64748B;
          cursor: pointer;
        }

        .cr-breadcrumb-sep {
          color: #94A3B8;
        }

        .cr-breadcrumb-current {
          color: #0F172A;
          font-weight: 600;
        }

        .cr-page-title {
          font-size: 1.625rem;
          font-weight: 700;
          color: #0F172A;
          letter-spacing: -0.02em;
          margin: 0 0 4px 0;
        }

        .cr-page-subtitle {
          font-size: 0.9rem;
          color: #64748B;
          margin: 0;
        }

        /* 2. Summary Grid (4 Cards) */
        .cr-summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        @media (max-width: 1024px) {
          .cr-summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .cr-summary-grid {
            grid-template-columns: 1fr;
          }
        }

        .cr-stat-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
          transition: transform 0.15s, box-shadow 0.15s;
        }

        .cr-stat-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .stat-card-left {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          width: 100%;
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

        .icon-blue {
          background: #E0F2FE;
        }

        .icon-orange {
          background: #FFEDD5;
        }

        .icon-green {
          background: #DCFCE7;
        }

        .icon-purple {
          background: #F3E8FF;
        }

        .stat-text-stack {
          display: flex;
          flex-direction: column;
        }

        .stat-label {
          font-size: 0.8rem;
          font-weight: 500;
          color: #64748B;
          margin-bottom: 2px;
        }

        .stat-number {
          font-size: 1.625rem;
          font-weight: 700;
          color: #0F172A;
          line-height: 1.2;
          margin-bottom: 4px;
        }

        .stat-trend {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.74rem;
        }

        .trend-up {
          color: #16A34A;
          font-weight: 600;
        }

        .trend-arrow {
          font-size: 0.85rem;
          font-weight: bold;
        }

        .trend-context {
          color: #94A3B8;
          font-weight: 400;
        }

        /* 3. Filter Bar */
        .cr-filter-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 14px 20px;
          margin-bottom: 16px;
        }

        .cr-filter-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .cr-search-wrapper {
          position: relative;
          flex: 1;
          min-width: 260px;
        }

        .cr-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #94A3B8;
        }

        .cr-search-input {
          width: 100%;
          padding: 9px 14px 9px 38px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          font-size: 0.88rem;
          color: #1E293B;
          outline: none;
          transition: border-color 0.15s, background 0.15s;
        }

        .cr-search-input:focus {
          background: #FFFFFF;
          border-color: #087F8C;
        }

        .cr-filter-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .cr-select-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .cr-select-lead-icon {
          position: absolute;
          left: 12px;
          color: #64748B;
          pointer-events: none;
        }

        .cr-select-chevron {
          position: absolute;
          right: 12px;
          color: #64748B;
          pointer-events: none;
        }

        .cr-filter-select {
          appearance: none;
          padding: 9px 34px 9px 14px;
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          border-radius: 8px;
          font-size: 0.86rem;
          font-weight: 500;
          color: #334155;
          cursor: pointer;
          outline: none;
          transition: border-color 0.15s;
        }

        .cr-filter-select.pl-8 {
          padding-left: 32px;
        }

        .cr-filter-select:focus {
          border-color: #087F8C;
        }

        .cr-filter-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 9px 18px;
          background: #087F8C;
          color: #FFFFFF;
          border: 1px solid #087F8C;
          border-radius: 8px;
          font-size: 0.86rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
        }

        .cr-filter-btn:hover {
          background: #066974;
        }

        /* 4. Complaints Table */
        .cr-table-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }

        .cr-table-responsive {
          overflow-x: auto;
          width: 100%;
        }

        .cr-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .cr-table th {
          background: #F8FAFC;
          padding: 14px 18px;
          font-size: 0.78rem;
          font-weight: 600;
          color: #64748B;
          border-bottom: 1px solid #E2E8F0;
          white-space: nowrap;
          text-transform: capitalize;
        }

        .cr-table td {
          padding: 14px 18px;
          font-size: 0.86rem;
          color: #334155;
          border-bottom: 1px solid #F1F5F9;
          vertical-align: middle;
        }

        .cr-table-row:hover td {
          background: #F8FAFC;
        }

        .cr-table-empty {
          padding: 48px 24px;
          text-align: center;
          color: #64748B;
        }

        .cr-order-id {
          font-family: inherit;
          font-weight: 700;
          color: #0F172A;
        }

        .cr-customer-name {
          font-weight: 500;
          color: #1E293B;
        }

        .cr-reason-text {
          color: #334155;
        }

        .cr-staff-stack {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .cr-staff-name {
          font-weight: 500;
          color: #1E293B;
        }

        .cr-staff-role {
          font-size: 0.75rem;
          color: #64748B;
        }

        .cr-date-stack {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .cr-date-main {
          font-weight: 500;
          color: #1E293B;
        }

        .cr-time-sub {
          font-size: 0.75rem;
          color: #64748B;
        }

        .cr-resched-text {
          font-size: 0.84rem;
          color: #334155;
        }

        /* Status Badges matching Screenshot */
        .cr-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 9999px;
          font-size: 0.74rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .badge-pending {
          background: #FFF7ED;
          color: #EA580C;
          border: 1px solid #FFEDD5;
        }

        .badge-rescheduled {
          background: #F5F3FF;
          color: #8B5CF6;
          border: 1px solid #EDE9FE;
        }

        .badge-review {
          background: #F0F9FF;
          color: #0284C7;
          border: 1px solid #E0F2FE;
        }

        .badge-delivered,
        .badge-resolved {
          background: #F0FDF4;
          color: #16A34A;
          border: 1px solid #DCFCE7;
        }

        /* Action Buttons matching Screenshot */
        .cr-actions-group {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
        }

        .cr-btn-details {
          padding: 5px 12px;
          font-size: 0.78rem;
          font-weight: 500;
          color: #334155;
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }

        .cr-btn-details:hover {
          background: #F8FAFC;
          border-color: #94A3B8;
          color: #0F172A;
        }

        .cr-btn-reschedule {
          padding: 5px 14px;
          font-size: 0.78rem;
          font-weight: 600;
          color: #FFFFFF;
          background: #087F8C;
          border: 1px solid #087F8C;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.15s;
          white-space: nowrap;
        }

        .cr-btn-reschedule:hover {
          background: #066974;
        }

        .cr-btn-dots {
          background: none;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.15s;
        }

        .cr-btn-dots:hover {
          color: #1E293B;
        }

        /* 5. Pagination Footer */
        .cr-pagination-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-top: 1px solid #F1F5F9;
          font-size: 0.82rem;
          color: #64748B;
          flex-wrap: wrap;
          gap: 12px;
        }

        .cr-pagination-nav {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .pagination-btn {
          min-width: 28px;
          height: 28px;
          padding: 0 8px;
          border-radius: 6px;
          border: 1px solid #E2E8F0;
          background: #FFFFFF;
          color: #475569;
          font-size: 0.82rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }

        .pagination-btn:hover:not(:disabled) {
          border-color: #CBD5E1;
          color: #0F172A;
          background: #F8FAFC;
        }

        .pagination-btn.active {
          background: #087F8C;
          color: #FFFFFF;
          border-color: #087F8C;
          font-weight: 600;
        }

        .pagination-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* 6. Details Modal */
        .cr-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(2px);
          z-index: 1060;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }

        .cr-modal-dialog {
          background: #FFFFFF;
          border-radius: 12px;
          width: 100%;
          max-width: 520px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          overflow: hidden;
        }

        .cr-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid #F1F5F9;
        }

        .modal-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .modal-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: #0F172A;
          margin: 0;
        }

        .modal-close-btn {
          background: none;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          padding: 4px;
        }

        .cr-modal-body {
          padding: 20px;
        }

        .modal-summary-box {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 0.86rem;
        }

        .modal-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-label {
          color: #64748B;
          font-weight: 500;
        }

        .modal-val {
          color: #1E293B;
          text-align: right;
        }

        .modal-notes-section {
          margin-top: 16px;
        }

        .modal-notes-heading {
          font-size: 0.8rem;
          font-weight: 600;
          color: #64748B;
          text-transform: uppercase;
          margin: 0 0 6px 0;
        }

        .modal-notes-content {
          background: #FFFBEB;
          border: 1px solid #FEF3C7;
          border-radius: 6px;
          padding: 10px 12px;
          font-size: 0.84rem;
          color: #92400E;
          white-space: pre-wrap;
        }

        .cr-modal-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding: 14px 20px;
          border-top: 1px solid #F1F5F9;
          background: #FAFBFD;
        }
      `}</style>
    </div>
  );
};
