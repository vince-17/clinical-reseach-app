import { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({ firstName: '', lastName: '', dob: '' });

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then(setHealth)
      .catch((err) => setError(err.message));

    fetch('/api/patients')
      .then((res) => res.json())
      .then(setPatients)
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
      </header>
    </div>
  );
}

export default App;
