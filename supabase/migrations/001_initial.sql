-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── Profiles ────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id              uuid primary key references auth.users on delete cascade,
  username        text unique not null,
  display_name    text not null default '',
  avatar_url      text,
  xp              integer not null default 0,
  games_played    integer not null default 0,
  wins            integer not null default 0,
  best_score      integer not null default 0,
  updated_at      timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── XP helper function ───────────────────────────────────────────────────────
create or replace function public.add_xp(user_id uuid, amount integer)
returns void language plpgsql security definer as $$
begin
  update public.profiles set xp = xp + amount where id = user_id;
end;
$$;

-- ── Games ────────────────────────────────────────────────────────────────────
create table if not exists public.games (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.profiles(id) on delete cascade,
  mode        text not null default 'solo',
  total       integer not null default 0,
  scores      jsonb,
  created_at  timestamptz default now()
);

create index if not exists games_user_id_idx   on public.games(user_id);
create index if not exists games_created_at_idx on public.games(created_at);
create index if not exists games_total_idx      on public.games(total desc);

-- ── Rooms ────────────────────────────────────────────────────────────────────
create table if not exists public.rooms (
  id              uuid primary key default uuid_generate_v4(),
  code            text unique not null,
  name            text not null,
  host_id         uuid references public.profiles(id) on delete cascade,
  mode            text not null default 'multiplayer',
  max_players     integer not null default 4,
  current_players integer not null default 1,
  status          text not null default 'waiting',
  is_private      boolean not null default false,
  created_at      timestamptz default now()
);

-- ── Tournaments ──────────────────────────────────────────────────────────────
create table if not exists public.tournaments (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  format          text not null default 'swiss',
  status          text not null default 'upcoming',
  max_players     integer not null default 16,
  current_players integer not null default 0,
  entry_fee       integer not null default 0,
  prize_pool      integer not null default 0,
  starts_at       timestamptz not null,
  created_at      timestamptz default now()
);

-- ── Tournament standings ─────────────────────────────────────────────────────
create table if not exists public.tournament_standings (
  id            uuid primary key default uuid_generate_v4(),
  tournament_id uuid references public.tournaments(id) on delete cascade,
  user_id       uuid references public.profiles(id) on delete cascade,
  score         integer not null default 0,
  rank          integer,
  created_at    timestamptz default now(),
  unique(tournament_id, user_id)
);

-- ── Achievements ─────────────────────────────────────────────────────────────
create table if not exists public.achievements (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.profiles(id) on delete cascade,
  key         text not null,
  earned_at   timestamptz default now(),
  unique(user_id, key)
);

-- ── Row Level Security ───────────────────────────────────────────────────────
alter table public.profiles          enable row level security;
alter table public.games             enable row level security;
alter table public.rooms             enable row level security;
alter table public.tournaments       enable row level security;
alter table public.tournament_standings enable row level security;
alter table public.achievements      enable row level security;

-- Profiles: anyone can read, only owner can write
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- Games: owner can read/write
create policy "games_select" on public.games for select using (auth.uid() = user_id);
create policy "games_insert" on public.games for insert with check (auth.uid() = user_id);

-- Rooms: public rooms visible to all, private only to members
create policy "rooms_select_public"  on public.rooms for select using (is_private = false or host_id = auth.uid());
create policy "rooms_insert"         on public.rooms for insert with check (auth.uid() = host_id);
create policy "rooms_update_host"    on public.rooms for update using (auth.uid() = host_id);

-- Tournaments: visible to all, writable by authenticated users
create policy "tournaments_select"   on public.tournaments for select using (true);
create policy "tournaments_insert"   on public.tournaments for insert with check (auth.uid() is not null);

-- Standings: visible to all
create policy "standings_select"     on public.tournament_standings for select using (true);
create policy "standings_insert"     on public.tournament_standings for insert with check (auth.uid() = user_id);

-- Achievements: visible to all, writable by service role only (via functions)
create policy "achievements_select"  on public.achievements for select using (true);
create policy "achievements_insert"  on public.achievements for insert with check (auth.uid() = user_id);
