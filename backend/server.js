import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js";
import broadcastRoutes from "./routes/broadcastRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import roleRoutes from "./routes/roleRoutes.js";
import positionRoutes from "./routes/positionRoutes.js";
import apiConfigRoutes from "./routes/apiConfigRoutes.js";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// Routes
app.use("/api", userRoutes);
app.use("/api", departmentRoutes);
app.use("/api", sessionRoutes);
app.use("/api", broadcastRoutes);
app.use("/api", analyticsRoutes);
app.use("/api", applicationRoutes);
app.use("/api", roleRoutes);
app.use("/api", positionRoutes);
app.use("/api", apiConfigRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    message: "Portal Somagede Backend API is running",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
  console.log(`💊 Health check at http://localhost:${PORT}/health`);
});
