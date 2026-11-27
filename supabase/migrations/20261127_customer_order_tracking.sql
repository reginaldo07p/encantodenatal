alter table public.store_orders
  add column if not exists tracking_token_hash text,
  add column if not exists fulfillment_status text not null default 'received',
  add column if not exists shipping_carrier text,
  add column if not exists shipping_tracking_code text,
  add column if not exists shipped_at timestamptz,
  add column if not exists delivered_at timestamptz;

create unique index if not exists store_orders_tracking_token_hash_key
  on public.store_orders (tracking_token_hash)
  where tracking_token_hash is not null;

create index if not exists store_orders_fulfillment_status_created_at_idx
  on public.store_orders (fulfillment_status, created_at desc);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'store_orders_fulfillment_status_check'
      and conrelid = 'public.store_orders'::regclass
  ) then
    alter table public.store_orders
      add constraint store_orders_fulfillment_status_check
      check (fulfillment_status in ('received', 'processing', 'shipped', 'delivered'));
  end if;
end
$$;

comment on column public.store_orders.tracking_token_hash is
  'Hash SHA-256 de um código aleatório de acompanhamento; código original nunca é gravado no banco.';
comment on column public.store_orders.fulfillment_status is
  'Etapa de envio exibida ao cliente; início recebido e mudanças atualizadas pela operação da loja.';
