import React from 'react';
import { useBooking } from '../../context/BookingContext';
import { 
  Check, 
  X, 
  ArrowRight,
  ChevronRight 
} from 'lucide-react';

export const Step1SelectServices = () => {
  const { 
    allServices, 
    selectedServices, 
    toggleService, 
    clearAllServices, 
    setCurrentStep 
  } = useBooking();

  const renderServiceIcon = (id) => {
    switch (id) {
      case 'wash-fold':
        return (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
          </svg>
        );
      case 'wash-iron':
        return (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M7 6.5h10" />
            <path d="M5 10.5h14" />
            <path d="M5 14.5h14" />
            <path d="M7 18.5h10" />
          </svg>
        );
      case 'dry-cleaning':
        return (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3a2.5 2.5 0 0 0-2.5 2.5c0 1 .6 1.8 1.5 2.2V9L3.5 15.2A2 2 0 0 0 4.7 18.5H19.3a2 2 0 0 0 1.2-3.3L13 9V7.7a2.5 2.5 0 0 0 1.5-2.2A2.5 2.5 0 0 0 12 3z" />
            <path d="M7.5 15.5h9" />
          </svg>
        );
      case 'steam-iron':
        return (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 17h16a1 1 0 0 0 1-1c0-4-3-6-7-6H9a5 5 0 0 0-5 5v2z" />
            <path d="M9 10V6h7v4" />
          </svg>
        );
      case 'shoe-laundry':
        return (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3.5 15.5h17a1 1 0 0 1 1 1v1a1.5 1.5 0 0 1-1.5 1.5h-16A1.5 1.5 0 0 1 2.5 17.5v-1a1 1 0 0 1 1-1z" />
            <path d="M5 15.5c.5-2.5 2-4.5 5-5.5l4 .5 4 3 3 2" />
            <path d="M10 10.5 8 9" />
          </svg>
        );
      case 'home-care':
        return (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="5" width="16" height="3" rx="1.5" />
            <rect x="4" y="10.5" width="16" height="3" rx="1.5" />
            <rect x="4" y="16" width="16" height="3" rx="1.5" />
          </svg>
        );
      default:
        return (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
          </svg>
        );
    }
  };

  const selectedItemsData = allServices.filter(s => selectedServices.includes(s.id));

  return (
    <div className="step1-container">
      <div className="booking-layout-grid">
        {/* Left: Single Parent Card enclosing Header, 3x2 Grid, and Pagination */}
        <div className="services-parent-card">
          <div className="step-header">
            <span className="step-count">01 / 04</span>
            <h2 className="step-title">What do you need cleaned?</h2>
            <p className="step-subtitle">Choose one or more services</p>
          </div>

          <div className="service-cards-grid">
            {allServices.map(service => {
              const isSelected = selectedServices.includes(service.id);
              return (
                <div
                  key={service.id}
                  className={`booking-service-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleService(service.id)}
                >
                  <div className={`checkbox-box ${isSelected ? 'checked' : ''}`}>
                    {isSelected && <Check size={13} strokeWidth={3} />}
                  </div>

                  <div className="service-card-icon">
                    {renderServiceIcon(service.id)}
                  </div>

                  <h3 className="service-card-title">{service.name}</h3>
                  <p className="service-card-desc">{service.subtitle}</p>
                </div>
              );
            })}
          </div>

          {/* Carousel / Pagination Row inside parent card */}
          <div className="card-pagination-row">
            <div className="pagination-dots">
              <span className="dot active"></span>
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
            <button className="pagination-next-circle" aria-label="Next">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Right: Selected Services Sidebar Card */}
        <div className="selected-services-sidebar">
          <div className="sidebar-card">
            <div className="sidebar-header">
              <h3 className="sidebar-title">
                Selected Services ({selectedServices.length})
              </h3>
              {selectedServices.length > 0 && (
                <button 
                  className="clear-all-btn"
                  onClick={clearAllServices}
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="sidebar-items-list">
              {selectedItemsData.length === 0 ? (
                <div className="empty-sidebar-msg">
                  <div className="empty-icon-wrap">
                    {renderServiceIcon('wash-fold')}
                  </div>
                  <p>No services selected yet.</p>
                  <span>Select at least one service on the left to proceed.</span>
                </div>
              ) : (
                selectedItemsData.map(service => (
                  <div key={service.id} className="selected-service-chip">
                    <div className="chip-left">
                      <div className="chip-icon">
                        {renderServiceIcon(service.id)}
                      </div>
                      <span className="chip-name">{service.name}</span>
                    </div>
                    <button
                      className="chip-remove-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleService(service.id);
                      }}
                      aria-label={`Remove ${service.name}`}
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Step Navigation Action */}
      <div className="step-footer-actions">
        <button
          className="btn-next-action"
          onClick={() => setCurrentStep(2)}
          disabled={selectedServices.length === 0}
        >
          <span>Next</span>
          <ArrowRight size={17} />
        </button>
      </div>

      <style>{`
        .step1-container {
          width: 100%;
        }

        .booking-layout-grid {
          display: grid;
          grid-template-columns: 1.8fr 1fr;
          gap: 24px;
          align-items: stretch;
        }

        /* Left Single Parent Card */
        .services-parent-card {
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

        /* 3x2 Grid */
        .service-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .booking-service-card {
          background: #ffffff;
          border: 1.5px solid #E2E8F0;
          border-radius: 16px;
          padding: 22px 14px 18px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          min-height: 160px;
          position: relative;
        }

        .booking-service-card:hover {
          border-color: #0D7A75;
          box-shadow: 0 4px 14px rgba(13, 122, 117, 0.06);
        }

        .booking-service-card.selected {
          border: 2px solid #0D7A75;
          background: #FAFCFB;
        }

        .checkbox-box {
          position: absolute;
          top: 14px;
          right: 14px;
          width: 20px;
          height: 20px;
          border-radius: 5px;
          border: 1.5px solid #CBD5E1;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }

        .checkbox-box.checked {
          background: #0D7A75;
          border-color: #0D7A75;
          color: #ffffff;
        }

        .service-card-icon {
          color: #0D7A75;
          margin-top: 6px;
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .service-card-title {
          font-size: 1rem;
          font-weight: 700;
          color: #0F172A;
          margin-bottom: 4px;
        }

        .service-card-desc {
          font-size: 0.775rem;
          color: #64748B;
          line-height: 1.35;
        }

        /* Pagination Row at bottom of Parent Card */
        .card-pagination-row {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          margin-top: 6px;
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
        }

        .pagination-dots .dot.active {
          width: 14px;
          height: 6px;
          border-radius: 4px;
          background: #0D7A75;
        }

        .pagination-next-circle {
          position: absolute;
          right: 0;
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

        .pagination-next-circle:hover {
          background: #E2E8F0;
        }

        /* Right Sidebar Card */
        .selected-services-sidebar {
          width: 100%;
        }

        .sidebar-card {
          background: #ffffff;
          border: 1.5px solid #E2E8F0;
          border-radius: 20px;
          padding: 22px 20px;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .sidebar-title {
          font-size: 1rem;
          font-weight: 700;
          color: #0F172A;
        }

        .clear-all-btn {
          background: none;
          border: none;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #0D7A75;
          cursor: pointer;
        }

        .clear-all-btn:hover {
          text-decoration: underline;
        }

        .sidebar-items-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
        }

        .selected-service-chip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #ffffff;
          border: 1.5px solid #E2E8F0;
          border-radius: 14px;
          padding: 14px 16px;
          transition: border-color 0.15s;
        }

        .chip-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .chip-icon {
          color: #0D7A75;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .chip-name {
          font-weight: 700;
          font-size: 0.9375rem;
          color: #0F172A;
        }

        .chip-remove-btn {
          background: none;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          padding: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.15s;
        }

        .chip-remove-btn:hover {
          color: #EF4444;
        }

        .empty-sidebar-msg {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 36px 16px;
          color: #94A3B8;
          flex: 1;
        }

        .empty-icon-wrap {
          color: #CBD5E1;
          margin-bottom: 12px;
        }

        .empty-sidebar-msg p {
          font-weight: 600;
          color: #64748B;
          font-size: 0.9375rem;
          margin-bottom: 4px;
        }

        .empty-sidebar-msg span {
          font-size: 0.775rem;
          color: #94A3B8;
          line-height: 1.4;
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
          .sidebar-card {
            min-height: auto;
          }
        }

        @media (max-width: 600px) {
          .service-cards-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
