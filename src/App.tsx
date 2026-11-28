import { useCallback, useEffect, useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowDown,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clipboard,
  Gift,
  Heart,
  Image as ImageIcon,
  Lightbulb,
  Menu,
  Minus,
  PackageCheck,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  TreePine,
  X,
} from 'lucide-react'
import { products, type CategoryId, type Product } from './products'
import { productSpecs } from './productSpecs'
import CheckoutPanel from './CheckoutPanel'
import OrderTrackingPage from './OrderTrackingPage'
import { clearLegacyTrackingTokens } from './orderTracking'

type CartLine = { product: Product; quantity: number }

const categories: { id: CategoryId; name: string; icon: LucideIcon }[] = [
  { id: 'all', name: 'Tudo de Natal', icon: Sparkles },
  { id: 'trees', name: 'Árvores', icon: TreePine },
  { id: 'wreaths', name: 'Guirlandas', icon: Circle },
  { id: 'ornaments', name: 'Enfeites', icon: Star },
  { id: 'lights', name: 'Luzes', icon: Lightbulb },
  { id: 'frames', name: 'Quadros', icon: ImageIcon },
  { id: 'gifts', name: 'Presentes & Casa', icon: Gift },
]

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const formatPrice = (price: number) => money.format(price)
const FREE_SHIPPING_THRESHOLD_CENTS = 15_000
const FIXED_SHIPPING_CENTS = 1_490
const toCents = (amount: number) => Math.round(amount * 100)
const getShippingCents = (subtotal: number) => toCents(subtotal) >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : FIXED_SHIPPING_CENTS
const formatCents = (amount: number) => formatPrice(amount / 100)

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 48 48" fill="none">
        <path d="M24 4.5 28.2 18l13.1-6.3-7.7 12.1 12.1 7.7-14.1.2L28 45l-4-13.4-13.4 4 6.8-12.4-12-7.8 14.1.2L24 4.5Z" />
        <circle cx="24" cy="24" r="4.4" />
      </svg>
    </span>
  )
}

function ProductPhoto({ product, compact = false }: { product: Product; compact?: boolean }) {
  if (product.image) {
    return <img className={compact ? 'product-photo compact-photo' : 'product-photo'} src={product.image} alt={product.name} loading="lazy" />
  }
  return (
    <div className={`photo-pending tone-${product.tone}`} aria-label={`Foto profissional de ${product.name} em preparação`}>
      <Sparkles size={compact ? 17 : 23} />
      {!compact && <span>Foto em produção</span>}
    </div>
  )
}

function CheckoutPreview(props: { cart: CartLine[]; itemCount: number; cartTotal: number; onBack: () => void; onPaid: (totalCents: number, trackingToken: string) => void }) {
  return <CheckoutPanel {...props} />
}

function ThankYouPage({ totalCents, trackingToken, onContinueShopping, onTrackOrder }: { totalCents: number; trackingToken: string; onContinueShopping: () => void; onTrackOrder: (token: string) => void }) {
  const [copied, setCopied] = useState(false)

  async function copyTrackingCode() {
    try {
      await navigator.clipboard.writeText(trackingToken)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="thank-you-page">
      <header className="thank-you-header">
        <div className="brand">
          <BrandMark />
          <span className="brand-copy"><strong>Estação <em>de</em> Natal</strong><small>A magia mora nos detalhes</small></span>
        </div>
      </header>
      <main className="thank-you-main">
        <section className="thank-you-card" aria-labelledby="thank-you-title">
          <span className="thank-you-check"><CheckCircle2 size={34} /></span>
          <span className="eyebrow small-eyebrow">Pagamento confirmado</span>
          <h1 id="thank-you-title">Obrigado pelo seu pedido!</h1>
          <p>Seu pedido está confirmado e seguirá para preparação.</p>
          <div className="thank-you-total">
            <span>Total do pedido</span>
            <strong>{formatCents(totalCents)}</strong>
          </div>
          <div className="thank-you-tracking-code">
            <span>Código para acompanhar este pedido</span>
            <code>{trackingToken}</code>
            <button className="button button-outline thank-you-copy-button" type="button" onClick={() => void copyTrackingCode()}>{copied ? <Check size={14} /> : <Clipboard size={14} />}{copied ? 'Código copiado' : 'Copiar código'}</button>
          </div>
          <p className="thank-you-message"><Sparkles size={15} /> Que a magia do Natal chegue até você.</p>
          <button className="button button-outline thank-you-track-button" onClick={() => onTrackOrder(trackingToken)}>
            <PackageCheck size={16} /> Acompanhar pedido
          </button>
          <button className="button button-dark thank-you-button" onClick={onContinueShopping}>
            Continuar comprando <ArrowRight size={16} />
          </button>
        </section>
      </main>
      <footer className="thank-you-footer">Estação de Natal <span>·</span> A magia mora nos detalhes</footer>
    </div>
  )
}

function App() {
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all')
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [cart, setCart] = useState<CartLine[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const [panel, setPanel] = useState<'cart' | 'checkout' | null>(null)
  const [toast, setToast] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [paidOrderTotalCents, setPaidOrderTotalCents] = useState<number | null>(null)
  const [paidOrderTrackingToken, setPaidOrderTrackingToken] = useState('')
  const [showOrderTracking, setShowOrderTracking] = useState(false)
  const [activeTrackingToken, setActiveTrackingToken] = useState<string | null>(null)

  const visibleProducts = useMemo(() => products.filter((product) => {
    const matchesCategory = activeCategory === 'all' || product.category === activeCategory
    const searchText = `${product.name} ${product.description} ${product.categoryName}`.toLocaleLowerCase('pt-BR')
    return matchesCategory && searchText.includes(query.trim().toLocaleLowerCase('pt-BR'))
  }), [activeCategory, query])
  const itemCount = cart.reduce((sum, line) => sum + line.quantity, 0)
  const cartTotal = cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0)
  const shippingCents = getShippingCents(cartTotal)
  const orderTotalCents = toCents(cartTotal) + shippingCents

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 3000)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    clearLegacyTrackingTokens()
  }, [])

  useEffect(() => {
    if (!selectedProduct) return
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedProduct(null)
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [selectedProduct])

  const handlePaymentPaid = useCallback((totalCents: number, trackingToken: string) => {
    setPaidOrderTotalCents(totalCents)
    setPaidOrderTrackingToken(trackingToken)
  }, [])

  function openOrderTracking(token?: string | null) {
    setPaidOrderTotalCents(null)
    setActiveTrackingToken(token ?? null)
    setShowOrderTracking(true)
    setPanel(null)
  }

  function closeOrderTracking() {
    setShowOrderTracking(false)
    setActiveTrackingToken(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function selectCategory(category: CategoryId) {
    setActiveCategory(category)
    document.getElementById('colecao')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function addToCart(product: Product) {
    setCart((current) => {
      const existing = current.find((line) => line.product.id === product.id)
      if (existing) return current.map((line) => line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line)
      return [...current, { product, quantity: 1 }]
    })
    setToast(`${product.name} adicionada à sacola`)
  }

  function changeQuantity(productId: string, amount: number) {
    setCart((current) => current
      .map((line) => line.product.id === productId ? { ...line, quantity: line.quantity + amount } : line)
      .filter((line) => line.quantity > 0))
  }

  function toggleFavorite(productId: string) {
    setFavorites((current) => current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId])
  }

  function closePanel() {
    setPanel(null)
  }

  if (showOrderTracking) {
    return <OrderTrackingPage initialToken={activeTrackingToken} onBack={closeOrderTracking} />
  }

  if (paidOrderTotalCents !== null) {
    return (
      <ThankYouPage
        totalCents={paidOrderTotalCents}
        trackingToken={paidOrderTrackingToken}
        onTrackOrder={(token) => openOrderTracking(token)}
        onContinueShopping={() => {
          setPaidOrderTotalCents(null)
          setPaidOrderTrackingToken('')
          setCart([])
          setPanel(null)
          setSelectedProduct(null)
          setToast('')
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
      />
    )
  }

  return (
    <div className="site-shell">
      <div className="announcement-bar">
        <span className="announcement-star"><Star size={12} fill="currentColor" /></span>
        <span>Black Friday de Natal · preços especiais de queima de estoque</span>
        <span className="announcement-star"><Star size={12} fill="currentColor" /></span>
      </div>

      <header className="site-header">
        <button className="mobile-menu icon-button" aria-label="Abrir menu" onClick={() => document.getElementById('categorias')?.scrollIntoView({ behavior: 'smooth' })}>
          <Menu size={21} />
        </button>
        <a className="brand" href="#inicio" aria-label="Estação de Natal — início">
          <BrandMark />
          <span className="brand-copy"><strong>Estação <em>de</em> Natal</strong><small>A magia mora nos detalhes</small></span>
        </a>
        <nav className="desktop-nav" aria-label="Navegação principal">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Início</button>
          <button onClick={() => selectCategory('trees')}>Árvores</button>
          <button onClick={() => selectCategory('ornaments')}>Enfeites</button>
          <button onClick={() => selectCategory('frames')}>Personalizados</button>
          <button onClick={() => selectCategory('gifts')}>Presentes</button>
          <button onClick={() => openOrderTracking()}>Acompanhar pedido</button>
        </nav>
        <div className="header-actions">
          <div className={`header-search ${searchOpen ? 'search-open' : ''}`}>
            <Search size={17} />
            <input aria-label="Buscar na vitrine" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="O que você procura?" />
            {query && <button className="search-clear" onClick={() => setQuery('')} aria-label="Limpar busca"><X size={14} /></button>}
          </div>
          <button className="icon-button mobile-search" aria-label={searchOpen ? 'Fechar busca' : 'Abrir busca'} onClick={() => setSearchOpen(!searchOpen)}>
            {searchOpen ? <X size={20} /> : <Search size={20} />}
          </button>
          <button className="icon-button favorite-header" aria-label={`Favoritos${favorites.length ? `, ${favorites.length} itens` : ''}`} onClick={() => { setQuery(''); selectCategory('all'); document.getElementById('colecao')?.scrollIntoView({ behavior: 'smooth' }) }}>
            <Heart size={20} />
            {favorites.length > 0 && <span className="mini-count">{favorites.length}</span>}
          </button>
          <button className="cart-button" onClick={() => setPanel('cart')} aria-label={`Abrir sacola, ${itemCount} itens`}>
            <ShoppingBag size={18} /><span className="cart-label">Sacola</span><span className="cart-count">{itemCount}</span>
          </button>
        </div>
      </header>
      {searchOpen && <div className="mobile-search-row"><Search size={18} /><input autoFocus aria-label="Buscar produtos" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Busque por árvores, luzes, presentes..." /></div>}

      <main>
        <section className="hero" id="inicio">
          <div className="hero-snowfall" aria-hidden="true">
            {Array.from({ length: 16 }, (_, index) => <i className="snowflake" key={index} />)}
          </div>
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-line" /> A temporada mais especial do ano <span className="eyebrow-line" /></div>
            <h1>Seu Natal mais lindo<br /><em>começa por aqui.</em></h1>
            <p>Decorações, luzes e presentes escolhidos para deixar a casa pronta para celebrar — com preços Black Friday na queima de estoque.</p>
            <div className="hero-actions">
              <span className="hero-note"><Sparkles size={15} /> Preços especiais em toda a coleção</span>
            </div>
            <div className="hero-ornament ornament-a"><Star size={19} /></div>
            <div className="hero-ornament ornament-b"><Sparkles size={21} /></div>
          </div>
          <div className="hero-art-wrap">
            <div className="hero-arc" />
            <div className="hero-gallery" aria-label="Fotos de produtos natalinos">
              <figure className="hero-shot hero-shot-main"><ProductPhoto product={products[0]} /><figcaption>Árvores</figcaption></figure>
              <figure className="hero-shot hero-shot-left"><ProductPhoto product={products[3]} /><figcaption>Guirlandas</figcaption></figure>
              <figure className="hero-shot hero-shot-right"><ProductPhoto product={products[7]} /><figcaption>Enfeites</figcaption></figure>
            </div>
            <div className="hero-seal"><span>ofertas de</span><strong>Natal</strong><Star size={14} fill="currentColor" /></div>
            <span className="hero-spark hero-spark-one"><Star size={18} fill="currentColor" /></span>
            <span className="hero-spark hero-spark-two"><Sparkles size={22} /></span>
          </div>
          <div className="hero-bottom-note"><span>Explore</span> a coleção <ArrowDown size={14} /></div>
        </section>

        <section className="category-section section-wrap" id="categorias">
          <div className="section-heading category-heading">
            <div><span className="eyebrow small-eyebrow">Encontre seu encanto</span><h2>Um detalhe para <em>cada cantinho</em></h2></div>
            <p>Explore as categorias e encontre o que combina com o seu Natal.</p>
          </div>
          <div className="category-list" role="group" aria-label="Filtrar por categoria">
            {categories.map(({ id, name, icon: Icon }, index) => (
              <button key={id} className={`category-pill ${activeCategory === id ? 'active' : ''}`} onClick={() => selectCategory(id)} aria-pressed={activeCategory === id}>
                <span className={`category-icon category-color-${index}`}><Icon size={20} strokeWidth={1.5} /></span><span>{name}</span><ChevronRight className="category-chevron" size={14} />
              </button>
            ))}
          </div>
        </section>

        <section className="collection-section section-wrap" id="colecao">
          <div className="section-heading collection-heading">
            <div><span className="eyebrow small-eyebrow">Black Friday · Queima de estoque</span><h2>Decoração de <em>Natal</em></h2></div>
            <div className="collection-tools"><span>{visibleProducts.length} produtos</span><button className="text-link" onClick={() => { setActiveCategory('all'); setQuery('') }}>Ver tudo <ArrowRight size={16} /></button></div>
          </div>
          <div className="demo-notice"><Sparkles size={15} /><span>Preços especiais de Black Friday e queima de estoque em toda a coleção · Frete grátis a partir de R$ 150,00; abaixo desse valor, taxa fixa de R$ 14,90.</span></div>
          {visibleProducts.length > 0 ? (
            <div className="product-grid">
              {visibleProducts.map((product, index) => (
                <article className="product-card" key={product.id} style={{ animationDelay: `${Math.min(index, 12) * 35}ms` }}>
                  <div className={`product-visual tone-${product.tone}`}>
                    <button className="product-photo-trigger" type="button" onClick={() => setSelectedProduct(product)} aria-label={`Ver detalhes de ${product.name}`}>
                      <ProductPhoto product={product} />
                    </button>
                    <span className="product-label">{product.categoryName}</span>
                    <span className="bf-product-tag">BLACK<br />FRIDAY</span>
                    <button className={`favorite-button ${favorites.includes(product.id) ? 'is-favorite' : ''}`} aria-label={favorites.includes(product.id) ? `Remover ${product.name} dos favoritos` : `Adicionar ${product.name} aos favoritos`} aria-pressed={favorites.includes(product.id)} onClick={() => toggleFavorite(product.id)}>
                      <Heart size={17} fill={favorites.includes(product.id) ? 'currentColor' : 'none'} />
                    </button>
                    <button className="quick-add" onClick={() => addToCart(product)} aria-label={`Adicionar ${product.name} à sacola`}><Plus size={19} /></button>
                  </div>
                  <div className="product-info">
                    <div className="product-title-row"><h3><button className="product-name-trigger" type="button" onClick={() => setSelectedProduct(product)}>{product.name}</button></h3><span className="product-spark"><Star size={12} fill="currentColor" /></span></div>
                    <p>{product.description}</p>
                    <div className="product-price-row"><span>Preço Black Friday</span><strong>{formatPrice(product.price)}</strong></div>
                    <div className="product-footer"><span>Queima de estoque</span><button onClick={() => addToCart(product)}>Adicionar à sacola <ArrowRight size={14} /></button></div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-search"><Sparkles size={25} /><h3>Nenhum produto encontrado</h3><p>Tente outra palavra ou escolha uma categoria diferente.</p><button className="text-link" onClick={() => { setQuery(''); setActiveCategory('all') }}>Limpar filtros <ArrowRight size={15} /></button></div>
          )}
        </section>

        <section className="personalization-section section-wrap">
          <div className="personalization-card">
            <div className="personalization-copy"><span className="eyebrow small-eyebrow">Com um toque só seu</span><h2>Presentes que contam<br /><em>histórias de família.</em></h2><p>Quadros personalizados para guardar nomes, datas e momentos que fazem o seu Natal ser único.</p><button className="button button-light" onClick={() => selectCategory('frames')}>Ver quadros personalizados <ArrowRight size={16} /></button></div>
            <div className="frame-showcase" aria-hidden="true"><span className="frame-stamp"><Star size={16} fill="currentColor" /></span><div className="mock-frame"><div className="mock-frame-inner"><Sparkles size={21} /><span>nosso<br /><em>Natal</em></span><small>com amor, sempre</small></div></div><span className="frame-ribbon" /></div>
            <span className="personalization-star star-left"><Star size={20} /></span><span className="personalization-star star-right"><Sparkles size={22} /></span>
          </div>
        </section>

        <section className="closing-note section-wrap"><span className="closing-star"><Star size={15} fill="currentColor" /></span><p>Que a sua casa se encha de luz,<br /><em>e o coração, de boas lembranças.</em></p><span className="closing-star"><Star size={15} fill="currentColor" /></span></section>
      </main>

      <footer className="site-footer"><a className="footer-brand" href="#inicio"><BrandMark /><span>Estação de Natal</span></a><button className="footer-order-link" type="button" onClick={() => openOrderTracking()}>Acompanhar pedido <ArrowRight size={13} /></button><span className="footer-copy">A magia mora nos detalhes.</span><span className="footer-demo">Black Friday · Queima de estoque</span></footer>

      {selectedProduct && (
        <div className="product-detail-backdrop" onClick={(event) => { if (event.target === event.currentTarget) setSelectedProduct(null) }}>
          <section className="product-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="product-detail-title">
            <button className="icon-button product-detail-close" type="button" onClick={() => setSelectedProduct(null)} aria-label="Fechar detalhes"><X size={20} /></button>
            <div className={`product-detail-photo tone-${selectedProduct.tone}`}><ProductPhoto product={selectedProduct} /></div>
            <div className="product-detail-copy">
              <span className="eyebrow small-eyebrow">{selectedProduct.categoryName}</span>
              <h2 id="product-detail-title">{selectedProduct.name}</h2>
              <p>{selectedProduct.description}</p>
              <div className="product-specs">
                <h3>Detalhes do produto</h3>
                <dl>
                  <div><dt>Tamanho</dt><dd>{productSpecs[selectedProduct.id]?.size}</dd></div>
                  <div><dt>Cores</dt><dd>{productSpecs[selectedProduct.id]?.colors}</dd></div>
                  <div><dt>Material</dt><dd>{productSpecs[selectedProduct.id]?.material}</dd></div>
                  <div><dt>Na embalagem</dt><dd>{productSpecs[selectedProduct.id]?.contents}</dd></div>
                </dl>
              </div>
              <div className="product-detail-price"><span>Preço Black Friday</span><strong>{formatPrice(selectedProduct.price)}</strong></div>
              <button className="button button-dark product-detail-add" type="button" onClick={() => { addToCart(selectedProduct); setSelectedProduct(null) }}>Adicionar à sacola <ArrowRight size={16} /></button>
            </div>
          </section>
        </div>
      )}

      {toast && <div className="toast-message" role="status"><Check size={17} />{toast}</div>}

      {panel && (
        <div className="panel-layer" onMouseDown={(event) => { if (event.target === event.currentTarget) closePanel() }}>
          <section className="side-panel" role="dialog" aria-modal="true" aria-labelledby="panel-title">
            <div className="panel-header"><div><span className="eyebrow small-eyebrow">Estação de Natal</span><h2 id="panel-title">{panel === 'cart' ? 'Sua sacola' : 'Finalizar pedido'}</h2></div><button className="icon-button close-panel" onClick={closePanel} aria-label="Fechar"><X size={21} /></button></div>
            {panel === 'cart' ? (
              <>
                {cart.length ? <div className="cart-lines">{cart.map(({ product, quantity }) => (
                  <div className="cart-line" key={product.id}><div className={`cart-thumb tone-${product.tone}`}><ProductPhoto product={product} compact /></div><div className="cart-line-info"><h3>{product.name}</h3><strong className="cart-unit-price">{formatPrice(product.price)}</strong><div className="quantity-control"><button onClick={() => changeQuantity(product.id, -1)} aria-label={`Diminuir ${product.name}`}><Minus size={13} /></button><span>{quantity}</span><button onClick={() => changeQuantity(product.id, 1)} aria-label={`Aumentar ${product.name}`}><Plus size={13} /></button></div></div><strong className="cart-line-total">{formatPrice(product.price * quantity)}</strong><button className="remove-line" onClick={() => changeQuantity(product.id, -quantity)} aria-label={`Remover ${product.name}`}><X size={16} /></button></div>
                ))}</div> : <div className="empty-cart"><span className="empty-bag"><ShoppingBag size={28} /></span><h3>Sua sacola está esperando</h3><p>Adicione alguns favoritos para continuar.</p><button className="button button-dark" onClick={closePanel}>Explorar produtos <ArrowRight size={16} /></button></div>}
                <div className="cart-bottom"><div className="cart-price-lines"><div className="cart-price-row"><span>Subtotal</span><strong>{formatPrice(cartTotal)}</strong></div><div className="cart-price-row"><span>Frete</span><strong>{shippingCents === 0 ? 'Grátis' : formatCents(shippingCents)}</strong></div></div><div className="cart-total-row"><span>Total</span><strong>{formatCents(orderTotalCents)}</strong></div><p className="cart-disclaimer">{shippingCents === 0 ? 'Frete grátis aplicado a partir de R$ 150,00.' : `Frete fixo de R$ 14,90. Faltam ${formatCents(FREE_SHIPPING_THRESHOLD_CENTS - toCents(cartTotal))} para o frete grátis.`} Confira o valor final antes de pagar.</p><button className="button button-dark checkout-button" disabled={!cart.length} onClick={() => setPanel('checkout')}>Continuar para pagamento <ArrowRight size={16} /></button><span className="secure-note"><Check size={13} /> O Pix é gerado ao confirmar o pedido</span></div>
              </>
            ) : (
              <CheckoutPreview cart={cart} itemCount={itemCount} cartTotal={cartTotal} onBack={() => setPanel('cart')} onPaid={handlePaymentPaid} />
            )}
          </section>
        </div>
      )}
    </div>
  )
}

export default App
