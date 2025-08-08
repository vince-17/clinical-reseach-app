import React from 'react';
import Modal from '../components/Modal.jsx';

export default function AppointmentsPage({
  patients,
  appointments,
  visitTypes,
  resources,
  apptForm,
  setApptForm,
  apptQuery,
  setApptQuery,
  addAppointment,
  deleteAppointment,
  updateAppointment,
  loading,
}) {
  const [editing, setEditing] = React.useState(null);
  const [editValues, setEditValues] = React.useState({ title:'', durationMinutes:30, resource:'', resourceId:'', visitTypeId:'' });

  const openEdit = (a) => {
    setEditing(a);
    setEditValues({ title:a.title, durationMinutes:a.duration_minutes, resource:a.resource || '', resourceId:a.resource_id || '', visitTypeId:a.visit_type_id || '' });
  };
  const saveEdit = async () => {
    await updateAppointment(editing.id, {
      title: editValues.title,
      durationMinutes: Number(editValues.durationMinutes),
      resource: editValues.resource || undefined,
      resourceId: editValues.resourceId ? Number(editValues.resourceId) : undefined,
      visitTypeId: editValues.visitTypeId ? Number(editValues.visitTypeId) : undefined,
    });
    setEditing(null);
  };
  return (
    <>
      <h2>Appointments</h2>
      <div style={{ margin: '8px 0' }}>
        <input placeholder="Search appointments" value={apptQuery} onChange={(e)=>setApptQuery(e.target.value)} />
      </div>
      <form onSubmit={addAppointment} style={{ marginBottom: 16 }}>
        <select value={apptForm.patientId} onChange={(e) => setApptForm({ ...apptForm, patientId: e.target.value })}>
          <option value="">Select patient</option>
          {patients.map((p) => (<option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>))}
        </select>
        <input placeholder="Title (e.g., Screening Visit)" value={apptForm.title} onChange={(e) => setApptForm({ ...apptForm, title: e.target.value })} style={{ marginLeft: 8 }} />
        <select value={apptForm.visitTypeId} onChange={(e) => setApptForm({ ...apptForm, visitTypeId: e.target.value })} style={{ marginLeft: 8 }}>
          <option value="">Visit type</option>
          {visitTypes.map((vt) => (<option key={vt.id} value={vt.id}>{vt.name}</option>))}
        </select>
        <input type="datetime-local" value={apptForm.startAt} onChange={(e) => setApptForm({ ...apptForm, startAt: e.target.value })} style={{ marginLeft: 8 }} />
        <input type="number" min="5" step="5" value={apptForm.durationMinutes} onChange={(e) => setApptForm({ ...apptForm, durationMinutes: e.target.value })} style={{ marginLeft: 8, width: 80 }} />
        <select value={apptForm.resourceId} onChange={(e) => setApptForm({ ...apptForm, resourceId: e.target.value })} style={{ marginLeft: 8 }}>
          <option value="">Select resource</option>
          {resources.map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
        </select>
        <input placeholder="Resource (e.g., Room 1)" value={apptForm.resource} onChange={(e) => setApptForm({ ...apptForm, resource: e.target.value })} style={{ marginLeft: 8 }} />
        <button type="submit" style={{ marginLeft: 8 }} disabled={loading?.addAppointment}>Schedule</button>
      </form>
      <ul style={{ width: 720, textAlign: 'left' }}>
        {appointments
          .filter((a)=>`${a.title} ${a.first_name} ${a.last_name}`.toLowerCase().includes(apptQuery.toLowerCase()))
          .map((a) => (
          <li key={a.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span>{a.title} — {a.first_name} {a.last_name} — {new Date(a.start_at).toLocaleString()} — {a.duration_minutes}m {a.resource ? `— ${a.resource}` : ''}</span>
            <span>
              <button onClick={() => openEdit(a)} style={{ marginRight: 8 }}>Edit</button>
              <button onClick={() => deleteAppointment(a.id)}>Delete</button>
            </span>
          </li>
        ))}
      </ul>

      <Modal open={!!editing} title="Edit appointment" onClose={() => setEditing(null)} footer={[
        <button key="cancel" className="btn" onClick={() => setEditing(null)}>Cancel</button>,
        <button key="save" className="btn btn-primary" onClick={saveEdit} disabled={loading?.updateAppointment}>Save</button>,
      ]}>
        <div className="grid" style={{ gap: 12 }}>
          <input placeholder="Title" value={editValues.title} onChange={(e)=>setEditValues(v=>({ ...v, title: e.target.value }))} />
          <input type="number" min="5" step="5" placeholder="Duration" value={editValues.durationMinutes} onChange={(e)=>setEditValues(v=>({ ...v, durationMinutes: e.target.value }))} />
          <select value={editValues.visitTypeId} onChange={(e)=>setEditValues(v=>({ ...v, visitTypeId: e.target.value }))}>
            <option value="">Visit type</option>
            {visitTypes.map((vt)=>(<option key={vt.id} value={vt.id}>{vt.name}</option>))}
          </select>
          <select value={editValues.resourceId} onChange={(e)=>setEditValues(v=>({ ...v, resourceId: e.target.value }))}>
            <option value="">Resource</option>
            {resources.map((r)=>(<option key={r.id} value={r.id}>{r.name}</option>))}
          </select>
          <input placeholder="Resource label" value={editValues.resource} onChange={(e)=>setEditValues(v=>({ ...v, resource: e.target.value }))} />
        </div>
      </Modal>
    </>
  );
}


