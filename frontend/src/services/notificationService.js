import { ref, get, push, update } from 'firebase/database';
import { rtdb } from '../config/firebase';

/**
 * Ensures a user's role mapping is indexed in roleUsers/{role}/{uid} = true
 */
export const registerRoleUser = async (uid, role) => {
  if (!uid || !role) return;
  const cleanRole = String(role).toLowerCase().trim();
  const cleanUid = String(uid).trim();
  try {
    const roleRef = ref(rtdb, `roleUsers/${cleanRole}/${cleanUid}`);
    await update(ref(rtdb), {
      [`roleUsers/${cleanRole}/${cleanUid}`]: true
    });
  } catch (err) {
    console.warn(`Failed to register role user ${cleanUid} for role ${cleanRole}:`, err);
  }
};

/**
 * Resolves all user UIDs for a specified role (admin, staff, agent, customer)
 * Reads roleUsers/{role} first; falls back to querying users node if roleUsers is not yet populated.
 */
export const getRoleUserIds = async (role) => {
  if (!role) return [];
  const cleanRole = String(role).toLowerCase().trim();

  try {
    const roleSnap = await get(ref(rtdb, `roleUsers/${cleanRole}`));
    if (roleSnap.exists()) {
      const val = roleSnap.val();
      if (typeof val === 'object' && val !== null) {
        const uids = Object.keys(val).filter(k => Boolean(val[k]));
        if (uids.length > 0) return uids;
      }
    }

    // Fallback: Query all users and populate roleUsers for subsequent lookups
    const usersSnap = await get(ref(rtdb, 'users'));
    if (usersSnap.exists()) {
      const allUsers = usersSnap.val() || {};
      const matchedUids = [];
      const roleUpdates = {};

      for (const [uid, uData] of Object.entries(allUsers)) {
        const uRole = String(uData?.role || '').toLowerCase().trim();
        // Support role variations (e.g., 'agent' or 'delivery', 'admin' or 'super_admin')
        const isMatch = (
          uRole === cleanRole ||
          (cleanRole === 'admin' && (uRole === 'admin' || uRole === 'super_admin')) ||
          (cleanRole === 'staff' && (uRole === 'staff' || uRole === 'laundry_staff')) ||
          (cleanRole === 'agent' && (uRole === 'agent' || uRole === 'delivery' || uRole === 'driver'))
        );

        if (isMatch) {
          matchedUids.push(uid);
          roleUpdates[`roleUsers/${cleanRole}/${uid}`] = true;
        }
      }

      if (Object.keys(roleUpdates).length > 0) {
        update(ref(rtdb), roleUpdates).catch(() => {});
      }

      return matchedUids;
    }
  } catch (err) {
    console.warn(`Error resolving role users for ${cleanRole}:`, err);
  }

  return [];
};

/**
 * Creates notification payload for a single user in a multi-path updates dictionary
 */
export const addNotificationToUpdates = (updates, uid, { type, title, body, orderId, createdAt }) => {
  if (!updates || !uid) return null;
  const notifPush = push(ref(rtdb, `notifications/${uid}`));
  const notifId = notifPush.key;
  const now = createdAt || Date.now();

  updates[`notifications/${uid}/${notifId}`] = {
    type: String(type || 'general'),
    title: String(title || 'Notification'),
    body: String(body || ''),
    orderId: orderId || null,
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
