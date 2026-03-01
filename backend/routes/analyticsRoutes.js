
import express from "express";
import { protect, admin } from '../middleware/auth.js';
import {
	getAuditLogs,
	getDeptDistribution,
	getLoginTrends,
	getAppUsage
} from "../controllers/analyticsController.js";

const router = express.Router();

router.get('/analytics/logs', protect, admin, getAuditLogs);
router.get('/analytics/distribution', protect, admin, getDeptDistribution);
router.get('/analytics/trends', protect, admin, getLoginTrends);
router.get('/analytics/usage', protect, admin, getAppUsage);

export default router;
