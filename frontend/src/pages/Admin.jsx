export default function AdminPage({
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
    </>
  );
}


