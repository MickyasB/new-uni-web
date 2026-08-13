import { describe, it, expect, vi } from 'vitest';

// Mock firebase-admin and firebase-functions
vi.mock('firebase-admin', () => {
  return {
    apps: [{ name: 'mock' }],
    initializeApp: vi.fn(),
    firestore: vi.fn(() => ({
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({
          get: vi.fn(() => Promise.resolve({ exists: true, data: () => ({}) })),
          set: vi.fn(() => Promise.resolve()),
          update: vi.fn(() => Promise.resolve()),
        })),
      })),
    })),
    database: vi.fn(() => ({
      ref: vi.fn(() => ({
        set: vi.fn(() => Promise.resolve()),
        update: vi.fn(() => Promise.resolve()),
      })),
    })),
  };
});

vi.mock('firebase-functions/v2/https', () => {
  return {
    onCall: (optionsOrHandler: any, handler?: any) => {
      const h = handler || optionsOrHandler;
      return (data: any, context?: any) => {
        return h({
          data,
          auth: context?.auth || null,
        });
      };
    },
    HttpsError: class extends Error {
      constructor(public code: string, message: string) {
        super(message);
      }
    },
  };
});

import { createRoom } from './game';
import { RoomTier } from '@bingo/shared';

describe('Game Cloud Functions Mocked Tests', () => {
  it('should create room successfully when authorized', async () => {
    const data = {
      tier: RoomTier.BRONZE,
      mode: 'auto',
      type: 'open',
    };
    const context = {
      auth: { uid: 'admin1', token: { role: 'operator' } },
    };

    const result = await (createRoom as any)(data, context);
    expect(result.success).toBe(true);
    expect(result.roomId).toBeDefined();
  });

  it('should throw unauthenticated error if auth is missing', async () => {
    const data = {
      tier: RoomTier.BRONZE,
      mode: 'auto',
      type: 'open',
    };
    const context = {};

    await expect((createRoom as any)(data, context)).rejects.toThrow('User must be authenticated.');
  });
});
