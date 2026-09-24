require('dotenv').config({ quiet: true });

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const { migrate } = require('./src/db');
const { seed } = require('./src/seed');
const { ensureAdmin } = require('./src/auth');

const app = express();
app.set('trust proxy', true);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.disable('x-powered-by');

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:'],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'"],
        frameSrc: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
    // helmet's default (no-referrer) makes browsers send "Origin: null" on form posts.
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);
app.use(compression());
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '7d' }));

// Until the database is ready, explain what is wrong instead of crashing.
let ready = false;
let startupError = null;
app.get('/healthz', (req, res) => res.status(ready ? 200 : 503).json({ ready, error: startupError }));
app.use((req, res, next) => {
  if (ready) return next();
  res
    .status(503)
    .type('html')
    .send(
      `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Starting…</title>` +
        `<body style="font-family:system-ui,sans-serif;max-width:640px;margin:60px auto;padding:0 16px;line-height:1.6">` +
        `<h1 style="font-size:22px">The website is starting up</h1>` +
        (startupError
          ? `<p>It can't connect to the database yet. It retries every 15 seconds.</p><pre style="white-space:pre-wrap;background:#f4f4f4;padding:12px;border-radius:8px">${startupError.replace(/[<>&]/g, '')}</pre><p>Check DB_HOST, DB_NAME, DB_USER and DB_PASSWORD in the hosting environment variables.</p>`
          : '<p>Please refresh in a few seconds.</p>') +
        `</body>`
    );
});

app.use('/admin', require('./src/routes/admin'));
app.use('/', require('./src/routes/public'));

app.use((req, res) => res.status(404).render('404'));

app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).send('Something went wrong. Please try again.');
});

function describeDbSettings() {
  const missing = ['DB_NAME', 'DB_USER', 'DB_PASSWORD'].filter((k) => !process.env[k]);
  const where = `host=${process.env.DB_HOST || 'localhost'} db=${process.env.DB_NAME || '?'} user=${process.env.DB_USER || '?'}`;
  return missing.length ? `Missing environment variables: ${missing.join(', ')}. (${where})` : where;
}

async function init() {
  try {
    await migrate();
    if (await seed()) console.log('[db] Seeded initial CV content');
    await ensureAdmin();
    ready = true;
    startupError = null;
    console.log('[db] Ready');
  } catch (err) {
    startupError = `${err.code || err.name}: ${err.message}\n${describeDbSettings()}`;
    console.error('[db] Startup failed, retrying in 15s:', startupError);
    setTimeout(init, 15000);
  }
}

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`Website running on port ${port}`);
  init();
});
