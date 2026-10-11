import React from 'react';
import { useBooking } from '../../context/BookingContext';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Info, 
  ArrowLeft, 
  ArrowRight, 
  Shirt, 
  Sparkles,
  CheckCircle
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
    { slot: '8:00 AM – 10:00 AM', badge: 'Most popular' },
    { slot: '10:00 AM – 12:00 PM' },
    { slot: '12:00 PM – 2:00 PM' },
    { slot: '4:00 PM – 6:00 PM' },
    { slot: '6:00 PM – 8:00 PM' },
    { slot: '8:00 PM – 10:00 PM' }
  ];

  const selectedItemsData = allServices.filter(s => selectedServices.includes(s.id));

  return (
    <div className="step3-container animate-fade-in">
      <div className="step-header">
        <span className="step-count">03 / 04</span>
        <h2 className="step-title">Choose pickup time</h2>
        <p className="step-subtitle">Select convenient time slot for pickup</p>
      </div>

      <div className="booking-layout-grid">
        {/* Left: Date & Time Slot Pickers */}
        <div className="time-selection-col">
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
              <Calendar size={18} />
              <span className="date-day-val">Pick Date</span>
            </button>
          </div>

          <h3 className="section-mini-heading">Select time period</h3>

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
                  <div className="time-slot-left">
                    <div className={`radio-dot ${isSelected ? 'checked' : ''}`}>
                      {isSelected && <span className="inner-dot" />}
                    </div>
                    <div>
                      <div className="slot-time-text">{ts.slot}</div>
                      {ts.badge && (
                        <span className="slot-badge">{ts.badge}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Summary Sidebar */}
        <div className="booking-summary-sidebar">
          <div className="sidebar-card">
            <h3 className="sidebar-title">Your Selection</h3>
            
            <div className="selection-mini-list">
              {selectedItemsData.map(item => (
                <div key={item.id} className="selection-mini-item">
                  <span className="mini-icon">✓</span>
                  <span className="mini-name">{item.name}</span>
                </div>
              ))}
            </div>

            <div className="summary-divider" />

            <div className="pickup-location-box">
              <span className="location-box-title">Pickup Location</span>
              <div className="location-box-address">
                <MapPin size={16} className="text-teal" />
                <span>{pickupDetails.address}</span>
              </div>
            </div>

            <div className="driver-window-alert">
              <Info size={16} className="alert-icon" />
              <span>Driver will arrive within your chosen 2-hour window.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Step Navigation Actions */}
      <div className="step-footer-actions">
        <button
          className="btn btn-outline-teal step-back-btn"
          onClick={() => setCurrentStep(2)}
        >
          <ArrowLeft size={17} />
          <span>Back</span>
        </button>

        <button
          className="btn btn-teal step-next-btn"
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

        .date-pills-row {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding-bottom: 8px;
          margin-bottom: 28px;
        }

        .date-pill-btn {
          flex: 1;
          min-width: 90px;
          background: #ffffff;
          border: 1.5px solid #E2E8F0;
          border-radius: 14px;
          padding: 12px 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .date-pill-btn:hover {
          border-color: #BCEAE6;
          background: #F4FBFA;
        }

        .date-pill-btn.selected {
          border: 2px solid #0D7A75;
          background: #F4FBFA;
          box-shadow: 0 4px 12px rgba(13, 122, 117, 0.1);
        }

        .date-day-label {
          font-size: 0.75rem;
          font-weight: 500;
          color: #718096;
        }

        .date-day-val {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #1A202C;
          margin-top: 2px;
        }

        .date-pill-btn.selected .date-day-label {
          color: #0D7A75;
        }

        .date-pill-btn.selected .date-day-val {
          color: #0D7A75;
        }

        .calendar-custom-pill {
          color: #0D7A75;
          gap: 4px;
        }

        .section-mini-heading {
          font-size: 1.0625rem;
          font-weight: 700;
          color: #1A202C;
          margin-bottom: 16px;
        }

        .time-slots-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }

        .time-slot-card {
          background: #ffffff;
          border: 1.5px solid #E2E8F0;
          border-radius: 14px;
          padding: 16px 18px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .time-slot-card:hover {
          border-color: #BCEAE6;
        }

        .time-slot-card.selected {
          border: 2px solid #0D7A75;
          background: #F4FBFA;
          box-shadow: 0 4px 12px rgba(13, 122, 117, 0.08);
        }

        .time-slot-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .radio-dot {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 1.5px solid #CBD5E0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .radio-dot.checked {
          border-color: #0D7A75;
        }

        .inner-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #0D7A75;
        }

        .slot-time-text {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #1A202C;
        }

        .slot-badge {
          display: inline-block;
          font-size: 0.6875rem;
          font-weight: 600;
          color: #0D7A75;
          background: #E6F7F5;
          padding: 2px 8px;
          border-radius: 4px;
          margin-top: 2px;
        }

        .selection-mini-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 14px;
        }

        .selection-mini-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.875rem;
          color: #2D3748;
          font-weight: 600;
        }

        .mini-icon {
          color: #0D7A75;
          font-weight: 800;
        }

        .summary-divider {
          height: 1px;
          background: #EDF2F7;
          margin: 18px 0;
        }

        .pickup-location-box {
          margin-bottom: 16px;
        }

        .location-box-title {
          font-size: 0.75rem;
          font-weight: 700;
          color: #718096;
          text-transform: uppercase;
        }

        .location-box-address {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 0.875rem;
          color: #1A202C;
          font-weight: 600;
          margin-top: 6px;
          line-height: 1.4;
        }

        .text-teal {
          color: #0D7A75;
          flex-shrink: 0;
        }

        .driver-window-alert {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #EBF8F7;
          border: 1px solid #BCEAE6;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 0.75rem;
          color: #0D7A75;
          font-weight: 500;
        }

        .alert-icon {
          flex-shrink: 0;
        }

        @media (max-width: 640px) {
          .time-slots-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
