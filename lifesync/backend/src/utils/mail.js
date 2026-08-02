import nodemailer from "nodemailer";

// ─── Strategy 1: Resend HTTP API (most reliable on cloud platforms) ──────────
// Uses HTTPS instead of SMTP, so it bypasses port-blocking and Gmail IP bans.
// Free tier: 100 emails/day (3,000/month). Signup: https://resend.com
const sendViaResend = async ({ to, subject, html }) => {
  const apiKey = process.env.RESEND_API_KEY.trim();
  // Resend free tier requires sending from onboarding@resend.dev
  // unless you verify a custom domain. Set RESEND_FROM for custom domains.
  const from = process.env.RESEND_FROM || "LifeSync <onboarding@resend.dev>";

  console.log(`📨 [Resend] Sending email to ${to} | Subject: "${subject}"`);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("❌ Resend API error:", JSON.stringify(data));
    throw new Error(data.message || `Resend returned HTTP ${response.status}`);
  }

  console.log(`✅ Email sent via Resend to ${to} (ID: ${data.id})`);
  return { id: data.id, delivered: true };
};

// ─── Strategy 2: SMTP via Nodemailer ─────────────────────────────────────────
// Works well locally and with relay services (Brevo, Mailgun, etc.)
// May fail on cloud platforms when using Gmail due to IP-based blocking.
const sendViaSmtp = async ({ to, subject, html }) => {
  const smtpUser = process.env.SMTP_USER?.trim();
  const rawPass = process.env.SMTP_PASS?.trim() || "";
  // Strip spaces from Google App Passwords (e.g. "hpkm mkem jdor nuci")
  const smtpPass = rawPass.replace(/\s+/g, "");
  const smtpHost = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";

  // If SMTP details are missing or placeholders, signal not-configured
  if (!smtpUser || smtpUser === "smtp_user_placeholder" || !smtpPass) {
    return null; // null = not configured, caller will try next strategy
  }

  console.log(`📨 [SMTP] Sending email to ${to} via ${smtpHost} | Subject: "${subject}"`);

  const port = parseInt(process.env.SMTP_PORT) || 587;
  const isGmail = smtpHost.toLowerCase().includes("gmail");

  const transporterOptions = {
    host: smtpHost,
    port: port,
    secure: port === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  };

  if (isGmail) {
    transporterOptions.service = "gmail";
  }

  const transporter = nodemailer.createTransport(transporterOptions);

  const info = await transporter.sendMail({
    from: `LifeSync <${process.env.FROM_EMAIL || smtpUser}>`,
    to,
    subject,
    html,
  });

  console.log(`✅ Email sent via SMTP to ${to} (MessageId: ${info.messageId})`);
  return { ...info, delivered: true };
};

// ─── Strategy 3: Console fallback (dev / no provider configured) ─────────────
const logToConsole = ({ to, subject, html }) => {
  console.log("\n✉️  [CONSOLE MAIL CAPTURE] -----------------------");
  console.log(`Subject: ${subject}`);
  console.log(`To:      ${to}`);
  console.log(`Body:\n${html.replace(/<[^>]*>/g, "")}`);
  console.log("-----------------------------------------------\n");
  return { delivered: false, reason: "no_email_provider", loggedOnConsole: true };
};

// Helper to wrap promises in a timeout to prevent hanging backend requests
const withTimeout = (promise, ms, label = "Operation") => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    )
  ]);
};

// ─── Main send function ─────────────────────────────────────────────────────
// Priority: Resend HTTP → SMTP → Console fallback
const sendEmail = async ({ to, subject, html }) => {
  // 1. Try Resend HTTP API (best for cloud deployments)
  if (process.env.RESEND_API_KEY?.trim()) {
    try {
      return await withTimeout(sendViaResend({ to, subject, html }), 4000, "Resend email dispatch");
    } catch (resendError) {
      console.error("❌ Resend failed, falling through to SMTP:", resendError.message);
    }
  }

  // 2. Try SMTP via Nodemailer
  try {
    const smtpResult = await withTimeout(sendViaSmtp({ to, subject, html }), 5000, "SMTP email dispatch");
    if (smtpResult) {
      // If SMTP is configured, we make sure it executes within the timeout window
      return smtpResult;
    }
  } catch (smtpError) {
    console.error("❌ SMTP failed, falling through to console:", smtpError.message);
  }

  // 3. Console fallback
  console.warn("⚠️  No email provider succeeded. Logging email to console.");
  return logToConsole({ to, subject, html });
};

const sendOtpEmail = async (to, otp, purpose = "Verification") => {
  console.log(`\n🔑 [OTP DISPATCH] Recipient: ${to} | Purpose: ${purpose} | OTP Code: ${otp}\n`);
  const subject = `Your LifeSync OTP Code: ${otp}`;
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #FAF6F0; padding: 40px 20px; text-align: center;">
      <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border: 3px solid #000000; border-radius: 16px; box-shadow: 6px 6px 0px 0px #000000; overflow: hidden; padding: 32px 24px;">
        <div style="display: inline-block; background-color: #6366F1; color: #ffffff; font-weight: bold; font-size: 24px; padding: 10px 20px; border: 2px solid #000000; border-radius: 12px; margin-bottom: 20px;">
          LifeSync⚡
        </div>
        <h2 style="color: #1E293B; font-size: 22px; margin-top: 0; font-weight: 800;">${purpose} Code</h2>
        <p style="color: #64748B; font-size: 15px; line-height: 1.5;">
          Use the following 6-digit One-Time Password (OTP) to complete your ${purpose.toLowerCase()}. This code is valid for <strong>10 minutes</strong>.
        </p>
        
        <div style="margin: 28px 0; background-color: #EEF2FF; border: 2px dashed #6366F1; border-radius: 12px; padding: 16px; display: inline-block;">
          <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #4F46E5;">
            ${otp}
          </span>
        </div>
        
        <p style="color: #94A3B8; font-size: 13px; margin-top: 20px;">
          If you did not request this OTP, please ignore this email or secure your account.
        </p>
        
        <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;" />
        <p style="color: #CBD5E1; font-size: 12px; margin: 0;">
          © ${new Date().getFullYear()} LifeSync Dashboard. All rights reserved.
        </p>
      </div>
    </div>
  `;
  return await sendEmail({ to, subject, html });
};

export { sendEmail, sendOtpEmail };
