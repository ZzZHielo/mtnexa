/**
 * Multitech — Rutas: Admin Dashboard (MySQL)
 *
 * GET /api/admin/stats
 * GET /api/admin/actividad       ?limit=
 * GET /api/admin/export/:tabla
 */

const express = require('express');
const { run, query, get } = require('../../database');

const router = express.Router();

/* ── GET /api/admin/stats ── */
router.get('/stats', async (req, res) => {
  try {
    const [
      { total: totCot },
      { total: totPend },
      { total: totCons },
      { total: totNuevas },
      { total: totSol },
      { total: totSubs },
      { total: totPlant },
      { total: totProy },
      { total: totProyActivos },
      { total: totClientes },
      { total: totIngresos },
      { total: ingresosMes },
      recientes,
      porTipo,
      temas,
      ultimas_cotizaciones,
      ultimas_consultas,
      proyectosRecientes,
      leadsRecientes,
      ingresosMensuales,
    ] = await Promise.all([
      get('SELECT COUNT(*) AS total FROM cotizaciones'),
      get("SELECT COUNT(*) AS total FROM cotizaciones WHERE estado = 'pendiente'"),
      get('SELECT COUNT(*) AS total FROM consultas'),
      get("SELECT COUNT(*) AS total FROM consultas WHERE estado = 'nueva'"),
      get('SELECT COUNT(*) AS total FROM solicitudes_plantillas'),
      get('SELECT COUNT(*) AS total FROM suscriptores WHERE activo = 1'),
      get('SELECT COUNT(*) AS total FROM plantillas WHERE activa = 1'),
      get('SELECT COUNT(*) AS total FROM proyectos'),
      get("SELECT COUNT(*) AS total FROM proyectos WHERE estado IN ('desarrollando','revisado') OR estado IS NULL OR estado = ''"),
      get('SELECT COUNT(*) AS total FROM clientes'),
      get("SELECT COALESCE(SUM(monto),0) AS total FROM transacciones WHERE tipo = 'ingreso' AND estado = 'cobrado'"),
      get("SELECT COALESCE(SUM(monto),0) AS total FROM transacciones WHERE tipo = 'ingreso' AND estado = 'cobrado' AND MONTH(fecha) = MONTH(CURDATE()) AND YEAR(fecha) = YEAR(CURDATE())"),

      query('SELECT tipo, ref_id, created_at FROM activity_log ORDER BY created_at DESC LIMIT 10'),

      query(
        `SELECT tipo_proyecto, COUNT(*) AS total
         FROM cotizaciones
         WHERE tipo_proyecto != ''
         GROUP BY tipo_proyecto
         ORDER BY total DESC`
      ),

      query(
        'SELECT tema, COUNT(*) AS total FROM preferencias_tema GROUP BY tema ORDER BY total DESC'
      ),

      query(
        `SELECT id, nombre, correo, tipo_proyecto, estado, created_at
         FROM cotizaciones ORDER BY created_at DESC LIMIT 5`
      ),

      query(
        `SELECT id, nombre, correo, asunto, estado, created_at
         FROM consultas ORDER BY created_at DESC LIMIT 5`
      ),

      query(
        `SELECT id, nombre, empresa, tipo_proyecto, presupuesto, monto, moneda, estado, fecha_entrega, created_at
         FROM proyectos ORDER BY created_at DESC LIMIT 5`
      ),

      query(
        `SELECT
           MONTH(fecha) AS mes,
           YEAR(fecha) AS anio,
           SUM(CASE WHEN YEAR(fecha) = YEAR(CURDATE()) THEN monto ELSE 0 END) AS actual,
           SUM(CASE WHEN YEAR(fecha) = YEAR(CURDATE()) - 1 THEN monto ELSE 0 END) AS anterior
         FROM transacciones
         WHERE tipo = 'ingreso' AND estado = 'cobrado'
           AND YEAR(fecha) >= YEAR(CURDATE()) - 1
         GROUP BY MONTH(fecha), YEAR(fecha)
         ORDER BY anio, mes`
      ),
    ]);

    res.json({
      success: true,
      data: {
        cotizaciones: { total: totCot, pendientes: totPend },
        consultas:    { total: totCons, nuevas: totNuevas },
        solicitudes_plantillas: totSol,
        suscriptores:           totSubs,
        plantillas_activas:     totPlant,
        proyectos:              totProy,
        proyectos_activos:      totProyActivos,
        clientes:               totClientes,
        ingresos_cobrados:      totIngresos,
        ingresos_mes:           ingresosMes,
        actividad_reciente:     recientes,
        cotizaciones_por_tipo:  porTipo,
        uso_temas:              temas,
        ultimas_cotizaciones,
        ultimas_consultas,
        proyectos_recientes:    proyectosRecientes,
        ingresos_mensuales:     ingresosMensuales,
      },
    });
  } catch (err) {
    console.error('[admin/stats] Error:', err.message);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

/* ── GET /api/admin/actividad ── */
router.get('/actividad', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 500);
  try {
    const rows = await query(
      'SELECT * FROM activity_log ORDER BY created_at DESC LIMIT ?',
      [limit]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

/* ── GET /api/admin/export/:tabla ── */
const TABLAS_PERMITIDAS = [
  'cotizaciones', 'consultas', 'solicitudes_plantillas',
  'suscriptores', 'plantillas', 'activity_log',
  'proyectos', 'clientes', 'conversaciones', 'mensajes',
  'transacciones', 'ingresos_mensuales', 'ingresos_por_servicio',
  'servicios', 'notificaciones',
];

router.get('/export/:tabla', async (req, res) => {
  const { tabla } = req.params;
  if (!TABLAS_PERMITIDAS.includes(tabla))
    return res.status(400).json({ success: false, message: 'Tabla no permitida' });

  try {
    const rows = await query(`SELECT * FROM ${tabla} ORDER BY id DESC`);
    res.json({
      success: true,
      tabla,
      exported_at: new Date().toISOString(),
      total: rows.length,
      data: rows,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

/* ── GET /api/admin/usuarios/:id ── */
router.get('/usuarios/:id', async (req, res) => {
  try {
    const user = await get(
      'SELECT id, nombre, apellido, username, correo, telefono, empresa, sitio_web, biografia, avatar_url, rol, activo, created_at FROM usuarios WHERE id = ?',
      [req.params.id]
    );
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    res.json({ success: true, data: user });
  } catch (err) {
    console.error('[admin/usuarios] Error:', err.message);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

const CAMPOS_USUARIO = ['nombre','apellido','username','telefono','empresa','sitio_web','biografia'];

/* ── PATCH /api/admin/usuarios/:id ── */
router.patch('/usuarios/:id', async (req, res) => {
  try {
    const sets = []; const vals = [];
    for (const k of CAMPOS_USUARIO) {
      if (req.body[k] !== undefined) { sets.push(`${k} = ?`); vals.push(req.body[k]); }
    }
    if (!sets.length) return res.status(400).json({ success: false, message: 'Sin campos para actualizar' });
    vals.push(req.params.id);
    const { affectedRows } = await run(`UPDATE usuarios SET ${sets.join(', ')} WHERE id = ?`, vals);
    if (!affectedRows) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    const user = await get(
      'SELECT id, nombre, apellido, username, correo, telefono, empresa, sitio_web, biografia, avatar_url, rol, activo, created_at FROM usuarios WHERE id = ?',
      [req.params.id]
    );
    res.json({ success: true, message: 'Usuario actualizado', data: user });
  } catch (err) {
    console.error('[admin/usuarios] Error:', err.message);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

module.exports = router;
