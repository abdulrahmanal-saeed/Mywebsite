const nodemailer = require('nodemailer');

let transport;

function isConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
}

function getTransport() {
  if (!transport) {
    const port = Number(process.env.SMTP_PORT || 465);
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    });
  }
  return transport;
}

async function sendContactEmail(msg, to) {
  if (!isConfigured() || !to) return false;
  const lines = [
    `Name: ${msg.name}`,
    `Email: ${msg.email}`,
    msg.company ? `Company: ${msg.company}` : null,
    msg.subject ? `Subject: ${msg.subject}` : null,
    '',
    msg.body,
  ].filter((l) => l !== null);
  await getTransport().sendMail({
    from: `"Website contact form" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    replyTo: `"${msg.name.replace(/"/g, '')}" <${msg.email}>`,
    subject: `New message from your website: ${msg.subject || msg.name}`,
    text: lines.join('\n'),
  });
  return true;
}

module.exports = { sendContactEmail, isConfigured };
