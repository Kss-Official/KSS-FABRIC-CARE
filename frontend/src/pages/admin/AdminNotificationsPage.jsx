import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAdmin } from '../../context/AdminContext';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  Search, 
  ShoppingBag, 
  Truck, 
  CheckCircle2, 
  CreditCard, 
  Users, 
  AlertCircle, 
  ArrowUpRight, 
  Filter, 
  Send, 
  X, 
  Clock, 
  ShieldAlert, 
  Megaphone,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  RotateCcw
} from 'lucide-react';

export const AdminNotificationsPage = () => {
  const { 
    notifications, 
    markNotificationAsRead, 
    markNotificationAsUnread, 
    markAllNotificationsAsRead, 
    deleteNotification, 
    clearAllNotifications, 
    addAdminNotification,
    setAdminTab 
  } = useAdmin();

  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('Notifications refreshed');
    }, 600);
  };

  const formatNotifDateTime = (val, timestamp) => {
    if (typeof val === 'string' && val.includes('/') && (val.includes('am') || val.includes('pm') || val.includes(':'))) {
      return val;
    }
    const dateObj = timestamp ? new Date(timestamp) : new Date();
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    let hours = dateObj.getHours();
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const seconds = String(dateObj.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds} ${ampm}`;
  };

  // Broadcast modal form state
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    desc: '',
    type: 'system',
    priority: 'normal',
    target: 'all'
  });

  const showToast = (msg) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 3000);
  };

  // KPIs
  const totalCount = notifications.length;
  const unreadCount = notifications.filter(n => n.unread).length;
  const ordersCount = notifications.filter(n => n.type === 'order' || n.type === 'payment').length;
  const deliveryCount = notifications.filter(n => n.type === 'driver' || n.type === 'delivery').length;

  // Filtered Notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter(notif => {
      // Tab filter
      if (activeFilter === 'unread' && !notif.unread) return false;
      if (activeFilter === 'orders' && notif.type !== 'order' && notif.type !== 'payment') return false;
      if (activeFilter === 'delivery' && notif.type !== 'driver' && notif.type !== 'delivery') return false;
      if (activeFilter === 'customers' && notif.type !== 'customer') return false;
      if (activeFilter === 'system' && notif.type !== 'system') return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = notif.title?.toLowerCase().includes(query);
        const matchesDesc = notif.desc?.toLowerCase().includes(query);
        const matchesId = notif.meta?.orderId?.toLowerCase().includes(query);
        const matchesCustomer = notif.meta?.customer?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesId && !matchesCustomer) return false;
      }

      return true;
    });
  }, [notifications, activeFilter, searchQuery]);

  // Bulk Selection Handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredNotifications.map(n => n.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkMarkRead = () => {
    selectedIds.forEach(id => markNotificationAsRead(id));
    setSelectedIds([]);
    showToast(`Marked ${selectedIds.length} notifications as read`);
  };

  const handleBulkDelete = () => {
    selectedIds.forEach(id => deleteNotification(id));
    setSelectedIds([]);
    showToast(`Deleted ${selectedIds.length} notifications`);
  };

  const handleBroadcastSubmit = (e) => {
    e.preventDefault();
    if (!broadcastForm.title.trim() || !broadcastForm.desc.trim()) return;

    addAdminNotification({
      title: broadcastForm.title,
      desc: broadcastForm.desc,
      type: broadcastForm.type,
      actionTab: broadcastForm.type === 'order' ? 'orders' : 'settings',
      meta: {
        priority: broadcastForm.priority,
        target: broadcastForm.target
      }
    });

    setIsBroadcastModalOpen(false);
    setBroadcastForm({
      title: '',
      desc: '',
      type: 'system',
      priority: 'normal',
      target: 'all'
    });
    showToast('Broadcast notification sent successfully!');
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'order':
        return <ShoppingBag size={18} />;
      case 'driver':
        return <Truck size={18} />;
      case 'delivery':
        return <CheckCircle2 size={18} />;
      case 'payment':
        return <CreditCard size={18} />;
      case 'customer':
        return <Users size={18} />;
      case 'system':
      default:
        return <AlertCircle size={18} />;
    }
  };

  const getTypeBadgeLabel = (type) => {
    switch (type) {
      case 'order': return 'New Order';
      case 'driver': return 'Driver Assigned';
      case 'delivery': return 'Delivery Update';
      case 'payment': return 'Payment';
      case 'customer': return 'Customer';
      case 'system': return 'System Notice';
      default: return 'Alert';
    }
  };

  return (
    <div className="admin-notifs-page-container">
      {/* Toast Feedback */}
      {feedbackMessage && (
        <div className="notif-floating-toast animate-slide-down">
          <Check size={16} />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="notifs-header-row">
        <div>
          <span className="notifs-live-tag">LIVE UPDATES</span>
          <h1 className="notifs-main-title">Notifications &amp; Activity</h1>
          <p className="notifs-subtitle">
            Stay informed on order status changes, delivery alerts, and service updates
          </p>
        </div>

        <div className="notifs-header-actions">
          <button 
            type="button" 
            className="notif-pill-btn notif-refresh-pill"
            onClick={handleRefresh}
          >
            <RotateCcw size={14} className={isRefreshing ? 'spin-anim' : ''} />
            <span>Refresh</span>
          </button>

          <button 
            type="button" 
            className="notif-pill-btn notif-mark-read-pill"
            onClick={() => {
              markAllNotificationsAsRead();
              showToast('All notifications marked as read');
            }}
          >
            <CheckCheck size={16} />
            <span>Mark All Read</span>
          </button>

          <button 
            type="button" 
            className="notif-btn notif-btn-primary"
            onClick={() => setIsBroadcastModalOpen(true)}
          >
            <Megaphone size={16} />
            <span>Send Announcement</span>
          </button>

          {totalCount > 0 && (
            <button 
              type="button" 
              className="notif-btn notif-btn-danger-outline"
              onClick={() => setShowClearConfirm(true)}
            >
              <Trash2 size={16} />
              <span>Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="notifs-stats-grid">
        <div className={`notifs-stat-card ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => setActiveFilter('all')}>
          <div className="notifs-stat-icon teal">
            <Bell size={22} />
          </div>
          <div className="notifs-stat-info">
            <span className="notifs-stat-label">Total Notifications</span>
            <span className="notifs-stat-val">{totalCount}</span>
          </div>
        </div>

        <div className={`notifs-stat-card ${activeFilter === 'unread' ? 'active' : ''}`} onClick={() => setActiveFilter('unread')}>
          <div className="notifs-stat-icon orange">
            <Clock size={22} />
          </div>
          <div className="notifs-stat-info">
            <div className="notifs-stat-label-wrap">
              <span className="notifs-stat-label">Unread Alerts</span>
              {unreadCount > 0 && <span className="stat-pill-badge">{unreadCount} New</span>}
            </div>
            <span className="notifs-stat-val">{unreadCount}</span>
          </div>
        </div>

        <div className={`notifs-stat-card ${activeFilter === 'orders' ? 'active' : ''}`} onClick={() => setActiveFilter('orders')}>
          <div className="notifs-stat-icon green">
            <ShoppingBag size={22} />
          </div>
          <div className="notifs-stat-info">
            <span className="notifs-stat-label">Orders & Payments</span>
            <span className="notifs-stat-val">{ordersCount}</span>
          </div>
        </div>

        <div className={`notifs-stat-card ${activeFilter === 'delivery' ? 'active' : ''}`} onClick={() => setActiveFilter('delivery')}>
          <div className="notifs-stat-icon blue">
            <Truck size={22} />
          </div>
          <div className="notifs-stat-info">
            <span className="notifs-stat-label">Pickup & Delivery</span>
            <span className="notifs-stat-val">{deliveryCount}</span>
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="notifs-toolbar-card">
        <div className="notifs-tabs-row">
          <button 
            type="button" 
            className={`notifs-tab-pill ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All <span className="pill-count">{totalCount}</span>
          </button>
          <button 
            type="button" 
            className={`notifs-tab-pill ${activeFilter === 'unread' ? 'active' : ''}`}
            onClick={() => setActiveFilter('unread')}
          >
            Unread <span className="pill-count">{unreadCount}</span>
          </button>
          <button 
            type="button" 
            className={`notifs-tab-pill ${activeFilter === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveFilter('orders')}
          >
            Orders & Payments
          </button>
          <button 
            type="button" 
            className={`notifs-tab-pill ${activeFilter === 'delivery' ? 'active' : ''}`}
            onClick={() => setActiveFilter('delivery')}
          >
            Pickup & Delivery
          </button>
          <button 
            type="button" 
            className={`notifs-tab-pill ${activeFilter === 'customers' ? 'active' : ''}`}
            onClick={() => setActiveFilter('customers')}
          >
            Customers
          </button>
          <button 
            type="button" 
            className={`notifs-tab-pill ${activeFilter === 'system' ? 'active' : ''}`}
            onClick={() => setActiveFilter('system')}
          >
            System & Notices
          </button>
        </div>

        <div className="notifs-search-row">
          <div className="notifs-search-input-box">
            <Search size={16} className="search-ico" />
            <input 
              type="text" 
              placeholder="Search by order ID, customer name, keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="notifs-search-input"
            />
            {searchQuery && (
              <button 
                type="button" 
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Action Bar (when items selected) */}
      {selectedIds.length > 0 && (
        <div className="notifs-bulk-bar animate-fade-in">
          <div className="bulk-bar-left">
            <span className="bulk-badge">{selectedIds.length} Selected</span>
          </div>
          <div className="bulk-bar-actions">
            <button 
              type="button" 
              className="bulk-action-btn"
              onClick={handleBulkMarkRead}
            >
              <Check size={14} /> Mark as Read
            </button>
            <button 
              type="button" 
              className="bulk-action-btn danger"
              onClick={handleBulkDelete}
            >
              <Trash2 size={14} /> Delete Selected
            </button>
            <button 
              type="button" 
              className="bulk-action-btn cancel"
              onClick={() => setSelectedIds([])}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="notifs-list-container">
        {filteredNotifications.length > 0 && (
          <div className="notifs-list-header">
            <label className="select-all-label">
              <input 
                type="checkbox" 
                checked={selectedIds.length === filteredNotifications.length && filteredNotifications.length > 0}
                onChange={handleSelectAll}
                className="notif-checkbox"
              />
              <span>Select All Displayed</span>
            </label>
            <span className="notifs-count-label">
              Showing {filteredNotifications.length} of {totalCount} notifications
            </span>
          </div>
        )}

        {filteredNotifications.length === 0 ? (
          <div className="notifs-empty-state">
            <div className="empty-state-icon-wrap">
              <Bell size={36} />
            </div>
            <h3>No notifications found</h3>
            <p>
              {searchQuery 
                ? `No notifications matched "${searchQuery}". Try a different keyword.` 
                : activeFilter === 'unread'
                ? 'Great job! You are all caught up with all unread notifications.'
                : 'There are currently no notifications in this category.'}
            </p>
            {(searchQuery || activeFilter !== 'all') && (
              <button 
                type="button" 
                className="notif-reset-filter-btn"
                onClick={() => {
                  setSearchQuery('');
                  setActiveFilter('all');
                }}
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="notifs-items-stack">
            {filteredNotifications.map((notif) => {
              const isSelected = selectedIds.includes(notif.id);
              return (
                <div 
                  key={notif.id}
                  className={`notif-card-item ${notif.unread ? 'unread' : 'read'} ${isSelected ? 'selected' : ''}`}
                >
                  <div className="notif-card-left">
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={() => handleToggleSelect(notif.id)}
                      className="notif-checkbox"
                    />

                    <div className="notif-card-teal-icon">
                      <Bell size={18} color="#FFFFFF" strokeWidth={2.2} />
                    </div>
                  </div>

                  <div className="notif-card-body">
                    <div className="notif-body-top">
                      <div className="notif-title-badge-wrap">
                        <span className={`notif-category-tag ${notif.type}`}>
                          {getTypeBadgeLabel(notif.type)}
                        </span>
                        <h3 className="notif-card-title">{notif.title}</h3>
                        {notif.unread && <span className="notif-card-dot" />}
                      </div>
                      <span className="notif-card-time">{formatNotifDateTime(notif.time, notif.timestamp)}</span>
                    </div>

                    <p className="notif-card-desc">{notif.desc}</p>

                    {/* Metadata chips */}
                    {notif.meta && (
                      <div className="notif-meta-chips">
                        {notif.meta.orderId && (
                          <span className="meta-chip">Order: {notif.meta.orderId}</span>
                        )}
                        {notif.meta.driver && (
                          <span className="meta-chip">Driver: {notif.meta.driver}</span>
                        )}
                        {notif.meta.customer && (
                          <span className="meta-chip">Customer: {notif.meta.customer}</span>
                        )}
                        {notif.meta.amount && (
                          <span className="meta-chip">Amount: ₹{notif.meta.amount}</span>
                        )}
                        {notif.meta.priority === 'urgent' && (
                          <span className="meta-chip urgent">Urgent Priority</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="notif-card-actions">
                    {notif.actionTab && (
                      <button 
                        type="button" 
                        className="notif-action-link-btn"
                        onClick={() => {
                          if (notif.unread) markNotificationAsRead(notif.id);
                          setAdminTab(notif.actionTab);
                        }}
                        title={`Go to ${notif.actionTab}`}
                      >
                        <span>View</span>
                        <ArrowUpRight size={14} />
                      </button>
                    )}

                    <button 
                      type="button" 
                      className={`notif-card-circle-check-btn ${notif.unread ? '' : 'checked'}`}
                      onClick={() => {
                        if (notif.unread) {
                          markNotificationAsRead(notif.id);
                          showToast('Notification marked as read');
                        } else {
                          markNotificationAsUnread(notif.id);
                          showToast('Notification marked as unread');
                        }
                      }}
                      title={notif.unread ? 'Mark as read' : 'Mark as unread'}
                    >
                      <Check size={15} strokeWidth={2.4} />
                    </button>

                    <button 
                      type="button" 
                      className="notif-icon-action-btn danger"
                      onClick={() => {
                        deleteNotification(notif.id);
                        showToast('Notification removed');
                      }}
                      title="Delete notification"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Broadcast Announcement Modal */}
      {isBroadcastModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="notif-modal-backdrop" onClick={() => setIsBroadcastModalOpen(false)}>
          <div className="notif-modal-card animate-scale-up" onClick={e => e.stopPropagation()}>
            <div className="notif-modal-header">
              <div className="modal-title-wrap">
                <div className="modal-title-icon">
                  <Megaphone size={20} />
                </div>
                <div>
                  <h3 className="modal-title">Broadcast Announcement</h3>
                  <p className="modal-subtitle">Send a notification alert to admin portal and staff members</p>
                </div>
              </div>
              <button 
                type="button" 
                className="modal-close-btn"
                onClick={() => setIsBroadcastModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleBroadcastSubmit} className="notif-modal-form">
              <div className="form-group">
                <label className="form-label">Notification Title *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Festival Delivery Hours Update" 
                  value={broadcastForm.title}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select 
                    value={broadcastForm.type}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, type: e.target.value })}
                    className="form-select"
                  >
                    <option value="system">System Notice</option>
                    <option value="order">Order Alert</option>
                    <option value="delivery">Pickup & Delivery Alert</option>
                    <option value="customer">Customer Alert</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select 
                    value={broadcastForm.priority}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, priority: e.target.value })}
                    className="form-select"
                  >
                    <option value="normal">Normal</option>
                    <option value="urgent">High / Urgent</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Announcement Details *</label>
                <textarea 
                  rows={4}
                  placeholder="Enter detailed message regarding this announcement..."
                  value={broadcastForm.desc}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, desc: e.target.value })}
                  className="form-textarea"
                  required
                />
              </div>

              <div className="modal-footer-btns">
                <button 
                  type="button" 
                  className="modal-cancel-btn"
                  onClick={() => setIsBroadcastModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="modal-submit-btn"
                >
                  <Send size={16} />
                  <span>Send Notification</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && typeof document !== 'undefined' && createPortal(
        <div className="notif-modal-backdrop" onClick={() => setShowClearConfirm(false)}>
          <div className="notif-modal-card confirm-modal animate-scale-up" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon-wrap">
              <Trash2 size={28} />
            </div>
            <h3 className="confirm-title">Clear All Notifications?</h3>
            <p className="confirm-text">
              This action will remove all {totalCount} notifications from your dashboard. This cannot be undone.
            </p>
            <div className="confirm-footer-btns">
              <button 
                type="button" 
                className="modal-cancel-btn"
                onClick={() => setShowClearConfirm(false)}
              >
                Keep Notifications
              </button>
              <button 
                type="button" 
                className="confirm-delete-btn"
                onClick={() => {
                  clearAllNotifications();
                  setShowClearConfirm(false);
                  showToast('All notifications cleared');
                }}
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Scoped Styles */}
      <style>{`
        .admin-notifs-page-container {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 24px;
          position: relative;
          box-sizing: border-box;
          margin: 0;
        }

        /* FLOATING TOAST */
        .notif-floating-toast {
          position: fixed;
          top: 24px;
          right: 32px;
          background: #007E8A;
          color: #FFFFFF;
          padding: 12px 20px;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 126, 138, 0.3);
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.875rem;
          font-weight: 600;
          z-index: 9999;
        }

        /* HEADER */
        .notifs-header-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
        }

        .notifs-live-tag {
          display: inline-block;
          font-size: 11px;
          font-weight: 800;
          color: #0D7A75;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .notifs-main-title {
          font-size: 1.875rem;
          font-weight: 800;
          color: #0F172A;
          margin: 0 0 6px 0;
          letter-spacing: -0.02em;
        }

        .notifs-subtitle {
          font-size: 0.9375rem;
          color: #64748B;
          margin: 0;
          max-width: 600px;
        }

        .notifs-header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .notif-pill-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          border-radius: 9999px;
          cursor: pointer;
          transition: all 0.18s ease;
          font-family: inherit;
          white-space: nowrap;
          background: #FFFFFF;
        }

        .notif-refresh-pill {
          padding: 8px 16px;
          border: 1px solid #CBD5E1;
          color: #334155;
        }

        .notif-refresh-pill:hover {
          background: #F8FAFC;
          border-color: #94A3B8;
          color: #0F172A;
        }

        .notif-mark-read-pill {
          padding: 8px 18px;
          border: 1.5px solid #0D7A75;
          color: #0D7A75;
        }

        .notif-mark-read-pill:hover {
          background: #F0FDFA;
        }

        .spin-anim {
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .notif-card-teal-icon {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          background: #0D7A75;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #FFFFFF;
        }

        .notif-card-circle-check-btn {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1px solid #CBD5E1;
          background: #FFFFFF;
          color: #0D7A75;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.18s ease;
          padding: 0;
        }

        .notif-card-circle-check-btn:hover {
          border-color: #0D7A75;
          background: #F0FDFA;
        }

        .notif-card-circle-check-btn.checked {
          background: #F0FDFA;
          border-color: #0D7A75;
          color: #0D7A75;
        }

        .notif-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          font-family: inherit;
        }

        .notif-btn-primary {
          background: #007E8A;
          color: #FFFFFF;
          box-shadow: 0 4px 14px rgba(0, 126, 138, 0.25);
        }

        .notif-btn-primary:hover {
          background: #006872;
          transform: translateY(-1px);
        }

        .notif-btn-outline {
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          color: #334155;
        }

        .notif-btn-outline:hover {
          background: #F8FAFC;
          border-color: #94A3B8;
        }

        .notif-btn-danger-outline {
          background: #FFFFFF;
          border: 1px solid #FECACA;
          color: #EF4444;
        }

        .notif-btn-danger-outline:hover {
          background: #FEF2F2;
          border-color: #F87171;
        }

        /* KPI STATS GRID */
        .notifs-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .notifs-stat-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .notifs-stat-card:hover {
          border-color: #CBD5E1;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.04);
        }

        .notifs-stat-card.active {
          border-color: #007E8A;
          background: #F8FBFC;
          box-shadow: 0 0 0 1px #007E8A;
        }

        .notifs-stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .notifs-stat-icon.teal {
          background: #E6F7F5;
          color: #007E8A;
        }

        .notifs-stat-icon.orange {
          background: #FFF1EE;
          color: #FF5A36;
        }

        .notifs-stat-icon.green {
          background: #ECFDF5;
          color: #059669;
        }

        .notifs-stat-icon.blue {
          background: #EFF6FF;
          color: #2563EB;
        }

        .notifs-stat-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
          flex: 1;
        }

        .notifs-stat-label-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .notifs-stat-label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #64748B;
        }

        .stat-pill-badge {
          font-size: 10px;
          font-weight: 700;
          background: #FF5A36;
          color: #FFFFFF;
          padding: 1px 6px;
          border-radius: 9999px;
        }

        .notifs-stat-val {
          font-size: 1.5rem;
          font-weight: 800;
          color: #0F172A;
          line-height: 1.2;
        }

        /* TOOLBAR */
        .notifs-toolbar-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          padding: 14px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
        }

        .notifs-tabs-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .notifs-tab-pill {
          padding: 8px 14px;
          border-radius: 10px;
          border: none;
          background: #F8FAFC;
          color: #64748B;
          font-size: 0.84375rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: inherit;
        }

        .notifs-tab-pill:hover {
          background: #F1F5F9;
          color: #1E293B;
        }

        .notifs-tab-pill.active {
          background: #E6F7F5;
          color: #007E8A;
          font-weight: 700;
        }

        .pill-count {
          font-size: 11px;
          font-weight: 700;
          background: rgba(0, 0, 0, 0.06);
          padding: 1px 6px;
          border-radius: 9999px;
        }

        .notifs-tab-pill.active .pill-count {
          background: #007E8A;
          color: #FFFFFF;
        }

        .notifs-search-row {
          flex: 1;
          max-width: 380px;
          min-width: 260px;
        }

        .notifs-search-input-box {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .notifs-search-input-box .search-ico {
          position: absolute;
          left: 12px;
          color: #94A3B8;
        }

        .notifs-search-input {
          width: 100%;
          padding: 8px 34px 8px 36px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          font-size: 0.84375rem;
          color: #1E293B;
          outline: none;
          transition: all 0.2s;
        }

        .notifs-search-input:focus {
          border-color: #007E8A;
          background: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(0, 126, 138, 0.1);
        }

        .clear-search-btn {
          position: absolute;
          right: 10px;
          background: none;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          padding: 2px;
        }

        /* BULK BAR */
        .notifs-bulk-bar {
          background: #0F172A;
          color: #FFFFFF;
          border-radius: 14px;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.15);
        }

        .bulk-badge {
          font-size: 0.875rem;
          font-weight: 700;
          background: rgba(255, 255, 255, 0.15);
          padding: 4px 12px;
          border-radius: 8px;
        }

        .bulk-bar-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .bulk-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 8px;
          font-size: 0.8125rem;
          font-weight: 600;
          background: rgba(255, 255, 255, 0.12);
          color: #FFFFFF;
          border: none;
          cursor: pointer;
          transition: background 0.15s;
          font-family: inherit;
        }

        .bulk-action-btn:hover {
          background: rgba(255, 255, 255, 0.22);
        }

        .bulk-action-btn.danger {
          background: #EF4444;
        }

        .bulk-action-btn.danger:hover {
          background: #DC2626;
        }

        .bulk-action-btn.cancel {
          background: transparent;
          color: #94A3B8;
        }

        .bulk-action-btn.cancel:hover {
          color: #FFFFFF;
        }

        /* LIST CONTAINER */
        .notifs-list-container {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 18px;
          overflow: hidden;
        }

        .notifs-list-header {
          padding: 14px 24px;
          background: #FAFCFD;
          border-bottom: 1px solid #F1F5F9;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .select-all-label {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
        }

        .notif-checkbox {
          width: 17px;
          height: 17px;
          accent-color: #007E8A;
          cursor: pointer;
          border-radius: 4px;
        }

        .notifs-count-label {
          font-size: 0.8125rem;
          color: #94A3B8;
        }

        .notifs-items-stack {
          display: flex;
          flex-direction: column;
        }

        .notif-card-item {
          padding: 18px 24px;
          border-bottom: 1px solid #F1F5F9;
          display: flex;
          align-items: flex-start;
          gap: 18px;
          transition: all 0.15s ease;
          position: relative;
        }

        .notif-card-item:last-child {
          border-bottom: none;
        }

        .notif-card-item:hover {
          background: #F8FBFC;
        }

        .notif-card-item.unread {
          background: #FAFEFD;
        }

        .notif-card-item.unread:before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background: #007E8A;
        }

        .notif-card-item.selected {
          background: #F0FDFB;
        }

        .notif-card-left {
          display: flex;
          align-items: center;
          gap: 14px;
          padding-top: 2px;
        }

        .notif-type-icon-box {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .notif-type-icon-box.order {
          background: #E6F7F5;
          color: #007E8A;
        }

        .notif-type-icon-box.driver {
          background: #EFF6FF;
          color: #2563EB;
        }

        .notif-type-icon-box.delivery {
          background: #ECFDF5;
          color: #059669;
        }

        .notif-type-icon-box.payment {
          background: #FEF3C7;
          color: #D97706;
        }

        .notif-type-icon-box.customer {
          background: #EDE9FE;
          color: #7C3AED;
        }

        .notif-type-icon-box.system {
          background: #F1F5F9;
          color: #475569;
        }

        .notif-card-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
        }

        .notif-body-top {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
        }

        .notif-title-badge-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .notif-category-tag {
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 6px;
        }

        .notif-category-tag.order {
          background: #E6F7F5;
          color: #007E8A;
        }

        .notif-category-tag.driver {
          background: #EFF6FF;
          color: #2563EB;
        }

        .notif-category-tag.delivery {
          background: #ECFDF5;
          color: #059669;
        }

        .notif-category-tag.payment {
          background: #FEF3C7;
          color: #D97706;
        }

        .notif-category-tag.customer {
          background: #EDE9FE;
          color: #7C3AED;
        }

        .notif-category-tag.system {
          background: #F1F5F9;
          color: #475569;
        }

        .notif-card-title {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #0F172A;
          margin: 0;
        }

        .notif-card-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #007E8A;
        }

        .notif-card-time {
          font-size: 0.75rem;
          color: #94A3B8;
          white-space: nowrap;
        }

        .notif-card-desc {
          font-size: 0.875rem;
          color: #475569;
          margin: 0;
          line-height: 1.5;
        }

        .notif-meta-chips {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 4px;
        }

        .meta-chip {
          font-size: 11px;
          font-weight: 600;
          background: #F1F5F9;
          color: #475569;
          padding: 3px 9px;
          border-radius: 6px;
        }

        .meta-chip.urgent {
          background: #FEE2E2;
          color: #DC2626;
        }

        .notif-card-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          align-self: center;
        }

        .notif-action-link-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          background: #E6F7F5;
          color: #007E8A;
          border: none;
          border-radius: 8px;
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          font-family: inherit;
        }

        .notif-action-link-btn:hover {
          background: #007E8A;
          color: #FFFFFF;
        }

        .notif-icon-action-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid transparent;
          background: none;
          color: #64748B;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s;
        }

        .notif-icon-action-btn:hover {
          background: #F1F5F9;
          color: #1E293B;
          border-color: #E2E8F0;
        }

        .notif-icon-action-btn.danger:hover {
          background: #FEF2F2;
          color: #EF4444;
          border-color: #FECACA;
        }

        /* EMPTY STATE */
        .notifs-empty-state {
          padding: 64px 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .empty-state-icon-wrap {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: #F1F5F9;
          color: #94A3B8;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }

        .notifs-empty-state h3 {
          font-size: 1.125rem;
          font-weight: 700;
          color: #0F172A;
          margin: 0 0 8px 0;
        }

        .notifs-empty-state p {
          font-size: 0.875rem;
          color: #64748B;
          max-width: 420px;
          margin: 0 0 20px 0;
          line-height: 1.5;
        }

        .notif-reset-filter-btn {
          padding: 8px 18px;
          background: #007E8A;
          color: #FFFFFF;
          border: none;
          border-radius: 10px;
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
        }

        /* MODALS */
        .notif-modal-backdrop {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          height: 100dvh;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px 16px;
          z-index: 99999;
          overflow: hidden;
          overscroll-behavior: none;
        }

        .notif-modal-card {
          background: #FFFFFF;
          border-radius: 20px;
          width: 100%;
          max-width: 540px;
          max-height: calc(100vh - 40px);
          max-height: calc(100dvh - 40px);
          box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          overscroll-behavior: contain;
          position: relative;
        }

        .notif-modal-header {
          padding: 20px 24px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          border-bottom: 1px solid #F1F5F9;
          flex-shrink: 0;
        }

        .modal-title-wrap {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }

        .modal-title-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: #E6F7F5;
          color: #007E8A;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .modal-title {
          font-size: 1.125rem;
          font-weight: 800;
          color: #0F172A;
          margin: 0 0 4px 0;
        }

        .modal-subtitle {
          font-size: 0.8125rem;
          color: #64748B;
          margin: 0;
        }

        .modal-close-btn {
          background: none;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
        }

        .modal-close-btn:hover {
          color: #0F172A;
          background: #F1F5F9;
        }

        .notif-modal-form {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          overflow-y: auto;
          overscroll-behavior: contain;
          flex: 1 1 auto;
          min-height: 0;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .form-label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #334155;
        }

        .form-input, .form-select, .form-textarea {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid #CBD5E1;
          border-radius: 10px;
          font-size: 0.875rem;
          color: #1E293B;
          outline: none;
          background: #FFFFFF;
          font-family: inherit;
          transition: border-color 0.2s;
        }

        .form-input:focus, .form-select:focus, .form-textarea:focus {
          border-color: #007E8A;
          box-shadow: 0 0 0 3px rgba(0, 126, 138, 0.1);
        }

        .modal-footer-btns {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 8px;
        }

        .modal-cancel-btn {
          padding: 10px 18px;
          border: 1px solid #CBD5E1;
          background: #FFFFFF;
          color: #475569;
          font-size: 0.875rem;
          font-weight: 600;
          border-radius: 10px;
          cursor: pointer;
          font-family: inherit;
        }

        .modal-cancel-btn:hover {
          background: #F8FAFC;
        }

        .modal-submit-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: #007E8A;
          color: #FFFFFF;
          border: none;
          font-size: 0.875rem;
          font-weight: 600;
          border-radius: 10px;
          cursor: pointer;
          font-family: inherit;
          box-shadow: 0 4px 12px rgba(0, 126, 138, 0.25);
        }

        .modal-submit-btn:hover {
          background: #006872;
        }

        /* CONFIRM MODAL */
        .confirm-modal {
          max-width: 440px;
          padding: 32px 28px;
          text-align: center;
        }

        .confirm-icon-wrap {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #FEE2E2;
          color: #EF4444;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px auto;
        }

        .confirm-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0F172A;
          margin: 0 0 8px 0;
        }

        .confirm-text {
          font-size: 0.875rem;
          color: #64748B;
          margin: 0 0 24px 0;
          line-height: 1.5;
        }

        .confirm-footer-btns {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .confirm-delete-btn {
          padding: 10px 20px;
          background: #EF4444;
          color: #FFFFFF;
          border: none;
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
        }

        .confirm-delete-btn:hover {
          background: #DC2626;
        }

        /* ANIMATIONS */
        .animate-scale-up {
          animation: scaleUpModal 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes scaleUpModal {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-slide-down {
          animation: slideDownToast 0.25s ease;
        }

        @keyframes slideDownToast {
          from {
            opacity: 0;
            transform: translateY(-12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 1024px) {
          .notifs-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .notifs-stats-grid {
            grid-template-columns: 1fr;
          }
          .notifs-header-row {
            flex-direction: column;
          }
          .notifs-header-actions {
            width: 100%;
          }
          .notifs-toolbar-card {
            flex-direction: column;
            align-items: stretch;
          }
          .notifs-search-row {
            max-width: 100%;
          }
          .notif-card-item {
            flex-direction: column;
          }
          .notif-card-actions {
            align-self: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminNotificationsPage;
