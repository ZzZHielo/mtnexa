/**
 * ╔══════════════════════════════════════════════════════╗
 * ║       Multitech — Database Module (MySQL)            ║
 * ║  Motor : mysql2 con connection pool                  ║
 * ║  Config: variables de entorno (.env)                 ║
 * ╚══════════════════════════════════════════════════════╝
 */

const mysql = require('mysql2/promise');

let pool = null;

/* ══════════════════════════════════════
   CREAR POOL DE CONEXIONES
   ══════════════════════════════════════ */
function createPool() {
  const usePipe = process.env.DB_PIPE === 'true';
  const config = {
    user:               process.env.DB_USER     || 'root',
    password:           process.env.DB_PASSWORD || '',
    database:           process.env.DB_NAME     || 'mtnexa',
    waitForConnections: true,
    connectionLimit:    10,
    queueLimit:         0,
    timezone:           'Z',
    decimalNumbers:     true,
  };
  if (usePipe) {
    config.socketPath = process.env.DB_PIPE_PATH || '\\\\.\\pipe\\MySQL';
  } else {
    config.host = process.env.DB_HOST || 'localhost';
    config.port = parseInt(process.env.DB_PORT || '3306');
    if (process.env.DB_SSL === 'true') {
      config.ssl = { rejectUnauthorized: false };
    }
  }
  pool = mysql.createPool(config);
  return pool;
}

/* ══════════════════════════════════════
   SCHEMA SQL
   ══════════════════════════════════════ */
const SCHEMA_STATEMENTS = [

  /* ── Usuarios (auth) ── */
  `CREATE TABLE IF NOT EXISTS usuarios (
    id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre         VARCHAR(100) NOT NULL,
    apellido       VARCHAR(100) DEFAULT '',
    username       VARCHAR(50)  DEFAULT NULL,
    correo         VARCHAR(200) NOT NULL UNIQUE,
    telefono       VARCHAR(30)  DEFAULT '',
    empresa        VARCHAR(200) DEFAULT '',
    sitio_web      VARCHAR(500) DEFAULT '',
    biografia      TEXT,
    password_hash  VARCHAR(255) NOT NULL,
    rol            ENUM('admin','editor','cliente') NOT NULL DEFAULT 'cliente',
    activo         TINYINT(1)   NOT NULL DEFAULT 1,
    avatar_url     VARCHAR(500) DEFAULT NULL,
    email_verified      TINYINT(1) DEFAULT 0,
    telefono_verificado TINYINT(1) DEFAULT 0,
    totp_enabled        TINYINT(1) DEFAULT 0,
    totp_secret         VARCHAR(255) DEFAULT NULL,
    last_login     DATETIME     DEFAULT NULL,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_correo (correo),
    INDEX idx_rol    (rol),
    INDEX idx_activo (activo)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  /* ── Refresh tokens ── */
  `CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id  INT UNSIGNED NOT NULL,
    token       VARCHAR(512) NOT NULL UNIQUE,
    expires_at  DATETIME NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_usuario  (usuario_id),
    INDEX idx_expires  (expires_at),
    CONSTRAINT fk_rt_usuario
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  /* ── Sesiones de dispositivo ── */
  `CREATE TABLE IF NOT EXISTS sesiones (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id  INT UNSIGNED NOT NULL,
    ip          VARCHAR(60)  DEFAULT '',
    user_agent  VARCHAR(300) DEFAULT '',
    activa      TINYINT(1)   DEFAULT 1,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at  DATETIME DEFAULT NULL,
    INDEX idx_usuario (usuario_id),
    CONSTRAINT fk_ses_usuario
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  /* ── Cotizaciones ── */
  `CREATE TABLE IF NOT EXISTS cotizaciones (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL,
    apellido        VARCHAR(100) DEFAULT '',
    correo          VARCHAR(200) NOT NULL,
    whatsapp        VARCHAR(30)  DEFAULT '',
    tipo_proyecto   VARCHAR(100) DEFAULT '',
    presupuesto     VARCHAR(80)  DEFAULT '',
    monto           DECIMAL(12,2) DEFAULT NULL,
    moneda          VARCHAR(3)   DEFAULT 'USD',
    descripcion     TEXT,
    funcionalidades JSON,
    estado          ENUM('pendiente','enviada','pagada') DEFAULT 'pendiente',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_estado  (estado),
    INDEX idx_correo  (correo),
    INDEX idx_created (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  /* ── Consultas ── */
  `CREATE TABLE IF NOT EXISTS consultas (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre     VARCHAR(100) NOT NULL,
    correo     VARCHAR(200) NOT NULL,
    asunto     VARCHAR(200) DEFAULT '',
    mensaje    TEXT NOT NULL,
    estado     ENUM('nueva','leída','respondida') DEFAULT 'nueva',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_estado  (estado),
    INDEX idx_correo  (correo),
    INDEX idx_created (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  /* ── Solicitudes de plantillas ── */
  `CREATE TABLE IF NOT EXISTS solicitudes_plantillas (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre        VARCHAR(100) NOT NULL,
    apellido      VARCHAR(100) DEFAULT '',
    correo        VARCHAR(200) NOT NULL,
    whatsapp      VARCHAR(30)  DEFAULT '',
    tipo_proyecto VARCHAR(100) DEFAULT '',
    funcionalidades JSON,
    descripcion   TEXT,
    plantilla_ref VARCHAR(80)  DEFAULT '',
    color_prim    VARCHAR(20)  DEFAULT '',
    color_bg      VARCHAR(20)  DEFAULT '',
    fuente        VARCHAR(100) DEFAULT '',
    estado        ENUM('pendiente','revisado','desarrollando','cerrado') DEFAULT 'pendiente',
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_estado  (estado),
    INDEX idx_correo  (correo),
    INDEX idx_created (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  /* ── Plantillas (catálogo) ── */
  `CREATE TABLE IF NOT EXISTS plantillas (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    slug        VARCHAR(80)  NOT NULL UNIQUE,
    nombre      VARCHAR(120) NOT NULL,
    descripcion TEXT,
    categoria   ENUM('negocio','ecommerce','portfolio','landing','app','restaurante') NOT NULL,
    badge       ENUM('new','popular','free') DEFAULT NULL,
    precio_base DECIMAL(10,2) DEFAULT 0.00,
    activa      TINYINT(1) DEFAULT 1,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_categoria (categoria),
    INDEX idx_activa    (activa)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  /* ── Suscriptores ── */
  `CREATE TABLE IF NOT EXISTS suscriptores (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    correo     VARCHAR(200) NOT NULL UNIQUE,
    activo     TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_activo (activo)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  /* ── Preferencias de tema ── */
  `CREATE TABLE IF NOT EXISTS preferencias_tema (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(80) NOT NULL UNIQUE,
    tema       ENUM('beige','dark','blanc','slate','sage') NOT NULL DEFAULT 'beige',
    pagina     VARCHAR(200) DEFAULT '',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_session (session_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  /* ── Log de actividad ── */
  `CREATE TABLE IF NOT EXISTS activity_log (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tipo       VARCHAR(40) NOT NULL,
    ref_id     INT UNSIGNED DEFAULT NULL,
    ip         VARCHAR(60)  DEFAULT '',
    user_agent VARCHAR(300) DEFAULT '',
    payload    JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tipo    (tipo),
    INDEX idx_created (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  /* ── Configuración del sistema (JSON) ── */
  `CREATE TABLE IF NOT EXISTS configuracion_sistema (
    id         TINYINT UNSIGNED NOT NULL PRIMARY KEY DEFAULT 1,
    datos      JSON NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  /* ── Preferencias de usuario ── */
  `CREATE TABLE IF NOT EXISTS preferencias_usuario (
    id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id        INT UNSIGNED NOT NULL UNIQUE,
    push_notif        TINYINT(1) DEFAULT 1,
    email_notif       TINYINT(1) DEFAULT 1,
    whatsapp_notif    TINYINT(1) DEFAULT 0,
    idioma            VARCHAR(10)  DEFAULT 'es',
    zona_horaria      VARCHAR(40)  DEFAULT 'America/Santo_Domingo',
    formato_fecha     VARCHAR(10)  DEFAULT 'DD/MM/YYYY',
    formato_hora      VARCHAR(10)  DEFAULT '12h',
    moneda            VARCHAR(5)   DEFAULT 'DOP',
    reducir_movimiento TINYINT(1) DEFAULT 0,
    alto_contraste    TINYINT(1) DEFAULT 0,
    texto_size        VARCHAR(10)  DEFAULT 'normal',
    tema_pref         VARCHAR(20)  DEFAULT 'beige',
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_usuario (usuario_id),
    CONSTRAINT fk_pref_usuario
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  /* ── Servicios (catálogo público) ── */
  `CREATE TABLE IF NOT EXISTS servicios (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    slug        VARCHAR(80)  NOT NULL UNIQUE,
    nombre      VARCHAR(120) NOT NULL,
    descripcion TEXT,
    icono       VARCHAR(60)  DEFAULT '',
    categoria   VARCHAR(60)  DEFAULT '',
    precio_base DECIMAL(10,2) DEFAULT 0.00,
    orden       TINYINT UNSIGNED DEFAULT 0,
    activo      TINYINT(1) DEFAULT 1,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_categoria (categoria),
    INDEX idx_activo (activo)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  /* ── Recovery codes (2FA) ── */
  `CREATE TABLE IF NOT EXISTS recovery_codes (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id  INT UNSIGNED NOT NULL,
    code_hash   VARCHAR(255) NOT NULL,
    usado       TINYINT(1) DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_usuario (usuario_id),
    INDEX idx_usado   (usado),
    CONSTRAINT fk_rc_usuario
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  /* ── Proyectos (Kanban) ── */
  `CREATE TABLE IF NOT EXISTS proyectos (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre        VARCHAR(100) NOT NULL,
    apellido      VARCHAR(100) DEFAULT '',
    empresa       VARCHAR(200) DEFAULT '',
    email         VARCHAR(200) DEFAULT '',
    telefono      VARCHAR(30)  DEFAULT '',
    tipo_proyecto VARCHAR(100) DEFAULT '',
    presupuesto   VARCHAR(80)  DEFAULT '',
    monto         DECIMAL(12,2) DEFAULT NULL,
    moneda        VARCHAR(3)   DEFAULT 'USD',
    estado        ENUM('pendiente','revisado','desarrollando','cerrado') DEFAULT 'pendiente',
    _src          ENUM('cot','plt','manual') DEFAULT 'manual',
    usuario_id    INT UNSIGNED DEFAULT NULL,
    descripcion   TEXT,
    fecha_inicio  DATE        DEFAULT NULL,
    fecha_entrega DATE        DEFAULT NULL,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_estado     (estado),
    INDEX idx_usuario    (usuario_id),
    INDEX idx_created    (created_at),
    CONSTRAINT fk_proy_usuario
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,



  /* ── Clientes (CRM) ── */
  `CREATE TABLE IF NOT EXISTS clientes (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL,
    apellido        VARCHAR(100) DEFAULT '',
    email           VARCHAR(200) DEFAULT '',
    telefono        VARCHAR(30)  DEFAULT '',
    empresa         VARCHAR(200) DEFAULT '',
    cargo           VARCHAR(100) DEFAULT '',
    sector          VARCHAR(100) DEFAULT '',
    servicio        VARCHAR(100) DEFAULT '',
    valor_total     DECIMAL(12,2) DEFAULT 0.00,
    proyectos_count TINYINT UNSIGNED DEFAULT 0,
    estado          ENUM('activo','pausado','inactivo') DEFAULT 'activo',
    vip             TINYINT(1) DEFAULT 0,
    ultimo_contacto DATE        DEFAULT NULL,
    color           VARCHAR(20) DEFAULT '#7a5c3a',
    notas           TEXT,
    usuario_id      INT UNSIGNED DEFAULT NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_estado     (estado),
    INDEX idx_sector     (sector),
    INDEX idx_vip        (vip),
    INDEX idx_usuario    (usuario_id),
    INDEX idx_created    (created_at),
    CONSTRAINT fk_cli_usuario
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  /* ── Conversaciones (mensajes) ── */
  `CREATE TABLE IF NOT EXISTS conversaciones (
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cliente_id       INT UNSIGNED DEFAULT NULL,
    cliente_nombre   VARCHAR(100) NOT NULL,
    cliente_apellido VARCHAR(100) DEFAULT '',
    empresa          VARCHAR(200) DEFAULT '',
    servicio         VARCHAR(100) DEFAULT '',
    asunto           VARCHAR(200) DEFAULT '',
    estado           ENUM('activa','archivada') DEFAULT 'activa',
    color            VARCHAR(20) DEFAULT '#7a5c3a',
    ultimo_mensaje   TEXT,
    ultimo_mensaje_at DATETIME DEFAULT NULL,
    usuario_id       INT UNSIGNED DEFAULT NULL,
    cuenta_id        INT UNSIGNED DEFAULT NULL,
    proyecto_id      INT UNSIGNED DEFAULT NULL,
    cotizacion_id    INT UNSIGNED DEFAULT NULL,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_estado      (estado),
    INDEX idx_cliente     (cliente_id),
    INDEX idx_usuario     (usuario_id),
    INDEX idx_cuenta      (cuenta_id),
    INDEX idx_proyecto    (proyecto_id),
    INDEX idx_cotizacion  (cotizacion_id),
    CONSTRAINT fk_conv_cliente
      FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
    CONSTRAINT fk_conv_usuario
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT fk_conv_cuenta
      FOREIGN KEY (cuenta_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT fk_conv_proyecto
      FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE SET NULL,
    CONSTRAINT fk_conv_cotizacion
      FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  /* ── Mensajes individuales ── */
  `CREATE TABLE IF NOT EXISTS mensajes (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    conversacion_id INT UNSIGNED NOT NULL,
    remitente       ENUM('admin','cliente') NOT NULL DEFAULT 'admin',
    texto           TEXT NOT NULL,
    leido           TINYINT(1) DEFAULT 0,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_conversacion (conversacion_id),
    INDEX idx_created      (created_at),
    CONSTRAINT fk_msg_conversacion
      FOREIGN KEY (conversacion_id) REFERENCES conversaciones(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  /* ── Transacciones financieras ── */
  `CREATE TABLE IF NOT EXISTS transacciones (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cliente_id    INT UNSIGNED DEFAULT NULL,
    cliente_nombre VARCHAR(100) DEFAULT '',
    concepto      VARCHAR(200) NOT NULL,
    tipo          ENUM('ingreso','gasto') NOT NULL DEFAULT 'ingreso',
    monto         DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    metodo_pago   VARCHAR(60) DEFAULT '',
    estado        ENUM('cobrado','pendiente','cotizando','vencido') DEFAULT 'pendiente',
    fecha         DATE DEFAULT (CURRENT_DATE),
    categoria     VARCHAR(60) DEFAULT '',
    nota          TEXT,
    proyecto_id   INT UNSIGNED DEFAULT NULL,
    usuario_id    INT UNSIGNED DEFAULT NULL,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_estado     (estado),
    INDEX idx_tipo       (tipo),
    INDEX idx_fecha      (fecha),
    INDEX idx_cliente    (cliente_id),
    INDEX idx_proyecto   (proyecto_id),
    INDEX idx_categoria  (categoria),
    INDEX idx_created    (created_at),
    CONSTRAINT fk_trans_cliente
      FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
    CONSTRAINT fk_trans_proyecto
      FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE SET NULL,
    CONSTRAINT fk_trans_usuario
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  /* ── Ingresos mensuales (gráfico) ── */
  `CREATE TABLE IF NOT EXISTS ingresos_mensuales (
    id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    mes       TINYINT UNSIGNED NOT NULL,
    año       SMALLINT UNSIGNED NOT NULL,
    monto     DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE INDEX idx_mes_año (mes, año),
    INDEX idx_año (año)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  /* ── Ingresos por servicio (donut) ── */
  `CREATE TABLE IF NOT EXISTS ingresos_por_servicio (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    servicio    VARCHAR(80) NOT NULL UNIQUE,
    monto_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    porcentaje  DECIMAL(5,2) DEFAULT 0.00,
    año         SMALLINT UNSIGNED DEFAULT 2025,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_año (año)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  /* ── Notificaciones del sistema ── */
  `CREATE TABLE IF NOT EXISTS notificaciones (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED DEFAULT NULL,
    tipo       VARCHAR(40) NOT NULL,
    titulo     VARCHAR(200) NOT NULL,
    mensaje    TEXT,
    ref_tipo   VARCHAR(40) DEFAULT NULL,
    ref_id     INT UNSIGNED DEFAULT NULL,
    leida      TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_usuario  (usuario_id),
    INDEX idx_leida    (leida),
    INDEX idx_tipo     (tipo),
    INDEX idx_created  (created_at),
    CONSTRAINT fk_notif_usuario
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  `CREATE TABLE IF NOT EXISTS encuestas (
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tipo             VARCHAR(50) NOT NULL DEFAULT 'satisfaccion',
    referencia_tipo  VARCHAR(50) NOT NULL,
    referencia_id    INT UNSIGNED NOT NULL,
    nombre           VARCHAR(100) DEFAULT NULL,
    correo           VARCHAR(255) DEFAULT NULL,
    puntuacion       TINYINT UNSIGNED NOT NULL,
    comentario       TEXT,
    como_nos_conociste VARCHAR(50) DEFAULT NULL,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ref (referencia_tipo, referencia_id),
    INDEX idx_tipo (tipo),
    INDEX idx_puntuacion (puntuacion)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

/* ── Migraciones para BD existente (agregar columnas nuevas) ── */
const MIGRATION_STATEMENTS = [
  `ALTER TABLE usuarios ADD COLUMN username  VARCHAR(50)  DEFAULT NULL AFTER apellido`,
  `ALTER TABLE usuarios ADD COLUMN telefono  VARCHAR(30)  DEFAULT ''   AFTER correo`,
  `ALTER TABLE usuarios ADD COLUMN empresa   VARCHAR(200) DEFAULT ''   AFTER telefono`,
  `ALTER TABLE usuarios ADD COLUMN sitio_web VARCHAR(500) DEFAULT ''   AFTER empresa`,
  `ALTER TABLE usuarios ADD COLUMN biografia TEXT                       AFTER sitio_web`,
  `ALTER TABLE preferencias_usuario ADD COLUMN tema_pref VARCHAR(20) DEFAULT 'beige' AFTER texto_size`,
  `ALTER TABLE cotizaciones ADD COLUMN documento_url VARCHAR(500) DEFAULT NULL AFTER funcionalidades`,
  `ALTER TABLE usuarios ADD COLUMN email_verified      TINYINT(1)   DEFAULT 0  AFTER avatar_url`,
  `ALTER TABLE usuarios ADD COLUMN telefono_verificado TINYINT(1)   DEFAULT 0  AFTER email_verified`,
  `ALTER TABLE usuarios ADD COLUMN totp_enabled        TINYINT(1)   DEFAULT 0  AFTER telefono_verificado`,
  `ALTER TABLE usuarios ADD COLUMN totp_secret         VARCHAR(255) DEFAULT NULL AFTER totp_enabled`,
  `ALTER TABLE conversaciones ADD COLUMN cuenta_id INT UNSIGNED DEFAULT NULL AFTER usuario_id`,
  `ALTER TABLE conversaciones ADD COLUMN proyecto_id INT UNSIGNED DEFAULT NULL AFTER cuenta_id`,
  `ALTER TABLE conversaciones ADD COLUMN cotizacion_id INT UNSIGNED DEFAULT NULL AFTER proyecto_id`,
  `ALTER TABLE proyectos ADD COLUMN monto DECIMAL(12,2) DEFAULT NULL AFTER presupuesto`,
  `ALTER TABLE proyectos ADD COLUMN moneda VARCHAR(3) DEFAULT 'USD' AFTER monto`,
  `ALTER TABLE cotizaciones ADD COLUMN monto DECIMAL(12,2) DEFAULT NULL AFTER presupuesto`,
  `ALTER TABLE cotizaciones ADD COLUMN moneda VARCHAR(3) DEFAULT 'USD' AFTER monto`,
  `ALTER TABLE cotizaciones MODIFY COLUMN estado ENUM('pendiente','revisado','contactado','cerrado','enviada','pagada') DEFAULT 'pendiente'`,
  `UPDATE cotizaciones SET estado = 'enviada' WHERE estado = 'revisado'`,
  `UPDATE cotizaciones SET estado = 'pagada'  WHERE estado IN ('desarrollando','cerrado')`,
  `UPDATE cotizaciones SET estado = 'pendiente' WHERE estado = 'contactado'`,
  `ALTER TABLE cotizaciones MODIFY COLUMN estado ENUM('pendiente','enviada','pagada') DEFAULT 'pendiente'`,
  `ALTER TABLE solicitudes_plantillas MODIFY COLUMN estado ENUM('pendiente','revisado','desarrollando','cerrado') DEFAULT 'pendiente'`,
  `ALTER TABLE proyectos MODIFY COLUMN estado ENUM('pendiente','revisado','contactado','cerrado','desarrollando') DEFAULT 'pendiente'`,
  `UPDATE proyectos SET estado = 'desarrollando' WHERE estado = 'contactado'`,
  `ALTER TABLE proyectos MODIFY COLUMN estado ENUM('pendiente','revisado','desarrollando','cerrado') DEFAULT 'pendiente'`,

  `ALTER TABLE mensajes ADD COLUMN archivo_url VARCHAR(500) DEFAULT NULL AFTER texto`,
  `ALTER TABLE mensajes ADD COLUMN archivo_nombre VARCHAR(255) DEFAULT NULL AFTER archivo_url`,
  `ALTER TABLE transacciones ADD COLUMN cotizacion_id INT UNSIGNED DEFAULT NULL AFTER proyecto_id`,
  `ALTER TABLE mensajes ADD COLUMN archivo_tipo VARCHAR(100) DEFAULT NULL AFTER archivo_nombre`,
  `ALTER TABLE mensajes ADD COLUMN archivo_tamano INT UNSIGNED DEFAULT NULL AFTER archivo_tipo`,
  `ALTER TABLE transacciones ADD COLUMN moneda VARCHAR(3) DEFAULT 'USD' AFTER monto`,
];

/* ══════════════════════════════════════
   SEED PLANTILLAS
   ══════════════════════════════════════ */
const PLANTILLAS_SEED = [
  { slug: 'corporate-clean',  nombre: 'Corporate Clean',   categoria: 'negocio',     badge: 'popular', precio_base: 350.00 },
  { slug: 'shop-modern',      nombre: 'Shop Modern',       categoria: 'ecommerce',   badge: 'new',     precio_base: 600.00 },
  { slug: 'portfolio-light',  nombre: 'Portfolio Light',   categoria: 'portfolio',   badge: null,      precio_base: 250.00 },
  { slug: 'saas-launch',      nombre: 'SaaS Launch',       categoria: 'landing',     badge: null,      precio_base: 400.00 },
  { slug: 'app-showcase',     nombre: 'App Showcase',      categoria: 'app',         badge: null,      precio_base: 350.00 },
  { slug: 'restaurant-food',  nombre: 'Restaurant & Food', categoria: 'restaurante', badge: null,      precio_base: 300.00 },
  { slug: 'blog-editorial',   nombre: 'Blog & Editorial',  categoria: 'negocio',     badge: 'free',    precio_base: 0.00   },
  { slug: 'boutique-fashion', nombre: 'Boutique Fashion',  categoria: 'ecommerce',   badge: null,      precio_base: 550.00 },
  { slug: 'agency-pro',       nombre: 'Agency Pro',        categoria: 'landing',     badge: null,      precio_base: 400.00 },
];

/* ══════════════════════════════════════
   SEED ADMIN por defecto
   password: Admin2025!
   ══════════════════════════════════════ */
const ADMIN_SEED_SQL = `
  INSERT IGNORE INTO usuarios (nombre, apellido, correo, password_hash, rol)
  VALUES (
    'Admin', 'Multitech', 'admin@multitech.com',
    '$2b$12$rG0i0P4t51gHRVg1aj1Ze.BesZoj/mN02EuALtXCGbZBZad3Mko/m',
    'admin'
  )
`;

/* ══════════════════════════════════════
   INIT — conectar, crear tablas, seed
   ══════════════════════════════════════ */
async function initDatabase() {
  if (!pool) createPool();

  const conn = await pool.getConnection();

  console.log(
    `✅ MySQL conectado → ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}` +
    ` / ${process.env.DB_NAME || 'mtnexa'}`
  );

  // Crear tablas en orden (respeta FK)
  for (const sql of SCHEMA_STATEMENTS) {
    await conn.query(sql);
  }
  console.log('📋 Tablas verificadas / creadas');

  // Migraciones — columnas nuevas
  for (const sql of MIGRATION_STATEMENTS) {
    try { await conn.query(sql); } catch (e) { /* columna ya existe — ignorar */ }
  }
  console.log('📋 Migraciones aplicadas');

  // Seed admin
  await conn.query(ADMIN_SEED_SQL);

  // Seed configuración del sistema (valores por defecto)
  const { DEFAULT_CONFIG } = require('./public/mt-javascript/mt-config-defaults');
  await conn.query(
    `INSERT IGNORE INTO configuracion_sistema (id, datos) VALUES (1, ?)`,
    [JSON.stringify(DEFAULT_CONFIG)]
  );

  // Seed plantillas
  for (const p of PLANTILLAS_SEED) {
    await conn.query(
      `INSERT IGNORE INTO plantillas (slug, nombre, categoria, badge, precio_base)
       VALUES (?, ?, ?, ?, ?)`,
      [p.slug, p.nombre, p.categoria, p.badge, p.precio_base]
    );
  }

  const [[{ total }]] = await conn.query('SELECT COUNT(*) AS total FROM plantillas');
  console.log(`🌱 Plantillas en BD: ${total}`);

  // Seed servicios
  const SERVICIOS_SEED = [
    { slug: 'paginas-web',      nombre: 'Páginas Web',       descripcion: 'Sitios corporativos rápidos y optimizados con diseño responsivo.',                icono: 'language',     categoria: 'Desarrollo Web',   precio_base: 350.00, orden: 1 },
    { slug: 'apps-moviles',     nombre: 'Apps Móviles',      descripcion: 'Aplicaciones nativas iOS y Android con experiencia de usuario fluida.',         icono: 'smartphone',   categoria: 'Desarrollo Móvil', precio_base: 1200.00,orden: 2 },
    { slug: 'sistemas-medida',  nombre: 'Sistemas a Medida', descripcion: 'ERPs, CRMs y plataformas personalizadas para tu negocio.',                     icono: 'settings',     categoria: 'Software',        precio_base: 2500.00,orden: 3 },
    { slug: 'ecommerce',        nombre: 'E-Commerce',        descripcion: 'Tiendas en línea completas con catálogo, carrito y pasarela de pago.',          icono: 'shopping_cart', categoria: 'Desarrollo Web',   precio_base: 600.00, orden: 4 },
    { slug: 'ui-ux-design',     nombre: 'UI/UX Design',      descripcion: 'Interfaces centradas en el usuario con investigación y prototipado.',           icono: 'palette',      categoria: 'Diseño',          precio_base: 400.00, orden: 5 },
    { slug: 'cloud-soporte',    nombre: 'Cloud & Soporte',   descripcion: 'Hosting, mantenimiento mensual y soporte técnico continuo.',                   icono: 'cloud',        categoria: 'Infraestructura', precio_base: 150.00, orden: 6 },
  ];
  for (const s of SERVICIOS_SEED) {
    await conn.query(
      `INSERT IGNORE INTO servicios (slug, nombre, descripcion, icono, categoria, precio_base, orden)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [s.slug, s.nombre, s.descripcion, s.icono, s.categoria, s.precio_base, s.orden]
    );
  }
  console.log(`🌱 Servicios en BD: ${SERVICIOS_SEED.length}`);

  // Seed ingresos mensuales demo
  const INGRESOS_SEED = [
    [1,2025,9000],[2,2025,12000],[3,2025,8000],[4,2025,15000],[5,2025,11000],[6,2025,18000],
    [7,2025,14000],[8,2025,20000],[9,2025,16000],[10,2025,22000],[11,2025,19000],[12,2025,25000],
    [1,2024,7000],[2,2024,10000],[3,2024,6000],[4,2024,11000],[5,2024,9000],[6,2024,13000],
    [7,2024,11000],[8,2024,16000],[9,2024,12000],[10,2024,17000],[11,2024,14000],[12,2024,20000],
  ];
  for (const [mes, año, monto] of INGRESOS_SEED) {
    await conn.query(
      `INSERT IGNORE INTO ingresos_mensuales (mes, año, monto) VALUES (?, ?, ?)`,
      [mes, año, monto]
    );
  }
  console.log(`🌱 Ingresos mensuales seed: ${INGRESOS_SEED.length} registros`);

  // Seed ingresos por servicio
  const INGRESOS_SERV_SEED = [
    ['Páginas Web', 18500, 31.0, 2025],
    ['Apps Móviles', 14200, 24.0, 2025],
    ['E-Commerce', 11800, 18.0, 2025],
    ['Consultoría', 8500, 15.0, 2025],
    ['Branding/UX', 6300, 12.0, 2025],
  ];
  for (const [servicio, monto_total, porcentaje, año] of INGRESOS_SERV_SEED) {
    await conn.query(
      `INSERT IGNORE INTO ingresos_por_servicio (servicio, monto_total, porcentaje, año) VALUES (?, ?, ?, ?)`,
      [servicio, monto_total, porcentaje, año]
    );
  }
  console.log(`🌱 Ingresos por servicio seed: ${INGRESOS_SERV_SEED.length} registros`);

  conn.release();
  return pool;
}

/* ══════════════════════════════════════
   HELPERS DE QUERY
   ══════════════════════════════════════ */

/** SELECT → array de filas */
async function query(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

/** INSERT / UPDATE / DELETE → { id, affectedRows } */
async function run(sql, params = []) {
  const [result] = await pool.query(sql, params);
  return { id: result.insertId, affectedRows: result.affectedRows };
}

/** SELECT fila única → objeto | null */
async function get(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows[0] ?? null;
}

async function closePool() {
  if (pool) await pool.end();
}

module.exports = { initDatabase, query, run, get, closePool, getPool: () => pool };