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
import { updateFirestoreOrderStatus } from './firestoreService.js';

export const LAUNDRY_STEP_ORDER = [
  'inspect',
  'wash',
  'dry',
  'steam',
  'dry-clean',
  'iron',
  'press',
  'fold',
  'quality-check',
  'pack'
];

export const STEP_DEFINITIONS = {
  RECEIVED: {
    status: 'RECEIVED',
    orderStatus: 'RECEIVED',
    status_display: 'Received at Laundry',
    raw_status: 'RECEIVED_BY_LAUNDRY',
    stage: 'received',
    processing_stage: 'received',
    currentLaundryStep: 'inspect',
    orderIndex: 0,
    label: 'Received'
  },
  INSPECTION: {
    status: 'IN_CLEANING',
    orderStatus: 'IN_CLEANING',
    status_display: 'Inspection',
    raw_status: 'INSPECTION',
    stage: 'inspection',
    processing_stage: 'inspection',
    currentLaundryStep: 'inspect',
    orderIndex: 1,
    label: 'Inspection'
  },
  WASHING: {
    status: 'IN_CLEANING',
    orderStatus: 'IN_CLEANING',
    status_display: 'Washing',
    raw_status: 'WASHING',
    stage: 'washing',
    processing_stage: 'washing',
    currentLaundryStep: 'wash',
    orderIndex: 2,
    label: 'Washing'
  },
  DRYING: {
    status: 'IN_CLEANING',
    orderStatus: 'IN_CLEANING',
    status_display: 'Drying',
    raw_status: 'DRYING',
    stage: 'drying',
    processing_stage: 'drying',
    currentLaundryStep: 'dry',
    orderIndex: 3,
    label: 'Drying'
  },
  IRONING: {
    status: 'IN_CLEANING',
    orderStatus: 'IN_CLEANING',
    status_display: 'Ironing',
    raw_status: 'IRONING',
    stage: 'ironing',
    processing_stage: 'ironing',
    currentLaundryStep: 'iron',
    orderIndex: 4,
    label: 'Ironing'
  },
  FOLDING: {
    status: 'IN_CLEANING',
    orderStatus: 'IN_CLEANING',
    status_display: 'Folding',
    raw_status: 'FOLDING',
    stage: 'folding',
    processing_stage: 'folding',
    currentLaundryStep: 'fold',
    orderIndex: 5,
    label: 'Folding'
  },
  QUALITY_CHECK: {
    status: 'IN_CLEANING',
    orderStatus: 'IN_CLEANING',
    status_display: 'Quality Check',
    raw_status: 'QUALITY_CHECK',
    stage: 'quality',
    processing_stage: 'quality',
    currentLaundryStep: 'quality-check',
    orderIndex: 6,
    label: 'Quality Check'
  },
  PACKING: {
    status: 'IN_CLEANING',
    orderStatus: 'IN_CLEANING',
    status_display: 'Packing',
    raw_status: 'PACKING',
    stage: 'packing',
    processing_stage: 'packing',
    currentLaundryStep: 'pack',
    orderIndex: 7,
    label: 'Packing'
  },
  READY_FOR_DELIVERY: {
    status: 'READY_FOR_DELIVERY',
    orderStatus: 'READY_FOR_DELIVERY',
    status_display: 'Ready for Delivery',
    raw_status: 'READY_FOR_DELIVERY',
    stage: 'ready',
    processing_stage: 'ready',
    currentLaundryStep: 'ready',
    orderIndex: 8,
    label: 'Ready for Delivery'
  },
  OUT_FOR_DELIVERY: {
    status: 'OUT_FOR_DELIVERY',
    orderStatus: 'OUT_FOR_DELIVERY',
    status_display: 'Out for Delivery',
    raw_status: 'OUT_FOR_DELIVERY',
    stage: 'delivery',
    processing_stage: 'delivery',
    currentLaundryStep: 'out_for_delivery',
    orderIndex: 9,
    label: 'Out for Delivery'
  },
  DELIVERED: {
    status: 'DELIVERED',
    orderStatus: 'DELIVERED',
    status_display: 'Delivered',
    raw_status: 'DELIVERED',
    stage: 'delivered',
    processing_stage: 'delivered',
    currentLaundryStep: 'delivered',
    orderIndex: 10,
    label: 'Delivered'
  }
};

/**
 * Normalizes any step input key to canonical STEP_DEFINITIONS key
 */
export const resolveStepKey = (key) => {
  if (!key) return 'RECEIVED';
  const s = String(key).toUpperCase().replace(/[\s-]/g, '_');
  if (s.includes('DELIVERED') || s.includes('COMPLET')) return 'DELIVERED';
  if (s.includes('OUT_FOR_DELIVERY') || s.includes('DISPATCH')) return 'OUT_FOR_DELIVERY';
  if (s.includes('READY') || s === 'DELIVERY' || s.includes('DELIVERY_QUEUE')) return 'READY_FOR_DELIVERY';
  if (s.includes('PACK')) return 'PACKING';
  if (s.includes('QUALIT') || s.includes('QC')) return 'QUALITY_CHECK';
  if (s.includes('FOLD')) return 'FOLDING';
  if (s.includes('IRON') || s.includes('PRESS') || s.includes('STEAM')) return 'IRONING';
  if (s.includes('DRY') && !s.includes('CLEAN')) return 'DRYING';
  if (s.includes('WASH')) return 'WASHING';
  if (s.includes('INSPECT')) return 'INSPECTION';
  return 'RECEIVED';
};

/**
 * Robust order finder in RTDB supporting direct keys, tasks, codes and partial matches
 */
export const findOrderKeyAndData = async (orderId) => {
  if (!orderId) return { orderKey: null, order: null };
  const cleanId = String(orderId).trim();

  // 1. Direct key check
  const directSnap = await get(ref(rtdb, `orders/${cleanId}`));
  if (directSnap.exists()) {
    return { orderKey: cleanId, order: directSnap.val() };
  }

  // 2. Underlying task check
  try {
    const taskSnap = await get(ref(rtdb, `tasks/${cleanId}`));
    if (taskSnap.exists() && taskSnap.val().orderId) {
      const underlyingKey = String(taskSnap.val().orderId).trim();
      const underSnap = await get(ref(rtdb, `orders/${underlyingKey}`));
      if (underSnap.exists()) {
        return { orderKey: underlyingKey, order: underSnap.val() };
      }
    }
  } catch (_) {}

  // 3. Scan all orders
  const allSnap = await get(ref(rtdb, 'orders'));
  if (allSnap.exists()) {
    const all = allSnap.val() || {};
    const targetUpper = cleanId.toUpperCase();
    const targetDigits = cleanId.replace(/\D/g, '');

    const found = Object.keys(all).find(k => {
      const o = all[k] || {};
      const code = String(o.code || '').toUpperCase();
      const id = String(o.id || '').toUpperCase();
      const orderNum = String(o.order_number || '').toUpperCase();
      const displayId = String(o.displayId || '').toUpperCase();
      const kUpper = String(k).toUpperCase();

      if (kUpper === targetUpper || code === targetUpper || id === targetUpper || orderNum === targetUpper || displayId === targetUpper) {
        return true;
      }
      if (targetDigits && (code.endsWith(targetDigits) || id.endsWith(targetDigits) || orderNum.endsWith(targetDigits))) {
        return true;
      }
      return false;
    });

    if (found) {
      return { orderKey: found, order: all[found] };
    }
  }

  return { orderKey: null, order: null };
};

/**
 * Comprehensive Order Status Update function for Laundry Staff Portal
 * Handles advance, revert, RTDB indexing, task synchronization, and Firestore broadcast
 */
export const updateLaundryStaffOrderStatus = async (orderId, targetStep, staffUser = {}, isRevert = false, customNote = '') => {
  const { orderKey, order } = await findOrderKeyAndData(orderId);
  if (!orderKey || !order) {
    throw new Error(`Order "${orderId}" not found in database.`);
  }

  const user = {
    uid: staffUser?.uid || 'usr_staff_001',
    name: staffUser?.name || 'Laundry Specialist'
  };

  const canonicalKey = resolveStepKey(targetStep);
  const stepDef = STEP_DEFINITIONS[canonicalKey] || STEP_DEFINITIONS.RECEIVED;
  const now = Date.now();
  const histPush = push(ref(rtdb, `orderHistory/${orderKey}`));

  const updates = {};
  updates[`orders/${orderKey}/status`] = stepDef.status;
  updates[`orders/${orderKey}/orderStatus`] = stepDef.orderStatus;
  updates[`orders/${orderKey}/status_display`] = stepDef.status_display;
  updates[`orders/${orderKey}/raw_status`] = stepDef.raw_status;
  updates[`orders/${orderKey}/stage`] = stepDef.stage;
  updates[`orders/${orderKey}/processing_stage`] = stepDef.processing_stage;
  updates[`orders/${orderKey}/currentLaundryStep`] = stepDef.currentLaundryStep;
  updates[`orders/${orderKey}/updatedAt`] = now;
  updates[`orders/${orderKey}/assignedStaffId`] = user.uid;
  updates[`orders/${orderKey}/assignedStaffName`] = user.name;

  if (canonicalKey === 'DELIVERED') {
    updates[`orders/${orderKey}/deliveredAt`] = now;
    updates[`orders/${orderKey}/delivered_at`] = now;
    updates[`orders/${orderKey}/completedAt`] = now;
  }

  // Clean old status indexes and set new status index
  const allStatuses = [
    'PICKED_UP',
    'DROPPED_OFF',
    'DROPPED_OFF_AT_LAUNDRY',
    'RECEIVED',
    'IN_CLEANING',
    'READY_FOR_DELIVERY',
    'OUT_FOR_DELIVERY',
    'DELIVERED'
  ];
  allStatuses.forEach(st => {
    if (st !== stepDef.status) {
      updates[`ordersByStatus/${st}/${orderKey}`] = null;
    }
  });
  updates[`ordersByStatus/${stepDef.status}/${orderKey}`] = now;

  // If order is ready for delivery, ensure delivery task exists for Delivery Portal
  if (canonicalKey === 'READY_FOR_DELIVERY') {
    const defaultAgentUid = 'b0DHZGmo4mVuhPTS9HngWS7VulB2'; // Ravi Sharma (Delivery Agent)
    const deliveryTaskId = order.deliveryTaskId || push(ref(rtdb, 'tasks')).key;
    updates[`orders/${orderKey}/deliveryTaskId`] = deliveryTaskId;

    const custName = (typeof order.customer_name === 'string' && order.customer_name)
      ? order.customer_name
      : ((typeof order.customer === 'string' && order.customer)
        ? order.customer
        : (order.customer?.name || order.customerName || order.pickup_full_name || 'Customer'));

    const custPhone = order.customer_phone || order.customerPhone || order.customer?.phone || order.pickup_phone || '+91 98765 43210';
    const address = order.delivery_address || order.pickup_address || order.address || 'Bengaluru';

    updates[`tasks/${deliveryTaskId}`] = {
      id: deliveryTaskId,
      orderId: orderKey,
      orderCode: order.code || order.order_number || order.id || orderKey,
      type: 'delivery',
      status: 'assigned',
      agentId: defaultAgentUid,
      customer: { name: custName, phone: custPhone },
      address,
      scheduledAt: now + 3600000,
      startedAt: null,
      completedAt: null,
      submittedOtp: null,
      failReason: null,
      createdAt: order.createdAt || now,
      updatedAt: now
    };

    // Index task under agent tasks
    updates[`agentTasks/${defaultAgentUid}/${deliveryTaskId}`] = true;

    // Ensure OTP for delivery handover exists
    updates[`orderSecrets/${orderKey}/deliveryOtp`] = '1234';
    updates[`orderSecrets/${orderKey}/otpAttempts`] = 0;

    // Notify customer
    if (order.customerId) {
      const custNotifPush = push(ref(rtdb, `notifications/${order.customerId}`));
      updates[`notifications/${order.customerId}/${custNotifPush.key}`] = {
        id: custNotifPush.key,
        type: 'order_ready',
        title: 'Clean & Ready!',
        body: `Your clothes for order ${order.code || order.order_number || orderKey} have completed processing and are ready for dispatch!`,
        orderId: orderKey,
        isRead: false,
        createdAt: now
      };
    }

    // Alert Admin
    const admNotifPush = push(ref(rtdb, 'notificationsByRole/admin'));
    updates[`notificationsByRole/admin/${admNotifPush.key}`] = {
      id: admNotifPush.key,
      type: 'ready_for_delivery',
      title: 'Order Ready for Delivery',
      body: `Order ${order.code || order.order_number || orderKey} is ready for delivery assignment.`,
      orderId: orderKey,
      isRead: false,
      createdAt: now
    };
  }

  // If marked delivered, update task completion
  if (canonicalKey === 'DELIVERED' && order.deliveryTaskId) {
    updates[`tasks/${order.deliveryTaskId}/status`] = 'completed';
    updates[`tasks/${order.deliveryTaskId}/completedAt`] = now;
    updates[`tasks/${order.deliveryTaskId}/updatedAt`] = now;
  }

  // Audit history
  const noteText = customNote || (isRevert ? `Reverted status back to ${stepDef.label}` : `Advanced status to ${stepDef.label}`);
  updates[`orderHistory/${orderKey}/${histPush.key}`] = {
    from: order.status || 'UNKNOWN',
    to: stepDef.status,
    stage: stepDef.stage,
    step: stepDef.label,
    byUid: user.uid,
    byName: user.name,
    note: noteText,
    at: now
  };

  await update(ref(rtdb), updates);

  // Sync to Firestore / other connected portals
  try {
    await updateFirestoreOrderStatus(orderKey, stepDef.status_display, {
      status: stepDef.status,
      orderStatus: stepDef.orderStatus,
      status_display: stepDef.status_display,
      raw_status: stepDef.raw_status,
      stage: stepDef.stage,
      processing_stage: stepDef.processing_stage,
      currentLaundryStep: stepDef.currentLaundryStep,
      updatedAt: now
    });
  } catch (syncErr) {
    console.warn('Firestore order status sync warning:', syncErr);
  }

  return { success: true, orderKey, step: stepDef };
};

/**
 * 1. Staff confirms receipt of garments at hub -> RECEIVED
 */
export const staffConfirmHubReceipt = async (orderId, staffUser) => {
  return updateLaundryStaffOrderStatus(
    orderId,
    'RECEIVED',
    staffUser,
    false,
    'Hub staff confirmed intake and physical inspection'
  );
};

/**
 * 2. Staff advances laundry step ONE STEP AT A TIME
 */
export const advanceLaundryStep = async (orderId, targetStep, staffUser) => {
  return updateLaundryStaffOrderStatus(
    orderId,
    targetStep,
    staffUser,
    false
  );
};

/**
 * Subscriptions for Staff Portal
 */
export const subscribeStaffActiveOrders = (onOrdersUpdated, onError) => {
  // Staff listens to active & completed status nodes
  const statuses = [
    'DROPPED_OFF_AT_LAUNDRY',
    'DROPPED_OFF',
    'PICKED_UP',
    'RECEIVED',
    'IN_CLEANING',
    'READY_FOR_DELIVERY',
    'OUT_FOR_DELIVERY',
    'DELIVERED'
  ];
  const statusListeners = [];
  let ordersMap = {};

  const emit = () => {
    const list = Object.values(ordersMap).sort((a, b) => {
      const timeA = a.updatedAt || a.placedAt || a.createdAt || 0;
      const timeB = b.updatedAt || b.placedAt || b.createdAt || 0;
      return timeB - timeA;
    });
    onOrdersUpdated(list);
  };

  statuses.forEach((st) => {
    const stRef = ref(rtdb, `ordersByStatus/${st}`);
    const unsub = onValue(stRef, async (snap) => {
      try {
        if (!snap.exists()) {
          // Remove keys of this status from ordersMap
          Object.keys(ordersMap).forEach((id) => {
            if (ordersMap[id].status === st) delete ordersMap[id];
          });
          emit();
          return;
        }
        const ids = Object.keys(snap.val());
        const promises = ids.map(async (id) => {
          const oSnap = await get(ref(rtdb, `orders/${id}`));
          return oSnap.exists() ? { ...oSnap.val(), id } : null;
        });
        const fetched = await Promise.all(promises);
        fetched.filter(Boolean).forEach((o) => {
          ordersMap[o.id] = o;
        });
        emit();
      } catch (err) {
        if (onError) onError(err);
      }
    }, onError);
    statusListeners.push({ ref: stRef, unsub });
  });

  return () => {
    statusListeners.forEach(({ ref: r, unsub: u }) => off(r, 'value', u));
  };
};

export const subscribeStaffOrderHistory = (onHistoryUpdated, onError) => {
  const compRef = ref(rtdb, 'ordersByStatus/DELIVERED');
  const unsub = onValue(compRef, async (snap) => {
    try {
      if (!snap.exists()) {
        onHistoryUpdated([]);
        return;
      }
      const ids = Object.keys(snap.val());
      const promises = ids.map(async (id) => {
        const oSnap = await get(ref(rtdb, `orders/${id}`));
        return oSnap.exists() ? { ...oSnap.val(), id } : null;
      });
      const resolved = (await Promise.all(promises)).filter(Boolean).reverse();
      onHistoryUpdated(resolved);
    } catch (err) {
      if (onError) onError(err);
    }
  }, onError);

  return () => off(compRef, 'value', unsub);
};

export const subscribeStaffNotifications = (onNotifsUpdated, onError) => {
  const notifsQuery = query(ref(rtdb, 'notificationsByRole/staff'), limitToLast(30));
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
