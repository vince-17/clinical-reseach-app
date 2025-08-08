import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function BasicInventoryTable({ reloadKey = 0 }) {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    api('/api/basic/inventory').then(setRows).catch(()=>setRows([]));
  }, [reloadKey]);

  return (
    <table border="1" cellPadding="6">
      <thead>
        <tr>
          <th>Item</th>
          <th>Description</th>
          <th>Study</th>
          <th>Study ID</th>
          <th>Quantity</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(r => (
          <tr key={r.id}>
            <td>{r.item_name}</td>
            <td>{r.description || ''}</td>
            <td>{r.study_name}</td>
            <td>{r.study_id}</td>
            <td>{r.quantity}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}


