import React, { useEffect } from 'react';
import { useBooking } from '../context/BookingContext';
import confetti from 'canvas-confetti';
import { Calendar, MapPin, ArrowRight, Home, RefreshCw, Truck } from 'lucide-react';

export const OrderConfirmedPage = () => {
  const { lastOrder, navigateTo, startBooking } = useBooking();

  useEffect(() => {
    // Trigger celebratory confetti animation
    try {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#0D7A75', '#FF6B50', '#64DFDF', '#FFD166']
      });

      const timer = setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.65 },
          colors: ['#0D7A75', '#64DFDF', '#FFD166']
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.65 },
          colors: ['#0D7A75', '#FF6B50', '#FFD166']
        });
      }, 300);

      return () => clearTimeout(timer);
    } catch (e) {
      console.log('Confetti effect');
    }
  }, []);

  return (
    <div className="confirmed-page-wrapper">
      <div className="container">
        <div className="confirmed-card animate-fade-in">
          {/* Pickup Confirmed Illustration */}
          <div className="mascot-illustration-wrapper">
            <img
              src="/assets/pickup-confirmed.png"
              alt="Pickup Confirmed"
              className="mascot-img"
            />
          </div>

          {/* Titles */}
          <h1 className="confirmed-title">Pickup Confirmed!</h1>
          <p className="confirmed-subtitle">Your laundry pickup has been scheduled.</p>

          {/* Details Summary Box */}
          <div className="order-details-pill-box">
            {/* Order ID */}
            <div className="pill-box-column order-id-col">
              <span className="pill-col-label">Order ID</span>
              <span className="pill-col-val order-id-val">{lastOrder?.orderId || '#LDX10284'}</span>
            </div>

            <div className="pill-box-divider" />

            {/* Pickup Date & Time */}
            <div className="pill-box-column">
              <div className="pill-icon-circle">
                <Calendar size={18} />
              </div>
              <div className="pill-col-content">
                <span className="pill-col-label">Pickup Date & Time</span>
                <span className="pill-col-val bold">{lastOrder?.dateText || 'Tomorrow, 23 Sep 2024'}</span>
                <span className="pill-col-sub">{lastOrder?.timeText || '9:00 AM – 11:00 AM'}</span>
              </div>
            </div>

            <div className="pill-box-divider" />

            {/* Pickup Address */}
            <div className="pill-box-column">
              <div className="pill-icon-circle">
                <MapPin size={18} />
              </div>
              <div className="pill-col-content">
                <span className="pill-col-label">Pickup Address</span>
                <span className="pill-col-val bold">{lastOrder?.addressTitle || 'Banaswadi, Bengaluru - 560043'}</span>
                <span className="pill-col-sub">{lastOrder?.addressDetail || 'House #12, 3rd Cross, HRBR Layout'}</span>
              </div>
            </div>
          </div>

          {/* Notice */}
          <p className="sms-email-notice">
            We'll send you a confirmation via SMS and Email.
          </p>

          {/* Actions */}
          <div className="confirmed-actions-row">
            <button
              id="confirmed-track-order-btn"
              className="btn btn-teal confirmed-btn"
              onClick={() => navigateTo('customer-track', lastOrder?.id)}
            >
              <Truck size={17} />
              <span>Track Live Order</span>
            </button>

            <button
              id="confirmed-back-home-btn"
              className="btn btn-outline-teal confirmed-btn"
              onClick={() => navigateTo('home')}
            >
              <Home size={17} />
              <span>Back to Home</span>
            </button>

            <button
              id="confirmed-book-another-btn"
              className="btn btn-outline-teal confirmed-btn"
              onClick={() => startBooking()}
            >
              <RefreshCw size={16} />
              <span>Book Another Pickup</span>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .confirmed-page-wrapper {
          min-height: calc(100vh - 160px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 60px 0 80px;
          background: #FAFCFC;
        }

        .confirmed-card {
          background: #ffffff;
          border: 1.5px solid #E2E8F0;
          border-radius: 28px;
          padding: 48px 40px;
          max-width: 860px;
          margin: 0 auto;
          text-align: center;
          box-shadow: 0 16px 48px rgba(13, 122, 117, 0.08);
        }

        .mascot-illustration-wrapper {
          width: 380px;
          max-width: 100%;
          margin: 0 auto 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: floatCourier 3.2s ease-in-out infinite;
          filter: drop-shadow(0 14px 28px rgba(13, 122, 117, 0.1));
        }

        @keyframes floatCourier {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        .mascot-img {
          width: 100%;
          height: auto;
          max-height: 260px;
          object-fit: contain;
          display: block;
        }

        .confirmed-title {
          font-size: 2.5rem;
          font-weight: 800;
          color: #111827;
          letter-spacing: -0.02em;
          margin-bottom: 6px;
        }

        .confirmed-subtitle {
          font-size: 1.0625rem;
          color: #64748B;
          margin-bottom: 32px;
        }

        .order-details-pill-box {
          background: #EBF8F7;
          border: 1.5px solid #BCEAE6;
          border-radius: 20px;
          padding: 24px 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          text-align: left;
          gap: 20px;
          margin-bottom: 24px;
        }

        .pill-box-column {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          flex: 1;
        }

        .pill-box-column.order-id-col {
          flex: 0.8;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .pill-icon-circle {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #ffffff;
          color: #0D7A75;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 2px 6px rgba(0,0,0,0.04);
        }

        .pill-col-content {
          display: flex;
          flex-direction: column;
        }

        .pill-col-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #718096;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .pill-col-val {
          font-size: 0.9375rem;
          color: #1A202C;
          margin-top: 2px;
        }

        .pill-col-val.bold {
          font-weight: 700;
        }

        .pill-col-val.order-id-val {
          font-size: 1.375rem;
          font-weight: 800;
          color: #0D7A75;
        }

        .pill-col-sub {
          font-size: 0.75rem;
          color: #718096;
          margin-top: 2px;
        }

        .pill-box-divider {
          width: 1px;
          height: 48px;
          background: #CCF0EC;
          flex-shrink: 0;
        }

        .sms-email-notice {
          font-size: 0.875rem;
          color: #718096;
          margin-bottom: 32px;
        }

        .confirmed-actions-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
        }

        .confirmed-btn {
          min-width: 190px;
          padding: 13px 28px;
        }

        @media (max-width: 768px) {
          .confirmed-card {
            padding: 32px 20px;
          }
          .order-details-pill-box {
            flex-direction: column;
            gap: 18px;
          }
          .pill-box-divider {
            width: 100%;
            height: 1px;
          }
          .confirmed-actions-row {
            flex-direction: column;
            width: 100%;
          }
          .confirmed-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
