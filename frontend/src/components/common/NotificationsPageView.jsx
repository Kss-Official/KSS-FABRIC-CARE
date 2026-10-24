import React, { useState, useMemo } from 'react';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Clock, 
  Package, 
  Truck, 
  RefreshCw,
  Search, 
  X, 
  CheckCircle2, 
  CreditCard, 
  ArrowRight, 
  Box,
  Loader2 
} from 'lucide-react';
import { formatOrderId } from '../../utils/helpers';

/**
 * Normalizes notification objects across any portal into a consistent schema.
 */
export const normalizeNotification = (notif) => {
  let category = notif.category || 'Notification';
  let type = notif.type || 'info';

  const text = `${notif.title || ''} ${notif.body || notif.message || notif.desc || ''}`.toLowerCase();
  if (text.includes('reschedul')) {
    category = 'Rescheduled';
    type = 'rescheduled';
  } else if (text.includes('pickup') || text.includes('pick-up') || text.includes('pick up')) {
    category = 'Pickup Task';
    type = 'pickup';
  } else if (notif.type === 'new_delivery' || notif.type === 'delivery' || text.includes('delivery task') || text.includes('new delivery') || text.includes('out for delivery') || text.includes('delivery update') || text.includes('assigned to deliver') || text.includes('delivery assigned')) {
    category = 'Delivery Task';
    type = 'delivery';
  } else if (text.includes('deliver') || text.includes('completed')) {
    category = 'Delivered';
    type = 'completed';
  } else if (text.includes('payment') || text.includes('paid')) {
    category = 'Payment';
    type = 'payment';
  } else if (text.includes('hub') || text.includes('drop') || text.includes('garment') || text.includes('quality') || text.includes('wash') || text.includes('iron') || text.includes('process')) {
    category = 'Operations';
    type = 'processing';
  }

  const created = notif.createdAt || notif.timestamp || notif.created_at;
  let formattedDate = 'Recent';
  try {
    const d = new Date(created);
    if (!isNaN(d.getTime())) {
      formattedDate = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + 
        ', ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
  } catch (_) {}

  return {
    ...notif,
    id: notif.id || `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    category,
    type,
    title: notif.title || 'Notification Update',
    message: notif.body || notif.message || notif.desc || 'You have an update on your operations.',
    orderId: notif.orderId || notif.order_id || null,
    formattedDate: notif.formattedDate || formattedDate,
    isRead: notif.isRead !== undefined ? Boolean(notif.isRead) : notif.unread !== undefined ? !notif.unread : false
  };
};

/**
 * Shared Notifications Page Component
 * Replicates the Customer Portal Notifications UI across Staff, Delivery Agent, and Admin portals.
 */
export const NotificationsPageView = ({
  title = 'Notifications',
  subtitle = 'Stay informed on order status changes, delivery alerts, and service updates.',
  cardHeading = 'Notifications & Activity',
  notifications = [],
  unreadCount = 0,
  loading = false,
  onMarkRead,
  onMarkAllRead,
  onActionClick,
  onRefresh,
  tabs,
  hideHeader = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);

  // Normalize incoming notifications
  const normalizedList = useMemo(() => {
    return (notifications || []).map(normalizeNotification);
  }, [notifications]);

  // Default tabs if not provided
  const availableTabs = useMemo(() => {
    if (tabs && Array.isArray(tabs) && tabs.length > 0) return tabs;
    return [
      { id: 'ALL', label: 'All' },
      { id: 'UNREAD', label: `Unread ${unreadCount > 0 ? `(${unreadCount})` : ''}` },
      { id: 'ORDERS', label: 'Orders' },
      { id: 'TASKS', label: 'Tasks & Operations' }
    ];
  }, [tabs, unreadCount]);

  // Handle refresh action
  const handleRefreshClick = async () => {
    setRefreshing(true);
    setRefreshSuccess(false);
    try {
      if (onRefresh) {
        await onRefresh();
      } else {
        await new Promise((r) => setTimeout(r, 400));
      }
      setRefreshSuccess(true);
      setTimeout(() => setRefreshSuccess(false), 2000);
    } catch (err) {
      console.warn('Refresh notice:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Filtered notifications
  const filteredList = useMemo(() => {
    return normalizedList.filter((notif) => {
      // Tab filter
      if (activeTab === 'UNREAD' && notif.isRead) return false;
      if (activeTab === 'ORDERS' && !['order', 'processing', 'rescheduled'].includes(notif.type) && !notif.orderId) return false;
      if (activeTab === 'DELIVERY' && !['delivery', 'completed'].includes(notif.type)) return false;
      if (activeTab === 'PICKUPS' && !['pickup'].includes(notif.type)) return false;
      if (activeTab === 'TASKS' && !['pickup', 'delivery', 'processing'].includes(notif.type)) return false;

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const titleText = (notif.title || '').toLowerCase();
      const msgText = (notif.message || '').toLowerCase();
      const catText = (notif.category || '').toLowerCase();
      const ordText = (notif.orderId || '').toLowerCase();
      return titleText.includes(q) || msgText.includes(q) || catText.includes(q) || ordText.includes(q);
    });
  }, [normalizedList, activeTab, searchQuery]);

  // Render Icon Box matching Customer Portal UI
  const renderIconBox = (type) => {
    switch (type) {
      case 'rescheduled':
        return (
          <div className="notif-icon-box notif-icon-rescheduled">
            <Clock size={18} strokeWidth={2.2} />
          </div>
        );
      case 'pickup':
        return (
          <div className="notif-icon-box notif-icon-pickup">
            <Box size={18} strokeWidth={2.2} />
          </div>
        );
      case 'delivery':
        return (
          <div className="notif-icon-box notif-icon-delivery">
            <Truck size={18} strokeWidth={2.2} />
          </div>
        );
      case 'completed':
        return (
          <div className="notif-icon-box notif-icon-completed">
            <CheckCircle2 size={18} strokeWidth={2.2} />
          </div>
        );
      case 'payment':
        return (
          <div className="notif-icon-box notif-icon-payment">
            <CreditCard size={18} strokeWidth={2.2} />
          </div>
        );
      case 'processing':
        return (
          <div className="notif-icon-box notif-icon-processing">
            <Package size={18} strokeWidth={2.2} />
          </div>
        );
      default:
        return (
          <div className="notif-icon-box notif-icon-default">
            <Bell size={18} strokeWidth={2.2} />
          </div>
        );
    }
  };

  // Render Category Badge matching Customer Portal UI
  const renderCategoryBadge = (category, type) => {
    switch (type) {
      case 'rescheduled':
        return (
          <span className="notif-pill notif-pill-rescheduled">
            <Clock size={11} strokeWidth={2.5} />
            <span>{category}</span>
          </span>
        );
      case 'pickup':
        return (
          <span className="notif-pill notif-pill-pickup">
            <Box size={11} strokeWidth={2.5} />
            <span>{category}</span>
          </span>
        );
      case 'delivery':
        return (
          <span className="notif-pill notif-pill-delivery">
            <Truck size={11} strokeWidth={2.5} />
            <span>{category}</span>
          </span>
        );
      case 'completed':
        return (
          <span className="notif-pill notif-pill-completed">
            <CheckCircle2 size={11} strokeWidth={2.5} />
            <span>{category}</span>
          </span>
        );
      case 'payment':
        return (
          <span className="notif-pill notif-pill-payment">
            <CreditCard size={11} strokeWidth={2.5} />
            <span>{category}</span>
          </span>
        );
      case 'processing':
        return (
          <span className="notif-pill notif-pill-processing">
            <Package size={11} strokeWidth={2.5} />
            <span>{category}</span>
          </span>
        );
      default:
        return (
          <span className="notif-pill notif-pill-default">
            <Bell size={11} strokeWidth={2.5} />
            <span>{category}</span>
          </span>
        );
    }
  };

  return (
    <div className="notifications-portal-page animate-fade-in">
      {/* 1. Page Header matching Customer Portal layout */}
      {!hideHeader && Boolean(title || subtitle) && (
        <div className="notifications-header-row mb-6">
          <div className="header-breadcrumbs-col">
            {title && <h1 className="notifications-page-title">{title}</h1>}
            {subtitle && <p className="notifications-page-subtitle">{subtitle}</p>}
          </div>
        </div>
      )}

      {/* 2. Main Customer Notifications Card */}
      <div className="content-card customer-notifications-card mb-3">
        {/* Card Header Title & Controls Row */}
        <div className="notifications-card-header">
          <div className="notifications-title-wrap">
            <div className="notifications-icon-circle">
              <Bell size={20} className="text-teal" />
            </div>
            <h2 className="notifications-card-heading">{cardHeading}</h2>
          </div>

          <div className="notifications-card-controls-row">
            {/* Count Pill */}
            <span className="notifications-count-pill">
              {filteredList.length} {filteredList.length === 1 ? 'Notification' : 'Notifications'}
            </span>

            {/* Unread Pill */}
            {unreadCount > 0 && (
              <span className="notifications-unread-pill">
                {unreadCount} Unread
              </span>
            )}

            {/* Refresh Button */}
            <button
              type="button"
              className={`refresh-notifications-btn ${refreshing ? 'loading' : ''} ${refreshSuccess ? 'success' : ''}`}
              onClick={handleRefreshClick}
              disabled={refreshing}
              title="Refresh notifications"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
              <span>{refreshing ? 'Refreshing...' : refreshSuccess ? 'Refreshed!' : 'Refresh'}</span>
            </button>

            {/* Mark All Read Button */}
            {unreadCount > 0 && (
              <button
                type="button"
                className="btn-mark-all-read"
                onClick={onMarkAllRead}
                title="Mark all notifications as read"
              >
                <CheckCheck size={14} />
                <span>Mark All Read</span>
              </button>
            )}

            {/* Search Input */}
            <div className="notifications-search-wrapper">
              <Search size={14} className="notifications-search-icon" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="notifications-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="notifications-search-clear-btn"
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="notif-filter-tabs">
              {availableTabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`notif-tab-btn ${activeTab === t.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Notifications List Section */}
        <div className="notifications-content-container">
          {loading ? (
            <div className="notifications-state-box">
              <Loader2 className="animate-spin text-teal" size={32} />
              <p className="notifications-state-text">Fetching notifications...</p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="notifications-state-box">
              <div className="notifications-empty-circle">
                <Bell size={26} className="text-slate-400" />
              </div>
              <h3 className="notifications-empty-title">No notifications found</h3>
              <p className="notifications-empty-desc">
                {searchQuery
                  ? `No notifications match "${searchQuery}". Try searching with another keyword.`
                  : activeTab === 'UNREAD'
                    ? "You have no unread notifications. You're completely up to date!"
                    : 'You currently have no new activity or updates on file.'}
              </p>
              {searchQuery && (
                <button
                  type="button"
                  className="notifications-clear-pill-btn"
                  onClick={() => setSearchQuery('')}
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="notifications-list-container">
              {filteredList.map((notif) => {
                const isUnread = !notif.isRead;
                return (
                  <div 
                    key={notif.id}
                    className={`notification-row-card ${isUnread ? 'is-unread' : 'is-read'}`}
                  >
                    {/* Left Icon */}
                    <div className="notif-row-left">
                      {renderIconBox(notif.type)}
                    </div>

                    {/* Middle Content */}
                    <div className="notif-row-center">
                      <div className="notif-row-header-line">
                        <h4 className="notif-row-title">{notif.title}</h4>
                        <div className="notif-row-badges">
                          {renderCategoryBadge(notif.category, notif.type)}
                          {isUnread && (
                            <span className="unread-dot-badge">
                              <span className="unread-dot" />
                              <span>New</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="notif-row-message">{notif.message}</p>

                      <div className="notif-row-footer-line">
                        <div className="notif-row-time">
                          <Clock size={12} className="time-icon" />
                          <span>{notif.formattedDate}</span>
                        </div>

                        {notif.orderId && (
                          <button
                            type="button"
                            className="btn-card-action"
                            onClick={() => onActionClick && onActionClick(notif)}
                            title={`View details for ${formatOrderId(notif.orderId)}`}
                          >
                            <span className="font-mono font-bold">{formatOrderId(notif.orderId)}</span>
                            <ArrowRight size={12} className="btn-arrow" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Right Action / Status */}
                    <div className="notif-row-right">
                      {isUnread ? (
                        <button
                          type="button"
                          className="btn-mark-single-read"
                          onClick={(e) => onMarkRead && onMarkRead(notif.id, e)}
                          title="Mark as read"
                        >
                          <Check size={12} strokeWidth={3} />
                          <span>Mark Read</span>
                        </button>
                      ) : (
                        <span className="read-status-badge">
                          <Check size={12} strokeWidth={2.5} />
                          <span>Read</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Scoped CSS Styles matching Customer Portal */}
      <style>{`
        .notifications-portal-page {
          width: 100%;
        }

        .notifications-header-row {
          margin-bottom: 24px;
        }

        .notifications-page-title {
          font-size: 1.85rem;
          font-weight: 800;
          color: #1E1B4B;
          margin: 0;
          letter-spacing: -0.025em;
          line-height: 1.2;
        }

        .notifications-page-subtitle {
          font-size: 0.875rem;
          color: #64748B;
          margin-top: 4px;
          margin-bottom: 0;
        }

        .customer-notifications-card {
          background: #ffffff;
          border: 1.5px solid #E2E8F0;
          border-radius: 18px;
          padding: 22px 26px;
          box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05);
          width: 100%;
          min-height: 520px;
          box-sizing: border-box;
        }

        .notifications-card-header {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding-bottom: 20px;
          border-bottom: 1.5px solid #F1F5F9;
        }

        .notifications-title-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .notifications-icon-circle {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: #E8FAF6;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0D7A75;
          flex-shrink: 0;
        }

        .notifications-card-heading {
          font-size: 1.15rem;
          font-weight: 700;
          color: #0F172A;
          letter-spacing: -0.01em;
          margin: 0;
        }

        .notifications-card-controls-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          width: 100%;
        }

        .notifications-count-pill {
          height: 34px;
          padding: 0 14px;
          background: #E8FAF6;
          color: #0D7A75;
          border: 1px solid #BCEAE6;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          box-sizing: border-box;
          white-space: nowrap;
        }

        .notifications-unread-pill {
          height: 34px;
          padding: 0 12px;
          background: #FFF7ED;
          color: #C2410C;
          border: 1px solid #FFEDD5;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          box-sizing: border-box;
          white-space: nowrap;
        }

        .refresh-notifications-btn {
          height: 34px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 0 14px;
          border-radius: 999px;
          border: 1.5px solid #CBD5E1;
          background: #ffffff;
          color: #334155;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-sizing: border-box;
          white-space: nowrap;
        }

        .refresh-notifications-btn:hover:not(:disabled) {
          background: #F8FAFC;
          color: #0D7A75;
          border-color: #0D7A75;
        }

        .refresh-notifications-btn:disabled {
          cursor: not-allowed;
          opacity: 0.75;
        }

        .refresh-notifications-btn.loading {
          border-color: #0D7A75;
          background: #F4FBFA;
          color: #0D7A75;
        }

        .refresh-notifications-btn.success {
          border-color: #16A34A;
          background: #F0FDF4;
          color: #16A34A;
        }

        .btn-mark-all-read {
          height: 34px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 0 14px;
          border-radius: 999px;
          border: 1.5px solid #0D7A75;
          background: #ffffff;
          color: #0D7A75;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
          box-sizing: border-box;
          white-space: nowrap;
        }

        .btn-mark-all-read:hover {
          background: #0D7A75;
          color: #ffffff;
        }

        .notifications-search-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          height: 34px;
          width: 250px;
          box-sizing: border-box;
        }

        @media (max-width: 768px) {
          .notifications-search-wrapper {
            width: 100%;
          }
        }

        .notifications-search-icon {
          position: absolute;
          left: 12px;
          color: #94A3B8;
          pointer-events: none;
        }

        .notifications-search-input {
          height: 34px;
          width: 100%;
          padding: 0 30px 0 34px;
          border-radius: 999px;
          border: 1.5px solid #CBD5E1;
          background: #FAFCFC;
          color: #0F172A;
          font-size: 0.8125rem;
          font-weight: 500;
          outline: none;
          box-sizing: border-box;
          transition: all 0.2s ease;
        }

        .notifications-search-input::placeholder {
          color: #94A3B8;
          font-weight: 400;
        }

        .notifications-search-input:focus {
          background: #FFFFFF;
          border-color: #0D7A75;
          box-shadow: 0 0 0 3px rgba(13, 122, 117, 0.12);
        }

        .notifications-search-clear-btn {
          position: absolute;
          right: 10px;
          background: none;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2px;
          border-radius: 50%;
          transition: color 0.15s ease, background 0.15s ease;
        }

        .notifications-search-clear-btn:hover {
          color: #0F172A;
          background: #E2E8F0;
        }

        .notif-filter-tabs {
          height: 34px;
          display: inline-flex;
          align-items: center;
          background: #F1F5F9;
          border: 1px solid #E2E8F0;
          border-radius: 999px;
          padding: 2px 4px;
          gap: 2px;
          box-sizing: border-box;
        }

        .notif-tab-btn {
          height: 28px;
          padding: 0 12px;
          border-radius: 999px;
          border: none;
          background: transparent;
          color: #64748B;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
          transition: all 0.15s ease;
        }

        .notif-tab-btn:hover {
          color: #0F172A;
        }

        .notif-tab-btn.active {
          background: #ffffff;
          color: #0D7A75;
          font-weight: 700;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }

        .notifications-content-container {
          width: 100%;
          margin-top: 8px;
        }

        .notifications-list-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
          margin-top: 14px;
        }

        .notification-row-card {
          background: #ffffff;
          border: 1.5px solid #E2E8F0;
          border-radius: 12px;
          padding: 16px 20px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          width: 100%;
          box-sizing: border-box;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.02);
        }

        .notification-row-card:hover {
          border-color: #CBD5E1;
          box-shadow: 0 6px 18px rgba(13, 122, 117, 0.07);
          transform: translateY(-1px);
        }

        .notification-row-card.is-unread {
          background: #FAFDFD;
          border-color: #BCEAE6;
          box-shadow: 0 3px 12px rgba(13, 122, 117, 0.06);
        }

        .notification-row-card.is-unread::before {
          content: '';
          position: absolute;
          top: 14px;
          left: 0;
          bottom: 14px;
          width: 4px;
          background: #0D7A75;
          border-top-right-radius: 4px;
          border-bottom-right-radius: 4px;
        }

        .notif-row-left {
          flex-shrink: 0;
          padding-top: 2px;
        }

        .notif-row-center {
          flex: 1 1 auto;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .notif-row-header-line {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .notif-row-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #0F172A;
          margin: 0;
          line-height: 1.3;
          letter-spacing: -0.01em;
        }

        .notif-row-badges {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .notif-row-message {
          font-size: 0.835rem;
          color: #475569;
          line-height: 1.45;
          margin: 0;
          font-weight: 450;
        }

        .notif-row-footer-line {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-top: 4px;
          flex-wrap: wrap;
        }

        .notif-row-time {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #64748B;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .btn-card-action {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: #F0FDFB;
          color: #0D7A75;
          border: 1px solid #CCFBF1;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-card-action:hover {
          background: #0D7A75;
          color: #FFFFFF;
          border-color: #0D7A75;
        }

        .notif-row-right {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding-top: 2px;
        }

        .notif-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 700;
          white-space: nowrap;
        }

        .notif-pill-rescheduled {
          background: #F3E8FF;
          color: #7E22CE;
          border: 1px solid #E9D5FF;
        }

        .notif-pill-pickup {
          background: #EFF6FF;
          color: #1D4ED8;
          border: 1px solid #DBEAFE;
        }

        .notif-pill-delivery {
          background: #FFF7ED;
          color: #EA580C;
          border: 1px solid #FFEDD5;
        }

        .notif-pill-completed {
          background: #E6FBF2;
          color: #059669;
          border: 1px solid #A7F3D0;
        }

        .notif-pill-payment {
          background: #EDF4FF;
          color: #2563EB;
          border: 1px solid #DBEAFE;
        }

        .notif-pill-processing {
          background: #F0FDFA;
          color: #0D7A75;
          border: 1px solid #CCFBF1;
        }

        .notif-pill-default {
          background: #F1F5F9;
          color: #475569;
          border: 1px solid #E2E8F0;
        }

        .unread-dot-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.7rem;
          font-weight: 700;
          color: #0D7A75;
          background: #E8FAF6;
          padding: 2px 8px;
          border-radius: 999px;
        }

        .unread-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #0D7A75;
          animation: pulseDot 1.8s infinite;
        }

        @keyframes pulseDot {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.4;
            transform: scale(0.85);
          }
        }

        .btn-mark-single-read {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 5px 12px;
          border-radius: 6px;
          border: 1px solid #CBD5E1;
          background: #ffffff;
          color: #475569;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-mark-single-read:hover {
          background: #0D7A75;
          color: #ffffff;
          border-color: #0D7A75;
        }

        .read-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #94A3B8;
        }

        .notif-icon-box {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .notif-icon-rescheduled {
          background: #F3E8FF;
          color: #7E22CE;
        }

        .notif-icon-pickup {
          background: #EFF6FF;
          color: #1D4ED8;
        }

        .notif-icon-delivery {
          background: #FFF7ED;
          color: #EA580C;
        }

        .notif-icon-completed {
          background: #E6FBF2;
          color: #059669;
        }

        .notif-icon-payment {
          background: #EDF4FF;
          color: #2563EB;
        }

        .notif-icon-processing {
          background: #E8FAF6;
          color: #0D7A75;
        }

        .notif-icon-default {
          background: #F1F5F9;
          color: #475569;
        }

        .notifications-state-box {
          padding: 60px 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .notifications-empty-circle {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #F8FAFC;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
        }

        .notifications-empty-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: #1E293B;
          margin: 0 0 6px 0;
        }

        .notifications-empty-desc {
          font-size: 0.85rem;
          color: #64748B;
          max-width: 440px;
          margin: 0 0 16px 0;
          line-height: 1.45;
        }

        .notifications-clear-pill-btn {
          height: 32px;
          padding: 0 16px;
          border-radius: 999px;
          background: #F1F5F9;
          border: 1px solid #CBD5E1;
          color: #334155;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .notifications-clear-pill-btn:hover {
          background: #E2E8F0;
          color: #0F172A;
        }

        @media (max-width: 640px) {
          .notification-row-card {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }

          .notif-row-right {
            align-self: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationsPageView;
