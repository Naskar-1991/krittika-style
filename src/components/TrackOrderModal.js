import React, { useState, useEffect, useCallback } from "react";
import "./TrackOrderModal.css";
import API_URL from "../api_connection/BackendAPIConnection";

const ORDER_STEPS = [
  { key: "pending", label: "Order Placed", icon: "📋" },
  { key: "processing", label: "Processing", icon: "⚙️" },
  { key: "shipped", label: "Shipped", icon: "📦" },
  { key: "in_transit", label: "In Transit", icon: "🚛" },
  { key: "out_for_delivery", label: "Out for Delivery", icon: "🚚" },
  { key: "delivered", label: "Delivered", icon: "✅" },
];

const STATUS_STEP_MAP = {
  pending: 0,
  processing: 1,
  pickup_pending: 1,
  pickup_done: 2,
  ready_to_ship: 2,
  shipped: 2,
  in_transit: 3,
  out_for_delivery: 4,
  delivered: 5,
};

function getStepIndex(orderStatus, shiprocketStatus) {
  const combined = shiprocketStatus
    ? shiprocketStatus.toLowerCase().replace(/ /g, "_")
    : orderStatus;
  return STATUS_STEP_MAP[combined] ?? STATUS_STEP_MAP[orderStatus] ?? 0;
}

function formatDateTime(dateStr) {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function TrackOrderModal({ order, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTracking = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/orders/${order.id}/tracking`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch tracking details");
      setData(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [order.id]);

  useEffect(() => {
    fetchTracking();
  }, [fetchTracking]);

  // Close on backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const currentStep = data
    ? getStepIndex(data.order.status, data.order.shiprocket_status)
    : 0;

  const activities =
    data?.liveTracking?.activities?.length > 0
      ? data.liveTracking.activities
      : data?.history?.map((h) => ({
          date: h.timestamp,
          activity: h.status,
          location: h.location,
          status: h.status,
        })) || [];

  return (
    <div className="track-modal-overlay" onClick={handleBackdropClick}>
      <div className="track-modal">
        {/* Header */}
        <div className="track-modal-header">
          <div>
            <h2>Track Order</h2>
            <span className="track-order-id">Order #{order.id}</span>
          </div>
          <button className="track-close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="track-modal-body">
          {loading && (
            <div className="track-loading">
              <div className="track-spinner"></div>
              <p>Fetching live tracking data...</p>
            </div>
          )}

          {error && !loading && (
            <div className="track-error">
              <span>⚠️ {error}</span>
              <button className="track-retry-btn" onClick={fetchTracking}>
                Retry
              </button>
            </div>
          )}

          {data && !loading && (
            <>
              {/* Progress stepper */}
              <div className="track-stepper">
                {ORDER_STEPS.map((step, idx) => {
                  const done = idx < currentStep;
                  const active = idx === currentStep;
                  const cancelled = data.order.status === "cancelled";
                  return (
                    <div
                      key={step.key}
                      className={`track-step ${done ? "done" : ""} ${active && !cancelled ? "active" : ""} ${cancelled && idx === 0 ? "cancelled" : ""}`}
                    >
                      <div className="step-circle">
                        {done ? "✓" : cancelled && idx === 0 ? "✕" : step.icon}
                      </div>
                      <span className="step-label">{step.label}</span>
                      {idx < ORDER_STEPS.length - 1 && (
                        <div className={`step-line ${done ? "done" : ""}`}></div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Status summary cards */}
              <div className="track-info-grid">
                {data.order.tracking_number ? (
                  <>
                    <div className="track-info-card">
                      <span className="info-label">Tracking Number</span>
                      <span className="info-value mono">{data.order.tracking_number}</span>
                    </div>
                    {data.order.carrier_name && (
                      <div className="track-info-card">
                        <span className="info-label">Carrier</span>
                        <span className="info-value">{data.order.carrier_name}</span>
                      </div>
                    )}
                    {data.liveTracking?.current_status && (
                      <div className="track-info-card highlight">
                        <span className="info-label">Current Status</span>
                        <span className="info-value status-pill">
                          {data.liveTracking.current_status}
                        </span>
                      </div>
                    )}
                    {data.liveTracking?.origin && data.liveTracking?.destination && (
                      <div className="track-info-card route-card">
                        <span className="info-label">Route</span>
                        <span className="info-value route-value">
                          <span className="route-from">{data.liveTracking.origin}</span>
                          <span className="route-arrow">→</span>
                          <span className="route-to">{data.liveTracking.destination}</span>
                        </span>
                      </div>
                    )}
                    {(data.order.estimated_delivery_date || data.liveTracking?.edd) && (
                      <div className="track-info-card">
                        <span className="info-label">Estimated Delivery</span>
                        <span className="info-value">
                          {formatDate(data.order.estimated_delivery_date || data.liveTracking?.edd)}
                        </span>
                      </div>
                    )}
                    {data.order.actual_delivery_date && (
                      <div className="track-info-card success-card">
                        <span className="info-label">Delivered On</span>
                        <span className="info-value">
                          {formatDate(data.order.actual_delivery_date)}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="track-no-tracking">
                    <span className="no-track-icon">📍</span>
                    <p>
                      <strong>Tracking not yet available</strong>
                    </p>
                    <p>
                      Your order is currently{" "}
                      <strong>{data.order.status}</strong>. A tracking number
                      will be assigned once your order is dispatched.
                    </p>
                  </div>
                )}
              </div>

              {/* Activity timeline */}
              {activities.length > 0 && (
                <div className="track-timeline">
                  <h3>Tracking History</h3>
                  <div className="timeline-list">
                    {activities.map((act, idx) => (
                      <div key={idx} className={`timeline-event ${idx === 0 ? "latest" : ""}`}>
                        <div className="timeline-dot"></div>
                        <div className="timeline-content">
                          <div className="timeline-activity">
                            {act.activity || act.status}
                          </div>
                          {act.location && (
                            <div className="timeline-location">📍 {act.location}</div>
                          )}
                          <div className="timeline-date">{formatDateTime(act.date)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* External tracking link */}
              {data.order.tracking_number && (
                <div className="track-external">
                  <a
                    href={
                      data.order.tracking_url ||
                      `https://www.shiprocket.in/tracking/${data.order.tracking_number}/`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-track-external"
                  >
                    🌐 Track on Shiprocket Website
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default TrackOrderModal;
