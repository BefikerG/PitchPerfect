import API_BASE from '../config';
import { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogOut, User, Menu, X, Calendar } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => setMenuOpen(false), [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container nav-container">
        <Link to="/" className="nav-logo">PitchPerfect</Link>

        {/* Desktop Links */}
        <div className="nav-links">
          <Link to="/dashboard" className={isActive('/dashboard')}>Pitches</Link>
          {user && (
            <Link to="/my-bookings" className={isActive('/my-bookings')}>
              <Calendar size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              My Bookings
            </Link>
          )}
          {user && (user.role === 'MANAGER' || user.role === 'ADMIN') && (
            <Link to="/manager" className={isActive('/manager')}>Manage</Link>
          )}
          {user && user.role === 'ADMIN' && (
            <Link to="/admin" className={isActive('/admin')}>Admin</Link>
          )}

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: '1rem' }}>
              <Link to="/profile" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                {user.profileImageUrl ? (
                  <img src={user.profileImageUrl.startsWith('/uploads/') ? `${API_BASE}${user.profileImageUrl}` : user.profileImageUrl} alt="Profile" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <User size={16} />
                )}
                <span>{user.username ? `@${user.username}` : user.firstName}</span>
                <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(0,255,204,0.1)', color: 'var(--accent-primary)', border: '1px solid rgba(0,255,204,0.2)' }}>
                  {user.role}
                </span>
              </Link>
              <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', gap: '0.4rem' }}>
                <LogOut size={15} /> Logout
              </button>
            </div>
          ) : (
            <Link to="/auth" className="btn btn-primary" style={{ marginLeft: '1rem' }}>Sign In</Link>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="btn btn-secondary"
          style={{ display: 'none', padding: '0.4rem 0.6rem' }}
          id="mobile-menu-btn"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--glass-border)', padding: '1rem 2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Link to="/dashboard" className="nav-link">Pitches</Link>
          {user && <Link to="/my-bookings" className="nav-link">My Bookings</Link>}
          {user && (user.role === 'MANAGER' || user.role === 'ADMIN') && (
            <Link to="/manager" className="nav-link">Manage</Link>
          )}
          {user && user.role === 'ADMIN' && (
            <Link to="/admin" className="nav-link">Admin</Link>
          )}
          {user && <Link to="/profile" className="nav-link">Profile</Link>}
          {user ? (
            <button onClick={handleLogout} className="btn btn-secondary" style={{ width: '100%', marginTop: '0.5rem' }}>
              <LogOut size={15} /> Logout
            </button>
          ) : (
            <Link to="/auth" className="btn btn-primary" style={{ textAlign: 'center' }}>Sign In</Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
