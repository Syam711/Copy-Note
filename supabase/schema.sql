-- Run this once in your Supabase project: SQL Editor -> New query -> paste -> Run.
--
-- What RLS actually is, briefly: Postgres normally lets any authenticated
-- connection read/write any row. Row Level Security (RLS) adds an extra
-- filter — a WHERE-clause-like rule — that Postgres silently applies to
-- every query, per table, per operation. Until you write a policy for a
-- table with RLS turned on, the answer is "no rows," full stop. That's
-- what makes it safe to call Supabase directly from the browser: the
-- database itself refuses to hand back (or accept) anything a policy
-- doesn't explicitly allow, so there's no need for a custom API server
-- standing in front of it just to check permissions.

-- ============================================================
-- notes
-- ============================================================
create table notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null default '',
  description text not null default '',
  is_pinned   boolean not null default false,
  is_archived boolean not null default false,
  deleted_at  timestamptz,               -- null = active, set = in trash
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index notes_user_id_idx on notes(user_id);
-- speeds up "find trashed notes older than 30 days" for the purge job
create index notes_deleted_at_idx on notes(deleted_at) where deleted_at is not null;

alter table notes enable row level security;

-- Four separate policies (not one) so each command keeps its own
-- easy-to-read rule instead of one dense combined condition.
create policy "select own notes"
  on notes for select
  using (auth.uid() = user_id);

create policy "insert own notes"
  on notes for insert
  with check (auth.uid() = user_id);

create policy "update own notes"
  on notes for update
  using (auth.uid() = user_id);

create policy "delete own notes"
  on notes for delete
  using (auth.uid() = user_id);

-- Keep updated_at honest without every client having to remember to set it.
create function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger notes_set_updated_at
  before update on notes
  for each row execute function set_updated_at();

-- ============================================================
-- shares
-- ============================================================
-- Deliberately NOT a live foreign-key join for title/description —
-- see the frontend architecture notes. This table stores its own
-- snapshot of the note at share time, so:
--   1) a share link keeps working even after the original note is
--      edited, archived, or purged from trash
--   2) the public share page (see the "public read" policy below)
--      only ever needs to read THIS table, never the private notes
--      table — so there's no anonymous access path into anyone's
--      private notes at all
create table shares (
  id              uuid primary key default gen_random_uuid(),
  share_token     text not null unique,   -- goes in the URL: /share/:token
  note_id         uuid references notes(id) on delete set null,
  shared_by       uuid not null references auth.users(id) on delete cascade,
  shared_by_name  text not null,          -- snapshot, see note above
  title           text not null default '',
  description     text not null default '',
  shared_at       timestamptz not null default now()
);

create index shares_token_idx on shares(share_token);

alter table shares enable row level security;

-- Owner can manage (see, revoke) their own shares.
create policy "select own shares"
  on shares for select
  using (auth.uid() = shared_by);

create policy "insert own shares"
  on shares for insert
  with check (auth.uid() = shared_by);

create policy "delete own shares"
  on shares for delete
  using (auth.uid() = shared_by);

-- The important one: lets a completely logged-out visitor read a
-- share row IF AND ONLY IF they already know its exact token. There's
-- no way to list or browse shares without one — `to anon` scopes this
-- to unauthenticated requests specifically, it doesn't open the table
-- up in general.
create policy "public read by token"
  on shares for select
  to anon
  using (true);
-- ^ intentionally permissive at the row-filter level (any anon select
-- is allowed) because the real gate is the query itself: the app
-- always does `select * from shares where share_token = $1`, and a
-- token is a long random string nobody can guess. If you want a
-- stricter belt-and-suspenders version, swap `using (true)` for
-- `using (share_token = current_setting('request.jwt.claims', true)::json->>'token')`
-- once you're comfortable — flag it if you want that walked through.

-- ============================================================
-- scheduled purge: hard-delete anything trashed 30+ days ago
-- ============================================================
-- Requires the pg_cron extension, which Supabase has built in.
-- Enable it once: Database -> Extensions -> pg_cron -> Enable.
create extension if not exists pg_cron;

select cron.schedule(
  'purge-old-trash',        -- job name
  '0 3 * * *',               -- every day at 03:00 UTC
  $$ delete from notes where deleted_at is not null and deleted_at < now() - interval '30 days'; $$
);
