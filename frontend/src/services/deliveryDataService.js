import {
  ref,
  get,
  set,
  update,
  push,
  onValue,
  off,
  query,
  limitToLast
} from 'firebase/database';
import { rtdb } from '../config/firebase';

const getTodayKey = () => new Date().toISOString().split('T')[0];

/**
 * 1. Agent starts pickup task -> on_the_way
 */
export const startPickupTask = async (taskId, orderId, agentUser) => {
  const now = Date.now();
  const histPush = push(ref(rtdb, `orderHistory/${orderId}`));
  const custNotifPush = push(ref(rtdb, `notifications`)); // will get customerId from order

  const orderSnap = await get(ref(rtdb, `orders/${orderId}`));
  if (!orderSnap.exists()) throw new Error('Order not found.');
  const order = orderSnap.val();

  const updates = {};
  updates[`tasks/${taskId}/status`] = 'on_the_way';
  updates[`tasks/${taskId}/startedAt`] = now;
  updates[`orders/${orderId}/stage`] = 'driver_on_the_way';

  // History
  updates[`orderHistory/${orderId}/${histPush.key}`] = {
    from: order.status,
    to: order.status,
    byUid: agentUser.uid,
    byName: agentUser.name || 'Delivery Partner',
    note: 'Driver is on the way to pick up garments',
    at: now
  };

  // Customer notification with instruction to share OTP
  updates[`notifications/${order.customerId}/${custNotifPush.key}`] = {
    id: custNotifPush.key,
    type: 'driver_on_the_way',
    title: 'Driver Arriving for Pickup',
    body: `${agentUser.name || 'Your driver'} is en route to collect your laundry. Please share your pickup OTP when they arrive.`,
    orderId,
    isRead: false,
    createdAt: now
  };

  await update(ref(rtdb), updates);
};

/**
 * 2. Agent completes pickup with Customer OTP -> PICKED_UP
 */
export const verifyAndCompletePickup = async (taskId, orderId, enteredOtp, agentUser) => {
  const [orderSnap, secretsSnap] = await Promise.all([
    get(ref(rtdb, `orders/${orderId}`)),
    get(ref(rtdb, `orderSecrets/${orderId}`))
  ]);

  if (!orderSnap.exists()) throw new Error('Order not found.');
  if (!secretsSnap.exists()) throw new Error('Security record for order not found.');

  const order = orderSnap.val();
  const secrets = secretsSnap.val();
  const currentAttempts = secrets.otpAttempts || 0;

  if (currentAttempts >= 5) {
    throw new Error('Maximum OTP verification attempts (5) exceeded. Please contact customer support.');
  }

  const cleanEnteredOtp = String(enteredOtp).trim();
  const actualPickupOtp = String(secrets.pickupOtp).trim();

  if (cleanEnteredOtp !== actualPickupOtp) {
    // Increment attempts
    await update(ref(rtdb, `orderSecrets/${orderId}`), {
      otpAttempts: currentAttempts + 1
    });
    throw new Error(`Invalid OTP. Attempt ${currentAttempts + 1} of 5.`);
  }

  const now = Date.now();
  const histPush = push(ref(rtdb, `orderHistory/${orderId}`));
  const staffNotifPush = push(ref(rtdb, `notificationsByRole/staff`));
  const custNotifPush = push(ref(rtdb, `notifications/${order.customerId}`));

  const updates = {};
  // Task completed
  updates[`tasks/${taskId}/status`] = 'completed';
  updates[`tasks/${taskId}/completedAt`] = now;
  updates[`tasks/${taskId}/submittedOtp`] = cleanEnteredOtp;

  // Order status moves to PICKED_UP
  updates[`orders/${orderId}/status`] = 'PICKED_UP';
  updates[`orders/${orderId}/stage`] = 'picked';

  // Indexes
  updates[`ordersByStatus/PICKUP_SCHEDULED/${orderId}`] = null;
  updates[`ordersByStatus/PICKED_UP/${orderId}`] = now;

  // Order history
  updates[`orderHistory/${orderId}/${histPush.key}`] = {
    from: 'PICKUP_SCHEDULED',
    to: 'PICKED_UP',
    byUid: agentUser.uid,
    byName: agentUser.name || 'Delivery Partner',
    note: 'Pickup verified successfully via customer OTP',
    at: now
  };

  // Staff notification: clothes picked up, heading to hub
  updates[`notificationsByRole/staff/${staffNotifPush.key}`] = {
    id: staffNotifPush.key,
    type: 'incoming_pickup',
    title: 'New Inbound Laundry',
    body: `Driver ${agentUser.name || 'Agent'} picked up order ${order.code}. En route to laundry facility.`,
    orderId,
    isRead: false,
    createdAt: now
  };

  // Customer notification
  updates[`notifications/${order.customerId}/${custNotifPush.key}`] = {
    id: custNotifPush.key,
    type: 'order_picked_up',
    title: 'Laundry Picked Up!',
    body: `Your clothes for order ${order.code} were successfully picked up and are headed to our cleaning hub.`,
    orderId,
    isRead: false,
    createdAt: now
  };

  await update(ref(rtdb), updates);
};

/**
 * 3. Agent drops clothes at laundry hub -> hubDropoffs record
 */
export const recordHubDropoff = async (orderId, facilityName, agentUser) => {
  const orderSnap = await get(ref(rtdb, `orders/${orderId}`));
  if (!orderSnap.exists()) throw new Error('Order not found.');
  const order = orderSnap.val();

  const now = Date.now();
  const dropPush = push(ref(rtdb, 'hubDropoffs'));
  const dropId = dropPush.key;
  const histPush = push(ref(rtdb, `orderHistory/${orderId}`));

  const updates = {};
  updates[`hubDropoffs/${dropId}`] = {
    id: dropId,
    orderId,
    orderCode: order.code,
    agentId: agentUser.uid,
    agentName: agentUser.name || 'Delivery Partner',
    facilityName: facilityName || 'Central FabriCare Hub',
    droppedAt: now,
    itemCount: Object.keys(order.items || {}).length,
    receivedByStaffId: null,
    receivedAt: null
  };

  updates[`orderHistory/${orderId}/${histPush.key}`] = {
    from: order.status,
    to: order.status,
    byUid: agentUser.uid,
    byName: agentUser.name || 'Delivery Partner',
    note: `Dropped off clothes at ${facilityName || 'Central Hub'}`,
    at: now
  };

  await update(ref(rtdb), updates);
};

/**
 * 4. Agent starts delivery task -> OUT_FOR_DELIVERY
 */
export const startDeliveryTask = async (taskId, orderId, agentUser) => {
  const now = Date.now();
  const orderSnap = await get(ref(rtdb, `orders/${orderId}`));
  if (!orderSnap.exists()) throw new Error('Order not found.');
  const order = orderSnap.val();

  const histPush = push(ref(rtdb, `orderHistory/${orderId}`));
  const custNotifPush = push(ref(rtdb, `notifications/${order.customerId}`));

  const updates = {};
  updates[`tasks/${taskId}/status`] = 'on_the_way';
  updates[`tasks/${taskId}/startedAt`] = now;

  updates[`orders/${orderId}/status`] = 'OUT_FOR_DELIVERY';
  updates[`orders/${orderId}/stage`] = 'delivery';

  // Indexes
  updates[`ordersByStatus/READY_FOR_DELIVERY/${orderId}`] = null;
  updates[`ordersByStatus/OUT_FOR_DELIVERY/${orderId}`] = now;

  updates[`orderHistory/${orderId}/${histPush.key}`] = {
    from: order.status,
    to: 'OUT_FOR_DELIVERY',
    byUid: agentUser.uid,
    byName: agentUser.name || 'Delivery Partner',
    note: 'Out for delivery to customer address',
    at: now
  };

  updates[`notifications/${order.customerId}/${custNotifPush.key}`] = {
    id: custNotifPush.key,
    type: 'out_for_delivery',
    title: 'Out for Delivery!',
    body: `${agentUser.name || 'Driver'} is on the way with your freshly cleaned clothes. Please check your delivery OTP.`,
    orderId,
    isRead: false,
    createdAt: now
  };

  await update(ref(rtdb), updates);
};

/**
 * 5. Agent completes delivery with customer OTP -> DELIVERED
 */
export const verifyAndCompleteDelivery = async (taskId, orderId, enteredOtp, agentUser) => {
  const [orderSnap, secretsSnap] = await Promise.all([
    get(ref(rtdb, `orders/${orderId}`)),
    get(ref(rtdb, `orderSecrets/${orderId}`))
  ]);

  if (!orderSnap.exists()) throw new Error('Order not found.');
  if (!secretsSnap.exists()) throw new Error('Security record for order not found.');

  const order = orderSnap.val();
  const secrets = secretsSnap.val();
  const currentAttempts = secrets.otpAttempts || 0;

  if (currentAttempts >= 5) {
    throw new Error('Maximum OTP verification attempts (5) exceeded. Please contact customer support.');
  }

  const cleanEnteredOtp = String(enteredOtp).trim();
  const actualDeliveryOtp = String(secrets.deliveryOtp).trim();

  if (cleanEnteredOtp !== actualDeliveryOtp) {
    await update(ref(rtdb, `orderSecrets/${orderId}`), {
      otpAttempts: currentAttempts + 1
    });
    throw new Error(`Invalid OTP. Attempt ${currentAttempts + 1} of 5.`);
  }

  const now = Date.now();
  const todayKey = getTodayKey();
  const histPush = push(ref(rtdb, `orderHistory/${orderId}`));
  const custNotifPush = push(ref(rtdb, `notifications/${order.customerId}`));
  const admNotifPush = push(ref(rtdb, 'notificationsByRole/admin'));

  const updates = {};
  // Task completed
  updates[`tasks/${taskId}/status`] = 'completed';
  updates[`tasks/${taskId}/completedAt`] = now;
  updates[`tasks/${taskId}/submittedOtp`] = cleanEnteredOtp;

  // Order status moves to DELIVERED
  updates[`orders/${orderId}/status`] = 'DELIVERED';
  updates[`orders/${orderId}/stage`] = 'delivered';
  updates[`orders/${orderId}/deliveredAt`] = now;

  // Indexes
  updates[`ordersByStatus/OUT_FOR_DELIVERY/${orderId}`] = null;
  updates[`ordersByStatus/DELIVERED/${orderId}`] = now;

  // Stats
  updates[`stats/daily/${todayKey}/completedOrders`] = (orderSnap.val()?.completedTodayCount || 0) + 1;
  updates[`stats/daily/${todayKey}/revenue`] = (orderSnap.val()?.dailyRevenue || 0) + (order.total || 0);

  // History
  updates[`orderHistory/${orderId}/${histPush.key}`] = {
    from: 'OUT_FOR_DELIVERY',
    to: 'DELIVERED',
    byUid: agentUser.uid,
    byName: agentUser.name || 'Delivery Partner',
    note: 'Delivery completed and verified via customer OTP',
    at: now
  };

  // Customer notification
  updates[`notifications/${order.customerId}/${custNotifPush.key}`] = {
    id: custNotifPush.key,
    type: 'order_delivered',
    title: 'Order Delivered!',
    body: `Your clothes for order ${order.code} have been delivered. Thank you for choosing FabriCare!`,
    orderId,
    isRead: false,
    createdAt: now
  };

  // Admin notification
  updates[`notificationsByRole/admin/${admNotifPush.key}`] = {
    id: admNotifPush.key,
    type: 'order_completed',
    title: 'Order Delivered',
    body: `Order ${order.code} has been successfully delivered by ${agentUser.name || 'Driver'}.`,
    orderId,
    isRead: false,
    createdAt: now
  };

  await update(ref(rtdb), updates);
};

/**
 * Subscriptions for Delivery Agent Portal
 */
export const subscribeAgentTasks = (agentUid, onTasksUpdated, onError) => {
  if (!agentUid) return () => {};
  const agentTasksRef = ref(rtdb, `agentTasks/${agentUid}`);

  const unsub = onValue(agentTasksRef, async (snap) => {
    try {
      if (!snap.exists()) {
        onTasksUpdated([]);
        return;
      }
      const taskIds = Object.keys(snap.val());
      const promises = taskIds.map(async (id) => {
        const tSnap = await get(ref(rtdb, `tasks/${id}`));
        return tSnap.exists() ? { ...tSnap.val(), id } : null;
      });
      const resolved = (await Promise.all(promises)).filter(Boolean).reverse();
      onTasksUpdated(resolved);
    } catch (err) {
      if (onError) onError(err);
    }
  }, onError);

  return () => off(agentTasksRef, 'value', unsub);
};

export const subscribeAgentNotifications = (agentUid, onNotifsUpdated, onError) => {
  if (!agentUid) return () => {};
  const notifsQuery = query(ref(rtdb, `notifications/${agentUid}`), limitToLast(30));
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
