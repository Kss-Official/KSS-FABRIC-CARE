import React, { useState, useRef, useEffect } from 'react';
import { useBooking } from '../context/BookingContext';
import { PageHeroBanner } from '../components/hero/PageHeroBanner';
import {
  Shirt,
  Sparkles,
  Tag,
  Truck,
  FileSearch,
  Droplets,
  Wind,
  ShieldCheck,
  PackageCheck,
  Clock,
  Leaf,
  Sun,
  ArrowRight,
  MessageSquare,
  ChevronDown,
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

const ShirtTagIcon = ({ size = 26, color = '#087F8C' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    stroke={color}
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 7L13 9C14 9.5 16 9.5 17 9L21 7L25 10.5L23 13.5L20.5 12.5V25H9.5V12.5L7 13.5L5 10.5L9 7Z" />
    <path d="M21 16L24.5 16L26.5 20.5L23 20.5L21 16Z" stroke="#FF7A59" strokeWidth="1.7" />
    <circle cx="22.5" cy="17.5" r="0.8" fill="#FF7A59" />
  </svg>
);

const InspectionIcon = ({ size = 26, color = '#087F8C' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    stroke={color}
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 7L13 9C14 9.5 16 9.5 17 9L21 7L25 10.5L23 13.5L20.5 12.5V15" />
    <path d="M9.5 12.5L7 13.5L5 10.5L9 7Z" />
    <path d="M9.5 12.5V25H16" />
    <circle cx="21" cy="20" r="4.2" stroke="#FF7A59" strokeWidth="1.9" />
    <path d="M24 23L27.5 26.5" stroke="#FF7A59" strokeWidth="2.2" />
  </svg>
);

const DropletsSparkleIcon = ({ size = 26, color = '#087F8C' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    stroke={color}
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 6C14 6 7.5 14 7.5 19C7.5 22.6 10.4 25.5 14 25.5C17.6 25.5 20.5 22.6 20.5 19C20.5 14 14 6 14 6Z" />
    <path d="M24 7V13M21 10H27" stroke="#FF7A59" strokeWidth="1.8" />
    <path d="M26 15V19M24 17H28" stroke="#087F8C" strokeWidth="1.6" />
  </svg>
);

const DrumWashIcon = ({ size = 26, color = '#087F8C' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    stroke={color}
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="6" y="5" width="20" height="22" rx="3.5" />
    <circle cx="16" cy="17" r="5.5" />
    <circle cx="16" cy="17" r="2.5" />
    <circle cx="10" cy="9" r="1.2" fill={color} />
    <circle cx="14" cy="9" r="1.2" fill={color} />
  </svg>
);

const IronIcon = ({ size = 26, color = '#087F8C' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    stroke={color}
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 5C12 6.5 13 7 13 8" stroke="#FF7A59" strokeWidth="1.6" />
    <path d="M16 4C16 5.5 17 6 17 7" stroke="#FF7A59" strokeWidth="1.6" />
    <path d="M6 23H24C25.5 23 27 21.5 27 19.5C27 15 22 13 17 13H6V23Z" />
    <path d="M8 13V10C8 9 9 8 10 8H19" />
  </svg>
);

const ShieldCheckIcon = ({ size = 26, color = '#087F8C' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    stroke={color}
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 5L7 9V16C7 21.5 10.8 25.8 16 27C21.2 25.8 25 21.5 25 16V9L16 5Z" />
    <path d="M11.5 16L14.5 19L20.5 13" stroke="#FF7A59" strokeWidth="2.2" />
  </svg>
);

const PackageGarmentIcon = ({ size = 26, color = '#087F8C' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    stroke={color}
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 6C15 6 14 6.8 14 7.8C14 9.2 16 9.8 16 11" />
    <path d="M16 11L7 15V26C7 26.6 7.4 27 8 27H24C24.6 27 25 26.6 25 26V15L16 11Z" />
    <path d="M16 14V27" strokeDasharray="2 2" strokeWidth="1.6" />
  </svg>
);

const AffordableRatesIcon = ({ size = 32, color = '#087F8C' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    stroke={color}
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 23H9L14 26C16 26.5 18 26 19.5 24.5L24 23C25 22.5 25 21 24 20.5L18 19H12" />
    <path d="M5 19H9V25H5V19Z" />
    <circle cx="21" cy="11" r="5" stroke={color} strokeWidth="1.9" />
    <path d="M19.5 9H22.5M19.5 10.5H22.5M20.2 10.5C20.8 11.2 21.5 11.8 21.8 12.8" stroke={color} strokeWidth="1.4" />
    <path d="M25 6L26.5 4.5" stroke="#FF7A59" strokeWidth="1.8" />
    <path d="M21 4V2" stroke="#FF7A59" strokeWidth="1.8" />
    <path d="M27 10H29" stroke="#FF7A59" strokeWidth="1.8" />
  </svg>
);

const SkinFriendlyIcon = ({ size = 32, color = '#087F8C' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    stroke={color}
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 25C11 25 10 18 15 13C20 8 25 9 25 9C25 9 26 14 21 19C16 24 11 25 11 25Z" />
    <path d="M11 25C15 22 18 18 20 14" strokeWidth="1.6" />
    <path d="M10 19C8 16 9 13 11 11C13 13 14 15 13 17" strokeWidth="1.6" />
    <path d="M25 6L26.5 4.5" stroke="#FF7A59" strokeWidth="1.8" />
    <path d="M22 4V2" stroke="#FF7A59" strokeWidth="1.8" />
    <path d="M27 9H29" stroke="#FF7A59" strokeWidth="1.8" />
  </svg>
);

const UvSafeIcon = ({ size = 32, color = '#087F8C' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    stroke={color}
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10 7L13 9C14 9.5 16 9.5 17 9L20 7L24 10.5L22 13.5L19.5 12.5V25H16.5" />
    <path d="M10 7L6 10.5L8 13.5L10.5 12.5V17" />
    <path d="M6 19C7.5 18 9 20 10.5 19C12 18 13.5 20 15 19" stroke="#FF7A59" strokeWidth="1.8" />
    <path d="M6 22C7.5 21 9 23 10.5 22C12 21 13.5 23 15 22" stroke="#FF7A59" strokeWidth="1.8" />
    <path d="M6 25C7.5 24 9 26 10.5 25C12 24 13.5 26 15 25" stroke="#FF7A59" strokeWidth="1.8" />
  </svg>
);

const LessFreshWaterIcon = ({ size = 32, color = '#087F8C' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    stroke={color}
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 5C15 5 8 13 8 18.5C8 22.5 11.2 26 15.5 26C19.8 26 23 22.5 23 18.5C23 13 15 5 15 5Z" />
    <path d="M13 23C13 23 13 18 17 16C17 16 19 20 17 22C15 23.5 13 23 13 23Z" strokeWidth="1.6" />
    <path d="M13 23C14.5 21.5 16 19 17 16" strokeWidth="1.4" />
    <path d="M24 6L25.8 4.2" stroke="#FF7A59" strokeWidth="1.8" />
    <path d="M21 4V1.8" stroke="#FF7A59" strokeWidth="1.8" />
    <path d="M26 9.5H28.2" stroke="#FF7A59" strokeWidth="1.8" />
  </svg>
);

export const ServicesPage = () => {
  const { startBooking } = useBooking();
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

  const processSteps = [
    {
      num: '01',
      title: 'Tagging & Sorting',
      desc: 'Garments are tagged and sorted.',
      icon: <ShirtTagIcon size={26} color="#087F8C" />
    },
    {
      num: '02',
      title: 'Inspection',
      desc: 'Checked for stains and special care needs.',
      icon: <InspectionIcon size={26} color="#087F8C" />
    },
    {
      num: '03',
      title: 'Stain Treatment',
      desc: 'Pre-treats stains with advanced solutions.',
      icon: <DropletsSparkleIcon size={26} color="#087F8C" />
    },
    {
      num: '04',
      title: (
        <>
          Specialized <br /> Cleaning
        </>
      ),
      desc: 'Gentle, fabric-safe dry cleaning process.',
      icon: <DrumWashIcon size={26} color="#087F8C" />
    },
    {
      num: '05',
      title: 'Finishing',
      desc: 'Pressed and finished for a crisp look.',
      icon: <IronIcon size={26} color="#087F8C" />
    },
    {
      num: '06',
      title: 'Quality Check',
      desc: 'Checked for perfect results.',
      icon: <ShieldCheckIcon size={26} color="#087F8C" />
    },
    {
      num: '07',
      title: 'Packaging',
      desc: 'Neatly packed, ready for delivery.',
      icon: <PackageGarmentIcon size={26} color="#087F8C" />
    }
  ];

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
    <div className="services-page-root">
      {/* 1. HERO BANNER WITH WHITE FADE OVERLAY & HEADINGS */}
      <PageHeroBanner
        bgImage="/assets/services-hero.png"
        eyebrow="OUR SERVICES"
        heading="Our Services"
        subtitle="Professional Garment Care & Premium Dry Cleaning"
        altText="FabriCare Professional Garment Care and Dry Cleaning Specialist"
        hideBlur={true}
        fadeOpacity={0.6}
      />

      {/* 2. CARE THAT GOES BEYOND CLEANING */}
      <section className="beyond-cleaning-section">
        <div className="container">
          <div className="beyond-cleaning-grid">
            <div className="beyond-left-col">
              <div className="beyond-img-card">
                <img
                  src="/assets/garment-specialist-exact.png"
                  alt="Garment Care Specialist Inspecting Suits"
                  className="beyond-specialist-photo"
                />
              </div>
            </div>

            <div className="beyond-right-col">
              <div className="beyond-eyebrow-text">DRY CLEANING</div>
              <h2 className="beyond-section-title">
                Care That Goes <br />
                <span className="highlight-teal">Beyond Cleaning</span>
              </h2>
              <p className="beyond-body-text">
                Our dry cleaning service is designed to care for your delicate and premium garments. Using advanced, fabric-friendly methods, we remove stains, refresh the fabric and maintain the original look and feel of your clothes.
              </p>

              <div className="beyond-features-row">
                <div className="beyond-feature-item">
                  <div className="beyond-circle-icon">
                    <Shirt size={24} color="#087F8C" strokeWidth={2.2} />
                  </div>
                  <span className="beyond-feature-name">
                    Safe for <br />
                    Delicate Fabrics
                  </span>
                </div>

                <div className="beyond-feature-item">
                  <div className="beyond-circle-icon">
                    <Sparkles size={24} color="#087F8C" strokeWidth={2.2} />
                  </div>
                  <span className="beyond-feature-name">
                    Advanced <br />
                    Stain Treatment
                  </span>
                </div>

                <div className="beyond-feature-item">
                  <div className="beyond-circle-icon">
                    <Tag size={24} color="#087F8C" strokeWidth={2.2} />
                  </div>
                  <span className="beyond-feature-name">
                    Transparent <br />
                    Pricing
                  </span>
                </div>

                <div className="beyond-feature-item">
                  <div className="beyond-circle-icon">
                    <Truck size={24} color="#087F8C" strokeWidth={2.2} />
                  </div>
                  <span className="beyond-feature-name">
                    Doorstep Pickup <br />
                    &amp; Delivery
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. OUR DRY CLEANING PROCESS (7 STEPS) */}
      <section className="dry-process-section">
        <div className="container">
          <div className="text-center process-header-wrap">
            <div className="process-eyebrow-line-wrap">
              <span className="eyebrow-decor-line" />
              <span className="eyebrow-text">DRY CLEANING</span>
              <span className="eyebrow-decor-line" />
            </div>
            <h2 className="process-header-title">
              Our <span className="highlight-teal">Dry Cleaning Process</span>
            </h2>
            <p className="process-header-sub">
              Every garment goes through a careful step-by-step process to ensure the best care.
            </p>
          </div>

          <div className="process-timeline-wrapper">
            <div className="process-steps-grid">
              <div className="process-timeline-line" />
              {processSteps.map((step) => (
                <div key={step.num} className="process-step-node">
                  <div className="step-num-pill">{step.num}</div>
                  <div className="step-circle-bubble">{step.icon}</div>
                  <div className="step-text-wrap">
                    <h4 className="step-title">{step.title}</h4>
                    <p className="step-desc">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. OUR PROMISE TO YOU */}
      <section className="our-promise-section">
        <div className="container">
          <div className="text-center promise-header-wrap">
            <div className="promise-eyebrow-line-wrap">
              <span className="eyebrow-decor-line" />
              <h2 className="promise-eyebrow-text">
                OUR <span className="highlight-teal">PROMISE</span> TO YOU
              </h2>
              <span className="eyebrow-decor-line" />
            </div>
          </div>

          <div className="promise-cards-grid">
            <div className="promise-card">
              <div className="promise-icon-bubble">
                <AffordableRatesIcon size={32} color="#087F8C" />
              </div>
              <h3 className="promise-card-title">
                Affordable <br /> Rates
              </h3>
            </div>

            <div className="promise-card">
              <div className="promise-icon-bubble">
                <SkinFriendlyIcon size={32} color="#087F8C" />
              </div>
              <h3 className="promise-card-title">
                Skin Friendly
              </h3>
            </div>

            <div className="promise-card">
              <div className="promise-icon-bubble">
                <UvSafeIcon size={32} color="#087F8C" />
              </div>
              <h3 className="promise-card-title">
                UV Safe <br /> Air Drying
              </h3>
            </div>

            <div className="promise-card">
              <div className="promise-icon-bubble">
                <LessFreshWaterIcon size={32} color="#087F8C" />
              </div>
              <h3 className="promise-card-title">
                Less &amp; Fresh <br /> Water
              </h3>
            </div>
          </div>
        </div>
      </section>

      {/* 5. TRUST CTA BANNER */}
      <section className="trust-cta-section">
        <div className="container">
          <div
            className="trust-cta-banner-card"
            onClick={() => startBooking('dry-cleaning')}
            role="button"
            tabIndex={0}
            aria-label="Trust us for keeping your clothes as good as new - Book Now"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                startBooking('dry-cleaning');
              }
            }}
          >
            <img
              src="/assets/cta-banner-exact.png"
              srcSet="/assets/cta-banner-exact.png 1x, /assets/cta-banner-exact-2x.png 2x"
              alt="Trust us for keeping your clothes as good as new - Book Now"
              className="trust-cta-exact-img"
            />
            <button
              type="button"
              className="trust-cta-hotspot-btn"
              onClick={(e) => {
                e.stopPropagation();
                startBooking('dry-cleaning');
              }}
              aria-label="Book Now"
            />
          </div>
        </div>
      </section>

      {/* 6. FREQUENTLY ASKED QUESTIONS */}
      <section className="services-faq-section">
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

      {/* 7. READY FOR FRESH CLOTHES? (FINAL CTA BANNER) */}
      <section className="services-final-cta-section">
        <div className="services-final-cta-bg-wrapper">
          <img
            src="/assets/services-bottom-cta-bg.jpg"
            alt="Folded fresh laundry garments on table"
            className="services-final-cta-bg-img"
          />
          <div className="services-final-cta-overlay" />
        </div>

        <div className="container services-final-cta-container">
          <div className="services-final-cta-content text-center">
            <h2 className="services-final-cta-title">Ready for fresh clothes?</h2>
            <p className="services-final-cta-sub">
              Experience your first premium laundry order completely hassle-free. Schedule your pickup in under 30 seconds and let our experts handle the rest.
            </p>
            <button
              type="button"
              className="services-final-cta-btn"
              onClick={() => startBooking('dry-cleaning')}
            >
              Book Your Free Pickup
            </button>
          </div>
        </div>
      </section>

      <style>{`
        .services-page-root {
          width: 100%;
          background-color: #FAFCFC;
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .highlight-teal {
          color: #087F8C;
        }

        /* ==========================================================================
           1. HERO BANNER (PURE IMAGE)
           ========================================================================== */
        .services-div-1 {
          width: 100%;
          line-height: 0;
          overflow: hidden;
          background-color: #FAFCFC;
        }

        .services-hero-pure-img {
          width: 100%;
          height: auto;
          max-height: 540px;
          object-fit: cover;
          object-position: top center;
          display: block;
          image-rendering: -webkit-optimize-contrast;
        }

        /* ==========================================================================
           2. CARE THAT GOES BEYOND CLEANING
           ========================================================================== */
        .beyond-cleaning-section {
          padding: 95px 0 90px;
          background: #FFFFFF;
        }

        .beyond-cleaning-grid {
          display: grid;
          grid-template-columns: 460px 1fr;
          gap: 64px;
          align-items: center;
        }

        .beyond-img-card {
          width: 100%;
          border-radius: 28px;
          overflow: hidden;
          box-shadow: 0 18px 46px rgba(18, 38, 58, 0.08);
          background: #FFFFFF;
        }

        .beyond-specialist-photo {
          width: 100%;
          height: auto;
          display: block;
          border-radius: 28px;
        }

        .beyond-eyebrow-text {
          font-family: 'Poppins', sans-serif;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 2px;
          color: #087F8C;
          text-transform: uppercase;
          margin-bottom: 14px;
        }

        .beyond-section-title {
          font-family: 'Poppins', sans-serif;
          font-size: 46px;
          font-weight: 800;
          color: #12263A;
          letter-spacing: -1.2px;
          line-height: 1.15;
          margin: 0 0 18px;
        }

        .beyond-body-text {
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          line-height: 1.68;
          color: #556980;
          margin: 0 0 38px;
          max-width: 580px;
        }

        .beyond-features-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .beyond-feature-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 12px;
        }

        .beyond-circle-icon {
          width: 62px;
          height: 62px;
          border-radius: 50%;
          background: #D2F4F0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.25s ease, background 0.25s ease;
        }

        .beyond-feature-item:hover .beyond-circle-icon {
          transform: translateY(-3px);
          background: #BCEAE6;
        }

        .beyond-feature-name {
          font-family: 'Poppins', sans-serif;
          font-size: 13.5px;
          font-weight: 700;
          color: #12263A;
          line-height: 1.35;
        }

        /* ==========================================================================
           3. PROCESS TIMELINE
           ========================================================================== */
        .dry-process-section {
          padding: 90px 0 95px;
          background: #F0F9F9;
        }

        .process-header-wrap {
          margin-bottom: 50px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .process-eyebrow-line-wrap {
          display: inline-flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 12px;
        }

        .eyebrow-decor-line {
          width: 38px;
          height: 2px;
          background: #087F8C;
          border-radius: 2px;
        }

        .eyebrow-text {
          font-family: 'Poppins', sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: #087F8C;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }

        .process-header-title {
          font-family: 'Poppins', sans-serif;
          font-size: 42px;
          font-weight: 800;
          color: #12263A;
          letter-spacing: -1px;
          margin: 0 0 12px;
        }

        .process-header-title .highlight-teal {
          color: #087F8C;
        }

        .process-header-sub {
          font-family: 'Inter', sans-serif;
          font-size: 15.5px;
          color: #556980;
          margin: 0;
          max-width: 620px;
          line-height: 1.5;
        }

        .process-timeline-wrapper {
          position: relative;
          max-width: 1220px;
          margin: 0 auto;
          padding: 10px 0 20px;
        }

        .process-timeline-line {
          position: absolute;
          top: 65px;
          left: calc(100% / 14);
          right: calc(100% / 14);
          height: 2px;
          background: #7EDCD2;
          z-index: 1;
        }

        .process-steps-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 16px;
          position: relative;
          z-index: 2;
        }

        .process-step-node {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
        }

        .step-num-pill {
          font-family: 'Poppins', sans-serif;
          font-size: 14px;
          font-weight: 800;
          color: #087F8C;
          line-height: 1;
          margin-bottom: 14px;
          letter-spacing: 0.5px;
        }

        .step-circle-bubble {
          width: 74px;
          height: 74px;
          border-radius: 50%;
          background: #FFFFFF;
          border: 2px solid #7EDCD2;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 0 8px #E2F5F3;
          margin-bottom: 14px;
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
          position: relative;
          z-index: 2;
        }

        .process-step-node:hover .step-circle-bubble {
          transform: translateY(-3px);
          border-color: #087F8C;
          box-shadow: 0 0 0 10px #D3EFEA, 0 8px 20px rgba(8, 127, 140, 0.15);
        }

        .step-text-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .step-title {
          font-family: 'Poppins', sans-serif;
          font-size: 14.5px;
          font-weight: 800;
          color: #12263A;
          margin: 0 0 6px;
          line-height: 1.25;
          min-height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .step-desc {
          font-family: 'Inter', sans-serif;
          font-size: 12.5px;
          color: #64748B;
          line-height: 1.45;
          margin: 0;
          max-width: 145px;
        }

        /* ==========================================================================
           4. OUR PROMISE TO YOU
           ========================================================================== */
        .our-promise-section {
          padding: 85px 0 95px;
          background: #F0F9F9;
        }

        .promise-header-wrap {
          margin-bottom: 50px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .promise-eyebrow-line-wrap {
          display: inline-flex;
          align-items: center;
          gap: 16px;
        }

        .promise-eyebrow-text {
          font-family: 'Poppins', sans-serif;
          font-size: 22px;
          font-weight: 800;
          color: #12263A;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin: 0;
        }

        .promise-eyebrow-text .highlight-teal {
          color: #087F8C;
        }

        .promise-cards-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 26px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .promise-card {
          background: #FFFFFF;
          border: 1px solid #E4F3F1;
          border-radius: 24px;
          padding: 48px 24px 42px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-shadow: 0 4px 20px rgba(18, 38, 58, 0.03);
          transition: all 0.25s ease;
        }

        .promise-card:hover {
          transform: translateY(-4px);
          border-color: #7EDCD2;
          box-shadow: 0 12px 28px rgba(8, 127, 140, 0.09);
        }

        .promise-icon-bubble {
          width: 76px;
          height: 76px;
          border-radius: 50%;
          background: #E3F5F3;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          transition: transform 0.25s ease;
        }

        @media (hover: hover) and (pointer: fine) {
          .promise-card:hover .promise-icon-bubble {
            transform: scale(1.06);
          }
        }

        .promise-card-title {
          font-family: 'Poppins', sans-serif;
          font-size: 16.5px;
          font-weight: 800;
          color: #12263A;
          line-height: 1.35;
          margin: 0;
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ==========================================================================
           5. TRUST CTA BANNER
           ========================================================================== */
        .trust-cta-section {
          padding: 20px 0 70px;
          background: #F0F9F9;
        }

        .trust-cta-banner-card {
          max-width: 1040px;
          margin: 0 auto;
          position: relative;
          cursor: pointer;
          transition: transform 0.25s ease;
        }

        .trust-cta-banner-card:hover {
          transform: translateY(-3px);
        }

        .trust-cta-exact-img {
          width: 100%;
          height: auto;
          display: block;
          image-rendering: -webkit-optimize-contrast;
        }

        .trust-cta-hotspot-btn {
          position: absolute;
          left: 80.2%;
          top: 38%;
          width: 12.6%;
          height: 17%;
          background: transparent;
          border: none;
          cursor: pointer;
          z-index: 2;
          border-radius: 999px;
          color: transparent;
          font-size: 0;
          line-height: 0;
          overflow: hidden;
          transition: all 0.2s ease;
        }

        .trust-cta-hotspot-btn:focus-visible {
          outline: 2px solid #FF6247;
        }

        /* ==========================================================================
           6. FREQUENTLY ASKED QUESTIONS
           ========================================================================== */
        .services-faq-section {
          padding: 85px 0 110px;
          background: radial-gradient(circle at 88% 18%, rgba(190, 244, 238, 0.45) 0%, rgba(246, 252, 251, 1) 52%);
          position: relative;
        }

        .faq-head-wrap {
          margin-bottom: 48px;
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
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
          font-size: 42px;
          font-weight: 800;
          color: #12263A;
          letter-spacing: -1px;
          margin: 0 0 12px;
          line-height: 1.2;
        }

        .faq-highlight-text {
          color: #087F8C;
        }

        .faq-subtitle {
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          color: #64748B;
          max-width: 580px;
          margin: 0 auto;
          line-height: 1.55;
        }

        .faq-accordion-list {
          max-width: 840px;
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
          border: 1px solid #E4F3F1;
          box-shadow: 0 4px 18px rgba(18, 38, 58, 0.03);
          overflow: hidden;
          transition: all 0.25s ease;
        }

        .faq-card-item:hover {
          border-color: #BCEAE6;
          box-shadow: 0 8px 24px rgba(8, 127, 140, 0.06);
        }

        .faq-card-item.open {
          border-color: #A3E5DD;
          box-shadow: 0 8px 24px rgba(8, 127, 140, 0.07);
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
          width: 34px;
          height: 34px;
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
        }

        .faq-answer-block {
          padding: 0 28px 24px 28px;
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
          line-height: 1.65;
          margin: 0;
        }

        /* ==========================================================================
           RESPONSIVE STYLING
           ========================================================================== */
        @media (max-width: 1024px) and (min-width: 769px) {
          .beyond-cleaning-grid {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          .beyond-specialist-photo {
            height: 360px;
          }
          .process-steps-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 24px;
          }
          .process-timeline-line {
            display: none;
          }
          .trust-cta-banner-card {
            padding: 0;
          }
        }

        @media (max-width: 768px) {
          .services-hero-pure-img {
            max-height: 320px;
            object-position: top center;
          }

          /* Part 1: Care That Goes Beyond Cleaning */
          .beyond-cleaning-section {
            padding: 40px 0 50px !important;
            background: #FFFFFF !important;
          }
          .beyond-cleaning-grid {
            display: flex !important;
            flex-direction: column !important;
            gap: 24px !important;
            max-width: 440px !important;
            margin: 0 auto !important;
          }
          .beyond-img-card {
            border-radius: 24px !important;
            overflow: hidden !important;
            box-shadow: 0 10px 28px rgba(18, 38, 58, 0.08) !important;
            width: 100% !important;
          }
          .beyond-specialist-photo {
            border-radius: 24px !important;
            width: 100% !important;
            height: auto !important;
            max-height: 290px !important;
            object-fit: cover !important;
            display: block !important;
          }
          .beyond-right-col {
            text-align: left !important;
          }
          .beyond-eyebrow-text {
            font-size: 13px !important;
            font-weight: 800 !important;
            letter-spacing: 1.5px !important;
            color: #087F8C !important;
            margin-bottom: 8px !important;
          }
          .beyond-section-title {
            font-size: 28px !important;
            font-weight: 800 !important;
            color: #12263A !important;
            line-height: 1.2 !important;
            letter-spacing: -0.5px !important;
            margin: 0 0 12px !important;
          }
          .beyond-body-text {
            font-size: 13.5px !important;
            line-height: 1.6 !important;
            color: #556980 !important;
            margin: 0 0 24px !important;
            max-width: 100% !important;
          }
          .beyond-features-row {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 12px !important;
          }
          .beyond-feature-item {
            background: #FFFFFF !important;
            border: 1.5px solid #E6EFF0 !important;
            border-radius: 18px !important;
            padding: 18px 12px !important;
            box-shadow: 0 4px 14px rgba(18, 38, 58, 0.04) !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            gap: 8px !important;
          }
          .beyond-circle-icon {
            width: 48px !important;
            height: 48px !important;
            border-radius: 50% !important;
            background: #E0F7F6 !important;
            color: #087F8C !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            margin-bottom: 2px !important;
          }
          .beyond-feature-name {
            font-family: 'Poppins', sans-serif !important;
            font-size: 13px !important;
            font-weight: 700 !important;
            color: #12263A !important;
            line-height: 1.25 !important;
          }

          /* Part 2: Our Dry Cleaning Process (Vertical Timeline Stepper) */
          .dry-process-section {
            padding: 48px 0 54px !important;
            background: #F0F9F8 !important;
          }
          .process-header-wrap {
            margin-bottom: 32px !important;
          }
          .process-header-title {
            font-size: 27px !important;
            font-weight: 800 !important;
            letter-spacing: -0.5px !important;
            margin: 0 0 8px !important;
          }
          .process-header-sub {
            font-size: 13px !important;
            color: #556980 !important;
            max-width: 320px !important;
            margin: 0 auto !important;
            line-height: 1.45 !important;
          }
          .process-timeline-wrapper {
            position: relative !important;
            max-width: 440px !important;
            margin: 0 auto !important;
            padding: 10px 0 !important;
          }
          .process-timeline-line {
            display: block !important;
            position: absolute !important;
            top: 24px !important;
            bottom: 24px !important;
            left: 60px !important;
            right: auto !important;
            width: 2px !important;
            height: auto !important;
            background: #9DE0D9 !important;
            z-index: 1 !important;
          }
          .process-steps-grid {
            display: flex !important;
            flex-direction: column !important;
            gap: 20px !important;
            position: relative !important;
            z-index: 2 !important;
          }
          .process-step-node {
            display: grid !important;
            grid-template-columns: 28px 46px 1fr !important;
            align-items: center !important;
            gap: 12px !important;
            text-align: left !important;
          }
          .step-num-pill {
            font-family: 'Poppins', sans-serif !important;
            font-size: 13px !important;
            font-weight: 800 !important;
            color: #087F8C !important;
            text-align: right !important;
            margin-bottom: 0 !important;
            line-height: 1 !important;
            justify-self: end !important;
          }
          .step-circle-bubble {
            width: 44px !important;
            height: 44px !important;
            border-radius: 50% !important;
            background: #FFFFFF !important;
            border: 2px solid #7EDCD2 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            box-shadow: 0 0 0 5px #E2F5F3 !important;
            margin-bottom: 0 !important;
            justify-self: center !important;
          }
          .step-text-wrap {
            display: flex !important;
            flex-direction: column !important;
            text-align: left !important;
            justify-content: center !important;
          }
          .step-title {
            font-family: 'Poppins', sans-serif !important;
            font-size: 14px !important;
            font-weight: 800 !important;
            color: #12263A !important;
            margin: 0 0 2px !important;
            line-height: 1.25 !important;
            min-height: unset !important;
            display: block !important;
            text-align: left !important;
          }
          .step-title br {
            display: none !important;
          }
          .step-desc {
            font-family: 'Inter', sans-serif !important;
            font-size: 12px !important;
            color: #64748B !important;
            line-height: 1.35 !important;
            margin: 0 !important;
            max-width: 100% !important;
            text-align: left !important;
          }

          /* Part 3: Our Promise to You */
          .our-promise-section {
            padding: 44px 0 50px !important;
            background: #FFFFFF !important;
          }
          .promise-header-wrap {
            margin-bottom: 24px !important;
          }
          .promise-eyebrow-text {
            font-size: 14px !important;
            letter-spacing: 1.5px !important;
          }
          .promise-cards-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 12px !important;
            max-width: 440px !important;
            margin: 0 auto !important;
          }
          .promise-card {
            background: #FFFFFF !important;
            border: 1.5px solid #E6EFF0 !important;
            border-radius: 18px !important;
            padding: 18px 12px 16px !important;
            text-align: center !important;
            box-shadow: 0 4px 14px rgba(18, 38, 58, 0.04) !important;
          }
          .promise-icon-bubble {
            width: 48px !important;
            height: 48px !important;
            border-radius: 50% !important;
            background: #E0F7F6 !important;
            margin: 0 auto 10px !important;
          }
          .promise-card-title {
            font-size: 13px !important;
            font-weight: 700 !important;
            color: #12263A !important;
            line-height: 1.25 !important;
            min-height: unset !important;
          }

          /* Part 4: Trust CTA Banner Card */
          .trust-cta-section {
            padding: 10px 0 44px !important;
            background: #FFFFFF !important;
          }
          .trust-cta-banner-card {
            max-width: 440px !important;
            margin: 0 auto !important;
            border-radius: 20px !important;
            overflow: hidden !important;
            box-shadow: 0 8px 24px rgba(8, 127, 140, 0.12) !important;
          }
          .trust-cta-exact-img {
            width: 100% !important;
            height: auto !important;
            display: block !important;
          }

          /* FAQ mobile */
          .faq-question-btn {
            padding: 16px 18px !important;
          }
          .faq-answer-inner {
            margin-left: 0 !important;
            padding-left: 14px !important;
          }
          .faq-q-title {
            font-size: 14.5px !important;
          }
        }

        @media (max-width: 420px) {
          .beyond-section-title {
            font-size: 25px !important;
          }
          .beyond-features-row {
            gap: 8px !important;
          }
          .beyond-feature-item {
            padding: 14px 8px !important;
          }
          .beyond-feature-name {
            font-size: 12px !important;
          }
          .process-header-title {
            font-size: 25px !important;
          }
          .promise-cards-grid {
            gap: 8px !important;
          }
          .promise-card {
            padding: 14px 8px !important;
          }
        }

        /* ==========================================================================
           7. READY FOR FRESH CLOTHES? (FINAL CTA BANNER)
           ========================================================================== */
        .services-final-cta-section {
          position: relative;
          padding: 105px 0;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .services-final-cta-bg-wrapper {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
        }

        .services-final-cta-bg-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 38%;
          display: block;
        }

        .services-final-cta-overlay {
          position: absolute;
          inset: 0;
          background: rgba(14, 126, 137, 0.88);
          z-index: 1;
        }

        .services-final-cta-container {
          position: relative;
          z-index: 2;
        }

        .services-final-cta-content {
          max-width: 720px;
          margin: 0 auto;
          text-align: center;
        }

        .services-final-cta-title {
          font-family: 'Poppins', sans-serif;
          font-size: 44px;
          font-weight: 800;
          color: #FFFFFF;
          margin: 0 0 16px;
          line-height: 1.2;
          letter-spacing: -0.5px;
        }

        .services-final-cta-sub {
          font-family: 'Inter', sans-serif;
          font-size: 15.5px;
          color: rgba(255, 255, 255, 0.95);
          line-height: 1.6;
          margin: 0 auto 32px;
          max-width: 660px;
        }

        .services-final-cta-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #FF755B;
          color: #FFFFFF;
          font-family: 'Poppins', sans-serif;
          font-size: 15.5px;
          font-weight: 700;
          border: none;
          border-radius: 10px;
          padding: 14px 36px;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);
          transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
        }

        .services-final-cta-btn:hover {
          background: #E85B42;
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.22);
        }

        @media (max-width: 768px) {
          .services-final-cta-section {
            padding: 70px 0;
          }
          .services-final-cta-title {
            font-size: 32px;
          }
          .services-final-cta-sub {
            font-size: 14.5px;
            margin-bottom: 26px;
          }
        }
      `}</style>
    </div>
  );
};

export default ServicesPage;
