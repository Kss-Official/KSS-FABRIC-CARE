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
import { rtdb } from '../config/firebase';

const getTodayKey = () => new Date().toISOString().split('T')[0];

/**
 * 1. Admin assigns pickup agent -> PICKUP_SCHEDULED
 */
export const assignPickupAgent = async (orderId, taskId, agentId, adminUser) => {
  const [orderSnap, agentSnap] = await Promise.all([
    get(ref(rtdb, `orders/${orderId}`)),
    get(ref(rtdb, `users/${agentId}`))
  ]);

  if (!orderSnap.exists()) throw new Error('Order not found.');
  const order = orderSnap.val();
  const agent = agentSnap.exists() ? agentSnap.val() : { name: 'Assigned Agent' };
  const now = Date.now();

  const histPush = push(ref(rtdb, `orderHistory/${orderId}`));
  const agentNotifPush = push(ref(rtdb, `notifications/${agentId}`));
  const custNotifPush = push(ref(rtdb, `notifications/${order.customerId}`));

  const updates = {};
  updates[`orders/${orderId}/status`] = 'PICKUP_SCHEDULED';
  updates[`orders/${orderId}/assignedAgentId`] = agentId;
  updates[`orders/${orderId}/assignedAgentName`] = agent.name;
  updates[`orders/${orderId}/pickupTaskId`] = taskId;

  // Move status index
  updates[`ordersByStatus/PLACED/${orderId}`] = null;
  updates[`ordersByStatus/PICKUP_SCHEDULED/${orderId}`] = now;

  // Update Task
  updates[`tasks/${taskId}/status`] = 'assigned';
  updates[`tasks/${taskId}/agentId`] = agentId;
  updates[`tasks/${taskId}/agentName`] = agent.name;
  updates[`agentTasks/${agentId}/${taskId}`] = true;

  // Order history
  updates[`orderHistory/${orderId}/${histPush.key}`] = {
    from: order.status,
    to: 'PICKUP_SCHEDULED',
    byUid: adminUser.uid,
    byName: adminUser.name || 'Admin',
    note: `Assigned pickup agent: ${agent.name}`,
    at: now
  };

  // Agent notification
  updates[`notifications/${agentId}/${agentNotifPush.key}`] = {
    id: agentNotifPush.key,
    type: 'task_assigned',
    title: 'New Pickup Task',
    body: `Pickup assigned for order ${order.code} at ${order.address?.areaColony || 'Customer Address'}.`,
    orderId,
    taskId,
    isRead: false,
    createdAt: now
  };

  // Customer notification
  updates[`notifications/${order.customerId}/${custNotifPush.key}`] = {
    id: custNotifPush.key,
    type: 'driver_assigned',
    title: 'Pickup Agent Assigned',
    body: `${agent.name} has been assigned to pick up your laundry order ${order.code}.`,
    orderId,
    isRead: false,
    createdAt: now
  };

  await update(ref(rtdb), updates);
};

/**
 * 2. Admin assigns delivery agent -> OUT_FOR_DELIVERY
 */
export const assignDeliveryAgent = async (orderId, taskId, agentId, adminUser) => {
  const [orderSnap, agentSnap] = await Promise.all([
    get(ref(rtdb, `orders/${orderId}`)),
    get(ref(rtdb, `users/${agentId}`))
  ]);

  if (!orderSnap.exists()) throw new Error('Order not found.');
  const order = orderSnap.val();
  const agent = agentSnap.exists() ? agentSnap.val() : { name: 'Assigned Agent' };
  const now = Date.now();

  const histPush = push(ref(rtdb, `orderHistory/${orderId}`));
  const agentNotifPush = push(ref(rtdb, `notifications/${agentId}`));
  const custNotifPush = push(ref(rtdb, `notifications/${order.customerId}`));

  const updates = {};
  updates[`orders/${orderId}/deliveryTaskId`] = taskId;
  updates[`orders/${orderId}/assignedDeliveryAgentId`] = agentId;
  updates[`orders/${orderId}/assignedDeliveryAgentName`] = agent.name;

  // Update Task
  updates[`tasks/${taskId}/status`] = 'assigned';
  updates[`tasks/${taskId}/agentId`] = agentId;
  updates[`tasks/${taskId}/agentName`] = agent.name;
  updates[`agentTasks/${agentId}/${taskId}`] = true;

  // Order history
  updates[`orderHistory/${orderId}/${histPush.key}`] = {
    from: order.status,
    to: order.status,
    byUid: adminUser.uid,
    byName: adminUser.name || 'Admin',
    note: `Assigned delivery agent: ${agent.name}`,
    at: now
  };

  // Agent notification
  updates[`notifications/${agentId}/${agentNotifPush.key}`] = {
    id: agentNotifPush.key,
    type: 'task_assigned',
    title: 'New Delivery Task',
    body: `Delivery task assigned for order ${order.code} to ${order.address?.areaColony || 'Customer Address'}.`,
    orderId,
    taskId,
    isRead: false,
    createdAt: now
  };

  // Customer notification
  updates[`notifications/${order.customerId}/${custNotifPush.key}`] = {
    id: custNotifPush.key,
    type: 'delivery_driver_assigned',
    title: 'Delivery Agent Assigned',
    body: `${agent.name} is assigned to deliver your clean clothes soon.`,
    orderId,
    isRead: false,
    createdAt: now
  };

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
    const list = Object.keys(data).map(k => ({ ...data[k], id: k })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
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
    const list = Object.keys(data).map(k => ({ ...data[k], id: k })).reverse();
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
