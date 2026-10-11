import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  MessageSquare, 
  MapPin, 
  Home, 
  Building2, 
  FileText,
  UserPlus
} from 'lucide-react';

export const AddCustomerModal = () => {
  const { isAddCustomerModalOpen, setIsAddCustomerModalOpen, addCustomer } = useAdmin();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    whatsapp: '',
    address1: '',
    address2: '',
    city: 'Bengaluru',
    pincode: '560043',
    area: 'HSR Layout',
    locationType: 'Home',
    notes: '',
    status: true
  });

  if (!isAddCustomerModalOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    addCustomer({
      name: form.name,
      phone: form.phone,
      email: form.email,
      area: form.area,
      pincode: form.pincode,
      status: form.status
    });
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={() => setIsAddCustomerModalOpen(false)}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-icon-wrap">
              <UserPlus size={22} />
            </div>
            <div>
              <h2 className="modal-title">Add Customer</h2>
              <p className="modal-subtitle">Add a new customer to create orders or manage their details.</p>
            </div>
          </div>
          <button 
            className="modal-close-btn"
            onClick={() => setIsAddCustomerModalOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Form */}
        <form onSubmit={handleSubmit} className="modal-form-body">
          {/* Section 1: Personal Information */}
          <div className="form-section-title">Personal Information</div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <div className="input-with-icon">
                <User size={16} className="input-icon" />
                <input 
                  type="text"
                  required
                  placeholder="Enter customer name"
                  className="modal-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <div className="input-with-icon">
                <Phone size={16} className="input-icon" />
                <input 
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  className="modal-input"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email (Optional)</label>
              <div className="input-with-icon">
                <Mail size={16} className="input-icon" />
                <input 
                  type="email"
                  placeholder="Enter email address"
                  className="modal-input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">WhatsApp Number (Optional)</label>
              <div className="input-with-icon">
                <MessageSquare size={16} className="input-icon" />
                <input 
                  type="tel"
                  placeholder="+91 98765 43210"
                  className="modal-input"
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="modal-divider" />

          {/* Section 2: Address Information */}
          <div className="form-section-title">Address Information</div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Address Line 1 *</label>
              <div className="input-with-icon">
                <MapPin size={16} className="input-icon" />
                <input 
                  type="text"
                  required
                  placeholder="House no., Street name, Area"
                  className="modal-input"
                  value={form.address1}
                  onChange={(e) => setForm({ ...form, address1: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Address Line 2 (Optional)</label>
              <div className="input-with-icon">
                <MapPin size={16} className="input-icon" />
                <input 
                  type="text"
                  placeholder="Apartment, Landmark, etc."
                  className="modal-input"
                  value={form.address2}
                  onChange={(e) => setForm({ ...form, address2: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">City *</label>
              <select 
                className="modal-select"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              >
                <option value="Bengaluru">Bengaluru</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Delhi NCR">Delhi NCR</option>
                <option value="Hyderabad">Hyderabad</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Pincode *</label>
              <div className="input-with-icon">
                <MapPin size={16} className="input-icon" />
                <input 
                  type="text"
                  required
                  placeholder="560043"
                  className="modal-input"
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Area / Locality *</label>
              <select 
                className="modal-select"
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
              >
                <option value="HSR Layout">HSR Layout</option>
                <option value="Banaswadi">Banaswadi</option>
                <option value="HRBR Layout">HRBR Layout</option>
                <option value="Indiranagar">Indiranagar</option>
                <option value="Koramangala">Koramangala</option>
                <option value="Whitefield">Whitefield</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Location Type</label>
              <div className="location-type-radios">
                <label className="radio-label">
                  <input 
                    type="radio" 
                    name="locType" 
                    checked={form.locationType === 'Home'}
                    onChange={() => setForm({ ...form, locationType: 'Home' })}
                  />
                  <span>Home</span>
                </label>
                <label className="radio-label">
                  <input 
                    type="radio" 
                    name="locType" 
                    checked={form.locationType === 'Office'}
                    onChange={() => setForm({ ...form, locationType: 'Office' })}
                  />
                  <span>Office</span>
                </label>
              </div>
            </div>
          </div>

          <div className="modal-divider" />

          {/* Section 3: Additional Details */}
          <div className="form-section-title">Additional Details</div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Customer Notes (Optional)</label>
              <textarea 
                rows="2"
                placeholder="Add any special notes (e.g. preferred time, gate details, etc.)"
                className="modal-textarea"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <div className="status-toggle-card">
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.checked })}
                  />
                  <span className="slider round"></span>
                </label>
                <span className="toggle-label">{form.status ? 'Active' : 'Inactive'}</span>
              </div>
              <span className="helper-text">Active customers can place orders and receive services.</span>
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="modal-footer-actions">
            <button 
              type="button"
              className="btn btn-outline-teal"
              onClick={() => setIsAddCustomerModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-teal">
              Add Customer
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.5);
          backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .modal-container {
          background: #FFFFFF;
          border-radius: 24px;
          width: 680px;
          max-width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 48px rgba(0,0,0,0.18);
        }

        .modal-header {
          padding: 24px 28px;
          border-bottom: 1px solid #E2E8F0;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .modal-header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .modal-icon-wrap {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #EBF8F7;
          color: #0D7A75;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: #1E293B;
        }

        .modal-subtitle {
          font-size: 0.8125rem;
          color: #64748B;
        }

        .modal-close-btn {
          background: none;
          border: none;
          color: #94A3B8;
          cursor: pointer;
        }

        .modal-form-body {
          padding: 28px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-section-title {
          font-size: 0.9375rem;
          font-weight: 800;
          color: #1E293B;
        }

        .form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .modal-input {
          width: 100%;
          padding: 10px 14px 10px 38px;
          border: 1.5px solid #E2E8F0;
          border-radius: 10px;
          font-size: 0.875rem;
          outline: none;
          color: #1E293B;
        }

        .modal-input:focus {
          border-color: #0D7A75;
        }

        .modal-select {
          width: 100%;
          padding: 10px 14px;
          border: 1.5px solid #E2E8F0;
          border-radius: 10px;
          font-size: 0.875rem;
          background: #FFFFFF;
          outline: none;
        }

        .location-type-radios {
          display: flex;
          gap: 20px;
          align-items: center;
          height: 42px;
        }

        .radio-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.875rem;
          cursor: pointer;
        }

        .modal-textarea {
          width: 100%;
          padding: 10px 14px;
          border: 1.5px solid #E2E8F0;
          border-radius: 10px;
          font-size: 0.875rem;
          outline: none;
          resize: none;
        }

        .status-toggle-card {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 4px;
        }

        .toggle-label {
          font-weight: 700;
          font-size: 0.875rem;
          color: #1E293B;
        }

        .helper-text {
          font-size: 0.6875rem;
          color: #94A3B8;
          margin-top: 4px;
          display: block;
        }

        .modal-divider {
          height: 1px;
          background: #F1F5F9;
        }

        .modal-footer-actions {
          display: flex;
          justify-content: flex-end;
          gap: 14px;
          margin-top: 10px;
        }

        @media (max-width: 640px) {
          .form-grid-2 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
