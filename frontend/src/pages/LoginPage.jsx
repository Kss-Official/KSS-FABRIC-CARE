import React, { useState, useEffect } from 'react';
import { useAuth, getPortalForRole } from '../context/AuthContext';
import { useBooking } from '../context/BookingContext';
import { useAdmin } from '../context/AdminContext';
import {
  Package,
  Truck,
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
      <div className="login-back-to-home">
        <button 
          onClick={() => navigateTo('home')} 
          className="back-home-btn"
          aria-label="Back to Homepage"
        >
          <ArrowLeft size={16} />
          <span>Back to Homepage</span>
        </button>
      </div>

      <div className="login-page-container">
        {/* Left Presentation & Branding Column */}
        <div className="login-left-col">
          <div className="login-brand-logo" onClick={() => navigateTo('home')}>
            <span className="logo-text">Laund<span className="logo-accent">rix</span></span>
            <span className="logo-dot" />
          </div>

          <div className="login-hero-text">
            <h1 className="login-main-headline">
              Manage Laundry <br />
              <span className="text-teal">Operations</span> <br />
              With Ease.
            </h1>

            <p className="login-subtext">
              Control orders, pickups, deliveries, services and customer accounts in one place with real-time operational workflows.
            </p>

            <div className="login-benefits-list">
              <div className="login-benefit-item">
                <div className="benefit-icon-wrap">
                  <Package size={20} />
                </div>
                <div>
                  <h4 className="benefit-title">Track Orders</h4>
                  <p className="benefit-desc">From pickup to delivery</p>
                </div>
              </div>

              <div className="login-benefit-item">
                <div className="benefit-icon-wrap">
                  <Truck size={20} />
                </div>
                <div>
                  <h4 className="benefit-title">Manage Operations</h4>
                  <p className="benefit-desc">Keep everything on schedule</p>
                </div>
              </div>

              <div className="login-benefit-item">
                <div className="benefit-icon-wrap">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h4 className="benefit-title">Grow Your Business</h4>
                  <p className="benefit-desc">Serve more customers efficiently</p>
                </div>
              </div>
            </div>
          </div>

          {/* Fresh Towels Illustration matching screenshot reference */}
          <div className="login-visual-towels">
            <img 
              src="/assets/folded-towels.jpg" 
              alt="Fresh laundered towels" 
              className="login-towels-img"
              loading="eager"
            />
          </div>
        </div>

        {/* Right Authentication Card */}
        <div className="login-right-col">
          <div className="login-card-container animate-fade-in">
            <div className="login-card-brand">
              <span className="card-logo">Laund<span className="card-logo-acc">rix</span></span>
              <span className="secure-portal-tag">SECURE PORTAL</span>
            </div>

            <h2 className="login-card-title">Welcome Back!</h2>
            <p className="login-card-sub">
              Sign in with your FabriCare account to access your portal.
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
                      <input 
                        type="email"
                        required
                        className="form-input"
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
                    Email or Username
                  </label>
                  <div className="login-input-wrap">
                    <input 
                      id="login-identifier"
                      type="text"
                      required
                      className="form-input"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="e.g. rohan or admin@laundrix.com"
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div className="form-group mt-3">
                  <label className="form-label" htmlFor="login-password">
                    Password
                  </label>
                  <div className="login-input-wrap">
                    <input 
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="form-input"
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
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
                  Don't have an account?{' '}
                  <button 
                    type="button" 
                    className="support-link inline-btn"
                    onClick={() => navigateTo('home')}
                  >
                    Book a Pickup
                  </button>
                  <span className="dot-separator">•</span>
                  <a 
                    href="#support" 
                    className="support-link"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('For customer assistance, contact support@fabricare.com or call +91 98765 43210');
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

      <style>{`
        .login-page-wrapper {
          min-height: 100vh;
          background: linear-gradient(135deg, #F0FDFB 0%, #E6F7F5 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          position: relative;
        }

        .login-back-to-home {
          width: 100%;
          max-width: 1100px;
          margin-bottom: 20px;
        }

        .back-home-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          color: #475569;
          font-size: 0.8125rem;
          font-weight: 600;
          padding: 8px 16px;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
        }

        .back-home-btn:hover {
          color: #0D7A75;
          border-color: #0D7A75;
          background: #F0FDFB;
        }

        .login-page-container {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          max-width: 1100px;
          width: 100%;
          gap: 60px;
          align-items: center;
        }

        .login-brand-logo {
          display: flex;
          align-items: center;
          cursor: pointer;
          user-select: none;
        }

        .login-brand-logo .logo-text {
          font-size: 2.25rem;
          font-weight: 800;
          color: #0D7A75;
          letter-spacing: -0.03em;
        }

        .login-brand-logo .logo-accent {
          color: #0E4B56;
        }

        .login-brand-logo .logo-dot {
          width: 8px;
          height: 8px;
          background: #FF6B50;
          border-radius: 50%;
          margin-left: 3px;
          margin-top: 14px;
        }

        .login-main-headline {
          font-size: 3.125rem;
          font-weight: 800;
          color: #111827;
          line-height: 1.15;
          letter-spacing: -0.03em;
          margin: 24px 0 16px;
        }

        .text-teal {
          color: #0D7A75;
        }

        .login-subtext {
          font-size: 1rem;
          color: #4B5563;
          margin-bottom: 32px;
          max-width: 460px;
          line-height: 1.6;
        }

        .login-benefits-list {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .login-benefit-item {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .benefit-icon-wrap {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #FFFFFF;
          color: #0D7A75;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(13, 122, 117, 0.08);
          border: 1px solid #BCEAE6;
          flex-shrink: 0;
        }

        .benefit-title {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #1E293B;
          margin-bottom: 2px;
        }

        .benefit-desc {
          font-size: 0.75rem;
          color: #64748B;
        }

        .login-visual-towels {
          margin-top: 32px;
          width: 260px;
          height: 150px;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 12px 30px rgba(13, 122, 117, 0.12);
          border: 2px solid #FFFFFF;
        }

        .login-towels-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .login-card-container {
          background: #FFFFFF;
          border: 1.5px solid #E2E8F0;
          border-radius: 28px;
          padding: 40px;
          box-shadow: 0 20px 48px rgba(13, 122, 117, 0.08);
        }

        .login-card-brand {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .card-logo {
          font-size: 1.5rem;
          font-weight: 800;
          color: #0D7A75;
        }

        .card-logo-acc {
          color: #0E4B56;
        }

        .secure-portal-tag {
          font-size: 0.6875rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #0D7A75;
          background: #EBF8F7;
          border: 1px solid #BCEAE6;
          padding: 4px 10px;
          border-radius: 999px;
        }

        .login-card-title {
          font-size: 1.875rem;
          font-weight: 800;
          color: #111827;
          margin-bottom: 4px;
        }

        .login-card-sub {
          font-size: 0.875rem;
          color: #64748B;
          margin-bottom: 24px;
        }

        .auth-alert-banner {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 16px;
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

        .login-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .pwd-toggle-btn {
          position: absolute;
          right: 14px;
          background: none;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
        }

        .pwd-toggle-btn:hover {
          color: #475569;
        }

        .login-options-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 16px 0 24px;
          font-size: 0.8125rem;
        }

        .remember-checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          color: #475569;
          font-weight: 500;
        }

        .custom-checkbox {
          accent-color: #0D7A75;
          width: 16px;
          height: 16px;
          cursor: pointer;
        }

        .forgot-pwd-btn-link {
          background: none;
          border: none;
          color: #0D7A75;
          font-weight: 600;
          cursor: pointer;
          font-size: 0.8125rem;
          padding: 0;
        }

        .forgot-pwd-btn-link:hover {
          text-decoration: underline;
        }

        .sign-in-btn {
          padding: 13px;
          font-size: 1rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .login-or-divider {
          display: flex;
          align-items: center;
          text-align: center;
          margin: 20px 0;
          color: #94A3B8;
          font-size: 0.75rem;
        }

        .login-or-divider::before, .login-or-divider::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid #E2E8F0;
        }

        .login-or-divider span {
          padding: 0 12px;
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.05em;
        }

        .google-signin-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border: 1.5px solid #E2E8F0;
          color: #1E293B;
          font-weight: 600;
          padding: 11px;
          border-radius: 12px;
          background: #FFFFFF;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .google-signin-btn:hover {
          background: #F8FAFC;
          border-color: #CBD5E1;
        }

        .login-footer-text {
          font-size: 0.8125rem;
          color: #64748B;
          text-align: center;
          margin-top: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .support-link {
          color: #0D7A75;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
        }

        .support-link:hover {
          text-decoration: underline;
        }

        .inline-btn {
          background: none;
          border: none;
          padding: 0;
          font-size: inherit;
        }

        .dot-separator {
          color: #CBD5E1;
        }

        .reset-instruction-text {
          font-size: 0.875rem;
          color: #475569;
          margin-bottom: 16px;
          line-height: 1.5;
        }

        @media (max-width: 900px) {
          .login-page-container {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          .login-left-col {
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .login-brand-logo {
            justify-content: center;
          }
          .login-main-headline {
            font-size: 2.25rem;
            margin: 16px 0 12px;
          }
          .login-subtext {
            font-size: 0.9375rem;
            margin-bottom: 24px;
          }
          .login-benefits-list {
            display: none;
          }
          .login-visual-towels {
            display: none;
          }
          .login-card-container {
            padding: 28px 20px;
            border-radius: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
