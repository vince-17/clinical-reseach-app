import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function BasicInventoryTable({ reloadKey = 0 }) {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    api('/api/basic/inventory').then(setRows).catch(()=>setRows([]));
  }, [reloadKey]);

  return (
    <div>
      <div className="list" style={{ width: '100%' }}>
        <div className="row-between" style={{ padding: '6px 0', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>
          <span style={{ width: '35%' }}>Item</span>
          <span style={{ width: '35%' }}>Study</span>
          <span style={{ width: '15%', textAlign: 'right' }}>Qty</span>
        </div>
        {rows.map(r => (
          <div key={r.id} className="row-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ width: '35%' }}>{r.item_name}</span>
            <span style={{ width: '35%' }}>{r.study_name}</span>
            <span style={{ width: '15%', textAlign: 'right' }}>{r.quantity}</span>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="muted" style={{ padding: '12px 0' }}>No inventory yet.</div>
        )}
      </div>
    </div>
  );
}


