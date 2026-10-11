import React from 'react';
import { useBooking } from '../../context/BookingContext';
import { 
  Phone, 
  MapPin, 
  Home, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  ShieldCheck, 
  MessageSquare,
  Navigation
} from 'lucide-react';

export const Step2PickupDetails = () => {
  const { 
    pickupDetails, 
    setPickupDetails, 
    setCurrentStep 
  } = useBooking();

  const handleToggleWhatsApp = () => {
    setPickupDetails(prev => ({
      ...prev,
      whatsappUpdates: !prev.whatsappUpdates
    }));
  };

  const handleToggleDeliveryAddress = () => {
    setPickupDetails(prev => ({
      ...prev,
      sameAddressDelivery: !prev.sameAddressDelivery
    }));
  };

  return (
    <div className="step2-container animate-fade-in">
      <div className="step-header">
        <span className="step-count">02 / 04</span>
        <h2 className="step-title">Pickup details</h2>
        <p className="step-subtitle">Tell us where to pick up your laundry</p>
      </div>

      <div className="booking-layout-grid">
        {/* Left: Input Form Card */}
        <div className="details-form-card">
          {/* Mobile Number */}
          <div className="form-group">
            <label className="form-label">Mobile Number *</label>
            <div className="input-with-icon">
              <span className="input-icon"><Phone size={18} /></span>
              <input
                type="tel"
                className="form-input"
                value={pickupDetails.mobile}
                onChange={(e) => setPickupDetails({ ...pickupDetails, mobile: e.target.value })}
                placeholder="Enter 10-digit mobile number"
              />
            </div>
            <label className="checkbox-row" onClick={handleToggleWhatsApp}>
              <input
                type="checkbox"
                checked={pickupDetails.whatsappUpdates}
                onChange={handleToggleWhatsApp}
                className="custom-checkbox"
              />
              <span className="checkbox-text">
                <MessageSquare size={14} className="text-teal" />
                Get live order updates on WhatsApp
              </span>
            </label>
          </div>

          {/* Pickup Address */}
          <div className="form-group mt-4">
            <label className="form-label">Pickup Address *</label>
            <div className="input-with-icon">
              <span className="input-icon"><MapPin size={18} /></span>
              <input
                type="text"
                className="form-input"
                value={pickupDetails.address}
                onChange={(e) => setPickupDetails({ ...pickupDetails, address: e.target.value })}
                placeholder="Area, Street, City, Pincode"
              />
            </div>
          </div>

          {/* House / Landmark */}
          <div className="form-group mt-3">
            <label className="form-label">House / Flat / Landmark</label>
            <div className="input-with-icon">
              <span className="input-icon"><Home size={18} /></span>
              <input
                type="text"
                className="form-input"
                value={pickupDetails.landmark}
                onChange={(e) => setPickupDetails({ ...pickupDetails, landmark: e.target.value })}
                placeholder="e.g. House #12, 3rd Cross, HRBR Layout"
              />
            </div>
          </div>

          {/* Quick Location helper */}
          <div className="quick-location-row">
            <button 
              type="button" 
              className="gps-btn"
              onClick={() => setPickupDetails(prev => ({ ...prev, address: 'Indiranagar 100ft Rd, Bengaluru - 560038' }))}
            >
              <Navigation size={14} />
              Use Current Location (GPS)
            </button>
          </div>

          {/* Same Address for Delivery Toggle Box */}
          <div className="same-address-box">
            <div className="same-address-left">
              <div className="home-icon-wrap">
                <Home size={18} />
              </div>
              <div>
                <h4 className="same-address-title">Same address for delivery</h4>
                <p className="same-address-sub">Drop off clean clothes back to this same location</p>
              </div>
            </div>

            <label className="switch">
              <input
                type="checkbox"
                checked={pickupDetails.sameAddressDelivery}
                onChange={handleToggleDeliveryAddress}
              />
              <span className="slider round"></span>
            </label>
          </div>
        </div>

        {/* Right: Map & Trust Assurance Card */}
        <div className="trust-assurance-card">
          <div className="map-graphic-wrap">
            <div className="map-visual">
              <div className="map-grid-lines" />
              <div className="map-pin-pulse">
                <MapPin size={38} className="map-pin-icon" />
              </div>
            </div>
          </div>

          <div className="trust-card-body">
            <h3 className="trust-title">Don't worry!</h3>
            <div className="trust-points-list">
              <div className="trust-point">
                <CheckCircle2 size={18} className="trust-check" />
                <span>Free doorstep pickup & delivery</span>
              </div>
              <div className="trust-point">
                <CheckCircle2 size={18} className="trust-check" />
                <span>Verified background-checked rider</span>
              </div>
              <div className="trust-point">
                <CheckCircle2 size={18} className="trust-check" />
                <span>Flexible free rescheduling anytime</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Step Navigation Actions */}
      <div className="step-footer-actions">
        <button
          className="btn btn-outline-teal step-back-btn"
          onClick={() => setCurrentStep(1)}
        >
          <ArrowLeft size={17} />
          <span>Back</span>
        </button>

        <button
          className="btn btn-teal step-next-btn"
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

        .details-form-card {
          background: #ffffff;
          border: 1.5px solid #E2E8F0;
          border-radius: 20px;
          padding: 28px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .mt-3 { margin-top: 14px; }
        .mt-4 { margin-top: 20px; }

        .form-label {
          font-size: 0.875rem;
          font-weight: 700;
          color: #2D3748;
        }

        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          color: #0D7A75;
          display: flex;
          pointer-events: none;
        }

        .form-input {
          width: 100%;
          padding: 13px 14px 13px 44px;
          border: 1.5px solid #E2E8F0;
          border-radius: 12px;
          font-size: 0.9375rem;
          color: #1A202C;
          background: #FAFCFC;
          transition: all 0.2s;
          outline: none;
        }

        .form-input:focus {
          border-color: #0D7A75;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(13, 122, 117, 0.12);
        }

        .checkbox-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
          cursor: pointer;
        }

        .custom-checkbox {
          accent-color: #0D7A75;
          width: 16px;
          height: 16px;
          cursor: pointer;
        }

        .checkbox-text {
          font-size: 0.8125rem;
          color: #4A5568;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .quick-location-row {
          margin-top: 10px;
        }

        .gps-btn {
          background: none;
          border: none;
          color: #0D7A75;
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 0;
        }

        .gps-btn:hover {
          text-decoration: underline;
        }

        .same-address-box {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #F4FBFA;
          border: 1.5px solid #BCEAE6;
          border-radius: 14px;
          padding: 16px 18px;
          margin-top: 24px;
        }

        .same-address-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .home-icon-wrap {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #ffffff;
          color: #0D7A75;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .same-address-title {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #1A202C;
        }

        .same-address-sub {
          font-size: 0.75rem;
          color: #718096;
        }

        /* Toggle Switch */
        .switch {
          position: relative;
          display: inline-block;
          width: 46px;
          height: 26px;
          flex-shrink: 0;
        }

        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #CBD5E0;
          transition: .3s;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 20px;
          width: 20px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .3s;
        }

        input:checked + .slider {
          background-color: #0D7A75;
        }

        input:checked + .slider:before {
          transform: translateX(20px);
        }

        .slider.round {
          border-radius: 34px;
        }

        .slider.round:before {
          border-radius: 50%;
        }

        /* Right Trust Card */
        .trust-assurance-card {
          background: #ffffff;
          border: 1.5px solid #E2E8F0;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
        }

        .map-graphic-wrap {
          background: linear-gradient(135deg, #E6F7F5 0%, #D4F4F0 100%);
          height: 180px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .map-visual {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .map-grid-lines {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(13, 122, 117, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(13, 122, 117, 0.08) 1px, transparent 1px);
          background-size: 24px 24px;
        }

        .map-pin-pulse {
          color: #0D7A75;
          position: relative;
          z-index: 2;
          filter: drop-shadow(0 8px 16px rgba(13, 122, 117, 0.3));
          animation: floatPin 2.5s ease-in-out infinite;
        }

        @keyframes floatPin {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        .trust-card-body {
          padding: 24px;
        }

        .trust-title {
          font-size: 1.125rem;
          font-weight: 800;
          color: #1A202C;
          margin-bottom: 16px;
        }

        .trust-points-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .trust-point {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 0.875rem;
          color: #4A5568;
          font-weight: 500;
        }

        .trust-check {
          color: #0D7A75;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
};
