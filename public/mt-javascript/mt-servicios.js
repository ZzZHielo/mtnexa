const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { run, query, get } = require('../../database');

const router = express.Router();

/* GET /api/servicios */
router.get('/', async (req, res) => {
  const { categoria } = req.query;
  try {
    let sql = 'SELECT * FROM servicios WHERE activo = 1';
    let params = [];
    if (categoria) { sql += ' AND categoria = ?'; params.push(categoria); }
    sql += ' ORDER BY orden ASC';
    const rows = await query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[servicios] Error:', err.message);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

/* GET /api/servicios/:slug */
router.get('/:slug', async (req, res) => {
  try {
    const row = await get('SELECT * FROM servicios WHERE slug = ? AND activo = 1', [req.params.slug]);
    if (!row) return res.status(404).json({ success: false, message: 'No encontrado' });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

module.exports = router;
