import React, { useState, useEffect } from 'react';
import { addressApi } from '../api/apiClient';
import { 
  MapPin, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  RefreshCw,
  Home,
  Briefcase
} from 'lucide-react';

export const SavedAddresses = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAddress, setNewAddress] = useState({
    title: 'Home',
    address_line: '',
    landmark: '',
    city: 'Bengaluru',
    pincode: '560043',
    is_default: false
  });
  const [saving, setSaving] = useState(false);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const res = await addressApi.getAddresses();
      const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setAddresses(list);
    } catch (err) {
      console.error('Failed to load addresses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!newAddress.address_line) return;
    setSaving(true);
    try {
      await addressApi.createAddress(newAddress);
      setShowAddModal(false);
      setNewAddress({
        title: 'Home',
        address_line: '',
        landmark: '',
        city: 'Bengaluru',
        pincode: '560043',
        is_default: false
      });
      fetchAddresses();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this saved address?')) return;
    try {
      await addressApi.deleteAddress(id);
      fetchAddresses();
    } catch (err) {
      alert('Failed to delete address');
    }
  };

  return (
    <div className="portal-container">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Account Settings</div>
          <h1 className="text-2xl font-bold text-navy">Saved Addresses</h1>
          <p className="text-sm text-muted">Manage your delivery and pickup locations for 1-click booking</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)} 
          className="btn btn-primary btn-sm flex items-center gap-1.5 self-start md:self-auto"
        >
          <Plus size={16} />
          <span>Add New Address</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <RefreshCw size={36} className="animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm font-medium text-navy">Loading addresses...</p>
        </div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
          <MapPin size={48} className="text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-navy">No Addresses Saved</h3>
          <p className="text-sm text-muted max-w-sm mx-auto mt-1 mb-4">
            Add your home or office address to make scheduling pickups even faster.
          </p>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary btn-sm">
            Add Address Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {addresses.map((addr) => (
            <div key={addr.id} className="content-card relative group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 text-primary rounded-lg">
                    {addr.title?.toLowerCase().includes('office') ? <Briefcase size={18} /> : <Home size={18} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-navy text-sm">{addr.title || 'Address'}</h4>
                    {addr.is_default && (
                      <span className="badge badge-success text-xs">Default</span>
                    )}
                  </div>
                </div>

                <button 
                  onClick={() => handleDelete(addr.id)}
                  className="text-slate-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <p className="text-sm text-slate-700 mb-2">
                {addr.address_line}
              </p>
              {addr.landmark && (
                <p className="text-xs text-muted mb-2">
                  Landmark: {addr.landmark}
                </p>
              )}
              <div className="text-xs font-medium text-slate-500">
                {addr.city}, {addr.pincode}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Address Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
            <h3 className="text-lg font-bold text-navy mb-4">Add Pickup Address</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="form-label">Address Tag</label>
                <select 
                  value={newAddress.title}
                  onChange={(e) => setNewAddress({ ...newAddress, title: e.target.value })}
                  className="form-select"
                >
                  <option value="Home">Home</option>
                  <option value="Office">Office</option>
                  <option value="Apartment">Apartment</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="form-label">Full Address / Flat / Building *</label>
                <textarea 
                  required
                  value={newAddress.address_line}
                  onChange={(e) => setNewAddress({ ...newAddress, address_line: e.target.value })}
                  placeholder="E.g., Flat 402, Sunshine Apartments, 1st Cross..."
                  className="form-textarea"
                  rows={2}
                />
              </div>

              <div>
                <label className="form-label">Landmark</label>
                <input 
                  type="text"
                  value={newAddress.landmark}
                  onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
                  placeholder="Near Metro Station"
                  className="form-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">City</label>
                  <input 
                    type="text"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Pincode</label>
                  <input 
                    type="text"
                    value={newAddress.pincode}
                    onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-outline-secondary btn-sm"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm flex items-center gap-2"
                  disabled={saving}
                >
                  {saving ? <RefreshCw size={14} className="animate-spin" /> : null}
                  <span>Save Address</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedAddresses;
