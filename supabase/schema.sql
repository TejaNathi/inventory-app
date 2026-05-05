-- Inventory app baseline schema for Supabase Postgres

create extension if not exists "pgcrypto";

create type public.user_role as enum ('member','lead','accounts');
create type public.request_status as enum ('pending','approved','rejected','payment_done','delivered');
create type public.log_type as enum ('inward','outward');

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text not null,
  role public.user_role not null default 'member',
  created_at timestamptz not null default now()
);

create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  request_code text unique not null,
  requested_by uuid references public.app_users(id),
  item_name text not null,
  qty numeric(12,2) not null,
  unit text not null,
  purpose text,
  estimated_rate numeric(12,2),
  status public.request_status not null default 'pending',
  approved_by uuid references public.app_users(id),
  approved_at timestamptz,
  payment_done_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.cart_requests (
  id uuid primary key default gen_random_uuid(),
  cart_code text unique not null,
  requested_by uuid references public.app_users(id),
  source text not null,
  note text,
  status public.request_status not null default 'pending',
  approved_by uuid references public.app_users(id),
  approved_at timestamptz,
  payment_done_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.cart_line_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.cart_requests(id) on delete cascade,
  item_name text not null,
  qty numeric(12,2) not null,
  unit_price numeric(12,2) not null,
  line_total numeric(12,2) not null,
  received boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.requests(id),
  cart_id uuid references public.cart_requests(id),
  invoice_no text not null,
  amount_paid numeric(12,2) not null,
  paid_on date not null,
  recorded_by uuid references public.app_users(id),
  created_at timestamptz not null default now(),
  constraint one_target check (
    (request_id is not null and cart_id is null)
    or (request_id is null and cart_id is not null)
  )
);

create table if not exists public.stock_logs (
  id uuid primary key default gen_random_uuid(),
  log_code text unique not null,
  log_type public.log_type not null,
  source_ref text,
  item_name text not null,
  qty numeric(12,2) not null,
  unit text not null,
  actor_id uuid references public.app_users(id),
  notes text,
  logged_at timestamptz not null default now()
);

create index if not exists idx_requests_status on public.requests(status);
create index if not exists idx_cart_requests_status on public.cart_requests(status);
create index if not exists idx_cart_items_cart on public.cart_line_items(cart_id);
create index if not exists idx_stock_logs_type on public.stock_logs(log_type);

alter table public.app_users enable row level security;
alter table public.requests enable row level security;
alter table public.cart_requests enable row level security;
alter table public.cart_line_items enable row level security;
alter table public.payments enable row level security;
alter table public.stock_logs enable row level security;

-- Starter permissive policies for authenticated users.
-- Tighten policies after wiring roles from auth users.
create policy if not exists "auth read app_users" on public.app_users for select to authenticated using (true);
create policy if not exists "auth rw requests" on public.requests for all to authenticated using (true) with check (true);
create policy if not exists "auth rw cart_requests" on public.cart_requests for all to authenticated using (true) with check (true);
create policy if not exists "auth rw cart_line_items" on public.cart_line_items for all to authenticated using (true) with check (true);
create policy if not exists "auth rw payments" on public.payments for all to authenticated using (true) with check (true);
create policy if not exists "auth rw stock_logs" on public.stock_logs for all to authenticated using (true) with check (true);
