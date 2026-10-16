import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Realtime hook for bell badge unread notification count
 * Firestore security rule: read if resource.data.user_id == request.auth.uid
 */
export const useUnreadNotificationsCount = (userId) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId || !db) {
      setUnreadCount(0);
      return;
    }

    try {
      const q = query(
        collection(db, 'notifications'),
        where('user_id', '==', userId),
        where('is_read', '==', false)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          setUnreadCount(snapshot.size);
        },
        (error) => {
          console.warn('Realtime notifications listener error:', error.message);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn('Failed to attach notification listener:', err);
    }
  }, [userId]);

  return unreadCount;
};

/**
 * Realtime hook for Customer Track Order (order document + history subcollection)
 */
export const useOrderRealtimeTracking = (orderId, onOrderUpdate = null) => {
  const [order, setOrder] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(Boolean(orderId));

  useEffect(() => {
    if (!orderId || !db) {
      setLoading(false);
      return;
    }

    setLoading(true);
    let unsubHistory = () => {};

    // 1. Listen to order doc
    const orderDocRef = doc(db, 'orders', orderId);
    const unsubOrder = onSnapshot(
      orderDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = { id: snapshot.id, ...snapshot.data() };
          setOrder(data);
          if (onOrderUpdate) onOrderUpdate(data);
        }
        setLoading(false);
      },
      (err) => {
        console.warn('Order tracker realtime error:', err.message);
        setLoading(false);
      }
    );

    // 2. Listen to history subcollection
    try {
      const histQuery = query(
        collection(db, 'orders', orderId, 'history'),
        orderBy('created_at', 'asc')
      );
      unsubHistory = onSnapshot(
        histQuery,
        (snapshot) => {
          const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          setHistory(items);
        },
        (err) => {
          console.warn('Order history realtime error:', err.message);
        }
      );
    } catch (err) {
      console.warn('Failed to listen to order history:', err);
    }

    return () => {
      unsubOrder();
      unsubHistory();
    };
  }, [orderId]);

  return { order, history, loading };
};

/**
 * Realtime hook for Delivery Agent tasks
 */
export const useAgentTasksRealtime = (agentId, onTaskChange = null) => {
  useEffect(() => {
    if (!agentId || !db) return;

    try {
      const q = query(
        collection(db, 'tasks'),
        where('agent_id', '==', agentId)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (onTaskChange) {
            const tasks = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            onTaskChange(tasks);
          }
        },
        (err) => {
          console.warn('Agent tasks realtime error:', err.message);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn('Failed to attach agent tasks listener:', err);
    }
  }, [agentId, onTaskChange]);
};

/**
 * Realtime hook for Staff active orders (refetches REST API on change)
 */
export const useStaffActiveOrdersRealtime = (onRefresh) => {
  useEffect(() => {
    if (!db || !onRefresh) return;

    try {
      // Listen to active orders
      const q = query(
        collection(db, 'orders'),
        where('status', 'in', [
          'RECEIVED_BY_LAUNDRY', 'INSPECTION', 'PROCESSING',
          'QUALITY_CHECK', 'PACKING', 'READY_FOR_DELIVERY',
          'DELIVERY_ASSIGNED', 'OUT_FOR_DELIVERY'
        ])
      );

      const unsubscribe = onSnapshot(
        q,
        () => {
          onRefresh();
        },
        (err) => {
          console.warn('Staff orders realtime listener note:', err.message);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn('Failed to attach staff orders listener:', err);
    }
  }, [onRefresh]);
};
