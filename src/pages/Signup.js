import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Signup.css";

const Signup = () => {
  const [form, setForm] = useState({ 
    name: "", 
    email: "", 
    password: "", 
    mobile: "" 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5500/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Signup failed. Please try again.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setForm({ name: "", email: "", password: "", mobile: "" });
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/login", { state: { message: "Account created successfully! Please login." } });
      }, 2000);
    } catch (err) {
      setError("An error occurred. Please try again.", err);
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

          {success ? (
            <div className="success-message">
              <div className="success-icon">✅</div>
              <h2>Account Created Successfully!</h2>
              <p>Redirecting to login page...</p>
            </div>
          ) : (
            <>
              <h2>Create Your Account</h2>
              <p className="auth-subtitle">Join millions of happy shoppers</p>

              {error && <div className="error-message">⚠️ {error}</div>}

              <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={handleChange}
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
                    required
                  />
                  <small>Minimum 6 characters recommended</small>
                </div>

                <button 
                  type="submit" 
                  className="btn-submit"
                  disabled={loading}
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </button>
              </form>

              <div className="auth-footer">
                <p>Already have an account? <Link to="/login">Login here</Link></p>
              </div>
            </>
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
