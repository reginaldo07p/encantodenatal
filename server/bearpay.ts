import { env } from './env'

export type BearPayCharge = {
  id: string
  status: 'pending' | 'paid' | 'expired' | 'failed'
  amountCents: number
  pixCode: string | null
  expiresAt: string | null
  paidAt: string | null
}

export class BearPayRequestError extends Error {
  constructor(readonly providerStatus: number, readonly providerCode: string | null = null) {
    super('BearPay request failed')
    this.name = 'BearPayRequestError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

export async function createPixCharge(input: {
  externalId: string
  orderId: string
  amountCents: number
  customer: { name: string; email: string; phone: string }
}): Promise<BearPayCharge> {
  const apiKey = env.BEARPAY_API_KEY
  if (!apiKey) throw new BearPayRequestError(503, 'missing_credentials')

  const response = await fetch('https://www.bearpay.online/api/v1/charges', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      amount: input.amountCents / 100,
      method: 'pix',
      description: `Encanto de Natal - Pedido ${input.orderId.slice(0, 8)}`,
      external_id: input.externalId,
      customer: input.customer,
      metadata: { order_id: input.orderId },
      expires_in_minutes: 30,
    }),
    signal: AbortSignal.timeout(12_000),
    cache: 'no-store',
  })

  let data: unknown
  try {
    data = await response.json()
  } catch {
    throw new BearPayRequestError(response.status, 'invalid_response')
  }

  if (!response.ok) {
    const error = isRecord(data) && isRecord(data.error) ? data.error : null
    const code = error && typeof error.code === 'string' ? error.code.slice(0, 80) : null
    throw new BearPayRequestError(response.status, code)
  }

  if (!isRecord(data)
    || typeof data.id !== 'string'
    || !['pending', 'paid', 'expired', 'failed'].includes(String(data.status))
    || typeof data.amount !== 'number'
    || Math.round(data.amount * 100) !== input.amountCents) {
    throw new BearPayRequestError(response.status, 'invalid_charge_response')
  }

  const status = data.status as BearPayCharge['status']
  const pixCode = typeof data.pix_code === 'string' && data.pix_code.length <= 3000 ? data.pix_code : null
  if (status === 'pending' && !pixCode) {
    throw new BearPayRequestError(response.status, 'missing_pix_code')
  }

  const expiresAt = typeof data.expires_at === 'string' && Number.isFinite(Date.parse(data.expires_at))
    ? new Date(data.expires_at).toISOString()
    : null
  const paidAt = typeof data.paid_at === 'string' && Number.isFinite(Date.parse(data.paid_at))
    ? new Date(data.paid_at).toISOString()
    : null

  return {
    id: data.id,
    status,
    amountCents: Math.round(data.amount * 100),
    pixCode,
    expiresAt,
    paidAt,
  }
}
