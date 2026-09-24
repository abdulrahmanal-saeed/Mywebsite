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

app.use('/admin', require('./src/routes/admin'));
app.use('/', require('./src/routes/public'));

app.use((req, res) => res.status(404).render('404'));

app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).send('Something went wrong. Please try again.');
});

async function start() {
  await migrate();
  if (await seed()) console.log('[db] Seeded initial CV content');
  await ensureAdmin();
  const port = Number(process.env.PORT || 3000);
  app.listen(port, () => console.log(`Website running on http://localhost:${port}`));
}

start().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
