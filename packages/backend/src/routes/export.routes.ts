import { Router, Request, Response } from 'express';
import { exportService } from '../services/export.service';
import { requireAuth, requireEntityAccess, requireSuperuser } from '../middleware/auth.middleware';
import { authService } from '../services/auth.service';

const router = Router();

// Middleware to support token from query string for download links
function authFromQueryOrHeader(req: Request, res: Response, next: Function) {
  // Check query string first (for download links)
  const queryToken = req.query.token as string | undefined;
  if (queryToken) {
    req.headers.authorization = `Bearer ${queryToken}`;
  }
  next();
}

// Export all data to Excel (superuser only - sees all, regular users get only their entities)
router.get('/all', authFromQueryOrHeader, requireAuth, async (req: Request, res: Response) => {
  try {
    let buffer;
    
    if (req.user?.role === 'superuser') {
      // Superusers get all data
      buffer = await exportService.exportPurchasesToExcel();
    } else {
      // Regular users get only their assigned entities
      const userEntities = authService.getUserEntities(req.user!.userId);
      buffer = await exportService.exportPurchasesToExcel(userEntities);
    }
    
    const filename = `raffle-export-${new Date().toISOString().split('T')[0]}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ success: false, error: 'Failed to export data' });
  }
});

// Export entity-specific data to Excel
router.get('/entity/:entityId', authFromQueryOrHeader, requireAuth, requireEntityAccess('entityId'), async (req: Request, res: Response) => {
  try {
    const buffer = await exportService.exportEntityDataToExcel(req.params.entityId);
    
    if (!buffer) {
      return res.status(404).json({ success: false, error: 'Entity not found' });
    }
    
    const filename = `raffle-${req.params.entityId}-${new Date().toISOString().split('T')[0]}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ success: false, error: 'Failed to export data' });
  }
});

export default router;
