import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { WishlistContext } from "../context/WishlistContext";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import "./Wishlist.css";
import API_URL from "../api_connection/BackendAPIConnection";

const IconHeartFilled = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);
const IconBag = () => (
  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3, color: "var(--primary)" }}>
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
);
const IconCart = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
);
const IconEye = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const Wishlist = () => {
  const { wishlist, loading, removeFromWishlist } = useContext(WishlistContext);
  const { addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [debugInfo, setDebugInfo] = useState("");


  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  useEffect(() => {
    // Log wishlist data for debugging
    if (wishlist.length > 0) {
      console.log("Wishlist data:", wishlist);
      console.log("First item:", wishlist[0]);
      console.log("API_URL:", API_URL);
      setDebugInfo(`Loaded ${wishlist.length} items. API_URL: ${API_URL}`);
    }
  }, [wishlist]);

  const handleAddToCart = (product) => {
    addToCart(product);
    alert(`${product.name} added to cart!`);
  };

  const handleRemoveFromWishlist = async (productId) => {
    await removeFromWishlist(productId);
  };

  // Helper function to get proper image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) {
      console.warn("No image path provided");
      return null;
    }
    
    console.log("Image path received:", imagePath);
    
    // If it's already a full URL, return as is
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      console.log("Full URL detected:", imagePath);
      return imagePath;
    }
    
    // If it's a relative path starting with /, construct the full URL
    if (imagePath.startsWith("/")) {
      const fullUrl = `${API_URL}${imagePath}`;
      console.log("Absolute path detected, full URL:", fullUrl);
      return fullUrl;
    }
    
    // Otherwise, assume it's a relative path to uploads
    const fullUrl = `${API_URL}/uploads/${imagePath}`;
    console.log("Relative path detected, full URL:", fullUrl);
    return fullUrl;
  };

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Loading wishlist...</h2>
      </div>
    );
  }

  return (
    <div className="wishlist-container">
      <div className="wishlist-header">
        <h1 style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "center" }}><IconHeartFilled /> My Wishlist</h1>
        <p className="wishlist-count">
          {wishlist.length} {wishlist.length === 1 ? "item" : "items"}
        </p>
        {debugInfo && <p style={{ fontSize: "12px", color: "#999" }}>{debugInfo}</p>}
      </div>

      {wishlist.length === 0 ? (
        <div className="empty-wishlist">
          <p className="empty-icon"><IconBag /></p>
          <p className="empty-text">Your wishlist is empty</p>
          <p className="empty-subtext">
            Start adding your favorite products to your wishlist!
          </p>
          <button
            className="continue-shopping-btn"
            onClick={() => navigate("/products")}
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="wishlist-content">
          <div className="wishlist-grid">
            {wishlist.map((item) => {
              const imageUrl = getImageUrl(item.image);
              
              return (
                <div key={item.product_id} className="wishlist-card">
                  <div className="wishlist-card-image">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={item.name || "Product"}
                        onError={(e) => {
                          console.error("Image load error for:", imageUrl);
                          e.target.src = "https://via.placeholder.com/300x300?text=No+Image";
                        }}
                        onLoad={(e) => {
                          console.log("Image loaded successfully:", imageUrl);
                        }}
                      />
                    ) : (
                      <div className="no-image">No Image</div>
                    )}
                    <button
                      className="remove-btn"
                      onClick={() => handleRemoveFromWishlist(item.product_id)}
                      title="Remove from wishlist"
                      aria-label="Remove from wishlist"
                    >
                      <IconX />
                    </button>
                  </div>

                  <div className="wishlist-card-content">
                    <h3 className="product-name">{item.name || "Unnamed Product"}</h3>
                    
                    {item.description && (
                      <p className="product-description">
                        {item.description.substring(0, 100)}
                        {item.description.length > 100 ? "..." : ""}
                      </p>
                    )}

                    <div className="product-price-section">
                      <span className="product-price">₹{parseFloat(item.price || 0).toFixed(2)}</span>
                      {item.stock > 0 ? (
                        <span className="stock-available">In Stock</span>
                      ) : (
                        <span className="stock-unavailable">Out of Stock</span>
                      )}
                    </div>

                    <div className="wishlist-card-actions">
                      <button
                        className="add-to-cart-btn"
                        onClick={() => handleAddToCart(item)}
                        disabled={item.stock === 0}
                      >
                        <IconCart /> Add to Cart
                      </button>
                      <button
                        className="view-details-btn"
                        onClick={() => navigate(`/product/${item.product_id}`)}
                      >
                        <IconEye /> View
                      </button>
                    </div>

                    <p className="added-date">
                      Added: {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Wishlist;
