import React from 'react';
import PatientsList from '../components/PatientsList.jsx';
import Modal from '../components/Modal.jsx';

export default function PatientsPage({
  patients,
  patientQuery,
  setPatientQuery,
  form,
  setForm,
  addPatient,
  updatePatient,
  deletePatient,
  onDeleteConfirm,
  loading,
}) {
  const [editing, setEditing] = React.useState(null);
  const [editValues, setEditValues] = React.useState({ firstName: '', lastName: '' });

  const openEdit = (p) => {
    setEditing(p);
    setEditValues({ firstName: p.first_name, lastName: p.last_name });
  };
  const saveEdit = async () => {
    await updatePatient(editing.id, { firstName: editValues.firstName, lastName: editValues.lastName });
    setEditing(null);
  };
  return (
    <>
      <h2>Patients</h2>
      <form onSubmit={addPatient} style={{ marginBottom: 16 }}>
        <input placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
        <input placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} style={{ marginLeft: 8 }} />
        <input placeholder="DOB (YYYY-MM-DD)" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} style={{ marginLeft: 8 }} />
        <input type="date" placeholder="Baseline date" value={form.baselineDate} onChange={(e) => setForm({ ...form, baselineDate: e.target.value })} style={{ marginLeft: 8 }} />
        <button type="submit" style={{ marginLeft: 8 }} disabled={loading?.addPatient}>Add</button>
      </form>
      <PatientsList
        patients={patients}
        query={patientQuery}
        onQueryChange={setPatientQuery}
        onEdit={openEdit}
        onDelete={(id)=> onDeleteConfirm ? onDeleteConfirm(id) : deletePatient(id)}
      />

      <Modal open={!!editing} title="Edit patient" onClose={() => setEditing(null)} footer={[
        <button key="cancel" className="btn" onClick={() => setEditing(null)}>Cancel</button>,
        <button key="save" className="btn btn-primary" onClick={saveEdit}>Save</button>,
      ]}>
        <div className="grid" style={{ gap: 12 }}>
          <input placeholder="First name" value={editValues.firstName} onChange={(e)=>setEditValues(v=>({ ...v, firstName: e.target.value }))} />
          <input placeholder="Last name" value={editValues.lastName} onChange={(e)=>setEditValues(v=>({ ...v, lastName: e.target.value }))} />
        </div>
      </Modal>
    </>
  );
}


