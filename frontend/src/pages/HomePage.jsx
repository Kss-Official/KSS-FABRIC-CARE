import React, { useState } from 'react';
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
  Check
} from 'lucide-react';

export const HomePage = () => {
  const { startBooking, navigateTo } = useBooking();
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
      title: 'Wash & Laundry',
      desc: 'Everyday casuals, sheets & towels washed with hypoallergenic detergents and fresh fragrance.',
      image: '/assets/service-wash.jpg',
      tag: 'Everyday Care'
    },
    {
      id: 'dry-cleaning',
      title: 'Dry Cleaning',
      desc: 'Expert care for suits, silk sarees, blazers, and luxury garments with eco-friendly solvents.',
      image: '/assets/service-dryclean.jpg',
      tag: 'Delicate & Suits'
    },
    {
      id: 'steam-iron',
      title: 'Steam Ironing',
      desc: 'Crisp, wrinkle-free finish with temperature-controlled steam that rejuvenates garment fibers.',
      image: '/assets/service-iron.jpg',
      tag: 'Wrinkle-Free'
    },
    {
      id: 'stain-removal',
      title: 'Stain Removal',
      desc: 'Targeted spot cleaning for stubborn grease, wine, coffee, and ink without fiber damage.',
      image: '/assets/service-stain.jpg',
      tag: 'Deep Clean'
    },
    {
      id: 'shoe-laundry',
      title: 'Shoe Cleaning',
      desc: 'Deep cleaning, midsole whitening, and deodorization for sneakers, suede, and leather footwear.',
      image: '/assets/service-shoe.jpg',
      tag: 'Footwear Care'
    },
    {
      id: 'home-care',
      title: 'Curtain Cleaning',
      desc: 'Dust mite removal, steam cleaning, and gentle pressing for drapes, upholstery, and bed linen.',
      image: '/assets/service-curtain.jpg',
      tag: 'Home Fabrics'
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
      {/* 1. HERO SECTION */}
      <section className="hero-section">
        <div className="container hero-container">
          <div className="hero-content">
            <span className="hero-badge animate-fade-in">
              <Sparkles size={16} className="text-coral" />
              <span>Bangalore's #1 Eco-Friendly Laundry</span>
            </span>

            <h1 className="hero-headline">
              Fresh Clothes. <br />
              <span className="highlight-text">Brighter Days.</span>
            </h1>

            <p className="hero-description">
              Experience hassle-free laundry and premium dry cleaning with free doorstep pickup & delivery, organic chemical-free washing, and 24-hour express options.
            </p>

            <div className="hero-cta-group">
              <button 
                id="hero-book-now-btn"
                className="btn btn-coral btn-lg"
                onClick={() => startBooking()}
              >
                <span>Book a Pickup</span>
                <ArrowRight size={18} />
              </button>
              <button 
                className="btn btn-white btn-lg"
                onClick={() => {
                  document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <span>Calculate Pricing</span>
              </button>
            </div>

            {/* Quick Hero Feature Badges */}
            <div className="hero-stats-row">
              <div className="hero-stat-item">
                <span className="stat-number">50,000+</span>
                <span className="stat-label">Happy Garments Cleaned</span>
              </div>
              <div className="stat-divider" />
              <div className="hero-stat-item">
                <div className="stat-stars">
                  <Star size={16} fill="#FFB800" color="#FFB800" />
                  <span className="stat-number">4.9 / 5</span>
                </div>
                <span className="stat-label">Customer Rating</span>
              </div>
              <div className="stat-divider" />
              <div className="hero-stat-item">
                <span className="stat-number">24 Hours</span>
                <span className="stat-label">Express Turnaround</span>
              </div>
            </div>
          </div>

          <div className="hero-visual-col">
            <div className="hero-image-card">
              <img 
                src="/assets/hero-bg.jpg" 
                alt="Modern Clean Laundry Room" 
                className="hero-main-img" 
              />
              <div className="floating-badge-eco">
                <Leaf size={18} className="text-teal" />
                <div>
                  <span className="badge-title">100% Eco-Friendly</span>
                  <span className="badge-sub">Zero Toxic Solvents</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. LAUNDRY WALLAH AT YOUR SERVICE */}
      <section className="about-section" id="about-section">
        <div className="container">
          <div className="about-grid">
            <div className="about-image-col">
              <div className="about-image-frame">
                <img 
                  src="/assets/laundry-wallah.jpg" 
                  alt="Laundry Wallah Garments Care" 
                  className="about-img"
                />
              </div>
            </div>

            <div className="about-content-col">
              <span className="section-tag pill">ABOUT LAUNDRIX</span>
              <h2 className="section-title">
                Laundry Wallah <br />
                <span className="highlight">At Your Service</span>
              </h2>

              <p className="about-desc">
                We believe that clean, crisp clothes elevate your everyday confidence. Laundrix combines traditional fabric mastery with modern European eco-friendly washing technology to give your wardrobe the royal care it deserves.
              </p>

              <div className="about-features-list">
                <div className="about-feature-item">
                  <div className="about-icon-wrap">
                    <Truck size={20} />
                  </div>
                  <div>
                    <h4 className="feature-item-title">Free Doorstep Pickup & Drop</h4>
                    <p className="feature-item-desc">Convenient scheduled slots that fit right into your busy day.</p>
                  </div>
                </div>

                <div className="about-feature-item">
                  <div className="about-icon-wrap">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h4 className="feature-item-title">24–48 Hours Turnaround</h4>
                    <p className="feature-item-desc">Lightning-fast wash, dry, iron, and doorstep delivery.</p>
                  </div>
                </div>

                <div className="about-feature-item">
                  <div className="about-icon-wrap">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h4 className="feature-item-title">Zero Color Bleed & Safe Solvents</h4>
                    <p className="feature-item-desc">Individual batch processing ensures your whites stay bright.</p>
                  </div>
                </div>
              </div>

              <button 
                className="btn btn-coral mt-4"
                onClick={() => navigateTo('services', 'dry-cleaning')}
              >
                <span>Explore All Services</span>
                <ArrowRight size={17} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PROFESSIONAL CARE FOR EVERY FABRIC (SERVICES GRID) */}
      <section className="services-section" id="services-section">
        <div className="container">
          <div className="text-center services-head">
            <span className="section-tag pill">OUR SERVICES</span>
            <h2 className="section-title">
              Professional Care <span className="highlight">for Every Fabric</span>
            </h2>
            <p className="section-subtitle mx-auto">
              From everyday tees to delicate designer lehengas and suits, we provide tailored wash cycles for every thread.
            </p>
          </div>

          <div className="services-cards-grid">
            {services.map((s) => (
              <div key={s.id} className="home-service-card">
                <div className="service-thumb-wrap">
                  <img src={s.image} alt={s.title} className="service-thumb-img" />
                  <span className="service-tag-chip">{s.tag}</span>
                </div>
                <div className="service-card-info">
                  <h3 className="service-card-name">{s.title}</h3>
                  <p className="service-card-text">{s.desc}</p>
                  <button 
                    className="service-explore-btn"
                    onClick={() => navigateTo('services', s.id)}
                  >
                    <span>Explore More</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. WHY PEOPLE CHOOSE US (DARK TEAL HERO + 4 CARDS) */}
      <section className="why-us-section" id="why-us-section">
        <div className="container">
          <div className="why-us-grid">
            {/* Left High-Impact Dark Teal Card */}
            <div className="why-us-highlight-box">
              <span className="why-tag">WHY CHOOSE US</span>
              <h3 className="why-box-title">Why People Choose Laundrix</h3>
              <p className="why-box-desc">
                Over 50,000 households in Bangalore trust us for their weekly laundry and special garment care.
              </p>

              <div className="why-points-list">
                <div className="why-point-row">
                  <Check size={18} className="why-point-check" />
                  <span>100% Eco-Friendly & Skin-Safe Detergents</span>
                </div>
                <div className="why-point-row">
                  <Check size={18} className="why-point-check" />
                  <span>Express 24-Hour Turnaround Available</span>
                </div>
                <div className="why-point-row">
                  <Check size={18} className="why-point-check" />
                  <span>Real-Time SMS & WhatsApp Order Tracking</span>
                </div>
                <div className="why-point-row">
                  <Check size={18} className="why-point-check" />
                  <span>Dedicated Fabric Specialists & Steam Press</span>
                </div>
              </div>

              <button 
                className="btn btn-coral w-full why-cta-btn"
                onClick={() => startBooking()}
              >
                <span>Get Started Now</span>
                <ArrowRight size={17} />
              </button>
            </div>

            {/* Right 2x2 Feature Grid */}
            <div className="why-features-2x2">
              <div className="why-feature-card">
                <div className="why-feat-icon-wrap teal">
                  <Clock size={24} />
                </div>
                <h4 className="feat-card-title">Express 24h Delivery</h4>
                <p className="feat-card-desc">
                  Need clean clothes for an urgent meeting or flight? Our express batch gives you same-day turnaround.
                </p>
              </div>

              <div className="why-feature-card">
                <div className="why-feat-icon-wrap coral">
                  <Truck size={24} />
                </div>
                <h4 className="feat-card-title">Doorstep Pickup & Drop</h4>
                <p className="feat-card-desc">
                  No more lugging heavy laundry bags. Our riders pick up and deliver right at your flat's door.
                </p>
              </div>

              <div className="why-feature-card">
                <div className="why-feat-icon-wrap teal">
                  <ShieldCheck size={24} />
                </div>
                <h4 className="feat-card-title">Zero Fabric Damage</h4>
                <p className="feat-card-desc">
                  Temperature-controlled washing drums and anti-color bleed wash cycles protect your luxury garments.
                </p>
              </div>

              <div className="why-feature-card">
                <div className="why-feat-icon-wrap mint">
                  <Sparkles size={24} />
                </div>
                <h4 className="feat-card-title">Affordable & Transparent</h4>
                <p className="feat-card-desc">
                  Clear per-piece and per-kg pricing with zero hidden surcharges or surprise pickup fees.
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
            <span className="section-tag pill">HOW IT WORKS</span>
            <h2 className="section-title">
              Our <span className="highlight">Working Process</span>
            </h2>
            <p className="section-subtitle mx-auto">
              Getting fresh, fragrant clothes is as easy as three simple taps.
            </p>
          </div>

          <div className="process-steps-grid">
            <div className="process-step-card">
              <div className="process-step-num">01</div>
              <div className="process-icon-wrap">
                <Truck size={32} />
              </div>
              <h3 className="process-step-title">Free Pickup at Your Door</h3>
              <p className="process-step-desc">
                Book your preferred slot online. Our rider arrives with customized laundry bags to collect your garments.
              </p>
            </div>

            <div className="process-step-card">
              <div className="process-step-num">02</div>
              <div className="process-icon-wrap">
                <Sparkles size={32} />
              </div>
              <h3 className="process-step-title">Care & Wash Done</h3>
              <p className="process-step-desc">
                Garments are inspected, sorted by color, treated for stains, cleaned with organic detergents, and steam pressed.
              </p>
            </div>

            <div className="process-step-card">
              <div className="process-step-num">03</div>
              <div className="process-icon-wrap">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="process-step-title">Convenient Delivery</h3>
              <p className="process-step-desc">
                Crisp, neatly folded or hung garments delivered back to your home, ready to wear immediately.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. CUSTOMER TESTIMONIALS */}
      <section className="testimonials-section">
        <div className="container">
          <div className="text-center testimonials-head">
            <span className="section-tag pill">REVIEWS</span>
            <h2 className="section-title">
              Loved by <span className="highlight">Every Customer</span>
            </h2>
            <p className="section-subtitle mx-auto">
              Read how Laundrix saves hours of weekend chore time for thousands of busy professionals and families.
            </p>
          </div>

          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="test-stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill="#FFB800" color="#FFB800" />
                ))}
              </div>
              <p className="test-quote">
                "The dry cleaning on my designer blazer was immaculate. Stains that other cleaners couldn't remove vanished completely without any harsh chemical smells."
              </p>
              <div className="test-author">
                <div className="author-avatar">AK</div>
                <div>
                  <div className="author-name">Ananya Kulkarni</div>
                  <div className="author-role">Indiranagar, Bengaluru</div>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="test-stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill="#FFB800" color="#FFB800" />
                ))}
              </div>
              <p className="test-quote">
                "Super convenient doorstep service! The rider is always polite and on time. Clothes come back smelling fresh, perfectly folded, and ready for work."
              </p>
              <div className="test-author">
                <div className="author-avatar teal">RS</div>
                <div>
                  <div className="author-name">Rahul Sharma</div>
                  <div className="author-role">Koramangala, Bengaluru</div>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="test-stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill="#FFB800" color="#FFB800" />
                ))}
              </div>
              <p className="test-quote">
                "Their steam ironing service is unbeatable. Curtains and heavy bedsheets were handled effortlessly. I’ve subscribed for the monthly plan!"
              </p>
              <div className="test-author">
                <div className="author-avatar coral">PV</div>
                <div>
                  <div className="author-name">Priya Verma</div>
                  <div className="author-role">Whitefield, Bengaluru</div>
                </div>
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
          <div className="contact-grid">
            <div className="contact-info-col">
              <span className="section-tag pill">CONTACT US</span>
              <h2 className="section-title">
                Get in Touch with <br />
                <span className="highlight">Laundrix</span>
              </h2>
              <p className="contact-sub">
                Have questions about bulk orders, corporate services, or garment care? Reach out to our 24/7 customer support desk.
              </p>

              <div className="contact-details-list">
                <div className="contact-item">
                  <div className="contact-icon-wrap"><Phone size={18} /></div>
                  <div>
                    <span className="item-label">Customer Helpline</span>
                    <span className="item-val">+91 98765 43210</span>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-icon-wrap"><Mail size={18} /></div>
                  <div>
                    <span className="item-label">Support Email</span>
                    <span className="item-val">support@laundrix.com</span>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-icon-wrap"><MapPin size={18} /></div>
                  <div>
                    <span className="item-label">Central Facility</span>
                    <span className="item-val">100ft Road, Indiranagar, Bengaluru - 560038</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="contact-form-col">
              <div className="contact-form-card">
                {contactSubmitted ? (
                  <div className="contact-success-msg animate-fade-in">
                    <CheckCircle2 size={44} className="text-teal" />
                    <h3>Thank you for reaching out!</h3>
                    <p>Our care representative will call you back within 15 minutes.</p>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit}>
                    <h3 className="form-card-title">Send us a Message</h3>
                    
                    <div className="form-two-col">
                      <div className="form-group">
                        <label className="form-label">Your Name</label>
                        <input
                          type="text"
                          required
                          className="form-input"
                          placeholder="e.g. John Doe"
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Phone Number</label>
                        <input
                          type="tel"
                          required
                          className="form-input"
                          placeholder="+91 98765 43210"
                          value={contactForm.phone}
                          onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-group mt-3">
                      <label className="form-label">Email Address</label>
                      <input
                        type="email"
                        required
                        className="form-input"
                        placeholder="john@example.com"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      />
                    </div>

                    <div className="form-group mt-3">
                      <label className="form-label">Your Message / Query</label>
                      <textarea
                        rows="3"
                        required
                        className="form-input"
                        placeholder="Tell us about your requirements..."
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      />
                    </div>

                    <button type="submit" className="btn btn-teal w-full mt-4">
                      <span>Send Message</span>
                      <Send size={16} />
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. BOTTOM BANNER CTA */}
      <section className="cta-banner-section">
        <div className="container">
          <div className="cta-banner-card">
            <div className="cta-banner-content">
              <h2 className="cta-banner-title">Ready for fresh clothes?</h2>
              <p className="cta-banner-sub">
                Schedule your pickup today and enjoy 20% OFF on your first laundry order!
              </p>
              <button 
                className="btn btn-coral btn-lg cta-banner-btn"
                onClick={() => startBooking()}
              >
                <span>Book a Pickup Now</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .home-page-container {
          width: 100%;
        }

        /* HERO */
        .hero-section {
          background: linear-gradient(180deg, #F0FBF9 0%, #FFFFFF 100%);
          padding: 60px 0 80px;
          position: relative;
        }

        .hero-container {
          display: grid;
          grid-template-columns: 1.15fr 1fr;
          gap: 48px;
          align-items: center;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #ffffff;
          padding: 6px 16px;
          border-radius: 999px;
          font-size: 0.8125rem;
          font-weight: 700;
          color: #0D7A75;
          box-shadow: 0 2px 10px rgba(13, 122, 117, 0.08);
          margin-bottom: 20px;
          border: 1px solid #CCF0EC;
        }

        .text-coral { color: #FF6B50; }
        .text-teal { color: #0D7A75; }

        .hero-headline {
          font-size: 3.25rem;
          font-weight: 800;
          line-height: 1.15;
          color: #111827;
          letter-spacing: -0.03em;
          margin-bottom: 18px;
        }

        .highlight-text {
          color: #0D7A75;
        }

        .hero-description {
          font-size: 1.0625rem;
          color: #4B5563;
          line-height: 1.65;
          margin-bottom: 32px;
          max-width: 540px;
        }

        .hero-cta-group {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 40px;
          flex-wrap: wrap;
        }

        .hero-stats-row {
          display: flex;
          align-items: center;
          gap: 24px;
          padding-top: 24px;
          border-top: 1px solid #E5E7EB;
        }

        .hero-stat-item {
          display: flex;
          flex-direction: column;
        }

        .stat-number {
          font-size: 1.25rem;
          font-weight: 800;
          color: #111827;
        }

        .stat-label {
          font-size: 0.75rem;
          color: #6B7280;
          font-weight: 500;
        }

        .stat-stars {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .stat-divider {
          width: 1px;
          height: 36px;
          background: #E5E7EB;
        }

        .hero-image-card {
          position: relative;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 20px 48px rgba(13, 122, 117, 0.12);
        }

        .hero-main-img {
          width: 100%;
          height: 440px;
          object-fit: cover;
          display: block;
        }

        .floating-badge-eco {
          position: absolute;
          bottom: 24px;
          left: 24px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          padding: 12px 18px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          border: 1px solid #CCF0EC;
        }

        .badge-title {
          font-weight: 700;
          font-size: 0.875rem;
          color: #1A202C;
          display: block;
        }

        .badge-sub {
          font-size: 0.75rem;
          color: #718096;
          display: block;
        }

        /* ABOUT SECTION */
        .about-section {
          padding: 90px 0;
          background: #ffffff;
        }

        .about-grid {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 56px;
          align-items: center;
        }

        .about-image-frame {
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.08);
        }

        .about-img {
          width: 100%;
          height: 480px;
          object-fit: cover;
        }

        .about-desc {
          font-size: 1rem;
          color: #4A5568;
          line-height: 1.7;
          margin-bottom: 28px;
        }

        .about-features-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .about-feature-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .about-icon-wrap {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #EBF8F7;
          color: #0D7A75;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .feature-item-title {
          font-size: 1rem;
          font-weight: 700;
          color: #1A202C;
        }

        .feature-item-desc {
          font-size: 0.8125rem;
          color: #718096;
          margin-top: 2px;
        }

        /* SERVICES SECTION */
        .services-section {
          padding: 90px 0;
          background: #F8FBFC;
        }

        .services-head {
          margin-bottom: 50px;
        }

        .services-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 28px;
        }

        .home-service-card {
          background: #ffffff;
          border-radius: 20px;
          overflow: hidden;
          border: 1.5px solid #E6EEF0;
          transition: all 0.25s ease;
          display: flex;
          flex-direction: column;
        }

        .home-service-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 36px rgba(13, 122, 117, 0.1);
          border-color: #BCEAE6;
        }

        .service-thumb-wrap {
          position: relative;
          height: 200px;
          overflow: hidden;
        }

        .service-thumb-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }

        .home-service-card:hover .service-thumb-img {
          transform: scale(1.05);
        }

        .service-tag-chip {
          position: absolute;
          top: 14px;
          left: 14px;
          background: rgba(255, 255, 255, 0.95);
          color: #0D7A75;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 999px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .service-card-info {
          padding: 22px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .service-card-name {
          font-size: 1.1875rem;
          font-weight: 800;
          color: #1A202C;
          margin-bottom: 8px;
        }

        .service-card-text {
          font-size: 0.875rem;
          color: #718096;
          line-height: 1.55;
          margin-bottom: 20px;
          flex: 1;
        }

        .service-explore-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #0D7A75;
          font-size: 0.875rem;
          font-weight: 700;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          transition: gap 0.2s;
        }

        .service-explore-btn:hover {
          gap: 10px;
        }

        /* WHY CHOOSE US */
        .why-us-section {
          padding: 90px 0;
          background: #ffffff;
        }

        .why-us-grid {
          display: grid;
          grid-template-columns: 1fr 1.35fr;
          gap: 32px;
          align-items: stretch;
        }

        .why-us-highlight-box {
          background: #0E4B56;
          color: #ffffff;
          border-radius: 24px;
          padding: 40px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: 0 16px 40px rgba(14, 75, 86, 0.25);
        }

        .why-tag {
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          color: #64DFDF;
          margin-bottom: 8px;
        }

        .why-box-title {
          font-size: 2rem;
          font-weight: 800;
          line-height: 1.25;
          margin-bottom: 14px;
        }

        .why-box-desc {
          font-size: 0.9375rem;
          color: #CBD5E0;
          line-height: 1.6;
          margin-bottom: 28px;
        }

        .why-points-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 32px;
        }

        .why-point-row {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 0.9375rem;
          font-weight: 600;
        }

        .why-point-check {
          color: #64DFDF;
          flex-shrink: 0;
        }

        .why-cta-btn {
          margin-top: auto;
        }

        .why-features-2x2 {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        .why-feature-card {
          background: #FAFCFC;
          border: 1.5px solid #E6EEF0;
          border-radius: 20px;
          padding: 28px 24px;
          transition: all 0.2s;
        }

        .why-feature-card:hover {
          border-color: #BCEAE6;
          box-shadow: 0 8px 24px rgba(13, 122, 117, 0.06);
        }

        .why-feat-icon-wrap {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 18px;
        }

        .why-feat-icon-wrap.teal {
          background: #EBF8F7;
          color: #0D7A75;
        }

        .why-feat-icon-wrap.coral {
          background: #FFF0ED;
          color: #FF6B50;
        }

        .why-feat-icon-wrap.mint {
          background: #E6F7F5;
          color: #0E8388;
        }

        .feat-card-title {
          font-size: 1.125rem;
          font-weight: 800;
          color: #1A202C;
          margin-bottom: 8px;
        }

        .feat-card-desc {
          font-size: 0.8125rem;
          color: #718096;
          line-height: 1.6;
        }

        /* WORKING PROCESS */
        .process-section {
          padding: 90px 0;
          background: #F0FDFB;
        }

        .process-head {
          margin-bottom: 50px;
        }

        .process-steps-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
        }

        .process-step-card {
          background: #ffffff;
          border: 1.5px solid #BCEAE6;
          border-radius: 24px;
          padding: 36px 28px;
          position: relative;
          text-align: center;
          box-shadow: 0 8px 24px rgba(13, 122, 117, 0.05);
        }

        .process-step-num {
          position: absolute;
          top: 20px;
          right: 24px;
          font-size: 1.25rem;
          font-weight: 800;
          color: #CCF0EC;
        }

        .process-icon-wrap {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: #EBF8F7;
          color: #0D7A75;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
        }

        .process-step-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: #1A202C;
          margin-bottom: 10px;
        }

        .process-step-desc {
          font-size: 0.875rem;
          color: #718096;
          line-height: 1.6;
        }

        /* TESTIMONIALS */
        .testimonials-section {
          padding: 90px 0;
          background: #ffffff;
        }

        .testimonials-head {
          margin-bottom: 50px;
        }

        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 28px;
        }

        .testimonial-card {
          background: #FAFCFC;
          border: 1.5px solid #E6EEF0;
          border-radius: 20px;
          padding: 28px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .test-stars {
          display: flex;
          gap: 4px;
          margin-bottom: 16px;
        }

        .test-quote {
          font-size: 0.9375rem;
          color: #2D3748;
          line-height: 1.65;
          font-style: italic;
          margin-bottom: 24px;
        }

        .test-author {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .author-avatar {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: #0D7A75;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.875rem;
        }

        .author-avatar.teal { background: #0E8388; }
        .author-avatar.coral { background: #FF6B50; }

        .author-name {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #1A202C;
        }

        .author-role {
          font-size: 0.75rem;
          color: #718096;
        }

        /* CONTACT SECTION */
        .contact-section {
          padding: 90px 0;
          background: #FAFCFC;
        }

        .contact-grid {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 48px;
          align-items: center;
        }

        .contact-sub {
          font-size: 1rem;
          color: #718096;
          margin-bottom: 32px;
          line-height: 1.6;
        }

        .contact-details-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .contact-item {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .contact-icon-wrap {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #EBF8F7;
          color: #0D7A75;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .item-label {
          font-size: 0.75rem;
          color: #718096;
          display: block;
        }

        .item-val {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #1A202C;
          display: block;
        }

        .contact-form-card {
          background: #ffffff;
          border: 1.5px solid #E2E8F0;
          border-radius: 24px;
          padding: 36px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.03);
        }

        .form-card-title {
          font-size: 1.375rem;
          font-weight: 800;
          color: #1A202C;
          margin-bottom: 24px;
        }

        .form-two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .contact-success-msg {
          text-align: center;
          padding: 40px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        /* CTA BANNER */
        .cta-banner-section {
          padding: 0 0 90px;
          background: #FAFCFC;
        }

        .cta-banner-card {
          background: linear-gradient(135deg, #0D7A75 0%, #0E4B56 100%);
          border-radius: 24px;
          padding: 60px 40px;
          text-align: center;
          color: #ffffff;
          box-shadow: 0 20px 48px rgba(13, 122, 117, 0.25);
          position: relative;
          overflow: hidden;
        }

        .cta-banner-content {
          max-width: 600px;
          margin: 0 auto;
          position: relative;
          z-index: 2;
        }

        .cta-banner-title {
          font-size: 2.25rem;
          font-weight: 800;
          margin-bottom: 12px;
        }

        .cta-banner-sub {
          font-size: 1.0625rem;
          color: #E6F7F5;
          margin-bottom: 28px;
        }

        @media (max-width: 992px) {
          .hero-container,
          .about-grid,
          .why-us-grid,
          .contact-grid {
            grid-template-columns: 1fr;
          }
          .services-cards-grid,
          .process-steps-grid,
          .testimonials-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
