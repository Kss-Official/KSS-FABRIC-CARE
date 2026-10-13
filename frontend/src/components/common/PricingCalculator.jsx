import React, { useState } from 'react';
import { useBooking } from '../../context/BookingContext';
import { 
  PRICING_CATEGORIES, 
  PRICING_SUBCATEGORIES, 
  getCategoryItems 
} from '../../data/pricingData';
import { 
  Tag, 
  Shirt, 
  Layers, 
  Sparkles, 
  Flame, 
  Zap, 
  User, 
  Baby, 
  Home, 
  ChevronDown, 
  Search, 
  X, 
  Plus, 
  Minus, 
  ArrowRight, 
  CheckCircle2, 
  Truck, 
  ShieldCheck, 
  Leaf 
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

const IronIcon = ({ size = 20, color = '#087F8C' }) => (
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
    <path d="M4 18h16a2 2 0 0 0 2-2c0-4-4-7-8-7H4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2z" />
    <path d="M4 9V6a2 2 0 0 1 2-2h8" />
  </svg>
);

export const PricingCalculator = () => {
  const bookingCtx = useBooking() || {};
  const startBooking = bookingCtx.startBooking || (() => {
    if (typeof window !== 'undefined') window.location.hash = 'booking';
  });

  // State 1: Active Main Category ('wash-fold' | 'wash-iron' | 'dry-cleaning' | 'steam-iron' | 'express-laundry' | null)
  const [activeCategory, setActiveCategory] = useState('wash-fold');

  // State 2: Active Subcategory ('men' | 'women' | 'kids' | 'household' | null)
  const [activeSubcategory, setActiveSubcategory] = useState(null);

  // State 3: Search filter for clothing items within active subcategory
  const [itemSearchQuery, setItemSearchQuery] = useState('');

  // Handle Main Category click
  const handleCategoryClick = (catId) => {
    if (activeCategory === catId) {
      setActiveCategory(null);
      setActiveSubcategory(null);
    } else {
      setActiveCategory(catId);
      setActiveSubcategory(null); // Rule 8: Switching category closes any open subcategory
    }
    setItemSearchQuery('');
  };

  // Handle Subcategory click
  const handleSubcategoryClick = (subId) => {
    if (activeSubcategory === subId) {
      setActiveSubcategory(null); // Rule 9: Clicking currently open collapses it
    } else {
      setActiveSubcategory(subId); // Rule 4-7 & 10: Opens selected, closes others
    }
    setItemSearchQuery('');
  };

  // Dynamic Estimator Items
  const [estimatorItems, setEstimatorItems] = useState([
    { id: 'wash-fold', name: 'Wash & Fold (kg)', rate: 85, unit: 'kg', count: 2, icon: <Shirt size={18} strokeWidth={2.2} /> },
    { id: 'wash-iron', name: 'Wash & Iron (kg)', rate: 120, unit: 'kg', count: 1, icon: <IronIcon size={18} color="#087F8C" /> },
    { id: 'dry-cleaning', name: 'Dry Cleaning (pieces)', rate: 120, unit: 'item', count: 1, icon: <HangerIcon size={18} color="#087F8C" /> },
    { id: 'steam-iron', name: 'Steam Iron (pieces)', rate: 20, unit: 'item', count: 2, icon: <IronIcon size={18} color="#087F8C" /> },
    { id: 'express-laundry', name: 'Express Laundry (items)', rate: 200, unit: 'item', count: 0, icon: <Zap size={18} color="#087F8C" strokeWidth={2.2} /> }
  ]);

  const updateCount = (id, delta) => {
    setEstimatorItems(prev => prev.map(item => {
      if (item.id === id) {
        const newCount = Math.max(0, item.count + delta);
        return { ...item, count: newCount };
      }
      return item;
    }));
  };

  const subtotal = estimatorItems.reduce((sum, item) => sum + (item.count * item.rate), 0);

  // Helper for Category Icon
  const renderCategoryIcon = (iconName) => {
    switch (iconName) {
      case 'Shirt': return <Shirt size={20} strokeWidth={2.2} />;
      case 'Layers': return <IronIcon size={20} color="#087F8C" />;
      case 'Sparkles': return <HangerIcon size={20} color="#087F8C" />;
      case 'Flame': return <IronIcon size={20} color="#087F8C" />;
      case 'Zap': return <Zap size={20} color="#087F8C" strokeWidth={2.2} />;
      default: return <Shirt size={20} strokeWidth={2.2} />;
    }
  };

  // Helper for Subcategory Icon
  const renderSubcategoryIcon = (iconName) => {
    switch (iconName) {
      case 'User': return <User size={15} strokeWidth={2.2} />;
      case 'Sparkles': return <Sparkles size={15} strokeWidth={2.2} />;
      case 'Baby': return <Baby size={15} strokeWidth={2.2} />;
      case 'Home': return <Home size={15} strokeWidth={2.2} />;
      default: return <Tag size={15} strokeWidth={2.2} />;
    }
  };

  // Active items for current category + subcategory
  const activeItems = (activeCategory && activeSubcategory)
    ? getCategoryItems(activeCategory, activeSubcategory).filter(item =>
        item.name.toLowerCase().includes(itemSearchQuery.trim().toLowerCase())
      )
    : [];

  return (
    <section className="pricing-section" id="pricing-section">
      <div className="container">
        {/* Section Header */}
        <div className="text-center pricing-head-wrap">
          <div className="pricing-eyebrow-pill">
            <Tag size={13} strokeWidth={2.5} />
            <span>SIMPLE PRICING</span>
          </div>
          <h2 className="pricing-main-title">
            No Hidden Fees. <span className="highlight">Pure Transparency.</span>
          </h2>
          <p className="pricing-subtitle">
            Explore our item-wise laundry prices by category and subcategory, or calculate your estimated pickup total.
          </p>
        </div>

        {/* Two-Column Grid */}
        <div className="pricing-two-col-grid">
          {/* Left Column: Interactive Categories & Subcategories */}
          <div className="flat-rates-col">
            <div className="flat-rates-header">
              <h3 className="flat-rates-title">Service Categories &amp; Item Prices</h3>
              <p className="flat-rates-sub">
                Click any main category to view subcategories (Men, Women, Kids, Household) and expand clothing items.
              </p>
            </div>

            {/* 5 Main Categories Accordion List */}
            <div className="flat-rates-list">
              {PRICING_CATEGORIES.map(category => {
                const isCatOpen = activeCategory === category.id;
                return (
                  <div 
                    key={category.id} 
                    className={`flat-rate-card ${isCatOpen ? 'category-expanded' : ''}`}
                  >
                    {/* Main Category Header Button */}
                    <div
                      className="category-header-row"
                      onClick={() => handleCategoryClick(category.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCategoryClick(category.id); } }}
                      aria-expanded={isCatOpen}
                    >
                      <div className="rate-card-left">
                        <div className="rate-icon-box">
                          {renderCategoryIcon(category.icon)}
                        </div>
                        <div>
                          <h4 className="rate-text-title">{category.name}</h4>
                          <p className="rate-text-desc">{category.desc}</p>
                        </div>
                      </div>
                      <div className="category-header-right">
                        <span className="rate-price-tag">{category.price}</span>
                        <div className={`category-toggle-circle ${isCatOpen ? 'open' : ''}`}>
                          <ChevronDown size={17} strokeWidth={2.4} />
                        </div>
                      </div>
                    </div>

                    {/* Subcategories & Items Container (Underneath Main Category) */}
                    {isCatOpen && (
                      <div className="subcategories-panel animate-fade-in">
                        <div className="subcategories-instruction">
                          <span>Select a subcategory:</span>
                        </div>

                        {/* 4 Subcategories Pills: Men, Women, Kids, Household */}
                        <div className="subcategories-pill-row">
                          {PRICING_SUBCATEGORIES.map(sub => {
                            const isSubOpen = activeSubcategory === sub.id;
                            return (
                              <button
                                key={sub.id}
                                type="button"
                                className={`sub-pill-btn ${isSubOpen ? 'active' : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSubcategoryClick(sub.id);
                                }}
                                aria-expanded={isSubOpen}
                              >
                                <span className="sub-pill-icon">{renderSubcategoryIcon(sub.icon)}</span>
                                <span className="sub-pill-name">{sub.name}</span>
                                <ChevronDown 
                                  size={13} 
                                  className={`sub-pill-chevron ${isSubOpen ? 'open' : ''}`} 
                                />
                              </button>
                            );
                          })}
                        </div>

                        {/* Expandable Clothing Items List for Active Subcategory */}
                        {activeSubcategory && (
                          <div className="items-dropdown-container animate-fade-in">
                            {/* Subcategory Heading & Search Bar */}
                            <div className="items-dropdown-toolbar">
                              <div className="items-toolbar-left">
                                <span className="items-toolbar-title">
                                  {PRICING_SUBCATEGORIES.find(s => s.id === activeSubcategory)?.name} Items
                                </span>
                                <span className="items-count-badge">
                                  {activeItems.length} items
                                </span>
                              </div>

                              <div className="items-search-box">
                                <Search size={13} className="search-icon" />
                                <input
                                  type="text"
                                  className="search-input"
                                  placeholder={`Search ${PRICING_SUBCATEGORIES.find(s => s.id === activeSubcategory)?.name} items...`}
                                  value={itemSearchQuery}
                                  onChange={(e) => setItemSearchQuery(e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                {itemSearchQuery && (
                                  <button
                                    type="button"
                                    className="search-clear-btn"
                                    onClick={(e) => { e.stopPropagation(); setItemSearchQuery(''); }}
                                  >
                                    <X size={11} />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Clothing Items Table / List with Restored Prices */}
                            <div className="items-scroll-list">
                              {activeItems.length > 0 ? (
                                <div className="items-table-grid">
                                  {activeItems.map((item) => (
                                    <div key={item.id} className="item-row">
                                      <div className="item-row-left">
                                        <span className="item-bullet"></span>
                                        <span className="item-name">{item.name}</span>
                                        {item.unit && item.unit !== 'item' && (
                                          <span className="item-unit-label">({item.unit})</span>
                                        )}
                                      </div>

                                      <div className="item-row-right">
                                        {item.isPriceEnabled && item.price ? (
                                          <div className="item-price-pill">
                                            <span className="price-symbol">₹</span>
                                            <span className="price-number">{item.price}</span>
                                            {item.unit && item.unit !== 'item' && (
                                              <span className="price-unit">/{item.unit}</span>
                                            )}
                                          </div>
                                        ) : (
                                          <div className="item-available-pill">
                                            <CheckCircle2 size={13} strokeWidth={2.4} />
                                            <span>Available</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="items-empty-state">
                                  <p>No items found matching "{itemSearchQuery}".</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Instant Estimator */}
          <div className="estimator-col">
            <div className="estimator-card">
              <h3 className="estimator-card-title">Instant Estimator</h3>
              <p className="estimator-card-sub">
                Select items below to get an estimated total.
              </p>

              <div className="estimator-items-stack">
                {estimatorItems.map(item => (
                  <div key={item.id} className="estimator-item-row">
                    <div className="estimator-item-left">
                      <div className="estimator-icon-circle">
                        {item.icon}
                      </div>
                      <div>
                        <h4 className="estimator-item-name">{item.name}</h4>
                        <p className="estimator-item-rate">₹ {item.rate} / {item.unit}</p>
                      </div>
                    </div>

                    <div className="estimator-counter-wrap">
                      <button 
                        type="button"
                        className="counter-action-btn"
                        onClick={() => updateCount(item.id, -1)}
                        disabled={item.count === 0}
                        aria-label={`Decrease ${item.name}`}
                      >
                        <Minus size={13} strokeWidth={2.5} />
                      </button>
                      <span className="counter-display-num">{item.count}</span>
                      <button 
                        type="button"
                        className="counter-action-btn"
                        onClick={() => updateCount(item.id, 1)}
                        aria-label={`Increase ${item.name}`}
                      >
                        <Plus size={13} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Subtotal Box */}
              <div className="subtotal-highlight-box">
                <div className="subtotal-line">
                  <span className="subtotal-text-label">Estimated Subtotal</span>
                  <span className="subtotal-amount-val">₹ {subtotal}</span>
                </div>
                <div className="subtotal-badge-msg">
                  <CheckCircle2 size={15} strokeWidth={2.5} color="#087F8C" />
                  <span>Includes standard handling and quality care.</span>
                </div>
              </div>

              {/* Book Pickup Button */}
              <button 
                type="button"
                className="btn-book-pickup-now"
                onClick={() => startBooking()}
              >
                <span>Book a Pickup Now</span>
                <ArrowRight size={17} strokeWidth={2.2} />
              </button>

              {/* Trust Badges */}
              <div className="estimator-trust-row">
                <div className="trust-mini-item">
                  <Truck size={16} strokeWidth={2} color="#087F8C" />
                  <span>Free Pickup<br />&amp; Drop</span>
                </div>
                <div className="trust-mini-item">
                  <ShieldCheck size={16} strokeWidth={2} color="#087F8C" />
                  <span>Safe &amp; Hygienic<br />Handling</span>
                </div>
                <div className="trust-mini-item">
                  <Leaf size={16} strokeWidth={2} color="#087F8C" />
                  <span>Trusted by<br />1000+ Customers</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .pricing-section {
          padding: 100px 0;
          background: #FFFFFF;
        }

        .pricing-head-wrap {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin-bottom: 56px;
        }

        .pricing-eyebrow-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #E0F4F2;
          color: #087F8C;
          font-family: 'Poppins', sans-serif;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.8px;
          padding: 6px 16px;
          border-radius: 9999px;
          text-transform: uppercase;
          margin-bottom: 16px;
        }

        .pricing-main-title {
          font-family: 'Poppins', sans-serif;
          font-size: 46px;
          font-weight: 800;
          color: #12263A;
          letter-spacing: -1.2px;
          margin: 0 0 16px;
          line-height: 1.15;
          text-align: center;
          width: 100%;
        }

        .pricing-main-title .highlight {
          color: #087F8C;
        }

        .pricing-subtitle {
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          color: #556980;
          line-height: 1.6;
          max-width: 600px;
          margin: 0 auto;
          text-align: center;
          width: 100%;
        }

        .pricing-two-col-grid {
          display: grid;
          grid-template-columns: 1.15fr 1fr;
          gap: 40px;
          align-items: start;
        }

        /* Left Column: Categories & Subcategories */
        .flat-rates-header {
          margin-bottom: 20px;
        }

        .flat-rates-title {
          font-family: 'Poppins', sans-serif;
          font-size: 24px;
          font-weight: 700;
          color: #12263A;
          margin: 0 0 6px;
        }

        .flat-rates-sub {
          font-family: 'Inter', sans-serif;
          font-size: 13.5px;
          color: #64748B;
          margin: 0;
          line-height: 1.5;
        }

        .flat-rates-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        /* Main Category Card */
        .flat-rate-card {
          background: #FFFFFF;
          border: 1px solid #E6EEF0;
          border-radius: 18px;
          padding: 16px 20px;
          box-shadow: 0 4px 14px rgba(18, 38, 58, 0.02);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .flat-rate-card:hover {
          border-color: #B2E5E0;
          box-shadow: 0 8px 24px rgba(8, 127, 140, 0.08);
        }

        .flat-rate-card.category-expanded {
          border-color: #087F8C;
          box-shadow: 0 10px 28px rgba(8, 127, 140, 0.1);
          background: #FDFFFF;
        }

        .category-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          user-select: none;
          gap: 16px;
        }

        .rate-card-left {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
        }

        .rate-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #E0F4F2;
          color: #087F8C;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .rate-text-title {
          font-family: 'Poppins', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: #12263A;
          margin: 0 0 3px;
        }

        .rate-text-desc {
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          color: #64748B;
          margin: 0;
          line-height: 1.4;
        }

        .category-header-right {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }

        .rate-price-tag {
          font-family: 'Poppins', sans-serif;
          font-size: 14.5px;
          font-weight: 700;
          color: #087F8C;
          white-space: nowrap;
          background: #E8F7F5;
          padding: 4px 12px;
          border-radius: 8px;
        }

        .category-toggle-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #F1F8F7;
          color: #087F8C;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.25s ease, background 0.25s ease, color 0.25s ease;
        }

        .category-toggle-circle.open {
          transform: rotate(180deg);
          background: #087F8C;
          color: #FFFFFF;
        }

        /* Subcategories Panel */
        .subcategories-panel {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px dashed #D5EBE7;
        }

        .subcategories-instruction {
          font-family: 'Poppins', sans-serif;
          font-size: 12px;
          font-weight: 600;
          color: #087F8C;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 10px;
        }

        .subcategories-pill-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-bottom: 14px;
        }

        .sub-pill-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 9px 12px;
          border-radius: 10px;
          border: 1px solid #CDECE7;
          background: #F4FBFA;
          color: #164E4D;
          font-family: 'Poppins', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .sub-pill-btn:hover {
          background: #E1F6F3;
          border-color: #087F8C;
        }

        .sub-pill-btn.active {
          background: #0D7A75;
          color: #FFFFFF;
          border-color: #0D7A75;
          box-shadow: 0 4px 12px rgba(13, 122, 117, 0.25);
        }

        .sub-pill-icon {
          display: flex;
          align-items: center;
        }

        .sub-pill-chevron {
          transition: transform 0.2s ease;
        }

        .sub-pill-chevron.open {
          transform: rotate(180deg);
        }

        /* Items Dropdown Box */
        .items-dropdown-container {
          background: #F8FCFB;
          border: 1px solid #BCE5DF;
          border-radius: 14px;
          padding: 16px 18px;
          box-shadow: inset 0 2px 6px rgba(8, 127, 140, 0.03);
        }

        .items-dropdown-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 12px;
        }

        .items-toolbar-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .items-toolbar-title {
          font-family: 'Poppins', sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: #12263A;
        }

        .items-count-badge {
          background: #DEF5F2;
          color: #087F8C;
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 999px;
        }

        .items-search-box {
          position: relative;
          display: flex;
          align-items: center;
          width: 220px;
        }

        .search-icon {
          position: absolute;
          left: 10px;
          color: #8FA4B0;
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          height: 32px;
          border-radius: 20px;
          border: 1px solid #D1EAE5;
          background: #FFFFFF;
          padding: 0 28px 0 30px;
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          color: #12263A;
          outline: none;
          transition: border-color 0.2s ease;
        }

        .search-input:focus {
          border-color: #087F8C;
          box-shadow: 0 0 0 3px rgba(8, 127, 140, 0.12);
        }

        .search-clear-btn {
          position: absolute;
          right: 8px;
          background: none;
          border: none;
          color: #8FA4B0;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 2px;
        }

        .category-inspection-notice {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #EFF9F8;
          border-left: 3px solid #087F8C;
          padding: 8px 12px;
          border-radius: 6px;
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          color: #08535E;
          margin-bottom: 12px;
          line-height: 1.4;
        }

        .items-scroll-list {
          max-height: 340px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .items-scroll-list::-webkit-scrollbar {
          width: 5px;
        }

        .items-scroll-list::-webkit-scrollbar-track {
          background: #EEF8F6;
          border-radius: 10px;
        }

        .items-scroll-list::-webkit-scrollbar-thumb {
          background: #99DDD3;
          border-radius: 10px;
        }

        .items-table-grid {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .item-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: #FFFFFF;
          border: 1px solid #EBF4F2;
          border-radius: 10px;
          transition: background 0.15s ease, border-color 0.15s ease;
        }

        .item-row:hover {
          background: #F4FBFA;
          border-color: #CDECE7;
        }

        .item-row-left {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
        }

        .item-bullet {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #087F8C;
          flex-shrink: 0;
        }

        .item-name {
          font-family: 'Poppins', sans-serif;
          font-size: 13.5px;
          font-weight: 600;
          color: #12263A;
        }

        .item-unit-label {
          font-family: 'Inter', sans-serif;
          font-size: 11.5px;
          color: #8FA4B0;
        }

        .item-row-right {
          flex-shrink: 0;
        }

        .item-price-pill {
          display: inline-flex;
          align-items: baseline;
          gap: 2px;
          background: #E8F7F5;
          color: #087F8C;
          padding: 3px 10px;
          border-radius: 8px;
          font-family: 'Poppins', sans-serif;
        }

        .price-symbol {
          font-size: 12px;
          font-weight: 600;
        }

        .price-number {
          font-size: 14.5px;
          font-weight: 700;
        }

        .price-unit {
          font-size: 11px;
          color: #556980;
          font-weight: 500;
        }

        .item-available-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: #E8F7F5;
          color: #0D7A75;
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          font-weight: 600;
          padding: 3px 10px;
          border-radius: 8px;
        }

        .items-empty-state {
          text-align: center;
          padding: 24px 0;
          color: #8FA4B0;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
        }

        /* Right Column: Instant Estimator Card */
        .estimator-card {
          background: #FFFFFF;
          border: 1px solid #E6EEF0;
          border-radius: 28px;
          padding: 36px 32px;
          box-shadow: 0 16px 40px rgba(18, 38, 58, 0.06);
          position: sticky;
          top: 96px;
        }

        .estimator-card-title {
          font-family: 'Poppins', sans-serif;
          font-size: 24px;
          font-weight: 700;
          color: #12263A;
          margin: 0 0 6px;
        }

        .estimator-card-sub {
          font-family: 'Inter', sans-serif;
          font-size: 13.5px;
          color: #64748B;
          margin: 0 0 24px;
        }

        .estimator-items-stack {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .estimator-item-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 14px;
          border-bottom: 1px solid #F1F5F9;
        }

        .estimator-item-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .estimator-item-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .estimator-icon-circle {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #E0F4F2;
          color: #087F8C;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .estimator-item-name {
          font-family: 'Poppins', sans-serif;
          font-size: 14.5px;
          font-weight: 700;
          color: #12263A;
          margin: 0 0 2px;
        }

        .estimator-item-rate {
          font-family: 'Inter', sans-serif;
          font-size: 12.5px;
          color: #64748B;
          margin: 0;
        }

        .estimator-counter-wrap {
          display: inline-flex;
          align-items: center;
          background: #F1F5F9;
          border-radius: 8px;
          padding: 3px;
          gap: 4px;
        }

        .counter-action-btn {
          width: 26px;
          height: 26px;
          border-radius: 6px;
          background: #DFF4F2;
          color: #087F8C;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .counter-action-btn:hover:not(:disabled) {
          background: #087F8C;
          color: #FFFFFF;
        }

        .counter-action-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .counter-display-num {
          font-family: 'Poppins', sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: #12263A;
          min-width: 24px;
          text-align: center;
        }

        .subtotal-highlight-box {
          background: #E8F7F5;
          border-radius: 16px;
          padding: 18px 20px;
          margin: 24px 0 20px;
        }

        .subtotal-line {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .subtotal-text-label {
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          color: #556980;
          font-weight: 500;
        }

        .subtotal-amount-val {
          font-family: 'Poppins', sans-serif;
          font-size: 26px;
          font-weight: 800;
          color: #087F8C;
        }

        .subtotal-badge-msg {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'Inter', sans-serif;
          font-size: 12.5px;
          font-weight: 600;
          color: #087F8C;
        }

        .btn-book-pickup-now {
          width: 100%;
          height: 54px;
          border-radius: 12px;
          background: #FF6B54;
          color: #FFFFFF;
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          font-size: 16px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 10px 24px rgba(255, 107, 84, 0.35);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          margin-bottom: 24px;
        }

        .btn-book-pickup-now:hover {
          background: #E8553F;
          transform: translateY(-2px);
          box-shadow: 0 14px 28px rgba(255, 107, 84, 0.45);
        }

        .estimator-trust-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          padding-top: 14px;
          border-top: 1px solid #F1F5F9;
        }

        .trust-mini-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: 'Inter', sans-serif;
          font-size: 11.5px;
          font-weight: 500;
          color: #556980;
          line-height: 1.25;
        }

        /* Responsive Breakpoints */
        @media (max-width: 992px) {
          .pricing-two-col-grid {
            grid-template-columns: 1fr;
            gap: 36px;
          }
          .pricing-main-title {
            font-size: 38px;
          }
          .estimator-card {
            position: static;
          }
          .subcategories-pill-row {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .pricing-main-title {
            font-size: 30px;
          }
          .estimator-card {
            padding: 24px 20px;
          }
          .estimator-trust-row {
            grid-template-columns: 1fr;
            gap: 8px;
          }
          .subcategories-pill-row {
            grid-template-columns: 1fr 1fr;
          }
          .items-search-box {
            width: 100%;
          }
          .items-dropdown-toolbar {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </section>
  );
};

export default PricingCalculator;
