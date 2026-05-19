/**
 * ════════════════════════════════════════════════════
 *   Multitech — Google OAuth 2.0 Backend Routes
 *   Usa flujo de redirect (no popup) para compatibilidad
 *   con navegadores modernos.
 * ════════════════════════════════════════════════════
 */

const express = require('express');
const https   = require('https');
const { run, get } = require('../../database');
const jwt = require('jsonwebtoken');

const router = express.Router();

const GOOGLE_CLIENT_ID     = process.env.GOOGLE_CLIENT_ID     || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI  = process.env.GOOGLE_REDIRECT_URI  ||
  'http://localhost:3001/api/auth/google/callback';

const JWT_SECRET  = process.env.JWT_SECRET  || 'mt-super-secret-jwt-key-change-in-production-2025';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(e); } });
    }).on('error', reject);
  });
}

function httpsPost(url, postData) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(e); } });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function redirectErrorHtml(message) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Error</title></head>
<body>
<script>
  alert('${message.replace(/'/g, "\\'")}');
  window.location.href = '/mt-login.html';
<\/script>
</body>
</html>`;
}

/* ══════════════════════════════════════
   GET /api/auth/google/callback
   ══════════════════════════════════════ */
router.get('/google/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.send(redirectErrorHtml('Error de autenticación con Google: ' + error));
  }

  if (!code) {
    return res.send(redirectErrorHtml('No se recibió código de autorización'));
  }

  try {
    const tokenData = await httpsPost(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        code,
        client_id:     GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri:  GOOGLE_REDIRECT_URI,
        grant_type:    'authorization_code',
      }).toString()
    );

    if (tokenData.error) {
      return res.send(redirectErrorHtml(tokenData.error_description || tokenData.error));
    }

    const googleUser = await httpsGet(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenData.access_token}`
    );

    if (!googleUser.email) {
      return res.send(redirectErrorHtml('No se pudo obtener el correo de Google'));
    }

    const { email, given_name, family_name, picture } = googleUser;

    let usuario = await get('SELECT * FROM usuarios WHERE correo = ?', [email]);

    if (!usuario) {
      const { id } = await run(
        `INSERT INTO usuarios (nombre, apellido, correo, password_hash, rol, activo, avatar_url)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          given_name  || email.split('@')[0],
          family_name || '',
          email,
          '__GOOGLE_OAUTH__',
          'cliente',
          1,
          picture || null,
        ]
      );
      usuario = await get('SELECT * FROM usuarios WHERE id = ?', [id]);
    } else if (!usuario.activo) {
      return res.send(redirectErrorHtml('Esta cuenta está desactivada'));
    } else {
      if (picture && picture !== usuario.avatar_url) {
        await run('UPDATE usuarios SET avatar_url = ? WHERE id = ?', [picture, usuario.id]);
        usuario.avatar_url = picture;
      }
    }

    const payload = {
      id:       usuario.id,
      correo:   usuario.correo,
      nombre:   usuario.nombre,
      apellido: usuario.apellido,
      rol:      usuario.rol,
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    await run('UPDATE usuarios SET last_login = NOW() WHERE id = ?', [usuario.id]);

    const ua = (req.headers['user-agent'] || '').slice(0, 300);
    await run('DELETE FROM sesiones WHERE usuario_id = ? AND user_agent = ?', [usuario.id, ua]);
    await run(
      `INSERT INTO sesiones (usuario_id, ip, user_agent, activa, created_at)
       VALUES (?, ?, ?, 1, NOW())`,
      [usuario.id, req.ip || '', ua]
    );

    // Establecer cookie con el token y redirigir al frontend
    res.cookie('mt_token', token, {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    // Redirigir a la página que el usuario estaba visitando (o al inicio)
    const redirectTo = state && state.startsWith('/') ? state : '/index.html';
    res.redirect(redirectTo);

  } catch (err) {
    console.error('[Google OAuth] Error:', err.message);
    res.send(redirectErrorHtml('Error interno al autenticar con Google'));
  }
});

/* ══════════════════════════════════════
   GET /api/auth/google/url
   ══════════════════════════════════════ */
router.get('/google/url', (req, res) => {
  const state = req.query.state || '/index.html';
  const url = `https://accounts.google.com/o/oauth2/v2/auth` +
    `?client_id=${GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent('openid email profile')}` +
    `&state=${encodeURIComponent(state)}` +
    `&prompt=select_account`;

  res.json({ success: true, url });
});

module.exports = router;
