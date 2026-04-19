import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { WishlistContext } from "../context/WishlistContext";
import { AuthContext } from "../context/AuthContext";
import "./ProductDetails.css";
import API_URL from "../api_connection/BackendAPIConnection";
import ReviewForm from "../components/ReviewForm";
import ReviewsList from "../components/ReviewsList";
import RatingSummary from "../components/RatingSummary";

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useContext(CartContext);
  const { isInWishlist, toggleWishlist } = useContext(WishlistContext);
  const { user } = useContext(AuthContext);
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [wishlistMessage, setWishlistMessage] = useState("");
  const [refreshReviews, setRefreshReviews] = useState(0);
  const [ratingStats, setRatingStats] = useState({
    total_reviews: 0,
    average_rating: 0,
  });

  useEffect(() => {
    fetchProductDetails();
    fetchRatingStats();
    window.scrollTo(0, 0);
  }, [id]);

  const fetchRatingStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/reviews/stats/${id}`);
      if (response.ok) {
        const data = await response.json();
        setRatingStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch rating stats:", err);
    }
  };

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/products/${id}`);
      if (!response.ok) throw new Error("Product not found");
      
      const data = await response.json();
      setProduct(data);
      
      // Fetch related products (same category)
      const categoryParam = data.category_id ? `&category=${data.category_id}` : "";
      const relatedRes = await fetch(`${API_URL}/api/products?limit=5${categoryParam}`);
      if (relatedRes.ok) {
        const relatedData = await relatedRes.json();
        const list = Array.isArray(relatedData) ? relatedData : (relatedData.products || []);
        setRelatedProducts(list.filter(p => p.id !== parseInt(id)).slice(0, 4));
      }
      
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      for (let i = 0; i < quantity; i++) {
        addToCart(product);
      }
      setQuantity(1);
    }
  };

  const handleQuantityChange = (value) => {
    const newQuantity = Math.max(1, Math.min(product.stock || 100, value));
    setQuantity(newQuantity);
  };

  const handleWishlistToggle = async () => {
    // Check if user is logged in
    if (!user) {
      // Redirect to login if not logged in
      navigate("/login", { state: { from: location.pathname } });
      return;
    }

    try {
      setWishlistMessage("");
      const wasInWishlist = isInWishlist(product.id);
      const success = await toggleWishlist(product);
      
      if (success) {
        const message = wasInWishlist 
          ? "Removed from wishlist!" 
          : "Added to wishlist!";
        setWishlistMessage(message);
        // Clear message after 3 seconds
        setTimeout(() => setWishlistMessage(""), 3000);
      }
    } catch (err) {
      console.error("Error toggling wishlist:", err);
      setWishlistMessage("Failed to update wishlist");
      setTimeout(() => setWishlistMessage(""), 3000);
    }
  };

  // Get current image
  const currentImage = product?.images && product.images[selectedImageIndex]
    ? product.images[selectedImageIndex].image_url
    : product?.image || null;

  if (loading) {
    return (
      <div className="product-details-page">
        <div className="container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading product details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-details-page">
        <div className="container">
          <div className="error-state">
            <h2>Product Not Found</h2>
            <p>{error || "The product you're looking for doesn't exist."}</p>
            <button onClick={() => navigate("/products")} className="btn-back">
              ← Back to Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="product-details-page">
      <div className="container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <button onClick={() => navigate("/products")} className="breadcrumb-link">
            Products
          </button>
          <span className="separator">›</span>
          <span className="current">{product.name}</span>
        </div>

        {/* Product Details Section */}
        <div className="product-details-container">
          <div className="product-gallery">
            {/* Main Image */}
            <div className="main-image">
              {currentImage ? (
                <img src={currentImage} alt={product.name} />
              ) : (
                <div className="image-placeholder">
                  <span>📦</span>
                </div>
              )}
              {product.stock === 0 && (
                <div className="out-of-stock-overlay">Out of Stock</div>
              )}
              {/* Wishlist Icon Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleWishlistToggle();
                }}
                className={`wishlist-icon-btn ${isInWishlist(product.id) ? "in-wishlist" : ""}`}
                title={isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
              >
                {isInWishlist(product.id) ? "❤️" : "🤍"}
              </button>
            </div>

            {/* Thumbnail Gallery */}
            {product?.images && product.images.length > 1 && (
              <div className="thumbnail-gallery">
                {product.images.map((image, index) => (
                  <div
                    key={image.id}
                    className={`thumbnail ${index === selectedImageIndex ? 'active' : ''}`}
                    onClick={() => setSelectedImageIndex(index)}
                    title={`Image ${index + 1}`}
                  >
                    <img src={image.image_url} alt={`${product.name} ${index + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="product-info-section">
            {/* Header */}
            <div className="product-header">
              <h1>{product.name}</h1>
              <div className="product-rating-section">
                <span className="stars">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <span key={i}>
                        {i < Math.round(ratingStats.average_rating) ? "⭐" : "☆"}
                      </span>
                    ))}
                </span>
                <span className="rating-text">
                  ({ratingStats.total_reviews} customer review{ratingStats.total_reviews !== 1 ? "s" : ""})
                </span>
              </div>
            </div>

            {/* Price Section */}
            <div className="price-section">
              <span className="current-price">₹{product.price}</span>
              {product.original_price && (
                <>
                  <span className="original-price">₹{product.original_price}</span>
                  <span className="discount-percent">
                    {Math.round(((product.original_price - product.price) / product.original_price) * 100)}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Stock Status */}
            <div className="stock-section">
              <span className={`stock-status ${product.stock > 0 ? "in-stock" : "out-of-stock"}`}>
                {product.stock > 0 ? `✓ ${product.stock} in stock` : "Out of stock"}
              </span>
            </div>

            {/* Quick Description */}
            {product.description && (
              <p className="quick-description">{product.description}</p>
            )}

            {/* Quantity Selector */}
            <div className="quantity-selector">
              <label>Quantity:</label>
              <div className="quantity-controls">
                <button
                  onClick={() => handleQuantityChange(quantity - 1)}
                  className="qty-btn"
                >
                  −
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                  min="1"
                  max={product.stock || 100}
                  className="qty-input"
                />
                <button
                  onClick={() => handleQuantityChange(quantity + 1)}
                  className="qty-btn"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className={`btn-add-to-cart ${product.stock === 0 ? "disabled" : ""}`}
              >
                🛒 Add to Cart
              </button>
              <button 
                onClick={handleWishlistToggle}
                className={`btn-wishlist ${isInWishlist(product.id) ? "in-wishlist" : ""}`}
              >
                {isInWishlist(product.id) ? "❤️" : "🤍"} 
                {isInWishlist(product.id) ? "Remove from Wishlist" : "Add to Wishlist"}
              </button>
              {wishlistMessage && (
                <span className="wishlist-message">{wishlistMessage}</span>
              )}
            </div>

            {/* Shipping Info */}
            <div className="shipping-info">
              <div className="info-item">
                <span className="icon">🚚</span>
                <span>Free shipping on orders above ₹500</span>
              </div>
              <div className="info-item">
                <span className="icon">🔒</span>
                <span>Secure and encrypted payments</span>
              </div>
              <div className="info-item">
                <span className="icon">↩️</span>
                <span>Easy returns within 30 days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="tabs-section">
          <div className="tabs-header">
            <button
              className={`tab-btn ${activeTab === "description" ? "active" : ""}`}
              onClick={() => setActiveTab("description")}
            >
              Description
            </button>
            <button
              className={`tab-btn ${activeTab === "reviews" ? "active" : ""}`}
              onClick={() => setActiveTab("reviews")}
            >
              Reviews
            </button>
            <button
              className={`tab-btn ${activeTab === "specifications" ? "active" : ""}`}
              onClick={() => setActiveTab("specifications")}
            >
              Specifications
            </button>
          </div>

          <div className="tabs-content">
            {activeTab === "description" && (
              <div className="tab-content description-tab">
                <h3>Product Description</h3>
                <p>{product.description || "No detailed description available."}</p>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="tab-content reviews-tab">
                <RatingSummary productId={id} key={`rating-${refreshReviews}`} />
                <ReviewForm
                  productId={parseInt(id)}
                  onReviewSubmitted={() => {
                    setRefreshReviews(refreshReviews + 1);
                    fetchRatingStats();
                  }}
                  isLoggedIn={!!user}
                />
                <ReviewsList productId={parseInt(id)} refreshTrigger={refreshReviews} />
              </div>
            )}

            {activeTab === "specifications" && (
              <div className="tab-content specs-tab">
                <h3>Specifications</h3>
                <div className="specs-grid">
                  <div className="spec-item">
                    <span className="spec-label">Product ID:</span>
                    <span className="spec-value">{product.id}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">SKU:</span>
                    <span className="spec-value">{product.sku || "N/A"}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Stock:</span>
                    <span className="spec-value">{product.stock || "Available"}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Status:</span>
                    <span className="spec-value">{product.stock > 0 ? "Active" : "Out of Stock"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="related-products">
            <h2>Related Products</h2>
            <div className="related-products-grid">
              {relatedProducts.map((relatedProduct) => {
                // Get first image from images array or fall back to image field
                const displayImage = relatedProduct?.images && relatedProduct.images.length > 0
                  ? relatedProduct.images[0].image_url
                  : relatedProduct?.image || null;
                
                return (
                  <div key={relatedProduct.id} className="related-product-card">
                    <div className="related-product-image">
                      {displayImage ? (
                        <img src={displayImage} alt={relatedProduct.name} />
                      ) : (
                        <div className="image-placeholder">
                          <span>📦</span>
                        </div>
                      )}
                    </div>
                    <h4>{relatedProduct.name}</h4>
                    <p className="related-price">₹{relatedProduct.price}</p>
                    <button
                      onClick={() => navigate(`/product/${relatedProduct.id}`)}
                      className="btn-view-details"
                    >
                      View Details
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductDetails;
