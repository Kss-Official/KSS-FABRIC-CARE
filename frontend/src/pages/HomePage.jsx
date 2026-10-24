import React, { useState, useEffect } from 'react';
import { useBooking } from '../context/BookingContext';
import { PricingCalculator } from '../components/common/PricingCalculator';
import { FAQAccordion } from '../components/common/FAQAccordion';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Clock,
  Truck,
  Star,
  CheckCircle2,
  Leaf,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  Send,
  Check,
  Shirt,
  Wind,
  BedDouble,
  BadgeCheck,
  WashingMachine,
  Award,
  CalendarCheck
} from 'lucide-react';

export const HomePage = () => {
  const { startBooking, navigateTo } = useBooking();
  const [heroSlide, setHeroSlide] = useState(0);
  const heroImages = [
    '/assets/hero-slide-1.jpg',
    '/assets/hero-slide-2.png'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroSlide((prev) => (prev + 1) % heroImages.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [heroImages.length]);

  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    phone: '',
    email: '',
    message: ''
  });

  const services = [
    {
      id: 'wash-fold',
      title: 'Premium Laundry',
      desc: 'Top-quality cleaning for clothes to look and feel fresh.',
      image: '/assets/service-wash.jpg'
    },
    {
      id: 'dry-cleaning',
      title: 'Dry Cleaning',
      desc: 'Delicate fabrics require special care. We ensure clothes are cleaned to perfection.',
      image: '/assets/service-dryclean.jpg'
    },
    {
      id: 'wash-iron',
      title: 'Wash and Iron',
      desc: 'Hassle-free solution for clean and pressed clothes.',
      image: '/assets/service-iron.jpg'
    },
    {
      id: 'steam-iron',
      title: 'Steam Ironing',
      desc: 'Quick and effective way to get clothes perfectly pressed.',
      image: '/assets/service-stain.jpg'
    },
    {
      id: 'shoe-laundry',
      title: 'Shoe Laundry',
      desc: 'Deep cleaning solution to restore the look of shoes.',
      image: '/assets/service-shoe.jpg'
    },
    {
      id: 'home-care',
      title: 'Curtain Cleaning',
      desc: 'Revive your curtains with our professional cleaning service.',
      image: '/assets/service-curtain.jpg'
    }
  ];

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      setContactSubmitted(false);
      setContactForm({ name: '', phone: '', email: '', message: '' });
    }, 4000);
  };

  return (
    <div className="home-page-container">
      {/* 1. HERO SECTION (Matching Reference Image) */}
      <section className="hero-section">
        {/* Full-bleed dual background images crossfading one after another */}
        <div className="hero-bg-wrapper">
          {heroImages.map((imgSrc, index) => (
            <img
              key={imgSrc}
              src={imgSrc}
              alt={`FabriCare laundry room setting ${index + 1}`}
              className={`hero-full-bg-img ${heroSlide === index ? 'active' : ''}`}
            />
          ))}
          <div className="hero-subtle-overlay" />
        </div>

        <div className="container hero-container">
          {/* Left Column: Headline, Description, Button Group, Trust Badges */}
          <div className="hero-content">
            <h1 className="hero-headline">
              Fresh Clothes. <br />
              <span className="highlight-text">Brighter Days.</span>
            </h1>

            <p className="hero-description">
              Laundry, dry cleaning and home care services with convenient doorstep pickup &amp; delivery.
            </p>

            <div className="hero-cta-group">
              <button
                id="hero-book-now-btn"
                className="btn-coral-pill"
                onClick={() => startBooking()}
              >
                <span>Book a Pickup</span>
                <ArrowRight size={18} />
              </button>
              <button
                className="btn-white-pill"
                onClick={() => navigateTo('services')}
              >
                <span>Explore Services</span>
              </button>
            </div>

            {/* 4 Trust Badges in a horizontal row */}
            <div className="hero-trust-badges">
              <div className="hero-trust-item">
                <div className="badge-circle">
                  <Truck size={19} className="badge-icon" />
                </div>
                <span className="badge-label">
                  Free Pickup &amp;<br />Delivery
                </span>
              </div>

              <div className="hero-trust-item">
                <div className="badge-circle">
                  <ShieldCheck size={19} className="badge-icon" />
                </div>
                <span className="badge-label">
                  Trusted &amp;<br />Safe
                </span>
              </div>

              <div className="hero-trust-item">
                <div className="badge-circle">
                  <Leaf size={19} className="badge-icon" />
                </div>
                <span className="badge-label">
                  Eco-Friendly<br />Cleaning
                </span>
              </div>

              <div className="hero-trust-item">
                <div className="badge-circle">
                  <Clock size={19} className="badge-icon" />
                </div>
                <span className="badge-label">
                  On-Time<br />Delivery
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: 4 Glassmorphism Service Cards Stack */}
          <div className="hero-glass-cards-col">
            <div className="hero-cards-stack">

              {/* Card 1: Wash & Fold */}
              <div
                className="hero-glass-card"
                onClick={() => navigateTo('services', 'wash-fold')}
              >
                <div className="card-content-left">
                  <div className="card-icon-tile mint-tile">
                    <Shirt size={22} />
                  </div>
                  <div className="card-text-group">
                    <h3 className="card-title">Wash &amp; Fold</h3>
                    <p className="card-price">From ₹149 / lb</p>
                  </div>
                </div>
                <ArrowRight size={18} className="card-arrow" />
              </div>

              {/* Card 2: Dry Cleaning */}
              <div
                className="hero-glass-card"
                onClick={() => navigateTo('services', 'dry-cleaning')}
              >
                <div className="card-content-left">
                  <div className="card-icon-tile coral-tile">
                    <Sparkles size={22} />
                  </div>
                  <div className="card-text-group">
                    <h3 className="card-title">Dry Cleaning</h3>
                    <p className="card-price">From ₹69 / item</p>
                  </div>
                </div>
                <ArrowRight size={18} className="card-arrow" />
              </div>

              {/* Card 3: Steam Ironing */}
              <div
                className="hero-glass-card"
                onClick={() => navigateTo('services', 'steam-iron')}
              >
                <div className="card-content-left">
                  <div className="card-icon-tile white-tile">
                    <Wind size={22} />
                  </div>
                  <div className="card-text-group">
                    <h3 className="card-title">Steam Ironing</h3>
                    <p className="card-price">From ₹249 / item</p>
                  </div>
                </div>
                <ArrowRight size={18} className="card-arrow" />
              </div>

              {/* Card 4: Home Bedding & Care */}
              <div
                className="hero-glass-card"
                onClick={() => navigateTo('services', 'home-care')}
              >
                <div className="card-content-left">
                  <div className="card-icon-tile mint-tile">
                    <BedDouble size={22} />
                  </div>
                  <div className="card-text-group">
                    <h3 className="card-title">Home Bedding &amp; Care</h3>
                    <p className="card-price">From ₹189 / piece</p>
                  </div>
                </div>
                <ArrowRight size={18} className="card-arrow" />
              </div>

            </div>
          </div>
        </div>

        {/* Slide Indicator Controls */}
        <div className="hero-slide-indicators">
          {heroImages.map((_, index) => (
            <button
              key={index}
              type="button"
              className={`hero-indicator-dot ${heroSlide === index ? 'active' : ''}`}
              onClick={() => setHeroSlide(index)}
              aria-label={`Switch to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* 2. ABOUT US: LAUNDRY WALLAH AT YOUR SERVICE */}
      <section className="about-section" id="about-section">
        <div className="container">
          <div className="about-grid">
            <div className="about-image-col">
              <div className="about-image-frame">
                <img
                  src="/assets/about-jeans.jpg"
                  alt="Laundry Wallah - Clean Garments Care"
                  className="about-img"
                />
              </div>
            </div>

            <div className="about-content-col">
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
                onClick={() => {
                  document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <span>Enquire Now</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PROFESSIONAL CARE FOR EVERY FABRIC (SERVICES GRID) */}
      {/* 3. OUR SERVICES: PROFESSIONAL CARE FOR EVERY FABRIC */}
      <section className="services-section" id="services-section">
        <div className="container">
          <div className="text-center services-head">
            <div className="services-eyebrow">
              <span className="eyebrow-line" />
              <span>OUR SERVICES</span>
              <span className="eyebrow-line" />
            </div>
            <h2 className="services-title">
              Professional Care <span className="highlight">for Every Fabric</span>
            </h2>
            <p className="services-sub">
              Wide range of cleaning solutions for all your needs, with top-quality service and complete satisfaction guarantee.
            </p>
          </div>

          <div className="services-cards-grid">
            {services.map((s) => (
              <div key={s.id} className="service-card-item">
                <div className="service-image-box">
                  <img src={s.image} alt={s.title} className="service-card-img" />
                </div>
                <div className="service-card-body">
                  <h3 className="service-title-text">{s.title}</h3>
                  <p className="service-desc-text">{s.desc}</p>
                  <button
                    type="button"
                    className="service-enquire-btn"
                    onClick={() => {
                      document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    <span>Enquire Now</span>
                    <span className="enquire-arrow-circle">
                      <ArrowRight size={14} strokeWidth={2.5} />
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. WHY PEOPLE CHOOSE US (BENTO GRID DESIGN MATCHING REFERENCE) */}
      <section className="why-us-section" id="why-us-section">
        <div className="container">
          <div className="why-us-bento-container">
            {/* Left Hero Card (Spans full height) */}
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
                onClick={() => {
                  document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <span>Contact Us</span>
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

      {/* 5. INTERACTIVE PRICING CALCULATOR */}
      <PricingCalculator />

      {/* 6. OUR WORKING PROCESS */}
      <section className="process-section" id="process-section">
        <div className="container">
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
      </section>

      {/* 7. CUSTOMER TESTIMONIALS */}
      <section className="testimonials-section" id="testimonials-section">
        <div className="container">
          <div className="text-center testimonials-head">
            <span className="testimonials-pill">TESTIMONIALS</span>
            <h2 className="testimonials-title">Loved by Busy People</h2>
            <p className="testimonials-subtitle">
              Hear from our community of professionals, busy parents, and luxury wardrobe owners.
            </p>
          </div>

          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} strokeWidth={1.8} color="#FF7A60" fill="none" />
                ))}
              </div>
              <p className="testimonial-quote">
                "Absolute game changer. Booking takes 30 seconds and my clothes return smelling amazing and folded better than I can ever do myself."
              </p>
              <div className="testimonial-author-block">
                <h4 className="testimonial-author-name">Jessica R.</h4>
                <p className="testimonial-author-role">Busy Professional</p>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} strokeWidth={1.8} color="#FF7A60" fill="none" />
                ))}
              </div>
              <p className="testimonial-quote">
                "I am super picky about my suits. FabriCare dry cleaned my tailored wool pieces perfectly. Crisp pressing and zero odd chemical smells."
              </p>
              <div className="testimonial-author-block">
                <h4 className="testimonial-author-name">Michael T.</h4>
                <p className="testimonial-author-role">Wardrobe Enthusiast</p>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} strokeWidth={1.8} color="#FF7A60" fill="none" />
                ))}
              </div>
              <p className="testimonial-quote">
                "With 2 kids, laundry is a full-time job. Sending our weekly wash & fold to FabriCare has saved our weekends. Best money spent."
              </p>
              <div className="testimonial-author-block">
                <h4 className="testimonial-author-name">David K.</h4>
                <p className="testimonial-author-role">Family of Four</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FAQ ACCORDION */}
      <FAQAccordion />

      {/* 9. CONTACT & SUPPORT SECTION */}
      <section className="contact-section" id="contact-section">
        <div className="container">
          <div className="text-center contact-head">
            <span className="contact-pill">CONTACT US</span>
            <h2 className="contact-main-title">
              Get in Touch with FabriCare.
            </h2>
            <p className="contact-subtitle">
              Have special fabric questions or high volume commercial requests? We're here to help.
            </p>
          </div>

          <div className="contact-cards-grid">
            {/* Left Card: We're Locally Owned & Operated */}
            <div className="contact-info-card">
              <h3 className="contact-card-title">We're Locally Owned &amp; Operated</h3>
              <p className="contact-card-desc">
                Our head facility operates out of Brooklyn, serving all surrounding boroughs. Reach our responsive customer support team via phone, email, or chat.
              </p>

              <div className="contact-details-list">
                <div className="contact-item">
                  <div className="contact-icon-squircle">
                    <Phone size={19} />
                  </div>
                  <div className="contact-item-text">
                    <span className="contact-detail-label">Support Hotline</span>
                    <span className="contact-detail-value">+91 98765 43211</span>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-icon-squircle">
                    <Mail size={19} />
                  </div>
                  <div className="contact-item-text">
                    <span className="contact-detail-label">Email Address</span>
                    <span className="contact-detail-value">support@fabricare.premium</span>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-icon-squircle">
                    <MapPin size={19} />
                  </div>
                  <div className="contact-item-text">
                    <span className="contact-detail-label">Service Facility</span>
                    <span className="contact-detail-value">Bengaluru, Karnataka, India, 560037</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Card: Send a Message */}
            <div className="contact-form-card">
              <h3 className="contact-card-title">Send a Message</h3>
              <p className="contact-form-sub">
                Our support team typically responds within 15 minutes.
              </p>

              {contactSubmitted ? (
                <div className="contact-success-msg animate-fade-in">
                  <CheckCircle2 size={44} color="#087F8C" />
                  <h4>Thank you for reaching out!</h4>
                  <p>Our support representative will call you back within 15 minutes.</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="contact-form">
                  <div className="contact-form-row">
                    <div className="contact-field-group">
                      <label className="contact-field-label">Full Name</label>
                      <input
                        type="text"
                        required
                        className="contact-field-input"
                        placeholder="Mahesh"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      />
                    </div>

                    <div className="contact-field-group">
                      <label className="contact-field-label">Phone Number</label>
                      <input
                        type="tel"
                        required
                        className="contact-field-input"
                        placeholder="+91 98765 43211"
                        value={contactForm.phone}
                        onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="contact-field-group">
                    <label className="contact-field-label">Email Address</label>
                    <input
                      type="email"
                      required
                      className="contact-field-input"
                      placeholder="mahesh@example.com"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    />
                  </div>

                  <div className="contact-field-group">
                    <label className="contact-field-label">Your Message</label>
                    <textarea
                      rows="4"
                      required
                      className="contact-field-textarea"
                      placeholder="Ask about delicate dry clean, blanket packages, custom starching preferences..."
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    />
                  </div>

                  <button type="submit" className="contact-submit-btn">
                    Submit Inquiry
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 10. BOTTOM BANNER CTA */}
      <section className="cta-banner-section">
        <div className="cta-banner-bg-wrapper">
          <img
            src="/assets/cta-folded-clothes.jpg"
            alt="Freshly folded clothes"
            className="cta-banner-bg-img"
          />
          <div className="cta-banner-overlay" />
        </div>

        <div className="container cta-banner-container">
          <div className="cta-banner-content text-center">
            <h2 className="cta-banner-title">Ready for fresh clothes?</h2>
            <p className="cta-banner-sub">
              Experience your first premium laundry order completely hassle-free. Schedule your pickup in under 30 seconds and let our experts handle the rest.
            </p>
            <button
              className="cta-banner-btn"
              onClick={() => startBooking()}
            >
              Book Your Free Pickup
            </button>
          </div>
        </div>
      </section>

      <style>{`
        .home-page-container {
          width: 100%;
        }

        /* HERO SECTION (Matching Reference Image) */
        .hero-section {
          position: relative;
          min-height: calc(100vh - 76px);
          display: flex;
          align-items: center;
          padding: 60px 0;
          overflow: hidden;
          background-color: #F8FAFC;
        }

        .hero-bg-wrapper {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          overflow: hidden;
          pointer-events: none;
        }

        .hero-full-bg-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: top center;
          opacity: 0;
          transform: scale(1.02);
          transition: opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1), transform 6s ease;
          display: block;
        }

        .hero-full-bg-img.active {
          opacity: 1;
          transform: scale(1);
          z-index: 2;
        }

        .hero-subtle-overlay {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          /* Clean, subtle translucent wash without whitening the corners */
          background: linear-gradient(
            90deg, 
            rgba(255, 255, 255, 0) 0%, 
            rgba(255, 255, 255, 0.20) 35%, 
            rgba(255, 255, 255, 0.05) 65%, 
            rgba(255, 255, 255, 0.00) 100%
          );
          z-index: 3;
        }

        .hero-slide-indicators {
          position: absolute;
          bottom: 22px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 10px;
          z-index: 10;
        }

        .hero-indicator-dot {
          width: 26px;
          height: 6px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(18, 38, 58, 0.15);
          cursor: pointer;
          transition: all 0.3s ease;
          padding: 0;
        }

        .hero-indicator-dot:hover {
          background: rgba(255, 255, 255, 0.9);
        }

        .hero-indicator-dot.active {
          width: 44px;
          background: #087F8C;
          border-color: #087F8C;
          box-shadow: 0 2px 8px rgba(8, 127, 140, 0.45);
        }

        .hero-container {
          position: relative;
          z-index: 5;
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 40px;
          align-items: center;
          width: 100%;
        }

        .hero-content {
          max-width: 620px;
        }

        .hero-headline {
          font-family: 'Poppins', sans-serif;
          font-size: 68px;
          font-weight: 700;
          line-height: 68px;
          color: #12263A;
          letter-spacing: -1.7px;
          margin-bottom: 20px;
        }

        .hero-headline .highlight-text {
          color: #087F8C;
          display: block;
        }

        .hero-description {
          font-family: 'Poppins', sans-serif;
          font-size: 1.25rem;
          font-weight: 400;
          color: #1F2937;
          line-height: 1.45;
          margin-bottom: 34px;
          max-width: 520px;
        }

        .hero-cta-group {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 48px;
          flex-wrap: wrap;
        }

        .btn-coral-pill {
          height: 54px;
          padding: 0 32px;
          border-radius: 9999px;
          background: #FF6B54;
          color: #FFFFFF;
          font-family: 'Poppins', sans-serif;
          font-weight: 600;
          font-size: 1.0625rem;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          border: none;
          cursor: pointer;
          box-shadow: 0 10px 24px rgba(255, 107, 84, 0.4);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .btn-coral-pill:hover {
          background: #E8553F;
          transform: translateY(-1px);
          box-shadow: 0 14px 28px rgba(255, 107, 84, 0.5);
        }

        .btn-white-pill {
          height: 54px;
          padding: 0 32px;
          border-radius: 9999px;
          background: #FFFFFF;
          color: #12263A;
          font-family: 'Poppins', sans-serif;
          font-weight: 600;
          font-size: 1.0625rem;
          border: 1px solid rgba(226, 232, 240, 0.9);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-white-pill:hover {
          background: #F8FAFC;
          border-color: #CBD5E1;
        }

        .hero-trust-badges {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .hero-trust-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .badge-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #FFFFFF;
          color: #0E7C86;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          border: 1px solid rgba(226, 232, 240, 0.7);
        }

        .badge-label {
          font-family: 'Poppins', sans-serif;
          font-size: 0.82rem;
          font-weight: 600;
          color: #12263A;
          line-height: 1.25;
        }

        /* Right Column: Glass Cards */
        .hero-glass-cards-col {
          display: flex;
          justify-content: flex-end;
          width: 100%;
        }

        .hero-cards-stack {
          width: 100%;
          max-width: 460px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .hero-glass-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0);
          backdrop-filter: blur(28px) brightness(1.04);
          -webkit-backdrop-filter: blur(28px) brightness(1.04);
          border: 1px solid rgba(255, 255, 255, 0.65);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08), inset 0 1px 2px rgba(255, 255, 255, 0.85);
          cursor: pointer;
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .hero-glass-card:hover {
          background: rgba(255, 255, 255, 0.52);
          border-color: rgba(255, 255, 255, 0.85);
          transform: translateY(-2px);
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.12), inset 0 1px 2px rgba(255, 255, 255, 0.95);
        }

        .card-content-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .card-icon-tile {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .card-icon-tile.mint-tile {
          background: #20C9B6;
          color: #FFFFFF;
        }

        .card-icon-tile.coral-tile {
          background: #FF6B54;
          color: #FFFFFF;
        }

        .card-icon-tile.white-tile {
          background: #FFFFFF;
          color: #12263A;
        }

        .card-title {
          font-family: 'Poppins', sans-serif;
          font-size: 1.15rem;
          font-weight: 700;
          color: #FFFFFF;
          margin: 0;
          line-height: 1.25;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }

        .card-price {
          font-family: 'Poppins', sans-serif;
          font-size: 0.875rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.92);
          margin: 2px 0 0;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
        }

        .card-arrow {
          color: #FFFFFF;
          transition: transform 0.2s ease;
        }

        .hero-glass-card:hover .card-arrow {
          transform: translateX(4px);
        }

        /* ABOUT SECTION (EXACT REFERENCE DESIGN) */
        .about-section {
          padding: 100px 0;
          background: #FFFFFF;
        }

        .about-grid {
          display: grid;
          grid-template-columns: 1fr 1.15fr;
          gap: 68px;
          align-items: center;
        }

        .about-image-col {
          display: flex;
          justify-content: center;
        }

        .about-image-frame {
          width: 100%;
          max-width: 520px;
          border-radius: 36px;
          overflow: hidden;
          box-shadow: 0 20px 48px -12px rgba(18, 38, 58, 0.12);
          background: #F8FAFC;
        }

        .about-img {
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
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          color: #556980;
          line-height: 1.65;
          margin-bottom: 16px;
          max-width: 600px;
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
          font-family: 'Inter', sans-serif;
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
          font-family: 'Inter', sans-serif;
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

        /* SERVICES SECTION (EXACT REFERENCE DESIGN) */
        .services-section {
          padding: 100px 0;
          background: #EBF7F6;
        }

        .services-head {
          margin-bottom: 56px;
        }

        .services-eyebrow {
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

        .services-eyebrow .eyebrow-line {
          width: 28px;
          height: 2.5px;
          background-color: #087F8C;
          border-radius: 2px;
        }

        .services-title {
          font-family: 'Poppins', sans-serif;
          font-size: 46px;
          font-weight: 800;
          color: #12263A;
          letter-spacing: -1.2px;
          margin: 0 0 16px;
          line-height: 1.15;
        }

        .services-title .highlight {
          color: #087F8C;
        }

        .services-sub {
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          color: #556980;
          line-height: 1.6;
          max-width: 600px;
          margin: 0 auto;
        }

        .services-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
        }

        .service-card-item {
          background: #FFFFFF;
          border-radius: 28px;
          padding: 18px;
          border: 1px solid rgba(226, 232, 240, 0.7);
          box-shadow: 0 10px 30px rgba(18, 38, 58, 0.05);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
        }

        .service-card-item:hover {
          transform: translateY(-5px);
          box-shadow: 0 18px 40px rgba(8, 127, 140, 0.12);
          border-color: rgba(8, 127, 140, 0.25);
        }

        .service-image-box {
          width: 100%;
          height: 220px;
          border-radius: 18px;
          overflow: hidden;
          margin-bottom: 20px;
          background: #F1F5F9;
        }

        .service-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.35s ease;
        }

        @media (hover: hover) and (pointer: fine) {
          .service-card-item:hover .service-card-img {
            transform: scale(1.04);
          }
        }

        .service-card-body {
          padding: 2px 6px 8px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .service-title-text {
          font-family: 'Poppins', sans-serif;
          font-size: 1.25rem;
          font-weight: 700;
          color: #12263A;
          margin: 0 0 10px;
          line-height: 1.3;
        }

        .service-desc-text {
          font-family: 'Inter', sans-serif;
          font-size: 0.875rem;
          color: #64748B;
          line-height: 1.55;
          margin: 0 0 24px;
          flex: 1;
        }

        .service-enquire-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          color: #087F8C;
          font-family: 'Poppins', sans-serif;
          font-size: 14px;
          font-weight: 700;
          transition: color 0.2s ease;
          margin-top: auto;
          width: fit-content;
        }

        .service-enquire-btn:hover {
          color: #055C65;
        }

        .enquire-arrow-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #D1F2EF;
          color: #087F8C;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .service-enquire-btn:hover .enquire-arrow-circle {
          background: #087F8C;
          color: #FFFFFF;
          transform: translateX(3px);
        }

        /* WHY CHOOSE US (EXACT REFERENCE BENTO DESIGN) */
        .why-us-section {
          padding: 100px 0;
          background: #EEF2F2;
        }

        .why-us-bento-container {
          display: grid;
          grid-template-columns: 1.15fr 2fr;
          border-radius: 32px;
          overflow: hidden;
          box-shadow: 0 20px 48px rgba(18, 38, 58, 0.08);
          border: 1px solid rgba(226, 232, 240, 0.6);
        }

        /* Left Hero Column */
        .why-hero-col {
          background: #005C66;
          padding: 48px 44px;
          display: flex;
          flex-direction: column;
          color: #FFFFFF;
          position: relative;
        }

        .why-machine-icon-box {
          width: 54px;
          height: 54px;
          border-radius: 14px;
          border: 1.5px solid rgba(255, 255, 255, 0.35);
          background: rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
          margin-bottom: 24px;
        }

        .why-hero-title {
          font-family: 'Poppins', sans-serif;
          font-size: 32px;
          font-weight: 800;
          color: #FFFFFF;
          line-height: 1.18;
          letter-spacing: -0.5px;
          margin: 0 0 32px;
          text-transform: uppercase;
        }

        .why-checklist {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 40px;
        }

        .why-check-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .why-check-circle {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #20C9B6;
          color: #005C66;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .why-check-label {
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          font-weight: 600;
          color: #FFFFFF;
          line-height: 1.35;
        }

        .why-contact-btn {
          margin-top: auto;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          height: 52px;
          padding: 0 34px;
          border-radius: 9999px;
          background: #FF6B54;
          color: #FFFFFF;
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          font-size: 15px;
          border: none;
          cursor: pointer;
          width: fit-content;
          box-shadow: 0 10px 24px rgba(255, 107, 84, 0.4);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .why-contact-btn:hover {
          background: #E8553F;
          transform: translateY(-2px);
          box-shadow: 0 14px 28px rgba(255, 107, 84, 0.5);
        }

        /* 4 Bento Grid Cells */
        .why-grid-cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 1fr 1fr;
        }

        .why-card-cell {
          padding: 44px 38px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          transition: background 0.2s ease;
        }

        .why-card-cell.mint-bg {
          background: #EFF9F8;
        }

        .why-card-cell.white-bg {
          background: #FFFFFF;
        }

        .why-card-cell.dark-teal-bg {
          background: #005C66;
        }

        .why-icon-bubble {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 22px;
          flex-shrink: 0;
        }

        .why-icon-bubble.mint-bubble {
          background: #D4F3EF;
          color: #087F8C;
        }

        .why-icon-bubble.peach-bubble {
          background: #FFEBE7;
          color: #FF6B54;
        }

        .why-icon-bubble.dark-bubble {
          background: rgba(255, 255, 255, 0.15);
          color: #20C9B6;
        }

        .why-cell-title {
          font-family: 'Poppins', sans-serif;
          font-size: 21px;
          font-weight: 700;
          line-height: 1.25;
          margin: 0 0 14px;
        }

        .why-cell-title.dark-text {
          color: #12263A;
        }

        .why-cell-title.teal-text {
          color: #087F8C;
        }

        .why-cell-title.white-text {
          color: #FFFFFF;
        }

        .why-cell-desc {
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          color: #556980;
          line-height: 1.6;
          margin: 0;
        }

        .why-cell-desc.white-desc {
          color: rgba(255, 255, 255, 0.85);
        }

        /* WORKING PROCESS - DIV 6 */
        .process-section {
          padding: 96px 0 110px;
          background: #EEFAF8;
          position: relative;
          overflow: hidden;
        }

        .process-head {
          margin-bottom: 54px;
        }

        .process-eyebrow-container {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          margin-bottom: 16px;
        }

        .process-eyebrow-line {
          width: 28px;
          height: 2px;
          background: #62C4B8;
          border-radius: 2px;
        }

        .process-eyebrow-badge {
          display: inline-block;
          background: #D2F2EE;
          color: #087F8C;
          font-family: 'Poppins', sans-serif;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 6px 18px;
          border-radius: 999px;
        }

        .process-main-title {
          font-family: 'Poppins', sans-serif;
          font-size: 2.75rem;
          font-weight: 800;
          color: #12263A;
          line-height: 1.2;
          margin: 0 0 14px;
        }

        .process-title-highlight {
          color: #087F8C;
        }

        .process-subtitle {
          font-family: 'Inter', sans-serif;
          font-size: 1.05rem;
          color: #5A6E85;
          max-width: 650px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .process-steps-wrapper {
          position: relative;
          max-width: 1160px;
          margin: 0 auto;
        }

        .process-connecting-curve {
          position: absolute;
          top: 36%;
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
          gap: 32px;
        }

        .process-step-card {
          background: #FFFFFF;
          border-radius: 28px;
          padding: 38px 28px 46px;
          position: relative;
          text-align: center;
          border: 1px solid rgba(220, 235, 235, 0.6);
          box-shadow: 0 14px 38px rgba(18, 38, 58, 0.05);
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .process-step-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 24px 50px rgba(8, 127, 140, 0.12);
        }

        .process-step-tag {
          position: absolute;
          top: 24px;
          left: 24px;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #DDF5F2;
          color: #087F8C;
          font-family: 'Poppins', sans-serif;
          font-size: 0.95rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .process-card-img-wrap {
          width: 140px;
          height: 140px;
          margin: 16px auto 26px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .process-card-img {
          width: 140px;
          height: 140px;
          object-fit: contain;
          user-select: none;
        }

        .process-step-title {
          font-family: 'Poppins', sans-serif;
          font-size: 1.4rem;
          font-weight: 800;
          color: #12263A;
          margin: 0 0 12px;
          line-height: 1.35;
        }

        .process-step-desc {
          font-family: 'Inter', sans-serif;
          font-size: 0.95rem;
          color: #64748B;
          line-height: 1.6;
          margin: 0;
          max-width: 290px;
        }

        /* TESTIMONIALS */
        /* TESTIMONIALS - DIV 7 */
        .testimonials-section {
          padding: 96px 0 108px;
          background: #FFFFFF;
        }

        .testimonials-head {
          margin-bottom: 52px;
        }

        .testimonials-pill {
          display: inline-block;
          background: #E6F2F3;
          color: #087F8C;
          font-family: 'Poppins', sans-serif;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 6px 18px;
          border-radius: 999px;
          margin-bottom: 16px;
        }

        .testimonials-title {
          font-family: 'Poppins', sans-serif;
          font-size: 2.75rem;
          font-weight: 800;
          color: #12263A;
          line-height: 1.2;
          margin: 0 0 14px;
        }

        .testimonials-subtitle {
          font-family: 'Inter', sans-serif;
          font-size: 1.05rem;
          color: #5A6E85;
          max-width: 680px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          max-width: 1160px;
          margin: 0 auto;
        }

        .testimonial-card {
          background: #F8FAF8;
          border: 1.5px solid #E2EFEA;
          border-radius: 20px;
          padding: 34px 28px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease, border-color 0.3s ease;
        }

        .testimonial-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 36px rgba(18, 38, 58, 0.06);
          border-color: #BCEAE6;
        }

        .testimonial-stars {
          display: flex;
          gap: 5px;
          margin-bottom: 18px;
        }

        .testimonial-quote {
          font-family: 'Inter', sans-serif;
          font-size: 0.95rem;
          color: #243342;
          line-height: 1.65;
          margin: 0 0 28px;
          font-style: normal;
        }

        .testimonial-author-block {
          margin-top: auto;
        }

        .testimonial-author-name {
          font-family: 'Poppins', sans-serif;
          font-size: 1.05rem;
          font-weight: 700;
          color: #12263A;
          margin: 0 0 3px;
        }

        .testimonial-author-role {
          font-family: 'Inter', sans-serif;
          font-size: 0.85rem;
          color: #64748B;
          margin: 0;
        }

        /* CONTACT & SUPPORT - DIV 9 */
        .contact-section {
          padding: 96px 0 110px;
          background: #F8FAF8;
        }

        .contact-head {
          margin-bottom: 52px;
        }

        .contact-pill {
          display: inline-block;
          background: #DDF5F2;
          color: #087F8C;
          font-family: 'Poppins', sans-serif;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 6px 18px;
          border-radius: 999px;
          margin-bottom: 16px;
        }

        .contact-main-title {
          font-family: 'Poppins', sans-serif;
          font-size: 2.75rem;
          font-weight: 800;
          color: #12263A;
          line-height: 1.2;
          margin: 0 0 14px;
        }

        .contact-subtitle {
          font-family: 'Inter', sans-serif;
          font-size: 1.05rem;
          color: #5A6E85;
          max-width: 650px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .contact-cards-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          max-width: 1160px;
          margin: 0 auto;
          align-items: stretch;
        }

        .contact-info-card,
        .contact-form-card {
          background: #FFFFFF;
          border: 1.5px solid #E1E8E6;
          border-radius: 28px;
          padding: 44px 40px;
          box-shadow: 0 8px 30px rgba(18, 38, 58, 0.03);
          display: flex;
          flex-direction: column;
          height: 100%;
          box-sizing: border-box;
        }

        .contact-card-title {
          font-family: 'Poppins', sans-serif;
          font-size: 1.55rem;
          font-weight: 800;
          color: #12263A;
          margin: 0 0 16px;
          line-height: 1.25;
        }

        .contact-card-desc {
          font-family: 'Inter', sans-serif;
          font-size: 0.95rem;
          color: #5A6E85;
          line-height: 1.6;
          margin: 0 0 36px;
        }

        .contact-form-sub {
          font-family: 'Inter', sans-serif;
          font-size: 0.88rem;
          color: #7B8E9D;
          margin: -8px 0 24px;
        }

        .contact-details-list {
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        .contact-item {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .contact-icon-squircle {
          width: 46px;
          height: 46px;
          border-radius: 13px;
          background: #E8F8F6;
          color: #087F8C;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .contact-item-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .contact-detail-label {
          font-family: 'Inter', sans-serif;
          font-size: 0.82rem;
          color: #7B8E9D;
          font-weight: 500;
          line-height: 1.2;
        }

        .contact-detail-value {
          font-family: 'Poppins', sans-serif;
          font-size: 0.98rem;
          font-weight: 700;
          color: #12263A;
          line-height: 1.3;
        }

        .contact-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .contact-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .contact-field-group {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .contact-field-label {
          font-family: 'Poppins', sans-serif;
          font-size: 0.84rem;
          font-weight: 700;
          color: #12263A;
        }

        .contact-field-input,
        .contact-field-textarea {
          background: #F8FAF8;
          border: 1.5px solid #E2E8F0;
          border-radius: 12px;
          padding: 12px 16px;
          font-family: 'Inter', sans-serif;
          font-size: 0.92rem;
          color: #12263A;
          width: 100%;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
          box-sizing: border-box;
        }

        .contact-field-input:focus,
        .contact-field-textarea:focus {
          outline: none;
          background: #FFFFFF;
          border-color: #087F8C;
          box-shadow: 0 0 0 3px rgba(8, 127, 140, 0.12);
        }

        .contact-field-input::placeholder,
        .contact-field-textarea::placeholder {
          color: #94A3B8;
        }

        .contact-field-textarea {
          resize: vertical;
          min-height: 96px;
        }

        .contact-submit-btn {
          background: #087F8C;
          color: #FFFFFF;
          font-family: 'Poppins', sans-serif;
          font-size: 1rem;
          font-weight: 700;
          border: none;
          border-radius: 12px;
          padding: 14px 24px;
          width: 100%;
          cursor: pointer;
          transition: background 0.25s ease, transform 0.2s ease, box-shadow 0.25s ease;
          margin-top: 8px;
        }

        .contact-submit-btn:hover {
          background: #066974;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(8, 127, 140, 0.25);
        }

        .contact-submit-btn:active {
          transform: translateY(0);
        }

        .contact-success-msg {
          text-align: center;
          padding: 40px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .contact-success-msg h4 {
          font-family: 'Poppins', sans-serif;
          font-size: 1.25rem;
          font-weight: 700;
          color: #12263A;
          margin: 0;
        }

        .contact-success-msg p {
          font-family: 'Inter', sans-serif;
          font-size: 0.95rem;
          color: #5A6E85;
          margin: 0;
        }

        /* CTA BANNER - DIV 10 */
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
        .cta-banner-section h1,
        .cta-banner-section h2 {
          font-family: 'Poppins', sans-serif;
          font-size: 2.85rem;
          font-weight: 800;
          color: #000000;
          margin: 0 0 16px;
          line-height: 1.2;
        }

        .cta-banner-sub,
        .cta-banner-section p {
          font-family: 'Inter', sans-serif;
          font-size: 1.05rem;
          color: #000000;
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
          transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
        }

        .cta-banner-btn:hover {
          background: #FF6647;
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.22);
        }

        .cta-banner-btn:active {
          transform: translateY(0);
        }

        @media (max-width: 992px) {
          .hero-container,
          .about-grid,
          .why-us-grid,
          .contact-grid {
            grid-template-columns: 1fr;
          }
          .hero-headline {
            font-size: 52px;
            line-height: 52px;
            letter-spacing: -1.3px;
          }
          .hero-gradient-overlay {
            background: linear-gradient(
              180deg, 
              rgba(255, 255, 255, 0.94) 0%, 
              rgba(255, 255, 255, 0.82) 45%, 
              rgba(255, 255, 255, 0.5) 100%
            );
          }
          .hero-glass-cards-col {
            justify-content: flex-start;
          }
          .hero-cards-stack {
            max-width: 100%;
          }
          .services-title {
            font-size: 38px;
          }
          .services-cards-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 24px;
          }
          .why-us-bento-container {
            grid-template-columns: 1fr;
          }
          .why-grid-cards {
            grid-template-columns: 1fr 1fr;
          }
          .process-connecting-curve {
            display: none;
          }
          .process-main-title {
            font-size: 2.2rem;
          }
          .process-steps-grid {
            grid-template-columns: 1fr;
            max-width: 440px;
            margin: 0 auto;
          }
          .testimonials-grid {
            grid-template-columns: 1fr;
            max-width: 480px;
            margin: 0 auto;
          }
          .testimonials-title {
            font-size: 2.2rem;
          }
          .contact-cards-grid {
            grid-template-columns: 1fr;
            max-width: 620px;
            margin: 0 auto;
          }
          .contact-main-title {
            font-size: 2.2rem;
          }
        }

        @media (max-width: 640px) {
          .contact-section {
            padding: 70px 0 80px;
          }
          .contact-main-title {
            font-size: 1.95rem;
          }
          .contact-info-card,
          .contact-form-card {
            padding: 32px 24px;
          }
          .contact-form-row {
            grid-template-columns: 1fr;
          }
          .testimonials-section {
            padding: 70px 0 80px;
          }
          .testimonials-title {
            font-size: 1.95rem;
          }
          .testimonial-card {
            padding: 28px 20px;
          }
          .why-grid-cards {
            grid-template-columns: 1fr;
          }
          .why-hero-col {
            padding: 36px 24px;
          }
          .why-card-cell {
            padding: 32px 24px;
          }
          .why-contact-btn {
            width: 100%;
          }
          .services-title {
            font-size: 30px;
          }
          .services-cards-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .service-image-box {
            height: 200px;
          }
          .hero-headline {
            font-size: 38px;
            line-height: 40px;
            letter-spacing: -1px;
          }
          .hero-description {
            font-size: 1.05rem;
          }
          .hero-cta-group {
            flex-direction: column;
            width: 100%;
          }
          .btn-coral-pill, .btn-white-pill {
            width: 100%;
            justify-content: center;
          }
          .hero-trust-badges {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }
          .cta-banner-section {
            padding: 70px 16px;
          }
          .cta-banner-title {
            font-size: 2rem;
          }
          .cta-banner-sub {
            font-size: 0.95rem;
          }
          .cta-banner-btn {
            width: 100%;
            padding: 14px 20px;
          }
        }
      `}</style>
    </div>
  );
};
