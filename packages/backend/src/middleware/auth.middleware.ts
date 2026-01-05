import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { UserRole, canEditClubInfo, canCreateClubs, canManageUsers } from '@raffle/shared';

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        username: string;
        role: UserRole;
      };
    }
  }
}

// Optional auth - allows requests without token but adds user info if token present
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const payload = authService.verifyToken(token);
    
    if (payload) {
      req.user = {
        userId: payload.userId,
        username: payload.username,
        role: payload.role
      };
    }
  }
  
  next();
}

// Required auth - blocks requests without valid token
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }
  
  const token = authHeader.substring(7);
  const payload = authService.verifyToken(token);
  
  if (!payload) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
  
  req.user = {
    userId: payload.userId,
    username: payload.username,
    role: payload.role
  };
  
  next();
}

// Superuser only - requires superuser privileges
export function requireSuperuser(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }
  
  if (req.user.role !== 'superuser') {
    return res.status(403).json({ success: false, error: 'Superuser access required' });
  }
  
  next();
}

// Require ability to create clubs (superuser only)
export function requireCanCreateClubs(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }
  
  if (!canCreateClubs(req.user.role)) {
    return res.status(403).json({ success: false, error: 'Only superusers can create clubs' });
  }
  
  next();
}

// Require ability to edit club info (superuser, club_owner, event_manager)
export function requireCanEditClub(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }
  
  if (!canEditClubInfo(req.user.role)) {
    return res.status(403).json({ success: false, error: 'Permission denied to edit club info' });
  }
  
  next();
}

// Require ability to manage users (superuser, club_owner, event_manager)
export function requireCanManageUsers(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }
  
  if (!canManageUsers(req.user.role)) {
    return res.status(403).json({ success: false, error: 'Permission denied to manage users' });
  }
  
  next();
}

// Check entity access - requires user to have access to the entity
export function requireEntityAccess(entityIdParam: string = 'entityId') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    // Superusers have access to all entities
    if (req.user.role === 'superuser') {
      return next();
    }
    
    const entityId = req.params[entityIdParam] || req.body?.entityId;
    
    if (!entityId) {
      return res.status(400).json({ success: false, error: 'Entity ID required' });
    }
    
    if (!authService.hasAccessToEntity(req.user.userId, entityId)) {
      return res.status(403).json({ success: false, error: 'Access denied to this entity' });
    }
    
    next();
  };
}

// Check entity access with edit permission (superuser, club_owner, event_manager with access)
export function requireEntityEditAccess(entityIdParam: string = 'entityId') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    // Check if user can edit clubs
    if (!canEditClubInfo(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Permission denied to edit club info' });
    }
    
    // Superusers have access to all entities
    if (req.user.role === 'superuser') {
      return next();
    }
    
    const entityId = req.params[entityIdParam] || req.body?.entityId;
    
    if (!entityId) {
      return res.status(400).json({ success: false, error: 'Entity ID required' });
    }
    
    if (!authService.hasAccessToEntity(req.user.userId, entityId)) {
      return res.status(403).json({ success: false, error: 'Access denied to this entity' });
    }
    
    next();
  };
}
