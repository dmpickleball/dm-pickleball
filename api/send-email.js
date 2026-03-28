import nodemailer from 'nodemailer';

// General-purpose email sender used by booking confirmations, access requests, etc.
// POST body: { to, subject, text, replyTo? }
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, text, replyTo } = req.body || {};

  if (!to || !subject || !text) {
    return res.status(400).json({ error: 'to, subject, and text are required.' });
  }

  const gmailUser = process.env.CONTACT_GMAIL;
  const gmailPass = process.env.CONTACT_GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass) {
    console.error('Missing CONTACT_GMAIL or CONTACT_GMAIL_APP_PASSWORD env vars');
    return res.status(500).json({ error: 'Email service not configured.' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: gmailUser, pass: gmailPass },
  });

  try {
    await transporter.sendMail({
      from: `"DM Pickleball" <${gmailUser}>`,
      to,
      subject,
      text,
      ...(replyTo ? { replyTo } : {}),
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('send-email error:', err);
    return res.status(500).json({ error: 'Failed to send email.' });
  }
}
