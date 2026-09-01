import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store';
import { api } from '../api';
import { Gateway } from '@bingo/shared';
import { dbService } from '../dbService';
import { Button, Input, CurrencyDisplay, Toast } from '../components/ui';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  History,
  Smartphone,
  Building2,
  CreditCard,
  Inbox,
  Send,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  Camera,
} from 'lucide-react';

export default function Wallet() {
  const { t } = useTranslation();
  const { user, refreshUser } = useAppStore();
  const userRecord = user;

  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'transfer' | 'history'>('deposit');
  const [depositMode, setDepositMode] = useState<'direct' | 'gateway'>('direct');
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);

  // P2P Wallet Transfer State
  const [transferPhone, setTransferPhone] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState('');
  const [transferSuccess, setTransferSuccess] = useState('');
  const [recipientPreview, setRecipientPreview] = useState<{ name: string; found: boolean } | null>(null);

  // Direct Transfer & FT Verification State
  const [selectedGateway, setSelectedGateway] = useState<'telebirr' | 'cbe'>('telebirr');
  const [ftNumber, setFtNumber] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrDetectedInfo, setOcrDetectedInfo] = useState<string | null>(null);
  const [ocrConfidence, setOcrConfidence] = useState<number>(0);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Active Pending Deposit Tracker State
  const [activeDepositId, setActiveDepositId] = useState<string | null>(null);
  const [activeDepositStatus, setActiveDepositStatus] = useState<string | null>(null);
  const [activeDepositAmount, setActiveDepositAmount] = useState<number>(0);
  const [activeDepositFt, setActiveDepositFt] = useState<string>('');

  // General Loading & Error State
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositError, setDepositError] = useState('');
  const [depositSuccess, setDepositSuccess] = useState('');

  // Withdrawal state
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawGateway, setWithdrawGateway] = useState<Gateway>(Gateway.TELEBIRR);
  const [accountDetails, setAccountDetails] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  // Gateway sandbox simulator state
  const [simulatedCheckoutUrl, setSimulatedCheckoutUrl] = useState('');
  const [paymentId, setPaymentId] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Platform official transfer destinations
  const PLATFORM_ACCOUNTS = {
    telebirr: {
      phone: '0930044412',
      name: 'Miniyahil',
      badge: 'Telebirr Transfer',
    },
    cbe: {
      account: '1000787062044',
      name: 'Gym General Trading Plc',
      branch: 'CBE Account',
      badge: 'CBE Mobile / CBE Birr',
    },
  };

  // Fetch wallet history & user transaction records
  const fetchHistory = () => {
    if (userRecord?.uid) {
      const userTxns = dbService.getUserTransactions(userRecord.uid);
      setLedgerEntries(userTxns);
    } else {
      setLedgerEntries([]);
    }
  };

  useEffect(() => {
    fetchHistory();
    const unsub = dbService.subscribe(() => {
      fetchHistory();
      if (refreshUser) refreshUser();
    });
    return unsub;
  }, [activeTab, userRecord?.uid, refreshUser]);

  // Polling tracker for active pending deposit
  useEffect(() => {
    let interval: any = null;
    if (activeDepositId && activeDepositStatus === 'pending') {
      interval = setInterval(async () => {
        // Check dbService first
        const localDep = dbService.getDeposits().find(d => d.id === activeDepositId);
        if (localDep) {
          if (localDep.status === 'approved') {
            setActiveDepositStatus('approved');
            setDepositSuccess(`🎉 Deposit Approved! ${localDep.amountETB} ETB has been added to your wallet.`);
            if (refreshUser) refreshUser();
            fetchHistory();
            clearInterval(interval);
            return;
          } else if (localDep.status === 'rejected') {
            setActiveDepositStatus('rejected');
            setDepositError(`❌ Deposit Rejected: ${localDep.rejectionReason || 'Verification could not be confirmed.'}`);
            clearInterval(interval);
            return;
          }
        }

        try {
          const res = await api.getManualDepositStatus(activeDepositId);
          if (res.success && res.deposit) {
            const status = res.deposit.status;
            if (status === 'approved') {
              setActiveDepositStatus('approved');
              setDepositSuccess(`🎉 Deposit Approved! ${res.deposit.amount_etb} ETB has been added to your wallet.`);
              if (refreshUser) refreshUser();
              fetchHistory();
              clearInterval(interval);
            } else if (status === 'rejected') {
              setActiveDepositStatus('rejected');
              setDepositError(`❌ Deposit Rejected: ${res.deposit.rejection_reason || 'Verification failed'}`);
              clearInterval(interval);
            }
          }
        } catch (e) {
          // ignore poll error
        }
      }, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeDepositId, activeDepositStatus, refreshUser]);

  // Handle image upload and trigger OCR
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setReceiptImage(base64);
      setOcrLoading(true);
      setOcrDetectedInfo(null);
      setDepositError('');

      try {
        const ocrRes = await api.scanReceiptOcr(base64);
        if (ocrRes.success && ocrRes.data) {
          const { ftNumber: detectedFt, amountEtb: detectedAmt, gateway: detectedGw, confidence } = ocrRes.data;

          let infoText = '';
          if (detectedFt) {
            setFtNumber(detectedFt);
            infoText += `Detected FT: ${detectedFt}`;
          }
          if (detectedAmt && detectedAmt > 0) {
            setDepositAmount(String(detectedAmt));
            infoText += (infoText ? ' | ' : '') + `Amount: ${detectedAmt} ETB`;
          }
          if (detectedGw) {
            setSelectedGateway(detectedGw === 'cbe' ? 'cbe' : 'telebirr');
          }
          setOcrConfidence(confidence || 0);

          if (infoText) {
            setOcrDetectedInfo(`🤖 Auto-detected: ${infoText}`);
          }
        }
      } catch (err: any) {
        console.warn('OCR Scan warning:', err);
      } finally {
        setOcrLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Copy to clipboard helper
  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Submit Direct Transfer & FT verification request
  const handleManualDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepositError('');
    setDepositSuccess('');
    setDepositLoading(true);

    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) {
      setDepositError('Please enter a valid deposit amount.');
      setDepositLoading(false);
      return;
    }

    if (!ftNumber.trim()) {
      setDepositError('Please enter the FT / Transaction Reference number from your transfer receipt.');
      setDepositLoading(false);
      return;
    }

    try {
      // Save locally to dbService immediately
      if (userRecord) {
        const localDep = dbService.createDeposit({
          playerId: userRecord.uid,
          amountETB: amt,
          ftNumber: ftNumber.trim(),
          screenshotUrl: receiptImage || undefined,
        });
        setActiveDepositId(localDep.id);
        setActiveDepositStatus('pending');
        setActiveDepositAmount(amt);
        setActiveDepositFt(localDep.ftNumber);
      }

      const res = await api.submitManualDeposit({
        gateway: selectedGateway,
        ftNumber: ftNumber.trim(),
        amountEtb: amt,
        receiptImageUrl: receiptImage || undefined,
        ocrConfidence: ocrConfidence || 0,
      });

      if (res.success && res.deposit) {
        setActiveDepositId(res.deposit.id);
        setActiveDepositStatus('pending');
        setActiveDepositAmount(res.deposit.amountEtb || amt);
        setActiveDepositFt(res.deposit.ftNumber);
      }
      setDepositSuccess('Deposit request submitted! Admin will verify and credit your wallet immediately.');
    } catch {
      setDepositSuccess('Deposit request submitted! Admin will verify and credit your wallet immediately.');
    } finally {
      setDepositLoading(false);
    }
  };

  // Standard Gateway flow
  const handleGatewayDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDepositError('');
    setSimulatedCheckoutUrl('');
    setDepositLoading(true);

    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) {
      setDepositError('Please enter a valid deposit amount.');
      setDepositLoading(false);
      return;
    }

    try {
      const data = await api.deposit(amt, Gateway.CHAPA);
      if (data.success && data.checkoutUrl) {
        setSimulatedCheckoutUrl(data.checkoutUrl);
        setPaymentId(data.paymentRef);
      } else {
        throw new Error('Failed to create payment session.');
      }
    } catch (err: any) {
      setDepositError(err.message || 'Failed to create payment session.');
    } finally {
      setDepositLoading(false);
    }
  };

  // Handle Withdrawal Request
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError('');
    setWithdrawSuccess(false);
    setWithdrawLoading(true);

    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      setWithdrawError('Please enter a valid withdrawal amount.');
      setWithdrawLoading(false);
      return;
    }

    const balanceEtb = userRecord ? userRecord.walletBalanceSantim / 100 : 0;
    if (amt > balanceEtb) {
      setWithdrawError(t('errors.insufficientFunds') || 'Insufficient funds in wallet.');
      setWithdrawLoading(false);
      return;
    }

    if (!accountDetails.trim()) {
      setWithdrawError('Please provide receiving account or phone details.');
      setWithdrawLoading(false);
      return;
    }

    try {
      // Save locally to dbService
      if (userRecord) {
        const withRes = dbService.createWithdrawal({
          playerId: userRecord.uid,
          amountETB: amt,
          method: withdrawGateway,
          accountNumber: accountDetails.trim(),
        });
        if (!withRes.success) {
          throw new Error(withRes.error || 'Withdrawal failed');
        }
      }

      await api.withdraw(amt, withdrawGateway, accountDetails);
    } catch (err: any) {
      console.warn('API withdraw fallback:', err);
    } finally {
      setWithdrawSuccess(true);
      setWithdrawAmount('');
      setAccountDetails('');
      if (refreshUser) refreshUser();
      setWithdrawLoading(false);
    }
  };

  // Real-time recipient lookup on phone change
  const handleTransferPhoneChange = (val: string) => {
    setTransferPhone(val);
    setTransferError('');
    setTransferSuccess('');

    const clean = val.trim();
    if (clean.length >= 9) {
      const allUsers = dbService.getUsers();
      const match = allUsers.find(
        (u) =>
          u.phone === clean ||
          u.phone.replace(/\s+/g, '') === clean.replace(/\s+/g, '') ||
          u.phone.endsWith(clean.slice(-9))
      );
      if (match) {
        if (userRecord && match.uid === userRecord.uid) {
          setRecipientPreview({ name: 'Your Own Account (Cannot Transfer)', found: false });
        } else {
          setRecipientPreview({ name: match.displayName, found: true });
        }
      } else {
        setRecipientPreview({ name: 'No registered user found', found: false });
      }
    } else {
      setRecipientPreview(null);
    }
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError('');
    setTransferSuccess('');

    if (!userRecord) {
      setTransferError('Please sign in to transfer funds.');
      return;
    }

    const amt = parseFloat(transferAmount);
    if (isNaN(amt) || amt <= 0) {
      setTransferError('Please enter a valid transfer amount in ETB.');
      return;
    }

    const availableETB = (userRecord.walletBalanceSantim || 0) / 100;
    if (amt > availableETB) {
      setTransferError(`Insufficient funds. Your available balance is ${availableETB.toFixed(2)} ETB.`);
      return;
    }

    if (!transferPhone.trim()) {
      setTransferError('Please enter the recipient\'s phone number.');
      return;
    }

    setTransferLoading(true);

    try {
      const res = dbService.transferBalance({
        senderId: userRecord.uid,
        recipientPhone: transferPhone.trim(),
        amountETB: amt,
        note: transferNote.trim(),
      });

      if (!res.success) {
        setTransferError(res.error || 'Transfer failed. Please check recipient phone number.');
        setTransferLoading(false);
        return;
      }

      setTransferSuccess(`🎉 Successfully sent ${amt.toFixed(2)} ETB to ${res.transfer?.recipientName} (${res.transfer?.recipientPhone})!`);
      setTransferAmount('');
      setTransferPhone('');
      setTransferNote('');
      setRecipientPreview(null);
      if (refreshUser) refreshUser();
      fetchHistory();
    } catch (err: any) {
      setTransferError(err?.message || 'Transfer failed.');
    } finally {
      setTransferLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ paddingBottom: '3rem' }}>
      {/* Balance Hero Card */}
      <div className="balance-hero">
        <span className="balance-hero-label">{t('wallet.balance') || 'Available Balance'}</span>
        <div style={{ marginTop: '0.25rem' }}>
          <CurrencyDisplay santim={userRecord?.walletBalanceSantim} size="xl" variant="gold" />
        </div>
        <span className="balance-hero-sub" style={{ fontFamily: 'var(--font-mono)' }}>
          {(userRecord?.walletBalanceSantim || 0).toLocaleString()} santim
        </span>
      </div>

      {/* Tab Bar */}
      <div className="tab-bar">
        <button
          className={`tab-item ${activeTab === 'deposit' ? 'active' : ''}`}
          onClick={() => { setActiveTab('deposit'); setSimulatedCheckoutUrl(''); }}
        >
          <ArrowDownCircle size={16} />
          <span>{t('wallet.deposit') || 'Deposit'}</span>
        </button>
        <button
          className={`tab-item ${activeTab === 'withdraw' ? 'active' : ''}`}
          onClick={() => { setActiveTab('withdraw'); setSimulatedCheckoutUrl(''); }}
        >
          <ArrowUpCircle size={16} />
          <span>{t('wallet.withdraw') || 'Withdraw'}</span>
        </button>
        <button
          className={`tab-item ${activeTab === 'transfer' ? 'active' : ''}`}
          onClick={() => { setActiveTab('transfer'); setSimulatedCheckoutUrl(''); }}
        >
          <Send size={16} />
          <span>Send / P2P</span>
        </button>
        <button
          className={`tab-item ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => { setActiveTab('history'); setSimulatedCheckoutUrl(''); }}
        >
          <History size={16} />
          <span>History</span>
        </button>
      </div>

      {/* ─── TAB 1: DEPOSIT ────────────────────────────────────────────── */}
      {activeTab === 'deposit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Active Deposit Live Status Card */}
          {activeDepositStatus === 'pending' && (
            <div className="section-card" style={{ border: '1px solid rgba(229,161,0,0.5)', background: 'rgba(229,161,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ animation: 'spin 2s linear infinite', color: 'var(--primary-amber)' }}>
                  <RefreshCw size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-light)', fontWeight: 700 }}>
                    Verification Pending with Admin
                  </h4>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    FT: <strong>{activeDepositFt}</strong> · {activeDepositAmount} ETB
                  </p>
                </div>
                <span className="badge" style={{ background: 'rgba(229,161,0,0.2)', color: 'var(--primary-amber)', fontSize: '0.72rem', padding: '0.25rem 0.5rem', borderRadius: '20px' }}>
                  ⏳ Checking Telegram
                </span>
              </div>
            </div>
          )}

          {depositError && <Toast message={depositError} type="error" onClose={() => setDepositError('')} />}
          {depositSuccess && <Toast message={depositSuccess} type="success" onClose={() => setDepositSuccess('')} />}

          {/* Deposit Mode Switcher */}
          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--surface-raised)', padding: '0.35rem', borderRadius: '12px' }}>
            <button
              type="button"
              onClick={() => setDepositMode('direct')}
              style={{
                flex: 1,
                padding: '0.65rem',
                borderRadius: '8px',
                border: 'none',
                background: depositMode === 'direct' ? 'var(--primary-gradient)' : 'transparent',
                color: depositMode === 'direct' ? '#000' : 'var(--text-muted)',
                fontWeight: depositMode === 'direct' ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s',
              }}
            >
              <Smartphone size={16} />
              <span>Telebirr & CBE Transfer (Instant)</span>
            </button>
            <button
              type="button"
              onClick={() => setDepositMode('gateway')}
              style={{
                flex: 0.8,
                padding: '0.65rem',
                borderRadius: '8px',
                border: 'none',
                background: depositMode === 'gateway' ? 'var(--primary-gradient)' : 'transparent',
                color: depositMode === 'gateway' ? '#000' : 'var(--text-muted)',
                fontWeight: depositMode === 'gateway' ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s',
              }}
            >
              <CreditCard size={16} />
              <span>Online Gateway</span>
            </button>
          </div>

          {/* ─── DIRECT TRANSFER & FT CONFIRMATION FORM ─── */}
          {depositMode === 'direct' && (
            <div className="section-card">
              <div className="section-title" style={{ fontFamily: 'var(--font-heading)' }}>
                <ShieldCheck size={18} style={{ color: 'var(--primary-amber)' }} />
                <span>Step 1: Choose Method & Transfer</span>
              </div>

              {/* Gateway Selector (Telebirr vs CBE) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <button
                  type="button"
                  className={`gateway-btn ${selectedGateway === 'telebirr' ? 'active' : ''}`}
                  onClick={() => setSelectedGateway('telebirr')}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.85rem', gap: '0.35rem' }}
                >
                  <Smartphone size={24} style={{ color: '#00A859' }} />
                  <span style={{ fontWeight: 700 }}>Telebirr</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>USSD / SuperApp</span>
                </button>
                <button
                  type="button"
                  className={`gateway-btn ${selectedGateway === 'cbe' ? 'active' : ''}`}
                  onClick={() => setSelectedGateway('cbe')}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.85rem', gap: '0.35rem' }}
                >
                  <Building2 size={24} style={{ color: '#800080' }} />
                  <span style={{ fontWeight: 700 }}>CBE / CBE Birr</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>FT Transfer</span>
                </button>
              </div>

              {/* Destination Account Card */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(229,161,0,0.12), rgba(0,0,0,0.4))',
                border: '1px solid rgba(229,161,0,0.3)',
                borderRadius: '12px',
                padding: '1rem',
                marginBottom: '1.25rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--primary-amber)', fontWeight: 700, textTransform: 'uppercase' }}>
                    Official Platform {selectedGateway === 'telebirr' ? 'Telebirr' : 'CBE'} Destination
                  </span>
                  <span style={{ fontSize: '0.7rem', background: 'rgba(0,0,0,0.4)', padding: '0.15rem 0.4rem', borderRadius: '4px', color: 'var(--text-muted)' }}>
                    Verified
                  </span>
                </div>

                {selectedGateway === 'telebirr' ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-light)', fontFamily: 'var(--font-mono)' }}>
                        {PLATFORM_ACCOUNTS.telebirr.phone}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Name: {PLATFORM_ACCOUNTS.telebirr.name}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(PLATFORM_ACCOUNTS.telebirr.phone, 'phone')}
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      {copiedField === 'phone' ? <Check size={14} style={{ color: '#22c55e' }} /> : <Copy size={14} />}
                      <span>{copiedField === 'phone' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-light)', fontFamily: 'var(--font-mono)' }}>
                        {PLATFORM_ACCOUNTS.cbe.account}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {PLATFORM_ACCOUNTS.cbe.name} ({PLATFORM_ACCOUNTS.cbe.branch})
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(PLATFORM_ACCOUNTS.cbe.account, 'account')}
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      {copiedField === 'account' ? <Check size={14} style={{ color: '#22c55e' }} /> : <Copy size={14} />}
                      <span>{copiedField === 'account' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Step 2: Confirmation & OCR Form */}
              <div className="section-title" style={{ fontFamily: 'var(--font-heading)', marginTop: '0.5rem' }}>
                <Sparkles size={18} style={{ color: 'var(--primary-amber)' }} />
                <span>Step 2: Upload Receipt & Confirm</span>
              </div>

              <form onSubmit={handleManualDepositSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Screenshot Upload Dropzone */}
                <div>
                  <label className="input-label">Payment Screenshot (Auto-extracts FT Number)</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  {!receiptImage ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        border: '2px dashed var(--card-border)',
                        borderRadius: '12px',
                        padding: '1.5rem 1rem',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: 'var(--surface-raised)',
                        transition: 'all 0.2s',
                      }}
                    >
                      <Camera size={28} style={{ color: 'var(--primary-amber)', marginBottom: '0.5rem', opacity: 0.8 }} />
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-light)' }}>
                        Tap to Upload or Take Photo of Receipt
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Supports CBE & Telebirr screenshot images
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                      background: 'var(--surface-raised)',
                      padding: '0.75rem',
                      borderRadius: '12px',
                      border: '1px solid var(--card-border)',
                    }}>
                      <img
                        src={receiptImage}
                        alt="Receipt"
                        style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '8px' }}
                      />
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-light)' }}>
                          Receipt Image Loaded
                        </div>
                        {ocrLoading ? (
                          <div style={{ fontSize: '0.72rem', color: 'var(--primary-amber)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                            <RefreshCw size={12} style={{ animation: 'spin 1.5s linear infinite' }} />
                            <span>Scanning FT Number & Amount...</span>
                          </div>
                        ) : ocrDetectedInfo ? (
                          <div style={{ fontSize: '0.72rem', color: '#22c55e', marginTop: '0.2rem' }}>
                            {ocrDetectedInfo}
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            Ready for verification
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setReceiptImage(null);
                          setOcrDetectedInfo(null);
                        }}
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Change
                      </button>
                    </div>
                  )}
                </div>

                {/* FT / Transaction Reference Input */}
                <div>
                  <Input
                    label={selectedGateway === 'cbe' ? 'CBE FT Number' : 'Telebirr Transaction / Receipt ID'}
                    type="text"
                    placeholder={selectedGateway === 'cbe' ? 'e.g. FT240825129841' : 'e.g. CI1209384938 or 202408...'}
                    value={ftNumber}
                    onChange={(e) => setFtNumber(e.target.value.toUpperCase())}
                    required
                    disabled={depositLoading}
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                    💡 Tip: Check your transfer SMS or receipt screen for the FT/Transaction ID.
                  </span>
                </div>

                {/* Amount Field */}
                <div>
                  <Input
                    label="Amount Transferred (ETB)"
                    type="number"
                    placeholder="e.g. 100"
                    min="1"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    required
                    disabled={depositLoading}
                  />
                  <div className="quick-amounts-bar">
                    {[25, 50, 100, 200, 500, 1000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setDepositAmount(String(amt))}
                        disabled={depositLoading}
                        className={`quick-amount-btn ${depositAmount === String(amt) ? 'selected' : ''}`}
                      >
                        {amt} ETB
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={depositLoading}
                  icon={<Send size={16} />}
                >
                  Submit Deposit for Instant Approval
                </Button>
              </form>
            </div>
          )}

          {/* ─── ONLINE GATEWAY FLOW (CHAPA / WEBIRR) ─── */}
          {depositMode === 'gateway' && !simulatedCheckoutUrl && (
            <div className="section-card">
              <div className="section-title" style={{ fontFamily: 'var(--font-heading)' }}>
                <CreditCard size={18} style={{ color: 'var(--primary-amber)' }} />
                <span>Online Card / Bank Checkout</span>
              </div>
              <form onSubmit={handleGatewayDepositSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <Input
                  label="Amount (ETB)"
                  type="number"
                  placeholder="e.g. 100"
                  min="1"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  required
                  disabled={depositLoading}
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={depositLoading}
                  icon={<Send size={16} />}
                >
                  Proceed to Online Checkout
                </Button>
              </form>
            </div>
          )}

          {depositMode === 'gateway' && simulatedCheckoutUrl && (
            <div className="section-card" style={{ borderColor: 'rgba(229,161,0,0.4)', borderStyle: 'dashed' }}>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-light)', fontWeight: 700 }}>
                  Sandbox Gateway Simulation
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Ref: {paymentId} · {depositAmount} ETB
                </p>
              </div>
              <Button
                type="button"
                variant="primary"
                size="md"
                fullWidth
                onClick={() => {
                  setSimulatedCheckoutUrl('');
                  setActiveTab('history');
                  if (refreshUser) refreshUser();
                }}
              >
                Simulate Successful Payment
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: WITHDRAWAL ─────────────────────────────────────────── */}
      {activeTab === 'withdraw' && (
        <div className="section-card">
          <div className="section-title" style={{ fontFamily: 'var(--font-heading)' }}>
            <ArrowUpCircle size={18} style={{ color: 'var(--primary-amber)' }} />
            <span>Request Withdrawal</span>
          </div>
          <form onSubmit={handleWithdrawSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {withdrawError && <Toast message={withdrawError} type="error" onClose={() => setWithdrawError('')} />}
            {withdrawSuccess && (
              <Toast message="Withdrawal submitted! Waiting for operator approval." type="success" onClose={() => setWithdrawSuccess(false)} />
            )}

            <Input
              label="Amount (ETB)"
              type="number"
              placeholder="e.g. 50"
              min="1"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              required
              disabled={withdrawLoading}
            />

            <div className="input-field-group">
              <label className="input-label">Payout Method</label>
              <div className="gateway-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <button
                  key="telebirr"
                  type="button"
                  className={`gateway-btn ${withdrawGateway === Gateway.TELEBIRR ? 'active' : ''}`}
                  onClick={() => setWithdrawGateway(Gateway.TELEBIRR)}
                  disabled={withdrawLoading}
                >
                  <Smartphone size={18} />
                  <span>Telebirr</span>
                </button>
                <button
                  key="cbe"
                  type="button"
                  className={`gateway-btn ${withdrawGateway === Gateway.CBE ? 'active' : ''}`}
                  onClick={() => setWithdrawGateway(Gateway.CBE)}
                  disabled={withdrawLoading}
                >
                  <Building2 size={18} />
                  <span>CBE Account</span>
                </button>
              </div>
            </div>

            <Input
              label="Account Details"
              type="text"
              placeholder={withdrawGateway === Gateway.TELEBIRR ? 'e.g. 0911223344' : 'e.g. 1000123456789'}
              value={accountDetails}
              onChange={(e) => setAccountDetails(e.target.value)}
              required
              disabled={withdrawLoading}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={withdrawLoading}
              icon={<Send size={16} />}
            >
              Request Payout
            </Button>
          </form>
        </div>
      )}

      {/* ─── TAB 3: P2P WALLET TRANSFER (SEND/RECEIVE BY PHONE) ─────────── */}
      {activeTab === 'transfer' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {transferError && <Toast message={transferError} type="error" onClose={() => setTransferError('')} />}
          {transferSuccess && <Toast message={transferSuccess} type="success" onClose={() => setTransferSuccess('')} />}

          <div className="section-card">
            <div className="section-title" style={{ fontFamily: 'var(--font-heading)' }}>
              <Send size={18} style={{ color: 'var(--primary-blue)' }} />
              <span>Send Balance to Player (P2P)</span>
            </div>

            <div
              style={{
                background: 'rgba(37, 99, 235, 0.08)',
                border: '1px solid rgba(37, 99, 235, 0.25)',
                borderRadius: '12px',
                padding: '0.75rem 0.9rem',
                fontSize: '0.82rem',
                color: 'var(--text-light)',
                lineHeight: 1.45,
              }}
            >
              <div style={{ fontWeight: 800, color: 'var(--primary-blue)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Sparkles size={14} /> Instant 0% Fee P2P Transfer
              </div>
              Send balance directly to friends or fellow players by entering their registered phone number. Funds are transferred instantly.
            </div>

            <form onSubmit={handleTransferSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
              {/* Recipient Phone */}
              <div>
                <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Recipient Phone Number</span>
                  {recipientPreview && (
                    <span
                      style={{
                        fontWeight: 800,
                        fontSize: '0.74rem',
                        color: recipientPreview.found ? '#10B981' : '#F59E0B',
                      }}
                    >
                      {recipientPreview.found ? `✓ ${recipientPreview.name}` : `⚠ ${recipientPreview.name}`}
                    </span>
                  )}
                </label>
                <div style={{ position: 'relative' }}>
                  <Input
                    type="tel"
                    placeholder="e.g. 0911223344 or +251911223344"
                    value={transferPhone}
                    onChange={(e) => handleTransferPhoneChange(e.target.value)}
                    required
                    disabled={transferLoading}
                  />
                </div>
              </div>

              {/* Amount in ETB */}
              <div>
                <label className="input-label">
                  Transfer Amount (ETB)
                </label>
                <Input
                  type="number"
                  min="1"
                  step="any"
                  placeholder="0.00"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  required
                  disabled={transferLoading}
                />

                {/* Quick Presets */}
                <div className="quick-amounts-bar">
                  {[25, 50, 100, 250, 500].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className={`quick-amount-btn ${transferAmount === String(preset) ? 'selected' : ''}`}
                      onClick={() => setTransferAmount(String(preset))}
                    >
                      +{preset}
                    </button>
                  ))}
                  {userRecord && userRecord.walletBalanceSantim > 0 && (
                    <button
                      type="button"
                      className="quick-amount-btn"
                      style={{ borderColor: 'var(--primary-blue)', color: 'var(--primary-blue)' }}
                      onClick={() => setTransferAmount(String(Math.floor(userRecord.walletBalanceSantim / 100)))}
                    >
                      Max
                    </button>
                  )}
                </div>
              </div>

              {/* Optional Note */}
              <div>
                <label className="input-label">
                  Note / Message (Optional)
                </label>
                <Input
                  type="text"
                  placeholder="e.g. For Bingo cards, thanks!"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  disabled={transferLoading}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={transferLoading}
                disabled={transferLoading || !transferPhone.trim() || !transferAmount}
                icon={<Send size={16} />}
              >
                {transferAmount && parseFloat(transferAmount) > 0
                  ? `Send ${parseFloat(transferAmount).toFixed(2)} ETB`
                  : 'Send Funds'}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* ─── TAB 4: TRANSACTION HISTORY ─────────────────────────────────── */}
      {activeTab === 'history' && (
        <div className="section-card" style={{ maxHeight: '520px', overflowY: 'auto' }}>
          <div className="section-title" style={{ fontFamily: 'var(--font-heading)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <History size={18} style={{ color: 'var(--primary-blue)' }} />
              <span>Transaction History</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {ledgerEntries.length} Record{ledgerEntries.length !== 1 ? 's' : ''}
            </span>
          </div>

          {ledgerEntries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
              <Inbox size={36} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
              <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>No transactions yet</p>
              <p style={{ fontSize: '0.75rem', marginTop: '0.2rem' }}>Make a deposit or request a withdrawal to see live records here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {ledgerEntries.map((entry) => {
                const isDeposit = entry.type === 'deposit';
                const isWithdrawal = entry.type === 'withdrawal';
                const isTransferOut = entry.type === 'transfer_out';
                const isTransferIn = entry.type === 'transfer_in';
                const isPositive = isDeposit || isTransferIn;

                const isApproved = entry.status === 'approved' || entry.status === 'completed';
                const isPending = entry.status === 'pending';
                const isRejected = entry.status === 'rejected';
                
                const amountETB = entry.amountETB || (entry.amount_santim ? entry.amount_santim / 100 : 0);
                const dateStr = new Date(entry.createdAt || entry.created_at || Date.now()).toLocaleString();

                const getTypeTitle = () => {
                  if (isDeposit) return 'Deposit';
                  if (isWithdrawal) return 'Withdrawal';
                  if (isTransferOut) return 'Sent to Player';
                  if (isTransferIn) return 'Received from Player';
                  return entry.type;
                };

                return (
                  <div
                    key={entry.id}
                    style={{
                      background: 'var(--surface-raised)',
                      border: '1px solid var(--card-border)',
                      borderRadius: '12px',
                      padding: '0.85rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.45rem',
                    }}
                  >
                    {/* Header Row: Type, Status Badge & Amount */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: isPositive ? 'rgba(37, 99, 235, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: isPositive ? 'var(--primary-blue)' : 'var(--danger)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {isPositive ? <ArrowDownCircle size={16} /> : <ArrowUpCircle size={16} />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-light)' }}>
                            {getTypeTitle()}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {entry.method || (isDeposit ? 'Telebirr / CBE' : isWithdrawal ? 'Payout' : 'P2P Transfer')}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div
                          style={{
                            fontWeight: 900,
                            fontSize: '0.95rem',
                            color: isPositive ? 'var(--primary-blue)' : 'var(--text-light)',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          {isPositive ? '+' : '-'}{amountETB.toFixed(2)} ETB
                        </div>
                        
                        {/* Status Badge */}
                        <div style={{ marginTop: '0.15rem' }}>
                          {isPending && (
                            <span
                              style={{
                                background: '#FEF3C7',
                                color: '#92400E',
                                padding: '2px 7px',
                                borderRadius: '6px',
                                fontSize: '0.66rem',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.03rem',
                              }}
                            >
                              ⏳ Pending Review
                            </span>
                          )}
                          {isApproved && (
                            <span
                              style={{
                                background: '#D1FAE5',
                                color: '#065F46',
                                padding: '2px 7px',
                                borderRadius: '6px',
                                fontSize: '0.66rem',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.03rem',
                              }}
                            >
                              ✓ {entry.status === 'completed' ? 'Completed' : 'Approved'}
                            </span>
                          )}
                          {isRejected && (
                            <span
                              style={{
                                background: '#FEE2E2',
                                color: '#991B1B',
                                padding: '2px 7px',
                                borderRadius: '6px',
                                fontSize: '0.66rem',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.03rem',
                              }}
                            >
                              ✕ Rejected
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Reference & Date Strip */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.73rem',
                        color: 'var(--text-muted)',
                        borderTop: '1px solid var(--card-border)',
                        paddingTop: '0.4rem',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      <span>Ref / Info: {entry.reference || entry.id}</span>
                      <span>{dateStr}</span>
                    </div>

                    {/* Rejection Note if rejected */}
                    {isRejected && entry.rejectionReason && (
                      <div
                        style={{
                          background: 'rgba(239, 68, 68, 0.08)',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          padding: '0.4rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          color: 'var(--danger)',
                          fontWeight: 500,
                        }}
                      >
                        Note: {entry.rejectionReason}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
