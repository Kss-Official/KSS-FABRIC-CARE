import React from 'react';
import { useBooking } from '../../context/BookingContext';
import {
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  MapPin,
  Clock,
  Mail,
  ArrowRight
} from 'lucide-react';

export const Footer = () => {
  const { navigateTo, startBooking } = useBooking();

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
              <span className="logo-teal">Fabri</span>
              <span className="logo-coral">Care</span>
            </div>

            <p className="footer-slogan">Fresh clothes, brighter days.</p>
            <p className="footer-desc">
              Reliable laundry and garment care delivered to your door.
            </p>

            <div className="footer-social-row">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-circle"
                aria-label="Instagram"
              >
                <Instagram size={17} strokeWidth={2.2} />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-circle"
                aria-label="Facebook"
              >
                <Facebook size={17} strokeWidth={2.2} />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-circle"
                aria-label="LinkedIn"
              >
                <Linkedin size={17} strokeWidth={2.2} />
              </a>
              <a
                href="https://youtube.com"
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
                  onClick={() => handleLinkClick('about')}
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
                  Shoe Laundry
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="footer-nav-link"
                  onClick={() => handleLinkClick('services')}
                >
                  Curtain Cleaning
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="footer-nav-link"
                  onClick={() => handleLinkClick('services')}
                >
                  Premium Laundry
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
                  href="mailto:info@fabricare.in"
                  className="contact-item-text contact-mail-link"
                >
                  info@fabricare.in
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
            <a
              href="#privacy"
              className="footer-legal-link"
              onClick={(e) => e.preventDefault()}
            >
              Privacy Policy
            </a>
            <span className="footer-legal-divider">|</span>
            <a
              href="#terms"
              className="footer-legal-link"
              onClick={(e) => e.preventDefault()}
            >
              Terms &amp; Conditions
            </a>
          </div>
        </div>
      </div>

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
          position: relative;
          z-index: 10;
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

        /* Column 1: Brand & Socials */
        .footer-logo-title {
          font-family: 'Poppins', sans-serif;
          font-size: 32px;
          font-weight: 800;
          letter-spacing: -0.6px;
          line-height: 1;
          margin-bottom: 18px;
          cursor: pointer;
          display: inline-block;
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
          transition: color 0.2s ease;
        }

        .footer-legal-link:hover {
          color: #FFFFFF;
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
