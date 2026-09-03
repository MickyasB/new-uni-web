import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store';
import { useTheme } from '../useTheme';
import { Button, Input, Toast } from '../components/ui';
import { Sun, Moon, UserPlus } from 'lucide-react';

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
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
    if (!dobString) return 20; // default valid
    const birthday = new Date(dobString);
    if (isNaN(birthday.getTime())) return 20;
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

    if (!displayName.trim()) {
      setError('Please enter your Full Name.');
      return;
    }

    if (dob) {
      const age = calculateAge(dob);
      if (age < 18) {
        setError(t('auth.ageCheckError') || 'You must be 18 years or older to register.');
        return;
      }
    }

    setLoading(true);
    let formattedPhone = phone.trim();
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = formattedPhone.startsWith('0') ? '+251' + formattedPhone.substring(1) : '+251' + formattedPhone;
    }

    try {
      await registerUser({
        phone: formattedPhone,
        password,
        displayName: displayName.trim(),
        dob,
        referralCode: referralCode || undefined,
      });
      navigate('/lobby');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      {/* Theme Toggle */}
      <button
        onClick={toggle}
        className="auth-theme-toggle"
        aria-label="Toggle theme"
        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Header */}
      <div className="auth-logo-section">
        <h1 style={{
          fontSize: '1.6rem',
          fontWeight: 800,
          color: 'var(--text-light)',
          fontFamily: 'var(--font-heading)',
          textAlign: 'center',
        }}>
          Create Your Account
        </h1>
        <p style={{
          color: 'var(--text-muted)',
          fontSize: '0.82rem',
          marginTop: '0.25rem',
        }}>
          Enter your name and details to join Super Bingo
        </p>
      </div>

      {/* Card */}
      <div className="auth-card">
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
            prefixNode={<span>+251</span>}
            value={phone.startsWith('+251') ? phone.substring(4) : phone.startsWith('0') ? phone.substring(1) : phone}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, '');
              setPhone(raw);
            }}
            required
            disabled={loading}
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
            label={t('auth.dob') || 'Date of Birth (Optional)'}
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
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
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            icon={<UserPlus size={18} />}
          >
            {loading ? 'Creating Profile...' : 'Complete Registration'}
          </Button>

          <Link to="/login" className="auth-toggle-link" style={{ textAlign: 'center' }}>
            Already have an account? Sign In →
          </Link>
        </form>
      </div>

      <p className="auth-footer">
        By registering, you confirm you agree to our Terms & Conditions
      </p>
    </div>
  );
}
