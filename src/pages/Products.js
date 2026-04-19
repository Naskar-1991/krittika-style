import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import ProductReel from "../components/ProductReel";
import CategorySidebar from "../components/CategorySidebar";
import "./Products.css";
import API_URL from "../api_connection/BackendAPIConnection";

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= breakpoint);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener("resize", handler, { passive: true });
    return () => window.removeEventListener("resize", handler);
  }, [breakpoint]);
  return isMobile;
}

const ITEMS_PER_PAGE = 12;

const SORT_OPTIONS = [
  { value: "newest",     label: "Newest First" },
  { value: "price-low",  label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "name_asc",   label: "Name: A → Z" },
  { value: "name_desc",  label: "Name: Z → A" },
];

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Server data
  const [products, setProducts]       = useState([]);
  const [total, setTotal]             = useState(0);
  const [totalPages, setTotalPages]   = useState(0);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");

  // Local filter state (controls the sidebar inputs)
  const [searchInput, setSearchInput]       = useState(searchParams.get("search") || "");
  const [sortBy, setSortBy]                 = useState(searchParams.get("sort") || "newest");
  const [minPrice, setMinPrice]             = useState(Number(searchParams.get("minPrice")) || 0);
  const [maxPrice, setMaxPrice]             = useState(Number(searchParams.get("maxPrice")) || 50000);
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") ? parseInt(searchParams.get("category")) : null
  );

  const currentPage = parseInt(searchParams.get("page")) || 1;

  // Sync local inputs when URL params change externally (nav clicks, back button)
  useEffect(() => {
    setSearchInput(searchParams.get("search") || "");
    setSortBy(searchParams.get("sort") || "newest");
    setMinPrice(Number(searchParams.get("minPrice")) || 0);
    setMaxPrice(Number(searchParams.get("maxPrice")) || 50000);
    setSelectedCategory(
      searchParams.get("category") ? parseInt(searchParams.get("category")) : null
    );
  }, [searchParams]);

  // Fetch from backend whenever URL params change
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

      // Handle both paginated response and legacy array response
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

  // Apply sidebar filters → update URL params → triggers fetch
  const applyFilters = () => {
    const params = new URLSearchParams();
    if (searchInput.trim())    params.set("search", searchInput.trim());
    if (selectedCategory)      params.set("category", selectedCategory);
    if (sortBy !== "newest")   params.set("sort", sortBy);
    if (minPrice > 0)          params.set("minPrice", minPrice);
    if (maxPrice < 50000)      params.set("maxPrice", maxPrice);
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
  };

  // Category immediate-apply (no need to click Apply)
  const handleCategorySelect = (catId) => {
    setSelectedCategory(catId);
    const params = new URLSearchParams(searchParams);
    if (catId) params.set("category", catId);
    else params.delete("category");
    params.set("page", "1");
    setSearchParams(params);
  };

  // Sort immediate-apply
  const handleSortChange = (value) => {
    setSortBy(value);
    const params = new URLSearchParams(searchParams);
    if (value !== "newest") params.set("sort", value);
    else params.delete("sort");
    params.set("page", "1");
    setSearchParams(params);
  };

  const goToPage = (page) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page);
    setSearchParams(params);
  };

  const isMobile = useIsMobile();

  const hasActiveFilters =
    searchParams.get("search") ||
    searchParams.get("category") ||
    searchParams.get("minPrice") ||
    searchParams.get("maxPrice");

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

        <div className="products-container">
          {/* Sidebar */}
          <aside className="products-sidebar">
            {/* Category */}
            <CategorySidebar
              selectedCategory={selectedCategory}
              onCategorySelect={handleCategorySelect}
            />

            <div className="filter-divider" />

            {/* Search */}
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

            {/* Sort */}
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

            {/* Price */}
            <div className="filter-section">
              <h3>Price Range</h3>
              <div className="price-filter">
                <label>Min: ₹{minPrice.toLocaleString("en-IN")}</label>
                <input
                  type="range"
                  min="0"
                  max="50000"
                  step="500"
                  value={minPrice}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (v <= maxPrice) setMinPrice(v);
                  }}
                  className="price-slider"
                />
              </div>
              <div className="price-filter">
                <label>Max: ₹{maxPrice.toLocaleString("en-IN")}</label>
                <input
                  type="range"
                  min="0"
                  max="50000"
                  step="500"
                  value={maxPrice}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (v >= minPrice) setMaxPrice(v);
                  }}
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
                <span className="no-results-emoji">🔍</span>
                <p>No sarees found matching your filters.</p>
                <button onClick={resetFilters} className="reset-btn">
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                {isMobile ? (
                  <ProductReel products={products} />
                ) : (
                  <div className="products-grid">
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                )}

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
                          p === 1 ||
                          p === totalPages ||
                          Math.abs(p - currentPage) <= 2
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
