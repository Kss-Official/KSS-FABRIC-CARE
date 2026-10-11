import React, { useState } from 'react';
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
  Globe,
  Menu,
  X
} from 'lucide-react';

export const AdminLayout = ({ children }) => {
  const { adminTab, setAdminTab, setIsAdminAuthenticated } = useAdmin();
  const { navigateTo } = useBooking();
  const { userProfile, currentUser, logout } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleAdminLogout = async () => {
    setIsAdminAuthenticated(false);
    setAdminTab('login');
    setProfileDropdownOpen(false);
    await logout();
    navigateTo('home');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'orders', label: 'Orders', icon: <Package size={20} />, hasBadge: true },
    { id: 'pickup-delivery', label: 'Pickup & Delivery', icon: <Truck size={20} /> },
    { id: 'customers', label: 'Customers', icon: <Users size={20} /> },
    { id: 'services', label: 'Services & Pricing', icon: <Tag size={20} /> },
    { id: 'content', label: 'Content', icon: <FileText size={20} /> },
  ];

  return (
    <div className="admin-root-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${mobileSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="admin-brand-logo" onClick={() => setAdminTab('dashboard')}>
            <span className="logo-text">Laund<span className="logo-accent">rix</span></span>
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
                {item.hasBadge && <span className="nav-dot-badge" />}
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
            {/* View Live Website Link */}
            <button 
              className="view-website-btn"
              onClick={() => navigateTo('home')}
              title="Go to customer website"
            >
              <Globe size={16} />
              <span>Customer View</span>
            </button>

            {/* Notification Bell */}
            <div className="notification-bell-btn">
              <Bell size={20} />
              <span className="notif-badge" />
            </div>

            {/* Admin Profile Pill */}
            <div className="admin-profile-pill-wrapper">
              <div 
                className="admin-profile-pill"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              >
                <div className="admin-avatar">
                  {(userProfile?.displayName || currentUser?.displayName || 'A').substring(0, 1).toUpperCase()}
                </div>
                <div className="admin-user-info">
                  <span className="admin-name">{userProfile?.displayName || currentUser?.displayName || 'Admin'}</span>
                  <span className="admin-org">Laundrix</span>
                </div>
                <ChevronDown size={14} className="profile-chevron" />
              </div>

              {profileDropdownOpen && (
                <div className="profile-dropdown-menu animate-fade-in">
                  <div className="dropdown-header">
                    <strong>{userProfile?.displayName || currentUser?.displayName || 'Admin User'}</strong>
                    <span>{currentUser?.email || 'admin@laundrix.com'}</span>
                  </div>
                  <div className="dropdown-divider" />
                  <button 
                    className="dropdown-item"
                    onClick={() => { setAdminTab('settings'); setProfileDropdownOpen(false); }}
                  >
                    Account Settings
                  </button>
                  <button 
                    className="dropdown-item text-danger"
                    onClick={handleAdminLogout}
                  >
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
          font-size: 1.625rem;
          font-weight: 800;
          color: #0D7A75;
          letter-spacing: -0.03em;
        }

        .admin-brand-logo .logo-accent {
          color: #0E4B56;
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
          gap: 20px;
        }

        .view-website-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #F1F5F9;
          border: 1px solid #E2E8F0;
          padding: 8px 14px;
          border-radius: 10px;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s;
        }

        .view-website-btn:hover {
          background: #EBF8F7;
          color: #0D7A75;
          border-color: #BCEAE6;
        }

        .notification-bell-btn {
          position: relative;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          border: 1px solid #E2E8F0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748B;
          cursor: pointer;
          background: #FFFFFF;
          transition: background 0.2s;
        }

        .notification-bell-btn:hover {
          background: #F8FAFC;
        }

        .notif-badge {
          position: absolute;
          top: 8px;
          right: 9px;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #EF4444;
          border: 2px solid #FFFFFF;
        }

        .admin-profile-pill-wrapper {
          position: relative;
        }

        .admin-profile-pill {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 10px 6px 6px;
          border-radius: 12px;
          cursor: pointer;
          user-select: none;
          transition: background 0.2s;
        }

        .admin-profile-pill:hover {
          background: #F1F5F9;
        }

        .admin-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #0D7A75;
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
          font-size: 0.875rem;
          font-weight: 700;
          color: #1E293B;
        }

        .admin-org {
          font-size: 0.75rem;
          color: #94A3B8;
        }

        .profile-chevron {
          color: #94A3B8;
        }

        .profile-dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 200px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.08);
          padding: 8px;
          z-index: 100;
        }

        .dropdown-header {
          padding: 8px 12px;
          display: flex;
          flex-direction: column;
          font-size: 0.8125rem;
        }

        .dropdown-header span {
          font-size: 0.75rem;
          color: #94A3B8;
        }

        .dropdown-divider {
          height: 1px;
          background: #F1F5F9;
          margin: 6px 0;
        }

        .dropdown-item {
          width: 100%;
          text-align: left;
          padding: 8px 12px;
          background: none;
          border: none;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #475569;
          border-radius: 8px;
          cursor: pointer;
        }

        .dropdown-item:hover {
          background: #F8FAFC;
        }

        .dropdown-item.text-danger {
          color: #EF4444;
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
