import React, { useState } from 'react';
import { api } from '../api';

export default function BasicInventoryForm({ onAdded }) {
  const [f, setF] = useState({ item_name: '', item_description: '', study_name: '', study_id: '', quantity: 0 });
  const [msg, setMsg] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setMsg('');
    try {
      await api('/api/basic/inventory/new', { method: 'POST', body: f });
      setMsg('Saved');
      setF({ item_name: '', item_description: '', study_name: '', study_id: '', quantity: 0 });
      onAdded && onAdded();
    } catch (e) {
      setMsg(e.message || 'Failed');
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display:'grid', gap:8, maxWidth:420 }}>
      <input placeholder="Item name" value={f.item_name} onChange={(e)=>setF(s=>({ ...s, item_name: e.target.value }))} />
      <input placeholder="Item description (optional)" value={f.item_description} onChange={(e)=>setF(s=>({ ...s, item_description: e.target.value }))} />
      <input placeholder="Study name" value={f.study_name} onChange={(e)=>setF(s=>({ ...s, study_name: e.target.value }))} />
      <input placeholder="Study ID (e.g., PROT-001)" value={f.study_id} onChange={(e)=>setF(s=>({ ...s, study_id: e.target.value }))} />
      <input type="number" min="0" placeholder="Quantity" value={f.quantity} onChange={(e)=>setF(s=>({ ...s, quantity: e.target.value }))} />
      <button type="submit">Add Inventory</button>
      {msg && <div>{msg}</div>}
    </form>
  );
}


