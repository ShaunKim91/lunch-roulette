create table if not exists public.votes (
  id bigint generated always as identity primary key,
  menu text not null check (char_length(menu) between 1 and 20),
  room text not null default '우리 팀' check (char_length(room) between 1 and 24),
  created_at timestamptz not null default now()
);

alter table public.votes enable row level security;

create policy "anyone can read votes"
  on public.votes for select
  to anon
  using (true);

create policy "anyone can add votes"
  on public.votes for insert
  to anon
  with check (true);

create index if not exists votes_room_created_at_idx
  on public.votes (room, created_at desc);
