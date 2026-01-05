// Session/Shift types for tracking user work periods

export interface Session {
  id: string;
  entityId: string;
  userId: string;
  username: string;  // Denormalized for convenience
  startedAt: Date;
  endedAt: Date | null;
  startTicketNumber: number;
  endTicketNumber: number | null;
  ticketsSold: number;
  totalRevenue: number;
  status: 'active' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSessionDTO {
  entityId: string;
}

export interface CloseSessionDTO {
  sessionId: string;
}

export interface SessionSummary {
  id: string;
  entityId: string;
  entityName: string;
  username: string;
  startedAt: Date;
  endedAt: Date | null;
  ticketsSold: number;
  totalRevenue: number;
  status: 'active' | 'closed';
}

export interface SessionFilter {
  entityId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  status?: 'active' | 'closed' | 'all';
}
