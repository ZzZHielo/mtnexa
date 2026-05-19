/**
 * Multitech — Activity Logger (MySQL)
 */
const { run } = require('../../database');

async function logActivity(tipo, ref_id, req, payload = {}) {
  try {
    const ip         = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';
    const user_agent = (req.headers['user-agent'] || '').slice(0, 290);
    await run(
      `INSERT INTO activity_log (tipo, ref_id, ip, user_agent, payload)
       VALUES (?, ?, ?, ?, ?)`,
      [tipo, ref_id || null, ip, user_agent, JSON.stringify(payload)]
    );
  } catch (e) {
    console.warn('[logger] No se pudo registrar actividad:', e.message);
  }
}

module.exports = { logActivity };
