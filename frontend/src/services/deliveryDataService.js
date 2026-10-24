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
import { rtdb, auth } from '../config/firebase.js';
import { addNotificationToUpdates, addRoleNotificationsToUpdates } from './notificationService.js';
import { updateFirestoreOrderStatus } from './firestoreService.js';

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

/**
 * 6. Record delivery exception / fail attempt and log complaint report for Admin
 */
export const recordDeliveryFailureAndReschedule = async (taskId, { failed_reason, reason, comment, notes, rescheduled_date } = {}, agentUser = null) => {
  const actualReason = failed_reason || reason || 'Customer unavailable / Door locked';
  const actualComment = (comment || notes || '').trim();
  const now = Date.now();
  const targetDb = rtdb;
  const agent = agentUser || {
    uid: auth.currentUser?.uid || 'usr_agent_001',
    name: auth.currentUser?.displayName || 'Delivery Partner'
  };

  // 1. Resolve taskId and orderKey
  let orderKey = null;
  let cleanTaskSnap = null;

  try {
    const tSnap = await get(ref(targetDb, `tasks/${taskId}`));
    if (tSnap.exists()) {
      cleanTaskSnap = tSnap.val();
      orderKey = cleanTaskSnap.orderId;
    }
  } catch (_) {}

  // If orderKey is not found yet, check all orders
  if (!orderKey) {
    const cleanId = String(taskId).replace(/^order_/, '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    try {
      const allOrdersSnap = await get(ref(targetDb, 'orders'));
      if (allOrdersSnap.exists()) {
        const all = allOrdersSnap.val() || {};
        for (const [k, v] of Object.entries(all)) {
          if (!v) continue;
          const cK = String(k || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          const cCode = String(v.code || v.order_number || v.id || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          if (cK === cleanId || cCode === cleanId) {
            orderKey = k;
            break;
          }
        }
      }
    } catch (_) {}
  }

  if (!orderKey) orderKey = taskId;

  // 2. Fetch order data
  let orderData = {};
  try {
    const oSnap = await get(ref(targetDb, `orders/${orderKey}`));
    if (oSnap.exists()) {
      orderData = oSnap.val() || {};
    }
  } catch (_) {}

  const orderDisplayCode = orderData.code || orderData.order_number || orderData.id || orderKey;
  const customerName = orderData.customerName || orderData.customer?.name || orderData.pickup_full_name || 'Customer';
  const customerPhone = orderData.customerPhone || orderData.customer?.phone || orderData.pickup_phone || '';
  const customerAddress = (typeof orderData.address === 'object' && orderData.address !== null)
    ? [orderData.address.flatHouse, orderData.address.areaColony, orderData.address.city, orderData.address.pincode].filter(Boolean).join(', ')
    : (orderData.pickup_address || orderData.delivery_address || (typeof orderData.address === 'string' ? orderData.address : 'Bengaluru'));

  const updates = {};

  // 3. Update task in RTDB
  updates[`tasks/${taskId}/status`] = 'rescheduled';
  updates[`tasks/${taskId}/type`] = 'Delivery';
  updates[`tasks/${taskId}/raw_type`] = 'delivery';
  updates[`tasks/${taskId}/delivery_reported`] = true;
  updates[`tasks/${taskId}/isDeliveryReported`] = true;
  updates[`tasks/${taskId}/failedReason`] = actualReason;
  updates[`tasks/${taskId}/isRescheduled`] = false;
  updates[`tasks/${taskId}/rescheduled_date`] = null;
  updates[`tasks/${taskId}/rescheduled_time_slot`] = null;
  updates[`tasks/${taskId}/rescheduledDate`] = null;
  if (actualComment) updates[`tasks/${taskId}/comment`] = actualComment;
  updates[`tasks/${taskId}/updatedAt`] = now;

  // 4. Update order stage and status in RTDB
  updates[`orders/${orderKey}/status`] = 'RESCHEDULED';
  updates[`orders/${orderKey}/stage`] = 'rescheduled';
  updates[`orders/${orderKey}/raw_status`] = 'RESCHEDULED';
  updates[`orders/${orderKey}/orderStatus`] = 'Pending Reschedule';
  updates[`orders/${orderKey}/status_display`] = 'Pending Reschedule';
  updates[`orders/${orderKey}/delivery_reported`] = true;
  updates[`orders/${orderKey}/isDeliveryReported`] = true;
  updates[`orders/${orderKey}/failedReason`] = actualReason;
  updates[`orders/${orderKey}/isRescheduled`] = false;
  updates[`orders/${orderKey}/rescheduled_date`] = null;
  updates[`orders/${orderKey}/rescheduled_time_slot`] = null;
  updates[`orders/${orderKey}/formatted_reschedule_date`] = null;
  updates[`orders/${orderKey}/rescheduledDate`] = null;
  if (actualComment) updates[`orders/${orderKey}/failureComment`] = actualComment;
  updates[`orders/${orderKey}/updatedAt`] = now;

  // 5. Order History
  const histPush = push(ref(targetDb, `orderHistory/${orderKey}`));
  const historyNote = actualComment
    ? `Delivery attempt unsuccessful: ${actualReason}. Comment: "${actualComment}"`
    : `Delivery attempt unsuccessful: ${actualReason}`;
  updates[`orderHistory/${orderKey}/${histPush.key}`] = {
    from: orderData.status || 'OUT_FOR_DELIVERY',
    to: 'RESCHEDULED',
    byUid: agent.uid,
    byName: agent.name || 'Delivery Partner',
    note: historyNote,
    at: now
  };

  // 6. Record Complaint / Exception for Admin (shows on Admin Complaint Reports page)
  const complaintPush = push(ref(targetDb, 'complaints'));
  const complaintId = complaintPush.key;
  const formattedDate = new Date(now).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const formattedTime = new Date(now).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  updates[`complaints/${complaintId}`] = {
    id: complaintId,
    order_id: orderDisplayCode,
    order_id_display: orderDisplayCode,
    order_key: orderKey,
    task_id: taskId,
    customer_name: customerName,
    customer_phone: customerPhone,
    customer_address: customerAddress,
    failure_reason: actualReason,
    comment: actualComment || '',
    report_date: new Date(now).toISOString().split('T')[0],
    formatted_report_date: `${formattedDate}, ${formattedTime}`,
    createdAt: now,
    updatedAt: now,
    rescheduled_date: null,
    formatted_reschedule_date: '—',
    rescheduled_time_slot: '',
    status: 'PENDING_RESCHEDULE',
    priority: 'HIGH',
    reported_by_name: `${agent.name || 'Delivery Partner'} (Delivery Staff)`,
    notes: actualComment ? `Issue: ${actualReason}. Comment: ${actualComment}` : `Issue reported: ${actualReason}.`
  };

  // 7. Admin Notification (so Admin receives real-time alert)
  const notifBody = actualComment
    ? `${agent.name || 'Delivery Partner'} reported an issue for order ${orderDisplayCode}: "${actualReason}" - "${actualComment}". Please review and reschedule.`
    : `${agent.name || 'Delivery Partner'} reported an issue for order ${orderDisplayCode}: "${actualReason}". Please review and reschedule.`;
  await addRoleNotificationsToUpdates(updates, 'admin', {
    type: 'delivery_exception',
    title: `Delivery Exception: ${orderDisplayCode}`,
    body: notifBody,
    orderId: orderDisplayCode,
    orderCode: orderDisplayCode,
    createdAt: now
  });

  // 8. Customer Notification
  if (orderData.customerId) {
    addNotificationToUpdates(updates, orderData.customerId, {
      type: 'delivery_exception',
      title: 'Delivery Attempt Update',
      body: `We were unable to complete your attempt for order ${orderDisplayCode} (${actualReason}). Our team will reschedule shortly.`,
      orderId: orderDisplayCode,
      orderCode: orderDisplayCode,
      createdAt: now
    });
  }

  // 9. Delivery Agent Notification (recorded in Agent's Notification Bell & History)
  if (agent && agent.uid) {
    const isReschedule = actualReason === 'Customer requested later delivery slot' || 
                         String(actualReason).toLowerCase().includes('reschedule') || 
                         String(actualReason).toLowerCase().includes('later');
    addNotificationToUpdates(updates, agent.uid, {
      type: isReschedule ? 'reschedule_success' : 'issue_reported',
      title: isReschedule ? 'Request Rescheduled' : 'Issue Reported',
      body: isReschedule
        ? `The request for order ${orderDisplayCode} has been rescheduled successfully.`
        : `The issue for order ${orderDisplayCode} (${actualReason}) has been reported successfully.`,
      orderId: orderDisplayCode,
      orderCode: orderDisplayCode,
      createdAt: now
    });
  }

  await update(ref(targetDb), updates);

  // 10. Sync with Firestore so both real-time DB and Firestore remain in perfect harmony
  try {
    await updateFirestoreOrderStatus(orderKey, 'Rescheduled', {
      stage: 'rescheduled',
      raw_status: 'RESCHEDULED',
      status_display: 'Rescheduled',
      failedReason: actualReason,
      failureComment: actualComment || '',
      delivery_reported: true,
      isDeliveryReported: true,
      type: 'Delivery'
    });
  } catch (fsErr) {
    console.warn('Sync delivery failure to Firestore skipped or non-critical:', fsErr);
  }

  return { success: true };
};

