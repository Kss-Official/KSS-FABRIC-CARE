import React, { useState } from 'react';
import { useBooking } from '../../context/BookingContext';
import { useAdmin } from '../../context/AdminContext';
import {
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  MapPin,
  Clock,
  Mail,
  ArrowRight,
  X
} from 'lucide-react';

export const Footer = () => {
  const { navigateTo, startBooking } = useBooking();
  const { settings } = useAdmin();
  const [activeLegalModal, setActiveLegalModal] = useState(null);

  const instagramUrl = settings?.instagram || 'https://instagram.com/fabricare';
  const facebookUrl = settings?.facebook || 'https://facebook.com/fabricare';
  const twitterUrl = settings?.twitter || 'https://x.com/fabricare';
  const linkedinUrl = settings?.linkedin || 'https://linkedin.com/company/fabricare';
  const youtubeUrl = settings?.youtube || 'https://youtube.com';
  const supportEmail = settings?.supportEmail || 'support@fabricare.com';

  const handleLinkClick = (pageId, scrollId = null) => {
    if (navigateTo) {
      navigateTo(pageId);
    }
    if (scrollId) {
      setTimeout(() => {
        document.getElementById(scrollId)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="footer-root no-print">
      <div className="footer-inner-container">
        {/* Main 4-Column Section with Vertical Dividers */}
        <div className="footer-main-grid">
          {/* Column 1: Brand & Slogan */}
          <div className="footer-col footer-col-brand">
            <div
              className="footer-logo-title"
              onClick={() => handleLinkClick('home')}
              role="button"
              tabIndex={0}
            >
              <img 
                src="/images/fabricare-logo.png" 
                alt="FabriCare" 
                className="footer-brand-logo-img" 
              />
              <div>
                <span className="logo-teal">Fabri</span>
                <span className="logo-coral">Care</span>
              </div>
            </div>

            <p className="footer-slogan">Fresh clothes, brighter days.</p>
            <p className="footer-desc">
              Reliable laundry and garment care delivered to your door.
            </p>

            <div className="footer-social-row">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-circle"
                aria-label="Instagram"
              >
                <Instagram size={17} strokeWidth={2.2} />
              </a>
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-circle"
                aria-label="Facebook"
              >
                <Facebook size={17} strokeWidth={2.2} />
              </a>
              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-circle"
                aria-label="Twitter / X"
              >
                <span style={{ fontSize: '13px', fontWeight: 800, lineHeight: 1, fontFamily: 'system-ui, -apple-system, sans-serif' }}>𝕏</span>
              </a>
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-circle"
                aria-label="LinkedIn"
              >
                <Linkedin size={17} strokeWidth={2.2} />
              </a>
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-circle"
                aria-label="YouTube"
              >
                <Youtube size={17} strokeWidth={2.2} />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="footer-col footer-col-links">
            <h4 className="footer-heading">Quick Links</h4>
            <ul className="footer-nav-list">
              <li>
                <button
                  type="button"
                  className="footer-nav-link"
                  onClick={() => handleLinkClick('home')}
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="footer-nav-link"
                  onClick={() => handleLinkClick('about')}
                >
                  About Us
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="footer-nav-link"
                  onClick={() => handleLinkClick('services')}
                >
                  Services
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="footer-nav-link"
                  onClick={() => handleLinkClick('how-it-works')}
                >
                  How It Works
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="footer-nav-link"
                  onClick={() => handleLinkClick('pricing')}
                >
                  Pricing
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="footer-nav-link"
                  onClick={() => handleLinkClick('why-us', 'faq-section')}
                >
                  FAQs
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="footer-nav-link"
                  onClick={() => handleLinkClick('home', 'contact-section')}
                >
                  Contact Us
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="footer-nav-link"
                  onClick={() => handleLinkClick('delivery-portal')}
                  style={{ color: '#0D7A75', fontWeight: 600 }}
                >
                  🚚 Delivery Portal
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Our Services */}
          <div className="footer-col footer-col-services">
            <h4 className="footer-heading">Our Services</h4>
            <ul className="footer-nav-list">
              <li>
                <button
                  type="button"
                  className="footer-nav-link"
                  onClick={() => handleLinkClick('services')}
                >
                  Wash &amp; Fold
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="footer-nav-link"
                  onClick={() => handleLinkClick('services')}
                >
                  Wash &amp; Iron
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="footer-nav-link"
                  onClick={() => handleLinkClick('services')}
                >
                  Dry Cleaning
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="footer-nav-link"
                  onClick={() => handleLinkClick('services')}
                >
                  Steam Ironing
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="footer-nav-link"
                  onClick={() => handleLinkClick('services')}
                >
                  Express Laundry
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Get in Touch */}
          <div className="footer-col footer-col-contact">
            <h4 className="footer-heading">Get in Touch</h4>

            <div className="footer-contact-list">
              <div className="footer-contact-item">
                <div className="contact-icon-bubble">
                  <MapPin size={15} strokeWidth={2.4} />
                </div>
                <span className="contact-item-text">
                  Pickup &amp; delivery available
                </span>
              </div>

              <div className="footer-contact-item">
                <div className="contact-icon-bubble">
                  <Clock size={15} strokeWidth={2.4} />
                </div>
                <span className="contact-item-text">
                  Service hours vary by location
                </span>
              </div>

              <div className="footer-contact-item">
                <div className="contact-icon-bubble">
                  <Mail size={15} strokeWidth={2.4} />
                </div>
                <a
                  href={`mailto:${supportEmail}`}
                  className="contact-item-text contact-mail-link"
                >
                  {supportEmail}
                </a>
              </div>
            </div>

            <button
              type="button"
              className="footer-cta-pill-btn"
              onClick={() => startBooking && startBooking()}
            >
              <span>Book a Pickup</span>
              <ArrowRight size={17} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Bottom Horizontal Bar */}
        <div className="footer-bottom-bar">
          <p className="footer-copyright-text">
            &copy; 2026 FabriCare. All rights reserved.
          </p>

          <div className="footer-legal-links">
            <button
              type="button"
              className="footer-legal-link"
              onClick={() => setActiveLegalModal('privacy')}
            >
              Privacy Policy
            </button>
            <span className="footer-legal-divider">|</span>
            <button
              type="button"
              className="footer-legal-link"
              onClick={() => setActiveLegalModal('terms')}
            >
              Terms &amp; Conditions
            </button>
          </div>
        </div>
      </div>

      {/* Legal Modal (Privacy Policy & Terms) */}
      {activeLegalModal && (
        <div 
          className="legal-modal-backdrop animate-fade-in" 
          onClick={() => setActiveLegalModal(null)}
        >
          <div className="legal-modal-card" onClick={e => e.stopPropagation()}>
            <div className="legal-modal-header">
              <h3 className="legal-modal-title">
                {activeLegalModal === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions'}
              </h3>
              <button 
                type="button" 
                className="legal-modal-close"
                onClick={() => setActiveLegalModal(null)}
                aria-label="Close"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>
            <div className="legal-modal-body">
              {activeLegalModal === 'privacy' ? (
                <>
                  <h4>1. Information We Collect</h4>
                  <p>We collect essential personal information such as your name, mobile number, email address, and pickup/delivery address when you schedule an order or register an account.</p>
                  <h4>2. How We Use Your Information</h4>
                  <p>Your details are used solely to process laundry orders, schedule doorstep pickups and deliveries, send order status updates, and provide customer support.</p>
                  <h4>3. Data Security</h4>
                  <p>We implement stringent security measures and encryption to ensure your personal data remains private and protected. We do not sell or share personal data with external advertisers.</p>
                  <h4>4. Contact Support</h4>
                  <p>If you have any questions regarding your personal information, reach out to us at {supportEmail}.</p>
                </>
              ) : (
                <>
                  <h4>1. Introduction</h4>
                  <p>Welcome to FabriCare. These Terms & Conditions govern your use of our doorstep laundry services and platform.</p>
                  <h4>2. Garment Care & Handling</h4>
                  <p>Every garment is handled with utmost professional care in accordance with its fabric care label. Special care instructions should be specified during order booking.</p>
                  <h4>3. Scheduled Pickup & Delivery</h4>
                  <p>We provide pickup and delivery within your chosen time slots. You will receive live updates when our rider is assigned and on the way.</p>
                  <h4>4. Cancellations & Rescheduling</h4>
                  <p>Orders may be cancelled or rescheduled free of charge before our rider is dispatched for pickup via your customer portal or by contacting support.</p>
                </>
              )}
            </div>
            <div className="legal-modal-footer">
              <button 
                type="button" 
                className="legal-modal-btn"
                onClick={() => setActiveLegalModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* ==========================================================================
           FABRICARE FOOTER SECTION STYLES
           Dark navy palette (#071A24) matching exact design with vertical dividers.
           ========================================================================== */
        .footer-root {
          background-color: #071A24;
          color: #8FA4B0;
          font-family: 'Poppins', sans-serif;
          width: 100%;
          margin-top: auto;
          margin-bottom: 0 !important;
          padding-bottom: 0 !important;
          position: relative;
          z-index: 10;
          flex-shrink: 0;
          overflow: hidden;
          contain: paint;
        }

        .footer-inner-container {
          max-width: 1320px;
          margin: 0 auto;
          padding: 68px 32px 32px;
        }

        /* 4-Column Grid with Vertical Divider Lines */
        .footer-main-grid {
          display: grid;
          grid-template-columns: 1.35fr 0.95fr 1fr 1.3fr;
          gap: 0;
          align-items: stretch;
        }

        .footer-col {
          padding: 0 36px;
        }

        .footer-col:first-child {
          padding-left: 0;
        }

        .footer-col:last-child {
          padding-right: 0;
        }

        /* Subtle Vertical Dividers between columns */
        .footer-col-brand,
        .footer-col-links,
        .footer-col-services {
          border-right: 1px solid rgba(255, 255, 255, 0.08);
        }

        .footer-logo-title {
          font-family: 'Poppins', sans-serif;
          font-size: 32px;
          font-weight: 800;
          letter-spacing: -0.6px;
          line-height: 1;
          margin-bottom: 18px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 12px;
        }

        .footer-brand-logo-img {
          width: 38px;
          height: 38px;
          border-radius: 9px;
          object-fit: contain;
          flex-shrink: 0;
        }

        .logo-teal {
          color: #00CED1;
        }

        .logo-coral {
          color: #FF6B54;
        }

        .footer-slogan {
          font-family: 'Poppins', sans-serif;
          font-size: 16px;
          font-weight: 600;
          color: #FFFFFF;
          margin: 0 0 8px;
          line-height: 1.35;
        }

        .footer-desc {
          font-family: 'Poppins', sans-serif;
          font-size: 13.5px;
          font-weight: 400;
          color: #8FA4B0;
          line-height: 1.55;
          margin: 0 0 24px;
          max-width: 290px;
        }

        .footer-social-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .footer-social-circle {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #0B2936;
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          text-decoration: none;
        }

        .footer-social-circle:hover {
          background: #087F8C;
          color: #FFFFFF;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(8, 127, 140, 0.35);
        }

        /* Column Headings */
        .footer-heading {
          font-family: 'Poppins', sans-serif;
          font-size: 16.5px;
          font-weight: 700;
          color: #FFFFFF;
          margin: 4px 0 22px;
          letter-spacing: -0.01em;
        }

        /* Link Lists */
        .footer-nav-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 11px;
        }

        .footer-nav-link {
          background: none;
          border: none;
          padding: 0;
          font-family: 'Poppins', sans-serif;
          font-size: 14px;
          font-weight: 400;
          color: #8FA4B0;
          cursor: pointer;
          text-align: left;
          transition: color 0.18s ease, transform 0.18s ease;
          display: inline-block;
        }

        .footer-nav-link:hover {
          color: #00CED1;
          transform: translateX(2px);
        }

        /* Column 4: Contact & CTA */
        .footer-contact-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 26px;
        }

        .footer-contact-item {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .contact-icon-bubble {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #08535E;
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .contact-item-text {
          font-family: 'Poppins', sans-serif;
          font-size: 13.5px;
          color: #D1DCE5;
          font-weight: 400;
          line-height: 1.35;
        }

        .contact-mail-link {
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .contact-mail-link:hover {
          color: #00CED1;
        }

        .footer-cta-pill-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background-color: #FF6B54;
          color: #FFFFFF;
          font-family: 'Poppins', sans-serif;
          font-weight: 600;
          font-size: 15px;
          padding: 13px 30px;
          border-radius: 9999px;
          border: none;
          cursor: pointer;
          box-shadow: 0 8px 22px rgba(255, 107, 84, 0.35);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          width: 100%;
          max-width: 250px;
        }

        .footer-cta-pill-btn:hover {
          background-color: #E8553F;
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(255, 107, 84, 0.5);
        }

        .footer-cta-pill-btn:active {
          transform: translateY(0);
        }

        /* Bottom Copyright & Legal Bar */
        .footer-bottom-bar {
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          margin-top: 56px;
          padding-top: 24px;
          margin-bottom: 0;
          padding-bottom: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }

        .footer-copyright-text {
          font-family: 'Poppins', sans-serif;
          font-size: 13px;
          color: #8FA4B0;
          margin: 0;
        }

        .footer-legal-links {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .footer-legal-link {
          font-family: 'Poppins', sans-serif;
          font-size: 13px;
          color: #8FA4B0;
          text-decoration: none;
          background: transparent;
          border: none;
          padding: 0;
          cursor: pointer;
          transition: color 0.2s ease;
        }

        .footer-legal-link:hover {
          color: #FFFFFF;
        }

        /* Legal Modal */
        .legal-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(7, 26, 36, 0.75);
          backdrop-filter: blur(4px);
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          box-sizing: border-box;
        }

        .legal-modal-card {
          background: #FFFFFF;
          border-radius: 18px;
          max-width: 560px;
          width: 100%;
          max-height: 85vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          overflow: hidden;
          animation: scaleIn 0.2s ease;
        }

        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }

        .legal-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid #E2E8F0;
        }

        .legal-modal-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: #0F172A;
          margin: 0;
        }

        .legal-modal-close {
          background: #F1F5F9;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #64748B;
          transition: all 0.15s ease;
        }

        .legal-modal-close:hover {
          background: #E2E8F0;
          color: #0F172A;
        }

        .legal-modal-body {
          padding: 24px;
          overflow-y: auto;
          color: #334155;
          font-size: 0.9rem;
          line-height: 1.6;
        }

        .legal-modal-body h4 {
          font-size: 0.95rem;
          font-weight: 700;
          color: #0F172A;
          margin: 16px 0 6px 0;
        }

        .legal-modal-body h4:first-child {
          margin-top: 0;
        }

        .legal-modal-body p {
          margin: 0 0 12px 0;
          color: #64748B;
        }

        .legal-modal-footer {
          padding: 16px 24px;
          border-top: 1px solid #E2E8F0;
          display: flex;
          justify-content: flex-end;
          background: #F8FAFC;
        }

        .legal-modal-btn {
          background: #0D7A75;
          color: #FFFFFF;
          border: none;
          padding: 9px 22px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .legal-modal-btn:hover {
          background: #095D59;
        }

        .footer-legal-divider {
          color: rgba(255, 255, 255, 0.2);
          font-size: 12px;
        }

        /* Responsive Breakpoints */
        @media (max-width: 1080px) {
          .footer-main-grid {
            grid-template-columns: 1fr 1fr;
            gap: 40px 24px;
          }
          .footer-col {
            padding: 0 16px;
            border-right: none;
          }
          .footer-col-brand,
          .footer-col-links,
          .footer-col-services {
            border-right: none;
          }
        }

        @media (max-width: 640px) {
          .footer-inner-container {
            padding: 48px 20px 24px;
          }
          .footer-main-grid {
            grid-template-columns: 1fr;
            gap: 36px;
          }
          .footer-col {
            padding: 0;
          }
          .footer-desc {
            max-width: 100%;
          }
          .footer-cta-pill-btn {
            max-width: 100%;
          }
          .footer-bottom-bar {
            flex-direction: column;
            text-align: center;
            gap: 12px;
            margin-top: 40px;
          }
          .footer-legal-links {
            justify-content: center;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;
