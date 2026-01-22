import settingsRoutes from './settings';
import { Router } from 'express';

import invitationsRoutes from './invitations';

import bookingConfirmationRoutes from './bookingConfirmation';

import calendarRoutes from './calendar';

import googleAuthRoutes from './auth/google';
import outlookAuthRoutes from './auth/outlook';

import debugRoutes from './debug';
import docsRoutes from './docs';
import appointmentsRoutes from './appointments';
import calendarsRoutes from './calendars';
import organizationsRoutes from './organizations';
import tiersRoutes from './tiers';
import timeslotsRoutes from './timeslots';
import usersRoutes from './users';

const router = Router();


router.get('/', (req, res) => {
  res.json({ message: 'Kodeme backend API root' });
});

router.use('/invitations', invitationsRoutes);
router.use('/booking-confirmation', bookingConfirmationRoutes);
router.use('/calendar', calendarRoutes);
router.use('/appointments', appointmentsRoutes);
router.use('/calendars', calendarsRoutes);
router.use('/organizations', organizationsRoutes);
router.use('/tiers', tiersRoutes);
router.use('/timeslots', timeslotsRoutes);
router.use('/users', usersRoutes);
router.use('/settings', settingsRoutes);
router.use('/auth/google', googleAuthRoutes);
router.use('/auth/outlook', outlookAuthRoutes);
router.use('/debug', debugRoutes);
router.use('/api-docs', docsRoutes);

export default router;
