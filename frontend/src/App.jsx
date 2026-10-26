import React, { useEffect, lazy, Suspense } from 'react';
import { AuthProvider } from './context/AuthContext';
import { BookingProvider, useBooking } from './context/BookingContext';
import { AdminProvider } from './context/AdminContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { ServicesPage } from './pages/ServicesPage';
import { WhyUsPage } from './pages/WhyUsPage';
import { PricingPage } from './pages/PricingPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { BookingPage } from './pages/BookingPage';
import { OrderConfirmedPage } from './pages/OrderConfirmedPage';
import { ServiceDetailPage } from './pages/ServiceDetailPage';
import { AdminPortal } from './pages/admin/AdminPortal';
import { CustomerAuthModal } from './components/common/CustomerAuthModal';

import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { useAuth } from './context/AuthContext';
import { getPortalForRole } from './utils/roleUtils';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Loader2 } from 'lucide-react';

// Customer Portal Pages
import { CustomerDashboard } from './customer/CustomerDashboard';
import { MyOrders } from './customer/MyOrders';
import { TrackOrder } from './customer/TrackOrder';
import { PaymentsInvoices } from './customer/PaymentsInvoices';
import { SavedAddresses } from './customer/SavedAddresses';
import { HelpSupport } from './customer/HelpSupport';
import { Profile } from './customer/Profile';
import { Notifications as CustomerNotifications } from './customer/Notifications';
import { CustomerReports } from './customer/CustomerReports';

// Delivery & Laundry Staff Portals
import { DeliveryPortal } from './delivery/DeliveryPortal';
import { LaundryPortal } from './laundry-staff/LaundryPortal';

// Portal wrapper (no navbar/footer - self-contained)
const FULL_SCREEN_PAGES = [
  'admin', 'delivery-portal', 'laundry-portal', 'login', 'signup', 'orders',
  'dashboard', 'incoming', 'processing', 'quality-check', 'ready-for-delivery', 'history',
  'received-clothes', 'inspection', 'washing', 'drying', 'ironing', 'packing', 'ready'
];

const LAUNDRY_STAFF_ROUTES = [
  'laundry-portal',
  'dashboard',
  'orders',
  'history',
  'incoming',
  'processing',
  'quality-check',
  'ready-for-delivery',
  'received-clothes',
  'inspection',
  'washing',
  'drying',
  'ironing',
  'packing',
  'ready'
];

// Customer portal pages (with sidebar layout)
const CUSTOMER_PORTAL_PAGES = [
  'customer-dashboard', 'customer-orders', 'customer-track',
  'customer-reports', 'customer-invoices', 'customer-addresses',
  'customer-support', 'customer-profile', 'customer-notifications'
];

const CustomerAccountLayout = ({ children }) => {
  const { navigateTo, currentPage, startBooking } = useBooking();
  const { userProfile, currentUser } = useAuth();
  const accountTabs = [
    { id: 'customer-dashboard', label: 'My Orders', icon: '📦' },
    { id: 'customer-track', label: 'Track Order', icon: '🚚' },
    { id: 'customer-reports', label: 'Reports', icon: '📋' },
    { id: 'customer-invoices', label: 'Invoices & Bills', icon: '🧾' },
    { id: 'customer-notifications', label: 'Notifications', icon: '🔔' },
    { id: 'customer-profile', label: 'My Profile', icon: '👤' },
    { id: 'customer-support', label: 'Help & Support', icon: '💬' },
  ];

  const displayName = userProfile?.displayName || userProfile?.name || userProfile?.full_name || currentUser?.displayName || currentUser?.name || currentUser?.full_name || currentUser?.fullName || currentUser?.first_name || 'Customer';

  return (
    <div className="customer-account-wrapper" style={{ background: '#F8FAFC', flex: 1, display: 'flex', flexDirection: 'column', margin: 0, paddingBottom: '24px' }}>
      {/* Account Header Banner */}
      <div className="customer-account-banner no-print">
        <div className="customer-account-banner-inner">
          <div className="customer-account-banner-top">
            <div className="customer-account-banner-text">
              <div className="customer-account-badge-pill">
                <span className="account-pulse-dot" />
                Customer Account
              </div>
              <h1 className="customer-account-title">
                Welcome back, {displayName}
              </h1>
              <p className="customer-account-desc">
                Manage your laundry bookings, track live orders, and update preferences
              </p>
            </div>
            <div className="customer-account-actions">
              <button
                onClick={() => startBooking()}
                className="customer-btn-book-pickup"
              >
                <span>+</span> Book a Pickup
              </button>
              <button
                onClick={() => navigateTo('home')}
                className="customer-btn-back-home"
              >
                ← Back to Home
              </button>
            </div>
          </div>

          {/* Account Sub-Navigation Tabs */}
          <div className="customer-account-tabs-nav">
            {accountTabs.map(tab => {
              const isActive = currentPage === tab.id || (tab.id === 'customer-dashboard' && (currentPage === 'customer-orders' || currentPage === 'customer-dashboard'));
              return (
                <button
                  key={tab.id}
                  onClick={() => navigateTo(tab.id)}
                  className={`customer-tab-pill ${isActive ? 'active' : ''}`}
                >
                  <span className="tab-icon">{tab.icon}</span>
                  <span className="tab-label">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Account Content Container */}
      <div className="customer-account-content-container">
        {children}
      </div>

      <style>{`
        .customer-account-banner {
          background: linear-gradient(135deg, #0D7A75 0%, #0E4B56 100%);
          color: #fff;
          margin: 0;
          padding: 36px 0 24px;
        }

        .customer-account-banner-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .customer-account-banner-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }

        .customer-account-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(8px);
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .account-pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #34D399;
        }

        .customer-account-title {
          font-size: 1.75rem;
          font-weight: 800;
          margin: 4px 0 2px;
          letter-spacing: -0.02em;
          color: #ffffff;
        }

        .customer-account-desc {
          margin: 0;
          font-size: 0.875rem;
          color: #E2E8F0;
          opacity: 0.9;
        }

        .customer-account-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .customer-btn-book-pickup {
          background: #FF6B50;
          color: #fff;
          border: none;
          padding: 10px 20px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.875rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 14px rgba(255, 107, 80, 0.35);
          transition: transform 0.15s ease;
        }

        .customer-btn-book-pickup:hover {
          transform: translateY(-1px);
        }

        .customer-btn-back-home {
          background: rgba(255, 255, 255, 0.12);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.25);
          padding: 10px 16px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .customer-btn-back-home:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .customer-account-tabs-nav {
          display: flex;
          gap: 8px;
          margin-top: 28px;
          overflow-x: auto;
          padding-bottom: 4px;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }

        .customer-account-tabs-nav::-webkit-scrollbar {
          display: none;
        }

        .customer-tab-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          white-space: nowrap;
          font-size: 0.875rem;
          font-weight: 500;
          background: rgba(255, 255, 255, 0.12);
          color: #fff;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }

        .customer-tab-pill.active {
          font-weight: 700;
          background: #ffffff;
          color: #0D7A75;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .customer-account-content-container {
          max-width: 1200px;
          width: 100%;
          margin: 28px auto 0;
          padding: 0 20px;
          box-sizing: border-box;
        }

        @media (max-width: 768px) {
          .customer-account-banner {
            padding: 22px 0 16px;
          }

          .customer-account-banner-inner {
            padding: 0 14px;
          }

          .customer-account-title {
            font-size: 1.35rem;
          }

          .customer-account-desc {
            font-size: 0.8rem;
          }

          .customer-account-actions {
            width: 100%;
            display: flex;
            gap: 8px;
            margin-top: 6px;
          }

          .customer-btn-book-pickup,
          .customer-btn-back-home {
            flex: 1;
            justify-content: center;
            padding: 9px 12px;
            font-size: 0.8125rem;
          }

          .customer-account-tabs-nav {
            margin-top: 16px;
            gap: 6px;
            padding-bottom: 6px;
          }

          .customer-tab-pill {
            padding: 8px 12px;
            font-size: 0.8rem;
            gap: 6px;
          }

          .customer-account-content-container {
            margin: 14px auto 0;
            padding: 0 12px;
          }
        }
      `}</style>
    </div>
  );
};

const AppContent = () => {
  const { currentPage, navigateTo } = useBooking();
  const { isAuthenticated, userRole, loading, currentUser } = useAuth();

  const normalizedRoute = String(currentPage || 'home').replace(/^#\/?/, '').trim().toLowerCase();
  const cleanPageName = (currentPage || '').split('?')[0].replace(/^#\/?/, '').replace(/^\//, '').toLowerCase();
  const isLaundryRoute = LAUNDRY_STAFF_ROUTES.includes(cleanPageName) || 
    ((cleanPageName === 'notifications' || cleanPageName === 'profile') && (userRole === 'staff' || userRole === 'laundry_staff' || userRole === 'admin'));



  // Protected route redirects inside useEffect to avoid updating BookingProvider during render
  useEffect(() => {
    if (loading) return;

    if (normalizedRoute === 'admin') {
      if (!isAuthenticated) {
        navigateTo('login', null, { replace: true });
      } else if (userRole !== 'admin') {
        navigateTo(getPortalForRole(userRole), null, { replace: true });
      }
    } else if (normalizedRoute === 'delivery-portal') {
      if (!isAuthenticated) {
        navigateTo('login', null, { replace: true });
      } else if (userRole !== 'agent' && userRole !== 'delivery_agent' && userRole !== 'admin') {
        navigateTo(getPortalForRole(userRole), null, { replace: true });
      }
    } else if (isLaundryRoute) {
      if (!isAuthenticated) {
        navigateTo('login', null, { replace: true });
      } else if (userRole !== 'staff' && userRole !== 'laundry_staff' && userRole !== 'admin') {
        navigateTo(getPortalForRole(userRole), null, { replace: true });
      }
    } else if (CUSTOMER_PORTAL_PAGES.includes(normalizedRoute)) {
      if (!isAuthenticated) {
        navigateTo('login', null, { replace: true });
      }
    }
  }, [normalizedRoute, isLaundryRoute, isAuthenticated, userRole, loading, navigateTo]);

  // Show subtle loader while session is being verified from storage
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#000000', marginBottom: 16 }}>
            Fabri<span style={{ color: '#162832' }}>Care</span>
          </div>
          <Loader2 className="animate-spin" size={32} style={{ color: '#0D7A75', margin: '0 auto' }} />
          <p style={{ marginTop: 12, fontSize: '0.875rem', color: '#64748B', fontWeight: 500 }}>
            Verifying secure session...
          </p>
        </div>
      </div>
    );
  }

  // Route 1: Dedicated Login Page
  if (normalizedRoute === 'login') {
    return <LoginPage />;
  }

  // Route 1b: Dedicated Signup Page
  if (normalizedRoute === 'signup') {
    return <SignupPage />;
  }

  // Route 2: Admin Portal (Strictly Protected: role === 'admin')
  if (normalizedRoute === 'admin') {
    if (!isAuthenticated) {
      return <LoginPage />;
    }
    if (userRole !== 'admin') {
      return <LoginPage />;
    }
    return <AdminPortal />;
  }

  // Route 3: Delivery Portal (Strictly Protected: role === 'agent' or 'delivery_agent' or 'admin')
  if (normalizedRoute === 'delivery-portal') {
    if (!isAuthenticated) {
      return <LoginPage />;
    }
    if (userRole !== 'agent' && userRole !== 'delivery_agent' && userRole !== 'delivery' && userRole !== 'delivery_staff' && userRole !== 'admin') {
      return <LoginPage />;
    }
    return <DeliveryPortal />;
  }

  // Route 4: Laundry Hub Portal (Strictly Protected: role === 'staff' or 'laundry_staff' or 'admin')
  if (isLaundryRoute) {
    if (!isAuthenticated) {
      return <LoginPage />;
    }
    if (userRole !== 'staff' && userRole !== 'laundry_staff' && userRole !== 'laundry' && userRole !== 'admin') {
      return <LoginPage />;
    }
    return <LaundryPortal />;
  }

  // Route 5: Customer Account Pages (Protected: requires customer/user authentication)
  if (CUSTOMER_PORTAL_PAGES.includes(normalizedRoute)) {
    if (!isAuthenticated) {
      return <LoginPage />;
    }

    return (
      <div className="app-layout">
        <Navbar />
        <main className="main-content">
          <CustomerAccountLayout key={currentUser?.uid || 'guest'}>
            {(normalizedRoute === 'customer-dashboard' || normalizedRoute === 'customer-orders') && <CustomerDashboard />}
            {normalizedRoute === 'customer-track' && <TrackOrder />}
            {normalizedRoute === 'customer-reports' && <CustomerReports />}
            {normalizedRoute === 'customer-invoices' && <PaymentsInvoices />}
            {normalizedRoute === 'customer-addresses' && <Profile />}
            {normalizedRoute === 'customer-support' && <HelpSupport />}
            {normalizedRoute === 'customer-profile' && <Profile />}
            {normalizedRoute === 'customer-notifications' && <CustomerNotifications />}
          </CustomerAccountLayout>
        </main>
        <Footer />
        <CustomerAuthModal />
      </div>
    );
  }

  // Route 6: Public Main Site (Home, Dedicated Pages, Booking, Confirmed)
  const isKnownPublicPage = [
    'home', 'about', 'services', 'why-us', 'pricing',
    'how-it-works', 'service-detail', 'booking', 'confirmed'
  ].includes(normalizedRoute);

  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        {(normalizedRoute === 'home' || !isKnownPublicPage) && <HomePage />}
        {normalizedRoute === 'about' && <AboutPage />}
        {normalizedRoute === 'services' && <ServicesPage />}
        {normalizedRoute === 'why-us' && <WhyUsPage />}
        {normalizedRoute === 'pricing' && <PricingPage />}
        {normalizedRoute === 'how-it-works' && <HowItWorksPage />}
        {normalizedRoute === 'service-detail' && <ServiceDetailPage />}
        {normalizedRoute === 'booking' && <BookingPage />}
        {normalizedRoute === 'confirmed' && <OrderConfirmedPage />}
      </main>
      <Footer />
      <CustomerAuthModal />
    </div>
  );
};

export const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BookingProvider>
          <AdminProvider>
            <AppContent />
          </AdminProvider>
        </BookingProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
