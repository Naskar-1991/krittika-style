import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HomeBanner.css";

const TICKER_ITEMS = [
  "Handwoven Silks",
  "Banarasi Weaves",
  "Kanjivaram",
  "Cotton Drapes",
  "Festive Sarees",
  "Bridal Collection",
  "Handloom Craft",
  "Designer Picks",
  "New Arrivals",
  "Limited Edition",
];

const HomeBanner = () => {
  const navigate = useNavigate();
  const bannerRef = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const el = bannerRef.current;
    if (!el) return;
    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      setOffset({
        x: ((e.clientX - rect.left) / rect.width - 0.5) * 18,
        y: ((e.clientY - rect.top) / rect.height - 0.5) * 18,
      });
    };
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div className="hb-root" ref={bannerRef}>
      {/* Animated background blobs */}
      <div className="hb-blob hb-blob-1" aria-hidden="true" />
      <div className="hb-blob hb-blob-2" aria-hidden="true" />
      <div className="hb-blob hb-blob-3" aria-hidden="true" />

      {/* Subtle grid texture */}
      <div className="hb-grid" aria-hidden="true" />

      {/* Main content */}
      <div className="hb-content">
        {/* Left: text */}
        <div className="hb-left">
          <div className="hb-eyebrow">
            <span className="hb-dot" />
            Spring — Summer 2026
          </div>

          <h1 className="hb-headline">
            <span className="hb-h-top">DRAPE IN</span>
            <span className="hb-h-big">
              <em className="hb-shimmer">STYLE</em>
            </span>
            <span className="hb-h-sub">FEEL THE CRAFT.</span>
          </h1>

          <p className="hb-desc">
            Handwoven sarees from India's finest weavers — each piece a story,
            every thread a tradition.
          </p>

          <div className="hb-ctas">
            <button
              className="hb-btn-primary"
              onClick={() => navigate("/products")}
            >
              Shop Collection
            </button>
            <button
              className="hb-btn-ghost"
              onClick={() => navigate("/products?sort=newest")}
            >
              New Drops →
            </button>
          </div>

          <div className="hb-trust-row">
            <span className="hb-trust-pill">✦ 5000+ Delivered</span>
            <span className="hb-trust-pill">✦ Free Returns</span>
            <span className="hb-trust-pill">✦ Direct from Weavers</span>
          </div>
        </div>

        {/* Right: floating glass card */}
        <div
          className="hb-right"
          style={{ transform: `translate(${offset.x * 0.4}px, ${offset.y * 0.4}px)` }}
        >
          <div className="hb-card-group">
            <div className="hb-card-shadow-2" />
            <div className="hb-card-shadow-1" />
            <div className="hb-card-main">
              <div className="hb-card-header">
                <span className="hb-card-tag">✦ New Season</span>
                <span className="hb-card-hot">HOT</span>
              </div>
              <div className="hb-saree-wrap">
                <span className="hb-saree-emoji" role="img" aria-label="saree">🥻</span>
              </div>
              <p className="hb-card-title">Spring Collection</p>
              <p className="hb-card-hint">200+ weave styles</p>
              <div className="hb-card-footer">
                <span>From ₹1,299</span>
                <span className="hb-card-arrow">→</span>
              </div>
            </div>

            {/* Floating micro-badges */}
            <div className="hb-micro hb-micro-1" aria-hidden="true">
              🔥 Trending Now
            </div>
            <div className="hb-micro hb-micro-2" aria-hidden="true">
              ⭐ 4.9 Rating
            </div>
          </div>
        </div>
      </div>

      {/* Occasion pills */}
      <div className="hb-occasion-strip">
        <span className="hb-occasion-label">Shop by Occasion</span>
        <div className="hb-occasion-pills">
          {["Bridal", "Festive", "Casual", "Office", "Gifting"].map((o) => (
            <button
              key={o}
              className="hb-occ-pill"
              onClick={() => navigate(`/products?search=${o}`)}
            >
              {o}
            </button>
          ))}
        </div>
      </div>

      {/* Marquee ticker */}
      <div className="hb-ticker" aria-hidden="true">
        <div className="hb-ticker-track">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="hb-ticker-item">
              {item} <span className="hb-ticker-sep">✦</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeBanner;
