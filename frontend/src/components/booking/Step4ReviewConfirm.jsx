import React, { useState } from 'react';
import { useBooking } from '../../context/BookingContext';
import { 
  MapPin, 
  Phone, 
  Calendar, 
  Clock, 
  FileText, 
  Edit2, 
  Lock, 
  ChevronLeft, 
  ArrowRight, 
  Loader2, 
  AlertCircle,
  User,
  Zap
} from 'lucide-react';

export const Step4ReviewConfirm = () => {
  const { 
    allServices, 
    selectedServices,
    selectedItemsList = [],
    totalItemsCount = 0,
    pickupDetails, 
    pickupSchedule, 
    specialInstructions, 
    setSpecialInstructions, 
    setCurrentStep, 
    confirmOrder, 
    calculateTotal, 
    calculateDuplicateWashSavings = () => 0,
    getItemPricing = (it) => ({ effectiveUnitPrice: it.unitPrice, lineTotal: it.unitPrice * it.quantity, hasIroningDiscount: false }),
    isExpressDelivery,
    isSubmittingOrder, 
    orderError 
  } = useBooking();

  const [isEditingInstructions, setIsEditingInstructions] = useState(false);

  const SERVICE_DESCRIPTIONS = {
    'wash-fold': { name: 'Wash & Fold', subtitle: 'Everyday essentials' },
    'wash-iron': { name: 'Wash & Iron', subtitle: 'Clean clothes, ready to wear.' },
    'dry-cleaning': { name: 'Dry Cleaning', subtitle: 'For your delicate and premium wear.' },
    'steam-iron': { name: 'Steam Iron', subtitle: 'Crisp and perfectly pressed.' },
    'shoe-laundry': { name: 'Shoe Laundry', subtitle: 'Clean shoes, step brighter.' },
    'home-care': { name: 'Home Care', subtitle: 'Curtains, bed sheets and more.' },
    'express-laundry': { name: 'Express Laundry', subtitle: 'Superfast 24-hour priority turnaround.' }
  };

  const activeServiceIds = [
    ...new Set([
      ...selectedServices,
      ...selectedItemsList.map(it => it.categoryId)
    ])
  ].filter(Boolean);

  const activeServicesList = (activeServiceIds.length > 0 ? activeServiceIds : ['wash-fold', 'dry-cleaning']).map(id => {
    const meta = SERVICE_DESCRIPTIONS[id] || { name: id, subtitle: 'Standard laundry care' };
    return {
      id,
      name: meta.name,
      subtitle: meta.subtitle
    };
  });

  const isExpressBooking = Boolean(isExpressDelivery) || 
    (selectedServices && selectedServices.some(s => s === 'express-laundry' || String(s).toLowerCase().includes('express'))) ||
    (selectedItemsList && selectedItemsList.some(it => it.categoryId === 'express-laundry' || String(it.categoryName || '').toLowerCase().includes('express')));

  const primaryCategoryId = isExpressBooking 
    ? 'express-laundry' 
    : (selectedItemsList[0]?.categoryId || selectedServices[0] || 'wash-fold');

  const selectedItemsData = allServices.filter(s => selectedServices.includes(s.id));
  const estimatedTotal = calculateTotal() || 300;

  const renderServiceIcon = (id) => {
    switch (id) {
      case 'wash-fold':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#087F8C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
          </svg>
        );
      case 'wash-iron':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#087F8C" strokeWidth="2.2" strokeLinecap="round">
            <path d="M7 6.5h10" /><path d="M5 10.5h14" /><path d="M5 14.5h14" /><path d="M7 18.5h10" />
          </svg>
        );
      case 'dry-cleaning':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#087F8C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3a2.5 2.5 0 0 0-2.5 2.5c0 1 .6 1.8 1.5 2.2V9L3.5 15.2A2 2 0 0 0 4.7 18.5H19.3a2 2 0 0 0 1.2-3.3L13 9V7.7a2.5 2.5 0 0 0 1.5-2.2A2.5 2.5 0 0 0 12 3z" />
            <path d="M7.5 15.5h9" />
          </svg>
        );
      case 'steam-iron':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#087F8C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 17h16a1 1 0 0 0 1-1c0-4-3-6-7-6H9a5 5 0 0 0-5 5v2z" /><path d="M9 10V6h7v4" />
          </svg>
        );
      case 'express-laundry':
        return <Zap size={20} color="#087F8C" strokeWidth={2.2} />;
      case 'shoe-laundry':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#087F8C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3.5 15.5h17a1 1 0 0 1 1 1v1a1.5 1.5 0 0 1-1.5 1.5h-16A1.5 1.5 0 0 1 2.5 17.5v-1a1 1 0 0 1 1-1z" />
            <path d="M5 15.5c.5-2.5 2-4.5 5-5.5l4 .5 4 3 3 2" /><path d="M10 10.5 8 9" />
          </svg>
        );
      case 'home-care':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#087F8C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="5" width="16" height="3" rx="1.5" /><rect x="4" y="10.5" width="16" height="3" rx="1.5" /><rect x="4" y="16" width="16" height="3" rx="1.5" />
          </svg>
        );
      default:
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#087F8C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
          </svg>
        );
    }
  };

  return (
    <div className="step4-container animate-fade-in">
      <div className="booking-layout-grid">
        {/* Left: Single Parent Card enclosing Header, 2x2 Grid, and Pagination */}
        <div className="review-parent-card">
          <div className="step-header">
            <span className="step-count">04 / 04</span>
            <h2 className="step-title">Review & Confirm</h2>
            <p className="step-subtitle">Please review your details before we confirm your pickup.</p>
          </div>

          <div className="review-grid-2x2">
            {/* Card 1: Selected Clothing Items & Services */}
            <div className="review-inner-card">
              <div className="inner-card-header">
                <div className="inner-header-left">
                  <div className="icon-square">
                    {renderServiceIcon(primaryCategoryId)}
                  </div>
                  <h3 className="inner-card-title">
                    {selectedItemsList.length > 0 
                      ? `Selected Clothing Items (${totalItemsCount})` 
                      : 'Selected Services'}
                  </h3>
                </div>
                <button 
                  type="button" 
                  className="card-edit-btn"
                  onClick={() => setCurrentStep(1)}
                >
                  <span>Edit</span>
                  <Edit2 size={13} />
                </button>
              </div>

              <div className="inner-card-body">
                {/* Desktop: detailed clothing items stack */}
                <div className="desktop-only-review-items">
                  {selectedItemsList.length > 0 ? (
                    <div className="review-items-stack">
                      {selectedItemsList.map(item => {
                        const pricing = getItemPricing(item);
                        return (
                          <div key={item.key} className="service-item-row">
                            <span className="item-service-icon">
                              {renderServiceIcon(item.categoryId)}
                            </span>
                            <div className="item-text-wrap" style={{ flex: 1 }}>
                              <div className="item-main-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                  <span>{item.name}</span>
                                  {pricing.hasIroningDiscount && (
                                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#0D7A75', background: '#E6F8F6', border: '1px solid #BCEAE6', padding: '1px 6px', borderRadius: '999px' }}>
                                      Ironing only
                                    </span>
                                  )}
                                </div>
                                <span style={{ fontWeight: 700, color: '#087F8C', fontSize: '0.875rem' }}>
                                  ₹{pricing.lineTotal}
                                </span>
                              </div>
                              <div className="item-sub-title">
                                {item.categoryName} • Qty: {item.quantity} (
                                  {item.isPriceEnabled ? (
                                    pricing.hasIroningDiscount ? (
                                      <>
                                        <span style={{ textDecoration: 'line-through', color: '#94A3B8' }}>₹{item.unitPrice}</span>{' '}
                                        <span style={{ color: '#0D7A75', fontWeight: 600 }}>₹{pricing.effectiveUnitPrice} each</span>
                                      </>
                                    ) : (
                                      `₹${item.unitPrice} each`
                                    )
                                  ) : (
                                    `Standard Care`
                                  )}
                                )
                                {pricing.hasIroningDiscount && (
                                  <span style={{ display: 'block', fontSize: '0.7rem', color: '#0D7A75', marginTop: '2px' }}>
                                    ✓ Wash fee waived (included in Wash & Fold)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    selectedItemsData.map(s => (
                      <div key={s.id} className="service-item-row">
                        <span className="item-service-icon">
                          {renderServiceIcon(s.id)}
                        </span>
                        <div className="item-text-wrap">
                          <div className="item-main-title">{s.name}</div>
                          <div className="item-sub-title">{s.subtitle}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Mobile: clean list of selected services matching Screenshot 4 */}
                <div className="mobile-only-review-items">
                  {activeServicesList.map(s => (
                    <div key={s.id} className="service-item-row">
                      <span className="item-service-icon">
                        {renderServiceIcon(s.id)}
                      </span>
                      <div className="item-text-wrap">
                        <div className="item-main-title">{s.name}</div>
                        <div className="item-sub-title">{s.subtitle}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Card 2: Pickup Details */}
            <div className="review-inner-card">
              <div className="inner-card-header">
                <div className="inner-header-left">
                  <div className="icon-square">
                    <MapPin size={18} />
                  </div>
                  <h3 className="inner-card-title">Pickup Details</h3>
                </div>
                <button 
                  type="button" 
                  className="card-edit-btn"
                  onClick={() => setCurrentStep(2)}
                >
                  <span>Edit</span>
                  <Edit2 size={13} />
                </button>
              </div>

              <div className="inner-card-body">
                <div className="detail-item-row mb-2 desktop-only-name-row">
                  <User size={16} className="detail-icon" />
                  <span className="detail-text bold" style={{ color: '#0F172A', fontSize: '0.95rem' }}>
                    {pickupDetails.name || 'Customer'}
                  </span>
                </div>
                <div className="detail-item-row">
                  <Phone size={16} className="detail-icon" />
                  <span className="detail-text bold">{pickupDetails.mobile || '+91 98765 43210'}</span>
                </div>
                <div className="detail-item-row mt-2">
                  <MapPin size={16} className="detail-icon" />
                  <div className="address-stack">
                    <span className="detail-text bold">{pickupDetails.address || 'Banaswadi, Bengaluru - 560043'}</span>
                    {pickupDetails.landmark && (
                      <span className="detail-sub-text">{pickupDetails.landmark}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Pickup Time */}
            <div className="review-inner-card">
              <div className="inner-card-header">
                <div className="inner-header-left">
                  <div className="icon-square">
                    <Calendar size={18} />
                  </div>
                  <h3 className="inner-card-title">Pickup Time</h3>
                </div>
                <button 
                  type="button" 
                  className="card-edit-btn"
                  onClick={() => setCurrentStep(3)}
                >
                  <span>Edit</span>
                  <Edit2 size={13} />
                </button>
              </div>

              <div className="inner-card-body">
                <div className="detail-item-row">
                  <Calendar size={16} className="detail-icon" />
                  <span className="detail-text bold">{pickupSchedule.dateLabel || 'Tomorrow, 23 Sep 2024'}</span>
                </div>
                <div className="detail-item-row mt-2">
                  <Clock size={16} className="detail-icon" />
                  <span className="detail-text bold">{pickupSchedule.timeSlot || '9:00 AM – 11:00 AM'}</span>
                </div>
              </div>
            </div>

            {/* Card 4: Special Instructions */}
            <div className="review-inner-card">
              <div className="inner-card-header">
                <div className="inner-header-left">
                  <div className="icon-square">
                    <FileText size={18} />
                  </div>
                  <h3 className="inner-card-title">Special Instructions (Optional)</h3>
                </div>
                <button 
                  type="button" 
                  className="card-edit-btn"
                  onClick={() => setIsEditingInstructions(prev => !prev)}
                >
                  <span>Edit</span>
                  <Edit2 size={13} />
                </button>
              </div>

              <div className="inner-card-body">
                {isEditingInstructions ? (
                  <textarea
                    className="instructions-inline-textarea"
                    rows="2"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="e.g. Please call before pickup..."
                    autoFocus
                  />
                ) : (
                  <p className="instruction-display-text">
                    {specialInstructions || 'Please call before pickup.'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Pagination Row inside parent card */}
          <div className="card-pagination-row">
            <button
              className="pagination-circle-btn"
              onClick={() => setCurrentStep(3)}
              aria-label="Previous step"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="pagination-dots">
              <span className="dot" onClick={() => setCurrentStep(1)}></span>
              <span className="dot" onClick={() => setCurrentStep(2)}></span>
              <span className="dot" onClick={() => setCurrentStep(3)}></span>
              <span className="dot active"></span>
            </div>

            <div className="pagination-spacer"></div>
          </div>
        </div>

        {/* Right: Estimated Summary Sidebar Card */}
        <div className="estimated-summary-sidebar">
          <div className="sidebar-card">
            <div className="sidebar-header-row">
              <div className="sidebar-header-icon-box">
                <FileText size={18} />
              </div>
              <h3 className="sidebar-main-title">Estimated Summary</h3>
            </div>

            {/* Services & clothing items breakdown table */}
            <div className="summary-items-list">
              {calculateDuplicateWashSavings() > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#E6F8F6',
                  border: '1px solid #BCEAE6',
                  color: '#0D7A75',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  fontSize: '0.725rem',
                  marginBottom: '10px'
                }}>
                  <span>🎉</span>
                  <span><strong>₹{calculateDuplicateWashSavings()} saved</strong> — duplicate wash charge waived</span>
                </div>
              )}
              {selectedItemsList.length > 0 ? (
                selectedItemsList.map(it => {
                  const pricing = getItemPricing(it);
                  return (
                    <div key={it.key} className="summary-item-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="item-name" style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {it.name}
                          </span>
                          {pricing.hasIroningDiscount && (
                            <span style={{ fontSize: '0.625rem', fontWeight: 700, color: '#0D7A75', background: '#E6F8F6', border: '1px solid #BCEAE6', padding: '1px 5px', borderRadius: '4px' }}>
                              Ironing
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#087F8C', fontWeight: 600 }}>
                          {it.categoryName}
                        </span>
                      </div>
                      <span className="item-qty" style={{ fontWeight: 600, color: '#64748B' }}>×{it.quantity}</span>
                      <span className="item-price" style={{ fontWeight: 700, color: '#111827' }}>₹{pricing.lineTotal}</span>
                    </div>
                  );
                })
              ) : (
                selectedItemsData.map(s => (
                  <div key={s.id} className="summary-item-row">
                    <span className="item-name">{s.name}</span>
                    <span className="item-qty">1</span>
                    <span className="item-price">₹{s.price || 120}</span>
                  </div>
                ))
              )}
            </div>

            {/* Estimated Total */}
            <div className="summary-total-container">
              <span className="total-title">Estimated Total</span>
              <span className="total-amount">₹{estimatedTotal}</span>
            </div>

            {orderError && (
              <div className="order-error-banner">
                <AlertCircle size={16} className="shrink-0" />
                <span>{orderError}</span>
              </div>
            )}

            {/* Final Pricing Notice Box */}
            <div className="pricing-notice-box">
              <Clock size={16} className="notice-icon" />
              <p className="notice-text">
                Final pricing may vary based on actual items and condition.
              </p>
            </div>

            {/* In-Card Confirm Button */}
            <button
              id="confirm-pickup-sidebar-btn"
              className="confirm-pickup-full-btn"
              onClick={confirmOrder}
              disabled={isSubmittingOrder}
            >
              {isSubmittingOrder ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span>Confirm Pickup</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {/* Security Guarantee Text */}
            <div className="secure-badge-row">
              <Lock size={13} className="lock-icon" />
              <span>Your information is secure with us</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Step Navigation Action */}
      <div className="step-footer-actions">
        <button
          className="btn-submit-action"
          onClick={confirmOrder}
          disabled={isSubmittingOrder}
        >
          {isSubmittingOrder ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <span>Submit</span>
              <ArrowRight size={17} />
            </>
          )}
        </button>
      </div>

      <style>{`
        .step4-container {
          width: 100%;
        }

        .booking-layout-grid {
          display: grid;
          grid-template-columns: 1.8fr 1fr;
          gap: 24px;
          align-items: stretch;
        }

        /* Left Single Parent Card */
        .review-parent-card {
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

        /* 2x2 Grid */
        .review-grid-2x2 {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .review-inner-card {
          background: #ffffff;
          border: 1.5px solid #E2E8F0;
          border-radius: 16px;
          padding: 18px 18px 16px;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          min-height: 140px;
        }

        .inner-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .inner-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .icon-square {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          background: #E8FAF6;
          color: #0D7A75;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .inner-card-title {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #0F172A;
        }

        .card-edit-btn {
          background: none;
          border: none;
          color: #0D7A75;
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 2px 4px;
        }

        .card-edit-btn:hover {
          text-decoration: underline;
        }

        .inner-card-body {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .service-item-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .item-service-icon {
          color: #0D7A75;
          display: flex;
          margin-top: 1px;
          flex-shrink: 0;
        }

        .item-text-wrap {
          display: flex;
          flex-direction: column;
        }

        .item-main-title {
          font-size: 0.875rem;
          font-weight: 700;
          color: #0F172A;
        }

        .item-sub-title {
          font-size: 0.75rem;
          color: #64748B;
          line-height: 1.3;
        }

        .detail-item-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .detail-icon {
          color: #0D7A75;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .detail-text {
          font-size: 0.875rem;
          color: #0F172A;
        }

        .detail-text.bold {
          font-weight: 700;
        }

        .address-stack {
          display: flex;
          flex-direction: column;
        }

        .detail-sub-text {
          font-size: 0.75rem;
          color: #64748B;
          margin-top: 2px;
        }

        .instruction-display-text {
          font-size: 0.875rem;
          color: #334155;
          line-height: 1.45;
          margin: 0;
        }

        .instructions-inline-textarea {
          width: 100%;
          border: 1.5px solid #0D7A75;
          border-radius: 8px;
          padding: 8px 10px;
          font-size: 0.8125rem;
          color: #0F172A;
          outline: none;
          resize: none;
          background: #ffffff;
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

        .pagination-circle-btn:hover {
          background: #E2E8F0;
        }

        .pagination-spacer {
          width: 32px;
          height: 32px;
        }

        /* Right Estimated Summary Sidebar Card */
        .estimated-summary-sidebar {
          width: 100%;
        }

        .sidebar-card {
          background: #ffffff;
          border: 1.5px solid #E2E8F0;
          border-radius: 20px;
          padding: 24px 22px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .sidebar-header-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 6px;
        }

        .sidebar-header-icon-box {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          background: #E8FAF6;
          color: #0D7A75;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sidebar-main-title {
          font-size: 1.0625rem;
          font-weight: 700;
          color: #0F172A;
        }

        .summary-items-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 4px 0;
        }

        .summary-item-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.9375rem;
          color: #0F172A;
        }

        .summary-item-row .item-name {
          font-weight: 600;
          flex: 1;
        }

        .summary-item-row .item-qty {
          color: #64748B;
          width: 40px;
          text-align: center;
        }

        .summary-item-row .item-price {
          font-weight: 700;
          text-align: right;
        }

        .summary-total-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 10px;
          border-top: 1px solid #EDF2F7;
          margin-top: 4px;
        }

        .total-title {
          font-size: 1rem;
          font-weight: 700;
          color: #0F172A;
        }

        .total-amount {
          font-size: 1.625rem;
          font-weight: 800;
          color: #0F172A;
        }

        .order-error-banner {
          background: #FEF2F2;
          border: 1px solid #F87171;
          border-radius: 10px;
          padding: 10px 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #991B1B;
          font-size: 0.8125rem;
        }

        .pricing-notice-box {
          background: #E8FAF6;
          border-radius: 12px;
          padding: 12px 14px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .notice-icon {
          color: #0D7A75;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .notice-text {
          font-size: 0.78rem;
          color: #334155;
          line-height: 1.45;
          margin: 0;
        }

        .confirm-pickup-full-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          background: #0D7A75;
          color: #ffffff;
          font-weight: 700;
          font-size: 0.9375rem;
          padding: 13px;
          border-radius: 999px;
          border: none;
          cursor: pointer;
          transition: background 0.15s, opacity 0.15s;
          box-shadow: 0 4px 12px rgba(13, 122, 117, 0.18);
        }

        .confirm-pickup-full-btn:hover:not(:disabled) {
          background: #095F5B;
        }

        .confirm-pickup-full-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .secure-badge-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 0.75rem;
          color: #64748B;
        }

        .lock-icon {
          color: #64748B;
        }

        /* Bottom Footer Action */
        .step-footer-actions {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          margin-top: 28px;
        }

        .btn-submit-action {
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

        .btn-submit-action:hover:not(:disabled) {
          background: #095F5B;
        }

        .btn-submit-action:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .mobile-only-review-items {
          display: none;
        }

        @media (max-width: 960px) {
          .booking-layout-grid {
            grid-template-columns: 1fr;
          }
          .review-grid-2x2 {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .desktop-only-review-items,
          .desktop-only-name-row,
          .pagination-spacer {
            display: none !important;
          }

          .mobile-only-review-items {
            display: flex !important;
            flex-direction: column !important;
            gap: 12px !important;
          }

          .review-parent-card {
            background: transparent !important;
            border: none !important;
            padding: 0 !important;
            box-shadow: none !important;
          }

          .step-header {
            margin-bottom: 22px;
            text-align: left;
          }

          .step-count {
            font-size: 0.875rem;
            font-weight: 600;
            color: #8492A6;
            margin-bottom: 6px;
            display: inline-block;
          }

          .step-title {
            font-family: 'Poppins', sans-serif;
            font-size: 1.65rem;
            font-weight: 800;
            color: #12263A;
            margin: 0 0 6px 0;
            letter-spacing: -0.02em;
            line-height: 1.2;
          }

          .step-subtitle {
            font-family: 'Inter', sans-serif;
            font-size: 0.875rem;
            color: #718096;
            margin: 0 0 20px 0;
          }

          .review-grid-2x2 {
            display: flex !important;
            flex-direction: column !important;
            gap: 12px !important;
            margin-bottom: 16px !important;
          }

          .review-inner-card {
            background: #FFFFFF !important;
            border: 1.5px solid #E2E8F0 !important;
            border-radius: 18px !important;
            padding: 16px 14px !important;
            box-shadow: none !important;
          }

          .inner-card-header {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            margin-bottom: 12px !important;
          }

          .inner-header-left {
            display: flex !important;
            align-items: center !important;
            gap: 10px !important;
          }

          .icon-square {
            width: 34px !important;
            height: 34px !important;
            border-radius: 50% !important;
            background: #EAF8F7 !important;
            color: #087F8C !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            flex-shrink: 0 !important;
          }

          .inner-card-title {
            font-family: 'Poppins', sans-serif !important;
            font-size: 0.95rem !important;
            font-weight: 700 !important;
            color: #12263A !important;
            margin: 0 !important;
          }

          .card-edit-btn {
            background: none !important;
            border: none !important;
            color: #087F8C !important;
            font-size: 0.85rem !important;
            font-weight: 600 !important;
            display: flex !important;
            align-items: center !important;
            gap: 4px !important;
            cursor: pointer !important;
            padding: 0 !important;
          }

          .card-pagination-row {
            display: flex !important;
            align-items: center !important;
            justify-content: flex-start !important;
            gap: 14px !important;
            margin: 18px 0 24px !important;
            width: 100% !important;
          }

          .card-pagination-row .pagination-dots {
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
          }

          .card-pagination-row .dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #CBD5E1;
            transition: all 0.2s;
            cursor: pointer;
          }

          .card-pagination-row .dot.active {
            background: #087F8C;
            width: 9px;
            height: 9px;
          }

          .estimated-summary-sidebar {
            width: 100% !important;
            margin-top: 0 !important;
          }

          .estimated-summary-sidebar .sidebar-card {
            background: #EAF8F7 !important;
            border: 1.5px solid #D4F0EE !important;
            border-radius: 20px !important;
            padding: 18px 16px !important;
            box-shadow: none !important;
          }

          .sidebar-header-row {
            display: flex !important;
            align-items: center !important;
            gap: 10px !important;
            margin-bottom: 16px !important;
          }

          .sidebar-header-icon-box {
            width: 34px !important;
            height: 34px !important;
            border-radius: 50% !important;
            background: #FFFFFF !important;
            color: #087F8C !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            flex-shrink: 0 !important;
            box-shadow: 0 2px 6px rgba(8, 127, 140, 0.08) !important;
          }

          .sidebar-main-title {
            font-family: 'Poppins', sans-serif !important;
            font-size: 0.95rem !important;
            font-weight: 700 !important;
            color: #12263A !important;
            margin: 0 !important;
          }

          .summary-items-list {
            display: flex !important;
            flex-direction: column !important;
            gap: 10px !important;
            margin-bottom: 16px !important;
          }

          .summary-item-row {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            font-size: 0.85rem !important;
            color: #12263A !important;
          }

          .summary-total-container {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            padding-top: 14px !important;
            border-top: 1px solid #D4F0EE !important;
            margin-bottom: 16px !important;
          }

          .total-title {
            font-family: 'Poppins', sans-serif !important;
            font-size: 1rem !important;
            font-weight: 700 !important;
            color: #12263A !important;
          }

          .total-amount {
            font-family: 'Poppins', sans-serif !important;
            font-size: 1.6rem !important;
            font-weight: 800 !important;
            color: #12263A !important;
          }

          .pricing-notice-box {
            background: #DDF3F1 !important;
            border-radius: 12px !important;
            padding: 10px 12px !important;
            display: flex !important;
            align-items: flex-start !important;
            gap: 8px !important;
            margin-bottom: 18px !important;
            border: none !important;
          }

          .pricing-notice-box .notice-icon {
            color: #087F8C !important;
          }

          .pricing-notice-box .notice-text {
            font-size: 0.76rem !important;
            color: #087F8C !important;
            font-weight: 500 !important;
            line-height: 1.4 !important;
            margin: 0 !important;
          }

          .confirm-pickup-full-btn {
            width: 100% !important;
            height: 48px !important;
            background: #087F8C !important;
            color: #FFFFFF !important;
            border-radius: 999px !important;
            font-size: 1rem !important;
            font-weight: 700 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 8px !important;
            border: none !important;
            box-shadow: 0 4px 14px rgba(8, 127, 140, 0.25) !important;
            cursor: pointer !important;
          }

          .secure-badge-row {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 6px !important;
            font-size: 0.78rem !important;
            color: #718096 !important;
            margin-top: 14px !important;
          }
        }
      `}</style>
    </div>
  );
};
