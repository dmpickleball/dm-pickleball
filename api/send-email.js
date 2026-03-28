import nodemailer from 'nodemailer';

// Unified email handler for all outbound mail (booking confirmations, cancellations,
// contact form, access requests, account approvals).
//
// General mode:  POST { to, subject, text, replyTo? }
// Contact mode:  POST { name, email, phone?, message? }  → sends to CONTACT_GMAIL
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};
  const gmailUser = process.env.CONTACT_GMAIL;
  const gmailPass = process.env.CONTACT_GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass) {
    console.error('Missing CONTACT_GMAIL or CONTACT_GMAIL_APP_PASSWORD env vars');
    return res.status(500).json({ error: 'Email service not configured.' });
  }

  // Detect contact-form mode: has name + email but no to/subject/text
  let to, subject, text, replyTo, html;
  if (body.name && body.email && !body.to) {
    const { name, email, phone, message } = body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email are required.' });
    to      = gmailUser;
    replyTo = email;
    subject = `New contact form message from ${name}`;
    html = `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#f4f9f6;border-radius:12px;">
        <h2 style="color:#1a3c34;margin-top:0;">New Contact Form Submission</h2>
        <table style="width:100%;border-collapse:collapse;font-size:0.95rem;">
          <tr><td style="padding:10px 0;color:#6b7280;font-weight:700;width:120px;">Name</td><td style="padding:10px 0;">${name}</td></tr>
          <tr><td style="padding:10px 0;color:#6b7280;font-weight:700;">Email</td><td style="padding:10px 0;"><a href="mailto:${email}" style="color:#1a3c34;">${email}</a></td></tr>
          ${phone ? `<tr><td style="padding:10px 0;color:#6b7280;font-weight:700;">Phone</td><td style="padding:10px 0;">${phone}</td></tr>` : ''}
          ${message ? `<tr><td style="padding:10px 0;color:#6b7280;font-weight:700;vertical-align:top;">Message</td><td style="padding:10px 0;white-space:pre-wrap;">${message}</td></tr>` : ''}
        </table>
        <hr style="border:none;border-top:1px solid #d1fae5;margin:20px 0;"/>
        <p style="font-size:0.8rem;color:#9ca3af;margin:0;">Sent from dmpickleball.com contact form</p>
      </div>`;
  } else {
    // General mode
    ({ to, subject, text, html, replyTo } = body);
    if (!to || !subject || (!text && !html)) {
      return res.status(400).json({ error: 'to, subject, and text or html are required.' });
    }
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
      ...(html ? { html } : { text }),
      ...(replyTo ? { replyTo } : {}),
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('send-email error:', err);
    return res.status(500).json({ error: 'Failed to send email.' });
  }
}
