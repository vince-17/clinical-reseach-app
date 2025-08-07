import { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({ firstName: '', lastName: '', dob: '' });
  const [appointments, setAppointments] = useState([]);
  const [apptForm, setApptForm] = useState({ patientId: '', title: '', startAt: '', durationMinutes: 30, resource: '' });

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
  }, []);

  const addPatient = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    await fetch(`/api/patients/${id}`, { method: 'DELETE' });
    setPatients((prev) => prev.filter((p) => p.id !== id));
  };

  const addAppointment = async (e) => {
    e.preventDefault();
    try {
      const body = { ...apptForm, patientId: Number(apptForm.patientId), durationMinutes: Number(apptForm.durationMinutes) };
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
    setAppointments((prev) => prev.filter((a) => a.id !== id));
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
      </header>
    </div>
  );
}

export default App;
