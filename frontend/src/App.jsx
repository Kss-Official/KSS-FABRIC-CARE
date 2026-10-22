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

  const displayName = userProfile?.displayName || currentUser?.displayName || currentUser?.full_name || currentUser?.first_name || 'Customer';

  return (
    <div className="customer-account-wrapper" style={{ background: '#F8FAFC', flex: 1, display: 'flex', flexDirection: 'column', margin: 0, paddingBottom: '24px' }}>
      {/* Account Header Banner */}
      <div className="customer-account-banner no-print" style={{ background: 'linear-gradient(135deg, #0D7A75 0%, #0E4B56 100%)', color: '#fff', margin: 0, padding: '36px 0 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34D399' }} />
                Customer Account
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '4px 0 2px', letterSpacing: '-0.02em' }}>
                Welcome back, {displayName}
              </h1>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#E2E8F0', opacity: 0.9 }}>
                Manage your laundry bookings, track live orders, and update preferences
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={() => startBooking()}
                style={{
                  background: '#FF6B50', color: '#fff', border: 'none', padding: '10px 20px',
                  borderRadius: 12, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                  boxShadow: '0 4px 14px rgba(255, 107, 80, 0.35)', transition: 'transform 0.15s ease'
                }}
              >
                <span>+</span> Book a Pickup
              </button>
              <button
                onClick={() => navigateTo('home')}
                style={{
                  background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)',
                  padding: '10px 16px', borderRadius: 12, fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer'
                }}
              >
                ← Back to Home
              </button>
            </div>
          </div>

          {/* Account Sub-Navigation Tabs */}
          <div style={{ display: 'flex', gap: 8, marginTop: 28, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
            {accountTabs.map(tab => {
              const isActive = currentPage === tab.id || (tab.id === 'customer-dashboard' && (currentPage === 'customer-orders' || currentPage === 'customer-dashboard'));
              return (
                <button
                  key={tab.id}
                  onClick={() => navigateTo(tab.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
                    borderRadius: 10, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                    fontWeight: isActive ? 700 : 500, fontSize: '0.875rem',
                    background: isActive ? '#fff' : 'rgba(255,255,255,0.12)',
                    color: isActive ? '#0D7A75' : '#fff',
                    boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Account Content Container */}
      <div style={{ maxWidth: 1200, margin: '28px auto 0', padding: '0 20px' }}>
        {children}
      </div>
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
