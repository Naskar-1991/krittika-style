import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Profile.css";

function Profile() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    fetchProfile();
  }, [user, navigate]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5500/api/auth/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      const data = await response.json();
      setProfileData(data);
      setFormData({
        name: data.name || "",
        mobile: data.mobile || "",
      });
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
      console.error("Error fetching profile:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
    setPasswordError("");
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    if (formData.mobile &&!/^\d{10}$/.test(formData.mobile)) {
      setError("Mobile number must be 10 digits");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5500/api/users/${user.id}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to update profile");
      }

      const updatedData = await response.json();
      setProfileData(updatedData);
      setEditMode(false);
      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
      setError("");
    } catch (err) {
      setError(err.message);
      console.error("Error updating profile:", err);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!passwordData.currentPassword.trim()) {
      setPasswordError("Current password is required");
      return;
    }

    if (!passwordData.newPassword.trim()) {
      setPasswordError("New password is required");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5500/api/users/${user.id}/change-password`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to change password");
      }

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setSuccessMessage("Password changed successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
      setPasswordError("");
    } catch (err) {
      setPasswordError(err.message);
      console.error("Error changing password:", err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-header">
          <h1>👤 My Profile</h1>
          <p>Manage your account information</p>
        </div>

        {error && (
          <div className="error-banner">
            <span>⚠️ {error}</span>
            <button
              onClick={() => setError("")}
              className="close-btn"
            >
              ✕
            </button>
          </div>
        )}

        {successMessage && (
          <div className="success-banner">
            <span>✅ {successMessage}</span>
            <button
              onClick={() => setSuccessMessage("")}
              className="close-btn"
            >
              ✕
            </button>
          </div>
        )}

        <div className="profile-container">
          <div className="profile-tabs">
            <button
              className={`tab-btn ${activeTab === "info" ? "active" : ""}`}
              onClick={() => setActiveTab("info")}
            >
              📋 Account Info
            </button>
            <button
              className={`tab-btn ${activeTab === "security" ? "active" : ""}`}
              onClick={() => setActiveTab("security")}
            >
              🔐 Security
            </button>
            <button
              className={`tab-btn ${activeTab === "activity" ? "active" : ""}`}
              onClick={() => setActiveTab("activity")}
            >
              📊 Activity
            </button>
          </div>

          <div className="profile-content">
            {/* Account Info Tab */}
            {activeTab === "info" && (
              <div className="tab-content">
                <div className="profile-card">
                  <div className="card-header">
                    <h2>Account Information</h2>
                    {!editMode && (
                      <button
                        className="edit-btn"
                        onClick={() => setEditMode(true)}
                      >
                        ✏️ Edit
                      </button>
                    )}
                  </div>

                  {editMode ? (
                    <form onSubmit={handleUpdateProfile} className="profile-form">
                      <div className="form-group">
                        <label htmlFor="name">Full Name</label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="form-input"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="email">Email Address (Read-only)</label>
                        <input
                          type="email"
                          id="email"
                          value={profileData?.email || ""}
                          disabled
                          className="form-input disabled"
                        />
                        <small>Email cannot be changed</small>
                      </div>

                      <div className="form-group">
                        <label htmlFor="mobile">Mobile Number</label>
                        <input
                          type="tel"
                          id="mobile"
                          name="mobile"
                          value={formData.mobile}
                          onChange={handleInputChange}
                          placeholder="Enter 10-digit mobile number"
                          maxLength="10"
                          className="form-input"
                        />
                        <small>Enter 10-digit mobile number without spaces</small>
                      </div>

                      <div className="form-actions">
                        <button type="submit" className="btn-save">
                          ✓ Save Changes
                        </button>
                        <button
                          type="button"
                          className="btn-cancel"
                          onClick={() => {
                            setEditMode(false);
                            setFormData({
                              name: profileData.name,
                              mobile: profileData.mobile || "",
                            });
                          }}
                        >
                          ✕ Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="profile-info">
                      <div className="info-row">
                        <span className="label">Full Name:</span>
                        <span className="value">{profileData?.name}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Email:</span>
                        <span className="value">{profileData?.email}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Mobile:</span>
                        <span className="value">
                          {profileData?.mobile ? (
                            <>
                              <span className="phone-icon">📱</span>
                              {profileData.mobile}
                            </>
                          ) : (
                            <span className="not-set">Not set</span>
                          )}
                        </span>
                      </div>
                      <div className="info-row">
                        <span className="label">Account Type:</span>
                        <span className="value">
                          <span className="badge">{profileData?.role}</span>
                        </span>
                      </div>
                      <div className="info-row">
                        <span className="label">Member Since:</span>
                        <span className="value">
                          {profileData?.created_at
                            ? formatDate(profileData.created_at)
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="tab-content">
                <div className="profile-card">
                  <div className="card-header">
                    <h2>Change Password</h2>
                  </div>

                  <form onSubmit={handleChangePassword} className="profile-form">
                    <div className="form-group">
                      <label htmlFor="currentPassword">Current Password</label>
                      <input
                        type="password"
                        id="currentPassword"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="newPassword">New Password</label>
                      <input
                        type="password"
                        id="newPassword"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className="form-input"
                      />
                      <small>Minimum 6 characters</small>
                    </div>

                    <div className="form-group">
                      <label htmlFor="confirmPassword">Confirm New Password</label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        className="form-input"
                      />
                    </div>

                    {passwordError && (
                      <div className="error-message">⚠️ {passwordError}</div>
                    )}

                    <div className="form-actions">
                      <button type="submit" className="btn-save">
                        🔐 Change Password
                      </button>
                      <button
                        type="button"
                        className="btn-cancel"
                        onClick={() => {
                          setPasswordData({
                            currentPassword: "",
                            newPassword: "",
                            confirmPassword: "",
                          });
                          setPasswordError("");
                        }}
                      >
                        Clear
                      </button>
                    </div>
                  </form>
                </div>

                <div className="profile-card">
                  <div className="card-header">
                    <h2>Account Management</h2>
                  </div>

                  <div className="account-actions">
                    <button onClick={handleLogout} className="btn-logout">
                      🚪 Logout
                    </button>
                    <button className="btn-delete">🗑️ Delete Account</button>
                  </div>
                </div>
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === "activity" && (
              <div className="tab-content">
                <div className="profile-card">
                  <div className="card-header">
                    <h2>Account Activity</h2>
                  </div>

                  <div className="activity-info">
                    <div className="activity-item">
                      <span className="activity-icon">📅</span>
                      <div className="activity-details">
                        <strong>Account Created</strong>
                        <p>
                          {profileData?.created_at
                            ? formatDate(profileData.created_at)
                            : "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="activity-item">
                      <span className="activity-icon">🔑</span>
                      <div className="activity-details">
                        <strong>Last Login</strong>
                        <p>Today</p>
                      </div>
                    </div>

                    <div className="activity-item">
                      <span className="activity-icon">🛒</span>
                      <div className="activity-details">
                        <strong>Quick Link</strong>
                        <button
                          onClick={() => navigate("/orders")}
                          className="link-btn"
                        >
                          View My Orders →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
