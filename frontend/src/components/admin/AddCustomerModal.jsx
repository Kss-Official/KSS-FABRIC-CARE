import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAdmin } from '../../context/AdminContext';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Building2, 
  Building,
  ChevronDown, 
  FileText, 
  UserPlus,
  Briefcase,
  Truck
} from 'lucide-react';

// Green WhatsApp icon matching Reference Image 1
const WhatsAppIcon = ({ size = 17, className = '' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="#22C55E" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
    style={{ color: '#22C55E' }}
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    <path d="M9.5 9a.5.5 0 0 0-.5.5v.5c0 2.5 2 4.5 4.5 4.5h.5a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5l-1-.2a.5.5 0 0 0-.5.2l-.3.4a3.5 3.5 0 0 1-2-2l.4-.3a.5.5 0 0 0 .2-.5l-.2-1a.5.5 0 0 0-.6-.4z" />
  </svg>
);

const INITIAL_FORM_STATE = {
  role: 'customer', // 'customer' | 'staff' | 'agent'
  name: '',
  phone: '',
  email: '',
  whatsapp: '',
  address1: '',
  address2: '',
  city: 'Bengaluru',
  pincode: '560043',
  area: '',
  locationType: 'Home',
  notes: '',
  status: true
};

export const AddCustomerModal = () => {
  const { 
    isAddCustomerModalOpen, 
    isAddUserModalOpen,
    setIsAddCustomerModalOpen, 
    setIsAddUserModalOpen,
    addCustomer,
    addUser 
  } = useAdmin();

  const isOpen = Boolean(isAddCustomerModalOpen || isAddUserModalOpen);

  const [form, setForm] = useState(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleClose = () => {
    setErrors({});
    if (setIsAddCustomerModalOpen) setIsAddCustomerModalOpen(false);
    if (setIsAddUserModalOpen) setIsAddUserModalOpen(false);
  };

  const validate = () => {
    const errs = {};
    const trimmedName = form.name.trim();
    if (!trimmedName) {
      errs.name = 'Full name is required';
    } else if (!/^[A-Za-z\s]+$/.test(trimmedName)) {
      errs.name = 'Name must contain only alphabetic characters and spaces';
    } else if (trimmedName.replace(/\s+/g, '').length < 2) {
      errs.name = 'Name must be at least 2 letters';
    } else if (trimmedName.length > 20) {
      errs.name = 'Name cannot exceed 20 characters';
    }

    const cleanPhone = form.phone.replace(/\D/g, '');
    if (!cleanPhone) {
      errs.phone = 'Mobile number is required';
    } else if (cleanPhone.length !== 10) {
      errs.phone = 'Mobile number must be exactly 10 digits';
    } else if (!/^[6-9]/.test(cleanPhone)) {
      errs.phone = 'Mobile number must start with 6, 7, 8, or 9';
    }

    if (form.whatsapp && form.whatsapp.trim()) {
      const cleanWa = form.whatsapp.replace(/\D/g, '');
      if (cleanWa.length !== 10) {
        errs.whatsapp = 'WhatsApp number must be exactly 10 digits';
      } else if (!/^[6-9]/.test(cleanWa)) {
        errs.whatsapp = 'WhatsApp number must start with 6, 7, 8, or 9';
      }
    }

    const trimmedEmail = form.email.trim();
    if (trimmedEmail) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(trimmedEmail)) {
        errs.email = 'Please enter a valid email address (e.g., user@example.com)';
      }
    }

    if (!form.address1.trim()) {
      errs.address1 = 'Address Line 1 is required';
    }

    if (!form.city) {
      errs.city = 'City is required';
    }

    const cleanPincode = form.pincode.replace(/[^0-9]/g, '');
    if (!form.pincode.trim()) {
      errs.pincode = 'Pincode is required';
    } else if (cleanPincode.length !== 6) {
      errs.pincode = 'Pincode must be 6 digits';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const effectiveArea = form.area.trim() || 'HSR Layout';
      const userData = {
        role: form.role,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || `${form.name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user'}_${Date.now()}@fabricare.com`,
        whatsapp: form.whatsapp.trim() || form.phone.trim(),
        address: `${form.address1.trim()}, ${form.address2 ? form.address2.trim() + ', ' : ''}${effectiveArea}, ${form.city} ${form.pincode}`,
        address1: form.address1.trim(),
        address2: form.address2.trim(),
        city: form.city,
        pincode: form.pincode.trim(),
        area: effectiveArea,
        locationType: form.locationType,
        notes: form.notes.trim(),
        status: form.status ? 'Active' : 'Inactive',
        isActive: form.status
      };

      if (addUser) {
        await addUser(userData);
      } else if (addCustomer) {
        await addCustomer(userData);
      }

      setForm(INITIAL_FORM_STATE);
      setErrors({});
      handleClose();
    } catch (err) {
      console.error('Error adding user:', err);
      setErrors({ form: err.message || 'Failed to add user' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="ac-modal-backdrop" onClick={handleClose}>
      <div className="ac-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="ac-modal-header">
          <div className="ac-header-left">
            <div className="ac-icon-badge">
              <UserPlus size={22} strokeWidth={2.2} />
            </div>
            <div className="ac-header-text">
              <h2 className="ac-title">{isAddUserModalOpen ? 'Add User' : 'Add Customer'}</h2>
              <p className="ac-subtitle">
                {isAddUserModalOpen 
                  ? 'Add a new user (customer, staff member, or delivery personnel) to the system.' 
                  : 'Add a new customer to create orders or manage their details.'}
              </p>
            </div>
          </div>
          <button 
            type="button"
            className="ac-close-btn"
            onClick={handleClose}
            aria-label="Close modal"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="ac-form-body" noValidate>
          {errors.form && (
            <div className="ac-error-banner">
              {errors.form}
            </div>
          )}

          {/* User Type / Role Selector */}
          <div className="ac-section">
            <label className="ac-label" htmlFor="user-role-select">
              User Type / Role <span className="ac-required">*</span>
            </label>
            <div className="ac-input-wrapper ac-select-wrapper">
              {form.role === 'customer' && <User size={17} className="ac-field-icon" />}
              {form.role === 'staff' && <Briefcase size={17} className="ac-field-icon" />}
              {form.role === 'agent' && <Truck size={17} className="ac-field-icon" />}
              <select
                id="user-role-select"
                className="ac-input ac-select"
                value={form.role}
                onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))}
              >
                <option value="customer">Customer</option>
                <option value="staff">Staff Member</option>
                <option value="agent">Delivery Personnel</option>
              </select>
              <ChevronDown size={16} className="ac-select-chevron" />
            </div>
          </div>

          {/* Section 1: Personal Information */}
          <div className="ac-section">
            <h3 className="ac-section-heading">Personal Information</h3>
            <div className="ac-grid-2">
              {/* Full Name */}
              <div className="ac-field">
                <label className="ac-label">
                  Full Name <span className="ac-required">*</span>
                </label>
                <div className={`ac-input-wrapper ${errors.name ? 'ac-error' : ''}`}>
                  <User size={17} className="ac-field-icon" />
                  <input 
                    type="text"
                    maxLength={20}
                    placeholder="Enter full name (max 20 characters)"
                    className="ac-input"
                    value={form.name}
                    onChange={(e) => {
                      // Disallow numbers and special characters immediately, max 20 chars
                      const lettersOnly = e.target.value.replace(/[^A-Za-z\s]/g, '').slice(0, 20);
                      setForm(f => ({ ...f, name: lettersOnly }));
                      if (errors.name) {
                        if (lettersOnly.trim().length >= 2 && lettersOnly.trim().length <= 20 && /^[A-Za-z\s]+$/.test(lettersOnly.trim())) {
                          setErrors(prev => ({ ...prev, name: '' }));
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key)) return;
                      if (!/^[A-Za-z\s]$/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onBlur={() => {
                      const trimmed = form.name.trim();
                      if (!trimmed) {
                        setErrors(prev => ({ ...prev, name: 'Full name is required' }));
                      } else if (!/^[A-Za-z\s]+$/.test(trimmed)) {
                        setErrors(prev => ({ ...prev, name: 'Name must contain only alphabetic characters and spaces' }));
                      } else if (trimmed.replace(/\s+/g, '').length < 2) {
                        setErrors(prev => ({ ...prev, name: 'Name must be at least 2 letters' }));
                      } else if (trimmed.length > 20) {
                        setErrors(prev => ({ ...prev, name: 'Name cannot exceed 20 characters' }));
                      } else {
                        setErrors(prev => ({ ...prev, name: '' }));
                      }
                    }}
                  />
                </div>
                {errors.name && <span className="ac-error-text">{errors.name}</span>}
              </div>

              {/* Phone Number */}
              <div className="ac-field">
                <label className="ac-label">
                  Phone Number <span className="ac-required">*</span>
                </label>
                <div className={`ac-input-wrapper ${errors.phone ? 'ac-error' : ''}`}>
                  <Phone size={17} className="ac-field-icon" />
                  <input 
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    className="ac-input"
                    value={form.phone}
                    onChange={(e) => {
                      // Accept only numeric input up to 10 digits
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setForm(f => ({ ...f, phone: digits }));
                      if (errors.phone) {
                        if (digits.length === 10 && /^[6-9]/.test(digits)) {
                          setErrors(prev => ({ ...prev, phone: '' }));
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key)) return;
                      if (!/^\d$/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onBlur={() => {
                      const digits = form.phone.replace(/\D/g, '');
                      if (!digits) {
                        setErrors(prev => ({ ...prev, phone: 'Mobile number is required' }));
                      } else if (digits.length !== 10) {
                        setErrors(prev => ({ ...prev, phone: 'Mobile number must be exactly 10 digits' }));
                      } else if (!/^[6-9]/.test(digits)) {
                        setErrors(prev => ({ ...prev, phone: 'Mobile number must start with 6, 7, 8, or 9' }));
                      } else {
                        setErrors(prev => ({ ...prev, phone: '' }));
                      }
                    }}
                  />
                </div>
                {errors.phone && <span className="ac-error-text">{errors.phone}</span>}
              </div>

              {/* Email (Optional) */}
              <div className="ac-field">
                <label className="ac-label">Email (Optional)</label>
                <div className={`ac-input-wrapper ${errors.email ? 'ac-error' : ''}`}>
                  <Mail size={17} className="ac-field-icon" />
                  <input 
                    type="email"
                    inputMode="email"
                    placeholder="name@example.com"
                    className="ac-input"
                    value={form.email}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm(f => ({ ...f, email: val }));
                      if (errors.email) {
                        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                        if (!val.trim() || emailRegex.test(val.trim())) {
                          setErrors(prev => ({ ...prev, email: '' }));
                        }
                      }
                    }}
                    onBlur={() => {
                      const trimmed = form.email.trim();
                      if (trimmed) {
                        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                        if (!emailRegex.test(trimmed)) {
                          setErrors(prev => ({ ...prev, email: 'Please enter a valid email address (e.g., name@example.com)' }));
                        } else {
                          setErrors(prev => ({ ...prev, email: '' }));
                        }
                      } else {
                        setErrors(prev => ({ ...prev, email: '' }));
                      }
                    }}
                  />
                </div>
                {errors.email && <span className="ac-error-text">{errors.email}</span>}
              </div>

              {/* WhatsApp Number (Optional) */}
              <div className="ac-field">
                <label className="ac-label">WhatsApp Number (Optional)</label>
                <div className={`ac-input-wrapper ${errors.whatsapp ? 'ac-error' : ''}`}>
                  <WhatsAppIcon size={17} className="ac-field-icon ac-whatsapp-icon" />
                  <input 
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="10-digit WhatsApp number"
                    className="ac-input"
                    value={form.whatsapp}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setForm(f => ({ ...f, whatsapp: digits }));
                      if (errors.whatsapp) {
                        if (!digits || (digits.length === 10 && /^[6-9]/.test(digits))) {
                          setErrors(prev => ({ ...prev, whatsapp: '' }));
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key)) return;
                      if (!/^\d$/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onBlur={() => {
                      const digits = form.whatsapp.replace(/\D/g, '');
                      if (digits) {
                        if (digits.length !== 10) {
                          setErrors(prev => ({ ...prev, whatsapp: 'WhatsApp number must be exactly 10 digits' }));
                        } else if (!/^[6-9]/.test(digits)) {
                          setErrors(prev => ({ ...prev, whatsapp: 'WhatsApp number must start with 6, 7, 8, or 9' }));
                        } else {
                          setErrors(prev => ({ ...prev, whatsapp: '' }));
                        }
                      } else {
                        setErrors(prev => ({ ...prev, whatsapp: '' }));
                      }
                    }}
                  />
                </div>
                {errors.whatsapp && <span className="ac-error-text">{errors.whatsapp}</span>}
              </div>
            </div>
          </div>

          {/* Section 2: Address Information */}
          <div className="ac-section">
            <h3 className="ac-section-heading">Address Information</h3>
            <div className="ac-grid-2">
              {/* Address Line 1 */}
              <div className="ac-field">
                <label className="ac-label">
                  Address Line 1 <span className="ac-required">*</span>
                </label>
                <div className={`ac-input-wrapper ${errors.address1 ? 'ac-error' : ''}`}>
                  <MapPin size={17} className="ac-field-icon" />
                  <input 
                    type="text"
                    placeholder="House no., Street name, Area"
                    className="ac-input"
                    value={form.address1}
                    onChange={(e) => {
                      setForm({ ...form, address1: e.target.value });
                      if (errors.address1) setErrors({ ...errors, address1: '' });
                    }}
                  />
                </div>
                {errors.address1 && <span className="ac-error-text">{errors.address1}</span>}
              </div>

              {/* Address Line 2 (Optional) */}
              <div className="ac-field">
                <label className="ac-label">Address Line 2 (Optional)</label>
                <div className="ac-input-wrapper">
                  <MapPin size={17} className="ac-field-icon" />
                  <input 
                    type="text"
                    placeholder="Apartment, Landmark, etc."
                    className="ac-input"
                    value={form.address2}
                    onChange={(e) => setForm({ ...form, address2: e.target.value })}
                  />
                </div>
              </div>

              {/* City */}
              <div className="ac-field">
                <label className="ac-label">
                  City <span className="ac-required">*</span>
                </label>
                <div className={`ac-input-wrapper ac-select-wrapper ${errors.city ? 'ac-error' : ''}`}>
                  <Building2 size={17} className="ac-field-icon" />
                  <select 
                    className="ac-input ac-select"
                    value={form.city}
                    onChange={(e) => {
                      setForm({ ...form, city: e.target.value });
                      if (errors.city) setErrors({ ...errors, city: '' });
                    }}
                  >
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Delhi NCR">Delhi NCR</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Pune">Pune</option>
                    <option value="Chennai">Chennai</option>
                  </select>
                  <ChevronDown size={16} className="ac-select-chevron" />
                </div>
                {errors.city && <span className="ac-error-text">{errors.city}</span>}
              </div>

              {/* Pincode */}
              <div className="ac-field">
                <label className="ac-label">
                  Pincode <span className="ac-required">*</span>
                </label>
                <div className={`ac-input-wrapper ${errors.pincode ? 'ac-error' : ''}`}>
                  <MapPin size={17} className="ac-field-icon" />
                  <input 
                    type="text"
                    placeholder="560043"
                    className="ac-input"
                    value={form.pincode}
                    onChange={(e) => {
                      setForm({ ...form, pincode: e.target.value });
                      if (errors.pincode) setErrors({ ...errors, pincode: '' });
                    }}
                  />
                </div>
                {errors.pincode && <span className="ac-error-text">{errors.pincode}</span>}
              </div>

              {/* Area / Locality */}
              <div className="ac-field">
                <label className="ac-label">
                  Area / Locality <span className="ac-required">*</span>
                </label>
                <div className={`ac-input-wrapper ac-select-wrapper ${errors.area ? 'ac-error' : ''}`}>
                  <Building size={17} className="ac-field-icon" />
                  <select 
                    className={`ac-input ac-select ${!form.area ? 'ac-placeholder-select' : ''}`}
                    value={form.area}
                    onChange={(e) => {
                      setForm({ ...form, area: e.target.value });
                      if (errors.area) setErrors({ ...errors, area: '' });
                    }}
                  >
                    <option value="" disabled hidden>e.g. HSR Layout</option>
                    <option value="HSR Layout">HSR Layout</option>
                    <option value="Banaswadi">Banaswadi</option>
                    <option value="HRBR Layout">HRBR Layout</option>
                    <option value="Indiranagar">Indiranagar</option>
                    <option value="Koramangala">Koramangala</option>
                    <option value="Whitefield">Whitefield</option>
                    <option value="Jayanagar">Jayanagar</option>
                  </select>
                  <ChevronDown size={16} className="ac-select-chevron" />
                </div>
                {errors.area && <span className="ac-error-text">{errors.area}</span>}
              </div>

              {/* Location Type */}
              <div className="ac-field">
                <label className="ac-label">Location Type</label>
                <div className="ac-radio-group">
                  {/* Home Radio */}
                  <label 
                    className="ac-radio-option" 
                    onClick={() => setForm({ ...form, locationType: 'Home' })}
                  >
                    <div className={`ac-radio-circle ${form.locationType === 'Home' ? 'selected' : ''}`}>
                      {form.locationType === 'Home' && <div className="ac-radio-dot" />}
                    </div>
                    <span className="ac-radio-text">Home</span>
                  </label>

                  {/* Office Radio */}
                  <label 
                    className="ac-radio-option" 
                    onClick={() => setForm({ ...form, locationType: 'Office' })}
                  >
                    <div className={`ac-radio-circle ${form.locationType === 'Office' ? 'selected' : ''}`}>
                      {form.locationType === 'Office' && <div className="ac-radio-dot" />}
                    </div>
                    <span className="ac-radio-text">Office</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Additional Details */}
          <div className="ac-section">
            <h3 className="ac-section-heading">Additional Details</h3>
            <div className="ac-grid-2">
              {/* Customer Notes */}
              <div className="ac-field">
                <label className="ac-label">Customer Notes (Optional)</label>
                <div className="ac-textarea-wrapper">
                  <FileText size={17} className="ac-textarea-icon" />
                  <textarea 
                    rows={3}
                    placeholder="Add any special notes (e.g. preferred time, gate details, etc.)"
                    className="ac-textarea"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
              </div>

              {/* Status */}
              <div className="ac-field">
                <label className="ac-label">Status</label>
                <div className="ac-status-row">
                  <button 
                    type="button" 
                    role="switch"
                    aria-checked={form.status}
                    className={`ac-toggle-switch ${form.status ? 'active' : ''}`}
                    onClick={() => setForm({ ...form, status: !form.status })}
                  >
                    <span className="ac-toggle-knob" />
                  </button>
                  <span className="ac-status-label">{form.status ? 'Active' : 'Inactive'}</span>
                </div>
                <p className="ac-helper-text">
                  Active customers can place orders and receive services.
                </p>
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="ac-footer-actions">
            <button 
              type="button"
              className="ac-btn-cancel"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="ac-btn-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : (isAddUserModalOpen ? 'Add User' : 'Add Customer')}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .ac-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 1100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: acFadeIn 0.2s ease-out;
        }

        @keyframes acFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .ac-modal-container {
          background: #FFFFFF;
          border-radius: 20px;
          width: 672px;
          max-width: 100%;
          max-height: 92vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 48px -10px rgba(15, 23, 42, 0.18), 0 0 1px 1px rgba(0, 0, 0, 0.04);
          animation: acScaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
        }

        @keyframes acScaleUp {
          from { transform: scale(0.97); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        /* Header */
        .ac-modal-header {
          padding: 22px 28px 18px 28px;
          border-bottom: 1px solid #F1F5F9;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          background: #FFFFFF;
        }

        .ac-header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .ac-icon-badge {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #E6F7F5;
          color: #007E8A;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .ac-header-text {
          display: flex;
          flex-direction: column;
        }

        .ac-title {
          font-size: 19px;
          font-weight: 700;
          color: #0F172A;
          margin: 0;
          letter-spacing: -0.01em;
          line-height: 1.3;
        }

        .ac-subtitle {
          font-size: 13px;
          color: #64748B;
          margin: 2px 0 0 0;
          line-height: 1.4;
        }

        .ac-close-btn {
          background: transparent;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: all 0.15s ease;
        }

        .ac-close-btn:hover {
          color: #0F172A;
          background: #F1F5F9;
        }

        /* Form Body */
        .ac-form-body {
          padding: 22px 28px 26px 28px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
          scrollbar-width: thin;
          scrollbar-color: #E2E8F0 transparent;
        }

        .ac-form-body::-webkit-scrollbar {
          width: 6px;
        }
        .ac-form-body::-webkit-scrollbar-thumb {
          background-color: #CBD5E1;
          border-radius: 3px;
        }

        .ac-error-banner {
          background: #FEF2F2;
          border: 1px solid #FCA5A5;
          color: #B91C1C;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
          line-height: 1.4;
        }

        /* User Type Toggle Group (from Reference Image 2) */
        .ac-role-toggle-group {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 2px;
        }

        .ac-role-btn {
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          color: #475569;
          font-size: 13.5px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          font-family: inherit;
        }

        .ac-role-btn:hover:not(.active) {
          border-color: #CBD5E1;
          background: #F8FAFC;
          color: #1E293B;
        }

        .ac-role-btn.active {
          border: 1.5px solid #007E8A;
          background: #E6F7F5;
          color: #007E8A;
          font-weight: 600;
        }

        /* Section */
        .ac-section {
          display: flex;
          flex-direction: column;
        }

        .ac-section-heading {
          font-size: 14.5px;
          font-weight: 700;
          color: #0F172A;
          margin: 0 0 12px 0;
          letter-spacing: -0.005em;
        }

        .ac-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px 18px;
        }

        /* Field */
        .ac-field {
          display: flex;
          flex-direction: column;
        }

        .ac-label {
          font-size: 13px;
          font-weight: 600;
          color: #1E293B;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          user-select: none;
        }

        .ac-required {
          color: #EF4444;
          margin-left: 3px;
          font-weight: 700;
        }

        /* Input Wrapper */
        .ac-input-wrapper {
          position: relative;
          width: 100%;
          display: flex;
          align-items: center;
        }

        .ac-field-icon {
          position: absolute;
          left: 12px;
          color: #94A3B8;
          pointer-events: none;
          flex-shrink: 0;
          z-index: 1;
        }

        .ac-whatsapp-icon {
          color: #22C55E !important;
        }

        .ac-input {
          width: 100%;
          height: 42px;
          padding: 0 14px 0 38px;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          font-size: 13.5px;
          font-family: inherit;
          color: #1E293B;
          background: #FFFFFF;
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
          box-sizing: border-box;
        }

        .ac-input::placeholder {
          color: #94A3B8;
          font-size: 13.5px;
        }

        .ac-input:focus {
          border-color: #007E8A;
          box-shadow: 0 0 0 3px rgba(0, 126, 138, 0.12);
        }

        .ac-input-wrapper.ac-error .ac-input {
          border-color: #EF4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }

        .ac-error-text {
          font-size: 11.5px;
          color: #EF4444;
          margin-top: 4px;
          line-height: 1.2;
        }

        /* Select styling */
        .ac-select-wrapper {
          position: relative;
        }

        .ac-select {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          padding-right: 36px;
          cursor: pointer;
        }

        .ac-placeholder-select {
          color: #94A3B8;
        }

        .ac-select-chevron {
          position: absolute;
          right: 12px;
          color: #64748B;
          pointer-events: none;
          flex-shrink: 0;
        }

        /* Location Type Radio */
        .ac-radio-group {
          display: flex;
          align-items: center;
          gap: 24px;
          height: 42px;
        }

        .ac-radio-option {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          user-select: none;
        }

        .ac-radio-circle {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 1.5px solid #CBD5E1;
          background: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }

        .ac-radio-circle.selected {
          border-color: #007E8A;
          background: #007E8A;
        }

        .ac-radio-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #FFFFFF;
        }

        .ac-radio-text {
          font-size: 13.5px;
          font-weight: 500;
          color: #1E293B;
        }

        /* Customer Notes Textarea */
        .ac-textarea-wrapper {
          position: relative;
          width: 100%;
        }

        .ac-textarea-icon {
          position: absolute;
          top: 11px;
          left: 12px;
          color: #94A3B8;
          pointer-events: none;
        }

        .ac-textarea {
          width: 100%;
          height: 76px;
          padding: 10px 14px 10px 38px;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          font-size: 13px;
          font-family: inherit;
          color: #1E293B;
          background: #FFFFFF;
          outline: none;
          resize: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
          box-sizing: border-box;
          line-height: 1.45;
        }

        .ac-textarea::placeholder {
          color: #94A3B8;
          font-size: 13px;
        }

        .ac-textarea:focus {
          border-color: #007E8A;
          box-shadow: 0 0 0 3px rgba(0, 126, 138, 0.12);
        }

        /* Status Toggle */
        .ac-status-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 2px;
          height: 32px;
        }

        .ac-toggle-switch {
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

        .ac-toggle-switch.active {
          background-color: #007E8A;
        }

        .ac-toggle-knob {
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

        .ac-toggle-switch.active .ac-toggle-knob {
          transform: translateX(20px);
        }

        .ac-status-label {
          font-size: 14px;
          font-weight: 600;
          color: #1E293B;
          user-select: none;
        }

        .ac-helper-text {
          font-size: 12px;
          color: #64748B;
          margin: 6px 0 0 0;
          line-height: 1.4;
        }

        /* Footer Actions */
        .ac-footer-actions {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 12px;
          margin-top: 4px;
          padding-top: 6px;
        }

        .ac-btn-cancel {
          height: 40px;
          padding: 0 24px;
          border: 1px solid #CBD5E1;
          background: #FFFFFF;
          color: #334155;
          font-size: 14px;
          font-weight: 500;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
          font-family: inherit;
        }

        .ac-btn-cancel:hover {
          background: #F8FAFC;
          border-color: #94A3B8;
        }

        .ac-btn-submit {
          height: 40px;
          padding: 0 24px;
          border: none;
          background: #007E8A;
          color: #FFFFFF;
          font-size: 14px;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
          font-family: inherit;
        }

        .ac-btn-submit:hover {
          background: #006B75;
        }

        .ac-btn-submit:active {
          transform: translateY(1px);
        }

        @media (max-width: 640px) {
          .ac-grid-2 {
            grid-template-columns: 1fr;
          }
          .ac-role-toggle-group {
            grid-template-columns: 1fr;
          }
          .ac-modal-container {
            width: 100%;
            margin: 10px;
          }
        }
      `}</style>
    </div>,
    document.body
  );
};

export default AddCustomerModal;
