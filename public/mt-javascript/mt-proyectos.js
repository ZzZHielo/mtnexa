const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { run, query, get } = require('../../database');
const { logActivity } = require('./mt-logger');
const { clienteProyectoMatchSql } = require('./mt-cliente-proyecto-match');

const router = express.Router();

const ESTADOS = ['pendiente', 'revisado', 'desarrollando', 'cerrado'];
const ESTADOS_COT = ['pendiente', 'enviada', 'pagada'];

const validateProyecto = [
  body('nombre').trim().notEmpty().withMessage('El nombre es requerido'),
  body('apellido').optional().trim(),
  body('empresa').optional().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('telefono').optional().trim(),
  body('tipo_proyecto').optional().trim(),
  body('presupuesto').optional().trim(),
  body('monto').optional().isDecimal().toFloat(),
  body('moneda').optional().isIn(['DOP','USD','EUR']),
  body('descripcion').optional().isString(),
  body('fecha_inicio').optional().isISO8601().toDate(),
  body('fecha_entrega').optional().isISO8601().toDate(),
];

/* POST /api/proyectos */
router.post('/', validateProyecto, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ success: false, errors: errors.array() });
  try {
    const { nombre, apellido = '', empresa = '', email = '', telefono = '',
            tipo_proyecto = '', presupuesto = '', monto = null, moneda = 'USD', descripcion = '',
            fecha_inicio = null, fecha_entrega = null } = req.body;
    const { id } = await run(
      `INSERT INTO proyectos (nombre, apellido, empresa, email, telefono, tipo_proyecto, presupuesto, monto, moneda, descripcion, fecha_inicio, fecha_entrega)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, apellido, empresa, email, telefono, tipo_proyecto, presupuesto, monto, moneda, descripcion, fecha_inicio, fecha_entrega]
    );
    logActivity('proyecto', id, req, { tipo_proyecto });
    res.status(201).json({ success: true, message: 'Proyecto creado', id });
  } catch (err) {
    console.error('[proyectos] Error:', err.message);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

/* GET /api/proyectos */
router.get('/', async (req, res) => {
  const estado = req.query.estado;
  const clienteId = parseInt(req.query.cliente_id, 10);
  const limit  = Math.min(parseInt(req.query.limit) || 50, 200);
  const offset = parseInt(req.query.offset) || 0;
  try {
    let sql = 'SELECT p.* FROM proyectos p';
    const where = [];
    const params = [];

    if (clienteId > 0) {
      sql += ' INNER JOIN clientes c ON c.id = ?';
      params.push(clienteId);
      where.push(clienteProyectoMatchSql('c', 'p'));
    }

    if (estado && ESTADOS.includes(estado)) {
      where.push('p.estado = ?');
      params.push(estado);
    }

    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const rows = await query(sql, params);

    let countSql = 'SELECT COUNT(*) AS total FROM proyectos p';
    const countParams = [];
    if (clienteId > 0) {
      countSql += ' INNER JOIN clientes c ON c.id = ?';
      countParams.push(clienteId);
      countSql += ' WHERE ' + clienteProyectoMatchSql('c', 'p');
      if (estado && ESTADOS.includes(estado)) {
        countSql += ' AND p.estado = ?';
        countParams.push(estado);
      }
    } else if (estado && ESTADOS.includes(estado)) {
      countSql += ' WHERE p.estado = ?';
      countParams.push(estado);
    }
    const { total } = await get(countSql, countParams);

    res.json({ success: true, total, data: rows });
  } catch (err) {
    console.error('[proyectos GET] Error:', err.message);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

/* GET /api/proyectos/:id */
router.get('/:id', [param('id').isInt({ min: 1 })], async (req, res) => {
  if (!validationResult(req).isEmpty())
    return res.status(400).json({ success: false, message: 'ID inválido' });
  try {
    const row = await get('SELECT * FROM proyectos WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ success: false, message: 'No encontrado' });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

/* PATCH /api/proyectos/:id */
router.patch('/:id', [param('id').isInt({ min: 1 })], async (req, res) => {
  if (!validationResult(req).isEmpty())
    return res.status(400).json({ success: false, message: 'ID inválido' });
  const allowed = ['nombre','apellido','empresa','email','telefono','tipo_proyecto','presupuesto','monto','moneda','descripcion','fecha_inicio','fecha_entrega','estado'];
  const sets = [];
  const vals = [];
  for (const k of allowed) {
    if (req.body[k] !== undefined) {
      sets.push(`${k} = ?`);
      vals.push(req.body[k]);
    }
  }
  if (!sets.length) return res.status(400).json({ success: false, message: 'Sin campos para actualizar' });
  vals.push(req.params.id);
  try {
    const { affectedRows } = await run(`UPDATE proyectos SET ${sets.join(', ')} WHERE id = ?`, vals);
    if (!affectedRows) return res.status(404).json({ success: false, message: 'No encontrado' });
    // Sync estado to linked cotizacion only if compatible
    if (req.body.estado && ESTADOS_COT.includes(req.body.estado)) {
      const conv = await get('SELECT cotizacion_id FROM conversaciones WHERE proyecto_id = ? AND cotizacion_id IS NOT NULL LIMIT 1', [req.params.id]);
      if (conv?.cotizacion_id) {
        await run('UPDATE cotizaciones SET estado = ? WHERE id = ?', [req.body.estado, conv.cotizacion_id]);
      }
    }
    res.json({ success: true, message: 'Proyecto actualizado' });
  } catch (err) {
    console.error('[proyectos PATCH] Error:', err.message);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

/* PATCH /api/proyectos/:id/estado */
router.patch('/:id/estado', [param('id').isInt({ min: 1 }), body('estado').isIn(ESTADOS)], async (req, res) => {
  if (!validationResult(req).isEmpty())
    return res.status(422).json({ success: false, errors: validationResult(req).array() });
  try {
    const old = await get('SELECT estado, nombre, apellido, monto, moneda FROM proyectos WHERE id = ?', [req.params.id]);
    if (!old) return res.status(404).json({ success: false, message: 'No encontrado' });
    const { affectedRows } = await run('UPDATE proyectos SET estado = ? WHERE id = ?', [req.body.estado, req.params.id]);
    if (!affectedRows) return res.status(404).json({ success: false, message: 'No encontrado' });
    logActivity('proyecto', req.params.id, req, { accion: 'cambio_etapa', desde: old.estado, hacia: req.body.estado });
    // Auto‑crear cobro pendiente cuando el proyecto se cierra
    if (req.body.estado === 'cerrado' && old.estado !== 'cerrado') {
      const existe = await get('SELECT id FROM transacciones WHERE proyecto_id = ? AND tipo = "ingreso" AND estado = "pendiente" LIMIT 1', [req.params.id]);
      if (!existe && old.monto != null && old.monto > 0) {
        await run(
          `INSERT INTO transacciones (concepto, monto, tipo, estado, cliente_nombre, proyecto_id)
           VALUES (?, ?, 'ingreso', 'pendiente', ?, ?)`,
          [`Proyecto #${req.params.id} — ${old.nombre||''} ${old.apellido||''}`.trim(), old.monto, (old.nombre||'')+' '+(old.apellido||''), req.params.id]
        );
      }
    }
    // Sync estado to linked cotizacion only if compatible
    if (ESTADOS_COT.includes(req.body.estado)) {
      const conv = await get('SELECT cotizacion_id FROM conversaciones WHERE proyecto_id = ? AND cotizacion_id IS NOT NULL LIMIT 1', [req.params.id]);
      if (conv?.cotizacion_id) {
        await run('UPDATE cotizaciones SET estado = ? WHERE id = ?', [req.body.estado, conv.cotizacion_id]);
      }
    }
    res.json({ success: true, message: 'Estado actualizado' });
  } catch (err) {
    console.error('[proyectos/estado] Error:', err.message);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

/* DELETE /api/proyectos/:id */
router.delete('/:id', [param('id').isInt({ min: 1 })], async (req, res) => {
  if (!validationResult(req).isEmpty())
    return res.status(400).json({ success: false, message: 'ID inválido' });
  try {
    const { affectedRows } = await run('DELETE FROM proyectos WHERE id = ?', [req.params.id]);
    if (!affectedRows) return res.status(404).json({ success: false, message: 'No encontrado' });
    res.json({ success: true, message: 'Proyecto eliminado' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

module.exports = router;
