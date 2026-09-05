import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const smtpHost = process.env.EMAIL_HOST || 'mail.techmiresolutions.com';
const smtpPort = parseInt(process.env.EMAIL_PORT || '465', 10);
const smtpSecure = process.env.EMAIL_SECURE === 'true' || smtpPort === 465;
const smtpUser = process.env.EMAIL_HOST_USER || process.env.EMAIL_USER || 'trainingmania@techmiresolutions.com';
const smtpPass = process.env.EMAIL_HOST_PASSWORD || process.env.EMAIL_PASS || '!!YaHussain110!!';

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

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
  const bccAddress = bcc !== undefined ? bcc : (process.env.EMAIL_BCC || smtpUser);
  const senderEmail = process.env.EMAIL_FROM || smtpUser;

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
