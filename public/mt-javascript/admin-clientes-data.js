const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001' : window.location.origin;
const API_H = {'Content-Type':'application/json','X-Admin-Key':ADMIN_KEY};

async function loadClientes() {
  try {
    const r = await fetch(API_BASE+'/api/clientes?limit=200', {headers:API_H});
    const j = await r.json();
    if (j.success) CLIENTES = j.data.map(c=>({
      id:c.id, nombre:c.nombre||'', apellido:c.apellido||'', empresa:c.empresa||'',
      email:c.email||'', tel:c.telefono||'', sector:c.sector||'', servicio:c.servicio||'',
      valor:parseFloat(c.valor_total)||0, proyectos:c.proyectos_count||0,
      estado:c.estado||'activo', vip:!!c.vip, ultimoContacto:c.ultimo_contacto||'',
      color:c.color||'#7a5c3a', notas:c.notas||''
    }));
    return CLIENTES;
  } catch(e) { return []; }
}

async function apiCliente(method, id, body) {
  const url = id ? API_BASE+'/api/clientes/'+id : API_BASE+'/api/clientes';
  const r = await fetch(url, {method, headers:API_H, body:body?JSON.stringify(body):undefined});
  return r.json();
}

async function cambiarEstadoAPI(id, estado, btn) {
  const old = CLIENTES.find(c=>c.id===id);
  if (!old) return;
  const oldEstado = old.estado;
  old.estado = estado;
  document.querySelectorAll('#modalBox .status-btn').forEach(b=>b.classList.remove('btn-primary'));
  if (btn) btn.classList.add('btn-primary');
  const res = await apiCliente('PATCH', id, {estado});
  if (!res.success) { old.estado = oldEstado; showToast({icon:'error',bg:'var(--red-bg)',tc:'var(--red-txt)',title:'Error',msg:'No se pudo actualizar el estado'}); return; }
  renderTabla(); renderSidebar(); showToast({icon:'check_circle',bg:'var(--green-bg)',tc:'var(--green-txt)',title:'Estado actualizado',msg:'Cliente movido a '+estado});
}

async function toggleVipAPI(id, btn) {
  const c = CLIENTES.find(x=>x.id===id);
  if(!c) return;
  const oldVip = c.vip; c.vip = !c.vip;
  btn.textContent = c.vip ? 'Quitar VIP' : 'Mark VIP';
  const res = await apiCliente('PATCH', id, {vip:c.vip});
  if (!res.success) { c.vip = oldVip; btn.textContent = c.vip ? 'Quitar VIP' : 'Mark VIP'; showToast({icon:'error',bg:'var(--red-bg)',tc:'var(--red-txt)',title:'Error',msg:'No se pudo actualizar'}); return; }
  renderTabla(); renderSidebar(); showToast({icon:'workspace_premium',bg:'var(--amber-bg)',tc:'var(--amber-txt)',title:'VIP actualizado',msg:c.vip?'Marcado como VIP':'VIP removido'});
}

async function guardarNotasAPI(id) {
  const notas = document.getElementById('notasField').value;
  const res = await apiCliente('PATCH', id, {notas});
  if (res.success) { const c=CLIENTES.find(x=>x.id===id); if(c)c.notas=notas; showToast({icon:'note',bg:'var(--accent-bg)',tc:'var(--accent)',title:'Notas guardadas',msg:'Notas internas actualizadas'}); }
  else showToast({icon:'error',bg:'var(--red-bg)',tc:'var(--red-txt)',title:'Error',msg:'No se pudieron guardar las notas'});
}

async function eliminarClienteAPI(id) {
  if (!confirm('¿Eliminar este cliente permanentemente?')) return;
  const res = await apiCliente('DELETE', id);
  if (res.success) {
    CLIENTES = CLIENTES.filter(x=>x.id!==id);
    closeModal(); renderTabla(); renderSidebar();
    showToast({icon:'delete',bg:'var(--red-bg)',tc:'var(--red-txt)',title:'Cliente eliminado',msg:'El cliente fue eliminado permanentemente'});
  } else showToast({icon:'error',bg:'var(--red-bg)',tc:'var(--red-txt)',title:'Error',msg:'No se pudo eliminar el cliente'});
}

async function guardarNuevoClienteAPI() {
  const fields = {nombre:document.getElementById('fn_nombre').value.trim(),apellido:document.getElementById('fn_apellido').value.trim(),empresa:document.getElementById('fn_empresa').value.trim(),email:document.getElementById('fn_email').value.trim(),telefono:document.getElementById('fn_tel').value.trim(),sector:document.getElementById('fn_sector').value,servicio:document.getElementById('fn_servicio').value,estado:document.getElementById('fn_estado').value,notas:document.getElementById('fn_notas').value.trim()};
  if (!fields.nombre||!fields.empresa||!fields.email) { showToast({icon:'warning',bg:'var(--amber-bg)',tc:'var(--amber-txt)',title:'Campos requeridos',msg:'Nombre, empresa y email son obligatorios'}); return; }
  const res = await apiCliente('POST', null, fields);
  if (res.success) {
    const c = {id:res.id,...fields,tel:fields.telefono,valor:0,proyectos:0,vip:false,ultimoContacto:new Date().toISOString().slice(0,10),color:['#7a5c3a','#1a3d72','#165c2e','#6b3d08','#3d6030','#7f1d1d'][Math.floor(Math.random()*6)]};
    CLIENTES.push(c);
    ['fn_nombre','fn_apellido','fn_empresa','fn_email','fn_tel','fn_notas'].forEach(id=>document.getElementById(id).value='');
    document.getElementById('fn_sector').value='Tecnologia'; document.getElementById('fn_estado').value='activo'; document.getElementById('fn_servicio').value='Landing Page';
    closeNuevo(); renderTabla(); renderSidebar();
    showToast({icon:'person_add',bg:'var(--green-bg)',tc:'var(--green-txt)',title:'Cliente registrado',msg:fields.nombre+' '+fields.apellido+' agregado correctamente'});
  } else showToast({icon:'error',bg:'var(--red-bg)',tc:'var(--red-txt)',title:'Error',msg:'No se pudo crear el cliente'});
}

async function exportarClientesAPI() {
  showToast({icon:'download',bg:'var(--accent-bg)',tc:'var(--accent)',title:'Exportando…',msg:'Preparando CSV de clientes'});
  try {
    const r = await fetch(API_BASE+'/api/admin/export/clientes', {headers:API_H});
    const j = await r.json();
    if (j.success) {
      const headers = Object.keys(j.data[0]||{}).join(',');
      const rows = j.data.map(r=>Object.values(r).map(v=>'"'+(v||'')+'"').join(',')).join('\n');
      const blob = new Blob(['\uFEFF'+headers+'\n'+rows], {type:'text/csv;charset=utf-8;'});
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'clientes_export.csv'; a.click();
      showToast({icon:'download_done',bg:'var(--green-bg)',tc:'var(--green-txt)',title:'Exportado',msg:'CSV descargado'});
    }
  } catch(e) { showToast({icon:'error',bg:'var(--red-bg)',tc:'var(--red-txt)',title:'Error',msg:'No se pudo exportar'}); }
}
