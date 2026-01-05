import { Router, Request, Response } from 'express';
import { entityService } from '../services/entity.service';
import { CreateClubEntityDTO, UpdateClubEntityDTO } from '@raffle/shared';
import { requireAuth, requireSuperuser, requireCanCreateClubs, requireEntityEditAccess } from '../middleware/auth.middleware';
import { authService } from '../services/auth.service';

const router = Router();

// Get all entities (filtered by user access)
router.get('/', requireAuth, (req: Request, res: Response) => {
  const allEntities = entityService.getAllEntities();
  
  // Superusers see all entities
  if (req.user?.role === 'superuser') {
    return res.json({ success: true, data: allEntities });
  }
  
  // Regular users only see assigned entities
  const userEntities = authService.getUserEntities(req.user!.userId);
  const filteredEntities = allEntities.filter(e => userEntities.includes(e.id));
  res.json({ success: true, data: filteredEntities });
});

// Get entity by ID
router.get('/:id', requireAuth, (req: Request, res: Response) => {
  const entity = entityService.getEntityById(req.params.id);
  if (!entity) {
    return res.status(404).json({ success: false, error: 'Entity not found' });
  }
  
  // Check access (superusers have access to all)
  if (req.user?.role !== 'superuser') {
    const userEntities = authService.getUserEntities(req.user!.userId);
    if (!userEntities.includes(req.params.id)) {
      return res.status(403).json({ success: false, error: 'Access denied to this entity' });
    }
  }
  
  res.json({ success: true, data: entity });
});

// Create new entity (superuser only)
router.post('/', requireAuth, requireCanCreateClubs, (req: Request, res: Response) => {
  const dto: CreateClubEntityDTO = req.body;
  
  if (!dto.name || !dto.displayName) {
    return res.status(400).json({ 
      success: false, 
      error: 'Name and displayName are required' 
    });
  }

  const entity = entityService.createEntity(dto);
  res.status(201).json({ success: true, data: entity });
});

// Update entity (superuser, club_owner, event_manager with entity access)
router.put('/:id', requireAuth, requireEntityEditAccess('id'), (req: Request, res: Response) => {
  const dto: UpdateClubEntityDTO = req.body;
  const entity = entityService.updateEntity(req.params.id, dto);
  
  if (!entity) {
    return res.status(404).json({ success: false, error: 'Entity not found' });
  }
  
  res.json({ success: true, data: entity });
});

// Delete entity (superuser only)
router.delete('/:id', requireAuth, requireSuperuser, (req: Request, res: Response) => {
  const deleted = entityService.deleteEntity(req.params.id);
  
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Entity not found' });
  }
  
  res.json({ success: true, message: 'Entity deleted successfully' });
});

export default router;
