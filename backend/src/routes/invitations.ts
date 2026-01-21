import { Router } from 'express';
import { postCreateInvitation, getValidateInvitation, postRedeemInvitation } from '../controllers/invitationsController';

const router = Router();

router.post('/', postCreateInvitation);
router.get('/:code', getValidateInvitation);
router.post('/redeem', postRedeemInvitation);

export default router;
