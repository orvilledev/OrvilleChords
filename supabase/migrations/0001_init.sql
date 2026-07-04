-- OrvilleChords — initial schema
-- Run this in the Supabase dashboard: SQL Editor → New query → paste → Run.
-- Safe to re-run: policies and triggers are dropped first.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  role         text not null default 'editor' check (role in ('editor', 'viewer')),
  created_at   timestamptz not null default now()
);

create table if not exists public.songs (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  artist       text not null default '',
  original_key text not null default '',
  tags         text[] not null default '{}',
  body         text not null default '',
  created_by   uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.setlists (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  service_date date,
  items        jsonb not null default '[]'::jsonb,
  created_by   uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- Whether the current user has the 'editor' role. SECURITY DEFINER so the
-- policy check can read profiles without recursing through its own RLS.
create or replace function public.is_editor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.role = 'editor'
  );
$$;

-- Bump updated_at on every row update.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists songs_touch_updated_at on public.songs;
create trigger songs_touch_updated_at
  before update on public.songs
  for each row execute function public.touch_updated_at();

drop trigger if exists setlists_touch_updated_at on public.setlists;
create trigger setlists_touch_updated_at
  before update on public.setlists
  for each row execute function public.touch_updated_at();

-- Create a profile automatically when a user signs up (first team members are editors).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    'editor'
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.songs    enable row level security;
alter table public.setlists enable row level security;

-- Profiles: any signed-in team member can read; you manage your own row.
drop policy if exists "profiles_read" on public.profiles;
create policy "profiles_read" on public.profiles
  for select to authenticated using (true);

drop policy if exists "profiles_write_own" on public.profiles;
create policy "profiles_write_own" on public.profiles
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Songs: everyone signed in can read; only editors can change.
drop policy if exists "songs_read" on public.songs;
create policy "songs_read" on public.songs
  for select to authenticated using (true);

drop policy if exists "songs_insert" on public.songs;
create policy "songs_insert" on public.songs
  for insert to authenticated with check (public.is_editor());

drop policy if exists "songs_update" on public.songs;
create policy "songs_update" on public.songs
  for update to authenticated using (public.is_editor()) with check (public.is_editor());

drop policy if exists "songs_delete" on public.songs;
create policy "songs_delete" on public.songs
  for delete to authenticated using (public.is_editor());

-- Setlists: same rules as songs.
drop policy if exists "setlists_read" on public.setlists;
create policy "setlists_read" on public.setlists
  for select to authenticated using (true);

drop policy if exists "setlists_insert" on public.setlists;
create policy "setlists_insert" on public.setlists
  for insert to authenticated with check (public.is_editor());

drop policy if exists "setlists_update" on public.setlists;
create policy "setlists_update" on public.setlists
  for update to authenticated using (public.is_editor()) with check (public.is_editor());

drop policy if exists "setlists_delete" on public.setlists;
create policy "setlists_delete" on public.setlists
  for delete to authenticated using (public.is_editor());
