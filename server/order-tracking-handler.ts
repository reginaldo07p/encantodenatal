import { hasSupabaseConfig, isProduction } from './env.js'
import { CheckoutInputError } from './checkout-core.js'
import { findOrderByTrackingTokenHash, SupabaseRequestError } from './supabase.js'

const MAX_BODY_BYTES = 2_000
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function json(status: number, payload: Record<string, unknown>): Response {
  return Response.json(payload, {
    status,
    headers: { 'Cache-Control': 'no-store, max-age=0', 'X-Content-Type-Options': 'nosniff' },
  })
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return false
  try {
    return new URL(origin).origin === new URL(request.url).origin
  } catch {
    return false
  }
}

async function readToken(request: Request): Promise<string> {
  const bytes = new Uint8Array(await request.arrayBuffer())
  if (bytes.byteLength > MAX_BODY_BYTES) throw new CheckoutInputError('Confira o código de acompanhamento.')
  let body: unknown
  try {
    body = JSON.parse(new TextDecoder().decode(bytes)) as unknown
  } catch {
    throw new CheckoutInputError('Confira o código de acompanhamento.')
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new CheckoutInputError('Confira o código de acompanhamento.')
  }
  const token = (body as Record<string, unknown>).trackingToken
  if (typeof token !== 'string' || !UUID_PATTERN.test(token)) {
    throw new CheckoutInputError('Confira o código de acompanhamento.')
  }
  return token.toLowerCase()
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function publicTrackingOrder(order: NonNullable<Awaited<ReturnType<typeof findOrderByTrackingTokenHash>>>) {
  const shipmentVisible = order.fulfillment_status === 'shipped' || order.fulfillment_status === 'delivered'
  return {
    orderCode: order.id.slice(0, 8).toUpperCase(),
    paymentStatus: order.payment_status,
    fulfillmentStatus: order.fulfillment_status,
    subtotalCents: order.subtotal_cents,
    shippingCents: order.shipping_cents,
    totalCents: order.total_cents,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    paidAt: order.paid_at,
    shippedAt: order.shipped_at,
    deliveredAt: order.delivered_at,
    carrier: shipmentVisible ? order.shipping_carrier : null,
    trackingCode: shipmentVisible ? order.shipping_tracking_code : null,
    items: order.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      lineTotalCents: item.lineTotalCents,
    })),
  }
}

export async function handleOrderTracking(request: Request): Promise<Response> {
  if (request.method !== 'POST') return json(405, { error: 'Método não permitido.' })
  if (!sameOrigin(request)) return json(403, { error: 'Origem não permitida.' })
  if (!request.headers.get('content-type')?.toLowerCase().includes('application/json')) {
    return json(415, { error: 'Formato da solicitação não suportado.' })
  }
  if (!isProduction()) return json(404, { error: 'Pedido não encontrado.' })
  if (!hasSupabaseConfig()) return json(503, { error: 'O acompanhamento está temporariamente indisponível.' })

  try {
    const token = await readToken(request)
    const order = await findOrderByTrackingTokenHash(await sha256Hex(token))
    if (!order) return json(404, { error: 'Não encontramos um pedido com esse código. Confira e tente novamente.' })
    return json(200, { order: publicTrackingOrder(order) })
  } catch (error) {
    if (error instanceof CheckoutInputError) return json(400, { error: error.message })
    if (error instanceof SupabaseRequestError) return json(503, { error: 'O acompanhamento está temporariamente indisponível.' })
    return json(500, { error: 'Não foi possível consultar o pedido agora.' })
  }
}
