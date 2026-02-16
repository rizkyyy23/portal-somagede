import express from "express";
import {
  getAllDepartments,
  getAllDepartmentPermissions,
  getDepartmentPermissions,
  updateDepartmentPermissions,
  toggleDepartmentPermission,
} from "../controllers/departmentController.js";

const router = express.Router();

// Department routes
router.get("/departments", getAllDepartments);
router.get("/departments/permissions", getAllDepartmentPermissions);
router.get("/departments/:departmentId/permissions", getDepartmentPermissions);
router.put(
  "/departments/:departmentId/permissions",
  updateDepartmentPermissions,
);
router.patch(
  "/departments/:departmentId/permissions/:applicationId",
  toggleDepartmentPermission,
);

export default router;
