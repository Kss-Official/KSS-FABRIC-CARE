import React, { useState } from 'react';
import { useBooking } from '../../context/BookingContext';
import { Plus, Minus, Calculator, ArrowRight, CheckCircle2 } from 'lucide-react';

export const PricingCalculator = () => {
  const { startBooking } = useBooking();

  const [items, setItems] = useState([
    { id: 'shirt', name: 'Shirts & T-Shirts', service: 'Wash & Fold', rate: 80, count: 2, icon: '👔' },
    { id: 'jeans', name: 'Trousers & Jeans', service: 'Wash & Fold', rate: 120, count: 2, icon: '👖' },
    { id: 'suit', name: 'Suits & Blazers', service: 'Dry Cleaning', rate: 250, count: 1, icon: '🧥' },
    { id: 'bedsheet', name: 'Bedsheet (Single / Double)', service: 'Steam Ironing', rate: 90, count: 1, icon: '🛏️' },
    { id: 'blanket', name: 'Blanket & Heavy Quilt', service: 'Special Care', rate: 300, count: 0, icon: '🧼' },
    { id: 'dress', name: 'Silk Saree / Lehenga', service: 'Dry Cleaning', rate: 220, count: 0, icon: '👗' }
  ]);

  const updateCount = (id, delta) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const newCount = Math.max(0, item.count + delta);
        return { ...item, count: newCount };
      }
      return item;
    }));
  };

  const selectedItems = items.filter(i => i.count > 0);
  const totalCount = items.reduce((sum, i) => sum + i.count, 0);
  const subtotal = items.reduce((sum, i) => sum + (i.count * i.rate), 0);
  const freeDeliveryThreshold = 500;
  const isFreeDelivery = subtotal >= freeDeliveryThreshold || subtotal === 0;

  return (
    <section className="calculator-section" id="pricing-section">
      <div className="container">
        <div className="text-center section-head">
          <span className="section-tag pill">ESTIMATE PRICE</span>
          <h2 className="section-title">
            No Hidden Fees. <span className="highlight">Pure Transparency.</span>
          </h2>
          <p className="section-subtitle mx-auto">
            Calculate your laundry cost upfront with our interactive price estimator.
          </p>
        </div>

        <div className="calculator-grid">
          {/* Left: Item Counters */}
          <div className="calc-items-card">
            <h3 className="calc-card-title">Select Items to Clean</h3>
            <div className="calc-items-list">
              {items.map(item => (
                <div key={item.id} className="calc-item-row">
                  <div className="calc-item-info">
                    <span className="calc-item-icon">{item.icon}</span>
                    <div>
                      <div className="calc-item-name">{item.name}</div>
                      <div className="calc-item-service">{item.service}</div>
                    </div>
                  </div>

                  <div className="calc-item-actions">
                    <span className="calc-item-rate">₹{item.rate}<span className="unit">/pc</span></span>
                    <div className="counter-controls">
                      <button 
                        className="counter-btn"
                        onClick={() => updateCount(item.id, -1)}
                        disabled={item.count === 0}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="counter-value">{item.count}</span>
                      <button 
                        className="counter-btn plus"
                        onClick={() => updateCount(item.id, 1)}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Instant Summary */}
          <div className="calc-summary-card">
            <div className="calc-summary-header">
              <Calculator size={22} className="summary-icon" />
              <h3>Instant Estimate</h3>
            </div>

            <div className="calc-summary-items">
              {selectedItems.length === 0 ? (
                <div className="empty-estimate-note">
                  Select items on the left to see your live estimated breakdown.
                </div>
              ) : (
                selectedItems.map(item => (
                  <div key={item.id} className="summary-line-item">
                    <span className="line-item-name">{item.name} ({item.count}x)</span>
                    <span className="line-item-price">₹{item.count * item.rate}</span>
                  </div>
                ))
              )}
            </div>

            <div className="calc-summary-divider" />

            <div className="calc-summary-totals">
              <div className="total-row">
                <span className="total-label">Total Items</span>
                <span className="total-val">{totalCount} items</span>
              </div>
              <div className="total-row main">
                <span className="total-label">Estimated Total</span>
                <span className="total-amount">₹{subtotal}</span>
              </div>
            </div>

            <div className="calc-delivery-badge">
              <CheckCircle2 size={16} className="text-teal" />
              <span>
                {isFreeDelivery 
                  ? 'Eligible for Free Doorstep Pickup & Delivery!' 
                  : `Add ₹${freeDeliveryThreshold - subtotal} more for Free Delivery`}
              </span>
            </div>

            <button 
              className="btn btn-coral w-full calc-cta-btn"
              onClick={() => startBooking()}
            >
              <span>Book with This Estimate</span>
              <ArrowRight size={17} />
            </button>

            <p className="calc-disclaimer">
              * Final weight & item count verified at your doorstep during pickup.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .calculator-section {
          padding: 80px 0;
          background: #ffffff;
        }

        .section-head {
          margin-bottom: 48px;
        }

        .calculator-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 32px;
          align-items: start;
        }

        .calc-items-card {
          background: #FAFCFC;
          border: 1.5px solid #E6EEF0;
          border-radius: 20px;
          padding: 28px;
        }

        .calc-card-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1A202C;
          margin-bottom: 20px;
        }

        .calc-items-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .calc-item-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #ffffff;
          padding: 14px 18px;
          border-radius: 14px;
          border: 1px solid #EEF2F6;
          transition: border-color 0.2s;
        }

        .calc-item-row:hover {
          border-color: #BCEAE6;
        }

        .calc-item-info {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .calc-item-icon {
          font-size: 1.5rem;
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #F4FBFA;
          border-radius: 10px;
        }

        .calc-item-name {
          font-weight: 700;
          font-size: 0.9375rem;
          color: #1A202C;
        }

        .calc-item-service {
          font-size: 0.75rem;
          color: #718096;
        }

        .calc-item-actions {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .calc-item-rate {
          font-weight: 700;
          color: #0D7A75;
          font-size: 1rem;
        }

        .calc-item-rate .unit {
          font-size: 0.75rem;
          color: #718096;
          font-weight: 500;
        }

        .counter-controls {
          display: flex;
          align-items: center;
          background: #F1F5F9;
          border-radius: 8px;
          padding: 4px;
        }

        .counter-btn {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          border: none;
          background: #ffffff;
          color: #2D3748;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.15s;
        }

        .counter-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .counter-btn.plus {
          background: #0D7A75;
          color: #ffffff;
        }

        .counter-value {
          width: 32px;
          text-align: center;
          font-size: 0.875rem;
          font-weight: 700;
        }

        .calc-summary-card {
          background: #F0FDFB;
          border: 1.5px solid #BCEAE6;
          border-radius: 20px;
          padding: 28px;
          position: sticky;
          top: 96px;
          box-shadow: 0 8px 24px rgba(13, 122, 117, 0.06);
        }

        .calc-summary-header {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #0D7A75;
          margin-bottom: 20px;
        }

        .calc-summary-header h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #0D7A75;
        }

        .calc-summary-items {
          min-height: 100px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .empty-estimate-note {
          font-size: 0.875rem;
          color: #718096;
          line-height: 1.5;
          padding: 24px 0;
          text-align: center;
        }

        .summary-line-item {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
          color: #2D3748;
        }

        .line-item-price {
          font-weight: 700;
        }

        .calc-summary-divider {
          height: 1px;
          background: #CCF0EC;
          margin: 18px 0;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.9375rem;
          color: #4A5568;
          margin-bottom: 6px;
        }

        .total-row.main {
          margin-top: 10px;
          font-size: 1.25rem;
          font-weight: 800;
          color: #1A202C;
        }

        .total-amount {
          color: #0D7A75;
        }

        .calc-delivery-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #0D7A75;
          background: #ffffff;
          padding: 8px 12px;
          border-radius: 8px;
          margin: 18px 0;
          border: 1px solid #CCF0EC;
        }

        .calc-cta-btn {
          margin-bottom: 12px;
        }

        .calc-disclaimer {
          font-size: 0.6875rem;
          color: #718096;
          text-align: center;
          line-height: 1.4;
        }

        @media (max-width: 900px) {
          .calculator-grid {
            grid-template-columns: 1fr;
          }
          .calc-summary-card {
            position: static;
          }
        }
      `}</style>
    </section>
  );
};
