import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { api, IS_NATIVE, DEFAULT_PROD_URL } from './api';

export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (
  IS_NATIVE ? DEFAULT_PROD_URL : (
    typeof window !== 'undefined' && window.location.hostname !== 'localhost'
      ? window.location.origin
      : 'http://localhost:4000'
  )
);

// ── Types ──────────────────────────────────────────────────────────────────────

export interface UserInfo {
  uid: string;
  phone: string;
  displayName: string;
  walletBalanceSantim: number;
  referralCode?: string;
  kycStatus?: string;
}

export interface RoomLiveState {
  currentNumber: number | null;
  calledNumbers: number[];
  state: string;
  winner?: any;
  players?: Record<string, any>;
}

interface AppState {
  // Auth state
  user: UserInfo | null;
  token: string | null;
  loading: boolean;
  initialized: boolean;

  // Game state
  activeRoomId: string | null;
  roomLiveState: RoomLiveState | null;
  floatingReactions: Array<{ id: string; emoji: string; x: number }>;

  // Socket
  socket: Socket | null;

  // Actions
  initialize: () => void;
  login: (phone: string, password: string) => Promise<any>;
  register: (data: any) => Promise<any>;
  signOut: () => void;
  refreshUser: () => Promise<void>;
  setActiveRoomId: (roomId: string | null) => void;
  addFloatingReaction: (emoji: string) => void;
  clearFloatingReactions: () => void;
  setMockUser: (user: UserInfo) => void;
}

let socketInstance: Socket | null = null;

function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  }
  return socketInstance;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  token: null,
  loading: false,
  initialized: false,
  activeRoomId: null,
  roomLiveState: null,
  floatingReactions: [],
  socket: null,

  setMockUser: (user: UserInfo) => {
    set({
      user,
      token: 'mock-token',
      loading: false,
      initialized: true,
    });
  },

  initialize: () => {
    if (get().initialized) return;

    // Check for stored JWT token
    const storedToken = localStorage.getItem('bingo_jwt_token');
    if (storedToken) {
      set({ token: storedToken, loading: true });
      // Validate token by fetching user profile
      api.getMe()
        .then((data: any) => {
          set({
            user: {
              uid: data.uid,
              phone: data.phone,
              displayName: data.displayName,
              walletBalanceSantim: data.walletBalanceSantim,
              referralCode: data.referralCode,
              kycStatus: data.kycStatus,
            },
            loading: false,
            initialized: true,
          });
        })
        .catch(() => {
          // Token expired, invalid or offline
          localStorage.removeItem('bingo_jwt_token');
          set({ user: null, token: null, loading: false, initialized: true });
        });
    } else {
      // Give a tiny smooth initial pause for splash animation to finish entering
      setTimeout(() => {
        set({ initialized: true, loading: false });
      }, 500);
    }
  },

  login: async (phone: string, password: string) => {
    set({ loading: true });
    try {
      const data = await api.login({ phone, password });
      localStorage.setItem('bingo_jwt_token', data.token);
      set({
        user: data.user,
        token: data.token,
        loading: false,
      });
      return data;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  register: async (regData: any) => {
    set({ loading: true });
    try {
      const data = await api.register(regData);
      localStorage.setItem('bingo_jwt_token', data.token);
      set({
        user: data.user,
        token: data.token,
        loading: false,
      });
      return data;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  signOut: () => {
    localStorage.removeItem('bingo_jwt_token');
    if (socketInstance) {
      socketInstance.disconnect();
      socketInstance = null;
    }
    set({ user: null, token: null, activeRoomId: null, roomLiveState: null, socket: null });
  },

  refreshUser: async () => {
    try {
      const data = await api.getMe();
      set({
        user: {
          uid: data.uid,
          phone: data.phone,
          displayName: data.displayName,
          walletBalanceSantim: data.walletBalanceSantim,
          referralCode: data.referralCode,
          kycStatus: data.kycStatus,
        },
      });
    } catch (err) {
      console.warn('Failed to refresh user:', err);
    }
  },

  setActiveRoomId: (roomId: string | null) => {
    const prevRoomId = get().activeRoomId;
    const socket = getSocket();

    // Leave previous room
    if (prevRoomId) {
      socket.emit('leaveRoom', prevRoomId);
      socket.off('numberCalled');
      socket.off('winnerDeclared');
      socket.off('gameStarted');
      socket.off('gameEnded');
      socket.off('playerJoined');
      socket.off('reaction');
    }

    set({ activeRoomId: roomId, roomLiveState: null, socket });

    if (roomId) {
      socket.emit('joinRoom', roomId);

      // Listen for real-time game events
      socket.on('numberCalled', (data: { number: number; calledNumbers: number[] }) => {
        set({
          roomLiveState: {
            currentNumber: data.number,
            calledNumbers: data.calledNumbers,
            state: 'active',
          },
        });
      });

      socket.on('winnerDeclared', (winner: any) => {
        set((state) => ({
          roomLiveState: {
            ...state.roomLiveState!,
            state: 'ended',
            winner,
          },
        }));
      });

      socket.on('gameStarted', (_data: any) => {
        set({
          roomLiveState: {
            currentNumber: null,
            calledNumbers: [],
            state: 'active',
          },
        });
      });

      socket.on('gameEnded', (data: any) => {
        set((state) => ({
          roomLiveState: {
            ...(state.roomLiveState || { currentNumber: null, calledNumbers: [] }),
            state: 'ended',
            winner: data.winners?.[0] || null,
          },
        }));
      });

      socket.on('reaction', (data: { userId: string; emoji: string }) => {
        get().addFloatingReaction(data.emoji);
      });
    }
  },

  addFloatingReaction: (emoji: string) => {
    const newReaction = {
      id: Math.random().toString(36).substring(2, 9),
      emoji,
      x: Math.floor(Math.random() * 80) + 10,
    };
    set((state) => ({
      floatingReactions: [...state.floatingReactions.slice(-15), newReaction],
    }));

    setTimeout(() => {
      set((state) => ({
        floatingReactions: state.floatingReactions.filter((r) => r.id !== newReaction.id),
      }));
    }, 2500);

    // Broadcast reaction via Socket.io
    const roomId = get().activeRoomId;
    const userId = get().user?.uid;
    if (roomId && socketInstance) {
      socketInstance.emit('reaction', { roomId, emoji, userId });
    }
  },

  clearFloatingReactions: () => set({ floatingReactions: [] }),
}));
