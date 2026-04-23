import React, { useState, useEffect, useCallback } from "react";
import "./TrackOrderModal.css";
import API_URL from "../api_connection/BackendAPIConnection";

const s = { fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" };
const IcoClipboard = () => <svg width="14" height="14" viewBox="0 0 24 24" {...s}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>;
const IcoCog       = () => <svg width="14" height="14" viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>;
const IcoBox       = () => <svg width="14" height="14" viewBox="0 0 24 24" {...s}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>;
const IcoTruck     = () => <svg width="14" height="14" viewBox="0 0 24 24" {...s}><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>;
const IcoCheckCircle = () => <svg width="14" height="14" viewBox="0 0 24 24" {...s}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const IcoCheck     = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoX         = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcoXClose    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcoWarn      = () => <svg width="14" height="14" viewBox="0 0 24 24" {...s}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IcoPin       = () => <svg width="14" height="14" viewBox="0 0 24 24" {...s}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const IcoGlobe     = () => <svg width="14" height="14" viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;

const ORDER_STEPS = [
  { key: "pending",          label: "Order Placed",      icon: <IcoClipboard /> },
  { key: "processing",       label: "Processing",        icon: <IcoCog /> },
  { key: "shipped",          label: "Shipped",           icon: <IcoBox /> },
  { key: "in_transit",       label: "In Transit",        icon: <IcoTruck /> },
  { key: "out_for_delivery", label: "Out for Delivery",  icon: <IcoTruck /> },
  { key: "delivered",        label: "Delivered",         icon: <IcoCheckCircle /> },
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
            <IcoXClose />
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
              <span><IcoWarn /> {error}</span>
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
                        {done ? <IcoCheck /> : cancelled && idx === 0 ? <IcoX /> : step.icon}
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
                    <span className="no-track-icon"><IcoPin /></span>
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
                            <div className="timeline-location"><IcoPin /> {act.location}</div>
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
                    <IcoGlobe /> Track on Shiprocket Website
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
