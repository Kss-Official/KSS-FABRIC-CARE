import React, { createContext, useContext, useState, useEffect } from 'react';
import { createFirestoreOrder, subscribeServices } from '../services/firestoreService';
import { servicesApi, ordersApi, addressApi } from '../api/apiClient';
import { useAuth } from './AuthContext';
import { INITIAL_SERVICES } from '../constants/servicesConstants';
import { PRICING_CATEGORIES, PRICING_SUBCATEGORIES, PRICING_ITEMS } from '../data/pricingData';

const BookingContext = createContext();

export { INITIAL_SERVICES };

export const BookingProvider = ({ children }) => {
  const { currentUser, userProfile, isAuthenticated } = useAuth();

  // Navigation State: 'home' | 'about' | 'services' | 'why-us' | 'pricing' | 'how-it-works' | 'booking' | 'confirmed' | 'admin' | 'customer-*' | 'delivery-portal' | 'laundry-portal'
  const getInitialPage = () => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase();
      if (hash) return hash;
    }
    return 'home';
  };

  const [currentPage, setCurrentPage] = useState(getInitialPage);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = (window.location.hash || '').replace(/^#\/?/, '').trim().toLowerCase();
      if (hash) {
        setCurrentPage(hash);
      } else {
        setCurrentPage('home');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const [selectedServiceDetail, setSelectedServiceDetail] = useState('dry-cleaning');
  const [servicesList, setServicesList] = useState(INITIAL_SERVICES);
  const [serviceCategories, setServiceCategories] = useState([]);
  const [activeTrackingOrderId, setActiveTrackingOrderId] = useState(null);

  // Booking Flow State
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState(['wash-fold', 'dry-cleaning']);
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
  };

  const selectedItemsList = Object.values(selectedItems);
  const totalItemsCount = selectedItemsList.reduce((sum, it) => sum + it.quantity, 0);

  const calculateItemsTotal = () => {
    return selectedItemsList.reduce((sum, it) => sum + (it.unitPrice * it.quantity), 0);
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

  const navigateTo = (page, idParam = null) => {
    const cleanPage = String(page || 'home').replace(/^#\/?/, '').trim().toLowerCase();
    setCurrentPage(cleanPage);
    if (typeof window !== 'undefined') {
      window.location.hash = cleanPage;
    }
    if (cleanPage === 'customer-track' && idParam) {
      setActiveTrackingOrderId(idParam);
    } else if (cleanPage === 'services' && idParam) {
      setSelectedServiceDetail(idParam);
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
      // Build itemized payload for Django backend OrderItem creation
      const itemsPayload = selectedItemsList.map(it => ({
        item_name: it.name,
        service_category: it.categoryName || it.categoryId,
        quantity: it.quantity,
        unit_price: it.unitPrice,
        total_price: it.unitPrice * it.quantity
      }));

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

      // Ensure valid YYYY-MM-DD date format
      let formattedPickupDate = pickupSchedule.dateValue;
      if (!formattedPickupDate || !/^\d{4}-\d{2}-\d{2}$/.test(formattedPickupDate)) {
        try {
          const parsed = new Date(pickupSchedule.dateValue || pickupSchedule.dateLabel);
          if (!isNaN(parsed.getTime())) {
            formattedPickupDate = parsed.toISOString().split('T')[0];
          } else {
            formattedPickupDate = new Date().toISOString().split('T')[0];
          }
        } catch {
          formattedPickupDate = new Date().toISOString().split('T')[0];
        }
      }

      // Real Django REST API order payload
      const orderPayload = {
        pickup_full_name: currentUser?.displayName || currentUser?.full_name || pickupDetails.name || 'Valued Customer',
        pickup_phone: currentUser?.phoneNumber || currentUser?.phone || pickupDetails.mobile || '+91 98765 43210',
        pickup_address: pickupDetails.address || 'Banaswadi, Bengaluru - 560043',
        pickup_city: pickupDetails.city || 'Bengaluru',
        pickup_pincode: pickupDetails.pincode || '560043',
        pickup_date: formattedPickupDate,
        pickup_time_slot: pickupSchedule.timeSlot || '9:00 AM – 11:00 AM',
        special_instructions: specialInstructions || '',
        delivery_address: pickupDetails.sameAddressDelivery ? pickupDetails.address : (pickupDetails.deliveryAddress || pickupDetails.address),
        total_amount: total,
        services_list: serviceNames,
        items: itemsPayload
      };

      const res = await ordersApi.createOrder(orderPayload);
      const created = res.data;
      const orderNumber = created.order_number || created.order_id || `#FC${created.id}`;

      const confirmedOrderData = {
        orderId: orderNumber,
        id: created.id,
        dateText: pickupSchedule.dateLabel || pickupSchedule.dateValue,
        timeText: pickupSchedule.timeSlot,
        addressTitle: pickupDetails.address,
        addressDetail: pickupDetails.landmark || '',
        services: serviceNames,
        items: created.items && created.items.length > 0 ? created.items : itemsPayload,
        estimatedTotal: total,
        status: created.status || 'PENDING_REVIEW',
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

      // Secondary sync to Cloud Firestore if configured
      try {
        await createFirestoreOrder({
          ...confirmedOrderData,
          customerId: currentUser?.id || currentUser?.uid
        });
      } catch (fbErr) {
        console.warn('Firestore sync notice:', fbErr.message);
      }
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
        calculateItemsTotal,
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
