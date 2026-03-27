CREATE TABLE blocked_times (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  start_time  TIMESTAMPTZ NOT NULL,
  end_time    TIMESTAMPTZ NOT NULL,
  reason      TEXT,
  recurring   BOOLEAN NOT NULL DEFAULT FALSE,
  recurrence_rule TEXT
);
CREATE INDEX idx_blocked_times_range ON blocked_times (start_time, end_time);
