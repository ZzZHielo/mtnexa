/**
 * ╔══════════════════════════════════════════════════════╗
 * ║    Multitech — API Client (Frontend Integration)     ║
 * ║    Incluye este archivo en tus páginas HTML o        ║
 * ║    impórtalo como módulo ES6.                        ║
 * ╚══════════════════════════════════════════════════════╝
 *
 * Uso básico:
 *   <script src="mt-api.js"></script>
 *   MultitechAPI.enviarCotizacion({...}).then(...)
 */

const MultitechAPI = (() => {
  const BASE_URL = 'http://localhost:3001/api'; // Cambiar en producción

  /* ── Utilidad fetch ── */
  async function apiFetch(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const defaults = {
      headers: { 'Content-Type': 'application/json' },
    };
    const config = { ...defaults, ...options };
    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }
    const res = await fetch(url, config);
    const data = await res.json();
    if (!res.ok) throw { status: res.status, ...data };
    return data;
  }

  /* ════════════════════════════════════════
     COTIZACIONES
     Conecta con: multitech-contacto.html → tab "Cotización de proyecto"
     ════════════════════════════════════════ */

  /**
   * Enviar cotización de proyecto
   * @param {Object} datos - Datos del formulario de cotización
   */
  async function enviarCotizacion(datos) {
    return apiFetch('/cotizaciones', { method: 'POST', body: datos });
  }

  /* ════════════════════════════════════════
     CONSULTAS GENERALES
     Conecta con: multitech-contacto.html → tab "Consulta general"
     ════════════════════════════════════════ */

  /**
   * Enviar consulta general
   * @param {Object} datos - { nombre, correo, asunto?, mensaje }
   */
  async function enviarConsulta(datos) {
    return apiFetch('/consultas', { method: 'POST', body: datos });
  }

  /* ════════════════════════════════════════
     PLANTILLAS
     Conecta con: multitech-plantillas.html
     ════════════════════════════════════════ */

  /**
   * Obtener catálogo de plantillas
   * @param {string} [categoria] - Filtrar por categoría
   */
  async function obtenerPlantillas(categoria = null) {
    const qs = categoria && categoria !== 'all' ? `?categoria=${categoria}` : '';
    return apiFetch(`/plantillas${qs}`);
  }

  /**
   * Solicitar plantilla personalizada
   * @param {Object} datos - Datos del formulario + preferencias del customizador
   */
  async function solicitarPlantilla(datos) {
    return apiFetch('/plantillas/solicitudes', { method: 'POST', body: datos });
  }

  /* ════════════════════════════════════════
     TEMAS
     Conecta con: mt-theme.js
     ════════════════════════════════════════ */

  /**
   * Guardar tema preferido del usuario en el servidor
   * @param {string} sessionId - ID de sesión del usuario
   * @param {string} tema - Nombre del tema (beige|dark|blanc|slate|sage)
   * @param {string} [pagina] - Página actual
   */
  async function guardarTema(sessionId, tema, pagina = '') {
    return apiFetch('/temas', {
      method: 'POST',
      body: { session_id: sessionId, tema, pagina },
    });
  }

  /**
   * Obtener tema guardado del usuario
   * @param {string} sessionId
   */
  async function obtenerTema(sessionId) {
    return apiFetch(`/temas/${sessionId}`);
  }

  /* ════════════════════════════════════════
     HELPERS DE FORMULARIOS
     Integración directa con los forms del HTML
     ════════════════════════════════════════ */

  /**
   * Leer todos los checkboxes marcados de un grupo
   * @param {string} containerSelector - selector del contenedor de checkboxes
   * @returns {string[]}
   */
  function leerCheckboxes(containerSelector) {
    return Array.from(document.querySelectorAll(`${containerSelector} input[type="checkbox"]:checked`))
      .map(cb => cb.closest('.check-item')?.querySelector('span')?.textContent?.trim() || '');
  }

  /**
   * Hook para el formulario de cotización (multitech-contacto.html)
   * Reemplaza la función submitForm() existente con integración real a la API
   *
   * @param {string} formContainerId   - ID del div que contiene el form
   * @param {string} successWrapperId  - ID del div de éxito
   */
  function hookFormCotizacion(formContainerId = 'formContainer', successWrapperId = 'successWrap') {
    const form    = document.getElementById(formContainerId);
    const success = document.getElementById(successWrapperId);
    const btn     = form?.querySelector('.btn-submit');
    if (!form || !success || !btn) return;

    btn.addEventListener('click', async (e) => {
      e.preventDefault();

      // Detectar tab activo
      const tabActivo = document.querySelector('.form-tab.active')?.textContent?.trim();
      const esCotizacion = tabActivo?.includes('Cotización') || tabActivo?.includes('proyecto');

      btn.textContent = 'Enviando...';
      btn.disabled = true;

      try {
        if (esCotizacion) {
          await enviarCotizacion({
            nombre:        form.querySelector('[placeholder="Tu nombre"]')?.value || '',
            apellido:      form.querySelector('[placeholder="Tu apellido"]')?.value || '',
            correo:        form.querySelector('[type="email"]')?.value || '',
            whatsapp:      form.querySelector('[type="tel"]')?.value || '',
            tipo_proyecto: form.querySelector('select')?.value || '',
            presupuesto:   form.querySelectorAll('select')[1]?.value || '',
            descripcion:   form.querySelector('textarea')?.value || '',
            funcionalidades: leerCheckboxes('#tab-cotizar'),
          });
        } else {
          await enviarConsulta({
            nombre:  form.querySelector('[placeholder="Tu nombre"]')?.value || '',
            correo:  form.querySelector('[type="email"]')?.value || '',
            asunto:  form.querySelector('[placeholder="¿En qué podemos ayudarte?"]')?.value || '',
            mensaje: form.querySelector('textarea')?.value || '',
          });
        }

        form.style.display = 'none';
        success.style.display = 'block';
      } catch (err) {
        console.error('[API] Error:', err);
        btn.textContent = 'Enviar solicitud →';
        btn.disabled = false;
        const msg = err?.errors?.[0]?.msg || err?.message || 'Error al enviar. Intenta de nuevo.';
        alert(msg);
      }
    });
  }

  /**
   * Hook para el formulario de plantillas (multitech-plantillas.html)
   */
  function hookFormPlantillas(formBodyId = 'formBody', successMsgId = 'successMsg', customizerId = 'personalizador') {
    const form    = document.getElementById(formBodyId);
    const success = document.getElementById(successMsgId);
    const btn     = form?.querySelector('.form-submit');
    if (!form || !success || !btn) return;

    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      btn.textContent = 'Enviando...';
      btn.disabled = true;

      // Leer preferencias del customizador si existen
      const colorPrim = document.querySelector('.sw[data-c].sel')?.dataset.c || '';
      const colorBg   = document.querySelector('.sw[data-bg].sel')?.dataset.bg || '';
      const fuente    = document.querySelector('.fo.sel')?.dataset.f || '';

      try {
        await solicitarPlantilla({
          nombre:          form.querySelector('[placeholder="Tu nombre"]')?.value || '',
          apellido:        form.querySelector('[placeholder="Tu apellido"]')?.value || '',
          correo:          form.querySelector('[type="email"]')?.value || '',
          whatsapp:        form.querySelector('[type="tel"]')?.value || '',
          tipo_proyecto:   form.querySelector('select')?.value || '',
          funcionalidades: leerCheckboxes('#formBody'),
          descripcion:     form.querySelector('textarea')?.value || '',
          color_prim:      colorPrim,
          color_bg:        colorBg,
          fuente:          fuente,
        });

        form.style.display = 'none';
        success.style.display = 'block';
      } catch (err) {
        console.error('[API] Error:', err);
        btn.textContent = 'Enviar solicitud →';
        btn.disabled = false;
        const msg = err?.errors?.[0]?.msg || err?.message || 'Error al enviar.';
        alert(msg);
      }
    });
  }

  /**
   * Integrar tema switcher con el backend
   * Llama a esto después de cargar mt-theme.js
   */
  function hookTemaSwitcher() {
    // Generar/recuperar session ID
    let sessionId = localStorage.getItem('mt_session');
    if (!sessionId) {
      sessionId = 'mt-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem('mt_session', sessionId);
    }

    // Aplicar tema guardado en servidor al cargar
    obtenerTema(sessionId).then(data => {
      if (data.tema && typeof mtApplyTheme === 'function') {
        mtApplyTheme(data.tema);
      }
    }).catch(() => {}); // silencioso si falla

    // Interceptar cambios de tema y guardarlos
    document.querySelectorAll('.mt-theme-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tema = btn.dataset.theme;
        if (tema) {
          guardarTema(sessionId, tema, window.location.pathname).catch(() => {});
        }
      });
    });
  }

  /* ── API pública ── */
  return {
    enviarCotizacion,
    enviarConsulta,
    obtenerPlantillas,
    solicitarPlantilla,
    guardarTema,
    obtenerTema,
    hookFormCotizacion,
    hookFormPlantillas,
    hookTemaSwitcher,
  };
})();

/* Auto-hook si DOM ya está listo */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => MultitechAPI.hookTemaSwitcher?.());
} else {
  MultitechAPI.hookTemaSwitcher?.();
}
