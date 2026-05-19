/** Valores por defecto de configuración del sistema */
const DEFAULT_CONFIG = {
  empresa: {
    nombre: 'Multitech Solutions',
    rnc: '',
    telefono: '+1 (809) 555-0100',
    email: 'info@multitech.com',
    direccion: 'Santiago, República Dominicana',
    descripcion: 'Soluciones tecnológicas a medida para empresas en República Dominicana.',
  },
  sistema: {
    moneda: 'USD',
    idioma: 'es',
    timezone: 'America/Santo_Domingo',
    mantenimiento: false,
  },
  clientes: {
    aprobacion_manual: true,
    portal_activo: true,
    vip_auto: true,
    vip_umbral: 5000,
  },
  roles: {
    editor_eliminar: false,
    viewer_finanzas: true,
    invitaciones: true,
  },
  notificaciones: {
    nuevo_lead: true,
    proyecto_entregado: true,
    pago_registrado: true,
    mensaje_contacto: false,
    nuevo_dispositivo: true,
    canal_email: true,
    canal_whatsapp: false,
    canal_panel: true,
    email_destino: 'admin@multitech.com',
  },
  seguridad: {
    tfa_obligatorio: false,
    sesion_minutos: 60,
    login_intentos: 5,
    ip_whitelist: '',
    pwd_min: 8,
    pwd_especial: true,
    pwd_expiracion: '90',
  },
  integraciones: {
    smtp_conectado: false,
    smtp_host: '',
    analytics_conectado: false,
    analytics_id: '',
    pagos_conectado: false,
    whatsapp_conectado: false,
    api_key: '',
    webhook_url: '',
  },
  defaults_usuario: {
    tema: 'beige',
    idioma: 'es',
    timezone: 'America/Santo_Domingo',
    formato_fecha: 'DD/MM/YYYY',
    formato_hora: '12h',
    permitir_cambio_idioma: true,
    notif_cotizacion: true,
    notif_mensaje: true,
    notif_pago: true,
    notif_login: true,
    notif_email: true,
    notif_push: false,
    notif_whatsapp: false,
    notif_panel: true,
    no_molestar: false,
    horario_inicio: '08:00',
    horario_fin: '22:00',
    permitir_editar_notif: true,
    perfil_visible: true,
    estado_online: true,
    analytics_anonimos: true,
    cookies: true,
    reducir_movimiento: true,
    skeletons: true,
    foco_mejorado: true,
  },
};

function deepMerge(target, source) {
  const out = { ...target };
  for (const key of Object.keys(source || {})) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      out[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      out[key] = source[key];
    }
  }
  return out;
}

module.exports = { DEFAULT_CONFIG, deepMerge };
