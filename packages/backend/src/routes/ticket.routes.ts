import { Router, Request, Response } from 'express';
import { ticketService } from '../services/ticket.service';
import { CreateTicketPurchaseDTO } from '@raffle/shared';
import { requireAuth, requireEntityAccess } from '../middleware/auth.middleware';
import { authService } from '../services/auth.service';

const router = Router();

// Get all purchases (filtered by user access)
router.get('/purchases', requireAuth, (req: Request, res: Response) => {
  const allPurchases = ticketService.getAllPurchases();
  
  // Superusers see all purchases
  if (req.user?.role === 'superuser') {
    return res.json({ success: true, data: allPurchases });
  }
  
  // Regular users only see purchases for their assigned entities
  const userEntities = authService.getUserEntities(req.user!.userId);
  const filteredPurchases = allPurchases.filter(p => userEntities.includes(p.entityId));
  res.json({ success: true, data: filteredPurchases });
});

// Get purchases by entity (optionally filtered by session)
router.get('/purchases/entity/:entityId', requireAuth, requireEntityAccess('entityId'), (req: Request, res: Response) => {
  const { sessionOnly, sessionId, startDate, endDate } = req.query;
  
  let purchases;
  if (sessionId) {
    // Get purchases for specific session
    purchases = ticketService.getPurchasesBySession(sessionId as string);
  } else if (sessionOnly === 'true') {
    // Get only current session purchases
    purchases = ticketService.getPurchasesByEntity(req.params.entityId, true);
  } else if (startDate || endDate) {
    // Get purchases by date range
    purchases = ticketService.getPurchasesByEntityAndDateRange(
      req.params.entityId, 
      startDate as string, 
      endDate as string
    );
  } else {
    // Get all purchases for entity
    purchases = ticketService.getPurchasesByEntity(req.params.entityId, false);
  }
  
  res.json({ success: true, data: purchases });
});

// Get purchase by ID
router.get('/purchases/:id', requireAuth, (req: Request, res: Response) => {
  const purchase = ticketService.getPurchaseById(req.params.id);
  if (!purchase) {
    return res.status(404).json({ success: false, error: 'Purchase not found' });
  }
  
  // Check entity access
  if (req.user?.role !== 'superuser') {
    const userEntities = authService.getUserEntities(req.user!.userId);
    if (!userEntities.includes(purchase.entityId)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
  }
  
  res.json({ success: true, data: purchase });
});

// Delete purchase
router.delete('/purchases/:id', requireAuth, (req: Request, res: Response) => {
  const purchase = ticketService.getPurchaseById(req.params.id);
  if (!purchase) {
    return res.status(404).json({ success: false, error: 'Purchase not found' });
  }
  
  // Check entity access
  if (req.user?.role !== 'superuser') {
    const userEntities = authService.getUserEntities(req.user!.userId);
    if (!userEntities.includes(purchase.entityId)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
  }
  
  const success = ticketService.deletePurchase(req.params.id);
  if (!success) {
    return res.status(404).json({ success: false, error: 'Purchase not found' });
  }
  res.json({ success: true, message: 'Purchase deleted successfully' });
});

// Get receipt for purchase
router.get('/purchases/:id/receipt', requireAuth, (req: Request, res: Response) => {
  const purchase = ticketService.getPurchaseById(req.params.id);
  if (!purchase) {
    return res.status(404).json({ success: false, error: 'Purchase not found' });
  }
  
  // Check entity access
  if (req.user?.role !== 'superuser') {
    const userEntities = authService.getUserEntities(req.user!.userId);
    if (!userEntities.includes(purchase.entityId)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
  }
  
  const receipt = ticketService.getReceiptForPurchase(req.params.id);
  res.json({ success: true, data: { receipt } });
});

// Get receipt as plain text
router.get('/purchases/:id/receipt/text', requireAuth, (req: Request, res: Response) => {
  const purchase = ticketService.getPurchaseById(req.params.id);
  if (!purchase) {
    return res.status(404).json({ success: false, error: 'Purchase not found' });
  }
  
  // Check entity access
  if (req.user?.role !== 'superuser') {
    const userEntities = authService.getUserEntities(req.user!.userId);
    if (!userEntities.includes(purchase.entityId)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
  }
  
  const receipt = ticketService.getReceiptForPurchase(req.params.id);
  res.type('text/plain').send(receipt);
});

// Purchase tickets
router.post('/purchase', requireAuth, requireEntityAccess('entityId'), (req: Request, res: Response) => {
  const dto: CreateTicketPurchaseDTO = req.body;
  
  if (!dto.entityId || !dto.buyerName || !dto.ticketCount || !dto.pricePerTicket) {
    return res.status(400).json({ 
      success: false, 
      error: 'entityId, buyerName, ticketCount, and pricePerTicket are required' 
    });
  }

  if (dto.ticketCount <= 0) {
    return res.status(400).json({ 
      success: false, 
      error: 'ticketCount must be greater than 0' 
    });
  }

  const result = ticketService.purchaseTickets(dto);
  
  if (!result) {
    return res.status(404).json({ success: false, error: 'Entity not found' });
  }

  res.status(201).json({ 
    success: true, 
    data: {
      purchase: result.purchase,
      receipt: result.receipt
    }
  });
});

// Reset ticket counter for an entity
router.post('/reset-counter/:entityId', requireAuth, requireEntityAccess('entityId'), (req: Request, res: Response) => {
  const success = ticketService.resetTicketCounter(req.params.entityId);
  
  if (!success) {
    return res.status(404).json({ success: false, error: 'Entity not found' });
  }

  res.json({ success: true, message: 'Ticket counter has been reset to 0' });
});

// Get ticket stats for an entity
router.get('/stats/:entityId', requireAuth, requireEntityAccess('entityId'), (req: Request, res: Response) => {
  const stats = ticketService.getTicketStats(req.params.entityId);
  res.json({ success: true, data: stats });
});

// Generate announcement for an entity
router.post('/announcement', requireAuth, requireEntityAccess('entityId'), (req: Request, res: Response) => {
  const { entityId, rafflerName, pricePerTicket } = req.body;
  
  if (!entityId || !rafflerName || !pricePerTicket) {
    return res.status(400).json({ 
      success: false, 
      error: 'entityId, rafflerName, and pricePerTicket are required' 
    });
  }

  const announcement = ticketService.generateAnnouncement(entityId, rafflerName, pricePerTicket);
  
  if (!announcement) {
    return res.status(404).json({ success: false, error: 'Entity not found' });
  }

  res.json({ success: true, data: { announcement } });
});

// Update payment status for a purchase
router.patch('/purchases/:id/payment', requireAuth, (req: Request, res: Response) => {
  const { isPaid } = req.body;
  
  if (typeof isPaid !== 'boolean') {
    return res.status(400).json({ 
      success: false, 
      error: 'isPaid (boolean) is required' 
    });
  }

  const purchase = ticketService.getPurchaseById(req.params.id);
  if (!purchase) {
    return res.status(404).json({ success: false, error: 'Purchase not found' });
  }
  
  // Check entity access
  if (req.user?.role !== 'superuser') {
    const userEntities = authService.getUserEntities(req.user!.userId);
    if (!userEntities.includes(purchase.entityId)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
  }

  const result = ticketService.updatePaymentStatus(req.params.id, isPaid);
  res.json({ success: true, data: result });
});

// Update buyer name for a purchase
router.patch('/purchases/:id/buyer', requireAuth, (req: Request, res: Response) => {
  const { buyerName } = req.body;
  
  if (!buyerName || typeof buyerName !== 'string' || buyerName.trim().length === 0) {
    return res.status(400).json({ 
      success: false, 
      error: 'buyerName (non-empty string) is required' 
    });
  }

  const purchase = ticketService.getPurchaseById(req.params.id);
  if (!purchase) {
    return res.status(404).json({ success: false, error: 'Purchase not found' });
  }
  
  // Check entity access
  if (req.user?.role !== 'superuser') {
    const userEntities = authService.getUserEntities(req.user!.userId);
    if (!userEntities.includes(purchase.entityId)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
  }

  const result = ticketService.updateBuyerName(req.params.id, buyerName.trim());
  res.json({ success: true, data: result });
});

export default router;
