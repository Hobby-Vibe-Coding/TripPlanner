-- Phase F: Multi-assignee support for Tasks and Packing items.
-- Run this in the Neon SQL Editor BEFORE deploying the updated API.
-- All statements are IF NOT EXISTS / idempotent — safe to re-run.

CREATE TABLE IF NOT EXISTS trip_task_assignees (
  task_id TEXT NOT NULL REFERENCES trip_tasks(id) ON DELETE CASCADE,
  name    TEXT NOT NULL,
  PRIMARY KEY (task_id, name)
);
CREATE TABLE IF NOT EXISTS packing_item_assignees (
  item_id TEXT NOT NULL REFERENCES packing_items(id) ON DELETE CASCADE,
  name    TEXT NOT NULL,
  PRIMARY KEY (item_id, name)
);
CREATE INDEX IF NOT EXISTS idx_trip_task_assignees_task ON trip_task_assignees(task_id);
CREATE INDEX IF NOT EXISTS idx_packing_item_assignees_item ON packing_item_assignees(item_id);

-- Backfill existing single-assignee tasks into the join table.
-- (packing_items has no legacy assignee column, so nothing to backfill there.)
INSERT INTO trip_task_assignees (task_id, name)
  SELECT id, assigned_to FROM trip_tasks WHERE assigned_to != ''
  ON CONFLICT DO NOTHING;
