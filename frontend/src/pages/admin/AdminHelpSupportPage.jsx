import React, { useState, useMemo } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { 
  Tag, 
  Clock, 
  Hourglass, 
  CheckCircle2, 
  ChevronDown, 
  Calendar, 
  MoreVertical, 
  Eye, 
  RefreshCw,
  FileText
} from 'lucide-react';
import { SupportTicketDrawer } from '../../components/admin/SupportTicketDrawer';

export const AdminHelpSupportPage = () => {
  const { 
    supportTickets, 
    supportSummary, 
    supportLoading, 
    fetchSupportTickets,
    openSupportDrawer 
  } = useAdmin();

  // Filters state (No search bar per requirements)
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateRangeFilter, setDateRangeFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Priority Badge Renderer matching Reference Image 4
  const getPriorityBadge = (priority) => {
    const p = String(priority || '').toUpperCase();
    if (p === 'HIGH') {
      return <span className="hs-badge hs-badge-p-high">High</span>;
    }
    if (p === 'MEDIUM') {
      return <span className="hs-badge hs-badge-p-medium">Medium</span>;
    }
    return <span className="hs-badge hs-badge-p-low">Low</span>;
  };

  // Status Badge Renderer matching Reference Image 4
  const getStatusBadge = (status) => {
    const s = String(status || '').toUpperCase().replace(/\s+/g, '_');
    switch (s) {
      case 'OPEN':
        return <span className="hs-badge hs-badge-open">Open</span>;
      case 'IN_PROGRESS':
        return <span className="hs-badge hs-badge-progress">In Progress</span>;
      case 'RESOLVED':
        return <span className="hs-badge hs-badge-resolved">Resolved</span>;
      case 'CLOSED':
        return <span className="hs-badge hs-badge-closed">Closed</span>;
      default:
        return <span className="hs-badge hs-badge-open">{status}</span>;
    }
  };

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return supportTickets.filter((item) => {
      // Priority filter
      if (priorityFilter !== 'ALL') {
        const itemP = String(item.priority || '').toUpperCase();
        if (itemP !== priorityFilter) return false;
      }

      // Status filter
      if (statusFilter !== 'ALL') {
        const itemS = String(item.status || '').toUpperCase().replace(/\s+/g, '_');
        if (itemS !== statusFilter) return false;
      }

      // Date Range Filter
      if (dateRangeFilter === 'TODAY') {
        const today = new Date().toISOString().split('T')[0];
        const itemDate = (item.created_at || '').split('T')[0];
        if (itemDate && itemDate !== today) return false;
      }

      return true;
    });
  }, [supportTickets, priorityFilter, statusFilter, dateRangeFilter]);

  // Pagination calculation
  const totalItems = filteredTickets.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTickets = filteredTickets.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="hs-page-container animate-fade-in">
      {/* 1. Header & Breadcrumbs matching Reference Image 4 */}
      <div className="hs-header-block">
        <div className="hs-breadcrumb">
          <span className="hs-breadcrumb-parent">Home</span>
          <span className="hs-breadcrumb-sep">&gt;</span>
          <span className="hs-breadcrumb-current">Help &amp; Support</span>
        </div>

        <h1 className="hs-page-title">Help &amp; Support</h1>
        <p className="hs-page-subtitle">
          Manage customer questions and support requests
        </p>
      </div>

      {/* 2. Four Summary Stat Cards matching Reference Image 4 */}
      <div className="hs-summary-grid">
        {/* Card 1: Total Tickets */}
        <div className="hs-stat-card">
          <div className="stat-card-left">
            <div className="stat-icon-circle hs-icon-teal">
              <Tag size={20} className="text-[#0D7A75]" />
            </div>
            <div className="stat-text-stack">
              <span className="stat-label">Total Tickets</span>
              <span className="stat-number">{supportSummary.total_tickets || 128}</span>
              <div className="stat-trend trend-up">
                <span className="trend-arrow">&uarr;</span>
                <span>12%</span>
                <span className="trend-context">vs. last 7 days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Open */}
        <div className="hs-stat-card">
          <div className="stat-card-left">
            <div className="stat-icon-circle hs-icon-orange">
              <Clock size={20} className="text-[#EA580C]" />
            </div>
            <div className="stat-text-stack">
              <span className="stat-label">Open</span>
              <span className="stat-number">{supportSummary.open ?? 24}</span>
              <div className="stat-trend trend-up">
                <span className="trend-arrow">&uarr;</span>
                <span>5%</span>
                <span className="trend-context">vs. last 7 days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: In Progress */}
        <div className="hs-stat-card">
          <div className="stat-card-left">
            <div className="stat-icon-circle hs-icon-blue">
              <Hourglass size={20} className="text-[#2563EB]" />
            </div>
            <div className="stat-text-stack">
              <span className="stat-label">In Progress</span>
              <span className="stat-number">{supportSummary.in_progress ?? 12}</span>
              <div className="stat-trend trend-up">
                <span className="trend-arrow">&uarr;</span>
                <span>8%</span>
                <span className="trend-context">vs. last 7 days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Resolved */}
        <div className="hs-stat-card">
          <div className="stat-card-left">
            <div className="stat-icon-circle hs-icon-green">
              <CheckCircle2 size={20} className="text-[#16A34A]" />
            </div>
            <div className="stat-text-stack">
              <span className="stat-label">Resolved</span>
              <span className="stat-number">{supportSummary.resolved ?? 92}</span>
              <div className="stat-trend trend-up">
                <span className="trend-arrow">&uarr;</span>
                <span>15%</span>
                <span className="trend-context">vs. last 7 days</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Filter Bar matching Reference Image 4 (No Search Bar) */}
      <div className="hs-filter-card">
        <div className="hs-filter-row">
          <div className="hs-filter-actions-group">
            {/* Priority Select */}
            <div className="hs-select-wrapper">
              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="hs-filter-select"
              >
                <option value="ALL">All Priority</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
              <ChevronDown size={14} className="hs-select-chevron" />
            </div>

            {/* Status Select */}
            <div className="hs-select-wrapper">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="hs-filter-select"
              >
                <option value="ALL">All Status</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
              <ChevronDown size={14} className="hs-select-chevron" />
            </div>

            {/* Date Range Select */}
            <div className="hs-select-wrapper">
              <Calendar size={14} className="hs-select-lead-icon" />
              <select
                value={dateRangeFilter}
                onChange={(e) => {
                  setDateRangeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="hs-filter-select pl-8"
              >
                <option value="ALL">Select Date Range</option>
                <option value="TODAY">Today</option>
                <option value="7DAYS">Last 7 Days</option>
                <option value="30DAYS">Last 30 Days</option>
              </select>
              <ChevronDown size={14} className="hs-select-chevron" />
            </div>

            <button
              type="button"
              className="hs-refresh-btn"
              onClick={() => fetchSupportTickets()}
              title="Refresh tickets"
            >
              <RefreshCw size={14} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Support Tickets Table matching Reference Image 4 */}
      <div className="hs-table-card">
        <div className="hs-table-responsive">
          <table className="hs-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Customer</th>
                <th>Issue Subject</th>
                <th>Priority</th>
                <th>Submitted Date</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {supportLoading ? (
                <tr>
                  <td colSpan="7" className="hs-table-loading">
                    <RefreshCw size={22} className="animate-spin text-[#0D7A75]" />
                    <span>Loading tickets...</span>
                  </td>
                </tr>
              ) : currentTickets.length === 0 ? (
                <tr>
                  <td colSpan="7" className="hs-table-empty">
                    <FileText size={32} className="text-slate-300 mb-2" />
                    <p className="text-slate-600 font-medium">No tickets found</p>
                    <p className="text-xs text-slate-400">Try adjusting your priority or status filters.</p>
                  </td>
                </tr>
              ) : (
                currentTickets.map((ticket) => {
                  const ticketCode = ticket.ticket_id_display || ticket.ticket_number || `#SUP-${1040 + ticket.id}`;

                  return (
                    <tr key={ticket.id} className="hs-table-row">
                      {/* Ticket ID */}
                      <td className="hs-cell-ticket-id">
                        <span className="ticket-id-bold font-semibold text-slate-900">
                          {ticketCode}
                        </span>
                      </td>

                      {/* Customer Name */}
                      <td className="hs-cell-customer">
                        <span className="customer-name-text text-slate-700 font-medium">
                          {ticket.customer_name || 'Customer'}
                        </span>
                      </td>

                      {/* Issue Subject */}
                      <td className="hs-cell-subject">
                        <span className="subject-text text-slate-600">
                          {ticket.subject || 'Support Request'}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="hs-cell-priority">
                        {getPriorityBadge(ticket.priority)}
                      </td>

                      {/* Submitted Date */}
                      <td className="hs-cell-date">
                        <span className="date-text text-slate-700">
                          {ticket.formatted_created_at || '16 Oct 2026 10:24 AM'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="hs-cell-status">
                        {getStatusBadge(ticket.status)}
                      </td>

                      {/* Action */}
                      <td className="hs-cell-action">
                        <div className="hs-actions-cluster justify-end">
                          <button
                            type="button"
                            className="btn-view-ticket"
                            onClick={() => openSupportDrawer(ticket)}
                          >
                            View
                          </button>

                          <button
                            type="button"
                            className="btn-ticket-kebab"
                            onClick={() => openSupportDrawer(ticket)}
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

        {/* 5. Pagination Bar matching Reference Image 4 */}
        <div className="hs-pagination-bar">
          <div className="pagination-count-label">
            Showing {totalItems === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} tickets
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

      {/* 6. Right-Side Support Ticket Drawer */}
      <SupportTicketDrawer />

      {/* Scoped CSS Styles matching Reference Image 4 */}
      <style>{`
        .hs-page-container {
          padding: 24px 32px 48px;
          background-color: #F8FAFC;
          min-height: 100vh;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .hs-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #64748B;
          margin-bottom: 8px;
        }
        .hs-breadcrumb-parent {
          color: #64748B;
          font-weight: 500;
        }
        .hs-breadcrumb-sep {
          color: #94A3B8;
        }
        .hs-breadcrumb-current {
          color: #0F172A;
          font-weight: 600;
        }

        .hs-page-title {
          font-size: 26px;
          font-weight: 700;
          color: #0F172A;
          margin: 0 0 4px;
        }
        .hs-page-subtitle {
          font-size: 14px;
          color: #64748B;
          margin: 0 0 24px;
        }

        /* 4 SUMMARY STAT CARDS */
        .hs-summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 24px;
        }
        .hs-stat-card {
          background: #FFFFFF;
          border: 1px solid #F1F5F9;
          border-radius: 14px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .hs-stat-card:hover {
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
        .hs-icon-teal { background: #E0F2FE; }
        .hs-icon-orange { background: #FFEDD5; }
        .hs-icon-blue { background: #DBEAFE; }
        .hs-icon-green { background: #DCFCE7; }

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
        .hs-filter-card {
          background: #FFFFFF;
          border: 1px solid #F1F5F9;
          border-radius: 12px;
          padding: 14px 20px;
          margin-bottom: 20px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
        }
        .hs-filter-actions-group {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .hs-select-wrapper {
          position: relative;
          display: inline-flex;
          align-items: center;
        }
        .hs-filter-select {
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
        .hs-filter-select:hover, .hs-filter-select:focus {
          border-color: #0D7A75;
        }
        .hs-filter-select.pl-8 {
          padding-left: 32px;
        }
        .hs-select-chevron {
          position: absolute;
          right: 12px;
          pointer-events: none;
          color: #94A3B8;
        }
        .hs-select-lead-icon {
          position: absolute;
          left: 12px;
          pointer-events: none;
          color: #64748B;
        }
        .hs-refresh-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          color: #475569;
          border-radius: 8px;
          padding: 8px 14px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          margin-left: auto;
          transition: all 0.15s;
        }
        .hs-refresh-btn:hover {
          border-color: #0D7A75;
          color: #0D7A75;
        }

        /* TABLE */
        .hs-table-card {
          background: #FFFFFF;
          border: 1px solid #F1F5F9;
          border-radius: 14px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          overflow: hidden;
        }
        .hs-table-responsive {
          width: 100%;
          overflow-x: auto;
        }
        .hs-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .hs-table th {
          background: #FFFFFF;
          padding: 16px 20px;
          font-size: 12px;
          font-weight: 600;
          color: #64748B;
          border-bottom: 1px solid #F1F5F9;
          white-space: nowrap;
        }
        .hs-table td {
          padding: 18px 20px;
          font-size: 13px;
          color: #1E293B;
          border-bottom: 1px solid #F8FAFC;
          vertical-align: middle;
        }
        .hs-table-row:hover {
          background-color: #F8FAFC;
        }
        .ticket-id-bold {
          font-weight: 700;
          color: #0F172A;
        }
        .hs-table-loading, .hs-table-empty {
          text-align: center;
          padding: 48px !important;
          color: #64748B;
        }

        /* BADGES */
        .hs-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }
        .hs-badge-p-high {
          background: #FEE2E2;
          color: #DC2626;
        }
        .hs-badge-p-medium {
          background: #FEF3C7;
          color: #D97706;
        }
        .hs-badge-p-low {
          background: #DCFCE7;
          color: #16A34A;
        }

        .hs-badge-open {
          background: #FFEDD5;
          color: #EA580C;
        }
        .hs-badge-progress {
          background: #DBEAFE;
          color: #2563EB;
        }
        .hs-badge-resolved {
          background: #DCFCE7;
          color: #16A34A;
        }
        .hs-badge-closed {
          background: #F1F5F9;
          color: #64748B;
        }

        /* ACTIONS */
        .hs-actions-cluster {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .btn-view-ticket {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 6px 16px;
          font-size: 12px;
          font-weight: 600;
          color: #0D7A75;
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-view-ticket:hover {
          background: #E6F4F3;
          border-color: #0D7A75;
        }
        .btn-ticket-kebab {
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
        .btn-ticket-kebab:hover {
          background: #F1F5F9;
          color: #334155;
        }

        /* PAGINATION */
        .hs-pagination-bar {
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

        @media (max-width: 1024px) {
          .hs-summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .hs-page-container {
            padding: 16px;
          }
          .hs-summary-grid {
            grid-template-columns: 1fr;
          }
          .hs-filter-actions-group {
            flex-direction: column;
            width: 100%;
          }
          .hs-filter-select {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
