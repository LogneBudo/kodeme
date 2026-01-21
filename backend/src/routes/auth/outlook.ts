import { Router } from 'express';
import { init, callback } from '../../controllers/auth/outlookController';

const router = Router();

router.get('/init', init);
router.get('/callback', callback);

export default router;
