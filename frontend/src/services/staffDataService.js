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

/**
 * 1. Staff confirms receipt of garments at hub -> RECEIVED
 */
export const staffConfirmHubReceipt = async (orderId, staffUser) => {
  const orderSnap = await get(ref(rtdb, `orders/${orderId}`));
  if (!orderSnap.exists()) throw new Error('Order not found.');
  const order = orderSnap.val();

  if (order.status !== 'PICKED_UP') {
    throw new Error(`Cannot confirm receipt: Order status is currently "${order.status}", expected "PICKED_UP".`);
  }

  const now = Date.now();
  const histPush = push(ref(rtdb, `orderHistory/${orderId}`));
  const custNotifPush = push(ref(rtdb, `notifications/${order.customerId}`));

  const updates = {};
  updates[`orders/${orderId}/status`] = 'RECEIVED';
  updates[`orders/${orderId}/currentLaundryStep`] = 'inspect';
  updates[`orders/${orderId}/assignedStaffId`] = staffUser.uid;
  updates[`orders/${orderId}/assignedStaffName`] = staffUser.name || 'Laundry Specialist';

  // Move status indexes
  updates[`ordersByStatus/PICKED_UP/${orderId}`] = null;
  updates[`ordersByStatus/RECEIVED/${orderId}`] = now;

  // History
  updates[`orderHistory/${orderId}/${histPush.key}`] = {
    from: 'PICKED_UP',
    to: 'RECEIVED',
    byUid: staffUser.uid,
    byName: staffUser.name || 'Laundry Staff',
    note: 'Hub staff confirmed intake and physical inspection',
    at: now
  };

  // Customer notification
  updates[`notifications/${order.customerId}/${custNotifPush.key}`] = {
    id: custNotifPush.key,
    type: 'laundry_intake',
    title: 'Garments Arrived at Hub',
    body: `Your clothes for order ${order.code} have arrived at our central laundry facility and passed initial inspection.`,
    orderId,
    isRead: false,
    createdAt: now
  };

  await update(ref(rtdb), updates);
};

/**
 * 2. Staff advances laundry step ONE STEP AT A TIME
 */
export const advanceLaundryStep = async (orderId, targetStep, staffUser) => {
  const orderSnap = await get(ref(rtdb, `orders/${orderId}`));
  if (!orderSnap.exists()) throw new Error('Order not found.');
  const order = orderSnap.val();

  const currentStep = order.currentLaundryStep || 'inspect';
  const currentIndex = LAUNDRY_STEP_ORDER.indexOf(currentStep);
  const targetIndex = LAUNDRY_STEP_ORDER.indexOf(targetStep);

  if (targetIndex !== currentIndex + 1) {
    throw new Error(`Step violation: Cannot skip or repeat steps. Current step is "${currentStep}", next allowed step is "${LAUNDRY_STEP_ORDER[currentIndex + 1]}".`);
  }

  const now = Date.now();
  const histPush = push(ref(rtdb, `orderHistory/${orderId}`));
  const isFinalStep = targetStep === 'pack';
  const nextStatus = isFinalStep ? 'READY_FOR_DELIVERY' : 'IN_CLEANING';

  const updates = {};
  updates[`orders/${orderId}/status`] = nextStatus;
  updates[`orders/${orderId}/currentLaundryStep`] = targetStep;

  // Update status indexes
  if (order.status !== nextStatus) {
    updates[`ordersByStatus/${order.status}/${orderId}`] = null;
    updates[`ordersByStatus/${nextStatus}/${orderId}`] = now;
  }

  // If final step (packing) completed -> Create unassigned delivery task!
  if (isFinalStep) {
    const taskPush = push(ref(rtdb, 'tasks'));
    const deliveryTaskId = taskPush.key;

    updates[`orders/${orderId}/deliveryTaskId`] = deliveryTaskId;
    updates[`tasks/${deliveryTaskId}`] = {
      id: deliveryTaskId,
      orderId,
      orderCode: order.code,
      type: 'delivery',
      status: 'unassigned',
      agentId: null,
      customer: {
        name: order.customerName,
        phone: order.customerPhone
      },
      address: order.address,
      scheduledAt: now + 3600000,
      startedAt: null,
      completedAt: null,
      submittedOtp: null,
      failReason: null
    };

    // Alert admin for delivery agent assignment
    const admNotifPush = push(ref(rtdb, 'notificationsByRole/admin'));
    updates[`notificationsByRole/admin/${admNotifPush.key}`] = {
      id: admNotifPush.key,
      type: 'ready_for_delivery',
      title: 'Order Ready for Delivery',
      body: `Order ${order.code} has finished processing and packing. Needs delivery agent assigned.`,
      orderId,
      isRead: false,
      createdAt: now
    };

    // Notify customer
    const custNotifPush = push(ref(rtdb, `notifications/${order.customerId}`));
    updates[`notifications/${order.customerId}/${custNotifPush.key}`] = {
      id: custNotifPush.key,
      type: 'order_ready',
      title: 'Clean & Ready!',
      body: `Your clothes for order ${order.code} have completed washing, ironing, and quality inspection. Ready for dispatch!`,
      orderId,
      isRead: false,
      createdAt: now
    };
  }

  // History note
  updates[`orderHistory/${orderId}/${histPush.key}`] = {
    from: order.status,
    to: nextStatus,
    byUid: staffUser.uid,
    byName: staffUser.name || 'Laundry Specialist',
    note: `Completed step: ${currentStep} -> Advanced to: ${targetStep}`,
    at: now
  };

  await update(ref(rtdb), updates);
};

/**
 * Subscriptions for Staff Portal
 */
export const subscribeStaffActiveOrders = (onOrdersUpdated, onError) => {
  // Staff listens to status nodes: RECEIVED, IN_CLEANING, READY_FOR_DELIVERY
  const statuses = ['RECEIVED', 'IN_CLEANING', 'READY_FOR_DELIVERY'];
  const statusListeners = [];
  let ordersMap = {};

  const emit = () => {
    const list = Object.values(ordersMap).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
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
