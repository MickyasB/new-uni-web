"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
// Mock firebase-admin and firebase-functions
vitest_1.vi.mock('firebase-admin', () => {
    return {
        apps: [{ name: 'mock' }],
        initializeApp: vitest_1.vi.fn(),
        firestore: vitest_1.vi.fn(() => ({
            collection: vitest_1.vi.fn(() => ({
                doc: vitest_1.vi.fn(() => ({
                    get: vitest_1.vi.fn(() => Promise.resolve({ exists: true, data: () => ({}) })),
                    set: vitest_1.vi.fn(() => Promise.resolve()),
                    update: vitest_1.vi.fn(() => Promise.resolve()),
                })),
            })),
        })),
        database: vitest_1.vi.fn(() => ({
            ref: vitest_1.vi.fn(() => ({
                set: vitest_1.vi.fn(() => Promise.resolve()),
                update: vitest_1.vi.fn(() => Promise.resolve()),
            })),
        })),
    };
});
vitest_1.vi.mock('firebase-functions/v2/https', () => {
    return {
        onCall: (optionsOrHandler, handler) => {
            const h = handler || optionsOrHandler;
            return (data, context) => {
                return h({
                    data,
                    auth: context?.auth || null,
                });
            };
        },
        HttpsError: class extends Error {
            code;
            constructor(code, message) {
                super(message);
                this.code = code;
            }
        },
    };
});
const game_1 = require("./game");
const shared_1 = require("@bingo/shared");
(0, vitest_1.describe)('Game Cloud Functions Mocked Tests', () => {
    (0, vitest_1.it)('should create room successfully when authorized', async () => {
        const data = {
            tier: shared_1.RoomTier.BRONZE,
            mode: 'auto',
            type: 'open',
        };
        const context = {
            auth: { uid: 'admin1', token: { role: 'operator' } },
        };
        const result = await game_1.createRoom(data, context);
        (0, vitest_1.expect)(result.success).toBe(true);
        (0, vitest_1.expect)(result.roomId).toBeDefined();
    });
    (0, vitest_1.it)('should throw unauthenticated error if auth is missing', async () => {
        const data = {
            tier: shared_1.RoomTier.BRONZE,
            mode: 'auto',
            type: 'open',
        };
        const context = {};
        await (0, vitest_1.expect)(game_1.createRoom(data, context)).rejects.toThrow('User must be authenticated.');
    });
});
//# sourceMappingURL=game.test.js.map