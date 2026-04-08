import React, { useState, useContext } from "react";
import { ReturnsContext } from "../context/ReturnsContext";
import "./ReturnRequestModal.css";

const ReturnRequestModal = ({ order, items, onClose, onSuccess }) => {
  const { createReturn } = useContext(ReturnsContext);
  const [selectedItems, setSelectedItems] = useState(
    items.map(item => ({ ...item, selected: true, quantity: item.quantity }))
  );
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const returnReasons = [
    "Damaged Product",
    "Wrong Item Received",
    "Not as Described",
    "Size/Fit Issues",
    "Quality Issues",
    "Changed Mind",
    "Other",
  ];

  const toggleItemSelection = (index) => {
    const updated = [...selectedItems];
    updated[index].selected = !updated[index].selected;
    setSelectedItems(updated);
  };

  const updateItemQuantity = (index, quantity) => {
    const updated = [...selectedItems];
    if (quantity > 0 && quantity <= updated[index].quantity) {
      updated[index].returnQuantity = quantity;
    }
    setSelectedItems(updated);
  };

  const calculateRefundAmount = () => {
    return selectedItems
      .filter(item => item.selected)
      .reduce((sum, item) => sum + (item.price * (item.returnQuantity || item.quantity)), 0)
      .toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason) {
      setError("Please select a return reason");
      return;
    }

    if (selectedItems.filter(item => item.selected).length === 0) {
      setError("Please select at least one item to return");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const returnItems = selectedItems
        .filter(item => item.selected)
        .map(item => ({
          orderItemId: item.id,
          quantity: item.returnQuantity || item.quantity,
          reason,
        }));

      const result = await createReturn(
        order.id,
        returnItems,
        reason,
        description
      );

      if (result) {
        onSuccess(result);
      } else {
        setError("Failed to create return request. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="return-modal-overlay">
      <div className="return-modal">
        <div className="return-modal-header">
          <h2>Request Return</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="return-modal-content">
          {error && <div className="error-message">{error}</div>}

          {/* Order Summary */}
          <div className="order-summary">
            <h3>Order #{order.id}</h3>
            <p>Order Date: {new Date(order.created_at).toLocaleDateString()}</p>
            <p>Total Amount: ₹{order.total_amount}</p>
          </div>

          {/* Items Selection */}
          <div className="return-items-section">
            <h3>Select Items to Return</h3>
            <div className="items-list">
              {selectedItems.map((item, index) => (
                <div key={index} className="return-item">
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={() => toggleItemSelection(index)}
                    className="item-checkbox"
                  />
                  <div className="item-details">
                    <h4>{item.name}</h4>
                    <p>Price: ₹{item.price}</p>
                    <p>Original Quantity: {item.quantity}</p>
                  </div>
                  {item.selected && (
                    <div className="quantity-selector">
                      <label>Return Qty:</label>
                      <input
                        type="number"
                        min="1"
                        max={item.quantity}
                        value={item.returnQuantity || item.quantity}
                        onChange={(e) =>
                          updateItemQuantity(index, parseInt(e.target.value))
                        }
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Return Reason */}
          <div className="form-group">
            <label>Return Reason *</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="form-control"
            >
              <option value="">Select a reason</option>
              {returnReasons.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="form-group">
            <label>Additional Details</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide more details about the return..."
              rows="4"
              className="form-control"
            />
          </div>

          {/* Refund Summary */}
          <div className="refund-summary">
            <h3>Refund Summary</h3>
            <div className="summary-row">
              <span>Refund Amount:</span>
              <span className="amount">₹{calculateRefundAmount()}</span>
            </div>
            <p className="return-info">
              ⓘ Returns are accepted within 30 days of purchase.
              Refunds will be processed after we receive and inspect the items.
            </p>
          </div>
        </div>

        <div className="return-modal-footer">
          <button
            className="btn-cancel"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn-submit"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Processing..." : "Request Return"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReturnRequestModal;
