import React from "react";
import { useNavigate } from "react-router-dom";
import "./HomeBanner.css";

const HomeBanner = () => {
  const navigate = useNavigate();

  // Village Shopping Marketplace Banner
  const banner = {
    id: 1,
    title: "Village Market Shopping",
    subtitle: "From Our Community To Your Home",
    description: "Shop local, authentic products from our village marketplace with the warmth of a small-town community",
    emoji: "🏘️",
    gradient: "linear-gradient(135deg, #5DADE2 0%, #3498DB 50%, #2980B9 100%)",
    image: "https://images.unsplash.com/photo-1605083286435-896727b72f9d?w=1400&h=600&fit=crop",
    backgroundColor: "#ECF0F1",
  };

  return (
    <div className="home-banner-container">
      {/* Main Banner */}
      <div className="banner-wrapper" style={{ backgroundColor: banner.backgroundColor }}>
        <div
          className="banner-slide"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(93, 173, 226, 0.7) 0%, rgba(52, 152, 219, 0.7) 100%), url('${banner.image}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Village Theme Decorative Elements */}
          <div className="banner-village-decoration">
            <div className="village-shop-1">🏪</div>
            <div className="village-shop-2">🏬</div>
            <div className="village-trees">🌳</div>
          </div>

          {/* Overlay */}
          <div className="banner-overlay-village"></div>

          {/* Banner Content */}
          <div className="banner-content">
            <div className="banner-text">
              {/* Main Emoji */}
              <div className="banner-emoji-village">{banner.emoji}</div>

              {/* Main Title */}
              <h1 className="banner-title-village">{banner.title}</h1>

              {/* Subtitle */}
              <p className="banner-subtitle-village">{banner.subtitle}</p>

              {/* Description */}
              <p className="banner-description-village">{banner.description}</p>

              {/* CTA Buttons */}
              <div className="banner-buttons-village">
                <button
                  className="btn-primary-village"
                  onClick={() => navigate("/products?sort=newest")}
                >
                  🌟 Explore Products
                </button>
                <button
                  className="btn-secondary-village"
                  onClick={() => navigate("/products?sort=discount")}
                >
                  💝 Special Deals
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="trust-badges-village">
                <div className="trust-badge">✓ Local Community</div>
                <div className="trust-badge">✓ Authentic Products</div>
                <div className="trust-badge">✓ Fair Prices</div>
              </div>
            </div>

            {/* Illustration Side - Village Shopping Person */}
            <div className="banner-illustration-village">
              <div className="shopping-person">
                👨‍🌾
                <div className="shopping-bags">🛍️ 🛍️</div>
              </div>
              <div className="village-path">═══════════════════</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeBanner;
