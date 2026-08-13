import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store';
import { useTheme } from '../useTheme';

export default function Login() {
  const { t } = useTranslation();
  const { theme, toggle } = useTheme();
  const { login, register, setMockUser } = useAppStore();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [displayName, setDisplayName] = useState('');

  const formatPhone = (raw: string) => {
    let p = raw.trim();
    if (!p.startsWith('+')) {
      p = p.startsWith('0') ? '+251' + p.substring(1) : '+251' + p;
    }
    return p;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const phone = formatPhone(phoneNumber);

    try {
      if (isRegister) {
        await register({ phone, password, displayName: displayName || 'Player' });
      } else {
        await login(phone, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDevBypass = async () => {
    setError('');
    setLoading(true);

    try {
      // Try login first
      await login('+251911000000', 'test123');
    } catch {
      // If login fails, register then login
      try {
        await register({
          phone: '+251911000000',
          password: 'test123',
          displayName: 'Test Player',
          dob: '1995-01-01',
        });
      } catch (regErr: any) {
        // If register also fails (e.g. backend down), use local mock
        console.warn('Backend unavailable, using local mock session:', regErr);
        setMockUser({
          uid: 'tester-device-' + Date.now(),
          phone: '+251911000000',
          displayName: 'Test Player',
          walletBalanceSantim: 100000,
          referralCode: 'TEST' + Math.random().toString(36).substring(2, 6).toUpperCase(),
          kycStatus: 'verified',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ 
      justifyContent: 'center', 
      minHeight: '100vh', 
      gap: '2rem',
      padding: '2rem 1.5rem',
      position: 'relative'
    }}>
      {/* Theme toggle floating top-right */}
      <button 
        className="theme-toggle" 
        onClick={toggle}
        style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10 }}
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      {/* Brand Logo & Header */}
      <div style={{ textAlign: 'center', position: 'relative' }}>
        {/* Decorative background glow behind logo */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '120px',
          height: '120px',
          background: 'var(--primary-glow)',
          filter: 'blur(30px)',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 0
        }} />

        <h1 style={{ 
          fontSize: '3rem', 
          fontWeight: 900,
          fontFamily: 'var(--font-game)',
          color: 'transparent',
          background: 'linear-gradient(135deg, #ffd700 0%, #f59e0b 50%, #d97706 100%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          textShadow: '0 4px 15px rgba(245,158,11,0.25)', 
          marginBottom: '0.2rem',
          letterSpacing: '3px',
          position: 'relative',
          zIndex: 1
        }}>
          BINGO
        </h1>
        <p style={{ 
          color: 'var(--text-muted)', 
          fontSize: '0.8rem', 
          fontWeight: 700,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          position: 'relative',
          zIndex: 1
        }}>
          Ethiopia
        </p>
      </div>

      {/* Main Glassmorphic Card */}
      <div className="glass-panel" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '1.75rem', 
        width: '100%',
        padding: '2rem 1.5rem',
        borderRadius: '20px'
      }}>
        
        <h2 style={{ 
          fontSize: '1.4rem', 
          fontWeight: 700, 
          textAlign: 'center', 
          color: 'var(--text-light)',
          fontFamily: 'var(--font-sans)',
          letterSpacing: '0.5px'
        }}>
          {isRegister ? 'Create Account' : t('auth.login') || 'Welcome Back'}
        </h2>

        {error && (
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.3)', 
            color: '#fca5a5', 
            padding: '0.85rem 1rem', 
            borderRadius: '12px', 
            fontSize: '0.82rem',
            lineHeight: '1.4',
            animation: 'fadeIn 0.3s ease'
          }}>
            <span style={{ marginRight: '6px' }}>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {isRegister && (
            <div className="form-group">
              <label className="form-label" style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                Display Name
              </label>
              <input 
                type="text" 
                placeholder="Your name"
                className="input-field"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                disabled={loading}
                style={{ fontSize: '1rem' }}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
              {t('auth.phone') || 'Phone Number'}
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ 
                position: 'absolute', 
                left: '1rem', 
                color: 'var(--text-muted)', 
                fontSize: '0.95rem',
                fontWeight: 600
              }}>
                🇪🇹 +251
              </span>
              <input 
                type="tel" 
                placeholder="911223344"
                className="input-field"
                value={phoneNumber.startsWith('+251') ? phoneNumber.substring(4) : phoneNumber.startsWith('0') ? phoneNumber.substring(1) : phoneNumber}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  setPhoneNumber(raw);
                }}
                required
                disabled={loading}
                style={{ 
                  paddingLeft: '4.5rem',
                  fontSize: '1rem'
                }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
              Password
            </label>
            <input 
              type="password" 
              placeholder="Enter your password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              style={{ fontSize: '1rem' }}
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={{
              fontWeight: 700,
              fontSize: '1rem',
              height: '48px',
              borderRadius: '12px'
            }}
          >
            {loading ? 'Processing...' : isRegister ? 'Create Account' : t('auth.login') || 'Sign In'}
          </button>

          <button 
            type="button"
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#818cf8',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
              padding: '0.5rem',
            }}
          >
            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
          </button>
        </form>

        {true && (
          <div style={{ 
            marginTop: '0.5rem', 
            borderTop: '1px solid rgba(99, 102, 241, 0.15)', 
            paddingTop: '1.25rem' 
          }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={handleDevBypass} 
              disabled={loading}
              style={{ 
                borderColor: 'rgba(245, 158, 11, 0.5)', 
                color: 'var(--primary-amber)',
                background: 'rgba(245, 158, 11, 0.12)',
                fontWeight: 700,
                fontSize: '0.9rem',
                borderRadius: '12px',
                height: '48px',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              ⚡ {loading ? 'Logging in Tester...' : 'Tester 1-Click Login (Bypass Phone OTP)'}
            </button>
          </div>
        )}
      </div>

      {/* Footer text */}
      <div style={{ 
        textAlign: 'center', 
        fontSize: '0.75rem', 
        color: '#818cf8', 
        opacity: 0.8,
        lineHeight: '1.4'
      }}>
        {t('auth.acceptTerms') || 'By signing in, you agree to our Terms & Conditions and Privacy Policy'}
      </div>
    </div>
  );
}

