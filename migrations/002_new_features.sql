-- ============================================================
-- Migration 002: New Feature Tables
-- Finance Dashboard — Backend Intern Assignment
-- Run this after the initial schema is set up.
-- ============================================================

-- -----------------------------------------------------------
-- 1. TOKEN BLACKLIST (Secure logout / JWT invalidation)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS token_blacklist (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jti         VARCHAR(255) UNIQUE NOT NULL,
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_jti ON token_blacklist(jti);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires ON token_blacklist(expires_at);

-- -----------------------------------------------------------
-- 2. API KEYS (Service-to-service authentication)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS api_keys (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
    label       VARCHAR(100) NOT NULL,
    key_hash    VARCHAR(255) UNIQUE NOT NULL,
    key_prefix  VARCHAR(10) NOT NULL,
    permissions JSONB DEFAULT '["read"]',
    last_used_at TIMESTAMPTZ,
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);

-- -----------------------------------------------------------
-- 3. AUDIT LOGS (Activity trail for all operations)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    user_email  VARCHAR(255),
    action      VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id   UUID,
    old_value   JSONB,
    new_value   JSONB,
    ip_address  VARCHAR(45),
    user_agent  VARCHAR(500),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);

-- -----------------------------------------------------------
-- 4. BUDGETS (Spending limits per category)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS budgets (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    amount_limit NUMERIC(12,2) NOT NULL CHECK (amount_limit > 0),
    period      VARCHAR(10) NOT NULL CHECK (period IN ('monthly', 'yearly')),
    created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(category_id, period)
);
CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category_id);

-- -----------------------------------------------------------
-- 5. TAGS (Flexible labelling for transactions)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS tags (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(50) UNIQUE NOT NULL,
    created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transaction_tags (
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    tag_id         UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (transaction_id, tag_id)
);
CREATE INDEX IF NOT EXISTS idx_tx_tags_tx ON transaction_tags(transaction_id);
CREATE INDEX IF NOT EXISTS idx_tx_tags_tag ON transaction_tags(tag_id);

-- -----------------------------------------------------------
-- 6. RECURRING TRANSACTIONS (Scheduling support)
-- -----------------------------------------------------------
ALTER TABLE transactions
    ADD COLUMN IF NOT EXISTS is_recurring     BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS recurrence_interval VARCHAR(10) CHECK (recurrence_interval IN ('daily','weekly','monthly','yearly')),
    ADD COLUMN IF NOT EXISTS next_due_date    DATE,
    ADD COLUMN IF NOT EXISTS parent_tx_id    UUID REFERENCES transactions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tx_recurring ON transactions(is_recurring, next_due_date) WHERE is_recurring = true;

-- -----------------------------------------------------------
-- 7. ADD JTI column to support token blacklist (if needed separately)
-- -----------------------------------------------------------
-- Note: jti is embedded in the JWT payload, no DB column needed on users.

-- -----------------------------------------------------------
-- 8. IMPORT HISTORY (Track bulk import sessions)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS import_history (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
    filename     VARCHAR(255),
    total_rows   INTEGER DEFAULT 0,
    success_rows INTEGER DEFAULT 0,
    failed_rows  INTEGER DEFAULT 0,
    errors       JSONB DEFAULT '[]',
    created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_import_user ON import_history(user_id);
