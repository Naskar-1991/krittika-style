const express = require("express");
const router = express.Router();
const pool = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const SECRET = process.env.JWT_SECRET || "supersecret";

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Middleware to verify admin role
const verifyAdmin = async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT role FROM users WHERE id=$1",
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
    
    const user = result.rows[0];
    if (user.role !== "admin") return res.status(403).json({ error: "Admin access required" });
    
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Test endpoint - verify token is valid
router.get("/test", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT id, role FROM users WHERE id=$1", [req.user.id]);
    res.json({ 
      message: "Token valid", 
      userId: req.user.id,
      userRole: result.rows[0]?.role,
      tokenInfo: req.user
    });
  } catch (err) {
    res.status(500).json({ error: err.message, message: "Database error" });
  }
});

// Get all users (admin only)
router.get("/", authenticateToken, verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, mobile, role, created_at FROM users ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: err.message, code: err.code });
  }
});

// Get single user by ID (admin only)
router.get("/:id", authenticateToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "SELECT id, name, email, mobile, role, created_at FROM users WHERE id=$1",
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user (admin only) - can change name, email, password, role, mobile
router.put("/:id", authenticateToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, email, password, role, mobile } = req.body;

  try {
    // Get current user data if not updating password
    let updateQuery = "UPDATE users SET ";
    let params = [];
    let paramIndex = 1;

    const updates = [];
    if (name !== undefined) {
      updates.push(`name=$${paramIndex}`);
      params.push(name);
      paramIndex++;
    }
    if (email !== undefined) {
      updates.push(`email=$${paramIndex}`);
      params.push(email);
      paramIndex++;
    }
    if (mobile !== undefined) {
      updates.push(`mobile=$${paramIndex}`);
      params.push(mobile || null);
      paramIndex++;
    }
    if (password !== undefined) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push(`password=$${paramIndex}`);
      params.push(hashedPassword);
      paramIndex++;
    }
    if (role !== undefined) {
      updates.push(`role=$${paramIndex}`);
      params.push(role);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    updateQuery += updates.join(", ");
    updateQuery += ` WHERE id=$${paramIndex} RETURNING id, name, email, mobile, role, created_at`;
    params.push(id);

    const result = await pool.query(updateQuery, params);
    
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update own profile (user can update name and mobile)
router.put("/:id/profile", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, mobile } = req.body;

  // User can only update their own profile
  if (parseInt(id) !== req.user.id) {
    return res.status(403).json({ error: "Can only update your own profile" });
  }

  try {
    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    const updateQuery = `
      UPDATE users 
      SET name=$1, mobile=$2 
      WHERE id=$3 
      RETURNING id, name, email, mobile, role, created_at
    `;

    const result = await pool.query(updateQuery, [name, mobile || null, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change password endpoint
router.put("/:id/change-password", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;

  // User can only change their own password
  if (parseInt(id) !== req.user.id) {
    return res.status(403).json({ error: "Can only change your own password" });
  }

  try {
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters" });
    }

    // Get current password hash
    const userResult = await pool.query(
      "SELECT password FROM users WHERE id=$1",
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify current password
    const user = userResult.rows[0];
    const validPassword = await bcrypt.compare(currentPassword, user.password);

    if (!validPassword) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    // Hash new password and update
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    const updateResult = await pool.query(
      "UPDATE users SET password=$1 WHERE id=$2 RETURNING id, name, email, role",
      [hashedNewPassword, id]
    );

    res.json({ 
      message: "Password changed successfully", 
      user: updateResult.rows[0] 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.delete("/:id", authenticateToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;

  // Prevent self-deletion
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ error: "Cannot delete your own account" });
  }

  try {
    const result = await pool.query(
      "DELETE FROM users WHERE id=$1 RETURNING id, name, email",
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted successfully", user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
