/**
 * ════════════════════════════════════════════════════
 *   Multitech — Auth Client v2.0
 *   <script src="/mt-javascript/mt-auth-client.js"></script>
 *
 *   NOVEDADES v2:
 *   ✅ Switch de cuentas real (múltiples sesiones en localStorage)
 *   ✅ Google SSO (popup flow) — requiere mt-auth-google.js en el backend
 *   ✅ Modal unificado de gestión de cuentas
 *   ✅ Sincronización automática de estado en todas las páginas
 * ════════════════════════════════════════════════════
 */

(function (global) {
  'use strict';

  const API      = '/api/auth';
  const KEY      = 'mt_user';       // cuenta activa
  const KEY_ALL  = 'mt_user_all';   // array de todas las cuentas guardadas
  const GOOGLE_CLIENT_ID = '226987765823-og2hektbtnr55ncuki6hnlqk3pdtq3bb.apps.googleusercontent.com'; // ← reemplaza con tu Client ID de Google

  /* ══════════════════════════════════════
     STORAGE — cuentas múltiples
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
    const user = getUser();
    const authHeaders = user?.token ? { 'Authorization': 'Bearer ' + user.token } : {};
    const res = await fetch(API + path, {
      headers: { 'Content-Type': 'application/json', ...authHeaders, ...(opts.headers || {}) },
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
    await apiFetch('/logout', { method: 'POST' }).catch(() => {});
    clearUser();
    _removeAccount(current?.correo);
    const remaining = _getAllAccounts();
    if (remaining.length > 0) {
      saveUser(remaining[0]);
      window.location.reload();
    } else {
      window.location.href = '/index.html';
    }
  }

  async function me() {
    const res = await apiFetch('/me');
    if (res.success && res.user) {
      saveUser(res.user);
    } else {
      const badUser = getUser();
      clearUser();
      if (badUser?.correo) _removeAccount(badUser.correo);
    }
    return res;
  }

  async function refresh() { return apiFetch('/refresh', { method: 'POST' }); }

  /* ══════════════════════════════════════
     PERFIL — Actualizar datos
     ══════════════════════════════════════ */
  async function updateProfile(data) {
    const res = await apiFetch('/me', { method: 'PATCH', body: data });
    if (res.success && res.user) saveUser(res.user);
    return res;
  }

  /* ══════════════════════════════════════
     AVATAR — Actualizar foto (base64)
     ══════════════════════════════════════ */
  async function updateAvatar(avatar_url) {
    const res = await apiFetch('/avatar', { method: 'PATCH', body: { avatar_url } });
    if (res.success && res.user) saveUser(res.user);
    return res;
  }

  /* ══════════════════════════════════════
     PREFERENCIAS
     ══════════════════════════════════════ */
  async function getPreferences() { return apiFetch('/preferencias'); }
  async function updatePreferences(data) {
    return apiFetch('/preferencias', { method: 'PATCH', body: data });
  }

  /* ══════════════════════════════════════
     SESIONES
     ══════════════════════════════════════ */
  async function getSessions() { return apiFetch('/sesiones'); }
  async function closeSession(id) {
    return apiFetch(`/sesiones/${id}`, { method: 'DELETE' });
  }
  async function closeAllSessions() {
    return apiFetch('/sesiones', { method: 'DELETE' });
  }

  /* ══════════════════════════════════════
     EXPORTAR / ELIMINAR CUENTA
     ══════════════════════════════════════ */
  async function exportData() { return apiFetch('/export'); }
  async function deleteAccount(password) {
    return apiFetch('/me', { method: 'DELETE', body: { password } });
  }

  /* ══════════════════════════════════════
     GOOGLE SSO — Redirect Flow
     ══════════════════════════════════════ */
  function loginWithGoogle() {
    clearUser();
    const currentPath = window.location.pathname;
    const REDIRECT_URI = encodeURIComponent(window.location.origin + '/api/auth/google/callback');
    const SCOPE = encodeURIComponent('openid email profile');
    const STATE = encodeURIComponent(currentPath);

    const url = `https://accounts.google.com/o/oauth2/v2/auth` +
      `?client_id=${GOOGLE_CLIENT_ID}` +
      `&redirect_uri=${REDIRECT_URI}` +
      `&response_type=code` +
      `&scope=${SCOPE}` +
      `&state=${STATE}` +
      `&prompt=select_account`;

    window.location.href = url;
  }

  /* ══════════════════════════════════════
     SWITCH ACCOUNT
     ══════════════════════════════════════ */
  async function switchAccount(correo) {
    const user = _getAllAccounts().find(u => u.correo === correo);
    if (!user) return;
    if (!user.token) {
      _removeAccount(correo);
      _openAddAccountModal();
      return;
    }
    saveUser(user);
    try {
      const res = await apiFetch('/me');
      if (res.success && res.user) {
        saveUser(res.user);
      } else {
        _removeAccount(correo);
        clearUser();
        _showToast('⚠ Esta cuenta ya no existe. Se ha eliminado del acceso rápido.');
        return;
      }
    } catch {
      // Error de red — continuar con datos en caché
    }
    const dd = document.getElementById('userDropdown');
    if (dd) dd.classList.remove('open');
    window.location.reload();
  }

  /* ══════════════════════════════════════
     MODAL UNIFICADO
     ══════════════════════════════════════ */
  let _modalEl = null;

  function _closeModal() {
    if (_modalEl) { _modalEl.remove(); _modalEl = null; }
  }

  function _openAddAccountModal() {
    _closeModal();

    const all     = _getAllAccounts();
    const current = getUser();

    const savedRows = all.map(u => {
      const isActive = u.correo === current?.correo;
      const initials = ((u.nombre?.[0] || '') + (u.apellido?.[0] || '')).toUpperCase() || '?';
      const provider = u.provider === 'google' ? '·  Google' : '';
      return `
        <div class="mtaa-acc-row ${isActive ? 'mtaa-active' : ''}"
             data-switch="${u.correo}" role="button" tabindex="0">
          <div class="mtaa-av">${initials}</div>
          <div class="mtaa-info">
            <div class="mtaa-name">${u.nombre}${u.apellido ? ' '+u.apellido : ''} <span class="mtaa-provider">${provider}</span></div>
            <div class="mtaa-mail">${u.correo}</div>
          </div>
          <button class="mtaa-rm" data-remove="${u.correo}" title="Quitar cuenta" aria-label="Quitar cuenta de ${u.nombre}">
            <span>✕</span>
          </button>
        </div>`;
    }).join('');

    const overlay = document.createElement('div');
    overlay.id = 'mt-account-modal';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Gestionar cuentas');
    overlay.innerHTML = `
      <style>
        #mt-account-modal {
          position:fixed;inset:0;z-index:9999;
          background:rgba(0,0,0,.6);
          backdrop-filter:blur(8px);
          display:flex;align-items:center;justify-content:center;
          padding:20px;
          animation:mtaaOverlayIn .2s ease;
        }
        @keyframes mtaaOverlayIn { from{opacity:0} to{opacity:1} }
        @keyframes mtaaBoxIn { from{opacity:0;transform:translateY(24px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }

        .mtaa-box {
          background:var(--surface,#faf7f2);
          border:1px solid var(--border,#d9d1c0);
          border-radius:20px;
          padding:0;
          width:100%;max-width:380px;
          box-shadow:0 32px 80px rgba(0,0,0,.22);
          font-family:var(--ff-body,'DM Sans',sans-serif);
          animation:mtaaBoxIn .32s cubic-bezier(.16,1,.3,1);
          overflow:hidden;
        }
        .mtaa-header {
          padding:22px 24px 16px;
          border-bottom:1px solid var(--border,#d9d1c0);
        }
        .mtaa-header h3 {
          font-family:var(--ff-head,'Playfair Display',serif);
          font-size:1.1rem;font-weight:700;
          color:var(--text,#2c2416);margin-bottom:3px;
        }
        .mtaa-header p {
          font-size:.76rem;color:var(--text-muted,#a39880);
        }
        .mtaa-close {
          position:absolute;top:14px;right:14px;
          width:30px;height:30px;border-radius:50%;
          border:1px solid var(--border,#d9d1c0);
          background:var(--surface,#faf7f2);cursor:pointer;
          display:flex;align-items:center;justify-content:center;
          font-size:.8rem;color:var(--text-muted,#a39880);
          transition:background .15s,color .15s;
        }
        .mtaa-close:hover{background:var(--bg2,#ede8de);color:var(--text,#2c2416);}
        .mtaa-accounts { padding:10px 12px; }
        .mtaa-accounts-label {
          font-size:.62rem;font-weight:500;
          color:var(--text-muted,#a39880);
          letter-spacing:.07em;text-transform:uppercase;
          padding:4px 10px 8px;display:block;
        }
        .mtaa-acc-row {
          display:flex;align-items:center;gap:11px;
          padding:9px 10px;border-radius:11px;
          border:1px solid transparent;
          cursor:pointer;margin-bottom:4px;
          transition:background .13s,border-color .15s;
          position:relative;
        }
        .mtaa-acc-row:hover { background:var(--bg2,#ede8de);border-color:var(--border,#d9d1c0); }
        .mtaa-active {
          background:var(--accent-bg,#e8dfc8)!important;
          border-color:var(--accent,#7a5c3a)!important;
        }
        .mtaa-av {
          width:34px;height:34px;border-radius:50%;
          background:var(--btn-bg,#2c2416);color:var(--btn-txt,#faf7f2);
          display:flex;align-items:center;justify-content:center;
          font-size:.72rem;font-weight:600;flex-shrink:0;
          font-family:var(--ff-head,'Playfair Display',serif);
        }
        .mtaa-info { flex:1;min-width:0; }
        .mtaa-name {
          font-size:.8rem;font-weight:500;color:var(--text,#2c2416);
          white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
        }
        .mtaa-provider { font-size:.65rem;color:var(--text-muted,#a39880);font-weight:400; }
        .mtaa-mail {
          font-size:.69rem;color:var(--text-muted,#a39880);
          white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
        }
        .mtaa-rm {
          width:24px;height:24px;border-radius:50%;
          border:none;background:transparent;cursor:pointer;
          display:flex;align-items:center;justify-content:center;
          flex-shrink:0;opacity:.3;transition:opacity .15s,background .15s;
          font-size:.68rem;color:#c0392b;
        }
        .mtaa-rm:hover { opacity:1;background:rgba(192,57,43,.1); }
        .mtaa-divider {
          display:flex;align-items:center;gap:10px;
          padding:8px 22px;margin:4px 0;
        }
        .mtaa-divider::before,.mtaa-divider::after {
          content:'';flex:1;height:1px;background:var(--border,#d9d1c0);
        }
        .mtaa-divider span { font-size:.68rem;color:var(--text-muted,#a39880);white-space:nowrap; }
        .mtaa-add-section { padding:4px 12px 16px; }
        .mtaa-google-btn {
          width:100%;
          display:flex;align-items:center;justify-content:center;gap:10px;
          padding:10px 16px;
          border-radius:10px;
          border:1px solid var(--border,#d9d1c0);
          background:var(--surface,#faf7f2);
          font-family:var(--ff-body,'DM Sans',sans-serif);
          font-size:.83rem;font-weight:500;
          color:var(--text,#2c2416);
          cursor:pointer;
          transition:background .15s,border-color .15s,transform .12s;
          margin-bottom:8px;
        }
        .mtaa-google-btn:hover {
          background:var(--bg2,#ede8de);border-color:var(--text-muted,#a39880);
          transform:translateY(-1px);
        }
        .mtaa-google-btn:active { transform:translateY(0); }
        .mtaa-sep-text {
          text-align:center;font-size:.68rem;color:var(--text-muted,#a39880);
          margin:8px 0;
        }
        .mtaa-email-form { margin-top:4px; }
        .mtaa-grp { margin-bottom:10px; }
        .mtaa-lbl {
          display:block;font-size:.72rem;font-weight:500;
          color:var(--text-soft,#6b5e47);margin-bottom:4px;
        }
        .mtaa-inp {
          width:100%;padding:9px 12px;
          border:1px solid var(--border,#d9d1c0);border-radius:9px;
          background:var(--bg,#f5f0e8);color:var(--text,#2c2416);
          font-family:var(--ff-body,'DM Sans',sans-serif);font-size:.84rem;
          outline:none;transition:border-color .2s,box-shadow .2s;
        }
        .mtaa-inp:focus {
          border-color:var(--accent,#7a5c3a);
          box-shadow:0 0 0 3px var(--accent-bg,#e8dfc8);
        }
        .mtaa-err {
          font-size:.7rem;color:#c0392b;
          margin-top:4px;display:none;
          padding:6px 10px;background:#fdecea;
          border-radius:7px;
        }
        .mtaa-actions { display:flex;gap:8px;margin-top:12px; }
        .mtaa-btn {
          flex:1;padding:10px;border-radius:9px;
          font-size:.82rem;font-weight:500;
          font-family:var(--ff-body,'DM Sans',sans-serif);
          cursor:pointer;border:none;
          transition:opacity .18s,transform .12s;
        }
        .mtaa-btn:hover { opacity:.86;transform:translateY(-1px); }
        .mtaa-btn:active { transform:translateY(0); }
        .mtaa-btn.pri { background:var(--btn-bg,#2c2416);color:var(--btn-txt,#faf7f2); }
        .mtaa-btn.sec {
          background:var(--bg2,#ede8de);color:var(--text-soft,#6b5e47);
          border:1px solid var(--border,#d9d1c0);
        }
        .mtaa-btn.ld { pointer-events:none;opacity:.55; }
        .mtaa-no-accounts {
          padding:20px;text-align:center;
          font-size:.8rem;color:var(--text-muted,#a39880);
        }
      </style>

      <div class="mtaa-box" style="position:relative">
        <button class="mtaa-close" id="mtaa-close-btn" aria-label="Cerrar">✕</button>
        <div class="mtaa-header">
          <h3>Gestionar cuentas</h3>
          <p>Cambia de cuenta o agrega una nueva.</p>
        </div>

        <div class="mtaa-accounts">
          ${all.length > 0
            ? `<span class="mtaa-accounts-label">Cuentas guardadas</span>${savedRows}`
            : `<div class="mtaa-no-accounts">No hay cuentas guardadas aún.</div>`
          }
        </div>

        <div class="mtaa-divider"><span>agregar cuenta</span></div>

        <div class="mtaa-add-section">
          <div class="mtaa-email-form">
            <div class="mtaa-grp">
              <label class="mtaa-lbl" for="mtaa-correo">Correo electrónico</label>
              <input class="mtaa-inp" type="email" id="mtaa-correo"
                     placeholder="correo@ejemplo.com" autocomplete="email">
            </div>
            <div class="mtaa-grp">
              <label class="mtaa-lbl" for="mtaa-pass">Contraseña</label>
              <input class="mtaa-inp" type="password" id="mtaa-pass"
                     placeholder="••••••••" autocomplete="current-password">
              <div class="mtaa-err" id="mtaa-err"></div>
            </div>
            <div class="mtaa-actions">
              <button class="mtaa-btn sec" id="mtaa-cancel">Cancelar</button>
              <button class="mtaa-btn pri" id="mtaa-submit">Iniciar sesión</button>
            </div>
          </div>

          <div class="mtaa-divider" style="margin:16px 0 12px"><span>o continúa con</span></div>

          <button class="mtaa-google-btn" id="mtaa-google-btn">
            <svg width="18" height="18" viewBox="0 0 48 48" style="flex-shrink:0">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continuar con Google
          </button>

          <div style="text-align:center;margin-top:16px;font-size:.8rem;color:var(--text-muted,#a39880)">
            ¿No tienes cuenta? <a href="#" id="mtaa-signup-link" style="color:var(--accent,#7a5c3a);font-weight:500;text-decoration:none">Crear una</a>
          </div>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    _modalEl = overlay;

    // Cerrar
    overlay.addEventListener('click', e => { if (e.target === overlay) _closeModal(); });
    overlay.querySelector('#mtaa-close-btn').addEventListener('click', _closeModal);
    overlay.querySelector('#mtaa-cancel').addEventListener('click', _closeModal);

    // Google SSO
    overlay.querySelector('#mtaa-google-btn').addEventListener('click', () => {
      _closeModal();
      loginWithGoogle();
    });

    // Crear cuenta nueva
    overlay.querySelector('#mtaa-signup-link').addEventListener('click', e => {
      e.preventDefault();
      _closeModal();
      window.location.href = '/mt-signup.html';
    });

    // Switch de cuenta guardada
    overlay.querySelectorAll('[data-switch]').forEach(row => {
      const handler = e => {
        if (e.target.closest('[data-remove]')) return;
        _closeModal();
        switchAccount(row.dataset.switch);
      };
      row.addEventListener('click', handler);
      row.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') handler(e); });
    });

    // Quitar cuenta
    overlay.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const correo = btn.dataset.remove;
        _removeAccount(correo);
        if (getUser()?.correo === correo) clearUser();
        _closeModal();
        _openAddAccountModal();
      });
    });

    // Login con correo
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

      try {
        const res = await apiFetch('/login', { method: 'POST', body: { correo, password } });
        if (res.success && res.user) {
          saveUser(res.user);
          _closeModal();
          _applyUserUI(res.user);
          window.location.reload();
        } else {
          errEl.textContent = res.message || 'Correo o contraseña incorrectos.';
          errEl.style.display = 'block';
          submitBtn.classList.remove('ld');
          submitBtn.textContent = 'Iniciar sesión';
        }
      } catch {
        errEl.textContent = 'Error de conexión. Intenta de nuevo.';
        errEl.style.display = 'block';
        submitBtn.classList.remove('ld');
        submitBtn.textContent = 'Iniciar sesión';
      }
    }

    submitBtn.addEventListener('click', doSubmit);
    overlay.querySelector('#mtaa-pass').addEventListener('keydown', e => {
      if (e.key === 'Enter') doSubmit();
    });

    // Focus trap
    setTimeout(() => overlay.querySelector('#mtaa-correo')?.focus(), 80);

    // ESC para cerrar
    const escHandler = e => { if (e.key === 'Escape') { _closeModal(); document.removeEventListener('keydown', escHandler); } };
    document.addEventListener('keydown', escHandler);
  }

  /* ══════════════════════════════════════
     TOAST — Aviso tipo alerta HTML
     ══════════════════════════════════════ */
  function _showToast(msg) {
    const existing = document.getElementById('mt-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'mt-toast';
    toast.innerHTML = `
      <style>
        #mt-toast {
          position:fixed;top:20px;left:50%;transform:translateX(-50%);
          z-index:99999;
          background:var(--surface,#faf7f2);
          border:1px solid var(--border,#d9d1c0);
          border-left:4px solid #e74c3c;
          border-radius:12px;
          padding:16px 22px;
          box-shadow:0 12px 40px rgba(0,0,0,.18);
          display:flex;align-items:center;gap:12px;
          font-family:var(--ff-body,'DM Sans',sans-serif);
          font-size:.88rem;
          color:var(--text,#2c2416);
          animation:mtToastIn .3s cubic-bezier(.16,1,.3,1) both;
          max-width:90vw;
          pointer-events:auto;
        }
        @keyframes mtToastIn {
          from{opacity:0;transform:translateX(-50%) translateY(-16px) scale(.96)}
          to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}
        }
        @keyframes mtToastOut {
          from{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}
          to{opacity:0;transform:translateX(-50%) translateY(-16px) scale(.96)}
        }
        #mt-toast .mt-toast-icon {
          width:28px;height:28px;border-radius:50%;
          background:#fdecea;color:#c0392b;
          display:flex;align-items:center;justify-content:center;
          flex-shrink:0;font-size:1rem;font-weight:700;
        }
        #mt-toast .mt-toast-close {
          background:none;border:none;cursor:pointer;
          font-size:1rem;color:var(--text-muted,#a39880);
          padding:4px;line-height:1;
          transition:color .15s;
        }
        #mt-toast .mt-toast-close:hover{color:var(--text,#2c2416)}
      </style>
      <div class="mt-toast-icon">!</div>
      <span>${msg}</span>
      <button class="mt-toast-close" id="mt-toast-close" aria-label="Cerrar">✕</button>`;

    document.body.appendChild(toast);

    const closeBtn = toast.querySelector('#mt-toast-close');
    function dismiss() {
      toast.style.animation = 'mtToastOut .25s cubic-bezier(.4,0,1,1) forwards';
      setTimeout(() => { toast.remove(); window.location.reload(); }, 280);
    }
    closeBtn.addEventListener('click', dismiss);
    setTimeout(dismiss, 4000);
  }

  /* ══════════════════════════════════════
     ADMIN NAV
     ══════════════════════════════════════ */
  function _applyAdminNav(rol) {
    const canAdmin = ['admin', 'editor'].includes((rol || '').toLowerCase());
    const el = document.getElementById('adminNavItem');
    if (el) el.style.display = canAdmin ? '' : 'none';
    const lockIcon = el?.querySelector('.lock-icon');
    if (lockIcon) lockIcon.textContent = canAdmin ? 'lock_open' : 'lock';
    if (canAdmin) {
      sessionStorage.setItem('mt_admin_gate', 'mt_2025_secure');
      sessionStorage.setItem('mt_admin_role', (rol || '').toLowerCase());
    }
  }

  /* ══════════════════════════════════════
     UI HELPERS
     ══════════════════════════════════════ */
  function _applyUserUI(user) {
    const btn   = document.getElementById('userBtn');
    const stOut = document.getElementById('stateLoggedOut');
    const stIn  = document.getElementById('stateLoggedIn');

    if (btn) {
      btn.className = 'user-btn logged-in';
      if (user.avatar_url) {
        btn.innerHTML = `<img src="${user.avatar_url}" alt="${user.nombre}" style="display:block;width:36px;height:36px;object-fit:cover;border-radius:50%"><div class="online-dot"></div>`;
      } else {
        const initials = ((user.nombre?.[0] || '') + (user.apellido?.[0] || '')).toUpperCase() || '?';
        btn.innerHTML = `<span style="font-size:.72rem;font-weight:600;color:var(--accent-txt)">${initials}</span><div class="online-dot"></div>`;
      }
    }

    if (stOut) stOut.style.display = 'none';
    if (stIn)  stIn.style.display  = 'block';

    _setText('dpName',  user.nombre + (user.apellido ? ' ' + user.apellido : ''));
    _setText('dpEmail', user.correo || user.email || '');
    _setText('dpRole',  _rolLabel(user.rol));

    // Avatar dropdown
    const dpAvatar = document.getElementById('dpAvatar');
    if (dpAvatar) {
      if (user.avatar_url) {
        dpAvatar.innerHTML = `<img src="${user.avatar_url}" alt="${user.nombre}" style="display:block;width:44px;height:44px;object-fit:cover;border-radius:50%">`;
      } else {
        const initials = ((user.nombre?.[0] || '') + (user.apellido?.[0] || '')).toUpperCase() || '?';
        dpAvatar.innerHTML = `<span style="font-size:.9rem;font-weight:700;color:var(--accent-txt);font-family:var(--ff-head,'Playfair Display',serif)">${initials}</span>`;
      }
    }

    // Lista de cuentas
    const accList = document.getElementById('accountList');
    if (accList) _buildAccountList(accList, user);

    // Hook botón "Agregar cuenta"
    _hookAddAccountBtn();

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

    el.innerHTML = all.map(u => {
      const isActive = u.correo === activeUser.correo;
      const initials = ((u.nombre?.[0] || '') + (u.apellido?.[0] || '')).toUpperCase() || '?';
      const avatarHtml = u.avatar_url
        ? `<img src="${u.avatar_url}" alt="${u.nombre}" style="display:block;width:30px;height:30px;object-fit:cover;border-radius:50%">`
        : `<span style="font-size:.65rem;font-weight:600;font-family:var(--ff-head,'Playfair Display',serif)">${initials}</span>`;

      return `
        <button class="acc-row ${isActive ? 'active' : ''}"
                onclick="MTAuth._switchAccount('${u.correo}')">
          <div class="acc-av" style="${isActive ? 'border-color:var(--accent);background:var(--accent-bg)' : ''}">
            ${avatarHtml}
          </div>
          <div class="acc-body">
            <div class="acc-name">${u.nombre}${u.apellido ? ' ' + u.apellido : ''}
              ${u.provider === 'google' ? '<span style="font-size:.6rem;opacity:.55;margin-left:4px">· G</span>' : ''}
            </div>
            <div class="acc-role-badge"><span class="acc-role-dot"></span>${_rolLabel(u.rol)} · ${u.correo.split('@')[0]}</div>
          </div>
          ${isActive
            ? '<div class="acc-check"><span class="material-symbols-outlined">check_circle</span></div>'
            : '<div class="acc-online"></div>'}
        </button>`;
    }).join('');
  }

  function _hookAddAccountBtn() {
    document.querySelectorAll('.udd-item, button').forEach(item => {
      const label = item.querySelector('.udd-item-label') || item;
      const text  = (label.textContent || '').trim().toLowerCase();
      if (text === 'agregar cuenta' || text.includes('agregar cuenta')) {
        item.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          document.getElementById('userDropdown')?.classList.remove('open');
          _openAddAccountModal();
        };
      }
    });
  }

  function _rolLabel(rol) {
    return { admin: 'Admin', editor: 'Editor', cliente: 'Cliente' }[rol] || rol || '';
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

    if (user && !user.token) {
      clearUser();
      const path = window.location.pathname;
      if (!path.includes('mt-login') && !path.includes('mt-signup')) {
        window.location.href = '/mt-login.html';
      }
      return;
    }

    try {
      const res = await me();
      if (res.success && res.user) {
        _applyUserUI(res.user);
        const path = window.location.pathname;
        if (path.includes('mt-login') || path.includes('mt-signup')) {
          const dest = res.user.rol === 'admin' || res.user.rol === 'editor'
            ? '/admin-dashboard.html' : '/index.html';
          window.location.href = dest;
        }
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
    loginWithGoogle,
    updateProfile, updateAvatar,
    getPreferences, updatePreferences,
    getSessions, closeSession, closeAllSessions,
    exportData, deleteAccount,
    apiFetch,
    _applyUserUI,
    _switchAccount: switchAccount,
    _openAddAccountModal,
    _closeModal,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window);