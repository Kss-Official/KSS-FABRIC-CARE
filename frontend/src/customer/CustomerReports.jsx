import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBooking } from '../context/BookingContext';
import { complaintsApi } from '../api/apiClient';
import {
  FileText,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  X,
  Loader2,
  Info
} from 'lucide-react';

// Exact default reports fallback matching Image 1 UI reference
const DEFAULT_REPORTS = [
  {
    id: 101,
    order_id_display: '#FC1024',
    order_id: '#FC1024',
    report_date_only: '16 Oct 2026',
    formatted_report_date: '16 Oct 2026, 11:30 AM',
    failure_reason: 'Customer Unavailable',
    new_delivery_date_formatted: '18 Oct 2026',
    rescheduled_date: '2026-10-18',
    rescheduled_time_slot: '10:00 AM – 12:00 PM',
    status: 'RESCHEDULED',
    customer_name: 'Rohan Mehta',
    customer_phone: '+91 98765 43210',
    reported_by_name: 'Rajesh Kumar (Delivery Executive)'
  },
  {
    id: 102,
    order_id_display: '#FCA81CC',
    order_id: '#FCA81CC',
    report_date_only: '15 Oct 2026',
    formatted_report_date: '15 Oct 2026, 02:15 PM',
    failure_reason: 'Customer Not Responding',
    new_delivery_date_formatted: '19 Oct 2026',
    rescheduled_date: '2026-10-19',
    rescheduled_time_slot: '12:00 PM – 02:00 PM',
    status: 'RESCHEDULED',
    customer_name: 'Rohan Mehta',
    customer_phone: '+91 98765 43210',
    reported_by_name: 'Sunil Verma (Delivery Executive)'
  },
  {
    id: 103,
    order_id_display: '#FCEB0F4',
    order_id: '#FCEB0F4',
    report_date_only: '13 Oct 2026',
    formatted_report_date: '13 Oct 2026, 09:45 AM',
    failure_reason: 'Address Issue',
    new_delivery_date_formatted: null,
    rescheduled_date: null,
    rescheduled_time_slot: '',
    status: 'UNDER_REVIEW',
    customer_name: 'Rohan Mehta',
    customer_phone: '+91 98765 43210',
    reported_by_name: 'Rajesh Kumar (Delivery Executive)'
  },
  {
    id: 104,
    order_id_display: '#FC88B84',
    order_id: '#FC88B84',
    report_date_only: '13 Oct 2026',
    formatted_report_date: '13 Oct 2026, 04:20 PM',
    failure_reason: 'Customer Unavailable',
    new_delivery_date_formatted: '17 Oct 2026',
    rescheduled_date: '2026-10-17',
    rescheduled_time_slot: '02:00 PM – 04:00 PM',
    status: 'RESCHEDULED',
    customer_name: 'Rohan Mehta',
    customer_phone: '+91 98765 43210',
    reported_by_name: 'Vikram Rathore (Delivery Executive)'
  },
  {
    id: 105,
    order_id_display: '#FC9F22B',
    order_id: '#FC9F22B',
    report_date_only: '12 Oct 2026',
    formatted_report_date: '12 Oct 2026, 10:00 AM',
    failure_reason: 'Customer Not Responding',
    new_delivery_date_formatted: null,
    rescheduled_date: null,
    rescheduled_time_slot: '',
    status: 'RESOLVED',
    customer_name: 'Rohan Mehta',
    customer_phone: '+91 98765 43210',
    reported_by_name: 'Sunil Verma (Delivery Executive)'
  }
];

export const CustomerReports = () => {
  const { currentUser, userProfile } = useAuth();
  const { navigateTo } = useBooking();

  // State
  const [reports, setReports] = useState(() => {
    try {
      const saved = localStorage.getItem('fabricare_customer_reports');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_REPORTS.map(r => ({ ...r }));
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);

  // Selected report for Details Modal
  const [selectedReport, setSelectedReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const modalRef = useRef(null);

  // Helper to normalize and ensure all expected fields exist
  const normalizeReport = (item) => {
    const orderId = item.order_id || item.order_id_display || `#FC${item.id}`;
    const reportDate =
      item.report_date_only ||
      (item.report_date ? String(item.report_date).split('T')[0] : '16 Oct 2026');
    const reschedDate =
      item.new_delivery_date_formatted ||
      (item.rescheduled_date ? String(item.rescheduled_date).split('T')[0] : null);

    return {
      ...item,
      id: item.id || orderId,
      order_id: orderId,
      order_id_display: item.order_id_display || orderId,
      report_date_only: reportDate,
      formatted_report_date: item.formatted_report_date || reportDate,
      failure_reason: item.failure_reason || 'Customer Unavailable',
      rescheduled_date: item.rescheduled_date || null,
      new_delivery_date_formatted: reschedDate,
      rescheduled_time_slot: item.rescheduled_time_slot || item.time_slot || '',
      status: item.status || 'UNDER_REVIEW',
      customer_name: item.customer_name || 'Rohan Mehta',
      customer_phone: item.customer_phone || '+91 98765 43210',
      reported_by_name: item.reported_by_name || 'Rajesh Kumar (Delivery Executive)'
    };
  };

  // Synchronize reports across Backend API, Admin Context complaints, and localStorage
  const syncReportsData = (backendData = null) => {
    let baseList = [];
    try {
      const savedCustomerReports = localStorage.getItem('fabricare_customer_reports');
      if (savedCustomerReports) {
        const parsed = JSON.parse(savedCustomerReports);
        if (Array.isArray(parsed) && parsed.length > 0) {
          baseList = parsed;
        }
      }
    } catch (e) {}

    if (baseList.length === 0) {
      baseList = DEFAULT_REPORTS.map(r => ({ ...r }));
    }

    // Merge backend API records if available
    if (backendData && Array.isArray(backendData) && backendData.length > 0) {
      const backendMap = new Map();
      backendData.forEach(item => {
        const key = String(item.order_id || item.order_id_display || item.id);
        backendMap.set(key, item);
      });

      const merged = baseList.map(item => {
        const key = String(item.order_id || item.order_id_display || item.id);
        if (backendMap.has(key)) {
          const b = backendMap.get(key);
          backendMap.delete(key);
          return normalizeReport({ ...item, ...b });
        }
        return normalizeReport(item);
      });

      backendMap.forEach(item => {
        merged.unshift(normalizeReport(item));
      });

      baseList = merged;
    }

    // Merge any live reschedules from Admin Context / Delivery Portal (fabricare_admin_complaints)
    try {
      const savedAdminComplaints = localStorage.getItem('fabricare_admin_complaints');
      if (savedAdminComplaints) {
        const adminComplaints = JSON.parse(savedAdminComplaints);
        if (Array.isArray(adminComplaints)) {
          const adminMap = new Map();
          adminComplaints.forEach(ac => {
            const code = String(ac.order_id_display || ac.order_id || ac.id);
            adminMap.set(code, ac);
          });

          baseList = baseList.map(rep => {
            const code = String(rep.order_id_display || rep.order_id || rep.id);
            if (adminMap.has(code)) {
              const ac = adminMap.get(code);
              return normalizeReport({
                ...rep,
                status: ac.status || rep.status,
                rescheduled_date: ac.rescheduled_date || rep.rescheduled_date,
                new_delivery_date_formatted:
                  ac.new_delivery_date_formatted ||
                  ac.new_delivery_date ||
                  ac.rescheduled_date ||
                  rep.new_delivery_date_formatted,
                rescheduled_time_slot:
                  ac.rescheduled_time_slot || ac.time_slot || rep.rescheduled_time_slot,
                failure_reason: ac.failure_reason || rep.failure_reason,
                admin_reply: ac.admin_notes || ac.notes || rep.admin_reply
              });
            }
            return normalizeReport(rep);
          });
        }
      }
    } catch (e) {}

    // Persist to localStorage for persistence across reloads
    try {
      localStorage.setItem('fabricare_customer_reports', JSON.stringify(baseList));
    } catch (e) {}

    return baseList;
  };

  // Handle outside click and ESC for modal
  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setIsModalOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isModalOpen]);

  // Fetch reports from backend API & local cache
  const fetchReports = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
      setRefreshSuccess(false);
    } else {
      setLoading(true);
    }
    setError(null);

    const startTime = Date.now();

    try {
      let backendList = null;
      try {
        const res = await complaintsApi.getReports({});
        const data = res.data;
        if (data && data.results && Array.isArray(data.results) && data.results.length > 0) {
          backendList = data.results;
        } else if (Array.isArray(data) && data.length > 0) {
          backendList = data;
        }
      } catch (err) {
        console.warn('Backend complaints fetch notice (falling back to synchronized storage):', err);
      }

      const synced = syncReportsData(backendList);
      setReports(synced);

      if (isManualRefresh) {
        const elapsed = Date.now() - startTime;
        if (elapsed < 450) {
          await new Promise(r => setTimeout(r, 450 - elapsed));
        }
        setRefreshSuccess(true);
        setTimeout(() => setRefreshSuccess(false), 2000);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      const synced = syncReportsData(null);
      setReports(synced);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();

    // Listen for storage changes from admin portal or delivery portal
    const handleStorageChange = (e) => {
      if (e.key === 'fabricare_admin_complaints' || e.key === 'fabricare_customer_reports') {
        const synced = syncReportsData(null);
        setReports(synced);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Filtered reports in memory for instant typing feedback
  const filteredReports = useMemo(() => {
    if (!searchQuery.trim()) return reports;
    const q = searchQuery.toLowerCase().trim();
    return reports.filter((r) => {
      const orderId = (r.order_id || r.order_id_display || '').toLowerCase();
      const reason = (r.failure_reason || '').toLowerCase();
      const dateStr = (r.report_date_only || r.formatted_report_date || '').toLowerCase();
      const statusStr = (r.status || '').toLowerCase();
      const reschedDate = (r.new_delivery_date_formatted || r.rescheduled_date || '').toLowerCase();
      const reschedTime = (r.rescheduled_time_slot || '').toLowerCase();
      return (
        orderId.includes(q) ||
        reason.includes(q) ||
        dateStr.includes(q) ||
        statusStr.includes(q) ||
        reschedDate.includes(q) ||
        reschedTime.includes(q)
      );
    });
  }, [reports, searchQuery]);

  // Status badge renderer matching reference image exactly
  const renderStatusBadge = (status) => {
    const st = (status || '').toUpperCase();
    if (st.includes('RESCHEDULED')) {
      return (
        <span className="fc-status-pill fc-pill-rescheduled">
          <CheckCircle2 size={13} className="fc-pill-icon" />
          <span>Rescheduled</span>
        </span>
      );
    }
    if (st.includes('REVIEW')) {
      return (
        <span className="fc-status-pill fc-pill-review">
          <Clock size={13} className="fc-pill-icon" />
          <span>Under Review</span>
        </span>
      );
    }
    if (st.includes('RESOLVED')) {
      return (
        <span className="fc-status-pill fc-pill-resolved">
          <CheckCircle2 size={13} className="fc-pill-icon" />
          <span>Resolved</span>
        </span>
      );
    }
    if (st.includes('PENDING')) {
      return (
        <span className="fc-status-pill fc-pill-pending">
          <Clock size={13} className="fc-pill-icon" />
          <span>Pending</span>
        </span>
      );
    }
    return (
      <span className="fc-status-pill fc-pill-default">
        <span>{status || 'Pending'}</span>
      </span>
    );
  };

  const displayName =
    userProfile?.displayName ||
    currentUser?.displayName ||
    currentUser?.full_name ||
    currentUser?.first_name ||
    'Rohan Mehta';

  return (
    <div className="reports-portal-page animate-fade-in">
      {/* 1. Page Title Header matching Customer Portal layout */}
      <div className="reports-header-row mb-6 no-print">
        <div className="header-breadcrumbs-col">
          <h1 className="reports-page-title">Reports</h1>
          <p className="reports-page-subtitle">
            View delivery and complaint reports for your laundry orders.
          </p>
        </div>
      </div>

      {/* 2. Customer Delivery & Complaint Reports Card matching Image 2 container & Image 1 content */}
      <div className="content-card customer-reports-card mb-3 no-print">
        {/* Card Header Title Row */}
        <div className="reports-card-header">
          <div className="reports-title-wrap">
            <div className="reports-icon-circle">
              <FileText size={20} className="text-teal" />
            </div>
            <h2 className="reports-card-heading">
              Customer Delivery &amp; Complaint Reports
            </h2>
          </div>

          {/* Controls row: count & refresh on left, search on right */}
          <div className="reports-card-controls-row">
            <div className="reports-toolbar-left">
              <span className="reports-count-pill">
                {filteredReports.length} {filteredReports.length === 1 ? 'Report' : 'Reports'}
              </span>
              <button
                type="button"
                className={`refresh-reports-btn ${refreshing ? 'loading' : ''} ${refreshSuccess ? 'success' : ''}`}
                onClick={() => fetchReports(true)}
                disabled={refreshing}
                title="Refresh report records"
              >
                <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
                <span>{refreshing ? 'Refreshing...' : refreshSuccess ? 'Refreshed!' : 'Refresh'}</span>
              </button>
            </div>

            <div className="reports-search-wrapper">
              <Search size={15} className="reports-search-icon" />
              <input
                type="text"
                placeholder="Search by Order ID, date, or reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="reports-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="reports-search-clear-btn"
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 3. Reports Table */}
        <div className="reports-table-container">
          {loading ? (
            <div className="reports-state-box">
              <Loader2 className="animate-spin text-teal" size={30} />
              <p className="reports-state-text">Loading reports...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="reports-state-box">
              <div className="reports-empty-circle">
                <FileText size={26} className="text-slate-400" />
              </div>
              <h3 className="reports-empty-title">No reports found</h3>
              <p className="reports-empty-desc">
                {searchQuery
                  ? `No reports match "${searchQuery}". Try searching with another Order ID or reason.`
                  : 'You currently have no delivery failure or complaint reports on file.'}
              </p>
              {searchQuery && (
                <button
                  type="button"
                  className="reports-clear-pill-btn"
                  onClick={() => setSearchQuery('')}
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <table className="customer-reports-table">
              <thead>
                <tr>
                  <th className="th-order-id">ORDER ID</th>
                  <th className="th-report-date">REPORT DATE</th>
                  <th className="th-failure-reason">FAILURE REASON</th>
                  <th className="th-rescheduled">RESCHEDULED DATE &amp; TIME</th>
                  <th className="th-status">STATUS</th>
                  <th className="th-action">REPORT ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => {
                  const orderCode =
                    report.order_id ||
                    report.order_id_display ||
                    `#FC${report.id}`;
                  const reportDate =
                    report.report_date_only ||
                    (report.report_date ? report.report_date.split('T')[0] : '16 Oct 2026');

                  const isRescheduled = Boolean(
                    report.rescheduled_date || report.new_delivery_date_formatted
                  );

                  return (
                    <tr key={report.id || orderCode} className="reports-table-row">
                      {/* 1. Order ID */}
                      <td className="td-order-id">
                        <span className="report-order-code">{orderCode}</span>
                      </td>

                      {/* 2. Report Date */}
                      <td className="td-report-date">
                        <span className="report-date-text">{reportDate}</span>
                      </td>

                      {/* 3. Failure Reason */}
                      <td className="td-failure-reason">
                        <span className="report-reason-text">
                          {report.failure_reason || 'Customer Unavailable'}
                        </span>
                      </td>

                      {/* 4. Rescheduled Date & Time */}
                      <td className="td-rescheduled">
                        {isRescheduled ? (
                          <div className="resched-cell-stack">
                            <span className="resched-date">
                              {report.new_delivery_date_formatted || report.rescheduled_date}
                            </span>
                            <span className="resched-time">
                              {report.rescheduled_time_slot || '10:00 AM – 12:00 PM'}
                            </span>
                          </div>
                        ) : (
                          <span className="resched-dash">—</span>
                        )}
                      </td>

                      {/* 5. Status Badge */}
                      <td className="td-status">
                        {renderStatusBadge(report.status)}
                      </td>

                      {/* 6. Report Action Button */}
                      <td className="td-action">
                        <button
                          type="button"
                          className="btn-view-report-action"
                          onClick={() => {
                            setSelectedReport(report);
                            setIsModalOpen(true);
                          }}
                        >
                          <FileText size={14} className="btn-doc-icon" />
                          <span>View Report</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 4. VIEW REPORT DETAILS MODAL */}
      {isModalOpen && selectedReport && (
        <div className="fc-modal-overlay">
          <div className="fc-modal-dialog" ref={modalRef}>
            {/* Modal Header */}
            <div className="fc-modal-header">
              <div className="fc-modal-header-left">
                <div className="fc-modal-icon-wrap">
                  <FileText size={20} className="text-teal" />
                </div>
                <div>
                  <h3 className="fc-modal-title">Delivery Report Details</h3>
                  <p className="fc-modal-sub">
                    {selectedReport.order_id || selectedReport.order_id_display || `#FC${selectedReport.id}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="fc-modal-close-btn"
                onClick={() => setIsModalOpen(false)}
                title="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="fc-modal-body">
              {/* Order & Status Card */}
              <div className="fc-modal-meta-grid">
                <div className="fc-modal-meta-item">
                  <span className="fc-meta-label">Order ID</span>
                  <span className="fc-meta-val-bold">
                    {selectedReport.order_id || selectedReport.order_id_display || `#FC${selectedReport.id}`}
                  </span>
                </div>
                <div className="fc-modal-meta-item">
                  <span className="fc-meta-label">Current Status</span>
                  <div>{renderStatusBadge(selectedReport.status)}</div>
                </div>
                <div className="fc-modal-meta-item">
                  <span className="fc-meta-label">Customer Name</span>
                  <span className="fc-meta-val">
                    {selectedReport.customer_name || displayName}
                  </span>
                </div>
                <div className="fc-modal-meta-item">
                  <span className="fc-meta-label">Customer Phone</span>
                  <span className="fc-meta-val">
                    {selectedReport.customer_phone || '+91 98765 43210'}
                  </span>
                </div>
              </div>

              {/* Delivery Failure Reason Card */}
              <div className="fc-modal-reason-box">
                <div className="fc-reason-icon-col">
                  <AlertTriangle size={18} className="text-amber-500" />
                </div>
                <div>
                  <span className="fc-reason-box-label">Delivery Failure Reason</span>
                  <p className="fc-reason-box-val">
                    {selectedReport.failure_reason || 'Customer Unavailable'}
                  </p>
                  <p className="fc-reason-box-sub">
                    Reported by {selectedReport.reported_by_name || 'Delivery Executive'} on{' '}
                    {selectedReport.formatted_report_date || selectedReport.report_date_only || '16 Oct 2026'}
                  </p>
                </div>
              </div>

              {/* Updated Rescheduled Delivery Schedule */}
              <div className="fc-modal-sched-card">
                <div className="fc-sched-card-head">
                  <Calendar size={16} className="text-teal" />
                  <span className="fc-sched-card-title">Rescheduled Delivery Schedule</span>
                </div>

                {selectedReport.rescheduled_date || selectedReport.new_delivery_date_formatted ? (
                  <div className="fc-sched-card-body">
                    <div className="fc-sched-row">
                      <div className="fc-sched-col">
                        <span className="fc-sched-col-lbl">New Delivery Date</span>
                        <span className="fc-sched-col-val">
                          {selectedReport.new_delivery_date_formatted || selectedReport.rescheduled_date}
                        </span>
                      </div>
                      <div className="fc-sched-col">
                        <span className="fc-sched-col-lbl">New Time Slot</span>
                        <span className="fc-sched-col-val">
                          {selectedReport.rescheduled_time_slot || '10:00 AM – 12:00 PM'}
                        </span>
                      </div>
                    </div>

                    <div className="fc-sched-notice-banner">
                      <Info size={16} className="fc-notice-icon" />
                      <p className="fc-notice-text">
                        Your delivery has been rescheduled by the admin. We will deliver your order on the new date and time.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="fc-pending-resched-box">
                    <Clock size={18} className="text-amber-500" />
                    <div>
                      <p className="fc-pending-title">Reschedule Pending</p>
                      <p className="fc-pending-desc">
                        Our support team is reviewing the delivery failure report and will assign a new delivery slot shortly.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="fc-modal-footer">
              <button
                type="button"
                className="fc-modal-done-btn"
                onClick={() => setIsModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Component Scoped CSS Matching Image 2 and Image 1 Design System */}
      <style>{`
        .reports-portal-page {
          width: 100%;
        }

        /* 1. Breadcrumbs and Page Title */
        .reports-header-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .header-breadcrumbs-col {
          display: flex;
          flex-direction: column;
        }

        .breadcrumbs-nav {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8125rem;
          color: #64748B;
          margin-bottom: 6px;
        }

        .breadcrumb-link {
          color: #64748B;
          cursor: pointer;
          transition: color 0.15s ease;
        }

        .breadcrumb-link:hover {
          color: #0D7A75;
          text-decoration: underline;
        }

        .breadcrumb-slash {
          color: #94A3B8;
          font-size: 0.75rem;
        }

        .breadcrumb-active {
          color: #0D7A75;
          font-weight: 600;
        }

        .reports-page-title {
          font-size: 1.85rem;
          font-weight: 800;
          color: #1E1B4B;
          margin: 0;
          letter-spacing: -0.025em;
          line-height: 1.2;
        }

        .reports-page-subtitle {
          font-size: 0.875rem;
          color: #64748B;
          margin-top: 4px;
          margin-bottom: 0;
        }

        /* 2. Content Card matching Image 2 container */
        .customer-reports-card {
          background: #ffffff;
          border: 1.5px solid #E2E8F0;
          border-radius: 18px;
          padding: 22px 26px;
          box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05);
        }

        .reports-card-header {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding-bottom: 20px;
          border-bottom: 1.5px solid #F1F5F9;
        }

        .reports-title-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .reports-card-controls-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          width: 100%;
        }

        .reports-toolbar-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .reports-icon-circle {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: #E8FAF6;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0D7A75;
          flex-shrink: 0;
        }

        .reports-card-heading {
          font-size: 1.15rem;
          font-weight: 700;
          color: #0F172A;
          letter-spacing: -0.01em;
          margin: 0;
        }

        .reports-toolbar-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .reports-count-pill {
          background: #E8FAF6;
          color: #0D7A75;
          border: 1px solid #BCEAE6;
          border-radius: 999px;
          padding: 5px 14px;
          font-size: 0.78rem;
          font-weight: 700;
        }

        .refresh-reports-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 999px;
          border: 1.5px solid #CBD5E1;
          background: #ffffff;
          color: #334155;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .refresh-reports-btn:hover:not(:disabled) {
          background: #F8FAFC;
          color: #0D7A75;
          border-color: #0D7A75;
        }

        .refresh-reports-btn:disabled {
          cursor: not-allowed;
          opacity: 0.75;
        }

        .refresh-reports-btn.loading {
          border-color: #0D7A75;
          background: #F4FBFA;
          color: #0D7A75;
        }

        .refresh-reports-btn.success {
          border-color: #16A34A;
          background: #F0FDF4;
          color: #16A34A;
        }

        /* Search Input */
        .reports-search-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
          max-width: 340px;
        }

        @media (max-width: 768px) {
          .reports-search-wrapper {
            max-width: 100%;
          }
        }

        .reports-search-icon {
          position: absolute;
          left: 12px;
          color: #94A3B8;
          pointer-events: none;
        }

        .reports-search-input {
          width: 100%;
          padding: 7px 32px 7px 36px;
          border-radius: 999px;
          border: 1.5px solid #CBD5E1;
          background: #FAFCFC;
          color: #0F172A;
          font-size: 0.8125rem;
          font-weight: 500;
          outline: none;
          transition: all 0.2s ease;
        }

        .reports-search-input::placeholder {
          color: #94A3B8;
          font-weight: 400;
        }

        .reports-search-input:focus {
          background: #FFFFFF;
          border-color: #0D7A75;
          box-shadow: 0 0 0 3px rgba(13, 122, 117, 0.12);
        }

        .reports-search-clear-btn {
          position: absolute;
          right: 10px;
          background: none;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2px;
          border-radius: 50%;
          transition: color 0.15s ease, background 0.15s ease;
        }

        .reports-search-clear-btn:hover {
          color: #0F172A;
          background: #E2E8F0;
        }

        /* 3. Reports Table */
        .reports-table-container {
          width: 100%;
          overflow-x: auto;
          margin-top: 8px;
        }

        .customer-reports-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
        }

        .customer-reports-table th {
          padding: 14px 18px;
          font-size: 0.72rem;
          font-weight: 700;
          color: #8FA0B5;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          border-bottom: 1.5px solid #E2E8F0;
          white-space: nowrap;
          text-align: left;
        }

        .customer-reports-table td {
          padding: 16px 18px;
          vertical-align: middle;
          border-bottom: 1px solid #F1F5F9;
        }

        .reports-table-row {
          transition: background 0.15s ease;
        }

        .reports-table-row:hover {
          background: #F8FAFC;
        }

        .report-order-code {
          font-size: 0.875rem;
          font-weight: 700;
          color: #0F172A;
          font-family: inherit;
        }

        .report-date-text {
          font-size: 0.8125rem;
          color: #334155;
          white-space: nowrap;
        }

        .report-reason-text {
          font-size: 0.8125rem;
          color: #334155;
          font-weight: 500;
        }

        /* Rescheduled cell */
        .resched-cell-stack {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .resched-date {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #0F172A;
          white-space: nowrap;
        }

        .resched-time {
          font-size: 0.75rem;
          color: #64748B;
          white-space: nowrap;
        }

        .resched-dash {
          color: #94A3B8;
          font-weight: 600;
          font-size: 0.9rem;
        }

        /* Status Pills */
        .fc-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 700;
          white-space: nowrap;
        }

        .fc-pill-rescheduled {
          background: #E6FBF2;
          color: #059669;
        }

        .fc-pill-review {
          background: #EDF4FF;
          color: #3B82F6;
        }

        .fc-pill-resolved {
          background: #F5EEFD;
          color: #8B5CF6;
        }

        .fc-pill-pending {
          background: #FFF7ED;
          color: #EA580C;
        }

        .fc-pill-default {
          background: #F1F5F9;
          color: #475569;
        }

        .fc-pill-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: currentColor;
        }

        .fc-pill-icon {
          flex-shrink: 0;
        }

        /* Action Button */
        .btn-view-report-action {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 16px;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 700;
          border: 1.5px solid #0D7A75;
          background: #ffffff;
          color: #0D7A75;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;
        }

        .btn-view-report-action:hover {
          background: #0D7A75;
          color: #ffffff;
        }

        .btn-doc-icon {
          flex-shrink: 0;
        }

        /* Loading and Empty States */
        .reports-state-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
          text-align: center;
        }

        .reports-state-text {
          margin-top: 12px;
          font-size: 0.875rem;
          color: #64748B;
        }

        .reports-empty-circle {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: #F1F5F9;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
        }

        .reports-empty-title {
          font-size: 1rem;
          font-weight: 700;
          color: #1E293B;
          margin: 0 0 6px 0;
        }

        .reports-empty-desc {
          font-size: 0.8125rem;
          color: #64748B;
          max-width: 420px;
          margin: 0;
        }

        .reports-clear-pill-btn {
          margin-top: 14px;
          padding: 6px 16px;
          background: #E8FAF6;
          color: #0D7A75;
          border: 1px solid #BCEAE6;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .reports-clear-pill-btn:hover {
          background: #0D7A75;
          color: #ffffff;
        }

        /* 4. Modal Styles */
        .fc-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.55);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 20px;
        }

        .fc-modal-dialog {
          background: #ffffff;
          border-radius: 18px;
          width: 100%;
          max-width: 540px;
          box-shadow: 0 20px 40px -10px rgba(15, 23, 42, 0.2);
          overflow: hidden;
          animation: modalPop 0.2s ease-out;
        }

        @keyframes modalPop {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .fc-modal-header {
          padding: 20px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1.5px solid #F1F5F9;
        }

        .fc-modal-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .fc-modal-icon-wrap {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: #E8FAF6;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .fc-modal-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: #0F172A;
          margin: 0;
        }

        .fc-modal-sub {
          font-size: 0.8125rem;
          color: #64748B;
          margin: 2px 0 0 0;
          font-weight: 600;
        }

        .fc-modal-close-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid #E2E8F0;
          background: #ffffff;
          color: #64748B;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .fc-modal-close-btn:hover {
          background: #F1F5F9;
          color: #0F172A;
        }

        .fc-modal-body {
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-height: 70vh;
          overflow-y: auto;
        }

        .fc-modal-meta-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          background: #F8FAFC;
          border-radius: 12px;
          padding: 14px 16px;
          border: 1px solid #E2E8F0;
        }

        .fc-modal-meta-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .fc-meta-label {
          font-size: 0.72rem;
          font-weight: 700;
          color: #8FA0B5;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .fc-meta-val-bold {
          font-size: 0.875rem;
          font-weight: 700;
          color: #0F172A;
        }

        .fc-meta-val {
          font-size: 0.84rem;
          color: #334155;
          font-weight: 500;
        }

        .fc-modal-reason-box {
          display: flex;
          gap: 12px;
          padding: 14px 16px;
          border-radius: 12px;
          background: #FFFBEB;
          border: 1px solid #FDE68A;
        }

        .fc-reason-icon-col {
          padding-top: 2px;
        }

        .fc-reason-box-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: #92400E;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .fc-reason-box-val {
          font-size: 0.9rem;
          font-weight: 700;
          color: #78350F;
          margin: 2px 0 4px 0;
        }

        .fc-reason-box-sub {
          font-size: 0.75rem;
          color: #B45309;
          margin: 0;
        }

        .fc-modal-sched-card {
          background: #FFFFFF;
          border: 1.5px solid #E2E8F0;
          border-radius: 12px;
          overflow: hidden;
        }

        .fc-sched-card-head {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #F8FAFC;
          padding: 10px 16px;
          border-bottom: 1px solid #E2E8F0;
        }

        .fc-sched-card-title {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #0F172A;
        }

        .fc-sched-card-body {
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .fc-sched-row {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .fc-sched-col {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .fc-sched-col-lbl {
          font-size: 0.72rem;
          font-weight: 700;
          color: #8FA0B5;
          text-transform: uppercase;
        }

        .fc-sched-col-val {
          font-size: 0.875rem;
          font-weight: 700;
          color: #0D7A75;
        }

        .fc-sched-notice-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #F0FDF4;
          border: 1px solid #DCFCE7;
          border-radius: 8px;
          padding: 10px 12px;
        }

        .fc-notice-icon {
          color: #16A34A;
          flex-shrink: 0;
        }

        .fc-notice-text {
          font-size: 0.78rem;
          color: #166534;
          margin: 0;
          line-height: 1.35;
        }

        .fc-pending-resched-box {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
        }

        .fc-pending-title {
          font-size: 0.875rem;
          font-weight: 700;
          color: #92400E;
          margin: 0 0 2px 0;
        }

        .fc-pending-desc {
          font-size: 0.78rem;
          color: #64748B;
          margin: 0;
        }

        .fc-modal-footer {
          padding: 14px 24px;
          display: flex;
          justify-content: flex-end;
          border-top: 1.5px solid #F1F5F9;
          background: #FAFCFD;
        }

        .fc-modal-done-btn {
          padding: 8px 22px;
          border-radius: 999px;
          background: #0D7A75;
          color: #ffffff;
          border: none;
          font-size: 0.8125rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .fc-modal-done-btn:hover {
          background: #0A605C;
        }
      `}</style>
    </div>
  );
};
