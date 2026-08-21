import { Capacitor } from '@capacitor/core';

/**
 * Determine API Base URL depending on environment.
 * On native mobile (Capacitor), default to live production API.
 * In local dev (port 3000), default to /api proxy or localhost.
 */
export const IS_NATIVE = Capacitor.isNativePlatform() || (
  typeof window !== 'undefined' && (
    window.location.protocol === 'file:' ||
    (window.location.hostname === 'localhost' && window.location.port !== '3000' && window.location.port !== '5173')
  )
);

export const DEFAULT_PROD_URL = 'https://bingo.gymtradingplc.com';

export const API_BASE_URL = import.meta.env.VITE_API_URL || (
  IS_NATIVE ? `${DEFAULT_PROD_URL}/api` : '/api'
);

export async function apiRequest<T = any>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any,
  token?: string,
  timeoutMs: number = 9000
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const storedToken = token || localStorage.getItem('bingo_jwt_token');
  if (storedToken) {
    headers['Authorization'] = `Bearer ${storedToken}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Network timeout: Server took too long to respond');
    }
    throw err;
  }
}

export const api = {
  // ── Auth ────────────────────────────────────────────────────────────────────
  register: (data: any) => apiRequest('/auth/register', 'POST', data),
  login: (data: any) => apiRequest('/auth/login', 'POST', data),
  getMe: () => apiRequest('/auth/me', 'GET'),

  // ── Game ────────────────────────────────────────────────────────────────────
  getRooms: () => apiRequest('/game/rooms', 'GET'),
  getRoom: (id: string) => apiRequest(`/game/rooms/${id}`, 'GET'),
  buyCards: (roomId: string, cardCount: number) =>
    apiRequest('/game/buyCards', 'POST', { roomId, cardCount }),
  getMyCards: (roomId: string) => apiRequest(`/game/myCards/${roomId}`, 'GET'),
  startGame: (roomId: string) => apiRequest('/game/start', 'POST', { roomId }),
  claimBingo: (roomId: string, cardId: string, winTier: string) =>
    apiRequest('/game/claim', 'POST', { roomId, cardId, winTier }),
  getGameState: (roomId: string) => apiRequest(`/game/${roomId}/state`, 'GET'),
  addBots: (roomId: string, count: number) =>
    apiRequest('/game/addBots', 'POST', { roomId, count }),

  // ── Wallet ──────────────────────────────────────────────────────────────────
  getBalance: () => apiRequest('/wallet/balance', 'GET'),
  getWalletHistory: () => apiRequest('/wallet/history', 'GET'),
  deposit: (amountEtb: number, gateway: string) =>
    apiRequest('/wallet/deposit', 'POST', { amountEtb, gateway }),
  withdraw: (amountEtb: number, gateway: string, accountDetails: string) =>
    apiRequest('/wallet/withdraw', 'POST', { amountEtb, gateway, accountDetails }),

  // ── Admin ───────────────────────────────────────────────────────────────────
  getAnalytics: () => apiRequest('/admin/analytics', 'GET'),
  getUsers: (search?: string) =>
    apiRequest(`/admin/users${search ? `?search=${encodeURIComponent(search)}` : ''}`, 'GET'),
  banUser: (uid: string, isBanned: boolean) =>
    apiRequest(`/admin/users/${uid}/ban`, 'POST', { isBanned }),
  updateKyc: (uid: string, kycStatus: string) =>
    apiRequest(`/admin/users/${uid}/kyc`, 'POST', { kycStatus }),
  getWithdrawals: () => apiRequest('/admin/withdrawals', 'GET'),
  approveWithdrawal: (id: string) =>
    apiRequest(`/admin/withdrawals/${id}/approve`, 'POST'),
  rejectWithdrawal: (id: string) =>
    apiRequest(`/admin/withdrawals/${id}/reject`, 'POST'),
  getFlaggedWins: () => apiRequest('/admin/flagged-wins', 'GET'),
  approveFlaggedWin: (id: string) =>
    apiRequest(`/admin/flagged-wins/${id}/approve`, 'POST'),
  rejectFlaggedWin: (id: string) =>
    apiRequest(`/admin/flagged-wins/${id}/reject`, 'POST'),
  createRoom: (tier: string, mode: string, type: string) =>
    apiRequest('/admin/rooms', 'POST', { tier, mode, type }),
  getAuditLog: () => apiRequest('/admin/audit-log', 'GET'),
  getLedger: (type?: string) =>
    apiRequest(`/admin/ledger${type ? `?type=${type}` : ''}`, 'GET'),
  runReconciliation: () => apiRequest('/admin/reconciliation', 'POST'),
};
