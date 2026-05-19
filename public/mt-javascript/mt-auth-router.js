const express = require('express');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { run, get, query } = require('../../database');
const { sendWelcomeEmail } = require('../../mailer');

const router = express.Router();

const JWT_SECRET  = process.env.JWT_SECRET  || 'mt-super-secret-jwt-key-change-in-production-2025';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';
const BCRYPT_ROUNDS = 12;

function signToken(user) {
  return jwt.sign(
    { id: user.id, correo: user.correo, nombre: user.nombre, apellido: user.apellido, rol: user.rol },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

function userResponse(user, token) {
  return {
    id: user.id,
    nombre: user.nombre,
    apellido: user.apellido,
    username: user.username,
    correo: user.correo,
    telefono: user.telefono,
    empresa: user.empresa,
    sitio_web: user.sitio_web,
    biografia: user.biografia,
    rol: user.rol,
    activo: !!user.activo,
    avatar_url: user.avatar_url,
    email_verified: !!user.email_verified,
    telefono_verificado: !!user.telefono_verificado,
    totp_enabled: !!user.totp_enabled,
    last_login: user.last_login,
    created_at: user.created_at,
    provider: user.password_hash === '__GOOGLE_OAUTH__' ? 'google' : 'email',
    token,
  };
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : req.cookies?.mt_token;
  if (!token) return res.status(401).json({ success: false, message: 'Token requerido' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token inválido o expirado' });
  }
}

router.post('/signup', async (req, res) => {
  try {
    const { nombre, apellido, correo, password } = req.body;

    if (!nombre || !correo || !password) {
      return res.status(400).json({ success: false, message: 'Nombre, correo y contraseña son requeridos' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      return res.status(400).json({ success: false, message: 'Correo electrónico inválido', field: 'correo' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 8 caracteres', field: 'password' });
    }

    const existing = await get('SELECT id FROM usuarios WHERE correo = ?', [correo]);
    if (existing) {
      return res.status(409).json({ success: false, message: 'Este correo ya está registrado', field: 'correo' });
    }

    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const { id } = await run(
      `INSERT INTO usuarios (nombre, apellido, correo, password_hash, rol, activo)
       VALUES (?, ?, ?, ?, 'cliente', 1)`,
      [nombre, apellido || '', correo, password_hash]
    );

    const user = await get('SELECT * FROM usuarios WHERE id = ?', [id]);
    const token = signToken(user);

    await run('UPDATE usuarios SET last_login = NOW() WHERE id = ?', [id]);

    const ua0 = (req.headers['user-agent'] || '').slice(0, 300);
    await run('DELETE FROM sesiones WHERE usuario_id = ? AND user_agent = ?', [id, ua0]);
    await run(
      `INSERT INTO sesiones (usuario_id, ip, user_agent, activa, created_at)
       VALUES (?, ?, ?, 1, NOW())`,
      [id, req.ip || '', ua0]
    );

    res.cookie('mt_token', token, {
      httpOnly: false, secure: false, sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, path: '/',
    });

    // Enviar correo de bienvenida (no bloqueante)
    sendWelcomeEmail({ to: correo, nombre });

    res.status(201).json({
      success: true,
      message: 'Cuenta creada exitosamente',
      user: userResponse(user, token),
    });
  } catch (err) {
    console.error('[signup]', err.message);
    res.status(500).json({ success: false, message: 'Error al crear la cuenta' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { correo, password } = req.body;

    if (!correo || !password) {
      return res.status(400).json({ success: false, message: 'Correo y contraseña son requeridos' });
    }

    const user = await get('SELECT * FROM usuarios WHERE correo = ?', [correo]);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Correo o contraseña incorrectos' });
    }

    if (!user.activo) {
      return res.status(403).json({ success: false, message: 'Esta cuenta está desactivada' });
    }

    if (user.password_hash === '__GOOGLE_OAUTH__') {
      return res.status(401).json({
        success: false,
        message: 'Esta cuenta usa Google SSO. Inicia sesión con Google.',
      });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Correo o contraseña incorrectos' });
    }

    if (user.totp_enabled) {
      // Crear token temporal de 5 min para el segundo factor
      const tempToken = jwt.sign(
        { id: user.id, correo: user.correo, nombre: user.nombre, rol: user.rol, purpose: '2fa' },
        JWT_SECRET,
        { expiresIn: '5m' }
      );
      return res.json({
        success: true,
        needs2fa: true,
        message: 'Verifica tu código de dos factores',
        tempToken,
        email: user.correo,
      });
    }

    const token = signToken(user);
    await run('UPDATE usuarios SET last_login = NOW() WHERE id = ?', [user.id]);

    const ua = (req.headers['user-agent'] || '').slice(0, 300);
    await run('DELETE FROM sesiones WHERE usuario_id = ? AND user_agent = ?', [user.id, ua]);
    await run(
      `INSERT INTO sesiones (usuario_id, ip, user_agent, activa, created_at)
       VALUES (?, ?, ?, 1, NOW())`,
      [user.id, req.ip || '', ua]
    );

    res.cookie('mt_token', token, {
      httpOnly: false, secure: false, sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, path: '/',
    });

    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      user: userResponse(user, token),
    });
  } catch (err) {
    console.error('[login]', err.message);
    res.status(500).json({ success: false, message: 'Error al iniciar sesión' });
  }
});

/* ════════════════════════════════════════
   2FA — VERIFICAR EN LOGIN (segundo paso)
   ════════════════════════════════════════ */
router.post('/login/2fa', async (req, res) => {
  try {
    const { tempToken, totpCode } = req.body;
    if (!tempToken || !totpCode) {
      return res.status(400).json({ success: false, message: 'Token temporal y código requeridos' });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'Token inválido o expirado. Vuelve a iniciar sesión.' });
    }

    if (decoded.purpose !== '2fa') {
      return res.status(401).json({ success: false, message: 'Token incorrecto' });
    }

    const user = await get('SELECT * FROM usuarios WHERE id = ?', [decoded.id]);
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    if (!user.totp_enabled || !user.totp_secret) {
      return res.status(400).json({ success: false, message: '2FA no está activado en esta cuenta' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.totp_secret,
      encoding: 'base32',
      token: totpCode,
      window: 1,
    });

    if (!verified) {
      // Intentar como código de recuperación
      const codes = await query('SELECT id, code_hash FROM recovery_codes WHERE usuario_id = ?', [user.id]);
      let rcOk = false;
      for (const row of codes) {
        if (await bcrypt.compare(totpCode.toUpperCase(), row.code_hash)) {
          await run('DELETE FROM recovery_codes WHERE id = ?', [row.id]);
          rcOk = true;
          break;
        }
      }
      if (!rcOk) {
        return res.status(400).json({ success: false, message: 'Código inválido' });
      }
    }

    const token = signToken(user);
    await run('UPDATE usuarios SET last_login = NOW() WHERE id = ?', [user.id]);

    const ua2 = (req.headers['user-agent'] || '').slice(0, 300);
    await run('DELETE FROM sesiones WHERE usuario_id = ? AND user_agent = ?', [user.id, ua2]);
    await run(
      `INSERT INTO sesiones (usuario_id, ip, user_agent, activa, created_at)
       VALUES (?, ?, ?, 1, NOW())`,
      [user.id, req.ip || '', ua2]
    );

    res.cookie('mt_token', token, {
      httpOnly: false, secure: false, sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, path: '/',
    });

    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      user: userResponse(user, token),
    });
  } catch (err) {
    console.error('[login/2fa]', err.message);
    res.status(500).json({ success: false, message: 'Error al verificar 2FA' });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : req.cookies?.mt_token;
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        await run('DELETE FROM refresh_tokens WHERE usuario_id = ?', [decoded.id]);
      } catch {}
    }
    res.clearCookie('mt_token');
    res.json({ success: true, message: 'Sesión cerrada' });
  } catch {
    res.json({ success: true, message: 'Sesión cerrada' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await get('SELECT * FROM usuarios WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const token = signToken(user);
    res.json({ success: true, user: userResponse(user, token) });
  } catch (err) {
    console.error('[me]', err.message);
    res.status(500).json({ success: false, message: 'Error al obtener usuario' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const header = req.headers.authorization;
    const oldToken = header?.startsWith('Bearer ') ? header.slice(7) : req.cookies?.mt_token;
    if (!oldToken) {
      return res.status(401).json({ success: false, message: 'Token requerido' });
    }

    const decoded = jwt.verify(oldToken, JWT_SECRET);
    const user = await get('SELECT * FROM usuarios WHERE id = ?', [decoded.id]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const token = signToken(user);
    res.json({ success: true, user: userResponse(user, token) });
  } catch {
    res.status(401).json({ success: false, message: 'Token inválido o expirado' });
  }
});

router.post('/password', authMiddleware, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: 'La contraseña es requerida' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 8 caracteres' });
    }
    const user = await get('SELECT * FROM usuarios WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    if (user.password_hash !== '__GOOGLE_OAUTH__') {
      return res.status(400).json({ success: false, message: 'Ya tienes una contraseña establecida. Usa "Cambiar contraseña".' });
    }
    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await run('UPDATE usuarios SET password_hash = ? WHERE id = ?', [password_hash, user.id]);
    const updated = await get('SELECT * FROM usuarios WHERE id = ?', [user.id]);
    const token = signToken(updated);
    res.json({ success: true, message: 'Contraseña creada exitosamente', user: userResponse(updated, token) });
  } catch (err) {
    console.error('[password-create]', err.message);
    res.status(500).json({ success: false, message: 'Error al crear la contraseña' });
  }
});

router.patch('/password', authMiddleware, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ success: false, message: 'Contraseña actual y nueva son requeridas' });
    }

    if (new_password.length < 8) {
      return res.status(400).json({ success: false, message: 'La nueva contraseña debe tener al menos 8 caracteres' });
    }

    const user = await get('SELECT * FROM usuarios WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    if (user.password_hash === '__GOOGLE_OAUTH__') {
      return res.status(400).json({ success: false, message: 'Las cuentas de Google no tienen contraseña' });
    }

    const valid = await bcrypt.compare(current_password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Contraseña actual incorrecta' });
    }

    const password_hash = await bcrypt.hash(new_password, BCRYPT_ROUNDS);
    await run('UPDATE usuarios SET password_hash = ? WHERE id = ?', [password_hash, user.id]);
    const updated = await get('SELECT * FROM usuarios WHERE id = ?', [user.id]);
    const token = signToken(updated);
    res.json({ success: true, message: 'Contraseña actualizada exitosamente', user: userResponse(updated, token) });
  } catch (err) {
    console.error('[password]', err.message);
    res.status(500).json({ success: false, message: 'Error al actualizar la contraseña' });
  }
});

/* ════════════════════════════════════════
   PERFIL — Actualizar datos personales
   ════════════════════════════════════════ */
router.patch('/me', authMiddleware, async (req, res) => {
  try {
    const allowed = ['nombre','apellido','username','telefono','empresa','sitio_web','biografia'];
    const updates = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No hay campos para actualizar' });
    }
    const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    const values = Object.values(updates);
    await run(`UPDATE usuarios SET ${setClauses} WHERE id = ?`, [...values, req.user.id]);
    const user = await get('SELECT * FROM usuarios WHERE id = ?', [req.user.id]);
    const token = signToken(user);
    res.json({ success: true, message: 'Perfil actualizado', user: userResponse(user, token) });
  } catch (err) {
    console.error('[patch /me]', err.message);
    res.status(500).json({ success: false, message: 'Error al actualizar perfil' });
  }
});

/* ════════════════════════════════════════
   AVATAR — Actualizar foto (base64)
   ════════════════════════════════════════ */
router.patch('/avatar', authMiddleware, async (req, res) => {
  try {
    const { avatar_url } = req.body;
    if (avatar_url === undefined) {
      return res.status(400).json({ success: false, message: 'avatar_url requerido' });
    }
    await run('UPDATE usuarios SET avatar_url = ? WHERE id = ?', [avatar_url || null, req.user.id]);
    const user = await get('SELECT * FROM usuarios WHERE id = ?', [req.user.id]);
    const token = signToken(user);
    res.json({ success: true, message: 'Avatar actualizado', user: userResponse(user, token) });
  } catch (err) {
    console.error('[patch /avatar]', err.message);
    res.status(500).json({ success: false, message: 'Error al actualizar avatar' });
  }
});

/* ════════════════════════════════════════
   SESIONES — Listar
   ════════════════════════════════════════ */
router.get('/sesiones', authMiddleware, async (req, res) => {
  try {
    const currentUA = (req.headers['user-agent'] || '').slice(0, 300);
    const currentIP = req.ip || req.socket?.remoteAddress || '';
    // Cleanup: borrar inactivas y dejar solo la última por dispositivo
    await run('DELETE FROM sesiones WHERE usuario_id = ? AND activa = 0', [req.user.id]);
    await run(
      `DELETE s FROM sesiones s
       INNER JOIN sesiones s2 ON s.usuario_id = s2.usuario_id AND s.user_agent = s2.user_agent AND s.id < s2.id
       WHERE s.usuario_id = ?`,
      [req.user.id]
    );

    const rows = await query(
      'SELECT id, ip, user_agent, activa, created_at, expires_at FROM sesiones WHERE usuario_id = ? AND activa = 1 ORDER BY created_at DESC',
      [req.user.id]
    );
    const data = rows.map(s => ({
      ...s,
      es_actual: s.ip === currentIP && s.user_agent === currentUA ? 1 : 0,
    }));
    res.json({ success: true, data });
  } catch (err) {
    console.error('[get /sesiones]', err.message);
    res.status(500).json({ success: false, message: 'Error al obtener sesiones' });
  }
});

/* ════════════════════════════════════════
   SESIONES — Cerrar una
   ════════════════════════════════════════ */
router.delete('/sesiones/:id', authMiddleware, async (req, res) => {
  try {
    const sesion = await get('SELECT * FROM sesiones WHERE id = ? AND usuario_id = ?', [req.params.id, req.user.id]);
    if (!sesion) {
      return res.status(404).json({ success: false, message: 'Sesión no encontrada' });
    }
    await run('DELETE FROM sesiones WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Sesión cerrada' });
  } catch (err) {
    console.error('[delete /sesiones/:id]', err.message);
    res.status(500).json({ success: false, message: 'Error al cerrar sesión' });
  }
});

/* ════════════════════════════════════════
   SESIONES — Cerrar todas excepto actual
   ════════════════════════════════════════ */
router.delete('/sesiones', authMiddleware, async (req, res) => {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : req.cookies?.mt_token;
    // Buscar la sesión actual por el user_agent / ip
    const currentUA = (req.headers['user-agent'] || '').slice(0, 300);
    const currentIP = req.ip || req.socket?.remoteAddress || '';
    // Eliminar todas las demás
    await run(
      'DELETE FROM sesiones WHERE usuario_id = ? AND (user_agent != ? OR ip != ?)',
      [req.user.id, currentUA, currentIP]
    );
    // Si no hay sesiones registradas, no pasa nada
    res.json({ success: true, message: 'Sesiones remotas cerradas' });
  } catch (err) {
    console.error('[delete /sesiones]', err.message);
    res.status(500).json({ success: false, message: 'Error al cerrar sesiones' });
  }
});

/* ════════════════════════════════════════
   PREFERENCIAS — Obtener
   ════════════════════════════════════════ */
router.get('/preferencias', authMiddleware, async (req, res) => {
  try {
    let prefs = await get('SELECT * FROM preferencias_usuario WHERE usuario_id = ?', [req.user.id]);
    if (!prefs) {
      // Crear por defecto
      const { id } = await run(
        `INSERT INTO preferencias_usuario (usuario_id) VALUES (?)`, [req.user.id]
      );
      prefs = await get('SELECT * FROM preferencias_usuario WHERE id = ?', [id]);
    }
    res.json({ success: true, data: prefs });
  } catch (err) {
    console.error('[get /preferencias]', err.message);
    res.status(500).json({ success: false, message: 'Error al obtener preferencias' });
  }
});

/* ════════════════════════════════════════
   PREFERENCIAS — Actualizar
   ════════════════════════════════════════ */
router.patch('/preferencias', authMiddleware, async (req, res) => {
  try {
    const allowed = [
      'push_notif','email_notif','whatsapp_notif',
      'idioma','zona_horaria','formato_fecha','formato_hora','moneda',
      'reducir_movimiento','alto_contraste','texto_size','tema_pref'
    ];
    const updates = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No hay campos para actualizar' });
    }
    // Upsert
    const existing = await get('SELECT id FROM preferencias_usuario WHERE usuario_id = ?', [req.user.id]);
    if (existing) {
      const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
      const values = Object.values(updates);
      await run(`UPDATE preferencias_usuario SET ${setClauses} WHERE usuario_id = ?`, [...values, req.user.id]);
    } else {
      const fields = Object.keys(updates);
      const placeholders = fields.map(() => '?').join(', ');
      await run(
        `INSERT INTO preferencias_usuario (usuario_id, ${fields.join(', ')}) VALUES (?, ${placeholders})`,
        [req.user.id, ...Object.values(updates)]
      );
    }
    const prefs = await get('SELECT * FROM preferencias_usuario WHERE usuario_id = ?', [req.user.id]);
    res.json({ success: true, message: 'Preferencias actualizadas', data: prefs });
  } catch (err) {
    console.error('[patch /preferencias]', err.message);
    res.status(500).json({ success: false, message: 'Error al actualizar preferencias' });
  }
});

/* ════════════════════════════════════════
   EXPORTAR — Descargar datos del usuario
   ════════════════════════════════════════ */
router.get('/export', authMiddleware, async (req, res) => {
  try {
    const user = await get('SELECT * FROM usuarios WHERE id = ?', [req.user.id]);
    const prefs = await get('SELECT * FROM preferencias_usuario WHERE usuario_id = ?', [req.user.id]);
    const sessions = await query('SELECT id, ip, user_agent, activa, created_at FROM sesiones WHERE usuario_id = ?', [req.user.id]);
    res.json({
      success: true,
      data: {
        usuario: userResponse(user, null),
        preferencias: prefs,
        sesiones: sessions,
      }
    });
  } catch (err) {
    console.error('[get /export]', err.message);
    res.status(500).json({ success: false, message: 'Error al exportar datos' });
  }
});

/* ════════════════════════════════════════
   ELIMINAR CUENTA
   ════════════════════════════════════════ */
router.delete('/me', authMiddleware, async (req, res) => {
  try {
    // Verificar contraseña si no es Google
    const user = await get('SELECT * FROM usuarios WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    if (user.password_hash !== '__GOOGLE_OAUTH__') {
      const { password } = req.body;
      if (!password) {
        return res.status(400).json({ success: false, message: 'Contraseña requerida para eliminar cuenta' });
      }
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
      }
    }
    await run('DELETE FROM usuarios WHERE id = ?', [req.user.id]);
    res.clearCookie('mt_token');
    res.json({ success: true, message: 'Cuenta eliminada permanentemente' });
  } catch (err) {
    console.error('[delete /me]', err.message);
    res.status(500).json({ success: false, message: 'Error al eliminar cuenta' });
  }
});

/* ════════════════════════════════════════
   2FA — SETUP (generar secreto + QR)
   ════════════════════════════════════════ */
router.post('/2fa/setup', authMiddleware, async (req, res) => {
  try {
    const user = await get('SELECT * FROM usuarios WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

    const secret = speakeasy.generateSecret({
      name: `Multitech (${user.correo})`,
      issuer: 'Multitech',
    });

    // Guardar el secreto temporalmente (aún no activado)
    await run('UPDATE usuarios SET totp_secret = ? WHERE id = ?', [secret.base32, user.id]);

    const qrDataUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.json({
      success: true,
      secret: secret.base32,
      qr: qrDataUrl,
    });
  } catch (err) {
    console.error('[2fa setup]', err.message);
    res.status(500).json({ success: false, message: 'Error al generar 2FA' });
  }
});

/* ════════════════════════════════════════
   2FA — VERIFICAR y activar
   ════════════════════════════════════════ */
router.post('/2fa/verify', authMiddleware, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Código TOTP requerido' });

    const user = await get('SELECT * FROM usuarios WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    if (!user.totp_secret) return res.status(400).json({ success: false, message: 'Primero genera el setup de 2FA' });

    const verified = speakeasy.totp.verify({
      secret: user.totp_secret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!verified) return res.status(400).json({ success: false, message: 'Código inválido' });

    await run('UPDATE usuarios SET totp_enabled = 1 WHERE id = ?', [user.id]);

    // Generar recovery codes automáticamente
    const codes = [];
    const recoveryHashes = [];
    for (let i = 0; i < 8; i++) {
      const code = require('crypto').randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
      const hash = await bcrypt.hash(code, 8);
      recoveryHashes.push(hash);
    }

    // Borrar códigos anteriores
    await run('DELETE FROM recovery_codes WHERE usuario_id = ?', [user.id]);
    for (const hash of recoveryHashes) {
      await run('INSERT INTO recovery_codes (usuario_id, code_hash) VALUES (?, ?)', [user.id, hash]);
    }

    const updated = await get('SELECT * FROM usuarios WHERE id = ?', [user.id]);
    const tokenJwt = signToken(updated);

    res.json({
      success: true,
      message: '2FA activado correctamente',
      recovery_codes: codes,
      user: userResponse(updated, tokenJwt),
    });
  } catch (err) {
    console.error('[2fa verify]', err.message);
    res.status(500).json({ success: false, message: 'Error al verificar 2FA' });
  }
});

/* ════════════════════════════════════════
   2FA — DESACTIVAR
   ════════════════════════════════════════ */
router.post('/2fa/disable', authMiddleware, async (req, res) => {
  try {
    const { password, recovery_code } = req.body;
    const user = await get('SELECT * FROM usuarios WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

    if (user.password_hash !== '__GOOGLE_OAUTH__') {
      if (!password && !recovery_code) {
        return res.status(400).json({ success: false, message: 'Contraseña o código de recuperación requerido' });
      }
      if (password) {
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
      }
    }

    await run('UPDATE usuarios SET totp_enabled = 0, totp_secret = NULL WHERE id = ?', [user.id]);
    await run('DELETE FROM recovery_codes WHERE usuario_id = ?', [user.id]);

    const updated = await get('SELECT * FROM usuarios WHERE id = ?', [user.id]);
    const tokenJwt = signToken(updated);

    res.json({
      success: true,
      message: '2FA desactivado',
      user: userResponse(updated, tokenJwt),
    });
  } catch (err) {
    console.error('[2fa disable]', err.message);
    res.status(500).json({ success: false, message: 'Error al desactivar 2FA' });
  }
});

/* ════════════════════════════════════════
   2FA — GENERAR NUEVOS RECOVERY CODES
   ════════════════════════════════════════ */
router.post('/2fa/recovery-codes', authMiddleware, async (req, res) => {
  try {
    const user = await get('SELECT * FROM usuarios WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    if (!user.totp_enabled) return res.status(400).json({ success: false, message: '2FA no está activado' });

    const codes = [];
    const recoveryHashes = [];
    for (let i = 0; i < 8; i++) {
      const code = require('crypto').randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
      const hash = await bcrypt.hash(code, 8);
      recoveryHashes.push(hash);
    }

    await run('DELETE FROM recovery_codes WHERE usuario_id = ?', [user.id]);
    for (const hash of recoveryHashes) {
      await run('INSERT INTO recovery_codes (usuario_id, code_hash) VALUES (?, ?)', [user.id, hash]);
    }

    res.json({ success: true, message: 'Códigos generados', recovery_codes: codes });
  } catch (err) {
    console.error('[2fa recovery-codes]', err.message);
    res.status(500).json({ success: false, message: 'Error al generar códigos' });
  }
});

module.exports = router;
