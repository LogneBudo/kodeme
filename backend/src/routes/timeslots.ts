import { Router } from 'express';
import * as ctrl from '../controllers/timeslotsController';
const router = Router();

// non-tenant
router.get('/', ctrl.listTimeSlots);
router.get('/:id', ctrl.getTimeSlot);
router.post('/', ctrl.createTimeSlot);
router.put('/:id', ctrl.updateTimeSlot);
router.delete('/:id', ctrl.deleteTimeSlot);

// tenant-aware
router.get('/tenant/:orgId/:calendarId', ctrl.listTenantTimeSlots);
router.get('/tenant/:orgId/:calendarId/:id', ctrl.getTenantTimeSlot);
router.post('/tenant/:orgId/:calendarId', ctrl.createTenantTimeSlot);
router.put('/tenant/:orgId/:calendarId/:id', ctrl.updateTenantTimeSlot);
router.delete('/tenant/:orgId/:calendarId/:id', ctrl.deleteTenantTimeSlot);

export default router;
