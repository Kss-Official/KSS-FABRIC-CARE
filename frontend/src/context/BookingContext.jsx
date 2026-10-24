import React, { createContext, useContext, useState, useEffect } from 'react';
import { createCustomerOrder, confirmCustomerPayment } from '../services/customerDataService';
import { useAuth } from './AuthContext';
import { addressApi, servicesApi } from '../api/apiClient';
import { INITIAL_SERVICES } from '../constants/servicesConstants';
import { subscribeAdminServices } from '../services/adminDataService';
import { 
  PRICING_CATEGORIES, 
  PRICING_SUBCATEGORIES, 
  PRICING_ITEMS,
  EXPRESS_SERVICES,
  getItemBasePrice,
  getExpressItemPrice,
  setLiveAdminCatalog,
  getLiveAdminCatalog
} from '../data/pricingData';

const BookingContext = createContext();

export { INITIAL_SERVICES };

/**
 * Calculates effective pricing for an item, avoiding duplicate washing charges:
 * Rule: If the same clothing item is selected under both a washing category (Wash & Fold or Express Laundry)
 * and Wash & Iron, the washing charge is applied only once.
 * For Wash & Iron, only the ironing component is charged (calculated as half of the total item price).
 */
export const getItemPricing = (item, allItemsList = []) => {
  if (!item) {
    return {
      baseUnitPrice: 0,
      effectiveUnitPrice: 0,
      ironingComponentRate: 0,
      lineTotal: 0,
      hasIroningDiscount: false,
      isIroningOnly: false,
      overlappingQty: 0,
      discountPerItem: 0,
      totalSaved: 0,
      discountReason: null
    };
  }

  const baseUnitPrice = Number(item.unitPrice || 0);
  const qty = Number(item.quantity || 0);

  // Check if this item is in Wash & Iron
  const isWashIron = item.categoryId === 'wash-iron';

  if (isWashIron && allItemsList && allItemsList.length > 0) {
    // Check if the same clothing item is also selected under a washing service (Wash & Fold or Express Laundry)
    const washItem = allItemsList.find(other => 
      other.key !== item.key &&
      (other.categoryId === 'wash-fold' || other.categoryId === 'express-laundry') &&
      (other.id === item.id || (other.name && item.name && other.name.trim().toLowerCase() === item.name.trim().toLowerCase()))
    );

    if (washItem && washItem.quantity > 0) {
      const washQty = washItem.quantity;
      const ironingComponentRate = Math.round(baseUnitPrice / 2); // Ironing charge is half of total item price
      const overlappingQty = Math.min(washQty, qty);
      const remainingQty = Math.max(0, qty - overlappingQty);

      const lineTotal = (overlappingQty * ironingComponentRate) + (remainingQty * baseUnitPrice);
      const effectiveUnitPrice = qty > 0 ? (lineTotal / qty) : ironingComponentRate;

      return {
        baseUnitPrice,
        effectiveUnitPrice,
        ironingComponentRate,
        lineTotal,
        hasIroningDiscount: true,
        isIroningOnly: qty <= washQty,
        overlappingQty,
        discountPerItem: baseUnitPrice - ironingComponentRate,
        totalSaved: overlappingQty * (baseUnitPrice - ironingComponentRate),
        discountReason: `Ironing charge only (₹${ironingComponentRate}/item) · Washing price applied in ${washItem.categoryName || 'Wash & Fold'}`
      };
    }
  }

  return {
    baseUnitPrice,
    effectiveUnitPrice: baseUnitPrice,
    ironingComponentRate: Math.round(baseUnitPrice / 2),
    lineTotal: baseUnitPrice * qty,
    hasIroningDiscount: false,
    isIroningOnly: false,
    overlappingQty: 0,
    discountPerItem: 0,
    totalSaved: 0,
    discountReason: null
  };
};

export const BookingProvider = ({ children }) => {
  const { currentUser, userProfile, isAuthenticated } = useAuth();

  // Navigation State: 'home' | 'about' | 'services' | 'why-us' | 'pricing' | 'how-it-works' | 'booking' | 'confirmed' | 'admin' | 'customer-*' | 'delivery-portal' | 'laundry-portal'
  const getInitialPage = () => {
    if (typeof window !== 'undefined') {
      if (window.location.hash) {
        const hash = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase();
        if (hash) return hash;
      }
      if (window.location.pathname && window.location.pathname !== '/') {
        const path = window.location.pathname.replace(/^\//, '').trim();
        const search = window.location.search || '';
        return `${path}${search}`;
      }
    }
    return 'home';
  };

  const [currentPage, setCurrentPage] = useState(getInitialPage);

  useEffect(() => {
    const handleUrlChange = () => {
      if (window.location.hash) {
        const hash = window.location.hash.replace(/^#\/?/, '').trim();
        if (hash) {
          setCurrentPage(hash);
          return;
        }
      }
      if (window.location.pathname && window.location.pathname !== '/') {
        const path = window.location.pathname.replace(/^\//, '').trim();
        const search = window.location.search || '';
        setCurrentPage(`${path}${search}`);
        return;
      }
      setCurrentPage('home');
    };
    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  const [selectedServiceDetail, setSelectedServiceDetail] = useState('dry-cleaning');
  const [servicesList, setServicesList] = useState(INITIAL_SERVICES);
  const [adminItemsCatalog, setAdminItemsCatalog] = useState(() => getLiveAdminCatalog() || []);

  useEffect(() => {
    // 1. Subscribe to RTDB live admin services
    const unsub = subscribeAdminServices((liveServices) => {
      if (liveServices && liveServices.length > 0) {
        setAdminItemsCatalog(liveServices);
        setLiveAdminCatalog(liveServices);
      }
    });

    // 2. Cross-tab and local window event listener for immediate updates
    const handleAdminServicesUpdated = (e) => {
      const latest = getLiveAdminCatalog();
      if (latest && latest.length > 0) {
        setAdminItemsCatalog([...latest]);
      } else if (e.detail?.service || e.detail?.updates) {
        const stored = localStorage.getItem('fabricare_admin_services');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setAdminItemsCatalog(parsed);
            setLiveAdminCatalog(parsed);
          } catch (_) {}
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('fabricare_admin_services_updated', handleAdminServicesUpdated);
      window.addEventListener('storage', handleAdminServicesUpdated);
    }

    return () => {
      if (typeof unsub === 'function') unsub();
      if (typeof window !== 'undefined') {
        window.removeEventListener('fabricare_admin_services_updated', handleAdminServicesUpdated);
        window.removeEventListener('storage', handleAdminServicesUpdated);
      }
    };
  }, []);

  // Synchronize cart items with admin updates: remove inactive/deleted items and update prices
  useEffect(() => {
    if (!adminItemsCatalog || adminItemsCatalog.length === 0) return;

    setSelectedItems(prev => {
      let changed = false;
      const next = { ...prev };

      Object.keys(next).forEach(k => {
        const it = next[k];
        if (!it) return;

        const cleanItemId = String(it.id || '').toLowerCase();
        const cleanItemName = String(it.name || '').trim().toLowerCase();

        const match = adminItemsCatalog.find(s => 
          (s.code && String(s.code).toLowerCase() === cleanItemId) ||
          (s.id && String(s.id).toLowerCase() === cleanItemId) ||
          (s.name && String(s.name).trim().toLowerCase() === cleanItemName)
        );

        if (match) {
          // If deactivated or deleted by admin, remove immediately from customer's selected items!
          if (
            match.isDeleted === true ||
            match.status === 'Deleted' ||
            match.status === 'Inactive' ||
            match.is_active === false ||
            match.isActive === false ||
            match.status === false
          ) {
            delete next[k];
            changed = true;
            return;
          }

          // If price or name was edited, update in customer's cart
          const effectiveService = it.categoryId === 'express-laundry' ? (it.expressService || 'wash-fold') : it.categoryId;
          let newBaseRate = null;
          if (match.prices && match.prices[effectiveService] != null) {
            newBaseRate = Number(match.prices[effectiveService]);
          } else if (match.price != null && (match.category === effectiveService || !match.prices)) {
            newBaseRate = Number(match.price);
          }

          if (newBaseRate !== null && newBaseRate > 0) {
            const isExpress = it.categoryId === 'express-laundry';
            const expectedUnitPrice = isExpress ? (newBaseRate * 2) : newBaseRate;
            if (Number(it.unitPrice) !== expectedUnitPrice || it.name !== match.name) {
              next[k] = {
                ...it,
                name: match.name || it.name,
                unitPrice: expectedUnitPrice,
                baseUnitPrice: newBaseRate
              };
              changed = true;
            }
          }
        }
      });

      return changed ? next : prev;
    });
  }, [adminItemsCatalog]);

  const [serviceCategories, setServiceCategories] = useState([]);

  const [activeTrackingOrderId, setActiveTrackingOrderIdState] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const uid = currentUser?.uid || currentUser?.id;
        if (uid) {
          return sessionStorage.getItem(`fabricare_active_tracking_id_${uid}`) || null;
        }
        return sessionStorage.getItem('fabricare_active_tracking_id') || null;
      }
    } catch (_) {}
    return null;
  });

  const setActiveTrackingOrderId = (id) => {
    setActiveTrackingOrderIdState(id);
    try {
      if (typeof window !== 'undefined') {
        const uid = currentUser?.uid || currentUser?.id;
        if (id) {
          sessionStorage.setItem('fabricare_active_tracking_id', String(id));
          if (uid) sessionStorage.setItem(`fabricare_active_tracking_id_${uid}`, String(id));
        } else {
          sessionStorage.removeItem('fabricare_active_tracking_id');
          if (uid) sessionStorage.removeItem(`fabricare_active_tracking_id_${uid}`);
        }
      }
    } catch (_) {}
  };

  // Clear tracking order ID and active tracking session when customer session changes
  useEffect(() => {
    setActiveTrackingOrderIdState(null);
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('fabricare_active_tracking_id');
        const keysToRemove = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const k = sessionStorage.key(i);
          if (k && k.startsWith('fabricare_active_tracking_id')) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach(k => sessionStorage.removeItem(k));
      }
    } catch (_) {}
  }, [currentUser?.uid]);

  // Booking Flow State
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState([]);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState(null);

  // Selected Clothing Items State (Map of uniqueKey -> item object)
  const [selectedItems, setSelectedItems] = useState(() => {
    try {
      const stored = sessionStorage.getItem('fabricare_selected_clothing_items');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('fabricare_selected_clothing_items', JSON.stringify(selectedItems));
    } catch (e) {}

    // Automatically synchronize selectedServices with active categories that have selected items
    const activeCategoryIds = Array.from(
      new Set(
        Object.values(selectedItems)
          .filter(it => it && it.quantity > 0)
          .map(it => it.categoryId)
      )
    );
    setSelectedServices(activeCategoryIds);
  }, [selectedItems]);

  const addItem = (item, categoryId, subcategoryId, qty = 1, expressService = null) => {
    const isExpress = categoryId === 'express-laundry';
    const effectiveExpressService = expressService || item.expressService || 'wash-fold';
    const expressSvcObj = EXPRESS_SERVICES.find(s => s.id === effectiveExpressService) || { name: 'Wash & Fold' };
    const cat = PRICING_CATEGORIES.find(c => c.id === categoryId);
    const sub = PRICING_SUBCATEGORIES.find(s => s.id === subcategoryId);
    const itemKey = isExpress 
      ? `express-laundry__${effectiveExpressService}__${item.id}`
      : `${categoryId}__${item.id}`;

    // Determine unit price based on configured rules
    let unitPrice = 100;
    if (isExpress) {
      unitPrice = item.price || getExpressItemPrice(item, effectiveExpressService);
    } else if (item.price != null && Number(item.price) > 0) {
      unitPrice = Number(item.price);
    } else if (cat?.isPriceEnabled && item.prices && item.prices[categoryId] != null) {
      unitPrice = Number(item.prices[categoryId]);
    } else if (categoryId === 'dry-cleaning') {
      unitPrice = item.price || getItemBasePrice(item, 'dry-cleaning');
    } else if (categoryId === 'steam-iron') {
      unitPrice = item.price || getItemBasePrice(item, 'steam-iron');
    } else if (item.price != null) {
      unitPrice = Number(item.price);
    }

    const categoryName = isExpress
      ? `Express ${expressSvcObj.name}`
      : (cat ? cat.name : categoryId);

    setSelectedItems(prev => {
      const existing = prev[itemKey];
      const newQty = (existing ? existing.quantity : 0) + qty;
      return {
        ...prev,
        [itemKey]: {
          key: itemKey,
          id: item.id,
          name: item.name,
          categoryId: categoryId,
          expressService: isExpress ? effectiveExpressService : null,
          categoryName: categoryName,
          subcategoryId: subcategoryId,
          subcategoryName: sub ? sub.name : subcategoryId,
          unit: item.unit || 'item',
          unitPrice: unitPrice,
          baseUnitPrice: isExpress ? getItemBasePrice(item, effectiveExpressService) : unitPrice,
          isPriceEnabled: true,
          quantity: newQty,
          isExpress: isExpress
        }
      };
    });

    // Also reflect in selectedServices
    setSelectedServices(prev => prev.includes(categoryId) ? prev : [...prev, categoryId]);
  };

  const removeItem = (itemKey) => {
    setSelectedItems(prev => {
      const updated = { ...prev };
      delete updated[itemKey];
      return updated;
    });
  };

  const updateItemQuantity = (itemKey, delta) => {
    setSelectedItems(prev => {
      const existing = prev[itemKey];
      if (!existing) return prev;
      const newQty = existing.quantity + delta;
      if (newQty <= 0) {
        const updated = { ...prev };
        delete updated[itemKey];
        return updated;
      }
      return {
        ...prev,
        [itemKey]: {
          ...existing,
          quantity: newQty
        }
      };
    });
  };

  const setItemQuantity = (itemKey, qty) => {
    setSelectedItems(prev => {
      const existing = prev[itemKey];
      if (!existing) return prev;
      if (qty <= 0) {
        const updated = { ...prev };
        delete updated[itemKey];
        return updated;
      }
      return {
        ...prev,
        [itemKey]: {
          ...existing,
          quantity: qty
        }
      };
    });
  };

  const getItemQuantity = (categoryId, itemId, expressService = null) => {
    if (categoryId === 'express-laundry' && expressService) {
      const itemKey = `express-laundry__${expressService}__${itemId}`;
      return selectedItems[itemKey]?.quantity || 0;
    }
    const itemKey = `${categoryId}__${itemId}`;
    if (selectedItems[itemKey]) return selectedItems[itemKey].quantity || 0;
    // Fallback check for any express key matching itemId
    if (categoryId === 'express-laundry') {
      const found = Object.values(selectedItems).find(it => it.categoryId === 'express-laundry' && it.id === itemId);
      return found?.quantity || 0;
    }
    return 0;
  };

  const clearAllItems = () => {
    setSelectedItems({});
    setSelectedServices([]);
    setIsExpressDelivery(false);
    try {
      sessionStorage.removeItem('fabricare_selected_clothing_items');
      sessionStorage.removeItem('fabricare_is_express_delivery');
    } catch (e) {}
  };

  const selectedItemsList = Object.values(selectedItems);
  const totalItemsCount = selectedItemsList.reduce((sum, it) => sum + it.quantity, 0);

  // Helper to compute effective item pricing avoiding duplicate washing charge:
  // If the same item is selected under both Wash & Fold (or Express Laundry) and Wash & Iron,
  // the washing charge is applied once, and Wash & Iron charges only the ironing component (50% of item price).
  const calculateItemPricing = (item, allItems = selectedItemsList) => {
    return getItemPricing(item, allItems);
  };

  const calculateItemsTotal = () => {
    return selectedItemsList.reduce((sum, it) => {
      const pricing = getItemPricing(it, selectedItemsList);
      return sum + pricing.lineTotal;
    }, 0);
  };

  const calculateDuplicateWashSavings = () => {
    return selectedItemsList.reduce((sum, it) => {
      const pricing = getItemPricing(it, selectedItemsList);
      return sum + pricing.totalSaved;
    }, 0);
  };
  
  // Step 2 Pickup Details
  const [pickupDetails, setPickupDetails] = useState({
    name: '',
    mobile: '',
    whatsappUpdates: true,
    address: '',
    landmark: '',
    city: 'Bengaluru',
    pincode: '',
    sameAddressDelivery: true,
    deliveryAddress: ''
  });

  // Step 3 Time Slot
  const [pickupSchedule, setPickupSchedule] = useState(() => {
    const target = new Date();
    // Default to 2 days in advance (earliest valid date for standard/normal services)
    target.setDate(target.getDate() + 2);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const iso = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`;
    const label = `${days[target.getDay()]}, ${target.getDate()} ${months[target.getMonth()]} ${target.getFullYear()}`;
    return {
      dateLabel: label,
      dateValue: iso,
      timeSlot: '9:00 AM – 11:00 AM'
    };
  });

  // Step 4 Instructions & Estimation
  const [specialInstructions, setSpecialInstructions] = useState('Please handle garments with extra care.');
  const [isExpressDelivery, setIsExpressDelivery] = useState(() => {
    try {
      return sessionStorage.getItem('fabricare_is_express_delivery') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('fabricare_is_express_delivery', String(isExpressDelivery));
    } catch (e) {}
  }, [isExpressDelivery]);

  // Helpers to calculate calendar dates for Normal vs Express Laundry
  const getDaysDifference = (isoDateStr) => {
    if (!isoDateStr) return null;
    const parts = isoDateStr.split('-');
    if (parts.length !== 3) return null;
    const targetDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    targetDate.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffMs = targetDate.getTime() - now.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  };

  const getEarliestNormalDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayName = days[d.getDay()];
    const isoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const full = `${dayName}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    return { label: dayName, date: `${d.getDate()} ${months[d.getMonth()]}`, full, isoDate };
  };

  const getEarliestExpressDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const isoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const full = `Tomorrow, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    return { label: 'Tomorrow', date: `${d.getDate()} ${months[d.getMonth()]}`, full, isoDate };
  };

  // Check if current booking has Express Laundry selected
  const hasExpressItems = selectedItemsList.some(it => it.categoryId === 'express-laundry' || String(it.categoryName || '').toLowerCase().includes('express'));
  const hasNormalItems = selectedItemsList.some(it => it.categoryId !== 'express-laundry' && it.quantity > 0);

  const isExpressBooking = Boolean(isExpressDelivery) || 
    selectedServices.some(s => s === 'express-laundry' || String(s).toLowerCase().includes('express')) ||
    hasExpressItems;

  // Auto-sync isExpressDelivery if all items are normal
  useEffect(() => {
    if (hasNormalItems && !hasExpressItems && isExpressDelivery) {
      setIsExpressDelivery(false);
    }
  }, [hasNormalItems, hasExpressItems, isExpressDelivery]);

  // Synchronize date whenever service category mode changes:
  // Normal services must never retain an urgent/next-day date (< 2 days in advance)
  useEffect(() => {
    if (!pickupSchedule.dateValue) return;
    const diff = getDaysDifference(pickupSchedule.dateValue);

    if (!isExpressBooking) {
      if (diff === null || diff < 2) {
        const earliest = getEarliestNormalDate();
        setPickupSchedule(prev => ({
          ...prev,
          dateLabel: earliest.full,
          dateValue: earliest.isoDate
        }));
      }
    }
  }, [isExpressBooking, pickupSchedule.dateValue]);

  // Switch workflow: Transform normal laundry booking to Express Laundry
  const switchToExpressLaundry = (targetDate = null) => {
    setIsExpressDelivery(true);

    setSelectedItems(prevItems => {
      const updated = {};
      const entries = Object.entries(prevItems || {});

      entries.forEach(([key, it]) => {
        if (!it) return;

        // If it's already an express item, preserve it
        if (it.categoryId === 'express-laundry') {
          updated[key] = it;
          return;
        }

        // Map prior category to corresponding Express Laundry service
        // Express supports: 'wash-fold', 'wash-iron', 'dry-cleaning', 'steam-iron'
        let targetService = 'wash-fold';
        if (it.categoryId === 'wash-iron') targetService = 'wash-iron';
        else if (it.categoryId === 'dry-cleaning') targetService = 'dry-cleaning';
        else if (it.categoryId === 'steam-iron') targetService = 'steam-iron';
        else if (it.expressService) targetService = it.expressService;

        const expressSvcObj = EXPRESS_SERVICES.find(s => s.id === targetService) || { name: 'Wash & Fold' };
        const newKey = `express-laundry__${targetService}__${it.id}`;

        const origItem = PRICING_ITEMS.find(p => p.id === it.id) || it;
        const doubledPrice = getExpressItemPrice(origItem, targetService);
        const baseRate = getItemBasePrice(origItem, targetService);

        updated[newKey] = {
          ...it,
          key: newKey,
          categoryId: 'express-laundry',
          expressService: targetService,
          categoryName: `Express ${expressSvcObj.name}`,
          unitPrice: doubledPrice,
          baseUnitPrice: baseRate,
          isExpress: true,
          isPriceEnabled: true
        };
      });

      try {
        sessionStorage.setItem('fabricare_selected_clothing_items', JSON.stringify(updated));
      } catch (e) {}

      return updated;
    });

    // Explicitly update selectedServices to ['express-laundry']
    setSelectedServices(['express-laundry']);

    // Set date associated with Express Laundry (next-day/attempted date)
    const expressDate = (targetDate && (targetDate.isoDate || targetDate.dateValue)) 
      ? targetDate 
      : getEarliestExpressDate();

    setPickupSchedule(prev => ({
      ...prev,
      dateLabel: expressDate.full || expressDate.label || expressDate.dateLabel,
      dateValue: expressDate.isoDate || expressDate.dateValue || expressDate.date
    }));
  };

  // Switch workflow: Transform Express Laundry booking back to standard service
  const switchToNormalLaundry = (targetCategoryId = 'wash-fold', targetDate = null) => {
    setIsExpressDelivery(false);

    setSelectedItems(prevItems => {
      const updated = {};
      const entries = Object.entries(prevItems || {});

      entries.forEach(([key, it]) => {
        if (!it) return;

        if (it.categoryId !== 'express-laundry') {
          updated[key] = it;
          return;
        }

        const normalCatId = it.expressService || targetCategoryId || 'wash-fold';
        const catObj = PRICING_CATEGORIES.find(c => c.id === normalCatId) || { name: 'Wash & Fold' };
        const newKey = `${normalCatId}__${it.id}`;

        const origItem = PRICING_ITEMS.find(p => p.id === it.id) || it;
        const baseRate = getItemBasePrice(origItem, normalCatId);

        updated[newKey] = {
          ...it,
          key: newKey,
          categoryId: normalCatId,
          expressService: null,
          categoryName: catObj.name,
          unitPrice: baseRate,
          baseUnitPrice: baseRate,
          isExpress: false,
          isPriceEnabled: true
        };
      });

      try {
        sessionStorage.setItem('fabricare_selected_clothing_items', JSON.stringify(updated));
      } catch (e) {}

      return updated;
    });

    setSelectedServices([targetCategoryId]);

    // Set date associated with Normal Laundry (at least 2 days in advance, do not retain express date)
    let normalDate = getEarliestNormalDate();
    if (targetDate && (targetDate.isoDate || targetDate.dateValue)) {
      const diff = getDaysDifference(targetDate.isoDate || targetDate.dateValue);
      if (diff !== null && diff >= 2) {
        normalDate = targetDate;
      }
    }

    setPickupSchedule(prev => ({
      ...prev,
      dateLabel: normalDate.full || normalDate.label || normalDate.dateLabel,
      dateValue: normalDate.isoDate || normalDate.dateValue || normalDate.date
    }));
  };
  
  // Confirmed Order Info
  const [lastOrder, setLastOrder] = useState(null);

  // Track previous user to know when user session changes
  const lastUserUidRef = React.useRef(currentUser?.uid || null);

  // Sync authenticated user info and default saved address into pickupDetails
  useEffect(() => {
    const isInternalStaff = currentUser?.role === 'agent' || currentUser?.role === 'staff' || currentUser?.role === 'admin' || 
                            String(currentUser?.email || '').includes('delivery@') || String(currentUser?.email || '').includes('admin@') || String(currentUser?.email || '').includes('staff@');
    
    const userSwitched = lastUserUidRef.current !== (currentUser?.uid || null);
    lastUserUidRef.current = currentUser?.uid || null;

    if (!currentUser || isInternalStaff) {
      // Clear any staff names or reset details
      setPickupDetails(prev => {
        const isStaleStaff = ['ravi sharma', 'administrator', 'anil verma', 'anita sharma', 'delivery agent'].includes((prev.name || '').trim().toLowerCase());
        const isStaleStaffPhone = ['+919811122233', '+91 98111 22233', '+919822233344', '+919800000000'].includes((prev.mobile || '').trim());
        return {
          ...prev,
          name: isStaleStaff ? '' : prev.name,
          mobile: isStaleStaffPhone ? '' : prev.mobile
        };
      });
      return;
    }

    // Current user is a real customer
    const custName = currentUser.displayName || currentUser.name || currentUser.fullName || currentUser.full_name || '';
    const rawCustPhone = currentUser.phoneNumber || currentUser.phone || '';
    const custPhone = String(rawCustPhone).replace(/^\+?91/, '').replace(/\D/g, '').slice(0, 10);

    setPickupDetails(prev => {
      const isStaleStaffName = ['ravi sharma', 'administrator', 'anil verma', 'anita sharma', 'delivery agent', 'customer', 'valued customer'].includes((prev.name || '').trim().toLowerCase());
      const isStaleStaffPhone = ['+919811122233', '+91 98111 22233', '+919822233344', '+919800000000'].includes((prev.mobile || '').trim());

      const nextName = (userSwitched || isStaleStaffName || !prev.name) ? (custName || '') : prev.name;
      const rawNextPhone = (userSwitched || isStaleStaffPhone || !prev.mobile) ? (custPhone || '') : prev.mobile;
      const nextPhone = String(rawNextPhone || '').replace(/^\+?91/, '').replace(/\D/g, '').slice(0, 10);

      return {
        ...prev,
        name: nextName,
        mobile: nextPhone,
        address: prev.address && prev.address !== 'Banaswadi, Bengaluru - 560043' ? prev.address : (currentUser.address || prev.address),
        city: currentUser.city || prev.city || 'Bengaluru',
        pincode: currentUser.pincode || prev.pincode || '560043'
      };
    });

    // Fetch saved default address safely
    if (addressApi && typeof addressApi.getAddresses === 'function') {
      addressApi.getAddresses()
        .then(res => {
          const addrs = Array.isArray(res?.data) ? res.data : (res?.data?.results || []);
          if (addrs.length > 0) {
            const def = addrs.find(a => a.is_default) || addrs[0];
            setPickupDetails(prev => ({
              ...prev,
              address: def.address_line || def.address_line1 || prev.address,
              landmark: def.landmark || def.address_line2 || prev.landmark,
              city: def.city || prev.city,
              pincode: def.pincode || prev.pincode
            }));
          }
        })
        .catch(err => console.warn('Saved addresses notice:', err?.message));
    }
  }, [currentUser]);

  // Load real services and categories from backend API
  useEffect(() => {
    const loadRealServices = async () => {
      try {
        const [catRes, srvRes] = await Promise.allSettled([
          servicesApi && typeof servicesApi.getCategories === 'function' ? servicesApi.getCategories() : Promise.resolve({ data: [] }),
          servicesApi && typeof servicesApi.getServices === 'function' ? servicesApi.getServices() : Promise.resolve({ data: [] })
        ]);

        if (catRes.status === 'fulfilled' && catRes.value?.data) {
          const cats = Array.isArray(catRes.value.data) ? catRes.value.data : (catRes.value.data?.results || []);
          setServiceCategories(cats);
        }

        if (srvRes.status === 'fulfilled' && srvRes.value?.data) {
          const srvs = Array.isArray(srvRes.value.data) ? srvRes.value.data : (srvRes.value.data?.results || []);
          if (srvs.length > 0) {
            setAdminItemsCatalog(srvs);
          }
        }
      } catch (err) {
        console.warn('Real services loading notice, using fallback:', err.message);
      }
    };

    loadRealServices();
  }, []);

  const toggleService = (serviceId) => {
    setSelectedServices(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  const clearAllServices = () => {
    setSelectedServices([]);
  };

  const calculateTotal = () => {
    return calculateItemsTotal();
  };

  const navigateTo = (page, idParam = null, options = {}) => {
    let actualId = idParam;
    let actualOptions = options;
    if (idParam && typeof idParam === 'object' && !Array.isArray(idParam)) {
      actualOptions = idParam;
      actualId = null;
    }

    const cleanPage = String(page || 'home').replace(/^#\/?/, '').trim();
    setCurrentPage(cleanPage);
    if (typeof window !== 'undefined') {
      if (window.location.pathname && window.location.pathname !== '/') {
        try {
          window.history.replaceState(null, '', `/#${cleanPage}`);
        } catch (_) {
          window.location.hash = cleanPage;
        }
      } else {
        if (actualOptions?.replace) {
          window.location.replace(`#${cleanPage}`);
        } else {
          window.location.hash = cleanPage;
        }
      }
    }
    if (cleanPage === 'customer-track' && actualId) {
      setActiveTrackingOrderId(actualId);
    } else if (cleanPage === 'services' && actualId) {
      setSelectedServiceDetail(actualId);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.navigateTo = navigateTo;
    }
  }, []);

  const startBooking = (targetStep = null) => {
    if (!isAuthenticated) {
      sessionStorage.setItem('fabricare_intended_destination', 'booking');
      navigateTo('login');
      return;
    }
    if (targetStep) {
      setCurrentStep(targetStep);
    } else if (selectedItemsList.length > 0) {
      setCurrentStep(2);
    } else {
      setCurrentStep(1);
    }
    setCurrentPage('booking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmOrder = async () => {
    // Prevent duplicate bookings caused by repeated clicks
    if (isSubmittingOrder) return;

    if (!isAuthenticated) {
      sessionStorage.setItem('fabricare_intended_destination', 'booking');
      navigateTo('login');
      return;
    }

    if (selectedItemsList.length === 0 && selectedServices.length === 0) {
      alert('Please select at least one clothing item or laundry service before confirming.');
      setCurrentStep(1);
      return;
    }

    if (!pickupDetails.name || !pickupDetails.name.trim() || !pickupDetails.mobile || !pickupDetails.address) {
      alert('Please provide your full name, mobile number, and pickup address.');
      setCurrentStep(2);
      return;
    }

    setIsSubmittingOrder(true);
    setOrderError(null);

    try {
      // Build itemized payload for Django backend OrderItem creation with effective pricing
      const itemsPayload = selectedItemsList.map(it => {
        const pricing = getItemPricing(it, selectedItemsList);
        return {
          item_name: it.name,
          service_category: it.categoryName || it.categoryId,
          quantity: it.quantity,
          unit_price: pricing.effectiveUnitPrice,
          total_price: pricing.lineTotal,
          note: pricing.hasIroningDiscount ? pricing.discountReason : ''
        };
      });

      // Service names list
      const serviceNames = [
        ...new Set([
          ...selectedItemsList.map(it => it.categoryName),
          ...selectedServices.map(id => {
            const s = servicesList.find(item => item.id === id);
            return s ? s.name : id;
          })
        ])
      ].filter(Boolean);

      const total = calculateTotal() || 300;

      // Prepare order items dictionary
      const orderItemsMap = {};
      if (selectedItemsList.length > 0) {
        selectedItemsList.forEach((it, idx) => {
          const itemCat = it.categoryName || it.category || 'Wash & Fold';
          orderItemsMap[`item_${idx + 1}`] = {
            name: it.name || 'Laundry Item',
            category: itemCat,
            service_category: itemCat,
            services: [itemCat],
            quantity: it.quantity || 1,
            unitPrice: Math.round((it.unitPrice || 60) * 100),
            lineTotal: Math.round(((it.unitPrice || 60) * (it.quantity || 1)) * 100)
          };
        });
      } else {
        selectedServices.forEach((svcId, idx) => {
          const s = servicesList.find(item => item.id === svcId) || INITIAL_SERVICES.find(item => item.id === svcId) || {};
          const svcName = s.name || svcId;
          const svcPrice = s.price || 120;
          orderItemsMap[`item_${idx + 1}`] = {
            name: svcName,
            category: svcName,
            service_category: svcName,
            services: [svcName],
            quantity: 1,
            unitPrice: Math.round(svcPrice * 100),
            lineTotal: Math.round(svcPrice * 100)
          };
        });
      }

      let formattedPickupDate = pickupSchedule.dateValue;
      if (!formattedPickupDate || !/^\d{4}-\d{2}-\d{2}$/.test(formattedPickupDate)) {
        formattedPickupDate = new Date().toISOString().split('T')[0];
      }

      const isExpress = Boolean(isExpressDelivery) || 
        selectedServices.some(s => s === 'express-laundry' || String(s).toLowerCase().includes('express')) ||
        selectedItemsList.some(it => it.categoryId === 'express-laundry' || String(it.categoryName || '').toLowerCase().includes('express'));

      // Validate booking rules: Normal services must be at least 2 days in advance
      if (!isExpress && formattedPickupDate) {
        const parts = formattedPickupDate.split('-');
        if (parts.length === 3) {
          const targetDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
          targetDate.setHours(0, 0, 0, 0);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const diffDays = Math.round((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays < 2) {
            setOrderError('Normal laundry services require booking at least 2 days in advance. Please select a valid date or choose Express Laundry for next-day pickup.');
            setIsSubmittingOrder(false);
            return;
          }
        }
      }

      // Sanitize customer name to never permit delivery agent or administrator name when booked by a customer
      let finalCustName = (pickupDetails.name || '').trim();
      const staffNames = ['ravi sharma', 'administrator', 'anil verma', 'anita sharma', 'delivery agent'];
      if (!finalCustName || staffNames.includes(finalCustName.toLowerCase())) {
        finalCustName = (currentUser?.displayName || currentUser?.name || currentUser?.fullName || 'Customer').trim();
      }

      let finalCustPhone = (pickupDetails.mobile || '').trim();
      const staffPhones = ['+919811122233', '+91 98111 22233', '+919822233344', '+919800000000'];
      if (staffPhones.includes(finalCustPhone) || !finalCustPhone) {
        finalCustPhone = (currentUser?.phoneNumber || currentUser?.phone || '').trim();
      }

      const bookingPayload = {
        customerName: finalCustName || 'Customer',
        customerPhone: finalCustPhone || '',
        customerEmail: (currentUser?.email || '').toLowerCase().trim(),
        address: {
          flatHouse: pickupDetails.address || '',
          areaColony: pickupDetails.landmark || '',
          city: pickupDetails.city || 'Bengaluru',
          pincode: pickupDetails.pincode || '560043',
          label: 'Home'
        },
        pickup: {
          date: formattedPickupDate,
          from: pickupSchedule.timeSlot?.split('–')[0]?.trim() || '09:00',
          to: pickupSchedule.timeSlot?.split('–')[1]?.trim() || '11:00'
        },
        isExpress: Boolean(isExpress),
        notes: specialInstructions || '',
        services: serviceNames.length > 0 ? serviceNames : ['Wash & Fold'],
        services_list: serviceNames.length > 0 ? serviceNames : ['Wash & Fold'],
        service: serviceNames.join(' + ') || 'Wash & Fold',
        items: orderItemsMap,
        subtotal: total,
        total: total
      };

      // 1. Create order in RTDB (status: PAYMENT_PENDING)
      const { orderId, code, orderData } = await createCustomerOrder(bookingPayload, currentUser);

      // 2. Automatically confirm mock payment -> transitions to PLACED, creates unassigned pickup task & invoice
      await confirmCustomerPayment(orderId, 'UPI_MOCK', currentUser);

      const confirmedOrderData = {
        orderId: code,
        id: code,
        order_number: code,
        order_id: code,
        code,
        dateText: pickupSchedule.dateLabel || pickupSchedule.dateValue,
        timeText: pickupSchedule.timeSlot || '09:00 AM – 11:00 AM',
        pickup_date: pickupSchedule.dateValue || pickupSchedule.dateLabel,
        pickup_time_slot: pickupSchedule.timeSlot || '09:00 AM – 11:00 AM',
        addressTitle: pickupDetails.address,
        addressDetail: pickupDetails.landmark || '',
        services: serviceNames,
        items: selectedItemsList.map(it => {
          const pricing = getItemPricing(it, selectedItemsList);
          return {
            ...it,
            unit_price: pricing.effectiveUnitPrice,
            total_price: pricing.lineTotal,
            lineTotal: pricing.lineTotal
          };
        }),
        estimatedTotal: total,
        total_amount: (total || 0).toFixed(2).replace(/\.00$/, ''),
        total: total,
        status: 'Pending Pickup',
        paymentStatus: 'Paid',
        payment_status: 'PAID',
        payment: 'Paid',
        is_paid: true,
        isPaid: true,
        createdOrder: orderData
      };

      setLastOrder(confirmedOrderData);
      setActiveTrackingOrderId(orderId);

      // Clear selected items and reset pickupDetails so next booking starts fresh
      setSelectedItems({});
      try {
        sessionStorage.removeItem('fabricare_selected_clothing_items');
      } catch (e) {}

      setPickupDetails({
        name: (currentUser?.displayName || currentUser?.name || currentUser?.fullName || ''),
        mobile: (currentUser?.phoneNumber || currentUser?.phone || ''),
        whatsappUpdates: true,
        address: 'Banaswadi, Bengaluru - 560043',
        landmark: 'House #12, 3rd Cross, HRBR Layout',
        city: 'Bengaluru',
        pincode: '560043',
        sameAddressDelivery: true,
        deliveryAddress: ''
      });

      setCurrentPage('confirmed');
      window.scrollTo({ top: 0, behavior: 'smooth' });

      return confirmedOrderData;
    } catch (err) {
      console.error('Order creation error:', err);
      const msg = err.message || 'Failed to confirm pickup. Please try again.';
      setOrderError(msg);
      alert(msg);
      throw err;
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return (
    <BookingContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        navigateTo,
        selectedServiceDetail,
        setSelectedServiceDetail,
        activeTrackingOrderId,
        setActiveTrackingOrderId,
        currentStep,
        setCurrentStep,
        selectedServices,
        setSelectedServices,
        toggleService,
        clearAllServices,
        // Item selection & pricing state
        selectedItems,
        selectedItemsList,
        totalItemsCount,
        addItem,
        removeItem,
        updateItemQuantity,
        setItemQuantity,
        getItemQuantity,
        clearAllItems,
        getItemPricing: (item) => getItemPricing(item, selectedItemsList),
        calculateItemPricing,
        calculateItemsTotal,
        calculateDuplicateWashSavings,
        pickupDetails,
        setPickupDetails,
        pickupSchedule,
        setPickupSchedule,
        specialInstructions,
        setSpecialInstructions,
        isExpressDelivery,
        setIsExpressDelivery,
        switchToExpressLaundry,
        switchToNormalLaundry,
        lastOrder,
        setLastOrder,
        startBooking,
        confirmOrder,
        calculateTotal,
        allServices: servicesList,
        serviceCategories,
        adminItemsCatalog,
        isExpressBooking,
        isSubmittingOrder,
        orderError
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    return {
      currentPage: typeof window !== 'undefined' ? (window.location.hash.replace(/^#\/?/, '').trim().toLowerCase() || 'home') : 'home',
      navigateTo: (page) => {
        if (typeof window !== 'undefined') window.location.hash = page;
      },
      bookingState: {},
      allServices: [],
      serviceCategories: [],
      isExpressBooking: false,
      switchToExpressLaundry: () => {},
      switchToNormalLaundry: () => {}
    };
  }
  return context;
};
