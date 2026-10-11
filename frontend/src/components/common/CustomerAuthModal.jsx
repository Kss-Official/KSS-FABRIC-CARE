import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Mail, Lock, User, Phone, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export const CustomerAuthModal = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalMode,
    setAuthModalMode,
    login,
    register,
    sendPasswordReset,
    authError,
    clearError
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [localError, setLocalError] = useState(null);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLocalError(null);
    clearError();

    try {
      if (authModalMode === 'login') {
        await login(email, password);
      } else if (authModalMode === 'register') {
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }
        await register({ email, password, fullName, phone });
      } else if (authModalMode === 'forgot') {
        await sendPasswordReset(email);
        setResetSuccess(true);
      }
    } catch (err) {
      setLocalError(err.message || 'Operation failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentError = localError || authError;

  return (
    <div className="auth-modal-overlay" onClick={closeAuthModal}>
      <div className="auth-modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={closeAuthModal}>
          <X size={20} />
        </button>

        <div className="auth-modal-header">
          <div className="auth-modal-logo">
            <span className="logo-text">Laund<span className="logo-accent">rix</span></span>
          </div>
          <h3 className="auth-modal-title">
            {authModalMode === 'login' && 'Welcome Back'}
            {authModalMode === 'register' && 'Create Your Account'}
            {authModalMode === 'forgot' && 'Reset Password'}
          </h3>
          <p className="auth-modal-sub">
            {authModalMode === 'login' && 'Sign in to track orders and schedule laundry pickups.'}
            {authModalMode === 'register' && 'Join Laundrix for express fabric care and doorstep delivery.'}
            {authModalMode === 'forgot' && 'Enter your email to receive a password reset link.'}
          </p>
        </div>

        {currentError && (
          <div className="auth-modal-error">
            <AlertCircle size={16} />
            <span>{currentError}</span>
          </div>
        )}

        {resetSuccess ? (
          <div className="auth-modal-success">
            <CheckCircle2 size={24} className="text-teal" />
            <h4>Reset Email Sent!</h4>
            <p>Please check your email inbox for instructions to reset your password.</p>
            <button 
              type="button" 
              className="btn btn-primary w-full mt-4"
              onClick={() => { setResetSuccess(false); setAuthModalMode('login'); }}
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-modal-form">
            {authModalMode === 'register' && (
              <>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <div className="input-with-icon">
                    <User size={16} className="input-icon" />
                    <input 
                      type="text" 
                      required 
                      className="form-input" 
                      placeholder="e.g. Rohan Mehta"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group mt-3">
                  <label className="form-label">Phone Number</label>
                  <div className="input-with-icon">
                    <Phone size={16} className="input-icon" />
                    <input 
                      type="tel" 
                      required 
                      className="form-input" 
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="form-group mt-3">
              <label className="form-label">Email Address</label>
              <div className="input-with-icon">
                <Mail size={16} className="input-icon" />
                <input 
                  type="email" 
                  required 
                  className="form-input" 
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {authModalMode !== 'forgot' && (
              <div className="form-group mt-3">
                <div className="flex justify-between items-center">
                  <label className="form-label">Password</label>
                  {authModalMode === 'login' && (
                    <button 
                      type="button" 
                      className="text-xs text-primary font-semibold hover:underline"
                      onClick={() => setAuthModalMode('forgot')}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="input-with-icon">
                  <Lock size={16} className="input-icon" />
                  <input 
                    type="password" 
                    required 
                    className="form-input" 
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-coral w-full mt-4 flex items-center justify-center gap-2" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <span>
                    {authModalMode === 'login' && 'Sign In'}
                    {authModalMode === 'register' && 'Create Account'}
                    {authModalMode === 'forgot' && 'Send Reset Link'}
                  </span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <div className="auth-modal-footer">
              {authModalMode === 'login' ? (
                <p>
                  Don't have an account?{' '}
                  <button type="button" className="auth-switch-link" onClick={() => setAuthModalMode('register')}>
                    Sign Up
                  </button>
                </p>
              ) : authModalMode === 'register' ? (
                <p>
                  Already have an account?{' '}
                  <button type="button" className="auth-switch-link" onClick={() => setAuthModalMode('login')}>
                    Sign In
                  </button>
                </p>
              ) : (
                <p>
                  Remembered your password?{' '}
                  <button type="button" className="auth-switch-link" onClick={() => setAuthModalMode('login')}>
                    Sign In
                  </button>
                </p>
              )}
            </div>
          </form>
        )}
      </div>

      <style>{`
        .auth-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
        }

        .auth-modal-content {
          background: #FFFFFF;
          border-radius: 24px;
          max-width: 440px;
          width: 100%;
          padding: 36px;
          position: relative;
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.15);
        }

        .auth-modal-close {
          position: absolute;
          top: 20px;
          right: 20px;
          background: #F1F5F9;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748B;
          cursor: pointer;
        }

        .auth-modal-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .auth-modal-logo {
          font-size: 1.5rem;
          font-weight: 800;
          color: #0D7A75;
          margin-bottom: 8px;
        }

        .auth-modal-logo .logo-accent {
          color: #0E4B56;
        }

        .auth-modal-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: #1E293B;
          margin-bottom: 4px;
        }

        .auth-modal-sub {
          font-size: 0.8125rem;
          color: #64748B;
        }

        .auth-modal-error {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #FEF2F2;
          color: #991B1B;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 0.8125rem;
          margin-bottom: 16px;
        }

        .auth-modal-success {
          text-align: center;
          padding: 20px 0;
        }

        .auth-modal-success h4 {
          font-size: 1.125rem;
          font-weight: 700;
          color: #1E293B;
          margin: 12px 0 6px;
        }

        .auth-modal-success p {
          font-size: 0.875rem;
          color: #64748B;
        }

        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          color: #94A3B8;
        }

        .input-with-icon .form-input {
          padding-left: 42px;
        }

        .auth-modal-footer {
          text-align: center;
          margin-top: 20px;
          font-size: 0.8125rem;
          color: #64748B;
        }

        .auth-switch-link {
          background: none;
          border: none;
          color: #0D7A75;
          font-weight: 700;
          cursor: pointer;
          padding: 0;
        }
      `}</style>
    </div>
  );
};
