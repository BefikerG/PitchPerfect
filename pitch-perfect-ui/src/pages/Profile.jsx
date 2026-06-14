import { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { User, Mail, Camera, Save, X, ArrowLeft } from 'lucide-react';
import ConfirmModal, { Toast } from '../components/ConfirmModal';
import ImageCropper from '../components/ImageCropper';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, token, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [usernameStatus, setUsernameStatus] = useState(null);
  const [cropModalSrc, setCropModalSrc] = useState(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setUsername(user.username || '');
      if (user.profileImageUrl && user.profileImageUrl.startsWith('/uploads/')) {
        setProfileImageUrl(`http://localhost:8081${user.profileImageUrl}`);
      } else {
        setProfileImageUrl(user.profileImageUrl || '');
      }
    }
  }, [user]);

  useEffect(() => {
    if (!username || username === user?.username) {
      setUsernameStatus(null);
      return;
    }
    
    setUsernameStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const res = await axios.get(`http://localhost:8081/api/v1/auth/check-username?username=${username}`);
        setUsernameStatus(res.data.available ? 'available' : 'taken');
      } catch (err) {
        setUsernameStatus(null);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [username, user]);

  const showToast = (msg, type = 'success') => setToast({ message: msg, type });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Limit file size to 5MB (5 * 1024 * 1024 bytes)
    if (file.size > 5242880) {
      showToast('Image exceeds the 5MB size limit', 'danger');
      e.target.value = '';
      return;
    }

    // Open cropper instead of setting immediately
    setCropModalSrc(URL.createObjectURL(file));
    e.target.value = ''; // Reset input
  };

  const handleCropComplete = (file, previewUrl) => {
    setSelectedFile(file);
    setProfileImageUrl(previewUrl);
    setCropModalSrc(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // 1. Upload image if a new one was selected
      let updatedUser = { ...user };
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        
        const imageResponse = await axios.post(
          'http://localhost:8081/api/v1/users/profile/image',
          formData,
          { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
        );
        updatedUser.profileImageUrl = imageResponse.data.profileImageUrl;
      }

      // 2. Update the rest of the profile
      const response = await axios.put(
        'http://localhost:8081/api/v1/users/profile',
        { firstName, lastName, username },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setUser(response.data); // Update AuthContext state with final user
      setSelectedFile(null);
      showToast('Profile updated successfully', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to update profile', 'danger');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="dashboard-layout">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {cropModalSrc && (
        <ImageCropper 
          imageSrc={cropModalSrc} 
          onCropComplete={handleCropComplete} 
          onCancel={() => setCropModalSrc(null)} 
        />
      )}
      
      <div className="container" style={{ maxWidth: '600px', margin: '2rem auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="btn" 
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
          >
            <ArrowLeft size={18} /> Back
          </button>
          <h2 style={{ margin: 0 }}>My Profile</h2>
          <div style={{ width: '85px' }}></div> {/* Spacer for centering */}
        </div>
        
        <div className="glass-panel" style={{ padding: '2rem' }}>
          {/* Avatar Section */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
            <div style={{ 
              width: '120px', height: '120px', borderRadius: '50%', 
              background: 'rgba(255,255,255,0.05)', 
              border: '2px solid var(--accent-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', marginBottom: '1rem',
              position: 'relative'
            }}>
              {profileImageUrl ? (
                <img src={profileImageUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={48} color="var(--text-secondary)" />
              )}
            </div>
            
            <div className="input-group" style={{ width: '100%', maxWidth: '400px' }}>
              <label style={{ fontSize: '0.85rem', textAlign: 'center' }}>Upload Profile Image</label>
              <div style={{ position: 'relative' }}>
                <Camera size={16} style={{ position: 'absolute', top: '13px', left: '12px', color: 'var(--text-secondary)' }} />
                <input
                  type="file"
                  accept="image/*"
                  className="input-field"
                  style={{ paddingLeft: '2.5rem', paddingTop: '0.6rem' }}
                  onChange={handleImageUpload}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label>First Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', top: '13px', left: '12px', color: 'var(--text-secondary)' }} />
                  <input
                    type="text"
                    className="input-field"
                    style={{ paddingLeft: '2.5rem' }}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="input-group">
                <label>Last Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', top: '13px', left: '12px', color: 'var(--text-secondary)' }} />
                  <input
                    type="text"
                    className="input-field"
                    style={{ paddingLeft: '2.5rem' }}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="input-group" style={{ marginTop: '1rem' }}>
              <label>Username</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', top: '13px', left: '14px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>@</span>
                <input
                  type="text"
                  className="input-field"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
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

            <div className="input-group" style={{ marginTop: '1rem' }}>
              <label>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', top: '13px', left: '12px', color: 'var(--text-secondary)' }} />
                <input
                  type="email"
                  className="input-field"
                  style={{ paddingLeft: '2.5rem', background: 'rgba(255,255,255,0.02)', color: 'var(--text-secondary)' }}
                  value={user.email}
                  disabled
                />
              </div>
              <small style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'block' }}>
                Email cannot be changed.
              </small>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
              disabled={loading}
            >
              {loading ? <span className="spinner" style={{ width: '20px', height: '20px' }}></span> : <><Save size={20} /> Save Changes</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
