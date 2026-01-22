import { Router } from 'express';
import * as tiersController from '../controllers/tiersController';

const router = Router();

router.get('/can-add-user/:orgId', tiersController.canAddUserToTenant);
router.get('/can-add-branch/:orgId', tiersController.canAddBranchToTenant);
router.get('/has-feature/:orgId/:feature', tiersController.hasTierFeature);

export default router;
