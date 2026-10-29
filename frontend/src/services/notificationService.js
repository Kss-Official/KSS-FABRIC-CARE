import { ref, get, push, update } from 'firebase/database';
import { auth, rtdb } from '../config/firebase';

/**
 * Ensures a user's role mapping is indexed in roleUsers/{role}/{uid} = true.
 * Automatically synchronizes role aliases (e.g., 'staff' <-> 'laundry_staff', 'agent' <-> 'delivery').
 */
export const registerRoleUser = async (uid, role) => {
  if (!uid || !role || !rtdb) return;
  const cleanRole = String(role).toLowerCase().trim();
  const cleanUid = String(uid).trim();

  try {
    const updates = {
      [`roleUsers/${cleanRole}/${cleanUid}`]: true
    };

    if (cleanRole === 'staff' || cleanRole === 'laundry_staff' || cleanRole === 'laundry') {
      updates[`roleUsers/staff/${cleanUid}`] = true;
      updates[`roleUsers/laundry_staff/${cleanUid}`] = true;
      updates[`roleUsers/laundry/${cleanUid}`] = true;
    } else if (cleanRole === 'agent' || cleanRole === 'delivery' || cleanRole === 'driver') {
      updates[`roleUsers/agent/${cleanUid}`] = true;
      updates[`roleUsers/delivery/${cleanUid}`] = true;
      updates[`roleUsers/driver/${cleanUid}`] = true;
    } else if (cleanRole === 'admin' || cleanRole === 'super_admin') {
      updates[`roleUsers/admin/${cleanUid}`] = true;
      updates[`roleUsers/super_admin/${cleanUid}`] = true;
    }

    await update(ref(rtdb), updates);
  } catch (err) {
    console.warn(`Failed to register role user ${cleanUid} for role ${cleanRole}:`, err);
  }
};

/**
 * Resolves all user UIDs for a specified role (admin, staff, agent, customer).
 * Checks all aliases (e.g. staff and laundry_staff) and falls back to inspecting users node.
 */
export const getRoleUserIds = async (role) => {
  if (!role || !rtdb) return [];
  const cleanRole = String(role).toLowerCase().trim();

  const roleAliases = [cleanRole];
  if (cleanRole === 'staff' || cleanRole === 'laundry_staff' || cleanRole === 'laundry') {
    ['staff', 'laundry_staff', 'laundry'].forEach(r => { if (!roleAliases.includes(r)) roleAliases.push(r); });
  } else if (cleanRole === 'agent' || cleanRole === 'delivery' || cleanRole === 'driver') {
    ['agent', 'delivery', 'driver'].forEach(r => { if (!roleAliases.includes(r)) roleAliases.push(r); });
  } else if (cleanRole === 'admin' || cleanRole === 'super_admin') {
    ['admin', 'super_admin'].forEach(r => { if (!roleAliases.includes(r)) roleAliases.push(r); });
  }

  const collectedUids = new Set();

  try {
    // 1. Check each role alias in roleUsers
    for (const alias of roleAliases) {
      try {
        const roleSnap = await get(ref(rtdb, `roleUsers/${alias}`));
        if (roleSnap.exists()) {
          const val = roleSnap.val();
          if (typeof val === 'object' && val !== null) {
            Object.keys(val).forEach(k => {
              if (Boolean(val[k])) collectedUids.add(k);
            });
          }
        }
      } catch (_) {}
    }

    // 2. Fallback / supplementary check: Query users node to self-heal missing indexes
    if (collectedUids.size === 0) {
      const usersSnap = await get(ref(rtdb, 'users'));
      if (usersSnap.exists()) {
        const allUsers = usersSnap.val() || {};
        const roleUpdates = {};

        for (const [uid, uData] of Object.entries(allUsers)) {
          const uRole = String(uData?.role || '').toLowerCase().trim();
          const uEmail = String(uData?.email || '').toLowerCase().trim();
          const isMatch = (
            roleAliases.includes(uRole) ||
            (cleanRole === 'admin' && (uRole.includes('admin') || uEmail.includes('admin'))) ||
            (cleanRole === 'staff' && (uRole.includes('staff') || uRole.includes('laundry') || uEmail.includes('staff') || uEmail.includes('anita') || uEmail.includes('laundry'))) ||
            (cleanRole === 'agent' && (uRole.includes('agent') || uRole.includes('delivery') || uRole.includes('driver') || uEmail.includes('delivery') || uEmail.includes('ravi')))
          );

          if (isMatch) {
            collectedUids.add(uid);
            roleUpdates[`roleUsers/${cleanRole}/${uid}`] = true;
            if (cleanRole === 'staff') {
              roleUpdates[`roleUsers/laundry_staff/${uid}`] = true;
            }
          }
        }

        if (Object.keys(roleUpdates).length > 0) {
          update(ref(rtdb), roleUpdates).catch(() => {});
        }
      }
    }
  } catch (err) {
    console.warn(`Error resolving role users for ${cleanRole}:`, err);
  }

  return Array.from(collectedUids);
};

/**
 * Creates notification payload for a single user in a multi-path updates dictionary
 */
export const addNotificationToUpdates = (updates, uid, { type, title, body, orderId, orderCode, ticketId, ticketNumber, createdAt }) => {
  if (!updates || !uid || !rtdb) return null;
  const notifPush = push(ref(rtdb, `notifications/${uid}`));
  const notifId = notifPush.key;
  const now = createdAt || Date.now();
  const cleanOrderId = orderCode || orderId || null;
  const cleanTicketId = ticketNumber || ticketId || null;

  updates[`notifications/${uid}/${notifId}`] = {
    type: String(type || 'general'),
    title: String(title || 'Notification'),
    body: String(body || ''),
    orderId: cleanOrderId,
    orderCode: cleanOrderId,
    ticketId: cleanTicketId,
    ticketNumber: cleanTicketId,
    isRead: false,
    createdAt: now
  };

  return notifId;
};

/**
 * Multi-path dispatch helper to create a distinct, isolated notification copy
 * for every user registered with the specified role.
 * This guarantees read state (isRead) is NEVER shared across users.
 */
export const addRoleNotificationsToUpdates = async (updates, role, notifData) => {
  if (!updates || !role) return [];
  const uids = await getRoleUserIds(role);
  const createdIds = [];

  for (const uid of uids) {
    const id = addNotificationToUpdates(updates, uid, notifData);
    if (id) createdIds.push(id);
  }

  return createdIds;
};

/**
 * Resolves user UID by email address from RTDB users node or current auth user
 */
export const findUidByEmail = async (email) => {
  if (!email || !rtdb) return null;
  const clean = String(email).trim().toLowerCase();
  if (auth?.currentUser?.email && String(auth.currentUser.email).trim().toLowerCase() === clean) {
    return auth.currentUser.uid;
  }
  try {
    const snap = await get(ref(rtdb, 'users'));
    if (snap.exists()) {
      const allUsers = snap.val() || {};
      for (const [uid, uData] of Object.entries(allUsers)) {
        if (String(uData?.email || '').trim().toLowerCase() === clean) {
          return uid;
        }
      }
    }
  } catch (err) {
    console.warn('findUidByEmail lookup warning:', err);
  }
  return null;
};

/**
 * Dispatches real-time Help & Support notifications to customers and admins in RTDB
 */
export const notifySupportTicketUpdate = async ({
  ticketId,
  ticketNumber,
  customerUid,
  customerEmail,
  customerName,
  subject,
  message,
  status,
  type = 'reply' // 'created' | 'reply' | 'resolved'
}) => {
  if (!rtdb) return;
  const now = Date.now();
  const cleanNum = ticketNumber || ticketId || 'Support Ticket';
  let targetUid = customerUid;
  if (!targetUid && customerEmail) {
    targetUid = await findUidByEmail(customerEmail);
  }
  if (!targetUid && auth?.currentUser?.uid && customerEmail && String(auth.currentUser.email).toLowerCase() === String(customerEmail).toLowerCase()) {
    targetUid = auth.currentUser.uid;
  }

  const updates = {};

  if (type === 'created' || type === 'support_ticket_created') {
    if (targetUid) {
      addNotificationToUpdates(updates, targetUid, {
        type: 'support_ticket_created',
        title: `Support Ticket Created: ${cleanNum}`,
        body: `We have received your ticket "${subject || 'Support Request'}". Our team will assist you shortly.`,
        ticketId: cleanNum,
        ticketNumber: cleanNum,
        createdAt: now
      });
    }

    // Admin role notification
    await addRoleNotificationsToUpdates(updates, 'admin', {
      type: 'support_new_ticket',
      title: `New Support Ticket: ${cleanNum}`,
      body: `${customerName || 'A customer'} submitted a support ticket: "${subject || 'Support Request'}".`,
      ticketId: cleanNum,
      ticketNumber: cleanNum,
      createdAt: now
    });
  } else if (type === 'resolved' || type === 'support_resolved' || status === 'RESOLVED' || status === 'CLOSED') {
    if (targetUid) {
      addNotificationToUpdates(updates, targetUid, {
        type: 'support_resolved',
        title: `Support Ticket Resolved: ${cleanNum}`,
        body: message || `Your support ticket ${cleanNum} has been marked as resolved by our team.`,
        ticketId: cleanNum,
        ticketNumber: cleanNum,
        createdAt: now
      });
    }
  } else {
    // Reply
    if (targetUid) {
      addNotificationToUpdates(updates, targetUid, {
        type: 'support_reply',
        title: `Support Ticket Response: ${cleanNum}`,
        body: message || 'Admin responded to your support ticket.',
        ticketId: cleanNum,
        ticketNumber: cleanNum,
        createdAt: now
      });
    }
  }

  if (Object.keys(updates).length > 0) {
    await update(ref(rtdb), updates).catch(err => {
      console.warn('notifySupportTicketUpdate update notice:', err);
    });
  }
};

