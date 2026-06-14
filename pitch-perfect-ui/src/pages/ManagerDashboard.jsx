import { useState, useContext, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Image as ImageIcon, X, Plus, MapPin, DollarSign, List, Search, Calendar, Trash2, Edit2, ToggleLeft, ToggleRight, User, Bell, CheckCircle, XCircle, AlertTriangle, MessageSquare } from 'lucide-react';
import ConfirmModal, { Toast } from '../components/ConfirmModal';

// --- Location Autocomplete Hook using OpenStreetMap Nominatim (free, no API key) ---
const useLocationSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  const search = useCallback((q) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q || q.length < 3) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        setResults(data.map(r => ({
          display: r.display_name,
          short: [r.address?.city || r.address?.town || r.address?.village, r.address?.country].filter(Boolean).join(', ') || r.display_name,
        })));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  }, []);

  return { query, setQuery, results, setResults, loading, search };
};

// --- Location Input with Autocomplete ---
const LocationInput = ({ value, onChange }) => {
  const { query, setQuery, results, setResults, loading, search } = useLocationSearch();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Sync external value into query on first render
  useEffect(() => { if (value && !query) setQuery(value); }, []);

  const handleSelect = (loc) => {
    onChange(loc.short);
    setQuery(loc.short);
    setResults([]);
    setOpen(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (!containerRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <MapPin size={16} style={{ position: 'absolute', top: '13px', left: '12px', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
        {loading && (
          <div style={{ position: 'absolute', top: '13px', right: '12px', width: '14px', height: '14px', border: '2px solid var(--glass-border)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
        )}
        <input
          type="text"
          className="input-field"
          placeholder="Type to search locations..."
          style={{ paddingLeft: '2.5rem', paddingRight: '2rem' }}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);  // allow manual typing too
            search(e.target.value);
            setOpen(true);
          }}
          onFocus={() => results.length > 0 && setOpen(true)}
          required
        />
      </div>

      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999,
          background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)',
          borderRadius: '8px', marginTop: '4px', overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          {results.map((r, i) => (
            <div
              key={i}
              onMouseDown={() => handleSelect(r)}
              style={{
                padding: '0.6rem 1rem', cursor: 'pointer',
                display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                borderBottom: i < results.length - 1 ? '1px solid var(--glass-border)' : 'none',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,255,204,0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <MapPin size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{r.short}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '350px' }}>{r.display}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Inline Price Editor (replaces prompt()) ---
const PriceEditor = ({ pitch, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(pitch.pricePerHour);

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px' }}
        title="Edit price"
      >
        <Edit2 size={12} />
      </button>
    );
  }

  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
      <input
        autoFocus
        type="number"
        step="0.01"
        min="1"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { onUpdate(pitch, parseFloat(val)); setEditing(false); }
          if (e.key === 'Escape') setEditing(false);
        }}
        style={{
          width: '70px', padding: '2px 4px', fontSize: '0.8rem',
          background: 'rgba(0,0,0,0.3)', border: '1px solid var(--accent-primary)',
          borderRadius: '6px', color: 'var(--text-primary)', outline: 'none',
        }}
      />
      <button
        onClick={() => { onUpdate(pitch, parseFloat(val)); setEditing(false); }}
        style={{ background: 'var(--accent-primary)', border: 'none', borderRadius: '4px', padding: '2px 5px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700, color: '#000' }}
      >✓</button>
      <button
        onClick={() => setEditing(false)}
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '2px' }}
      >✕</button>
    </span>
  );
};

// --- Edit Pitch Modal ---
const EditPitchModal = ({ pitch, onClose, onSave, loading }) => {
  const [name, setName] = useState(pitch.name);
  const [location, setLocation] = useState(pitch.location);
  const [pricePerHour, setPricePerHour] = useState(pitch.pricePerHour);
  const [imageUrls, setImageUrls] = useState(
    pitch.imageUrls?.length > 0 ? pitch.imageUrls.join('\n') : (pitch.imageUrl || '')
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const imgs = imageUrls.split('\n').map(s => s.trim()).filter(s => s !== '');
    onSave({
      name, location, pricePerHour: parseFloat(pricePerHour),
      imageUrls: imgs,
      imageUrl: imgs.length > 0 ? imgs[0] : null
    });
  };

  return (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel modal-content" style={{ width: '90%', maxWidth: '500px', padding: '2rem', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>✕</button>
        <h3 style={{ marginBottom: '1.5rem' }}>Edit Pitch</h3>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Pitch Name</label>
            <input type="text" className="input-field" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="input-group">
            <label className="input-label">Location</label>
            <input type="text" className="input-field" value={location} onChange={e => setLocation(e.target.value)} required />
          </div>
          <div className="input-group">
            <label className="input-label">Price Per Hour ($)</label>
            <input type="number" step="0.01" min="1" className="input-field" value={pricePerHour} onChange={e => setPricePerHour(e.target.value)} required />
          </div>
          <div className="input-group mb-3">
            <label className="input-label">Image URLs (one per line)</label>
            <textarea className="input-field" rows="4" value={imageUrls} onChange={e => setImageUrls(e.target.value)} style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="button" className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.08)' }} onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? <span className="spinner" style={{ width: '16px', height: '16px' }} /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Main ManagerDashboard ---
const ManagerDashboard = () => {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [pricePerHour, setPricePerHour] = useState('');
  const [images, setImages] = useState([{ type: 'url', value: '', preview: '' }]);
  const [message, setMessage] = useState('');
  
  // Edit State
  const [editingPitch, setEditingPitch] = useState(null);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('add');
  const [pitches, setPitches] = useState([]);
  const [loadingPitches, setLoadingPitches] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  
  // Admin-specific state for assigning managers
  const [managers, setManagers] = useState([]);
  const [selectedManagerId, setSelectedManagerId] = useState('');

  // Modal & Toast state
  const [modal, setModal] = useState(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [bookingFilter, setBookingFilter] = useState('ALL'); // ALL, CONFIRMED, PENDING, CANCELLED
  const [bookingSearch, setBookingSearch] = useState('');

  // Cancellation notice / refund response state
  const [refundModal, setRefundModal] = useState(null);
  const [refundResponse, setRefundResponse] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);

  const showToast = (msg, type = 'success') => setToast({ message: msg, type });
  const closeModal = () => setModal(null);

  useEffect(() => {
    if (user && user.role !== 'MANAGER' && user.role !== 'ADMIN') navigate('/dashboard');
    if (user?.role === 'ADMIN') fetchManagers();
    // Always pre-load pitches so the count badge works immediately
    if (user) fetchManagedPitches();
  }, [user, navigate]);

  // Reload bookings when that tab is opened
  useEffect(() => {
    if (activeTab === 'bookings' || activeTab === 'notices') fetchManagedBookings();
  }, [activeTab]);

  const fetchManagers = async () => {
    try {
      const res = await axios.get('http://localhost:8081/api/v1/admin/managers', { headers: { Authorization: `Bearer ${token}` } });
      setManagers(res.data || []);
    } catch (err) {
      console.error('Failed to load managers', err);
    }
  };

  const fetchManagedPitches = async () => {
    setLoadingPitches(true);
    try {
      const res = await axios.get('http://localhost:8081/api/v1/pitches?size=100', { headers: { Authorization: `Bearer ${token}` }});
      setPitches(res.data.content || []);
    } catch (err) {
      console.error('Failed to load pitches', err);
    } finally {
      setLoadingPitches(false);
    }
  };

  const fetchManagedBookings = async () => {
    setLoadingBookings(true);
    try {
      const res = await axios.get('http://localhost:8081/api/v1/bookings/managed?size=100', { headers: { Authorization: `Bearer ${token}` }});
      setBookings(res.data.content || []);
    } catch (err) {
      console.error('Failed to load bookings', err);
    } finally {
      setLoadingBookings(false);
    }
  };

  const handleRefundRespond = async (bookingId, approved) => {
    setRefundLoading(true);
    try {
      await axios.patch(`http://localhost:8081/api/v1/bookings/${bookingId}/refund`, {
        cancellationResponse: refundResponse,
        approved
      }, { headers: { Authorization: `Bearer ${token}` } });
      showToast(`Refund ${approved ? 'approved' : 'rejected'} successfully.`);
      setRefundModal(null);
      setRefundResponse('');
      fetchManagedBookings();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to process refund.', 'danger');
    } finally {
      setRefundLoading(false);
    }
  };

  const toggleAvailability = (pitch) => {
    setModal({
      type: pitch.isAvailable ? 'danger' : 'info',
      title: pitch.isAvailable ? `Unlist "${pitch.name}"?` : `Re-list "${pitch.name}"?`,
      message: pitch.isAvailable
        ? 'This pitch will be hidden from customers and cannot be booked until re-listed.'
        : 'This pitch will become visible to customers and available for booking.',
      confirmText: pitch.isAvailable ? 'Unlist Pitch' : 'Re-list Pitch',
      onConfirm: async () => {
        setIsActionLoading(true);
        try {
          await axios.put(`http://localhost:8081/api/v1/pitches/${pitch.id}/availability`, {}, { headers: { Authorization: `Bearer ${token}` } });
          showToast(`"${pitch.name}" ${pitch.isAvailable ? 'unlisted' : 're-listed'} successfully.`, 'success');
          fetchManagedPitches();
        } catch { showToast('Failed to update availability.', 'danger'); }
        finally { setIsActionLoading(false); closeModal(); }
      },
    });
  };

  const saveEditPitch = async (updatedData) => {
    setIsEditLoading(true);
    try {
      await axios.put(`http://localhost:8081/api/v1/pitches/${editingPitch.id}`, updatedData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast('Pitch updated successfully.', 'success');
      setEditingPitch(null);
      fetchManagedPitches();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update pitch.', 'danger');
    } finally {
      setIsEditLoading(false);
    }
  };

  const deletePitch = (pitch) => {
    setModal({
      type: 'danger',
      title: `Delete "${pitch.name}"?`,
      message: 'This action is permanent and cannot be undone. All associated bookings will be removed.',
      confirmText: 'Delete Permanently',
      onConfirm: async () => {
        setIsActionLoading(true);
        try {
          await axios.delete(`http://localhost:8081/api/v1/pitches/${pitch.id}`, { headers: { Authorization: `Bearer ${token}` } });
          showToast(`"${pitch.name}" deleted.`, 'success');
          fetchManagedPitches();
        } catch (err) {
          showToast(err.response?.data?.message || 'Failed to delete pitch.', 'danger');
        } finally { setIsActionLoading(false); closeModal(); }
      },
    });
  };

  const updatePrice = (pitch, newPrice) => {
    if (!newPrice || isNaN(newPrice) || Number(newPrice) <= 0) return;
    setModal({
      type: 'info',
      title: `Update Price for "${pitch.name}"`,
      message: `Set the new hourly price to $${Number(newPrice).toFixed(2)}?`,
      confirmText: 'Update Price',
      onConfirm: async () => {
        setIsActionLoading(true);
        try {
          await axios.put(`http://localhost:8081/api/v1/pitches/${pitch.id}/price`, { price: newPrice }, { headers: { Authorization: `Bearer ${token}` } });
          showToast('Price updated successfully.', 'success');
          fetchManagedPitches();
        } catch { showToast('Failed to update price.', 'danger'); }
        finally { setIsActionLoading(false); closeModal(); }
      },
    });
  };

  const addImageSlot = () => setImages(prev => [...prev, { type: 'url', value: '', preview: '' }]);

  const removeImageSlot = (index) => setImages(prev => prev.filter((_, i) => i !== index));

  const handleUrlInput = (index, value) => {
    setImages(prev => prev.map((img, i) => i === index ? { ...img, value, preview: value } : img));
  };

  const handleFileInput = (index, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setImages(prev => prev.map((img, i) => i === index ? { ...img, type: 'file', value: reader.result, preview: reader.result } : img));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setSubmitting(true);

    const imageUrls = images.map(img => img.value).filter(v => v && v.trim() !== '');

    try {
      await axios.post('http://localhost:8081/api/v1/pitches', {
        name,
        location,
        pricePerHour: parseFloat(pricePerHour),
        imageUrl: imageUrls[0] || null,
        imageUrls,
        managerId: selectedManagerId ? parseInt(selectedManagerId) : null
      }, { headers: { Authorization: `Bearer ${token}` }});
      setMessage(`✓ Pitch "${name}" created successfully!`);
      setName('');
      setLocation('');
      setPricePerHour('');
      setImages([{ type: 'url', value: '', preview: '' }]);
      setSelectedManagerId('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create pitch. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || (user.role !== 'MANAGER' && user.role !== 'ADMIN')) return null;

  return (
    <div className="dashboard-layout">
      {modal && (
        <ConfirmModal
          type={modal.type}
          title={modal.title}
          message={modal.message}
          confirmText={modal.confirmText}
          onConfirm={modal.onConfirm}
          onCancel={closeModal}
          isLoading={isActionLoading}
        />
      )}
      {editingPitch && (
        <EditPitchModal
          pitch={editingPitch}
          onClose={() => setEditingPitch(null)}
          onSave={saveEditPitch}
          loading={isEditLoading}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="container">
        <div className="d-flex justify-between align-center mb-3" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ marginBottom: '0.25rem' }}>Manager Dashboard</h2>
            <p style={{ margin: 0 }}>Logged in as <strong style={{ color: 'var(--accent-primary)' }}>{user.firstName}</strong> ({user.role})</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className={`btn ${activeTab === 'add' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('add')}>
              <PlusCircle size={16} /> Add Pitch
            </button>
            <button className={`btn ${activeTab === 'list' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('list')}>
              <List size={16} /> All Pitches ({pitches.length || '...'})
            </button>
            <button className={`btn ${activeTab === 'bookings' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('bookings')}>
              <Calendar size={16} /> Bookings
            </button>
            <button className={`btn ${activeTab === 'notices' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('notices')} style={{ position: 'relative' }}>
              <Bell size={16} /> Notices
              {bookings.filter(b => b.cancellationRefundStatus === 'PENDING_APPROVAL').length > 0 && (
                <span style={{
                  position: 'absolute', top: '-4px', right: '-4px', width: '18px', height: '18px',
                  background: 'var(--danger)', borderRadius: '50%', fontSize: '0.65rem', fontWeight: 'bold',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
                }}>
                  {bookings.filter(b => b.cancellationRefundStatus === 'PENDING_APPROVAL').length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Add Pitch Tab */}
        {activeTab === 'add' && (
          <div className="glass-panel" style={{ padding: '2rem', maxWidth: '820px', margin: '0 auto' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PlusCircle size={20} /> Create New Pitch
            </h3>

            {message && <div className="toast success" style={{ position: 'relative', margin: '0 0 1.5rem 0' }}>{message}</div>}
            {error && <div className="toast error" style={{ position: 'relative', margin: '0 0 1.5rem 0' }}>{error}</div>}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="input-group">
                  <label>Pitch Name</label>
                  <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', top: '13px', left: '12px', color: 'var(--text-secondary)' }} />
                    <input
                      type="text"
                      className="input-field"
                      style={{ paddingLeft: '2.5rem' }}
                      placeholder="e.g. Green Valley Pitch"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label>Price Per Hour ($)</label>
                  <div style={{ position: 'relative' }}>
                    <DollarSign size={16} style={{ position: 'absolute', top: '13px', left: '12px', color: 'var(--text-secondary)' }} />
                    <input
                      type="number" step="0.01" min="1"
                      className="input-field"
                      style={{ paddingLeft: '2.5rem' }}
                      placeholder="e.g. 150.00"
                      value={pricePerHour}
                      onChange={(e) => setPricePerHour(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Location with Autocomplete */}
              <div className="input-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={14} /> Location
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                    — type to search or enter manually
                  </span>
                </label>
                <LocationInput value={location} onChange={setLocation} />
              </div>

              {user?.role === 'ADMIN' && (
                <div className="input-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={14} /> Assign Manager
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                      — optional
                    </span>
                  </label>
                  <select
                    className="input-field"
                    value={selectedManagerId}
                    onChange={(e) => setSelectedManagerId(e.target.value)}
                    style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', color: 'var(--text-primary)' }}
                  >
                    <option value="" style={{ color: 'black' }}>— Default (Me) —</option>
                    {managers.map(m => (
                      <option key={m.id} value={m.id} style={{ color: 'black' }}>
                        {m.firstName} {m.lastName} ({m.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Multi-Image Section */}
              <div className="input-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label style={{ margin: 0 }}>
                    <ImageIcon size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                    Images <span style={{ color: 'var(--text-secondary)', fontWeight: 'normal', fontSize: '0.8rem' }}>({images.length} slot{images.length !== 1 ? 's' : ''})</span>
                  </label>
                  <button type="button" className="btn btn-secondary" onClick={addImageSlot}
                    style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem', gap: '0.3rem' }}>
                    <Plus size={14} /> Add Image
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {images.map((img, index) => (
                    <div key={index} className="glass-panel" style={{ padding: '0.875rem 1rem', background: 'rgba(0,0,0,0.2)' }}>
                      <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'center' }}>
                        {/* Preview thumbnail */}
                        <div style={{ width: '72px', height: '54px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--glass-border)', flexShrink: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {img.preview ? (
                            <img src={img.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => { e.target.style.display = 'none'; }} />
                          ) : (
                            <ImageIcon size={20} style={{ color: 'var(--text-secondary)' }} />
                          )}
                        </div>

                        {/* URL input + file upload */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                            <input
                              type="text"
                              className="input-field"
                              placeholder={`Paste URL for image ${index + 1}...`}
                              style={{ flex: 1, margin: 0 }}
                              value={img.type === 'url' ? img.value : ''}
                              onChange={(e) => handleUrlInput(index, e.target.value)}
                              disabled={img.type === 'file'}
                            />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>or</span>
                            <label style={{ cursor: 'pointer', fontSize: '0.78rem', color: 'var(--accent-secondary)', border: '1px solid rgba(0,179,255,0.35)', padding: '3px 10px', borderRadius: '6px', whiteSpace: 'nowrap' }}>
                              📁 Upload file
                              <input type="file" accept="image/*" style={{ display: 'none' }}
                                onChange={(e) => handleFileInput(index, e.target.files[0])} />
                            </label>
                            {img.type === 'file' && (
                              <button type="button"
                                onClick={() => setImages(prev => prev.map((im, i) => i === index ? { type: 'url', value: '', preview: '' } : im))}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.75rem' }}>
                                ✕ clear
                              </button>
                            )}
                          </div>
                        </div>

                        {images.length > 1 && (
                          <button type="button" onClick={() => removeImageSlot(index)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', flexShrink: 0, padding: '4px' }}>
                            <X size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Pitch'}
              </button>
            </form>
          </div>
        )}

        {/* All Pitches Tab */}
        {activeTab === 'list' && (
          <div>
            {loadingPitches ? (
              <div className="text-center" style={{ padding: '4rem' }}>
                <div className="spinner" /><p style={{ marginTop: '1rem' }}>Loading pitches...</p>
              </div>
            ) : pitches.length === 0 ? (
              <div className="glass-panel text-center" style={{ padding: '4rem' }}>
                <p>No pitches yet. <span style={{ color: 'var(--accent-primary)', cursor: 'pointer' }} onClick={() => setActiveTab('add')}>Create the first one!</span></p>
              </div>
            ) : (
              <div className="grid-3">
                {pitches.map(pitch => {
                  const imgs = pitch.imageUrls?.length > 0 ? pitch.imageUrls : pitch.imageUrl ? [pitch.imageUrl] : [];
                  return (
                    <div key={pitch.id} className="glass-panel" style={{ overflow: 'hidden', borderRadius: '16px' }}>
                      {/* Mini photo grid */}
                      <div style={{ height: '140px', display: 'grid', gridTemplateColumns: imgs.length > 1 ? '1fr 1fr' : '1fr', gridTemplateRows: imgs.length > 2 ? '1fr 1fr' : '1fr', gap: '2px', background: 'rgba(0,0,0,0.3)' }}>
                        {imgs.length === 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ImageIcon style={{ color: 'var(--text-secondary)' }} />
                          </div>
                        ) : imgs.slice(0, 4).map((src, i) => (
                          <div key={i} style={{ position: 'relative', overflow: 'hidden' }}>
                            <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            {i === 3 && imgs.length > 4 && (
                              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
                                +{imgs.length - 4}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <div style={{ padding: '0.875rem 1rem' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '0.35rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {pitch.name}
                            <button onClick={() => setEditingPitch(pitch)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', padding: 0 }}>
                              <Edit2 size={14} />
                            </button>
                          </span>
                          <button onClick={() => deletePitch(pitch)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                            <Trash2 size={16} />
                          </button>
                        </h3>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12} />{pitch.location}
                          </span>
                          <span style={{ color: 'var(--accent-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            ${pitch.pricePerHour}/hr
                            <PriceEditor pitch={pitch} onUpdate={updatePrice} />
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>{imgs.length} image{imgs.length !== 1 ? 's' : ''}</span>
                          <button onClick={() => toggleAvailability(pitch)} style={{ 
                            background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                            color: pitch.isAvailable ? 'var(--accent-primary)' : 'var(--text-secondary)'
                          }}>
                            {pitch.isAvailable ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                            {pitch.isAvailable ? 'Listed' : 'Unlisted'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div>
            {loadingBookings ? (
              <div className="text-center" style={{ padding: '4rem' }}>
                <div className="spinner" /><p style={{ marginTop: '1rem' }}>Loading bookings...</p>
              </div>
            ) : (
              <div>
                {/* Filter Bar */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {['ALL', 'CONFIRMED', 'PENDING', 'CANCELLED'].map(f => (
                      <button
                        key={f}
                        onClick={() => setBookingFilter(f)}
                        style={{
                          padding: '0.4rem 1rem', borderRadius: '20px', border: '1px solid',
                          fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                          background: bookingFilter === f 
                            ? (f === 'CONFIRMED' ? 'rgba(0,255,204,0.15)' : f === 'CANCELLED' ? 'rgba(255,71,87,0.15)' : f === 'PENDING' ? 'rgba(255,165,0,0.15)' : 'rgba(255,255,255,0.1)')
                            : 'transparent',
                          borderColor: bookingFilter === f 
                            ? (f === 'CONFIRMED' ? 'var(--accent-primary)' : f === 'CANCELLED' ? 'var(--danger)' : f === 'PENDING' ? 'orange' : 'rgba(255,255,255,0.3)')
                            : 'rgba(255,255,255,0.15)',
                          color: bookingFilter === f 
                            ? (f === 'CONFIRMED' ? 'var(--accent-primary)' : f === 'CANCELLED' ? 'var(--danger)' : f === 'PENDING' ? 'orange' : 'var(--text-primary)')
                            : 'var(--text-secondary)',
                        }}
                      >
                        {f === 'ALL' ? `All (${bookings.length})` : `${f} (${bookings.filter(b => b.status === f).length})`}
                      </button>
                    ))}
                  </div>
                  <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', top: '12px', left: '10px', color: 'var(--text-secondary)' }} />
                    <input
                      type="text"
                      placeholder="Search by pitch, user..."
                      className="input-field"
                      style={{ paddingLeft: '2.2rem', padding: '0.5rem 0.5rem 0.5rem 2.2rem', fontSize: '0.85rem' }}
                      value={bookingSearch}
                      onChange={(e) => setBookingSearch(e.target.value)}
                    />
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    ⚠️ Shows only bookings for pitches you manage
                  </div>
                </div>

                {(() => {
                  const filtered = bookings.filter(b => {
                    const matchStatus = bookingFilter === 'ALL' || b.status === bookingFilter;
                    const matchSearch = !bookingSearch || 
                      b.pitchName?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
                      b.userFullName?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
                      b.userEmail?.toLowerCase().includes(bookingSearch.toLowerCase());
                    return matchStatus && matchSearch;
                  });

                  if (filtered.length === 0) return (
                    <div className="glass-panel text-center" style={{ padding: '4rem' }}>
                      <p style={{ color: 'var(--text-secondary)' }}>
                        {bookings.length === 0 ? 'No bookings for your pitches yet.' : `No bookings match your filter.`}
                      </p>
                    </div>
                  );

                  return (
                    <div className="glass-panel" style={{ overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--glass-border)' }}>
                            <th style={{ padding: '1rem' }}>Pitch</th>
                            <th style={{ padding: '1rem' }}>Booked By</th>
                            <th style={{ padding: '1rem' }}>Date & Duration</th>
                            <th style={{ padding: '1rem' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map(b => {
                            const start = new Date(b.startTime);
                            const end = new Date(b.endTime);
                            const durationMs = end - start;
                            const hours = Math.floor(durationMs / 3600000);
                            const minutes = Math.floor((durationMs % 3600000) / 60000);
                            const durationStr = hours > 0 ? `${hours}h ${minutes > 0 ? `${minutes}m` : ''}` : `${minutes}m`;

                            return (
                              <tr key={b.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                <td style={{ padding: '1rem', fontWeight: 600 }}>{b.pitchName}</td>
                                <td style={{ padding: '1rem' }}>
                                  <div style={{ color: 'var(--text-primary)' }}>{b.userFullName}</div>
                                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{b.userEmail}</div>
                                </td>
                                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                                  <div style={{ color: 'var(--text-primary)' }}>{start.toLocaleString()}</div>
                                  <div style={{ fontSize: '0.8rem' }}>Duration: {durationStr} (until {end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})</div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                  <span style={{ 
                                    padding: '0.25rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold',
                                    background: b.status === 'CONFIRMED' ? 'rgba(0,255,204,0.1)' : b.status === 'CANCELLED' ? 'rgba(255,71,87,0.1)' : 'rgba(255,165,0,0.1)',
                                    color: b.status === 'CONFIRMED' ? 'var(--accent-primary)' : b.status === 'CANCELLED' ? 'var(--danger)' : 'orange'
                                  }}>
                                    {b.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* Notices Tab - Cancellation Refund Requests */}
        {activeTab === 'notices' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Bell size={20} /> Cancellation Notices
              </h3>
              <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
                Review cancellation requests with fees. Approve or reject refund requests from customers.
              </p>
            </div>

            {loadingBookings ? (
              <div className="text-center" style={{ padding: '4rem' }}>
                <div className="spinner" /><p style={{ marginTop: '1rem' }}>Loading notices...</p>
              </div>
            ) : (() => {
              const notices = bookings.filter(b => b.status === 'CANCELLED' && b.cancellationReason);
              const pending = notices.filter(b => b.cancellationRefundStatus === 'PENDING_APPROVAL');
              const resolved = notices.filter(b => b.cancellationRefundStatus === 'APPROVED' || b.cancellationRefundStatus === 'REJECTED');

              if (notices.length === 0) return (
                <div className="glass-panel text-center" style={{ padding: '4rem' }}>
                  <Bell size={48} style={{ color: 'var(--text-secondary)', marginBottom: '1rem', opacity: 0.3 }} />
                  <p style={{ color: 'var(--text-secondary)' }}>No cancellation notices yet.</p>
                </div>
              );

              return (
                <>
                  {/* Pending Approval */}
                  {pending.length > 0 && (
                    <div style={{ marginBottom: '2rem' }}>
                      <h4 style={{ color: 'orange', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertTriangle size={16} /> Pending Approval ({pending.length})
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {pending.map(b => (
                          <div key={b.id} className="glass-panel" style={{ padding: '1.5rem', border: '1px solid rgba(255,165,0,0.3)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                  <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{b.pitchName}</span>
                                  <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 600, background: 'rgba(255,165,0,0.15)', color: 'orange' }}>PENDING</span>
                                </div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                                  <User size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                  {b.userFullName} ({b.userEmail})
                                </div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                                  <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                  {new Date(b.startTime).toLocaleString()} → {new Date(b.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  {b.totalAmount > 0 && <span style={{ marginLeft: '1rem', fontWeight: 600 }}>Amount: ${Number(b.totalAmount).toFixed(2)}</span>}
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.75rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                    <MessageSquare size={12} style={{ display: 'inline', marginRight: '4px' }} /> Customer's Reason:
                                  </div>
                                  <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontStyle: 'italic' }}>"{b.cancellationReason}"</div>
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'flex-end' }}>
                                <button className="btn" style={{ background: 'var(--accent-primary)', color: '#000', fontWeight: 600 }}
                                  onClick={() => { setRefundModal({ ...b, action: 'approve' }); setRefundResponse(''); }}>
                                  <CheckCircle size={14} /> Approve Refund
                                </button>
                                <button className="btn" style={{ background: 'var(--danger)', color: '#fff', fontWeight: 600 }}
                                  onClick={() => { setRefundModal({ ...b, action: 'reject' }); setRefundResponse(''); }}>
                                  <XCircle size={14} /> Reject
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Resolved Notices */}
                  {resolved.length > 0 && (
                    <div>
                      <h4 style={{ color: 'var(--text-secondary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        History ({resolved.length})
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {resolved.map(b => (
                          <div key={b.id} className="glass-panel" style={{ padding: '1rem', opacity: 0.8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                              <div>
                                <span style={{ fontWeight: 600 }}>{b.pitchName}</span>
                                <span style={{ color: 'var(--text-secondary)', marginLeft: '0.75rem', fontSize: '0.85rem' }}>{b.userFullName}</span>
                              </div>
                              <span style={{
                                padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 600,
                                background: b.cancellationRefundStatus === 'APPROVED' ? 'rgba(0,255,204,0.1)' : 'rgba(255,71,87,0.1)',
                                color: b.cancellationRefundStatus === 'APPROVED' ? 'var(--accent-primary)' : 'var(--danger)'
                              }}>
                                {b.cancellationRefundStatus === 'APPROVED' ? '✓ Refund Approved' : '✗ Refund Rejected'}
                              </span>
                            </div>
                            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                              <strong>Reason:</strong> "{b.cancellationReason}"
                              {b.cancellationResponse && <><br /><strong>Response:</strong> "{b.cancellationResponse}"</>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* Refund Response Modal */}
        {refundModal && (
          <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="glass-panel modal-content" style={{ width: '90%', maxWidth: '480px', padding: '2rem', position: 'relative' }}>
              <button onClick={() => setRefundModal(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                {refundModal.action === 'approve'
                  ? <CheckCircle size={24} style={{ color: 'var(--accent-primary)' }} />
                  : <XCircle size={24} style={{ color: 'var(--danger)' }} />}
                <h3 style={{ margin: 0 }}>{refundModal.action === 'approve' ? 'Approve Refund' : 'Reject Refund'}</h3>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <strong>Pitch:</strong> {refundModal.pitchName}<br />
                  <strong>Customer:</strong> {refundModal.userFullName} ({refundModal.userEmail})<br />
                  <strong>Reason:</strong> "{refundModal.cancellationReason}"
                </div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>Your Response (required)</label>
                <textarea
                  value={refundResponse}
                  onChange={(e) => setRefundResponse(e.target.value)}
                  className="input-field"
                  rows="3"
                  placeholder="Provide your response to the customer..."
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', fontStyle: 'italic' }}>
                A copy of this notice and your response will be sent to the admin for records.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.08)' }} onClick={() => setRefundModal(null)} disabled={refundLoading}>Cancel</button>
                <button
                  className="btn"
                  style={{ flex: 1, background: refundModal.action === 'approve' ? 'var(--accent-primary)' : 'var(--danger)', color: refundModal.action === 'approve' ? '#000' : '#fff', border: 'none', fontWeight: 600 }}
                  onClick={() => handleRefundRespond(refundModal.id, refundModal.action === 'approve')}
                  disabled={refundLoading || !refundResponse.trim()}
                >
                  {refundLoading ? <span className="spinner" style={{ width: '16px', height: '16px' }} /> : (refundModal.action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection')}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ManagerDashboard;