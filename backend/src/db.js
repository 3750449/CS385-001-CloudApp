const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notes (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      course TEXT NOT NULL,
      content TEXT NOT NULL,
      author_email TEXT,
      file_url TEXT,
      file_name TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    ALTER TABLE notes
    ADD COLUMN IF NOT EXISTS author_email TEXT;
  `);

  await pool.query(`
    ALTER TABLE notes
    ADD COLUMN IF NOT EXISTS file_url TEXT;
  `);

  await pool.query(`
    ALTER TABLE notes
    ADD COLUMN IF NOT EXISTS file_name TEXT;
  `);

await pool.query(`
  CREATE TABLE IF NOT EXISTS profiles (
    email TEXT PRIMARY KEY,
    name TEXT,
    contact_info TEXT,
    about TEXT,
    photo_url TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`);

}

module.exports = { pool, initDb };
