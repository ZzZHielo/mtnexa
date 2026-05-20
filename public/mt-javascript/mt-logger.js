/**
 * Multitech — Activity Logger (MySQL)
 */
const { run, get } = require('../../database');

function descNotif(tipo, payload) {
  const map = {
    cotizacion:    'Nueva cotización recibida',
    consulta:      'Nueva consulta recibida',
    proyecto:      'Proyecto actualizado',
    lead:          'Nuevo lead registrado',
    conversacion:  'Nueva conversación iniciada',
    transaccion:   'Nueva transacción registrada',
    cliente:       'Nuevo cliente registrado',
    mensaje:       'Nuevo mensaje recibido',
  };
  return map[tipo] || `Actividad: ${tipo}`;
}

async function logActivity(tipo, ref_id, req, payload = {}) {
  try {
    const ip         = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';
    const user_agent = (req.headers['user-agent'] || '').slice(0, 290);
    await run(
      `INSERT INTO activity_log (tipo, ref_id, ip, user_agent, payload)
       VALUES (?, ?, ?, ?, ?)`,
      [tipo, ref_id || null, ip, user_agent, JSON.stringify(payload)]
    );
    const titulo = descNotif(tipo, payload);
    const refTipo = tipo;
    const refVal  = ref_id || null;
    const msg = payload?.correo || payload?.empresa || payload?.tipo_proyecto || '';
    await run(
      `INSERT INTO notificaciones (tipo, titulo, mensaje, ref_tipo, ref_id)
       VALUES (?, ?, ?, ?, ?)`,
      [tipo, titulo, msg, refTipo, refVal]
    );
  } catch (e) {
    console.warn('[logger] No se pudo registrar actividad:', e.message);
  }
}

module.exports = { logActivity };
