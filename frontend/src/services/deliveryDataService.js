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
import { rtdb } from '../config/firebase.js';
import { addNotificationToUpdates, addRoleNotificationsToUpdates } from './notificationService.js';

const getTodayKey = () => new Date().toISOString().split('T')[0];

/**
 * 1. Agent starts pickup task -> on_the_way
 */
export const startPickupTask = async (taskId, orderId, agentUser) => {
  const now = Date.now();
  const histPush = push(ref(rtdb, `orderHistory/${orderId}`));
  // NOTE: No dangling push() calls here — notification keys are generated
  // inside addNotificationToUpdates using push() at the correct user path.

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
  addNotificationToUpdates(updates, order.customerId, {
    type: 'otp_ready',
    title: 'Driver Arriving for Pickup',
    body: `${agentUser.name || 'Your driver'} is en route to collect your laundry. Please share your pickup OTP when they arrive.`,
    orderId: order.code || orderId,
    createdAt: now
  });

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

  const rawAgent = (agentUser.name || '').trim();
  const agentDisplay = (!rawAgent || rawAgent.toLowerCase() === 'driver')
    ? 'Delivery Partner'
    : rawAgent.toLowerCase().startsWith('driver ')
    ? rawAgent
    : `Driver ${rawAgent}`;
  const codeDisplay = order.code || order.displayId || order.order_number || (orderId && !String(orderId).startsWith('-') ? orderId : 'Order');

  // Staff notification: clothes picked up, heading to hub (isolated per staff user)
  await addRoleNotificationsToUpdates(updates, 'staff', {
    type: 'incoming_pickup',
    title: 'New Inbound Laundry',
    body: `${agentDisplay} picked up order ${codeDisplay}. En route to laundry facility.`,
    orderId: codeDisplay,
    orderCode: codeDisplay,
    createdAt: now
  });

  // Customer notification
  addNotificationToUpdates(updates, order.customerId, {
    type: 'picked_up',
    title: 'Laundry Picked Up!',
    body: `Your clothes for order ${order.code} were successfully picked up and are headed to our cleaning hub.`,
    orderId: order.code || orderId,
    createdAt: now
  });

  await update(ref(rtdb), updates);
};

/**
 * 3. Agent drops clothes at laundry hub -> hubDropoffs record
 *
 * IDEMPOTENCY GUARD: Before writing, checks if a hubDropoff record already
 * exists for this order. If one is found, skips creating a duplicate dropoff
 * and duplicate staff notifications. This prevents the "same notification
 * appearing twice" bug when the agent taps the submit button more than once.
 */
export const recordHubDropoff = async (orderId, facilityName, agentUser, notes = '') => {
  const targetDb = rtdb;
  let orderKey = String(orderId).trim();
  const cleanTarget = orderKey.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  // If a task ID was passed (e.g., task_pk_... or from tasks table), resolve underlying orderId first
  try {
    const taskSnap = await get(ref(targetDb, `tasks/${orderKey}`));
    if (taskSnap.exists() && taskSnap.val().orderId) {
      orderKey = String(taskSnap.val().orderId).trim();
    }
  } catch (_) {}

  let orderSnap = await get(ref(targetDb, `orders/${orderKey}`));
  if (!orderSnap.exists()) {
    const allSnap = await get(ref(targetDb, 'orders'));
    if (allSnap.exists()) {
      const all = allSnap.val();
      const found = Object.keys(all).find(k => {
        const o = all[k];
        if (!o) return false;
        const cK = String(k || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const cCode = String(o.code || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const cId = String(o.id || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const cNum = String(o.order_number || o.order_id || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const cDisp = String(o.displayId || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

        return cK === cleanTarget ||
               cCode === cleanTarget ||
               cId === cleanTarget ||
               cNum === cleanTarget ||
               cDisp === cleanTarget ||
               (cleanTarget.length >= 4 && (
                 (cCode.length >= 4 && (cleanTarget.endsWith(cCode) || cCode.endsWith(cleanTarget))) ||
                 (cId.length >= 4 && (cleanTarget.endsWith(cId) || cId.endsWith(cleanTarget))) ||
                 (cNum.length >= 4 && (cleanTarget.endsWith(cNum) || cNum.endsWith(cleanTarget))) ||
                 (cDisp.length >= 4 && (cleanTarget.endsWith(cDisp) || cDisp.endsWith(cleanTarget)))
               ));
      });
      if (found) {
        orderKey = found;
        orderSnap = await get(ref(targetDb, `orders/${orderKey}`));
      }
    }
  }

  if (!orderSnap.exists()) {
    console.warn(`Cannot record hub dropoff: Order "${orderKey}" not found in database.`);
    return { success: false, error: 'Order not found' };
  }

  // ─── IDEMPOTENCY GUARD ───────────────────────────────────────────────────────
  // Check if a hubDropoff record already exists for this exact order.
  // If it does, we silently skip to avoid sending duplicate staff notifications.
  try {
    const existingDropoffsSnap = await get(ref(targetDb, 'hubDropoffs'));
    if (existingDropoffsSnap.exists()) {
      const existingDropoffs = existingDropoffsSnap.val() || {};
      const alreadyDropped = Object.values(existingDropoffs).some(d => {
        if (!d) return false;
        const dOrderId = String(d.orderId || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        return dOrderId && dOrderId === cleanTarget;
      });
      if (alreadyDropped) {
        console.warn(`[recordHubDropoff] Dropoff for order "${orderKey}" already recorded. Skipping duplicate.`);
        return { success: true, duplicate: true };
      }
    }
  } catch (_) {}
  // ─────────────────────────────────────────────────────────────────────────────

  const now = Date.now();
  const formattedTime = new Date(now).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const order = orderSnap.val() || {};
  const dropPush = push(ref(targetDb, 'hubDropoffs'));
  const dropId = dropPush.key;
  const histPush = push(ref(targetDb, `orderHistory/${orderKey}`));

  const updates = {};
  updates[`hubDropoffs/${dropId}`] = {
    id: dropId,
    orderId: orderKey,
    orderCode: order.code || order.displayId || order.order_number || orderId,
    agentId: agentUser.uid,
    agentName: agentUser.name || 'Delivery Partner',
    facilityName: facilityName || 'Central FabriCare Hub',
    droppedAt: now,
    droppedAtTime: formattedTime,
    itemCount: Object.keys(order.items || {}).length,
    notes: notes || '',
    receivedByStaffId: null,
    receivedAt: null
  };

  // Crucial: Update order status & real-time drop-off timestamps so Laundry Staff sees it immediately
  updates[`orders/${orderKey}/status`] = 'DROPPED_OFF_AT_LAUNDRY';
  updates[`orders/${orderKey}/orderStatus`] = 'DROPPED_OFF_AT_LAUNDRY';
  updates[`orders/${orderKey}/raw_status`] = 'DROPPED_OFF_AT_LAUNDRY';
  updates[`orders/${orderKey}/status_display`] = 'Dropped Off at Hub';
  updates[`orders/${orderKey}/stage`] = 'incoming';
  updates[`orders/${orderKey}/currentLaundryStep`] = 'inspect';
  updates[`orders/${orderKey}/droppedAtHub`] = now;
  updates[`orders/${orderKey}/droppedOffAt`] = now;
  updates[`orders/${orderKey}/dropped_at_hub`] = now;
  updates[`orders/${orderKey}/dropped_off_at`] = now;
  updates[`orders/${orderKey}/droppedAt`] = formattedTime;
  updates[`orders/${orderKey}/hubReceivedAt`] = now;
  updates[`orders/${orderKey}/updatedAt`] = now;
  updates[`orders/${orderKey}/facilityName`] = facilityName || 'Central FabriCare Hub';
  if (notes) {
    updates[`orders/${orderKey}/dropoffNotes`] = notes;
  }

  // Also move status indexes
  updates[`ordersByStatus/PICKED_UP/${orderKey}`] = null;
  updates[`ordersByStatus/DROPPED_OFF_AT_LAUNDRY/${orderKey}`] = now;

  updates[`orderHistory/${orderKey}/${histPush.key}`] = {
    from: order.status || 'PICKED_UP',
    to: 'DROPPED_OFF_AT_LAUNDRY',
    byUid: agentUser.uid,
    byName: agentUser.name || 'Delivery Partner',
    note: notes ? `Dropped off clothes at ${facilityName || 'Central Hub'}: ${notes}` : `Dropped off clothes at ${facilityName || 'Central Hub'}`,
    at: now
  };

  const rawDriver = (agentUser.name || '').trim();
  const driverDisplay = (!rawDriver || rawDriver.toLowerCase() === 'driver')
    ? 'Delivery Partner'
    : rawDriver.toLowerCase().startsWith('driver ')
    ? rawDriver
    : `Driver ${rawDriver}`;
  const orderDisplayCode = order.code || order.displayId || order.order_number || (orderId && !String(orderId).startsWith('-') ? orderId : 'Order');

  // Staff notification for incoming laundry intake (isolated per staff user, sent ONCE)
  await addRoleNotificationsToUpdates(updates, 'staff', {
    type: 'received_at_hub',
    title: 'New Laundry Dropped Off at Hub',
    body: `${driverDisplay} dropped off order ${orderDisplayCode} at ${facilityName || 'Central Hub'}. Ready for inspection.`,
    orderId: orderDisplayCode,
    orderCode: orderDisplayCode,
    createdAt: now
  });

  await update(ref(targetDb), updates);

  // Mark task completed in tasks node
  const tasksSnap = await get(ref(targetDb, 'tasks'));
  if (tasksSnap.exists()) {
    const tasks = tasksSnap.val();
    for (const [tId, tVal] of Object.entries(tasks)) {
      if (tVal.orderId === orderKey || tVal.orderId === orderId) {
        await update(ref(targetDb, `tasks/${tId}`), {
          status: 'completed',
          droppedOffAt: now,
          updatedAt: now
        });
      }
    }
  }

  return { success: true, duplicate: false };
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

  addNotificationToUpdates(updates, order.customerId, {
    type: 'out_for_delivery',
    title: 'Out for Delivery!',
    body: `${agentUser.name || 'Driver'} is on the way with your freshly cleaned clothes. Please check your delivery OTP.`,
    orderId: order.code || orderId,
    createdAt: now
  });

  await update(ref(rtdb), updates);
};

/**
 * 5. Agent completes delivery with customer OTP -> DELIVERED
 *
 * FIX: Added missing laundry staff notification so staff are informed in
 * real-time when an order is successfully delivered to the customer.
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

  const rawAgent = (agentUser.name || '').trim();
  const agentDisplay = (!rawAgent || rawAgent.toLowerCase() === 'driver')
    ? 'Delivery Partner'
    : rawAgent.toLowerCase().startsWith('driver ')
    ? rawAgent
    : `Driver ${rawAgent}`;
  const orderDisplayCode = order.code || order.displayId || order.order_number ||
    (orderId && !String(orderId).startsWith('-') ? orderId : 'Order');

  const updates = {};
  // Task completed
  updates[`tasks/${taskId}/status`] = 'completed';
  updates[`tasks/${taskId}/completedAt`] = now;
  updates[`tasks/${taskId}/submittedOtp`] = cleanEnteredOtp;

  // Order status moves to DELIVERED
  updates[`orders/${orderId}/status`] = 'DELIVERED';
  updates[`orders/${orderId}/stage`] = 'delivered';
  updates[`orders/${orderId}/deliveredAt`] = now;
  updates[`orders/${orderId}/updatedAt`] = now;

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
  addNotificationToUpdates(updates, order.customerId, {
    type: 'delivered',
    title: 'Order Delivered!',
    body: `Your clothes for order ${orderDisplayCode} have been delivered. Thank you for choosing FabriCare!`,
    orderId: order.code || orderId,
    createdAt: now
  });

  // Admin notification (every admin receives separate copy)
  await addRoleNotificationsToUpdates(updates, 'admin', {
    type: 'order_completed',
    title: 'Order Delivered',
    body: `Order ${orderDisplayCode} has been successfully delivered by ${agentDisplay}.`,
    orderId: orderDisplayCode,
    orderCode: orderDisplayCode,
    createdAt: now
  });

  // ─── LAUNDRY STAFF NOTIFICATION (PREVIOUSLY MISSING) ────────────────────────
  // Staff need to know when their processed order has been successfully delivered
  // to the customer, so they can update records and mark the order complete.
  await addRoleNotificationsToUpdates(updates, 'staff', {
    type: 'order_delivered',
    title: 'Order Successfully Delivered',
    body: `${agentDisplay} delivered order ${orderDisplayCode} to the customer. Order is now complete.`,
    orderId: orderDisplayCode,
    orderCode: orderDisplayCode,
    createdAt: now
  });
  // ─────────────────────────────────────────────────────────────────────────────

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
