import React from "react";
import { Link } from "react-router-dom";
import "./Hero.css";

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
            <div className="feature-card">
              <span className="feature-icon">🧵</span>
              <h3>Direct from Weavers</h3>
              <p>We source directly from handloom cooperatives and master weavers across Bengal, Varanasi, and Kanchipuram — no middlemen, genuine craft.</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">✂️</span>
              <h3>Blouse Stitching</h3>
              <p>Add custom blouse stitching to any order. Share your measurements and receive your saree ready to drape.</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">🔄</span>
              <h3>Hassle-free Returns</h3>
              <p>Not what you expected? We offer a straightforward 7-day return policy on all unworn, unaltered sarees.</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">🚚</span>
              <h3>Pan-India Delivery</h3>
              <p>Orders shipped across India via trusted logistics partners with real-time Shiprocket tracking built into your account.</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">🎁</span>
              <h3>Gift Packaging</h3>
              <p>Every saree is carefully folded and wrapped. Add a handwritten note for gifting — perfect for weddings, Pujas, and milestones.</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">🔒</span>
              <h3>Secure Payments</h3>
              <p>Pay safely with UPI, Net Banking, Cards, or EMI via Razorpay. Your transaction data is always encrypted.</p>
            </div>
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
            <Link to="/products" className="btn btn-light">
              Browse All Sarees
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Hero;
