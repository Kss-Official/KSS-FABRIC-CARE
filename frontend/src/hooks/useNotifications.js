import { useState, useEffect, useCallback, useMemo } from 'react';
import { ref, query, limitToLast, onValue, update } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, rtdb } from '../config/firebase';

/**
 * Shared hook for live notifications across all 4 portals (Customer, Admin, Staff, Delivery).
 * - Synchronizes with Firebase Auth so RTDB rules (.read: auth != null && auth.uid === $uid) pass seamlessly.
 * - Listens to the latest 50 notifications under `notifications/{uid}` in real-time.
 * - Computes real-time unreadCount.
 * - Provides isolated markRead(id) and markAllRead() updating only isRead.
 * - Cleans up listeners cleanly on unmount or logout.
 */
export const useNotifications = (uid) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(Boolean(uid));

  useEffect(() => {
    if (!uid || !rtdb) {
      setItems([]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    let rtdbUnsubscribe = null;
    let retryTimer = null;
    let isAttached = false;

    const attachListener = () => {
      if (!isMounted || isAttached) return;
      isAttached = true;
      setLoading(true);

      const notifsRef = ref(rtdb, `notifications/${uid}`);
      const notifsQuery = query(notifsRef, limitToLast(50));

      try {
        rtdbUnsubscribe = onValue(
          notifsQuery,
          (snapshot) => {
            if (!isMounted) return;
            setLoading(false);
            if (!snapshot.exists()) {
              setItems([]);
              return;
            }

            const data = snapshot.val();
            if (typeof data === 'object' && data !== null) {
              const list = Object.keys(data).map((key) => {
                const val = data[key] || {};
                const isRead = Boolean(val.isRead);
                const ts = val.createdAt || val.timestamp || Date.now();
                return {
                  id: key,
                  type: val.type || 'general',
                  title: val.title || 'Notification',
                  body: val.body || val.message || '',
                  message: val.body || val.message || '',
                  desc: val.body || val.message || '',
                  orderId: val.orderId || val.order_id || null,
                  isRead,
                  is_read: isRead,
                  unread: !isRead,
                  createdAt: ts,
                  created_at: ts,
                  timestamp: ts,
                  time: ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
                  formattedDate: ts ? new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Recent',
                  actionTab: val.actionTab || (val.type?.includes('complaint') ? 'delivery-reports' : (val.type?.includes('task') || val.type?.includes('pickup') || val.type?.includes('delivery') || val.type?.includes('driver') ? 'pickup-delivery' : 'orders')),
                  raw: val
                };
              });

              // Sort latest first (descending by createdAt)
              list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
              setItems(list);
            } else {
              setItems([]);
            }
          },
          (error) => {
            if (!isMounted) return;
            console.warn(`[useNotifications] Listener notice for user ${uid}:`, error.message);
            setLoading(false);
            isAttached = false;

            // If permission denied due to initial auth handshake timing, retry when auth is settled
            if (error.code === 'PERMISSION_DENIED' || error.message?.toLowerCase().includes('permission')) {
              clearTimeout(retryTimer);
              retryTimer = setTimeout(() => {
                if (isMounted && auth?.currentUser?.uid === uid) {
                  attachListener();
                }
              }, 1200);
            }
          }
        );
      } catch (err) {
        console.warn(`[useNotifications] Failed to subscribe for ${uid}:`, err);
        setLoading(false);
        isAttached = false;
      }
    };

    // If auth is already initialized and matches uid, attach immediately
    if (auth?.currentUser && auth.currentUser.uid === uid) {
      attachListener();
    }

    // Always listen to auth state changes to synchronize when token hydrates or user changes
    const authUnsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (!isMounted) return;
      if (fbUser && fbUser.uid === uid) {
        attachListener();
      } else if (!fbUser) {
        if (typeof rtdbUnsubscribe === 'function') {
          try { rtdbUnsubscribe(); } catch (_) {}
          rtdbUnsubscribe = null;
        }
        isAttached = false;
        setItems([]);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(retryTimer);
      if (typeof authUnsubscribe === 'function') {
        try { authUnsubscribe(); } catch (_) {}
      }
      if (typeof rtdbUnsubscribe === 'function') {
        try { rtdbUnsubscribe(); } catch (_) {}
      }
    };
  }, [uid]);

  // Compute unread count
  const unreadCount = useMemo(() => {
    return items.filter((item) => !item.isRead).length;
  }, [items]);

  // Mark single notification as read (updates only isRead)
  const markRead = useCallback(
    async (notifId) => {
      if (!uid || !notifId || !rtdb) return;

      // Optimistic local state update for zero latency
      setItems((prev) =>
        prev.map((item) =>
          item.id === notifId ? { ...item, isRead: true, is_read: true, unread: false } : item
        )
      );

      try {
        await update(ref(rtdb, `notifications/${uid}/${notifId}`), {
          isRead: true
        });
      } catch (err) {
        console.warn(`[useNotifications] Failed to mark ${notifId} read:`, err);
      }
    },
    [uid]
  );

  // Mark all notifications as read (atomic multi-path update of isRead)
  const markAllRead = useCallback(async () => {
    if (!uid || !rtdb) return;

    const unreadItems = items.filter((item) => !item.isRead);
    if (unreadItems.length === 0) return;

    // Optimistic local update
    setItems((prev) =>
      prev.map((item) => ({ ...item, isRead: true, is_read: true, unread: false }))
    );

    try {
      const updates = {};
      unreadItems.forEach((item) => {
        updates[`notifications/${uid}/${item.id}/isRead`] = true;
      });
      await update(ref(rtdb), updates);
    } catch (err) {
      console.warn(`[useNotifications] Failed to mark all read for ${uid}:`, err);
    }
  }, [uid, items]);

  return {
    items,
    unreadCount,
    markRead,
    markAllRead,
    loading
  };
};

export default useNotifications;
