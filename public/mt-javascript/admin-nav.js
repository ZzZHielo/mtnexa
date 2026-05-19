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

  function wireNotif() {
    document.addEventListener('click', function (e) {
      if (e.target.closest('#notifBtn') && typeof showToast === 'function') {
        showToast({
          icon: 'notifications',
          bg: 'var(--accent-bg)',
          tc: 'var(--accent)',
          title: 'Notificaciones',
          msg: 'No tienes notificaciones nuevas'
        });
      }
    });

    var dot = document.getElementById('notifDot');
    if (dot && typeof gsap !== 'undefined') {
      gsap.to(dot, { scale: 1.6, opacity: 0.4, duration: 0.95, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    }
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
