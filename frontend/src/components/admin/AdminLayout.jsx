import React, { useState, useRef, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { useBooking } from '../../context/BookingContext';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Package, 
  Truck, 
  Users, 
  Tag, 
  FileText, 
  Settings, 
  LogOut, 
  Search, 
  Bell, 
  ChevronDown,
  CheckCircle2,
  ShoppingBag,
  CreditCard,
  Menu,
  X,
  Globe
} from 'lucide-react';

export const AdminLayout = ({ children }) => {
  const { 
    adminTab, 
    setAdminTab, 
    setIsAdminAuthenticated, 
    settings,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    unreadNotificationsCount 
  } = useAdmin();
  const { navigateTo } = useBooking();
  const { userProfile, currentUser, logout } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const unreadNotifsCount = unreadNotificationsCount || 0;

  // Close dropdowns when clicking anywhere outside on the page or pressing Escape
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setNotifDropdownOpen(false);
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleAdminLogout = async () => {
    setIsAdminAuthenticated(false);
    setAdminTab('login');
    setProfileDropdownOpen(false);
    setNotifDropdownOpen(false);
    await logout();
    navigateTo('home');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'orders', label: 'Orders', icon: <Package size={20} />, hasBadge: true },
    { id: 'pickup-delivery', label: 'Pickup & Delivery', icon: <Truck size={20} /> },
    { id: 'customers', label: 'Customers', icon: <Users size={20} /> },
    { id: 'services', label: 'Services & Pricing', icon: <Tag size={20} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={20} />, badgeCount: unreadNotifsCount },
    { id: 'content', label: 'Content', icon: <FileText size={20} /> },
  ];

  return (
    <div className="admin-root-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${mobileSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="admin-brand-logo" onClick={() => setAdminTab('dashboard')}>
            <span className="logo-text">Fabri<span className="logo-accent">Care</span></span>
          </div>
          <button 
            className="mobile-sidebar-close"
            onClick={() => setMobileSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="admin-nav-menu">
          {navItems.map(item => {
            const isActive = adminTab === item.id;
            return (
              <button
                key={item.id}
                className={`admin-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setAdminTab(item.id);
                  setMobileSidebarOpen(false);
                }}
              >
                <span className="nav-item-icon">{item.icon}</span>
                <span className="nav-item-label">{item.label}</span>
                {item.badgeCount > 0 ? (
                  <span className="nav-count-badge">{item.badgeCount}</span>
                ) : (
                  item.hasBadge && <span className="nav-dot-badge" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer-menu">
          <button
            className={`admin-nav-item ${adminTab === 'settings' ? 'active' : ''}`}
            onClick={() => {
              setAdminTab('settings');
              setMobileSidebarOpen(false);
            }}
          >
            <span className="nav-item-icon"><Settings size={20} /></span>
            <span className="nav-item-label">Settings</span>
          </button>

          <button
            className="admin-nav-item logout-btn"
            onClick={handleAdminLogout}
          >
            <span className="nav-item-icon"><LogOut size={20} /></span>
            <span className="nav-item-label">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="admin-main-wrapper">
        {/* Top Header */}
        <header className="admin-topbar">
          <div className="topbar-left">
            <button 
              className="mobile-sidebar-toggle"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu size={22} />
            </button>
            
            <div className="admin-search-box">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="Search orders, customers, or services..." 
                className="admin-search-input"
              />
            </div>
          </div>

          <div className="topbar-right">
            {/* Notification Bell with Dropdown */}
            <div className="admin-notif-wrapper" ref={notifRef}>
              <button 
                type="button"
                className={`notification-bell-btn ${notifDropdownOpen ? 'active' : ''}`}
                onClick={() => {
                  setNotifDropdownOpen(prev => !prev);
                  setProfileDropdownOpen(false);
                }}
                aria-label="View notifications"
              >
                <Bell size={20} />
                {unreadNotifsCount > 0 && <span className="notif-badge" />}
              </button>

              {notifDropdownOpen && (
                <div className="notification-dropdown-menu animate-fade-in">
                  <div className="notif-dropdown-header">
                    <div className="notif-header-title-wrap">
                      <h4 className="notif-header-title">Notifications</h4>
                      {unreadNotifsCount > 0 && (
                        <span className="notif-badge-pill">{unreadNotifsCount} New</span>
                      )}
                    </div>
                    {unreadNotifsCount > 0 && (
                      <button 
                        type="button" 
                        className="notif-mark-read-btn"
                        onClick={markAllNotificationsAsRead}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="notif-items-list">
                    {(notifications || []).slice(0, 5).map((notif) => (
                      <div 
                        key={notif.id}
                        className={`notif-item ${notif.unread ? 'unread' : ''}`}
                        onClick={() => {
                          markNotificationAsRead(notif.id);
                          if (notif.actionTab) {
                            setAdminTab(notif.actionTab);
                            setNotifDropdownOpen(false);
                          }
                        }}
                      >
                        <div className={`notif-item-icon ${notif.type}`}>
                          {notif.type === 'order' && <ShoppingBag size={16} />}
                          {notif.type === 'driver' && <Truck size={16} />}
                          {notif.type === 'delivery' && <CheckCircle2 size={16} />}
                          {notif.type === 'payment' && <CreditCard size={16} />}
                          {notif.type === 'customer' && <Users size={16} />}
                          {notif.type === 'system' && <Bell size={16} />}
                        </div>
                        <div className="notif-item-content">
                          <p className="notif-item-title">{notif.title}</p>
                          <p className="notif-item-desc">{notif.desc}</p>
                          <span className="notif-item-time">{notif.time}</span>
                        </div>
                        {notif.unread && <span className="notif-unread-dot" />}
                      </div>
                    ))}
                  </div>

                  <div className="notif-dropdown-footer">
                    <button 
                      type="button"
                      className="notif-view-all-link"
                      onClick={() => {
                        setAdminTab('notifications');
                        setNotifDropdownOpen(false);
                      }}
                    >
                      View All Notifications ({(notifications || []).length}) →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Admin Profile Pill with Dropdown */}
            <div className="admin-profile-pill-wrapper" ref={profileRef}>
              <button 
                type="button"
                className="admin-profile-pill"
                onClick={() => {
                  setProfileDropdownOpen(prev => !prev);
                  setNotifDropdownOpen(false);
                }}
                aria-expanded={profileDropdownOpen}
                aria-haspopup="true"
              >
                <div className="admin-avatar">
                  {(settings?.name || userProfile?.displayName || currentUser?.displayName || 'A').substring(0, 1).toUpperCase()}
                </div>
                <div className="admin-user-info">
                  <span className="admin-name">{settings?.name || userProfile?.displayName || currentUser?.displayName || 'Admin'}</span>
                  <span className="admin-org">FabriCare</span>
                </div>
                <ChevronDown size={14} className={`profile-chevron ${profileDropdownOpen ? 'rotated' : ''}`} />
              </button>

              {profileDropdownOpen && (
                <div className="profile-dropdown-menu animate-fade-in">
                  <div className="dropdown-header">
                    <strong>{settings?.name || userProfile?.displayName || currentUser?.displayName || 'Admin'}</strong>
                    <span>{settings?.email || currentUser?.email || 'admin@fabricare.com'}</span>
                  </div>
                  <div className="dropdown-divider" />
                  <button 
                    type="button"
                    className="dropdown-item"
                    onClick={() => { setAdminTab('dashboard'); setProfileDropdownOpen(false); }}
                  >
                    <LayoutDashboard size={15} style={{ marginRight: 8 }} />
                    Dashboard
                  </button>
                  <button 
                    type="button"
                    className="dropdown-item"
                    onClick={() => { setAdminTab('orders'); setProfileDropdownOpen(false); }}
                  >
                    <Package size={15} style={{ marginRight: 8 }} />
                    Orders
                  </button>
                  <button 
                    type="button"
                    className="dropdown-item"
                    onClick={() => { setAdminTab('notifications'); setProfileDropdownOpen(false); }}
                  >
                    <Bell size={15} style={{ marginRight: 8 }} />
                    Notifications
                    {unreadNotifsCount > 0 && (
                      <span className="profile-drop-badge">{unreadNotifsCount}</span>
                    )}
                  </button>
                  <button 
                    type="button"
                    className="dropdown-item"
                    onClick={() => { setAdminTab('settings'); setProfileDropdownOpen(false); }}
                  >
                    <Settings size={15} style={{ marginRight: 8 }} />
                    Account Settings
                  </button>
                  <div className="dropdown-divider" />
                  <button 
                    type="button"
                    className="dropdown-item text-danger"
                    onClick={handleAdminLogout}
                  >
                    <LogOut size={15} style={{ marginRight: 8 }} />
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Page View */}
        <main className="admin-page-body">
          {children}
        </main>
      </div>

      <style>{`
        .admin-root-layout {
          display: flex;
          min-height: 100vh;
          background-color: #F8FBFC;
          color: #1E293B;
          font-family: var(--font-family);
        }

        /* SIDEBAR */
        .admin-sidebar {
          width: 260px;
          background: #FFFFFF;
          border-right: 1px solid #E2E8F0;
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
          height: 100vh;
          z-index: 100;
          flex-shrink: 0;
        }

        .sidebar-header {
          padding: 24px 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .admin-brand-logo {
          cursor: pointer;
        }

        .admin-brand-logo .logo-text {
          font-family: 'Poppins', sans-serif;
          font-size: 1.625rem;
          font-weight: 800;
          color: #000000;
          letter-spacing: -0.02em;
        }

        .admin-brand-logo .logo-accent {
          color: #087F8C;
        }

        .mobile-sidebar-close {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          color: #64748B;
        }

        .admin-nav-menu {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 12px 16px;
          flex: 1;
        }

        .admin-nav-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 16px;
          border-radius: 12px;
          border: none;
          background: transparent;
          color: #64748B;
          font-size: 0.9375rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          text-align: left;
          width: 100%;
        }

        .admin-nav-item:hover {
          background: #F1F5F9;
          color: #1E293B;
        }

        .admin-nav-item.active {
          background: #EBF8F7;
          color: #0D7A75;
          font-weight: 700;
        }

        .nav-item-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .nav-dot-badge {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #FF6B50;
          margin-left: auto;
        }

        .nav-count-badge {
          font-size: 11px;
          font-weight: 700;
          background: #007E8A;
          color: #FFFFFF;
          padding: 1px 7px;
          border-radius: 9999px;
          margin-left: auto;
          line-height: 1.4;
        }

        .profile-drop-badge {
          font-size: 10px;
          font-weight: 700;
          background: #007E8A;
          color: #FFFFFF;
          padding: 1px 6px;
          border-radius: 9999px;
          margin-left: auto;
          line-height: 1.3;
        }

        .sidebar-footer-menu {
          padding: 16px;
          border-top: 1px solid #F1F5F9;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .logout-btn:hover {
          color: #EF4444;
        }

        /* MAIN WRAPPER */
        .admin-main-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          background: #F8FBFC;
        }

        .admin-topbar {
          height: 72px;
          background: #FFFFFF;
          border-bottom: 1px solid #E2E8F0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          position: sticky;
          top: 0;
          z-index: 90;
        }

        .topbar-left {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
          max-width: 520px;
        }

        .mobile-sidebar-toggle {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          color: #475569;
          padding: 4px;
        }

        .admin-search-box {
          position: relative;
          width: 100%;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 14px;
          color: #94A3B8;
        }

        .admin-search-input {
          width: 100%;
          padding: 10px 16px 10px 42px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          font-size: 0.875rem;
          color: #1E293B;
          outline: none;
          transition: all 0.2s;
        }

        .admin-search-input:focus {
          border-color: #0D7A75;
          background: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(13, 122, 117, 0.1);
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        /* NOTIFICATION BELL & DROPDOWN */
        .admin-notif-wrapper {
          position: relative;
        }

        .notification-bell-btn {
          position: relative;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: 1px solid #E2E8F0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748B;
          cursor: pointer;
          background: #FFFFFF;
          transition: all 0.2s ease;
          padding: 0;
        }

        .notification-bell-btn:hover,
        .notification-bell-btn.active {
          background: #F8FAFC;
          border-color: #CBD5E1;
          color: #1E293B;
        }

        .notif-badge {
          position: absolute;
          top: 9px;
          right: 10px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #EF4444;
          border: 2px solid #FFFFFF;
        }

        .notification-dropdown-menu {
          position: absolute;
          top: calc(100% + 10px);
          right: -10px;
          width: 360px;
          max-width: 90vw;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          box-shadow: 0 15px 35px -5px rgba(15, 23, 42, 0.14), 0 0 1px 1px rgba(0, 0, 0, 0.04);
          z-index: 1000;
          overflow: hidden;
          animation: adminMenuDrop 0.18s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes adminMenuDrop {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .notif-dropdown-header {
          padding: 14px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #F1F5F9;
          background: #FFFFFF;
        }

        .notif-header-title-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .notif-header-title {
          font-size: 14.5px;
          font-weight: 700;
          color: #0F172A;
          margin: 0;
        }

        .notif-badge-pill {
          background: #E6F7F5;
          color: #007E8A;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 9999px;
        }

        .notif-mark-read-btn {
          background: none;
          border: none;
          color: #007E8A;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          padding: 4px 6px;
          border-radius: 4px;
        }

        .notif-mark-read-btn:hover {
          background: #F1F5F9;
        }

        .notif-items-list {
          max-height: 320px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }

        .notif-item {
          padding: 12px 18px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          border-bottom: 1px solid #F8FAFC;
          cursor: pointer;
          transition: background 0.15s ease;
          position: relative;
        }

        .notif-item:hover {
          background: #F8FAFC;
        }

        .notif-item.unread {
          background: #FAFEFD;
        }

        .notif-item-icon {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .notif-item-icon.order {
          background: #E6F7F5;
          color: #007E8A;
        }

        .notif-item-icon.driver {
          background: #EFF6FF;
          color: #2563EB;
        }

        .notif-item-icon.delivery {
          background: #ECFDF5;
          color: #059669;
        }

        .notif-item-icon.payment {
          background: #FEF3C7;
          color: #D97706;
        }

        .notif-item-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .notif-item-title {
          font-size: 13px;
          font-weight: 600;
          color: #1E293B;
          margin: 0;
        }

        .notif-item-desc {
          font-size: 12px;
          color: #64748B;
          margin: 0;
          line-height: 1.35;
        }

        .notif-item-time {
          font-size: 11px;
          color: #94A3B8;
          margin-top: 3px;
        }

        .notif-unread-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #007E8A;
          flex-shrink: 0;
          margin-top: 6px;
        }

        .notif-dropdown-footer {
          padding: 10px 18px;
          border-top: 1px solid #F1F5F9;
          background: #FAFCFD;
          text-align: center;
        }

        .notif-view-all-link {
          background: none;
          border: none;
          color: #007E8A;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          width: 100%;
          padding: 4px;
        }

        .notif-view-all-link:hover {
          text-decoration: underline;
        }

        /* ADMIN PROFILE PILL & DROPDOWN */
        .admin-profile-pill-wrapper {
          position: relative;
        }

        .admin-profile-pill {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 5px 12px 5px 5px;
          border-radius: 9999px;
          border: 1px solid #E2E8F0;
          background: #FFFFFF;
          cursor: pointer;
          user-select: none;
          transition: all 0.2s ease;
          font-family: inherit;
          text-align: left;
        }

        .admin-profile-pill:hover {
          background: #F8FAFC;
          border-color: #CBD5E1;
        }

        .admin-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #007E8A;
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.9375rem;
        }

        .admin-user-info {
          display: flex;
          flex-direction: column;
          line-height: 1.2;
        }

        .admin-name {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #1E293B;
        }

        .admin-org {
          font-size: 0.75rem;
          color: #94A3B8;
        }

        .profile-chevron {
          color: #94A3B8;
          transition: transform 0.2s ease;
        }

        .profile-chevron.rotated {
          transform: rotate(180deg);
        }

        .profile-dropdown-menu {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          width: 220px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          box-shadow: 0 15px 35px -5px rgba(15, 23, 42, 0.14), 0 0 1px 1px rgba(0, 0, 0, 0.04);
          padding: 6px;
          z-index: 1000;
          animation: adminMenuDrop 0.18s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .dropdown-header {
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          font-size: 0.8125rem;
        }

        .dropdown-header strong {
          color: #0F172A;
          font-size: 13.5px;
        }

        .dropdown-header span {
          font-size: 0.75rem;
          color: #94A3B8;
          margin-top: 2px;
        }

        .dropdown-divider {
          height: 1px;
          background: #F1F5F9;
          margin: 4px 0;
        }

        .dropdown-item {
          width: 100%;
          text-align: left;
          padding: 9px 12px;
          background: none;
          border: none;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #334155;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: background 0.15s ease, color 0.15s ease;
          font-family: inherit;
        }

        .dropdown-item:hover {
          background: #F1F5F9;
          color: #0F172A;
        }

        .dropdown-item.text-danger {
          color: #EF4444;
        }

        .dropdown-item.text-danger:hover {
          background: #FEE2E2;
          color: #DC2626;
        }

        .admin-page-body {
          padding: 32px;
          flex: 1;
        }

        @media (max-width: 1024px) {
          .admin-sidebar {
            position: fixed;
            left: -260px;
            transition: left 0.3s ease;
          }
          .admin-sidebar.open {
            left: 0;
          }
          .mobile-sidebar-toggle {
            display: flex;
          }
          .mobile-sidebar-close {
            display: block;
          }
          .admin-page-body {
            padding: 20px 16px;
          }
          .admin-topbar {
            padding: 0 16px;
          }
        }
      `}</style>
    </div>
  );
};
