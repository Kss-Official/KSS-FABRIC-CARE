import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  Info,
  Download,
  Printer,
  User,
  Receipt,
  CreditCard,
  Check,
  Shirt,
  MapPin,
  Phone
} from 'lucide-react';
import { formatOrderId } from '../utils/helpers';

// Exact default reports fallback matching Image 1 UI reference
const DEFAULT_REPORTS = [
  {
    id: 101,
    order_id_display: 'FC-75668',
    order_id: 'FC-75668',
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
    order_id_display: 'FC-10462',
    order_id: 'FC-10462',
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
    order_id_display: 'FC-10458',
    order_id: 'FC-10458',
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
    order_id_display: 'FC-10452',
    order_id: 'FC-10452',
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
    order_id_display: 'FC-10449',
    order_id: 'FC-10449',
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

  // Selected report for Details Modal (matching Invoice View Modal)
  const [selectedReport, setSelectedReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const modalScrollRef = useRef(null);

  // Helper to normalize and ensure all expected fields exist
  const normalizeReport = (item) => {
    const orderId = formatOrderId(item.order_id || item.order_id_display || item.id || 'FC-75668');
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
      order_id_display: orderId,
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

    // If live backend records are provided, prioritize backend as primary source of truth
    if (backendData && Array.isArray(backendData) && backendData.length > 0) {
      baseList = backendData.map(normalizeReport);
    } else {
      try {
        const savedCustomerReports = localStorage.getItem('fabricare_customer_reports');
        if (savedCustomerReports) {
          const parsed = JSON.parse(savedCustomerReports);
          if (Array.isArray(parsed) && parsed.length > 0) {
            baseList = parsed.map(normalizeReport);
          }
        }
      } catch (e) {}

      if (baseList.length === 0) {
        baseList = DEFAULT_REPORTS.map(r => normalizeReport({ ...r }));
      }
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
            return rep;
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

  // Lock background page scroll while report modal is open, and reset modal scroll to top (matching invoice-view behavior)
  useEffect(() => {
    if (isModalOpen) {
      const prevBodyOverflow = document.body.style.overflow;
      const prevHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.classList.add('modal-open');
      document.body.classList.add('modal-open');

      const resetScrollToTop = () => {
        if (modalScrollRef.current) {
          modalScrollRef.current.scrollTop = 0;
        }
      };

      resetScrollToTop();
      const animFrame = requestAnimationFrame(resetScrollToTop);
      const timer1 = setTimeout(resetScrollToTop, 25);
      const timer2 = setTimeout(resetScrollToTop, 80);

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          setIsModalOpen(false);
        }
      };
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = prevBodyOverflow || '';
        document.documentElement.style.overflow = prevHtmlOverflow || '';
        document.documentElement.classList.remove('modal-open');
        document.body.classList.remove('modal-open');
        document.removeEventListener('keydown', handleKeyDown);
        cancelAnimationFrame(animFrame);
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [isModalOpen, selectedReport]);

  const handleViewReportClick = (report) => {
    setSelectedReport(report);
    setIsModalOpen(true);
    if (modalScrollRef.current) {
      modalScrollRef.current.scrollTop = 0;
    }
  };

  const handlePrint = () => {
    const orderNum = (selectedReport?.order_id_display || selectedReport?.order_id || 'Report').replace(/^#/, '');
    const prevTitle = document.title;
    document.title = `FabriCare_Report_${orderNum}`;
    window.print();
    setTimeout(() => {
      document.title = prevTitle;
    }, 1500);
  };

  const handleDownload = async () => {
    const orderNum = (selectedReport?.order_id_display || selectedReport?.order_id || 'Report').replace(/^#/, '');
    const element = document.getElementById('delivery-report-document-card');
    if (!element) return;

    setIsDownloadingPdf(true);
    try {
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default || html2pdfModule;

      const opt = {
        margin: [6, 8, 6, 8],
        filename: `FabriCare_Report_${orderNum}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          scrollY: 0
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait'
        }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('PDF download notice, running print fallback:', err);
      handlePrint();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Status badge renderer for Report Card Header matching Invoice Paid badge style
  const renderModalStatusBadge = (status) => {
    const st = (status || '').toUpperCase();
    if (st.includes('RESCHEDULED')) {
      return (
        <span className="paid-pill-badge resched-pill">
          <Check size={11} strokeWidth={3} />
          <span>Rescheduled</span>
        </span>
      );
    }
    if (st.includes('RESOLVED')) {
      return (
        <span className="paid-pill-badge resolved-pill">
          <Check size={11} strokeWidth={3} />
          <span>Resolved</span>
        </span>
      );
    }
    if (st.includes('REVIEW')) {
      return (
        <span className="paid-pill-badge review-pill">
          <Clock size={11} />
          <span>Under Review</span>
        </span>
      );
    }
    return (
      <span className="paid-pill-badge pending-pill">
        <Clock size={11} />
        <span>Pending</span>
      </span>
    );
  };

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
        } else if (res.items && Array.isArray(res.items) && res.items.length > 0) {
          backendList = res.items;
        } else if (res.results && Array.isArray(res.results) && res.results.length > 0) {
          backendList = res.results;
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
                        <span className="report-order-code font-mono font-bold">{formatOrderId(orderCode)}</span>
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
                          onClick={() => handleViewReportClick(report)}
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

      {/* 4. VIEW REPORT DETAILS MODAL (Matching exact Invoice View Design & Blurred Background Behavior) */}
      {isModalOpen && selectedReport && typeof document !== 'undefined' && createPortal(
        <div className="invoice-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="invoice-modal-container" onClick={(e) => e.stopPropagation()}>
            {/* Top Navigation Bar with Actions */}
            <div className="invoice-modal-top-bar no-print">
              <div className="modal-header-title-wrap">
                <FileText size={18} className="text-teal" />
                <span className="modal-header-title">
                  Official Delivery Report &bull; {formatOrderId(selectedReport.order_id_display || selectedReport.order_id || selectedReport.id)}
                </span>
              </div>
              <div className="invoice-modal-actions">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="modal-action-pill btn-download-pdf-pill"
                  disabled={isDownloadingPdf}
                  title="Download Official Report PDF"
                >
                  <Download size={14} className={isDownloadingPdf ? 'animate-bounce' : ''} />
                  <span>{isDownloadingPdf ? 'Downloading PDF...' : 'Download PDF'}</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="modal-action-pill btn-print-pill"
                  title="Print Official Report"
                >
                  <Printer size={14} />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="modal-close-circle-btn"
                  title="Close Report"
                  aria-label="Close Report"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Scrollable Content Container */}
            <div 
              ref={modalScrollRef}
              key={selectedReport.id || selectedReport.order_id}
              className="invoice-modal-content-scroll"
            >
              <div id="delivery-report-document-card" className="content-card tax-invoice-document-card">
                {/* Brand Logo & Report Header */}
                <div className="invoice-doc-header">
                  <div className="brand-logo-stack">
                    <div className="brand-circle-logo" style={{ background: 'transparent' }}>
                      <img 
                        src="/images/fabricare-logo.png" 
                        alt="FabriCare" 
                        style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '10px' }} 
                      />
                    </div>
                    <div>
                      <h2 className="brand-name">FabriCare</h2>
                      <span className="brand-sub">Laundry &amp; Dry Cleaning Services</span>
                    </div>
                  </div>

                  <div className="invoice-tax-meta text-right">
                    <h3 className="tax-invoice-heading">DELIVERY REPORT</h3>
                    <div className="tax-order-number font-mono font-bold">
                      {formatOrderId(selectedReport.order_id_display || selectedReport.order_id || selectedReport.id)}
                    </div>
                    <div className="invoice-paid-badge-wrap">
                      {renderModalStatusBadge(selectedReport.status)}
                    </div>
                  </div>
                </div>

                {/* Bill To & Report Details Grid matching exact Invoice layout */}
                <div className="bill-to-meta-grid">
                  {/* Left Column: Customer Details */}
                  <div className="bill-to-section">
                    <div className="bill-to-title-row">
                      <User size={16} className="text-teal" />
                      <span className="bill-to-title">Bill To (Customer Details)</span>
                    </div>
                    <div className="bill-customer-info-grid">
                      <div className="bill-info-cell">
                        <span className="cell-heading-label">Customer Name</span>
                        <span className="cell-data-value font-bold text-navy">
                          {selectedReport.customer_name || displayName}
                        </span>
                      </div>
                      <div className="bill-info-cell">
                        <span className="cell-heading-label">Contact Details</span>
                        <span className="cell-data-value">
                          {selectedReport.customer_phone || '+91 98765 43210'} &bull; {selectedReport.customer_email || 'rohan.mehta@gmail.com'}
                        </span>
                      </div>
                      <div className="bill-info-cell">
                        <span className="cell-heading-label">Service &amp; Delivery Address</span>
                        <span className="cell-data-value">
                          {selectedReport.delivery_address || selectedReport.order_details?.delivery_address || 'Flat 402, Sunshine Residency, Indiranagar, Bengaluru - 560038, Madhya Pradesh - 456001'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Report & Order Details */}
                  <div className="invoice-meta-section">
                    <div className="invoice-meta-title-row">
                      <Receipt size={16} className="text-teal" />
                      <span className="invoice-meta-title">Report &amp; Delivery Details</span>
                    </div>

                    <div className="invoice-details-grid">
                      {/* Row 1, Col 1: Report Date */}
                      <div className="meta-field-cell">
                        <div className="meta-label-wrap">
                          <FileText size={13} className="text-teal" />
                          <span>Report Date</span>
                        </div>
                        <div className="meta-val-text">
                          {selectedReport.formatted_report_date || selectedReport.report_date_only || '16 Oct 2026, 11:30 AM'}
                        </div>
                      </div>

                      {/* Row 1, Col 2: Order ID */}
                      <div className="meta-field-cell">
                        <div className="meta-label-wrap">
                          <Receipt size={13} className="text-teal" />
                          <span>Order ID</span>
                        </div>
                        <div className="meta-val-text font-mono font-bold">
                          {formatOrderId(selectedReport.order_id_display || selectedReport.order_id || selectedReport.id)}
                        </div>
                      </div>

                      {/* Row 2, Col 1: Failure Reason */}
                      <div className="meta-field-cell">
                        <div className="meta-label-wrap">
                          <AlertTriangle size={13} className="text-amber-500" />
                          <span>Failure Reason</span>
                        </div>
                        <div className="meta-val-text font-semibold text-amber-700">
                          {selectedReport.failure_reason || 'Customer Unavailable'}
                        </div>
                      </div>

                      {/* Row 2, Col 2: Reported By */}
                      <div className="meta-field-cell">
                        <div className="meta-label-wrap">
                          <User size={13} className="text-teal" />
                          <span>Reported By</span>
                        </div>
                        <div className="meta-val-text">
                          {selectedReport.reported_by_name || 'Rajesh Kumar (Delivery Executive)'}
                        </div>
                      </div>

                      {/* Row 3, Col 1: Rescheduled Date */}
                      <div className="meta-field-cell">
                        <div className="meta-label-wrap">
                          <Calendar size={13} className="text-teal" />
                          <span>Rescheduled Date</span>
                        </div>
                        <div className="meta-val-text font-semibold">
                          {selectedReport.new_delivery_date_formatted || selectedReport.rescheduled_date || '—'}
                        </div>
                      </div>

                      {/* Row 3, Col 2: Rescheduled Slot */}
                      <div className="meta-field-cell">
                        <div className="meta-label-wrap">
                          <Clock size={13} className="text-teal" />
                          <span>Rescheduled Slot</span>
                        </div>
                        <div className="meta-val-text">
                          {selectedReport.rescheduled_time_slot || '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delivery Notes / Status Callout */}
                <div className="report-notes-callout">
                  <div className="notes-icon-col">
                    <Info size={16} className="text-teal" />
                  </div>
                  <div className="notes-content-col">
                    <span className="notes-title">Delivery Status &amp; Action Notes</span>
                    <p className="notes-desc">
                      {selectedReport.admin_reply || selectedReport.notes || (
                        selectedReport.status === 'RESCHEDULED'
                          ? `Delivery was successfully rescheduled for ${selectedReport.new_delivery_date_formatted || selectedReport.rescheduled_date || 'the requested slot'}. Our delivery executive will arrive during ${selectedReport.rescheduled_time_slot || 'your scheduled delivery window'}.`
                          : 'Our operations team has recorded this delivery report and is reviewing order status for immediate resolution.'
                      )}
                    </p>
                  </div>
                </div>

                {/* Thank You Mint Banner matching invoice */}
                <div className="thank-you-mint-banner">
                  <div className="banner-left-msg">
                    <div className="banner-shirt-icon">
                      <Shirt size={22} />
                    </div>
                    <div>
                      <h4 className="banner-title">Thank you for choosing FabriCare!</h4>
                      <p className="banner-desc">Your clothes are in good hands. We hope you loved our service.</p>
                    </div>
                  </div>
                  <div className="banner-script-text">
                    <span>Fresh Clothes,</span>
                    <span className="script-happier">Happier You &hearts;</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
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
          width: 100%;
          min-height: 520px;
          box-sizing: border-box;
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

        /* 4. Modal Styles with visible blurred background & scrollable content matching Invoice View */
        .invoice-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          width: 100%;
          height: 100%;
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 999999 !important;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 24px 16px;
          overflow: hidden !important;
          overscroll-behavior: contain;
          box-sizing: border-box;
        }

        .invoice-modal-container {
          background: #ffffff;
          border-radius: 20px;
          max-width: 900px;
          width: 100%;
          height: calc(100vh - 48px);
          max-height: calc(100vh - 48px);
          overflow: hidden !important;
          box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(0, 0, 0, 0.08);
          display: flex;
          flex-direction: column;
          margin: 0 auto;
          position: relative;
          box-sizing: border-box;
          animation: modalFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .invoice-modal-top-bar {
          flex: 0 0 auto;
          min-height: 62px;
          background: #ffffff;
          border-bottom: 1.5px solid #E2E8F0;
          padding: 12px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          z-index: 20;
          position: relative;
          box-sizing: border-box;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
        }

        .modal-header-title-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .modal-header-title {
          font-size: 0.9375rem;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -0.01em;
        }

        .invoice-modal-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .modal-action-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 15px;
          border-radius: 999px;
          font-size: 0.8125rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
          text-decoration: none;
          border: 1.5px solid #0D7A75;
          background: #ffffff;
          color: #0D7A75;
        }

        .modal-action-pill:hover {
          background: #0D7A75;
          color: #ffffff;
          transform: translateY(-1px);
        }

        .modal-action-pill:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          transform: none;
        }

        .modal-close-circle-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1.5px solid #E2E8F0;
          background: #F8FAFC;
          color: #64748B;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }

        .modal-close-circle-btn:hover {
          background: #E2E8F0;
          color: #0F172A;
          border-color: #CBD5E1;
        }

        .invoice-modal-content-scroll {
          flex: 1 1 0% !important;
          min-height: 0 !important;
          overflow-y: auto !important;
          overflow-x: hidden;
          overscroll-behavior: contain;
          padding: 24px 28px 48px;
          scrollbar-width: thin;
          scrollbar-color: #CBD5E1 #F8FAFC;
          box-sizing: border-box;
          scroll-behavior: auto !important;
        }

        .invoice-modal-content-scroll::-webkit-scrollbar {
          width: 6px;
        }

        .invoice-modal-content-scroll::-webkit-scrollbar-track {
          background: #F8FAFC;
        }

        .invoice-modal-content-scroll::-webkit-scrollbar-thumb {
          background-color: #CBD5E1;
          border-radius: 999px;
        }

        .invoice-modal-content-scroll::-webkit-scrollbar-thumb:hover {
          background-color: #94A3B8;
        }

        /* Document Card Matching Invoice View */
        .tax-invoice-document-card {
          background: #ffffff;
          border: 1.5px solid #E2E8F0;
          border-radius: 20px;
          padding: 34px 38px;
          max-width: 820px;
          margin: 0 auto;
        }

        .invoice-doc-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding-bottom: 24px;
          border-bottom: 1.5px solid #F1F5F9;
        }

        .brand-logo-stack {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brand-circle-logo {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #0D7A75;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .brand-name {
          font-size: 1.5rem;
          font-weight: 800;
          color: #0D7A75;
          letter-spacing: -0.02em;
          line-height: 1.1;
          margin: 0;
        }

        .brand-sub {
          font-size: 0.8125rem;
          color: #64748B;
          font-weight: 500;
        }

        .invoice-tax-meta {
          text-align: right;
        }

        .tax-invoice-heading {
          font-size: 0.9375rem;
          font-weight: 800;
          color: #0D7A75;
          letter-spacing: 0.05em;
          margin: 0 0 2px 0;
        }

        .tax-order-number {
          font-size: 1.5rem;
          font-weight: 900;
          color: #0F172A;
          letter-spacing: -0.02em;
          margin-bottom: 6px;
        }

        .invoice-paid-badge-wrap {
          display: flex;
          justify-content: flex-end;
        }

        .paid-pill-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 0.8125rem;
          font-weight: 700;
        }

        .paid-pill-badge.resched-pill {
          background: #F3E8FF;
          color: #7E22CE;
          border: 1px solid #E9D5FF;
        }

        .paid-pill-badge.resolved-pill {
          background: #E6FBF2;
          color: #059669;
          border: 1px solid #A7F3D0;
        }

        .paid-pill-badge.review-pill {
          background: #E0F2FE;
          color: #0369A1;
          border: 1px solid #BAE6FD;
        }

        .paid-pill-badge.pending-pill {
          background: #FEF3C7;
          color: #B45309;
          border: 1px solid #FDE68A;
        }

        /* Bill To & Meta Data Section */
        .bill-to-meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 24px;
          margin-bottom: 24px;
        }

        .bill-to-section, .invoice-meta-section {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          padding: 18px 20px;
        }

        .bill-to-title-row, .invoice-meta-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 14px;
        }

        .bill-to-title, .invoice-meta-title {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #0F172A;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .bill-customer-info-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .bill-info-cell {
          background: #ffffff;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          padding: 10px 14px;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .cell-heading-label {
          font-size: 0.6875rem;
          font-weight: 700;
          color: #8FA0B5;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .cell-data-value {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1E293B;
          line-height: 1.35;
        }

        .text-navy {
          color: #0F172A !important;
        }

        .invoice-details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .meta-field-cell {
          background: #ffffff;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .meta-label-wrap {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.6875rem;
          font-weight: 700;
          color: #8FA0B5;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .meta-val-text {
          font-size: 0.875rem;
          font-weight: 600;
          color: #0F172A;
          line-height: 1.3;
        }

        /* Report Notes Callout */
        .report-notes-callout {
          background: #F0FDFA;
          border: 1.5px solid #CCFBF1;
          border-radius: 14px;
          padding: 16px 20px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 24px;
        }

        .notes-icon-col {
          padding-top: 2px;
          flex-shrink: 0;
        }

        .notes-title {
          display: block;
          font-size: 0.875rem;
          font-weight: 700;
          color: #0D7A75;
          margin-bottom: 4px;
        }

        .notes-desc {
          font-size: 0.8125rem;
          color: #334155;
          line-height: 1.45;
          margin: 0;
        }

        /* Mint Thank You Banner matching invoice */
        .thank-you-mint-banner {
          background: #E8FAF6;
          border-radius: 14px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
        }

        .banner-left-msg {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .banner-shirt-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: #CCFBF1;
          color: #0D7A75;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .banner-title {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #0D7A75;
          margin: 0;
        }

        .banner-desc {
          font-size: 0.8125rem;
          color: #64748B;
          margin: 2px 0 0;
        }

        .banner-script-text {
          display: flex;
          flex-direction: column;
          text-align: right;
          color: #0D7A75;
          font-weight: 700;
          font-size: 0.9375rem;
          line-height: 1.25;
        }

        .script-happier {
          font-size: 0.875rem;
          font-weight: 800;
        }

        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: scale(0.96);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @media (max-width: 768px) {
          .invoice-modal-overlay {
            padding: 12px 8px;
          }
          .invoice-modal-container {
            height: calc(100vh - 24px);
            max-height: calc(100vh - 24px);
            border-radius: 16px;
          }
          .invoice-modal-top-bar {
            padding: 10px 14px;
          }
          .invoice-modal-content-scroll {
            padding: 16px 14px 32px;
          }
          .tax-invoice-document-card {
            padding: 20px 16px;
            border-radius: 14px;
          }
          .bill-to-meta-grid {
            grid-template-columns: 1fr;
          }
          .invoice-details-grid {
            grid-template-columns: 1fr;
          }
          .thank-you-mint-banner {
            flex-direction: column;
            align-items: flex-start;
          }
          .banner-script-text {
            text-align: left;
          }
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body > *:not(.invoice-modal-overlay),
          header,
          footer,
          nav,
          .no-print,
          .invoice-modal-top-bar,
          button {
            display: none !important;
          }
          .invoice-modal-overlay,
          .invoice-modal-container,
          .invoice-modal-content-scroll {
            position: static !important;
            display: block !important;
            width: 100% !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            background: transparent !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
};
