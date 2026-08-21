import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store';
import { api } from '../api';
import { Gateway } from '@bingo/shared';
import { Button, Input, CurrencyDisplay, Toast } from '../components/ui';
import { ArrowDownCircle, ArrowUpCircle, History, Smartphone, Building2, CreditCard, Globe, CheckCircle2, XCircle, Inbox, Send } from 'lucide-react';

export default function Wallet() {
  const { t } = useTranslation();
  const { user, refreshUser } = useAppStore();
  const userRecord = user;
  
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'history'>('deposit');
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  
  // Deposit state
  const [depositAmount, setDepositAmount] = useState('');
  const [depositGateway, setDepositGateway] = useState<Gateway>(Gateway.CHAPA);
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositError, setDepositError] = useState('');
  const [simulatedCheckoutUrl, setSimulatedCheckoutUrl] = useState('');
  const [paymentId, setPaymentId] = useState('');

  // Withdrawal state
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawGateway, setWithdrawGateway] = useState<Gateway>(Gateway.TELEBIRR);
  const [accountDetails, setAccountDetails] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  // Fetch wallet history via REST
  const fetchHistory = async () => {
    try {
      const data = await api.getWalletHistory();
      setLedgerEntries(data.entries || []);
    } catch (err) {
      console.error('Failed to load wallet history:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [activeTab]);

  const handleDepositSubmit = async (e: React.FormEvent) => {
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
      const data = await api.deposit(amt, depositGateway);
      if (data.success && data.checkoutUrl) {
        setSimulatedCheckoutUrl(data.checkoutUrl);
        setPaymentId(data.paymentRef);
      } else {
        throw new Error('Failed to create deposit request.');
      }
    } catch (err: any) {
      console.error(err);
      setDepositError(err.message || 'Failed to process deposit request.');
    } finally {
      setDepositLoading(false);
    }
  };

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
      const data = await api.withdraw(amt, withdrawGateway, accountDetails);
      if (data.success) {
        setWithdrawSuccess(true);
        setWithdrawAmount('');
        setAccountDetails('');
        if (refreshUser) refreshUser();
      } else {
        throw new Error('Withdrawal request failed.');
      }
    } catch (err: any) {
      console.error(err);
      setWithdrawError(err.message || 'Failed to request withdrawal.');
    } finally {
      setWithdrawLoading(false);
    }
  };

  // Simulated gateway sandbox completion
  const handleSimulatePaymentOutcome = async (outcome: 'success' | 'fail') => {
    setDepositLoading(true);
    try {
      const API_BASE = import.meta.env.VITE_API_URL || '/api';
      const webhookUrl = `${API_BASE}/wallet/webhooks/${depositGateway}`;
      
      const payload: Record<string, any> = {
        tx_ref: paymentId,
        outTradeNo: paymentId,
        paymentId: paymentId,
        referenceNumber: paymentId,
        amount: depositAmount,
        totalAmount: depositAmount,
        meta: { userId: user?.uid },
        customization: { userId: user?.uid },
        userId: user?.uid,
        msisdn: user?.phone,
        status: outcome === 'success' ? 'success' : 'failed',
        tradeStatus: outcome === 'success' ? 'SUCCESS' : 'FAILED',
        transactionStatus: outcome === 'success' ? 'COMPLETED' : 'FAILED',
        currency: 'ETB',
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setSimulatedCheckoutUrl('');
        setDepositAmount('');
        setActiveTab('history');
        if (refreshUser) refreshUser();
        fetchHistory();
      } else {
        const text = await response.text();
        throw new Error(text || 'Simulation webhook request failed.');
      }
    } catch (err: any) {
      setDepositError(`Webhook simulation error: ${err.message}`);
    } finally {
      setDepositLoading(false);
    }
  };

  const formatLedgerType = (type: string) => {
    switch (type) {
      case 'deposit': return 'Deposit';
      case 'withdrawal': return 'Withdrawal';
      case 'win': return 'Prize Winnings';
      case 'bonus': return 'Bonus';
      case 'entry_fee': return 'Card Purchase';
      case 'house_cut': return 'Commission';
      default: return type;
    }
  };

  const GATEWAYS_DEPOSIT = [
    { value: Gateway.CHAPA, label: 'Chapa', icon: <CreditCard size={18} /> },
    { value: Gateway.TELEBIRR, label: 'Telebirr', icon: <Smartphone size={18} /> },
    { value: Gateway.WEBIRR, label: 'WeBirr', icon: <Globe size={18} /> },
    { value: Gateway.CBE, label: 'CBE Birr', icon: <Building2 size={18} /> },
  ];

  const GATEWAYS_WITHDRAW = [
    { value: Gateway.TELEBIRR, label: 'Telebirr', icon: <Smartphone size={18} /> },
    { value: Gateway.CBE, label: 'CBE Account', icon: <Building2 size={18} /> },
  ];

  return (
    <div className="page-container">
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
          className={`tab-item ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => { setActiveTab('history'); setSimulatedCheckoutUrl(''); }}
        >
          <History size={16} />
          <span>History</span>
        </button>
      </div>

      {/* Deposit Form */}
      {activeTab === 'deposit' && !simulatedCheckoutUrl && (
        <div className="section-card">
          <div className="section-title" style={{ fontFamily: 'var(--font-heading)' }}>
            <ArrowDownCircle size={18} style={{ color: 'var(--primary-amber)' }} />
            <span>Deposit Funds</span>
          </div>
          <form onSubmit={handleDepositSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {depositError && (
              <Toast message={depositError} type="error" onClose={() => setDepositError('')} />
            )}

            <div>
              <Input
                label={t('wallet.amountEtb') || 'Amount (ETB)'}
                type="number"
                placeholder="Enter amount (e.g. 100)"
                min="1"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                required
                disabled={depositLoading}
              />
              <div className="quick-amounts-bar">
                {[25, 50, 100, 200, 500].map((amt) => (
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

            <div className="input-field-group">
              <label className="input-label">{t('wallet.chooseGateway') || 'Payment Gateway'}</label>
              <div className="gateway-grid">
                {GATEWAYS_DEPOSIT.map((gw) => (
                  <button
                    key={gw.value}
                    type="button"
                    className={`gateway-btn ${depositGateway === gw.value ? 'active' : ''}`}
                    onClick={() => setDepositGateway(gw.value)}
                    disabled={depositLoading}
                  >
                    <span className="gateway-icon">{gw.icon}</span>
                    <span>{gw.label}</span>
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
              Proceed to Payment
            </Button>
          </form>
        </div>
      )}

      {/* Sandbox Payment Simulator */}
      {activeTab === 'deposit' && simulatedCheckoutUrl && (
        <div className="section-card" style={{ borderColor: 'rgba(229,161,0,0.4)', borderStyle: 'dashed' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(229,161,0,0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-amber)', marginBottom: '0.4rem' }}>
              <CreditCard size={22} />
            </div>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-light)', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
              Sandbox Payment Gateway
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Simulate response for <strong>{depositGateway.toUpperCase()}</strong>
            </p>
          </div>

          <div style={{
            background: 'var(--surface-raised)',
            padding: '0.85rem',
            borderRadius: '12px',
            fontSize: '0.82rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
            border: '1px solid var(--card-border)',
          }}>
            <div><strong style={{ color: 'var(--text-light)' }}>TxID:</strong> {paymentId}</div>
            <div><strong style={{ color: 'var(--text-light)' }}>Amount:</strong> {depositAmount} ETB</div>
            <div><strong style={{ color: 'var(--text-light)' }}>User:</strong> {user?.uid?.substring(0, 10)}...</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <Button
              type="button"
              variant="primary"
              size="md"
              fullWidth
              onClick={() => handleSimulatePaymentOutcome('success')}
              loading={depositLoading}
              icon={<CheckCircle2 size={16} />}
            >
              Simulate Success
            </Button>
            <Button
              type="button"
              variant="danger"
              size="md"
              fullWidth
              onClick={() => handleSimulatePaymentOutcome('fail')}
              disabled={depositLoading}
              icon={<XCircle size={16} />}
            >
              Simulate Fail
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="md"
              fullWidth
              onClick={() => setSimulatedCheckoutUrl('')}
              disabled={depositLoading}
            >
              Close Simulator
            </Button>
          </div>
        </div>
      )}

      {/* Withdrawal Form */}
      {activeTab === 'withdraw' && (
        <div className="section-card">
          <div className="section-title" style={{ fontFamily: 'var(--font-heading)' }}>
            <ArrowUpCircle size={18} style={{ color: 'var(--primary-amber)' }} />
            <span>Request Withdrawal</span>
          </div>
          <form onSubmit={handleWithdrawSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {withdrawError && (
              <Toast message={withdrawError} type="error" onClose={() => setWithdrawError('')} />
            )}
            {withdrawSuccess && (
              <Toast message="Withdrawal submitted! Waiting for operator approval." type="success" onClose={() => setWithdrawSuccess(false)} />
            )}

            <Input
              label="Amount (ETB)"
              type="number"
              placeholder="Enter amount (e.g. 50)"
              min="1"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              required
              disabled={withdrawLoading}
            />

            <div className="input-field-group">
              <label className="input-label">Payment Method</label>
              <div className="gateway-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                {GATEWAYS_WITHDRAW.map((gw) => (
                  <button
                    key={gw.value}
                    type="button"
                    className={`gateway-btn ${withdrawGateway === gw.value ? 'active' : ''}`}
                    onClick={() => setWithdrawGateway(gw.value)}
                    disabled={withdrawLoading}
                  >
                    <span className="gateway-icon">{gw.icon}</span>
                    <span>{gw.label}</span>
                  </button>
                ))}
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

      {/* Transaction History */}
      {activeTab === 'history' && (
        <div className="section-card" style={{ maxHeight: '420px', overflowY: 'auto' }}>
          <div className="section-title" style={{ fontFamily: 'var(--font-heading)' }}>
            <History size={18} style={{ color: 'var(--primary-amber)' }} />
            <span>Transactions</span>
          </div>

          {ledgerEntries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
              <Inbox size={36} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
              <p style={{ fontSize: '0.85rem' }}>No transactions recorded yet.</p>
            </div>
          ) : (
            ledgerEntries.map((entry) => {
              const isCredit = ['deposit', 'win', 'bonus'].includes(entry.type);
              const santim = entry.amount_santim || entry.amountSantim || 0;
              const date = new Date(parseInt(entry.created_at || entry.createdAt)).toLocaleDateString();

              return (
                <div key={entry.id} className="ledger-item">
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-light)' }}>
                      {formatLedgerType(entry.type)}
                    </p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem', fontFamily: 'var(--font-mono)' }}>
                      {date} {entry.gateway ? `· ${entry.gateway.toUpperCase()}` : ''}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p className={`ledger-amount ${isCredit ? 'credit' : 'debit'}`} style={{ fontFamily: 'var(--font-mono)' }}>
                      {isCredit ? '+' : '-'}<CurrencyDisplay santim={santim} size="sm" variant={isCredit ? 'success' : 'white'} />
                    </p>
                    <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.1rem', fontFamily: 'var(--font-mono)' }}>
                      Bal: <CurrencyDisplay santim={entry.balance_santim || entry.balanceSantim || 0} size="sm" variant="muted" prefix="" />
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
