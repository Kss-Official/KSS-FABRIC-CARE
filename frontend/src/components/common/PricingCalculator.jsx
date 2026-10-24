import React, { useState, useRef, useEffect } from 'react';
import { useBooking } from '../../context/BookingContext';
import { 
  PRICING_CATEGORIES, 
  PRICING_SUBCATEGORIES, 
  EXPRESS_SERVICES,
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
  Check,
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
  const {
    selectedItemsList = [],
    totalItemsCount = 0,
    addItem = () => {},
    removeItem = () => {},
    updateItemQuantity = () => {},
    getItemQuantity = () => 0,
    clearAllItems = () => {},
    calculateItemsTotal = () => 0,
    calculateDuplicateWashSavings = () => 0,
    getItemPricing = (it) => ({ effectiveUnitPrice: it.unitPrice, lineTotal: it.unitPrice * it.quantity, hasIroningDiscount: false }),
    startBooking = () => {
      if (typeof window !== 'undefined') window.location.hash = 'booking';
    }
  } = useBooking() || {};

  // State 1: Active Main Category ('wash-fold' | 'wash-iron' | 'dry-cleaning' | 'steam-iron' | 'express-laundry' | null)
  const [activeCategory, setActiveCategory] = useState('wash-fold');

  // State for Express Laundry: Selected Service ('wash-fold' | 'wash-iron' | 'dry-cleaning' | 'steam-iron')
  const [activeExpressService, setActiveExpressService] = useState('wash-fold');

  // State 2: Active Subcategory ('men' | 'women' | 'kids' | 'household' | null)
  const [activeSubcategory, setActiveSubcategory] = useState(null);

  // State 3: Search filter for clothing items within active subcategory
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [, setCatalogVersion] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setCatalogVersion(v => v + 1);
    if (typeof window !== 'undefined') {
      window.addEventListener('fabricare_admin_services_updated', handleUpdate);
      window.addEventListener('storage', handleUpdate);
      return () => {
        window.removeEventListener('fabricare_admin_services_updated', handleUpdate);
        window.removeEventListener('storage', handleUpdate);
      };
    }
  }, []);

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

  // Ref for the active open category card and subcategory dropdown
  const activeCardRef = useRef(null);
  const activeSubcategoryRef = useRef(null);

  // Auto-close open cards / dropdowns when clicking outside
  useEffect(() => {
    if (!activeCategory && !activeSubcategory) return;

    const handleClickOutside = (event) => {
      // 1. If click is outside any category card entirely, close both card and subcategory
      if (!event.target.closest('.flat-rate-card')) {
        setActiveCategory(null);
        setActiveSubcategory(null);
        setItemSearchQuery('');
        return;
      }

      // 2. If a subcategory is open and click is inside the card but outside the dropdown & pills
      if (activeSubcategory && activeSubcategoryRef.current) {
        const isInsideDropdown = activeSubcategoryRef.current.contains(event.target);
        const isSubPill = event.target.closest('.sub-pill-btn');
        const isCategoryHeader = event.target.closest('.category-header-row');

        if (!isInsideDropdown && !isSubPill && !isCategoryHeader) {
          setActiveSubcategory(null);
          setItemSearchQuery('');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [activeCategory, activeSubcategory]);

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
    ? getCategoryItems(activeCategory, activeSubcategory, activeExpressService).filter(item =>
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
                    ref={isCatOpen ? activeCardRef : null}
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
                          <div className="rate-title-wrapper">
                            <h4 className="rate-text-title">{category.name}</h4>
                            {(() => {
                              const catCount = selectedItemsList
                                .filter(it => it.categoryId === category.id)
                                .reduce((s, it) => s + it.quantity, 0);
                              return catCount > 0 ? (
                                <span className="cat-count-badge">{catCount} selected</span>
                              ) : null;
                            })()}
                          </div>
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
                        {/* If Express Laundry: Display 4 Core Service Options First */}
                        {category.id === 'express-laundry' && (
                          <div className="express-services-select-block">
                            <div className="subcategories-instruction">
                              <span>SELECT A SERVICE:</span>
                            </div>
                            <div className="express-service-pill-row">
                              {EXPRESS_SERVICES.map(svc => {
                                const isSvcActive = activeExpressService === svc.id;
                                const svcCount = selectedItemsList
                                  .filter(it => it.categoryId === 'express-laundry' && (it.expressService === svc.id || (!it.expressService && svc.id === 'wash-fold')))
                                  .reduce((s, it) => s + it.quantity, 0);

                                return (
                                  <button
                                    key={svc.id}
                                    type="button"
                                    className={`express-service-btn ${isSvcActive ? 'active' : ''}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveExpressService(svc.id);
                                      setActiveSubcategory(null);
                                      setItemSearchQuery('');
                                    }}
                                  >
                                    <span className="express-svc-icon">{renderCategoryIcon(svc.icon)}</span>
                                    <span className="express-svc-name">{svc.name}</span>
                                    {svcCount > 0 && <span className="sub-count-badge">{svcCount}</span>}
                                    {isSvcActive && <Check size={12} strokeWidth={3} className="express-check-icon" />}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className="subcategories-instruction">
                          <span>
                            {category.id === 'express-laundry' 
                              ? `SELECT A SUBCATEGORY (${EXPRESS_SERVICES.find(s => s.id === activeExpressService)?.name || 'Wash & Fold'}):`
                              : 'SELECT A SUBCATEGORY:'}
                          </span>
                        </div>

                        {/* 4 Subcategories Pills: Men, Women, Kids, Household */}
                        <div className="subcategories-pill-row">
                          {PRICING_SUBCATEGORIES.filter(sub => {
                            if (activeCategory === 'express-laundry') {
                              return getCategoryItems('express-laundry', sub.id, activeExpressService).length > 0;
                            }
                            return true;
                          }).map(sub => {
                            const isSubOpen = activeSubcategory === sub.id;
                            const isExpress = activeCategory === 'express-laundry';
                            const subCount = selectedItemsList
                              .filter(it => {
                                if (it.categoryId !== activeCategory) return false;
                                if (isExpress && (it.expressService || 'wash-fold') !== activeExpressService) return false;
                                return it.subcategoryId === sub.id;
                              })
                              .reduce((s, it) => s + it.quantity, 0);

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
                                {subCount > 0 && <span className="sub-count-badge">{subCount}</span>}
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
                          <div 
                            ref={activeSubcategoryRef}
                            className="items-dropdown-container animate-fade-in"
                          >
                            {/* Subcategory Heading & Search Bar */}
                            <div className="items-dropdown-toolbar">
                              <div className="items-toolbar-left">
                                <span className="items-toolbar-title">
                                  {PRICING_SUBCATEGORIES.find(s => s.id === activeSubcategory)?.name} Items
                                  {activeCategory === 'express-laundry' && (
                                    <span className="express-toolbar-sub-badge">
                                      {EXPRESS_SERVICES.find(s => s.id === activeExpressService)?.name} · 2x Express Rate
                                    </span>
                                  )}
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

                            {/* Clothing Items Table / List with Restored Prices and Selection */}
                            <div className="items-scroll-list">
                              {activeItems.length > 0 ? (
                                <div className="items-table-grid">
                                  {activeItems.map((item) => {
                                    const isExpress = activeCategory === 'express-laundry';
                                    const itemKey = isExpress
                                      ? `express-laundry__${activeExpressService}__${item.id}`
                                      : `${activeCategory}__${item.id}`;
                                    const currentQty = getItemQuantity(activeCategory, item.id, activeExpressService);
                                    const isSelected = currentQty > 0;

                                    return (
                                      <div key={item.id} className={`item-row ${isSelected ? 'item-row-selected' : ''}`}>
                                        <div className="item-row-left">
                                          <span className={`item-bullet ${isSelected ? 'bullet-active' : ''}`}></span>
                                          <span className="item-name">{item.name}</span>
                                        </div>

                                        <div className="item-row-right">
                                          {isExpress ? (
                                            <div className="item-price-pill express-pill">
                                              <span className="price-symbol">₹</span>
                                              <span className="price-number">{item.price}</span>
                                              <span className="express-tag-micro">⚡ Express</span>
                                            </div>
                                          ) : item.isPriceEnabled && item.price ? (
                                            activeCategory === 'wash-iron' && selectedItemsList.some(other =>
                                              (other.categoryId === 'wash-fold' || other.categoryId === 'express-laundry') &&
                                              (other.id === item.id || (other.name && item.name && other.name.trim().toLowerCase() === item.name.trim().toLowerCase())) &&
                                              other.quantity > 0
                                            ) ? (
                                              <div className="item-price-pill item-price-pill-ironing-only" title="Washing charge applied in Wash & Fold · Only ironing component charged">
                                                <span className="price-old-striked">₹{item.price}</span>
                                                <span className="price-symbol">₹</span>
                                                <span className="price-number">{Math.round(item.price / 2)}</span>
                                                <span className="pill-ironing-note">Ironing only</span>
                                              </div>
                                            ) : (
                                              <div className="item-price-pill">
                                                <span className="price-symbol">₹</span>
                                                <span className="price-number">{item.price}</span>
                                              </div>
                                            )
                                          ) : (
                                            <div className="item-available-pill">
                                              <CheckCircle2 size={13} strokeWidth={2.4} />
                                              <span>Available</span>
                                            </div>
                                          )}

                                          {/* Selection Stepper or Add Button */}
                                          {isSelected ? (
                                            <div className="item-selection-controls" onClick={(e) => e.stopPropagation()}>
                                              <button
                                                type="button"
                                                className="item-stepper-btn"
                                                onClick={() => updateItemQuantity(itemKey, -1)}
                                                aria-label={`Decrease ${item.name}`}
                                              >
                                                <Minus size={11} strokeWidth={2.5} />
                                              </button>
                                              <span className="item-stepper-val">{currentQty}</span>
                                              <button
                                                type="button"
                                                className="item-stepper-btn"
                                                onClick={() => updateItemQuantity(itemKey, 1)}
                                                aria-label={`Increase ${item.name}`}
                                              >
                                                <Plus size={11} strokeWidth={2.5} />
                                              </button>
                                            </div>
                                          ) : (
                                            <button
                                              type="button"
                                              className="btn-select-item"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                addItem(item, activeCategory, activeSubcategory, 1, activeExpressService);
                                              }}
                                              aria-label={`Add ${item.name}`}
                                            >
                                              <Plus size={12} strokeWidth={2.5} />
                                              <span>Add</span>
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
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

          {/* Right Column: Live Booking Summary & Estimator */}
          <div className="estimator-col">
            <div className="estimator-card">
              {/* Header with Title and Clear All */}
              <div className="estimator-card-header-row">
                <div>
                  <h3 className="estimator-card-title">
                    {selectedItemsList.length > 0 ? `Booking Summary (${totalItemsCount})` : 'Instant Estimator'}
                  </h3>
                  <p className="estimator-card-sub">
                    {selectedItemsList.length > 0
                      ? `${totalItemsCount} item${totalItemsCount > 1 ? 's' : ''} selected across categories.`
                      : 'Select clothing items on the left or estimate pickup total.'}
                  </p>
                </div>
                {selectedItemsList.length > 0 && (
                  <button
                    type="button"
                    className="clear-summary-btn"
                    onClick={clearAllItems}
                    title="Clear all selected items"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* View 1: When Clothing Items are Selected */}
              {selectedItemsList.length > 0 ? (
                <div className="booking-summary-items-stack">
                  {selectedItemsList.map(it => {
                    const pricing = getItemPricing ? getItemPricing(it) : { effectiveUnitPrice: it.unitPrice, lineTotal: it.unitPrice * it.quantity, hasIroningDiscount: false };
                    return (
                      <div key={it.key} className="summary-item-card">
                        <div className="summary-item-info">
                          <div className="summary-item-title-row">
                            <span className="summary-item-name">{it.name}</span>
                            <span className="summary-cat-tag">{it.categoryName}</span>
                            {pricing.hasIroningDiscount && (
                              <span className="summary-discount-chip">Ironing only</span>
                            )}
                          </div>
                          <div className="summary-item-rate">
                            {pricing.hasIroningDiscount ? (
                              <span className="rate-discount-row">
                                <span className="rate-old-strike">₹{it.unitPrice}</span>
                                <span className="rate-current">₹{pricing.effectiveUnitPrice} / item</span>
                                <span className="rate-discount-note">(50% Ironing charge)</span>
                              </span>
                            ) : it.isPriceEnabled ? (
                              `₹${it.unitPrice} / item`
                            ) : (
                              `Standard Care (₹${it.unitPrice})`
                            )}
                          </div>
                        </div>

                        <div className="summary-item-right">
                          <div className="summary-stepper-wrap">
                            <button
                              type="button"
                              className="summary-stepper-btn"
                              onClick={() => updateItemQuantity(it.key, -1)}
                              aria-label={`Decrease ${it.name}`}
                            >
                              <Minus size={11} strokeWidth={2.5} />
                            </button>
                            <span className="summary-stepper-num">{it.quantity}</span>
                            <button
                              type="button"
                              className="summary-stepper-btn"
                              onClick={() => updateItemQuantity(it.key, 1)}
                              aria-label={`Increase ${it.name}`}
                            >
                              <Plus size={11} strokeWidth={2.5} />
                            </button>
                          </div>
                          <span className="summary-item-price">₹{pricing.lineTotal}</span>
                          <button
                            type="button"
                            className="summary-item-remove-btn"
                            onClick={() => removeItem(it.key)}
                            aria-label={`Remove ${it.name}`}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* View 2: When 0 Items are selected, show Quick Estimator Stack */
                <div className="estimator-items-stack">
                  <div className="empty-selection-tip">
                    <CheckCircle2 size={15} strokeWidth={2.5} color="#087F8C" />
                    <span>Select items from any category on the left to build your order.</span>
                  </div>
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
              )}

              {/* Subtotal Box */}
              <div className="subtotal-highlight-box">
                {calculateDuplicateWashSavings() > 0 && (
                  <div className="subtotal-savings-line">
                    <Sparkles size={13} color="#0D7A75" strokeWidth={2.4} />
                    <span>Washing fee applied once: Saved ₹{calculateDuplicateWashSavings()} on ironing</span>
                  </div>
                )}
                <div className="subtotal-line">
                  <span className="subtotal-text-label">Estimated Subtotal</span>
                  <span className="subtotal-amount-val">
                    ₹ {selectedItemsList.length > 0 ? calculateItemsTotal() : subtotal}
                  </span>
                </div>
                <div className="subtotal-badge-msg">
                  <CheckCircle2 size={15} strokeWidth={2.5} color="#087F8C" />
                  <span>Free doorstep pickup and delivery included.</span>
                </div>
              </div>

              {/* Book Pickup Button */}
              <button 
                type="button"
                className="btn-book-pickup-now"
                onClick={() => {
                  if (selectedItemsList.length === 0 && subtotal === 0) {
                    alert('Please select at least one clothing item or service to proceed with booking.');
                    return;
                  }
                  startBooking(selectedItemsList.length > 0 ? 2 : 1);
                }}
              >
                <span>
                  {selectedItemsList.length > 0 
                    ? `Book a Pickup (₹${calculateItemsTotal()})`
                    : 'Book a Pickup Now'}
                </span>
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

        .express-services-select-block {
          margin-bottom: 12px;
        }

        .express-service-pill-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-bottom: 14px;
        }

        .express-service-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 10px;
          border-radius: 10px;
          border: 1.5px solid #CDECE7;
          background: #FFFFFF;
          color: #164E4D;
          font-family: 'Poppins', sans-serif;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .express-service-btn:hover {
          background: #E1F6F3;
          border-color: #087F8C;
        }

        .express-service-btn.active {
          background: #0D7A75;
          color: #FFFFFF;
          border-color: #0D7A75;
          box-shadow: 0 4px 12px rgba(13, 122, 117, 0.25);
        }

        .express-service-btn.active .express-svc-icon svg {
          stroke: #FFFFFF !important;
          color: #FFFFFF !important;
        }

        .express-svc-icon {
          display: flex;
          align-items: center;
        }

        .express-check-icon {
          margin-left: 2px;
        }

        .express-toolbar-sub-badge {
          display: inline-block;
          margin-left: 8px;
          padding: 2px 8px;
          background: #FFF7ED;
          color: #EA580C;
          border: 1px solid #FFEDD5;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 600;
        }

        .item-price-pill.express-pill {
          background: #FEF3C7;
          border-color: #FDE68A;
          color: #B45309;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .express-tag-micro {
          font-size: 10px;
          font-weight: 700;
          color: #D97706;
          text-transform: uppercase;
          letter-spacing: 0.3px;
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

        .rate-title-wrapper {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .cat-count-badge {
          background: #087F8C;
          color: #FFFFFF;
          font-family: 'Poppins', sans-serif;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 999px;
          letter-spacing: 0.3px;
        }

        .sub-count-badge {
          background: #FF6B54;
          color: #FFFFFF;
          font-family: 'Poppins', sans-serif;
          font-size: 10px;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 999px;
          margin-left: 2px;
        }

        .item-row.item-row-selected {
          background: #F0FDF9;
          border-color: #087F8C;
          box-shadow: 0 2px 8px rgba(8, 127, 140, 0.08);
        }

        .item-bullet.bullet-active {
          background: #0D7A75;
          transform: scale(1.3);
        }

        .item-row-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        /* Add Item Button */
        .btn-select-item {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #E8F7F5;
          color: #087F8C;
          border: 1px solid #BCEAE6;
          border-radius: 8px;
          padding: 4px 10px;
          font-family: 'Poppins', sans-serif;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-select-item:hover {
          background: #087F8C;
          color: #FFFFFF;
          border-color: #087F8C;
        }

        /* Item Stepper inside row */
        .item-selection-controls {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #E0F4F2;
          border: 1px solid #B2E5E0;
          border-radius: 8px;
          padding: 2px;
        }

        .item-stepper-btn {
          width: 22px;
          height: 22px;
          border-radius: 6px;
          background: #FFFFFF;
          color: #087F8C;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .item-stepper-btn:hover {
          background: #087F8C;
          color: #FFFFFF;
        }

        .item-stepper-val {
          font-family: 'Poppins', sans-serif;
          font-size: 12.5px;
          font-weight: 700;
          color: #0D7A75;
          min-width: 18px;
          text-align: center;
        }

        /* Right Column Header */
        .estimator-card-header-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 20px;
        }

        .clear-summary-btn {
          background: none;
          border: 1px solid #CBD5E1;
          color: #64748B;
          font-family: 'Inter', sans-serif;
          font-size: 11.5px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
          white-space: nowrap;
        }

        .clear-summary-btn:hover {
          background: #FEE2E2;
          color: #EF4444;
          border-color: #FCA5A5;
        }

        /* Booking Summary Items Stack */
        .booking-summary-items-stack {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 290px;
          overflow-y: auto;
          padding-right: 4px;
          margin-bottom: 16px;
        }

        .booking-summary-items-stack::-webkit-scrollbar {
          width: 4px;
        }

        .booking-summary-items-stack::-webkit-scrollbar-thumb {
          background: #BCEAE6;
          border-radius: 6px;
        }

        .summary-item-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 10px 12px;
          transition: all 0.15s ease;
        }

        .summary-item-card:hover {
          background: #F1F8F7;
          border-color: #B2E5E0;
        }

        .summary-item-info {
          flex: 1;
          min-width: 0;
        }

        .summary-item-title-row {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
          margin-bottom: 2px;
        }

        .summary-item-name {
          font-family: 'Poppins', sans-serif;
          font-size: 13.5px;
          font-weight: 700;
          color: #12263A;
        }

        .summary-cat-tag {
          font-family: 'Inter', sans-serif;
          font-size: 10.5px;
          font-weight: 600;
          color: #087F8C;
          background: #E0F4F2;
          padding: 1px 6px;
          border-radius: 4px;
        }

        .summary-item-rate {
          font-family: 'Inter', sans-serif;
          font-size: 11.5px;
          color: #64748B;
        }

        .summary-discount-chip {
          font-family: 'Inter', sans-serif;
          font-size: 10px;
          font-weight: 700;
          color: #0D7A75;
          background: #E6F8F6;
          border: 1px solid #BCEAE6;
          padding: 1px 6px;
          border-radius: 999px;
        }

        .rate-discount-row {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          flex-wrap: wrap;
        }

        .rate-old-strike {
          text-decoration: line-through;
          color: #94A3B8;
          font-size: 11px;
        }

        .rate-current {
          color: #0D7A75;
          font-weight: 700;
        }

        .rate-discount-note {
          color: #0D7A75;
          font-size: 10.5px;
          font-weight: 500;
        }

        .item-price-pill-ironing-only {
          background: #E8F7F5 !important;
          border-color: #BCEAE6 !important;
        }

        .price-old-striked {
          font-size: 11px;
          color: #94A3B8;
          text-decoration: line-through;
          margin-right: 3px;
        }

        .pill-ironing-note {
          font-size: 9.5px;
          font-weight: 700;
          color: #0D7A75;
          background: #D5F3EE;
          padding: 1px 5px;
          border-radius: 999px;
          margin-left: 4px;
        }

        .subtotal-savings-line {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #E6F8F6;
          border: 1px solid #BCEAE6;
          border-radius: 10px;
          padding: 6px 10px;
          font-family: 'Inter', sans-serif;
          font-size: 11.5px;
          font-weight: 700;
          color: #0D7A75;
          margin-bottom: 12px;
        }

        .summary-item-right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .summary-stepper-wrap {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          background: #E2E8F0;
          border-radius: 6px;
          padding: 2px;
        }

        .summary-stepper-btn {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          background: #FFFFFF;
          color: #0F172A;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .summary-stepper-btn:hover {
          background: #087F8C;
          color: #FFFFFF;
        }

        .summary-stepper-num {
          font-family: 'Poppins', sans-serif;
          font-size: 12px;
          font-weight: 700;
          color: #0F172A;
          min-width: 16px;
          text-align: center;
        }

        .summary-item-price {
          font-family: 'Poppins', sans-serif;
          font-size: 13.5px;
          font-weight: 800;
          color: #087F8C;
          min-width: 44px;
          text-align: right;
        }

        .summary-item-remove-btn {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: none;
          border: none;
          color: #94A3B8;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
          padding: 0;
        }

        .summary-item-remove-btn:hover {
          color: #EF4444;
          background: #FEE2E2;
        }

        .empty-selection-tip {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #E8F7F5;
          border-radius: 10px;
          padding: 10px 12px;
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          font-weight: 600;
          color: #0D7A75;
          margin-bottom: 14px;
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
