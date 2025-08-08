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
    FOREIGN KEY (item_id) REFERENCES items(id),
    FOREIGN KEY (study_id) REFERENCES studies(id)
  )`);
}

module.exports = function attachBasicInventory(app) {
  app.post('/api/basic/inventory/new', async (req, res) => {
    try {
      const { item_name, item_description, study_name, study_id, quantity } = req.body || {};
      if (!item_name || !study_name) return res.status(400).json({ error: 'item_name and study_name required' });
      await ensureSchema();
      const item = await run(`INSERT INTO items(name, description) VALUES(?, ?)`, [item_name, item_description || null]);
      const sid = (study_id && String(study_id).trim()) || (String(study_name).trim().toUpperCase().replace(/\s+/g, '-').slice(0, 48)) || `STUDY-${Date.now()}`;
      await run(`INSERT OR IGNORE INTO studies(study_name, study_id) VALUES(?, ?)`, [study_name, sid]);
      const study = await get(`SELECT id FROM studies WHERE study_id = ?`, [sid]);
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
        const studyName = r.Study || r['Study Name'] || r.study || r.study_name || r.Name || r.name;
        const quantity = Number(r.Quantity || r['Quantity in stock'] || r['Qty'] || r.qty || r.quantity || 0) || 0;
        const studyIdFromSheet = r['Study ID'] || r.study_id || r['StudyID'];
        if (!itemName || !studyName) continue;

        const itemIns = await run(`INSERT INTO items(name, description) VALUES(?, ?)`, [String(itemName).trim(), null]);
        const sid = (studyIdFromSheet && String(studyIdFromSheet).trim()) || String(studyName).trim().toUpperCase().replace(/\s+/g, '-').slice(0, 48);
        await run(`INSERT OR IGNORE INTO studies(study_name, study_id) VALUES(?, ?)`, [String(studyName).trim(), sid]);
        const study = await get(`SELECT id FROM studies WHERE study_id = ?`, [sid]);
        await run(`INSERT INTO inventory(item_id, study_id, quantity) VALUES(?, ?, ?)`, [itemIns.lastID, study.id, quantity]);
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


