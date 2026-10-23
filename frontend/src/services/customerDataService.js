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
  limitToLast
} from 'firebase/database';
import { rtdb } from '../config/firebase.js';
import { addNotificationToUpdates, addRoleNotificationsToUpdates } from './notificationService.js';

const generateOtp = () => Math.floor(1000 + Math.random() * 9000).toString();
const getTodayKey = () => new Date().toISOString().split('T')[0];

/**
 * 1. Customer initiates booking -> PAYMENT_PENDING
 */
export const createCustomerOrder = async (bookingData, user) => {
  if (!user || !user.uid) throw new Error('Authentication required to create an order.');

  const orderPushRef = push(ref(rtdb, 'orders'));
  const orderId = orderPushRef.key;
  const now = Date.now();
  const codeNum = Math.floor(10000 + Math.random() * 90000);
  const code = `FC-${codeNum}`;

  const pickupOtp = generateOtp();
  const deliveryOtp = generateOtp();

  const subtotal = Math.round((bookingData.subtotal || bookingData.total || 0) * 100);
  const expressCharge = 0;
  const total = subtotal;

  const staffNames = ['ravi sharma', 'administrator', 'anil verma', 'anita sharma', 'delivery agent'];
  let cleanCustName = (bookingData.customerName || '').trim();
  if (!cleanCustName || (staffNames.includes(cleanCustName.toLowerCase()) && user?.role === 'customer')) {
    cleanCustName = user.name || user.displayName || user.fullName || 'Customer';
  }

  let cleanCustPhone = (bookingData.customerPhone || '').trim();
  const staffPhones = ['+919811122233', '+91 98111 22233', '+919822233344', '+919800000000'];
  if (staffPhones.includes(cleanCustPhone) && user?.role === 'customer') {
    cleanCustPhone = user.phone || user.phoneNumber || '';
  }

  const orderData = {
    id: orderId,
    code,
    customerId: user.uid,
    customer_id: user.uid,
    userId: user.uid,
    customerEmail: (user.email || bookingData.customerEmail || '').toLowerCase().trim(),
    customer_email: (user.email || bookingData.customerEmail || '').toLowerCase().trim(),
    customerName: cleanCustName || user.name || user.displayName || 'Customer',
    customerPhone: cleanCustPhone || user.phone || '',
    address: bookingData.address || {
      flatHouse: '',
      areaColony: '',
      city: 'Gwalior',
      pincode: '474011'
    },
    pickup: bookingData.pickup || {
      date: new Date(now + 86400000).toISOString().split('T')[0],
      from: '09:00',
      to: '11:00'
    },
    pickup_date: bookingData.pickup?.date || new Date(now + 86400000).toISOString().split('T')[0],
    pickup_time_slot: bookingData.pickup?.time_slot || (bookingData.pickup?.from ? `${bookingData.pickup.from} - ${bookingData.pickup.to}` : '09:00 AM - 11:00 AM'),
    status: 'PAYMENT_PENDING',
    stage: 'placed',
    currentLaundryStep: null,
    paymentStatus: 'Pending',
    payment_status: 'PENDING',
    payment: 'Pending',
    is_paid: false,
    isExpress: Boolean(bookingData.isExpress),
    notes: bookingData.notes || '',
    services: Array.isArray(bookingData.services) && bookingData.services.length > 0 ? bookingData.services : ['Wash & Fold'],
    services_list: Array.isArray(bookingData.services) && bookingData.services.length > 0 ? bookingData.services : ['Wash & Fold'],
    service: Array.isArray(bookingData.services) && bookingData.services.length > 0 ? bookingData.services.join(' + ') : (bookingData.service || 'Wash & Fold'),
    items: bookingData.items || {},
    subtotal,
    expressCharge,
    tax: 0,
    total,
    total_amount: (total / 100).toFixed(2).replace(/\.00$/, ''),
    amount: (total / 100).toFixed(2).replace(/\.00$/, ''),
    createdAt: now,
    placedAt: null,
    dueBy: now + (bookingData.isExpress ? 86400000 : 172800000),
    assignedStaffId: null,
    pickupTaskId: null,
    deliveryTaskId: null,
    deliveredAt: null,
    cancelledAt: null,
    cancelReason: null
  };

  const historyPushRef = push(ref(rtdb, `orderHistory/${orderId}`));
  const historyKey = historyPushRef.key;

  const updates = {};
  updates[`orders/${orderId}`] = orderData;
  updates[`orderSecrets/${orderId}`] = {
    pickupOtp,
    deliveryOtp,
    otpAttempts: 0
  };
  updates[`userOrders/${user.uid}/${orderId}`] = true;
  updates[`ordersByStatus/PAYMENT_PENDING/${orderId}`] = now;
  updates[`orderHistory/${orderId}/${historyKey}`] = {
    from: 'NONE',
    to: 'PAYMENT_PENDING',
    byUid: user.uid,
    byName: orderData.customerName,
    note: 'Customer initialized order',
    at: now
  };

  await update(ref(rtdb), updates);
  return { orderId, code, orderData };
};

/**
 * 2. Customer payment completion -> PLACED
 */
export const confirmCustomerPayment = async (orderId, paymentMethod = 'UPI_MOCK', user) => {
  const orderSnap = await get(ref(rtdb, `orders/${orderId}`));
  if (!orderSnap.exists()) throw new Error('Order not found.');
  const order = orderSnap.val();

  const now = Date.now();
  const payPushRef = push(ref(rtdb, 'payments'));
  const payId = payPushRef.key;

  const invPushRef = push(ref(rtdb, 'invoices'));
  const invId = invPushRef.key;
  const invNum = `INV-${new Date().getFullYear()}-${order.code.replace('FC-', '')}`;

  const taskPushRef = push(ref(rtdb, 'tasks'));
  const pickupTaskId = taskPushRef.key;

  const historyPushRef = push(ref(rtdb, `orderHistory/${orderId}`));
  const histKey = historyPushRef.key;

  const todayKey = getTodayKey();

  const updates = {};
  // Order updates
  updates[`orders/${orderId}/status`] = 'PLACED';
  updates[`orders/${orderId}/paymentStatus`] = 'Paid';
  updates[`orders/${orderId}/payment_status`] = 'PAID';
  updates[`orders/${orderId}/payment`] = 'Paid';
  updates[`orders/${orderId}/is_paid`] = true;
  updates[`orders/${orderId}/placedAt`] = now;
  updates[`orders/${orderId}/pickupTaskId`] = pickupTaskId;

  // Status indices
  updates[`ordersByStatus/PAYMENT_PENDING/${orderId}`] = null;
  updates[`ordersByStatus/PLACED/${orderId}`] = now;

  // Pickup Task
  updates[`tasks/${pickupTaskId}`] = {
    id: pickupTaskId,
    orderId,
    orderCode: order.code,
    type: 'pickup',
    status: 'unassigned',
    agentId: null,
    customer: {
      name: order.customerName,
      phone: order.customerPhone
    },
    address: order.address,
    scheduledAt: order.pickup?.date ? new Date(order.pickup.date).getTime() : now + 3600000,
    startedAt: null,
    completedAt: null,
    submittedOtp: null,
    failReason: null
  };

  // Payment record
  updates[`payments/${payId}`] = {
    id: payId,
    orderId,
    customerId: order.customerId,
    amount: order.total,
    method: paymentMethod,
    status: 'COMPLETED',
    transactionRef: `TXN_${now}_${Math.floor(1000 + Math.random() * 9000)}`,
    paidAt: now
  };
  updates[`userPayments/${order.customerId}/${payId}`] = true;

  // Invoice record
  updates[`invoices/${invId}`] = {
    id: invId,
    orderId,
    orderCode: order.code,
    customerId: order.customerId,
    customer_id: order.customerId,
    customerEmail: order.customerEmail || user?.email || '',
    customerName: order.customerName || user?.name || '',
    invoiceNumber: invNum,
    date: now,
    subtotal: order.subtotal,
    tax: order.tax || 0,
    discount: 0,
    expressCharge: order.expressCharge || 0,
    total: order.total,
    paymentStatus: 'Paid',
    items: order.items
  };
  updates[`userInvoices/${order.customerId}/${invId}`] = true;

  // Order history
  updates[`orderHistory/${orderId}/${histKey}`] = {
    from: 'PAYMENT_PENDING',
    to: 'PLACED',
    byUid: user?.uid || order.customerId,
    byName: user?.name || order.customerName,
    note: `Payment verified via ${paymentMethod}`,
    at: now
  };

  // Notifications in the same atomic multi-path update
  addNotificationToUpdates(updates, order.customerId, {
    type: 'order_placed',
    title: 'Order Placed & Confirmed',
    body: `Payment of ₹${(order.total / 100).toFixed(2)} received for ${order.code}. Your order is confirmed. Awaiting pickup partner assignment.`,
    orderId: order.code || orderId,
    orderCode: order.code,
    createdAt: now
  });

  await addRoleNotificationsToUpdates(updates, 'admin', {
    type: 'new_order',
    title: 'New Paid Order - Needs Agent',
    body: `New paid order ${order.code} (₹${(order.total / 100).toFixed(2)}). Pickup task is unassigned.`,
    orderId: order.code || orderId,
    orderCode: order.code,
    createdAt: now
  });

  // Stats daily
  updates[`stats/daily/${todayKey}/ordersPlaced`] = (orderSnap.val()?.dailyCount || 0) + 1;

  await update(ref(rtdb), updates);
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('fabricare_new_order_placed', { detail: { orderId, orderCode: order.code } }));
    }
  } catch (_) {}
  return { orderId, invoiceNumber: invNum, pickupTaskId };
};

/**
 * 3. Cancel order before pickup completion
 */
export const cancelCustomerOrder = async (orderId, reason = 'Customer requested cancellation', user) => {
  const orderSnap = await get(ref(rtdb, `orders/${orderId}`));
  if (!orderSnap.exists()) throw new Error('Order not found.');
  const order = orderSnap.val();

  if (order.status !== 'PAYMENT_PENDING' && order.status !== 'PLACED' && order.status !== 'PICKUP_SCHEDULED') {
    throw new Error('Order cannot be cancelled once picked up or in processing.');
  }

  const now = Date.now();
  const histPush = push(ref(rtdb, `orderHistory/${orderId}`));
  const notifPush = push(ref(rtdb, `notifications/${order.customerId}`));

  const isOrderPaid = order.paymentStatus === 'Paid' || String(order.payment_status).toUpperCase() === 'PAID';
  updates[`orders/${orderId}/status`] = 'CANCELLED';
  updates[`orders/${orderId}/paymentStatus`] = isOrderPaid ? 'Refunded' : 'Cancelled';
  updates[`orders/${orderId}/payment_status`] = isOrderPaid ? 'REFUNDED' : 'CANCELLED';
  updates[`orders/${orderId}/payment`] = isOrderPaid ? 'Refunded' : 'Cancelled';
  updates[`orders/${orderId}/cancelledAt`] = now;
  updates[`orders/${orderId}/cancelReason`] = reason;

  // Clear previous status index
  updates[`ordersByStatus/${order.status}/${orderId}`] = null;
  updates[`ordersByStatus/CANCELLED/${orderId}`] = now;

  // Cancel task if exists
  if (order.pickupTaskId) {
    updates[`tasks/${order.pickupTaskId}/status`] = 'failed';
    updates[`tasks/${order.pickupTaskId}/failReason`] = 'Order cancelled by customer';
  }

  updates[`orderHistory/${orderId}/${histPush.key}`] = {
    from: order.status,
    to: 'CANCELLED',
    byUid: user.uid,
    byName: user.name || 'Customer',
    note: `Order cancelled: ${reason}`,
    at: now
  };

  // Customer notification
  addNotificationToUpdates(updates, order.customerId, {
    type: 'order_cancelled',
    title: 'Order Cancelled & Refund Initiated',
    body: `Your order ${order.code} has been cancelled.${order.paymentStatus === 'Paid' ? ' A refund will be credited.' : ''}`,
    orderId: order.code || orderId,
    orderCode: order.code,
    createdAt: now
  });

  // Admin notification (every admin)
  await addRoleNotificationsToUpdates(updates, 'admin', {
    type: 'order_cancelled',
    title: 'Order Cancelled',
    body: `Order ${order.code} was cancelled by customer: ${reason}`,
    orderId: order.code || orderId,
    orderCode: order.code,
    createdAt: now
  });

  // Delivery agent notification if an agent was assigned
  const assignedAgentId = order.assignedPickupAgentId || order.assignedDeliveryAgentId;
  if (assignedAgentId) {
    addNotificationToUpdates(updates, assignedAgentId, {
      type: 'task_cancelled',
      title: 'Task Cancelled',
      body: `Assigned task for order ${order.code} has been cancelled.`,
      orderId: order.code || orderId,
      orderCode: order.code,
      createdAt: now
    });
  }

  await update(ref(rtdb), updates);
};

/**
 * Real-time subscription to Customer's orders strictly isolated by customerId and/or customerEmail
 */
export const subscribeCustomerOrders = (customerId, onOrdersUpdated, onError, customerEmail = null) => {
  if (!customerId && !customerEmail) return () => {};
  const targetId = customerId ? String(customerId).toLowerCase().trim() : '';
  const targetEmail = customerEmail ? String(customerEmail).toLowerCase().trim() : '';
  const ordersRef = ref(rtdb, 'orders');

  const unsubscribe = onValue(ordersRef, (snapshot) => {
    try {
      if (!snapshot.exists()) {
        onOrdersUpdated([]);
        return;
      }
      const allData = snapshot.val() || {};
      const resolvedOrders = Object.entries(allData)
        .filter(([key, o]) => {
          if (!o) return false;
          const oCustId = String(o.customerId || o.customer_id || o.userId || '').toLowerCase().trim();
          if (targetId && oCustId && oCustId === targetId) return true;
          const oEmail = String(o.customerEmail || o.customer_email || o.customer?.email || '').toLowerCase().trim();
          if (targetId && targetId.includes('@') && oEmail === targetId) return true;
          if (targetEmail && oEmail && oEmail === targetEmail) return true;
          return false;
        })
        .map(([key, o]) => ({ ...o, id: o.id || key, key }))
        .sort((a, b) => (b.createdAt || b.updatedAt || b.placedAt || 0) - (a.createdAt || a.updatedAt || a.placedAt || 0));

      onOrdersUpdated(resolvedOrders);
    } catch (err) {
      if (onError) onError(err);
    }
  }, (err) => {
    if (onError) onError(err);
  });

  return () => {
    if (typeof unsubscribe === 'function') unsubscribe();
    else off(ordersRef, 'value', unsubscribe);
  };
};

/**
 * Real-time subscription to a single order and its customer secret (OTP)
 */
export const subscribeCustomerOrderDetail = (orderId, onDetailUpdated, onError) => {
  if (!orderId) return () => {};
  const orderRef = ref(rtdb, `orders/${orderId}`);
  const secretsRef = ref(rtdb, `orderSecrets/${orderId}`);

  let currentOrder = null;
  let currentSecrets = null;

  const emit = () => {
    if (!currentOrder) return;
    onDetailUpdated({
      ...currentOrder,
      pickupOtp: currentSecrets?.pickupOtp || null,
      deliveryOtp: currentSecrets?.deliveryOtp || null
    });
  };

  const unsubOrder = onValue(orderRef, (snap) => {
    currentOrder = snap.exists() ? { ...snap.val(), id: orderId } : null;
    emit();
  }, onError);

  const unsubSecrets = onValue(secretsRef, (snap) => {
    currentSecrets = snap.exists() ? snap.val() : null;
    emit();
  }, onError);

  return () => {
    off(orderRef, 'value', unsubOrder);
    off(secretsRef, 'value', unsubSecrets);
  };
};

/**
 * Real-time subscription to Customer Invoices
 */
export const subscribeCustomerInvoices = (customerId, onInvoicesUpdated, onError) => {
  if (!customerId) return () => {};
  const userInvRef = ref(rtdb, `userInvoices/${customerId}`);

  const unsubscribe = onValue(userInvRef, async (snap) => {
    try {
      if (!snap.exists()) {
        onInvoicesUpdated([]);
        return;
      }
      const invIds = Object.keys(snap.val());
      const promises = invIds.map(async (id) => {
        const iSnap = await get(ref(rtdb, `invoices/${id}`));
        return iSnap.exists() ? { ...iSnap.val(), id } : null;
      });
      const resolvedInvoices = (await Promise.all(promises))
        .filter(Boolean)
        .sort((a, b) => (b.date || 0) - (a.date || 0));
      onInvoicesUpdated(resolvedInvoices);
    } catch (err) {
      if (onError) onError(err);
    }
  }, onError);

  return () => off(userInvRef, 'value', unsubscribe);
};

/**
 * Real-time subscription to Customer Notifications
 */
export const subscribeCustomerNotifications = (customerId, onNotifsUpdated, onError) => {
  if (!customerId) return () => {};
  const notifsQuery = query(ref(rtdb, `notifications/${customerId}`), limitToLast(50));

  const unsubscribe = onValue(notifsQuery, (snap) => {
    if (!snap.exists()) {
      onNotifsUpdated([]);
      return;
    }
    const data = snap.val();
    const list = Object.keys(data).map(k => ({ ...data[k], id: k })).reverse();
    onNotifsUpdated(list);
  }, onError);

  return () => off(notifsQuery, 'value', unsubscribe);
};

/**
 * Mark notification as read
 */
export const markNotificationRead = async (customerId, notifId) => {
  if (!customerId || !notifId) return;
  await update(ref(rtdb, `notifications/${customerId}/${notifId}`), { isRead: true });
};

/**
 * Submit Help & Support Ticket / Complaint
 */
export const submitCustomerComplaint = async (complaintData, user) => {
  const compPush = push(ref(rtdb, 'complaints'));
  const compId = compPush.key;
  const msgPush = push(ref(rtdb, `complaintMessages/${compId}`));
  const msgId = msgPush.key;
  const now = Date.now();
  const ticketId = `TCK-${Math.floor(1000 + Math.random() * 9000)}`;

  const updates = {};
  updates[`complaints/${compId}`] = {
    id: compId,
    ticketId,
    customerId: user.uid,
    customerName: user.name || 'Customer',
    orderId: complaintData.orderId || null,
    issueCategory: complaintData.issueCategory || 'General',
    subject: complaintData.subject,
    status: 'Open',
    createdAt: now,
    updatedAt: now
  };
  updates[`complaintMessages/${compId}/${msgId}`] = {
    id: msgId,
    senderUid: user.uid,
    senderRole: 'customer',
    message: complaintData.message,
    sentAt: now
  };
  updates[`userComplaints/${user.uid}/${compId}`] = true;

  // Alert every admin with distinct notification copy
  await addRoleNotificationsToUpdates(updates, 'admin', {
    type: 'new_complaint',
    title: `New Complaint: ${ticketId}`,
    body: `${user.name || 'Customer'} filed complaint: ${complaintData.subject}`,
    orderId: complaintData.orderId || null,
    createdAt: now
  });

  await update(ref(rtdb), updates);
  return { compId, ticketId };
};

/**
 * Subscribe to customer complaints
 */
export const subscribeCustomerComplaints = (customerId, onComplaintsUpdated, onError) => {
  if (!customerId) return () => {};
  const userCompRef = ref(rtdb, `userComplaints/${customerId}`);

  const unsubscribe = onValue(userCompRef, async (snap) => {
    try {
      if (!snap.exists()) {
        onComplaintsUpdated([]);
        return;
      }
      const ids = Object.keys(snap.val());
      const promises = ids.map(async (id) => {
        const cSnap = await get(ref(rtdb, `complaints/${id}`));
        return cSnap.exists() ? { ...cSnap.val(), id } : null;
      });
      const resolved = (await Promise.all(promises)).filter(Boolean).reverse();
      onComplaintsUpdated(resolved);
    } catch (err) {
      if (onError) onError(err);
    }
  }, onError);

  return () => off(userCompRef, 'value', unsubscribe);
};
