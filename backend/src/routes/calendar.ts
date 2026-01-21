import { Router } from 'express';
import { getEvents, postDisconnect, getStatus } from '../controllers/calendarController';

const router = Router();

router.get('/events', getEvents);
router.post('/disconnect', postDisconnect);
router.get('/status', getStatus);

export default router;
