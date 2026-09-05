import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

function getTransporter() {
  const host = process.env.EMAIL_HOST;
  const port = parseInt(process.env.EMAIL_PORT || '465', 10);
  const secure = process.env.EMAIL_SECURE === 'true' || port === 465;
  const user = process.env.EMAIL_HOST_USER || process.env.EMAIL_USER;
  const pass = process.env.EMAIL_HOST_PASSWORD || process.env.EMAIL_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 5000,
  });
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
  const senderEmail = process.env.EMAIL_FROM || user || 'no-reply@trainingmania.com';
  const bccAddress = bcc !== undefined ? bcc : process.env.EMAIL_BCC;

  const transporter = getTransporter();
  if (!transporter) {
    console.warn('[MailService] SMTP not fully configured in environment variables. Skipping email dispatch.');
    return { success: false, message: 'SMTP not configured' };
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
    console.log(`[MailService] Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[MailService] Error sending email to ${to}:`, error.message);
    throw error;
  }
}

export default { sendEmail };
