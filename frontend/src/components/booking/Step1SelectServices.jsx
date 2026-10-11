import React from 'react';
import { useBooking } from '../../context/BookingContext';
import { 
  Shirt, 
  Layers, 
  Sparkles, 
  Flame, 
  Footprints, 
  BedDouble, 
  Check, 
  X, 
  ArrowRight 
} from 'lucide-react';

export const Step1SelectServices = () => {
  const { 
    allServices, 
    selectedServices, 
    toggleService, 
    clearAllServices, 
    setCurrentStep 
  } = useBooking();

  const getServiceIcon = (iconName) => {
    switch (iconName) {
      case 'Shirt': return <Shirt size={26} strokeWidth={1.8} />;
      case 'Layers': return <Layers size={26} strokeWidth={1.8} />;
      case 'Sparkles': return <Sparkles size={26} strokeWidth={1.8} />;
      case 'Flame': return <Flame size={26} strokeWidth={1.8} />;
      case 'Footprints': return <Footprints size={26} strokeWidth={1.8} />;
      case 'BedDouble': return <BedDouble size={26} strokeWidth={1.8} />;
      default: return <Shirt size={26} strokeWidth={1.8} />;
    }
  };

  const selectedItemsData = allServices.filter(s => selectedServices.includes(s.id));

  return (
    <div className="step1-container">
      <div className="step-header">
        <span className="step-count">01 / 04</span>
        <h2 className="step-title">What do you need cleaned?</h2>
        <p className="step-subtitle">Choose one or more services</p>
      </div>

      <div className="booking-layout-grid">
        {/* Left: 6 Service Cards Grid */}
        <div className="service-selection-col">
          <div className="service-cards-grid">
            {allServices.map(service => {
              const isSelected = selectedServices.includes(service.id);
              return (
                <div
                  key={service.id}
                  className={`booking-service-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleService(service.id)}
                >
                  <div className="card-top-row">
                    <div className="service-card-icon">
                      {getServiceIcon(service.icon)}
                    </div>
                    <div className={`checkbox-circle ${isSelected ? 'checked' : ''}`}>
                      {isSelected && <Check size={14} strokeWidth={3} />}
                    </div>
                  </div>

                  <div className="service-card-body">
                    <h3 className="service-card-title">{service.name}</h3>
                    <p className="service-card-desc">{service.subtitle}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Carousel / Pagination Dots */}
          <div className="step-dots-row">
            <span className="dot active"></span>
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        </div>

        {/* Right: Selected Services Sidebar */}
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
                  <Shirt size={32} className="empty-icon" />
                  <p>No services selected yet.</p>
                  <span>Select at least one service on the left to proceed.</span>
                </div>
              ) : (
                selectedItemsData.map(service => (
                  <div key={service.id} className="selected-service-chip animate-fade-in">
                    <div className="chip-left">
                      <div className="chip-icon">
                        {getServiceIcon(service.icon)}
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
        <div></div>
        <button
          className="btn btn-teal step-next-btn"
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

        .step-header {
          margin-bottom: 28px;
        }

        .step-count {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #718096;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .step-title {
          font-size: 1.875rem;
          font-weight: 800;
          color: #1A202C;
          margin-top: 4px;
        }

        .step-subtitle {
          font-size: 0.9375rem;
          color: #718096;
          margin-top: 2px;
        }

        .booking-layout-grid {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 32px;
          align-items: start;
        }

        .service-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }

        .booking-service-card {
          background: #ffffff;
          border: 1.5px solid #E2E8F0;
          border-radius: 18px;
          padding: 22px 18px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 160px;
          position: relative;
        }

        .booking-service-card:hover {
          border-color: #BCEAE6;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(13, 122, 117, 0.06);
        }

        .booking-service-card.selected {
          border: 2px solid #0D7A75;
          background: #F4FBFA;
          box-shadow: 0 6px 20px rgba(13, 122, 117, 0.08);
        }

        .card-top-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .service-card-icon {
          color: #0D7A75;
        }

        .checkbox-circle {
          width: 22px;
          height: 22px;
          border-radius: 6px;
          border: 1.5px solid #CBD5E0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .checkbox-circle.checked {
          background: #0D7A75;
          border-color: #0D7A75;
          color: #ffffff;
        }

        .service-card-title {
          font-size: 1.0625rem;
          font-weight: 700;
          color: #1A202C;
          margin-bottom: 4px;
        }

        .service-card-desc {
          font-size: 0.8125rem;
          color: #718096;
          line-height: 1.4;
        }

        .step-dots-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 24px;
        }

        .step-dots-row .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #E2E8F0;
        }

        .step-dots-row .dot.active {
          background: #0D7A75;
          width: 20px;
          border-radius: 10px;
        }

        .sidebar-card {
          background: #ffffff;
          border: 1.5px solid #E2E8F0;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 18px;
          padding-bottom: 12px;
          border-bottom: 1px solid #EDF2F7;
        }

        .sidebar-title {
          font-size: 1.0625rem;
          font-weight: 700;
          color: #1A202C;
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
          gap: 10px;
          min-height: 160px;
        }

        .empty-sidebar-msg {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 28px 12px;
          color: #A0AEC0;
        }

        .empty-icon {
          margin-bottom: 10px;
          opacity: 0.6;
        }

        .empty-sidebar-msg p {
          font-weight: 600;
          color: #718096;
          font-size: 0.9375rem;
        }

        .empty-sidebar-msg span {
          font-size: 0.75rem;
          margin-top: 4px;
        }

        .selected-service-chip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #FAFCFC;
          border: 1.5px solid #E6EEF0;
          border-radius: 14px;
          padding: 12px 16px;
        }

        .chip-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .chip-icon {
          color: #0D7A75;
          display: flex;
        }

        .chip-name {
          font-weight: 600;
          font-size: 0.9375rem;
          color: #1A202C;
        }

        .chip-remove-btn {
          background: none;
          border: none;
          color: #A0AEC0;
          cursor: pointer;
          padding: 4px;
          display: flex;
          transition: color 0.15s;
        }

        .chip-remove-btn:hover {
          color: #E53E3E;
        }

        .step-footer-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 36px;
          padding-top: 20px;
          border-top: 1px solid #EDF2F7;
        }

        .step-next-btn {
          padding: 12px 32px;
        }

        @media (max-width: 900px) {
          .booking-layout-grid {
            grid-template-columns: 1fr;
          }
          .service-cards-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 520px) {
          .service-cards-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
