export default function Sidebar({ current, onNavigate }) {
  const items = [
    ['dashboard', 'Dashboard'],
    ['patients', 'Patients'],
    ['appointments', 'Scheduling'],
    ['inventory', 'Inventory'],
    ['admin', 'Admin'],
  ];
  return (
    <aside className="sidebar">
      <div className="group">Navigation</div>
      <nav className="nav">
        {items.map(([key, label]) => (
          <a
            key={key}
            href="#"
            className={current === key ? 'active' : ''}
            onClick={(e) => {
              e.preventDefault();
              onNavigate(key);
            }}
          >
            {label}
          </a>
        ))}
      </nav>
    </aside>
  );
}


