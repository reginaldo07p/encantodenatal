import { env, isProduction } from './env.js'
import { findOrderByExternalId, recordBearPayEvent, SupabaseRequestError, updateOrderById } from './supabase.js'

const MAX_WEBHOOK_BYTES = 96_000

type BearPayEvent = {
  id: string
  event: string
  created_at?: string
  test?: boolean
  data: {
    id: string
    status: string
    amount: number
    external_id: string
    paid_at?: string | null
    test?: boolean
  }
}

type BearPayEventEnvelope = {
  id: string
  event: string
  test?: unknown
  data: Record<string, unknown>
}

function json(status: number, payload: Record<string, unknown>): Response {
  return Response.json(payload, {
    status,
    headers: { 'Cache-Control': 'no-store, max-age=0', 'X-Content-Type-Options': 'nosniff' },
  })
}

function safeDate(value: unknown): string | null {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) return null
  return new Date(value).toISOString()
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false
  let mismatch = 0
  for (let index = 0; index < left.length; index += 1) mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index)
  return mismatch === 0
}

async function validSignature(secret: string, body: Uint8Array, supplied: string | null): Promise<boolean> {
  if (!supplied || !/^sha256=[a-f0-9]{64}$/.test(supplied)) return false
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signingBytes = new ArrayBuffer(body.byteLength)
  new Uint8Array(signingBytes).set(body)
  const digest = new Uint8Array(await crypto.subtle.sign('HMAC', key, signingBytes))
  const expected = `sha256=${Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('')}`
  return constantTimeEqual(expected, supplied)
}

function isEventEnvelope(value: unknown): value is BearPayEventEnvelope {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const event = value as Record<string, unknown>
  if (typeof event.id !== 'string' || !event.id || typeof event.event !== 'string' || !event.event || !event.data || typeof event.data !== 'object' || Array.isArray(event.data)) return false
  const data = event.data as Record<string, unknown>
  return typeof data.id === 'string' && Boolean(data.id)
}

function isCompleteEvent(event: BearPayEventEnvelope): event is BearPayEvent {
  return typeof event.data.status === 'string'
    && typeof event.data.amount === 'number'
    && Number.isFinite(event.data.amount)
    && typeof event.data.external_id === 'string'
}

export async function handleBearPayWebhook(request: Request): Promise<Response> {
  if (request.method !== 'POST') return json(405, { error: 'Method not allowed' })
  const declaredLength = Number(request.headers.get('content-length') ?? 0)
  if (declaredLength > MAX_WEBHOOK_BYTES) return json(413, { error: 'Payload too large' })

  const rawBody = new Uint8Array(await request.arrayBuffer())
  if (rawBody.byteLength > MAX_WEBHOOK_BYTES) return json(413, { error: 'Payload too large' })
  const secret = env.BEARPAY_WEBHOOK_SECRET
  if (!secret || secret.length < 16) return json(503, { error: 'Webhook is not configured' })

  const valid = await validSignature(secret, rawBody, request.headers.get('x-bearpay-signature'))
  if (!valid) return json(401, { error: 'Invalid signature' })

  let parsed: unknown
  try {
    parsed = JSON.parse(new TextDecoder().decode(rawBody)) as unknown
  } catch {
    return json(400, { error: 'Invalid JSON' })
  }
  if (!isEventEnvelope(parsed)) return json(400, { error: 'Invalid event payload' })
  if (request.headers.get('x-bearpay-event') !== parsed.event) return json(400, { error: 'Event header mismatch' })

  const isTestEvent = parsed.test === true || parsed.data.test === true || parsed.data.id === 'ch_teste'
  if (isTestEvent) return json(200, { ok: true, test: true, ignored: true })

  if (!isCompleteEvent(parsed)) return json(400, { error: 'Invalid event payload' })
  const event = parsed

  // Preview shares the official Supabase project, so it must never write webhook events or orders.
  if (!isProduction()) return json(200, { ok: true, ignored: true })

  if (event.event !== 'charge.paid' && event.event !== 'charge.expired') {
    return json(200, { ok: true, ignored: true })
  }
  const expectedStatus = event.event === 'charge.paid' ? 'paid' : 'expired'
  if (event.data.status !== expectedStatus || !event.id || event.id.length > 160 || event.data.id.length > 160) {
    return json(400, { error: 'Charge event is inconsistent' })
  }
  if (!event.data.external_id.startsWith('encanto-') || event.data.external_id.length > 100) {
    return json(200, { ok: true, ignored: true })
  }
  const dedupeKey = `${event.data.id}:${event.event}`

  try {
    const order = await findOrderByExternalId(event.data.external_id)
    if (!order) {
      await recordBearPayEvent({
        provider_event_id: event.id,
        dedupe_key: dedupeKey,
        event_type: event.event,
        provider_charge_id: event.data.id,
        external_id: event.data.external_id,
        order_id: null,
        occurred_at: safeDate(event.created_at),
      })
      return json(200, { ok: true, ignored: true })
    }

    if (Math.round(event.data.amount * 100) !== order.total_cents) {
      return json(400, { error: 'Charge amount mismatch' })
    }
    if (order.bearpay_charge_id && order.bearpay_charge_id !== event.data.id) {
      return json(400, { error: 'Charge identifier mismatch' })
    }

    await recordBearPayEvent({
      provider_event_id: event.id,
      dedupe_key: dedupeKey,
      event_type: event.event,
      provider_charge_id: event.data.id,
      external_id: event.data.external_id,
      order_id: order.id,
      occurred_at: safeDate(event.data.paid_at) ?? safeDate(event.created_at),
    })

    if (event.event === 'charge.paid') {
      await updateOrderById(order.id, {
        payment_status: 'paid',
        bearpay_status: 'paid',
        bearpay_charge_id: event.data.id,
        paid_at: safeDate(event.data.paid_at) ?? safeDate(event.created_at) ?? new Date().toISOString(),
      })
    } else if (order.payment_status !== 'paid') {
      await updateOrderById(order.id, {
        payment_status: 'expired',
        bearpay_status: 'expired',
        bearpay_charge_id: event.data.id,
      }, { excludePaid: true })
    }

    return json(200, { ok: true })
  } catch (error) {
    if (error instanceof SupabaseRequestError) return json(503, { error: 'Order status update failed' })
    return json(500, { error: 'Webhook processing failed' })
  }
}
