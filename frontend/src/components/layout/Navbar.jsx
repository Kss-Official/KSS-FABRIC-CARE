import React, { useState, useRef, useEffect } from 'react';
import { useBooking } from '../../context/BookingContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Sparkles, Menu, X, ArrowRight, ShieldCheck, PhoneCall, User, LogOut, 
  LayoutDashboard, Truck, Layers, ChevronDown, Package, Clock, FileText, 
  MapPin, Bell, HelpCircle, CheckCircle2, CreditCard, CheckCheck 
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';

export const Navbar = () => {
  const { currentPage, navigateTo, startBooking } = useBooking();
  const { currentUser, userProfile, userRole, isAuthenticated, logout, openAuthModal } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const notifMenuRef = useRef(null);

  // Live isolated notifications hook
  const { items: notifications, unreadCount, markRead, markAllRead } = useNotifications(currentUser?.uid);

  // Click outside handler for profile dropdown
  useEffect(() => {
    if (!profileDropdownOpen) return;

    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [profileDropdownOpen]);

  // Click outside handler for notifications dropdown
  useEffect(() => {
    if (!notifDropdownOpen) return;

    const handleClickOutside = (event) => {
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target)) {
        setNotifDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [notifDropdownOpen]);

  // Handle clicking a single notification item
  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      markRead(notif.id);
    }
    setNotifDropdownOpen(false);
    navigateTo('customer-notifications');
  };

  // Mark all notifications as read
  const handleMarkAllRead = async (e) => {
    if (e) e.stopPropagation();
    await markAllRead();
  };

  const renderNotifIcon = (notif) => {
    const type = notif.type || '';
    const category = notif.category || '';
    if (type === 'delivery' || category === 'Out for Delivery') {
      return (
        <div className="notif-item-icon-box" style={{ background: '#EFF6FF', color: '#2563EB' }}>
          <Truck size={14} />
        </div>
      );
    }
    if (type === 'completed' || category === 'Delivered') {
      return (
        <div className="notif-item-icon-box" style={{ background: '#ECFDF5', color: '#059669' }}>
          <CheckCircle2 size={14} />
        </div>
      );
    }
    if (type === 'rescheduled' || category === 'Rescheduled') {
      return (
        <div className="notif-item-icon-box" style={{ background: '#FFFBEB', color: '#D97706' }}>
          <Clock size={14} />
        </div>
      );
    }
    if (type === 'payment' || category === 'Payment') {
      return (
        <div className="notif-item-icon-box" style={{ background: '#F0FDF4', color: '#16A34A' }}>
          <CreditCard size={14} />
        </div>
      );
    }
    return (
      <div className="notif-item-icon-box" style={{ background: '#F0FDFB', color: '#0D7A75' }}>
        <Bell size={14} />
      </div>
    );
  };

  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  const isDeliveryAgent = userRole === 'delivery_agent' || userRole === 'delivery' || userRole === 'agent';
  const isLaundryStaff = userRole === 'laundry_staff' || userRole === 'laundry' || userRole === 'staff';
  const isCustomer = !isAdmin && !isDeliveryAgent && !isLaundryStaff;

  const navItems = [
    { 
      label: 'Home', 
      id: 'home', 
      action: () => { 
        navigateTo('home'); 
      } 
    },
    { 
      label: 'About Us', 
      id: 'about', 
      action: () => { 
        navigateTo('about'); 
      } 
    },
    { 
      label: 'Our Services', 
      id: 'services', 
      action: () => { 
        navigateTo('services'); 
      } 
    },
    { 
      label: 'Why Us', 
      id: 'why-us', 
      action: () => { 
        navigateTo('why-us'); 
      } 
    },
    { 
      label: 'Pricing', 
      id: 'pricing', 
      action: () => { 
        navigateTo('pricing'); 
      } 
    },
    { 
      label: 'How It Works', 
      id: 'how-it-works', 
      action: () => { 
        navigateTo('how-it-works'); 
      } 
    },
  ];

  const handleLogout = async () => {
    setProfileDropdownOpen(false);
    await logout();
    navigateTo('home');
  };

  return (
    <>
      <header className="navbar-wrapper no-print">
      <div className="container nav-container">
        {/* Brand Logo */}
        <div className="brand-logo" onClick={() => navigateTo('home')}>
          <img 
            src="/images/fabricare-logo.png" 
            alt="FabriCare" 
            className="navbar-brand-logo-img" 
          />
          <span className="logo-text">Fabri<span className="logo-accent">Care</span></span>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="desktop-nav">
          {navItems.map((item) => {
            const isActive = item.id === currentPage || (item.id === 'services' && currentPage === 'service-detail');
            return (
              <button
                key={item.id}
                onClick={item.action}
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                {item.label}
                {isActive && <span className="active-indicator" />}
              </button>
            );
          })}
        </nav>

        {/* Header Action Button */}
        <div className="nav-actions">
          {isAuthenticated ? (
            <div className="nav-user-cluster">
              {/* Notification Bell Menu */}
              <div className="user-notif-menu-wrap" ref={notifMenuRef}>
                <button 
                  id="nav-notification-bell-btn"
                  className={`nav-bell-btn ${notifDropdownOpen ? 'active' : ''}`}
                  onClick={() => {
                    setNotifDropdownOpen(prev => !prev);
                    setProfileDropdownOpen(false);
                  }}
                  title="Notifications"
                  aria-label="View notifications"
                  aria-expanded={notifDropdownOpen}
                >
                  <Bell size={19} />
                  {unreadCount > 0 && (
                    <span className="nav-bell-badge">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {notifDropdownOpen && (
                  <div className="nav-notif-dropdown animate-fade-in" onClick={(e) => e.stopPropagation()}>
                    <div className="notif-dropdown-header">
                      <div className="notif-dropdown-title-group">
                        <span className="notif-dropdown-title">Notifications</span>
                        {unreadCount > 0 ? (
                          <span className="notif-unread-pill">{unreadCount} new</span>
                        ) : (
                          <span className="notif-caught-up-pill">All caught up</span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button 
                          type="button"
                          className="notif-mark-all-btn"
                          onClick={handleMarkAllRead}
                          title="Mark all as read"
                        >
                          <CheckCheck size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: -1 }} />
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="notif-dropdown-list">
                      {notifications.length === 0 ? (
                        <div className="notif-dropdown-empty">
                          <div className="notif-dropdown-empty-icon">
                            <Bell size={22} />
                          </div>
                          <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#334155', fontSize: '0.875rem' }}>No notifications yet</p>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: '#94A3B8' }}>You're all caught up with your orders and alerts.</p>
                        </div>
                      ) : (
                        notifications.slice(0, 6).map((notif) => (
                          <div
                            key={notif.id}
                            className={`notif-dropdown-item ${!notif.isRead ? 'unread' : ''}`}
                            onClick={() => handleNotificationClick(notif)}
                          >
                            {renderNotifIcon(notif)}
                            <div className="notif-item-content">
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                                <h4 className="notif-item-title">{notif.title}</h4>
                                {!notif.isRead && <span className="notif-unread-dot" />}
                              </div>
                              <p className="notif-item-desc">{notif.message}</p>
                              <div className="notif-item-meta">
                                <span className="notif-item-time">{notif.formattedDate || 'Recent'}</span>
                                {notif.orderId && (
                                  <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#0D7A75', background: '#F0FDFB', padding: '1px 6px', borderRadius: 4 }}>
                                    {notif.orderId}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="notif-dropdown-footer">
                      <button
                        type="button"
                        className="notif-dropdown-footer-btn"
                        onClick={() => {
                          setNotifDropdownOpen(false);
                          navigateTo('customer-notifications');
                        }}
                      >
                        <span>View All Notifications</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Menu */}
              <div className="user-profile-menu-wrap" ref={profileMenuRef}>
                <button 
                  className="user-profile-btn"
                  onClick={() => {
                    setProfileDropdownOpen(prev => !prev);
                    setNotifDropdownOpen(false);
                  }}
                  title="Account Settings"
                >
                  <div className="nav-user-avatar">
                    {userProfile?.avatarUrl || userProfile?.photoUrl ? (
                      <img src={userProfile.avatarUrl || userProfile.photoUrl} alt={userProfile.displayName || 'User'} className="nav-avatar-img" />
                    ) : (
                      userProfile?.displayName ? userProfile.displayName.substring(0, 2).toUpperCase() : 'CU'
                    )}
                  </div>
                  <span className="nav-user-name">{userProfile?.displayName?.split(' ')[0] || 'Customer'}</span>
                </button>

                {profileDropdownOpen && (
                  <div className="nav-dropdown-card animate-fade-in">
                    <div className="dropdown-user-info">
                      <p className="dropdown-name">{userProfile?.displayName || 'Customer'}</p>
                      <p className="dropdown-email">{currentUser?.email}</p>
                      <span style={{ display: 'inline-block', marginTop: 4, padding: '2px 8px', borderRadius: 999, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', background: isAdmin ? '#FEF3C7' : isDeliveryAgent ? '#DBEAFE' : isLaundryStaff ? '#EDE9FE' : '#ECFDF5', color: isAdmin ? '#B45309' : isDeliveryAgent ? '#1D4ED8' : isLaundryStaff ? '#6D28D9' : '#059669' }}>
                        {isAdmin ? '👑 Administrator' : isDeliveryAgent ? '🚚 Delivery Agent' : isLaundryStaff ? '✨ Laundry Staff' : '👤 Customer'}
                      </span>
                    </div>
                    <div className="dropdown-divider" />
                    {isAdmin && (
                      <button className="dropdown-action-item" style={{ color: '#0D7A75', fontWeight: 600 }} onClick={() => { setProfileDropdownOpen(false); navigateTo('admin'); }}>
                        <LayoutDashboard size={15} />
                        <span>Admin Portal</span>
                      </button>
                    )}
                    {isCustomer && (
                      <>
                        <button className="dropdown-action-item" style={{ color: '#0D7A75' }} onClick={() => { setProfileDropdownOpen(false); navigateTo('customer-dashboard'); }}>
                          <Package size={15} />
                          <span>My Orders</span>
                        </button>
                        <button className="dropdown-action-item" style={{ color: '#0D7A75' }} onClick={() => { setProfileDropdownOpen(false); navigateTo('customer-track'); }}>
                          <Clock size={15} />
                          <span>Track Order</span>
                        </button>
                        <button className="dropdown-action-item" style={{ color: '#0D7A75' }} onClick={() => { setProfileDropdownOpen(false); navigateTo('customer-reports'); }}>
                          <FileText size={15} />
                          <span>Reports</span>
                        </button>
                        <button className="dropdown-action-item" style={{ color: '#0D7A75' }} onClick={() => { setProfileDropdownOpen(false); navigateTo('customer-support'); }}>
                          <HelpCircle size={15} />
                          <span>Help & Support</span>
                        </button>
                        <button className="dropdown-action-item" style={{ color: '#0D7A75' }} onClick={() => { setProfileDropdownOpen(false); navigateTo('customer-profile'); }}>
                          <User size={15} />
                          <span>My Profile</span>
                        </button>
                      </>
                    )}
                    {isDeliveryAgent && (
                      <button className="dropdown-action-item" style={{ color: '#1D4ED8' }} onClick={() => { setProfileDropdownOpen(false); navigateTo('delivery-portal'); }}>
                        <Truck size={15} />
                        <span>Delivery Portal</span>
                      </button>
                    )}
                    {isLaundryStaff && (
                      <button className="dropdown-action-item" style={{ color: '#6D28D9' }} onClick={() => { setProfileDropdownOpen(false); navigateTo('laundry-portal'); }}>
                        <Layers size={15} />
                        <span>Laundry Hub Portal</span>
                      </button>
                    )}
                    <div className="dropdown-divider" />
                    <button className="dropdown-action-item" onClick={handleLogout}>
                      <LogOut size={15} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="nav-auth-buttons">
              <button
                id="nav-signin-btn"
                type="button"
                className="nav-auth-btn nav-signin-btn"
                onClick={() => navigateTo('login')}
              >
                Sign In / Sign Up
              </button>
            </div>
          )}

          <button
            id="nav-book-pickup-btn"
            className="btn btn-coral nav-cta-btn"
            onClick={() => startBooking()}
          >
            <span>Book a Pickup</span>
            <ArrowRight size={17} />
          </button>

          {/* Mobile Hamburger Button */}
          <button 
            className="mobile-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay animate-fade-in" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-menu-content" onClick={(e) => e.stopPropagation()}>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  item.action();
                  setMobileMenuOpen(false);
                }}
                className={`mobile-nav-link ${currentPage === item.id || (item.id === 'services' && currentPage === 'service-detail') ? 'active' : ''}`}
              >
                {item.label}
              </button>
            ))}
            
            <div className="mobile-menu-footer">
              {!isAuthenticated ? (
                <div className="mobile-auth-btn-group" style={{ gridTemplateColumns: '1fr' }}>
                  <button
                    id="mobile-nav-login-btn"
                    className="btn btn-outline mobile-auth-btn"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigateTo('login');
                    }}
                  >
                    <User size={15} /> Sign In / Sign Up
                  </button>
                </div>
              ) : (
                <button
                  className="btn btn-outline w-full mb-2"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                >
                  <LogOut size={16} /> Sign Out ({userProfile?.displayName || 'Customer'})
                </button>
              )}
              <button
                className="btn btn-coral w-full"
                onClick={() => {
                  startBooking();
                  setMobileMenuOpen(false);
                }}
              >
                Book a Pickup <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .navbar-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          width: 100%;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(226, 232, 240, 0.8);
          z-index: 1000;
          height: 76px;
          display: flex;
          align-items: center;
          margin: 0;
          padding: 0;
          transition: all 0.2s ease;
        }

        .navbar-spacer {
          height: 76px;
          width: 100%;
          margin: 0;
          padding: 0;
          flex-shrink: 0;
        }

        .nav-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }

        .brand-logo {
          display: flex;
          align-items: center;
          cursor: pointer;
          user-select: none;
        }

        .navbar-brand-logo-img {
          width: 34px;
          height: 34px;
          margin-right: 9px;
          border-radius: 8px;
          object-fit: contain;
          flex-shrink: 0;
        }

        .logo-text {
          font-family: 'Poppins', sans-serif;
          font-size: 1.625rem;
          font-weight: 800;
          color: #000000;
          letter-spacing: -0.02em;
        }

        .logo-accent {
          color: #087F8C;
        }

        .desktop-nav {
          display: flex;
          align-items: center;
          gap: 32px;
        }

        .nav-link {
          position: relative;
          background: none;
          border: none;
          font-size: 0.9375rem;
          font-weight: 500;
          color: #4A5568;
          cursor: pointer;
          padding: 8px 0;
          transition: color 0.2s ease;
        }

        .nav-link:hover {
          color: #0D7A75;
        }

        .nav-link.active {
          color: #0D7A75;
          font-weight: 700;
        }

        .active-indicator {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2.5px;
          background: #0D7A75;
          border-radius: 4px;
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .nav-auth-buttons {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .nav-auth-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-family: inherit;
          font-size: 0.875rem;
          font-weight: 600;
          padding: 8px 18px;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
          border: 1.5px solid transparent;
          line-height: 1.25;
        }

        .nav-signin-btn {
          background: #FFFFFF;
          border-color: #CBD5E1;
          color: #334155;
        }

        .nav-signin-btn:hover {
          border-color: #0D7A75;
          color: #0D7A75;
          background: #F0FDFB;
        }

        .nav-signup-btn {
          background: #0D7A75;
          border-color: #0D7A75;
          color: #FFFFFF;
          box-shadow: 0 2px 6px rgba(13, 122, 117, 0.18);
        }

        .nav-signup-btn:hover {
          background: #09635F;
          border-color: #09635F;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(13, 122, 117, 0.25);
        }

        .mobile-auth-btn-group {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 10px;
        }

        .mobile-auth-btn {
          padding: 10px 12px;
          font-size: 0.875rem;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .nav-user-cluster {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .user-notif-menu-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
        }

        .nav-bell-btn {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 0;
        }

        .nav-bell-btn:hover,
        .nav-bell-btn.active {
          background: #F0FDFB;
          border-color: #0D7A75;
          color: #0D7A75;
          box-shadow: 0 2px 8px rgba(13, 122, 117, 0.15);
        }

        .nav-bell-badge {
          position: absolute;
          top: -3px;
          right: -3px;
          min-width: 18px;
          height: 18px;
          padding: 0 4px;
          border-radius: 999px;
          background: #FF6B50;
          color: #FFFFFF;
          font-size: 0.65rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #FFFFFF;
          line-height: 1;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
        }

        .nav-notif-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: -40px;
          width: 360px;
          max-width: calc(100vw - 24px);
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          box-shadow: 0 16px 36px -6px rgba(15, 23, 42, 0.16), 0 4px 12px rgba(15, 23, 42, 0.06);
          z-index: 1002;
          overflow: hidden;
        }

        .notif-dropdown-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-bottom: 1px solid #F1F5F9;
          background: #FFFFFF;
        }

        .notif-dropdown-title-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .notif-dropdown-title {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #0F172A;
          margin: 0;
        }

        .notif-unread-pill {
          font-size: 0.6875rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 999px;
          background: #FEF2F2;
          color: #EF4444;
        }

        .notif-caught-up-pill {
          font-size: 0.6875rem;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 999px;
          background: #F0FDF4;
          color: #16A34A;
        }

        .notif-mark-all-btn {
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

        .notif-mark-all-btn:hover {
          background: #F0FDFB;
          color: #08615D;
        }

        .notif-dropdown-list {
          max-height: 330px;
          overflow-y: auto;
          overscroll-behavior: contain;
        }

        .notif-dropdown-item {
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

        .notif-dropdown-item:hover {
          background: #F8FAFC;
        }

        .notif-dropdown-item.unread {
          background: #F0FDFB;
          border-left-color: #0D7A75;
        }

        .notif-dropdown-item.unread:hover {
          background: #E6F7F5;
        }

        .notif-item-icon-box {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .notif-item-content {
          flex: 1;
          min-width: 0;
        }

        .notif-item-title {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #1E293B;
          margin: 0 0 2px 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .notif-dropdown-item.unread .notif-item-title {
          color: #0F172A;
          font-weight: 700;
        }

        .notif-item-desc {
          font-size: 0.75rem;
          color: #64748B;
          margin: 0 0 4px 0;
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .notif-item-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.6875rem;
          color: #94A3B8;
        }

        .notif-item-time {
          font-size: 0.6875rem;
          color: #94A3B8;
        }

        .notif-unread-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #FF6B50;
          flex-shrink: 0;
        }

        .notif-dropdown-footer {
          padding: 10px 16px;
          border-top: 1px solid #F1F5F9;
          background: #FAFBFB;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .notif-dropdown-footer-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: 100%;
          padding: 8px 14px;
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          border-radius: 10px;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #0D7A75;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .notif-dropdown-footer-btn:hover {
          background: #0D7A75;
          color: #FFFFFF;
          border-color: #0D7A75;
        }

        .notif-dropdown-empty {
          padding: 32px 16px;
          text-align: center;
          color: #64748B;
        }

        .notif-dropdown-empty-icon {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #F1F5F9;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 10px;
          color: #94A3B8;
        }

        @media (max-width: 480px) {
          .nav-notif-dropdown {
            right: -60px;
            width: 320px;
          }
        }

        .user-profile-menu-wrap {
          position: relative;
        }

        .user-profile-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          padding: 4px 10px 4px 4px;
          border-radius: 999px;
          cursor: pointer;
        }

        .nav-user-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #0D7A75;
          color: #FFFFFF;
          font-size: 0.75rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          flex-shrink: 0;
        }

        .nav-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
          display: block;
        }

        .nav-user-name {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #1E293B;
        }

        .nav-dropdown-card {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          width: 200px;
          padding: 12px;
          z-index: 1001;
        }

        .dropdown-user-info {
          padding-bottom: 8px;
        }

        .dropdown-name {
          font-size: 0.875rem;
          font-weight: 700;
          color: #1E293B;
        }

        .dropdown-email {
          font-size: 0.75rem;
          color: #64748B;
          word-break: break-all;
        }

        .dropdown-divider {
          height: 1px;
          background: #E2E8F0;
          margin: 6px 0;
        }

        .dropdown-action-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          background: none;
          border: none;
          border-radius: 8px;
          color: #EF4444;
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
          text-align: left;
        }

        .dropdown-action-item:hover {
          background: #FEF2F2;
        }

        .admin-portal-link-btn {
          background: #F1F5F9;
          border: 1px solid #E2E8F0;
          color: #475569;
          font-size: 0.8125rem;
          font-weight: 700;
          padding: 8px 14px;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .admin-portal-link-btn:hover {
          background: #EBF8F7;
          color: #0D7A75;
          border-color: #BCEAE6;
        }

        .nav-cta-btn {
          padding: 10px 22px;
          font-size: 0.9375rem;
          font-weight: 600;
        }

        .mobile-toggle-btn {
          display: none;
          background: none;
          border: none;
          color: #2D3748;
          cursor: pointer;
          padding: 6px;
        }

        .mobile-menu-overlay {
          position: fixed;
          top: 76px;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.4);
          z-index: 999;
        }

        .mobile-menu-content {
          background: #ffffff;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: 0 16px 32px rgba(0, 0, 0, 0.1);
        }

        .mobile-nav-link {
          background: none;
          border: none;
          text-align: left;
          font-size: 1.125rem;
          font-weight: 600;
          color: #2D3748;
          padding: 10px 0;
          border-bottom: 1px solid #edf2f7;
        }

        .mobile-nav-link.active {
          color: #0D7A75;
        }

        .w-full {
          width: 100%;
        }

        .mb-2 {
          margin-bottom: 8px;
        }

        .btn-outline {
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          color: #334155;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px;
          border-radius: 12px;
        }

        @media (max-width: 992px) {
          .desktop-nav {
            display: none;
          }
          .mobile-toggle-btn {
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }

        @media (max-width: 680px) {
          .nav-auth-buttons {
            display: none;
          }
        }
      `}</style>
    </header>
    <div className="navbar-spacer no-print" aria-hidden="true" />
  </>
  );
};
