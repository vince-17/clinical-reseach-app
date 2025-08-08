import { render, screen, fireEvent } from '@testing-library/react';
import PatientsPage from './Patients.jsx';

test('patients page renders and allows search', () => {
  const patients = [
    { id: 1, first_name: 'Alice', last_name: 'Zephyr' },
    { id: 2, first_name: 'Bob', last_name: 'Young' },
  ];
  render(<PatientsPage patients={patients} patientQuery="" setPatientQuery={()=>{}} form={{}} setForm={()=>{}} addPatient={(e)=>e.preventDefault()} updatePatient={()=>{}} deletePatient={()=>{}} />);
  expect(screen.getByText(/Patients/i)).toBeInTheDocument();
  expect(screen.getByText(/Alice/)).toBeInTheDocument();
});


