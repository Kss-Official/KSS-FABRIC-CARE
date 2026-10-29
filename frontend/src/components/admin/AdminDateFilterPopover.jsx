import React, { useState, useEffect } from 'react';
import { Calendar, Check, X } from 'lucide-react';
import { parseFlexibleDate, toLocalIsoDate } from '../../utils/dateFilterUtils';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Sanitizes any date string so the year portion never exceeds 4 digits
const sanitizeDateYear = (val) => {
  if (!val || typeof val !== 'string') return '';
  const parts = val.split('-');
  if (parts.length === 3) {
    let [year, month, day] = parts;
    if (year && year.length > 4) {
      year = year.slice(0, 4);
      return `${year}-${month}-${day}`;
    }
  }
  return val;
};

export const AdminDateFilterPopover = ({
  isOpen,
  onClose,
  value,
  onChange,
  allLabel = 'All Dates',
  align = 'left'
}) => {
  if (!isOpen) return null;

  // Determine initial active tab based on current value
  const getInitialTab = () => {
    if (!value || value === 'all' || value === 'all-time') return 'quick';
    if (typeof value === 'object') {
      if (value.type === 'range' || value.start || value.end) return 'range';
      if (value.type === 'specific' || value.date) return 'date';
      if (value.type === 'month' || value.month !== undefined || value.monthYear) return 'month';
    }
    if (typeof value === 'string') {
      if (value.match(/^\d{4}-\d{1,2}$/)) return 'month';
      if (value.match(/^\d{4}-\d{2}-\d{2}$/)) return 'date';
    }
    return 'quick';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  // Local states for inputs
  const [rangeStart, setRangeStart] = useState(() => {
    if (typeof value === 'object' && value && (value.start || value.startDate)) {
      return sanitizeDateYear(toLocalIsoDate(parseFlexibleDate(value.start || value.startDate)));
    }
    return '';
  });

  const [rangeEnd, setRangeEnd] = useState(() => {
    if (typeof value === 'object' && value && (value.end || value.endDate)) {
      return sanitizeDateYear(toLocalIsoDate(parseFlexibleDate(value.end || value.endDate)));
    }
    return '';
  });

  const [singleDate, setSingleDate] = useState(() => {
    if (typeof value === 'object' && value && value.date) {
      return sanitizeDateYear(toLocalIsoDate(parseFlexibleDate(value.date)));
    }
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return sanitizeDateYear(value);
    }
    return sanitizeDateYear(toLocalIsoDate(new Date()));
  });

  const [selectedMonth, setSelectedMonth] = useState(() => {
    if (typeof value === 'object' && value && value.month !== undefined) {
      return parseInt(value.month, 10);
    }
    if (typeof value === 'string') {
      const m = value.match(/^\d{4}-(\d{1,2})$/);
      if (m) return parseInt(m[1], 10);
    }
    return new Date().getMonth() + 1; // 1-12
  });

  const [selectedYear, setSelectedYear] = useState(() => {
    if (typeof value === 'object' && value && value.year) {
      return String(value.year).slice(0, 4);
    }
    if (typeof value === 'string') {
      const m = value.match(/^(\d{4})-\d{1,2}$/);
      if (m) return String(m[1]).slice(0, 4);
    }
    return String(Math.max(new Date().getFullYear(), 2026));
  });

  // Keep local inputs in sync when value changes from outside
  useEffect(() => {
    setActiveTab(getInitialTab());
    if (typeof value === 'object' && value) {
      if (value.start) setRangeStart(sanitizeDateYear(toLocalIsoDate(parseFlexibleDate(value.start))));
      if (value.end) setRangeEnd(sanitizeDateYear(toLocalIsoDate(parseFlexibleDate(value.end))));
      if (value.date) setSingleDate(sanitizeDateYear(toLocalIsoDate(parseFlexibleDate(value.date))));
      if (value.month !== undefined) setSelectedMonth(parseInt(value.month, 10));
      if (value.year) setSelectedYear(String(value.year).slice(0, 4));
      else if (value.monthYear) {
        const m = String(value.monthYear).match(/^(\d{4})-\d{1,2}$/);
        if (m) setSelectedYear(String(m[1]).slice(0, 4));
      }
    }
  }, [value]);

  // Handler to enforce max 4 digits in year for HTML5 date inputs
  const handleDateInputChange = (e, setter) => {
    let val = e.target.value;
    if (val) {
      const parts = val.split('-');
      if (parts.length === 3 && parts[0] && parts[0].length > 4) {
        val = `${parts[0].slice(0, 4)}-${parts[1]}-${parts[2]}`;
        e.target.value = val;
      }
    }
    setter(val);
  };

  const handleDateBlur = (e, setter) => {
    let val = e.target.value;
    if (val) {
      const parts = val.split('-');
      if (parts.length === 3 && parts[0] && parts[0].length > 4) {
        val = `${parts[0].slice(0, 4)}-${parts[1]}-${parts[2]}`;
        e.target.value = val;
        setter(val);
      }
    }
  };

  const handleApplyQuick = (key) => {
    onChange(key);
    onClose();
  };

  const handleApplyRange = (e) => {
    e.preventDefault();
    let start = sanitizeDateYear(rangeStart);
    let end = sanitizeDateYear(rangeEnd);
    if (!start && !end) return;
    
    // Sort dates if start > end
    if (start && end && start > end) {
      const temp = start;
      start = end;
      end = temp;
    }

    onChange({
      type: 'range',
      start: start || null,
      end: end || null
    });
    onClose();
  };

  const handleApplyDate = (e) => {
    e.preventDefault();
    const date = sanitizeDateYear(singleDate);
    if (!date) return;
    onChange({
      type: 'specific',
      date
    });
    onClose();
  };

  const handleApplyMonth = (e) => {
    e.preventDefault();
    const currentYr = new Date().getFullYear();
    let yr = parseInt(selectedYear, 10);
    if (isNaN(yr) || yr < 1000) {
      yr = currentYr;
    }
    if (yr > 9999) {
      yr = 9999;
    }
    onChange({
      type: 'month',
      year: yr,
      month: parseInt(selectedMonth, 10),
      monthYear: `${yr}-${String(selectedMonth).padStart(2, '0')}`
    });
    onClose();
  };

  const handleReset = () => {
    onChange('all');
    onClose();
  };

  const isCurrentActive = (key) => {
    if (key === 'all') return !value || value === 'all' || value === 'all-time';
    return value === key;
  };

  // Generate Year options: 2026 and all previous years (descending)
  const currentYr = Math.max(new Date().getFullYear(), 2026);
  const yearOptions = [];
  for (let yr = currentYr; yr >= 2010; yr--) {
    yearOptions.push(yr);
  }
  if (selectedYear && !yearOptions.includes(Number(selectedYear))) {
    yearOptions.push(Number(selectedYear));
    yearOptions.sort((a, b) => b - a);
  }

  return (
    <div 
      className={`admin-date-filter-popover-card ${align === 'right' ? 'align-right' : 'align-left'}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top Segmented Tabs */}
      <div className="filter-popover-tabs-header">
        <button
          type="button"
          className={`filter-tab-btn ${activeTab === 'quick' ? 'active' : ''}`}
          onClick={() => setActiveTab('quick')}
        >
          Quick
        </button>
        <button
          type="button"
          className={`filter-tab-btn ${activeTab === 'range' ? 'active' : ''}`}
          onClick={() => setActiveTab('range')}
        >
          Date Range
        </button>
        <button
          type="button"
          className={`filter-tab-btn ${activeTab === 'date' ? 'active' : ''}`}
          onClick={() => setActiveTab('date')}
        >
          Specific Date
        </button>
        <button
          type="button"
          className={`filter-tab-btn ${activeTab === 'month' ? 'active' : ''}`}
          onClick={() => setActiveTab('month')}
        >
          Month & Year
        </button>
      </div>

      {/* Tab 1: Quick Presets */}
      {activeTab === 'quick' && (
        <div className="filter-tab-panel quick-panel">
          {[
            { key: 'all', label: allLabel },
            { key: 'today', label: 'Today' },
            { key: 'yesterday', label: 'Yesterday' },
            { key: 'last-week', label: 'Last Week' },
            { key: 'last-30', label: 'Last 30 Days' }
          ].map(opt => (
            <button
              key={opt.key}
              type="button"
              className={`popover-option-item ${isCurrentActive(opt.key) ? 'active' : ''}`}
              onClick={() => handleApplyQuick(opt.key)}
            >
              <span>{opt.label}</span>
              {isCurrentActive(opt.key) && <Check size={14} className="active-check-icon" />}
            </button>
          ))}
        </div>
      )}

      {/* Tab 2: Custom Date Range */}
      {activeTab === 'range' && (
        <form className="filter-tab-panel custom-form-panel" onSubmit={handleApplyRange}>
          <div className="form-group-field">
            <label className="field-label">From Date (Start)</label>
            <input 
              type="date"
              className="styled-date-input"
              value={rangeStart}
              min="1000-01-01"
              max={rangeEnd && rangeEnd <= '9999-12-31' ? rangeEnd : '9999-12-31'}
              onInput={(e) => handleDateInputChange(e, setRangeStart)}
              onChange={(e) => handleDateInputChange(e, setRangeStart)}
              onBlur={(e) => handleDateBlur(e, setRangeStart)}
            />
          </div>
          <div className="form-group-field">
            <label className="field-label">To Date (End)</label>
            <input 
              type="date"
              className="styled-date-input"
              value={rangeEnd}
              min={rangeStart && rangeStart >= '1000-01-01' ? rangeStart : '1000-01-01'}
              max="9999-12-31"
              onInput={(e) => handleDateInputChange(e, setRangeEnd)}
              onChange={(e) => handleDateInputChange(e, setRangeEnd)}
              onBlur={(e) => handleDateBlur(e, setRangeEnd)}
            />
          </div>
          <div className="form-actions-row">
            <button
              type="submit"
              className="apply-filter-btn"
              disabled={!rangeStart && !rangeEnd}
            >
              Apply Date Range
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Specific Single Date */}
      {activeTab === 'date' && (
        <form className="filter-tab-panel custom-form-panel" onSubmit={handleApplyDate}>
          <div className="form-group-field">
            <label className="field-label">Select Specific Date</label>
            <input 
              type="date"
              className="styled-date-input"
              value={singleDate}
              min="1000-01-01"
              max="9999-12-31"
              onInput={(e) => handleDateInputChange(e, setSingleDate)}
              onChange={(e) => handleDateInputChange(e, setSingleDate)}
              onBlur={(e) => handleDateBlur(e, setSingleDate)}
              required
            />
          </div>
          <div className="form-actions-row">
            <button
              type="submit"
              className="apply-filter-btn"
              disabled={!singleDate}
            >
              Apply Specific Date
            </button>
          </div>
        </form>
      )}

      {/* Tab 4: Particular Month & Year */}
      {activeTab === 'month' && (
        <form className="filter-tab-panel custom-form-panel" onSubmit={handleApplyMonth}>
          <div className="month-year-grid">
            <div className="form-group-field">
              <label className="field-label">Month</label>
              <select
                className="styled-select-input"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group-field">
              <label className="field-label">Year</label>
              <select
                className="styled-select-input"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {yearOptions.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-actions-row">
            <button
              type="submit"
              className="apply-filter-btn"
              disabled={!selectedYear}
            >
              Apply Month & Year
            </button>
          </div>
        </form>
      )}

      {/* Reset Footer when any filter is active */}
      {value && value !== 'all' && value !== 'all-time' && (
        <div className="filter-popover-footer">
          <button
            type="button"
            className="clear-filter-link-btn"
            onClick={handleReset}
          >
            <X size={13} />
            <span>Reset to {allLabel}</span>
          </button>
        </div>
      )}

      {/* Scoped CSS */}
      <style>{`
        .admin-date-filter-popover-card {
          position: absolute;
          top: calc(100% + 6px);
          width: 310px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
          padding: 8px;
          z-index: 100;
          display: flex;
          flex-direction: column;
          gap: 6px;
          box-sizing: border-box;
          animation: popoverFadeIn 0.15s ease-out;
          text-align: left;
        }

        .admin-date-filter-popover-card.align-left {
          left: 0;
          right: auto;
        }

        .admin-date-filter-popover-card.align-right {
          right: 0;
          left: auto;
        }

        @keyframes popoverFadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* Segmented Tabs */
        .filter-popover-tabs-header {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          background: #F1F5F9;
          border-radius: 9px;
          padding: 3px;
          gap: 2px;
        }

        .filter-tab-btn {
          background: transparent;
          border: none;
          border-radius: 7px;
          padding: 6px 2px;
          font-size: 0.6875rem;
          font-weight: 600;
          color: #64748B;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: center;
          white-space: nowrap;
          line-height: 1.2;
        }

        .filter-tab-btn:hover {
          color: #0F172A;
        }

        .filter-tab-btn.active {
          background: #FFFFFF;
          color: #087F77;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }

        /* Tab Panels */
        .filter-tab-panel {
          display: flex;
          flex-direction: column;
          gap: 3px;
          padding: 4px 2px 2px;
        }

        .quick-panel {
          gap: 2px;
        }

        .popover-option-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 8px 12px;
          border: none;
          background: transparent;
          border-radius: 8px;
          font-size: 0.8125rem;
          font-weight: 500;
          color: #334155;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
        }

        .popover-option-item:hover {
          background: #F8FAFC;
          color: #0F172A;
        }

        .popover-option-item.active {
          background: #E6F7F7;
          color: #087F77;
          font-weight: 600;
        }

        .active-check-icon {
          color: #087F77;
          flex-shrink: 0;
        }

        /* Custom Form Panels */
        .custom-form-panel {
          gap: 10px;
          padding: 8px 4px 4px;
        }

        .form-group-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .field-label {
          font-size: 0.725rem;
          font-weight: 600;
          color: #64748B;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .styled-date-input,
        .styled-select-input {
          width: 100%;
          height: 36px;
          padding: 0 10px;
          border: 1.5px solid #E2E8F0;
          border-radius: 8px;
          font-size: 0.8125rem;
          font-weight: 500;
          color: #1E293B;
          background: #FFFFFF;
          box-sizing: border-box;
          outline: none;
          transition: border-color 0.15s ease;
          font-family: inherit;
        }

        .styled-date-input:focus,
        .styled-select-input:focus {
          border-color: #087F77;
        }

        .month-year-grid {
          display: grid;
          grid-template-columns: 1.25fr 1fr;
          gap: 8px;
        }

        .quick-years-row {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 2px;
          flex-wrap: wrap;
        }

        .quick-year-chip {
          background: #F1F5F9;
          border: 1px solid #E2E8F0;
          color: #475569;
          font-size: 0.6875rem;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .quick-year-chip:hover {
          background: #E2E8F0;
          color: #0F172A;
        }

        .quick-year-chip.active {
          background: #E6F7F7;
          border-color: #087F77;
          color: #087F77;
        }

        .form-actions-row {
          margin-top: 4px;
        }

        .apply-filter-btn {
          width: 100%;
          height: 36px;
          background: #087F77;
          color: #FFFFFF;
          border: none;
          border-radius: 8px;
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .apply-filter-btn:hover:not(:disabled) {
          background: #066761;
        }

        .apply-filter-btn:disabled {
          background: #CBD5E1;
          cursor: not-allowed;
          opacity: 0.7;
        }

        /* Footer */
        .filter-popover-footer {
          border-top: 1px solid #F1F5F9;
          padding-top: 6px;
          margin-top: 4px;
          display: flex;
          justify-content: center;
        }

        .clear-filter-link-btn {
          background: transparent;
          border: none;
          color: #DC2626;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 6px;
          transition: background-color 0.15s ease;
        }

        .clear-filter-link-btn:hover {
          background: #FEF2F2;
        }
      `}</style>
    </div>
  );
};
