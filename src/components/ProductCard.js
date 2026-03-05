import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import "./ProductCard.css";

const ProductCard = ({ product }) => {
  const { addToCart } = useContext(CartContext);
  
  // Get the first image or use the main image
  const displayImage = product?.images && product.images.length > 0
    ? product.images[0].image_url
    : product?.image || null;

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
            <span className="stars">⭐⭐⭐⭐⭐</span>
            <span className="reviews-count">(127 reviews)</span>
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
            className={`add-to-cart-btn ${product.stock === 0 ? "disabled" : ""}`}
          >
            {product.stock === 0 ? "Out of Stock" : "🛒 Add to Cart"}
          </button>
          <Link to={`/product/${product.id}`} className="view-details-btn">
            👁️ View
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
