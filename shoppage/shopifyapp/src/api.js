
const BASE_URL = 'https://shopify-server-oyma.onrender.com/api'

async function handleResponse(res) {
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Request failed')
  }
  return res.json()
}
// ---------- PRODUCT ----------
export async function getProducts() {
  const res = await fetch(`${BASE_URL}/admin`)
  return handleResponse(res)
}

export async function getProduct(id) {
  const res = await fetch(`${BASE_URL}/admin/${id}`)
  return handleResponse(res)
}

export async function addProduct(item) {
  // item = { pname, pprice, discription, img, category_id }
  const res = await fetch(`${BASE_URL}/admin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  })
  return handleResponse(res)
}

export async function editProduct(id, item) {
  // item = { pname, pprice, discription, img, category_id }
  const res = await fetch(`${BASE_URL}/admin/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  })
  return handleResponse(res)
}

export async function deleteProduct(id) {
  const res = await fetch(`${BASE_URL}/admin/${id}`, { method: 'DELETE' })
  return handleResponse(res)
}

// ---------- CATEGORY ----------
export async function getCategories() {
  const res = await fetch(`${BASE_URL}/categories`)
  return handleResponse(res)
}

export async function addCategory(category) {
  // category = { category_name, type }
  const res = await fetch(`${BASE_URL}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(category),
  })
  return handleResponse(res)
}

export async function editCategory(id, category) {
  // category = { category_name, type }
  const res = await fetch(`${BASE_URL}/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(category),
  })
  return handleResponse(res)
}



export async function deleteCategory(id) {
  const res = await fetch(`${BASE_URL}/categories/${id}`, { method: 'DELETE' })
  return handleResponse(res)
}

// ---------- USERS ----------
export async function getUsers() {
  const res = await fetch(`${BASE_URL}/users`)
  return handleResponse(res)
}

export async function createaccount(user) {
  // user = { full_name, email, password, uimg }
  const res = await fetch(`${BASE_URL}/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  })
  return handleResponse(res)
}

export async function login(user){
   const res = await fetch(`${BASE_URL}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  })
  return handleResponse(res)
}

export async function editUser(id, user) {
  // user = { full_name, email, password, uimg }
  const res = await fetch(`${BASE_URL}/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  })
  return handleResponse(res)
}

export async function deleteUser(id) {
  const res = await fetch(`${BASE_URL}/users/${id}`, 
    { method: 'DELETE' })
  return handleResponse(res)
}
// ---------- AUTH ----------
export async function authenticate({ username, email, password }) {
  const res = await fetch(`${BASE_URL}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  })
  return handleResponse(res)
}

// ---------- CART ITEMS ----------
export async function getCartItems() {
  const res = await fetch(`${BASE_URL}/cart_items`)
  return handleResponse(res)
}

export async function addCartItem(item) {
  // item = { user_id, product_id, quantity }
  const res = await fetch(`${BASE_URL}/cart_items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  })
  return handleResponse(res)
}

export async function editCartItem(id, item) {
  // item = { user_id, product_id, quantity }
  const res = await fetch(`${BASE_URL}/cart_items/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  })
  return handleResponse(res)
}

export async function deleteCartItem(id) {
  const res = await fetch(`${BASE_URL}/cart_items/${id}`, { method: 'DELETE' })
  return handleResponse(res)
}
