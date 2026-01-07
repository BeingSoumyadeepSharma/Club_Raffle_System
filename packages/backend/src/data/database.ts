import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'raffle.db');

let db: SqlJsDatabase | null = null;

// Save database to file
function saveDatabase(): void {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

// Get database instance
export function getDb(): SqlJsDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

// Save after write operations
export function saveDb(): void {
  saveDatabase();
}

// Initialize database schema
export async function initializeDatabase(): Promise<void> {
  const SQL = await initSqlJs();

  // Load existing database or create new one
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');

  // Create entities table
  db.run(`
    CREATE TABLE IF NOT EXISTS entities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      emoji TEXT DEFAULT '🎲',
      tagline TEXT DEFAULT 'Thanks for your Purchase.. and good luck~',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Create purchases table
  db.run(`
    CREATE TABLE IF NOT EXISTS purchases (
      id TEXT PRIMARY KEY,
      entity_id TEXT NOT NULL,
      buyer_name TEXT NOT NULL,
      raffler_name TEXT NOT NULL,
      ticket_count INTEGER NOT NULL,
      price_per_ticket REAL NOT NULL,
      total_price REAL NOT NULL,
      start_ticket_number INTEGER NOT NULL,
      end_ticket_number INTEGER NOT NULL,
      is_gift INTEGER DEFAULT 0,
      gifter_name TEXT,
      is_paid INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (entity_id) REFERENCES entities(id)
    )
  `);

  // Create tickets table
  db.run(`
    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      ticket_number INTEGER NOT NULL,
      purchase_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (purchase_id) REFERENCES purchases(id)
    )
  `);

  // Create raffles table
  db.run(`
    CREATE TABLE IF NOT EXISTS raffles (
      id TEXT PRIMARY KEY,
      entity_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      prize_description TEXT NOT NULL,
      ticket_price REAL NOT NULL,
      max_tickets INTEGER DEFAULT 1000,
      sold_tickets INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      draw_date TEXT,
      winning_ticket_number INTEGER,
      winner_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (entity_id) REFERENCES entities(id)
    )
  `);

  // Create ticket counter table
  db.run(`
    CREATE TABLE IF NOT EXISTS ticket_counters (
      entity_id TEXT PRIMARY KEY,
      last_ticket_number INTEGER DEFAULT 0,
      FOREIGN KEY (entity_id) REFERENCES entities(id)
    )
  `);

  // Create users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'staff',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Migrate old is_superuser column to role if needed
  try {
    // Check if role column exists
    const tableInfo = db.exec("PRAGMA table_info(users)");
    const columns = tableInfo[0]?.values?.map(row => row[1]) || [];
    
    if (!columns.includes('role')) {
      // Add role column if it doesn't exist
      db.run("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'staff'");
    }
    
    // Check if is_superuser column exists and migrate data
    if (columns.includes('is_superuser')) {
      db.run("UPDATE users SET role = 'superuser' WHERE is_superuser = 1 AND (role IS NULL OR role = 'staff')");
    }
  } catch (e) {
    console.error('Migration error:', e);
  }

  // Create user_entities junction table
  db.run(`
    CREATE TABLE IF NOT EXISTS user_entities (
      user_id TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      assigned_at TEXT NOT NULL,
      PRIMARY KEY (user_id, entity_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE
    )
  `);

  // Create sessions table for shift management
  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      entity_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      start_ticket_number INTEGER NOT NULL,
      end_ticket_number INTEGER,
      tickets_sold INTEGER DEFAULT 0,
      total_revenue REAL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (entity_id) REFERENCES entities(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Add session_id column to purchases if it doesn't exist
  try {
    const purchaseTableInfo = db.exec("PRAGMA table_info(purchases)");
    const purchaseColumns = purchaseTableInfo[0]?.values?.map(row => row[1]) || [];
    
    if (!purchaseColumns.includes('session_id')) {
      db.run("ALTER TABLE purchases ADD COLUMN session_id TEXT");
    }
  } catch (e) {
    console.error('Session migration error:', e);
  }

  // Add raffle_percentage column to entities if it doesn't exist
  try {
    const entityTableInfo = db.exec("PRAGMA table_info(entities)");
    const entityColumns = entityTableInfo[0]?.values?.map(row => row[1]) || [];
    
    if (!entityColumns.includes('raffle_percentage')) {
      db.run("ALTER TABLE entities ADD COLUMN raffle_percentage REAL DEFAULT 70");
    }
  } catch (e) {
    console.error('Raffle percentage migration error:', e);
  }

  // Add raffler_name column to users if it doesn't exist
  try {
    const userTableInfo = db.exec("PRAGMA table_info(users)");
    const userColumns = userTableInfo[0]?.values?.map(row => row[1]) || [];
    
    if (!userColumns.includes('raffler_name')) {
      db.run("ALTER TABLE users ADD COLUMN raffler_name TEXT");
    }
  } catch (e) {
    console.error('Raffler name migration error:', e);
  }

  // Insert default GODFATHER'S CLUB entity if not exists
  const result = db.exec('SELECT id FROM entities WHERE id = ?', ['godfather-club']);
  if (result.length === 0 || result[0].values.length === 0) {
    const now = new Date().toISOString();
    db.run(
      `INSERT INTO entities (id, name, display_name, emoji, tagline, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        'godfather-club',
        'godfather',
        "GODFATHER'S CLUB",
        '🎲',
        'Thanks for your Purchase.. and good luck~',
        now,
        now
      ]
    );
    
    db.run('INSERT INTO ticket_counters (entity_id, last_ticket_number) VALUES (?, ?)', ['godfather-club', 0]);
  }

  // Insert default superuser 'admin' with password 'admin123' if not exists
  const adminResult = db.exec("SELECT id FROM users WHERE username = 'admin'");
  if (adminResult.length === 0 || adminResult[0].values.length === 0) {
    const now = new Date().toISOString();
    // Simple hash for default admin - must match auth.service.ts hashPassword function
    // Password: admin123
    const SECRET = process.env.JWT_SECRET || 'raffle-secret-key-change-in-production';
    const simpleHash = Buffer.from('admin123' + SECRET).toString('base64');
    db.run(
      `INSERT INTO users (id, username, password_hash, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        'admin-user',
        'admin',
        simpleHash,
        'superuser',
        now,
        now
      ]
    );
    console.log('🔐 Default superuser created: admin / admin123');
  }

  saveDatabase();
  console.log('✅ Database initialized successfully');
}

export default { getDb, saveDb, initializeDatabase };
