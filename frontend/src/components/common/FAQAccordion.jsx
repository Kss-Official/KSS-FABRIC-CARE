import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export const FAQAccordion = ({ items, customTitle, customTag }) => {
  const [openIndex, setOpenIndex] = useState(0);

  const defaultItems = [
    {
      question: 'Do you offer premium care for designer or delicate garments?',
      answer: 'Yes! We provide specialized care for designer wear, delicate fabrics like silk, wool, velvet, and intricate party wear. Our experts use gentle cleaning methods and premium detergents to keep your clothes safe and looking their best.'
    },
    {
      question: 'What makes Laundrix different from regular dry cleaners?',
      answer: 'We use 100% eco-friendly hydrocarbon solvents instead of harsh perchloroethylene chemicals. Plus, we provide scheduled doorstep pickup and drop, real-time status tracking, and temperature-controlled steam finishing.'
    },
    {
      question: 'What laundry services do you offer?',
      answer: 'We offer a complete suite: Wash & Fold, Wash & Iron, Dry Cleaning, Specialized Stain Removal, Steam Ironing, Shoe Deep Cleaning & Restoration, and Home Care (curtains, quilts & bedsheets).'
    },
    {
      question: 'How does pickup and delivery work?',
      answer: 'Simply select your services, enter your address, and choose your preferred 2-hour pickup time window. Our verified rider will arrive with laundry bags, verify your items, and deliver them fresh within 24–48 hours.'
    },
    {
      question: 'What are your prices and is there a minimum order value?',
      answer: 'Our pricing is 100% transparent with no hidden charges. Everyday wash starts from ₹60/kg, and individual steam pressing from ₹20/pc. Pickup & delivery is completely free for orders above ₹500.'
    },
    {
      question: 'How long does it take to get my clothes back?',
      answer: 'Our standard turnaround is 48 hours for standard laundry and dry cleaning. We also provide an Express 24-hour delivery option for urgent orders.'
    }
  ];

  const faqList = items || defaultItems;

  const toggleItem = (index) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <section className="faq-section" id="faq-section">
      <div className="container">
        <div className="faq-header text-center">
          <span className="section-tag pill">{customTag || "24 FAQ's"}</span>
          <h2 className="section-title">
            Frequently Asked <span className="highlight">Questions</span>
          </h2>
          <p className="section-subtitle mx-auto">
            Still have questions? Here are some common ones. If you need more help, feel free to reach out to us.
          </p>
        </div>

        <div className="faq-accordion-list">
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
                      <HelpCircle size={16} />
                    </span>
                    <h3 className="faq-question-text">{faq.question}</h3>
                  </div>
                  <div className={`faq-chevron ${isOpen ? 'rotated' : ''}`}>
                    <ChevronDown size={20} />
                  </div>
                </div>

                {isOpen && (
                  <div className="faq-answer-row animate-fade-in">
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
          padding: 80px 0;
          background: #FAFCFC;
        }

        .text-center {
          text-align: center;
        }

        .mx-auto {
          margin-left: auto;
          margin-right: auto;
        }

        .faq-header {
          margin-bottom: 48px;
        }

        .faq-accordion-list {
          max-width: 820px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .faq-item {
          background: #ffffff;
          border: 1.5px solid #E6EEF0;
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 6px rgba(0,0,0,0.02);
        }

        .faq-item:hover {
          border-color: #BCEAE6;
          box-shadow: 0 4px 12px rgba(13, 122, 117, 0.06);
        }

        .faq-item.open {
          border-color: #0D7A75;
          box-shadow: 0 6px 20px rgba(13, 122, 117, 0.08);
        }

        .faq-question-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
        }

        .faq-question-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .faq-icon-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #EBF8F7;
          color: #0D7A75;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .faq-question-text {
          font-size: 1.0625rem;
          font-weight: 700;
          color: #1A202C;
          line-height: 1.4;
        }

        .faq-chevron {
          color: #0D7A75;
          transition: transform 0.25s ease;
          flex-shrink: 0;
          margin-left: 12px;
        }

        .faq-chevron.rotated {
          transform: rotate(180deg);
        }

        .faq-answer-row {
          padding: 0 24px 20px 24px;
        }

        .faq-answer-inner {
          border-left: 3px solid #0D7A75;
          padding-left: 16px;
          font-size: 0.9375rem;
          line-height: 1.65;
          color: #4A5568;
        }

        @media (max-width: 640px) {
          .faq-question-row {
            padding: 16px;
          }
          .faq-question-text {
            font-size: 0.9375rem;
          }
        }
      `}</style>
    </section>
  );
};
