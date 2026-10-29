import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  ChevronDown, 
  X,
  Truck,
  Building2,
  Clock,
  Tag
} from 'lucide-react';

export const EditUserProfileModal = ({ 
  isOpen, 
  onClose, 
  user, 
  currentRole, 
  onSave 
}) => {
  // ── All hooks MUST come before any early returns (React Rules of Hooks) ──

  const safeUser = user || {};

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    status: 'Active',
    location: '',
    department: 'Laundry Operations',
    shift: 'Morning (8 AM - 4 PM)',
    vehicleType: 'Two-Wheeler',
    vehicleNumber: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Sync form whenever user changes (or modal opens with a new user)
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.fullName || user.name || '',
        phone: (user.phone || user.phoneNumber || '').replace(/\D/g, '').slice(0, 10),
        email: user.email || '',
        status: (user.isActive !== false && user.status !== 'Inactive') ? 'Active' : 'Inactive',
        location: user.location || user.address || user.area || '',
        department: user.department || 'Laundry Operations',
        shift: user.shift || 'Morning (8 AM - 4 PM)',
        vehicleType: user.vehicleType || 'Two-Wheeler',
        vehicleNumber: user.vehicleNumber || ''
      });
      setErrors({});
    }
  }, [user, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // ── Early return AFTER all hooks ──
  if (!isOpen || !user) return null;

  // Determine effective role for title and fields
  const effectiveRole = (
    safeUser.role || 
    safeUser.userType || 
    currentRole || 
    ''
  ).toLowerCase();

  // Dynamic Title strictly as requested:
  // - Customer: Edit Customer Profile
  // - Delivery Agent: Edit Delivery Profile
  // - Staff: Edit Staff Profile
  // - Fallback: Edit User Profile
  const getModalTitle = () => {
    if (effectiveRole.includes('customer')) {
      return 'Edit Customer Profile';
    }
    if (effectiveRole.includes('agent') || effectiveRole.includes('delivery')) {
      return 'Edit Delivery Profile';
    }
    if (effectiveRole.includes('staff')) {
      return 'Edit Staff Profile';
    }
    return 'Edit User Profile';
  };

  const codeId = safeUser.code || safeUser.id || (
    effectiveRole.includes('staff') 
      ? `#STF${(safeUser.uid || '1020').substring(0, 4)}` 
      : (effectiveRole.includes('agent') || effectiveRole.includes('delivery') 
          ? `#DEL${(safeUser.uid || '1020').substring(0, 4)}` 
          : `#CUS${(safeUser.uid || '1020').substring(0, 4)}`)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      errs.name = 'Full name is required';
    } else if (!/^[A-Za-z\s]+$/.test(trimmedName)) {
      errs.name = 'Name must contain only alphabetic characters and spaces';
    } else if (trimmedName.replace(/\s+/g, '').length < 2) {
      errs.name = 'Name must be at least 2 letters';
    } else if (trimmedName.length > 20) {
      errs.name = 'Name cannot exceed 20 characters';
    }

    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (!cleanPhone) {
      errs.phone = 'Mobile number is required';
    } else if (cleanPhone.length !== 10) {
      errs.phone = 'Mobile number must be exactly 10 digits';
    } else if (!/^[6-9]/.test(cleanPhone)) {
      errs.phone = 'Mobile number must start with 6, 7, 8, or 9';
    }

    const trimmedEmail = formData.email.trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!trimmedEmail) {
      errs.email = 'Email address is required';
    } else if (!emailRegex.test(trimmedEmail)) {
      errs.email = 'Please enter a valid email address (e.g., name@example.com)';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setIsSubmitting(true);
    try {
      if (onSave) {
        await onSave({
          ...formData,
          isActive: formData.status === 'Active'
        });
      }
      onClose();
    } catch (err) {
      console.error('Failed to save profile changes:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStaff = effectiveRole.includes('staff');
  const isDelivery = effectiveRole.includes('agent') || effectiveRole.includes('delivery');

  return createPortal(
    <div 
      className="eup-modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '20px'
      }}
    >
      <div 
        className="eup-modal-card" 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '590px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
          animation: 'eupFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header matching Reference Image 2 */}
        <div 
          className="eup-header"
          style={{
            padding: '20px 26px 18px 26px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #F1F5F9'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div 
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: '#E0F2FE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <User size={22} color="#0284C7" strokeWidth={1.8} />
            </div>
            <div>
              <h3 
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#1E293B',
                  margin: 0,
                  lineHeight: 1.25,
                  letterSpacing: '-0.01em'
                }}
              >
                {getModalTitle()}
              </h3>
              <span 
                style={{
                  fontSize: '0.8125rem',
                  color: '#64748B',
                  fontWeight: 500,
                  marginTop: '2px',
                  display: 'block'
                }}
              >
                {codeId}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              color: '#64748B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s, color 0.15s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#0F172A'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748B'; }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body matching Reference Image 2 */}
        <form 
          onSubmit={handleSubmit}
          style={{
            padding: '24px 26px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            overflowY: 'auto'
          }}
        >
          {/* Row 1: Full Name & Phone Number */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Full Name */}
            <div>
              <label 
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#1E293B',
                  marginBottom: '7px'
                }}
              >
                Full Name <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <div 
                className="eup-input-wrapper"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#FFFFFF',
                  border: errors.name ? '1.5px solid #EF4444' : '1px solid #E2E8F0',
                  borderRadius: '10px',
                  height: '44px',
                  padding: '0 12px',
                  boxShadow: errors.name ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : '0 1px 2px rgba(0,0,0,0.02)',
                  transition: 'border-color 0.15s, box-shadow 0.15s'
                }}
              >
                <User size={17} color={errors.name ? '#EF4444' : '#94A3B8'} strokeWidth={1.8} style={{ flexShrink: 0, marginRight: '10px' }} />
                <input 
                  type="text" 
                  maxLength={20}
                  value={formData.name}
                  onChange={(e) => {
                    const lettersOnly = e.target.value.replace(/[^A-Za-z\s]/g, '').slice(0, 20);
                    setFormData({ ...formData, name: lettersOnly });
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
                    const trimmed = formData.name.trim();
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
                  placeholder="Enter full name (max 20 characters)"
                  required
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: '0.875rem',
                    color: '#1E293B',
                    width: '100%',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
              {errors.name && <span style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{errors.name}</span>}
            </div>

            {/* Phone Number */}
            <div>
              <label 
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#1E293B',
                  marginBottom: '7px'
                }}
              >
                Phone Number <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <div 
                className="eup-input-wrapper"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#FFFFFF',
                  border: errors.phone ? '1.5px solid #EF4444' : '1px solid #E2E8F0',
                  borderRadius: '10px',
                  height: '44px',
                  padding: '0 12px',
                  boxShadow: errors.phone ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : '0 1px 2px rgba(0,0,0,0.02)',
                  transition: 'border-color 0.15s, box-shadow 0.15s'
                }}
              >
                <Phone size={17} color={errors.phone ? '#EF4444' : '#94A3B8'} strokeWidth={1.8} style={{ flexShrink: 0, marginRight: '10px' }} />
                <input 
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={formData.phone}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setFormData({ ...formData, phone: digits });
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
                    const digits = formData.phone.replace(/\D/g, '');
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
                  placeholder="10-digit mobile number"
                  required
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: '0.875rem',
                    color: '#1E293B',
                    width: '100%',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
              {errors.phone && <span style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{errors.phone}</span>}
            </div>
          </div>

          {/* Row 2: Email Address & Account Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Email Address */}
            <div>
              <label 
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#1E293B',
                  marginBottom: '7px'
                }}
              >
                Email Address <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <div 
                className="eup-input-wrapper"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#FFFFFF',
                  border: errors.email ? '1.5px solid #EF4444' : '1px solid #E2E8F0',
                  borderRadius: '10px',
                  height: '44px',
                  padding: '0 12px',
                  boxShadow: errors.email ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : '0 1px 2px rgba(0,0,0,0.02)',
                  transition: 'border-color 0.15s, box-shadow 0.15s'
                }}
              >
                <Mail size={17} color={errors.email ? '#EF4444' : '#94A3B8'} strokeWidth={1.8} style={{ flexShrink: 0, marginRight: '10px' }} />
                <input 
                  type="email" 
                  inputMode="email"
                  value={formData.email}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({ ...formData, email: val });
                    if (errors.email) {
                      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                      if (emailRegex.test(val.trim())) {
                        setErrors(prev => ({ ...prev, email: '' }));
                      }
                    }
                  }}
                  onBlur={() => {
                    const trimmed = formData.email.trim();
                    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                    if (!trimmed) {
                      setErrors(prev => ({ ...prev, email: 'Email address is required' }));
                    } else if (!emailRegex.test(trimmed)) {
                      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address (e.g., name@example.com)' }));
                    } else {
                      setErrors(prev => ({ ...prev, email: '' }));
                    }
                  }}
                  placeholder="name@example.com"
                  required
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: '0.875rem',
                    color: '#1E293B',
                    width: '100%',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
              {errors.email && <span style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{errors.email}</span>}
            </div>

            {/* Account Status */}
            <div>
              <label 
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#1E293B',
                  marginBottom: '7px'
                }}
              >
                Account Status <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <div 
                className="eup-input-wrapper"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  height: '44px',
                  padding: '0 12px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                  position: 'relative',
                  cursor: 'pointer'
                }}
              >
                <span 
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: formData.status === 'Active' ? '#10B981' : '#94A3B8',
                    display: 'inline-block',
                    flexShrink: 0,
                    marginRight: '10px'
                  }} 
                />
                <select 
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    fontSize: '0.875rem',
                    color: '#1E293B',
                    cursor: 'pointer',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    paddingRight: '20px',
                    fontFamily: 'inherit',
                    fontWeight: 500
                  }}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                <ChevronDown size={17} color="#64748B" style={{ position: 'absolute', right: '12px', pointerEvents: 'none' }} />
              </div>
            </div>
          </div>

          {/* Role-Specific Row: Staff Details */}
          {isStaff && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label 
                  style={{
                    display: 'block',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: '#1E293B',
                    marginBottom: '7px'
                  }}
                >
                  Department <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div 
                  className="eup-input-wrapper"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    height: '44px',
                    padding: '0 12px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                  }}
                >
                  <Building2 size={17} color="#94A3B8" strokeWidth={1.8} style={{ flexShrink: 0, marginRight: '10px' }} />
                  <input 
                    type="text" 
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g. Laundry Operations"
                    style={{
                      flex: 1,
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      fontSize: '0.875rem',
                      color: '#1E293B',
                      width: '100%',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              </div>

              <div>
                <label 
                  style={{
                    display: 'block',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: '#1E293B',
                    marginBottom: '7px'
                  }}
                >
                  Shift <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div 
                  className="eup-input-wrapper"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    height: '44px',
                    padding: '0 12px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                  }}
                >
                  <Clock size={17} color="#94A3B8" strokeWidth={1.8} style={{ flexShrink: 0, marginRight: '10px' }} />
                  <input 
                    type="text" 
                    value={formData.shift}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                    placeholder="e.g. Morning (8 AM - 4 PM)"
                    style={{
                      flex: 1,
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      fontSize: '0.875rem',
                      color: '#1E293B',
                      width: '100%',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Role-Specific Row: Delivery Details */}
          {isDelivery && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label 
                  style={{
                    display: 'block',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: '#1E293B',
                    marginBottom: '7px'
                  }}
                >
                  Vehicle Type <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div 
                  className="eup-input-wrapper"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    height: '44px',
                    padding: '0 12px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                    position: 'relative',
                    cursor: 'pointer'
                  }}
                >
                  <Truck size={17} color="#94A3B8" strokeWidth={1.8} style={{ flexShrink: 0, marginRight: '10px' }} />
                  <select 
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    style={{
                      flex: 1,
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      fontSize: '0.875rem',
                      color: '#1E293B',
                      cursor: 'pointer',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      paddingRight: '20px',
                      fontFamily: 'inherit'
                    }}
                  >
                    <option value="Two-Wheeler">Two-Wheeler</option>
                    <option value="Three-Wheeler">Three-Wheeler</option>
                    <option value="Van">Van</option>
                  </select>
                  <ChevronDown size={17} color="#64748B" style={{ position: 'absolute', right: '12px', pointerEvents: 'none' }} />
                </div>
              </div>

              <div>
                <label 
                  style={{
                    display: 'block',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: '#1E293B',
                    marginBottom: '7px'
                  }}
                >
                  Vehicle Number <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div 
                  className="eup-input-wrapper"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    height: '44px',
                    padding: '0 12px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                  }}
                >
                  <Tag size={17} color="#94A3B8" strokeWidth={1.8} style={{ flexShrink: 0, marginRight: '10px' }} />
                  <input 
                    type="text" 
                    value={formData.vehicleNumber}
                    onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                    placeholder="e.g. KA 01 AB 1234"
                    style={{
                      flex: 1,
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      fontSize: '0.875rem',
                      color: '#1E293B',
                      width: '100%',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Full Width Row: Address / Locality */}
          <div>
            <label 
              style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: '#1E293B',
                marginBottom: '7px'
              }}
            >
              Address / Locality <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div 
              className="eup-input-wrapper"
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                height: '44px',
                padding: '0 12px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                transition: 'border-color 0.15s, box-shadow 0.15s'
              }}
            >
              <MapPin size={17} color="#94A3B8" strokeWidth={1.8} style={{ flexShrink: 0, marginRight: '10px' }} />
              <input 
                type="text" 
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Enter address or locality"
                required
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: '0.875rem',
                  color: '#1E293B',
                  width: '100%',
                  fontFamily: 'inherit'
                }}
              />
            </div>
          </div>

          {/* Footer Action Buttons matching Reference Image 2 */}
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginTop: '8px',
              paddingTop: '6px'
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                padding: '10px 24px',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#475569',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                background: '#0D7A75',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 24px',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#FFFFFF',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.8 : 1,
                boxShadow: '0 1px 2px rgba(13, 122, 117, 0.2)',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => { if (!isSubmitting) e.currentTarget.style.background = '#09635F'; }}
              onMouseLeave={(e) => { if (!isSubmitting) e.currentTarget.style.background = '#0D7A75'; }}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes eupFadeIn {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(-8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .eup-input-wrapper:focus-within {
          border-color: #0284C7 !important;
          box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.12) !important;
        }
      `}</style>
    </div>,
    document.body
  );
};
