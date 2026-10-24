import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { addressApi } from '../api/apiClient';
import { 
  User, 
  MapPin, 
  ShieldCheck, 
  LogOut, 
  Plus, 
  Trash2, 
  Edit3,
  Home, 
  Briefcase, 
  RefreshCw 
} from 'lucide-react';

export const Profile = () => {
  const { currentUser, userProfile, logout, userRole, refreshProfile, updateCurrentUserProfile } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [newAddress, setNewAddress] = useState({
    title: 'Home',
    address_line: '',
    landmark: '',
    city: 'Bengaluru',
    pincode: '560043',
    is_default: false
  });
  const [saving, setSaving] = useState(false);
  const modalRef = useRef(null);

  // Edit Profile Modal State
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    city: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const editProfileModalRef = useRef(null);

  const fetchAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const data = await addressApi.getAddresses();
      const list = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
      setAddresses(list);
    } catch (err) {
      console.warn('Failed to load addresses:', err);
      setAddresses([]);
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
    if (typeof refreshProfile === 'function') {
      refreshProfile();
    }
  }, []);

  const handleOpenAddModal = () => {
    setEditingAddressId(null);
    setNewAddress({
      title: 'Home',
      address_line: '',
      landmark: '',
      city: 'Bengaluru',
      pincode: '560043',
      is_default: false
    });
    setShowAddModal(true);
  };

  const handleOpenEditModal = (addr) => {
    setEditingAddressId(addr.id);
    setNewAddress({
      title: addr.title || 'Home',
      address_line: addr.address_line || addr.address_line1 || '',
      landmark: addr.landmark || addr.address_line2 || '',
      city: addr.city || 'Bengaluru',
      pincode: addr.pincode || '560043',
      is_default: Boolean(addr.is_default)
    });
    setShowAddModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!newAddress.address_line) return;
    setSaving(true);
    try {
      if (editingAddressId) {
        await addressApi.updateAddress(editingAddressId, newAddress);
      } else {
        await addressApi.createAddress(newAddress);
      }
      setShowAddModal(false);
      setEditingAddressId(null);
      setNewAddress({
        title: 'Home',
        address_line: '',
        landmark: '',
        city: 'Bengaluru',
        pincode: '560043',
        is_default: false
      });
      await fetchAddresses();
      if (typeof refreshProfile === 'function') {
        await refreshProfile();
      }
    } catch (err) {
      alert(err.response?.data?.error || `Failed to ${editingAddressId ? 'update' : 'save'} address`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this saved address?')) return;
    try {
      await addressApi.deleteAddress(id);
      await fetchAddresses();
      if (typeof refreshProfile === 'function') {
        await refreshProfile();
      }
    } catch (err) {
      alert('Failed to delete address');
    }
  };

  const profileUser = currentUser || userProfile;
  const fullName = profileUser?.full_name || profileUser?.name || profileUser?.displayName || profileUser?.fullName || userProfile?.full_name || userProfile?.displayName || userProfile?.name || '';
  const firstName = profileUser?.first_name || (fullName ? fullName.split(' ')[0] : '');
  const email = profileUser?.email || userProfile?.email || '';
  const phone = profileUser?.phone || profileUser?.phoneNumber || userProfile?.phone || '';
  const username = profileUser?.username || (email ? email.split('@')[0] : (fullName ? fullName.toLowerCase().replace(/\s+/g, '') : 'customer'));
  const avatarInitial = 
    (fullName ? fullName[0].toUpperCase() : 
      (firstName ? firstName[0].toUpperCase() : 
        (username ? username[0].toUpperCase() : 'C')));

  const handleOpenEditProfileModal = () => {
    setProfileForm({
      name: fullName || '',
      phone: phone || '',
      city: profileUser?.city || (addresses.find(a => a.is_default) || addresses[0])?.city || 'Bengaluru'
    });
    setShowEditProfileModal(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      if (typeof updateCurrentUserProfile === 'function') {
        await updateCurrentUserProfile(profileForm);
      }
      if (typeof refreshProfile === 'function') {
        await refreshProfile();
      }
      setShowEditProfileModal(false);
    } catch (err) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="portal-container">
      {/* Header */}
      <div className="mb-6">
        <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Account & Security</div>
        <h1 className="text-2xl font-bold text-navy">Customer Profile</h1>
        <p className="text-sm text-muted">Manage your personal credentials and contact settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Summary */}
        <div className="content-card text-center self-start">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 text-white font-black text-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/20">
            {avatarInitial}
          </div>
          <h2 className="text-xl font-bold text-navy">{fullName || firstName || 'Customer'}</h2>
          <p className="text-sm text-muted mb-3">@{username}</p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-primary text-xs font-bold rounded-full mb-6 border border-teal-100">
            <ShieldCheck size={14} />
            <span>Role: {userRole || 'customer'}</span>
          </div>

          <div className="border-t pt-4">
            <button
              onClick={logout}
              className="btn btn-outline-danger w-full flex items-center justify-center gap-2"
            >
              <LogOut size={16} />
              <span>Log Out Account</span>
            </button>
          </div>
        </div>

        {/* Right 2 Columns: Profile Details with Saved Addresses directly below */}
        <div className="lg:col-span-2 content-card">
          {/* Section: Profile Details */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-navy text-base flex items-center gap-2">
                <User size={18} className="text-primary" />
                <span>Profile Details</span>
              </h3>
              <button
                type="button"
                onClick={handleOpenEditProfileModal}
                className="btn btn-outline-secondary btn-sm flex items-center gap-1.5 text-xs py-1 px-3"
              >
                <Edit3 size={14} />
                <span>Edit Profile</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-muted block mb-1">Full Name</span>
                <div className="font-semibold text-navy">{fullName || 'Not provided'}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-muted block mb-1">Email Address</span>
                <div className="font-semibold text-navy">{email || 'Not provided'}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-muted block mb-1">Phone Number</span>
                <div className="font-semibold text-navy">{phone || 'Not provided'}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-muted block mb-1">City</span>
                <div className="font-semibold text-navy">{profileUser?.city || (addresses.find(a => a.is_default) || addresses[0])?.city || 'Bengaluru'}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 md:col-span-2">
                <span className="text-xs text-muted block mb-1">Registered Address</span>
                <div className="font-semibold text-navy">
                  {profileUser?.address || (() => {
                    const def = addresses.find(a => a.is_default) || addresses[0];
                    return def ? `${def.address_line}${def.landmark ? ', ' + def.landmark : ''}, ${def.city} - ${def.pincode}` : 'No address saved yet';
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Section: Saved Addresses directly below Profile Details */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h4 className="font-bold text-navy text-base flex items-center gap-2">
                  <MapPin size={18} className="text-primary" />
                  <span>Saved Addresses</span>
                  {addresses.length > 0 && (
                    <span className="text-xs font-semibold text-primary bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                      {addresses.length}
                    </span>
                  )}
                </h4>
                <p className="text-xs text-muted mt-0.5">
                  Manage your delivery and pickup locations for 1-click booking
                </p>
              </div>

              <button 
                onClick={handleOpenAddModal} 
                className="btn btn-primary btn-sm flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus size={16} />
                <span>Add New Address</span>
              </button>
            </div>

            {loadingAddresses ? (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-200">
                <RefreshCw size={28} className="animate-spin text-primary mx-auto mb-2" />
                <p className="text-xs font-medium text-navy">Loading addresses...</p>
              </div>
            ) : addresses.length === 0 ? (
              <div className="text-center py-10 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <MapPin size={40} className="text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-navy">No Addresses Saved</h4>
                <p className="text-xs text-muted max-w-sm mx-auto mt-1 mb-4">
                  Add your home or office address to make scheduling pickups even faster.
                </p>
                <button onClick={handleOpenAddModal} className="btn btn-primary btn-sm">
                  Add Address Now
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div key={addr.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 relative group transition-all hover:border-teal-300">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-teal-50 text-primary rounded-lg border border-teal-100">
                          {addr.title?.toLowerCase().includes('office') ? <Briefcase size={16} /> : <Home size={16} />}
                        </div>
                        <div>
                          <h5 className="font-bold text-navy text-sm">{addr.title || 'Address'}</h5>
                          {addr.is_default && (
                            <span className="badge badge-success text-xs py-0 px-1.5">Default</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handleOpenEditModal(addr)}
                          className="text-slate-400 hover:text-primary transition-colors p-1 rounded hover:bg-slate-200/50"
                          title="Edit Address"
                          aria-label="Edit Address"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button 
                          onClick={() => handleDelete(addr.id)}
                          className="text-slate-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50"
                          title="Delete Address"
                          aria-label="Delete Address"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 mb-1 leading-relaxed">
                      {addr.address_line}
                    </p>
                    {addr.landmark && (
                      <p className="text-xs text-muted mb-1">
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
          </div>
        </div>
      </div>

      {/* Add Address Modal */}
      {showAddModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div 
            ref={modalRef}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-navy mb-4">
              {editingAddressId ? 'Edit Pickup Address' : 'Add Pickup Address'}
            </h3>
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

              <div>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input 
                    type="checkbox"
                    checked={newAddress.is_default}
                    onChange={(e) => setNewAddress({ ...newAddress, is_default: e.target.checked })}
                    className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                  />
                  <span>Set as default pickup address</span>
                </label>
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
                  <span>{editingAddressId ? 'Update Address' : 'Save Address'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfileModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowEditProfileModal(false)}
        >
          <div 
            ref={editProfileModalRef}
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-navy mb-4">
              Edit Profile Details
            </h3>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="form-label">Full Name *</label>
                <input 
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  placeholder="Enter your full name"
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Phone Number</label>
                <input 
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="Enter phone number"
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">City</label>
                <input 
                  type="text"
                  value={profileForm.city}
                  onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                  placeholder="Enter city"
                  className="form-input"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="btn btn-outline-secondary btn-sm"
                  disabled={savingProfile}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm flex items-center gap-2"
                  disabled={savingProfile}
                >
                  {savingProfile ? <RefreshCw size={14} className="animate-spin" /> : null}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
