import React, { useState, useContext, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";
import { WishlistContext } from "../context/WishlistContext";
import API_URL from "../api_connection/BackendAPIConnection";
import "./Header.css";

const NAV_CATEGORIES = [
  { label: "Silk Sarees",   query: "Silk" },
  { label: "Cotton Sarees", query: "Cotton" },
  { label: "Banarasi",      query: "Banarasi" },
  { label: "Handloom",      query: "Handloom" },
  { label: "Bridal",        query: "Bridal" },
  { label: "New Arrivals",  sort: "newest" },
];

/* ── SVG icons ── */
const IconSearch = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const IconHeart = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const IconBag = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
);

const IconMenu = ({ open }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    {open ? (
      <>
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </>
    ) : (
      <>
        <line x1="3" y1="6"  x2="21" y2="6"/>
        <line x1="3" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="18" x2="21" y2="18"/>
      </>
    )}
  </svg>
);

function UserAvatar({ user }) {
  const initial = (user.name || user.email || "U")[0].toUpperCase();
  return <span className="user-avatar">{initial}</span>;
}

function Header() {
  const { user, logout, isAdmin } = useContext(AuthContext);
  const { cart } = useContext(CartContext);
  const { wishlist } = useContext(WishlistContext);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [logo, setLogo] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => { fetchLogo(); }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location]);

  const fetchLogo = async () => {
    try {
      const res = await fetch(`${API_URL}/api/logo`);
      const data = await res.json();
      if (data.logo_url) setLogo(data);
    } catch {}
  };

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const wishlistCount = wishlist.length;

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate("/");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
      setMobileOpen(false);
    }
  };

  const handleCategory = (cat) => {
    navigate(cat.sort ? `/products?sort=${cat.sort}` : `/products?search=${encodeURIComponent(cat.query)}`);
    setMobileOpen(false);
  };

  return (
    <header className={`header${scrolled ? " header--scrolled" : ""}`}>
      {/* ── Top strip ── */}
      <div className="top-strip">
        <div className="container">
          <div className="top-strip-inner">
            <span>Free shipping on orders above ₹1,499</span>
            <div className="top-strip-links">
              <a href="https://facebook.com" target="_blank" rel="noreferrer">Facebook</a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram</a>
              <a href="https://pinterest.com" target="_blank" rel="noreferrer">Pinterest</a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main bar ── */}
      <div className="main-bar">
        <div className="container">
          <div className="main-bar-inner">

            {/* Logo */}
            <Link to="/" className="logo" aria-label="Krittika Style — Home">
              {logo?.logo_url ? (
                <img
                  src={`${API_URL}${logo.logo_url}`}
                  alt={logo.logo_alt_text || "Krittika Style"}
                  className="logo-image"
                />
              ) : (
                <>
                  <span className="logo-mark" aria-hidden="true">
                    <span className="logo-mark-inner">K</span>
                  </span>
                  <span className="logo-wordmark">
                    <span className="logo-name">Krittika Style</span>
                    <span className="logo-sub">Handwoven Sarees</span>
                  </span>
                </>
              )}
            </Link>

            {/* Search */}
            <form className="search-form" onSubmit={handleSearch} role="search">
              <label htmlFor="site-search" className="sr-only">Search sarees</label>
              <span className="search-icon-left" aria-hidden="true"><IconSearch /></span>
              <input
                id="site-search"
                type="text"
                className="search-input"
                placeholder="Search sarees, fabrics, occasions…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoComplete="off"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </form>

            {/* Right actions */}
            <div className="main-bar-right">
              <Link to="/wishlist" className="icon-btn" aria-label={`Wishlist${wishlistCount > 0 ? `, ${wishlistCount} items` : ""}`}>
                <IconHeart />
                {wishlistCount > 0 && <span className="icon-badge">{wishlistCount}</span>}
              </Link>

              <Link to="/cart" className="icon-btn" aria-label={`Cart${cartCount > 0 ? `, ${cartCount} items` : ""}`}>
                <IconBag />
                {cartCount > 0 && <span className="icon-badge">{cartCount}</span>}
              </Link>

              {user ? (
                <div className="user-menu-wrap" ref={dropdownRef}>
                  <button
                    className="user-btn"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                  >
                    <UserAvatar user={user} />
                  </button>

                  {userMenuOpen && (
                    <div className="user-dropdown" role="menu">
                      <div className="dropdown-profile">
                        <UserAvatar user={user} />
                        <div className="dropdown-profile-info">
                          <span className="dropdown-name">{user.name || "Account"}</span>
                          <span className="dropdown-email">{user.email}</span>
                        </div>
                        {user.role === "admin" && <span className="admin-chip">Admin</span>}
                      </div>
                      <div className="dropdown-divider" />
                      <Link to="/wishlist" className="dropdown-item" role="menuitem" onClick={() => setUserMenuOpen(false)}>
                        My Wishlist
                      </Link>
                      <Link to="/orders" className="dropdown-item" role="menuitem" onClick={() => setUserMenuOpen(false)}>
                        My Orders
                      </Link>
                      <Link to="/returns" className="dropdown-item" role="menuitem" onClick={() => setUserMenuOpen(false)}>
                        My Returns
                      </Link>
                      <Link to="/profile" className="dropdown-item" role="menuitem" onClick={() => setUserMenuOpen(false)}>
                        Profile &amp; Settings
                      </Link>
                      {isAdmin && (
                        <Link to="/admin" className="dropdown-item" role="menuitem" onClick={() => setUserMenuOpen(false)}>
                          Admin Dashboard
                        </Link>
                      )}
                      <div className="dropdown-divider" />
                      <button className="dropdown-item dropdown-signout" role="menuitem" onClick={handleLogout}>
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="auth-group">
                  <Link to="/login" className="btn-text-login">Sign in</Link>
                  <Link to="/signup" className="btn-filled-signup">Get Started</Link>
                </div>
              )}

              <button
                className="mobile-toggle"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
              >
                <IconMenu open={mobileOpen} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Category nav ── */}
      <nav className="cat-nav" aria-label="Product categories">
        <div className="container">
          <div className="cat-nav-inner">
            {NAV_CATEGORIES.map((cat) => (
              <button
                key={cat.label}
                className="cat-link"
                onClick={() => handleCategory(cat)}
              >
                {cat.label}
              </button>
            ))}
            {isAdmin && (
              <Link to="/admin" className="cat-link cat-link--admin">
                Admin
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="mobile-drawer" role="dialog" aria-label="Navigation menu">
          <div className="mobile-section-label">Collections</div>
          {NAV_CATEGORIES.map((cat) => (
            <button key={cat.label} className="mobile-item" onClick={() => handleCategory(cat)}>
              {cat.label}
            </button>
          ))}

          {user ? (
            <>
              <div className="mobile-divider" />
              <div className="mobile-section-label">Account</div>
              <Link to="/wishlist" className="mobile-item">My Wishlist</Link>
              <Link to="/orders" className="mobile-item">My Orders</Link>
              <Link to="/returns" className="mobile-item">My Returns</Link>
              <Link to="/profile" className="mobile-item">Profile &amp; Settings</Link>
              {isAdmin && <Link to="/admin" className="mobile-item">Admin Dashboard</Link>}
              <div className="mobile-divider" />
              <button className="mobile-item mobile-signout" onClick={handleLogout}>Sign out</button>
            </>
          ) : (
            <>
              <div className="mobile-divider" />
              <Link to="/login" className="mobile-item">Sign in</Link>
              <Link to="/signup" className="mobile-item mobile-item--primary">Get Started</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}

export default Header;
