import React, { useState, useEffect } from "react";
import "./ReviewsList.css";
import API_URL from "../api_connection/BackendAPIConnection";

const ReviewsList = ({ productId, refreshTrigger }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [userHelpfulVotes, setUserHelpfulVotes] = useState({});
  const [userUnhelpfulVotes, setUserUnhelpfulVotes] = useState({});

  // Fetch reviews on mount and when product/sort changes
  useEffect(() => {
    fetchReviews();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, sortBy, refreshTrigger]);

  const fetchReviews = async () => {
    setLoading(true);
    setError("");
    try {
      const url = `${API_URL}/api/reviews/product/${productId}?sortBy=${sortBy}`;
      console.log("Fetching reviews from:", url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch reviews: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      console.log("Reviews fetched:", data);
      setReviews(data.reviews || []);

      // Load saved votes from localStorage
      const savedVotes = JSON.parse(
        localStorage.getItem(`review-votes-${productId}`) || "{}"
      );
      setUserHelpfulVotes(savedVotes.helpful || {});
      setUserUnhelpfulVotes(savedVotes.unhelpful || {});
    } catch (err) {
      setError("Error loading reviews. Please try again later.");
      console.error("Review fetch error:", err);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (e) => {
    setSortBy(e.target.value);
  };

  const handleHelpful = async (reviewId) => {
    // Check if already voted
    if (userHelpfulVotes[reviewId] || userUnhelpfulVotes[reviewId]) {
      alert("You have already voted on this review");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/reviews/${reviewId}/helpful`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to vote");
      }

      const data = await response.json();

      // Update local review state
      setReviews(
        reviews.map((r) =>
          r.id === reviewId
            ? {
                ...r,
                helpful_count: data.helpful_count,
                unhelpful_count: data.unhelpful_count,
              }
            : r
        )
      );

      // Save vote to localStorage
      const savedVotes = JSON.parse(
        localStorage.getItem(`review-votes-${productId}`) || "{}"
      );
      savedVotes.helpful = {
        ...savedVotes.helpful,
        [reviewId]: true,
      };
      localStorage.setItem(`review-votes-${productId}`, JSON.stringify(savedVotes));

      setUserHelpfulVotes({
        ...userHelpfulVotes,
        [reviewId]: true,
      });
    } catch (err) {
      console.error("Error marking helpful:", err);
      alert("Error marking as helpful");
    }
  };

  const handleUnhelpful = async (reviewId) => {
    // Check if already voted
    if (userHelpfulVotes[reviewId] || userUnhelpfulVotes[reviewId]) {
      alert("You have already voted on this review");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/reviews/${reviewId}/unhelpful`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to vote");
      }

      const data = await response.json();

      // Update local review state
      setReviews(
        reviews.map((r) =>
          r.id === reviewId
            ? {
                ...r,
                helpful_count: data.helpful_count,
                unhelpful_count: data.unhelpful_count,
              }
            : r
        )
      );

      // Save vote to localStorage
      const savedVotes = JSON.parse(
        localStorage.getItem(`review-votes-${productId}`) || "{}"
      );
      savedVotes.unhelpful = {
        ...savedVotes.unhelpful,
        [reviewId]: true,
      };
      localStorage.setItem(`review-votes-${productId}`, JSON.stringify(savedVotes));

      setUserUnhelpfulVotes({
        ...userUnhelpfulVotes,
        [reviewId]: true,
      });
    } catch (err) {
      console.error("Error marking unhelpful:", err);
      alert("Error marking as unhelpful");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const renderStars = (rating) => {
    return (
      <div className="review-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={star <= rating ? "star filled" : "star"}>
            ★
          </span>
        ))}
      </div>
    );
  };

  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : "U";
  };

  if (loading) {
    return <div className="reviews-loading">Loading reviews...</div>;
  }

  if (error) {
    return <div className="reviews-error">{error}</div>;
  }

  if (reviews.length === 0) {
    return (
      <div className="reviews-container">
        <div className="no-reviews">
          <p>No reviews yet. Be the first to share your experience!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reviews-container">
      <div className="reviews-header">
        <h3>Customer Reviews</h3>
        <div className="sort-container">
          <label htmlFor="sortBy">Sort by:</label>
          <select id="sortBy" value={sortBy} onChange={handleSort}>
            <option value="recent">Most Recent</option>
            <option value="rating_high">Highest Rated</option>
            <option value="rating_low">Lowest Rated</option>
            <option value="helpful">Most Helpful</option>
          </select>
        </div>
      </div>

      <div className="reviews-list">
        {reviews.map((review) => (
          <div key={review.id} className="review-item">
            <div className="review-header">
              <div className="reviewer-info">
                <div className="reviewer-avatar">
                  {getInitial(review.user_name)}
                </div>
                <div className="reviewer-details">
                  <div className="reviewer-name">
                    {review.user_name}
                    {review.is_verified_purchase && (
                      <span className="verified-badge">✓ Verified Purchase</span>
                    )}
                  </div>
                  <div className="review-meta">
                    {renderStars(review.rating)}
                    <span className="review-date">
                      {formatDate(review.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="review-content">
              <h4 className="review-title">{review.title}</h4>
              <p className="review-text">{review.review_text}</p>
            </div>

            <div className="review-footer">
              <div className="helpful-section">
                <span className="helpful-label">Was this helpful?</span>
                <button
                  className={`helpful-btn ${
                    userHelpfulVotes[review.id] ? "voted" : ""
                  }`}
                  onClick={() => handleHelpful(review.id)}
                  disabled={
                    userHelpfulVotes[review.id] || userUnhelpfulVotes[review.id]
                  }
                >
                  👍 {review.helpful_count}
                </button>
                <button
                  className={`helpful-btn unhelpful ${
                    userUnhelpfulVotes[review.id] ? "voted" : ""
                  }`}
                  onClick={() => handleUnhelpful(review.id)}
                  disabled={
                    userHelpfulVotes[review.id] || userUnhelpfulVotes[review.id]
                  }
                >
                  👎 {review.unhelpful_count}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewsList;
