const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { run, query, get } = require('../../database');
const { logActivity } = require('./mt-logger');

const router = express.Router();

const ESTADOS_TRANS = ['cobrado', 'pendiente', 'cotizando', 'vencido'];
const TIPOS = ['ingreso', 'gasto'];

/* ── TRANSACCIONES ── */

/* POST /api/transacciones */
router.post('/transacciones', [
  body('concepto').trim().notEmpty().withMessage('El concepto es requerido'),
  body('monto').isFloat({ min: 0.01 }).withMessage('Monto inválido'),
  body('tipo').optional().isIn(TIPOS),
  body('estado').optional().isIn(ESTADOS_TRANS),
  body('fecha').optional().isISO8601().toDate(),
  body('categoria').optional().trim(),
  body('cliente_nombre').optional().trim(),
  body('moneda').optional().isIn(['USD','EUR','DOP']),
], async (req, res) => {
  if (!validationResult(req).isEmpty())
    return res.status(422).json({ success: false, errors: validationResult(req).array() });
  try {
    const { concepto, monto, tipo = 'ingreso', estado = 'pendiente', fecha = null,
            categoria = '', cliente_nombre = '', nota = '', cliente_id = null, proyecto_id = null, moneda = 'USD' } = req.body;
    const { id } = await run(
      `INSERT INTO transacciones (concepto, monto, tipo, estado, fecha, categoria, cliente_nombre, nota, cliente_id, proyecto_id, moneda)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [concepto, monto, tipo, estado, fecha, categoria, cliente_nombre, nota, cliente_id, proyecto_id, moneda]
    );
    logActivity('transaccion', id, req, { tipo, monto, moneda });
    res.status(201).json({ success: true, message: 'Transacción creada', id });
  } catch (err) {
    console.error('[finanzas] Error:', err.message);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

/* GET /api/transacciones */
router.get('/transacciones', async (req, res) => {
  const { estado, tipo, categoria, desde, hasta } = req.query;
  const limit  = Math.min(parseInt(req.query.limit) || 50, 200);
  const offset = parseInt(req.query.offset) || 0;
  try {
    let sql = 'SELECT * FROM transacciones WHERE 1=1';
    let params = [];
    if (estado && ESTADOS_TRANS.includes(estado)) { sql += ' AND estado = ?'; params.push(estado); }
    if (tipo && TIPOS.includes(tipo)) { sql += ' AND tipo = ?'; params.push(tipo); }
    if (categoria) { sql += ' AND categoria = ?'; params.push(categoria); }
    if (desde) { sql += ' AND fecha >= ?'; params.push(desde); }
    if (hasta) { sql += ' AND fecha <= ?'; params.push(hasta); }
    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) AS total');
    sql += ' ORDER BY fecha DESC, created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    const rows = await query(sql, params);
    const { total } = await get(countSql, params.slice(0, -2));
    res.json({ success: true, total, data: rows });
  } catch (err) {
    console.error('[transacciones GET] Error:', err.message);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

/* GET /api/transacciones/stats */
router.get('/transacciones/stats', async (req, res) => {
  try {
    const [ingresos, gastos, pendientes, vencidos, totales] = await Promise.all([
      get('SELECT COALESCE(SUM(monto),0) AS total_ingresos FROM transacciones WHERE tipo = "ingreso" AND estado = "cobrado"'),
      get('SELECT COALESCE(SUM(monto),0) AS total_gastos FROM transacciones WHERE tipo = "gasto"'),
      get('SELECT COALESCE(SUM(monto),0) AS total_pendientes FROM transacciones WHERE estado = "pendiente"'),
      get('SELECT COALESCE(SUM(monto),0) AS total_vencidos FROM transacciones WHERE estado = "vencido"'),
      get('SELECT COUNT(*) AS facturas FROM transacciones'),
    ]);
    res.json({ success: true, data: { ...ingresos, ...gastos, ...pendientes, ...vencidos, ...totales } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

/* GET /api/transacciones/:id */
router.get('/transacciones/:id', [param('id').isInt({ min: 1 })], async (req, res) => {
  if (!validationResult(req).isEmpty())
    return res.status(400).json({ success: false, message: 'ID inválido' });
  try {
    const row = await get('SELECT * FROM transacciones WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ success: false, message: 'No encontrado' });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

/* PATCH /api/transacciones/:id */
router.patch('/transacciones/:id', [param('id').isInt({ min: 1 })], async (req, res) => {
  if (!validationResult(req).isEmpty())
    return res.status(400).json({ success: false, message: 'ID inválido' });
  const allowed = ['concepto','monto','tipo','estado','fecha','categoria','cliente_nombre','nota'];
  const sets = [];
  const vals = [];
  for (const k of allowed) {
    if (req.body[k] !== undefined) { sets.push(`${k} = ?`); vals.push(req.body[k]); }
  }
  if (!sets.length) return res.status(400).json({ success: false, message: 'Sin campos' });
  vals.push(req.params.id);
  try {
    const { affectedRows } = await run(`UPDATE transacciones SET ${sets.join(', ')} WHERE id = ?`, vals);
    if (!affectedRows) return res.status(404).json({ success: false, message: 'No encontrado' });
    res.json({ success: true, message: 'Transacción actualizada' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

/* DELETE /api/transacciones/:id */
router.delete('/transacciones/:id', [param('id').isInt({ min: 1 })], async (req, res) => {
  if (!validationResult(req).isEmpty())
    return res.status(400).json({ success: false, message: 'ID inválido' });
  try {
    const { affectedRows } = await run('DELETE FROM transacciones WHERE id = ?', [req.params.id]);
    if (!affectedRows) return res.status(404).json({ success: false, message: 'No encontrado' });
    res.json({ success: true, message: 'Transacción eliminada' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

/* ── INGRESOS (gráficos) ── */

/* GET /api/ingresos/mensuales — últimos 12 meses desde transacciones */
router.get('/ingresos/mensuales', async (req, res) => {
  try {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() - 11);
    startDate.setDate(1);
    const startStr = startDate.toISOString().slice(0, 10);

    const rows = await query(
      `SELECT DATE_FORMAT(fecha, '%Y-%m') AS mes, COALESCE(SUM(monto),0) AS monto
       FROM transacciones
       WHERE tipo = 'ingreso' AND estado = 'cobrado' AND fecha >= ?
       GROUP BY DATE_FORMAT(fecha, '%Y-%m')
       ORDER BY mes`,
      [startStr]
    );

    const months = [];
    const labels = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      const found = rows.find(r => r.mes === key);
      months.push({ mes: key, monto: found ? parseFloat(found.monto) : 0 });
      labels.push(d.toLocaleDateString('es-DO', { month: 'short' }));
    }
    res.json({ success: true, data: months, labels });
  } catch (err) {
    console.error('[ingresos/mensuales] Error:', err.message);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

/* GET /api/ingresos/servicios — calculado dinámicamente desde transacciones */
router.get('/ingresos/servicios', async (req, res) => {
  const año = parseInt(req.query.año) || new Date().getFullYear();
  try {
    const rows = await query(
      `SELECT categoria AS servicio, COALESCE(SUM(monto),0) AS monto_total 
       FROM transacciones 
       WHERE tipo = 'ingreso' AND estado = 'cobrado' AND YEAR(fecha) = ? AND categoria != '' 
       GROUP BY categoria 
       ORDER BY monto_total DESC`,
      [año]
    );
    const total = rows.reduce((sum, r) => sum + parseFloat(r.monto_total), 0);
    const data = rows.map(r => ({
      servicio: r.servicio,
      monto_total: parseFloat(r.monto_total),
      porcentaje: total > 0 ? (parseFloat(r.monto_total) / total * 100).toFixed(2) : 0
    }));
    res.json({ success: true, data });
  } catch (err) {
    console.error('[ingresos/servicios] Error:', err.message);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

/* GET /api/factura/clientes — lista simplificada de clientes */
router.get('/factura/clientes', async (req, res) => {
  try {
    const rows = await query(
      'SELECT id, nombre, apellido, email, empresa, servicio FROM clientes WHERE estado = "activo" ORDER BY nombre, apellido'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[factura/clientes] Error:', err.message);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

/* GET /api/factura/proyectos — lista simplificada de proyectos activos */
router.get('/factura/proyectos', async (req, res) => {
  try {
    const rows = await query(
      `SELECT p.id, p.nombre, p.apellido, p.empresa, p.tipo_proyecto, p.monto, p.moneda, p.descripcion,
              CONCAT(p.nombre, ' ', p.apellido) AS cliente_nombre
       FROM proyectos p
       WHERE p.estado IN ('pendiente','revisado','desarrollando')
       ORDER BY p.created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[factura/proyectos] Error:', err.message);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

module.exports = router;
