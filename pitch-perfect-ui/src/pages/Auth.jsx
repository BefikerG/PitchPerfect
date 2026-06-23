import API_BASE from '../config';
import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Mail, Lock, User as UserIcon } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [usernameStatus, setUsernameStatus] = useState(null); // null, 'checking', 'available', 'taken'
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (isLogin || !username) {
      setUsernameStatus(null);
      return;
    }
    
    setUsernameStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/v1/auth/check-username?username=${username}`);
        setUsernameStatus(res.data.available ? 'available' : 'taken');
      } catch (err) {
        setUsernameStatus(null);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [username, isLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        const res = await axios.post(`${API_BASE}/api/v1/auth/login', { email, password });
        login(res.data.token, rememberMe);
        navigate('/dashboard');
      } else {
        const res = await axios.post(`${API_BASE}/api/v1/auth/register', { 
          firstName, lastName, username, email, password 
        });
        login(res.data.token, rememberMe);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please try again.');
    }
  };

  return (
    <div className="auth-container" style={{ minHeight: 'calc(100vh - 70px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="glass-panel auth-card" style={{ padding: '3rem', width: '100%', maxWidth: '480px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', background: 'linear-gradient(90deg, #fff, var(--accent-primary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            {isLogin ? 'Sign in to book your favorite pitches.' : 'Join PitchPerfect and start booking today.'}
          </p>
        </div>
        
        {error && (
          <div style={{ background: 'rgba(255, 71, 87, 0.1)', border: '1px solid rgba(255, 71, 87, 0.3)', color: 'var(--danger)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.2rem' }}>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {!isLogin && (
            <div className="d-flex" style={{ gap: '1rem' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <UserIcon size={18} style={{ position: 'absolute', top: '14px', left: '16px', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  className="input-field" 
                  style={{ paddingLeft: '3rem', height: '3rem', borderRadius: '12px' }} 
                  placeholder="First Name" 
                  value={firstName} 
                  onChange={(e) => setFirstName(e.target.value)} 
                  required 
                />
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                <UserIcon size={18} style={{ position: 'absolute', top: '14px', left: '16px', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  className="input-field" 
                  style={{ paddingLeft: '3rem', height: '3rem', borderRadius: '12px' }} 
                  placeholder="Last Name" 
                  value={lastName} 
                  onChange={(e) => setLastName(e.target.value)} 
                  required 
                />
              </div>
            </div>
          )}

          {!isLogin && (
            <div style={{ position: 'relative' }}>
              <UserIcon size={18} style={{ position: 'absolute', top: '14px', left: '16px', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                className="input-field" 
                style={{ paddingLeft: '3rem', height: '3rem', borderRadius: '12px' }} 
                placeholder="Username" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required 
              />
              {usernameStatus && (
                <div style={{ 
                  fontSize: '0.8rem', marginTop: '0.25rem', paddingLeft: '0.5rem', 
                  color: usernameStatus === 'available' ? 'var(--accent-primary)' : usernameStatus === 'taken' ? 'var(--danger)' : 'var(--text-secondary)' 
                }}>
                  {usernameStatus === 'checking' && 'Checking availability...'}
                  {usernameStatus === 'available' && 'Username is available!'}
                  {usernameStatus === 'taken' && 'Username is already taken.'}
                </div>
              )}
            </div>
          )}

          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', top: '14px', left: '16px', color: 'var(--text-secondary)' }} />
            <input 
              type="email" 
              className="input-field" 
              style={{ paddingLeft: '3rem', height: '3rem', borderRadius: '12px' }} 
              placeholder="Email Address" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', top: '14px', left: '16px', color: 'var(--text-secondary)' }} />
            <input 
              type="password" 
              className="input-field" 
              style={{ paddingLeft: '3rem', height: '3rem', borderRadius: '12px' }} 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          <div className="d-flex justify-between align-center" style={{ marginTop: '0.25rem', marginBottom: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <input 
                type="checkbox" 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)} 
                style={{ accentColor: 'var(--accent-primary)', width: '18px', height: '18px', cursor: 'pointer' }}
              />
              Remember Me
            </label>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.05rem', fontWeight: '600', borderRadius: '12px', marginTop: '0.5rem', boxShadow: '0 4px 15px rgba(0, 255, 204, 0.3)' }}>
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', margin: 0 }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem', padding: '0 0.25rem', transition: 'color 0.2s' }}
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
