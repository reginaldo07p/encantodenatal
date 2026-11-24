import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Check, CheckCircle2, Clipboard, Clock3, LoaderCircle, QrCode, XCircle } from 'lucide-react'
import { toDataURL } from 'qrcode'
import type { Product } from './products'

type CartLine = { product: Product; quantity: number }
type CheckoutPhase = 'form' | 'sending' | 'preview' | 'pending' | 'paid' | 'expired' | 'error'
type Totals = { subtotalCents: number; shippingCents: number; totalCents: number }

type CheckoutResponse = {
  mode?: 'preview' | 'live'
  paymentStatus?: string
  subtotalCents?: number
  shippingCents?: number
  totalCents?: number
  pixCode?: string | null
  pixExpiresAt?: string | null
  message?: string
  error?: string
}

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const formatPrice = (price: number) => money.format(price)
const formatCents = (amount: number) => money.format(amount / 100)
const shippingFor = (subtotalCents: number) => subtotalCents >= 15_000 ? 0 : 1_490

function safeErrorMessage(value: unknown): string {
  if (value && typeof value === 'object' && 'error' in value && typeof value.error === 'string') return value.error
  return 'Não foi possível continuar agora. Confira sua conexão e tente novamente.'
}

export default function CheckoutPanel({ cart, itemCount, cartTotal, onBack, onPaid }: {
  cart: CartLine[]
  itemCount: number
  cartTotal: number
  onBack: () => void
  onPaid: (totalCents: number) => void
}) {
  const localSubtotal = Math.round(cartTotal * 100)
  const localShipping = shippingFor(localSubtotal)
  const localTotals = { subtotalCents: localSubtotal, shippingCents: localShipping, totalCents: localSubtotal + localShipping }
  const [phase, setPhase] = useState<CheckoutPhase>('form')
  const [errorMessage, setErrorMessage] = useState('')
  const [serverTotals, setServerTotals] = useState<Totals | null>(null)
  const [pixCode, setPixCode] = useState('')
  const [qrImage, setQrImage] = useState('')
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [checkoutKey, setCheckoutKey] = useState('')
  const [copied, setCopied] = useState(false)
  const keyRef = useRef('')
  const fingerprintRef = useRef('')
  const locked = phase === 'pending' || phase === 'paid'
  const totals = serverTotals ?? localTotals

  useEffect(() => {
    let cancelled = false
    if (!pixCode) {
      setQrImage('')
      return
    }
    toDataURL(pixCode, { width: 240, margin: 1, color: { dark: '#183329', light: '#ffffff' } })
      .then((url) => { if (!cancelled) setQrImage(url) })
      .catch(() => { if (!cancelled) setQrImage('') })
    return () => { cancelled = true }
  }, [pixCode])

  useEffect(() => {
    if (phase !== 'pending' || !checkoutKey) return
    let active = true
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'status', idempotencyKey: checkoutKey }),
          cache: 'no-store',
        })
        if (!response.ok) return
        const result = await response.json() as CheckoutResponse
        if (!active) return
        if (result.paymentStatus === 'paid') {
          setPhase('paid')
          onPaid(result.totalCents ?? localTotals.totalCents)
        }
        if (result.paymentStatus === 'expired') setPhase('expired')
      } catch {
        // A temporary status-check failure must not lose the Pix code already shown.
      }
    }
    void checkStatus()
    const timer = window.setInterval(checkStatus, 5_000)
    return () => { active = false; window.clearInterval(timer) }
  }, [phase, checkoutKey, onPaid, localTotals.totalCents])

  function handleFormChange() {
    if (phase === 'sending' || phase === 'pending' || phase === 'paid') return
    setPhase('form')
    setErrorMessage('')
    setServerTotals(null)
    setPixCode('')
    setExpiresAt(null)
    setCopied(false)
    keyRef.current = ''
    fingerprintRef.current = ''
    setCheckoutKey('')
  }

  async function submitCheckout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (phase === 'sending' || phase === 'pending' || phase === 'paid') return

    const formData = new FormData(event.currentTarget)
    const payload = {
      items: cart.map(({ product, quantity }) => ({ productId: product.id, quantity })),
      customer: {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
      },
      address: {
        postalCode: formData.get('postalCode'),
        street: formData.get('street'),
        number: formData.get('number'),
        complement: formData.get('complement'),
        district: formData.get('district'),
        city: formData.get('city'),
        state: formData.get('state'),
      },
    }
    const fingerprint = JSON.stringify(payload)
    if (!keyRef.current || fingerprintRef.current !== fingerprint) {
      keyRef.current = crypto.randomUUID()
      fingerprintRef.current = fingerprint
      setCheckoutKey(keyRef.current)
    }

    setPhase('sending')
    setErrorMessage('')
    setCopied(false)
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, idempotencyKey: keyRef.current }),
        cache: 'no-store',
      })
      const result = await response.json().catch(() => null) as CheckoutResponse | null
      if (!response.ok) throw new Error(safeErrorMessage(result))
      if (typeof result?.subtotalCents === 'number'
        && typeof result.shippingCents === 'number'
        && typeof result.totalCents === 'number') {
        setServerTotals({
          subtotalCents: result.subtotalCents,
          shippingCents: result.shippingCents,
          totalCents: result.totalCents,
        })
      }

      if (result?.mode === 'preview') {
        setPixCode('')
        setPhase('preview')
      } else if (result?.paymentStatus === 'paid') {
        setPixCode('')
        setPhase('paid')
        onPaid(result.totalCents ?? totals.totalCents)
      } else if (result?.paymentStatus === 'expired') {
        setPixCode('')
        setPhase('expired')
      } else if (result?.mode === 'live' && result.paymentStatus === 'pending') {
        setPixCode(typeof result.pixCode === 'string' ? result.pixCode : '')
        setExpiresAt(result.pixExpiresAt ?? null)
        setPhase('pending')
      } else {
        throw new Error('A resposta do pagamento veio incompleta. Tente novamente.')
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Não foi possível continuar agora. Tente novamente.')
      setPhase('error')
    }
  }

  async function copyPixCode() {
    if (!pixCode) return
    try {
      await navigator.clipboard.writeText(pixCode)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      setErrorMessage('Não foi possível copiar automaticamente. Selecione o código Pix e copie manualmente.')
    }
  }

  return (
    <div className="checkout-content">
      <div className="checkout-intro"><span className="checkout-icon"><QrCode size={22} /></span><span className="demo-tag">PIX</span></div>
      <h3>Finalize seu pedido com Pix.</h3>
      <p>Pague com Pix e acompanhe a confirmação do pedido por aqui.</p>

      <form className="checkout-form" onSubmit={submitCheckout} onChange={handleFormChange}>
        <section className="checkout-form-section" aria-labelledby="checkout-contact-title">
          <h4 id="checkout-contact-title">Seus dados</h4>
          <div className="checkout-field-grid">
            <label className="checkout-field checkout-field-full">Nome completo<input name="name" type="text" autoComplete="name" minLength={2} maxLength={120} required disabled={locked || phase === 'sending'} /></label>
            <label className="checkout-field">E-mail<input name="email" type="email" autoComplete="email" maxLength={254} required disabled={locked || phase === 'sending'} /></label>
            <label className="checkout-field">Telefone com DDD<input name="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="(00) 00000-0000" maxLength={20} required disabled={locked || phase === 'sending'} /></label>
          </div>
        </section>

        <section className="checkout-form-section" aria-labelledby="checkout-address-title">
          <h4 id="checkout-address-title">Endereço de entrega</h4>
          <div className="checkout-field-grid">
            <label className="checkout-field">CEP<input name="postalCode" type="text" inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" maxLength={9} required disabled={locked || phase === 'sending'} /></label>
            <label className="checkout-field">Número<input name="number" type="text" autoComplete="address-line2" maxLength={20} required disabled={locked || phase === 'sending'} /></label>
            <label className="checkout-field checkout-field-full">Rua ou avenida<input name="street" type="text" autoComplete="address-line1" minLength={2} maxLength={120} required disabled={locked || phase === 'sending'} /></label>
            <label className="checkout-field">Complemento<input name="complement" type="text" maxLength={80} disabled={locked || phase === 'sending'} /></label>
            <label className="checkout-field">Bairro<input name="district" type="text" maxLength={80} required disabled={locked || phase === 'sending'} /></label>
            <label className="checkout-field">Cidade<input name="city" type="text" autoComplete="address-level2" maxLength={80} required disabled={locked || phase === 'sending'} /></label>
            <label className="checkout-field">Estado (UF)<input name="state" type="text" autoComplete="address-level1" maxLength={2} minLength={2} placeholder="UF" required disabled={locked || phase === 'sending'} /></label>
          </div>
        </section>

        <section className="checkout-form-section" aria-labelledby="checkout-services-title">
          <h4 id="checkout-services-title">Entrega e pagamento</h4>
          <div className="checkout-service-grid">
            <div className="checkout-service-card"><span>Frete</span><strong>{totals.shippingCents === 0 ? 'Grátis' : formatCents(totals.shippingCents)}</strong><small>{totals.shippingCents === 0 ? 'Frete grátis para subtotal a partir de R$ 150,00.' : 'Frete fixo para subtotal abaixo de R$ 150,00.'}</small></div>
            <div className="checkout-service-card"><span>Pagamento</span><strong>Pix</strong><small>QR Code e código copia e cola.</small></div>
          </div>
        </section>

        <section className="checkout-form-section" aria-labelledby="checkout-order-title">
          <h4 id="checkout-order-title">Resumo do pedido</h4>
          <div className="checkout-order-lines">
            {cart.map(({ product, quantity }) => (
              <div className="checkout-order-line" key={product.id}><span>{product.name} <small>× {quantity}</small></span><strong>{formatPrice(product.price * quantity)}</strong></div>
            ))}
          </div>
          <div className="checkout-cost-lines">
            <div className="checkout-cost-row"><span>Subtotal dos produtos · {itemCount} {itemCount === 1 ? 'item' : 'itens'}</span><strong>{formatCents(totals.subtotalCents)}</strong></div>
            <div className="checkout-cost-row"><span>Frete</span><strong>{totals.shippingCents === 0 ? 'Grátis' : formatCents(totals.shippingCents)}</strong></div>
          </div>
          <div className="checkout-summary"><span>Total do pedido</span><strong>{formatCents(totals.totalCents)}</strong></div>
          <p className="checkout-shipping-note">{totals.shippingCents === 0 ? 'Você ganhou frete grátis nesta compra.' : `Faltam ${formatCents(Math.max(0, 15_000 - totals.subtotalCents))} em produtos para o frete grátis.`}</p>
        </section>

        <p className="checkout-privacy-note">Seus dados de contato e endereço serão usados para processar o pedido, o pagamento e a entrega.</p>
        <button className="button button-dark checkout-button" type="submit" disabled={phase === 'sending' || phase === 'pending' || phase === 'paid'}>
          {phase === 'sending' ? <><LoaderCircle className="spin-icon" size={16} /> Processando com segurança</> : phase === 'pending' ? <><Clock3 size={16} /> {pixCode ? 'Aguardando pagamento' : 'Aguardando confirmação'}</> : phase === 'paid' ? <><CheckCircle2 size={16} /> Pagamento confirmado</> : <>Continuar para pagamento <ArrowRight size={16} /></>}
        </button>
      </form>

      {phase === 'preview' && <div className="checkout-state checkout-state-preview" role="status"><Check size={16} /><div><strong>Simulação de compra</strong><span>Esta compra é apenas uma simulação. Nenhum pagamento foi iniciado.</span></div></div>}
      {phase === 'pending' && <div className="pix-payment-card" role="status">
        <div className="pix-payment-title"><Clock3 size={17} /><div><strong>{pixCode ? 'Pix aguardando pagamento' : 'Aguardando confirmação do pagamento'}</strong><span>A confirmação aparecerá aqui assim que o pagamento for aprovado.</span></div></div>
        {!pixCode ? <div className="pix-qr-placeholder"><Clock3 size={24} /><span>Aguardando a confirmação do pagamento</span></div> : qrImage ? <img className="pix-qr-image" src={qrImage} alt="QR Code Pix do pedido" /> : <div className="pix-qr-placeholder"><LoaderCircle className="spin-icon" size={24} /><span>Preparando QR Code</span></div>}
        {pixCode && expiresAt && <p className="pix-expires">Válido até {new Date(expiresAt).toLocaleString('pt-BR')}</p>}
        {pixCode && <>
          <label className="pix-code-label" htmlFor="pix-copy-code">Pix copia e cola</label>
          <textarea id="pix-copy-code" className="pix-code-input" value={pixCode} readOnly rows={4} />
          <button className="button button-outline pix-copy-button" type="button" onClick={copyPixCode}>{copied ? <><Check size={15} /> Copiado</> : <><Clipboard size={15} /> Copiar código Pix</>}</button>
        </>}
      </div>}
      {phase === 'paid' && <div className="checkout-state checkout-state-success" role="status"><CheckCircle2 size={18} /><div><strong>Pagamento confirmado</strong><span>Seu pedido foi registrado para preparação e entrega.</span></div></div>}
      {phase === 'expired' && <div className="checkout-state checkout-state-warning" role="status"><XCircle size={18} /><div><strong>Pix expirado</strong><span>Gere um novo Pix para pagar. O frete e o total serão conferidos novamente.</span></div></div>}
      {phase === 'error' && <div className="checkout-state checkout-state-error" role="alert"><XCircle size={17} /><span>{errorMessage}</span></div>}

      <button className="button button-outline checkout-back-button" type="button" onClick={onBack}><ArrowRight className="back-arrow" size={16} /> Voltar à sacola</button>
      <p className="no-order-note">Após pagar, aguarde a confirmação nesta página. O comprovante sozinho não confirma o pagamento.</p>
    </div>
  )
}
