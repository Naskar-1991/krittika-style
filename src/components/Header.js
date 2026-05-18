import React, { useState, useContext, useEffect, useRef } from "react";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
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

const PRIMARY_NAV = [
  { label: "Collections",  to: "/products" },
  { label: "New Arrivals", to: "/products?sort=newest" },
];

/* ── SVG icons ── */
const IconHeart = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const IconBag = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 0 1-8 0"/>
  </svg>
);

const IconMenu = ({ open }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
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

function Header() {
  const { user, logout, isAdmin } = useContext(AuthContext);
  const { cart }     = useContext(CartContext);
  const { wishlist } = useContext(WishlistContext);
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [logo,         setLogo]         = useState(null);
  const [scrolled,     setScrolled]     = useState(false);
  const dropdownRef = useRef(null);
  const navigate    = useNavigate();
  const location    = useLocation();

  useEffect(() => { fetchLogo(); }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location]);

  const fetchLogo = async () => {
    try {
      const res  = await fetch(`${API_URL}/api/logo`);
      const data = await res.json();
      if (data.logo_url) setLogo(data);
    } catch {}
  };

  const cartCount     = cart.reduce((s, i) => s + i.quantity, 0);
  const wishlistCount = wishlist.length;

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate("/");
  };

  const handleCategory = (cat) => {
    navigate(cat.sort ? `/products?sort=${cat.sort}` : `/products?search=${encodeURIComponent(cat.query)}`);
    setMobileOpen(false);
  };

  const initial = user ? (user.name || user.email || "U")[0].toUpperCase() : null;

  return (
    <header className={`hdr${scrolled ? " hdr--scrolled" : ""}`}>

      {/* ── Announcement / System bar ── */}
      <div className="hdr-announce">
        <span className="hdr-announce-text">
          Free shipping on orders above ₹1,499 · COD Available
        </span>
      </div>

      {/* ── Top App Bar ── */}
      <div className="hdr-main">
        <div className="hdr-inner">

          {/* Logo */}
          <Link to="/" className="hdr-logo" aria-label="Krittika Style — Home">
            {logo?.logo_url ? (
              <img
                src={`${API_URL}${logo.logo_url}`}
                alt={logo.logo_alt_text || "Krittika Style"}
                className="hdr-logo-img"
              />
            ) : (
              <>
                <span className="hdr-logo-mark" aria-hidden="true">
                  <span className="hdr-logo-letter">K</span>
                </span>
                <span className="hdr-logo-words">
                  <span className="hdr-logo-name">Krittika Style</span>
                  <span className="hdr-logo-sub">Handwoven Sarees</span>
                </span>
              </>
            )}
          </Link>

          {/* Primary Nav — MD3 Tabs, desktop only */}
          <nav className="hdr-nav" aria-label="Primary navigation">
            {PRIMARY_NAV.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) =>
                  `hdr-nav-link${isActive ? " active" : ""}`
                }
                end={item.to === "/products"}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hdr-spacer" />

          {/* Actions */}
          <div className="hdr-actions">

            <Link
              to="/wishlist"
              className="hdr-icon-btn"
              aria-label={`Wishlist${wishlistCount > 0 ? `, ${wishlistCount} items` : ""}`}
            >
              <IconHeart />
              {wishlistCount > 0 && (
                <span className="hdr-badge" aria-hidden="true">{wishlistCount}</span>
              )}
            </Link>

            <Link
              to="/cart"
              className="hdr-icon-btn"
              aria-label={`Cart${cartCount > 0 ? `, ${cartCount} items` : ""}`}
            >
              <IconBag />
              {cartCount > 0 && (
                <span className="hdr-badge" aria-hidden="true">{cartCount}</span>
              )}
            </Link>

            {user ? (
              <div
                className={`hdr-user-wrap${userMenuOpen ? " hdr-user-wrap--open" : ""}`}
                ref={dropdownRef}
              >
                <button
                  className="hdr-user-btn"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                  aria-label="Account menu"
                >
                  <span className="hdr-avatar">{initial}</span>
                </button>

                {userMenuOpen && (
                  <div className="hdr-dropdown" role="menu">
                    <div className="hdr-drop-head">
                      <div className="hdr-drop-name">{user.name || "Account"}</div>
                      <div className="hdr-drop-email">{user.email}</div>
                      {user.role === "admin" && (
                        <span className="hdr-admin-tag">Admin</span>
                      )}
                    </div>

                    <Link to="/wishlist" className="hdr-drop-item" role="menuitem" onClick={() => setUserMenuOpen(false)}>My Wishlist</Link>
                    <Link to="/orders"   className="hdr-drop-item" role="menuitem" onClick={() => setUserMenuOpen(false)}>My Orders</Link>
                    <Link to="/returns"  className="hdr-drop-item" role="menuitem" onClick={() => setUserMenuOpen(false)}>My Returns</Link>
                    <Link to="/profile"  className="hdr-drop-item" role="menuitem" onClick={() => setUserMenuOpen(false)}>Profile &amp; Settings</Link>
                    {isAdmin && (
                      <Link to="/admin" className="hdr-drop-item" role="menuitem" onClick={() => setUserMenuOpen(false)}>Admin Dashboard</Link>
                    )}
                    <div className="hdr-drop-divider" />
                    <button className="hdr-drop-item hdr-drop-signout" role="menuitem" onClick={handleLogout}>
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hdr-auth">
                <Link to="/login"  className="hdr-btn-login">Sign in</Link>
                <Link to="/signup" className="hdr-btn-signup">Join</Link>
              </div>
            )}

            <button
              className="hdr-hamburger"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              <IconMenu open={mobileOpen} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Category strip — MD3 Filter Chips ── */}
      <nav className="hdr-cats" aria-label="Browse categories">
        <div className="hdr-cats-inner">
          {NAV_CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              className="hdr-cat-btn"
              onClick={() => handleCategory(cat)}
            >
              {cat.label}
            </button>
          ))}
          {isAdmin && (
            <Link to="/admin" className="hdr-cat-btn hdr-cat-admin">
              Admin
            </Link>
          )}
        </div>
      </nav>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="hdr-drawer" role="dialog" aria-label="Navigation menu">
          <div className="hdr-drawer-label">Collections</div>
          {NAV_CATEGORIES.map((cat) => (
            <button key={cat.label} className="hdr-drawer-item" onClick={() => handleCategory(cat)}>
              {cat.label}
            </button>
          ))}

          {user ? (
            <>
              <div className="hdr-drawer-divider" />
              <div className="hdr-drawer-label">Account</div>
              <Link to="/wishlist" className="hdr-drawer-item">My Wishlist</Link>
              <Link to="/orders"   className="hdr-drawer-item">My Orders</Link>
              <Link to="/returns"  className="hdr-drawer-item">My Returns</Link>
              <Link to="/profile"  className="hdr-drawer-item">Profile &amp; Settings</Link>
              {isAdmin && <Link to="/admin" className="hdr-drawer-item hdr-drawer-item--gold">Admin Dashboard</Link>}
              <div className="hdr-drawer-divider" />
              <button className="hdr-drawer-item hdr-drawer-signout" onClick={handleLogout}>Sign out</button>
            </>
          ) : (
            <>
              <div className="hdr-drawer-divider" />
              <Link to="/login"  className="hdr-drawer-item">Sign in</Link>
              <Link to="/signup" className="hdr-drawer-item hdr-drawer-item--gold">Create Account</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}

export default Header;
