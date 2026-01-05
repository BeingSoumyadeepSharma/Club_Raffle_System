export interface Raffle {
  id: string;
  entityId: string;
  name: string;
  description: string;
  prizeDescription: string;
  ticketPrice: number;
  maxTickets: number;
  soldTickets: number;
  isActive: boolean;
  drawDate?: Date;
  winningTicketNumber?: number;
  winnerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRaffleDTO {
  entityId: string;
  name: string;
  description?: string;
  prizeDescription: string;
  ticketPrice: number;
  maxTickets?: number;
  drawDate?: Date;
}

export interface UpdateRaffleDTO {
  name?: string;
  description?: string;
  prizeDescription?: string;
  ticketPrice?: number;
  maxTickets?: number;
  isActive?: boolean;
  drawDate?: Date;
}

export interface DrawWinnerResult {
  raffleId: string;
  winningTicketNumber: number;
  winnerName: string;
  prizeName: string;
}
