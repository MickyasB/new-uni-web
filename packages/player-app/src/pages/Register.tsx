import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store';
import { useTheme } from '../useTheme';

export default function Register() {
  const { t } = useTranslation();
  const { theme, toggle } = useTheme();
  const registerUser = useAppStore((s) => s.register);
  const [displayName, setDisplayName] = useState('');
  const [dob, setDob] = useState('');
  const [phone] = useState('');
  const [password] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const calculateAge = (dobString: string): number => {
    const birthday = new Date(dobString);
    if (isNaN(birthday.getTime())) return 0;
    const today = new Date();
    let age = today.getFullYear() - birthday.getFullYear();
    const m = today.getMonth() - birthday.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthday.getDate())) {
      age--;
    }
    return age;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const age = calculateAge(dob);
    if (age < 18) {
      setError(t('auth.ageCheckError') || 'You must be 18 years or older to register.');
      return;
    }

    setLoading(true);
    const deviceFingerprint = btoa(navigator.userAgent + navigator.language).substring(0, 32);

    let formattedPhone = phone.trim();
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = formattedPhone.startsWith('0') ? '+251' + formattedPhone.substring(1) : '+251' + formattedPhone;
    }

    try {
      await registerUser({
        phone: formattedPhone,
        password,
        displayName,
        dob,
        deviceFingerprint,
        referralCode: referralCode || undefined,
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ justifyContent: 'center', minHeight: '100vh', gap: '2rem', position: 'relative' }}>
      {/* Theme toggle floating top-right */}
      <button 
        className="theme-toggle" 
        onClick={toggle}
        style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10 }}
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', color: 'var(--primary-amber)', textShadow: '0 0 10px rgba(245,158,11,0.3)' }}>
          Create Profile
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
          Please complete your information
        </p>
      </div>

      <div className="glass-panel" style={{ width: '100%' }}>
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input 
              type="text" 
              placeholder="e.g. Abebe Kebede"
              className="input-field"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('auth.dob') || 'Date of Birth'}</label>
            <input 
              type="date" 
              className="input-field"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Referral Code (Optional)</label>
            <input 
              type="text" 
              placeholder="e.g. REF123"
              className="input-field"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              disabled={loading}
              maxLength={8}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Registering...' : t('auth.register') || 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
}
