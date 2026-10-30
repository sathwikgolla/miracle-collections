-- 19. add url, description, tag to youtube_videos
-- ----------------------------------------------------------------------------
alter table public.youtube_videos
  add column if not exists url text,
  add column if not exists description text,
  add column if not exists tag text;
