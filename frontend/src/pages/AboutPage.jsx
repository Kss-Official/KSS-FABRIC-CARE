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
  ChevronUp
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
            <h2 className="about-cta-title">
              Ready for fresh clothes?
            </h2>
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
        }

        .about-cta-bg-wrapper {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
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

        .about-cta-title {
          font-family: 'Poppins', sans-serif;
          font-size: 44px;
          font-weight: 800;
          color: #FFFFFF;
          margin: 0 0 16px;
          line-height: 1.2;
          letter-spacing: -0.02em;
        }

        .about-cta-subtitle {
          font-family: 'Inter', sans-serif;
          font-size: 16px;
          color: rgba(255, 255, 255, 0.94);
          line-height: 1.65;
          margin: 0 auto 34px;
          max-width: 680px;
          font-weight: 400;
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
      `}</style>
    </div>
  );
};

export default AboutPage;
