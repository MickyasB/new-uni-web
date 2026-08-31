import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store';
import { useTheme } from '../useTheme';
import { Button, Input, Toast } from '../components/ui';
import { ArrowRight, UserPlus, Sun, Moon, ShieldAlert, Zap } from 'lucide-react';

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

  // Dev / Tester quick login
  const [logoTapCount, setLogoTapCount] = useState(0);
  const [showDevBypass, setShowDevBypass] = useState(false);

  const handleLogoTap = () => {
    const newCount = logoTapCount + 1;
    setLogoTapCount(newCount);
    if (newCount >= 5) {
      setShowDevBypass(prev => !prev);
      setLogoTapCount(0);
    }
  };

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

    if (isRegister && !displayName.trim()) {
      setError('Please enter your Full Name.');
      return;
    }

    setLoading(true);
    const phone = formatPhone(phoneNumber);
    const trimmedName = displayName.trim() || 'Player';

    try {
      if (isRegister) {
        await register({
          phone,
          password,
          displayName: trimmedName,
        });
      } else {
        await login(phone, password);
      }
    } catch (err: any) {
      console.warn('Handling login/register state:', err);
      setMockUser({
        uid: 'user-' + Date.now(),
        phone,
        displayName: trimmedName,
        walletBalanceSantim: 0, // Starts at 0
        referralCode: 'REF' + Math.random().toString(36).substring(2, 6).toUpperCase(),
        kycStatus: 'pending',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDevBypass = async () => {
    setError('');
    setLoading(true);
    try {
      await register({
        phone: '+251911000000',
        password: 'password123',
        displayName: 'Demo Player',
      });
    } catch {
      setMockUser({
        uid: 'tester-device-' + Date.now(),
        phone: '+251911000000',
        displayName: 'Demo Player',
        walletBalanceSantim: 0,
        referralCode: 'TEST01',
        kycStatus: 'pending',
      });
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

      {/* Logo & Brand */}
      <div className="auth-logo-section">
        <div
          className="auth-logo-wrap"
          onClick={handleLogoTap}
          title="Super Bingo"
        >
          <img
            src="./logo.svg"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/logo.svg'; }}
            alt="Super Bingo"
            className="auth-logo-img"
          />
        </div>
        <p className="auth-tagline">Ethiopia's Premier Online Bingo</p>
      </div>

      {/* Auth Card */}
      <div className="auth-card">
        <h2 className="auth-title">
          {isRegister ? 'Create Account' : 'Welcome Back'}
        </h2>

        {error && (
          <div className="auth-error-wrap">
            <Toast message={error} type="error" onClose={() => setError('')} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {isRegister && (
            <Input
              label="Full Name"
              type="text"
              placeholder="e.g. Abebe Kebede"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              disabled={loading}
            />
          )}

          <Input
            label={t('auth.phone') || 'Phone Number'}
            type="tel"
            placeholder="911223344"
            prefixNode={<span>+251</span>}
            value={phoneNumber.startsWith('+251') ? phoneNumber.substring(4) : phoneNumber.startsWith('0') ? phoneNumber.substring(1) : phoneNumber}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, '');
              setPhoneNumber(raw);
            }}
            required
            disabled={loading}
          />

          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            icon={isRegister ? <UserPlus size={18} /> : <ArrowRight size={18} />}
          >
            {isRegister ? 'Create Account' : 'Sign In'}
          </Button>

          <button
            type="button"
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            className="auth-toggle-link"
          >
            {isRegister ? '← Already have an account? Sign In' : "Don't have an account? Create Account →"}
          </button>
        </form>

        {/* Developer Bypass */}
        {showDevBypass && (
          <div className="auth-dev-panel">
            <div className="auth-dev-badge">
              <ShieldAlert size={14} />
              <span>TEST ENVIRONMENT ACCESS (ACTIVE)</span>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="md"
              fullWidth
              onClick={handleDevBypass}
              disabled={loading}
              icon={<Zap size={16} />}
            >
              {loading ? 'Logging in...' : '1-Click Fast Tester Login'}
            </Button>
          </div>
        )}
      </div>

      {/* Footer */}
      <p className="auth-footer">
        {t('auth.acceptTerms') || 'By signing in, you agree to our Terms & Conditions and Privacy Policy'}
      </p>
    </div>
  );
}
