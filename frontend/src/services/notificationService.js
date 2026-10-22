import { ref, get, push, update } from 'firebase/database';
import { rtdb } from '../config/firebase';

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
export const addNotificationToUpdates = (updates, uid, { type, title, body, orderId, orderCode, createdAt }) => {
  if (!updates || !uid || !rtdb) return null;
  const notifPush = push(ref(rtdb, `notifications/${uid}`));
  const notifId = notifPush.key;
  const now = createdAt || Date.now();
  const cleanOrderId = orderCode || orderId || null;

  updates[`notifications/${uid}/${notifId}`] = {
    type: String(type || 'general'),
    title: String(title || 'Notification'),
    body: String(body || ''),
    orderId: cleanOrderId,
    orderCode: cleanOrderId,
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
