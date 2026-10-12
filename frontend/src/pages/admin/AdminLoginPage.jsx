import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { useAuth } from '../../context/AuthContext';
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
  Loader2
} from 'lucide-react';

export const AdminLoginPage = () => {
  const { setIsAdminAuthenticated, setAdminTab } = useAdmin();
  const { login, sendPasswordReset, authError, clearError } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [resetSent, setResetSent] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handleSignIn = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    clearError();
    setIsSubmitting(true);

    try {
      const res = await login(email, password, rememberMe);
      const role = res?.role || 'customer';
      if (role === 'admin') {
        setIsAdminAuthenticated(true);
        setAdminTab('dashboard');
      } else {
        setErrorMessage('Access denied. This account does not possess administrator privileges.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Unable to sign in. Please verify your admin credentials.');
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
    <div className="admin-login-wrapper">
      <div className="admin-login-container">
        {/* Left Presentation Column */}
        <div className="login-left-col">
          <div className="login-brand-logo">
            <span className="logo-text">Laund<span className="logo-accent">rix</span></span>
          </div>

          <div className="login-hero-text">
            <h1 className="login-main-headline">
              Manage Laundry <br />
              <span className="text-teal">Operations</span> <br />
              With Ease.
            </h1>

            <p className="login-subtext">
              Control orders, pickups, deliveries, services and everything in one place with Firebase Cloud Firestore.
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

          {/* Fresh Towels Illustration */}
          <div className="login-visual-towels">
            <img 
              src="/assets/folded-towels.jpg" 
              alt="Fresh Towels" 
              className="login-towels-img"
            />
          </div>
        </div>

        {/* Right Authentication Card */}
        <div className="login-right-col">
          <div className="login-card-container animate-fade-in">
            <div className="login-card-brand">
              <span className="card-logo">Laund<span className="card-logo-acc">rix</span></span>
              <span className="admin-portal-tag">ADMIN PORTAL</span>
            </div>

            <h2 className="login-card-title">Welcome Back!</h2>
            <p className="login-card-sub">Sign in with Firebase to manage your laundry operations.</p>

            {errorMessage && (
              <div className="auth-alert-banner auth-alert-error">
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </div>
            )}

            {isForgotPasswordOpen ? (
              <form onSubmit={handleSendReset} className="login-form">
                <p className="reset-instruction-text">
                  Enter your admin email address and we'll send you a secure password reset link.
                </p>

                {resetSent ? (
                  <div className="auth-alert-banner auth-alert-success">
                    <CheckCircle2 size={16} />
                    <span>Password reset email has been sent! Check your inbox.</span>
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label">Admin Email Address</label>
                    <input 
                      type="email"
                      required
                      className="form-input"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="admin@fabricare.com"
                    />
                  </div>
                )}

                <div className="reset-actions-row mt-4">
                  {!resetSent && (
                    <button type="submit" className="btn btn-coral w-full" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Send Reset Link'}
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
                  <label className="form-label">Email Address</label>
                  <div className="login-input-wrap">
                    <input 
                      type="email"
                      required
                      className="form-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@fabricare.com"
                    />
                  </div>
                </div>

                <div className="form-group mt-3">
                  <label className="form-label">Password</label>
                  <div className="login-input-wrap">
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="form-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                    />
                    <button 
                      type="button" 
                      className="pwd-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
                    onClick={() => { setIsForgotPasswordOpen(true); setResetEmail(email); }}
                  >
                    Forgot Password?
                  </button>
                </div>

                <button type="submit" className="btn btn-coral w-full sign-in-btn" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={18} /> Signing In...</span>
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
                  onClick={handleSignIn}
                >
                  <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <div className="login-footer-text">
                  Don't have an admin account? <a href="#support" className="support-link" onClick={(e) => e.preventDefault()}>Contact Support</a>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .admin-login-wrapper {
          min-height: 100vh;
          background: linear-gradient(135deg, #F0FDFB 0%, #E6F7F5 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
        }

        .admin-login-container {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          max-width: 1100px;
          width: 100%;
          gap: 60px;
          align-items: center;
        }

        .login-brand-logo .logo-text {
          font-size: 2rem;
          font-weight: 800;
          color: #0D7A75;
          letter-spacing: -0.03em;
        }

        .login-brand-logo .logo-accent {
          color: #0E4B56;
        }

        .login-main-headline {
          font-size: 3rem;
          font-weight: 800;
          color: #111827;
          line-height: 1.15;
          letter-spacing: -0.03em;
          margin: 24px 0 16px;
        }

        .login-subtext {
          font-size: 1rem;
          color: #4B5563;
          margin-bottom: 32px;
          max-width: 440px;
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
        }

        .benefit-title {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #1E293B;
        }

        .benefit-desc {
          font-size: 0.75rem;
          color: #64748B;
        }

        .login-visual-towels {
          margin-top: 32px;
          width: 240px;
          height: 140px;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 12px 30px rgba(13, 122, 117, 0.12);
        }

        .login-towels-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .login-card-container {
          background: #FFFFFF;
          border: 1.5px solid #E2E8F0;
          border-radius: 28px;
          padding: 40px;
          box-shadow: 0 16px 48px rgba(13, 122, 117, 0.08);
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

        .admin-portal-tag {
          font-size: 0.6875rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #64748B;
          background: #F1F5F9;
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
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 0.8125rem;
          margin-bottom: 18px;
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

        .reset-instruction-text {
          font-size: 0.875rem;
          color: #475569;
          margin-bottom: 16px;
          line-height: 1.5;
        }

        .sign-in-btn {
          padding: 13px;
          font-size: 1rem;
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
        }

        .google-signin-btn:hover {
          background: #F8FAFC;
        }

        .login-footer-text {
          font-size: 0.8125rem;
          color: #64748B;
          text-align: center;
          margin-top: 24px;
        }

        .support-link {
          color: #0D7A75;
          font-weight: 700;
        }

        @media (max-width: 900px) {
          .admin-login-container {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          .login-visual-towels {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};
