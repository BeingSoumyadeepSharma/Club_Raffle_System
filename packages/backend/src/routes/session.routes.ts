import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Session, CreateSessionDTO } from '@raffle/shared';
import { requireAuth, requireEntityAccess } from '../middleware/auth.middleware';
import { sessionRepository, ticketCounterRepository, purchaseRepository, entityRepository } from '../data/repositories';

const router = Router();

// Get active session for an entity
router.get('/active/:entityId', requireAuth, requireEntityAccess('entityId'), (req: Request, res: Response) => {
  const { entityId } = req.params;
  
  const session = sessionRepository.findActiveByEntityId(entityId);
  
  if (!session) {
    return res.json({ success: true, data: null });
  }
  
  return res.json({ success: true, data: session });
});

// Get all sessions for an entity (with optional filters)
router.get('/entity/:entityId', requireAuth, requireEntityAccess('entityId'), (req: Request, res: Response) => {
  const { entityId } = req.params;
  const { startDate, endDate, status } = req.query;
  
  const sessions = sessionRepository.findByDateRange(
    entityId,
    startDate as string | undefined,
    endDate as string | undefined,
    status as string | undefined
  );
  
  res.json({ success: true, data: sessions });
});

// Get session by ID
router.get('/:id', requireAuth, (req: Request, res: Response) => {
  const session = sessionRepository.findById(req.params.id);
  
  if (!session) {
    return res.status(404).json({ success: false, error: 'Session not found' });
  }
  
  return res.json({ success: true, data: session });
});

// Start a new session
router.post('/start', requireAuth, (req: Request, res: Response) => {
  const { entityId } = req.body as CreateSessionDTO;
  
  if (!entityId) {
    return res.status(400).json({ success: false, error: 'Entity ID is required' });
  }
  
  // Verify user has access to this entity
  const user = req.user!;
  if (user.role !== 'superuser') {
    // Non-superusers need entity assignment check
    const entity = entityRepository.findById(entityId);
    if (!entity) {
      return res.status(404).json({ success: false, error: 'Entity not found' });
    }
  }
  
  // Check if there's already an active session for this entity
  const activeSession = sessionRepository.findActiveByEntityId(entityId);
  if (activeSession) {
    return res.status(400).json({ 
      success: false, 
      error: 'There is already an active session for this entity. Please close it first.',
      activeSession 
    });
  }
  
  // Reset the ticket counter for a new session
  ticketCounterRepository.resetCounter(entityId);
  
  const now = new Date();
  const session: Session = {
    id: uuidv4(),
    entityId,
    userId: user.userId,
    username: user.username,
    startedAt: now,
    endedAt: null,
    startTicketNumber: 1,
    endTicketNumber: null,
    ticketsSold: 0,
    totalRevenue: 0,
    status: 'active',
    createdAt: now,
    updatedAt: now
  };
  
  const createdSession = sessionRepository.create(session);
  
  return res.status(201).json({ success: true, data: createdSession });
});

// Close a session
router.post('/close/:id', requireAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  
  const session = sessionRepository.findById(id);
  if (!session) {
    return res.status(404).json({ success: false, error: 'Session not found' });
  }
  
  if (session.status !== 'active') {
    return res.status(400).json({ success: false, error: 'Session is already closed' });
  }
  
  // Verify user has permission (must be the session owner, a superuser, or have entity access)
  const user = req.user!;
  if (user.role !== 'superuser' && session.userId !== user.userId) {
    return res.status(403).json({ success: false, error: 'You can only close your own sessions' });
  }
  
  // Calculate final stats from purchases in this session
  const purchases = purchaseRepository.findBySessionId(id);
  const ticketsSold = purchases.reduce((sum, p) => sum + p.ticketCount, 0);
  const totalRevenue = purchases.reduce((sum, p) => sum + p.totalPrice, 0);
  const endTicketNumber = purchases.length > 0 
    ? Math.max(...purchases.map(p => p.endTicketNumber))
    : session.startTicketNumber - 1;
  
  const closedSession = sessionRepository.update(id, {
    status: 'closed',
    endedAt: new Date(),
    ticketsSold,
    totalRevenue,
    endTicketNumber
  });
  
  return res.json({ success: true, data: closedSession });
});

// Get session summary (for export/reporting)
router.get('/:id/summary', requireAuth, (req: Request, res: Response) => {
  const session = sessionRepository.findById(req.params.id);
  
  if (!session) {
    return res.status(404).json({ success: false, error: 'Session not found' });
  }
  
  const entity = entityRepository.findById(session.entityId);
  const purchases = purchaseRepository.findBySessionId(session.id);
  
  const summary = {
    session,
    entityName: entity?.displayName || 'Unknown',
    purchases,
    stats: {
      ticketsSold: purchases.reduce((sum, p) => sum + p.ticketCount, 0),
      totalRevenue: purchases.reduce((sum, p) => sum + p.totalPrice, 0),
      paidAmount: purchases.filter(p => p.isPaid).reduce((sum, p) => sum + p.totalPrice, 0),
      unpaidAmount: purchases.filter(p => !p.isPaid).reduce((sum, p) => sum + p.totalPrice, 0),
      purchaseCount: purchases.length
    }
  };
  
  return res.json({ success: true, data: summary });
});

// Get my active sessions (for current user)
router.get('/my/active', requireAuth, (req: Request, res: Response) => {
  const sessions = sessionRepository.findActiveByUserId(req.user!.userId);
  res.json({ success: true, data: sessions });
});

export default router;
