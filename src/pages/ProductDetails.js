import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { WishlistContext } from "../context/WishlistContext";
import { AuthContext } from "../context/AuthContext";
import SEOHead from "../components/SEOHead";
import "./ProductDetails.css";
import API_URL from "../api_connection/BackendAPIConnection";
import ReviewForm from "../components/ReviewForm";
import ReviewsList from "../components/ReviewsList";
import RatingSummary from "../components/RatingSummary";

const SITE_URL = "https://www.krittikasarees.com";

function buildProductSchema(product, currentImage) {
  const priceINR = Number(product.price);
  const images = product.images && product.images.length > 0
    ? product.images.map(i => i.image_url)
    : (currentImage ? [currentImage] : []);

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description || `${product.name} — handwoven saree by Krittika Style.`,
    "image": images,
    "brand": { "@type": "Brand", "name": "Krittika Style" },
    "offers": {
      "@type": "Offer",
      "url": `${SITE_URL}/product/${product.id}`,
      "priceCurrency": "INR",
      "price": priceINR.toFixed(2),
      "availability": product.stock > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      "seller": { "@type": "Organization", "name": "Krittika Style" },
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": "0",
          "currency": "INR"
        },
        "shippingDestination": {
          "@type": "DefinedRegion",
          "addressCountry": "IN"
        }
      }
    }
  };

  if (product.sku) schema.sku = product.sku;
  if (product.category) schema.category = product.category;

  return schema;
}

function buildBreadcrumbSchema(product) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home",    "item": SITE_URL },
      { "@type": "ListItem", "position": 2, "name": "Sarees",  "item": `${SITE_URL}/products` },
      { "@type": "ListItem", "position": 3, "name": product.name, "item": `${SITE_URL}/product/${product.id}` }
    ]
  };
}

/* ── Inline SVG icons ── */
const IconHeart = ({ filled }) => (
  <svg width="20" height="20" viewBox="0 0 24 24"
    fill={filled ? "#ef4444" : "none"}
    stroke={filled ? "#ef4444" : "currentColor"}
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const IconStar = ({ filled }) => (
  <svg width="16" height="16" viewBox="0 0 24 24"
    fill={filled ? "#fbbf24" : "none"}
    stroke={filled ? "#fbbf24" : "#d1d5db"}
    strokeWidth="1.5">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const IconCart = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
);

const IconTruck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13"/>
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
    <circle cx="5.5" cy="18.5" r="2.5"/>
    <circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
);

const IconLock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const IconRefresh = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);

const IconPackage = () => (
  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.2 }}>
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const productDesc = product.description
    ? product.description.slice(0, 155)
    : `Shop ${product.name} — handwoven saree by Krittika Style. Free delivery across India.`;

  return (
    <div className="product-details-page">
      <SEOHead
        title={product.name}
        description={productDesc}
        canonical={`${SITE_URL}/product/${product.id}`}
        image={currentImage || undefined}
        type="product"
        schema={[
          buildProductSchema(product, currentImage),
          buildBreadcrumbSchema(product),
        ]}
      />
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
                  <IconPackage />
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
                aria-label={isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
              >
                <IconHeart filled={isInWishlist(product.id)} />
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
                      <IconStar key={i} filled={i < Math.round(ratingStats.average_rating)} />
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
                <IconCart /> Add to Cart
              </button>
              <button 
                onClick={handleWishlistToggle}
                className={`btn-wishlist ${isInWishlist(product.id) ? "in-wishlist" : ""}`}
              >
                <IconHeart filled={isInWishlist(product.id)} />
                {isInWishlist(product.id) ? "Remove from Wishlist" : "Add to Wishlist"}
              </button>
              {wishlistMessage && (
                <span className="wishlist-message">{wishlistMessage}</span>
              )}
            </div>

            {/* Shipping Info */}
            <div className="shipping-info">
              <div className="info-item">
                <span className="icon"><IconTruck /></span>
                <span>Free shipping on orders above ₹500</span>
              </div>
              <div className="info-item">
                <span className="icon"><IconLock /></span>
                <span>Secure and encrypted payments</span>
              </div>
              <div className="info-item">
                <span className="icon"><IconRefresh /></span>
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
