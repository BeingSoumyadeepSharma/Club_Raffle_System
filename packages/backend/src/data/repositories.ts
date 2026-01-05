import { ClubEntity, TicketPurchase, RaffleTicket, Raffle, User, UserWithPassword, UserEntityAssignment, UserRole, Session } from '@raffle/shared';
import { getDb, saveDb } from './database';

// Helper to execute a query and get all rows
function queryAll(sql: string, params: any[] = []): any[] {
  const db = getDb();
  const stmt = db.prepare(sql);
  if (params.length > 0) {
    stmt.bind(params);
  }
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

// Helper to execute a query and get one row
function queryOne(sql: string, params: any[] = []): any | undefined {
  const results = queryAll(sql, params);
  return results.length > 0 ? results[0] : undefined;
}

// Helper to run a statement (INSERT, UPDATE, DELETE)
function run(sql: string, params: any[] = []): void {
  const db = getDb();
  db.run(sql, params);
  saveDb();
}

// Entity Repository
export const entityRepository = {
  findAll(): ClubEntity[] {
    const rows = queryAll('SELECT * FROM entities ORDER BY created_at DESC');
    return rows.map(mapEntityFromDb);
  },

  findById(id: string): ClubEntity | undefined {
    const row = queryOne('SELECT * FROM entities WHERE id = ?', [id]);
    return row ? mapEntityFromDb(row) : undefined;
  },

  create(entity: ClubEntity): ClubEntity {
    run(
      `INSERT INTO entities (id, name, display_name, emoji, tagline, raffle_percentage, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entity.id,
        entity.name,
        entity.displayName,
        entity.emoji,
        entity.tagline,
        entity.rafflePercentage,
        entity.createdAt.toISOString(),
        entity.updatedAt.toISOString()
      ]
    );
    
    // Create ticket counter for new entity
    run('INSERT INTO ticket_counters (entity_id, last_ticket_number) VALUES (?, ?)', [entity.id, 0]);
    
    return entity;
  },

  update(id: string, updates: Partial<ClubEntity>): ClubEntity | undefined {
    const entity = this.findById(id);
    if (!entity) return undefined;

    const updatedEntity = {
      ...entity,
      ...updates,
      updatedAt: new Date()
    };

    run(
      `UPDATE entities 
       SET name = ?, display_name = ?, emoji = ?, tagline = ?, raffle_percentage = ?, updated_at = ?
       WHERE id = ?`,
      [
        updatedEntity.name,
        updatedEntity.displayName,
        updatedEntity.emoji,
        updatedEntity.tagline,
        updatedEntity.rafflePercentage,
        updatedEntity.updatedAt.toISOString(),
        id
      ]
    );

    return updatedEntity;
  },

  delete(id: string): boolean {
    const entity = this.findById(id);
    if (!entity) return false;
    
    run('DELETE FROM entities WHERE id = ?', [id]);
    run('DELETE FROM ticket_counters WHERE entity_id = ?', [id]);
    return true;
  }
};

// Ticket Counter Repository
export const ticketCounterRepository = {
  getNextTicketNumber(entityId: string): number {
    const row = queryOne('SELECT last_ticket_number FROM ticket_counters WHERE entity_id = ?', [entityId]);
    return (row?.last_ticket_number || 0) + 1;
  },

  updateCounter(entityId: string, lastTicketNumber: number): void {
    run('UPDATE ticket_counters SET last_ticket_number = ? WHERE entity_id = ?', [lastTicketNumber, entityId]);
  },

  resetCounter(entityId: string): void {
    run('UPDATE ticket_counters SET last_ticket_number = 0 WHERE entity_id = ?', [entityId]);
  },

  getCounter(entityId: string): number {
    const row = queryOne('SELECT last_ticket_number FROM ticket_counters WHERE entity_id = ?', [entityId]);
    return row?.last_ticket_number || 0;
  }
};

// Purchase Repository
export const purchaseRepository = {
  findAll(): TicketPurchase[] {
    const rows = queryAll('SELECT * FROM purchases ORDER BY created_at DESC');
    return rows.map(row => this.mapPurchaseWithTickets(row));
  },

  findById(id: string): TicketPurchase | undefined {
    const row = queryOne('SELECT * FROM purchases WHERE id = ?', [id]);
    return row ? this.mapPurchaseWithTickets(row) : undefined;
  },

  findByEntityId(entityId: string): TicketPurchase[] {
    const rows = queryAll('SELECT * FROM purchases WHERE entity_id = ? ORDER BY created_at DESC', [entityId]);
    return rows.map(row => this.mapPurchaseWithTickets(row));
  },

  findBySessionId(sessionId: string): TicketPurchase[] {
    const rows = queryAll('SELECT * FROM purchases WHERE session_id = ? ORDER BY created_at DESC', [sessionId]);
    return rows.map(row => this.mapPurchaseWithTickets(row));
  },

  findByEntityAndSession(entityId: string, sessionId: string | null): TicketPurchase[] {
    if (sessionId) {
      const rows = queryAll('SELECT * FROM purchases WHERE entity_id = ? AND session_id = ? ORDER BY created_at DESC', [entityId, sessionId]);
      return rows.map(row => this.mapPurchaseWithTickets(row));
    } else {
      // If no session, return all purchases (for backwards compatibility or when no active session)
      return this.findByEntityId(entityId);
    }
  },

  findByEntityAndDateRange(entityId: string, startDate?: string, endDate?: string): TicketPurchase[] {
    let sql = 'SELECT * FROM purchases WHERE entity_id = ?';
    const params: any[] = [entityId];
    
    if (startDate) {
      sql += ' AND created_at >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND created_at <= ?';
      params.push(endDate);
    }
    sql += ' ORDER BY created_at DESC';
    
    const rows = queryAll(sql, params);
    return rows.map(row => this.mapPurchaseWithTickets(row));
  },

  create(purchase: TicketPurchase): TicketPurchase {
    const db = getDb();
    
    // Insert purchase with session_id
    db.run(
      `INSERT INTO purchases (id, entity_id, session_id, buyer_name, raffler_name, ticket_count, price_per_ticket, total_price, start_ticket_number, end_ticket_number, is_gift, gifter_name, is_paid, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        purchase.id,
        purchase.entityId,
        purchase.sessionId || null,
        purchase.buyerName,
        purchase.rafflerName,
        purchase.ticketCount,
        purchase.pricePerTicket,
        purchase.totalPrice,
        purchase.startTicketNumber,
        purchase.endTicketNumber,
        purchase.isGift ? 1 : 0,
        purchase.gifterName || null,
        purchase.isPaid ? 1 : 0,
        purchase.createdAt.toISOString()
      ]
    );

    // Insert tickets
    for (const ticket of purchase.tickets) {
      db.run(
        `INSERT INTO tickets (id, ticket_number, purchase_id, created_at)
         VALUES (?, ?, ?, ?)`,
        [ticket.id, ticket.ticketNumber, ticket.purchaseId, ticket.createdAt.toISOString()]
      );
    }

    // Update ticket counter
    db.run('UPDATE ticket_counters SET last_ticket_number = ? WHERE entity_id = ?', [purchase.endTicketNumber, purchase.entityId]);
    
    saveDb();
    return purchase;
  },

  mapPurchaseWithTickets(row: any): TicketPurchase {
    const tickets = queryAll('SELECT * FROM tickets WHERE purchase_id = ?', [row.id]);
    return {
      id: row.id,
      entityId: row.entity_id,
      sessionId: row.session_id || null,
      buyerName: row.buyer_name,
      rafflerName: row.raffler_name,
      ticketCount: row.ticket_count,
      pricePerTicket: row.price_per_ticket,
      totalPrice: row.total_price,
      startTicketNumber: row.start_ticket_number,
      endTicketNumber: row.end_ticket_number,
      isGift: row.is_gift === 1,
      gifterName: row.gifter_name || undefined,
      isPaid: row.is_paid === 1,
      tickets: tickets.map(t => ({
        id: t.id,
        ticketNumber: t.ticket_number,
        purchaseId: t.purchase_id,
        createdAt: new Date(t.created_at)
      })),
      createdAt: new Date(row.created_at)
    };
  },

  updatePaymentStatus(id: string, isPaid: boolean): TicketPurchase | undefined {
    const purchase = this.findById(id);
    if (!purchase) return undefined;
    
    run('UPDATE purchases SET is_paid = ? WHERE id = ?', [isPaid ? 1 : 0, id]);
    return { ...purchase, isPaid };
  },

  updateBuyerName(id: string, buyerName: string): TicketPurchase | undefined {
    const purchase = this.findById(id);
    if (!purchase) return undefined;
    
    run('UPDATE purchases SET buyer_name = ? WHERE id = ?', [buyerName, id]);
    return { ...purchase, buyerName };
  },

  delete(id: string): boolean {
    const purchase = this.findById(id);
    if (!purchase) return false;
    
    // Delete associated tickets first
    run('DELETE FROM tickets WHERE purchase_id = ?', [id]);
    // Delete the purchase
    run('DELETE FROM purchases WHERE id = ?', [id]);
    return true;
  }
};

// Raffle Repository
export const raffleRepository = {
  findAll(): Raffle[] {
    const rows = queryAll('SELECT * FROM raffles ORDER BY created_at DESC');
    return rows.map(mapRaffleFromDb);
  },

  findById(id: string): Raffle | undefined {
    const row = queryOne('SELECT * FROM raffles WHERE id = ?', [id]);
    return row ? mapRaffleFromDb(row) : undefined;
  },

  findByEntityId(entityId: string): Raffle[] {
    const rows = queryAll('SELECT * FROM raffles WHERE entity_id = ? ORDER BY created_at DESC', [entityId]);
    return rows.map(mapRaffleFromDb);
  },

  create(raffle: Raffle): Raffle {
    run(
      `INSERT INTO raffles (id, entity_id, name, description, prize_description, ticket_price, max_tickets, sold_tickets, is_active, draw_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        raffle.id,
        raffle.entityId,
        raffle.name,
        raffle.description,
        raffle.prizeDescription,
        raffle.ticketPrice,
        raffle.maxTickets,
        raffle.soldTickets,
        raffle.isActive ? 1 : 0,
        raffle.drawDate?.toISOString() || null,
        raffle.createdAt.toISOString(),
        raffle.updatedAt.toISOString()
      ]
    );
    return raffle;
  },

  update(id: string, updates: Partial<Raffle>): Raffle | undefined {
    const raffle = this.findById(id);
    if (!raffle) return undefined;

    const updatedRaffle = {
      ...raffle,
      ...updates,
      updatedAt: new Date()
    };

    run(
      `UPDATE raffles 
       SET name = ?, description = ?, prize_description = ?, ticket_price = ?, max_tickets = ?, 
           sold_tickets = ?, is_active = ?, draw_date = ?, winning_ticket_number = ?, winner_id = ?, updated_at = ?
       WHERE id = ?`,
      [
        updatedRaffle.name,
        updatedRaffle.description,
        updatedRaffle.prizeDescription,
        updatedRaffle.ticketPrice,
        updatedRaffle.maxTickets,
        updatedRaffle.soldTickets,
        updatedRaffle.isActive ? 1 : 0,
        updatedRaffle.drawDate?.toISOString() || null,
        updatedRaffle.winningTicketNumber || null,
        updatedRaffle.winnerId || null,
        updatedRaffle.updatedAt.toISOString(),
        id
      ]
    );

    return updatedRaffle;
  },

  delete(id: string): boolean {
    const raffle = this.findById(id);
    if (!raffle) return false;
    
    run('DELETE FROM raffles WHERE id = ?', [id]);
    return true;
  }
};

// Helper functions to map database rows to entities
function mapEntityFromDb(row: any): ClubEntity {
  return {
    id: row.id,
    name: row.name,
    displayName: row.display_name,
    emoji: row.emoji,
    tagline: row.tagline,
    rafflePercentage: row.raffle_percentage ?? 70,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  };
}

function mapRaffleFromDb(row: any): Raffle {
  return {
    id: row.id,
    entityId: row.entity_id,
    name: row.name,
    description: row.description,
    prizeDescription: row.prize_description,
    ticketPrice: row.ticket_price,
    maxTickets: row.max_tickets,
    soldTickets: row.sold_tickets,
    isActive: row.is_active === 1,
    drawDate: row.draw_date ? new Date(row.draw_date) : undefined,
    winningTicketNumber: row.winning_ticket_number || undefined,
    winnerId: row.winner_id || undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  };
}

function mapUserFromDb(row: any): User {
  // Handle both old (is_superuser) and new (role) schema
  let role: UserRole = (row.role as UserRole) || 'staff';
  if (!row.role && row.is_superuser === 1) {
    role = 'superuser';
  }
  
  return {
    id: row.id,
    username: row.username,
    role,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  };
}

function mapUserWithPasswordFromDb(row: any): UserWithPassword {
  return {
    ...mapUserFromDb(row),
    passwordHash: row.password_hash
  };
}

// User Repository
export const userRepository = {
  findAll(): User[] {
    const rows = queryAll('SELECT * FROM users ORDER BY created_at DESC');
    return rows.map(mapUserFromDb);
  },

  findById(id: string): User | undefined {
    const row = queryOne('SELECT * FROM users WHERE id = ?', [id]);
    return row ? mapUserFromDb(row) : undefined;
  },

  findByUsername(username: string): UserWithPassword | undefined {
    const row = queryOne('SELECT * FROM users WHERE username = ?', [username]);
    return row ? mapUserWithPasswordFromDb(row) : undefined;
  },

  create(user: UserWithPassword): User {
    run(
      `INSERT INTO users (id, username, password_hash, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        user.username,
        user.passwordHash,
        user.role,
        user.createdAt.toISOString(),
        user.updatedAt.toISOString()
      ]
    );
    return mapUserFromDb({
      id: user.id,
      username: user.username,
      role: user.role,
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString()
    });
  },

  updatePassword(id: string, passwordHash: string): boolean {
    const user = this.findById(id);
    if (!user) return false;
    
    const now = new Date().toISOString();
    run('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', [passwordHash, now, id]);
    return true;
  },

  delete(id: string): boolean {
    const user = this.findById(id);
    if (!user) return false;
    
    // Delete user entity assignments first
    run('DELETE FROM user_entities WHERE user_id = ?', [id]);
    run('DELETE FROM users WHERE id = ?', [id]);
    return true;
  },

  // Entity assignments
  getAssignedEntities(userId: string): string[] {
    const rows = queryAll('SELECT entity_id FROM user_entities WHERE user_id = ?', [userId]);
    return rows.map(r => r.entity_id);
  },

  assignEntity(userId: string, entityId: string): boolean {
    const user = this.findById(userId);
    if (!user) return false;
    
    // Check if already assigned
    const existing = queryOne('SELECT * FROM user_entities WHERE user_id = ? AND entity_id = ?', [userId, entityId]);
    if (existing) return true;
    
    run(
      'INSERT INTO user_entities (user_id, entity_id, assigned_at) VALUES (?, ?, ?)',
      [userId, entityId, new Date().toISOString()]
    );
    return true;
  },

  unassignEntity(userId: string, entityId: string): boolean {
    run('DELETE FROM user_entities WHERE user_id = ? AND entity_id = ?', [userId, entityId]);
    return true;
  },

  hasAccessToEntity(userId: string, entityId: string): boolean {
    const user = this.findById(userId);
    if (!user) return false;
    
    // Superusers have access to all entities
    const fullUser = queryOne('SELECT role FROM users WHERE id = ?', [userId]);
    if (fullUser?.role === 'superuser') return true;
    
    const assignment = queryOne('SELECT * FROM user_entities WHERE user_id = ? AND entity_id = ?', [userId, entityId]);
    return !!assignment;
  },

  getUserRole(userId: string): UserRole | undefined {
    const row = queryOne('SELECT role FROM users WHERE id = ?', [userId]);
    return row?.role as UserRole | undefined;
  }
};

// Session Repository
export const sessionRepository = {
  findAll(): Session[] {
    const rows = queryAll('SELECT * FROM sessions ORDER BY created_at DESC');
    return rows.map(mapSessionFromDb);
  },

  findById(id: string): Session | undefined {
    const row = queryOne('SELECT * FROM sessions WHERE id = ?', [id]);
    return row ? mapSessionFromDb(row) : undefined;
  },

  findByEntityId(entityId: string): Session[] {
    const rows = queryAll('SELECT * FROM sessions WHERE entity_id = ? ORDER BY created_at DESC', [entityId]);
    return rows.map(mapSessionFromDb);
  },

  findActiveByEntityId(entityId: string): Session | undefined {
    const row = queryOne('SELECT * FROM sessions WHERE entity_id = ? AND status = ? ORDER BY created_at DESC LIMIT 1', [entityId, 'active']);
    return row ? mapSessionFromDb(row) : undefined;
  },

  findActiveByUserId(userId: string): Session[] {
    const rows = queryAll('SELECT * FROM sessions WHERE user_id = ? AND status = ?', [userId, 'active']);
    return rows.map(mapSessionFromDb);
  },

  findByDateRange(entityId: string, startDate?: string, endDate?: string, status?: string): Session[] {
    let sql = 'SELECT * FROM sessions WHERE entity_id = ?';
    const params: any[] = [entityId];
    
    if (startDate) {
      sql += ' AND started_at >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND (ended_at <= ? OR ended_at IS NULL)';
      params.push(endDate);
    }
    if (status && status !== 'all') {
      sql += ' AND status = ?';
      params.push(status);
    }
    sql += ' ORDER BY created_at DESC';
    
    const rows = queryAll(sql, params);
    return rows.map(mapSessionFromDb);
  },

  create(session: Session): Session {
    run(
      `INSERT INTO sessions (id, entity_id, user_id, username, started_at, ended_at, start_ticket_number, end_ticket_number, tickets_sold, total_revenue, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        session.id,
        session.entityId,
        session.userId,
        session.username,
        session.startedAt.toISOString(),
        session.endedAt?.toISOString() || null,
        session.startTicketNumber,
        session.endTicketNumber || null,
        session.ticketsSold,
        session.totalRevenue,
        session.status,
        session.createdAt.toISOString(),
        session.updatedAt.toISOString()
      ]
    );
    return session;
  },

  update(id: string, updates: Partial<Session>): Session | undefined {
    const session = this.findById(id);
    if (!session) return undefined;

    const updatedSession = {
      ...session,
      ...updates,
      updatedAt: new Date()
    };

    run(
      `UPDATE sessions SET 
        ended_at = ?, end_ticket_number = ?, tickets_sold = ?, total_revenue = ?, status = ?, updated_at = ?
       WHERE id = ?`,
      [
        updatedSession.endedAt?.toISOString() || null,
        updatedSession.endTicketNumber || null,
        updatedSession.ticketsSold,
        updatedSession.totalRevenue,
        updatedSession.status,
        updatedSession.updatedAt.toISOString(),
        id
      ]
    );

    return updatedSession;
  },

  updateStats(id: string, ticketsSold: number, totalRevenue: number, endTicketNumber: number): void {
    run(
      `UPDATE sessions SET tickets_sold = ?, total_revenue = ?, end_ticket_number = ?, updated_at = ? WHERE id = ?`,
      [ticketsSold, totalRevenue, endTicketNumber, new Date().toISOString(), id]
    );
  },

  closeSession(id: string): Session | undefined {
    const session = this.findById(id);
    if (!session || session.status !== 'active') return undefined;

    return this.update(id, {
      status: 'closed',
      endedAt: new Date()
    });
  }
};

// Helper function to map session from database row
function mapSessionFromDb(row: any): Session {
  return {
    id: row.id,
    entityId: row.entity_id,
    userId: row.user_id,
    username: row.username,
    startedAt: new Date(row.started_at),
    endedAt: row.ended_at ? new Date(row.ended_at) : null,
    startTicketNumber: row.start_ticket_number,
    endTicketNumber: row.end_ticket_number || null,
    ticketsSold: row.tickets_sold || 0,
    totalRevenue: row.total_revenue || 0,
    status: row.status as 'active' | 'closed',
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  };
}
