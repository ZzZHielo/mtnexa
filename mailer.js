const nodemailer = require('nodemailer');

function createTransport() {
  const host   = process.env.SMTP_HOST;
  const port   = parseInt(process.env.SMTP_PORT || '587');
  const secure = process.env.SMTP_SECURE === 'true';
  const user   = process.env.SMTP_USER;
  const pass   = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn('[mailer] SMTP no configurado — los correos no se enviarán');
    return null;
  }

  return nodemailer.createTransport({
    host, port, secure,
    auth: { user, pass },
  });
}

const FROM = process.env.MAIL_FROM || 'noreply@multitech.do';

async function sendWelcomeEmail({ to, nombre }) {
  const transporter = createTransport();
  if (!transporter) return;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>Bienvenido a Nexa — Multitech</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background-color: #f0ece3;
    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    font-weight: 300;
    color: #2c2416;
    -webkit-font-smoothing: antialiased;
  }
  .wrapper {
    background-color: #f0ece3;
    padding: 48px 16px 56px;
  }
  .container {
    max-width: 560px;
    margin: 0 auto;
  }

  /* ── Header with logo ── */
  .email-header {
    text-align: center;
    margin-bottom: 28px;
  }
  .logo-lockup {
    display: inline-block;
  }
  .logo-wordmark {
    font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #a39880;
  }

  /* ── Hero card ── */
  .hero-card {
    background-color: #1c1610;
    border-radius: 18px;
    padding: 48px 44px 44px;
    margin-bottom: 14px;
    position: relative;
    overflow: hidden;
  }
  .hero-card::before {
    content: '';
    position: absolute;
    top: -60px;
    right: -60px;
    width: 240px;
    height: 240px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(122,92,58,0.22) 0%, transparent 70%);
    pointer-events: none;
  }
  .hero-eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: rgba(122,92,58,0.28);
    border: 1px solid rgba(122,92,58,0.4);
    border-radius: 100px;
    padding: 4px 13px;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: #c9a97a;
    margin-bottom: 24px;
  }
  .hero-eyebrow::before {
    content: '';
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #c9a97a;
    flex-shrink: 0;
  }
  .hero-greeting {
    font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
    font-size: 32px;
    font-weight: 700;
    line-height: 1.12;
    letter-spacing: -0.025em;
    color: #f0ede8;
    margin-bottom: 6px;
  }
  .hero-greeting em {
    font-style: italic;
    color: #c9a97a;
  }
  .hero-subtitle {
    font-size: 14px;
    line-height: 1.75;
    color: rgba(240,237,232,0.55);
    margin-top: 14px;
    max-width: 380px;
  }
  .hero-divider {
    width: 40px;
    height: 1px;
    background: rgba(201,169,122,0.35);
    margin: 28px 0;
  }
  .hero-cta {
    display: inline-block;
    background: #e8d5b0;
    color: #1a1410;
    text-decoration: none;
    border-radius: 100px;
    padding: 12px 28px;
    font-size: 13.5px;
    font-weight: 500;
    letter-spacing: 0.01em;
  }
  .hero-cta-secondary {
    display: inline-block;
    background: transparent;
    color: rgba(240,237,232,0.5);
    text-decoration: none;
    border-radius: 100px;
    padding: 12px 20px;
    font-size: 13px;
    margin-left: 8px;
    border: 1px solid rgba(240,237,232,0.15);
  }

  /* ── Steps cards row ── */
  .steps-row {
    display: table;
    width: 100%;
    border-spacing: 14px 0;
    margin-bottom: 14px;
  }
  .step-card {
    display: table-cell;
    width: 33.333%;
    background: #faf7f2;
    border-radius: 14px;
    border: 1px solid #d9d1c0;
    padding: 22px 18px 20px;
    vertical-align: top;
  }
  .step-num {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 24px;
    font-weight: 700;
    color: #d9d1c0;
    line-height: 1;
    margin-bottom: 12px;
  }
  .step-title {
    font-size: 12.5px;
    font-weight: 500;
    color: #2c2416;
    margin-bottom: 5px;
    letter-spacing: -0.01em;
  }
  .step-desc {
    font-size: 11.5px;
    color: #a39880;
    line-height: 1.6;
  }

  /* ── Services card ── */
  .services-card {
    background: #faf7f2;
    border-radius: 14px;
    border: 1px solid #d9d1c0;
    padding: 26px 28px;
    margin-bottom: 14px;
  }
  .services-label {
    font-size: 10.5px;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #a39880;
    margin-bottom: 16px;
  }
  .services-grid {
    display: table;
    width: 100%;
    border-spacing: 0;
  }
  .service-item {
    display: table-cell;
    width: 50%;
    padding: 0 10px 12px 0;
    vertical-align: top;
  }
  .service-item:nth-child(even) {
    padding-right: 0;
  }
  .service-name {
    font-size: 12.5px;
    font-weight: 500;
    color: #2c2416;
    margin-bottom: 2px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .service-name::before {
    content: '→';
    font-size: 11px;
    color: #7a5c3a;
    flex-shrink: 0;
  }
  .service-desc {
    font-size: 11.5px;
    color: #a39880;
    line-height: 1.5;
    padding-left: 17px;
  }

  /* ── Credentials card ── */
  .creds-card {
    background: #e8dfc8;
    border-radius: 14px;
    border: 1px solid rgba(122,92,58,0.2);
    padding: 22px 26px;
    margin-bottom: 14px;
  }
  .creds-label {
    font-size: 10.5px;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #7a5c3a;
    margin-bottom: 12px;
  }
  .cred-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 7px 0;
    border-bottom: 1px solid rgba(122,92,58,0.12);
  }
  .cred-row:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
  .cred-key {
    font-size: 12px;
    color: #6b5e47;
  }
  .cred-val {
    font-size: 12px;
    font-weight: 500;
    color: #3d2e16;
    font-family: 'DM Mono', 'Courier New', monospace;
  }

  /* ── Contact strip ── */
  .contact-strip {
    background: #faf7f2;
    border-radius: 14px;
    border: 1px solid #d9d1c0;
    padding: 18px 26px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
  }
  .contact-text {
    font-size: 12.5px;
    color: #6b5e47;
    line-height: 1.5;
  }
  .contact-text strong {
    color: #2c2416;
    font-weight: 500;
    display: block;
    margin-bottom: 2px;
  }
  .contact-link {
    font-size: 12px;
    color: #7a5c3a;
    text-decoration: none;
    font-weight: 500;
    white-space: nowrap;
    border-bottom: 1px solid rgba(122,92,58,0.3);
    padding-bottom: 1px;
  }

  /* ── Footer ── */
  .email-footer {
    text-align: center;
    padding: 28px 0 0;
  }
  .footer-logo {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #c4bab0;
    margin-bottom: 10px;
  }
  .footer-copy {
    font-size: 11px;
    color: #c4bab0;
    line-height: 1.65;
  }
  .footer-copy a {
    color: #a39880;
    text-decoration: none;
  }
  .footer-divider {
    width: 32px;
    height: 1px;
    background: #d9d1c0;
    margin: 14px auto;
  }

  /* ── Nexa SVG Logo ── */
  .nexa-logo-svg {
    display: block;
    margin: 0 auto 6px;
  }

  @media only screen and (max-width: 480px) {
    .hero-card { padding: 36px 28px 34px; }
    .hero-greeting { font-size: 26px; }
    .steps-row { display: block; }
    .step-card { display: block; width: 100%; margin-bottom: 10px; }
    .services-grid { display: block; }
    .service-item { display: block; width: 100%; }
    .contact-strip { flex-direction: column; gap: 12px; text-align: center; }
    .hero-cta-secondary { display: block; margin: 10px 0 0; }
  }
</style>
</head>
<body>
<div class="wrapper">
<div class="container">

  <!-- Header -->
  <div class="email-header">
    <!-- Nexa SVG logo embebido -->
    <svg class="nexa-logo-svg" width="48" height="48" viewBox="0 0 3840 2160" xmlns="http://www.w3.org/2000/svg" style="width:52px;height:52px;color:#2c2416">
      <g>
        <path fill="#2c2416" d="M585 238H198Q202 186 231.5 158.5Q261 131 304 131Q368 131 393 185H575Q561 130 524.5 86.0Q488 42 433.0 17.0Q378 -8 310 -8Q228 -8 164.0 27.0Q100 62 64.0 127.0Q28 192 28 279Q28 366 63.5 431.0Q99 496 163.0 531.0Q227 566 310 566Q391 566 454.0 532.0Q517 498 552.5 435.0Q588 372 588 288Q588 264 585 238ZM413 333Q413 377 383.0 403.0Q353 429 308 429Q265 429 235.5 404.0Q206 379 199 333Z" transform="translate(1450.0,1663.0) scale(1.25,-1.25)"/>
        <path fill="#2c2416" d="M392 0 285 155 195 0H10L194 285L5 558H197L304 404L394 558H579L392 277L584 0Z" transform="translate(2080.0,1663.0) scale(1.25,-1.25)"/>
        <path fill="#2c2416" d="M274 566Q333 566 377.5 542.0Q422 518 446 479V558H617V0H446V79Q421 40 376.5 16.0Q332 -8 273 -8Q205 -8 149.0 27.5Q93 63 60.5 128.5Q28 194 28 280Q28 366 60.5 431.0Q93 496 149.0 531.0Q205 566 274 566ZM324 417Q273 417 237.5 380.5Q202 344 202 280Q202 216 237.5 178.5Q273 141 324 141Q375 141 410.5 178.0Q446 215 446 279Q446 343 410.5 380.0Q375 417 324 417Z" transform="translate(2710.0,1663.0) scale(1.25,-1.25)"/>
      </g>
      <g transform="matrix(1.246551,0,0,1.246551,568.33377,808.382648)">
        <g transform="matrix(1.450726,0,0,1.450726,-487.750247,-555.447345)">
          <path fill="#7a5c3a" d="M292.475,234.098C295.888,235.94 302.91,235.373 305.533,234.043C307.98,234.281 311.145,233.731 326.454,237.674C361.713,246.756 393.857,285.671 408.122,314.687C431.921,363.094 456.029,406.665 466.228,426.64C486.339,466.027 502.144,489.55 498.499,497.499C495.661,503.689 452.718,552.308 449.132,556.162C425.563,581.494 405.015,606.784 400.324,604.863C399.126,604.373 383.559,573.304 381.787,570.341C375.823,560.365 335.645,483.151 326.078,468.778C291.825,417.318 252.958,418.542 250.522,418.275C248.834,416.604 246.826,416.725 242.5,417.031C240.943,417.142 241.641,418.004 241.474,418.193C185.925,423.002 169.268,464.311 170.069,469.663C171.197,477.202 176.76,455.742 212.378,435.28C259.77,408.053 324.253,458.874 326.281,498.516C327.166,515.817 273.482,713.848 273.155,717.478C272.278,727.232 286.557,717.55 287.218,717.093C318.063,695.792 340.372,680.464 374.549,645.548C418.111,601.045 425.843,596.213 448.046,570.099C452.497,564.864 483.296,528.64 503.903,504.851C524.154,481.472 661.178,314.455 672.32,301.347C700.004,268.777 699.838,267.992 709.25,233.43C727.679,165.758 805.524,151.633 839.017,194.893C853.025,212.985 855.131,229.816 856.916,240.461C855.939,242.535 854.769,242.975 857.312,245.515C857.744,252.137 858.187,258.349 856.713,267.535C854.454,281.622 833.878,370.497 829.93,385.608C824.137,407.782 814.278,449.999 812.967,455.61C802.088,502.196 801.093,501.871 790.14,548.419C778.339,598.571 750.634,706.665 747.113,720.404C731.46,781.478 728.934,791.498 718.3,811.398C667.365,906.718 564.559,891.216 515.928,820.22C509.278,810.512 445.449,692.16 430.151,662.687C425.615,653.948 423.909,653.251 428.742,644.644C437.788,628.535 487.33,576.019 507.058,556.066C522.776,540.169 522.798,538.997 524.103,539.995C528.641,543.465 569.688,641.733 618.605,682.376C694.817,745.699 755.582,644.595 754.113,636.596C753.254,631.915 740.57,649.277 737.378,653.404C687.373,718.073 625.019,687.548 609.863,660.293C604.836,651.254 610.075,643.309 627.684,574.543C629.773,566.385 653.449,473.92 653.771,472.561C655.664,464.557 657.894,455.884 658.266,454.437C678.177,376.981 689.541,344.061 682.482,346.453C680.344,347.178 580.353,461.474 571.547,471.541C545.983,500.762 527.098,523.302 520.104,529.002C503.492,542.541 452.673,599.545 424.983,633.884C315.065,770.194 306.856,771.283 238.934,851.883C154.735,951.799 61.798,862.746 74.138,772.434C76.719,753.549 117.888,593.139 121.878,577.594C151.687,461.45 151.418,461.466 154.185,451.421C183.595,344.629 184.725,245.537 292.475,234.098Z"/>
        </g>
      </g>
    </svg>
    <div class="logo-wordmark">Multitech · Nexa</div>
  </div>

  <!-- Hero card oscuro -->
  <div class="hero-card">
    <div class="hero-eyebrow">Cuenta creada</div>
    <div class="hero-greeting">
      ¡Bienvenido,<br><em>${nombre}!</em>
    </div>
    <p class="hero-subtitle">
      Tu cuenta en Nexa está lista. Ya puedes cotizar proyectos, explorar plantillas y comenzar a transformar tu presencia digital con nosotros.
    </p>
    <div class="hero-divider"></div>
    <a href="{{url_base}}/index.html" class="hero-cta">Ir a Nexa →</a>
    <a href="{{url_base}}/multitech-contacto.html" class="hero-cta-secondary">Cotizar un proyecto</a>
  </div>

  <!-- Contacto -->
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#faf7f2;border-radius:14px;border:1px solid #d9d1c0;margin-bottom:14px">
    <tr>
      <td style="padding:18px 26px">
        <p style="font-size:12.5px;color:#2c2416;font-weight:500;margin-bottom:3px">¿Tienes alguna pregunta?</p>
        <p style="font-size:12px;color:#a39880;line-height:1.5">Respondemos en menos de 24 horas, en el idioma de tu preferencia.</p>
      </td>
      <td style="padding:18px 26px;text-align:right;white-space:nowrap">
        <a href="mailto:nexa@multitech.com" style="font-size:12px;color:#7a5c3a;text-decoration:none;font-weight:500;border-bottom:1px solid rgba(122,92,58,0.35);padding-bottom:1px">nexa@multitech.com</a>
      </td>
    </tr>
  </table>

  <!-- Footer -->
  <div class="email-footer">
    <div class="footer-divider"></div>
    <div class="footer-logo">Multitech · República Dominicana</div>
    <p class="footer-copy">
      © 2026 Multitech. Todos los derechos reservados.<br>
      Recibiste este correo porque creaste una cuenta en <a href="{{url_base}}">Nexa by Multitech</a>.<br>
      <a href="{{url_base}}/multitech-contacto.html">Contacto</a> &nbsp;·&nbsp; <a href="{{url_base}}">multitech.do</a>
    </p>
  </div>

</div>
</div>
</body>
</html>`;

  try {
    const info = await transporter.sendMail({
      from: FROM,
      to,
      subject: 'Bienvenido a Multitech — Tu cuenta está lista',
      html,
    });
    console.log(`[mailer] Bienvenida enviada a ${to} (id: ${info.messageId})`);
  } catch (err) {
    console.error('[mailer] Error al enviar bienvenida:', err.message);
  }
}

async function sendCotizacionAceptada({ to, nombre, apellido, tipo_proyecto, monto, moneda, descripcion, funcionalidades, id }) {
  const transporter = createTransport();
  if (!transporter) return;

  const montoStr = monto != null ? `${moneda||'USD'} ${Number(monto).toLocaleString('es-DO',{minimumFractionDigits:2})}` : 'Por confirmar';
  const funcsStr = Array.isArray(funcionalidades) && funcionalidades.length
    ? funcionalidades.map(f=>`<li style="margin-bottom:4px">${f}</li>`).join('')
    : '<li style="color:#a39880">Por definir</li>';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cotización aceptada — Multitech</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background-color:#f0ece3;font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#2c2416;-webkit-font-smoothing:antialiased;}
  .wrapper{background-color:#f0ece3;padding:48px 16px 56px;}
  .container{max-width:560px;margin:0 auto;}
  .email-header{text-align:center;margin-bottom:28px;}
  .logo-wordmark{font-family:'Playfair Display',Georgia,serif;font-size:13px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#a39880;}
  .hero-card{background-color:#1c1610;border-radius:18px;padding:48px 44px 44px;margin-bottom:14px;position:relative;overflow:hidden;}
  .hero-card::before{content:'';position:absolute;top:-60px;right:-60px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(122,92,58,0.22) 0%,transparent 70%);pointer-events:none;}
  .hero-eyebrow{display:inline-flex;align-items:center;gap:7px;background:rgba(122,92,58,0.28);border:1px solid rgba(122,92,58,0.4);border-radius:100px;padding:4px 13px;font-size:11px;font-weight:500;letter-spacing:0.09em;text-transform:uppercase;color:#c9a97a;margin-bottom:24px;}
  .hero-eyebrow::before{content:'';width:5px;height:5px;border-radius:50%;background:#c9a97a;flex-shrink:0;}
  .hero-greeting{font-family:'Playfair Display',Georgia,serif;font-size:32px;font-weight:700;line-height:1.12;letter-spacing:-0.025em;color:#f0ede8;margin-bottom:6px;}
  .hero-greeting em{font-style:italic;color:#c9a97a;}
  .hero-subtitle{font-size:14px;line-height:1.75;color:rgba(240,237,232,0.55);margin-top:14px;}
  .hero-divider{width:40px;height:1px;background:rgba(201,169,122,0.35);margin:28px 0;}
  .details-card{background:#faf7f2;border-radius:14px;border:1px solid #d9d1c0;padding:26px 28px;margin-bottom:14px;}
  .details-label{font-size:10.5px;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;color:#a39880;margin-bottom:16px;}
  .detail-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06);font-size:13px;}
  .detail-row:last-child{border-bottom:none;}
  .detail-key{color:#a39880;}
  .detail-val{font-weight:500;color:#2c2416;text-align:right;}
  .func-list{list-style:none;padding:0;margin-top:8px;}
  .func-list li{font-size:12.5px;padding:5px 0 5px 20px;position:relative;color:#2c2416;}
  .func-list li::before{content:'✓';position:absolute;left:0;color:#7a5c3a;font-weight:700;}
  .cta-wrap{text-align:center;margin:24px 0 14px;}
  .cta-btn{display:inline-block;background:#e8d5b0;color:#1a1410;text-decoration:none;border-radius:100px;padding:12px 28px;font-size:13.5px;font-weight:500;}
  .email-footer{text-align:center;padding:28px 0 0;}
  .footer-logo{font-family:'Playfair Display',Georgia,serif;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#c4bab0;margin-bottom:10px;}
  .footer-copy{font-size:11px;color:#c4bab0;line-height:1.65;}
  .footer-divider{width:32px;height:1px;background:#d9d1c0;margin:14px auto;}
</style>
</head>
<body>
<div class="wrapper"><div class="container">
  <div class="email-header"><div class="logo-wordmark">Multitech · Nexa</div></div>
  <div class="hero-card">
    <div class="hero-eyebrow">Cotización aceptada</div>
    <div class="hero-greeting">¡Hola,<br><em>${nombre} ${apellido||''}!</em></div>
    <p class="hero-subtitle">Tu cotización ha sido recibida y aceptada. Nuestro equipo comenzará a trabajar en tu proyecto en breve.</p>
    <div class="hero-divider"></div>
  </div>
  <div class="details-card">
    <div class="details-label">Detalles de tu cotización #${id}</div>
    <div class="detail-row"><span class="detail-key">Servicio</span><span class="detail-val">${tipo_proyecto||'—'}</span></div>
    <div class="detail-row"><span class="detail-key">Presupuesto</span><span class="detail-val">${montoStr}</span></div>
    ${descripcion?`<div class="detail-row" style="flex-direction:column;gap:4px;border-bottom:none"><span class="detail-key">Descripción</span><span style="font-size:13px;color:#2c2416;line-height:1.5;margin-top:4px">${descripcion}</span></div>`:''}
    <div class="detail-row" style="flex-direction:column;gap:4px;border-bottom:none">
      <span class="detail-key">Funcionalidades incluidas</span>
      <ul class="func-list">${funcsStr}</ul>
    </div>
  </div>
  <div class="cta-wrap">
    <a href="${process.env.BASE_URL||'https://multitech.do'}/multitech-contacto.html" class="cta-btn">Ir a mi panel →</a>
  </div>
  <div class="email-footer">
    <div class="footer-divider"></div>
    <div class="footer-logo">Multitech · República Dominicana</div>
    <p class="footer-copy">© 2026 Multitech. Todos los derechos reservados.</p>
  </div>
</div></div>
</body>
</html>`;

  try {
    const info = await transporter.sendMail({
      from: FROM,
      to,
      subject: `Cotización #${id} aceptada — Multitech`,
      html,
    });
    console.log(`[mailer] Cotización #${id} enviada a ${to} (id: ${info.messageId})`);
  } catch (err) {
    console.error('[mailer] Error al enviar cotización:', err.message);
  }
}

async function sendCotizacionEnviada({ to, nombre, apellido, tipo_proyecto, monto, moneda, funcionalidades, id }) {
  try {
    const transporter = createTransport();
    if (!transporter) return;

    const montoStr = monto != null ? `${moneda||'USD'} ${Number(monto).toLocaleString('es-DO',{minimumFractionDigits:2})}` : 'Por confirmar';
    const funcsStr = Array.isArray(funcionalidades) && funcionalidades.length
      ? funcionalidades.map(f=>`<li style="margin-bottom:4px">${f}</li>`).join('')
      : '<li style="color:#a39880">Por definir</li>';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cotización recibida — Multitech</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background-color:#f0ece3;font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#2c2416;-webkit-font-smoothing:antialiased;}
  .wrapper{background-color:#f0ece3;padding:48px 16px 56px;}
  .container{max-width:560px;margin:0 auto;}
  .email-header{text-align:center;margin-bottom:28px;}
  .logo-wordmark{font-family:'Playfair Display',Georgia,serif;font-size:13px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#a39880;}
  .hero-card{background-color:#1c1610;border-radius:18px;padding:48px 44px 44px;margin-bottom:14px;position:relative;overflow:hidden;}
  .hero-card::before{content:'';position:absolute;top:-60px;right:-60px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(122,92,58,0.22) 0%,transparent 70%);pointer-events:none;}
  .hero-eyebrow{display:inline-flex;align-items:center;gap:7px;background:rgba(122,92,58,0.28);border:1px solid rgba(122,92,58,0.4);border-radius:100px;padding:4px 13px;font-size:11px;font-weight:500;letter-spacing:0.09em;text-transform:uppercase;color:#c9a97a;margin-bottom:24px;}
  .hero-eyebrow::before{content:'';width:5px;height:5px;border-radius:50%;background:#c9a97a;flex-shrink:0;}
  .hero-greeting{font-family:'Playfair Display',Georgia,serif;font-size:32px;font-weight:700;line-height:1.12;letter-spacing:-0.025em;color:#f0ede8;margin-bottom:6px;}
  .hero-greeting em{font-style:italic;color:#c9a97a;}
  .hero-subtitle{font-size:14px;line-height:1.75;color:rgba(240,237,232,0.55);margin-top:14px;}
  .hero-divider{width:40px;height:1px;background:rgba(201,169,122,0.35);margin:28px 0;}
  .details-card{background:#faf7f2;border-radius:14px;border:1px solid #d9d1c0;padding:26px 28px;margin-bottom:14px;}
  .details-label{font-size:10.5px;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;color:#a39880;margin-bottom:16px;}
  .detail-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06);font-size:13px;}
  .detail-row:last-child{border-bottom:none;}
  .detail-key{color:#a39880;}
  .detail-val{font-weight:500;color:#2c2416;text-align:right;}
  .func-list{list-style:none;padding:0;margin-top:8px;}
  .func-list li{font-size:12.5px;padding:5px 0 5px 20px;position:relative;color:#2c2416;}
  .func-list li::before{content:'✓';position:absolute;left:0;color:#7a5c3a;font-weight:700;}
  .cta-wrap{text-align:center;margin:24px 0 14px;}
  .cta-btn{display:inline-block;background:#e8d5b0;color:#1a1410;text-decoration:none;border-radius:100px;padding:12px 28px;font-size:13.5px;font-weight:500;}
  .email-footer{text-align:center;padding:28px 0 0;}
  .footer-logo{font-family:'Playfair Display',Georgia,serif;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#c4bab0;margin-bottom:10px;}
  .footer-copy{font-size:11px;color:#c4bab0;line-height:1.65;}
  .footer-divider{width:32px;height:1px;background:#d9d1c0;margin:14px auto;}
</style>
</head>
<body>
<div class="wrapper"><div class="container">
  <div class="email-header"><div class="logo-wordmark">Multitech · Nexa</div></div>
  <div class="hero-card">
    <div class="hero-eyebrow">Cotización enviada</div>
    <div class="hero-greeting">¡Hola,<br><em>${nombre} ${apellido||''}!</em></div>
    <p class="hero-subtitle">Adjuntamos los detalles de tu cotizaci&oacute;n. Revisa la informaci&oacute;n y conf&iacute;rmala cuando est&eacute;s listo para comenzar.</p>
    <div class="hero-divider"></div>
  </div>
  <div class="details-card">
    <div class="details-label">Detalles de tu cotización #${id}</div>
    <div class="detail-row"><span class="detail-key">Servicio</span><span class="detail-val">${tipo_proyecto||'—'}</span></div>
    <div class="detail-row"><span class="detail-key">Presupuesto</span><span class="detail-val">${montoStr}</span></div>
    <div class="detail-row" style="flex-direction:column;gap:4px;border-bottom:none">
      <span class="detail-key">Funcionalidades incluidas</span>
      <ul class="func-list">${funcsStr}</ul>
    </div>
  </div>
  <div class="details-card">
    <div class="details-label">Pol&iacute;tica de pagos</div>
    <div style="font-size:12.5px;color:#2c2416;line-height:1.7">
      <p style="margin-bottom:8px"><strong>En etapas:</strong> 40% al iniciar, 30% al aprobar el dise&ntilde;o, 30% al entregar.</p>
      <p style="margin-bottom:8px">Para <strong>Enterprise</strong> se define un esquema personalizado.</p>
      <p style="margin-bottom:8px">Los pagos se realizan mediante:<br>
        &bull; Transferencia bancaria (RD)<br>
        &bull; PayPal (internacional)<br>
        &bull; Efectivo (presencial)</p>
      <p style="color:#a39880;font-size:11px;margin-top:10px">Una vez realizado el anticipo, recibir&aacute;s una confirmaci&oacute;n y comenzaremos con el desarrollo.</p>
    </div>
  </div>
  <div class="cta-wrap">
    <a href="${process.env.BASE_URL||'https://multitech.do'}/multitech-contacto.html" class="cta-btn">Ver mi cotización →</a>
  </div>
  <div class="email-footer">
    <div class="footer-divider"></div>
    <div class="footer-logo">Multitech · República Dominicana</div>
    <p class="footer-copy">© 2026 Multitech. Todos los derechos reservados.</p>
  </div>
</div></div>
</body>
</html>`;

  try {
    const info = await transporter.sendMail({
      from: FROM,
      to,
      subject: `Cotización #${id} — Multitech`,
      html,
    });
    console.log(`[mailer] Cotización #${id} enviada a ${to} (id: ${info.messageId})`);
  } catch (err) {
    console.error('[mailer] Error al enviar cotización:', err.message);
  }
  } catch (err) {
    console.error('[mailer] Error al crear transporte o template:', err.message);
  }
}

module.exports = { sendWelcomeEmail, sendCotizacionAceptada, sendCotizacionEnviada };
