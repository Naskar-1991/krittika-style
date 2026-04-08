import React, { useState, useEffect } from "react";
import API_URL from "../api_connection/BackendAPIConnection";
import "./ManageLogo.css";

const ManageLogo = () => {
  const [logo, setLogo] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [altText, setAltText] = useState("Logo");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchLogo();
  }, []);

  const fetchLogo = async () => {
    try {
      const response = await fetch(`${API_URL}/api/logo`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      const data = await response.json();
      if (data.logo_url) {
        setLogo(data);
        setAltText(data.logo_alt_text || "Logo");
      }
    } catch (error) {
      console.error("Error fetching logo:", error);
      setError("Failed to load logo");
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.type.startsWith("image/")) {
        setError("Please select a valid image file");
        return;
      }

      // Validate file size (5MB max)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("File size should not exceed 5MB");
        return;
      }

      setFile(selectedFile);
      setError("");

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      setError("Please select a logo file");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const formData = new FormData();
      formData.append("logo", file);
      formData.append("altText", altText);

      const response = await fetch(`${API_URL}/api/logo/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error("Failed to upload logo");
      }

      const data = await response.json();
      setLogo(data.data);
      setFile(null);
      setPreview(null);
      setSuccess("Logo uploaded successfully!");

      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error uploading logo:", error);
      setError("Failed to upload logo. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLogo = async () => {
    if (!logo || !logo.id) return;

    if (!window.confirm("Are you sure you want to delete the logo?")) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/api/logo/${logo.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to delete logo");
      }

      setLogo(null);
      setSuccess("Logo deleted successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error deleting logo:", error);
      setError("Failed to delete logo. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="manage-logo-container">
      <div className="logo-header">
        <h2>Logo Management</h2>
        <p>Upload and manage your site logo</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="logo-management-content">
        {/* Current Logo Display */}
        <div className="current-logo-section">
          <h3>Current Logo</h3>
          {logo && logo.logo_url ? (
            <div className="logo-preview-container">
              <img
                src={`${API_URL}${logo.logo_url}`}
                alt={logo.logo_alt_text}
                className="current-logo-img"
              />
              <div className="logo-info">
                <p className="logo-alt-text">Alt Text: {logo.logo_alt_text}</p>
                <button
                  className="btn btn-danger"
                  onClick={handleDeleteLogo}
                  disabled={loading}
                >
                  Delete Logo
                </button>
              </div>
            </div>
          ) : (
            <div className="no-logo">
              <p>No logo uploaded yet</p>
            </div>
          )}
        </div>

        {/* Upload Form */}
        <div className="upload-section">
          <h3>Upload New Logo</h3>
          <form onSubmit={handleUpload} className="logo-upload-form">
            <div className="form-group">
              <label htmlFor="logo-input">Select Logo Image</label>
              <input
                type="file"
                id="logo-input"
                accept="image/*"
                onChange={handleFileChange}
                className="file-input"
              />
              <small className="helper-text">
                Supported formats: JPG, PNG, GIF, WebP, SVG. Max size: 5MB
              </small>
            </div>

            {preview && (
              <div className="preview-section">
                <h4>Preview</h4>
                <img src={preview} alt="Preview" className="preview-img" />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="alt-text">Alt Text</label>
              <input
                type="text"
                id="alt-text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Enter alt text for logo"
                className="form-input"
              />
              <small className="helper-text">
                Helpful for accessibility and SEO
              </small>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !file}
            >
              {loading ? "Uploading..." : "Upload Logo"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ManageLogo;
