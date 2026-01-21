import { Router } from 'express';
import { getEnv } from '../controllers/debugController';

const router = Router();

router.get('/env', getEnv);

export default router;
