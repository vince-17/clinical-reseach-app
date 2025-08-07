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

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});


