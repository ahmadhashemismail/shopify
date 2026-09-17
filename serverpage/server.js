import express from 'express'
import cors from 'cors'
import pool from './db.js'

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json({ limit: '10mb' }))

// Test route to verify server status
app.get('/', (req, res) => {
  res.send('Server is up and running!')
})

// =========================================================
// PRODUCTS (admin)
// =========================================================

// GET all products
app.get('/api/admin', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM admin ORDER BY id')
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch products' })
  }
})

// GET single product by id
app.get('/api/admin/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query('SELECT * FROM admin WHERE id = $1', [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' })
    }

    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch product' })
  }
})

// POST create a new product
app.post('/api/admin', async (req, res) => {
  try {
    const { pname, pprice, discription, img, category_id } = req.body

    const result = await pool.query(
      `INSERT INTO admin (pname, pprice, discription, img, category_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [pname, pprice, discription, img, category_id || null]
    )

    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to add product' })
  }
})

// PUT update an existing product
app.put('/api/admin/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { pname, pprice, discription, img, category_id } = req.body

    const result = await pool.query(
      `UPDATE admin
       SET pname = $1, pprice = $2, discription = $3, img = $4, category_id = $5
       WHERE id = $6
       RETURNING *`,
      [pname, pprice, discription, img, category_id || null, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' })
    }

    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update product' })
  }
})

// DELETE a product
app.delete('/api/admin/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query('DELETE FROM admin WHERE id = $1 RETURNING *', [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' })
    }

    res.json({ deleted: true, id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete product' })
  }
})

// =========================================================
// CATEGORIES
// =========================================================

// GET all categories
app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY id')
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch categories' })
  }
})

// GET single category by id
app.get('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query('SELECT * FROM categories WHERE id = $1', [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' })
    }

    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch category' })
  }
})

// POST create a new category
app.post('/api/categories', async (req, res) => {
  try {
    const { type, category_name } = req.body

    const result = await pool.query(
      `INSERT INTO categories (type, category_name)
       VALUES ($1, $2)
       RETURNING *`,
      [type, category_name]
    )

    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create category' })
  }
})

// PUT update an existing category
app.put('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { type, category_name } = req.body

    const result = await pool.query(
      `UPDATE categories
       SET type = $1, category_name = $2
       WHERE id = $3
       RETURNING *`,
      [type, category_name, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' })
    }

    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update category' })
  }
})

// DELETE a category
app.delete('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING *', [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' })
    }

    res.json({ deleted: true, id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete category' })
  }
})

// =========================================================
// USERS
// =========================================================

app.post("/api/users/login", async (req, res) => {
  try {
    const { email, password } = req.body
    const result = await pool.query(
      "SELECT id, full_name, email, password FROM users WHERE email=$1",
      [email]
    )
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password." })
    }
    const account = result.rows[0]
    if (account.password !== password) {
      return res.status(401).json({ error: "Invalid email or password." })
    }
    res.json({ id: account.id, name: account.full_name, email: account.email })
  } catch (error) {
    console.error("Error logging in:", error)
    res.status(500).json({ error: error.message })
  }
})

app.post("/api/users/register", async (req, res) => {
  try {
    const { full_name, email, password } = req.body
    if (!full_name || !email || !password) {
      return res.status(400).json({ error: "All fields are required." })
    }
    const existing = await pool.query(
      "SELECT id FROM users WHERE email=$1",
      [email]
    )
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Email already exists." })
    }
    const result = await pool.query(
      "INSERT INTO users (full_name, email, password) VALUES ($1, $2, $3) RETURNING *",
      [full_name, email, password]
    )
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error("Error registering account:", error)
    res.status(500).json({ error: error.message })
  }
})

app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { full_name, email, password, uimg } = req.body

    const result = await pool.query(
      `UPDATE users
       SET full_name = $1, email = $2, password = $3, uimg = $4
       WHERE id = $5
       RETURNING *`,
      [full_name, email, password, uimg, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update user' })
  }
})

app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ deleted: true, id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete user' })
  }
})

// =========================================================
// CART ITEMS
// =========================================================

app.get('/api/cart_items', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cart_items ORDER BY id')
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch cart items' })
  }
})

app.post('/api/cart_items', async (req, res) => {
  try {
    const { user_id, product_id, quantity } = req.body
    const result = await pool.query(
      `INSERT INTO cart_items (user_id, product_id, quantity)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [user_id, product_id, quantity]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create cart item' })
  }
})

app.put('/api/cart_items/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { user_id, product_id, quantity } = req.body

    const result = await pool.query(
      `UPDATE cart_items
       SET user_id = $1, product_id = $2, quantity = $3
       WHERE id = $4
       RETURNING *`,
      [user_id, product_id, quantity, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cart item not found' })
    }

    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update cart item' })
  }
})

app.delete('/api/cart_items/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query('DELETE FROM cart_items WHERE id = $1 RETURNING *', [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cart item not found' })
    }

    res.json({ deleted: true, id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete cart item' })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})