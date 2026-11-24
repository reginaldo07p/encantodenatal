create table if not exists public.store_orders (
  id uuid primary key,
  idempotency_key uuid not null unique,
  request_fingerprint text not null check (length(request_fingerprint) = 64),
  external_id text not null unique,
  subtotal_cents integer not null check (subtotal_cents > 0),
  shipping_cents integer not null check (shipping_cents in (0, 1490)),
  total_cents integer not null check (total_cents = subtotal_cents + shipping_cents),
  items jsonb not null check (jsonb_typeof(items) = 'array'),
  customer jsonb not null check (jsonb_typeof(customer) = 'object'),
  shipping_address jsonb not null check (jsonb_typeof(shipping_address) = 'object'),
  payment_status text not null check (payment_status in ('creating', 'pending', 'paid', 'expired', 'failed')),
  bearpay_charge_id text unique,
  bearpay_status text,
  pix_code text,
  pix_expires_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists store_orders_payment_status_created_at_idx
  on public.store_orders (payment_status, created_at desc);

create table if not exists public.bearpay_events (
  provider_event_id text not null,
  dedupe_key text primary key,
  event_type text not null,
  provider_charge_id text not null,
  external_id text not null,
  order_id uuid references public.store_orders (id) on delete set null,
  occurred_at timestamptz,
  received_at timestamptz not null default now()
);

create index if not exists bearpay_events_order_id_received_at_idx
  on public.bearpay_events (order_id, received_at desc);

alter table public.store_orders enable row level security;
alter table public.bearpay_events enable row level security;

revoke all on table public.store_orders from anon, authenticated;
revoke all on table public.bearpay_events from anon, authenticated;
grant all on table public.store_orders to service_role;
grant all on table public.bearpay_events to service_role;

comment on table public.store_orders is 'Dados de pedidos e Pix. Acesso somente pelo backend via service_role; não criar políticas públicas.';
comment on table public.bearpay_events is 'Metadados mínimos dos webhooks BearPay; payload bruto e dados de cliente não são armazenados.';
