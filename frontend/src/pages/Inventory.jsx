export default function InventoryPage({
  items,
  newItem,
  setNewItem,
  addItem,
  lots,
  newLot,
  setNewLot,
  loadLots,
  addLot,
  dispense,
  setDispense,
  doDispense,
  patients,
}) {
  return (
    <>
      <h2>Inventory</h2>

      <form onSubmit={addItem} style={{ marginBottom: 12 }}>
        <input placeholder="Item name" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} />
        <input placeholder="Category" value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} style={{ marginLeft: 8 }} />
        <button type="submit" style={{ marginLeft: 8 }}>Add Item</button>
      </form>
      <div style={{ display: 'flex', gap: 24 }}>
        <div style={{ width: 300, textAlign: 'left' }}>
          <strong>Items</strong>
          <ul>
            {items.map((it) => (
              <li key={it.id}>
                <button onClick={() => loadLots(it.id)} style={{ marginRight: 8 }}>View Lots</button>
                {it.name} {it.category ? `(${it.category})` : ''}
              </li>
            ))}
          </ul>
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <strong>Lots</strong>
          <form onSubmit={addLot} style={{ marginBottom: 12 }}>
            <select value={newLot.itemId} onChange={(e) => loadLots(e.target.value)}>
              <option value="">Select item</option>
              {items.map((it) => (
                <option key={it.id} value={it.id}>{it.name}</option>
              ))}
            </select>
            <input placeholder="Lot code" value={newLot.lotCode} onChange={(e) => setNewLot({ ...newLot, lotCode: e.target.value })} style={{ marginLeft: 8 }} />
            <input type="number" min="1" value={newLot.quantity} onChange={(e) => setNewLot({ ...newLot, quantity: e.target.value })} style={{ marginLeft: 8, width: 80 }} />
            <input type="date" value={newLot.expiresOn} onChange={(e) => setNewLot({ ...newLot, expiresOn: e.target.value })} style={{ marginLeft: 8 }} />
            <button type="submit" style={{ marginLeft: 8 }}>Add Lot</button>
          </form>
          <ul>
            {lots.map((lot) => (
              <li key={lot.id}>
                {lot.lot_code || 'N/A'} — Qty: {lot.quantity} — Expires: {lot.expires_on || 'N/A'}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <h3>Dispense</h3>
      <form onSubmit={doDispense}>
        <select value={dispense.patientId} onChange={(e) => setDispense({ ...dispense, patientId: e.target.value })}>
          <option value="">Select patient</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
          ))}
        </select>
        <select value={dispense.itemId} onChange={(e) => { setDispense({ ...dispense, itemId: e.target.value, lotId: '' }); loadLots(e.target.value); }} style={{ marginLeft: 8 }}>
          <option value="">Select item</option>
          {items.map((it) => (
            <option key={it.id} value={it.id}>{it.name}</option>
          ))}
        </select>
        <select value={dispense.lotId} onChange={(e) => setDispense({ ...dispense, lotId: e.target.value })} style={{ marginLeft: 8 }}>
          <option value="">Select lot</option>
          {lots.map((l) => (
            <option key={l.id} value={l.id}>{l.lot_code || 'N/A'} (Qty {l.quantity})</option>
          ))}
        </select>
        <input type="number" min="1" value={dispense.quantity} onChange={(e) => setDispense({ ...dispense, quantity: e.target.value })} style={{ marginLeft: 8, width: 80 }} />
        <button type="submit" style={{ marginLeft: 8 }}>Dispense</button>
      </form>

      <div style={{ marginTop: 16 }}>
        <a className="btn btn-primary" href="/api/inventory/report.csv" target="_blank" rel="noreferrer">Download Inventory CSV</a>
      </div>
    </>
  );
}


