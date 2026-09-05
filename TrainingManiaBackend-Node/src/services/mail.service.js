import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

export function getTransporter() {
  const host = process.env.EMAIL_HOST || 'mail.techmiresolutions.com';
  const port = parseInt(process.env.EMAIL_PORT || '465', 10);
  const isSslDirect = port === 465;
  const user = process.env.EMAIL_HOST_USER || process.env.EMAIL_USER;
  const pass = process.env.EMAIL_HOST_PASSWORD || process.env.EMAIL_PASS;

  if (!user || !pass) {
    return null;
  }

  const isGmail = host.toLowerCase().includes('gmail.com');

  const transportConfig = isGmail
    ? {
        service: 'gmail',
        auth: {
          user,
          pass,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
      }
    : {
        host,
        port,
        secure: isSslDirect, // true for port 465 (SSL), false for 587 / 25 (STARTTLS)
        auth: {
          user,
          pass,
        },
        tls: {
          rejectUnauthorized: false,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
      };

  return nodemailer.createTransport(transportConfig);
}

/**
 * Verify SMTP credentials and connectivity
 */
export async function verifySmtpConnection() {
  const host = process.env.EMAIL_HOST || 'mail.techmiresolutions.com';
  const port = parseInt(process.env.EMAIL_PORT || '465', 10);
  const user = process.env.EMAIL_HOST_USER || process.env.EMAIL_USER;
  const pass = process.env.EMAIL_HOST_PASSWORD || process.env.EMAIL_PASS;

  if (!user || !pass) {
    return {
      ok: false,
      error: `Missing EMAIL_USER or EMAIL_PASS environment variables on ${host}:${port}.`,
    };
  }

  try {
    const transporter = getTransporter();
    if (!transporter) {
      return { ok: false, error: 'Could not initialize SMTP transport.' };
    }
    await transporter.verify();
    return { ok: true, message: `Connected and authenticated successfully with ${host}:${port} as ${user}!` };
  } catch (err) {
    return {
      ok: false,
      error: `SMTP server (${host}:${port}) returned: ${err.message}`,
    };
  }
}

/**
 * Send an email with optional BCC
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} [options.html] - Optional HTML content
 * @param {string|string[]} [options.bcc] - Optional BCC address
 */
export async function sendEmail({ to, subject, text, html, bcc }) {
  const host = process.env.EMAIL_HOST || 'mail.techmiresolutions.com';
  const user = process.env.EMAIL_HOST_USER || process.env.EMAIL_USER;
  const senderEmail = process.env.EMAIL_FROM || user || 'trainingmania@techmiresolutions.com';
  const bccAddress = bcc !== undefined ? bcc : process.env.EMAIL_BCC;

  const transporter = getTransporter();
  if (!transporter) {
    console.warn(`[MailService] SMTP credentials not supplied for ${host}. Skipping email dispatch to:`, to);
    return { success: false, message: 'SMTP credentials not configured in environment' };
  }

  const mailOptions = {
    from: `"Training Mania" <${senderEmail}>`,
    to,
    subject,
    text,
    html: html || text.replace(/\n/g, '<br/>'),
    ...(bccAddress ? { bcc: bccAddress } : {}),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[MailService] Email successfully sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[MailService] Failed to send email to ${to}:`, error.message);
    throw error;
  }
}

export default { getTransporter, verifySmtpConnection, sendEmail };
