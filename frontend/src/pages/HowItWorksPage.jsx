import React, { useState, useRef, useEffect } from 'react';
import { useBooking } from '../context/BookingContext';
import { PageHeroBanner } from '../components/hero/PageHeroBanner';
import {
  Truck,
  Sparkles,
  Clock,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  PackageCheck,
  ArrowRight,
  MapPin,
  Tag,
  MessageSquare,
  ChevronDown,
  Leaf,
  IndianRupee
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

export const HowItWorksPage = () => {
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
      answer: 'We use eco-friendly hydrocarbon dry cleaning solvents, computerized German wash cycles, and digital barcode tracking so no garment ever gets lost or damaged. Plus, we pick up and deliver directly to your doorstep.'
    },
    {
      id: 3,
      icon: <Leaf size={20} strokeWidth={2.2} color="#087F8C" />,
      question: 'What laundry services do you offer?',
      answer: 'We offer Wash & Fold, Wash & Steam Iron, Premium Dry Cleaning, Shoe & Bag Spa, and Heavy Household Laundry (curtains, quilts, rugs, blankets).'
    },
    {
      id: 4,
      icon: <Truck size={20} strokeWidth={2.2} color="#087F8C" />,
      question: 'How does pickup and delivery work?',
      answer: 'Simply choose your preferred pickup slot on our website or mobile app. Our delivery executive will collect your clothes in secure laundry bags, inspect them, and return them fresh within 24 to 48 hours.'
    },
    {
      id: 5,
      icon: <IndianRupee size={20} strokeWidth={2.2} color="#087F8C" />,
      question: 'What are your prices and is there a minimum order value?',
      answer: 'Our everyday laundry starts from ₹69/kg and dry cleaning from ₹99/piece. We provide free doorstep pickup & delivery on all orders above ₹500.'
    },
    {
      id: 6,
      icon: <Clock size={20} strokeWidth={2.2} color="#087F8C" />,
      question: 'How long does it take to get my clothes back?',
      answer: 'Our standard turnaround is 48 hours for standard laundry and dry cleaning. We also provide an Express 24-hour delivery option for urgent orders.'
    }
  ];

  return (
    <div className="how-it-works-page-wrapper">
      {/* 1. HERO BANNER WITH WHITE FADE OVERLAY & HEADINGS */}
      <PageHeroBanner
        bgImage="/assets/how-it-works-hero.png"
        eyebrow="HOW IT WORKS"
        heading="How It Works"
        subtitle="Effortless 3-Step Pickup, Clean & Doorstep Delivery"
        altText="How FabriCare Works - Modern Laundry Facility"
      />

      {/* 2. SIGNATURE 3-STEP WORKING PROCESS */}
      <section className="process-section" id="process-section">
        <div className="container">
          {/* DESKTOP VIEW - 100% UNTOUCHED */}
          <div className="process-desktop-view">
            <div className="text-center process-head">
              <div className="process-eyebrow-container">
                <span className="process-eyebrow-line"></span>
                <span className="process-eyebrow-badge">SIMPLE 3 STEP PROCESS</span>
                <span className="process-eyebrow-line"></span>
              </div>
              <h2 className="process-main-title">
                Our <span className="process-title-highlight">Working Process</span>
              </h2>
              <p className="process-subtitle">
                From pickup to delivery, we make laundry simple, convenient and hassle-free.
              </p>
            </div>

            <div className="process-steps-wrapper">
              {/* Connecting dashed wave between cards */}
              <svg
                className="process-connecting-curve"
                viewBox="0 0 1000 100"
                fill="none"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M 285 50 C 330 72, 370 72, 415 50 M 585 50 C 630 72, 670 72, 715 50"
                  stroke="#82D6CB"
                  strokeWidth="2.5"
                  strokeDasharray="6 6"
                  strokeLinecap="round"
                />
              </svg>

              <div className="process-steps-grid">
                {/* Step 1 */}
                <div className="process-step-card">
                  <div className="process-step-tag">01</div>
                  <div className="process-card-img-wrap">
                    <img
                      src="/assets/process-step-1.png"
                      alt="Free Pickup (Above ₹500)"
                      className="process-card-img"
                    />
                  </div>
                  <h3 className="process-step-title">Free Pickup (Above ₹500)</h3>
                  <p className="process-step-desc">
                    We pickup the items from your home/office as per scheduled time.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="process-step-card">
                  <div className="process-step-tag">02</div>
                  <div className="process-card-img-wrap">
                    <img
                      src="/assets/process-step-2.png"
                      alt="Clean / Wash / Iron"
                      className="process-card-img"
                    />
                  </div>
                  <h3 className="process-step-title">Clean / Wash / Iron</h3>
                  <p className="process-step-desc">
                    The task is carried out by trained professionals with care.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="process-step-card">
                  <div className="process-step-tag">03</div>
                  <div className="process-card-img-wrap">
                    <img
                      src="/assets/process-step-3.png"
                      alt="Superfast Delivery"
                      className="process-card-img"
                    />
                  </div>
                  <h3 className="process-step-title">Superfast Delivery</h3>
                  <p className="process-step-desc">
                    We offer same day delivery for faster processing of items.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* MOBILE VIEW - EXACT MATCH TO USER'S MOCKUP */}
          <div className="process-mobile-view">
            <div className="hiw-mobile-head">
              <div className="hiw-mobile-eyebrow">
                <span className="hiw-mobile-dash">—</span>
                <span>HOW IT WORKS</span>
                <span className="hiw-mobile-dash">—</span>
              </div>
              <h2 className="hiw-mobile-title">
                Our <span className="hiw-mobile-title-highlight">Working Process</span>
              </h2>
              <p className="hiw-mobile-sub">
                Four simple steps to get your laundry picked up, cleaned, and delivered fresh.
              </p>
            </div>

            <div className="hiw-mobile-cards-stack">
              {/* Card 1 */}
              <div className="hiw-mobile-card">
                <div className="hiw-mobile-card-left">
                  <div className="hiw-mobile-num-circle">1</div>
                </div>
                <div className="hiw-mobile-card-body">
                  <div className="hiw-mobile-card-title-row">
                    <h3 className="hiw-mobile-card-title">Free Pickup (Above ₹300)</h3>
                    <img
                      src="/assets/hiw-scooter.png"
                      alt="Free Pickup Scooter"
                      className="hiw-mobile-corner-icon"
                    />
                  </div>
                  <p className="hiw-mobile-card-desc">
                    Schedule a pickup at your convenience. We collect your clothes from your doorstep.
                  </p>
                </div>
              </div>

              {/* Card 2 */}
              <div className="hiw-mobile-card">
                <div className="hiw-mobile-card-left">
                  <div className="hiw-mobile-num-circle">2</div>
                </div>
                <div className="hiw-mobile-card-body">
                  <div className="hiw-mobile-card-title-row">
                    <h3 className="hiw-mobile-card-title">Clean / Wash / Iron</h3>
                    <img
                      src="/assets/hiw-bubbles.png"
                      alt="Clean Wash Iron Bubbles"
                      className="hiw-mobile-corner-icon"
                    />
                  </div>
                  <p className="hiw-mobile-card-desc">
                    We carefully clean, wash, and iron your clothes using advanced machines and safe products.
                  </p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="hiw-mobile-card">
                <div className="hiw-mobile-card-left">
                  <div className="hiw-mobile-num-circle">3</div>
                </div>
                <div className="hiw-mobile-card-body">
                  <div className="hiw-mobile-card-title-row">
                    <h3 className="hiw-mobile-card-title">Superfast Delivery</h3>
                    <img
                      src="/assets/hiw-box.png"
                      alt="Superfast Delivery Box"
                      className="hiw-mobile-corner-icon"
                    />
                  </div>
                  <p className="hiw-mobile-card-desc">
                    Your fresh clothes are delivered back to you, on time, every time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FREQUENTLY ASKED QUESTIONS (DIV 3) */}
      <section className="how-it-works-div-3 how-faq-section">
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
      </section>

      {/* 4. CTA BANNER (DIV 4) */}
      <section className="cta-banner-section how-it-works-div-4">
        <div className="cta-banner-bg-wrapper">
          <img
            src="/assets/cta-folded-clothes.jpg"
            alt="FabriCare clean garments ready for delivery"
            className="cta-banner-bg-img"
          />
          <div className="cta-banner-overlay" />
        </div>
        <div className="container cta-banner-container">
          <div className="cta-banner-content">
            <h1 className="cta-banner-title">
              Ready to Free Up Your Weekends?
            </h1>
            <p className="cta-banner-sub">
              Experience the premier laundry service in Bangalore with convenient doorstep pickup &amp; delivery.
            </p>
            <button
              className="cta-banner-btn"
              onClick={() => startBooking()}
            >
              Book a Pickup Now
            </button>
          </div>
        </div>
      </section>

      <style>{`
        .how-it-works-page-wrapper {
          background-color: #FAFCFC;
          width: 100%;
          flex: 1;
          display: flex;
          flex-direction: column;
        }


        /* 3-STEP PROCESS (DIV 6) */
        .process-section {
          padding: 95px 0 100px;
          background: #FFFFFF;
        }

        .process-head {
          margin-bottom: 56px;
        }

        .process-eyebrow-container {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
        }

        .process-eyebrow-line {
          width: 32px;
          height: 2px;
          background: #087F8C;
          display: inline-block;
        }

        .process-eyebrow-badge {
          font-family: 'Poppins', sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: #087F8C;
          letter-spacing: 1.8px;
          text-transform: uppercase;
        }

        .process-main-title {
          font-family: 'Poppins', sans-serif;
          font-size: 44px;
          font-weight: 800;
          color: #12263A;
          letter-spacing: -1.2px;
          margin: 0 0 14px;
        }

        .process-title-highlight {
          color: #087F8C;
        }

        .process-subtitle {
          font-size: 16px;
          color: #556980;
          max-width: 580px;
          margin: 0 auto;
        }

        .process-steps-wrapper {
          position: relative;
        }

        .process-connecting-curve {
          position: absolute;
          top: 75px;
          left: 0;
          width: 100%;
          height: 80px;
          pointer-events: none;
          z-index: 1;
        }

        .process-steps-grid {
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 36px;
        }

        .process-step-card {
          background: #FFFFFF;
          border-radius: 28px;
          padding: 44px 32px 36px;
          text-align: center;
          position: relative;
          box-shadow: 0 12px 32px rgba(18, 38, 58, 0.05);
          border: 1.5px solid #EEF2F6;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }

        .process-step-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 44px rgba(8, 127, 140, 0.12);
          border-color: #087F8C;
        }

        .process-step-tag {
          position: absolute;
          top: 18px;
          left: 24px;
          font-family: 'Poppins', sans-serif;
          font-size: 14px;
          font-weight: 800;
          color: #087F8C;
          background: #E6F7F7;
          padding: 4px 12px;
          border-radius: 999px;
        }

        .process-card-img-wrap {
          width: 130px;
          height: 130px;
          margin: 0 auto 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .process-card-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .process-step-title {
          font-family: 'Poppins', sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: #12263A;
          margin: 0 0 10px;
        }

        .process-step-desc {
          font-size: 14.5px;
          color: #64748B;
          line-height: 1.6;
          margin: 0;
        }

        /* ==========================================================================
           DIV 3: FREQUENTLY ASKED QUESTIONS
           ========================================================================== */
        .how-it-works-div-3 {
          padding: 100px 0 115px;
          background: radial-gradient(circle at 88% 16%, rgba(180, 242, 236, 0.45) 0%, rgba(244, 250, 249, 1) 48%);
          position: relative;
          overflow: hidden;
        }

        .faq-head-wrap {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
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

        /* CTA BANNER */
        .cta-banner-section {
          position: relative;
          overflow: hidden;
          padding: 110px 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #05636D url('/assets/cta-folded-clothes.jpg') center 38% / cover no-repeat fixed;
          background-attachment: fixed;
        }

        .cta-banner-bg-wrapper {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
          display: none;
        }

        .cta-banner-bg-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 38%;
          display: block;
        }

        .cta-banner-overlay {
          position: absolute;
          inset: 0;
          background: #05636DD9;
          z-index: 1;
        }

        .cta-banner-container {
          position: relative;
          z-index: 2;
        }

        .cta-banner-content {
          max-width: 680px;
          margin: 0 auto;
          text-align: center;
        }

        .cta-banner-title,
        .how-it-works-div-4 h1,
        .how-it-works-div-4 h2 {
          font-family: 'Poppins', sans-serif;
          font-size: 2.85rem;
          font-weight: 800;
          color: #000000;
          margin: 0 0 16px;
          line-height: 1.2;
        }

        .cta-banner-sub,
        .how-it-works-div-4 p {
          font-family: 'Inter', sans-serif;
          font-size: 1.05rem;
          color: #000000;
          line-height: 1.6;
          margin: 0 auto 30px;
          max-width: 620px;
          font-weight: 500;
        }

        .cta-banner-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #FF8066;
          color: #FFFFFF;
          font-family: 'Poppins', sans-serif;
          font-size: 0.98rem;
          font-weight: 700;
          border: none;
          border-radius: 10px;
          padding: 13px 32px;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          transition: transform 0.2s ease, background 0.2s ease;
        }

        .cta-banner-btn:hover {
          background: #FF6647;
          transform: translateY(-2px);
        }

        /* DESKTOP / MOBILE SWITCHING FOR PROCESS SECTION */
        .process-desktop-view {
          display: block;
        }

        .process-mobile-view {
          display: none;
        }

        @media (max-width: 992px) and (min-width: 769px) {
          .process-steps-grid {
            grid-template-columns: 1fr;
          }
          .process-connecting-curve {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .process-desktop-view {
            display: none !important;
          }

          .process-mobile-view {
            display: block !important;
          }

          .process-section {
            background-color: #F4F8F8 !important;
            padding: 44px 16px 54px !important;
          }

          /* Header */
          .hiw-mobile-head {
            text-align: center;
            margin-bottom: 28px;
          }

          .hiw-mobile-eyebrow {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            font-family: 'Poppins', sans-serif;
            font-size: 13px;
            font-weight: 700;
            color: #087F8C;
            letter-spacing: 1.8px;
            text-transform: uppercase;
            margin-bottom: 10px;
          }

          .hiw-mobile-dash {
            font-weight: 700;
            color: #087F8C;
          }

          .hiw-mobile-title {
            font-family: 'Poppins', sans-serif;
            font-size: 32px;
            font-weight: 800;
            color: #12263A;
            line-height: 1.2;
            letter-spacing: -0.6px;
            margin: 0 0 12px;
          }

          .hiw-mobile-title-highlight {
            color: #087F8C;
          }

          .hiw-mobile-sub {
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            color: #5E7285;
            line-height: 1.55;
            max-width: 320px;
            margin: 0 auto;
          }

          /* Cards Stack */
          .hiw-mobile-cards-stack {
            display: flex;
            flex-direction: column;
            gap: 16px;
            width: 100%;
            max-width: 440px;
            margin: 0 auto;
          }

          .hiw-mobile-card {
            background: #FFFFFF;
            border-radius: 24px;
            padding: 24px 20px 22px;
            box-shadow: 0 4px 20px rgba(8, 127, 140, 0.04);
            display: flex;
            align-items: flex-start;
            gap: 15px;
            border: 1px solid rgba(220, 238, 236, 0.6);
            box-sizing: border-box;
          }

          .hiw-mobile-card-left {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            margin-top: -2px;
          }

          .hiw-mobile-num-circle {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: #E0F7F6;
            color: #087F8C;
            font-family: 'Poppins', sans-serif;
            font-size: 18px;
            font-weight: 800;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .hiw-mobile-card-body {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-width: 0;
          }

          .hiw-mobile-card-title-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            margin-bottom: 8px;
            min-height: 38px;
          }

          .hiw-mobile-card-title {
            font-family: 'Poppins', sans-serif;
            font-size: 16.5px;
            font-weight: 800;
            color: #12263A;
            margin: 0;
            line-height: 1.28;
          }

          .hiw-mobile-corner-icon {
            width: 34px;
            height: 34px;
            object-fit: contain;
            flex-shrink: 0;
          }

          .hiw-mobile-card-desc {
            font-family: 'Inter', sans-serif;
            font-size: 13.5px;
            color: #556980;
            line-height: 1.55;
            margin: 0;
          }
        }

        @media (max-width: 400px) {
          .hiw-mobile-title {
            font-size: 28px;
          }
          .hiw-mobile-card {
            padding: 20px 16px 18px;
            gap: 12px;
            border-radius: 20px;
          }
          .hiw-mobile-num-circle {
            width: 38px;
            height: 38px;
            font-size: 16px;
          }
          .hiw-mobile-card-title {
            font-size: 15px;
          }
          .hiw-mobile-card-desc {
            font-size: 12.5px;
          }
        }

        @media (max-width: 640px) {
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

export default HowItWorksPage;
