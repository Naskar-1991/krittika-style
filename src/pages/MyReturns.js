import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ReturnsContext } from "../context/ReturnsContext";
import { AuthContext } from "../context/AuthContext";
import "./MyReturns.css";

const IcoBox      = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;
const IcoInbox    = () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{opacity:0.35}}><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>;

const MyReturns = () => {
  const { user } = useContext(AuthContext);
  const { returns, loading } = useContext(ReturnsContext);
  const navigate = useNavigate();
  const [selectedReturn, setSelectedReturn] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#FFA500";
      case "approved":
        return "#4CAF50";
      case "shipped":
        return "#2196F3";
      case "received":
        return "#3F51B5";
      case "refunded":
        return "#28a745";
      case "rejected":
        return "#f44336";
      case "cancelled":
        return "#999";
      default:
        return "#666";
    }
  };

  const getStatusIcon = (status) => {
    const s = { strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" };
    switch (status) {
      case "pending":    return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" {...s}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
      case "approved":   return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" {...s}><polyline points="20 6 9 17 4 12"/></svg>;
      case "shipped":    return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" {...s}><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>;
      case "received":   return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" {...s}><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>;
      case "refunded":   return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" {...s}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
      case "rejected":   return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" {...s}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
      case "cancelled":  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" {...s}><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>;
      default:           return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" {...s}><circle cx="12" cy="12" r="2"/></svg>;
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: "Awaiting Review",
      approved: "Approved",
      shipped: "In Transit",
      received: "Received",
      refunded: "Refunded",
      rejected: "Rejected",
      cancelled: "Cancelled",
    };
    return labels[status] || status;
  };

  const getReturnTimeline = (status) => {
    const timeline = [
      { status: "pending", label: "Pending Review" },
      { status: "approved", label: "Approved" },
      { status: "shipped", label: "Shipped to Warehouse" },
      { status: "received", label: "Received" },
      { status: "refunded", label: "Refunded" },
    ];

    const statusOrder = {
      pending: 0,
      approved: 1,
      shipped: 2,
      received: 3,
      refunded: 4,
    };

    const currentPosition = statusOrder[status] ?? -1;

    return timeline.map((step, index) => ({
      ...step,
      completed: index <= currentPosition && status !== "rejected" && status !== "cancelled",
      current: index === currentPosition,
    }));
  };

  if (!user) return null;

  return (
    <div className="my-returns-container">
      <div className="returns-header">
        <h1><IcoBox /> My Returns & Refunds</h1>
        <p>Track your return requests and refund status</p>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading returns...</p>
        </div>
      ) : returns.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><IcoInbox /></div>
          <h2>No returns yet</h2>
          <p>You haven't made any return requests</p>
          <button
            className="go-to-orders-btn"
            onClick={() => navigate("/orders")}
          >
            View Orders
          </button>
        </div>
      ) : (
        <div className="returns-list">
          {returns.map((ret) => (
            <div key={ret.id} className="return-card">
              <div className="return-card-header">
                <div className="return-info">
                  <div className="return-id">Return #{ret.id}</div>
                  <div className="return-order">Order #{ret.order_id}</div>
                  <div className="return-date">
                    {new Date(ret.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="return-status">
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(ret.status) }}
                  >
                    {getStatusIcon(ret.status)} {getStatusLabel(ret.status)}
                  </span>
                </div>
              </div>

              <div className="return-details">
                <div className="detail-row">
                  <label>Reason:</label>
                  <span>{ret.reason}</span>
                </div>
                {ret.description && (
                  <div className="detail-row">
                    <label>Description:</label>
                    <span>{ret.description}</span>
                  </div>
                )}
              </div>

              {/* Timeline */}
              <div className="return-timeline">
                {getReturnTimeline(ret.status).map((step, index) => (
                  <div
                    key={step.status}
                    className={`timeline-step ${
                      step.completed ? "completed" : ""
                    } ${step.current ? "current" : ""}`}
                  >
                    <div className="timeline-circle">
                      {step.completed || step.current ? "✓" : ""}
                    </div>
                    <div className="timeline-label">{step.label}</div>
                    {index < getReturnTimeline(ret.status).length - 1 && (
                      <div
                        className="timeline-connector"
                        style={{
                          opacity: step.completed ? 1 : 0.2,
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="return-actions">
                <button
                  className="view-details-btn"
                  onClick={() => setSelectedReturn(ret)}
                >
                  View Details
                </button>
                {ret.status === "pending" && (
                  <button className="cancel-return-btn" onClick={() => {}}>
                    Cancel Return
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Return Details Modal */}
      {selectedReturn && (
        <div className="return-details-modal-overlay" onClick={() => setSelectedReturn(null)}>
          <div className="return-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Return Details</h2>
              <button className="close-btn" onClick={() => setSelectedReturn(null)}>
                ✕
              </button>
            </div>

            <div className="modal-content">
              <div className="info-section">
                <h3>Return Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Return ID:</label>
                    <value>#{selectedReturn.id}</value>
                  </div>
                  <div className="info-item">
                    <label>Status:</label>
                    <value style={{ color: getStatusColor(selectedReturn.status) }}>
                      {getStatusLabel(selectedReturn.status)}
                    </value>
                  </div>
                  <div className="info-item">
                    <label>Order ID:</label>
                    <value>#{selectedReturn.order_id}</value>
                  </div>
                  <div className="info-item">
                    <label>Order Total:</label>
                    <value>₹{selectedReturn.total_amount}</value>
                  </div>
                </div>
              </div>

              {selectedReturn.tracking_number && (
                <div className="info-section">
                  <h3>Tracking</h3>
                  <div className="tracking-info">
                    <label>Tracking Number:</label>
                    <code>{selectedReturn.tracking_number}</code>
                  </div>
                </div>
              )}

              <div className="info-section">
                <h3>Reason & Description</h3>
                <div>
                  <strong>Reason:</strong> {selectedReturn.reason}
                </div>
                {selectedReturn.description && (
                  <div>
                    <strong>Description:</strong>
                    <p>{selectedReturn.description}</p>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  className="btn-close"
                  onClick={() => setSelectedReturn(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyReturns;
