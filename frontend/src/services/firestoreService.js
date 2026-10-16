import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
const INITIAL_ORDERS = [];
const INITIAL_CUSTOMERS = [];
const INITIAL_SERVICES_ADMIN = [];
const INITIAL_DRIVERS = [];
const INITIAL_FAQS_ADMIN = [];

// ===============================================================
// ORDERS COLLECTION
// ===============================================================

/**
 * Realtime subscription to Orders
 */
export const subscribeOrders = (callback, errorCallback) => {
  if (!isFirebaseConfigured || !db) return () => {};
  try {
    const ordersCol = collection(db, 'orders');
    const q = query(ordersCol, orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const orderList = snapshot.docs.map(d => ({
          docId: d.id,
          ...d.data(),
          // Format date string for UI display if needed
          date: d.data().date || (d.data().createdAt?.toDate ? d.data().createdAt.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '23 Sep 2026')
        }));
        callback(orderList);
      },
      (err) => {
        console.warn('Orders snapshot subscription note:', err.message);
        if (errorCallback) errorCallback(err);
      }
    );
  } catch (err) {
    console.warn('Orders subscribe exception:', err);
    return () => {};
  }
};

/**
 * Create a new Order in Firestore
 */
export const createFirestoreOrder = async (orderData) => {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const orderId = orderData.id || `#LDX${Math.floor(1000 + Math.random() * 9000)}`;
    const orderDocRef = doc(db, 'orders', orderId);

    const newOrder = {
      id: orderId,
      customerId: orderData.customerId || 'guest',
      date: orderData.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      customer: {
        name: orderData.customer?.name || orderData.customerName || 'Customer',
        phone: orderData.customer?.phone || orderData.customerPhone || '+91 98765 43210',
        email: orderData.customer?.email || 'customer@gmail.com',
        avatar: orderData.customer?.avatar || 'CU',
        address: orderData.customer?.address || orderData.address || 'Banaswadi, Bengaluru - 560043'
      },
      services: orderData.services || orderData.selectedServices || ['Wash & Fold'],
      pickupTime: orderData.pickupTime || `${orderData.date || '23 Sep 2026'}, ${orderData.time || '09:00 AM – 11:00 AM'}`,
      amount: Number(orderData.amount) || 300,
      status: orderData.status || 'Pending Pickup',
      payment: orderData.payment || 'Paid',
      type: orderData.type || 'Pickup',
      driver: orderData.driver || 'Not Assigned',
      specialInstructions: orderData.specialInstructions || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(orderDocRef, newOrder);
    return newOrder;
  } catch (error) {
    console.error('Error creating order in Firestore:', error);
    throw error;
  }
};

/**
 * Update an order's status
 */
export const updateFirestoreOrderStatus = async (orderId, status) => {
  if (!isFirebaseConfigured || !db) return true;
  try {
    const orderDocRef = doc(db, 'orders', orderId);
    await updateDoc(orderDocRef, {
      status,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating order status in Firestore:', error);
    throw error;
  }
};

/**
 * Assign a driver to an order
 */
export const assignDriverToFirestoreOrder = async (orderId, driverName) => {
  if (!isFirebaseConfigured || !db) return true;
  try {
    const orderDocRef = doc(db, 'orders', orderId);
    await updateDoc(orderDocRef, {
      driver: driverName,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error assigning driver in Firestore:', error);
    throw error;
  }
};

// ===============================================================
// CUSTOMERS COLLECTION
// ===============================================================

/**
 * Realtime subscription to Customers
 */
export const subscribeCustomers = (callback, errorCallback) => {
  if (!isFirebaseConfigured || !db) return () => {};
  try {
    const customersCol = collection(db, 'customers');
    return onSnapshot(
      customersCol,
      (snapshot) => {
        const custList = snapshot.docs.map(d => ({
          docId: d.id,
          ...d.data()
        }));
        callback(custList);
      },
      (err) => {
        console.warn('Customers snapshot subscription note:', err.message);
        if (errorCallback) errorCallback(err);
      }
    );
  } catch (err) {
    console.warn('Customers subscribe exception:', err);
    return () => {};
  }
};

/**
 * Add a new customer to Firestore
 */
export const addFirestoreCustomer = async (customerData) => {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const customerId = customerData.id || `#CUS${Math.floor(1000 + Math.random() * 9000)}`;
    const customerDocRef = doc(db, 'customers', customerId);

    const newCustomer = {
      id: customerId,
      name: customerData.name || 'New Customer',
      phone: customerData.phone || '+91 98765 00000',
      email: customerData.email || 'customer@example.com',
      avatar: (customerData.name || 'NC').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
      location: customerData.area ? `${customerData.area}, Bengaluru ${customerData.pincode || ''}` : (customerData.location || 'Bengaluru'),
      totalOrders: Number(customerData.totalOrders) || 1,
      totalSpent: customerData.totalSpent || '₹0',
      status: customerData.status !== undefined ? (customerData.status ? 'Active' : 'Inactive') : 'Active',
      joinDate: 'Today',
      joinRelative: 'Just now',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(customerDocRef, newCustomer);
    return newCustomer;
  } catch (error) {
    console.error('Error adding customer to Firestore:', error);
    throw error;
  }
};

// ===============================================================
// SERVICES COLLECTION
// ===============================================================

/**
 * Realtime subscription to Services
 */
export const subscribeServices = (callback, errorCallback) => {
  if (!isFirebaseConfigured || !db) return () => {};
  try {
    const servicesCol = collection(db, 'services');
    return onSnapshot(
      servicesCol,
      (snapshot) => {
        const servList = snapshot.docs.map(d => ({
          docId: d.id,
          ...d.data()
        }));
        callback(servList);
      },
      (err) => {
        console.warn('Services snapshot subscription note:', err.message);
        if (errorCallback) errorCallback(err);
      }
    );
  } catch (err) {
    console.warn('Services subscribe exception:', err);
    return () => {};
  }
};

/**
 * Add a new service to Firestore
 */
export const addFirestoreService = async (serviceData) => {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const serviceId = String(serviceData.id || `srv_${Date.now()}`);
    const serviceDocRef = doc(db, 'services', serviceId);

    const newService = {
      id: serviceId,
      name: serviceData.name || 'New Service',
      description: serviceData.description || '',
      category: serviceData.category || 'Wash & Fold',
      price: Number(serviceData.price) || 150,
      turnaround: serviceData.turnaround || '1–2 days',
      status: serviceData.status ? 'Active' : 'Inactive',
      icon: serviceData.icon || 'Shirt',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(serviceDocRef, newService);
    return newService;
  } catch (error) {
    console.error('Error adding service to Firestore:', error);
    throw error;
  }
};

/**
 * Toggle a service's status in Firestore
 */
export const toggleFirestoreServiceStatus = async (serviceId, currentStatus) => {
  if (!isFirebaseConfigured || !db) return currentStatus === 'Active' ? 'Inactive' : 'Active';
  try {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    const serviceDocRef = doc(db, 'services', String(serviceId));
    await updateDoc(serviceDocRef, {
      status: newStatus,
      updatedAt: serverTimestamp()
    });
    return newStatus;
  } catch (error) {
    console.error('Error toggling service status in Firestore:', error);
    throw error;
  }
};

// ===============================================================
// DRIVERS COLLECTION
// ===============================================================

/**
 * Realtime subscription to Drivers
 */
export const subscribeDrivers = (callback, errorCallback) => {
  if (!isFirebaseConfigured || !db) return () => {};
  try {
    const driversCol = collection(db, 'drivers');
    return onSnapshot(
      driversCol,
      (snapshot) => {
        const driverList = snapshot.docs.map(d => ({
          docId: d.id,
          ...d.data()
        }));
        callback(driverList);
      },
      (err) => {
        console.warn('Drivers snapshot subscription note:', err.message);
        if (errorCallback) errorCallback(err);
      }
    );
  } catch (err) {
    console.warn('Drivers subscribe exception:', err);
    return () => {};
  }
};

// ===============================================================
// FAQS & CONTENT
// ===============================================================

/**
 * Realtime subscription to FAQs
 */
export const subscribeFaqs = (callback, errorCallback) => {
  if (!isFirebaseConfigured || !db) return () => {};
  try {
    const faqsCol = collection(db, 'faqs');
    return onSnapshot(
      faqsCol,
      (snapshot) => {
        const faqList = snapshot.docs.map(d => ({
          docId: d.id,
          ...d.data()
        }));
        callback(faqList);
      },
      (err) => {
        console.warn('FAQs snapshot subscription note:', err.message);
        if (errorCallback) errorCallback(err);
      }
    );
  } catch (err) {
    console.warn('FAQs subscribe exception:', err);
    return () => {};
  }
};

/**
 * Get or Save Terms & Conditions
 */
export const getFirestoreTerms = async () => {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const termsDocRef = doc(db, 'content', 'terms');
    const snapshot = await getDoc(termsDocRef);
    if (snapshot.exists()) {
      return snapshot.data();
    }
    return null;
  } catch (error) {
    console.error('Error fetching terms:', error);
    return null;
  }
};

export const saveFirestoreTerms = async (termsData) => {
  if (!isFirebaseConfigured || !db) return true;
  try {
    const termsDocRef = doc(db, 'content', 'terms');
    await setDoc(termsDocRef, {
      title: termsData.title || 'Terms & Conditions',
      body: termsData.body || '',
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error saving terms to Firestore:', error);
    throw error;
  }
};

// ===============================================================
// SETTINGS
// ===============================================================

/**
 * Get or Save General Settings
 */
export const getFirestoreSettings = async () => {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const settingsDocRef = doc(db, 'settings', 'general');
    const snapshot = await getDoc(settingsDocRef);
    if (snapshot.exists()) {
      return snapshot.data();
    }
    return null;
  } catch (error) {
    console.error('Error fetching settings:', error);
    return null;
  }
};

export const saveFirestoreSettings = async (settingsData) => {
  if (!isFirebaseConfigured || !db) return true;
  try {
    const settingsDocRef = doc(db, 'settings', 'general');
    await setDoc(settingsDocRef, {
      ...settingsData,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error saving settings to Firestore:', error);
    throw error;
  }
};

// ===============================================================
// SEEDING HELPER FOR INITIAL FIRST-LAUNCH
// ===============================================================

/**
 * Seeds initial services, FAQs, sample orders and drivers if collections are empty.
 */
export const seedInitialFirestoreData = async () => {
  if (!isFirebaseConfigured || !db) return false;
  try {
    // Check services
    const servicesSnap = await getDocs(collection(db, 'services'));
    if (servicesSnap.empty) {
      console.log('Seeding initial services to Cloud Firestore...');
      for (const serv of INITIAL_SERVICES_ADMIN) {
        await setDoc(doc(db, 'services', String(serv.id)), {
          ...serv,
          id: String(serv.id),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    }

    // Check FAQs
    const faqsSnap = await getDocs(collection(db, 'faqs'));
    if (faqsSnap.empty) {
      console.log('Seeding initial FAQs to Cloud Firestore...');
      for (const faq of INITIAL_FAQS_ADMIN) {
        await setDoc(doc(db, 'faqs', String(faq.id)), {
          ...faq,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    }

    // Check Drivers
    const driversSnap = await getDocs(collection(db, 'drivers'));
    if (driversSnap.empty) {
      console.log('Seeding initial Drivers to Cloud Firestore...');
      for (const driver of INITIAL_DRIVERS) {
        await setDoc(doc(db, 'drivers', driver.id), {
          ...driver,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    }

    // Check Customers
    const customersSnap = await getDocs(collection(db, 'customers'));
    if (customersSnap.empty) {
      console.log('Seeding initial Customers to Cloud Firestore...');
      for (const cust of INITIAL_CUSTOMERS) {
        await setDoc(doc(db, 'customers', cust.id), {
          ...cust,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    }

    // Check Orders
    const ordersSnap = await getDocs(collection(db, 'orders'));
    if (ordersSnap.empty) {
      console.log('Seeding initial Orders to Cloud Firestore...');
      for (const ord of INITIAL_ORDERS) {
        await setDoc(doc(db, 'orders', ord.id), {
          ...ord,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    }

    // Settings Doc
    const settingsSnap = await getDoc(doc(db, 'settings', 'general'));
    if (!settingsSnap.exists()) {
      await setDoc(doc(db, 'settings', 'general'), {
        name: 'Admin',
        email: 'admin@fabricare.com',
        phone: '+91 98765 43210',
        role: 'Administrator',
        supportEmail: 'support@fabricare.com',
        supportPhone: '+91 98765 43210',
        websiteUrl: 'https://www.fabricare.com',
        instagram: 'https://instagram.com/fabricare',
        facebook: 'https://facebook.com/fabricare',
        twitter: 'https://x.com/fabricare',
        linkedin: 'https://linkedin.com/company/fabricare',
        notifications: {
          newOrders: true,
          customerMessages: true,
          pickupDelivery: true,
          systemAnnouncements: false
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    return true;
  } catch (error) {
    console.warn('Initial seeding note (e.g. offline/rules restricted):', error.message);
    return false;
  }
};
