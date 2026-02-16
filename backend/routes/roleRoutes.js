import express from 'express';
import { getAllRoles, createRole, updateRole, deleteRole, toggleRoleStatus } from '../controllers/roleController.js';

const router = express.Router();

router.get('/roles', getAllRoles);
router.post('/roles', createRole);
router.put('/roles/:id', updateRole);
router.delete('/roles/:id', deleteRole);
router.patch('/roles/:id/toggle', toggleRoleStatus);

export default router;
