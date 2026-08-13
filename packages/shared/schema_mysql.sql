-- MySQL / MariaDB Schema for Bingo Platform
-- Database: gymtragh_bingo

CREATE TABLE IF NOT EXISTS `users` (
    `uid` VARCHAR(64) PRIMARY KEY,
    `phone` VARCHAR(32) NOT NULL UNIQUE,
    `password` VARCHAR(255),
    `display_name` VARCHAR(100) NOT NULL,
    `dob` DATE NOT NULL,
    `kyc_status` VARCHAR(20) DEFAULT 'verified',
    `kyc_doc_type` VARCHAR(32),
    `kyc_doc_id_number` VARCHAR(64),
    `wallet_balance_santim` BIGINT DEFAULT 100000,
    `device_fingerprint` VARCHAR(128),
    `fcm_token` VARCHAR(512),
    `referral_code` VARCHAR(32) UNIQUE,
    `referred_by` VARCHAR(64),
    `is_banned` TINYINT(1) DEFAULT 0,
    `role` VARCHAR(20) DEFAULT 'player',
    `created_at` BIGINT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `rooms` (
    `id` VARCHAR(64) PRIMARY KEY,
    `tier` VARCHAR(20) NOT NULL,
    `entry_fee_santim` BIGINT NOT NULL,
    `mode` VARCHAR(20) DEFAULT 'auto',
    `type` VARCHAR(20) DEFAULT 'open',
    `scheduled_at` BIGINT,
    `min_players` INT DEFAULT 2,
    `max_cards` INT DEFAULT 6,
    `status` VARCHAR(20) DEFAULT 'waiting',
    `player_count` INT DEFAULT 0,
    `pot_santim` BIGINT DEFAULT 0,
    `created_at` BIGINT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `games` (
    `id` VARCHAR(64) PRIMARY KEY,
    `room_id` VARCHAR(64),
    `seed_hash` VARCHAR(128) NOT NULL,
    `sequence` LONGTEXT NOT NULL,
    `called_numbers` LONGTEXT,
    `status` VARCHAR(20) DEFAULT 'active',
    `last_processed_index` INT DEFAULT -1,
    `winners` LONGTEXT,
    `revealed_at` BIGINT,
    `created_at` BIGINT NOT NULL,
    FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `bingo_cards` (
    `id` VARCHAR(64) PRIMARY KEY,
    `room_id` VARCHAR(64),
    `user_id` VARCHAR(64),
    `fingerprint` VARCHAR(128) NOT NULL,
    `numbers_json` LONGTEXT NOT NULL,
    `created_at` BIGINT NOT NULL,
    FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`uid`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `wallet_ledger` (
    `id` VARCHAR(64) PRIMARY KEY,
    `user_id` VARCHAR(64),
    `type` VARCHAR(32) NOT NULL,
    `amount_santim` BIGINT NOT NULL,
    `balance_santim` BIGINT NOT NULL,
    `gateway` VARCHAR(32),
    `transaction_id` VARCHAR(128),
    `game_id` VARCHAR(64),
    `created_at` BIGINT NOT NULL,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`uid`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `flagged_wins` (
    `id` VARCHAR(64) PRIMARY KEY,
    `user_id` VARCHAR(64),
    `card_id` VARCHAR(64),
    `win_tier` VARCHAR(32),
    `amount_santim` BIGINT NOT NULL,
    `reason` VARCHAR(100),
    `status` VARCHAR(32) DEFAULT 'pending_review',
    `flagged_at` BIGINT,
    `processed_at` BIGINT,
    `processed_by` VARCHAR(64),
    `auto_approved` TINYINT(1) DEFAULT 0,
    `created_at` BIGINT NOT NULL,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `withdrawal_requests` (
    `id` VARCHAR(64) PRIMARY KEY,
    `user_id` VARCHAR(64),
    `gateway` VARCHAR(32) NOT NULL,
    `amount_santim` BIGINT NOT NULL,
    `account_details` VARCHAR(255) NOT NULL,
    `status` VARCHAR(32) DEFAULT 'pending',
    `processed_at` BIGINT,
    `processed_by` VARCHAR(64),
    `created_at` BIGINT NOT NULL,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `processed_webhooks` (
    `transaction_id` VARCHAR(128) PRIMARY KEY,
    `gateway` VARCHAR(32) NOT NULL,
    `user_id` VARCHAR(64),
    `amount_santim` BIGINT NOT NULL,
    `signature_valid` TINYINT(1) NOT NULL,
    `processing_result` VARCHAR(32),
    `created_at` BIGINT NOT NULL,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `pending_payments` (
    `id` VARCHAR(64) PRIMARY KEY,
    `user_id` VARCHAR(64),
    `gateway` VARCHAR(32) NOT NULL,
    `amount_santim` BIGINT NOT NULL,
    `payment_ref` VARCHAR(128) NOT NULL,
    `status` VARCHAR(32) DEFAULT 'pending',
    `created_at` BIGINT NOT NULL,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `admin_audit_logs` (
    `id` VARCHAR(64) PRIMARY KEY,
    `actor_id` VARCHAR(64) NOT NULL,
    `role` VARCHAR(20),
    `action_type` VARCHAR(64) NOT NULL,
    `target` VARCHAR(128),
    `before_value` TEXT,
    `after_value` TEXT,
    `timestamp` BIGINT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `rate_limits` (
    `id` VARCHAR(128) PRIMARY KEY,
    `user_id` VARCHAR(64) NOT NULL,
    `action` VARCHAR(32) NOT NULL,
    `attempts` LONGTEXT,
    `updated_at` BIGINT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `platform_config` (
    `key` VARCHAR(64) PRIMARY KEY,
    `value` LONGTEXT NOT NULL,
    `updated_at` BIGINT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed default config & rooms
INSERT IGNORE INTO `platform_config` (`key`, `value`, `updated_at`) VALUES
('global', '{"killSwitchEnabled": false, "bonusFirstDepositPercent": 10, "bonusFirstDepositCapSantim": 5000, "referralBonusSantim": 500, "maxCardsPerPlayer": 6, "winSlaMinutes": 30}', 1700000000000);

INSERT IGNORE INTO `rooms` (`id`, `tier`, `entry_fee_santim`, `mode`, `type`, `min_players`, `max_cards`, `status`, `player_count`, `pot_santim`, `created_at`)
VALUES 
('room-bronze-default', 'bronze', 1000, 'auto', 'open', 2, 6, 'waiting', 0, 0, 1700000000000),
('room-silver-default', 'silver', 5000, 'auto', 'open', 3, 6, 'waiting', 0, 0, 1700000000000);
