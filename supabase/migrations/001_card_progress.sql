-- Saves each person's progress on each card (scratched, completed, journal, photo).
-- Run this once in Supabase: SQL Editor → New query → paste → Run.

create table if not exists public.card_progress (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  card_number int not null check (card_number between 1 and 200),
  scratched_at timestamptz,
  completed_at timestamptz,
  journal text,
  photo_path text,
  updated_at timestamptz not null default now(),
  primary key (user_id, card_number)
);

-- Row Level Security: each person can only see and change their own rows.
alter table public.card_progress enable row level security;

create policy "Read own progress" on public.card_progress
  for select to authenticated using (auth.uid() = user_id);
create policy "Add own progress" on public.card_progress
  for insert to authenticated with check (auth.uid() = user_id);
create policy "Update own progress" on public.card_progress
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Delete own progress" on public.card_progress
  for delete to authenticated using (auth.uid() = user_id);

grant select, insert, update, delete on public.card_progress to authenticated;
