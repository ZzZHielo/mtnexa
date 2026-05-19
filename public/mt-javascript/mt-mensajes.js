const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { run, query, get } = require('../../database');
const { logActivity } = require('./mt-logger');

const router = express.Router();

/* ── CONVERSACIONES ── */

/* GET /api/conversaciones */
router.get('/', async (req, res) => {
  const { estado, cuenta_id } = req.query;
  const limit  = Math.min(parseInt(req.query.limit) || 50, 200);
  const offset = parseInt(req.query.offset) || 0;
  try {
    let sql = `SELECT c.*,
      (SELECT COUNT(*) FROM mensajes WHERE conversacion_id = c.id AND remitente = 'cliente' AND leido = 0) AS unread_count,
      EXISTS(SELECT 1 FROM mensajes WHERE conversacion_id = c.id AND remitente = 'admin') AS admin_replied,
      u.nombre AS cuenta_nombre, u.correo AS cuenta_correo, u.avatar_url AS cuenta_avatar_url,
      cl.vip AS cuenta_vip,
      p.nombre AS proyecto_nombre, p.tipo_proyecto AS proyecto_tipo,
      p.estado AS proyecto_estado, p.presupuesto AS proyecto_presupuesto,
      co.tipo_proyecto AS cot_tipo
      FROM conversaciones c
      LEFT JOIN usuarios u ON c.cuenta_id = u.id
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      LEFT JOIN proyectos p ON c.proyecto_id = p.id
      LEFT JOIN cotizaciones co ON c.cotizacion_id = co.id`;
    let params = [];
    const conds = [];
    if (estado === 'activa' || estado === 'archivada') {
      conds.push('c.estado = ?');
      params.push(estado);
    }
    if (cuenta_id) {
      conds.push('c.cuenta_id = ?');
      params.push(parseInt(cuenta_id));
    }
    if (conds.length) sql += ' WHERE ' + conds.join(' AND ');
    sql += ' ORDER BY c.ultimo_mensaje_at DESC, c.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    const rows = await query(sql, params);
    let countSql = 'SELECT COUNT(*) AS total FROM conversaciones c';
    if (conds.length) countSql += ' WHERE ' + conds.join(' AND ');
    const { total } = await get(countSql, params.slice(0, -2));
    res.json({ success: true, total, data: rows });
  } catch (err) {
    console.error('[conversaciones] Error:', err.message);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

/* GET /api/conversaciones/stats/resumen — stats a nivel de chats */
router.get('/stats/resumen', async (req, res) => {
  try {
    const r1 = await query('SELECT COUNT(*) AS c FROM conversaciones');
    const r2 = await query('SELECT COUNT(*) AS c FROM conversaciones c WHERE c.estado = \'activa\' AND NOT EXISTS(SELECT 1 FROM mensajes WHERE conversacion_id = c.id AND remitente = \'admin\')');
    const r3 = await query('SELECT COUNT(*) AS c FROM conversaciones c WHERE c.estado = \'activa\' AND EXISTS(SELECT 1 FROM mensajes WHERE conversacion_id = c.id AND remitente = \'admin\')');
    const r4 = await query('SELECT COUNT(*) AS c FROM conversaciones WHERE estado = \'cerrados\'');
    const r5 = await query('SELECT COUNT(*) AS c FROM conversaciones WHERE estado = \'archivada\'');
    const r6 = await query('SELECT COUNT(*) AS c FROM conversaciones WHERE estado = \'activa\'');
    res.json({
      success: true,
      data: {
        total_mensajes: r1[0].c,
        no_leidos: r2[0].c,
        respondidos: r3[0].c,
        cerrados: r4[0].c,
        archivados: r5[0].c,
        conversaciones_activas: r6[0].c
      }
    });
  } catch (err) {
    console.error('[conversaciones/stats] Error:', err.message);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

/* GET /api/conversaciones/:id — con mensajes + proyecto */
router.get('/:id', [param('id').isInt({ min: 1 })], async (req, res) => {
  if (!validationResult(req).isEmpty())
    return res.status(400).json({ success: false, message: 'ID inválido' });
  try {
    const conv = await get(
      `SELECT c.*, p.id AS proyecto_id, p.nombre AS proyecto_nombre, p.empresa AS proyecto_empresa,
               p.tipo_proyecto AS proyecto_tipo, p.presupuesto AS proyecto_presupuesto,
               p.monto AS proyecto_monto, p.moneda AS proyecto_moneda,
               p.estado AS proyecto_estado, p.descripcion AS proyecto_descripcion,
              p.email AS proyecto_email, p.telefono AS proyecto_telefono,
              p.fecha_inicio AS proyecto_fecha_inicio, p.fecha_entrega AS proyecto_fecha_entrega,
              co.nombre AS cot_nombre, co.apellido AS cot_apellido, co.correo AS cot_correo,
              co.whatsapp AS cot_whatsapp, co.tipo_proyecto AS cot_tipo, co.presupuesto AS cot_presupuesto,
              co.monto AS cot_monto, co.moneda AS cot_moneda,
              co.descripcion AS cot_descripcion, co.estado AS cot_estado,
              co.funcionalidades AS cot_funcionalidades, co.created_at AS cot_created_at
       FROM conversaciones c
       LEFT JOIN proyectos p ON c.proyecto_id = p.id
       LEFT JOIN cotizaciones co ON c.cotizacion_id = co.id
       WHERE c.id = ?`,
      [req.params.id]
    );
    if (!conv) return res.status(404).json({ success: false, message: 'No encontrado' });
    const mensajes = await query('SELECT * FROM mensajes WHERE conversacion_id = ? ORDER BY created_at ASC', [req.params.id]);
    res.json({ success: true, data: { ...conv, mensajes } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

/* POST /api/conversaciones */
router.post('/', [
  body('cliente_nombre').trim().notEmpty(),
  body('cliente_apellido').optional().trim(),
  body('empresa').optional().trim(),
  body('servicio').optional().trim(),
  body('asunto').optional().trim(),
], async (req, res) => {
  if (!validationResult(req).isEmpty())
    return res.status(422).json({ success: false, errors: validationResult(req).array() });
  try {
    const { cliente_nombre, cliente_apellido = '', empresa = '', servicio = '', asunto = '' } = req.body;
    const { id } = await run(
      `INSERT INTO conversaciones (cliente_nombre, cliente_apellido, empresa, servicio, asunto)
       VALUES (?, ?, ?, ?, ?)`,
      [cliente_nombre, cliente_apellido, empresa, servicio, asunto]
    );
    logActivity('conversacion', id, req);
    res.status(201).json({ success: true, message: 'Conversación creada', id });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

/* PATCH /api/conversaciones/:id */
router.patch('/:id', [param('id').isInt({ min: 1 })], async (req, res) => {
  if (!validationResult(req).isEmpty())
    return res.status(400).json({ success: false, message: 'ID inválido' });
  const allowed = ['estado', 'asunto', 'proyecto_id', 'cotizacion_id'];
  const sets = [];
  const vals = [];
  for (const k of allowed) {
    if (req.body[k] !== undefined) { sets.push(`${k} = ?`); vals.push(req.body[k]); }
  }
  if (!sets.length) return res.status(400).json({ success: false, message: 'Sin campos' });
  vals.push(req.params.id);
  try {
    const { affectedRows } = await run(`UPDATE conversaciones SET ${sets.join(', ')} WHERE id = ?`, vals);
    if (!affectedRows) return res.status(404).json({ success: false, message: 'No encontrado' });
    res.json({ success: true, message: 'Conversación actualizada' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

/* DELETE /api/conversaciones/:id */
router.delete('/:id', [param('id').isInt({ min: 1 })], async (req, res) => {
  if (!validationResult(req).isEmpty())
    return res.status(400).json({ success: false, message: 'ID inválido' });
  try {
    const { affectedRows } = await run('DELETE FROM conversaciones WHERE id = ?', [req.params.id]);
    if (!affectedRows) return res.status(404).json({ success: false, message: 'No encontrado' });
    res.json({ success: true, message: 'Conversación eliminada' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

/* ── MENSAJES ── */

/* GET /api/conversaciones/:id/mensajes */
router.get('/:id/mensajes', [param('id').isInt({ min: 1 })], async (req, res) => {
  if (!validationResult(req).isEmpty())
    return res.status(400).json({ success: false, message: 'ID inválido' });
  try {
    const rows = await query('SELECT * FROM mensajes WHERE conversacion_id = ? ORDER BY created_at ASC', [req.params.id]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

/* POST /api/conversaciones/:id/mensajes */
router.post('/:id/mensajes', [
  param('id').isInt({ min: 1 }),
  body('texto').optional().trim(),
  body('remitente').optional().isIn(['admin', 'cliente']),
  body('archivo_url').optional().isString(),
  body('archivo_nombre').optional().isString(),
  body('archivo_tipo').optional().isString(),
  body('archivo_tamano').optional().isInt(),
], async (req, res) => {
  if (!validationResult(req).isEmpty())
    return res.status(422).json({ success: false, errors: validationResult(req).array() });
  if (!req.body.texto && !req.body.archivo_url)
    return res.status(400).json({ success: false, message: 'Debe enviar texto o un archivo' });
  try {
    const conv = await get('SELECT id, estado FROM conversaciones WHERE id = ?', [req.params.id]);
    if (!conv) return res.status(404).json({ success: false, message: 'Conversación no encontrada' });
    if (conv.estado === 'archivada') return res.status(403).json({ success: false, message: 'La conversación está archivada. No se pueden enviar mensajes.' });
    const remitente = req.body.remitente || 'admin';
    const texto = req.body.texto || '';
    const { id } = await run(
      'INSERT INTO mensajes (conversacion_id, remitente, texto, archivo_url, archivo_nombre, archivo_tipo, archivo_tamano) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.params.id, remitente, texto, req.body.archivo_url||null, req.body.archivo_nombre||null, req.body.archivo_tipo||null, req.body.archivo_tamano||null]
    );
    const preview = req.body.archivo_nombre || req.body.texto;
    await run(
      'UPDATE conversaciones SET ultimo_mensaje = ?, ultimo_mensaje_at = NOW() WHERE id = ?',
      [preview, req.params.id]
    );
    const msg = await get('SELECT * FROM mensajes WHERE id = ?', [id]);
    res.status(201).json({ success: true, message: 'Mensaje enviado', id, data: msg });
  } catch (err) {
    console.error('[mensajes POST] Error:', err.message);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

module.exports = router;
