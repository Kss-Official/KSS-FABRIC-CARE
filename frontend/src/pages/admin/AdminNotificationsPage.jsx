import React from 'react';
import { useAdmin } from '../../context/AdminContext';
import { NotificationsPageView } from '../../components/common/NotificationsPageView';

export const AdminNotificationsPage = () => {
  const { 
    notifications = [], 
    unreadNotificationsCount = 0,
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    setAdminTab 
  } = useAdmin();

  const handleActionClick = (notif) => {
    const targetTab = notif.actionTab || 
      (notif.type?.includes('complaint') ? 'delivery-reports' :
      (notif.type?.includes('task') || notif.type?.includes('pickup') || notif.type?.includes('delivery') || notif.type?.includes('driver') ? 'pickup-delivery' : 'orders'));
    setAdminTab(targetTab);
  };

  return (
    <div className="admin-notifs-shared-container" style={{ width: '100%', padding: '0' }}>
      <NotificationsPageView
        title="Notifications"
        subtitle="Stay informed on order status changes, delivery alerts, and system activity."
        cardHeading="Admin Central Notifications & Activity"
        notifications={Array.isArray(notifications) ? notifications : Object.values(notifications || {})}
        unreadCount={unreadNotificationsCount}
        onMarkRead={markNotificationAsRead}
        onMarkAllRead={markAllNotificationsAsRead}
        onActionClick={handleActionClick}
        tabs={[
          { id: 'ALL', label: 'All' },
          { id: 'UNREAD', label: `Unread ${unreadNotificationsCount > 0 ? `(${unreadNotificationsCount})` : ''}` },
          { id: 'ORDERS', label: 'Orders' },
          { id: 'TASKS', label: 'Field & Operations' }
        ]}
      />
    </div>
  );
};

export default AdminNotificationsPage;
