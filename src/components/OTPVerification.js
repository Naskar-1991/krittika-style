import React, { useState, useEffect } from "react";
import "./OTPVerification.css";

const IcoPhone = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.55 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
const IcoWarn  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IcoCheck = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoClock = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;

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
          <div className="otp-icon"><IcoPhone /></div>
          <h2>Verify Your Mobile Number</h2>
          <p className="otp-subtitle">
            We've sent a verification code to your mobile ending in <strong>{mobileHint}</strong>
          </p>
        </div>

        {/* Messages */}
        {error && <div className="otp-error"><IcoWarn /> {error}</div>}
        {success && <div className="otp-success"><IcoCheck /> {success}</div>}

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
                <IcoClock /> {formatTime(timeRemaining)}
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
          <p>Need help? Contact support at support@krittikastyle.com</p>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;
