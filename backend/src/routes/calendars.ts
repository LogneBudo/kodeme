import { Router } from 'express';
import {
  listTenantCalendars,
  getTenantCalendar,
  getCalendarUnsafe,
  postCreateTenantCalendar,
  putUpdateTenantCalendar,
  deleteTenantCalendar,
} from '../controllers/calendarsController';

const router = Router();

// List
router.get('/', listTenantCalendars);

// Unsafe fetch
router.get('/unsafe/:id', getCalendarUnsafe);

// Get single (with org verification)
router.get('/:id', getTenantCalendar);

// Create
router.post('/', postCreateTenantCalendar);

// Update
router.put('/:id', putUpdateTenantCalendar);

// Delete
router.delete('/:id', deleteTenantCalendar);

export default router;
