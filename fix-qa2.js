const fs = require('fs');
const p = 'public/admin-dashboard.html';
let c = fs.readFileSync(p, 'utf8');
const old = `                <a href="admin-proyectos.html" class="qa"><div class="qa-icon"><span class="ms">add</span></div><span>Nuevo proyecto</span></a>
                </motion>`;
const oldFixed = old.replace('</motion>', '</div>');
const neuFixed = `                <a href="admin-proyectos.html" class="qa"><div class="qa-icon"><span class="ms">add</span></motion><span>Nuevo proyecto</span></a>
                <a href="admin-cotizaciones.html" class="qa"><div class="qa-icon"><span class="ms">request_quote</span></div><span>Cotizaciones</span></a>
              </div>`;
const neuFixed = `                <a href="admin-proyectos.html" class="qa"><div class="qa-icon"><span class="ms">add</span></div><span>Nuevo proyecto</span></a>
                <a href="admin-cotizaciones.html" class="qa"><div class="qa-icon"><span class="ms">request_quote</span></div><span>Cotizaciones</span></a>
              </div>`;
if (!c.includes(oldFixed)) {
  console.error('not found');
  process.exit(1);
}
fs.writeFileSync(p, c.replace(oldFixed, neuFixed));
console.log('ok');

