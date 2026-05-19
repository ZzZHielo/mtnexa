const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { run, query, get } = require('../../database');

const router = express.Router();

const FUENTES_VALIDAS = ['Web', 'WhatsApp', 'Referido', 'Instagram', 'Llamada', 'Otro'];

function requireAdmin(req, res, next) {
  const key = req.headers['x-admin-key'] || req.query.adminKey;
  if (key !== (process.env.ADMIN_KEY || 'multitech-admin-2025'))
    return res.status(401).json({ success: false, message: 'Acceso no autorizado' });
  next();
}

router.post('/', [
  body('tipo').optional().trim().isLength({ max: 50 }),
  body('referencia_tipo').trim().notEmpty().withMessage('referencia_tipo es requerido'),
  body('referencia_id').isInt({ min: 1 }).withMessage('referencia_id debe ser un número válido'),
  body('nombre').optional().trim().isLength({ max: 200 }),
  body('correo').optional().trim().isEmail().normalizeEmail(),
  body('puntuacion').isInt({ min: 1, max: 5 }).withMessage('puntuacion debe ser 1-5'),
  body('comentario').optional().trim().isLength({ max: 5000 }),
  body('como_nos_conociste').optional().trim().isIn(FUENTES_VALIDAS),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ success: false, errors: errors.array() });

  try {
    const {
      tipo = 'satisfaccion',
      referencia_tipo,
      referencia_id,
      nombre = null,
      correo = null,
      puntuacion,
      comentario = null,
      como_nos_conociste = null,
    } = req.body;

    const { id } = await run(
      `INSERT INTO encuestas (tipo, referencia_tipo, referencia_id, nombre, correo, puntuacion, comentario, como_nos_conociste)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [tipo, referencia_tipo, referencia_id, nombre, correo, puntuacion, comentario, como_nos_conociste]
    );

    res.status(201).json({
      success: true,
      message: 'Encuesta recibida. Gracias por tu opinión.',
      id,
    });
  } catch (err) {
    console.error('[encuestas POST] Error:', err.message);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

router.get('/', requireAdmin, async (req, res) => {
  const limit  = Math.min(parseInt(req.query.limit)  || 50, 200);
  const offset = parseInt(req.query.offset) || 0;
  const tipo   = req.query.tipo;

  try {
    let sql    = 'SELECT * FROM encuestas';
    let params = [];
    const conditions = [];

    if (tipo) {
      conditions.push('tipo = ?');
      params.push(tipo);
    }

    if (conditions.length) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    const countSql = 'SELECT COUNT(*) AS total FROM encuestas' + (conditions.length ? ' WHERE ' + conditions.join(' AND ') : '');
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const rows  = await query(sql, params);
    const {total} = await get(countSql, params.slice(0, -2));

    res.json({ success: true, total, data: rows });
  } catch (err) {
    console.error('[encuestas GET] Error:', err.message);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const [total, distribucion, fuentes, tipos] = await Promise.all([
      get('SELECT COUNT(*) AS total, AVG(puntuacion) AS promedio FROM encuestas'),
      query('SELECT puntuacion, COUNT(*) AS total FROM encuestas GROUP BY puntuacion ORDER BY puntuacion'),
      query('SELECT como_nos_conociste AS fuente, COUNT(*) AS total FROM encuestas WHERE como_nos_conociste IS NOT NULL GROUP BY como_nos_conociste ORDER BY total DESC'),
      query('SELECT referencia_tipo AS tipo, COUNT(*) AS total FROM encuestas GROUP BY referencia_tipo ORDER BY total DESC'),
    ]);

    res.json({
      success: true,
      data: {
        total: total.total,
        promedio: Number(total.promedio || 0),
        distribucion,
        fuentes,
        tipos,
      },
    });
  } catch (err) {
    console.error('[encuestas stats] Error:', err.message);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

router.get('/:id', [param('id').isInt({ min: 1 })], async (req, res) => {
  if (!validationResult(req).isEmpty())
    return res.status(400).json({ success: false, message: 'ID inválido' });

  try {
    const row = await get('SELECT * FROM encuestas WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ success: false, message: 'No encontrado' });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

module.exports = router;
