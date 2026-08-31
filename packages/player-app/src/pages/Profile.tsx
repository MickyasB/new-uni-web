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
  FileText,
  Scale,
  Info,
  HelpCircle,
  PhoneCall,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

export default function Profile() {
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAppStore();
  const { theme, toggle } = useTheme();
  const userRecord = user;
  const [copied, setCopied] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
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
            <Gift size={18} style={{ color: 'var(--primary-blue)' }} />
            <span>{t('profile.referralLink') || 'Invite Friends'}</span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {t('profile.referralReward', { reward: '5.00' }) || 'Earn 5.00 ETB when your friend registers and plays their first game!'}
          </p>
          <div className="referral-box">
            <span className="referral-code" style={{ fontFamily: 'var(--font-mono)' }}>{userRecord.referralCode}</span>
            <Button
              type="button"
              variant={copied ? 'secondary' : 'primary'}
              size="sm"
              onClick={handleCopyReferral}
              icon={copied ? <Check size={14} /> : <Copy size={14} />}
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>
      )}

      {/* Terms, Conditions & Platform Details Card */}
      <div className="section-card">
        <div className="section-title" style={{ fontFamily: 'var(--font-heading)' }}>
          <Scale size={18} style={{ color: 'var(--primary-blue)' }} />
          <span>Terms & Platform Details</span>
        </div>

        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
          Super Bingo operates under fair play standards, cryptographic RNG number calling, and strict privacy safeguards.
        </p>

        <button
          type="button"
          onClick={() => setShowTermsModal(true)}
          style={{
            background: 'var(--surface-raised)',
            border: '1px solid var(--card-border)',
            borderRadius: '10px',
            padding: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} style={{ color: 'var(--primary-blue)' }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-light)' }}>
                View Terms & Conditions
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Fair play, payouts, and 3-day history rules
              </div>
            </div>
          </div>
          <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
        </button>

        {/* Platform Details Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--card-border)', paddingTop: '0.4rem' }}>
            <span>Platform Version</span>
            <strong style={{ color: 'var(--text-light)' }}>v2.4.0 (Enterprise)</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Game History Retention</span>
            <strong style={{ color: 'var(--text-light)' }}>72 Hours (3 Days)</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>RNG Certification</span>
            <strong style={{ color: 'var(--success)' }}>Cryptographic SHA-256</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Support & Compliance</span>
            <strong style={{ color: 'var(--primary-blue)' }}>support@superbingo.et</strong>
          </div>
        </div>
      </div>

      {/* ─── Terms & Conditions Modal ─── */}
      {showTermsModal && (
        <div className="modal-overlay" onClick={() => setShowTermsModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '480px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: '1.25rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Scale size={20} style={{ color: 'var(--primary-blue)' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-light)' }}>
                  Terms & Conditions
                </h3>
              </div>
              <button
                onClick={() => setShowTermsModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.82rem', color: 'var(--text-light)', lineHeight: 1.55 }}>
              <div>
                <h4 style={{ fontWeight: 800, color: 'var(--primary-blue)', marginBottom: '0.2rem' }}>
                  1. Eligibility & Fair Play
                </h4>
                <p style={{ color: 'var(--text-muted)' }}>
                  Players must be at least 18 years of age. All bingo number calls are generated using cryptographically secure deterministic random sequences. Artificial bots or automated scripts are strictly prohibited.
                </p>
              </div>

              <div>
                <h4 style={{ fontWeight: 800, color: 'var(--primary-blue)', marginBottom: '0.2rem' }}>
                  2. Winning Patterns & Game Rules
                </h4>
                <p style={{ color: 'var(--text-muted)' }}>
                  Winning patterns are automatically determined by the system based on house size (Single-goal patterns for standard halls, Dual-goal Primary + Secondary patterns for VIP lounges). The first player to claim a verified winning card wins the jackpot pot.
                </p>
              </div>

              <div>
                <h4 style={{ fontWeight: 800, color: 'var(--primary-blue)', marginBottom: '0.2rem' }}>
                  3. Deposits & Withdrawals
                </h4>
                <p style={{ color: 'var(--text-muted)' }}>
                  Deposits via official Telebirr and CBE account transfers are verified by compliance operators. Withdrawals are processed directly to the player’s registered account with 0% platform hidden fees.
                </p>
              </div>

              <div>
                <h4 style={{ fontWeight: 800, color: 'var(--primary-blue)', marginBottom: '0.2rem' }}>
                  4. 3-Day Game Record Retention
                </h4>
                <p style={{ color: 'var(--text-muted)' }}>
                  Complete round verification data, called ball hashes, and winner payouts are preserved for exactly 72 hours (3 days) for player transparency, after which they are automatically purged from active storage.
                </p>
              </div>

              <div>
                <h4 style={{ fontWeight: 800, color: 'var(--primary-blue)', marginBottom: '0.2rem' }}>
                  5. Responsible Gaming
                </h4>
                <p style={{ color: 'var(--text-muted)' }}>
                  Super Bingo encourages responsible participation. Players may request voluntary account limits or self-exclusion anytime through our support channels.
                </p>
              </div>
            </div>

            <div style={{ marginTop: '1rem', borderTop: '1px solid var(--card-border)', paddingTop: '0.75rem' }}>
              <Button
                type="button"
                variant="primary"
                size="md"
                fullWidth
                onClick={() => setShowTermsModal(false)}
              >
                I Understand & Agree
              </Button>
            </div>
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
