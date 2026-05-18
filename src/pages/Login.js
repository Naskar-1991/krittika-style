import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import "./Signup.css";
import OTPVerification from "../components/OTPVerification";
import API_URL from "../api_connection/BackendAPIConnection";

/* ── Auth page SVG icons ── */
const IconMail = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);
const IconPhone = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
    <line x1="12" y1="18" x2="12.01" y2="18"/>
  </svg>
);
const IconWarning = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const IconCheck = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const Login = () => {
  const [step, setStep] = useState("credentials"); // 'credentials', 'otp', 'success'
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [loginMethod, setLoginMethod] = useState("email"); // 'email' or 'mobile'
  const [otpData, setOtpData] = useState({
    mobileHint: "",
    emailHint: "",
    expiresIn: 10,
  });
  const [error, setError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const validateEmail = (emailValue) => {
    if (!emailValue.trim()) {
      setError("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      setError("Please enter a valid email");
      return false;
    }
    return true;
  };

  const validateMobile = (mobileValue) => {
    if (!mobileValue.trim()) {
      setError("Mobile number is required");
      return false;
    }
    const cleanedMobile = mobileValue.replace(/\D/g, "");
    if (cleanedMobile.length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
      return false;
    }
    return true;
  };

  const handleInitiateLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (loginMethod === "email") {
      if (!validateEmail(email)) return;
    } else {
      if (!validateMobile(mobile)) return;
    }

    setLoading(true);
    try {
      const payload = loginMethod === "email" 
        ? { email } 
        : { mobile: mobile.replace(/\D/g, "") };

      const res = await fetch(`${API_URL}/api/auth/login-initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to initiate login. Please try again.");
        setLoading(false);
        return;
      }

      // Move to OTP step
      setOtpData({
        mobileHint: data.mobileHint,
        emailHint: data.emailHint || "",
        expiresIn: data.expiresIn,
      });
      setStep("otp");
      setLoading(false);
    } catch (err) {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (otp) => {
    setOtpLoading(true);
    setOtpError("");
    try {
      const payload = loginMethod === "email"
        ? { email, otp }
        : { mobile: mobile.replace(/\D/g, ""), otp };

      const res = await fetch(`${API_URL}/api/auth/login-verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setOtpError(data.error || "OTP verification failed");
        setOtpLoading(false);
        return;
      }

      // Save token and user data
      login(data.token, data.user);
      setStep("success");

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate("/");
      }, 2000);
      setOtpLoading(false);
    } catch (err) {
      setOtpError("An error occurred during Login");
      setOtpLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      const payload = loginMethod === "email"
        ? { email }
        : { mobile: mobile.replace(/\D/g, "") };

      const res = await fetch(`${API_URL}/api/auth/login-initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setOtpError(data.error || "Failed to resend OTP");
      } else {
        setOtpError("");
      }
    } catch (err) {
      setOtpError("Failed to resend OTP. Please try again.");
    }
  };

  const handleBackToCredentials = () => {
    setStep("credentials");
    setOtpError("");
    setError("");
  };

  return (
    <div className="auth-page signup-page">
      <div className="auth-container">
        <div className="auth-card">
          {/* Logo */}
          <div className="auth-logo">
            <span className="auth-logo-mark" aria-hidden="true">K</span>
            <h1>Krittika Style</h1>
          </div>

          {step === "credentials" && (
            <>
              <h2>Welcome Back!</h2>
              <p className="auth-subtitle">Sign in to your account to continue</p>

              {error && <div className="error-message"><IconWarning /> {error}</div>}

              {/* Login Method Tabs */}
              <div className="login-method-tabs">
                <button
                  type="button"
                  className={`tab-button ${loginMethod === "email" ? "active" : ""}`}
                  onClick={() => {
                    setLoginMethod("email");
                    setError("");
                  }}
                >
                  <IconMail /> Email
                </button>
                <button
                  type="button"
                  className={`tab-button ${loginMethod === "mobile" ? "active" : ""}`}
                  onClick={() => {
                    setLoginMethod("mobile");
                    setError("");
                  }}
                >
                  <IconPhone /> Mobile
                </button>
              </div>

              <form onSubmit={handleInitiateLogin} className="auth-form">
                {loginMethod === "email" ? (
                  <div className="form-group">
                    <label htmlFor="email">Email Address *</label>
                    <input
                      type="email"
                      id="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                      }}
                      disabled={loading}
                      required
                    />
                  </div>
                ) : (
                  <div className="form-group">
                    <label htmlFor="mobile">Mobile Number *</label>
                    <input
                      type="tel"
                      id="mobile"
                      placeholder="9876543210"
                      value={mobile}
                      onChange={(e) => {
                        setMobile(e.target.value);
                        setError("");
                      }}
                      disabled={loading}
                      required
                    />
                    <small>Enter 10-digit mobile number</small>
                  </div>
                )}

                <p className="auth-subtitle" style={{ margin: "8px 0 16px" }}>
                  We'll send an OTP to your registered mobile number and email address
                </p>

                <button
                  type="submit"
                  className="btn-submit"
                  disabled={loading}
                >
                  {loading ? "Sending OTP..." : "Send OTP"}
                </button>
              </form>

              <div className="auth-footer">
                <p>Don't have an account? <Link to="/signup">Create one now</Link></p>
              </div>
            </>
          )}

          {step === "otp" && (
            <div className="otp-wrapper">
              <OTPVerification
                email={loginMethod === "email" ? email : ""}
                mobileHint={otpData.mobileHint}
                emailHint={otpData.emailHint}
                expiresIn={otpData.expiresIn}
                onVerify={handleVerifyOTP}
                onResend={handleResendOTP}
                loading={otpLoading}
                error={otpError}
                flow="login"
              />
              <button
                onClick={handleBackToCredentials}
                className="back-to-form-btn"
                disabled={otpLoading}
              >
                ← {loginMethod === "email" ? "Use Different Email" : "Use Different Mobile"}
              </button>
            </div>
          )}

          {step === "success" && (
            <div className="success-message">
              <div className="success-icon success-icon-svg"><IconCheck /></div>
              <h2>Login Successful!</h2>
              <p>Welcome back to Krittika Style</p>
              <p className="success-redirect">Redirecting to home page…</p>
            </div>
          )}
        </div>

        {/* Right side illustration */}
        <div className="auth-illustration">
          <div className="illustration-content">
            <svg className="auth-motif" viewBox="0 0 280 280" fill="none" aria-hidden="true">
              <defs>
                <linearGradient id="ag1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#9B90F5" stopOpacity="0.55"/>
                  <stop offset="100%" stopColor="#667eea" stopOpacity="0.25"/>
                </linearGradient>
              </defs>
              <circle cx="140" cy="140" r="110" stroke="rgba(155,144,245,0.18)" strokeWidth="1"/>
              <circle cx="140" cy="140" r="80"  stroke="rgba(155,144,245,0.22)" strokeWidth="1"/>
              <circle cx="140" cy="140" r="50"  stroke="rgba(155,144,245,0.28)" strokeWidth="1.2"/>
              <path d="M140 30L250 140L140 250L30 140Z" stroke="url(#ag1)" strokeWidth="1.2" fill="none"/>
              <path d="M140 70L210 140L140 210L70 140Z" stroke="rgba(155,144,245,0.4)" strokeWidth="1" fill="none"/>
              <line x1="140" y1="30" x2="140" y2="70" stroke="rgba(155,144,245,0.3)" strokeWidth="0.8"/>
              <line x1="250" y1="140" x2="210" y2="140" stroke="rgba(155,144,245,0.3)" strokeWidth="0.8"/>
              <line x1="140" y1="250" x2="140" y2="210" stroke="rgba(155,144,245,0.3)" strokeWidth="0.8"/>
              <line x1="30" y1="140" x2="70" y2="140" stroke="rgba(155,144,245,0.3)" strokeWidth="0.8"/>
              <circle cx="140" cy="30"  r="3.5" fill="#9B90F5" fillOpacity="0.8"/>
              <circle cx="250" cy="140" r="3.5" fill="#9B90F5" fillOpacity="0.8"/>
              <circle cx="140" cy="250" r="3.5" fill="#9B90F5" fillOpacity="0.8"/>
              <circle cx="30"  cy="140" r="3.5" fill="#9B90F5" fillOpacity="0.8"/>
              <circle cx="140" cy="140" r="18" fill="none" stroke="rgba(155,144,245,0.5)" strokeWidth="1.2"/>
              <circle cx="140" cy="140" r="8"  fill="rgba(102,126,234,0.25)"/>
              <circle cx="140" cy="140" r="3.5" fill="rgba(155,144,245,0.95)"/>
            </svg>
            <h3>Welcome Back</h3>
            <p>Sign in to access your orders, wishlist, and exclusive collections</p>
            <div className="illustration-features">
              <div className="feature"><span className="feature-check">✓</span> Email or Mobile Login</div>
              <div className="feature"><span className="feature-check">✓</span> Secure OTP Verification</div>
              <div className="feature"><span className="feature-check">✓</span> Order Tracking</div>
              <div className="feature"><span className="feature-check">✓</span> Saved Wishlist</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
