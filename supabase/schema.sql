-- Invoice Web: Supabase PostgreSQL schema
-- Run in Supabase SQL Editor. RLS is enabled on all user-owned tables.
create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  company_name text not null default '',
  company_email text not null default '',
  company_phone text not null default '',
  company_address text not null default '',
  tax_number text not null default '',
  bank_name text not null default '',
  bank_account_name text not null default '',
  bank_account_number text not null default '',
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text not null default '',
  phone text not null default '',
  address text not null default '',
  tax_number text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, owner_id)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  sku text not null default '',
  unit text not null default 'pcs',
  unit_price numeric(14,2) not null default 0 check (unit_price >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, owner_id)
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  customer_id uuid not null,
  invoice_number text not null,
  issue_date date not null default current_date,
  due_date date not null,
  status text not null default 'draft' check (status in ('draft','sent','partial','paid','overdue','cancelled')),
  currency char(3) not null default 'IDR' check (currency = 'IDR'),
  subtotal numeric(14,2) not null default 0 check (subtotal >= 0),
  discount_amount numeric(14,2) not null default 0 check (discount_amount >= 0),
  tax_rate numeric(5,2) not null default 0 check (tax_rate >= 0 and tax_rate <= 100),
  tax_amount numeric(14,2) not null default 0 check (tax_amount >= 0),
  total_amount numeric(14,2) not null default 0 check (total_amount >= 0),
  notes text not null default '',
  terms text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, invoice_number),
  unique (id, owner_id),
  constraint invoices_customer_owner_fk foreign key (customer_id, owner_id)
    references public.customers(id, owner_id) on delete restrict,
  constraint invoice_dates_valid check (due_date >= issue_date),
  constraint invoice_discount_valid check (discount_amount <= subtotal)
);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  invoice_id uuid not null,
  product_id uuid,
  description text not null,
  quantity numeric(12,2) not null default 1 check (quantity > 0),
  unit text not null default 'pcs',
  unit_price numeric(14,2) not null default 0 check (unit_price >= 0),
  line_total numeric(14,2) not null default 0 check (line_total >= 0),
  created_at timestamptz not null default now(),
  constraint items_invoice_owner_fk foreign key (invoice_id, owner_id)
    references public.invoices(id, owner_id) on delete cascade,
  constraint items_product_owner_fk foreign key (product_id, owner_id)
    references public.products(id, owner_id) on delete set null (product_id)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  invoice_id uuid not null,
  payment_date date not null default current_date,
  amount numeric(14,2) not null check (amount > 0),
  method text not null default 'bank_transfer' check (method in ('cash','bank_transfer','qris','credit_card','other')),
  reference_number text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  constraint payments_invoice_owner_fk foreign key (invoice_id, owner_id)
    references public.invoices(id, owner_id) on delete cascade
);

create index if not exists customers_owner_name_idx on public.customers(owner_id, name);
create index if not exists products_owner_name_idx on public.products(owner_id, name);
create index if not exists invoices_owner_date_idx on public.invoices(owner_id, issue_date desc);
create index if not exists invoices_owner_status_idx on public.invoices(owner_id, status);
create index if not exists invoice_items_invoice_idx on public.invoice_items(invoice_id);
create index if not exists payments_invoice_idx on public.payments(invoice_id, payment_date desc);

-- Create a profile row automatically when an auth user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, company_email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), coalesce(new.email, ''))
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Updated-at triggers
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','customers','products','invoices'] LOOP
    EXECUTE format('drop trigger if exists set_updated_at on public.%I', t);
    EXECUTE format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  END LOOP;
END $$;

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.products enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;

-- Profiles: users can only access their own company profile.
drop policy if exists "profile_select_own" on public.profiles;
create policy "profile_select_own" on public.profiles for select to authenticated using (id = (select auth.uid()));
drop policy if exists "profile_insert_own" on public.profiles;
create policy "profile_insert_own" on public.profiles for insert to authenticated with check (id = (select auth.uid()));
drop policy if exists "profile_update_own" on public.profiles;
create policy "profile_update_own" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Owner-scoped CRUD policies.
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['customers','products','invoices','invoice_items','payments'] LOOP
    EXECUTE format('drop policy if exists owner_select on public.%I', t);
    EXECUTE format('create policy owner_select on public.%I for select to authenticated using (owner_id = (select auth.uid()))', t);
    EXECUTE format('drop policy if exists owner_insert on public.%I', t);
    EXECUTE format('create policy owner_insert on public.%I for insert to authenticated with check (owner_id = (select auth.uid()))', t);
    EXECUTE format('drop policy if exists owner_update on public.%I', t);
    EXECUTE format('create policy owner_update on public.%I for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()))', t);
    EXECUTE format('drop policy if exists owner_delete on public.%I', t);
    EXECUTE format('create policy owner_delete on public.%I for delete to authenticated using (owner_id = (select auth.uid()))', t);
  END LOOP;
END $$;
