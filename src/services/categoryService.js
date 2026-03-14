import API_URL from "../api_connection/BackendAPIConnection";

// Get all active categories
export const fetchCategories = async () => {
  try {
    const response = await fetch(`${API_URL}/api/categories`);
    if (!response.ok) throw new Error("Failed to fetch categories");
    return await response.json();
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
};

// Get category by slug
export const fetchCategoryBySlug = async (slug) => {
  try {
    const response = await fetch(`${API_URL}/api/categories/${slug}`);
    if (!response.ok) throw new Error("Failed to fetch category");
    return await response.json();
  } catch (error) {
    console.error("Error fetching category:", error);
    return null;
  }
};

// Get category by ID
export const fetchCategoryById = async (id) => {
  try {
    const response = await fetch(`${API_URL}/api/categories/id/${id}`);
    if (!response.ok) throw new Error("Failed to fetch category");
    return await response.json();
  } catch (error) {
    console.error("Error fetching category:", error);
    return null;
  }
};

// Admin: Get all categories (including inactive)
export const fetchAllCategories = async (token) => {
  try {
    const response = await fetch(`${API_URL}/api/categories/all`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error("Failed to fetch categories");
    return await response.json();
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
};

// Admin: Create category
export const createCategory = async (categoryData, token) => {
  try {
    const response = await fetch(`${API_URL}/api/categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(categoryData),
    });
    if (!response.ok) throw new Error("Failed to create category");
    return await response.json();
  } catch (error) {
    console.error("Error creating category:", error);
    throw error;
  }
};

// Admin: Update category
export const updateCategory = async (id, categoryData, token) => {
  try {
    const response = await fetch(`${API_URL}/api/categories/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(categoryData),
    });
    if (!response.ok) throw new Error("Failed to update category");
    return await response.json();
  } catch (error) {
    console.error("Error updating category:", error);
    throw error;
  }
};

// Admin: Delete category
export const deleteCategory = async (id, token) => {
  try {
    const response = await fetch(`${API_URL}/api/categories/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error("Failed to delete category");
    return await response.json();
  } catch (error) {
    console.error("Error deleting category:", error);
    throw error;
  }
};
