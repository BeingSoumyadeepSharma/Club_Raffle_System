import { v4 as uuidv4 } from 'uuid';
import { 
  TicketPurchase, 
  RaffleTicket, 
  CreateTicketPurchaseDTO,
  generateReceipt 
} from '@raffle/shared';
import { purchaseRepository, ticketCounterRepository, entityRepository, sessionRepository } from '../data/repositories';

export class TicketService {
  purchaseTickets(dto: CreateTicketPurchaseDTO, sessionId?: string): { purchase: TicketPurchase; receipt: string } | null {
    const entity = entityRepository.findById(dto.entityId);
    if (!entity) {
      return null;
    }

    // Get active session for this entity if not provided
    let activeSessionId = sessionId;
    if (!activeSessionId) {
      const activeSession = sessionRepository.findActiveByEntityId(dto.entityId);
      activeSessionId = activeSession?.id || null;
    }

    const purchaseId = uuidv4();
    const startTicketNumber = ticketCounterRepository.getNextTicketNumber(dto.entityId);
    const endTicketNumber = startTicketNumber + dto.ticketCount - 1;
    const totalPrice = dto.ticketCount * dto.pricePerTicket;

    // Generate individual tickets
    const tickets: RaffleTicket[] = [];
    for (let i = startTicketNumber; i <= endTicketNumber; i++) {
      tickets.push({
        id: uuidv4(),
        ticketNumber: i,
        purchaseId,
        createdAt: new Date()
      });
    }

    const purchase: TicketPurchase = {
      id: purchaseId,
      entityId: dto.entityId,
      sessionId: activeSessionId,
      buyerName: dto.buyerName,
      rafflerName: dto.rafflerName,
      ticketCount: dto.ticketCount,
      pricePerTicket: dto.pricePerTicket,
      totalPrice,
      startTicketNumber,
      endTicketNumber,
      tickets,
      isGift: dto.isGift || false,
      gifterName: dto.gifterName,
      isPaid: false,
      createdAt: new Date()
    };

    // Save the purchase to database
    purchaseRepository.create(purchase);

    // Update session stats if there's an active session
    if (activeSessionId) {
      const sessionPurchases = purchaseRepository.findBySessionId(activeSessionId);
      const ticketsSold = sessionPurchases.reduce((sum, p) => sum + p.ticketCount, 0);
      const totalRevenue = sessionPurchases.reduce((sum, p) => sum + p.totalPrice, 0);
      sessionRepository.updateStats(activeSessionId, ticketsSold, totalRevenue, endTicketNumber);
    }

    // Generate receipt
    const receipt = generateReceipt(entity, purchase);

    return { purchase, receipt };
  }

  resetTicketCounter(entityId: string): boolean {
    const entity = entityRepository.findById(entityId);
    if (!entity) {
      return false;
    }
    ticketCounterRepository.resetCounter(entityId);
    return true;
  }

  getTicketStats(entityId: string, sessionId?: string): { totalTicketsSold: number; totalRevenue: number; winningAmount: number } {
    let purchases;
    if (sessionId) {
      purchases = purchaseRepository.findBySessionId(sessionId);
    } else {
      // If no session specified, get stats from active session or all purchases
      const activeSession = sessionRepository.findActiveByEntityId(entityId);
      if (activeSession) {
        purchases = purchaseRepository.findBySessionId(activeSession.id);
      } else {
        purchases = purchaseRepository.findByEntityId(entityId);
      }
    }
    
    const totalTicketsSold = purchases.reduce((acc, p) => acc + p.ticketCount, 0);
    const totalRevenue = purchases.reduce((acc, p) => acc + p.totalPrice, 0);
    const winningAmount = Math.floor(totalRevenue * 0.7); // 70% prize money
    return { totalTicketsSold, totalRevenue, winningAmount };
  }

  generateAnnouncement(entityId: string, rafflerName: string, pricePerTicket: number): string | null {
    const entity = entityRepository.findById(entityId);
    if (!entity) {
      return null;
    }

    const stats = this.getTicketStats(entityId);
    
    const announcement = `${entity.emoji}Hey everyone, I am your RAFFLER for today. Tickets are $${pricePerTicket} each. PM me for Tickets, UNLIMITED Available!! ${entity.emoji}
${stats.totalTicketsSold} tickets sold in total. ♥ WINNING AMOUNT is now $${stats.winningAmount} !! Get your tickets for your lucky chance!~ ♥`;

    return announcement;
  }

  getPurchaseById(id: string): TicketPurchase | undefined {
    return purchaseRepository.findById(id);
  }

  getPurchasesByEntity(entityId: string, sessionOnly: boolean = false): TicketPurchase[] {
    if (sessionOnly) {
      const activeSession = sessionRepository.findActiveByEntityId(entityId);
      if (activeSession) {
        return purchaseRepository.findBySessionId(activeSession.id);
      }
      return [];
    }
    return purchaseRepository.findByEntityId(entityId);
  }

  getPurchasesBySession(sessionId: string): TicketPurchase[] {
    return purchaseRepository.findBySessionId(sessionId);
  }

  getPurchasesByEntityAndDateRange(entityId: string, startDate?: string, endDate?: string): TicketPurchase[] {
    return purchaseRepository.findByEntityAndDateRange(entityId, startDate, endDate);
  }

  getAllPurchases(): TicketPurchase[] {
    return purchaseRepository.findAll();
  }

  getReceiptForPurchase(purchaseId: string): string | null {
    const purchase = purchaseRepository.findById(purchaseId);
    if (!purchase) return null;

    const entity = entityRepository.findById(purchase.entityId);
    if (!entity) return null;

    return generateReceipt(entity, purchase);
  }

  updatePaymentStatus(purchaseId: string, isPaid: boolean): TicketPurchase | null {
    const result = purchaseRepository.updatePaymentStatus(purchaseId, isPaid);
    return result || null;
  }

  updateBuyerName(purchaseId: string, buyerName: string): TicketPurchase | null {
    const result = purchaseRepository.updateBuyerName(purchaseId, buyerName);
    return result || null;
  }

  deletePurchase(purchaseId: string): boolean {
    return purchaseRepository.delete(purchaseId);
  }
}

export const ticketService = new TicketService();
