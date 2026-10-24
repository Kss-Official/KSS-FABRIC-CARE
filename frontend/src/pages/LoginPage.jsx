import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getPortalForRole, normalizeRole } from '../utils/roleUtils';
import { useBooking } from '../context/BookingContext';
import { useAdmin } from '../context/AdminContext';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export const LoginPage = () => {
  const { login, loginWithGoogle, sendPasswordReset, authError, clearError, isAuthenticated, userRole } = useAuth();
  const { navigateTo } = useBooking();
  const { setIsAdminAuthenticated, setAdminTab } = useAdmin();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  // If already authenticated and not in middle of submit, redirect to destination portal immediately
  useEffect(() => {
    if (isAuthenticated && !isSubmitting) {
      if (userRole === 'admin') {
        setIsAdminAuthenticated(true);
        setAdminTab('dashboard');
      }
      navigateTo(getPortalForRole(userRole));
    }
  }, [isAuthenticated, userRole, isSubmitting, setIsAdminAuthenticated, setAdminTab, navigateTo]);

  const handleSignIn = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    clearError();
    setIsSubmitting(true);

    try {
      const result = await login(identifier, password, true);
      const role = normalizeRole(result?.role || result?.user?.role || 'customer');

      if (role === 'admin') {
        setIsAdminAuthenticated(true);
        setAdminTab('dashboard');
        navigateTo('admin');
      } else if (role === 'agent') {
        navigateTo('delivery-portal');
      } else if (role === 'staff') {
        navigateTo('laundry-portal');
      } else {
        const intended = sessionStorage.getItem('fabricare_intended_destination');
        if (intended) {
          sessionStorage.removeItem('fabricare_intended_destination');
          navigateTo(intended);
        } else {
          navigateTo('customer-dashboard');
        }
      }
    } catch (err) {
      setErrorMessage(err.message || 'Invalid email or password. Please try again.');
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
      } else {
        const intended = sessionStorage.getItem('fabricare_intended_destination');
        if (intended) {
          sessionStorage.removeItem('fabricare_intended_destination');
          navigateTo(intended);
        } else {
          navigateTo('customer-dashboard');
        }
      }
    } catch (err) {
      setErrorMessage(err.message || 'Google sign-in could not be completed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAppleSignIn = () => {
    setErrorMessage('Apple ID authentication is currently supported on iOS devices.');
  };

  const handleFacebookSignIn = () => {
    setErrorMessage('Facebook login will be enabled in the upcoming update.');
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
    <div className="auth-page-root">
      <div className="auth-split-layout login-layout">
        {/* LEFT COLUMN: Form Panel matching Reference Image */}
        <div className="auth-form-panel">
          <div className="auth-form-container">
            {isForgotPasswordOpen ? (
              /* Forgot Password View */
              <div className="auth-reset-view">
                <h1 className="auth-headline">Reset Password</h1>
                <p className="auth-subheadline">
                  Enter your registered email address to receive password reset instructions.
                </p>

                {errorMessage && (
                  <div className="auth-alert-message error">
                    <AlertCircle size={15} />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {resetSent ? (
                  <div className="auth-alert-message success">
                    <CheckCircle2 size={16} />
                    <span>Password reset email sent! Please check your inbox.</span>
                  </div>
                ) : (
                  <form onSubmit={handleSendReset} className="auth-form-body">
                    <div className="auth-field-row">
                      <label className="auth-label">Email Address</label>
                      <div className="auth-input-wrapper">
                        <Mail size={16} className="auth-field-icon" />
                        <input
                          type="email"
                          required
                          className="auth-input-control"
                          placeholder="Enter your email address"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          disabled={isSubmitting}
                          autoFocus
                        />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      className="auth-primary-action-btn" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className="btn-spinner-flex">
                          <Loader2 size={16} className="animate-spin" />
                          <span>Sending Link...</span>
                        </span>
                      ) : (
                        <>
                          <span>Send Reset Link</span>
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </form>
                )}

                <div className="auth-switch-prompt" style={{ marginTop: '22px' }}>
                  <button
                    type="button"
                    className="auth-text-link"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    onClick={() => {
                      setIsForgotPasswordOpen(false);
                      setResetSent(false);
                      setErrorMessage(null);
                    }}
                  >
                    <ArrowLeft size={14} /> Back to Sign In
                  </button>
                </div>
              </div>
            ) : (
              /* Standard Log In View */
              <div>
                <h1 className="auth-headline">Welcome Back</h1>
                <p className="auth-subheadline">Sign in to continue to FabriCare</p>

                {/* Social Buttons Row (Google, Apple, Facebook) */}
                <div className="auth-social-row">
                  {/* Google */}
                  <button
                    type="button"
                    className="auth-social-button"
                    onClick={handleGoogleSignIn}
                    disabled={isSubmitting}
                    title="Sign in with Google"
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                  </button>

                  {/* Apple */}
                  <button
                    type="button"
                    className="auth-social-button"
                    onClick={handleAppleSignIn}
                    disabled={isSubmitting}
                    title="Sign in with Apple"
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="#000000">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.99.6-2.63 1.35-.57.66-.99 1.73-.86 2.76 1.01.08 2.03-.51 2.56-1.26z"/>
                    </svg>
                  </button>

                  {/* Facebook */}
                  <button
                    type="button"
                    className="auth-social-button"
                    onClick={handleFacebookSignIn}
                    disabled={isSubmitting}
                    title="Sign in with Facebook"
                  >
                    <svg viewBox="0 0 24 24" width="22" height="22">
                      <circle cx="12" cy="12" r="12" fill="#1877F2"/>
                      <path fill="#FFFFFF" d="M14.5 12h-2v7h-3v-7h-1.5v-2.5h1.5v-1.7c0-2 1.2-3.3 3.2-3.3.96 0 1.8.07 1.8.07v2.2h-1c-1 0-1.5.6-1.5 1.3v1.43h2.5l-.5 2.5z"/>
                    </svg>
                  </button>
                </div>

                {/* OR Divider */}
                <div className="auth-separator">
                  <span className="sep-line"></span>
                  <span className="sep-label">OR</span>
                  <span className="sep-line"></span>
                </div>

                {/* Error Banner */}
                {(errorMessage || authError) && (
                  <div className="auth-alert-message error" role="alert">
                    <AlertCircle size={15} />
                    <span>{errorMessage || authError}</span>
                  </div>
                )}

                {/* Main Sign In Form */}
                <form onSubmit={handleSignIn} className="auth-form-body">
                  {/* Field: Email */}
                  <div className="auth-field-row">
                    <label className="auth-label">Email Address</label>
                    <div className="auth-input-wrapper">
                      <Mail size={16} className="auth-field-icon" />
                      <input
                        type="text"
                        required
                        className="auth-input-control"
                        placeholder="Enter your email address"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        disabled={isSubmitting}
                        autoComplete="username"
                      />
                    </div>
                  </div>

                  {/* Field: Password */}
                  <div className="auth-field-row">
                    <label className="auth-label">Password</label>
                    <div className="auth-input-wrapper">
                      <Lock size={16} className="auth-field-icon" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        className="auth-input-control"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isSubmitting}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="auth-input-action-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Forgot Password Link */}
                  <div className="auth-extra-row right">
                    <button
                      type="button"
                      className="auth-forgot-btn"
                      onClick={() => {
                        setIsForgotPasswordOpen(true);
                        setResetEmail(identifier.includes('@') ? identifier : '');
                      }}
                    >
                      Forgot Password?
                    </button>
                  </div>

                  {/* Primary Button: Teal matching Reference Image */}
                  <button
                    type="submit"
                    className="auth-primary-action-btn"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="btn-spinner-flex">
                        <Loader2 size={16} className="animate-spin" />
                        <span>Signing In...</span>
                      </span>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight size={17} />
                      </>
                    )}
                  </button>
                </form>

                {/* Footer Switch Prompt */}
                <div className="auth-switch-prompt">
                  <span>Don't have an account?</span>
                  <button
                    type="button"
                    className="auth-text-link"
                    onClick={() => navigateTo('signup')}
                  >
                    Sign Up
                  </button>
                </div>

                {/* Quick Demo Access Pills */}
                <div className="auth-quick-demo-container">
                  <div className="auth-quick-demo-divider">
                    <span>Quick Demo Logins</span>
                  </div>
                  <div className="auth-quick-demo-chips">
                    <button
                      type="button"
                      className="auth-demo-chip delivery"
                      onClick={() => {
                        setIdentifier('delivery@fabricare.com');
                        setPassword('Test@1234');
                      }}
                      title="Quick fill Delivery Agent login"
                    >
                      <span className="demo-chip-icon">🛵</span>
                      <span>Delivery Agent</span>
                    </button>
                    <button
                      type="button"
                      className="auth-demo-chip admin"
                      onClick={() => {
                        setIdentifier('admin@fabricare.com');
                        setPassword('Test@1234');
                      }}
                      title="Quick fill Admin login"
                    >
                      <span className="demo-chip-icon">👑</span>
                      <span>Admin</span>
                    </button>
                    <button
                      type="button"
                      className="auth-demo-chip staff"
                      onClick={() => {
                        setIdentifier('staff@fabricare.com');
                        setPassword('Test@1234');
                      }}
                      title="Quick fill Laundry Staff login"
                    >
                      <span className="demo-chip-icon">👔</span>
                      <span>Staff</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Visual Artwork matching Reference Image */}
        <div 
          className="auth-artwork-panel right-side" 
          onClick={() => navigateTo('home')}
          title="Return to FabriCare Home"
        >
          <img 
            src="/assets/fabricare-visual-login.png" 
            alt="FabriCare Premium Laundry" 
            className="auth-artwork-image"
            loading="eager"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/assets/login-artwork-hd.png';
            }}
          />
        </div>
      </div>

      {/* Scoped CSS with Exact Matching Colors and Layout */}
      <style>{`
        .auth-page-root {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #F4F6F8;
          padding: 24px 16px;
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }

        .auth-split-layout {
          width: 100%;
          max-width: 1040px;
          min-height: 640px;
          background: #FFFFFF;
          border-radius: 28px;
          box-shadow: 0 16px 45px -10px rgba(0, 0, 0, 0.08), 0 2px 10px rgba(0, 0, 0, 0.03);
          display: flex;
          overflow: hidden;
          box-sizing: border-box;
        }

        /* Form Column on Left */
        .auth-form-panel {
          flex: 0 0 49%;
          background: #FFFFFF;
          padding: 44px 44px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          box-sizing: border-box;
          position: relative;
        }

        /* Artwork Column on Right */
        .auth-artwork-panel.right-side {
          flex: 0 0 51%;
          position: relative;
          background: #E8F4F8;
          min-height: 600px;
          cursor: pointer;
          overflow: hidden;
          text-align: right;
          display: flex;
          align-items: flex-start;
          justify-content: flex-end;
        }

        .auth-artwork-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: right top !important;
          display: block;
          transition: transform 0.4s ease;
        }

        .auth-artwork-panel:hover .auth-artwork-image {
          transform: scale(1.015);
        }

        /* Form Container */
        .auth-form-container {
          width: 100%;
          max-width: 370px;
          margin: 0 auto;
        }

        .auth-headline {
          font-size: 1.875rem;
          font-weight: 700;
          color: #0F172A;
          margin: 0 0 6px 0;
          letter-spacing: -0.02em;
        }

        .auth-subheadline {
          font-size: 0.875rem;
          color: #64748B;
          margin: 0 0 24px 0;
        }

        /* Social Row */
        .auth-social-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .auth-social-button {
          flex: 1;
          height: 44px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .auth-social-button:hover:not(:disabled) {
          border-color: #CBD5E1;
          background: #F8FAFC;
          transform: translateY(-1px);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
        }

        .auth-social-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Separator */
        .auth-separator {
          display: flex;
          align-items: center;
          margin: 18px 0 20px 0;
          gap: 14px;
        }

        .sep-line {
          flex: 1;
          height: 1px;
          background: #E2E8F0;
        }

        .sep-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #94A3B8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Alerts */
        .auth-alert-message {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 0.8125rem;
          margin-bottom: 16px;
        }

        .auth-alert-message.error {
          background: #FEF2F2;
          color: #DC2626;
          border: 1px solid #FEE2E2;
        }

        .auth-alert-message.success {
          background: #F0FDF4;
          color: #16A34A;
          border: 1px solid #DCFCE7;
        }

        /* Form Body */
        .auth-form-body {
          display: flex;
          flex-direction: column;
          gap: 14px;
          width: 100%;
        }

        .auth-field-row {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .auth-label {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #1E293B;
          text-align: left;
        }

        .auth-input-wrapper {
          display: flex;
          align-items: center;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          height: 46px;
          padding: 0 14px;
          background: #FFFFFF;
          box-sizing: border-box;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .auth-input-wrapper:focus-within {
          border-color: #017C9E;
          box-shadow: 0 0 0 3px rgba(1, 124, 158, 0.12);
        }

        .auth-field-icon {
          color: #94A3B8;
          flex-shrink: 0;
          margin-right: 10px;
        }

        .auth-input-control {
          border: none;
          outline: none;
          background: transparent;
          width: 100%;
          font-size: 0.875rem;
          color: #0F172A;
          padding: 0;
        }

        .auth-input-control::placeholder {
          color: #94A3B8;
          font-size: 0.875rem;
        }

        .auth-input-action-btn {
          background: none;
          border: none;
          padding: 4px;
          color: #94A3B8;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.15s ease;
        }

        .auth-input-action-btn:hover {
          color: #475569;
        }

        /* Forgot Password */
        .auth-extra-row.right {
          display: flex;
          justify-content: flex-end;
          text-align: right;
          margin-top: -2px;
          margin-bottom: 2px;
        }

        .auth-forgot-btn {
          background: none;
          border: none;
          color: #017C9E;
          font-size: 0.8125rem;
          font-weight: 500;
          cursor: pointer;
          padding: 0;
          text-align: right;
          transition: color 0.15s ease;
        }

        .auth-forgot-btn:hover {
          text-decoration: underline;
          color: #016885;
        }

        /* Primary Teal Button matching Reference Image */
        .auth-primary-action-btn {
          width: 100%;
          height: 46px;
          background: #017C9E;
          color: #FFFFFF;
          border: none;
          border-radius: 8px;
          font-size: 0.9375rem;
          font-weight: 600;
          cursor: pointer;
          margin-top: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 10px rgba(1, 124, 158, 0.18);
          transition: background 0.15s ease, transform 0.05s ease, box-shadow 0.15s ease;
        }

        .auth-primary-action-btn:hover:not(:disabled) {
          background: #016885;
          box-shadow: 0 6px 14px rgba(1, 124, 158, 0.28);
          transform: translateY(-1px);
        }

        .auth-primary-action-btn:active:not(:disabled) {
          transform: translateY(1px);
        }

        .auth-primary-action-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .btn-spinner-flex {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* Switch Prompt */
        .auth-switch-prompt {
          text-align: center;
          margin-top: 24px;
          font-size: 0.84375rem;
          color: #64748B;
        }

        .auth-text-link {
          color: #017C9E;
          font-weight: 600;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          margin-left: 6px;
          font-size: 0.84375rem;
          transition: color 0.15s ease;
        }

        .auth-text-link:hover {
          text-decoration: underline;
          color: #016885;
        }

        /* Quick Demo Logins Section */
        .auth-quick-demo-container {
          margin-top: 22px;
          padding-top: 16px;
          border-top: 1px dashed #E2E8F0;
          text-align: center;
        }

        .auth-quick-demo-divider {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #94A3B8;
          margin-bottom: 10px;
        }

        .auth-quick-demo-chips {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .auth-demo-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 9999px;
          padding: 6px 13px;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
          transition: all 0.2s ease;
          user-select: none;
        }

        .auth-demo-chip:hover {
          background: #017C9E;
          color: #FFFFFF;
          border-color: #017C9E;
          transform: translateY(-1px);
          box-shadow: 0 4px 10px -2px rgba(1, 124, 158, 0.25);
        }

        .demo-chip-icon {
          font-size: 0.95rem;
        }

        /* Responsive Breakpoints */
        @media (max-width: 880px) {
          .auth-split-layout {
            flex-direction: column-reverse;
            max-width: 480px;
            border-radius: 20px;
          }

          .auth-form-panel {
            padding: 32px 24px;
            flex: none;
          }

          .auth-artwork-panel.right-side {
            height: 320px;
            min-height: 320px;
            max-height: 360px;
            flex: none;
            width: 100%;
          }

          .auth-artwork-image {
            object-position: right top !important;
          }
        }

        @media (max-width: 480px) {
          .auth-page-root {
            padding: 12px;
          }

          .auth-artwork-panel.right-side {
            height: 260px;
            min-height: 260px;
          }

          .auth-form-panel {
            padding: 24px 18px;
          }

          .auth-headline {
            font-size: 1.625rem;
          }
        }
      `}</style>
    </div>
  );
};
export default LoginPage;
