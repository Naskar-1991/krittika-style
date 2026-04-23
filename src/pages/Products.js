import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import CategorySidebar from "../components/CategorySidebar";
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

const IcoFilter  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>;
const IcoSort    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M7 12h10M11 18h2"/></svg>;
const IcoX       = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcoChevron = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>;

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts]       = useState([]);
  const [total, setTotal]             = useState(0);
  const [totalPages, setTotalPages]   = useState(0);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");

  const [searchInput, setSearchInput]       = useState(searchParams.get("search") || "");
  const [sortBy, setSortBy]                 = useState(searchParams.get("sort") || "newest");
  const [minPrice, setMinPrice]             = useState(Number(searchParams.get("minPrice")) || 0);
  const [maxPrice, setMaxPrice]             = useState(Number(searchParams.get("maxPrice")) || 50000);
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") ? parseInt(searchParams.get("category")) : null
  );

  // Mobile filter panel state
  const [showFilters, setShowFilters]   = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const currentPage = parseInt(searchParams.get("page")) || 1;

  useEffect(() => {
    setSearchInput(searchParams.get("search") || "");
    setSortBy(searchParams.get("sort") || "newest");
    setMinPrice(Number(searchParams.get("minPrice")) || 0);
    setMaxPrice(Number(searchParams.get("maxPrice")) || 50000);
    setSelectedCategory(
      searchParams.get("category") ? parseInt(searchParams.get("category")) : null
    );
  }, [searchParams]);

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
    setShowFilters(false);
  };

  const resetFilters = () => {
    setSearchInput("");
    setSortBy("newest");
    setMinPrice(0);
    setMaxPrice(50000);
    setSelectedCategory(null);
    setSearchParams({});
    setShowFilters(false);
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

  const activeFilterCount =
    (searchParams.get("search") ? 1 : 0) +
    (searchParams.get("category") ? 1 : 0) +
    (searchParams.get("minPrice") || searchParams.get("maxPrice") ? 1 : 0);

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label || "Newest First";

  if (loading) {
    return (
      <div className="products-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading sarees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="products-page">
      <div className="container">
        {/* Header */}
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

        {/* ── Mobile filter bar ── */}
        <div className="mobile-filter-bar">
          <button
            className={`mob-filter-btn${showFilters ? " active" : ""}${activeFilterCount > 0 ? " has-badge" : ""}`}
            onClick={() => { setShowFilters(v => !v); setShowSortMenu(false); }}
          >
            <IcoFilter />
            Filters
            {activeFilterCount > 0 && <span className="mob-filter-badge">{activeFilterCount}</span>}
            <span className={`mob-chevron${showFilters ? " up" : ""}`}><IcoChevron /></span>
          </button>

          <div className="mob-sort-wrap">
            <button
              className={`mob-filter-btn${showSortMenu ? " active" : ""}`}
              onClick={() => { setShowSortMenu(v => !v); setShowFilters(false); }}
            >
              <IcoSort />
              <span className="mob-sort-label">{currentSortLabel}</span>
              <span className={`mob-chevron${showSortMenu ? " up" : ""}`}><IcoChevron /></span>
            </button>
            {showSortMenu && (
              <div className="mob-sort-dropdown">
                {SORT_OPTIONS.map(o => (
                  <button
                    key={o.value}
                    className={`mob-sort-option${sortBy === o.value ? " selected" : ""}`}
                    onClick={() => handleSortChange(o.value)}
                  >
                    {o.label}
                    {sortBy === o.value && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {hasActiveFilters && (
            <button className="mob-clear-btn" onClick={resetFilters}>
              <IcoX /> Clear
            </button>
          )}
        </div>

        {/* ── Mobile filter panel ── */}
        {showFilters && (
          <div className="mobile-filter-panel">
            <CategorySidebar
              selectedCategory={selectedCategory}
              onCategorySelect={(catId) => { setSelectedCategory(catId); }}
            />

            <div className="filter-section">
              <h3>Search</h3>
              <input
                type="text"
                placeholder="Search sarees..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                className="search-input"
              />
            </div>

            <div className="filter-section">
              <h3>Price Range</h3>
              <div className="price-filter">
                <label>Min: ₹{minPrice.toLocaleString("en-IN")}</label>
                <input
                  type="range" min="0" max="50000" step="500"
                  value={minPrice}
                  onChange={(e) => { const v = Number(e.target.value); if (v <= maxPrice) setMinPrice(v); }}
                  className="price-slider"
                />
              </div>
              <div className="price-filter">
                <label>Max: ₹{maxPrice.toLocaleString("en-IN")}</label>
                <input
                  type="range" min="0" max="50000" step="500"
                  value={maxPrice}
                  onChange={(e) => { const v = Number(e.target.value); if (v >= minPrice) setMaxPrice(v); }}
                  className="price-slider"
                />
              </div>
            </div>

            <div className="mobile-filter-actions">
              <button onClick={resetFilters} className="reset-filters-btn reset-filters-btn--outline">
                Clear All
              </button>
              <button onClick={applyFilters} className="reset-filters-btn">
                Apply Filters
              </button>
            </div>
          </div>
        )}

        <div className="products-container">
          {/* Sidebar — desktop only */}
          <aside className="products-sidebar">
            <CategorySidebar
              selectedCategory={selectedCategory}
              onCategorySelect={handleCategorySelect}
            />

            <div className="filter-divider" />

            <div className="filter-section">
              <h3>Search</h3>
              <input
                type="text"
                placeholder="Search sarees..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                className="search-input"
              />
            </div>

            <div className="filter-section">
              <h3>Sort By</h3>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="sort-select"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="filter-section">
              <h3>Price Range</h3>
              <div className="price-filter">
                <label>Min: ₹{minPrice.toLocaleString("en-IN")}</label>
                <input
                  type="range" min="0" max="50000" step="500"
                  value={minPrice}
                  onChange={(e) => { const v = Number(e.target.value); if (v <= maxPrice) setMinPrice(v); }}
                  className="price-slider"
                />
              </div>
              <div className="price-filter">
                <label>Max: ₹{maxPrice.toLocaleString("en-IN")}</label>
                <input
                  type="range" min="0" max="50000" step="500"
                  value={maxPrice}
                  onChange={(e) => { const v = Number(e.target.value); if (v >= minPrice) setMaxPrice(v); }}
                  className="price-slider"
                />
              </div>
            </div>

            <button onClick={applyFilters} className="reset-filters-btn" style={{ marginBottom: "8px" }}>
              Apply Filters
            </button>

            {hasActiveFilters && (
              <button onClick={resetFilters} className="reset-filters-btn reset-filters-btn--outline">
                Clear All
              </button>
            )}
          </aside>

          {/* Products + Pagination */}
          <main className="products-main">
            {products.length === 0 ? (
              <div className="no-results">
                <span className="no-results-emoji">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{opacity:0.4}}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </span>
                <p>No sarees found matching your filters.</p>
                <button onClick={resetFilters} className="reset-btn">
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="products-grid">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
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
                        .filter((p) =>
                          p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2
                        )
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
                              className={`page-btn page-num ${item === currentPage ? "active" : ""}`}
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
          </main>
        </div>
      </div>
    </div>
  );
};

export default Products;
