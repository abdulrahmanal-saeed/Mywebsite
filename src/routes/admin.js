const express = require('express');
const multer = require('multer');
const { query, one } = require('../db');
const collections = require('../collections');
const { getSettings, setSettings, lines } = require('../content');
const { getStats } = require('../analytics');
const auth = require('../auth');
const { isConfigured: mailConfigured } = require('../mailer');

const router = express.Router();
const loginLimited = auth.rateLimiter(10, 15 * 60 * 1000);

const MAX_UPLOAD = 8 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD, files: 3 },
});

// Block cross-site form posts (in addition to SameSite cookies).
router.use((req, res, next) => {
  if (req.method !== 'POST') return next();
  const origin = req.get('origin');
  if (!origin) return next();
  const allowed = [req.get('host'), req.get('x-forwarded-host')];
  if (process.env.SITE_URL) allowed.push(new URL(process.env.SITE_URL).host);
  let host = null;
  try {
    host = new URL(origin).host;
  } catch {}
  if (host && allowed.includes(host)) return next();
  console.warn(`[admin] Blocked POST from origin ${origin} (host ${req.get('host')})`);
  res.status(403).send('Forbidden');
});

router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  res.set('X-Robots-Tag', 'noindex');
  next();
});

// ---------- Login ----------
router.get('/login', async (req, res) => {
  if (await auth.userFromRequest(req)) return res.redirect('/admin');
  const hasAdmin = (await one('SELECT COUNT(*) AS n FROM admin_users')).n > 0;
  res.render('admin/login', { error: null, email: '', hasAdmin });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  const hasAdmin = true;
  if (loginLimited(req.ip)) {
    return res.status(429).render('admin/login', { error: 'Too many attempts. Wait 15 minutes and try again.', email, hasAdmin });
  }
  const user = await auth.verifyLogin(email, password);
  if (!user) return res.status(401).render('admin/login', { error: 'Wrong email or password.', email, hasAdmin });
  auth.setSessionCookie(req, res, user);
  res.redirect('/admin');
});

router.post('/logout', (req, res) => {
  auth.clearSessionCookie(res);
  res.redirect('/admin/login');
});

// ---------- Everything below requires login ----------
router.use(async (req, res, next) => {
  const user = await auth.userFromRequest(req);
  if (!user) return res.redirect('/admin/login');
  req.user = user;
  res.locals.user = user;
  res.locals.unread = (await one('SELECT COUNT(*) AS n FROM messages WHERE is_read = 0')).n;
  res.locals.collections = collections;
  res.locals.path = req.path;
  res.locals.notice = req.query.notice || null;
  next();
});

function withNotice(url, notice) {
  return `${url}${url.includes('?') ? '&' : '?'}notice=${encodeURIComponent(notice)}`;
}

async function saveAsset(file) {
  const result = await query('INSERT INTO assets (filename, mime, size, data) VALUES (?, ?, ?, ?)', [
    file.originalname.slice(0, 255),
    file.mimetype,
    file.size,
    file.buffer,
  ]);
  return result.insertId;
}

async function deleteAsset(id) {
  if (id) await query('DELETE FROM assets WHERE id = ?', [Number(id)]);
}

function uploadFields(fields) {
  const handler = upload.fields(fields);
  return (req, res, next) =>
    handler(req, res, (err) => {
      if (!err) return next();
      const message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large (max 8 MB).' : err.message;
      res.redirect(withNotice(req.originalUrl, `Error: ${message}`));
    });
}

// ---------- Dashboard ----------
router.get('/', async (req, res) => {
  const [stats, recent, counts] = await Promise.all([
    getStats(),
    query('SELECT id, name, subject, is_read, created_at FROM messages ORDER BY id DESC LIMIT 5'),
    Promise.all(
      Object.entries(collections).map(async ([key, c]) => ({
        key,
        title: c.title,
        n: (await one(`SELECT COUNT(*) AS n FROM ${c.table}`)).n,
      }))
    ),
  ]);
  res.render('admin/dashboard', { stats, recent, counts, mailConfigured: mailConfigured() });
});

// ---------- Profile & settings ----------
const SETTING_FIELDS = [
  'full_name', 'headline', 'tagline', 'location', 'email', 'phone', 'whatsapp', 'linkedin',
  'availability', 'summary', 'seo_title', 'seo_description',
];
const SETTING_FLAGS = [
  'open_to_work', 'show_achievements', 'show_experience', 'show_skills', 'show_education',
  'show_certifications', 'show_contact',
];

router.get('/settings', async (req, res) => {
  res.render('admin/settings', { s: await getSettings() });
});

router.post(
  '/settings',
  uploadFields([
    { name: 'photo', maxCount: 1 },
    { name: 'cv', maxCount: 1 },
  ]),
  async (req, res) => {
    const b = req.body || {};
    const current = await getSettings();
    const values = {};
    for (const f of SETTING_FIELDS) values[f] = String(b[f] ?? '').trim();
    for (const f of SETTING_FLAGS) values[f] = b[f] ? '1' : '0';
    values.whatsapp = values.whatsapp.replace(/[^\d]/g, '');
    if (values.linkedin && !/^https?:\/\//i.test(values.linkedin)) values.linkedin = `https://${values.linkedin}`;
    if (!values.full_name) return res.redirect(withNotice('/admin/settings', 'Error: Name is required.'));

    const photo = req.files?.photo?.[0];
    const cv = req.files?.cv?.[0];
    if (photo && !IMAGE_TYPES.includes(photo.mimetype)) {
      return res.redirect(withNotice('/admin/settings', 'Error: Photo must be JPG, PNG or WebP.'));
    }
    if (cv && cv.mimetype !== 'application/pdf') {
      return res.redirect(withNotice('/admin/settings', 'Error: CV must be a PDF file.'));
    }
    if (photo || b.remove_photo) {
      await deleteAsset(current.photo_asset);
      values.photo_asset = photo ? await saveAsset(photo) : '';
    }
    if (cv || b.remove_cv) {
      await deleteAsset(current.cv_asset);
      values.cv_asset = cv ? await saveAsset(cv) : '';
    }
    await setSettings(values);
    res.redirect(withNotice('/admin/settings', 'Saved. Your website is updated.'));
  }
);

// ---------- Messages ----------
router.get('/messages', async (req, res) => {
  const messages = await query('SELECT * FROM messages ORDER BY id DESC LIMIT 500');
  res.render('admin/messages', { messages });
});

router.get('/messages/:id', async (req, res) => {
  const message = await one('SELECT * FROM messages WHERE id = ?', [Number(req.params.id)]);
  if (!message) return res.redirect('/admin/messages');
  if (!message.is_read) {
    await query('UPDATE messages SET is_read = 1 WHERE id = ?', [message.id]);
    res.locals.unread = Math.max(0, res.locals.unread - 1);
  }
  res.render('admin/message', { message });
});

router.post('/messages/:id/unread', async (req, res) => {
  await query('UPDATE messages SET is_read = 0 WHERE id = ?', [Number(req.params.id)]);
  res.redirect('/admin/messages');
});

router.post('/messages/:id/delete', async (req, res) => {
  await query('DELETE FROM messages WHERE id = ?', [Number(req.params.id)]);
  res.redirect(withNotice('/admin/messages', 'Message deleted.'));
});

// ---------- Account ----------
router.get('/account', (req, res) => res.render('admin/account', { error: null }));

router.post('/account', async (req, res) => {
  const { current, password, confirm } = req.body || {};
  const ok = await auth.verifyLogin(req.user.email, current);
  let error = null;
  if (!ok) error = 'Current password is wrong.';
  else if (String(password || '').length < 8) error = 'New password must be at least 8 characters.';
  else if (password !== confirm) error = 'The new passwords do not match.';
  if (error) return res.status(400).render('admin/account', { error });
  const user = await auth.changePassword(req.user.id, password);
  auth.setSessionCookie(req, res, user);
  res.redirect(withNotice('/admin/account', 'Password changed.'));
});

// ---------- Generic collections (experience, skills, ...) ----------
function getCollection(req, res, next) {
  const c = collections[req.params.col];
  if (!c) return res.status(404).render('admin/notfound');
  req.col = { key: req.params.col, ...c };
  res.locals.col = req.col;
  next();
}

function readForm(col, body) {
  const data = {};
  const errors = [];
  for (const f of col.fields) {
    if (f.type === 'file') continue;
    let v = body[f.name];
    if (f.type === 'checkbox') v = v ? 1 : 0;
    else if (f.type === 'lines') v = lines(v).join('\n');
    else v = String(v ?? '').trim();
    if (f.type === 'url' && v && !/^https?:\/\//i.test(v)) v = `https://${v}`;
    if (f.required && !v) errors.push(`${f.label} is required.`);
    data[f.name] = v;
  }
  return { data, errors };
}

function fileField(col) {
  return col.fields.find((f) => f.type === 'file');
}

router.get('/:col', getCollection, async (req, res) => {
  const items = await query(`SELECT * FROM ${req.col.table} ORDER BY sort_order, id`);
  res.render('admin/list', { items });
});

router.get('/:col/new', getCollection, (req, res) => {
  const item = {};
  for (const f of req.col.fields) if (f.default !== undefined) item[f.name] = f.default;
  res.render('admin/form', { item, errors: [] });
});

router.get('/:col/:id/edit', getCollection, async (req, res) => {
  const item = await one(`SELECT * FROM ${req.col.table} WHERE id = ?`, [Number(req.params.id)]);
  if (!item) return res.redirect(`/admin/${req.col.key}`);
  res.render('admin/form', { item, errors: [] });
});

async function handleSave(req, res) {
  const col = req.col;
  const id = req.params.id ? Number(req.params.id) : null;
  const existing = id ? await one(`SELECT * FROM ${col.table} WHERE id = ?`, [id]) : null;
  if (id && !existing) return res.redirect(`/admin/${col.key}`);

  const { data, errors } = readForm(col, req.body || {});
  const ff = fileField(col);
  const file = ff && req.files?.[ff.name]?.[0];
  if (file && !IMAGE_TYPES.concat('application/pdf').includes(file.mimetype)) {
    errors.push('File must be an image (JPG, PNG, WebP) or a PDF.');
  }
  if (errors.length) {
    return res.status(400).render('admin/form', { item: { ...existing, ...data, id }, errors });
  }
  if (ff && (file || req.body[`remove_${ff.name}`])) {
    if (existing) await deleteAsset(existing[ff.name]);
    data[ff.name] = file ? await saveAsset(file) : null;
  }

  if (existing) {
    await query(`UPDATE ${col.table} SET ? WHERE id = ?`, [data, id]);
  } else {
    // New items go to the top of the list.
    const { m } = await one(`SELECT COALESCE(MIN(sort_order), 10) AS m FROM ${col.table}`);
    data.sort_order = m - 10;
    await query(`INSERT INTO ${col.table} SET ?`, [data]);
  }
  res.redirect(withNotice(`/admin/${col.key}`, `${col.singular} saved.`));
}

function colUpload(req, res, next) {
  const ff = fileField(req.col);
  if (!ff) return upload.none()(req, res, next);
  return uploadFields([{ name: ff.name, maxCount: 1 }])(req, res, next);
}

router.post('/:col', getCollection, colUpload, handleSave);
router.post('/:col/:id', getCollection, colUpload, handleSave);

router.post('/:col/:id/delete', getCollection, async (req, res) => {
  const col = req.col;
  const ff = fileField(col);
  const item = await one(`SELECT * FROM ${col.table} WHERE id = ?`, [Number(req.params.id)]);
  if (item) {
    if (ff) await deleteAsset(item[ff.name]);
    await query(`DELETE FROM ${col.table} WHERE id = ?`, [item.id]);
  }
  res.redirect(withNotice(`/admin/${col.key}`, `${col.singular} deleted.`));
});

router.post('/:col/:id/toggle', getCollection, async (req, res) => {
  await query(`UPDATE ${req.col.table} SET visible = 1 - visible WHERE id = ?`, [Number(req.params.id)]);
  res.redirect(`/admin/${req.col.key}`);
});

// Move an item up or down by renumbering the whole list.
router.post('/:col/:id/move', getCollection, async (req, res) => {
  const col = req.col;
  const items = await query(`SELECT id FROM ${col.table} ORDER BY sort_order, id`);
  const i = items.findIndex((r) => r.id === Number(req.params.id));
  const j = req.body.dir === 'up' ? i - 1 : i + 1;
  if (i >= 0 && j >= 0 && j < items.length) {
    [items[i], items[j]] = [items[j], items[i]];
    for (let k = 0; k < items.length; k++) {
      await query(`UPDATE ${col.table} SET sort_order = ? WHERE id = ?`, [(k + 1) * 10, items[k].id]);
    }
  }
  res.redirect(`/admin/${col.key}#item-${req.params.id}`);
});

module.exports = router;
