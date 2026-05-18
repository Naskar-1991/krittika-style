import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import API_URL from "../api_connection/BackendAPIConnection";
import TrackOrderModal from "../components/TrackOrderModal";

const Checkout = () => {
  const { cart, clearCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [showPaymentPicker, setShowPaymentPicker] = useState(false);

  const [formData, setFormData] = useState({
    firstName: user?.name?.split(" ")[0] || "",
    lastName: user?.name?.split(" ")[1] || "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipcode: "",
    country: ""
  });

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Redirect if not logged in
  if (!user) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center" }}>
        <h2>Please Login First</h2>
        <p>You need to be logged in to complete your order.</p>
        <button
          onClick={() => navigate("/login")}
          style={{
            padding: "12px 24px",
            background: "var(--primary)",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "16px"
          }}
        >
          Go to Login
        </button>
      </div>
    );
  }

  // Redirect if cart is empty
  if (cart.length === 0 && !orderPlaced) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center" }}>
        <h2>Your Cart is Empty</h2>
        <p>Add items to your cart before checking out.</p>
        <button
          onClick={() => navigate("/products")}
          style={{
            padding: "12px 24px",
            background: "var(--primary)",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "16px"
          }}
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0).toFixed(2);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Step 1: validate form, create order, then show payment picker
  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.address || !formData.city || !formData.state || !formData.zipcode) {
      setError("Please fill in all required fields");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const totalAmount = parseFloat(getTotalPrice());

      const orderResponse = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          items: cart,
          totalAmount: totalAmount,
          shippingInfo: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            zipcode: formData.zipcode,
            country: formData.country || "India"
          }
        })
      });

      const orderData = await orderResponse.json();
      if (!orderResponse.ok) throw new Error(orderData.error || "Failed to create order");

      setOrderId(orderData.order.id);
      setLoading(false);
      setShowPaymentPicker(true);
    } catch (err) {
      console.error("Order error:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Step 2a: Dummy payment — marks order paid without Razorpay
  const handleDummyPayment = async () => {
    setPaymentProcessing(true);
    setShowPaymentPicker(false);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/payment/dummy-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ orderId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Dummy payment failed");
      setOrderPlaced(true);
      clearCart();
    } catch (err) {
      setError(err.message);
    } finally {
      setPaymentProcessing(false);
    }
  };

  // Step 2b: Real Razorpay payment
  const handleRazorpayPayment = async () => {
    setPaymentProcessing(true);
    setShowPaymentPicker(false);
    const token = localStorage.getItem("token");
    const totalAmount = parseFloat(getTotalPrice());

    try {
      const paymentOrderResponse = await fetch(`${API_URL}/api/payment/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ orderId, amount: totalAmount, email: formData.email, phoneNumber: formData.phone })
      });

      const paymentOrderData = await paymentOrderResponse.json();
      if (!paymentOrderResponse.ok) throw new Error(paymentOrderData.error || "Failed to create payment");

      const options = {
        key: paymentOrderData.keyId,
        amount: paymentOrderData.amount * 100,
        currency: paymentOrderData.currency,
        name: "KrittikaStyle",
        description: `Order #${orderId}`,
        order_id: paymentOrderData.razorpayOrderId,
        handler: async (response) => {
          try {
            const verifyResponse = await fetch(`${API_URL}/api/payment/verify-payment`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                orderId
              })
            });
            const verifyData = await verifyResponse.json();
            if (!verifyResponse.ok) throw new Error(verifyData.error || "Payment verification failed");
            setOrderPlaced(true);
            clearCart();
            setPaymentProcessing(false);
          } catch (err) {
            setError("Payment verified but there was an issue: " + err.message);
            setPaymentProcessing(false);
          }
        },
        prefill: { name: `${formData.firstName} ${formData.lastName}`, email: formData.email, contact: formData.phone },
        notes: { orderId, address: formData.address, city: formData.city },
        theme: { color: "#667eea" },
        modal: {
          ondismiss: async () => {
            setPaymentProcessing(false);
            try {
              await fetch(`${API_URL}/api/payment/handle-failure`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ orderId, reason: "User closed payment modal" })
              });
            } catch (err) {
              console.error("Error marking order as failed:", err);
            }
          }
        }
      };

      if (window.Razorpay) {
        new window.Razorpay(options).open();
      } else {
        throw new Error("Razorpay script failed to load");
      }
    } catch (err) {
      setError(err.message);
      setPaymentProcessing(false);
    }
  };

  // Order Confirmation Screen
  if (orderPlaced) {
    return (
      <div style={{ padding: "40px 20px", maxWidth: "600px", margin: "0 auto" }}>
        <div style={{
          background: "white",
          borderRadius: "8px",
          boxShadow: "var(--shadow-md)",
          padding: "40px",
          textAlign: "center"
        }}>
          <div style={{ fontSize: "48px", marginBottom: "20px" }}>✅</div>
          <h1 style={{ color: "var(--success)", margin: "0 0 10px 0" }}>Order Confirmed!</h1>
          <p style={{ color: "var(--text-secondary)", margin: "0 0 30px 0", fontSize: "1.1em" }}>
            Thank you for your order
          </p>

          <div style={{
            background: "var(--primary-light)",
            padding: "20px",
            borderRadius: "8px",
            marginBottom: "30px"
          }}>
            <p style={{ margin: "0 0 10px 0", color: "var(--text-secondary)" }}>Order ID</p>
            <p style={{ margin: 0, fontSize: "1.5em", fontWeight: "bold", color: "var(--primary)" }}>
              #{orderId}
            </p>
          </div>

          <div style={{
            textAlign: "left",
            background: "#f9f9f9",
            padding: "20px",
            borderRadius: "8px",
            marginBottom: "30px"
          }}>
            <h3 style={{ margin: "0 0 15px 0", color: "var(--primary)" }}>Order Details</h3>
            <p style={{ margin: "5px 0" }}><strong>Total Amount:</strong> ₹{getTotalPrice()}</p>
            <p style={{ margin: "5px 0" }}><strong>Payment Status:</strong> <span style={{ color: "var(--success)", fontWeight: "600" }}>✓ Completed</span></p>
            <p style={{ margin: "5px 0" }}><strong>Order Status:</strong> <span style={{ color: "var(--primary)", fontWeight: "600" }}>Processing</span></p>
            <p style={{ margin: "5px 0" }}><strong>Estimated Delivery:</strong> 3-5 business days</p>
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <button
              onClick={() => navigate("/products")}
              style={{
                padding: "12px 24px",
                background: "transparent",
                color: "var(--primary)",
                border: "2px solid var(--primary)",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "600"
              }}
            >
              Continue Shopping
            </button>
            <button
              onClick={() => setShowTrackModal(true)}
              style={{
                padding: "12px 24px",
                background: "var(--primary)",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "600"
              }}
            >
              📍 Track Order
            </button>
            <button
              onClick={() => navigate("/orders")}
              style={{
                padding: "12px 24px",
                background: "transparent",
                color: "var(--text-secondary)",
                border: "2px solid var(--border)",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "600"
              }}
            >
              My Orders
            </button>
          </div>
        </div>

        {showTrackModal && orderId && (
          <TrackOrderModal
            order={{ id: orderId }}
            onClose={() => setShowTrackModal(false)}
          />
        )}
      </div>
    );
  }

  // Checkout Form
  return (
    <div style={{ padding: "40px 20px", maxWidth: "1000px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "30px" }}>🛒 Checkout</h1>

      {error && (
        <div style={{
          background: "var(--danger-light)",
          color: "var(--danger)",
          padding: "15px",
          borderRadius: "4px",
          marginBottom: "20px",
          border: "1px solid var(--danger)"
        }}>
          ❌ {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
        {/* Order Summary */}
        <div>
          <h2 style={{ marginBottom: "20px", color: "var(--primary)" }}>📋 Order Summary</h2>
          <div style={{
            background: "white",
            borderRadius: "8px",
            boxShadow: "var(--shadow-md)",
            padding: "20px",
            marginBottom: "20px"
          }}>
            {cart.map(item => (
              <div key={item.id} style={{
                display: "flex",
                gap: "12px",
                paddingBottom: "12px",
                marginBottom: "12px",
                borderBottom: "1px solid var(--border)"
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
                  <h4 style={{ margin: "0 0 5px 0" }}>{item.name}</h4>
                  <p style={{ margin: "0", color: "var(--text-secondary)", fontSize: "0.9em" }}>
                    Qty: {item.quantity || 1} × ₹{item.price}
                  </p>
                </div>
                <div style={{ textAlign: "right", fontWeight: "600" }}>
                  ₹{(item.price * (item.quantity || 1)).toFixed(2)}
                </div>
              </div>
            ))}

            <div style={{
              borderTop: "2px solid var(--primary)",
              paddingTop: "15px",
              marginTop: "15px"
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "1.1em",
                fontWeight: "700",
                color: "var(--primary)"
              }}>
                <span>Total:</span>
                <span>₹{getTotalPrice()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping Form */}
        <div>
          <h2 style={{ marginBottom: "20px", color: "var(--primary)" }}>📍 Shipping Address</h2>
          <form onSubmit={handleSubmitOrder}>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid var(--border)",
                  borderRadius: "4px",
                  boxSizing: "border-box",
                  fontSize: "1em"
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid var(--border)",
                  borderRadius: "4px",
                  boxSizing: "border-box",
                  fontSize: "1em"
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                readOnly
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid var(--border)",
                  borderRadius: "4px",
                  boxSizing: "border-box",
                  fontSize: "1em",
                  background: "#f5f5f5"
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
                Phone *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="10-digit phone number"
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid var(--border)",
                  borderRadius: "4px",
                  boxSizing: "border-box",
                  fontSize: "1em"
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
                Address *
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter full address"
                required
                rows="3"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid var(--border)",
                  borderRadius: "4px",
                  boxSizing: "border-box",
                  fontSize: "1em",
                  resize: "vertical"
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "15px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid var(--border)",
                    borderRadius: "4px",
                    boxSizing: "border-box",
                    fontSize: "1em"
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
                  State *
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid var(--border)",
                    borderRadius: "4px",
                    boxSizing: "border-box",
                    fontSize: "1em"
                  }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
                  Zip Code *
                </label>
                <input
                  type="text"
                  name="zipcode"
                  value={formData.zipcode}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid var(--border)",
                    borderRadius: "4px",
                    boxSizing: "border-box",
                    fontSize: "1em"
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  placeholder="India"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid var(--border)",
                    borderRadius: "4px",
                    boxSizing: "border-box",
                    fontSize: "1em"
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || paymentProcessing}
              style={{
                width: "100%",
                padding: "14px",
                background: loading || paymentProcessing ? "#ccc" : "var(--primary)",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: loading || paymentProcessing ? "not-allowed" : "pointer",
                fontSize: "16px",
                fontWeight: "600",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                if (!loading && !paymentProcessing) {
                  e.target.style.background = "var(--primary-dark)";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && !paymentProcessing) {
                  e.target.style.background = "var(--primary)";
                }
              }}
            >
              {loading || paymentProcessing ? "Processing..." : "💳 Proceed to Payment"}
            </button>
          </form>
        </div>
      </div>

      {/* Payment method picker modal */}
      {showPaymentPicker && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
        }}>
          <div style={{
            background: "white", borderRadius: "12px", padding: "36px",
            maxWidth: "420px", width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
          }}>
            <h2 style={{ margin: "0 0 8px 0", fontSize: "1.4em" }}>Choose Payment Method</h2>
            <p style={{ margin: "0 0 28px 0", color: "var(--text-secondary)", fontSize: "0.95em" }}>
              Order #{orderId} · ₹{getTotalPrice()}
            </p>

            <button
              onClick={handleRazorpayPayment}
              style={{
                width: "100%", padding: "14px", marginBottom: "12px",
                background: "var(--primary)", color: "white",
                border: "none", borderRadius: "8px", cursor: "pointer",
                fontSize: "15px", fontWeight: "600"
              }}
            >
              💳 Pay with Razorpay
            </button>

            <button
              onClick={handleDummyPayment}
              style={{
                width: "100%", padding: "14px",
                background: "#f0fdf4", color: "#16a34a",
                border: "2px solid #16a34a", borderRadius: "8px", cursor: "pointer",
                fontSize: "15px", fontWeight: "600"
              }}
            >
              ✅ Test Payment (Skip to confirmation)
            </button>

            <button
              onClick={() => setShowPaymentPicker(false)}
              style={{
                width: "100%", padding: "10px", marginTop: "12px",
                background: "transparent", color: "var(--text-secondary)",
                border: "none", cursor: "pointer", fontSize: "14px"
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
