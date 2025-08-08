export default function Topbar({ online }) {
  return (
    <div className="navbar">
      <div className="brand">Clinical Research</div>
      <div className="status">{online ? 'Online' : 'Connecting...'}</div>
    </div>
  );
}


