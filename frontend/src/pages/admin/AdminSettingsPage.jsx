import React, { useState, useRef } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { 
  Upload, 
  ShoppingBag, 
  MessageSquare, 
  Truck, 
  Share2,
  Eye, 
  EyeOff, 
  CheckCircle2,
  Instagram,
  Facebook,
  Linkedin
} from 'lucide-react';

export const AdminSettingsPage = () => {
  const { settings, updateSettings } = useAdmin();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(() => ({
    name: settings?.name || 'Admin',
    email: settings?.email || 'admin@laundrix.com',
    phone: settings?.phone || '+91 98765 43210',
    role: settings?.role || 'Administrator',
    supportEmail: settings?.supportEmail || 'support@laundrix.com',
    supportPhone: settings?.supportPhone || '+91 98765 43210',
    websiteUrl: settings?.websiteUrl || 'https://www.laundrix.com',
    instagram: settings?.instagram || 'https://instagram.com/laundrix',
    facebook: settings?.facebook || 'https://facebook.com/laundrix',
    twitter: settings?.twitter || 'https://x.com/laundrix',
    linkedin: settings?.linkedin || 'https://linkedin.com/company/laundrix',
    photoUrl: settings?.photoUrl || '',
    notifications: {
      newOrders: settings?.notifications?.newOrders ?? true,
      customerMessages: settings?.notifications?.customerMessages ?? true,
      pickupDelivery: settings?.notifications?.pickupDelivery ?? true,
      systemAnnouncements: settings?.notifications?.systemAnnouncements ?? false
    }
  }));

  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const [showPwd, setShowPwd] = useState({ current: false, next: false, confirm: false });
  const [errors, setErrors] = useState({});
  const [savedToast, setSavedToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Settings saved successfully!');

  // Handle Photo Upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, photo: 'File size exceeds 2MB limit' }));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, photoUrl: reader.result }));
        setErrors(prev => ({ ...prev, photo: '' }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Toggle Notification Checkboxes
  const handleToggleNotif = (key) => {
    setForm(prev => {
      const updated = {
        ...prev,
        notifications: {
          ...prev.notifications,
          [key]: !prev.notifications[key]
        }
      };
      // Auto-persist notification preferences
      updateSettings(updated);
      return updated;
    });
  };

  // Validation
  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = 'Invalid email address';
    }

    if (!form.supportEmail.trim()) {
      errs.supportEmail = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.supportEmail.trim())) {
      errs.supportEmail = 'Invalid email address';
    }

    // If user filled in password fields
    if (pwd.current || pwd.next || pwd.confirm) {
      if (!pwd.current) {
        errs.pwdCurrent = 'Current password is required';
      }
      if (!pwd.next) {
        errs.pwdNext = 'New password is required';
      } else if (pwd.next.length < 6) {
        errs.pwdNext = 'Password must be at least 6 characters';
      }
      if (pwd.next !== pwd.confirm) {
        errs.pwdConfirm = 'Passwords do not match';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Save All Settings
  const handleSaveAll = async (e) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    try {
      await updateSettings(form);
      if (pwd.next) {
        // Clear passwords after saving
        setPwd({ current: '', next: '', confirm: '' });
        setToastMessage('Settings and password updated successfully!');
      } else {
        setToastMessage('Settings saved successfully!');
      }

      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 3500);
    } catch (err) {
      console.error('Error saving settings:', err);
    }
  };

  const avatarInitial = (form.name || 'Admin').trim().charAt(0).toUpperCase();

  return (
    <div className="as-page-container">
      {/* Page Header */}
      <div className="as-header-block">
        <h1 className="as-page-title">Settings</h1>
        <p className="as-page-subtitle">Manage your account, business details and preferences.</p>
      </div>

      <form onSubmit={handleSaveAll} className="as-cards-stack" noValidate>
        {/* ======================================================== */}
        {/* Card 1: Profile Information */}
        {/* ======================================================== */}
        <div className="as-card">
          <div className="as-card-header">
            <h2 className="as-card-title">Profile Information</h2>
            <p className="as-card-subtitle">Update your profile details and profile picture.</p>
          </div>

          <div className="as-profile-layout">
            {/* Left Photo Column */}
            <div className="as-avatar-col">
              <div className="as-avatar-circle">
                {form.photoUrl ? (
                  <img src={form.photoUrl} alt="Profile" className="as-avatar-img" />
                ) : (
                  <span>{avatarInitial}</span>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handlePhotoUpload} 
                accept="image/png, image/jpeg, image/jpg" 
                style={{ display: 'none' }} 
              />
              <button 
                type="button" 
                className="as-btn-photo" 
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={14} strokeWidth={2} />
                <span>Change Photo</span>
              </button>
              <span className="as-photo-hint">JPG, PNG (Max. 2MB)</span>
              {errors.photo && <span className="as-error-hint">{errors.photo}</span>}
            </div>

            {/* Right Fields Grid */}
            <div className="as-fields-col">
              <div className="as-grid-2">
                {/* Name */}
                <div className="as-field">
                  <label className="as-label">
                    Name <span className="as-required">*</span>
                  </label>
                  <input 
                    type="text" 
                    className={`as-input ${errors.name ? 'as-input-error' : ''}`}
                    value={form.name}
                    onChange={(e) => {
                      setForm({ ...form, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: '' });
                    }}
                  />
                  {errors.name && <span className="as-error-hint">{errors.name}</span>}
                </div>

                {/* Email */}
                <div className="as-field">
                  <label className="as-label">
                    Email <span className="as-required">*</span>
                  </label>
                  <input 
                    type="email" 
                    className={`as-input ${errors.email ? 'as-input-error' : ''}`}
                    value={form.email}
                    onChange={(e) => {
                      setForm({ ...form, email: e.target.value });
                      if (errors.email) setErrors({ ...errors, email: '' });
                    }}
                  />
                  {errors.email && <span className="as-error-hint">{errors.email}</span>}
                </div>

                {/* Phone Number */}
                <div className="as-field">
                  <label className="as-label">Phone Number</label>
                  <input 
                    type="tel" 
                    className="as-input"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>

                {/* Role */}
                <div className="as-field">
                  <label className="as-label">Role</label>
                  <input 
                    type="text" 
                    readOnly
                    className="as-input as-input-readonly"
                    value={form.role}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* Card 2: Contact & Social Media */}
        {/* ======================================================== */}
        <div className="as-card">
          <div className="as-card-header">
            <h2 className="as-card-title">Contact & Social Media</h2>
            <p className="as-card-subtitle">Add your contact information and social media links.</p>
          </div>

          <div className="as-contact-grid">
            {/* Left Column */}
            <div className="as-contact-col">
              {/* Email Address */}
              <div className="as-field">
                <label className="as-label">
                  Email Address <span className="as-required">*</span>
                </label>
                <input 
                  type="email" 
                  className={`as-input ${errors.supportEmail ? 'as-input-error' : ''}`}
                  value={form.supportEmail}
                  onChange={(e) => {
                    setForm({ ...form, supportEmail: e.target.value });
                    if (errors.supportEmail) setErrors({ ...errors, supportEmail: '' });
                  }}
                />
                {errors.supportEmail && <span className="as-error-hint">{errors.supportEmail}</span>}
              </div>

              {/* Phone Number */}
              <div className="as-field">
                <label className="as-label">Phone Number</label>
                <input 
                  type="tel" 
                  className="as-input"
                  value={form.supportPhone}
                  onChange={(e) => setForm({ ...form, supportPhone: e.target.value })}
                />
              </div>

              {/* Website URL */}
              <div className="as-field">
                <label className="as-label">Website URL</label>
                <input 
                  type="text" 
                  className="as-input"
                  value={form.websiteUrl}
                  onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
                />
              </div>
            </div>

            {/* Right Column (Social Media Links with Badges on Labels) */}
            <div className="as-contact-col">
              {/* Instagram */}
              <div className="as-field">
                <label className="as-label">
                  <span className="as-social-badge as-instagram-badge">
                    <Instagram size={12} strokeWidth={2.4} />
                  </span>
                  Instagram
                </label>
                <input 
                  type="text" 
                  className="as-input"
                  value={form.instagram}
                  onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                />
              </div>

              {/* Facebook */}
              <div className="as-field">
                <label className="as-label">
                  <span className="as-social-badge as-facebook-badge">
                    <Facebook size={12} fill="currentColor" strokeWidth={0} />
                  </span>
                  Facebook
                </label>
                <input 
                  type="text" 
                  className="as-input"
                  value={form.facebook}
                  onChange={(e) => setForm({ ...form, facebook: e.target.value })}
                />
              </div>

              {/* Twitter / X */}
              <div className="as-field">
                <label className="as-label">
                  <span className="as-social-badge as-twitter-badge">
                    𝕏
                  </span>
                  Twitter / X
                </label>
                <input 
                  type="text" 
                  className="as-input"
                  value={form.twitter}
                  onChange={(e) => setForm({ ...form, twitter: e.target.value })}
                />
              </div>

              {/* LinkedIn */}
              <div className="as-field">
                <label className="as-label">
                  <span className="as-social-badge as-linkedin-badge">
                    <Linkedin size={12} fill="currentColor" strokeWidth={0} />
                  </span>
                  LinkedIn
                </label>
                <input 
                  type="text" 
                  className="as-input"
                  value={form.linkedin}
                  onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* Card 3: Notification Preferences */}
        {/* ======================================================== */}
        <div className="as-card">
          <div className="as-card-header">
            <h2 className="as-card-title">Notification Preferences</h2>
            <p className="as-card-subtitle">Choose what notifications you want to receive.</p>
          </div>

          <div className="as-notif-grid">
            {/* 1. New Order Notifications */}
            <div className="as-notif-card">
              <div className="as-notif-left">
                <div className="as-notif-icon-badge mint">
                  <ShoppingBag size={17} strokeWidth={2} />
                </div>
                <div className="as-notif-text">
                  <h4 className="as-notif-title">New Order Notifications</h4>
                  <p className="as-notif-desc">Get notified when a new order is placed.</p>
                </div>
              </div>
              <button 
                type="button" 
                role="switch"
                aria-checked={form.notifications.newOrders}
                className={`as-toggle-switch ${form.notifications.newOrders ? 'active' : ''}`}
                onClick={() => handleToggleNotif('newOrders')}
              >
                <span className="as-toggle-knob" />
              </button>
            </div>

            {/* 2. Customer Messages */}
            <div className="as-notif-card">
              <div className="as-notif-left">
                <div className="as-notif-icon-badge mint">
                  <MessageSquare size={17} strokeWidth={2} />
                </div>
                <div className="as-notif-text">
                  <h4 className="as-notif-title">Customer Messages</h4>
                  <p className="as-notif-desc">Get notified for new customer messages.</p>
                </div>
              </div>
              <button 
                type="button" 
                role="switch"
                aria-checked={form.notifications.customerMessages}
                className={`as-toggle-switch ${form.notifications.customerMessages ? 'active' : ''}`}
                onClick={() => handleToggleNotif('customerMessages')}
              >
                <span className="as-toggle-knob" />
              </button>
            </div>

            {/* 3. Pickup & Delivery Updates */}
            <div className="as-notif-card">
              <div className="as-notif-left">
                <div className="as-notif-icon-badge mint">
                  <Truck size={17} strokeWidth={2} />
                </div>
                <div className="as-notif-text">
                  <h4 className="as-notif-title">Pickup & Delivery Updates</h4>
                  <p className="as-notif-desc">Get updates on pickup and delivery status.</p>
                </div>
              </div>
              <button 
                type="button" 
                role="switch"
                aria-checked={form.notifications.pickupDelivery}
                className={`as-toggle-switch ${form.notifications.pickupDelivery ? 'active' : ''}`}
                onClick={() => handleToggleNotif('pickupDelivery')}
              >
                <span className="as-toggle-knob" />
              </button>
            </div>

            {/* 4. System Announcements */}
            <div className="as-notif-card">
              <div className="as-notif-left">
                <div className="as-notif-icon-badge gray">
                  <Share2 size={17} strokeWidth={2} />
                </div>
                <div className="as-notif-text">
                  <h4 className="as-notif-title">System Announcements</h4>
                  <p className="as-notif-desc">Receive important system updates.</p>
                </div>
              </div>
              <button 
                type="button" 
                role="switch"
                aria-checked={form.notifications.systemAnnouncements}
                className={`as-toggle-switch ${form.notifications.systemAnnouncements ? 'active' : ''}`}
                onClick={() => handleToggleNotif('systemAnnouncements')}
              >
                <span className="as-toggle-knob" />
              </button>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* Card 4: Change Password & Global Save */}
        {/* ======================================================== */}
        <div className="as-card">
          <div className="as-card-header">
            <h2 className="as-card-title">Change Password</h2>
            <p className="as-card-subtitle">Update your account password.</p>
          </div>

          <div className="as-password-grid">
            {/* Current Password */}
            <div className="as-field">
              <label className="as-label">
                Current Password <span className="as-required">*</span>
              </label>
              <div className="as-pwd-input-wrap">
                <input 
                  type={showPwd.current ? 'text' : 'password'}
                  placeholder="Enter current password"
                  className={`as-input ${errors.pwdCurrent ? 'as-input-error' : ''}`}
                  value={pwd.current}
                  onChange={(e) => {
                    setPwd({ ...pwd, current: e.target.value });
                    if (errors.pwdCurrent) setErrors({ ...errors, pwdCurrent: '' });
                  }}
                />
                <button 
                  type="button" 
                  className="as-pwd-eye-btn"
                  onClick={() => setShowPwd({ ...showPwd, current: !showPwd.current })}
                  aria-label="Toggle current password visibility"
                >
                  {showPwd.current ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.pwdCurrent && <span className="as-error-hint">{errors.pwdCurrent}</span>}
            </div>

            {/* New Password */}
            <div className="as-field">
              <label className="as-label">
                New Password <span className="as-required">*</span>
              </label>
              <div className="as-pwd-input-wrap">
                <input 
                  type={showPwd.next ? 'text' : 'password'}
                  placeholder="Enter new password"
                  className={`as-input ${errors.pwdNext ? 'as-input-error' : ''}`}
                  value={pwd.next}
                  onChange={(e) => {
                    setPwd({ ...pwd, next: e.target.value });
                    if (errors.pwdNext) setErrors({ ...errors, pwdNext: '' });
                  }}
                />
                <button 
                  type="button" 
                  className="as-pwd-eye-btn"
                  onClick={() => setShowPwd({ ...showPwd, next: !showPwd.next })}
                  aria-label="Toggle new password visibility"
                >
                  {showPwd.next ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.pwdNext && <span className="as-error-hint">{errors.pwdNext}</span>}
            </div>

            {/* Confirm New Password */}
            <div className="as-field">
              <label className="as-label">
                Confirm New Password <span className="as-required">*</span>
              </label>
              <div className="as-pwd-input-wrap">
                <input 
                  type={showPwd.confirm ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  className={`as-input ${errors.pwdConfirm ? 'as-input-error' : ''}`}
                  value={pwd.confirm}
                  onChange={(e) => {
                    setPwd({ ...pwd, confirm: e.target.value });
                    if (errors.pwdConfirm) setErrors({ ...errors, pwdConfirm: '' });
                  }}
                />
                <button 
                  type="button" 
                  className="as-pwd-eye-btn"
                  onClick={() => setShowPwd({ ...showPwd, confirm: !showPwd.confirm })}
                  aria-label="Toggle confirm password visibility"
                >
                  {showPwd.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.pwdConfirm && <span className="as-error-hint">{errors.pwdConfirm}</span>}
            </div>

            {/* Save Button */}
            <div className="as-btn-save-col">
              <button type="submit" className="as-btn-save">
                Save
              </button>
            </div>
          </div>
        </div>

        {/* Success Toast */}
        {savedToast && (
          <div className="as-toast-banner animate-fade-in">
            <CheckCircle2 size={18} className="as-toast-icon" />
            <span>{toastMessage}</span>
          </div>
        )}
      </form>

      {/* Scoped CSS strictly matching Reference Image 2 */}
      <style>{`
        .as-page-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
          max-width: 100%;
          padding-bottom: 40px;
        }

        .as-header-block {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .as-page-title {
          font-size: 26px;
          font-weight: 800;
          color: #0F172A;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .as-page-subtitle {
          font-size: 14px;
          color: #64748B;
          margin: 0;
        }

        .as-cards-stack {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* CARD */
        .as-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          padding: 24px 28px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }

        .as-card-header {
          margin-bottom: 20px;
        }

        .as-card-title {
          font-size: 16px;
          font-weight: 700;
          color: #0F172A;
          margin: 0 0 4px 0;
          letter-spacing: -0.01em;
        }

        .as-card-subtitle {
          font-size: 13px;
          color: #64748B;
          margin: 0;
        }

        /* PROFILE CARD LAYOUT */
        .as-profile-layout {
          display: flex;
          align-items: flex-start;
          gap: 32px;
        }

        .as-avatar-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          width: 130px;
          flex-shrink: 0;
        }

        .as-avatar-circle {
          width: 74px;
          height: 74px;
          border-radius: 50%;
          background: #007E8A;
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: 700;
          overflow: hidden;
          box-shadow: 0 4px 10px rgba(0, 126, 138, 0.2);
        }

        .as-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .as-btn-photo {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          padding: 7px 16px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          color: #1E293B;
          cursor: pointer;
          transition: all 0.15s ease;
          font-family: inherit;
        }

        .as-btn-photo:hover {
          background: #F8FAFC;
          border-color: #CBD5E1;
        }

        .as-photo-hint {
          font-size: 11px;
          color: #94A3B8;
          text-align: center;
        }

        .as-fields-col {
          flex: 1;
        }

        .as-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px 20px;
        }

        /* FIELD & INPUT */
        .as-field {
          display: flex;
          flex-direction: column;
        }

        .as-label {
          font-size: 13px;
          font-weight: 600;
          color: #1E293B;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          user-select: none;
        }

        .as-required {
          color: #EF4444;
          margin-left: 3px;
          font-weight: 700;
        }

        .as-input {
          width: 100%;
          height: 42px;
          padding: 0 14px;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          font-size: 13.5px;
          color: #1E293B;
          background: #FFFFFF;
          outline: none;
          box-sizing: border-box;
          font-family: inherit;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .as-input:focus {
          border-color: #007E8A;
          box-shadow: 0 0 0 3px rgba(0, 126, 138, 0.12);
        }

        .as-input-readonly {
          background: #F8FAFC;
          color: #64748B;
          cursor: not-allowed;
          border-color: #E2E8F0;
        }

        .as-input-error {
          border-color: #EF4444 !important;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
        }

        .as-error-hint {
          font-size: 11.5px;
          color: #EF4444;
          margin-top: 4px;
        }

        /* CONTACT & SOCIAL GRID */
        .as-contact-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px 24px;
        }

        .as-contact-col {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* Social Badges next to label text */
        .as-social-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          border-radius: 4px;
          margin-right: 6px;
          flex-shrink: 0;
          color: #FFFFFF;
        }

        .as-instagram-badge {
          background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
        }

        .as-facebook-badge {
          background: #1877F2;
        }

        .as-twitter-badge {
          background: #000000;
          font-size: 11px;
          font-weight: 700;
          line-height: 1;
        }

        .as-linkedin-badge {
          background: #0A66C2;
        }

        /* NOTIFICATION PREFERENCES */
        .as-notif-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px 20px;
        }

        .as-notif-card {
          background: #FAFCFC;
          border: 1px solid #EBF1F5;
          border-radius: 12px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .as-notif-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .as-notif-icon-badge {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .as-notif-icon-badge.mint {
          background: #E6F7F5;
          color: #007E8A;
        }

        .as-notif-icon-badge.gray {
          background: #F1F5F9;
          color: #64748B;
        }

        .as-notif-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .as-notif-title {
          font-size: 13.5px;
          font-weight: 700;
          color: #0F172A;
          margin: 0;
        }

        .as-notif-desc {
          font-size: 12px;
          color: #64748B;
          margin: 0;
        }

        /* TOGGLE SWITCH */
        .as-toggle-switch {
          width: 44px;
          height: 24px;
          border-radius: 9999px;
          background-color: #CBD5E1;
          border: none;
          padding: 0;
          position: relative;
          cursor: pointer;
          outline: none;
          transition: background-color 0.2s ease;
          flex-shrink: 0;
        }

        .as-toggle-switch.active {
          background-color: #007E8A;
        }

        .as-toggle-knob {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #FFFFFF;
          position: absolute;
          top: 3px;
          left: 3px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .as-toggle-switch.active .as-toggle-knob {
          transform: translateX(20px);
        }

        /* CHANGE PASSWORD ROW */
        .as-password-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr auto;
          gap: 16px;
          align-items: flex-end;
        }

        .as-pwd-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .as-pwd-eye-btn {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          padding: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .as-pwd-eye-btn:hover {
          color: #475569;
        }

        .as-pwd-input-wrap .as-input {
          padding-right: 36px;
        }

        .as-btn-save-col {
          display: flex;
          align-items: flex-end;
        }

        .as-btn-save {
          height: 42px;
          padding: 0 36px;
          background: #007E8A;
          color: #FFFFFF;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          font-family: inherit;
          white-space: nowrap;
        }

        .as-btn-save:hover {
          background: #006B75;
        }

        .as-btn-save:active {
          transform: translateY(1px);
        }

        /* TOAST BANNER */
        .as-toast-banner {
          position: fixed;
          bottom: 24px;
          right: 24px;
          background: #065F46;
          color: #FFFFFF;
          padding: 12px 20px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13.5px;
          font-weight: 600;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          z-index: 9999;
        }

        .as-toast-icon {
          color: #34D399;
        }

        @media (max-width: 960px) {
          .as-password-grid {
            grid-template-columns: 1fr;
            align-items: stretch;
          }
          .as-contact-grid {
            grid-template-columns: 1fr;
          }
          .as-notif-grid {
            grid-template-columns: 1fr;
          }
          .as-profile-layout {
            flex-direction: column;
            align-items: center;
          }
          .as-grid-2 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
