/**
 * Multitech — Rutas: Consultas Generales (MySQL)
 *
 * POST   /api/consultas
 * GET    /api/consultas          ?estado=&limit=&offset=
 * GET    /api/consultas/:id
 * PATCH  /api/consultas/:id/estado
 */

const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { run, query, get } = require('../../database');
const { logActivity }     = require('./mt-logger');

const router = express.Router();

const ESTADOS_VALIDOS = ['nueva', 'leída', 'respondida'];

const validateConsulta = [
  body('nombre').trim().notEmpty().withMessage('El nombre es requerido'),
  body('correo').isEmail().normalizeEmail().withMessage('Correo inválido'),
  body('asunto').optional().trim().isLength({ max: 200 }),
  body('mensaje').trim().notEmpty().isLength({ max: 5000 }).withMessage('El mensaje es requerido'),
];

/* ── POST /api/consultas ── */
router.post('/', validateConsulta, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ success: false, errors: errors.array() });

  const { nombre, correo, asunto = '', mensaje } = req.body;

  try {
    const { id } = await run(
      'INSERT INTO consultas (nombre, correo, asunto, mensaje) VALUES (?, ?, ?, ?)',
      [nombre, correo, asunto, mensaje]
    );

    logActivity('consulta', id, req, { correo, asunto });

    res.status(201).json({
      success: true,
      message: 'Mensaje recibido. Te respondemos en menos de 24 horas.',
      id,
    });
  } catch (err) {
    console.error('[consultas] Error:', err.message);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

/* ── GET /api/consultas ── */
router.get('/', async (req, res) => {
  const estado = req.query.estado;
  const limit  = Math.min(parseInt(req.query.limit)  || 50, 200);
  const offset = parseInt(req.query.offset) || 0;

  try {
    let sql    = 'SELECT * FROM consultas';
    let params = [];

    if (estado && ESTADOS_VALIDOS.includes(estado)) {
      sql    += ' WHERE estado = ?';
      params.push(estado);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const rows  = await query(sql, params);
    const countSql = estado
      ? 'SELECT COUNT(*) AS total FROM consultas WHERE estado = ?'
      : 'SELECT COUNT(*) AS total FROM consultas';
    const { total } = await get(countSql, estado ? [estado] : []);

    res.json({ success: true, total, data: rows });
  } catch (err) {
    console.error('[consultas GET] Error:', err.message);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

/* ── GET /api/consultas/:id ── */
router.get('/:id', [param('id').isInt({ min: 1 })], async (req, res) => {
  if (!validationResult(req).isEmpty())
    return res.status(400).json({ success: false, message: 'ID inválido' });

  try {
    const row = await get('SELECT * FROM consultas WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ success: false, message: 'No encontrado' });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

/* ── PATCH /api/consultas/:id/estado ── */
router.patch(
  '/:id/estado',
  [param('id').isInt({ min: 1 }), body('estado').isIn(ESTADOS_VALIDOS)],
  async (req, res) => {
    if (!validationResult(req).isEmpty())
      return res.status(422).json({ success: false, errors: validationResult(req).array() });

    try {
      const { affectedRows } = await run(
        'UPDATE consultas SET estado = ? WHERE id = ?',
        [req.body.estado, req.params.id]
      );
      if (affectedRows === 0)
        return res.status(404).json({ success: false, message: 'Consulta no encontrada' });

      res.json({ success: true, message: 'Estado actualizado' });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Error interno' });
    }
  }
);

module.exports = router;
