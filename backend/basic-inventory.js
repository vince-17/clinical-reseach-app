const { db } = require('./db');

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}
function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function ensureSchema() {
  await run(`CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT
  )`);
  await run(`CREATE TABLE IF NOT EXISTS studies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    study_name TEXT NOT NULL,
    study_id TEXT NOT NULL,
    UNIQUE(study_id)
  )`);
  await run(`CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    study_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (item_id) REFERENCES items(id),
    FOREIGN KEY (study_id) REFERENCES studies(id)
  )`);
}

module.exports = function attachBasicInventory(app) {
  app.post('/api/basic/inventory/new', async (req, res) => {
    try {
      const { item_name, item_description, study_name, study_id, quantity } = req.body || {};
      if (!item_name || !study_name || !study_id) return res.status(400).json({ error: 'item_name, study_name, study_id required' });
      await ensureSchema();
      const item = await run(`INSERT INTO items(name, description) VALUES(?, ?)`, [item_name, item_description || null]);
      await run(`INSERT OR IGNORE INTO studies(study_name, study_id) VALUES(?, ?)`, [study_name, study_id]);
      const study = await get(`SELECT id FROM studies WHERE study_id = ?`, [study_id]);
      const inv = await run(`INSERT INTO inventory(item_id, study_id, quantity) VALUES(?, ?, ?)`, [item.lastID, study.id, Number(quantity || 0)]);
      res.json({ ok: true, id: inv.lastID });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/basic/inventory', async (_req, res) => {
    try {
      await ensureSchema();
      const rows = await all(`
        SELECT inv.id,
               i.name       AS item_name,
               i.description AS description,
               s.study_name AS study_name,
               s.study_id   AS study_id,
               inv.quantity
        FROM inventory inv
        JOIN items   i ON i.id = inv.item_id
        JOIN studies s ON s.id = inv.study_id
        ORDER BY inv.id DESC
      `);
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
};


