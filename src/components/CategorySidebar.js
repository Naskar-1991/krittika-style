import React, { useState, useEffect, useRef } from "react";
import { fetchCategories } from "../services/categoryService";
import "./CategorySidebar.css";

const SAREE_KEYWORDS = [
  "silk", "cotton", "saree", "sari", "banarasi", "banaras",
  "kanjivaram", "kanjeevaram", "handloom", "bridal", "festive",
  "casual", "printed", "designer", "linen", "georgette", "chiffon",
  "tussar", "patola", "zari", "embroidered", "woven", "weave",
  "jacquard", "ikat", "bandhani", "kalamkari", "pochampally",
  "office", "gifting", "occasion", "party",
];

const isSareeCategory = (name = "") => {
  const lower = name.toLowerCase();
  return SAREE_KEYWORDS.some((kw) => lower.includes(kw));
};

const CategorySidebar = ({ selectedCategory, onCategorySelect }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    loadCategories();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await fetchCategories();
      // Only show saree-related categories
      const sareeOnly = (data || []).filter((c) => isSareeCategory(c.name));
      setCategories(sareeOnly);
    } catch (error) {
      console.error("Error loading categories:", error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const getSelectedCategoryName = () => {
    if (!selectedCategory) return "All Sarees";
    const category = categories.find((cat) => cat.id === selectedCategory);
    return category ? category.name : "All Sarees";
  };

  const handleCategorySelect = (categoryId) => {
    onCategorySelect(categoryId);
    setIsOpen(false);
  };

  return (
    <div className="category-sidebar-wrapper" ref={wrapperRef}>
      <div className={`category-dropdown ${isOpen ? "open" : ""}`}>
        <button
          className="category-dropdown-trigger"
          onClick={() => setIsOpen(!isOpen)}
          disabled={loading}
        >
          <span className="dropdown-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          </span>
          <span className="dropdown-label">{getSelectedCategoryName()}</span>
          <span className={`dropdown-arrow ${isOpen ? "up" : "down"}`}>▼</span>
        </button>

        {isOpen && (
          <div className="category-dropdown-menu">
            {loading ? (
              <div className="dropdown-loading">Loading...</div>
            ) : (
              <>
                <button
                  className={`dropdown-item ${!selectedCategory ? "active" : ""}`}
                  onClick={() => handleCategorySelect(null)}
                >
                  <span className="item-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
                  All Sarees
                </button>

                {categories.length > 0 ? (
                  categories.map((category) => (
                    <button
                      key={category.id}
                      className={`dropdown-item ${
                        selectedCategory === category.id ? "active" : ""
                      }`}
                      onClick={() => handleCategorySelect(category.id)}
                      title={category.description}
                    >
                      <span className="item-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>
                      {category.name}
                    </button>
                  ))
                ) : (
                  <div className="dropdown-empty">No categories available</div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategorySidebar;
