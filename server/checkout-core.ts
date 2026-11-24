import { products } from '../src/products.js'

export const FREE_SHIPPING_THRESHOLD_CENTS = 15_000
export const FIXED_SHIPPING_CENTS = 1_490

export class CheckoutInputError extends Error {
  constructor(message: string, readonly code = 'invalid_input') {
    super(message)
    this.name = 'CheckoutInputError'
  }
}

export type CheckoutCustomer = {
  name: string
  email: string
  phone: string
}

export type ShippingAddress = {
  postalCode: string
  street: string
  number: string
  complement: string
  district: string
  city: string
  state: string
}

export type CheckoutLine = {
  productId: string
  name: string
  quantity: number
  unitPriceCents: number
  lineTotalCents: number
}

export type CheckoutInput = {
  idempotencyKey: string
  lines: Array<{ productId: string; quantity: number }>
  customer: CheckoutCustomer
  address: ShippingAddress
}

export type CheckoutQuote = {
  lines: CheckoutLine[]
  itemCount: number
  subtotalCents: number
  shippingCents: number
  totalCents: number
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const productById = new Map(products.map((product) => [product.id, product]))

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new CheckoutInputError('Confira os dados do pedido e tente novamente.')
  }
  return value as Record<string, unknown>
}

function text(value: unknown, field: string, min: number, max: number, required = true): string {
  if (value === undefined || value === null) {
    if (!required) return ''
    throw new CheckoutInputError(`Preencha o campo ${field}.`)
  }
  if (typeof value !== 'string') throw new CheckoutInputError(`Confira o campo ${field}.`)
  const normalized = value.replace(/[\u0000-\u001f\u007f]/g, '').trim().replace(/\s+/g, ' ')
  if ((!normalized && required) || normalized.length < min || normalized.length > max) {
    throw new CheckoutInputError(`Confira o campo ${field}.`)
  }
  return normalized
}

export function parseCheckoutInput(value: unknown): CheckoutInput {
  const body = record(value)
  const idempotencyKey = text(body.idempotencyKey, 'identificador do pedido', 36, 36)
  if (!UUID_PATTERN.test(idempotencyKey)) {
    throw new CheckoutInputError('Atualize a página e tente novamente.', 'invalid_idempotency_key')
  }

  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 40) {
    throw new CheckoutInputError('A sacola está vazia ou contém itens inválidos.')
  }

  const seen = new Set<string>()
  const lines = body.items.map((rawLine) => {
    const line = record(rawLine)
    const productId = text(line.productId, 'produto', 1, 80)
    const quantity = line.quantity
    if (!Number.isInteger(quantity) || (quantity as number) < 1 || (quantity as number) > 20) {
      throw new CheckoutInputError('Confira a quantidade dos produtos.')
    }
    if (!productById.has(productId) || seen.has(productId)) {
      throw new CheckoutInputError('A sacola contém um produto inválido.')
    }
    seen.add(productId)
    return { productId, quantity: quantity as number }
  })

  const itemCount = lines.reduce((total, line) => total + line.quantity, 0)
  if (itemCount > 100) throw new CheckoutInputError('A quantidade total de itens excede o limite do pedido.')

  const customerBody = record(body.customer)
  const name = text(customerBody.name, 'nome', 2, 120)
  const email = text(customerBody.email, 'e-mail', 5, 254).toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new CheckoutInputError('Informe um e-mail válido.')
  }
  const phone = text(customerBody.phone, 'telefone', 10, 20).replace(/\D/g, '')
  if (phone.length < 10 || phone.length > 13) throw new CheckoutInputError('Informe um telefone com DDD válido.')

  const addressBody = record(body.address)
  const postalCode = text(addressBody.postalCode, 'CEP', 8, 9).replace(/\D/g, '')
  if (postalCode.length !== 8) throw new CheckoutInputError('Informe um CEP válido.')
  const state = text(addressBody.state, 'UF', 2, 2).toUpperCase()
  if (!/^[A-Z]{2}$/.test(state)) throw new CheckoutInputError('Informe uma UF válida.')
  const address: ShippingAddress = {
    postalCode,
    street: text(addressBody.street, 'rua ou avenida', 2, 120),
    number: text(addressBody.number, 'número', 1, 20),
    complement: text(addressBody.complement, 'complemento', 0, 80, false),
    district: text(addressBody.district, 'bairro', 2, 80),
    city: text(addressBody.city, 'cidade', 2, 80),
    state,
  }

  return { idempotencyKey, lines, customer: { name, email, phone }, address }
}

export function parseStatusKey(value: unknown): string {
  const body = record(value)
  const key = text(body.idempotencyKey, 'identificador do pedido', 36, 36)
  if (!UUID_PATTERN.test(key)) throw new CheckoutInputError('Pedido não encontrado.', 'order_not_found')
  return key
}

export function calculateQuote(lines: CheckoutInput['lines']): CheckoutQuote {
  const quoteLines = lines.map((line) => {
    const product = productById.get(line.productId)
    if (!product) throw new CheckoutInputError('A sacola contém um produto inválido.')
    const unitPriceCents = Math.round(product.price * 100)
    return {
      productId: product.id,
      name: product.name,
      quantity: line.quantity,
      unitPriceCents,
      lineTotalCents: unitPriceCents * line.quantity,
    }
  })
  const itemCount = quoteLines.reduce((total, line) => total + line.quantity, 0)
  const subtotalCents = quoteLines.reduce((total, line) => total + line.lineTotalCents, 0)
  const shippingCents = subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : FIXED_SHIPPING_CENTS
  return {
    lines: quoteLines,
    itemCount,
    subtotalCents,
    shippingCents,
    totalCents: subtotalCents + shippingCents,
  }
}

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value)
}
