const express = require('express');
const cors = require('cors');
const { pool, initDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 8199;

const ADMIN_EMAILS = ['3750449@gmail.com'];

function isAdminEmail(email) {
  return ADMIN_EMAILS.includes(email);
}

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.send('StudyLink API is running');
});

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');

    res.json({
      ok: true,
      service: 'studylink-api',
      database: 'supabase-postgres',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);

    res.json({
      ok: false,
      service: 'studylink-api',
      database: 'not connected',
      timestamp: new Date().toISOString(),
    });
  }
});

app.get('/api/notes', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        title,
        course,
        content,
        author_email AS "authorEmail",
        file_url AS "fileUrl",
        file_name AS "fileName",
        created_at AS "createdAt"
      FROM notes
      ORDER BY id DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

app.post('/api/notes', async (req, res) => {
  try {
    const { title, course, content, authorEmail, fileUrl, fileName } = req.body;

    if (!title || !course || !content) {
      return res.status(400).json({
        error: 'title, course, and content required',
      });
    }

    const result = await pool.query(
      `
      INSERT INTO notes (
        title,
        course,
        content,
        author_email,
        file_url,
        file_name
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        id,
        title,
        course,
        content,
        author_email AS "authorEmail",
        file_url AS "fileUrl",
        file_name AS "fileName",
        created_at AS "createdAt"
      `,
      [
        title,
        course,
        content,
        authorEmail || null,
        fileUrl || null,
        fileName || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

app.delete('/api/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userEmail = req.query.email;

    if (!userEmail) {
      return res.status(401).json({ error: 'email required' });
    }

    const result = await pool.query(
      `
      DELETE FROM notes
      WHERE id = $1
        AND (
          author_email = $2
          OR $3 = TRUE
        )
      RETURNING id
      `,
      [id, userEmail, isAdminEmail(userEmail)]
    );

    if (result.rowCount === 0) {
      return res.status(403).json({
        error: 'not allowed or note not found',
      });
    }

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

app.patch('/api/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, course, content } = req.body;

    const result = await pool.query(
      `
      UPDATE notes
      SET
        title = COALESCE($1, title),
        course = COALESCE($2, course),
        content = COALESCE($3, content)
      WHERE id = $4
      RETURNING
        id,
        title,
        course,
        content,
        author_email AS "authorEmail",
        file_url AS "fileUrl",
        file_name AS "fileName",
        created_at AS "createdAt"
      `,
      [title, course, content, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'note not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

app.get('/api/profile', async (req, res) => {
  try {
    const email = req.query.email;

    if (!email) {
      return res.status(400).json({ error: 'email required' });
    }

    const result = await pool.query(
      `
      SELECT
        email,
        name,
        contact_info AS "contactInfo",
        about,
        photo_url AS "photoUrl",
        updated_at AS "updatedAt"
      FROM profiles
      WHERE email = $1
      `,
      [email]
    );

    res.json(result.rows[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

app.put('/api/profile', async (req, res) => {
  try {
    const { email, name, contactInfo, about, photoUrl } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'email required' });
    }

    const result = await pool.query(
      `
      INSERT INTO profiles (
        email,
        name,
        contact_info,
        about,
        photo_url,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      ON CONFLICT (email)
      DO UPDATE SET
        name = EXCLUDED.name,
        contact_info = EXCLUDED.contact_info,
        about = EXCLUDED.about,
        photo_url = EXCLUDED.photo_url,
        updated_at = CURRENT_TIMESTAMP
      RETURNING
        email,
        name,
        contact_info AS "contactInfo",
        about,
        photo_url AS "photoUrl",
        updated_at AS "updatedAt"
      `,
      [email, name, contactInfo, about, photoUrl]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

initDb().catch((err) => {
  console.error('Database init failed:', err);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API listening on http://0.0.0.0:${PORT}`);
});
