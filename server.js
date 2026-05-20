/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║          MULTITECH — Backend Server v2.1                 ║
 * ║  Node.js + Express + MySQL (mysql2) + JWT + bcrypt       ║
 * ║  Puerto por defecto: 3001                                ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * ENDPOINTS AUTH
 * ─────────────────────────────────────────────────────────────
 *  POST   /api/auth/signup
 *  POST   /api/auth/login
 *  POST   /api/auth/logout
 *  GET    /api/auth/me                      (requiere token)
 *  POST   /api/auth/refresh
 *  PATCH  /api/auth/password                (requiere token)
 *
 * ENDPOINTS EXISTENTES
 * ─────────────────────────────────────────────────────────────
 *  GET    /api/health
 *  POST/GET/PATCH  /api/cotizaciones
 *  POST/GET/PATCH  /api/consultas
 *  GET/POST/PATCH  /api/plantillas
 *  POST/GET        /api/temas
 *  GET             /api/admin/*             (requiere X-Admin-Key)
 * ─────────────────────────────────────────────────────────────
 */

require('dotenv').config({ debug: true });

const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const cookieParser = require('cookie-parser');
const path         = require('path');

const { initDatabase, closePool } = require('./database');

/* ── Rutas ── */
const authRouter         = require('./public/mt-javascript/mt-auth-router');
const cotizacionesRouter = require('./public/mt-javascript/mt-cotizaciones');
const consultasRouter    = require('./public/mt-javascript/mt-consultas');
const plantillasRouter   = require('./public/mt-javascript/mt-plantillas');
const temasRouter        = require('./public/mt-javascript/mt-temas');
const adminRouter        = require('./public/mt-javascript/mt-admin');
const { publicRouter: configPublicRouter, router: configRouter } = require('./public/mt-javascript/mt-config');
const proyectosRouter    = require('./public/mt-javascript/mt-proyectos');

const clientesRouter     = require('./public/mt-javascript/mt-clientes');
const mensajesRouter     = require('./public/mt-javascript/mt-mensajes');
const finanzasRouter     = require('./public/mt-javascript/mt-finanzas');
const serviciosRouter    = require('./public/mt-javascript/mt-servicios');
const chatRouter         = require('./public/mt-javascript/mt-chat');
const encuestasRouter       = require('./public/mt-javascript/mt-encuestas');
const uploadRouter          = require('./public/mt-javascript/mt-upload');
const notificacionesRouter  = require('./public/mt-javascript/mt-notificaciones');

const PORT      = parseInt(process.env.PORT  || '3001');
const ADMIN_KEY = process.env.ADMIN_KEY       || 'multitech-admin-2025';
const CORS_ORIG = (process.env.CORS_ORIGIN   || 'http://localhost:3001,http://localhost:5500').split(',').map(s => s.trim());

/* ════════════════════════════════════════
   APP
   ════════════════════════════════════════ */
const app = express();

/* ── Seguridad ── */
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

/* ── CORS ── */
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    if (CORS_ORIG.includes(origin)) return cb(null, true);
    if (/^https?:\/\/(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(origin)) return cb(null, true);
    cb(new Error(`CORS bloqueado para: ${origin}`));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Key'],
  credentials: true,
}));

/* ── Parsers ── */
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

/* ── Logger HTTP ── */
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('[:date[clf]] :method :url :status :response-time ms'));
}

/* ════════════════════════════════════════
   ARCHIVOS ESTÁTICOS (Frontend)
   ════════════════════════════════════════ */
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads',       express.static(path.join(__dirname, 'public', 'uploads')));
app.use('/mt-styles',     express.static(path.join(__dirname, 'public', 'mt-styles')));
app.use('/mt-javascript', express.static(path.join(__dirname, 'public', 'mt-javascript')));
app.use('/assets',        express.static(path.join(__dirname, 'public', 'assets')));
app.use('/mt-docs',       express.static(path.join(__dirname, 'public', 'mt-docs')));

/* ════════════════════════════════════════
   MIDDLEWARE: Protección rutas admin
   ════════════════════════════════════════ */
function requireAdmin(req, res, next) {
  const key = req.headers['x-admin-key'] || req.query.adminKey;
  if (key !== ADMIN_KEY)
    return res.status(401).json({ success: false, message: 'Acceso no autorizado' });
  next();
}

/* ════════════════════════════════════════
   HEALTH CHECK
   ════════════════════════════════════════ */
app.get('/api/health', (req, res) => {
  res.json({
    success:     true,
    service:     'Multitech API',
    version:     '2.1.0',
    database:    'MySQL',
    auth:        'JWT + bcrypt',
    environment: process.env.NODE_ENV || 'development',
    timestamp:   new Date().toISOString(),
    uptime:      `${Math.floor(process.uptime())}s`,
  });
});

const googleRouter = require('./public/mt-javascript/mt-auth-google');
app.use('/api/auth', googleRouter); // antes de las otras rutas auth

/* ════════════════════════════════════════
   RUTAS
   ════════════════════════════════════════ */
app.use('/api/auth',         authRouter);
app.use('/api/cotizaciones', cotizacionesRouter);
app.use('/api/consultas',    consultasRouter);
app.use('/api/plantillas',   plantillasRouter);
app.use('/api/temas',        temasRouter);
app.use('/api/admin',        requireAdmin, adminRouter);
app.use('/api/config',       configPublicRouter);
app.use('/api/config',       requireAdmin, configRouter);
app.use('/api/proyectos',    proyectosRouter);

app.use('/api/clientes',     clientesRouter);
app.use('/api/conversaciones', mensajesRouter);
app.use('/api',                finanzasRouter);
app.use('/api/servicios',      serviciosRouter);
app.use('/api/chat',           chatRouter);
app.use('/api/encuestas',      encuestasRouter);
app.use('/api/upload',         uploadRouter);
app.use('/api/notificaciones',  notificacionesRouter);

/* ════════════════════════════════════════
   FALLBACK SPA
   ════════════════════════════════════════ */
app.get('/{*path}', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      message: `Ruta no encontrada: ${req.method} ${req.path}`,
    });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* ════════════════════════════════════════
   ERROR HANDLER GLOBAL
   ════════════════════════════════════════ */
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[server] Error no manejado:', err.message);
  res.status(500).json({ success: false, message: 'Error interno del servidor' });
});


/* ════════════════════════════════════════
   ARRANQUE
   ════════════════════════════════════════ */
async function start() {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║   Multitech Backend v2.1 (Auth+JWT)   ║');
  console.log('╚══════════════════════════════════════╝');

  try {
    await initDatabase();

    const server = app.listen(PORT, () => {
      console.log(`\n🚀 Servidor en http://localhost:${PORT}`);
      console.log(`🔐 Auth:        POST http://localhost:${PORT}/api/auth/login`);
      console.log(`📝 Signup:      POST http://localhost:${PORT}/api/auth/signup`);
      console.log(`👤 Me:          GET  http://localhost:${PORT}/api/auth/me`);
      console.log(`📋 Health:      GET  http://localhost:${PORT}/api/health`);
      console.log(`\n   Admin por defecto:`);
      console.log(`   correo: admin@multitech.com`);
      console.log(`   pass:   Admin2025!\n`);
    });

    const shutdown = async (signal) => {
      console.log(`\n${signal} recibido — cerrando servidor...`);
      server.close(async () => {
        await closePool();
        console.log('✅ Conexiones MySQL cerradas. Hasta luego.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

  } catch (err) {
    console.error('\n❌ Error al iniciar el servidor:', err.message);
    process.exit(1);
  }
}

start();

module.exports = app;