create table if not exists public.stratbook_chat_threads (
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  title text not null default 'Strategist thread',
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_id, project_id)
);

alter table public.stratbook_chat_threads
  add column if not exists id text;

alter table public.stratbook_chat_threads
  add column if not exists title text not null default 'Strategist thread';

alter table public.stratbook_chat_threads
  alter column id set default 'default';

update public.stratbook_chat_threads
set id = 'default'
where id is null;

alter table public.stratbook_chat_threads
  alter column id set not null;

alter table public.stratbook_chat_threads
  drop constraint if exists stratbook_chat_threads_pkey;

alter table public.stratbook_chat_threads
  add primary key (owner_id, project_id, id);

create index if not exists stratbook_chat_threads_updated_at_idx
  on public.stratbook_chat_threads (updated_at desc);

create index if not exists stratbook_chat_threads_project_updated_at_idx
  on public.stratbook_chat_threads (owner_id, project_id, updated_at desc);

create table if not exists public.stratbook_chat_usage (
  owner_id uuid not null references auth.users(id) on delete cascade,
  month date not null,
  message_count integer not null default 0 check (message_count >= 0),
  message_limit integer not null default 500 check (message_limit > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_id, month)
);

create table if not exists public.stratbook_chat_usage_events (
  id bigint generated always as identity primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null,
  month date not null,
  created_at timestamptz not null default now()
);

create index if not exists stratbook_chat_usage_events_owner_month_idx
  on public.stratbook_chat_usage_events (owner_id, month, created_at desc);

create or replace function public.stratbook_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists stratbook_chat_threads_touch_updated_at
  on public.stratbook_chat_threads;

create trigger stratbook_chat_threads_touch_updated_at
before update on public.stratbook_chat_threads
for each row
execute function public.stratbook_touch_updated_at();

drop trigger if exists stratbook_chat_usage_touch_updated_at
  on public.stratbook_chat_usage;

create trigger stratbook_chat_usage_touch_updated_at
before update on public.stratbook_chat_usage
for each row
execute function public.stratbook_touch_updated_at();

drop function if exists public.stratbook_record_chat_message_use(uuid, text, integer);

create or replace function public.stratbook_record_chat_message_use(
  p_owner_id uuid,
  p_project_id text,
  p_limit integer default 500
)
returns table (
  out_accepted boolean,
  out_count integer,
  out_message_limit integer,
  out_month text,
  out_remaining integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_month date := date_trunc('month', now())::date;
  v_count integer;
  v_limit integer;
  v_updated_count integer;
begin
  insert into public.stratbook_chat_usage (owner_id, month, message_count, message_limit)
  values (p_owner_id, v_month, 0, p_limit)
  on conflict on constraint stratbook_chat_usage_pkey do nothing;

  update public.stratbook_chat_usage
  set
    message_count = public.stratbook_chat_usage.message_count + 1,
    message_limit = p_limit
  where public.stratbook_chat_usage.owner_id = p_owner_id
    and public.stratbook_chat_usage.month = v_month
    and public.stratbook_chat_usage.message_count < public.stratbook_chat_usage.message_limit;

  get diagnostics v_updated_count = row_count;

  select public.stratbook_chat_usage.message_count, public.stratbook_chat_usage.message_limit
  into v_count, v_limit
  from public.stratbook_chat_usage
  where public.stratbook_chat_usage.owner_id = p_owner_id
    and public.stratbook_chat_usage.month = v_month;

  if v_updated_count > 0 then
    insert into public.stratbook_chat_usage_events (owner_id, project_id, month)
    values (p_owner_id, p_project_id, v_month);

    return query
      select true, v_count, v_limit, to_char(v_month, 'YYYY-MM'), greatest(0, v_limit - v_count);
    return;
  end if;

  return query
    select false, v_count, v_limit, to_char(v_month, 'YYYY-MM'), greatest(0, v_limit - v_count);
end;
$$;

revoke all on function public.stratbook_record_chat_message_use(uuid, text, integer)
  from public;

grant execute on function public.stratbook_record_chat_message_use(uuid, text, integer)
  to service_role;

alter table public.stratbook_chat_threads enable row level security;
alter table public.stratbook_chat_usage enable row level security;
alter table public.stratbook_chat_usage_events enable row level security;

drop policy if exists "Users can read their chat threads"
  on public.stratbook_chat_threads;

create policy "Users can read their chat threads"
  on public.stratbook_chat_threads
  for select
  to authenticated
  using (auth.uid() = owner_id);

drop policy if exists "Users can write their chat threads"
  on public.stratbook_chat_threads;

create policy "Users can write their chat threads"
  on public.stratbook_chat_threads
  for insert
  to authenticated
  with check (auth.uid() = owner_id);

drop policy if exists "Users can update their chat threads"
  on public.stratbook_chat_threads;

create policy "Users can update their chat threads"
  on public.stratbook_chat_threads
  for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "Users can read their chat usage"
  on public.stratbook_chat_usage;

create policy "Users can read their chat usage"
  on public.stratbook_chat_usage
  for select
  to authenticated
  using (auth.uid() = owner_id);

drop policy if exists "Users can read their chat usage events"
  on public.stratbook_chat_usage_events;

create policy "Users can read their chat usage events"
  on public.stratbook_chat_usage_events
  for select
  to authenticated
  using (auth.uid() = owner_id);
