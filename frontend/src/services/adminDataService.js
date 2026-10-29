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
import { rtdb, auth } from '../config/firebase.js';
import { addNotificationToUpdates, addRoleNotificationsToUpdates, getRoleUserIds, findUidByEmail } from './notificationService.js';
import { 
  PRICING_ITEMS, 
  PRICING_SUBCATEGORIES,
  isItemApplicableToService,
  getExpressItemPrice,
  getItemBasePrice,
  setLiveAdminCatalog
} from '../data/pricingData.js';

const getTodayKey = () => new Date().toISOString().split('T')[0];

export const isPermissionError = (err) => {
  if (!err) return false;
  const msg = String(err?.message || err || '').toLowerCase();
  const code = String(err?.code || '').toLowerCase();
  return (
    code === 'permission_denied' ||
    code.includes('permission') ||
    msg.includes('permission_denied') ||
    msg.includes('permission denied') ||
    msg.includes('permission')
  );
};

export const syncOrderAssignmentToDjango = async (orderId, driver, options = {}) => {
  const cleanId = String(orderId || '').replace(/^#/, '').trim();
  const rawId = String(orderId || '').trim();
  const endpoints = [
    `http://127.0.0.1:8000/api/admin/orders/${cleanId}/assign-staff/`,
    `http://127.0.0.1:8000/api/orders/${cleanId}/assign-staff/`,
    `http://127.0.0.1:8000/api/admin/orders/${rawId}/assign-staff/`,
    `http://127.0.0.1:8000/api/orders/${rawId}/assign-staff/`
  ];

  const payload = {
    pickup_driver_id: driver?.djangoId || 3,
    driver_name: driver?.name || 'Ravi Kumar',
    driver_phone: driver?.phone || '+91 98765 43210',
    pickup_date: options.pickupDate,
    pickup_time_slot: options.pickupTimeSlot,
    status: 'PICKUP_ASSIGNED',
    note: options.note || ''
  };

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (_) {}
  }
  return null;
};

/**
 * 1. Admin assigns pickup agent -> PICKUP_SCHEDULED
 */
export const assignPickupAgent = async (orderId, taskId, agentId, adminUser, driverNameOverride, driverPhoneOverride, options = {}) => {
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

  if (!orderSnap.exists()) {
    const cleanCode = String(orderId || '').replace(/[^a-zA-Z0-9-]/g, '').toUpperCase() || 'FC-10289';
    actualOrderId = `ord_${cleanCode.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const newOrderObj = {
      code: cleanCode,
      order_number: cleanCode,
      id: actualOrderId,
      status: 'PICKUP_SCHEDULED',
      customerName: 'Customer',
      customerPhone: '+91 98765 43210',
      pickup_address: 'HRBR Layout, Bengaluru',
      address: {
        areaColony: 'House #12, 3rd Cross, HRBR Layout',
        city: 'Bengaluru',
        flatHouse: 'Banaswadi, Bengaluru - 560043',
        pincode: '560043'
      },
      createdAt: Date.now(),
      placedAt: Date.now()
    };
    orderSnap = { exists: () => true, val: () => newOrderObj };
  }
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

  // Persist confirmed pickup date and time
  if (options.pickupDate) {
    updates[`orders/${actualOrderId}/pickup_date`] = options.pickupDate;
    updates[`orders/${actualOrderId}/pickupDate`] = options.pickupDate;
    updates[`orders/${actualOrderId}/pickup/date`] = options.pickupDate;
  }
  if (options.pickupTimeSlot) {
    updates[`orders/${actualOrderId}/pickup_time_slot`] = options.pickupTimeSlot;
    updates[`orders/${actualOrderId}/pickup/time`] = options.pickupTimeSlot;
    const finalDateStr = options.pickupDate || order.pickup_date || order.pickup?.date || '';
    updates[`orders/${actualOrderId}/pickupTime`] = `${finalDateStr}, ${options.pickupTimeSlot}`;
  }

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
  updates[`tasks/${effectiveTaskId}/scheduledAt`] = options.pickupDate 
    ? (new Date(options.pickupDate).getTime() || now)
    : (order.pickup?.date ? new Date(order.pickup.date).getTime() : now);
  if (options.pickupDate) {
    updates[`tasks/${effectiveTaskId}/pickup_date`] = options.pickupDate;
  }
  if (options.pickupTimeSlot) {
    updates[`tasks/${effectiveTaskId}/pickup_time_slot`] = options.pickupTimeSlot;
    updates[`tasks/${effectiveTaskId}/timeSlot`] = options.pickupTimeSlot;
  }
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
    note: `Assigned pickup agent: ${agent.name}${options.note ? ` | Note: ${options.note}` : ''}`,
    at: now
  };

  let targetAgentUid = agentId;
  if (!targetAgentUid || targetAgentUid.startsWith('d') || targetAgentUid === 'agent_default') {
    const agentUids = await getRoleUserIds('agent');
    if (agentUids.length > 0) targetAgentUid = agentUids[0];
    else targetAgentUid = 'b0DHZGmo4mVuhPTS9HngWS7VulB2';
  }

  const pickupOrderCode = order.code || actualOrderId;
  const pickupAddressArea = order.address?.areaColony || order.pickup_address || 'Customer Address';
  const pickupNotifPayload = {
    type: 'new_pickup',
    title: 'New Pickup Task',
    body: `Pickup assigned for order ${pickupOrderCode} at ${pickupAddressArea}.`,
    orderId: pickupOrderCode,
    orderCode: pickupOrderCode,
    createdAt: now
  };

  // Agent notification
  if (targetAgentUid) {
    addNotificationToUpdates(updates, targetAgentUid, pickupNotifPayload);
  }
  await addRoleNotificationsToUpdates(updates, 'agent', pickupNotifPayload);
  await addRoleNotificationsToUpdates(updates, 'delivery', pickupNotifPayload);
  await addRoleNotificationsToUpdates(updates, 'driver', pickupNotifPayload);

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

  // Sync to Django SQLite backend
  try {
    await syncOrderAssignmentToDjango(actualOrderId, agent, options);
  } catch (err) {
    console.warn('Sync to Django backend note:', err);
  }
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

  if (!orderSnap.exists()) {
    const cleanCode = String(orderId || '').replace(/[^a-zA-Z0-9-]/g, '').toUpperCase() || 'FC-10288';
    actualOrderId = `ord_${cleanCode.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const newOrderObj = {
      code: cleanCode,
      order_number: cleanCode,
      id: actualOrderId,
      status: 'OUT_FOR_DELIVERY',
      customerName: 'Customer',
      customerPhone: '+91 98765 43210',
      delivery_address: 'HRBR Layout, Bengaluru',
      address: {
        areaColony: 'House #12, 3rd Cross, HRBR Layout',
        city: 'Bengaluru',
        flatHouse: 'Banaswadi, Bengaluru - 560043',
        pincode: '560043'
      },
      createdAt: Date.now(),
      placedAt: Date.now()
    };
    orderSnap = { exists: () => true, val: () => newOrderObj };
  }
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
    else targetAgentUid = 'b0DHZGmo4mVuhPTS9HngWS7VulB2';
  }

  const deliveryOrderCode = order.code || order.order_number || actualOrderId;
  const deliveryAddressArea = order.address?.areaColony || order.delivery_address || 'Customer Address';
  const deliveryNotifPayload = {
    type: 'new_delivery',
    title: 'New Delivery Task',
    body: `Delivery assigned for order ${deliveryOrderCode} at ${deliveryAddressArea}.`,
    orderId: deliveryOrderCode,
    orderCode: deliveryOrderCode,
    createdAt: now
  };

  // Notifications (same multi-path update)
  if (targetAgentUid) {
    addNotificationToUpdates(updates, targetAgentUid, deliveryNotifPayload);
  }
  await addRoleNotificationsToUpdates(updates, 'agent', deliveryNotifPayload);
  await addRoleNotificationsToUpdates(updates, 'delivery', deliveryNotifPayload);
  await addRoleNotificationsToUpdates(updates, 'driver', deliveryNotifPayload);

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
export const replyToSupportComplaint = async (complaintId, replyMessage, adminUser, options = {}) => {
  let complaint = null;
  let isComplaintNode = false;
  const now = Date.now();

  try {
    const compSnap = await get(ref(rtdb, `complaints/${complaintId}`));
    if (compSnap && compSnap.exists()) {
      complaint = compSnap.val();
      isComplaintNode = true;
    }
  } catch (_) {}

  if (!complaint) {
    try {
      const supSnap = await get(ref(rtdb, `support_tickets/${complaintId}`));
      if (supSnap && supSnap.exists()) {
        complaint = supSnap.val();
      }
    } catch (_) {}
  }

  if (!complaint) {
    try {
      const allSupSnap = await get(ref(rtdb, 'support_tickets'));
      if (allSupSnap && allSupSnap.exists()) {
        const allVal = allSupSnap.val() || {};
        for (const [k, v] of Object.entries(allVal)) {
          if (k === String(complaintId) || String(v?.id) === String(complaintId) || String(v?.ticket_number) === String(complaintId)) {
            complaint = v;
            break;
          }
        }
      }
    } catch (_) {}
  }

  // Fallback minimal complaint object if not in RTDB yet
  if (!complaint) {
    complaint = {
      id: complaintId,
      ticket_number: String(complaintId).startsWith('#') ? complaintId : `#SUP-${complaintId}`
    };
  }

  let targetCustomerId = complaint.customerId || complaint.customer_id || complaint.uid || options.customerId;
  const custEmail = complaint.customer_email || complaint.customerEmail || options.customerEmail;
  if (!targetCustomerId && custEmail) {
    targetCustomerId = await findUidByEmail(custEmail);
  }

  const updates = {};
  const isResolved = options.status === 'RESOLVED' || options.status === 'Resolved' || options.status === 'Closed';
  const targetStatus = options.status || (isResolved ? 'RESOLVED' : 'IN_PROGRESS');

  if (isComplaintNode) {
    const msgPush = push(ref(rtdb, `complaintMessages/${complaintId}`));
    updates[`complaints/${complaintId}/status`] = isResolved ? 'Resolved' : 'In Progress';
    updates[`complaints/${complaintId}/updatedAt`] = now;
    updates[`complaintMessages/${complaintId}/${msgPush.key}`] = {
      id: msgPush.key,
      senderUid: adminUser?.uid || 'admin',
      senderRole: 'admin',
      message: replyMessage,
      sentAt: now
    };
  }

  const supKey = String(complaint.id || complaintId);
  updates[`support_tickets/${supKey}/status`] = targetStatus;
  updates[`support_tickets/${supKey}/admin_reply`] = replyMessage;
  updates[`support_tickets/${supKey}/admin_reply_at`] = new Date(now).toISOString();
  updates[`support_tickets/${supKey}/updatedAt`] = now;

  const ticketNum = complaint.ticket_number || complaint.ticketNumber || complaint.ticketId || (String(complaintId).startsWith('#') ? complaintId : `#SUP-${complaintId}`);

  if (targetCustomerId) {
    addNotificationToUpdates(updates, targetCustomerId, {
      type: isResolved ? 'support_resolved' : 'support_reply',
      title: isResolved ? `Support Ticket Resolved: ${ticketNum}` : `Support Ticket Response: ${ticketNum}`,
      body: replyMessage || (isResolved ? `Your ticket ${ticketNum} has been marked as resolved.` : 'Admin responded to your support ticket.'),
      ticketId: ticketNum,
      ticketNumber: ticketNum,
      orderId: complaint.orderId || null,
      createdAt: now
    });
  }

  await update(ref(rtdb), updates).catch(err => {
    console.warn('replyToSupportComplaint update error:', err);
  });
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
    if (!isPermissionError(err)) {
      console.warn('Admin all users listener warning:', err);
    }
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
export const deleteAdminUser = async (uid, extraIdentifiers = []) => {
  const cleanUid = String(uid || '').trim();
  if (cleanUid) {
    await set(ref(rtdb, `users/${cleanUid}`), null).catch(() => {});
    await set(ref(rtdb, `agents/${cleanUid}`), null).catch(() => {});
  }

  // Persist all deleted identifiers in RTDB under deleted_users
  const allIds = [cleanUid, ...extraIdentifiers].filter(Boolean);
  for (const id of allIds) {
    const rawStr = String(id).trim();
    if (!rawStr) continue;
    const sanitized = rawStr.replace(/[.#$[\]/]/g, '_').toLowerCase();
    await set(ref(rtdb, `deleted_users/${sanitized}`), true).catch(() => {});
  }

  // Also sync delete to Django backend if applicable
  for (const id of allIds) {
    if (typeof id === 'string' && id.includes('@')) {
      fetch(`http://127.0.0.1:8000/api/admin/users?email=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});
    } else if (String(id).match(/^\d+$/)) {
      fetch(`http://127.0.0.1:8000/api/admin/users/${id}/`, { method: 'DELETE' }).catch(() => {});
    }
  }

  return true;
};

/**
 * Subscribe to permanently deleted users in RTDB
 */
export const subscribeAdminDeletedUsers = (onDeletedUsersUpdated, onError) => {
  const delRef = ref(rtdb, 'deleted_users');
  const unsub = onValue(delRef, (snap) => {
    if (!snap.exists()) {
      onDeletedUsersUpdated([]);
      return;
    }
    const val = snap.val() || {};
    onDeletedUsersUpdated(Object.keys(val));
  }, (err) => {
    if (!isPermissionError(err)) {
      console.warn('Deleted users listener error:', err);
    }
    if (onError) onError(err);
  });

  return () => off(delRef, 'value', unsub);
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
    const list = Object.keys(data).map(k => ({ ...data[k], id: k })).sort((a, b) => {
      const getT = (item) => {
        if (!item) return 0;
        const ts = [item.createdAt, item.updatedAt, item.created_at, item.updated_at, item.report_date, item.formatted_report_date, item.date];
        for (const t of ts) {
          if (typeof t === 'number' && t > 0) return t;
          if (typeof t === 'string' && t.trim()) {
            const p = new Date(t).getTime();
            if (!isNaN(p) && p > 0) return p;
          }
        }
        const idStr = String(item.id || item.order_id || '');
        const m = idStr.match(/\b(17\d{11,13})\b/);
        if (m) return Number(m[1]);
        const d = idStr.replace(/\D/g, '');
        return d ? parseInt(d, 10) : 0;
      };
      return getT(b) - getT(a);
    });
    onComplaintsUpdated(list);
  }, onError);

  return () => off(complaintsRef, 'value', unsub);
};

export const subscribeAdminSupportTickets = (onTicketsUpdated, onError) => {
  const ticketsRef = ref(rtdb, 'support_tickets');
  const unsub = onValue(ticketsRef, (snap) => {
    if (!snap.exists()) {
      onTicketsUpdated([]);
      return;
    }
    const data = snap.val();
    const list = Object.keys(data).map(k => ({ ...data[k], id: data[k].id || k })).sort((a, b) => {
      const timeA = new Date(b.created_at || b.createdAt || 0).getTime();
      const timeB = new Date(a.created_at || a.createdAt || 0).getTime();
      return timeA - timeB;
    });
    onTicketsUpdated(list);
  }, onError);

  return () => off(ticketsRef, 'value', unsub);
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

    if (item.subcategory === 'household' || itemId === 'kids-blanket' || nameLower.includes('blanket') || nameLower.includes('bedsheet')) {
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

    // Turnaround time: 2–3 days for normal services (at least two days advance rule), 24 hours for Express
    const turnaround = '2–3 days';

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

    // Determine all applicable services from the 4 existing core services
    const applicableServices = [];
    if (isItemApplicableToService(item, 'wash-fold')) applicableServices.push('Wash & Fold');
    if (isItemApplicableToService(item, 'wash-iron')) applicableServices.push('Wash & Iron');
    if (isItemApplicableToService(item, 'dry-cleaning')) applicableServices.push('Dry Cleaning');
    if (isItemApplicableToService(item, 'steam-iron')) applicableServices.push('Steam Ironing');

    // Calculate Express rates for the item across services (2x base rate or configured express price)
    const expressPrice = item.prices?.['express-laundry'] || getExpressItemPrice(item, 'wash-fold');
    const expressPrices = {
      'wash-fold': getExpressItemPrice(item, 'wash-fold'),
      'wash-iron': getExpressItemPrice(item, 'wash-iron'),
      'dry-cleaning': getExpressItemPrice(item, 'dry-cleaning'),
      'steam-iron': getExpressItemPrice(item, 'steam-iron'),
    };

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
      services: applicableServices,
      applicableServices,
      isExpressAvailable: true,
      expressPrice,
      expressPrices,
      expressTurnaround: '24 hours',
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
 * Synchronization helper for Django backend Service API
 */
const syncServiceToDjango = async (action, serviceId, serviceData = {}) => {
  try {
    const idNum = parseInt(serviceId, 10);
    const hasNumId = !isNaN(idNum) && idNum > 0;
    const baseApi = 'http://127.0.0.1:8000/api/services';

    if (action === 'delete') {
      if (hasNumId) {
        await fetch(`${baseApi}/${idNum}/`, { method: 'DELETE' }).catch(() => {});
      } else if (serviceData?.name) {
        const res = await fetch(`${baseApi}/`).catch(() => null);
        if (res && res.ok) {
          const all = await res.json().catch(() => []);
          const match = (all || []).find(s => s.name?.toLowerCase() === serviceData.name.toLowerCase());
          if (match?.id) {
            await fetch(`${baseApi}/${match.id}/`, { method: 'DELETE' }).catch(() => {});
          }
        }
      }
      return;
    }

    if (action === 'update' || action === 'toggle') {
      const payload = {};
      if (serviceData.price !== undefined) payload.price = Number(serviceData.price);
      if (serviceData.name !== undefined) payload.name = serviceData.name;
      if (serviceData.turnaround !== undefined) payload.turnaround_time = serviceData.turnaround;
      if (serviceData.description !== undefined) payload.description = serviceData.description;
      if (serviceData.status !== undefined) payload.is_active = (serviceData.status === 'Active');
      if (serviceData.is_active !== undefined) payload.is_active = Boolean(serviceData.is_active);

      if (hasNumId) {
        const patchRes = await fetch(`${baseApi}/${idNum}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(() => null);
        if (patchRes && patchRes.ok) return;
      }

      // Try finding by name in Django
      if (serviceData.name) {
        const res = await fetch(`${baseApi}/`).catch(() => null);
        if (res && res.ok) {
          const all = await res.json().catch(() => []);
          const match = (all || []).find(s => s.name?.toLowerCase() === serviceData.name.toLowerCase());
          if (match?.id) {
            await fetch(`${baseApi}/${match.id}/`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            }).catch(() => {});
          }
        }
      }
      return;
    }

    if (action === 'add') {
      const payload = {
        name: serviceData.name,
        price: Number(serviceData.price) || 100,
        description: serviceData.description || '',
        turnaround_time: serviceData.turnaround || '2–3 days',
        is_active: serviceData.status === 'Active' || serviceData.is_active !== false,
        unit: serviceData.unit || 'per piece',
        category: 1 // default Wash & Fold category
      };
      await fetch(`${baseApi}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {});
    }
  } catch (err) {
    console.warn('Django service sync notice:', err);
  }
};

/**
 * Persistent storage helpers for admin custom items & deleted service IDs
 */
export const getStoredCustomServices = () => {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('fabricare_custom_admin_services');
      return stored ? JSON.parse(stored) : [];
    }
  } catch (_) {}
  return [];
};

export const getStoredDeletedServiceIds = () => {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('fabricare_deleted_service_ids');
      return stored ? JSON.parse(stored) : [];
    }
  } catch (_) {}
  return [];
};

export const mergeWithCustomAndDeleted = (baseServices = []) => {
  const deletedIds = new Set(getStoredDeletedServiceIds().map(id => String(id).toLowerCase().trim()));
  const customServices = getStoredCustomServices().filter(s => {
    const id = String(s.id || '').toLowerCase().trim();
    return !deletedIds.has(id) && !s.isDeleted && s.status !== 'Deleted';
  });

  // Sort custom services newest first
  customServices.sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));

  const filteredBase = (baseServices || []).filter(s => {
    const id = String(s.id || '').toLowerCase().trim();
    return !deletedIds.has(id) && !s.isDeleted && s.status !== 'Deleted';
  });

  const customIdSet = new Set(customServices.map(s => String(s.id || '').toLowerCase().trim()));
  const remainingBase = filteredBase.filter(s => !customIdSet.has(String(s.id || '').toLowerCase().trim()));

  return [...customServices, ...remainingBase];
};

/**
 * Realtime subscription to services in Realtime Database
 */
export const subscribeAdminServices = (onServicesUpdated, onError) => {
  const servicesRef = ref(rtdb, 'services');
  const unsub = onValue(servicesRef, (snap) => {
    if (!snap.exists()) {
      const fallbackMerged = mergeWithCustomAndDeleted(DEFAULT_SERVICES);
      onServicesUpdated(fallbackMerged);
      setLiveAdminCatalog(fallbackMerged);
      try {
        localStorage.setItem('fabricare_admin_services', JSON.stringify(fallbackMerged));
      } catch (_) {}
      seedAdminServicesIfEmpty(DEFAULT_SERVICES, false).catch(() => {});
      return;
    }
    const data = snap.val();
    const rawList = data ? Object.keys(data).map(k => ({ ...data[k], id: data[k].id || k })) : [];

    // Filter out permanently deleted items
    const activeRawList = rawList.filter(s => !s.isDeleted && s.status !== 'Deleted');

    if (rawList.length === 0) {
      seedAdminServicesIfEmpty(DEFAULT_SERVICES, false).catch(() => {});
      const fallbackMerged = mergeWithCustomAndDeleted(DEFAULT_SERVICES);
      onServicesUpdated(fallbackMerged);
      setLiveAdminCatalog(fallbackMerged);
      return;
    }

    const list = activeRawList.map(item => {
      let cat = item.category || item.category_name || 'Wash & Fold';
      const nameLower = String(item.name || '').toLowerCase();
      if (item.subcategory === 'household' || item.id === 'kids-blanket' || nameLower.includes('bedsheet') || nameLower.includes('blanket') || nameLower.includes('curtain') || nameLower.includes('carpet')) {
        cat = 'Household';
      } else if (cat === 'Special Care' || cat === 'Special') {
        cat = nameLower.includes('saree') ? 'Dry Cleaning' : 'Household';
      }
      const defMatch = DEFAULT_SERVICES.find(d => (d.code && d.code === item.code) || d.name === item.name || String(d.id) === String(item.id));
      const applicableServices = item.applicableServices || item.services || defMatch?.applicableServices || ['Wash & Fold', 'Wash & Iron', 'Dry Cleaning', 'Steam Ironing'];
      const expressPrice = item.expressPrice || defMatch?.expressPrice || (Number(item.price) * 2);
      const expressPrices = item.expressPrices || defMatch?.expressPrices || {};

      return {
        ...item,
        price: Number(item.price) || 0,
        status: item.status || (item.isActive === false ? 'Inactive' : 'Active'),
        category: cat,
        subcategory: item.subcategory || (cat === 'Household' ? 'household' : 'men'),
        subcategoryId: item.subcategory || (cat === 'Household' ? 'household' : 'men'),
        subcatName: item.subcatName || (item.subcategory ? item.subcategory.charAt(0).toUpperCase() + item.subcategory.slice(1) : (cat === 'Household' ? 'Household' : 'Men')),
        turnaround: item.turnaround && !String(item.turnaround).includes('1') ? item.turnaround : '2–3 days',
        type: item.type || (Number(item.price) > 200 ? 'Premium' : 'Standard'),
        services: applicableServices,
        applicableServices,
        isExpressAvailable: true,
        expressPrice,
        expressPrices,
        expressTurnaround: '24 hours'
      };
    });

    const mergedList = mergeWithCustomAndDeleted(list);

    // Synchronize live admin catalog in memory and storage
    setLiveAdminCatalog(mergedList);
    try {
      localStorage.setItem('fabricare_admin_services', JSON.stringify(mergedList));
    } catch (_) {}

    onServicesUpdated(mergedList);
  }, (err) => {
    const fallbackMerged = mergeWithCustomAndDeleted(DEFAULT_SERVICES);
    onServicesUpdated(fallbackMerged);
    setLiveAdminCatalog(fallbackMerged);
    if (onError) onError(err);
  });

  return () => off(servicesRef, 'value', unsub);
};

/**
 * Seed full services into RTDB if node is completely empty
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
    const isCompletelyEmpty = !snap.exists() || !existing || Object.keys(existing).length === 0;

    if (forceOverwrite || isCompletelyEmpty) {
      const seedObj = {};
      initialServices.forEach(s => {
        seedObj[s.id] = {
          ...s,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
      });
      await set(servicesRef, seedObj);
      setLiveAdminCatalog(initialServices);
      try {
        localStorage.setItem('fabricare_admin_services', JSON.stringify(initialServices));
      } catch (_) {}
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
  const now = Date.now();
  const priceVal = Number(serviceData.price) || 80;
  const newService = {
    id: serviceId,
    name: serviceData.name || 'New Service',
    description: serviceData.description || '',
    category: serviceData.category || 'All Services',
    subcategory: serviceData.subcategory || 'Men',
    subcategoryId: (serviceData.subcategoryId || serviceData.subcategory || 'men').toLowerCase(),
    subcatName: serviceData.subcatName || serviceData.subcategory || 'Men',
    applicableServices: serviceData.applicableServices || [
      'All Services',
      'Wash and Fold',
      'Wash and Iron',
      'Steam Ironing',
      'Dry Cleaning',
      'Express Laundry'
    ],
    services: serviceData.applicableServices || [
      'All Services',
      'Wash and Fold',
      'Wash and Iron',
      'Steam Ironing',
      'Dry Cleaning',
      'Express Laundry'
    ],
    price: priceVal,
    prices: serviceData.prices || {
      'wash-fold': priceVal,
      'wash-iron': Math.round(priceVal * 1.25),
      'steam-iron': Math.round(priceVal * 0.5),
      'dry-cleaning': priceVal,
      'express-laundry': Math.round(priceVal * 1.6)
    },
    isExpressAvailable: true,
    expressPrice: serviceData.expressPrice || Math.round(priceVal * 1.6),
    turnaround: serviceData.turnaround || '2–3 days',
    status: (serviceData.status === true || serviceData.status === 'Active') ? 'Active' : 'Inactive',
    is_active: (serviceData.status === true || serviceData.status === 'Active'),
    icon: serviceData.icon || 'Shirt',
    type: serviceData.type || (priceVal > 200 ? 'Premium' : (String(serviceData.name || '').toLowerCase().includes('express') ? 'Express' : 'Standard')),
    isCustom: true,
    createdAt: serviceData.createdAt || now,
    updatedAt: now
  };

  try {
    await set(ref(rtdb, `services/${serviceId}`), newService);
  } catch (e) {
    console.warn('RTDB add service notice:', e);
  }

  // Update in persistent custom services and live catalog
  try {
    const existingCustom = getStoredCustomServices();
    const updatedCustom = [newService, ...existingCustom.filter(s => String(s.id) !== serviceId)];
    localStorage.setItem('fabricare_custom_admin_services', JSON.stringify(updatedCustom));

    // Remove from deleted list if previously marked deleted
    const deletedIds = getStoredDeletedServiceIds().filter(id => String(id).toLowerCase().trim() !== serviceId.toLowerCase());
    localStorage.setItem('fabricare_deleted_service_ids', JSON.stringify(deletedIds));

    const cached = JSON.parse(localStorage.getItem('fabricare_admin_services') || '[]');
    const next = [newService, ...cached.filter(s => String(s.id) !== serviceId)];
    localStorage.setItem('fabricare_admin_services', JSON.stringify(next));
    setLiveAdminCatalog(next);
  } catch (_) {}

  // Sync to Django Backend
  syncServiceToDjango('add', serviceId, newService);

  // Dispatch local & cross-tab sync event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('fabricare_admin_services_updated', {
      detail: { type: 'add', serviceId, service: newService }
    }));
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

  // Update in localStorage, custom list, and live catalog
  try {
    const existingCustom = getStoredCustomServices();
    const nextCustom = existingCustom.map(s => String(s.id) === cleanId ? { ...s, ...updates } : s);
    localStorage.setItem('fabricare_custom_admin_services', JSON.stringify(nextCustom));

    const cached = JSON.parse(localStorage.getItem('fabricare_admin_services') || '[]');
    const next = cached.map(s => String(s.id) === cleanId ? { ...s, ...updates } : s);
    localStorage.setItem('fabricare_admin_services', JSON.stringify(next));
    setLiveAdminCatalog(next);
  } catch (_) {}

  // Sync to Django Backend
  syncServiceToDjango('update', cleanId, updates);

  // Dispatch local & cross-tab sync event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('fabricare_admin_services_updated', {
      detail: { type: 'update', serviceId: cleanId, updates }
    }));
  }

  return true;
};

/**
 * Delete a service
 */
export const deleteAdminService = async (serviceId) => {
  const cleanId = String(serviceId).trim();
  const deleteUpdates = {
    isDeleted: true,
    status: 'Deleted',
    is_active: false,
    updatedAt: Date.now()
  };
  try {
    // Mark as deleted in RTDB
    await update(ref(rtdb, `services/${cleanId}`), deleteUpdates);
  } catch (e) {
    console.warn('RTDB delete service notice:', e);
  }

  // Permanently record deletion in deleted IDs and custom services
  try {
    const deletedIds = Array.from(new Set([...getStoredDeletedServiceIds(), cleanId]));
    localStorage.setItem('fabricare_deleted_service_ids', JSON.stringify(deletedIds));

    const existingCustom = getStoredCustomServices();
    const nextCustom = existingCustom.filter(s => String(s.id) !== cleanId);
    localStorage.setItem('fabricare_custom_admin_services', JSON.stringify(nextCustom));

    const cached = JSON.parse(localStorage.getItem('fabricare_admin_services') || '[]');
    const next = cached.filter(s => String(s.id) !== cleanId);
    localStorage.setItem('fabricare_admin_services', JSON.stringify(next));
    setLiveAdminCatalog(next);
  } catch (_) {}

  // Sync to Django Backend
  syncServiceToDjango('delete', cleanId, deleteUpdates);

  // Dispatch local & cross-tab sync event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('fabricare_admin_services_updated', {
      detail: { type: 'delete', serviceId: cleanId }
    }));
  }

  return true;
};

/**
 * Toggle active/inactive status
 */
export const toggleAdminServiceStatus = async (serviceId, currentStatus) => {
  const cleanId = String(serviceId).trim();
  const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
  const updates = {
    status: newStatus,
    is_active: (newStatus === 'Active'),
    updatedAt: Date.now()
  };
  try {
    await update(ref(rtdb, `services/${cleanId}`), updates);
  } catch (e) {
    console.warn('RTDB toggle service status notice:', e);
  }

  // Update in localStorage and live catalog
  try {
    const cached = JSON.parse(localStorage.getItem('fabricare_admin_services') || '[]');
    const next = cached.map(s => String(s.id) === cleanId ? { ...s, ...updates } : s);
    localStorage.setItem('fabricare_admin_services', JSON.stringify(next));
    setLiveAdminCatalog(next);
  } catch (_) {}

  // Sync to Django Backend
  syncServiceToDjango('toggle', cleanId, updates);

  // Dispatch local & cross-tab sync event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('fabricare_admin_services_updated', {
      detail: { type: 'toggle', serviceId: cleanId, status: newStatus }
    }));
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
    if (!isPermissionError(err)) {
      console.warn('RTDB fetchAdminOrdersOnce notice:', err);
    }
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
    if (!isPermissionError(err)) {
      console.warn('RTDB fetchAdminUsersOnce notice:', err);
    }
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
    if (!isPermissionError(err)) {
      console.warn('RTDB fetchAdminServicesOnce notice:', err);
    }
  }



  if (list.length === 0) {
    list = DEFAULT_SERVICES;
    seedAdminServicesIfEmpty(DEFAULT_SERVICES, false).catch(() => {});
  }

  const normalized = list.map(item => {
    let cat = item.category || item.category_name || 'Wash & Fold';
    const nameLower = String(item.name || '').toLowerCase();
    if (item.subcategory === 'household' || nameLower.includes('bedsheet') || nameLower.includes('blanket') || nameLower.includes('curtain') || nameLower.includes('carpet')) {
      cat = 'Household';
    } else if (cat === 'Special Care' || cat === 'Special') {
      cat = nameLower.includes('saree') ? 'Dry Cleaning' : 'Household';
    }
    const defMatch = DEFAULT_SERVICES.find(d => (d.code && d.code === item.code) || d.name === item.name || String(d.id) === String(item.id));
    const applicableServices = item.applicableServices || item.services || defMatch?.applicableServices || ['Wash & Fold', 'Wash & Iron', 'Dry Cleaning', 'Steam Ironing'];
    const expressPrice = item.expressPrice || defMatch?.expressPrice || (Number(item.price) * 2);
    const expressPrices = item.expressPrices || defMatch?.expressPrices || {};

    return {
      ...item,
      price: Number(item.price) || 0,
      status: item.status || (item.isActive === false ? 'Inactive' : 'Active'),
      category: cat,
      subcategory: item.subcategory || (cat === 'Household' ? 'household' : 'men'),
      subcategoryId: item.subcategory || (cat === 'Household' ? 'household' : 'men'),
      subcatName: item.subcatName || (item.subcategory ? item.subcategory.charAt(0).toUpperCase() + item.subcategory.slice(1) : (cat === 'Household' ? 'Household' : 'Men')),
      turnaround: item.turnaround && !String(item.turnaround).includes('1') ? item.turnaround : '2–3 days',
      type: item.type || (Number(item.price) > 200 ? 'Premium' : 'Standard'),
      services: applicableServices,
      applicableServices,
      isExpressAvailable: true,
      expressPrice,
      expressPrices,
      expressTurnaround: '24 hours'
    };
  });

  return mergeWithCustomAndDeleted(normalized);
};

