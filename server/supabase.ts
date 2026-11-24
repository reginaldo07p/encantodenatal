import { env } from './env.js'
import type { CheckoutCustomer, CheckoutLine, ShippingAddress } from './checkout-core.js'

export type PaymentStatus = 'creating' | 'pending' | 'paid' | 'expired' | 'failed'

export type OrderRecord = {
  id: string
  idempotency_key: string
  request_fingerprint: string
  external_id: string
  subtotal_cents: number
  shipping_cents: number
  total_cents: number
  payment_status: PaymentStatus
  bearpay_charge_id: string | null
  bearpay_status: string | null
  pix_code: string | null
  pix_expires_at: string | null
  paid_at: string | null
}

const ORDER_FIELDS = [
  'id', 'idempotency_key', 'request_fingerprint', 'external_id',
  'subtotal_cents', 'shipping_cents', 'total_cents', 'payment_status',
  'bearpay_charge_id', 'bearpay_status', 'pix_code', 'pix_expires_at', 'paid_at',
].join(',')

export class SupabaseRequestError extends Error {
  constructor(readonly status: number) {
    super('Supabase request failed')
    this.name = 'SupabaseRequestError'
  }
}

function restUrl(table: string, params?: URLSearchParams): string {
  const base = env.SUPABASE_URL?.replace(/\/+$/, '')
  if (!base || !env.SUPABASE_SERVICE_ROLE_KEY) throw new SupabaseRequestError(503)
  const query = params?.toString()
  return `${base}/rest/v1/${table}${query ? `?${query}` : ''}`
}

async function dbFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) throw new SupabaseRequestError(503)
  const response = await fetch(url, {
    ...init,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  })
  if (!response.ok) throw new SupabaseRequestError(response.status)
  if (response.status === 204) return null as T
  return await response.json() as T
}

function orderQuery(field: 'idempotency_key' | 'external_id', value: string): URLSearchParams {
  const params = new URLSearchParams({ select: ORDER_FIELDS, [field]: `eq.${value}`, limit: '1' })
  return params
}

export async function findOrderByIdempotencyKey(key: string): Promise<OrderRecord | null> {
  const rows = await dbFetch<OrderRecord[]>(restUrl('store_orders', orderQuery('idempotency_key', key)))
  return rows[0] ?? null
}

export async function findOrderByExternalId(externalId: string): Promise<OrderRecord | null> {
  const rows = await dbFetch<OrderRecord[]>(restUrl('store_orders', orderQuery('external_id', externalId)))
  return rows[0] ?? null
}

export type NewOrder = {
  id: string
  idempotency_key: string
  request_fingerprint: string
  external_id: string
  subtotal_cents: number
  shipping_cents: number
  total_cents: number
  items: CheckoutLine[]
  customer: CheckoutCustomer
  shipping_address: ShippingAddress
  payment_status: PaymentStatus
  bearpay_status: string
  created_at: string
  updated_at: string
}

export async function createOrGetOrder(input: NewOrder): Promise<OrderRecord> {
  const params = new URLSearchParams({ select: ORDER_FIELDS })
  const url = restUrl('store_orders', params)
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) throw new SupabaseRequestError(503)
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(input),
    cache: 'no-store',
  })

  if (response.status === 409) {
    const existing = await findOrderByIdempotencyKey(input.idempotency_key)
    if (existing) return existing
  }
  if (!response.ok) throw new SupabaseRequestError(response.status)
  const rows = await response.json() as OrderRecord[]
  if (!rows[0]) throw new SupabaseRequestError(500)
  return rows[0]
}

export type OrderPatch = Partial<Pick<OrderRecord,
  'payment_status' | 'bearpay_charge_id' | 'bearpay_status' | 'pix_code' | 'pix_expires_at' | 'paid_at'
>>

export async function updateOrderById(
  id: string,
  patch: OrderPatch,
  options: { excludePaid?: boolean } = {},
): Promise<OrderRecord | null> {
  const params = new URLSearchParams({ select: ORDER_FIELDS, id: `eq.${id}` })
  if (options.excludePaid) params.set('payment_status', 'not.eq.paid')
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) throw new SupabaseRequestError(503)
  const response = await fetch(restUrl('store_orders', params), {
    method: 'PATCH',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() }),
    cache: 'no-store',
  })
  if (!response.ok) throw new SupabaseRequestError(response.status)
  const rows = await response.json() as OrderRecord[]
  return rows[0] ?? null
}

export async function recordBearPayEvent(input: {
  provider_event_id: string
  dedupe_key: string
  event_type: string
  provider_charge_id: string
  external_id: string
  order_id: string | null
  occurred_at: string | null
}): Promise<void> {
  const params = new URLSearchParams({ on_conflict: 'dedupe_key' })
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) throw new SupabaseRequestError(503)
  const response = await fetch(restUrl('bearpay_events', params), {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=ignore-duplicates,return=minimal',
    },
    body: JSON.stringify(input),
    cache: 'no-store',
  })
  if (!response.ok) throw new SupabaseRequestError(response.status)
}
