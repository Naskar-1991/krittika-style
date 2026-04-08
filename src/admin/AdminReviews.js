import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./AdminReviews.css";
import API_URL from "../api_connection/BackendAPIConnection";

const AdminReviews = () => {
  const { user, isAdmin } = useContext(AuthContext);
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  
  // Filter states
  const [productFilter, setProductFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal state
  const [selectedReview, setSelectedReview] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const LIMIT = 10;

  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
    }
  }, [isAdmin, navigate]);

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, [productFilter, userFilter, ratingFilter, sortBy, page]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        sortBy,
        page,
        limit: LIMIT
      });

      if (productFilter) params.append("productId", productFilter);
      if (userFilter) params.append("userId", userFilter);
      if (ratingFilter) params.append("rating", ratingFilter);

      const response = await fetch(`${API_URL}/api/reviews/admin/all?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch reviews");
      const data = await response.json();
      setReviews(data.reviews);
      setTotalPages(data.pagination.pages);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/reviews/admin/stats/overview`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch stats");
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;

    setActionLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/reviews/admin/${reviewId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete review");

      await fetchReviews();
      setSelectedReview(null);
      alert("Review deleted successfully!");
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleFlagReview = async (reviewId, isFlagged) => {
    setActionLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/reviews/admin/${reviewId}/flag`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ flagged: !isFlagged }),
      });

      if (!response.ok) throw new Error("Failed to flag review");

      await fetchReviews();
      setSelectedReview(null);
      alert(isFlagged ? "Review unflagged!" : "Review flagged!");
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const renderStars = (rating) => {
    return "⭐".repeat(rating) + "☆".repeat(5 - rating);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isAdmin) return null;

  return (
    <div className="admin-reviews-container">
      <div className="reviews-page-header">
        <h1>⭐ Reviews Management</h1>
        <p>Monitor and manage customer product reviews</p>
      </div>

      {/* Stats Dashboard */}
      {stats && (
        <div className="stats-dashboard">
          <div className="stat-card">
            <div className="stat-label">Total Reviews</div>
            <div className="stat-number">{stats.stats.total_reviews}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Average Rating</div>
            <div className="stat-number">{stats.stats.average_rating}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Products with Reviews</div>
            <div className="stat-number">{stats.stats.products_with_reviews}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Verified Reviews</div>
            <div className="stat-number">{stats.stats.verified_reviews}</div>
          </div>
        </div>
      )}

      {/* Top Rated Products */}
      {stats && stats.topProducts.length > 0 && (
        <div className="top-products-section">
          <h2>🏆 Top Rated Products</h2>
          <div className="top-products-grid">
            {stats.topProducts.map((product) => (
              <div key={product.id} className="top-product-card">
                <div className="product-name">{product.name}</div>
                <div className="product-rating">
                  {renderStars(Math.round(product.average_rating))}
                </div>
                <div className="product-meta">
                  {product.average_rating} / 5.0 ({product.review_count} reviews)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Filter by Product ID:</label>
          <input
            type="number"
            value={productFilter}
            onChange={(e) => {
              setProductFilter(e.target.value);
              setPage(1);
            }}
            placeholder="Enter product ID"
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label>Filter by User ID:</label>
          <input
            type="number"
            value={userFilter}
            onChange={(e) => {
              setUserFilter(e.target.value);
              setPage(1);
            }}
            placeholder="Enter user ID"
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label>Filter by Rating:</label>
          <select
            value={ratingFilter}
            onChange={(e) => {
              setRatingFilter(e.target.value);
              setPage(1);
            }}
            className="filter-select"
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="filter-select"
          >
            <option value="recent">Most Recent</option>
            <option value="rating_high">Highest Rated</option>
            <option value="rating_low">Lowest Rated</option>
            <option value="helpful">Most Helpful</option>
          </select>
        </div>

        <button
          onClick={() => {
            setProductFilter("");
            setUserFilter("");
            setRatingFilter("");
            setSortBy("recent");
            setPage(1);
          }}
          className="btn-reset-filters"
        >
          Reset Filters
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading reviews...</p>
        </div>
      )}

      {/* Error State */}
      {error && <div className="error-message">❌ {error}</div>}

      {/* Reviews Table */}
      {!loading && reviews.length > 0 && (
        <div className="reviews-table-section">
          <table className="reviews-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Product</th>
                <th>Rating</th>
                <th>Title</th>
                <th>Helpful</th>
                <th>Verified</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review.id} className="review-row">
                  <td className="id-cell">#{review.id}</td>
                  <td className="user-cell">{review.user_name}</td>
                  <td className="product-cell">{review.product_name}</td>
                  <td className="rating-cell">
                    <span className="rating-badge">
                      {renderStars(review.rating)}
                    </span>
                  </td>
                  <td className="title-cell" title={review.title}>
                    {review.title.substring(0, 30)}
                    {review.title.length > 30 ? "..." : ""}
                  </td>
                  <td className="helpful-cell">
                    👍 {review.helpful_count} 👎 {review.unhelpful_count}
                  </td>
                  <td className="verified-cell">
                    {review.is_verified_purchase ? (
                      <span className="badge verified">✓ Yes</span>
                    ) : (
                      <span className="badge not-verified">✗ No</span>
                    )}
                  </td>
                  <td className="date-cell">{formatDate(review.created_at)}</td>
                  <td className="actions-cell">
                    <button
                      onClick={() => setSelectedReview(review)}
                      className="btn-view"
                      title="View details"
                    >
                      👁️ View
                    </button>
                    <button
                      onClick={() => handleDeleteReview(review.id)}
                      className="btn-delete"
                      title="Delete review"
                      disabled={actionLoading}
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="pagination">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="pagination-btn"
            >
              ← Previous
            </button>
            <span className="page-info">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="pagination-btn"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* No Reviews State */}
      {!loading && reviews.length === 0 && (
        <div className="no-reviews-state">
          <p>No reviews found matching your filters.</p>
        </div>
      )}

      {/* Review Detail Modal */}
      {selectedReview && (
        <div className="modal-overlay" onClick={() => setSelectedReview(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setSelectedReview(null)}
            >
              ✕
            </button>

            <h2>Review Details</h2>

            <div className="modal-body">
              <div className="detail-section">
                <label>Review ID:</label>
                <p>#{selectedReview.id}</p>
              </div>

              <div className="detail-section">
                <label>User:</label>
                <p>{selectedReview.user_name} (ID: {selectedReview.user_id})</p>
              </div>

              <div className="detail-section">
                <label>Product:</label>
                <p>{selectedReview.product_name} (ID: {selectedReview.product_id})</p>
              </div>

              <div className="detail-section">
                <label>Rating:</label>
                <p className="rating-display">
                  {renderStars(selectedReview.rating)} {selectedReview.rating}/5
                </p>
              </div>

              <div className="detail-section">
                <label>Title:</label>
                <p>{selectedReview.title}</p>
              </div>

              <div className="detail-section">
                <label>Review:</label>
                <p className="review-text">{selectedReview.review_text}</p>
              </div>

              <div className="detail-section two-column">
                <div>
                  <label>Helpful Votes:</label>
                  <p>👍 {selectedReview.helpful_count}</p>
                </div>
                <div>
                  <label>Unhelpful Votes:</label>
                  <p>👎 {selectedReview.unhelpful_count}</p>
                </div>
              </div>

              <div className="detail-section two-column">
                <div>
                  <label>Verified Purchase:</label>
                  <p>
                    {selectedReview.is_verified_purchase ? "✓ Yes" : "✗ No"}
                  </p>
                </div>
                <div>
                  <label>Posted:</label>
                  <p>{formatDate(selectedReview.created_at)}</p>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  onClick={() =>
                    handleFlagReview(selectedReview.id, selectedReview.is_flagged)
                  }
                  disabled={actionLoading}
                  className={`btn-flag ${selectedReview.is_flagged ? "flagged" : ""}`}
                >
                  {selectedReview.is_flagged ? "🚩 Unflag" : "🚩 Flag"}
                </button>
                <button
                  onClick={() => handleDeleteReview(selectedReview.id)}
                  disabled={actionLoading}
                  className="btn-delete-modal"
                >
                  {actionLoading ? "Processing..." : "🗑️ Delete Review"}
                </button>
                <button
                  onClick={() => setSelectedReview(null)}
                  className="btn-close-modal"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
