/**
 * Multitech — Rutas: Temas + Suscriptores (MySQL)
 *
 * POST  /api/temas                   → guardar preferencia { session_id, tema, pagina? }
 * GET   /api/temas/:sessionId        → obtener tema guardado
 * POST  /api/temas/suscriptores      → suscribirse { correo }
 * GET   /api/temas/suscriptores      → listar suscriptores (admin)
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { run, get, query } = require('../../database');
const { logActivity }     = require('./mt-logger');

const router = express.Router();

const TEMAS_VALIDOS = ['beige', 'dark', 'blanc', 'slate', 'sage'];

/* ════════════════════════════════
   TEMAS
   ════════════════════════════════ */

/* POST /api/temas */
router.post(
  '/',
  [
    body('session_id').trim().notEmpty().withMessage('session_id requerido'),
    body('tema').isIn(TEMAS_VALIDOS).withMessage('Tema inválido'),
    body('pagina').optional().isString().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(422).json({ success: false, errors: errors.array() });

    const { session_id, tema, pagina = '' } = req.body;

    try {
      // INSERT ... ON DUPLICATE KEY UPDATE → upsert por session_id UNIQUE
      await run(
        `INSERT INTO preferencias_tema (session_id, tema, pagina)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE tema = VALUES(tema), pagina = VALUES(pagina)`,
        [session_id, tema, pagina]
      );
      res.json({ success: true, tema });
    } catch (err) {
      console.error('[temas POST] Error:', err.message);
      res.status(500).json({ success: false, message: 'Error interno' });
    }
  }
);

/* GET /api/temas/:sessionId */
router.get('/:sessionId', async (req, res) => {
  try {
    const row = await get(
      'SELECT tema, pagina, updated_at FROM preferencias_tema WHERE session_id = ?',
      [req.params.sessionId]
    );
    // Si no existe, devolver tema default silenciosamente
    res.json({ success: true, tema: row?.tema || 'beige', pagina: row?.pagina || '', updated_at: row?.updated_at || null });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

/* ════════════════════════════════
   SUSCRIPTORES
   ════════════════════════════════ */

/* POST /api/temas/suscriptores */
router.post(
  '/suscriptores',
  [body('correo').isEmail().normalizeEmail().withMessage('Correo inválido')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(422).json({ success: false, errors: errors.array() });

    const { correo } = req.body;

    try {
      const existing = await get('SELECT id, activo FROM suscriptores WHERE correo = ?', [correo]);

      if (existing) {
        if (existing.activo) {
          return res.json({ success: true, message: 'Ya estás suscrito.' });
        }
        await run('UPDATE suscriptores SET activo = 1 WHERE correo = ?', [correo]);
        return res.json({ success: true, message: 'Suscripción reactivada.' });
      }

      const { id } = await run(
        'INSERT INTO suscriptores (correo) VALUES (?)',
        [correo]
      );

      logActivity('suscriptor', id, req, { correo });
      res.status(201).json({ success: true, message: '¡Suscrito con éxito!' });
    } catch (err) {
      console.error('[suscriptores POST] Error:', err.message);
      res.status(500).json({ success: false, message: 'Error interno' });
    }
  }
);

/* GET /api/temas/suscriptores */
router.get('/suscriptores', async (req, res) => {
  try {
    const rows = await query(
      'SELECT id, correo, activo, created_at FROM suscriptores ORDER BY created_at DESC'
    );
    res.json({ success: true, total: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

module.exports = router;
