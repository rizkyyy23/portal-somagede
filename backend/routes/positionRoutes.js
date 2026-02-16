import express from 'express';
import { 
  getAllPositions, 
  createPosition, 
  updatePosition, 
  deletePosition,
  togglePositionStatus
} from '../controllers/positionController.js';

const router = express.Router();

// GET /api/positions - Get all positions
router.get('/positions', getAllPositions);

// POST /api/positions - Create new position
router.post('/positions', createPosition);

// PUT /api/positions/:id - Update position
router.put('/positions/:id', updatePosition);

// DELETE /api/positions/:id - Delete position
router.delete('/positions/:id', deletePosition);

// PATCH /api/positions/:id/toggle - Toggle position status
router.patch('/positions/:id/toggle', togglePositionStatus);

export default router;
