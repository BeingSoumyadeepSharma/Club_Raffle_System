import express from 'express';
import cors from 'cors';
import routes from './routes';
import { initializeDatabase } from './data/database';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', routes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

// Initialize database and start server
async function startServer() {
  await initializeDatabase();
  
  app.listen(PORT, () => {
    console.log(`🎲 Raffle Server running on http://localhost:${PORT}`);
    console.log(`📋 API Documentation:`);
    console.log(`   GET  /health - Health check`);
    console.log(`   `);
    console.log(`   === Auth ===`);
    console.log(`   POST /api/auth/login - Login`);
    console.log(`   GET  /api/auth/me - Get current user`);
    console.log(`   POST /api/auth/users - Create user (superuser)`);
    console.log(`   GET  /api/auth/users - List users (superuser)`);
    console.log(`   PATCH /api/auth/users/:id/password - Update password`);
    console.log(`   DELETE /api/auth/users/:id - Delete user (superuser)`);
    console.log(`   POST /api/auth/users/:id/entities - Assign entity (superuser)`);
    console.log(`   DELETE /api/auth/users/:userId/entities/:entityId - Unassign entity`);
    console.log(`   `);
    console.log(`   === Entities (Clubs) ===`);
    console.log(`   GET  /api/entities - List all entities`);
    console.log(`   GET  /api/entities/:id - Get entity by ID`);
    console.log(`   POST /api/entities - Create new entity`);
    console.log(`   PUT  /api/entities/:id - Update entity`);
    console.log(`   DELETE /api/entities/:id - Delete entity`);
    console.log(`   `);
    console.log(`   === Tickets ===`);
    console.log(`   POST /api/tickets/purchase - Purchase tickets`);
    console.log(`   GET  /api/tickets/purchases - List all purchases`);
    console.log(`   GET  /api/tickets/purchases/:id - Get purchase by ID`);
    console.log(`   GET  /api/tickets/purchases/:id/receipt - Get receipt (JSON)`);
    console.log(`   GET  /api/tickets/purchases/:id/receipt/text - Get receipt (text)`);
    console.log(`   GET  /api/tickets/purchases/entity/:entityId - Get purchases by entity`);
    console.log(`   POST /api/tickets/reset-counter/:entityId - Reset ticket counter`);
    console.log(`   GET  /api/tickets/stats/:entityId - Get ticket stats`);
    console.log(`   POST /api/tickets/announcement - Generate announcement`);
    console.log(`   `);
    console.log(`   === Raffles ===`);
    console.log(`   GET  /api/raffles - List all raffles`);
    console.log(`   GET  /api/raffles/:id - Get raffle by ID`);
    console.log(`   POST /api/raffles - Create new raffle`);
    console.log(`   PUT  /api/raffles/:id - Update raffle`);
    console.log(`   DELETE /api/raffles/:id - Delete raffle`);
    console.log(`   POST /api/raffles/:id/draw - Draw winner`);
    console.log(`   `);
    console.log(`   === Export ===`);
    console.log(`   GET  /api/export/all - Export all data to Excel`);
    console.log(`   GET  /api/export/entity/:entityId - Export entity data to Excel`);
    console.log(`   `);
    console.log(`   🔐 Default superuser: admin / admin123`);
  });
}

startServer().catch(console.error);

export default app;
