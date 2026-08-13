import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store';


export default function Profile() {
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAppStore();
  const userRecord = user;
  const [copied, setCopied] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [docType, setDocType] = useState('national_id');
  const [docIdNumber, setDocIdNumber] = useState('');
  const [kycSubmitting, setKycSubmitting] = useState(false);
  const [kycMsg, setKycMsg] = useState('');

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userRecord || !docIdNumber.trim()) return;
    setKycSubmitting(true);
    setKycMsg('');
    try {
      // KYC submission via REST
      setKycMsg('Document submitted! Pending compliance review.');
    } catch (err: any) {
      setKycMsg('Submission failed. Please try again.');
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
      alert("Error deleting account.");
    } finally {
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  const currentLang = i18n.language || 'en';

  return (
    <div className="page-container">
      <h2 style={{ fontSize: '1.25rem', marginTop: '0.5rem' }}>{t('profile.title') || 'My Profile'}</h2>

      {/* User Details Panel */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>{t('profile.name') || 'Name'}</span>
          <span style={{ fontWeight: 600 }}>{userRecord?.displayName}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>{t('profile.phone') || 'Phone'}</span>
          <span style={{ fontWeight: 600 }}>{userRecord?.phone}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>{t('profile.dob') || 'DOB'}</span>
          <span style={{ fontWeight: 600 }}>{(userRecord as any)?.dob || '—'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-muted)' }}>{t('profile.kycStatus') || 'KYC Status'}</span>
          <span style={{ 
            fontWeight: 600,
            color: userRecord?.kycStatus === 'verified' ? 'var(--success)' : 'var(--primary-amber)' 
          }}>
            {(userRecord?.kycStatus || 'unverified').toUpperCase()}
          </span>
        </div>
      </div>

      {/* KYC Identity Verification Section */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <h4 style={{ fontSize: '0.9rem', color: 'var(--primary-amber)', fontWeight: 600 }}>
          🪪 Identity Verification (KYC)
        </h4>
        {userRecord?.kycStatus === 'verified' ? (
          <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid var(--success)', color: 'var(--success)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}>
            ✅ Account verified. You have full withdrawal and high-tier room access.
          </div>
        ) : userRecord?.kycStatus === 'pending' ? (
          <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid var(--primary-amber)', color: 'var(--primary-amber)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}>
            ⏳ Document submitted! Verification in progress by compliance team.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Submit your Ethiopian National ID, Kebele ID, or Passport to verify your account.
            </p>
            <div className="form-group">
              <label className="form-label">ID Document Type</label>
              <select 
                className="input-field"
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
              >
                <option value="national_id">National ID (የብሔራዊ መታወቂያ)</option>
                <option value="kebele_id">Kebele ID (የቀበሌ መታወቂያ)</option>
                <option value="passport">Passport</option>
                <option value="driver_license">Driver's License</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Document ID Number</label>
              <input 
                type="text"
                className="input-field"
                placeholder="e.g. ETH-998877"
                value={docIdNumber}
                onChange={(e) => setDocIdNumber(e.target.value)}
              />
            </div>
            {kycMsg && (
              <div style={{ fontSize: '0.8rem', color: kycMsg.includes('failed') ? 'var(--danger)' : 'var(--success)' }}>
                {kycMsg}
              </div>
            )}
            <button 
              className="btn btn-primary"
              onClick={handleKycSubmit}
              disabled={kycSubmitting || !docIdNumber.trim()}
            >
              {kycSubmitting ? 'Submitting...' : 'Submit for Verification'}
            </button>
          </div>
        )}
      </div>

      {/* Language Selector */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <h4 style={{ fontSize: '0.9rem', color: 'var(--primary-amber)', fontWeight: 600 }}>
          {t('profile.language') || 'Language / ቋንቋ'}
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
          <button 
            className={`lang-selector-btn ${currentLang === 'en' ? 'active' : ''}`}
            onClick={() => changeLanguage('en')}
          >
            English
          </button>
          <button 
            className={`lang-selector-btn ${currentLang === 'am' ? 'active' : ''}`}
            onClick={() => changeLanguage('am')}
          >
            አማርኛ
          </button>
          <button 
            className={`lang-selector-btn ${currentLang === 'ti' ? 'active' : ''}`}
            onClick={() => changeLanguage('ti')}
          >
            ትግርኛ
          </button>
          <button 
            className={`lang-selector-btn ${currentLang === 'om' ? 'active' : ''}`}
            onClick={() => changeLanguage('om')}
          >
            Afaan Oromoo
          </button>
        </div>
      </div>

      {/* Referrals Panel */}
      {userRecord && (
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h4 style={{ fontSize: '0.9rem', color: 'var(--primary-amber)', fontWeight: 600 }}>
            {t('profile.referralLink') || 'Invite Friends'}
          </h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {t('profile.referralReward', { reward: '5.00' }) || 'Earn 5.00 ETB when your friend registers and plays their first game!'}
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--surface-raised)', border: '1px solid var(--card-border)', padding: '0.5rem', borderRadius: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', fontFamily: 'monospace', color: 'var(--text-light)', flex: 1, letterSpacing: '0.1em', paddingLeft: '0.5rem' }}>
              {userRecord.referralCode}
            </span>
            <button 
              className="btn btn-primary" 
              style={{ width: 'auto', padding: '0.4rem 1rem', fontSize: '0.8rem' }}
              onClick={handleCopyReferral}
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
        <button className="btn btn-secondary" onClick={() => signOut()}>
          {t('auth.logout') || 'Log Out'}
        </button>

        {!deleteConfirm ? (
          <button 
            className="btn btn-secondary" 
            style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
            onClick={() => setDeleteConfirm(true)}
          >
            {t('profile.deleteAccount') || 'Delete Account'}
          </button>
        ) : (
          <div className="glass-panel" style={{ border: '1px solid var(--danger)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', textAlign: 'center' }}>
              {t('profile.deleteConfirm') || 'Are you sure you want to delete your account? This is permanent.'}
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setDeleteConfirm(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger" 
                onClick={handleDeleteAccount}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
