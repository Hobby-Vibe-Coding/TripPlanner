-- Phase E: Relational tables to replace the app_data JSON blob.
-- Run this in the Neon SQL Editor BEFORE deploying the updated API.
-- All statements are IF NOT EXISTS — safe to re-run.

-- ── User settings (replaces settings embedded in app_data) ────────────────────
CREATE TABLE IF NOT EXISTS user_settings (
  user_id   INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme     TEXT NOT NULL DEFAULT 'beach',
  currency  TEXT NOT NULL DEFAULT 'USD'
);

-- ── Trips ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trips (
  id                  TEXT PRIMARY KEY,
  user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title               TEXT NOT NULL DEFAULT '',
  destination         TEXT NOT NULL DEFAULT '',
  dest_lat            DOUBLE PRECISION,
  dest_lng            DOUBLE PRECISION,
  emoji               TEXT NOT NULL DEFAULT '✈️',
  start_date          TEXT NOT NULL DEFAULT '',
  end_date            TEXT NOT NULL DEFAULT '',
  budget              NUMERIC(14,2),
  timezone            TEXT NOT NULL DEFAULT '',
  created_at          TEXT NOT NULL DEFAULT '',
  memory_line         TEXT NOT NULL DEFAULT '',
  drive_folder_id     TEXT,
  drive_thumbnail_id  TEXT,
  drive_thumbnail_url TEXT,
  my_traveler         TEXT,
  time_slots          JSONB NOT NULL DEFAULT '[]',
  trip_order          INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS trips_user_id_idx ON trips(user_id);

-- ── Travelers ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trip_travelers (
  id      SERIAL PRIMARY KEY,
  trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name    TEXT NOT NULL,
  pos     INTEGER NOT NULL DEFAULT 0
);

-- ── Groups ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trip_groups (
  id      TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name    TEXT NOT NULL DEFAULT '',
  pos     INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS trip_group_members (
  group_id TEXT NOT NULL REFERENCES trip_groups(id) ON DELETE CASCADE,
  name     TEXT NOT NULL,
  pos      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (group_id, name)
);

-- ── Itinerary ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS itinerary_days (
  id        TEXT PRIMARY KEY,
  trip_id   TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  day_index INTEGER NOT NULL,
  theme     TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS itinerary_slots (
  id             SERIAL PRIMARY KEY,
  day_id         TEXT NOT NULL REFERENCES itinerary_days(id) ON DELETE CASCADE,
  slot_index     INTEGER NOT NULL,
  time_label     TEXT NOT NULL DEFAULT '',
  activity       TEXT NOT NULL DEFAULT '',
  address        TEXT NOT NULL DEFAULT '',
  span           INTEGER NOT NULL DEFAULT 1,
  reservation_id TEXT
);

-- ── Expenses ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id            TEXT PRIMARY KEY,
  trip_id       TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name          TEXT NOT NULL DEFAULT '',
  category      TEXT NOT NULL DEFAULT '',
  cost          NUMERIC(14,2) NOT NULL DEFAULT 0,
  expense_date  TEXT NOT NULL DEFAULT '',
  note          TEXT NOT NULL DEFAULT '',
  split_method  TEXT NOT NULL DEFAULT 'equal',
  split_details JSONB NOT NULL DEFAULT '{}',
  exp_order     INTEGER NOT NULL DEFAULT 0
);
-- Merges paidBy / splitAmong / settledBy into a single participant row per person
CREATE TABLE IF NOT EXISTS expense_participants (
  expense_id  TEXT NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  is_payer    BOOLEAN NOT NULL DEFAULT FALSE,
  is_splitter BOOLEAN NOT NULL DEFAULT FALSE,
  is_settled  BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (expense_id, name)
);

-- ── Packing ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS packing_categories (
  id      TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name    TEXT NOT NULL DEFAULT '',
  pos     INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS packing_items (
  id          TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES packing_categories(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT '',
  packed      BOOLEAN NOT NULL DEFAULT FALSE,
  pos         INTEGER NOT NULL DEFAULT 0
);

-- ── Reservations ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reservations (
  id        TEXT PRIMARY KEY,
  trip_id   TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name      TEXT NOT NULL DEFAULT '',
  status    TEXT NOT NULL DEFAULT 'pending',
  due_date  TEXT NOT NULL DEFAULT '',
  conf_num  TEXT NOT NULL DEFAULT '',
  link      TEXT NOT NULL DEFAULT '',
  note      TEXT NOT NULL DEFAULT '',
  res_order INTEGER NOT NULL DEFAULT 0
);

-- ── Notes ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notes (
  id         TEXT PRIMARY KEY,
  trip_id    TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  note_text  TEXT NOT NULL DEFAULT '',
  note_order INTEGER NOT NULL DEFAULT 0
);

-- ── Traveler schedule (join/leave days) ────────────────────────────────────────
-- Stored as JSONB column on trips: { "Daddy": { joinDay: 2, leaveDay: 5 }, ... }
ALTER TABLE trips ADD COLUMN IF NOT EXISTS traveler_schedule JSONB NOT NULL DEFAULT '{}';

-- ── Tasks ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trip_tasks (
  id          TEXT PRIMARY KEY,
  trip_id     TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  title       TEXT NOT NULL DEFAULT '',
  assigned_to TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'pending',
  due_date    TEXT NOT NULL DEFAULT '',
  task_order  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_trip_tasks_trip ON trip_tasks(trip_id);

-- ── Announcements ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trip_announcements (
  id        TEXT PRIMARY KEY,
  trip_id   TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  ann_text  TEXT NOT NULL DEFAULT '',
  pinned    BOOLEAN NOT NULL DEFAULT FALSE,
  ann_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_trip_announcements_trip ON trip_announcements(trip_id);

-- ── Document Vault ─────────────────────────────────────────────────────────────
-- blob_url is the Vercel Blob internal URL — never sent to clients directly.
-- All file access goes through /api/docs/file/:id which verifies JWT ownership.
CREATE TABLE IF NOT EXISTS documents (
  id          TEXT PRIMARY KEY,
  trip_id     TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename    TEXT NOT NULL DEFAULT '',
  label       TEXT NOT NULL DEFAULT '',
  mime_type   TEXT NOT NULL DEFAULT '',
  size_bytes  INTEGER NOT NULL DEFAULT 0,
  blob_url    TEXT NOT NULL DEFAULT '',
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_documents_trip ON documents(trip_id, user_id);
