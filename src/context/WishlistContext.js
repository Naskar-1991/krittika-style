import React, { createContext, useState, useEffect, useContext } from "react";
import { AuthContext } from "./AuthContext";

export const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5500/api";

  // Fetch wishlist items for the current user
  const fetchWishlist = async () => {
    if (!user) {
      setWishlist([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/wishlist`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      
      if (!response.ok) throw new Error("Failed to fetch wishlist");
      
      const data = await response.json();
      setWishlist(data);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching wishlist:", err);
    } finally {
      setLoading(false);
    }
  };

  // Add item to wishlist
  const addToWishlist = async (product) => {
    if (!user) {
      setError("Please login to add items to wishlist");
      return false;
    }

    try {
      const response = await fetch(`${API_URL}/wishlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ product_id: product.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add to wishlist");
      }

      const newItem = await response.json();
      setWishlist([...wishlist, newItem]);
      return true;
    } catch (err) {
      setError(err.message);
      console.error("Error adding to wishlist:", err);
      return false;
    }
  };

  // Remove item from wishlist
  const removeFromWishlist = async (productId) => {
    try {
      const response = await fetch(`${API_URL}/wishlist/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to remove from wishlist");

      setWishlist(wishlist.filter(item => item.product_id !== productId));
      return true;
    } catch (err) {
      setError(err.message);
      console.error("Error removing from wishlist:", err);
      return false;
    }
  };

  // Check if product is in wishlist
  const isInWishlist = (productId) => {
    return wishlist.some(item => item.product_id === productId);
  };

  // Toggle wishlist item
  const toggleWishlist = async (product) => {
    if (isInWishlist(product.id)) {
      return removeFromWishlist(product.id);
    } else {
      return addToWishlist(product);
    }
  };

  // Fetch wishlist when user changes
  useEffect(() => {
    fetchWishlist();
  }, [user]);

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        loading,
        error,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        toggleWishlist,
        fetchWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};
