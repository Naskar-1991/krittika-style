import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import "./Signup.css";
import API_URL from "../api_connection/BackendAPIConnection";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setError("");
  };

  const validateForm = () => {
    if (!form.email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Please enter a valid email");
      return false;
    }
    if (!form.password.trim()) {
      setError("Password is required");
      return false;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!data.token) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      // Fetch user profile to get role
      const profileRes = await fetch(`${API_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${data.token}` },
      });
      const profileData = await profileRes.json();

      login(data.token, profileData);
      navigate("/");
    } catch (err) {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
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

          <>
            <h2>Welcome Back!</h2>
            <p className="auth-subtitle">Sign in to your account to continue</p>

            {error && <div className="error-message">⚠️ {error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <small>At least 6 characters</small>
              </div>

              <button
                type="submit"
                className="btn-submit"
                disabled={loading}
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </form>

            <div className="auth-footer">
              <p>Don't have an account? <Link to="/signup">Create one now</Link></p>
            </div>
          </>
        </div>

        {/* Right side illustration */}
        <div className="auth-illustration">
          <div className="illustration-content">
            <span className="illustration-emoji">🔐</span>
            <h3>Secure Login</h3>
            <p>Access your orders and account safely</p>
            <div className="illustration-features">
              <div className="feature">✓ Secure Authentication</div>
              <div className="feature">✓ Protected Account</div>
              <div className="feature">✓ Order History</div>
              <div className="feature">✓ Quick Checkout</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
