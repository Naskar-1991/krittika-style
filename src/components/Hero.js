import React from "react";
import { Link } from "react-router-dom";
import "./Hero.css";

const FEATURES = [
  {
    icon: "🧵",
    title: "Direct from Weavers",
    desc: "We source directly from handloom cooperatives and master weavers across Bengal, Varanasi, and Kanchipuram — no middlemen, genuine craft.",
  },
  {
    icon: "✂️",
    title: "Blouse Stitching",
    desc: "Add custom blouse stitching to any order. Share your measurements and receive your saree ready to drape.",
  },
  {
    icon: "🔄",
    title: "Hassle-free Returns",
    desc: "Not what you expected? We offer a straightforward 7-day return policy on all unworn, unaltered sarees.",
  },
  {
    icon: "🚚",
    title: "Pan-India Delivery",
    desc: "Orders shipped across India via trusted logistics partners with real-time Shiprocket tracking built into your account.",
  },
  {
    icon: "🎁",
    title: "Gift Packaging",
    desc: "Every saree is carefully folded and wrapped. Add a handwritten note for gifting — perfect for weddings, Pujas, and milestones.",
  },
  {
    icon: "🔒",
    title: "Secure Payments",
    desc: "Pay safely with UPI, Net Banking, Cards, or EMI via Razorpay. Your transaction data is always encrypted.",
  },
];

function Hero() {
  return (
    <div className="hero">
      {/* Stats Bar */}
      <div className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <h3>5,000+</h3>
              <p>Sarees Delivered</p>
            </div>
            <div className="stat-item">
              <h3>200+</h3>
              <p>Weave Styles</p>
            </div>
            <div className="stat-item">
              <h3>15+</h3>
              <p>Fabric Types</p>
            </div>
            <div className="stat-item">
              <h3>100%</h3>
              <p>Authenticity Guarantee</p>
            </div>
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
            <p>
              From everyday cottons to heirloom silks — every woman deserves a saree
              that feels made for her.
            </p>
            <Link to="/products" className="btn-light">
              Browse All Sarees
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Hero;
