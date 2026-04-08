import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const AdminLayout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--bg-secondary)" }}>
      {/* Sidebar */}
      <div style={{
        width: "260px",
        backgroundColor: "var(--primary-dark)",
        color: "white",
        padding: "2rem 1.5rem",
        boxShadow: "2px 0 8px rgba(0,0,0,0.15)",
        overflowY: "auto",
        position: "fixed",
        height: "100vh",
        left: 0,
        top: 0,
      }}>
        <h2 style={{
          margin: "0 0 2rem 0",
          fontSize: "24px",
          fontWeight: "700",
          color: "white",
          borderBottom: "2px solid rgba(255,255,255,0.1)",
          paddingBottom: "1rem",
        }}>
          Admin
        </h2>

        <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <Link to="/admin" style={{
            color: "white",
            textDecoration: "none",
            padding: "0.75rem 1rem",
            borderRadius: "6px",
            backgroundColor: "rgba(255,255,255,0.1)",
            display: "block",
            fontWeight: "500",
            transition: "all 0.2s ease",
            fontSize: "14px",
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.15)"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"}
          >
            📊 Dashboard
          </Link>

          <Link to="/admin/products" style={{
            color: "white",
            textDecoration: "none",
            padding: "0.75rem 1rem",
            borderRadius: "6px",
            backgroundColor: "rgba(255,255,255,0.1)",
            display: "block",
            fontWeight: "500",
            transition: "all 0.2s ease",
            fontSize: "14px",
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.15)"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"}
          >
            📦 Products
          </Link>

          <Link to="/admin/users" style={{
            color: "white",
            textDecoration: "none",
            padding: "0.75rem 1rem",
            borderRadius: "6px",
            backgroundColor: "rgba(255,255,255,0.1)",
            display: "block",
            fontWeight: "500",
            transition: "all 0.2s ease",
            fontSize: "14px",
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.15)"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"}
          >
            👥 Users
          </Link>

          <Link to="/admin/orders" style={{
            color: "white",
            textDecoration: "none",
            padding: "0.75rem 1rem",
            borderRadius: "6px",
            backgroundColor: "rgba(255,255,255,0.1)",
            display: "block",
            fontWeight: "500",
            transition: "all 0.2s ease",
            fontSize: "14px",
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.15)"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"}
          >
            📋 Orders
          </Link>

          <Link to="/admin/categories" style={{
            color: "white",
            textDecoration: "none",
            padding: "0.75rem 1rem",
            borderRadius: "6px",
            backgroundColor: "rgba(255,255,255,0.1)",
            display: "block",
            fontWeight: "500",
            transition: "all 0.2s ease",
            fontSize: "14px",
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.15)"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"}
          >
            🏷️ Categories
          </Link>

          <Link to="/admin/logo" style={{
            color: "white",
            textDecoration: "none",
            padding: "0.75rem 1rem",
            borderRadius: "6px",
            backgroundColor: "rgba(255,255,255,0.1)",
            display: "block",
            fontWeight: "500",
            transition: "all 0.2s ease",
            fontSize: "14px",
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.15)"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"}
          >
            🎨 Logo
          </Link>

          <Link to="/admin/reviews" style={{
            color: "white",
            textDecoration: "none",
            padding: "0.75rem 1rem",
            borderRadius: "6px",
            backgroundColor: "rgba(255,255,255,0.1)",
            display: "block",
            fontWeight: "500",
            transition: "all 0.2s ease",
            fontSize: "14px",
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.15)"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"}
          >
            ⭐ Reviews
          </Link>

          <hr style={{ borderColor: "rgba(255,255,255,0.1)", margin: "1rem 0" }} />

          <Link to="/" style={{
            color: "white",
            textDecoration: "none",
            padding: "0.75rem 1rem",
            borderRadius: "6px",
            backgroundColor: "rgba(255,255,255,0.1)",
            display: "block",
            fontWeight: "500",
            transition: "all 0.2s ease",
            fontSize: "14px",
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.15)"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"}
          >
            🏪 Shop
          </Link>

          <button
            onClick={handleLogout}
            style={{
              color: "white",
              padding: "0.75rem 1rem",
              borderRadius: "6px",
              backgroundColor: "var(--danger)",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              transition: "all 0.2s ease",
              width: "100%",
              textAlign: "left",
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#b91c1c"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "var(--danger)"}
          >
            🚪 Logout
          </button>
        </nav>

        <div style={{
          marginTop: "2rem",
          padding: "1rem",
          backgroundColor: "rgba(255,255,255,0.05)",
          borderRadius: "6px",
          fontSize: "12px",
          color: "rgba(255,255,255,0.7)",
        }}>
          <p style={{ margin: "0 0 0.5rem 0", fontWeight: "600" }}>Logged in as:</p>
          <p style={{ margin: "0", wordBreak: "break-all" }}>
            {user?.name || user?.email}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        marginLeft: "260px",
        flex: 1,
        overflow: "auto",
        backgroundColor: "var(--bg-secondary)",
      }}>
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;
