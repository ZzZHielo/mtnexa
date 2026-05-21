const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { run, query, get } = require('../../database');
const { logActivity } = require('./mt-logger');
const { clienteProyectoMatchSql } = require('./mt-cliente-proyecto-match');

const router = express.Router();
const MATCH = clienteProyectoMatchSql('c', 'p');

const ESTADOS = ['activo', 'pausado', 'inactivo'];

const validateCliente = [
  body('nombre').trim().notEmpty().withMessage('El nombre es requerido'),
  body('apellido').optional().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('telefono').optional().trim(),
  body('empresa').optional().trim(),
  body('cargo').optional().trim(),
  body('sector').optional().trim(),
  body('servicio').optional().trim(),
  body('valor_total').optional().isFloat({ min: 0 }),
  body('vip').optional().isBoolean(),
  body('notas').optional().isString(),
];

/* POST /api/clientes */
router.post('/', validateCliente, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ success: false, errors: errors.array() });
  try {
    const { nombre, apellido = '', email = '', telefono = '', empresa = '',
            cargo = '', sector = '', servicio = '', valor_total = 0,
            vip = false, notas = '' } = req.body;
    const { id } = await run(
      `INSERT INTO clientes (nombre, apellido, email, telefono, empresa, cargo, sector, servicio, valor_total, vip, notas)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, apellido, email, telefono, empresa, cargo, sector, servicio, valor_total, vip ? 1 : 0, notas]
    );
    logActivity('cliente', id, req, { empresa });
    res.status(201).json({ success: true, message: 'Cliente creado', id });
  } catch (err) {
    console.error('[clientes] Error:', err.message);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

/* GET /api/clientes */
router.get('/', async (req, res) => {
  const { estado, sector, vip, email } = req.query;
  const limit  = Math.min(parseInt(req.query.limit) || 50, 200);
  const offset = parseInt(req.query.offset) || 0;
  try {
    let sql = 'SELECT c.*, ' +
      '(SELECT COALESCE(SUM(monto),0) FROM transacciones WHERE cliente_id = c.id AND tipo = "ingreso" AND estado = "cobrado") AS valor_pagado, ' +
      '(SELECT COUNT(*) FROM proyectos p WHERE ' + MATCH + ') AS proyectos_count, ' +
      '(SELECT COALESCE(SUM(COALESCE(p.monto, 0)), 0) FROM proyectos p WHERE ' + MATCH + ') AS proyectos_valor_total ' +
      'FROM clientes c WHERE 1=1';
    let params = [];
    let countParams = [];
    if (estado && ESTADOS.includes(estado)) { sql += ' AND c.estado = ?'; params.push(estado); countParams.push(estado); }
    if (sector) { sql += ' AND c.sector = ?'; params.push(sector); countParams.push(sector); }
    if (vip !== undefined) { sql += ' AND c.vip = ?'; params.push(vip === 'true' || vip === '1' ? 1 : 0); countParams.push(vip === 'true' || vip === '1' ? 1 : 0); }
    if (email) { sql += ' AND LOWER(TRIM(c.email)) = LOWER(TRIM(?))'; params.push(email); countParams.push(email); }
    sql += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    const rows = await query(sql, params);

    if (req.query.include === 'proyectos' && rows.length) {
      try {
        const allProyectos = await query(
          'SELECT id, nombre, apellido, empresa, email, tipo_proyecto, presupuesto, monto, moneda, estado, fecha_entrega, created_at FROM proyectos'
        );
        rows.forEach(c => {
          c.proyectos = allProyectos.filter(p =>
            (c.email && p.email && p.email.trim().toLowerCase() === c.email.trim().toLowerCase()) ||
            (c.empresa && p.empresa &&
              p.empresa.trim().toLowerCase() === c.empresa.trim().toLowerCase() &&
              p.nombre.trim().toLowerCase() === c.nombre.trim().toLowerCase() &&
              (p.apellido || '').trim().toLowerCase() === (c.apellido || '').trim().toLowerCase())
          );
        });
      } catch (e) {
        console.warn('[clientes] include=proyectos falló:', e.message);
      }
    }

    const countSql = 'SELECT COUNT(*) AS total FROM clientes WHERE 1=1' + (estado && ESTADOS.includes(estado)?' AND estado = ?':'') + (sector?' AND sector = ?':'') + (vip!==undefined?' AND vip = ?':'') + (email?' AND LOWER(TRIM(email)) = LOWER(TRIM(?))':'');
    const { total } = await get(countSql, countParams);
    res.json({ success: true, total, data: rows });
  } catch (err) {
    console.error('[clientes GET] Error:', err.message);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

/* GET /api/clientes/stats */
router.get('/stats', async (req, res) => {
  try {
    const [total, porEstado, porSector, porServicio] = await Promise.all([
      get('SELECT COUNT(*) AS total, SUM(vip) AS vip_count FROM clientes'),
      query('SELECT estado, COUNT(*) AS total FROM clientes GROUP BY estado'),
      query('SELECT sector, COUNT(*) AS total FROM clientes WHERE sector != "" GROUP BY sector ORDER BY total DESC'),
      query('SELECT servicio, COUNT(*) AS total FROM clientes WHERE servicio != "" GROUP BY servicio ORDER BY total DESC'),
    ]);
    res.json({ success: true, data: total });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

/* GET /api/clientes/:id/proyectos */
router.get('/:id/proyectos', [param('id').isInt({ min: 1 })], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, message: 'ID inválido', errors: errors.array() });
  try {
    const cliente = await get('SELECT id FROM clientes WHERE id = ?', [req.params.id]);
    if (!cliente) return res.status(404).json({ success: false, message: 'No encontrado' });
    const rows = await query(
      'SELECT p.id, p.nombre, p.apellido, p.empresa, p.tipo_proyecto, p.presupuesto, p.monto, p.moneda, p.estado, p.fecha_entrega, p.created_at ' +
      'FROM proyectos p INNER JOIN clientes c ON c.id = ? WHERE ' + MATCH + ' ORDER BY p.created_at DESC',
      [req.params.id]
    );
    res.json({ success: true, total: rows.length, data: rows });
  } catch (err) {
    console.error('[clientes/:id/proyectos] Error:', err.message);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

/* GET /api/clientes/:id */
router.get('/:id', [param('id').isInt({ min: 1 })], async (req, res) => {
  if (!validationResult(req).isEmpty())
    return res.status(400).json({ success: false, message: 'ID inválido' });
  try {
    const row = await get('SELECT c.*, ' +
      '(SELECT COALESCE(SUM(monto),0) FROM transacciones WHERE cliente_id = c.id AND tipo = "ingreso" AND estado = "cobrado") AS valor_pagado, ' +
      '(SELECT COUNT(*) FROM proyectos p WHERE ' + MATCH + ') AS proyectos_count, ' +
      '(SELECT COALESCE(SUM(COALESCE(p.monto, 0)), 0) FROM proyectos p WHERE ' + MATCH + ') AS proyectos_valor_total ' +
      'FROM clientes c WHERE c.id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ success: false, message: 'No encontrado' });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

/* PATCH /api/clientes/:id */
router.patch('/:id', [param('id').isInt({ min: 1 })], async (req, res) => {
  if (!validationResult(req).isEmpty())
    return res.status(400).json({ success: false, message: 'ID inválido' });
  const allowed = ['nombre','apellido','email','telefono','empresa','cargo','sector','servicio','valor_total','estado','vip','notas','ultimo_contacto'];
  const sets = [];
  const vals = [];
  for (const k of allowed) {
    if (req.body[k] !== undefined) {
      sets.push(`${k} = ?`);
      vals.push(k === 'vip' ? (req.body[k] ? 1 : 0) : req.body[k]);
    }
  }
  if (!sets.length) return res.status(400).json({ success: false, message: 'Sin campos para actualizar' });
  vals.push(req.params.id);
  try {
    const { affectedRows } = await run(`UPDATE clientes SET ${sets.join(', ')} WHERE id = ?`, vals);
    if (!affectedRows) return res.status(404).json({ success: false, message: 'No encontrado' });
    res.json({ success: true, message: 'Cliente actualizado' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

/* DELETE /api/clientes/:id */
router.delete('/:id', [param('id').isInt({ min: 1 })], async (req, res) => {
  if (!validationResult(req).isEmpty())
    return res.status(400).json({ success: false, message: 'ID inválido' });
  try {
    const { affectedRows } = await run('DELETE FROM clientes WHERE id = ?', [req.params.id]);
    if (!affectedRows) return res.status(404).json({ success: false, message: 'No encontrado' });
    res.json({ success: true, message: 'Cliente eliminado' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

module.exports = router;
