import React from 'react';

export const Footer = () => {
  return (
    <footer className="footer-wrapper no-print">
      <div className="container footer-container">
        <div className="footer-copyright">
          © 2026 Laundrix LLC. All rights reserved. Professional laundry service & dry cleaning.
        </div>
        <div className="footer-links">
          <a href="#privacy" className="footer-link" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
          <a href="#terms" className="footer-link" onClick={(e) => e.preventDefault()}>Terms of Service</a>
          <a href="#accessibility" className="footer-link" onClick={(e) => e.preventDefault()}>Accessibility</a>
        </div>
      </div>

      <style>{`
        .footer-wrapper {
          background-color: #121C22;
          color: #94A3B8;
          font-size: 0.8125rem;
          padding: 28px 0;
          border-top: 1px solid #1E2D36;
          margin-top: auto;
        }

        .footer-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }

        .footer-copyright {
          color: #94A3B8;
        }

        .footer-links {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .footer-link {
          color: #94A3B8;
          transition: color 0.2s ease;
        }

        .footer-link:hover {
          color: #ffffff;
        }

        @media (max-width: 640px) {
          .footer-container {
            flex-direction: column;
            text-align: center;
            justify-content: center;
          }
          .footer-links {
            justify-content: center;
            gap: 16px;
          }
        }
      `}</style>
    </footer>
  );
};
