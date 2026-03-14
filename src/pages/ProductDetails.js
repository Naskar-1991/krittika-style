import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import "./ProductDetails.css";
import API_URL from "../api_connection/BackendAPIConnection";

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    fetchProductDetails();
    window.scrollTo(0, 0);
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/products/${id}`);
      if (!response.ok) throw new Error("Product not found");
      
      const data = await response.json();
      setProduct(data);
      
      // Fetch related products (same category)
      const allProductsResponse = await fetch(`${API_URL}/api/products`);
      if (allProductsResponse.ok) {
        const allProducts = await allProductsResponse.json();
        const related = allProducts
          .filter(p => p.id !== parseInt(id))
          .slice(0, 4);
        setRelatedProducts(related);
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
                <span className="stars">⭐⭐⭐⭐⭐</span>
                <span className="rating-text">(127 customer reviews)</span>
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
              <button className="btn-wishlist">❤️ Add to Wishlist</button>
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
                <h3>Customer Reviews</h3>
                <div className="reviews-list">
                  {[
                    { author: "Rajesh Kumar", rating: 5, text: "Excellent product! Great quality and fast delivery." },
                    { author: "Priya Singh", rating: 5, text: "Very satisfied with the purchase. Highly recommended!" },
                    { author: "Amit Patel", rating: 4, text: "Good product. Price could be a bit lower." },
                  ].map((review, index) => (
                    <div key={index} className="review-item">
                      <div className="review-header">
                        <span className="review-author">{review.author}</span>
                        <span className="review-rating">
                          {"⭐".repeat(review.rating)}
                        </span>
                      </div>
                      <p className="review-text">{review.text}</p>
                    </div>
                  ))}
                </div>
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
