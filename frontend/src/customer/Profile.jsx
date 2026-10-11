import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  LogOut, 
  CheckCircle,
  Calendar
} from 'lucide-react';

export const Profile = () => {
  const { currentUser, logout, userRole } = useAuth();
  const [copied, setCopied] = useState(false);

  return (
    <div className="portal-container">
      {/* Header */}
      <div className="mb-6">
        <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Account & Security</div>
        <h1 className="text-2xl font-bold text-navy">Customer Profile</h1>
        <p className="text-sm text-muted">Manage your personal credentials and contact settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Summary */}
        <div className="content-card text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
            {currentUser?.avatar || (currentUser?.first_name ? currentUser.first_name[0] : 'U')}
          </div>
          <h2 className="text-xl font-bold text-navy">{currentUser?.full_name || currentUser?.first_name || 'Customer'}</h2>
          <p className="text-sm text-muted mb-3">@{currentUser?.username || 'user'}</p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-primary text-xs font-bold rounded-full mb-6">
            <ShieldCheck size={14} />
            <span>Role: {userRole}</span>
          </div>

          <div className="border-t pt-4">
            <button
              onClick={logout}
              className="btn btn-outline-danger w-full flex items-center justify-center gap-2"
            >
              <LogOut size={16} />
              <span>Log Out Account</span>
            </button>
          </div>
        </div>

        {/* Right 2 Columns: Details */}
        <div className="lg:col-span-2 content-card">
          <h3 className="font-bold text-navy text-base mb-4 flex items-center gap-2">
            <User size={18} className="text-primary" />
            <span>Profile Details</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs text-muted block mb-1">Full Name</span>
              <div className="font-semibold text-navy">{currentUser?.full_name || currentUser?.first_name || 'Not provided'}</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs text-muted block mb-1">Email Address</span>
              <div className="font-semibold text-navy">{currentUser?.email || 'Not provided'}</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs text-muted block mb-1">Phone Number</span>
              <div className="font-semibold text-navy">{currentUser?.phone || '+91 98765 43210'}</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs text-muted block mb-1">City</span>
              <div className="font-semibold text-navy">{currentUser?.city || 'Bengaluru'}</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 md:col-span-2">
              <span className="text-xs text-muted block mb-1">Registered Address</span>
              <div className="font-semibold text-navy">{currentUser?.address || 'Banaswadi, Bengaluru - 560043'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
