import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  let transporter;
  let providerName = "UNKNOWN";

  console.log("=============================================================");
  console.log("📧 [EMAIL SERVICE] Attempting to send email...");
  console.log(`   TO: ${options.email}`);
  console.log(`   SUBJECT: ${options.subject}`);
  console.log(`   RESEND_API_KEY set: ${!!process.env.RESEND_API_KEY}`);
  console.log(`   SMTP_HOST set: ${!!process.env.SMTP_HOST}`);
  console.log(`   SMTP_USER set: ${!!process.env.SMTP_USER}`);
  console.log("=============================================================");

  if (process.env.RESEND_API_KEY) {
    // --- PRIMARY: Resend SMTP Relay ---
    providerName = "RESEND";
    console.log("📧 Using RESEND SMTP relay...");
    console.log(`   RESEND_FROM_EMAIL: ${process.env.RESEND_FROM_EMAIL || "NOT SET"}`);
    transporter = nodemailer.createTransport({
      host: "smtp.resend.com",
      port: 465,
      secure: true,
      auth: {
        user: "resend",
        pass: process.env.RESEND_API_KEY,
      },
    });
  } else if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    // --- FALLBACK: Custom SMTP (Gmail, Outlook, etc.) ---
    providerName = `CUSTOM_SMTP (${process.env.SMTP_HOST})`;
    const port = parseInt(process.env.SMTP_PORT) || 587;
    const secure = process.env.SMTP_SECURE === "true";
    console.log(`📧 Using Custom SMTP: ${process.env.SMTP_HOST}:${port} (secure=${secure})`);
    console.log(`   SMTP_USER: ${process.env.SMTP_USER}`);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // --- DEV ONLY: Ethereal mock email ---
    providerName = "ETHEREAL (MOCK - NO REAL EMAILS SENT)";
    console.log("⚠️  NO EMAIL PROVIDER CONFIGURED! Using Ethereal mock email.");
    console.log("⚠️  Emails will NOT be delivered to real inboxes!");
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  // Determine the FROM address
  const fromAddress = process.env.RESEND_FROM_EMAIL
    || process.env.FROM_EMAIL
    || "noreply@taskmanagement.com";
  const fromName = process.env.FROM_NAME || "Zenith Workspace";

  const message = {
    from: `${fromName} <${fromAddress}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  console.log(`📧 Sending via ${providerName}...`);
  console.log(`   FROM: ${message.from}`);
  console.log(`   TO:   ${message.to}`);

  try {
    const info = await transporter.sendMail(message);
    console.log("✅ EMAIL SENT SUCCESSFULLY!");
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response || "N/A"}`);

    // Print Ethereal preview URL in dev mode
    if (providerName.includes("ETHEREAL")) {
      console.log("📧 Ethereal Preview URL:", nodemailer.getTestMessageUrl(info));
    }

    return info;
  } catch (error) {
    console.error("❌ EMAIL SEND FAILED!");
    console.error(`   Provider: ${providerName}`);
    console.error(`   Error Code: ${error.code || "NONE"}`);
    console.error(`   Error Message: ${error.message}`);
    console.error(`   Full Error:`, error);
    throw error; // Re-throw so the caller knows it failed
  }
};

export default sendEmail;
