import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { WishlistContext } from "../context/WishlistContext";
import API_URL from "../api_connection/BackendAPIConnection";
import "./ProductCard.css";

const IconHeart = ({ filled }) => (
  <svg width="16" height="16" viewBox="0 0 24 24"
    fill={filled ? "#c0392b" : "none"}
    stroke={filled ? "#c0392b" : "currentColor"}
    strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const IconBag = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
);

const IconArrow = () => (
  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 6h8M6 2l4 4-4 4"/>
  </svg>
);

const IconPackage = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.18 }}>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
);

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const { isInWishlist, toggleWishlist } = useContext(WishlistContext);
  const [rating, setRating] = useState({ total_reviews: 0, average_rating: 0 });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/reviews/stats/${product.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setRating(d))
      .catch(() => {});
  }, [product.id]);

  const displayImage = product?.images?.[0]?.image_url || product?.image || null;
  const inWishlist = isInWishlist(product.id);
  const outOfStock = product.stock === 0;
  const hasDiscount = product.original_price && product.original_price > product.price;
  const discountPct = hasDiscount
    ? Math.round((1 - product.price / product.original_price) * 100)
    : 0;

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWishlist(product);
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock || adding) return;
    setAdding(true);
    addToCart(product);
    setTimeout(() => setAdding(false), 900);
  };

  const stars = Math.round(rating.average_rating);

  return (
    <article className="pc-root" aria-label={product.name}>

      {/* ── Image area ── */}
      <div className="pc-img-wrap">
        {displayImage ? (
          <img
            src={displayImage}
            alt={product.name}
            className="pc-img"
            loading="lazy"
          />
        ) : (
          <div className="pc-img-placeholder"><IconPackage /></div>
        )}

        {/* Permanent bottom gradient for baseline info */}
        <div className="pc-gradient" aria-hidden="true"/>

        {/* Baseline info always visible */}
        <div className="pc-baseline">
          <p className="pc-name-base">{product.name}</p>
          <p className="pc-price-base">
            ₹{Number(product.price).toLocaleString("en-IN")}
          </p>
        </div>

        {/* Hover reveal panel */}
        <div className="pc-reveal" aria-hidden="true">
          <p className="pc-reveal-name">{product.name}</p>

          {rating.total_reviews > 0 && (
            <div className="pc-stars">
              {Array(5).fill(0).map((_, i) => (
                <span key={i} className={`pc-star${i < stars ? " pc-star--on" : ""}`}>★</span>
              ))}
              <span className="pc-reviews">({rating.total_reviews})</span>
            </div>
          )}

          <div className="pc-price-row">
            <span className="pc-price">₹{Number(product.price).toLocaleString("en-IN")}</span>
            {hasDiscount && (
              <>
                <span className="pc-original">₹{Number(product.original_price).toLocaleString("en-IN")}</span>
                <span className="pc-discount">−{discountPct}%</span>
              </>
            )}
          </div>

          <div className="pc-actions">
            <button
              className={`pc-btn-cart${adding ? " pc-btn-cart--done" : ""}${outOfStock ? " pc-btn-cart--oos" : ""}`}
              onClick={handleAddToCart}
              disabled={outOfStock || adding}
              aria-label={`Add ${product.name} to cart`}
            >
              {outOfStock ? "Out of Stock" : adding ? "Added ✓" : (
                <><IconBag /> Add to Bag</>
              )}
            </button>
            <button
              className="pc-btn-view"
              onClick={(e) => { e.preventDefault(); navigate(`/product/${product.id}`); }}
              aria-label={`View ${product.name}`}
            >
              <IconArrow />
            </button>
          </div>
        </div>

        {/* Badges */}
        {hasDiscount && (
          <span className="pc-badge pc-badge--sale">−{discountPct}%</span>
        )}
        {!hasDiscount && product.is_new && (
          <span className="pc-badge pc-badge--new">New</span>
        )}
        {outOfStock && (
          <span className="pc-badge pc-badge--oos">Sold Out</span>
        )}

        {/* Wishlist */}
        <button
          className={`pc-wish${inWishlist ? " pc-wish--on" : ""}`}
          onClick={handleWishlist}
          aria-label={inWishlist ? "Remove from wishlist" : "Save to wishlist"}
        >
          <IconHeart filled={inWishlist} />
        </button>
      </div>

      {/* ── Card link overlay (makes whole card clickable) ── */}
      <Link to={`/product/${product.id}`} className="pc-overlay-link" aria-label={product.name} tabIndex={-1}/>
    </article>
  );
};

export default ProductCard;
