/* admin-config-app.js — Configuración del sistema (API + UI) */
(function () {
  'use strict';

  let configData = null;
  let panelUsers = [];
  let editingUserId = null;

  const COLORS = ['#7a5c3a', '#1a3d72', '#3d6030', '#6b3d08', '#5c3a08', '#333'];

  function cfgApi(url, opts = {}) {
    return fetch(API + url, { headers: H, ...opts }).then(async (r) => {
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.message || r.statusText);
      return j;
    });
  }

  function val(id) {
    const el = document.getElementById(id);
    if (!el) return undefined;
    if (el.type === 'checkbox') return el.checked;
    return el.value;
  }

  function setVal(id, v) {
    const el = document.getElementById(id);
    if (!el || v === undefined) return;
    if (el.type === 'checkbox') el.checked = !!v;
    else el.value = v ?? '';
  }

  function selectByValue(id, v) {
    const el = document.getElementById(id);
    if (!el) return;
    for (const opt of el.options) {
      if (opt.value === String(v) || opt.textContent.includes(String(v))) {
        el.value = opt.value;
        return;
      }
    }
    el.value = v;
  }

  /* ── Cargar configuración ── */
  async function loadConfig() {
    try {
      const res = await cfgApi('/config');
      if (res?.data) {
        configData = res.data;
        applyConfigToForm(configData);
      }
    } catch (e) {
      console.warn('[config] load:', e.message);
      toast('Error', 'No se pudo cargar la configuración. ¿Está el servidor activo?', 'error', 'var(--red-bg)', 'var(--red-txt)');
    }
  }

  function applyConfigToForm(c) {
    const e = c.empresa || {};
    setVal('cfgEmpNombre', e.nombre);
    setVal('cfgEmpRnc', e.rnc);
    setVal('cfgEmpTel', e.telefono);
    setVal('cfgEmpEmail', e.email);
    setVal('cfgEmpDir', e.direccion);
    setVal('cfgEmpDesc', e.descripcion);

    const s = c.sistema || {};
    selectByValue('cfgMoneda', s.moneda || 'USD');
    selectByValue('cfgIdioma', s.idioma || 'es');
    selectByValue('cfgTimezone', s.timezone || 'America/Santo_Domingo');
    setVal('togMaint', s.mantenimiento);

    const cl = c.clientes || {};
    setVal('togCliAprov', cl.aprobacion_manual);
    setVal('togPortal', cl.portal_activo);
    setVal('togVip', cl.vip_auto);
    setVal('cfgVipUmbral', cl.vip_umbral);

    const r = c.roles || {};
    setVal('togEditorDel', r.editor_eliminar);
    setVal('togViewerFin', r.viewer_finanzas);
    setVal('togInvite', r.invitaciones);

    const n = c.notificaciones || {};
    setVal('togNotLead', n.nuevo_lead);
    setVal('togNotProy', n.proyecto_entregado);
    setVal('togNotPago', n.pago_registrado);
    setVal('togNotMsg', n.mensaje_contacto);
    setVal('togNotDevice', n.nuevo_dispositivo);
    setVal('togNotEmail', n.canal_email);
    setVal('togNotWa', n.canal_whatsapp);
    setVal('togNotPanel', n.canal_panel);
    setVal('cfgNotEmail', n.email_destino);

    const seg = c.seguridad || {};
    setVal('tog2fa', seg.tfa_obligatorio);
    selectByValue('cfgSesion', String(seg.sesion_minutos || 60));
    selectByValue('cfgLoginIntentos', String(seg.login_intentos || 5));
    setVal('cfgIpWhitelist', seg.ip_whitelist);
    setVal('cfgPwdMin', seg.pwd_min);
    setVal('togPwdEsp', seg.pwd_especial);
    selectByValue('cfgPwdExp', seg.pwd_expiracion || '90');

    const i = c.integraciones || {};
    setVal('apiKeyInput', i.api_key || '');
    setVal('cfgWebhook', i.webhook_url || '');

    const d = c.defaults_usuario || {};
    if (typeof pickDefTheme === 'function' && d.tema) pickDefTheme(d.tema);
    selectByValue('cfgDefIdioma', d.idioma || 'es');
    selectByValue('cfgDefTz', d.timezone || 'America/Santo_Domingo');
    setVal('togDefNotCot', d.notif_cotizacion);
    setVal('togDefNotMsg', d.notif_mensaje);
    setVal('togDefNotPago', d.notif_pago);
  }

  function collectEmpresa() {
    return {
      nombre: val('cfgEmpNombre'),
      rnc: val('cfgEmpRnc'),
      telefono: val('cfgEmpTel'),
      email: val('cfgEmpEmail'),
      direccion: val('cfgEmpDir'),
      descripcion: val('cfgEmpDesc'),
    };
  }

  function collectSistema() {
    return {
      moneda: val('cfgMoneda'),
      idioma: val('cfgIdioma'),
      timezone: val('cfgTimezone'),
      mantenimiento: val('togMaint'),
    };
  }

  function collectClientes() {
    return {
      aprobacion_manual: val('togCliAprov'),
      portal_activo: val('togPortal'),
      vip_auto: val('togVip'),
      vip_umbral: parseInt(val('cfgVipUmbral'), 10) || 5000,
    };
  }

  function collectRoles() {
    return {
      editor_eliminar: val('togEditorDel'),
      viewer_finanzas: val('togViewerFin'),
      invitaciones: val('togInvite'),
    };
  }

  function collectNotificaciones() {
    return {
      nuevo_lead: val('togNotLead'),
      proyecto_entregado: val('togNotProy'),
      pago_registrado: val('togNotPago'),
      mensaje_contacto: val('togNotMsg'),
      nuevo_dispositivo: val('togNotDevice'),
      canal_email: val('togNotEmail'),
      canal_whatsapp: val('togNotWa'),
      canal_panel: val('togNotPanel'),
      email_destino: val('cfgNotEmail'),
    };
  }

  function collectSeguridad() {
    return {
      tfa_obligatorio: val('tog2fa'),
      sesion_minutos: parseInt(val('cfgSesion'), 10) || 60,
      login_intentos: parseInt(val('cfgLoginIntentos'), 10) || 5,
      ip_whitelist: val('cfgIpWhitelist'),
      pwd_min: parseInt(val('cfgPwdMin'), 10) || 8,
      pwd_especial: val('togPwdEsp'),
      pwd_expiracion: val('cfgPwdExp'),
    };
  }

  function collectIntegraciones() {
    return {
      api_key: val('apiKeyInput'),
      webhook_url: val('cfgWebhook'),
    };
  }

  function collectDefaults() {
    const active = document.querySelector('.def-theme-swatch.active');
    return {
      tema: active?.dataset?.t || 'beige',
      idioma: val('cfgDefIdioma'),
      timezone: val('cfgDefTz'),
      notif_cotizacion: val('togDefNotCot'),
      notif_mensaje: val('togDefNotMsg'),
      notif_pago: val('togDefNotPago'),
    };
  }

  window.saveConfigSection = async function (seccion) {
    const patch = { _seccion: seccion };
    if (seccion === 'empresa') patch.empresa = collectEmpresa();
    else if (seccion === 'sistema') patch.sistema = collectSistema();
    else if (seccion === 'clientes') patch.clientes = collectClientes();
    else if (seccion === 'roles') patch.roles = collectRoles();
    else if (seccion === 'notificaciones') patch.notificaciones = collectNotificaciones();
    else if (seccion === 'seguridad') patch.seguridad = collectSeguridad();
    else if (seccion === 'integraciones') patch.integraciones = collectIntegraciones();
    else if (seccion === 'defaults') patch.defaults_usuario = collectDefaults();
    else if (seccion === 'general') {
      patch.empresa = collectEmpresa();
      patch.sistema = collectSistema();
    }

    try {
      const res = await cfgApi('/config', {
        method: 'PUT',
        body: JSON.stringify(patch),
      });
      configData = res.data;
      toast('Guardado', res.message || 'Configuración actualizada', 'check_circle', 'var(--green-bg)', 'var(--green-txt)');
    } catch (e) {
      toast('Error', e.message, 'error', 'var(--red-bg)', 'var(--red-txt)');
    }
  };

  /* ── Usuarios del panel ── */
  async function loadPanelUsers() {
    try {
      const res = await cfgApi('/config/usuarios');
      panelUsers = res.data || [];
      renderUsersTable();
      updateRoleStats();
    } catch (e) {
      console.warn('[config] usuarios:', e.message);
    }
  }

  function initials(nombre, apellido) {
    return ((nombre || '')[0] || '') + ((apellido || '')[0] || '');
  }

  function fmtRelative(d) {
    if (!d) return '—';
    if (typeof formatDateInTZ === 'function') return formatDateInTZ(d, 'datetime');
    const dt = new Date(d);
    const now = new Date();
    const diff = (now - dt) / 1000;
    if (diff < 86400) return 'Hoy, ' + dt.toLocaleTimeString('es-DO', { hour: 'numeric', minute: '2-digit' });
    if (diff < 172800) return 'Ayer, ' + dt.toLocaleTimeString('es-DO', { hour: 'numeric', minute: '2-digit' });
    return fmt(d);
  }

  function renderUsersTable() {
    const tb = document.getElementById('tableBody');
    if (!tb) return;
    if (!panelUsers.length) {
      tb.innerHTML = '<tr><td colspan="5" class="td-muted" style="text-align:center;padding:28px">No hay usuarios del panel</td></tr>';
      return;
    }
    tb.innerHTML = panelUsers.map((u, i) => {
      const ini = initials(u.nombre, u.apellido).toUpperCase();
      const color = COLORS[i % COLORS.length];
      const rolPill = u.rol === 'admin'
        ? '<span class="pill pill-admin"><span class="pill-dot"></span>Admin</span>'
        : '<span class="pill pill-editor"><span class="pill-dot"></span>Editor</span>';
      const estadoPill = u.activo
        ? '<span class="pill pill-activo"><span class="pill-dot"></span>Activo</span>'
        : '<span class="pill pill-inactivo"><span class="pill-dot"></span>Inactivo</span>';
      const nombre = [u.nombre, u.apellido].filter(Boolean).join(' ');
      return `<tr data-id="${u.id}">
        <td><div class="client-av-cell"><div class="client-av" style="background:${color}">${ini}</div><div><div class="td-name">${nombre}</div><div class="td-muted" style="font-size:.7rem">${u.correo}</div></div></div></div></td>
        <td>${rolPill}</td>
        <td>${estadoPill}</td>
        <td><span class="td-muted">${fmtRelative(u.last_login)}</span></td>
        <td><button type="button" class="btn btn-secondary btn-sm" onclick="editPanelUser(${u.id})">Editar</button></td>
      </tr>`;
    }).join('');

    if (typeof gsap !== 'undefined') {
      gsap.fromTo('#tableBody tr', { autoAlpha: 0, x: -10 }, { autoAlpha: 1, x: 0, duration: 0.32, stagger: 0.05, ease: 'power2.out' });
    }
  }

  function updateRoleStats() {
    const admins = panelUsers.filter((u) => u.rol === 'admin').length;
    const editors = panelUsers.filter((u) => u.rol === 'editor').length;
    const elA = document.getElementById('statAdmins');
    const elE = document.getElementById('statEditors');
    if (elA) elA.textContent = admins;
    if (elE) elE.textContent = editors;
  }

  window.openNewUserModal = function () {
    editingUserId = null;
    document.getElementById('modalUsuarioTitle').innerHTML = 'Nuevo <em>usuario</em>';
    document.getElementById('mu_password_wrap').style.display = '';
    setVal('mu_nombre', '');
    setVal('mu_apellido', '');
    setVal('mu_correo', '');
    setVal('mu_rol', 'editor');
    setVal('mu_password', generatePassword());
    openModal('modalUsuario');
  };

  window.editPanelUser = function (id) {
    const u = panelUsers.find((x) => x.id === id);
    if (!u) return;
    editingUserId = id;
    document.getElementById('modalUsuarioTitle').innerHTML = 'Editar <em>usuario</em>';
    document.getElementById('mu_password_wrap').style.display = 'none';
    setVal('mu_nombre', u.nombre);
    setVal('mu_apellido', u.apellido);
    setVal('mu_correo', u.correo);
    setVal('mu_rol', u.rol);
    openModal('modalUsuario');
  };

  function generatePassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let p = 'Mlt$';
    for (let i = 0; i < 10; i++) p += chars[Math.floor(Math.random() * chars.length)];
    return p;
  }

  window.saveUser = async function () {
    const nombre = val('mu_nombre');
    const apellido = val('mu_apellido');
    const correo = val('mu_correo');
    const rol = val('mu_rol');

    if (!nombre || !correo) {
      toast('Campos requeridos', 'Nombre y correo son obligatorios', 'warning', 'var(--amber-bg)', 'var(--amber-txt)');
      return;
    }

    try {
      if (editingUserId) {
        await cfgApi(`/config/usuarios/${editingUserId}`, {
          method: 'PATCH',
          body: JSON.stringify({ nombre, apellido, rol }),
        });
        toast('Usuario actualizado', 'Los cambios se guardaron correctamente', 'check_circle', 'var(--green-bg)', 'var(--green-txt)');
      } else {
        const password = val('mu_password') || generatePassword();
        await cfgApi('/config/usuarios', {
          method: 'POST',
          body: JSON.stringify({ nombre, apellido, correo, password, rol }),
        });
        toast('Usuario creado', 'El nuevo usuario fue agregado al sistema', 'person_add', 'var(--green-bg)', 'var(--green-txt)');
      }
      closeModal('modalUsuario');
      await loadPanelUsers();
    } catch (e) {
      toast('Error', e.message, 'error', 'var(--red-bg)', 'var(--red-txt)');
    }
  };

  window.toggleUserActive = async function (id, activo) {
    try {
      await cfgApi(`/config/usuarios/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ activo }),
      });
      await loadPanelUsers();
    } catch (e) {
      toast('Error', e.message, 'error', 'var(--red-bg)', 'var(--red-txt)');
    }
  };

  /* ── Registro de actividad ── */
  async function loadActivityLogs() {
    const wrap = document.getElementById('logsBody');
    if (!wrap) return;
    try {
      const res = await apiFetch('/admin/actividad?limit=30');
      const rows = res?.data || [];
      if (!rows.length) {
        wrap.innerHTML = '<p class="td-muted" style="padding:20px;text-align:center">Sin actividad registrada</p>';
        return;
      }
      wrap.innerHTML = rows.map((row) => logRowHtml(row)).join('');
    } catch (e) {
      wrap.innerHTML = '<p class="td-muted" style="padding:20px">No se pudo cargar el registro</p>';
    }
  }

  function logRowHtml(row) {
    const p = typeof row.payload === 'string' ? (() => { try { return JSON.parse(row.payload); } catch { return {}; } })() : (row.payload || {});
    const { icon, bg, color, line } = describeLog(row.tipo, p, row.ref_id);
    const time = fmtRelative(row.created_at);
    const ip = row.ip ? `<span class="log-ip">${row.ip}</span>` : '';
    return `<div class="log-item">
      <div class="ico-circle ${bg}" style="width:32px;height:32px;border-radius:8px;flex-shrink:0"><span class="ms" style="font-size:.88rem">${icon}</span></div>
      <div class="log-body"><div class="log-line">${line}</div><div class="log-meta"><span class="log-time">${time}</span>${ip}</div></div>
    </div>`;
  }

  function describeLog(tipo, p, refId) {
    const map = {
      config: { icon: 'settings', bg: 'ico-amber', line: `Configuración actualizada <strong>${p.seccion || ''}</strong>` },
      usuario: { icon: 'person', bg: 'ico-blue', line: `Usuario <strong>${p.accion || 'modificado'}</strong>${p.correo ? ` (${p.correo})` : ''}` },
      cliente: { icon: 'group', bg: 'ico-green', line: `Cliente registrado <strong>${p.empresa || '#' + refId}</strong>` },
      proyecto: { icon: 'folder', bg: 'ico-blue', line: `Proyecto <strong>${p.accion || 'actualizado'}</strong>` },
      cotizacion: { icon: 'request_quote', bg: 'ico-acc', line: `Nueva cotización <strong>${p.tipo_proyecto || ''}</strong>` },
      consulta: { icon: 'help', bg: 'ico-blue', line: `Consulta: <strong>${p.asunto || ''}</strong>` },
      transaccion: { icon: 'payments', bg: 'ico-green', line: `Transacción <strong>${p.tipo || ''}</strong> ${p.monto ? '$' + p.monto : ''}` },
    };
    const m = map[tipo] || { icon: 'history', bg: 'ico-acc', line: `Evento <strong>${tipo}</strong> #${refId || ''}` };
    return { ...m, color: '' };
  }

  window.exportLogs = async function () {
    try {
      const res = await apiFetch('/admin/actividad?limit=500');
      const blob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' });
      downloadBlob(blob, `multitech-actividad-${Date.now()}.json`);
      toast('Exportado', 'Registro descargado en JSON', 'download', 'var(--green-bg)', 'var(--green-txt)');
    } catch (e) {
      toast('Error', e.message, 'error', 'var(--red-bg)', 'var(--red-txt)');
    }
  };

  window.exportFullDatabase = async function () {
    try {
      const res = await cfgApi('/config/export');
      const blob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' });
      downloadBlob(blob, `multitech-backup-${Date.now()}.json`);
      toast('Exportado', 'Respaldo completo descargado', 'download', 'var(--green-bg)', 'var(--green-txt)');
    } catch (e) {
      toast('Error', e.message, 'error', 'var(--red-bg)', 'var(--red-txt)');
    }
  };

  window.enableMaintenanceAll = async function () {
    if (!confirm('¿Activar modo mantenimiento? El sitio público quedará restringido.')) return;
    setVal('togMaint', true);
    await saveConfigSection('sistema');
  };

  function downloadBlob(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  /* ── Tema por defecto ── */
  const origPickDefTheme = window.pickDefTheme;
  window.pickDefTheme = function (t) {
    document.querySelectorAll('.def-theme-swatch').forEach((s) => s.classList.toggle('active', s.dataset.t === t));
    if (origPickDefTheme) origPickDefTheme(t);
  };

  /* ── Init ── */
  document.addEventListener('DOMContentLoaded', async () => {
    await loadConfig();
    await loadPanelUsers();
    await loadActivityLogs();

    const maint = document.getElementById('togMaint');
    if (maint) {
      maint.addEventListener('change', () => {
        saveConfigSection('sistema');
      });
    }
  });

  window.onDataLoaded = function () {};
})();



