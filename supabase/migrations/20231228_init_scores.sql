-- Create highscores table
create table highscores (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  initials text not null check (initials ~ '^[A-Z]{3}$'),
  uid_hash text not null,
  seconds integer not null check (seconds > 0 and seconds < 1000000),
  death_cause text not null check (death_cause in ('STAR', 'HULL', 'POWER')),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create index for leaderboard queries (ORDER BY seconds ASC)
create index highscores_seconds_idx on highscores (seconds asc, created_at asc);

-- Enable Row-Level Security
alter table highscores enable row level security;

-- Policy: Anyone can read leaderboard
create policy "Leaderboard is public"
  on highscores for select
  using (true);

-- Policy: Authenticated users can create their own scores
create policy "Users can submit scores"
  on highscores for insert
  with check (auth.uid() = user_id);

-- Scores are immutable (no update/delete policies = denied by default)
