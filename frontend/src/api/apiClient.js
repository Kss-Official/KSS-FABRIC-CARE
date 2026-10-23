import { ref, get, set, update, push, query, orderByChild, equalTo, limitToLast } from 'firebase/database';
import { auth, rtdb } from '../config/firebase.js';
import {
  createCustomerOrder,
  confirmCustomerPayment,
  cancelCustomerOrder,
  markNotificationRead,
  submitCustomerComplaint
} from '../services/customerDataService.js';
import {
  assignPickupAgent,
  assignDeliveryAgent,
  adminOverrideOrderStatus,
  replyToSupportComplaint
} from '../services/adminDataService.js';
import {
  staffConfirmHubReceipt,
  advanceLaundryStep,
  updateLaundryStaffOrderStatus
} from '../services/staffDataService.js';
import {
  startPickupTask,
  verifyAndCompletePickup,
  recordHubDropoff,
  startDeliveryTask,
  verifyAndCompleteDelivery,
  recordDeliveryFailureAndReschedule
} from '../services/deliveryDataService.js';
import { calculateOrderTotal } from '../utils/helpers.js';

export class ApiError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR', fields = {}, status = 500) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.fields = fields;
    this.status = status;
  }
}

// -------------------------------------------------------------
// NORMALIZER FOR ORDER OBJECTS
// -------------------------------------------------------------
export const normalizeOrder = (o) => {
  if (!o || typeof o !== 'object') return o;
  const addressStr = o.pickup_address || (o.address ? [o.address.flatHouse, o.address.areaColony, o.address.city].filter(Boolean).join(', ') : 'Default Location');
  const formatIsoDate = (val) => {
    if (!val) return '';
    try {
      if (typeof val === 'string') {
        const tr = val.trim();
        if (/^\d{4}-\d{2}-\d{2}/.test(tr)) return tr.slice(0, 10);
      }
      const dt = val?.toDate ? val.toDate() : new Date(typeof val === 'number' ? val : (typeof val === 'string' && /^\d+$/.test(val) ? Number(val) : val));
      if (!isNaN(dt.getTime())) return dt.toISOString().split('T')[0];
    } catch (_) {}
    return String(val);
  };

  const formatTime12h = (t) => {
    if (!t) return '';
    const s = String(t).trim();
    if (/am|pm/i.test(s)) return s;
    const parts = s.split(':');
    if (parts.length >= 2) {
      let h = parseInt(parts[0], 10);
      const m = parts[1].slice(0, 2);
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      return `${h}:${m} ${ampm}`;
    }
    return s;
  };

  // Resolve pickup date (priority to actual structured pickup date)
  let pickupDate = '';
  if (o.pickup && typeof o.pickup === 'object' && o.pickup.date) {
    pickupDate = o.pickup.date;
  }
  if (!pickupDate && o.pickup_date && o.pickup_date !== 'Today' && o.pickup_date !== 'Scheduled') {
    pickupDate = o.pickup_date;
  }
  if (!pickupDate && o.pickupDate) {
    pickupDate = o.pickupDate;
  }
  if (!pickupDate && o.dateText && o.dateText !== 'Today') {
    pickupDate = o.dateText;
  }
  if (!pickupDate && o.date && o.date !== 'Today') {
    pickupDate = o.date;
  }
  if (!pickupDate && (o.placedAt || o.createdAt)) {
    pickupDate = formatIsoDate(o.placedAt || o.createdAt);
  }
  if (!pickupDate) {
    pickupDate = new Date().toISOString().split('T')[0];
  }

  // Resolve pickup time slot
  let pickupSlot = '';
  if (o.pickup && typeof o.pickup === 'object') {
    if (o.pickup.time_slot || o.pickup.timeSlot) {
      pickupSlot = o.pickup.time_slot || o.pickup.timeSlot;
    } else if (o.pickup.from && o.pickup.to) {
      pickupSlot = `${formatTime12h(o.pickup.from)} – ${formatTime12h(o.pickup.to)}`;
    }
  }
  if (!pickupSlot && o.pickup_time_slot && o.pickup_time_slot !== 'Standard Slot') {
    pickupSlot = o.pickup_time_slot;
  }
  if (!pickupSlot && o.timeText) {
    pickupSlot = o.timeText;
  }
  if (!pickupSlot) {
    pickupSlot = '11:00 AM – 1:00 PM';
  }

  // Resolve delivery date
  let deliveryDate = '';
  if (o.delivery && typeof o.delivery === 'object' && o.delivery.date) {
    deliveryDate = o.delivery.date;
  }
  if (!deliveryDate && o.delivery_date && o.delivery_date !== '14 Oct 2026') {
    deliveryDate = o.delivery_date;
  }
  if (!deliveryDate && o.deliveryDate) {
    deliveryDate = o.deliveryDate;
  }
  if (!deliveryDate && o.estimated_delivery) {
    deliveryDate = o.estimated_delivery;
  }
  if (!deliveryDate && o.dueBy) {
    deliveryDate = formatIsoDate(o.dueBy);
  }
  if (!deliveryDate) {
    try {
      const pDt = new Date(pickupDate);
      if (!isNaN(pDt.getTime())) {
        pDt.setDate(pDt.getDate() + (o.isExpress ? 1 : 2));
        deliveryDate = pDt.toISOString().split('T')[0];
      }
    } catch (_) {}
  }
  if (!deliveryDate) {
    const fallbackDt = new Date();
    fallbackDt.setDate(fallbackDt.getDate() + 2);
    deliveryDate = fallbackDt.toISOString().split('T')[0];
  }

  // Resolve delivery time slot
  let deliverySlot = '';
  if (o.delivery && typeof o.delivery === 'object') {
    if (o.delivery.time_slot || o.delivery.timeSlot) {
      deliverySlot = o.delivery.time_slot || o.delivery.timeSlot;
    } else if (o.delivery.from && o.delivery.to) {
      deliverySlot = `${formatTime12h(o.delivery.from)} – ${formatTime12h(o.delivery.to)}`;
    }
  }
  if (!deliverySlot && o.delivery_time_slot) {
    deliverySlot = o.delivery_time_slot;
  }
  if (!deliverySlot && o.deliveryTimeSlot) {
    deliverySlot = o.deliveryTimeSlot;
  }
  if (!deliverySlot) {
    deliverySlot = '02:00 PM – 05:00 PM';
  }

  let rawItems = [];
  if (Array.isArray(o.items)) {
    rawItems = o.items;
  } else if (o.items && typeof o.items === 'object') {
    rawItems = Object.values(o.items);
  }

  const normItems = rawItems.map(it => {
    const name = it.name || it.item_name || 'Garment';
    const quantity = Number(it.quantity || it.qty || 1);
    let p = it.unitPrice ?? it.price ?? it.rate ?? 0;
    if (typeof p === 'string') p = parseFloat(p) || 0;
    const unitPrice = (p >= 1000 || (p >= 500 && p % 100 === 0)) ? (p / 100) : p;

    let t = it.lineTotal ?? it.total_price ?? it.total ?? (unitPrice * quantity);
    if (typeof t === 'string') t = parseFloat(t) || 0;
    const lineTotal = (t >= 1000 || (t >= 500 && t % 100 === 0)) ? (t / 100) : t;

    return {
      ...it,
      name,
      item_name: name,
      quantity,
      price: unitPrice,
      unitPrice,
      rate: unitPrice,
      total: lineTotal,
      lineTotal
    };
  });

  const totalAmount = calculateOrderTotal(o);
  const finalTotal = parseFloat(totalAmount) || 0;
  const itemsSummary = normItems.length > 0
    ? normItems.map(it => `${it.name} × ${it.quantity}`).join(', ')
    : '1 Item';

  const rawPayment = String(o.paymentStatus || o.payment_status || o.payment || '').toUpperCase();
  const rawStatus = String(o.status || '').toUpperCase();
  const isPaid = rawPayment.includes('PAID') || 
                 rawPayment.includes('COMPLETED') || 
                 rawPayment.includes('SUCCESS') || 
                 Boolean(o.is_paid) ||
                 ['PLACED', 'PICKED_UP', 'IN_CLEANING', 'DELIVERED', 'COMPLETED', 'READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 'ACCEPTED', 'PICKUP_ASSIGNED', 'PICKUP_SCHEDULED', 'PICKUP_IN_PROGRESS', 'RECEIVED_AT_LAUNDRY', 'IN_PROCESS', 'QUALITY_CHECK', 'PACKED', 'PENDING PICKUP', 'IN CLEANING', 'READY FOR DELIVERY', 'IN TRANSIT'].includes(rawStatus);

  const isRefunded = rawPayment.includes('REFUND') || rawStatus === 'REFUNDED';
  const isCancelled = (rawStatus === 'CANCELLED' || rawPayment.includes('CANCEL')) && !isPaid;

  let paymentStatusDisplay = 'PAID';
  if (isRefunded) {
    paymentStatusDisplay = 'REFUNDED';
  } else if (isCancelled) {
    paymentStatusDisplay = 'CANCELLED';
  } else if (!isPaid && (rawStatus === 'PAYMENT_PENDING' || rawPayment.includes('PENDING') || rawPayment.includes('UNPAID'))) {
    paymentStatusDisplay = 'PENDING';
  }

  return {
    ...o,
    id: o.code || o.id,
    order_id: o.code || o.id,
    order_number: o.code || o.id,
    pickup_address: addressStr,
    pickup_date: pickupDate,
    pickup_time_slot: pickupSlot,
    pickupTime: `${pickupDate}, ${pickupSlot}`,
    delivery_date: deliveryDate,
    delivery_time_slot: deliverySlot,
    total_amount: totalAmount,
    amount: totalAmount,
    total: finalTotal,
    paymentStatus: paymentStatusDisplay === 'PAID' ? 'Paid' : (paymentStatusDisplay === 'PENDING' ? 'Pending' : paymentStatusDisplay),
    payment_status: paymentStatusDisplay,
    payment: paymentStatusDisplay === 'PAID' ? 'Paid' : (paymentStatusDisplay === 'PENDING' ? 'Pending' : paymentStatusDisplay),
    is_paid: paymentStatusDisplay === 'PAID',
    isPaid: paymentStatusDisplay === 'PAID',
    items: normItems,
    items_summary: itemsSummary,
    customer_name: o.customerName || o.customer_name || 'Customer',
    customer_phone: o.customerPhone || o.customer_phone || '',
    status: o.status === 'PLACED' ? 'Pending Pickup' : (o.status === 'IN_CLEANING' ? 'In Cleaning' : (o.status === 'READY_FOR_DELIVERY' ? 'Ready for Delivery' : (o.status === 'OUT_FOR_DELIVERY' ? 'In Transit' : (o.status === 'DELIVERED' ? 'Completed' : (o.status === 'CANCELLED' ? 'Cancelled' : o.status)))))
  };
};

export const ordersApi = {
  getOrders: async () => {
    let currentUid = auth.currentUser?.uid;
    let role = null;
    let userEmail = auth.currentUser?.email;
    let userPhone = '';

    if (!currentUid) {
      try {
        const cached = JSON.parse(localStorage.getItem('fabricare_user') || '{}');
        currentUid = cached?.uid || cached?.id;
        role = cached?.role;
        userEmail = userEmail || cached?.email;
        userPhone = cached?.phone || cached?.phoneNumber || '';
      } catch (_) { }
    }

    if (!currentUid) return { data: [] };

    try {
      if (!role) {
        const userRoleSnap = await get(ref(rtdb, `users/${currentUid}/role`));
        if (userRoleSnap.exists()) role = userRoleSnap.val();
      }

      if (role === 'admin') {
        const snap = await get(query(ref(rtdb, 'orders'), limitToLast(100)));
        if (!snap.exists()) return { data: [] };
        const raw = Object.values(snap.val()).reverse();
        return { data: raw.map(normalizeOrder) };
      }

      const collectedOrders = [];
      const seenIds = new Set();

      const addUniqueOrder = (rawItem) => {
        if (!rawItem) return;
        const norm = normalizeOrder(rawItem);
        const codeKey = String(norm.order_number || norm.code || norm.id || '').trim().toLowerCase();
        const rawKey = String(rawItem.key || rawItem.id || norm.key || norm.id || '').trim().toLowerCase();
        if (codeKey && seenIds.has(codeKey)) return;
        if (rawKey && seenIds.has(rawKey)) return;
        if (codeKey) seenIds.add(codeKey);
        if (rawKey) seenIds.add(rawKey);
        collectedOrders.push(norm);
      };

      const uOrdersSnap = await get(ref(rtdb, `userOrders/${currentUid}`));
      if (uOrdersSnap.exists()) {
        const ids = Object.keys(uOrdersSnap.val());
        const promises = ids.map(async id => {
          const s = await get(ref(rtdb, `orders/${id}`));
          return s.exists() ? { ...s.val(), id, docId: id, key: id } : null;
        });
        const res = (await Promise.all(promises)).filter(Boolean);
        res.forEach(rawItem => addUniqueOrder(rawItem));
      }

      // Robust scan across orders strictly filtered by customerId / customerEmail / customerPhone
      const allSnap = await get(ref(rtdb, 'orders'));
      if (allSnap.exists()) {
        const all = Object.entries(allSnap.val()).map(([k, val]) => ({ ...val, id: k, docId: k, key: k }));
        const matched = all.filter(o => {
          const cId = o.customerId || o.customer_id || o.userId;
          if (cId && String(cId) === String(currentUid)) return true;
          if (userEmail && (String(o.customerEmail || o.customer?.email || '').toLowerCase() === userEmail.toLowerCase())) return true;
          if (userPhone && o.customerPhone && userPhone.length >= 10 && o.customerPhone.replace(/\D/g, '').endsWith(userPhone.replace(/\D/g, '').slice(-10))) return true;
          return false;
        });
        matched.forEach(m => addUniqueOrder(m));
      }

      collectedOrders.sort((a, b) => (b.createdAt || b.created_at || 0) - (a.createdAt || a.created_at || 0));
      return { data: collectedOrders };
    } catch (err) {
      console.warn('ordersApi.getOrders error:', err);
      return { data: [] };
    }
  },

  getOrderById: async (id) => {
    if (!id) return { data: null };
    const rawId = String(id).trim();
    const cleanId = rawId.replace(/^#/, '');
    const cleanTarget = cleanId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const targetDigits = cleanTarget.replace(/\D/g, '');

    let foundOrder = null;

    // 1. Direct match on key
    try {
      const snap = await get(ref(rtdb, `orders/${cleanId}`));
      if (snap.exists()) {
        foundOrder = normalizeOrder({ ...snap.val(), docId: cleanId, id: cleanId });
      }
      if (!foundOrder) {
        const rawSnap = await get(ref(rtdb, `orders/${rawId}`));
        if (rawSnap.exists()) {
          foundOrder = normalizeOrder({ ...rawSnap.val(), docId: rawId, id: rawId });
        }
      }
    } catch (_) {}

    // 2. Query by code
    if (!foundOrder) {
      try {
        const qSnap = await get(query(ref(rtdb, 'orders'), orderByChild('code'), equalTo(cleanId)));
        if (qSnap.exists()) {
          const firstKey = Object.keys(qSnap.val())[0];
          foundOrder = normalizeOrder({ ...qSnap.val()[firstKey], docId: firstKey, id: firstKey });
        }
      } catch (_) {}
    }

    // 3. Scan all orders for robust matching by code, order_number, or digits
    if (!foundOrder) {
      try {
        const allSnap = await get(ref(rtdb, 'orders'));
        if (allSnap.exists()) {
          const all = allSnap.val() || {};
          const foundKey = Object.keys(all).find(k => {
            const o = all[k];
            if (!o) return false;
            const cK = String(k || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            const cCode = String(o.code || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            const cId = String(o.id || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            const cNum = String(o.order_number || o.order_id || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            const cDisp = String(o.displayId || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

            // 1. Exact matches
            if (
              cK === cleanTarget ||
              cCode === cleanTarget ||
              cId === cleanTarget ||
              cNum === cleanTarget ||
              cDisp === cleanTarget
            ) {
              return true;
            }

            // 2. Suffix matches (only if candidate string has at least 4 chars)
            if (cleanTarget.length >= 4) {
              if (cCode.length >= 4 && (cCode.endsWith(cleanTarget) || cleanTarget.endsWith(cCode))) return true;
              if (cNum.length >= 4 && (cNum.endsWith(cleanTarget) || cleanTarget.endsWith(cNum))) return true;
              if (cId.length >= 4 && (cId.endsWith(cleanTarget) || cleanTarget.endsWith(cId))) return true;
            }

            // 3. Digit matches (only if candidate digits have at least 4 digits)
            if (targetDigits.length >= 4) {
              const codeDigits = cCode.replace(/\D/g, '');
              const numDigits = cNum.replace(/\D/g, '');
              const idDigits = cId.replace(/\D/g, '');
              if (codeDigits.length >= 4 && (codeDigits === targetDigits || codeDigits.endsWith(targetDigits) || targetDigits.endsWith(codeDigits))) return true;
              if (numDigits.length >= 4 && (numDigits === targetDigits || numDigits.endsWith(targetDigits) || targetDigits.endsWith(numDigits))) return true;
              if (idDigits.length >= 4 && (idDigits === targetDigits || idDigits.endsWith(targetDigits) || targetDigits.endsWith(idDigits))) return true;
            }
            return false;
          });

          if (foundKey) {
            foundOrder = normalizeOrder({ ...all[foundKey], docId: foundKey, id: foundKey });
          }
        }
      } catch (_) {}
    }

    if (!foundOrder) return { data: null };

    // Security check: if user is logged in as a customer, verify order belongs to them
    let currentUid = auth.currentUser?.uid;
    let role = null;
    let userEmail = auth.currentUser?.email;
    if (!currentUid) {
      try {
        const cached = JSON.parse(localStorage.getItem('fabricare_user') || '{}');
        currentUid = cached?.uid || cached?.id;
        role = cached?.role;
        userEmail = userEmail || cached?.email;
      } catch (_) {}
    }

    const isPrivileged = role === 'admin' || role === 'staff' || role === 'laundry_staff' || role === 'agent' || role === 'delivery_agent';
    if (!isPrivileged && currentUid && foundOrder) {
      const cId = foundOrder.customerId || foundOrder.customer_id || foundOrder.userId;
      const cEmail = foundOrder.customerEmail || foundOrder.customer?.email;
      const belongsToCustomer = (cId && String(cId) === String(currentUid)) || (userEmail && cEmail && String(cEmail).toLowerCase() === String(userEmail).toLowerCase());
      if (!belongsToCustomer) {
        return { data: null };
      }
    }

    return { data: foundOrder };
  },

  createOrder: async (payload) => {
    const res = await createCustomerOrder(payload, auth.currentUser);
    await confirmCustomerPayment(res.orderId, 'UPI_MOCK', auth.currentUser);
    return { data: res.orderData };
  },

  cancelOrder: async (id, reason) => {
    await cancelCustomerOrder(id, reason, auth.currentUser);
    return { data: { success: true } };
  },

  updateStatus: async (id, status, reason = 'Status updated') => {
    await adminOverrideOrderStatus(id, status, reason, auth.currentUser);
    return { data: { success: true } };
  }
};

export const staffApi = {
  getOrders: async () => {
    try {
      const snap = await get(ref(rtdb, 'orders'));
      if (snap.exists()) {
        const all = snap.val() || {};
        const items = Object.keys(all)
          .filter(id => !id.includes('P4CbA4_8YTw7XnFWZiV'))
          .map(id => normalizeOrder({
            ...all[id],
            id,
            key: id,
            order_number: all[id].code || all[id].order_number || id
          }))
          .filter(o => o.code || (o.items && Object.keys(o.items).length > 0) || (o.customerName && o.customerName !== 'Customer'));
        items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        return { data: { items } };
      }
    } catch (_) { }

    const statuses = ['DROPPED_OFF_AT_LAUNDRY', 'DROPPED_OFF', 'PICKED_UP', 'RECEIVED', 'IN_CLEANING', 'READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 'DELIVERED'];
    const promises = statuses.map(st => get(ref(rtdb, `ordersByStatus/${st}`)).catch(() => null));
    const snaps = await Promise.all(promises);
    const orderIds = new Set();
    snaps.forEach(s => {
      if (s && s.exists()) {
        Object.keys(s.val()).forEach(id => orderIds.add(id));
      }
    });

    const orderPromises = Array.from(orderIds).map(async id => {
      try {
        const oSnap = await get(ref(rtdb, `orders/${id}`));
        return oSnap.exists() ? normalizeOrder({ ...oSnap.val(), id, key: id, order_number: oSnap.val().code || oSnap.val().order_number || id }) : null;
      } catch (_) {
        return null;
      }
    });
    const items = (await Promise.all(orderPromises)).filter(Boolean);
    return { data: { items } };
  },

  updateStatus: async (orderId, targetStep, note = '') => {
    const staffUser = {
      uid: auth.currentUser?.uid || 'usr_staff_001',
      name: auth.currentUser?.displayName || 'Staff Specialist'
    };
    const res = await updateLaundryStaffOrderStatus(orderId, targetStep, staffUser, false, note);
    return { data: res };
  },

  advanceStage: async (orderId, { stage, notes } = {}) => {
    return staffApi.updateStatus(orderId, stage || 'WASHING', notes || '');
  },

  qualityCheck: async (orderId, { passed, notes, reprocess_stage } = {}) => {
    const targetStep = passed ? 'PACKING' : (reprocess_stage || 'WASHING');
    return staffApi.updateStatus(orderId, targetStep, notes || '');
  },

  packOrder: async (orderId, { notes } = {}) => {
    return staffApi.updateStatus(orderId, 'READY_FOR_DELIVERY', notes || '');
  },

  confirmReceipt: async (orderId, payload = {}) => {
    return staffApi.updateStatus(orderId, 'RECEIVED', payload?.notes || 'Receipt confirmed');
  },

  getDashboard: async () => {
    const today = new Date().toISOString().split('T')[0];
    const snap = await get(ref(rtdb, `stats/daily/${today}`));
    return { data: snap.exists() ? snap.val() : { ordersPlaced: 0, revenue: 0, completedOrders: 0 } };
  },

  getCounts: async () => {
    return {
      data: {
        inspect: 1,
        wash: 2,
        dry: 1,
        iron: 1,
        pack: 1
      }
    };
  },

  getHistory: async () => {
    try {
      const itemsMap = new Map();

      // 1. Fetch from main RTDB orders node
      const snap = await get(ref(rtdb, 'orders'));
      if (snap.exists()) {
        const all = snap.val() || {};
        for (const [key, raw] of Object.entries(all)) {
          if (!raw || typeof raw !== 'object') continue;
          const s = String(raw.status || raw.orderStatus || raw.status_display || raw.raw_status || '').toUpperCase().trim();
          const stage = String(raw.stage || raw.processing_stage || '').toUpperCase().trim();

          // Exclude orders in active delivery or cleaning stages
          const isActiveStage = s.includes('READY') || s.includes('OUT_FOR_DELIVERY') || s.includes('OUT FOR DELIVERY') ||
                                s.includes('NEARBY') || s.includes('PACK') || s.includes('WASH') || s.includes('DRY') ||
                                s.includes('IRON') || s.includes('CLEAN') || s.includes('IN_PROCESS') || s.includes('INTAKE') ||
                                s.includes('PICK') || s.includes('TRANSIT') || stage === 'READY' || stage === 'PACKED' ||
                                stage === 'OUT_FOR_DELIVERY' || stage === 'NEARBY' || stage === 'INSPECTION' ||
                                stage === 'WASHING' || stage === 'DRYING' || stage === 'IRONING';

          const isDelivered = !isActiveStage && (s === 'DELIVERED' || s === 'COMPLETED' || stage === 'DELIVERED' || stage === 'COMPLETED');
          const isCancelled = s.includes('CANCEL') || stage.includes('CANCEL');

          if (isDelivered || isCancelled) {
            const norm = normalizeOrder({ ...raw, id: raw.id || raw.code || key, key });
            norm.historyStatus = isCancelled ? 'cancelled' : 'delivered';
            const k = String(norm.code || norm.id || norm.order_number || key);
            itemsMap.set(k, norm);
          }
        }
      }

      // 2. Supplement from ordersByStatus/DELIVERED if any exists
      try {
        const delSnap = await get(ref(rtdb, 'ordersByStatus/DELIVERED'));
        if (delSnap.exists()) {
          const ids = Object.keys(delSnap.val() || {});
          for (const id of ids) {
            if (!itemsMap.has(id)) {
              const oSnap = await get(ref(rtdb, `orders/${id}`));
              if (oSnap.exists()) {
                const val = oSnap.val();
                const s = String(val.status || val.raw_status || val.orderStatus || '').toUpperCase().trim();
                if (!s.includes('READY') && !s.includes('OUT_FOR_DELIVERY') && (s === 'DELIVERED' || s === 'COMPLETED')) {
                  const norm = normalizeOrder({ ...val, id, key: id });
                  norm.historyStatus = 'delivered';
                  const k = String(norm.code || norm.id || norm.order_number || id);
                  itemsMap.set(k, norm);
                }
              }
            }
          }
        }
      } catch (_) {}

      // 3. Supplement from ordersByStatus/CANCELLED if any exists
      try {
        const canSnap = await get(ref(rtdb, 'ordersByStatus/CANCELLED'));
        if (canSnap.exists()) {
          const ids = Object.keys(canSnap.val() || {});
          for (const id of ids) {
            if (!itemsMap.has(id)) {
              const oSnap = await get(ref(rtdb, `orders/${id}`));
              if (oSnap.exists()) {
                const norm = normalizeOrder({ ...oSnap.val(), id, key: id });
                norm.historyStatus = 'cancelled';
                const k = String(norm.code || norm.id || norm.order_number || id);
                itemsMap.set(k, norm);
              }
            }
          }
        }
      } catch (_) {}

      const items = Array.from(itemsMap.values());

      // 4. Sort newest first
      items.sort((a, b) => {
        const timeA = a.deliveredAt || a.delivered_at || a.completedAt || a.updatedAt || a.placedAt || a.createdAt || 0;
        const timeB = b.deliveredAt || b.delivered_at || b.completedAt || b.updatedAt || b.placedAt || b.createdAt || 0;
        const numA = typeof timeA === 'number' ? timeA : new Date(timeA).getTime() || 0;
        const numB = typeof timeB === 'number' ? timeB : new Date(timeB).getTime() || 0;
        return numB - numA;
      });

      return { data: { items, total: items.length } };
    } catch (err) {
      console.warn('staffApi.getHistory error:', err);
      return { data: { items: [], total: 0 } };
    }
  }
};

export const deliveryApi = {
  getTasks: async () => {
    const uid = auth.currentUser?.uid || 'b0DHZGmo4mVuhPTS9HngWS7VulB2';
    const taskIdsSet = new Set();

    if (uid) {
      try {
        const agentTasksSnap = await get(ref(rtdb, `agentTasks/${uid}`));
        if (agentTasksSnap.exists()) {
          Object.keys(agentTasksSnap.val()).forEach(id => taskIdsSet.add(id));
        }
      } catch (_) {}
    }

    // Collect all tasks from RTDB tasks node (both pickup and delivery, assigned and unassigned)
    try {
      const allTasksSnap = await get(ref(rtdb, 'tasks'));
      if (allTasksSnap.exists()) {
        const allTasks = allTasksSnap.val() || {};
        Object.keys(allTasks).forEach(tid => {
          const t = allTasks[tid];
          if (t) {
            taskIdsSet.add(tid);
          }
        });
      }
    } catch (_) {}

    // Also collect all orders from RTDB orders node to ensure zero real requests are missed
    try {
      const allOrdersSnap = await get(ref(rtdb, 'orders'));
      if (allOrdersSnap.exists()) {
        const allOrders = allOrdersSnap.val() || {};
        Object.keys(allOrders).forEach(oid => {
          const o = allOrders[oid];
          if (o && (o.code || o.order_number || o.id)) {
            const code = String(o.code || o.order_number || o.id || oid).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            taskIdsSet.add(`order_pk_${code}`);
            const vStatus = String(o.status || o.raw_status || '').toUpperCase();
            const isDel = ['READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 'DELIVERY_ASSIGNED', 'NEARBY', 'DELIVERED', 'COMPLETED'].includes(vStatus) || o.delivery_reported === true;
            if (isDel) {
              taskIdsSet.add(`order_dl_${code}`);
            }
          }
        });
      }
    } catch (_) {}

    const taskIds = Array.from(taskIdsSet);
    const promises = taskIds.map(async id => {
      let t = null;
      let orderData = null;

      if (!id.startsWith('order_')) {
        const tSnap = await get(ref(rtdb, `tasks/${id}`));
        if (tSnap.exists()) {
          t = tSnap.val();
          if (t.orderId) {
            try {
              const oSnap = await get(ref(rtdb, `orders/${t.orderId}`));
              if (oSnap.exists()) {
                orderData = oSnap.val();
              }
            } catch (_) {}
          }
          if (!orderData && (t.orderCode || t.order_code)) {
            try {
              const code = t.orderCode || t.order_code;
              const allOrdersSnap = await get(ref(rtdb, 'orders'));
              if (allOrdersSnap.exists()) {
                const all = allOrdersSnap.val() || {};
                for (const [k, v] of Object.entries(all)) {
                  if (v && (v.code === code || v.order_number === code || v.id === code || k === code)) {
                    orderData = v;
                    break;
                  }
                }
              }
            } catch (_) {}
          }
          if (orderData) {
            const rawOrdStatus = String(orderData.status || orderData.raw_status || '').toUpperCase();
            const isPickup = (t.type || '').toLowerCase() === 'pickup';
            if (!isPickup && (t.delivery_reported || t.isDeliveryReported || orderData.delivery_reported || orderData.isDeliveryReported)) {
              t.type = 'delivery';
              t.delivery_reported = true;
            }
            if (!isPickup && (rawOrdStatus === 'RESCHEDULED' || orderData.stage === 'rescheduled')) {
              t.status = 'rescheduled';
              t.failedReason = orderData.failedReason || t.failedReason;
              t.comment = orderData.failureComment || orderData.comment || t.comment;
            } else if (['DELIVERED'].includes(rawOrdStatus) && !isPickup) {
              t.status = 'completed';
            } else if (['DROPPED_OFF_AT_LAUNDRY', 'DROPPED_OFF', 'IN CLEANING', 'IN_CLEANING', 'AT_HUB', 'COMPLETED', 'DELIVERED', 'READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 'RESCHEDULED'].includes(rawOrdStatus) && isPickup) {
              t.status = 'completed';
              t.stage = 'inspection';
              t.tracker_stage = 'AT_HUB';
              t.droppedAtHub = orderData.droppedAtHub || orderData.droppedOffAt || orderData.collectedAt || Date.now();
            } else if (['PICKED_UP', 'COLLECTED'].includes(rawOrdStatus) && isPickup) {
              if (t.status === 'completed' || t.tracker_stage === 'AT_HUB' || Boolean(t.droppedAtHub || t.droppedOffAt)) {
                t.status = 'completed';
                t.stage = 'inspection';
                t.tracker_stage = 'AT_HUB';
                t.droppedAtHub = orderData.droppedAtHub || orderData.droppedOffAt || t.droppedAtHub || Date.now();
              } else {
                t.status = 'picked_up';
                t.stage = 'picked';
              }
            }

            t.orderStatus = orderData.status;
            t.order_status = orderData.status;
            t.orderData = orderData;

            const ordCustName = orderData.customerName || orderData.customer?.name;
            if (ordCustName && ordCustName !== 'Customer') {
              t.customerName = ordCustName;
              t.customer = {
                name: ordCustName,
                phone: orderData.customerPhone || orderData.customer?.phone || t.customer?.phone || ''
              };
            }
            if (orderData.address) {
              t.address = orderData.address;
            }
          }
        }
      }

      // If id is order_... or task wasn't in tasks node, build task directly from orders node
      if (!t) {
        const cleanTarget = String(id).replace(/^order_(pk_|dl_)?/, '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const forceType = String(id).startsWith('order_pk_') ? 'pickup' : (String(id).startsWith('order_dl_') ? 'delivery' : null);
        try {
          const allOrdersSnap = await get(ref(rtdb, 'orders'));
          if (allOrdersSnap.exists()) {
            const all = allOrdersSnap.val() || {};
            for (const [k, v] of Object.entries(all)) {
              if (!v) continue;
              const cK = String(k || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
              const cCode = String(v.code || v.order_number || v.id || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
              if (cK === cleanTarget || cCode === cleanTarget) {
                orderData = v;
                const vStatus = String(v.status || '').toUpperCase();
                const vStage = String(v.stage || '').toLowerCase();
                const isDel = forceType === 'pickup' ? false : (forceType === 'delivery' ? true : (
                  ['READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 'DELIVERY_ASSIGNED', 'DELIVERED'].includes(vStatus) ||
                  v.delivery_reported === true || v.isDeliveryReported === true ||
                  ((vStatus === 'RESCHEDULED' || vStage === 'rescheduled') && (Boolean(v.droppedAtHub || v.droppedOffAt) || Boolean(v.delivery_reported)))
                ));
                const formattedAddr = (typeof v.address === 'object' && v.address !== null)
                  ? [v.address.flatHouse, v.address.areaColony, v.address.city, v.address.pincode].filter(Boolean).join(', ')
                  : (typeof v.address === 'string' ? v.address : '');

                let fallbackTaskStatus = 'unassigned';
                if (!isDel) {
                  const isPickupCompleted = Boolean(v.droppedAtHub || v.droppedOffAt) ||
                    ['DROPPED_OFF_AT_LAUNDRY', 'DROPPED_OFF', 'IN CLEANING', 'IN_CLEANING', 'AT_HUB', 'COMPLETED', 'DELIVERED', 'READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 'RESCHEDULED'].includes(vStatus);
                  if (isPickupCompleted) {
                    fallbackTaskStatus = 'completed';
                  } else if (['PICKED_UP', 'COLLECTED'].includes(vStatus)) {
                    fallbackTaskStatus = 'picked_up';
                  } else if (v.status === 'PLACED') {
                    fallbackTaskStatus = 'unassigned';
                  } else {
                    fallbackTaskStatus = v.status || 'unassigned';
                  }
                } else {
                  const isOrderAdminRescheduled = Boolean(
                    (v.isRescheduled || v.rescheduled_date || v.rescheduled_time_slot || Boolean(v.deliveryTaskId)) &&
                    (vStatus === 'READY_FOR_DELIVERY' || vStage === 'ready' || v.currentLaundryStep === 'ready')
                  );
                  if (isOrderAdminRescheduled) {
                    fallbackTaskStatus = 'pending';
                  } else if (vStatus === 'RESCHEDULED' || vStage === 'rescheduled') {
                    fallbackTaskStatus = 'rescheduled';
                  } else if (['DELIVERED', 'COMPLETED'].includes(vStatus)) {
                    fallbackTaskStatus = 'completed';
                  } else if (['OUT_FOR_DELIVERY', 'NEARBY'].includes(vStatus)) {
                    fallbackTaskStatus = 'in_transit';
                  } else {
                    fallbackTaskStatus = 'pending';
                  }
                }

                const isOrderAdminRescheduled = isDel && Boolean(
                  (v.isRescheduled || v.rescheduled_date || v.rescheduled_time_slot || Boolean(v.deliveryTaskId)) &&
                  (vStatus === 'READY_FOR_DELIVERY' || vStage === 'ready' || v.currentLaundryStep === 'ready')
                );

                t = {
                  id: (isDel ? 'task_dl_' : 'task_pk_') + (v.code || v.order_number || k),
                  orderId: k,
                  orderCode: v.code || v.order_number || k,
                  type: isDel ? 'delivery' : 'pickup',
                  delivery_reported: isOrderAdminRescheduled ? false : Boolean(v.delivery_reported || v.isDeliveryReported),
                  isDeliveryReported: isOrderAdminRescheduled ? false : Boolean(v.delivery_reported || v.isDeliveryReported),
                  failedReason: isOrderAdminRescheduled ? null : (v.failedReason || null),
                  comment: isOrderAdminRescheduled ? '' : (v.failureComment || v.comment || ''),
                  status: fallbackTaskStatus,
                  isRescheduled: Boolean(v.isRescheduled || v.rescheduled_date),
                  rescheduled_date: v.rescheduled_date || null,
                  rescheduled_time_slot: v.rescheduled_time_slot || null,
                  delivery_date: v.rescheduled_date || v.delivery_date || null,
                  delivery_time_slot: v.rescheduled_time_slot || v.delivery_time_slot || null,
                  droppedAtHub: v.droppedAtHub || v.droppedOffAt || (!isDel && fallbackTaskStatus === 'completed' ? (v.completedAt || v.updatedAt || Date.now()) : undefined),
                  deliveredAt: isDel && fallbackTaskStatus === 'completed' ? (v.deliveredAt || v.completedAt || v.updatedAt || Date.now()) : undefined,
                  orderStatus: v.status,
                  order_status: v.status,
                  orderData: v,
                  customer: {
                    name: v.customerName || v.customer?.name || 'Customer',
                    phone: v.customerPhone || v.customer?.phone || ''
                  },
                  customerName: v.customerName || v.customer?.name || 'Customer',
                  customerPhone: v.customerPhone || v.customer?.phone || '',
                  address: formattedAddr || v.pickup_address || v.delivery_address || 'Bengaluru',
                  scheduledAt: (isDel && (v.rescheduled_date || v.delivery_date)) ? new Date(v.rescheduled_date || v.delivery_date).getTime() : (v.pickup?.date ? new Date(v.pickup.date).getTime() : (v.createdAt || Date.now()))
                };
                break;
              }
            }
          }
        } catch (_) {}
      }

      if (!t) return null;
      return { ...t, id: t.id || id, orderData };
    });
    const list = (await Promise.all(promises)).filter(Boolean);
    return { data: list };
  },

  getDashboard: async () => {
    return {
      data: {
        active_tasks: 2,
        completed_today: 4,
        is_online: true
      }
    };
  },

  startTask: async (taskId) => {
    const taskSnap = await get(ref(rtdb, `tasks/${taskId}`));
    if (!taskSnap.exists()) return { data: { success: false } };
    const task = taskSnap.val();
    const agentUser = { uid: auth.currentUser?.uid || 'usr_agent_001', name: auth.currentUser?.displayName || 'Driver' };
    if (task.type === 'delivery') {
      await startDeliveryTask(taskId, task.orderId, agentUser);
    } else {
      await startPickupTask(taskId, task.orderId, agentUser);
    }
    return { data: { success: true } };
  },

  completeTask: async (taskId, { otp }) => {
    const taskSnap = await get(ref(rtdb, `tasks/${taskId}`));
    if (!taskSnap.exists()) throw new Error('Task not found');
    const task = taskSnap.val();
    const agentUser = { uid: auth.currentUser?.uid || 'usr_agent_001', name: auth.currentUser?.displayName || 'Driver' };
    if (task.type === 'delivery') {
      await verifyAndCompleteDelivery(taskId, task.orderId, otp, agentUser);
    } else {
      await verifyAndCompletePickup(taskId, task.orderId, otp, agentUser);
    }
    return { data: { success: true } };
  },

  confirmHubDropoff: async (orderId, facilityName, notes = '') => {
    const agentUser = { uid: auth.currentUser?.uid || 'usr_agent_001', name: auth.currentUser?.displayName || 'Driver' };
    await recordHubDropoff(orderId, facilityName, agentUser, notes);
    return { data: { success: true } };
  },

  dropoffLaundry: async (orderId, { facility_name, notes } = {}) => {
    const agentUser = { uid: auth.currentUser?.uid || 'usr_agent_001', name: auth.currentUser?.displayName || 'Driver' };
    await recordHubDropoff(orderId, facility_name, agentUser, notes);
    return { data: { success: true } };
  },

  updateAvailability: async (isOnline) => {
    const uid = auth.currentUser?.uid;
    if (uid) {
      await update(ref(rtdb, `agents/${uid}`), { isOnline });
    }
    return { data: { isOnline } };
  },

  sendLocation: async (lat, lng) => {
    const uid = auth.currentUser?.uid;
    if (uid) {
      await update(ref(rtdb, `agents/${uid}`), { lastLat: lat, lastLng: lng, lastActiveAt: Date.now() });
    }
    return { data: { success: true } };
  },

  failDelivery: async (taskId, { failed_reason, reason, comment, notes, rescheduled_date } = {}) => {
    const agentUser = { uid: auth.currentUser?.uid || 'usr_agent_001', name: auth.currentUser?.displayName || 'Driver' };
    await recordDeliveryFailureAndReschedule(taskId, { failed_reason, reason, comment, notes, rescheduled_date }, agentUser);
    return { data: { success: true } };
  }
};

export const notificationsApi = {
  getNotifications: async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return { data: [] };
    const snap = await get(query(ref(rtdb, `notifications/${uid}`), limitToLast(30)));
    if (!snap.exists()) return { data: [] };
    const raw = Object.keys(snap.val()).map(k => ({ ...snap.val()[k], id: k })).reverse();
    return { data: raw };
  },

  markRead: async (id) => {
    const uid = auth.currentUser?.uid;
    if (uid && id) {
      await markNotificationRead(uid, id);
    }
    return { data: { success: true } };
  },

  markAllRead: async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return { data: { success: true } };
    const snap = await get(ref(rtdb, `notifications/${uid}`));
    if (snap.exists()) {
      const updates = {};
      Object.keys(snap.val()).forEach(k => {
        updates[`notifications/${uid}/${k}/isRead`] = true;
      });
      await update(ref(rtdb), updates);
    }
    return { data: { success: true } };
  }
};

export const supportApi = {
  getTickets: async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return { data: [] };
    const snap = await get(ref(rtdb, `userComplaints/${uid}`));
    if (!snap.exists()) return { data: [] };
    const ids = Object.keys(snap.val());
    const promises = ids.map(async id => {
      const c = await get(ref(rtdb, `complaints/${id}`));
      return c.exists() ? { ...c.val(), id } : null;
    });
    const list = (await Promise.all(promises)).filter(Boolean).reverse();
    return { data: list };
  },

  getReports: async (params = {}) => {
    let uid = params?.customer_id || params?.customerId || auth.currentUser?.uid;
    let userEmail = auth.currentUser?.email;
    let userPhone = '';

    if (!uid) {
      try {
        const saved = JSON.parse(localStorage.getItem('fabricare_user') || '{}');
        uid = saved?.uid || saved?.id;
        userEmail = userEmail || saved?.email;
        userPhone = saved?.phone || saved?.phoneNumber || '';
      } catch (_) {}
    }

    if (!uid) return { data: { results: [], items: [], total: 0 } };

    try {
      let complaintList = [];
      const seenIds = new Set();

      // 1. Fetch complaints indexed for this user in userComplaints/${uid}
      const uSnap = await get(ref(rtdb, `userComplaints/${uid}`));
      if (uSnap.exists()) {
        const ids = Object.keys(uSnap.val());
        const promises = ids.map(async id => {
          const c = await get(ref(rtdb, `complaints/${id}`));
          return c.exists() ? { ...c.val(), id } : null;
        });
        const resolved = (await Promise.all(promises)).filter(Boolean);
        resolved.forEach(item => {
          if (!seenIds.has(item.id)) {
            seenIds.add(item.id);
            complaintList.push(item);
          }
        });
      }

      // 2. Also check general complaints table for records matching this customer ID or customer contact
      const allCompSnap = await get(ref(rtdb, 'complaints'));
      if (allCompSnap.exists()) {
        const allComps = Object.entries(allCompSnap.val()).map(([k, v]) => ({ ...v, id: k }));
        const matched = allComps.filter(c => {
          const cUid = c.customerId || c.customer_id || c.userId;
          if (cUid && String(cUid) === String(uid)) return true;
          if (userEmail && c.customerEmail && String(c.customerEmail).toLowerCase() === userEmail.toLowerCase()) return true;
          if (userPhone && c.customerPhone && userPhone.length >= 10 && c.customerPhone.replace(/\D/g, '').endsWith(userPhone.replace(/\D/g, '').slice(-10))) return true;
          return false;
        });
        matched.forEach(m => {
          if (!seenIds.has(m.id)) {
            seenIds.add(m.id);
            complaintList.push(m);
          }
        });
      }

      complaintList.sort((a, b) => (b.createdAt || b.report_date || b.updatedAt || 0) - (a.createdAt || a.report_date || a.updatedAt || 0));
      return { data: { results: complaintList, items: complaintList, total: complaintList.length } };
    } catch (err) {
      console.warn('supportApi.getReports notice:', err);
      return { data: { results: [], items: [], total: 0 } };
    }
  },

  createTicket: async (payload) => {
    const user = { uid: auth.currentUser?.uid, name: auth.currentUser?.displayName || 'Customer' };
    const res = await submitCustomerComplaint(payload, user);
    return { data: res };
  },

  replyTicket: async (ticketId, replyMessage) => {
    const user = { uid: auth.currentUser?.uid, name: auth.currentUser?.displayName || 'Admin' };
    await replyToSupportComplaint(ticketId, replyMessage, user);
    return { data: { success: true } };
  }
};

export const adminApi = {
  getDashboard: async () => {
    const today = new Date().toISOString().split('T')[0];
    const snap = await get(ref(rtdb, `stats/daily/${today}`));
    return { data: snap.exists() ? snap.val() : { ordersPlaced: 0, revenue: 0, completedOrders: 0 } };
  },

  getOrders: async () => {
    const snap = await get(query(ref(rtdb, 'orders'), limitToLast(100)));
    if (!snap.exists()) return { data: [] };
    const list = Object.values(snap.val()).map(normalizeOrder).reverse();
    return { data: list };
  },

  getTasks: async () => {
    const snap = await get(ref(rtdb, 'tasks'));
    if (!snap.exists()) return { data: [] };
    const list = Object.keys(snap.val()).map(k => ({ ...snap.val()[k], id: k })).reverse();
    return { data: list };
  },

  getAgents: async () => {
    const snap = await get(query(ref(rtdb, 'users'), orderByChild('role'), equalTo('agent')));
    if (!snap.exists()) return { data: [] };
    const list = Object.keys(snap.val()).map(k => ({ ...snap.val()[k], id: k }));
    return { data: list };
  },

  getUsers: async () => {
    const snap = await get(ref(rtdb, 'users'));
    if (!snap.exists()) return { data: [] };
    const list = Object.keys(snap.val()).map(k => ({ ...snap.val()[k], id: k }));
    return { data: list };
  },

  getServices: async () => {
    const snap = await get(ref(rtdb, 'services'));
    if (!snap.exists()) return { data: [] };
    const list = Object.keys(snap.val()).map(k => ({ ...snap.val()[k], id: k }));
    return { data: list };
  },

  getCategories: async () => {
    const snap = await get(ref(rtdb, 'categories'));
    if (!snap.exists()) return { data: [] };
    const list = Object.keys(snap.val()).map(k => ({ ...snap.val()[k], id: k }));
    return { data: list };
  },

  getGarments: async () => {
    const snap = await get(ref(rtdb, 'garments'));
    if (!snap.exists()) return { data: [] };
    const list = Object.keys(snap.val()).map(k => ({ ...snap.val()[k], id: k }));
    return { data: list };
  },

  getPrices: async () => {
    const snap = await get(ref(rtdb, 'prices'));
    return { data: snap.exists() ? snap.val() : {} };
  }
};

export const addressApi = {
  getAddresses: async () => {
    const uid = auth.currentUser?.uid || (() => {
      try {
        const saved = localStorage.getItem('fabricare_user');
        return saved ? JSON.parse(saved)?.uid : null;
      } catch {
        return null;
      }
    })();
    if (!uid) return { data: [] };
    try {
      const snap = await get(ref(rtdb, `users/${uid}/addresses`));
      if (!snap.exists()) {
        const userSnap = await get(ref(rtdb, `users/${uid}`));
        const uData = userSnap.exists() ? userSnap.val() : {};
        if (uData.address) {
          return {
            data: [{
              id: 'addr_default',
              title: 'Home',
              address_line: uData.address,
              landmark: '',
              city: uData.city || 'Bengaluru',
              pincode: uData.pincode || '560043',
              is_default: true
            }]
          };
        }
        return { data: [] };
      }
      const raw = snap.val();
      const list = Object.entries(raw).map(([key, val]) => ({
        id: key,
        title: val.title || val.label || 'Home',
        address_line: val.address_line || val.line1 || val.address || '',
        landmark: val.landmark || val.address_line2 || '',
        city: val.city || 'Bengaluru',
        pincode: val.pincode || '560043',
        is_default: Boolean(val.is_default)
      }));
      return { data: list };
    } catch (err) {
      console.error('addressApi.getAddresses error:', err);
      return { data: [] };
    }
  },
  createAddress: async (addr) => {
    const uid = auth.currentUser?.uid || (() => {
      try {
        const saved = localStorage.getItem('fabricare_user');
        return saved ? JSON.parse(saved)?.uid : null;
      } catch {
        return null;
      }
    })();
    if (!uid) throw new Error('User not authenticated');
    const addrId = addr.id || `addr_${Date.now()}`;
    const newAddressObj = {
      id: addrId,
      title: addr.title || 'Home',
      address_line: addr.address_line || addr.line1 || '',
      landmark: addr.landmark || '',
      city: addr.city || 'Bengaluru',
      pincode: addr.pincode || '560043',
      is_default: Boolean(addr.is_default),
      updatedAt: Date.now()
    };

    const updates = {};
    updates[`users/${uid}/addresses/${addrId}`] = newAddressObj;

    if (newAddressObj.is_default) {
      const formatted = `${newAddressObj.address_line}${newAddressObj.landmark ? ', ' + newAddressObj.landmark : ''}, ${newAddressObj.city} - ${newAddressObj.pincode}`;
      updates[`users/${uid}/address`] = formatted;
      updates[`users/${uid}/city`] = newAddressObj.city;
      updates[`users/${uid}/pincode`] = newAddressObj.pincode;

      try {
        const snap = await get(ref(rtdb, `users/${uid}/addresses`));
        if (snap.exists()) {
          const current = snap.val();
          Object.keys(current).forEach(k => {
            if (k !== addrId && current[k].is_default) {
              updates[`users/${uid}/addresses/${k}/is_default`] = false;
            }
          });
        }
      } catch (e) {
        console.warn('Could not reset previous defaults:', e);
      }
    } else {
      try {
        const userSnap = await get(ref(rtdb, `users/${uid}/address`));
        if (!userSnap.exists() || !userSnap.val()) {
          const formatted = `${newAddressObj.address_line}${newAddressObj.landmark ? ', ' + newAddressObj.landmark : ''}, ${newAddressObj.city} - ${newAddressObj.pincode}`;
          updates[`users/${uid}/address`] = formatted;
          updates[`users/${uid}/city`] = newAddressObj.city;
          updates[`users/${uid}/pincode`] = newAddressObj.pincode;
        }
      } catch (e) {
        // ignore
      }
    }

    await update(ref(rtdb), updates);
    return { data: newAddressObj };
  },
  updateAddress: async (id, addr) => {
    const uid = auth.currentUser?.uid || (() => {
      try {
        const saved = localStorage.getItem('fabricare_user');
        return saved ? JSON.parse(saved)?.uid : null;
      } catch {
        return null;
      }
    })();
    if (!uid) throw new Error('User not authenticated');

    const updatedObj = {
      id,
      title: addr.title || 'Home',
      address_line: addr.address_line || addr.line1 || '',
      landmark: addr.landmark || '',
      city: addr.city || 'Bengaluru',
      pincode: addr.pincode || '560043',
      is_default: Boolean(addr.is_default),
      updatedAt: Date.now()
    };

    const updates = {};
    updates[`users/${uid}/addresses/${id}`] = updatedObj;

    if (updatedObj.is_default) {
      const formatted = `${updatedObj.address_line}${updatedObj.landmark ? ', ' + updatedObj.landmark : ''}, ${updatedObj.city} - ${updatedObj.pincode}`;
      updates[`users/${uid}/address`] = formatted;
      updates[`users/${uid}/city`] = updatedObj.city;
      updates[`users/${uid}/pincode`] = updatedObj.pincode;

      try {
        const snap = await get(ref(rtdb, `users/${uid}/addresses`));
        if (snap.exists()) {
          const current = snap.val();
          Object.keys(current).forEach(k => {
            if (k !== id && current[k].is_default) {
              updates[`users/${uid}/addresses/${k}/is_default`] = false;
            }
          });
        }
      } catch (e) {
        console.warn('Could not reset previous defaults:', e);
      }
    }

    await update(ref(rtdb), updates);
    return { data: updatedObj };
  },
  deleteAddress: async (id) => {
    const uid = auth.currentUser?.uid || (() => {
      try {
        const saved = localStorage.getItem('fabricare_user');
        return saved ? JSON.parse(saved)?.uid : null;
      } catch {
        return null;
      }
    })();
    if (!uid) throw new Error('User not authenticated');
    await set(ref(rtdb, `users/${uid}/addresses/${id}`), null);
    return { data: { success: true } };
  }
};

export const customerApi = {
  verifyPayment: async () => ({ data: { success: true } })
};

export const authApi = {
  getProfile: async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return { data: null };
    const snap = await get(ref(rtdb, `users/${uid}`));
    return { data: snap.exists() ? snap.val() : null };
  },
  updateProfile: async (data) => ({ data: { success: true } })
};

export const complaintsApi = supportApi;
export const laundryApi = staffApi;
export const servicesApi = adminApi;
export const contentApi = {
  getFaqs: async () => ({ data: [] }),
  getTerms: async () => ({ data: {} })
};

export default {
  ordersApi,
  staffApi,
  deliveryApi,
  adminApi,
  notificationsApi,
  supportApi,
  authApi
};
