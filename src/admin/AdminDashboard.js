import React, { useState, useEffect } from "react";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // Fetch products count
      const productsRes = await fetch("http://localhost:5500/api/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const products = await productsRes.json();

      // Fetch users count
      const usersRes = await fetch("http://localhost:5500/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const users = await usersRes.json();

      // Fetch orders
      const ordersRes = await fetch("http://localhost:5500/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const orders = await ordersRes.json();

      // Calculate total revenue from delivered orders
      const totalRevenue = orders
        .filter(o => o.status === "delivered")
        .reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0);

      setStats({
        totalProducts: products.length,
        totalUsers: users.length,
        totalOrders: orders.length,
        totalRevenue: totalRevenue
      });
      setError("");
    } catch (err) {
      console.error("Error fetching stats:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <div style={{ 
          display: "inline-block", 
          width: "40px", 
          height: "40px", 
          border: "4px solid var(--primary-light)",
          borderTop: "4px solid var(--primary)",
          borderRadius: "50%",
          animation: "spin 1s linear infinite"
        }}></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "30px" }}>
      <h1 style={{ marginTop: 0 }}>📊 Admin Dashboard</h1>
      <p style={{ color: "var(--text-secondary)" }}>Welcome to your store management hub. Monitor your business performance below.</p>

      {error && (
        <div style={{ 
          background: "var(--danger-light)", 
          color: "var(--danger)", 
          padding: "12px", 
          marginBottom: "20px", 
          borderRadius: "4px",
          border: "1px solid var(--danger)"
        }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "20px",
        marginTop: "30px",
      }}>
        <div style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "var(--shadow-md)",
          transition: "transform 0.2s",
          cursor: "pointer"
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-5px)"}
        onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ margin: "0 0 8px 0", opacity: 0.9, fontSize: "0.9em" }}>TOTAL PRODUCTS</p>
              <p style={{ fontSize: "32px", margin: 0, fontWeight: "700" }}>{stats.totalProducts}</p>
            </div>
            <div style={{ fontSize: "40px" }}>📦</div>
          </div>
        </div>

        <div style={{
          background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
          color: "white",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "var(--shadow-md)",
          transition: "transform 0.2s",
          cursor: "pointer"
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-5px)"}
        onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ margin: "0 0 8px 0", opacity: 0.9, fontSize: "0.9em" }}>TOTAL USERS</p>
              <p style={{ fontSize: "32px", margin: 0, fontWeight: "700" }}>{stats.totalUsers}</p>
            </div>
            <div style={{ fontSize: "40px" }}>👥</div>
          </div>
        </div>

        <div style={{
          background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
          color: "white",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "var(--shadow-md)",
          transition: "transform 0.2s",
          cursor: "pointer"
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-5px)"}
        onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ margin: "0 0 8px 0", opacity: 0.9, fontSize: "0.9em" }}>TOTAL ORDERS</p>
              <p style={{ fontSize: "32px", margin: 0, fontWeight: "700" }}>{stats.totalOrders}</p>
            </div>
            <div style={{ fontSize: "40px" }}>📋</div>
          </div>
        </div>

        <div style={{
          background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
          color: "white",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "var(--shadow-md)",
          transition: "transform 0.2s",
          cursor: "pointer"
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-5px)"}
        onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ margin: "0 0 8px 0", opacity: 0.9, fontSize: "0.9em" }}>TOTAL REVENUE</p>
              <p style={{ fontSize: "32px", margin: 0, fontWeight: "700" }}>${stats.totalRevenue.toFixed(2)}</p>
            </div>
            <div style={{ fontSize: "40px" }}>💰</div>
          </div>
        </div>
      </div>

      {/* Quick Stats Section */}
      <div style={{
        marginTop: "40px",
        background: "white",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "var(--shadow-md)"
      }}>
        <h2 style={{ marginTop: 0, color: "var(--primary)" }}>Quick Overview</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}>
          <div>
            <p style={{ margin: "0 0 5px 0", color: "var(--text-secondary)", fontSize: "0.9em" }}>Average Order Value</p>
            <p style={{ margin: 0, fontSize: "1.3em", fontWeight: "600", color: "var(--primary)" }}>
              ${stats.totalOrders > 0 ? (stats.totalRevenue / stats.totalOrders).toFixed(2) : "0.00"}
            </p>
          </div>
          <div>
            <p style={{ margin: "0 0 5px 0", color: "var(--text-secondary)", fontSize: "0.9em" }}>Active Users</p>
            <p style={{ margin: 0, fontSize: "1.3em", fontWeight: "600", color: "var(--primary)" }}>
              {stats.totalUsers}
            </p>
          </div>
          <div>
            <p style={{ margin: "0 0 5px 0", color: "var(--text-secondary)", fontSize: "0.9em" }}>Inventory Items</p>
            <p style={{ margin: 0, fontSize: "1.3em", fontWeight: "600", color: "var(--primary)" }}>
              {stats.totalProducts}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
