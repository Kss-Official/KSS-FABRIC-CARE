import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAdmin } from '../../context/AdminContext';
import { 
  X, 
  Tag, 
  Upload, 
  ChevronDown, 
  Image as ImageIcon 
} from 'lucide-react';

export const AddServiceModal = () => {
  const { isAddServiceModalOpen, setIsAddServiceModalOpen, addService } = useAdmin();
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isAddServiceModalOpen) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = orig || '';
      };
    }
  }, [isAddServiceModalOpen]);

  const [form, setForm] = useState({
    name: 'Shirt',
    description: 'Regular shirt cleaning and pressing',
    category: 'Wash & Fold',
    price: 80,
    turnaround: '2–3 days',
    status: true,
    image: null
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      if (addService) {
        await addService({
          ...form,
          price: Number(form.price) || 80,
          status: form.status ? 'Active' : 'Inactive',
          image: imagePreview || form.image
        });
      }
      setIsAddServiceModalOpen(false);
      setForm({
        name: '',
        description: '',
        category: 'Wash & Fold',
        price: '',
        turnaround: '2–3 days',
        status: true,
        image: null
      });
      setImagePreview(null);
    } catch (err) {
      console.error('Error adding service:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  if (!isAddServiceModalOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="add-service-backdrop animate-fade-in" onClick={() => setIsAddServiceModalOpen(false)}>
      <div className="add-service-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="add-service-header">
          <div className="add-service-header-left">
            <div className="add-service-icon-box">
              <Tag size={20} strokeWidth={2} />
            </div>
            <div className="add-service-header-text">
              <h2 className="add-service-title">Add Service</h2>
              <p className="add-service-subtitle">Add, edit or manage your laundry services and pricing.</p>
            </div>
          </div>
          <button 
            type="button"
            className="add-service-close-btn"
            onClick={() => setIsAddServiceModalOpen(false)}
            aria-label="Close modal"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="add-service-form">
          {/* Service */}
          <div className="add-service-field-group">
            <label className="add-service-label">
              Service <span className="req-star">*</span>
            </label>
            <div className="add-service-select-wrap">
              <select 
                className="add-service-select"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="Wash & Fold">Wash & Fold</option>
                <option value="Dry Cleaning">Dry Cleaning</option>
                <option value="Steam Ironing">Steam Ironing</option>
                <option value="Household">Household</option>
                <option value="Wash & Iron">Wash & Iron</option>
                <option value="Express">Express</option>
                <option value="Express Laundry">Express Laundry</option>
                <option value="Shoe Laundry">Shoe Laundry</option>
                <option value="Home Care">Home Care</option>
                <option value="Clothing">Clothing</option>
              </select>
              <ChevronDown size={16} className="add-service-select-chevron" />
            </div>
          </div>

          {/* Item Name */}
          <div className="add-service-field-group">
            <label className="add-service-label">
              Item Name <span className="req-star">*</span>
            </label>
            <input 
              type="text" 
              required
              className="add-service-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Shirt"
            />
          </div>

          {/* Description */}
          <div className="add-service-field-group">
            <label className="add-service-label">
              Description <span className="req-star">*</span>
            </label>
            <textarea 
              rows="3"
              required
              maxLength={200}
              className="add-service-textarea"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Regular shirt cleaning and pressing"
            />
            <span className="add-service-char-count">{form.description.length}/200</span>
          </div>

          {/* Price (₹) */}
          <div className="add-service-field-group">
            <label className="add-service-label">
              Price (₹) <span className="req-star">*</span>
            </label>
            <input 
              type="number"
              required
              className="add-service-input"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="240"
            />
          </div>

          {/* Estimated Turnaround Time */}
          <div className="add-service-field-group">
            <label className="add-service-label">Estimated Turnaround Time</label>
            <div className="add-service-select-wrap">
              <select 
                className="add-service-select"
                value={form.turnaround}
                onChange={(e) => setForm({ ...form, turnaround: e.target.value })}
              >
                <option value="2–3 days">2–3 days</option>
                <option value="24 hours">24 hours</option>
                <option value="3–4 days">3–4 days</option>
                <option value="Same Day Express">Same Day Express</option>
              </select>
              <ChevronDown size={16} className="add-service-select-chevron" />
            </div>
          </div>

          {/* Status */}
          <div className="add-service-field-group">
            <label className="add-service-label">Status</label>
            <div className="add-service-status-row">
              <button 
                type="button"
                className={`add-service-switch ${form.status ? 'active' : ''}`}
                onClick={() => setForm({ ...form, status: !form.status })}
                role="switch"
                aria-checked={form.status}
                aria-label="Toggle service status"
              >
                <span className="add-service-switch-knob" />
              </button>
              <span className="add-service-status-text">{form.status ? 'Active' : 'Inactive'}</span>
            </div>
          </div>

          {/* Service Image */}
          <div className="add-service-field-group">
            <label className="add-service-label">Service Image</label>
            <div className="add-service-image-row">
              <div className="add-service-thumb-placeholder">
                {imagePreview ? (
                  <img src={imagePreview} alt="Service preview" className="thumb-preview-img" />
                ) : (
                  <ImageIcon size={20} color="#A78BFA" />
                )}
              </div>

              <div 
                className="add-service-upload-card" 
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/png, image/jpeg, image/jpg" 
                  style={{ display: 'none' }}
                  onChange={handleImageChange}
                />
                <div className="upload-icon-circle">
                  <Upload size={15} color="#0D7A75" strokeWidth={2} />
                </div>
                <div className="upload-card-text">
                  <span className="upload-main-text">Change Image</span>
                  <span className="upload-sub-text">JPG, PNG (Max 2MB)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="add-service-footer">
            <button 
              type="button" 
              className="add-service-cancel-btn"
              onClick={() => setIsAddServiceModalOpen(false)}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="add-service-submit-btn"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .add-service-backdrop {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100%;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px 16px;
          overflow: hidden;
          overscroll-behavior: none;
        }

        .add-service-modal-card {
          width: 620px;
          max-width: 100%;
          background: #FFFFFF;
          border-radius: 26px;
          box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.12), 0 0 1px 1px rgba(0, 0, 0, 0.05);
          padding: 28px 32px 24px 32px;
          display: flex;
          flex-direction: column;
          animation: modalScaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          max-height: calc(100vh - 40px);
          max-height: calc(100dvh - 40px);
          overflow: hidden;
          overscroll-behavior: contain;
          position: relative;
        }

        @keyframes modalScaleUp {
          from {
            opacity: 0;
            transform: scale(0.97) translateY(8px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }

        .add-service-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 22px;
          flex-shrink: 0;
        }

        .add-service-header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .add-service-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #E6F7F5;
          color: #0D7A75;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .add-service-header-text {
          display: flex;
          flex-direction: column;
        }

        .add-service-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: #1E293B;
          line-height: 1.2;
          margin: 0;
        }

        .add-service-subtitle {
          font-size: 0.8125rem;
          color: #64748B;
          margin: 3px 0 0 0;
        }

        .add-service-close-btn {
          background: none;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.15s ease;
        }

        .add-service-close-btn:hover {
          color: #1E293B;
        }

        .add-service-form {
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          overscroll-behavior: contain;
          flex: 1 1 auto;
          min-height: 0;
          padding-right: 4px;
        }

        .add-service-field-group {
          display: flex;
          flex-direction: column;
          margin-bottom: 16px;
        }

        .add-service-label {
          font-size: 0.875rem;
          font-weight: 700;
          color: #1E293B;
          margin-bottom: 7px;
          display: flex;
          align-items: center;
          gap: 3px;
        }

        .req-star {
          color: #EF4444;
          font-weight: 700;
        }

        .add-service-input {
          width: 100%;
          height: 42px;
          border: 1.5px solid #E2E8F0;
          border-radius: 12px;
          padding: 0 14px;
          font-size: 0.875rem;
          color: #1E293B;
          background: #FFFFFF;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.15s ease;
        }

        .add-service-input:focus {
          border-color: #0D7A75;
        }

        .add-service-textarea {
          width: 100%;
          height: 84px;
          border: 1.5px solid #E2E8F0;
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 0.875rem;
          color: #1E293B;
          line-height: 1.45;
          background: #FFFFFF;
          outline: none;
          box-sizing: border-box;
          resize: none;
          transition: border-color 0.15s ease;
        }

        .add-service-textarea:focus {
          border-color: #0D7A75;
        }

        .add-service-char-count {
          text-align: right;
          font-size: 0.75rem;
          color: #94A3B8;
          margin-top: 4px;
          font-weight: 500;
        }

        .add-service-select-wrap {
          position: relative;
        }

        .add-service-select {
          width: 100%;
          height: 42px;
          border: 1.5px solid #E2E8F0;
          border-radius: 12px;
          padding: 0 38px 0 14px;
          font-size: 0.875rem;
          font-weight: 500;
          color: #1E293B;
          background: #FFFFFF;
          outline: none;
          appearance: none;
          -webkit-appearance: none;
          cursor: pointer;
          box-sizing: border-box;
          transition: border-color 0.15s ease;
        }

        .add-service-select:focus {
          border-color: #0D7A75;
        }

        .add-service-select-chevron {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          color: #94A3B8;
        }

        .add-service-status-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .add-service-switch {
          width: 44px;
          height: 24px;
          border-radius: 9999px;
          border: none;
          background: #E2E8F0;
          cursor: pointer;
          position: relative;
          transition: background-color 0.2s ease;
          padding: 0;
          outline: none;
          flex-shrink: 0;
        }

        .add-service-switch.active {
          background: #0D7A75;
        }

        .add-service-switch-knob {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #FFFFFF;
          transition: transform 0.2s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
        }

        .add-service-switch.active .add-service-switch-knob {
          transform: translateX(20px);
        }

        .add-service-status-text {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1E293B;
        }

        .add-service-image-row {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .add-service-thumb-placeholder {
          width: 58px;
          height: 58px;
          border-radius: 12px;
          background: #EDE9FE;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          overflow: hidden;
        }

        .thumb-preview-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .add-service-upload-card {
          flex: 1;
          height: 58px;
          border: 1.5px dashed #CBD5E1;
          border-radius: 12px;
          background: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          cursor: pointer;
          box-sizing: border-box;
          transition: border-color 0.15s ease;
        }

        .add-service-upload-card:hover {
          border-color: #0D7A75;
        }

        .upload-icon-circle {
          width: 34px;
          height: 34px;
          border: 1.5px solid #E2E8F0;
          border-radius: 8px;
          background: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .upload-card-text {
          display: flex;
          flex-direction: column;
        }

        .upload-main-text {
          font-size: 0.875rem;
          font-weight: 700;
          color: #0D7A75;
          line-height: 1.2;
        }

        .upload-sub-text {
          font-size: 0.75rem;
          color: #94A3B8;
          margin-top: 2px;
        }

        .add-service-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 18px;
          border-top: 1px solid #F1F5F9;
          margin-top: 8px;
          flex-shrink: 0;
        }

        .add-service-cancel-btn {
          border: 1.5px solid #E2E8F0;
          background: #FFFFFF;
          color: #475569;
          border-radius: 12px;
          padding: 10px 24px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .add-service-cancel-btn:hover {
          background: #F8FAFC;
          color: #1E293B;
        }

        .add-service-submit-btn {
          border: none;
          background: #087F77;
          color: #FFFFFF;
          border-radius: 12px;
          padding: 10px 24px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .add-service-submit-btn:hover {
          background: #066761;
        }
      `}</style>
    </div>,
    document.body
  );
};
