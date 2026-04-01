begin;

-- ── 1. pgvector extension ────────────────────────────────────────────────────
create extension if not exists vector with schema extensions;

-- ── 2. documents: ingestion columns ──────────────────────────────────────────
alter table documents
  add column if not exists ingested_at timestamptz default null;
alter table documents
  add column if not exists is_ingesting boolean not null default false;

-- ── Make documents.user_id NOT NULL ──────────────────────────────────────
ALTER TABLE public.documents
  ALTER COLUMN user_id SET NOT NULL;

-- ── Add unique constraint on documents(id, user_id) ──────────────────────
-- Required so the composite FK in step 4 has a target to reference.
-- (id is already the PK, so this is a covering unique index, not redundant data.)
ALTER TABLE public.documents
  ADD CONSTRAINT documents_id_user_id_key UNIQUE (id, user_id);

-- ── 3. document_embeddings table ────────────────────────────────────────────
create table document_embeddings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,
  document_id uuid not null,
  chunk_key   text not null,
  content     text not null,
  embedding   extensions.vector(768) not null,
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  constraint  document_embeddings_document_id_chunk_key_key
              unique (document_id, chunk_key),
  constraint  embeddings_document_owner_fkey
              foreign key (document_id, user_id)
              references public.documents(id, user_id)
              on delete cascade
);

-- ── 4. Row-level security ────────────────────────────────────────────────────
alter table document_embeddings enable row level security;

create policy "Users can read own embeddings"
  on document_embeddings for select
  using ((select auth.uid()) = user_id);

create policy "Users can insert own embeddings"
  on document_embeddings for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own embeddings"
  on document_embeddings for delete
  using ((select auth.uid()) = user_id);

-- ── 5. Indexes ───────────────────────────────────────────────────────────────
create index on document_embeddings (user_id, document_id);

-- ── 6. Similarity-search function ───────────────────────────────────────────
create or replace function match_document_embeddings(
  query_embedding extensions.vector(768),
  filter          jsonb default '{}',
  match_count     int  default 5
)
returns table (id uuid, content text, metadata jsonb, similarity float)
language plpgsql
security invoker
set search_path = extensions, public
as $$
begin
  return query
  select
    de.id,
    de.content,
    de.metadata,
    1 - (de.embedding <=> query_embedding) as similarity
  from public.document_embeddings de
  where
        de.user_id     = (filter->>'user_id')::uuid
    and de.document_id = (filter->>'document_id')::uuid
  order by de.embedding <=> query_embedding
  limit match_count;
end;
$$;

commit;