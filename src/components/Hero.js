import React from "react";
import { Link } from "react-router-dom";
import "./Hero.css";

/* ── SVG feature icons ── */
const IconWeave = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22C6.48 22 2 17.52 2 12S6.48 2 12 2s10 4.48 10 10-4.48 10-10 10z"/>
    <path d="M12 2C8 6 8 18 12 22M12 2c4 4 4 16 0 20"/>
    <path d="M2 12h20"/>
  </svg>
);

const IconScissors = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="6" r="3"/>
    <circle cx="6" cy="18" r="3"/>
    <line x1="20" y1="4" x2="8.12" y2="15.88"/>
    <line x1="14.47" y1="14.48" x2="20" y2="20"/>
    <line x1="8.12" y1="8.12" x2="12" y2="12"/>
  </svg>
);

const IconRefreshArrows = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);

const IconTruck = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13"/>
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
    <circle cx="5.5" cy="18.5" r="2.5"/>
    <circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
);

const IconGift = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 12 20 22 4 22 4 12"/>
    <rect x="2" y="7" width="20" height="5"/>
    <line x1="12" y1="22" x2="12" y2="7"/>
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
  </svg>
);

const IconLock = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const FEATURES = [
  { icon: <IconWeave />,         title: "Direct from Weavers",  desc: "We source directly from handloom cooperatives and master weavers across Bengal, Varanasi, and Kanchipuram — no middlemen, genuine craft." },
  { icon: <IconScissors />,      title: "Blouse Stitching",     desc: "Add custom blouse stitching to any order. Share your measurements and receive your saree ready to drape." },
  { icon: <IconRefreshArrows />, title: "Hassle-free Returns",  desc: "Not what you expected? We offer a straightforward 7-day return policy on all unworn, unaltered sarees." },
  { icon: <IconTruck />,         title: "Pan-India Delivery",   desc: "Orders shipped across India via trusted logistics partners with real-time Shiprocket tracking built into your account." },
  { icon: <IconGift />,          title: "Gift Packaging",       desc: "Every saree is carefully folded and wrapped. Add a handwritten note for gifting — perfect for weddings, Pujas, and milestones." },
  { icon: <IconLock />,          title: "Secure Payments",      desc: "Pay safely with UPI, Net Banking, Cards, or EMI via Razorpay. Your transaction data is always encrypted." },
];

function Hero() {
  return (
    <div className="hero">
      {/* Stats Bar */}
      <div className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item"><h3>5,000+</h3><p>Sarees Delivered</p></div>
            <div className="stat-item"><h3>200+</h3><p>Weave Styles</p></div>
            <div className="stat-item"><h3>15+</h3><p>Fabric Types</p></div>
            <div className="stat-item"><h3>100%</h3><p>Authenticity Guarantee</p></div>
          </div>
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="features-section">
        <div className="container">
          <h2 className="section-title">Why Krittika Style</h2>
          <div className="features-grid">
            {FEATURES.map((f) => (
              <div className="feature-card" key={f.title}>
                <div className="feature-icon-wrap">
                  <span className="feature-icon">{f.icon}</span>
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Band */}
      <div className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Find Your Perfect Drape</h2>
            <p>From everyday cottons to heirloom silks — every woman deserves a saree that feels made for her.</p>
            <Link to="/products" className="btn-light">Browse All Sarees</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Hero;
