/**
 * @desc    Email service using Resend HTTP API (primary) or SMTP (fallback).
 *          Resend HTTP API uses HTTPS (port 443) which is NEVER blocked by
 *          cloud providers like Render, unlike SMTP ports 465/587.
 */

import nodemailer from "nodemailer";

/**
 * Send email via Resend HTTP API (no SMTP, no port blocking)
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
    console.error("❌ Resend API Error Response:", JSON.stringify(data));
    throw new Error(data.message || `Resend API returned ${response.status}`);
  }

  return data;
};

/**
 * Send email via SMTP (nodemailer)
 */
const sendViaSMTP = async (options, fromAddress, fromName) => {
  let transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    const port = parseInt(process.env.SMTP_PORT) || 587;
    const secure = process.env.SMTP_SECURE === "true";
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 10000, // 10 second timeout instead of 4 minute hang
    });
  } else {
    // Ethereal mock email for development
    console.log("⚠️  No email provider configured. Using Ethereal mock email.");
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

  const info = await transporter.sendMail({
    from: `${fromName} <${fromAddress}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  });

  if (!process.env.SMTP_HOST) {
    console.log("📧 Ethereal Preview URL:", nodemailer.getTestMessageUrl(info));
  }

  return info;
};

/**
 * Main email function
 */
const sendEmail = async (options) => {
  const fromAddress = process.env.RESEND_FROM_EMAIL
    || process.env.FROM_EMAIL
    || "noreply@taskmanagement.com";
  const fromName = process.env.FROM_NAME || "Zenith Workspace";

  console.log("=============================================================");
  console.log("📧 [EMAIL SERVICE] Sending email...");
  console.log(`   TO: ${options.email}`);
  console.log(`   SUBJECT: ${options.subject}`);
  console.log(`   FROM: ${fromName} <${fromAddress}>`);
  console.log(`   RESEND_API_KEY: ${process.env.RESEND_API_KEY ? "SET ✅" : "NOT SET ❌"}`);
  console.log("=============================================================");

  // --- PRIMARY: Resend HTTP API (uses HTTPS port 443, never blocked) ---
  if (process.env.RESEND_API_KEY) {
    console.log("📧 Using Resend HTTP API (HTTPS, port 443)...");
    try {
      const result = await sendViaResendAPI(options, fromAddress, fromName);
      console.log("✅ EMAIL SENT SUCCESSFULLY via Resend HTTP API!");
      console.log(`   ID: ${result.id}`);
      return result;
    } catch (error) {
      console.error("❌ Resend HTTP API failed:", error.message);
      throw error;
    }
  }

  // --- FALLBACK: SMTP ---
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
