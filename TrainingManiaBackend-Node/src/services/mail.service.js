import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

export function getTransporter() {
  const host = process.env.EMAIL_HOST;
  const port = parseInt(process.env.EMAIL_PORT || '465', 10);
  const secure = process.env.EMAIL_SECURE === 'true' || port === 465;
  const user = process.env.EMAIL_HOST_USER || process.env.EMAIL_USER;
  const pass = process.env.EMAIL_HOST_PASSWORD || process.env.EMAIL_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  // Common options for standard SMTP, Gmail, SendGrid, Mailgun, AWS SES, cPanel
  const isGmail = host.toLowerCase().includes('gmail.com');

  const transportConfig = isGmail
    ? {
        service: 'gmail',
        auth: {
          user,
          pass, // Note: For Gmail, this must be a 16-character App Password (not standard account password)
        },
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 8000,
      }
    : {
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
        tls: {
          rejectUnauthorized: false,
          minVersion: 'TLSv1.2',
        },
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 8000,
      };

  return nodemailer.createTransport(transportConfig);
}

/**
 * Verify SMTP credentials and connectivity
 */
export async function verifySmtpConnection() {
  const host = process.env.EMAIL_HOST;
  const user = process.env.EMAIL_HOST_USER || process.env.EMAIL_USER;
  const pass = process.env.EMAIL_HOST_PASSWORD || process.env.EMAIL_PASS;

  if (!host || !user || !pass) {
    return {
      ok: false,
      error: 'SMTP environment variables (EMAIL_HOST, EMAIL_USER, EMAIL_PASS) are missing or empty.',
    };
  }

  try {
    const transporter = getTransporter();
    if (!transporter) {
      return { ok: false, error: 'Could not initialize SMTP transport.' };
    }
    await transporter.verify();
    return { ok: true, message: `SMTP connected successfully to ${host} as ${user}!` };
  } catch (err) {
    return {
      ok: false,
      error: `SMTP Authentication failed with server: ${err.message}`,
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
  const user = process.env.EMAIL_HOST_USER || process.env.EMAIL_USER;
  const senderEmail = process.env.EMAIL_FROM || user || 'trainingmania@techmiresolutions.com';
  const bccAddress = bcc !== undefined ? bcc : process.env.EMAIL_BCC;

  const transporter = getTransporter();
  if (!transporter) {
    console.warn('[MailService] SMTP not configured. Skipping email dispatch to:', to);
    return { success: false, message: 'SMTP environment variables not configured' };
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
