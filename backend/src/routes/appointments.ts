import { Router } from 'express';
import { postCreateTenantAppointment } from '../controllers/appointmentsController';

const router = Router();

router.post('/', postCreateTenantAppointment);

export default router;
