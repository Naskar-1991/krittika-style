import React, { useState, useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";
import "./Header.css";

function Header() {
  const { user, logout, isAdmin } = useContext(AuthContext);
  const { cart } = useContext(CartContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

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
              <span>📞 +1 (234) 567-8900</span>
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
              <span className="logo-icon">🛍️</span>
              <span className="logo-text">KrittikaStyle</span>
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

            {/* Right Side - Cart & User */}
            <div className="nav-right">
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
                to="/orders"
                onClick={() => handleNavClick("/orders")}
                className="mobile-link"
              >
                📦 My Orders
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
