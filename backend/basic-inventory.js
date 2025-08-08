const { db } = require('./db');
const multer = require('multer');
const XLSX = require('xlsx');

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
    inv_code TEXT,
    name TEXT,
    expires_on TEXT,
    qty_in_stock INTEGER,
    reorder_level INTEGER,
    reorder_time_days INTEGER,
    qty_in_reorder INTEGER,
    discontinued INTEGER,
    notes TEXT,
    FOREIGN KEY (item_id) REFERENCES items(id),
    FOREIGN KEY (study_id) REFERENCES studies(id)
  )`);
  // Backfill columns if table already existed
  const alterCols = [
    ['inv_code', 'TEXT'],
    ['name', 'TEXT'],
    ['expires_on', 'TEXT'],
    ['qty_in_stock', 'INTEGER'],
    ['reorder_level', 'INTEGER'],
    ['reorder_time_days', 'INTEGER'],
    ['qty_in_reorder', 'INTEGER'],
    ['discontinued', 'INTEGER'],
    ['notes', 'TEXT'],
  ];
  for (const [col, type] of alterCols) {
    try { // best-effort
      await run(`ALTER TABLE inventory ADD COLUMN ${col} ${type}`);
    } catch (_) {}
  }
}

module.exports = function attachBasicInventory(app) {
  app.post('/api/basic/inventory/new', async (req, res) => {
    try {
      const { item_name, item_description, study_name, study_id, quantity,
        inv_code, name, expires_on, qty_in_stock, reorder_level, reorder_time_days, qty_in_reorder, discontinued, notes } = req.body || {};
      if (!item_name || !study_name) return res.status(400).json({ error: 'item_name and study_name required' });
      await ensureSchema();
      const item = await run(`INSERT INTO items(name, description) VALUES(?, ?)`, [item_name, item_description || null]);
      const sid = (study_id && String(study_id).trim()) || (String(study_name).trim().toUpperCase().replace(/\s+/g, '-').slice(0, 48)) || `STUDY-${Date.now()}`;
      await run(`INSERT OR IGNORE INTO studies(study_name, study_id) VALUES(?, ?)`, [study_name, sid]);
      const study = await get(`SELECT id FROM studies WHERE study_id = ?`, [sid]);
      const inv = await run(
        `INSERT INTO inventory(item_id, study_id, quantity, inv_code, name, expires_on, qty_in_stock, reorder_level, reorder_time_days, qty_in_reorder, discontinued, notes)
         VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.lastID,
          study.id,
          Number(quantity ?? qty_in_stock ?? 0),
          inv_code || null,
          name || item_name || null,
          expires_on || null,
          qty_in_stock != null ? Number(qty_in_stock) : Number(quantity || 0),
          reorder_level != null ? Number(reorder_level) : null,
          reorder_time_days != null ? Number(reorder_time_days) : null,
          qty_in_reorder != null ? Number(qty_in_reorder) : null,
          discontinued ? 1 : 0,
          notes || null,
        ]
      );
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
               inv.quantity,
               inv.inv_code,
               COALESCE(inv.name, i.name) AS name,
               inv.expires_on,
               inv.qty_in_stock,
               inv.reorder_level,
               inv.reorder_time_days,
               inv.qty_in_reorder,
               inv.discontinued,
               inv.notes
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

  app.get('/api/basic/studies', async (_req, res) => {
    try {
      await ensureSchema();
      const rows = await all(`
        SELECT id, study_name, study_id
        FROM studies
        ORDER BY study_name ASC
      `);
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

  app.post('/api/basic/inventory/import', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'file is required' });
      await ensureSchema();
      const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = wb.SheetNames.find(n => n.toLowerCase() === 'study') || wb.SheetNames[0];
      if (!sheetName) return res.status(400).json({ error: 'No sheets found' });
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });

      // Clear existing inventory for a full replace
      await run(`DELETE FROM inventory`);
      // Optionally, keep items/studies tables and re-use entries; we will upsert by names/ids

      for (const r of rows) {
        // Try to map common headers; allow flexible column names
        const itemName = r.Item || r['Item Name'] || r.Name || r.Item_Name || r.item || r.name;
        const studyName = r.Study || r['Study'] || r['Study Name'] || r.study || r.study_name || r.Name || r.name;
        const quantity = Number(r.Quantity || r['Quantity in stock'] || r['Qty'] || r.qty || r.quantity || 0) || 0;
        const studyIdFromSheet = r['Study ID'] || r.study_id || r['StudyID'];
        const invCode = r['Inventory ID'] || r['InventoryID'] || r.inv_code || null;
        const name = r['Name'] || r['Item Name'] || r.name || itemName || null;
        const expiresOn = r['Earliest Expiry Date'] || r['Expiry'] || r['Expires On'] || r.expires_on || null;
        const qtyInStock = Number(r['Quantity in stock'] ?? r.qty_in_stock ?? quantity ?? 0) || 0;
        const reorderLevel = Number(r['Reorder level'] ?? r.reorder_level ?? null);
        const reorderTimeDays = Number(r['Reorder time in days'] ?? r.reorder_time_days ?? null);
        const qtyInReorder = Number(r['Quantity in reorder'] ?? r.qty_in_reorder ?? null);
        const discontinued = (String(r['Discontinued?'] ?? r.discontinued ?? '').toLowerCase().trim());
        const discontinuedVal = ['yes','y','true','1'].includes(discontinued) ? 1 : 0;
        const notes = r['Notes'] ?? r.notes ?? null;
        if (!itemName || !studyName) continue;

        const itemIns = await run(`INSERT INTO items(name, description) VALUES(?, ?)`, [String(itemName).trim(), null]);
        const sid = (studyIdFromSheet && String(studyIdFromSheet).trim()) || String(studyName).trim().toUpperCase().replace(/\s+/g, '-').slice(0, 48);
        await run(`INSERT OR IGNORE INTO studies(study_name, study_id) VALUES(?, ?)`, [String(studyName).trim(), sid]);
        const study = await get(`SELECT id FROM studies WHERE study_id = ?`, [sid]);
        await run(
          `INSERT INTO inventory(item_id, study_id, quantity, inv_code, name, expires_on, qty_in_stock, reorder_level, reorder_time_days, qty_in_reorder, discontinued, notes)
           VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [itemIns.lastID, study.id, quantity, invCode, name, expiresOn, qtyInStock, reorderLevel, reorderTimeDays, qtyInReorder, discontinuedVal, notes]
        );
      }

      const out = await all(`
        SELECT inv.id, i.name AS item_name, s.study_name, s.study_id, inv.quantity
        FROM inventory inv
        JOIN items i ON i.id = inv.item_id
        JOIN studies s ON s.id = inv.study_id
        ORDER BY inv.id DESC
      `);
      res.json({ ok: true, count: out.length });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/basic/inventory/:id', async (req, res) => {
    try {
      await ensureSchema();
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid id' });
      const result = await run(`DELETE FROM inventory WHERE id = ?`, [id]);
      if (result.changes === 0) return res.status(404).json({ error: 'not found' });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Delete a study (only if not used by any inventory)
  app.delete('/api/basic/studies/:id', async (req, res) => {
    try {
      await ensureSchema();
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid id' });
      
      // Check if study is used by any inventory
      const usage = await get(`SELECT COUNT(*) as count FROM inventory WHERE study_id = ?`, [id]);
      if (usage.count > 0) {
        return res.status(400).json({ error: 'Cannot delete study - it is being used by inventory items' });
      }
      
      const result = await run(`DELETE FROM studies WHERE id = ?`, [id]);
      if (result.changes === 0) return res.status(404).json({ error: 'Study not found' });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch('/api/basic/inventory/:id', async (req, res) => {
    try {
      await ensureSchema();
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid id' });
      const { quantity } = req.body || {};
      if (!Number.isFinite(Number(quantity)) || Number(quantity) < 0) {
        return res.status(400).json({ error: 'quantity must be a non-negative number' });
      }
      const result = await run(`UPDATE inventory SET quantity = ? WHERE id = ?`, [Number(quantity), id]);
      if (result.changes === 0) return res.status(404).json({ error: 'not found' });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
};


