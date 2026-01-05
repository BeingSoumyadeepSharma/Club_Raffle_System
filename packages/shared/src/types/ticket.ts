export interface RaffleTicket {
  id: string;
  ticketNumber: number;
  purchaseId: string;
  createdAt: Date;
}

export interface TicketPurchase {
  id: string;
  entityId: string;
  sessionId: string | null;  // null for legacy purchases without sessions
  buyerName: string;
  rafflerName: string;
  ticketCount: number;
  pricePerTicket: number;
  totalPrice: number;
  startTicketNumber: number;
  endTicketNumber: number;
  tickets: RaffleTicket[];
  isGift: boolean;
  gifterName?: string;
  isPaid: boolean;
  createdAt: Date;
}

export interface CreateTicketPurchaseDTO {
  entityId: string;
  buyerName: string;
  rafflerName: string;
  ticketCount: number;
  pricePerTicket: number;
  isGift?: boolean;
  gifterName?: string;
}

export interface Receipt {
  entityName: string;
  entityEmoji: string;
  buyerName: string;
  ticketCount: number;
  pricePerTicket: number;
  totalPrice: number;
  ticketRange: string;
  rafflerName: string;
  purchaseDate: Date;
  isGift: boolean;
  gifterName?: string;
}
