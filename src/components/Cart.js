import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import "./Cart.css";

const IconBag   = () => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>;
const IconBagLg = () => <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>;
const IconX     = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconArrow = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;

const Cart = () => {
  const { cart, removeFromCart, updateQuantity } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const subtotal = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  const itemCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <div className="cart-wrapper">
      <div className="container">
        <h2 className="cart-heading"><IconBag /> Shopping Cart</h2>

        {cart.length === 0 ? (
          <div className="cart-empty">
            <div className="cart-empty-icon"><IconBagLg /></div>
            <h3>Your cart is empty</h3>
            <p>Add beautiful sarees to your cart and they'll appear here.</p>
            <button className="cart-empty-btn" onClick={() => navigate("/products")}>
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="cart-layout">
            {/* Items */}
            <div className="cart-items-panel">
              <div className="cart-items-header">
                <span>{itemCount} {itemCount === 1 ? "item" : "items"}</span>
              </div>

              {cart.map((item) => {
                const imgSrc = item.image || item.images?.[0]?.image_url || null;
                return (
                <div key={item.id} className="cart-item">
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={item.name}
                      className="cart-item-img"
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                  ) : (
                    <div className="cart-item-img-placeholder">No img</div>
                  )}

                  <div className="cart-item-info">
                    <h4 className="cart-item-name">{item.name}</h4>
                    {item.description && (
                      <p className="cart-item-desc">
                        {item.description.substring(0, 50)}…
                      </p>
                    )}
                    <p className="cart-item-unit-price">₹{parseFloat(item.price).toFixed(2)} each</p>
                  </div>

                  <div className="cart-qty">
                    <button
                      className="cart-qty-btn"
                      onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      className="cart-qty-input"
                      value={item.quantity || 1}
                      min="1"
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (val > 0) updateQuantity(item.id, val);
                      }}
                    />
                    <button
                      className="cart-qty-btn"
                      onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  <div className="cart-item-right">
                    <span className="cart-item-total">
                      ₹{(item.price * (item.quantity || 1)).toFixed(2)}
                    </span>
                    <button
                      className="cart-remove-btn"
                      onClick={() => removeFromCart(item.id)}
                      aria-label={`Remove ${item.name}`}
                      title="Remove item"
                    >
                      <IconX />
                    </button>
                  </div>
                </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="cart-summary">
              <div className="cart-summary-header">
                <h3>Order Summary</h3>
              </div>
              <div className="cart-summary-body">
                <div className="cart-summary-row">
                  <span>Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="cart-summary-row">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="cart-summary-row total">
                  <span>Total</span>
                  <span className="amount">₹{subtotal.toFixed(2)}</span>
                </div>

                <button
                  className="cart-checkout-btn"
                  onClick={() => {
                    if (!user) {
                      navigate("/login");
                      return;
                    }
                    navigate("/checkout");
                  }}
                >
                  {user ? "Proceed to Checkout" : "Login to Checkout"} <IconArrow />
                </button>

                {!user && (
                  <p className="cart-note">You need to be logged in to checkout</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
