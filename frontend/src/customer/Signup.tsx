import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBooking } from '../context/BookingContext';
import { Lock, Mail, User, Phone, ArrowRight, Loader2, AlertCircle, Sparkles, MapPin } from 'lucide-react';

export const Signup = () => {
  const { register, authError, clearError } = useAuth();
  const { navigateTo } = useBooking();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    clearError();
    try {
      await register({
        username: username || email.split('@')[0],
        email,
        password,
        full_name: fullName,
        phone,
        address
      });
      navigateTo('customer-dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed');
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
          <h1 className="text-2xl font-black text-navy">Create Account</h1>
          <p className="text-xs text-muted mt-1">Join FabriCare for express door-to-door laundry</p>
        </div>

        {(error || authError) && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 mb-4 flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error || authError}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-3">
          <div>
            <label className="form-label">Full Name *</label>
            <input 
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Rohan Mehta"
              className="form-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Username *</label>
              <input 
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="rohan"
                className="form-input text-xs"
              />
            </div>
            <div>
              <label className="form-label">Phone *</label>
              <input 
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765..."
                className="form-input text-xs"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Email Address *</label>
            <input 
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">Pickup Address</label>
            <input 
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Area, Bengaluru - 560043"
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">Password *</label>
            <input 
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="form-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full py-3 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <><span>Complete Registration</span><ArrowRight size={16} /></>}
          </button>
        </form>

        <div className="text-center mt-6 text-xs text-muted">
          Already registered?{' '}
          <button onClick={() => navigateTo('login')} className="text-primary font-bold hover:underline">
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default Signup;
