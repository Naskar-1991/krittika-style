import React, { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import HomeBanner from "../components/HomeBanner";
import Hero from "../components/Hero";
import ProductCard from "../components/ProductCard";
import ProductReel from "../components/ProductReel";
import { fetchCategories } from "../services/categoryService";
import SEOHead from "../components/SEOHead";
import "./Home.css";
import API_URL from "../api_connection/BackendAPIConnection";

const HOME_SCHEMA = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Krittika Style",
    "url": "https://www.krittikasarees.com",
    "logo": "https://www.krittikasarees.com/logo512.png",
    "description": "Handwoven Indian sarees — Banarasi silk, Kanjivaram, Handloom cotton and more, shipped across India.",
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "email": "support@krittikasarees.com",
      "availableLanguage": ["English", "Hindi", "Bengali"]
    },
    "sameAs": []
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Krittika Style",
    "url": "https://www.krittikasarees.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://www.krittikasarees.com/products?search={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  }
];

/* ── Category SVG icons ── */
const CatIconDiamond = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h12l4 6-10 13L2 9z"/><path d="M2 9h20M12 3l4 6-4 13-4-13z"/>
  </svg>
);
const CatIconLeaf = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 8C8 10 5.9 16.17 3.82 19.11a1 1 0 0 0 1.41 1.41C8.17 18.1 14.4 16 16 8z"/>
    <line x1="3" y1="21" x2="17" y2="8"/>
  </svg>
);
const CatIconWeave = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22C6.48 22 2 17.52 2 12S6.48 2 12 2s10 4.48 10 10-4.48 10-10 10z"/>
    <path d="M12 2c-4 4-4 16 0 20m0-20c4 4 4 16 0 20"/><path d="M2 12h20"/>
  </svg>
);
const CatIconFlower = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 2a2.4 2.4 0 0 0 0 4.8 2.4 2.4 0 0 0 0-4.8z" transform="rotate(0 12 12)"/>
    <path d="M12 17.2a2.4 2.4 0 0 0 0 4.8 2.4 2.4 0 0 0 0-4.8z"/>
    <path d="M2 12a2.4 2.4 0 0 0 4.8 0A2.4 2.4 0 0 0 2 12z"/>
    <path d="M17.2 12a2.4 2.4 0 0 0 4.8 0 2.4 2.4 0 0 0-4.8 0z"/>
  </svg>
);
const CatIconSparkle = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5z"/><line x1="12" y1="3" x2="12" y2="1"/><line x1="19" y1="10" x2="21" y2="10"/><line x1="12" y1="17" x2="12" y2="21"/><line x1="5" y1="10" x2="3" y2="10"/>
  </svg>
);
const CatIconSun = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);
const CatIconPalette = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>
    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
  </svg>
);
const CatIconCrown = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7z"/><line x1="5" y1="20" x2="19" y2="20"/>
  </svg>
);
const CatIconGift = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/>
    <line x1="12" y1="22" x2="12" y2="7"/>
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
  </svg>
);
const CatIconBriefcase = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
);
const CatIconNeedle = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2v10c0 3.31 2.69 6 6 6s6-2.69 6-6V2"/><line x1="6" y1="6" x2="18" y2="6"/>
  </svg>
);
const CatIconFabric = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);

function getCategoryIcon(name = "") {
  const n = name.toLowerCase();
  if (n.includes("silk") || n.includes("banarasi") || n.includes("kanjivaram") || n.includes("kanjeevaram") || n.includes("patola")) return <CatIconDiamond />;
  if (n.includes("cotton") || n.includes("linen") || n.includes("tussar")) return <CatIconLeaf />;
  if (n.includes("handloom") || n.includes("georgette") || n.includes("chiffon")) return <CatIconWeave />;
  if (n.includes("bridal")) return <CatIconFlower />;
  if (n.includes("festive") || n.includes("zari") || n.includes("embroidered")) return <CatIconSparkle />;
  if (n.includes("casual")) return <CatIconSun />;
  if (n.includes("printed")) return <CatIconPalette />;
  if (n.includes("designer")) return <CatIconCrown />;
  if (n.includes("gift")) return <CatIconGift />;
  if (n.includes("office")) return <CatIconBriefcase />;
  if (n.includes("needle") || n.includes("ikat") || n.includes("pochampally") || n.includes("bandhani") || n.includes("kalamkari")) return <CatIconNeedle />;
  return <CatIconFabric />;
}

const SAREE_KEYWORDS = [
  "silk", "cotton", "saree", "sari", "banarasi", "banaras",
  "kanjivaram", "kanjeevaram", "handloom", "bridal", "festive",
  "casual", "printed", "designer", "linen", "georgette", "chiffon",
  "tussar", "patola", "zari", "embroidered", "woven", "weave",
  "jacquard", "ikat", "bandhani", "kalamkari", "pochampally",
  "office", "gifting", "occasion", "party",
];

const TESTIMONIALS = [
  {
    name: "Priya Menon",
    location: "Kochi",
    initials: "PM",
    text: "The Kanjivaram I ordered arrived beautifully packed. The zari work is stunning — exactly as shown. I wore it to my cousin's wedding and received so many compliments.",
  },
  {
    name: "Asha Sharma",
    location: "Jaipur",
    initials: "AS",
    text: "I was sceptical about buying a saree online, but the fabric quality of the handloom cotton I chose is exceptional. The colour is rich and the weave is tight. Will definitely order again.",
  },
  {
    name: "Rekha Iyer",
    location: "Bengaluru",
    initials: "RI",
    text: "Ordered a Banarasi for my mother's anniversary. The blouse stitching service was a lifesaver — everything arrived perfectly stitched and ready to wear. Packaging felt truly premium.",
  },
];

function isSareeCategory(name = "") {
  const lower = name.toLowerCase();
  return SAREE_KEYWORDS.some((kw) => lower.includes(kw));
}

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= breakpoint);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener("resize", handler, { passive: true });
    return () => window.removeEventListener("resize", handler);
  }, [breakpoint]);
  return isMobile;
}

function useScrollReveal(deps) {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.10 }
    );
    // Observe all [data-reveal] that haven't been revealed yet
    document.querySelectorAll("[data-reveal]:not(.revealed)").forEach((el) =>
      observer.observe(el)
    );
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

const VISIBLE_CARDS = 4;

function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryProducts, setCategoryProducts] = useState({});
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const autoPlayRef = useRef(null);

  // Re-run observer whenever async data finishes rendering new sections
  useScrollReveal([loading, Object.keys(categoryProducts).length]);

  useEffect(() => {
    fetchProducts();
    fetchCategoriesAndProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/products?limit=12&sort=newest`);
      const data = await response.json();
      const list = Array.isArray(data) ? data : (data.products || []);
      setProducts(list.slice(0, 12));
      setLoading(false);
    } catch (error) {
      console.error("Error fetching products:", error);
      setLoading(false);
    }
  };

  const maxIndex = Math.max(0, products.length - VISIBLE_CARDS);

  const nextSlide = useCallback(() => {
    setCarouselIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  const prevSlide = () => {
    setCarouselIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  const goToSlide = (index) => setCarouselIndex(index);

  useEffect(() => {
    if (isPaused || products.length === 0) return;
    autoPlayRef.current = setInterval(nextSlide, 3500);
    return () => clearInterval(autoPlayRef.current);
  }, [isPaused, nextSlide, products.length]);

  const fetchCategoriesAndProducts = async () => {
    try {
      const cats = await fetchCategories();
      setCategories(cats);
      const response = await fetch(`${API_URL}/api/products?limit=100`);
      const data = await response.json();
      const allProducts = Array.isArray(data) ? data : (data.products || []);
      const grouped = {};
      cats.forEach((cat) => {
        grouped[cat.id] = allProducts
          .filter((p) => p.category_id === cat.id)
          .slice(0, 4);
      });
      setCategoryProducts(grouped);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const sareeCategories = categories.filter((c) => isSareeCategory(c.name));
  const isMobile = useIsMobile();

  return (
    <div className="home-page">
      <SEOHead
        canonical="https://www.krittikasarees.com/"
        schema={HOME_SCHEMA}
      />
      <HomeBanner />

      {/* Featured Sarees */}
      <section className="featured-section" data-reveal>
        <div className="container">
          <div className="section-header">
            <span className="section-tag">✦ Curated For You</span>
            <h2>Featured Sarees</h2>
            <p>Handpicked from our finest weaves — each piece curated for its craft and character</p>
            <Link to="/products" className="view-all-link">
              View All Sarees →
            </Link>
          </div>

          {loading ? (
            <div className="loading">
              <div className="loading-dots">
                <span /><span /><span />
              </div>
            </div>
          ) : isMobile ? (
            <ProductReel products={products} />
          ) : (
            <div
              className="carousel-wrapper"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              <button className="carousel-btn carousel-btn--prev" onClick={prevSlide} aria-label="Previous">‹</button>
              <div className="carousel-viewport">
                <div
                  className="carousel-track"
                  style={{ transform: `translateX(calc(-${carouselIndex} * (100% / ${VISIBLE_CARDS})))` }}
                >
                  {products.map((product) => (
                    <div key={product.id} className="carousel-slide">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              </div>
              <button className="carousel-btn carousel-btn--next" onClick={nextSlide} aria-label="Next">›</button>
              <div className="carousel-dots">
                {Array.from({ length: maxIndex + 1 }, (_, i) => (
                  <button
                    key={i}
                    className={`carousel-dot ${i === carouselIndex ? "active" : ""}`}
                    onClick={() => goToSlide(i)}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Shop by Category */}
      {sareeCategories.length > 0 && (
        <section className="categories-showcase-section" data-reveal>
          <div className="container">
            <div className="section-header">
              <span className="section-tag">✦ Explore</span>
              <h2>Shop by Weave &amp; Style</h2>
              <p>From everyday drapes to heirloom silks — explore by what speaks to you</p>
            </div>
            <div className="categories-grid">
              {sareeCategories.map((category, i) => (
                <Link
                  key={category.id}
                  to={`/products?category=${category.id}`}
                  className="category-card"
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  <div className="category-icon-wrap">
                    <span className="category-icon cat-svg-icon">{getCategoryIcon(category.name)}</span>
                  </div>
                  <div className="category-name">{category.name}</div>
                  <div className="category-count">
                    {categoryProducts[category.id]?.length > 0
                      ? `${categoryProducts[category.id].length}+ sarees`
                      : "Explore"}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Category-wise product rows */}
      {sareeCategories.length > 0 &&
        sareeCategories.map(
          (category) =>
            categoryProducts[category.id]?.length > 0 && (
              <section key={category.id} className="category-products-section" data-reveal>
                <div className="container">
                  <div className="section-header">
                    <span className="section-tag">✦ {category.name}</span>
                    <h2>{category.name}</h2>
                    <p>{category.description || `Our finest ${category.name.toLowerCase()} — woven with care`}</p>
                    <Link to={`/products?category=${category.id}`} className="view-all-link">
                      View All {category.name} →
                    </Link>
                  </div>
                  {isMobile ? (
                    <ProductReel products={categoryProducts[category.id]} />
                  ) : (
                    <div className="products-grid">
                      {categoryProducts[category.id].map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )
        )}

      {/* Testimonials */}
      <section className="testimonials-section" data-reveal>
        <div className="container">
          <div className="section-header">
            <span className="section-tag">✦ Real Reviews</span>
            <h2>What Our Customers Say</h2>
          </div>
          <div className="testimonials-grid">
            {TESTIMONIALS.map((t, i) => (
              <div className="testimonial-card" key={i} style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="stars" aria-label="5 stars">★★★★★</div>
                <p className="testimonial-text">"{t.text}"</p>
                <div className="testimonial-author">
                  <div className="author-avatar-initial">{t.initials}</div>
                  <div>
                    <strong>{t.name}</strong>
                    <small>{t.location} — Verified Buyer</small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Us */}
      <Hero />
    </div>
  );
}

export default Home;
