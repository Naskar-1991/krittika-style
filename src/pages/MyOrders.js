import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { ReturnsContext } from "../context/ReturnsContext";
import { useNavigate, Link } from "react-router-dom";
import ReturnRequestModal from "../components/ReturnRequestModal";
import TrackOrderModal from "../components/TrackOrderModal";
import SEOHead from "../components/SEOHead";
import "./MyOrders.css";
import API_URL from "../api_connection/BackendAPIConnection";

/* ── Order status icon components ── */
const IcoBox       = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;
const IcoTruck     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>;
const IcoCheck     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoX         = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcoCog       = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>;
const IcoRefresh   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>;
const IcoWarn      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IcoEye       = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IcoPin       = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;

function MyOrders() {
  const { user } = useContext(AuthContext);
  const { checkCanReturn } = useContext(ReturnsContext);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [expandedTracking, setExpandedTracking] = useState(null);
  const [returnModal, setReturnModal] = useState(null);
  const [returnCheckResults, setReturnCheckResults] = useState({});
  const [trackModal, setTrackModal] = useState(null);
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    fetchOrders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/orders/user/my-orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await response.json();
      
      // Check return eligibility for each order
      data.forEach(async (order) => {
        const result = await checkCanReturn(order.id);
        if (result) {
          setReturnCheckResults(prev => ({
            ...prev,
            [order.id]: result,
          }));
        }
      });

      setOrders(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
      console.error("Error fetching orders:", err);
    }
  };

  const cancelOrder = async (orderId) => {
    setCancelLoading(true);
    setCancelError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/orders/${orderId}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error(`Server error (${res.status}). Please restart the backend and try again.`);
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to cancel order");

      // Update order in-place
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "cancelled" } : o))
      );

      // Close modal — but if Shiprocket sync failed, show a warning first
      if (data.shiprocketError) {
        setCancelError(
          `Order cancelled locally, but Shiprocket sync failed: ${data.shiprocketError}. ` +
          `Please cancel it manually in your Shiprocket dashboard.`
        );
        // Leave modal open so user sees the warning, but order is already cancelled
      } else {
        setCancelModal(null);
      }
    } catch (err) {
      setCancelError(err.message);
    } finally {
      setCancelLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "pending":
        return "badge-pending";
      case "processing":
        return "badge-processing";
      case "shipped":
        return "badge-shipped";
      case "delivered":
        return "badge-delivered";
      case "cancelled":
        return "badge-cancelled";
      default:
        return "badge-pending";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":    return <IcoBox />;
      case "processing": return <IcoCog />;
      case "shipped":    return <IcoTruck />;
      case "delivered":  return <IcoCheck />;
      case "cancelled":  return <IcoX />;
      default:           return <IcoBox />;
    }
  };

  const getShiprocketStatusIcon = (status) => {
    if (!status) return <IcoBox />;
    switch (status.toLowerCase()) {
      case "pickup_pending":  return <IcoBox />;
      case "pickup_done":     return <IcoBox />;
      case "ready_to_ship":   return <IcoRefresh />;
      case "in_transit":      return <IcoTruck />;
      case "out_for_delivery":return <IcoTruck />;
      case "delivered":       return <IcoCheck />;
      case "cancelled":       return <IcoX />;
      case "lost_in_transit": return <IcoWarn />;
      case "rto_initiated":   return <IcoRefresh />;
      case "rto_delivered":   return <IcoCheck />;
      default:                return <IcoTruck />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatSimpleDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="my-orders-page">
        <div className="container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your orders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-orders-page">
      <SEOHead title="My Orders" noindex={true} />
      <div className="container">
        <div className="orders-header">
          <h1>My Orders</h1>
          <p className="orders-count">You have {orders.length} order(s)</p>
        </div>

        {error && (
          <div className="error-banner">
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><IcoWarn /> {error}</span>
            <button onClick={fetchOrders} className="retry-btn">Retry</button>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="no-orders">
            <span className="no-orders-emoji" style={{ display: "flex", justifyContent: "center", color: "var(--text-light)" }}><IcoBox /></span>
            <h2>No Orders Yet</h2>
            <p>You haven't placed any orders yet.</p>
            <a href="/products" className="btn-shop-now">
              Continue Shopping
            </a>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <div className="order-info">
                    <div className="order-id">Order #{order.id}</div>
                    <div className="order-date">{formatDate(order.created_at)}</div>
                  </div>
                  <div className={`order-status ${getStatusBadgeClass(order.status)}`}>
                    <span className="status-icon">{getStatusIcon(order.status)}</span>
                    <span className="status-text">{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                  </div>
                </div>

                {order.shipping_info && (
                  <div className="order-shipping">
                    <strong>Shipping To:</strong>
                    <p>
                      {order.shipping_info.firstName} {order.shipping_info.lastName}
                    </p>
                    <p>
                      {order.shipping_info.address}, {order.shipping_info.city}, {order.shipping_info.state} {order.shipping_info.zipcode}
                    </p>
                    <p>{order.shipping_info.country}</p>
                  </div>
                )}

                {/* Tracking Information Section */}
                {order.tracking_number && (
                  <div className="order-tracking-section">
                    <div className="tracking-header">
                      <div className="tracking-info">
                        <h3><IcoPin /> Tracking Information</h3>
                        <div className="tracking-details">
                          <div className="tracking-item">
                            <span className="tracking-label">Tracking Number:</span>
                            <span className="tracking-value">{order.tracking_number}</span>
                          </div>
                          {order.carrier_name && (
                            <div className="tracking-item">
                              <span className="tracking-label">Carrier:</span>
                              <span className="tracking-value">{order.carrier_name}</span>
                            </div>
                          )}
                          {order.shiprocket_status && (
                            <div className="tracking-item">
                              <span className="tracking-label">Status:</span>
                              <span className="tracking-value">
                                {getShiprocketStatusIcon(order.shiprocket_status)} {order.shiprocket_status.replace(/_/g, ' ').toUpperCase()}
                              </span>
                            </div>
                          )}
                          {order.estimated_delivery_date && (
                            <div className="tracking-item">
                              <span className="tracking-label">Est. Delivery:</span>
                              <span className="tracking-value">{formatSimpleDate(order.estimated_delivery_date)}</span>
                            </div>
                          )}
                          {order.actual_delivery_date && (
                            <div className="tracking-item">
                              <span className="tracking-label">Delivered:</span>
                              <span className="tracking-value">{formatSimpleDate(order.actual_delivery_date)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        className="toggle-tracking-btn"
                        onClick={() =>
                          setExpandedTracking(
                            expandedTracking === order.id ? null : order.id
                          )
                        }
                        title="View tracking history"
                      >
                        {expandedTracking === order.id ? "Hide History ▲" : "View History ▼"}
                      </button>
                    </div>

                    {/* Tracking History Timeline */}
                    {expandedTracking === order.id && order.trackingHistory && order.trackingHistory.length > 0 && (
                      <div className="tracking-history">
                        <h4>Tracking History</h4>
                        <div className="history-timeline">
                          {order.trackingHistory.map((history, idx) => (
                            <div key={idx} className="history-event">
                              <div className="event-marker"></div>
                              <div className="event-content">
                                <div className="event-status">
                                  <strong>{history.status.replace(/_/g, ' ').toUpperCase()}</strong>
                                </div>
                                {history.location && (
                                  <div className="event-location">
                                    <IcoPin /> {history.location}
                                  </div>
                                )}
                                {history.timestamp && (
                                  <div className="event-time">
                                    {formatDate(history.timestamp)}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tracking URL */}
                    {order.tracking_url && (
                      <div className="tracking-url-section">
                        <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" className="btn-track-external">
                          Track on Shiprocket →
                        </a>
                      </div>
                    )}
                  </div>
                )}

                <button
                  className="toggle-items-btn"
                  onClick={() =>
                    setExpandedOrder(
                      expandedOrder === order.id ? null : order.id
                    )
                  }
                >
                  {expandedOrder === order.id ? "Hide Items ▲" : "View Items ▼"}
                </button>

                {expandedOrder === order.id && (
                  <div className="order-items">
                    <div className="items-header">
                      <span>Product</span>
                      <span>Qty</span>
                      <span>Price</span>
                      <span>Total</span>
                      <span>Action</span>
                    </div>
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item) => (
                        <div key={item.id} className="order-item">
                          <span className="product-name">{item.name}</span>
                          <span className="quantity">×{item.quantity}</span>
                          <span className="price">₹{item.price}</span>
                          <span className="total">
                            ₹{(item.quantity * item.price).toFixed(2)}
                          </span>
                          <Link
                            to={`/product/${item.product_id}`}
                            className="view-product-btn"
                            title="View Product Details"
                          >
                            <IcoEye /> View
                          </Link>
                        </div>
                      ))
                    ) : (
                      <div className="no-items">No items in order</div>
                    )}
                  </div>
                )}

                <div className="order-footer">
                  <div className="total-amount">
                    <span>Total Amount:</span>
                    <span className="amount">₹{parseFloat(order.total_amount).toFixed(2)}</span>
                  </div>
                  <div className="order-actions">
                    {order.status === "delivered" && returnCheckResults[order.id]?.can_return && (
                      <button
                        className="btn-return"
                        onClick={() => setReturnModal(order)}
                        title="Request a return"
                      >
                        <IcoRefresh /> Request Return
                      </button>
                    )}
                    {order.status !== "cancelled" && (
                      <button
                        className="btn-track"
                        onClick={() => setTrackModal(order)}
                        title="Track your order"
                      >
                        <IcoPin /> {order.tracking_number ? "Track Shipment" : "Track Order"}
                      </button>
                    )}
                    {order.status !== "cancelled" && order.status !== "delivered" && (
                      <button
                        className="btn-cancel"
                        onClick={() => { setCancelError(""); setCancelModal(order); }}
                        disabled={order.status === "shipped"}
                        title={order.status === "shipped" ? "Order already shipped — cannot cancel" : "Cancel this order"}
                      >
                        <IcoX /> Cancel Order
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Return Request Modal */}
      {returnModal && (
        <ReturnRequestModal
          order={returnModal}
          items={returnModal.items || []}
          onClose={() => setReturnModal(null)}
          onSuccess={() => {
            setReturnModal(null);
            alert("Return request created successfully!");
            navigate("/returns");
          }}
        />
      )}

      {/* Track Order Modal */}
      {trackModal && (
        <TrackOrderModal
          order={trackModal}
          onClose={() => setTrackModal(null)}
        />
      )}

      {/* Cancel Order Confirmation Modal */}
      {cancelModal && (
        <div
          className="cancel-modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget && !cancelLoading) { setCancelModal(null); setCancelError(""); } }}
        >
          <div className="cancel-modal">
            <div className="cancel-modal-header">
              <h2>Cancel Order</h2>
            </div>
            <div className="cancel-modal-body">
              <div className="cancel-warning-icon"><IcoWarn /></div>
              <p className="cancel-confirm-text">
                Are you sure you want to cancel <strong>Order #{cancelModal.id}</strong>?
              </p>
              <p className="cancel-sub-text">
                Total: <strong>₹{parseFloat(cancelModal.total_amount).toFixed(2)}</strong>
              </p>
              <p className="cancel-note">
                This action cannot be undone. If your order has already been dispatched, it cannot be cancelled.
              </p>
              {cancelError && (
                <div className={cancelError.includes("locally") ? "cancel-warning" : "cancel-error"}>
                  {cancelError.includes("locally") ? <IcoWarn /> : <IcoX />} {cancelError}
                </div>
              )}
            </div>
            <div className="cancel-modal-footer">
              <button
                className="cancel-modal-btn-back"
                onClick={() => { setCancelModal(null); setCancelError(""); }}
                disabled={cancelLoading}
              >
                {cancelError.includes("locally") ? "Close" : "Go Back"}
              </button>
              <button
                className="cancel-modal-btn-confirm"
                onClick={() => cancelOrder(cancelModal.id)}
                disabled={cancelLoading || cancelError.includes("locally")}
              >
                {cancelLoading ? "Cancelling..." : "Yes, Cancel Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyOrders;
