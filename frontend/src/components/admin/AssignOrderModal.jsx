import React, { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { 
  X, 
  Truck, 
  MapPin, 
  Phone, 
  User, 
  Calendar, 
  Search, 
  FileText,
  CheckCircle,
  Clock,
  Sparkles
} from 'lucide-react';

export const AssignOrderModal = () => {
  const { 
    isAssignOrderModalOpen, 
    setIsAssignOrderModalOpen, 
    assigningOrder, 
    drivers, 
    assignDriverToOrder 
  } = useAdmin();

  const [selectedDriverId, setSelectedDriverId] = useState('d1');
  const [driverSearch, setDriverSearch] = useState('');
  const [driverNote, setDriverNote] = useState('');

  if (!isAssignOrderModalOpen) return null;

  const currentOrder = assigningOrder || {
    id: '#LDX10289',
    date: '23 Sep 2026',
    pickupTime: '10:00 AM – 12:00 PM',
    customer: {
      name: 'Priya Sharma',
      phone: '+91 99876 54321',
      address: 'House #45, 3rd Cross, HRBR Layout, Bengaluru – 560043'
    },
    services: ['Dry Cleaning'],
    amount: 240,
    type: 'Pickup'
  };

  const filteredDrivers = drivers.filter(d => 
    d.name.toLowerCase().includes(driverSearch.toLowerCase()) || 
    d.phone.includes(driverSearch)
  );

  const handleAssign = () => {
    const d = drivers.find(drv => drv.id === selectedDriverId);
    if (d) {
      assignDriverToOrder(currentOrder.id, `${d.name} (${d.phone})`);
    } else {
      setIsAssignOrderModalOpen(false);
    }
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={() => setIsAssignOrderModalOpen(false)}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-icon-wrap">
              <Truck size={22} />
            </div>
            <div>
              <h2 className="modal-title">Assign Order</h2>
              <p className="modal-subtitle">Assign a driver for pickup or delivery.</p>
            </div>
          </div>
          <button 
            className="modal-close-btn"
            onClick={() => setIsAssignOrderModalOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-form-body">
          {/* Order Details Highlight Box */}
          <div className="order-highlight-card">
            <div className="highlight-header">
              <span className="highlight-tag-name">Order Details</span>
              <span className="highlight-type-badge">{currentOrder.type || 'Pickup'}</span>
            </div>

            <div className="highlight-meta-list">
              <div className="meta-row">
                <FileText size={16} className="text-teal" />
                <div>
                  <strong>{currentOrder.id}</strong>
                  <span className="meta-sub">{currentOrder.pickupTime || '23 Sep 2026, 10:00 AM – 12:00 PM'}</span>
                </div>
              </div>

              <div className="meta-row">
                <User size={16} className="text-teal" />
                <div>
                  <strong>{currentOrder.customer?.name || 'Priya Sharma'}</strong>
                  <span className="meta-sub">{currentOrder.customer?.phone || '+91 99876 54321'}</span>
                </div>
              </div>

              <div className="meta-row map-row">
                <div className="map-left-col">
                  <MapPin size={16} className="text-teal" />
                  <div>
                    <strong>{currentOrder.customer?.address?.split(',')[0] || 'HRBR Layout, Bengaluru'}</strong>
                    <span className="meta-sub">{currentOrder.customer?.address || 'House #45, 3rd Cross, HRBR Layout'}</span>
                  </div>
                </div>
                <button type="button" className="view-map-pill">
                  <MapPin size={12} />
                  <span>View on Map</span>
                </button>
              </div>

              <div className="meta-row services-row">
                <div className="services-left">
                  <Sparkles size={16} className="text-teal" />
                  <div>
                    <strong>{currentOrder.services?.join(', ') || 'Dry Cleaning'}</strong>
                    <span className="meta-sub">1 item</span>
                  </div>
                </div>
                <strong className="order-price-val">₹{currentOrder.amount || 240}</strong>
              </div>
            </div>
          </div>

          {/* Select Driver */}
          <div className="select-driver-section">
            <h3 className="section-title">Select Driver</h3>

            <div className="input-with-icon mt-2">
              <Search size={16} className="input-icon" />
              <input 
                type="text"
                placeholder="Search driver by name or phone..."
                className="modal-input"
                value={driverSearch}
                onChange={(e) => setDriverSearch(e.target.value)}
              />
            </div>

            <div className="drivers-radio-list">
              {filteredDrivers.map(driver => {
                const isSelected = selectedDriverId === driver.id;
                return (
                  <div 
                    key={driver.id}
                    className={`driver-radio-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedDriverId(driver.id)}
                  >
                    <div className="driver-card-left">
                      <div className="driver-avatar">{driver.avatar}</div>
                      <div>
                        <div className="driver-name">{driver.name}</div>
                        <div className="driver-phone">{driver.phone}</div>
                      </div>
                    </div>

                    <div className="driver-card-right">
                      <div className="driver-status-col">
                        <span className={`driver-avail-badge ${driver.status === 'Available' ? 'avail' : 'busy'}`}>
                          ● {driver.status}
                        </span>
                        <span className="driver-orders-count">{driver.ordersToday} orders today</span>
                      </div>

                      <div className={`driver-radio-dot ${isSelected ? 'checked' : ''}`}>
                        {isSelected && <div className="inner-dot" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Note Optional */}
          <div className="form-group">
            <label className="form-label">Note (Optional)</label>
            <textarea 
              rows="2"
              className="modal-textarea"
              placeholder="Add any special instructions for the driver..."
              value={driverNote}
              onChange={(e) => setDriverNote(e.target.value)}
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="modal-footer-actions">
            <button 
              type="button" 
              className="btn btn-outline-teal"
              onClick={() => setIsAssignOrderModalOpen(false)}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="btn btn-teal"
              onClick={handleAssign}
            >
              Assign Order
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .order-highlight-card {
          background: #FAFCFC;
          border: 1.5px solid #E2E8F0;
          border-radius: 16px;
          padding: 18px 20px;
        }

        .highlight-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .highlight-tag-name {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
        }

        .highlight-type-badge {
          font-size: 0.6875rem;
          font-weight: 700;
          color: #0D7A75;
          background: #EBF8F7;
          border: 1px solid #BCEAE6;
          padding: 2px 10px;
          border-radius: 999px;
        }

        .highlight-meta-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .meta-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          font-size: 0.875rem;
        }

        .meta-row.map-row {
          justify-content: space-between;
          align-items: center;
        }

        .map-left-col {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .meta-row.services-row {
          justify-content: space-between;
          align-items: center;
          padding-top: 10px;
          border-top: 1px solid #EDF2F7;
        }

        .services-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .meta-sub {
          font-size: 0.75rem;
          color: #94A3B8;
          display: block;
        }

        .view-map-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #0D7A75;
          cursor: pointer;
        }

        .order-price-val {
          font-size: 1.125rem;
          color: #1E293B;
        }

        .drivers-radio-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 12px;
          max-height: 240px;
          overflow-y: auto;
        }

        .driver-radio-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #FFFFFF;
          border: 1.5px solid #E2E8F0;
          border-radius: 12px;
          padding: 10px 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .driver-radio-card:hover {
          border-color: #BCEAE6;
        }

        .driver-radio-card.selected {
          border-color: #0D7A75;
          background: #F4FBFA;
        }

        .driver-card-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .driver-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #1E293B;
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.75rem;
        }

        .driver-name {
          font-size: 0.875rem;
          font-weight: 700;
          color: #1E293B;
        }

        .driver-phone {
          font-size: 0.75rem;
          color: #64748B;
        }

        .driver-card-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .driver-status-col {
          text-align: right;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .driver-avail-badge {
          font-size: 0.6875rem;
          font-weight: 700;
        }

        .driver-avail-badge.avail {
          color: #10B981;
        }

        .driver-avail-badge.busy {
          color: #F59E0B;
        }

        .driver-orders-count {
          font-size: 0.6875rem;
          color: #94A3B8;
        }

        .driver-radio-dot {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 1.5px solid #CBD5E0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .driver-radio-dot.checked {
          border-color: #0D7A75;
        }

        .inner-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #0D7A75;
        }
      `}</style>
    </div>
  );
};
