import PatientsList from '../components/PatientsList.jsx';

export default function PatientsPage({
  patients,
  patientQuery,
  setPatientQuery,
  form,
  setForm,
  addPatient,
  updatePatient,
  deletePatient,
}) {
  return (
    <>
      <h2>Patients</h2>
      <form onSubmit={addPatient} style={{ marginBottom: 16 }}>
        <input placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
        <input placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} style={{ marginLeft: 8 }} />
        <input placeholder="DOB (YYYY-MM-DD)" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} style={{ marginLeft: 8 }} />
        <input type="date" placeholder="Baseline date" value={form.baselineDate} onChange={(e) => setForm({ ...form, baselineDate: e.target.value })} style={{ marginLeft: 8 }} />
        <button type="submit" style={{ marginLeft: 8 }}>Add</button>
      </form>
      <PatientsList
        patients={patients}
        query={patientQuery}
        onQueryChange={setPatientQuery}
        onEdit={(p) => {
          const firstName = window.prompt('First name', p.first_name) ?? p.first_name;
          const lastName = window.prompt('Last name', p.last_name) ?? p.last_name;
          updatePatient(p.id, { firstName, lastName });
        }}
        onDelete={deletePatient}
      />
    </>
  );
}


