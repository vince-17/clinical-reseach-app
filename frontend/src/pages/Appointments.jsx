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
}) {
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
        <button type="submit" style={{ marginLeft: 8 }}>Schedule</button>
      </form>
      <ul style={{ width: 720, textAlign: 'left' }}>
        {appointments
          .filter((a)=>`${a.title} ${a.first_name} ${a.last_name}`.toLowerCase().includes(apptQuery.toLowerCase()))
          .map((a) => (
          <li key={a.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span>{a.title} — {a.first_name} {a.last_name} — {new Date(a.start_at).toLocaleString()} — {a.duration_minutes}m {a.resource ? `— ${a.resource}` : ''}</span>
            <button onClick={() => deleteAppointment(a.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </>
  );
}


