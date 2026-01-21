import { Router } from 'express';
import {
	getListTenantAppointments,
	getTenantAppointment,
	postCreateTenantAppointment,
	postCreateTenantAppointmentWithSlot,
	putUpdateTenantAppointment,
	deleteTenantAppointment,
	getAppointmentsByDate,
} from '../controllers/appointmentsController';

const router = Router();

// List appointments for org/calendar
router.get('/', getListTenantAppointments);

// Query appointments by date
router.get('/by-date', getAppointmentsByDate);

// Get single appointment
router.get('/:id', getTenantAppointment);

// Create
router.post('/', postCreateTenantAppointment);

// Create + book slot atomically
router.post('/with-slot', postCreateTenantAppointmentWithSlot);

// Update
router.put('/:id', putUpdateTenantAppointment);

// Delete
router.delete('/:id', deleteTenantAppointment);

export default router;
