export default function Topbar({ online, auth, setAuth }) {
  async function handleLogin(e) {
    e.preventDefault();
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: auth.email, password: auth.password }),
    });
    if (res.ok) {
      const data = await res.json();
      setAuth((p) => ({ ...p, token: data.token }));
      localStorage.setItem('auth_token', data.token);
    }
  }

  function handleLogout() {
    setAuth({ email: '', password: '', token: '' });
    localStorage.removeItem('auth_token');
  }

  return (
    <div className="navbar">
      <div className="brand">Clinical Research</div>
      <div className="status" style={{ display:'flex', alignItems:'center', gap:12 }}>
        <span>{online ? 'Online' : 'Connecting...'}</span>
        {!auth?.token ? (
          <form onSubmit={handleLogin} style={{ display:'flex', alignItems:'center', gap:8 }}>
            <input placeholder="email" value={auth.email} onChange={(e)=>setAuth({ ...auth, email: e.target.value })} />
            <input placeholder="password" type="password" value={auth.password} onChange={(e)=>setAuth({ ...auth, password: e.target.value })} />
            <button className="btn btn-primary" type="submit">Login</button>
          </form>
        ) : (
          <>
            <span style={{ color:'#16a34a' }}>Logged in</span>
            <button className="btn" onClick={handleLogout}>Logout</button>
          </>
        )}
      </div>
    </div>
  );
}


