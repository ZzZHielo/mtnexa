/**
 * Multitech — Rutas: Plantillas + Solicitudes (MySQL)
 *
 * GET    /api/plantillas                          ?categoria=
 * GET    /api/plantillas/solicitudes              ?estado=&limit=&offset=
 * GET    /api/plantillas/:slug
 * POST   /api/plantillas/solicitudes
 * PATCH  /api/plantillas/solicitudes/:id/estado
 */

const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { run, query, get } = require('../../database');
const { logActivity }     = require('./mt-logger');

const router = express.Router();

const ESTADOS_VALIDOS    = ['pendiente', 'revisado', 'desarrollando', 'cerrado'];
const CATEGORIAS_VALIDAS = ['negocio','ecommerce','portfolio','landing','app','restaurante'];

/* ── GET /api/plantillas ── */
router.get('/', async (req, res) => {
  const { categoria } = req.query;

  try {
    let sql    = 'SELECT * FROM plantillas WHERE activa = 1';
    let params = [];

    if (categoria && categoria !== 'all' && CATEGORIAS_VALIDAS.includes(categoria)) {
      sql    += ' AND categoria = ?';
      params.push(categoria);
    }

    sql += ' ORDER BY id ASC';
    const rows = await query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[plantillas GET] Error:', err.message);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

/* ── GET /api/plantillas/solicitudes  (antes de /:slug) ── */
router.get('/solicitudes', async (req, res) => {
  const estado = req.query.estado;
  const limit  = Math.min(parseInt(req.query.limit)  || 50, 200);
  const offset = parseInt(req.query.offset) || 0;

  try {
    let sql    = 'SELECT * FROM solicitudes_plantillas';
    let params = [];

    if (estado && ESTADOS_VALIDOS.includes(estado)) {
      sql    += ' WHERE estado = ?';
      params.push(estado);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const rows     = await query(sql, params);
    const countSql = estado
      ? 'SELECT COUNT(*) AS total FROM solicitudes_plantillas WHERE estado = ?'
      : 'SELECT COUNT(*) AS total FROM solicitudes_plantillas';
    const { total } = await get(countSql, estado ? [estado] : []);

    rows.forEach(r => {
      try { r.funcionalidades = typeof r.funcionalidades === 'string'
        ? JSON.parse(r.funcionalidades) : r.funcionalidades; } catch {}
    });

    res.json({ success: true, total, data: rows });
  } catch (err) {
    console.error('[solicitudes GET] Error:', err.message);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

/* ── GET /api/plantillas/:slug ── */
router.get('/:slug', async (req, res) => {
  try {
    const row = await get(
      'SELECT * FROM plantillas WHERE slug = ? AND activa = 1',
      [req.params.slug]
    );
    if (!row) return res.status(404).json({ success: false, message: 'Plantilla no encontrada' });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

/* ── POST /api/plantillas/solicitudes ── */
const validateSolicitud = [
  body('nombre').trim().notEmpty().withMessage('Nombre requerido'),
  body('correo').isEmail().normalizeEmail().withMessage('Correo inválido'),
  body('tipo_proyecto').optional().isString().trim(),
  body('descripcion').optional().isString().isLength({ max: 3000 }),
  body('funcionalidades').optional().isArray(),
  body('plantilla_ref').optional().isString().trim(),
  body('color_prim').optional().matches(/^#[0-9a-fA-F]{3,8}$/).withMessage('Color hex inválido'),
  body('color_bg').optional().matches(/^#[0-9a-fA-F]{3,8}$/).withMessage('Color hex inválido'),
  body('fuente').optional().isString().trim(),
];

router.post('/solicitudes', validateSolicitud, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ success: false, errors: errors.array() });

  const {
    nombre,
    apellido        = '',
    correo,
    whatsapp        = '',
    tipo_proyecto   = '',
    funcionalidades = [],
    descripcion     = '',
    plantilla_ref   = '',
    color_prim      = '',
    color_bg        = '',
    fuente          = '',
  } = req.body;

  try {
    const { id } = await run(
      `INSERT INTO solicitudes_plantillas
         (nombre, apellido, correo, whatsapp, tipo_proyecto, funcionalidades,
          descripcion, plantilla_ref, color_prim, color_bg, fuente)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, apellido, correo, whatsapp, tipo_proyecto,
       JSON.stringify(funcionalidades), descripcion, plantilla_ref,
       color_prim, color_bg, fuente]
    );

    logActivity('plantilla', id, req, { correo, plantilla_ref, color_prim });

    res.status(201).json({
      success: true,
      message: 'Solicitud enviada. Te contactamos en menos de 24 horas.',
      id,
    });
  } catch (err) {
    console.error('[solicitudes POST] Error:', err.message);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

/* ── PATCH /api/plantillas/solicitudes/:id/estado ── */
router.patch(
  '/solicitudes/:id/estado',
  [param('id').isInt({ min: 1 }), body('estado').isIn(ESTADOS_VALIDOS)],
  async (req, res) => {
    if (!validationResult(req).isEmpty())
      return res.status(422).json({ success: false, errors: validationResult(req).array() });

    try {
      const { affectedRows } = await run(
        'UPDATE solicitudes_plantillas SET estado = ? WHERE id = ?',
        [req.body.estado, req.params.id]
      );
      if (affectedRows === 0)
        return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });

      res.json({ success: true, message: 'Estado actualizado' });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Error interno' });
    }
  }
);

module.exports = router;
