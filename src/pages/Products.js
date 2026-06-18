import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import CategorySidebar from "../components/CategorySidebar";
import SEOHead from "../components/SEOHead";
import "./Products.css";
import API_URL from "../api_connection/BackendAPIConnection";

const ITEMS_PER_PAGE = 12;

const SORT_OPTIONS = [
  { value: "newest",     label: "Newest First" },
  { value: "price-low",  label: "Price: Low → High" },
  { value: "price-high", label: "Price: High → Low" },
  { value: "name_asc",   label: "Name: A → Z" },
  { value: "name_desc",  label: "Name: Z → A" },
];

const IcoSearch  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IcoSort    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M7 12h10M11 18h2"/></svg>;
const IcoX       = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcoChevron = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>;

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts]     = useState([]);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");

  const [searchInput, setSearchInput]   = useState(searchParams.get("search") || "");
  const [sortBy, setSortBy]             = useState(searchParams.get("sort") || "newest");
  const [minPrice, setMinPrice]         = useState(Number(searchParams.get("minPrice")) || 0);
  const [maxPrice, setMaxPrice]         = useState(Number(searchParams.get("maxPrice")) || 50000);
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") ? parseInt(searchParams.get("category")) : null
  );

  const [showSortMenu,  setShowSortMenu]  = useState(false);
  const [showPriceMenu, setShowPriceMenu] = useState(false);

  const sortMenuRef  = useRef(null);
  const priceMenuRef = useRef(null);

  const currentPage = parseInt(searchParams.get("page")) || 1;

  // Sync local state when URL changes (e.g. back/forward nav)
  useEffect(() => {
    setSearchInput(searchParams.get("search") || "");
    setSortBy(searchParams.get("sort") || "newest");
    setMinPrice(Number(searchParams.get("minPrice")) || 0);
    setMaxPrice(Number(searchParams.get("maxPrice")) || 50000);
    setSelectedCategory(
      searchParams.get("category") ? parseInt(searchParams.get("category")) : null
    );
  }, [searchParams]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (sortMenuRef.current  && !sortMenuRef.current.contains(e.target))  setShowSortMenu(false);
      if (priceMenuRef.current && !priceMenuRef.current.contains(e.target)) setShowPriceMenu(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams(searchParams);
      if (!params.get("page")) params.set("page", "1");
      params.set("limit", ITEMS_PER_PAGE);

      const res = await fetch(`${API_URL}/api/products?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();

      if (Array.isArray(data)) {
        setProducts(data);
        setTotal(data.length);
        setTotalPages(1);
      } else {
        setProducts(data.products || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchProducts();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [fetchProducts]);

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (searchInput.trim())  params.set("search", searchInput.trim());
    if (selectedCategory)    params.set("category", selectedCategory);
    if (sortBy !== "newest") params.set("sort", sortBy);
    if (minPrice > 0)        params.set("minPrice", minPrice);
    if (maxPrice < 50000)    params.set("maxPrice", maxPrice);
    params.set("page", "1");
    setSearchParams(params);
  };

  const resetFilters = () => {
    setSearchInput("");
    setSortBy("newest");
    setMinPrice(0);
    setMaxPrice(50000);
    setSelectedCategory(null);
    setSearchParams({});
    setShowSortMenu(false);
    setShowPriceMenu(false);
  };

  const handleCategorySelect = (catId) => {
    setSelectedCategory(catId);
    const params = new URLSearchParams(searchParams);
    if (catId) params.set("category", catId);
    else params.delete("category");
    params.set("page", "1");
    setSearchParams(params);
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    const params = new URLSearchParams(searchParams);
    if (value !== "newest") params.set("sort", value);
    else params.delete("sort");
    params.set("page", "1");
    setSearchParams(params);
    setShowSortMenu(false);
  };

  const goToPage = (page) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page);
    setSearchParams(params);
  };

  const hasActiveFilters =
    searchParams.get("search") ||
    searchParams.get("category") ||
    searchParams.get("minPrice") ||
    searchParams.get("maxPrice");

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label || "Newest First";

  const priceIsFiltered =
    searchParams.get("minPrice") || searchParams.get("maxPrice");

  const priceLabel = priceIsFiltered
    ? `₹${Number(searchParams.get("minPrice") || 0).toLocaleString("en-IN")} – ₹${Number(searchParams.get("maxPrice") || 50000).toLocaleString("en-IN")}`
    : "Price";

  if (loading) {
    return (
      <div className="products-page">
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading sarees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="products-page">
      <SEOHead
        title="Shop All Sarees"
        description="Browse our full collection of handwoven Indian sarees — Banarasi silk, Kanjivaram, Handloom cotton, Tussar, Georgette and more. Free delivery across India."
        canonical="https://www.krittikasarees.com/products"
        schema={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "All Sarees — Krittika Style",
          "description": "Browse handwoven Indian sarees by category, price and fabric.",
          "url": "https://www.krittikasarees.com/products",
          "isPartOf": { "@type": "WebSite", "url": "https://www.krittikasarees.com" }
        }}
      />
      <div className="container">

        {/* ── Page header ── */}
        <div className="products-header">
          <div>
            <h1>All Sarees</h1>
            <p>
              {hasActiveFilters
                ? `${total} saree${total !== 1 ? "s" : ""} found`
                : "Our complete handwoven collection"}
            </p>
          </div>
          <div className="product-count">
            {total} saree{total !== 1 ? "s" : ""}
            {totalPages > 1 && ` · Page ${currentPage} of ${totalPages}`}
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* ══════════════════════════════════════════
            Top Filter Bar
        ══════════════════════════════════════════ */}
        <div className="filter-topbar">

          {/* Search */}
          <div className="ftb-search">
            <span className="ftb-search-icon"><IcoSearch /></span>
            <input
              type="text"
              placeholder="Search sarees..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              className="ftb-search-input"
            />
            {searchInput && (
              <button className="ftb-search-clear" onClick={() => setSearchInput("")} aria-label="Clear search">
                <IcoX />
              </button>
            )}
          </div>

          {/* Category */}
          <CategorySidebar
            selectedCategory={selectedCategory}
            onCategorySelect={handleCategorySelect}
          />

          {/* Sort */}
          <div className="ftb-chip-wrap" ref={sortMenuRef}>
            <button
              className={`ftb-chip${showSortMenu ? " ftb-chip--open" : ""}${sortBy !== "newest" ? " ftb-chip--active" : ""}`}
              onClick={() => { setShowSortMenu(v => !v); setShowPriceMenu(false); }}
            >
              <IcoSort />
              <span className="ftb-chip-label">{currentSortLabel}</span>
              <span className={`ftb-chevron${showSortMenu ? " up" : ""}`}><IcoChevron /></span>
            </button>
            {showSortMenu && (
              <div className="ftb-menu">
                {SORT_OPTIONS.map(o => (
                  <button
                    key={o.value}
                    className={`ftb-menu-item${sortBy === o.value ? " selected" : ""}`}
                    onClick={() => handleSortChange(o.value)}
                  >
                    {o.label}
                    {sortBy === o.value && (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Price Range */}
          <div className="ftb-chip-wrap" ref={priceMenuRef}>
            <button
              className={`ftb-chip${showPriceMenu ? " ftb-chip--open" : ""}${priceIsFiltered ? " ftb-chip--active" : ""}`}
              onClick={() => { setShowPriceMenu(v => !v); setShowSortMenu(false); }}
            >
              <span className="ftb-chip-label">{priceLabel}</span>
              <span className={`ftb-chevron${showPriceMenu ? " up" : ""}`}><IcoChevron /></span>
            </button>
            {showPriceMenu && (
              <div className="ftb-price-panel">
                <p className="ftb-price-heading">Price Range</p>

                <div className="pr-fields">
                  <label className="pr-field">
                    <span className="pr-field-label">Min</span>
                    <span className="pr-field-prefix">₹</span>
                    <input
                      type="number"
                      className="pr-field-input"
                      value={minPrice}
                      min={0} max={49500} step={500}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (!isNaN(v)) setMinPrice(Math.max(0, Math.min(v, maxPrice - 500)));
                      }}
                    />
                  </label>
                  <span className="pr-field-sep">—</span>
                  <label className="pr-field">
                    <span className="pr-field-label">Max</span>
                    <span className="pr-field-prefix">₹</span>
                    <input
                      type="number"
                      className="pr-field-input"
                      value={maxPrice}
                      min={500} max={50000} step={500}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (!isNaN(v)) setMaxPrice(Math.min(50000, Math.max(v, minPrice + 500)));
                      }}
                    />
                  </label>
                </div>

                <div className="pr-slider-wrap">
                  <div className="pr-track-bg">
                    <div
                      className="pr-track-fill"
                      style={{
                        left:  `${(minPrice / 50000) * 100}%`,
                        width: `${((maxPrice - minPrice) / 50000) * 100}%`,
                      }}
                    />
                  </div>
                  <input
                    type="range" min="0" max="50000" step="500"
                    value={minPrice}
                    onChange={(e) => { const v = Number(e.target.value); if (v < maxPrice) setMinPrice(v); }}
                    className={`pr-range pr-range-min${minPrice >= maxPrice - 2000 ? " pr-range-top" : ""}`}
                  />
                  <input
                    type="range" min="0" max="50000" step="500"
                    value={maxPrice}
                    onChange={(e) => { const v = Number(e.target.value); if (v > minPrice) setMaxPrice(v); }}
                    className="pr-range pr-range-max"
                  />
                </div>
                <div className="pr-ends"><span>₹0</span><span>₹50,000</span></div>

                <div className="ftb-price-actions">
                  <button
                    onClick={() => { setMinPrice(0); setMaxPrice(50000); }}
                    className="ftb-price-reset"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => { applyFilters(); setShowPriceMenu(false); }}
                    className="ftb-price-apply"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Spacer pushes Clear All to the right */}
          <div className="ftb-spacer" />

          {/* Apply search / price */}
          <button onClick={applyFilters} className="ftb-apply-btn">
            Apply
          </button>

          {hasActiveFilters && (
            <button onClick={resetFilters} className="ftb-clear-all">
              <IcoX /> Clear All
            </button>
          )}
        </div>

        {/* ══════════════════════════════════════════
            Products + Pagination — full width
        ══════════════════════════════════════════ */}
        <div className="products-main">
          {products.length === 0 ? (
            <div className="no-results">
              <span className="no-results-emoji">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </span>
              <p>No sarees found matching your filters.</p>
              <button onClick={resetFilters} className="reset-btn">Clear Filters</button>
            </div>
          ) : (
            <>
              <div className="products-grid">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="page-btn"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    ← Prev
                  </button>

                  <div className="page-numbers">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                      .reduce((acc, p, idx, arr) => {
                        if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((item, idx) =>
                        item === "..." ? (
                          <span key={`ellipsis-${idx}`} className="page-ellipsis">…</span>
                        ) : (
                          <button
                            key={item}
                            className={`page-btn page-num${item === currentPage ? " active" : ""}`}
                            onClick={() => goToPage(item)}
                          >
                            {item}
                          </button>
                        )
                      )}
                  </div>

                  <button
                    className="page-btn"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default Products;
