import nodemailer from 'nodemailer';

/**
 * Creates and returns a Nodemailer SMTP transporter using environment variables.
 */
const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT, 10) || 465;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : '';

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass
    }
  });
};

/**
 * Sends an email via SMTP using Nodemailer.
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Subject line
 * @param {string} [options.text] - Plain text message
 * @param {string} [options.html] - HTML formatted message
 * @returns {Promise<{success: boolean, provider?: string, info?: any, simulated?: boolean, message?: string, error?: string}>}
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  const { SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

  try {
    if (!SMTP_USER || !SMTP_PASS) {
      throw new Error('SMTP credentials (SMTP_USER, SMTP_PASS) are not configured in environment variables.');
    }

    console.log(`[SMTP] Attempting dispatch to ${to}...`);

    const transporter = createTransporter();

    const mailOptions = {
      from: SMTP_FROM || `"Medi Consult" <${SMTP_USER}>`,
      to,
      subject,
      text,
      html
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(`\n------------------ [EMAIL DISPATCHED (SMTP)] ------------------`);
    console.log(`To: ${to} | MsgID: ${info.messageId}`);
    console.log(`---------------------------------------------------------------\n`);

    return { success: true, provider: 'SMTP', info };
  } catch (error) {
    console.error(`[SMTP ERROR] Email dispatch failed: ${error.message}`);
    console.log(`\n------------------ [EMAIL DISPATCHED (SIMULATED FALLBACK)] ------------------`);
    console.log(`To Email: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`OTP Code: ${text?.match(/\d{6}/)?.[0] || 'N/A'}`);
    console.log(`Error: ${error.message}`);
    console.log(`Status: SIMULATED SUCCESS (Retrieve code from logs above)`);
    console.log(`-----------------------------------------------------------------------------\n`);

    return {
      success: false,
      simulated: true,
      message: 'Physical dispatch failed. Using Terminal Sync.',
      error: error.message
    };
  }
};

export default sendEmail;
