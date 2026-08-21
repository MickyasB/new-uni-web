import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store';
import { useTheme } from '../useTheme';
import { Button, Input, Toast } from '../components/ui';

export default function Register() {
  const { t } = useTranslation();
  const { theme, toggle } = useTheme();
  const registerUser = useAppStore((s) => s.register);
  const [displayName, setDisplayName] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="auth-page-container">
      {/* ── Theme Toggle ── */}
      <button
        onClick={toggle}
        className="theme-toggle"
        style={{
          position: 'absolute',
          top: '1.25rem',
          right: '1.25rem',
          zIndex: 20,
        }}
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      {/* ── Logo & Title Section ── */}
      <div style={{ textAlign: 'center', marginBottom: '1.25rem', zIndex: 10 }}>
        <svg
          width="64"
          height="64"
          viewBox="0 0 160 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ filter: 'drop-shadow(0 6px 16px var(--primary-glow))' }}
        >
          <circle cx="80" cy="80" r="74" fill="url(#rg-dark)" stroke="url(#rg-gold)" strokeWidth="5" />
          <circle cx="80" cy="80" r="62" fill="url(#rg-crimson)" />
          <ellipse cx="80" cy="52" rx="35" ry="15" fill="url(#rg-shine)" />
          <circle cx="80" cy="80" r="50" stroke="url(#rg-gold)" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.5" />
          <text x="80" y="70" textAnchor="middle" fill="#fff" fontFamily="'Inter', sans-serif" fontWeight="900" fontSize="22" letterSpacing="3">GYM</text>
          <rect x="32" y="78" width="96" height="24" rx="12" fill="url(#rg-gold)" />
          <text x="80" y="95" textAnchor="middle" fill="#1a0a2e" fontFamily="'Inter', sans-serif" fontWeight="900" fontSize="14" letterSpacing="2">BINGO</text>
          <defs>
            <radialGradient id="rg-dark" cx="0.5" cy="0.5" r="0.5"><stop offset="0%" stopColor="#1a1530" /><stop offset="100%" stopColor="#0a0815" /></radialGradient>
            <linearGradient id="rg-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#ffd700" /><stop offset="100%" stopColor="#ff8c00" /></linearGradient>
            <radialGradient id="rg-crimson" cx="0.4" cy="0.35" r="0.65"><stop offset="0%" stopColor="#e74c5a" /><stop offset="50%" stopColor="#b91c2c" /><stop offset="100%" stopColor="#7f1d2d" /></radialGradient>
            <radialGradient id="rg-shine" cx="0.5" cy="0.5" r="0.5"><stop offset="0%" stopColor="#fff" stopOpacity="0.2" /><stop offset="100%" stopColor="#fff" stopOpacity="0" /></radialGradient>
          </defs>
        </svg>

        <h1 style={{
          fontSize: '1.75rem',
          fontWeight: 900,
          letterSpacing: '0.03em',
          marginTop: '0.4rem',
          background: 'linear-gradient(135deg, #ffd700 0%, #ffaa00 50%, #ff8c00 100%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          lineHeight: 1.1,
          fontFamily: 'var(--font-game)',
        }}>
          Complete Your Profile
        </h1>
        <p style={{
          color: 'var(--text-muted)',
          fontSize: '0.75rem',
          fontWeight: 500,
          marginTop: '0.25rem',
        }}>
          Just a few details to get started
        </p>
      </div>

      {/* ── Main Registration Card ── */}
      <div className="auth-card">
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {error && (
            <Toast message={error} type="error" onClose={() => setError('')} />
          )}

          <Input
            label="Full Name"
            type="text"
            placeholder="e.g. Abebe Kebede"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            disabled={loading}
          />

          <Input
            label={t('auth.phone') || 'Phone Number'}
            type="tel"
            placeholder="911223344"
            prefixNode={<span>🇪🇹 +251</span>}
            value={phone.startsWith('+251') ? phone.substring(4) : phone.startsWith('0') ? phone.substring(1) : phone}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, '');
              setPhone(raw);
            }}
            required
            disabled={loading}
          />

          <Input
            label={t('auth.dob') || 'Date of Birth'}
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            required
            disabled={loading}
            helperText="Must be 18 years or older"
          />

          <Input
            label="Password"
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />

          <Input
            label="Referral Code (Optional)"
            type="text"
            placeholder="e.g. REF123"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
            disabled={loading}
            maxLength={8}
          />

          <Button
            type="submit"
            variant="gold"
            size="lg"
            fullWidth
            loading={loading}
          >
            {loading ? 'Creating Profile...' : '✨ Complete Registration'}
          </Button>
        </form>
      </div>

      {/* ── Footer ── */}
      <p style={{
        textAlign: 'center',
        fontSize: '0.7rem',
        color: 'var(--text-muted)',
        marginTop: '1.25rem',
        lineHeight: 1.5,
        maxWidth: '300px',
        zIndex: 10,
      }}>
        By registering, you confirm you are 18+ and agree to our Terms & Conditions
      </p>
    </div>
  );
}
