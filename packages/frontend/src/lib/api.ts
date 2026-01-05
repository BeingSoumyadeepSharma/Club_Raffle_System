const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface ClubEntity {
  id: string;
  name: string;
  displayName: string;
  emoji: string;
  tagline: string;
  rafflePercentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface RaffleTicket {
  id: string;
  ticketNumber: number;
  purchaseId: string;
  createdAt: string;
}

export interface TicketPurchase {
  id: string;
  entityId: string;
  sessionId: string | null;
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
  createdAt: string;
}

export interface Session {
  id: string;
  entityId: string;
  userId: string;
  username: string;
  startedAt: string;
  endedAt: string | null;
  startTicketNumber: number;
  endTicketNumber: number | null;
  ticketsSold: number;
  totalRevenue: number;
  status: 'active' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export interface SessionSummary {
  session: Session;
  entityName: string;
  purchases: TicketPurchase[];
  stats: {
    ticketsSold: number;
    totalRevenue: number;
    paidAmount: number;
    unpaidAmount: number;
    purchaseCount: number;
  };
}

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
  drawDate?: string;
  winningTicketNumber?: number;
  winnerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Entity API
export async function getEntities(): Promise<ClubEntity[]> {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(`${API_BASE}/entities`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const json: ApiResponse<ClubEntity[]> = await res.json();
  return json.data || [];
}

export async function getEntity(id: string): Promise<ClubEntity | null> {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(`${API_BASE}/entities/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const json: ApiResponse<ClubEntity> = await res.json();
  return json.data || null;
}

export async function createEntity(data: {
  name: string;
  displayName: string;
  emoji?: string;
  tagline?: string;
  rafflePercentage?: number;
}): Promise<ClubEntity | null> {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(`${API_BASE}/entities`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data),
  });
  const json: ApiResponse<ClubEntity> = await res.json();
  return json.data || null;
}

export async function updateEntity(id: string, data: {
  name?: string;
  displayName?: string;
  emoji?: string;
  tagline?: string;
  rafflePercentage?: number;
}): Promise<ClubEntity | null> {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(`${API_BASE}/entities/${id}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data),
  });
  const json: ApiResponse<ClubEntity> = await res.json();
  return json.data || null;
}

export async function deleteEntity(id: string): Promise<boolean> {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(`${API_BASE}/entities/${id}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const json: ApiResponse<void> = await res.json();
  return json.success;
}

// Ticket API
export async function purchaseTickets(data: {
  entityId: string;
  buyerName: string;
  rafflerName: string;
  ticketCount: number;
  pricePerTicket: number;
  isGift?: boolean;
  gifterName?: string;
}): Promise<{ purchase: TicketPurchase; receipt: string } | null> {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(`${API_BASE}/tickets/purchase`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data),
  });
  const json: ApiResponse<{ purchase: TicketPurchase; receipt: string }> = await res.json();
  return json.data || null;
}

export async function resetTicketCounter(entityId: string): Promise<boolean> {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(`${API_BASE}/tickets/reset-counter/${entityId}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const json: ApiResponse<void> = await res.json();
  return json.success;
}

export async function getTicketStats(entityId: string): Promise<{
  totalTicketsSold: number;
  totalRevenue: number;
  winningAmount: number;
} | null> {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(`${API_BASE}/tickets/stats/${entityId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const json = await res.json();
  return json.data || null;
}

export async function generateAnnouncement(data: {
  entityId: string;
  rafflerName: string;
  pricePerTicket: number;
}): Promise<string | null> {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(`${API_BASE}/tickets/announcement`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  return json.data?.announcement || null;
}

export async function updatePaymentStatus(purchaseId: string, isPaid: boolean): Promise<TicketPurchase | null> {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(`${API_BASE}/tickets/purchases/${purchaseId}/payment`, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ isPaid }),
  });
  const json: ApiResponse<TicketPurchase> = await res.json();
  return json.data || null;
}

export async function updateBuyerName(purchaseId: string, buyerName: string): Promise<TicketPurchase | null> {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(`${API_BASE}/tickets/purchases/${purchaseId}/buyer`, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ buyerName }),
  });
  const json: ApiResponse<TicketPurchase> = await res.json();
  return json.data || null;
}

export async function deletePurchase(purchaseId: string): Promise<boolean> {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(`${API_BASE}/tickets/purchases/${purchaseId}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const json: ApiResponse<void> = await res.json();
  return json.success;
}

export async function getPurchases(): Promise<TicketPurchase[]> {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(`${API_BASE}/tickets/purchases`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const json: ApiResponse<TicketPurchase[]> = await res.json();
  return json.data || [];
}

export async function getReceipt(purchaseId: string): Promise<string | null> {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(`${API_BASE}/tickets/purchases/${purchaseId}/receipt/text`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) return null;
  return res.text();
}

// Raffle API
export async function getRaffles(): Promise<Raffle[]> {
  const res = await fetch(`${API_BASE}/raffles`);
  const json: ApiResponse<Raffle[]> = await res.json();
  return json.data || [];
}

export async function getRafflesByEntity(entityId: string): Promise<Raffle[]> {
  const res = await fetch(`${API_BASE}/raffles/entity/${entityId}`);
  const json: ApiResponse<Raffle[]> = await res.json();
  return json.data || [];
}

export async function createRaffle(data: {
  entityId: string;
  name: string;
  description?: string;
  prizeDescription: string;
  ticketPrice: number;
  maxTickets?: number;
  drawDate?: string;
}): Promise<Raffle | null> {
  const res = await fetch(`${API_BASE}/raffles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json: ApiResponse<Raffle> = await res.json();
  return json.data || null;
}

export async function drawWinner(raffleId: string): Promise<{
  raffleId: string;
  winningTicketNumber: number;
  winnerName: string;
  prizeName: string;
} | null> {
  const res = await fetch(`${API_BASE}/raffles/${raffleId}/draw`, {
    method: 'POST',
  });
  const json = await res.json();
  return json.data || null;
}

// Export API
export function getExportAllUrl(): string {
  const token = localStorage.getItem("auth_token");
  const url = `${API_BASE}/export/all`;
  return token ? `${url}?token=${encodeURIComponent(token)}` : url;
}

export function getExportEntityUrl(entityId: string): string {
  const token = localStorage.getItem("auth_token");
  const url = `${API_BASE}/export/entity/${entityId}`;
  return token ? `${url}?token=${encodeURIComponent(token)}` : url;
}

// Session API
export async function getActiveSession(entityId: string): Promise<Session | null> {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(`${API_BASE}/sessions/active/${entityId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const json: ApiResponse<Session | null> = await res.json();
  return json.data || null;
}

export async function getEntitySessions(
  entityId: string, 
  filters?: { startDate?: string; endDate?: string; status?: string }
): Promise<Session[]> {
  const token = localStorage.getItem("auth_token");
  let url = `${API_BASE}/sessions/entity/${entityId}`;
  
  const params = new URLSearchParams();
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.status) params.append('status', filters.status);
  
  if (params.toString()) {
    url += `?${params.toString()}`;
  }
  
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const json: ApiResponse<Session[]> = await res.json();
  return json.data || [];
}

export async function startSession(entityId: string): Promise<Session | null> {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(`${API_BASE}/sessions/start`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ entityId }),
  });
  const json: ApiResponse<Session> = await res.json();
  if (!json.success && json.error) {
    throw new Error(json.error);
  }
  return json.data || null;
}

export async function closeSession(sessionId: string): Promise<Session | null> {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(`${API_BASE}/sessions/close/${sessionId}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const json: ApiResponse<Session> = await res.json();
  if (!json.success && json.error) {
    throw new Error(json.error);
  }
  return json.data || null;
}

export async function getSessionSummary(sessionId: string): Promise<SessionSummary | null> {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(`${API_BASE}/sessions/${sessionId}/summary`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const json: ApiResponse<SessionSummary> = await res.json();
  return json.data || null;
}

export async function getMyActiveSessions(): Promise<Session[]> {
  const token = localStorage.getItem("auth_token");
  const res = await fetch(`${API_BASE}/sessions/my/active`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const json: ApiResponse<Session[]> = await res.json();
  return json.data || [];
}

// Get purchases with optional session filter
export async function getPurchasesByEntity(
  entityId: string, 
  options?: { sessionOnly?: boolean; sessionId?: string; startDate?: string; endDate?: string }
): Promise<TicketPurchase[]> {
  const token = localStorage.getItem("auth_token");
  let url = `${API_BASE}/tickets/purchases/entity/${entityId}`;
  
  const params = new URLSearchParams();
  if (options?.sessionOnly) params.append('sessionOnly', 'true');
  if (options?.sessionId) params.append('sessionId', options.sessionId);
  if (options?.startDate) params.append('startDate', options.startDate);
  if (options?.endDate) params.append('endDate', options.endDate);
  
  if (params.toString()) {
    url += `?${params.toString()}`;
  }
  
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const json: ApiResponse<TicketPurchase[]> = await res.json();
  return json.data || [];
}
