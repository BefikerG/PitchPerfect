import API_BASE from '../config';
import { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, CheckCircle, XCircle, Timer, X, AlertTriangle, DollarSign, FileText } from 'lucide-react';
import { Toast } from '../components/ConfirmModal';

// ---------- Countdown hook ----------
const useCountdown = (targetDate) => {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const tick = () => {
      const diff = new Date(targetDate) - new Date();
      if (diff <= 0) { setTimeLeft('Now'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(h > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${m}m ${s}s` : `${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  return timeLeft;
};

// ---------- Refund Preview Banner ----------
const RefundPreview = ({ booking }) => {
  const now = new Date();
  const start = new Date(booking.startTime);
  const hoursUntil = (start - now) / 3600000;

  let percent, label, color;
  if (hoursUntil > 12) {
    percent = 100; label = 'Full refund (>12h notice)'; color = 'var(--accent-primary)';
  } else if (hoursUntil >= 2) {
    percent = 75; label = '75% refund (2–12h notice)'; color = 'lightgreen';
  } else if (hoursUntil >= 1) {
    percent = 50; label = '50% refund (1–2h notice)'; color = 'orange';
  } else {
    percent = 0; label = 'No refund (<1h or ongoing)'; color = 'var(--danger)';
  }

  const original = booking.totalAmount || 0;
  const refund = (original * percent / 100).toFixed(2);
  const fee = (original - refund).toFixed(2);

  return (
    <div style={{
      background: 'rgba(0,0,0,0.3)', border: `1px solid rgba(255,255,255,0.1)`,
      borderRadius: '12px', padding: '1rem', marginBottom: '1rem'
    }}>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Cancellation Policy</div>
      <div style={{ color, fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>{label}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.5rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>You'd receive back</div>
          <div style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '1.1rem' }}>${refund}</div>
        </div>
        <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.5rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Cancellation fee</div>
          <div style={{ fontWeight: 700, color: 'var(--danger)', fontSize: '1.1rem' }}>${fee}</div>
        </div>
      </div>
    </div>
  );
};

// ---------- Cancel Modal ----------
const CancelModal = ({ booking, onConfirm, onClose, loading }) => {
  const [reason, setReason] = useState('');
  const now = new Date();
  const start = new Date(booking.startTime);
  const hoursUntil = (start - now) / 3600000;
  const showReason = hoursUntil <= 12;

  return (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel modal-content" style={{ width: '90%', maxWidth: '440px', padding: '2rem', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <X size={20} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <AlertTriangle size={24} style={{ color: 'var(--danger)' }} />
          <h3 style={{ margin: 0 }}>Cancel Booking</h3>
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
          You're about to cancel your booking for <strong style={{ color: 'var(--text-primary)' }}>{booking.pitchName}</strong>. Review the refund policy below:
        </p>
        <RefundPreview booking={booking} />
        
        {showReason && (
          <div style={{ marginTop: '1rem', textAlign: 'left' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>Cancellation Notice / Reason (Required since fee is applied)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="input-field"
              rows="2"
              placeholder="Please provide a reason..."
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button className="btn" style={{ flex: 1, background: 'rgba(255,255,255,0.08)' }} onClick={onClose} disabled={loading}>Keep Booking</button>
          <button className="btn" style={{ flex: 1, background: 'var(--danger)', color: '#fff', border: 'none' }} onClick={() => onConfirm(reason)} disabled={loading || (showReason && !reason.trim())}>
            {loading ? <span className="spinner" style={{ width: '16px', height: '16px' }} /> : 'Confirm Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------- Result Modal (shows refund summary) ----------
const RefundResultModal = ({ result, onClose }) => (
  <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div className="glass-panel modal-content" style={{ width: '90%', maxWidth: '400px', padding: '2rem', textAlign: 'center' }}>
      <CheckCircle size={48} style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }} />
      <h3 style={{ marginBottom: '0.5rem' }}>Booking Cancelled</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{result.policy}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'rgba(0,255,204,0.08)', borderRadius: '12px', padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Refund Amount</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-primary)' }}>${Number(result.refundAmount).toFixed(2)}</div>
        </div>
        <div style={{ background: 'rgba(255,71,87,0.08)', borderRadius: '12px', padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Fee Charged</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--danger)' }}>${Number(result.cancellationFee).toFixed(2)}</div>
        </div>
      </div>
      <button className="btn btn-primary" style={{ width: '100%' }} onClick={onClose}>Done</button>
    </div>
  </div>
);

// ---------- Booking Card ----------
const BookingCard = ({ booking, onCancelRequest }) => {
  const now = new Date();
  const startDate = new Date(booking.startTime);
  const endDate = new Date(booking.endTime);
  const isUpcoming = startDate > now && booking.status !== 'CANCELLED';
  const isOngoing = startDate <= now && endDate > now && booking.status !== 'CANCELLED';
  const isCancelled = booking.status === 'CANCELLED';
  const isEnded = endDate <= now;

  const statusColor = isCancelled ? 'var(--danger)' : isOngoing ? 'var(--accent-primary)' : isUpcoming ? 'var(--accent-secondary)' : 'var(--text-secondary)';
  const statusLabel = isCancelled ? 'Cancelled' : isOngoing ? 'Ongoing' : isUpcoming ? 'Upcoming' : 'Completed';

  const endCountdown = useCountdown(booking.endTime);
  const startCountdown = useCountdown(booking.startTime);

  const canCancel = (isUpcoming || isOngoing) && !isCancelled;

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden', opacity: isCancelled ? 0.65 : 1 }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: statusColor }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{booking.pitchName}</h3>
          <span style={{
            fontSize: '0.75rem', padding: '2px 10px', borderRadius: '12px', fontWeight: 600,
            background: isCancelled ? 'rgba(255,71,87,0.15)' : isOngoing ? 'rgba(0,255,204,0.15)' : isUpcoming ? 'rgba(0,179,255,0.15)' : 'rgba(160,165,177,0.15)',
            color: statusColor,
          }}>{statusLabel}</span>
        </div>
        {isCancelled ? <XCircle size={20} style={{ color: 'var(--danger)', flexShrink: 0 }} /> : <CheckCircle size={20} style={{ color: 'var(--success)', flexShrink: 0 }} />}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={14} />
          <span>Start: <strong style={{ color: 'var(--text-primary)' }}>{startDate.toLocaleString()}</strong></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={14} />
          <span>End: <strong style={{ color: 'var(--text-primary)' }}>{endDate.toLocaleString()}</strong></span>
        </div>
        {booking.totalAmount != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DollarSign size={14} />
            <span>Total: <strong style={{ color: 'var(--accent-primary)' }}>${Number(booking.totalAmount).toFixed(2)}</strong></span>
          </div>
        )}
      </div>

      {/* Countdown */}
      {!isEnded && !isCancelled && (
        <div style={{
          background: isOngoing ? 'rgba(0,255,204,0.08)' : 'rgba(0,179,255,0.08)',
          border: `1px solid ${isOngoing ? 'rgba(0,255,204,0.2)' : 'rgba(0,179,255,0.2)'}`,
          borderRadius: '8px', padding: '0.75rem 1rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem'
        }}>
          <Timer size={16} style={{ color: statusColor }} />
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>
              {isOngoing ? 'Time remaining' : 'Starts in'}
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: statusColor, fontVariantNumeric: 'tabular-nums' }}>
              {isOngoing ? endCountdown : startCountdown}
            </div>
          </div>
        </div>
      )}

      {/* Cancel button */}
      {canCancel && (
        <button
          onClick={() => onCancelRequest(booking)}
          className="btn"
          style={{ width: '100%', background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)', color: 'var(--danger)', fontSize: '0.875rem' }}
        >
          <XCircle size={16} style={{ marginRight: '6px' }} /> Cancel Booking
        </button>
      )}

      {/* Cancellation Refund Status */}
      {isCancelled && booking.cancellationRefundStatus && booking.cancellationRefundStatus !== 'NONE' && (
        <div style={{
          marginTop: '1rem', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem',
          background: booking.cancellationRefundStatus === 'PENDING_APPROVAL' ? 'rgba(255,165,0,0.1)' :
                      booking.cancellationRefundStatus === 'APPROVED' ? 'rgba(0,255,204,0.1)' : 'rgba(255,71,87,0.1)',
          border: `1px solid ${booking.cancellationRefundStatus === 'PENDING_APPROVAL' ? 'rgba(255,165,0,0.3)' :
                             booking.cancellationRefundStatus === 'APPROVED' ? 'rgba(0,255,204,0.3)' : 'rgba(255,71,87,0.3)'}`
        }}>
          <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: booking.cancellationRefundStatus === 'PENDING_APPROVAL' ? 'orange' : booking.cancellationRefundStatus === 'APPROVED' ? 'var(--accent-primary)' : 'var(--danger)' }}>
            Refund Status: {booking.cancellationRefundStatus.replace('_', ' ')}
          </div>
          {booking.cancellationResponse && (
            <div style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontStyle: 'italic' }}>
              Manager Note: "{booking.cancellationResponse}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ---------- Main Page ----------
const MyBookings = () => {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [refundResult, setRefundResult] = useState(null);
  const [toast, setToast] = useState(null);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [dismissedNotifs, setDismissedNotifs] = useState(false);

  const fetchBookings = useCallback(() => {
    if (!token) { navigate('/auth'); return; }
    setLoading(true);
    axios.get(`${API_BASE}/api/v1/bookings/my?size=50')
      .then(res => setBookings(res.data.content || []))
      .catch(err => console.error('Failed to load bookings', err))
      .finally(() => setLoading(false));
  }, [token, navigate]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleCancelConfirm = async (reason) => {
    if (!cancelTarget) return;
    setCancelLoading(true);
    try {
      const payload = reason ? { cancellationReason: reason } : {};
      const res = await axios.patch(`${API_BASE}/api/v1/bookings/${cancelTarget.id}/cancel`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRefundResult(res.data);
      setCancelTarget(null);
      fetchBookings();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to cancel booking.', type: 'danger' });
      setCancelTarget(null);
    } finally {
      setCancelLoading(false);
    }
  };

  const now = new Date();
  const ongoing = bookings.filter(b => b.status === 'CONFIRMED' && new Date(b.startTime) <= now && new Date(b.endTime) >= now);
  const upcoming = bookings.filter(b => b.status === 'CONFIRMED' && new Date(b.startTime) > now);
  const past = bookings.filter(b => b.status === 'CONFIRMED' && new Date(b.endTime) < now);
  const cancelled = bookings.filter(b => b.status === 'CANCELLED');

  const processedRefunds = cancelled.filter(b => b.cancellationRefundStatus === 'APPROVED' || b.cancellationRefundStatus === 'REJECTED');

  if (loading) return (
    <div className="dashboard-layout text-center" style={{ paddingTop: '150px' }}>
      <div className="spinner" />
      <p style={{ marginTop: '1rem' }}>Loading your bookings...</p>
    </div>
  );

  return (
    <div className="dashboard-layout">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {cancelTarget && (
        <CancelModal
          booking={cancelTarget}
          onConfirm={handleCancelConfirm}
          onClose={() => setCancelTarget(null)}
          loading={cancelLoading}
        />
      )}
      {refundResult && (
        <RefundResultModal
          result={refundResult}
          onClose={() => setRefundResult(null)}
        />
      )}

      <div className="container">
        <div className="mb-3" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ marginBottom: '0.25rem' }}>My Bookings</h2>
            <p style={{ margin: 0 }}>Your booking history and upcoming reservations.</p>
          </div>
          <button className="btn btn-secondary" onClick={() => setShowPolicyModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={16} /> Terms & Policy
          </button>
        </div>

        {!dismissedNotifs && processedRefunds.length > 0 && (
          <div className="glass-panel mb-4" style={{ background: 'rgba(0, 255, 204, 0.05)', border: '1px solid rgba(0, 255, 204, 0.3)', position: 'relative' }}>
            <button onClick={() => setDismissedNotifs(true)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)' }}>
              🔔 New Notifications
            </h3>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              You have <strong>{processedRefunds.length}</strong> recently processed cancellation requests. Check the <span style={{ color: 'var(--danger)' }}>✖ Cancelled</span> section below to see the manager's response and your refund status!
            </p>
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="glass-panel text-center" style={{ padding: '4rem' }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>You haven't made any bookings yet.</p>
            <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Browse Pitches</button>
          </div>
        ) : (
          <>
            {ongoing.length > 0 && (
              <div className="mb-3">
                <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-primary)', marginBottom: '1rem' }}>
                  🟢 Ongoing ({ongoing.length})
                </h3>
                <div className="grid-3">
                  {ongoing.map(b => <BookingCard key={b.id} booking={b} onCancelRequest={setCancelTarget} />)}
                </div>
              </div>
            )}
            {upcoming.length > 0 && (
              <div className="mb-3">
                <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-secondary)', marginBottom: '1rem' }}>
                  🔵 Upcoming ({upcoming.length})
                </h3>
                <div className="grid-3">
                  {upcoming.map(b => <BookingCard key={b.id} booking={b} onCancelRequest={setCancelTarget} />)}
                </div>
              </div>
            )}
            {past.length > 0 && (
              <div className="mb-3">
                <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  ⚫ Completed ({past.length})
                </h3>
                <div className="grid-3">
                  {past.map(b => <BookingCard key={b.id} booking={b} onCancelRequest={setCancelTarget} />)}
                </div>
              </div>
            )}
            {cancelled.length > 0 && (
              <div className="mb-3">
                <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--danger)', marginBottom: '1rem' }}>
                  ✖ Cancelled ({cancelled.length})
                </h3>
                <div className="grid-3">
                  {cancelled.map(b => <BookingCard key={b.id} booking={b} onCancelRequest={setCancelTarget} />)}
                </div>
              </div>
            )}
          </>
        )}

        {/* Terms and Cancellation Policy Modal */}
        {showPolicyModal && (
          <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div className="glass-panel modal-content" style={{ width: '100%', maxWidth: '600px', padding: '2rem', position: 'relative' }}>
              <button onClick={() => setShowPolicyModal(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <FileText size={28} style={{ color: 'var(--accent-primary)' }} />
                <h3 style={{ margin: 0, fontSize: '1.5rem' }}>Terms & Cancellation Policy</h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'left', maxHeight: '60vh', overflowY: 'auto', paddingRight: '1rem' }}>
                <div>
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem', fontSize: '1.1rem' }}>1. General Booking Rules</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>
                    All bookings are subject to availability and manager approval. Please arrive 10 minutes prior to your scheduled slot. Double bookings are automatically prevented by our system. For security and booking validation, your email is associated with your reservations.
                  </p>
                </div>
                
                <div>
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.75rem', fontSize: '1.1rem' }}>2. Cancellation Tiers & Refund Policy</h4>
                  <ul style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', margin: 0, paddingLeft: '1.2rem' }}>
                    <li><strong style={{ color: 'var(--accent-primary)' }}>&gt; 12 Hours Notice:</strong> Full 100% refund. No cancellation fee.</li>
                    <li><strong style={{ color: 'lightgreen' }}>2 – 12 Hours Notice:</strong> 75% refund. 25% cancellation fee applies.</li>
                    <li><strong style={{ color: 'orange' }}>1 – 2 Hours Notice:</strong> 50% refund. 50% cancellation fee applies.</li>
                    <li><strong style={{ color: 'var(--danger)' }}>&lt; 1 Hour Notice:</strong> No refund. 100% cancellation fee applies.</li>
                  </ul>
                  <p style={{ color: 'orange', fontSize: '0.85rem', marginTop: '1rem', fontStyle: 'italic', padding: '0.75rem', background: 'rgba(255,165,0,0.1)', borderRadius: '8px', border: '1px solid rgba(255,165,0,0.3)' }}>
                    <strong>Note:</strong> A written reason is mandatory for cancellations made less than 12 hours before the start time. 
                    Managers may choose to waive the cancellation fee based on your provided reason. If your reason is approved, you will receive a 100% full refund!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}


      </div>
    </div>
  );
};

export default MyBookings;
