(function () {
  const OS = (function detectOS() {
    const ua = navigator.userAgent;
    if (/android/i.test(ua)) return 'android';
    if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) return 'ios';
    return 'other';
  })();

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone
    || window.matchMedia('(display-mode: fullscreen)').matches;

  if (isStandalone || window.innerWidth >= 768) return;

  const overlay = document.getElementById('pwaOverlay');
  let deferredPrompt = null;

  function renderSteps() {
    const container = document.getElementById('pwaStepsContainer');
    if (!container) return;
    container.innerHTML = '';

    const steps = OS === 'android' ? [
      { num: '1', text: 'Abre el menú <span class="pwa-share-icon"><span class="material-symbols-outlined">more_vert</span> Chrome</span>' },
      { num: '2', text: 'Toca <strong>Instalar aplicación</strong> o <strong>Agregar a pantalla de inicio</strong>' },
      { num: '3', text: 'Confirma tocando <strong>Instalar</strong>' },
    ] : [
      { num: '1', text: 'Toca <span class="pwa-share-icon"><span class="material-symbols-outlined">ios_share</span> Compartir</span> en Safari' },
      { num: '2', text: 'Desplázate y selecciona <strong>Agregar a Inicio</strong>' },
      { num: '3', text: 'Toca <strong>Agregar</strong> en la esquina superior derecha' },
    ];

    steps.forEach(s => {
      const div = document.createElement('div');
      div.className = 'pwa-step';
      div.innerHTML = `<div class="pwa-step-num">${s.num}</div><div class="pwa-step-text">${s.text}</div>`;
      container.appendChild(div);
    });
  }

  function setupInstallButton() {
    const btn = document.getElementById('pwaInstallBtn');
    if (!btn) return;

    if (OS === 'android' && deferredPrompt) {
      btn.style.display = 'flex';
      btn.style.alignItems = 'center';
      btn.style.justifyContent = 'center';
      btn.style.gap = '8px';
    }
  }

  window.triggerPwaInstall = function () {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function (choiceResult) {
      if (choiceResult.outcome === 'accepted') {
        overlay.classList.remove('show');
      }
      deferredPrompt = null;
      const btn = document.getElementById('pwaInstallBtn');
      if (btn) btn.style.display = 'none';
    });
  };

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    setupInstallButton();
  });

  renderSteps();
  overlay.classList.add('show');
})();
