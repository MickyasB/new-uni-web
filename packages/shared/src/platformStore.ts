import { RoomRecord, UserRecord, RoomTier, RoomStatus } from './types';

const STORAGE_ROOMS_KEY = 'bingo_platform_global_rooms_v2';
const STORAGE_USERS_KEY = 'bingo_platform_global_users_v2';
const CHANNEL_NAME = 'bingo_platform_global_channel_v2';

let bc: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    bc = new BroadcastChannel(CHANNEL_NAME);
  } catch (e) {
    console.warn('BroadcastChannel initialization warning:', e);
  }
}

// Initial default rooms if none exist
const DEFAULT_ROOMS: RoomRecord[] = [
  {
    id: 'room-bronze-101',
    tier: RoomTier.BRONZE,
    entryFeeSantim: 1000, // 10 ETB
    mode: 'auto',
    type: 'open',
    minPlayers: 2,
    maxCards: 100,
    status: RoomStatus.WAITING,
    playerCount: 0,
    potSantim: 0,
    createdAt: Date.now() - 60000,
  },
  {
    id: 'room-silver-202',
    tier: RoomTier.SILVER,
    entryFeeSantim: 5000, // 50 ETB
    mode: 'auto',
    type: 'open',
    minPlayers: 3,
    maxCards: 100,
    status: RoomStatus.WAITING,
    playerCount: 0,
    potSantim: 0,
    createdAt: Date.now() - 30000,
  }
];

export const PlatformStore = {
  getRooms(): RoomRecord[] {
    if (typeof window === 'undefined') return DEFAULT_ROOMS;
    try {
      const raw = localStorage.getItem(STORAGE_ROOMS_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_ROOMS_KEY, JSON.stringify(DEFAULT_ROOMS));
        return DEFAULT_ROOMS;
      }
      const parsed = JSON.parse(raw) as RoomRecord[];
      return parsed.length > 0 ? parsed : DEFAULT_ROOMS;
    } catch (e) {
      return DEFAULT_ROOMS;
    }
  },

  createRoom(tier: RoomTier | 'bronze' | 'silver' | 'gold', mode: 'auto' | 'manual' = 'auto', type: 'open' | 'scheduled' = 'open', scheduledAt?: number): RoomRecord {
    const tierConfigs = {
      bronze: { entryFeeSantim: 1000, minPlayers: 2 },
      silver: { entryFeeSantim: 5000, minPlayers: 3 },
      gold: { entryFeeSantim: 10000, minPlayers: 5 },
    };

    const config = tierConfigs[tier as keyof typeof tierConfigs] || tierConfigs.bronze;
    const roomId = 'room-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);

    const newRoom: RoomRecord = {
      id: roomId,
      tier: tier as RoomTier,
      entryFeeSantim: config.entryFeeSantim,
      mode,
      type,
      scheduledAt: scheduledAt || null,
      minPlayers: config.minPlayers,
      maxCards: 100,
      status: RoomStatus.WAITING,
      playerCount: 0,
      potSantim: 0,
      createdAt: Date.now(),
    };

    const currentRooms = this.getRooms();
    const updatedRooms = [newRoom, ...currentRooms];
    
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_ROOMS_KEY, JSON.stringify(updatedRooms));
        if (bc) {
          bc.postMessage({ type: 'ROOMS_CHANGED', rooms: updatedRooms });
        }
      } catch (e) {
        console.error('Storage save error:', e);
      }
    }

    return newRoom;
  },

  subscribeRooms(callback: (rooms: RoomRecord[]) => void): () => void {
    if (typeof window === 'undefined') return () => {};

    // Immediate callback with current rooms
    callback(this.getRooms());

    const handleBcMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'ROOMS_CHANGED') {
        callback(event.data.rooms || this.getRooms());
      }
    };

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === STORAGE_ROOMS_KEY) {
        callback(this.getRooms());
      }
    };

    if (bc) bc.addEventListener('message', handleBcMessage);
    window.addEventListener('storage', handleStorageEvent);

    // Poll interval fallback to guarantee updates across frames
    const intervalId = setInterval(() => {
      callback(this.getRooms());
    }, 1000);

    return () => {
      if (bc) bc.removeEventListener('message', handleBcMessage);
      window.removeEventListener('storage', handleStorageEvent);
      clearInterval(intervalId);
    };
  }
};
