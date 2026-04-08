import React, { useState, useEffect } from "react";
import "./OTPVerification.css";

const OTPVerification = ({
  email,
  mobileHint,
  expiresIn = 10,
  onVerify,
  onResend,
  loading = false,
  error = null,
  success = null,
  flow = "signup", // 'signup' or 'login'
}) => {
  const [otp, setOtp] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(expiresIn * 60); // Convert minutes to seconds
  const [canResend, setCanResend] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Timer for OTP expiry
  useEffect(() => {
    if (timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  // Check if OTP has expired
  useEffect(() => {
    if (timeRemaining === 0) {
      setCanResend(true);
    }
  }, [timeRemaining]);

  // Timer for resend button
  useEffect(() => {
    if (resendCountdown <= 0) {
      setCanResend(false);
      return;
    }

    const timer = setInterval(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCountdown]);

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // Only allow digits
    setOtp(value.slice(0, 6)); // Limit to 6 digits
  };

  const handleVerify = (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      alert("Please enter a valid 6-digit OTP");
      return;
    }

    onVerify(otp);
  };

  const handleResend = async () => {
    setCanResend(false);
    setResendCountdown(30);
    setTimeRemaining(expiresIn * 60);
    setOtp("");

    try {
      await onResend();
    } catch (err) {
      console.error("Resend error:", err);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="otp-verification-container">
      <div className="otp-card">
        {/* Header */}
        <div className="otp-header">
          <div className="otp-icon">📱</div>
          <h2>Verify Your Mobile Number</h2>
          <p className="otp-subtitle">
            We've sent a verification code to your mobile ending in <strong>{mobileHint}</strong>
          </p>
        </div>

        {/* Messages */}
        {error && <div className="otp-error">⚠️ {error}</div>}
        {success && <div className="otp-success">✅ {success}</div>}

        {/* OTP Form */}
        {!success ? (
          <form onSubmit={handleVerify} className="otp-form">
            {/* OTP Input */}
            <div className="otp-input-group">
              <label htmlFor="otp" className="otp-label">
                Enter 6-digit Code
              </label>
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={handleOtpChange}
                placeholder="000000"
                maxLength="6"
                disabled={loading}
                className={`otp-input ${otp.length === 6 ? "filled" : ""}`}
                autoFocus
              />
              <p className="otp-input-hint">Digits only • Auto-focus • Copy from SMS</p>
            </div>

            {/* Timer */}
            <div className="otp-timer">
              <span className={timeRemaining <= 60 ? "warning" : ""}>
                ⏱️ {formatTime(timeRemaining)}
              </span>
              {timeRemaining <= 0 && (
                <span className="expired">OTP Expired</span>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || otp.length !== 6 || timeRemaining === 0}
              className="otp-submit-btn"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        ) : null}

        {/* Resend OTP Section */}
        <div className="otp-footer">
          <p className="resend-text">Didn't receive the code?</p>
          <button
            type="button"
            onClick={handleResend}
            disabled={canResend === false && resendCountdown > 0}
            className="resend-btn"
          >
            {canResend === false && resendCountdown > 0
              ? `Resend in ${resendCountdown}s`
              : "Resend OTP"}
          </button>
        </div>

        {/* Help Section */}
        <div className="otp-help">
          <p>📞 Need help? Contact support at support@krittikastyle.com</p>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;
