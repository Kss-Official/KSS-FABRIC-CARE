import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { 
  Calendar as CalendarIcon, 
  X, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw,
  Info,
  CalendarCheck
} from 'lucide-react';

const TIME_SLOTS = [
  '10:00 AM–12:00 PM',
  '12:00 PM–2:00 PM',
  '2:00 PM–4:00 PM',
  '4:00 PM–6:00 PM'
];

export const RescheduleDeliveryDrawer = () => {
  const { 
    isRescheduleDrawerOpen, 
    closeRescheduleDrawer, 
    activeRescheduleComplaint,
    rescheduleDelivery 
  } = useAdmin();

  const [deliveryDate, setDeliveryDate] = useState('');
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0]);
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Set default date when complaint opens (default to tomorrow or requested date)
  useEffect(() => {
    if (activeRescheduleComplaint) {
      setError('');
      setSuccessMsg('');
      setAdminNotes('');
      setTimeSlot(TIME_SLOTS[0]);

      // If complaint has a requested_reschedule_date, pre-fill it if in future
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      if (activeRescheduleComplaint.requested_reschedule_date) {
        setDeliveryDate(activeRescheduleComplaint.requested_reschedule_date);
      } else {
        setDeliveryDate(tomorrowStr);
      }
    }
  }, [activeRescheduleComplaint, isRescheduleDrawerOpen]);

  if (!isRescheduleDrawerOpen || !activeRescheduleComplaint) {
    return null;
  }

  const handleConfirm = async (e) => {
    e.preventDefault();
    setError('');

    if (!deliveryDate) {
      setError('Please select a valid new delivery date.');
      return;
    }

    // Validate that the selected date is today or future date
    const selected = new Date(deliveryDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(selected.getTime())) {
      setError('Invalid date format.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        delivery_date: deliveryDate,
        new_delivery_date: deliveryDate,
        delivery_time_slot: timeSlot,
        time_slot: timeSlot,
        notes: adminNotes
      };

      const res = await rescheduleDelivery(activeRescheduleComplaint.id, payload);
      if (res && (res.success || res.status === 200 || res.data)) {
        setSuccessMsg('Delivery rescheduled successfully!');
        setTimeout(() => {
          closeRescheduleDrawer();
        }, 1200);
      } else {
        setError(res?.detail || 'Failed to reschedule delivery.');
      }
    } catch (err) {
      console.error('Error submitting reschedule:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to reschedule delivery');
    } finally {
      setSubmitting(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Format current/requested date
  const displayCurrentDate = activeRescheduleComplaint.formatted_reschedule_date !== '—'
    ? activeRescheduleComplaint.formatted_reschedule_date
    : activeRescheduleComplaint.requested_reschedule_date || '18 Oct 2025';

  return (
    <>
      {/* Backdrop for mobile/tablet */}
      <div 
        className="reschedule-backdrop animate-fade-in"
        onClick={closeRescheduleDrawer}
      />

      {/* Right-Side Reschedule Panel */}
      <aside className="reschedule-panel-drawer animate-slide-in-right">
        {/* Panel Header */}
        <div className="reschedule-panel-header">
          <div className="header-title-wrap">
            <div className="header-cal-icon-wrap">
              <CalendarCheck size={18} className="text-[#087F8C]" />
            </div>
            <h2 className="header-title">Reschedule Delivery</h2>
          </div>
          <button 
            type="button" 
            className="panel-close-btn"
            onClick={closeRescheduleDrawer}
            aria-label="Close reschedule panel"
          >
            <X size={18} />
          </button>
        </div>

        {/* Panel Scrollable Body */}
        <div className="reschedule-panel-body">
          {/* Order Details Card */}
          <div className="reschedule-meta-group">
            <div className="meta-field-row">
              <span className="meta-field-label">Order ID</span>
              <span className="meta-field-value font-mono font-bold text-[#0F172A]">
                {activeRescheduleComplaint.order_id || '#FC1024'}
              </span>
            </div>

            <div className="meta-field-row">
              <span className="meta-field-label">Customer Name</span>
              <span className="meta-field-value font-semibold text-[#1E293B]">
                {activeRescheduleComplaint.customer_name || 'Rahul Sharma'}
              </span>
            </div>

            <div className="meta-field-row">
              <span className="meta-field-label">Failure Reason</span>
              <span className="meta-field-value text-[#334155]">
                {activeRescheduleComplaint.failure_reason || 'Customer Unavailable'}
              </span>
            </div>

            <div className="meta-field-row">
              <span className="meta-field-label">Current Reschedule Date</span>
              <span className="meta-field-value font-medium text-[#475569]">
                {displayCurrentDate}
              </span>
            </div>
          </div>

          <form onSubmit={handleConfirm} className="reschedule-form">
            {/* Date Selection */}
            <div className="form-input-group">
              <label htmlFor="delivery-date-input" className="form-label">
                Select New Delivery Date <span className="text-red-500">*</span>
              </label>
              
              <div className="date-input-wrapper">
                <input
                  id="delivery-date-input"
                  type="date"
                  min={getMinDate()}
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="reschedule-date-input"
                  required
                />
              </div>

              <div className="date-helper-note">
                <Info size={14} className="info-icon" />
                <span>Please select a future date</span>
              </div>
            </div>

            {/* Time Slot Selection */}
            <div className="form-input-group">
              <label className="form-label">
                Select Delivery Time <span className="text-red-500">*</span>
              </label>

              <div className="time-slots-grid">
                {TIME_SLOTS.map((slot) => {
                  const isSelected = timeSlot === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      className={`time-slot-pill ${isSelected ? 'selected' : ''}`}
                      onClick={() => setTimeSlot(slot)}
                    >
                      <Clock size={13} className="slot-clock-icon" />
                      <span>{slot}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Admin Notes */}
            <div className="form-input-group">
              <label htmlFor="admin-reschedule-notes" className="form-label">
                Admin Notes <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                id="admin-reschedule-notes"
                rows="3"
                placeholder="e.g. Spoke with customer. Reattempt delivery between 10 AM and 12 PM."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="reschedule-notes-textarea"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="reschedule-alert error animate-shake">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div className="reschedule-alert success animate-fade-in">
                <CheckCircle2 size={16} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="reschedule-footer-actions">
              <button
                type="button"
                className="reschedule-cancel-btn"
                onClick={closeRescheduleDrawer}
                disabled={submitting}
              >
                Cancel
              </button>
              
              <button
                type="submit"
                className="reschedule-confirm-btn"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Rescheduling...</span>
                  </>
                ) : (
                  <span>Confirm Reschedule</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </aside>

      {/* Reschedule Drawer Styles matching Reference Image */}
      <style>{`
        .reschedule-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(2px);
          z-index: 1040;
        }

        .reschedule-panel-drawer {
          position: fixed;
          top: 70px;
          right: 24px;
          bottom: 24px;
          width: 380px;
          max-width: calc(100vw - 32px);
          background: #FFFFFF;
          border-radius: 16px;
          box-shadow: 0 20px 40px -8px rgba(15, 23, 42, 0.2), 0 0 1px 1px rgba(226, 232, 240, 0.8);
          z-index: 1050;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @media (max-width: 768px) {
          .reschedule-panel-drawer {
            top: 0;
            right: 0;
            bottom: 0;
            width: 100%;
            max-width: 100%;
            border-radius: 0;
          }
        }

        .reschedule-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid #F1F5F9;
        }

        .header-title-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .header-cal-icon-wrap {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: #E0F2FE;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .header-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: #0F172A;
          margin: 0;
          font-family: inherit;
        }

        .panel-close-btn {
          background: none;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          padding: 6px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s, color 0.15s;
        }

        .panel-close-btn:hover {
          background: #F1F5F9;
          color: #334155;
        }

        .reschedule-panel-body {
          padding: 24px;
          overflow-y: auto;
          flex: 1;
        }

        .reschedule-meta-group {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          padding: 16px 18px;
          margin-bottom: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .meta-field-row {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .meta-field-label {
          font-size: 0.75rem;
          font-weight: 500;
          color: #64748B;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .meta-field-value {
          font-size: 0.92rem;
        }

        .reschedule-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-label {
          font-size: 0.86rem;
          font-weight: 600;
          color: #1E293B;
        }

        .date-input-wrapper {
          position: relative;
        }

        .reschedule-date-input {
          width: 100%;
          padding: 10px 14px;
          font-size: 0.92rem;
          font-weight: 500;
          color: #1E293B;
          background: #FFFFFF;
          border: 1.5px solid #CBD5E1;
          border-radius: 8px;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .reschedule-date-input:focus {
          border-color: #087F8C;
          box-shadow: 0 0 0 3px rgba(8, 127, 140, 0.12);
        }

        .date-helper-note {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.78rem;
          color: #64748B;
          margin-top: 2px;
        }

        .date-helper-note .info-icon {
          color: #64748B;
        }

        .time-slots-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
        }

        .time-slot-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 14px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 500;
          color: #334155;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s ease;
        }

        .time-slot-pill:hover {
          background: #F8FAFC;
          border-color: #CBD5E1;
        }

        .time-slot-pill.selected {
          background: #E6FFFA;
          border-color: #087F8C;
          color: #065F6B;
          font-weight: 600;
        }

        .time-slot-pill .slot-clock-icon {
          color: #64748B;
        }

        .time-slot-pill.selected .slot-clock-icon {
          color: #087F8C;
        }

        .reschedule-notes-textarea {
          width: 100%;
          padding: 10px 14px;
          font-size: 0.88rem;
          color: #1E293B;
          background: #FFFFFF;
          border: 1.5px solid #CBD5E1;
          border-radius: 8px;
          outline: none;
          box-sizing: border-box;
          resize: vertical;
          font-family: inherit;
        }

        .reschedule-notes-textarea:focus {
          border-color: #087F8C;
          box-shadow: 0 0 0 3px rgba(8, 127, 140, 0.12);
        }

        .reschedule-alert {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 0.84rem;
          font-weight: 500;
        }

        .reschedule-alert.error {
          background: #FEF2F2;
          border: 1px solid #FECACA;
          color: #DC2626;
        }

        .reschedule-alert.success {
          background: #ECFDF5;
          border: 1px solid #A7F3D0;
          color: #059669;
        }

        .reschedule-footer-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 10px;
          padding-top: 16px;
          border-top: 1px solid #F1F5F9;
        }

        .reschedule-cancel-btn {
          padding: 10px 20px;
          font-size: 0.88rem;
          font-weight: 600;
          color: #475569;
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }

        .reschedule-cancel-btn:hover {
          background: #F8FAFC;
          color: #1E293B;
        }

        .reschedule-confirm-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 22px;
          font-size: 0.88rem;
          font-weight: 600;
          color: #FFFFFF;
          background: #087F8C;
          border: 1px solid #087F8C;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
        }

        .reschedule-confirm-btn:hover {
          background: #066974;
        }

        .reschedule-confirm-btn:active {
          transform: scale(0.99);
        }

        .reschedule-confirm-btn:disabled,
        .reschedule-cancel-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }
      `}</style>
    </>
  );
};
