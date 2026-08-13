import { RoomRecord } from './types';

const STORAGE_KEY_ROOMS = 'bingo_platform_rooms_v1';
const CHANNEL_NAME = 'bingo_platform_sync_channel';

// In-memory / localStorage real-time sync channel across tabs & windows
let bc: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    bc = new BroadcastChannel(CHANNEL_NAME);
  } catch (e) {
    console.warn('BroadcastChannel fallback:', e);
  }
}

export const dbSync = {
  getRooms(): RoomRecord[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ROOMS);
      if (!raw) return [];
      return JSON.parse(raw) as RoomRecord[];
    } catch (e) {
      return [];
    }
  },

  saveRoom(room: RoomRecord): void {
    if (typeof window === 'undefined') return;
    try {
      const rooms = this.getRooms();
      const existingIdx = rooms.findIndex(r => r.id === room.id);
      if (existingIdx >= 0) {
        rooms[existingIdx] = room;
      } else {
        rooms.unshift(room);
      }
      localStorage.setItem(STORAGE_KEY_ROOMS, JSON.stringify(rooms));
      if (bc) {
        bc.postMessage({ type: 'ROOMS_UPDATED', room });
      }
    } catch (e) {
      console.error('Failed to save room locally:', e);
    }
  },

  subscribeRooms(callback: (rooms: RoomRecord[]) => void): () => void {
    if (typeof window === 'undefined') return () => {};

    // Initial emit
    callback(this.getRooms());

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'ROOMS_UPDATED') {
        callback(this.getRooms());
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_ROOMS) {
        callback(this.getRooms());
      }
    };

    if (bc) bc.addEventListener('message', handleMessage);
    window.addEventListener('storage', handleStorage);

    return () => {
      if (bc) bc.removeEventListener('message', handleMessage);
      window.removeEventListener('storage', handleStorage);
    };
  }
};
