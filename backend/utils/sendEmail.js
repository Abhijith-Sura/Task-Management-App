import nodemailer from "nodemailer";

const sendEmail = async (options) => {
  let transporter;

  if (process.env.RESEND_API_KEY) {
    // --- PRIMARY: Resend SMTP Relay (Recommended for production) ---
    // Resend works reliably from cloud servers unlike Gmail which blocks hosting IPs.
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
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // --- DEV ONLY: Ethereal mock email (prints preview URL to console) ---
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
    console.log("⚠️  No RESEND_API_KEY or SMTP_HOST set. Using Ethereal mock email.");
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

  const info = await transporter.sendMail(message);

  // Print Ethereal preview URL in dev mode
  if (!process.env.RESEND_API_KEY && !process.env.SMTP_HOST) {
    console.log("📧 Preview URL:", nodemailer.getTestMessageUrl(info));
  }

  return info;
};

export default sendEmail;
