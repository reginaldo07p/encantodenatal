import { useEffect, useState } from 'react'
import { ArrowLeft, Check, CheckCircle2, Clock3, PackageCheck, RefreshCw, Search, Truck, XCircle } from 'lucide-react'
import { isTrackingToken } from './orderTracking'

type TrackedOrder = {
  orderCode: string
  paymentStatus: 'creating' | 'pending' | 'paid' | 'expired' | 'failed'
  fulfillmentStatus: 'received' | 'processing' | 'shipped' | 'delivered'
  subtotalCents: number
  shippingCents: number
  totalCents: number
  createdAt: string
  updatedAt: string
  paidAt: string | null
  shippedAt: string | null
  deliveredAt: string | null
  carrier: string | null
  trackingCode: string | null
  items: Array<{ name: string; quantity: number; unitPriceCents: number; lineTotalCents: number }>
}

type LookupResult = { token: string; order: TrackedOrder | null; error: string }

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const formatCents = (cents: number) => money.format(cents / 100)
const dateTime = (value: string | null) => value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : null

const paymentLabels: Record<TrackedOrder['paymentStatus'], string> = {
  creating: 'Confirmando pagamento',
  pending: 'Aguardando pagamento',
  paid: 'Pagamento confirmado',
  expired: 'Pix expirado',
  failed: 'Pagamento não concluído',
}
const fulfillmentLabels: Record<TrackedOrder['fulfillmentStatus'], string> = {
  received: 'Pedido recebido',
  processing: 'Em preparação',
  shipped: 'Enviado',
  delivered: 'Entregue',
}

export default function OrderTrackingPage({ initialToken, onBack }: { initialToken?: string | null; onBack: () => void }) {
  const [tokens, setTokens] = useState<string[]>([])
  const [manualCode, setManualCode] = useState('')
  const [results, setResults] = useState<LookupResult[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshCount, setRefreshCount] = useState(0)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    const initial = initialToken && isTrackingToken(initialToken) ? initialToken.toLowerCase() : null
    setTokens(initial ? [initial] : [])
  }, [initialToken])

  useEffect(() => {
    if (!tokens.length) {
      setResults([])
      return
    }
    let cancelled = false
    setLoading(true)
    void Promise.all(tokens.map(async (token): Promise<LookupResult> => {
      try {
        const response = await fetch('/api/order-tracking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trackingToken: token }),
          cache: 'no-store',
        })
        const result = await response.json().catch(() => null) as { order?: TrackedOrder; error?: string } | null
        if (!response.ok || !result?.order) return { token, order: null, error: result?.error ?? 'Não foi possível consultar este pedido.' }
        return { token, order: result.order, error: '' }
      } catch {
        return { token, order: null, error: 'Sem conexão no momento. Tente atualizar a consulta.' }
      }
    })).then((loaded) => { if (!cancelled) setResults(loaded) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [tokens, refreshCount])

  function addManualCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const token = manualCode.trim().toLowerCase()
    if (!isTrackingToken(token)) {
      setFormError('Confira o código. Ele tem o formato 00000000-0000-4000-8000-000000000000.')
      return
    }
    setFormError('')
    setTokens((current) => [token, ...current.filter((saved) => saved.toLowerCase() !== token)].slice(0, 20))
    setManualCode('')
  }

  function removeCode(token: string) {
    setTokens((current) => current.filter((saved) => saved !== token))
  }

  return (
    <div className="order-tracking-page">
      <header className="order-tracking-header">
        <a className="brand" href="/" aria-label="Estação de Natal — loja">
          <span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none"><path d="M24 4.5 28.2 18l13.1-6.3-7.7 12.1 12.1 7.7-14.1.2L28 45l-4-13.4-13.4 4 6.8-12.4-12-7.8 14.1.2L24 4.5Z"/><circle cx="24" cy="24" r="4.4"/></svg></span>
          <span className="brand-copy"><strong>Estação <em>de</em> Natal</strong><small>A magia mora nos detalhes</small></span>
        </a>
        <button className="button button-outline order-back-button" type="button" onClick={onBack}><ArrowLeft size={15} /> Voltar à loja</button>
      </header>
      <main className="order-tracking-main">
        <div className="order-tracking-heading">
          <span className="eyebrow small-eyebrow">Sua compra, com carinho</span>
          <h1>Acompanhe seus pedidos</h1>
          <p>Consulte o pagamento e as atualizações de preparação e envio com seu código de acompanhamento.</p>
        </div>

        <section className="order-code-panel" aria-labelledby="order-code-title">
          <div className="order-code-heading"><span className="order-code-icon"><Search size={18} /></span><div><h2 id="order-code-title">Consultar pedido</h2><p>Use o código mostrado na confirmação da compra.</p></div></div>
          <form className="order-code-form" onSubmit={addManualCode}>
            <label className="checkout-field order-code-field">Código de acompanhamento<input value={manualCode} onChange={(event) => setManualCode(event.target.value)} placeholder="Cole aqui o código do pedido" autoComplete="off" spellCheck={false} /></label>
            <button className="button button-dark" type="submit">Consultar <ArrowLeft className="order-code-arrow" size={15} /></button>
          </form>
          {formError && <p className="order-tracking-error" role="alert">{formError}</p>}
        </section>

        <section className="order-tracking-results" aria-label="Pedidos consultados nesta sessão">
          <div className="order-results-heading"><h2>{tokens.length ? 'Pedidos consultados nesta sessão' : 'Nenhum pedido consultado nesta sessão'}</h2>{tokens.length > 0 && <button className="order-refresh-button" type="button" onClick={() => setRefreshCount((count) => count + 1)} disabled={loading}><RefreshCw className={loading ? 'spin-icon' : ''} size={15} /> Atualizar</button>}</div>
          {!tokens.length && <p className="order-tracking-empty">Use o código da confirmação da compra para consultar seu pedido. Guarde-o em local seguro para consultar novamente mais tarde.</p>}
          {results.map(({ token, order, error }) => order ? (
            <article className="tracked-order-card" key={token}>
              <div className="tracked-order-top"><div><span className="tracked-order-kicker">Pedido</span><h3>#{order.orderCode}</h3><span className="tracked-order-date">Feito em {dateTime(order.createdAt)}</span></div><span className={`order-status-pill status-${order.paymentStatus}`}><CheckCircle2 size={14} /> {paymentLabels[order.paymentStatus]}</span></div>
              <div className="tracked-order-timeline">
                <div className="tracked-order-step is-complete"><span><Check size={14} /></span><div><strong>Pedido recebido</strong><small>{dateTime(order.createdAt)}</small></div></div>
                <div className={`tracked-order-step ${order.paymentStatus === 'paid' ? 'is-complete' : 'is-current'}`}><span>{order.paymentStatus === 'paid' ? <Check size={14} /> : <Clock3 size={14} />}</span><div><strong>{paymentLabels[order.paymentStatus]}</strong><small>{order.paidAt ? dateTime(order.paidAt) : order.paymentStatus === 'pending' ? 'Assim que o Pix for aprovado, o status será atualizado.' : 'Status atual do pagamento.'}</small></div></div>
                <div className={`tracked-order-step ${order.fulfillmentStatus === 'shipped' || order.fulfillmentStatus === 'delivered' ? 'is-complete' : order.fulfillmentStatus === 'processing' ? 'is-current' : ''}`}><span>{order.fulfillmentStatus === 'shipped' || order.fulfillmentStatus === 'delivered' ? <Check size={14} /> : <PackageCheck size={14} />}</span><div><strong>{fulfillmentLabels[order.fulfillmentStatus]}</strong><small>{order.fulfillmentStatus === 'received' ? 'A preparação e os dados de envio aparecerão aqui quando forem atualizados pela loja.' : order.fulfillmentStatus === 'processing' ? 'Seu pedido está sendo preparado.' : order.fulfillmentStatus === 'delivered' ? `Entregue${order.deliveredAt ? ` em ${dateTime(order.deliveredAt)}` : ''}.` : `Enviado${order.shippedAt ? ` em ${dateTime(order.shippedAt)}` : ''}.`}</small></div></div>
              </div>
              {(order.carrier || order.trackingCode) && <div className="tracked-shipment-info"><Truck size={16} /><div><strong>Informações de envio</strong><span>{order.carrier ?? 'Transportadora não informada'}{order.trackingCode ? ` · Código ${order.trackingCode}` : ''}</span></div></div>}
              <div className="tracked-order-items"><h4>Itens do pedido</h4>{order.items.map((item, index) => <div className="tracked-order-item" key={`${item.name}-${index}`}><span>{item.name} <small>× {item.quantity}</small></span><strong>{formatCents(item.lineTotalCents)}</strong></div>)}</div>
              <div className="tracked-order-totals"><span>Produtos <strong>{formatCents(order.subtotalCents)}</strong></span><span>Frete <strong>{order.shippingCents === 0 ? 'Grátis' : formatCents(order.shippingCents)}</strong></span><span className="tracked-total">Total <strong>{formatCents(order.totalCents)}</strong></span></div>
              <button className="forget-order-code" type="button" onClick={() => removeCode(token)}>Remover esta consulta</button>
            </article>
          ) : (
            <article className="tracked-order-error" key={token} role="alert"><XCircle size={17} /><div><strong>Não foi possível localizar este pedido</strong><span>{error || 'Confira o código de acompanhamento.'}</span></div><button type="button" onClick={() => removeCode(token)} aria-label="Remover código inválido">Remover</button></article>
          ))}
        </section>
      </main>
      <footer className="thank-you-footer">Estação de Natal <span>·</span> A magia mora nos detalhes</footer>
    </div>
  )
}
