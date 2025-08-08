const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

app.use(cors());
app.use(express.json());

// Helpers: sqlite3 promisified
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, changes: this.changes });
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
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

async function createAuditLog(actor, action, entity, entityId, payload) {
  try {
    await run(
      `INSERT INTO audit_logs (actor, action, entity, entity_id, payload, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      [actor || null, action, entity, entityId || null, payload ? JSON.stringify(payload) : null]
    );
  } catch (_) {}
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'backend', now: new Date().toISOString() });
});

// Seed default admin
(async () => {
  const existing = await get('SELECT id FROM users WHERE email = ?', ['admin@example.com']);
  if (!existing) {
    const hash = await bcrypt.hash('admin123', 10);
    await run(
      `INSERT INTO users (email, password_hash, role, created_at) VALUES (?, ?, ?, datetime('now'))`,
      ['admin@example.com', hash, 'manager']
    );
    console.log('Seeded admin user: admin@example.com / admin123');
  }
})();

// Auth
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  const user = await get('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password || '', user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '2d' });
  res.json({ token });
});

// Patients
app.get('/api/patients', async (_req, res) => {
  const rows = await all('SELECT * FROM patients ORDER BY created_at DESC');
  res.json(rows);
});
app.post('/api/patients', authMiddleware, async (req, res) => {
  const { firstName, lastName, dob, baselineDate } = req.body || {};
  if (!firstName || !lastName) return res.status(400).json({ error: 'Missing name' });
  const r = await run(
    `INSERT INTO patients (first_name, last_name, dob, baseline_date, created_at)
     VALUES (?, ?, ?, ?, datetime('now'))`,
    [firstName, lastName, dob || null, baselineDate || null]
  );
  const created = await get('SELECT * FROM patients WHERE id = ?', [r.id]);
  await createAuditLog(req.user?.email, 'create', 'patient', r.id, created);
  res.json(created);
});
app.put('/api/patients/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, dob, baselineDate } = req.body || {};
  const existing = await get('SELECT * FROM patients WHERE id = ?', [id]);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  await run(
    `UPDATE patients SET first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name), dob = COALESCE(?, dob), baseline_date = COALESCE(?, baseline_date) WHERE id = ?`,
    [firstName, lastName, dob, baselineDate, id]
  );
  const updated = await get('SELECT * FROM patients WHERE id = ?', [id]);
  await createAuditLog(req.user?.email, 'update', 'patient', id, updated);
  res.json(updated);
});
app.delete('/api/patients/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  await run('DELETE FROM patients WHERE id = ?', [id]);
  await createAuditLog(req.user?.email, 'delete', 'patient', id, null);
  res.json({ ok: true });
});

// Appointments
app.get('/api/appointments', async (_req, res) => {
  const rows = await all(
    `SELECT a.*, p.first_name, p.last_name
     FROM appointments a JOIN patients p ON p.id = a.patient_id
     ORDER BY datetime(a.start_at) DESC`
  );
  res.json(rows);
});
app.post('/api/appointments', authMiddleware, async (req, res) => {
  const { patientId, title, startAt, durationMinutes, resource, resourceId, visitTypeId } = req.body || {};
  if (!patientId || !title || !startAt || !durationMinutes) return res.status(400).json({ error: 'Missing fields' });
  const r = await run(
    `INSERT INTO appointments (patient_id, title, start_at, duration_minutes, resource, resource_id, visit_type_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [patientId, title, startAt, durationMinutes, resource || null, resourceId || null, visitTypeId || null]
  );
  const created = await get('SELECT * FROM appointments WHERE id = ?', [r.id]);
  await createAuditLog(req.user?.email, 'create', 'appointment', r.id, created);
  res.json(created);
});
app.put('/api/appointments/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { title, startAt, durationMinutes, resource, resourceId, visitTypeId } = req.body || {};
  const existing = await get('SELECT * FROM appointments WHERE id = ?', [id]);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  await run(
    `UPDATE appointments SET
      title = COALESCE(?, title),
      start_at = COALESCE(?, start_at),
      duration_minutes = COALESCE(?, duration_minutes),
      resource = COALESCE(?, resource),
      resource_id = COALESCE(?, resource_id),
      visit_type_id = COALESCE(?, visit_type_id)
     WHERE id = ?`,
    [title, startAt, durationMinutes, resource, resourceId, visitTypeId, id]
  );
  const updated = await get('SELECT * FROM appointments WHERE id = ?', [id]);
  await createAuditLog(req.user?.email, 'update', 'appointment', id, updated);
  res.json(updated);
});
app.delete('/api/appointments/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  await run('DELETE FROM appointments WHERE id = ?', [id]);
  await createAuditLog(req.user?.email, 'delete', 'appointment', id, null);
  res.json({ ok: true });
});

// Visit types
app.get('/api/visit-types', async (_req, res) => {
  const rows = await all('SELECT * FROM visit_types ORDER BY created_at DESC');
  res.json(rows);
});
app.post('/api/visit-types', async (req, res) => {
  const { name, offsetDays = 0, windowMinusDays = 0, windowPlusDays = 0, defaultDurationMinutes = 30 } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Missing name' });
  const r = await run(
    `INSERT INTO visit_types (name, offset_days, window_minus_days, window_plus_days, default_duration_minutes, created_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))`,
    [name, offsetDays, windowMinusDays, windowPlusDays, defaultDurationMinutes]
  );
  const created = await get('SELECT * FROM visit_types WHERE id = ?', [r.id]);
  res.json(created);
});

// Resources
app.get('/api/resources', async (_req, res) => {
  const rows = await all('SELECT * FROM resources ORDER BY created_at DESC');
  res.json(rows);
});
app.post('/api/resources', async (req, res) => {
  const { name, category } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Missing name' });
  const r = await run(`INSERT INTO resources (name, category, created_at) VALUES (?, ?, datetime('now'))`, [name, category || null]);
  const created = await get('SELECT * FROM resources WHERE id = ?', [r.id]);
  res.json(created);
});

// Inventory
app.get('/api/inventory/items', async (_req, res) => {
  const rows = await all('SELECT * FROM inventory_items ORDER BY created_at DESC');
  res.json(rows);
});
app.post('/api/inventory/items', authMiddleware, async (req, res) => {
  const { name, category } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Missing name' });
  const r = await run(`INSERT INTO inventory_items (name, category, created_at) VALUES (?, ?, datetime('now'))`, [name, category || null]);
  const created = await get('SELECT * FROM inventory_items WHERE id = ?', [r.id]);
  await createAuditLog(req.user?.email, 'create', 'inventory_item', r.id, created);
  res.json(created);
});
app.get('/api/inventory/items/:itemId/lots', async (req, res) => {
  const { itemId } = req.params;
  const rows = await all('SELECT * FROM inventory_lots WHERE item_id = ? ORDER BY created_at DESC', [itemId]);
  res.json(rows);
});
app.post('/api/inventory/items/:itemId/lots', authMiddleware, async (req, res) => {
  const { itemId } = req.params;
  const { lotCode, quantity, expiresOn } = req.body || {};
  if (!itemId || !quantity) return res.status(400).json({ error: 'Missing fields' });
  const r = await run(
    `INSERT INTO inventory_lots (item_id, lot_code, quantity, expires_on, created_at) VALUES (?, ?, ?, ?, datetime('now'))`,
    [itemId, lotCode || null, Number(quantity), expiresOn || null]
  );
  const created = await get('SELECT * FROM inventory_lots WHERE id = ?', [r.id]);
  await createAuditLog(req.user?.email, 'create', 'inventory_lot', r.id, created);
  res.json(created);
});
app.post('/api/inventory/dispense', authMiddleware, async (req, res) => {
  const { patientId, itemId, lotId, quantity } = req.body || {};
  if (!patientId || !itemId || !lotId || !quantity) return res.status(400).json({ error: 'Missing fields' });
  const r = await run(
    `INSERT INTO inventory_dispenses (patient_id, item_id, lot_id, quantity, created_at)
     VALUES (?, ?, ?, ?, datetime('now'))`,
    [patientId, itemId, lotId, Number(quantity)]
  );
  const created = await get('SELECT * FROM inventory_dispenses WHERE id = ?', [r.id]);
  await createAuditLog(req.user?.email, 'create', 'inventory_dispense', r.id, created);
  res.json(created);
});

app.get('/api/inventory/report.csv', async (_req, res) => {
  const rows = await all(
    `SELECT i.name as item, i.category, l.lot_code, l.quantity, l.expires_on
     FROM inventory_lots l JOIN inventory_items i ON i.id = l.item_id`
  );
  const header = 'item,category,lot_code,quantity,expires_on\n';
  const body = rows.map((r) => [r.item, r.category || '', r.lot_code || '', r.quantity, r.expires_on || ''].join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.send(header + body);
});

// Audit logs
app.get('/api/audit-logs', async (_req, res) => {
  const rows = await all('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 200');
  res.json(rows);
});

// Dashboard
app.get('/api/dashboard', async (_req, res) => {
  const [p] = await all('SELECT COUNT(*) as c FROM patients');
  const [up] = await all("SELECT COUNT(*) as c FROM appointments WHERE datetime(start_at) >= datetime('now')");
  const [low] = await all('SELECT COUNT(*) as c FROM inventory_lots WHERE quantity <= 5');
  const [exp] = await all("SELECT COUNT(*) as c FROM inventory_lots WHERE expires_on IS NOT NULL AND date(expires_on) <= date('now','+14 day')");
  res.json({ patients: p?.c || 0, upcomingAppointments: up?.c || 0, lowStockLots: low?.c || 0, expiringSoonLots: exp?.c || 0 });
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});


