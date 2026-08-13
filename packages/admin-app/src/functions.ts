/**
 * Admin API client — replaces Firebase httpsCallable with REST calls.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function adminRequest<T = any>(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  body?: any
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = localStorage.getItem('bingo_admin_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ── Admin Auth ─────────────────────────────────────────────────────────────────
export const adminLogin = (phone: string, password: string) =>
  adminRequest('/auth/login', 'POST', { phone, password });

// ── Dashboard ──────────────────────────────────────────────────────────────────
export const callGetDashboardAnalytics = () =>
  adminRequest('/admin/analytics');

// ── User Management ────────────────────────────────────────────────────────────
export const getUsers = (search?: string) =>
  adminRequest(`/admin/users${search ? `?search=${encodeURIComponent(search)}` : ''}`);

export const callUpdatePlayerStatus = (data: { targetUid: string; isBanned: boolean }) =>
  adminRequest(`/admin/users/${data.targetUid}/ban`, 'POST', { isBanned: data.isBanned });

export const updateUserKyc = (uid: string, kycStatus: string) =>
  adminRequest(`/admin/users/${uid}/kyc`, 'POST', { kycStatus });

// ── Withdrawals ────────────────────────────────────────────────────────────────
export const getWithdrawals = () =>
  adminRequest('/admin/withdrawals');

export const callApproveWithdrawal = (data: { requestId: string }) =>
  adminRequest(`/admin/withdrawals/${data.requestId}/approve`, 'POST');

export const callRejectWithdrawal = (data: { requestId: string }) =>
  adminRequest(`/admin/withdrawals/${data.requestId}/reject`, 'POST');

// ── Flagged Wins ───────────────────────────────────────────────────────────────
export const getFlaggedWins = () =>
  adminRequest('/admin/flagged-wins');

export const callApproveFlaggedWin = (data: { flaggedWinId: string }) =>
  adminRequest(`/admin/flagged-wins/${data.flaggedWinId}/approve`, 'POST');

export const callRejectFlaggedWin = (data: { flaggedWinId: string }) =>
  adminRequest(`/admin/flagged-wins/${data.flaggedWinId}/reject`, 'POST');

// ── Rooms ──────────────────────────────────────────────────────────────────────
export const createRoom = (tier: string, mode: string, type: string) =>
  adminRequest('/admin/rooms', 'POST', { tier, mode, type });

// ── Audit & Reconciliation ─────────────────────────────────────────────────────
export const getAuditLog = () =>
  adminRequest('/admin/audit-log');

export const getLedger = (type?: string) =>
  adminRequest(`/admin/ledger${type ? `?type=${type}` : ''}`);

export const callRunManualReconciliation = () =>
  adminRequest('/admin/reconciliation', 'POST');
