const twilio = require("twilio");
const nodemailer = require("nodemailer");

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Validate Twilio configuration
// Account SID must start with "AC" and be at least 34 characters
const isValidTwilioConfig = 
  accountSid && 
  accountSid.startsWith("AC") && 
  accountSid.length === 34 &&
  authToken && 
  authToken.length > 0 &&
  twilioPhoneNumber && 
  twilioPhoneNumber.length > 0;

let client = null;

if (isValidTwilioConfig) {
  try {
    client = twilio(accountSid, authToken);
    console.log("✅ Twilio client initialized successfully");
  } catch (err) {
    console.warn("⚠️  Failed to initialize Twilio client:", err.message);
    console.warn("📨 OTP will work in development mode (logs to console)");
  }
} else {
  console.warn(
    "⚠️  Twilio credentials not configured correctly. OTP functionality will work in development mode."
  );
  console.warn("📨 OTP codes will be logged to console instead of being sent via SMS");
  if (!accountSid || !accountSid.startsWith("AC")) {
    console.warn("   → TWILIO_ACCOUNT_SID must start with 'AC' (e.g., ACxxxxxxxx...)");
  }
  if (!authToken) {
    console.warn("   → TWILIO_AUTH_TOKEN is required");
  }
  if (!twilioPhoneNumber) {
    console.warn("   → TWILIO_PHONE_NUMBER is required (e.g., +919876543210)");
  }
}

/**
 * Generate a random 6-digit OTP
 * @returns {string} 6-digit OTP code
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP via SMS using Twilio
 * @param {string} phoneNumber - Phone number with country code (e.g., +919876543210)
 * @param {string} otp - OTP code to send
 * @returns {Promise<boolean>} - True if sent successfully, false otherwise
 */
async function sendOTP(phoneNumber, otp) {
  try {
    // If Twilio client is not configured, log OTP for development
    if (!client) {
      console.log(`📨 [DEV MODE] OTP for ${phoneNumber}: ${otp}`);
      return true;
    }

    // Send SMS via Twilio
    const message = await client.messages.create({
      body: `Your KrittikaStyle verification code is: ${otp}. This code will expire in 10 minutes. Do not share this code with anyone.`,
      from: twilioPhoneNumber,
      to: phoneNumber,
    });

    console.log(`✅ OTP sent successfully. Message SID: ${message.sid}`);
    return true;
  } catch (error) {
    console.error("❌ Error sending OTP:", error.message);
    return false;
  }
}

/**
 * Verify OTP code
 * @param {string} storedOTP - OTP code stored in database
 * @param {string} providedOTP - OTP code provided by user
 * @param {Date} otpExpiry - OTP expiration time
 * @returns {object} - Verification result with status and message
 */
function verifyOTP(storedOTP, providedOTP, otpExpiry) {
  // Check if OTP has expired
  if (new Date() > new Date(otpExpiry)) {
    return {
      success: false,
      message: "OTP has expired. Please request a new OTP.",
    };
  }

  // Check if OTP matches
  if (storedOTP !== providedOTP) {
    return {
      success: false,
      message: "Invalid OTP. Please enter the correct code.",
    };
  }

  return {
    success: true,
    message: "OTP verified successfully.",
  };
}

/**
 * Check if enough time has passed since last OTP was sent
 * @param {Date} lastOtpSent - Timestamp of last OTP sent
 * @param {number} secondsDelay - Minimum seconds to wait between OTP requests (default: 30)
 * @returns {boolean} - True if enough time has passed, false otherwise
 */
function canResendOTP(lastOtpSent, secondsDelay = 30) {
  if (!lastOtpSent) return true;

  const now = new Date();
  const lastSent = new Date(lastOtpSent);
  const secondsElapsed = (now - lastSent) / 1000;

  return secondsElapsed >= secondsDelay;
}

/**
 * Format phone number for Twilio (add country code if not present)
 * @param {string} phoneNumber - Phone number (10 digits for India)
 * @param {string} countryCode - Country code (default: +91 for India)
 * @returns {string} - Formatted phone number with country code
 */
function formatPhoneNumber(phoneNumber, countryCode = "+91") {
  // Remove any non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, "");

  // If already has country code, return as is
  if (phoneNumber.startsWith("+")) {
    return phoneNumber;
  }

  // If number is 10 digits (India), add country code
  if (cleaned.length === 10) {
    return countryCode + cleaned;
  }

  // If number is already 12 digits (country code + 10), return with +
  if (cleaned.length === 12) {
    return "+" + cleaned;
  }

  // Return as is
  return phoneNumber;
}

// ─── Email OTP ───────────────────────────────────────────────────────────────

let emailTransporter = null;

function getEmailTransporter() {
  if (emailTransporter) return emailTransporter;

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpUser || !smtpPass) {
    console.warn("⚠️  SMTP credentials not configured. Email OTP will be logged to console.");
    return null;
  }

  emailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: smtpUser, pass: smtpPass },
  });

  return emailTransporter;
}

/**
 * Send OTP via email using nodemailer
 * @param {string} email - Recipient email address
 * @param {string} otp - OTP code to send
 * @param {string} [userName] - Recipient's name for personalisation
 * @returns {Promise<boolean>}
 */
async function sendOTPEmail(email, otp, userName = "Valued Customer") {
  const transporter = getEmailTransporter();

  if (!transporter) {
    console.log(`📧 [DEV MODE] Email OTP for ${email}: ${otp}`);
    return true;
  }

  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
</head>
<body style="margin:0;padding:0;background:#f7f6ff;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f6ff;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(102,126,234,0.10);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:32px 40px;text-align:center;">
            <p style="margin:0;font-family:'Georgia',serif;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:0.04em;">Krittika Style</p>
            <p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,0.75);letter-spacing:0.12em;text-transform:uppercase;">Verification Code</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">
            <p style="margin:0 0 10px;font-size:16px;color:#1a1a2e;">Hi <strong>${userName}</strong>,</p>
            <p style="margin:0 0 28px;font-size:14px;color:#5a567a;line-height:1.6;">
              Use the verification code below to sign in to your Krittika Style account.
              This code is valid for <strong>10 minutes</strong> and can only be used once.
            </p>
            <!-- OTP Box -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center" style="padding:8px 0 32px;">
                <div style="display:inline-block;background:linear-gradient(135deg,rgba(102,126,234,0.08),rgba(118,75,162,0.08));border:1.5px solid rgba(102,126,234,0.2);border-radius:12px;padding:20px 48px;">
                  <span style="font-size:36px;font-weight:700;letter-spacing:0.22em;color:#667eea;font-family:'Courier New',monospace;">${otp}</span>
                </div>
              </td></tr>
            </table>
            <p style="margin:0 0 8px;font-size:13px;color:#9490b8;">
              If you didn't request this code, you can safely ignore this email.
              Someone may have entered your email by mistake.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f7f6ff;padding:20px 40px;border-top:1px solid #e6e4f5;text-align:center;">
            <p style="margin:0;font-size:11px;color:#9490b8;">© ${new Date().getFullYear()} Krittika Style. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    await transporter.sendMail({
      from: `"Krittika Style" <${fromAddress}>`,
      to: email,
      subject: `${otp} — Your Krittika Style verification code`,
      text: `Your Krittika Style verification code is: ${otp}\n\nThis code expires in 10 minutes. Do not share it with anyone.`,
      html,
    });
    console.log(`✅ Email OTP sent to ${email}`);
    return true;
  } catch (err) {
    console.error("❌ Error sending email OTP:", err.message);
    return false;
  }
}

/**
 * Mask an email for display  →  su***5@gmail.com
 */
function maskEmail(email) {
  if (!email || !email.includes("@")) return "***";
  const [local, domain] = email.split("@");
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}${local[1]}***${local[local.length - 1]}@${domain}`;
}

module.exports = {
  generateOTP,
  sendOTP,
  sendOTPEmail,
  maskEmail,
  verifyOTP,
  canResendOTP,
  formatPhoneNumber,
};
