import express from 'express';
import { getAuditLogs, getDeptDistribution, getLoginTrends, getAppUsage } from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/analytics/logs', getAuditLogs);
router.get('/analytics/distribution', getDeptDistribution);
router.get('/analytics/trends', getLoginTrends);
router.get('/analytics/usage', getAppUsage);

export default router;
