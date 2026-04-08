import React, { useState, useEffect } from "react";
import API_URL from "../api_connection/BackendAPIConnection";
const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${API_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch orders");
      const data = await response.json();
      setOrders(data);
      setError("");
    } catch (err) {
      setError(err.message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId) => {
    try {
      setLoadingDetails(true);
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${API_URL}/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch order details");
      const data = await response.json();
      
      // Parse shipping_info JSONB if it's a string
      if (data.shipping_info && typeof data.shipping_info === 'string') {
        const shippingParsed = JSON.parse(data.shipping_info);
        data.shipping_name = `${shippingParsed.firstName} ${shippingParsed.lastName}`;
        data.shipping_address = shippingParsed.address;
        data.shipping_city = shippingParsed.city;
        data.shipping_state = shippingParsed.state;
        data.shipping_zip = shippingParsed.zipcode;
        data.shipping_phone = shippingParsed.phone;
      } else if (data.shipping_info && typeof data.shipping_info === 'object') {
        data.shipping_name = `${data.shipping_info.firstName} ${data.shipping_info.lastName}`;
        data.shipping_address = data.shipping_info.address;
        data.shipping_city = data.shipping_info.city;
        data.shipping_state = data.shipping_info.state;
        data.shipping_zip = data.shipping_info.zipcode;
        data.shipping_phone = data.shipping_info.phone;
      }
      
      setSelectedOrderDetails(data);
      setSelectedOrderId(orderId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setUpdatingStatus(true);
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error("Failed to update order status");
      
      // Update local state
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrderDetails?.id === orderId) {
        setSelectedOrderDetails({ ...selectedOrderDetails, status: newStatus });
      }
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/orders/${orderId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Failed to delete order");
      
      setOrders(orders.filter(o => o.id !== orderId));
      if (selectedOrderId === orderId) {
        setSelectedOrderId(null);
        setSelectedOrderDetails(null);
      }
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#FFA500";
      case "processing":
        return "#2563eb";
      case "shipped":
        return "#8B4513";
      case "delivered":
        return "#22c55e";
      case "cancelled":
        return "#dc2626";
      default:
        return "#6b7280";
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "#22c55e";
      case "pending":
        return "#FFA500";
      case "failed":
        return "#dc2626";
      case "refunded":
        return "#8b5cf6";
      default:
        return "#6b7280";
    }
  };

  const getPaymentStatusEmoji = (status) => {
    switch (status) {
      case "completed":
        return "✅";
      case "pending":
        return "⏳";
      case "failed":
        return "❌";
      case "refunded":
        return "🔄";
      default:
        return "❓";
    }
  };

  const getStatusEmoji = (status) => {
    switch (status) {
      case "pending":
        return "⏳";
      case "processing":
        return "⚙️";
      case "shipped":
        return "📦";
      case "delivered":
        return "✅";
      case "cancelled":
        return "❌";
      default:
        return "❓";
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
        <p>Loading orders...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ margin: 0 }}>📋 Manage Orders</h1>
        <span style={{
          background: "var(--primary)",
          color: "white",
          padding: "8px 16px",
          borderRadius: "20px",
          fontWeight: "600"
        }}>
          Total: {orders.length}
        </span>
      </div>

      {error && (
        <div style={{ 
          background: "var(--danger-light)", 
          color: "var(--danger)", 
          padding: "12px", 
          marginBottom: "20px", 
          borderRadius: "4px",
          border: "1px solid var(--danger)"
        }}>
          ❌ {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: selectedOrderId ? "1fr 1fr" : "1fr", gap: "20px" }}>
        {/* Orders List */}
        <div style={{
          background: "white",
          borderRadius: "8px",
          boxShadow: "var(--shadow-md)",
          overflow: "hidden"
        }}>
          <div style={{
            overflowX: "auto",
            maxHeight: "600px",
            overflowY: "auto"
          }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse"
            }}>
              <thead style={{ position: "sticky", top: 0 }}>
                <tr style={{ 
                  background: "var(--primary-light)",
                  borderBottom: "2px solid var(--primary)"
                }}>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "var(--primary)" }}>Order ID</th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "var(--primary)" }}>Customer</th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "var(--primary)" }}>Amount</th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "var(--primary)" }}>Order Status</th>
                  <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "var(--primary)" }}>Payment</th>
                  <th style={{ padding: "12px", textAlign: "center", fontWeight: "600", color: "var(--primary)" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: "20px", textAlign: "center", color: "var(--text-secondary)" }}>
                      No orders found
                    </td>
                  </tr>
                ) : (
                  orders.map(order => (
                    <tr 
                      key={order.id}
                      style={{
                        borderBottom: "1px solid var(--border)",
                        background: selectedOrderId === order.id ? "var(--primary-light)" : "transparent",
                        cursor: "pointer",
                        transition: "background-color 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        if (selectedOrderId !== order.id) {
                          e.currentTarget.style.background = "#f3f4f6";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedOrderId !== order.id) {
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      <td style={{ padding: "12px", fontWeight: "500" }}>#{order.id}</td>
                      <td style={{ padding: "12px", fontSize: "0.9em" }}>{order.user_name}</td>
                      <td style={{ padding: "12px", fontWeight: "500" }}>₹{parseFloat(order.total_amount).toFixed(2)}</td>
                      <td style={{ padding: "12px" }}>
                        <span style={{
                          display: "inline-block",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          background: getStatusColor(order.status) + "22",
                          color: getStatusColor(order.status),
                          fontWeight: "500",
                          fontSize: "0.85em"
                        }}>
                          {getStatusEmoji(order.status)} {order.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span style={{
                          display: "inline-block",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          background: getPaymentStatusColor(order.payment_status || "pending") + "22",
                          color: getPaymentStatusColor(order.payment_status || "pending"),
                          fontWeight: "500",
                          fontSize: "0.85em"
                        }}>
                          {getPaymentStatusEmoji(order.payment_status || "pending")} {order.payment_status || "pending"}
                        </span>
                      </td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <button
                          onClick={() => fetchOrderDetails(order.id)}
                          style={{
                            padding: "6px 12px",
                            background: "var(--primary)",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "0.85em"
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Details */}
        {selectedOrderId && selectedOrderDetails && (
          <div style={{
            background: "white",
            borderRadius: "8px",
            boxShadow: "var(--shadow-md)",
            padding: "20px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: 0, color: "var(--primary)" }}>Order #{selectedOrderDetails.id} Details</h2>
              <button
                onClick={() => {
                  setSelectedOrderId(null);
                  setSelectedOrderDetails(null);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer"
                }}
              >
                ✕
              </button>
            </div>

            {/* Payment Information */}
            <div style={{ marginBottom: "20px", paddingBottom: "20px", borderBottom: "1px solid var(--border)" }}>
              <h3 style={{ marginTop: 0, color: "var(--text-primary)" }}>💳 Payment Information</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div style={{ background: "#f9f9f9", padding: "12px", borderRadius: "4px" }}>
                  <p style={{ margin: "0 0 4px 0", fontSize: "0.85em", color: "#666" }}>Payment Status</p>
                  <span style={{
                    display: "inline-block",
                    padding: "6px 12px",
                    borderRadius: "4px",
                    background: getPaymentStatusColor(selectedOrderDetails.payment_status || "pending") + "22",
                    color: getPaymentStatusColor(selectedOrderDetails.payment_status || "pending"),
                    fontWeight: "600",
                    fontSize: "0.95em"
                  }}>
                    {getPaymentStatusEmoji(selectedOrderDetails.payment_status || "pending")} {(selectedOrderDetails.payment_status || "pending").toUpperCase()}
                  </span>
                </div>
                <div style={{ background: "#f9f9f9", padding: "12px", borderRadius: "4px" }}>
                  <p style={{ margin: "0 0 4px 0", fontSize: "0.85em", color: "#666" }}>Payment Amount</p>
                  <p style={{ margin: 0, fontWeight: "600" }}>₹{parseFloat(selectedOrderDetails.payment_amount || selectedOrderDetails.total_amount).toFixed(2)}</p>
                </div>
                <div style={{ background: "#f9f9f9", padding: "12px", borderRadius: "4px" }}>
                  <p style={{ margin: "0 0 4px 0", fontSize: "0.85em", color: "#666" }}>Payment Method</p>
                  <p style={{ margin: 0, fontWeight: "500" }}>{selectedOrderDetails.payment_method ? `💳 ${selectedOrderDetails.payment_method}` : "Not specified"}</p>
                </div>
                <div style={{ background: "#f9f9f9", padding: "12px", borderRadius: "4px" }}>
                  <p style={{ margin: "0 0 4px 0", fontSize: "0.85em", color: "#666" }}>Payment Date</p>
                  <p style={{ margin: 0, fontWeight: "500" }}>
                    {selectedOrderDetails.payment_date 
                      ? new Date(selectedOrderDetails.payment_date).toLocaleString() 
                      : "Pending"}
                  </p>
                </div>
              </div>
              {selectedOrderDetails.razorpay_order_id && (
                <div style={{ background: "#f9f9f9", padding: "12px", borderRadius: "4px", fontSize: "0.9em" }}>
                  <p style={{ margin: "0 0 4px 0", color: "#666" }}>Transaction IDs</p>
                  <p style={{ margin: "4px 0", fontFamily: "monospace", fontSize: "0.85em" }}>
                    <strong>Order ID:</strong> {selectedOrderDetails.razorpay_order_id}
                  </p>
                  {selectedOrderDetails.razorpay_payment_id && (
                    <p style={{ margin: "4px 0", fontFamily: "monospace", fontSize: "0.85em" }}>
                      <strong>Payment ID:</strong> {selectedOrderDetails.razorpay_payment_id}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Shipping Information */}
            <div style={{ marginBottom: "20px", paddingBottom: "20px", borderBottom: "1px solid var(--border)" }}>
              <h3 style={{ marginTop: 0, color: "var(--text-primary)" }}>📍 Shipping Address</h3>
              <div style={{ background: "#f9f9f9", padding: "12px", borderRadius: "4px", lineHeight: "1.6" }}>
                <p style={{ margin: 0 }}><strong>{selectedOrderDetails.shipping_name || "N/A"}</strong></p>
                <p style={{ margin: "4px 0" }}>{selectedOrderDetails.shipping_address || "N/A"}</p>
                <p style={{ margin: "4px 0" }}>{selectedOrderDetails.shipping_city || ""}, {selectedOrderDetails.shipping_state || ""} {selectedOrderDetails.shipping_zip || ""}</p>
                <p style={{ margin: "4px 0" }}>📞 {selectedOrderDetails.shipping_phone || "N/A"}</p>
              </div>
            </div>

            {/* Status Update */}
            <div style={{ marginBottom: "20px", paddingBottom: "20px", borderBottom: "1px solid var(--border)" }}>
              <h3 style={{ marginTop: 0, color: "var(--text-primary)" }}>Update Status</h3>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {["pending", "processing", "shipped", "delivered", "cancelled"].map(status => (
                  <button
                    key={status}
                    onClick={() => handleUpdateStatus(selectedOrderDetails.id, status)}
                    disabled={updatingStatus || selectedOrderDetails.status === status}
                    style={{
                      padding: "8px 16px",
                      background: selectedOrderDetails.status === status ? getStatusColor(status) : "transparent",
                      color: selectedOrderDetails.status === status ? "white" : getStatusColor(status),
                      border: `2px solid ${getStatusColor(status)}`,
                      borderRadius: "4px",
                      cursor: updatingStatus || selectedOrderDetails.status === status ? "not-allowed" : "pointer",
                      fontWeight: "500",
                      opacity: selectedOrderDetails.status === status ? 1 : 0.7,
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => {
                      if (selectedOrderDetails.status !== status && !updatingStatus) {
                        e.target.style.background = getStatusColor(status) + "22";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedOrderDetails.status !== status) {
                        e.target.style.background = "transparent";
                      }
                    }}
                  >
                    {getStatusEmoji(status)} {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Order Items */}
            <div style={{ marginBottom: "20px" }}>
              <h3 style={{ marginTop: 0, color: "var(--text-primary)" }}>Items</h3>
              {loadingDetails ? (
                <p>Loading items...</p>
              ) : selectedOrderDetails.items && selectedOrderDetails.items.length > 0 ? (
                <div>
                  {selectedOrderDetails.items.map((item, index) => (
                    <div key={index} style={{
                      display: "flex",
                      gap: "12px",
                      padding: "12px",
                      background: "#f9f9f9",
                      borderRadius: "4px",
                      marginBottom: "8px"
                    }}>
                      {item.image && (
                        <img 
                          src={item.image} 
                          alt={item.name}
                          style={{
                            width: "60px",
                            height: "60px",
                            objectFit: "cover",
                            borderRadius: "4px"
                          }}
                        />
                      )}
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: "0 0 5px 0", fontWeight: "500" }}>{item.name}</p>
                        <p style={{ margin: "0", color: "var(--text-secondary)", fontSize: "0.9em" }}>
                          Qty: {item.quantity} × ${parseFloat(item.price).toFixed(2)}
                        </p>
                      </div>
                      <div style={{ textAlign: "right", fontWeight: "500" }}>
                        ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}

                  {/* Total */}
                  <div style={{
                    marginTop: "12px",
                    paddingTop: "12px",
                    borderTop: "2px solid var(--border)",
                    fontSize: "1.1em",
                    fontWeight: "600",
                    color: "var(--primary)"
                  }}>
                    Total Amount: ${parseFloat(selectedOrderDetails.total_amount).toFixed(2)}
                  </div>
                </div>
              ) : (
                <p>No items in this order</p>
              )}
            </div>

            {/* Delete Button */}
            <button
              onClick={() => handleDeleteOrder(selectedOrderDetails.id)}
              style={{
                width: "100%",
                padding: "10px",
                background: "var(--danger)",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "500"
              }}
            >
              🗑️ Delete Order
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageOrders;
