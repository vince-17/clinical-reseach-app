const express = require('express');
const cors = require('cors');
const { db } = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

function createAuditLog(actor, action, entity, entityId, payload) {
  const createdAt = new Date().toISOString();
  db.run(
    'INSERT INTO audit_logs (actor, action, entity, entity_id, payload, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [actor || null, action, entity, entityId || null, payload ? JSON.stringify(payload) : null, createdAt]
  );
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch (e) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

// Auth routes
app.post('/api/auth/register', (req, res) => {
  const { email, password, role = 'coordinator' } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const hash = bcrypt.hashSync(password, 10);
  const createdAt = new Date().toISOString();
  db.run(
    'INSERT INTO users (email, password_hash, role, created_at) VALUES (?, ?, ?, ?)',
    [email, hash, role, createdAt],
    function (err) {
      if (err) return res.status(400).json({ error: 'User exists or invalid' });
      createAuditLog(email, 'register', 'user', this.lastID, {});
      res.status(201).json({ id: this.lastID, email, role });
    }
  );
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (!bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  });
});

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

app.post('/api/patients', authMiddleware, (req, res) => {
  const { firstName, lastName, dob } = req.body;
  if (!firstName || !lastName) return res.status(400).json({ error: 'firstName and lastName are required' });
  const createdAt = new Date().toISOString();
  const stmt = db.prepare('INSERT INTO patients (first_name, last_name, dob, created_at) VALUES (?, ?, ?, ?)');
  stmt.run(firstName, lastName, dob || null, createdAt, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    db.get('SELECT * FROM patients WHERE id = ?', [this.lastID], (e, row) => {
      if (e) return res.status(500).json({ error: e.message });
      createAuditLog(req.user?.email, 'create', 'patient', row.id, row);
      res.status(201).json(row);
    });
  });
});

app.delete('/api/patients/:id', authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });
  db.run('DELETE FROM patients WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
    createAuditLog(req.user?.email, 'delete', 'patient', id, {});
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

app.post('/api/appointments', authMiddleware, (req, res) => {
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
            createAuditLog(req.user?.email, 'create', 'appointment', appt.id, appt);
            res.status(201).json(appt);
          }
        );
      });
    }
  );
});

app.delete('/api/appointments/:id', authMiddleware, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });
  db.run('DELETE FROM appointments WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
    createAuditLog(req.user?.email, 'delete', 'appointment', id, {});
    res.status(204).send();
  });
});

// Visit types
app.get('/api/visit-types', (req, res) => {
  db.all('SELECT * FROM visit_types ORDER BY id DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
app.post('/api/visit-types', (req, res) => {
  const { name, offsetDays = 0, windowMinusDays = 0, windowPlusDays = 0, defaultDurationMinutes = 30 } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const createdAt = new Date().toISOString();
  db.run(
    `INSERT INTO visit_types (name, offset_days, window_minus_days, window_plus_days, default_duration_minutes, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [name, offsetDays, windowMinusDays, windowPlusDays, defaultDurationMinutes, createdAt],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      db.get('SELECT * FROM visit_types WHERE id = ?', [this.lastID], (e, row) => {
        if (e) return res.status(500).json({ error: e.message });
        res.status(201).json(row);
      });
    }
  );
});

// Resources
app.get('/api/resources', (req, res) => {
  db.all('SELECT * FROM resources ORDER BY id DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
app.post('/api/resources', (req, res) => {
  const { name, category } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const createdAt = new Date().toISOString();
  db.run('INSERT INTO resources (name, category, created_at) VALUES (?, ?, ?)', [name, category || null, createdAt], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    db.get('SELECT * FROM resources WHERE id = ?', [this.lastID], (e, row) => {
      if (e) return res.status(500).json({ error: e.message });
      res.status(201).json(row);
    });
  });
});

// Inventory alerts and CSV export
app.get('/api/inventory/alerts', (req, res) => {
  // Soon-to-expire (<=14 days) or low stock (<=5) lots
  db.all(
    `SELECT il.*, ii.name AS item_name
     FROM inventory_lots il JOIN inventory_items ii ON ii.id = il.item_id
     WHERE (il.expires_on IS NOT NULL AND DATE(il.expires_on) <= DATE('now', '+14 day'))
        OR il.quantity <= 5
     ORDER BY COALESCE(il.expires_on, '9999-12-31') ASC, il.quantity ASC`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

app.get('/api/inventory/report.csv', (req, res) => {
  db.all(
    `SELECT ii.name, ii.category, il.lot_code, il.quantity, il.expires_on
     FROM inventory_items ii LEFT JOIN inventory_lots il ON il.item_id = ii.id
     ORDER BY ii.name ASC, il.expires_on ASC`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      const header = 'Item,Category,Lot,Quantity,Expires\n';
      const csv = rows
        .map((r) => [r.name, r.category || '', r.lot_code || '', r.quantity ?? '', r.expires_on || ''].map((v) => String(v).replace(/"/g, '""')).map((v) => (v.includes(',') ? `"${v}"` : v)).join(','))
        .join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.send(header + csv + (csv ? '\n' : ''));
    }
  );
});

// Inventory: items
app.get('/api/inventory/items', (req, res) => {
  db.all('SELECT * FROM inventory_items ORDER BY id DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/inventory/items', authMiddleware, (req, res) => {
  const { name, category } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  const createdAt = new Date().toISOString();
  db.run('INSERT INTO inventory_items (name, category, created_at) VALUES (?, ?, ?)', [name, category || null, createdAt], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    db.get('SELECT * FROM inventory_items WHERE id = ?', [this.lastID], (e, row) => {
      if (e) return res.status(500).json({ error: e.message });
      createAuditLog(req.user?.email, 'create', 'inventory_item', row.id, row);
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

app.post('/api/inventory/items/:itemId/lots', authMiddleware, (req, res) => {
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
        createAuditLog(req.user?.email, 'create', 'inventory_lot', row.id, row);
        res.status(201).json(row);
      });
    }
  );
});

// Inventory: dispensing
app.post('/api/inventory/dispense', authMiddleware, (req, res) => {
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
          const payload = { id: this.lastID, patientId, itemId, lotId, quantity, created_at: createdAt };
          createAuditLog(req.user?.email, 'create', 'inventory_dispense', this.lastID, payload);
          res.status(201).json(payload);
        }
      );
    });
  });
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});


