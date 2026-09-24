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
  };
}

module.exports = { getSettings, setSettings, getPageData, lines };
