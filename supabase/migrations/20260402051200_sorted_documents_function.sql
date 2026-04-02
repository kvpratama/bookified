-- Function to fetch documents with custom sorting and pagination
create or replace function get_sorted_documents(
  search_query text default null,
  limit_count int default null,
  offset_count int default 0
)
returns table (
  id uuid,
  name text,
  author text,
  thumbnail_url text,
  upload_date timestamptz,
  last_accessed timestamptz,
  page_count integer,
  current_page integer,
  total_count bigint
) 
language plpgsql
security definer
as $$
declare
  user_uuid uuid;
begin
  user_uuid := auth.uid();
  
  if user_uuid is null then
    raise exception 'Not authenticated';
  end if;

  return query
  with filtered_docs as (
    select 
      d.id,
      d.name,
      d.author,
      d.thumbnail_url,
      d.upload_date,
      d.last_accessed,
      d.page_count,
      d.current_page,
      case 
        when d.last_accessed is null and d.upload_date >= now() - interval '7 days' then 0
        when d.last_accessed is not null then 1
        else 2
      end as sort_bucket
    from documents d
    where d.user_id = user_uuid
      and (
        search_query is null 
        or d.name ilike '%' || search_query || '%'
        or d.author ilike '%' || search_query || '%'
      )
  ),
  total as (
    select count(*) as cnt from filtered_docs
  )
  select 
    f.id,
    f.name,
    f.author,
    f.thumbnail_url,
    f.upload_date,
    f.last_accessed,
    f.page_count,
    f.current_page,
    t.cnt as total_count
  from filtered_docs f
  cross join total t
  order by f.sort_bucket, coalesce(f.last_accessed, f.upload_date) desc
  limit limit_count
  offset offset_count;
end;
$$;
