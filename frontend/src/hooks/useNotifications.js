import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ref, query, limitToLast, onValue, update } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, rtdb } from '../config/firebase';
import { formatOrderId } from '../utils/helpers';

/**
 * Shared hook for live notifications across all 4 portals (Customer, Admin, Staff, Delivery).
 * - Synchronizes with Firebase Auth so RTDB rules pass seamlessly.
 * - Listens to the latest 50 notifications under `notifications/{uid}` in 100% real-time.
 * - Auto-resolves raw RTDB push IDs to display order codes (e.g. FC-66450).
 * - Computes real-time unreadCount.
 * - Provides isolated markRead(id) and markAllRead() updating only isRead.
 * - Cleans up listeners cleanly on unmount.
 * - Deduplicates items by id to prevent any ghost duplicates.
 */
export const useNotifications = (uid) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(Boolean(uid));

  // Stable ref to the active RTDB unsubscribe function —
  // ensures only ONE listener is ever active at a time.
  const activeUnsubRef = useRef(null);
  const retryTimerRef = useRef(null);

  useEffect(() => {
    if (!uid || !rtdb) {
      setItems([]);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const teardownListener = () => {
      if (typeof activeUnsubRef.current === 'function') {
        try { activeUnsubRef.current(); } catch (_) {}
        activeUnsubRef.current = null;
      }
    };

    const attachListener = () => {
      if (!isMounted) return;
      // Tear down any existing listener before attaching a new one.
      // This is the key guard that prevents duplicate subscriptions.
      teardownListener();
      clearTimeout(retryTimerRef.current);

      setLoading(true);

      const notifsRef = ref(rtdb, `notifications/${uid}`);
      const notifsQuery = query(notifsRef, limitToLast(50));

      try {
        const unsub = onValue(
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
              const seen = new Set();
              const list = Object.keys(data).reduce((acc, key) => {
                // Deduplicate by Firebase key (id)
                if (seen.has(key)) return acc;
                seen.add(key);

                const val = data[key] || {};
                const isRead = Boolean(val.isRead);
                const ts = val.createdAt || val.timestamp || Date.now();
                const bodyText = val.body || val.message || '';
                const titleText = val.title || 'Notification';

                // Resolve order identifier: if it's a raw Firebase push key (-P...), resolve from text or format
                let rawOrderId = val.orderId || val.order_id || val.orderCode || null;
                let resolvedOrderCode = val.orderCode || null;

                if (!resolvedOrderCode || String(rawOrderId).startsWith('-')) {
                  const match = String(bodyText).match(/FC-\d{5}/i) || String(titleText).match(/FC-\d{5}/i);
                  if (match) {
                    resolvedOrderCode = match[0].toUpperCase();
                    if (!rawOrderId || String(rawOrderId).startsWith('-')) {
                      rawOrderId = resolvedOrderCode;
                    }
                  } else if (rawOrderId) {
                    resolvedOrderCode = formatOrderId(rawOrderId);
                  }
                }

                acc.push({
                  id: key,
                  type: val.type || 'general',
                  title: titleText,
                  body: bodyText,
                  message: bodyText,
                  desc: bodyText,
                  orderId: rawOrderId,
                  orderCode: resolvedOrderCode || (rawOrderId ? formatOrderId(rawOrderId) : null),
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
                });
                return acc;
              }, []);

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
            // Clear the failed listener
            teardownListener();

            // If permission denied due to initial auth handshake timing, retry automatically
            if (error.code === 'PERMISSION_DENIED' || error.message?.toLowerCase().includes('permission')) {
              retryTimerRef.current = setTimeout(() => {
                if (isMounted) {
                  attachListener();
                }
              }, 1200);
            }
          }
        );
        activeUnsubRef.current = unsub;
      } catch (err) {
        console.warn(`[useNotifications] Failed to subscribe for ${uid}:`, err);
        setLoading(false);
        teardownListener();
      }
    };

    // Attach real-time listener immediately
    attachListener();

    // Listen to auth changes to reconnect or hydrate token seamlessly.
    // Only re-attach if no listener is currently active (activeUnsubRef.current is null).
    const authUnsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (!isMounted) return;
      if (fbUser && !activeUnsubRef.current) {
        attachListener();
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(retryTimerRef.current);
      teardownListener();
      if (typeof authUnsubscribe === 'function') {
        try { authUnsubscribe(); } catch (_) {}
      }
    };
  }, [uid]);



  // Compute unread count in real-time
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
