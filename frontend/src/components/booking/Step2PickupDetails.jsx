import React, { useState } from 'react';
import { useBooking } from '../../context/BookingContext';
import { 
  Phone, 
  MapPin, 
  Home, 
  Crosshair, 
  Truck, 
  ShieldCheck, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight 
} from 'lucide-react';

export const Step2PickupDetails = () => {
  const { 
    pickupDetails, 
    setPickupDetails, 
    setCurrentStep 
  } = useBooking();

  const [showLandmark, setShowLandmark] = useState(Boolean(pickupDetails.landmark));

  const handleToggleDeliveryAddress = () => {
    setPickupDetails(prev => ({
      ...prev,
      sameAddressDelivery: !prev.sameAddressDelivery
    }));
  };

  const handleUseCurrentLocation = () => {
    setPickupDetails(prev => ({
      ...prev,
      address: 'Banaswadi, Bengaluru - 560043'
    }));
  };

  return (
    <div className="step2-container animate-fade-in">
      <div className="booking-layout-grid">
        {/* Left: Single Parent Card enclosing Header, Fields, and Pagination */}
        <div className="pickup-parent-card">
          <div className="step-header">
            <span className="step-count">02 / 04</span>
            <h2 className="step-title">Pickup details</h2>
            <p className="step-subtitle">Tell us where to pick up your laundry</p>
          </div>

          <div className="form-fields-container">
            {/* Mobile Number Field */}
            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <div className="input-with-icon">
                <span className="input-icon left-icon">
                  <Phone size={18} strokeWidth={1.8} />
                </span>
                <input
                  type="tel"
                  className="form-input"
                  value={pickupDetails.mobile || ''}
                  onChange={(e) => setPickupDetails({ ...pickupDetails, mobile: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>
              <p className="input-helper-text">We'll use this to share pickup updates</p>
            </div>

            {/* Pickup Address Field */}
            <div className="form-group mt-3">
              <label className="form-label">Pickup Address</label>
              <div className="input-with-icon">
                <span className="input-icon left-icon">
                  <MapPin size={18} strokeWidth={1.8} />
                </span>
                <input
                  type="text"
                  className="form-input with-right-action"
                  value={pickupDetails.address || ''}
                  onChange={(e) => setPickupDetails({ ...pickupDetails, address: e.target.value })}
                  placeholder="Banaswadi, Bengaluru - 560043"
                />
                <button
                  type="button"
                  className="gps-target-btn"
                  onClick={handleUseCurrentLocation}
                  title="Use Current Location (GPS)"
                  aria-label="Use Current Location"
                >
                  <Crosshair size={18} strokeWidth={1.8} />
                </button>
              </div>

              {/* Landmark toggle link */}
              <div className="landmark-toggle-row">
                <button
                  type="button"
                  className="add-landmark-link"
                  onClick={() => setShowLandmark(prev => !prev)}
                >
                  {showLandmark ? 'Close landmark field' : 'Add landmark (optional)'}
                </button>
              </div>

              {showLandmark && (
                <div className="landmark-field-box animate-fade-in">
                  <div className="input-with-icon">
                    <span className="input-icon left-icon">
                      <Home size={18} strokeWidth={1.8} />
                    </span>
                    <input
                      type="text"
                      className="form-input"
                      value={pickupDetails.landmark || ''}
                      onChange={(e) => setPickupDetails({ ...pickupDetails, landmark: e.target.value })}
                      placeholder="House #12, 3rd Cross, HRBR Layout"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Same address for delivery box */}
            <div className="same-address-card">
              <div className="same-address-info">
                <div className="home-icon-box">
                  <Home size={18} strokeWidth={1.8} />
                </div>
                <div>
                  <h4 className="same-address-title">Same address for delivery</h4>
                  <p className="same-address-sub">We'll deliver back to this address after cleaning.</p>
                </div>
              </div>

              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={pickupDetails.sameAddressDelivery}
                  onChange={handleToggleDeliveryAddress}
                />
                <span className="toggle-slider round"></span>
              </label>
            </div>
          </div>

          {/* Carousel / Pagination Row inside parent card */}
          <div className="card-pagination-row">
            <button
              className="pagination-circle-btn"
              onClick={() => setCurrentStep(1)}
              aria-label="Previous step"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="pagination-dots">
              <span className="dot" onClick={() => setCurrentStep(1)}></span>
              <span className="dot active"></span>
              <span className="dot" onClick={() => setCurrentStep(3)}></span>
              <span className="dot" onClick={() => setCurrentStep(4)}></span>
            </div>

            <button
              className="pagination-circle-btn"
              onClick={() => setCurrentStep(3)}
              aria-label="Next step"
              disabled={!pickupDetails.mobile || !pickupDetails.address}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Right: Map Graphic & Trust Assurance Card */}
        <div className="trust-side-card">
          <div className="folded-map-illustration">
            <img 
              src="/assets/folded-map.png" 
              alt="Pickup Location Map" 
              className="folded-map-img" 
            />
          </div>

          <div className="trust-card-body">
            <h3 className="trust-card-title">Don't worry!</h3>
            <div className="trust-items-list">
              <div className="trust-item">
                <Truck size={20} className="trust-item-icon" strokeWidth={1.8} />
                <span className="trust-item-text">Free pickup & delivery</span>
              </div>
              <div className="trust-item">
                <ShieldCheck size={20} className="trust-item-icon" strokeWidth={1.8} />
                <span className="trust-item-text">Secure handling</span>
              </div>
              <div className="trust-item">
                <Clock size={20} className="trust-item-icon" strokeWidth={1.8} />
                <span className="trust-item-text">Real-time updates</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Step Navigation Action */}
      <div className="step-footer-actions">
        <button
          className="btn-next-action"
          onClick={() => setCurrentStep(3)}
          disabled={!pickupDetails.mobile || !pickupDetails.address}
        >
          <span>Next</span>
          <ArrowRight size={17} />
        </button>
      </div>

      <style>{`
        .step2-container {
          width: 100%;
        }

        .booking-layout-grid {
          display: grid;
          grid-template-columns: 1.8fr 1fr;
          gap: 24px;
          align-items: stretch;
        }

        /* Left Single Parent Card */
        .pickup-parent-card {
          background: #ffffff;
          border: 1.5px solid #E2E8F0;
          border-radius: 20px;
          padding: 28px 24px 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .step-header {
          margin-bottom: 20px;
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

        .form-fields-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-label {
          font-size: 0.875rem;
          font-weight: 700;
          color: #0F172A;
        }

        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .input-icon.left-icon {
          position: absolute;
          left: 14px;
          color: #0D7A75;
          display: flex;
          pointer-events: none;
          z-index: 1;
        }

        .form-input {
          width: 100%;
          padding: 12px 14px 12px 42px;
          border: 1.5px solid #E2E8F0;
          border-radius: 12px;
          font-size: 0.9375rem;
          color: #0F172A;
          background: #ffffff;
          outline: none;
          transition: all 0.2s;
        }

        .form-input.with-right-action {
          padding-right: 44px;
        }

        .form-input:focus {
          border-color: #0D7A75;
          box-shadow: 0 0 0 3px rgba(13, 122, 117, 0.1);
        }

        .gps-target-btn {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: #0D7A75;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          transition: transform 0.15s;
        }

        .gps-target-btn:hover {
          transform: scale(1.1);
        }

        .input-helper-text {
          font-size: 0.775rem;
          color: #64748B;
          margin-top: 4px;
        }

        .landmark-toggle-row {
          margin-top: 4px;
        }

        .add-landmark-link {
          background: none;
          border: none;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #0D7A75;
          cursor: pointer;
          padding: 2px 0;
          display: inline-block;
        }

        .add-landmark-link:hover {
          text-decoration: underline;
        }

        .landmark-field-box {
          margin-top: 8px;
        }

        /* Same address for delivery box */
        .same-address-card {
          background: #F0FDF9;
          border: 1.5px solid #CCFBF1;
          border-radius: 14px;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 10px;
        }

        .same-address-info {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .home-icon-box {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: #ffffff;
          color: #0D7A75;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 2px 6px rgba(13, 122, 117, 0.08);
        }

        .same-address-title {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #0F172A;
        }

        .same-address-sub {
          font-size: 0.775rem;
          color: #64748B;
          margin-top: 2px;
        }

        /* Toggle Switch */
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
          flex-shrink: 0;
        }

        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #CBD5E1;
          transition: 0.3s;
        }

        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.3s;
        }

        .toggle-switch input:checked + .toggle-slider {
          background-color: #0D7A75;
        }

        .toggle-switch input:checked + .toggle-slider:before {
          transform: translateX(20px);
        }

        .toggle-slider.round {
          border-radius: 34px;
        }

        .toggle-slider.round:before {
          border-radius: 50%;
        }

        /* Pagination Row at bottom of Parent Card */
        .card-pagination-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          margin-top: 28px;
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

        /* Right Trust Card */
        .trust-side-card {
          background: #F0FDF9;
          border: 1.5px solid #E2E8F0;
          border-radius: 20px;
          padding: 24px 22px;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          gap: 24px;
        }

        .folded-map-illustration {
          width: 100%;
          max-width: 320px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .folded-map-img {
          width: 100%;
          height: auto;
          max-height: 240px;
          object-fit: contain;
          display: block;
          filter: drop-shadow(0 12px 24px rgba(13, 122, 117, 0.1));
        }

        .trust-card-body {
          width: 100%;
          margin-top: 8px;
          padding-top: 0;
        }

        .trust-card-title {
          font-size: 1.125rem;
          font-weight: 800;
          color: #0F172A;
          margin-bottom: 16px;
        }

        .trust-items-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .trust-item {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .trust-item-icon {
          color: #0D7A75;
          flex-shrink: 0;
        }

        .trust-item-text {
          font-size: 0.875rem;
          font-weight: 600;
          color: #0F172A;
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
          .trust-side-card {
            padding: 24px;
          }
        }
      `}</style>
    </div>
  );
};
