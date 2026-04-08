import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import "./Signup.css";
import OTPVerification from "../components/OTPVerification";
import API_URL from "../api_connection/BackendAPIConnection";

const Login = () => {
  const [step, setStep] = useState("credentials"); // 'credentials', 'otp', 'success'
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [loginMethod, setLoginMethod] = useState("email"); // 'email' or 'mobile'
  const [otpData, setOtpData] = useState({
    mobileHint: "",
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
            <span className="logo-icon">🛍️</span>
            <h1>KrittikaStyle</h1>
          </div>

          {step === "credentials" && (
            <>
              <h2>Welcome Back!</h2>
              <p className="auth-subtitle">Sign in to your account to continue</p>

              {error && <div className="error-message">⚠️ {error}</div>}

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
                  📧 Email
                </button>
                <button
                  type="button"
                  className={`tab-button ${loginMethod === "mobile" ? "active" : ""}`}
                  onClick={() => {
                    setLoginMethod("mobile");
                    setError("");
                  }}
                >
                  📱 Mobile
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
                  📱 We'll send an OTP to your registered mobile number for verification
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
              <div className="success-icon">✅</div>
              <h2>Login Successful!</h2>
              <p>Welcome back to KrittikaStyle</p>
              <p className="success-redirect">Redirecting to home page...</p>
            </div>
          )}
        </div>

        {/* Right side illustration */}
        <div className="auth-illustration">
          <div className="illustration-content">
            <span className="illustration-emoji">🔐</span>
            <h3>Secure Login</h3>
            <p>Access your orders and account safely</p>
            <div className="illustration-features">
              <div className="feature">✓ Email or Mobile Login</div>
              <div className="feature">✓ Secure OTP Verification</div>
              <div className="feature">✓ Protected Account</div>
              <div className="feature">✓ Order History</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
