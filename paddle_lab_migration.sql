-- ============================================================
-- DM Pickleball — Paddle Lab Migration
-- Run this in Supabase > SQL Editor
-- Creates the paddle_measurements table for Brifidi SW1 data
-- ============================================================

CREATE TABLE IF NOT EXISTS paddle_measurements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Paddle identity
  brand           TEXT NOT NULL,
  model           TEXT NOT NULL,
  colorway        TEXT NOT NULL DEFAULT '',

  -- Modification phase
  phase           TEXT NOT NULL DEFAULT 'before'
                  CHECK (phase IN ('before', 'after')),
  mod_type        TEXT NOT NULL DEFAULT '',   -- e.g. "Lead tape 3/9 o'clock"
  mod_notes       TEXT NOT NULL DEFAULT '',   -- extra detail on the mod

  -- Brifidi SW1 measurements
  static_weight   NUMERIC(6,2),              -- grams
  swing_weight    NUMERIC(6,2),              -- SW1 units (~90–130)
  twist_weight    NUMERIC(6,2),              -- SW1 units (~5–8)
  balance_point   NUMERIC(6,1),              -- mm from butt end

  -- Paddle dimensions (used by optimizer for accurate physics calculations)
  length_mm       NUMERIC(5,1),              -- total paddle length, mm (e.g. 420)
  width_mm        NUMERIC(5,1),              -- paddle face width, mm (e.g. 215)
  thickness_mm    NUMERIC(4,1),              -- core thickness, mm (e.g. 16)

  -- Physical specs
  grip_size       TEXT NOT NULL DEFAULT '',  -- e.g. "4 1/8", "small"
  handle_length   NUMERIC(5,1),              -- mm (e.g. 130)

  -- Free-form notes
  notes           TEXT NOT NULL DEFAULT '',

  -- Date measured
  measured_date   DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Housekeeping
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_paddle_measurements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_paddle_measurements_updated_at ON paddle_measurements;
CREATE TRIGGER trg_paddle_measurements_updated_at
  BEFORE UPDATE ON paddle_measurements
  FOR EACH ROW EXECUTE FUNCTION update_paddle_measurements_updated_at();

-- Unique constraint: same paddle + same phase + same mod_type = duplicate
-- (allows before AND after entries for the same paddle/mod combination)
CREATE UNIQUE INDEX IF NOT EXISTS idx_paddle_measurements_unique
  ON paddle_measurements (
    LOWER(brand),
    LOWER(model),
    LOWER(colorway),
    phase,
    LOWER(mod_type)
  );

-- Fast lookups
CREATE INDEX IF NOT EXISTS idx_paddle_measurements_brand_model
  ON paddle_measurements (LOWER(brand), LOWER(model));

CREATE INDEX IF NOT EXISTS idx_paddle_measurements_date
  ON paddle_measurements (measured_date DESC);

-- Row-level security: service key bypasses, anon key blocked
ALTER TABLE paddle_measurements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON paddle_measurements
  USING (true) WITH CHECK (true);
