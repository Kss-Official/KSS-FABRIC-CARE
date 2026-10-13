import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  subscribeOrders,
  createFirestoreOrder,
  updateFirestoreOrderStatus,
  assignDriverToFirestoreOrder,
  subscribeCustomers,
  addFirestoreCustomer,
  subscribeServices,
  addFirestoreService,
  toggleFirestoreServiceStatus,
  subscribeDrivers,
  subscribeFaqs,
  getFirestoreTerms,
  saveFirestoreTerms,
  getFirestoreSettings,
  saveFirestoreSettings,
  seedInitialFirestoreData
} from '../services/firestoreService';

const AdminContext = createContext();

export const INITIAL_ORDERS = [
  {
    id: '#LDX10284',
    date: '23 Sep 2026',
    customer: {
      name: 'Rohan Mehta',
      phone: '+91 98765 43210',
      email: 'rohan.mehta@gmail.com',
      avatar: 'RM',
      address: 'Banaswadi, Bengaluru - 560043'
    },
    services: ['Wash & Fold'],
    pickupTime: '23 Sep, 9:00 AM',
    amount: 320,
    status: 'Pickup Scheduled',
    payment: 'Paid',
    type: 'Pickup',
    driver: 'Ravi Kumar (+91 98765 43210)'
  },
  {
    id: '#LDX10285',
    date: '23 Sep 2026',
    customer: {
      name: 'Priya Sharma',
      phone: '+91 99876 54321',
      email: 'priya.sharma@gmail.com',
      avatar: 'PS',
      address: 'House #45, 3rd Cross, HRBR Layout, Bengaluru - 560043'
    },
    services: ['Dry Cleaning'],
    pickupTime: '23 Sep, 10:00 AM',
    amount: 560,
    status: 'Pending Pickup',
    payment: 'Paid',
    type: 'Pickup',
    driver: 'Not Assigned'
  },
  {
    id: '#LDX10286',
    date: '23 Sep 2026',
    customer: {
      name: 'Arjun Nair',
      phone: '+91 91234 56789',
      email: 'arjun.nair@gmail.com',
      avatar: 'AN',
      address: 'Indiranagar, Bengaluru - 560038'
    },
    services: ['Wash & Iron'],
    pickupTime: '23 Sep, 11:00 AM',
    amount: 420,
    status: 'In Cleaning',
    payment: 'COD',
    type: 'Delivery',
    driver: 'Ravi Kumar (+91 98765 43210)'
  },
  {
    id: '#LDX10287',
    date: '23 Sep 2026',
    customer: {
      name: 'Sneha Reddy',
      phone: '+91 99887 66554',
      email: 'sneha.reddy@gmail.com',
      avatar: 'SR',
      address: 'Whitefield, Bengaluru - 560066'
    },
    services: ['Home Care'],
    pickupTime: '23 Sep, 2:00 PM',
    amount: 780,
    status: 'Ready for Delivery',
    payment: 'Paid',
    type: 'Pickup',
    driver: 'Arjun Singh (+91 87654 32109)'
  },
  {
    id: '#LDX10288',
    date: '23 Sep 2026',
    customer: {
      name: 'Karan Verma',
      phone: '+91 98712 34567',
      email: 'karan.verma@gmail.com',
      avatar: 'KV',
      address: 'Marathahalli, Bengaluru - 560037'
    },
    services: ['Shoe Laundry'],
    pickupTime: '23 Sep, 3:00 PM',
    amount: 350,
    status: 'Delivered',
    payment: 'Paid',
    type: 'Delivery',
    driver: 'Ravi Kumar (+91 98765 43210)'
  },
  {
    id: '#LDX10289',
    date: '23 Sep 2026',
    customer: {
      name: 'Neha Kapoor',
      phone: '+91 87654 32109',
      email: 'neha.kapoor@gmail.com',
      avatar: 'NK',
      address: 'HSR Layout, Bengaluru - 560102'
    },
    services: ['Steam Iron'],
    pickupTime: '23 Sep, 4:00 PM',
    amount: 280,
    status: 'In Cleaning',
    payment: 'Unpaid',
    type: 'Pickup',
    driver: 'Arjun Singh (+91 87654 32109)'
  },
  {
    id: '#LDX1284',
    date: '23 Sep 2026',
    customer: {
      name: 'Amit Shah',
      phone: '+91 91234 99876',
      email: 'amit.shah@gmail.com',
      avatar: 'AM',
      address: 'Koramangala, Bengaluru - 560034'
    },
    services: ['Wash & Fold', 'Wash & Iron', 'Steam Iron'],
    pickupTime: '23 Sep, 05:00 PM – 07:00 PM',
    amount: 620,
    status: 'Ready for Delivery',
    payment: 'Paid',
    type: 'Delivery',
    driver: 'Not Assigned'
  },
  {
    id: '#LDX1283',
    date: '23 Sep 2026',
    customer: {
      name: 'Deepak Reddy',
      phone: '+91 99887 62345',
      email: 'deepak.reddy@gmail.com',
      avatar: 'DP',
      address: 'Jayanagar, Bengaluru - 560011'
    },
    services: ['Dry Cleaning'],
    pickupTime: '23 Sep, 06:00 PM – 08:00 PM',
    amount: 310,
    status: 'Completed',
    payment: 'Paid',
    type: 'Pickup',
    driver: 'Ravi Kumar (+91 98765 43210)'
  },
  {
    id: '#LDX1282',
    date: '23 Sep 2026',
    customer: {
      name: 'Kavya T',
      phone: '+91 93456 78912',
      email: 'kavya.t@gmail.com',
      avatar: 'KT',
      address: 'Malleshwaram, Bengaluru - 560003'
    },
    services: ['Wash & Iron'],
    pickupTime: '23 Sep, 07:00 PM – 09:00 PM',
    amount: 400,
    status: 'In Cleaning',
    payment: 'COD',
    type: 'Delivery',
    driver: 'Mohammed Taha (+91 91234 55678)'
  },
  {
    id: '#LDX10281',
    date: '22 Sep 2026',
    customer: {
      name: 'Pavan Kumar',
      phone: '+91 98765 12345',
      email: 'pavan.kumar@gmail.com',
      avatar: 'PR',
      address: 'Hebbal, Bengaluru - 560024'
    },
    services: ['Home Care', 'Wash & Fold'],
    pickupTime: '22 Sep, 10:00 AM – 12:00 PM',
    amount: 750,
    status: 'Completed',
    payment: 'Paid',
    type: 'Pickup',
    driver: 'Arjun Singh (+91 87654 32109)'
  }
];

export const INITIAL_CUSTOMERS = [
  {
    id: '#CUS1028',
    name: 'Rohan Mehta',
    phone: '+91 98765 43210',
    email: 'rohan.mehta@gmail.com',
    avatar: 'RM',
    location: 'Banaswadi, Bengaluru 560043',
    totalOrders: 12,
    totalSpent: '₹3,240',
    status: 'Active',
    joinDate: '12 Aug 2026',
    joinRelative: '2 months ago'
  },
  {
    id: '#CUS1027',
    name: 'Priya Sharma',
    phone: '+91 99876 54321',
    email: 'priya.sharma@gmail.com',
    avatar: 'PS',
    location: 'HRBR Layout, Bengaluru 560043',
    totalOrders: 18,
    totalSpent: '₹5,680',
    status: 'Active',
    joinDate: '05 Aug 2026',
    joinRelative: '2 months ago'
  },
  {
    id: '#CUS1026',
    name: 'Arjun Nair',
    phone: '+91 91234 56789',
    email: 'arjun.nair@gmail.com',
    avatar: 'AN',
    location: 'Indiranagar, Bengaluru 560038',
    totalOrders: 9,
    totalSpent: '₹2,910',
    status: 'Active',
    joinDate: '28 Jul 2026',
    joinRelative: '3 months ago'
  },
  {
    id: '#CUS1025',
    name: 'Sneha Reddy',
    phone: '+91 99887 66554',
    email: 'sneha.reddy@gmail.com',
    avatar: 'SR',
    location: 'Whitefield, Bengaluru 560066',
    totalOrders: 15,
    totalSpent: '₹4,120',
    status: 'Active',
    joinDate: '20 Jul 2026',
    joinRelative: '3 months ago'
  },
  {
    id: '#CUS1024',
    name: 'Karan Verma',
    phone: '+91 98712 34567',
    email: 'karan.verma@gmail.com',
    avatar: 'KV',
    location: 'Marathahalli, Bengaluru 560037',
    totalOrders: 7,
    totalSpent: '₹1,980',
    status: 'Inactive',
    joinDate: '15 Jun 2026',
    joinRelative: '4 months ago'
  },
  {
    id: '#CUS1023',
    name: 'Neha Kapoor',
    phone: '+91 87654 32109',
    email: 'neha.kapoor@gmail.com',
    avatar: 'NK',
    location: 'HSR Layout, Bengaluru 560102',
    totalOrders: 21,
    totalSpent: '₹6,450',
    status: 'Active',
    joinDate: '10 Jun 2026',
    joinRelative: '4 months ago'
  },
  {
    id: '#CUS1022',
    name: 'Amit Shah',
    phone: '+91 91234 99876',
    email: 'amit.shah@gmail.com',
    avatar: 'AM',
    location: 'Koramangala, Bengaluru 560034',
    totalOrders: 11,
    totalSpent: '₹3,150',
    status: 'Active',
    joinDate: '02 Jun 2026',
    joinRelative: '4 months ago'
  }
];

export const INITIAL_SERVICES_ADMIN = [
  {
    id: 1,
    name: 'Wash & Fold',
    description: 'Everyday clothing & casual wear',
    category: 'Wash & Fold',
    price: 160,
    turnaround: '24–48 hrs',
    status: 'Active',
    icon: 'Shirt'
  },
  {
    id: 2,
    name: 'Wash & Iron',
    description: 'Wash and steam iron care',
    category: 'Wash & Iron',
    price: 180,
    turnaround: '24–48 hrs',
    status: 'Active',
    icon: 'Iron'
  },
  {
    id: 3,
    name: 'Dry Cleaning',
    description: 'Premium dry cleaning for delicate wear',
    category: 'Dry Cleaning',
    price: 240,
    turnaround: '48–72 hrs',
    status: 'Active',
    icon: 'Hanger'
  },
  {
    id: 4,
    name: 'Steam Iron',
    description: 'Professional steam pressing',
    category: 'Steam Iron',
    price: 150,
    turnaround: '24 hrs',
    status: 'Active',
    icon: 'Iron'
  },
  {
    id: 5,
    name: 'Shoe Laundry',
    description: 'Deep cleaning for all types of footwear',
    category: 'Shoe Laundry',
    price: 200,
    turnaround: '48–72 hrs',
    status: 'Active',
    icon: 'Footprints'
  },
  {
    id: 6,
    name: 'Home Care',
    description: 'Curtains, bedsheets, blankets & linen',
    category: 'Home Care',
    price: 300,
    turnaround: '48–72 hrs',
    status: 'Inactive',
    icon: 'Home'
  }
];

export const INITIAL_DRIVERS = [
  { id: 'd1', name: 'Ravi Kumar', phone: '+91 98765 43210', status: 'Available', ordersToday: 5, avatar: 'RK' },
  { id: 'd2', name: 'Arjun Singh', phone: '+91 87654 32109', status: 'Available', ordersToday: 4, avatar: 'AS' },
  { id: 'd3', name: 'Mohammed Taha', phone: '+91 91234 55678', status: 'Available', ordersToday: 3, avatar: 'MT' },
  { id: 'd4', name: 'Suresh Kumar', phone: '+91 99887 66554', status: 'On Delivery', ordersToday: 2, avatar: 'SK' },
  { id: 'd5', name: 'Praveen D', phone: '+91 98712 34567', status: 'Available', ordersToday: 4, avatar: 'PD' }
];

export const INITIAL_FAQS_ADMIN = [
  {
    id: 1,
    question: 'How does FabriCare pickup and delivery work?',
    answer: 'Schedule a pickup through our app or website. Our executive will arrive with specialized laundry bags and deliver clean clothes within 24-48 hours.',
    status: 'Active',
    displayOrder: 1
  },
  {
    id: 2,
    question: 'What areas do you service?',
    answer: 'We currently provide pickup and delivery services across Bengaluru including Indiranagar, Koramangala, Whitefield, HSR Layout, Banaswadi, and Malleshwaram.',
    status: 'Active',
    displayOrder: 2
  },
  {
    id: 3,
    question: 'What types of clothes do you clean?',
    answer: 'We clean all types of everyday and premium fabrics including cotton, silk, linen, wool, denim, party wear, suits, and curtains.',
    status: 'Active',
    displayOrder: 3
  },
  {
    id: 4,
    question: 'How long does the cleaning process take?',
    answer: 'Standard turnaround time is 1–2 days. Express services may be delivered within 24 hours.',
    status: 'Active',
    displayOrder: 4
  },
  {
    id: 5,
    question: 'How should I prepare my clothes for pickup?',
    answer: 'Please keep your clothes in a clean bag. You can also add special instructions for delicate items during booking.',
    status: 'Active',
    displayOrder: 5
  },
  {
    id: 6,
    question: 'What are the payment options?',
    answer: 'We accept online payments (UPI, cards, net banking) and cash on delivery (COD) upon inspection.',
    status: 'Active',
    displayOrder: 6
  },
  {
    id: 7,
    question: 'How can I track my order?',
    answer: 'You can track your order in real-time through our app or website with live SMS and WhatsApp status updates.',
    status: 'Active',
    displayOrder: 7
  },
  {
    id: 8,
    question: 'What if I am not satisfied with the service?',
    answer: 'Your satisfaction is our priority. If you are not happy with the service, we offer a 100% free re-wash guarantee.',
    status: 'Inactive',
    displayOrder: 8
  }
];

export const AdminProvider = ({ children }) => {
  // Navigation: 'dashboard' | 'orders' | 'pickup-delivery' | 'customers' | 'services' | 'content' | 'settings' | 'login'
  const [adminTab, setAdminTab] = useState('dashboard');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(true);

  // Modals & Drawers State
  const [isCreateOrderDrawerOpen, setIsCreateOrderDrawerOpen] = useState(false);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [isManageServicesModalOpen, setIsManageServicesModalOpen] = useState(false);
  const [isAssignOrderModalOpen, setIsAssignOrderModalOpen] = useState(false);
  const [assigningOrder, setAssigningOrder] = useState(null);

  // Data Store
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);
  const [services, setServices] = useState(INITIAL_SERVICES_ADMIN);
  const [drivers, setDrivers] = useState(INITIAL_DRIVERS);
  const [faqs, setFaqs] = useState(INITIAL_FAQS_ADMIN);
  const [termsContent, setTermsContent] = useState({
    title: 'Terms & Conditions',
    body: `1. Introduction\nWelcome to FabriCare. These Terms & Conditions govern your use of our website, mobile application and laundry services. By accessing our services, you agree to comply with and be bound by these terms.\n\n2. Services\nFabriCare provides professional laundry and dry cleaning services, including pickup and delivery. Service details, pricing and turnaround time may vary based on location and fabric type.\n\n3. Orders & Pickup\nOrders can be placed through our website, mobile app or by phone. Pickup and delivery timings are subject to availability. Please ensure clothes are securely packed and handed over in clean condition.\n\n4. Pricing & Payment\nPrices are based on the type of garment, fabric and service selected. All charges are transparent with no hidden fees.`
  });

  // Settings
  const [settings, setSettings] = useState({
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
  });

  // Initialize Firestore Sync & Seeding
  useEffect(() => {
    // Attempt automatic seed on first run
    seedInitialFirestoreData().catch(() => {});

    // Subscribe to real-time collections
    const unsubOrders = subscribeOrders((liveOrders) => {
      if (liveOrders && liveOrders.length > 0) {
        setOrders(liveOrders);
      }
    });

    const unsubCustomers = subscribeCustomers((liveCusts) => {
      if (liveCusts && liveCusts.length > 0) {
        setCustomers(liveCusts);
      }
    });

    const unsubServices = subscribeServices((liveServs) => {
      if (liveServs && liveServs.length > 0) {
        setServices(liveServs);
      }
    });

    const unsubDrivers = subscribeDrivers((liveDrivers) => {
      if (liveDrivers && liveDrivers.length > 0) {
        setDrivers(liveDrivers);
      }
    });

    const unsubFaqs = subscribeFaqs((liveFaqs) => {
      if (liveFaqs && liveFaqs.length > 0) {
        setFaqs(liveFaqs);
      }
    });

    // Fetch Settings and Terms
    getFirestoreSettings().then((res) => {
      if (res) setSettings(prev => ({ ...prev, ...res }));
    }).catch(() => {});

    getFirestoreTerms().then((res) => {
      if (res) setTermsContent(prev => ({ ...prev, ...res }));
    }).catch(() => {});

    return () => {
      if (typeof unsubOrders === 'function') unsubOrders();
      if (typeof unsubCustomers === 'function') unsubCustomers();
      if (typeof unsubServices === 'function') unsubServices();
      if (typeof unsubDrivers === 'function') unsubDrivers();
      if (typeof unsubFaqs === 'function') unsubFaqs();
    };
  }, []);

  const addCustomer = async (customerData) => {
    const newCust = {
      id: `#CUS${Math.floor(1000 + Math.random() * 9000)}`,
      name: customerData.name || 'New Customer',
      phone: customerData.phone || '+91 98765 00000',
      email: customerData.email || 'customer@example.com',
      avatar: (customerData.name || 'NC').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
      location: customerData.area ? `${customerData.area}, Bengaluru ${customerData.pincode || ''}` : 'Bengaluru',
      totalOrders: 1,
      totalSpent: '₹0',
      status: customerData.status !== undefined ? (customerData.status ? 'Active' : 'Inactive') : 'Active',
      joinDate: 'Today',
      joinRelative: 'Just now'
    };
    setCustomers(prev => [newCust, ...prev]);
    setIsAddCustomerModalOpen(false);

    try {
      await addFirestoreCustomer(newCust);
    } catch (err) {
      console.warn('Firestore addCustomer sync note:', err.message);
    }
  };

  const addService = async (serviceData) => {
    const newServ = {
      id: services.length + 1,
      name: serviceData.name || 'New Service',
      description: serviceData.description || '',
      category: serviceData.category || 'Wash & Fold',
      price: Number(serviceData.price) || 150,
      turnaround: serviceData.turnaround || '1–2 days',
      status: serviceData.status ? 'Active' : 'Inactive',
      icon: 'Shirt'
    };
    setServices(prev => [...prev, newServ]);
    setIsAddServiceModalOpen(false);

    try {
      await addFirestoreService(newServ);
    } catch (err) {
      console.warn('Firestore addService sync note:', err.message);
    }
  };

  const createOrder = async (orderData) => {
    const newOrd = {
      id: `#LDX${Math.floor(1000 + Math.random() * 9000)}`,
      date: '23 Sep 2026',
      customer: {
        name: orderData.customerName || 'Rohan Mehta',
        phone: orderData.customerPhone || '+91 98765 43210',
        email: 'customer@gmail.com',
        avatar: 'RM',
        address: orderData.address || 'Banaswadi, Bengaluru - 560043'
      },
      services: orderData.selectedServices || ['Wash & Fold'],
      pickupTime: `${orderData.date || '23 Sep 2026'}, ${orderData.time || '09:00 AM – 11:00 AM'}`,
      amount: orderData.amount || 560,
      status: 'Pending Pickup',
      payment: 'Paid',
      type: 'Pickup',
      driver: 'Not Assigned'
    };
    setOrders(prev => [newOrd, ...prev]);
    setIsCreateOrderDrawerOpen(false);

    try {
      await createFirestoreOrder(newOrd);
    } catch (err) {
      console.warn('Firestore createOrder sync note:', err.message);
    }
  };

  const assignDriverToOrder = async (orderId, driverName) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          driver: driverName,
          status: o.status === 'Pending Pickup' ? 'Pending Pickup' : o.status
        };
      }
      return o;
    }));
    setIsAssignOrderModalOpen(false);

    try {
      await assignDriverToFirestoreOrder(orderId, driverName);
    } catch (err) {
      console.warn('Firestore assignDriver sync note:', err.message);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    try {
      await updateFirestoreOrderStatus(orderId, status);
    } catch (err) {
      console.warn('Firestore update status sync note:', err.message);
    }
  };

  const toggleServiceStatus = async (serviceId) => {
    const currentService = services.find(s => s.id === serviceId);
    const currentStatus = currentService ? currentService.status : 'Active';
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';

    setServices(prev => prev.map(s => {
      if (s.id === serviceId) {
        return { ...s, status: newStatus };
      }
      return s;
    }));

    try {
      await toggleFirestoreServiceStatus(serviceId, currentStatus);
    } catch (err) {
      console.warn('Firestore toggle service sync note:', err.message);
    }
  };

  const deleteService = async (serviceId) => {
    setServices(prev => prev.filter(s => s.id !== serviceId));
  };

  const updateSettings = async (newSettings) => {
    setSettings(newSettings);
    try {
      await saveFirestoreSettings(newSettings);
    } catch (err) {
      console.warn('Firestore save settings sync note:', err.message);
    }
  };

  const updateTerms = async (newTerms) => {
    setTermsContent(newTerms);
    try {
      await saveFirestoreTerms(newTerms);
    } catch (err) {
      console.warn('Firestore save terms sync note:', err.message);
    }
  };

  return (
    <AdminContext.Provider
      value={{
        adminTab,
        setAdminTab,
        isAdminAuthenticated,
        setIsAdminAuthenticated,
        orders,
        setOrders,
        customers,
        setCustomers,
        services,
        setServices,
        drivers,
        faqs,
        setFaqs,
        termsContent,
        setTermsContent,
        updateTerms,
        settings,
        setSettings,
        updateSettings,
        isCreateOrderDrawerOpen,
        setIsCreateOrderDrawerOpen,
        isAddCustomerModalOpen,
        setIsAddCustomerModalOpen,
        isAddServiceModalOpen,
        setIsAddServiceModalOpen,
        isManageServicesModalOpen,
        setIsManageServicesModalOpen,
        isAssignOrderModalOpen,
        setIsAssignOrderModalOpen,
        assigningOrder,
        setAssigningOrder,
        addCustomer,
        addService,
        createOrder,
        updateOrderStatus,
        assignDriverToOrder,
        toggleServiceStatus,
        deleteService
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
