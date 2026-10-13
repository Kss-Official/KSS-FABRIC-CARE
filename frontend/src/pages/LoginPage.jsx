import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getPortalForRole } from '../utils/roleUtils';
import { useBooking } from '../context/BookingContext';
import { useAdmin } from '../context/AdminContext';
import {
  Package,
  Truck,
  BarChart2,
  BarChart3,
  TrendingUp,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Mail,
  Lock,
  User,
  ArrowLeft
} from 'lucide-react';

export const LoginPage = () => {
  const { login, loginWithGoogle, sendPasswordReset, authError, clearError, isAuthenticated, userRole } = useAuth();
  const { navigateTo } = useBooking();
  const { setIsAdminAuthenticated, setAdminTab } = useAdmin();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  // If already authenticated, redirect to destination portal immediately
  useEffect(() => {
    if (isAuthenticated) {
      if (userRole === 'admin') {
        setIsAdminAuthenticated(true);
        setAdminTab('dashboard');
      }
      navigateTo(getPortalForRole(userRole));
    }
  }, [isAuthenticated, userRole]);

  const handleSignIn = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    clearError();
    setIsSubmitting(true);

    try {
      const result = await login(identifier, password, rememberMe);
      const role = result?.role || 'customer';

      if (role === 'admin') {
        setIsAdminAuthenticated(true);
        setAdminTab('dashboard');
        navigateTo('admin');
      } else if (role === 'delivery_agent') {
        navigateTo('delivery-portal');
      } else if (role === 'laundry_staff') {
        navigateTo('laundry-portal');
      } else {
        const intended = sessionStorage.getItem('fabricare_intended_destination');
        if (intended) {
          sessionStorage.removeItem('fabricare_intended_destination');
          navigateTo(intended);
        } else {
          navigateTo('home');
        }
      }
    } catch (err) {
      setErrorMessage(err.message || 'Unable to sign in. Please verify your email/username and password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    clearError();
    setIsSubmitting(true);
    try {
      const result = await loginWithGoogle();
      const role = result?.role || 'customer';
      if (role === 'admin') {
        setIsAdminAuthenticated(true);
        setAdminTab('dashboard');
        navigateTo('admin');
      } else if (role === 'delivery_agent') {
        navigateTo('delivery-portal');
      } else if (role === 'laundry_staff') {
        navigateTo('laundry-portal');
      } else {
        const intended = sessionStorage.getItem('fabricare_intended_destination');
        if (intended) {
          sessionStorage.removeItem('fabricare_intended_destination');
          navigateTo(intended);
        } else {
          navigateTo('home');
        }
      }
    } catch (err) {
      setErrorMessage(err.message || 'Google sign-in was not completed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReset = async (e) => {
    e.preventDefault();
    if (!resetEmail) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await sendPasswordReset(resetEmail);
      setResetSent(true);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to send password reset email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      {/* Top Left Global Brand Logo matching reference Image 2 */}
      <div className="login-top-logo" onClick={() => navigateTo('home')}>
        <span className="logo-text">Fabri<span className="logo-accent">Care</span></span>
      </div>

      <div className="login-page-container">
        {/* Left Presentation & Branding Column */}
        <div className="login-left-col">
          <div className="login-hero-text">
            <h1 className="login-main-headline">
              Manage Laundry <br />
              Operations <br />
              <span className="text-teal">With Ease.</span>
            </h1>

            <p className="login-subtext">
              Control orders, pickups, deliveries, services and everything in one place.
            </p>

            <div className="login-features-list">
              <div className="login-benefit-item">
                <Package size={22} className="benefit-icon" strokeWidth={1.8} />
                <div className="benefit-text-wrap">
                  <h4 className="benefit-title">Track Orders</h4>
                  <p className="benefit-desc">From pickup to delivery</p>
                </div>
              </div>

              <div className="login-benefit-item">
                <Truck size={22} className="benefit-icon" strokeWidth={1.8} />
                <div className="benefit-text-wrap">
                  <h4 className="benefit-title">Manage Operations</h4>
                  <p className="benefit-desc">Keep everything on schedule</p>
                </div>
              </div>

              <div className="login-benefit-item">
                <BarChart2 size={22} className="benefit-icon" strokeWidth={1.8} />
                <div className="benefit-text-wrap">
                  <h4 className="benefit-title">Grow Your Business</h4>
                  <p className="benefit-desc">Serve more customers efficiently</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Authentication Card with Towels tucked directly beneath */}
        <div className="login-right-col">
          <div className="login-card-wrapper">
            {/* Folded Towels with Green Leaves Imagery tucked beneath the card */}
            <div className="login-visual-towels">
              <img 
                src="/assets/reference_towels_transparent.png?v=7" 
                alt="Fresh laundered towels" 
                className="login-towels-img"
                loading="eager"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/assets/reference_towels_cleaned.png';
                }}
              />
            </div>

            <div className="login-card-container animate-fade-in">
              {/* Centered Top Brand & Role */}
              <div className="login-card-brand">
              <span className="card-logo">Fabri<span className="card-logo-acc">Care</span></span>
              <span className="card-role-label">ADMIN PORTAL</span>
            </div>

            <h2 className="login-card-title">Welcome Back!</h2>
            <p className="login-card-sub">
              Sign in to manage your laundry operations.
            </p>

            {(errorMessage || authError) && (
              <div className="auth-alert-banner auth-alert-error" role="alert">
                <AlertCircle size={18} className="flex-shrink-0" />
                <span>{errorMessage || authError}</span>
              </div>
            )}

            {isForgotPasswordOpen ? (
              <form onSubmit={handleSendReset} className="login-form">
                <p className="reset-instruction-text">
                  Enter your registered email address and we'll send you a secure password reset link.
                </p>

                {resetSent ? (
                  <div className="auth-alert-banner auth-alert-success">
                    <CheckCircle2 size={18} className="flex-shrink-0" />
                    <span>Password reset email has been sent! Check your inbox.</span>
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <div className="login-input-wrap">
                      <Mail size={17} className="input-field-icon" />
                      <input 
                        type="email"
                        required
                        className="form-input with-icon"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="e.g. name@example.com"
                        autoFocus
                      />
                    </div>
                  </div>
                )}

                <div className="reset-actions-row mt-4">
                  {!resetSent && (
                    <button type="submit" className="btn btn-coral w-full sign-in-btn" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="animate-spin" size={18} /> Sending Link...
                        </span>
                      ) : (
                        'Send Reset Link'
                      )}
                    </button>
                  )}
                  <button 
                    type="button" 
                    className="btn btn-white w-full mt-2" 
                    style={{ borderRadius: '999px', padding: '11px 0' }}
                    onClick={() => { setIsForgotPasswordOpen(false); setResetSent(false); setErrorMessage(null); }}
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSignIn} className="login-form">
                <div className="form-group">
                  <label className="form-label" htmlFor="login-identifier">
                    Email Address
                  </label>
                  <div className="login-input-wrap">
                    <Mail size={17} className="input-field-icon" />
                    <input 
                      id="login-identifier"
                      type="text"
                      required
                      className="form-input with-icon"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="admin@fabricare.com"
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div className="form-group mt-3">
                  <label className="form-label" htmlFor="login-password">
                    Password
                  </label>
                  <div className="login-input-wrap">
                    <Lock size={17} className="input-field-icon" />
                    <input 
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="form-input with-icon with-right-btn"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                    />
                    <button 
                      type="button" 
                      className="pwd-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                <div className="login-options-row">
                  <label className="remember-checkbox-label">
                    <input 
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="custom-checkbox"
                    />
                    <span>Remember me</span>
                  </label>

                  <button 
                    type="button" 
                    className="forgot-pwd-btn-link"
                    onClick={() => { setIsForgotPasswordOpen(true); setResetEmail(identifier.includes('@') ? identifier : ''); }}
                  >
                    Forgot Password?
                  </button>
                </div>

                <button 
                  id="login-submit-btn"
                  type="submit" 
                  className="btn btn-coral w-full sign-in-btn" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin" size={18} /> Signing In...
                    </span>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>

                <div className="login-or-divider">
                  <span>or</span>
                </div>

                <button 
                  type="button" 
                  className="btn btn-white w-full google-signin-btn"
                  onClick={handleGoogleSignIn}
                  disabled={isSubmitting}
                >
                  <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <div className="login-footer-text">
                  Don't have an admin account?{' '}
                  <a 
                    href="#support" 
                    className="support-link"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('For administrative assistance or account provisioning, contact support@fabricare.com or call +91 98765 43210');
                    }}
                  >
                    Contact Support
                  </a>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
      </div>

      <style>{`
        .login-page-wrapper {
          min-height: 100vh;
          background-color: #EDFAF8;
          background-image: radial-gradient(circle at 18% 45%, #F4FEFD 0%, #EBF8F6 50%, #DFF4F0 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 36px;
          position: relative;
          overflow-x: hidden;
          font-family: inherit;
        }

        .login-page-container {
          display: grid;
          grid-template-columns: 1.18fr 0.82fr;
          max-width: 1180px;
          width: 100%;
          gap: 52px;
          align-items: center;
        }

        .login-left-col {
          display: flex;
          flex-direction: column;
        }

        .login-top-logo {
          position: absolute;
          top: 36px;
          left: 56px;
          display: inline-flex;
          align-items: center;
          cursor: pointer;
          user-select: none;
          z-index: 10;
        }

        .login-top-logo .logo-text {
          font-family: 'Poppins', sans-serif;
          font-size: 2.125rem;
          font-weight: 850;
          color: #000000;
          letter-spacing: -0.03em;
        }

        .login-top-logo .logo-accent {
          color: #087F8C;
        }

        .login-main-headline {
          font-family: 'Poppins', sans-serif;
          font-weight: 800;
          font-size: 57.6px;
          line-height: 57.6px;
          letter-spacing: -1.44px;
          color: #0F172A;
          margin: 0 0 16px;
          max-width: 580px;
        }

        .text-teal {
          color: #0D7A75;
        }

        .login-subtext {
          font-size: 1rem;
          color: #475569;
          margin-bottom: 24px;
          max-width: 480px;
          line-height: 1.55;
        }

        .login-features-list {
          display: flex;
          flex-direction: column;
          gap: 18px;
          margin-top: 6px;
          max-width: 240px;
        }

        .login-benefit-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .benefit-icon {
          color: #0D7A75;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .benefit-text-wrap {
          display: flex;
          flex-direction: column;
        }

        .benefit-title {
          font-size: 0.9rem;
          font-weight: 750;
          color: #0F172A;
          margin: 0 0 1px;
          line-height: 1.25;
        }

        .benefit-desc {
          font-size: 0.8rem;
          color: #64748B;
          margin: 0;
          line-height: 1.35;
        }

        .login-right-col {
          display: flex;
          justify-content: center;
          width: 100%;
          position: relative;
        }

        .login-card-wrapper {
          position: relative;
          width: 100%;
          max-width: 440px;
        }

        .login-card-container {
          position: relative;
          z-index: 5;
          background: #FFFFFF;
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 28px;
          padding: 44px 38px;
          box-shadow: 0 24px 60px rgba(13, 122, 117, 0.1), 0 4px 12px rgba(0, 0, 0, 0.03);
          width: 100%;
        }

        .login-visual-towels {
          position: absolute;
          right: calc(100% - 50px);
          bottom: -8px;
          width: 410px;
          max-width: 430px;
          pointer-events: none;
          z-index: 2;
        }

        .login-towels-img {
          width: 100%;
          height: auto;
          display: block;
          object-fit: contain;
          filter: drop-shadow(0 14px 28px rgba(13, 122, 117, 0.09));
        }

        .login-card-brand {
          text-align: center;
          margin-bottom: 6px;
        }

        .card-logo {
          font-family: 'Poppins', sans-serif;
          font-size: 1.625rem;
          font-weight: 850;
          color: #000000;
          letter-spacing: -0.02em;
        }

        .card-logo-acc {
          color: #087F8C;
        }

        .card-role-label {
          display: block;
          font-size: 0.6875rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          color: #64748B;
          text-transform: uppercase;
          margin-top: 4px;
        }

        .login-card-title {
          font-size: 1.75rem;
          font-weight: 850;
          color: #0F172A;
          text-align: center;
          margin: 14px 0 4px;
          letter-spacing: -0.02em;
        }

        .login-card-sub {
          font-size: 0.875rem;
          color: #64748B;
          text-align: center;
          margin-bottom: 24px;
        }

        .auth-alert-banner {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 12px;
          font-size: 0.8125rem;
          line-height: 1.4;
          margin-bottom: 20px;
        }

        .auth-alert-error {
          background: #FEF2F2;
          color: #991B1B;
          border: 1px solid #F87171;
        }

        .auth-alert-success {
          background: #F0FDF4;
          color: #166534;
          border: 1px solid #86EFAC;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-label {
          display: block;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 6px;
        }

        .login-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .input-field-icon {
          position: absolute;
          left: 14px;
          color: #94A3B8;
          pointer-events: none;
        }

        .form-input {
          width: 100%;
          border: 1.5px solid #E2E8F0 !important;
          border-radius: 12px;
          font-size: 0.875rem;
          color: #0F172A;
          background: #FFFFFF !important;
          padding: 12px 14px;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }

        .form-input:-webkit-autofill,
        .form-input:-webkit-autofill:hover, 
        .form-input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0px 1000px #FFFFFF inset !important;
          -webkit-text-fill-color: #0F172A !important;
          transition: background-color 5000s ease-in-out 0s;
        }

        .form-input.with-icon {
          padding-left: 42px;
        }

        .form-input.with-right-btn {
          padding-right: 44px;
        }

        .form-input:focus {
          border-color: #0D7A75 !important;
          box-shadow: 0 0 0 3.5px rgba(13, 122, 117, 0.12) !important;
          outline: none;
        }

        .form-input::placeholder {
          color: #94A3B8;
        }

        .pwd-toggle-btn {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          transition: color 0.15s ease;
        }

        .pwd-toggle-btn:hover {
          color: #475569;
        }

        .login-options-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 16px 0 22px;
          font-size: 0.8125rem;
        }

        .remember-checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          color: #475569;
          font-weight: 500;
          user-select: none;
        }

        .custom-checkbox {
          accent-color: #0D7A75;
          width: 16px;
          height: 16px;
          cursor: pointer;
          border-radius: 4px;
        }

        .forgot-pwd-btn-link {
          background: none;
          border: none;
          color: #0D7A75;
          font-weight: 600;
          cursor: pointer;
          font-size: 0.8125rem;
          padding: 0;
          transition: opacity 0.15s ease;
        }

        .forgot-pwd-btn-link:hover {
          text-decoration: underline;
        }

        .sign-in-btn {
          background: linear-gradient(135deg, #FF6447 0%, #FF5030 100%);
          color: #FFFFFF;
          border-radius: 999px;
          padding: 13px 0;
          font-size: 0.9375rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: none;
          box-shadow: 0 8px 22px rgba(255, 100, 71, 0.38);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .sign-in-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 10px 26px rgba(255, 100, 71, 0.44);
        }

        .login-or-divider {
          display: flex;
          align-items: center;
          text-align: center;
          margin: 10px 0;
          color: #94A3B8;
          font-size: 0.75rem;
        }

        .login-or-divider::before, .login-or-divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid #E2E8F0;
        }

        .login-or-divider span {
          padding: 0 10px;
          color: #94A3B8;
          font-size: 0.75rem;
        }

        .google-signin-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border: 1.5px solid #E2E8F0;
          color: #1E293B;
          font-weight: 600;
          font-size: 0.875rem;
          padding: 11px;
          border-radius: 999px;
          background: #FFFFFF;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
        }

        .google-signin-btn:hover:not(:disabled) {
          background: #F8FAFC;
          border-color: #CBD5E1;
        }

        .login-footer-text {
          font-size: 0.8125rem;
          color: #64748B;
          text-align: center;
          margin-top: 20px;
        }

        .support-link {
          color: #0D7A75;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
          transition: opacity 0.15s ease;
        }

        .support-link:hover {
          text-decoration: underline;
        }

        .reset-instruction-text {
          font-size: 0.875rem;
          color: #475569;
          margin-bottom: 16px;
          line-height: 1.5;
        }

        @media (max-width: 1024px) {
          .login-top-logo {
            position: static;
            margin-bottom: 24px;
            justify-content: center;
            display: flex;
          }
          .login-page-container {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          .login-left-col {
            text-align: center;
            align-items: center;
          }
          .login-main-headline {
            font-size: 42px;
            line-height: 44px;
            letter-spacing: -1px;
          }
          .login-subtext {
            max-width: 100%;
          }
          .login-features-list {
            align-items: center;
            margin: 0 auto;
          }
          .login-visual-towels {
            position: static;
            width: 100%;
            max-width: 320px;
            margin: 0 auto 20px;
            display: block;
          }
        }

        @media (max-width: 640px) {
          .login-page-wrapper {
            padding: 32px 16px;
          }
          .login-main-headline {
            font-size: 32px;
            line-height: 34px;
            letter-spacing: -0.8px;
          }
          .login-visual-towels {
            width: 100%;
            max-width: 280px;
            height: auto;
          }
          .login-card-container {
            padding: 32px 20px;
            border-radius: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;

