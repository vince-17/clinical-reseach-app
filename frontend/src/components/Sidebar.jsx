import { NavLink } from 'react-router-dom';
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
          <NavLink key={key} to={`/${key}`} className={({ isActive }) => (isActive ? 'active' : '')}>
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}


