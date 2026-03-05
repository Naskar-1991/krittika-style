import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      {/* Newsletter Section */}
      <div className="newsletter-section">
        <div className="container">
          <div className="newsletter-content">
            <div className="newsletter-text">
              <h3>Subscribe to Our Newsletter</h3>
              <p>Get special offers, new products, and exclusive deals delivered to your inbox!</p>
            </div>
            <form onSubmit={handleSubscribe} className="newsletter-form">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit">Subscribe</button>
              {subscribed && <span className="success-msg">✓ Thank you for subscribing!</span>}
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="footer-main">
        <div className="container">
          <div className="footer-grid">
            {/* About Section */}
            <div className="footer-section">
              <h4>About KrittikaStyle</h4>
              <div className="logo-footer">
                <span className="logo-icon">🛍️</span>
                <span className="logo-text">KrittikaStyle</span>
              </div>
              <p>
                Your one-stop destination for quality products at unbeatable prices.
                We're committed to providing the best shopping experience.
              </p>
              <div className="social-links">
                <a href="#facebook" className="social-icon">f</a>
                <a href="#twitter" className="social-icon">𝕏</a>
                <a href="#instagram" className="social-icon">📷</a>
                <a href="#linkedin" className="social-icon">in</a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="footer-section">
              <h4>Quick Links</h4>
              <ul className="footer-links">
                <li><Link to="/">Home</Link></li>
                <li><Link to="/">Shop</Link></li>
                <li><a href="#deals">Special Offers</a></li>
                <li><a href="#trending">Trending Products</a></li>
                <li><a href="#new">New Arrivals</a></li>
              </ul>
            </div>

            {/* Customer Support */}
            <div className="footer-section">
              <h4>Customer Support</h4>
              <ul className="footer-links">
                <li><a href="#contact">Contact Us</a></li>
                <li><a href="#faq">FAQ</a></li>
                <li><a href="#shipping">Shipping Info</a></li>
                <li><a href="#returns">Returns & Exchanges</a></li>
                <li><a href="#track">Track Order</a></li>
              </ul>
            </div>

            {/* Company */}
            <div className="footer-section">
              <h4>Company</h4>
              <ul className="footer-links">
                <li><a href="#about">About Us</a></li>
                <li><a href="#careers">Careers</a></li>
                <li><a href="#blog">Blog</a></li>
                <li><a href="#partnership">Partnership</a></li>
                <li><a href="#press">Press</a></li>
              </ul>
            </div>

            {/* Payment Methods */}
            <div className="footer-section">
              <h4>Payment Methods</h4>
              <div className="payment-methods">
                <span className="payment-icon">💳</span>
                <span className="payment-icon">🏦</span>
                <span className="payment-icon">📱</span>
                <span className="payment-icon">🪙</span>
              </div>
              <h5>We Accept</h5>
              <p>Visa, Mastercard, Paypal, Apple Pay, Google Pay</p>
            </div>
          </div>
        </div>
      </div>

      {/* Information Bar */}
      <div className="footer-info-bar">
        <div className="container">
          <div className="info-grid">
            <div className="info-item">
              <span className="info-icon">🚚</span>
              <div>
                <strong>Free Shipping</strong>
                <p>On orders over $50</p>
              </div>
            </div>
            <div className="info-item">
              <span className="info-icon">🔒</span>
              <div>
                <strong>100% Secure</strong>
                <p>Secure checkout</p>
              </div>
            </div>
            <div className="info-item">
              <span className="info-icon">🔄</span>
              <div>
                <strong>Easy Returns</strong>
                <p>30-day return policy</p>
              </div>
            </div>
            <div className="info-item">
              <span className="info-icon">☎️</span>
              <div>
                <strong>24/7 Support</strong>
                <p>Dedicated customer service</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="footer-bottom">
        <div className="container">
          <div className="footer-bottom-content">
            <div className="copyright">
              <p>&copy; {currentYear} KrittikaStyle. All rights reserved.</p>
            </div>
            <div className="footer-bottom-links">
              <a href="#privacy">Privacy Policy</a>
              <span className="divider">|</span>
              <a href="#terms">Terms of Service</a>
              <span className="divider">|</span>
              <a href="#cookies">Cookie Settings</a>
              <span className="divider">|</span>
              <a href="#sitemap">Sitemap</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
