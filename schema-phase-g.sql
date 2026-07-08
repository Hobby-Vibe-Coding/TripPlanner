-- Phase G: Subtasks under Tasks.
-- Run this in the Neon SQL Editor BEFORE deploying the updated API.
-- All statements are IF NOT EXISTS — safe to re-run.

CREATE TABLE IF NOT EXISTS trip_subtasks (
  id            TEXT PRIMARY KEY,
  task_id       TEXT NOT NULL REFERENCES trip_tasks(id) ON DELETE CASCADE,
  title         TEXT NOT NULL DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'pending',
  subtask_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS trip_subtask_assignees (
  subtask_id TEXT NOT NULL REFERENCES trip_subtasks(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  PRIMARY KEY (subtask_id, name)
);
CREATE INDEX IF NOT EXISTS idx_trip_subtasks_task ON trip_subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_trip_subtask_assignees_subtask ON trip_subtask_assignees(subtask_id);
