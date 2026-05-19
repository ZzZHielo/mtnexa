/**
 * Multitech — Rutas: Cotizaciones (MySQL)
 *
 * POST   /api/cotizaciones
 * GET    /api/cotizaciones          ?estado=&limit=&offset=
 * GET    /api/cotizaciones/:id
 * PATCH  /api/cotizaciones/:id      (campos: nombre, apellido, whatsapp, tipo_proyecto, presupuesto, descripcion, funcionalidades)
 * PATCH  /api/cotizaciones/:id/estado
 */

const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { run, query, get } = require('../../database');
const { logActivity } = require('./mt-logger');
const { sendCotizacionAceptada, sendCotizacionEnviada } = require('../../mailer');

const router = express.Router();

const ESTADOS_VALIDOS = ['pendiente', 'enviada', 'pagada'];

const validateCotizacion = [
  body('nombre').trim().notEmpty().withMessage('El nombre es requerido'),
  body('correo').isEmail().normalizeEmail().withMessage('Correo inválido'),
  body('apellido').optional().trim(),
  body('whatsapp').optional().trim(),
  body('tipo_proyecto').optional().isString().trim(),
  body('presupuesto').optional().isString().trim(),
  body('monto').optional().isDecimal().toFloat(),
  body('moneda').optional().isIn(['DOP','USD','EUR']),
  body('descripcion').optional().isString().isLength({ max: 3000 }),
  body('funcionalidades').optional().isArray(),
];

/* ── POST /api/cotizaciones ── */
router.post('/', validateCotizacion, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ success: false, errors: errors.array() });

  const {
    nombre,
    apellido      = '',
    correo,
    whatsapp      = '',
    tipo_proyecto = '',
    presupuesto   = '',
    monto         = null,
    moneda        = 'USD',
    descripcion   = '',
    funcionalidades = [],
  } = req.body;

  try {
    const { id } = await run(
      `INSERT INTO cotizaciones
         (nombre, apellido, correo, whatsapp, tipo_proyecto, presupuesto, monto, moneda, descripcion, funcionalidades)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, apellido, correo, whatsapp, tipo_proyecto, presupuesto, monto, moneda, descripcion,
       JSON.stringify(funcionalidades)]
    );

    logActivity('cotizacion', id, req, { correo, tipo_proyecto });

    let conversacionId = null;
    try {
      const user = await get('SELECT id FROM usuarios WHERE correo = ? LIMIT 1', [correo]);
      if (user) {
        const conv = await run(
          `INSERT INTO conversaciones (cliente_nombre, cliente_apellido, asunto, usuario_id, cuenta_id, cotizacion_id, ultimo_mensaje, ultimo_mensaje_at)
           VALUES (?, ?, 'Chat en vivo', ?, ?, ?, ?, NOW())`,
          [nombre, apellido, user.id, user.id, id, descripcion || 'Cotización recibida']
        );
        conversacionId = conv.id;
        if (descripcion) {
          await run(
            'INSERT INTO mensajes (conversacion_id, remitente, texto) VALUES (?, ?, ?)',
            [conversacionId, 'cliente', descripcion]
          );
        }
      }
    } catch (convErr) {
      console.error('[cotizaciones] Error al crear conversación:', convErr.message);
    }

    res.status(201).json({
      success: true,
      message: '¡Cotización recibida! Te contactaremos en menos de 24 horas.',
      id,
      conversacion_id: conversacionId,
    });
  } catch (err) {
    console.error('[cotizaciones] Error:', err.message);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

/* ── GET /api/cotizaciones ── */
router.get('/', async (req, res) => {
  const estado = req.query.estado;
  const limit  = Math.min(parseInt(req.query.limit)  || 50, 200);
  const offset = parseInt(req.query.offset) || 0;

  try {
    let sql    = 'SELECT * FROM cotizaciones';
    let params = [];

    if (estado && ESTADOS_VALIDOS.includes(estado)) {
      sql    += ' WHERE estado = ?';
      params.push(estado);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const rows = await query(sql, params);

    const countSql = estado
      ? 'SELECT COUNT(*) AS total FROM cotizaciones WHERE estado = ?'
      : 'SELECT COUNT(*) AS total FROM cotizaciones';
    const { total } = await get(countSql, estado ? [estado] : []);

    // Parsear JSON de funcionalidades
    rows.forEach(r => {
      try { r.funcionalidades = typeof r.funcionalidades === 'string'
        ? JSON.parse(r.funcionalidades) : r.funcionalidades; } catch {}
    });

    res.json({ success: true, total, data: rows });
  } catch (err) {
    console.error('[cotizaciones GET] Error:', err.message);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

/* ── GET /api/cotizaciones/check?correo=xxx ── */
router.get('/check', async (req, res) => {
  const correo = req.query.correo?.trim().toLowerCase();
  if (!correo) return res.json({ success: true, exists: false });
  try {
    const row = await get('SELECT id FROM cotizaciones WHERE LOWER(correo) = ? LIMIT 1', [correo]);
    res.json({ success: true, exists: !!row });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

/* ── GET /api/cotizaciones/:id ── */
router.get('/:id', [param('id').isInt({ min: 1 })], async (req, res) => {
  if (!validationResult(req).isEmpty())
    return res.status(400).json({ success: false, message: 'ID inválido' });

  try {
    const row = await get('SELECT * FROM cotizaciones WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ success: false, message: 'No encontrado' });

    try { row.funcionalidades = typeof row.funcionalidades === 'string'
      ? JSON.parse(row.funcionalidades) : row.funcionalidades; } catch {}

    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

/* ── PATCH /api/cotizaciones/:id — actualización general ── */
router.patch('/:id', [param('id').isInt({ min: 1 })], async (req, res) => {
  if (!validationResult(req).isEmpty())
    return res.status(400).json({ success: false, message: 'ID inválido' });
  const allowed = ['nombre', 'apellido', 'whatsapp', 'tipo_proyecto', 'presupuesto', 'monto', 'moneda', 'descripcion', 'funcionalidades'];
  const sets = [];
  const vals = [];
  for (const k of allowed) {
    if (req.body[k] !== undefined) {
      if (k === 'funcionalidades') {
        sets.push(`${k} = ?`);
        vals.push(JSON.stringify(req.body[k]));
      } else {
        sets.push(`${k} = ?`);
        vals.push(req.body[k]);
      }
    }
  }
  if (!sets.length) return res.status(400).json({ success: false, message: 'Sin campos' });
  vals.push(req.params.id);
  try {
    const { affectedRows } = await run(`UPDATE cotizaciones SET ${sets.join(', ')} WHERE id = ?`, vals);
    if (!affectedRows) return res.status(404).json({ success: false, message: 'No encontrada' });
    const updated = await get('SELECT * FROM cotizaciones WHERE id = ?', [req.params.id]);
    try { updated.funcionalidades = typeof updated.funcionalidades === 'string' ? JSON.parse(updated.funcionalidades) : updated.funcionalidades; } catch {}
    res.json({ success: true, message: 'Cotización actualizada', data: updated });
  } catch (err) {
    console.error('[cotizaciones PATCH] Error:', err.message, err.stack);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

/* ── PATCH /api/cotizaciones/:id/estado ── */
router.patch(
  '/:id/estado',
  [param('id').isInt({ min: 1 }), body('estado').isIn(ESTADOS_VALIDOS)],
  async (req, res) => {
    if (!validationResult(req).isEmpty())
      return res.status(422).json({ success: false, errors: validationResult(req).array() });

    try {
      const { affectedRows } = await run(
        'UPDATE cotizaciones SET estado = ? WHERE id = ?',
        [req.body.estado, req.params.id]
      );
      if (affectedRows === 0)
        return res.status(404).json({ success: false, message: 'Cotización no encontrada' });

      if (req.body.estado === 'pagada') {
        const c = await get('SELECT * FROM cotizaciones WHERE id = ?', [req.params.id]);
        if (c) {
          // Crear transacción de cobro
          if (c.monto != null && c.monto > 0) {
            const existe = await get('SELECT id FROM transacciones WHERE cotizacion_id = ? AND tipo = "ingreso" LIMIT 1', [c.id]);
            if (!existe) {
              await run(
                `INSERT INTO transacciones (concepto, monto, tipo, estado, cliente_nombre, metodo_pago, fecha, categoria, cotizacion_id)
                 VALUES (?, ?, 'ingreso', 'pendiente', ?, '', CURDATE(), ?, ?)`,
                [`Cotización #${c.id} — ${c.nombre||''} ${c.apellido||''}`.trim(), c.monto, (c.nombre||'')+' '+(c.apellido||''), c.tipo_proyecto||'', c.id]
              );
            }
          }
          if (c.correo) {
            try { c.funcionalidades = typeof c.funcionalidades === 'string' ? JSON.parse(c.funcionalidades) : c.funcionalidades; } catch {}
            sendCotizacionAceptada({
              to: c.correo, nombre: c.nombre, apellido: c.apellido,
              tipo_proyecto: c.tipo_proyecto, monto: c.monto, moneda: c.moneda,
              descripcion: c.descripcion, funcionalidades: c.funcionalidades, id: c.id,
            }).catch(e => console.error('[cotizaciones] Error email:', e.message));
          }
        }
      }

      res.json({ success: true, message: 'Estado actualizado' });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Error interno' });
    }
  }
);

/* ── PATCH /api/cotizaciones/:id/documento ── */
router.patch(
  '/:id/documento',
  [param('id').isInt({ min: 1 }), body('documento_url').optional({values:'null'}).isString().trim()],
  async (req, res) => {
    if (!validationResult(req).isEmpty())
      return res.status(422).json({ success: false, errors: validationResult(req).array() });

    try {
      const { affectedRows } = await run(
        'UPDATE cotizaciones SET documento_url = ? WHERE id = ?',
        [req.body.documento_url || null, req.params.id]
      );
      if (affectedRows === 0)
        return res.status(404).json({ success: false, message: 'Cotización no encontrada' });

      res.json({ success: true, message: 'Documento actualizado' });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Error interno' });
    }
  }
);

/* ── POST /api/cotizaciones/:id/enviar — envía cotización al correo y marca como enviada ── */
router.post('/:id/enviar', async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id || id < 1) return res.status(400).json({ success: false, message: 'ID inválido' });
  try {
    const c = await get('SELECT * FROM cotizaciones WHERE id = ?', [id]);
    if (!c) return res.status(404).json({ success: false, message: 'Cotización no encontrada' });
    if (c.estado !== 'pendiente') return res.status(400).json({ success: false, message: 'Solo se pueden enviar cotizaciones en estado pendiente' });
    try { c.funcionalidades = typeof c.funcionalidades === 'string' ? JSON.parse(c.funcionalidades) : c.funcionalidades; } catch {}
    await run('UPDATE cotizaciones SET estado = ? WHERE id = ?', ['enviada', id]);
    sendCotizacionEnviada({
      to: c.correo, nombre: c.nombre, apellido: c.apellido,
      tipo_proyecto: c.tipo_proyecto, monto: c.monto, moneda: c.moneda,
      funcionalidades: c.funcionalidades, id: c.id,
    }).catch(e => console.error('[cotizaciones] sendCotizacionEnviada falló (async):', e.message));
    res.json({ success: true, message: 'Cotización enviada al correo del cliente' });
  } catch (err) {
    console.error('[cotizaciones/enviar] Error:', err.message, err.stack);
    res.status(500).json({ success: false, message: 'Error al enviar la cotización' });
  }
});

module.exports = router;
