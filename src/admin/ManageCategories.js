import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import {
  fetchAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../services/categoryService";

const ManageCategories = () => {
  const { user } = useContext(AuthContext);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    display_order: 0,
    is_active: true,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await fetchAllCategories(user.token);
      setCategories(data || []);
      setError("");
    } catch (err) {
      setError("Failed to load categories: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "");
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      slug: !editingId ? generateSlug(name) : prev.slug,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.slug) {
      setError("Name and slug are required");
      return;
    }

    try {
      setLoading(true);
      let result;

      if (editingId) {
        result = await updateCategory(editingId, formData, user.token);
        setCategories(categories.map((c) => (c.id === editingId ? result : c)));
        setSuccess("Category updated successfully!");
      } else {
        result = await createCategory(formData, user.token);
        setCategories([result, ...categories]);
        setSuccess("Category created successfully!");
      }

      resetForm();
      setError("");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to save category");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setFormData(category);
    setEditingId(category.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?"))
      return;

    try {
      await deleteCategory(id, user.token);
      setCategories(categories.filter((c) => c.id !== id));
      setSuccess("Category deleted successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to delete category: " + err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      display_order: 0,
      is_active: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div style={{ padding: "20px" }}>
        <div style={{ textAlign: "center", color: "#666" }}>
          Loading categories...
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Manage Categories</h1>

      {error && (
        <div
          style={{
            background: "#f8d7da",
            color: "#721c24",
            padding: "12px 16px",
            marginBottom: "20px",
            borderRadius: "4px",
            border: "1px solid #f5c6cb",
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            background: "#d4edda",
            color: "#155724",
            padding: "12px 16px",
            marginBottom: "20px",
            borderRadius: "4px",
            border: "1px solid #c3e6cb",
          }}
        >
          {success}
        </div>
      )}

      <button
        onClick={() => (showForm ? resetForm() : setShowForm(true))}
        style={{
          padding: "10px 20px",
          backgroundColor: showForm ? "#6c757d" : "#28a745",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          marginBottom: "20px",
          fontSize: "14px",
          fontWeight: "600",
        }}
      >
        {showForm ? "Cancel" : "Add New Category"}
      </button>

      {showForm && (
        <div
          style={{
            background: "#f9f9f9",
            padding: "20px",
            borderRadius: "4px",
            marginBottom: "20px",
            border: "1px solid #ddd",
          }}
        >
          <h2>{editingId ? "Edit Category" : "Add New Category"}</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Category Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleNameChange}
                style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
                required
                placeholder="e.g., Electronics"
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Slug (URL-friendly) *
              </label>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
                required
                placeholder="e.g., electronics"
              />
              <small style={{ color: "#666", display: "block", marginTop: "5px" }}>
                Auto-generated from name, but you can customize it
              </small>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                style={{
                  width: "100%",
                  padding: "8px",
                  boxSizing: "border-box",
                  minHeight: "80px",
                }}
                placeholder="Enter category description"
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Display Order
              </label>
              <input
                type="number"
                name="display_order"
                value={formData.display_order}
                onChange={handleInputChange}
                style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
                min="0"
              />
              <small style={{ color: "#666", display: "block", marginTop: "5px" }}>
                Lower numbers appear first
              </small>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                />
                <span style={{ fontWeight: "600" }}>Active (visible to customers)</span>
              </label>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="submit"
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                {editingId ? "Update Category" : "Create Category"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "white",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          <thead>
            <tr style={{ background: "#f8f9fa", borderBottom: "2px solid #dee2e6" }}>
              <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>ID</th>
              <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Name</th>
              <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Slug</th>
              <th style={{ padding: "12px", textAlign: "left", fontWeight: "600" }}>Order</th>
              <th style={{ padding: "12px", textAlign: "center", fontWeight: "600" }}>Status</th>
              <th style={{ padding: "12px", textAlign: "center", fontWeight: "600" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length > 0 ? (
              categories.map((category) => (
                <tr
                  key={category.id}
                  style={{
                    borderBottom: "1px solid #dee2e6",
                    "&:hover": { background: "#f9f9f9" },
                  }}
                >
                  <td style={{ padding: "12px" }}>{category.id}</td>
                  <td style={{ padding: "12px" }}>
                    <strong>{category.name}</strong>
                    {category.description && (
                      <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                        {category.description.substring(0, 50)}
                        {category.description.length > 50 ? "..." : ""}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "12px", fontFamily: "monospace", fontSize: "12px" }}>
                    {category.slug}
                  </td>
                  <td style={{ padding: "12px", textAlign: "center" }}>{category.display_order}</td>
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    <span
                      style={{
                        padding: "4px 12px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "600",
                        background: category.is_active ? "#d4edda" : "#f8d7da",
                        color: category.is_active ? "#155724" : "#721c24",
                      }}
                    >
                      {category.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    <button
                      onClick={() => handleEdit(category)}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#ffc107",
                        color: "#000",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        marginRight: "8px",
                        fontSize: "12px",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="6"
                  style={{
                    padding: "40px 12px",
                    textAlign: "center",
                    color: "#999",
                  }}
                >
                  No categories found. Create one to get started!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: "20px", color: "#666", fontSize: "12px" }}>
        Total Categories: <strong>{categories.length}</strong>
      </div>
    </div>
  );
};

export default ManageCategories;
