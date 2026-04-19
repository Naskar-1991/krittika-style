import React from "react";
import { useNavigate } from "react-router-dom";
import "./HomeBanner.css";

const HomeBanner = () => {
  const navigate = useNavigate();

  return (
    <div className="home-banner-container">
      <div className="banner-wrapper">
        {/* Background image overlay */}
        <div className="banner-overlay" />

        {/* Decorative motif elements */}
        <div className="banner-motif banner-motif-1" aria-hidden="true" />
        <div className="banner-motif banner-motif-2" aria-hidden="true" />

        {/* Content */}
        <div className="banner-content">
          <div className="banner-text">
            <span className="banner-eyebrow">Handcrafted with Love · Est. 2020</span>

            <h1 className="banner-title">
              The Art of the<br />
              <span className="banner-title-accent">Indian Saree</span>
            </h1>

            <p className="banner-description">
              Each drape tells a story. Discover our curated collection of handwoven
              silks, heritage Banarasi, and occasion sarees — sourced directly from
              India's finest weavers.
            </p>

            <div className="banner-buttons">
              <button
                className="banner-btn-primary"
                onClick={() => navigate("/products")}
              >
                Explore Collection
              </button>
              <button
                className="banner-btn-secondary"
                onClick={() => navigate("/products?sort=newest")}
              >
                New Arrivals
              </button>
            </div>

            <div className="banner-trust">
              <div className="trust-item">
                <span className="trust-check">✓</span> Handwoven &amp; Authentic
              </div>
              <div className="trust-item">
                <span className="trust-check">✓</span> Pan-India Shipping
              </div>
              <div className="trust-item">
                <span className="trust-check">✓</span> Easy Returns
              </div>
            </div>
          </div>

          <div className="banner-visual">
            <div className="banner-card-stack">
              <div className="banner-card banner-card-back" />
              <div className="banner-card banner-card-mid" />
              <div className="banner-card banner-card-front">
                <div className="banner-saree-icon">🥻</div>
                <p className="banner-card-label">New Collection</p>
                <p className="banner-card-sub">Spring — Summer 2026</p>
              </div>
            </div>
          </div>
        </div>

        {/* Occasion strip */}
        <div className="banner-occasion-strip">
          <span className="occasion-label">Shop by Occasion</span>
          <div className="occasion-pills">
            {["Bridal", "Festive", "Casual", "Office", "Gifting"].map((o) => (
              <button
                key={o}
                className="occasion-pill"
                onClick={() => navigate(`/products?search=${o}`)}
              >
                {o}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeBanner;
