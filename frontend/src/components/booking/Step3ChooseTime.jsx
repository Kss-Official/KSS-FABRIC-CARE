import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useBooking } from '../../context/BookingContext';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight,
  Zap,
  X,
  AlertCircle
} from 'lucide-react';

export const Step3ChooseTime = () => {
  const { 
    pickupSchedule, 
    setPickupSchedule, 
    pickupDetails, 
    allServices, 
    selectedServices, 
    setSelectedServices,
    isExpressDelivery,
    setIsExpressDelivery,
    selectedItemsList = [],
    setCurrentStep 
  } = useBooking();

  const dateInputRef = useRef(null);
  const [showExpressModal, setShowExpressModal] = useState(false);
  const [attemptedDate, setAttemptedDate] = useState(null);

  // Check if current booking has Express Laundry
  const isExpressBooking = useMemo(() => {
    if (isExpressDelivery) return true;
    if (selectedServices && selectedServices.some(s => s === 'express-laundry' || String(s).toLowerCase().includes('express'))) {
      return true;
    }
    if (selectedItemsList && selectedItemsList.some(it => it.categoryId === 'express-laundry' || String(it.categoryName || '').toLowerCase().includes('express'))) {
      return true;
    }
    return false;
  }, [isExpressDelivery, selectedServices, selectedItemsList]);

  // Helper to compute calendar day difference between a YYYY-MM-DD date and today
  const getDaysDifferenceFromToday = (isoDateStr) => {
    if (!isoDateStr) return null;
    const parts = isoDateStr.split('-');
    if (parts.length !== 3) return null;
    const targetDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    targetDate.setHours(0, 0, 0, 0);

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const diffMs = targetDate.getTime() - now.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  };

  const dateOptions = useMemo(() => {
    const options = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 0; i < 5; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : days[d.getDay()];
      const dateStr = `${d.getDate()} ${months[d.getMonth()]}`;
      const isoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const full = `${dayName}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
      options.push({
        label: dayName,
        date: dateStr,
        full: full,
        isoDate: isoDate,
        dayOffset: i
      });
    }
    return options;
  }, []);

  // Earliest valid normal service date is 2 days in advance
  const earliestNormalDate = dateOptions[2] || dateOptions[0];

  // Auto-adjust default date if customer has normal services and current date is < 2 days out
  useEffect(() => {
    if (!isExpressBooking && pickupSchedule.dateValue) {
      const diff = getDaysDifferenceFromToday(pickupSchedule.dateValue);
      if (diff === null || diff < 2) {
        if (earliestNormalDate) {
          setPickupSchedule(prev => ({
            ...prev,
            dateLabel: earliestNormalDate.full,
            dateValue: earliestNormalDate.isoDate
          }));
        }
      }
    }
  }, [isExpressBooking, earliestNormalDate]);

  // Handle Date Pill Click
  const handleDateSelect = (opt) => {
    // Normal services rule: only dates at least 2 days in advance are accepted
    if (!isExpressBooking && opt.dayOffset < 2) {
      setAttemptedDate(opt);
      setShowExpressModal(true);
      return;
    }

    setPickupSchedule(prev => ({
      ...prev,
      dateLabel: opt.full,
      dateValue: opt.isoDate
    }));
  };

  // Handle Custom Calendar Date Change
  const handleCustomDateChange = (e) => {
    const val = e.target.value;
    if (!val) return;
    const diff = getDaysDifferenceFromToday(val);
    const d = new Date(val + 'T00:00:00');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const label = `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;

    if (!isExpressBooking && diff !== null && diff < 2) {
      setAttemptedDate({
        label: diff === 1 ? 'Tomorrow' : diff === 0 ? 'Today' : 'Selected Date',
        date: `${d.getDate()} ${months[d.getMonth()]}`,
        full: label,
        isoDate: val,
        dayOffset: diff
      });
      setShowExpressModal(true);
      if (dateInputRef.current) {
        dateInputRef.current.value = pickupSchedule.dateValue || '';
      }
      return;
    }

    setPickupSchedule(prev => ({ ...prev, dateLabel: label, dateValue: val }));
  };

  // Min selectable date for calendar input
  const minCalendarDate = useMemo(() => {
    if (isExpressBooking) {
      return dateOptions[1]?.isoDate || new Date().toISOString().split('T')[0];
    }
    return dateOptions[2]?.isoDate || new Date().toISOString().split('T')[0];
  }, [isExpressBooking, dateOptions]);

  // Handle Next Navigation with strict validation
  const handleProceedNext = () => {
    if (!pickupSchedule.dateLabel || !pickupSchedule.timeSlot) return;
    const diff = getDaysDifferenceFromToday(pickupSchedule.dateValue);
    if (!isExpressBooking && diff !== null && diff < 2) {
      setAttemptedDate({
        label: diff === 1 ? 'Tomorrow' : 'Selected Date',
        full: pickupSchedule.dateLabel,
        isoDate: pickupSchedule.dateValue,
        dayOffset: diff
      });
      setShowExpressModal(true);
      return;
    }
    setCurrentStep(4);
  };

  // Modal Action: Switch to Express Laundry (enables next-day booking)
  const handleUpgradeToExpress = () => {
    if (typeof setIsExpressDelivery === 'function') {
      setIsExpressDelivery(true);
    }
    if (typeof setSelectedServices === 'function') {
      setSelectedServices(prev => {
        if (prev.includes('express-laundry')) return prev;
        return [...prev, 'express-laundry'];
      });
    }
    const tomorrowOpt = dateOptions[1];
    if (tomorrowOpt) {
      setPickupSchedule(prev => ({
        ...prev,
        dateLabel: tomorrowOpt.full,
        dateValue: tomorrowOpt.isoDate
      }));
    }
    setShowExpressModal(false);
  };

  // Modal Action: Keep Normal Service (auto-selects 2 days in advance)
  const handleKeepNormalService = () => {
    if (earliestNormalDate) {
      setPickupSchedule(prev => ({
        ...prev,
        dateLabel: earliestNormalDate.full,
        dateValue: earliestNormalDate.isoDate
      }));
    }
    setShowExpressModal(false);
  };

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
      case 'express-laundry':
        return (
          <Zap size={22} className="text-amber-500" />
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
        {/* Left: Single Parent Card enclosing Header, Rule Notice, Date Chips, Time Slots Grid, and Pagination */}
        <div className="time-parent-card">
          <div className="step-header">
            <span className="step-count">03 / 04</span>
            <h2 className="step-title">Choose pickup time</h2>
            <p className="step-subtitle">Select a convenient date and time for pickup</p>
          </div>

          <div className="time-picker-body">
            {/* Service Advance Booking Notice Banner */}
            {!isExpressBooking ? (
              <div className="booking-service-rule-banner normal-rule">
                <Clock size={16} className="rule-banner-icon text-teal" />
                <div className="rule-banner-text">
                  <span><strong>Normal Services:</strong> Pickups can only be booked <strong>at least two days in advance</strong> (from {earliestNormalDate?.date}).</span>
                  <button 
                    type="button" 
                    className="rule-banner-upgrade-btn"
                    onClick={() => {
                      setAttemptedDate(dateOptions[1]);
                      setShowExpressModal(true);
                    }}
                  >
                    Need urgent washing? Choose Express ⚡
                  </button>
                </div>
              </div>
            ) : (
              <div className="booking-service-rule-banner express-rule">
                <Zap size={16} className="rule-banner-icon text-amber-500" />
                <div className="rule-banner-text">
                  <span><strong>Express Laundry Active:</strong> Superfast priority turnaround! <strong>Next-day pickup</strong> is available ({dateOptions[1]?.label}, {dateOptions[1]?.date}).</span>
                </div>
              </div>
            )}

            {/* Date Selector Row */}
            <div className="date-pills-row">
              {dateOptions.map((opt) => {
                const isSelected = pickupSchedule.dateLabel === opt.full || pickupSchedule.dateValue === opt.isoDate;
                const isWithinTwoDays = opt.dayOffset < 2;
                const isNextDay = opt.dayOffset === 1;

                return (
                  <button
                    key={opt.isoDate}
                    type="button"
                    className={`date-pill-btn ${isSelected ? 'selected' : ''} ${!isExpressBooking && isWithinTwoDays ? 'rule-restricted' : ''}`}
                    onClick={() => handleDateSelect(opt)}
                    title={!isExpressBooking && isWithinTwoDays ? 'Express Laundry required for urgent/next-day pickup' : opt.full}
                  >
                    <div className="date-pill-top">
                      <span className="date-day-label">{opt.label}</span>
                      {!isExpressBooking && isWithinTwoDays && (
                        <span className="date-pill-rule-badge" title="Express Laundry required">⚡ Express</span>
                      )}
                      {isExpressBooking && isNextDay && (
                        <span className="date-pill-rule-badge express-ok" title="Next-day pickup available">Next-Day</span>
                      )}
                    </div>
                    <span className="date-day-val">{opt.date}</span>
                  </button>
                );
              })}

              <button 
                type="button" 
                className={`date-pill-btn calendar-custom-pill ${pickupSchedule.dateValue && !dateOptions.some(o => o.isoDate === pickupSchedule.dateValue) ? 'selected' : ''}`}
                onClick={() => {
                  if (dateInputRef.current) {
                    if (typeof dateInputRef.current.showPicker === 'function') {
                      dateInputRef.current.showPicker();
                    } else {
                      dateInputRef.current.click();
                    }
                  }
                }}
              >
                <div className="pick-date-inner">
                  <Calendar size={16} className="calendar-icon" />
                  <span className="date-day-val pick-text">
                    {pickupSchedule.dateValue && !dateOptions.some(o => o.isoDate === pickupSchedule.dateValue)
                      ? pickupSchedule.dateValue
                      : 'Pick a date'}
                  </span>
                </div>
                <input
                  ref={dateInputRef}
                  type="date"
                  min={minCalendarDate}
                  style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
                  onChange={handleCustomDateChange}
                />
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
              onClick={handleProceedNext}
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
          onClick={handleProceedNext}
          disabled={!pickupSchedule.dateLabel || !pickupSchedule.timeSlot}
        >
          <span>Next</span>
          <ArrowRight size={17} />
        </button>
      </div>

      {/* Express Laundry Recommendation Popup Modal */}
      {showExpressModal && (
        <div className="express-modal-overlay" onClick={() => setShowExpressModal(false)}>
          <div className="express-modal-card animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <button 
              type="button" 
              className="express-modal-close-btn"
              onClick={() => setShowExpressModal(false)}
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            <div className="express-modal-icon-badge">
              <Zap size={28} />
            </div>

            <div className="express-modal-tag">
              <span>Booking Rule Notice</span>
            </div>

            <h3 className="express-modal-title">
              Urgent Laundry Pickup Needed?
            </h3>

            <p className="express-modal-description">
              You selected <strong>{attemptedDate?.label || 'Tomorrow'} ({attemptedDate?.date || attemptedDate?.full || 'next-day'})</strong> for normal laundry service.
            </p>

            <p className="express-modal-subtext">
              <strong>Normal services</strong> can only be booked for dates at least <strong>two days in advance</strong> (earliest available: <strong>{earliestNormalDate?.full}</strong>).
              <br />
              If you need your clothes washed urgently, please choose <strong>Express Laundry</strong> to schedule next-day pickup!
            </p>

            <div className="express-comparison-box">
              <div className="comparison-col express-col">
                <div className="comparison-badge express-tag">
                  <Zap size={13} />
                  <span>Express Laundry</span>
                </div>
                <div className="comparison-text">
                  <strong>Next-Day Pickup</strong>
                  <span>Superfast 24-hr turnaround</span>
                </div>
              </div>

              <div className="comparison-divider" />

              <div className="comparison-col normal-col">
                <div className="comparison-badge normal-tag">
                  <Clock size={13} />
                  <span>Normal Services</span>
                </div>
                <div className="comparison-text">
                  <strong>2+ Days Advance</strong>
                  <span>Standard 48-hr turnaround</span>
                </div>
              </div>
            </div>

            <div className="express-modal-actions">
              <button
                type="button"
                className="btn-upgrade-express"
                onClick={handleUpgradeToExpress}
              >
                <Zap size={16} />
                <span>Switch to Express Laundry (Next-Day)</span>
              </button>

              <button
                type="button"
                className="btn-keep-normal"
                onClick={handleKeepNormalService}
              >
                <Calendar size={15} />
                <span>Book for {earliestNormalDate?.label} ({earliestNormalDate?.date})</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
          margin-bottom: 18px;
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

        /* Service Advance Booking Notice Banner */
        .booking-service-rule-banner {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 12px;
          margin-bottom: 18px;
          font-size: 0.8125rem;
          line-height: 1.45;
        }

        .booking-service-rule-banner.normal-rule {
          background: #F0FDFA;
          border: 1px solid #CCFBF1;
          color: #0F766E;
        }

        .booking-service-rule-banner.express-rule {
          background: #FFFBEB;
          border: 1px solid #FDE68A;
          color: #B45309;
        }

        .rule-banner-icon {
          flex-shrink: 0;
        }

        .rule-banner-text {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          width: 100%;
        }

        .rule-banner-upgrade-btn {
          background: #0D7A75;
          color: #ffffff;
          border: none;
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.15s ease;
        }

        .rule-banner-upgrade-btn:hover {
          background: #095F5B;
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
          padding: 10px 4px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .date-pill-btn:hover {
          border-color: #0D7A75;
          background: #F4FBFA;
        }

        .date-pill-btn.selected {
          border: 2px solid #0D7A75;
          background: #F4FBFA;
        }

        .date-pill-top {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
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

        .date-pill-rule-badge {
          font-size: 0.625rem;
          font-weight: 700;
          padding: 1px 5px;
          border-radius: 999px;
          background: #FEF3C7;
          color: #D97706;
          border: 1px solid #FDE68A;
          white-space: nowrap;
          line-height: 1.2;
        }

        .date-pill-rule-badge.express-ok {
          background: #E8FAF6;
          color: #0D7A75;
          border-color: #BCEAE6;
        }

        .date-pill-btn.rule-restricted {
          border-color: #FED7AA;
          background: #FFFDF9;
        }

        .date-pill-btn.rule-restricted:hover {
          border-color: #F97316;
          background: #FFF7ED;
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

        /* Express Recommendation Modal */
        .express-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
          animation: modalFadeIn 0.2s ease-out;
        }

        .express-modal-card {
          background: #ffffff;
          border-radius: 20px;
          max-width: 480px;
          width: 100%;
          padding: 28px 24px 22px;
          position: relative;
          box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25);
          border: 1px solid #E2E8F0;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          animation: modalScaleIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          box-sizing: border-box;
        }

        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes modalScaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        .express-modal-close-btn {
          position: absolute;
          top: 14px;
          right: 14px;
          background: #F1F5F9;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748B;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .express-modal-close-btn:hover {
          background: #E2E8F0;
          color: #0F172A;
        }

        .express-modal-icon-badge {
          width: 54px;
          height: 54px;
          border-radius: 16px;
          background: #FFFBEB;
          border: 1.5px solid #FDE68A;
          color: #D97706;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
          box-shadow: 0 4px 14px rgba(217, 119, 6, 0.15);
        }

        .express-modal-tag {
          background: #FEF3C7;
          color: #B45309;
          border: 1px solid #FDE68A;
          padding: 3px 12px;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.03em;
          margin-bottom: 10px;
          text-transform: uppercase;
        }

        .express-modal-title {
          font-size: 1.3rem;
          font-weight: 800;
          color: #0F172A;
          margin: 0 0 8px 0;
          letter-spacing: -0.015em;
          line-height: 1.3;
        }

        .express-modal-description {
          font-size: 0.875rem;
          color: #334155;
          line-height: 1.5;
          margin: 0 0 6px 0;
        }

        .express-modal-subtext {
          font-size: 0.8125rem;
          color: #64748B;
          line-height: 1.5;
          margin: 0 0 18px 0;
        }

        .express-comparison-box {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 12px;
          background: #F8FAFC;
          border: 1.5px solid #E2E8F0;
          border-radius: 14px;
          padding: 12px 14px;
          width: 100%;
          margin-bottom: 20px;
          box-sizing: border-box;
        }

        .comparison-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
        }

        .comparison-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 0.6875rem;
          font-weight: 700;
        }

        .comparison-badge.express-tag {
          background: #FFFBEB;
          color: #D97706;
          border: 1px solid #FDE68A;
        }

        .comparison-badge.normal-tag {
          background: #E8FAF6;
          color: #0D7A75;
          border: 1px solid #BCEAE6;
        }

        .comparison-text {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .comparison-text strong {
          font-size: 0.8125rem;
          color: #0F172A;
          font-weight: 700;
        }

        .comparison-text span {
          font-size: 0.72rem;
          color: #64748B;
        }

        .comparison-divider {
          width: 1px;
          height: 44px;
          background: #CBD5E1;
        }

        .express-modal-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
        }

        .btn-upgrade-express {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg, #0D7A75 0%, #08605C 100%);
          color: #ffffff;
          font-size: 0.875rem;
          font-weight: 700;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(13, 122, 117, 0.25);
          transition: all 0.2s ease;
        }

        .btn-upgrade-express:hover {
          background: linear-gradient(135deg, #0A6964 0%, #064E4B 100%);
          box-shadow: 0 6px 16px rgba(13, 122, 117, 0.35);
          transform: translateY(-1px);
        }

        .btn-keep-normal {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          height: 42px;
          border-radius: 12px;
          background: #ffffff;
          color: #475569;
          font-size: 0.8125rem;
          font-weight: 600;
          border: 1.5px solid #CBD5E1;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-keep-normal:hover {
          background: #F8FAFC;
          color: #0F172A;
          border-color: #94A3B8;
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
