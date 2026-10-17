import { ref, get, set, update, push, query, orderByChild, equalTo, limitToLast } from 'firebase/database';
import { auth, rtdb } from '../config/firebase';
import { 
  createCustomerOrder, 
  confirmCustomerPayment, 
  cancelCustomerOrder, 
  markNotificationRead,
  submitCustomerComplaint 
} from '../services/customerDataService';
import { 
  assignPickupAgent, 
  assignDeliveryAgent, 
  adminOverrideOrderStatus, 
  replyToSupportComplaint 
} from '../services/adminDataService';
import { 
  staffConfirmHubReceipt, 
  advanceLaundryStep 
} from '../services/staffDataService';
import { 
  startPickupTask, 
  verifyAndCompletePickup, 
  recordHubDropoff, 
  startDeliveryTask, 
  verifyAndCompleteDelivery 
} from '../services/deliveryDataService';

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
  const pickupDate = o.pickup?.date || (o.createdAt ? new Date(o.createdAt).toISOString().split('T')[0] : 'Today');
  const pickupSlot = o.pickup ? `${o.pickup.from || '09:00'} - ${o.pickup.to || '11:00'}` : '09:00 AM - 11:00 AM';
  const totalAmount = o.total ? (Number(o.total) / 100).toFixed(2) : '0.00';
  
  const normItems = Array.isArray(o.items) 
    ? o.items 
    : (o.items && typeof o.items === 'object' 
      ? Object.values(o.items).map(it => ({
          name: it.name || 'Laundry Care',
          quantity: it.quantity || 1,
          price: it.unitPrice ? it.unitPrice / 100 : 60,
          total: it.lineTotal ? it.lineTotal / 100 : 60
        }))
      : []);

  return {
    ...o,
    id: o.code || o.id,
    order_id: o.code || o.id,
    order_number: o.code || o.id,
    pickup_address: addressStr,
    pickup_date: pickupDate,
    pickup_time_slot: pickupSlot,
    pickupTime: `${pickupDate}, ${pickupSlot}`,
    total_amount: totalAmount,
    amount: totalAmount,
    items: normItems,
    customer_name: o.customerName || 'Customer',
    customer_phone: o.customerPhone || '',
    status: o.status === 'PLACED' ? 'Pending Pickup' : (o.status === 'IN_CLEANING' ? 'In Cleaning' : (o.status === 'READY_FOR_DELIVERY' ? 'Ready for Delivery' : (o.status === 'OUT_FOR_DELIVERY' ? 'In Transit' : (o.status === 'DELIVERED' ? 'Completed' : (o.status === 'CANCELLED' ? 'Cancelled' : o.status)))))
  };
};

export const ordersApi = {
  getOrders: async () => {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) return { data: [] };
    const userRoleSnap = await get(ref(rtdb, `users/${currentUid}/role`));
    const role = userRoleSnap.val();

    if (role === 'admin') {
      const snap = await get(query(ref(rtdb, 'orders'), limitToLast(50)));
      if (!snap.exists()) return { data: [] };
      const raw = Object.values(snap.val()).reverse();
      return { data: raw.map(normalizeOrder) };
    }

    const uOrdersSnap = await get(ref(rtdb, `userOrders/${currentUid}`));
    if (!uOrdersSnap.exists()) return { data: [] };
    const ids = Object.keys(uOrdersSnap.val());
    const promises = ids.map(async id => {
      const s = await get(ref(rtdb, `orders/${id}`));
      return s.exists() ? normalizeOrder(s.val()) : null;
    });
    const res = (await Promise.all(promises)).filter(Boolean).reverse();
    return { data: res };
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
    const statuses = ['RECEIVED', 'IN_CLEANING', 'READY_FOR_DELIVERY'];
    const promises = statuses.map(st => get(ref(rtdb, `ordersByStatus/${st}`)));
    const snaps = await Promise.all(promises);
    const orderIds = new Set();
    snaps.forEach(s => {
      if (s.exists()) {
        Object.keys(s.val()).forEach(id => orderIds.add(id));
      }
    });

    const orderPromises = Array.from(orderIds).map(async id => {
      const oSnap = await get(ref(rtdb, `orders/${id}`));
      return oSnap.exists() ? normalizeOrder(oSnap.val()) : null;
    });
    const items = (await Promise.all(orderPromises)).filter(Boolean);
    return { data: { items } };
  },

  updateStatus: async (orderId, targetStep) => {
    const staffUser = {
      uid: auth.currentUser?.uid || 'usr_staff_001',
      name: auth.currentUser?.displayName || 'Staff Specialist'
    };
    if (targetStep === 'RECEIVED' || targetStep === 'inspect') {
      await staffConfirmHubReceipt(orderId, staffUser);
    } else {
      await advanceLaundryStep(orderId, targetStep, staffUser);
    }
    return { data: { success: true } };
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
    const snap = await get(ref(rtdb, 'ordersByStatus/DELIVERED'));
    if (!snap.exists()) return { data: { items: [], total: 0 } };
    const ids = Object.keys(snap.val());
    const promises = ids.map(async id => {
      const o = await get(ref(rtdb, `orders/${id}`));
      return o.exists() ? normalizeOrder(o.val()) : null;
    });
    const items = (await Promise.all(promises)).filter(Boolean).reverse();
    return { data: { items, total: items.length } };
  }
};

export const deliveryApi = {
  getTasks: async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return { data: [] };
    const agentTasksSnap = await get(ref(rtdb, `agentTasks/${uid}`));
    if (!agentTasksSnap.exists()) return { data: [] };
    const taskIds = Object.keys(agentTasksSnap.val());
    const promises = taskIds.map(async id => {
      const tSnap = await get(ref(rtdb, `tasks/${id}`));
      return tSnap.exists() ? { ...tSnap.val(), id } : null;
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

  confirmHubDropoff: async (orderId, facilityName) => {
    const agentUser = { uid: auth.currentUser?.uid || 'usr_agent_001', name: auth.currentUser?.displayName || 'Driver' };
    await recordHubDropoff(orderId, facilityName, agentUser);
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
  createAddress: async (addr) => ({ data: { id: `addr_${Date.now()}`, ...addr } })
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
