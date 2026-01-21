import { Router } from 'express';
import * as settingsController from '../controllers/settingsController';

const router = Router();

// Main settings
router.get('/', settingsController.getSettings);
router.put('/', settingsController.updateSettings);

// Tenant-aware settings
router.get('/:orgId/:calendarId', settingsController.getTenantSettings);
router.put('/:orgId/:calendarId', settingsController.updateTenantSettings);

export default router;
