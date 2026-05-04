const express = require('express');
const cors = require('cors');
const { pool, initDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 8199;

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
    const { title, course, content } = req.body;

    if (!title || !course || !content) {
      return res.status(400).json({ error: 'title, course, and content required' });
    }

    const result = await pool.query(
      `INSERT INTO notes (title, course, content)
       VALUES ($1, $2, $3)
       RETURNING
         id,
         title,
         course,
         content,
         created_at AS "createdAt"`,
      [title, course, content]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

initDb().catch((err) => {
  console.error('Database init failed:', err);
});

app.delete('/api/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM notes WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'note not found' });
    }

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API listening on http://0.0.0.0:${PORT}`);
});
