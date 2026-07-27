import nodemailer from "nodemailer";

const sendEmail = async ({ to, subject, html }) => {
  try {
    // If SMTP details are placeholders, print directly to console (useful for development)
    if (
      process.env.SMTP_USER === "smtp_user_placeholder" ||
      !process.env.SMTP_USER ||
      !process.env.SMTP_HOST
    ) {
      console.log("\n✉️  [LOCAL MAIL CAPTURE] -----------------------");
      console.log(`Subject: ${subject}`);
      console.log(`To:      ${to}`);
      console.log(`Body:\n${html.replace(/<[^>]*>/g, "")}`); // strip HTML for console view
      console.log("-----------------------------------------------\n");
      return { success: true, loggedOnConsole: true };
    }

    const port = parseInt(process.env.SMTP_PORT) || 587;
    const isGmail = process.env.SMTP_HOST?.toLowerCase().includes("gmail");

    const transporterOptions = {
      host: process.env.SMTP_HOST,
      port: port,
      secure: port === 465, // true for 465, false for other ports (587)
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    };

    if (isGmail) {
      transporterOptions.service = "gmail";
    }

    const transporter = nodemailer.createTransport(transporterOptions);

    const info = await transporter.sendMail({
      from: `LifeSync <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    console.log(`Email sent successfully: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("Nodemailer send failed, falling back to console log. Error: ", error);
    console.log("\n✉️  [FALLBACK MAIL CAPTURE] --------------------");
    console.log(`Subject: ${subject}`);
    console.log(`To:      ${to}`);
    console.log(`Body:\n${html.replace(/<[^>]*>/g, "")}`);
    console.log("-----------------------------------------------\n");
    return { success: true, loggedOnConsole: true };
  }
};

const sendOtpEmail = async (to, otp, purpose = "Verification") => {
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

