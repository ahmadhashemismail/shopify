import { useEffect, useMemo, useState } from 'react'
import { getCategories, getProducts, createaccount, login, addCartItem, getCartItems, editCartItem, deleteCartItem } from '../api'

const thumbClasses = ['t1', 't2', 't3', 't4', 't5', 't6']
const thumbEmojis = ['🍯', '🎧', '🧢', '🪴', '☕', '🌶️']

function getProductsByCategory(products, categoryId) {
  return products.filter((product) => String(product.category_id) === String(categoryId))
}

function getProductsByType(products, categories, type) {
  const categoryIds = new Set(
    categories
      .filter((category) => category.type === type)
      .map((category) => String(category.id)),
  )

  return products.filter((product) => categoryIds.has(String(product.category_id)))
}

export default function MainPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [selectedCategoryType, setSelectedCategoryType] = useState('')
  const [error, setError] = useState('')
  const [cartcount, setCartCount] = useState(0)
  const [cartProducts, setCartProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)

  // ---- profile / auth state (merged in from Profile page) ----
  const [pageisOpen, setPageisOpen] = useState('mainpage')
  const [form, setForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({ full_name: '', email: '', password: '', confirm: '' })
  const [mode, setMode] = useState('create')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState("")
  const [customer, setCustomer] = useState(() => {
    const saved = localStorage.getItem("account")
    return saved ? JSON.parse(saved) : null
  })
  const [cartdata, setCartdata] = useState({ 'products_id': '', 'user_id': '', 'quantity': '1' })
  const [cartitems, setCartitems] = useState([])
  const [checkoutAddress, setCheckoutAddress] = useState('')

 

  useEffect(() => {
    if (pageisOpen !== 'cart' || !customer?.id || products.length === 0) return

    async function loadCartItems() {
      try {
        const rows = await getCartItems()
        const customerRows = rows.filter((row) => String(row.user_id) === String(customer.id))
        const loadedProducts = customerRows.map((row) => {
          const product = products.find((item) => String(item.id) === String(row.product_id))
          return product
            ? { ...product, quantity: Number(row.quantity), cartItemId: row.id }
            : null
        }).filter(Boolean)
        setCartitems(loadedProducts)
        setCartCount(loadedProducts.reduce((total, item) => total + item.quantity, 0))
      } catch (loadError) {
        setError(loadError.message)
      }
    }

    loadCartItems()
  }, [pageisOpen, customer, products])

  async function handlelogin(e) {
    e.preventDefault()
    setAuthError("")
    setAuthLoading(true)
    try {
      const res = await login(form)
      if (res.error) {
        setAuthError(res.error)
      } else {
        setCustomer(res)
        localStorage.setItem("account", JSON.stringify(res))
      }
    } catch {
      setAuthError("Something went wrong. Please try again.")
    } finally {
      setAuthLoading(false)
    }
  }

  async function handlecreateaccount(e) {
    e.preventDefault()
    setAuthError("")
    if (registerForm.password !== registerForm.confirm) {
      setAuthError("incorrect password")
      return
    }
    setAuthLoading(true)
    try {
      const res = await createaccount({
        full_name: registerForm.full_name,
        email: registerForm.email,
        password: registerForm.password,
      })
      if (res.error) {
        setAuthError(res.error)
      } else {
        setCustomer(res)
        localStorage.setItem("account", JSON.stringify(res))
        setAuthError("")
      }
    } catch {
      setAuthError("Something went wrong. Please try again.")
    } finally {
      setAuthLoading(false)
    }
  }

  function handleSignOut() {
    localStorage.removeItem("account")
    setCustomer(null)
  }
  // ---- end profile / auth state ----

  useEffect(() => {
    async function loadCatalog() {
      try {
        const [productData, categoryData] = await Promise.all([
          getProducts(),
          getCategories(),
        ])
        setProducts(productData)
        setCategories(categoryData)
      } catch (loadError) {
        setError(loadError.message)
      }
    }

    loadCatalog()
  }, [])

  const categoryGroups = useMemo(() => categories.reduce((groups, category) => {
    if (!groups[category.type]) groups[category.type] = []
    groups[category.type].push(category)
    return groups
  }, {}), [categories])

  const filteredProducts = useMemo(() => {
    if (selectedCategoryId) return getProductsByCategory(products, selectedCategoryId)
    if (selectedCategoryType) return getProductsByType(products, categories, selectedCategoryType)
    return products
  }, [products, categories, selectedCategoryId, selectedCategoryType])

  useEffect(() => {
    const revealItems = document.querySelectorAll('.reveal')
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.12 })

    revealItems.forEach((item) => observer.observe(item))

    return () => observer.disconnect()
  }, [filteredProducts.length, pageisOpen])

  useEffect(() => {
    if (!selectedProduct && !pageisOpen) return undefined

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setSelectedProduct(null)
        setPageisOpen('mainpage')
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [selectedProduct, pageisOpen])

  function handleCategoryFilter({ categoryId = '', type = '' } = {}) {
    setSelectedCategoryId(String(categoryId))
    setSelectedCategoryType(type)
  }

  
  async function removeCartProduct(cartItemId) {
    const product = cartitems.find((item) => item.cartItemId === cartItemId)
    if (!product) return

    try {
      await deleteCartItem(cartItemId)
      setCartitems((currentItems) => currentItems.filter((item) => item.cartItemId !== cartItemId))
      setCartProducts((currentProducts) => currentProducts.filter((item) => item.cartItemId !== cartItemId))
      setCartCount((currentCount) => Math.max(0, currentCount - Number(product.quantity)))
    } catch (removeError) {
      setError(removeError.message)
    }
  }

  async function changeCartQuantity(product, change) {
    const nextQuantity = Number(product.quantity) + change
    if (nextQuantity <= 0) {
      await removeCartProduct(product.cartItemId)
      return
    }

    try {
      await editCartItem(product.cartItemId, {
        user_id: customer.id,
        product_id: product.product_id || product.id,
        quantity: nextQuantity,
      })
      setCartitems((currentItems) => currentItems.map((item) => item.cartItemId === product.cartItemId
        ? { ...item, quantity: nextQuantity }
        : item))
      setCartProducts((currentProducts) => currentProducts.map((item) => item.cartItemId === product.cartItemId
        ? { ...item, quantity: nextQuantity }
        : item))
      setCartCount((currentCount) => Math.max(0, currentCount + change))
    } catch (quantityError) {
      setError(quantityError.message)
    }
  }


  function handleProductKeyDown(event, product) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setSelectedProduct(product)
    }
  }
  async function handleAddCart(items) {
    if (!customer?.id) {
      setError('Please sign in before adding items to your cart.')
      return
    }

    const existingItem = cartitems.find((item) => String(item.id) === String(items.id) || String(item.product_id) === String(items.id))
    const quantity = Number(existingItem?.quantity || 0) + 1

    try {
      const item = existingItem?.cartItemId
        ? await editCartItem(existingItem.cartItemId, {
          user_id: customer.id,
          product_id: items.id,
          quantity,
        })
        : await addCartItem({
          product_id: items.id,
          user_id: customer.id,
          quantity,
        })

      const cartProduct = {
        ...items,
        quantity,
        cartItemId: item.id,
        product_id: items.id,
      }
      setCartitems((currentItems) => existingItem
        ? currentItems.map((currentItem) => currentItem.cartItemId === existingItem.cartItemId ? cartProduct : currentItem)
        : [...currentItems, cartProduct])
      setCartProducts((currentProducts) => existingItem
        ? currentProducts.map((currentItem) => currentItem.id === items.id ? cartProduct : currentItem)
        : [...currentProducts, cartProduct])
      setCartCount((currentCount) => currentCount + 1)
      setCartdata(item)
    } catch (error) {
      setError(error.message)
    }
  }
  async function handlegetitems() {
    const items = await getCartItems()
    setCartitems(items)
  }

  function handleCheckout() {
    if (!customer?.id) {
      setError('Please sign in before checkout.')
      return
    }
    if (cartitems.length === 0) {
      setError('Your cart is empty.')
      return
    }
    if (!checkoutAddress.trim()) {
      setError('Please enter your delivery address.')
      return
    }

    const total = cartitems.reduce(
      (sum, product) => sum + Number(product.pprice) * Number(product.quantity),
      0,
    ).toFixed(2)
    const itemsSummary = cartitems
      .map((product) => `- ${product.pname} x${product.quantity} ($${(Number(product.pprice) * Number(product.quantity)).toFixed(2)})`)
      .join('\n')
    const customerName = customer.name || customer.full_name || customer.email || 'Customer'
    const message = [
      'New Jumble order',
      '',
      `Customer: ${customerName}`,
      `Email: ${customer.email || 'Not provided'}`,
      `Address: ${checkoutAddress.trim()}`,
      '',
      'Products:',
      itemsSummary,
      '',
      `Total: $${total}`,
    ].join('\n')
if(!message)return(<p>please enter your details</p>)
    const url = `https://wa.me/96181814215?text=${encodeURIComponent(message)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }
  


  return (
    <>
      {pageisOpen === 'mainpage' && (
        <>
          <header className="site-header">
            <div className="wordmark">jumble<span>.</span></div>
            <div className="header-actions">
              <button className="profile-btn" type="button" aria-label="Open profile" onClick={() => setPageisOpen('profile')}>
                {customer ? (customer.name || customer.full_name || customer.email || '?')[0].toUpperCase() : 'M'}
              </button>
              <button className="cart-pill" type="button" aria-label={`${cartcount} items in cart`} onClick={() => setPageisOpen('cart')}>
                <svg width="20" height="20" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                  <path d="M3 4H5.5L6.4 6M6.4 6H23L20.5 15H8.2M6.4 6L8.6 17H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="10" cy="22" r="1.8" fill="currentColor" />
                  <circle cx="19.5" cy="22" r="1.8" fill="currentColor" />
                </svg>
                <span className="cart-count">{cartcount}</span>
              </button>
            </div>
          </header>

          <nav className="pill-nav" aria-label="Product categories">
            <div className="pill-nav-inner">
              <button className={`pill ${!selectedCategoryId && !selectedCategoryType ? 'active' : ''}`} type="button" onClick={() => handleCategoryFilter()}>
                All
              </button>
              {Object.entries(categoryGroups).map(([type, typeCategories], index) => (
                <div className="category-pill-group" key={type}>
                  <button
                    className={`pill p${(index % 3) + 1} ${selectedCategoryType === type && !selectedCategoryId ? 'active' : ''}`}
                    type="button"
                    onClick={() => handleCategoryFilter({ type })}
                  >
                    {type}
                  </button>
                  {typeCategories.map((category) => (
                    <button
                      className={`pill category-sub-pill ${selectedCategoryId === String(category.id) ? 'active' : ''}`}
                      key={category.id}
                      type="button"
                      onClick={() => handleCategoryFilter({ categoryId: category.id })}
                    >
                      {category.category_name}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </nav>

          <section className="hero">
            <div className="blob b1" />
            <div className="blob b2" />
            <div className="blob b3" />
            <div className="sticker s1">★ new drop</div>
            <div className="sticker s2">free ship $40+</div>
            <div className="sticker s3">est. 2024</div>
            <div className="hero-inner">
              <h1><span className="stroke">every</span><br /><span className="fill">thing.</span></h1>
              <p>One store, no theme, wildly good taste. Snacks next to lamps next to earbuds — somehow it works.</p>
              <div className="hero-cta">
                <button className="btn solid" type="button" onClick={() => document.getElementById('new')?.scrollIntoView({ behavior: 'smooth' })}>Shop the jumble</button>
                <button className="btn outline" type="button" onClick={() => document.getElementById('new')?.scrollIntoView({ behavior: 'smooth' })}>Today&apos;s drops</button>
              </div>
            </div>
          </section>

          <div className="marquee" aria-label="Store benefits">
            <div><span>★</span> FREE SHIPPING OVER $40 <span>★</span> NEW DROPS EVERY FRIDAY <span>★</span> 30-DAY RETURNS <span>★</span> FREE SHIPPING OVER $40 <span>★</span> NEW DROPS EVERY FRIDAY <span>★</span> 30-DAY RETURNS</div>
          </div>

          {error && <p className="empty-state" role="alert">{error}</p>}

          <section id="new">
            <div className="section-head reveal">
              <h2>Fresh off the truck</h2>
            </div>
            <div className="masonry" aria-live="polite">
              {filteredProducts.length === 0 ? (
                <p className="empty-state">No products found in this category.</p>
              ) : filteredProducts.map((product, index) => (
                <article className="m-card reveal" style={{ '--reveal-delay': `${Math.min(index * 70, 350)}ms` }} key={product.id} onClick={() => setSelectedProduct(product)} onKeyDown={(event) => handleProductKeyDown(event, product)} role="button" tabIndex="0">
                  <div className={`m-thumb ${thumbClasses[index % thumbClasses.length]}`}>
                    {product.img ? <img src={product.img} alt="" /> : thumbEmojis[index % thumbEmojis.length]}
                  </div>
                  <div className="m-info">
                    <div className="kind">{product.category_name || product.type || 'Jumble pick'}</div>
                    <h3>{product.pname}</h3>
                    <div className="row">
                      <span className="price">${Number(product.pprice).toFixed(2)}</span>
  
                      <button className="m-add" type="button" aria-label={`Add ${product.pname} to cart`} onClick={(event) => { event.stopPropagation();handleAddCart(product) }}>+</button>
                       </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section>
            <div className="banner reveal">
              <h2>First order? Take 15% off everything.</h2>
              <button className="btn solid banner-btn" type="button">Claim code</button>
            </div>
          </section>

          {selectedProduct && (
            <div className="product-modal-backdrop" onClick={() => setSelectedProduct(null)}>
              <section
                className="product-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="product-modal-title"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  className="modal-close"
                  type="button"
                  aria-label="Close product details"
                  onClick={() => setSelectedProduct(null)}
                >
                  &times;
                </button>
                <div className="modal-product-image">
                  {selectedProduct.img
                    ? <img src={selectedProduct.img} alt={selectedProduct.pname} />
                    : <span>No image</span>}
                </div>
                <p className="eyebrow">Product details</p>
                <h2 id="product-modal-title">{selectedProduct.pname}</h2>
                <strong className="modal-product-price">${Number(selectedProduct.pprice).toFixed(2)}</strong>
                <p className="modal-description">
                  {selectedProduct.discription || 'No description added.'}
                </p>
                <button className="btn solid modal-add-button" type="button" onClick={() => setCartCount((currentCount) => currentCount + 1)}>
                  Add to cart
                </button>
              </section>
            </div>
          )}
          <footer>
            <div className="foot-grid">
              <div>
                <div className="wordmark footer-wordmark">jumble<span>.</span></div>
                <p>A little bit of everything, none of it filler.</p>
              </div>
              <div>
                <h4>Shop</h4>
                <ul><li>Home &amp; kitchen</li><li>Snacks</li><li>Wear</li><li>Small tech</li></ul>
              </div>
              <div>
                <h4>Help</h4>
                <ul><li>Shipping &amp; returns</li><li>Track an order</li><li>Contact</li></ul>
              </div>
            </div>
            <div className="foot-bottom">
              <span>© 2026 Jumble General Co.</span>
              <span>Made for oddly specific taste.</span>
            </div>
          </footer>
        </>)}

      {pageisOpen === 'cart' && (
        <main className="cart-page">
          <header className="cart-page-header">
            <button className="cart-back-link" type="button" onClick={() => setPageisOpen('mainpage')}>
              ← Continue shopping
            </button>
            <div className="wordmark">jumble<span>.</span></div>
            <div className="cart-page-label">Your bag <strong>{cartcount}</strong></div>
          </header>

          <section className="cart-layout">
            <div className="cart-intro">
              <p className="eyebrow">A good choice</p>
              <h1>Your<br /><em>jumble.</em></h1>
              <p className="cart-intro-copy">
                The oddly specific things you picked, all in one place.
              </p>
            </div>

            <div className="cart-content">
              {error && <p className="cart-error" role="alert">{error}</p>}
              {cartcount === 0 ? (
                <div className="cart-empty">
                  <div className="cart-empty-icon">🛒</div>
                  <p className="eyebrow">Nothing here yet</p>
                  <h2>Your cart is<br />feeling empty.</h2>
                  <p>Go find something delightfully unnecessary.</p>
                  <button className="btn solid" type="button" onClick={() => setPageisOpen('mainpage')}>
                    Browse the goods →
                  </button>
                </div>
              ) : (
                <>
                  <div className="cart-items-card">
                    <div className="cart-items-heading">
                      <h2>Your picks</h2>
                      <span>{cartcount} {cartcount === 1 ? 'item' : 'items'}</span>
                    </div>
                    {cartitems.map((product) => (
                      <div className="cart-item" key={product.id}>
                        <div className="cart-item-art">
                          {product.img ? <img src={product.img} alt="" /> : '★'}
                        </div>
                        <div className="cart-item-details">
                          <p className="kind">{product.category_name || product.type || 'Jumble pick'}</p>
                          <h3>{product.pname}</h3>
                          <div className="cart-quantity">
                            <button type="button" aria-label={`Decrease ${product.pname} quantity`} onClick={() => changeCartQuantity(product, -1)}>−</button>
                            <span>{product.quantity}</span>
                            <button type="button" aria-label={`Increase ${product.pname} quantity`} onClick={() => changeCartQuantity(product, 1)}>+</button>
                          </div>
                        </div>
                        <strong className="cart-item-price">${(Number(product.pprice) * product.quantity).toFixed(2)}</strong>
                        <button className="remove-btn" type="button" aria-label={`Remove ${product.pname}`} onClick={() => removeCartProduct(product.cartItemId)}>×</button>
                      </div>
                    ))}
                  </div>
                  <aside className="cart-summary">
                    <p className="eyebrow">Order summary</p>
                    <div><span>Items</span><strong>{cartcount}</strong></div>
                    <div><span>Shipping</span><strong>Free</strong></div>
                    <div className="cart-summary-total"><span>Total</span><strong>${cartitems.reduce((total, product) => total + Number(product.pprice) * product.quantity, 0).toFixed(2)}</strong></div>
                    <label className="checkout-address-label" htmlFor="checkout-address">Delivery address</label>
                    <textarea
                      id="checkout-address"
                      className="checkout-address"
                      value={checkoutAddress}
                      onChange={(event) => setCheckoutAddress(event.target.value)}
                      placeholder="Enter your address"
                      rows="3"
                    />
                    <button className="btn solid cart-checkout-button" type="button" onClick={handleCheckout}>Checkout on WhatsApp →</button>
                    <p className="cart-safe-note">Secure checkout · 30-day returns</p>
                  </aside>
                </>
              )}
            </div>
          </section>
        </main>
      )}

      {pageisOpen === 'profile' && (
        <div className="profile-modal-backdrop" onClick={() => setPageisOpen('mainpage')}>
          <section
            className="profile-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              type="button"
              aria-label="Close profile"
              onClick={() => setPageisOpen('mainpage')}
            >
              &times;
            </button>

            {customer ? (
              <div className="customer-profile">
                <div className="profile-heading">
                  <div className="customer-avatar">{(customer.name || customer.full_name || customer.email || '?')[0].toUpperCase()}</div>
                  <div>
                    <p className="eyebrow">Your jumble account</p>
                    <h2 id="profile-modal-title">Hi, {customer.name || customer.full_name || 'there'}.</h2>
                  </div>
                </div>
                <p className="profile-email">{customer.email}</p>
                <div className="profile-card">
                  <span>Account details</span>
                  <strong>{customer.name || customer.full_name || 'Unnamed customer'}</strong>
                  <strong>{customer.email}</strong>
                </div>
                <div className="profile-stats">
                  <div><strong>0</strong><span>Orders</span></div>
                  <div><strong>0</strong><span>Saved picks</span></div>
                  <div><strong>15%</strong><span>Welcome perk</span></div>
                </div>
                <p className="profile-note">Your next oddly specific find is waiting.</p>
                <div className="profile-actions">
                  <button className="primary-button" type="button" onClick={() => setPageisOpen('mainpage')}>Continue shopping</button>
                  <button className="secondary-button" type="button" onClick={handleSignOut}>Sign out</button>
                </div>
              </div>
            ) : (
              <div className="account-panel">
                <p className="eyebrow">Your account</p>
                <h2 id="profile-modal-title">{mode === 'create' ? <>Join the<br />jumble.</> : <>Welcome<br />back.</>}</h2>
                <p className="header-copy">{mode === 'create' ? 'Create an account and keep your oddly specific finds in one place.' : 'Sign in to pick up where you left off.'}</p>

                <div className="account-tabs" role="tablist" aria-label="Account actions">
                  <button className={mode === 'create' ? 'active' : ''} type="button" role="tab" aria-selected={mode === 'create'} onClick={() => setMode('create')}>Create account</button>
                  <button className={mode === 'signin' ? 'active' : ''} type="button" role="tab" aria-selected={mode === 'signin'} onClick={() => setMode('signin')}>Sign in</button>
                </div>

                <form className="account-form" onSubmit={mode === 'create' ? handlecreateaccount : handlelogin}>
                  {mode === 'create' && (
                    <>
                      <label htmlFor="full_name">Name</label>
                      <input id="full_name" name="full_name" value={registerForm.full_name} onChange={(e) => setRegisterForm({ ...registerForm, full_name: e.target.value })} placeholder="Your name" required />
                    </>
                  )}

                  <label htmlFor="email">Email</label>
                  <input id="email" name="email" type="email" value={mode === 'create' ? registerForm.email : form.email} onChange={(e) => mode === 'create' ? setRegisterForm({ ...registerForm, email: e.target.value }) : setForm({ ...form, email: e.target.value })} placeholder="you@example.com" required />

                  <label htmlFor="password">Password</label>
                  <input id="password" name="password" type="password" value={mode === 'create' ? registerForm.password : form.password} onChange={(e) => mode === 'create' ? setRegisterForm({ ...registerForm, password: e.target.value }) : setForm({ ...form, password: e.target.value })} placeholder="Your password" required />

                  {mode === 'create' && (
                    <>
                      <label htmlFor="confirm">Confirm password</label>
                      <input id="confirm" name="confirm" type="password" value={registerForm.confirm} onChange={(e) => setRegisterForm({ ...registerForm, confirm: e.target.value })} placeholder="Repeat your password" required />
                    </>
                  )}

                  {authError && <p className="profile-error" role="alert">{authError}</p>}

                  <button className="primary-button account-submit" type="submit" disabled={authLoading}>
                    {mode === 'create' ? 'Create account →' : 'Sign in →'}
                  </button>
                </form>
                <p className="account-footnote">By continuing, you agree to our very reasonable terms.</p>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  )
}
