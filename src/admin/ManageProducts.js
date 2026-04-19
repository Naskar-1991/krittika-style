import React, { useState, useEffect, useContext, useRef } from "react";
import API_URL from "../api_connection/BackendAPIConnection";
import { AuthContext } from "../context/AuthContext";
import { fetchCategories } from "../services/categoryService";

const ADMIN_PAGE_SIZE = 20;

const ManageProducts = () => {
  const { user } = useContext(AuthContext);
  const formRef = useRef(null);
  const isFirstRender = useRef(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    original_price: "",
    description: "",
    stock: "",
    category_id: "",
  });

  useEffect(() => {
    fetchCategoriesList();
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      fetchProducts(currentPage, true); // first load: full-page spinner
    } else {
      fetchProducts(currentPage);       // page changes: inline spinner only
    }
  }, [currentPage]);

  const fetchProducts = async (page = 1, isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      else setTableLoading(true);

      const response = await fetch(
        `${API_URL}/api/products?page=${page}&limit=${ADMIN_PAGE_SIZE}&sort=newest`
      );
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      // Handle both paginated { products, total, totalPages } and legacy array
      if (Array.isArray(data)) {
        setProducts(data);
        setTotalCount(data.length);
        setTotalPages(1);
      } else {
        setProducts(data.products || []);
        setTotalCount(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
      setError("");
    } catch (err) {
      setError("Error loading products: " + err.message);
    } finally {
      setLoading(false);
      setTableLoading(false);
    }
  };

  const fetchCategoriesList = async () => {
    try {
      const cats = await fetchCategories();
      setCategories(cats);
    } catch (err) {
      console.error("Error loading categories:", err);
      setCategories([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Validate all files
    for (let file of files) {
      if (!file.type.startsWith("image/")) {
        setError("Please select only valid image files");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Each image size must be less than 5MB");
        return;
      }
    }

    // Process files
    setImageFiles(files);
    const previews = [];
    let filesProcessed = 0;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        previews.push(e.target.result);
        filesProcessed++;
        if (filesProcessed === files.length) {
          setImagePreviews(previews);
        }
      };
      reader.readAsDataURL(file);
    });

    setError("");
  };

  const removeImagePreview = (index) => {
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
    setImageFiles(imageFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.price) {
      setError("Name and price are required");
      return;
    }

    try {
      const url = editingId
        ? `${API_URL}/api/products/${editingId}`
        : `${API_URL}/api/products`;
      const method = editingId ? "PUT" : "POST";

      let response;
      const form = new FormData();
      form.append("name", formData.name);
      form.append("price", formData.price);
      form.append("original_price", formData.original_price || "");
      form.append("description", formData.description);
      form.append("stock", formData.stock);
      form.append("category_id", formData.category_id || "");
      
      // Add multiple image files
      imageFiles.forEach((file) => {
        form.append("images", file);
      });

      response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        body: form,
      });

      if (!response.ok) {
        let errorMessage = "Failed to save product";
        const ct = response.headers.get("content-type");
        if (ct && ct.includes("application/json")) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } else {
          const text = await response.text();
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const ct = response.headers.get("content-type");
      if (ct && ct.includes("application/json")) {
        await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || "Unexpected response from server");
      }
      
      resetForm();
      setError("");
      fetchProducts(currentPage); // non-blocking table refresh (tableLoading, not loading)
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      price: product.price,
      original_price: product.original_price || "",
      description: product.description || "",
      stock: product.stock || "",
      category_id: product.category_id || "",
    });

    if (product.images && product.images.length > 0) {
      setImagePreviews(product.images.map(img => img.image_url));
    } else {
      setImagePreviews([]);
    }

    setImageFiles([]);
    setEditingId(product.id);
    setShowForm(true);

    // Scroll the edit form into view after React re-renders
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      const response = await fetch(`${API_URL}/api/products/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete product");
      }

      setError("");
      // If deleting last item on page > 1, go back a page
      const newPage = products.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
      setCurrentPage(newPage);
      fetchProducts(newPage);
    } catch (err) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      price: "",
      original_price: "",
      description: "",
      stock: "",
      category_id: "",
    });
    setImagePreviews([]);
    setImageFiles([]);
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return <div style={{ padding: "20px" }}>Loading products...</div>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Manage Products</h1>

      {error && (
        <div style={{ background: "#f8d7da", color: "#721c24", padding: "10px", marginBottom: "20px", borderRadius: "4px" }}>
          {error}
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
        }}
      >
        {showForm ? "Cancel" : "Add New Product"}
      </button>

      {showForm && (
        <div ref={formRef} style={{
          background: "#f9f9f9",
          padding: "20px",
          borderRadius: "4px",
          marginBottom: "20px",
          border: "2px solid #667eea",
        }}>
          <h2>{editingId ? "Edit Product" : "Add New Product"}</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
                required
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Price (₹) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
                required
                step="0.01"
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                style={{ width: "100%", padding: "8px", boxSizing: "border-box", minHeight: "100px" }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Original Price (₹) (Optional - for discount display)
              </label>
              <input
                type="number"
                name="original_price"
                value={formData.original_price}
                onChange={handleInputChange}
                style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
                step="0.01"
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Stock
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
                min="0"
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Category
              </label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
                style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Product Images (Multiple)
              </label>
              <div style={{
                display: "block",
              }}>
                <div style={{ marginBottom: "15px" }}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    style={{
                      width: "100%",
                      padding: "8px",
                      boxSizing: "border-box",
                      marginBottom: "10px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                    }}
                  />
                  <small style={{ color: "#666" }}>
                    Upload multiple images (max 5MB each, max 10 images)
                  </small>
                </div>

                {imagePreviews && imagePreviews.length > 0 && (
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
                    gap: "10px",
                    marginTop: "15px",
                  }}>
                    {imagePreviews.map((preview, index) => (
                      <div key={index} style={{
                        position: "relative",
                        border: "2px solid #ddd",
                        borderRadius: "4px",
                        overflow: "hidden",
                        aspectRatio: "1",
                        backgroundColor: "#f9f9f9",
                      }}>
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeImagePreview(index)}
                          style={{
                            position: "absolute",
                            top: "2px",
                            right: "2px",
                            background: "rgba(255,0,0,0.8)",
                            color: "white",
                            border: "none",
                            borderRadius: "50%",
                            width: "20px",
                            height: "20px",
                            cursor: "pointer",
                            fontSize: "12px",
                          }}
                          title="Remove image"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              style={{
                padding: "10px 20px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginRight: "10px",
              }}
            >
              {editingId ? "Update Product" : "Add Product"}
            </button>
          </form>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <h2 style={{ margin: 0 }}>
          Products ({totalCount} total)
          {totalPages > 1 && ` — Page ${currentPage} of ${totalPages}`}
        </h2>
        {tableLoading && (
          <span style={{ fontSize: "13px", color: "#667eea", fontStyle: "italic" }}>Refreshing…</span>
        )}
      </div>

      {products.length === 0 ? (
        <p>No products found. Add a new product to get started.</p>
      ) : (
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "white",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}>
          <thead>
            <tr style={{ background: "#f5f5f5", borderBottom: "2px solid #ddd" }}>
              <th style={{ padding: "12px", textAlign: "left" }}>Image</th>
              <th style={{ padding: "12px", textAlign: "left" }}>ID</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Name</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Price (₹)</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Category</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Images</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Stock</th>
              <th style={{ padding: "12px", textAlign: "left" }}>Description</th>
              <th style={{ padding: "12px", textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} style={{ borderBottom: "1px solid #ddd" }}>
                <td style={{ padding: "12px" }}>
                  {(() => {
                    // Get first image from images array or fall back to image field
                    const displayImage = product?.images && product.images.length > 0
                      ? product.images[0].image_url
                      : product?.image || null;
                    
                    return displayImage ? (
                      <div style={{
                        width: "60px",
                        height: "60px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#f9f9f9",
                      }}>
                        <img
                          src={displayImage}
                          alt={product.name}
                          style={{
                            maxWidth: "100%",
                            maxHeight: "100%",
                            objectFit: "contain",
                          }}
                        />
                      </div>
                    ) : (
                      <div style={{
                        width: "60px",
                        height: "60px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#f9f9f9",
                        color: "#999",
                        fontSize: "12px",
                      }}>
                        No Image
                      </div>
                    );
                  })()}
                </td>
                <td style={{ padding: "12px" }}>{product.id}</td>
                <td style={{ padding: "12px" }}>{product.name}</td>
                <td style={{ padding: "12px" }}>{product.price}</td>
                <td style={{ padding: "12px" }}>
                  <span style={{
                    display: "inline-block",
                    background: product.category_name ? "#28a745" : "#6c757d",
                    color: "white",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: "600",
                  }}>
                    {product.category_name || "No Category"}
                  </span>
                </td>
                <td style={{ padding: "12px", textAlign: "center" }}>
                  <span style={{
                    display: "inline-block",
                    background: "#667eea",
                    color: "white",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}>
                    {product.images && product.images.length > 0 ? product.images.length : 0}
                  </span>
                </td>
                <td style={{ padding: "12px" }}>{product.stock || 0}</td>
                <td style={{ padding: "12px" }}>
                  {product.description ? product.description.substring(0, 40) + "..." : "N/A"}
                </td>
                <td style={{ padding: "12px", textAlign: "center" }}>
                  <button
                    onClick={() => handleEdit(product)}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#ffc107",
                      color: "black",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      marginRight: "8px",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "20px", justifyContent: "center" }}>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            style={{
              padding: "8px 16px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              background: currentPage <= 1 ? "#f5f5f5" : "white",
              cursor: currentPage <= 1 ? "not-allowed" : "pointer",
              opacity: currentPage <= 1 ? 0.5 : 1,
            }}
          >
            ← Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
            .reduce((acc, p, idx, arr) => {
              if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
              acc.push(p);
              return acc;
            }, [])
            .map((item, idx) =>
              item === "..." ? (
                <span key={`e-${idx}`} style={{ padding: "0 4px", color: "#999" }}>…</span>
              ) : (
                <button
                  key={item}
                  onClick={() => setCurrentPage(item)}
                  style={{
                    padding: "8px 14px",
                    border: "1px solid",
                    borderColor: item === currentPage ? "#667eea" : "#ddd",
                    borderRadius: "4px",
                    background: item === currentPage
                      ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                      : "white",
                    color: item === currentPage ? "white" : "#333",
                    cursor: "pointer",
                    fontWeight: item === currentPage ? "600" : "400",
                  }}
                >
                  {item}
                </button>
              )
            )}

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            style={{
              padding: "8px 16px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              background: currentPage >= totalPages ? "#f5f5f5" : "white",
              cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
              opacity: currentPage >= totalPages ? 0.5 : 1,
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default ManageProducts;
