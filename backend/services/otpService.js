const twilio = require("twilio");

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

module.exports = {
  generateOTP,
  sendOTP,
  verifyOTP,
  canResendOTP,
  formatPhoneNumber,
};
