import nodemailer from "nodemailer";

let transporter = null;

try {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
} catch (error) {
  console.warn("Failed to initialize email transporter:", error.message);
}

export async function sendEmail({ to, subject, html }) {
  try {
    if (!transporter || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn("SMTP credentials not configured. Email would be sent to:", to);
      console.warn("Subject:", subject);
      return { success: false, message: "SMTP not configured" };
    }

    const info = await transporter.sendMail({
      from: `"ShareMarket Manager Pro" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    console.log("Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Email error:", error);
    throw error;
  }
}
