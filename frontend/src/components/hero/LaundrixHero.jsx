import React, { useState } from 'react';
import { 
  ArrowRight, 
  Menu, 
  X, 
  Image as ImageIcon, 
  Truck, 
  ShieldCheck, 
  Leaf, 
  Clock, 
  Shirt, 
  Sparkles, 
  Wind, 
  BedDouble 
} from 'lucide-react';

/**
 * Path to hero background image.
 * Set to "/assets/hero-bg.jpg" or "/assets/hero-laundry-towels.png".
 * Leave as "" or invalid path to test the automatic dashed placeholder.
 */
const HERO_BG = "/assets/hero-laundry-towels.png";

export const LaundrixHero = ({ onBookPickup, onExploreServices }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bgImageLoaded, setBgImageLoaded] = useState(false);
  const [bgImageError, setBgImageError] = useState(false);

  const showPlaceholder = !HERO_BG || bgImageError;

  return (
    <div className="laundrix-hero-wrapper">
      {/* =====================================================================
          1. NAVBAR (Sticky, 80px, Horizontal padding ~45px, White, Subtle Shadow)
          ===================================================================== */}
      <header className="laundrix-navbar">
        <div className="navbar-container">
          
          {/* Logo "FabriCare" in Poppins ExtraBold ~36px ("Fabri" black, "Care" #162832) */}
          <a href="#" className="nav-logo" aria-label="FabriCare Home">
            <span className="logo-fabri">Fabri</span>
            <span className="logo-care">Care</span>
          </a>

          {/* Desktop Nav Links (Inter medium ~20px, Muted gray-blue) */}
          <nav className="desktop-nav-links" aria-label="Main Navigation">
            <a href="#home" className="nav-link nav-link-active">Home</a>
            <a href="#about" className="nav-link">About Us</a>
            <a href="#services" className="nav-link">Our Services</a>
            <a href="#why-us" className="nav-link">Why Us</a>
            <a href="#pricing" className="nav-link">Pricing</a>
            <a href="#how-it-works" className="nav-link">How It Works</a>
          </nav>

          {/* Right Coral Pill Button "Book a Pickup →" (~60px tall, soft coral shadow, hover lift) */}
          <div className="desktop-cta-wrap">
            <button 
              type="button" 
              className="btn-coral-pill"
              onClick={onBookPickup}
            >
              <span>Book a Pickup</span>
              <ArrowRight size={20} className="arrow-icon" />
            </button>
          </div>

          {/* Mobile Hamburger Toggle (<1024px) */}
          <button 
            type="button" 
            className="mobile-hamburger-btn"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Slide-Down Menu */}
        {mobileMenuOpen && (
          <div className="mobile-slide-menu">
            <nav className="mobile-nav-list">
              <a href="#home" className="mobile-link active" onClick={() => setMobileMenuOpen(false)}>Home</a>
              <a href="#about" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>About Us</a>
              <a href="#services" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Our Services</a>
              <a href="#why-us" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Why Us</a>
              <a href="#pricing" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
              <a href="#how-it-works" className="mobile-link" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
              <div className="mobile-cta-wrap">
                <button 
                  type="button" 
                  className="btn-coral-pill w-full"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onBookPickup) onBookPickup();
                  }}
                >
                  <span>Book a Pickup</span>
                  <ArrowRight size={20} />
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* =====================================================================
          2. HERO SECTION (Full width, Min-height ~ calc(100vh - 80px))
          ===================================================================== */}
      <section className="hero-viewport-section">
        
        {/* Background Layer: Image + Gradient Readability Overlay or Dashed Placeholder */}
        <div className="hero-bg-layer">
          {HERO_BG && !bgImageError && (
            <div 
              id="hero-bg"
              className={`hero-bg-image ${bgImageLoaded ? 'loaded' : ''}`}
              style={{
                backgroundImage: `url(${HERO_BG})`,
                backgroundAttachment: 'fixed',
                backgroundPosition: 'center top',
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat'
              }}
              role="img"
              aria-label="Bright laundry room with folded towels"
            >
              <img
                src={HERO_BG}
                alt=""
                style={{ display: 'none' }}
                onLoad={() => setBgImageLoaded(true)}
                onError={() => setBgImageError(true)}
              />
            </div>
          )}

          {/* Placeholder when HERO_BG is empty or fails to load */}
          {showPlaceholder && (
            <div className="hero-placeholder-card">
              <div className="placeholder-dashed-box">
                <div className="placeholder-icon-wrap">
                  <ImageIcon size={32} strokeWidth={1.8} />
                </div>
                <h4>Hero background image placeholder</h4>
                <p>2560 × 1190 (JPG / WebP) • Set <code>HERO_BG</code> path</p>
              </div>
            </div>
          )}

          {/* Readability Gradient Layer (75% white on left to transparent at ~60%) */}
          <div className="hero-readability-gradient" />
        </div>

        {/* Content Container (Two columns with ~80px horizontal padding) */}
        <div className="hero-main-container">
          <div className="hero-two-column-grid">
            
            {/* LEFT COLUMN */}
            <div className="hero-left-column">
              
              {/* Headline in Poppins ExtraBold 800 (~120px desktop, scale down on mobile) */}
              <h1 className="hero-headline">
                <span className="navy-line">Fresh Clothes.</span>
                <span className="teal-line">Brighter Days.</span>
              </h1>

              {/* Subtext in Inter medium ~30px, dark navy-gray, max-width ~950px */}
              <p className="hero-subtext">
                Laundry, dry cleaning and home care services with convenient doorstep pickup &amp; delivery.
              </p>

              {/* Button Row (Gap ~32px) */}
              <div className="hero-cta-button-row">
                <button 
                  type="button" 
                  className="btn-coral-pill"
                  onClick={onBookPickup}
                >
                  <span>Book a Pickup</span>
                  <ArrowRight size={20} className="arrow-icon" />
                </button>

                <button 
                  type="button" 
                  className="btn-white-pill"
                  onClick={onExploreServices}
                >
                  <span>Explore Services</span>
                </button>
              </div>

              {/* Trust Badges Row (4 circular 40px light teal icons with 2-line semibold text) */}
              <div className="hero-trust-badges-row">
                <div className="trust-badge-item">
                  <div className="badge-icon-circle">
                    <Truck size={20} strokeWidth={2} />
                  </div>
                  <span className="badge-text">
                    Free Pickup<br />&amp; Delivery
                  </span>
                </div>

                <div className="trust-badge-item">
                  <div className="badge-icon-circle">
                    <ShieldCheck size={20} strokeWidth={2} />
                  </div>
                  <span className="badge-text">
                    Trusted &amp;<br />Safe
                  </span>
                </div>

                <div className="trust-badge-item">
                  <div className="badge-icon-circle">
                    <Leaf size={20} strokeWidth={2} />
                  </div>
                  <span className="badge-text">
                    Eco-Friendly<br />Cleaning
                  </span>
                </div>

                <div className="trust-badge-item">
                  <div className="badge-icon-circle">
                    <Clock size={20} strokeWidth={2} />
                  </div>
                  <span className="badge-text">
                    On-Time<br />Delivery
                  </span>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: 4 Glassmorphism Service Cards */}
            <div className="hero-right-column">
              <div className="service-cards-stack">
                
                {/* Card 1: Wash & Fold */}
                <a href="#services" className="glass-service-card">
                  <div className="card-left-group">
                    <div className="service-icon-tile mint-tile">
                      <Shirt size={24} strokeWidth={2} />
                    </div>
                    <div className="service-card-info">
                      <h3 className="service-title">Wash &amp; Fold</h3>
                      <p className="service-price">From ₹149 / lb</p>
                    </div>
                  </div>
                  <ArrowRight size={20} className="card-arrow" />
                </a>

                {/* Card 2: Dry Cleaning */}
                <a href="#services" className="glass-service-card">
                  <div className="card-left-group">
                    <div className="service-icon-tile coral-tile">
                      <Sparkles size={24} strokeWidth={2} />
                    </div>
                    <div className="service-card-info">
                      <h3 className="service-title">Dry Cleaning</h3>
                      <p className="service-price">From ₹69 / item</p>
                    </div>
                  </div>
                  <ArrowRight size={20} className="card-arrow" />
                </a>

                {/* Card 3: Steam Ironing */}
                <a href="#services" className="glass-service-card">
                  <div className="card-left-group">
                    <div className="service-icon-tile white-tile">
                      <Wind size={24} strokeWidth={2} />
                    </div>
                    <div className="service-card-info">
                      <h3 className="service-title">Steam Ironing</h3>
                      <p className="service-price">From ₹249 / item</p>
                    </div>
                  </div>
                  <ArrowRight size={20} className="card-arrow" />
                </a>

                {/* Card 4: Home Bedding & Care */}
                <a href="#services" className="glass-service-card">
                  <div className="card-left-group">
                    <div className="service-icon-tile mint-tile">
                      <BedDouble size={24} strokeWidth={2} />
                    </div>
                    <div className="service-card-info">
                      <h3 className="service-title">Home Bedding &amp; Care</h3>
                      <p className="service-price">From ₹189 / piece</p>
                    </div>
                  </div>
                  <ArrowRight size={20} className="card-arrow" />
                </a>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Scoped CSS Styles with Exact Pixel/Design Specifications */}
      <style>{`
        .laundrix-hero-wrapper {
          width: 100%;
          font-family: 'Inter', sans-serif;
          color: #12263A;
          background-color: #F8FAFC;
        }

        /* 1. Navbar Styles */
        .laundrix-navbar {
          position: sticky;
          top: 0;
          z-index: 50;
          width: 100%;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid #F1F5F9;
          box-shadow: 0 2px 14px rgba(18, 38, 58, 0.04);
        }

        .navbar-container {
          height: 80px;
          padding: 0 45px;
          max-width: 1720px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .nav-logo {
          font-family: 'Poppins', sans-serif;
          font-weight: 800;
          font-size: 36px;
          letter-spacing: -0.03em;
          text-decoration: none;
          line-height: 1;
          user-select: none;
        }
        .logo-fabri { color: #000000; }
        .logo-care { color: #087F8C; }

        .desktop-nav-links {
          display: flex;
          align-items: center;
          gap: 36px;
        }

        .nav-link {
          font-family: 'Inter', sans-serif;
          font-size: 20px;
          font-weight: 500;
          color: #64748B;
          text-decoration: none;
          position: relative;
          padding: 6px 0;
          transition: color 0.18s ease;
        }
        .nav-link:hover {
          color: #0E7C86;
        }
        .nav-link.nav-link-active {
          color: #0E7C86;
        }
        .nav-link.nav-link-active::after {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          bottom: -10px;
          height: 3px;
          background-color: #0E7C86;
          border-radius: 999px;
        }

        .btn-coral-pill {
          height: 58px;
          padding: 0 32px;
          border-radius: 9999px;
          background-color: #FF6B54;
          color: #FFFFFF;
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          font-size: 17px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          border: none;
          cursor: pointer;
          box-shadow: 0 8px 22px rgba(255, 107, 84, 0.38);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .btn-coral-pill:hover {
          background-color: #F25D45;
          box-shadow: 0 12px 28px rgba(255, 107, 84, 0.48);
          transform: translateY(-1px);
        }
        .btn-coral-pill .arrow-icon {
          transition: transform 0.2s ease;
        }
        .btn-coral-pill:hover .arrow-icon {
          transform: translateX(4px);
        }

        .mobile-hamburger-btn {
          display: none;
          background: none;
          border: none;
          color: #12263A;
          cursor: pointer;
          padding: 8px;
        }

        .mobile-slide-menu {
          background: #FFFFFF;
          border-top: 1px solid #F1F5F9;
          padding: 24px;
        }
        .mobile-nav-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .mobile-link {
          font-size: 19px;
          font-weight: 500;
          color: #64748B;
          text-decoration: none;
          padding: 8px 0;
          border-bottom: 1px solid #F8FAFC;
        }
        .mobile-link.active {
          color: #0E7C86;
          font-weight: 700;
          font-family: 'Poppins', sans-serif;
        }
        .mobile-cta-wrap {
          margin-top: 8px;
        }

        /* 2. Hero Section */
        .hero-viewport-section {
          position: relative;
          width: 100%;
          min-height: calc(100vh - 80px);
          display: flex;
          align-items: center;
          overflow: hidden;
          padding: 56px 0;
        }

        .hero-bg-layer {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          pointer-events: none;
        }

        .hero-bg-image {
          width: 100%;
          height: 100%;
          background-attachment: fixed;
          background-position: center top;
          background-size: cover;
          background-repeat: no-repeat;
          opacity: 0;
          transition: opacity 0.4s ease;
          display: block;
        }
        .hero-bg-image.loaded {
          opacity: 1;
        }

        .hero-placeholder-card {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: linear-gradient(135deg, #E6F6F6 0%, #EDF7F6 50%, #F6EBDD 100%);
        }
        .placeholder-dashed-box {
          max-width: 680px;
          width: 100%;
          border: 2px dashed rgba(14, 124, 134, 0.35);
          border-radius: 24px;
          padding: 40px;
          text-align: center;
          background: rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(8px);
        }
        .placeholder-icon-wrap {
          width: 60px;
          height: 60px;
          border-radius: 16px;
          background: #E6F7F7;
          color: #0E7C86;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }
        .placeholder-dashed-box h4 {
          font-family: 'Poppins', sans-serif;
          font-weight: 700;
          font-size: 20px;
          color: #12263A;
          margin: 0 0 6px;
        }
        .placeholder-dashed-box p {
          font-family: 'Inter', sans-serif;
          color: #64748B;
          font-size: 15px;
          margin: 0;
        }
        .placeholder-dashed-box code {
          background: #FFFFFF;
          padding: 2px 6px;
          border-radius: 4px;
          color: #0E7C86;
          font-family: monospace;
        }

        .hero-readability-gradient {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg, 
            rgba(255, 255, 255, 0.40) 0%, 
            rgba(255, 255, 255, 0.20) 35%, 
            rgba(255, 255, 255, 0.05) 65%, 
            rgba(255, 255, 255, 0.00) 100%
          );
          z-index: 2;
        }

        .hero-main-container {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 1720px;
          margin: 0 auto;
          padding: 0 80px;
        }

        .hero-two-column-grid {
          display: grid;
          grid-template-columns: 1.25fr 0.85fr;
          gap: 48px;
          align-items: center;
        }

        /* Left Column Content */
        .hero-headline {
          font-family: 'Poppins', sans-serif;
          font-weight: 700;
          font-size: 68px;
          line-height: 68px;
          letter-spacing: -1.7px;
          margin: 0 0 20px;
        }
        .navy-line {
          display: block;
          color: #12263A;
        }
        .teal-line {
          display: block;
          color: #087F8C;
        }

        .hero-subtext {
          font-family: 'Poppins', sans-serif;
          font-size: 28px;
          font-weight: 500;
          color: #2D3E50;
          line-height: 1.4;
          max-width: 950px;
          margin: 0 0 40px;
        }

        .hero-cta-button-row {
          display: flex;
          align-items: center;
          gap: 32px;
          margin-bottom: 56px;
        }

        .btn-white-pill {
          height: 58px;
          padding: 0 34px;
          border-radius: 9999px;
          background: #FFFFFF;
          color: #12263A;
          font-family: 'Poppins', sans-serif;
          font-weight: 600;
          font-size: 17px;
          border: 1px solid #E2E8F0;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-white-pill:hover {
          background: #F8FAFC;
          border-color: #CBD5E1;
        }

        .hero-trust-badges-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }

        .trust-badge-item {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .badge-icon-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #E6F7F7;
          color: #0E7C86;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .badge-text {
          font-family: 'Poppins', sans-serif;
          font-size: 15px;
          font-weight: 600;
          color: #12263A;
          line-height: 1.25;
        }

        /* Right Column Glassmorphism Cards */
        .hero-right-column {
          display: flex;
          justify-content: flex-end;
        }

        .service-cards-stack {
          width: 100%;
          max-width: 460px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .glass-service-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.40);
          backdrop-filter: blur(28px) brightness(1.04);
          -webkit-backdrop-filter: blur(28px) brightness(1.04);
          border: 1px solid rgba(255, 255, 255, 0.65);
          text-decoration: none;
          color: #FFFFFF;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08), inset 0 1px 2px rgba(255, 255, 255, 0.85);
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .glass-service-card:hover {
          background: rgba(255, 255, 255, 0.52);
          border-color: rgba(255, 255, 255, 0.85);
          transform: translateY(-2px);
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.12), inset 0 1px 2px rgba(255, 255, 255, 0.95);
        }

        .card-left-group {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .service-icon-tile {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .mint-tile {
          background: #20C9B6;
          color: #FFFFFF;
        }
        .coral-tile {
          background: #FF6B54;
          color: #FFFFFF;
        }
        .white-tile {
          background: #FFFFFF;
          color: #12263A;
        }

        .service-title {
          font-family: 'Poppins', sans-serif;
          font-size: 1.15rem;
          font-weight: 700;
          color: #FFFFFF;
          margin: 0;
          line-height: 1.25;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }

        .service-price {
          font-family: 'Poppins', sans-serif;
          font-size: 0.875rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.92);
          margin: 2px 0 0;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
        }

        .card-arrow {
          color: #FFFFFF;
          opacity: 0.85;
          transition: transform 0.2s ease, opacity 0.2s ease;
        }
        .glass-service-card:hover .card-arrow {
          opacity: 1;
          transform: translateX(4px);
        }

        /* Responsive Breakpoints */
        @media (max-width: 1024px) {
          .navbar-container {
            padding: 0 24px;
          }
          .desktop-nav-links, .desktop-cta-wrap {
            display: none;
          }
          .mobile-hamburger-btn {
            display: block;
          }

          .hero-main-container {
            padding: 0 32px;
          }
          .hero-two-column-grid {
            grid-template-columns: 1fr;
            gap: 48px;
          }
          .hero-headline {
            font-size: 52px;
            line-height: 52px;
            letter-spacing: -1.3px;
          }
          .hero-subtext {
            font-size: 20px;
          }
          .hero-trust-badges-row {
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
          }
          .hero-right-column {
            justify-content: center;
          }
          .service-cards-stack {
            max-width: 100%;
          }
          .hero-readability-gradient {
            background: linear-gradient(
              180deg, 
              rgba(255, 255, 255, 0.94) 0%, 
              rgba(255, 255, 255, 0.85) 60%, 
              rgba(255, 255, 255, 0.6) 100%
            );
          }
        }

        @media (max-width: 640px) {
          .navbar-container {
            padding: 0 16px;
          }
          .nav-logo {
            font-size: 30px;
          }
          .hero-main-container {
            padding: 0 20px;
          }
          .hero-headline {
            font-size: 38px;
            line-height: 40px;
            letter-spacing: -1px;
          }
          .hero-subtext {
            font-size: 18px;
          }
          .hero-cta-button-row {
            flex-direction: column;
            gap: 14px;
          }
          .btn-coral-pill, .btn-white-pill {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default LaundrixHero;
