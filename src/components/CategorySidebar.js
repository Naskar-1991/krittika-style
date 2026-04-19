import React, { useState, useEffect } from "react";
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

  useEffect(() => {
    loadCategories();
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
    <div className="category-sidebar-wrapper">
      <div className={`category-dropdown ${isOpen ? "open" : ""}`}>
        <button
          className="category-dropdown-trigger"
          onClick={() => setIsOpen(!isOpen)}
          disabled={loading}
        >
          <span className="dropdown-icon">📁</span>
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
                  <span className="item-icon">✓</span>
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
                      <span className="item-icon">✓</span>
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
