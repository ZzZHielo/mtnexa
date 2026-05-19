/* ── MultiTech i18n System ── */

const _lang={
  es:{
    'nav.inicio':'Inicio','nav.servicios':'Servicios','nav.plantillas':'Plantillas','nav.contacto':'Contacto','nav.admin':'Admin','nav.cta':'Cotizar',
    'admin.dashboard':'Dashboard','admin.proyectos':'Proyectos','admin.usuarios_normal':'Usuarios','admin.mensajes':'Mensajes','admin.clientes':'Clientes',
    'admin.finanzas':'Finanzas','admin.plantillas':'Plantillas','admin.cotizaciones':'Cotizaciones','admin.consultas':'Consultas','admin.config':'Configuración',
    'dd.login':'Iniciar sesión','dd.signup':'Crear cuenta','dd.request_access':'Solicitar acceso',
    'dd.switch_account':'Cambiar cuenta','dd.add_account':'Agregar cuenta',
    'dd.profile':'Perfil y ajustes','dd.security':'Seguridad','dd.notifications':'Notificaciones','dd.logout':'Cerrar sesión',
    'dd.welcome':'Bienvenido','dd.welcome_sub':'Accede a tu cuenta para gestionar proyectos y comunicaciones.',
    'dd.service_count':'6 servicios disponibles','dd.view_all':'Ver todos →',
    'dd.here':'← aquí',
    'page.dashboard':'<em>Dashboard</em>','page.proyectos':'<em>Proyectos</em>','page.usuarios_normal':'<em>Usuarios</em>','page.mensajes':'<em>Mensajes</em>',
    'page.clientes':'<em>Clientes</em>','page.finanzas':'<em>Finanzas</em>','page.plantillas':'<em>Plantillas</em>',
    'page.cotizaciones':'<em>Cotizaciones</em>','page.consultas':'<em>Consultas</em>','page.config':'<em>Configuración</em>',
    'page.home_title':'Diseño web y desarrollo <em>que convierte</em>',
    'page.home_sub':'Creamos experiencias digitales que impulsan tu negocio.',
    'page.servicios_title':'<em>Servicios</em>','page.contacto_title':'<em>Contacto</em>',
    'page.login_title':'<em>Iniciar sesión</em>','page.signup_title':'<em>Crear cuenta</em>',
    'misc.loading':'Cargando...','misc.error':'Error','misc.saved':'Guardado','misc.saving':'Guardando...',
    'misc.cancel':'Cancelar','misc.close':'Cerrar','misc.save':'Guardar','misc.copy_all':'Copiar todo',
    'misc.confirm_close_sessions':'¿Cerrar todas las sesiones excepto la actual?',
    'sidebar.secciones':'Secciones',
    'sidebar.cuenta':'Cuenta','sidebar.perfil':'Perfil','sidebar.seguridad':'Seguridad','sidebar.sesiones':'Sesiones',
    'sidebar.preferencias':'Preferencias','sidebar.apariencia':'Apariencia','sidebar.idioma':'Idioma y región','sidebar.notificaciones':'Notificaciones',
    'sidebar.sistema':'Sistema','sidebar.accesibilidad':'Accesibilidad','sidebar.privacidad':'Privacidad y datos','sidebar.integraciones':'Integraciones','sidebar.peligroso':'Zona de peligro',
    'page.greeting':'Mis <em>ajustes</em>','page.sub':'Perfil, seguridad, apariencia y preferencias de tu cuenta Multitech.',
    'profile.title':'Foto de <em>perfil</em>','profile.upload':'Subir foto','profile.delete':'Eliminar','profile.info_title':'Información <em>personal</em>',
    'profile.name':'Nombre','profile.name_ph':'Tu nombre','profile.lastname':'Apellido','profile.lastname_ph':'Tu apellido','profile.username':'Nombre de usuario','profile.username_ph':'@usuario',
    'profile.bio':'Biografía','profile.bio_ph':'Breve descripción...',
    'profile.contact_title':'Datos de <em>contacto</em>','profile.contact_save':'Guardar',
    'profile.email':'Correo electrónico','profile.phone':'WhatsApp / Teléfono','profile.phone_ph':'+1 809 555 0100',
    'profile.company':'Empresa / organización','profile.company_ph':'Multitech','profile.website':'Sitio web','profile.website_ph':'https://',
    'profile.save_bar':'Los cambios se guardan en tu cuenta','profile.undo':'Deshacer','profile.save_changes':'Guardar cambios',
    'sec.pass_title':'<em>Contraseña</em>','sec.pass_change_btn':'Cambiar','sec.pass_create_btn':'Crear',
    'sec.pass_hint':'No tienes una contraseña establecida. Crea una para acceder sin necesidad de Google.',
    'sec.pass_current':'Contraseña actual','sec.pass_current_ph':'••••••••',
    'sec.pass_new':'Nueva contraseña','sec.pass_confirm':'Confirmar contraseña','sec.pass_ph':'••••••••',
    'sec.pass_strength_hint':'Ingresa una nueva contraseña',
    'sec.status_title':'Estado de <em>seguridad</em>',
    'sec.pass_label':'Contraseña fuerte','sec.pass_desc':'Contiene mayúsculas, números y símbolos',
    'sec.2fa_label':'Autenticación de dos factores (2FA)','sec.2fa_desc':'Protege tu cuenta con un segundo paso',
    'sec.email_label':'Correo verificado','sec.email_desc':'Tu correo está confirmado',
    'sec.phone_label':'Verificación por teléfono','sec.phone_desc':'Número no vinculado',
    'sec.2fa_title':'Dos factores <em>(2FA)</em>','sec.2fa_setup_btn':'Configurar',
    'sec.2fa_start_label':'Activar 2FA con app autenticadora','sec.2fa_start_desc':'Google Authenticator, Authy u otra app compatible',
    'sec.2fa_enable_btn':'Activar 2FA','sec.2fa_disable_btn':'Desactivar 2FA',
    'sec.2fa_scan':'Escanea este código con tu app autenticadora','sec.2fa_or_manual':'O ingresa manualmente esta clave secreta:',
    'sec.2fa_code_ph':'Código de 6 dígitos','sec.2fa_verify_btn':'Verificar y activar','sec.2fa_cancel_btn':'Cancelar',
    'sec.recovery_label':'Códigos de recuperación','sec.recovery_desc':'Genera códigos de respaldo de un solo uso','sec.recovery_btn':'Generar',
    'session.title':'Dispositivos <em>conectados</em>','session.close_remote':'Cerrar remotas','session.loading':'Cargando sesiones...','session.empty':'No hay sesiones activas',
    'session.current':'✦ Sesión actual',
    'app.theme_title':'Tema de <em>color</em>','app.save':'Guardar',
    'app.display_title':'Preferencias de <em>visualización</em>',
    'app.anim_label':'Animaciones de interfaz','app.anim_desc':'Transiciones y micro-interacciones',
    'app.compact_label':'Modo compacto','app.compact_desc':'Reduce el espacio entre elementos',
    'app.textsize_label':'Tamaño de texto','app.textsize_desc':'Ajusta el tamaño base de la tipografía',
    'app.textsize_sm':'Pequeño (14px)','app.textsize_normal':'Normal (16px)','app.textsize_lg':'Grande (18px)',
    'app.sync_bar':'Apariencia sincronizada con tu cuenta','app.reset':'Restablecer',
    'lang.title':'Idioma y <em>región</em>','lang.save_btn':'Guardar',
    'lang.select_label':'Idioma de la interfaz','lang.es':'Español (RD)','lang.en':'English (US)',
    'lang.tz_label':'Zona horaria','lang.tz_offset':'','lang.date_label':'Formato de fecha','lang.time_label':'Formato de hora','lang.currency_label':'Moneda',
    'lang.save_bar':'Se aplicarán al recargar la página','lang.cancel':'Cancelar',
    'lang.saved':'Idioma','lang.saved_msg':'Preferencia guardada','lang.region_saved':'Región','lang.region_saved_msg':'Preferencias regionales guardadas',
    'notif.title':'Canales de <em>notificación</em>','notif.save_btn':'Guardar',
    'notif.push_label':'Push en el navegador','notif.push_desc':'Requiere permiso del navegador',
    'notif.email_label':'Correo electrónico','notif.email_desc':'Resumen diario y alertas importantes',
    'notif.whatsapp_label':'WhatsApp','notif.whatsapp_desc':'Solo alertas críticas',
    'notif.events_title':'Tipos de <em>evento</em>',
    'notif.quote':'Nueva cotización recibida','notif.quote_desc':'Cuando un cliente envía una solicitud',
    'notif.message':'Nuevo mensaje de contacto','notif.message_desc':'Mensajes del formulario de contacto',
    'notif.subscriber':'Nuevo suscriptor','notif.subscriber_desc':'Alguien se suscribió al newsletter',
    'notif.login':'Inicio de sesión nuevo','notif.login_desc':'Cada vez que alguien accede a tu cuenta',
    'notif.dnd_label':'Modo «No molestar»','notif.dnd_desc':'Silencia todas las notificaciones de 22:00 a 08:00',
    'notif.save_bar':'Preferencias de notificación','notif.cancel':'Cancelar','notif.save':'Guardar',
    'acc.motion_title':'Movimiento y <em>animación</em>',
    'acc.reduce_label':'Reducir movimiento','acc.reduce_desc':'Minimiza efectos de transición y paralaje',
    'acc.loading_label':'Animaciones de carga','acc.loading_desc':'Skeletons y spinners mientras carga el contenido',
    'acc.contrast_title':'Contraste y <em>visibilidad</em>',
    'acc.highcontrast_label':'Alto contraste','acc.highcontrast_desc':'Aumenta la diferencia entre texto y fondo',
    'acc.underline_label':'Subrayar enlaces siempre','acc.underline_desc':'Hace los links más fáciles de identificar',
    'acc.focus_label':'Foco visible mejorado','acc.focus_desc':'Resalta el elemento seleccionado con teclado',
    'priv.visibility_title':'<em>Visibilidad</em>',
    'priv.profile_label':'Perfil visible para el equipo','priv.profile_desc':'Otros usuarios pueden ver tu perfil',
    'priv.online_label':'Mostrar estado «en línea»','priv.online_desc':'Otros ven cuándo estás activo',
    'priv.analytics_title':'Datos y <em>analytics</em>',
    'priv.share_label':'Compartir datos de uso anónimos','priv.share_desc':'Ayuda a mejorar la plataforma',
    'priv.cookies_label':'Cookies de personalización','priv.cookies_desc':'Recuerda tus preferencias de navegación',
    'priv.data_title':'Tus <em>datos</em>',
    'priv.export_label':'Descargar todos mis datos','priv.export_desc':'Exportación completa en formato JSON / CSV','priv.export_btn':'Exportar',
    'int.title':'Servicios <em>conectados</em>',
    'int.google_desc':'Autenticación y Google Drive','int.google_status':'Conectado',
    'int.whatsapp_desc':'Notificaciones y alertas','int.whatsapp_btn':'Conectar',
    'int.slack_desc':'Recibe alertas en tu workspace','int.slack_btn':'Conectar',
    'int.api_title':'API & <em>Webhooks</em>','int.api_copy_btn':'Copiar clave',
    'int.webhook_desc':'Recibe eventos en tiempo real','int.webhook_btn':'Configurar',
    'danger.title':'Zona de peligro',
    'danger.desc':'Las acciones en esta sección son permanentes e irreversibles. Procede con precaución.',
    'danger.panel_title':'Acciones <em>destructivas</em>',
    'danger.sessions_label':'Cerrar todas las sesiones activas','danger.sessions_desc':'Desconecta todos los dispositivos registrados','danger.sessions_btn':'Cerrar todo',
    'danger.revoke_label':'Revocar todas las integraciones','danger.revoke_desc':'Desconecta Google, Slack y otros servicios','danger.revoke_btn':'Revocar',
    'danger.export_label':'Exportar y eliminar mis datos','danger.export_desc':'Descarga un ZIP y elimina tu cuenta. Irreversible.','danger.export_btn':'Eliminar',
    'danger.delete_label':'Eliminar cuenta permanentemente','danger.delete_desc':'Se borrarán todos tus datos, cotizaciones y accesos.','danger.delete_btn':'Eliminar cuenta',
    'theme.beige':'Beige','theme.dark':'Dark','theme.blanc':'Blanc','theme.slate':'Slate','theme.sage':'Sage',
    'theme.switch':'Cambiar tema','theme.title':'Tema',
  },
  en:{
    'nav.inicio':'Home','nav.servicios':'Services','nav.plantillas':'Templates','nav.contacto':'Contact','nav.admin':'Admin','nav.cta':'Get a quote',
    'admin.dashboard':'Dashboard','admin.proyectos':'Projects','admin.usuarios_normal':'Users','admin.mensajes':'Messages','admin.clientes':'Clients',
    'admin.finanzas':'Finances','admin.plantillas':'Templates','admin.cotizaciones':'Quotes','admin.consultas':'Inquiries','admin.config':'Settings',
    'dd.login':'Log in','dd.signup':'Sign up','dd.request_access':'Request access',
    'dd.switch_account':'Switch account','dd.add_account':'Add account',
    'dd.profile':'Profile & settings','dd.security':'Security','dd.notifications':'Notifications','dd.logout':'Log out',
    'dd.welcome':'Welcome','dd.welcome_sub':'Access your account to manage projects and communications.',
    'dd.service_count':'6 services available','dd.view_all':'View all →',
    'dd.here':'← here',
    'page.dashboard':'<em>Dashboard</em>','page.proyectos':'<em>Projects</em>','page.usuarios_normal':'<em>Users</em>','page.mensajes':'<em>Messages</em>',
    'page.clientes':'<em>Clients</em>','page.finanzas':'<em>Finances</em>','page.plantillas':'<em>Templates</em>',
    'page.cotizaciones':'<em>Quotes</em>','page.consultas':'<em>Inquiries</em>','page.config':'<em>Settings</em>',
    'page.home_title':'Web design and development <em>that converts</em>',
    'page.home_sub':'We create digital experiences that drive your business forward.',
    'page.servicios_title':'<em>Services</em>','page.contacto_title':'<em>Contact</em>',
    'page.login_title':'<em>Log in</em>','page.signup_title':'<em>Sign up</em>',
    'misc.loading':'Loading...','misc.error':'Error','misc.saved':'Saved','misc.saving':'Saving...',
    'misc.cancel':'Cancel','misc.close':'Close','misc.save':'Save','misc.copy_all':'Copy all',
    'misc.confirm_close_sessions':'Close all sessions except current?',
    'sidebar.secciones':'Sections',
    'sidebar.cuenta':'Account','sidebar.perfil':'Profile','sidebar.seguridad':'Security','sidebar.sesiones':'Sessions',
    'sidebar.preferencias':'Preferences','sidebar.apariencia':'Appearance','sidebar.idioma':'Language & Region','sidebar.notificaciones':'Notifications',
    'sidebar.sistema':'System','sidebar.accesibilidad':'Accessibility','sidebar.privacidad':'Privacy & Data','sidebar.integraciones':'Integrations','sidebar.peligroso':'Danger Zone',
    'page.greeting':'My <em>settings</em>','page.sub':'Profile, security, appearance and preferences for your Multitech account.',
    'profile.title':'<em>Profile</em> photo','profile.upload':'Upload photo','profile.delete':'Delete','profile.info_title':'<em>Personal</em> information',
    'profile.name':'First name','profile.name_ph':'Your name','profile.lastname':'Last name','profile.lastname_ph':'Your last name','profile.username':'Username','profile.username_ph':'@username',
    'profile.bio':'Biography','profile.bio_ph':'Brief description...',
    'profile.contact_title':'<em>Contact</em> details','profile.contact_save':'Save',
    'profile.email':'Email','profile.phone':'Phone / WhatsApp','profile.phone_ph':'+1 809 555 0100',
    'profile.company':'Company / organization','profile.company_ph':'Multitech','profile.website':'Website','profile.website_ph':'https://',
    'profile.save_bar':'Changes are saved to your account','profile.undo':'Undo','profile.save_changes':'Save changes',
    'sec.pass_title':'<em>Password</em>','sec.pass_change_btn':'Change','sec.pass_create_btn':'Create',
    'sec.pass_hint':'You don\'t have a password yet. Create one to log in without Google.',
    'sec.pass_current':'Current password','sec.pass_current_ph':'••••••••',
    'sec.pass_new':'New password','sec.pass_confirm':'Confirm password','sec.pass_ph':'••••••••',
    'sec.pass_strength_hint':'Enter a new password',
    'sec.status_title':'<em>Security</em> status',
    'sec.pass_label':'Strong password','sec.pass_desc':'Contains uppercase, numbers and symbols',
    'sec.2fa_label':'Two-factor authentication (2FA)','sec.2fa_desc':'Protect your account with a second step',
    'sec.email_label':'Email verified','sec.email_desc':'Your email is confirmed',
    'sec.phone_label':'Phone verification','sec.phone_desc':'Unlinked number',
    'sec.2fa_title':'Two-factor <em>(2FA)</em>','sec.2fa_setup_btn':'Setup',
    'sec.2fa_start_label':'Enable 2FA with authenticator app','sec.2fa_start_desc':'Google Authenticator, Authy or other compatible app',
    'sec.2fa_enable_btn':'Enable 2FA','sec.2fa_disable_btn':'Disable 2FA',
    'sec.2fa_scan':'Scan this code with your authenticator app','sec.2fa_or_manual':'Or enter this secret key manually:',
    'sec.2fa_code_ph':'6-digit code','sec.2fa_verify_btn':'Verify & activate','sec.2fa_cancel_btn':'Cancel',
    'sec.recovery_label':'Recovery codes','sec.recovery_desc':'Generate one-time backup codes','sec.recovery_btn':'Generate',
    'session.title':'<em>Connected</em> devices','session.close_remote':'Close remote','session.loading':'Loading sessions...','session.empty':'No active sessions',
    'session.current':'✦ Current session',
    'app.theme_title':'<em>Color</em> theme','app.save':'Save',
    'app.display_title':'<em>Display</em> preferences',
    'app.anim_label':'Interface animations','app.anim_desc':'Transitions and micro-interactions',
    'app.compact_label':'Compact mode','app.compact_desc':'Reduce spacing between elements',
    'app.textsize_label':'Text size','app.textsize_desc':'Adjust the base font size',
    'app.textsize_sm':'Small (14px)','app.textsize_normal':'Normal (16px)','app.textsize_lg':'Large (18px)',
    'app.sync_bar':'Appearance synced with your account','app.reset':'Reset',
    'lang.title':'Language & <em>Region</em>','lang.save_btn':'Save',
    'lang.select_label':'Interface language','lang.es':'Español (RD)','lang.en':'English (US)',
    'lang.tz_label':'Time zone','lang.tz_offset':'','lang.date_label':'Date format','lang.time_label':'Time format','lang.currency_label':'Currency',
    'lang.save_bar':'Applied after page reload','lang.cancel':'Cancel',
    'lang.saved':'Language','lang.saved_msg':'Preference saved','lang.region_saved':'Region','lang.region_saved_msg':'Regional preferences saved',
    'notif.title':'<em>Notification</em> channels','notif.save_btn':'Save',
    'notif.push_label':'Browser push','notif.push_desc':'Requires browser permission',
    'notif.email_label':'Email','notif.email_desc':'Daily digest and important alerts',
    'notif.whatsapp_label':'WhatsApp','notif.whatsapp_desc':'Critical alerts only',
    'notif.events_title':'<em>Event</em> types',
    'notif.quote':'New quote received','notif.quote_desc':'When a client sends a request',
    'notif.message':'New contact message','notif.message_desc':'Messages from the contact form',
    'notif.subscriber':'New subscriber','notif.subscriber_desc':'Someone subscribed to the newsletter',
    'notif.login':'New login','notif.login_desc':'Every time someone accesses your account',
    'notif.dnd_label':'Do Not Disturb mode','notif.dnd_desc':'Silence all notifications from 10 PM to 8 AM',
    'notif.save_bar':'Notification preferences','notif.cancel':'Cancel','notif.save':'Save',
    'acc.motion_title':'Motion & <em>animation</em>',
    'acc.reduce_label':'Reduce motion','acc.reduce_desc':'Minimize transition and parallax effects',
    'acc.loading_label':'Loading animations','acc.loading_desc':'Skeletons and spinners while content loads',
    'acc.contrast_title':'Contrast & <em>visibility</em>',
    'acc.highcontrast_label':'High contrast','acc.highcontrast_desc':'Increase the difference between text and background',
    'acc.underline_label':'Always underline links','acc.underline_desc':'Makes links easier to identify',
    'acc.focus_label':'Enhanced visible focus','acc.focus_desc':'Highlights the keyboard-selected element',
    'priv.visibility_title':'<em>Visibility</em>',
    'priv.profile_label':'Profile visible to team','priv.profile_desc':'Other users can see your profile',
    'priv.online_label':'Show online status','priv.online_desc':'Others see when you are active',
    'priv.analytics_title':'Data & <em>analytics</em>',
    'priv.share_label':'Share anonymous usage data','priv.share_desc':'Help improve the platform',
    'priv.cookies_label':'Personalization cookies','priv.cookies_desc':'Remembers your browsing preferences',
    'priv.data_title':'Your <em>data</em>',
    'priv.export_label':'Download all my data','priv.export_desc':'Complete export in JSON / CSV format','priv.export_btn':'Export',
    'int.title':'<em>Connected</em> services',
    'int.google_desc':'Authentication & Google Drive','int.google_status':'Connected',
    'int.whatsapp_desc':'Notifications & alerts','int.whatsapp_btn':'Connect',
    'int.slack_desc':'Receive alerts in your workspace','int.slack_btn':'Connect',
    'int.api_title':'API & <em>Webhooks</em>','int.api_copy_btn':'Copy key',
    'int.webhook_desc':'Receive real-time events','int.webhook_btn':'Configure',
    'danger.title':'Danger Zone',
    'danger.desc':'Actions in this section are permanent and irreversible. Proceed with caution.',
    'danger.panel_title':'<em>Destructive</em> actions',
    'danger.sessions_label':'Close all active sessions','danger.sessions_desc':'Disconnect all registered devices','danger.sessions_btn':'Close all',
    'danger.revoke_label':'Revoke all integrations','danger.revoke_desc':'Disconnect Google, Slack and other services','danger.revoke_btn':'Revoke',
    'danger.export_label':'Export and delete my data','danger.export_desc':'Download a ZIP and delete your account. Irreversible.','danger.export_btn':'Delete',
    'danger.delete_label':'Delete account permanently','danger.delete_desc':'All your data, quotes and access will be deleted.','danger.delete_btn':'Delete account',
    'theme.beige':'Beige','theme.dark':'Dark','theme.blanc':'Blanc','theme.slate':'Slate','theme.sage':'Sage',
    'theme.switch':'Switch theme','theme.title':'Theme',
  }
};

let _currentLang='es';
let _origStore=null;
let _initialTarget=localStorage.getItem('mt-lang')||'es';

function t(key){
  return _lang[_currentLang]?.[key]||_lang['es']?.[key]||key;
}

/* ── Build flat replacement pairs (skip HTML values) ── */
function _buildPairs(fromCode,toCode){
  var pairs=[];
  var from=_lang[fromCode]||{};
  var to=_lang[toCode]||{};
  for(var key in from){
    var fv=from[key],tv=to[key];
    if(fv&&tv&&fv!==tv&&fv.indexOf('<')===-1&&tv.indexOf('<')===-1){
      pairs.push({from:fv,to:tv});
    }
  }
  pairs.sort(function(a,b){return b.from.length-a.from.length;});
  return pairs;
}

/* ── Save original Spanish text of all text nodes ── */
function _saveOriginals(){
  if(_origStore)return;
  _origStore=[];
  var w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{
    acceptNode:function(n){
      var p=n.parentElement;
      if(!p||p.closest('script,style,svg,textarea,input,select,option,code,pre,noscript,[data-i18n],[data-i18n-html]'))return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  while(w.nextNode()){
    var node=w.currentNode;
    var txt=node.textContent.trim();
    if(txt)_origStore.push({node:node,text:txt});
  }
}

/* ── Auto-translate all text nodes ── */
function _autoTranslate(fromCode,toCode){
  if(!_origStore||fromCode===toCode)return;
  var pairs=_buildPairs(fromCode,toCode);
  if(!pairs.length)return;
  for(var i=0;i<_origStore.length;i++){
    var item=_origStore[i];
    var node=item.node;
    if(!node.parentNode)continue;
    var text=node.textContent;
    var changed=false;
    for(var p=0;p<pairs.length;p++){
      var pair=pairs[p];
      var idx=text.indexOf(pair.from);
      if(idx!==-1){
        text=text.split(pair.from).join(pair.to);
        changed=true;
      }
    }
    if(changed)node.textContent=text;
  }
}

function applyLang(code){
  if(code===_currentLang&&_origStore)return;
  _saveOriginals();
  var from=_currentLang;
  _currentLang=code;
  document.documentElement.setAttribute('lang',code);
  document.querySelectorAll('[data-i18n]').forEach(function(el){
    var key=el.dataset.i18n;
    var txt=t(key);
    if(el.isContentEditable||el.tagName==='INPUT'||el.tagName==='TEXTAREA')return;
    el.textContent=txt;
  });
  document.querySelectorAll('[data-i18n-html]').forEach(function(el){
    el.innerHTML=t(el.dataset.i18nHtml);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el){
    el.placeholder=t(el.dataset.i18nPlaceholder);
  });
  _autoTranslate(from,code);
  var sel=document.getElementById('langSelect');
  if(sel)sel.value=code;
}

function setLang(code){
  if(code===_currentLang)return;
  localStorage.setItem('mt-lang',code);
  applyLang(code);
}

/* ── Locale utilities ── */
function _tz(){return localStorage.getItem('mt-tz')||Intl.DateTimeFormat().resolvedOptions().timeZone||'America/Santo_Domingo';}
function _locale(){return(_currentLang||'es')==='en'?'en-US':'es-DO';}
function formatDateInTZ(date,style){
  var tz=_tz();
  var fmt=localStorage.getItem('mt-datefmt')||'DD/MM/YYYY';
  var tf=localStorage.getItem('mt-timefmt')||'12';
  if(date==null)date=new Date();
  if(typeof date==='string')date=new Date(date);
  var loc=_locale();
  var y=date.toLocaleDateString('en-US',{timeZone:tz,year:'numeric'});
  var mo=date.toLocaleDateString('en-US',{timeZone:tz,month:'2-digit'});
  var d=date.toLocaleDateString('en-US',{timeZone:tz,day:'2-digit'});
  var hr=date.toLocaleTimeString('en-US',{timeZone:tz,hour:'2-digit',hour12:false});
  var mn=date.toLocaleTimeString('en-US',{timeZone:tz,minute:'2-digit'});
  var sc=date.toLocaleTimeString('en-US',{timeZone:tz,second:'2-digit'});
  var ampm=date.toLocaleTimeString('en-US',{timeZone:tz,hour:'2-digit'}).includes('AM')?'AM':'PM';
  if(style==='relative'){
    var diff=Date.now()-date.getTime();
    var mins=Math.round(diff/60000);
    var lang=_currentLang||'es';
    if(mins<1)return lang==='en'?'now':'Ahora';
    if(mins<60)return lang==='en'?mins+' min ago':'hace '+mins+' min';
    var hrs=Math.round(mins/60);
    if(hrs<24)return lang==='en'?hrs+' h ago':'hace '+hrs+' h';
    return formatDateInTZ(date,'date');
  }
  if(style==='time'){
    if(tf==='24')return hr+':'+mn;
    var h12=parseInt(hr,10);var am=(h12<12);if(h12===0)h12=12;if(h12>12)h12-=12;
    return String(h12).padStart(2,'0')+':'+mn+' '+(am?'AM':'PM');
  }
  var dateStr;
  if(fmt==='MM/DD/YYYY')dateStr=mo+'/'+d+'/'+y;
  else if(fmt==='YYYY-MM-DD')dateStr=y+'-'+mo+'-'+d;
  else dateStr=d+'/'+mo+'/'+y;
  if(style==='datetime'){
    var tm=tf==='24'?hr+':'+mn:function(){var h12=parseInt(hr,10);var am=(h12<12);if(h12===0)h12=12;if(h12>12)h12-=12;return String(h12).padStart(2,'0')+':'+mn+' '+(am?'AM':'PM');}();
    return dateStr+' '+tm;
  }
  if(style==='full')return dateStr+' '+hr+':'+mn+':'+sc;
  if(style==='long'){
    var longOpts={timeZone:tz,weekday:'long',year:'numeric',month:'long',day:'numeric'};
    var s=new Intl.DateTimeFormat(loc,longOpts).format(date);
    return s.charAt(0).toUpperCase()+s.slice(1);
  }
  return dateStr;
}
function formatCurrency(amount,_showCode){
  var cur=localStorage.getItem('mt-currency')||'DOP';
  return new Intl.NumberFormat(_locale(),{style:'currency',currency:cur,minimumFractionDigits:2}).format(amount);
}
var _rates={DOP:60,USD:1,EUR:0.92};
function _priceBase(usd){return usd*_rates[localStorage.getItem('mt-currency')||'DOP'];}
function formatPrice(usd){
  var cur=localStorage.getItem('mt-currency')||'DOP';
  var amt=_priceBase(usd);
  var num=new Intl.NumberFormat(_locale(),{style:'decimal',minimumFractionDigits:0}).format(amt);
  return '$ '+num;
}
function applyCurrency(){
  var cur=localStorage.getItem('mt-currency')||'DOP';
  document.querySelectorAll('[data-price-usd]').forEach(function(el){
    var usd=parseFloat(el.dataset.priceUsd);
    if(isNaN(usd))return;
    el.textContent=formatPrice(usd)
      +(el.dataset.priceSuffix&&!el.dataset.priceSuffix.match(/^(USD|DOP|EUR)$/)?' '+el.dataset.priceSuffix:'');
  });
  document.querySelectorAll('.price-cur').forEach(function(el){el.textContent=cur});
  document.querySelectorAll('[data-price-range]').forEach(function(el){
    var parts=el.dataset.priceRange.split(',');
    var lo=parseFloat(parts[0]),hi=parseFloat(parts[1]);
    if(isNaN(lo)||isNaN(hi))return;
    el.textContent=formatPrice(lo)+'–'+formatPrice(hi)
      +(el.dataset.priceSuffix&&!el.dataset.priceSuffix.match(/^(USD|DOP|EUR)$/)?' '+el.dataset.priceSuffix:'');
  });
}

/* Auto-init on DOM ready */
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',function(){applyLang(_initialTarget);setTimeout(applyCurrency,50);});
} else {
  applyLang(_initialTarget);setTimeout(applyCurrency,50);
}
