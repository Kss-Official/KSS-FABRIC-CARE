import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAdmin } from '../../context/AdminContext';
import { 
  X, 
  Truck, 
  MapPin, 
  User, 
  Search, 
  FileText
} from 'lucide-react';
import { formatOrderId } from '../../utils/helpers';

// Shirt SVG Icon matching Row 4 of Order Details in Reference Image
const ShirtIcon = ({ size = 16, color = '#0891B2' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
  </svg>
);

// Drivers list exactly matching Reference Image
const DEFAULT_DRIVERS = [
  { id: 'd1', name: 'Ravi Kumar', phone: '+91 98765 43210', status: 'Available', ordersToday: 5, avatar: 'RK', avatarBg: '#0F172A' },
  { id: 'd2', name: 'Arjun Singh', phone: '+91 87654 32109', status: 'Available', ordersToday: 4, avatar: 'AS', avatarBg: '#0F172A' },
  { id: 'd3', name: 'Mohammed Taha', phone: '+91 91234 55678', status: 'Available', ordersToday: 3, avatar: 'MT', avatarBg: '#0F172A' },
  { id: 'd4', name: 'Suresh Kumar', phone: '+91 99887 66554', status: 'On Delivery', ordersToday: 2, avatar: 'SK', avatarBg: '#0F172A' },
  { id: 'd5', name: 'Praveen D', phone: '+91 98712 34567', status: 'Available', ordersToday: 4, avatar: 'PD', avatarBg: '#93C5FD' }
];

export const AssignOrderModal = () => {
  const { 
    isAssignOrderModalOpen, 
    setIsAssignOrderModalOpen, 
    assigningOrder, 
    drivers: contextDrivers, 
    assignDriverToOrder 
  } = useAdmin();

  const [selectedDriverId, setSelectedDriverId] = useState('d1'); // Default to Ravi Kumar matching Reference Image
  const [driverSearch, setDriverSearch] = useState('');
  const [driverNote, setDriverNote] = useState('');
  const [validationError, setValidationError] = useState('');

  if (!isAssignOrderModalOpen) return null;

  const formattedPickupTime = useMemo(() => {
    let p = assigningOrder?.pickupTime || (assigningOrder?.date ? `${assigningOrder.date}, ${assigningOrder.timeStart || '10:00 AM'} – ${assigningOrder.timeEnd || '12:00 PM'}` : '23 Sep 2026, 10:00 AM – 12:00 PM');
    const isoM = String(p).match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoM) {
      const dt = new Date(parseInt(isoM[1], 10), parseInt(isoM[2], 10) - 1, parseInt(isoM[3], 10));
      if (!isNaN(dt.getTime())) {
        const dStr = dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        p = p.replace(/^(\d{4})-(\d{1,2})-(\d{1,2})/, dStr);
      }
    }
    p = p.replace(/(AM|PM)\s*[-–—]\s*11:00\s*$/i, '$1');
    return p;
  }, [assigningOrder?.pickupTime, assigningOrder?.date, assigningOrder?.timeStart, assigningOrder?.timeEnd]);

  // Use assigningOrder if passed, otherwise default to Reference Image order FC-10289
  const currentOrder = {
    id: formatOrderId(assigningOrder?.id || assigningOrder?.order_number || assigningOrder?.order_id || 'FC-10289'),
    pickupTime: formattedPickupTime,
    type: assigningOrder?.type || 'Pickup',
    customer: {
      name: assigningOrder?.customer?.name || 'Priya Sharma',
      phone: assigningOrder?.customer?.phone || '+91 99876 54321',
      locality: assigningOrder?.customer?.address?.split(',')[0]?.trim() || 'HRBR Layout, Bengaluru',
      address: assigningOrder?.customer?.fullAddress || assigningOrder?.customer?.address || 'House #45, 3rd Cross, HBBR Layout, Bengaluru – 560043'
    },
    services: assigningOrder?.services?.length ? assigningOrder.services : ['Dry Cleaning'],
    itemCount: assigningOrder?.itemCount || '1 item',
    amount: assigningOrder?.amount || 240
  };

  const driversList = (contextDrivers && contextDrivers.length > 0) ? contextDrivers.map(d => {
    const match = DEFAULT_DRIVERS.find(def => def.id === d.id);
    return {
      ...d,
      avatarBg: match?.avatarBg || (d.id === 'd5' ? '#93C5FD' : '#0F172A')
    };
  }) : DEFAULT_DRIVERS;

  const filteredDrivers = driversList.filter(d => 
    d.name.toLowerCase().includes(driverSearch.toLowerCase().trim()) || 
    d.phone.includes(driverSearch.trim())
  );

  const handleAssign = async () => {
    if (!selectedDriverId) {
      setValidationError('Please select a driver to assign.');
      return;
    }
    const driver = driversList.find(d => d.id === selectedDriverId);
    if (driver) {
      const orderIdentifier = assigningOrder?.rawId || assigningOrder?.id || currentOrder.id;
      const taskType = (assigningOrder?.type === 'Delivery' || currentOrder.type === 'Delivery') ? 'delivery' : 'pickup';

      try {
        await assignDriverToOrder(orderIdentifier, driver, taskType);
      } catch (err) {
        console.warn('assignDriverToOrder note:', err);
      }

      try {
        const stored = JSON.parse(localStorage.getItem('fabricare_pickup_delivery_assignments') || '{}');
        const driverInitials = String(driver.name || 'DR').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'DR';
        const assignmentRecord = {
          driverName: driver.name,
          driverPhone: driver.phone,
          driverInitials,
          assigned: true
        };
        stored[currentOrder.id] = assignmentRecord;
        if (assigningOrder?.id) stored[assigningOrder.id] = assignmentRecord;
        if (assigningOrder?.rawId) stored[assigningOrder.rawId] = assignmentRecord;
        localStorage.setItem('fabricare_pickup_delivery_assignments', JSON.stringify(stored));
        window.dispatchEvent(new Event('storage'));
      } catch (e) {}

      setIsAssignOrderModalOpen(false);
    } else {
      setIsAssignOrderModalOpen(false);
    }
  };

  const handleOpenMap = (address) => {
    const query = encodeURIComponent(address || 'HRBR Layout, Bengaluru');
    window.open(`https://maps.google.com/?q=${query}`, '_blank');
  };

  return createPortal(
    <div 
      className="assign-order-modal-backdrop animate-fade-in"
      onClick={() => setIsAssignOrderModalOpen(false)}
    >
      <div 
        className="assign-order-modal-card animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="assign-modal-header">
          <div className="modal-header-branding">
            <div className="modal-header-icon-badge">
              <Truck size={22} color="#0D7A75" strokeWidth={1.8} />
            </div>
            <div className="modal-header-titles">
              <h2 className="modal-header-main-title">Assign Order</h2>
              <p className="modal-header-subtitle">Assign a driver for pickup or delivery.</p>
            </div>
          </div>
          <button 
            type="button"
            className="modal-close-icon-btn"
            onClick={() => setIsAssignOrderModalOpen(false)}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="assign-modal-body">
          {/* Section 1: Order Details */}
          <div className="order-details-section">
            <div className="details-section-header">
              <span className="details-title-label">Order Details</span>
              <span className="details-type-capsule">{currentOrder.type}</span>
            </div>

            <div className="details-card-container">
              {/* Row 1: Order ID & Time Slot */}
              <div className="details-info-row">
                <div className="details-icon-box cyan">
                  <FileText size={16} color="#0891B2" strokeWidth={1.8} />
                </div>
                <div className="details-text-column">
                  <div className="details-main-val font-mono font-bold">{formatOrderId(currentOrder.id)}</div>
                  <div className="details-sub-val">{currentOrder.pickupTime}</div>
                </div>
              </div>

              {/* Row 2: Customer Name & Phone */}
              <div className="details-info-row">
                <div className="details-icon-box gray">
                  <User size={16} color="#64748B" strokeWidth={1.8} />
                </div>
                <div className="details-text-column">
                  <div className="details-main-val">{currentOrder.customer.name}</div>
                  <div className="details-sub-val">{currentOrder.customer.phone}</div>
                </div>
              </div>

              {/* Row 3: Address & View on Map Button */}
              <div className="details-info-row map-row">
                <div className="details-info-row-left">
                  <div className="details-icon-box gray">
                    <MapPin size={16} color="#64748B" strokeWidth={1.8} />
                  </div>
                  <div className="details-text-column address-clamp">
                    <div className="details-main-val">{currentOrder.customer.locality}</div>
                    <div className="details-sub-val">{currentOrder.customer.address}</div>
                  </div>
                </div>
                <button 
                  type="button" 
                  className="btn-view-on-map"
                  onClick={() => handleOpenMap(currentOrder.customer.address)}
                >
                  <MapPin size={11} color="#0284C7" />
                  <span>View on Map</span>
                </button>
              </div>

              {/* Row 4: Service & Price */}
              <div className="details-info-row price-row">
                <div className="details-info-row-left">
                  <div className="details-icon-box cyan">
                    <ShirtIcon size={16} color="#0891B2" />
                  </div>
                  <div className="details-text-column">
                    <div className="details-main-val">{currentOrder.services.join(', ')}</div>
                    <div className="details-sub-val">{currentOrder.itemCount}</div>
                  </div>
                </div>
                <div className="details-order-price">₹{currentOrder.amount}</div>
              </div>
            </div>
          </div>

          {/* Section 2: Select Driver */}
          <div className="select-driver-section">
            <h3 className="driver-section-heading">Select Driver</h3>

            <div className="driver-search-field-wrap">
              <Search size={15} className="driver-search-magnifier" />
              <input 
                type="text"
                placeholder="Search driver by name or phone..."
                value={driverSearch}
                onChange={(e) => setDriverSearch(e.target.value)}
                className="driver-search-input"
              />
            </div>

            {validationError && (
              <div className="driver-validation-error-msg">{validationError}</div>
            )}

            <div className="drivers-cards-list">
              {filteredDrivers.map((driver) => {
                const isSelected = selectedDriverId === driver.id;
                const isAvailable = driver.status === 'Available';

                return (
                  <div 
                    key={driver.id}
                    className={`driver-selectable-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedDriverId(driver.id);
                      setValidationError('');
                    }}
                  >
                    <div className="driver-card-left-info">
                      <div 
                        className="driver-initials-avatar"
                        style={{ backgroundColor: driver.avatarBg || '#0F172A' }}
                      >
                        {driver.avatar}
                      </div>
                      <div className="driver-name-phone-block">
                        <span className="driver-fullname">{driver.name}</span>
                        <span className="driver-contact">{driver.phone}</span>
                      </div>
                    </div>

                    <div className="driver-card-right-status">
                      <div className="driver-availability-stack">
                        <span className={`driver-status-dot-pill ${isAvailable ? 'available' : 'on-delivery'}`}>
                          ● {driver.status}
                        </span>
                        <span className="driver-orders-count-text">{driver.ordersToday} orders today</span>
                      </div>

                      {/* Radio button circle */}
                      <div className={`driver-radio-indicator ${isSelected ? 'checked' : ''}`}>
                        {isSelected && <div className="driver-radio-inner-dot" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Note (Optional) */}
          <div className="note-optional-section">
            <label className="note-section-label">Note (Optional)</label>
            <textarea 
              rows="3"
              placeholder="Add any special instructions for the driver..."
              value={driverNote}
              onChange={(e) => setDriverNote(e.target.value)}
              className="note-textarea-field"
            />
          </div>

          {/* Section 4: Modal Actions */}
          <div className="assign-modal-actions-row">
            <button 
              type="button" 
              className="btn-modal-cancel"
              onClick={() => setIsAssignOrderModalOpen(false)}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="btn-modal-submit"
              onClick={handleAssign}
            >
              Assign Order
            </button>
          </div>
        </div>
      </div>

      {/* Scoped CSS Matching Reference Image */}
      <style>{`
        .assign-order-modal-backdrop {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          height: 100dvh;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px 16px;
          box-sizing: border-box;
          overflow: hidden;
          overscroll-behavior: none;
          animation: modalFadeIn 0.2s ease-out;
        }

        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .assign-order-modal-card {
          background: #FFFFFF;
          border-radius: 20px;
          width: 100%;
          max-width: 530px;
          max-height: calc(100vh - 40px);
          max-height: calc(100dvh - 40px);
          overflow: hidden;
          overscroll-behavior: contain;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.04);
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          animation: modalScaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          position: relative;
        }

        @keyframes modalScaleUp {
          from { transform: scale(0.96); opacity: 0; }
          to { transform: none; opacity: 1; }
        }

        /* 1. Header */
        .assign-modal-header {
          padding: 24px 28px 18px 28px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          border-bottom: 1px solid #F8FAFC;
        }

        .modal-header-branding {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .modal-header-icon-badge {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #ECFEFF;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .modal-header-titles {
          display: flex;
          flex-direction: column;
        }

        .modal-header-main-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #0F172A;
          margin: 0;
          letter-spacing: -0.01em;
        }

        .modal-header-subtitle {
          font-size: 0.8125rem;
          color: #64748B;
          margin: 3px 0 0 0;
          font-weight: 400;
        }

        .modal-close-icon-btn {
          background: none;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }

        .modal-close-icon-btn:hover {
          background: #F1F5F9;
          color: #0F172A;
        }

        /* 2. Body */
        .assign-modal-body {
          padding: 16px 28px 28px 28px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* Order Details Section */
        .order-details-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .details-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .details-title-label {
          font-size: 0.875rem;
          font-weight: 700;
          color: #0F172A;
        }

        .details-type-capsule {
          background: #ECFEFF;
          color: #0891B2;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 3px 12px;
          border-radius: 9999px;
          text-transform: capitalize;
        }

        .details-card-container {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          overflow: hidden;
        }

        .details-info-row {
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid #F1F5F9;
        }

        .details-info-row:last-child {
          border-bottom: none;
        }

        .details-info-row.map-row,
        .details-info-row.price-row {
          justify-content: space-between;
        }

        .details-info-row-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .details-icon-box {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .details-icon-box.cyan {
          background: #ECFEFF;
        }

        .details-icon-box.gray {
          background: #F1F5F9;
        }

        .details-text-column {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .details-text-column.address-clamp {
          max-width: 250px;
        }

        .details-main-val {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #0F172A;
        }

        .details-sub-val {
          font-size: 0.75rem;
          color: #64748B;
          line-height: 1.3;
        }

        .btn-view-on-map {
          background: #E0F2FE;
          color: #0284C7;
          border: none;
          border-radius: 9999px;
          padding: 4px 10px;
          font-size: 0.6875rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.15s;
        }

        .btn-view-on-map:hover {
          background: #BAE6FD;
        }

        .details-order-price {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #0F172A;
          white-space: nowrap;
        }

        /* Select Driver Section */
        .select-driver-section {
          display: flex;
          flex-direction: column;
        }

        .driver-section-heading {
          font-size: 0.875rem;
          font-weight: 700;
          color: #0F172A;
          margin: 0 0 10px 0;
        }

        .driver-search-field-wrap {
          position: relative;
          display: flex;
          align-items: center;
          margin-bottom: 12px;
        }

        .driver-search-magnifier {
          position: absolute;
          left: 12px;
          color: #94A3B8;
          pointer-events: none;
        }

        .driver-search-input {
          height: 38px;
          width: 100%;
          border: 1px solid #CBD5E1;
          border-radius: 10px;
          padding: 0 12px 0 36px;
          font-size: 0.8125rem;
          color: #0F172A;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.15s;
        }

        .driver-search-input:focus {
          border-color: #0D7A75;
          box-shadow: 0 0 0 2px rgba(13, 122, 117, 0.1);
        }

        .driver-search-input::placeholder {
          color: #94A3B8;
        }

        .driver-validation-error-msg {
          font-size: 0.75rem;
          color: #EF4444;
          margin-bottom: 8px;
          font-weight: 600;
        }

        .drivers-cards-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 250px;
          overflow-y: auto;
          overscroll-behavior: contain;
          padding-right: 2px;
        }

        .driver-selectable-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 10px 14px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .driver-selectable-card:hover {
          border-color: #CBD5E1;
          background: #FAFCFD;
        }

        .driver-selectable-card.selected {
          border: 1.5px solid #0D7A75;
          background: #FFFFFF;
        }

        .driver-card-left-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .driver-initials-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
          font-size: 0.75rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        .driver-name-phone-block {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .driver-fullname {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #0F172A;
        }

        .driver-contact {
          font-size: 0.75rem;
          color: #64748B;
        }

        .driver-card-right-status {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .driver-availability-stack {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
        }

        .driver-status-dot-pill {
          font-size: 0.75rem;
          font-weight: 600;
        }

        .driver-status-dot-pill.available {
          color: #16A34A;
        }

        .driver-status-dot-pill.on-delivery {
          color: #D97706;
        }

        .driver-orders-count-text {
          font-size: 0.6875rem;
          color: #64748B;
        }

        .driver-radio-indicator {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 1.5px solid #CBD5E1;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
          flex-shrink: 0;
        }

        .driver-radio-indicator.checked {
          border-color: #0D7A75;
          border-width: 2px;
        }

        .driver-radio-inner-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #0D7A75;
        }

        /* Note Section */
        .note-optional-section {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .note-section-label {
          font-size: 0.875rem;
          font-weight: 700;
          color: #0F172A;
        }

        .note-textarea-field {
          height: 68px;
          width: 100%;
          border: 1px solid #CBD5E1;
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 0.8125rem;
          color: #0F172A;
          outline: none;
          resize: none;
          box-sizing: border-box;
          font-family: inherit;
          transition: border-color 0.15s;
        }

        .note-textarea-field:focus {
          border-color: #0D7A75;
          box-shadow: 0 0 0 2px rgba(13, 122, 117, 0.1);
        }

        .note-textarea-field::placeholder {
          color: #94A3B8;
        }

        /* Actions Footer */
        .assign-modal-actions-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 4px;
        }

        .btn-modal-cancel {
          flex: 1;
          height: 44px;
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 600;
          color: #1E293B;
          cursor: pointer;
          transition: all 0.15s;
        }

        .btn-modal-cancel:hover {
          background: #F8FAFC;
          border-color: #94A3B8;
        }

        .btn-modal-submit {
          flex: 1;
          height: 44px;
          background: #0D7A75;
          border: none;
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 600;
          color: #FFFFFF;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(13, 122, 117, 0.2);
          transition: all 0.15s;
        }

        .btn-modal-submit:hover {
          background: #09635F;
          box-shadow: 0 4px 10px rgba(13, 122, 117, 0.3);
        }
      `}</style>
    </div>,
    document.body
  );
};
export default AssignOrderModal;
