import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import SEOHead from "../components/SEOHead";
import "./Profile.css";
import API_URL from "../api_connection/BackendAPIConnection";

const IcoUser     = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IcoInfo     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>;
const IcoLock     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const IcoActivity = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
const IcoPencil   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IcoPhone    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.55 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
const IcoWarn     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IcoCheck    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoX        = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcoCalendar = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IcoKey      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>;
const IcoBag      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>;
const IcoLogout   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const IcoTrash    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;

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
      const response = await fetch(`${API_URL}/api/auth/profile`, {
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
      const response = await fetch(`${API_URL}/api/users/${user.id}/profile`, {
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
        `${API_URL}/api/users/${user.id}/change-password`,
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
      <SEOHead title="My Profile" noindex={true} />
      <div className="container">
        <div className="profile-header">
          <h1><IcoUser /> My Profile</h1>
          <p>Manage your account information</p>
        </div>

        {error && (
          <div className="error-banner">
            <span><IcoWarn /> {error}</span>
            <button
              onClick={() => setError("")}
              className="close-btn"
            >
              <IcoX />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="success-banner">
            <span><IcoCheck /> {successMessage}</span>
            <button
              onClick={() => setSuccessMessage("")}
              className="close-btn"
            >
              <IcoX />
            </button>
          </div>
        )}

        <div className="profile-container">
          <div className="profile-tabs">
            <button
              className={`tab-btn ${activeTab === "info" ? "active" : ""}`}
              onClick={() => setActiveTab("info")}
            >
              <IcoInfo /> Account Info
            </button>
            <button
              className={`tab-btn ${activeTab === "security" ? "active" : ""}`}
              onClick={() => setActiveTab("security")}
            >
              <IcoLock /> Security
            </button>
            <button
              className={`tab-btn ${activeTab === "activity" ? "active" : ""}`}
              onClick={() => setActiveTab("activity")}
            >
              <IcoActivity /> Activity
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
                        <IcoPencil /> Edit
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
                          <IcoCheck /> Save Changes
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
                          <IcoX /> Cancel
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
                              <span className="phone-icon"><IcoPhone /></span>
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
                      <div className="error-message"><IcoWarn /> {passwordError}</div>
                    )}

                    <div className="form-actions">
                      <button type="submit" className="btn-save">
                        <IcoLock /> Change Password
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
                      <IcoLogout /> Logout
                    </button>
                    <button className="btn-delete"><IcoTrash /> Delete Account</button>
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
                      <span className="activity-icon"><IcoCalendar /></span>
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
                      <span className="activity-icon"><IcoKey /></span>
                      <div className="activity-details">
                        <strong>Last Login</strong>
                        <p>Today</p>
                      </div>
                    </div>

                    <div className="activity-item">
                      <span className="activity-icon"><IcoBag /></span>
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
