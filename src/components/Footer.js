import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

/* ── Social SVG icons ── */
const IconFacebook = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);
const IconInstagram = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);
const IconPinterest = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
  </svg>
);
const IconYoutube = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
    <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/>
  </svg>
);

/* ── Trust bar SVG icons ── */
const IconHandcraft = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22C6.48 22 2 17.52 2 12S6.48 2 12 2s10 4.48 10 10-4.48 10-10 10z"/>
    <path d="M12 2c-4 4-4 16 0 20m0-20c4 4 4 16 0 20"/><path d="M2 12h20"/>
  </svg>
);
const IconTruck = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13"/>
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
    <circle cx="5.5" cy="18.5" r="2.5"/>
    <circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
);
const IconRefresh = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);
const IconShield = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

/* ── Payment method badges ── */
const PayBadge = ({ label }) => (
  <span className="pay-badge">{label}</span>
);

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
              {subscribed && <span className="success-msg">Thank you — you're in!</span>}
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
              <p>
                A curated house of Indian handwoven sarees — sourced directly
                from weavers across Bengal, Varanasi, and Kanchipuram. Every
                drape tells a story.
              </p>
              <div className="social-links">
                <a href="https://facebook.com" target="_blank" rel="noreferrer" className="social-icon" aria-label="Facebook"><IconFacebook /></a>
                <a href="https://instagram.com" target="_blank" rel="noreferrer" className="social-icon" aria-label="Instagram"><IconInstagram /></a>
                <a href="https://pinterest.com" target="_blank" rel="noreferrer" className="social-icon" aria-label="Pinterest"><IconPinterest /></a>
                <a href="https://youtube.com"   target="_blank" rel="noreferrer" className="social-icon" aria-label="YouTube"><IconYoutube /></a>
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

            {/* Secure Payments */}
            <div className="footer-section">
              <h4>Secure Payments</h4>
              <div className="payment-methods">
                <PayBadge label="UPI" />
                <PayBadge label="Net Banking" />
                <PayBadge label="Visa" />
                <PayBadge label="RuPay" />
                <PayBadge label="EMI" />
              </div>
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
              <span className="info-icon"><IconHandcraft /></span>
              <div>
                <strong>Handwoven &amp; Authentic</strong>
                <p>Sourced from India's finest weaving clusters</p>
              </div>
            </div>
            <div className="info-item">
              <span className="info-icon"><IconTruck /></span>
              <div>
                <strong>Pan-India Shipping</strong>
                <p>Fast delivery with live Shiprocket tracking</p>
              </div>
            </div>
            <div className="info-item">
              <span className="info-icon"><IconRefresh /></span>
              <div>
                <strong>7-Day Returns</strong>
                <p>Easy, no-questions returns on all sarees</p>
              </div>
            </div>
            <div className="info-item">
              <span className="info-icon"><IconShield /></span>
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
