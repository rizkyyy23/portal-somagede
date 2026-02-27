import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.get('/broadcasts', protect, admin, getAllBroadcasts);           // Active (non-deleted) list
router.get('/broadcasts/history', protect, admin, getAllBroadcastsHistory); // Full history including soft-deleted
router.get('/broadcasts/active', getActiveBroadcasts); // For user view (filtered - keep public/auth depending on flow, but usually need auth)
router.post('/broadcasts', protect, admin, createBroadcast);
router.delete('/broadcasts/:id', protect, admin, deleteBroadcast);     // Soft delete

export default router;
