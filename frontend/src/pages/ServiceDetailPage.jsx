import React from 'react';
import { useBooking } from '../context/BookingContext';
import { FAQAccordion } from '../components/common/FAQAccordion';
import { 
  Sparkles, 
  ShieldCheck, 
  Tag, 
  Truck, 
  Droplets, 
  Sun, 
  HeartHandshake, 
  Coins, 
  ArrowRight,
  CheckCircle,
  FileSearch,
  Wand2,
  Wind,
  Shirt,
  PackageCheck
} from 'lucide-react';

export const ServiceDetailPage = () => {
  const { startBooking } = useBooking();

  const processSteps = [
    { num: '01', title: 'Tagging & Sorting', desc: 'Individual barcode tag assigned to trace every item.', icon: <Tag size={20} /> },
    { num: '02', title: 'Inspection', desc: 'Detailed check for fabric type, stains, and buttons.', icon: <FileSearch size={20} /> },
    { num: '03', title: 'Stain Treatment', desc: 'Targeted pre-spotting with specialized enzymes.', icon: <Wand2 size={20} /> },
    { num: '04', title: 'Eco-Friendly Cleaning', desc: 'Closed-loop hydrocarbon wash gentle on threads.', icon: <Droplets size={20} /> },
    { num: '05', title: 'Finishing', desc: 'Steam form pressing to restore original shape.', icon: <Wind size={20} /> },
    { num: '06', title: 'Quality Check', desc: 'Final inspection under multi-spectrum lighting.', icon: <CheckCircle size={20} /> },
    { num: '07', title: 'Packaging', desc: 'Breathable dust covers on wooden hangers.', icon: <PackageCheck size={20} /> }
  ];

  const promises = [
    {
      icon: <Coins size={26} />,
      title: 'Affordable Price',
      desc: 'Top-tier luxury garment care with transparent pricing and no hidden costs.'
    },
    {
      icon: <HeartHandshake size={26} />,
      title: 'Skin Friendly',
      desc: '100% hypoallergenic, non-toxic detergents safe for sensitive skin and babies.'
    },
    {
      icon: <Sun size={26} />,
      title: 'UV Safe Air Drying',
      desc: 'Temperature-regulated drying technology that prevents fabric shrinking and fading.'
    },
    {
      icon: <Droplets size={26} />,
      title: 'Less & Fresh Water',
      desc: 'Sustainable water filtration cycles that save up to 45% water per batch.'
    }
  ];

  return (
    <div className="service-detail-page">
      {/* 1. HERO BANNER */}
      <section className="service-hero-banner">
        <div className="service-hero-overlay" />
        <div className="container service-hero-content">
          <span className="service-hero-badge">OUR SPECIALTY SERVICE</span>
          <h1 className="service-hero-title">Dry Cleaning</h1>
          <p className="service-hero-subtitle">
            Eco-Friendly · Expert Stain Removal · Luxury Fabric Care
          </p>
        </div>
      </section>

      {/* 2. CARE THAT GOES BEYOND CLEANING */}
      <section className="beyond-cleaning-section">
        <div className="container">
          <div className="beyond-grid">
            <div className="beyond-image-col">
              <div className="beyond-image-frame">
                <img 
                  src="/assets/garment-specialist.jpg" 
                  alt="Garment Care Specialist Inspecting Suits" 
                  className="beyond-img"
                />
              </div>
            </div>

            <div className="beyond-content-col">
              <span className="section-tag pill">DRY CLEANING</span>
              <h2 className="section-title">
                Care That Goes <br />
                <span className="highlight">Beyond Cleaning</span>
              </h2>

              <p className="beyond-desc">
                Our dry cleaning service is designed to care for your delicate and premium garments. Using advanced, fabric-friendly methods, we remove stains, refresh the fabric and maintain the original look and feel of your clothes.
              </p>

              {/* 4 Feature Badges in 2x2 Grid */}
              <div className="beyond-badges-grid">
                <div className="beyond-badge-card">
                  <div className="beyond-badge-icon"><Shirt size={20} /></div>
                  <span className="beyond-badge-text">Safe for Delicate Fabrics</span>
                </div>

                <div className="beyond-badge-card">
                  <div className="beyond-badge-icon"><Wand2 size={20} /></div>
                  <span className="beyond-badge-text">Advanced Stain Treatment</span>
                </div>

                <div className="beyond-badge-card">
                  <div className="beyond-badge-icon"><Tag size={20} /></div>
                  <span className="beyond-badge-text">Transparent Pricing</span>
                </div>

                <div className="beyond-badge-card">
                  <div className="beyond-badge-icon"><Truck size={20} /></div>
                  <span className="beyond-badge-text">Doorstep Pickup & Delivery</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. OUR DRY CLEANING PROCESS (7 STEPS TIMELINE) */}
      <section className="process-timeline-section">
        <div className="container">
          <div className="text-center process-timeline-head">
            <span className="section-tag pill">DRY CLEANING</span>
            <h2 className="section-title">
              Our <span className="highlight">Dry Cleaning Process</span>
            </h2>
            <p className="section-subtitle mx-auto">
              Every garment goes through a careful step-by-step process to ensure the best care.
            </p>
          </div>

          <div className="timeline-horizontal-scroll">
            <div className="timeline-steps-track">
              {processSteps.map((step, idx) => (
                <div key={step.num} className="timeline-step-node">
                  <div className="node-num-pill">{step.num}</div>
                  <div className="node-icon-circle">
                    {step.icon}
                  </div>
                  <h4 className="node-title">{step.title}</h4>
                  <p className="node-desc">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. OUR PROMISE TO YOU */}
      <section className="promises-section">
        <div className="container">
          <div className="text-center promises-head">
            <span className="section-tag pill">OUR COMMITMENT</span>
            <h2 className="section-title">
              OUR <span className="highlight">PROMISE</span> TO YOU
            </h2>
          </div>

          <div className="promises-cards-grid">
            {promises.map((p, index) => (
              <div key={index} className="promise-card">
                <div className="promise-icon-circle">
                  {p.icon}
                </div>
                <h3 className="promise-card-title">{p.title}</h3>
                <p className="promise-card-desc">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. CTA BANNER (KEEPING CLOTHES GOOD AS NEW) */}
      <section className="trust-cta-banner-section">
        <div className="container">
          <div className="trust-cta-banner">
            <div className="trust-cta-left">
              <h2 className="trust-cta-title">
                Trust us for keeping your clothes <br />
                <span className="cta-highlight">as good as new</span>
              </h2>
            </div>

            <div className="trust-cta-right">
              <img 
                src="/assets/folded-towels.jpg" 
                alt="Neat fresh laundry stack" 
                className="trust-towels-img"
              />
              <button 
                className="btn btn-coral btn-lg"
                onClick={() => startBooking('dry-cleaning')}
              >
                <span>Book Now</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SERVICE FAQS */}
      <FAQAccordion customTag="DRY CLEANING FAQS" />

      <style>{`
        .service-detail-page {
          width: 100%;
        }

        /* 1. HERO BANNER */
        .service-hero-banner {
          position: relative;
          background: url('/assets/dry-clean-hero.jpg') center/cover no-repeat;
          padding: 110px 0 90px;
          color: #ffffff;
          overflow: hidden;
        }

        .service-hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(13, 122, 117, 0.88) 0%, rgba(14, 75, 86, 0.94) 100%);
        }

        .service-hero-content {
          position: relative;
          z-index: 2;
          text-align: center;
        }

        .service-hero-badge {
          display: inline-block;
          font-size: 0.8125rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          color: #64DFDF;
          background: rgba(255, 255, 255, 0.12);
          padding: 6px 18px;
          border-radius: 999px;
          margin-bottom: 16px;
        }

        .service-hero-title {
          font-size: 3.5rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin-bottom: 12px;
        }

        .service-hero-subtitle {
          font-size: 1.125rem;
          color: #E6F7F5;
          font-weight: 500;
        }

        /* 2. CARE THAT GOES BEYOND CLEANING */
        .beyond-cleaning-section {
          padding: 90px 0;
          background: #ffffff;
        }

        .beyond-grid {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 56px;
          align-items: center;
        }

        .beyond-image-frame {
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.08);
        }

        .beyond-img {
          width: 100%;
          height: 480px;
          object-fit: cover;
        }

        .beyond-desc {
          font-size: 1rem;
          color: #4A5568;
          line-height: 1.7;
          margin-bottom: 32px;
        }

        .beyond-badges-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .beyond-badge-card {
          display: flex;
          align-items: center;
          gap: 14px;
          background: #FAFCFC;
          border: 1.5px solid #E6EEF0;
          border-radius: 14px;
          padding: 16px;
        }

        .beyond-badge-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #EBF8F7;
          color: #0D7A75;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .beyond-badge-text {
          font-size: 0.875rem;
          font-weight: 700;
          color: #1A202C;
        }

        /* 3. PROCESS TIMELINE */
        .process-timeline-section {
          padding: 90px 0;
          background: #F0FDFB;
        }

        .process-timeline-head {
          margin-bottom: 50px;
        }

        .timeline-horizontal-scroll {
          overflow-x: auto;
          padding: 20px 0;
        }

        .timeline-steps-track {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 16px;
          min-width: 900px;
          position: relative;
        }

        .timeline-step-node {
          background: #ffffff;
          border: 1.5px solid #BCEAE6;
          border-radius: 18px;
          padding: 24px 14px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          box-shadow: 0 4px 14px rgba(13, 122, 117, 0.04);
        }

        .node-num-pill {
          font-size: 0.75rem;
          font-weight: 800;
          color: #0D7A75;
          background: #EBF8F7;
          padding: 2px 10px;
          border-radius: 999px;
          margin-bottom: 12px;
        }

        .node-icon-circle {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #E6F7F5;
          color: #0D7A75;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 14px;
        }

        .node-title {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #1A202C;
          margin-bottom: 6px;
        }

        .node-desc {
          font-size: 0.75rem;
          color: #718096;
          line-height: 1.4;
        }

        /* 4. PROMISES */
        .promises-section {
          padding: 90px 0;
          background: #ffffff;
        }

        .promises-head {
          margin-bottom: 50px;
        }

        .promises-cards-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }

        .promise-card {
          background: #FAFCFC;
          border: 1.5px solid #E6EEF0;
          border-radius: 20px;
          padding: 32px 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          transition: all 0.25s ease;
        }

        .promise-card:hover {
          transform: translateY(-4px);
          border-color: #BCEAE6;
          box-shadow: 0 10px 24px rgba(13, 122, 117, 0.08);
        }

        .promise-icon-circle {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: #EBF8F7;
          color: #0D7A75;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }

        .promise-card-title {
          font-size: 1.125rem;
          font-weight: 800;
          color: #1A202C;
          margin-bottom: 8px;
        }

        .promise-card-desc {
          font-size: 0.8125rem;
          color: #718096;
          line-height: 1.55;
        }

        /* 5. TRUST CTA BANNER */
        .trust-cta-banner-section {
          padding: 20px 0 90px;
          background: #FAFCFC;
        }

        .trust-cta-banner {
          background: linear-gradient(135deg, #E6F7F5 0%, #D8F3EF 100%);
          border: 1.5px solid #BCEAE6;
          border-radius: 24px;
          padding: 40px 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 32px;
        }

        .trust-cta-title {
          font-size: 2rem;
          font-weight: 800;
          color: #1A202C;
          line-height: 1.25;
        }

        .cta-highlight {
          color: #0D7A75;
        }

        .trust-cta-right {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .trust-towels-img {
          width: 140px;
          height: 100px;
          object-fit: cover;
          border-radius: 14px;
          box-shadow: 0 6px 18px rgba(0,0,0,0.08);
        }

        @media (max-width: 992px) {
          .beyond-grid {
            grid-template-columns: 1fr;
          }
          .promises-cards-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .trust-cta-banner {
            flex-direction: column;
            text-align: center;
          }
          .trust-cta-right {
            flex-direction: column;
          }
        }

        @media (max-width: 640px) {
          .promises-cards-grid,
          .beyond-badges-grid {
            grid-template-columns: 1fr;
          }
          .service-hero-title {
            font-size: 2.5rem;
          }
        }
      `}</style>
    </div>
  );
};
