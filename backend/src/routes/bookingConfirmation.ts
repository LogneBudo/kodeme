import { Router } from 'express';
import { postBookingConfirmation } from '../controllers/bookingConfirmationController';

const router = Router();

router.post('/', postBookingConfirmation);

export default router;
