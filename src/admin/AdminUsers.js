import React, { useState, useEffect } from "react";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        setError("No authentication token found. Please login first.");
        setUsers([]);
        setLoading(false);
        return;
      }

      const response = await fetch("http://localhost:5500/api/users", {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });

      console.log("Response status:", response.status);
      const contentType = response.headers.get("content-type");
      
      if (!response.ok) {
        const errorData = contentType?.includes("application/json") 
          ? await response.json() 
          : { error: await response.text() };
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setUsers(data);
      setError("");
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingId(user.id);
    setEditFormData({
      name: user.name,
      email: user.email,
      mobile: user.mobile || "",
      role: user.role,
      password: ""
    });
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
    setShowForm(false);
  };

  const handleSaveEdit = async () => {
    try {
      const token = localStorage.getItem("token");
      const updateData = {
        name: editFormData.name,
        email: editFormData.email,
        mobile: editFormData.mobile,
        role: editFormData.role
      };

      if (editFormData.password) {
        updateData.password = editFormData.password;
      }

      const response = await fetch(`http://localhost:5500/api/users/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) throw new Error("Failed to update user");
      
      setUsers(users.map(u => u.id === editingId ? { ...u, ...updateData } : u));
      setEditingId(null);
      setEditFormData({});
      setShowForm(false);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5500/api/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Failed to delete user");
      
      setUsers(users.filter(u => u.id !== userId));
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <div style={{ 
          display: "inline-block", 
          width: "40px", 
          height: "40px", 
          border: "4px solid var(--primary-light)",
          borderTop: "4px solid var(--primary)",
          borderRadius: "50%",
          animation: "spin 1s linear infinite"
        }}></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1 style={{ margin: 0 }}>👥 Manage Users</h1>
        <span style={{
          background: "var(--primary)",
          color: "white",
          padding: "8px 16px",
          borderRadius: "20px",
          fontWeight: "600"
        }}>
          Total: {users.length}
        </span>
      </div>

      {error && (
        <div style={{ 
          background: "var(--danger-light)", 
          color: "var(--danger)", 
          padding: "12px", 
          marginBottom: "20px", 
          borderRadius: "4px",
          border: "1px solid var(--danger)"
        }}>
          ❌ {error}
        </div>
      )}

      {/* Users Table */}
      <div style={{
        background: "white",
        borderRadius: "8px",
        boxShadow: "var(--shadow-md)",
        overflow: "hidden"
      }}>
        <div style={{
          overflowX: "auto"
        }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse"
          }}>
            <thead>
              <tr style={{ 
                background: "var(--primary-light)",
                borderBottom: "2px solid var(--primary)"
              }}>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "var(--primary)" }}>ID</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "var(--primary)" }}>Name</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "var(--primary)" }}>Email</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "var(--primary)" }}>Mobile</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "var(--primary)" }}>Role</th>
                <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "var(--primary)" }}>Joined</th>
                <th style={{ padding: "12px", textAlign: "center", fontWeight: "600", color: "var(--primary)" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: "20px", textAlign: "center", color: "var(--text-secondary)" }}>
                    No users found
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr 
                    key={user.id} 
                    style={{
                      borderBottom: "1px solid var(--border)",
                      transition: "background-color 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--primary-light)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding: "12px" }}>{user.id}</td>
                    <td style={{ padding: "12px", fontWeight: "500" }}>{user.name}</td>
                    <td style={{ padding: "12px", color: "var(--text-secondary)" }}>{user.email}</td>
                    <td style={{ padding: "12px", color: "var(--text-secondary)" }}>{user.mobile || "N/A"}</td>
                    <td style={{ padding: "12px" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        background: user.role === "admin" ? "var(--danger-light)" : "var(--success-light)",
                        color: user.role === "admin" ? "var(--danger)" : "var(--success)",
                        fontWeight: "500",
                        fontSize: "0.85em"
                      }}>
                        {user.role === "admin" ? "👑" : "👤"} {user.role}
                      </span>
                    </td>
                    <td style={{ padding: "12px", color: "var(--text-secondary)", fontSize: "0.9em" }}>
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "12px", textAlign: "center" }}>
                      <button
                        onClick={() => handleEdit(user)}
                        style={{
                          padding: "6px 12px",
                          marginRight: "8px",
                          background: "var(--primary)",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "0.85em",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = "var(--primary-dark)";
                          e.target.style.transform = "translateY(-2px)";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = "var(--primary)";
                          e.target.style.transform = "translateY(0)";
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        style={{
                          padding: "6px 12px",
                          background: "var(--danger)",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "0.85em",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = "var(--danger-dark)";
                          e.target.style.transform = "translateY(-2px)";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = "var(--danger)";
                          e.target.style.transform = "translateY(0)";
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Form Modal */}
      {showForm && editingId && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "white",
            borderRadius: "8px",
            padding: "30px",
            maxWidth: "400px",
            width: "90%",
            boxShadow: "var(--shadow-lg)"
          }}>
            <h2 style={{ marginTop: 0, color: "var(--primary)" }}>Edit User</h2>
            
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Name</label>
              <input
                type="text"
                value={editFormData.name || ""}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid var(--border)",
                  borderRadius: "4px",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Email</label>
              <input
                type="email"
                value={editFormData.email || ""}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid var(--border)",
                  borderRadius: "4px",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Mobile Number</label>
              <input
                type="tel"
                value={editFormData.mobile || ""}
                onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
                placeholder="10-digit mobile number"
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid var(--border)",
                  borderRadius: "4px",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Role</label>
              <select
                value={editFormData.role || "user"}
                onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid var(--border)",
                  borderRadius: "4px",
                  boxSizing: "border-box"
                }}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>New Password (optional)</label>
              <input
                type="password"
                value={editFormData.password || ""}
                onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                placeholder="Leave empty to keep current password"
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid var(--border)",
                  borderRadius: "4px",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={handleCancelEdit}
                style={{
                  padding: "8px 16px",
                  background: "var(--border)",
                  color: "var(--text-primary)",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                style={{
                  padding: "8px 16px",
                  background: "var(--primary)",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
