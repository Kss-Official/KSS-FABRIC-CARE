import React, { useState } from 'react';
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
  Package
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

  // Mode: 'items' (Individual clothing items by Category/Subcategory) vs 'packages' (Service packages)
  const [activeTab, setActiveTab] = useState(selectedItemsList.length > 0 ? 'items' : 'items');
  const [activeCategory, setActiveCategory] = useState('wash-fold');
  const [activeSubcategory, setActiveSubcategory] = useState('men');
  const [itemSearchQuery, setItemSearchQuery] = useState('');

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

  const selectedItemsData = allServices.filter(s => selectedServices.includes(s.id));
  const hasSelections = selectedItemsList.length > 0 || selectedServices.length > 0;
  const estimatedTotal = calculateTotal() || 0;

  return (
    <div className="step1-container">
      <div className="booking-layout-grid">
        {/* Left Column: Interactive Categories & Items Selection */}
        <div className="services-parent-card">
          <div className="step-header">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="step-count">01 / 04</span>
              {/* Tab Selector: Items vs Packages */}
              <div className="step1-tab-pill-wrap">
                <button
                  type="button"
                  className={`tab-pill-btn ${activeTab === 'items' ? 'active' : ''}`}
                  onClick={() => setActiveTab('items')}
                >
                  <Shirt size={14} />
                  <span>Select Clothing Items</span>
                </button>
                <button
                  type="button"
                  className={`tab-pill-btn ${activeTab === 'packages' ? 'active' : ''}`}
                  onClick={() => setActiveTab('packages')}
                >
                  <Package size={14} />
                  <span>Service Packages</span>
                </button>
              </div>
            </div>
            <h2 className="step-title">
              {activeTab === 'items' ? 'Select Clothing Items' : 'What do you need cleaned?'}
            </h2>
            <p className="step-subtitle">
              {activeTab === 'items'
                ? 'Choose category, subcategory and adjust quantities for your clothes.'
                : 'Choose one or more laundry service packages.'}
            </p>
          </div>

          {/* TAB 1: CATEGORY & CLOTHING ITEMS SELECTION */}
          {activeTab === 'items' && (
            <div className="items-selection-flow animate-fade-in">
              {/* 5 Main Categories Bar */}
              <div className="cat-selector-row">
                {PRICING_CATEGORIES.map(category => {
                  const isActive = activeCategory === category.id;
                  const catCount = selectedItemsList
                    .filter(it => it.categoryId === category.id)
                    .reduce((s, it) => s + it.quantity, 0);

                  return (
                    <button
                      key={category.id}
                      type="button"
                      className={`cat-tab-btn ${isActive ? 'active' : ''}`}
                      onClick={() => setActiveCategory(category.id)}
                    >
                      <span className="cat-tab-icon">{renderServiceIcon(category.id)}</span>
                      <span className="cat-tab-name">{category.name}</span>
                      <span className="cat-tab-price">{category.price}</span>
                      {catCount > 0 && <span className="cat-count-pill">{catCount}</span>}
                    </button>
                  );
                })}
              </div>

              {/* 4 Subcategories Pills */}
              <div className="subcat-selector-row">
                <span className="subcat-label">Subcategory:</span>
                <div className="subcat-pills-list">
                  {PRICING_SUBCATEGORIES.map(sub => {
                    const isSubActive = activeSubcategory === sub.id;
                    const subCount = selectedItemsList
                      .filter(it => it.categoryId === activeCategory && it.subcategoryId === sub.id)
                      .reduce((s, it) => s + it.quantity, 0);

                    return (
                      <button
                        key={sub.id}
                        type="button"
                        className={`subcat-pill ${isSubActive ? 'active' : ''}`}
                        onClick={() => setActiveSubcategory(sub.id)}
                      >
                        {renderSubcategoryIcon(sub.icon)}
                        <span>{sub.name}</span>
                        {subCount > 0 && <span className="subcat-badge">{subCount}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Search & Items List Box */}
              <div className="step1-items-box">
                <div className="step1-items-toolbar">
                  <div className="items-info-label">
                    <span>
                      {PRICING_CATEGORIES.find(c => c.id === activeCategory)?.name} —{' '}
                      {PRICING_SUBCATEGORIES.find(s => s.id === activeSubcategory)?.name} Items
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
            </div>
          )}

          {/* TAB 2: SERVICE PACKAGES SELECTION */}
          {activeTab === 'packages' && (
            <div className="packages-selection-flow animate-fade-in">
              <div className="service-cards-grid">
                {allServices.map(service => {
                  const isSelected = selectedServices.includes(service.id);
                  return (
                    <div
                      key={service.id}
                      className={`booking-service-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleService(service.id)}
                    >
                      <div className={`checkbox-box ${isSelected ? 'checked' : ''}`}>
                        {isSelected && <Check size={13} strokeWidth={3} />}
                      </div>

                      <div className="service-card-icon">
                        {renderServiceIcon(service.id)}
                      </div>

                      <h3 className="service-card-title">{service.name}</h3>
                      <p className="service-card-desc">{service.subtitle}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Selected Items & Services Summary */}
        <div className="selected-services-sidebar">
          <div className="sidebar-card">
            <div className="sidebar-header">
              <h3 className="sidebar-title">
                Selected Items ({totalItemsCount > 0 ? totalItemsCount : selectedServices.length})
              </h3>
              {hasSelections && (
                <button 
                  className="clear-all-btn"
                  onClick={() => {
                    clearAllItems();
                    clearAllServices();
                  }}
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="sidebar-items-list">
              {!hasSelections ? (
                <div className="empty-sidebar-msg">
                  <div className="empty-icon-wrap">
                    <Shirt size={28} color="#0D7A75" strokeWidth={1.8} />
                  </div>
                  <p>No items selected yet.</p>
                  <span>Select clothing items or service packages on the left to proceed.</span>
                </div>
              ) : (
                <>
                  {/* Selected Clothing Items */}
                  {selectedItemsList.map(it => {
                    const pricing = getItemPricing(it);
                    return (
                      <div key={it.key} className="selected-item-chip">
                        <div className="chip-item-main">
                          <div className="chip-name-row">
                            <span className="chip-item-name">{it.name}</span>
                            <span className="chip-cat-badge">{it.categoryName}</span>
                            {pricing.hasIroningDiscount && (
                              <span className="chip-discount-tag" title="Washing charge applied in Wash & Fold · Only ironing charged">
                                Ironing only
                              </span>
                            )}
                          </div>
                          <span className="chip-item-rate">
                            {it.isPriceEnabled ? (
                              pricing.hasIroningDiscount ? (
                                <span className="rate-disc-group">
                                  <span className="rate-striked">₹{it.unitPrice}</span>
                                  <span className="rate-disc">₹{pricing.effectiveUnitPrice} each</span>
                                </span>
                              ) : (
                                `₹${it.unitPrice} each`
                              )
                            ) : 'Standard Care'}
                          </span>
                        </div>

                        <div className="chip-actions-row">
                          <div className="chip-stepper">
                            <button
                              type="button"
                              className="chip-stepper-btn"
                              onClick={() => updateItemQuantity(it.key, -1)}
                            >
                              <Minus size={10} strokeWidth={2.5} />
                            </button>
                            <span className="chip-stepper-val">{it.quantity}</span>
                            <button
                              type="button"
                              className="chip-stepper-btn"
                              onClick={() => updateItemQuantity(it.key, 1)}
                            >
                              <Plus size={10} strokeWidth={2.5} />
                            </button>
                          </div>
                          <span className="chip-price">₹{pricing.lineTotal}</span>
                          <button
                            type="button"
                            className="chip-remove-btn"
                            onClick={() => removeItem(it.key)}
                            aria-label={`Remove ${it.name}`}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Selected Package Services (if any) */}
                  {selectedItemsList.length === 0 && selectedItemsData.map(service => (
                    <div key={service.id} className="selected-service-chip">
                      <div className="chip-left">
                        <div className="chip-icon">
                          {renderServiceIcon(service.id)}
                        </div>
                        <span className="chip-name">{service.name}</span>
                      </div>
                      <button
                        className="chip-remove-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleService(service.id);
                        }}
                        aria-label={`Remove ${service.name}`}
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </>
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

      {/* Bottom Step Navigation Action */}
      <div className="step-footer-actions">
        <button
          className="btn-next-action"
          onClick={() => setCurrentStep(2)}
          disabled={!hasSelections}
        >
          <span>Next: Pickup Details</span>
          <ArrowRight size={17} />
        </button>
      </div>

      <style>{`
        .step1-container {
          width: 100%;
        }

        .booking-layout-grid {
          display: grid;
          grid-template-columns: 1.8fr 1fr;
          gap: 24px;
          align-items: stretch;
        }

        .services-parent-card {
          background: #ffffff;
          border: 1.5px solid #E2E8F0;
          border-radius: 20px;
          padding: 24px 22px;
          display: flex;
          flex-direction: column;
        }

        .step-header {
          margin-bottom: 18px;
        }

        .step-count {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #64748B;
          letter-spacing: 0.04em;
        }

        .step-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: #0F172A;
          margin: 6px 0 2px 0;
          letter-spacing: -0.02em;
        }

        .step-subtitle {
          font-size: 0.85rem;
          color: #64748B;
        }

        .step1-tab-pill-wrap {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #F1F5F9;
          padding: 3px;
          border-radius: 10px;
        }

        .tab-pill-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: #64748B;
          font-size: 0.775rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .tab-pill-btn.active {
          background: #FFFFFF;
          color: #0D7A75;
          box-shadow: 0 2px 6px rgba(0,0,0,0.06);
          font-weight: 700;
        }

        /* 5 Category Selector Row */
        .cat-selector-row {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 8px;
          margin-bottom: 14px;
        }

        .cat-tab-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 10px 6px;
          border-radius: 12px;
          border: 1.5px solid #E2E8F0;
          background: #F8FAFC;
          cursor: pointer;
          transition: all 0.15s ease;
          position: relative;
        }

        .cat-tab-btn:hover {
          border-color: #0D7A75;
          background: #F0FDF9;
        }

        .cat-tab-btn.active {
          border-color: #0D7A75;
          background: #F0FDF9;
          box-shadow: 0 4px 12px rgba(13, 122, 117, 0.12);
        }

        .cat-tab-icon {
          color: #0D7A75;
          margin-bottom: 4px;
        }

        .cat-tab-name {
          font-size: 0.75rem;
          font-weight: 700;
          color: #0F172A;
          line-height: 1.2;
          margin-bottom: 2px;
        }

        .cat-tab-price {
          font-size: 0.6875rem;
          color: #087F8C;
          font-weight: 600;
        }

        .cat-count-pill {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #FF6B54;
          color: #FFFFFF;
          font-size: 0.65rem;
          font-weight: 800;
          padding: 1px 6px;
          border-radius: 999px;
        }

        /* Subcategories Row */
        .subcat-selector-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
          flex-wrap: wrap;
        }

        .subcat-label {
          font-size: 0.775rem;
          font-weight: 700;
          color: #64748B;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .subcat-pills-list {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .subcat-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 20px;
          border: 1px solid #CBD5E1;
          background: #FFFFFF;
          color: #334155;
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .subcat-pill:hover {
          border-color: #0D7A75;
          color: #0D7A75;
        }

        .subcat-pill.active {
          background: #0D7A75;
          color: #FFFFFF;
          border-color: #0D7A75;
        }

        .subcat-badge {
          background: #FF6B54;
          color: #FFFFFF;
          font-size: 0.65rem;
          font-weight: 800;
          padding: 0 5px;
          border-radius: 999px;
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

        /* 3x2 Packages Grid */
        .service-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .booking-service-card {
          background: #ffffff;
          border: 1.5px solid #E2E8F0;
          border-radius: 16px;
          padding: 20px 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
        }

        .booking-service-card:hover {
          border-color: #0D7A75;
        }

        .booking-service-card.selected {
          border: 2px solid #0D7A75;
          background: #F0FDF9;
        }

        .checkbox-box {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 18px;
          height: 18px;
          border-radius: 4px;
          border: 1.5px solid #CBD5E1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .checkbox-box.checked {
          background: #0D7A75;
          border-color: #0D7A75;
          color: #FFFFFF;
        }

        .service-card-icon {
          color: #0D7A75;
          margin-bottom: 10px;
        }

        .service-card-title {
          font-size: 0.925rem;
          font-weight: 700;
          color: #0F172A;
          margin-bottom: 4px;
        }

        .service-card-desc {
          font-size: 0.75rem;
          color: #64748B;
        }

        /* Right Sidebar Card */
        .selected-services-sidebar {
          width: 100%;
        }

        .sidebar-card {
          background: #ffffff;
          border: 1.5px solid #E2E8F0;
          border-radius: 20px;
          padding: 20px;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .sidebar-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #0F172A;
        }

        .clear-all-btn {
          background: none;
          border: none;
          font-size: 0.775rem;
          font-weight: 600;
          color: #0D7A75;
          cursor: pointer;
        }

        .clear-all-btn:hover {
          text-decoration: underline;
        }

        .sidebar-items-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
          max-height: 380px;
          overflow-y: auto;
          padding-right: 2px;
        }

        .sidebar-items-list::-webkit-scrollbar {
          width: 4px;
        }

        .sidebar-items-list::-webkit-scrollbar-thumb {
          background: #CBD5E1;
          border-radius: 4px;
        }

        .empty-sidebar-msg {
          text-align: center;
          padding: 40px 10px;
          color: #64748B;
        }

        .empty-icon-wrap {
          margin-bottom: 8px;
        }

        .empty-sidebar-msg p {
          font-weight: 700;
          color: #0F172A;
          margin-bottom: 4px;
        }

        .empty-sidebar-msg span {
          font-size: 0.775rem;
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
          background: #FF6B54;
          color: #FFFFFF;
          border: none;
          border-radius: 12px;
          padding: 14px 28px;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(255, 107, 84, 0.35);
        }

        .btn-next-action:hover:not(:disabled) {
          background: #E8553F;
          transform: translateY(-1px);
        }

        .btn-next-action:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          box-shadow: none;
        }

        @media (max-width: 900px) {
          .booking-layout-grid {
            grid-template-columns: 1fr;
          }
          .cat-selector-row {
            grid-template-columns: repeat(2, 1fr);
          }
          .clothing-items-grid {
            grid-template-columns: 1fr;
          }
          .service-cards-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
};
