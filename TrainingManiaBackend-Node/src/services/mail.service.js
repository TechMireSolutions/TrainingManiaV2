import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Build candidate transporter configurations (Port 587, Port 465, Port 25)
 */
function getCandidateConfigs() {
  const host = process.env.EMAIL_HOST || 'mail.techmiresolutions.com';
  const specifiedPort = process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : null;
  const user = process.env.EMAIL_HOST_USER || process.env.EMAIL_USER;
  const pass = process.env.EMAIL_HOST_PASSWORD || process.env.EMAIL_PASS;

  if (!user || !pass) {
    return [];
  }

  const isGmail = host.toLowerCase().includes('gmail.com');
  if (isGmail) {
    return [
      {
        service: 'gmail',
        auth: { user, pass },
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 8000,
      },
    ];
  }

  const configs = [
    // 1. Port 587 (Submission / STARTTLS - unblocked on cloud hosts like Render)
    {
      host,
      port: 587,
      secure: false,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 6000,
      greetingTimeout: 6000,
      socketTimeout: 6000,
    },
    // 2. Port 465 (SMTPS / SSL direct)
    {
      host,
      port: 465,
      secure: true,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 6000,
      greetingTimeout: 6000,
      socketTimeout: 6000,
    },
    // 3. Port 25 (Standard fallback)
    {
      host,
      port: 25,
      secure: false,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 6000,
      greetingTimeout: 6000,
      socketTimeout: 6000,
    },
  ];

  if (specifiedPort) {
    configs.sort((a, b) => (a.port === specifiedPort ? -1 : b.port === specifiedPort ? 1 : 0));
  }

  return configs;
}

/**
 * Verify SMTP credentials across available ports (587, 465, 25)
 */
export async function verifySmtpConnection() {
  const host = process.env.EMAIL_HOST || 'mail.techmiresolutions.com';
  const user = process.env.EMAIL_HOST_USER || process.env.EMAIL_USER;
  const pass = process.env.EMAIL_HOST_PASSWORD || process.env.EMAIL_PASS;

  if (!user || !pass) {
    return {
      ok: false,
      error: `Missing EMAIL_USER or EMAIL_PASS environment variables on Render.`,
    };
  }

  const configs = getCandidateConfigs();
  let lastError = null;

  for (const config of configs) {
    try {
      console.log(`[MailService] Attempting SMTP verification via ${config.host}:${config.port}...`);
      const transporter = nodemailer.createTransport(config);
      await transporter.verify();
      return {
        ok: true,
        message: `Connected & authenticated successfully via ${config.host}:${config.port} as ${user}!`,
      };
    } catch (err) {
      console.warn(`[MailService] Port ${config.port} verification note:`, err.message);
      lastError = err;
    }
  }

  return {
    ok: false,
    error: `SMTP server (${host}) returned: ${lastError ? lastError.message : 'Timeout / Unreachable'}. Try Port 587 or check mailbox password.`,
  };
}

/**
 * Send an email with automatic port failover (587 -> 465 -> 25)
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

  const configs = getCandidateConfigs();
  if (configs.length === 0) {
    console.warn('[MailService] SMTP credentials not set. Skipping email dispatch to:', to);
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

  let lastError = null;

  for (const config of configs) {
    try {
      const transporter = nodemailer.createTransport(config);
      const info = await transporter.sendMail(mailOptions);
      console.log(`[MailService] Email sent to ${to} via Port ${config.port}: ${info.messageId}`);
      return { success: true, messageId: info.messageId, port: config.port };
    } catch (error) {
      console.warn(`[MailService] Failed send attempt on Port ${config.port}:`, error.message);
      lastError = error;
    }
  }

  throw lastError || new Error('All SMTP ports failed to deliver message');
}

export default { verifySmtpConnection, sendEmail };
