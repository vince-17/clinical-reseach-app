import { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({ firstName: '', lastName: '', dob: '' });
  const [appointments, setAppointments] = useState([]);
  const [apptForm, setApptForm] = useState({ patientId: '', title: '', startAt: '', durationMinutes: 30, resource: '' });
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: '', category: '' });
  const [lots, setLots] = useState([]);
  const [newLot, setNewLot] = useState({ itemId: '', lotCode: '', quantity: 1, expiresOn: '' });
  const [dispense, setDispense] = useState({ patientId: '', itemId: '', lotId: '', quantity: 1 });
  const [visitTypes, setVisitTypes] = useState([]);
  const [newVisitType, setNewVisitType] = useState({ name: '', offsetDays: 0, windowMinusDays: 0, windowPlusDays: 0, defaultDurationMinutes: 30 });
  const [resources, setResources] = useState([]);
  const [newResource, setNewResource] = useState({ name: '', category: '' });
  const [auth, setAuth] = useState({ email: '', password: '', token: '' });

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then(setHealth)
      .catch((err) => setError(err.message));

    fetch('/api/patients')
      .then((res) => res.json())
      .then(setPatients)
      .catch(() => {});

    fetch('/api/appointments')
      .then((res) => res.json())
      .then(setAppointments)
      .catch(() => {});

    fetch('/api/inventory/items')
      .then((res) => res.json())
      .then(setItems)
      .catch(() => {});

    fetch('/api/visit-types')
      .then((res) => res.json())
      .then(setVisitTypes)
      .catch(() => {});

    fetch('/api/resources')
      .then((res) => res.json())
      .then(setResources)
      .catch(() => {});
  }, []);

  const addPatient = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: auth.token ? `Bearer ${auth.token}` : '' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to add');
      const created = await res.json();
      setPatients((prev) => [created, ...prev]);
      setForm({ firstName: '', lastName: '', dob: '' });
    } catch (e) {
      setError(e.message);
    }
  };

  const deletePatient = async (id) => {
    await fetch(`/api/patients/${id}`, { method: 'DELETE', headers: { Authorization: auth.token ? `Bearer ${auth.token}` : '' } });
    setPatients((prev) => prev.filter((p) => p.id !== id));
  };

  const addAppointment = async (e) => {
    e.preventDefault();
    try {
      const body = { ...apptForm, patientId: Number(apptForm.patientId), durationMinutes: Number(apptForm.durationMinutes) };
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: auth.token ? `Bearer ${auth.token}` : '' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create appointment');
      }
      const created = await res.json();
      setAppointments((prev) => [created, ...prev]);
      setApptForm({ patientId: '', title: '', startAt: '', durationMinutes: 30, resource: '' });
    } catch (e) {
      setError(e.message);
    }
  };

  const deleteAppointment = async (id) => {
    await fetch(`/api/appointments/${id}`, { method: 'DELETE', headers: { Authorization: auth.token ? `Bearer ${auth.token}` : '' } });
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  };

  const addItem = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/inventory/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: auth.token ? `Bearer ${auth.token}` : '' },
      body: JSON.stringify(newItem),
    });
    if (res.ok) {
      const created = await res.json();
      setItems((prev) => [created, ...prev]);
      setNewItem({ name: '', category: '' });
    }
  };

  const loadLots = async (itemId) => {
    setNewLot((p) => ({ ...p, itemId }));
    const res = await fetch(`/api/inventory/items/${itemId}/lots`);
    if (res.ok) {
      const data = await res.json();
      setLots(data);
    }
  };

  const addLot = async (e) => {
    e.preventDefault();
    const { itemId, lotCode, quantity, expiresOn } = newLot;
    if (!itemId) return;
    const res = await fetch(`/api/inventory/items/${itemId}/lots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: auth.token ? `Bearer ${auth.token}` : '' },
      body: JSON.stringify({ lotCode, quantity: Number(quantity), expiresOn }),
    });
    if (res.ok) {
      const created = await res.json();
      setLots((prev) => [created, ...prev]);
      setNewLot({ itemId, lotCode: '', quantity: 1, expiresOn: '' });
    }
  };

  const doDispense = async (e) => {
    e.preventDefault();
    const body = { ...dispense, patientId: Number(dispense.patientId), itemId: Number(dispense.itemId), lotId: Number(dispense.lotId), quantity: Number(dispense.quantity) };
    const res = await fetch('/api/inventory/dispense', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: auth.token ? `Bearer ${auth.token}` : '' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setError(err.error || 'Dispense failed');
    } else {
      setError(null);
      setDispense({ patientId: '', itemId: '', lotId: '', quantity: 1 });
      // refresh lots for selected item
      if (body.itemId) loadLots(body.itemId);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Clinical Research App</h1>
        <p>Frontend connected to backend.</p>
        {health && (
          <pre style={{ textAlign: 'left' }}>{JSON.stringify(health, null, 2)}</pre>
        )}
        {error && <p style={{ color: 'salmon' }}>Error: {error}</p>}

        <h2>Patients</h2>
        <form onSubmit={addPatient} style={{ marginBottom: 16 }}>
          <input
            placeholder="First name"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          />
          <input
            placeholder="Last name"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            style={{ marginLeft: 8 }}
          />
          <input
            placeholder="DOB (YYYY-MM-DD)"
            value={form.dob}
            onChange={(e) => setForm({ ...form, dob: e.target.value })}
            style={{ marginLeft: 8 }}
          />
          <button type="submit" style={{ marginLeft: 8 }}>
            Add
          </button>
        </form>
        <ul style={{ width: 480, textAlign: 'left' }}>
          {patients.map((p) => (
            <li key={p.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>
                {p.first_name} {p.last_name} {p.dob ? `(${p.dob})` : ''}
              </span>
              <button onClick={() => deletePatient(p.id)}>Delete</button>
            </li>
          ))}
        </ul>

        <h2>Appointments</h2>
        <form onSubmit={addAppointment} style={{ marginBottom: 16 }}>
          <select
            value={apptForm.patientId}
            onChange={(e) => setApptForm({ ...apptForm, patientId: e.target.value })}
          >
            <option value="">Select patient</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.first_name} {p.last_name}
              </option>
            ))}
          </select>
          <input
            placeholder="Title (e.g., Screening Visit)"
            value={apptForm.title}
            onChange={(e) => setApptForm({ ...apptForm, title: e.target.value })}
            style={{ marginLeft: 8 }}
          />
          <input
            type="datetime-local"
            value={apptForm.startAt}
            onChange={(e) => setApptForm({ ...apptForm, startAt: e.target.value })}
            style={{ marginLeft: 8 }}
          />
          <input
            type="number"
            min="5"
            step="5"
            value={apptForm.durationMinutes}
            onChange={(e) => setApptForm({ ...apptForm, durationMinutes: e.target.value })}
            style={{ marginLeft: 8, width: 80 }}
          />
          <input
            placeholder="Resource (e.g., Room 1)"
            value={apptForm.resource}
            onChange={(e) => setApptForm({ ...apptForm, resource: e.target.value })}
            style={{ marginLeft: 8 }}
          />
          <button type="submit" style={{ marginLeft: 8 }}>
            Schedule
          </button>
        </form>
        <ul style={{ width: 720, textAlign: 'left' }}>
          {appointments.map((a) => (
            <li key={a.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>
                {a.title} — {a.first_name} {a.last_name} — {new Date(a.start_at).toLocaleString()} — {a.duration_minutes}m {a.resource ? `— ${a.resource}` : ''}
              </span>
              <button onClick={() => deleteAppointment(a.id)}>Delete</button>
            </li>
          ))}
        </ul>

        <h3>Visit Types</h3>
        <form onSubmit={async (e) => {
          e.preventDefault();
          const res = await fetch('/api/visit-types', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newVisitType) });
          if (res.ok) {
            const vt = await res.json();
            setVisitTypes((p) => [vt, ...p]);
            setNewVisitType({ name: '', offsetDays: 0, windowMinusDays: 0, windowPlusDays: 0, defaultDurationMinutes: 30 });
          }
        }}>
          <input placeholder="Name" value={newVisitType.name} onChange={(e) => setNewVisitType({ ...newVisitType, name: e.target.value })} />
          <input type="number" style={{ marginLeft: 8, width: 90 }} placeholder="Offset" value={newVisitType.offsetDays} onChange={(e) => setNewVisitType({ ...newVisitType, offsetDays: Number(e.target.value) })} />
          <input type="number" style={{ marginLeft: 8, width: 90 }} placeholder="Win -" value={newVisitType.windowMinusDays} onChange={(e) => setNewVisitType({ ...newVisitType, windowMinusDays: Number(e.target.value) })} />
          <input type="number" style={{ marginLeft: 8, width: 90 }} placeholder="Win +" value={newVisitType.windowPlusDays} onChange={(e) => setNewVisitType({ ...newVisitType, windowPlusDays: Number(e.target.value) })} />
          <input type="number" style={{ marginLeft: 8, width: 120 }} placeholder="Duration" value={newVisitType.defaultDurationMinutes} onChange={(e) => setNewVisitType({ ...newVisitType, defaultDurationMinutes: Number(e.target.value) })} />
          <button type="submit" style={{ marginLeft: 8 }}>Add</button>
        </form>
        <ul style={{ textAlign: 'left' }}>
          {visitTypes.map((vt) => (
            <li key={vt.id}>{vt.name} — offset {vt.offset_days}d, window [-{vt.window_minus_days}, +{vt.window_plus_days}], default {vt.default_duration_minutes}m</li>
          ))}
        </ul>

        <h3>Resources</h3>
        <form onSubmit={async (e) => {
          e.preventDefault();
          const res = await fetch('/api/resources', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newResource) });
          if (res.ok) {
            const r = await res.json();
            setResources((p) => [r, ...p]);
            setNewResource({ name: '', category: '' });
          }
        }}>
          <input placeholder="Resource name" value={newResource.name} onChange={(e) => setNewResource({ ...newResource, name: e.target.value })} />
          <input placeholder="Category" value={newResource.category} onChange={(e) => setNewResource({ ...newResource, category: e.target.value })} style={{ marginLeft: 8 }} />
          <button type="submit" style={{ marginLeft: 8 }}>Add</button>
        </form>
        <ul style={{ textAlign: 'left' }}>
          {resources.map((r) => (
            <li key={r.id}>{r.name} {r.category ? `(${r.category})` : ''}</li>
          ))}
        </ul>

        <div style={{ marginTop: 16 }}>
          <a href="/api/inventory/report.csv" target="_blank" rel="noreferrer">Download Inventory CSV</a>
        </div>

        <h2>Inventory</h2>
        <div style={{ marginBottom: 12 }}>
          <strong>Auth</strong>
          <form onSubmit={async (e) => { e.preventDefault(); const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: auth.email, password: auth.password }) }); if (res.ok) { const data = await res.json(); setAuth((p) => ({ ...p, token: data.token })); } }}>
            <input placeholder="email" value={auth.email} onChange={(e) => setAuth({ ...auth, email: e.target.value })} />
            <input placeholder="password" type="password" value={auth.password} onChange={(e) => setAuth({ ...auth, password: e.target.value })} style={{ marginLeft: 8 }} />
            <button type="submit" style={{ marginLeft: 8 }}>Login</button>
            {auth.token && <span style={{ marginLeft: 8, color: 'lightgreen' }}>Logged in</span>}
          </form>
        </div>
        <form onSubmit={addItem} style={{ marginBottom: 12 }}>
          <input placeholder="Item name" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} />
          <input placeholder="Category" value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} style={{ marginLeft: 8 }} />
          <button type="submit" style={{ marginLeft: 8 }}>Add Item</button>
        </form>
        <div style={{ display: 'flex', gap: 24 }}>
          <div style={{ width: 300, textAlign: 'left' }}>
            <strong>Items</strong>
            <ul>
              {items.map((it) => (
                <li key={it.id}>
                  <button onClick={() => loadLots(it.id)} style={{ marginRight: 8 }}>View Lots</button>
                  {it.name} {it.category ? `(${it.category})` : ''}
                </li>
              ))}
            </ul>
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <strong>Lots</strong>
            <form onSubmit={addLot} style={{ marginBottom: 12 }}>
              <select value={newLot.itemId} onChange={(e) => loadLots(e.target.value)}>
                <option value="">Select item</option>
                {items.map((it) => (
                  <option key={it.id} value={it.id}>{it.name}</option>
                ))}
              </select>
              <input placeholder="Lot code" value={newLot.lotCode} onChange={(e) => setNewLot({ ...newLot, lotCode: e.target.value })} style={{ marginLeft: 8 }} />
              <input type="number" min="1" value={newLot.quantity} onChange={(e) => setNewLot({ ...newLot, quantity: e.target.value })} style={{ marginLeft: 8, width: 80 }} />
              <input type="date" value={newLot.expiresOn} onChange={(e) => setNewLot({ ...newLot, expiresOn: e.target.value })} style={{ marginLeft: 8 }} />
              <button type="submit" style={{ marginLeft: 8 }}>Add Lot</button>
            </form>
            <ul>
              {lots.map((lot) => (
                <li key={lot.id}>
                  {lot.lot_code || 'N/A'} — Qty: {lot.quantity} — Expires: {lot.expires_on || 'N/A'}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <h3>Dispense</h3>
        <form onSubmit={doDispense}>
          <select value={dispense.patientId} onChange={(e) => setDispense({ ...dispense, patientId: e.target.value })}>
            <option value="">Select patient</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
            ))}
          </select>
          <select value={dispense.itemId} onChange={(e) => { setDispense({ ...dispense, itemId: e.target.value, lotId: '' }); loadLots(e.target.value); }} style={{ marginLeft: 8 }}>
            <option value="">Select item</option>
            {items.map((it) => (
              <option key={it.id} value={it.id}>{it.name}</option>
            ))}
          </select>
          <select value={dispense.lotId} onChange={(e) => setDispense({ ...dispense, lotId: e.target.value })} style={{ marginLeft: 8 }}>
            <option value="">Select lot</option>
            {lots.map((l) => (
              <option key={l.id} value={l.id}>{l.lot_code || 'N/A'} (Qty {l.quantity})</option>
            ))}
          </select>
          <input type="number" min="1" value={dispense.quantity} onChange={(e) => setDispense({ ...dispense, quantity: e.target.value })} style={{ marginLeft: 8, width: 80 }} />
          <button type="submit" style={{ marginLeft: 8 }}>Dispense</button>
        </form>
      </header>
    </div>
  );
}

export default App;
