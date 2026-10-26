import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  HelpCircle,
  MessageSquare,
  ShieldCheck,
  Leaf,
  Truck,
  IndianRupee,
  Clock,
  Plus,
  Minus
} from 'lucide-react';

const HangerIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2a3 3 0 0 0-3 3c0 .8.4 1.5 1 2L2 14v2h20v-2L14 7c.6-.5 1-1.2 1-2a3 3 0 0 0-3-3z" />
    <path d="M2 16h20" />
  </svg>
);

export const FAQAccordion = ({ items, customTitle, customTag }) => {
  const [openIndex, setOpenIndex] = useState(0);
  const accordionRef = useRef(null);

  useEffect(() => {
    if (openIndex === -1) return;

    const handleClickOutside = (event) => {
      if (accordionRef.current && !accordionRef.current.contains(event.target)) {
        setOpenIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [openIndex]);

  const defaultItems = [
    {
      icon: 'hanger',
      question: 'Do you offer premium care for delicate or designer garments?',
      answer:
        'Yes! We provide specialized care for designer wear, delicate fabrics (like silk, linen, chiffon, wool) and expensive garments. Our team uses gentle cleaning methods and premium detergents to keep your clothes safe and looking their best.'
    },
    {
      icon: 'rupee',
      question: 'Is there a minimum order value for pickup and delivery?',
      answer:
        'Free doorstep pickup and delivery is available for orders above ₹300–₹500 depending on your area. For smaller orders, a nominal delivery fee applies.'
    },
    {
      icon: 'truck',
      question: 'What locations do you serve?',
      answer:
        'We currently serve major residential societies, corporate hubs, and surrounding neighborhoods with convenient daily morning and evening pickup and delivery slots.'
    },
    {
      icon: 'leaf',
      question: 'How does pickup and delivery work?',
      answer:
        'Simply select your services, enter your address, and choose your preferred 2-hour pickup time window. Our verified rider will arrive with laundry bags, verify your items, and deliver them fresh within 24–48 hours.'
    },
    {
      icon: 'shield',
      question: 'What are your prices and is there any hidden cost?',
      answer:
        'Our pricing is 100% transparent with no hidden charges. Everyday wash starts from ₹60/kg, and individual steam pressing from ₹20/pc. All taxes and standard eco-friendly packing are included.'
    },
    {
      icon: 'clock',
      question: 'How long does it take to get my clothes back?',
      answer:
        'Our standard turnaround is 48 hours for standard laundry and dry cleaning. We also provide an Express 24-hour delivery option for urgent orders.'
    }
  ];

  const faqList = items || defaultItems;

  const toggleItem = (index) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  const renderItemIcon = (type) => {
    switch (type) {
      case 'hanger':
        return <HangerIcon size={19} color="#087F8C" />;
      case 'shield':
        return <ShieldCheck size={20} strokeWidth={2} color="#087F8C" />;
      case 'leaf':
        return <Leaf size={20} strokeWidth={2} color="#087F8C" />;
      case 'truck':
        return <Truck size={20} strokeWidth={2} color="#087F8C" />;
      case 'rupee':
        return <IndianRupee size={19} strokeWidth={2.2} color="#087F8C" />;
      case 'clock':
        return <Clock size={20} strokeWidth={2} color="#087F8C" />;
      default:
        return <HelpCircle size={20} strokeWidth={2} color="#087F8C" />;
    }
  };

  return (
    <section className="faq-section" id="faq-section">
      <div className="container">
        {/* Desktop Header */}
        <div className="faq-header faq-desktop-header text-center">
          <div className="faq-eyebrow-badge">
            <MessageSquare size={14} strokeWidth={2.4} className="faq-eyebrow-icon" />
            <span>{customTag || 'FAQS'}</span>
          </div>
          <h2 className="faq-main-title">
            Frequently Asked <span className="faq-title-highlight">Questions</span>
          </h2>
          <p className="faq-subtitle">
            Still have questions? Here are some common ones. If you need more help, feel free to reach out to us.
          </p>
        </div>

        {/* Mobile Header (Exact Match to User Reference Mockup) */}
        <div className="faq-header faq-mobile-header text-center">
          <div className="mobile-faq-eyebrow">
            <span className="eyebrow-line"></span>
            <span className="eyebrow-text">FAQ</span>
            <span className="eyebrow-line"></span>
          </div>
          <h2 className="mobile-faq-title">
            Frequently Asked <br />
            <span className="highlight">Questions</span>
          </h2>
          <p className="mobile-faq-sub">
            We've answered some of the most common questions to help you get started.
          </p>
        </div>

        <div className="faq-accordion-list" ref={accordionRef}>
          {faqList.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`faq-item ${isOpen ? 'open' : ''}`}
                onClick={() => toggleItem(index)}
              >
                <div className="faq-question-row">
                  <div className="faq-question-left">
                    <span className="faq-icon-circle">
                      {renderItemIcon(faq.icon)}
                    </span>
                    <h3 className="faq-question-text">{faq.question}</h3>
                  </div>
                  {/* Desktop Chevron */}
                  <div className={`faq-chevron-circle faq-desktop-toggle ${isOpen ? 'rotated' : ''}`}>
                    <ChevronDown size={18} strokeWidth={2.2} />
                  </div>
                  {/* Mobile Plus / Minus button */}
                  <div className={`faq-mobile-toggle-btn ${isOpen ? 'open' : ''}`}>
                    {isOpen ? (
                      <Minus size={15} strokeWidth={2.8} />
                    ) : (
                      <Plus size={15} strokeWidth={2.8} />
                    )}
                  </div>
                </div>

                {isOpen && (
                  <div className="faq-answer-row">
                    <div className="faq-answer-inner">
                      <p>{faq.answer}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .faq-section {
          padding: 96px 0 110px;
          background: #F4FAF9;
          position: relative;
          overflow: hidden;
        }

        .faq-section::after {
          content: '';
          position: absolute;
          top: -40px;
          right: -40px;
          width: 320px;
          height: 320px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(160, 235, 230, 0.45) 0%, rgba(244, 250, 249, 0) 70%);
          pointer-events: none;
          z-index: 1;
        }

        .faq-header {
          margin-bottom: 52px;
          position: relative;
          z-index: 2;
        }

        .faq-desktop-header {
          display: block;
        }

        .faq-mobile-header {
          display: none;
        }

        .text-center {
          text-align: center;
        }

        .faq-eyebrow-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #E0F4F2;
          color: #087F8C;
          font-family: 'Poppins', sans-serif;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 6px 16px;
          border-radius: 999px;
          margin-bottom: 16px;
        }

        .faq-eyebrow-icon {
          color: #087F8C;
        }

        .faq-main-title {
          font-family: 'Poppins', sans-serif;
          font-size: 2.75rem;
          font-weight: 800;
          color: #12263A;
          line-height: 1.2;
          margin: 0 0 14px;
        }

        .faq-title-highlight {
          color: #087F8C;
        }

        .faq-subtitle {
          font-family: 'Inter', sans-serif;
          font-size: 1.05rem;
          color: #5A6E85;
          max-width: 620px;
          margin: 0 auto;
          line-height: 1.6;
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

        .faq-item {
          background: #FFFFFF;
          border: 1px solid rgba(220, 235, 235, 0.75);
          border-radius: 20px;
          overflow: hidden;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(18, 38, 58, 0.03);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .faq-item:hover {
          border-color: #BCEAE6;
          box-shadow: 0 8px 24px rgba(8, 127, 140, 0.08);
          transform: translateY(-2px);
        }

        .faq-item.open {
          border-color: #9DE0D9;
          box-shadow: 0 8px 26px rgba(8, 127, 140, 0.09);
        }

        .faq-question-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 22px 28px;
          gap: 16px;
        }

        .faq-question-left {
          display: flex;
          align-items: center;
          gap: 18px;
          flex: 1;
        }

        .faq-icon-circle {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #EBF8F7;
          color: #087F8C;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .faq-question-text {
          font-family: 'Poppins', sans-serif;
          font-size: 1.05rem;
          font-weight: 700;
          color: #12263A;
          line-height: 1.35;
          margin: 0;
        }

        .faq-chevron-circle {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #E0F4F2;
          color: #087F8C;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.25s ease, background 0.25s ease, color 0.25s ease;
        }

        .faq-chevron-circle.rotated {
          transform: rotate(180deg);
        }

        .faq-desktop-toggle {
          display: flex;
        }

        .faq-mobile-toggle-btn {
          display: none;
        }

        .faq-answer-row {
          padding: 0 28px 26px 28px;
        }

        .faq-answer-inner {
          border-left: 2.5px solid #087F8C;
          padding-left: 18px;
          margin-left: 62px;
        }

        .faq-answer-inner p {
          font-family: 'Inter', sans-serif;
          font-size: 0.95rem;
          line-height: 1.65;
          color: #5C6F84;
          margin: 0;
        }

        /* Div 8 Mobile Responsiveness (Exact Reference Mockup Match) */
        @media (max-width: 768px) {
          .faq-section {
            padding: 48px 0 58px !important;
            background: #F0F9F8 !important;
          }
          .faq-desktop-header {
            display: none !important;
          }
          .faq-mobile-header {
            display: block !important;
            margin-bottom: 26px !important;
          }
          .mobile-faq-eyebrow {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 8px !important;
            margin-bottom: 12px !important;
          }
          .mobile-faq-eyebrow .eyebrow-line {
            width: 18px !important;
            height: 2px !important;
            background-color: #087F8C !important;
            border-radius: 2px !important;
          }
          .mobile-faq-eyebrow .eyebrow-text {
            font-family: 'Poppins', sans-serif !important;
            font-size: 13px !important;
            font-weight: 700 !important;
            letter-spacing: 1.5px !important;
            color: #087F8C !important;
            text-transform: uppercase !important;
          }
          .mobile-faq-title {
            font-family: 'Poppins', sans-serif !important;
            font-size: 29px !important;
            font-weight: 800 !important;
            color: #12263A !important;
            line-height: 1.18 !important;
            letter-spacing: -0.5px !important;
            margin: 0 0 12px !important;
          }
          .mobile-faq-title .highlight {
            color: #087F8C !important;
          }
          .mobile-faq-sub {
            font-family: 'Inter', sans-serif !important;
            font-size: 14px !important;
            color: #556980 !important;
            line-height: 1.5 !important;
            max-width: 330px !important;
            margin: 0 auto !important;
          }
          .faq-accordion-list {
            max-width: 440px !important;
            margin: 0 auto !important;
            gap: 12px !important;
            padding: 0 4px !important;
          }
          .faq-item {
            background: #FFFFFF !important;
            border-radius: 20px !important;
            border: 1px solid rgba(8, 127, 140, 0.05) !important;
            box-shadow: 0 3px 14px rgba(18, 38, 58, 0.03) !important;
            box-sizing: border-box !important;
          }
          .faq-item.open {
            border-color: #9DE0D9 !important;
            box-shadow: 0 6px 20px rgba(8, 127, 140, 0.07) !important;
          }
          .faq-question-row {
            padding: 16px 18px !important;
            gap: 14px !important;
          }
          .faq-icon-circle {
            display: none !important;
          }
          .faq-question-text {
            font-family: 'Poppins', sans-serif !important;
            font-size: 14.5px !important;
            font-weight: 700 !important;
            color: #12263A !important;
            line-height: 1.35 !important;
          }
          .faq-desktop-toggle {
            display: none !important;
          }
          .faq-mobile-toggle-btn {
            display: flex !important;
            width: 32px !important;
            height: 32px !important;
            border-radius: 50% !important;
            background: #E0F7F6 !important;
            color: #087F8C !important;
            align-items: center !important;
            justify-content: center !important;
            flex-shrink: 0 !important;
            transition: all 0.2s ease !important;
          }
          .faq-mobile-toggle-btn.open {
            background: #087F8C !important;
            color: #FFFFFF !important;
          }
          .faq-answer-row {
            padding: 0 18px 18px 18px !important;
          }
          .faq-answer-inner {
            margin-left: 0 !important;
            border-left: none !important;
            padding-left: 0 !important;
            border-top: 1px solid #EEF5F4 !important;
            padding-top: 12px !important;
          }
          .faq-answer-inner p {
            font-family: 'Inter', sans-serif !important;
            font-size: 13px !important;
            line-height: 1.55 !important;
            color: #556980 !important;
          }
        }

        @media (max-width: 420px) {
          .mobile-faq-title {
            font-size: 27px !important;
          }
          .faq-question-row {
            padding: 15px 16px !important;
          }
          .faq-question-text {
            font-size: 13.5px !important;
          }
        }
      `}</style>
    </section>
  );
};
