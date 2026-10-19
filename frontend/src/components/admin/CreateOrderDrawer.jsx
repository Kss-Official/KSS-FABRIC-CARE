import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAdmin } from '../../context/AdminContext';
import { formatDisplayDate } from '../../utils/dateFilterUtils';
import { 
  X, 
  Search, 
  Plus, 
  Minus, 
  Calendar, 
  Clock, 
  MapPin, 
  Shirt, 
  Layers, 
  Sparkles, 
  Flame, 
  Footprints, 
  BedDouble, 
  Check, 
  ArrowRight,
  UserPlus,
  Menu,
  SunMedium
} from 'lucide-react';

export const CreateOrderDrawer = () => {
  const { 
    isCreateOrderDrawerOpen, 
    setIsCreateOrderDrawerOpen, 
    setIsAddCustomerModalOpen, 
    createOrder 
  } = useAdmin();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState({
    name: 'Rohan Mehta',
    phone: '+91 98765 43210',
    address: 'House #12, 3rd Cross, Banaswadi Bengaluru – 560043'
  });

  const [serviceItems, setServiceItems] = useState([
    { id: 'wf', name: 'Wash & Fold', rate: 160, count: 2, selected: true, icon: 'Shirt' },
    { id: 'wi', name: 'Wash & Iron', rate: 180, count: 0, selected: false, icon: 'Layers' },
    { id: 'dc', name: 'Dry Cleaning', rate: 240, count: 1, selected: true, icon: 'Sparkles' },
    { id: 'si', name: 'Steam Iron', rate: 150, count: 0, selected: false, icon: 'Flame' },
    { id: 'sl', name: 'Shoe Laundry', rate: 200, count: 0, selected: false, icon: 'Footprints' },
    { id: 'hc', name: 'Home Care', rate: 300, count: 0, selected: false, icon: 'BedDouble' },
  ]);

  const todayDateStr = useMemo(() => formatDisplayDate(new Date()), []);
  const tomorrowDateStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return formatDisplayDate(d);
  }, []);
  const dayAfterDateStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return formatDisplayDate(d);
  }, []);

  const [pickupDate, setPickupDate] = useState(todayDateStr);
  const [pickupTime, setPickupTime] = useState('09:00 AM – 11:00 AM');

  if (!isCreateOrderDrawerOpen) return null;

  const toggleService = (id) => {
    setServiceItems(prev => prev.map(s => {
      if (s.id === id) {
        const nextSel = !s.selected;
        return { ...s, selected: nextSel, count: nextSel ? (s.count === 0 ? 1 : s.count) : 0 };
      }
      return s;
    }));
  };

  const updateCount = (id, delta) => {
    setServiceItems(prev => prev.map(s => {
      if (s.id === id) {
        const nextCount = Math.max(0, s.count + delta);
        return { ...s, count: nextCount, selected: nextCount > 0 };
      }
      return s;
    }));
  };

  const selectedServicesList = serviceItems.filter(s => s.selected && s.count > 0);
  const totalAmount = serviceItems.reduce((sum, s) => s.selected ? sum + (s.count * s.rate) : sum, 0);

  const handleCreate = () => {
    createOrder({
      customerName: selectedCustomer.name,
      customerPhone: selectedCustomer.phone,
      address: selectedCustomer.address,
      selectedServices: selectedServicesList.map(s => s.name),
      date: pickupDate,
      time: pickupTime,
      amount: totalAmount || 560
    });
  };

  const getIcon = (icon) => {
    switch (icon) {
      case 'Shirt': return <Shirt size={22} />;
      case 'Layers': return <Layers size={22} />;
      case 'Sparkles': return <Sparkles size={22} />;
      case 'Flame': return <Flame size={22} />;
      case 'Footprints': return <Footprints size={22} />;
      case 'BedDouble': return <BedDouble size={22} />;
      default: return <Shirt size={22} />;
    }
  };

  const getSelectedServiceIcon = (name) => {
    switch (name) {
      case 'Wash & Fold':
        return <Menu size={18} strokeWidth={2} />;
      case 'Dry Cleaning':
        return <SunMedium size={18} strokeWidth={2} />;
      case 'Wash & Iron':
        return <Layers size={18} strokeWidth={2} />;
      case 'Steam Iron':
        return <Flame size={18} strokeWidth={2} />;
      case 'Shoe Laundry':
        return <Footprints size={18} strokeWidth={2} />;
      case 'Home Care':
        return <BedDouble size={18} strokeWidth={2} />;
      default:
        return <Shirt size={18} strokeWidth={2} />;
    }
  };

  return createPortal(
    <div className="drawer-backdrop animate-fade-in" onClick={() => setIsCreateOrderDrawerOpen(false)}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-title-wrap">
            <div className="drawer-icon-circle">
              <Plus size={20} />
            </div>
            <div>
              <h2 className="drawer-title">Create New Order</h2>
              <p className="drawer-subtitle">Create a pickup order for a customer.</p>
            </div>
          </div>
          <button 
            className="drawer-close-btn"
            onClick={() => setIsCreateOrderDrawerOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Scrollable Body */}
        <div className="drawer-body">
          {/* STEP 1: CUSTOMER */}
          <div className="drawer-section">
            <div className="section-step-num">1</div>
            <div className="section-content-col">
              <h3 className="section-title">Customer</h3>
              <p className="section-desc">Search existing customer or add a new one.</p>

              <div className="search-customer-input-wrap">
                <Search size={16} className="search-icon" />
                <input 
                  type="text"
                  placeholder="Search by name or phone number..."
                  className="drawer-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Selected Customer Card */}
              <div className="selected-customer-pill-card">
                <div className="pill-card-left">
                  <div className="cust-avatar">RM</div>
                  <div>
                    <div className="cust-name">{selectedCustomer.name}</div>
                    <div className="cust-phone">{selectedCustomer.phone}</div>
                    <div className="cust-loc">{selectedCustomer.address.split(',')[0]}</div>
                  </div>
                </div>
                <button className="remove-cust-btn">
                  <X size={16} />
                </button>
              </div>

              <button 
                type="button" 
                className="add-new-customer-link"
                onClick={() => setIsAddCustomerModalOpen(true)}
              >
                <Plus size={16} />
                <span>Add New Customer</span>
              </button>
            </div>
          </div>

          <div className="drawer-divider" />

          {/* STEP 2: SELECT SERVICES */}
          <div className="drawer-section">
            <div className="section-step-num">2</div>
            <div className="section-content-col">
              <h3 className="section-title">Select Services</h3>
              <p className="section-desc">Choose one or more services for this order.</p>

              <div className="services-selector-grid">
                {serviceItems.map(item => (
                  <div 
                    key={item.id}
                    className={`service-select-box ${item.selected ? 'selected' : ''}`}
                    onClick={() => toggleService(item.id)}
                  >
                    <div className="service-box-top">
                      <div className="service-box-icon">{getIcon(item.icon)}</div>
                      <div className={`service-check ${item.selected ? 'checked' : ''}`}>
                        {item.selected && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                    <div className="service-box-name">{item.name}</div>
                    <div className="service-box-rate">₹{item.rate}</div>
                  </div>
                ))}
              </div>

              {/* Selected Services Counter List */}
              {selectedServicesList.length > 0 && (
                <div className="selected-services-sublist-wrap">
                  <h4 className="selected-services-heading">Selected Services</h4>
                  <div className="selected-services-cards">
                    {selectedServicesList.map(s => (
                      <div key={s.id} className="selected-service-row-card">
                        <div className="service-row-left">
                          <span className="service-row-icon">{getSelectedServiceIcon(s.name)}</span>
                          <span className="service-row-name">{s.name}</span>
                        </div>
                        <div className="service-row-actions">
                          <div className="service-qty-pill">
                            <button 
                              type="button" 
                              className="qty-pill-btn" 
                              onClick={() => updateCount(s.id, -1)}
                              aria-label="Decrease quantity"
                            >
                              −
                            </button>
                            <span className="qty-pill-val">{s.count}</span>
                            <button 
                              type="button" 
                              className="qty-pill-btn" 
                              onClick={() => updateCount(s.id, 1)}
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                          <span className="service-row-price">₹{s.count * s.rate}</span>
                          <button 
                            type="button" 
                            className="service-row-remove" 
                            onClick={() => toggleService(s.id)}
                            aria-label={`Remove ${s.name}`}
                          >
                            <X size={17} strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="drawer-divider" />

          {/* STEP 3: PICKUP DETAILS */}
          <div className="drawer-section">
            <div className="section-step-num">3</div>
            <div className="section-content-col">
              <h3 className="section-title">Pickup Details</h3>
              <p className="section-desc">Select pickup date, time and address.</p>

              <div className="pickup-time-grid">
                <div className="form-group">
                  <label className="form-label">Pickup Date</label>
                  <select 
                    className="drawer-select"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                  >
                    <option value={todayDateStr}>{todayDateStr} (Today)</option>
                    <option value={tomorrowDateStr}>{tomorrowDateStr} (Tomorrow)</option>
                    <option value={dayAfterDateStr}>{dayAfterDateStr}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Pickup Time</label>
                  <select 
                    className="drawer-select"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                  >
                    <option value="09:00 AM – 11:00 AM">09:00 AM – 11:00 AM</option>
                    <option value="11:00 AM – 01:00 PM">11:00 AM – 01:00 PM</option>
                    <option value="02:00 PM – 04:00 PM">02:00 PM – 04:00 PM</option>
                    <option value="04:00 PM – 06:00 PM">04:00 PM – 06:00 PM</option>
                  </select>
                </div>
              </div>

              {/* Pickup Address Box */}
              <div className="form-group mt-3">
                <label className="form-label">Pickup Address</label>
                <div className="address-display-box">
                  <MapPin size={18} className="text-teal" />
                  <div className="address-text-wrap">
                    <span>{selectedCustomer.address}</span>
                  </div>
                  <button className="address-change-btn">Change</button>
                </div>
              </div>

              {/* Estimated Total Card */}
              <div className="estimated-total-card">
                <div className="total-card-left">
                  <div className="rupee-icon-wrap">₹</div>
                  <div className="total-card-meta">
                    <span className="total-card-label">Estimated Total</span>
                    <span className="total-card-sub">Inclusive of all charges</span>
                  </div>
                </div>
                <div className="total-card-amount">₹{totalAmount || 560}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="drawer-footer">
          <button 
            className="btn btn-outline-teal drawer-cancel-btn"
            onClick={() => setIsCreateOrderDrawerOpen(false)}
          >
            Cancel
          </button>
          <button 
            className="btn btn-coral drawer-create-btn"
            onClick={handleCreate}
          >
            <span>Create Order</span>
            <ArrowRight size={17} />
          </button>
        </div>
      </div>

      <style>{`
        .drawer-backdrop {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100%;
          background: rgba(15, 23, 42, 0.5);
          backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex;
          justify-content: flex-end;
          overflow: hidden;
          overscroll-behavior: contain;
        }

        .drawer-panel {
          width: 540px;
          max-width: 100%;
          height: 100vh;
          height: 100dvh;
          background: #FFFFFF;
          display: flex;
          flex-direction: column;
          box-shadow: -10px 0 40px rgba(0,0,0,0.15);
          animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          overscroll-behavior: contain;
        }

        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: none; }
        }

        .drawer-header {
          padding: 24px 28px;
          border-bottom: 1px solid #E2E8F0;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .drawer-title-wrap {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .drawer-icon-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #EBF8F7;
          color: #0D7A75;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .drawer-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: #1E293B;
        }

        .drawer-subtitle {
          font-size: 0.8125rem;
          color: #64748B;
        }

        .drawer-close-btn {
          background: none;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          padding: 6px;
        }

        .drawer-close-btn:hover {
          color: #1E293B;
        }

        .drawer-body {
          flex: 1;
          overflow-y: auto;
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .drawer-section {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .section-step-num {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #0D7A75;
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8125rem;
          font-weight: 700;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .section-content-col {
          flex: 1;
        }

        .section-title {
          font-size: 1.0625rem;
          font-weight: 700;
          color: #1E293B;
        }

        .section-desc {
          font-size: 0.8125rem;
          color: #64748B;
          margin-bottom: 14px;
        }

        .search-customer-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
          margin-bottom: 12px;
        }

        .drawer-input {
          width: 100%;
          padding: 10px 14px 10px 38px;
          border: 1.5px solid #E2E8F0;
          border-radius: 10px;
          font-size: 0.875rem;
          outline: none;
        }

        .drawer-input:focus {
          border-color: #0D7A75;
        }

        .selected-customer-pill-card {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .pill-card-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .cust-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #EBF8F7;
          color: #0D7A75;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.875rem;
        }

        .cust-name {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #1E293B;
        }

        .cust-phone {
          font-size: 0.75rem;
          color: #64748B;
        }

        .cust-loc {
          font-size: 0.75rem;
          color: #94A3B8;
        }

        .remove-cust-btn {
          background: none;
          border: none;
          color: #94A3B8;
          cursor: pointer;
        }

        .add-new-customer-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          color: #0D7A75;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
        }

        .services-selector-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 18px;
        }

        .service-select-box {
          border: 1.5px solid #E2E8F0;
          border-radius: 14px;
          padding: 14px 10px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .service-select-box:hover {
          border-color: #BCEAE6;
        }

        .service-select-box.selected {
          border-color: #0D7A75;
          background: #F4FBFA;
        }

        .service-box-top {
          display: flex;
          justify-content: space-between;
          width: 100%;
          margin-bottom: 8px;
        }

        .service-box-icon {
          color: #0D7A75;
        }

        .service-check {
          width: 18px;
          height: 18px;
          border-radius: 4px;
          border: 1px solid #CBD5E0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .service-check.checked {
          background: #0D7A75;
          border-color: #0D7A75;
          color: #FFFFFF;
        }

        .service-box-name {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #1E293B;
          margin-bottom: 2px;
        }

        .service-box-rate {
          font-size: 0.75rem;
          color: #64748B;
          font-weight: 600;
        }

        .selected-services-sublist-wrap {
          margin-top: 18px;
        }

        .selected-services-heading {
          font-size: 1rem;
          font-weight: 800;
          color: #1E293B;
          margin-bottom: 12px;
        }

        .selected-services-cards {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .selected-service-row-card {
          background: #F8FAFC;
          border: 1.5px solid #F1F5F9;
          border-radius: 18px;
          padding: 12px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: background 0.15s ease;
        }

        .service-row-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .service-row-icon {
          color: #94A3B8;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .service-row-name {
          font-size: 0.9375rem;
          font-weight: 600;
          color: #1E293B;
        }

        .service-row-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .service-qty-pill {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #FFFFFF;
          border: 1.5px solid #E2E8F0;
          border-radius: 9999px;
          padding: 3px 12px;
          min-width: 86px;
          height: 32px;
          box-sizing: border-box;
        }

        .qty-pill-btn {
          border: none;
          background: none;
          color: #64748B;
          font-size: 1rem;
          font-weight: 400;
          line-height: 1;
          cursor: pointer;
          padding: 0 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.15s;
        }

        .qty-pill-btn:hover {
          color: #0F172A;
        }

        .qty-pill-val {
          font-size: 0.9375rem;
          font-weight: 700;
          color: #0F172A;
          min-width: 14px;
          text-align: center;
          padding: 0 4px;
        }

        .service-row-price {
          font-size: 1rem;
          font-weight: 800;
          color: #0F172A;
          min-width: 48px;
          text-align: right;
        }

        .service-row-remove {
          background: none;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.15s;
        }

        .service-row-remove:hover {
          color: #475569;
        }

        .pickup-time-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .drawer-select {
          width: 100%;
          padding: 10px 12px;
          border: 1.5px solid #E2E8F0;
          border-radius: 10px;
          font-size: 0.875rem;
          outline: none;
          background: #FFFFFF;
        }

        .address-display-box {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 12px 14px;
        }

        .address-text-wrap {
          flex: 1;
          font-size: 0.8125rem;
          color: #334155;
          font-weight: 500;
        }

        .address-change-btn {
          background: none;
          border: none;
          color: #0D7A75;
          font-size: 0.8125rem;
          font-weight: 700;
          cursor: pointer;
        }

        .estimated-total-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #FFF9F2;
          border: 1.5px solid #FDE4D0;
          border-radius: 26px;
          padding: 18px 24px;
          margin-top: 22px;
        }

        .total-card-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .rupee-icon-wrap {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #085E5A;
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1.35rem;
          flex-shrink: 0;
        }

        .total-card-meta {
          display: flex;
          flex-direction: column;
        }

        .total-card-label {
          font-size: 1.0625rem;
          font-weight: 800;
          color: #0F172A;
          display: block;
          line-height: 1.25;
        }

        .total-card-sub {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #8A9BA8;
          display: block;
          margin-top: 3px;
        }

        .total-card-amount {
          font-size: 1.75rem;
          font-weight: 900;
          color: #0F172A;
          letter-spacing: -0.5px;
        }

        .drawer-divider {
          height: 1px;
          background: #F1F5F9;
        }

        .drawer-footer {
          padding: 20px 28px;
          border-top: 1px solid #E2E8F0;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 14px;
          background: #FFFFFF;
        }

        .drawer-cancel-btn {
          padding: 10px 20px;
        }

        .drawer-create-btn {
          padding: 10px 24px;
        }
      `}</style>
    </div>,
    document.body
  );
};
