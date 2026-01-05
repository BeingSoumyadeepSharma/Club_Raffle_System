import { v4 as uuidv4 } from 'uuid';
import { User, UserWithPassword, CreateUserDTO, LoginResponse, UserRole, canManageRole, ROLE_HIERARCHY } from '@raffle/shared';
import { userRepository, entityRepository } from '../data/repositories';

// Simple JWT-like token (in production, use actual JWT library)
const SECRET = process.env.JWT_SECRET || 'raffle-secret-key-change-in-production';

interface TokenPayload {
  userId: string;
  username: string;
  role: UserRole;
  exp: number;
}

// Simple base64 encoding for token (in production, use proper JWT)
function createToken(payload: TokenPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

function verifyToken(token: string): TokenPayload | null {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf8')) as TokenPayload;
    if (payload.exp < Date.now()) {
      return null; // Token expired
    }
    return payload;
  } catch {
    return null;
  }
}

// Simple password hashing (in production, use bcrypt)
function hashPassword(password: string): string {
  return Buffer.from(password + SECRET).toString('base64');
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export class AuthService {
  login(username: string, password: string): LoginResponse | null {
    const user = userRepository.findByUsername(username);
    if (!user) {
      return null;
    }

    if (!verifyPassword(password, user.passwordHash)) {
      return null;
    }

    // Create token valid for 24 hours
    const token = createToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      exp: Date.now() + 24 * 60 * 60 * 1000
    });

    const { passwordHash, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      token
    };
  }

  verifyToken(token: string): TokenPayload | null {
    return verifyToken(token);
  }

  createUser(dto: CreateUserDTO, creatorRole: UserRole, creatorId: string, creatorEntityIds: string[]): User | null {
    // Check if creator can create user with the specified role
    if (!canManageRole(creatorRole, dto.role)) {
      return null;
    }

    // Check if username already exists
    const existing = userRepository.findByUsername(dto.username);
    if (existing) {
      return null;
    }

    const now = new Date();
    const user: UserWithPassword = {
      id: uuidv4(),
      username: dto.username,
      passwordHash: hashPassword(dto.password),
      role: dto.role,
      createdAt: now,
      updatedAt: now
    };

    const createdUser = userRepository.create(user);

    // For non-superuser creators, auto-assign the new user to their entities
    if (creatorRole !== 'superuser' && creatorEntityIds.length > 0) {
      for (const entityId of creatorEntityIds) {
        userRepository.assignEntity(createdUser.id, entityId);
      }
    }

    return createdUser;
  }

  updatePassword(userId: string, newPassword: string, requesterRole: UserRole, requesterId: string): boolean {
    // Users can update their own password
    if (requesterId === userId) {
      return userRepository.updatePassword(userId, hashPassword(newPassword));
    }
    
    // Check if requester can manage the target user
    const targetUser = userRepository.findById(userId);
    if (!targetUser) return false;
    
    if (!canManageRole(requesterRole, targetUser.role)) {
      return false;
    }

    return userRepository.updatePassword(userId, hashPassword(newPassword));
  }

  deleteUser(userId: string, requesterRole: UserRole, requesterId: string): boolean {
    // Can't delete yourself
    if (userId === requesterId) {
      return false;
    }

    const targetUser = userRepository.findById(userId);
    if (!targetUser) return false;

    // Check if requester can manage the target user
    if (!canManageRole(requesterRole, targetUser.role)) {
      return false;
    }

    return userRepository.delete(userId);
  }

  getAllUsers(): User[] {
    return userRepository.findAll();
  }

  getUserById(id: string): User | undefined {
    return userRepository.findById(id);
  }

  // Get users that the requester can manage (based on role hierarchy and entity assignment)
  getManageableUsers(requesterRole: UserRole, requesterId: string): User[] {
    const allUsers = userRepository.findAll();
    
    // Superusers see all users including themselves (for password change)
    if (requesterRole === 'superuser') {
      return allUsers;
    }

    // For non-superusers, show self + only users with lower roles that share entity assignments
    const requesterEntities = userRepository.getAssignedEntities(requesterId);
    
    return allUsers.filter(u => {
      // Always include self (for password change)
      if (u.id === requesterId) return true;
      if (!canManageRole(requesterRole, u.role)) return false;
      
      // Check if target user shares any entity with requester
      const targetEntities = userRepository.getAssignedEntities(u.id);
      return targetEntities.some(e => requesterEntities.includes(e));
    });
  }

  assignEntityToUser(userId: string, entityId: string, requesterRole: UserRole, requesterId: string): boolean {
    // Verify entity exists
    const entity = entityRepository.findById(entityId);
    if (!entity) return false;

    const targetUser = userRepository.findById(userId);
    if (!targetUser) return false;

    // Superuser can assign any entity to any user
    if (requesterRole === 'superuser') {
      return userRepository.assignEntity(userId, entityId);
    }

    // Non-superusers can only assign entities they have access to
    const requesterEntities = userRepository.getAssignedEntities(requesterId);
    if (!requesterEntities.includes(entityId)) {
      return false;
    }

    // Non-superusers can only assign to users with lower roles
    if (!canManageRole(requesterRole, targetUser.role)) {
      return false;
    }

    return userRepository.assignEntity(userId, entityId);
  }

  unassignEntityFromUser(userId: string, entityId: string, requesterRole: UserRole, requesterId: string): boolean {
    const targetUser = userRepository.findById(userId);
    if (!targetUser) return false;

    // Superuser can unassign any entity
    if (requesterRole === 'superuser') {
      return userRepository.unassignEntity(userId, entityId);
    }

    // Non-superusers can only unassign from users with lower roles
    if (!canManageRole(requesterRole, targetUser.role)) {
      return false;
    }

    // Non-superusers can only manage entities they have access to
    const requesterEntities = userRepository.getAssignedEntities(requesterId);
    if (!requesterEntities.includes(entityId)) {
      return false;
    }

    return userRepository.unassignEntity(userId, entityId);
  }

  getUserEntities(userId: string): string[] {
    return userRepository.getAssignedEntities(userId);
  }

  hasAccessToEntity(userId: string, entityId: string): boolean {
    return userRepository.hasAccessToEntity(userId, entityId);
  }
}

export const authService = new AuthService();
