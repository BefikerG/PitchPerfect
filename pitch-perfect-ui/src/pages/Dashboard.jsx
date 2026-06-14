import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { MapPin, Clock, DollarSign, X, Search, ChevronLeft, ChevronRight, Lock, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CountdownBadge = ({ endTime }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calc = () => {
      const diff = new Date(endTime) - new Date();
      if (diff <= 0) return '0s';
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / 1000 / 60) % 60);
      const s = Math.floor((diff / 1000) % 60);
      
      let str = '';
      if (d > 0) str += `${d}d `;
      str += `${h}h ${m}m ${s}s`;
      return str;
    };
    setTimeLeft(calc());
    const interval = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  return <span>{timeLeft}</span>;
};

const Dashboard = () => {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [pitches, setPitches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPitch, setSelectedPitch] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [totalPrice, setTotalPrice] = useState(0);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchStartTime, setSearchStartTime] = useState('');
  const [searchEndTime, setSearchEndTime] = useState('');
  const [nextAvailable, setNextAvailable] = useState('');
  const [reviews, setReviews] = useState([]);
  const [activeModalTab, setActiveModalTab] = useState('book');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [activeDateFilter, setActiveDateFilter] = useState('');

  // Fallback image map
  const [imageFallbacks, setImageFallbacks] = useState({});

  useEffect(() => { fetchPitches(); }, []);

  const fetchPitches = async (optStart, optEnd) => {
    setLoading(true);
    try {
      let url = 'http://localhost:8081/api/v1/pitches/search?size=50';
      const s = optStart !== undefined ? optStart : searchStartTime;
      const e = optEnd !== undefined ? optEnd : searchEndTime;
      if (s && e) {
        const fmtStart = s.length === 16 ? s + ':00' : s;
        const fmtEnd = e.length === 16 ? e + ':00' : e;
        url += `&startTime=${encodeURIComponent(fmtStart)}&endTime=${encodeURIComponent(fmtEnd)}`;
      }
      const res = await axios.get(url);
      setPitches(res.data.content || []);
    } catch (err) {
      console.error('Failed to load pitches', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (pitchId) => {
    try {
      const res = await axios.get(`http://localhost:8081/api/v1/reviews/pitch/${pitchId}?size=50`);
      setReviews(res.data.content || []);
    } catch (err) {
      console.error('Failed to load reviews', err);
    }
  };

  useEffect(() => {
    if (selectedPitch && startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      if (end > start) {
        const diffHrs = (end - start) / (1000 * 60 * 60);
        setTotalPrice((diffHrs * parseFloat(selectedPitch.pricePerHour)).toFixed(2));
      } else {
        setTotalPrice(0);
      }
    } else {
      setTotalPrice(0);
    }
  }, [startTime, endTime, selectedPitch]);

  const handleBookClick = (pitch) => {
    if (!token) {
      navigate('/auth');
      return;
    }
    setSelectedPitch(pitch);
    setCurrentImageIndex(0);
    setStartTime('');
    setEndTime('');
    setTotalPrice(0);
    setBookingError('');
    setNextAvailable('');
    setBookingSuccess(false);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setBookingError('');
    setNextAvailable('');

    if (new Date(endTime) <= new Date(startTime)) {
      setBookingError('End time must be after start time.');
      return;
    }

    const fmt = (dt) => dt.length === 16 ? dt + ':00' : dt;

    try {
      await axios.post('http://localhost:8081/api/v1/bookings', {
        pitchId: selectedPitch.id,
        startTime: fmt(startTime),
        endTime: fmt(endTime),
      });
      setBookingSuccess(true);
      setTimeout(() => { setSelectedPitch(null); fetchPitches(); }, 2500);
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (msg.includes('DOUBLE_BOOKING_PREVENTED')) {
        const afterColon = msg.split('available from:')[1];
        setNextAvailable(afterColon ? afterColon.trim() : '');
        setBookingError('⚠️ Double Booking Prevented! This pitch is already reserved for that time slot.');
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        setBookingError('You must be logged in to book a pitch.');
      } else {
        const validationErrs = err.response?.data?.validationErrors;
        if (validationErrs && Object.keys(validationErrs).length > 0) {
          setBookingError(Object.values(validationErrs).join(' | '));
        } else {
          setBookingError(msg || 'Failed to create booking.');
        }
      }
    }
  };

  const filteredPitches = pitches.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getImages = (pitch) => {
    const imgs = pitch.imageUrls && pitch.imageUrls.length > 0
      ? pitch.imageUrls
      : pitch.imageUrl
        ? [pitch.imageUrl]
        : ['https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=600&auto=format&fit=crop'];
    return imgs;
  };

  const handleImageError = (pitchId, images, currentIdx, e) => {
    if (currentIdx < images.length - 1) {
      setImageFallbacks(prev => ({ ...prev, [pitchId]: currentIdx + 1 }));
      e.target.src = images[currentIdx + 1];
    } else {
      e.target.src = 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=600&auto=format&fit=crop';
    }
  };

  const setQuickDate = (type) => {
    const now = new Date();
    let start = new Date(now);
    let end = new Date(now);

    if (type === 'today') {
      start.setHours(now.getHours() + 1, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (type === 'tomorrow') {
      start.setDate(now.getDate() + 1);
      start.setHours(9, 0, 0, 0);
      end.setDate(now.getDate() + 1);
      end.setHours(23, 59, 59, 999);
    } else if (type === 'weekend') {
      const day = now.getDay();
      const daysUntilSat = day === 6 ? 0 : day === 0 ? 6 : 6 - day;
      start.setDate(now.getDate() + daysUntilSat);
      start.setHours(9, 0, 0, 0);
      end.setDate(now.getDate() + daysUntilSat + 1); // Sunday
      end.setHours(23, 59, 59, 999);
    } else if (type === 'month') {
      start.setDate(1);
      start.setHours(9, 0, 0, 0);
      end.setMonth(now.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
    } else {
      setSearchStartTime('');
      setSearchEndTime('');
      setActiveDateFilter('');
      fetchPitches('', '');
      return;
    }

    const fmt = (d) => d.toISOString().slice(0, 16);
    const sStr = fmt(start);
    const eStr = fmt(end);
    setSearchStartTime(sStr);
    setSearchEndTime(eStr);
    setActiveDateFilter(type);
    fetchPitches(sStr, eStr);
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!token) return;
    try {
      await axios.post('http://localhost:8081/api/v1/reviews', {
        pitchId: selectedPitch.id,
        rating: reviewRating,
        comment: reviewComment
      }, { headers: { Authorization: `Bearer ${token}` }});
      setReviewComment('');
      setReviewRating(5);
      fetchReviews(selectedPitch.id);
      alert('Review submitted successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review');
    }
  };

  return (
    <div className="dashboard-layout">
      <div className="container">
        {/* Header */}
        <div className="d-flex justify-between align-center mb-3" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ marginBottom: '0.25rem' }}>Find a Pitch</h2>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
              {user ? `Welcome back, ${user.firstName}!` : 'Browse pitches — sign in to book one.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="input-group" style={{ marginBottom: 0, width: '220px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  className="input-field"
                  placeholder="Search by name or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>
            
            <div className="input-group" style={{ marginBottom: 0, width: '160px' }}>
              <div style={{ position: 'relative' }}>
                <Clock size={16} style={{ position: 'absolute', top: '13px', left: '10px', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
                <input type="datetime-local" className="input-field" 
                  style={{ padding: '0.5rem 0.5rem 0.5rem 2.2rem', fontSize: '0.85rem' }}
                  title="Available From"
                  value={searchStartTime} onChange={(e) => setSearchStartTime(e.target.value)} />
              </div>
            </div>
            
            <div className="input-group" style={{ marginBottom: 0, width: '160px' }}>
              <div style={{ position: 'relative' }}>
                <Clock size={16} style={{ position: 'absolute', top: '13px', left: '10px', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
                <input type="datetime-local" className="input-field" 
                  style={{ padding: '0.5rem 0.5rem 0.5rem 2.2rem', fontSize: '0.85rem' }}
                  title="Available Until"
                  value={searchEndTime} onChange={(e) => setSearchEndTime(e.target.value)} />
              </div>
            </div>
            
            <button className="btn btn-primary" onClick={fetchPitches} style={{ height: '42px', padding: '0 1.5rem' }}>
              Search
            </button>
          </div>
        </div>

        {/* Quick Date Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {[{ id: '', label: 'Any time' }, { id: 'today', label: 'Today' }, { id: 'tomorrow', label: 'Tomorrow' }, { id: 'weekend', label: 'This Weekend' }, { id: 'month', label: 'This Month' }].map(pill => (
            <button
              key={pill.id}
              onClick={() => setQuickDate(pill.id)}
              style={{
                padding: '4px 12px', borderRadius: '16px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                background: activeDateFilter === pill.id ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                color: activeDateFilter === pill.id ? '#000' : 'var(--text-secondary)',
                border: `1px solid ${activeDateFilter === pill.id ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)'}`,
                transition: 'all 0.2s'
              }}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {!user && (
          <div className="glass-panel mb-3" style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid rgba(0,255,204,0.2)', background: 'rgba(0,255,204,0.05)' }}>
            <Lock size={20} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
              You're browsing as a guest. <strong style={{ color: 'var(--accent-primary)', cursor: 'pointer' }} onClick={() => navigate('/auth')}>Sign in</strong> to book a pitch.
            </p>
          </div>
        )}

        {loading ? (
          <div className="text-center mt-3" style={{ padding: '4rem' }}>
            <div className="spinner" />
            <p style={{ marginTop: '1rem' }}>Loading pitches...</p>
          </div>
        ) : filteredPitches.length === 0 ? (
          <div className="text-center mt-3 glass-panel" style={{ padding: '4rem' }}>
            <p style={{ fontSize: '1.1rem' }}>No pitches found{searchTerm ? ` for "${searchTerm}"` : ''}.</p>
          </div>
        ) : (
          <div className="grid-3">
            {filteredPitches.map(pitch => {
              const images = getImages(pitch);
              return (
                <div
                  key={pitch.id}
                  className="glass-panel pitch-card"
                  onClick={() => handleBookClick(pitch)}
                >
                  <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '16px 16px 0 0' }}>
                    <img
                      src={images[imageFallbacks[pitch.id] || 0]}
                      alt={pitch.name}
                      className="pitch-image"
                      onError={(e) => handleImageError(pitch.id, images, imageFallbacks[pitch.id] || 0, e)}
                    />
                    {images.length > 1 && (
                      <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', color: '#fff' }}>
                        +{images.length - 1} photos
                      </div>
                    )}
                    {!user && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.0)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '3rem' }}>
                        <div className="pitch-lock-badge">
                          <Lock size={12} /> Sign in to book
                        </div>
                      </div>
                    )}
                    {pitch.currentBookingEndTime ? (
                      <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(255, 71, 87, 0.95)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', color: '#fff', fontWeight: 'bold', display: 'flex', alignItems: 'center', flexWrap: 'wrap', maxWidth: 'calc(100% - 110px)', gap: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', zIndex: 10 }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffcccc', animation: 'pulse 1.5s infinite', flexShrink: 0 }}></div>
                        <span style={{ whiteSpace: 'nowrap' }}>Opens in:</span> <CountdownBadge endTime={pitch.currentBookingEndTime} />
                      </div>
                    ) : pitch.nextBookingStartTime ? (
                      <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(255, 165, 0, 0.95)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', color: '#000', fontWeight: 'bold', display: 'flex', alignItems: 'center', flexWrap: 'wrap', maxWidth: 'calc(100% - 110px)', gap: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.4)', zIndex: 10 }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff', animation: 'pulse 1.5s infinite', flexShrink: 0 }}></div>
                        <span style={{ whiteSpace: 'nowrap' }}>Until:</span> <CountdownBadge endTime={pitch.nextBookingStartTime} />
                      </div>
                    ) : (
                      <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(0, 255, 204, 0.95)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', color: '#000', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.4)', zIndex: 10 }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#000', flexShrink: 0 }}></div>
                        Available Now
                      </div>
                    )}
                  </div>
                  <div className="pitch-price">${pitch.pricePerHour}/hr</div>
                  <div className="pitch-content">
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{pitch.name}</h3>
                    <div className="d-flex align-center" style={{ gap: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      <MapPin size={14} /> {pitch.location}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {selectedPitch && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setSelectedPitch(null)}>
          <div className="glass-panel modal-content" style={{ padding: '2rem', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button
              onClick={() => setSelectedPitch(null)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
            >
              <X size={24} />
            </button>

            {/* Image Gallery */}
            <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', marginBottom: '1.5rem', height: '220px' }}>
              <img
                src={getImages(selectedPitch)[currentImageIndex]}
                alt={selectedPitch.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {getImages(selectedPitch).length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex(i => (i - 1 + getImages(selectedPitch).length) % getImages(selectedPitch).length)}
                    style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', color: '#fff', cursor: 'pointer', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex(i => (i + 1) % getImages(selectedPitch).length)}
                    style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', color: '#fff', cursor: 'pointer', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <ChevronRight size={16} />
                  </button>
                  <div style={{ position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '4px' }}>
                    {getImages(selectedPitch).map((_, idx) => (
                      <div key={idx} onClick={() => setCurrentImageIndex(idx)} style={{ width: '6px', height: '6px', borderRadius: '50%', background: idx === currentImageIndex ? 'var(--accent-primary)' : 'rgba(255,255,255,0.4)', cursor: 'pointer' }} />
                    ))}
                  </div>
                </>
              )}
            </div>

            <div style={{ display: 'flex', borderBottom: '1px solid var(--glass-border)', marginBottom: '1.5rem' }}>
              <button
                className={`btn ${activeModalTab === 'book' ? 'btn-primary' : ''}`}
                style={{ background: activeModalTab === 'book' ? '' : 'transparent', border: 'none', borderRadius: '8px 8px 0 0' }}
                onClick={() => setActiveModalTab('book')}
              >
                Book
              </button>
              <button
                className={`btn ${activeModalTab === 'reviews' ? 'btn-primary' : ''}`}
                style={{ background: activeModalTab === 'reviews' ? '' : 'transparent', border: 'none', borderRadius: '8px 8px 0 0' }}
                onClick={() => {
                  setActiveModalTab('reviews');
                  fetchReviews(selectedPitch.id);
                }}
              >
                Reviews
              </button>
            </div>

            {activeModalTab === 'book' && (
              <>
                <h3 style={{ marginBottom: '0.5rem' }}>Book {selectedPitch.name}</h3>
                <p className="mb-2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={16} /> {selectedPitch.location} &nbsp;|&nbsp; <DollarSign size={16} />{selectedPitch.pricePerHour}/hr
                </p>

                {bookingSuccess && (
                  <div className="toast success" style={{ position: 'relative', margin: '0 0 1rem 0' }}>
                    ✓ Booking confirmed! Redirecting...
                  </div>
                )}

                {bookingError && (
                  <div className="toast error" style={{ position: 'relative', margin: '0 0 0.5rem 0', animation: 'none', color: 'white' }}>
                    {bookingError}
                  </div>
                )}

                {nextAvailable && (
                  <div className="glass-panel" style={{ padding: '0.75rem 1rem', marginBottom: '1rem', background: 'rgba(255,165,0,0.1)', border: '1px solid rgba(255,165,0,0.3)', borderRadius: '8px', fontSize: '0.875rem' }}>
                    <Clock size={14} style={{ display: 'inline', marginRight: '6px', color: 'var(--warning)' }} />
                    <span style={{ color: 'var(--warning)' }}>Next available from: <strong>{nextAvailable}</strong></span>
                  </div>
                )}

                <form onSubmit={handleBookingSubmit}>
                  <div className="input-group">
                    <label>Start Time</label>
                    <div style={{ position: 'relative' }}>
                      <Clock size={18} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-secondary)' }} />
                      <input
                        type="datetime-local"
                        className="input-field"
                        style={{ paddingLeft: '2.5rem' }}
                        value={startTime}
                        min={new Date().toISOString().slice(0, 16)}
                        onChange={(e) => setStartTime(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label>End Time</label>
                    <div style={{ position: 'relative' }}>
                      <Clock size={18} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-secondary)' }} />
                      <input
                        type="datetime-local"
                        className="input-field"
                        style={{ paddingLeft: '2.5rem' }}
                        value={endTime}
                        min={startTime || new Date().toISOString().slice(0, 16)}
                        onChange={(e) => setEndTime(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="glass-panel mb-2" style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Total Cost:</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent-primary)' }}>${totalPrice}</span>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    disabled={bookingSuccess || !startTime || !endTime}
                  >
                    Confirm Booking
                  </button>
                </form>
              </>
            )}

            {activeModalTab === 'reviews' && (
              <>
                <h3 style={{ marginBottom: '1rem' }}>Reviews for {selectedPitch.name}</h3>
                
                {user && (
                  <form onSubmit={submitReview} className="glass-panel mb-3" style={{ padding: '1rem' }}>
                    <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Leave a Review</h4>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '0.5rem' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          size={20}
                          fill={star <= reviewRating ? 'var(--warning)' : 'transparent'}
                          color={star <= reviewRating ? 'var(--warning)' : 'var(--text-secondary)'}
                          style={{ cursor: 'pointer' }}
                          onClick={() => setReviewRating(star)}
                        />
                      ))}
                    </div>
                    <textarea
                      className="input-field"
                      rows="3"
                      placeholder="Write your review here..."
                      value={reviewComment}
                      onChange={e => setReviewComment(e.target.value)}
                      style={{ resize: 'none', marginBottom: '0.5rem' }}
                    />
                    <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Submit</button>
                  </form>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {reviews.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)' }}>No reviews yet.</p>
                  ) : (
                    reviews.map(review => (
                      <div key={review.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: 'bold' }}>{review.userFirstName} {review.userLastName}</span>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '2px', marginBottom: '0.5rem' }}>
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star
                              key={star}
                              size={12}
                              fill={star <= review.rating ? 'var(--warning)' : 'transparent'}
                              color={star <= review.rating ? 'var(--warning)' : 'var(--text-secondary)'}
                            />
                          ))}
                        </div>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)' }}>
                          {review.comment}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
