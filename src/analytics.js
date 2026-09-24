const crypto = require('crypto');
const { query } = require('./db');

const TIME_ZONE = 'Asia/Dubai';
const BOT_RE = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|headless|lighthouse|curl|wget|python|httpclient|monitor/i;

function dayString(date = new Date()) {
  return date.toLocaleDateString('en-CA', { timeZone: TIME_ZONE });
}

function addDays(day, delta) {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

function referrerHost(req) {
  try {
    const host = new URL(req.get('referer') || '').hostname.replace(/^www\./, '');
    const own = (req.hostname || '').replace(/^www\./, '');
    return host && host !== own ? host.slice(0, 190) : null;
  } catch {
    return null;
  }
}

// kind: 'view' (landing page) or 'cv' (CV download)
async function track(req, kind) {
  try {
    const ua = req.get('user-agent') || '';
    if (!ua || BOT_RE.test(ua)) return;
    const day = dayString();
    const visitor = crypto
      .createHash('sha256')
      .update(`${day}|${req.ip}|${ua}|${process.env.SESSION_SECRET || ''}`)
      .digest('hex')
      .slice(0, 24);
    const device = /mobi|android|iphone|ipad/i.test(ua) ? 'mobile' : 'desktop';
    await query('INSERT INTO page_views (day, kind, visitor, referrer, device) VALUES (?, ?, ?, ?, ?)', [
      day,
      kind,
      visitor,
      referrerHost(req),
      device,
    ]);
  } catch (err) {
    console.error('[analytics]', err.message);
  }
}

async function getStats() {
  const today = dayString();
  const from30 = addDays(today, -29);
  const from7 = addDays(today, -6);

  const daily = await query(
    `SELECT DATE_FORMAT(day, '%Y-%m-%d') AS day,
            SUM(kind = 'view') AS views,
            COUNT(DISTINCT CASE WHEN kind = 'view' THEN visitor END) AS visitors,
            SUM(kind = 'cv') AS downloads
       FROM page_views WHERE day >= ? GROUP BY day`,
    [from30]
  );
  const byDay = new Map(daily.map((r) => [r.day, r]));
  const series = [];
  for (let i = 29; i >= 0; i--) {
    const day = addDays(today, -i);
    const r = byDay.get(day);
    series.push({
      day,
      views: Number(r?.views || 0),
      visitors: Number(r?.visitors || 0),
      downloads: Number(r?.downloads || 0),
    });
  }

  const unique = async (from) =>
    Number(
      (
        await query("SELECT COUNT(DISTINCT visitor, day) AS n FROM page_views WHERE kind = 'view' AND day >= ?", [
          from,
        ])
      )[0].n
    );
  const sum = (rows, key) => rows.reduce((a, r) => a + r[key], 0);
  const last7 = series.filter((r) => r.day >= from7);
  const [totals] = await query(
    "SELECT SUM(kind = 'view') AS views, SUM(kind = 'cv') AS downloads FROM page_views"
  );
  const referrers = await query(
    `SELECT referrer, COUNT(*) AS n FROM page_views
      WHERE kind = 'view' AND referrer IS NOT NULL AND day >= ?
      GROUP BY referrer ORDER BY n DESC LIMIT 8`,
    [from30]
  );
  const devices = await query(
    `SELECT device, COUNT(*) AS n FROM page_views WHERE kind = 'view' AND day >= ? GROUP BY device`,
    [from30]
  );

  return {
    series,
    today: series[series.length - 1],
    week: { views: sum(last7, 'views'), visitors: await unique(from7), downloads: sum(last7, 'downloads') },
    month: { views: sum(series, 'views'), visitors: await unique(from30), downloads: sum(series, 'downloads') },
    allTime: { views: Number(totals.views || 0), downloads: Number(totals.downloads || 0) },
    referrers,
    devices,
  };
}

module.exports = { track, getStats };
