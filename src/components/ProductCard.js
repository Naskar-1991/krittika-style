import React, { useContext, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { WishlistContext } from "../context/WishlistContext";
import API_URL from "../api_connection/BackendAPIConnection";
import "./ProductCard.css";

const ProductCard = ({ product }) => {
  const [ratingStats, setRatingStats] = useState({
    total_reviews: 0,
    average_rating: 0,
  });

  useEffect(() => {
    fetchRatingStats();
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
  
  // Get the first image or use the main image
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
            <img
              src={displayImage}
              alt={product.name}
              className="product-image"
            />
          ) : (
            <div className="product-image-placeholder">
              <span className="placeholder-icon">📦</span>
            </div>
          )}
          
          {/* Wishlist Button */}
          <button
            onClick={handleWishlistToggle}
            className={`wishlist-btn ${inWishlist ? "in-wishlist" : ""}`}
            title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            {inWishlist ? "❤️" : "🤍"}
          </button>

          {product.stock !== undefined && product.stock > 0 && (
            <span className="stock-badge">In Stock</span>
          )}
          {product.stock === 0 && (
            <span className="stock-badge out-of-stock">Out of Stock</span>
          )}
        </div>

        <div className="product-content">
          <h3 className="product-name">
            {product.name}
          </h3>

          {product.description && (
            <p className="product-description">
              {product.description.substring(0, 70)}...
            </p>
          )}

          <div className="product-rating">
            <span className="stars">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <span key={i}>
                    {i < Math.round(ratingStats.average_rating) ? "⭐" : "☆"}
                  </span>
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
            <span className="action-icon">🛒</span>
            <span className="action-label">Add to Cart</span>
          </button>
          <Link to={`/product/${product.id}`} className="action-icon-btn view-icon-btn" title="View Details">
            <span className="action-icon">👁️</span>
            <span className="action-label">View</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
