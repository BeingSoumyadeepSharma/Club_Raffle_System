import { Router, Request, Response } from 'express';
import { raffleService } from '../services/raffle.service';
import { CreateRaffleDTO, UpdateRaffleDTO } from '@raffle/shared';

const router = Router();

// Get all raffles
router.get('/', (req: Request, res: Response) => {
  const raffles = raffleService.getAllRaffles();
  res.json({ success: true, data: raffles });
});

// Get raffles by entity
router.get('/entity/:entityId', (req: Request, res: Response) => {
  const raffles = raffleService.getRafflesByEntity(req.params.entityId);
  res.json({ success: true, data: raffles });
});

// Get raffle by ID
router.get('/:id', (req: Request, res: Response) => {
  const raffle = raffleService.getRaffleById(req.params.id);
  if (!raffle) {
    return res.status(404).json({ success: false, error: 'Raffle not found' });
  }
  res.json({ success: true, data: raffle });
});

// Create new raffle
router.post('/', (req: Request, res: Response) => {
  const dto: CreateRaffleDTO = req.body;
  
  if (!dto.entityId || !dto.name || !dto.prizeDescription || !dto.ticketPrice) {
    return res.status(400).json({ 
      success: false, 
      error: 'entityId, name, prizeDescription, and ticketPrice are required' 
    });
  }

  const raffle = raffleService.createRaffle(dto);
  
  if (!raffle) {
    return res.status(404).json({ success: false, error: 'Entity not found' });
  }

  res.status(201).json({ success: true, data: raffle });
});

// Update raffle
router.put('/:id', (req: Request, res: Response) => {
  const dto: UpdateRaffleDTO = req.body;
  const raffle = raffleService.updateRaffle(req.params.id, dto);
  
  if (!raffle) {
    return res.status(404).json({ success: false, error: 'Raffle not found' });
  }
  
  res.json({ success: true, data: raffle });
});

// Delete raffle
router.delete('/:id', (req: Request, res: Response) => {
  const deleted = raffleService.deleteRaffle(req.params.id);
  
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Raffle not found' });
  }
  
  res.json({ success: true, message: 'Raffle deleted successfully' });
});

// Draw winner
router.post('/:id/draw', (req: Request, res: Response) => {
  const result = raffleService.drawWinner(req.params.id);
  
  if (!result) {
    return res.status(400).json({ 
      success: false, 
      error: 'Could not draw winner. Raffle may be inactive or have no tickets sold.' 
    });
  }
  
  res.json({ success: true, data: result });
});

export default router;
