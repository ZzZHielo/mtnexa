const express = require('express');
const { body, validationResult } = require('express-validator');
const { run, query, get } = require('../../database');
const jwt = require('jsonwebtoken');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'mtnexa_jwt_secret_2025';

function attachUsuario(req, res, next) {
  try {
    const header = req.headers['authorization'];
    const token = header?.startsWith('Bearer ') ? header.slice(7) : req.cookies?.mt_token;
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.usuario = decoded;
    }
  } catch (e) { /* token inválido — usuario anónimo */ }
  next();
}
router.use(attachUsuario);

/* POST /api/chat — Enviar mensaje (auto-crea conversación) */
router.post('/', [
  body('mensaje').optional().trim(),
  body('nombre').optional().trim(),
  body('conversacion_id').optional().isInt(),
  body('archivo_url').optional().isString(),
  body('archivo_nombre').optional().isString(),
  body('archivo_tipo').optional().isString(),
  body('archivo_tamano').optional().isInt(),
], async (req, res) => {
  if (!validationResult(req).isEmpty())
    return res.status(422).json({ success: false, errors: validationResult(req).array() });
  if (!req.body.mensaje && !req.body.archivo_url)
    return res.status(400).json({ success: false, message: 'Debe enviar texto o un archivo' });

  const { mensaje, nombre } = req.body;
  const token = req.headers['x-chat-token'] || req.cookies?.chat_token;
  const usuarioId = req.usuario?.id || null;

  let conversacionId = req.body.conversacion_id || null;
  let cotizacionId = null;
  let cotizacionDesc = null;

  try {
    if (!conversacionId && usuarioId) {
      const conv = await get(
        'SELECT id FROM conversaciones WHERE cuenta_id = ? ORDER BY created_at DESC LIMIT 1',
        [usuarioId]
      );
      if (conv) conversacionId = conv.id;
    }

    if (!conversacionId && usuarioId) {
      const cot = await get('SELECT id, descripcion FROM cotizaciones WHERE correo = ? ORDER BY created_at DESC LIMIT 1', [req.usuario?.correo]);
      if (cot) {
        cotizacionId = cot.id;
        cotizacionDesc = cot.descripcion;
      }
    }

    if (!conversacionId && !usuarioId && token) {
      const conv = await get('SELECT id FROM conversaciones WHERE id = ?', [token]);
      if (conv) conversacionId = conv.id;
    }

    if (!conversacionId) {
      const displayName = nombre || (req.usuario?.nombre) || 'Invitado';
      const newId = await run(
        `INSERT INTO conversaciones (cliente_nombre, cliente_apellido, asunto, usuario_id, cuenta_id, cotizacion_id, ultimo_mensaje, ultimo_mensaje_at)
         VALUES (?, '', 'Chat en vivo', ?, ?, ?, ?, NOW())`,
        [displayName, usuarioId, usuarioId, cotizacionId, cotizacionDesc || mensaje]
      );
      conversacionId = newId.id;
      if (cotizacionDesc) {
        await run(
          'INSERT INTO mensajes (conversacion_id, remitente, texto) VALUES (?, ?, ?)',
          [conversacionId, 'cliente', cotizacionDesc]
        );
      }
    } else if (cotizacionId) {
      await run('UPDATE conversaciones SET cotizacion_id = ? WHERE id = ? AND cotizacion_id IS NULL', [cotizacionId, conversacionId]);
    }

    if (conversacionId) {
      const convCheck = await get('SELECT estado FROM conversaciones WHERE id = ?', [conversacionId]);
      if (convCheck && convCheck.estado === 'archivada') {
        return res.status(403).json({ success: false, message: 'No se pueden enviar mensajes, la conversación está archivada.' });
      }
    }

    const result = await run(
      'INSERT INTO mensajes (conversacion_id, remitente, texto, archivo_url, archivo_nombre, archivo_tipo, archivo_tamano) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [conversacionId, 'cliente', mensaje||'', req.body.archivo_url||null, req.body.archivo_nombre||null, req.body.archivo_tipo||null, req.body.archivo_tamano||null]
    );

    const preview = req.body.archivo_nombre || mensaje;
    await run(
      'UPDATE conversaciones SET ultimo_mensaje = ?, ultimo_mensaje_at = NOW() WHERE id = ?',
      [preview, conversacionId]
    );

    res.cookie('chat_token', String(conversacionId), {
      httpOnly: true, sameSite: 'lax', maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    const msg = await get('SELECT * FROM mensajes WHERE id = ?', [result.id]);
    res.status(201).json({
      success: true,
      message: 'Mensaje enviado',
      id: result.id,
      conversacion_id: conversacionId,
      data: msg,
    });
  } catch (err) {
    console.error('[chat] Error:', err.message);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

/* GET /api/chat — Obtener mensajes de la conversación actual */
router.get('/', async (req, res) => {
  const token = req.headers['x-chat-token'] || req.cookies?.chat_token;
  const usuarioId = req.usuario?.id || null;
  let conversacionId = null;

  try {
    if (req.query.conv_id) {
      conversacionId = parseInt(req.query.conv_id);
    } else if (usuarioId) {
      const conv = await get(
        'SELECT id FROM conversaciones WHERE cuenta_id = ? ORDER BY created_at DESC LIMIT 1',
        [usuarioId]
      );
      if (conv) conversacionId = conv.id;
    }

    if (!conversacionId && !usuarioId && token) {
      const conv = await get('SELECT id FROM conversaciones WHERE id = ?', [token]);
      if (conv) conversacionId = conv.id;
    }

    if (!conversacionId) return res.json({ success: true, messages: [] });

    const rows = await query(
      'SELECT id AS mensaje_id, remitente, texto AS texto, leido, created_at, archivo_url, archivo_nombre, archivo_tipo, archivo_tamano FROM mensajes WHERE conversacion_id = ? ORDER BY created_at ASC',
      [conversacionId]
    );

    const messages = rows.map(r => ({
      id: r.mensaje_id,
      texto: r.texto,
      direction: r.remitente === 'admin' ? 'incoming' : 'outgoing',
      tipo: r.remitente,
      leido: !!r.leido,
      created_at: r.created_at,
      archivo_url: r.archivo_url,
      archivo_nombre: r.archivo_nombre,
      archivo_tipo: r.archivo_tipo,
      archivo_tamano: r.archivo_tamano,
    }));

    res.json({ success: true, messages });
  } catch (err) {
    console.error('[chat] Error:', err.message);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

/* ── PATCH /api/chat/:id/leer — marcar mensajes de admin como leídos ── */
router.patch('/:id/leer', async (req, res) => {
  try {
    const usuarioId = req.usuario?.id || null;
    if (!usuarioId) return res.status(401).json({ success: false, message: 'No autorizado' });
    await run('UPDATE mensajes SET leido = 1 WHERE conversacion_id = ? AND remitente = ?', [req.params.id, 'admin']);
    res.json({ success: true });
  } catch (err) {
    console.error('[chat/leer] Error:', err.message);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

/* ── GET /api/chat/conversaciones — lista de chats del usuario ── */
router.get('/conversaciones', async (req, res) => {
  const usuarioId = req.usuario?.id || null;
  if (!usuarioId) return res.json({ success: true, data: [] });
  try {
    const rows = await query(
      `SELECT c.id, c.cliente_nombre AS nombre, c.cliente_apellido AS apellido,
              c.ultimo_mensaje, c.ultimo_mensaje_at, c.estado,
              c.proyecto_id, c.cotizacion_id,
              p.nombre AS proyecto_nombre, p.tipo_proyecto AS proyecto_tipo,
              p.estado AS proyecto_estado, p.presupuesto AS proyecto_presupuesto,
              (SELECT COUNT(*) FROM mensajes WHERE conversacion_id = c.id AND remitente = 'cliente' AND leido = 0) AS unread_count
       FROM conversaciones c
       LEFT JOIN proyectos p ON c.proyecto_id = p.id
       WHERE c.cuenta_id = ? AND (c.estado IS NULL OR c.estado != 'archivada')
       ORDER BY c.ultimo_mensaje_at DESC, c.created_at DESC`,
      [usuarioId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[chat/conversaciones] Error:', err.message);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

module.exports = router;
