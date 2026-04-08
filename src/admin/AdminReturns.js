import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./AdminReturns.css";

const AdminReturns = () => {
  const { user, isAdmin } = useContext(AuthContext);
  const navigate = useNavigate();
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [stats, setStats] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5500/api";

  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
    }
  }, [isAdmin, navigate]);

  useEffect(() => {
    fetchReturns();
    fetchStats();
  }, [filterStatus]);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const query = filterStatus ? `?status=${filterStatus}` : "";
      const response = await fetch(`${API_URL}/admin/returns${query}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch returns");
      const data = await response.json();
      setReturns(data.returns);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/returns/stats/summary`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch stats");
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const getActionButtons = (ret) => {
    switch (ret.status) {
      case "pending":
        return ["approve", "reject"];
      case "approved":
        return ["received"];
      case "received":
        return ["refund"];
      case "refunded":
      case "rejected":
      case "cancelled":
        return [];
      default:
        return [];
    }
  };

  const handleAction = async (returnId, action) => {
    setActionLoading(true);
    try {
      const url = `${API_URL}/admin/returns/${returnId}/${action}`;
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          message: "Admin action performed",
        }),
      });

      if (!response.ok) throw new Error(`Failed to ${action} return`);

      await fetchReturns();
      await fetchStats();
      setSelectedReturn(null);
      alert(`Return ${action}ed successfully!`);
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "#FFA500",
      approved: "#4CAF50",
      shipped: "#2196F3",
      received: "#3F51B5",
      refunded: "#28a745",
      rejected: "#f44336",
      cancelled: "#999",
    };
    return colors[status] || "#666";
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: "⏳",
      approved: "✓",
      shipped: "📦",
      received: "📥",
      refunded: "💰",
      rejected: "✕",
      cancelled: "🚫",
    };
    return icons[status] || "•";
  };

  if (!isAdmin) return null;

  return (
    <div className="admin-returns-container">
      <div className="returns-page-header">
        <h1>📦 Returns Management</h1>
        <p>Manage customer return requests and refunds</p>
      </div>

      {/* Stats Dashboard */}
      {stats && (
        <div className="stats-dashboard">
          <div className="stat-card">
            <div className="stat-number">{stats.total_returns}</div>
            <div className="stat-label">Total Returns</div>
          </div>
          <div className="stat-card pending">
            <div className="stat-number">{stats.pending_returns}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card approved">
            <div className="stat-number">{stats.approved_returns}</div>
            <div className="stat-label">Approved</div>
          </div>
          <div className="stat-card refunded">
            <div className="stat-number">{stats.refunded_returns}</div>
            <div className="stat-label">Refunded</div>
          </div>
          <div className="stat-card amount">
            <div className="stat-number">₹{parseFloat(stats.total_refunded).toFixed(0)}</div>
            <div className="stat-label">Total Refunded</div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="filter-section">
        <label>Filter by Status:</label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="">All Returns</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="shipped">Shipped</option>
          <option value="received">Received</option>
          <option value="refunded">Refunded</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Returns Table */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading returns...</p>
        </div>
      ) : returns.length === 0 ? (
        <div className="empty-state">
          <p>No return requests found</p>
        </div>
      ) : (
        <div className="returns-table-container">
          <table className="returns-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Order</th>
                <th>Reason</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Items</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {returns.map((ret) => (
                <tr key={ret.id} className="return-row">
                  <td className="return-id">#{ret.id}</td>
                  <td>{ret.name}</td>
                  <td>#{ret.order_id}</td>
                  <td>{ret.reason}</td>
                  <td>₹{parseFloat(ret.refund_amount).toFixed(2)}</td>
                  <td>
                    <span className="status-badge" style={{ backgroundColor: getStatusColor(ret.status) }}>
                      {getStatusIcon(ret.status)} {ret.status}
                    </span>
                  </td>
                  <td>{ret.item_count}</td>
                  <td>{new Date(ret.created_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="view-btn"
                      onClick={() => setSelectedReturn(ret)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Return Details Modal */}
      {selectedReturn && (
        <div className="modal-overlay" onClick={() => setSelectedReturn(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Return #{selectedReturn.id} Details</h2>
              <button className="close-btn" onClick={() => setSelectedReturn(null)}>✕</button>
            </div>

            <div className="modal-content">
              <div className="detail-section">
                <h3>Customer Information</h3>
                <div className="detail-row">
                  <label>Name:</label>
                  <span>{selectedReturn.name}</span>
                </div>
                <div className="detail-row">
                  <label>Email:</label>
                  <span>{selectedReturn.email}</span>
                </div>
              </div>

              <div className="detail-section">
                <h3>Return Details</h3>
                <div className="detail-row">
                  <label>Status:</label>
                  <span style={{ color: getStatusColor(selectedReturn.status) }}>
                    {getStatusIcon(selectedReturn.status)} {selectedReturn.status}
                  </span>
                </div>
                <div className="detail-row">
                  <label>Reason:</label>
                  <span>{selectedReturn.reason}</span>
                </div>
                {selectedReturn.description && (
                  <div className="detail-row">
                    <label>Description:</label>
                    <span>{selectedReturn.description}</span>
                  </div>
                )}
                <div className="detail-row">
                  <label>Refund Amount:</label>
                  <span>₹{parseFloat(selectedReturn.refund_amount).toFixed(2)}</span>
                </div>
              </div>

              <div className="action-buttons">
                {getActionButtons(selectedReturn).map((action) => (
                  <button
                    key={action}
                    className={`action-btn btn-${action}`}
                    onClick={() => handleAction(selectedReturn.id, action)}
                    disabled={actionLoading}
                  >
                    {action.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReturns;
