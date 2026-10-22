import {
  ref,
  get,
  set,
  update,
  push,
  onValue,
  off,
  query,
  orderByChild,
  equalTo,
  limitToLast
} from 'firebase/database';
import { rtdb } from '../config/firebase.js';
import { addNotificationToUpdates, addRoleNotificationsToUpdates, getRoleUserIds } from './notificationService.js';
import { PRICING_ITEMS, PRICING_SUBCATEGORIES } from '../data/pricingData.js';

const getTodayKey = () => new Date().toISOString().split('T')[0];

/**
 * 1. Admin assigns pickup agent -> PICKUP_SCHEDULED
 */
export const assignPickupAgent = async (orderId, taskId, agentId, adminUser, driverNameOverride, driverPhoneOverride) => {
  let actualOrderId = orderId;
  let orderSnap = await get(ref(rtdb, `orders/${orderId}`));

  if (!orderSnap.exists()) {
    // Attempt lookup by order code without requiring server index
    const allOrdersSnap = await get(ref(rtdb, 'orders'));
    if (allOrdersSnap.exists()) {
      const allOrders = allOrdersSnap.val() || {};
      for (const [k, v] of Object.entries(allOrders)) {
        if (v && (v.code === orderId || v.order_number === orderId || v.id === orderId || k === orderId)) {
          actualOrderId = k;
          orderSnap = { exists: () => true, val: () => v };
          break;
        }
      }
    }
  }

  if (!orderSnap.exists()) throw new Error(`Order ${orderId} not found.`);
  const order = orderSnap.val();

  let agent = { name: driverNameOverride || 'Assigned Driver', phone: driverPhoneOverride || '+91 98765 43210' };
  if (agentId && typeof agentId === 'string' && !agentId.startsWith('d') && !agentId.includes(' ')) {
    const agentSnap = await get(ref(rtdb, `users/${agentId}`));
    if (agentSnap.exists()) {
      agent = agentSnap.val();
    }
  }

  const cleanAgentId = agentId || 'agent_default';
  const effectiveTaskId = taskId || order.pickupTaskId || `task_pk_${actualOrderId}`;
  const now = Date.now();

  const updates = {};
  updates[`orders/${actualOrderId}/status`] = 'PICKUP_SCHEDULED';
  updates[`orders/${actualOrderId}/assignedAgentId`] = cleanAgentId;
  updates[`orders/${actualOrderId}/assignedAgentName`] = agent.name;
  updates[`orders/${actualOrderId}/assignedAgentPhone`] = agent.phone || driverPhoneOverride || '+91 98765 43210';
  updates[`orders/${actualOrderId}/driver`] = `${agent.name} (${agent.phone || driverPhoneOverride || '+91 98765 43210'})`;
  updates[`orders/${actualOrderId}/pickupTaskId`] = effectiveTaskId;

  // Move status index
  updates[`ordersByStatus/PLACED/${actualOrderId}`] = null;
  updates[`ordersByStatus/PAYMENT_PENDING/${actualOrderId}`] = null;
  updates[`ordersByStatus/PICKUP_SCHEDULED/${actualOrderId}`] = now;

  // Ensure Task in tasks/
  updates[`tasks/${effectiveTaskId}/id`] = effectiveTaskId;
  updates[`tasks/${effectiveTaskId}/orderId`] = actualOrderId;
  updates[`tasks/${effectiveTaskId}/orderCode`] = order.code || order.order_number || actualOrderId;
  updates[`tasks/${effectiveTaskId}/type`] = 'pickup';
  updates[`tasks/${effectiveTaskId}/status`] = 'assigned';
  updates[`tasks/${effectiveTaskId}/agentId`] = cleanAgentId;
  updates[`tasks/${effectiveTaskId}/agentName`] = agent.name;
  updates[`tasks/${effectiveTaskId}/agentPhone`] = agent.phone || driverPhoneOverride || '+91 98765 43210';
  updates[`tasks/${effectiveTaskId}/scheduledAt`] = order.pickup?.date ? new Date(order.pickup.date).getTime() : now;
  updates[`tasks/${effectiveTaskId}/customer`] = {
    name: order.customerName || order.pickup_full_name || 'Customer',
    phone: order.customerPhone || order.pickup_phone || '+91 98765 43210'
  };
  updates[`tasks/${effectiveTaskId}/address`] = order.address || {
    areaColony: order.pickup_address || 'Bengaluru',
    city: 'Bengaluru'
  };

  const cleanAgentKey = cleanAgentId.replace(/[^a-zA-Z0-9_-]/g, '_');
  updates[`agentTasks/${cleanAgentKey}/${effectiveTaskId}`] = true;

  // Order history
  const histPush = push(ref(rtdb, `orderHistory/${actualOrderId}`));
  updates[`orderHistory/${actualOrderId}/${histPush.key}`] = {
    from: order.status,
    to: 'PICKUP_SCHEDULED',
    byUid: adminUser?.uid || 'admin',
    byName: adminUser?.name || 'Admin',
    note: `Assigned pickup agent: ${agent.name}`,
    at: now
  };

  let targetAgentUid = agentId;
  if (!targetAgentUid || targetAgentUid.startsWith('d') || targetAgentUid === 'agent_default') {
    const agentUids = await getRoleUserIds('agent');
    if (agentUids.length > 0) targetAgentUid = agentUids[0];
  }

  // Agent notification
  if (targetAgentUid) {
    addNotificationToUpdates(updates, targetAgentUid, {
      type: 'new_pickup',
      title: 'New Pickup Task',
      body: `Pickup assigned for order ${order.code || actualOrderId} at ${order.address?.areaColony || order.pickup_address || 'Customer Address'}.`,
      orderId: actualOrderId,
      createdAt: now
    });
  }

  // Customer notification
  if (order.customerId) {
    addNotificationToUpdates(updates, order.customerId, {
      type: 'pickup_scheduled',
      title: 'Pickup Scheduled',
      body: `${agent.name || 'A driver'} has been assigned to pick up your laundry order ${order.code || actualOrderId}.`,
      orderId: order.code || actualOrderId,
      createdAt: now
    });
  }

  await update(ref(rtdb), updates);
};

/**
 * 2. Admin assigns delivery agent -> OUT_FOR_DELIVERY
 */
export const assignDeliveryAgent = async (orderId, taskId, agentId, adminUser, driverNameOverride, driverPhoneOverride) => {
  let actualOrderId = orderId;
  let orderSnap = await get(ref(rtdb, `orders/${orderId}`));

  if (!orderSnap.exists()) {
    const allOrdersSnap = await get(ref(rtdb, 'orders'));
    if (allOrdersSnap.exists()) {
      const allOrders = allOrdersSnap.val() || {};
      for (const [k, v] of Object.entries(allOrders)) {
        if (v && (v.code === orderId || v.order_number === orderId || v.id === orderId || k === orderId)) {
          actualOrderId = k;
          orderSnap = { exists: () => true, val: () => v };
          break;
        }
      }
    }
  }

  if (!orderSnap.exists()) throw new Error(`Order ${orderId} not found.`);
  const order = orderSnap.val();

  let agent = { name: driverNameOverride || 'Assigned Driver', phone: driverPhoneOverride || '+91 98765 43210' };
  if (agentId && typeof agentId === 'string' && !agentId.startsWith('d') && !agentId.includes(' ')) {
    const agentSnap = await get(ref(rtdb, `users/${agentId}`));
    if (agentSnap.exists()) {
      agent = agentSnap.val();
    }
  }

  const cleanAgentId = agentId || 'agent_default';
  const effectiveTaskId = taskId || order.deliveryTaskId || `task_dl_${actualOrderId}`;
  const now = Date.now();

  const updates = {};
  updates[`orders/${actualOrderId}/deliveryTaskId`] = effectiveTaskId;
  updates[`orders/${actualOrderId}/assignedDeliveryAgentId`] = cleanAgentId;
  updates[`orders/${actualOrderId}/assignedDeliveryAgentName`] = agent.name;
  updates[`orders/${actualOrderId}/assignedDeliveryAgentPhone`] = agent.phone || driverPhoneOverride || '+91 98765 43210';
  updates[`orders/${actualOrderId}/driver`] = `${agent.name} (${agent.phone || driverPhoneOverride || '+91 98765 43210'})`;
  updates[`orders/${actualOrderId}/status`] = 'OUT_FOR_DELIVERY';

  // Ensure Task in tasks/
  updates[`tasks/${effectiveTaskId}/id`] = effectiveTaskId;
  updates[`tasks/${effectiveTaskId}/orderId`] = actualOrderId;
  updates[`tasks/${effectiveTaskId}/orderCode`] = order.code || order.order_number || actualOrderId;
  updates[`tasks/${effectiveTaskId}/type`] = 'delivery';
  updates[`tasks/${effectiveTaskId}/status`] = 'assigned';
  updates[`tasks/${effectiveTaskId}/agentId`] = cleanAgentId;
  updates[`tasks/${effectiveTaskId}/agentName`] = agent.name;
  updates[`tasks/${effectiveTaskId}/agentPhone`] = agent.phone || driverPhoneOverride || '+91 98765 43210';
  updates[`tasks/${effectiveTaskId}/scheduledAt`] = order.dueBy || now;
  updates[`tasks/${effectiveTaskId}/customer`] = {
    name: order.customerName || order.pickup_full_name || 'Customer',
    phone: order.customerPhone || order.pickup_phone || '+91 98765 43210'
  };
  updates[`tasks/${effectiveTaskId}/address`] = order.address || {
    areaColony: order.pickup_address || 'Bengaluru',
    city: 'Bengaluru'
  };

  const cleanAgentKey = cleanAgentId.replace(/[^a-zA-Z0-9_-]/g, '_');
  updates[`agentTasks/${cleanAgentKey}/${effectiveTaskId}`] = true;

  // Order history
  const histPush = push(ref(rtdb, `orderHistory/${actualOrderId}`));
  updates[`orderHistory/${actualOrderId}/${histPush.key}`] = {
    from: order.status,
    to: 'OUT_FOR_DELIVERY',
    byUid: adminUser?.uid || 'admin',
    byName: adminUser?.name || 'Admin',
    note: `Assigned delivery agent: ${agent.name}`,
    at: now
  };

  let targetAgentUid = agentId;
  if (!targetAgentUid || targetAgentUid.startsWith('d') || targetAgentUid === 'agent_default') {
    const agentUids = await getRoleUserIds('agent');
    if (agentUids.length > 0) targetAgentUid = agentUids[0];
  }

  // Notifications (same multi-path update)
  if (targetAgentUid) {
    addNotificationToUpdates(updates, targetAgentUid, {
      type: 'new_delivery',
      title: 'New Delivery Task',
      body: `Delivery task assigned for order ${order.code || actualOrderId} to ${order.address?.areaColony || 'Customer Address'}.`,
      orderId: actualOrderId,
      createdAt: now
    });
  }

  if (order.customerId) {
    addNotificationToUpdates(updates, order.customerId, {
      type: 'out_for_delivery',
      title: 'Order Out For Delivery',
      body: `${agent.name || 'A driver'} is on the way to deliver your order ${order.code || actualOrderId}.`,
      orderId: order.code || actualOrderId,
      createdAt: now
    });
  }

  await update(ref(rtdb), updates);
};

/**
 * 3. Admin status override (Audited with mandatory note)
 */
export const adminOverrideOrderStatus = async (orderId, newStatus, auditNote, adminUser) => {
  if (!auditNote || !auditNote.trim()) {
    throw new Error('An audit note is strictly required for Admin status override.');
  }

  const orderSnap = await get(ref(rtdb, `orders/${orderId}`));
  if (!orderSnap.exists()) throw new Error('Order not found.');
  const order = orderSnap.val();
  const oldStatus = order.status;
  const now = Date.now();

  const histPush = push(ref(rtdb, `orderHistory/${orderId}`));
  const updates = {};
  updates[`orders/${orderId}/status`] = newStatus;
  if (oldStatus !== newStatus) {
    updates[`ordersByStatus/${oldStatus}/${orderId}`] = null;
    updates[`ordersByStatus/${newStatus}/${orderId}`] = now;
  }

  updates[`orderHistory/${orderId}/${histPush.key}`] = {
    from: oldStatus,
    to: newStatus,
    byUid: adminUser.uid,
    byName: adminUser.name || 'Admin',
    note: `[ADMIN OVERRIDE] ${auditNote.trim()}`,
    at: now
  };

  await update(ref(rtdb), updates);
};

/**
 * 4. Reply to customer complaint
 */
export const replyToSupportComplaint = async (complaintId, replyMessage, adminUser) => {
  const compSnap = await get(ref(rtdb, `complaints/${complaintId}`));
  if (!compSnap.exists()) throw new Error('Complaint ticket not found.');
  const complaint = compSnap.val();
  const now = Date.now();

  const msgPush = push(ref(rtdb, `complaintMessages/${complaintId}`));
  const notifPush = push(ref(rtdb, `notifications/${complaint.customerId}`));

  const updates = {};
  updates[`complaints/${complaintId}/status`] = 'Resolved';
  updates[`complaints/${complaintId}/updatedAt`] = now;
  updates[`complaintMessages/${complaintId}/${msgPush.key}`] = {
    id: msgPush.key,
    senderUid: adminUser.uid,
    senderRole: 'admin',
    message: replyMessage,
    sentAt: now
  };

  addNotificationToUpdates(updates, complaint.customerId, {
    type: 'complaint_reply',
    title: `Response to Ticket ${complaint.ticketId}`,
    body: replyMessage,
    orderId: complaint.orderId || null,
    createdAt: now
  });

  await update(ref(rtdb), updates);
};

/**
 * Subscriptions for Admin Portal
 */
export const subscribeAdminOrders = (onOrdersUpdated, onError) => {
  const ordersQuery = query(ref(rtdb, 'orders'), limitToLast(100));
  const unsub = onValue(ordersQuery, (snap) => {
    if (!snap.exists()) {
      onOrdersUpdated([]);
      return;
    }
    const data = snap.val();
    const list = Object.keys(data).map(k => ({ ...data[k], id: k })).sort((a, b) => {
      const timeA = a.updatedAt || a.placedAt || a.createdAt || 0;
      const timeB = b.updatedAt || b.placedAt || b.createdAt || 0;
      return timeB - timeA;
    });
    onOrdersUpdated(list);
  }, onError);

  return () => off(ordersQuery, 'value', unsub);
};

export const subscribeAdminTasks = (onTasksUpdated, onError) => {
  const tasksRef = ref(rtdb, 'tasks');
  const unsub = onValue(tasksRef, (snap) => {
    if (!snap.exists()) {
      onTasksUpdated([]);
      return;
    }
    const data = snap.val();
    const list = Object.keys(data).map(k => ({ ...data[k], id: k })).sort((a, b) => {
      const timeA = a.updatedAt || a.createdAt || a.scheduledAt || 0;
      const timeB = b.updatedAt || b.createdAt || b.scheduledAt || 0;
      return timeB - timeA;
    });
    onTasksUpdated(list);
  }, onError);

  return () => off(tasksRef, 'value', unsub);
};

export const subscribeAdminAgents = (onAgentsUpdated, onError) => {
  const usersQuery = query(ref(rtdb, 'users'), orderByChild('role'), equalTo('agent'));
  const unsub = onValue(usersQuery, (snap) => {
    if (!snap.exists()) {
      onAgentsUpdated([]);
      return;
    }
    const data = snap.val();
    const list = Object.keys(data).map(k => ({ ...data[k], id: k }));
    onAgentsUpdated(list);
  }, onError);

  return () => off(usersQuery, 'value', unsub);
};

export const subscribeAdminCustomers = (onCustomersUpdated, onError) => {
  const usersQuery = query(ref(rtdb, 'users'), orderByChild('role'), equalTo('customer'));
  const unsub = onValue(usersQuery, (snap) => {
    if (!snap.exists()) {
      onCustomersUpdated([]);
      return;
    }
    const data = snap.val();
    const list = Object.keys(data).map(k => ({ ...data[k], id: k }));
    onCustomersUpdated(list);
  }, onError);

  return () => off(usersQuery, 'value', unsub);
};

/**
 * Subscribe to all users in RTDB (Customers, Staff, Delivery Agents, Admins)
 */
export const subscribeAdminAllUsers = (onUsersUpdated, onError) => {
  const usersRef = ref(rtdb, 'users');
  const unsub = onValue(usersRef, (snap) => {
    if (!snap.exists()) {
      onUsersUpdated([]);
      return;
    }
    const data = snap.val() || {};
    const list = Object.keys(data).map(k => {
      const u = data[k] || {};
      const isActive = u.isActive !== false && u.status !== 'Inactive';
      return {
        ...u,
        id: k,
        uid: k,
        isActive,
        status: isActive ? 'Active' : 'Inactive'
      };
    });
    onUsersUpdated(list);
  }, (err) => {
    console.warn('Admin all users listener warning:', err);
    if (onError) onError(err);
  });

  return () => off(usersRef, 'value', unsub);
};

/**
 * Subscribe to admin settings in RTDB
 */
export const subscribeAdminSettings = (onSettingsUpdated, onError) => {
  const settingsRef = ref(rtdb, 'adminSettings');
  const unsub = onValue(settingsRef, (snap) => {
    if (!snap.exists()) {
      onSettingsUpdated(null);
      return;
    }
    onSettingsUpdated(snap.val());
  }, onError);

  return () => off(settingsRef, 'value', unsub);
};

export const saveAdminSettings = async (newSettings) => {
  const settingsRef = ref(rtdb, 'adminSettings');
  await update(settingsRef, {
    ...newSettings,
    updatedAt: Date.now()
  });
  return true;
};

/**
 * Admin updates a user profile
 */
export const updateAdminUser = async (uid, updateFields) => {
  const cleanUid = String(uid).trim();
  const updates = {
    ...updateFields,
    updatedAt: Date.now()
  };
  await update(ref(rtdb, `users/${cleanUid}`), updates);
  if (updateFields.role === 'agent' || updateFields.role === 'delivery' || updateFields.vehicleType || updateFields.vehicleNumber) {
    await update(ref(rtdb, `agents/${cleanUid}`), {
      ...(updateFields.vehicleType ? { vehicleType: updateFields.vehicleType } : {}),
      ...(updateFields.vehicleNumber ? { vehicleNumber: updateFields.vehicleNumber } : {}),
      ...(updateFields.area ? { assignedArea: updateFields.area } : {}),
      updatedAt: Date.now()
    }).catch(() => {});
  }
  return true;
};

/**
 * Admin toggles user status (Active / Inactive)
 */
export const toggleAdminUserStatus = async (uid, currentStatus) => {
  const cleanUid = String(uid).trim();
  const isCurrentlyActive = currentStatus === 'Active' || currentStatus === true;
  const newIsActive = !isCurrentlyActive;
  const newStatus = newIsActive ? 'Active' : 'Inactive';
  await update(ref(rtdb, `users/${cleanUid}`), {
    isActive: newIsActive,
    status: newStatus,
    updatedAt: Date.now()
  });
  return newStatus;
};

/**
 * Admin deletes a user
 */
export const deleteAdminUser = async (uid) => {
  const cleanUid = String(uid).trim();
  await set(ref(rtdb, `users/${cleanUid}`), null);
  await set(ref(rtdb, `agents/${cleanUid}`), null).catch(() => {});
  return true;
};

export const subscribeAdminDashboardStats = (onStatsUpdated, onError) => {
  const todayKey = getTodayKey();
  const statsRef = ref(rtdb, `stats/daily/${todayKey}`);
  const unsub = onValue(statsRef, (snap) => {
    const stats = snap.exists() ? snap.val() : { ordersPlaced: 0, revenue: 0, completedOrders: 0 };
    onStatsUpdated(stats);
  }, onError);

  return () => off(statsRef, 'value', unsub);
};

export const subscribeAdminComplaints = (onComplaintsUpdated, onError) => {
  const complaintsRef = ref(rtdb, 'complaints');
  const unsub = onValue(complaintsRef, (snap) => {
    if (!snap.exists()) {
      onComplaintsUpdated([]);
      return;
    }
    const data = snap.val();
    const list = Object.keys(data).map(k => ({ ...data[k], id: k })).reverse();
    onComplaintsUpdated(list);
  }, onError);

  return () => off(complaintsRef, 'value', unsub);
};

export const subscribeAdminNotifications = (onNotifsUpdated, onError) => {
  const notifsQuery = query(ref(rtdb, 'notificationsByRole/admin'), limitToLast(40));
  const unsub = onValue(notifsQuery, (snap) => {
    if (!snap.exists()) {
      onNotifsUpdated([]);
      return;
    }
    const data = snap.val();
    const list = Object.keys(data).map(k => ({ ...data[k], id: k })).reverse();
    onNotifsUpdated(list);
  }, onError);

  return () => off(notifsQuery, 'value', unsub);
};

// ===============================================================
// SERVICES CATALOG MANAGEMENT & SUBSCRIPTION
// ===============================================================

/**
 * Generate complete 69 admin items matching Customer Portal subcategories and configurations
 */
export const generateAdminServicesList = () => {
  return PRICING_ITEMS.map((item, index) => {
    const subcatName = item.subcategory === 'men' 
      ? 'Men' 
      : item.subcategory === 'women' 
        ? 'Women' 
        : item.subcategory === 'kids' 
          ? 'Kids' 
          : 'Household';

    // Primary Service category matching Customer Portal categorization
    let category = 'Wash & Fold';
    const nameLower = (item.name || '').toLowerCase();
    const itemId = item.id;

    if (item.subcategory === 'household') {
      category = 'Household';
    } else if (
      itemId === 'men-suit-2pc' || 
      itemId === 'men-blazer' || 
      itemId === 'men-jacket' ||
      itemId === 'women-gown' || 
      itemId === 'women-lehenga' || 
      itemId === 'women-suit' ||
      itemId === 'women-saree' ||
      itemId === 'women-anarkali-dress' ||
      nameLower.includes('suit') || 
      nameLower.includes('blazer') ||
      nameLower.includes('gown') ||
      nameLower.includes('lehenga') ||
      nameLower.includes('saree')
    ) {
      category = 'Dry Cleaning';
    } else {
      category = 'Wash & Fold';
    }

    // Base price matching Customer Portal (Wash & Fold rate or fallback)
    const basePrice = item.prices?.['wash-fold'] || item.prices?.['wash-iron'] || 50;

    // Turnaround time: 1–2 days for everyday, 2–3 days for delicate/household
    const turnaround = (item.subcategory === 'household' || category === 'Dry Cleaning')
      ? '2–3 days'
      : '1–2 days';

    // Type: Premium for sets or dry cleaning or >= 100, Standard otherwise
    const isPremium = item.unit === 'set' || basePrice >= 100 || category === 'Dry Cleaning';
    const type = isPremium ? 'Premium' : 'Standard';

    // Contextual description matching Customer Portal subcategory
    let description = `${subcatName} · ${item.name} cleaning and fabric care`;
    if (category === 'Household') {
      description = `Household linen care & sanitization`;
    } else if (category === 'Dry Cleaning') {
      description = `Special fabric dry cleaning & pressing`;
    } else if (nameLower.includes('shirt')) {
      description = `Regular shirt cleaning and pressing`;
    } else if (nameLower.includes('jeans')) {
      description = `Denim washing and care`;
    } else if (nameLower.includes('t-shirt') || nameLower.includes('tshirt')) {
      description = `Regular wash and fold`;
    }

    return {
      id: index + 1,
      code: item.id,
      name: item.name,
      description,
      category,
      subcategory: item.subcategory,
      subcategoryId: item.subcategory,
      subcatName,
      price: basePrice,
      prices: item.prices,
      unit: item.unit || 'item',
      turnaround,
      status: 'Active',
      icon: item.name,
      type
    };
  });
};

export const DEFAULT_SERVICES = generateAdminServicesList();

/**
 * Realtime subscription to services in Realtime Database
 */
export const subscribeAdminServices = (onServicesUpdated, onError) => {
  const servicesRef = ref(rtdb, 'services');
  const unsub = onValue(servicesRef, (snap) => {
    if (!snap.exists()) {
      onServicesUpdated(DEFAULT_SERVICES);
      seedAdminServicesIfEmpty(DEFAULT_SERVICES, true).catch(() => {});
      return;
    }
    const data = snap.val();
    const rawList = data ? Object.keys(data).map(k => ({ ...data[k], id: data[k].id || k })) : [];

    // Detect if RTDB has incomplete dummy data or fewer than 69 items
    const isOldIncomplete = rawList.length < 69 || rawList.some(s => 
      !s.category || s.price === undefined || s.price === null ||
      s.category === 'Special Care' || s.category === 'Special'
    );

    if (isOldIncomplete) {
      // Overwrite RTDB with the full 69 services matching Customer Portal
      seedAdminServicesIfEmpty(DEFAULT_SERVICES, true).catch(() => {});
      onServicesUpdated(DEFAULT_SERVICES);
      return;
    }

    const list = rawList.map(item => {
      let cat = item.category || item.category_name || 'Wash & Fold';
      const nameLower = String(item.name || '').toLowerCase();
      if (item.subcategory === 'household' || nameLower.includes('bedsheet') || nameLower.includes('blanket') || nameLower.includes('curtain') || nameLower.includes('carpet')) {
        cat = 'Household';
      } else if (cat === 'Special Care' || cat === 'Special') {
        cat = nameLower.includes('saree') ? 'Dry Cleaning' : 'Household';
      }
      return {
        ...item,
        price: Number(item.price) || 0,
        status: item.status || (item.isActive === false ? 'Inactive' : 'Active'),
        category: cat,
        subcategory: item.subcategory || (cat === 'Household' ? 'household' : 'men'),
        subcategoryId: item.subcategory || (cat === 'Household' ? 'household' : 'men'),
        subcatName: item.subcatName || (item.subcategory ? item.subcategory.charAt(0).toUpperCase() + item.subcategory.slice(1) : (cat === 'Household' ? 'Household' : 'Men')),
        turnaround: item.turnaround || item.turnaround_time || '1–2 days',
        type: item.type || (Number(item.price) > 200 ? 'Premium' : (String(item.name || '').toLowerCase().includes('express') ? 'Express' : 'Standard'))
      };
    });

    onServicesUpdated(list);
  }, (err) => {
    onServicesUpdated(DEFAULT_SERVICES);
    if (onError) onError(err);
  });

  return () => off(servicesRef, 'value', unsub);
};

/**
 * Seed full 69 services into RTDB if not present or incomplete
 */
export const seedAdminServicesIfEmpty = async (initialServices = DEFAULT_SERVICES, forceOverwrite = false) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return null;

    let role = null;
    try {
      const cached = JSON.parse(localStorage.getItem('fabricare_user') || '{}');
      role = cached?.role;
    } catch (_) {}

    if (role !== 'admin') return null;

    const servicesRef = ref(rtdb, 'services');
    const snap = await get(servicesRef);
    const existing = snap.val();
    const isOldIncomplete = !snap.exists() || !existing || Object.keys(existing).length < 69 || Object.values(existing).some(s => 
      !s.category || !s.price || s.category === 'Special Care' || s.category === 'Special'
    );

    if (forceOverwrite || isOldIncomplete) {
      const seedObj = {};
      initialServices.forEach(s => {
        seedObj[s.id] = {
          ...s,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
      });
      await set(servicesRef, seedObj);
      return initialServices;
    }
    return Object.values(existing);
  } catch (err) {
    const isPermError = err?.code === 'PERMISSION_DENIED' || String(err?.message || '').toLowerCase().includes('permission_denied') || String(err?.message || '').toLowerCase().includes('permission denied');
    if (!isPermError) {
      console.warn('Could not seed services in RTDB:', err);
    }
    return null;
  }
};

/**
 * Add a new service
 */
export const addAdminService = async (serviceData) => {
  const serviceId = String(serviceData.id || `srv_${Date.now()}`);
  const newService = {
    id: serviceId,
    name: serviceData.name || 'New Service',
    description: serviceData.description || '',
    category: serviceData.category || 'Wash & Fold',
    price: Number(serviceData.price) || 100,
    turnaround: serviceData.turnaround || '1–2 days',
    status: (serviceData.status === true || serviceData.status === 'Active') ? 'Active' : 'Inactive',
    icon: serviceData.icon || 'Shirt',
    type: serviceData.type || (Number(serviceData.price) > 200 ? 'Premium' : (String(serviceData.name || '').toLowerCase().includes('express') ? 'Express' : 'Standard')),
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  try {
    await set(ref(rtdb, `services/${serviceId}`), newService);
  } catch (e) {
    console.warn('RTDB add service notice:', e);
  }
  return newService;
};

/**
 * Update an existing service
 */
export const updateAdminService = async (serviceId, updateFields) => {
  const cleanId = String(serviceId).trim();
  const updates = {
    ...updateFields,
    updatedAt: Date.now()
  };
  try {
    await update(ref(rtdb, `services/${cleanId}`), updates);
  } catch (e) {
    console.warn('RTDB update service notice:', e);
  }

  return true;
};

/**
 * Delete a service
 */
export const deleteAdminService = async (serviceId) => {
  const cleanId = String(serviceId).trim();
  try {
    await set(ref(rtdb, `services/${cleanId}`), null);
  } catch (e) {
    console.warn('RTDB delete service notice:', e);
  }

  return true;
};

/**
 * Toggle active/inactive status
 */
export const toggleAdminServiceStatus = async (serviceId, currentStatus) => {
  const cleanId = String(serviceId).trim();
  const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
  try {
    await update(ref(rtdb, `services/${cleanId}`), {
      status: newStatus,
      updatedAt: Date.now()
    });
  } catch (e) {
    console.warn('RTDB toggle service status notice:', e);
  }

  return newStatus;
};

/**
 * Fetch latest admin orders from RTDB with Django database sync
 */
export const fetchAdminOrdersOnce = async () => {
  let list = [];
  try {
    const snap = await get(ref(rtdb, 'orders'));
    if (snap.exists()) {
      const data = snap.val() || {};
      list = Object.keys(data).map(k => ({ ...data[k], id: data[k].id || k, rawId: k }));
    }
  } catch (err) {
    console.warn('RTDB fetchAdminOrdersOnce notice:', err);
  }



  list.sort((a, b) => {
    const timeA = a.updatedAt || a.placedAt || a.createdAt || 0;
    const timeB = b.updatedAt || b.placedAt || b.createdAt || 0;
    return timeB - timeA;
  });

  return list;
};

/**
 * Fetch latest admin users from RTDB with Django database sync
 */
export const fetchAdminUsersOnce = async () => {
  let list = [];
  try {
    const snap = await get(ref(rtdb, 'users'));
    if (snap.exists()) {
      const data = snap.val() || {};
      list = Object.keys(data).map(k => {
        const u = data[k] || {};
        const isActive = u.isActive !== false && u.status !== 'Inactive';
        return {
          ...u,
          id: k,
          uid: k,
          isActive,
          status: isActive ? 'Active' : 'Inactive'
        };
      });
    }
  } catch (err) {
    console.warn('RTDB fetchAdminUsersOnce notice:', err);
  }



  return list;
};

/**
 * Fetch latest admin services from RTDB with Django database sync
 */
export const fetchAdminServicesOnce = async () => {
  let list = [];
  try {
    const snap = await get(ref(rtdb, 'services'));
    if (snap.exists()) {
      const data = snap.val() || {};
      list = Object.keys(data).map(k => ({ ...data[k], id: data[k].id || k }));
    }
  } catch (err) {
    console.warn('RTDB fetchAdminServicesOnce notice:', err);
  }



  if (list.length < 69) {
    list = DEFAULT_SERVICES;
    seedAdminServicesIfEmpty(DEFAULT_SERVICES, true).catch(() => {});
  }

  return list.map(item => {
    let cat = item.category || item.category_name || 'Wash & Fold';
    const nameLower = String(item.name || '').toLowerCase();
    if (item.subcategory === 'household' || nameLower.includes('bedsheet') || nameLower.includes('blanket') || nameLower.includes('curtain') || nameLower.includes('carpet')) {
      cat = 'Household';
    } else if (cat === 'Special Care' || cat === 'Special') {
      cat = nameLower.includes('saree') ? 'Dry Cleaning' : 'Household';
    }
    return {
      ...item,
      price: Number(item.price) || 0,
      status: item.status || (item.isActive === false ? 'Inactive' : 'Active'),
      category: cat,
      subcategory: item.subcategory || (cat === 'Household' ? 'household' : 'men'),
      subcategoryId: item.subcategory || (cat === 'Household' ? 'household' : 'men'),
      subcatName: item.subcatName || (item.subcategory ? item.subcategory.charAt(0).toUpperCase() + item.subcategory.slice(1) : (cat === 'Household' ? 'Household' : 'Men')),
      turnaround: item.turnaround || item.turnaround_time || '1–2 days',
      type: item.type || (Number(item.price) > 200 ? 'Premium' : (String(item.name || '').toLowerCase().includes('express') ? 'Express' : 'Standard'))
    };
  });
};

