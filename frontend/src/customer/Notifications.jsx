import React, { useState, useEffect } from 'react';
import { notificationsApi } from '../api/apiClient';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Clock, 
  Package, 
  Truck, 
  RefreshCw,
  Info,
  AlertCircle
} from 'lucide-react';

export const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationsApi.getNotifications();
      const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setNotifications(list);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  return (
    <div className="portal-container">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Live Updates</div>
          <h1 className="text-2xl font-bold text-navy">Notifications & Activity</h1>
          <p className="text-sm text-muted">Stay informed on order status changes, delivery alerts, and service updates</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchNotifications} 
            className="btn btn-outline-secondary btn-sm flex items-center gap-1"
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button 
            onClick={handleMarkAllRead} 
            className="btn btn-outline-primary btn-sm flex items-center gap-1.5"
            disabled={notifications.length === 0}
          >
            <CheckCheck size={16} />
            <span>Mark All Read</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <RefreshCw size={36} className="animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm font-medium text-navy">Fetching notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
          <Bell size={48} className="text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-navy">No New Notifications</h3>
          <p className="text-sm text-muted max-w-sm mx-auto mt-1">
            You're all caught up! Updates regarding your pickups and laundry deliveries will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div 
              key={notif.id} 
              className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${notif.is_read ? 'bg-white border-slate-200' : 'bg-blue-50/50 border-blue-200 shadow-sm'}`}
            >
              <div className="flex items-start gap-3.5">
                <div className={`p-2.5 rounded-xl shrink-0 ${notif.is_read ? 'bg-slate-100 text-slate-500' : 'bg-primary text-white'}`}>
                  <Bell size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-navy text-sm">{notif.title}</h4>
                  <p className="text-sm text-slate-600 mt-0.5">{notif.message}</p>
                  <span className="text-xs text-muted mt-2 block">
                    {notif.created_at ? new Date(notif.created_at).toLocaleString() : 'Just now'}
                  </span>
                </div>
              </div>

              {!notif.is_read && (
                <button 
                  onClick={() => handleMarkRead(notif.id)}
                  className="btn btn-outline-primary btn-sm shrink-0"
                  title="Mark as Read"
                >
                  <Check size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
