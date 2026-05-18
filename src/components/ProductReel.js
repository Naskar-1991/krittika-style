import React from "react";
import ProductCard from "./ProductCard";
import "./ProductReel.css";

/**
 * Mobile product grid — replaces the Instagram-style snap scroll.
 * Renders a responsive 2-column grid of standard ProductCards.
 */
const ProductReel = ({ products = [] }) => {
  if (!products.length) return null;

  return (
    <div className="product-reel-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

export default ProductReel;
