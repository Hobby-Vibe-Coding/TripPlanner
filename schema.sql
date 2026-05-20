-- Trip Planner — Neon (PostgreSQL) schema
-- Run this once in the Neon SQL Editor before first deployment.

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL      PRIMARY KEY,
  username      TEXT        NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_data (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  data    TEXT    NOT NULL DEFAULT '{"trips":[],"settings":{"theme":"beach","currency":"USD"}}'
);

CREATE TABLE IF NOT EXISTS share_tokens (
  token      TEXT        PRIMARY KEY,
  user_id    INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trip_id    TEXT        NOT NULL,
  mode       TEXT        NOT NULL DEFAULT 'read',  -- 'read' | 'edit'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Migration for existing deployments ────────────────────────────────────────
-- Run these statements in order in the Neon SQL Editor when upgrading from the
-- single-password version. They are safe to run multiple times (IF NOT EXISTS /
-- ON CONFLICT guards). After running, register your account in the app — the
-- first registration (user_id = 1) auto-migrates the old app_data row and
-- existing share_tokens to your account.

-- 1. Create the users table (above, already idempotent via IF NOT EXISTS)

-- 2. Add user_id to app_data (drop old singleton constraint first)
--    ALTER TABLE app_data DROP CONSTRAINT IF EXISTS app_data_pkey;
--    ALTER TABLE app_data DROP CONSTRAINT IF EXISTS app_data_id_check;
--    ALTER TABLE app_data ADD COLUMN IF NOT EXISTS user_id INTEGER;
--    -- After first registration, the app will populate this correctly.
--    -- Then you can drop the old id column:
--    -- ALTER TABLE app_data DROP COLUMN IF EXISTS id;

-- 3. Add user_id to share_tokens
--    ALTER TABLE share_tokens ADD COLUMN IF NOT EXISTS user_id INTEGER;

-- NOTE: For a clean new deployment, the CREATE TABLE statements above are all
-- you need. The migration path above is only for upgrading an existing instance.
