import React from 'react';
import { useBooking } from '../../context/BookingContext';
import { 
  Shirt, 
  MapPin, 
  Calendar, 
  FileText, 
  Edit3, 
  ArrowLeft, 
  ArrowRight, 
  Info, 
  ShieldCheck,
  CheckCircle2,
  Loader2,
  AlertCircle
} from 'lucide-react';

export const Step4ReviewConfirm = () => {
  const { 
    allServices, 
    selectedServices, 
    pickupDetails, 
    pickupSchedule, 
    specialInstructions, 
    setSpecialInstructions, 
    setCurrentStep, 
    confirmOrder,
    calculateTotal,
    isSubmittingOrder,
    orderError
  } = useBooking();

  const selectedItemsData = allServices.filter(s => selectedServices.includes(s.id));
  const estimatedTotal = calculateTotal() || 300;

  return (
    <div className="step4-container animate-fade-in">
      <div className="step-header">
        <span className="step-count">04 / 04</span>
        <h2 className="step-title">Review & Confirm</h2>
        <p className="step-subtitle">Please review your details before confirming your order</p>
      </div>

      <div className="booking-layout-grid">
        {/* Left: 4 Information Cards (2x2 Grid) */}
        <div className="review-cards-col">
          <div className="review-grid-2x2">
            {/* Card 1: Selected Services */}
            <div className="review-card">
              <div className="review-card-header">
                <div className="card-header-left">
                  <div className="header-icon-circle">
                    <Shirt size={18} />
                  </div>
                  <h3 className="review-card-title">Selected Services</h3>
                </div>
                <button 
                  className="card-edit-btn"
                  onClick={() => setCurrentStep(1)}
                >
                  <Edit3 size={13} />
                  <span>Edit</span>
                </button>
              </div>
              <div className="review-card-body">
                {selectedItemsData.map(s => (
                  <div key={s.id} className="review-service-item">
                    <CheckCircle2 size={15} className="item-check" />
                    <div>
                      <div className="item-name">{s.name}</div>
                      <div className="item-sub">{s.subtitle}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 2: Pickup Details */}
            <div className="review-card">
              <div className="review-card-header">
                <div className="card-header-left">
                  <div className="header-icon-circle">
                    <MapPin size={18} />
                  </div>
                  <h3 className="review-card-title">Pickup Details</h3>
                </div>
                <button 
                  className="card-edit-btn"
                  onClick={() => setCurrentStep(2)}
                >
                  <Edit3 size={13} />
                  <span>Edit</span>
                </button>
              </div>
              <div className="review-card-body">
                <div className="review-detail-row">
                  <span className="detail-label">Phone:</span>
                  <span className="detail-value">{pickupDetails.mobile}</span>
                </div>
                <div className="review-detail-row mt-2">
                  <span className="detail-label">Address:</span>
                  <span className="detail-value bold">{pickupDetails.address}</span>
                </div>
                {pickupDetails.landmark && (
                  <div className="review-detail-row mt-1">
                    <span className="detail-label">Landmark:</span>
                    <span className="detail-value text-muted">{pickupDetails.landmark}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Card 3: Pickup Time */}
            <div className="review-card">
              <div className="review-card-header">
                <div className="card-header-left">
                  <div className="header-icon-circle">
                    <Calendar size={18} />
                  </div>
                  <h3 className="review-card-title">Pickup Time</h3>
                </div>
                <button 
                  className="card-edit-btn"
                  onClick={() => setCurrentStep(3)}
                >
                  <Edit3 size={13} />
                  <span>Edit</span>
                </button>
              </div>
              <div className="review-card-body">
                <div className="time-badge-box">
                  <div className="time-date-text">{pickupSchedule.dateLabel}</div>
                  <div className="time-slot-text">{pickupSchedule.timeSlot}</div>
                </div>
              </div>
            </div>

            {/* Card 4: Special Instructions */}
            <div className="review-card">
              <div className="review-card-header">
                <div className="card-header-left">
                  <div className="header-icon-circle">
                    <FileText size={18} />
                  </div>
                  <h3 className="review-card-title">Special Instructions (Optional)</h3>
                </div>
              </div>
              <div className="review-card-body">
                <textarea
                  className="instructions-textarea"
                  rows="3"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="e.g. Ring bell twice, handle delicate silk sarees gently..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Order Summary Sidebar */}
        <div className="order-summary-sidebar">
          <div className="sidebar-card">
            <h3 className="sidebar-title">Estimated Summary</h3>

            <div className="summary-breakdown-list">
              {selectedItemsData.map(s => (
                <div key={s.id} className="summary-breakdown-row">
                  <span className="breakdown-name">{s.name}</span>
                  <span className="breakdown-price">₹{s.price}</span>
                </div>
              ))}
            </div>

            <div className="summary-divider" />

            <div className="estimated-total-row">
              <span className="total-title">Estimated Total</span>
              <span className="total-value">₹{estimatedTotal}</span>
            </div>

            {orderError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #F87171', borderRadius: '10px', padding: '10px 12px', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: '#991B1B', fontSize: '0.8125rem' }}>
                <AlertCircle size={16} className="shrink-0" />
                <span>{orderError}</span>
              </div>
            )}

            <div className="final-pricing-notice">
              <Info size={16} className="notice-icon" />
              <span>Final pricing depends on count & weight during pickup.</span>
            </div>

            <button
              id="confirm-pickup-final-btn"
              className="btn btn-teal w-full confirm-btn"
              onClick={confirmOrder}
              disabled={isSubmittingOrder}
              style={{ opacity: isSubmittingOrder ? 0.7 : 1, cursor: isSubmittingOrder ? 'not-allowed' : 'pointer' }}
            >
              {isSubmittingOrder ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  <span>Submitting Booking...</span>
                </>
              ) : (
                <>
                  <span>Confirm Pickup</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>

            <div className="trust-footer-sub">
              <ShieldCheck size={14} className="text-teal" />
              <span>100% Satisfaction Guarantee • Pay after delivery</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Step Navigation Actions */}
      <div className="step-footer-actions">
        <button
          className="btn btn-outline-teal step-back-btn"
          onClick={() => setCurrentStep(3)}
          disabled={isSubmittingOrder}
        >
          <ArrowLeft size={17} />
          <span>Back</span>
        </button>

        <button
          className="btn btn-teal step-next-btn"
          onClick={confirmOrder}
          disabled={isSubmittingOrder}
          style={{ opacity: isSubmittingOrder ? 0.7 : 1, cursor: isSubmittingOrder ? 'not-allowed' : 'pointer' }}
        >
          {isSubmittingOrder ? (
            <>
              <Loader2 size={17} className="animate-spin" />
              <span>Submitting Booking...</span>
            </>
          ) : (
            <>
              <span>Confirm Pickup</span>
              <ArrowRight size={17} />
            </>
          )}
        </button>
      </div>

      <style>{`
        .step4-container {
          width: 100%;
        }

        .review-grid-2x2 {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        .review-card {
          background: #ffffff;
          border: 1.5px solid #E2E8F0;
          border-radius: 18px;
          padding: 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
        }

        .review-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
          padding-bottom: 10px;
          border-bottom: 1px solid #EDF2F7;
        }

        .card-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .header-icon-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #EBF8F7;
          color: #0D7A75;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .review-card-title {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #1A202C;
        }

        .card-edit-btn {
          background: none;
          border: none;
          color: #0D7A75;
          font-size: 0.8125rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 6px;
        }

        .card-edit-btn:hover {
          background: #EBF8F7;
        }

        .review-service-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 8px;
        }

        .item-check {
          color: #0D7A75;
          flex-shrink: 0;
          margin-top: 3px;
        }

        .item-name {
          font-size: 0.875rem;
          font-weight: 700;
          color: #1A202C;
        }

        .item-sub {
          font-size: 0.75rem;
          color: #718096;
        }

        .review-detail-row {
          font-size: 0.875rem;
          display: flex;
          gap: 6px;
        }

        .detail-label {
          color: #718096;
          font-weight: 500;
        }

        .detail-value {
          color: #1A202C;
        }

        .detail-value.bold {
          font-weight: 700;
        }

        .detail-value.text-muted {
          color: #718096;
        }

        .time-badge-box {
          background: #FAFCFC;
          border: 1px solid #EEF2F6;
          border-radius: 10px;
          padding: 12px 14px;
        }

        .time-date-text {
          font-weight: 700;
          font-size: 0.9375rem;
          color: #1A202C;
        }

        .time-slot-text {
          font-size: 0.8125rem;
          color: #0D7A75;
          font-weight: 600;
          margin-top: 2px;
        }

        .instructions-textarea {
          width: 100%;
          border: 1.5px solid #E2E8F0;
          border-radius: 10px;
          padding: 10px;
          font-size: 0.8125rem;
          color: #1A202C;
          outline: none;
          resize: none;
          background: #FAFCFC;
        }

        .instructions-textarea:focus {
          border-color: #0D7A75;
          background: #ffffff;
        }

        .summary-breakdown-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 14px;
        }

        .summary-breakdown-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
          color: #2D3748;
        }

        .breakdown-price {
          font-weight: 700;
        }

        .estimated-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 1.125rem;
          font-weight: 800;
          color: #1A202C;
          margin-bottom: 16px;
        }

        .total-value {
          color: #0D7A75;
          font-size: 1.5rem;
        }

        .final-pricing-notice {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          background: #EBF8F7;
          border: 1px solid #BCEAE6;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 0.75rem;
          color: #0D7A75;
          line-height: 1.4;
          margin-bottom: 20px;
        }

        .notice-icon {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .confirm-btn {
          padding: 14px;
          font-size: 1rem;
          margin-bottom: 12px;
        }

        .trust-footer-sub {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 0.75rem;
          color: #718096;
        }

        @media (max-width: 900px) {
          .review-grid-2x2 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
