/**
 * @desc    Email service using Brevo HTTP API (primary) or Resend/SMTP (fallback).
 *          Uses HTTPS (port 443) which is NEVER blocked by cloud providers.
 * 
 *          Brevo (free 300 emails/day) can send to ANY email address
 *          with just a verified sender email — no custom domain required.
 */

import nodemailer from "nodemailer";

/**
 * Send email via Brevo (Sendinblue) HTTP API
 *
 * @param {Object} options - Email options (email, subject, message, html).
 * @param {string} fromAddress - The sender's email address.
 * @param {string} fromName - The sender's display name.
 * @returns {Promise<Object>} The response data from Brevo API.
 * @throws {Error} If the API request fails.
 */
const sendViaBrevoAPI = async (options, fromAddress, fromName) => {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({
      sender: { name: fromName, email: fromAddress },
      to: [{ email: options.email }],
      subject: options.subject,
      htmlContent: options.html || `<p>${options.message}</p>`,
      textContent: options.message,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("❌ Brevo API Error:", JSON.stringify(data));
    throw new Error(data.message || `Brevo API returned ${response.status}`);
  }

  return data;
};

/**
 * Send email via Resend HTTP API
 *
 * @param {Object} options - Email options (email, subject, message, html).
 * @param {string} fromAddress - The sender's email address.
 * @param {string} fromName - The sender's display name.
 * @returns {Promise<Object>} The response data from Resend API.
 * @throws {Error} If the API request fails.
 */
const sendViaResendAPI = async (options, fromAddress, fromName) => {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${fromName} <${fromAddress}>`,
      to: [options.email],
      subject: options.subject,
      html: options.html || options.message,
      text: options.message,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("❌ Resend API Error:", JSON.stringify(data));
    throw new Error(data.message || `Resend API returned ${response.status}`);
  }

  return data;
};

/**
 * Send email via SMTP (nodemailer) — local dev fallback
 *
 * @param {Object} options - Email options (email, subject, message, html).
 * @param {string} fromAddress - The sender's email address.
 * @param {string} fromName - The sender's display name.
 * @returns {Promise<Object>} The response info from Nodemailer.
 */
const sendViaSMTP = async (options, fromAddress, fromName) => {
  let transporter;

  // Use configured SMTP credentials if provided in the environment
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 10000,
    });
  } else {
    // Fallback to Ethereal mock email for local development testing without real SMTP
    console.log("⚠️  No email provider configured. Using Ethereal mock email.");
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  }

  const info = await transporter.sendMail({
    from: `${fromName} <${fromAddress}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  });

  // Print the Ethereal catch-all preview URL if no real SMTP was used
  if (!process.env.SMTP_HOST) {
    console.log("📧 Ethereal Preview URL:", nodemailer.getTestMessageUrl(info));
  }

  return info;
};

/**
 * Main email function — tries providers in order of priority
 *
 * @param {Object} options - Email options containing `email`, `subject`, `message`, and optionally `html`.
 * @returns {Promise<Object>} The result of the successful email dispatch.
 * @throws {Error} If all attempted email providers fail.
 */
const sendEmail = async (options) => {
  // Resolve sender credentials falling back from most preferred to a default dummy address
  const fromAddress = process.env.BREVO_FROM_EMAIL
    || process.env.RESEND_FROM_EMAIL
    || process.env.FROM_EMAIL
    || "noreply@taskmanagement.com";
  const fromName = process.env.FROM_NAME || "Zenith Workspace";

  console.log("=============================================================");
  console.log("📧 [EMAIL SERVICE] Sending email...");
  console.log(`   TO: ${options.email}`);
  console.log(`   SUBJECT: ${options.subject}`);
  console.log(`   FROM: ${fromName} <${fromAddress}>`);
  console.log(`   BREVO_API_KEY: ${process.env.BREVO_API_KEY ? "SET ✅" : "NOT SET ❌"}`);
  console.log(`   RESEND_API_KEY: ${process.env.RESEND_API_KEY ? "SET ✅" : "NOT SET ❌"}`);
  console.log("=============================================================");

  // --- PRIORITY 1: Brevo HTTP API (sends to ANY email, no custom domain needed) ---
  if (process.env.BREVO_API_KEY) {
    console.log("📧 Using Brevo HTTP API...");
    try {
      const result = await sendViaBrevoAPI(options, fromAddress, fromName);
      console.log("✅ EMAIL SENT SUCCESSFULLY via Brevo!");
      console.log(`   Message ID: ${result.messageId}`);
      return result;
    } catch (error) {
      console.error("❌ Brevo failed:", error.message);
      throw error;
    }
  }

  // --- PRIORITY 2: Resend HTTP API ---
  if (process.env.RESEND_API_KEY) {
    console.log("📧 Using Resend HTTP API...");
    try {
      const result = await sendViaResendAPI(options, fromAddress, fromName);
      console.log("✅ EMAIL SENT SUCCESSFULLY via Resend!");
      console.log(`   ID: ${result.id}`);
      return result;
    } catch (error) {
      console.error("❌ Resend failed:", error.message);
      throw error;
    }
  }

  // --- PRIORITY 3: SMTP fallback (for local development) ---
  console.log("📧 Falling back to SMTP...");
  try {
    const result = await sendViaSMTP(options, fromAddress, fromName);
    console.log("✅ EMAIL SENT SUCCESSFULLY via SMTP!");
    return result;
  } catch (error) {
    console.error("❌ SMTP failed:", error.message);
    throw error;
  }
};

export default sendEmail;
