const express = require('express');
const { param, validationResult } = require('express-validator');
const { run, query, get } = require('../../database');

const router = express.Router();

/* GET /api/notificaciones — últimas 50 */
router.get('/', async (req, res) => {
  try {
    const rows = await query(
      'SELECT * FROM notificaciones ORDER BY created_at DESC LIMIT 50'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[notificaciones GET] Error:', err.message);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

/* GET /api/notificaciones/no-leidas — count + last 10 */
router.get('/no-leidas', async (req, res) => {
  try {
    const { total } = await get(
      'SELECT COUNT(*) AS total FROM notificaciones WHERE leida = 0'
    );
    const recientes = await query(
      'SELECT * FROM notificaciones WHERE leida = 0 ORDER BY created_at DESC LIMIT 10'
    );
    res.json({ success: true, total, data: recientes });
  } catch (err) {
    console.error('[notificaciones/no-leidas] Error:', err.message);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

/* PATCH /api/notificaciones/:id/leer */
router.patch('/:id/leer', [param('id').isInt({ min: 1 })], async (req, res) => {
  if (!validationResult(req).isEmpty())
    return res.status(400).json({ success: false, message: 'ID inválido' });
  try {
    await run('UPDATE notificaciones SET leida = 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('[notificaciones/leer] Error:', err.message);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

/* PATCH /api/notificaciones/leer-todas */
router.patch('/leer-todas', async (req, res) => {
  try {
    await run('UPDATE notificaciones SET leida = 1 WHERE leida = 0');
    res.json({ success: true });
  } catch (err) {
    console.error('[notificaciones/leer-todas] Error:', err.message);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

module.exports = router;
