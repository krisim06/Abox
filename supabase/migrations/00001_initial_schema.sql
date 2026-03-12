-- ABox Initial Schema
-- Tables: users, contents, likes, follows

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================
-- USERS
-- ============================================
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  bio text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create index idx_users_username on public.users(username);

-- ============================================
-- CONTENTS
-- ============================================
create table public.contents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  image_url text not null,
  prompt text not null,
  model text not null,
  seed text,
  parent_content_id uuid references public.contents(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_contents_user_id on public.contents(user_id);
create index idx_contents_created_at on public.contents(created_at desc);
create index idx_contents_parent_content_id on public.contents(parent_content_id);

-- ============================================
-- LIKES
-- ============================================
create table public.likes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  content_id uuid not null references public.contents(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, content_id)
);

create index idx_likes_content_id on public.likes(content_id);
create index idx_likes_user_id on public.likes(user_id);

-- ============================================
-- FOLLOWS
-- ============================================
create table public.follows (
  id uuid primary key default uuid_generate_v4(),
  follower_id uuid not null references public.users(id) on delete cascade,
  following_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(follower_id, following_id),
  check (follower_id != following_id)
);

create index idx_follows_follower_id on public.follows(follower_id);
create index idx_follows_following_id on public.follows(following_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table public.users enable row level security;
alter table public.contents enable row level security;
alter table public.likes enable row level security;
alter table public.follows enable row level security;

-- Users: public read, self insert/update
create policy "Users are publicly readable"
  on public.users for select using (true);

create policy "Users can insert their own profile"
  on public.users for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.users for update using (auth.uid() = id);

-- Contents: public read, authenticated insert, owner delete
create policy "Contents are publicly readable"
  on public.contents for select using (true);

create policy "Authenticated users can create content"
  on public.contents for insert with check (auth.uid() = user_id);

create policy "Users can delete their own content"
  on public.contents for delete using (auth.uid() = user_id);

create policy "Users can update their own content"
  on public.contents for update using (auth.uid() = user_id);

-- Likes: public read, authenticated insert/delete own
create policy "Likes are publicly readable"
  on public.likes for select using (true);

create policy "Authenticated users can like"
  on public.likes for insert with check (auth.uid() = user_id);

create policy "Users can remove their own likes"
  on public.likes for delete using (auth.uid() = user_id);

-- Follows: public read, authenticated insert/delete own
create policy "Follows are publicly readable"
  on public.follows for select using (true);

create policy "Authenticated users can follow"
  on public.follows for insert with check (auth.uid() = follower_id);

create policy "Users can unfollow"
  on public.follows for delete using (auth.uid() = follower_id);

-- ============================================
-- STORAGE BUCKET
-- ============================================

insert into storage.buckets (id, name, public)
values ('content-images', 'content-images', true)
on conflict (id) do nothing;

create policy "Anyone can read content images"
  on storage.objects for select
  using (bucket_id = 'content-images');

create policy "Authenticated users can upload content images"
  on storage.objects for insert
  with check (bucket_id = 'content-images' and auth.role() = 'authenticated');

create policy "Users can delete their own content images"
  on storage.objects for delete
  using (bucket_id = 'content-images' and auth.uid()::text = (storage.foldername(name))[1]);
