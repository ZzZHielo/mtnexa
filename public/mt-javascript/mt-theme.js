/* ── Multitech Theme Engine ── */
const MT_THEMES = {
  beige: {
    label: 'Beige',
    '--bg':        '#f5f0e8',
    '--bg2':       '#ede8de',
    '--bg3':       '#e6dfcf',
    '--surface':   '#faf7f2',
    '--border':    '#d9d1c0',
    '--text':      '#2c2416',
    '--text-soft': '#6b5e47',
    '--text-muted':'#a39880',
    '--accent':    '#7a5c3a',
    '--accent-bg': '#e8dfc8',
    '--accent-txt':'#3d2e16',
    '--btn-bg':    '#2c2416',
    '--btn-txt':   '#faf7f2',
    '--nav-bg':    'rgba(245,240,232,0.92)',
    '--radius':    '14px',
    '--font-head': "'Playfair Display', Georgia, serif",
    '--font-body': "'DM Sans', sans-serif",
  },
  dark: {
    label: 'Dark',
    '--bg':        '#111010',
    '--bg2':       '#181717',
    '--bg3':       '#1e1d1d',
    '--surface':   '#141313',
    '--border':    '#2e2c2c',
    '--text':      '#f0ede8',
    '--text-soft': '#8a8480',
    '--text-muted':'#524f4c',
    '--accent':    '#d4a96a',
    '--accent-bg': '#2a2218',
    '--accent-txt':'#d4a96a',
    '--btn-bg':    '#f0ede8',
    '--btn-txt':   '#111010',
    '--nav-bg':    'rgba(17,16,16,0.95)',
    '--radius':    '14px',
    '--font-head': "'Playfair Display', Georgia, serif",
    '--font-body': "'DM Sans', sans-serif",
  },
  blanc: {
    label: 'Blanc',
    '--bg':        '#ffffff',
    '--bg2':       '#f7f7f7',
    '--bg3':       '#f0f0f0',
    '--surface':   '#ffffff',
    '--border':    '#e2e2e2',
    '--text':      '#141414',
    '--text-soft': '#5a5a5a',
    '--text-muted':'#a0a0a0',
    '--accent':    '#141414',
    '--accent-bg': '#f0f0f0',
    '--accent-txt':'#141414',
    '--btn-bg':    '#141414',
    '--btn-txt':   '#ffffff',
    '--nav-bg':    'rgba(255,255,255,0.92)',
    '--radius':    '8px',
    '--font-head': "'Playfair Display', Georgia, serif",
    '--font-body': "'DM Sans', sans-serif",
  },
  slate: {
    label: 'Slate',
    '--bg':        '#1a2332',
    '--bg2':       '#1e2a3d',
    '--bg3':       '#243047',
    '--surface':   '#1d2738',
    '--border':    '#2d3d52',
    '--text':      '#e8edf5',
    '--text-soft': '#7a8fa8',
    '--text-muted':'#445570',
    '--accent':    '#6eb5ff',
    '--accent-bg': '#1e3050',
    '--accent-txt':'#6eb5ff',
    '--btn-bg':    '#e8edf5',
    '--btn-txt':   '#1a2332',
    '--nav-bg':    'rgba(26,35,50,0.95)',
    '--radius':    '12px',
    '--font-head': "'Playfair Display', Georgia, serif",
    '--font-body': "'DM Sans', sans-serif",
  },
  sage: {
    label: 'Sage',
    '--bg':        '#f2f4ef',
    '--bg2':       '#e8ebe3',
    '--bg3':       '#dee2d8',
    '--surface':   '#f5f7f2',
    '--border':    '#cdd3c6',
    '--text':      '#1e2418',
    '--text-soft': '#596050',
    '--text-muted':'#96a08e',
    '--accent':    '#4a6740',
    '--accent-bg': '#dce8d6',
    '--accent-txt':'#2a4022',
    '--btn-bg':    '#1e2418',
    '--btn-txt':   '#f5f7f2',
    '--nav-bg':    'rgba(242,244,239,0.92)',
    '--radius':    '16px',
    '--font-head': "'Playfair Display', Georgia, serif",
    '--font-body': "'DM Sans', sans-serif",
  }
};

function mtApplyTheme(key) {
  const t = MT_THEMES[key];
  if (!t) return;
  const root = document.documentElement;
  Object.entries(t).forEach(([k, v]) => {
    if (k.startsWith('--')) root.style.setProperty(k, v);
  });
  root.setAttribute('data-theme', key);
  try { localStorage.setItem('mt_theme', key); } catch(e) {}
  document.querySelectorAll('.mt-theme-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.theme === key);
  });
}

function mtInitTheme() {
  let saved = 'beige';
  try { saved = localStorage.getItem('mt_theme') || 'beige'; } catch(e) {}
  if (!MT_THEMES[saved]) saved = 'beige';
  mtApplyTheme(saved);
}

mtInitTheme();