import { Router } from 'express';
import * as ctrl from '../controllers/usersController';

const router = Router();

router.get('/', ctrl.listUsers);
router.post('/', ctrl.addUser);
router.put('/:id', ctrl.updateUserRole);
router.delete('/:id', ctrl.deleteUser);

// tenant-aware
router.get('/tenant/:orgId', ctrl.listTenantUsers);
router.post('/tenant/:orgId/invite', ctrl.inviteUserToTenant);
router.post('/:id/removeFromTenant', ctrl.removeUserFromTenant);

export default router;
