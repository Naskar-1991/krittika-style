import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";
import { WishlistContext } from "../context/WishlistContext";
import API_URL from "../api_connection/BackendAPIConnection";
import "./Header.css";

const NAV_CATEGORIES = [
  { label: "Silk Sarees",    query: "Silk" },
  { label: "Cotton Sarees",  query: "Cotton" },
  { label: "Banarasi",       query: "Banarasi" },
  { label: "Handloom",       query: "Handloom" },
  { label: "Bridal",         query: "Bridal" },
  { label: "New Arrivals",   sort: "newest" },
];

function Header() {
  const { user, logout, isAdmin } = useContext(AuthContext);
  const { cart } = useContext(CartContext);
  const { wishlist } = useContext(WishlistContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [logo, setLogo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLogo();
  }, []);

  const fetchLogo = async () => {
    try {
      const response = await fetch(`${API_URL}/api/logo`);
      const data = await response.json();
      if (data.logo_url) setLogo(data);
    } catch (error) {
      console.error("Error fetching logo:", error);
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

  const handleCategoryNav = (cat) => {
    if (cat.sort) {
      navigate(`/products?sort=${cat.sort}`);
    } else {
      navigate(`/products?search=${encodeURIComponent(cat.query)}`);
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="header">
      {/* Top Bar */}
      <div className="top-bar">
        <div className="container">
          <div className="top-bar-content">
            <div className="top-bar-left">
              <span>+91 7586826861</span>
              <span>support@krittikastyle.com</span>
            </div>
            <div className="top-bar-right">
              <a href="https://facebook.com" target="_blank" rel="noreferrer">Facebook</a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram</a>
              <a href="https://pinterest.com" target="_blank" rel="noreferrer">Pinterest</a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="navbar">
        <div className="container">
          <div className="nav-wrapper">
            {/* Logo */}
            <Link to="/" className="logo">
              {logo && logo.logo_url ? (
                <img
                  src={`${API_URL}${logo.logo_url}`}
                  alt={logo.logo_alt_text || "Krittika Style"}
                  className="logo-image"
                  title={logo.site_name}
                />
              ) : (
                <>
                  <span className="logo-icon-wrap">
                    <span className="logo-icon">🥻</span>
                  </span>
                  <span className="logo-text-wrap">
                    <span className="logo-text">Krittika Style</span>
                    <span className="logo-tagline">Handwoven Sarees</span>
                  </span>
                </>
              )}
            </Link>

            {/* Search */}
            <form className="search-bar" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search sarees, fabrics, occasions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="search-btn" aria-label="Search">
                <span>🔍</span>
              </button>
            </form>

            {/* Desktop Category Links */}
            <div className="nav-menu">
              {NAV_CATEGORIES.map((cat) => (
                <button
                  key={cat.label}
                  className="nav-link"
                  onClick={() => handleCategoryNav(cat)}
                >
                  {cat.label}
                </button>
              ))}
              {isAdmin && (
                <Link to="/admin" className="nav-link admin-link">
                  Admin
                </Link>
              )}
            </div>

            {/* Right — Wishlist, Cart, User */}
            <div className="nav-right">
              <Link to="/wishlist" className="wishlist-icon" title="Wishlist">
                <span className="wishlist-emoji">♡</span>
                {wishlistCount > 0 && (
                  <span className="wishlist-badge">{wishlistCount}</span>
                )}
              </Link>

              <Link to="/cart" className="cart-icon" title="Cart">
                <span className="cart-emoji">🛍</span>
                {cartCount > 0 && (
                  <span className="cart-badge">{cartCount}</span>
                )}
              </Link>

              {user ? (
                <div className="user-menu-wrapper">
                  <button
                    className="user-menu-btn"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                  >
                    <span className="user-icon">◯</span>
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
                        My Wishlist
                      </Link>
                      <Link to="/orders" onClick={() => setUserMenuOpen(false)}>
                        My Orders
                      </Link>
                      <Link to="/returns" onClick={() => setUserMenuOpen(false)}>
                        My Returns
                      </Link>
                      <Link to="/profile" onClick={() => setUserMenuOpen(false)}>
                        Profile &amp; Settings
                      </Link>
                      <hr />
                      <button onClick={handleLogout} className="logout-btn">
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="auth-buttons">
                  <Link to="/login" className="btn-login">Login</Link>
                  <Link to="/signup" className="btn-signup">Sign Up</Link>
                </div>
              )}

              {/* Mobile toggle */}
              <button
                className="mobile-menu-btn"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Menu"
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
              placeholder="Search sarees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="mobile-search-btn">🔍</button>
          </form>

          {NAV_CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              className="mobile-link"
              style={{ background: "none", border: "none", textAlign: "left", width: "100%", cursor: "pointer" }}
              onClick={() => handleCategoryNav(cat)}
            >
              {cat.label}
            </button>
          ))}

          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => handleNavClick("/admin")}
              className="mobile-link admin-link"
            >
              Admin Dashboard
            </Link>
          )}

          <hr style={{ borderColor: "rgba(255,255,255,0.08)", margin: "4px 0" }} />

          {user ? (
            <>
              <Link to="/wishlist" onClick={() => handleNavClick("/wishlist")} className="mobile-link">
                My Wishlist
              </Link>
              <Link to="/orders" onClick={() => handleNavClick("/orders")} className="mobile-link">
                My Orders
              </Link>
              <Link to="/returns" onClick={() => handleNavClick("/returns")} className="mobile-link">
                My Returns
              </Link>
              <Link to="/profile" onClick={() => handleNavClick("/profile")} className="mobile-link">
                Profile &amp; Settings
              </Link>
              <button onClick={handleLogout} className="mobile-logout">
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => handleNavClick("/login")} className="mobile-link">
                Login
              </Link>
              <Link to="/signup" onClick={() => handleNavClick("/signup")} className="mobile-link">
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
