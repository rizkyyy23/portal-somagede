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

const router = express.Router();

// User routes
router.get("/users", getAllUsers);
router.get("/users/active", getActiveUsers);
router.get("/users/sync-metrics", syncAllUsers);
router.get("/users/inactive", getInactiveUsers);
router.get("/users/admins", getAdminUsers);
router.get("/users/privilege", getPrivilegeUsers);
router.get("/users/:id", getUserById);
router.post("/users", upload.single("avatar"), createUser);
router.post("/users/login", loginUser);
router.put("/users/:id/change-password", changePassword);
router.put("/users/:id", upload.single("avatar"), updateUser);
router.delete("/users/:id", deleteUser);

// Privilege routes
// Get user privileges (aplikasi dengan akses khusus)
router.get("/users/:id/privileges", getUserPrivileges);

// Update user privileges (aplikasi dengan akses khusus)
router.put("/users/:id/privileges", updateUserPrivileges);

export default router;
