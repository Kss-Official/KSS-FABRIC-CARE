import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { 
  User, 
  Upload, 
  Mail, 
  Phone, 
  Globe, 
  Instagram, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Bell, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2 
} from 'lucide-react';

export const AdminSettingsPage = () => {
  const { settings, setSettings } = useAdmin();

  const [form, setForm] = useState(settings);
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const [showPwd, setShowPwd] = useState({ current: false, next: false, confirm: false });
  const [savedToast, setSavedToast] = useState(false);

  const handleToggleNotif = (key) => {
    setForm(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key]
      }
    }));
  };

  const handleSaveAll = (e) => {
    e.preventDefault();
    setSettings(form);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  return (
    <div className="admin-settings-page animate-fade-in">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account, business details and preferences.</p>
        </div>
      </div>

      <form onSubmit={handleSaveAll} className="settings-cards-list">
        {/* Card 1: Profile Information */}
        <div className="settings-card">
          <div className="settings-card-head">
            <h2 className="settings-section-title">Profile Information</h2>
            <p className="settings-section-sub">Update your profile details and profile picture.</p>
          </div>

          <div className="profile-info-grid">
            <div className="profile-photo-col">
              <div className="profile-avatar-large">A</div>
              <button type="button" className="photo-upload-btn">
                <Upload size={14} />
                <span>Change Photo</span>
              </button>
              <span className="photo-hint">JPG, PNG (Max 2MB)</span>
            </div>

            <div className="profile-fields-col">
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input 
                    type="text" 
                    required
                    className="modal-input"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input 
                    type="email" 
                    required
                    className="modal-input"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input 
                    type="tel" 
                    className="modal-input"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Role</label>
                  <input 
                    type="text" 
                    disabled
                    className="modal-input disabled"
                    value={form.role}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Contact & Social Media */}
        <div className="settings-card">
          <div className="settings-card-head">
            <h2 className="settings-section-title">Contact & Social Media</h2>
            <p className="settings-section-sub">Add your contact information and social media links.</p>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input 
                type="email" 
                required
                className="modal-input"
                value={form.supportEmail}
                onChange={(e) => setForm({ ...form, supportEmail: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Instagram</label>
              <div className="social-input-wrap">
                <Instagram size={16} className="social-icon" />
                <input 
                  type="text" 
                  className="modal-input"
                  value={form.instagram}
                  onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input 
                type="tel" 
                className="modal-input"
                value={form.supportPhone}
                onChange={(e) => setForm({ ...form, supportPhone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Facebook</label>
              <div className="social-input-wrap">
                <Facebook size={16} className="social-icon" />
                <input 
                  type="text" 
                  className="modal-input"
                  value={form.facebook}
                  onChange={(e) => setForm({ ...form, facebook: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Website URL</label>
              <input 
                type="text" 
                className="modal-input"
                value={form.websiteUrl}
                onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Twitter / X</label>
              <div className="social-input-wrap">
                <Twitter size={16} className="social-icon" />
                <input 
                  type="text" 
                  className="modal-input"
                  value={form.twitter}
                  onChange={(e) => setForm({ ...form, twitter: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group col-span-2">
              <label className="form-label">LinkedIn</label>
              <div className="social-input-wrap">
                <Linkedin size={16} className="social-icon" />
                <input 
                  type="text" 
                  className="modal-input"
                  value={form.linkedin}
                  onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Notification Preferences */}
        <div className="settings-card">
          <div className="settings-card-head">
            <h2 className="settings-section-title">Notification Preferences</h2>
            <p className="settings-section-sub">Choose what notifications you want to receive.</p>
          </div>

          <div className="form-grid-2">
            <div className="notif-pref-card">
              <div className="notif-pref-info">
                <h4 className="pref-title">New Order Notifications</h4>
                <p className="pref-sub">Get notified when a new order is placed.</p>
              </div>
              <label className="switch">
                <input 
                  type="checkbox"
                  checked={form.notifications.newOrders}
                  onChange={() => handleToggleNotif('newOrders')}
                />
                <span className="slider round"></span>
              </label>
            </div>

            <div className="notif-pref-card">
              <div className="notif-pref-info">
                <h4 className="pref-title">Customer Messages</h4>
                <p className="pref-sub">Get notified for new customer messages.</p>
              </div>
              <label className="switch">
                <input 
                  type="checkbox"
                  checked={form.notifications.customerMessages}
                  onChange={() => handleToggleNotif('customerMessages')}
                />
                <span className="slider round"></span>
              </label>
            </div>

            <div className="notif-pref-card">
              <div className="notif-pref-info">
                <h4 className="pref-title">Pickup & Delivery Updates</h4>
                <p className="pref-sub">Get updates on pickup and delivery status.</p>
              </div>
              <label className="switch">
                <input 
                  type="checkbox"
                  checked={form.notifications.pickupDelivery}
                  onChange={() => handleToggleNotif('pickupDelivery')}
                />
                <span className="slider round"></span>
              </label>
            </div>

            <div className="notif-pref-card">
              <div className="notif-pref-info">
                <h4 className="pref-title">System Announcements</h4>
                <p className="pref-sub">Receive important system updates.</p>
              </div>
              <label className="switch">
                <input 
                  type="checkbox"
                  checked={form.notifications.systemAnnouncements}
                  onChange={() => handleToggleNotif('systemAnnouncements')}
                />
                <span className="slider round"></span>
              </label>
            </div>
          </div>
        </div>

        {/* Card 4: Change Password */}
        <div className="settings-card">
          <div className="settings-card-head">
            <h2 className="settings-section-title">Change Password</h2>
            <p className="settings-section-sub">Update your account password.</p>
          </div>

          <div className="password-form-grid">
            <div className="form-group">
              <label className="form-label">Current Password *</label>
              <div className="login-input-wrap">
                <input 
                  type={showPwd.current ? 'text' : 'password'}
                  placeholder="Enter current password"
                  className="modal-input"
                  value={pwd.current}
                  onChange={(e) => setPwd({ ...pwd, current: e.target.value })}
                />
                <button type="button" className="pwd-toggle-btn" onClick={() => setShowPwd({ ...showPwd, current: !showPwd.current })}>
                  {showPwd.current ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">New Password *</label>
              <div className="login-input-wrap">
                <input 
                  type={showPwd.next ? 'text' : 'password'}
                  placeholder="Enter new password"
                  className="modal-input"
                  value={pwd.next}
                  onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
                />
                <button type="button" className="pwd-toggle-btn" onClick={() => setShowPwd({ ...showPwd, next: !showPwd.next })}>
                  {showPwd.next ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password *</label>
              <div className="login-input-wrap">
                <input 
                  type={showPwd.confirm ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  className="modal-input"
                  value={pwd.confirm}
                  onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
                />
                <button type="button" className="pwd-toggle-btn" onClick={() => setShowPwd({ ...showPwd, confirm: !showPwd.confirm })}>
                  {showPwd.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-teal pwd-save-btn">
              Save
            </button>
          </div>
        </div>

        {savedToast && (
          <div className="save-toast-banner animate-fade-in">
            <CheckCircle2 size={16} />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </form>

      <style>{`
        .admin-settings-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .settings-cards-list {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .settings-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 20px;
          padding: 28px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
        }

        .settings-card-head {
          margin-bottom: 24px;
        }

        .settings-section-title {
          font-size: 1.125rem;
          font-weight: 800;
          color: #1E293B;
        }

        .settings-section-sub {
          font-size: 0.8125rem;
          color: #64748B;
        }

        .profile-info-grid {
          display: flex;
          align-items: flex-start;
          gap: 32px;
        }

        .profile-photo-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .profile-avatar-large {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #0D7A75;
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: 800;
        }

        .photo-upload-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #334155;
          cursor: pointer;
        }

        .photo-hint {
          font-size: 0.6875rem;
          color: #94A3B8;
        }

        .profile-fields-col {
          flex: 1;
        }

        .modal-input.disabled {
          background: #F8FAFC;
          color: #64748B;
          cursor: not-allowed;
        }

        .social-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }

        .social-icon {
          position: absolute;
          left: 12px;
          color: #64748B;
        }

        .social-input-wrap .modal-input {
          padding-left: 36px;
        }

        .col-span-2 {
          grid-column: span 2;
        }

        .notif-pref-card {
          background: #FAFCFC;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .pref-title {
          font-size: 0.875rem;
          font-weight: 700;
          color: #1E293B;
        }

        .pref-sub {
          font-size: 0.75rem;
          color: #64748B;
        }

        .password-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr auto;
          gap: 16px;
          align-items: flex-end;
        }

        .pwd-save-btn {
          padding: 11px 28px;
          height: 42px;
        }

        @media (max-width: 900px) {
          .profile-info-grid {
            flex-direction: column;
            align-items: center;
          }
          .col-span-2 {
            grid-column: span 1;
          }
          .password-form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
