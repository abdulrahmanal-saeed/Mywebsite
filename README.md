# abdulrahmanalsaeed.com

The personal CV website of **Abdulrahman El-Saeed**, with an admin panel for managing everything on the page.

- **Website:** `/`, a landing page that works as a CV (experience, achievements, skills, education, courses, contact form, CV download).
- **Admin panel:** `/admin`, where you edit, add, delete, hide and reorder any section; upload your photo, CV and certificates; read messages; and see visitor and CV-download stats.

Stack: Node.js (Express) + EJS + MySQL. No build step.

---

## Deploying on Hostinger (step by step)

### 1) Create the database
1. hPanel → **Websites** → abdulrahmanalsaeed.com → **Databases** → **MySQL Databases**.
2. Create a new database and a user (for example `cvsite` / `cvuser`) with a strong password.
3. Note down the **database name**, **user** and **password** exactly as shown. Hostinger adds a prefix such as `u807160300_`.

### 2) (Recommended) Create an email for the contact form
To get website messages in your Gmail:
1. hPanel → **Emails** → create a mailbox such as `info@abdulrahmanalsaeed.com`.
2. The site sends from this mailbox to `abdulrahmanalsaeed5@gmail.com`.

> If you skip this step, messages are still saved in the admin panel under **Messages**.

### 3) Create the Node.js app from GitHub
1. hPanel → **Websites** → **Add website** → **Node.js Apps**, or open the domain → **Node.js**.
2. Choose **Import Git repository** and connect GitHub.
3. Select the repository `abdulrahmanal-saeed/Mywebsite` and the branch `main`.
4. Settings:
   - **Framework:** Express, or Other
   - **Node version:** 22.x
   - **Entry file:** `server.js`
   - **Build command:** leave it empty
   - **Start command:** `npm start`, if one is required
5. Link the app to the domain `abdulrahmanalsaeed.com`.

### 4) Environment variables
In the Node.js app settings → **Environment variables**, add:

| Name | Value |
|---|---|
| `NODE_ENV` | `production` |
| `SITE_URL` | `https://abdulrahmanalsaeed.com` |
| `DB_HOST` | `127.0.0.1` (or the MySQL host shown in hPanel) |
| `DB_NAME` | database name from step 1 |
| `DB_USER` | database user from step 1 |
| `DB_PASSWORD` | database password |
| `ADMIN_EMAIL` | `abdulrahmanalsaeed5@gmail.com` |
| `ADMIN_PASSWORD` | a strong password (8+ characters) for the admin panel |
| `SESSION_SECRET` | long random text, e.g. 40 random letters and numbers |
| `SMTP_HOST` | `smtp.hostinger.com` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | `info@abdulrahmanalsaeed.com` |
| `SMTP_PASSWORD` | mailbox password |
| `CONTACT_TO` | `abdulrahmanalsaeed5@gmail.com` |

Then click **Deploy** / **Restart**.

On first start the app automatically:
- creates all the tables in the database;
- fills them with your CV data;
- creates the admin account from `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

### 5) Log in
Open `https://abdulrahmanalsaeed.com/admin` and log in. It's a good idea to change the password from **Account** afterwards.

### Updating the site
Any push to the `main` branch on GitHub redeploys the site automatically. Your data (text, photos, messages, stats) lives in the database and survives redeploys.

---

## What you can do in the admin panel
- **Profile & settings:** name, headline, intro, summary, open-to-work badge, contact details, WhatsApp, LinkedIn, profile photo, CV PDF, show/hide sections, and the title and description Google shows.
- **Experience / Achievements / Skills / Education / Certifications:** add, edit, delete, hide, and reorder with ↑ ↓. Certifications can carry an uploaded certificate file (image or PDF).
- **Messages:** everything sent through the contact form.
- **Dashboard:** visitors, page views, CV downloads, traffic sources and devices.
- **Account:** change your password.

---

## Local development

```bash
npm install
cp .env.example .env   # fill in local MySQL details
npm run dev
```
