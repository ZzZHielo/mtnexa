/* ══ Shared Admin Nav Loader ══ */
(function () {
  'use strict';

  if (document.body) document.body.classList.add('has-admin-nav');

  var MODULE_PAGES = [
    'admin-proyectos.html', 'admin-cotizaciones.html', 'admin-consultas.html',
    'admin-usuarios-normal.html', 'admin-mensajes.html', 'admin-clientes.html',
    'admin-finanzas.html', 'admin-encuestas.html'
  ];

  var currentPage = window.location.pathname.split('/').pop() || 'admin-dashboard.html';

  function markActive(nav) {
    var navCenter = nav.querySelector('#navCenter');
    if (!navCenter) return;

    navCenter.querySelectorAll('.nav-link').forEach(function (l) {
      l.classList.remove('active');
    });
    navCenter.querySelectorAll('.dd-item').forEach(function (l) {
      l.classList.remove('active');
    });

    if (currentPage === 'admin-dashboard.html') {
      var dash = navCenter.querySelector('a[href="admin-dashboard.html"]');
      if (dash) dash.classList.add('active');
    } else if (currentPage === 'admin-config.html') {
      var cfg = navCenter.querySelector('a[href="admin-config.html"]');
      if (cfg) cfg.classList.add('active');
    } else if (MODULE_PAGES.indexOf(currentPage) !== -1) {
      var modBtn = navCenter.querySelector('#modulosNavItem > button.nav-link');
      if (modBtn) modBtn.classList.add('active');
      var ddItem = navCenter.querySelector('.dd-item[href="' + currentPage + '"]');
      if (ddItem) ddItem.classList.add('active');
    }
  }

  function positionPill(nav) {
    var pill = document.getElementById('navPill');
    var navCenter = document.getElementById('navCenter');
    if (!pill || !navCenter) return;

    function getActiveLink() {
      return navCenter.querySelector('.nav-link.active') ||
        navCenter.querySelector('.nav-link-admin');
    }

    function moveTo(el) {
      if (!el) {
        pill.style.opacity = '0';
        return;
      }
      var r = el.getBoundingClientRect();
      var cr = navCenter.getBoundingClientRect();
      pill.style.opacity = '1';
      pill.style.width = r.width + 'px';
      pill.style.height = r.height + 'px';
      pill.style.left = (r.left - cr.left) + 'px';
      pill.style.top = (r.top - cr.top) + 'px';
    }

    var savedTransition = pill.style.transition;
    pill.style.transition = 'none';

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        moveTo(getActiveLink());
        pill.style.transition = savedTransition || '';
      });
    });

    navCenter.querySelectorAll('.nav-link').forEach(function (link) {
      link.addEventListener('mouseenter', function () { moveTo(link); });
    });

    navCenter.addEventListener('mouseleave', function () {
      moveTo(getActiveLink());
    });

    window.addEventListener('resize', function () {
      moveTo(getActiveLink());
    });
  }

  function applyAuthUI() {
    if (typeof MTAuth === 'undefined' || typeof MTAuth._applyUserUI !== 'function') return;
    var u = MTAuth.getUser && MTAuth.getUser();
    MTAuth._applyUserUI(u || null);
  }

  var API = window.location.hostname === 'localhost'
    ? 'http://localhost:3001/api'
    : window.location.origin + '/api';

  function formatNotifTime(dateStr) {
    var d = new Date(dateStr);
    var now = new Date();
    var diff = (now - d) / 1000;
    if (diff < 60) return 'ahora';
    if (diff < 3600) return Math.floor(diff/60) + 'm';
    if (diff < 86400) return Math.floor(diff/3600) + 'h';
    if (diff < 172800) return 'ayer';
    return d.toLocaleDateString('es-DO', { day:'numeric', month:'short' });
  }

  function renderNotifList(notifs) {
    var list = document.getElementById('notifList');
    if (!list) return;
    if (!notifs || notifs.length === 0) {
      list.innerHTML = '<div class="nt-empty"><span class="ms" style="font-size:1.6rem;opacity:.2">notifications_off</span><p>No hay notificaciones</p></div>';
      return;
    }
    var icons = { cotizacion:'request_quote', consulta:'help', proyecto:'folder_open', lead:'person_add', conversacion:'chat', transaccion:'payments', cliente:'group', mensaje:'mail' };
    list.innerHTML = notifs.map(function (n) {
      var ico = icons[n.tipo] || 'circle';
      return '<div class="nt-item' + (n.leida ? '' : ' nt-unread') + '" data-id="' + n.id + '" onclick="marcarLeida(' + n.id + ',this)">' +
        '<div class="nt-ico"><span class="ms">' + ico + '</span></div>' +
        '<div class="nt-body"><div class="nt-titulo">' + n.titulo + '</div>' +
        (n.mensaje ? '<div class="nt-msg">' + n.mensaje + '</div>' : '') +
        '<div class="nt-time">' + formatNotifTime(n.created_at) + '</div></div></div>';
    }).join('');
  }

  function fetchNotifs() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', API + '/notificaciones/no-leidas', true);
    xhr.setRequestHeader('X-Admin-Key', window.ADMIN_KEY || 'multitech-admin-2025');
    xhr.onload = function () {
      if (xhr.status !== 200) return;
      var r;
      try { r = JSON.parse(xhr.responseText); } catch(e) { return; }
      if (!r.success) return;
      var total = r.total || 0;
      var dot = document.getElementById('notifDot');
      if (dot) {
        if (total > 0) {
          dot.style.display = '';
          if (typeof gsap !== 'undefined') {
            if (!window._notifPulse) {
              window._notifPulse = gsap.to(dot, { scale: 1.6, opacity: 0.4, duration: 0.95, repeat: -1, yoyo: true, ease: 'sine.inOut' });
            }
          }
        } else {
          dot.style.display = 'none';
          if (window._notifPulse) { window._notifPulse.kill(); window._notifPulse = null; }
        }
      }
      if (document.getElementById('notifDropdown') && document.getElementById('notifDropdown').classList.contains('open')) {
        renderNotifList(r.data);
      }
      window._notifCache = r;
    };
    xhr.send();
  }

  function openNotifDropdown() {
    var dd = document.getElementById('notifDropdown');
    if (!dd) return;
    var isOpen = dd.classList.contains('open');
    document.querySelectorAll('.notif-dropdown.open').forEach(function (el) { el.classList.remove('open'); });
    if (!isOpen) {
      dd.classList.add('open');
      if (window._notifCache) renderNotifList(window._notifCache.data);
      else fetchNotifs();
    }
  }

  window.marcarLeida = function (id, el) {
    if (el) el.classList.remove('nt-unread');
    var xhr = new XMLHttpRequest();
    xhr.open('PATCH', API + '/notificaciones/' + id + '/leer', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('X-Admin-Key', window.ADMIN_KEY || 'multitech-admin-2025');
    xhr.onload = function () { fetchNotifs(); };
    xhr.send();
  };

  window.marcarTodasLeidas = function () {
    var xhr = new XMLHttpRequest();
    xhr.open('PATCH', API + '/notificaciones/leer-todas', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('X-Admin-Key', window.ADMIN_KEY || 'multitech-admin-2025');
    xhr.onload = function () {
      document.querySelectorAll('.nt-unread').forEach(function (el) { el.classList.remove('nt-unread'); });
      fetchNotifs();
    };
    xhr.send();
  };

  function wireNotif() {
    document.addEventListener('click', function (e) {
      var dd = document.getElementById('notifDropdown');
      var wrap = document.getElementById('notifWrap');
      if (e.target.closest('#notifBtn')) {
        openNotifDropdown();
      } else if (dd && wrap && !wrap.contains(e.target)) {
        dd.classList.remove('open');
      }
    });

    fetchNotifs();
    setInterval(fetchNotifs, 15000);
  }

  window.toggleDropdown = function (id, e) {
    if (e) e.stopPropagation();
    var dd = document.getElementById(id);
    if (!dd) return;
    var item = dd.closest('.nav-dd-item');
    var chv = item && item.querySelector('.nav-chevron');
    var isOpen = dd.classList.contains('open');

    document.querySelectorAll('.dropdown.open').forEach(function (el) {
      if (el !== dd) {
        el.classList.remove('open');
        var otherItem = el.closest('.nav-dd-item');
        var otherChv = otherItem && otherItem.querySelector('.nav-chevron');
        if (otherChv) otherChv.classList.remove('open');
      }
    });

    dd.classList.toggle('open', !isOpen);
    if (chv) chv.classList.toggle('open', !isOpen);
  };

  window.toggleMenu = function () {
    var n = document.getElementById('navCenter');
    var h = document.getElementById('hamburger');
    if (n) n.classList.toggle('open');
    if (h) h.classList.toggle('open');
  };

  window.handleUserBtn = function () {
    if (typeof MTAuth !== 'undefined' && MTAuth.isLogged && MTAuth.isLogged()) {
      var dd = document.getElementById('userDropdown');
      if (dd) dd.classList.toggle('open');
    } else {
      window.location.href = 'mt-signup.html';
    }
  };

  window.doLogout = function () {
    if (typeof MTAuth !== 'undefined' && MTAuth.logout) MTAuth.logout();
  };

  document.addEventListener('click', function (ev) {
    document.querySelectorAll('.dropdown.open').forEach(function (dd) {
      var item = dd.closest('.nav-dd-item');
      if (!item || !item.contains(ev.target)) {
        dd.classList.remove('open');
        var chv = item && item.querySelector('.nav-chevron');
        if (chv) chv.classList.remove('open');
      }
    });

    var wrap = document.getElementById('userBtnWrap');
    if (wrap && !wrap.contains(ev.target)) {
      var udd = document.getElementById('userDropdown');
      if (udd) udd.classList.remove('open');
    }

    var navCenter = document.getElementById('navCenter');
    var hamburger = document.getElementById('hamburger');
    if (navCenter && navCenter.classList.contains('open') &&
        !navCenter.contains(ev.target) &&
        hamburger && !hamburger.contains(ev.target)) {
      navCenter.classList.remove('open');
      hamburger.classList.remove('open');
    }
  });

  var navCenterEl = document.getElementById('navCenter');
  if (navCenterEl) {
    navCenterEl.querySelectorAll('.nav-link, .nav-cta').forEach(function (l) {
      l.addEventListener('click', function () {
        navCenterEl.classList.remove('open');
        var h = document.getElementById('hamburger');
        if (h) h.classList.remove('open');
      });
    });
  }

  fetch('/admin-nav.html')
    .then(function (r) { return r.text(); })
    .then(function (html) {
      var wrapper = document.createElement('div');
      wrapper.innerHTML = html;
      var nav = wrapper.querySelector('nav');
      if (!nav) return;

      document.body.classList.add('has-admin-nav');
      document.body.insertAdjacentElement('afterbegin', nav);

      markActive(nav);
      positionPill(nav);
      wireNotif();

      if (typeof MTAuth !== 'undefined') {
        applyAuthUI();
      } else {
        var attempts = 0;
        var interval = setInterval(function () {
          attempts++;
          if (typeof MTAuth !== 'undefined') {
            clearInterval(interval);
            applyAuthUI();
          }
          if (attempts > 40) clearInterval(interval);
        }, 100);
      }
    })
    .catch(function (e) { console.error('[admin-nav] Error loading nav:', e); });
})();
