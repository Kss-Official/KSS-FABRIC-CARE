import { useState, useEffect, useRef } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { rtdb, auth } from '../config/firebase';

/**
 * Realtime hook for bell badge unread notification count
 * Listens to Realtime Database notifications for the user and staff role
 */
export const useUnreadNotificationsCount = (userId) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!rtdb) {
      setUnreadCount(0);
      return;
    }

    try {
      const targetPath = userId ? `notifications/${userId}` : 'notificationsByRole/staff';
      const notifRef = ref(rtdb, targetPath);

      const unsub = onValue(
        notifRef,
        (snapshot) => {
          if (!snapshot.exists()) {
            setUnreadCount((prev) => (prev !== 0 ? 0 : prev));
            return;
          }
          const val = snapshot.val();
          if (typeof val === 'object' && val !== null) {
            const count = Object.values(val).filter((n) => n && !n.isRead && !n.is_read).length;
            setUnreadCount((prev) => (prev !== count ? count : prev));
          } else {
            setUnreadCount((prev) => (prev !== 0 ? 0 : prev));
          }
        },
        (error) => {
          console.warn('Realtime notifications listener note:', error.message);
        }
      );

      return () => off(notifRef, 'value', unsub);
    } catch (err) {
      console.warn('Failed to attach notification listener:', err);
    }
  }, [userId]);

  return unreadCount;
};

/**
 * Realtime hook for Customer Track Order (order document + history)
 */
export const useOrderRealtimeTracking = (orderId, onOrderUpdate = null) => {
  const [order, setOrder] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(Boolean(orderId));
  const onOrderUpdateRef = useRef(onOrderUpdate);

  useEffect(() => {
    onOrderUpdateRef.current = onOrderUpdate;
  }, [onOrderUpdate]);

  useEffect(() => {
    if (!orderId || !rtdb) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const cleanId = String(orderId).trim();
    const orderRef = ref(rtdb, `orders/${cleanId}`);
    const historyRef = ref(rtdb, `orderHistory/${cleanId}`);

    const unsubOrder = onValue(
      orderRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = { id: cleanId, ...snapshot.val() };
          setOrder(data);
          if (typeof onOrderUpdateRef.current === 'function') {
            onOrderUpdateRef.current(data);
          }
        }
        setLoading(false);
      },
      (err) => {
        console.warn('Order tracker realtime error:', err.message);
        setLoading(false);
      }
    );

    const unsubHistory = onValue(
      historyRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const val = snapshot.val();
          const items = Object.keys(val).map((k) => ({ id: k, ...val[k] }));
          items.sort((a, b) => (a.at || a.created_at || 0) - (b.at || b.created_at || 0));
          setHistory(items);
        } else {
          setHistory([]);
        }
      },
      (err) => {
        console.warn('Order history realtime error:', err.message);
      }
    );

    return () => {
      off(orderRef, 'value', unsubOrder);
      off(historyRef, 'value', unsubHistory);
    };
  }, [orderId]);

  return { order, history, loading };
};

/**
 * Realtime hook for Delivery Agent tasks
 */
export const useAgentTasksRealtime = (agentId, onTaskChange = null) => {
  const onTaskChangeRef = useRef(onTaskChange);
  useEffect(() => {
    onTaskChangeRef.current = onTaskChange;
  }, [onTaskChange]);

  useEffect(() => {
    if (!agentId || !rtdb) return;

    try {
      const tasksRef = ref(rtdb, 'tasks');
      const unsub = onValue(
        tasksRef,
        (snapshot) => {
          if (!snapshot.exists()) {
            if (typeof onTaskChangeRef.current === 'function') onTaskChangeRef.current([]);
            return;
          }
          const val = snapshot.val();
          const allTasks = Object.keys(val).map((k) => ({ id: k, ...val[k] }));
          const agentTasks = allTasks.filter(
            (t) => t.agentId === agentId || t.agent_id === agentId
          );
          if (typeof onTaskChangeRef.current === 'function') onTaskChangeRef.current(agentTasks);
        },
        (err) => {
          console.warn('Agent tasks realtime error:', err.message);
        }
      );

      return () => off(tasksRef, 'value', unsub);
    } catch (err) {
      console.warn('Failed to attach agent tasks listener:', err);
    }
  }, [agentId]);
};

/**
 * Realtime hook for Staff active orders (refetches orders on database change)
 * Uses stable ref and debouncing to prevent infinite re-render loops
 */
export const useStaffActiveOrdersRealtime = (onRefresh) => {
  const onRefreshRef = useRef(onRefresh);
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    if (!rtdb || !auth.currentUser) return;

    let timer = null;
    let isInitial = true;
    const ordersRef = ref(rtdb, 'orders');

    const unsub = onValue(
      ordersRef,
      () => {
        // Skip initial snapshot to avoid duplicate fetch on mount
        if (isInitial) {
          isInitial = false;
          return;
        }
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          if (typeof onRefreshRef.current === 'function') {
            onRefreshRef.current();
          }
        }, 1000);
      },
      (err) => {
        console.warn('Staff orders realtime listener note:', err.message);
      }
    );

    return () => {
      if (timer) clearTimeout(timer);
      off(ordersRef, 'value', unsub);
    };
  }, []);
};
