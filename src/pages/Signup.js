import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Signup.css";
import OTPVerification from "../components/OTPVerification";
import API_URL from "../api_connection/BackendAPIConnection";

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
            <span className="logo-icon">🛍️</span>
            <h1>KrittikaStyle</h1>
          </div>

          {step === "form" && (
            <>
              <h2>Create Your Account</h2>
              <p className="auth-subtitle">Join millions of happy shoppers</p>

              {error && <div className="error-message">⚠️ {error}</div>}

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
              <div className="success-icon">✅</div>
              <h2>Account Created Successfully!</h2>
              <p>Your mobile number has been verified</p>
              <p className="success-redirect">Redirecting to home page...</p>
            </div>
          )}
        </div>

        {/* Right side illustration */}
        <div className="auth-illustration">
          <div className="illustration-content">
            <span className="illustration-emoji">📦</span>
            <h3>Welcome to KrittikaStyle</h3>
            <p>Shop millions of products with secure checkout</p>
            <div className="illustration-features">
              <div className="feature">✓ Fast Shipping</div>
              <div className="feature">✓ Secure Payments</div>
              <div className="feature">✓ Easy Returns</div>
              <div className="feature">✓ 24/7 Support</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
