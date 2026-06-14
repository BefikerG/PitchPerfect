import { useEffect } from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

// --- Reusable Glassmorphism Modal ---
// Usage: <ConfirmModal type="danger|success|info" title="..." message="..." onConfirm={fn} onCancel={fn} confirmText="Delete" />

const iconMap = {
  danger: <AlertTriangle size={28} style={{ color: '#ff4757' }} />,
  success: <CheckCircle size={28} style={{ color: '#00ffcc' }} />,
  info: <Info size={28} style={{ color: '#00b3ff' }} />,
};

const accentMap = {
  danger: { bg: 'rgba(255,71,87,0.15)', border: 'rgba(255,71,87,0.4)', btn: '#ff4757' },
  success: { bg: 'rgba(0,255,204,0.1)', border: 'rgba(0,255,204,0.3)', btn: '#00ffcc' },
  info: { bg: 'rgba(0,179,255,0.1)', border: 'rgba(0,179,255,0.3)', btn: '#00b3ff' },
};

const ConfirmModal = ({ type = 'danger', title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', isLoading = false }) => {
  const colors = accentMap[type];

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, rgba(20,20,35,0.97) 0%, rgba(30,30,50,0.97) 100%)',
          border: `1px solid ${colors.border}`,
          borderRadius: '20px',
          padding: '2rem 2.5rem',
          maxWidth: '420px',
          width: '90%',
          boxShadow: `0 0 60px ${colors.bg}, 0 20px 60px rgba(0,0,0,0.5)`,
          animation: 'slideUp 0.2s ease',
          position: 'relative',
        }}
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          style={{
            position: 'absolute', top: '1rem', right: '1rem',
            background: 'rgba(255,255,255,0.08)', border: 'none',
            borderRadius: '50%', width: '30px', height: '30px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-secondary)',
            transition: 'all 0.2s',
          }}
        >
          <X size={16} />
        </button>

        {/* Icon */}
        <div style={{
          width: '56px', height: '56px', borderRadius: '16px',
          background: colors.bg, border: `1px solid ${colors.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '1.25rem',
        }}>
          {iconMap[type]}
        </div>

        {/* Content */}
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 700 }}>
          {title}
        </h3>
        <p style={{ margin: '0 0 1.75rem', color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem' }}>
          {message}
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            disabled={isLoading}
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: '10px',
              border: '1px solid var(--glass-border)',
              background: 'rgba(255,255,255,0.06)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: '10px',
              border: 'none',
              background: isLoading ? 'rgba(255,255,255,0.1)' : colors.btn,
              color: type === 'success' ? '#000' : '#fff',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              fontWeight: 700,
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? (
              <>
                <span style={{
                  width: '14px', height: '14px', borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                  display: 'inline-block',
                  animation: 'spin 0.6s linear infinite',
                }} />
                Working...
              </>
            ) : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Toast Notification ---
export const Toast = ({ message, type = 'success', onClose }) => {
  const colors = accentMap[type];

  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 10000,
      background: 'linear-gradient(135deg, rgba(20,20,35,0.97) 0%, rgba(30,30,50,0.97) 100%)',
      border: `1px solid ${colors.border}`,
      borderRadius: '14px',
      padding: '1rem 1.5rem',
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      boxShadow: `0 0 30px ${colors.bg}, 0 10px 30px rgba(0,0,0,0.5)`,
      animation: 'slideInRight 0.3s ease',
      maxWidth: '360px',
    }}>
      {iconMap[type]}
      <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 500 }}>
        {message}
      </p>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
        <X size={16} />
      </button>
    </div>
  );
};

export default ConfirmModal;
