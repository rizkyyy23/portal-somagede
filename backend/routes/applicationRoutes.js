import express from 'express';
import { 
  getApplications, 
  getApplicationsByCategory,
  getApplicationById,
  getApplicationByCode,
  createApplication,
  updateApplication,
  deleteApplication
} from '../controllers/applicationController.js';
import { upload } from '../utils/upload.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/applications - Get all applications
router.get('/applications', protect, getApplications);

// GET /api/applications/categories - Get applications grouped by category (Public for login selection/display)
router.get('/applications/categories', getApplicationsByCategory);

// GET /api/applications/code/:code - Get application by code
router.get('/applications/code/:code', protect, getApplicationByCode);

// GET /api/applications/:id - Get application by ID
router.get('/applications/:id', protect, getApplicationById);

// POST /api/applications - Create new application
router.post('/applications', protect, admin, upload.single('icon'), createApplication);

// PUT /api/applications/:id - Update application
router.put('/applications/:id', protect, admin, upload.single('icon'), updateApplication);

// DELETE /api/applications/:id - Delete application
router.delete('/applications/:id', protect, admin, deleteApplication);

export default router;