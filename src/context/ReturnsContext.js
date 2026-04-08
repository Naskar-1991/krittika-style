import React, { createContext, useState, useEffect, useContext } from "react";
import { AuthContext } from "./AuthContext";

export const ReturnsContext = createContext();

export const ReturnsProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5500/api";

  // Fetch user returns
  const fetchReturns = async () => {
    if (!user) {
      setReturns([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/returns/my-returns`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch returns");

      const data = await response.json();
      setReturns(data);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching returns:", err);
    } finally {
      setLoading(false);
    }
  };

  // Get return details
  const getReturnDetails = async (returnId) => {
    try {
      const response = await fetch(`${API_URL}/returns/${returnId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch return details");

      return await response.json();
    } catch (err) {
      setError(err.message);
      console.error("Error fetching return details:", err);
      return null;
    }
  };

  // Create return request
  const createReturn = async (orderId, items, reason, description) => {
    try {
      const response = await fetch(`${API_URL}/returns`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          orderId,
          items,
          reason,
          description,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create return");
      }

      const newReturn = await response.json();
      setReturns([...returns, newReturn]);
      return newReturn;
    } catch (err) {
      setError(err.message);
      console.error("Error creating return:", err);
      return null;
    }
  };

  // Cancel return request
  const cancelReturn = async (returnId) => {
    try {
      const response = await fetch(`${API_URL}/returns/${returnId}/cancel`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to cancel return");
      }

      const updatedReturn = await response.json();
      setReturns(returns.map(r => r.id === returnId ? updatedReturn : r));
      return updatedReturn;
    } catch (err) {
      setError(err.message);
      console.error("Error cancelling return:", err);
      return null;
    }
  };

  // Check if order can be returned
  const checkCanReturn = async (orderId) => {
    try {
      const response = await fetch(`${API_URL}/returns/check/${orderId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to check return eligibility");

      return await response.json();
    } catch (err) {
      setError(err.message);
      console.error("Error checking return eligibility:", err);
      return null;
    }
  };

  // Fetch returns when user changes
  useEffect(() => {
    fetchReturns();
  }, [user]);

  return (
    <ReturnsContext.Provider
      value={{
        returns,
        loading,
        error,
        fetchReturns,
        getReturnDetails,
        createReturn,
        cancelReturn,
        checkCanReturn,
      }}
    >
      {children}
    </ReturnsContext.Provider>
  );
};
