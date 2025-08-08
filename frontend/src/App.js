import { useEffect, useState } from 'react';
import Topbar from './components/Topbar.jsx';
import Sidebar from './components/Sidebar.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import PatientsPage from './pages/Patients.jsx';
import AppointmentsPage from './pages/Appointments.jsx';
import InventoryPage from './pages/Inventory.jsx';
import AdminPage from './pages/Admin.jsx';
import './App.css';

function AppShell() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({ firstName: '', lastName: '', dob: '', baselineDate: '' });
  const [appointments, setAppointments] = useState([]);
  const [apptForm, setApptForm] = useState({ patientId: '', title: '', startAt: '', durationMinutes: 30, resource: '', resourceId: '', visitTypeId: '' });
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
  const [dashboard, setDashboard] = useState(null);
  const [patientQuery, setPatientQuery] = useState('');
  const [apptQuery, setApptQuery] = useState('');
  const [itemQuery, setItemQuery] = useState('');

  // Load token from localStorage
  useEffect(() => {
    const t = localStorage.getItem('auth_token');
    if (t) setAuth((p) => ({ ...p, token: t }));
  }, []);

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

    fetch('/api/dashboard')
      .then((res) => res.json())
      .then(setDashboard)
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
      setForm({ firstName: '', lastName: '', dob: '', baselineDate: '' });
    } catch (e) {
      setError(e.message);
    }
  };

  const updatePatient = async (id, partial) => {
    const res = await fetch(`/api/patients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: auth.token ? `Bearer ${auth.token}` : '' },
      body: JSON.stringify(partial),
    });
    if (res.ok) {
      const updated = await res.json();
      setPatients((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } else {
      const err = await res.json().catch(() => ({}));
      setError(err.error || 'Update failed');
    }
  };

  const deletePatient = async (id) => {
    await fetch(`/api/patients/${id}`, { method: 'DELETE', headers: { Authorization: auth.token ? `Bearer ${auth.token}` : '' } });
    setPatients((prev) => prev.filter((p) => p.id !== id));
  };

  const addAppointment = async (e) => {
    e.preventDefault();
    try {
      const body = { ...apptForm, patientId: Number(apptForm.patientId), durationMinutes: Number(apptForm.durationMinutes), resourceId: apptForm.resourceId ? Number(apptForm.resourceId) : undefined, visitTypeId: apptForm.visitTypeId ? Number(apptForm.visitTypeId) : undefined };
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
      setApptForm({ patientId: '', title: '', startAt: '', durationMinutes: 30, resource: '', resourceId: '', visitTypeId: '' });
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
    <div>
      <Topbar online={!!health} />
      <div className="layout">
        <Sidebar />
        <main className="content">
          <div className="container">
            {error && <p style={{ color: 'salmon' }}>Error: {error}</p>}
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard dashboard={dashboard} />} />
              <Route path="/patients" element={<PatientsPage patients={patients} patientQuery={patientQuery} setPatientQuery={setPatientQuery} form={form} setForm={setForm} addPatient={addPatient} updatePatient={updatePatient} deletePatient={deletePatient} />} />
              <Route path="/appointments" element={<AppointmentsPage patients={patients} appointments={appointments} visitTypes={visitTypes} resources={resources} apptForm={apptForm} setApptForm={setApptForm} apptQuery={apptQuery} setApptQuery={setApptQuery} addAppointment={addAppointment} deleteAppointment={deleteAppointment} />} />
              <Route path="/inventory" element={<InventoryPage auth={auth} setAuth={setAuth} items={items} newItem={newItem} setNewItem={setNewItem} addItem={addItem} lots={lots} newLot={newLot} setNewLot={setNewLot} loadLots={loadLots} addLot={addLot} dispense={dispense} setDispense={setDispense} doDispense={doDispense} patients={patients} />} />
              <Route path="/admin" element={<AdminPage newVisitType={newVisitType} setNewVisitType={setNewVisitType} visitTypes={visitTypes} newResource={newResource} setNewResource={setNewResource} resources={resources} onAddVisitType={async (e) => { e.preventDefault(); const res = await fetch('/api/visit-types', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newVisitType) }); if (res.ok) { const vt = await res.json(); setVisitTypes((p) => [vt, ...p]); setNewVisitType({ name: '', offsetDays: 0, windowMinusDays: 0, windowPlusDays: 0, defaultDurationMinutes: 30 }); } }} onAddResource={async (e) => { e.preventDefault(); const res = await fetch('/api/resources', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newResource) }); if (res.ok) { const r = await res.json(); setResources((p) => [r, ...p]); setNewResource({ name: '', category: '' }); } }} />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
}
