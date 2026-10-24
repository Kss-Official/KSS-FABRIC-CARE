import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Truck, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  Package, 
  ArrowRight,
  Box
} from 'lucide-react';
import { formatOrderId } from '../../utils/helpers';

/**
 * Shared Notification Bell & Dropdown Component
 * Replicates the Customer Portal topbar notification dropdown across all portals (Staff, Delivery, Admin, Customer).
 */
export const NotificationBellDropdown = ({
  unreadCount = 0,
  notifications = [],
  onMarkRead,
  onMarkAllRead,
  onItemClick,
  onViewAll,
  portalName = 'Operations'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown on outside click or escape key
  useEffect(() => {
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(prev => !prev);
  };

  const handleItemClick = (notif) => {
    // Close the dropdown first, then delegate all logic (mark-read + navigation)
    // to the parent via onItemClick. The parent is responsible for marking read
    // to avoid double-writes to Firebase.
    setIsOpen(false);
    if (onItemClick) {
      onItemClick(notif);
    } else {
      // Fallback: mark read locally and navigate via onViewAll
      if (!notif.isRead && onMarkRead) {
        onMarkRead(notif.id);
      }
      if (onViewAll) {
        onViewAll();
      }
    }
  };

  const handleMarkAll = async (e) => {
    if (e) e.stopPropagation();
    if (onMarkAllRead) {
      await onMarkAllRead();
    }
  };

  const renderIcon = (notif) => {
    const t = String(notif.type || '').toLowerCase();
    const c = String(notif.category || '').toLowerCase();
    const title = String(notif.title || '').toLowerCase();

    if (t.includes('delivery') || c.includes('delivery') || title.includes('delivery')) {
      return (
        <div className="shared-notif-icon-box" style={{ background: '#EFF6FF', color: '#2563EB' }}>
          <Truck size={14} />
        </div>
      );
    }
    if (t.includes('pickup') || c.includes('pickup')) {
      return (
        <div className="shared-notif-icon-box" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>
          <Box size={14} />
        </div>
      );
    }
    if (t.includes('completed') || t.includes('delivered') || c.includes('delivered') || c.includes('completed')) {
      return (
        <div className="shared-notif-icon-box" style={{ background: '#ECFDF5', color: '#059669' }}>
          <CheckCircle2 size={14} />
        </div>
      );
    }
    if (t.includes('rescheduled') || c.includes('rescheduled')) {
      return (
        <div className="shared-notif-icon-box" style={{ background: '#FFFBEB', color: '#D97706' }}>
          <Clock size={14} />
        </div>
      );
    }
    if (t.includes('payment') || c.includes('payment')) {
      return (
        <div className="shared-notif-icon-box" style={{ background: '#F0FDF4', color: '#16A34A' }}>
          <CreditCard size={14} />
        </div>
      );
    }
    if (t.includes('order') || c.includes('order')) {
      return (
        <div className="shared-notif-icon-box" style={{ background: '#F0FDFB', color: '#0D7A75' }}>
          <Package size={14} />
        </div>
      );
    }
    if (t.includes('processing') || t.includes('wash') || t.includes('iron') || t.includes('hub') || t.includes('garment')) {
      return (
        <div className="shared-notif-icon-box" style={{ background: '#F0FDFB', color: '#0D7A75' }}>
          <Package size={14} />
        </div>
      );
    }
    return (
      <div className="shared-notif-icon-box" style={{ background: '#F0FDFB', color: '#0D7A75' }}>
        <Bell size={14} />
      </div>
    );
  };

  return (
    <div className="shared-notif-wrapper" ref={containerRef}>
      {/* Bell Button */}
      <button
        type="button"
        className={`shared-notif-bell-btn ${isOpen ? 'active' : ''}`}
        onClick={handleToggle}
        title="Notifications"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="shared-notif-badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu (Exact match with Customer Portal Navbar) */}
      {isOpen && (
        <div className="shared-notif-dropdown" onClick={(e) => e.stopPropagation()}>
          <div className="shared-notif-dropdown-header">
            <div className="shared-notif-title-group">
              <span className="shared-notif-dropdown-title">Notifications</span>
              {unreadCount > 0 ? (
                <span className="shared-notif-unread-pill">{unreadCount} new</span>
              ) : (
                <span className="shared-notif-caught-up-pill">All caught up</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button 
                type="button"
                className="shared-notif-mark-all-btn"
                onClick={handleMarkAll}
                title="Mark all as read"
              >
                <CheckCheck size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: -1 }} />
                Mark all read
              </button>
            )}
          </div>

          <div className="shared-notif-dropdown-list">
            {notifications.length === 0 ? (
              <div className="shared-notif-dropdown-empty">
                <div className="shared-notif-empty-icon-circle">
                  <Bell size={22} />
                </div>
                <p className="shared-notif-empty-title">No notifications yet</p>
                <p className="shared-notif-empty-sub">You're all caught up with your orders and alerts.</p>
              </div>
            ) : (
              notifications.slice(0, 8).map((notif) => {
                const isUnread = notif.unread !== undefined ? Boolean(notif.unread) : !notif.isRead;
                const rawBadge = notif.orderCode || notif.orderId;
                let displayBadge = '';
                if (rawBadge) {
                  const str = String(rawBadge).trim();
                  if (str.startsWith('-') || str.startsWith('#-')) {
                    const m = String(notif.message || notif.body || '').match(/FC-\d{5}/i) || String(notif.title || '').match(/FC-\d{5}/i);
                    displayBadge = m ? m[0].toUpperCase() : formatOrderId(str);
                  } else {
                    displayBadge = formatOrderId(str);
                  }
                }

                return (
                  <div
                    key={notif.id}
                    className={`shared-notif-dropdown-item ${isUnread ? 'unread' : ''}`}
                    onClick={() => handleItemClick(notif)}
                  >
                    {renderIcon(notif)}
                    <div className="shared-notif-item-content">
                      <div className="shared-notif-item-header">
                        <h4 className="shared-notif-item-title">{notif.title}</h4>
                        {isUnread && <span className="shared-notif-unread-dot" />}
                      </div>
                    <p className="shared-notif-item-desc">{notif.message || notif.body || notif.desc}</p>
                    <div className="shared-notif-item-meta">
                      <span className="shared-notif-item-time">{notif.formattedDate || notif.time || 'Recent'}</span>
                      {displayBadge && (
                        <span className="shared-notif-order-badge">
                          {displayBadge}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

          <div className="shared-notif-dropdown-footer">
            <button
              type="button"
              className="shared-notif-footer-btn"
              onClick={() => {
                setIsOpen(false);
                if (onViewAll) onViewAll();
              }}
            >
              <span>View All Notifications</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Scoped CSS replicating Customer Portal Navbar dropdown */}
      <style>{`
        .shared-notif-wrapper {
          position: relative;
          display: inline-flex;
          align-items: center;
        }

        .shared-notif-bell-btn {
          position: relative;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1px solid #E2E8F0;
          background: #FFFFFF;
          color: #475569;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
          flex-shrink: 0;
          padding: 0;
        }

        .shared-notif-bell-btn:hover,
        .shared-notif-bell-btn.active {
          background: #F8FAFC;
          border-color: #0D7A75;
          color: #0D7A75;
        }

        .shared-notif-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          background: #EF4444;
          color: #FFFFFF;
          font-size: 0.625rem;
          font-weight: 800;
          border-radius: 9999px;
          min-width: 17px;
          height: 17px;
          padding: 0 3px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
          border: 2px solid #FFFFFF;
          line-height: 1;
        }

        .shared-notif-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: -10px;
          width: 370px;
          max-width: calc(100vw - 24px);
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          box-shadow: 0 16px 36px -6px rgba(15, 23, 42, 0.16), 0 4px 12px rgba(15, 23, 42, 0.06);
          z-index: 1050;
          overflow: hidden;
          animation: sharedNotifDrop 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes sharedNotifDrop {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .shared-notif-dropdown-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-bottom: 1px solid #F1F5F9;
          background: #FFFFFF;
        }

        .shared-notif-title-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .shared-notif-dropdown-title {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #0F172A;
          margin: 0;
        }

        .shared-notif-unread-pill {
          font-size: 0.6875rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 999px;
          background: #FEF2F2;
          color: #EF4444;
        }

        .shared-notif-caught-up-pill {
          font-size: 0.6875rem;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 999px;
          background: #F0FDF4;
          color: #16A34A;
        }

        .shared-notif-mark-all-btn {
          background: none;
          border: none;
          font-size: 0.75rem;
          font-weight: 600;
          color: #0D7A75;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
        }

        .shared-notif-mark-all-btn:hover {
          background: #F0FDFB;
          color: #08615D;
        }

        .shared-notif-dropdown-list {
          max-height: 340px;
          overflow-y: auto;
          overscroll-behavior: contain;
        }

        .shared-notif-dropdown-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 16px;
          border-bottom: 1px solid #F8FAFC;
          background: #FFFFFF;
          cursor: pointer;
          transition: background 0.15s ease;
          text-align: left;
          width: 100%;
          border-left: 3px solid transparent;
          box-sizing: border-box;
        }

        .shared-notif-dropdown-item:hover {
          background: #F8FAFC;
        }

        .shared-notif-dropdown-item.unread {
          background: #F0FDFB;
          border-left-color: #0D7A75;
        }

        .shared-notif-dropdown-item.unread:hover {
          background: #E6F7F5;
        }

        .shared-notif-icon-box {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .shared-notif-item-content {
          flex: 1;
          min-width: 0;
        }

        .shared-notif-item-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          margin-bottom: 2px;
        }

        .shared-notif-item-title {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #1E293B;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .shared-notif-dropdown-item.unread .shared-notif-item-title {
          color: #0F172A;
          font-weight: 700;
        }

        .shared-notif-unread-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #0D7A75;
          flex-shrink: 0;
        }

        .shared-notif-item-desc {
          font-size: 0.75rem;
          color: #64748B;
          margin: 0 0 4px 0;
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .shared-notif-item-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.6875rem;
          color: #94A3B8;
        }

        .shared-notif-item-time {
          font-size: 0.6875rem;
          color: #94A3B8;
        }

        .shared-notif-order-badge {
          font-size: 0.6875rem;
          font-weight: 700;
          color: #0D7A75;
          background: #F0FDFB;
          padding: 1px 6px;
          border-radius: 4px;
        }

        .shared-notif-dropdown-empty {
          padding: 32px 16px;
          text-align: center;
        }

        .shared-notif-empty-icon-circle {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #F1F5F9;
          color: #94A3B8;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 8px auto;
        }

        .shared-notif-empty-title {
          margin: 0 0 4px 0;
          font-weight: 600;
          color: #334155;
          font-size: 0.875rem;
        }

        .shared-notif-empty-sub {
          margin: 0;
          font-size: 0.75rem;
          color: #94A3B8;
        }

        .shared-notif-dropdown-footer {
          padding: 10px 16px;
          border-top: 1px solid #F1F5F9;
          background: #FAFCFC;
          text-align: center;
        }

        .shared-notif-footer-btn {
          background: none;
          border: none;
          color: #0D7A75;
          font-size: 0.8125rem;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: color 0.15s ease;
        }

        .shared-notif-footer-btn:hover {
          color: #08615D;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default NotificationBellDropdown;
