/**
 * ════════════════════════════════════════════════════
 *   Multitech — Auth Client Helper
 *   Incluir en todas las páginas:
 *   <script src="/mt-javascript/mt-auth-client.js"></script>
 * ════════════════════════════════════════════════════
 */

(function (global) {
  'use strict';

  const API     = '/api/auth';
  const KEY     = 'mt_user';      // cuenta activa
  const KEY_ALL = 'mt_user_all';  // array de todas las cuentas guardadas

  /* ══════════════════════════════════════
     STORAGE HELPERS
     ══════════════════════════════════════ */
  function saveUser(user) {
    localStorage.setItem(KEY, JSON.stringify(user));
    _upsertAccount(user);
  }
  function clearUser()  { localStorage.removeItem(KEY); }
  function getUser()    { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } }
  function isLogged()   { return !!getUser(); }

  function _getAllAccounts() {
    try { return JSON.parse(localStorage.getItem(KEY_ALL)) || []; } catch { return []; }
  }
  function _saveAllAccounts(list) { localStorage.setItem(KEY_ALL, JSON.stringify(list)); }
  function _upsertAccount(user) {
    const all = _getAllAccounts();
    const idx = all.findIndex(u => u.correo === user.correo);
    if (idx >= 0) all[idx] = user; else all.push(user);
    _saveAllAccounts(all);
  }
  function _removeAccount(correo) {
    _saveAllAccounts(_getAllAccounts().filter(u => u.correo !== correo));
  }

  /* ══════════════════════════════════════
     API HELPER
     ══════════════════════════════════════ */
  async function apiFetch(path, opts = {}) {
    const res = await fetch(API + path, {
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
      credentials: 'include',
      ...opts,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    const data = await res.json().catch(() => ({ success: false, message: 'Error de red' }));
    return { ok: res.ok, status: res.status, ...data };
  }

  /* ══════════════════════════════════════
     AUTH ACTIONS
     ══════════════════════════════════════ */
  async function signup({ nombre, apellido, correo, password }) {
    const res = await apiFetch('/signup', { method: 'POST', body: { nombre, apellido, correo, password } });
    if (res.success && res.user) saveUser(res.user);
    return res;
  }

  async function login({ correo, password }) {
    const res = await apiFetch('/login', { method: 'POST', body: { correo, password } });
    if (res.success && res.user) saveUser(res.user);
    return res;
  }

  async function logout() {
    const current = getUser();
    await apiFetch('/logout', { method: 'POST' });
    clearUser();
    const remaining = _getAllAccounts().filter(u => u.correo !== current?.correo);
    if (remaining.length > 0) {
      saveUser(remaining[0]);
      window.location.reload();
    } else {
      window.location.href = '/index.html';
    }
  }

  async function me() {
    const res = await apiFetch('/me');
    if (res.success && res.user) saveUser(res.user); else clearUser();
    return res;
  }

  async function refresh() { return apiFetch('/refresh', { method: 'POST' }); }

  /* ══════════════════════════════════════
     SWITCH ACCOUNT
     ══════════════════════════════════════ */
  function switchAccount(correo) {
    const user = _getAllAccounts().find(u => u.correo === correo);
    if (!user) return;
    saveUser(user);
    const dd = document.getElementById('userDropdown');
    if (dd) dd.classList.remove('open');
    window.location.reload();
  }

  /* ══════════════════════════════════════
     ADMIN NAV — activo en todas las páginas
     ══════════════════════════════════════ */
  function _applyAdminNav(rol) {
    const canAdmin = ['admin', 'editor'].includes((rol || '').toLowerCase());
    const navItem  = document.getElementById('adminNavItem');
    if (navItem) navItem.style.display = canAdmin ? '' : 'none';
    if (canAdmin) {
      sessionStorage.setItem('mt_admin_gate', 'mt_2025_secure');
      sessionStorage.setItem('mt_admin_role', (rol || '').toLowerCase());
    }
  }

  /* ══════════════════════════════════════
     ADD ACCOUNT MODAL
     ══════════════════════════════════════ */
  function _openAddAccountModal() {
    const prev = document.getElementById('mt-add-account-modal');
    if (prev) prev.remove();

    const overlay = document.createElement('div');
    overlay.id = 'mt-add-account-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.55);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px;';

    const all     = _getAllAccounts();
    const current = getUser();

    const savedRows = all.map(u => `
      <div class="mtaa-acc-row ${u.correo === current?.correo ? 'mtaa-active' : ''}" data-switch="${u.correo}">
        <div class="mtaa-av"><span class="material-symbols-outlined">person</span></div>
        <div class="mtaa-info">
          <div class="mtaa-name">${u.nombre}${u.apellido ? ' '+u.apellido : ''}</div>
          <div class="mtaa-mail">${u.correo}</div>
        </div>
        <button class="mtaa-rm" data-remove="${u.correo}" title="Quitar">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>`).join('');

    overlay.innerHTML = `
      <style>
        .mtaa-box{background:var(--surface,#faf7f2);border:1px solid var(--border,#d9d1c0);border-radius:18px;padding:28px;width:100%;max-width:360px;box-shadow:0 24px 64px rgba(0,0,0,.18);font-family:var(--ff-body,'DM Sans',sans-serif);animation:mtaaIn .28s cubic-bezier(.16,1,.3,1)}
        @keyframes mtaaIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .mtaa-box h3{font-family:var(--ff-head,'Playfair Display',serif);font-size:1.12rem;font-weight:700;color:var(--text,#2c2416);margin-bottom:3px}
        .mtaa-box>p{font-size:.77rem;color:var(--text-muted,#a39880);margin-bottom:16px}
        .mtaa-acc-row{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:9px;border:1px solid var(--border,#d9d1c0);background:var(--bg,#f5f0e8);cursor:pointer;margin-bottom:5px;transition:background .13s,border-color .15s}
        .mtaa-acc-row:hover{background:var(--bg2,#ede8de);border-color:var(--text-muted,#a39880)}
        .mtaa-active{background:var(--accent-bg,#e8dfc8)!important;border-color:var(--accent,#7a5c3a)!important}
        .mtaa-av{width:32px;height:32px;border-radius:50%;background:var(--btn-bg,#2c2416);display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .mtaa-av .material-symbols-outlined{font-size:.95rem;color:var(--btn-txt,#faf7f2);font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24}
        .mtaa-info{flex:1;min-width:0}
        .mtaa-name{font-size:.8rem;font-weight:500;color:var(--text,#2c2416);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .mtaa-mail{font-size:.69rem;color:var(--text-muted,#a39880);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .mtaa-rm{width:24px;height:24px;border-radius:50%;border:none;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;opacity:.35;transition:opacity .15s}
        .mtaa-rm:hover{opacity:1}
        .mtaa-rm .material-symbols-outlined{font-size:.8rem;color:#c0392b}
        .mtaa-div{display:flex;align-items:center;gap:10px;margin:14px 0}
        .mtaa-div::before,.mtaa-div::after{content:'';flex:1;height:1px;background:var(--border,#d9d1c0)}
        .mtaa-div span{font-size:.7rem;color:var(--text-muted,#a39880);white-space:nowrap}
        .mtaa-grp{margin-bottom:12px}
        .mtaa-lbl{display:block;font-size:.73rem;font-weight:500;color:var(--text-soft,#6b5e47);margin-bottom:5px}
        .mtaa-inp{width:100%;padding:9px 13px;border:1px solid var(--border,#d9d1c0);border-radius:9px;background:var(--bg,#f5f0e8);color:var(--text,#2c2416);font-family:var(--ff-body,'DM Sans',sans-serif);font-size:.84rem;outline:none;transition:border-color .2s,box-shadow .2s}
        .mtaa-inp:focus{border-color:var(--accent,#7a5c3a);box-shadow:0 0 0 3px var(--accent-bg,#e8dfc8)}
        .mtaa-err{font-size:.7rem;color:#c0392b;margin-top:4px;display:none}
        .mtaa-row{display:flex;gap:8px;margin-top:14px}
        .mtaa-btn{flex:1;padding:10px;border-radius:9px;font-size:.83rem;font-weight:500;font-family:var(--ff-body,'DM Sans',sans-serif);cursor:pointer;border:none;transition:opacity .18s,transform .13s}
        .mtaa-btn:hover{opacity:.85;transform:translateY(-1px)}
        .mtaa-btn.pri{background:var(--btn-bg,#2c2416);color:var(--btn-txt,#faf7f2)}
        .mtaa-btn.sec{background:var(--bg2,#ede8de);color:var(--text-soft,#6b5e47);border:1px solid var(--border,#d9d1c0)}
        .mtaa-btn.ld{pointer-events:none;opacity:.6}
      </style>
      <div class="mtaa-box">
        <h3>Gestionar cuentas</h3>
        <p>Cambia entre cuentas o inicia sesión en una nueva.</p>
        ${savedRows}
        <div class="mtaa-div"><span>agregar cuenta nueva</span></div>
        <div class="mtaa-grp">
          <label class="mtaa-lbl" for="mtaa-correo">Correo electrónico</label>
          <input class="mtaa-inp" type="email" id="mtaa-correo" placeholder="correo@ejemplo.com" autocomplete="email">
        </div>
        <div class="mtaa-grp">
          <label class="mtaa-lbl" for="mtaa-pass">Contraseña</label>
          <input class="mtaa-inp" type="password" id="mtaa-pass" placeholder="••••••••" autocomplete="current-password">
          <div class="mtaa-err" id="mtaa-err">Correo o contraseña incorrectos.</div>
        </div>
        <div class="mtaa-row">
          <button class="mtaa-btn sec" id="mtaa-cancel">Cancelar</button>
          <button class="mtaa-btn pri" id="mtaa-submit">Iniciar sesión</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);

    // Cerrar al click fuera
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    overlay.querySelector('#mtaa-cancel').addEventListener('click', () => overlay.remove());

    // Cambiar de cuenta (click en fila de cuenta guardada)
    overlay.querySelectorAll('[data-switch]').forEach(row => {
      row.addEventListener('click', e => {
        if (e.target.closest('[data-remove]')) return; // no switchear si se está removiendo
        overlay.remove();
        switchAccount(row.dataset.switch);
      });
    });

    // Quitar cuenta
    overlay.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const correo = btn.dataset.remove;
        _removeAccount(correo);
        if (getUser()?.correo === correo) clearUser();
        overlay.remove();
        _openAddAccountModal();
      });
    });

    // Submit nueva cuenta
    const submitBtn = overlay.querySelector('#mtaa-submit');
    const errEl     = overlay.querySelector('#mtaa-err');

    async function doSubmit() {
      const correo   = overlay.querySelector('#mtaa-correo').value.trim();
      const password = overlay.querySelector('#mtaa-pass').value;
      errEl.style.display = 'none';

      if (!correo || !password) {
        errEl.textContent = 'Completa todos los campos.';
        errEl.style.display = 'block';
        return;
      }

      submitBtn.classList.add('ld');
      submitBtn.textContent = 'Verificando…';

      const res = await apiFetch('/login', { method: 'POST', body: { correo, password } }).catch(() => null);

      if (res?.success && res.user) {
        saveUser(res.user);
        overlay.remove();
        _applyUserUI(res.user);
        const accList = document.getElementById('accountList');
        if (accList) _buildAccountList(accList, res.user);
        window.location.reload();
      } else {
        errEl.textContent = res?.message || 'Correo o contraseña incorrectos.';
        errEl.style.display = 'block';
        submitBtn.classList.remove('ld');
        submitBtn.textContent = 'Iniciar sesión';
      }
    }

    submitBtn.addEventListener('click', doSubmit);
    overlay.querySelector('#mtaa-pass').addEventListener('keydown', e => { if (e.key === 'Enter') doSubmit(); });
    setTimeout(() => overlay.querySelector('#mtaa-correo')?.focus(), 80);
  }

  /* ══════════════════════════════════════
     HOOK: botón "Agregar cuenta" en el dropdown
     ══════════════════════════════════════ */
  function _hookAddAccountBtn() {
    document.querySelectorAll('.udd-item').forEach(item => {
      const label = item.querySelector('.udd-item-label');
      if (label && label.textContent.trim().toLowerCase().includes('agregar cuenta')) {
        item.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          const dd = document.getElementById('userDropdown');
          if (dd) dd.classList.remove('open');
          _openAddAccountModal();
        };
      }
    });
  }

  /* ══════════════════════════════════════
     UI HELPERS
     ══════════════════════════════════════ */
  function _applyUserUI(user) {
    const btn   = document.getElementById('userBtn');
    const stOut = document.getElementById('stateLoggedOut');
    const stIn  = document.getElementById('stateLoggedIn');

    // Botón nav: icono de persona relleno (sin iniciales)
    if (btn) {
      btn.className = 'user-btn logged-in';
      btn.innerHTML = `
        <span class="material-symbols-outlined"
              style="font-size:1.1rem;color:var(--accent-txt);
                     font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">
          person
        </span>
        <div class="online-dot"></div>`;
    }

    if (stOut) stOut.style.display = 'none';
    if (stIn)  stIn.style.display  = 'block';

    // Textos del dropdown
    _setText('dpName',  user.nombre + (user.apellido ? ' ' + user.apellido : ''));
    _setText('dpEmail', user.correo);
    _setText('dpRole',  _rolLabel(user.rol));

    // Avatar del dropdown: icono
    const dpAvatar = document.getElementById('dpAvatar');
    if (dpAvatar) {
      dpAvatar.innerHTML = `
        <span class="material-symbols-outlined"
              style="font-size:1.25rem;color:var(--accent);
                     font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">
          person
        </span>`;
    }

    // Lista de cuentas en el dropdown
    const accList = document.getElementById('accountList');
    if (accList) _buildAccountList(accList, user);

    // Enganchar el botón agregar cuenta
    _hookAddAccountBtn();

    // Admin nav en todas las páginas
    _applyAdminNav(user.rol);

    document.dispatchEvent(new CustomEvent('mt:userReady', { detail: user }));
  }

  function _applyGuestUI() {
    const btn   = document.getElementById('userBtn');
    const stOut = document.getElementById('stateLoggedOut');
    const stIn  = document.getElementById('stateLoggedIn');

    if (btn) {
      btn.className = 'user-btn';
      btn.innerHTML = `
        <span class="material-symbols-outlined" style="font-size:.9rem;color:var(--text-muted)">person</span>
        <span id="userBtnLabel">Crear cuenta</span>
        <div class="online-dot"></div>`;
    }

    if (stOut) stOut.style.display = 'block';
    if (stIn)  stIn.style.display  = 'none';

    _applyAdminNav('');
    document.dispatchEvent(new CustomEvent('mt:userGuest'));
  }

  function _buildAccountList(el, activeUser) {
    const all = _getAllAccounts();

    if (all.length === 0) {
      // Solo mostrar la cuenta activa
      el.innerHTML = `
        <button class="acc-row active">
          <div class="acc-av">
            <span class="material-symbols-outlined"
                  style="font-size:.9rem;color:var(--accent);
                         font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">
              person
            </span>
          </div>
          <div class="acc-body">
            <div class="acc-name">${activeUser.nombre}${activeUser.apellido ? ' '+activeUser.apellido : ''}</div>
            <div class="acc-role-badge"><span class="acc-role-dot"></span>${_rolLabel(activeUser.rol)}</div>
          </div>
          <div class="acc-check"><span class="material-symbols-outlined">check_circle</span></div>
        </button>`;
      return;
    }

    el.innerHTML = all.map(u => {
      const isActive = u.correo === activeUser.correo;
      return `
        <button class="acc-row ${isActive ? 'active' : ''}"
                onclick="MTAuth._switchAccount('${u.correo}')">
          <div class="acc-av">
            <span class="material-symbols-outlined"
                  style="font-size:.9rem;color:${isActive ? 'var(--accent)' : 'var(--text-muted)'};
                         font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">
              person
            </span>
          </div>
          <div class="acc-body">
            <div class="acc-name">${u.nombre}${u.apellido ? ' '+u.apellido : ''}</div>
            <div class="acc-role-badge">
              <span class="acc-role-dot"></span>
              ${_rolLabel(u.rol)} · ${u.correo.split('@')[0]}
            </div>
          </div>
          ${isActive
            ? '<div class="acc-check"><span class="material-symbols-outlined">check_circle</span></div>'
            : '<div class="acc-online"></div>'}
        </button>`;
    }).join('');
  }

  function _rolLabel(rol) {
    return { admin: 'Admin', editor: 'Editor', cliente: 'Cliente' }[rol] || rol;
  }
  function _setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  /* ══════════════════════════════════════
     INIT
     ══════════════════════════════════════ */
  async function init() {
    const user = getUser();
    if (user) _applyUserUI(user);

    try {
      const res = await me();
      if (res.success && res.user) {
        _applyUserUI(res.user);
      } else {
        _applyGuestUI();
      }
    } catch {
      if (!user) _applyGuestUI();
    }
  }

  /* ══════════════════════════════════════
     API PÚBLICA
     ══════════════════════════════════════ */
  global.MTAuth = {
    signup, login, logout, me, refresh, init,
    getUser, isLogged, saveUser, clearUser,
    _switchAccount: switchAccount,
    _openAddAccountModal,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window);