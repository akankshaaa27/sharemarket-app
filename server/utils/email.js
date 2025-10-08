import nodemailer from "nodemailer";

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASSWORD,
  SMTP_FROM,
} = process.env;

let transporterPromise = null;

async function getTransporter() {
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD) {
    console.warn("Email transport not configured; skipping email send");
    return null;
  }
  if (!transporterPromise) {
    transporterPromise = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: SMTP_SECURE === "true",
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASSWORD,
      },
    });
  }
  return transporterPromise;
}

export async function sendEmail({ to, subject, text, html }) {
  const transporter = await getTransporter();
  if (!transporter) {
    console.info(
      `Email to ${to} suppressed. Subject: ${subject}. Configure SMTP settings to enable sending.`,
    );
    return { skipped: true };
  }
  const from = SMTP_FROM || SMTP_USER;
  return transporter.sendMail({ from, to, subject, text, html });
}

export async function sendCredentialsEmail({ to, name, username, password }) {
  const subject = "Your ShareMarket Manager Pro account credentials";
  const text = `Hello ${name || ""},\n\nYour account has been created.\n\nUsername: ${username}\nPassword: ${password}\n\nPlease log in and change your password soon.`;
  const html = `<p>Hello ${name || ""},</p><p>Your account has been created.</p><p><strong>Username:</strong> ${username}<br/><strong>Password:</strong> ${password}</p><p>Please log in and change your password soon.</p>`;
  return sendEmail({ to, subject, text, html });
}

export async function sendPasswordResetEmail({ to, name, resetUrl }) {
  const subject = "Reset your ShareMarket Manager Pro password";
  const text = `Hello ${name || ""},\n\nPlease use the following link to reset your password:\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`;
  const html = `<p>Hello ${name || ""},</p><p>Please use the following link to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you did not request this, you can ignore this email.</p>`;
  return sendEmail({ to, subject, text, html });
}
