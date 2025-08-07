const express = require('express');
const cors = require('cors');
const { db } = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'backend', timestamp: new Date().toISOString() });
});

// Patients CRUD
app.get('/api/patients', (req, res) => {
  db.all('SELECT * FROM patients ORDER BY id DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/patients', (req, res) => {
  const { firstName, lastName, dob } = req.body;
  if (!firstName || !lastName) return res.status(400).json({ error: 'firstName and lastName are required' });
  const createdAt = new Date().toISOString();
  const stmt = db.prepare('INSERT INTO patients (first_name, last_name, dob, created_at) VALUES (?, ?, ?, ?)');
  stmt.run(firstName, lastName, dob || null, createdAt, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    db.get('SELECT * FROM patients WHERE id = ?', [this.lastID], (e, row) => {
      if (e) return res.status(500).json({ error: e.message });
      res.status(201).json(row);
    });
  });
});

app.delete('/api/patients/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });
  db.run('DELETE FROM patients WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  });
});

// Appointments: basic MVP with visit-window-like constraint and double-book prevention by patient and resource
app.get('/api/appointments', (req, res) => {
  db.all(
    `SELECT a.*, p.first_name, p.last_name
     FROM appointments a JOIN patients p ON p.id = a.patient_id
     ORDER BY a.start_at DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

app.post('/api/appointments', (req, res) => {
  const { patientId, title, startAt, durationMinutes, resource } = req.body;
  if (!patientId || !title || !startAt || !durationMinutes) {
    return res.status(400).json({ error: 'patientId, title, startAt, durationMinutes are required' });
  }
  // Prevent overlapping for the same patient and same resource (if provided)
  const endAtExpr = `datetime(?, '+' || ? || ' minutes')`;
  const overlapQuery = `
    SELECT 1 FROM appointments
    WHERE (
      patient_id = ? OR (resource IS NOT NULL AND resource = ?)
    ) AND (
      start_at < ${endAtExpr} AND ${endAtExpr} > start_at
    )
    LIMIT 1
  `;
  db.get(
    overlapQuery,
    [patientId, resource || '', startAt, durationMinutes, startAt, durationMinutes],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (row) return res.status(409).json({ error: 'Overlapping appointment detected' });

      const createdAt = new Date().toISOString();
      const stmt = db.prepare(
        `INSERT INTO appointments (patient_id, title, start_at, duration_minutes, resource, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      );
      stmt.run(patientId, title, startAt, durationMinutes, resource || null, createdAt, function (e) {
        if (e) return res.status(500).json({ error: e.message });
        db.get(
          `SELECT a.*, p.first_name, p.last_name FROM appointments a JOIN patients p ON p.id = a.patient_id WHERE a.id = ?`,
          [this.lastID],
          (gErr, appt) => {
            if (gErr) return res.status(500).json({ error: gErr.message });
            res.status(201).json(appt);
          }
        );
      });
    }
  );
});

app.delete('/api/appointments/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });
  db.run('DELETE FROM appointments WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  });
});

// Inventory: items
app.get('/api/inventory/items', (req, res) => {
  db.all('SELECT * FROM inventory_items ORDER BY id DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/inventory/items', (req, res) => {
  const { name, category } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const createdAt = new Date().toISOString();
  db.run('INSERT INTO inventory_items (name, category, created_at) VALUES (?, ?, ?)', [name, category || null, createdAt], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    db.get('SELECT * FROM inventory_items WHERE id = ?', [this.lastID], (e, row) => {
      if (e) return res.status(500).json({ error: e.message });
      res.status(201).json(row);
    });
  });
});

// Inventory: lots
app.get('/api/inventory/items/:itemId/lots', (req, res) => {
  const itemId = Number(req.params.itemId);
  db.all('SELECT * FROM inventory_lots WHERE item_id = ? ORDER BY expires_on ASC NULLS LAST, id DESC', [itemId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/inventory/items/:itemId/lots', (req, res) => {
  const itemId = Number(req.params.itemId);
  const { lotCode, quantity, expiresOn } = req.body;
  if (!quantity || quantity <= 0) return res.status(400).json({ error: 'quantity must be > 0' });
  const createdAt = new Date().toISOString();
  db.run(
    'INSERT INTO inventory_lots (item_id, lot_code, quantity, expires_on, created_at) VALUES (?, ?, ?, ?, ?)',
    [itemId, lotCode || null, quantity, expiresOn || null, createdAt],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      db.get('SELECT * FROM inventory_lots WHERE id = ?', [this.lastID], (e, row) => {
        if (e) return res.status(500).json({ error: e.message });
        res.status(201).json(row);
      });
    }
  );
});

// Inventory: dispensing
app.post('/api/inventory/dispense', (req, res) => {
  const { patientId, itemId, lotId, quantity } = req.body;
  if (!patientId || !itemId || !lotId || !quantity) {
    return res.status(400).json({ error: 'patientId, itemId, lotId, quantity are required' });
  }
  const createdAt = new Date().toISOString();
  db.get('SELECT quantity FROM inventory_lots WHERE id = ?', [lotId], (err, lot) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!lot) return res.status(404).json({ error: 'lot not found' });
    if (lot.quantity < quantity) return res.status(400).json({ error: 'insufficient quantity' });

    db.run('UPDATE inventory_lots SET quantity = quantity - ? WHERE id = ?', [quantity, lotId], function (uErr) {
      if (uErr) return res.status(500).json({ error: uErr.message });
      db.run(
        'INSERT INTO inventory_dispenses (patient_id, item_id, lot_id, quantity, created_at) VALUES (?, ?, ?, ?, ?)',
        [patientId, itemId, lotId, quantity, createdAt],
        function (iErr) {
          if (iErr) return res.status(500).json({ error: iErr.message });
          res.status(201).json({ id: this.lastID, patientId, itemId, lotId, quantity, created_at: createdAt });
        }
      );
    });
  });
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});


