import { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:4000/api/health')
      .then((res) => res.json())
      .then(setHealth)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Clinical Research App</h1>
        <p>Frontend connected to backend.</p>
        {health && (
          <pre style={{ textAlign: 'left' }}>{JSON.stringify(health, null, 2)}</pre>
        )}
        {error && <p style={{ color: 'salmon' }}>Error: {error}</p>}
      </header>
    </div>
  );
}

export default App;
