import express from 'express';
import { 
  getAllConfigs, 
  createConfig, 
  updateConfig, 
  deleteConfig, 
  testConnection 
} from '../controllers/apiConfigController.js';

const router = express.Router();

router.get('/', getAllConfigs);
router.post('/', createConfig);
router.put('/:id', updateConfig);
router.delete('/:id', deleteConfig);
router.post('/:id/test', testConnection);

export default router;
