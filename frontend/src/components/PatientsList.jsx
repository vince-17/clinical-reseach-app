import React from 'react';

export default function PatientsList({ patients, query, onQueryChange, onEdit, onDelete }) {
  const filtered = patients.filter((p) => `${p.first_name} ${p.last_name}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <div>
      <input placeholder="Search patients" value={query} onChange={(e)=>onQueryChange(e.target.value)} style={{ width:'100%', margin:'8px 0' }} />
      <ul style={{ width: 480, textAlign: 'left', listStyle:'none', padding:0 }}>
        {filtered.map((p) => (
          <li key={p.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, borderBottom:'1px solid #e5e7eb', padding:'8px 0' }}>
            <span>
              {p.first_name} {p.last_name} {p.dob ? `(${p.dob})` : ''}
            </span>
            <span>
              <button onClick={() => onEdit(p)} style={{ marginRight: 8 }}>Edit</button>
              <button onClick={() => onDelete(p.id)}>Delete</button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}


