import React, { useState } from 'react';
import BasicInventoryForm from '../components/BasicInventoryForm.jsx';
import BasicInventoryTable from '../components/BasicInventoryTable.jsx';

export default function InventoryBasicPage() {
  const [reloadKey, setReloadKey] = useState(0);
  return (
    <div className="container">
      <h2>Basic Inventory</h2>
      <BasicInventoryForm onAdded={() => setReloadKey(k => k + 1)} />
      <div style={{ marginTop: 16 }}>
        <BasicInventoryTable reloadKey={reloadKey} />
      </div>
    </div>
  );
}


