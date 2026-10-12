import React, { useState } from 'react';
import { useBooking } from '../../context/BookingContext';
import { 
  Tag, 
  Shirt, 
  BedDouble, 
  Sparkles, 
  Wind, 
  Plus, 
  Minus, 
  ArrowRight, 
  CheckCircle2, 
  Truck, 
  ShieldCheck, 
  Leaf 
} from 'lucide-react';

const HangerIcon = ({ size = 20, color = '#087F8C' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2a3 3 0 0 0-3 3c0 .8.4 1.5 1 2L2 14v2h20v-2L14 7c.6-.5 1-1.2 1-2a3 3 0 0 0-3-3z" />
    <path d="M2 16h20" />
  </svg>
);

const IronIcon = ({ size = 20, color = '#087F8C' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 18h16a2 2 0 0 0 2-2c0-4-4-7-8-7H4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2z" />
    <path d="M4 9V6a2 2 0 0 1 2-2h8" />
  </svg>
);

const CurtainIcon = ({ size = 20, color = '#087F8C' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 4h18" />
    <path d="M4 4v16c0-3.5 2.5-5 4-5s4 1.5 4 5V4" />
    <path d="M20 4v16c0-3.5-2.5-5-4-5s-4 1.5-4 5V4" />
  </svg>
);

const BlanketIcon = ({ size = 20, color = '#087F8C' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="6" width="18" height="5" rx="2.5" />
    <rect x="3" y="13" width="18" height="5" rx="2.5" />
  </svg>
);

export const PricingCalculator = () => {
  const { startBooking } = useBooking();

  // Static Popular Flat Rates (Matching Reference Design)
  const flatRates = [
    { 
      id: 1, 
      title: 'Wash & Fold', 
      desc: 'Everyday clothes, fresh and clean.', 
      price: '₹ 85 / kg', 
      icon: <Shirt size={20} strokeWidth={2.2} /> 
    },
    { 
      id: 2, 
      title: 'Wash & Iron', 
      desc: 'Cleaned and neatly ironed.', 
      price: '₹ 120 / kg', 
      icon: <IronIcon size={20} color="#087F8C" /> 
    },
    { 
      id: 3, 
      title: 'Dry Cleaning', 
      desc: 'For premium and delicate fabrics.', 
      price: '₹ 120 / item', 
      icon: <HangerIcon size={20} color="#087F8C" /> 
    },
    { 
      id: 4, 
      title: 'Steam Iron', 
      desc: 'Quick and perfect finish.', 
      price: '₹ 20 / item', 
      icon: <IronIcon size={20} color="#087F8C" /> 
    },
    { 
      id: 5, 
      title: 'Bed Sheets & Blankets', 
      desc: 'Fresh, soft and hygienic.', 
      price: '₹ 149 / item', 
      prefix: 'From ', 
      icon: <BlanketIcon size={20} color="#087F8C" /> 
    },
    { 
      id: 6, 
      title: 'Curtain Cleaning', 
      desc: 'Deep cleaning for a healthier home.', 
      price: '₹ 150 / piece', 
      prefix: 'From ', 
      icon: <CurtainIcon size={20} color="#087F8C" /> 
    }
  ];

  // Dynamic Estimator Items
  const [estimatorItems, setEstimatorItems] = useState([
    { id: 'wash-fold', name: 'Wash & Fold (kg)', rate: 85, unit: 'kg', count: 2, icon: <Shirt size={18} strokeWidth={2.2} /> },
    { id: 'dry-cleaning', name: 'Dry Cleaning (pieces)', rate: 120, unit: 'item', count: 1, icon: <HangerIcon size={18} color="#087F8C" /> },
    { id: 'steam-iron', name: 'Steam Iron (pieces)', rate: 20, unit: 'item', count: 1, icon: <IronIcon size={18} color="#087F8C" /> }
  ]);

  const updateCount = (id, delta) => {
    setEstimatorItems(prev => prev.map(item => {
      if (item.id === id) {
        const newCount = Math.max(0, item.count + delta);
        return { ...item, count: newCount };
      }
      return item;
    }));
  };

  const subtotal = estimatorItems.reduce((sum, item) => sum + (item.count * item.rate), 0);

  return (
    <section className="pricing-section" id="pricing-section">
      <div className="container">
        {/* Section Header */}
        <div className="text-center pricing-head-wrap">
          <div className="pricing-eyebrow-pill">
            <Tag size={13} strokeWidth={2.5} />
            <span>SIMPLE PRICING</span>
          </div>
          <h2 className="pricing-main-title">
            No Hidden Fees. <span className="highlight">Pure Transparency.</span>
          </h2>
          <p className="pricing-subtitle">
            Estimate your laundry cost instantly with simple, transparent pricing.
          </p>
        </div>

        {/* Two-Column Grid */}
        <div className="pricing-two-col-grid">
          {/* Left Column: Popular Flat Rates */}
          <div className="flat-rates-col">
            <div className="flat-rates-header">
              <h3 className="flat-rates-title">Popular Flat Rates</h3>
              <p className="flat-rates-sub">
                Quality cleaning at honest prices. Here are our most chosen services in Bangalore.
              </p>
            </div>

            <div className="flat-rates-list">
              {flatRates.map(rate => (
                <div key={rate.id} className="flat-rate-card">
                  <div className="rate-card-left">
                    <div className="rate-icon-box">
                      {rate.icon}
                    </div>
                    <div>
                      <h4 className="rate-text-title">{rate.title}</h4>
                      <p className="rate-text-desc">{rate.desc}</p>
                    </div>
                  </div>
                  <div className="rate-price-tag">
                    {rate.prefix && <span className="prefix">{rate.prefix}</span>}
                    {rate.price}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Instant Estimator */}
          <div className="estimator-col">
            <div className="estimator-card">
              <h3 className="estimator-card-title">Instant Estimator</h3>
              <p className="estimator-card-sub">
                Select items below to get an estimated total.
              </p>

              <div className="estimator-items-stack">
                {estimatorItems.map(item => (
                  <div key={item.id} className="estimator-item-row">
                    <div className="estimator-item-left">
                      <div className="estimator-icon-circle">
                        {item.icon}
                      </div>
                      <div>
                        <h4 className="estimator-item-name">{item.name}</h4>
                        <p className="estimator-item-rate">₹ {item.rate} / {item.unit}</p>
                      </div>
                    </div>

                    <div className="estimator-counter-wrap">
                      <button 
                        type="button"
                        className="counter-action-btn"
                        onClick={() => updateCount(item.id, -1)}
                        disabled={item.count === 0}
                        aria-label={`Decrease ${item.name}`}
                      >
                        <Minus size={13} strokeWidth={2.5} />
                      </button>
                      <span className="counter-display-num">{item.count}</span>
                      <button 
                        type="button"
                        className="counter-action-btn"
                        onClick={() => updateCount(item.id, 1)}
                        aria-label={`Increase ${item.name}`}
                      >
                        <Plus size={13} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Subtotal Box */}
              <div className="subtotal-highlight-box">
                <div className="subtotal-line">
                  <span className="subtotal-text-label">Estimated Subtotal</span>
                  <span className="subtotal-amount-val">₹ {subtotal}</span>
                </div>
                <div className="subtotal-badge-msg">
                  <CheckCircle2 size={15} strokeWidth={2.5} color="#087F8C" />
                  <span>Includes standard handling and quality care.</span>
                </div>
              </div>

              {/* Book Pickup Button */}
              <button 
                type="button"
                className="btn-book-pickup-now"
                onClick={() => startBooking()}
              >
                <span>Book a Pickup Now</span>
                <ArrowRight size={17} strokeWidth={2.2} />
              </button>

              {/* Trust Badges */}
              <div className="estimator-trust-row">
                <div className="trust-mini-item">
                  <Truck size={16} strokeWidth={2} color="#087F8C" />
                  <span>Free Pickup<br />&amp; Drop</span>
                </div>
                <div className="trust-mini-item">
                  <ShieldCheck size={16} strokeWidth={2} color="#087F8C" />
                  <span>Safe &amp; Hygienic<br />Handling</span>
                </div>
                <div className="trust-mini-item">
                  <Leaf size={16} strokeWidth={2} color="#087F8C" />
                  <span>Trusted by<br />1000+ Customers</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .pricing-section {
          padding: 100px 0;
          background: #FFFFFF;
        }

        .pricing-head-wrap {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin-bottom: 56px;
        }

        .pricing-eyebrow-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #E0F4F2;
          color: #087F8C;
          font-family: 'Poppins', sans-serif;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.8px;
          padding: 6px 16px;
          border-radius: 9999px;
          text-transform: uppercase;
          margin-bottom: 16px;
        }

        .pricing-main-title {
          font-family: 'Poppins', sans-serif;
          font-size: 46px;
          font-weight: 800;
          color: #12263A;
          letter-spacing: -1.2px;
          margin: 0 0 16px;
          line-height: 1.15;
          text-align: center;
          width: 100%;
        }

        .pricing-main-title .highlight {
          color: #087F8C;
        }

        .pricing-subtitle {
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          color: #556980;
          line-height: 1.6;
          max-width: 600px;
          margin: 0 auto;
          text-align: center;
          width: 100%;
        }

        .pricing-two-col-grid {
          display: grid;
          grid-template-columns: 1.15fr 1fr;
          gap: 40px;
          align-items: start;
        }

        /* Left Column: Popular Flat Rates */
        .flat-rates-header {
          margin-bottom: 20px;
        }

        .flat-rates-title {
          font-family: 'Poppins', sans-serif;
          font-size: 24px;
          font-weight: 700;
          color: #12263A;
          margin: 0 0 6px;
        }

        .flat-rates-sub {
          font-family: 'Inter', sans-serif;
          font-size: 13.5px;
          color: #64748B;
          margin: 0;
        }

        .flat-rates-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .flat-rate-card {
          background: #FFFFFF;
          border: 1px solid #E6EEF0;
          border-radius: 18px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 4px 14px rgba(18, 38, 58, 0.02);
          transition: all 0.2s ease;
        }

        .flat-rate-card:hover {
          border-color: #B2E5E0;
          box-shadow: 0 8px 24px rgba(8, 127, 140, 0.08);
          transform: translateY(-2px);
        }

        .rate-card-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .rate-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #E0F4F2;
          color: #087F8C;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .rate-text-title {
          font-family: 'Poppins', sans-serif;
          font-size: 15.5px;
          font-weight: 700;
          color: #12263A;
          margin: 0 0 3px;
        }

        .rate-text-desc {
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          color: #64748B;
          margin: 0;
        }

        .rate-price-tag {
          font-family: 'Poppins', sans-serif;
          font-size: 17px;
          font-weight: 700;
          color: #087F8C;
          white-space: nowrap;
        }

        .rate-price-tag .prefix {
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          font-weight: 500;
          color: #64748B;
          margin-right: 4px;
        }

        /* Right Column: Instant Estimator Card */
        .estimator-card {
          background: #FFFFFF;
          border: 1px solid #E6EEF0;
          border-radius: 28px;
          padding: 36px 32px;
          box-shadow: 0 16px 40px rgba(18, 38, 58, 0.06);
          position: sticky;
          top: 96px;
        }

        .estimator-card-title {
          font-family: 'Poppins', sans-serif;
          font-size: 24px;
          font-weight: 700;
          color: #12263A;
          margin: 0 0 6px;
        }

        .estimator-card-sub {
          font-family: 'Inter', sans-serif;
          font-size: 13.5px;
          color: #64748B;
          margin: 0 0 24px;
        }

        .estimator-items-stack {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .estimator-item-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 14px;
          border-bottom: 1px solid #F1F5F9;
        }

        .estimator-item-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .estimator-item-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .estimator-icon-circle {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #E0F4F2;
          color: #087F8C;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .estimator-item-name {
          font-family: 'Poppins', sans-serif;
          font-size: 14.5px;
          font-weight: 700;
          color: #12263A;
          margin: 0 0 2px;
        }

        .estimator-item-rate {
          font-family: 'Inter', sans-serif;
          font-size: 12.5px;
          color: #64748B;
          margin: 0;
        }

        .estimator-counter-wrap {
          display: inline-flex;
          align-items: center;
          background: #F1F5F9;
          border-radius: 8px;
          padding: 3px;
          gap: 4px;
        }

        .counter-action-btn {
          width: 26px;
          height: 26px;
          border-radius: 6px;
          background: #DFF4F2;
          color: #087F8C;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .counter-action-btn:hover:not(:disabled) {
          background: #087F8C;
          color: #FFFFFF;
        }

        .counter-action-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .counter-display-num {
          font-family: 'Poppins', sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: #12263A;
          min-width: 24px;
          text-align: center;
        }

        .subtotal-highlight-box {
          background: #E8F7F5;
          border-radius: 16px;
          padding: 18px 20px;
          margin: 24px 0 20px;
        }

        .subtotal-line {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .subtotal-text-label {
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          color: #556980;
          font-weight: 500;
        }

        .subtotal-amount-val {
          font-family: 'Poppins', sans-serif;
          font-size: 26px;
          font-weight: 800;
          color: #087F8C;
        }

        .subtotal-badge-msg {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'Inter', sans-serif;
          font-size: 12.5px;
          font-weight: 600;
          color: #087F8C;
        }

        .btn-book-pickup-now {
          width: 100%;
          height: 54px;
          border-radius: 12px;
          background: #FF6B54;
          color: #FFFFFF;
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          font-size: 16px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 10px 24px rgba(255, 107, 84, 0.35);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          margin-bottom: 24px;
        }

        .btn-book-pickup-now:hover {
          background: #E8553F;
          transform: translateY(-2px);
          box-shadow: 0 14px 28px rgba(255, 107, 84, 0.45);
        }

        .estimator-trust-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          padding-top: 14px;
          border-top: 1px solid #F1F5F9;
        }

        .trust-mini-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: 'Inter', sans-serif;
          font-size: 11.5px;
          font-weight: 500;
          color: #556980;
          line-height: 1.25;
        }

        /* Responsive Breakpoints */
        @media (max-width: 992px) {
          .pricing-two-col-grid {
            grid-template-columns: 1fr;
            gap: 36px;
          }
          .pricing-main-title {
            font-size: 38px;
          }
          .estimator-card {
            position: static;
          }
        }

        @media (max-width: 640px) {
          .pricing-main-title {
            font-size: 30px;
          }
          .estimator-card {
            padding: 24px 20px;
          }
          .estimator-trust-row {
            grid-template-columns: 1fr;
            gap: 8px;
          }
        }
      `}</style>
    </section>
  );
};

export default PricingCalculator;
