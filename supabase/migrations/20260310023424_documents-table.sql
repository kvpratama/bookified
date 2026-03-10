create extension if not exists "pgcrypto";

create table documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  size bigint not null check (size > 0),
  blob_url text not null,
  thumbnail_url text,
  author text,
  page_count integer,
  upload_date timestamptz not null default now(),
  last_accessed timestamptz,
  current_page integer not null default 1 check (current_page >= 1)
);

create index idx_documents_upload_date on documents(user_id, upload_date desc);
create index idx_documents_last_accessed on documents(user_id, last_accessed desc nulls last);

alter table documents enable row level security;

create policy "Users can read own documents"
  on documents for select using ((select auth.uid()) = user_id);
create policy "Users can insert own documents"
  on documents for insert with check ((select auth.uid()) = user_id);
create policy "Users can update own documents"
  on documents for update using ((select auth.uid()) = user_id);
create policy "Users can delete own documents"
  on documents for delete using ((select auth.uid()) = user_id);