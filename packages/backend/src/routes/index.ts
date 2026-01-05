import { Router } from 'express';
import entityRoutes from './entity.routes';
import ticketRoutes from './ticket.routes';
import raffleRoutes from './raffle.routes';
import exportRoutes from './export.routes';
import authRoutes from './auth.routes';
import sessionRoutes from './session.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/entities', entityRoutes);
router.use('/tickets', ticketRoutes);
router.use('/raffles', raffleRoutes);
router.use('/export', exportRoutes);
router.use('/sessions', sessionRoutes);

export default router;
