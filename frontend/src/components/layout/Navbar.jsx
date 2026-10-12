import React, { useState } from 'react';
import { useBooking } from '../../context/BookingContext';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Menu, X, ArrowRight, ShieldCheck, PhoneCall, User, LogOut, LayoutDashboard, Truck, Layers, ChevronDown, Package, Clock, FileText, MapPin, Bell, HelpCircle } from 'lucide-react';

export const Navbar = () => {
  const { currentPage, navigateTo, startBooking } = useBooking();
  const { currentUser, userProfile, userRole, isAuthenticated, logout, openAuthModal } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const isDeliveryAgent = userRole === 'delivery_agent' || userRole === 'delivery';
  const isLaundryStaff = userRole === 'laundry_staff' || userRole === 'laundry';
  const isCustomer = !isDeliveryAgent && !isLaundryStaff && userRole !== 'admin' && userRole !== 'super_admin';

  const navItems = [
    { 
      label: 'Home', 
      id: 'home', 
      action: () => { 
        navigateTo('home'); 
        window.scrollTo({ top: 0, behavior: 'smooth' }); 
      } 
    },
    { 
      label: 'About Us', 
      id: 'about', 
      action: () => { 
        navigateTo('home'); 
        setTimeout(() => { 
          document.getElementById('about-section')?.scrollIntoView({ behavior: 'smooth' }); 
        }, 80); 
      } 
    },
    { 
      label: 'Our Services', 
      id: 'services', 
      action: () => { 
        if (currentPage === 'home') {
          document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' }); 
        } else {
          navigateTo('services', 'dry-cleaning'); 
        }
      } 
    },
    { 
      label: 'Why Us', 
      id: 'why-us', 
      action: () => { 
        navigateTo('home'); 
        setTimeout(() => { 
          document.getElementById('why-us-section')?.scrollIntoView({ behavior: 'smooth' }); 
        }, 80); 
      } 
    },
    { 
      label: 'Pricing', 
      id: 'pricing', 
      action: () => { 
        navigateTo('home'); 
        setTimeout(() => { 
          document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' }); 
        }, 80); 
      } 
    },
    { 
      label: 'How It Works', 
      id: 'how-it-works', 
      action: () => { 
        navigateTo('home'); 
        setTimeout(() => { 
          document.getElementById('process-section')?.scrollIntoView({ behavior: 'smooth' }); 
        }, 80); 
      } 
    },
  ];

  const handleLogout = async () => {
    setProfileDropdownOpen(false);
    await logout();
    navigateTo('home');
  };

  return (
    <header className="navbar-wrapper">
      <div className="container nav-container">
        {/* Brand Logo */}
        <div className="brand-logo" onClick={() => navigateTo('home')}>
          <span className="logo-text">Laund<span className="logo-accent">rix</span></span>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="desktop-nav">
          {navItems.map((item) => {
            const isActive = (item.id === 'home' && currentPage === 'home') || 
                             (item.id === 'services' && currentPage === 'services') ||
                             (item.id === currentPage);
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
          {isAuthenticated && (
            <div className="user-profile-menu-wrap">
              <button 
                className="user-profile-btn"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                title="Account Settings"
              >
                <div className="nav-user-avatar">
                  {userProfile?.displayName ? userProfile.displayName.substring(0, 2).toUpperCase() : 'CU'}
                </div>
                <span className="nav-user-name">{userProfile?.displayName?.split(' ')[0] || 'Customer'}</span>
              </button>

              {profileDropdownOpen && (
                <div className="nav-dropdown-card animate-fade-in">
                  <div className="dropdown-user-info">
                    <p className="dropdown-name">{userProfile?.displayName || 'Customer'}</p>
                    <p className="dropdown-email">{currentUser?.email}</p>
                    <span style={{ display: 'inline-block', marginTop: 4, padding: '2px 8px', borderRadius: 999, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', background: isDeliveryAgent ? '#DBEAFE' : isLaundryStaff ? '#EDE9FE' : '#ECFDF5', color: isDeliveryAgent ? '#1D4ED8' : isLaundryStaff ? '#6D28D9' : '#059669' }}>
                      {isDeliveryAgent ? '🚚 Delivery Agent' : isLaundryStaff ? '✨ Laundry Staff' : '👤 Customer'}
                    </span>
                  </div>
                  <div className="dropdown-divider" />
                  {isCustomer && (
                    <>
                      <button className="dropdown-action-item" style={{ color: '#0D7A75' }} onClick={() => { setProfileDropdownOpen(false); navigateTo('customer-orders'); }}>
                        <Package size={15} />
                        <span>My Orders</span>
                      </button>
                      <button className="dropdown-action-item" style={{ color: '#0D7A75' }} onClick={() => { setProfileDropdownOpen(false); navigateTo('customer-track'); }}>
                        <Clock size={15} />
                        <span>Track Order</span>
                      </button>
                      <button className="dropdown-action-item" style={{ color: '#0D7A75' }} onClick={() => { setProfileDropdownOpen(false); navigateTo('customer-invoices'); }}>
                        <FileText size={15} />
                        <span>Invoices & Bills</span>
                      </button>
                      <button className="dropdown-action-item" style={{ color: '#0D7A75' }} onClick={() => { setProfileDropdownOpen(false); navigateTo('customer-notifications'); }}>
                        <Bell size={15} />
                        <span>Notifications</span>
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
        <div className="mobile-menu-overlay animate-fade-in">
          <div className="mobile-menu-content">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  item.action();
                  setMobileMenuOpen(false);
                }}
                className={`mobile-nav-link ${currentPage === item.id ? 'active' : ''}`}
              >
                {item.label}
              </button>
            ))}
            
            <div className="mobile-menu-footer">
              {!isAuthenticated ? (
                <button
                  id="mobile-nav-login-btn"
                  className="btn btn-coral w-full mb-2"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigateTo('login');
                  }}
                >
                  <User size={16} /> Login
                </button>
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
          position: sticky;
          top: 0;
          left: 0;
          right: 0;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(226, 232, 240, 0.8);
          z-index: 1000;
          height: 76px;
          display: flex;
          align-items: center;
          transition: all 0.2s ease;
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

        .logo-text {
          font-size: 1.625rem;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -0.02em;
        }

        .logo-accent {
          color: #0D7A75;
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
          gap: 16px;
        }

        .customer-signin-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: 1.5px solid #CBD5E1;
          color: #334155;
          font-size: 0.8125rem;
          font-weight: 600;
          padding: 7px 14px;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .customer-signin-btn:hover {
          border-color: #0D7A75;
          color: #0D7A75;
          background: #F0FDFB;
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
      `}</style>
    </header>
  );
};
