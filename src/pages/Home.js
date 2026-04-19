import React, { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import HomeBanner from "../components/HomeBanner";
import Hero from "../components/Hero";
import ProductCard from "../components/ProductCard";
import { fetchCategories } from "../services/categoryService";
import "./Home.css";
import API_URL from "../api_connection/BackendAPIConnection";

const CATEGORY_ICONS = {
  "Silk":       "🥻",
  "Cotton":     "🌿",
  "Banarasi":   "✨",
  "Kanjivaram": "🪡",
  "Kanjeevaram":"🪡",
  "Designer":   "💎",
  "Bridal":     "👰",
  "Handloom":   "🧵",
  "Festive":    "🪔",
  "Casual":     "☀️",
  "Printed":    "🎨",
  "Linen":      "🌾",
  "Georgette":  "🌸",
  "Chiffon":    "🌸",
  "Tussar":     "🍂",
  "Patola":     "🔷",
  "Embroidered":"🪢",
  "Zari":       "✦",
  "Office":     "💼",
  "Gifting":    "🎁",
};

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

function getCategoryIcon(name = "") {
  const key = Object.keys(CATEGORY_ICONS).find((k) =>
    name.toLowerCase().includes(k.toLowerCase())
  );
  return key ? CATEGORY_ICONS[key] : "🥻";
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

  return (
    <div className="home-page">
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
                    <span className="category-icon">{getCategoryIcon(category.name)}</span>
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
                  <div className="products-grid">
                    {categoryProducts[category.id].map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
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
