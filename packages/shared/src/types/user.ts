// User roles hierarchy: superuser > club_owner > event_manager > staff
export type UserRole = 'superuser' | 'club_owner' | 'event_manager' | 'staff';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  superuser: 4,
  club_owner: 3,
  event_manager: 2,
  staff: 1
};

export const ROLE_LABELS: Record<UserRole, string> = {
  superuser: 'Superuser',
  club_owner: 'Club Owner',
  event_manager: 'Event Manager',
  staff: 'Staff'
};

export interface User {
  id: string;
  username: string;
  role: UserRole;
  rafflerName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithPassword extends User {
  passwordHash: string;
}

export interface UserEntityAssignment {
  userId: string;
  entityId: string;
  assignedAt: Date;
}

export interface CreateUserDTO {
  username: string;
  password: string;
  role: UserRole;
  rafflerName?: string;
}

export interface LoginDTO {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface AssignEntityDTO {
  userId: string;
  entityId: string;
}

// Helper functions for role permissions
export function canManageRole(managerRole: UserRole, targetRole: UserRole): boolean {
  return ROLE_HIERARCHY[managerRole] > ROLE_HIERARCHY[targetRole];
}

export function getRolesCanCreate(role: UserRole): UserRole[] {
  switch (role) {
    case 'superuser':
      return ['club_owner', 'event_manager', 'staff'];
    case 'club_owner':
      return ['event_manager', 'staff'];
    case 'event_manager':
      return ['staff'];
    default:
      return [];
  }
}

export function canEditClubInfo(role: UserRole): boolean {
  return role === 'superuser' || role === 'club_owner' || role === 'event_manager';
}

export function canCreateClubs(role: UserRole): boolean {
  return role === 'superuser';
}

export function canManageUsers(role: UserRole): boolean {
  return role !== 'staff';
}
