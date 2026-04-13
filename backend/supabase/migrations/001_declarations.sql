-- ============================================================
-- Deklarationsärenden
-- Kör i Supabase SQL Editor eller via Supabase CLI
-- ============================================================

create extension if not exists "pgcrypto";

-- Hjälpfunktion: generera referensnummer i format DKL-YYYYMMDD-XXXX
create or replace function generate_reference_number()
returns text language plpgsql as $$
begin
  return 'DKL-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substring(gen_random_uuid()::text, 1, 6));
end;
$$;

-- Huvudtabell
create table if not exists declarations (
  id                        uuid primary key default gen_random_uuid(),
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  status                    text not null default 'submitted'
                              check (status in ('submitted', 'processing', 'completed', 'error')),
  reference_number          text not null unique default generate_reference_number(),

  -- Personuppgifter
  first_name                text not null,
  last_name                 text not null,
  personal_identity_number  text not null,
  user_email                text,
  user_phone                text,
  income_year               integer not null,

  -- Minst ett kontaktfält krävs (enforced i applikationslagret)
  constraint contact_required check (user_email is not null or user_phone is not null),

  -- Inkomst och avdrag (0 om ej aktuellt)
  salary                    integer not null default 0,
  travel_deduction          integer not null default 0,
  other_work_expenses       integer not null default 0,
  rot_deduction             integer not null default 0,
  rut_deduction             integer not null default 0,
  rental_net                integer not null default 0,
  capital_gain_funds        integer not null default 0,
  capital_loss_funds        integer not null default 0,
  interest_secured          integer not null default 0,
  interest_unsecured        integer not null default 0,

  -- Bostadsförsäljning (null om ej aktuellt)
  housing_sale_price        integer,
  housing_buy_price         integer,
  housing_improvements      integer,
  housing_sale_costs        integer,

  -- Rådata — sanningen, aldrig ändra
  raw_data                  jsonb not null
);

-- Uppdatera updated_at automatiskt
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger declarations_updated_at
  before update on declarations
  for each row execute function touch_updated_at();

-- Index för vanliga sökningar
create index if not exists idx_declarations_pnr
  on declarations (personal_identity_number);

create index if not exists idx_declarations_status
  on declarations (status);

create index if not exists idx_declarations_income_year
  on declarations (income_year);

create index if not exists idx_declarations_created_at
  on declarations (created_at desc);

-- Row Level Security (aktivera när du lägger till auth)
alter table declarations enable row level security;

-- Tillåt service_role (backend) full access
create policy "service_role_all" on declarations
  for all
  to service_role
  using (true)
  with check (true);

comment on table declarations is
  'Inkomna deklarationsärenden. raw_data är sanningen — kolumnerna är extraherade för sökbarhet.';
