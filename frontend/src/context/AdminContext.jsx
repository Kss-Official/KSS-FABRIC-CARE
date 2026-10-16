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
import { complaintsApi, supportApi } from '../api/apiClient';

const AdminContext = createContext();

export const INITIAL_SUPPORT_TICKETS = [
  {
    id: 1,
    ticket_id_display: '#SUP-1048',
    ticket_number: '#SUP-1048',
    customer_name: 'Priya Sharma',
    customer_email: 'priya.sharma@example.com',
    subject: 'Delayed pickup for laundry',
    priority: 'HIGH',
    priority_display: 'High',
    status: 'OPEN',
    status_display: 'Open',
    message: "Hi,\nMy order #FC1024 was supposed to be picked up yesterday at 5 PM, but no one came. I'm not sure if there was an issue with the address or the schedule. Please look into this and let me know when the pickup will happen. Thanks!",
    formatted_created_at: '16 Oct 2026 10:24 AM',
    created_at: '2026-10-16T10:24:00Z',
    admin_reply: null,
    admin_reply_at: null
  },
  {
    id: 2,
    ticket_id_display: '#SUP-1047',
    ticket_number: '#SUP-1047',
    customer_name: 'Rahul Mehta',
    customer_email: 'rahul.mehta@example.com',
    subject: 'Question about silk care',
    priority: 'MEDIUM',
    priority_display: 'Medium',
    status: 'IN_PROGRESS',
    status_display: 'In Progress',
    message: "I have two pure silk shirts that require gentle dry cleaning. Could you confirm which detergents and pressing techniques you use for delicate silk fabrics?",
    formatted_created_at: '16 Oct 2026 09:15 AM',
    created_at: '2026-10-16T09:15:00Z',
    admin_reply: 'Our laundry specialist is checking the detergent composition for delicate silks and will update you shortly.',
    admin_reply_at: '2026-10-16T10:00:00Z'
  },
  {
    id: 3,
    ticket_id_display: '#SUP-1046',
    ticket_number: '#SUP-1046',
    customer_name: 'Ananya Rao',
    customer_email: 'ananya.rao@example.com',
    subject: 'Payment confirmation',
    priority: 'LOW',
    priority_display: 'Low',
    status: 'RESOLVED',
    status_display: 'Resolved',
    message: "I made a payment through UPI for order #FC1019, but the portal still showed payment pending. Please verify and confirm receipt.",
    formatted_created_at: '15 Oct 2026 04:32 PM',
    created_at: '2026-10-15T16:32:00Z',
    admin_reply: 'Payment has been verified and confirmed in our payment gateway. Your order is now marked as Confirmed.',
    admin_reply_at: '2026-10-15T17:00:00Z'
  },
  {
    id: 4,
    ticket_id_display: '#SUP-1045',
    ticket_number: '#SUP-1045',
    customer_name: 'Vikram Singh',
    customer_email: 'vikram.singh@example.com',
    subject: 'Order delivery concern',
    priority: 'HIGH',
    priority_display: 'High',
    status: 'OPEN',
    status_display: 'Open',
    message: "The delivery agent marked customer unavailable even though I was at home the entire evening. Kindly reschedule delivery for tomorrow morning.",
    formatted_created_at: '15 Oct 2026 11:20 AM',
    created_at: '2026-10-15T11:20:00Z',
    admin_reply: null,
    admin_reply_at: null
  }
];

export const INITIAL_COMPLAINTS = [
  {
    id: 1,
    order_id: '#FC1024',
    customer_name: 'Rahul Sharma',
    customer_phone: '+91 98765 43210',
    failure_reason: 'Customer Unavailable',
    reported_by_name: 'Rohit Kumar (Delivery Staff)',
    formatted_report_date: '16 Oct 2025 10:24 AM',
    formatted_reschedule_date: '18 Oct 2025 (Requested)',
    requested_reschedule_date: '2025-10-18',
    rescheduled_date: null,
    rescheduled_time_slot: '10:00 AM–12:00 PM',
    status: 'PENDING_RESCHEDULE',
    status_display: 'Pending Reschedule',
    notes: 'Customer did not answer door phone. Security guard stated resident is out of town until 18th Oct.'
  },
  {
    id: 2,
    order_id: '#FC1023',
    customer_name: 'Priya Patel',
    customer_phone: '+91 99887 76655',
    failure_reason: 'Customer Not Responding',
    reported_by_name: 'Amit Singh (Delivery Staff)',
    formatted_report_date: '16 Oct 2025 09:45 AM',
    formatted_reschedule_date: '19 Oct 2025 (Requested)',
    requested_reschedule_date: '2025-10-19',
    rescheduled_date: '2025-10-19',
    rescheduled_time_slot: '12:00 PM–2:00 PM',
    status: 'RESCHEDULED',
    status_display: 'Rescheduled',
    notes: 'Attempted 3 phone calls. Customer sent SMS requesting delivery on 19th Oct.'
  },
  {
    id: 3,
    order_id: '#FC1022',
    customer_name: 'Neha Gupta',
    customer_phone: '+91 91234 56789',
    failure_reason: 'Address Issue',
    reported_by_name: 'Suresh Yadav (Delivery Staff)',
    formatted_report_date: '15 Oct 2025 05:32 PM',
    formatted_reschedule_date: '—',
    requested_reschedule_date: null,
    rescheduled_date: null,
    rescheduled_time_slot: null,
    status: 'UNDER_REVIEW',
    status_display: 'Under Review',
    notes: 'House number 42B does not exist on 3rd Main. Landmark unclear.'
  },
  {
    id: 4,
    order_id: '#FC1021',
    customer_name: 'Amit Verma',
    customer_phone: '+91 98111 22334',
    failure_reason: 'Customer Unavailable',
    reported_by_name: 'Rohit Kumar (Delivery Staff)',
    formatted_report_date: '15 Oct 2025 02:18 PM',
    formatted_reschedule_date: '17 Oct 2025 (Rescheduled)',
    requested_reschedule_date: null,
    rescheduled_date: '2025-10-17',
    rescheduled_time_slot: '2:00 PM–4:00 PM',
    status: 'RESCHEDULED',
    status_display: 'Rescheduled',
    notes: 'Customer requested redelivery on 17th Oct afternoon.'
  },
  {
    id: 5,
    order_id: '#FC1020',
    customer_name: 'Sneha Reddy',
    customer_phone: '+91 97654 32190',
    failure_reason: 'Customer Not Responding',
    reported_by_name: 'Pooja Singh (Delivery Staff)',
    formatted_report_date: '14 Oct 2025 11:07 AM',
    formatted_reschedule_date: '—',
    requested_reschedule_date: null,
    rescheduled_date: null,
    rescheduled_time_slot: null,
    status: 'UNDER_REVIEW',
    status_display: 'Under Review',
    notes: 'Doorbell out of order, phone unreachable.'
  },
  {
    id: 6,
    order_id: '#FC1019',
    customer_name: 'Vikas Mehta',
    customer_phone: '+91 93456 78901',
    failure_reason: 'Location Not Found',
    reported_by_name: 'Amit Kumar (Delivery Staff)',
    formatted_report_date: '14 Oct 2025 09:55 AM',
    formatted_reschedule_date: '16 Oct 2025 (Rescheduled)',
    requested_reschedule_date: null,
    rescheduled_date: '2025-10-16',
    rescheduled_time_slot: '10:00 AM–12:00 PM',
    status: 'RESCHEDULED',
    status_display: 'Rescheduled',
    notes: 'Building name incorrect in app. Corrected with customer.'
  },
  {
    id: 7,
    order_id: '#FC1018',
    customer_name: 'Anjali Singh',
    customer_phone: '+91 98712 34567',
    failure_reason: 'Customer Unavailable',
    reported_by_name: 'Suresh Yadav (Delivery Staff)',
    formatted_report_date: '13 Oct 2025 04:24 PM',
    formatted_reschedule_date: '—',
    requested_reschedule_date: null,
    rescheduled_date: null,
    rescheduled_time_slot: null,
    status: 'PENDING_RESCHEDULE',
    status_display: 'Pending Reschedule',
    notes: 'Flat locked. Need customer reschedule confirmation.'
  },
  {
    id: 8,
    order_id: '#FC1017',
    customer_name: 'Karan Malhotra',
    customer_phone: '+91 99001 12233',
    failure_reason: 'Customer Not Responding',
    reported_by_name: 'Rohit Kumar (Delivery Staff)',
    formatted_report_date: '13 Oct 2025 01:12 PM',
    formatted_reschedule_date: '15 Oct 2025 (Rescheduled)',
    requested_reschedule_date: null,
    rescheduled_date: '2025-10-15',
    rescheduled_time_slot: '4:00 PM–6:00 PM',
    status: 'RESCHEDULED',
    status_display: 'Rescheduled',
    notes: 'Customer called back to reschedule.'
  }
];

export const INITIAL_ORDERS = [
  {
    id: '#LDX1290',
    date: '23 Sep 2026',
    customer: {
      name: 'Rohan Mehta',
      phone: '+91 98765 43210',
      email: 'rohan.mehta@gmail.com',
      avatar: 'RM',
      address: 'Banaswadi, Bengaluru - 560043'
    },
    services: ['Wash & Fold', 'Dry Cleaning'],
    pickupTime: '23 Sep, 09:00 AM – 11:00 AM',
    amount: 560,
    status: 'Pending Pickup',
    payment: 'Paid',
    type: 'Pickup',
    driver: 'Ravi Kumar (+91 98765 43210)'
  },
  {
    id: '#LDX1289',
    date: '23 Sep 2026',
    customer: {
      name: 'Priya Sharma',
      phone: '+91 99876 54321',
      email: 'priya.sharma@gmail.com',
      avatar: 'PS',
      address: 'House #45, 3rd Cross, HRBR Layout, Bengaluru - 560043'
    },
    services: ['Dry Cleaning'],
    pickupTime: '23 Sep, 10:00 AM – 12:00 PM',
    amount: 240,
    status: 'In Cleaning',
    payment: 'Paid',
    type: 'Pickup',
    driver: 'Not Assigned'
  },
  {
    id: '#LDX1288',
    date: '23 Sep 2026',
    customer: {
      name: 'Arjun Nair',
      phone: '+91 91234 56789',
      email: 'arjun.nair@gmail.com',
      avatar: 'AN',
      address: 'Indiranagar, Bengaluru - 560038'
    },
    services: ['Wash & Iron', 'Steam Iron'],
    pickupTime: '23 Sep, 11:00 AM – 01:00 PM',
    amount: 420,
    status: 'Ready for Delivery',
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
    pickupTime: '23 Sep, 02:00 PM – 04:00 PM',
    amount: 780,
    status: 'Completed',
    payment: 'Paid',
    type: 'Pickup',
    driver: 'Arjun Singh (+91 87654 32109)'
  },
  {
    id: '#LDX1286',
    date: '23 Sep 2026',
    customer: {
      name: 'Karan Verma',
      phone: '+91 98712 34567',
      email: 'karan.verma@gmail.com',
      avatar: 'KV',
      address: 'Marathahalli, Bengaluru - 560037'
    },
    services: ['Shoe Laundry'],
    pickupTime: '23 Sep, 03:00 PM – 05:00 PM',
    amount: 350,
    status: 'In Cleaning',
    payment: 'Paid',
    type: 'Delivery',
    driver: 'Ravi Kumar (+91 98765 43210)'
  },
  {
    id: '#LDX1285',
    date: '23 Sep 2026',
    customer: {
      name: 'Neha Kapoor',
      phone: '+91 87654 32109',
      email: 'neha.kapoor@gmail.com',
      avatar: 'NK',
      address: 'HSR Layout, Bengaluru - 560102'
    },
    services: ['Steam Iron'],
    pickupTime: '23 Sep, 04:00 PM – 06:00 PM',
    amount: 280,
    status: 'Pending Pickup',
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
    name: 'Shirt',
    description: 'Regular shirt cleaning and pressing',
    category: 'Wash & Fold',
    price: 80,
    turnaround: '1–2 days',
    status: 'Active',
    icon: 'Shirt',
    type: 'Standard'
  },
  {
    id: 2,
    name: 'Jeans',
    description: 'Denim washing and care',
    category: 'Wash & Fold',
    price: 120,
    turnaround: '1–2 days',
    status: 'Active',
    icon: 'Jeans',
    type: 'Standard'
  },
  {
    id: 3,
    name: 'T-Shirt',
    description: 'Regular wash and fold',
    category: 'Wash & Fold',
    price: 70,
    turnaround: '1–2 days',
    status: 'Active',
    icon: 'TShirt',
    type: 'Standard'
  },
  {
    id: 4,
    name: 'Formal Suit',
    description: 'Professional dry cleaning',
    category: 'Dry Cleaning',
    price: 250,
    turnaround: '2–3 days',
    status: 'Active',
    icon: 'Suit',
    type: 'Premium'
  },
  {
    id: 5,
    name: 'Saree',
    description: 'Special fabric care with dry cleaning',
    category: 'Dry Cleaning',
    price: 220,
    turnaround: '2–3 days',
    status: 'Active',
    icon: 'Saree',
    type: 'Premium'
  },
  {
    id: 6,
    name: 'Bedsheet (Single)',
    description: 'Wash, dry and fold',
    category: 'Steam Ironing',
    price: 90,
    turnaround: '1–2 days',
    status: 'Active',
    icon: 'Bedsheet',
    type: 'Standard'
  },
  {
    id: 7,
    name: 'Blanket',
    description: 'Deep cleaning and sanitization',
    category: 'Special Care',
    price: 300,
    turnaround: '2–3 days',
    status: 'Inactive',
    icon: 'Blanket',
    type: 'Premium'
  },
  {
    id: 8,
    name: 'Curtain (Per Piece)',
    description: 'Dry cleaning and freshening',
    category: 'Special Care',
    price: 180,
    turnaround: '2–3 days',
    status: 'Active',
    icon: 'Curtain',
    type: 'Standard'
  },
  {
    id: 9,
    name: 'Silk Saree',
    description: 'Delicate fabric dry cleaning',
    category: 'Special Care',
    price: 450,
    turnaround: '2–3 days',
    status: 'Active',
    icon: 'Saree',
    type: 'Premium'
  },
  {
    id: 10,
    name: 'Winter Jacket',
    description: 'Heavy wool dry cleaning & sanitization',
    category: 'Dry Cleaning',
    price: 550,
    turnaround: '3–4 days',
    status: 'Active',
    icon: 'Suit',
    type: 'Premium'
  },
  {
    id: 11,
    name: 'Carpet Cleaning',
    description: 'Deep steam sanitization & stain removal',
    category: 'Special Care',
    price: 850,
    turnaround: '3–4 days',
    status: 'Inactive',
    icon: 'Blanket',
    type: 'Premium'
  },
  {
    id: 12,
    name: 'Cushion Covers',
    description: 'Gentle wash and steam press',
    category: 'Wash & Fold',
    price: 680,
    turnaround: '1–2 days',
    status: 'Active',
    icon: 'Bedsheet',
    type: 'Standard'
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
    question: 'How does Laundrix pickup and delivery work?',
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

export const INITIAL_ADMIN_NOTIFICATIONS = [
  {
    id: 'notif-fc-1',
    type: 'order',
    title: 'Order Placed Successfully',
    desc: 'Your booking #FCEB0F4 has been received. Our team will review and assign pickup shortly.',
    time: '13/10/2026, 1:44:58 pm',
    timestamp: 1791888898000,
    unread: true,
    actionTab: 'orders',
    meta: { orderId: '#FCEB0F4' }
  },
  {
    id: 'notif-fc-2',
    type: 'order',
    title: 'Order Placed Successfully',
    desc: 'Your booking #FC88B84 has been received. Our team will review and assign pickup shortly.',
    time: '13/10/2026, 1:14:23 pm',
    timestamp: 1791887063000,
    unread: true,
    actionTab: 'orders',
    meta: { orderId: '#FC88B84' }
  },
  {
    id: 'notif-fc-3',
    type: 'order',
    title: 'Order Placed Successfully',
    desc: 'Your booking #FC9E22B has been received. Our team will review and assign pickup shortly.',
    time: '13/10/2026, 1:06:04 pm',
    timestamp: 1791886564000,
    unread: true,
    actionTab: 'orders',
    meta: { orderId: '#FC9E22B' }
  },
  {
    id: 'notif-fc-4',
    type: 'order',
    title: 'Order Placed Successfully',
    desc: 'Your booking #FC2C5DB has been received. Our team will review and assign pickup shortly.',
    time: '13/10/2026, 1:05:09 pm',
    timestamp: 1791886509000,
    unread: true,
    actionTab: 'orders',
    meta: { orderId: '#FC2C5DB' }
  },
  {
    id: 'notif-fc-5',
    type: 'order',
    title: 'Order Placed Successfully',
    desc: 'Your booking #FC66E0E has been received. Our team will review and assign pickup shortly.',
    time: '13/10/2026, 1:04:28 pm',
    timestamp: 1791886468000,
    unread: true,
    actionTab: 'orders',
    meta: { orderId: '#FC66E0E' }
  },
  {
    id: 'notif-1',
    type: 'order',
    title: 'New Order #LDX10290 Placed',
    desc: 'Rohan Mehta placed a Pickup order for 4 items (Wash & Fold). Pickup scheduled for today, 09:00 AM – 11:00 AM.',
    time: '13/10/2026, 12:45:00 pm',
    timestamp: Date.now() - 5 * 60 * 1000,
    unread: false,
    actionTab: 'orders',
    meta: { orderId: '#LDX1290', customer: 'Rohan Mehta' }
  },
  {
    id: 'notif-2',
    type: 'driver',
    title: 'Driver Assigned to Order #LDX10289',
    desc: 'Ravi Kumar has been assigned for pickup at House #45, HRBR Layout. Status: Driver en route.',
    time: '13/10/2026, 12:20:00 pm',
    timestamp: Date.now() - 25 * 60 * 1000,
    unread: false,
    actionTab: 'pickup-delivery',
    meta: { orderId: '#LDX1289', driver: 'Ravi Kumar' }
  }
];

export const AdminProvider = ({ children }) => {
  const [adminTab, setAdminTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes('help-support')) return 'help-support';
      if (hash.includes('delivery-reports') || hash.includes('complaints') || hash.includes('complaint-reports')) return 'delivery-reports';
      if (hash.includes('orders')) return 'orders';
      if (hash.includes('pickup-delivery') || hash.includes('deliveries')) return 'pickup-delivery';
      if (hash.includes('customers')) return 'customers';
      if (hash.includes('services')) return 'services';
      if (hash.includes('notifications')) return 'notifications';
      if (hash.includes('content')) return 'content';
      if (hash.includes('settings')) return 'settings';
      if (hash.includes('dashboard')) return 'dashboard';
    }
    return 'dashboard';
  });
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(true);

  // Notifications State
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('fabricare_admin_notifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_ADMIN_NOTIFICATIONS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('fabricare_admin_notifications', JSON.stringify(notifications));
    } catch (e) {}
  }, [notifications]);

  const markNotificationAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
  };

  const markNotificationAsUnread = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const addAdminNotification = (notif) => {
    const newNotif = {
      id: `notif-${Date.now()}`,
      time: 'Just now',
      timestamp: Date.now(),
      unread: true,
      ...notif
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Modals & Drawers State
  const [isCreateOrderDrawerOpen, setIsCreateOrderDrawerOpen] = useState(false);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [isManageServicesModalOpen, setIsManageServicesModalOpen] = useState(false);
  const [isAssignOrderModalOpen, setIsAssignOrderModalOpen] = useState(false);
  const [assigningOrder, setAssigningOrder] = useState(null);

  // Data Store
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [customers, setCustomers] = useState(() => {
    try {
      const saved = localStorage.getItem('fabricare_admin_customers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_CUSTOMERS;
  });
  const [services, setServices] = useState(INITIAL_SERVICES_ADMIN);
  const [drivers, setDrivers] = useState(INITIAL_DRIVERS);
  const [faqs, setFaqs] = useState(INITIAL_FAQS_ADMIN);
  const [termsContent, setTermsContent] = useState({
    title: 'Terms & Conditions',
    body: `1. Introduction\nWelcome to Laundrix. These Terms & Conditions govern your use of our website, mobile application and laundry services. By accessing our services, you agree to comply with and be bound by these terms.\n\n2. Services\nLaundrix provides professional laundry and dry cleaning services, including pickup and delivery. Service details, pricing and turnaround time may vary based on location and fabric type.\n\n3. Orders & Pickup\n  Orders can be placed through our website, mobile app or by phone.\n  Pickup and delivery timings are subject to availability.\n  Please ensure clothes are securely packed and handed over in clean condition.\n\n4. Pricing & Payment\n  Prices are based on the type of garment, fabric and service selected.`
  });

  // Settings
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('fabricare_admin_settings');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return {
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
      photoUrl: '',
      notifications: {
        newOrders: true,
        customerMessages: true,
        pickupDelivery: true,
        systemAnnouncements: false
      }
    };
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
    const rawName = (customerData.name || 'New Customer').trim();
    const initials = rawName
      .split(/\s+/)
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'NC';

    const addressParts = [
      customerData.address1,
      customerData.address2,
      customerData.area,
      customerData.city || 'Bengaluru',
      customerData.pincode
    ].filter(Boolean);

    const locationString = addressParts.length > 0 
      ? addressParts.join(', ')
      : (customerData.area ? `${customerData.area}, Bengaluru ${customerData.pincode || ''}` : 'Bengaluru');

    const newCust = {
      id: `#CUS${Math.floor(1000 + Math.random() * 9000)}`,
      name: rawName.split(' ')[0] || rawName,
      fullName: rawName,
      phone: customerData.phone || '+91 98765 00000',
      email: customerData.email || '',
      whatsapp: customerData.whatsapp || customerData.phone || '',
      address1: customerData.address1 || '',
      address2: customerData.address2 || '',
      city: customerData.city || 'Bengaluru',
      area: customerData.area || 'HSR Layout',
      pincode: customerData.pincode || '560043',
      locationType: customerData.locationType || 'Home',
      notes: customerData.notes || '',
      avatar: initials,
      avatarBg: '#E0F2FE',
      avatarColor: '#0284C7',
      location: locationString,
      totalOrders: 0,
      totalSpent: '₹0',
      status: customerData.status !== undefined ? (customerData.status ? 'Active' : 'Inactive') : 'Active',
      joinDate: 'Today',
      joinRelative: 'Just now'
    };

    setCustomers(prev => {
      const updated = [newCust, ...prev];
      try {
        localStorage.setItem('fabricare_admin_customers', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setIsAddCustomerModalOpen(false);

    try {
      await addFirestoreCustomer(newCust);
    } catch (err) {
      console.warn('Firestore addCustomer sync note:', err.message);
    }

    return newCust;
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
    setOrders(prev => {
      const updated = prev.map(o => {
        const matchesId = o.id === orderId || 
                          o.id.replace('#LDX12', '#LDX1028') === orderId ||
                          orderId.replace('#LDX12', '#LDX1028') === o.id;
        if (matchesId) {
          return {
            ...o,
            driver: driverName,
            status: 'Assigned'
          };
        }
        return o;
      });
      try {
        localStorage.setItem('fabricare_admin_orders', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
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
      localStorage.setItem('fabricare_admin_settings', JSON.stringify(newSettings));
      // Also update fabricare_user session if present
      const savedUser = localStorage.getItem('fabricare_user') || sessionStorage.getItem('fabricare_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        parsed.displayName = newSettings.name || parsed.displayName;
        parsed.email = newSettings.email || parsed.email;
        localStorage.setItem('fabricare_user', JSON.stringify(parsed));
      }
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}

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

  // Complaints State & Operations
  const [complaints, setComplaints] = useState(() => {
    try {
      const saved = localStorage.getItem('fabricare_admin_complaints');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_COMPLAINTS;
  });

  const [complaintsSummary, setComplaintsSummary] = useState(() => {
    try {
      const saved = localStorage.getItem('fabricare_admin_complaints_summary');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      total_complaints: 28,
      total_complaints_change: '↑ 12%',
      pending_reschedule: 7,
      pending_reschedule_change: '↑ 33%',
      rescheduled: 13,
      rescheduled_change: '↑ 25%',
      resolved: 5,
      resolved_change: '↑ 20%',
      under_review: 3
    };
  });

  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [isRescheduleDrawerOpen, setIsRescheduleDrawerOpen] = useState(false);
  const [activeRescheduleComplaint, setActiveRescheduleComplaint] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem('fabricare_admin_complaints', JSON.stringify(complaints));
    } catch (e) {}
  }, [complaints]);

  useEffect(() => {
    try {
      localStorage.setItem('fabricare_admin_complaints_summary', JSON.stringify(complaintsSummary));
    } catch (e) {}
  }, [complaintsSummary]);

  const fetchComplaints = async (params = {}) => {
    setComplaintsLoading(true);
    try {
      const res = await complaintsApi.getComplaints(params);
      if (res.data) {
        if (Array.isArray(res.data.results) && res.data.results.length > 0) {
          setComplaints(res.data.results);
        }
        if (res.data.summary) {
          setComplaintsSummary(res.data.summary);
        }
      }
    } catch (err) {
      console.warn('Backend complaints fetch failed, retaining cached data:', err);
    } finally {
      setComplaintsLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const openRescheduleDrawer = (complaint) => {
    setActiveRescheduleComplaint(complaint);
    setIsRescheduleDrawerOpen(true);
  };

  const closeRescheduleDrawer = () => {
    setIsRescheduleDrawerOpen(false);
    setActiveRescheduleComplaint(null);
  };

  const rescheduleDelivery = async (complaintId, rescheduleData) => {
    try {
      const res = await complaintsApi.rescheduleComplaint(complaintId, rescheduleData);
      
      setComplaints(prev => prev.map(c => {
        if (c.id === complaintId) {
          const dateStr = rescheduleData.delivery_date;
          return {
            ...c,
            status: 'RESCHEDULED',
            status_display: 'Rescheduled',
            rescheduled_date: dateStr,
            rescheduled_time_slot: rescheduleData.delivery_time_slot,
            formatted_reschedule_date: `${dateStr} (${rescheduleData.delivery_time_slot || 'Rescheduled'})`,
            notes: rescheduleData.notes ? `${c.notes || ''}\nAdmin Note: ${rescheduleData.notes}`.trim() : c.notes
          };
        }
        return c;
      }));

      setComplaintsSummary(prev => ({
        ...prev,
        pending_reschedule: Math.max(0, (prev.pending_reschedule || 8) - 1),
        rescheduled: (prev.rescheduled || 10) + 1
      }));

      addAdminNotification({
        type: 'delivery',
        title: 'Delivery Rescheduled',
        desc: `Order ${activeRescheduleComplaint?.order_id || ''} delivery rescheduled to ${rescheduleData.delivery_date} (${rescheduleData.delivery_time_slot || ''}).`,
        actionTab: 'reports',
        meta: { orderId: activeRescheduleComplaint?.order_id }
      });

      return { success: true, data: res.data };
    } catch (err) {
      console.warn('Backend reschedule API error, applying local optimistic update:', err);
      setComplaints(prev => prev.map(c => {
        if (c.id === complaintId) {
          const dateStr = rescheduleData.delivery_date;
          return {
            ...c,
            status: 'RESCHEDULED',
            status_display: 'Rescheduled',
            rescheduled_date: dateStr,
            rescheduled_time_slot: rescheduleData.delivery_time_slot,
            formatted_reschedule_date: `${dateStr} (${rescheduleData.delivery_time_slot || 'Rescheduled'})`,
            notes: rescheduleData.notes ? `${c.notes || ''}\nAdmin Note: ${rescheduleData.notes}`.trim() : c.notes
          };
        }
        return c;
      }));

      setComplaintsSummary(prev => ({
        ...prev,
        pending_reschedule: Math.max(0, (prev.pending_reschedule || 8) - 1),
        rescheduled: (prev.rescheduled || 10) + 1
      }));
      return { success: true };
    }
  };

  // Support Tickets State
  const [supportTickets, setSupportTickets] = useState(() => {
    try {
      const saved = localStorage.getItem('fabricare_admin_support_tickets');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_SUPPORT_TICKETS;
  });

  const [supportSummary, setSupportSummary] = useState(() => {
    try {
      const saved = localStorage.getItem('fabricare_admin_support_summary');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      total_tickets: 128,
      total_tickets_change: '↑ 12%',
      open: 24,
      open_change: '↑ 5%',
      in_progress: 12,
      in_progress_change: '↑ 8%',
      resolved: 92,
      resolved_change: '↑ 15%'
    };
  });

  const [supportLoading, setSupportLoading] = useState(false);
  const [isSupportDrawerOpen, setIsSupportDrawerOpen] = useState(false);
  const [activeSupportTicket, setActiveSupportTicket] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem('fabricare_admin_support_tickets', JSON.stringify(supportTickets));
    } catch (e) {}
  }, [supportTickets]);

  useEffect(() => {
    try {
      localStorage.setItem('fabricare_admin_support_summary', JSON.stringify(supportSummary));
    } catch (e) {}
  }, [supportSummary]);

  const fetchSupportTickets = async (params = {}) => {
    setSupportLoading(true);
    try {
      const res = await supportApi.getTickets(params);
      if (res.data) {
        if (Array.isArray(res.data.results) && res.data.results.length > 0) {
          setSupportTickets(res.data.results);
        } else if (Array.isArray(res.data) && res.data.length > 0) {
          setSupportTickets(res.data);
        }
        if (res.data.summary) {
          setSupportSummary(res.data.summary);
        }
      }
    } catch (err) {
      console.warn('Backend support tickets fetch failed, retaining cached data:', err);
    } finally {
      setSupportLoading(false);
    }
  };

  useEffect(() => {
    fetchSupportTickets();
  }, []);

  const openSupportDrawer = (ticket) => {
    setActiveSupportTicket(ticket);
    setIsSupportDrawerOpen(true);
  };

  const closeSupportDrawer = () => {
    setIsSupportDrawerOpen(false);
    setActiveSupportTicket(null);
  };

  const replyToSupportTicket = async (ticketId, replyText, statusVal) => {
    try {
      const res = await supportApi.replyTicket(ticketId, {
        admin_reply: replyText,
        status: statusVal
      });

      const updated = res.data?.ticket || res.data;
      setSupportTickets(prev => prev.map(t => {
        if (t.id === ticketId || t.ticket_number === ticketId || t.ticket_id_display === ticketId) {
          return {
            ...t,
            admin_reply: replyText,
            admin_reply_at: new Date().toISOString(),
            status: statusVal || t.status,
            status_display: statusVal === 'IN_PROGRESS' ? 'In Progress' : (statusVal === 'RESOLVED' ? 'Resolved' : t.status_display)
          };
        }
        return t;
      }));

      if (activeSupportTicket && (activeSupportTicket.id === ticketId || activeSupportTicket.ticket_number === ticketId)) {
        setActiveSupportTicket(prev => ({
          ...prev,
          admin_reply: replyText,
          admin_reply_at: new Date().toISOString(),
          status: statusVal || prev.status
        }));
      }

      addAdminNotification({
        type: 'order',
        title: 'Support Response Sent',
        desc: `Response sent to customer for ticket ${activeSupportTicket?.ticket_id_display || activeSupportTicket?.ticket_number || ''}.`,
        actionTab: 'help-support'
      });

      return { success: true, data: updated };
    } catch (err) {
      console.warn('Backend reply failed, applying local update:', err);
      setSupportTickets(prev => prev.map(t => {
        if (t.id === ticketId || t.ticket_number === ticketId || t.ticket_id_display === ticketId) {
          return {
            ...t,
            admin_reply: replyText,
            admin_reply_at: new Date().toISOString(),
            status: statusVal || t.status,
            status_display: statusVal === 'IN_PROGRESS' ? 'In Progress' : (statusVal === 'RESOLVED' ? 'Resolved' : t.status_display)
          };
        }
        return t;
      }));

      if (activeSupportTicket && (activeSupportTicket.id === ticketId || activeSupportTicket.ticket_number === ticketId)) {
        setActiveSupportTicket(prev => ({
          ...prev,
          admin_reply: replyText,
          admin_reply_at: new Date().toISOString(),
          status: statusVal || prev.status
        }));
      }

      return { success: true };
    }
  };

  const resolveSupportTicket = async (ticketId, replyText) => {
    try {
      const res = await supportApi.resolveTicket(ticketId, {
        admin_reply: replyText
      });

      const updated = res.data?.ticket || res.data;
      setSupportTickets(prev => prev.map(t => {
        if (t.id === ticketId || t.ticket_number === ticketId || t.ticket_id_display === ticketId) {
          return {
            ...t,
            status: 'RESOLVED',
            status_display: 'Resolved',
            admin_reply: replyText || t.admin_reply,
            admin_reply_at: replyText ? new Date().toISOString() : t.admin_reply_at
          };
        }
        return t;
      }));

      if (activeSupportTicket && (activeSupportTicket.id === ticketId || activeSupportTicket.ticket_number === ticketId)) {
        setActiveSupportTicket(prev => ({
          ...prev,
          status: 'RESOLVED',
          status_display: 'Resolved',
          admin_reply: replyText || prev.admin_reply
        }));
      }

      setSupportSummary(prev => ({
        ...prev,
        open: Math.max(0, (prev.open || 24) - 1),
        resolved: (prev.resolved || 92) + 1
      }));

      addAdminNotification({
        type: 'order',
        title: 'Support Ticket Resolved',
        desc: `Ticket ${activeSupportTicket?.ticket_id_display || activeSupportTicket?.ticket_number || ''} marked as Resolved.`,
        actionTab: 'help-support'
      });

      return { success: true, data: updated };
    } catch (err) {
      console.warn('Backend resolve failed, applying local update:', err);
      setSupportTickets(prev => prev.map(t => {
        if (t.id === ticketId || t.ticket_number === ticketId || t.ticket_id_display === ticketId) {
          return {
            ...t,
            status: 'RESOLVED',
            status_display: 'Resolved',
            admin_reply: replyText || t.admin_reply
          };
        }
        return t;
      }));

      if (activeSupportTicket && (activeSupportTicket.id === ticketId || activeSupportTicket.ticket_number === ticketId)) {
        setActiveSupportTicket(prev => ({
          ...prev,
          status: 'RESOLVED',
          status_display: 'Resolved',
          admin_reply: replyText || prev.admin_reply
        }));
      }

      setSupportSummary(prev => ({
        ...prev,
        open: Math.max(0, (prev.open || 24) - 1),
        resolved: (prev.resolved || 92) + 1
      }));

      return { success: true };
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
        deleteService,
        notifications,
        setNotifications,
        markNotificationAsRead,
        markNotificationAsUnread,
        markAllNotificationsAsRead,
        deleteNotification,
        clearAllNotifications,
        addAdminNotification,
        unreadNotificationsCount: notifications.filter(n => n.unread).length,
        complaints,
        setComplaints,
        complaintsSummary,
        setComplaintsSummary,
        complaintsLoading,
        isRescheduleDrawerOpen,
        setIsRescheduleDrawerOpen,
        activeRescheduleComplaint,
        setActiveRescheduleComplaint,
        fetchComplaints,
        openRescheduleDrawer,
        closeRescheduleDrawer,
        rescheduleDelivery,
        supportTickets,
        setSupportTickets,
        supportSummary,
        setSupportSummary,
        supportLoading,
        isSupportDrawerOpen,
        setIsSupportDrawerOpen,
        activeSupportTicket,
        setActiveSupportTicket,
        fetchSupportTickets,
        openSupportDrawer,
        closeSupportDrawer,
        replyToSupportTicket,
        resolveSupportTicket
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
