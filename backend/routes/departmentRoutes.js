import { protect, admin } from "../middleware/auth.js";

const router = express.Router();

// Department routes
router.get("/departments", protect, getAllDepartments);
router.get("/departments/permissions", protect, admin, getAllDepartmentPermissions);
router.get("/departments/:departmentId/permissions", protect, admin, getDepartmentPermissions);
router.put(
  "/departments/:departmentId/permissions",
  protect,
  admin,
  updateDepartmentPermissions,
);
router.patch(
  "/departments/:departmentId/permissions/:applicationId",
  protect,
  admin,
  toggleDepartmentPermission,
);

export default router;
