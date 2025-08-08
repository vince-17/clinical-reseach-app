export default function AdminPage({
  auth,
  setAuth,
  newVisitType,
  setNewVisitType,
  visitTypes,
  newResource,
  setNewResource,
  resources,
  onAddVisitType,
  onAddResource,
}) {
  return (
    <>
      {/* Authentication moved to Topbar */}

      <h3>Visit Types</h3>
      <form onSubmit={onAddVisitType}>
        <input placeholder="Name" value={newVisitType.name} onChange={(e) => setNewVisitType({ ...newVisitType, name: e.target.value })} />
        <input type="number" style={{ marginLeft: 8, width: 90 }} placeholder="Offset" value={newVisitType.offsetDays} onChange={(e) => setNewVisitType({ ...newVisitType, offsetDays: Number(e.target.value) })} />
        <input type="number" style={{ marginLeft: 8, width: 90 }} placeholder="Win -" value={newVisitType.windowMinusDays} onChange={(e) => setNewVisitType({ ...newVisitType, windowMinusDays: Number(e.target.value) })} />
        <input type="number" style={{ marginLeft: 8, width: 90 }} placeholder="Win +" value={newVisitType.windowPlusDays} onChange={(e) => setNewVisitType({ ...newVisitType, windowPlusDays: Number(e.target.value) })} />
        <input type="number" style={{ marginLeft: 8, width: 120 }} placeholder="Duration" value={newVisitType.defaultDurationMinutes} onChange={(e) => setNewVisitType({ ...newVisitType, defaultDurationMinutes: Number(e.target.value) })} />
        <button type="submit" style={{ marginLeft: 8 }}>Add</button>
      </form>
      <ul style={{ textAlign: 'left' }}>
        {visitTypes.map((vt) => (
          <li key={vt.id}>{vt.name} — offset {vt.offset_days}d, window [-{vt.window_minus_days}, +{vt.window_plus_days}], default {vt.default_duration_minutes}m</li>
        ))}
      </ul>

      <h3>Resources</h3>
      <form onSubmit={onAddResource}>
        <input placeholder="Resource name" value={newResource.name} onChange={(e) => setNewResource({ ...newResource, name: e.target.value })} />
        <input placeholder="Category" value={newResource.category} onChange={(e) => setNewResource({ ...newResource, category: e.target.value })} style={{ marginLeft: 8 }} />
        <button type="submit" style={{ marginLeft: 8 }}>Add</button>
      </form>
      <ul style={{ textAlign: 'left' }}>
        {resources.map((r) => (
          <li key={r.id}>{r.name} {r.category ? `(${r.category})` : ''}</li>
        ))}
      </ul>

      <div style={{ marginTop: 16 }}>
        <strong>Audit Logs</strong>
        <button onClick={async () => { const res = await fetch('/api/audit-logs'); if (res.ok) { const data = await res.json(); alert(JSON.stringify(data.slice(0, 10), null, 2)); } }} style={{ marginLeft: 8 }}>Preview</button>
      </div>
    </>
  );
}


