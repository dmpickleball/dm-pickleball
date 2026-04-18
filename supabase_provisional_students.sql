-- ============================================================
-- DM Pickleball — Provisional Student Accounts Migration
-- Run this in Supabase > SQL Editor
-- Adds columns for auto-created accounts from Google Calendar
-- ============================================================

-- Add provisional/source tracking columns to students table
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS provisional    BOOLEAN   NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS source         TEXT      NOT NULL DEFAULT 'self_registered',
  ADD COLUMN IF NOT EXISTS calendar_name  TEXT               DEFAULT '';

-- Index for quick lookup of provisional accounts
CREATE INDEX IF NOT EXISTS idx_students_provisional ON students (provisional) WHERE provisional = true;
CREATE INDEX IF NOT EXISTS idx_students_source      ON students (source);

-- page_views table (for traffic tracking — create if it doesn't exist yet)
CREATE TABLE IF NOT EXISTS page_views (
  id          BIGSERIAL PRIMARY KEY,
  page        TEXT        NOT NULL,
  referrer    TEXT,
  session_id  TEXT        NOT NULL,
  device_type TEXT,
  country     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_views (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_session ON page_views (session_id);
