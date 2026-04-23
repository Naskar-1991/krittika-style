import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./HomeBanner.css";

const TICKER_ITEMS = [
  "Handwoven Silks",
  "Banarasi Weaves",
  "Kanjivaram Silk",
  "Bengal Cotton",
  "Festive Drapes",
  "Bridal Collection",
  "Handloom Craft",
  "New Arrivals",
  "Limited Edition",
  "Direct from Weavers",
];

const STATS = [
  { val: "5,000+", label: "Sarees Delivered" },
  { val: "200+",   label: "Weave Styles"     },
  { val: "15+",    label: "Fabric Types"     },
  { val: "100%",   label: "Authenticity"     },
];

/* ─── SVG: geometric woven motif (replaces emoji) ─── */
function WovenMotif() {
  return (
    <svg className="hb-motif" viewBox="0 0 220 220" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="mg1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#8a9ef7" stopOpacity="0.7"/>
          <stop offset="100%" stopColor="#764ba2" stopOpacity="0.5"/>
        </linearGradient>
        <linearGradient id="mg2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#9B90F5" stopOpacity="0.9"/>
          <stop offset="100%" stopColor="#667eea" stopOpacity="0.4"/>
        </linearGradient>
        <pattern id="wg" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
          <path d="M0 11L11 0L22 11L11 22Z" fill="none" stroke="rgba(155,144,245,0.15)" strokeWidth="0.7"/>
        </pattern>
      </defs>

      {/* Woven grid fill */}
      <rect x="10" y="10" width="200" height="200" fill="url(#wg)"/>

      {/* Outer diamond */}
      <path d="M110 18L202 110L110 202L18 110Z" fill="none" stroke="url(#mg1)" strokeWidth="1.2"/>
      {/* Middle diamond */}
      <path d="M110 44L176 110L110 176L44 110Z" fill="none" stroke="url(#mg2)" strokeWidth="1"/>
      {/* Inner diamond */}
      <path d="M110 70L150 110L110 150L70 110Z" fill="rgba(102,126,234,0.08)" stroke="rgba(155,144,245,0.55)" strokeWidth="1.2"/>

      {/* Cardinal spokes */}
      <line x1="110" y1="18"  x2="110" y2="70"  stroke="rgba(155,144,245,0.28)" strokeWidth="0.8"/>
      <line x1="202" y1="110" x2="150" y2="110" stroke="rgba(155,144,245,0.28)" strokeWidth="0.8"/>
      <line x1="110" y1="202" x2="110" y2="150" stroke="rgba(155,144,245,0.28)" strokeWidth="0.8"/>
      <line x1="18"  y1="110" x2="70"  y2="110" stroke="rgba(155,144,245,0.28)" strokeWidth="0.8"/>

      {/* Corner jewels */}
      <circle cx="110" cy="18"  r="2.8" fill="#9B90F5" fillOpacity="0.75"/>
      <circle cx="202" cy="110" r="2.8" fill="#9B90F5" fillOpacity="0.75"/>
      <circle cx="110" cy="202" r="2.8" fill="#9B90F5" fillOpacity="0.75"/>
      <circle cx="18"  cy="110" r="2.8" fill="#9B90F5" fillOpacity="0.75"/>

      {/* Centre */}
      <circle cx="110" cy="110" r="24" fill="none" stroke="rgba(155,144,245,0.4)" strokeWidth="1"/>
      <circle cx="110" cy="110" r="13" fill="rgba(102,126,234,0.12)"/>
      <circle cx="110" cy="110" r="5"  fill="rgba(155,144,245,0.88)"/>
      <circle cx="110" cy="110" r="2"  fill="#ffffff" fillOpacity="0.65"/>
    </svg>
  );
}

/* ─── Inline SVG icons ─── */
const ArrowIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const StarIcon = () => (
  <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true">
    <path d="M4.5 1L5.6 3.4 8.2 3.8 6.3 5.6 6.75 8.2 4.5 7 2.25 8.2 2.7 5.6.8 3.8 3.4 3.4Z" fill="currentColor"/>
  </svg>
);

const DotIcon = () => (
  <svg width="5" height="5" viewBox="0 0 5 5" aria-hidden="true">
    <circle cx="2.5" cy="2.5" r="2" fill="currentColor"/>
  </svg>
);

/* ════════════════════════════════════════
   HomeBanner
════════════════════════════════════════ */
export default function HomeBanner() {
  const navigate  = useNavigate();
  const rootRef   = useRef(null);
  const radialRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setLoaded(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const onMouseMove = useCallback((e) => {
    if (!radialRef.current || !rootRef.current) return;
    const rect = rootRef.current.getBoundingClientRect();
    const dx   = ((e.clientX - rect.left) / rect.width  - 0.5) * 44;
    const dy   = ((e.clientY - rect.top)  / rect.height - 0.5) * 44;
    radialRef.current.style.transform =
      `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  }, []);

  return (
    <section
      className={`hb-root${loaded ? " hb-loaded" : ""}`}
      ref={rootRef}
      onMouseMove={onMouseMove}
      aria-label="Krittika Style — featured collection"
    >
      {/* ── Background atmosphere ── */}
      <div className="hb-grain"  aria-hidden="true"/>
      <div className="hb-radial" aria-hidden="true" ref={radialRef}/>
      <div className="hb-rule"   aria-hidden="true"/>

      {/* ══ Two-column body ══ */}
      <div className="hb-body">

        {/* Left: editorial text */}
        <div className="hb-left">

          <div className="hb-eyebrow">
            <span className="hb-pulse-dot" aria-hidden="true"/>
            Spring — Summer 2026
          </div>

          <h1 className="hb-headline">
            <span className="hb-hed-small">Drape in</span>
            <span className="hb-hed-large">Beauty.</span>
          </h1>

          <p className="hb-desc">
            Handwoven sarees from India's finest weavers — each piece a
            story, every thread a living tradition. No middlemen, no
            compromise. Pure craft, delivered to your door.
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
              New Arrivals <ArrowIcon />
            </button>
          </div>

          <div className="hb-trust" role="list">
            {["5,000+ Delivered", "Free Returns", "Direct from Weavers"].map((t) => (
              <span key={t} className="hb-trust-pill" role="listitem">
                <DotIcon /> {t}
              </span>
            ))}
          </div>
        </div>

        {/* Right: floating glass card */}
        <div className="hb-right" aria-hidden="true">
          <div className="hb-scene">
            <div className="hb-shadow hb-shadow-2"/>
            <div className="hb-shadow hb-shadow-1"/>

            <div className="hb-card">
              <div className="hb-card-header">
                <span className="hb-card-season">New Season</span>
                <span className="hb-card-year">2026</span>
              </div>

              <div className="hb-motif-wrap">
                <WovenMotif />
              </div>

              <div className="hb-card-meta">
                <p className="hb-card-name">Spring Collection</p>
                <p className="hb-card-sub">200+ weave styles</p>
              </div>

              <div className="hb-card-foot">
                <span className="hb-card-price">From ₹1,299</span>
                <button className="hb-card-link" onClick={() => navigate("/products")}>
                  Explore <ArrowIcon size={11}/>
                </button>
              </div>
            </div>

            <div className="hb-badge hb-badge-top">
              <StarIcon /> Trending Now
            </div>
            <div className="hb-badge hb-badge-btm">
              <StarIcon /> 4.9 Rating
            </div>
          </div>
        </div>
      </div>

      {/* ══ Stats bar ══ */}
      <div className="hb-stats" role="list">
        {STATS.map((s, i) => (
          <React.Fragment key={s.label}>
            <div className="hb-stat" role="listitem">
              <span className="hb-stat-val">{s.val}</span>
              <span className="hb-stat-label">{s.label}</span>
            </div>
            {i < STATS.length - 1 && <div className="hb-stat-sep" aria-hidden="true"/>}
          </React.Fragment>
        ))}
      </div>

      {/* ══ Marquee ticker ══ */}
      <div className="hb-ticker" aria-hidden="true">
        <div className="hb-ticker-track">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="hb-ticker-item">
              {item}
              <span className="hb-ticker-gem">◆</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
