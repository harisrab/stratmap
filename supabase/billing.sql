create table if not exists public.stratbook_billing_customers (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  price_id text,
  status text not null default 'free',
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists stratbook_billing_customers_stripe_customer_idx
  on public.stratbook_billing_customers (stripe_customer_id);

create or replace function public.stratbook_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists stratbook_billing_customers_touch_updated_at
  on public.stratbook_billing_customers;

create trigger stratbook_billing_customers_touch_updated_at
before update on public.stratbook_billing_customers
for each row
execute function public.stratbook_touch_updated_at();

alter table public.stratbook_billing_customers enable row level security;

drop policy if exists "Users can read their billing profile"
  on public.stratbook_billing_customers;

create policy "Users can read their billing profile"
  on public.stratbook_billing_customers
  for select
  to authenticated
  using (auth.uid() = owner_id);
