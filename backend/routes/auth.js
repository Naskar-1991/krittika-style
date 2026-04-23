const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { generateOTP, sendOTP, sendOTPEmail, maskEmail, verifyOTP, canResendOTP, formatPhoneNumber } = require("../services/otpService");

const SECRET = process.env.JWT_SECRET || "supersecret";
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || "10");
const MAX_OTP_ATTEMPTS = parseInt(process.env.MAX_OTP_ATTEMPTS || "3");

// ======================== SIGNUP WITH OTP ========================

/**
 * Step 1: Initiate signup - Validate user details and send OTP
 * POST /api/auth/signup-initiate
 */
router.post("/signup-initiate", async (req, res) => {
  const { name, email, password, mobile } = req.body;

  try {
    // Validate all fields
    if (!name || !email || !password || !mobile) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Validate password
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Validate mobile number
    const cleanedMobile = mobile.replace(/\D/g, "");
    if (cleanedMobile.length !== 10) {
      return res.status(400).json({ error: "Mobile number must be 10 digits" });
    }

    // Check if email already exists
    const emailCheck = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Check if mobile number already exists and is verified
    const mobileCheck = await pool.query(
      "SELECT id FROM users WHERE mobile = $1 AND mobile_verified = true",
      [mobile]
    );
    if (mobileCheck.rows.length > 0) {
      return res.status(400).json({ error: "Mobile number already registered" });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Format phone number for Twilio (add country code)
    const formattedPhone = formatPhoneNumber(mobile);

    // Send OTP via SMS
    const otpSent = await sendOTP(formattedPhone, otp);

    if (!otpSent) {
      return res.status(500).json({
        error: "Failed to send OTP. Please try again.",
      });
    }

    // Store signup data temporarily with OTP in a temporary user record
    // Check if unverified user exists with same email
    await pool.query(
      `INSERT INTO users (name, email, password, mobile, otp_code, otp_expiry, mobile_verified, signup_complete)
       VALUES ($1, $2, $3, $4, $5, $6, false, false)
       ON CONFLICT (email) DO UPDATE SET
         otp_code = $5,
         otp_expiry = $6,
         otp_attempts = 0,
         last_otp_sent = CURRENT_TIMESTAMP`,
      [name, email, await bcrypt.hash(password, 10), mobile, otp, otpExpiry]
    );

    res.json({
      message: "OTP sent successfully to your mobile number",
      mobileHint: `${formattedPhone.slice(-4)}`, // Show last 4 digits for verification
      expiresIn: OTP_EXPIRY_MINUTES,
    });
  } catch (err) {
    console.error("Signup initiate error:", err);
    res.status(500).json({ error: "An error occurred during signup initiation" });
  }
});

/**
 * Step 2: Verify OTP during signup
 * POST /api/auth/signup-verify
 */
router.post("/signup-verify", async (req, res) => {
  const { email, otp } = req.body;

  try {
    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    // Find user by email
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1 AND signup_complete = false",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Invalid email or signup already completed" });
    }

    const user = result.rows[0];

    // Check if user has exceeded max OTP attempts
    if (user.otp_attempts >= MAX_OTP_ATTEMPTS) {
      return res.status(429).json({
        error: "Too many failed OTP attempts. Please request a new OTP.",
      });
    }

    // Verify OTP
    const verification = verifyOTP(user.otp_code, otp, user.otp_expiry);

    if (!verification.success) {
      // Increment OTP attempts
      await pool.query(
        "UPDATE users SET otp_attempts = otp_attempts + 1 WHERE id = $1",
        [user.id]
      );

      return res.status(400).json({ error: verification.message });
    }

    // Mark mobile as verified and complete signup
    await pool.query(
      `UPDATE users SET mobile_verified = true, signup_complete = true, otp_code = NULL, otp_expiry = NULL, otp_attempts = 0
       WHERE id = $1`,
      [user.id]
    );

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Signup completed successfully",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        mobileVerified: true,
      },
    });
  } catch (err) {
    console.error("Signup verify error:", err);
    res.status(500).json({ error: "An error occurred during OTP verification" });
  }
});

/**
 * Resend OTP during signup
 * POST /api/auth/signup-resend-otp
 */
router.post("/signup-resend-otp", async (req, res) => {
  const { email, mobile } = req.body;

  try {
    if (!email || !mobile) {
      return res.status(400).json({ error: "Email and mobile are required" });
    }

    // Find user by email
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1 AND signup_complete = false",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Invalid email" });
    }

    const user = result.rows[0];

    // Check if user can request new OTP (rate limiting)
    if (!canResendOTP(user.last_otp_sent, 30)) {
      return res.status(429).json({
        error: "Please wait 30 seconds before requesting a new OTP",
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Format phone number
    const formattedPhone = formatPhoneNumber(mobile);

    // Send OTP
    const otpSent = await sendOTP(formattedPhone, otp);

    if (!otpSent) {
      return res.status(500).json({ error: "Failed to send OTP. Please try again." });
    }

    // Update OTP in database
    await pool.query(
      `UPDATE users SET otp_code = $1, otp_expiry = $2, otp_attempts = 0, last_otp_sent = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [otp, otpExpiry, user.id]
    );

    res.json({
      message: "New OTP sent successfully",
      expiresIn: OTP_EXPIRY_MINUTES,
    });
  } catch (err) {
    console.error("Resend OTP error:", err);
    res.status(500).json({ error: "Failed to resend OTP" });
  }
});

// ======================== LOGIN WITH OTP ========================

/**
 * Step 1: Initiate login - Send OTP to registered mobile
 * POST /api/auth/login-initiate
 * Supports: email OR mobile
 */
router.post("/login-initiate", async (req, res) => {
  const { email, mobile } = req.body;

  try {
    if (!email && !mobile) {
      return res.status(400).json({ error: "Email or mobile number is required" });
    }

    let result;
    let user;

    // Find user by email or mobile — fetch name + email + mobile for dual-send
    if (email) {
      result = await pool.query(
        "SELECT id, name, email, mobile, last_otp_sent FROM users WHERE email = $1 AND mobile_verified = true",
        [email]
      );
    } else {
      const cleanedMobile = mobile.replace(/\D/g, "");
      if (cleanedMobile.length !== 10) {
        return res.status(400).json({ error: "Please enter a valid 10-digit mobile number" });
      }
      result = await pool.query(
        "SELECT id, name, email, mobile, last_otp_sent FROM users WHERE mobile = $1 AND mobile_verified = true",
        [mobile]
      );
    }

    if (result.rows.length === 0) {
      return res.status(400).json({
        error: "User not found or mobile not verified. Please sign up first.",
      });
    }

    user = result.rows[0];

    // Rate limiting
    if (user.last_otp_sent && !canResendOTP(user.last_otp_sent, 30)) {
      return res.status(429).json({
        error: "Please wait 30 seconds before requesting a new OTP",
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    const formattedPhone = formatPhoneNumber(user.mobile);

    // Send to both SMS and email in parallel; at least one must succeed
    const [smsSent, emailSent] = await Promise.allSettled([
      sendOTP(formattedPhone, otp),
      sendOTPEmail(user.email, otp, user.name),
    ]);

    const smsOk   = smsSent.status   === "fulfilled" && smsSent.value   === true;
    const emailOk = emailSent.status === "fulfilled" && emailSent.value === true;

    if (!smsOk && !emailOk) {
      return res.status(500).json({ error: "Failed to send OTP. Please try again." });
    }

    // Store OTP
    await pool.query(
      `UPDATE users SET otp_code = $1, otp_expiry = $2, otp_attempts = 0, last_otp_sent = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [otp, otpExpiry, user.id]
    );

    res.json({
      message: "OTP sent to your registered mobile and email",
      mobileHint: formattedPhone.slice(-4),
      emailHint: maskEmail(user.email),
      expiresIn: OTP_EXPIRY_MINUTES,
    });
  } catch (err) {
    console.error("Login initiate error:", err);
    res.status(500).json({ error: "An error occurred during login" });
  }
});

/**
 * Step 2: Verify OTP during login
 * POST /api/auth/login-verify
 * Supports: email OR mobile
 */
router.post("/login-verify", async (req, res) => {
  const { email, mobile, otp } = req.body;

  try {
    if (!otp) {
      return res.status(400).json({ error: "OTP is required" });
    }

    if (!email && !mobile) {
      return res.status(400).json({ error: "Email or mobile number is required" });
    }

    let result;
    let user;

    // Find user by email or mobile
    if (email) {
      result = await pool.query(
        "SELECT * FROM users WHERE email = $1 AND mobile_verified = true",
        [email]
      );
    } else {
      // Validate mobile format
      const cleanedMobile = mobile.replace(/\D/g, "");
      if (cleanedMobile.length !== 10) {
        return res.status(400).json({ error: "Invalid mobile number" });
      }
      result = await pool.query(
        "SELECT * FROM users WHERE mobile = $1 AND mobile_verified = true",
        [mobile]
      );
    }

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "User not found" });
    }

    user = result.rows[0];

    // Check OTP attempts
    if (user.otp_attempts >= MAX_OTP_ATTEMPTS) {
      return res.status(429).json({
        error: "Too many failed OTP attempts. Please request a new OTP.",
      });
    }

    // Verify OTP
    const verification = verifyOTP(user.otp_code, otp, user.otp_expiry);

    if (!verification.success) {
      // Increment attempts
      await pool.query(
        "UPDATE users SET otp_attempts = otp_attempts + 1 WHERE id = $1",
        [user.id]
      );

      return res.status(400).json({ error: verification.message });
    }

    // Clear OTP
    await pool.query(
      `UPDATE users SET otp_code = NULL, otp_expiry = NULL, otp_attempts = 0 WHERE id = $1`,
      [user.id]
    );

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        mobileVerified: user.mobile_verified,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login verify error:", err);
    res.status(500).json({ error: "An error occurred during login" });
  }
});

// ======================== LEGACY ENDPOINTS (For backward compatibility) ========================

/**
 * Legacy Signup endpoint (without OTP)
 * POST /api/auth/signup
 */
router.post("/signup", async (req, res) => {
  const { name, email, password, mobile } = req.body;
  try {
    if (!name || !email || !password || !mobile) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password, mobile, mobile_verified, signup_complete)
       VALUES ($1, $2, $3, $4, true, true)
       RETURNING id, name, email, mobile, role, created_at`,
      [name, email, hashedPassword, mobile]
    );
    res.json({ message: "Account created successfully", user: result.rows[0] });
  } catch (err) {
    if (err.message.includes("duplicate key")) {
      res.status(400).json({ error: "Email already exists" });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

/**
 * Legacy Login endpoint (without OTP)
 * POST /api/auth/login
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (result.rows.length === 0)
      return res.status(400).json({ error: "User not found" });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      SECRET,
      { expiresIn: "7d" }
    );
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        mobileVerified: user.mobile_verified,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Protected route example
router.get("/profile", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    const result = await pool.query(
      "SELECT id, name, email, mobile, mobile_verified, role, created_at FROM users WHERE id=$1",
      [decoded.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "User not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

module.exports = router;
