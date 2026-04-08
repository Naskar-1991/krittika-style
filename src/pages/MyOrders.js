import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { ReturnsContext } from "../context/ReturnsContext";
import { useNavigate, Link } from "react-router-dom";
import ReturnRequestModal from "../components/ReturnRequestModal";
import "./MyOrders.css";
import API_URL from "../api_connection/BackendAPIConnection";

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

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    fetchOrders();
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
      case "pending":
        return "⏳";
      case "processing":
        return "⚙️";
      case "shipped":
        return "🚚";
      case "delivered":
        return "✅";
      case "cancelled":
        return "❌";
      default:
        return "📦";
    }
  };

  const getShiprocketStatusIcon = (status) => {
    if (!status) return "📦";
    switch (status.toLowerCase()) {
      case "pickup_pending":
        return "📍";
      case "pickup_done":
        return "📦";
      case "ready_to_ship":
        return "🔄";
      case "in_transit":
        return "🚛";
      case "out_for_delivery":
        return "🚚";
      case "delivered":
        return "✅";
      case "cancelled":
        return "❌";
      case "lost_in_transit":
        return "⚠️";
      case "rto_initiated":
        return "↩️";
      case "rto_delivered":
        return "↩️✅";
      default:
        return "🚚";
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
      <div className="container">
        <div className="orders-header">
          <h1>📦 My Orders</h1>
          <p className="orders-count">You have {orders.length} order(s)</p>
        </div>

        {error && (
          <div className="error-banner">
            <span>⚠️ {error}</span>
            <button onClick={fetchOrders} className="retry-btn">Retry</button>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="no-orders">
            <span className="no-orders-emoji">📭</span>
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
                        <h3>📍 Tracking Information</h3>
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
                                    📍 {history.location}
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
                          🌐 Track on Shiprocket
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
                            👁️ View
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
                    {order.tracking_number && (
                      <a 
                        href={`https://www.shiprocket.in/tracking/${order.tracking_number}/`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn-track"
                      >
                    {order.status === "delivered" && returnCheckResults[order.id]?.can_return && (
                      <button
                        className="btn-return"
                        onClick={() => setReturnModal(order)}
                        title="Request a return"
                      >
                        🔄 Request Return
                      </button>
                    )}
                        📍 Track Shipment
                      </a>
                    )}
                    {order.status !== "cancelled" && !order.tracking_number && (
                      <button className="btn-track" disabled title="Tracking not available yet">
                        📍 Track Order
                      </button>
                    )}
                    {order.status !== "cancelled" && order.status !== "delivered" && (
                      <button className="btn-cancel">Cancel Order</button>
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
    </div>
  );
}

export default MyOrders;
