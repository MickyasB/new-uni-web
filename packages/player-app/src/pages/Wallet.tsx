import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store';
import { api } from '../api';
import { Gateway } from '@bingo/shared';

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

  // Simulated gateway sheet sandbox completion
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

  const balanceEtb = userRecord ? (userRecord.walletBalanceSantim / 100).toFixed(2) : '0.00';

  const formatLedgerType = (type: string) => {
    switch (type) {
      case 'deposit': return 'Deposit';
      case 'withdrawal': return 'Withdrawal';
      case 'win': return 'Winnings Credit';
      case 'bonus': return 'Bonus Match';
      case 'entry_fee': return 'Card Purchase Fee';
      case 'house_cut': return 'House Commission';
      default: return type;
    }
  };

  return (
    <div className="page-container">
      {/* Wallet Balance Display Card */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'center', border: '1px solid var(--primary-amber)' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('wallet.balance') || 'Available Balance'}</p>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--primary-amber)', fontWeight: 800 }}>
          {balanceEtb} <span style={{ fontSize: '1.25rem' }}>ETB</span>
        </h1>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {(userRecord?.walletBalanceSantim || 0).toLocaleString()} santim
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--surface-raised)', padding: '0.25rem', borderRadius: '12px' }}>
        <button 
          className={`btn ${activeTab === 'deposit' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setActiveTab('deposit'); setSimulatedCheckoutUrl(''); }}
          style={{ padding: '0.5rem', fontSize: '0.85rem' }}
        >
          {t('wallet.deposit') || 'Deposit'}
        </button>
        <button 
          className={`btn ${activeTab === 'withdraw' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setActiveTab('withdraw'); setSimulatedCheckoutUrl(''); }}
          style={{ padding: '0.5rem', fontSize: '0.85rem' }}
        >
          {t('wallet.withdraw') || 'Withdraw'}
        </button>
        <button 
          className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => { setActiveTab('history'); setSimulatedCheckoutUrl(''); }}
          style={{ padding: '0.5rem', fontSize: '0.85rem' }}
        >
          History
        </button>
      </div>

      {/* Deposit Form */}
      {activeTab === 'deposit' && !simulatedCheckoutUrl && (
        <div className="glass-panel">
          <form onSubmit={handleDepositSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {depositError && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                {depositError}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">{t('wallet.amountEtb') || 'Amount (ETB)'}</label>
              <input 
                type="number" 
                placeholder="Enter amount (e.g. 100)"
                min="1"
                className="input-field"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                required
                disabled={depositLoading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('wallet.chooseGateway') || 'Payment Gateway'}</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                {[
                  { value: Gateway.CHAPA, label: 'Chapa' },
                  { value: Gateway.TELEBIRR, label: 'Telebirr' },
                  { value: Gateway.WEBIRR, label: 'WeBirr' },
                  { value: Gateway.CBE, label: 'CBE Birr' }
                ].map((gw) => (
                  <button
                    key={gw.value}
                    type="button"
                    className={`btn ${depositGateway === gw.value ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.65rem 0.25rem', fontSize: '0.85rem' }}
                    onClick={() => setDepositGateway(gw.value)}
                    disabled={depositLoading}
                  >
                    {gw.label}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={depositLoading}>
              {depositLoading ? 'Processing...' : 'Proceed to Payment'}
            </button>
          </form>
        </div>
      )}

      {/* Simulated checkout sheet overlay */}
      {activeTab === 'deposit' && simulatedCheckoutUrl && (
        <div className="glass-panel" style={{ border: '1px solid var(--primary-amber)', display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem' }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '2rem' }}>💳</span>
            <h3 style={{ fontSize: '1.15rem', marginTop: '0.5rem' }}>Sandbox Payment Gateway</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Simulate transaction response for **{depositGateway.toUpperCase()}**
            </p>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontFamily: 'monospace' }}>
            <div>**TxID**: {paymentId}</div>
            <div>**Amount**: {depositAmount} ETB</div>
            <div>**User**: {user?.uid?.substring(0,10)}...</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button 
              className="btn btn-primary" 
              onClick={() => handleSimulatePaymentOutcome('success')}
              disabled={depositLoading}
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: 'none' }}
            >
              {depositLoading ? 'Sending success webhook...' : 'Simulate Success (Credit Wallet)'}
            </button>
            
            <button 
              className="btn btn-secondary" 
              onClick={() => handleSimulatePaymentOutcome('fail')}
              disabled={depositLoading}
              style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
            >
              Simulate Payment Cancel/Fail
            </button>

            <button 
              className="btn btn-secondary" 
              onClick={() => setSimulatedCheckoutUrl('')}
              disabled={depositLoading}
              style={{ marginTop: '0.5rem' }}
            >
              Close Simulator
            </button>
          </div>
        </div>
      )}

      {/* Withdrawal Form */}
      {activeTab === 'withdraw' && (
        <div className="glass-panel">
          <form onSubmit={handleWithdrawSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {withdrawError && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                {withdrawError}
              </div>
            )}

            {withdrawSuccess && (
              <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid var(--success)', color: 'var(--success)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                ✅ **Withdrawal request submitted successfully!** Waiting for operator approval.
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Withdrawal Amount (ETB)</label>
              <input 
                type="number" 
                placeholder="Enter amount (e.g. 50)"
                min="1"
                className="input-field"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                required
                disabled={withdrawLoading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Payment Gateway</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[
                  { value: Gateway.TELEBIRR, label: 'Telebirr Wallet' },
                  { value: Gateway.CBE, label: 'CBE Account' }
                ].map((gw) => (
                  <button
                    key={gw.value}
                    type="button"
                    className={`btn ${withdrawGateway === gw.value ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ padding: '0.65rem 0.25rem', fontSize: '0.85rem', flex: 1 }}
                    onClick={() => setWithdrawGateway(gw.value)}
                    disabled={withdrawLoading}
                  >
                    {gw.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Account Details (Phone or Account number)</label>
              <input 
                type="text" 
                placeholder={withdrawGateway === Gateway.TELEBIRR ? 'e.g. 0911223344' : 'e.g. 1000123456789'}
                className="input-field"
                value={accountDetails}
                onChange={(e) => setAccountDetails(e.target.value)}
                required
                disabled={withdrawLoading}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={withdrawLoading}>
              {withdrawLoading ? 'Submitting...' : 'Request Payout'}
            </button>
          </form>
        </div>
      )}

      {/* Transaction History Ledger */}
      {activeTab === 'history' && (
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '350px', overflowY: 'auto' }}>
          <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', fontWeight: 600 }}>Transactions</h4>

          {ledgerEntries.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
              No transactions recorded yet.
            </div>
          ) : (
            ledgerEntries.map((entry) => {
              const isCredit = ['deposit', 'win', 'bonus'].includes(entry.type);
              const amountEtb = ((entry.amount_santim || entry.amountSantim || 0) / 100).toFixed(2);
              const date = new Date(parseInt(entry.created_at || entry.createdAt)).toLocaleDateString();

              return (
                <div key={entry.id} className="ledger-item">
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>{formatLedgerType(entry.type)}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                      {date} {entry.gateway ? `| ${entry.gateway.toUpperCase()}` : ''}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p className={`ledger-amount ${isCredit ? 'credit' : 'debit'}`}>
                      {isCredit ? '+' : '-'}{amountEtb} ETB
                    </p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                      Bal: {((entry.balance_santim || entry.balanceSantim || 0) / 100).toFixed(2)}
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
