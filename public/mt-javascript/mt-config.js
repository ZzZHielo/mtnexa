const express = require('express');
const bcrypt = require('bcrypt');
const { run, query, get } = require('../../database');
const { logActivity } = require('./mt-logger');
const { DEFAULT_CONFIG, deepMerge } = require('./mt-config-defaults');

const publicRouter = express.Router();
const router = express.Router();
const BCRYPT_ROUNDS = 12;

const EXPORT_TABLES = [
  'usuarios', 'clientes', 'proyectos', 'cotizaciones', 'consultas',
  'transacciones', 'activity_log', 'configuracion_sistema',
];

async function loadConfig() {
  const row = await get('SELECT datos FROM configuracion_sistema WHERE id = 1');
  if (!row || !row.datos) return { ...DEFAULT_CONFIG };
  let datos = row.datos;
  if (typeof datos === 'string') {
    try { datos = JSON.parse(datos); } catch { datos = {}; }
  }
  return deepMerge(DEFAULT_CONFIG, datos);
}

async function saveConfig(datos, req, seccion) {
  await run(
    `INSERT INTO configuracion_sistema (id, datos) VALUES (1, ?)
     ON DUPLICATE KEY UPDATE datos = VALUES(datos), updated_at = NOW()`,
    [JSON.stringify(datos)]
  );
  if (req) logActivity('config', null, req, { seccion: seccion || 'general' });
}

/* GET /api/config */
router.get('/', async (req, res) => {
  try {
    const datos = await loadConfig();
    res.json({ success: true, data: datos });
  } catch (err) {
    console.error('[config GET]', err.message);
    res.status(500).json({ success: false, message: 'Error al cargar configuración' });
  }
});

/* GET /api/config/mantenimiento — público para el sitio */
publicRouter.get('/mantenimiento', async (req, res) => {
  try {
    const datos = await loadConfig();
    res.json({ success: true, mantenimiento: !!datos.sistema?.mantenimiento });
  } catch (err) {
    res.json({ success: true, mantenimiento: false });
  }
});

/* PUT /api/config — body: partial config object + optional _seccion */
router.put('/', async (req, res) => {
  try {
    const current = await loadConfig();
    const patch = { ...req.body };
    delete patch._seccion;
    const merged = deepMerge(current, patch);
    await saveConfig(merged, req, req.body._seccion || 'general');
    res.json({ success: true, message: 'Configuración guardada', data: merged });
  } catch (err) {
    console.error('[config PUT]', err.message);
    res.status(500).json({ success: false, message: 'Error al guardar configuración' });
  }
});

/* POST /api/config/restaurar-defaults */
router.post('/restaurar-defaults', async (req, res) => {
  try {
    const seccion = req.body.seccion;
    let datos = await loadConfig();
    if (seccion && DEFAULT_CONFIG[seccion]) {
      datos[seccion] = { ...DEFAULT_CONFIG[seccion] };
    } else {
      datos = { ...DEFAULT_CONFIG };
    }
    await saveConfig(datos, req, seccion || 'todos');
    res.json({ success: true, message: 'Valores restaurados', data: datos });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al restaurar' });
  }
});

/* GET /api/config/usuarios — personal del panel (admin/editor) */
router.get('/usuarios', async (req, res) => {
  try {
    const rows = await query(
      `SELECT id, nombre, apellido, correo, rol, activo, last_login, created_at
       FROM usuarios ORDER BY FIELD(rol,'admin','editor','cliente'), nombre ASC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al listar usuarios' });
  }
});

/* POST /api/config/usuarios */
router.post('/usuarios', async (req, res) => {
  try {
    const { nombre, apellido = '', correo, password, rol = 'editor' } = req.body;
    if (!nombre || !correo || !password) {
      return res.status(400).json({ success: false, message: 'Nombre, correo y contraseña son requeridos' });
    }
    if (!['admin', 'editor'].includes(rol)) {
      return res.status(400).json({ success: false, message: 'Rol inválido' });
    }
    const exists = await get('SELECT id FROM usuarios WHERE correo = ?', [correo]);
    if (exists) return res.status(409).json({ success: false, message: 'Este correo ya está registrado' });

    const cfg = await loadConfig();
    const minLen = cfg.seguridad?.pwd_min || 8;
    if (password.length < minLen) {
      return res.status(400).json({ success: false, message: `La contraseña debe tener al menos ${minLen} caracteres` });
    }

    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const { id } = await run(
      `INSERT INTO usuarios (nombre, apellido, correo, password_hash, rol, activo) VALUES (?, ?, ?, ?, ?, 1)`,
      [nombre, apellido, correo, password_hash, rol]
    );
    logActivity('usuario', id, req, { accion: 'crear', correo });
    const user = await get(
      'SELECT id, nombre, apellido, correo, rol, activo, last_login, created_at FROM usuarios WHERE id = ?',
      [id]
    );
    res.status(201).json({ success: true, message: 'Usuario creado', data: user });
  } catch (err) {
    console.error('[config/usuarios POST]', err.message);
    res.status(500).json({ success: false, message: 'Error al crear usuario' });
  }
});

/* PATCH /api/config/usuarios/:id */
router.patch('/usuarios/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const allowed = ['nombre', 'apellido', 'rol', 'activo'];
    const sets = [];
    const vals = [];
    for (const k of allowed) {
      if (req.body[k] !== undefined) {
        sets.push(`${k} = ?`);
        vals.push(k === 'activo' ? (req.body[k] ? 1 : 0) : req.body[k]);
      }
    }
    if (!sets.length) return res.status(400).json({ success: false, message: 'Sin campos para actualizar' });
    vals.push(id);
    const { affectedRows } = await run(`UPDATE usuarios SET ${sets.join(', ')} WHERE id = ?`, vals);
    if (!affectedRows) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    logActivity('usuario', id, req, { accion: 'actualizar', ...req.body });
    const user = await get(
      'SELECT id, nombre, apellido, correo, rol, activo, last_login, created_at FROM usuarios WHERE id = ?',
      [id]
    );
    res.json({ success: true, message: 'Usuario actualizado', data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error al actualizar usuario' });
  }
});

/* GET /api/config/export — respaldo JSON de tablas principales */
router.get('/export', async (req, res) => {
  try {
    const data = {};
    for (const tabla of EXPORT_TABLES) {
      data[tabla] = await query(`SELECT * FROM ${tabla} ORDER BY id`);
    }
    logActivity('config', null, req, { accion: 'export' });
    res.json({
      success: true,
      exported_at: new Date().toISOString(),
      total_tables: EXPORT_TABLES.length,
      data,
    });
  } catch (err) {
    console.error('[config/export]', err.message);
    res.status(500).json({ success: false, message: 'Error al exportar' });
  }
});

module.exports = { publicRouter, router };
