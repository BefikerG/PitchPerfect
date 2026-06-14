import { useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Users, DollarSign, Activity, CheckCircle, Ban, Shield, List, MapPin, Trash2, ToggleRight, ToggleLeft, Image as ImageIcon, UserCheck, Eye, X, User, LayoutDashboard, Calendar, Edit2, Bell, AlertTriangle, XCircle, MessageSquare } from 'lucide-react';
import ConfirmModal, { Toast } from '../components/ConfirmModal';

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

const AdminDashboard = () => {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [pitches, setPitches] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Modal state
  const [modal, setModal] = useState(null); // { type, title, message, onConfirm }
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  // User Profile Modal state
  const [profileModalUser, setProfileModalUser] = useState(null);
  const [profileStats, setProfileStats] = useState(null);
  const [drillDownBookings, setDrillDownBookings] = useState(null);
  const [drillDownPitches, setDrillDownPitches] = useState(null); // { title: string, list: [] }

  const [editingPitch, setEditingPitch] = useState(null);
  const [isEditLoading, setIsEditLoading] = useState(false);

  // Toast state
  const [toast, setToast] = useState(null); // { message, type }
  const [bookingFilter, setBookingFilter] = useState('ALL');
  const [bookingSearch, setBookingSearch] = useState('');

  // Cancellation notice / refund response state
  const [refundModal, setRefundModal] = useState(null);
  const [refundResponse, setRefundResponse] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const showModal = (config) => setModal(config);
  const closeModal = () => setModal(null);

  useEffect(() => {
    if (user && user.role !== 'ADMIN') navigate('/dashboard');
    else if (user) fetchData();
  }, [user, navigate]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const [statsRes, usersRes, pitchesRes, managersRes, bookingsRes] = await Promise.all([
        axios.get('http://localhost:8081/api/v1/admin/stats', config),
        axios.get('http://localhost:8081/api/v1/admin/users?size=100', config),
        axios.get('http://localhost:8081/api/v1/pitches?size=100', config),
        axios.get('http://localhost:8081/api/v1/admin/managers', config).catch(() => ({ data: [] })),
        axios.get('http://localhost:8081/api/v1/bookings?size=100', config).catch(() => ({ data: { content: [] } }))
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data.content || []);
      setPitches(pitchesRes.data.content || []);
      setManagers(managersRes.data || []);
      setAllBookings(bookingsRes.data.content || []);
    } catch (err) {
      console.error('Failed to fetch admin data', err);
      showToast('Failed to load dashboard data.', 'danger');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // --- Actions wired to modals ---

  const handleToggleBan = (u) => {
    showModal({
      type: u.banned ? 'info' : 'danger',
      title: u.banned ? `Unban ${u.firstName}?` : `Ban ${u.firstName}?`,
      message: u.banned
        ? `This will restore ${u.firstName} ${u.lastName}'s access to the platform.`
        : `${u.firstName} ${u.lastName} will be blocked from accessing their account.`,
      confirmText: u.banned ? 'Unban User' : 'Ban User',
      onConfirm: async () => {
        setIsActionLoading(true);
        try {
          await axios.put(`http://localhost:8081/api/v1/admin/users/${u.id}/ban`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
          showToast(`${u.firstName} has been ${u.banned ? 'unbanned' : 'banned'}.`, u.banned ? 'success' : 'danger');
          fetchData();
        } catch (err) {
          showToast('Failed to update ban status.', 'danger');
        } finally {
          setIsActionLoading(false);
          closeModal();
        }
      },
    });
  };

  const handleRoleChange = (u, newRole) => {
    if (u.email === user?.email) return; // can't change own role
    showModal({
      type: 'info',
      title: 'Change User Role',
      message: `Change ${u.firstName} ${u.lastName}'s role from ${u.role} to ${newRole}? They will need to log out and back in for the change to take effect.`,
      confirmText: `Set as ${newRole}`,
      onConfirm: async () => {
        setIsActionLoading(true);
        try {
          await axios.put(`http://localhost:8081/api/v1/admin/users/${u.id}/role`, { role: newRole }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          showToast(`${u.firstName}'s role updated to ${newRole}.`, 'success');
          fetchData();
        } catch (err) {
          showToast(err.response?.data?.message || 'Failed to change role. Only the Super Admin can demote other Admins.', 'danger');
        } finally {
          setIsActionLoading(false);
          closeModal();
        }
      },
    });
  };

  const handleToggleAvailability = (pitch) => {
    showModal({
      type: pitch.isAvailable ? 'danger' : 'info',
      title: pitch.isAvailable ? `Unlist "${pitch.name}"?` : `Re-list "${pitch.name}"?`,
      message: pitch.isAvailable
        ? 'This pitch will be hidden from customers and cannot be booked until re-listed.'
        : 'This pitch will become visible to customers and available for booking.',
      confirmText: pitch.isAvailable ? 'Unlist Pitch' : 'Re-list Pitch',
      onConfirm: async () => {
        setIsActionLoading(true);
        try {
          await axios.put(`http://localhost:8081/api/v1/pitches/${pitch.id}/availability`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
          showToast(`"${pitch.name}" has been ${pitch.isAvailable ? 'unlisted' : 're-listed'}.`, 'success');
          fetchData();
        } catch (err) {
          showToast('Failed to update pitch availability.', 'danger');
        } finally {
          setIsActionLoading(false);
          closeModal();
        }
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
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update pitch.', 'danger');
    } finally {
      setIsEditLoading(false);
    }
  };

  const handleDeletePitch = (pitch) => {
    showModal({
      type: 'danger',
      title: `Delete "${pitch.name}"?`,
      message: 'This action is permanent and cannot be undone. All associated bookings and data will be removed.',
      confirmText: 'Delete Permanently',
      onConfirm: async () => {
        setIsActionLoading(true);
        try {
          await axios.delete(`http://localhost:8081/api/v1/pitches/${pitch.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          showToast(`"${pitch.name}" has been deleted.`, 'success');
          fetchData();
        } catch (err) {
          showToast('Failed to delete pitch.', 'danger');
        } finally {
          setIsActionLoading(false);
          closeModal();
        }
      },
    });
  };

  const handleAssignManager = (pitch, managerId) => {
    const manager = managers.find(m => m.id === Number(managerId));
    showModal({
      type: 'info',
      title: `Assign Manager to "${pitch.name}"`,
      message: manager
        ? `Assign ${manager.firstName} ${manager.lastName} as the manager of this pitch?`
        : 'Remove the current manager assignment from this pitch?',
      confirmText: 'Assign',
      onConfirm: async () => {
        setIsActionLoading(true);
        try {
          await axios.put(`http://localhost:8081/api/v1/admin/pitches/${pitch.id}/manager`,
            { managerId: managerId || null },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          showToast('Manager assigned successfully.', 'success');
          fetchData();
        } catch (err) {
          showToast('Failed to assign manager.', 'danger');
        } finally {
          setIsActionLoading(false);
          closeModal();
        }
      },
    });
  };

  const handleViewProfile = async (u) => {
    try {
      const res = await axios.get(`http://localhost:8081/api/v1/admin/users/${u.id}/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfileStats(res.data);
      setProfileModalUser(u);
      setDrillDownBookings(null);
      setDrillDownPitches(null);
    } catch (err) {
      showToast('Failed to load user profile statistics.', 'danger');
    }
  };

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div className="dashboard-layout">
      {/* Custom Modal */}
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

      {/* User Profile Modal */}
      {profileModalUser && profileStats && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content glass-panel" style={{ width: '90%', maxWidth: '500px', padding: '2rem', position: 'relative' }}>
            <button onClick={() => setProfileModalUser(null)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <X size={24} />
            </button>
            <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserCheck size={20} /> {profileModalUser.firstName} {profileModalUser.lastName}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              {profileModalUser.email} &bull; <span style={{ color: 'var(--accent-primary)' }}>{profileModalUser.role}</span>
            </p>

            {profileStats.role === 'CUSTOMER' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div 
                    style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', transition: 'background 0.2s' }}
                    onClick={async () => {
                      try {
                        const res = await axios.get(`http://localhost:8081/api/v1/bookings/user/${profileModalUser.id}?size=50`, { headers: { Authorization: `Bearer ${token}` } });
                        setDrillDownBookings(res.data.content);
                      } catch (err) { showToast('Failed to load bookings.', 'danger'); }
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  >
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Total Bookings</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{profileStats.totalBookings}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', marginTop: '4px' }}>Click to view details</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Completed</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-secondary)' }}>{profileStats.completedBookings}</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', textAlign: 'center', gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Total Spent</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#ffd700' }}>${Number(profileStats.totalSpent || 0).toFixed(2)}</div>
                  </div>
                </div>

                {drillDownBookings && (
                  <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '1rem', maxHeight: '200px', overflowY: 'auto' }}>
                    <h4 style={{ marginBottom: '0.75rem', fontSize: '0.9rem' }}>Booking History</h4>
                    {drillDownBookings.length === 0 ? <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No bookings found.</p> : (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {drillDownBookings.map(b => (
                          <li key={b.id} style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.25rem' }}>
                            <span><strong>{b.pitchName}</strong> ({new Date(b.startTime).toLocaleDateString()})</span>
                            <span style={{ color: b.status === 'CONFIRMED' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>{b.status}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div 
                    style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', transition: 'background 0.2s' }}
                    onClick={() => setDrillDownPitches({ title: 'Pitches Created', list: pitches.filter(p => p.createdByName && p.createdByName.includes(profileModalUser.firstName)) })}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  >
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Pitches Created</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{profileStats.createdPitchesCount}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', marginTop: '4px' }}>Click to view</div>
                  </div>
                  <div 
                    style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', transition: 'background 0.2s' }}
                    onClick={() => setDrillDownPitches({ title: 'Pitches Managed', list: pitches.filter(p => p.managerId === profileModalUser.id) })}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  >
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Pitches Managed</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>{profileStats.managedPitchesCount}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', marginTop: '4px' }}>Click to view</div>
                  </div>
                </div>

                {drillDownPitches && (
                  <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '1rem', maxHeight: '200px', overflowY: 'auto' }}>
                    <h4 style={{ marginBottom: '0.75rem', fontSize: '0.9rem' }}>{drillDownPitches.title}</h4>
                    {drillDownPitches.list.length === 0 ? <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No pitches found.</p> : (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {drillDownPitches.list.map(p => (
                          <li key={p.id} style={{ fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.25rem' }}>
                            <span><strong>{p.name}</strong></span>
                            <span style={{ color: p.isAvailable ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>{p.isAvailable ? 'Listed' : 'Unlisted'}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="container">
        <div className="d-flex justify-between align-center mb-3">
          <div>
            <h2 style={{ marginBottom: '0.25rem' }}>Admin Control Center</h2>
            <p style={{ margin: 0 }}>Supervise platform activity and manage users.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('overview')}>
              <Activity size={16} /> Overview
            </button>
            <button className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('users')}>
              <Users size={16} /> Users ({users.length})
            </button>
            <button className={`btn ${activeTab === 'pitches' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('pitches')}>
              <LayoutDashboard size={16} /> Pitches ({pitches.length})
            </button>
            <button className={`btn ${activeTab === 'bookings' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('bookings')}>
              <Calendar size={16} /> Bookings ({allBookings.length})
            </button>
            <button className={`btn ${activeTab === 'notices' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('notices')} style={{ position: 'relative' }}>
              <Bell size={16} /> Notices
              {allBookings.filter(b => b.cancellationRefundStatus === 'PENDING_APPROVAL').length > 0 && (
                <span style={{
                  position: 'absolute', top: '-4px', right: '-4px', width: '18px', height: '18px',
                  background: 'var(--danger)', borderRadius: '50%', fontSize: '0.65rem', fontWeight: 'bold',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
                }}>
                  {allBookings.filter(b => b.cancellationRefundStatus === 'PENDING_APPROVAL').length}
                </span>
              )}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center" style={{ padding: '4rem' }}>
            <div className="spinner" />
          </div>
        ) : (
          <>
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && stats && (
              <div className="grid-3 mb-4">
                {[
                  { label: 'Total Users', value: stats.totalUsers, icon: <Users size={28} />, color: 'rgba(0,255,204,0.1)', textColor: 'var(--accent-primary)' },
                  { label: 'Total Bookings', value: stats.totalBookings, icon: <CheckCircle size={28} />, color: 'rgba(0,179,255,0.1)', textColor: 'var(--accent-secondary)' },
                  { label: 'Platform Revenue', value: `$${Number(stats.totalRevenue).toFixed(2)}`, icon: <DollarSign size={28} />, color: 'rgba(255,215,0,0.1)', textColor: '#ffd700' },
                ].map(({ label, value, icon, color, textColor }) => (
                  <div key={label} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '1rem', background: color, borderRadius: '12px', color: textColor }}>
                      {icon}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</h4>
                      <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{value}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* USERS TAB */}
            {activeTab === 'users' && (
              <div className="glass-panel" style={{ overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--glass-border)' }}>
                      <th style={{ padding: '1rem' }}>Name</th>
                      <th style={{ padding: '1rem' }}>Email</th>
                      <th style={{ padding: '1rem' }}>Role</th>
                      <th style={{ padding: '1rem' }}>Status</th>
                      <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <td style={{ padding: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {u.profileImageUrl ? (
                            <img 
                              src={u.profileImageUrl.startsWith('/uploads/') ? `http://localhost:8081${u.profileImageUrl}` : u.profileImageUrl} 
                              alt="" 
                              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.2)' }} 
                            />
                          ) : (
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <User size={16} />
                            </div>
                          )}
                          {u.firstName} {u.lastName}
                        </td>
                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                        <td style={{ padding: '1rem' }}>
                          <select
                            value={u.role}
                            onChange={(e) => {
                              if (e.target.value !== u.role) handleRoleChange(u, e.target.value);
                            }}
                            disabled={u.email === user?.email}
                            style={{
                              background: 'rgba(0,0,0,0.25)',
                              border: '1px solid var(--glass-border)',
                              color: u.role === 'ADMIN' ? '#ff4757' : u.role === 'MANAGER' ? '#00ffcc' : 'var(--text-secondary)',
                              padding: '0.3rem 0.6rem',
                              borderRadius: '8px',
                              cursor: u.email === user?.email ? 'not-allowed' : 'pointer',
                              outline: 'none',
                              fontWeight: 600,
                              fontSize: '0.85rem',
                            }}
                          >
                            <option value="CUSTOMER" style={{ color: 'black' }}>CUSTOMER</option>
                            <option value="MANAGER" style={{ color: 'black' }}>MANAGER</option>
                            <option value="ADMIN" style={{ color: 'black' }}>ADMIN</option>
                          </select>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{
                            padding: '0.25rem 0.6rem',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            background: u.banned ? 'rgba(255,68,68,0.15)' : 'rgba(0,255,204,0.1)',
                            color: u.banned ? 'var(--danger)' : 'var(--accent-primary)'
                          }}>
                            {u.banned ? 'BANNED' : 'ACTIVE'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', marginRight: '0.5rem' }}
                            onClick={() => handleViewProfile(u)}
                            title="View Profile Statistics"
                          >
                            <Eye size={14} />
                          </button>
                          {u.email !== user?.email && (
                            <button
                              className={`btn ${u.banned ? 'btn-primary' : 'btn-secondary'}`}
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                              onClick={() => handleToggleBan(u)}
                            >
                              {u.banned ? <><Shield size={14} /> Unban</> : <><Ban size={14} /> Ban</>}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* PITCHES TAB */}
            {activeTab === 'pitches' && (
              <div className="grid-3">
                {pitches.length === 0 ? (
                  <div className="glass-panel text-center" style={{ padding: '4rem', gridColumn: '1 / -1' }}>
                    <p>No pitches yet.</p>
                  </div>
                ) : pitches.map(pitch => {
                  const imgs = pitch.imageUrls?.length > 0 ? pitch.imageUrls : pitch.imageUrl ? [pitch.imageUrl] : [];
                  return (
                    <div key={pitch.id} className="glass-panel" style={{ overflow: 'hidden', borderRadius: '16px' }}>
                      {/* Image grid */}
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

                      {/* Pitch Info */}
                      <div style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                          <h3 style={{ fontSize: '1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {pitch.name}
                            <button onClick={() => setEditingPitch(pitch)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', padding: 0 }}>
                              <Edit2 size={14} />
                            </button>
                          </h3>
                          <button
                            onClick={() => handleDeletePitch(pitch)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '2px' }}
                            title="Delete Pitch"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12} />{pitch.location}
                          </span>
                          <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>${pitch.pricePerHour}/hr</span>
                        </div>
                        
                        {/* Added By */}
                        <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          Added by: <strong style={{ color: 'var(--text-primary)' }}>{pitch.createdByName || 'Unknown'}</strong>
                        </div>

                        {/* Assign Manager */}
                        <div style={{ marginBottom: '0.5rem' }}>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '0.3rem' }}>
                            <UserCheck size={12} /> Assigned Manager
                          </label>
                          <select
                            defaultValue={pitch.managerId || ''}
                            onChange={(e) => handleAssignManager(pitch, e.target.value)}
                            style={{
                              width: '100%',
                              background: 'rgba(0,0,0,0.25)',
                              border: '1px solid var(--glass-border)',
                              color: 'var(--text-primary)',
                              padding: '0.3rem 0.5rem',
                              borderRadius: '8px',
                              outline: 'none',
                              fontSize: '0.82rem',
                              cursor: 'pointer',
                            }}
                          >
                            <option value="" style={{ color: 'black' }}>— No Manager —</option>
                            {managers.map(m => (
                              <option key={m.id} value={m.id} style={{ color: 'black' }}>
                                {m.firstName} {m.lastName}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Toggle availability */}
                        <button
                          onClick={() => handleToggleAvailability(pitch)}
                          style={{
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '6px', padding: 0,
                            color: pitch.isAvailable ? 'var(--accent-primary)' : 'var(--text-secondary)',
                            fontSize: '0.82rem', fontWeight: 600,
                          }}
                        >
                          {pitch.isAvailable ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                          {pitch.isAvailable ? 'Listed' : 'Unlisted'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* BOOKINGS TAB */}
            {activeTab === 'bookings' && (
              <div>
                {/* Info bar explaining count difference */}
                <div style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.75rem', 
                  padding: '0.75rem 1rem', marginBottom: '1.5rem',
                  background: 'rgba(0,179,255,0.08)', border: '1px solid rgba(0,179,255,0.25)', 
                  borderRadius: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)'
                }}>
                  <Calendar size={16} style={{ color: 'var(--accent-secondary)', flexShrink: 0 }} />
                  <span>
                    Admin view shows <strong style={{ color: 'var(--text-primary)' }}>all {allBookings.length} platform bookings</strong>.
                    The Manager section shows only bookings for <strong style={{ color: 'var(--accent-primary)' }}>pitches assigned to that manager</strong> — that's why the counts differ.
                  </span>
                </div>

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
                        {f === 'ALL' ? `All (${allBookings.length})` : `${f} (${allBookings.filter(b => b.status === f).length})`}
                      </button>
                    ))}
                  </div>
                  <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                    <Activity size={16} style={{ position: 'absolute', top: '12px', left: '10px', color: 'var(--text-secondary)' }} />
                    <input
                      type="text"
                      placeholder="Search by pitch, user, email..."
                      className="input-field"
                      style={{ padding: '0.5rem 0.5rem 0.5rem 2.2rem', fontSize: '0.85rem' }}
                      value={bookingSearch}
                      onChange={(e) => setBookingSearch(e.target.value)}
                    />
                  </div>
                </div>

                {(() => {
                  const filtered = allBookings.filter(b => {
                    const matchStatus = bookingFilter === 'ALL' || b.status === bookingFilter;
                    const matchSearch = !bookingSearch || 
                      b.pitchName?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
                      b.userFullName?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
                      b.userEmail?.toLowerCase().includes(bookingSearch.toLowerCase());
                    return matchStatus && matchSearch;
                  });

                  if (filtered.length === 0) return (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>No bookings match your filter.</div>
                  );

                  return (
                    <div className="glass-panel" style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                            <th style={{ padding: '1rem' }}>ID</th>
                            <th style={{ padding: '1rem' }}>User</th>
                            <th style={{ padding: '1rem' }}>Pitch</th>
                            <th style={{ padding: '1rem' }}>Date & Time</th>
                            <th style={{ padding: '1rem' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map(b => (
                            <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>#{b.id}</td>
                              <td style={{ padding: '1rem' }}>
                                <div style={{ fontWeight: 'bold' }}>{b.userFullName}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{b.userEmail}</div>
                              </td>
                              <td style={{ padding: '1rem', fontWeight: 600 }}>{b.pitchName}</td>
                              <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                                {new Date(b.startTime).toLocaleString()} - {new Date(b.endTime).toLocaleTimeString()}
                              </td>
                              <td style={{ padding: '1rem' }}>
                                <span style={{
                                  padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold',
                                  background: b.status === 'CONFIRMED' ? 'rgba(0,255,204,0.1)' : b.status === 'CANCELLED' ? 'rgba(255,71,87,0.1)' : 'rgba(255,165,0,0.1)',
                                  color: b.status === 'CONFIRMED' ? 'var(--accent-primary)' : b.status === 'CANCELLED' ? 'var(--danger)' : 'orange'
                                }}>
                                  {b.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Notices Tab */}
            {activeTab === 'notices' && (
              <div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Bell size={20} /> Cancellation Notices & Refund Log
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
                    View all cancellation requests across the platform. Approve or reject refund requests directly.
                  </p>
                </div>

                {(() => {
                  const notices = allBookings.filter(b => b.status === 'CANCELLED' && b.cancellationReason);
                  const pending = notices.filter(b => b.cancellationRefundStatus === 'PENDING_APPROVAL');
                  const resolved = notices.filter(b => b.cancellationRefundStatus === 'APPROVED' || b.cancellationRefundStatus === 'REJECTED');

                  if (notices.length === 0) return (
                    <div className="glass-panel text-center" style={{ padding: '4rem' }}>
                      <Bell size={48} style={{ color: 'var(--text-secondary)', marginBottom: '1rem', opacity: 0.3 }} />
                      <p style={{ color: 'var(--text-secondary)' }}>No cancellation notices across the platform.</p>
                    </div>
                  );

                  return (
                    <>
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
          </>
        )}
      </div>

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
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>Admin Response (required)</label>
              <textarea
                value={refundResponse}
                onChange={(e) => setRefundResponse(e.target.value)}
                className="input-field"
                rows="3"
                placeholder="Provide your response..."
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.08)' }} onClick={() => setRefundModal(null)} disabled={refundLoading}>Cancel</button>
              <button
                className="btn"
                style={{ flex: 1, background: refundModal.action === 'approve' ? 'var(--accent-primary)' : 'var(--danger)', color: refundModal.action === 'approve' ? '#000' : '#fff', border: 'none', fontWeight: 600 }}
                onClick={async () => {
                  setRefundLoading(true);
                  try {
                    await axios.patch(`http://localhost:8081/api/v1/bookings/${refundModal.id}/refund`, {
                      cancellationResponse: refundResponse,
                      approved: refundModal.action === 'approve'
                    }, { headers: { Authorization: `Bearer ${token}` } });
                    showToast(`Refund ${refundModal.action === 'approve' ? 'approved' : 'rejected'} successfully.`);
                    setRefundModal(null);
                    setRefundResponse('');
                    fetchData();
                  } catch (err) {
                    showToast(err.response?.data?.message || 'Failed to process refund.', 'danger');
                  } finally {
                    setRefundLoading(false);
                  }
                }}
                disabled={refundLoading || !refundResponse.trim()}
              >
                {refundLoading ? <span className="spinner" style={{ width: '16px', height: '16px' }} /> : (refundModal.action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
