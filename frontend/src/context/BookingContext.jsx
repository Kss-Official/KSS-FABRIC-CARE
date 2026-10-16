import React, { createContext, useContext, useState, useEffect } from 'react';
import { createFirestoreOrder, subscribeServices } from '../services/firestoreService';
import { servicesApi, ordersApi, addressApi } from '../api/apiClient';
import { useAuth } from './AuthContext';
import { INITIAL_SERVICES } from '../constants/servicesConstants';
import { PRICING_CATEGORIES, PRICING_SUBCATEGORIES, PRICING_ITEMS } from '../data/pricingData';

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
  const [serviceCategories, setServiceCategories] = useState([]);
  const [activeTrackingOrderId, setActiveTrackingOrderId] = useState(null);

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

  const addItem = (item, categoryId, subcategoryId, qty = 1) => {
    const cat = PRICING_CATEGORIES.find(c => c.id === categoryId);
    const sub = PRICING_SUBCATEGORIES.find(s => s.id === subcategoryId);
    const itemKey = `${categoryId}__${item.id}`;

    // Determine unit price based on configured rules
    let unitPrice = 100;
    if (cat?.isPriceEnabled && item.prices && item.prices[categoryId] != null) {
      unitPrice = Number(item.prices[categoryId]);
    } else if (categoryId === 'dry-cleaning') {
      unitPrice = 120; // Configured base rate ₹120 / item
    } else if (categoryId === 'steam-iron') {
      unitPrice = 20;  // Configured base rate ₹20 / item
    } else if (categoryId === 'express-laundry') {
      unitPrice = item.prices?.['express-laundry'] || 200;
    } else if (item.price != null) {
      unitPrice = Number(item.price);
    }

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
          categoryName: cat ? cat.name : categoryId,
          subcategoryId: subcategoryId,
          subcategoryName: sub ? sub.name : subcategoryId,
          unit: item.unit || 'item',
          unitPrice: unitPrice,
          isPriceEnabled: Boolean(cat?.isPriceEnabled),
          quantity: newQty
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

  const getItemQuantity = (categoryId, itemId) => {
    const itemKey = `${categoryId}__${itemId}`;
    return selectedItems[itemKey]?.quantity || 0;
  };

  const clearAllItems = () => {
    setSelectedItems({});
    setSelectedServices([]);
    try {
      sessionStorage.removeItem('fabricare_selected_clothing_items');
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
    name: 'Valued Customer',
    mobile: '+91 98765 43210',
    whatsappUpdates: true,
    address: 'Banaswadi, Bengaluru - 560043',
    landmark: 'House #12, 3rd Cross, HRBR Layout',
    city: 'Bengaluru',
    pincode: '560043',
    sameAddressDelivery: true,
    deliveryAddress: ''
  });

  // Step 3 Time Slot
  const [pickupSchedule, setPickupSchedule] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const iso = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    const label = `Tomorrow, ${tomorrow.getDate()} ${months[tomorrow.getMonth()]} ${tomorrow.getFullYear()}`;
    return {
      dateLabel: label,
      dateValue: iso,
      timeSlot: '9:00 AM – 11:00 AM'
    };
  });

  // Step 4 Instructions & Estimation
  const [specialInstructions, setSpecialInstructions] = useState('Please handle garments with extra care.');
  
  // Confirmed Order Info
  const [lastOrder, setLastOrder] = useState(null);

  // Sync authenticated user info and default saved address into pickupDetails
  useEffect(() => {
    if (currentUser) {
      setPickupDetails(prev => ({
        ...prev,
        name: currentUser.displayName || currentUser.full_name || prev.name,
        mobile: currentUser.phoneNumber || currentUser.phone || prev.mobile,
        address: currentUser.address || prev.address,
        city: currentUser.city || prev.city || 'Bengaluru',
        pincode: currentUser.pincode || prev.pincode || '560043'
      }));

      // Fetch saved default address from backend
      addressApi.getAddresses()
        .then(res => {
          const addrs = Array.isArray(res.data) ? res.data : (res.data?.results || []);
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
        .catch(err => console.warn('Saved addresses notice:', err.message));
    }
  }, [currentUser]);

  // Load real services and categories from backend API
  useEffect(() => {
    const loadRealServices = async () => {
      try {
        const [catRes, srvRes] = await Promise.allSettled([
          servicesApi.getCategories(),
          servicesApi.getServices()
        ]);

        if (catRes.status === 'fulfilled' && catRes.value?.data) {
          const cats = Array.isArray(catRes.value.data) ? catRes.value.data : (catRes.value.data?.results || []);
          setServiceCategories(cats);
        }

        if (srvRes.status === 'fulfilled' && srvRes.value?.data) {
          const srvs = Array.isArray(srvRes.value.data) ? srvRes.value.data : (srvRes.value.data?.results || []);
          if (srvs.length > 0) {
            setServicesList(prev => prev.map(item => {
              const match = srvs.find(s => 
                (s.name && s.name.toLowerCase().includes(item.name.toLowerCase())) ||
                (s.category_name && s.category_name.toLowerCase().includes(item.name.toLowerCase()))
              );
              return match ? { ...item, price: parseFloat(match.price) || item.price } : item;
            }));
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
    if (selectedItemsList.length > 0) {
      return calculateItemsTotal();
    }
    return selectedServices.reduce((total, id) => {
      const s = servicesList.find(item => item.id === id);
      return total + (s ? s.price : 0);
    }, 0);
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
      if (actualOptions?.replace) {
        window.location.replace(`#${cleanPage}`);
      } else {
        window.location.hash = cleanPage;
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

    if (!pickupDetails.mobile || !pickupDetails.address) {
      alert('Please provide your mobile number and pickup address.');
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

      // 1. Get or create customer address
      let addressId = null;
      try {
        const addrRes = await addressApi.getAddresses();
        const addrList = Array.isArray(addrRes.data) ? addrRes.data : [];
        if (addrList.length > 0) {
          const def = addrList.find(a => a.is_default) || addrList[0];
          addressId = def.id;
        } else {
          const createAddrRes = await addressApi.createAddress({
            label: 'Home',
            line1: pickupDetails.address || 'Banaswadi, Bengaluru',
            city: pickupDetails.city || 'Bengaluru',
            pincode: pickupDetails.pincode || '560043',
            is_default: true
          });
          addressId = createAddrRes.data.id;
        }
      } catch (addrErr) {
        console.warn('Address setup note:', addrErr);
      }

      // 2. Map items to catalog garment_type_id and service_ids
      const availableGarments = [
        { id: 'shirt', name: 'Shirt' },
        { id: 'tshirt', name: 'T-Shirt' },
        { id: 'trousers', name: 'Trousers' },
        { id: 'jeans', name: 'Jeans' },
        { id: 'dress', name: 'Dress' },
        { id: 'saree', name: 'Saree' },
        { id: 'jacket', name: 'Jacket' },
        { id: 'bedsheet', name: 'Bedsheet' }
      ];

      const availableServices = [
        { id: 'wash-fold', name: 'Wash & Fold' },
        { id: 'wash-iron', name: 'Wash + Iron' },
        { id: 'steam-iron', name: 'Steam + Iron' },
        { id: 'dry-clean', name: 'Dry Clean' },
        { id: 'wash', name: 'Wash' },
        { id: 'iron', name: 'Iron' }
      ];

      const mappedItems = selectedItemsList.map(it => {
        const itNameLower = (it.name || '').toLowerCase();
        const matchedGarment = availableGarments.find(g => 
          itNameLower.includes(g.id.toLowerCase()) || 
          itNameLower.includes(g.name.toLowerCase()) ||
          g.id.toLowerCase().includes(itNameLower)
        ) || availableGarments[0];

        const itCatLower = (it.categoryId || it.categoryName || '').toLowerCase().replace(/[^a-z]/g, '');
        const matchedService = availableServices.find(s => {
          const sLower = s.id.toLowerCase().replace(/[^a-z]/g, '');
          const sNameLower = s.name.toLowerCase().replace(/[^a-z]/g, '');
          return itCatLower.includes(sLower) || itCatLower.includes(sNameLower) || sLower.includes(itCatLower);
        }) || availableServices[0];

        return {
          garment_type_id: matchedGarment.id,
          quantity: Math.max(1, Number(it.quantity) || 1),
          service_ids: [matchedService.id]
        };
      });

      const finalItems = mappedItems.length > 0 ? mappedItems : [
        { garment_type_id: 'shirt', quantity: 1, service_ids: ['wash-fold'] }
      ];

      let formattedPickupDate = pickupSchedule.dateValue;
      if (!formattedPickupDate || !/^\d{4}-\d{2}-\d{2}$/.test(formattedPickupDate)) {
        formattedPickupDate = new Date().toISOString().split('T')[0];
      }

      const orderPayload = {
        address_id: addressId,
        pickup_slot: {
          date: formattedPickupDate,
          from: '09:00',
          to: '11:00'
        },
        is_express: Boolean(isExpressDelivery),
        notes: specialInstructions || undefined,
        items: finalItems
      };

      const res = await ordersApi.createOrder(orderPayload);
      const created = res.data;
      const orderNumber = created.code || `#FC${created.id.substring(0, 5)}`;

      // Pay and verify order automatically in mock gateway mode
      try {
        const payRes = await ordersApi.pay(created.id, 'upi');
        if (payRes.data?.payment_id) {
          await customerApi.verifyPayment(payRes.data.payment_id, {
            razorpay_order_id: payRes.data.gateway_order_id || 'mock_order_id',
            razorpay_payment_id: `pay_${Date.now()}`,
            razorpay_signature: 'mock_signature'
          });
        }
      } catch (payErr) {
        console.warn('Auto-payment notice:', payErr);
      }

      const confirmedOrderData = {
        orderId: orderNumber,
        id: created.id,
        dateText: pickupSchedule.dateLabel || pickupSchedule.dateValue,
        timeText: pickupSchedule.timeSlot || '09:00 AM – 11:00 AM',
        addressTitle: pickupDetails.address,
        addressDetail: pickupDetails.landmark || '',
        services: serviceNames,
        items: created.items || finalItems,
        estimatedTotal: created.total_paise ? created.total_paise / 100 : total,
        status: 'PLACED',
        createdOrder: created
      };

      setLastOrder(confirmedOrderData);
      setActiveTrackingOrderId(created.id);

      // Clear selected items upon successful booking
      setSelectedItems({});
      try {
        sessionStorage.removeItem('fabricare_selected_clothing_items');
      } catch (e) {}

      setCurrentPage('confirmed');
      window.scrollTo({ top: 0, behavior: 'smooth' });

      return confirmedOrderData;
    } catch (err) {
      console.error('Order creation error:', err);
      const msg = err.response?.data?.detail || err.response?.data?.error || err.message || 'Failed to confirm pickup. Please try again.';
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
        lastOrder,
        setLastOrder,
        startBooking,
        confirmOrder,
        calculateTotal,
        allServices: servicesList,
        serviceCategories,
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
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};
