import React, { useEffect, useState } from 'react'
import { getProducts, getCategories, addCategory, addProduct, editProduct, deleteProduct } from '../api'


export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [categoryForm, setCategoryForm] = useState({ category_name: '', type: '' })
  const [categoryTypeMode, setCategoryTypeMode] = useState('')
  const [form, setForm] = useState({ pname: '', pprice: '', discription: '', img: '', category_id: '' })

  // NEW: controls whether the add-category / add-product forms show as pop-up cards
  const [showCategoryCard, setShowCategoryCard] = useState(false)
  const [showProductCard, setShowProductCard] = useState(false)
  const [navIsOpen, setNavIsOpen] = useState(false)
  const [login, setLogin] = useState(false)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [loginError, setLoginError] = useState('')
  useEffect(() => {
    loadProducts()
    loadCategories()
  }, [])

  async function loadProducts() {
    const data = await getProducts()
    setProducts(data)
  }

  async function loadCategories() {
    const data = await getCategories()
    setCategories(data)
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleCategoryChange(e) {
    setCategoryForm({ ...categoryForm, [e.target.name]: e.target.value })
  }

  function handleCategoryTypeChange(e) {
    const value = e.target.value
    setCategoryTypeMode(value)
    setCategoryForm({ ...categoryForm, type: value === '__new__' ? '' : value })
  }

  async function handleCategorySubmit(e) {
    e.preventDefault()
    await addCategory(categoryForm)
    setCategoryForm({ category_name: '', type: '' })
    setCategoryTypeMode('')
    await loadCategories()
    setShowCategoryCard(false)
  }

  function startEdit(product) {
    setEditingId(product.id)
    setForm({
      pname: product.pname,
      pprice: product.pprice,
      discription: product.discription,
      img: product.img,
      category_id: product.category_id || '',
    })
    setShowProductCard(true)
  }

  function resetForm() {
    setEditingId(null)
    setForm({ pname: '', pprice: '', discription: '', img: '', category_id: '' })
  }

  function closeProductCard() {
    resetForm()
    setShowProductCard(false)
  }

  function closeCategoryCard() {
    setCategoryForm({ category_name: '', type: '' })
    setCategoryTypeMode('')
    setShowCategoryCard(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (editingId) {
      await editProduct(editingId, form)
    } else {
      await addProduct(form)
    }
    resetForm()
    setShowProductCard(false)
    loadProducts()
  }

  async function handleDelete(id) {
    await deleteProduct(id)
    if (selectedProduct?.id === id) {
      setSelectedProduct(null)
    }
    loadProducts()
  }

  function handleProductKeyDown(event, product) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setSelectedProduct(product)
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setForm((prev) => ({ ...prev, img: reader.result }))
    }
    reader.readAsDataURL(file)
  }

  const categoryGroups = categories.reduce((groups, category) => {
    if (!groups[category.type]) {
      groups[category.type] = []
    }
    groups[category.type].push(category)
    return groups
  }, {})
  const categoryTypes = [...new Set(categories.map((category) => category.type))]
  const filteredProducts = selectedCategoryId
    ? products.filter((product) => String(product.category_id) === selectedCategoryId)
    : products

  const renderAdminCard = (product, category) => (
    <div
      key={product.id}
      className="admin-card"
      role="button"
      tabIndex="0"
      onClick={() => setSelectedProduct(product)}
      onKeyDown={(event) => handleProductKeyDown(event, product)}
    >
      <div className="product-image">
        {product.img ? <img src={product.img} alt={product.pname} /> : <span>No image</span>}
      </div>
      <div className="admin-card-body">
        <p className="admin-card-name">{product.pname}</p>
        <span className="admin-card-price">${Number(product.pprice).toFixed(2)}</span>
      </div>
      <div className="admin-card-actions">
        <button className="admin-btn-edit" onClick={(event) => { event.stopPropagation(); startEdit(product) }}>
          Edit
        </button>
        <button className="admin-btn-delete" onClick={(event) => { event.stopPropagation(); handleDelete(product.id) }}>
          Delete
        </button>
      </div>
    </div>
  )
function handleLoginSubmit(event) {
  event.preventDefault()
  const validEmail = ['admin', 'shop.a@t.com'].includes(loginForm.email.trim())
  const validPassword = loginForm.password === 'shop321'

  if (validEmail && validPassword) {
    setLogin(true)
    setLoginError('')
    return
  }

  setLoginError('That email or password is not correct.')
}

function handleLoginChange(event) {
  setLoginForm({ ...loginForm, [event.target.name]: event.target.value })
  setLoginError('')
}

if (!login) {
  return (
    <main className="login-page">
      <section className="login-brand-panel">
        <div className="brand-shape brand-shape-yellow" />
        <div className="brand-shape brand-shape-purple" />
        <div className="brand-shape brand-shape-coral" />
        <p className="login-brand">jumble<span>.</span> admin</p>
        <div className="login-brand-copy">
          <h1>Run the shop from <em>one screen.</em></h1>
          <p>Products, orders, and inventory — everything you need to keep the jumble organized.</p>
        </div>
        <p className="system-status"><span /> All systems online</p>
      </section>

      <section className="login-form-panel">
        <div className="login-form-wrap">
          <p className="eyebrow">Shop control center</p>
          <h2>Welcome back</h2>
          <p className="login-subtitle">Log in to manage your store.</p>
          <form className="login-form" onSubmit={handleLoginSubmit}>
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              name="email"
              type="text"
              value={loginForm.email}
              onChange={handleLoginChange}
              placeholder="you@jumble.shop"
              autoComplete="username"
              required
            />
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              name="password"
              type="password"
              value={loginForm.password}
              onChange={handleLoginChange}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
            {loginError && <p className="login-error" role="alert">{loginError}</p>}
            <button className="login-submit" type="submit">Log in</button>
          </form>
          <p className="login-help">Need access? <strong>Ask the store owner</strong></p>
        </div>
      </section>
    </main>
  )
}

return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Shop control center</p>
          <h1>Product inventory</h1>
          <p className="header-copy">Manage the products customers see in your store.</p>
        </div>

        <div className="store-status"><span /> Store online</div>
      </header>

      <section className="admin-layout">
        <section className="inventory-panel">
          <div className="inventory-heading">
            <div>
              <p className="eyebrow">Your catalog</p>
              <h2>All products</h2>
            </div>
            <div className="inventory-heading-actions">
              <span className="product-count">{filteredProducts.length} items</span>
              <nav className="admin-nav"> <button className="nav-toggle" onClick={() => setNavIsOpen(!navIsOpen)}>+</button>
                {navIsOpen && (
                  <div className="nav-dropdown">
                    <button
                      type="button"
                      className="add-launcher-btn small"
                      onClick={() => setShowCategoryCard(true)}
                    >
                      + Category
                    </button>
                    <button
                      type="button"
                      className="add-launcher-btn small primary"
                      onClick={() => { resetForm(); setShowProductCard(true) }}
                    >
                      + Product
                    </button>
                  </div>
                )}
              </nav>
            </div>
          </div>
          <div className="category-filters" aria-label="Filter products by category">
            <button
              className={`category-filter ${selectedCategoryId === '' ? 'active' : ''}`}
              type="button"
              onClick={() => setSelectedCategoryId('')}
            >
              All products
            </button>
            {Object.entries(categoryGroups).map(([type, typeCategories]) => (
              <div className="category-group" key={type}>
                <span className="category-type">{type}</span>
                {typeCategories.map((category) => (
                  <button
                    className={`category-filter ${selectedCategoryId === String(category.id) ? 'active' : ''}`}
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(String(category.id))}
                  >
                    {category.category_name}
                  </button>
                ))}
              </div>
            ))}
          </div>
          <div className="product-list">
            {filteredProducts.length === 0 && (
              <p className="empty-state">
                {products.length === 0 ? 'Your inventory is empty. Add your first product to get started.' : 'No products in this category.'}
              </p>
            )}
            {selectedCategoryId
              ? filteredProducts.map((product) => renderAdminCard(product, categories.find(
                (category) => String(category.id) === String(product.category_id)
              )))
              : (
                <>
                  {Object.entries(categoryGroups).map(([type, typeCategories]) => (
                    <div className="admin-category-type" key={type}>
                      {products.length > 0 ? <h3 className="category-type">{type}</h3> : null}
                      {typeCategories.map((category) => {
                        const itemsInCategory = products.filter(
                          (product) => String(product.category_id) === String(category.id)
                        )

                        if (itemsInCategory.length === 0) return null

                        return (
                          <div key={category.id} className="admin-category-group">
                            <h4 className="admin-category-title">{category.category_name}</h4>
                            <div className="admin-grid">
                              {itemsInCategory.map((product) => renderAdminCard(product, category))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                  {products.filter((product) => !product.category_id).length > 0 && (
                    <div className="admin-category-group">
                      <h3 className="admin-category-title">Uncategorized</h3>
                      <div className="admin-grid">
                        {products
                          .filter((product) => !product.category_id)
                          .map((product) => renderAdminCard(product, null))}
                      </div>
                    </div>
                  )}
                </>
              )}
          </div>
        </section>
      </section>

      {/* NEW: Add category — shown as a pop-up card */}
      {showCategoryCard && (
        <div className="product-modal-backdrop" onClick={closeCategoryCard}>
          <section
            className="product-modal form-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button className="modal-close" type="button" aria-label="Close" onClick={closeCategoryCard}>
              &times;
            </button>
            <form className="category-form" onSubmit={handleCategorySubmit}>
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Catalog structure</p>
                  <h2 id="category-modal-title">Add category</h2>
                </div>
                <span className="form-step">01</span>
              </div>
              <label htmlFor="category-type">Type</label>
              <select
                id="category-type"
                value={categoryTypeMode}
                onChange={handleCategoryTypeChange}
                required
              >
                <option value="">Choose a type</option>
                {categoryTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
                <option value="__new__">Add new type...</option>
              </select>
              {categoryTypeMode === '__new__' && (
                <input
                  id="new-category-type"
                  name="type"
                  value={categoryForm.type}
                  onChange={handleCategoryChange}
                  placeholder="e.g. Apparel"
                  required
                />
              )}
              <label htmlFor="category-name">Category name</label>
              <input
                id="category-name"
                name="category_name"
                value={categoryForm.category_name}
                onChange={handleCategoryChange}
                placeholder="e.g. T-shirts"
                required
              />
              <div className="form-actions">
                <button className="primary-button" type="submit">Add category</button>
                <button className="secondary-button" type="button" onClick={closeCategoryCard}>Cancel</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* NEW: Add / edit product — shown as a pop-up card */}
      {showProductCard && (
        <div className="product-modal-backdrop" onClick={closeProductCard}>
          <section
            className="product-modal form-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-form-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button className="modal-close" type="button" aria-label="Close" onClick={closeProductCard}>
              &times;
            </button>
            <form id="form-products" className="product-form" onSubmit={handleSubmit}>
              <div className="section-heading">
                <div>
                  <p className="eyebrow">{editingId ? 'Update listing' : 'New listing'}</p>
                  <h2 id="product-modal-form-title">{editingId ? 'Edit product' : 'Add a product'}</h2>
                </div>
                <span className="form-step">02</span>
              </div>
              <label htmlFor="pname">Product name</label>
              <input
                id="pname"
                name="pname"
                value={form.pname}
                onChange={handleChange}
                placeholder="Name"
                required
              />
              <label htmlFor="pprice">Price</label>
              <input
                id="pprice"
                name="pprice"
                value={form.pprice}
                onChange={handleChange}
                placeholder="Price"
                type="number"
                step="0.01"
                required
              />
              <label htmlFor="discription">Description</label>
              <input
                id="discription"
                name="discription"
                value={form.discription}
                onChange={handleChange}
                placeholder="Description"
              />
              <label htmlFor="category_id">Category</label>
              <select
                id="category_id"
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.category_name} ({category.type})
                  </option>
                ))}
              </select>
              <label htmlFor="img">Product image</label>
              <input
                id="img"
                type="file"
                name="img"
                accept="image/*"
                onChange={handleImageChange}
              />
              <div className="form-actions">
                <button className="primary-button" type="submit">{editingId ? 'Save changes' : 'Add product'}</button>
                <button className="secondary-button" type="button" onClick={closeProductCard}>
                  Cancel
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

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
            <strong className="modal-product-price">${selectedProduct.pprice}</strong>
            <p className="modal-description">
              {selectedProduct.discription || 'No description added.'}
            </p>
          </section>
        </div>
      )}
    </main>
  )
}