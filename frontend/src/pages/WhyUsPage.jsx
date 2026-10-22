import React, { useState, useRef, useEffect } from 'react';
import { useBooking } from '../context/BookingContext';
import { PageHeroBanner } from '../components/hero/PageHeroBanner';
import {
  WashingMachine,
  Check,
  Truck,
  CalendarCheck,
  Award,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Clock,
  HeartHandshake,
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

export const WhyUsPage = () => {
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
    <div className="why-us-page-wrapper">
      {/* 1. HERO BANNER WITH WHITE FADE OVERLAY & HEADINGS */}
      <PageHeroBanner
        bgImage="/assets/why-us-hero.png"
        heading="Why Choose Us"
        subtitle="Affordable, Reliable & Eco-Friendly Laundry Care"
        altText="Why FabriCare - Premium Laundry & Garment Care"
      />

      {/* 2. BENTO GRID SECTION (Div 5) */}
      <section className="why-us-bento-section">
        <div className="container">
          <div className="why-us-bento-container">
            {/* Left Hero Card */}
            <div className="why-hero-col">
              <div className="why-machine-icon-box">
                <WashingMachine size={26} strokeWidth={2} />
              </div>

              <h3 className="why-hero-title">
                WHY PEOPLE<br />CHOOSE US?
              </h3>

              <div className="why-checklist">
                <div className="why-check-item">
                  <span className="why-check-circle">
                    <Check size={14} strokeWidth={3} />
                  </span>
                  <span className="why-check-label">Same-Day Delivery</span>
                </div>

                <div className="why-check-item">
                  <span className="why-check-circle">
                    <Check size={14} strokeWidth={3} />
                  </span>
                  <span className="why-check-label">Free Pickup &amp; Drop<br />(Above ₹500)</span>
                </div>

                <div className="why-check-item">
                  <span className="why-check-circle">
                    <Check size={14} strokeWidth={3} />
                  </span>
                  <span className="why-check-label">Satisfaction Guaranteed</span>
                </div>

                <div className="why-check-item">
                  <span className="why-check-circle">
                    <Check size={14} strokeWidth={3} />
                  </span>
                  <span className="why-check-label">Trained Professionals</span>
                </div>

                <div className="why-check-item">
                  <span className="why-check-circle">
                    <Check size={14} strokeWidth={3} />
                  </span>
                  <span className="why-check-label">Eco-Friendly Packaging</span>
                </div>
              </div>

              <button
                type="button"
                className="why-contact-btn"
                onClick={() => startBooking()}
              >
                <span>Book a Pickup</span>
                <ArrowRight size={17} />
              </button>
            </div>

            {/* 4 Bento Grid Cards */}
            <div className="why-grid-cards">
              {/* Card 1: Top-Left (Mint bg) */}
              <div className="why-card-cell mint-bg">
                <div className="why-icon-bubble mint-bubble">
                  <Truck size={22} strokeWidth={2.2} />
                </div>
                <h4 className="why-cell-title dark-text">Same-Day Delivery</h4>
                <p className="why-cell-desc">
                  We offer same-day delivery for many of our services with our efficient team, enjoy clean and fresh items without the hassle of waiting.
                </p>
              </div>

              {/* Card 2: Top-Right (White bg) */}
              <div className="why-card-cell white-bg">
                <div className="why-icon-bubble peach-bubble">
                  <CalendarCheck size={22} strokeWidth={2.2} />
                </div>
                <h4 className="why-cell-title teal-text">
                  Free Pickup &amp; Drop<br />(Above ₹500)
                </h4>
                <p className="why-cell-desc">
                  We offer a range of services that can be delivered right to your doorstep, making laundry and cleaning easier than ever.
                </p>
              </div>

              {/* Card 3: Bottom-Left (White bg) */}
              <div className="why-card-cell white-bg">
                <div className="why-icon-bubble mint-bubble">
                  <WashingMachine size={22} strokeWidth={2.2} />
                </div>
                <h4 className="why-cell-title teal-text">Latest Equipment</h4>
                <p className="why-cell-desc">
                  We use only the best techniques and equipment to ensure your clothes and other items are cleaned to the highest standard.
                </p>
              </div>

              {/* Card 4: Bottom-Right (Deep Teal bg) */}
              <div className="why-card-cell dark-teal-bg">
                <div className="why-icon-bubble dark-bubble">
                  <Award size={22} strokeWidth={2.2} />
                </div>
                <h4 className="why-cell-title white-text">Reasonable Pricing</h4>
                <p className="why-cell-desc white-desc">
                  We offer competitive pricing for all of our services, without sacrificing quality.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FREQUENTLY ASKED QUESTIONS (DIV 3 - EXACT MATCH OF REFERENCE IMAGE) */}
      <section className="why-us-div-3 why-faq-section" id="faq-section">
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



      {/* 5. CTA BANNER (DIV 10) */}
      <section className="cta-banner-section">
        <div className="cta-banner-bg-wrapper">
          <img
            src="/assets/cta-folded-clothes.jpg"
            alt="FabriCare clean garments"
            className="cta-banner-bg-img"
          />
          <div className="cta-banner-overlay" />
        </div>
        <div className="container cta-banner-container">
          <div className="cta-banner-content">
            <h2 className="cta-banner-title">
              See the Difference in Your Very First Order
            </h2>
            <p className="cta-banner-sub">
              Experience hassle-free laundry with free pickup &amp; delivery on orders above ₹500.
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
        .why-us-page-wrapper {
          background-color: #FAFCFC;
          width: 100%;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        /* ==========================================================================
           DIV 1: HERO BANNER (PURE IMAGE)
           ========================================================================== */
        .why-us-div-1 {
          width: 100%;
          line-height: 0;
          overflow: hidden;
          background-color: #FAFCFC;
        }

        .why-hero-pure-img {
          width: 100%;
          height: auto;
          max-height: 520px;
          object-fit: cover;
          object-position: top center;
          display: block;
        }

        /* BENTO SECTION */
        .why-us-bento-section {
          padding: 90px 0;
          background: #EEF2F2;
        }

        .why-us-bento-container {
          display: grid;
          grid-template-columns: 340px 1fr;
          gap: 24px;
          align-items: stretch;
        }

        .why-hero-col {
          background-color: #087F8C;
          border-radius: 28px;
          padding: 40px 32px;
          display: flex;
          flex-direction: column;
          color: #FFFFFF;
          box-shadow: 0 12px 32px rgba(8, 127, 140, 0.25);
        }

        .why-machine-icon-box {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          background-color: rgba(255, 255, 255, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          color: #FFFFFF;
        }

        .why-hero-title {
          font-family: 'Poppins', sans-serif;
          font-size: 26px;
          font-weight: 800;
          line-height: 1.25;
          letter-spacing: -0.5px;
          margin: 0 0 28px;
        }

        .why-checklist {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 36px;
          flex-grow: 1;
        }

        .why-check-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .why-check-circle {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .why-check-label {
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 600;
          line-height: 1.35;
        }

        .why-contact-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #FF6B54;
          color: #FFFFFF;
          font-family: 'Poppins', sans-serif;
          font-size: 14px;
          font-weight: 700;
          border: none;
          border-radius: 12px;
          padding: 13px 24px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 6px 18px rgba(255, 107, 84, 0.35);
        }

        .why-contact-btn:hover {
          background: #E8553F;
          transform: translateY(-2px);
        }

        .why-grid-cards {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        .why-card-cell {
          border-radius: 24px;
          padding: 32px 28px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 8px 24px rgba(18, 38, 58, 0.04);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .why-card-cell:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 36px rgba(18, 38, 58, 0.08);
        }

        .mint-bg {
          background-color: #EBF7F6;
          border: 1px solid #D5EFEA;
        }

        .white-bg {
          background-color: #FFFFFF;
          border: 1.5px solid #EEF2F6;
        }

        .dark-teal-bg {
          background-color: #0E4B56;
          border: 1px solid #0E4B56;
        }

        .why-icon-bubble {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }

        .mint-bubble {
          background: #087F8C;
          color: #FFFFFF;
        }

        .peach-bubble {
          background: #FFE8E4;
          color: #FF6B54;
        }

        .dark-bubble {
          background: rgba(255, 255, 255, 0.15);
          color: #5EEAD4;
        }

        .why-cell-title {
          font-family: 'Poppins', sans-serif;
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 12px;
          line-height: 1.3;
        }

        .dark-text { color: #12263A; }
        .teal-text { color: #087F8C; }
        .white-text { color: #FFFFFF; }

        .why-cell-desc {
          font-size: 14px;
          color: #556980;
          line-height: 1.6;
          margin: 0;
        }

        .white-desc {
          color: #D1E5E8;
        }

        /* ==========================================================================
           DIV 3: FREQUENTLY ASKED QUESTIONS
           ========================================================================== */
        .why-us-div-3 {
          padding: 100px 0 115px;
          background: radial-gradient(circle at 88% 16%, rgba(180, 242, 236, 0.45) 0%, rgba(244, 250, 249, 1) 48%);
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

        .cta-banner-title {
          font-family: 'Poppins', sans-serif;
          font-size: 2.85rem;
          font-weight: 800;
          color: #FFFFFF;
          margin: 0 0 16px;
          line-height: 1.2;
        }

        .cta-banner-sub {
          font-size: 1.05rem;
          color: rgba(255, 255, 255, 0.95);
          line-height: 1.6;
          margin: 0 auto 30px;
          max-width: 620px;
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

        @media (max-width: 992px) {
          .why-us-bento-container {
            grid-template-columns: 1fr;
          }
          .why-grid-cards {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .why-hero-pure-img {
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

export default WhyUsPage;
