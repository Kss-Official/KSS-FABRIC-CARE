import React from 'react';
import { useBooking } from '../../context/BookingContext';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight 
} from 'lucide-react';

export const Step3ChooseTime = () => {
  const { 
    pickupSchedule, 
    setPickupSchedule, 
    pickupDetails, 
    allServices, 
    selectedServices, 
    setCurrentStep 
  } = useBooking();

  const dateOptions = [
    { label: 'Today', date: '22 Sep', full: 'Today, 22 Sep 2024' },
    { label: 'Tomorrow', date: '23 Sep', full: 'Tomorrow, 23 Sep 2024' },
    { label: 'Wed', date: '24 Sep', full: 'Wednesday, 24 Sep 2024' },
    { label: 'Thu', date: '25 Sep', full: 'Thursday, 25 Sep 2024' },
    { label: 'Fri', date: '26 Sep', full: 'Friday, 26 Sep 2024' }
  ];

  const timeSlots = [
    { slot: '9:00 AM – 11:00 AM', subtitle: "We'll be at your door" },
    { slot: '11:00 AM – 1:00 PM', subtitle: 'Most popular' },
    { slot: '2:00 PM – 4:00 PM', subtitle: 'Convenient afternoon' },
    { slot: '4:00 PM – 6:00 PM', subtitle: 'Evening slot' },
    { slot: '6:00 PM – 8:00 PM', subtitle: 'Late evening' },
    { slot: '8:00 PM – 9:00 PM', subtitle: 'For your convenience' }
  ];

  const renderServiceIcon = (id) => {
    switch (id) {
      case 'wash-fold':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
          </svg>
        );
      case 'wash-iron':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M7 6.5h10" /><path d="M5 10.5h14" /><path d="M5 14.5h14" /><path d="M7 18.5h10" />
          </svg>
        );
      case 'dry-cleaning':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3a2.5 2.5 0 0 0-2.5 2.5c0 1 .6 1.8 1.5 2.2V9L3.5 15.2A2 2 0 0 0 4.7 18.5H19.3a2 2 0 0 0 1.2-3.3L13 9V7.7a2.5 2.5 0 0 0 1.5-2.2A2.5 2.5 0 0 0 12 3z" />
            <path d="M7.5 15.5h9" />
          </svg>
        );
      case 'steam-iron':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 17h16a1 1 0 0 0 1-1c0-4-3-6-7-6H9a5 5 0 0 0-5 5v2z" /><path d="M9 10V6h7v4" />
          </svg>
        );
      case 'shoe-laundry':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3.5 15.5h17a1 1 0 0 1 1 1v1a1.5 1.5 0 0 1-1.5 1.5h-16A1.5 1.5 0 0 1 2.5 17.5v-1a1 1 0 0 1 1-1z" />
            <path d="M5 15.5c.5-2.5 2-4.5 5-5.5l4 .5 4 3 3 2" /><path d="M10 10.5 8 9" />
          </svg>
        );
      case 'home-care':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="5" width="16" height="3" rx="1.5" /><rect x="4" y="10.5" width="16" height="3" rx="1.5" /><rect x="4" y="16" width="16" height="3" rx="1.5" />
          </svg>
        );
      default:
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
          </svg>
        );
    }
  };

  const selectedItemsData = allServices.filter(s => selectedServices.includes(s.id));

  return (
    <div className="step3-container animate-fade-in">
      <div className="booking-layout-grid">
        {/* Left: Single Parent Card enclosing Header, Date Chips, Time Slots 3x2 Grid, and Pagination */}
        <div className="time-parent-card">
          <div className="step-header">
            <span className="step-count">03 / 04</span>
            <h2 className="step-title">Choose pickup time</h2>
            <p className="step-subtitle">Select a convenient date and time for pickup</p>
          </div>

          <div className="time-picker-body">
            {/* Date Selector Row */}
            <div className="date-pills-row">
              {dateOptions.map((opt) => {
                const isSelected = pickupSchedule.dateLabel === opt.full;
                return (
                  <button
                    key={opt.date}
                    type="button"
                    className={`date-pill-btn ${isSelected ? 'selected' : ''}`}
                    onClick={() => setPickupSchedule(prev => ({ ...prev, dateLabel: opt.full, dateValue: opt.date }))}
                  >
                    <span className="date-day-label">{opt.label}</span>
                    <span className="date-day-val">{opt.date}</span>
                  </button>
                );
              })}

              <button 
                type="button" 
                className="date-pill-btn calendar-custom-pill"
                onClick={() => setPickupSchedule(prev => ({ ...prev, dateLabel: 'Saturday, 27 Sep 2024', dateValue: '27-sep' }))}
              >
                <div className="pick-date-inner">
                  <Calendar size={16} className="calendar-icon" />
                  <span className="date-day-val pick-text">Pick a date</span>
                </div>
              </button>
            </div>

            {/* Time Slot Heading */}
            <h3 className="time-slots-heading">Select a time slot</h3>

            {/* Time Slots 3x2 Grid */}
            <div className="time-slots-grid">
              {timeSlots.map((ts) => {
                const isSelected = pickupSchedule.timeSlot === ts.slot;
                return (
                  <div
                    key={ts.slot}
                    className={`time-slot-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setPickupSchedule(prev => ({ ...prev, timeSlot: ts.slot }))}
                  >
                    <div className={`radio-dot ${isSelected ? 'checked' : ''}`}>
                      {isSelected && <span className="inner-dot" />}
                    </div>
                    <div className="slot-info">
                      <div className="slot-time-text">{ts.slot}</div>
                      <div className="slot-subtitle-text">{ts.subtitle}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pagination Row inside parent card */}
          <div className="card-pagination-row">
            <button
              className="pagination-circle-btn"
              onClick={() => setCurrentStep(2)}
              aria-label="Previous step"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="pagination-dots">
              <span className="dot" onClick={() => setCurrentStep(1)}></span>
              <span className="dot" onClick={() => setCurrentStep(2)}></span>
              <span className="dot active"></span>
              <span className="dot" onClick={() => setCurrentStep(4)}></span>
            </div>

            <button
              className="pagination-circle-btn"
              onClick={() => setCurrentStep(4)}
              aria-label="Next step"
              disabled={!pickupSchedule.dateLabel || !pickupSchedule.timeSlot}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Right: Summary Sidebar Card */}
        <div className="summary-sidebar-container">
          <div className="sidebar-card">
            {/* Section 1: Your Selection */}
            <div className="sidebar-section">
              <div className="section-header-row">
                <h3 className="sidebar-section-title">Your Selection</h3>
                <button
                  type="button"
                  className="edit-link-btn"
                  onClick={() => setCurrentStep(1)}
                >
                  Edit
                </button>
              </div>

              <div className="selected-chips-list">
                {selectedItemsData.map(item => (
                  <div key={item.id} className="selected-summary-chip">
                    <div className="chip-icon-box">
                      {renderServiceIcon(item.id)}
                    </div>
                    <span className="chip-name-text">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 2: Pickup Location */}
            <div className="sidebar-section location-section">
              <div className="section-header-row">
                <h3 className="sidebar-section-title">Pickup Location</h3>
                <button
                  type="button"
                  className="edit-link-btn"
                  onClick={() => setCurrentStep(2)}
                >
                  Edit
                </button>
              </div>

              <div className="location-info-row">
                <MapPin size={18} className="location-pin-icon" />
                <span className="location-address-text">
                  {pickupDetails.address || 'Banaswadi, Bengaluru - 560043'}
                </span>
              </div>
            </div>

            {/* Section 3: Reschedule Info Notice */}
            <div className="reschedule-notice-box">
              <Clock size={18} className="notice-clock-icon" />
              <p className="notice-text">
                You can reschedule or modify this anytime before pickup.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Step Navigation Action */}
      <div className="step-footer-actions">
        <button
          className="btn-next-action"
          onClick={() => setCurrentStep(4)}
          disabled={!pickupSchedule.dateLabel || !pickupSchedule.timeSlot}
        >
          <span>Next</span>
          <ArrowRight size={17} />
        </button>
      </div>

      <style>{`
        .step3-container {
          width: 100%;
        }

        .booking-layout-grid {
          display: grid;
          grid-template-columns: 1.8fr 1fr;
          gap: 24px;
          align-items: stretch;
        }

        /* Left Single Parent Card */
        .time-parent-card {
          background: #ffffff;
          border: 1.5px solid #E2E8F0;
          border-radius: 20px;
          padding: 28px 24px 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .step-header {
          margin-bottom: 22px;
        }

        .step-count {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #64748B;
          letter-spacing: 0.04em;
        }

        .step-title {
          font-size: 1.625rem;
          font-weight: 800;
          color: #0F172A;
          margin: 6px 0 2px 0;
          letter-spacing: -0.02em;
        }

        .step-subtitle {
          font-size: 0.875rem;
          color: #64748B;
        }

        .time-picker-body {
          display: flex;
          flex-direction: column;
        }

        /* Date selector row */
        .date-pills-row {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 10px;
          margin-bottom: 24px;
        }

        .date-pill-btn {
          background: #ffffff;
          border: 1.5px solid #E2E8F0;
          border-radius: 14px;
          padding: 12px 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .date-pill-btn:hover {
          border-color: #0D7A75;
          background: #F4FBFA;
        }

        .date-pill-btn.selected {
          border: 2px solid #0D7A75;
          background: #F4FBFA;
        }

        .date-day-label {
          font-size: 0.75rem;
          font-weight: 500;
          color: #64748B;
        }

        .date-day-val {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #0F172A;
          margin-top: 2px;
        }

        .date-pill-btn.selected .date-day-label {
          color: #0D7A75;
          font-weight: 600;
        }

        .date-pill-btn.selected .date-day-val {
          color: #0D7A75;
        }

        .calendar-custom-pill {
          color: #0D7A75;
        }

        .pick-date-inner {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .calendar-icon {
          color: #0D7A75;
        }

        .pick-text {
          font-size: 0.8125rem;
          color: #0F172A;
          margin-top: 0;
        }

        /* Time slots heading & 3x2 grid */
        .time-slots-heading {
          font-size: 0.875rem;
          font-weight: 700;
          color: #0F172A;
          margin-bottom: 14px;
        }

        .time-slots-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }

        .time-slot-card {
          background: #ffffff;
          border: 1.5px solid #E2E8F0;
          border-radius: 14px;
          padding: 13px 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .time-slot-card:hover {
          border-color: #0D7A75;
        }

        .time-slot-card.selected {
          border: 2px solid #0D7A75;
          background: #F4FBFA;
        }

        .radio-dot {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 1.5px solid #CBD5E1;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s;
        }

        .radio-dot.checked {
          border-color: #0D7A75;
        }

        .inner-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #0D7A75;
        }

        .slot-info {
          display: flex;
          flex-direction: column;
        }

        .slot-time-text {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #0F172A;
          line-height: 1.25;
        }

        .slot-subtitle-text {
          font-size: 0.72rem;
          color: #64748B;
          margin-top: 2px;
          line-height: 1.2;
        }

        /* Pagination Row at bottom of Parent Card */
        .card-pagination-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          margin-top: 24px;
          padding: 4px 0;
        }

        .pagination-dots {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .pagination-dots .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #E2E8F0;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .pagination-dots .dot.active {
          width: 14px;
          height: 6px;
          border-radius: 4px;
          background: #0D7A75;
        }

        .pagination-circle-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #F1F5F9;
          border: none;
          color: #64748B;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.15s;
        }

        .pagination-circle-btn:hover:not(:disabled) {
          background: #E2E8F0;
        }

        .pagination-circle-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* Right Summary Sidebar Card */
        .summary-sidebar-container {
          width: 100%;
        }

        .sidebar-card {
          background: #ffffff;
          border: 1.5px solid #E2E8F0;
          border-radius: 20px;
          padding: 24px 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .section-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .sidebar-section-title {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #0F172A;
        }

        .edit-link-btn {
          background: none;
          border: none;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #0D7A75;
          cursor: pointer;
        }

        .edit-link-btn:hover {
          text-decoration: underline;
        }

        .selected-chips-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .selected-summary-chip {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 4px 0;
        }

        .chip-icon-box {
          color: #0D7A75;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .chip-name-text {
          font-size: 0.9375rem;
          font-weight: 600;
          color: #0F172A;
        }

        .location-section {
          padding-top: 4px;
        }

        .location-info-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .location-pin-icon {
          color: #0D7A75;
          flex-shrink: 0;
        }

        .location-address-text {
          font-size: 0.875rem;
          color: #0F172A;
          font-weight: 500;
          line-height: 1.4;
        }

        /* Reschedule Info Notice */
        .reschedule-notice-box {
          background: #E8FAF6;
          border-radius: 12px;
          padding: 14px 16px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-top: 8px;
        }

        .notice-clock-icon {
          color: #0D7A75;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .notice-text {
          font-size: 0.8125rem;
          color: #334155;
          line-height: 1.45;
          font-weight: 500;
        }

        /* Bottom Footer Action */
        .step-footer-actions {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          margin-top: 28px;
        }

        .btn-next-action {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #0D7A75;
          color: #ffffff;
          font-weight: 600;
          font-size: 0.9375rem;
          padding: 11px 28px;
          border-radius: 999px;
          border: none;
          cursor: pointer;
          transition: background 0.15s, opacity 0.15s;
          box-shadow: 0 4px 12px rgba(13, 122, 117, 0.15);
        }

        .btn-next-action:hover:not(:disabled) {
          background: #095F5B;
        }

        .btn-next-action:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 960px) {
          .booking-layout-grid {
            grid-template-columns: 1fr;
          }
          .date-pills-row {
            grid-template-columns: repeat(3, 1fr);
          }
          .time-slots-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 600px) {
          .date-pills-row {
            grid-template-columns: repeat(2, 1fr);
          }
          .time-slots-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
