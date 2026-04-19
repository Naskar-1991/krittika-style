import React, { useState, useEffect } from "react";
import "./RatingSummary.css";
import API_URL from "../api_connection/BackendAPIConnection";

const RatingSummary = ({ productId }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/reviews/stats/${productId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch statistics");
      }
      const data = await response.json();
      console.log("Rating stats fetched:", data);
      setStats(data);
    } catch (err) {
      setError("Error loading rating statistics");
      console.error("Error fetching stats:", err);
      // Set default stats on error
      setStats({
        total_reviews: 0,
        average_rating: 0,
        five_star: 0,
        four_star: 0,
        three_star: 0,
        two_star: 0,
        one_star: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="rating-summary-loading">Loading ratings...</div>;
  }

  if (error || !stats) {
    return <div className="rating-summary-error">{error || "No ratings available"}</div>;
  }

  const {
    total_reviews = 0,
    average_rating = 0,
    five_star = 0,
    four_star = 0,
    three_star = 0,
    two_star = 0,
    one_star = 0,
  } = stats || {};

  // Ensure values are not null
  const safeTotal = parseInt(total_reviews) || 0;
  const safeAverage = parseFloat(average_rating) || 0;
  const safeFiveStar = parseInt(five_star) || 0;
  const safeFourStar = parseInt(four_star) || 0;
  const safeThreeStar = parseInt(three_star) || 0;
  const safeTwoStar = parseInt(two_star) || 0;
  const safeOneStar = parseInt(one_star) || 0;

  const ratingDistribution = [
    { stars: 5, count: safeFiveStar },
    { stars: 4, count: safeFourStar },
    { stars: 3, count: safeThreeStar },
    { stars: 2, count: safeTwoStar },
    { stars: 1, count: safeOneStar },
  ];

  const renderStars = (count) => {
    return (
      <div className="summary-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={star <= count ? "star filled" : "star"}>
            ★
          </span>
        ))}
      </div>
    );
  };

  const getRatingPercentage = (count) => {
    return safeTotal > 0 ? Math.round((count / safeTotal) * 100) : 0;
  };

  if (safeTotal === 0) {
    return (
      <div className="rating-summary">
        <div className="no-ratings">
          <p>No ratings yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rating-summary">
      <div className="rating-score">
        <div className="average-rating">
          <span className="rating-number">{safeAverage.toFixed(1)}</span>
          <div className="rating-stars-large">
            {renderStars(Math.round(safeAverage))}
          </div>
          <p className="rating-count">
            Based on {safeTotal} review{safeTotal !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="rating-distribution">
        {ratingDistribution.map((item) => (
          <div key={item.stars} className="distribution-row">
            <div className="distribution-label">
              <span className="star-count">{item.stars} ★</span>
            </div>
            <div className="distribution-bar">
              <div
                className="distribution-fill"
                style={{ width: `${getRatingPercentage(item.count)}%` }}
              ></div>
            </div>
            <div className="distribution-percentage">
              <span>{getRatingPercentage(item.count)}%</span>
              <span className="distribution-count">
                ({item.count})
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RatingSummary;
