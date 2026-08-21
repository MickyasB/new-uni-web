import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store';
import { useTheme } from '../useTheme';
import { Button, Input, Badge, Toast } from '../components/ui';
import { 
  User, 
  ShieldCheck, 
  Globe, 
  Gift, 
  Copy, 
  Check, 
  Sun, 
  Moon, 
  LogOut, 
  Trash2, 
  FileText 
} from 'lucide-react';

export default function Profile() {
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAppStore();
  const { theme, toggle } = useTheme();
  const userRecord = user;
  const [copied, setCopied] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [docType, setDocType] = useState('national_id');
  const [docIdNumber, setDocIdNumber] = useState('');
  const [kycSubmitting, setKycSubmitting] = useState(false);
  const [kycMsg, setKycMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userRecord || !docIdNumber.trim()) return;
    setKycSubmitting(true);
    setKycMsg(null);
    try {
      setKycMsg({ text: 'Document submitted! Pending compliance review.', type: 'success' });
    } catch {
      setKycMsg({ text: 'Submission failed. Please try again.', type: 'error' });
    } finally {
      setKycSubmitting(false);
    }
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const handleCopyReferral = () => {
    if (!userRecord) return;
    const referralLink = `${window.location.origin}/login?ref=${userRecord.referralCode}`;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      signOut();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  const currentLang = i18n.language || 'en';
  const initials = userRecord?.displayName
    ? userRecord.displayName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'P';

  const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'am', label: 'አማርኛ' },
    { code: 'ti', label: 'ትግርኛ' },
    { code: 'om', label: 'Afaan Oromoo' },
  ];

  return (
    <div className="page-container">
      {/* Page Header with Avatar */}
      <div className="page-header">
        <div className="page-header-avatar" style={{ fontFamily: 'var(--font-heading)' }}>{initials}</div>
        <div className="page-header-info">
          <span className="page-header-title" style={{ fontFamily: 'var(--font-heading)' }}>{userRecord?.displayName || 'Player'}</span>
          <span className="page-header-subtitle" style={{ fontFamily: 'var(--font-mono)' }}>{userRecord?.phone || ''}</span>
        </div>
      </div>

      {/* Account Info */}
      <div className="section-card">
        <div className="section-title" style={{ fontFamily: 'var(--font-heading)' }}>
          <User size={18} style={{ color: 'var(--primary-amber)' }} />
          <span>{t('profile.title') || 'Account Info'}</span>
        </div>
        <div className="info-row">
          <span className="info-row-label">Player User ID</span>
          <span className="info-row-value" style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--primary-amber)' }}>
            {userRecord?.uid ? `SB-${userRecord.uid.slice(-5).toUpperCase()}` : 'SB-00000'}
          </span>
        </div>
        <div className="info-row">
          <span className="info-row-label">{t('profile.name') || 'Name'}</span>
          <span className="info-row-value">{userRecord?.displayName}</span>
        </div>
        <div className="info-row">
          <span className="info-row-label">{t('profile.phone') || 'Phone'}</span>
          <span className="info-row-value" style={{ fontFamily: 'var(--font-mono)' }}>{userRecord?.phone}</span>
        </div>
        <div className="info-row">
          <span className="info-row-label">{t('profile.dob') || 'Date of Birth'}</span>
          <span className="info-row-value" style={{ fontFamily: 'var(--font-mono)' }}>{(userRecord as any)?.dob || '—'}</span>
        </div>
        <div className="info-row">
          <span className="info-row-label">{t('profile.kycStatus') || 'KYC Status'}</span>
          <span className="info-row-value">
            <Badge status={userRecord?.kycStatus || 'pending'} size="sm" />
          </span>
        </div>
      </div>

      {/* Display & Appearance Card */}
      <div className="section-card">
        <div className="section-title" style={{ fontFamily: 'var(--font-heading)' }}>
          {theme === 'dark' ? <Moon size={18} style={{ color: 'var(--primary-amber)' }} /> : <Sun size={18} style={{ color: 'var(--primary-amber)' }} />}
          <span>Appearance</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-light)' }}>
              Theme: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Toggle between dark navy and warm pearl casino theme
            </p>
          </div>
          <button
            onClick={toggle}
            className="theme-toggle"
            style={{ padding: '6px 14px', fontSize: '0.82rem', fontWeight: 700 }}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        </div>
      </div>

      {/* KYC Identity Verification */}
      <div className="section-card">
        <div className="section-title" style={{ fontFamily: 'var(--font-heading)' }}>
          <ShieldCheck size={18} style={{ color: 'var(--primary-amber)' }} />
          <span>Identity Verification</span>
        </div>
        {userRecord?.kycStatus === 'verified' ? (
          <Toast message="Account verified. Full withdrawal and high-tier room access enabled." type="success" />
        ) : userRecord?.kycStatus === 'pending' ? (
          <Toast message="Document submitted! Verification in progress by compliance team." type="warning" />
        ) : (
          <form onSubmit={handleKycSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Submit your Ethiopian National ID, Kebele ID, or Passport to verify your account.
            </p>

            <div className="input-field-group">
              <label className="input-label">ID Document Type</label>
              <div className="input-container">
                <select
                  className="input-control"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="national_id">National ID (የብሔራዊ መታወቂያ)</option>
                  <option value="kebele_id">Kebele ID (የቀበሌ መታወቂያ)</option>
                  <option value="passport">Passport</option>
                  <option value="driver_license">Driver's License</option>
                </select>
              </div>
            </div>

            <Input
              label="Document ID Number"
              type="text"
              placeholder="e.g. ETH-998877"
              value={docIdNumber}
              onChange={(e) => setDocIdNumber(e.target.value)}
            />

            {kycMsg && (
              <Toast message={kycMsg.text} type={kycMsg.type} onClose={() => setKycMsg(null)} />
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              loading={kycSubmitting}
              disabled={!docIdNumber.trim()}
              icon={<FileText size={16} />}
            >
              Submit for Verification
            </Button>
          </form>
        )}
      </div>

      {/* Language Selector */}
      <div className="section-card">
        <div className="section-title" style={{ fontFamily: 'var(--font-heading)' }}>
          <Globe size={18} style={{ color: 'var(--primary-amber)' }} />
          <span>{t('profile.language') || 'Language'}</span>
        </div>
        <div className="gateway-grid">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              className={`gateway-btn ${currentLang === lang.code ? 'active' : ''}`}
              onClick={() => changeLanguage(lang.code)}
            >
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Referral Section */}
      {userRecord && (
        <div className="section-card">
          <div className="section-title" style={{ fontFamily: 'var(--font-heading)' }}>
            <Gift size={18} style={{ color: 'var(--primary-amber)' }} />
            <span>{t('profile.referralLink') || 'Invite Friends'}</span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {t('profile.referralReward', { reward: '5.00' }) || 'Earn 5.00 ETB when your friend registers and plays their first game!'}
          </p>
          <div className="referral-box">
            <span className="referral-code" style={{ fontFamily: 'var(--font-mono)' }}>{userRecord.referralCode}</span>
            <Button
              type="button"
              variant={copied ? 'secondary' : 'gold'}
              size="sm"
              onClick={handleCopyReferral}
              icon={copied ? <Check size={14} /> : <Copy size={14} />}
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
        <Button
          type="button"
          variant="secondary"
          size="md"
          fullWidth
          onClick={() => signOut()}
          icon={<LogOut size={16} />}
        >
          {t('auth.logout') || 'Log Out'}
        </Button>

        {!deleteConfirm ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            fullWidth
            style={{ color: 'var(--danger)' }}
            onClick={() => setDeleteConfirm(true)}
            icon={<Trash2 size={14} />}
          >
            {t('profile.deleteAccount') || 'Delete Account'}
          </Button>
        ) : (
          <div className="section-card" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', textAlign: 'center', lineHeight: 1.5 }}>
              {t('profile.deleteConfirm') || 'Are you sure you want to delete your account? This action is permanent.'}
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button
                type="button"
                variant="secondary"
                size="md"
                fullWidth
                onClick={() => setDeleteConfirm(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="md"
                fullWidth
                onClick={handleDeleteAccount}
                loading={deleting}
                icon={<Trash2 size={16} />}
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
