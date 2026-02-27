import express from "express";
import {
  getAllUsers,
  getActiveUsers,
  getInactiveUsers,
  getAdminUsers,
  getPrivilegeUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserPrivileges,
  updateUserPrivileges,
  loginUser,
  changePassword,
  syncAllUsers,
} from "../controllers/userController.js";
import { upload } from "../utils/upload.js";

import { protect, admin } from "../middleware/auth.js";

const router = express.Router();

// User routes
router.get("/users", protect, admin, getAllUsers);
router.get("/users/active", protect, getActiveUsers);
router.get("/users/sync-metrics", protect, admin, syncAllUsers);
router.get("/users/inactive", protect, admin, getInactiveUsers);
router.get("/users/admins", protect, admin, getAdminUsers);
router.get("/users/privilege", protect, admin, getPrivilegeUsers);
router.get("/users/:id", protect, getUserById);
router.post("/users", protect, admin, upload.single("avatar"), createUser);
router.post("/users/login", loginUser);
router.put("/users/:id/change-password", protect, changePassword);
router.put("/users/:id", protect, admin, upload.single("avatar"), updateUser);
router.delete("/users/:id", protect, admin, deleteUser);

// Privilege routes
// Get user privileges (aplikasi dengan akses khusus)
router.get("/users/:id/privileges", protect, getUserPrivileges);

// Update user privileges (aplikasi dengan akses khusus)
router.put("/users/:id/privileges", protect, admin, updateUserPrivileges);

export default router;
