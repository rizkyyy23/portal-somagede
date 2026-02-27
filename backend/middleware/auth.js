import jwt from "jsonwebtoken";
import pool from "../config/database.js";

// Verify JWT Token
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "somagede_secret_key");

      // Get user from the token (excluding password)
      const [rows] = await pool.query(
        "SELECT id, name, email, role, status FROM users WHERE id = ?",
        [decoded.id]
      );

      if (rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: "Not authorized, user not found",
        });
      }

      const user = rows[0];

      if (user.status !== "active") {
        return res.status(401).json({
          success: false,
          message: "User account is suspended",
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error("JWT Auth Error:", error);
      return res.status(401).json({
        success: false,
        message: "Not authorized, token failed",
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, no token",
    });
  }
};

// Check if user is Admin
export const admin = (req, res, next) => {
  if (req.user && req.user.role === "Admin") {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: "Not authorized as an admin",
    });
  }
};
