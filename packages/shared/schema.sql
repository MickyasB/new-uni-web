-- PostgreSQL Schema for Bingo Platform
-- Database: bingo_platform_db

CREATE TABLE IF NOT EXISTS users (
    uid VARCHAR(64) PRIMARY KEY,
    phone VARCHAR(32) NOT NULL UNIQUE,
    password VARCHAR(255),
    display_name VARCHAR(100) NOT NULL,
    dob DATE NOT NULL,
    kyc_status VARCHAR(20) DEFAULT 'verified',
    kyc_doc_type VARCHAR(32),
    kyc_doc_id_number VARCHAR(64),
    wallet_balance_santim BIGINT DEFAULT 100000,
    device_fingerprint VARCHAR(128),
    fcm_token VARCHAR(512),
    referral_code VARCHAR(32) UNIQUE,
    referred_by VARCHAR(64),
    is_banned BOOLEAN DEFAULT FALSE,
    role VARCHAR(20) DEFAULT 'player',
    created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS rooms (
    id VARCHAR(64) PRIMARY KEY,
    tier VARCHAR(20) NOT NULL,
    entry_fee_santim BIGINT NOT NULL,
    mode VARCHAR(20) DEFAULT 'auto',
    type VARCHAR(20) DEFAULT 'open',
    scheduled_at BIGINT,
    min_players INT DEFAULT 2,
    max_cards INT DEFAULT 6,
    status VARCHAR(20) DEFAULT 'waiting',
    player_count INT DEFAULT 0,
    pot_santim BIGINT DEFAULT 0,
    created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS games (
    id VARCHAR(64) PRIMARY KEY,
    room_id VARCHAR(64) REFERENCES rooms(id) ON DELETE CASCADE,
    seed_hash VARCHAR(128) NOT NULL,
    sequence JSONB NOT NULL,
    called_numbers JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(20) DEFAULT 'active',
    last_processed_index INT DEFAULT -1,
    winners JSONB DEFAULT '[]'::jsonb,
    revealed_at BIGINT,
    created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS bingo_cards (
    id VARCHAR(64) PRIMARY KEY,
    room_id VARCHAR(64) REFERENCES rooms(id) ON DELETE CASCADE,
    user_id VARCHAR(64) REFERENCES users(uid) ON DELETE CASCADE,
    fingerprint VARCHAR(128) NOT NULL,
    numbers_json JSONB NOT NULL,
    created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS wallet_ledger (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(uid) ON DELETE CASCADE,
    type VARCHAR(32) NOT NULL,
    amount_santim BIGINT NOT NULL,
    balance_santim BIGINT NOT NULL,
    gateway VARCHAR(32),
    transaction_id VARCHAR(128),
    game_id VARCHAR(64),
    created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS flagged_wins (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(uid),
    card_id VARCHAR(64),
    win_tier VARCHAR(32),
    amount_santim BIGINT NOT NULL,
    reason VARCHAR(100),
    status VARCHAR(32) DEFAULT 'pending_review',
    flagged_at BIGINT,
    processed_at BIGINT,
    processed_by VARCHAR(64),
    auto_approved BOOLEAN DEFAULT FALSE,
    created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(uid),
    gateway VARCHAR(32) NOT NULL,
    amount_santim BIGINT NOT NULL,
    account_details VARCHAR(255) NOT NULL,
    status VARCHAR(32) DEFAULT 'pending',
    processed_at BIGINT,
    processed_by VARCHAR(64),
    created_at BIGINT NOT NULL
);

-- Payment webhook idempotency — prevents double-crediting
CREATE TABLE IF NOT EXISTS processed_webhooks (
    transaction_id VARCHAR(128) PRIMARY KEY,
    gateway VARCHAR(32) NOT NULL,
    user_id VARCHAR(64) REFERENCES users(uid),
    amount_santim BIGINT NOT NULL,
    signature_valid BOOLEAN NOT NULL,
    processing_result VARCHAR(32),
    created_at BIGINT NOT NULL
);

-- Pending payments for iOS Safari recovery flow
CREATE TABLE IF NOT EXISTS pending_payments (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(uid),
    gateway VARCHAR(32) NOT NULL,
    amount_santim BIGINT NOT NULL,
    payment_ref VARCHAR(128) NOT NULL,
    status VARCHAR(32) DEFAULT 'pending',
    created_at BIGINT NOT NULL
);

-- Admin audit trail — immutable log of all admin actions
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    actor_id VARCHAR(64) NOT NULL,
    role VARCHAR(20),
    action_type VARCHAR(64) NOT NULL,
    target VARCHAR(128),
    before_value TEXT,
    after_value TEXT,
    timestamp BIGINT NOT NULL
);

-- Rate limiting counters
CREATE TABLE IF NOT EXISTS rate_limits (
    id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    action VARCHAR(32) NOT NULL,
    attempts JSONB DEFAULT '[]'::jsonb,
    updated_at BIGINT NOT NULL
);

-- Platform configuration (kill switch, bonus settings, etc.)
CREATE TABLE IF NOT EXISTS platform_config (
    key VARCHAR(64) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at BIGINT NOT NULL
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_user ON wallet_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_type ON wallet_ledger(type);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_created ON wallet_ledger(created_at);
CREATE INDEX IF NOT EXISTS idx_bingo_cards_room ON bingo_cards(room_id);
CREATE INDEX IF NOT EXISTS idx_bingo_cards_user ON bingo_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_games_room ON games(room_id);
CREATE INDEX IF NOT EXISTS idx_flagged_wins_status ON flagged_wins(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_device_fp ON users(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_user ON rate_limits(user_id, action);

-- Seed default config
INSERT INTO platform_config (key, value, updated_at) VALUES
('global', '{"killSwitchEnabled": false, "bonusFirstDepositPercent": 10, "bonusFirstDepositCapSantim": 5000, "referralBonusSantim": 500, "maxCardsPerPlayer": 6, "winSlaMinutes": 30}'::jsonb, EXTRACT(EPOCH FROM NOW()) * 1000)
ON CONFLICT (key) DO NOTHING;

-- Seed default rooms
INSERT INTO rooms (id, tier, entry_fee_santim, mode, type, min_players, max_cards, status, player_count, pot_santim, created_at)
VALUES 
('room-bronze-default', 'bronze', 1000, 'auto', 'open', 2, 6, 'waiting', 0, 0, EXTRACT(EPOCH FROM NOW()) * 1000),
('room-silver-default', 'silver', 5000, 'auto', 'open', 3, 6, 'waiting', 0, 0, EXTRACT(EPOCH FROM NOW()) * 1000)
ON CONFLICT (id) DO NOTHING;

