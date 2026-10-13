import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getPortalForRole } from '../utils/roleUtils';
import { useBooking } from '../context/BookingContext';
import { Lock, Mail, User, Phone, ArrowRight, Loader2, AlertCircle, Sparkles } from 'lucide-react';

export const Login = () => {
  const { login, authError, clearError } = useAuth();
  const { navigateTo } = useBooking();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    clearError();
    try {
      const res = await login(username, password);
      const intended = sessionStorage.getItem('fabricare_intended_destination');
      if (role === 'customer' && intended) {
        sessionStorage.removeItem('fabricare_intended_destination');
        navigateTo(intended);
      } else {
        navigateTo(getPortalForRole(role));
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="portal-container py-12 flex items-center justify-center min-h-[70vh]">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-200 shadow-xl shadow-blue-500/5">
        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center mx-auto mb-3">
            <Sparkles size={20} />
          </div>
          <h1 className="text-2xl font-black text-navy">Welcome Back</h1>
          <p className="text-xs text-muted mt-1">Sign in to access your FabriCare laundry dashboard</p>
        </div>

        {(error || authError) && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 mb-4 flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error || authError}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="form-label">Username or Email</label>
            <input 
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. rohan or rohan.mehta@gmail.com"
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">Password</label>
            <input 
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="form-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full py-3 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <><span>Sign In</span><ArrowRight size={16} /></>}
          </button>
        </form>

        <div className="text-center mt-6 text-xs text-muted">
          Don't have an account?{' '}
          <button onClick={() => navigateTo('signup')} className="text-primary font-bold hover:underline">
            Register Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
