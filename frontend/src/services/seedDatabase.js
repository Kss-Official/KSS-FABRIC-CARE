import { ref, set } from 'firebase/database';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, rtdb } from '../config/firebase';

export const SEED_USERS = [
  {
    email: 'customer@fabricare.com',
    password: 'Test@1234',
    name: 'Priyanka Kushwah',
    phone: '+919876543210',
    role: 'customer'
  },
  {
    email: 'staff@fabricare.com',
    password: 'Test@1234',
    name: 'Anil Verma',
    phone: '+919822233344',
    role: 'staff'
  },
  {
    email: 'delivery@fabricare.com',
    password: 'Test@1234',
    name: 'Ravi Sharma',
    phone: '+919811122233',
    role: 'agent'
  },
  {
    email: 'admin@fabricare.com',
    password: 'Test@1234',
    name: 'Admin Superuser',
    phone: '+919800000000',
    role: 'admin'
  }
];

export const seedDatabase = async () => {
  console.log('--- Starting FabriCare Database Seed ---');
  const now = Date.now();
  const createdUids = {};

  // 1. Create or Authenticate 4 Seed Users
  for (const u of SEED_USERS) {
    try {
      let uid;
      try {
        const cred = await createUserWithEmailAndPassword(auth, u.email, u.password);
        uid = cred.user.uid;
      } catch (err) {
        if (err.code === 'auth/email-already-in-use') {
          const signCred = await signInWithEmailAndPassword(auth, u.email, u.password);
          uid = signCred.user.uid;
        } else {
          throw err;
        }
      }
      createdUids[u.role] = uid;

      // Seed User Profile
      await set(ref(rtdb, `users/${uid}`), {
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        isActive: true,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=0D9488&color=fff`,
        createdAt: now
      });

      if (u.role === 'agent') {
        await set(ref(rtdb, `agents/${uid}`), {
          isOnline: true,
          vehicleType: 'Two-Wheeler',
          vehicleNumber: 'MP 07 AB 1234',
          lastLat: 26.2183,
          lastLng: 78.1828,
          lastActiveAt: now
        });
      }
    } catch (e) {
      console.warn(`User seed notice for ${u.email}:`, e.message);
    }
  }

  const custUid = createdUids['customer'] || 'usr_cust_001';
  const agentUid = createdUids['agent'] || 'usr_agent_001';
  const staffUid = createdUids['staff'] || 'usr_staff_001';
  const adminUid = createdUids['admin'] || 'usr_admin_001';

  // 2. Garments
  const garments = {
    garm_shirt: { name: 'Shirt / T-Shirt', category: 'Men', icon: 'shirt' },
    garm_trousers: { name: 'Trousers / Jeans', category: 'Men', icon: 'layers' },
    garm_saree: { name: 'Silk Saree', category: 'Women', icon: 'sparkles' },
    garm_bedsheet: { name: 'Double Bedsheet', category: 'Household', icon: 'package' }
  };
  await set(ref(rtdb, 'garments'), garments);

  // 3. Services
  const services = {
    svc_wash_fold: { name: 'Wash & Fold', description: 'Everyday laundry', turnaroundHours: 48, isActive: true },
    svc_wash_iron: { name: 'Wash & Iron', description: 'Steam pressed wash', turnaroundHours: 48, isActive: true },
    svc_dry_clean: { name: 'Dry Clean', description: 'Specialized chemical care', turnaroundHours: 72, isActive: true }
  };
  await set(ref(rtdb, 'services'), services);

  // 4. Prices (in Paise: ₹1 = 100 paise)
  const prices = {
    garm_shirt_svc_wash_fold: 4900,
    garm_shirt_svc_wash_iron: 7900,
    garm_shirt_svc_dry_clean: 12000,
    garm_trousers_svc_wash_iron: 8900,
    garm_saree_svc_dry_clean: 24900,
    garm_bedsheet_svc_wash_fold: 14900
  };
  await set(ref(rtdb, 'prices'), prices);

  // 5. Sample Orders across multiple stages
  const sampleOrders = [
    {
      id: 'ord_sample_01',
      code: 'FC-10452',
      customerId: custUid,
      customerName: 'Priyanka Kushwah',
      customerPhone: '+919876543210',
      address: { flatHouse: 'Flat 402, Royal Palms', areaColony: 'City Center', city: 'Gwalior', pincode: '474011', label: 'Home' },
      pickup: { date: '2026-10-18', from: '09:00', to: '11:00' },
      status: 'PLACED',
      stage: 'placed',
      currentLaundryStep: 'inspect',
      paymentStatus: 'Paid',
      isExpress: false,
      notes: 'Please fold neatly',
      items: {
        item_01: { garmentId: 'garm_shirt', serviceId: 'svc_wash_iron', name: 'Shirt (Wash & Iron)', quantity: 3, unitPrice: 7900, lineTotal: 23700 }
      },
      subtotal: 23700,
      expressCharge: 0,
      tax: 0,
      total: 23700,
      createdAt: now - 3600000,
      placedAt: now - 3500000,
      dueBy: now + 86400000,
      pickupTaskId: 'task_pk_sample_01',
      deliveryTaskId: null
    },
    {
      id: 'ord_sample_02',
      code: 'FC-10453',
      customerId: custUid,
      customerName: 'Priyanka Kushwah',
      customerPhone: '+919876543210',
      address: { flatHouse: 'Flat 402, Royal Palms', areaColony: 'City Center', city: 'Gwalior', pincode: '474011', label: 'Home' },
      pickup: { date: '2026-10-17', from: '10:00', to: '12:00' },
      status: 'IN_CLEANING',
      stage: 'processing',
      currentLaundryStep: 'wash',
      paymentStatus: 'Paid',
      isExpress: true,
      notes: 'Delicate silk wash',
      items: {
        item_01: { garmentId: 'garm_saree', serviceId: 'svc_dry_clean', name: 'Silk Saree (Dry Clean)', quantity: 1, unitPrice: 24900, lineTotal: 24900 }
      },
      subtotal: 24900,
      expressCharge: 10000,
      tax: 0,
      total: 34900,
      createdAt: now - 7200000,
      placedAt: now - 7000000,
      dueBy: now + 43200000,
      assignedStaffId: staffUid,
      pickupTaskId: 'task_pk_sample_02',
      deliveryTaskId: null
    },
    {
      id: 'ord_sample_03',
      code: 'FC-10454',
      customerId: custUid,
      customerName: 'Priyanka Kushwah',
      customerPhone: '+919876543210',
      address: { flatHouse: 'Flat 402, Royal Palms', areaColony: 'City Center', city: 'Gwalior', pincode: '474011', label: 'Home' },
      pickup: { date: '2026-10-16', from: '09:00', to: '11:00' },
      status: 'DELIVERED',
      stage: 'delivered',
      currentLaundryStep: 'pack',
      paymentStatus: 'Paid',
      isExpress: false,
      notes: '',
      items: {
        item_01: { garmentId: 'garm_bedsheet', serviceId: 'svc_wash_fold', name: 'Double Bedsheet', quantity: 2, unitPrice: 14900, lineTotal: 29800 }
      },
      subtotal: 29800,
      expressCharge: 0,
      tax: 0,
      total: 29800,
      createdAt: now - 86400000,
      placedAt: now - 86000000,
      deliveredAt: now - 3600000,
      dueBy: now,
      assignedStaffId: staffUid,
      pickupTaskId: 'task_pk_sample_03',
      deliveryTaskId: 'task_dl_sample_03'
    }
  ];

  for (const ord of sampleOrders) {
    await set(ref(rtdb, `orders/${ord.id}`), ord);
    await set(ref(rtdb, `userOrders/${ord.customerId}/${ord.id}`), true);
    await set(ref(rtdb, `ordersByStatus/${ord.status}/${ord.id}`), ord.createdAt);

    // Secrets
    await set(ref(rtdb, `orderSecrets/${ord.id}`), {
      pickupOtp: '4821',
      deliveryOtp: '9315',
      otpAttempts: 0
    });

    // History
    await set(ref(rtdb, `orderHistory/${ord.id}/hist_init`), {
      from: 'PAYMENT_PENDING',
      to: 'PLACED',
      byUid: ord.customerId,
      byName: ord.customerName,
      note: 'Order confirmed and paid',
      at: ord.placedAt
    });

    // Invoices
    const invId = `inv_${ord.id}`;
    await set(ref(rtdb, `invoices/${invId}`), {
      id: invId,
      orderId: ord.id,
      orderCode: ord.code,
      customerId: ord.customerId,
      invoiceNumber: `INV-2026-${ord.code.replace('FC-', '')}`,
      date: ord.placedAt,
      subtotal: ord.subtotal,
      tax: ord.tax,
      discount: 0,
      total: ord.total,
      paymentStatus: 'Paid'
    });
    await set(ref(rtdb, `userInvoices/${ord.customerId}/${invId}`), true);
  }

  // 6. Tasks
  await set(ref(rtdb, 'tasks/task_pk_sample_01'), {
    id: 'task_pk_sample_01',
    orderId: 'ord_sample_01',
    orderCode: 'FC-10452',
    type: 'pickup',
    status: 'unassigned',
    agentId: null,
    customer: { name: 'Priyanka Kushwah', phone: '+919876543210' },
    address: { flatHouse: 'Flat 402, Royal Palms', areaColony: 'City Center', city: 'Gwalior' },
    scheduledAt: now + 3600000,
    startedAt: null,
    completedAt: null
  });

  await set(ref(rtdb, 'tasks/task_pk_sample_02'), {
    id: 'task_pk_sample_02',
    orderId: 'ord_sample_02',
    orderCode: 'FC-10453',
    type: 'pickup',
    status: 'completed',
    agentId: agentUid,
    customer: { name: 'Priyanka Kushwah', phone: '+919876543210' },
    address: { flatHouse: 'Flat 402, Royal Palms', areaColony: 'City Center', city: 'Gwalior' },
    scheduledAt: now - 7200000,
    startedAt: now - 7000000,
    completedAt: now - 6500000
  });
  await set(ref(rtdb, `agentTasks/${agentUid}/task_pk_sample_02`), true);

  // 7. Complaints
  await set(ref(rtdb, 'complaints/comp_sample_01'), {
    id: 'comp_sample_01',
    ticketId: 'TCK-8812',
    customerId: custUid,
    customerName: 'Priyanka Kushwah',
    orderId: 'ord_sample_02',
    issueCategory: 'Special Instructions',
    subject: 'Request extra delicate care for silk saree',
    status: 'Open',
    createdAt: now - 3600000,
    updatedAt: now - 3600000
  });
  await set(ref(rtdb, `complaintMessages/comp_sample_01/msg_01`), {
    id: 'msg_01',
    senderUid: custUid,
    senderRole: 'customer',
    message: 'Please make sure no harsh detergents are used on my silk saree.',
    sentAt: now - 3600000
  });
  await set(ref(rtdb, `userComplaints/${custUid}/comp_sample_01`), true);

  // 8. Notifications
  await set(ref(rtdb, `notifications/${custUid}/notif_sample_01`), {
    id: 'notif_sample_01',
    type: 'order_update',
    title: 'Order In Cleaning',
    body: 'Your clothes for order FC-10453 are currently in the washing step.',
    orderId: 'ord_sample_02',
    isRead: false,
    createdAt: now - 1800000
  });

  await set(ref(rtdb, 'notificationsByRole/admin/notif_adm_01'), {
    id: 'notif_adm_01',
    type: 'new_order',
    title: 'Order FC-10452 Needs Pickup Driver',
    body: 'New order placed and paid for ₹237.00. Ready for pickup assignment.',
    orderId: 'ord_sample_01',
    isRead: false,
    createdAt: now - 3500000
  });

  await set(ref(rtdb, 'notificationsByRole/staff/notif_stf_01'), {
    id: 'notif_stf_01',
    type: 'new_dropoff',
    title: 'New Clothes Dropped Off at Hub',
    body: 'Order FC-10453 received at central facility.',
    orderId: 'ord_sample_02',
    isRead: false,
    createdAt: now - 5000000
  });

  // 9. Stats
  const todayKey = new Date().toISOString().split('T')[0];
  await set(ref(rtdb, `stats/daily/${todayKey}`), {
    ordersPlaced: 2,
    revenue: 58600,
    completedOrders: 1,
    serviceCounts: {
      svc_wash_iron: 1,
      svc_dry_clean: 1
    }
  });

  console.log('--- Database Seeding Complete ---');
  return { success: true };
};
