const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001' : window.location.origin;
const API_H = {'Content-Type':'application/json','X-Admin-Key':ADMIN_KEY};
const mFull = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Sept.','Octubre','Nov.','Dic.'];

async function loadFinanzas(anio) {
  const a = anio || new Date().getFullYear();
  const [ingMensuales, ingServicios, transStats, transacciones] = await Promise.all([
    fetch(API_BASE+'/api/ingresos/mensuales?anio='+a, {headers:API_H}).then(r=>r.json()).catch(()=>({data:[]})),
    fetch(API_BASE+'/api/ingresos/servicios?anio='+a, {headers:API_H}).then(r=>r.json()).catch(()=>({data:[]})),
    fetch(API_BASE+'/api/transacciones/stats', {headers:API_H}).then(r=>r.json()).catch(()=>({data:{}})),
    fetch(API_BASE+'/api/transacciones?limit=200', {headers:API_H}).then(r=>r.json()).catch(()=>({data:[]})),
  ]);
  
  const ingresos = ingMensuales.data || [];
  const monthData = Array.from({length:12}, (_,i) => {
    const m = ingresos.find(x=>x.mes===i+1);
    return m ? parseFloat(m.monto)||0 : 0;
  });
  const maxVal = Math.max(...monthData, 1);
  
  return {
    anio: a,
    vals: monthData,
    prev: monthData,
    max: maxVal,
    total: monthData.reduce((s,v)=>s+v, 0),
    servicios: (ingServicios.data||[]).map(s=>({label:s.servicio, pct:parseFloat(s.porcentaje)||0, monto:parseFloat(s.monto_total)||0})),
    stats: transStats.data||{},
    transacciones: (transacciones.data||[]).map(t=>({
      id:t.id, concepto:t.concepto||'', monto:parseFloat(t.monto)||0,
      tipo:t.tipo||'ingreso', estado:t.estado||'', fecha:t.fecha||'',
      categoria:t.categoria||'', cliente:t.cliente_nombre||'', nota:t.nota||''
    }))
  };
}

async function loadIngresosPorAnio(anio) {
  const r = await fetch(API_BASE+'/api/ingresos/mensuales?anio='+anio, {headers:API_H});
  const j = await r.json();
  const data = j.data||[];
  return Array.from({length:12}, (_,i) => {
    const m = data.find(x=>x.mes===i+1);
    return m ? parseFloat(m.monto)||0 : 0;
  });
}
