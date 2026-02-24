
import express from 'express';
import { getAllBroadcasts, getAllBroadcastsHistory, createBroadcast, deleteBroadcast, getActiveBroadcasts } from '../controllers/broadcastController.js';

const router = express.Router();

router.get('/broadcasts', getAllBroadcasts);           // Active (non-deleted) list
router.get('/broadcasts/history', getAllBroadcastsHistory); // Full history including soft-deleted
router.get('/broadcasts/active', getActiveBroadcasts); // For user view (filtered)
router.post('/broadcasts', createBroadcast);
router.delete('/broadcasts/:id', deleteBroadcast);     // Soft delete

export default router;
