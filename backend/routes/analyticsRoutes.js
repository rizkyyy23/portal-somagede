import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.get('/analytics/logs', protect, admin, getAuditLogs);
router.get('/analytics/distribution', protect, admin, getDeptDistribution);
router.get('/analytics/trends', protect, admin, getLoginTrends);
router.get('/analytics/usage', protect, admin, getAppUsage);

export default router;
