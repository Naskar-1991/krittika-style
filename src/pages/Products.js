import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import CategorySidebar from "../components/CategorySidebar";
import "./Products.css";
import API_URL from "../api_connection/BackendAPIConnection";

const Products = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("popular");
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    // Update search term and category when URL params change
    const urlSearch = searchParams.get("search") || "";
    const urlCategory = searchParams.get("category") ? parseInt(searchParams.get("category")) : null;
    setSearchTerm(urlSearch);
    setSelectedCategory(urlCategory);
  }, [searchParams]);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, sortBy, searchTerm, priceRange, selectedCategory]);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/products`);
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      setProducts(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const filterAndSortProducts = () => {
    let result = [...products];

    // Category filter
    if (selectedCategory) {
      result = result.filter(p => p.category_id === selectedCategory);
    }

    // Search filter
    if (searchTerm) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Price filter
    result = result.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    // Sorting
    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "newest":
        result.sort((a, b) => (b.id || 0) - (a.id || 0));
        break;
      case "popular":
      default:
        break;
    }

    setFilteredProducts(result);
  };

  if (loading) {
    return (
      <div className="products-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading products...</p>
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
            <h1>Our Products</h1>
            <p>Discover our amazing collection of quality products</p>
          </div>
          <div className="product-count">
            Showing {filteredProducts.length} of {products.length} products
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            <strong>Error:</strong> {error}
          </div>
        )}

        {products.length === 0 ? (
          <div className="no-products">
            <span className="no-products-emoji">📦</span>
            <p>No products available at the moment.</p>
          </div>
        ) : (
          <div className="products-container">
            {/* Sidebar with Categories and Filters */}
            <aside className="products-sidebar">
              <CategorySidebar
                selectedCategory={selectedCategory}
                onCategorySelect={setSelectedCategory}
              />

              <div className="filter-divider"></div>

              <div className="filter-section">
                <h3>Search</h3>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>

              <div className="filter-section">
                <h3>Sort By</h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sort-select"
                >
                  <option value="popular">Most Popular</option>
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>

              <div className="filter-section">
                <h3>Price Range</h3>
                <div className="price-filter">
                  <label>Min: ₹{priceRange[0]}</label>
                  <input
                    type="range"
                    min="0"
                    max="100000"
                    step="1000"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                    className="price-slider"
                  />
                </div>
                <div className="price-filter">
                  <label>Max: ₹{priceRange[1]}</label>
                  <input
                    type="range"
                    min="0"
                    max="100000"
                    step="1000"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    className="price-slider"
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  setSearchTerm("");
                  setSortBy("popular");
                  setPriceRange([0, 100000]);
                  setSelectedCategory(null);
                }}
                className="reset-filters-btn"
              >
                Reset Filters
              </button>
            </aside>

            {/* Products Grid */}
            <main className="products-main">
              {filteredProducts.length === 0 ? (
                <div className="no-results">
                  <span className="no-results-emoji">🔍</span>
                  <p>No products found matching your search.</p>
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setSortBy("popular");
                      setPriceRange([0, 100000]);
                      setSelectedCategory(null);
                    }}
                    className="reset-btn"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className="products-grid">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
