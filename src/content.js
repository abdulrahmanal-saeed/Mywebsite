const { query } = require('./db');
const { DEFAULT_SETTINGS } = require('./seed');

async function getSettings() {
  const rows = await query('SELECT name, value FROM settings');
  const s = { ...DEFAULT_SETTINGS };
  for (const r of rows) s[r.name] = r.value ?? '';
  return s;
}

async function setSettings(values) {
  for (const [name, value] of Object.entries(values)) {
    await query(
      'INSERT INTO settings (name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)',
      [name, value == null ? '' : String(value)]
    );
  }
}

function lines(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

function paragraphs(text) {
  return String(text || '')
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

// Replace {year}, {name}, {email}... in admin-written text.
function fillPlaceholders(text, s) {
  const values = {
    year: String(new Date().getFullYear()),
    name: s.full_name,
    location: s.location,
    email: s.email,
    phone: s.phone,
    linkedin: s.linkedin,
    whatsapp: s.whatsapp ? `https://wa.me/${s.whatsapp}` : '',
  };
  return String(text || '').replace(/\{(\w+)\}/g, (m, k) => (k in values ? values[k] || '' : m));
}

const SAFE_URL = /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i;

// Footer links are written one per line as "Label | URL".
function footerLinks(s) {
  return lines(s.footer_links)
    .map((line) => {
      const i = line.indexOf('|');
      if (i < 0) return null;
      const label = line.slice(0, i).trim();
      let url = fillPlaceholders(line.slice(i + 1).trim(), s);
      if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(url)) url = `https://${url}`;
      if (!label || !SAFE_URL.test(url) || /^(mailto:|tel:)?$/i.test(url)) return null;
      return { label, url, external: /^https?:/i.test(url) };
    })
    .filter(Boolean);
}

async function getPageData() {
  const order = 'WHERE visible = 1 ORDER BY sort_order, id';
  const [settings, experiences, achievements, skills, education, certifications] = await Promise.all([
    getSettings(),
    query(`SELECT * FROM experiences ${order}`),
    query(`SELECT * FROM achievements ${order}`),
    query(`SELECT * FROM skills ${order}`),
    query(`SELECT * FROM education ${order}`),
    query(`SELECT * FROM certifications ${order}`),
  ]);

  const skillGroups = [];
  for (const skill of skills) {
    let group = skillGroups.find((g) => g.category === skill.category);
    if (!group) skillGroups.push((group = { category: skill.category, items: [] }));
    group.items.push(skill.name);
  }

  return {
    s: settings,
    experiences: experiences.map((e) => ({ ...e, bulletList: lines(e.bullets) })),
    achievements,
    skillGroups,
    education,
    certifications,
    summaryParagraphs: paragraphs(settings.summary),
    footerText: fillPlaceholders(settings.footer_text, settings),
    footerLinks: footerLinks(settings),
  };
}

module.exports = { getSettings, setSettings, getPageData, lines };
