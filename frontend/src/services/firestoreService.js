import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';

// ===============================================================
// INITIAL SEED DATA FOR FIRST LAUNCH IN USER'S FIREBASE PROJECT
// ===============================================================

export const INITIAL_SERVICES_ADMIN = [
  {
    id: 'wash-fold',
    name: 'Wash & Fold',
    category: 'Wash & Fold',
    price: 120,
    pricePerKg: 60,
    turnaround: '24-48 hrs',
    status: 'Active',
    icon: 'Shirt',
    description: 'Everyday laundry washed with eco-friendly detergent, gently dried and neatly folded.'
  },
  {
    id: 'wash-iron',
    name: 'Wash & Iron',
    category: 'Wash & Iron',
    price: 180,
    pricePerKg: 90,
    turnaround: '24-48 hrs',
    status: 'Active',
    icon: 'Layers',
    description: 'Complete washing plus professional steam pressing. Ready to wear.'
  },
  {
    id: 'dry-cleaning',
    name: 'Dry Cleaning',
    category: 'Dry Clean',
    price: 220,
    turnaround: '48-72 hrs',
    status: 'Active',
    icon: 'Sparkles',
    description: 'Specialized chemical wash for delicate silk, wool, blazers, suits and party wear.'
  },
  {
    id: 'steam-iron',
    name: 'Steam Iron',
    category: 'Steam Iron',
    price: 60,
    turnaround: '12-24 hrs',
    status: 'Active',
    icon: 'Flame',
    description: 'Wrinkle-free steam pressing on premium hangers.'
  },
  {
    id: 'express-laundry',
    name: 'Express Laundry',
    category: 'Express',
    price: 200,
    turnaround: 'Same Day (12 hrs)',
    status: 'Active',
    icon: 'Zap',
    description: 'Priority rush turnaround returned spotless within 12-24 hours.'
  }
];

export const INITIAL_FAQS_ADMIN = [
  {
    id: 'faq-1',
    question: 'How does Laundrix pickup and delivery work?',
    answer: 'Schedule a pickup through our app or website. Our executive will arrive with specialized laundry bags and deliver clean clothes within 24-48 hours.',
    status: 'Active',
    displayOrder: 1
  },
  {
    id: 'faq-2',
    question: 'What areas do you service?',
    answer: 'We currently provide pickup and delivery services across Bengaluru including Indiranagar, Koramangala, Whitefield, HSR Layout, Banaswadi, and Malleshwaram.',
    status: 'Active',
    displayOrder: 2
  },
  {
    id: 'faq-3',
    question: 'What types of clothes do you clean?',
    answer: 'We clean all types of everyday and premium fabrics including cotton, silk, linen, wool, denim, party wear, suits, and curtains.',
    status: 'Active',
    displayOrder: 3
  },
  {
    id: 'faq-4',
    question: 'How long does the cleaning process take?',
    answer: 'Standard turnaround time is 1–2 days. Express services may be delivered within 24 hours.',
    status: 'Active',
    displayOrder: 4
  },
  {
    id: 'faq-5',
    question: 'How should I prepare my clothes for pickup?',
    answer: 'Please keep your clothes in a clean bag. You can also add special instructions for delicate items during booking.',
    status: 'Active',
    displayOrder: 5
  },
  {
    id: 'faq-6',
    question: 'What are the payment options?',
    answer: 'We accept online payments (UPI, cards, net banking) and cash on delivery (COD) upon inspection.',
    status: 'Active',
    displayOrder: 6
  },
  {
    id: 'faq-7',
    question: 'How can I track my order?',
    answer: 'You can track your order in real-time through our app or website with live SMS and WhatsApp status updates.',
    status: 'Active',
    displayOrder: 7
  },
  {
    id: 'faq-8',
    question: 'What if I am not satisfied with the service?',
    answer: 'Your satisfaction is our priority. If you are not happy with the service, we offer a 100% free re-wash guarantee.',
    status: 'Active',
    displayOrder: 8
  }
];

export const INITIAL_DRIVERS = [
  { id: 'd1', name: 'Ravi Kumar', phone: '+91 98765 43210', status: 'Available', ordersToday: 5, avatar: 'RK' },
  { id: 'd2', name: 'Arjun Singh', phone: '+91 87654 32109', status: 'Available', ordersToday: 4, avatar: 'AS' },
  { id: 'd3', name: 'Mohammed Taha', phone: '+91 91234 55678', status: 'Available', ordersToday: 3, avatar: 'MT' },
  { id: 'd4', name: 'Suresh Kumar', phone: '+91 99887 66554', status: 'On Delivery', ordersToday: 2, avatar: 'SK' },
  { id: 'd5', name: 'Praveen D', phone: '+91 98712 34567', status: 'Available', ordersToday: 4, avatar: 'PD' }
];

export const INITIAL_CUSTOMERS = [
  {
    id: '#CUS1001',
    name: 'Pratiksha Sharma',
    phone: '+91 98765 43220',
    email: 'customer@fabricare.com',
    avatar: 'PS',
    location: '100ft Road, Indiranagar, Bengaluru - 560038',
    totalOrders: 3,
    totalSpent: '₹1,450',
    status: 'Active',
    joinDate: '10 Oct 2026'
  },
  {
    id: '#CUS1002',
    name: 'Rohan Mehta',
    phone: '+91 98765 43210',
    email: 'rohan.mehta@gmail.com',
    avatar: 'RM',
    location: 'HRBR Layout, Banaswadi, Bengaluru - 560043',
    totalOrders: 5,
    totalSpent: '₹2,800',
    status: 'Active',
    joinDate: '01 Oct 2026'
  },
  {
    id: '#CUS1003',
    name: 'Pooja Hegde',
    phone: '+91 91234 56780',
    email: 'pooja.h@gmail.com',
    avatar: 'PH',
    location: '5th Block, Koramangala, Bengaluru - 560034',
    totalOrders: 2,
    totalSpent: '₹950',
    status: 'Active',
    joinDate: '05 Oct 2026'
  }
];

export const INITIAL_ORDERS = [
  {
    id: '#LDX10285',
    order_number: '#LDX10285',
    order_id: '#LDX10285',
    customerId: 'usr-cust-02',
    date: '17 Oct 2026',
    customer: {
      name: 'Rohan Mehta',
      phone: '+91 98765 43210',
      email: 'rohan.mehta@gmail.com',
      avatar: 'RM',
      address: 'House #12, 3rd Cross, HRBR Layout, Banaswadi, Bengaluru - 560043'
    },
    customer_name: 'Rohan Mehta',
    customer_phone: '+91 98765 43210',
    pickup_full_name: 'Rohan Mehta',
    pickup_phone: '+91 98765 43210',
    pickup_address: 'House #12, 3rd Cross, HRBR Layout, Banaswadi, Bengaluru - 560043',
    delivery_address: 'House #12, 3rd Cross, HRBR Layout, Banaswadi, Bengaluru - 560043',
    services: ['Wash & Fold', 'Steam Iron'],
    services_list: ['Wash & Fold', 'Steam Iron'],
    pickupTime: '17 Oct 2026, 09:00 AM – 11:00 AM',
    pickup_time_slot: '09:00 AM – 11:00 AM',
    pickup_date: '2026-10-17',
    amount: 540,
    total_amount: 540,
    status: 'Pending Pickup',
    status_display: 'Pending Pickup',
    payment: 'Paid',
    payment_status: 'PAID',
    type: 'Pickup',
    driver: 'Ravi Kumar',
    stage: 'incoming',
    specialInstructions: 'Handle silk shirts with extra care.',
    items: [
      { item_name: 'Cotton Shirt', quantity: 3, unit_price: 60, total_price: 180 },
      { item_name: 'Denim Trousers', quantity: 2, unit_price: 90, total_price: 180 },
      { item_name: 'Steam Iron Shirt', quantity: 3, unit_price: 60, total_price: 180 }
    ]
  },
  {
    id: '#LDX10286',
    order_number: '#LDX10286',
    order_id: '#LDX10286',
    customerId: 'usr-cust-01',
    date: '17 Oct 2026',
    customer: {
      name: 'Pratiksha Sharma',
      phone: '+91 98765 43220',
      email: 'customer@fabricare.com',
      avatar: 'PS',
      address: '100ft Road, Indiranagar, Bengaluru - 560038'
    },
    customer_name: 'Pratiksha Sharma',
    customer_phone: '+91 98765 43220',
    pickup_full_name: 'Pratiksha Sharma',
    pickup_phone: '+91 98765 43220',
    pickup_address: '100ft Road, Indiranagar, Bengaluru - 560038',
    delivery_address: '100ft Road, Indiranagar, Bengaluru - 560038',
    services: ['Dry Cleaning'],
    services_list: ['Dry Cleaning'],
    pickupTime: '16 Oct 2026, 02:00 PM – 04:00 PM',
    pickup_time_slot: '02:00 PM – 04:00 PM',
    pickup_date: '2026-10-16',
    amount: 660,
    total_amount: 660,
    status: 'In Cleaning',
    status_display: 'In Cleaning',
    payment: 'Paid',
    payment_status: 'PAID',
    type: 'Processing',
    driver: 'Arjun Singh',
    stage: 'washing',
    laundryNotes: 'Inspection passed, loaded in machine #2',
    items: [
      { item_name: 'Blazer Suit', quantity: 1, unit_price: 350, total_price: 350 },
      { item_name: 'Silk Saree', quantity: 1, unit_price: 310, total_price: 310 }
    ]
  },
  {
    id: '#LDX10287',
    order_number: '#LDX10287',
    order_id: '#LDX10287',
    customerId: 'usr-cust-03',
    date: '16 Oct 2026',
    customer: {
      name: 'Pooja Hegde',
      phone: '+91 91234 56780',
      email: 'pooja.h@gmail.com',
      avatar: 'PH',
      address: '5th Block, Koramangala, Bengaluru - 560034'
    },
    customer_name: 'Pooja Hegde',
    customer_phone: '+91 91234 56780',
    pickup_full_name: 'Pooja Hegde',
    pickup_phone: '+91 91234 56780',
    pickup_address: '5th Block, Koramangala, Bengaluru - 560034',
    delivery_address: '5th Block, Koramangala, Bengaluru - 560034',
    services: ['Wash & Iron'],
    services_list: ['Wash & Iron'],
    pickupTime: '15 Oct 2026, 10:00 AM – 12:00 PM',
    pickup_time_slot: '10:00 AM – 12:00 PM',
    pickup_date: '2026-10-15',
    amount: 480,
    total_amount: 480,
    status: 'Ready for Delivery',
    status_display: 'Ready for Delivery',
    payment: 'Paid',
    payment_status: 'PAID',
    type: 'Delivery',
    driver: 'Suresh Kumar',
    stage: 'ready',
    laundryNotes: 'QC passed, packed in protective dust cover',
    items: [
      { item_name: 'Casual Shirts', quantity: 4, unit_price: 60, total_price: 240 },
      { item_name: 'Cotton Pants', quantity: 2, unit_price: 120, total_price: 240 }
    ]
  }
];

export const INITIAL_TERMS_CONTENT = {
  title: 'Terms & Conditions',
  body: `1. Introduction\nWelcome to Laundrix. These Terms & Conditions govern your use of our website, mobile application and laundry services. By accessing our services, you agree to comply with and be bound by these terms.\n\n2. Services\nLaundrix provides professional laundry and dry cleaning services, including pickup and delivery. Service details, pricing and turnaround time may vary based on location and fabric type.`
};

export const INITIAL_SETTINGS = {
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
  }
};

// ===============================================================
// NORMALIZATION HELPERS
// ===============================================================

export const normalizeFirestoreOrder = (docData, docId) => {
  const d = docData || {};
  const idStr = String(d.id || docId || '');
  const orderCode = d.order_number || d.order_id || d.code || (idStr.startsWith('#') ? idStr : `#${idStr}`);

  // Safely extract customer name
  let custName = 'Customer';
  let custPhone = '';
  let custEmail = '';
  let custAddress = 'Bengaluru';
  let custAvatar = 'CU';

  if (typeof d.customer === 'object' && d.customer !== null) {
    custName = d.customer.name || d.customer_name || 'Customer';
    custPhone = d.customer.phone || d.customer_phone || '';
    custEmail = d.customer.email || d.customer_email || '';
    custAddress = d.customer.address || d.pickup_address || 'Bengaluru';
    custAvatar = d.customer.avatar || (custName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'CU');
  } else if (typeof d.customer === 'string') {
    custName = d.customer;
  } else if (d.customer_name) {
    custName = d.customer_name;
  }

  if (d.pickup_phone) custPhone = d.pickup_phone;
  if (d.pickup_address) custAddress = d.pickup_address;

  const totalAmount = Number(d.total_amount ?? d.amount ?? d.estimatedTotal ?? 0);

  // Status mapping
  let uiStatus = d.status_display || d.status || 'Pending Pickup';
  const rawStatus = String(d.status || '').toUpperCase();
  if (['PENDING', 'ACCEPTED', 'PICKUP_SCHEDULED', 'PICKUP_ASSIGNED', 'PLACED'].includes(rawStatus)) {
    uiStatus = 'Pending Pickup';
  } else if (['PICKED_UP', 'RECEIVED_AT_LAUNDRY', 'IN_PROCESS', 'WASHING', 'DRYING', 'IRONING', 'IN_CLEANING'].includes(rawStatus)) {
    uiStatus = 'In Cleaning';
  } else if (['QUALITY_CHECK', 'PACKED', 'READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY'].includes(rawStatus)) {
    uiStatus = 'Ready for Delivery';
  } else if (['DELIVERED', 'COMPLETED', 'CLOSED'].includes(rawStatus)) {
    uiStatus = 'Completed';
  }

  const servicesList = Array.isArray(d.services) && d.services.length > 0
    ? d.services
    : (Array.isArray(d.services_list) && d.services_list.length > 0 ? d.services_list : ['Wash & Fold']);

  const dateStr = d.date || (d.createdAt?.toDate ? d.createdAt.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Today');

  return {
    ...d,
    docId: docId || idStr,
    id: orderCode,
    order_number: orderCode,
    order_id: orderCode,
    code: orderCode,
    date: dateStr,
    dateText: d.dateText || dateStr,
    timeText: d.timeText || d.pickup_time_slot || d.pickupTime || '09:00 AM – 11:00 AM',
    pickupTime: d.pickupTime || `${dateStr}, ${d.pickup_time_slot || '09:00 AM – 11:00 AM'}`,
    pickup_time_slot: d.pickup_time_slot || '09:00 AM – 11:00 AM',
    pickup_date: d.pickup_date || dateStr,
    pickup_address: custAddress,
    delivery_address: d.delivery_address || custAddress,
    addressTitle: custAddress,
    addressDetail: d.landmark || '',
    customer: {
      name: custName,
      phone: custPhone,
      email: custEmail,
      address: custAddress,
      avatar: custAvatar
    },
    customerName: custName,
    customer_name: custName,
    customerPhone: custPhone,
    customer_phone: custPhone,
    pickup_full_name: custName,
    pickup_phone: custPhone,
    amount: totalAmount,
    total_amount: totalAmount,
    estimatedTotal: totalAmount,
    services: servicesList,
    services_list: servicesList,
    items: Array.isArray(d.items) ? d.items : [],
    itemsCount: d.itemsCount || (Array.isArray(d.items) ? d.items.reduce((s, it) => s + (Number(it.quantity) || 1), 0) : 1),
    status: uiStatus,
    status_display: uiStatus,
    raw_status: d.status,
    stage: d.stage || (uiStatus === 'Pending Pickup' ? 'incoming' : uiStatus === 'In Cleaning' ? 'washing' : 'ready'),
    payment: d.payment || 'Paid',
    payment_status: d.payment_status || 'PAID',
    driver: d.driver || 'Not Assigned',
    driver_name: d.driver || 'Not Assigned',
    type: d.type || 'Pickup',
    specialInstructions: d.specialInstructions || d.notes || ''
  };
};

// ===============================================================
// 1. ORDERS COLLECTION (CRUD & REAL-TIME)
// ===============================================================

/**
 * Realtime subscription to all orders in Firestore
 */
export const subscribeOrders = (callback, errorCallback) => {
  if (!isFirebaseConfigured || !db) return () => {};
  try {
    const ordersCol = collection(db, 'orders');
    return onSnapshot(
      ordersCol,
      (snapshot) => {
        const orderList = snapshot.docs.map(d => normalizeFirestoreOrder(d.data(), d.id));
        // Sort descending by date/time
        orderList.sort((a, b) => {
          const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return tB - tA;
        });
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
 * Realtime subscription to a single order by ID
 */
export const subscribeOrderById = (orderId, callback, errorCallback) => {
  if (!isFirebaseConfigured || !db || !orderId) return () => {};
  try {
    const rawId = String(orderId).trim();
    const cleanId = rawId.replace(/^#/, '');
    const withHash = `#${cleanId}`;

    // Real-time listener on orders collection matching ID
    const ordersCol = collection(db, 'orders');
    return onSnapshot(
      ordersCol,
      (snapshot) => {
        const foundDoc = snapshot.docs.find(d => {
          const docId = d.id;
          const data = d.data();
          const dId = String(data.id || '').replace(/^#/, '');
          const dNum = String(data.order_number || data.orderNumber || data.code || '').replace(/^#/, '');
          return (
            docId === rawId ||
            docId === withHash ||
            docId === cleanId ||
            dId === cleanId ||
            dNum === cleanId
          );
        });

        if (foundDoc) {
          callback(normalizeFirestoreOrder(foundDoc.data(), foundDoc.id));
        } else {
          callback(null);
        }
      },
      (err) => {
        console.warn('Order subscription error:', err.message);
        if (errorCallback) errorCallback(err);
      }
    );
  } catch (err) {
    console.warn('Order subscribe exception:', err);
    return () => {};
  }
};

/**
 * Fetch all orders once from Firestore
 */
export const getFirestoreOrders = async () => {
  if (!isFirebaseConfigured || !db) return [];
  try {
    const snapshot = await getDocs(collection(db, 'orders'));
    const list = snapshot.docs.map(d => normalizeFirestoreOrder(d.data(), d.id));
    return list;
  } catch (error) {
    console.error('Error fetching orders from Firestore:', error);
    return [];
  }
};

/**
 * Create a new Order in Firestore
 */
export const createFirestoreOrder = async (orderData) => {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const rawId = orderData.id || orderData.order_number || orderData.order_id;
    const orderId = rawId
      ? (String(rawId).startsWith('#') ? String(rawId) : `#${rawId}`)
      : `#LDX${Math.floor(10000 + Math.random() * 90000)}`;

    const orderDocRef = doc(db, 'orders', orderId);

    const custName = orderData.customer?.name || orderData.customerName || orderData.pickup_full_name || 'Customer';
    const custPhone = orderData.customer?.phone || orderData.customerPhone || orderData.pickup_phone || '+91 98765 43210';
    const custEmail = orderData.customer?.email || orderData.email || 'customer@gmail.com';
    const custAddress = orderData.customer?.address || orderData.pickup_address || orderData.address || 'Bengaluru';
    const totalAmount = Number(orderData.amount ?? orderData.total_amount ?? orderData.estimatedTotal ?? 300);

    const newOrder = {
      id: orderId,
      order_number: orderId,
      order_id: orderId,
      customerId: orderData.customerId || 'guest',
      date: orderData.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      customer: {
        name: custName,
        phone: custPhone,
        email: custEmail,
        avatar: (custName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'CU'),
        address: custAddress
      },
      customer_name: custName,
      customer_phone: custPhone,
      pickup_full_name: custName,
      pickup_phone: custPhone,
      pickup_address: custAddress,
      delivery_address: orderData.delivery_address || custAddress,
      services: orderData.services || orderData.selectedServices || orderData.services_list || ['Wash & Fold'],
      services_list: orderData.services || orderData.selectedServices || orderData.services_list || ['Wash & Fold'],
      items: Array.isArray(orderData.items) ? orderData.items : [],
      pickupTime: orderData.pickupTime || `${orderData.date || 'Today'}, ${orderData.pickup_time_slot || '09:00 AM – 11:00 AM'}`,
      pickup_time_slot: orderData.pickup_time_slot || '09:00 AM – 11:00 AM',
      pickup_date: orderData.pickup_date || new Date().toISOString().split('T')[0],
      amount: totalAmount,
      total_amount: totalAmount,
      estimatedTotal: totalAmount,
      status: orderData.status || 'Pending Pickup',
      status_display: orderData.status_display || orderData.status || 'Pending Pickup',
      stage: orderData.stage || 'incoming',
      payment: orderData.payment || 'Paid',
      payment_status: orderData.payment_status || 'PAID',
      type: orderData.type || 'Pickup',
      driver: orderData.driver || 'Not Assigned',
      driver_name: orderData.driver || 'Not Assigned',
      specialInstructions: orderData.specialInstructions || orderData.notes || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      history: [
        {
          status: orderData.status || 'Pending Pickup',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          note: 'Order placed successfully'
        }
      ]
    };

    await setDoc(orderDocRef, newOrder);
    return normalizeFirestoreOrder(newOrder, orderId);
  } catch (error) {
    console.error('Error creating order in Firestore:', error);
    throw error;
  }
};

/**
 * Update an order's status in Firestore
 */
export const updateFirestoreOrderStatus = async (orderId, status, extraFields = {}) => {
  if (!isFirebaseConfigured || !db || !orderId) return true;
  try {
    const rawId = String(orderId).trim();
    const cleanId = rawId.replace(/^#/, '');
    const candidateIds = [rawId, `#${cleanId}`, cleanId];

    const updatePayload = {
      status,
      status_display: status,
      updatedAt: serverTimestamp(),
      ...extraFields
    };

    if (extraFields.stage) {
      updatePayload.stage = extraFields.stage;
    }

    let updated = false;
    for (const cId of candidateIds) {
      try {
        const orderDocRef = doc(db, 'orders', cId);
        await updateDoc(orderDocRef, updatePayload);
        updated = true;
        break;
      } catch (err) {
        // try next
      }
    }

    if (!updated) {
      const q = query(collection(db, 'orders'), where('id', 'in', candidateIds));
      const qSnap = await getDocs(q);
      if (!qSnap.empty) {
        await updateDoc(qSnap.docs[0].ref, updatePayload);
        updated = true;
      }
    }

    return true;
  } catch (error) {
    console.error('Error updating order status in Firestore:', error);
    throw error;
  }
};

/**
 * Generic update for any order fields
 */
export const updateFirestoreOrder = async (orderId, updateFields) => {
  if (!isFirebaseConfigured || !db || !orderId) return true;
  try {
    const rawId = String(orderId).trim();
    const cleanId = rawId.replace(/^#/, '');
    const candidateIds = [rawId, `#${cleanId}`, cleanId];

    let updated = false;
    for (const cId of candidateIds) {
      try {
        const orderDocRef = doc(db, 'orders', cId);
        await updateDoc(orderDocRef, {
          ...updateFields,
          updatedAt: serverTimestamp()
        });
        updated = true;
        break;
      } catch (err) {
        // try next
      }
    }

    if (!updated) {
      const q = query(collection(db, 'orders'), where('id', 'in', candidateIds));
      const qSnap = await getDocs(q);
      if (!qSnap.empty) {
        await updateDoc(qSnap.docs[0].ref, {
          ...updateFields,
          updatedAt: serverTimestamp()
        });
        updated = true;
      }
    }

    return true;
  } catch (error) {
    console.error('Error updating order in Firestore:', error);
    throw error;
  }
};

/**
 * Cancel an order in Firestore
 */
export const cancelFirestoreOrder = async (orderId, reason = 'Cancelled by user') => {
  return updateFirestoreOrderStatus(orderId, 'Cancelled', {
    cancelReason: reason,
    cancelledAt: serverTimestamp()
  });
};

/**
 * Assign a driver to an order
 */
export const assignDriverToFirestoreOrder = async (orderId, driverName, driverPhone = '') => {
  return updateFirestoreOrderStatus(orderId, 'Pending Pickup', {
    driver: driverName,
    driver_name: driverName,
    driver_phone: driverPhone,
    status: 'Pending Pickup'
  });
};

// ===============================================================
// 2. CUSTOMERS COLLECTION (CRUD & REAL-TIME)
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

export const getFirestoreCustomers = async () => {
  if (!isFirebaseConfigured || !db) return [];
  try {
    const snapshot = await getDocs(collection(db, 'customers'));
    return snapshot.docs.map(d => ({ docId: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
};

export const addFirestoreCustomer = async (customerData) => {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const customerId = customerData.id || `#CUS${Math.floor(1000 + Math.random() * 9000)}`;
    const customerDocRef = doc(db, 'customers', customerId);

    const name = customerData.name || 'New Customer';
    const newCustomer = {
      id: customerId,
      name,
      phone: customerData.phone || '+91 98765 00000',
      email: customerData.email || 'customer@example.com',
      avatar: (name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'CU'),
      location: customerData.area ? `${customerData.area}, Bengaluru ${customerData.pincode || ''}` : (customerData.location || 'Bengaluru'),
      totalOrders: Number(customerData.totalOrders) || 0,
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

export const updateFirestoreCustomerStatus = async (customerId, isActive) => {
  if (!isFirebaseConfigured || !db) return true;
  try {
    const customerDocRef = doc(db, 'customers', String(customerId));
    await updateDoc(customerDocRef, {
      status: isActive ? 'Active' : 'Blocked',
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating customer status:', error);
    throw error;
  }
};

// ===============================================================
// 3. SERVICES CATALOG COLLECTION (CRUD & REAL-TIME)
// ===============================================================

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

export const getFirestoreServices = async () => {
  if (!isFirebaseConfigured || !db) return [];
  try {
    const snapshot = await getDocs(collection(db, 'services'));
    return snapshot.docs.map(d => ({ docId: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error fetching services:', error);
    return [];
  }
};

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
// 4. DRIVERS COLLECTION (CRUD & REAL-TIME)
// ===============================================================

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

export const getFirestoreDrivers = async () => {
  if (!isFirebaseConfigured || !db) return [];
  try {
    const snapshot = await getDocs(collection(db, 'drivers'));
    return snapshot.docs.map(d => ({ docId: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error fetching drivers:', error);
    return [];
  }
};

export const updateFirestoreDriverStatus = async (driverId, status) => {
  if (!isFirebaseConfigured || !db) return true;
  try {
    const driverDocRef = doc(db, 'drivers', String(driverId));
    await updateDoc(driverDocRef, {
      status,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating driver status:', error);
    throw error;
  }
};

// ===============================================================
// 5. FAQS COLLECTION (CRUD & REAL-TIME)
// ===============================================================

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
        faqList.sort((a, b) => (Number(a.displayOrder || 99) - Number(b.displayOrder || 99)));
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

export const getFirestoreFaqs = async () => {
  if (!isFirebaseConfigured || !db) return INITIAL_FAQS_ADMIN;
  try {
    const snapshot = await getDocs(collection(db, 'faqs'));
    if (snapshot.empty) return INITIAL_FAQS_ADMIN;
    const list = snapshot.docs.map(d => ({ docId: d.id, ...d.data() }));
    list.sort((a, b) => (Number(a.displayOrder || 99) - Number(b.displayOrder || 99)));
    return list;
  } catch (err) {
    console.error('Error fetching FAQs:', err);
    return INITIAL_FAQS_ADMIN;
  }
};

export const saveFirestoreFaqs = async (faqsList) => {
  if (!isFirebaseConfigured || !db || !Array.isArray(faqsList)) return true;
  try {
    for (const faq of faqsList) {
      const faqId = String(faq.id || `faq-${Date.now()}`);
      await setDoc(doc(db, 'faqs', faqId), {
        ...faq,
        id: faqId,
        updatedAt: serverTimestamp()
      });
    }
    return true;
  } catch (error) {
    console.error('Error saving FAQs to Firestore:', error);
    throw error;
  }
};

// ===============================================================
// 6. CONTENT & TERMS (FIRESTORE)
// ===============================================================

export const getFirestoreTerms = async () => {
  if (!isFirebaseConfigured || !db) return INITIAL_TERMS_CONTENT;
  try {
    const termsDocRef = doc(db, 'content', 'terms');
    const snapshot = await getDoc(termsDocRef);
    if (snapshot.exists()) {
      return snapshot.data();
    }
    // If not exists, save default terms into Firestore
    await setDoc(termsDocRef, {
      ...INITIAL_TERMS_CONTENT,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return INITIAL_TERMS_CONTENT;
  } catch (error) {
    console.error('Error fetching terms:', error);
    return INITIAL_TERMS_CONTENT;
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
// 7. SETTINGS (FIRESTORE)
// ===============================================================

export const getFirestoreSettings = async () => {
  if (!isFirebaseConfigured || !db) return INITIAL_SETTINGS;
  try {
    const settingsDocRef = doc(db, 'settings', 'general');
    const snapshot = await getDoc(settingsDocRef);
    if (snapshot.exists()) {
      return snapshot.data();
    }
    await setDoc(settingsDocRef, {
      ...INITIAL_SETTINGS,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return INITIAL_SETTINGS;
  } catch (error) {
    console.error('Error fetching settings:', error);
    return INITIAL_SETTINGS;
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
// 8. NOTIFICATIONS & COMPLAINTS & TICKETS & USERS
// ===============================================================

export const subscribeNotifications = (callback, errorCallback) => {
  if (!isFirebaseConfigured || !db) return () => {};
  try {
    const notifsCol = collection(db, 'notifications');
    return onSnapshot(
      notifsCol,
      (snapshot) => {
        const notifList = snapshot.docs.map(d => ({
          docId: d.id,
          ...d.data()
        }));
        callback(notifList);
      },
      (err) => {
        console.warn('Notifications note:', err.message);
        if (errorCallback) errorCallback(err);
      }
    );
  } catch (err) {
    console.warn('Notifications subscribe exception:', err);
    return () => {};
  }
};

export const getFirestoreNotifications = async () => {
  if (!isFirebaseConfigured || !db) return [];
  try {
    const snapshot = await getDocs(collection(db, 'notifications'));
    return snapshot.docs.map(d => ({ docId: d.id, ...d.data() }));
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return [];
  }
};

export const addFirestoreNotification = async (notifData) => {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const notifId = notifData.id || `notif_${Date.now()}`;
    const docRef = doc(db, 'notifications', notifId);
    const newNotif = {
      id: notifId,
      title: notifData.title || 'New Notification',
      message: notifData.message || '',
      type: notifData.type || 'info',
      unread: true,
      time: 'Just now',
      createdAt: serverTimestamp()
    };
    await setDoc(docRef, newNotif);
    return newNotif;
  } catch (error) {
    console.error('Error adding notification:', error);
    throw error;
  }
};

export const subscribeComplaints = (callback, errorCallback) => {
  if (!isFirebaseConfigured || !db) return () => {};
  try {
    const compCol = collection(db, 'complaints');
    return onSnapshot(
      compCol,
      (snapshot) => {
        const list = snapshot.docs.map(d => ({
          docId: d.id,
          ...d.data()
        }));
        callback(list);
      },
      (err) => {
        console.warn('Complaints snapshot note:', err.message);
        if (errorCallback) errorCallback(err);
      }
    );
  } catch (err) {
    console.warn('Complaints subscribe exception:', err);
    return () => {};
  }
};

export const getFirestoreComplaints = async () => {
  if (!isFirebaseConfigured || !db) return [];
  try {
    const snapshot = await getDocs(collection(db, 'complaints'));
    return snapshot.docs.map(d => ({ docId: d.id, ...d.data() }));
  } catch (err) {
    console.error('Error fetching complaints:', err);
    return [];
  }
};

export const addFirestoreComplaint = async (complaintData) => {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const cId = complaintData.id || `comp_${Date.now()}`;
    const docRef = doc(db, 'complaints', cId);
    const newComp = {
      id: cId,
      ticket_number: complaintData.ticket_number || `#CMP-${Math.floor(1000 + Math.random() * 9000)}`,
      order_id: complaintData.order_id || '#FC10284',
      customer_name: complaintData.customer_name || 'Customer',
      issue_type: complaintData.issue_type || 'General Query',
      description: complaintData.description || complaintData.notes || '',
      status: complaintData.status || 'Pending',
      priority: complaintData.priority || 'Normal',
      created_at: new Date().toISOString(),
      updatedAt: serverTimestamp()
    };
    await setDoc(docRef, newComp);
    return newComp;
  } catch (err) {
    console.error('Error adding complaint:', err);
    throw err;
  }
};

// ===============================================================
// 8B. SUPPORT TICKETS
// ===============================================================

export const subscribeTickets = (callback, errorCallback) => {
  if (!isFirebaseConfigured || !db) return () => {};
  try {
    const ticketsCol = collection(db, 'support_tickets');
    return onSnapshot(
      ticketsCol,
      (snapshot) => {
        const list = snapshot.docs.map(d => ({
          docId: d.id,
          ...d.data()
        }));
        callback(list);
      },
      (err) => {
        console.warn('Tickets subscription note:', err.message);
        if (errorCallback) errorCallback(err);
      }
    );
  } catch (err) {
    console.warn('Tickets subscribe exception:', err);
    return () => {};
  }
};

export const getFirestoreTickets = async () => {
  if (!isFirebaseConfigured || !db) return [];
  try {
    const snapshot = await getDocs(collection(db, 'support_tickets'));
    return snapshot.docs.map(d => ({ docId: d.id, ...d.data() }));
  } catch (err) {
    console.error('Error fetching tickets:', err);
    return [];
  }
};

export const createFirestoreTicket = async (ticketData) => {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const ticketId = ticketData.id || `tkt_${Date.now()}`;
    const docRef = doc(db, 'support_tickets', ticketId);
    const newTicket = {
      id: ticketId,
      ticket_number: ticketData.ticket_number || `#TKT-${Math.floor(1000 + Math.random() * 9000)}`,
      subject: ticketData.subject || ticketData.title || 'Support Request',
      description: ticketData.description || ticketData.message || '',
      order_id: ticketData.order_id || null,
      status: ticketData.status || 'OPEN',
      priority: ticketData.priority || 'MEDIUM',
      messages: ticketData.messages || [
        {
          sender: 'customer',
          text: ticketData.description || ticketData.message || 'Support Request created',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date().toISOString()
        }
      ],
      created_at: new Date().toISOString(),
      updatedAt: serverTimestamp()
    };
    await setDoc(docRef, newTicket);
    return newTicket;
  } catch (err) {
    console.error('Error creating ticket:', err);
    throw err;
  }
};

export const replyFirestoreTicket = async (ticketId, message) => {
  if (!isFirebaseConfigured || !db || !ticketId) return null;
  try {
    const docRef = doc(db, 'support_tickets', String(ticketId));
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    const current = snap.data();
    const messages = Array.isArray(current.messages) ? current.messages : [];
    const newMsg = {
      sender: message.sender || 'support',
      text: message.text || message.message || String(message),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toISOString()
    };
    messages.push(newMsg);
    await updateDoc(docRef, {
      messages,
      updatedAt: serverTimestamp()
    });
    return { ...current, messages };
  } catch (err) {
    console.error('Error replying to ticket:', err);
    throw err;
  }
};

export const updateFirestoreTicketStatus = async (ticketId, status) => {
  if (!isFirebaseConfigured || !db || !ticketId) return true;
  try {
    const docRef = doc(db, 'support_tickets', String(ticketId));
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (err) {
    console.error('Error updating ticket status:', err);
    throw err;
  }
};

// ===============================================================
// 8C. USERS (FIRESTORE)
// ===============================================================

export const getFirestoreUsers = async () => {
  if (!isFirebaseConfigured || !db) return [];
  try {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map(d => ({ docId: d.id, ...d.data() }));
  } catch (err) {
    console.error('Error fetching users:', err);
    return [];
  }
};

export const createFirestoreUser = async (userData) => {
  if (!isFirebaseConfigured || !db) return null;
  try {
    const userId = userData.uid || userData.id || `usr_${Date.now()}`;
    const docRef = doc(db, 'users', userId);
    const newUser = {
      id: userId,
      uid: userId,
      email: userData.email || '',
      fullName: userData.fullName || userData.name || `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'User',
      phone: userData.phone || '',
      role: (userData.role || 'customer').toLowerCase(),
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      city: userData.city || 'Bengaluru',
      createdAt: new Date().toISOString(),
      updatedAt: serverTimestamp()
    };
    await setDoc(docRef, newUser, { merge: true });
    return newUser;
  } catch (err) {
    console.error('Error creating user:', err);
    throw err;
  }
};

export const updateFirestoreUser = async (userId, updateData) => {
  if (!isFirebaseConfigured || !db || !userId) return true;
  try {
    const docRef = doc(db, 'users', String(userId));
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (err) {
    console.error('Error updating user:', err);
    throw err;
  }
};

// ===============================================================
// 8D. SAVED ADDRESSES (FIRESTORE)
// ===============================================================

export const getUserAddresses = async (userId) => {
  if (!isFirebaseConfigured || !db || !userId) return [];
  try {
    const userDocRef = doc(db, 'users', String(userId));
    const snap = await getDoc(userDocRef);
    if (snap.exists() && snap.data().addresses) {
      return Object.values(snap.data().addresses);
    }
    return [
      { id: 'addr_default', title: 'Home', label: 'Home', line1: '100ft Road, Indiranagar', city: 'Bengaluru', pincode: '560038', is_default: true }
    ];
  } catch (err) {
    console.error('Error fetching addresses:', err);
    return [];
  }
};

export const addUserAddress = async (userId, addressData) => {
  if (!isFirebaseConfigured || !db || !userId) return null;
  try {
    const userDocRef = doc(db, 'users', String(userId));
    const snap = await getDoc(userDocRef);
    const addrId = addressData.id || `addr_${Date.now()}`;
    const newAddr = {
      id: addrId,
      title: addressData.label || addressData.title || 'Home',
      label: addressData.label || addressData.title || 'Home',
      line1: addressData.line1 || addressData.address_line || 'Bengaluru',
      city: addressData.city || 'Bengaluru',
      pincode: addressData.pincode || '560038',
      is_default: Boolean(addressData.is_default)
    };
    const currentAddresses = snap.exists() && snap.data().addresses ? { ...snap.data().addresses } : {};
    currentAddresses[addrId] = newAddr;
    await setDoc(userDocRef, { addresses: currentAddresses, updatedAt: serverTimestamp() }, { merge: true });
    return newAddr;
  } catch (err) {
    console.error('Error adding address:', err);
    throw err;
  }
};

export const updateUserAddress = async (userId, addressId, addressData) => {
  if (!isFirebaseConfigured || !db || !userId) return null;
  try {
    const userDocRef = doc(db, 'users', String(userId));
    const snap = await getDoc(userDocRef);
    if (!snap.exists()) return null;
    const currentAddresses = snap.data().addresses || {};
    currentAddresses[addressId] = {
      ...(currentAddresses[addressId] || {}),
      ...addressData,
      id: addressId
    };
    await updateDoc(userDocRef, { addresses: currentAddresses, updatedAt: serverTimestamp() });
    return currentAddresses[addressId];
  } catch (err) {
    console.error('Error updating address:', err);
    throw err;
  }
};

export const deleteUserAddress = async (userId, addressId) => {
  if (!isFirebaseConfigured || !db || !userId) return true;
  try {
    const userDocRef = doc(db, 'users', String(userId));
    const snap = await getDoc(userDocRef);
    if (!snap.exists()) return true;
    const currentAddresses = snap.data().addresses || {};
    delete currentAddresses[addressId];
    await updateDoc(userDocRef, { addresses: currentAddresses, updatedAt: serverTimestamp() });
    return true;
  } catch (err) {
    console.error('Error deleting address:', err);
    throw err;
  }
};

// ===============================================================
// 9. AUTOMATIC SEEDING ON APP STARTUP
// ===============================================================

/**
 * Seeds initial services, FAQs, orders, drivers, customers, and settings
 * into the user's Firebase project if empty.
 */
export const seedInitialFirestoreData = async () => {
  if (!isFirebaseConfigured || !db) return false;
  try {
    // 1. Check services
    const servicesSnap = await getDocs(collection(db, 'services'));
    if (servicesSnap.empty) {
      console.log('Seeding initial Services to Cloud Firestore project fabric-care-1f384...');
      for (const serv of INITIAL_SERVICES_ADMIN) {
        await setDoc(doc(db, 'services', String(serv.id)), {
          ...serv,
          id: String(serv.id),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    }

    // 2. Check FAQs
    const faqsSnap = await getDocs(collection(db, 'faqs'));
    if (faqsSnap.empty) {
      console.log('Seeding initial FAQs to Cloud Firestore project fabric-care-1f384...');
      for (const faq of INITIAL_FAQS_ADMIN) {
        await setDoc(doc(db, 'faqs', String(faq.id)), {
          ...faq,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    }

    // 3. Check Drivers
    const driversSnap = await getDocs(collection(db, 'drivers'));
    if (driversSnap.empty) {
      console.log('Seeding initial Drivers to Cloud Firestore project fabric-care-1f384...');
      for (const driver of INITIAL_DRIVERS) {
        await setDoc(doc(db, 'drivers', driver.id), {
          ...driver,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    }

    // 4. Check Customers
    const customersSnap = await getDocs(collection(db, 'customers'));
    if (customersSnap.empty) {
      console.log('Seeding initial Customers to Cloud Firestore project fabric-care-1f384...');
      for (const cust of INITIAL_CUSTOMERS) {
        await setDoc(doc(db, 'customers', cust.id), {
          ...cust,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    }

    // 5. Check Orders
    const ordersSnap = await getDocs(collection(db, 'orders'));
    if (ordersSnap.empty) {
      console.log('Seeding initial Orders to Cloud Firestore project fabric-care-1f384...');
      for (const ord of INITIAL_ORDERS) {
        await setDoc(doc(db, 'orders', ord.id), {
          ...ord,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    }

    // 6. Settings Doc
    const settingsSnap = await getDoc(doc(db, 'settings', 'general'));
    if (!settingsSnap.exists()) {
      await setDoc(doc(db, 'settings', 'general'), {
        ...INITIAL_SETTINGS,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    // 7. Terms Doc
    const termsSnap = await getDoc(doc(db, 'content', 'terms'));
    if (!termsSnap.exists()) {
      await setDoc(doc(db, 'content', 'terms'), {
        ...INITIAL_TERMS_CONTENT,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    return true;
  } catch (error) {
    console.warn('Initial Firestore seeding note:', error.message);
    return false;
  }
};
