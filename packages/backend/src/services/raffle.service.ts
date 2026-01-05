import { v4 as uuidv4 } from 'uuid';
import { Raffle, CreateRaffleDTO, UpdateRaffleDTO, DrawWinnerResult } from '@raffle/shared';
import { raffleRepository, purchaseRepository, entityRepository } from '../data/repositories';

export class RaffleService {
  createRaffle(dto: CreateRaffleDTO): Raffle | null {
    const entity = entityRepository.findById(dto.entityId);
    if (!entity) {
      return null;
    }

    const raffle: Raffle = {
      id: uuidv4(),
      entityId: dto.entityId,
      name: dto.name,
      description: dto.description || '',
      prizeDescription: dto.prizeDescription,
      ticketPrice: dto.ticketPrice,
      maxTickets: dto.maxTickets || 1000,
      soldTickets: 0,
      isActive: true,
      drawDate: dto.drawDate,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return raffleRepository.create(raffle);
  }

  getRaffleById(id: string): Raffle | undefined {
    return raffleRepository.findById(id);
  }

  getRafflesByEntity(entityId: string): Raffle[] {
    return raffleRepository.findByEntityId(entityId);
  }

  getAllRaffles(): Raffle[] {
    return raffleRepository.findAll();
  }

  updateRaffle(id: string, dto: UpdateRaffleDTO): Raffle | undefined {
    return raffleRepository.update(id, dto);
  }

  deleteRaffle(id: string): boolean {
    return raffleRepository.delete(id);
  }

  drawWinner(raffleId: string): DrawWinnerResult | null {
    const raffle = raffleRepository.findById(raffleId);
    if (!raffle || !raffle.isActive) {
      return null;
    }

    // Get all purchases for the entity
    const purchases = purchaseRepository.findByEntityId(raffle.entityId);
    if (purchases.length === 0) {
      return null;
    }

    // Collect all tickets
    const allTickets = purchases.flatMap(p => p.tickets);
    if (allTickets.length === 0) {
      return null;
    }

    // Draw random winner
    const winningIndex = Math.floor(Math.random() * allTickets.length);
    const winningTicket = allTickets[winningIndex];
    
    // Find the purchase that contains the winning ticket
    const winningPurchase = purchases.find(p => 
      p.tickets.some(t => t.id === winningTicket.id)
    );

    if (!winningPurchase) {
      return null;
    }

    // Update raffle with winner
    raffleRepository.update(raffleId, {
      isActive: false,
      winningTicketNumber: winningTicket.ticketNumber,
      winnerId: winningPurchase.id
    });

    return {
      raffleId,
      winningTicketNumber: winningTicket.ticketNumber,
      winnerName: winningPurchase.buyerName,
      prizeName: raffle.prizeDescription
    };
  }
}

export const raffleService = new RaffleService();
