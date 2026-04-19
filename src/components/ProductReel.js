import React, { useContext, useState, useRef, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { WishlistContext } from "../context/WishlistContext";
import "./ProductReel.css";

const HeartIcon = ({ filled }) => (
  <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const BagIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const ChevronUpIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

const ProductReel = ({ products = [] }) => {
  const { addToCart } = useContext(CartContext);
  const { isInWishlist, toggleWishlist } = useContext(WishlistContext);
  const [activeIndex, setActiveIndex] = useState(0);
  const [addedIds, setAddedIds] = useState(new Set());
  const containerRef = useRef(null);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, clientHeight } = containerRef.current;
    const idx = Math.round(scrollTop / clientHeight);
    setActiveIndex(Math.max(0, Math.min(idx, products.length - 1)));
  }, [products.length]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const handleAddToCart = (product) => {
    addToCart(product);
    setAddedIds((prev) => new Set([...prev, product.id]));
    setTimeout(() => {
      setAddedIds((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 1500);
  };

  const scrollTo = (idx) => {
    if (!containerRef.current) return;
    containerRef.current.scrollTo({
      top: idx * containerRef.current.clientHeight,
      behavior: "smooth",
    });
  };

  if (!products.length) return null;

  return (
    <div className="product-reel" ref={containerRef}>
      {products.map((product, i) => {
        const displayImage =
          product?.images?.[0]?.image_url || product?.image || null;
        const inWishlist = isInWishlist(product.id);
        const wasAdded = addedIds.has(product.id);
        const isFirst = i === 0;

        return (
          <div key={product.id} className="reel-item">
            {/* Full-screen background image */}
            <Link to={`/product/${product.id}`} className="reel-bg-link" tabIndex={-1}>
              {displayImage ? (
                <img
                  src={displayImage}
                  alt={product.name}
                  className="reel-bg-img"
                  loading={i < 2 ? "eager" : "lazy"}
                />
              ) : (
                <div className="reel-bg-placeholder" />
              )}
            </Link>

            {/* Gradient overlays */}
            <div className="reel-gradient-top" aria-hidden="true" />
            <div className="reel-gradient-bottom" aria-hidden="true" />

            {/* Progress bar + badge */}
            <div className="reel-top-bar">
              <div className="reel-progress" role="progressbar" aria-valuenow={i + 1} aria-valuemax={products.length}>
                {products.map((_, j) => (
                  <button
                    key={j}
                    className={`reel-progress-seg${j === activeIndex ? " reel-progress-seg--active" : j < activeIndex ? " reel-progress-seg--done" : ""}`}
                    onClick={() => scrollTo(j)}
                    aria-label={`Go to product ${j + 1}`}
                  />
                ))}
              </div>
              {product.stock === 0 ? (
                <span className="reel-badge reel-badge--oos">Out of Stock</span>
              ) : (
                <span className="reel-badge reel-badge--stock">In Stock</span>
              )}
            </div>

            {/* Right side action panel */}
            <div className="reel-side-actions">
              <button
                className={`reel-side-btn${inWishlist ? " reel-side-btn--heart" : ""}`}
                onClick={() => toggleWishlist(product)}
                aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
              >
                <HeartIcon filled={inWishlist} />
                <span>{inWishlist ? "Saved" : "Save"}</span>
              </button>

              <button
                className={`reel-side-btn${wasAdded ? " reel-side-btn--added" : ""}`}
                onClick={() => handleAddToCart(product)}
                disabled={product.stock === 0}
                aria-label="Add to cart"
              >
                <BagIcon />
                <span>{wasAdded ? "Added!" : "Cart"}</span>
              </button>

              <Link
                to={`/product/${product.id}`}
                className="reel-side-btn"
                aria-label="View product details"
              >
                <EyeIcon />
                <span>View</span>
              </Link>
            </div>

            {/* Bottom info panel */}
            <div className="reel-bottom">
              <h3 className="reel-product-name">{product.name}</h3>

              {product.description && (
                <p className="reel-product-desc">
                  {product.description.length > 75
                    ? product.description.substring(0, 75) + "…"
                    : product.description}
                </p>
              )}

              <div className="reel-meta-row">
                <div className="reel-price-group">
                  <span className="reel-price">
                    ₹{Number(product.price).toLocaleString("en-IN")}
                  </span>
                  {product.original_price && (
                    <span className="reel-original-price">
                      ₹{Number(product.original_price).toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
              </div>

              <Link to={`/product/${product.id}`} className="reel-shop-btn">
                Shop Now
              </Link>

              {/* Swipe hint on first card only */}
              {isFirst && activeIndex === 0 && products.length > 1 && (
                <button className="reel-swipe-hint" onClick={() => scrollTo(1)} aria-label="Swipe for more products">
                  <ChevronUpIcon />
                  <span>Swipe up for more</span>
                </button>
              )}
            </div>

            {/* Item counter */}
            <div className="reel-counter" aria-live="polite">
              {i + 1} / {products.length}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProductReel;
