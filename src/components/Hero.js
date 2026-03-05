import React from "react";
import { Link } from "react-router-dom";
import "./Hero.css";

function Hero() {
  return (
    <div className="hero">
      {/* Main Hero Banner */}
      <div className="hero-banner">
        <div className="hero-content">
          <div className="hero-text">
            <span className="hero-badge">WELCOME TO KRITTIKASTYLE</span>
            <h1 className="hero-title">
              Discover Amazing Products <span className="highlight">Today</span>
            </h1>
            <p className="hero-description">
              Shop the latest trends and exclusive collections at unbeatable prices.
              Free shipping on orders over $50!
            </p>
            <div className="hero-buttons">
              <Link to="/" className="btn btn-primary">
                🛍️ Start Shopping
              </Link>
              <a href="#featured" className="btn btn-secondary">
                ↓ Explore Deals
              </a>
            </div>
          </div>
          <div className="hero-image">
            <div className="hero-illustration">
              <span className="hero-emoji">🛒</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <h3>50K+</h3>
              <p>Happy Customers</p>
            </div>
            <div className="stat-item">
              <h3>10K+</h3>
              <p>Products Available</p>
            </div>
            <div className="stat-item">
              <h3>24/7</h3>
              <p>Customer Support</p>
            </div>
            <div className="stat-item">
              <h3>100%</h3>
              <p>Secure Payment</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="features-section">
        <div className="container">
          <h2 className="section-title">Why Choose KrittikaStyle?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <span className="feature-icon">🚀</span>
              <h3>Fast Delivery</h3>
              <p>Get your orders shipped quickly to your doorstep with tracking.</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">💳</span>
              <h3>Secure Payment</h3>
              <p>Multiple payment options with industry-leading security measures.</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">🔄</span>
              <h3>Easy Returns</h3>
              <p>30-day return policy. No questions asked if you're not satisfied.</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">🎯</span>
              <h3>Best Prices</h3>
              <p>Guaranteed lowest prices with regular discounts and special offers.</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">⭐</span>
              <h3>Quality Assured</h3>
              <p>All products are carefully selected and quality checked.</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">🌍</span>
              <h3>Worldwide Shipping</h3>
              <p>We ship to over 100 countries around the globe.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Exclusive Offers Waiting!</h2>
            <p>Join thousands of satisfied customers enjoying premium products</p>
            <Link to="/" className="btn btn-light">
              View All Products
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Hero;
