import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { X, Tag, Upload, Image as ImageIcon } from 'lucide-react';

export const AddServiceModal = () => {
  const { isAddServiceModalOpen, setIsAddServiceModalOpen, addService } = useAdmin();

  const [form, setForm] = useState({
    name: 'Dry Cleaning',
    description: 'Premium dry cleaning for delicate fabrics like suits, sarees, coats, etc.',
    category: 'Dry Cleaning',
    price: 240,
    turnaround: '2 - 3 Days',
    status: true,
    image: '/assets/service-dryclean.jpg'
  });

  if (!isAddServiceModalOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    addService(form);
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={() => setIsAddServiceModalOpen(false)}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-icon-wrap">
              <Tag size={22} />
            </div>
            <div>
              <h2 className="modal-title">Add Service</h2>
              <p className="modal-subtitle">Add, edit or manage your laundry services and pricing.</p>
            </div>
          </div>
          <button 
            className="modal-close-btn"
            onClick={() => setIsAddServiceModalOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form-body">
          {/* Service Name */}
          <div className="form-group">
            <label className="form-label">Service Name *</label>
            <input 
              type="text" 
              required
              className="modal-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Dry Cleaning, Wash & Fold"
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <div className="label-with-count">
              <label className="form-label">Description *</label>
              <span className="char-count">{form.description.length}/200</span>
            </div>
            <textarea 
              rows="3"
              required
              className="modal-textarea"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the service..."
            />
          </div>

          {/* Category & Turnaround */}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select 
                className="modal-select"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="Wash & Fold">Wash & Fold</option>
                <option value="Dry Cleaning">Dry Cleaning</option>
                <option value="Steam Ironing">Steam Ironing</option>
                <option value="Special Care">Special Care</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Estimated Turnaround Time *</label>
              <select 
                className="modal-select"
                value={form.turnaround}
                onChange={(e) => setForm({ ...form, turnaround: e.target.value })}
              >
                <option value="1 - 2 Days">1 – 2 Days</option>
                <option value="2 - 3 Days">2 – 3 Days</option>
                <option value="Same Day">Same Day Express</option>
              </select>
            </div>
          </div>

          {/* Price */}
          <div className="form-group">
            <label className="form-label">Price (₹) *</label>
            <input 
              type="number"
              required
              className="modal-input"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="240"
            />
          </div>

          {/* Availability Status */}
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
          </div>

          {/* Service Image */}
          <div className="form-group">
            <label className="form-label">Service Image</label>
            <div className="service-image-upload-card">
              <div className="preview-thumb-box">
                <img src="/assets/service-dryclean.jpg" alt="Preview" className="preview-thumb" />
              </div>
              <div className="upload-box-content">
                <button type="button" className="upload-change-btn">
                  <Upload size={16} />
                  <span>Change Image</span>
                </button>
                <span className="upload-hint">JPG, PNG (Max 2MB)</span>
              </div>
            </div>
          </div>

          <div className="modal-footer-actions">
            <button 
              type="button" 
              className="btn btn-outline-teal"
              onClick={() => setIsAddServiceModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-teal">
              Save Changes
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .label-with-count {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .char-count {
          font-size: 0.75rem;
          color: #94A3B8;
        }

        .service-image-upload-card {
          display: flex;
          align-items: center;
          gap: 16px;
          border: 1.5px dashed #CBD5E0;
          border-radius: 14px;
          padding: 14px 18px;
          background: #FAFCFC;
        }

        .preview-thumb-box {
          width: 54px;
          height: 54px;
          border-radius: 10px;
          overflow: hidden;
          background: #E2E8F0;
          flex-shrink: 0;
        }

        .preview-thumb {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .upload-box-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .upload-change-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 6px 14px;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #0D7A75;
          cursor: pointer;
        }

        .upload-hint {
          font-size: 0.6875rem;
          color: #94A3B8;
        }
      `}</style>
    </div>
  );
};
