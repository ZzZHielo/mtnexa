/* ══ admin-shared.js — Multitech Admin ══ */

const API = 'http://localhost:3001/api';
const ADMIN_KEY = 'multitech-admin-2025';
const H = {'Content-Type':'application/json','X-Admin-Key':ADMIN_KEY};

/* ── State ── */
window.D = {cotizaciones:[],consultas:[],plantillas:[],suscriptores:[],proyectos:[]};

/* ── API ── */
async function apiFetch(url, opts = {}) {
  try {
    const r = await fetch(API + url, {headers: H, ...opts});
    if (!r.ok) throw new Error(r.statusText);
    return r.json();
  } catch { return null; }
}

async function loadAll() {
  const [cots, cons, plants, subs, proys] = await Promise.all([
    apiFetch('/cotizaciones?limit=200'),
    apiFetch('/consultas?limit=200'),
    apiFetch('/plantillas/solicitudes?limit=200'),
    apiFetch('/temas/suscriptores'),
    apiFetch('/proyectos?limit=200'),
  ]);
  if (cots?.data)   D.cotizaciones = cots.data;
  if (cons?.data)   D.consultas    = cons.data;
  if (plants?.data) D.plantillas   = plants.data;
  if (subs?.data)   D.suscriptores = subs.data;
  if (proys?.data)  D.proyectos    = proys.data;
  if (!cots && !cons) loadDemo();
  if (typeof onDataLoaded === 'function') onDataLoaded();
}

function loadDemo() {
  D.cotizaciones = [
    {id:1,nombre:'Carlos',apellido:'Peña',correo:'carlos@gmail.com',whatsapp:'+18095551234',tipo_proyecto:'E-Commerce',presupuesto:'$1,000–$3,000 USD',descripcion:'Tienda para vender ropa dominicana',documento_url:'https://drive.google.com/file/d/ejemplo1/view',estado:'pendiente',created_at:'2025-04-25T10:30:00Z'},
    {id:2,nombre:'Ana',apellido:'Díaz',correo:'ana@empresa.com',whatsapp:'+18099876543',tipo_proyecto:'Página Web',presupuesto:'$500–$1,000 USD',descripcion:'Página corporativa para mi consultora',documento_url:'',estado:'enviada',created_at:'2025-04-24T15:00:00Z'},
    {id:3,nombre:'Luis',apellido:'García',correo:'luis@tech.com',whatsapp:'+18091112222',tipo_proyecto:'App Móvil',presupuesto:'$3,000–$10,000 USD',descripcion:'App de delivery para restaurante',documento_url:'',estado:'pagada',created_at:'2025-04-23T09:00:00Z'},
    {id:4,nombre:'María',apellido:'Santos',correo:'maria@cafe.com',whatsapp:'+18093334444',tipo_proyecto:'Sistema a Medida',presupuesto:'Más de $10,000 USD',descripcion:'CRM para gestión de clientes',documento_url:'https://drive.google.com/file/d/ejemplo2/view',estado:'pagada',created_at:'2025-04-22T14:00:00Z'},
    {id:5,nombre:'Pedro',apellido:'López',correo:'pedro@moda.com',whatsapp:'+18095556666',tipo_proyecto:'E-Commerce',presupuesto:'$1,000–$3,000 USD',descripcion:'Tienda de ropa online',documento_url:'',estado:'pendiente',created_at:'2025-04-26T08:00:00Z'},
  ];
  D.consultas = [
    {id:1,nombre:'Sofía',correo:'sofia@gmail.com',asunto:'¿Trabajan con Shopify?',mensaje:'Hola, quería saber si pueden integrar Shopify con mi sistema.',estado:'nueva',created_at:'2025-04-25T11:00:00Z'},
    {id:2,nombre:'Roberto',correo:'roberto@empresa.com',asunto:'Tiempos de entrega',mensaje:'¿Cuánto tiempo tardan en una web completa con CMS?',estado:'leída',created_at:'2025-04-24T16:00:00Z'},
    {id:3,nombre:'Elena',correo:'elena@clinica.com',asunto:'Sistema para clínica',mensaje:'Necesito un sistema de citas médicas. ¿Tienen experiencia?',estado:'respondida',created_at:'2025-04-23T10:00:00Z'},
  ];
  D.plantillas = [
    {id:1,nombre:'Marcos',apellido:'Varela',correo:'marcos@negocio.com',whatsapp:'+18097778888',plantilla_ref:'corporate-clean',tipo_proyecto:'Página Web',estado:'pendiente',created_at:'2025-04-25T12:00:00Z'},
    {id:2,nombre:'Diana',apellido:'Ramos',correo:'diana@moda.com',whatsapp:'+18099990000',plantilla_ref:'boutique-fashion',tipo_proyecto:'E-Commerce',estado:'revisado',created_at:'2025-04-24T13:00:00Z'},
  ];
  D.suscriptores = [
    {id:1,correo:'carlos@gmail.com',activo:1,created_at:'2025-04-20T10:00:00Z'},
    {id:2,correo:'ana@empresa.com',activo:1,created_at:'2025-04-21T11:00:00Z'},
    {id:3,correo:'marco@empresa.com',activo:1,created_at:'2025-04-25T09:00:00Z'},
  ];
  D.proyectos = [
    {id:1,nombre:'Carlos',apellido:'Peña',empresa:'Tech RD',email:'carlos@gmail.com',telefono:'+18095551234',tipo_proyecto:'E-Commerce',presupuesto:'$1,000–$3,000 USD',monto:null,moneda:'USD',estado:'pendiente',_src:'cot',usuario_id:null,descripcion:'Tienda online para ropa dominicana',fecha_inicio:null,fecha_entrega:null,created_at:'2025-04-25T10:30:00Z',updated_at:'2025-04-25T10:30:00Z'},
    {id:2,nombre:'Ana',apellido:'Díaz',empresa:'Consultora Díaz',email:'ana@empresa.com',telefono:'+18099876543',tipo_proyecto:'Página Web',presupuesto:'$500–$1,000 USD',monto:null,moneda:'USD',estado:'revisado',_src:'cot',usuario_id:null,descripcion:'Página corporativa',fecha_inicio:null,fecha_entrega:null,created_at:'2025-04-24T15:00:00Z',updated_at:'2025-04-24T15:00:00Z'},
    {id:3,nombre:'Luis',apellido:'García',empresa:'Luis Tech',email:'luis@tech.com',telefono:'+18091112222',tipo_proyecto:'App Móvil',presupuesto:'$3,000–$10,000 USD',monto:null,moneda:'USD',estado:'desarrollando',_src:'plt',usuario_id:null,descripcion:'App delivery',fecha_inicio:null,fecha_entrega:null,created_at:'2025-04-23T09:00:00Z',updated_at:'2025-04-23T09:00:00Z'},
    {id:4,nombre:'María',apellido:'Santos',empresa:'Café RD',email:'maria@cafe.com',telefono:'+18093334444',tipo_proyecto:'Sistema a Medida',presupuesto:'Más de $10,000 USD',monto:null,moneda:'USD',estado:'cerrado',_src:'cot',usuario_id:null,descripcion:'CRM para clientes',fecha_inicio:null,fecha_entrega:null,created_at:'2025-04-22T14:00:00Z',updated_at:'2025-04-22T14:00:00Z'},
  ];
}

/* ── Utils ── */
function fmt(d) {
  if (!d) return '—';
  if(typeof formatDateInTZ==='function')return formatDateInTZ(d,'date');
  return new Date(d).toLocaleDateString('es-DO',{day:'2-digit',month:'short',year:'numeric'});
}
function cap(s){return s?s.charAt(0).toUpperCase()+s.slice(1):s;}
function spill(s) {
  const m = {pendiente:'s-pendiente',revisado:'s-revisado',desarrollando:'s-desarrollando',cerrado:'s-cerrado',enviada:'s-enviada',pagada:'s-pagada',nueva:'s-nueva','leída':'s-leida',leida:'s-leida',respondida:'s-respondida'};
  return `<span class="spill ${m[s]||''}">${cap(s)}</span>`;
}
function emptyRow(cols) {
  return `<tr class="empty-row"><td colspan="${cols}"><span class="empty-ico material-symbols-outlined">inbox</span><span class="empty-txt">Sin resultados</span></td></tr>`;
}

/* ── Modal ── */
function openModal(type, item) {
  document.getElementById('modalTitle').textContent = `${item.nombre} ${item.apellido||''} — #${item.id}`;
  const statusOpts = type === 'consultas'
    ? ['nueva','leída','respondida']
    : type === 'cotizaciones'
    ? ['pendiente','enviada','pagada']
    : ['pendiente','revisado','desarrollando','cerrado'];
  document.getElementById('modalBody').innerHTML = `
    <div class="modal-grid">
      <div class="m-field"><span class="m-label">Nombre</span><div class="m-val">${item.nombre} ${item.apellido||''}</div></div>
      <div class="m-field"><span class="m-label">Correo</span><div class="m-val">${item.correo}</div></div>
    </div>
    ${item.whatsapp?`<div class="modal-grid"><div class="m-field"><span class="m-label">WhatsApp</span><div class="m-val">${item.whatsapp}</div></div>${item.tipo_proyecto?`<div class="m-field"><span class="m-label">Tipo de proyecto</span><div class="m-val">${item.tipo_proyecto}</div></div>`:'<div></div>'}</div>`:''}
    ${item.presupuesto?`<div class="m-field"><span class="m-label">Presupuesto</span><div class="m-val">${item.presupuesto}</div></div>`:''}
    ${item.asunto?`<div class="m-field"><span class="m-label">Asunto</span><div class="m-val">${item.asunto}</div></div>`:''}
    ${(item.descripcion||item.mensaje)?`<div class="m-field"><span class="m-label">${item.mensaje?'Mensaje':'Descripción'}</span><div class="m-val tall">${item.descripcion||item.mensaje}</div></div>`:''}
    ${item.plantilla_ref?`<div class="m-field"><span class="m-label">Plantilla ref.</span><div class="m-val">${item.plantilla_ref}</div></div>`:''}
    ${type==='cotizaciones'?`<div class="m-field"><span class="m-label">Documento</span><div class="m-val" style="display:flex;gap:8px;align-items:center">${item.documento_url?`<a href="${item.documento_url}" target="_blank" style="font-size:.78rem">${item.documento_url.length>40?item.documento_url.slice(0,40)+'...':item.documento_url}</a>`:'<span style="font-size:.78rem;color:var(--text-muted)">Sin documento</span>'}<button class="m-btn" style="font-size:.7rem;padding:4px 10px" onclick="editarDocumento(${item.id})">${item.documento_url?'Cambiar':'Añadir'}</button></div></div>`:''}
    <div class="m-field">
      <span class="m-label">Cambiar estado</span>
      <select class="m-select" id="statusSelect">
        ${statusOpts.map(s=>`<option value="${s}" ${item.estado===s?'selected':''}>${cap(s)}</option>`).join('')}
      </select>
    </div>
    <div class="m-field" style="font-size:.7rem;color:var(--text-muted)">Recibido: ${fmt(item.created_at)}</div>
    <div class="modal-actions">
      <button class="m-btn" onclick="closeModal()">Cancelar</button>
      ${item.whatsapp?`<button class="m-btn" onclick="window.open('https://wa.me/${item.whatsapp.replace(/\D/g,'')}','_blank')">WhatsApp</button>`:''}
      <button class="m-btn" onclick="window.open('mailto:${item.correo}')">Correo</button>
      <button class="m-btn primary" onclick="updateStatus('${type}',${item.id})">Guardar</button>
    </div>`;
  document.getElementById('modalOverlay').classList.add('open');
}

function editarDocumento(id) {
  const item = D.cotizaciones.find(i=>i.id===id);
  if (!item) return;
  const url = prompt('URL del documento (PDF, DOC, etc.):', item.documento_url||'');
  if (url === null) return;
  fetch(`${API}/cotizaciones/${id}/documento`, {
    method: 'PATCH',
    headers: H,
    body: JSON.stringify({documento_url: url.trim()||null})
  }).then(r=>r.json()).then(r=>{
    if (r.success) {
      item.documento_url = url.trim()||null;
      if (typeof onDataLoaded==='function') onDataLoaded();
      simpleToast('Documento actualizado');
      closeModal();
    }
  });
}
function closeModal() { document.getElementById('modalOverlay').classList.remove('open'); }
function closeModalOutside(e) { if (e.target===document.getElementById('modalOverlay')) closeModal(); }

async function updateStatus(type, id) {
  const newStatus = document.getElementById('statusSelect').value;
  const endpoints = {cotizaciones:'/cotizaciones',consultas:'/consultas',plantillas:'/plantillas/solicitudes',proyectos:'/proyectos'};
  await apiFetch(`${endpoints[type]}/${id}/estado`,{method:'PATCH',body:JSON.stringify({estado:newStatus})});
  const arr = D[type];
  const idx = arr.findIndex(i=>i.id===id);
  if (idx!==-1) arr[idx].estado = newStatus;
  if (typeof onDataLoaded==='function') onDataLoaded();
  closeModal();
  simpleToast(`Estado actualizado a "${newStatus}"`);
}

function actBtns(type, item) {
  const safe = JSON.stringify(item).replace(/'/g,"&#39;").replace(/"/g,'&quot;');
  return `<div class="td-actions"><button class="act-btn" title="Ver detalle" onclick='openModal("${type}",JSON.parse(this.dataset.item))' data-item="${safe}"><span class="material-symbols-outlined">open_in_new</span></button></div>`;
}

/* ── Sidebar + Theme ── */
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }

/* Migrar key antigua */
(function(){
  const old = localStorage.getItem('mt-admin-theme');
  if (old && !localStorage.getItem('mt-theme')) localStorage.setItem('mt-theme', old);
  localStorage.removeItem('mt-admin-theme');
})();

function applyTheme(t) {
  document.documentElement.setAttribute('data-theme',t);
  localStorage.setItem('mt-theme',t);
  const p = document.getElementById('tsPanel');
  if (p) p.classList.remove('open');
  document.querySelectorAll('.mt-theme-btn[data-theme]').forEach(b=>b.classList.toggle('active',b.dataset.theme===t));
}

function simpleToast(msg) {
  const t = document.createElement('div');
  t.style.cssText = `position:fixed;bottom:80px;right:24px;background:var(--btn-bg);color:var(--btn-txt);padding:9px 16px;border-radius:100px;font-size:.78rem;font-weight:500;z-index:999;animation:fadeUp .3s ease;box-shadow:0 4px 20px rgba(0,0,0,.2)`;
  t.textContent = '✓ ' + msg;
  document.body.appendChild(t);
  setTimeout(()=>t.remove(),2500);
}

async function exportCotizaciones() {
  const csv = ['ID,Nombre,Correo,Proyecto,Presupuesto,Estado,Fecha',
    ...D.cotizaciones.map(c=>`${c.id},${c.nombre} ${c.apellido||''},${c.correo},${c.tipo_proyecto},${c.presupuesto},${c.estado},${fmt(c.created_at)}`)
  ].join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,'+encodeURIComponent(csv);
  a.download = 'cotizaciones-multitech.csv';
  a.click();
  simpleToast('Exportación lista');
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded',()=>{
  const saved = localStorage.getItem('mt-theme');
  if (saved) applyTheme(saved);

  document.addEventListener('click',e=>{
    const sw = document.querySelector('.theme-switcher');
    if (sw&&!sw.contains(e.target)) document.getElementById('tsPanel')?.classList.remove('open');
    if (window.innerWidth<900){
      const sb=document.getElementById('sidebar');
      const tog=document.getElementById('sbToggle');
      if (sb&&tog&&!sb.contains(e.target)&&!tog.contains(e.target)) sb.classList.remove('open');
    }
  });

  const st = document.createElement('style');
  st.textContent=`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`;
  document.head.appendChild(st);

  loadAll();
});