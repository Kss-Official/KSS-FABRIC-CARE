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

  // Agent notification
  const agentNotifPush = push(ref(rtdb, `notifications/${cleanAgentKey}`));
  updates[`notifications/${cleanAgentKey}/${agentNotifPush.key}`] = {
    id: agentNotifPush.key,
    type: 'task_assigned',
    title: 'New Pickup Task',
    body: `Pickup assigned for order ${order.code || actualOrderId} at ${order.address?.areaColony || order.pickup_address || 'Customer Address'}.`,
    orderId: actualOrderId,
    taskId: effectiveTaskId,
    isRead: false,
    createdAt: now
  };

  // Customer notification
  if (order.customerId) {
    const custNotifPush = push(ref(rtdb, `notifications/${order.customerId}`));
    updates[`notifications/${order.customerId}/${custNotifPush.key}`] = {
      id: custNotifPush.key,
      type: 'driver_assigned',
      title: 'Pickup Agent Assigned',
      body: `${agent.name} has been assigned to pick up your laundry order ${order.code || actualOrderId}.`,
      orderId: actualOrderId,
      isRead: false,
      createdAt: now
    };
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

  // Notifications
  const agentNotifPush = push(ref(rtdb, `notifications/${cleanAgentKey}`));
  updates[`notifications/${cleanAgentKey}/${agentNotifPush.key}`] = {
    id: agentNotifPush.key,
    type: 'task_assigned',
    title: 'New Delivery Task',
    body: `Delivery task assigned for order ${order.code || actualOrderId} to ${order.address?.areaColony || 'Customer Address'}.`,
    orderId: actualOrderId,
    taskId: effectiveTaskId,
    isRead: false,
    createdAt: now
  };

  if (order.customerId) {
    const custNotifPush = push(ref(rtdb, `notifications/${order.customerId}`));
    updates[`notifications/${order.customerId}/${custNotifPush.key}`] = {
      id: custNotifPush.key,
      type: 'delivery_assigned',
      title: 'Order Out For Delivery',
      body: `${agent.name} is on the way to deliver your order ${order.code || actualOrderId}.`,
      orderId: actualOrderId,
      isRead: false,
      createdAt: now
    };
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

  updates[`notifications/${complaint.customerId}/${notifPush.key}`] = {
    id: notifPush.key,
    type: 'support_reply',
    title: `Response to Ticket ${complaint.ticketId}`,
    body: replyMessage.substring(0, 80) + '...',
    orderId: complaint.orderId || null,
    isRead: false,
    createdAt: now
  };

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
