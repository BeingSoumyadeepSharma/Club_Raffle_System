import { Router, Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { requireAuth, requireCanManageUsers } from '../middleware/auth.middleware';
import { CreateUserDTO, getRolesCanCreate } from '@raffle/shared';

const router = Router();

// Login
router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username and password required' });
  }

  const result = authService.login(username, password);
  
  if (!result) {
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }

  res.json({ success: true, data: result });
});

// Get current user info
router.get('/me', requireAuth, (req: Request, res: Response) => {
  const user = authService.getUserById(req.user!.userId);
  
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  const assignedEntities = authService.getUserEntities(user.id);
  
  res.json({ 
    success: true, 
    data: { 
      ...user, 
      assignedEntities 
    } 
  });
});

// Get roles that current user can create
router.get('/roles/creatable', requireAuth, (req: Request, res: Response) => {
  const creatableRoles = getRolesCanCreate(req.user!.role);
  res.json({ success: true, data: creatableRoles });
});

// Create new user (requires user management permission)
router.post('/users', requireAuth, requireCanManageUsers, (req: Request, res: Response) => {
  const dto: CreateUserDTO = req.body;
  
  if (!dto.username || !dto.password || !dto.role) {
    return res.status(400).json({ success: false, error: 'Username, password, and role required' });
  }

  if (dto.password.length < 4) {
    return res.status(400).json({ success: false, error: 'Password must be at least 4 characters' });
  }

  // Verify the user can create users with this role
  const allowedRoles = getRolesCanCreate(req.user!.role);
  if (!allowedRoles.includes(dto.role)) {
    return res.status(403).json({ success: false, error: `You cannot create users with role: ${dto.role}` });
  }

  const creatorEntities = authService.getUserEntities(req.user!.userId);
  const user = authService.createUser(dto, req.user!.role, req.user!.userId, creatorEntities);
  
  if (!user) {
    return res.status(400).json({ success: false, error: 'Username already exists or creation failed' });
  }

  res.status(201).json({ success: true, data: user });
});

// Get manageable users (filtered by role hierarchy and entity access)
router.get('/users', requireAuth, requireCanManageUsers, (req: Request, res: Response) => {
  const users = authService.getManageableUsers(req.user!.role, req.user!.userId);
  
  // Include assigned entities for each user
  const usersWithEntities = users.map(user => ({
    ...user,
    assignedEntities: authService.getUserEntities(user.id)
  }));
  
  res.json({ success: true, data: usersWithEntities });
});

// Get user by ID
router.get('/users/:id', requireAuth, requireCanManageUsers, (req: Request, res: Response) => {
  const user = authService.getUserById(req.params.id);
  
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  const assignedEntities = authService.getUserEntities(user.id);
  
  res.json({ success: true, data: { ...user, assignedEntities } });
});

// Update user password
router.patch('/users/:id/password', requireAuth, (req: Request, res: Response) => {
  const { password } = req.body;
  
  if (!password || password.length < 4) {
    return res.status(400).json({ success: false, error: 'Password must be at least 4 characters' });
  }

  const success = authService.updatePassword(
    req.params.id, 
    password, 
    req.user!.role,
    req.user!.userId
  );
  
  if (!success) {
    return res.status(403).json({ success: false, error: 'Cannot update password' });
  }

  res.json({ success: true, message: 'Password updated' });
});

// Delete user
router.delete('/users/:id', requireAuth, requireCanManageUsers, (req: Request, res: Response) => {
  // Prevent self-deletion
  if (req.params.id === req.user!.userId) {
    return res.status(400).json({ success: false, error: 'Cannot delete yourself' });
  }

  const success = authService.deleteUser(req.params.id, req.user!.role, req.user!.userId);
  
  if (!success) {
    return res.status(404).json({ success: false, error: 'User not found or cannot be deleted' });
  }

  res.json({ success: true, message: 'User deleted' });
});

// Assign entity to user
router.post('/users/:id/entities', requireAuth, requireCanManageUsers, (req: Request, res: Response) => {
  const { entityId } = req.body;
  
  if (!entityId) {
    return res.status(400).json({ success: false, error: 'Entity ID required' });
  }

  const success = authService.assignEntityToUser(req.params.id, entityId, req.user!.role, req.user!.userId);
  
  if (!success) {
    return res.status(400).json({ success: false, error: 'Assignment failed - check permissions and entity access' });
  }

  res.json({ success: true, message: 'Entity assigned to user' });
});

// Unassign entity from user
router.delete('/users/:userId/entities/:entityId', requireAuth, requireCanManageUsers, (req: Request, res: Response) => {
  const success = authService.unassignEntityFromUser(
    req.params.userId, 
    req.params.entityId, 
    req.user!.role,
    req.user!.userId
  );
  
  if (!success) {
    return res.status(400).json({ success: false, error: 'Unassignment failed - check permissions' });
  }

  res.json({ success: true, message: 'Entity unassigned from user' });
});

export default router;
