import React, { useState } from 'react';
import BasicInventoryForm from '../components/BasicInventoryForm.jsx';
import BasicInventoryTable from '../components/BasicInventoryTable.jsx';

export default function InventoryBasicPage() {
  const [reloadKey, setReloadKey] = useState(0);
  return (
    <div className="container">
      <h2 style={{ marginBottom: 12 }}>Inventory</h2>
      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Add inventory</h3>
          <p className="muted" style={{ marginTop: -6, marginBottom: 12 }}>Create an item, link a study, set quantity.</p>
          <BasicInventoryForm onAdded={() => setReloadKey(k => k + 1)} />
        </div>
        <div className="card" style={{ overflowX: 'auto' }}>
          <h3 style={{ marginTop: 0 }}>All inventory</h3>
          <BasicInventoryTable reloadKey={reloadKey} />
        </div>
      </div>
    </div>
  );
}


