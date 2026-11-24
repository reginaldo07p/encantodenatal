import { env, hasBearPayCheckoutConfig, hasSupabaseConfig, isProduction } from './env.js'
import {
  calculateQuote,
  CheckoutInputError,
  parseCheckoutInput,
  parseStatusKey,
} from './checkout-core.js'
import { createPixCharge } from './bearpay.js'
import {
  createOrGetOrder,
  findOrderByIdempotencyKey,
  type OrderRecord,
  SupabaseRequestError,
  updateOrderById,
} from './supabase.js'

const MAX_BODY_BYTES = 24_000

function json(status: number, payload: Record<string, unknown>): Response {
  return Response.json(payload, {
    status,
    headers: { 'Cache-Control': 'no-store, max-age=0', 'X-Content-Type-Options': 'nosniff' },
  })
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return true
  try {
    return new URL(origin).origin === new URL(request.url).origin
  } catch {
    return false
  }
}

async function readJson(request: Request): Promise<unknown> {
  const bytes = new Uint8Array(await request.arrayBuffer())
  if (bytes.byteLength > MAX_BODY_BYTES) throw new CheckoutInputError('O formulário excede o tamanho permitido.', 'body_too_large')
  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as unknown
  } catch {
    throw new CheckoutInputError('Não foi possível ler os dados do checkout.', 'invalid_json')
  }
}

function publicOrder(order: OrderRecord, mode: 'live' | 'preview'): Record<string, unknown> {
  return {
    mode,
    paymentStatus: order.payment_status,
    subtotalCents: order.subtotal_cents,
    shippingCents: order.shipping_cents,
    totalCents: order.total_cents,
    pixCode: order.payment_status === 'pending' ? order.pix_code : null,
    pixExpiresAt: order.pix_expires_at,
  }
}

function configReadyForOrders(): boolean {
  return hasBearPayCheckoutConfig() && Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY)
}

async function getStatus(idempotencyKey: string): Promise<Response> {
  if (!isProduction()) return json(404, { error: 'Pedido não encontrado.' })
  if (!hasSupabaseConfig()) return json(503, { error: 'O acompanhamento do pedido está temporariamente indisponível.' })
  const order = await findOrderByIdempotencyKey(idempotencyKey)
  if (!order) return json(404, { error: 'Pedido não encontrado.' })
  return json(200, publicOrder(order, 'live'))
}

async function createOrder(value: unknown): Promise<Response> {
  const input = parseCheckoutInput(value)
  const quote = calculateQuote(input.lines)

  // Preview and local runs never call BearPay, write customer data, or touch Supabase.
  if (!isProduction()) {
    return json(200, {
      mode: 'preview',
      paymentStatus: 'preview',
      subtotalCents: quote.subtotalCents,
      shippingCents: quote.shippingCents,
      totalCents: quote.totalCents,
      message: 'Simulação: nenhum pedido foi salvo e nenhuma cobrança Pix foi criada.',
    })
  }

  if (!configReadyForOrders()) {
    return json(503, { error: 'O Pix ainda está sendo configurado. Nenhum pedido foi enviado.' })
  }

  const fingerprintPayload = JSON.stringify({
    lines: [...quote.lines].sort((a, b) => a.productId.localeCompare(b.productId)),
    customer: input.customer,
    address: input.address,
    subtotalCents: quote.subtotalCents,
    shippingCents: quote.shippingCents,
    totalCents: quote.totalCents,
  })
  const fingerprint = await sha256Hex(fingerprintPayload)
  const newId = crypto.randomUUID()
  const now = new Date().toISOString()
  const order = await createOrGetOrder({
    id: newId,
    idempotency_key: input.idempotencyKey,
    request_fingerprint: fingerprint,
    external_id: `encanto-${newId}`,
    subtotal_cents: quote.subtotalCents,
    shipping_cents: quote.shippingCents,
    total_cents: quote.totalCents,
    items: quote.lines,
    customer: input.customer,
    shipping_address: input.address,
    payment_status: 'creating',
    bearpay_status: 'creating',
    created_at: now,
    updated_at: now,
  })

  if (order.request_fingerprint !== fingerprint) {
    return json(409, { error: 'Este checkout mudou. Atualize o pedido antes de tentar novamente.' })
  }
  if (order.payment_status === 'paid') return json(200, publicOrder(order, 'live'))

  const pixStillValid = order.pix_code
    && (!order.pix_expires_at || Date.parse(order.pix_expires_at) > Date.now())
    && order.payment_status === 'pending'
  if (pixStillValid) return json(200, publicOrder(order, 'live'))

  try {
    const charge = await createPixCharge({
      // external_id is unique per persisted order and BearPay's documented idempotency key.
      externalId: order.external_id,
      orderId: order.id,
      amountCents: order.total_cents,
      customer: input.customer,
    })
    if (charge.status === 'expired' || charge.status === 'failed') {
      throw new Error('BearPay did not return an active Pix charge')
    }
    const updated = await updateOrderById(order.id, {
      // Only a valid signed webhook can set a final payment status.
      payment_status: 'pending',
      bearpay_status: charge.status,
      bearpay_charge_id: charge.id,
      pix_code: charge.status === 'pending' ? charge.pixCode : null,
      pix_expires_at: charge.status === 'pending' ? charge.expiresAt : null,
      paid_at: null,
    }, { excludePaid: true })
    if (!updated) {
      const latest = await findOrderByIdempotencyKey(order.idempotency_key)
      if (latest?.payment_status === 'paid') return json(200, publicOrder(latest, 'live'))
      throw new SupabaseRequestError(500)
    }
    return json(200, publicOrder(updated, 'live'))
  } catch (error) {
    if (error instanceof SupabaseRequestError) {
      return json(503, { error: 'Não foi possível salvar o pedido. Tente novamente; o identificador evita cobranças duplicadas.' })
    }
    return json(502, { error: 'Não foi possível gerar o Pix agora. Tente novamente em instantes; não envie o formulário várias vezes.' })
  }
}

export async function handleCheckout(request: Request): Promise<Response> {
  if (request.method !== 'POST') return json(405, { error: 'Método não permitido.' })
  if (!sameOrigin(request)) return json(403, { error: 'Origem não permitida.' })
  if (!request.headers.get('content-type')?.toLowerCase().includes('application/json')) {
    return json(415, { error: 'Formato da solicitação não suportado.' })
  }

  try {
    const body = await readJson(request)
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new CheckoutInputError('Confira os dados do checkout.')
    }
    const value = body as Record<string, unknown>
    if (value.action === 'status') return await getStatus(parseStatusKey(value))
    return await createOrder(value)
  } catch (error) {
    if (error instanceof CheckoutInputError) {
      const status = error.code === 'body_too_large' ? 413 : 400
      return json(status, { error: error.message, code: error.code })
    }
    if (error instanceof SupabaseRequestError) {
      return json(503, { error: 'O serviço de pedidos está temporariamente indisponível.' })
    }
    return json(500, { error: 'Não foi possível concluir o checkout. Tente novamente.' })
  }
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}
