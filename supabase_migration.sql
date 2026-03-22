-- ============================================================
-- DM Pickleball — Supabase Migration
-- Run this in Supabase > SQL Editor
-- Adds skill/DUPR/comm_email fields to access_requests & students
-- ============================================================

-- 1. access_requests table: add new registration fields
ALTER TABLE access_requests
  ADD COLUMN IF NOT EXISTS first_name   TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS last_name    TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS comm_email   TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS skill_level  TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS dupr_rating  TEXT NOT NULL DEFAULT '';

-- 2. students table: add new profile fields
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS comm_email   TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS skill_level  TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS dupr_rating  TEXT NOT NULL DEFAULT '';

-- Backfill first_name / last_name in students from existing name column
-- (already present from previous migration, but just in case)
UPDATE students
  SET first_name = SPLIT_PART(name, ' ', 1),
      last_name  = SUBSTRING(name FROM POSITION(' ' IN name) + 1)
  WHERE (first_name IS NULL OR first_name = '')
    AND name IS NOT NULL AND name <> '';
