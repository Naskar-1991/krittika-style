import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";

const Cart = () => {
  const { cart, removeFromCart, updateQuantity } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0).toFixed(2);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Your Cart</h2>
      {cart.length === 0 ? (
        <p>No items in cart</p>
      ) : (
        <>
          <div style={{
            background: "white",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            borderRadius: "8px",
            overflow: "hidden",
          }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
            }}>
              <thead>
                <tr style={{ background: "#f5f5f5", borderBottom: "2px solid #ddd" }}>
                  <th style={{ padding: "12px", textAlign: "left" }}>Product</th>
                  <th style={{ padding: "12px", textAlign: "center" }}>Price</th>
                  <th style={{ padding: "12px", textAlign: "center" }}>Quantity</th>
                  <th style={{ padding: "12px", textAlign: "center" }}>Total</th>
                  <th style={{ padding: "12px", textAlign: "center" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {cart.map(item => (
                  <tr key={item.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{
                            width: "50px",
                            height: "50px",
                            objectFit: "contain",
                            borderRadius: "4px",
                          }}
                        />
                      )}
                      <div>
                        <h4 style={{ margin: "0 0 5px 0" }}>{item.name}</h4>
                        {item.description && (
                          <p style={{ margin: "0", fontSize: "12px", color: "#666" }}>
                            {item.description.substring(0, 40)}...
                          </p>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>₹{item.price}</td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                      }}>
                        <button
                          onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                          style={{
                            width: "30px",
                            height: "30px",
                            backgroundColor: "#dc3545",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "16px",
                            fontWeight: "bold",
                          }}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          value={item.quantity || 1}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (val > 0) updateQuantity(item.id, val);
                          }}
                          style={{
                            width: "50px",
                            textAlign: "center",
                            padding: "5px",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                          }}
                          min="1"
                        />
                        <button
                          onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                          style={{
                            width: "30px",
                            height: "30px",
                            backgroundColor: "#28a745",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "16px",
                            fontWeight: "bold",
                          }}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: "12px", textAlign: "center", fontWeight: "bold" }}>
                      ₹{(item.price * (item.quantity || 1)).toFixed(2)}
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#dc3545",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "14px",
                        }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{
            marginTop: "20px",
            padding: "20px",
            backgroundColor: "#f9f9f9",
            borderRadius: "8px",
            border: "1px solid #ddd",
            textAlign: "right",
          }}>
            <h3 style={{ margin: "0 0 10px 0" }}>
              Subtotal: <span style={{ color: "#28a745" }}>₹{getTotalPrice()}</span>
            </h3>
            <button
              onClick={() => {
                if (!user) {
                  alert("Please login first to proceed to checkout");
                  navigate("/login");
                  return;
                }
                navigate("/checkout");
              }}
              style={{
                padding: "12px 30px",
                backgroundColor: user ? "var(--primary)" : "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: user ? "pointer" : "not-allowed",
                fontSize: "16px",
                fontWeight: "bold",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                if (user) {
                  e.target.style.backgroundColor = "var(--primary-dark)";
                  e.target.style.transform = "translateY(-2px)";
                }
              }}
              onMouseLeave={(e) => {
                if (user) {
                  e.target.style.backgroundColor = "var(--primary)";
                  e.target.style.transform = "translateY(0)";
                }
              }}
            >
              🛒 Proceed to Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;
