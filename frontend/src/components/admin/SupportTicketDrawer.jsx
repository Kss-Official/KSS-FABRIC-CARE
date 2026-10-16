import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAdmin } from '../../context/AdminContext';
import { 
  X, 
  User, 
  Calendar, 
  Tag, 
  MessageSquare, 
  CornerDownRight, 
  Clock, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Mail,
  Loader2
} from 'lucide-react';

export const SupportTicketDrawer = () => {
  const { 
    isSupportDrawerOpen, 
    activeSupportTicket, 
    closeSupportDrawer,
    replyToSupportTicket,
    resolveSupportTicket 
  } = useAdmin();

  const [responseText, setResponseText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('IN_PROGRESS');
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Lock background scroll when Support Ticket Drawer is open (matching Services & Pricing edit modal behavior)
  useEffect(() => {
    const wrapper = document.querySelector('.admin-main-wrapper');
    if (isSupportDrawerOpen) {
      if (wrapper) wrapper.classList.add('admin-scroll-locked');
    } else {
      if (wrapper) wrapper.classList.remove('admin-scroll-locked');
    }
    return () => {
      if (wrapper) wrapper.classList.remove('admin-scroll-locked');
    };
  }, [isSupportDrawerOpen]);

  useEffect(() => {
    if (activeSupportTicket) {
      setResponseText(activeSupportTicket.admin_reply || '');
      setSelectedStatus(activeSupportTicket.status || 'IN_PROGRESS');
      setToastMessage(null);
    }
  }, [activeSupportTicket]);

  if (!isSupportDrawerOpen || !activeSupportTicket) return null;

  const getPriorityBadge = (priority) => {
    const p = String(priority || '').toUpperCase();
    if (p === 'HIGH') {
      return <span className="drawer-badge badge-p-high">High</span>;
    }
    if (p === 'MEDIUM') {
      return <span className="drawer-badge badge-p-medium">Medium</span>;
    }
    return <span className="drawer-badge badge-p-low">Low</span>;
  };

  const handleSendResponse = async () => {
    if (!responseText.trim()) {
      setToastMessage({ type: 'error', text: 'Please enter a response message.' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await replyToSupportTicket(
        activeSupportTicket.id, 
        responseText.trim(), 
        selectedStatus
      );
      if (res && res.success) {
        setToastMessage({ type: 'success', text: 'Response sent and customer notified.' });
        setTimeout(() => {
          closeSupportDrawer();
        }, 1200);
      }
    } catch (err) {
      setToastMessage({ type: 'error', text: 'Failed to send response. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkResolved = async () => {
    setSubmitting(true);
    try {
      const res = await resolveSupportTicket(
        activeSupportTicket.id, 
        responseText.trim() || activeSupportTicket.admin_reply
      );
      if (res && res.success) {
        setSelectedStatus('RESOLVED');
        setToastMessage({ type: 'success', text: 'Ticket marked as Resolved!' });
        setTimeout(() => {
          closeSupportDrawer();
        }, 1200);
      }
    } catch (err) {
      setToastMessage({ type: 'error', text: 'Failed to resolve ticket. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const ticketId = activeSupportTicket.ticket_id_display || activeSupportTicket.ticket_number || `#SUP-${activeSupportTicket.id}`;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="drawer-backdrop animate-fade-in" onClick={closeSupportDrawer}>
      <aside 
        className="support-drawer animate-slide-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="drawer-header">
          <div className="drawer-title-wrap">
            <div className="drawer-title-icon-box">
              <FileText size={20} className="text-[#0D7A75]" />
            </div>
            <h2 className="drawer-ticket-title font-bold text-slate-800">
              Ticket {ticketId}
            </h2>
          </div>
          <button 
            type="button" 
            className="drawer-close-btn"
            onClick={closeSupportDrawer}
            aria-label="Close drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Body Scrollable */}
        <div className="drawer-body">
          {toastMessage && (
            <div className={`drawer-alert ${toastMessage.type === 'error' ? 'alert-danger' : 'alert-success'}`}>
              {toastMessage.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
              <span>{toastMessage.text}</span>
            </div>
          )}

          {/* Section 1: Customer Information */}
          <div className="drawer-section">
            <div className="section-title-wrap">
              <User size={16} className="text-[#64748B]" />
              <span className="section-title">Customer Information</span>
            </div>
            <div className="customer-info-box">
              <div className="info-field">
                <span className="field-label">Name</span>
                <span className="field-value font-semibold text-slate-900">
                  {activeSupportTicket.customer_name || 'Customer'}
                </span>
              </div>
              <div className="info-field mt-2">
                <span className="field-label">Email</span>
                <span className="field-value text-slate-700">
                  {activeSupportTicket.customer_email || 'customer@example.com'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Priority & Submitted Date Row */}
          <div className="drawer-meta-grid">
            <div className="drawer-meta-col">
              <div className="section-title-wrap mb-1">
                <Tag size={14} className="text-[#64748B]" />
                <span className="field-label">Priority</span>
              </div>
              <div>{getPriorityBadge(activeSupportTicket.priority)}</div>
            </div>

            <div className="drawer-meta-col">
              <div className="section-title-wrap mb-1">
                <Calendar size={14} className="text-[#64748B]" />
                <span className="field-label">Submitted Date &amp; Time</span>
              </div>
              <span className="field-value-sm text-slate-800 font-medium">
                {activeSupportTicket.formatted_created_at || '16 Oct 2026, 10:24 AM'}
              </span>
            </div>
          </div>

          {/* Section 3: Issue Subject */}
          <div className="drawer-section">
            <div className="section-title-wrap">
              <Tag size={16} className="text-[#64748B]" />
              <span className="section-title">Issue Subject</span>
            </div>
            <p className="issue-subject-text font-medium text-slate-900">
              {activeSupportTicket.subject || 'Support Request'}
            </p>
          </div>

          {/* Section 4: Detailed Message */}
          <div className="drawer-section">
            <div className="section-title-wrap">
              <MessageSquare size={16} className="text-[#64748B]" />
              <span className="section-title">Detailed Message</span>
            </div>
            <div className="detailed-message-card">
              <p className="detailed-message-text whitespace-pre-wrap">
                {activeSupportTicket.message || 'No detailed message provided.'}
              </p>
            </div>
          </div>

          {/* Previous Admin Response Display (If Exists) */}
          {activeSupportTicket.admin_reply && (
            <div className="drawer-section">
              <div className="section-title-wrap">
                <CheckCircle2 size={16} className="text-[#16A34A]" />
                <span className="section-title">Sent Response</span>
                {activeSupportTicket.formatted_admin_reply_at && (
                  <span className="text-xs text-slate-400 font-normal ml-auto">
                    {activeSupportTicket.formatted_admin_reply_at}
                  </span>
                )}
              </div>
              <div className="previous-reply-card">
                <p className="text-sm text-slate-800 whitespace-pre-wrap">
                  {activeSupportTicket.admin_reply}
                </p>
              </div>
            </div>
          )}

          {/* Section 5: Admin Response Textarea */}
          <div className="drawer-section">
            <div className="section-title-wrap">
              <CornerDownRight size={16} className="text-[#64748B]" />
              <span className="section-title">Admin Response</span>
            </div>
            <div className="textarea-wrapper">
              <textarea
                rows={4}
                maxLength={500}
                placeholder="Write a response to the customer..."
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                className="admin-response-textarea"
              />
              <div className="char-counter">
                {responseText.length}/500
              </div>
            </div>
          </div>

          {/* Section 6: Update Status Dropdown */}
          <div className="drawer-section">
            <div className="section-title-wrap">
              <Clock size={16} className="text-[#64748B]" />
              <span className="section-title">Update Status</span>
            </div>
            <div className="status-select-wrap">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="drawer-status-select"
              >
                <option value="IN_PROGRESS">In Progress</option>
                <option value="OPEN">Open</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Drawer Bottom Actions */}
        <div className="drawer-footer">
          <button
            type="button"
            className="drawer-btn-send"
            disabled={submitting}
            onClick={handleSendResponse}
          >
            {submitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={15} />
            )}
            <span>Send Response</span>
          </button>

          <button
            type="button"
            className="drawer-btn-resolve"
            disabled={submitting}
            onClick={handleMarkResolved}
          >
            {submitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCircle2 size={15} />
            )}
            <span>Mark Resolved</span>
          </button>
        </div>
      </aside>

      {/* Scoped CSS Styles matching Reference Image 4 */}
      <style>{`
        .drawer-backdrop {
          position: fixed !important;
          inset: 0 !important;
          background: rgba(15, 23, 42, 0.45) !important;
          backdrop-filter: blur(2px) !important;
          -webkit-backdrop-filter: blur(2px) !important;
          z-index: 99999 !important;
          display: flex !important;
          justify-content: flex-end !important;
          overflow: hidden !important;
          overscroll-behavior: none !important;
        }
        .support-drawer {
          width: 440px;
          max-width: 95vw;
          height: 100vh !important;
          height: 100dvh !important;
          max-height: 100vh !important;
          max-height: 100dvh !important;
          background: #FFFFFF !important;
          display: flex !important;
          flex-direction: column !important;
          box-shadow: -4px 0 24px rgba(0, 0, 0, 0.12) !important;
          overflow: hidden !important;
          overscroll-behavior: contain !important;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          position: relative !important;
          z-index: 100000 !important;
        }

        .drawer-header {
          padding: 18px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #F1F5F9;
          flex-shrink: 0 !important;
        }
        .drawer-title-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .drawer-title-icon-box {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: #E6F4F3;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .drawer-ticket-title {
          font-size: 17px;
          color: #0F172A;
          margin: 0;
        }
        .drawer-close-btn {
          background: transparent;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          padding: 6px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .drawer-close-btn:hover {
          background: #F1F5F9;
          color: #0F172A;
        }

        .drawer-body {
          flex: 1 1 auto !important;
          min-height: 0 !important;
          overflow-y: auto !important;
          overscroll-behavior: contain !important;
          -webkit-overflow-scrolling: touch !important;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .drawer-alert {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
        }
        .alert-success {
          background: #DCFCE7;
          color: #166534;
        }
        .alert-danger {
          background: #FEE2E2;
          color: #991B1B;
        }

        .drawer-section {
          display: flex;
          flex-direction: column;
        }
        .section-title-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        .section-title {
          font-size: 13px;
          font-weight: 700;
          color: #1E293B;
        }

        .customer-info-box {
          background: #F8FAFC;
          border: 1px solid #F1F5F9;
          border-radius: 10px;
          padding: 12px 14px;
        }
        .field-label {
          font-size: 11px;
          color: #64748B;
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.5px;
          display: block;
          margin-bottom: 2px;
        }
        .field-value {
          font-size: 14px;
        }
        .field-value-sm {
          font-size: 13px;
        }

        .drawer-meta-grid {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 16px;
          padding: 4px 0;
        }

        .drawer-badge {
          display: inline-flex;
          align-items: center;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
        }
        .badge-p-high {
          background: #FEE2E2;
          color: #EF4444;
        }
        .badge-p-medium {
          background: #FEF3C7;
          color: #D97706;
        }
        .badge-p-low {
          background: #DCFCE7;
          color: #16A34A;
        }

        .issue-subject-text {
          font-size: 14px;
          margin: 0;
          line-height: 1.4;
        }

        .detailed-message-card {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          padding: 14px;
        }
        .detailed-message-text {
          font-size: 13px;
          color: #334155;
          line-height: 1.5;
          margin: 0;
        }

        .previous-reply-card {
          background: #ECFDF5;
          border: 1px solid #A7F3D0;
          border-radius: 10px;
          padding: 12px 14px;
        }

        .textarea-wrapper {
          position: relative;
        }
        .admin-response-textarea {
          width: 100%;
          border: 1px solid #CBD5E1;
          border-radius: 8px;
          padding: 12px;
          font-size: 13px;
          color: #1E293B;
          resize: vertical;
          outline: none;
          transition: border-color 0.15s;
          font-family: inherit;
        }
        .admin-response-textarea:focus {
          border-color: #0D7A75;
          box-shadow: 0 0 0 2px rgba(13, 122, 117, 0.15);
        }
        .char-counter {
          position: absolute;
          bottom: 10px;
          right: 12px;
          font-size: 11px;
          color: #94A3B8;
        }

        .status-select-wrap {
          position: relative;
        }
        .drawer-status-select {
          width: 100%;
          appearance: none;
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 13px;
          font-weight: 500;
          color: #1E293B;
          outline: none;
          cursor: pointer;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
        }
        .drawer-status-select:focus {
          border-color: #0D7A75;
        }

        .drawer-footer {
          padding: 16px 24px;
          border-top: 1px solid #F1F5F9;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          background: #FFFFFF;
        }
        .drawer-btn-send {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: #FFFFFF;
          border: 1px solid #0D7A75;
          color: #0D7A75;
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .drawer-btn-send:hover:not(:disabled) {
          background: #E6F4F3;
        }
        .drawer-btn-resolve {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: #0D7A75;
          border: 1px solid #0D7A75;
          color: #FFFFFF;
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
        }
        .drawer-btn-resolve:hover:not(:disabled) {
          background: #0A635F;
        }
        .drawer-btn-send:disabled, .drawer-btn-resolve:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>,
    document.body
  );
};
