import React, { useState, useRef, useEffect } from 'react';
import { useBooking } from '../context/BookingContext';
import { AboutHeroBanner } from '../components/hero/AboutHeroBanner';
import {
  Truck,
  MapPin,
  BadgeCheck,
  ArrowRight,
  ShieldCheck,
  Leaf,
  Clock,
  Shirt,
  IndianRupee,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  CircleDollarSign
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

export const AboutPage = () => {
  const { startBooking, navigateTo } = useBooking();
  const [openFaq, setOpenFaq] = useState(0);
  const faqListRef = useRef(null);

  useEffect(() => {
    if (openFaq === null) return;

    const handleClickOutside = (event) => {
      if (faqListRef.current && !faqListRef.current.contains(event.target)) {
        setOpenFaq(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [openFaq]);

  const faqItems = [
    {
      id: 1,
      icon: <HangerIcon size={20} color="#087F8C" />,
      question: 'Do you offer premium care for designer or delicate garments?',
      answer: 'Yes! We provide specialized care for designer wear, delicate fabrics (like silk, linen, chiffon, wool) and expensive garments. Our team uses gentle cleaning methods and premium detergents to keep your clothes safe and looking their best.'
    },
    {
      id: 2,
      icon: <ShieldCheck size={20} strokeWidth={2.2} color="#087F8C" />,
      question: 'What makes FabriCare different from regular dry cleaners?',
      answer: 'We use 100% eco-friendly hydrocarbon solvents instead of harsh perchloroethylene chemicals. Plus, we provide scheduled doorstep pickup and drop, real-time status tracking, and temperature-controlled steam finishing.'
    },
    {
      id: 3,
      icon: <Leaf size={20} strokeWidth={2.2} color="#087F8C" />,
      question: 'What laundry services do you offer?',
      answer: 'We offer a complete suite: Wash & Fold, Wash & Iron, Dry Cleaning, Specialized Stain Removal, Steam Ironing, Shoe Deep Cleaning & Restoration, and Home Care (curtains, quilts & bedsheets).'
    },
    {
      id: 4,
      icon: <Truck size={20} strokeWidth={2.2} color="#087F8C" />,
      question: 'How does pickup and delivery work?',
      answer: 'Simply select your services, enter your address, and choose your preferred 2-hour pickup time window. Our verified rider will arrive with laundry bags, verify your items, and deliver them fresh within 24–48 hours.'
    },
    {
      id: 5,
      icon: <IndianRupee size={19} strokeWidth={2.4} color="#087F8C" />,
      question: 'What are your prices and is there a minimum order value?',
      answer: 'Our pricing is 100% transparent with no hidden charges. Everyday wash starts from ₹60/kg, and individual steam pressing from ₹20/pc. Pickup & delivery is completely free for orders above ₹500.'
    },
    {
      id: 6,
      icon: <Clock size={20} strokeWidth={2.2} color="#087F8C" />,
      question: 'How long does it take to get my clothes back?',
      answer: 'Our standard turnaround is 48 hours for standard laundry and dry cleaning. We also provide an Express 24-hour delivery option for urgent orders.'
    }
  ];

  return (
    <div className="about-page-wrapper">
      {/* =========================================================================
          DIV 1: ABOUT US HERO BANNER (PLAYFAIR DISPLAY + WHITE FADE OVERLAY)
          ========================================================================= */}
      <AboutHeroBanner />

      {/* =========================================================================
          DIV 2: LAUNDRY WALLAH AT YOUR SERVICE (CORE ABOUT US STORY & PERKS)
          ========================================================================= */}
      <div className="about-div-2 about-wallah-section">
        <div className="container">
          {/* Desktop View - 100% untouched for laptops / desktops */}
          <div className="about-wallah-desktop-view">
            <div className="about-wallah-grid">
              <div className="about-wallah-image-col">
                <div className="about-wallah-frame">
                  <img
                    src="/assets/about-jeans.jpg"
                    alt="FabriCare Laundry Wallah - Clean Garments Care"
                    className="about-wallah-img"
                  />
                </div>
              </div>

              <div className="about-wallah-content-col">
                <div className="about-eyebrow">
                  <span className="eyebrow-line" />
                  <span>ABOUT US</span>
                  <span className="eyebrow-line" />
                </div>

                <h2 className="about-heading">
                  Laundry Wallah
                  <span className="about-heading-highlight">At Your Service</span>
                </h2>

                <p className="about-text-p">
                  Welcome to our premier online laundry service, where affordability meets exceptional quality. Our commitment to providing top-notch service is unmatched, and we pride ourselves on delivering convenience right to your doorstep. Our experienced team is dedicated to making your laundry experience hassle-free, ensuring your complete satisfaction every step of the way.
                </p>

                <p className="about-text-p">
                  Our mission is simple — to make laundry a stress-free experience for all. Let us show you why we're the best in the business.
                </p>

                <div className="about-perks-row">
                  <div className="about-perk-item">
                    <div className="perk-icon-circle">
                      <Truck size={20} strokeWidth={2.2} />
                    </div>
                    <div className="perk-text">
                      <span className="perk-title">Same-Day</span>
                      <span className="perk-sub">Delivery</span>
                    </div>
                  </div>

                  <div className="perk-divider" />

                  <div className="about-perk-item">
                    <div className="perk-icon-circle">
                      <MapPin size={20} strokeWidth={2.2} />
                    </div>
                    <div className="perk-text">
                      <span className="perk-title">Free Pickup &amp;</span>
                      <span className="perk-sub">Drop (Above ₹500)</span>
                    </div>
                  </div>

                  <div className="perk-divider" />

                  <div className="about-perk-item">
                    <div className="perk-icon-circle">
                      <BadgeCheck size={20} strokeWidth={2.2} />
                    </div>
                    <div className="perk-text">
                      <span className="perk-title">Affordable</span>
                      <span className="perk-sub">Price</span>
                    </div>
                  </div>
                </div>

                <button
                  className="btn-enquire-now"
                  onClick={() => startBooking()}
                >
                  <span>Book a Pickup</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Div 2: Mobile Specific View (Exact match to user reference screenshot) */}
          <div className="about-wallah-mobile-view">
            <div className="about-mobile-header text-center">
              <div className="about-eyebrow">
                <span className="eyebrow-line" />
                <span>ABOUT US</span>
                <span className="eyebrow-line" />
              </div>
              <h2 className="about-heading-mobile">
                Laundry Wallah <br />
                <span className="about-heading-highlight">At Your Service</span>
              </h2>
            </div>

            <div className="about-mobile-image-frame">
              <img
                src="/assets/about-jeans.jpg"
                alt="Laundry Wallah - Clean Garments Care"
                className="about-mobile-img"
              />
            </div>

            <p className="about-mobile-desc">
              We're on a mission to make laundry simple, reliable, and hassle-free. Laundrix brings professional cleaning care to your doorstep so you can look good and feel good — everyday. From everyday wear to delicate fabrics, we handle it all with care.
            </p>

            <div className="about-mobile-cards-stack">
              <div className="about-feature-card">
                <div className="about-feature-icon-circle">
                  <Clock size={22} strokeWidth={2.2} />
                </div>
                <div className="about-feature-info">
                  <h4 className="about-feature-title">Saves You Time</h4>
                  <p className="about-feature-sub">Effortless pickup and quick returns</p>
                </div>
              </div>

              <div className="about-feature-card">
                <div className="about-feature-icon-circle">
                  <ShieldCheck size={22} strokeWidth={2.2} />
                </div>
                <div className="about-feature-info">
                  <h4 className="about-feature-title">Professional Cleaning Care</h4>
                  <p className="about-feature-sub">Expert fabric handling guaranteed</p>
                </div>
              </div>

              <div className="about-feature-card">
                <div className="about-feature-icon-circle">
                  <CircleDollarSign size={22} strokeWidth={2.2} />
                </div>
                <div className="about-feature-info">
                  <h4 className="about-feature-title">Affordable Pricing</h4>
                  <p className="about-feature-sub">Transparent rates with no hidden costs</p>
                </div>
              </div>
            </div>

            <div className="about-mobile-btn-wrap">
              <button
                type="button"
                className="btn-read-more-pill"
                onClick={() => {
                  document.querySelector('.about-div-3')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <span>Read More</span>
                <ArrowRight size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          DIV 3: FREQUENTLY ASKED QUESTIONS (EXACT MATCH OF IMAGE 2)
          ========================================================================= */}
      <div className="about-div-3 about-faq-section">
        <div className="container">
          <div className="text-center faq-head-wrap">
            <div className="faq-badge-pill">
              <MessageSquare size={13} className="faq-badge-icon" />
              <span>FAQS</span>
            </div>
            <h2 className="faq-main-title">
              Frequently Asked <span className="faq-highlight-text">Questions</span>
            </h2>
            <p className="faq-subtitle">
              Still have questions? Here are some common ones. If you need more help, feel free to reach out to us.
            </p>
          </div>

          <div className="faq-accordion-list" ref={faqListRef}>
            {faqItems.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={item.id} className={`faq-card-item ${isOpen ? 'open' : ''}`}>
                  <button
                    type="button"
                    className="faq-question-btn"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    aria-expanded={isOpen}
                  >
                    <div className="faq-q-left">
                      <div className="faq-icon-bubble">
                        {item.icon}
                      </div>
                      <span className="faq-q-title">{item.question}</span>
                    </div>
                    <div className={`faq-toggle-circle ${isOpen ? 'open' : ''}`}>
                      <ChevronDown size={18} strokeWidth={2.4} />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="faq-answer-block animate-fade-in">
                      <div className="faq-answer-inner">
                        <p className="faq-answer-text">{item.answer}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* =========================================================================
          DIV 4: READY FOR FRESH CLOTHES? CTA BANNER (EXACT MATCH OF IMAGE 3)
          ========================================================================= */}
      <div className="about-div-4 about-cta-section">
        <div className="about-cta-bg-wrapper">
          <img
            src="/assets/about-cta-stack.jpg"
            alt="Neatly folded clean clothes - FabriCare laundry care"
            className="about-cta-bg-img"
          />
          <div className="about-cta-overlay" />
        </div>
        <div className="container about-cta-container">
          <div className="about-cta-content">
            <h1 className="about-cta-title">
              Ready for fresh clothes?
            </h1>
            <p className="about-cta-subtitle">
              Experience your first premium laundry order completely hassle-free. Schedule your pickup in under 30 seconds and let our experts handle the rest.
            </p>
            <button
              className="about-cta-button"
              onClick={() => startBooking()}
            >
              Book Your Free Pickup
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .about-page-wrapper {
          background-color: #FAFCFC;
          width: 100%;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        /* ==========================================================================
           DIV 1: HERO BANNER (CLEAN IMAGE - NO OVERLAY, NO TEXT)
           ========================================================================== */
        .about-div-1 {
          width: 100%;
          line-height: 0;
          overflow: hidden;
          background-color: #FAFCFC;
        }

        .about-hero-img-clean {
          width: 100%;
          height: auto;
          max-height: 520px;
          object-fit: cover;
          object-position: top center;
          display: block;
        }

        /* ==========================================================================
           DIV 2: ABOUT WALLAH SECTION
           ========================================================================== */
        .about-div-2 {
          padding: 100px 0;
          background: #FFFFFF;
        }

        .about-wallah-desktop-view {
          display: block;
        }

        .about-wallah-mobile-view {
          display: none;
        }

        .about-wallah-grid {
          display: grid;
          grid-template-columns: 1fr 1.15fr;
          gap: 68px;
          align-items: center;
        }

        .about-wallah-image-col {
          display: flex;
          justify-content: center;
        }

        .about-wallah-frame {
          width: 100%;
          max-width: 520px;
          border-radius: 36px;
          overflow: hidden;
          box-shadow: 0 20px 48px -12px rgba(18, 38, 58, 0.12);
          background: #F8FAFC;
        }

        .about-wallah-img {
          width: 100%;
          height: auto;
          aspect-ratio: 1 / 0.95;
          object-fit: cover;
          display: block;
        }

        .about-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          font-family: 'Poppins', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 2px;
          color: #087F8C;
          text-transform: uppercase;
          margin-bottom: 14px;
        }

        .about-eyebrow .eyebrow-line {
          width: 28px;
          height: 2.5px;
          background-color: #087F8C;
          border-radius: 2px;
        }

        .about-heading {
          font-family: 'Poppins', sans-serif;
          font-size: 46px;
          font-weight: 800;
          line-height: 1.15;
          color: #12263A;
          letter-spacing: -1.2px;
          margin: 0 0 22px;
        }

        .about-heading .about-heading-highlight {
          display: block;
          color: #087F8C;
        }

        .about-text-p {
          font-size: 15.5px;
          color: #556980;
          line-height: 1.68;
          margin-bottom: 16px;
        }

        .about-perks-row {
          display: flex;
          align-items: center;
          gap: 20px;
          margin: 32px 0 36px;
          flex-wrap: wrap;
        }

        .about-perk-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .perk-icon-circle {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #E6F7F7;
          color: #087F8C;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .perk-text {
          display: flex;
          flex-direction: column;
          line-height: 1.25;
        }

        .perk-title {
          font-family: 'Poppins', sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: #12263A;
        }

        .perk-sub {
          font-size: 13px;
          color: #64748B;
          margin-top: 2px;
        }

        .perk-divider {
          width: 1px;
          height: 38px;
          background: #E2E8F0;
        }

        .btn-enquire-now {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: #FF6B54;
          color: #FFFFFF;
          font-weight: 600;
          font-size: 15px;
          padding: 14px 28px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          box-shadow: 0 10px 24px rgba(255, 107, 84, 0.35);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .btn-enquire-now:hover {
          background: #E8553F;
          transform: translateY(-2px);
          box-shadow: 0 14px 28px rgba(255, 107, 84, 0.45);
        }

        /* ==========================================================================
           DIV 3: FAQS SECTION (EXACT MATCH OF IMAGE 2)
           ========================================================================== */
        .about-div-3 {
          padding: 100px 0 115px;
          background: #F4FAF9;
          position: relative;
          overflow: hidden;
        }

        .faq-head-wrap {
          margin-bottom: 52px;
          position: relative;
          z-index: 2;
        }

        .faq-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #DEF5F3;
          color: #087F8C;
          font-family: 'Poppins', sans-serif;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          padding: 6px 16px;
          border-radius: 999px;
          margin-bottom: 14px;
        }

        .faq-badge-icon {
          color: #087F8C;
        }

        .faq-main-title {
          font-family: 'Poppins', sans-serif;
          font-size: 44px;
          font-weight: 800;
          color: #12263A;
          letter-spacing: -1.2px;
          margin: 0 0 14px;
          line-height: 1.2;
        }

        .faq-highlight-text {
          color: #087F8C;
        }

        .faq-subtitle {
          font-family: 'Inter', sans-serif;
          font-size: 15.5px;
          color: #64748B;
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .faq-accordion-list {
          max-width: 860px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: relative;
          z-index: 2;
        }

        .faq-card-item {
          background: #FFFFFF;
          border-radius: 20px;
          border: 1px solid rgba(220, 238, 236, 0.9);
          box-shadow: 0 4px 18px rgba(18, 38, 58, 0.03);
          overflow: hidden;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .faq-card-item:hover {
          border-color: #BCEAE6;
          box-shadow: 0 8px 24px rgba(8, 127, 140, 0.07);
        }

        .faq-card-item.open {
          border-color: #9DE0D9;
          box-shadow: 0 8px 26px rgba(8, 127, 140, 0.08);
        }

        .faq-question-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 22px 28px;
          background: transparent;
          border: none;
          cursor: pointer;
          text-align: left;
          gap: 18px;
        }

        .faq-q-left {
          display: flex;
          align-items: center;
          gap: 18px;
          flex: 1;
        }

        .faq-icon-bubble {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #E8F7F6;
          color: #087F8C;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .faq-q-title {
          font-family: 'Poppins', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: #12263A;
          line-height: 1.4;
          margin: 0;
        }

        .faq-toggle-circle {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #E8F7F6;
          color: #087F8C;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.25s ease;
        }

        .faq-toggle-circle.open {
          transform: rotate(180deg);
          background: #E8F7F6;
          color: #087F8C;
        }

        .faq-answer-block {
          padding: 0 28px 26px 28px;
        }

        .faq-answer-inner {
          margin-left: 62px;
          padding-left: 18px;
          border-left: 2px solid #087F8C;
        }

        .faq-answer-text {
          font-family: 'Inter', sans-serif;
          font-size: 14.5px;
          color: #556980;
          line-height: 1.68;
          margin: 0;
        }

        /* ==========================================================================
           DIV 4: READY FOR FRESH CLOTHES? CTA BANNER (EXACT MATCH OF IMAGE 3)
           ========================================================================== */
        .about-div-4 {
          position: relative;
          overflow: hidden;
          padding: 115px 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #05636D url('/assets/about-cta-stack.jpg') center / cover no-repeat fixed;
          background-attachment: fixed;
        }

        .about-cta-bg-wrapper {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
          display: none;
        }

        .about-cta-bg-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
        }

        .about-cta-overlay {
          position: absolute;
          inset: 0;
          background: #05636DD9;
          z-index: 1;
        }

        .about-cta-container {
          position: relative;
          z-index: 2;
        }

        .about-cta-content {
          max-width: 740px;
          margin: 0 auto;
          text-align: center;
        }

        .about-cta-title,
        .about-div-4 h1,
        .about-div-4 h2 {
          font-family: 'Poppins', sans-serif;
          font-size: 44px;
          font-weight: 800;
          color: #000000;
          margin: 0 0 16px;
          line-height: 1.2;
          letter-spacing: -0.02em;
        }

        .about-cta-subtitle,
        .about-div-4 p {
          font-family: 'Inter', sans-serif;
          font-size: 16px;
          color: #000000;
          line-height: 1.65;
          margin: 0 auto 34px;
          max-width: 680px;
          font-weight: 500;
        }

        .about-cta-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #FF7259;
          color: #FFFFFF;
          font-family: 'Poppins', sans-serif;
          font-size: 15px;
          font-weight: 700;
          border: none;
          border-radius: 12px;
          padding: 14px 34px;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);
          transition: all 0.2s ease;
        }

        .about-cta-button:hover {
          background: #FF5A3D;
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.24);
        }

        .about-cta-button:active {
          transform: translateY(0);
        }

        /* Responsive Breakpoints */
        @media (max-width: 992px) {
          .about-wallah-grid {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          .about-hero-title,
          .about-heading,
          .about-cta-title,
          .faq-main-title {
            font-size: 34px;
          }
        }

        @media (max-width: 768px) {
          .about-wallah-desktop-view {
            display: none !important;
          }
          .about-wallah-mobile-view {
            display: block !important;
            max-width: 440px !important;
            margin: 0 auto !important;
            padding: 0 4px !important;
          }
          .about-div-2 {
            padding: 44px 0 54px !important;
          }
          .about-mobile-header {
            text-align: center !important;
            margin-bottom: 22px !important;
          }
          .about-heading-mobile {
            font-family: 'Poppins', sans-serif !important;
            font-size: 30px !important;
            font-weight: 800 !important;
            line-height: 1.2 !important;
            color: #12263A !important;
            margin: 8px 0 0 !important;
            letter-spacing: -0.5px !important;
          }
          .about-heading-mobile .about-heading-highlight {
            color: #087F8C !important;
            display: block !important;
          }
          .about-mobile-image-frame {
            width: 100% !important;
            border-radius: 24px !important;
            overflow: hidden !important;
            box-shadow: 0 10px 28px rgba(18, 38, 58, 0.08) !important;
            margin-bottom: 22px !important;
            background: #F8FAFC !important;
          }
          .about-mobile-img {
            width: 100% !important;
            height: auto !important;
            aspect-ratio: 4 / 3 !important;
            object-fit: cover !important;
            display: block !important;
          }
          .about-mobile-desc {
            font-family: 'Inter', sans-serif !important;
            font-size: 14.5px !important;
            color: #4B5563 !important;
            line-height: 1.6 !important;
            margin: 0 0 24px !important;
            text-align: left !important;
          }
          .about-mobile-cards-stack {
            display: flex !important;
            flex-direction: column !important;
            gap: 12px !important;
            margin-bottom: 28px !important;
          }
          .about-feature-card {
            background: #F0FAF9 !important;
            border: 1.5px solid #D1F2EE !important;
            border-radius: 20px !important;
            padding: 15px 18px !important;
            display: flex !important;
            align-items: center !important;
            gap: 16px !important;
            box-shadow: 0 2px 8px rgba(8, 127, 140, 0.04) !important;
          }
          .about-feature-icon-circle {
            width: 46px !important;
            height: 46px !important;
            border-radius: 50% !important;
            background: #D5F4F0 !important;
            color: #087F8C !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            flex-shrink: 0 !important;
          }
          .about-feature-info {
            display: flex !important;
            flex-direction: column !important;
            text-align: left !important;
          }
          .about-feature-title {
            font-family: 'Poppins', sans-serif !important;
            font-size: 15px !important;
            font-weight: 700 !important;
            color: #12263A !important;
            margin: 0 0 3px !important;
            line-height: 1.25 !important;
          }
          .about-feature-sub {
            font-family: 'Inter', sans-serif !important;
            font-size: 13px !important;
            color: #64748B !important;
            margin: 0 !important;
            line-height: 1.35 !important;
          }
          .about-mobile-btn-wrap {
            display: flex !important;
            justify-content: center !important;
          }
          .btn-read-more-pill {
            background: linear-gradient(135deg, #FF6B54 0%, #FF5639 100%) !important;
            color: #FFFFFF !important;
            font-family: 'Poppins', sans-serif !important;
            font-size: 15.5px !important;
            font-weight: 600 !important;
            padding: 13px 42px !important;
            border-radius: 9999px !important;
            border: none !important;
            cursor: pointer !important;
            display: inline-flex !important;
            align-items: center !important;
            gap: 8px !important;
            box-shadow: 0 8px 24px rgba(255, 96, 70, 0.38) !important;
            transition: all 0.2s ease !important;
          }
          .btn-read-more-pill:active {
            transform: scale(0.98) !important;
          }
        }

        @media (max-width: 640px) {
          .about-hero-img-clean {
            max-height: 280px;
            object-position: top center;
          }
          .faq-question-btn {
            padding: 16px 18px;
          }
          .faq-answer-inner {
            margin-left: 0;
            padding-left: 14px;
          }
          .faq-q-title {
            font-size: 14.5px;
          }
        }

        @media (max-width: 420px) {
          .about-heading-mobile {
            font-size: 27px !important;
          }
          .about-mobile-desc {
            font-size: 13.5px !important;
          }
          .about-feature-card {
            padding: 12px 14px !important;
            gap: 12px !important;
          }
          .about-feature-icon-circle {
            width: 42px !important;
            height: 42px !important;
          }
          .about-feature-title {
            font-size: 14px !important;
          }
          .about-feature-sub {
            font-size: 12px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AboutPage;
