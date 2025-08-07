const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const dbPath = path.join(dataDir, 'app.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      dob TEXT,
      created_at TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      start_at TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      resource TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(patient_id) REFERENCES patients(id)
    )
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_appointments_start ON appointments(start_at)`);

  // Visit types (protocol-like templates)
  db.run(`
    CREATE TABLE IF NOT EXISTS visit_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      offset_days INTEGER DEFAULT 0,
      window_minus_days INTEGER DEFAULT 0,
      window_plus_days INTEGER DEFAULT 0,
      default_duration_minutes INTEGER DEFAULT 30,
      created_at TEXT NOT NULL
    )
  `);

  // Resources (rooms, devices, staff placeholders)
  db.run(`
    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT,
      created_at TEXT NOT NULL
    )
  `);

  // Inventory tables
  db.run(`
    CREATE TABLE IF NOT EXISTS inventory_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT,
      created_at TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS inventory_lots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL,
      lot_code TEXT,
      quantity INTEGER NOT NULL,
      expires_on TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(item_id) REFERENCES inventory_items(id)
    )
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_lots_item ON inventory_lots(item_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_lots_exp ON inventory_lots(expires_on)`);

  // Basic audit logs
  db.run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor TEXT,
      action TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id INTEGER,
      payload TEXT,
      created_at TEXT NOT NULL
    )
  `);

  // Inventory dispenses (track which patient received which lot)
  db.run(`
    CREATE TABLE IF NOT EXISTS inventory_dispenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      lot_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(patient_id) REFERENCES patients(id),
      FOREIGN KEY(item_id) REFERENCES inventory_items(id),
      FOREIGN KEY(lot_id) REFERENCES inventory_lots(id)
    )
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_dispenses_item ON inventory_dispenses(item_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_dispenses_patient ON inventory_dispenses(patient_id)`);
});

module.exports = { db };


