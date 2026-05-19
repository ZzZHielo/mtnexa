const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001' : '';
const API_H = {'Content-Type':'application/json','X-Admin-Key':ADMIN_KEY};

async function loadConversaciones() {
  try {
    const r = await fetch(API_BASE+'/api/conversaciones?limit=200', {headers:API_H});
    const j = await r.json();
    if (j.success) {
      CONVERSACIONES = j.data.map(c=>({
        id:c.id, nombre:c.cliente_nombre||'', apellido:c.cliente_apellido||'',
        empresa:c.empresa||'', servicio:c.servicio||'',
        estado:c.estado==='activa'?'abiertos':'cerrados',
        color:c.color||'#7a5c3a',
        ultimoMensaje:c.ultimo_mensaje||'',
        ultimoMensajeAt:c.ultimo_mensaje_at||c.created_at||''
      }));
      MENSAJES = {};
      return CONVERSACIONES;
    }
  } catch(e) {}
  return [];
}

async function fetchMensajes(convId) {
  try {
    const r = await fetch(API_BASE+'/api/conversaciones/'+convId+'/mensajes', {headers:API_H});
    const j = await r.json();
    if (j.success) {
      MENSAJES[convId] = j.data.map(m=>({
        from:m.remitente==='admin'?'admin':'client',
        text:m.texto||'', time:m.created_at||''
      }));
      return MENSAJES[convId];
    }
  } catch(e) {}
  MENSAJES[convId] = [];
  return [];
}

async function sendMensajeAPI(convId, texto) {
  try {
    const r = await fetch(API_BASE+'/api/conversaciones/'+convId+'/mensajes', {method:'POST',headers:API_H,body:JSON.stringify({texto,remitente:'admin'})});
    const j = await r.json();
    if (j.success) {
      if (!MENSAJES[convId]) MENSAJES[convId] = [];
      MENSAJES[convId].push({from:'admin',text:texto,time:new Date().toISOString()});
      const c = CONVERSACIONES.find(x=>x.id===convId);
      if (c) { c.ultimoMensaje = texto; c.ultimoMensajeAt = new Date().toISOString(); }
      return true;
    }
  } catch(e) {}
  return false;
}

async function archivarConversacionAPI(convId) {
  try {
    const r = await fetch(API_BASE+'/api/conversaciones/'+convId, {method:'PATCH',headers:API_H,body:JSON.stringify({estado:'archivada'})});
    const j = await r.json();
    if (j.success) {
      const c = CONVERSACIONES.find(x=>x.id===convId);
      if (c) c.estado = 'archivada';
      return true;
    }
  } catch(e) {}
  return false;
}

async function crearConversacionAPI(data) {
  try {
    const r = await fetch(API_BASE+'/api/conversaciones', {method:'POST',headers:API_H,body:JSON.stringify(data)});
    const j = await r.json();
    if (j.success) {
      const c = {id:j.id, nombre:data.cliente_nombre||'', apellido:data.cliente_apellido||'', empresa:data.empresa||'', servicio:data.servicio||'', estado:'abiertos', color:'#7a5c3a', ultimoMensaje:'', ultimoMensajeAt:new Date().toISOString()};
      CONVERSACIONES.push(c);
      return c;
    }
  } catch(e) {}
  return null;
}
