-- Run this in the Supabase SQL editor

CREATE TABLE IF NOT EXISTS public.news_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  summary     text,
  url         text NOT NULL,
  source      text,
  category    text DEFAULT 'general',   -- 'tournament' | 'tips' | 'gear' | 'general'
  status      text DEFAULT 'published', -- 'published' | 'hidden'
  likes       int  DEFAULT 0,
  dislikes    int  DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

-- Index for fast recent-items queries
CREATE INDEX IF NOT EXISTS idx_news_items_created   ON public.news_items (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_items_status    ON public.news_items (status);

-- Unique URL constraint for deduplication
CREATE UNIQUE INDEX IF NOT EXISTS idx_news_items_url ON public.news_items (url);

-- Enable RLS (service role key bypasses it server-side)
ALTER TABLE public.news_items ENABLE ROW LEVEL SECURITY;

-- Allow public read of published items
CREATE POLICY "Public can read published news"
  ON public.news_items FOR SELECT
  USING (status = 'published');

-- Add image_url column (run once if table already exists)
ALTER TABLE public.news_items ADD COLUMN IF NOT EXISTS image_url text;

-- Auto-cleanup: delete items older than 90 days (optional — run manually or via cron)
-- DELETE FROM public.news_items WHERE created_at < now() - interval '90 days';
