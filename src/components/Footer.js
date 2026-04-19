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
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      {/* Newsletter */}
      <div className="newsletter-section">
        <div className="container">
          <div className="newsletter-content">
            <div className="newsletter-text">
              <h3>Stay Close to the Craft</h3>
              <p>New weaves, care guides, and seasonal collections — straight to your inbox.</p>
            </div>
            <form onSubmit={handleSubscribe} className="newsletter-form">
              <input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit">Subscribe</button>
              {subscribed && (
                <span className="success-msg">Thank you — you're in!</span>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="footer-main">
        <div className="container">
          <div className="footer-grid">
            {/* About */}
            <div className="footer-section">
              <h4>Krittika Style</h4>
              <div className="logo-footer">
                <span className="logo-icon">🥻</span>
                <span className="logo-text">Krittika Style</span>
              </div>
              <p>
                A curated house of Indian handwoven sarees — sourced directly
                from weavers across Bengal, Varanasi, and Kanchipuram. Every
                drape tells a story.
              </p>
              <div className="social-links">
                <a href="https://facebook.com" target="_blank" rel="noreferrer" className="social-icon">f</a>
                <a href="https://instagram.com" target="_blank" rel="noreferrer" className="social-icon">✦</a>
                <a href="https://pinterest.com" target="_blank" rel="noreferrer" className="social-icon">P</a>
                <a href="https://youtube.com"   target="_blank" rel="noreferrer" className="social-icon">▷</a>
              </div>
            </div>

            {/* Collections */}
            <div className="footer-section">
              <h4>Collections</h4>
              <ul className="footer-links">
                <li><Link to="/products?search=Silk">Silk Sarees</Link></li>
                <li><Link to="/products?search=Cotton">Cotton Sarees</Link></li>
                <li><Link to="/products?search=Banarasi">Banarasi</Link></li>
                <li><Link to="/products?search=Kanjivaram">Kanjivaram</Link></li>
                <li><Link to="/products?search=Handloom">Handloom</Link></li>
                <li><Link to="/products?sort=newest">New Arrivals</Link></li>
              </ul>
            </div>

            {/* Shop by Occasion */}
            <div className="footer-section">
              <h4>Shop by Occasion</h4>
              <ul className="footer-links">
                <li><Link to="/products?search=Bridal">Bridal &amp; Wedding</Link></li>
                <li><Link to="/products?search=Festive">Festive &amp; Puja</Link></li>
                <li><Link to="/products?search=Casual">Everyday Wear</Link></li>
                <li><Link to="/products?search=Office">Office Wear</Link></li>
                <li><Link to="/products?search=Gifting">Gifting</Link></li>
              </ul>
            </div>

            {/* Customer Care */}
            <div className="footer-section">
              <h4>Customer Care</h4>
              <ul className="footer-links">
                <li><a href="mailto:support@krittikastyle.com">Contact Us</a></li>
                <li><Link to="/orders">Track My Order</Link></li>
                <li><Link to="/returns">Returns &amp; Exchanges</Link></li>
                <li><a href="#shipping">Shipping Information</a></li>
                <li><a href="#sizing">Blouse Size Guide</a></li>
                <li><a href="#care">Fabric Care Guide</a></li>
              </ul>
            </div>

            {/* We Accept */}
            <div className="footer-section">
              <h4>Secure Payments</h4>
              <div className="payment-methods">
                <span className="payment-icon" title="UPI">📱</span>
                <span className="payment-icon" title="Net Banking">🏦</span>
                <span className="payment-icon" title="Credit / Debit Card">💳</span>
                <span className="payment-icon" title="EMI">🪙</span>
              </div>
              <h5>We Accept</h5>
              <p>UPI · Net Banking · Visa · Mastercard · RuPay · EMI</p>
              <h5>Shipped via</h5>
              <p>Shiprocket · Pan-India delivery with live tracking</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trust bar */}
      <div className="footer-info-bar">
        <div className="container">
          <div className="info-grid">
            <div className="info-item">
              <span className="info-icon">🧵</span>
              <div>
                <strong>Handwoven &amp; Authentic</strong>
                <p>Sourced from India's finest weaving clusters</p>
              </div>
            </div>
            <div className="info-item">
              <span className="info-icon">🚚</span>
              <div>
                <strong>Pan-India Shipping</strong>
                <p>Fast delivery with live Shiprocket tracking</p>
              </div>
            </div>
            <div className="info-item">
              <span className="info-icon">🔄</span>
              <div>
                <strong>7-Day Returns</strong>
                <p>Easy, no-questions returns on all sarees</p>
              </div>
            </div>
            <div className="info-item">
              <span className="info-icon">🔒</span>
              <div>
                <strong>100% Secure Checkout</strong>
                <p>Razorpay-powered encrypted payments</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="footer-bottom">
        <div className="container">
          <div className="footer-bottom-content">
            <div className="copyright">
              <p>&copy; {currentYear} Krittika Style. All rights reserved.</p>
            </div>
            <div className="footer-bottom-links">
              <a href="#privacy">Privacy Policy</a>
              <span className="divider">|</span>
              <a href="#terms">Terms of Service</a>
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
