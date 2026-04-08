import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";
import { WishlistContext } from "../context/WishlistContext";
import API_URL from "../api_connection/BackendAPIConnection";
import "./Header.css";

function Header() {
  const { user, logout, isAdmin } = useContext(AuthContext);
  const { cart } = useContext(CartContext);
  const { wishlist } = useContext(WishlistContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [logo, setLogo] = useState(null);
  const [logoLoading, setLogoLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch logo on component mount
  useEffect(() => {
    fetchLogo();
  }, []);

  const fetchLogo = async () => {
    try {
      const response = await fetch(`${API_URL}/api/logo`);
      const data = await response.json();
      if (data.logo_url) {
        setLogo(data);
      }
    } catch (error) {
      console.error("Error fetching logo:", error);
    } finally {
      setLogoLoading(false);
    }
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistCount = wishlist.length;

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate("/");
  };

  const handleNavClick = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
      setMobileMenuOpen(false);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="header">
      {/* Top Bar */}
      <div className="top-bar">
        <div className="container">
          <div className="top-bar-content">
            <div className="top-bar-left">
              <span>📞 +91 7586826861</span>
              <span>✉️ support@krittikastyle.com</span>
            </div>
            <div className="top-bar-right">
              <a href="#facebook">Facebook</a>
              <a href="#twitter">Twitter</a>
              <a href="#instagram">Instagram</a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="navbar">
        <div className="container">
          <div className="nav-wrapper">
            {/* Logo */}
            <Link to="/" className="logo">
              {logo && logo.logo_url ? (
                <img 
                  src={`${API_URL}${logo.logo_url}`} 
                  alt={logo.logo_alt_text || "Logo"}
                  className="logo-image"
                  title={logo.site_name}
                />
              ) : (
                <>
                  <span className="logo-icon">🛍️</span>
                  <span className="logo-text">KrittikaStyle</span>
                </>
              )}
            </Link>

            {/* Search Bar */}
            <form className="search-bar" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="search-btn">
                <span>🔍</span>
              </button>
            </form>

            {/* Desktop Menu */}
            <div className="nav-menu">
              {isAdmin && (
                <Link
                  to="/admin"
                  className="nav-link admin-link"
                  title="Admin Dashboard"
                >
                  👨‍💼 Admin
                </Link>
              )}
            </div>

            {/* Right Side - Wishlist, Cart & User */}
            <div className="nav-right">
              {/* Wishlist Icon */}
              <Link to="/wishlist" className="wishlist-icon" title="Wishlist">
                <span className="wishlist-emoji">❤️</span>
                {wishlistCount > 0 && (
                  <span className="wishlist-badge">{wishlistCount}</span>
                )}
              </Link>

              {/* Cart Icon */}
              <Link to="/cart" className="cart-icon">
                <span className="cart-emoji">🛒</span>
                {cartCount > 0 && (
                  <span className="cart-badge">{cartCount}</span>
                )}
              </Link>

              {/* User Menu */}
              {user ? (
                <div className="user-menu-wrapper">
                  <button
                    className="user-menu-btn"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                  >
                    <span className="user-icon">👤</span>
                    <span className="user-name">{user.name || user.email}</span>
                  </button>

                  {userMenuOpen && (
                    <div className="user-dropdown">
                      <div className="dropdown-header">
                        {user.email}
                        {user.role === "admin" && (
                          <span className="admin-badge">Admin</span>
                        )}
                      </div>
                      <Link to="/wishlist" onClick={() => setUserMenuOpen(false)}>
                        ❤️ My Wishlist
                      </Link>
                      <Link to="/orders" onClick={() => setUserMenuOpen(false)}>
                        📦 My Orders
                      </Link>
                      <Link to="/profile" onClick={() => setUserMenuOpen(false)}>
                        ⚙️ Profile Settings
                      </Link>
                      <hr />
                      <button onClick={handleLogout} className="logout-btn">
                        🚪 Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="auth-buttons">
                  <Link to="/login" className="btn-login">
                    Login
                  </Link>
                  <Link to="/signup" className="btn-signup">
                    Sign Up
                  </Link>
                </div>
              )}

              {/* Mobile Menu Toggle */}
              <button
                className="mobile-menu-btn"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <span></span>
                <span></span>
                <span></span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          <form onSubmit={handleSearch} className="mobile-search-form">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="mobile-search-btn">🔍</button>
          </form>
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => handleNavClick("/admin")}
              className="mobile-link admin-link"
            >
              👨‍💼 Admin Dashboard
            </Link>
          )}
          <hr />
          {user ? (
            <>
              <Link
                to="/wishlist"
                onClick={() => handleNavClick("/wishlist")}
                className="mobile-link"
              >
                ❤️ My Wishlist
              </Link>
              <Link
                to="/orders"
                onClick={() => handleNavClick("/orders")}
                className="mobile-link"
              >
                📦 My Orders
              </Link>
              <Link
                to="/profile"
                onClick={() => handleNavClick("/profile")}
                className="mobile-link"
              >
                ⚙️ Profile Settings
              </Link>
              <button onClick={handleLogout} className="mobile-logout">
                🚪 Logout ({user.email})
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => handleNavClick("/login")}
                className="mobile-link"
              >
                Login
              </Link>
              <Link
                to="/signup"
                onClick={() => handleNavClick("/signup")}
                className="mobile-link"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}

export default Header;
