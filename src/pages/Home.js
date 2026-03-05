import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Hero from "../components/Hero";
import ProductCard from "../components/ProductCard";
import { fetchCategories } from "../services/categoryService";
import "./Home.css";

function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryProducts, setCategoryProducts] = useState({});

  useEffect(() => {
    fetchProducts();
    fetchCategoriesAndProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch("http://localhost:5500/api/products");
      const data = await response.json();
      setProducts(data.slice(0, 8)); // Show top 8 products
      setLoading(false);
    } catch (error) {
      console.error("Error fetching products:", error);
      setLoading(false);
    }
  };

  const fetchCategoriesAndProducts = async () => {
    try {
      const cats = await fetchCategories();
      setCategories(cats);

      // Fetch all products to show category-wise items
      const response = await fetch("http://localhost:5500/api/products");
      const allProducts = await response.json();

      // Group products by category
      const grouped = {};
      cats.forEach((cat) => {
        grouped[cat.id] = allProducts
          .filter((p) => p.category_id === cat.id)
          .slice(0, 4); // Show 4 products per category
      });
      setCategoryProducts(grouped);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <Hero />

      {/* Featured Products Section */}
      <section className="featured-section">
        <div className="container">
          <div className="section-header">
            <h2>Featured Products</h2>
            <p>Check out our best-selling items</p>
            <Link to="/products" className="view-all-link">
              View All Products →
            </Link>
          </div>

          {loading ? (
            <div className="loading">
              <p>Loading products...</p>
            </div>
          ) : (
            <div className="products-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="categories-showcase-section">
          <div className="container">
            <div className="section-header">
              <h2>Shop by Category</h2>
              <p>Explore our diverse range of products</p>
            </div>

            <div className="categories-grid">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/products?category=${category.id}`}
                  className="category-card"
                >
                  <div className="category-icon">📦</div>
                  <div className="category-name">{category.name}</div>
                  <div className="category-count">
                    {categoryProducts[category.id]?.length || 0} products
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Category Products Section */}
      {categories.length > 0 &&
        categories.map((category) => (
          categoryProducts[category.id]?.length > 0 && (
            <section key={category.id} className="category-products-section">
              <div className="container">
                <div className="section-header">
                  <h2>{category.name}</h2>
                  <p>{category.description}</p>
                  <Link
                    to={`/products?category=${category.id}`}
                    className="view-all-link"
                  >
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
        ))}

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="container">
          <h2 className="section-title">What Customers Say</h2>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="stars">⭐⭐⭐⭐⭐</div>
              <p className="testimonial-text">
                "Amazing quality products and fast shipping! Highly recommend KrittikaStyle to everyone."
              </p>
              <div className="testimonial-author">
                <span className="author-avatar">👩</span>
                <div>
                  <strong>Sarah Johnson</strong>
                  <small>Verified Buyer</small>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="stars">⭐⭐⭐⭐⭐</div>
              <p className="testimonial-text">
                "Great customer service and the products are worth every penny. Will definitely buy again!"
              </p>
              <div className="testimonial-author">
                <span className="author-avatar">👨</span>
                <div>
                  <strong>Michael Chen</strong>
                  <small>Verified Buyer</small>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="stars">⭐⭐⭐⭐⭐</div>
              <p className="testimonial-text">
                "Perfect! Exceeded my expectations. The packaging was excellent and product came on time."
              </p>
              <div className="testimonial-author">
                <span className="author-avatar">👩‍🦰</span>
                <div>
                  <strong>Emily Rodriguez</strong>
                  <small>Verified Buyer</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Special Offer Section */}
      <section className="special-offer-section">
        <div className="container">
          <div className="offer-content">
            <h2>Special Offer This Month!</h2>
            <p>Get up to 40% off on selected items</p>
            <div className="offer-badges">
              <span className="badge">💳 Free Shipping</span>
              <span className="badge">🎁 Free Gift with Purchase</span>
              <span className="badge">🔄 Easy Returns</span>
            </div>
            <Link to="/products" className="cta-button">
              Shop Now and Save
            </Link>
          </div>
          <div className="offer-image">
            <span className="offer-emoji">🎉</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
