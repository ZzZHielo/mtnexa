require('dotenv').config();
const { initDatabase, run, query } = require('./database');

async function seed() {
  await initDatabase();

  // 1. Cotizaciones
  const cotizaciones = [
    { nombre:'Carlos', apellido:'Peña', correo:'carlos@gmail.com', whatsapp:'+18095551234', tipo_proyecto:'E-Commerce', presupuesto:'$600', estado:'pendiente', descripcion:'Tienda para vender ropa dominicana', created_at:'2026-05-01 10:30:00' },
    { nombre:'Ana', apellido:'Díaz', correo:'ana@empresa.com', whatsapp:'+18099876543', tipo_proyecto:'Página Web', presupuesto:'$350', estado:'enviada', descripcion:'Página corporativa para mi consultora', created_at:'2026-04-28 15:00:00' },
    { nombre:'Luis', apellido:'García', correo:'luis@tech.com', whatsapp:'+18091112222', tipo_proyecto:'Web+App', presupuesto:'$900', estado:'pagada', descripcion:'App de delivery para restaurante', created_at:'2026-04-25 09:00:00' },
    { nombre:'María', apellido:'Santos', correo:'maria@cafe.com', whatsapp:'+18093334444', tipo_proyecto:'Sistema a Medida', presupuesto:'$1,200+', estado:'pagada', descripcion:'CRM para gestión de clientes', created_at:'2026-04-22 14:00:00' },
    { nombre:'Pedro', apellido:'López', correo:'pedro@moda.com', whatsapp:'+18095556666', tipo_proyecto:'E-Commerce', presupuesto:'$600', estado:'pendiente', descripcion:'Tienda de ropa online', created_at:'2026-05-05 08:00:00' },
    { nombre:'Sofía', apellido:'Ramírez', correo:'sofia@estudio.com', whatsapp:'+18097778888', tipo_proyecto:'UI/UX Design', presupuesto:'$200', estado:'pendiente', descripcion:'Rediseño de interfaz para app existente', created_at:'2026-05-10 11:00:00' },
    { nombre:'Roberto', apellido:'Mejía', correo:'roberto@constructora.com', whatsapp:'+18099990000', tipo_proyecto:'Sistema a Medida', presupuesto:'$1,200+', estado:'enviada', descripcion:'Sistema de gestión de proyectos paraconstructora', created_at:'2026-05-08 16:00:00' },
  ];
  for (const c of cotizaciones) {
    await run(`INSERT INTO cotizaciones (nombre, apellido, correo, whatsapp, tipo_proyecto, presupuesto, estado, descripcion, created_at) VALUES (?,?,?,?,?,?,?,?,?)`, [c.nombre, c.apellido, c.correo, c.whatsapp, c.tipo_proyecto, c.presupuesto, c.estado, c.descripcion, c.created_at]);
  }
  console.log(`✅ ${cotizaciones.length} cotizaciones insertadas`);

  // 2. Proyectos
  const proyectos = [
    { nombre:'Carlos', empresa:'Peña Fashion', tipo_proyecto:'E-Commerce', presupuesto:1800, estado:'revisado', fecha_inicio:'2026-03-01', fecha_entrega:'2026-06-15', created_at:'2026-03-01 10:00:00' },
    { nombre:'Ana', empresa:'Ana Consultora', tipo_proyecto:'Página Web', presupuesto:350, estado:'cerrado', fecha_inicio:'2026-02-15', fecha_entrega:'2026-04-01', created_at:'2026-02-15 09:00:00' },
    { nombre:'María', empresa:'Café Santo Domingo', tipo_proyecto:'Sistema a Medida', presupuesto:5000, estado:'desarrollando', fecha_inicio:'2026-04-10', fecha_entrega:'2026-08-30', created_at:'2026-04-10 11:00:00' },
    { nombre:'Tech Solutions', empresa:'Tech Solutions', tipo_proyecto:'Web+App', presupuesto:900, estado:'pendiente', fecha_inicio:null, fecha_entrega:null, created_at:'2026-05-01 14:00:00' },
  ];
  for (const p of proyectos) {
    await run(`INSERT INTO proyectos (nombre, empresa, tipo_proyecto, presupuesto, estado, fecha_inicio, fecha_entrega, created_at) VALUES (?,?,?,?,?,?,?,?)`, [p.nombre, p.empresa, p.tipo_proyecto, p.presupuesto, p.estado, p.fecha_inicio, p.fecha_entrega, p.created_at]);
  }
  console.log(`✅ ${proyectos.length} proyectos insertados`);

  // 3. Clientes
  const clientes = [
    { nombre:'Ana', apellido:'Díaz', email:'ana@empresa.com', empresa:'Ana Consultora', servicio:'Página Web', valor_total:350, estado:'activo', created_at:'2026-04-01 09:00:00' },
    { nombre:'María', apellido:'Santos', email:'maria@cafe.com', empresa:'Café Santo Domingo', servicio:'Sistema a Medida', valor_total:5000, estado:'activo', created_at:'2026-04-10 11:00:00' },
    { nombre:'Carlos', apellido:'Peña', email:'carlos@gmail.com', empresa:'Peña Fashion', servicio:'E-Commerce', valor_total:1800, estado:'activo', created_at:'2026-03-01 10:00:00' },
    { nombre:'Luis', apellido:'García', email:'luis@tech.com', empresa:'Tech Solutions', servicio:'Web+App', valor_total:900, estado:'pausado', created_at:'2026-04-25 09:00:00' },
  ];
  for (const c of clientes) {
    await run(`INSERT INTO clientes (nombre, apellido, email, empresa, servicio, valor_total, estado, created_at) VALUES (?,?,?,?,?,?,?,?)`, [c.nombre, c.apellido, c.email, c.empresa, c.servicio, c.valor_total, c.estado, c.created_at]);
  }
  console.log(`✅ ${clientes.length} clientes insertados`);

  // 4. Transacciones (ingresos)
  const transacciones = [
    { concepto:'Página Web — Ana Díaz', monto:350, tipo:'ingreso', metodo_pago:'transferencia', estado:'cobrado', fecha:'2026-04-01', categoria:'Páginas Web' },
    { concepto:'E-Commerce — Carlos Peña (1ra cuota)', monto:600, tipo:'ingreso', metodo_pago:'tarjeta', estado:'cobrado', fecha:'2026-03-15', categoria:'E-Commerce' },
    { concepto:'Sistema a Medida — María Santos (1ra cuota)', monto:2000, tipo:'ingreso', metodo_pago:'transferencia', estado:'cobrado', fecha:'2026-04-15', categoria:'Sistemas a Medida' },
    { concepto:'Web+App — Luis García (adelanto)', monto:300, tipo:'ingreso', metodo_pago:'efectivo', estado:'cobrado', fecha:'2026-05-01', categoria:'Apps Móviles' },
    { concepto:'Consultoría SEO — Mensual Mayo', monto:200, tipo:'ingreso', metodo_pago:'transferencia', estado:'cobrado', fecha:'2026-05-05', categoria:'Consultoría' },
    { concepto:'E-Commerce — Carlos Peña (2da cuota)', monto:600, tipo:'ingreso', metodo_pago:'tarjeta', estado:'cobrado', fecha:'2026-05-10', categoria:'E-Commerce' },
    { concepto:'UI/UX Audit — Startup RD', monto:150, tipo:'ingreso', metodo_pago:'transferencia', estado:'pendiente', fecha:'2026-05-12', categoria:'UI/UX Design' },
    { concepto:'Mantenimiento Web — Ana Díaz (Mayo)', monto:80, tipo:'ingreso', metodo_pago:'transferencia', estado:'cobrado', fecha:'2026-05-01', categoria:'Cloud & Soporte' },
  ];
  for (const t of transacciones) {
    await run(`INSERT INTO transacciones (concepto, monto, tipo, metodo_pago, estado, fecha, categoria) VALUES (?,?,?,?,?,?,?)`, [t.concepto, t.monto, t.tipo, t.metodo_pago, t.estado, t.fecha, t.categoria]);
  }
  console.log(`✅ ${transacciones.length} transacciones insertadas`);

  // 5. Activity log
  const activities = [
    { tipo:'cotizacion', ref_id:1, created_at:'2026-05-15 10:30:00' },
    { tipo:'cotizacion', ref_id:6, created_at:'2026-05-10 11:00:00' },
    { tipo:'cotizacion', ref_id:7, created_at:'2026-05-08 16:00:00' },
    { tipo:'transaccion', ref_id:5, created_at:'2026-05-05 09:00:00' },
    { tipo:'transaccion', ref_id:6, created_at:'2026-05-10 14:00:00' },
    { tipo:'proyecto', ref_id:1, created_at:'2026-03-01 10:00:00' },
    { tipo:'proyecto', ref_id:3, created_at:'2026-04-10 11:00:00' },
  ];
  for (const a of activities) {
    await run(`INSERT INTO activity_log (tipo, ref_id, created_at) VALUES (?,?,?)`, [a.tipo, a.ref_id, a.created_at]);
  }
  console.log(`✅ ${activities.length} registros de actividad insertados`);

  console.log('\n🎉 Demo data seeded successfully! Reinicia el servidor y recarga el dashboard.');
  process.exit(0);
}

seed().catch(err => { console.error('Seed error:', err); process.exit(1); });
