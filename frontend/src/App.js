import { useEffect, useState } from 'react';
import Topbar from './components/Topbar.jsx';
import Sidebar from './components/Sidebar.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import PatientsPage from './pages/Patients.jsx';
import AppointmentsPage from './pages/Appointments.jsx';
// Removed legacy inventory imports
import InventoryModern from './pages/InventoryModern.jsx';
import AdminPage from './pages/Admin.jsx';
import './App.css';
import { Toast } from './components/Toast.jsx';

function AppShell() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({ firstName: '', lastName: '', dob: '', baselineDate: '' });
  const [appointments, setAppointments] = useState([]);
  const [apptForm, setApptForm] = useState({ patientId: '', title: '', startAt: '', durationMinutes: 30, resource: '', resourceId: '', visitTypeId: '' });
  // Legacy inventory state removed
  const [visitTypes, setVisitTypes] = useState([]);
  const [newVisitType, setNewVisitType] = useState({ name: '', offsetDays: 0, windowMinusDays: 0, windowPlusDays: 0, defaultDurationMinutes: 30 });
  const [resources, setResources] = useState([]);
  const [newResource, setNewResource] = useState({ name: '', category: '' });
  const [auth, setAuth] = useState({ email: '', password: '', token: '' });
  const [dashboard, setDashboard] = useState(null);
  const [patientQuery, setPatientQuery] = useState('');
  const [apptQuery, setApptQuery] = useState('');
  // Legacy item search removed
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [loading, setLoading] = useState({
    addPatient: false,
    updatePatient: false,
    addAppointment: false,
    updateAppointment: false,
    addItem: false,
    addLot: false,
    dispense: false,
  });

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

           // legacy inventory fetch removed

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
    setLoading((p)=>({ ...p, addPatient: true }));
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
      setToast({ message: 'Patient added', type: 'success' });
    } catch (e) {
      setError(e.message);
      setToast({ message: e.message, type: 'error' });
    } finally {
      setLoading((p)=>({ ...p, addPatient: false }));
    }
  };

  const updatePatient = async (id, partial) => {
    setLoading((p)=>({ ...p, updatePatient: true }));
    try {
      const res = await fetch(`/api/patients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: auth.token ? `Bearer ${auth.token}` : '' },
        body: JSON.stringify(partial),
      });
      if (res.ok) {
        const updated = await res.json();
        setPatients((prev) => prev.map((p) => (p.id === id ? updated : p)));
        setToast({ message: 'Patient updated', type: 'success' });
      } else {
        const err = await res.json().catch(() => ({}));
        const msg = err.error || 'Update failed';
        setError(msg);
        setToast({ message: msg, type: 'error' });
      }
    } finally {
      setLoading((p)=>({ ...p, updatePatient: false }));
    }
  };

  const deletePatient = async (id) => {
    await fetch(`/api/patients/${id}`, { method: 'DELETE', headers: { Authorization: auth.token ? `Bearer ${auth.token}` : '' } });
    setPatients((prev) => prev.filter((p) => p.id !== id));
  };

  const addAppointment = async (e) => {
    e.preventDefault();
    setLoading((p)=>({ ...p, addAppointment: true }));
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
      setToast({ message: 'Appointment scheduled', type: 'success' });
    } catch (e) {
      setError(e.message);
      setToast({ message: e.message, type: 'error' });
    } finally {
      setLoading((p)=>({ ...p, addAppointment: false }));
    }
  };

  const updateAppointment = async (id, partial) => {
    setLoading((p)=>({ ...p, updateAppointment: true }));
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: auth.token ? `Bearer ${auth.token}` : '' },
        body: JSON.stringify(partial),
      });
      if (!res.ok) {
        const err = await res.json().catch(()=>({}));
        throw new Error(err.error || 'Update failed');
      }
      const updated = await res.json();
      setAppointments((prev)=> prev.map((a)=> a.id === id ? updated : a));
      setToast({ message: 'Appointment updated', type: 'success' });
    } catch (e) {
      setError(e.message);
      setToast({ message: e.message, type: 'error' });
    } finally {
      setLoading((p)=>({ ...p, updateAppointment: false }));
    }
  };

  const deleteAppointment = async (id) => {
    await fetch(`/api/appointments/${id}`, { method: 'DELETE', headers: { Authorization: auth.token ? `Bearer ${auth.token}` : '' } });
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  };

  // legacy inventory handlers removed

  // legacy inventory handlers removed

  // legacy inventory handlers removed

  // legacy inventory handlers removed

  // legacy inventory handlers removed

  return (
    <div>
      <Topbar online={!!health} auth={auth} setAuth={setAuth} />
      <div className="layout">
        <Sidebar />
        <main className="content">
          <div className="container">
            {error && <p style={{ color: 'salmon' }}>Error: {error}</p>}
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard dashboard={dashboard} />} />
              <Route path="/patients" element={<PatientsPage patients={patients} patientQuery={patientQuery} setPatientQuery={setPatientQuery} form={form} setForm={setForm} addPatient={addPatient} updatePatient={updatePatient} deletePatient={deletePatient} onDeleteConfirm={async (id)=>{ if (window.confirm('Delete this patient? This cannot be undone.')) { await deletePatient(id); setToast({ message: 'Patient deleted', type: 'success' }); } }} loading={loading} />} />
              <Route path="/appointments" element={<AppointmentsPage patients={patients} appointments={appointments} visitTypes={visitTypes} resources={resources} apptForm={apptForm} setApptForm={setApptForm} apptQuery={apptQuery} setApptQuery={setApptQuery} addAppointment={addAppointment} deleteAppointment={async (id)=>{ if (window.confirm('Delete appointment?')) { await deleteAppointment(id); setToast({ message: 'Appointment deleted', type: 'success' }); } }} updateAppointment={updateAppointment} loading={loading} />} />
              <Route path="/inventory" element={<InventoryModern />} />
              <Route path="/admin" element={<AdminPage auth={auth} setAuth={setAuth} newVisitType={newVisitType} setNewVisitType={setNewVisitType} visitTypes={visitTypes} newResource={newResource} setNewResource={setNewResource} resources={resources} onAddVisitType={async (e) => { e.preventDefault(); const res = await fetch('/api/visit-types', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newVisitType) }); if (res.ok) { const vt = await res.json(); setVisitTypes((p) => [vt, ...p]); setNewVisitType({ name: '', offsetDays: 0, windowMinusDays: 0, windowPlusDays: 0, defaultDurationMinutes: 30 }); } }} onAddResource={async (e) => { e.preventDefault(); const res = await fetch('/api/resources', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newResource) }); if (res.ok) { const r = await res.json(); setResources((p) => [r, ...p]); setNewResource({ name: '', category: '' }); } }} />} />
            </Routes>
          </div>
        </main>
      </div>
      <Toast message={toast.message} type={toast.type} onDone={() => setToast({ message: '', type: 'info' })} />
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
