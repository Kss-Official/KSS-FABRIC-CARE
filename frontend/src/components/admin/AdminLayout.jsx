import React, { useState, useRef, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { useBooking } from '../../context/BookingContext';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Home,
  Package, 
  Truck, 
  Users, 
  Tag, 
  FileText, 
  Settings, 
  LogOut, 
  Bell, 
  ChevronDown,
  CheckCircle2,
  ShoppingBag,
  CreditCard,
  Menu,
  X,
  Globe,
  RotateCcw,
  CheckCheck,
  Check,
  UserCheck,
  AlertCircle,
  HelpCircle,
  MessageSquare,
  Headphones,
  User
} from 'lucide-react';
import { NotificationBellDropdown } from '../common/NotificationBellDropdown';

export const AdminLayout = ({ children }) => {
  const { 
    adminTab, 
    setAdminTab, 
    setIsAdminAuthenticated, 
    settings,
    notifications,
    markNotificationAsRead,
    markNotificationAsUnread,
    markAllNotificationsAsRead,
    unreadNotificationsCount,
    isCreateOrderDrawerOpen,
    isAddCustomerModalOpen,
    isAddServiceModalOpen,
    isManageServicesModalOpen,
    isAssignOrderModalOpen,
    isRescheduleDrawerOpen,
    isSupportDrawerOpen
  } = useAdmin();
  const { navigateTo } = useBooking();
  const { userProfile, currentUser, logout } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [reportsMenuOpen, setReportsMenuOpen] = useState(true);

  // Dynamic profile information from settings / userProfile / currentUser
  const adminDisplayName = settings?.name || userProfile?.displayName || userProfile?.name || currentUser?.displayName || currentUser?.name || 'Admin';
  const avatarPhoto = settings?.photoUrl || userProfile?.avatarUrl || currentUser?.avatarUrl || userProfile?.photoUrl || '';
  const adminInitials = adminDisplayName
    ? adminDisplayName.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'AD';

  const isAnyModalActive = Boolean(
    isCreateOrderDrawerOpen ||
    isAddCustomerModalOpen ||
    isAddServiceModalOpen ||
    isManageServicesModalOpen ||
    isAssignOrderModalOpen ||
    isRescheduleDrawerOpen ||
    isSupportDrawerOpen
  );

  useEffect(() => {
    const mainWrapper = document.querySelector('.admin-main-wrapper');
    if (isAnyModalActive) {
      if (mainWrapper) mainWrapper.classList.add('admin-scroll-locked');
    } else {
      if (mainWrapper) mainWrapper.classList.remove('admin-scroll-locked');
    }
    return () => {
      if (mainWrapper) mainWrapper.classList.remove('admin-scroll-locked');
    };
  }, [isAnyModalActive]);

  // Lock window and document scrollbars while in Admin Portal to prevent layout shifts
  useEffect(() => {
    const origHtmlOverflow = document.documentElement.style.overflow;
    const origBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = origHtmlOverflow;
      document.body.style.overflow = origBodyOverflow;
    };
  }, []);

  // Reset scroll to top and left when switching admin tabs to prevent layout shift
  useEffect(() => {
    const mainWrapper = document.querySelector('.admin-main-wrapper');
    if (mainWrapper) {
      mainWrapper.scrollTop = 0;
      mainWrapper.scrollLeft = 0;
    }
    window.scrollTo(0, 0);
  }, [adminTab]);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const unreadNotifsCount = unreadNotificationsCount || 0;

  const handleRefreshNotifs = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
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

  // Prevent background scrolling across all Admin sections whenever any modal/drawer is open
  useEffect(() => {
    const modalSelectors = [
      '.modal-backdrop-overlay',
      '.modal-backdrop',
      '.add-service-backdrop',
      '.manage-modal-backdrop',
      '.details-modal-backdrop',
      '.drawer-backdrop',
      '.assign-order-modal-backdrop',
      '.ac-modal-backdrop',
      '.notif-modal-backdrop',
      '.cr-modal-overlay',
      '.reschedule-backdrop',
      '.support-drawer'
    ];

    const checkModalOpen = () => {
      const isModalOpen = modalSelectors.some(sel => document.querySelector(sel));
      const mainWrapper = document.querySelector('.admin-main-wrapper');
      if (isModalOpen) {
        if (mainWrapper) mainWrapper.classList.add('admin-scroll-locked');
      } else {
        if (mainWrapper) mainWrapper.classList.remove('admin-scroll-locked');
      }
    };

    checkModalOpen();
    const observer = new MutationObserver(checkModalOpen);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      const mainWrapper = document.querySelector('.admin-main-wrapper');
      if (mainWrapper) mainWrapper.classList.remove('admin-scroll-locked');
    };
  }, []);

  const handleAdminLogout = async () => {
    setIsAdminAuthenticated(false);
    setAdminTab('login');
    setProfileDropdownOpen(false);
    setNotifDropdownOpen(false);
    sessionStorage.removeItem('fabricare_intended_destination');
    await logout();
    navigateTo('login');
  };

  const getTabMeta = (tab) => {
    switch (tab) {
      case 'dashboard':
        return {
          kicker: 'CENTRAL ADMIN OPERATIONS HUB',
          title: 'Dashboard',
          subtitle: 'Track your operations, manage deliveries and keep your day on schedule.'
        };
      case 'orders':
        return {
          kicker: 'CENTRAL ADMIN OPERATIONS HUB',
          title: 'Orders',
          subtitle: 'Track, manage, and process all customer laundry orders.'
        };
      case 'users':
      case 'customers':
        return {
          kicker: 'CENTRAL ADMIN OPERATIONS HUB',
          title: 'Users',
          subtitle: 'Manage customer accounts, delivery agents, and staff members.'
        };
      case 'pickup-delivery':
      case 'deliveries':
        return {
          kicker: 'DELIVERY FIELD OPERATIONS',
          title: 'Pickup & Delivery',
          subtitle: 'Field operations, scheduled pickups, and delivery assignments.'
        };
      case 'services':
        return {
          kicker: 'CENTRAL ADMIN OPERATIONS HUB',
          title: 'Services & Pricing',
          subtitle: 'Configure laundry services, garment categories, and pricing rules.'
        };
      case 'notifications':
        return {
          kicker: 'CENTRAL ADMIN OPERATIONS HUB',
          title: 'Notifications',
          subtitle: 'System broadcasts, customer activity alerts, and order updates.'
        };
      case 'content':
        return {
          kicker: 'CENTRAL ADMIN OPERATIONS HUB',
          title: 'Content',
          subtitle: 'Manage terms, privacy policies, FAQs, and portal information.'
        };
      case 'delivery-reports':
      case 'complaints':
      case 'complaint-reports':
      case 'reports':
        return {
          kicker: 'CENTRAL ADMIN OPERATIONS HUB',
          title: 'Delivery Reports',
          subtitle: 'Review reported delivery issues, operational delays, and resolution logs.'
        };
      case 'help-support':
        return {
          kicker: 'CENTRAL ADMIN OPERATIONS HUB',
          title: 'Help & Support',
          subtitle: 'Customer assistance tickets, live inquiries, and communication logs.'
        };
      case 'settings':
      case 'my-profile':
      case 'profile':
        return {
          kicker: 'CENTRAL ADMIN OPERATIONS HUB',
          title: 'My Profile',
          subtitle: 'Manage portal preferences, business information, and account details.'
        };
      default:
        return {
          kicker: 'CENTRAL ADMIN OPERATIONS HUB',
          title: 'Dashboard',
          subtitle: 'Track your operations, manage deliveries and keep your day on schedule.'
        };
    }
  };

  const currentTabMeta = getTabMeta(adminTab);

  return (
    <div className="admin-root-layout">
      {/* Mobile Backdrop */}
      {mobileSidebarOpen && (
        <div 
          className="admin-sidebar-backdrop"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar delivery-sidebar ${mobileSidebarOpen ? 'open' : ''}`}>
        {/* Sidebar Brand Header */}
        <div className="sidebar-brand-header">
          <div className="brand-badge-row">
            <div 
              className="brand-logo-container" 
              style={{ userSelect: 'none', cursor: 'pointer' }} 
              title="FabriCare Admin Portal"
              onClick={() => {
                setAdminTab('dashboard');
                setMobileSidebarOpen(false);
              }}
            >
              <div className="brand-logo-wrapper">
                <img 
                  src="/images/fabricare-logo.png" 
                  alt="FabriCare" 
                  className="brand-logo-img"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <div className="brand-hanger-icon" style={{ display: 'none' }}>
                  <svg width="34" height="34" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="36" height="36" rx="8" fill="#14B8A6" />
                    <path d="M18 9C18 7.3 19.3 6 21 6C22.7 6 24 7.3 24 9C24 10.3 23.2 11.4 22 11.8L18 13.5V15.5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M18 15.5L9 20.5C8 21 8.5 22.5 9.5 22.5H26.5C27.5 22.5 28 21 27 20.5L18 15.5Z" stroke="#FFFFFF" strokeWidth="1.8" strokeLinejoin="round" fill="none"/>
                    <path d="M10 24C13 22 17 21 21 22.5C23.5 23.5 25.5 23 27 22C25.5 24 23 25.5 19 25.5C15 25.5 12 24.5 10 24Z" fill="#FFFFFF"/>
                    <path d="M11 26C14 24.5 17 24 20 25C22.5 26 24.5 25.5 26 24.5C24.5 26.5 22 28 18 28C14.5 28 12.5 27 11 26Z" fill="#A5F3FC"/>
                  </svg>
                </div>
              </div>
              <div className="brand-logo-text-col">
                <span className="brand-logo-text logo-text">
                  Fabri<span className="logo-accent">Care</span>
                </span>
                <span className="portal-sub-badge">ADMIN PORTAL</span>
              </div>
            </div>
          </div>
          <button 
            className="mobile-close-btn"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="admin-nav-menu sidebar-nav-menu">
          {/* Dashboard */}
          <button
            className={`admin-nav-item sidebar-nav-item ${adminTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => {
              setAdminTab('dashboard');
              setMobileSidebarOpen(false);
            }}
          >
            <span className="nav-icon nav-item-icon"><Home size={18} /></span>
            <span className="nav-label nav-item-label">Dashboard</span>
          </button>

          {/* Orders */}
          <button
            className={`admin-nav-item sidebar-nav-item ${adminTab === 'orders' ? 'active' : ''}`}
            onClick={() => {
              setAdminTab('orders');
              setMobileSidebarOpen(false);
            }}
          >
            <span className="nav-icon nav-item-icon"><Package size={18} /></span>
            <span className="nav-label nav-item-label">Orders</span>
          </button>

          {/* Users */}
          <button
            className={`admin-nav-item sidebar-nav-item ${adminTab === 'users' || adminTab === 'customers' ? 'active' : ''}`}
            onClick={() => {
              setAdminTab('users');
              setMobileSidebarOpen(false);
            }}
          >
            <span className="nav-icon nav-item-icon"><Users size={18} /></span>
            <span className="nav-label nav-item-label">Users</span>
          </button>

          {/* Pickup & Delivery */}
          <button
            className={`admin-nav-item sidebar-nav-item ${adminTab === 'pickup-delivery' || adminTab === 'deliveries' ? 'active' : ''}`}
            onClick={() => {
              setAdminTab('pickup-delivery');
              setMobileSidebarOpen(false);
            }}
          >
            <span className="nav-icon nav-item-icon"><Truck size={18} /></span>
            <span className="nav-label nav-item-label">Pickup &amp; Delivery</span>
          </button>

          {/* Services & Pricing */}
          <button
            className={`admin-nav-item sidebar-nav-item ${adminTab === 'services' ? 'active' : ''}`}
            onClick={() => {
              setAdminTab('services');
              setMobileSidebarOpen(false);
            }}
          >
            <span className="nav-icon nav-item-icon"><Tag size={18} /></span>
            <span className="nav-label nav-item-label">Services &amp; Pricing</span>
          </button>

          {/* Notifications */}
          <button
            className={`admin-nav-item sidebar-nav-item ${adminTab === 'notifications' ? 'active' : ''}`}
            onClick={() => {
              setAdminTab('notifications');
              setMobileSidebarOpen(false);
            }}
          >
            <span className="nav-icon nav-item-icon"><Bell size={18} /></span>
            <span className="nav-label nav-item-label">Notifications</span>
          </button>

          {/* Content */}
          <button
            className={`admin-nav-item sidebar-nav-item ${adminTab === 'content' ? 'active' : ''}`}
            onClick={() => {
              setAdminTab('content');
              setMobileSidebarOpen(false);
            }}
          >
            <span className="nav-icon nav-item-icon"><FileText size={18} /></span>
            <span className="nav-label nav-item-label">Content</span>
          </button>

          {/* Complaints Accordion */}
          <div className="admin-nav-group">
            <button
              type="button"
              className={`admin-nav-item sidebar-nav-item has-submenu ${['complaints', 'delivery-reports', 'help-support', 'reports', 'complaint-reports'].includes(adminTab) ? 'active' : ''}`}
              onClick={() => setReportsMenuOpen(prev => !prev)}
            >
              <span className="nav-icon nav-item-icon"><FileText size={18} /></span>
              <span className="nav-label nav-item-label">Complaints</span>
              <span className="nav-item-chevron">
                <ChevronDown size={14} className={`chevron-arrow ${reportsMenuOpen ? 'open' : ''}`} />
              </span>
            </button>

            {reportsMenuOpen && (
              <div className="admin-sub-menu">
                <button
                  type="button"
                  className={`admin-sub-item ${['delivery-reports', 'complaints', 'complaint-reports', 'reports'].includes(adminTab) ? 'active' : ''}`}
                  onClick={() => {
                    setAdminTab('delivery-reports');
                    setMobileSidebarOpen(false);
                  }}
                >
                  {['delivery-reports', 'complaints', 'complaint-reports', 'reports'].includes(adminTab) && (
                    <span className="sub-item-active-bar" />
                  )}
                  <span className="sub-item-text">Delivery Reports</span>
                </button>

                <button
                  type="button"
                  className={`admin-sub-item ${adminTab === 'help-support' ? 'active' : ''}`}
                  onClick={() => {
                    setAdminTab('help-support');
                    setMobileSidebarOpen(false);
                  }}
                >
                  {adminTab === 'help-support' && (
                    <span className="sub-item-active-bar" />
                  )}
                  <span className="sub-item-text">Help &amp; Support</span>
                </button>
              </div>
            )}
          </div>

          {/* My Profile */}
          <button
            className={`admin-nav-item sidebar-nav-item ${adminTab === 'settings' || adminTab === 'my-profile' || adminTab === 'profile' ? 'active' : ''}`}
            onClick={() => {
              setAdminTab('settings');
              setMobileSidebarOpen(false);
            }}
          >
            <span className="nav-icon nav-item-icon"><User size={18} /></span>
            <span className="nav-label nav-item-label">My Profile</span>
          </button>
        </nav>

        {/* Sidebar Footer Menu */}
        <div className="sidebar-footer-menu">
          <button
            onClick={handleAdminLogout}
            className="sidebar-logout-card-btn"
          >
            <LogOut size={18} className="text-slate-500" />
            <span className="font-semibold text-slate-700 text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className={`admin-main-wrapper ${isAnyModalActive ? 'admin-scroll-locked' : ''}`}>
        {/* Top Header */}
        <header className={`admin-topbar delivery-topbar ${adminTab !== 'dashboard' ? 'topbar-no-border' : ''}`}>
          <div className="topbar-left">
            <button 
              className="mobile-hamburger-btn mobile-sidebar-toggle"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu size={22} />
            </button>
            {adminTab === 'dashboard' && (
              <div className="topbar-title-block">
                <h1 className="topbar-heading">
                  {currentTabMeta.title}
                </h1>
                <p className="topbar-subtitle">
                  {currentTabMeta.subtitle}
                </p>
              </div>
            )}
          </div>

          <div className="topbar-right topbar-actions">
            {/* Notification Bell with Customer Portal UI Dropdown */}
            <NotificationBellDropdown
              unreadCount={unreadNotifsCount}
              notifications={Array.isArray(notifications) ? notifications : Object.values(notifications || {})}
              onMarkRead={markNotificationAsRead}
              onMarkAllRead={markAllNotificationsAsRead}
              onItemClick={() => {
                setAdminTab('notifications');
              }}
              onViewAll={() => setAdminTab('notifications')}
              portalName="Admin Central"
            />

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
                  {avatarPhoto ? (
                    <img src={avatarPhoto} alt={adminDisplayName} className="admin-avatar-img" />
                  ) : (
                    adminInitials
                  )}
                </div>
                <div className="admin-user-info">
                  <span className="admin-name">{adminDisplayName}</span>
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
                    <User size={15} style={{ marginRight: 8 }} />
                    My Profile
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
        html:has(.admin-root-layout),
        body:has(.admin-root-layout) {
          overflow: hidden !important;
          height: 100% !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        .admin-root-layout {
          display: flex;
          height: 100vh;
          height: 100dvh;
          max-height: 100vh;
          max-height: 100dvh;
          overflow: hidden;
          background-color: #F8FBFC;
          color: #1E293B;
          font-family: var(--font-family);
          width: 100%;
          margin: 0;
          padding: 0;
          overscroll-behavior: none;
          box-sizing: border-box;
          position: relative;
        }

        /* SIDEBAR - Rigid dimensions to eliminate horizontal flex shifting */
        .admin-sidebar {
          width: 260px !important;
          min-width: 260px !important;
          max-width: 260px !important;
          flex: 0 0 260px !important;
          box-sizing: border-box !important;
          background: #FFFFFF;
          border-right: 1px solid #E2E8F0;
          display: flex;
          flex-direction: column;
          height: 100%;
          z-index: 100;
          overflow-y: auto;
          overflow-x: hidden;
        }

        /* SIDEBAR BRAND HEADER */
        .sidebar-brand-header {
          padding: 20px 18px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #F1F5F9;
        }

        .brand-badge-row {
          display: flex;
          flex-direction: column;
        }

        .brand-logo-container {
          display: flex;
          align-items: center;
          gap: 10px;
          user-select: none;
          cursor: pointer;
        }

        .brand-logo-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .brand-logo-img {
          width: 34px;
          height: 34px;
          object-fit: contain;
          border-radius: 6px;
        }

        .brand-hanger-icon {
          width: 36px;
          height: 36px;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .brand-logo-text-col {
          display: flex;
          flex-direction: column;
        }

        .brand-logo-text,
        .brand-logo-text-col .logo-text {
          font-family: 'Poppins', sans-serif;
          font-size: 1.625rem;
          font-weight: 800;
          color: #000000;
          letter-spacing: -0.02em;
          line-height: 1;
        }

        .brand-logo-text .logo-accent,
        .brand-logo-text-col .logo-accent {
          color: #087F8C;
        }

        .portal-sub-badge {
          font-family: 'Poppins', sans-serif;
          font-size: 0.625rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #0D7A75;
          margin-top: 3px;
          line-height: 1;
        }

        .mobile-close-btn {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          color: #64748B;
          padding: 4px;
          border-radius: 6px;
        }

        .mobile-close-btn:hover {
          background: #F1F5F9;
          color: #0F172A;
        }

        /* SIDEBAR NAV MENU */
        .sidebar-nav-menu,
        .admin-nav-menu {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 12px 14px;
          flex: 1;
        }

        .sidebar-nav-item,
        .admin-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 12px;
          border: none;
          background: transparent;
          color: #475569;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s ease;
          text-align: left;
          width: 100%;
          position: relative;
        }

        .sidebar-nav-item:hover,
        .admin-nav-item:hover {
          background: #F1F5F9;
          color: #0F172A;
        }

        .sidebar-nav-item.active,
        .admin-nav-item.active {
          background: #E6F7F5;
          color: #0D7A75;
          font-weight: 700;
        }

        .sidebar-nav-item.active .nav-icon,
        .admin-nav-item.active .nav-item-icon {
          color: #0D7A75;
        }

        .sidebar-active-arrow {
          color: #0D7A75;
          margin-left: auto;
          flex-shrink: 0;
        }

        .nav-icon,
        .nav-item-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748B;
          flex-shrink: 0;
        }

        .nav-label,
        .nav-item-label {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .nav-count-badge {
          font-size: 0.6875rem;
          padding: 2px 7px;
          border-radius: 9999px;
          line-height: 1.2;
          flex-shrink: 0;
          margin-left: auto;
        }

        /* Submenu Accordion & Subitems */
        .admin-nav-group {
          display: flex;
          flex-direction: column;
        }

        .sidebar-nav-item.has-submenu,
        .admin-nav-item.has-submenu {
          display: flex;
          align-items: center;
          width: 100%;
        }

        .nav-item-chevron {
          margin-left: auto;
          display: flex;
          align-items: center;
          color: #94A3B8;
        }

        .chevron-arrow {
          transition: transform 0.2s ease;
        }

        .chevron-arrow.open {
          transform: rotate(0deg);
        }

        .chevron-arrow:not(.open) {
          transform: rotate(-90deg);
        }

        .admin-sub-menu {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding-left: 28px;
          margin-top: 2px;
        }

        .admin-sub-item {
          position: relative;
          display: flex;
          align-items: center;
          padding: 8px 12px 8px 16px;
          border-radius: 10px;
          border: none;
          background: transparent;
          font-size: 0.8125rem;
          font-weight: 500;
          color: #64748B;
          cursor: pointer;
          text-align: left;
          width: 100%;
          transition: all 0.15s ease;
        }

        .admin-sub-item:hover {
          background: #F1F5F9;
          color: #0F172A;
        }

        .admin-sub-item.active {
          background: #E6F7F5 !important;
          color: #0D7A75 !important;
          font-weight: 700;
        }

        .sub-item-active-bar {
          position: absolute;
          left: 6px;
          top: 6px;
          bottom: 6px;
          width: 3px;
          background: #0D7A75;
          border-radius: 2px;
        }

        /* SIDEBAR FOOTER */
        .sidebar-footer-menu {
          padding: 14px;
          border-top: 1px solid #F1F5F9;
          background: #FAFAFA;
          margin-top: auto;
        }

        .sidebar-logout-card-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .sidebar-logout-card-btn:hover {
          background: #FEE2E2;
          border-color: #FCA5A5;
        }

        .sidebar-logout-card-btn:hover span {
          color: #DC2626;
        }
        .sidebar-logout-card-btn:hover svg {
          color: #DC2626 !important;
        }

        .admin-sidebar-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(2px);
          z-index: 95;
        }

        /* MAIN WRAPPER - Always preserve vertical scrollbar gutter and prevent horizontal overflow */
        .admin-main-wrapper {
          flex: 1 1 auto;
          display: flex;
          flex-direction: column;
          min-width: 0;
          background: #F8FBFC;
          overflow-y: scroll !important;
          overflow-x: hidden !important;
          height: 100%;
          overscroll-behavior-y: contain;
          scrollbar-gutter: stable;
          box-sizing: border-box;
          width: calc(100% - 260px);
        }

        .admin-main-wrapper::-webkit-scrollbar {
          width: 8px;
        }

        .admin-main-wrapper::-webkit-scrollbar-track {
          background: #F1F5F9;
        }

        .admin-main-wrapper::-webkit-scrollbar-thumb {
          background: #CBD5E1;
          border-radius: 4px;
        }

        .admin-main-wrapper::-webkit-scrollbar-thumb:hover {
          background: #94A3B8;
        }

        .admin-main-wrapper {
          scrollbar-width: thin;
          scrollbar-color: #CBD5E1 #F1F5F9;
        }

        .admin-main-wrapper.admin-scroll-locked {
          overflow: hidden !important;
          overscroll-behavior: none !important;
        }

        /* Consistent Admin Modal Scroll Containment & Fixed Background across all tabs */
        .modal-backdrop-overlay,
        .modal-backdrop,
        .add-service-backdrop,
        .manage-modal-backdrop,
        .details-modal-backdrop,
        .assign-order-modal-backdrop,
        .ac-modal-backdrop,
        .notif-modal-backdrop,
        .cr-modal-overlay {
          position: fixed !important;
          inset: 0 !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          height: 100dvh !important;
          background: rgba(15, 23, 42, 0.45) !important;
          backdrop-filter: blur(3px) !important;
          -webkit-backdrop-filter: blur(3px) !important;
          z-index: 99999 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          overflow: hidden !important;
          overscroll-behavior: none !important;
          padding: 20px 16px !important;
          box-sizing: border-box !important;
        }

        .drawer-backdrop,
        .reschedule-backdrop {
          position: fixed !important;
          inset: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          height: 100dvh !important;
          background: rgba(15, 23, 42, 0.45) !important;
          backdrop-filter: blur(3px) !important;
          -webkit-backdrop-filter: blur(3px) !important;
          z-index: 99999 !important;
          display: flex !important;
          justify-content: flex-end !important;
          overflow: hidden !important;
          overscroll-behavior: none !important;
          padding: 0 !important;
        }

        .modal-box-card,
        .modal-container,
        .add-service-modal-card,
        .manage-modal-card,
        .assign-order-modal-card,
        .ac-modal-container,
        .details-modal-card,
        .notif-modal-card,
        .order-details-modal {
          background: #FFFFFF !important;
          border-radius: 16px !important;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
          max-height: calc(100vh - 40px) !important;
          max-height: calc(100dvh - 40px) !important;
          display: flex !important;
          flex-direction: column !important;
          overflow: hidden !important;
          overscroll-behavior: contain !important;
          margin: auto !important;
          position: relative !important;
        }

        .drawer-panel,
        .support-drawer,
        .reschedule-panel-drawer {
          background: #FFFFFF !important;
          box-shadow: -4px 0 24px rgba(0, 0, 0, 0.12) !important;
          height: 100vh !important;
          height: 100dvh !important;
          max-height: 100vh !important;
          max-height: 100dvh !important;
          display: flex !important;
          flex-direction: column !important;
          overflow: hidden !important;
          overscroll-behavior: contain !important;
        }

        .modal-body-form,
        .modal-body,
        .modal-body-scrollable,
        .add-service-form,
        .manage-modal-body,
        .manage-services-list-body,
        .assign-modal-body,
        .assign-order-form,
        .ac-form-body,
        .ac-modal-body,
        .details-modal-body,
        .notif-modal-form,
        .drawer-body,
        .reschedule-panel-body {
          overflow-y: auto !important;
          overscroll-behavior: contain !important;
          flex: 1 1 auto !important;
          min-height: 0 !important;
          -webkit-overflow-scrolling: touch !important;
        }

        .modal-box-header,
        .modal-header,
        .add-service-header,
        .manage-modal-header,
        .assign-modal-header,
        .ac-modal-header,
        .details-modal-header,
        .notif-modal-header,
        .drawer-header,
        .reschedule-panel-header {
          flex-shrink: 0 !important;
        }

        .modal-actions-bar,
        .modal-box-footer,
        .modal-footer-actions,
        .add-service-footer,
        .add-service-actions,
        .manage-modal-footer,
        .assign-order-footer,
        .ac-modal-footer,
        .ac-form-footer,
        .drawer-footer,
        .reschedule-form-actions {
          flex-shrink: 0 !important;
        }

        /* TOPBAR (FIXED WITH CLEAN LIGHT BACKGROUND) */
        .admin-topbar,
        .delivery-topbar {
          min-height: 76px;
          height: auto;
          background: #FFFFFF;
          border-bottom: 1px solid #E2E8F0;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 32px;
          position: sticky;
          top: 0;
          z-index: 90;
          margin: 0;
          flex-shrink: 0;
          gap: 16px;
        }

        .admin-topbar.topbar-no-border,
        .delivery-topbar.topbar-no-border {
          border-bottom: none !important;
          box-shadow: none !important;
        }

        .topbar-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .mobile-hamburger-btn,
        .mobile-sidebar-toggle {
          display: none;
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          border-radius: 10px;
          padding: 7px;
          cursor: pointer;
          color: #334155;
          align-items: center;
          justify-content: center;
          transition: background 0.15s ease;
        }

        .mobile-hamburger-btn:hover,
        .mobile-sidebar-toggle:hover {
          background: #F1F5F9;
        }

        .topbar-title-block {
          display: flex;
          flex-direction: column;
        }

        .topbar-kicker {
          font-size: 0.6875rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #006B70;
        }

        .topbar-heading {
          font-size: 1.625rem;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -0.02em;
          line-height: 1.15;
          margin: 1px 0 0;
        }

        .topbar-subtitle {
          font-size: 0.8125rem;
          color: #64748B;
          margin: 3px 0 0;
        }

        .topbar-right,
        .topbar-actions {
          display: flex;
          align-items: center;
          gap: 14px;
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
          top: 3px;
          right: 3px;
          min-width: 18px;
          height: 18px;
          padding: 0 4px;
          border-radius: 9999px;
          background: #EF4444;
          border: 2px solid #FFFFFF;
          color: #FFFFFF;
          font-size: 10px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
        }

        .notification-dropdown-menu {
          position: absolute;
          top: calc(100% + 12px);
          right: -8px;
          width: 580px;
          max-width: min(580px, 92vw);
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          box-shadow: 0 20px 45px -10px rgba(15, 23, 42, 0.16), 0 0 1px 1px rgba(0, 0, 0, 0.04);
          z-index: 1050;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          animation: adminMenuDrop 0.2s cubic-bezier(0.16, 1, 0.3, 1);
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
          padding: 20px 22px 16px 22px;
          background: #FFFFFF;
          border-bottom: 1px solid #EDF2F7;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }

        .notif-header-text-block {
          flex: 1;
          display: flex;
          flex-direction: column;
          text-align: left;
        }

        .notif-header-live-tag {
          font-size: 11px;
          font-weight: 800;
          color: #0D7A75;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .notif-header-main-title {
          font-size: 20px;
          font-weight: 800;
          color: #0F172A;
          margin: 0 0 4px 0;
          line-height: 1.25;
          letter-spacing: -0.01em;
        }

        .notif-header-subtext {
          font-size: 12.5px;
          color: #64748B;
          margin: 0;
          line-height: 1.4;
          font-weight: 400;
        }

        .notif-header-actions-group {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
          margin-top: 4px;
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
          padding: 6px 14px;
          border: 1px solid #CBD5E1;
          color: #334155;
        }

        .notif-refresh-pill:hover {
          background: #F8FAFC;
          border-color: #94A3B8;
          color: #0F172A;
        }

        .notif-mark-read-pill {
          padding: 6px 16px;
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

        .notif-cards-scroll-list {
          padding: 16px 20px;
          max-height: 420px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: #F8FAFC;
        }

        .notif-reference-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
          transition: all 0.18s ease;
          text-align: left;
        }

        .notif-reference-card:hover {
          border-color: #CBD5E1;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
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

        .notif-card-text-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 3px;
          cursor: pointer;
        }

        .notif-card-title-text {
          font-size: 14px;
          font-weight: 700;
          color: #0F172A;
          margin: 0;
          line-height: 1.3;
        }

        .notif-card-desc-text {
          font-size: 12.5px;
          color: #475569;
          margin: 0;
          line-height: 1.4;
        }

        .notif-card-time-text {
          font-size: 11.5px;
          color: #94A3B8;
          font-weight: 500;
          margin-top: 2px;
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

        .notif-dropdown-empty {
          padding: 30px 20px;
          text-align: center;
          color: #94A3B8;
          font-size: 13px;
        }

        .notif-dropdown-footer {
          padding: 12px 18px;
          border-top: 1px solid #E2E8F0;
          background: #FFFFFF;
          text-align: center;
        }

        .notif-view-all-link {
          background: none;
          border: none;
          color: #0D7A75;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          width: 100%;
          padding: 4px;
          transition: color 0.15s ease;
        }

        .notif-view-all-link:hover {
          text-decoration: underline;
          color: #0A605C;
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
          overflow: hidden;
          flex-shrink: 0;
        }

        .admin-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
          display: block;
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
          width: 100%;
          box-sizing: border-box;
          flex: 1;
          min-width: 0;
          overflow-x: hidden;
        }

        .admin-page-body > * {
          width: 100% !important;
          max-width: 100% !important;
          margin-left: 0 !important;
          margin-right: 0 !important;
          box-sizing: border-box !important;
        }

        @media (max-width: 1024px) {
          .admin-sidebar,
          .delivery-sidebar {
            position: fixed;
            left: -280px;
            width: 270px;
            min-width: 270px;
            max-width: 270px;
            transition: left 0.28s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: none;
          }
          .admin-sidebar.open,
          .delivery-sidebar.open {
            left: 0;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
          }
          .mobile-hamburger-btn,
          .mobile-sidebar-toggle {
            display: flex;
          }
          .mobile-close-btn,
          .mobile-sidebar-close {
            display: block;
          }
          .admin-page-body {
            padding: 20px 16px;
          }
          .admin-topbar,
          .delivery-topbar {
            padding: 12px 16px;
          }
          .topbar-heading {
            font-size: 1.25rem;
          }
          .topbar-subtitle {
            font-size: 0.75rem;
          }
          .admin-main-wrapper {
            width: 100%;
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
