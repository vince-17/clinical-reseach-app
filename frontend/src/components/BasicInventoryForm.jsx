import React, { useState } from 'react';
import { api } from '../api';

export default function BasicInventoryForm({ onAdded }) {
  const [f, setF] = useState({ item_name: '', study_name: '', quantity: 0 });
  const [msg, setMsg] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setMsg('');
    try {
      await api('/api/basic/inventory/new', { method: 'POST', body: f });
      setMsg('Saved');
      setF({ item_name: '', study_name: '', quantity: 0 });
      onAdded && onAdded();
    } catch (e) {
      setMsg(e.message || 'Failed');
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display:'grid', gap:8, maxWidth:420 }}>
      <div style={{ display:'grid', gap:8 }}>
        <label className="muted">Item</label>
        <input className="input-field" placeholder="e.g., Syringe 5ml" value={f.item_name} onChange={(e)=>setF(s=>({ ...s, item_name: e.target.value }))} />
      </div>
      <div style={{ display:'grid', gap:8 }}>
        <label className="muted">Study</label>
        <input className="input-field" placeholder="e.g., COVID Booster" value={f.study_name} onChange={(e)=>setF(s=>({ ...s, study_name: e.target.value }))} />
      </div>
      <div style={{ display:'grid', gap:8 }}>
        <label className="muted">Quantity</label>
        <input className="input-field" type="number" min="0" value={f.quantity} onChange={(e)=>setF(s=>({ ...s, quantity: e.target.value }))} />
      </div>
      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        <button className="btn btn-primary" type="submit">Add</button>
        {msg && <span className="muted">{msg}</span>}
      </div>
    </form>
  );
}


