import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Returns a configured Nodemailer transporter instance
 */
export function getTransporter() {
  const host = process.env.EMAIL_HOST || 'mail.techmiresolutions.com';
  const port = parseInt(process.env.EMAIL_PORT || '587', 10);
  const isSecure = port === 465;
  const user = process.env.EMAIL_HOST_USER || process.env.EMAIL_USER;
  const pass = process.env.EMAIL_HOST_PASSWORD || process.env.EMAIL_PASS;

  if (!user || !pass) {
    return null;
  }

  const isGmail = host.toLowerCase().includes('gmail.com');

  if (isGmail) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: isSecure, // true for 465, false for 587 / 25
    requireTLS: !isSecure, // enable STARTTLS for 587 / 25
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 10000, // 10s connection timeout
    greetingTimeout: 10000,   // 10s greeting timeout
    socketTimeout: 15000,     // 15s socket timeout
  });
}

/**
 * Verify SMTP credentials and connectivity
 */
export async function verifySmtpConnection() {
  const host = process.env.EMAIL_HOST || 'mail.techmiresolutions.com';
  const port = parseInt(process.env.EMAIL_PORT || '587', 10);
  const user = process.env.EMAIL_HOST_USER || process.env.EMAIL_USER;
  const pass = process.env.EMAIL_HOST_PASSWORD || process.env.EMAIL_PASS;

  if (!user || !pass) {
    return {
      ok: false,
      error: `Missing EMAIL_HOST_USER / EMAIL_USER or EMAIL_HOST_PASSWORD / EMAIL_PASS in environment.`,
    };
  }

  try {
    const transporter = getTransporter();
    if (!transporter) {
      return { ok: false, error: 'Could not initialize Nodemailer transport.' };
    }

    await transporter.verify();
    return {
      ok: true,
      message: `Connected & authenticated successfully with ${host}:${port} as ${user}!`,
    };
  } catch (err) {
    console.error(`[SMTP Verification Failed] ${host}:${port}:`, err.message);
    return {
      ok: false,
      error: `SMTP (${host}:${port}) returned: ${err.message}`,
    };
  }
}

/**
 * Send an email with optional BCC and graceful fallback
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} [options.text] - Plain text content
 * @param {string} [options.html] - Optional HTML content
 * @param {string|string[]} [options.bcc] - Optional BCC address
 * @returns {Promise<{success: boolean, info?: any, error?: string, reason?: string}>}
 */
export async function sendEmail({ to, subject, text, html, bcc }) {
  const user = process.env.EMAIL_HOST_USER || process.env.EMAIL_USER;
  const pass = process.env.EMAIL_HOST_PASSWORD || process.env.EMAIL_PASS;

  if (!user || !pass) {
    console.warn('[SMTP Skipped] Missing email credentials in environment.');
    return { success: false, reason: 'unconfigured' };
  }

  const host = process.env.EMAIL_HOST || 'mail.techmiresolutions.com';
  const senderEmail = process.env.EMAIL_FROM || `"Training Mania" <${user}>`;
  const bccAddress = bcc !== undefined ? bcc : process.env.EMAIL_BCC;

  try {
    const transporter = getTransporter();
    if (!transporter) {
      return { success: false, reason: 'transporter_unavailable' };
    }

    const mailOptions = {
      from: senderEmail,
      to,
      subject,
      text: text || '',
      html: html || (text ? text.replace(/\n/g, '<br/>') : ''),
      ...(bccAddress ? { bcc: bccAddress } : {}),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[SMTP Success] Email delivered to ${to}: ${info.messageId}`);
    return { success: true, info };
  } catch (error) {
    console.error(`[SMTP Failed] Error delivering to ${to} via ${host}:`, error.message);
    return { success: false, error: error.message };
  }
}

export default { getTransporter, verifySmtpConnection, sendEmail };
