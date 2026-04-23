import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Signup.css";
import OTPVerification from "../components/OTPVerification";
import API_URL from "../api_connection/BackendAPIConnection";

const IconWarning = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const IconCheck = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const Signup = () => {
  const [step, setStep] = useState("form"); // 'form', 'otp', 'success'
  const [form, setForm] = useState({ 
    name: "", 
    email: "", 
    password: "", 
    mobile: "" 
  });
  const [otpData, setOtpData] = useState({
    mobileHint: "",
    expiresIn: 10,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setError("");
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      setError("Name is required");
      return false;
    }
    if (!form.email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Please enter a valid email");
      return false;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    if (!form.mobile.trim()) {
      setError("Mobile number is required");
      return false;
    }
    if (!/^\d{10}$/.test(form.mobile.replace(/\D/g, ""))) {
      setError("Please enter a valid 10-digit mobile number");
      return false;
    }
    return true;
  };

  const handleInitiateSignup = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/auth/signup-initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to initiate signup. Please try again.");
        setLoading(false);
        return;
      }

      // Move to OTP verification step
      setOtpData({
        mobileHint: data.mobileHint,
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
      const res = await fetch(`${API_URL}/api/auth/signup-verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          otp: otp,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setOtpError(data.error || "OTP verification failed");
        setOtpLoading(false);
        return;
      }

      // Save token and redirect
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      
      setStep("success");
      setTimeout(() => {
        navigate("/");
      }, 2000);
      setOtpLoading(false);
    } catch (err) {
      setOtpError("An error occurred during OTP verification");
      setOtpLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/signup-resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          mobile: form.mobile,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setOtpError(data.error || "Failed to resend OTP");
      } else {
        setOtpError(""); // Clear any previous errors
        // OTP has been resent successfully
      }
    } catch (err) {
      setOtpError("Failed to resend OTP. Please try again.");
    }
  };

  const handleBackToForm = () => {
    setStep("form");
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

          {step === "form" && (
            <>
              <h2>Create Your Account</h2>
              <p className="auth-subtitle">Join millions of happy shoppers</p>

              {error && <div className="error-message"><IconWarning /> {error}</div>}

              <form onSubmit={handleInitiateSignup} className="auth-form">
                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="john@example.com"
                    value={form.email}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="mobile">Mobile Number *</label>
                  <input
                    type="tel"
                    id="mobile"
                    name="mobile"
                    placeholder="9876543210"
                    value={form.mobile}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                  <small>Enter 10-digit mobile number</small>
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password *</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    placeholder="At least 6 characters"
                    value={form.password}
                    onChange={handleChange}
                    disabled={loading}
                    required
                  />
                  <small>Minimum 6 characters recommended</small>
                </div>

                <button 
                  type="submit" 
                  className="btn-submit"
                  disabled={loading}
                >
                  {loading ? "Verifying Details..." : "Create Account"}
                </button>
              </form>

              <div className="auth-footer">
                <p>Already have an account? <Link to="/login">Login here</Link></p>
              </div>
            </>
          )}

          {step === "otp" && (
            <div className="otp-wrapper">
              <OTPVerification
                email={form.email}
                mobileHint={otpData.mobileHint}
                expiresIn={otpData.expiresIn}
                onVerify={handleVerifyOTP}
                onResend={handleResendOTP}
                loading={otpLoading}
                error={otpError}
                flow="signup"
              />
              <button 
                onClick={handleBackToForm}
                className="back-to-form-btn"
                disabled={otpLoading}
              >
                ← Back to Signup Form
              </button>
            </div>
          )}

          {step === "success" && (
            <div className="success-message">
              <div className="success-icon success-icon-svg"><IconCheck /></div>
              <h2>Account Created!</h2>
              <p>Your mobile number has been verified</p>
              <p className="success-redirect">Redirecting to home page…</p>
            </div>
          )}
        </div>

        {/* Right side illustration */}
        <div className="auth-illustration">
          <div className="illustration-content">
            <svg className="auth-motif" viewBox="0 0 280 280" fill="none" aria-hidden="true">
              <defs>
                <linearGradient id="sg1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#9B90F5" stopOpacity="0.55"/>
                  <stop offset="100%" stopColor="#667eea" stopOpacity="0.25"/>
                </linearGradient>
              </defs>
              <circle cx="140" cy="140" r="110" stroke="rgba(155,144,245,0.18)" strokeWidth="1"/>
              <circle cx="140" cy="140" r="80"  stroke="rgba(155,144,245,0.22)" strokeWidth="1"/>
              <circle cx="140" cy="140" r="50"  stroke="rgba(155,144,245,0.28)" strokeWidth="1.2"/>
              <path d="M140 30L250 140L140 250L30 140Z" stroke="url(#sg1)" strokeWidth="1.2" fill="none"/>
              <path d="M140 70L210 140L140 210L70 140Z" stroke="rgba(155,144,245,0.4)" strokeWidth="1" fill="none"/>
              <line x1="140" y1="30" x2="140" y2="70" stroke="rgba(155,144,245,0.3)" strokeWidth="0.8"/>
              <line x1="250" y1="140" x2="210" y2="140" stroke="rgba(155,144,245,0.3)" strokeWidth="0.8"/>
              <line x1="140" y1="250" x2="140" y2="210" stroke="rgba(155,144,245,0.3)" strokeWidth="0.8"/>
              <line x1="30"  y1="140" x2="70"  y2="140" stroke="rgba(155,144,245,0.3)" strokeWidth="0.8"/>
              <circle cx="140" cy="30"  r="3.5" fill="#9B90F5" fillOpacity="0.8"/>
              <circle cx="250" cy="140" r="3.5" fill="#9B90F5" fillOpacity="0.8"/>
              <circle cx="140" cy="250" r="3.5" fill="#9B90F5" fillOpacity="0.8"/>
              <circle cx="30"  cy="140" r="3.5" fill="#9B90F5" fillOpacity="0.8"/>
              <circle cx="140" cy="140" r="18" fill="none" stroke="rgba(155,144,245,0.5)" strokeWidth="1.2"/>
              <circle cx="140" cy="140" r="8"  fill="rgba(102,126,234,0.25)"/>
              <circle cx="140" cy="140" r="3.5" fill="rgba(155,144,245,0.95)"/>
            </svg>
            <h3>Join Krittika Style</h3>
            <p>Discover handwoven sarees from India's finest weavers</p>
            <div className="illustration-features">
              <div className="feature"><span className="feature-check">✓</span> Direct from Weavers</div>
              <div className="feature"><span className="feature-check">✓</span> Secure OTP Verification</div>
              <div className="feature"><span className="feature-check">✓</span> Easy Returns</div>
              <div className="feature"><span className="feature-check">✓</span> Pan-India Delivery</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
