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
  verifyAndCompleteDelivery
} from '../services/deliveryDataService.js';

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
    const unitPrice = p > 500 ? (p / 100) : p;

    let t = it.lineTotal ?? it.total ?? (unitPrice * quantity);
    if (typeof t === 'string') t = parseFloat(t) || 0;
    const lineTotal = t > 500 ? (t / 100) : t;

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

  let numTotal = o.total ?? o.total_amount ?? o.amount;
  if (typeof numTotal === 'string') numTotal = parseFloat(numTotal) || 0;
  let finalTotal = 0;
  if (typeof numTotal === 'number' && !isNaN(numTotal)) {
    finalTotal = numTotal > 500 ? (numTotal / 100) : numTotal;
  }
  if (!finalTotal && normItems.length > 0) {
    finalTotal = normItems.reduce((acc, it) => acc + (it.lineTotal || 0), 0);
  }
  const totalAmount = finalTotal.toFixed(2);
  const itemsSummary = normItems.length > 0
    ? normItems.map(it => `${it.name} × ${it.quantity}`).join(', ')
    : '1 Item';

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

    if (!currentUid) {
      try {
        const cached = JSON.parse(localStorage.getItem('fabricare_user') || '{}');
        currentUid = cached?.uid || cached?.id;
        role = cached?.role;
      } catch (_) { }
    }

    if (!currentUid) return { data: [] };

    try {
      if (!role) {
        const userRoleSnap = await get(ref(rtdb, `users/${currentUid}/role`));
        if (userRoleSnap.exists()) role = userRoleSnap.val();
      }

      if (role === 'admin') {
        const snap = await get(query(ref(rtdb, 'orders'), limitToLast(50)));
        if (!snap.exists()) return { data: [] };
        const raw = Object.values(snap.val()).reverse();
        return { data: raw.map(normalizeOrder) };
      }

      const uOrdersSnap = await get(ref(rtdb, `userOrders/${currentUid}`));
      if (uOrdersSnap.exists()) {
        const ids = Object.keys(uOrdersSnap.val());
        const promises = ids.map(async id => {
          const s = await get(ref(rtdb, `orders/${id}`));
          return s.exists() ? normalizeOrder(s.val()) : null;
        });
        const res = (await Promise.all(promises)).filter(Boolean).reverse();
        if (res.length > 0) return { data: res };
      }

      // Fallback query across orders by customerId
      const allSnap = await get(query(ref(rtdb, 'orders'), limitToLast(50)));
      if (allSnap.exists()) {
        const all = Object.values(allSnap.val());
        const matched = all.filter(o =>
          o.customerId === currentUid ||
          o.customer_id === currentUid ||
          o.userId === currentUid
        );
        if (matched.length > 0) {
          return { data: matched.map(normalizeOrder).reverse() };
        }
      }

      return { data: [] };
    } catch (err) {
      console.warn('ordersApi.getOrders error:', err);
      return { data: [] };
    }
  },

  getOrderById: async (id) => {
    const snap = await get(ref(rtdb, `orders/${id}`));
    if (snap.exists()) {
      return { data: normalizeOrder(snap.val()) };
    }
    // Query by code
    const qSnap = await get(query(ref(rtdb, 'orders'), orderByChild('code'), equalTo(id)));
    if (qSnap.exists()) {
      const firstKey = Object.keys(qSnap.val())[0];
      return { data: normalizeOrder(qSnap.val()[firstKey]) };
    }
    return { data: null };
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
          const s = String(raw.status || raw.orderStatus || raw.status_display || raw.raw_status || '').toUpperCase();
          const stage = String(raw.stage || raw.processing_stage || '').toUpperCase();

          const isDelivered = s.includes('DELIVER') || s.includes('COMPLET') || stage === 'DELIVERED';
          const isCancelled = s.includes('CANCEL');

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
                const norm = normalizeOrder({ ...oSnap.val(), id, key: id });
                norm.historyStatus = 'delivered';
                const k = String(norm.code || norm.id || norm.order_number || id);
                itemsMap.set(k, norm);
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

    // Also collect all delivery tasks from RTDB tasks node
    try {
      const allTasksSnap = await get(ref(rtdb, 'tasks'));
      if (allTasksSnap.exists()) {
        const allTasks = allTasksSnap.val() || {};
        Object.keys(allTasks).forEach(tid => {
          const t = allTasks[tid];
          if (t) {
            if (t.agentId === uid || (!t.agentId && t.type === 'delivery') || t.type === 'delivery') {
              taskIdsSet.add(tid);
            }
          }
        });
      }
    } catch (_) {}

    const taskIds = Array.from(taskIdsSet);
    const promises = taskIds.map(async id => {
      const tSnap = await get(ref(rtdb, `tasks/${id}`));
      if (!tSnap.exists()) return null;
      const t = tSnap.val();
      let orderData = null;
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
      return { ...t, id, orderData };
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
  getAddresses: async () => ({ data: [] }),
  createAddress: async (addr) => ({ data: { id: `addr_${Date.now()}`, ...addr } }),
  updateAddress: async (id, addr) => ({ data: { id, ...addr } }),
  deleteAddress: async (id) => ({ data: { success: true } })
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
