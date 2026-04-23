import React, { useContext, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { WishlistContext } from "../context/WishlistContext";
import API_URL from "../api_connection/BackendAPIConnection";
import "./ProductCard.css";

/* ── Inline SVG icons ── */
const IconHeart = ({ filled }) => (
  <svg width="17" height="17" viewBox="0 0 24 24"
    fill={filled ? "#ef4444" : "none"}
    stroke={filled ? "#ef4444" : "currentColor"}
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const IconStar = ({ filled }) => (
  <svg width="12" height="12" viewBox="0 0 24 24"
    fill={filled ? "#fbbf24" : "none"}
    stroke={filled ? "#fbbf24" : "#d1d5db"}
    strokeWidth="1.5">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const IconCart = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
);

const IconEye = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const IconPackage = () => (
  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.25 }}>
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);

const ProductCard = ({ product }) => {
  const [ratingStats, setRatingStats] = useState({ total_reviews: 0, average_rating: 0 });

  useEffect(() => {
    fetchRatingStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const fetchRatingStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/reviews/stats/${product.id}`);
      if (response.ok) {
        const data = await response.json();
        setRatingStats(data);
      }
    } catch (err) {
      console.error(`Failed to fetch rating stats for product ${product.id}:`, err);
    }
  };

  const { addToCart } = useContext(CartContext);
  const { isInWishlist, toggleWishlist } = useContext(WishlistContext);

  const displayImage = product?.images && product.images.length > 0
    ? product.images[0].image_url
    : product?.image || null;

  const inWishlist = isInWishlist(product.id);

  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    await toggleWishlist(product);
  };

  return (
    <div className="product-card">
      <Link to={`/product/${product.id}`} className="product-link">
        <div className="product-image-container">
          {displayImage ? (
            <img src={displayImage} alt={product.name} className="product-image" />
          ) : (
            <div className="product-image-placeholder">
              <IconPackage />
            </div>
          )}

          <button
            onClick={handleWishlistToggle}
            className={`wishlist-btn ${inWishlist ? "in-wishlist" : ""}`}
            title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
            aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            <IconHeart filled={inWishlist} />
          </button>

          {product.stock !== undefined && product.stock > 0 && (
            <span className="stock-badge">In Stock</span>
          )}
          {product.stock === 0 && (
            <span className="stock-badge out-of-stock">Out of Stock</span>
          )}
        </div>

        <div className="product-content">
          <h3 className="product-name">{product.name}</h3>

          {product.description && (
            <p className="product-description">
              {product.description.substring(0, 70)}…
            </p>
          )}

          <div className="product-rating">
            <span className="stars">
              {Array(5).fill(0).map((_, i) => (
                <IconStar key={i} filled={i < Math.round(ratingStats.average_rating)} />
              ))}
            </span>
            <span className="reviews-count">
              ({ratingStats.total_reviews} review{ratingStats.total_reviews !== 1 ? "s" : ""})
            </span>
          </div>
        </div>
      </Link>

      <div className="product-footer">
        <div className="product-price-section">
          <span className="product-price">₹{product.price}</span>
          {product.original_price && (
            <span className="product-original-price">₹{product.original_price}</span>
          )}
        </div>
        <div className="product-actions">
          <button
            onClick={() => addToCart(product)}
            disabled={product.stock === 0}
            className={`action-icon-btn add-to-cart-icon ${product.stock === 0 ? "disabled" : ""}`}
            title="Add to Cart"
          >
            <IconCart />
            <span className="action-label">Add to Cart</span>
          </button>
          <Link to={`/product/${product.id}`} className="action-icon-btn view-icon-btn" title="View Details">
            <IconEye />
            <span className="action-label">View</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
