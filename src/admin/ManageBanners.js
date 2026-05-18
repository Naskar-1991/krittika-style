import React, { useState, useEffect, useRef } from "react";
import API_URL from "../api_connection/BackendAPIConnection";
import "./ManageBanners.css";

const SaveIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
  </svg>
);

const UploadIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/>
    <line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
);

const DragIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="6" r="1" fill="currentColor"/><circle cx="15" cy="6" r="1" fill="currentColor"/>
    <circle cx="9" cy="12" r="1" fill="currentColor"/><circle cx="15" cy="12" r="1" fill="currentColor"/>
    <circle cx="9" cy="18" r="1" fill="currentColor"/><circle cx="15" cy="18" r="1" fill="currentColor"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14H6L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4h6v2"/>
  </svg>
);

const ImageIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
);

const ManageBanners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Upload form state
  const [newFile, setNewFile] = useState(null);
  const [newPreview, setNewPreview] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [dropActive, setDropActive] = useState(false);

  // Drag-to-reorder state
  const dragIndex = useRef(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  const token = () => localStorage.getItem("token");

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/banners?admin=true`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      setBanners(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to load banners.");
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  };

  // ── File selection ──────────────────────────────────────
  const handleFileSelect = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be under 10 MB.");
      return;
    }
    setError("");
    setNewFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setNewPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleDropzoneChange = (e) => handleFileSelect(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDropActive(false);
    handleFileSelect(e.dataTransfer.files[0]);
  };

  // ── Upload ──────────────────────────────────────────────
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!newFile) { setError("Please select a banner image first."); return; }

    try {
      setUploading(true);
      setError("");

      const form = new FormData();
      form.append("banner", newFile);
      form.append("title", newTitle.trim());
      form.append("link_url", newLinkUrl.trim());

      const res = await fetch(`${API_URL}/api/banners/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` },
        body: form,
      });

      if (!res.ok) throw new Error((await res.json()).error || "Upload failed");

      const created = await res.json();
      setBanners((prev) => [...prev, created]);
      setNewFile(null);
      setNewPreview(null);
      setNewTitle("");
      setNewLinkUrl("");
      showSuccess("Banner uploaded successfully!");
    } catch (err) {
      setError(err.message || "Failed to upload banner.");
    } finally {
      setUploading(false);
    }
  };

  // ── Toggle active ───────────────────────────────────────
  const handleToggle = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/banners/${id}/toggle`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setBanners((prev) => prev.map((b) => (b.id === id ? updated : b)));
    } catch {
      setError("Failed to toggle banner status.");
    }
  };

  // ── Delete ──────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this banner? This cannot be undone.")) return;
    try {
      const res = await fetch(`${API_URL}/api/banners/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error();
      setBanners((prev) => prev.filter((b) => b.id !== id));
      showSuccess("Banner deleted.");
    } catch {
      setError("Failed to delete banner.");
    }
  };

  // ── Drag-to-reorder ─────────────────────────────────────
  const handleDragStart = (index) => { dragIndex.current = index; };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (dragIndex.current === index) return;
    const reordered = [...banners];
    const dragged = reordered.splice(dragIndex.current, 1)[0];
    reordered.splice(index, 0, dragged);
    dragIndex.current = index;
    setBanners(reordered);
  };

  const handleDragEnd = () => { dragIndex.current = null; };

  // ── Save order ──────────────────────────────────────────
  const handleSaveOrder = async () => {
    try {
      setSaving(true);
      setError("");

      const order = banners.map((b, i) => ({ id: b.id, sort_order: i + 1 }));
      const res = await fetch(`${API_URL}/api/banners/reorder`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ order }),
      });
      if (!res.ok) throw new Error();
      showSuccess("Banner order saved!");
    } catch {
      setError("Failed to save order.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-page">
      {/* Header */}
      <div className="mb-header">
        <div className="mb-header-text">
          <h2>Banner Management</h2>
          <p>Upload and arrange homepage carousel banners</p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-alert mb-alert-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </div>
      )}
      {success && (
        <div className="mb-alert mb-alert-success">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          {success}
        </div>
      )}

      {/* ── Current Banners ── */}
      <div className="mb-section">
        <div className="mb-section-header">
          <div>
            <p className="mb-section-title">Current Banners</p>
            <p className="mb-section-subtitle">
              {banners.length} banner{banners.length !== 1 ? "s" : ""} — drag to reorder
            </p>
          </div>
          <button
            className="mb-btn-save"
            onClick={handleSaveOrder}
            disabled={saving || banners.length === 0}
          >
            <SaveIcon />
            {saving ? "Saving…" : "Save Order"}
          </button>
        </div>

        {loading ? (
          <div className="mb-empty">Loading banners…</div>
        ) : banners.length === 0 ? (
          <div className="mb-empty">
            <ImageIcon />
            <p>No banners yet. Upload one below to get started.</p>
          </div>
        ) : (
          <div className="mb-grid">
            {banners.map((banner, index) => (
              <div
                key={banner.id}
                className={`mb-card${!banner.is_active ? " mb-card--inactive" : ""}`}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
              >
                {/* Order badge */}
                <div className="mb-order-badge">#{index + 1}</div>

                {/* Drag handle */}
                <div className="mb-drag-hint" title="Drag to reorder">
                  <DragIcon />
                </div>

                <img
                  className="mb-thumb"
                  src={`${API_URL}${banner.image_url}`}
                  alt={banner.title || `Banner ${index + 1}`}
                />

                <div className="mb-card-footer">
                  <div className="mb-card-title">
                    {banner.title || <span style={{ color: "#b0adcc", fontStyle: "italic" }}>No title</span>}
                  </div>
                  {banner.link_url && (
                    <div className="mb-card-link" title={banner.link_url}>{banner.link_url}</div>
                  )}

                  <div className="mb-card-actions">
                    {/* Active toggle */}
                    <label className="mb-toggle" title={banner.is_active ? "Active — click to deactivate" : "Inactive — click to activate"}>
                      <input
                        type="checkbox"
                        checked={banner.is_active}
                        onChange={() => handleToggle(banner.id)}
                      />
                      <div className="mb-toggle-track">
                        <div className="mb-toggle-thumb" />
                      </div>
                      <span className="mb-toggle-label">
                        {banner.is_active ? "Active" : "Inactive"}
                      </span>
                    </label>

                    {/* Delete */}
                    <button
                      className="mb-btn-delete"
                      onClick={() => handleDelete(banner.id)}
                      title="Delete banner"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Upload New Banner ── */}
      <div className="mb-section">
        <div className="mb-section-header">
          <div>
            <p className="mb-section-title">Add New Banner</p>
            <p className="mb-section-subtitle">Recommended size: 1800 × 700 px · Max 10 MB</p>
          </div>
        </div>

        <form onSubmit={handleUpload}>
          <div className="mb-upload-body">
            {/* Left: drop zone / preview */}
            <div>
              {newPreview ? (
                <>
                  <div className="mb-new-preview">
                    <img src={newPreview} alt="New banner preview" />
                  </div>
                  <button
                    type="button"
                    onClick={() => { setNewFile(null); setNewPreview(null); }}
                    style={{
                      background: "none", border: "none", color: "#e11d48",
                      fontSize: "0.8rem", cursor: "pointer", marginBottom: "0.5rem",
                      display: "flex", alignItems: "center", gap: "0.3rem"
                    }}
                  >
                    <TrashIcon /> Remove image
                  </button>
                </>
              ) : (
                <div
                  className={`mb-dropzone${dropActive ? " mb-dropzone--active" : ""}`}
                  onDragOver={(e) => { e.preventDefault(); setDropActive(true); }}
                  onDragLeave={() => setDropActive(false)}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleDropzoneChange}
                  />
                  <div className="mb-dropzone-icon"><UploadIcon /></div>
                  <div className="mb-dropzone-text">Drop image here or click to browse</div>
                  <div className="mb-dropzone-sub">JPG, PNG, WebP · up to 10 MB</div>
                </div>
              )}
            </div>

            {/* Right: fields */}
            <div className="mb-upload-fields">
              <div className="mb-field">
                <label htmlFor="banner-title">Banner Title</label>
                <input
                  id="banner-title"
                  type="text"
                  placeholder="e.g. Summer Collection 2026"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
                <span className="mb-field-hint">Optional — shown as eyebrow text on the homepage</span>
              </div>

              <div className="mb-field">
                <label htmlFor="banner-link">Link URL</label>
                <input
                  id="banner-link"
                  type="text"
                  placeholder="e.g. /products?category=silk"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                />
                <span className="mb-field-hint">Optional — where "Shop Now" CTA links for this banner</span>
              </div>

              <button
                type="submit"
                className="mb-btn-upload"
                disabled={uploading || !newFile}
              >
                {uploading ? (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
                      <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
                      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
                      <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
                      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
                    </svg>
                    Uploading…
                  </>
                ) : (
                  <>
                    <UploadIcon />
                    Upload Banner
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default ManageBanners;
