import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API_URL from "../api_connection/BackendAPIConnection";
import "./HomeBanner.css";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1800&q=80";
const SLIDE_INTERVAL = 5000;

const ArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

export default function HomeBanner() {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  // Fetch active banners from backend
  useEffect(() => {
    fetch(`${API_URL}/api/banners`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setBanners(data);
      })
      .catch(() => {});
  }, []);

  // Derived slide list: use DB banners or a single fallback object
  const slides = banners.length > 0
    ? banners
    : [{ id: "fallback", image_url: null, title: "", link_url: "" }];

  const total = slides.length;

  const advance = useCallback(() => {
    setCurrent((c) => (c + 1) % total);
  }, [total]);

  const prev = () => setCurrent((c) => (c - 1 + total) % total);
  const next = () => { advance(); };

  // Auto-advance
  useEffect(() => {
    if (paused || total <= 1) return;
    timerRef.current = setInterval(advance, SLIDE_INTERVAL);
    return () => clearInterval(timerRef.current);
  }, [paused, total, advance]);

  const currentSlide = slides[current];
  const eyebrow = currentSlide?.title || "Spring — Summer 2026";
  const shopLink = currentSlide?.link_url || "/products";

  const getImageSrc = (slide) => {
    if (!slide || !slide.image_url) return FALLBACK_IMAGE;
    if (slide.image_url.startsWith("http")) return slide.image_url;
    return `${API_URL}${slide.image_url}`;
  };

  return (
    <section
      className="hb-root"
      aria-label="Krittika Style — featured collection"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* ── Slides ── */}
      {slides.map((slide, i) => (
        <img
          key={slide.id ?? i}
          className={`hb-slide${i === current ? " hb-slide--active" : ""}`}
          src={getImageSrc(slide)}
          alt={slide.title || "Saree collection"}
          loading={i === 0 ? "eager" : "lazy"}
          fetchpriority={i === 0 ? "high" : undefined}
        />
      ))}

      {/* ── Gradient overlays ── */}
      <div className="hb-overlay-left" aria-hidden="true"/>
      <div className="hb-overlay-btm"  aria-hidden="true"/>

      {/* ── Prev / Next arrows (only when multiple slides) ── */}
      {total > 1 && (
        <>
          <button className="hb-arrow hb-arrow--prev" onClick={prev} aria-label="Previous banner">
            <ChevronLeft />
          </button>
          <button className="hb-arrow hb-arrow--next" onClick={next} aria-label="Next banner">
            <ChevronRight />
          </button>
        </>
      )}

      {/* ── CTAs — centered on the banner ── */}
      <div className="hb-ctas">
        <p className="hb-eyebrow">{eyebrow}</p>
        <div className="hb-cta-row">
          <button
            className="hb-btn-primary"
            onClick={() => navigate(shopLink.startsWith("/") ? shopLink : "/products")}
          >
            Shop Collection
          </button>
          <button className="hb-btn-ghost" onClick={() => navigate("/products?sort=newest")}>
            New Arrivals <ArrowIcon/>
          </button>
        </div>
      </div>

      {/* ── Dot indicators ── */}
      {total > 1 && (
        <div className="hb-dots" role="tablist" aria-label="Banner slides">
          {slides.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === current}
              aria-label={`Slide ${i + 1}`}
              className={`hb-dot${i === current ? " hb-dot--active" : ""}`}
              onClick={() => setCurrent(i)}
            />
          ))}
        </div>
      )}

      {/* ── Stats bar ── */}
      <div className="hb-stats" aria-label="Quick facts">
        {[
          { val: "5,000+", label: "Sarees Delivered" },
          { val: "200+",   label: "Weave Styles"     },
          { val: "15+",    label: "Fabric Types"     },
          { val: "100%",   label: "Authenticity"     },
        ].map((s, i, arr) => (
          <React.Fragment key={s.label}>
            <div className="hb-stat">
              <span className="hb-stat-val">{s.val}</span>
              <span className="hb-stat-label">{s.label}</span>
            </div>
            {i < arr.length - 1 && <div className="hb-stat-sep" aria-hidden="true"/>}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}
