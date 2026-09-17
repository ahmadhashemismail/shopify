import pool from './db.js'

async function setupTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        type TEXT,
        category_name TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS admin (
        id SERIAL PRIMARY KEY,
        pname TEXT NOT NULL,
        pprice NUMERIC,
        discription TEXT,
        img TEXT,
        category_id INTEGER REFERENCES categories(id)
      );

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        uimg TEXT
      );

      CREATE TABLE IF NOT EXISTS cart_items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        product_id INTEGER REFERENCES admin(id),
        quantity INTEGER DEFAULT 1
      );
    `)
    console.log('Tables created successfully')
  } catch (err) {
    console.error('Error creating tables:', err)
  }
}

setupTables()