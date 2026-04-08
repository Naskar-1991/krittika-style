import React, { useState } from "react";
import "./ReviewForm.css";
import API_URL from "../api_connection/BackendAPIConnection";

const ReviewForm = ({ productId, onReviewSubmitted, isLoggedIn }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const maxChars = 1000;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate
    if (!rating) {
      setError("Please select a rating");
      return;
    }
    if (!title.trim()) {
      setError("Please enter a review title");
      return;
    }
    if (!reviewText.trim()) {
      setError("Please enter your review");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication required. Please login again.");
        return;
      }

      const url = `${API_URL}/api/reviews`;
      console.log("Submitting review to:", url);
      const reviewData = {
        product_id: productId,
        rating: rating,
        title: title.trim(),
        review_text: reviewText.trim(),
      };
      console.log("Review data:", reviewData);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(reviewData),
      });

      const data = await response.json();
      console.log("Review response:", data);

      if (!response.ok) {
        setError(data.error || "Failed to submit review");
        return;
      }

      setSuccess("Review submitted successfully!");
      setRating(0);
      setTitle("");
      setReviewText("");

      // Call callback to refresh reviews
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Error submitting review. Please try again.");
      console.error("Submit review error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="review-form-container">
        <p className="login-message">Please log in to write a review</p>
      </div>
    );
  }

  return (
    <div className="review-form-container">
      <h3>Write a Review</h3>
      <form onSubmit={handleSubmit} className="review-form">
        {/* Star Rating */}
        <div className="form-group">
          <label>Rating *</label>
          <div className="star-rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`star ${
                  (hoverRating || rating) >= star ? "active" : ""
                }`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
              >
                ★
              </span>
            ))}
          </div>
          <p className="rating-label">
            {rating > 0 ? `${rating} out of 5 stars` : "Select your rating"}
          </p>
        </div>

        {/* Title */}
        <div className="form-group">
          <label htmlFor="title">Review Title *</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summarize your experience"
            maxLength={255}
            className="form-input"
          />
          <p className="char-count">{title.length}/255</p>
        </div>

        {/* Review Text */}
        <div className="form-group">
          <label htmlFor="reviewText">Your Review *</label>
          <textarea
            id="reviewText"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Share your experience with this product"
            maxLength={maxChars}
            rows={5}
            className="form-textarea"
          />
          <p className="char-count">
            {reviewText.length}/{maxChars}
          </p>
        </div>

        {/* Messages */}
        {error && <div className="message error">{error}</div>}
        {success && <div className="message success">{success}</div>}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={
            loading || !rating || !title.trim() || !reviewText.trim()
          }
          className="submit-btn"
        >
          {loading ? "Submitting..." : "Submit Review"}
        </button>
      </form>
    </div>
  );
};

export default ReviewForm;
