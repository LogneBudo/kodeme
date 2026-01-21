import { Router } from 'express';
import {
  postCreateOrganization,
  getOrganization,
  getTenantByUser,
  putUpdateOrganization,
} from '../controllers/organizationsController';

const router = Router();

// Create organization
router.post('/', postCreateOrganization);

// Get organization by id
router.get('/:id', getOrganization);

// Get organization by user
router.get('/by-user', getTenantByUser);

// Update
router.put('/:id', putUpdateOrganization);

export default router;
