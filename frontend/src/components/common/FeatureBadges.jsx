import React from 'react';
import { useBooking } from '../../context/BookingContext';
import { Truck, ShieldCheck, Leaf, ArrowRight, X } from 'lucide-react';

const SERVICE_NAMES = {
  'wash-fold': 'Wash & Fold',
  'wash-iron': 'Wash & Iron',
  'dry-cleaning': 'Dry Cleaning',
  'steam-iron': 'Steam Iron',
  'shoe-laundry': 'Shoe Laundry',
  'home-care': 'Home Care',
  'express-laundry': 'Express Laundry'
};

export const FeatureBadges = () => {
  const {
    currentStep = 1,
    setCurrentStep,
    selectedServices = [],
    toggleService,
    clearAllServices,
    selectedItemsList = [],
    removeItem,
    clearAllItems
  } = useBooking();

  const features = [
    {
      icon: <Truck size={24} strokeWidth={2} className="feature-icon" />,
      title: 'Free Pickup & Delivery',
      subtitle: 'At your convenience'
    },
    {
      icon: <ShieldCheck size={24} strokeWidth={2} className="feature-icon" />,
      title: 'Safe & Reliable',
      subtitle: 'Your clothes are in good hands'
    },
    {
      icon: <Leaf size={24} strokeWidth={2} className="feature-icon" />,
      title: 'Eco-Friendly Cleaning',
      subtitle: 'Better for you, better for the planet'
    }
  ];

  // Derive all active selected service IDs (from selectedServices and items in selectedItemsList)
  const activeServiceIds = Array.from(
    new Set([
      ...selectedServices,
      ...selectedItemsList.map(it => it.categoryId).filter(Boolean)
    ])
  ).filter(id => SERVICE_NAMES[id] || id);

  const handleRemoveService = (serviceId) => {
    // 1. Remove all items in selectedItemsList belonging to this category
    const itemsToRemove = selectedItemsList.filter(it => it.categoryId === serviceId);
    itemsToRemove.forEach(it => {
      if (typeof removeItem === 'function') {
        removeItem(it.key);
      }
    });

    // 2. Toggle service off if still in selectedServices
    if (selectedServices.includes(serviceId) && typeof toggleService === 'function') {
      toggleService(serviceId);
    }
  };

  const handleClearAll = () => {
    if (typeof clearAllItems === 'function') {
      clearAllItems();
    }
    if (typeof clearAllServices === 'function') {
      clearAllServices();
    }
  };

  const handleNextStep = () => {
    if (activeServiceIds.length > 0 && typeof setCurrentStep === 'function') {
      setCurrentStep(2);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 100, behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="feature-badges-section">
      <div className="container">
        {/* MOBILE ONLY: Div 4 flow when on Step 1 */}
        {currentStep === 1 && (
          <div className="mobile-step1-div4-wrapper">
            {/* Selected Services Card */}
            <div className="mobile-selected-services-card">
              <div className="mobile-selected-header">
                <h3 className="mobile-selected-title">
                  Selected Services <span className="services-count">({activeServiceIds.length})</span>
                </h3>
                {activeServiceIds.length > 0 && (
                  <button
                    type="button"
                    className="mobile-clear-all-btn"
                    onClick={handleClearAll}
                  >
                    Clear All
                  </button>
                )}
              </div>

              {activeServiceIds.length > 0 ? (
                <div className="mobile-selected-pills-row">
                  {activeServiceIds.map((serviceId) => (
                    <div key={serviceId} className="mobile-service-pill">
                      <span className="pill-name">{SERVICE_NAMES[serviceId] || serviceId}</span>
                      <button
                        type="button"
                        className="pill-remove-btn"
                        onClick={() => handleRemoveService(serviceId)}
                        aria-label={`Remove ${SERVICE_NAMES[serviceId] || serviceId}`}
                      >
                        <X size={12} strokeWidth={2.8} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mobile-no-services-msg">
                  No services selected yet. Choose one or more above.
                </p>
              )}
            </div>

            {/* Next Button */}
            <button
              type="button"
              className="mobile-div4-next-btn"
              onClick={handleNextStep}
              disabled={activeServiceIds.length === 0}
            >
              <span>Next</span>
              <ArrowRight size={18} strokeWidth={2.4} />
            </button>
          </div>
        )}

        {/* Desktop 3-column Grid (always on desktop) */}
        <div className="feature-badges-grid desktop-only-features">
          {features.map((f, index) => (
            <div key={index} className="feature-badge-card">
              <div className="feature-icon-wrapper">
                {f.icon}
              </div>
              <div className="feature-badge-text">
                <h4 className="feature-badge-title">{f.title}</h4>
                <p className="feature-badge-subtitle">{f.subtitle}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Vertical Badges List */}
        <div className="mobile-features-vertical-list mobile-only-features">
          {features.map((f, index) => (
            <div key={index} className="mobile-feature-item">
              <div className="mobile-feature-icon-circle">
                {f.icon}
              </div>
              <div className="mobile-feature-info">
                <h4 className="mobile-feature-title">{f.title}</h4>
                <p className="mobile-feature-subtitle">{f.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .feature-badges-section {
          padding: 32px 0;
          background: #FAFCFC;
          border-top: 1px solid #EEF2F6;
          border-bottom: 1px solid #EEF2F6;
        }

        .desktop-only-features {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        .mobile-only-features,
        .mobile-step1-div4-wrapper {
          display: none;
        }

        .feature-badge-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 8px 12px;
        }

        .feature-icon-wrapper {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: #E6F7F5;
          color: #087F8C;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .feature-badge-title {
          font-family: 'Poppins', sans-serif;
          font-size: 1rem;
          font-weight: 700;
          color: #12263A;
          margin-bottom: 2px;
        }

        .feature-badge-subtitle {
          font-family: 'Inter', sans-serif;
          font-size: 0.8125rem;
          color: #64748B;
        }

        /* MOBILE VIEW <= 768px */
        @media (max-width: 768px) {
          .feature-badges-section {
            padding: 10px 16px 48px;
            background: #FAFCFC;
            border-top: none;
            border-bottom: none;
          }

          .desktop-only-features {
            display: none !important;
          }

          .mobile-only-features {
            display: flex !important;
          }

          .mobile-step1-div4-wrapper {
            display: block !important;
            margin-bottom: 32px;
          }

          /* Selected Services Card */
          .mobile-selected-services-card {
            background: #FFFFFF;
            border: 1.5px solid #E6EEF1;
            border-radius: 20px;
            padding: 18px 18px 20px;
            box-shadow: 0 4px 18px rgba(8, 127, 140, 0.04);
            box-sizing: border-box;
          }

          .mobile-selected-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 14px;
          }

          .mobile-selected-title {
            font-family: 'Poppins', sans-serif;
            font-size: 1.125rem;
            font-weight: 700;
            color: #12263A;
            margin: 0;
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .services-count {
            color: #12263A;
            font-weight: 700;
          }

          .mobile-clear-all-btn {
            background: transparent;
            border: none;
            color: #087F8C;
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            padding: 2px 4px;
            transition: opacity 0.2s;
          }

          .mobile-clear-all-btn:hover {
            opacity: 0.8;
            text-decoration: underline;
          }

          .mobile-selected-pills-row {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            align-items: center;
          }

          .mobile-service-pill {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: #EDF6F8;
            border-radius: 999px;
            padding: 7px 12px 7px 16px;
            box-sizing: border-box;
          }

          .pill-name {
            font-family: 'Inter', sans-serif;
            font-size: 13.5px;
            font-weight: 600;
            color: #12263A;
            white-space: nowrap;
          }

          .pill-remove-btn {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #D4E8ED;
            border: none;
            color: #12263A;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            padding: 0;
            transition: all 0.15s ease;
          }

          .pill-remove-btn:hover {
            background: #C2DFE6;
            color: #000;
          }

          .mobile-no-services-msg {
            font-family: 'Inter', sans-serif;
            font-size: 13px;
            color: #94A3B8;
            margin: 0;
            font-style: italic;
          }

          /* Div 4 Next Button */
          .mobile-div4-next-btn {
            width: 100%;
            height: 52px;
            background: #087F8C;
            color: #FFFFFF;
            border: none;
            border-radius: 999px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            font-family: 'Poppins', sans-serif;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            margin-top: 18px;
            box-shadow: 0 4px 16px rgba(8, 127, 140, 0.22);
            transition: all 0.2s ease;
          }

          .mobile-div4-next-btn:active {
            transform: scale(0.98);
          }

          .mobile-div4-next-btn:disabled {
            background: #94B8BC;
            box-shadow: none;
            cursor: not-allowed;
            opacity: 0.7;
          }

          /* Mobile 3 Feature Badges Vertical List */
          .mobile-features-vertical-list {
            display: flex;
            flex-direction: column;
            gap: 22px;
            padding: 4px 2px 0;
          }

          .mobile-feature-item {
            display: flex;
            align-items: center;
            gap: 16px;
            text-align: left;
          }

          .mobile-feature-icon-circle {
            width: 48px;
            height: 48px;
            min-width: 48px;
            border-radius: 50%;
            background: #E6F7F5;
            color: #087F8C;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .mobile-feature-info {
            display: flex;
            flex-direction: column;
            text-align: left;
          }

          .mobile-feature-title {
            font-family: 'Poppins', sans-serif;
            font-size: 15.5px;
            font-weight: 700;
            color: #12263A;
            margin: 0 0 2px;
            line-height: 1.25;
            text-align: left;
          }

          .mobile-feature-subtitle {
            font-family: 'Inter', sans-serif;
            font-size: 13.5px;
            color: #64748B;
            margin: 0;
            line-height: 1.4;
            text-align: left;
          }
        }
      `}</style>
    </div>
  );
};

