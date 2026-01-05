import { ClubEntity, TicketPurchase, Raffle } from '@raffle/shared';

// In-memory data store (replace with database in production)
class DataStore {
  private entities: Map<string, ClubEntity> = new Map();
  private purchases: Map<string, TicketPurchase> = new Map();
  private raffles: Map<string, Raffle> = new Map();
  private ticketCounters: Map<string, number> = new Map();

  constructor() {
    // Initialize with default GODFATHER'S CLUB entity
    const godfatherEntity: ClubEntity = {
      id: 'godfather-club',
      name: 'godfather',
      displayName: "GODFATHER'S CLUB",
      emoji: '🎲',
      tagline: 'Thanks for your Purchase.. and good luck~',
      rafflePercentage: 50,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.entities.set(godfatherEntity.id, godfatherEntity);
    this.ticketCounters.set(godfatherEntity.id, 0);
  }

  // Entity methods
  getEntity(id: string): ClubEntity | undefined {
    return this.entities.get(id);
  }

  getAllEntities(): ClubEntity[] {
    return Array.from(this.entities.values());
  }

  createEntity(entity: ClubEntity): ClubEntity {
    this.entities.set(entity.id, entity);
    this.ticketCounters.set(entity.id, 0);
    return entity;
  }

  updateEntity(id: string, updates: Partial<ClubEntity>): ClubEntity | undefined {
    const entity = this.entities.get(id);
    if (!entity) return undefined;
    
    const updatedEntity = { ...entity, ...updates, updatedAt: new Date() };
    this.entities.set(id, updatedEntity);
    return updatedEntity;
  }

  deleteEntity(id: string): boolean {
    this.ticketCounters.delete(id);
    return this.entities.delete(id);
  }

  // Ticket counter methods
  getNextTicketNumber(entityId: string): number {
    const current = this.ticketCounters.get(entityId) || 0;
    return current + 1;
  }

  updateTicketCounter(entityId: string, lastTicketNumber: number): void {
    this.ticketCounters.set(entityId, lastTicketNumber);
  }

  // Purchase methods
  getPurchase(id: string): TicketPurchase | undefined {
    return this.purchases.get(id);
  }

  getPurchasesByEntity(entityId: string): TicketPurchase[] {
    return Array.from(this.purchases.values()).filter(p => p.entityId === entityId);
  }

  getAllPurchases(): TicketPurchase[] {
    return Array.from(this.purchases.values());
  }

  createPurchase(purchase: TicketPurchase): TicketPurchase {
    this.purchases.set(purchase.id, purchase);
    return purchase;
  }

  // Raffle methods
  getRaffle(id: string): Raffle | undefined {
    return this.raffles.get(id);
  }

  getRafflesByEntity(entityId: string): Raffle[] {
    return Array.from(this.raffles.values()).filter(r => r.entityId === entityId);
  }

  getAllRaffles(): Raffle[] {
    return Array.from(this.raffles.values());
  }

  createRaffle(raffle: Raffle): Raffle {
    this.raffles.set(raffle.id, raffle);
    return raffle;
  }

  updateRaffle(id: string, updates: Partial<Raffle>): Raffle | undefined {
    const raffle = this.raffles.get(id);
    if (!raffle) return undefined;
    
    const updatedRaffle = { ...raffle, ...updates, updatedAt: new Date() };
    this.raffles.set(id, updatedRaffle);
    return updatedRaffle;
  }

  deleteRaffle(id: string): boolean {
    return this.raffles.delete(id);
  }
}

export const dataStore = new DataStore();
