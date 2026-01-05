export interface ClubEntity {
  id: string;
  name: string;
  displayName: string;
  emoji: string;
  tagline: string;
  rafflePercentage: number; // Percentage of revenue for the prize (0-100)
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateClubEntityDTO {
  name: string;
  displayName: string;
  emoji?: string;
  tagline?: string;
  rafflePercentage?: number;
}

export interface UpdateClubEntityDTO {
  name?: string;
  displayName?: string;
  emoji?: string;
  tagline?: string;
  rafflePercentage?: number;
}
