import React, { useState, useRef, useEffect } from 'react';
import { useBooking } from '../../context/BookingContext';
import { 
  PRICING_CATEGORIES, 
  PRICING_SUBCATEGORIES, 
  getCategoryItems 
} from '../../data/pricingData';
import { 
  Check, 
  X, 
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Plus,
  Minus,
  Search,
  Shirt,
  Sparkles,
  Layers,
  Flame,
  Zap,
  User,
  Baby,
  Home,
  Tag,
  CheckCircle2,
  Package,
  ChevronDown
} from 'lucide-react';

export const Step1SelectServices = () => {
  const { 
    allServices, 
    selectedServices, 
    toggleService, 
    clearAllServices, 
    selectedItemsList = [],
    totalItemsCount = 0,
    addItem,
    removeItem,
    updateItemQuantity,
    getItemQuantity,
    clearAllItems,
    calculateTotal,
    calculateDuplicateWashSavings = () => 0,
    getItemPricing = (it) => ({ effectiveUnitPrice: it.unitPrice, lineTotal: it.unitPrice * it.quantity, hasIroningDiscount: false }),
    setCurrentStep 
  } = useBooking();

  // 4 Subcategory Visual Cards configuration with authentic artwork & labels
  const SUBCATEGORY_CARD_DATA = [
    {
      id: 'men',
      name: 'Men',
      subtitle: 'Shirts, T-Shirts, Pants & More',
      image: '/assets/subcat_men.png'
    },
    {
      id: 'women',
      name: 'Women',
      subtitle: 'Dresses, Tops, Skirts & More',
      image: '/assets/subcat_women.png'
    },
    {
      id: 'kids',
      name: 'Kids',
      subtitle: 'T-Shirts, Dresses, Pants & More',
      image: '/assets/subcat_kids.png'
    },
    {
      id: 'household',
      name: 'Household',
      subtitle: 'Bedsheets, Towels, Curtains & More',
      image: '/assets/subcat_household.png'
    }
  ];

  // Category Selection State: null (shows main 5 category cards) or category.id (shows subcategories & items)
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeSubcategory, setActiveSubcategory] = useState('men');
  const [isItemsOpen, setIsItemsOpen] = useState(false);
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const subcatDropdownRef = useRef(null);

  // Expanded Category Clothing Items State (Selected Services section)
  const [expandedCategoryId, setExpandedCategoryId] = useState(null);
  const [expandedActiveSubcat, setExpandedActiveSubcat] = useState('men');
  const expandedCardRef = useRef(null);

  // Toggle single category dropdown: closes previous and opens new, or collapses if same
  const handleToggleCategoryDropdown = (catId) => {
    setExpandedCategoryId(prev => (prev === catId ? null : catId));
    setExpandedActiveSubcat('men');
  };

  // Auto-close expanded category section when clicking anywhere outside
  useEffect(() => {
    if (!expandedCategoryId) return;

    const handleOutsideClick = (event) => {
      if (expandedCardRef.current && expandedCardRef.current.contains(event.target)) {
        return;
      }
      setExpandedCategoryId(null);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [expandedCategoryId]);

  // Toggle or select subcategory
  const handleSubcategoryClick = (subId) => {
    if (activeSubcategory === subId) {
      setIsItemsOpen(prev => !prev);
    } else {
      setActiveSubcategory(subId);
      setIsItemsOpen(true);
    }
    setItemSearchQuery('');
  };

  // Auto-close clothing items dropdown when clicking anywhere outside on the page
  useEffect(() => {
    if (!isItemsOpen) return;

    const handleClickOutside = (event) => {
      // 1. If click is inside the items box, do not close
      if (subcatDropdownRef.current && subcatDropdownRef.current.contains(event.target)) {
        return;
      }

      // 2. Fallback check if click is inside .step1-items-box (e.g. dynamic DOM nodes)
      if (event.target && event.target.closest && event.target.closest('.step1-items-box')) {
        return;
      }

      // 3. If click is on a subcategory card or the grid, let handleSubcategoryClick handle it
      if (event.target && event.target.closest && (
        event.target.closest('.subcat-visual-card') ||
        event.target.closest('.subcat-cards-grid')
      )) {
        return;
      }

      // 4. Clicked outside -> close items dropdown
      setIsItemsOpen(false);
      setItemSearchQuery('');
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isItemsOpen]);

  const renderServiceIcon = (id) => {
    switch (id) {
      case 'wash-fold':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
          </svg>
        );
      case 'wash-iron':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M7 6.5h10" /><path d="M5 10.5h14" /><path d="M5 14.5h14" /><path d="M7 18.5h10" />
          </svg>
        );
      case 'dry-cleaning':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3a2.5 2.5 0 0 0-2.5 2.5c0 1 .6 1.8 1.5 2.2V9L3.5 15.2A2 2 0 0 0 4.7 18.5H19.3a2 2 0 0 0 1.2-3.3L13 9V7.7a2.5 2.5 0 0 0 1.5-2.2A2.5 2.5 0 0 0 12 3z" />
            <path d="M7.5 15.5h9" />
          </svg>
        );
      case 'steam-iron':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 17h16a1 1 0 0 0 1-1c0-4-3-6-7-6H9a5 5 0 0 0-5 5v2z" /><path d="M9 10V6h7v4" />
          </svg>
        );
      case 'express-laundry':
        return <Zap size={22} strokeWidth={2.2} />;
      default:
        return <Shirt size={22} strokeWidth={1.8} />;
    }
  };

  const renderSubcategoryIcon = (iconName) => {
    switch (iconName) {
      case 'User': return <User size={14} strokeWidth={2.2} />;
      case 'Sparkles': return <Sparkles size={14} strokeWidth={2.2} />;
      case 'Baby': return <Baby size={14} strokeWidth={2.2} />;
      case 'Home': return <Home size={14} strokeWidth={2.2} />;
      default: return <Tag size={14} strokeWidth={2.2} />;
    }
  };

  const activeCategoryItems = (activeCategory && activeSubcategory)
    ? getCategoryItems(activeCategory, activeSubcategory).filter(item =>
        item.name.toLowerCase().includes(itemSearchQuery.trim().toLowerCase())
      )
    : [];

  // Active selected categories (from selectedServices and any items selected)
  const selectedCategoryIds = Array.from(
    new Set([
      ...selectedServices,
      ...selectedItemsList.map(it => it.categoryId)
    ])
  ).filter(Boolean);

  const selectedCategoryCards = PRICING_CATEGORIES.filter(c => 
    selectedCategoryIds.includes(c.id)
  );

  const isCategorySelected = (catId) => {
    return selectedCategoryIds.includes(catId);
  };

  const handleToggleCategory = (catId) => {
    if (isCategorySelected(catId)) {
      if (selectedServices.includes(catId)) {
        toggleService(catId);
      }
      const itemKeysToRemove = selectedItemsList
        .filter(it => it.categoryId === catId)
        .map(it => it.key);
      itemKeysToRemove.forEach(k => removeItem(k));
    } else {
      if (!selectedServices.includes(catId)) {
        toggleService(catId);
      }
    }
  };

  const handleCategoryCardClick = (catId) => {
    if (!selectedServices.includes(catId)) {
      toggleService(catId);
    }
    setActiveCategory(catId);
    setActiveSubcategory('men');
    setIsItemsOpen(false);
    setItemSearchQuery('');
  };

  const handleRemoveService = (catId) => {
    if (expandedCategoryId === catId) {
      setExpandedCategoryId(null);
    }
    if (selectedServices.includes(catId)) {
      toggleService(catId);
    }
    const itemKeysToRemove = selectedItemsList
      .filter(it => it.categoryId === catId)
      .map(it => it.key);
    itemKeysToRemove.forEach(k => removeItem(k));
  };

  const handleClearAll = () => {
    setExpandedCategoryId(null);
    clearAllItems();
    clearAllServices();
  };

  const hasSelections = selectedCategoryIds.length > 0 || selectedItemsList.length > 0;
  const estimatedTotal = calculateTotal() || 0;

  return (
    <div className="step1-container">
      <div className="select-services-page-layout">
        <div className="select-services-columns">
          {/* Left Column Card: Main Categories or Subcategories View */}
          <div className="service-categories-main-card">
            {!activeCategory ? (
              /* VIEW 1: MAIN CATEGORIES SELECTION ("What do you need cleaned?") */
              <div className="main-categories-view animate-fade-in">
                <div className="step-header">
                  <span className="step-count-label">01 / 04</span>
                  <h2 className="step-title">What do you need cleaned?</h2>
                  <p className="step-subtitle">Choose one or more services</p>
                </div>

                {/* 3-Column Grid matching reference image */}
                <div className="service-cards-grid-3col">
                  {PRICING_CATEGORIES.map(category => {
                    const isSelected = isCategorySelected(category.id);
                    const catCount = selectedItemsList
                      .filter(it => it.categoryId === category.id)
                      .reduce((s, it) => s + it.quantity, 0);

                    return (
                      <div
                        key={category.id}
                        className={`booking-service-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleCategoryCardClick(category.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleCategoryCardClick(category.id);
                          }
                        }}
                      >
                        {/* Checkbox box on top-right */}
                        <div 
                          className={`checkbox-box ${isSelected ? 'checked' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleCategory(category.id);
                          }}
                        >
                          {isSelected && <Check size={13} strokeWidth={3} color="#ffffff" />}
                        </div>

                        {/* Centered Service Icon */}
                        <div className="service-card-icon">
                          {renderServiceIcon(category.id)}
                        </div>

                        {/* Title & Description */}
                        <h3 className="service-card-title">{category.name}</h3>
                        <p className="service-card-desc">{category.desc}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Pagination Dots & Next Arrow Circle */}
                <div className="card-bottom-row">
                  <div className="pagination-dots">
                    <span className="dot active" />
                    <span className="dot" />
                    <span className="dot" />
                    <span className="dot" />
                  </div>

                  <button
                    type="button"
                    className="circle-next-btn"
                    onClick={() => {
                      if (hasSelections) {
                        setCurrentStep(2);
                      }
                    }}
                    disabled={!hasSelections}
                    aria-label="Next step"
                  >
                    <ChevronRight size={18} strokeWidth={2.4} />
                  </button>
                </div>
              </div>
            ) : (
            /* VIEW 2: CATEGORY SUBCATEGORIES & ITEMS FLOW */
            <div className="items-selection-flow animate-fade-in">
              <div className="step-header subcat-view-header">
                <div className="category-view-top-bar">
                  <button
                    type="button"
                    className="btn-back-to-categories"
                    onClick={() => {
                      setActiveCategory(null);
                      setActiveSubcategory('men');
                      setIsItemsOpen(false);
                      setItemSearchQuery('');
                    }}
                  >
                    <ArrowLeft size={16} strokeWidth={2.4} />
                    <span>Back to Categories</span>
                  </button>
                  <span className="step-count">01 / 04</span>
                </div>

                <div className="category-header-main">
                  <div className="category-header-avatar">
                    {activeCategory === 'wash-iron' || activeCategory === 'wash-fold' ? (
                      <img src="/assets/subcat_header_icon.png" alt="Category icon" className="category-header-img" />
                    ) : (
                      <div className="category-header-icon-fallback">
                        {renderServiceIcon(activeCategory)}
                      </div>
                    )}
                  </div>
                  <div className="category-header-text">
                    <h2 className="step-title">
                      {PRICING_CATEGORIES.find(c => c.id === activeCategory)?.name || 'Wash & Iron'}
                    </h2>
                    <p className="step-subtitle">
                      Choose a subcategory and adjust quantities for your clothes.
                    </p>
                  </div>
                </div>
              </div>

              {/* 4 Visual Subcategory Cards Grid */}
              <div className="subcat-cards-grid">
                {SUBCATEGORY_CARD_DATA.map(sub => {
                  const isSubActive = activeSubcategory === sub.id;
                  const subCount = selectedItemsList
                    .filter(it => it.categoryId === activeCategory && it.subcategoryId === sub.id)
                    .reduce((s, it) => s + it.quantity, 0);

                  return (
                    <div
                      key={sub.id}
                      className={`subcat-visual-card ${isSubActive ? 'active' : ''}`}
                      onClick={() => handleSubcategoryClick(sub.id)}
                      role="button"
                      tabIndex={0}
                      aria-expanded={isSubActive && isItemsOpen}
                    >
                      <div className="subcat-card-img-wrap">
                        <img src={sub.image} alt={sub.name} className="subcat-card-img" />
                        {subCount > 0 && (
                          <span className="subcat-card-badge">{subCount}</span>
                        )}
                      </div>

                      <div className="subcat-card-body">
                        <div className="subcat-card-info">
                          <h3 className="subcat-card-title">{sub.name}</h3>
                          <p className="subcat-card-subtitle">{sub.subtitle}</p>
                        </div>
                        <div className="subcat-card-arrow-btn">
                          <ArrowRight size={16} strokeWidth={2.4} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Search & Items List Box (Subcategory Dropdown) */}
              {isItemsOpen ? (
                <div ref={subcatDropdownRef} className="step1-items-box animate-fade-in">
                  <div className="step1-items-toolbar">
                    <div className="items-info-label">
                      <span>
                        {PRICING_CATEGORIES.find(c => c.id === activeCategory)?.name} —{' '}
                        {SUBCATEGORY_CARD_DATA.find(s => s.id === activeSubcategory)?.name} Items
                      </span>
                      <span className="count-tag">{activeCategoryItems.length} items</span>
                    </div>

                    <div className="step1-search-wrap">
                      <Search size={14} className="search-icon" />
                      <input
                        type="text"
                        placeholder="Search items..."
                        value={itemSearchQuery}
                        onChange={(e) => setItemSearchQuery(e.target.value)}
                        className="step1-search-input"
                      />
                      {itemSearchQuery && (
                        <button
                          type="button"
                          className="search-clear-btn"
                          onClick={() => setItemSearchQuery('')}
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Grid of Clothing Items */}
                  <div className="step1-items-scroll">
                    {activeCategoryItems.length > 0 ? (
                      <div className="clothing-items-grid">
                        {activeCategoryItems.map(item => {
                          const itemKey = `${activeCategory}__${item.id}`;
                          const currentQty = getItemQuantity(activeCategory, item.id);
                          const isSelected = currentQty > 0;

                          return (
                            <div
                              key={item.id}
                              className={`clothing-item-row ${isSelected ? 'selected' : ''}`}
                            >
                              <div className="item-row-info">
                                <span className={`item-dot ${isSelected ? 'active' : ''}`} />
                                <span className="clothing-name">{item.name}</span>
                              </div>

                              <div className="item-row-action">
                                {item.isPriceEnabled && item.price ? (
                                  activeCategory === 'wash-iron' && selectedItemsList.some(other =>
                                    (other.categoryId === 'wash-fold' || other.categoryId === 'express-laundry') &&
                                    (other.id === item.id || (other.name && item.name && other.name.trim().toLowerCase() === item.name.trim().toLowerCase())) &&
                                    other.quantity > 0
                                  ) ? (
                                    <div className="item-price-tag-discounted" title="Washing charge applied in Wash & Fold · Only ironing component charged">
                                      <span className="price-striked">₹{item.price}</span>
                                      <span className="price-effective">₹{Math.round(item.price / 2)}</span>
                                      <span className="ironing-pill">Ironing only</span>
                                    </div>
                                  ) : (
                                    <span className="item-price-tag">₹{item.price}</span>
                                  )
                                ) : (
                                  <span className="item-avail-tag">
                                    <CheckCircle2 size={12} />
                                    Available
                                  </span>
                                )}

                                {isSelected ? (
                                  <div className="stepper-controls" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      type="button"
                                      className="stepper-btn"
                                      onClick={() => updateItemQuantity(itemKey, -1)}
                                      aria-label={`Decrease ${item.name}`}
                                    >
                                      <Minus size={11} strokeWidth={2.5} />
                                    </button>
                                    <span className="stepper-val">{currentQty}</span>
                                    <button
                                      type="button"
                                      className="stepper-btn"
                                      onClick={() => updateItemQuantity(itemKey, 1)}
                                      aria-label={`Increase ${item.name}`}
                                    >
                                      <Plus size={11} strokeWidth={2.5} />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    className="btn-add-item"
                                    onClick={() => addItem(item, activeCategory, activeSubcategory)}
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
                      <div className="no-items-state">
                        <p>No clothing items found matching "{itemSearchQuery}".</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Bottom Mint Leaf Banner (exact match to reference design) */
                <div className="subcat-bottom-leaf-banner">
                  <div className="leaf-banner-left">
                    <div className="leaf-banner-icon-badge">
                      <img src="/assets/subcat_banner_leaf.png" alt="Leaf" className="leaf-banner-icon-img" />
                    </div>
                    <div className="leaf-banner-divider" />
                    <p className="leaf-banner-text">
                      Click a subcategory above to <strong className="highlight">view the items</strong> and <strong className="highlight">select</strong> what you need.
                    </p>
                  </div>
                  <img src="/assets/subcat_leaf_decor.png" alt="" className="leaf-banner-decor-img" />
                </div>
              )}
            </div>
          )}
          </div>

          {/* Right Column: Selected Services Card */}
          <div className="selected-services-side-column">
            <div className="selected-services-card">
              <div className="selected-services-header">
                <h3 className="selected-services-title">
                  Selected Services ({selectedCategoryCards.length})
                </h3>
                {selectedCategoryCards.length > 0 && (
                  <button 
                    type="button"
                    className="clear-all-link-btn"
                    onClick={handleClearAll}
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="selected-services-list">
                {selectedCategoryCards.length === 0 ? (
                  <div className="empty-sidebar-msg">
                    <div className="empty-icon-wrap">
                      <Shirt size={28} color="#0D7A75" strokeWidth={1.8} />
                    </div>
                    <p>No services selected yet.</p>
                    <span>Choose one or more services to proceed</span>
                  </div>
                ) : (
                  selectedCategoryCards.map(service => {
                    const itemsForCat = selectedItemsList.filter(it => it.categoryId === service.id);
                    const itemCount = itemsForCat.reduce((s, it) => s + it.quantity, 0);
                    const isExpanded = expandedCategoryId === service.id;

                    return (
                      <div 
                        key={service.id} 
                        ref={isExpanded ? expandedCardRef : null}
                        className={`selected-service-row-card ${isExpanded ? 'is-expanded' : ''}`}
                      >
                        <div 
                          className="service-row-main-header"
                          onClick={() => {
                            setActiveCategory(service.id);
                            setActiveSubcategory('men');
                            setIsItemsOpen(false);
                            setItemSearchQuery('');
                          }}
                          style={{ cursor: 'pointer' }}
                          title="Click to view/customize items"
                        >
                          <div className="service-row-left">
                            <div className="service-row-icon-box">
                              {renderServiceIcon(service.id)}
                            </div>
                            <div className="service-row-info">
                              <span className="service-row-title">{service.name}</span>
                              {itemCount > 0 ? (
                                <span className="service-row-count-badge">
                                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                                </span>
                              ) : (
                                <span className="service-row-count-badge zero">
                                  0 items
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="service-row-actions">
                            <button
                              type="button"
                              className={`service-dropdown-toggle-btn ${isExpanded ? 'open' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleCategoryDropdown(service.id);
                              }}
                              aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${service.name} items`}
                              aria-expanded={isExpanded}
                              title={isExpanded ? 'Hide clothing items' : 'View clothing items'}
                            >
                              <ChevronDown size={15} strokeWidth={2.4} />
                            </button>

                            <button
                              type="button"
                              className="service-row-remove-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveService(service.id);
                              }}
                              aria-label={`Remove ${service.name}`}
                              title={`Remove ${service.name}`}
                            >
                              <X size={15} strokeWidth={2} />
                            </button>
                          </div>
                        </div>

                        {/* Expanded Section: Corresponding Clothing Items */}
                        {isExpanded && (
                          <div 
                            className="category-expanded-items-panel animate-fade-in"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {itemsForCat.length > 0 ? (
                              <>
                                <div className="expanded-panel-header">
                                  <span className="expanded-panel-title">
                                    Clothing Items ({itemCount})
                                  </span>
                                  <span className="expanded-panel-subtotal">
                                    ₹{itemsForCat.reduce((sum, it) => sum + (getItemPricing(it)?.lineTotal || 0), 0)}
                                  </span>
                                </div>

                                <div className="expanded-items-list-scroll">
                                  {itemsForCat.map(item => {
                                    const pricing = getItemPricing(item) || { effectiveUnitPrice: item.unitPrice, lineTotal: item.unitPrice * item.quantity };
                                    return (
                                      <div key={item.key} className="expanded-item-row">
                                        <div className="expanded-item-left">
                                          <div className="expanded-item-info">
                                            <span className="expanded-item-name">{item.name}</span>
                                            <span className="expanded-item-subcat-badge">
                                              {item.subcategoryId ? (item.subcategoryId.charAt(0).toUpperCase() + item.subcategoryId.slice(1)) : 'Item'}
                                            </span>
                                          </div>
                                          <div className="expanded-item-price-tag">
                                            ₹{pricing.lineTotal}
                                            {item.quantity > 1 && (
                                              <span className="expanded-unit-rate"> (₹{pricing.effectiveUnitPrice} ea)</span>
                                            )}
                                            {pricing.hasIroningDiscount && (
                                              <span className="expanded-discount-tag">Ironing only</span>
                                            )}
                                          </div>
                                        </div>

                                        <div className="expanded-item-stepper">
                                          <button
                                            type="button"
                                            className="expanded-step-btn"
                                            onClick={() => updateItemQuantity(item.key, item.quantity - 1)}
                                            aria-label={`Decrease ${item.name} quantity`}
                                          >
                                            <Minus size={11} strokeWidth={2.5} />
                                          </button>
                                          <span className="expanded-step-val">{item.quantity}</span>
                                          <button
                                            type="button"
                                            className="expanded-step-btn"
                                            onClick={() => updateItemQuantity(item.key, item.quantity + 1)}
                                            aria-label={`Increase ${item.name} quantity`}
                                          >
                                            <Plus size={11} strokeWidth={2.5} />
                                          </button>
                                        </div>

                                        <button
                                          type="button"
                                          className="expanded-item-del-btn"
                                          onClick={() => removeItem(item.key)}
                                          aria-label={`Remove ${item.name}`}
                                          title="Remove item"
                                        >
                                          <X size={13} strokeWidth={2.2} />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>

                                <div className="expanded-panel-footer">
                                  <button
                                    type="button"
                                    className="btn-expanded-add-more"
                                    onClick={() => {
                                      setActiveCategory(service.id);
                                      setActiveSubcategory('men');
                                      setIsItemsOpen(true);
                                    }}
                                  >
                                    <Plus size={13} strokeWidth={2.5} />
                                    <span>Add more items</span>
                                  </button>
                                </div>
                              </>
                            ) : (
                              <div className="expanded-empty-container">
                                <p className="expanded-empty-title">Select clothing items for {service.name}:</p>
                                
                                <div className="expanded-subcat-quick-pills">
                                  {PRICING_SUBCATEGORIES.map(sub => (
                                    <button
                                      key={sub.id}
                                      type="button"
                                      className={`expanded-quick-pill ${expandedActiveSubcat === sub.id ? 'active' : ''}`}
                                      onClick={() => setExpandedActiveSubcat(sub.id)}
                                    >
                                      {sub.name}
                                    </button>
                                  ))}
                                </div>

                                <div className="expanded-quick-items-grid">
                                  {getCategoryItems(service.id, expandedActiveSubcat).slice(0, 5).map(it => {
                                    const currentQty = getItemQuantity(service.id, it.id);
                                    return (
                                      <div key={it.id} className="expanded-quick-item-card">
                                        <span className="quick-item-name">{it.name}</span>
                                        <div className="quick-item-action-area">
                                          {it.price && <span className="quick-item-price">₹{it.price}</span>}
                                          {currentQty > 0 ? (
                                            <div className="expanded-item-stepper mini">
                                              <button
                                                type="button"
                                                className="expanded-step-btn"
                                                onClick={() => updateItemQuantity(`${service.id}__${it.id}`, currentQty - 1)}
                                              >
                                                <Minus size={10} />
                                              </button>
                                              <span className="expanded-step-val">{currentQty}</span>
                                              <button
                                                type="button"
                                                className="expanded-step-btn"
                                                onClick={() => updateItemQuantity(`${service.id}__${it.id}`, currentQty + 1)}
                                              >
                                                <Plus size={10} />
                                              </button>
                                            </div>
                                          ) : (
                                            <button
                                              type="button"
                                              className="btn-quick-add"
                                              onClick={() => addItem(it, service.id, expandedActiveSubcat)}
                                            >
                                              <Plus size={11} strokeWidth={2.5} />
                                              <span>Add</span>
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                <button
                                  type="button"
                                  className="btn-view-all-catalog"
                                  onClick={() => {
                                    setActiveCategory(service.id);
                                    setActiveSubcategory(expandedActiveSubcat);
                                    setIsItemsOpen(true);
                                  }}
                                >
                                  <span>Browse all {PRICING_SUBCATEGORIES.find(s => s.id === expandedActiveSubcat)?.name} items</span>
                                  <ArrowRight size={13} />
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Subtotal Banner inside Sidebar */}
              {hasSelections && (
                <div className="sidebar-subtotal-box">
                  {calculateDuplicateWashSavings() > 0 && (
                    <div className="sidebar-savings-banner">
                      <span className="savings-icon">🎉</span>
                      <span><strong>₹{calculateDuplicateWashSavings()} saved</strong> — duplicate wash charge waived</span>
                    </div>
                  )}
                  <div className="subtotal-row">
                    <span className="subtotal-label">Estimated Subtotal</span>
                    <span className="subtotal-val">₹{estimatedTotal}</span>
                  </div>
                  <div className="subtotal-tip">
                    <CheckCircle2 size={13} strokeWidth={2.5} color="#0D7A75" />
                    <span>Free doorstep pickup & delivery included</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Step Navigation Action matching Image 2 */}
        <div className="step-footer-actions">
          <button
            type="button"
            className="btn-next-action"
            onClick={() => setCurrentStep(2)}
            disabled={!hasSelections}
          >
            <span>Next</span>
            <ArrowRight size={17} />
          </button>
        </div>
      </div>

      <style>{`
        .step1-container {
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }

        .select-services-page-layout {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          box-sizing: border-box;
        }

        .select-services-columns {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 350px;
          gap: 24px;
          align-items: start;
          width: 100%;
          box-sizing: border-box;
        }

        .service-categories-main-card {
          background: #ffffff;
          border: 1.5px solid #E2E8F0;
          border-radius: 24px;
          padding: 32px 32px 28px 32px;
          box-shadow: 0 4px 20px rgba(13, 122, 117, 0.03);
          box-sizing: border-box;
          min-width: 0;
          width: 100%;
        }

        .step-header {
          margin-bottom: 24px;
        }

        .step-count-label {
          font-size: 0.85rem;
          font-weight: 700;
          color: #0D7A75;
          letter-spacing: 0.03em;
          display: block;
          margin-bottom: 6px;
        }

        .step-count {
          background: #EEFAF6;
          color: #00A896;
          border-radius: 999px;
          padding: 6px 16px;
          font-size: 0.85rem;
          font-weight: 800;
          letter-spacing: 0.04em;
        }

        .step-title {
          font-size: 1.85rem;
          font-weight: 800;
          color: #111827;
          margin: 0 0 6px 0;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }

        .step-subtitle {
          font-size: 0.95rem;
          color: #64748B;
          margin: 0;
        }

        /* Category View Top Bar & Back Button */
        .category-view-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          gap: 12px;
          flex-wrap: wrap;
        }

        .btn-back-to-categories {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #FFFFFF;
          color: #00A896;
          border: 1.5px solid #00A896;
          border-radius: 999px;
          padding: 7px 18px;
          font-size: 0.84rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-back-to-categories:hover {
          background: #E6F7F5;
          color: #0D7A75;
          border-color: #0D7A75;
          transform: translateX(-2px);
        }

        /* Category Header Main */
        .category-header-main {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 6px;
          margin-bottom: 22px;
        }

        .category-header-avatar {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: #DCF5EE;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          overflow: hidden;
        }

        .category-header-img {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          object-fit: cover;
        }

        .category-header-icon-fallback {
          color: #00A896;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .category-header-text {
          display: flex;
          flex-direction: column;
        }

        .category-header-text .step-title {
          font-size: 1.65rem;
          font-weight: 800;
          color: #111827;
          margin: 0;
          line-height: 1.2;
          letter-spacing: -0.02em;
        }

        .category-header-text .step-subtitle {
          font-size: 0.85rem;
          color: #64748B;
          margin: 4px 0 0 0;
        }

        .card-count-badge {
          margin-top: 10px;
          background: #0D7A75;
          color: #ffffff;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 999px;
        }

        /* 4 Subcategories Visual Cards Grid */
        .subcat-cards-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 16px;
        }

        .subcat-visual-card {
          background: #FFFFFF;
          border: 1.5px solid #E2E8F0;
          border-radius: 16px;
          padding: 8px 10px 12px 10px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          min-height: 195px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
          box-sizing: border-box;
          overflow: hidden;
        }

        .subcat-visual-card:hover {
          border-color: #A7F3D0;
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(13, 122, 117, 0.08);
        }

        .subcat-visual-card.active {
          border: 2px solid #00A896;
          box-shadow: 0 4px 16px rgba(0, 168, 150, 0.12);
          transform: none;
        }

        .subcat-card-img-wrap {
          width: 100%;
          height: 110px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          margin-bottom: 6px;
          overflow: hidden;
        }

        .subcat-card-img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          transition: transform 0.25s ease;
        }

        .subcat-visual-card:hover .subcat-card-img {
          transform: scale(1.03);
        }

        .subcat-card-badge {
          position: absolute;
          top: 0px;
          right: 0px;
          background: #00A896;
          color: #FFFFFF;
          font-size: 0.68rem;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 999px;
          box-shadow: 0 2px 6px rgba(0, 168, 150, 0.3);
        }

        .subcat-card-body {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 6px;
          width: 100%;
          padding: 0 2px;
        }

        .subcat-card-info {
          flex: 1;
          min-width: 0;
        }

        .subcat-card-title {
          font-size: 1.05rem;
          font-weight: 800;
          color: #0F172A;
          margin: 0 0 2px 0;
          letter-spacing: -0.01em;
        }

        .subcat-card-subtitle {
          font-size: 0.7rem;
          color: #64748B;
          margin: 0;
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .subcat-card-arrow-btn {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #E6F7F5;
          color: #00A896;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }

        .subcat-visual-card:hover .subcat-card-arrow-btn {
          background: #00A896;
          color: #FFFFFF;
          transform: translateX(2px);
        }

        .subcat-visual-card.active .subcat-card-arrow-btn {
          background: #E6F7F5;
          color: #00A896;
        }

        /* Bottom Mint Leaf Banner */
        .subcat-bottom-leaf-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
          background: linear-gradient(90deg, #EDFAF6 0%, #F5FBF9 50%, #E8F8F4 100%);
          border: 1.5px solid #D1F2E8;
          border-radius: 16px;
          padding: 14px 20px;
          margin-top: 10px;
          min-height: 60px;
        }

        .leaf-banner-left {
          display: flex;
          align-items: center;
          position: relative;
          z-index: 2;
        }

        .leaf-banner-icon-badge {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .leaf-banner-icon-img {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          object-fit: contain;
        }

        .leaf-banner-divider {
          width: 1px;
          height: 24px;
          background: #BFE9DE;
          margin: 0 16px;
          flex-shrink: 0;
        }

        .leaf-banner-text {
          font-size: 0.85rem;
          color: #64748B;
          margin: 0;
          font-weight: 500;
        }

        .leaf-banner-text .highlight {
          color: #00A896;
          font-weight: 700;
        }

        .leaf-banner-decor-img {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          height: 100%;
          object-fit: contain;
          pointer-events: none;
          opacity: 0.95;
          z-index: 1;
        }

        /* Items Container */
        .step1-items-box {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          padding: 14px 16px;
        }

        .step1-items-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }

        .items-info-label {
          font-size: 0.825rem;
          font-weight: 700;
          color: #0F172A;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .count-tag {
          font-size: 0.6875rem;
          font-weight: 600;
          color: #0D7A75;
          background: #E0F4F2;
          padding: 2px 7px;
          border-radius: 999px;
        }

        .step1-search-wrap {
          position: relative;
          display: flex;
          align-items: center;
          width: 180px;
        }

        .search-icon {
          position: absolute;
          left: 8px;
          color: #94A3B8;
          pointer-events: none;
        }

        .step1-search-input {
          width: 100%;
          height: 30px;
          padding: 0 24px 0 28px;
          border-radius: 8px;
          border: 1px solid #CBD5E1;
          font-size: 0.775rem;
          outline: none;
        }

        .step1-search-input:focus {
          border-color: #0D7A75;
        }

        .step1-items-scroll {
          max-height: 280px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .step1-items-scroll::-webkit-scrollbar {
          width: 4px;
        }

        .step1-items-scroll::-webkit-scrollbar-thumb {
          background: #CBD5E1;
          border-radius: 4px;
        }

        .clothing-items-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .clothing-item-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          padding: 8px 12px;
          transition: all 0.15s ease;
        }

        .clothing-item-row.selected {
          background: #F0FDF9;
          border-color: #0D7A75;
        }

        .item-row-info {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          min-width: 0;
        }

        .item-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #CBD5E1;
          flex-shrink: 0;
        }

        .item-dot.active {
          background: #0D7A75;
          transform: scale(1.3);
        }

        .clothing-name {
          font-size: 0.825rem;
          font-weight: 600;
          color: #0F172A;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .item-row-action {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .item-price-tag {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #0D7A75;
          background: #E0F4F2;
          padding: 2px 7px;
          border-radius: 6px;
        }

        .item-price-tag-discounted {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #E8F7F5;
          border: 1px solid #BCEAE6;
          padding: 2px 7px;
          border-radius: 6px;
        }

        .price-striked {
          font-size: 0.725rem;
          color: #94A3B8;
          text-decoration: line-through;
        }

        .price-effective {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #0D7A75;
        }

        .ironing-pill {
          font-size: 0.65rem;
          font-weight: 700;
          color: #0D7A75;
          background: #D5F3EE;
          padding: 1px 5px;
          border-radius: 999px;
        }

        .item-avail-tag {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-size: 0.725rem;
          font-weight: 600;
          color: #0D7A75;
          background: #E0F4F2;
          padding: 2px 6px;
          border-radius: 6px;
        }

        .btn-add-item {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 4px 8px;
          border-radius: 6px;
          border: 1px solid #0D7A75;
          background: #FFFFFF;
          color: #0D7A75;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-add-item:hover {
          background: #0D7A75;
          color: #FFFFFF;
        }

        .stepper-controls {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          background: #E0F4F2;
          border-radius: 6px;
          padding: 2px;
        }

        .stepper-btn {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          background: #FFFFFF;
          border: none;
          color: #0D7A75;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .stepper-btn:hover {
          background: #0D7A75;
          color: #FFFFFF;
        }

        .stepper-val {
          font-size: 0.775rem;
          font-weight: 700;
          color: #0D7A75;
          min-width: 16px;
          text-align: center;
        }

        /* 6-Column Symmetric Categories Grid - covers the empty 6th space */
        .service-cards-grid-3col {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 16px;
        }

        /* Top Row: 3 cards spanning 2 cols each = 6 cols (full width) */
        .service-cards-grid-3col .booking-service-card:nth-child(1),
        .service-cards-grid-3col .booking-service-card:nth-child(2),
        .service-cards-grid-3col .booking-service-card:nth-child(3) {
          grid-column: span 2;
        }

        /* Bottom Row: 2 cards spanning 3 cols each = 6 cols (full width, covers the empty space) */
        .service-cards-grid-3col .booking-service-card:nth-child(4),
        .service-cards-grid-3col .booking-service-card:nth-child(5) {
          grid-column: span 3;
        }

        .booking-service-card {
          background: #ffffff;
          border: 1.5px solid #E2E8F0;
          border-radius: 18px;
          padding: 24px 16px;
          min-height: 175px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          position: relative;
          box-sizing: border-box;
        }

        .booking-service-card:hover {
          border-color: #0D7A75;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(13, 122, 117, 0.08);
        }

        .booking-service-card.selected {
          border: 2px solid #0D7A75;
          background: #F0FDFB;
        }

        .checkbox-box {
          position: absolute;
          top: 14px;
          right: 14px;
          width: 20px;
          height: 20px;
          border-radius: 6px;
          border: 1.5px solid #CBD5E1;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
          cursor: pointer;
        }

        .checkbox-box.checked {
          background: #0D7A75;
          border-color: #0D7A75;
          color: #FFFFFF;
        }

        .service-card-icon {
          color: #0D7A75;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .service-card-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 6px 0;
        }

        .service-card-desc {
          font-size: 0.8rem;
          color: #64748B;
          line-height: 1.4;
          margin: 0;
          max-width: 180px;
        }

        .card-selected-meta {
          margin-top: 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .btn-card-customize {
          background: none;
          border: none;
          color: #0D7A75;
          font-size: 0.75rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .btn-card-customize:hover {
          text-decoration: underline;
        }

        /* Bottom Pagination Row */
        .card-bottom-row {
          margin-top: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          min-height: 38px;
        }

        .pagination-dots {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .pagination-dots .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #CBD5E1;
          transition: all 0.2s ease;
        }

        .pagination-dots .dot.active {
          background: #0D7A75;
        }

        .circle-next-btn {
          position: absolute;
          right: 0;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #F1F5F9;
          color: #64748B;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .circle-next-btn:hover:not(:disabled) {
          background: #E2E8F0;
          color: #0D7A75;
        }

        .circle-next-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* Right Selected Services Card matching Image 2 */
        .selected-services-side-column {
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }

        .selected-services-card {
          background: #ffffff;
          border: 1.5px solid #E2E8F0;
          border-radius: 20px;
          padding: 24px;
          box-sizing: border-box;
          min-height: 480px;
          display: flex;
          flex-direction: column;
        }

        .selected-services-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .selected-services-title {
          font-size: 1.05rem;
          font-weight: 800;
          color: #0F172A;
          margin: 0;
        }

        .clear-all-link-btn {
          background: none;
          border: none;
          font-size: 0.8125rem;
          font-weight: 700;
          color: #0D7A75;
          cursor: pointer;
          padding: 0;
        }

        .clear-all-link-btn:hover {
          text-decoration: underline;
        }

        .selected-services-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
        }

        .selected-service-row-card {
          background: #ffffff;
          border: 1.5px solid #E2E8F0;
          border-radius: 14px;
          display: flex;
          flex-direction: column;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          box-sizing: border-box;
          overflow: hidden;
        }

        .selected-service-row-card:hover {
          border-color: #CBD5E1;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
        }

        .selected-service-row-card.is-expanded {
          border-color: #0D7A75;
          box-shadow: 0 6px 20px rgba(13, 122, 117, 0.1);
        }

        .service-row-main-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          width: 100%;
          box-sizing: border-box;
        }

        .service-row-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
        }

        .service-row-icon-box {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: #F0FDFB;
          color: #0D7A75;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .service-row-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .service-row-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #0F172A;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .service-row-count-badge {
          font-size: 0.72rem;
          font-weight: 700;
          color: #0D7A75;
          background: #E6F7F5;
          padding: 1px 6px;
          border-radius: 4px;
          display: inline-block;
          width: fit-content;
        }

        .service-row-count-badge.zero {
          color: #94A3B8;
          background: #F1F5F9;
        }

        .service-row-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
          margin-left: 8px;
        }

        /* Circular Toggle Icon matching reference image */
        .service-dropdown-toggle-btn {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #F0FBF9;
          border: 1px solid #D6EFE9;
          color: #0D7A75;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          flex-shrink: 0;
          padding: 0;
        }

        .service-dropdown-toggle-btn:hover {
          background: #0D7A75;
          color: #FFFFFF;
          border-color: #0D7A75;
          transform: translateY(-1px);
        }

        .service-dropdown-toggle-btn.open {
          background: #0D7A75;
          color: #FFFFFF;
          border-color: #0D7A75;
          transform: rotate(180deg);
        }

        .service-row-remove-btn {
          background: none;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          padding: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: color 0.15s ease, background 0.15s ease;
        }

        .service-row-remove-btn:hover {
          color: #EF4444;
          background: #FEE2E2;
        }

        /* Expanded Clothing Items Panel */
        .category-expanded-items-panel {
          border-top: 1px solid #E6EEF0;
          background: #FAFCFC;
          padding: 12px 14px 14px 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .expanded-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 8px;
          border-bottom: 1px dashed #E2E8F0;
        }

        .expanded-panel-title {
          font-size: 0.78rem;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .expanded-panel-subtotal {
          font-size: 0.85rem;
          font-weight: 800;
          color: #0D7A75;
        }

        .expanded-items-list-scroll {
          max-height: 220px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-right: 2px;
        }

        .expanded-items-list-scroll::-webkit-scrollbar {
          width: 3px;
        }

        .expanded-items-list-scroll::-webkit-scrollbar-thumb {
          background: #CBD5E1;
          border-radius: 3px;
        }

        .expanded-item-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 6px 10px;
          gap: 8px;
        }

        .expanded-item-left {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
          flex: 1;
        }

        .expanded-item-info {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .expanded-item-name {
          font-size: 0.8rem;
          font-weight: 700;
          color: #0F172A;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .expanded-item-subcat-badge {
          font-size: 0.65rem;
          font-weight: 600;
          color: #64748B;
          background: #F1F5F9;
          padding: 1px 4px;
          border-radius: 3px;
        }

        .expanded-item-price-tag {
          font-size: 0.75rem;
          font-weight: 700;
          color: #0D7A75;
          display: flex;
          align-items: center;
          gap: 4px;
          flex-wrap: wrap;
        }

        .expanded-unit-rate {
          font-size: 0.7rem;
          color: #94A3B8;
          font-weight: 500;
        }

        .expanded-discount-tag {
          font-size: 0.65rem;
          font-weight: 700;
          color: #0D7A75;
          background: #E0F4F2;
          padding: 1px 4px;
          border-radius: 4px;
        }

        .expanded-item-stepper {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          background: #F1F5F9;
          border-radius: 6px;
          padding: 2px;
        }

        .expanded-item-stepper.mini {
          padding: 1px;
        }

        .expanded-step-btn {
          width: 18px;
          height: 18px;
          border-radius: 4px;
          background: #FFFFFF;
          border: none;
          color: #0D7A75;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .expanded-step-btn:hover {
          background: #0D7A75;
          color: #FFFFFF;
        }

        .expanded-step-val {
          font-size: 0.75rem;
          font-weight: 700;
          color: #0D7A75;
          min-width: 16px;
          text-align: center;
        }

        .expanded-item-del-btn {
          background: none;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          padding: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: color 0.15s ease;
        }

        .expanded-item-del-btn:hover {
          color: #EF4444;
        }

        .expanded-panel-footer {
          display: flex;
          justify-content: center;
          padding-top: 4px;
        }

        .btn-expanded-add-more {
          background: #FFFFFF;
          border: 1px dashed #0D7A75;
          color: #0D7A75;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 6px 12px;
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          cursor: pointer;
          transition: all 0.15s ease;
          width: 100%;
          justify-content: center;
        }

        .btn-expanded-add-more:hover {
          background: #F0FDFB;
          border-style: solid;
        }

        /* Empty state & quick add in expanded panel */
        .expanded-empty-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .expanded-empty-title {
          font-size: 0.75rem;
          color: #64748B;
          margin: 0;
          font-weight: 500;
        }

        .expanded-subcat-quick-pills {
          display: flex;
          gap: 4px;
          overflow-x: auto;
          padding-bottom: 2px;
        }

        .expanded-quick-pill {
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          color: #475569;
          font-size: 0.7rem;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 999px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;
        }

        .expanded-quick-pill.active {
          background: #0D7A75;
          border-color: #0D7A75;
          color: #FFFFFF;
        }

        .expanded-quick-items-grid {
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: 180px;
          overflow-y: auto;
        }

        .expanded-quick-item-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 6px;
          padding: 5px 8px;
        }

        .quick-item-name {
          font-size: 0.75rem;
          font-weight: 600;
          color: #1E293B;
        }

        .quick-item-action-area {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .quick-item-price {
          font-size: 0.72rem;
          font-weight: 700;
          color: #0D7A75;
        }

        .btn-quick-add {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          background: #FFFFFF;
          border: 1px solid #0D7A75;
          color: #0D7A75;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-quick-add:hover {
          background: #0D7A75;
          color: #FFFFFF;
        }

        .btn-view-all-catalog {
          background: none;
          border: none;
          color: #0D7A75;
          font-size: 0.75rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          padding: 4px 0;
          justify-content: center;
        }

        .btn-view-all-catalog:hover {
          text-decoration: underline;
        }

        .empty-sidebar-msg {
          text-align: center;
          padding: 48px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
        }

        .empty-icon-wrap {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: #F0FDFB;
          color: #0D7A75;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
        }

        .empty-sidebar-msg p {
          font-weight: 700;
          font-size: 0.95rem;
          color: #0F172A;
          margin: 0 0 4px 0;
        }

        .empty-sidebar-msg span {
          font-size: 0.8rem;
          color: #64748B;
          line-height: 1.4;
        }

        /* Selected Item Chip */
        .selected-item-chip {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .chip-item-main {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 6px;
        }

        .chip-name-row {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .chip-item-name {
          font-size: 0.85rem;
          font-weight: 700;
          color: #0F172A;
        }

        .chip-cat-badge {
          font-size: 0.65rem;
          font-weight: 700;
          background: #E0F4F2;
          color: #0D7A75;
          padding: 1px 6px;
          border-radius: 4px;
        }

        .chip-discount-tag {
          font-size: 0.625rem;
          font-weight: 700;
          color: #0D7A75;
          background: #E6F8F6;
          border: 1px solid #BCEAE6;
          padding: 1px 5px;
          border-radius: 999px;
        }

        .chip-item-rate {
          font-size: 0.725rem;
          color: #64748B;
        }

        .rate-disc-group {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .rate-striked {
          font-size: 0.6875rem;
          color: #94A3B8;
          text-decoration: line-through;
        }

        .rate-disc {
          font-size: 0.725rem;
          font-weight: 700;
          color: #0D7A75;
        }

        .sidebar-savings-banner {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #E6F8F6;
          border: 1px solid #BCEAE6;
          color: #0D7A75;
          padding: 6px 10px;
          border-radius: 8px;
          font-size: 0.725rem;
          margin-bottom: 10px;
        }

        .sidebar-savings-banner .savings-icon {
          font-size: 0.85rem;
        }

        .chip-actions-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
        }

        .chip-stepper {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          background: #E2E8F0;
          border-radius: 6px;
          padding: 2px;
        }

        .chip-stepper-btn {
          width: 18px;
          height: 18px;
          border-radius: 4px;
          background: #FFFFFF;
          border: none;
          color: #0F172A;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .chip-stepper-val {
          font-size: 0.75rem;
          font-weight: 700;
          min-width: 16px;
          text-align: center;
        }

        .chip-price {
          font-size: 0.85rem;
          font-weight: 800;
          color: #0D7A75;
        }

        .chip-remove-btn {
          background: none;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          padding: 2px;
        }

        .chip-remove-btn:hover {
          color: #EF4444;
        }

        /* Package Chip */
        .selected-service-chip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #ffffff;
          border: 1.5px solid #E2E8F0;
          border-radius: 12px;
          padding: 10px 12px;
        }

        .chip-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .chip-icon {
          color: #0D7A75;
        }

        .chip-name {
          font-size: 0.85rem;
          font-weight: 700;
          color: #0F172A;
        }

        /* Sidebar Subtotal Box */
        .sidebar-subtotal-box {
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px dashed #E2E8F0;
        }

        .subtotal-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .subtotal-label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #64748B;
        }

        .subtotal-val {
          font-size: 1.15rem;
          font-weight: 800;
          color: #0D7A75;
        }

        .subtotal-tip {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.725rem;
          color: #0D7A75;
          font-weight: 600;
        }

        /* Footer Action */
        .step-footer-actions {
          margin-top: 24px;
          display: flex;
          justify-content: flex-end;
        }

        .btn-next-action {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #0D7A75;
          color: #FFFFFF;
          border: none;
          border-radius: 999px;
          padding: 12px 28px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(13, 122, 117, 0.2);
        }

        .btn-next-action:hover:not(:disabled) {
          background: #09615D;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(13, 122, 117, 0.3);
        }

        .btn-next-action:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          box-shadow: none;
          transform: none;
        }

        @media (max-width: 1024px) {
          .select-services-columns {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .selected-services-side-column {
            width: 100%;
          }
          .service-cards-grid-3col {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .service-cards-grid-3col .booking-service-card:nth-child(1),
          .service-cards-grid-3col .booking-service-card:nth-child(2),
          .service-cards-grid-3col .booking-service-card:nth-child(3),
          .service-cards-grid-3col .booking-service-card:nth-child(4) {
            grid-column: span 1;
          }
          .service-cards-grid-3col .booking-service-card:nth-child(5) {
            grid-column: span 2;
          }
        }

        @media (max-width: 640px) {
          .service-categories-main-card {
            padding: 20px 16px;
            border-radius: 20px;
          }
          .selected-services-card {
            padding: 18px 14px;
            border-radius: 20px;
          }
          .service-cards-grid-3col {
            grid-template-columns: 1fr;
          }
          .service-cards-grid-3col .booking-service-card:nth-child(n) {
            grid-column: span 1;
          }
          .step-title {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};
