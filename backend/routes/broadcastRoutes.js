
import express from 'express';
import { getAllBroadcasts, createBroadcast, deleteBroadcast, getActiveBroadcasts } from '../controllers/broadcastController.js';

const router = express.Router();

router.get('/broadcasts', getAllBroadcasts);
router.get('/broadcasts/active', getActiveBroadcasts);
router.post('/broadcasts', createBroadcast);
router.delete('/broadcasts/:id', deleteBroadcast);

export default router;
