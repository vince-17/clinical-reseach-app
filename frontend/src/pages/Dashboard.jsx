export default function Dashboard({ dashboard }) {
  return (
    <div className="grid">
      <div className="kpi-grid">
        <div className="card"><div className="muted">Active Patients</div><div style={{ fontSize:22, fontWeight:700 }}>{dashboard?.patients ?? 0}</div></div>
        <div className="card"><div className="muted">Upcoming Appts</div><div style={{ fontSize:22, fontWeight:700 }}>{dashboard?.upcomingAppointments ?? 0}</div></div>
        <div className="card"><div className="muted">Low Stock Lots</div><div style={{ fontSize:22, fontWeight:700 }}>{dashboard?.lowStockLots ?? 0}</div></div>
        <div className="card"><div className="muted">Expiring Soon</div><div style={{ fontSize:22, fontWeight:700 }}>{dashboard?.expiringSoonLots ?? 0}</div></div>
      </div>
      <div className="card">
        <h2>Agents Status</h2>
        <div className="status-grid">
          {['Scheduling','Inventory','Communication','Quality'].map((name, i)=> (
            <div key={name} className="card">
              <div className="row-between"><strong>{name}</strong><span className="badge">active</span></div>
              <div className="muted" style={{ fontSize:12 }}>Operational</div>
              <div className="progress"><span style={{ width: `${90 + i}%` }}></span></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


