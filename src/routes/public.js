const path = require('path');
const express = require('express');
const { query, one } = require('../db');
const { getPageData, getSettings } = require('../content');
const { track } = require('../analytics');
const { rateLimiter, userFromRequest } = require('../auth');
const { sendContactEmail } = require('../mailer');

const router = express.Router();
const contactLimited = rateLimiter(5, 60 * 60 * 1000);
const DEFAULT_CV = path.join(__dirname, '..', '..', 'public', 'files', 'Abdulrahman_El-Saeed_CV.pdf');

function siteUrl(req) {
  return (process.env.SITE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
}

async function trackUnlessAdmin(req, kind) {
  if (req.method !== 'GET' || (await userFromRequest(req))) return;
  await track(req, kind);
}

router.get('/', async (req, res) => {
  const data = await getPageData();
  trackUnlessAdmin(req, 'view');
  res.render('index', {
    ...data,
    siteUrl: siteUrl(req),
    sent: req.query.sent === '1',
    contactError: req.query.error || null,
  });
});

router.get('/cv', async (req, res) => {
  const s = await getSettings();
  const filename = `${s.full_name.replace(/[^A-Za-z0-9]+/g, '_')}_CV.pdf`;
  trackUnlessAdmin(req, 'cv');
  const inline = req.query.view === '1';
  const disposition = `${inline ? 'inline' : 'attachment'}; filename="${filename}"`;
  if (s.cv_asset) {
    const asset = await one('SELECT mime, data FROM assets WHERE id = ?', [Number(s.cv_asset)]);
    if (asset) {
      res.set({ 'Content-Type': asset.mime, 'Content-Disposition': disposition, 'Cache-Control': 'no-cache' });
      return res.send(asset.data);
    }
  }
  res.set({ 'Content-Disposition': disposition, 'Cache-Control': 'no-cache' });
  res.sendFile(DEFAULT_CV);
});

router.get('/media/:id', async (req, res) => {
  const asset = await one('SELECT filename, mime, data FROM assets WHERE id = ?', [Number(req.params.id) || 0]);
  if (!asset) return res.status(404).send('Not found');
  res.set({
    'Content-Type': asset.mime,
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Content-Disposition': `inline; filename="${asset.filename.replace(/"/g, '')}"`,
    'X-Content-Type-Options': 'nosniff',
  });
  res.send(asset.data);
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/contact', async (req, res) => {
  const wantsJson = (req.get('accept') || '').includes('application/json');
  const reply = (status, error) => {
    if (wantsJson) return res.status(status).json(error ? { ok: false, error } : { ok: true });
    return res.redirect(error ? `/?error=${encodeURIComponent(error)}#contact` : '/?sent=1#contact');
  };

  const b = req.body || {};
  // Honeypot: real visitors never fill this hidden field.
  if (b.website) return reply(200);

  const msg = {
    name: String(b.name || '').trim().slice(0, 190),
    email: String(b.email || '').trim().slice(0, 190),
    company: String(b.company || '').trim().slice(0, 190),
    subject: String(b.subject || '').trim().slice(0, 255),
    body: String(b.message || '').trim().slice(0, 5000),
  };
  if (!msg.name || !msg.body) return reply(400, 'Please enter your name and a message.');
  if (!EMAIL_RE.test(msg.email)) return reply(400, 'Please enter a valid email address.');
  if (contactLimited(req.ip)) return reply(429, 'Too many messages. Please try again later or email me directly.');

  const result = await query('INSERT INTO messages SET ?', [msg]);
  try {
    const s = await getSettings();
    const to = process.env.CONTACT_TO || s.email;
    if (await sendContactEmail(msg, to)) {
      await query('UPDATE messages SET emailed = 1 WHERE id = ?', [result.insertId]);
    }
  } catch (err) {
    console.error('[mail]', err.message);
  }
  reply(200);
});

router.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *\nDisallow: /admin\nSitemap: ${siteUrl(req)}/sitemap.xml\n`);
});

router.get('/sitemap.xml', (req, res) => {
  res
    .type('application/xml')
    .send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${siteUrl(req)}/</loc></url></urlset>\n`
    );
});

module.exports = router;
